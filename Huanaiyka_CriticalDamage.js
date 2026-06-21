/*:
 * @target MZ
 * @plugindesc 全局暴击伤害倍率调整插件
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 本插件允许你通过参数修改游戏全局的暴击伤害倍率。
 * 
 * 默认值: 3.0 (RMMZ 原始值)
 * 
 * 注意：
 * - 倍率支持小数，例如 2.5 表示暴击造成 2.5 倍伤害。
 * - 本插件会覆盖引擎默认的 applyCritical 方法。
 * - 如果与其他修改同一方法的插件同时使用，可能会产生冲突，请将本插件放在下方。
 * 
 * @param criticalRate
 * @text 暴击倍率
 * @desc 暴击时的伤害倍率（原始值为 3.0）
 * @type number
 * @decimals 2
 * @min 0.1
 * @default 3.0
 */

(() => {
    // 使用实际的文件名
    const pluginName = 'Huanaiyka_CriticalDamage';
    const parameters = PluginManager.parameters(pluginName);
    const rate = parseFloat(parameters['criticalRate'] || 3.0);

    // 覆盖暴击伤害计算函数
    const _Game_Action_applyCritical = Game_Action.prototype.applyCritical;
    Game_Action.prototype.applyCritical = function(damage) {
        return Math.floor(damage * rate);
    };
})();