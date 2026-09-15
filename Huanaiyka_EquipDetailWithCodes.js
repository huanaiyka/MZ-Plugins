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
 *    可通过插件参数「显示详情按钮」关闭。
 * 4. 返回键优化：打开详情后，点击返回/取消键优先关闭详情窗口，而不是退出装备场景。
 * 
 * 本插件需要以下基础插件才能正常运行装备详情窗口功能：
 * - DarkPlasma_CustomKeyHandler version:1.3.0
 * - DarkPlasma_DisplayDatabaseDetailWindow version:1.0.0
 * ============================================================================
 * 功能1：装备场景中的详细说明窗口
 * ============================================================================
 * 在装备场景中，将光标对准装备并按下特定按键时，会打开装备详细说明窗口。
 * 窗口背景为半透明，打开详情时光标自动锁定。
 *
 * 【标签说明】
 * 1. 普通详细说明：<detail:文本内容>
 * 2. 预设详细说明：<presetDetail:ID> 或 <presetDetail:ID:开关号>
 *    支持开关控制，从后往前匹配第一个开关满足条件的预设。
 * 3. 开关控制详细说明：<detailButtonX:文本内容>（X为开关编号）
 *    从后往前匹配第一个开关为ON的标签。
 *
 * 优先级：预设 > 开关控制 > 普通详细说明
 *
 * 【无说明时的行为】
 * 如果没有任何有效说明，按下按键无反应，不显示窗口，不播放音效。
 *
 * 【自动换行】
 * 开启后，窗口内的文字会根据窗口宽度自动折行，完美支持颜色、图标等控制码。
 * ============================================================================
 * 功能2：防具信息转义码（基于变量存储防具ID）
 * ============================================================================
 * 通过指定的游戏变量（默认变量 ID 1）储存一件防具的 ID，
 * 在文本事件中使用以下转义码（不区分大小写），即可动态显示该防具的相关信息：
 *
 * 【原有转义码】
 * \added_skillN          - 第 N 个追加技能的名称（若技能不存在则显示“无”）
 * \added_skillN_desc     - 第 N 个追加技能的描述（若技能不存在则为空）
 * \armor_name            - 当前防具的名称（无装备时显示“无”）
 * \armor_type            - 装备类型名称（如“头盔”、“铠甲”）
 * \armor_atype           - 防具类型名称（数据库设定，如“轻甲”、“重甲”）
 *
 * 【新增转义码】（自动隐藏不存在的技能）
 * \skill_entryN          - 显示第 N 个有效技能（完全忽略无效/缺失的技能），
 *                          按照参数“技能条目格式”输出格式化文本。
 *                          若第 N 个有效技能不存在，则整个条目显示为空字符串。
 *
 * 【开关技能支持】
 * 在防具备注中写入：<switchSkill: 开关ID, 关闭时技能ID, 开启时技能ID>
 * 会根据游戏开关状态自动选择对应的技能显示。
 *
 * 注意：所有转义码均不区分大小写，且自动去除技能名称/描述的首尾空格。
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
  // 装备详情窗口与自动换行
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

  const _Window_DetailText_refresh = Window_DetailText.prototype.refresh;
  Window_DetailText.prototype.refresh = function() {
    this.contents.clear();
    if (!this._text) return;
    this.resetFontSettings();

    let width = this.contents.width;
    if (width <= 0 && this.innerWidth) {
      width = this.innerWidth - this.standardPadding() * 2;
    }
    if (width <= 0) width = 400;

    if (autoWordWrap && width > 0) {
      const wrappedText = forceWordWrap(this._text, width, this);
      this.drawTextEx(wrappedText, 0, 0, width);
    } else {
      this.drawText(this._text, 0, 0, width, 'left');
    }
  };

  const _Window_DetailText_setText = Window_DetailText.prototype.setText;
  Window_DetailText.prototype.setText = function(text) {
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

// 专一隐藏/恢复左右角色切换按钮（保留取消返回按钮）
Scene_Equip.prototype.setPageButtonsVisible = function(visible) {
  if (this._pageupButton) this._pageupButton.visible = visible;
  if (this._pagedownButton) this._pagedownButton.visible = visible;
};

// 屏蔽详情展示期间的角色切换
const _Scene_Equip_needsPageButtons = Scene_Equip.prototype.needsPageButtons;
Scene_Equip.prototype.needsPageButtons = function() {
  if (this._detailWindow && this._detailWindow.visible) {
    return false;
  }
  return _Scene_Equip_needsPageButtons ? _Scene_Equip_needsPageButtons.call(this) : true;
};

// 关键：接管 updatePageButtons，详情打开时强制隐藏翻页按钮
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

  // 打开/切换 详情窗口
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
          
          this._previousActiveWindow = activeWindow || (this._slotWindow.active ? this._slotWindow : this._itemWindow);
          if (this._slotWindow) this._slotWindow.deactivate();
          if (this._itemWindow) this._itemWindow.deactivate();

          // 仅隐藏左右角色切换按键，保留右上角Cancel返回按键
          this.setPageButtonsVisible(false);

          if (this._detailButton) {
            this._detailButton.setDetailOpen(true);
          }
        }
      }
    }
  };

  // 关闭详情并恢复窗口和UI
  Scene_Equip.prototype.closeDetailWindow = function() {
    if (this._detailWindow && this._detailWindow.visible) {
      this._detailWindow.hide();
      SoundManager.playCancel();
      
      if (this._detailButton) {
        this._detailButton.setDetailOpen(false);
      }

      // 恢复左右角色切换按钮
      this.setPageButtonsVisible(true);

      // 恢复原列表窗口控制
      if (this._previousActiveWindow) {
        this._previousActiveWindow.activate();
      } else {
        if (this._slotWindow) this._slotWindow.activate();
      }
      this._previousActiveWindow = null;
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
    // 详情打开时，拦截鼠标右键、键盘取消键以及设定的详情按键（Shift）
    if (this._detailWindow && this._detailWindow.visible) {
      const isRightClick = TouchInput.isCancelled();
      const isCancelKey = Input.isTriggered('cancel') || Input.isTriggered('escape');
      const isDetailKey = Input.isTriggered(openDetailKey);

      if (isRightClick || isCancelKey || isDetailKey) {
        Input.clear();
        TouchInput.clear();
        this.closeDetailWindow();
        return;
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