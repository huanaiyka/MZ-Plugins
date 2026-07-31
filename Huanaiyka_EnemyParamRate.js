/*:
 * @target MZ
 * @plugindesc 通过备注标签为敌人设置能力值倍率
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件允许你在敌人的备注栏中写入特定标签，从而直接提升或降低该敌人的
 * 各项基础属性倍率。倍率会作用于数据库原始数值，然后再与特性叠加计算。
 *
 * ============================================================================
 * 标签格式（不区分大小写）
 * ============================================================================
 * 以下标签均支持大小写混合，例如 <EnemyRate>、<enemyrate>、<ENEMYRATE> 均可识别。
 *
 *   <EnemyRate: x>           // 所有属性统一乘以 x (例如 1.5 表示全部提升50%)
 *   <EnemyHPRate: x>         // 单独设置 HP 倍率
 *   <EnemyMPRate: x>         // 单独设置 MP 倍率
 *   <EnemyAtkRate: x>        // 单独设置 攻击力 倍率
 *   <EnemyDefRate: x>        // 单独设置 防御力 倍率
 *   <EnemyMatRate: x>        // 单独设置 魔法力 倍率
 *   <EnemyMdfRate: x>        // 单独设置 魔法防御 倍率
 *   <EnemyAgiRate: x>        // 单独设置 敏捷度 倍率
 *   <EnemyLukRate: x>        // 单独设置 幸运 倍率
 *
 * 如果同时写了 <EnemyRate> 和单独的属性标签，则单独的标签会覆盖整体倍率。
 * 倍率可以是小数或整数，例如：0.5、1.2、3 等。
 * 最终属性值采用“四舍五入”。
 * ============================================================================
 * 标签书写方式
 * ============================================================================
 * 1. 标签可以连续写在一起，不需要空格或换行分隔，例如：
 *      <EnemyRate: 2><EnemyMPRate: 1>
 *    效果：所有属性变为 2 倍，但 MP 保持原始值（1 倍）。
 *
 * 2. 也可以用空格、换行分隔，更加清晰：
 *      <EnemyRate: 2>
 *      <EnemyMPRate: 1>
 *
 * 3. 大小写任意混合均可：
 *      <enemyrate: 2>
 *      <ENEMYMPRATE: 1>
 *      <EnemyHpRate: 3>
 *
 * ============================================================================
 * 示例
 * ============================================================================
 *   <EnemyRate: 2>                     → 所有属性变为 2 倍
 *   <EnemyHPRate: 3>                   → 仅 HP 变为 3 倍，其他属性保持原始值
 *   <EnemyAtkRate: 2.5><EnemyAgiRate: 2>
 *                                      → 攻击力 2.5 倍，敏捷 2 倍，其余不变
 *   <EnemyRate: 2><EnemyMPRate: 0.5>   → 所有属性 2 倍，但 MP 单独变成 0.5 倍
 *   <enemyrate: 1.5><enemyatkrate: 2>  → 全部 1.5 倍，攻击力再覆盖为 2 倍
 *
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 将本插件保存为 .js 文件（例如 EnemyParamRate.js），放入项目的 js/plugins 文件夹。
 * 2. 在 RPG Maker MZ 的插件管理器中添加本插件。
 * 3. 建议将本插件放在插件列表的**最底部**（最后加载），避免与其他修改 Game_Enemy 的插件冲突。
 * 4. 在任意敌人的“备注”栏中按上述格式写入标签即可生效。
 *
 * 注意：本插件不影响数据库显示，只在战斗和菜单查看能力值时实际生效。
 */

(function() {
    'use strict';

    // 缓存倍率，避免重复解析（但不在initialize中预存）
    const rateCache = new Map();

    function getParamRates(enemy) {
        const enemyId = enemy.enemyId();
        if (rateCache.has(enemyId)) {
            return rateCache.get(enemyId);
        }

        // 默认倍率
        const rates = [1, 1, 1, 1, 1, 1, 1, 1];
        const note = enemy.enemy().note || "";
        
        function extractValue(tagName) {
            const regex = new RegExp(`<${tagName}:\\s*([\\d.]+)>`, 'i');
            const match = note.match(regex);
            if (!match) return null;
            const num = parseFloat(match[1]);
            return isNaN(num) ? null : num;
        }

        const globalRate = extractValue('EnemyRate');
        if (globalRate !== null) {
            for (let i = 0; i < rates.length; i++) rates[i] = globalRate;
        }

        const hpRate = extractValue('EnemyHPRate');
        if (hpRate !== null) rates[0] = hpRate;
        const mpRate = extractValue('EnemyMPRate');
        if (mpRate !== null) rates[1] = mpRate;
        const atkRate = extractValue('EnemyAtkRate');
        if (atkRate !== null) rates[2] = atkRate;
        const defRate = extractValue('EnemyDefRate');
        if (defRate !== null) rates[3] = defRate;
        const matRate = extractValue('EnemyMatRate');
        if (matRate !== null) rates[4] = matRate;
        const mdfRate = extractValue('EnemyMdfRate');
        if (mdfRate !== null) rates[5] = mdfRate;
        const agiRate = extractValue('EnemyAgiRate');
        if (agiRate !== null) rates[6] = agiRate;
        const lukRate = extractValue('EnemyLukRate');
        if (lukRate !== null) rates[7] = lukRate;

        // 有效性检查
        for (let i = 0; i < rates.length; i++) {
            if (typeof rates[i] !== 'number' || isNaN(rates[i]) || rates[i] <= 0) {
                rates[i] = 1;
            }
        }

        rateCache.set(enemyId, rates);
        return rates;
    }

    // 仅覆写 paramBase
    const _Game_Enemy_paramBase = Game_Enemy.prototype.paramBase;
    Game_Enemy.prototype.paramBase = function(paramId) {
        const originalBase = _Game_Enemy_paramBase.call(this, paramId);
        if (typeof originalBase !== 'number' || isNaN(originalBase)) {
            return 0;
        }
        try {
            const rates = getParamRates(this);
            let rate = rates[paramId];
            if (typeof rate !== 'number' || isNaN(rate) || rate <= 0) rate = 1;
            const result = Math.round(originalBase * rate);
            return isFinite(result) ? result : originalBase;
        } catch (e) {
            console.error("EnemyParamRate 计算错误:", e);
            return originalBase;
        }
    };
})();

    // 可选：如果你希望显示的数值是整数，已使用 Math.floor 向下取整。
    // 若希望四舍五入，可改为 Math.round。
