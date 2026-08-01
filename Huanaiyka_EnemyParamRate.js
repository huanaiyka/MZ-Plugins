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
 * 各项基础属性倍率。
 * 倍率会作用于数据库原始数值，然后再与特性叠加计算。
 *
 * ============================================================================
 * 标签格式（不区分大小写）
 * ============================================================================
 * 【全局倍率】
 *   <EnemyRate: x>           // 所有属性统一乘以 x
 *
 * 【四属性组合标签】
 *   <EnemyCombatRate: x>     // 攻击 + 防御 + 魔法力 + 魔法防御 统一乘以 x
 *
 * 【两属性组合标签】
 *   <EnemyPowRate: x>        // 攻击 + 魔法力（物攻+特攻）统一乘以 x
 *   <EnemyGuaRate: x>        // 防御 + 魔法防御（物防+特防）统一乘以 x
 *
 * 【单属性标签】
 *   <EnemyHPRate: x>         // 单独设置 HP 倍率
 *   <EnemyMPRate: x>         // 单独设置 MP 倍率
 *   <EnemyAtkRate: x>        // 单独设置 攻击力 倍率
 *   <EnemyDefRate: x>        // 单独设置 防御力 倍率
 *   <EnemyMatRate: x>        // 单独设置 魔法力 倍率
 *   <EnemyMdfRate: x>        // 单独设置 魔法防御 倍率
 *   <EnemyAgiRate: x>        // 单独设置 敏捷度 倍率
 *   <EnemyLukRate: x>        // 单独设置 幸运 倍率
 *
 * 倍率可以是小数或整数，例如：0.5、1.2、3 等。
 * 最终属性值采用“四舍五入”。
 * 
============================================================================
 * 覆盖优先级规则（由低到高）
 * ============================================================================
 *  全局标签 < 四属性标签 < 两属性标签 < 单属性标签
 *
 *  例如：
 *  <EnemyCombatRate: 2><EnemyAtkRate: 3>
 *  → 攻/防/魔攻/魔防 变 2 倍，但攻击力（ATK）会被单属性标签覆盖变成 3 倍。
 *
 * ============================================================================
 */

(() => {
    'use strict';

    /**
     * 解析敌人的备注标签并返回倍率数组
     * @param {RPG.Enemy} dataEnemy 
     * @returns {number[]}
     */
    function getParamRates(dataEnemy) {
        if (!dataEnemy) return [1, 1, 1, 1, 1, 1, 1, 1];
        
        // 读取缓存
        if (dataEnemy._enemyParamRates) {
            return dataEnemy._enemyParamRates;
        }

        const rates = [1, 1, 1, 1, 1, 1, 1, 1];
        const note = dataEnemy.note || "";

        function extractValue(tagName) {
            const regex = new RegExp(`<${tagName}:\\s*([+-]?\\d+(?:\\.\\d+)?)>`, 'i');
            const match = note.match(regex);
            if (!match) return null;
            const num = parseFloat(match[1]);
            return isNaN(num) ? null : num;
        }

        // 1. 全局倍率 (0~7)
        const globalRate = extractValue('EnemyRate');
        if (globalRate !== null) {
            rates.fill(globalRate);
        }

        // 2. 攻防四属性组合标签 (2: ATK, 3: DEF, 4: MAT, 5: MDF)
        const combatRate = extractValue('EnemyCombatRate');
        if (combatRate !== null) {
            rates[2] = combatRate; // ATK
            rates[3] = combatRate; // DEF
            rates[4] = combatRate; // MAT
            rates[5] = combatRate; // MDF
        }

        // 3. 两属性组合标签
        // 攻击 + 魔攻 (2: ATK, 4: MAT)
        const powRate = extractValue('EnemyPowRate');
        if (powRate !== null) {
            rates[2] = powRate;
            rates[4] = powRate;
        }

        // 防御 + 魔防 (3: DEF, 5: MDF)
        const guaRate = extractValue('EnemyGuaRate');
        if (guaRate !== null) {
            rates[3] = guaRate;
            rates[5] = guaRate;
        }

        // 4. 单属性标签（优先级最高，覆盖前面的设定）
        const tags = [
            'EnemyHPRate',  // 0: MHP
            'EnemyMPRate',  // 1: MMP
            'EnemyAtkRate', // 2: ATK
            'EnemyDefRate', // 3: DEF
            'EnemyMatRate', // 4: MAT
            'EnemyMdfRate', // 5: MDF
            'EnemyAgiRate', // 6: AGI
            'EnemyLukRate'  // 7: LUK
        ];

        tags.forEach((tag, paramId) => {
            const val = extractValue(tag);
            if (val !== null) {
                rates[paramId] = val;
            }
        });

        // 5. 有效性检查与兜底（非数字或小于等于0时重置为1）
        for (let i = 0; i < rates.length; i++) {
            if (typeof rates[i] !== 'number' || isNaN(rates[i]) || rates[i] <= 0) {
                rates[i] = 1;
            }
        }

        // 写入缓存
        dataEnemy._enemyParamRates = rates;
        return rates;
    }

    // 覆写 Game_Enemy.prototype.paramBase
    const _Game_Enemy_paramBase = Game_Enemy.prototype.paramBase;
    Game_Enemy.prototype.paramBase = function(paramId) {
        const originalBase = _Game_Enemy_paramBase.call(this, paramId);
        
        if (typeof originalBase !== 'number' || isNaN(originalBase)) {
            return 0;
        }

        try {
            const dataEnemy = this.enemy();
            const rates = getParamRates(dataEnemy);
            const rate = rates[paramId] ?? 1;

            const result = Math.round(originalBase * rate);
            return Number.isFinite(result) ? result : originalBase;
        } catch (e) {
            console.error("EnemyParamRate 计算错误:", e);
            return originalBase;
        }
    };
})();