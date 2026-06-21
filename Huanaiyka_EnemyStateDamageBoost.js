/*:
 * @target MZ
 * @plugindesc 特定技能对异常状态的敌人伤害翻倍
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件可以让某个技能，当敌人身上存在指定的状态时，
 * 造成的伤害变为原来的 2 倍。
 * 
 * 该插件的功能完全可被伤害公式：
 * (基础伤害公式) * (b.isStateAffected(状态ID) ? 2 : 1)
 * 替代。
============================================================================
 * 使用方法
 * ============================================================================
 * 1. 在数据库中选择一个技能或物品。
 * 2. 打开其「备注」栏。
 * 3. 输入以下格式的标签：
 * 
 *        <TargetStateBoost: 状态ID1, 状态ID2, 状态ID3>
 * 
 * 4. 保存并开始游戏。
 * 
 * ============================================================================
 * 示例
 * ============================================================================
 * 假设你希望「祸不单行」技能在敌人处于「眩晕」(12号状态) 或「中毒」(13号状态) 时伤害翻倍。
 * 
 * 在「祸不单行」的备注栏中写入：
 * 
 *        <TargetStateBoost: 12,13>
 * 
 * 效果：敌人只要拥有 12 或 13 号状态，受到的伤害 ×2。
 * 
 * ============================================================================
 * 注意事项
 * ============================================================================
 * - 状态ID 必须是游戏中已存在的状态编号。
 * - 多个状态ID请用英文逗号 `,` 分隔，不要使用中文逗号 `，`。
 * - 标签前后不要加多余的空格或换行，但状态ID前后的空格是允许的（如 "12, 13"）。
 * - 本插件仅影响技能/物品的最终伤害，不改变命中率或其它效果。
 * - 如果目标同时拥有多个指定状态，倍率仍然是 ×2，不会叠加。
 * - 伤害为 0 或负数时不会触发翻倍。
 * 
 * ============================================================================
 * 兼容性
 * ============================================================================
 * - 本插件通过重写 Game_Action.prototype.makeDamageValue 实现。
 * - 如果其他插件也修改了该方法，请调整插件加载顺序，将本插件放在下方（后加载）以确保生效。
 */

(() => {
    'use strict';

    const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;

    Game_Action.prototype.makeDamageValue = function(target, critical) {
        let damage = _Game_Action_makeDamageValue.call(this, target, critical);
        if (damage <= 0) return damage;

        const item = this.item();
        if (!item || !item.meta) return damage;

        let boostStatesStr = item.meta.TargetStateBoost || item.meta.targetstateboost;
        if (!boostStatesStr) return damage;

        const stateIds = boostStatesStr.split(',').map(s => {
            const id = parseInt(s.trim(), 10);
            return isNaN(id) ? null : id;
        }).filter(id => id !== null);

        if (stateIds.length === 0) return damage;

        for (const stateId of stateIds) {
            if (target.isStateAffected(stateId)) {
                return Math.floor(damage * 2);
            }
        }

        return damage;
    };
})();