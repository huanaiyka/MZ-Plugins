// Huanaiyka_EquipDetail.js
// Copyright (c) 2024 DarkPlasma
// Copyright (c) 2026 幻爱
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/*:
 * @plugindesc 装备详细说明窗口与防具信息转义码 
 * @author 幻爱（原作者：DarkPlasma）
 * @license MIT
 *
 * @target MZ
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @base DarkPlasma_CustomKeyHandler
 * @base DarkPlasma_DisplayDatabaseDetailWindow
 * @orderAfter DarkPlasma_CustomKeyHandler
 * @orderAfter DarkPlasma_DisplayDatabaseDetailWindow
 *
 * @param openDetailKey
 * @desc 设置打开详细说明的按键。
 * @text 详细说明按键
 * @type select
 * @option pageup
 * @option pagedown
 * @option shift
 * @option control
 * @option tab
 * @default shift
 *
 * @param enablePreset
 * @desc 是否启用预设详细说明功能。
 * @text 启用预设功能
 * @type boolean
 * @default true
 *
 * @param presetDetails
 * @desc 预设详细说明列表。设置ID和文本。ID可以是数字或任意文字（例如 "sword_common" 或 "普通装备"）。
 * @text 预设详细列表
 * @type struct<PresetDetail>[]
 * @default []
 *
 * @param detailOpenVarId
 * @desc 每次按下打开详情键时，将当前装备的ID存入此变量ID（在获取详情文本之前）。设为0则不存储。
 * @text 存储装备ID的变量ID
 * @type variable
 * @default 1
 *
 * @param autoWordWrap
 * @desc 是否自动换行长文本（如果开启，超出窗口宽度的文字会自动折行）。
 * @text 自动换行
 * @type boolean
 * @default true
 *
 * @param armorVarId
 * @text 防具变量ID
 * @desc 储存目标防具ID的游戏变量编号，默认值为1。
 * @type variable
 * @default 1
 *
 * @param skillEntryFormat
 * @text 技能条目格式
 * @desc 用于 \skill_entryN 的输出模板。%name=技能名，%desc=技能描述。支持\C[]等颜色控制符。
 * @default \C[1]%name\C[0]：%desc
 *
 * @param showDetailButton
 * @desc 是否显示装备详情按钮（与 Shift 键功能相同）。关闭后按钮不显示。
 * @text 显示详情按钮
 * @type boolean
 * @default true
 *
 * @param detailButtonText
 * @desc 详情按钮上显示的文字。
 * @text 详情按钮文字
 * @type string
 * @default 详
 *
 * @param detailButtonSize
 * @desc 详情按钮的大小（像素）。
 * @text 详情按钮大小
 * @type number
 * @min 24
 * @max 128
 * @default 48
 *
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 1. 装备详情窗口：在装备场景按指定按键（默认 Shift）显示装备的详细说明。
 *    支持 <detail:文本>、<presetDetail:ID>、<detailButton开关号:文本> 标签。
 * 2. 防具信息转义码：通过变量存储防具ID，在任意文本中使用 \armor_name、\skill_entryN 等动态显示信息。
 * 3. 详情按钮：在装备场景右下角显示一个「详」按钮，点击效果与 Shift 键相同。
 * 4. 文本超出自动翻页：当详情文本超出窗口高度时，会自动在右上角与右下角显示
 *    “▲” 与 “▼” 按钮，点击即可向上/下滑动文本。
 * ============================================================================
 */

/*~struct~PresetDetail:
 * @param id
 * @desc 预设ID
 * @text ID
 * @type string
 * @default 
 *
 * @param text
 * @desc 显示的详细文本。
 * @text 文本
 * @type note
 * @default 
 */

(() => {
  'use strict';

  const pluginName = (() => {
    const match = document.currentScript.src.match(/^.*\/(.*).js$/);
    return match ? match[1] : '';
  })();

  const pluginParameters = PluginManager.parameters(pluginName);

  // ==========================================================================
  // 参数
  // ==========================================================================
  const openDetailKey = String(pluginParameters.openDetailKey || 'shift');
  const enablePreset = pluginParameters.enablePreset === 'true';
  const detailOpenVarId = parseInt(pluginParameters.detailOpenVarId || '0', 10);
  const autoWordWrap = pluginParameters.autoWordWrap !== 'false';
  const showDetailButton = pluginParameters.showDetailButton !== 'false';
  const detailButtonText = String(pluginParameters.detailButtonText || '详');
  const detailButtonSize = Math.max(24, Math.min(128,
    parseInt(pluginParameters.detailButtonSize || '48', 10)));

  const armorVarId = Number(pluginParameters['armorVarId'] || 1);
  const skillEntryFormat = pluginParameters['skillEntryFormat'] ||
    "\\C[1]%name\\C[0]：%desc";

  function normalizeControlChars(str) {
    if (!str) return '';
    return str.replace(/\\c/gi, (match) => {
      return match === '\\c' ? '\x1bc' : '\x1bC';
    });
  }
  const formattedTemplate = normalizeControlChars(skillEntryFormat);

  // ==========================================================================
  // 预设解析
  // ==========================================================================
  function stripQuotes(str) {
    if (!str) return str;
    let trimmed = str.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith('\\"') && trimmed.endsWith('\\"'))) {
      trimmed = trimmed.slice(trimmed.startsWith('\\"') ? 2 : 1,
                              trimmed.endsWith('\\"') ? -2 : -1);
    }
    return trimmed.replace(/\\"/g, '"');
  }

  const presetDetails = (() => {
    if (!enablePreset) return new Map();
    const raw = pluginParameters.presetDetails;
    if (!raw) return new Map();
    let list;
    try { list = JSON.parse(raw); } catch (e) { return new Map(); }
    if (!Array.isArray(list)) return new Map();
    const map = new Map();
    for (let item of list) {
      if (typeof item === 'string') {
        try { item = JSON.parse(item); } catch (e) { continue; }
      }
      if (item && typeof item === 'object') {
        let id = String(item.id || '').trim();
        let text = item.text || '';
        if (typeof text === 'string') {
          text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"');
          text = stripQuotes(text);
        }
        if (id && text) map.set(id, text);
      }
    }
    return map;
  })();

  function extractTagText(note, tagName) {
    const regex = new RegExp(`<${tagName}:([\\s\\S]*?)>`, 'i');
    const match = note.match(regex);
    return match ? match[1].trim() : null;
  }

  function extractPresetIdWithSwitch(note) {
    const regex = /<presetDetail:([^:>]+)(?::(\d+))?>/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(note)) !== null) {
      matches.push({
        id: match[1].trim(),
        switchId: match[2] ? parseInt(match[2], 10) : null
      });
    }
    for (let i = matches.length - 1; i >= 0; i--) {
      const { id, switchId } = matches[i];
      if (switchId !== null) {
        if ($gameSwitches.value(switchId)) return id;
      } else {
        return id;
      }
    }
    return null;
  }

  function extractSwitchDetailText(note) {
    const regex = /<detailButton(\d+):([\s\S]*?)>/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(note)) !== null) {
      matches.push({ switchId: parseInt(match[1], 10), text: match[2].trim() });
    }
    for (let i = matches.length - 1; i >= 0; i--) {
      const { switchId, text } = matches[i];
      if ($gameSwitches.value(switchId)) return text;
    }
    return null;
  }

  function getEnhancedEquipDetail(equip) {
    if (!equip) return '';
    const note = equip.note || '';
    if (enablePreset) {
      const presetId = extractPresetIdWithSwitch(note);
      if (presetId && presetDetails.has(presetId)) {
        return presetDetails.get(presetId);
      }
    }
    const switchText = extractSwitchDetailText(note);
    if (switchText !== null) return switchText;
    const defaultDetail = extractTagText(note, 'detail');
    if (defaultDetail !== null) return defaultDetail;
    return '';
  }

  // ==========================================================================
  // 防具转义码
  // ==========================================================================
  function getSkillInfoList(armorId, fallbackNone) {
    const armor = $dataArmors[armorId];
    if (!armor) return [];
    const result = [];

    for (const trait of armor.traits) {
      if (trait.code === 43) {
        const skill = $dataSkills[trait.dataId];
        if (skill) {
          result.push({
            name: skill.name.trim(),
            description: skill.description.trim()
          });
        }
      }
    }

    const note = armor.note;
    if (note && typeof note === 'string') {
      const regex = /<switchSkill:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*>/gi;
      let match;
      while ((match = regex.exec(note)) !== null) {
        const switchId = parseInt(match[1], 10);
        const skillOff = parseInt(match[2], 10);
        const skillOn = parseInt(match[3], 10);
        const isOn = $gameSwitches ? $gameSwitches.value(switchId) : false;
        const skill = $dataSkills[isOn ? skillOn : skillOff];
        if (skill) {
          result.push({
            name: skill.name.trim(),
            description: skill.description.trim()
          });
        } else if (fallbackNone) {
          result.push({ name: '无', description: '' });
        }
      }
    }
    return result;
  }

  function getArmorName(armorId) {
    const armor = $dataArmors[armorId];
    return armor ? armor.name : '无';
  }

  function getArmorEquipTypeName(armorId) {
    const armor = $dataArmors[armorId];
    if (!armor) return '无';
    const typeName = $dataSystem.equipTypes[armor.etypeId];
    return typeName || '无';
  }

  function getArmorArmorTypeName(armorId) {
    const armor = $dataArmors[armorId];
    if (!armor) return '无';
    const typeName = $dataSystem.armorTypes[armor.atypeId];
    return typeName || '无';
  }

  function formatSkillEntry(template, name, desc) {
    if (!template) return '';
    return template.replace(/%name/g, name).replace(/%desc/g, desc);
  }

  const _WindowBase_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
  Window_Base.prototype.convertEscapeCharacters = function(text) {
    let result = _WindowBase_convertEscapeCharacters.call(this, text);

    let armorId = $gameVariables.value(armorVarId);
    if (typeof armorId !== 'number' || isNaN(armorId)) armorId = 0;

    const displayableSkills = getSkillInfoList(armorId, true);
    const getSkill = (idx) => {
      const i = idx - 1;
      return (i >= 0 && i < displayableSkills.length) ? displayableSkills[i] : null;
    };

    result = result.replace(/\x1badded_skill(\d+)_desc\b/gi, (m, n) => {
      const s = getSkill(parseInt(n, 10));
      return s ? s.description : '';
    });
    result = result.replace(/\x1badded_skill(\d+)\b/gi, (m, n) => {
      const s = getSkill(parseInt(n, 10));
      return s ? s.name : '无';
    });
    result = result.replace(/\x1barmor_name\b/gi, getArmorName(armorId));
    result = result.replace(/\x1barmor_type\b/gi, getArmorEquipTypeName(armorId));
    result = result.replace(/\x1barmor_atype\b/gi, getArmorArmorTypeName(armorId));

    const validSkills = getSkillInfoList(armorId, false);
    const getValid = (idx) => {
      const i = idx - 1;
      return (i >= 0 && i < validSkills.length) ? validSkills[i] : null;
    };
    result = result.replace(/\x1bskill_entry(\d+)\b/gi, (m, n) => {
      const s = getValid(parseInt(n, 10));
      return s ? formatSkillEntry(formattedTemplate, s.name, s.description) : '';
    });

    return result;
  };

  // ==========================================================================
  // 装备详情窗口与自动换行/滚动控件
  // ==========================================================================
  if (!Window_DetailText) {
    throw new Error("[Huanaiyka_EquipDetail] 缺少基类 Window_DetailText。");
  }
  if (!Window_WithDetailWindowMixIn) {
    throw new Error("[Huanaiyka_EquipDetail] 缺少混入函数 Window_WithDetailWindowMixIn。");
  }

  function tokenizeText(text) {
    const tokens = [];
    let i = 0;
    const len = text.length;
    while (i < len) {
      const ch = text[i];
      if (ch === '\x1b') {
        let j = i + 1;
        if (j < len) {
          const cmd = text[j];
          if (cmd === '{' || cmd === '}' || cmd === '|' || cmd === '!' ||
              cmd === '.' || cmd === '$' || cmd === '\\') {
            tokens.push({ type: 'control', value: text.slice(i, i + 2) });
            i += 2;
            continue;
          } else if (cmd === 'C' || cmd === 'c' || cmd === 'I' || cmd === 'i' ||
                     cmd === 'N' || cmd === 'n' || cmd === 'V' || cmd === 'v') {
            let k = j + 1;
            if (k < len && text[k] === '[') {
              let end = k + 1;
              let depth = 1;
              while (end < len && depth > 0) {
                if (text[end] === '[') depth++;
                else if (text[end] === ']') depth--;
                end++;
              }
              tokens.push({ type: 'control', value: text.slice(i, end) });
              i = end;
              continue;
            }
          }
        }
        tokens.push({ type: 'char', value: ch });
        i++;
      } else {
        tokens.push({ type: 'char', value: ch });
        i++;
      }
    }
    return tokens;
  }

  function forceWordWrap(text, maxWidth, windowObj) {
    if (!text || !windowObj || !windowObj.textWidth) return text;
    if (maxWidth <= 0) return text;

    const tokens = tokenizeText(text);
    const lines = [];
    let currentLine = [];
    let pendingControls = [];

    function measure(tokensArr) {
      let str = '';
      for (const tok of tokensArr) {
        if (tok.type === 'char') str += tok.value;
      }
      return windowObj.textWidth(str);
    }

    function toString(tokensArr) {
      return tokensArr.map(t => t.value).join('');
    }

    function startNewLine() {
      lines.push(toString(currentLine));
      currentLine = [];
      if (pendingControls.length > 0) {
        currentLine.push(...pendingControls);
      }
    }

    for (const tok of tokens) {
      if (tok.type === 'control') {
        currentLine.push(tok);
        pendingControls.push(tok);
        continue;
      }
      if (tok.value === '\n') {
        startNewLine();
        pendingControls = [];
        continue;
      }
      const testLine = currentLine.concat(tok);
      if (measure(testLine) > maxWidth && currentLine.length > 0) {
        startNewLine();
        currentLine.push(tok);
      } else {
        currentLine.push(tok);
      }
      pendingControls = currentLine.filter(t => t.type === 'control');
    }

    if (currentLine.length > 0) {
      lines.push(toString(currentLine));
    }
    return lines.join('\n');
  }

  // ---- 扩展 Window_DetailText 上下滑动支持 ----
  const _Window_DetailText_initialize = Window_DetailText.prototype.initialize;
  Window_DetailText.prototype.initialize = function(rect) {
    _Window_DetailText_initialize.call(this, rect);
    this._scrollY = 0;
    this._totalTextHeight = 0;
    this.createScrollButtons();
  };

  Window_DetailText.prototype.createScrollButtons = function() {
    const btnSize = 28;
    this._upButton = new Sprite(new Bitmap(btnSize, btnSize));
    this._upButton.bitmap.fillRect(0, 0, btnSize, btnSize, 'rgba(0,0,0,0.6)');
    this._upButton.bitmap.strokeRect(0, 0, btnSize, btnSize, '#ffffff');
    this._upButton.bitmap.fontSize = 16;
    this._upButton.bitmap.drawText('▲', 0, 0, btnSize, btnSize, 'center');

    this._downButton = new Sprite(new Bitmap(btnSize, btnSize));
    this._downButton.bitmap.fillRect(0, 0, btnSize, btnSize, 'rgba(0,0,0,0.6)');
    this._downButton.bitmap.strokeRect(0, 0, btnSize, btnSize, '#ffffff');
    this._downButton.bitmap.fontSize = 16;
    this._downButton.bitmap.drawText('▼', 0, 0, btnSize, btnSize, 'center');

    this._upButton.visible = false;
    this._downButton.visible = false;

    this.addChild(this._upButton);
    this.addChild(this._downButton);
  };

  Window_DetailText.prototype.updateScrollButtonsPosition = function() {
    const btnSize = 28;
    const padding = 6;
    this._upButton.x = this.width - btnSize - padding;
    this._upButton.y = padding;
    this._downButton.x = this.width - btnSize - padding;
    this._downButton.y = this.height - btnSize - padding;
  };

  const _Window_DetailText_refresh = Window_DetailText.prototype.refresh;
  Window_DetailText.prototype.refresh = function() {
    if (!this._text) {
      this.contents.clear();
      this._totalTextHeight = 0;
      this._scrollY = 0;
      this.updateScrollButtons();
      return;
    }
    this.resetFontSettings();

    let width = this.innerWidth;
    if (width <= 0) width = 400;

    let processedText = this._text;
    if (autoWordWrap && width > 0) {
      processedText = forceWordWrap(this._text, width, this);
    }

    const textState = this.createTextState(processedText, 0, 0, width);
    const lines = processedText.split('\n');
    const lineHeight = this.lineHeight();
    this._totalTextHeight = lines.length * lineHeight;

    const maxScroll = Math.max(0, this._totalTextHeight - this.innerHeight);
    this._scrollY = Math.max(0, Math.min(this._scrollY, maxScroll));

    // 创建适应所有内容的内部位图
    const targetHeight = Math.max(this.innerHeight, this._totalTextHeight);
    if (this.contents.height < targetHeight) {
      this.contents = new Bitmap(width, targetHeight);
    } else {
      this.contents.clear();
    }

    this.drawTextEx(processedText, 0, 0, width);
    this.origin.y = this._scrollY;

    this.updateScrollButtonsPosition();
    this.updateScrollButtons();
  };

  Window_DetailText.prototype.updateScrollButtons = function() {
    if (!this.visible) {
      if (this._upButton) this._upButton.visible = false;
      if (this._downButton) this._downButton.visible = false;
      return;
    }
    const maxScroll = Math.max(0, this._totalTextHeight - this.innerHeight);
    if (maxScroll > 0) {
      this._upButton.visible = this._scrollY > 0;
      this._downButton.visible = this._scrollY < maxScroll;
    } else {
      this._upButton.visible = false;
      this._downButton.visible = false;
    }
  };

  Window_DetailText.prototype.scrollUp = function() {
    if (this._scrollY > 0) {
      this._scrollY = Math.max(0, this._scrollY - this.lineHeight() * 2);
      this.origin.y = this._scrollY;
      SoundManager.playCursor();
      this.updateScrollButtons();
    }
  };

  Window_DetailText.prototype.scrollDown = function() {
    const maxScroll = Math.max(0, this._totalTextHeight - this.innerHeight);
    if (this._scrollY < maxScroll) {
      this._scrollY = Math.min(maxScroll, this._scrollY + this.lineHeight() * 2);
      this.origin.y = this._scrollY;
      SoundManager.playCursor();
      this.updateScrollButtons();
    }
  };

  const _Window_DetailText_setText = Window_DetailText.prototype.setText;
  Window_DetailText.prototype.setText = function(text) {
    this._scrollY = 0;
    if (text && typeof text === 'string') {
      text = this.convertEscapeCharacters(text);
    }
    _Window_DetailText_setText.call(this, text);
    if (this.refresh) this.refresh();
  };

  const _Window_DetailText_detailText = Window_DetailText.prototype.detailText;
  Window_DetailText.prototype.detailText = function(item) {
    const customText = getEnhancedEquipDetail(item);
    if (customText) return customText;
    return _Window_DetailText_detailText.call(this, item);
  };

  // 处理对滑动按钮的点击
  Window_DetailText.prototype.processTouchScroll = function() {
    if (!this.visible || !TouchInput.isTriggered()) return false;
    const touchX = TouchInput.x - this.x;
    const touchY = TouchInput.y - this.y;

    if (this._upButton && this._upButton.visible) {
      const bx = this._upButton.x;
      const by = this._upButton.y;
      const bw = this._upButton.width;
      const bh = this._upButton.height;
      if (touchX >= bx && touchX <= bx + bw && touchY >= by && touchY <= by + bh) {
        this.scrollUp();
        TouchInput.clear();
        return true;
      }
    }

    if (this._downButton && this._downButton.visible) {
      const bx = this._downButton.x;
      const by = this._downButton.y;
      const bw = this._downButton.width;
      const bh = this._downButton.height;
      if (touchX >= bx && touchX <= bx + bw && touchY >= by && touchY <= by + bh) {
        this.scrollDown();
        TouchInput.clear();
        return true;
      }
    }
    return false;
  };

  const _Scene_Equip_create = Scene_Equip.prototype.create;
  Scene_Equip.prototype.create = function() {
    _Scene_Equip_create.call(this);
    this.createEquipDetailWindow();
  };

  Scene_Equip.prototype.createEquipDetailWindow = function() {
    const rect = this.equipDetailWindowRect();
    this._detailWindow = new Window_DetailText(rect);
    this._detailWindow.hide();
    this.addWindow(this._detailWindow);
    this._slotWindow.setDetailWindow(this._detailWindow);
    this._itemWindow.setDetailWindow(this._detailWindow);
  };

  Scene_Equip.prototype.equipDetailWindowRect = function() {
    return this.slotWindowRect();
  };

  Scene_Equip.prototype.updateDetailVariables = function(equip) {
    if (!equip) return;
    if (detailOpenVarId > 0) {
      $gameVariables.setValue(detailOpenVarId, equip.id);
    }
  };

  Scene_Equip.prototype.setPageButtonsVisible = function(visible) {
    if (this._pageupButton) this._pageupButton.visible = visible;
    if (this._pagedownButton) this._pagedownButton.visible = visible;
  };

  const _Scene_Equip_needsPageButtons = Scene_Equip.prototype.needsPageButtons;
  Scene_Equip.prototype.needsPageButtons = function() {
    if (this._detailWindow && this._detailWindow.visible) {
      return false;
    }
    return _Scene_Equip_needsPageButtons ? _Scene_Equip_needsPageButtons.call(this) : true;
  };

  const _Scene_Equip_updatePageButtons = Scene_Equip.prototype.updatePageButtons;
  Scene_Equip.prototype.updatePageButtons = function() {
    _Scene_Equip_updatePageButtons.call(this);
    if (this._detailWindow && this._detailWindow.visible) {
      if (this._pageupButton) this._pageupButton.visible = false;
      if (this._pagedownButton) this._pagedownButton.visible = false;
    }
  };

  const _Scene_Equip_onActorChange = Scene_Equip.prototype.onActorChange;
  Scene_Equip.prototype.onActorChange = function() {
    if (this._detailWindow && this._detailWindow.visible) {
      return; 
    }
    _Scene_Equip_onActorChange.call(this);
  };

  Scene_Equip.prototype.toggleDetailWindow = function(activeWindow) {
    if (!this._detailWindow) return;
    if (this._detailWindow.visible) {
      this.closeDetailWindow();
    } else {
      const currentItem = (activeWindow === this._slotWindow)
        ? this._actor.equips()[this._slotWindow.index()]
        : (activeWindow ? activeWindow.item() : null);
      if (currentItem) {
        this.updateDetailVariables(currentItem);
        this._detailWindow.setItem(currentItem);
        if (this._detailWindow._text && this._detailWindow._text.length > 0) {
          this._detailWindow.show();
          this._detailWindow.updateScrollButtons();

          this._previousActiveWindow = activeWindow || (this._slotWindow.active ? this._slotWindow : this._itemWindow);
          if (this._previousActiveWindow) {
            this._savedWindowIndex = this._previousActiveWindow.index();
          }

          if (this._slotWindow) this._slotWindow.deactivate();
          if (this._itemWindow) this._itemWindow.deactivate();

          this.setPageButtonsVisible(false);

          if (this._detailButton) {
            this._detailButton.setDetailOpen(true);
          }
        }
      }
    }
  };

  Scene_Equip.prototype.closeDetailWindow = function() {
    if (this._detailWindow && this._detailWindow.visible) {
      this._detailWindow.hide();
      this._detailWindow.updateScrollButtons();
      SoundManager.playCancel();
      
      if (this._detailButton) {
        this._detailButton.setDetailOpen(false);
      }

      this.setPageButtonsVisible(true);

      if (this._previousActiveWindow) {
        if (this._savedWindowIndex !== undefined && this._savedWindowIndex >= 0) {
          this._previousActiveWindow.select(this._savedWindowIndex);
        }
        this._previousActiveWindow.activate();
      } else {
        if (this._slotWindow) this._slotWindow.activate();
      }
      this._previousActiveWindow = null;
      this._savedWindowIndex = -1;
    }
  };

  const _Window_EquipSlot_isHandled = Window_EquipSlot.prototype.isHandled;
  Window_EquipSlot.prototype.isHandled = function(symbol) {
    if (symbol === 'detail') {
      const currentItem = this.item();
      if (!currentItem) return false;
      const detailText = getEnhancedEquipDetail(currentItem);
      if (!detailText || detailText.length === 0) return false;
    }
    return _Window_EquipSlot_isHandled.call(this, symbol);
  };

  const _Window_EquipItem_isHandled = Window_EquipItem.prototype.isHandled;
  Window_EquipItem.prototype.isHandled = function(symbol) {
    if (symbol === 'detail') {
      const currentItem = this.item();
      if (!currentItem) return false;
      const detailText = getEnhancedEquipDetail(currentItem);
      if (!detailText || detailText.length === 0) return false;
    }
    return _Window_EquipItem_isHandled.call(this, symbol);
  };

  const _Window_EquipSlot_initialize = Window_EquipSlot.prototype.initialize;
  Window_EquipSlot.prototype.initialize = function(rect) {
    _Window_EquipSlot_initialize.call(this, rect);
    this.setHandler('detail', () => {
      const scene = SceneManager._scene;
      if (scene && scene.toggleDetailWindow) {
        SoundManager.playCursor();
        scene.toggleDetailWindow(this);
      }
    });
  };

  const _Window_EquipItem_initialize = Window_EquipItem.prototype.initialize;
  Window_EquipItem.prototype.initialize = function(rect) {
    _Window_EquipItem_initialize.call(this, rect);
    this.setHandler('detail', () => {
      const scene = SceneManager._scene;
      if (scene && scene.toggleDetailWindow) {
        SoundManager.playCursor();
        scene.toggleDetailWindow(this);
      }
    });
  };

  Window_WithDetailWindowMixIn(openDetailKey, Window_EquipSlot.prototype);
  Window_WithDetailWindowMixIn(openDetailKey, Window_EquipItem.prototype);

  const _Scene_Equip_terminate = Scene_Equip.prototype.terminate;
  Scene_Equip.prototype.terminate = function() {
    _Scene_Equip_terminate.call(this);
    if (this._detailWindow) {
      this._detailWindow.hide();
      this._detailWindow = null;
    }
  };

  // ==========================================================================
  // 详情按钮
  // ==========================================================================
  function Scene_Equip_DetailButton() {
    this.initialize.apply(this, arguments);
  }

  Scene_Equip_DetailButton.prototype = Object.create(Sprite.prototype);
  Scene_Equip_DetailButton.prototype.constructor = Scene_Equip_DetailButton;

  Scene_Equip_DetailButton.prototype.initialize = function(scene) {
    Sprite.prototype.initialize.call(this);
    this._scene = scene;
    this._pressed = false;
    this._hovered = false;
    this._detailOpen = false;
    this.createBitmap();
    this.updatePosition();
  };

  Scene_Equip_DetailButton.prototype.createBitmap = function() {
    const size = detailButtonSize;
    this.bitmap = new Bitmap(size, size);
    this.redraw();
  };

  Scene_Equip_DetailButton.prototype.redraw = function() {
    const size = detailButtonSize;
    const bmp = this.bitmap;
    bmp.clear();

    if (this._detailOpen || this._pressed) {
      bmp.fillRect(0, 0, size, size, 'rgba(255, 255, 255, 0.45)');
      bmp.fillRect(2, 2, size - 4, size - 4, 'rgba(30, 30, 30, 0.9)');
      bmp.strokeRect(0, 0, size, size, '#ffffa0');
    } else if (this._hovered) {
      bmp.fillRect(0, 0, size, size, 'rgba(0, 0, 0, 0.7)');
      bmp.strokeRect(0, 0, size, size, 'rgba(255, 255, 255, 1.0)');
    } else {
      bmp.fillRect(0, 0, size, size, 'rgba(0, 0, 0, 0.5)');
      bmp.strokeRect(0, 0, size, size, 'rgba(255, 255, 255, 0.6)');
    }

    bmp.fontSize = Math.floor(size * 0.5);
    bmp.textColor = (this._detailOpen || this._pressed) ? '#ffffa0' : '#ffffff';
    bmp.outlineColor = 'rgba(0, 0, 0, 0.8)';
    bmp.outlineWidth = 4;
    bmp.drawText(detailButtonText, 0, 0, size, size, 'center');
  };

  Scene_Equip_DetailButton.prototype.updatePosition = function() {
    this.x = Graphics.boxWidth - detailButtonSize - 16;
    this.y = Graphics.boxHeight - detailButtonSize - 16;
  };

  Scene_Equip_DetailButton.prototype.isHit = function(x, y) {
    return x >= this.x && x < this.x + detailButtonSize &&
           y >= this.y && y < this.y + detailButtonSize;
  };

  Scene_Equip_DetailButton.prototype.setDetailOpen = function(open) {
    if (this._detailOpen !== open) {
      this._detailOpen = !!open;
      this.redraw();
    }
  };

  Scene_Equip_DetailButton.prototype.onClick = function() {
    const scene = this._scene;
    if (!scene || !scene.toggleDetailWindow) return;

    if (scene._detailWindow && scene._detailWindow.visible) {
      scene.closeDetailWindow();
    } else {
      let activeWindow = scene._previousActiveWindow;
      if (!activeWindow) {
        if (scene._slotWindow && scene._slotWindow.active) activeWindow = scene._slotWindow;
        else if (scene._itemWindow && scene._itemWindow.active) activeWindow = scene._itemWindow;
      }
      SoundManager.playCursor();
      scene.toggleDetailWindow(activeWindow);
    }
  };

  Scene_Equip_DetailButton.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.visible = true;
  };

  const _Scene_Equip_create_withButton = Scene_Equip.prototype.create;
  Scene_Equip.prototype.create = function() {
    _Scene_Equip_create_withButton.call(this);
    this.createDetailButton();
  };

  Scene_Equip.prototype.createDetailButton = function() {
    if (!showDetailButton) return;
    this._detailButton = new Scene_Equip_DetailButton(this);
    this.addChild(this._detailButton);
  };

  const _Scene_Equip_update_withButton = Scene_Equip.prototype.update;
  Scene_Equip.prototype.update = function() {
    if (this._detailWindow && this._detailWindow.visible) {
      // 优先响应详情窗口内部滑动按钮的点击
      if (this._detailWindow.processTouchScroll()) {
        return;
      }

      // 按键响应：也可使用方向键上下滑动详情文本
      if (Input.isRepeated('up')) {
        this._detailWindow.scrollUp();
      } else if (Input.isRepeated('down')) {
        this._detailWindow.scrollDown();
      }

      const isRightClick = TouchInput.isCancelled();
      const isCancelKey = Input.isTriggered('cancel') || Input.isTriggered('escape');
      const isDetailKey = Input.isTriggered(openDetailKey);

      // 1. 触发取消键、右键或按下详情快捷键时，直接关闭详情窗口
      if (isRightClick || isCancelKey || isDetailKey) {
        Input.clear();
        TouchInput.clear();
        this.closeDetailWindow();
        return;
      }

      // 2. 拦截任意位置的点击（除了右下角的详情按钮和滑动按钮），避免引起后台列表焦点变动
      if (TouchInput.isTriggered()) {
        const btn = this._detailButton;
        const hitButton = btn && btn.isHit(TouchInput.x, TouchInput.y);
        if (!hitButton) {
          TouchInput.clear();
          return;
        }
      }
    }

    _Scene_Equip_update_withButton.call(this);
    this.updateDetailButton();
  };

  Scene_Equip.prototype.updateDetailButton = function() {
    const btn = this._detailButton;
    if (!btn) return;
    const x = TouchInput.x;
    const y = TouchInput.y;
    const hit = btn.isHit(x, y);

    if (btn._hovered !== hit) {
      btn._hovered = hit;
      btn.redraw();
    }

    if (TouchInput.isTriggered() && hit) {
      btn._pressed = true;
      btn.redraw();
    }
    if (TouchInput.isReleased()) {
      if (btn._pressed) {
        btn._pressed = false;
        btn.redraw();
        if (hit) btn.onClick();
      }
    }
  };

  const _Scene_Equip_terminate_withButton = Scene_Equip.prototype.terminate;
  Scene_Equip.prototype.terminate = function() {
    if (this._detailButton) {
      this.removeChild(this._detailButton);
      this._detailButton = null;
    }
    _Scene_Equip_terminate_withButton.call(this);
  };

})();