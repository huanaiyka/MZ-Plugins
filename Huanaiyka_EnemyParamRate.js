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
 * ============================================================================
 * 倍率表达式（重点）
 * ============================================================================
 * 
 * 【基础倍率】
 *   直接写数字：1.5、2、0.8 等
 * 
 * 【变量增强 - 渐进式增长】
 *   v[变量ID]              → 倍率 = 变量值（直接使用）
 *   v[变量ID]%             → 倍率 = 变量值 / 100
 *   v[变量ID]/除数          → 倍率 = 变量值 / 除数
 *   1+v[变量ID]/除数        → 倍率 = 1 + 变量值/除数  ★推荐★
 *   1+v[变量ID]%            → 倍率 = 1 + 变量值/100
 * 
 * 【示例】
 *   变量1 = 10，标签写 1+v[1]/100  → 倍率 = 1 + 10/100 = 1.1
 *   变量1 = 20，标签写 1+v[1]/100  → 倍率 = 1 + 20/100 = 1.2
 *   变量1 = 50，标签写 1+v[1]/100  → 倍率 = 1 + 50/100 = 1.5
 *   变量1 = 100，标签写 1+v[1]/100 → 倍率 = 1 + 100/100 = 2.0
 *
 *   变量5 = 5，标签写 1+v[5]/20    → 倍率 = 1 + 5/20 = 1.25
 *   变量5 = 10，标签写 1+v[5]/20   → 倍率 = 1 + 10/20 = 1.5
 *
 * ============================================================================
 * 覆盖优先级（由低到高）
 * ============================================================================
 *  全局标签 < 四属性标签 < 两属性标签 < 单属性标签
 * ============================================================================
 */

(() => {
    'use strict';

    /**
     * 解析倍率值，支持完整表达式（如 1+v[1]/100）
     * @param {string} rawStr - 原始字符串
     * @returns {number|null} - 解析后的数值，无效时返回 null
     */
    function parseRateValue(rawStr) {
        if (!rawStr || rawStr.trim() === '') return null;
        
        const trimmed = rawStr.trim();
        
        // 替换所有 v[数字] 为实际的变量值
        let expression = trimmed.replace(/v\s*\[\s*(\d+)\s*\]/gi, (match, varId) => {
            const id = parseInt(varId, 10);
            if (id < 1) return '0';
            const value = $gameVariables.value(id);
            return typeof value === 'number' && !isNaN(value) ? value.toString() : '0';
        });
        
        // 处理 % 符号：将 "100%" 转换为 "1"，将 "50%" 转换为 "0.5"
        // 注意：这里只处理数字后紧跟 % 的情况
        expression = expression.replace(/(\d+(?:\.\d+)?)\s*%/g, (match, num) => {
            return (parseFloat(num) / 100).toString();
        });
        
        // 安全计算表达式
        try {
            // 只允许数字、运算符、小数点、括号
            const sanitized = expression.replace(/[^0-9+\-*/().]/g, '');
            if (!sanitized) return null;
            
            // 使用 Function 安全计算
            const result = Function('"use strict"; return (' + sanitized + ')')();
            
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                return result > 0 ? result : null;
            }
            return null;
        } catch (e) {
            console.warn('倍率表达式解析失败:', expression, e);
            return null;
        }
    }

    /**
     * 解析敌人的备注标签并返回倍率数组
     * @param {RPG.Enemy} dataEnemy 
     * @returns {number[]}
     */
    function getParamRates(dataEnemy) {
        if (!dataEnemy) return [1, 1, 1, 1, 1, 1, 1, 1];
        
        const rates = [1, 1, 1, 1, 1, 1, 1, 1];
        const note = dataEnemy.note || "";

        function extractValue(tagName) {
            const regex = new RegExp(`<${tagName}:\\s*([^>]+)>`, 'i');
            const match = note.match(regex);
            if (!match) return null;
            const raw = match[1].trim();
            return parseRateValue(raw);
        }

        // 1. 全局倍率
        const globalRate = extractValue('EnemyRate');
        if (globalRate !== null) {
            rates.fill(globalRate);
        }

        // 2. 攻防四属性组合标签
        const combatRate = extractValue('EnemyCombatRate');
        if (combatRate !== null) {
            rates[2] = combatRate;
            rates[3] = combatRate;
            rates[4] = combatRate;
            rates[5] = combatRate;
        }

        // 3. 两属性组合标签
        const powRate = extractValue('EnemyPowRate');
        if (powRate !== null) {
            rates[2] = powRate;
            rates[4] = powRate;
        }

        const guaRate = extractValue('EnemyGuaRate');
        if (guaRate !== null) {
            rates[3] = guaRate;
            rates[5] = guaRate;
        }

        // 4. 单属性标签
        const tags = [
            'EnemyHPRate',
            'EnemyMPRate',
            'EnemyAtkRate',
            'EnemyDefRate',
            'EnemyMatRate',
            'EnemyMdfRate',
            'EnemyAgiRate',
            'EnemyLukRate'
        ];

        tags.forEach((tag, paramId) => {
            const val = extractValue(tag);
            if (val !== null) {
                rates[paramId] = val;
            }
        });

        // 5. 有效性检查
        for (let i = 0; i < rates.length; i++) {
            if (typeof rates[i] !== 'number' || isNaN(rates[i]) || rates[i] <= 0) {
                rates[i] = 1;
            }
        }

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