/*:
 * @target MZ
 * @plugindesc 装备属性有效度完全覆盖
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * 
 * @param prioritySlots
 * @text 优先槽位顺序
 * @desc 指定装备槽的优先顺序，从高到低排列。未指定的槽位自动追加到末尾。（0=武器，1=盾牌，2=头部，3=身体，4=装饰品）
 * @type string
 * @default 4,0,1,2,3
 * 
 * @help
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 本插件让特定装备在穿戴后，角色的所有属性有效度（抗性）完全由该装备
 * 自带的"属性有效度"特性提供，无视角色本身、职业、状态等其他来源。
 *
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 在数据库的【装备/武器】特性列表中，正常添加【属性有效度】。
 * 2. 在该装备的【备注】栏中加入开启标签：
 *
 *      <elementResist>
 *
 * ============================================================================
 * 优先级与覆盖逻辑
 * ============================================================================
 * 只要角色穿上了带有 <elementResist> 标签的装备：
 * - 装备特性中【配置了】的属性：完全使用该装备特性的数值。
 * - 装备特性中【没配置】的属性：强制重置为 100%（受到 100% 原额伤害）。
 *
 * 遍历顺序：按照【优先槽位顺序】逐个检查槽位。
 * 关键判定：如果某个高优先级槽位【没有装备】或【装备没有 <elementResist> 标签】，
 * 插件会直接忽略该槽位，继续检查下一个优先级槽位。
 * 只有找到第一个带有标签的装备时，才会用它来进行覆盖。
 *
 * ============================================================================
 * 参数说明
 * ============================================================================
 * 【优先槽位顺序】
 *   用逗号分隔的装备槽索引列表，索引从 0 开始。
 *   0 = 武器
 *   1 = 盾牌
 *   2 = 头部
 *   3 = 身体
 *   4 = 装饰品
 *
 *   示例：
 *     4,0   → 装饰品最优先，其次武器，其余按 3→2→1
 *     3,2   → 身体最优先，其次头部，其余按 4→1→0
 *     留空   → 全部按从后往前：4→3→2→1→0
 * ============================================================================
 */

(() => {
    // 自动且安全地获取当前插件名称（防止因修改文件名导致参数读取失败）
    const pluginName = (() => {
        if (document.currentScript && document.currentScript.src) {
            const match = document.currentScript.src.match(/\/([^\/]+)\.js/);
            if (match) return match[1];
        }
        return "Huanaiyka_EquipElementResist";
    })();

    // 读取参数
    const parameters = PluginManager.parameters(pluginName) || {};
    const prioritySlotsStr = parameters['prioritySlots'] || '4,0';

    // 所有可能的默认装备槽索引（从0到4）
    const ALL_SLOTS = [0, 1, 2, 3, 4];

    // 解析用户指定的优先顺序
    let userPriority = [];
    if (prioritySlotsStr.trim() !== '') {
        userPriority = prioritySlotsStr.split(',')
            .map(n => parseInt(n.trim(), 10))
            .filter(n => !isNaN(n) && n >= 0);
    }

    // 构建完整的优先顺序：用户指定的在前，未指定的按从后往前追加
    let prioritySlots = [];
    if (userPriority.length === 0) {
        // 留空：全部按从后往前
        prioritySlots = [...ALL_SLOTS].reverse();
    } else {
        // 先加入用户指定的（去重，保留顺序）
        const seen = new Set();
        for (const slot of userPriority) {
            if (!seen.has(slot) && ALL_SLOTS.includes(slot)) {
                seen.add(slot);
                prioritySlots.push(slot);
            }
        }
        // 再加入未指定的槽位（从后往前）
        const remaining = ALL_SLOTS.filter(s => !seen.has(s)).reverse();
        prioritySlots = prioritySlots.concat(remaining);
    }

    // 检查装备是否开启了抗性覆盖功能
    function isOverrideEquip(item) {
        if (!item || !item.note) return false;
        return /<elementResist>/i.test(item.note);
    }

    // 获取装备数据库中配置的所有属性有效度 Map <elementId, rate>
    function getEquipElementRates(item) {
        const rateMap = new Map();
        if (!item || !item.traits) return rateMap;

        const TRAIT_ELEMENT_RATE = Game_BattlerBase.TRAIT_ELEMENT_RATE || 11;

        for (const trait of item.traits) {
            if (trait.code === TRAIT_ELEMENT_RATE) {
                const elementId = trait.dataId;
                const rate = trait.value;

                if (rateMap.has(elementId)) {
                    rateMap.set(elementId, rateMap.get(elementId) * rate);
                } else {
                    rateMap.set(elementId, rate);
                }
            }
        }
        return rateMap;
    }

    // 获取角色身上优先级最高的覆盖装备及其属性抗性表
    function getTargetOverrideData(actor) {
        if (!actor || !actor.isActor()) return null;

        const equips = actor.equips();
        const slots = actor.equipSlots();

        // 依据槽位类型优先级精确查找装备
        for (const targetSlotType of prioritySlots) {
            for (let i = 0; i < equips.length; i++) {
                const item = equips[i];
                const slotType = slots[i];

                if (slotType === targetSlotType && isOverrideEquip(item)) {
                    return {
                        item: item,
                        rates: getEquipElementRates(item)
                    };
                }
            }
        }

        // 兜底扫描：防止第三方槽位插件造成类型不匹配
        for (let i = 0; i < equips.length; i++) {
            const item = equips[i];
            if (isOverrideEquip(item)) {
                return {
                    item: item,
                    rates: getEquipElementRates(item)
                };
            }
        }

        return null;
    }

    // 核心计算拦截逻辑
    const applyOverride = function(target, elementId, originalValue) {
        const overrideData = getTargetOverrideData(target);

        if (overrideData !== null) {
            const rateMap = overrideData.rates;

            // 该装备配置了此属性抗性 -> 完全使用该装备特性的数值
            if (rateMap.has(elementId)) {
                return rateMap.get(elementId);
            }

            // 该装备没配置此属性抗性 -> 强制重置为 1.0（100% 原额伤害，无视角色固有抗性）
            return 1.0;
        }

        return originalValue;
    };

    // 拦截 Game_BattlerBase
    const _Game_BattlerBase_elementRate = Game_BattlerBase.prototype.elementRate;
    Game_BattlerBase.prototype.elementRate = function(elementId) {
        const baseRate = _Game_BattlerBase_elementRate.call(this, elementId);
        return applyOverride(this, elementId, baseRate);
    };

    // 拦截 Game_Actor (确保兼容性，防止继承链被打破)
    const _Game_Actor_elementRate = Game_Actor.prototype.elementRate;
    Game_Actor.prototype.elementRate = function(elementId) {
        const baseRate = _Game_Actor_elementRate.call(this, elementId);
        return applyOverride(this, elementId, baseRate);
    };

})();