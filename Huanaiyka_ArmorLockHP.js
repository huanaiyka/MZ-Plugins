/*:
 * @target MZ
 * @plugindesc 制作锁血防具
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @param LockMessage
 * @text 防具生效且消失时的台词
 * @type text
 * @default %1 破碎了，保护了 %2！
 * @desc 在台词中使用 %1 代表防具的名字，%2 代表装备者的名字。
 * 
 * @param LuckyMessage
 * @text 防具生效且不消失时的台词
 * @type text
 * @default %1 触发了守护效果，保护了 %2！
 * @desc 在台词中使用 %1 代表防具的名字，%2 代表装备者的名字。
 *
 * @help
 * 
 * =============================================================================
 * 插件功能
 * ===============================================================================
 * 本插件允许您通过防具备注栏设置"锁血"效果。
 * 当装备者受到致命伤害时（HP 降至 0），
 * 防具可以触发锁血效果，使装备者以 1 HP 存活，并显示自定义的台词信息。
 * 
 * =============================================================================
 * 防具备注设置
 * =============================================================================
 * 请在防具的"备注"栏（Note）中添加以下标签：
 *
 * 【基础标签 - 二选一】
 *
 * 1. 概率锁血且防具消失
 *    <LockHP: 50%>
 *    - 当装备者受到致命伤害时，有指定概率（50%）使 HP 变为 1，触发后移除该防具。
 *    - 可设置任意百分比，数值为整数。
 *
 * 2. 概率锁血且防具不消失
 *    <LuckyLock: 50%>
 *    - 当装备者受到致命伤害时，有指定概率（50%）使 HP 变为 1，防具保留。
 *    - 可设置任意百分比，数值为整数。
 * 
 * 【可选修饰标签】
 *
 * 3. 仅对直接攻击生效
 *    <DirectOnly>
 *    - 添加此标签后，该防具的锁血效果仅对敌人直接造成的伤害生效
 *    - 直接伤害包括：普通攻击、技能、魔法等由敌人主动发起的攻击
 *    - 不包括：中毒/灼烧等状态伤害、地形伤害、反射伤害等间接伤害
 *    - 此标签可同时搭配 LockHP 或 LuckyLock 使用
 *
 * ◆ 使用组合示例：
 *    <LockHP: 50%>
 *    <DirectOnly>
 *    → 仅对直接攻击有50%概率触发锁血并消失，状态伤害不会触发
 *
 * ◆ 注意事项：
 * - 若同时拥有多个锁血防具，按装备栏顺序优先触发第一个匹配的防具。
 * - 锁血效果仅在"装备者受到伤害且 HP 降为 0"时触发。
 * - 防具消失仅移除该装备栏的防具，不影响其他装备。
 *
 * =============================================================================
 * 使用范例
 * =============================================================================
 * 1. 创建防具"护身符"，备注添加：
 *    <LockHP: 50%>
 *    <DirectOnly>
 *    → 受到敌人直接攻击且HP归零时，有50%概率触发锁血，护身符消失。
 *
 * 2. 创建防具"幸运戒指"，备注添加：
 *    <LuckyLock: 30%>
 *    → 任何伤害（包括状态、地形）导致HP归零时，有30%概率触发锁血。
 *
 * =============================================================================
 * 伤害类型说明
 * =============================================================================
 * ◆ 直接伤害（Direct Damage）- 会触发锁血（若添加了 <DirectOnly> 标签）：
 *    - 敌人的普通攻击
 *    - 敌人的技能/魔法攻击
 *    - 敌人的特技攻击
 *    - 即：所有通过 `Game_Action` 发起的伤害
 *
 * ◆ 间接伤害（Indirect Damage）- 不会触发锁血（若添加了 <DirectOnly> 标签）：
 *    - 中毒、灼烧等状态伤害
 *    - 地形伤害（岩浆等）
 *    - 反射伤害（反弹伤害）
 *    - 事件指令造成的伤害
 *    - 其他非敌人主动攻击造成的伤害
 */

(() => {
    const parameters = PluginManager.parameters('ArmorLockHP');
    const lockMessage = parameters['LockMessage'] || "%1 破碎了，保护了 %2！";
    const luckyMessage = parameters['LuckyMessage'] || "%1 触发了守护效果，保护了 %2！";

    // 保存当前伤害是否来自直接攻击
    let _isDirectDamage = false;

    // ============================================================
    // 覆写 apply 以标记伤害来源
    // ============================================================
    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _isDirectDamage = true;  // 标记为直接伤害（来自技能/攻击）
        _Game_Action_apply.call(this, target);
        _isDirectDamage = false; // 重置标记
    };

    // ============================================================
    // 覆写 onDamage - 检查锁血
    // ============================================================
    const _Game_Battler_onDamage = Game_Battler.prototype.onDamage;

    Game_Battler.prototype.onDamage = function(value) {
        _Game_Battler_onDamage.call(this, value);
        if (this.isActor() && this.hp === 0) {
            this.checkArmorLock();
        }
    };

    // ============================================================
    // 工具：替换台词中的占位符
    // ============================================================
    function formatMessage(template, armorName, actorName) {
        return template.replace(/%1/g, armorName).replace(/%2/g, actorName);
    }

    // ============================================================
    // 核心锁血检测逻辑
    // ============================================================
    Game_Battler.prototype.checkArmorLock = function() {
        const equips = this.equips();
        const actorName = this.name();
        
        for (const armor of equips) {
            if (!armor) continue;

            // 检查是否为直接伤害（如果防具要求仅直接伤害触发）
            if (armor.meta.DirectOnly && !_isDirectDamage) {
                continue; // 非直接伤害，跳过此防具
            }

            // 1. 概率锁血且防具消失 (LockHP)
            if (armor.meta.LockHP) {
                const rate = parseFloat(armor.meta.LockHP) / 100;
                if (Math.random() < rate) {
                    this.setHp(1);
                    this.discardArmor(armor);
                    $gameMessage.add(formatMessage(lockMessage, armor.name, actorName));
                    return;
                }
                // 未触发则继续检查下一个防具
                continue;
            }

            // 2. 概率锁血且防具不消失 (LuckyLock)
            if (armor.meta.LuckyLock) {
                const rate = parseFloat(armor.meta.LuckyLock) / 100;
                if (Math.random() < rate) {
                    this.setHp(1);
                    $gameMessage.add(formatMessage(luckyMessage, armor.name, actorName));
                    return;
                }
            }
        }
    };

    // ============================================================
    // 丢弃防具（真正消失）
    // ============================================================
    Game_Battler.prototype.discardArmor = function(armor) {
        const slotId = this.equips().indexOf(armor);
        if (slotId >= 0) {
            this.changeEquip(slotId, null);      // 卸下装备
            $gameParty.loseItem(armor, 1);       // ★ 从背包中彻底移除
        }
    };

})();