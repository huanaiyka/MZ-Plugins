/*:
 * @target MZ
 * @plugindesc 制作挺住状态，受到致死打击后维持1HP。
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @param removeStateOnTrigger
 * @text 触发后移除状态
 * @type boolean
 * @default false
 * @desc 设为 true 时，挺住触发后会自动移除带 <Endure> 标签的状态，即每次附加只能挺住一次。设为 false 时状态保留、持续生效。
 *
 * @help
 * ============================================================================
 * 挺住（Endure）状态插件
 * ============================================================================
 *
 * 【功能概述】
 * 给状态（State）使用 <Endure> 备注标签。当角色/敌人身上带有该标签的状态时，
 * 若受到足以致死的伤害，血量会被强制保留在 1 HP，实现「挺住」效果。
 *
 * 【使用方法】
 * 1. 在数据库 → 状态 中新建（或选择一个）状态。
 * 2. 在该状态的备注栏填写：
 *
 *      <Endure>
 *
 * 3. 需要「挺住」效果时，通过技能、事件等给目标附加该状态即可。
 *
 * 【参数说明】
 * - 触发后移除状态（removeStateOnTrigger）
 *   · false（默认）：挺住状态常驻，只要状态在就一直拦截致死伤害，无次数限制。
 *   · true：每次附加只能挺住一次。触发挺住后，插件会自动移除所有带
 *     <Endure> 标签的状态；状态被移除后便不再挺住，除非重新附加该状态。
 *
 * 【工作原理】
 * - 插件在 Game_BattlerBase.prototype.setHp 这一最底层的血量写入接口处拦截。
 * - 只要写入的值 <= 0，且单位身上存在带 <Endure> 标签的状态，
 *   就把写入值改成 1 再交给原版函数处理。
 * - 因此任何导致 HP 归零的途径（普通伤害、百分比伤害、脚本直接赋值等）
 *   都会被拦截，无需逐个修改伤害计算。
 *
 * 【注意事项】
 * - 标签写在「状态」的备注里，不在技能或角色上。
 * - 效果为被动触发。当「触发后移除状态」为 false 时无次数限制；
 *   为 true 时每次附加只能挺住一次，触发后状态被移除，需重新附加才能再次触发。
 * - 该效果只保证血量不低于 1，不提供免伤或后续恢复。
 * - 与 RPG Maker MZ 自带的「免疫死亡」特性可叠加使用，互不冲突。
 * - 判断基于 battler.states()，对已死亡单位同样生效
 *   （若死亡后仍保留该状态，setHp 被调用时会被拉回 1）。
 *
 * 【兼容性】
 * - 目标平台：RPG Maker MZ
 * - 仅重写 Game_BattlerBase.prototype.setHp，与大多数插件兼容；
 *   若有其它插件也重写此函数，请注意加载顺序。
 */

(() => {
    'use strict';

    const PLUGIN_NAME = 'EndureState';
    const params = PluginManager.parameters(PLUGIN_NAME);
    const removeStateOnTrigger = String(params['removeStateOnTrigger']) === 'true';

    // 收集单位身上所有带 <Endure> 标签的状态 id
    const getEndureStateIds = function(battler) {
        if (!battler) return [];
        return battler.states()
            .filter(state => state && state.meta && state.meta.Endure)
            .map(state => state.id);
    };

    // 在【血量写入】的最底层时机进行拦截
    const _Game_BattlerBase_setHp = Game_BattlerBase.prototype.setHp;
    Game_BattlerBase.prototype.setHp = function(hp) {
        if (hp <= 0) {
            const endureIds = getEndureStateIds(this);
            if (endureIds.length > 0) {
                // 有挺住状态，强行把血量改为 1
                hp = 1;
                // 若参数开启，则触发后移除这些状态（每次附加只能挺住一次）
                if (removeStateOnTrigger) {
                    for (const stateId of endureIds) {
                        this.removeState(stateId);
                    }
                }
            }
        }
        _Game_BattlerBase_setHp.call(this, hp);
    };

})();