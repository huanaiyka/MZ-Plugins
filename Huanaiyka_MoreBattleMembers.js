//=============================================================================
// Huanaiyka_MoreBattleMembers.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 增加战斗的最大出战人数
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 
 * 【简介】
 * 本插件允许您自定义战斗中最多可出战的角色数量。
 * - 当战斗人数 ≤ 4 时，完全使用原版UI。
 * - 当战斗人数 ≥ 5 时，自动切换为宽度自适应UI。
 * - 支持插件指令动态开关功能、修改最大出战人数。
 *
 * 【功能说明】
 * - 自定义最大战斗人数。默认4人，最大12人。（实际上超过8人的角色，虽然正在出战，但会超出边界而无法显示）
 * - 支持插件指令：动态开关插件功能、实时修改出战人数。
 * - 插件启用状态会保存在存档中，读档后依然保持。
 *
 * 【使用方法】
 * 1. 将本插件放入项目的js/plugins文件夹
 * 2. 在RPG Maker MZ的插件管理器中启用本插件
 * 3. 根据需要配置下方参数
 * 4. 在事件中使用插件指令（会在列表中显示）：
 *    - MoreBattleMembers enable true   → 开启插件功能
 *    - MoreBattleMembers enable false  → 关闭插件功能
 *    - MoreBattleMembers max 5         → 将最大出战人数设为5
 *
 * 【注意事项】
 * - 请确保项目战斗模式为“回合制”（前视图），不支持侧视图（SV模式）。
 * 
 * 【特别感谢】
 * - 插件 NUUN_BattleGaugeWidthFix.js 提供的血条宽度绘制方法。
 *
 * @param maxBattleMembers
 * @text 最大出战人数
 * @desc 战斗中最多可同时出战的角色数量（1-12），仅在启用插件时生效
 * @type number
 * @min 1
 * @max 12
 * @default 4
 *
 * @param defaultEnabled
 * @text 默认启用插件
 * @desc 新游戏开始时插件是否默认启用（允许超过4人）
 * @type boolean
 * @default true
 *
 * @command enable
 * @text 启用/禁用插件
 * @desc 开启或关闭插件的全部功能（人数限制及UI调整）
 * @arg value
 * @text 启用
 * @desc true=启用，false=禁用
 * @type boolean
 * @default true
 *
 * @command max
 * @text 设置最大出战人数
 * @desc 动态修改战斗中最大出战人数（1-12）
 * @arg value
 * @text 人数
 * @desc 1-12之间的数字
 * @type number
 * @min 1
 * @max 12
 * @default 6
 *
 * @version 2.7.0
 */

var Imported = Imported || {};
Imported.MoreBattleMembers = true;

(function() {
    'use strict';

    const pluginName = "Huanaiyka_MoreBattleMembers";
    const parameters = PluginManager.parameters(pluginName);
    
    // 可动态修改的出战人数变量
    let customMaxBattleMembers = Number(parameters['maxBattleMembers']);
    if (isNaN(customMaxBattleMembers) || customMaxBattleMembers < 1) customMaxBattleMembers = 4;
    if (customMaxBattleMembers > 12) customMaxBattleMembers = 12;
    
    // 默认启用状态（仅用于新游戏）
    const defaultEnabled = parameters['defaultEnabled'] === 'true';
    
    // 扩展模式布局参数（仅当人数>4时使用）
    const STATUS_ITEM_HEIGHT = 180;       // 扩展模式下状态项高度
    const ACTOR_SPACING = 140;            // 行走图间距
    const ACTOR_START_Y = 400;            // 行走图起始Y坐标
    const ACTOR_BASE_X = 0;               // 行走图X偏移
    
    //=============================================================================
    // 扩展 Game_System：持久化存储插件启用状态
    //=============================================================================
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._moreBattleMembersEnabled = defaultEnabled;
    };
    
    // 插件是否整体启用（控制人数上限等）
    function isPluginEnabled() {
        if (!$gameSystem) return true;
        if ($gameSystem._moreBattleMembersEnabled === undefined) {
            $gameSystem._moreBattleMembersEnabled = defaultEnabled;
        }
        return $gameSystem._moreBattleMembersEnabled;
    }
    
    // 是否使用扩展UI（插件启用 且 当前战斗人数 > 4）
    function useExtendedUI() {
        if (!isPluginEnabled()) return false;
        const battleMembersCount = $gameParty ? $gameParty.battleMembers().length : 0;
        return battleMembersCount > 4;
    }
    
    function setPluginEnabled(enabled) {
        if ($gameSystem) {
            $gameSystem._moreBattleMembersEnabled = enabled;
        }
        refreshBattleUI();
        const scene = SceneManager._scene;
        if (scene && scene._statusWindow) {
            scene._statusWindow.refresh();
        }
    }
    
    // 存储原始方法备份
    const _original = {};
    
    _original.GameParty_maxBattleMembers = Game_Party.prototype.maxBattleMembers;
    _original.GameParty_battleMembers = Game_Party.prototype.battleMembers;
    _original.Window_BattleStatus_initialize = Window_BattleStatus.prototype.initialize;
    _original.Window_BattleStatus_refresh = Window_BattleStatus.prototype.refresh;
    _original.Window_BattleStatus_maxCols = Window_BattleStatus.prototype.maxCols;
    _original.Window_BattleStatus_itemWidth = Window_BattleStatus.prototype.itemWidth;
    _original.Window_BattleStatus_itemHeight = Window_BattleStatus.prototype.itemHeight;
    _original.Spriteset_Battle_createActors = Spriteset_Battle.prototype.createActors;
    _original.Spriteset_Battle_refreshActors = Spriteset_Battle.prototype.refreshActors;
    _original.Window_BattleActor_initialize = Window_BattleActor.prototype.initialize;
    _original.Window_BattleSkill_initialize = Window_BattleSkill.prototype.initialize;
    _original.Window_BattleItem_initialize = Window_BattleItem.prototype.initialize;
    
    function refreshBattleUI() {
        const scene = SceneManager._scene;
        if (scene && scene instanceof Scene_Battle) {
            if (scene._statusWindow) {
                scene._statusWindow.refresh();
                scene._statusWindow.activate();
            }
            if (scene._spriteset) {
                scene._spriteset.refreshActors();
            }
        }
    }
    
    window.setMoreBattleMembersMax = function(newMax) {
        if (newMax < 1) newMax = 1;
        if (newMax > 12) newMax = 12;
        customMaxBattleMembers = newMax;
        refreshBattleUI();
    };
    
    window.setMoreBattleMembersEnabled = function(enabled) {
        setPluginEnabled(enabled);
    };
    
    //=============================================================================
    // 插件指令注册
    //=============================================================================
    PluginManager.registerCommand(pluginName, "enable", args => {
        const value = args.value ? args.value.toLowerCase() : "true";
        const enabled = value === "true" || value === "1" || value === "on";
        setPluginEnabled(enabled);
    });
    
    PluginManager.registerCommand(pluginName, "max", args => {
        let newMax = Number(args.value);
        if (isNaN(newMax)) newMax = customMaxBattleMembers;
        setMoreBattleMembersMax(newMax);
    });
    
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        if (command === "MoreBattleMembers") {
            const subCommand = args[0];
            if (subCommand === "enable") {
                const enabled = args[1] === "true";
                setPluginEnabled(enabled);
                return;
            } else if (subCommand === "max") {
                const newMax = parseInt(args[1], 10);
                if (!isNaN(newMax)) setMoreBattleMembersMax(newMax);
                return;
            }
        }
        if (_Game_Interpreter_pluginCommand) {
            _Game_Interpreter_pluginCommand.call(this, command, args);
        }
    };
    
    //=============================================================================
    // Game_Party
    //=============================================================================
    Game_Party.prototype.maxBattleMembers = function() {
        if (!isPluginEnabled()) {
            return _original.GameParty_maxBattleMembers.call(this);
        }
        return customMaxBattleMembers;
    };
    
    Game_Party.prototype.battleMembers = function() {
        const allMembers = _original.GameParty_battleMembers.call(this);
        if (!isPluginEnabled()) {
            return allMembers;
        }
        const limit = this.maxBattleMembers();
        if (allMembers.length > limit) {
            return allMembers.slice(0, limit);
        }
        return allMembers;
    };
    
    //=============================================================================
    // Window_BattleStatus：仅在扩展模式下修改布局
    //=============================================================================
    Window_BattleStatus.prototype.itemWidth = function() {
        if (useExtendedUI()) {
            const membersCount = $gameParty.battleMembers().length;
            if (membersCount === 0) return 120;
            const availableWidth = this.innerWidth;
            let width = Math.floor(availableWidth / membersCount);
            width = Math.min(width, 280); // 最大宽度限制
            width = Math.max(width, 80);
            return width;
        } else {
            if (_original.Window_BattleStatus_itemWidth) {
                return _original.Window_BattleStatus_itemWidth.call(this);
            } else {
                const cols = this.maxCols();
                return Math.floor(this.innerWidth / cols);
            }
        }
    };
    
    Window_BattleStatus.prototype.itemHeight = function() {
        if (useExtendedUI()) {
            return STATUS_ITEM_HEIGHT;
        } else {
            if (_original.Window_BattleStatus_itemHeight) {
                return _original.Window_BattleStatus_itemHeight.call(this);
            } else {
                return this.lineHeight() * 2 + 8;
            }
        }
    };
    
    Window_BattleStatus.prototype.maxCols = function() {
        if (useExtendedUI()) {
            return $gameParty.battleMembers().length;
        } else {
            if (_original.Window_BattleStatus_maxCols) {
                return _original.Window_BattleStatus_maxCols.call(this);
            } else {
                return 4;
            }
        }
    };
    
    Window_BattleStatus.prototype.initialize = function(x, y, width, height) {
        if (useExtendedUI()) {
            _original.Window_BattleStatus_initialize.call(this, x, y, width, height);
            this.fixedHeight = this.itemHeight() + this.fittingHeight(0);
            this.height = this.fixedHeight;
            this.createContents();
        } else {
            _original.Window_BattleStatus_initialize.call(this, x, y, width, height);
        }
    };
    
    Window_BattleStatus.prototype.refresh = function() {
        if (useExtendedUI()) {
            _original.Window_BattleStatus_refresh.call(this);
            if (this.height !== this.fixedHeight) {
                this.height = this.fixedHeight;
                this.createContents();
            }
        } else {
            _original.Window_BattleStatus_refresh.call(this);
        }
    };
    
    const _Window_BattleStatus_update = Window_BattleStatus.prototype.update;
    Window_BattleStatus.prototype.update = function() {
        _Window_BattleStatus_update.call(this);
        if (useExtendedUI()) {
            if (this._membersCount !== $gameParty.battleMembers().length) {
                this._membersCount = $gameParty.battleMembers().length;
                this.refresh();
            }
        }
    };
    
    //=============================================================================
    // 内置 NUUN_BattleGaugeWidthFix 的血条宽度修正（仅在扩展模式下生效）
    //=============================================================================
    let maxGaugeWidth = NaN;
    
    // 修改 gaugeFixWidthClass，只在扩展模式下返回 true
    Sprite.prototype.gaugeFixWidthClass = function() {
        if (!useExtendedUI()) return false;
        switch (this.className) {
          case 'Window_BattleStatus':
          case 'Window_BattleActor':
            return !isNaN(maxGaugeWidth);
        }
        return false;
    };
    
    const _Window_BattleStatus_drawItemStatus = Window_BattleStatus.prototype.drawItemStatus;
    Window_BattleStatus.prototype.drawItemStatus = function(index) {
        if (useExtendedUI()) {
            maxGaugeWidth = this.itemRectWithPadding(0).width;
        }
        _Window_BattleStatus_drawItemStatus.call(this, index);
        maxGaugeWidth = NaN;
    };
    
    const _Sprite_Gauge_initMembers = Sprite_Gauge.prototype.initMembers;
    Sprite_Gauge.prototype.initMembers = function() {
        this._nuunGaugeWidth = null;
        _Sprite_Gauge_initMembers.call(this);
    };
    
    const _Sprite_Gauge_setup = Sprite_Gauge.prototype.setup;
    Sprite_Gauge.prototype.setup = function(battler, statusType) {
        _Sprite_Gauge_setup.call(this, battler, statusType);
        if (this.gaugeFixWidthClass()) {
            const width = Math.min(maxGaugeWidth, this.bitmapWidth());
            if (this.bitmapWidth() !== width) {
                this._nuunGaugeWidth = width;
                this.redraw();
            }
        }
    };
    
    const _Sprite_Gauge_bitmapWidth = Sprite_Gauge.prototype.bitmapWidth;
    Sprite_Gauge.prototype.bitmapWidth = function() {
        return this._nuunGaugeWidth ? this._nuunGaugeWidth : _Sprite_Gauge_bitmapWidth.call(this);
    };
    
    const _Sprite_Name_initMembers = Sprite_Name.prototype.initMembers;
    Sprite_Name.prototype.initMembers = function() {
        this._nuunNameWidth = null;
        _Sprite_Name_initMembers.call(this);
    };
    
    const _Sprite_Name_setup = Sprite_Name.prototype.setup;
    Sprite_Name.prototype.setup = function(battler) {
        _Sprite_Name_setup.call(this, battler);
        if (this.gaugeFixWidthClass()) {
            const width = Math.min(maxGaugeWidth, this.bitmapWidth());
            if (this.bitmapWidth() !== width) {
                this._nuunNameWidth = width;
                this.redraw();
            }
        }
    };
    
    const _Sprite_Name_bitmapWidth = Sprite_Name.prototype.bitmapWidth;
    Sprite_Name.prototype.bitmapWidth = function() {
        return this._nuunNameWidth ? this._nuunNameWidth : _Sprite_Name_bitmapWidth.call(this);
    };
    
    //=============================================================================
    // Spriteset_Battle：仅在扩展模式下重新定位角色行走图
    //=============================================================================
    Spriteset_Battle.prototype.createActors = function() {
        _original.Spriteset_Battle_createActors.call(this);
        if (useExtendedUI()) {
            this.placeActors();
        }
    };
    
    Spriteset_Battle.prototype.refreshActors = function() {
        _original.Spriteset_Battle_refreshActors.call(this);
        if (useExtendedUI()) {
            this.placeActors();
        }
    };
    
    Spriteset_Battle.prototype.placeActors = function() {
        const actors = this._actorSprites;
        const members = $gameParty.battleMembers();
        const total = members.length;
        if (total === 0) return;
        
        const spacing = ACTOR_SPACING;
        const startY = ACTOR_START_Y;
        const totalWidth = (total - 1) * spacing;
        let startX = (Graphics.width - totalWidth) / 2;
        startX += ACTOR_BASE_X;
        
        for (let i = 0; i < actors.length; i++) {
            const sprite = actors[i];
            if (sprite && members[i]) {
                const x = startX + i * spacing;
                sprite.move(x, startY, sprite.width, sprite.height);
                if (sprite.setHome) sprite.setHome(x, startY);
            }
        }
    };
    
    //=============================================================================
    // 目标选择窗口高度调整（仅扩展模式）
    //=============================================================================
    Window_BattleActor.prototype.initialize = function(x, y, width, height) {
        _original.Window_BattleActor_initialize.call(this, x, y, width, height);
        if (useExtendedUI() && this._statusWindow) {
            this.height = this._statusWindow.height;
            this.createContents();
        }
    };
    
    Window_BattleSkill.prototype.initialize = function(x, y, width, height) {
        _original.Window_BattleSkill_initialize.call(this, x, y, width, height);
        if (useExtendedUI() && this._statusWindow) {
            this.height = this._statusWindow.height;
            this.createContents();
        }
    };
    
    Window_BattleItem.prototype.initialize = function(x, y, width, height) {
        _original.Window_BattleItem_initialize.call(this, x, y, width, height);
        if (useExtendedUI() && this._statusWindow) {
            this.height = this._statusWindow.height;
            this.createContents();
        }
    };
    
})();