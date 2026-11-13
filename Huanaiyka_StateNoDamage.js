/*:
 * @target MZ
 * @plugindesc 状态免疫所有HP伤害
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 在状态的备注栏中填入：
 * <StateNoDamage>
 *
 * 拥有该状态的角色/敌人，受到任何扣血攻击时，HP 伤害强制为 0。
 */

(() => {
    const _gainHp = Game_Battler.prototype.gainHp;
    Game_Battler.prototype.gainHp = function(value) {
        if (value < 0 && this.states().some(s => s.meta.StateNoDamage)) {
            value = 0;
        }
        return _gainHp.call(this, value);
    };
})();