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
 * - 本插件通过 Alias（别名继承）方法重写了 applyCritical 计算，最大程度减少插件冲突。
 * - 若与修改同一方法的其他暴击插件共用，建议将本插件置于下方。
 * 
 * @param criticalRate
 * @text 暴击倍率
 * @desc 暴击时的伤害倍率（原始值为 3.0，例如输入 2.5 即为 2.5 倍）
 * @type number
 * @decimals 2
 * @min 0.0
 * @default 3.0
 */

(() => {
    // 自动获取当前插件的真实文件名，防止改名后读取参数失败
    const pluginName = document.currentScript.src.match(/^.*\/(.*)\.js$/)?.[1] || 'Huanaiyka_CriticalDamage';
    const parameters = PluginManager.parameters(pluginName);
    const rate = Number(parameters['criticalRate'] ?? 3.0);

    // 组合重写（Alias）而非直接覆盖，提高与其他插件的兼容性
    const _Game_Action_applyCritical = Game_Action.prototype.applyCritical;
    Game_Action.prototype.applyCritical = function(damage) {
        // 先调用原始/上层插件计算出的暴击伤害（默认是 damage * 3）
        const baseCriticalDamage = _Game_Action_applyCritical.call(this, damage);
        
        // 按新倍率缩放（由于默认倍率是 3，所以缩放系数为 rate / 3）
        return Math.floor(baseCriticalDamage * (rate / 3.0));
    };
})();