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
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 1. 装备详情窗口：在装备场景按指定按键（默认 Shift）显示装备的详细说明。
 *    支持 <detail:文本>、<presetDetail:ID>、<detailButton开关号:文本> 标签。
 * 2. 防具信息转义码：通过变量存储防具ID，在任意文本中使用 \armor_name、\skill_entryN 等动态显示信息。
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
 *
 * 【修改说明】
 * 本插件在原版（仅支持简单 <detail> 标签）基础上，新增了预设说明、开关控制标签、自动换行、装备ID存储等扩展功能，并提供更丰富的配置参数。============================================================================
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
 *
 */

/*~struct~PresetDetail:
 * @param id
 * @desc 预设ID（字符串，可填数字或文字，例如 "common" 或 "普通装备"）
 * @text ID
 * @type string
 * @default 
 *
 * @param text
 * @desc 显示的详细文本。支持多行（直接换行即可）。
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
  // 参数：装备详情窗口部分
  // ==========================================================================
  const openDetailKey = String(pluginParameters.openDetailKey || 'shift');
  const enablePreset = pluginParameters.enablePreset === 'true';
  const detailOpenVarId = parseInt(pluginParameters.detailOpenVarId || '0', 10);
  const autoWordWrap = pluginParameters.autoWordWrap !== 'false';

  // ==========================================================================
  // 参数：防具转义码部分
  // ==========================================================================
  const armorVarId = Number(pluginParameters['armorVarId'] || 1);
  let skillEntryFormat = pluginParameters['skillEntryFormat'] || "\\C[1]%name\\C[0]：%desc";

  // 将参数字符串中的 "\C" 转换为实际的 ESC 控制字符 (0x1b)
  function normalizeControlChars(str) {
    if (!str) return '';
    return str.replace(/\\c/gi, (match) => {
      return match === '\\c' ? '\x1bc' : '\x1bC';
    });
  }
  const formattedTemplate = normalizeControlChars(skillEntryFormat);

  // ==========================================================================
  // 预设详细说明解析（装备详情窗口用）
  // ==========================================================================
  function stripQuotes(str) {
    if (!str) return str;
    let trimmed = str.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith('\\"') && trimmed.endsWith('\\"'))) {
      trimmed = trimmed.slice(trimmed.startsWith('\\"') ? 2 : 1,
                              trimmed.endsWith('\\"') ? -2 : -1);
    }
    trimmed = trimmed.replace(/\\"/g, '"');
    return trimmed;
  }

  const presetDetails = (() => {
    if (!enablePreset) return new Map();
    const raw = pluginParameters.presetDetails;
    if (!raw) return new Map();
    let list;
    try {
      list = JSON.parse(raw);
    } catch (e) {
      return new Map();
    }
    if (!Array.isArray(list)) return new Map();
    const map = new Map();
    for (let item of list) {
      if (typeof item === 'string') {
        try { item = JSON.parse(item); } catch(e) { continue; }
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
  // 防具转义码核心函数（整合自 Huanaiyka_ArmorDetailTextCodes）
  // ==========================================================================
  function getAllValidSkills(armorId) {
    const armor = $dataArmors[armorId];
    if (!armor) return [];

    const result = [];

    // 1. 原生追加技能 (traits code = 43)
    const traits = armor.traits;
    for (let i = 0; i < traits.length; i++) {
      if (traits[i].code === 43) {
        const skill = $dataSkills[traits[i].dataId];
        if (skill) {
          result.push({
            name: skill.name.trim(),
            description: skill.description.trim()
          });
        }
      }
    }

    // 2. 开关技能 (解析备注中的 <switchSkill: 开关ID, 关闭技能ID, 开启技能ID>)
    const note = armor.note;
    if (note && typeof note === 'string') {
      const regex = /<switchSkill:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*>/gi;
      let match;
      while ((match = regex.exec(note)) !== null) {
        const switchId = parseInt(match[1], 10);
        const skillOff = parseInt(match[2], 10);
        const skillOn = parseInt(match[3], 10);
        const isSwitchOn = $gameSwitches ? $gameSwitches.value(switchId) : false;
        const skillId = isSwitchOn ? skillOn : skillOff;
        const skill = $dataSkills[skillId];
        if (skill) {
          result.push({
            name: skill.name.trim(),
            description: skill.description.trim()
          });
        }
      }
    }

    return result;
  }

  function getAllDisplayableSkills(armorId) {
    const armor = $dataArmors[armorId];
    if (!armor) return [];

    const result = [];

    const traits = armor.traits;
    for (let i = 0; i < traits.length; i++) {
      if (traits[i].code === 43) {
        const skill = $dataSkills[traits[i].dataId];
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
        const isSwitchOn = $gameSwitches ? $gameSwitches.value(switchId) : false;
        const skillId = isSwitchOn ? skillOn : skillOff;
        const skill = $dataSkills[skillId];
        if (skill) {
          result.push({
            name: skill.name.trim(),
            description: skill.description.trim()
          });
        } else {
          result.push({
            name: '无',
            description: ''
          });
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
    const etypeId = armor.etypeId;
    const typeName = $dataSystem.equipTypes[etypeId];
    return typeName ? typeName : '无';
  }

  function getArmorArmorTypeName(armorId) {
    const armor = $dataArmors[armorId];
    if (!armor) return '无';
    const atypeId = armor.atypeId;
    const typeName = $dataSystem.armorTypes[atypeId];
    return typeName ? typeName : '无';
  }

  function formatSkillEntry(template, skillName, skillDesc) {
    if (!template) return '';
    return template.replace(/%name/g, skillName).replace(/%desc/g, skillDesc);
  }

  // 保存原始方法并扩展 Window_Base 的转义字符处理
  const _WindowBase_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
  Window_Base.prototype.convertEscapeCharacters = function(text) {
    let result = _WindowBase_convertEscapeCharacters.call(this, text);
    
    let armorId = $gameVariables.value(armorVarId);
    if (typeof armorId !== 'number' || isNaN(armorId)) armorId = 0;
    
    const displayableSkills = getAllDisplayableSkills(armorId);
    const getSkillInfoByIndex = (idx) => {
      const index = idx - 1;
      return (index >= 0 && index < displayableSkills.length) ? displayableSkills[index] : null;
    };
    
    // 替换 \added_skillN_desc
    result = result.replace(/\x1badded_skill(\d+)_desc\b/gi, (match, numStr) => {
      const idx = parseInt(numStr, 10);
      const skillInfo = getSkillInfoByIndex(idx);
      return skillInfo ? skillInfo.description : '';
    });
    
    // 替换 \added_skillN
    result = result.replace(/\x1badded_skill(\d+)\b/gi, (match, numStr) => {
      const idx = parseInt(numStr, 10);
      const skillInfo = getSkillInfoByIndex(idx);
      return skillInfo ? skillInfo.name : '无';
    });
    
    // 替换 \armor_name, \armor_type, \armor_atype
    result = result.replace(/\x1barmor_name\b/gi, getArmorName(armorId));
    result = result.replace(/\x1barmor_type\b/gi, getArmorEquipTypeName(armorId));
    result = result.replace(/\x1barmor_atype\b/gi, getArmorArmorTypeName(armorId));
    
    // 替换 \skill_entryN (基于有效技能列表，不存在则为空)
    const validSkills = getAllValidSkills(armorId);
    const getValidSkillByIndex = (idx) => {
      const index = idx - 1;
      return (index >= 0 && index < validSkills.length) ? validSkills[index] : null;
    };
    result = result.replace(/\x1bskill_entry(\d+)\b/gi, (match, numStr) => {
      const idx = parseInt(numStr, 10);
      const skill = getValidSkillByIndex(idx);
      return skill ? formatSkillEntry(formattedTemplate, skill.name, skill.description) : '';
    });
    
    return result;
  };

  // ==========================================================================
  // 装备详情窗口及场景扩展（整合自 Huanaiyka_EquipDetail）
  // ==========================================================================
  if (!Window_DetailText) {
    throw new Error("[Huanaiyka_EquipDetail] 缺少基类 Window_DetailText，请确保 DarkPlasma_DisplayDatabaseDetailWindow 已加载。");
  }
  if (!Window_WithDetailWindowMixIn) {
    throw new Error("[Huanaiyka_EquipDetail] 缺少混入函数 Window_WithDetailWindowMixIn，请确保 DarkPlasma_DisplayDatabaseDetailWindow 已加载。");
  }

  // 强制字符级自动换行实现
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
          if (cmd === 'C' || cmd === 'c' || cmd === 'I' || cmd === 'i' ||
              cmd === 'N' || cmd === 'n' || cmd === 'V' || cmd === 'v' ||
              cmd === '{' || cmd === '}' || cmd === '|' || cmd === '!' ||
              cmd === '.' || cmd === '$' || cmd === '\\') {
            if (cmd === '{' || cmd === '}' || cmd === '|' || cmd === '!' ||
                cmd === '.' || cmd === '$' || cmd === '\\') {
              tokens.push({ type: 'control', value: text.slice(i, i + 2) });
              i += 2;
              continue;
            } else {
              let k = j + 1;
              if (k < len && text[k] === '[') {
                let end = k + 1;
                let depth = 1;
                while (end < len && depth > 0) {
                  if (text[end] === '[') depth++;
                  else if (text[end] === ']') depth--;
                  end++;
                }
                const fullCtrl = text.slice(i, end);
                tokens.push({ type: 'control', value: fullCtrl });
                i = end;
                continue;
              }
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
    let currentWidth = 0;
    let pendingControls = [];

    function measureTokensWidth(tokensArr) {
      let str = '';
      for (let tok of tokensArr) {
        if (tok.type === 'char') str += tok.value;
      }
      return windowObj.textWidth(str);
    }

    function tokensToString(tokensArr) {
      return tokensArr.map(t => t.value).join('');
    }

    function startNewLine() {
      lines.push(tokensToString(currentLine));
      currentLine = [];
      currentWidth = 0;
      if (pendingControls.length > 0) {
        currentLine.push(...pendingControls);
        currentWidth = measureTokensWidth(currentLine);
      }
    }

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.type === 'control') {
        currentLine.push(tok);
        pendingControls.push(tok);
        continue;
      }

      const ch = tok.value;
      if (ch === '\n') {
        startNewLine();
        pendingControls = [];
        continue;
      }

      const testLineTokens = currentLine.concat(tok);
      const testWidth = measureTokensWidth(testLineTokens);
      if (testWidth > maxWidth && currentLine.length > 0) {
        startNewLine();
        currentLine.push(tok);
        currentWidth = measureTokensWidth(currentLine);
        pendingControls = currentLine.filter(t => t.type === 'control');
      } else {
        currentLine.push(tok);
        currentWidth = testWidth;
        pendingControls = currentLine.filter(t => t.type === 'control');
      }
    }

    if (currentLine.length > 0) {
      lines.push(tokensToString(currentLine));
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

  Scene_Equip.prototype.toggleDetailWindow = function(activeWindow) {
    if (!this._detailWindow) return;
    if (this._detailWindow.visible) {
      this._detailWindow.hide();
      activeWindow.activate();
    } else {
      const currentItem = (activeWindow === this._slotWindow) ? 
        this._actor.equips()[this._slotWindow.index()] : 
        activeWindow.item();
      if (currentItem) {
        this.updateDetailVariables(currentItem);
        this._detailWindow.setItem(currentItem);
        if (this._detailWindow._text && this._detailWindow._text.length > 0) {
          this._detailWindow.show();
        }
      }
    }
  };

  const _Window_EquipSlot_isHandled = Window_EquipSlot.prototype.isHandled;
  Window_EquipSlot.prototype.isHandled = function(symbol) {
    if (symbol === 'detail') {
      const currentItem = this.item();
      if (currentItem) {
        const detailText = getEnhancedEquipDetail(currentItem);
        if (!detailText || detailText.length === 0) {
          return false;
        }
      } else {
        return false;
      }
    }
    return _Window_EquipSlot_isHandled.call(this, symbol);
  };

  const _Window_EquipItem_isHandled = Window_EquipItem.prototype.isHandled;
  Window_EquipItem.prototype.isHandled = function(symbol) {
    if (symbol === 'detail') {
      const currentItem = this.item();
      if (currentItem) {
        const detailText = getEnhancedEquipDetail(currentItem);
        if (!detailText || detailText.length === 0) {
          return false;
        }
      } else {
        return false;
      }
    }
    return _Window_EquipItem_isHandled.call(this, symbol);
  };

  const _Window_EquipSlot_initialize = Window_EquipSlot.prototype.initialize;
  Window_EquipSlot.prototype.initialize = function(rect) {
    _Window_EquipSlot_initialize.call(this, rect);
    this.setHandler('detail', () => {
      const scene = SceneManager._scene;
      if (scene && scene.toggleDetailWindow) scene.toggleDetailWindow(this);
    });
  };

  const _Window_EquipItem_initialize = Window_EquipItem.prototype.initialize;
  Window_EquipItem.prototype.initialize = function(rect) {
    _Window_EquipItem_initialize.call(this, rect);
    this.setHandler('detail', () => {
      const scene = SceneManager._scene;
      if (scene && scene.toggleDetailWindow) scene.toggleDetailWindow(this);
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
})();