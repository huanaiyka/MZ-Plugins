/*:
 * @target MZ
 * @plugindesc 特殊装备使属性克制时增伤
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 功能说明
 * ============================================================================
 * 本插件可以在攻击属性克制目标（属性有效度 > 100%）时，额外提升伤害倍率。
 *
 * 支持两种计算模式：
 *   - 乘算模式：倍率相乘（例如 1.2 × 1.3 = 1.56）
 *   - 加算模式：倍率相加（例如 1.2 + 0.3 = 1.5，注意加算模式下所有数值均视为“加成值”，总倍率 = 1 + 加成之和）
 *
 * 支持全局开关（无需装备即可获得基础倍率）。
 *
 * 支持通过装备备注标签单独配置倍率（可叠加）。
 *
============================================================================
 * 装备备注标签
 * ============================================================================
 * 在武器或防具的备注栏中写入：
 *   <EffectiveBoost: 倍率>
 *   例如：<EffectiveBoost: 1.3>   （乘算模式：1.3倍；加算模式：加成0.3）
 *
 * 可多件装备叠加，叠加规则由「运算方式」决定。
 *
 * ============================================================================
 * 使用示例
 * ============================================================================
 * 1. 纯装备效果（全局关闭）
 *    - 武器写入 <EffectiveBoost: 1.2>，防具写入 <EffectiveBoost: 1.3>
 *    - 乘算模式：总倍率 = 1.2 × 1.3 = 1.56
 *    - 加算模式：总倍率 = 1 + (0.2 + 0.3) = 1.5
 *
 * 2. 全局开启（globalRate=1.2）且装备也带标签
 *    - 乘算模式：全局1.2 × 装备1.3 = 1.56
 *    - 加算模式：全局加成0.2 + 装备加成0.3 = 0.5 → 总倍率1.5
 *
 * 3. 仅全局生效（不写任何装备标签）
 *    - 乘算模式：1.2倍
 *    - 加算模式：1.2倍（因为1+0.2）
 *
 * ============================================================================
 * 注意
 * ============================================================================
 * - 技能必须具有属性（元素ID > 0），且目标对该属性有效度 > 100% 才触发。
 * - 敌人没有装备系统，因此敌人只能通过全局效果获得增伤（如果 enemyEnable 开启）。
============================================================================
 * @param boostMode
 * @text 运算方式
 * @type select
 * @option 乘算
 * @value multiply
 * @option 加算
 * @value add
 * @desc 倍率叠加方式，乘算（1.2*1.3）或加算（1.2+0.3）
 * @default multiply
 *
 * @param globalEnable
 * @text 全局适用
 * @type boolean
 * @on 开启
 * @off 关闭
 * @desc 是否无需装备即可享受克制增伤
 * @default false
 *
 * @param globalRate
 * @text 全局倍率
 * @type number
 * @decimals 2
 * @desc 全局适用时，基础倍率（乘算模式下为倍率，加算模式下为加成值）
 * @default 1.2
 *
 * @param enemyEnable
 * @text 全局时敌人适用
 * @type boolean
 * @on 适用
 * @off 不适用
 * @desc 仅当全局适用开启时有效，控制敌人是否也获得全局倍率
 * @default true
 */
(function() {
    // 获取插件参数
    const params = PluginManager.parameters('Huanaiyka_EffectiveBoost');
    const BOOST_MODE = params['boostMode'] || 'multiply';      // 'multiply' 或 'add'
    const GLOBAL_ENABLE = params['globalEnable'] === 'true';
    const GLOBAL_RATE = parseFloat(params['globalRate'] || 1.2);
    const ENEMY_ENABLE = params['enemyEnable'] === 'true';

    // 从备注中解析倍率（返回原始数值，乘算模式下就是倍率，加算模式下视为加成值）
    function getEquipBoostValue(item) {
        if (!item || !item.note) return null;
        const match = item.note.match(/<EffectiveBoost:\s*([\d.]+)>/i);
        if (match && match[1]) {
            return parseFloat(match[1]);
        }
        return null;
    }

    // 计算某个角色的总克制倍率（基于全局和装备）
    function getTotalBoostRateForActor(actor) {
        let globalValue = GLOBAL_ENABLE ? GLOBAL_RATE : null;
        let equipValues = [];

        if (actor && actor.equips) {
            const equips = actor.equips();
            for (let equip of equips) {
                if (equip) {
                    const val = getEquipBoostValue(equip);
                    if (val !== null) equipValues.push(val);
                }
            }
        }

        // 根据模式合成最终倍率
        if (BOOST_MODE === 'multiply') {
            let rate = 1.0;
            if (globalValue !== null) rate *= globalValue;
            for (let v of equipValues) rate *= v;
            return rate;
        } else { // 加算模式
            let additive = 0.0;
            if (globalValue !== null) additive += (globalValue - 1); // 将倍率转为加成值（1.2 -> 0.2）
            for (let v of equipValues) additive += (v - 1);
            // 最终倍率 = 1 + 总加成
            let finalRate = 1 + additive;
            // 防止倍率低于0（比如负加成）
            if (finalRate < 0) finalRate = 0;
            return finalRate;
        }
    }

    // 计算敌人的总克制倍率（如果全局适用且敌人适用则返回全局倍率，否则1）
    function getTotalBoostRateForEnemy() {
        if (GLOBAL_ENABLE && ENEMY_ENABLE) {
            if (BOOST_MODE === 'multiply') {
                return GLOBAL_RATE;
            } else {
                // 加算模式下，全局倍率转为加算后倍率
                let additive = GLOBAL_RATE - 1;
                let finalRate = 1 + additive;
                if (finalRate < 0) finalRate = 0;
                return finalRate;
            }
        }
        return 1.0;
    }

    // 统一入口：根据攻击者获取倍率
    function getTotalBoostRate(subject) {
        if (!subject) return 1.0;
        if (subject.isActor()) {
            return getTotalBoostRateForActor(subject);
        } else {
            return getTotalBoostRateForEnemy();
        }
    }

    // 保存原始伤害计算方法
    const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;

    Game_Action.prototype.makeDamageValue = function(target, critical) {
        let damage = _Game_Action_makeDamageValue.call(this, target, critical);

        if (damage > 0 && this.isDamage()) {
            const skill = this.item();
            const elementId = skill ? skill.damage.elementId : 0;
            if (elementId > 0) {
                const elementRate = target.elementRate(elementId);
                if (elementRate > 1.0) {  // 效果绝佳
                    const subject = this.subject();
                    let boostRate = getTotalBoostRate(subject);
                    if (boostRate !== 1.0) {
                        damage = Math.floor(damage * boostRate);
                    }
                }
            }
        }
        return damage;
    };
})();