/*:
 * @target MZ
 * @plugindesc 非随机遇敌逃跑率控制
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @param escapeRate
 * @text 事件战斗逃跑率 (%)
 * @type number
 * @min 0
 * @max 100
 * @default 100
 * @desc 通过事件触发战斗时的默认逃跑成功率（0 - 100）。
 *
 * @command setEscapeRate
 * @text 设置事件战斗逃跑率
 * @desc 动态修改事件触发战斗时的逃跑成功率。
 *
 * @arg rate
 * @text 逃跑率 (%)
 * @type number
 * @min 0
 * @max 100
 * @default 100
 * @desc 新的事件战斗逃跑率（0 - 100）。
 *
 * @command resetEscapeRate
 * @text 重置事件战斗逃跑率
 * @desc 将事件战斗逃跑率恢复为插件参数设置的默认值。
 *
 * @help
 * ============================================================================
 * 插件简介
 * ============================================================================
 * 本插件用于控制「事件指令 → 战斗处理」所触发战斗的逃跑成功率，
 * 不影响地图随机遇敌的逃跑率。
 * 
 * ============================================================================
 * 插件指令说明
 * ============================================================================
 * 1. 设置事件战斗逃跑率：可在游戏运行中随时动态修改逃跑概率（如 boss 战设为 0）。
 * 2. 重置事件战斗逃跑率：重置为参数面板设置的默认逃跑率。
 */

(() => {
    'use strict';

    const pluginName = 'Huanaiyka_EscapeEventBattle';
    const parameters = PluginManager.parameters(pluginName);
    const defaultEscapeRate = Number(parameters['escapeRate'] || 100) / 100;

    // 当前生效的事件逃跑率（默认为插件参数）
    let currentEventEscapeRate = defaultEscapeRate;

    // -------------------------------------------------------------------------
    // 注册插件指令 (MZ)
    // -------------------------------------------------------------------------

    // 指令 1：动态修改逃跑率
    PluginManager.registerCommand(pluginName, 'setEscapeRate', args => {
        const rate = Number(args.rate || 0);
        currentEventEscapeRate = Math.max(0, Math.min(100, rate)) / 100;
    });

    // 指令 2：重置为默认逃跑率
    PluginManager.registerCommand(pluginName, 'resetEscapeRate', () => {
        currentEventEscapeRate = defaultEscapeRate;
    });

    // -------------------------------------------------------------------------
    // 战斗逻辑重写与扩展
    // -------------------------------------------------------------------------

    // 保存原生的逃跑率计算逻辑
    const _BattleManager_makeEscapeRatio = BattleManager.makeEscapeRatio;

    // 重写逃跑率计算
    BattleManager.makeEscapeRatio = function() {
        // 如果是事件调用的战斗（非地图随机遇敌）
        if ($gameTroop.isEventBattle()) {
            this._escapeRatio = currentEventEscapeRate;
        } else {
            // 随机遇敌继续使用原生逻辑（基于队伍与敌人敏捷度计算）
            _BattleManager_makeEscapeRatio.call(this);
        }
    };

    // 扩展 Game_Troop，用于判定当前战斗是否由事件发起
    const _Game_Troop_setup = Game_Troop.prototype.setup;
    Game_Troop.prototype.setup = function(troopId) {
        _Game_Troop_setup.call(this, troopId);
        // 如果 setup 执行时是在 $gameMap.isEventRunning() 状态下，说明是通过事件指令调用的战斗
        this._isEventBattle = $gameMap.isEventRunning();
    };

    Game_Troop.prototype.isEventBattle = function() {
        return !!this._isEventBattle;
    };

})();