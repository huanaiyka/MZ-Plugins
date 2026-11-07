/*:
 * @target MZ
 * @plugindesc 必定命中类型无视成功率，恒为命中
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 数据库中命中类型设为「必定命中」的技能/物品：
 *   - 命中判定恒为 1，不读取 成功率(successRate)
 *   - 回避判定恒为 0
 * 无需任何备注标签。
 */

(() => {
    const CERTAIN = Game_Action.HITTYPE_CERTAIN;

    // 在加载瞬间捕获“当前”的 itemHit / itemEva（含其他插件的修改）
    const _itemHit = Game_Action.prototype.itemHit;
    const _itemEva = Game_Action.prototype.itemEva;

    Game_Action.prototype.itemHit = function(target) {
        const item = this.item();
        if (item && item.hitType === CERTAIN) {
            return 1; // 彻底无视成功率
        }
        return _itemHit.call(this, target);
    };

    Game_Action.prototype.itemEva = function(target) {
        const item = this.item();
        if (item && item.hitType === CERTAIN) {
            return 0; // 彻底无视回避
        }
        return _itemEva.call(this, target);
    };
})();