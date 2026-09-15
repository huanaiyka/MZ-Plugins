// Copyright (c) 2022 DarkPlasma
// Copyright (c) 2026 幻愛
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/*:
@target MZ
@plugindesc 存档数据文件导入/导出功能，适用于电脑与安卓存档互通
@author 幻愛
* @url https://github.com/huanaiyka/MZ-Plugins
@license MIT

@help
修改版：使用 HTML5 原生 <dialog> 弹窗，导入改为文件选择方式，导出数据经 LZString 离线压缩。
UI 已重新设计，配色统一、按钮顺序符合移动端操作习惯。

- 导入：通过 <input type="file"> 选择 txt 存档文件，使用 FileReader 读取内容。
- 导出：显示压缩后的存档代码，支持一键复制与保存为 txt 文件。
- 内置 LZString 压缩算法，无需联网即可缩减导出数据体积（约 60%-80%）。
- 修复安卓移动端下弹窗尺寸塌陷、只显示一小块或被遮挡的问题。
- 包含鼠标/触控防穿透保护锁。
- 固定导入/导出到 1 号存档位（与界面文案一致）。
- 导入成功后自动刷新存档列表 UI。

@param importButtonText
@text 导入选项文字
@type string
@default 导入存档

@param exportButtonText
@text 导出选项文字
@type string
@default 导出存档

@param exportHelpText
@text 导出说明文本
@type string
@default 已读取1号存档数据，若跨平台转移存档，建议点击“保存为文件”：

@param importHelpText
@text 导入说明文本
@type string
@default 请选择之前导出的存档文件（.txt），覆盖1号存档：

@param compressionEnabled
@text 启用压缩
@type boolean
@default true
@desc 是否对导出/导入数据进行压缩。开启后数据体积更小，完全离线运行。

@param exportFileName
@text 导出文件名
@type string
@default 存档
@desc 导出文件的基础名称，实际文件名会附加时间戳，例如：存档_1699999999999.txt
*/

(() => {
  'use strict';

  const pluginName = document.currentScript.src.replace(/^.*\/(.*).js$/, function () {
    return arguments[1];
  });

  const pluginParameters = PluginManager.parameters(pluginName);

  // 固定使用的存档位（与界面文案保持一致）
  const SAVEFILE_ID = 1;

  const settings = {
    exportHelpText: String(pluginParameters.exportHelpText || `已读取1号存档数据，请点击“一键复制”或“保存为文件”：`),
    importHelpText: String(pluginParameters.importHelpText || `请粘贴文本，或选择之前导出的存档文件（.txt），覆盖1号存档：`),
    importButtonText: String(pluginParameters.importButtonText || '导入存档'),
    exportButtonText: String(pluginParameters.exportButtonText || '导出存档'),
    compressionEnabled: String(pluginParameters.compressionEnabled || 'true') === 'true',
    exportFileName: String(pluginParameters.exportFileName || '存档'),
  };

  // ========== 内置 LZString 压缩库（离线，无需网络） ==========
  const LZString = (function () {
    const f = String.fromCharCode;
    const keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const keyStrUriSafe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
    const baseReverseDic = {};

    function getBaseValue(alphabet, character) {
      if (!baseReverseDic[alphabet]) {
        baseReverseDic[alphabet] = {};
        for (let i = 0; i < alphabet.length; i++) {
          baseReverseDic[alphabet][alphabet.charAt(i)] = i;
        }
      }
      return baseReverseDic[alphabet][character];
    }

    const LZString = {
      compressToBase64: function (input) {
        if (input == null) return '';
        const res = LZString._compress(input, 6, function (a) {
          return keyStrBase64.charAt(a);
        });
        switch (res.length % 4) {
          default:
          case 0:
            return res;
          case 1:
            return res + '===';
          case 2:
            return res + '==';
          case 3:
            return res + '=';
        }
      },

      decompressFromBase64: function (input) {
        if (input == null) return '';
        if (input === '') return null;
        return LZString._decompress(input.length, 32, function (index) {
          return getBaseValue(keyStrBase64, input.charAt(index));
        });
      },

      compressToUTF16: function (input) {
        if (input == null) return '';
        return (
          LZString._compress(input, 15, function (a) {
            return f(a + 32);
          }) + ' '
        );
      },

      decompressFromUTF16: function (compressed) {
        if (compressed == null) return '';
        if (compressed === '') return null;
        return LZString._decompress(compressed.length, 16384, function (index) {
          return compressed.charCodeAt(index) - 32;
        });
      },

      compressToUint8Array: function (uncompressed) {
        const compressed = LZString.compress(uncompressed);
        const buf = new Uint8Array(compressed.length * 2);
        for (let i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
          const current_value = compressed.charCodeAt(i);
          buf[i * 2] = current_value >>> 8;
          buf[i * 2 + 1] = current_value % 256;
        }
        return buf;
      },

      decompressFromUint8Array: function (compressed) {
        if (compressed === null || compressed === undefined) {
          return LZString.decompress(compressed);
        } else {
          const buf = new Array(compressed.length / 2);
          for (let i = 0, TotalLen = buf.length; i < TotalLen; i++) {
            buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
          }
          const result = [];
          buf.forEach(function (c) {
            result.push(f(c));
          });
          return LZString.decompress(result.join(''));
        }
      },

      compressToEncodedURIComponent: function (input) {
        if (input == null) return '';
        return LZString._compress(input, 6, function (a) {
          return keyStrUriSafe.charAt(a);
        });
      },

      decompressFromEncodedURIComponent: function (input) {
        if (input == null) return '';
        if (input === '') return null;
        input = input.replace(/ /g, '+');
        return LZString._decompress(input.length, 32, function (index) {
          return getBaseValue(keyStrUriSafe, input.charAt(index));
        });
      },

      compress: function (uncompressed) {
        return LZString._compress(uncompressed, 16, function (a) {
          return f(a);
        });
      },

      _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
        if (uncompressed == null) return '';
        let i,
          value,
          context_dictionary = {},
          context_dictionaryToCreate = {},
          context_c = '',
          context_wc = '',
          context_w = '',
          context_enlargeIn = 2,
          context_dictSize = 3,
          context_numBits = 2,
          context_data = [],
          context_data_val = 0,
          context_data_position = 0,
          ii;

        for (ii = 0; ii < uncompressed.length; ii += 1) {
          context_c = uncompressed.charAt(ii);
          if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
            context_dictionary[context_c] = context_dictSize++;
            context_dictionaryToCreate[context_c] = true;
          }

          context_wc = context_w + context_c;
          if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
            context_w = context_wc;
          } else {
            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
              if (context_w.charCodeAt(0) < 256) {
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 8; i++) {
                  context_data_val = (context_data_val << 1) | (value & 1);
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              } else {
                value = 1;
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = (context_data_val << 1) | value;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = 0;
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 16; i++) {
                  context_data_val = (context_data_val << 1) | (value & 1);
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              delete context_dictionaryToCreate[context_w];
            } else {
              value = context_dictionary[context_w];
              for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            context_dictionary[context_wc] = context_dictSize++;
            context_w = String(context_c);
          }
        }

        if (context_w !== '') {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
            if (context_w.charCodeAt(0) < 256) {
              for (i = 0; i < context_numBits; i++) {
                context_data_val = context_data_val << 1;
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
              }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 8; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            } else {
              value = 1;
              for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1) | value;
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = 0;
              }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 16; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
        }

        value = 2;
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | (value & 1);
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }

        while (true) {
          context_data_val = context_data_val << 1;
          if (context_data_position == bitsPerChar - 1) {
            context_data.push(getCharFromInt(context_data_val));
            break;
          } else {
            context_data_position++;
          }
        }
        return context_data.join('');
      },

      decompress: function (compressed) {
        if (compressed == null) return '';
        if (compressed == '') return null;
        return LZString._decompress(compressed.length, 32768, function (index) {
          return compressed.charCodeAt(index);
        });
      },

      _decompress: function (length, resetValue, getNextValue) {
        const dictionary = [];
        let next,
          enlargeIn = 4,
          dictSize = 4,
          numBits = 3,
          entry = '',
          result = [],
          i,
          w,
          bits,
          resb,
          maxpower,
          power,
          c,
          data = { val: getNextValue(0), position: resetValue, index: 1 };

        for (i = 0; i < 3; i += 1) {
          dictionary[i] = i;
        }

        bits = 0;
        maxpower = Math.pow(2, 2);
        power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }

        switch (bits) {
          case 0:
            bits = 0;
            maxpower = Math.pow(2, 8);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            c = f(bits);
            break;
          case 1:
            bits = 0;
            maxpower = Math.pow(2, 16);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            c = f(bits);
            break;
          case 2:
            return '';
        }
        dictionary[3] = c;
        w = c;
        result.push(c);
        while (true) {
          if (data.index > length) {
            return '';
          }

          bits = 0;
          maxpower = Math.pow(2, numBits);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }

          switch ((c = bits)) {
            case 0:
              bits = 0;
              maxpower = Math.pow(2, 8);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }

              dictionary[dictSize++] = f(bits);
              c = dictSize - 1;
              enlargeIn--;
              break;
            case 1:
              bits = 0;
              maxpower = Math.pow(2, 16);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              dictionary[dictSize++] = f(bits);
              c = dictSize - 1;
              enlargeIn--;
              break;
            case 2:
              return result.join('');
          }

          if (enlargeIn == 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
          }

          if (dictionary[c]) {
            entry = dictionary[c];
          } else {
            if (c === dictSize) {
              entry = w + w.charAt(0);
            } else {
              return null;
            }
          }
          result.push(entry);

          dictionary[dictSize++] = w + entry.charAt(0);
          enlargeIn--;

          w = entry;

          if (enlargeIn == 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
          }
        }
      },
    };
    return LZString;
  })();

  // ========== 压缩/解压封装 ==========
  async function compressEncode(text) {
    if (settings.compressionEnabled) {
      return LZString.compressToBase64(text);
    }
    return btoa(encodeURIComponent(text));
  }

  async function compressDecode(text) {
    if (settings.compressionEnabled) {
      try {
        const decompressed = LZString.decompressFromBase64(text);
        if (decompressed !== null && decompressed !== undefined && decompressed !== '') {
          return decompressed;
        }
      } catch (e) {
        // 回退到普通 Base64
      }
    }
    return decodeURIComponent(atob(text));
  }

  // ========== 弹窗实现 ==========
  let _justClosedFlag = false;

  function Graphics_ImportExportModalMixIn(graphics) {
    const _createAllElements = graphics._createAllElements;
    graphics._createAllElements = function () {
      _createAllElements.call(this);
      this._createNativeDialogModal();
    };

    graphics._createNativeDialogModal = function () {
      this._customDialog = document.createElement('dialog');
      this._customDialog.id = 'rmmz-import-export-dialog';

      // ---- 弹窗整体样式（深灰渐变 + 圆角 + 阴影） ----
      this._customDialog.style.cssText = `
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        margin: 0 !important;
        border: 1px solid #313244;
        border-radius: 12px;
        background: linear-gradient(160deg, #1e1e2e 0%, #181825 100%);
        color: #cdd6f4;
        padding: 18px;
        width: 88vw !important;
        max-width: 480px !important;
        max-height: 85vh !important;
        box-shadow: 0 12px 40px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset;
        box-sizing: border-box !important;
        z-index: 999999 !important;
        display: none;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      `;

      // ---- 弹窗内部结构 ----
      this._customDialog.innerHTML = `
        <div id="dlg-focus-trap" tabindex="0" style="position:absolute; width:0; height:0; opacity:0; pointer-events:none; outline:none;"></div>

        <!-- 标题 -->
        <div id="dlg-title" style="
          margin-bottom: 12px;
          font-size: 13px;
          line-height: 1.6;
          color: #cdd6f4;
          word-break: break-all;
          flex-shrink: 0;
        "></div>

        <!-- 文本框 -->
        <textarea id="dlg-textarea" style="
          width: 100%;
          height: 160px;
          min-height: 120px;
          background: #11111b;
          color: #a6e3a1;
          border: 1px solid #313244;
          border-radius: 8px;
          padding: 10px;
          box-sizing: border-box;
          font-size: 12px;
          font-family: "SF Mono", Consolas, Monaco, monospace;
          line-height: 1.5;
          resize: vertical;
          margin-bottom: 14px;
          outline: none;
          transition: border-color 0.15s;
          -webkit-user-select: text;
          user-select: text;
        " readonly></textarea>

        <!-- 按钮行：左对齐取消，右对齐主操作 -->
        <div style="
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          flex-wrap: wrap;
        ">
          <button id="dlg-cancel-btn" style="
            display: none;
            padding: 9px 16px;
            background: #45475a;
            color: #cdd6f4;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s, transform 0.1s;
          ">取消</button>

          <button id="dlg-copy-btn" style="
            display: none;
            padding: 9px 16px;
            background: #10b981;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s, transform 0.1s;
          ">一键复制</button>

          <button id="dlg-save-btn" style="
            display: none;
            padding: 9px 16px;
            background: #8b5cf6;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s, transform 0.1s;
          ">保存为文件</button>

          <button id="dlg-file-btn" style="
            display: none;
            padding: 9px 16px;
            background: #8b5cf6;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s, transform 0.1s;
          ">选择存档文件</button>

          <button id="dlg-ok-btn" style="
            display: none;
            padding: 9px 20px;
            background: #2563eb;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s, transform 0.1s;
          ">确定</button>
        </div>
      `;

      document.body.appendChild(this._customDialog);

      // ---- 阻止事件穿透 ----
      const preventBubble = (e) => {
        e.stopPropagation();
      };
      this._customDialog.addEventListener('mousedown', preventBubble);
      this._customDialog.addEventListener('mouseup', preventBubble);
      this._customDialog.addEventListener('click', preventBubble);
      this._customDialog.addEventListener('pointerdown', preventBubble);
      this._customDialog.addEventListener('pointerup', preventBubble);
      this._customDialog.addEventListener('touchstart', preventBubble);
      this._customDialog.addEventListener('touchend', preventBubble);

      this._dlgFocusTrap = this._customDialog.querySelector('#dlg-focus-trap');
      this._dlgTitle = this._customDialog.querySelector('#dlg-title');
      this._dlgTextarea = this._customDialog.querySelector('#dlg-textarea');
      this._dlgCopyBtn = this._customDialog.querySelector('#dlg-copy-btn');
      this._dlgSaveBtn = this._customDialog.querySelector('#dlg-save-btn');
      this._dlgFileBtn = this._customDialog.querySelector('#dlg-file-btn');
      this._dlgCancelBtn = this._customDialog.querySelector('#dlg-cancel-btn');
      this._dlgOkBtn = this._customDialog.querySelector('#dlg-ok-btn');

      // ---- 按钮按下效果（统一处理） ----
      const allBtns = [this._dlgCopyBtn, this._dlgSaveBtn, this._dlgFileBtn, this._dlgCancelBtn, this._dlgOkBtn];
      allBtns.forEach((btn) => {
        btn.addEventListener('pointerdown', () => {
          btn.style.transform = 'scale(0.96)';
          btn.style.opacity = '0.9';
        });
        btn.addEventListener('pointerup', () => {
          btn.style.transform = 'scale(1)';
          btn.style.opacity = '1';
        });
        btn.addEventListener('pointerleave', () => {
          btn.style.transform = 'scale(1)';
          btn.style.opacity = '1';
        });
      });

      // ---- 一键复制 ----
      this._dlgCopyBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const textToCopy = this._dlgTextarea.value;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(textToCopy);
            alert('已复制到剪贴板！');
            return;
          } catch (err) {}
        }
        this._dlgTextarea.select();
        try {
          document.execCommand('copy');
          alert('已复制到剪贴板！');
        } catch (err) {
          alert('复制失败，请直接手动长按多行框全选复制');
        }
      };

      // ---- 保存为文件 ----
      this._dlgSaveBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const textToSave = this._dlgTextarea.value;
        try {
          const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${settings.exportFileName}_${Date.now()}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          alert('已保存为文件！');
        } catch (err) {
          console.error(err);
          alert('保存失败，请尝试使用“一键复制”方式。');
        }
      };

      // ---- 选择存档文件 ----
      this._dlgFileBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,text/plain';
        fileInput.style.cssText = 'position:fixed; top:-9999px; left:-9999px; opacity:0;';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', (ev) => {
          const file = ev.target.files && ev.target.files[0];
          document.body.removeChild(fileInput);

          if (!file) return;

          const reader = new FileReader();
          reader.onload = (loadEv) => {
            const text = loadEv.target.result;
            if (text && text.trim() !== '') {
              this._dlgTextarea.value = text;
              alert('文件读取成功！点击“确定导入”完成导入。');
            } else {
              alert('文件内容为空，请检查是否选择了正确的存档文件。');
            }
          };
          reader.onerror = () => {
            alert('读取文件失败。请尝试：\n1. 将文件移动到手机本地存储（如“下载”目录）；\n2. 不要从云盘或网盘直接选择；\n3. 重新选择一次文件。');
          };
          reader.readAsText(file, 'UTF-8');
        });

        fileInput.click();
      };

      // ---- 取消 ----
      this._dlgCancelBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const handler = this._onModalCancelHandler;
        this.hideModal();
        if (handler) handler();
      };

      // ---- 确定 ----
      this._dlgOkBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const val = this._dlgTextarea.value;
        const handler = this._onModalOkHandler;
        this.hideModal();
        if (handler) handler(val);
      };
    };

    graphics.isModalOpen = function () {
      return this._customDialog && (this._customDialog.open || this._customDialog.hasAttribute('open'));
    };

    graphics.showExportModal = function (dataText, onOk) {
      if (this.isModalOpen() || _justClosedFlag) return;

      this._dlgTitle.innerText = settings.exportHelpText;
      this._dlgTextarea.value = dataText;
      this._dlgTextarea.setAttribute('readonly', 'readonly');

      // 导出：复制 + 保存为文件 + 关闭
      this._dlgCopyBtn.style.display = 'inline-block';
      this._dlgSaveBtn.style.display = 'inline-block';
      this._dlgFileBtn.style.display = 'none';
      this._dlgCancelBtn.style.display = 'none';
      this._dlgOkBtn.style.display = 'inline-block';
      this._dlgOkBtn.innerText = '关闭';

      this._onModalOkHandler = onOk;
      this._onModalCancelHandler = onOk;

      this._customDialog.style.display = 'flex';
      if (this._customDialog.showModal) {
        this._customDialog.showModal();
      } else {
        this._customDialog.setAttribute('open', '');
      }

      if (this._dlgFocusTrap) {
        this._dlgFocusTrap.focus();
      }

      setTimeout(() => {
        this._dlgTextarea.scrollTop = 0;
      }, 50);
    };

    graphics.showImportModal = function (onOk, onCancel) {
      if (this.isModalOpen() || _justClosedFlag) return;

      this._dlgTitle.innerText = settings.importHelpText;
      this._dlgTextarea.value = '';
      this._dlgTextarea.setAttribute('readonly', 'readonly');

      // 导入：取消 + 选择存档文件 + 确定导入
      this._dlgCopyBtn.style.display = 'none';
      this._dlgSaveBtn.style.display = 'none';
      this._dlgFileBtn.style.display = 'inline-block';
      this._dlgCancelBtn.style.display = 'inline-block';
      this._dlgOkBtn.style.display = 'inline-block';
      this._dlgOkBtn.innerText = '确定导入';

      this._onModalOkHandler = onOk;
      this._onModalCancelHandler = onCancel;

      this._customDialog.style.display = 'flex';
      if (this._customDialog.showModal) {
        this._customDialog.showModal();
      } else {
        this._customDialog.setAttribute('open', '');
      }

      if (this._dlgFocusTrap) {
        this._dlgFocusTrap.focus();
      }
    };

    graphics.hideModal = function () {
      _justClosedFlag = true;
      setTimeout(() => {
        _justClosedFlag = false;
      }, 300);

      if (this._customDialog) {
        this._customDialog.style.display = 'none';
        if (this._customDialog.close) {
          this._customDialog.close();
        } else {
          this._customDialog.removeAttribute('open');
        }
      }

      if (document.activeElement) {
        document.activeElement.blur();
      }

      this._onModalOkHandler = null;
      this._onModalCancelHandler = null;
    };
  }
  Graphics_ImportExportModalMixIn(Graphics);

  // ========== DataManager 数据处理（使用压缩） ==========
  function DataManager_ImportExportSaveFileMixIn(dataManager) {
    dataManager.loadCompressedGamedata = async function (savefileId) {
      return StorageManager.loadObject(this.makeSavename(savefileId)).then((content) => {
        return StorageManager.objectToJson({
          data: content,
          info: this._globalInfo ? this._globalInfo[savefileId] : null,
        }).then((json) => compressEncode(json));
      });
    };

    dataManager.saveCompressedGamedata = async function (savefileId, encoded) {
      return compressDecode(encoded)
        .then((json) => StorageManager.jsonToObject(json))
        .then(async (obj) => {
          return StorageManager.saveObject(this.makeSavename(savefileId), obj.data).then(() => {
            if (obj.info) {
              if (!this._globalInfo) this._globalInfo = {};
              this._globalInfo[savefileId] = obj.info;
              this.saveGlobalInfo();
            }
            return 0;
          });
        });
    };

    // 刷新存档列表 UI（如果当前场景支持）
    dataManager.refreshSavefileListIfPossible = function () {
      try {
        const scene = SceneManager._scene;
        if (scene && typeof scene.refreshSavefileList === 'function') {
          scene.refreshSavefileList();
        }
        // 读档场景常见方法名
        if (scene && typeof scene.reloadSavefileInfo === 'function') {
          scene.reloadSavefileInfo();
        }
        // 存档场景常见方法名
        if (scene && typeof scene.reloadSavefileInfo === 'function') {
          scene.reloadSavefileInfo();
        }
      } catch (e) {
        console.warn('refreshSavefileListIfPossible failed:', e);
      }
    };
  }
  DataManager_ImportExportSaveFileMixIn(DataManager);

  // ========== 扩展 Window_Options ==========
  const _Window_Options_makeCommandList = Window_Options.prototype.makeCommandList;
  Window_Options.prototype.makeCommandList = function () {
    this.addCommand(settings.exportButtonText, 'exportSave', true);
    this.addCommand(settings.importButtonText, 'importSave', true);
    _Window_Options_makeCommandList.call(this);
  };

  const _Window_Options_drawItem = Window_Options.prototype.drawItem;
  Window_Options.prototype.drawItem = function (index) {
    const symbol = this.commandSymbol(index);
    if (symbol === 'exportSave' || symbol === 'importSave') {
      const rect = this.itemLineRect(index);
      this.resetTextColor();
      this.changePaintOpacity(this.isCommandEnabled(index));
      this.drawText(this.commandName(index), rect.x, rect.y, rect.width, 'left');
    } else {
      _Window_Options_drawItem.call(this, index);
    }
  };

  const _Window_Options_processOk = Window_Options.prototype.processOk;
  Window_Options.prototype.processOk = function () {
    if (Graphics.isModalOpen() || _justClosedFlag) return;

    const symbol = this.commandSymbol(this.index());
    if (symbol === 'exportSave' || symbol === 'importSave') {
      this.playOkSound();
      if (this.isHandled(symbol)) {
        this.callHandler(symbol);
      }
    } else {
      _Window_Options_processOk.call(this);
    }
  };

  // ========== 扩展 Scene_Options 交互 ==========
  Scene_Options.prototype.createOptionsWindow = function () {
    const rect = this.optionsWindowRect();
    this._optionsWindow = new Window_Options(rect);
    this._optionsWindow.setHandler('cancel', this.popScene.bind(this));
    this._optionsWindow.setHandler('exportSave', this.onExportClicked.bind(this));
    this._optionsWindow.setHandler('importSave', this.onImportClicked.bind(this));
    this.addWindow(this._optionsWindow);
  };

  Scene_Options.prototype.activateOptionsWindowWithDelay = function () {
    setTimeout(() => {
      if (this._optionsWindow) {
        TouchInput.clear();
        Input.clear();
        this._optionsWindow.activate();
      }
    }, 200);
  };

  Scene_Options.prototype.onExportClicked = function () {
    if (Graphics.isModalOpen() || _justClosedFlag) return;
    this._optionsWindow.deactivate();
    const savefileId = SAVEFILE_ID; // 固定 1 号位

    DataManager.loadCompressedGamedata(savefileId)
      .then((base64) => {
        Graphics.showExportModal(base64, () => {
          this.activateOptionsWindowWithDelay();
          SoundManager.playOk();
        });
      })
      .catch((reason) => {
        SoundManager.playBuzzer();
        this.activateOptionsWindowWithDelay();
        console.error(reason);
      });
  };

  Scene_Options.prototype.onImportClicked = function () {
    if (Graphics.isModalOpen() || _justClosedFlag) return;
    this._optionsWindow.deactivate();
    const savefileId = SAVEFILE_ID; // 固定 1 号位

    Graphics.showImportModal(
      (textValue) => {
        if (!textValue || textValue.trim() === '') {
          SoundManager.playBuzzer();
          this.activateOptionsWindowWithDelay();
          return;
        }
        DataManager.saveCompressedGamedata(savefileId, textValue)
          .then(() => {
            // 导入成功后刷新存档列表 UI
            DataManager.refreshSavefileListIfPossible();
            SoundManager.playSave();
            this.activateOptionsWindowWithDelay();
          })
          .catch(() => {
            SoundManager.playBuzzer();
            this.activateOptionsWindowWithDelay();
          });
      },
      () => {
        this.activateOptionsWindowWithDelay();
      }
    );
  };
})();