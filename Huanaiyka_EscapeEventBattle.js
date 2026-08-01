/*:
 * @target MZ
 * @plugindesc 非随机遇敌逃跑率控制
 * @author 幻爱
 *
 * @param EnablePlugin
 * @text 是否开启插件
 * @type boolean
 * @default true
 * @desc 是否开启本插件的非随机遇敌逃跑率控制功能。（默认开启）
 *
 * @command setNextEscapeRatio
 * @text 设置下一场战斗逃跑率
 * @desc 仅对紧接着发生的下一场战斗生效，战斗结束后会自动重置。
 *
 * @arg ratio
 * @text 逃跑成功率(%)
 * @type number
 * @min 0
 * @max 100
 * @default 100
 * @desc 输入 0 到 100 之间的数值。例如 100 表示 100% 逃跑成功。
 *
 * @help
 * ============================================================================
 * 插件简介
 * ============================================================================
* 本插件专门用于管理 RPG Maker MZ 中「非随机遇敌」（即通过事件指令触发的战斗）
 * 的逃跑成功率。地图上的野怪遭遇（随机遇敌）不受本插件影响。
 * 
 * 1. 【默认行为】：启用插件后，所有事件战斗的初始逃跑成功率默认为 100%。
 * 2. 【插件指令控制】：为下一次事件战斗单独指定精准的逃跑成功率（0%~100%），插件指令的设置会优先覆盖默认行为。
 * ============================================================================
 * 插件指令说明
 * ============================================================================
 * 插件指令：设置下一场战斗逃跑率 (setNextEscapeRatio)
 *   - 参数：逃跑成功率 (%) (0 ~ 100)
 *   - 说明：仅对【紧接着发生的第一场事件战斗】生效。战斗结束后会自动恢复默认。
 *   - 优先级：插件指令设置的值 > 默认的非随机遇敌 100% > 系统/其他插件计算值。
 *
 * ============================================================================
 * 使用示例 (事件页流程)
 * ============================================================================
* ◆ 插件指令：Huanaiyka_EscapeEventBattle, setNextEscapeRatio (ratio: 50)
 * ◆ 战斗处理：史莱姆 x2
 * （此时这场战斗的初始逃跑率会被设为 50%。战斗结束后，后续战斗恢复正常）
 *
 * ============================================================================
 * 兼容性说明
 * ============================================================================
 * 1. 本插件可与 NRP_EscapeRatio.js 配合使用。
 * 2. 请确保在插件管理器中，将本插件放置在 NRP_EscapeRatio.js 的下方。
 *    
 */

(() => {
    "use strict";

    const pluginName = "Huanaiyka_EscapeEventBattle";
    const parameters = PluginManager.parameters(pluginName);
    const pEnablePlugin = parameters["EnablePlugin"] !== "false"; // 默认 true

    // 用于记录通过插件指令指定的下一场战斗逃跑率 (0~1 之间，null 表示未指定)
    let tempNextEscapeRatio = null;

    // 注册插件指令
    PluginManager.registerCommand(pluginName, "setNextEscapeRatio", args => {
        const ratioPercent = Number(args.ratio || 100);
        // 将百分比转化为 0.0 ~ 1.0 的小数存储
        tempNextEscapeRatio = Math.min(Math.max(ratioPercent / 100, 0), 1);
    });

    // 1. 判定战斗来源（记录是否为地图随机遇敌）
    const _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        _BattleManager_setup.call(this, troopId, canEscape, canLose);
        // 如果没有事件回调，说明是由地图探索 updateEncounter 调用的随机遇敌
        this._isRandomEncounter = !this._eventCallback;

        // 将插件指令设置的临时逃跑率转移到 BattleManager 实例中
        if (tempNextEscapeRatio !== null) {
            this._customNextEscapeRatio = tempNextEscapeRatio;
            // 使用完毕后清空全局临时变量，确保只对下一场战斗生效
            tempNextEscapeRatio = null;
        } else {
            this._customNextEscapeRatio = null;
        }
    };

    const _Game_Interpreter_command301 = Game_Interpreter.prototype.command301;
    Game_Interpreter.prototype.command301 = function(params) {
        const result = _Game_Interpreter_command301.call(this, params);
        if ($gameParty.inBattle()) {
            BattleManager._isRandomEncounter = false;
        }
        return result;
    };

    // 2. 挂钩逃跑率计算函数（兼容其他逃跑率插件）
    const _BattleManager_makeEscapeRatio = BattleManager.makeEscapeRatio;
    BattleManager.makeEscapeRatio = function() {
        // 先让原生系统（或其他先加载的插件）完成常规计算
        _BattleManager_makeEscapeRatio.apply(this, arguments);

        // 如果是随机遇敌（野怪遭遇），直接跳过本插件逻辑，保留原生或前面插件的计算结果
        if (this._isRandomEncounter) {
            return;
        }

        // --- 以下仅对【事件战斗】生效 ---

        // 1. 如果设置了插件指令指定的逃跑率，优先使用该数值
        if (this._customNextEscapeRatio !== null && this._customNextEscapeRatio !== undefined) {
            this._escapeRatio = this._customNextEscapeRatio;
            return;
        }

        // 2. 若总开关开启，且没有插件指令指定，默认覆盖逃跑率为 100% (1.0)
        if (pEnablePlugin) {
            this._escapeRatio = 1.0;
        }
    };
})();