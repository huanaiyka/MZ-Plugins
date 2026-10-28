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
 * @desc 动态修改下一次事件触发战斗的逃跑成功率，只生效一次。
 *
 * @arg rate
 * @text 逃跑率 (%)
 * @type number
 * @min 0
 * @max 100
 * @default 100
 * @desc 下一次事件战斗的逃跑率（0 - 100）。
 *
 * @command resetEscapeRate
 * @text 重置事件战斗逃跑率
 * @desc 将下一次事件战斗的逃跑率恢复为插件参数设置的默认值。
 *
 * @help
 * ============================================================================
 * 插件简介
 * ============================================================================
 * 本插件用于控制「事件指令 → 战斗处理」所触发战斗的逃跑成功率，
 * 不影响地图随机遇敌的逃跑率。
 *
 * 使用插件指令设置逃跑率后，只会影响「下一场」事件战斗，
 * 该场战斗结束后自动恢复为插件参数中设置的默认值。
 *
 * ============================================================================
 * 插件指令说明
 * ============================================================================
 * 1. 设置事件战斗逃跑率：设置下一场事件战斗的逃跑概率（如 boss 战设为 0）。
 *    只生效一次，战斗结束后自动恢复默认值。
 * 2. 重置事件战斗逃跑率：将待生效的逃跑率恢复为参数面板设置的默认值。
 */

(() => {
    'use strict';

    const pluginName = 'Huanaiyka_EscapeEventBattle';
    const parameters = PluginManager.parameters(pluginName);
    const defaultEscapeRate = Number(parameters['escapeRate'] || 100) / 100;

    // 下一次事件战斗要使用的逃跑率（默认等于插件参数）
    let nextEventEscapeRate = defaultEscapeRate;

    // 当前这场战斗是否是事件战斗，以及它的逃跑率（null 表示不是事件战斗）
    let currentEventEscapeRate = null;

    // 指令 1：设置下一次事件战斗的逃跑率
    PluginManager.registerCommand(pluginName, 'setEscapeRate', args => {
        const rate = Number(args.rate || 0);
        nextEventEscapeRate = Math.max(0, Math.min(100, rate)) / 100;
    });

    // 指令 2：重置为默认逃跑率
    PluginManager.registerCommand(pluginName, 'resetEscapeRate', () => {
        nextEventEscapeRate = defaultEscapeRate;
    });

    // 拦截事件指令「战斗处理」(command301)
    const _Game_Interpreter_command301 = Game_Interpreter.prototype.command301;
    Game_Interpreter.prototype.command301 = function(params) {
        currentEventEscapeRate = nextEventEscapeRate;
        nextEventEscapeRate = defaultEscapeRate;
        return _Game_Interpreter_command301.call(this, params);
    };

    // 重写逃跑率计算
    const _BattleManager_makeEscapeRatio = BattleManager.makeEscapeRatio;
    BattleManager.makeEscapeRatio = function() {
        if (currentEventEscapeRate !== null) {
            this._escapeRatio = currentEventEscapeRate;
        } else {
            _BattleManager_makeEscapeRatio.call(this);
        }
    };

    // 战斗真正结束时，清除事件战斗标记
    const _BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        currentEventEscapeRate = null;
        _BattleManager_endBattle.call(this, result);
    };

})();