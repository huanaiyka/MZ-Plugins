/*:
 * @target MZ
 * @plugindesc 敌人能力值倍率
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 1. 敌人备注标签设置能力值倍率。
 * 2. 插件参数中配置"变体列表"，按几率遇到高倍率敌人，
 *    且每个变体可以有自己的单独称呼。
 *
 * ============================================================================
 * 变体列表参数格式
 * ============================================================================
 * 在「变体列表」中添加条目，每条包含：
 *   enemyId     : 敌人ID
 *   chance      : 触发几率(%)，0~100；同敌人多条按顺序独立掷骰，先中先得
 *   nameMode    : prefix（前缀「显示名·原名」，以 = 开头则转为替换） / replace（完全替换）
 *   displayName : 变体称呼；前缀模式填「精英」→「精英·原名」，填「=精英」→「精英」，留空不改名
 *   rateTags    : 附加倍率标签（与敌人备注语法相同，可写多个），如：
 *                 <EnemyHPRate: 2.0><EnemyAtkRate: 1.5> 或 <EnemyHPRate: v[10]/100>
 *
 * 同一敌人可配置多条变体，例如：
 *   条目1：enemyId=1, chance=30, displayName=精英, rateTags=<EnemyHPRate: 2.0>
 *   条目2：enemyId=1, chance=10, displayName=首领, rateTags=<EnemyRate: 3.0>
 * 则先判定 30% 的「精英」，未命中再判定 10% 的「首领」。
 *
 * 注意：变体倍率是在「备注标签算出的原始倍率」基础上再乘算，
 *       即最终倍率 = 备注倍率 × 变体倍率。
 *
 * ============================================================================
 * 显示名称规则
 * ============================================================================
 *   "精英"     → 显示为 "精英·史莱姆"（前缀式，多只同种敌人时保留字母后缀如 "精英·史莱姆 A"）
 *   "=精英"    → 显示为 "精英"（完全替换，多只同种敌人时保留字母后缀如 "精英 A"）
 *   留空       → 不改变名称
 *
 * ============================================================================
 * 备注标签
 * ============================================================================
 *   <EnemyRate: x>           所有属性统一乘以 x
 *   <EnemyCombatRate: x>     攻/防/魔/魔防 统一乘以 x
 *   <EnemyPowRate: x>        攻击+魔法力
 *   <EnemyGuaRate: x>        防御+魔法防御
 *   <EnemyHPRate: x> / <EnemyMPRate: x>
 *   <EnemyAtkRate: x> / <EnemyDefRate: x>
 *   <EnemyMatRate: x> / <EnemyMdfRate: x>
 *   <EnemyAgiRate: x> / <EnemyLukRate: x>
 *
 * 倍率表达式支持：数字、v[变量ID]、v[变量ID]%、1+v[变量ID]/除数 等。
 *
 * ============================================================================
 * 覆盖优先级
 * ============================================================================
 *  全局标签 < 四属性标签 < 两属性标签 < 单属性标签
 *  变体倍率在"原始倍率"基础上再乘算。
 *
 * @param showVariantNameBeforeBattle
 * @text 战斗前显示变体名称
 * @desc 是否在战斗开始提示（如“XX 出现了！”）中显示变体名称。关闭则战前显示原名，入战后显示变体名。
 * @type boolean
 * @on 显示
 * @off 不显示
 * @default true
 *
 * @param variantList
 * @text 变体列表
 * @desc 每个条目对应一个敌人变体，按几率触发，可单独设置名称与倍率。
 * @type struct<Variant>[]
 * @default []
 */

/*~struct~Variant:
 * @param enemyId
 * @text 敌人ID
 * @desc 数据库中的敌人ID
 * @type enemy
 * @default 1
 *
 * @param chance
 * @text 触发几率(%)
 * @desc 0~100，遭遇该变体的概率（多条目按顺序独立判定，先命中先得）
 * @type number
 * @min 0
 * @max 100
 * @decimals 0
 * @default 30
 *
 * @param nameMode
 * @text 名称模式
 * @desc 前缀=精英·原名；完全替换=完全改名（displayName 以 = 开头时自动按完全替换处理）
 * @type select
 * @option 前缀
 * @value prefix
 * @option 完全替换
 * @value replace
 * @default prefix
 *
 * @param displayName
 * @text 显示名称
 * @desc 变体的称呼。前缀模式填"精英"→显示"精英·原名"；以"="开头如"=精英"→显示"精英"。
 * @type string
 * @default 精英
 *
 * @param rateTags
 * @text 倍率标签
 * @desc 直接粘贴备注标签原文（与敌人备注语法一致），可写多个标签。
 * @type note
 * @default "<EnemyHPRate: 2.0>"
 */

(() => {
    'use strict';

    const pluginName = 'Huanaiyka_EnemyParamRate';
    const params = PluginManager.parameters(pluginName);

    const SHOW_VARIANT_NAME_BEFORE_BATTLE = (params['showVariantNameBeforeBattle'] ?? 'true') === 'true';

    const PARAM_TAGS = [
        'EnemyHPRate', 'EnemyMPRate', 'EnemyAtkRate', 'EnemyDefRate',
        'EnemyMatRate', 'EnemyMdfRate', 'EnemyAgiRate', 'EnemyLukRate'
    ];

    // 调用深度计数，防止 name / originalName 互相调用导致重复叠加
    let _formattingDepth = 0;
    // 标记当前是否处于战斗开始前（如“XX 出现了！”提示阶段）
    let _isPreBattlePhase = false;

    // ============================================================
    // 一、解析倍率表达式
    // ============================================================
    function parseRateValue(rawStr) {
        if (!rawStr || typeof rawStr !== 'string' || rawStr.trim() === '') return null;
        const trimmed = rawStr.trim();

        let expression = trimmed.replace(/v\s*\[\s*(\d+)\s*\]/gi, (match, varId) => {
            const id = parseInt(varId, 10);
            if (id < 1 || !$gameVariables) return '0';
            const value = $gameVariables.value(id);
            return typeof value === 'number' && !isNaN(value) ? value.toString() : '0';
        });

        expression = expression.replace(/(\d+(?:\.\d+)?)\s*%/g, (m, num) =>
            (parseFloat(num) / 100).toString());

        try {
            const sanitized = expression.replace(/[^0-9+\-*/().]/g, '');
            if (!sanitized) return null;
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

    // ============================================================
    // 二、从标签文本提取 8 项倍率数组
    // ============================================================
    function extractRatesFromText(text) {
        const rates = [1, 1, 1, 1, 1, 1, 1, 1];
        if (!text) return rates;

        const note = String(text);

        function extractValue(tagName) {
            const regex = new RegExp(`<${tagName}:\\s*([^>]+)>`, 'i');
            const match = note.match(regex);
            if (!match) return null;
            return parseRateValue(match[1].trim());
        }

        const g = extractValue('EnemyRate');
        if (g !== null) rates.fill(g);

        const c = extractValue('EnemyCombatRate');
        if (c !== null) rates[2] = rates[3] = rates[4] = rates[5] = c;

        const p = extractValue('EnemyPowRate');
        if (p !== null) { rates[2] = p; rates[4] = p; }

        const gu = extractValue('EnemyGuaRate');
        if (gu !== null) { rates[3] = gu; rates[5] = gu; }

        PARAM_TAGS.forEach((tag, i) => {
            const v = extractValue(tag);
            if (v !== null) rates[i] = v;
        });

        for (let i = 0; i < 8; i++) {
            if (typeof rates[i] !== 'number' || isNaN(rates[i]) || rates[i] <= 0) rates[i] = 1;
        }
        return rates;
    }

    function getParamRates(dataEnemy) {
        if (!dataEnemy) return [1, 1, 1, 1, 1, 1, 1, 1];
        return extractRatesFromText(dataEnemy.note || '');
    }

    // ============================================================
    // 三、解析显示名称与模式（支持 "=精英" → "精英"）
    // ============================================================
    function parseDisplayNameConfig(rawName, rawMode) {
        const trimmed = String(rawName || '').trim();
        if (!trimmed) {
            return { nameMode: rawMode === 'replace' ? 'replace' : 'prefix', displayName: '' };
        }
        if (trimmed.startsWith('=')) {
            return {
                nameMode: 'replace',
                displayName: trimmed.slice(1).trim()
            };
        }
        return {
            nameMode: rawMode === 'replace' ? 'replace' : 'prefix',
            displayName: trimmed
        };
    }

    // ============================================================
    // 四、解析 struct<Variant>[] 列表
    // ============================================================
    let VARIANT_GROUPS = null;

    function loadVariants() {
        if (VARIANT_GROUPS) return VARIANT_GROUPS;

        let rawArr = [];
        try {
            rawArr = JSON.parse(params['variantList'] || '[]');
        } catch (e) {
            console.error('变体列表 JSON 解析失败', e);
            rawArr = [];
        }

        const list = [];
        for (const rawItem of rawArr) {
            let item = rawItem;
            if (typeof item === 'string') {
                try { item = JSON.parse(item); } catch (e) { continue; }
            }

            const enemyId = Number(item.enemyId) || 0;
            const chance = Number(item.chance) || 0;
            if (enemyId < 1 || chance <= 0) continue;

            let rateStr = item.rateTags ?? '';
            try {
                if (typeof rateStr === 'string') rateStr = JSON.parse(rateStr);
            } catch (_) { /* 保持原样 */ }

            const rawTagText = String(rateStr || '');
            const nameCfg = parseDisplayNameConfig(item.displayName, item.nameMode);

            list.push({
                enemyId,
                chance: Math.min(100, chance),
                nameMode: nameCfg.nameMode,
                displayName: nameCfg.displayName,
                rates: extractRatesFromText(rawTagText)
            });
        }

        const grouped = new Map();
        for (const v of list) {
            if (!grouped.has(v.enemyId)) grouped.set(v.enemyId, []);
            grouped.get(v.enemyId).push(v);
        }
        VARIANT_GROUPS = grouped;
        return grouped;
    }

    function rollVariant(enemyId) {
        const id = Number(enemyId);
        if (!id || id < 1) return null;
        const variants = loadVariants().get(id);
        if (!variants || !variants.length) return null;
        for (const v of variants) {
            if (Math.random() * 100 < v.chance) return v;
        }
        return null;
    }

    // ============================================================
    // 五、变体缓存（同一实例稳定）
    // ============================================================
    const _enemyVariantCache = new WeakMap();

    function getEnemyIdOf(enemy) {
        if (!enemy) return 0;
        if (typeof enemy.enemyId === 'function') {
            try {
                const id = enemy.enemyId();
                if (id > 0) return id;
            } catch (_) { /* ignore */ }
        }
        if (typeof enemy._enemyId === 'number' && enemy._enemyId > 0) {
            return enemy._enemyId;
        }
        return 0;
    }

    const _Game_Enemy_setup = Game_Enemy.prototype.setup;
    Game_Enemy.prototype.setup = function(enemyId, x, y) {
        // 必须在 recoverAll() 之前写入变体缓存，否则初始 HP 会按未乘算变体倍率的 mhp 补满
        _enemyVariantCache.set(this, rollVariant(enemyId));
        _Game_Enemy_setup.call(this, enemyId, x, y);
    };

    function getVariantFor(enemy) {
        if (!enemy) return null;
        if (_isPreBattlePhase && !SHOW_VARIANT_NAME_BEFORE_BATTLE) {
            return null;
        }
        if (!_enemyVariantCache.has(enemy)) {
            const id = getEnemyIdOf(enemy);
            _enemyVariantCache.set(enemy, rollVariant(id));
        }
        return _enemyVariantCache.get(enemy);
    }

    // ============================================================
    // 名称格式化（防重复前缀/防重入，保留字母后缀）
    // ============================================================
    function applyVariantName(baseName, variant, enemy) {
        if (typeof baseName !== 'string') return baseName;
        if (!variant || !variant.displayName) return baseName;

        const display = variant.displayName;
        const suffix = (enemy && enemy._plural && enemy._letter) ? (' ' + enemy._letter) : '';

        if (variant.nameMode === 'replace') {
            if (baseName === display || baseName === display + suffix) {
                return baseName;
            }
            // 若 baseName 末尾已有字母后缀（兼容自定义字母逻辑），则保留
            const tailMatch = baseName.match(/(?: [A-Z])$/);
            if (tailMatch) {
                return display + tailMatch[0];
            }
            return display + suffix;
        }

        const prefix = display + '·';
        if (baseName.startsWith(prefix)) {
            return baseName;
        }
        return prefix + baseName;
    }

    // ============================================================
    // 六、覆写 paramBase：基础倍率 × 变体倍率
    // ============================================================
    const _Game_Enemy_paramBase = Game_Enemy.prototype.paramBase;
    Game_Enemy.prototype.paramBase = function(paramId) {
        const originalBase = _Game_Enemy_paramBase.call(this, paramId);
        if (typeof originalBase !== 'number' || isNaN(originalBase)) return 0;

        try {
            const baseRates = getParamRates(this.enemy());
            let rate = baseRates[paramId] ?? 1;

            const variant = _enemyVariantCache.get(this) ?? null;
            if (variant && variant.rates) {
                rate *= variant.rates[paramId] ?? 1;
            }

            const result = Math.round(originalBase * rate);
            return Number.isFinite(result) ? result : originalBase;
        } catch (e) {
            console.error("EnemyParamRate 计算错误:", e);
            return originalBase;
        }
    };

    // ============================================================
    // 七、覆写 originalName 与 name：确保完全替换与前缀模式均生效
    // ============================================================
    if (Game_Enemy.prototype.originalName) {
        const _Game_Enemy_originalName = Game_Enemy.prototype.originalName;
        Game_Enemy.prototype.originalName = function() {
            const baseName = _Game_Enemy_originalName.call(this);
            if (_formattingDepth > 0) {
                return baseName;
            }
            const variant = getVariantFor(this);
            if (!variant || !variant.displayName) return baseName;
            if (variant.nameMode === 'replace') {
                return baseName === variant.displayName ? baseName : variant.displayName;
            }
            const prefix = variant.displayName + '·';
            return baseName.startsWith(prefix) ? baseName : prefix + baseName;
        };
    }

    const _Game_Enemy_name = Game_Enemy.prototype.name;
    Game_Enemy.prototype.name = function() {
        if (_formattingDepth > 0) {
            return _Game_Enemy_name.call(this);
        }
        _formattingDepth++;
        try {
            const rawName = _Game_Enemy_name.call(this);
            const variant = getVariantFor(this);
            return applyVariantName(rawName, variant, this);
        } finally {
            _formattingDepth--;
        }
    };

    // ============================================================
    // 八、覆写 Game_Troop.prototype.enemyNames 与 BattleManager 战前提示
    // ============================================================
    const _Game_Troop_enemyNames = Game_Troop.prototype.enemyNames;
    Game_Troop.prototype.enemyNames = function() {
        for (const member of this.members()) {
            if (member && !_enemyVariantCache.has(member)) {
                _enemyVariantCache.set(member, rollVariant(getEnemyIdOf(member)));
            }
        }
        return _Game_Troop_enemyNames.call(this);
    };

    const _BattleManager_displayStartMessages = BattleManager.displayStartMessages;
    BattleManager.displayStartMessages = function() {
        _isPreBattlePhase = true;
        try {
            _BattleManager_displayStartMessages.call(this);
        } finally {
            _isPreBattlePhase = false;
        }
    };

})();