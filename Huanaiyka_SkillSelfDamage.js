/*:
 * @target MZ
 * @plugindesc 制作对自身造成反伤的技能。
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 本插件可用于制作命中敌人后，对使用者自身造成反伤的技能。
 * 
============================================================================
 * 技能备注标签
 * ============================================================================
 * 1. 固定数值反伤
 *    <SelfDamage: 数值>
 *    例：<SelfDamage: 50>
 *
 * 2. 比例反伤（基于对敌人造成的伤害）
 *    <SelfDamage: 百分比%>
 *    例：<SelfDamage: 30%>
 *
 * 3. 公式反伤
 *    <SelfDamageFormula: 公式>
 *    例：<SelfDamageFormula: a.hp / 10>
 *    可用变量：a - 使用者；damageDealt - 本次造成的伤害
 *
 * 4. 无视防御（可选，默认跟随全局参数）
 *    <SelfDamageIgnoreDefense: true>
 *    <SelfDamageIgnoreDefense: false>
 *    设为 true 时，计算出的反伤值将无视使用者防御力，直接扣除；
 *    设为 false 时，反伤值会受到使用者防御力的减免
 *    （减免公式：最终伤害 = 原伤害 * 100 / (100 + 防御)）。
 *
 * ============================================================================
 * 注意事项
 * ============================================================================
 * 1. 当「允许自伤致死」为 true 时，反伤可能使使用者死亡，会正常触发死亡动画并结算战斗。
 * 2. 当「允许自伤致死」为 false 时，反伤会被限制为 (当前 HP - 1)，确保使用者存活。
 * 3. 公式模式下若公式语法错误（如除以 0），会自动返回 0，不会导致游戏崩溃。
 *
 *
 * @param delayMs
 * @text 自伤延迟毫秒数
 * @desc 自伤相对于敌人受伤的延迟时间（毫秒），默认 300。
 * @type number
 * @default 300
 *
 * @param defaultIgnoreDefense
 * @text 默认无视防御
 * @desc 若为 true，则所有自伤默认无视自身防御（技能标签可单独覆盖）。默认 true。
 * @type boolean
 * @default true
 *
 * @param allowDeath
 * @text 允许自伤致死
 * @desc 若为 true，反伤可使使用者 HP 归零并正常死亡；若 false，则使用者至少保留 1 HP。默认 true。
 * @type boolean
 * @default true
 * 
 */
(() => {
    const parameters = PluginManager.parameters('Huanaiyka_SkillSelfDamage');
    const DELAY_MS = parseInt(parameters['delayMs'] || '300', 10);
    const DEFAULT_IGNORE_DEFENSE = String(parameters['defaultIgnoreDefense'] || 'true') === 'true';
    const ALLOW_DEATH = String(parameters['allowDeath'] || 'true') === 'true';

    function parseConfig(skill) {
        if (!skill) return null;
        const note = skill.note;
        let config = {
            enabled: false,
            ignoreDefense: DEFAULT_IGNORE_DEFENSE,
            type: null,
            value: null
        };

        const tag = /<SelfDamage:\s*([\d.]+%?)\s*>/i.exec(note);
        if (tag) {
            let v = tag[1];
            if (v.includes('%')) {
                config.enabled = true;
                config.type = 'percent';
                config.value = parseFloat(v) / 100;
            } else {
                config.enabled = true;
                config.type = 'fixed';
                config.value = parseFloat(v);
            }
        } else {
            const formulaTag = /<SelfDamageFormula:\s*(.+?)\s*>/i.exec(note);
            if (formulaTag) {
                config.enabled = true;
                config.type = 'formula';
                config.value = formulaTag[1].trim();
            }
        }

        if (!config.enabled) return null;

        const ignoreTag = /<SelfDamageIgnoreDefense:\s*(true|false)\s*>/i.exec(note);
        if (ignoreTag) {
            config.ignoreDefense = ignoreTag[1] === 'true';
        }

        return config;
    }

    function calcDamage(user, damageDealt, config) {
        let dmg = 0;
        try {
            if (config.type === 'fixed') {
                dmg = config.value;
            } else if (config.type === 'percent') {
                dmg = damageDealt * config.value;
            } else if (config.type === 'formula') {
                const a = user;
                const damageDealt = damageDealt;
                dmg = eval(config.value);
            }
        } catch(e) {
            dmg = 0;
        }
        return Math.max(0, Math.floor(dmg));
    }

    function applySelfDamage(user, damage, ignoreDefense) {
        if (damage <= 0 || user.isDead()) return;
        let final = damage;
        if (!ignoreDefense) {
            const def = user.def;
            final = Math.floor(damage * 100 / (100 + def));
            final = Math.max(1, final);
        }
        // 根据是否允许死亡决定是否限制最小剩余 HP
        if (!ALLOW_DEATH) {
            final = Math.min(final, user.hp - 1);
        }
        // 若允许死亡，不需要限制（gainHp 会自动截断到 0）
        user.gainHp(-final);
        if (user.startDamagePopup) user.startDamagePopup(final, false);
        if (user.performDamage) user.performDamage();
        if (user.isDead() && !user.isPreserved()) {
            user.performCollapse();
            BattleManager.checkBattleEnd();
        }
        if (user.refresh) user.refresh();
    }

    const _makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        const baseDamage = _makeDamageValue.call(this, target, critical);
        if (baseDamage > 0 && this.item() && DataManager.isSkill(this.item())) {
            const skill = this.item();
            const config = parseConfig(skill);
            if (config && config.enabled) {
                const user = this.subject();
                if (user && user.isAlive()) {
                    const selfDmg = calcDamage(user, baseDamage, config);
                    if (selfDmg > 0) {
                        setTimeout(() => applySelfDamage(user, selfDmg, config.ignoreDefense), DELAY_MS);
                    }
                }
            }
        }
        return baseDamage;
    };

    if (!DataManager.isSkill) {
        DataManager.isSkill = function(item) {
            return item && item.skillId !== undefined;
        };
    }
})();