/*:
 * @target MZ
 * @plugindesc 在菜单设置中添加“加速战斗/对话”选项
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 说明
 * ============================================================================
 * 本插件会在菜单的“设置”中新增“加速战斗”和“加速对话”选项。
 * 
 * - 加速战斗：开启后，战斗过程及转场加速。
 * - 加速对话：开启后，对话文本显示速度加速。
 *
 * 注意：当前 加速对话 功能依然有bug（战斗结算信息卡顿）。
 *
 * @param AddBattleOption
 * @text 是否添加“加速战斗”选项
 * @type boolean
 * @on 添加
 * @off 不添加
 * @default true
 * @desc 是否在菜单设置中显示“加速战斗”选项。关闭后该选项不显示。
 *
 * @param AddDialogOption
 * @text 是否添加“加速对话”选项
 * @type boolean
 * @on 添加
 * @off 不添加
 * @default true
 * @desc 是否在菜单设置中显示“加速对话”选项。关闭后该选项不显示。
 *
 * @param SpeedMultiplier
 * @text 战斗加速倍率
 * @type number
 * @min 1
 * @default 2
 * @desc 开启“加速战斗”后战斗过程的倍率。1 表示不加速。
 *
 * @param DialogSpeedMultiplier
 * @text 对话加速倍率
 * @type number
 * @min 1
 * @default 2
 * @desc 开启“加速对话”后文本显示的速度倍率。例如设为 2,则比原来快 2 倍。
 *
 * @param DefaultBattleEnabled
 * @text 加速战斗默认开启
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default false
 * @desc 新游戏开始时“加速战斗”是否默认开启。
 *
 * @param DefaultDialogEnabled
 * @text 加速对话默认开启
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default false
 * @desc 新游戏开始时“加速对话”是否默认开启。
 *
 * @param BattleLabel
 * @text 加速战斗显示名称
 * @type string
 * @default 加速战斗
 * @desc 在菜单设置中显示的选项名称。
 *
 * @param DialogLabel
 * @text 加速对话显示名称
 * @type string
 * @default 加速对话
 * @desc 在菜单设置中显示的选项名称。
 *
 * @param BattleOrder
 * @text 加速战斗排序位置
 * @type number
 * @min -1
 * @default 0
 * @desc 加速战斗选项排在列表的第几位。0 表示最前面，1 表示第二位。-1 表示不调整（默认位置）。
 *
 * @param DialogOrder
 * @text 加速对话排序位置
 * @type number
 * @min -1
 * @default 1
 * @desc 加速对话选项排在列表的第几位。0 表示最前面，1 表示第二位。-1 表示不调整（默认位置）。
 */

(() => {
    'use strict';

    const PLUGIN_NAME = 'Huanaiyka_SpeedConfig';
    const params = PluginManager.parameters(PLUGIN_NAME);

    // 读取参数
    const ADD_BATTLE_OPTION = String(params['AddBattleOption']).toLowerCase() === 'true';
    const ADD_DIALOG_OPTION = String(params['AddDialogOption']).toLowerCase() === 'true';
    const BATTLE_MULTIPLIER = Math.max(1, Math.floor(Number(params['SpeedMultiplier']) || 2));
    const DIALOG_MULTIPLIER = Math.max(1, Math.floor(Number(params['DialogSpeedMultiplier']) || 2));
    const DEFAULT_BATTLE_ENABLED = String(params['DefaultBattleEnabled']).toLowerCase() === 'true';
    const DEFAULT_DIALOG_ENABLED = String(params['DefaultDialogEnabled']).toLowerCase() === 'true';
    const BATTLE_LABEL = String(params['BattleLabel'] || '加速战斗');
    const DIALOG_LABEL = String(params['DialogLabel'] || '加速对话');
    const BATTLE_ORDER = Math.floor(Number(params['BattleOrder'] ?? -1));
    const DIALOG_ORDER = Math.floor(Number(params['DialogOrder'] ?? -1));

    //=============================================================================
    // ConfigManager
    //=============================================================================
    if (ConfigManager.battleSpeedEnabled === undefined) {
        ConfigManager.battleSpeedEnabled = DEFAULT_BATTLE_ENABLED;
    }
    if (ConfigManager.dialogSpeedEnabled === undefined) {
        ConfigManager.dialogSpeedEnabled = DEFAULT_DIALOG_ENABLED;
    }

    const _ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = _ConfigManager_makeData.call(this);
        config.battleSpeedEnabled = this.battleSpeedEnabled;
        config.dialogSpeedEnabled = this.dialogSpeedEnabled;
        return config;
    };

    const _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _ConfigManager_applyData.call(this, config);
        this.battleSpeedEnabled = this.readFlag(config, 'battleSpeedEnabled', DEFAULT_BATTLE_ENABLED);
        this.dialogSpeedEnabled = this.readFlag(config, 'dialogSpeedEnabled', DEFAULT_DIALOG_ENABLED);
    };

    const _ConfigManager_readFlag = ConfigManager.readFlag;
    ConfigManager.readFlag = function(config, name, defaultValue) {
        if (name === 'battleSpeedEnabled' || name === 'dialogSpeedEnabled') {
            if (config && config[name] !== undefined) {
                return !!config[name];
            }
            return !!defaultValue;
        }
        return _ConfigManager_readFlag.call(this, config, name, defaultValue);
    };

    //=============================================================================
    // Window_Options
    //=============================================================================
    const _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _Window_Options_addGeneralOptions.call(this);
        if (ADD_BATTLE_OPTION) {
            this.addCommand(BATTLE_LABEL, 'battleSpeedEnabled');
        }
        if (ADD_DIALOG_OPTION) {
            this.addCommand(DIALOG_LABEL, 'dialogSpeedEnabled');
        }
    };

    const _Window_Options_makeCommandList = Window_Options.prototype.makeCommandList;
    Window_Options.prototype.makeCommandList = function() {
        _Window_Options_makeCommandList.call(this);
        
        const moveOption = (symbol, order) => {
            if (order < 0) return;
            const index = this._list.findIndex(item => item.symbol === symbol);
            if (index !== -1) {
                const item = this._list.splice(index, 1)[0];
                const targetIndex = Math.min(order, this._list.length);
                this._list.splice(targetIndex, 0, item);
            }
        };

        if (ADD_BATTLE_OPTION) {
            moveOption('battleSpeedEnabled', BATTLE_ORDER);
        }
        if (ADD_DIALOG_OPTION) {
            moveOption('dialogSpeedEnabled', DIALOG_ORDER);
        }
    };

    const _Window_Options_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        const symbol = this.commandSymbol(index);
        if (symbol === 'battleSpeedEnabled') {
            return this.booleanStatusText(ConfigManager.battleSpeedEnabled);
        }
        if (symbol === 'dialogSpeedEnabled') {
            return this.booleanStatusText(ConfigManager.dialogSpeedEnabled);
        }
        return _Window_Options_statusText.call(this, index);
    };

    const _Window_Options_processOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        if (symbol === 'battleSpeedEnabled' || symbol === 'dialogSpeedEnabled') {
            if (symbol === 'battleSpeedEnabled') {
                ConfigManager.battleSpeedEnabled = !ConfigManager.battleSpeedEnabled;
            } else {
                ConfigManager.dialogSpeedEnabled = !ConfigManager.dialogSpeedEnabled;
            }
            this.redrawItem(index);
            SoundManager.playOk();
            return;
        }
        _Window_Options_processOk.call(this);
    };

    const _Window_Options_cursorRight = Window_Options.prototype.cursorRight;
    Window_Options.prototype.cursorRight = function(wrap) {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        if (symbol === 'battleSpeedEnabled' || symbol === 'dialogSpeedEnabled') {
            const currentVal = symbol === 'battleSpeedEnabled' ? ConfigManager.battleSpeedEnabled : ConfigManager.dialogSpeedEnabled;
            if (!currentVal) {
                if (symbol === 'battleSpeedEnabled') ConfigManager.battleSpeedEnabled = true;
                else ConfigManager.dialogSpeedEnabled = true;
                this.redrawItem(index);
                SoundManager.playCursor();
            }
            return;
        }
        _Window_Options_cursorRight.call(this, wrap);
    };

    const _Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
    Window_Options.prototype.cursorLeft = function(wrap) {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        if (symbol === 'battleSpeedEnabled' || symbol === 'dialogSpeedEnabled') {
            const currentVal = symbol === 'battleSpeedEnabled' ? ConfigManager.battleSpeedEnabled : ConfigManager.dialogSpeedEnabled;
            if (currentVal) {
                if (symbol === 'battleSpeedEnabled') ConfigManager.battleSpeedEnabled = false;
                else ConfigManager.dialogSpeedEnabled = false;
                this.redrawItem(index);
                SoundManager.playCursor();
            }
            return;
        }
        _Window_Options_cursorLeft.call(this, wrap);
    };

    //=============================================================================
    // SceneManager (战斗加速逻辑 - 完美修复结算卡顿)
    //=============================================================================
    const _SceneManager_initialize = SceneManager.initialize;
    SceneManager.initialize = function() {
        _SceneManager_initialize.call(this);
        this._battleSpeedActive = false;
        this._battleSpeedDupe = false;
    };

    SceneManager.isBattleSpeedActive = function() {
        if (!ConfigManager.battleSpeedEnabled || BATTLE_MULTIPLIER <= 1) {
            return false;
        }
        if (!this._scene || !this._scene.constructor) {
            return false;
        }
        const isBattleScene = (this._scene instanceof Scene_Battle);
        const isTransitioningToBattle = (this._nextScene && this._nextScene.constructor === Scene_Battle);

        if (!isBattleScene && !isTransitioningToBattle) {
            return false;
        }

        if (BattleManager && (BattleManager.isBattleEnd && BattleManager.isBattleEnd())) {
            return false;
        }

        if (isBattleScene) {
            const phase = this._scene._phase;
            if (['battleEnd', 'victory', 'escape', 'lose', 'reward'].includes(phase)) {
                return false;
            }
            if (this._scene._fadeType !== undefined && this._scene._fadeType > 0) {
                return false;
            }
        }

        return this._battleSpeedActive;
    };

    const _SceneManager_update = SceneManager.update;
    SceneManager.update = function(deltaTime) {
        _SceneManager_update.call(this, deltaTime);

        if (!this.isBattleSpeedActive()) {
            return;
        }

        this._battleSpeedDupe = true;
        for (let i = 1; i < BATTLE_MULTIPLIER; i++) {
            this.updateMain();
        }
        this._battleSpeedDupe = false;
    };

    const _SceneManager_updateMain = SceneManager.updateMain;
    SceneManager.updateMain = function() {
        if (this._battleSpeedDupe) {
            this.updateInputData();
            this.changeScene();
            this.updateScene();
        } else {
            _SceneManager_updateMain.call(this);
        }
    };

    const _SceneManager_goto = SceneManager.goto;
    SceneManager.goto = function(sceneClass) {
        if (sceneClass === Scene_Battle) {
            this._battleSpeedActive = true;
        } else {
            this._battleSpeedActive = false;
        }
        _SceneManager_goto.call(this, sceneClass);
    };

    const _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        _BattleManager_setup.call(this, troopId, canEscape, canLose);
        SceneManager._battleSpeedActive = true;
    };

    const _Scene_Battle_terminate = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function() {
        SceneManager._battleSpeedActive = false;
        _Scene_Battle_terminate.call(this);
    };

    ////=============================================================================
    // Window_Message (对话加速逻辑 - 修复版)
    //=============================================================================
    const _Window_Message_updateMessage = Window_Message.prototype.updateMessage;
    Window_Message.prototype.updateMessage = function() {
        // 如果当前处于战斗场景中，则不应用对话加速（防止结算和逃跑文本变快）
        const inBattle = SceneManager._scene instanceof Scene_Battle;
        
        if (!inBattle && ConfigManager.dialogSpeedEnabled && DIALOG_MULTIPLIER > 1) {
            let updated = false;
            // 纯粹通过在一个循环里多次调用逐字刷新逻辑实现加速，而不去篡改 isShowingFast 状态
            for (let i = 0; i < DIALOG_MULTIPLIER; i++) {
                if (_Window_Message_updateMessage.call(this)) {
                    updated = true;
                } else {
                    break;
                }
            }
            return updated;
        }
        return _Window_Message_updateMessage.call(this);
    };
})();