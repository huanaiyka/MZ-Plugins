/*:
 * @target MZ
 * @plugindesc 制作对自身造成反伤的技能
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 本插件可用于制作命中敌人后，对使用者自身造成反伤的技能。
 * 
 * 技能的备注栏添加标签，即可让该技能命中敌人后，使用者自身
 * 也受到对应数值或百分比的伤害。
 * ============================================================================
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
 *
 * ============================================================================
 * 参数说明
 * ============================================================================
 * @param delayMs
 * @text 自伤延迟毫秒数
 * @desc 自伤相对于敌人受伤的延迟时间（毫秒）。默认 300。
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

    // 用于管理战斗中的延迟自伤队列
    let selfDamageQueue = [];

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

        if (!ALLOW_DEATH) {
            final = Math.min(final, user.hp - 1);
        }

        user.gainHp(-final);
        if (user.startDamagePopup) user.startDamagePopup();
        if (user.performDamage) user.performDamage();

        // 倒下动画处理（已修复 isPreserved 报错）
        if (user.isDead()) {
            user.performCollapse();
        }
        if (user.refresh) user.refresh();
    }

    // 1. 技能命中时，将自伤任务按照配置的 delayMs 推进队列
    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);

        const result = target.result();
        if (result.isHit() && result.hpDamage > 0 && this.item() && DataManager.isSkill(this.item())) {
            const skill = this.item();
            const config = parseConfig(skill);
            if (config && config.enabled) {
                const user = this.subject();
                if (user && user.isAlive()) {
                    const selfDmg = calcDamage(user, result.hpDamage, config);
                    if (selfDmg > 0) {
                        selfDamageQueue.push({
                            user: user,
                            damage: selfDmg,
                            ignoreDefense: config.ignoreDefense,
                            triggerTime: Date.now() + DELAY_MS
                        });
                    }
                }
            }
        }
    };

    // 2. 挂载到主逻辑帧更新中安全结算自伤
    const _BattleManager_update = BattleManager.update;
    BattleManager.update = function(timeActive) {
        _BattleManager_update.call(this, timeActive);

        if (selfDamageQueue.length > 0) {
            const now = Date.now();
            for (let i = selfDamageQueue.length - 1; i >= 0; i--) {
                const item = selfDamageQueue[i];
                if (now >= item.triggerTime) {
                    applySelfDamage(item.user, item.damage, item.ignoreDefense);
                    selfDamageQueue.splice(i, 1);
                }
            }
        }
    };

    // 3. 胜利逻辑判定修复：优先判定敌方死亡
    BattleManager.checkBattleEnd = function() {
        if (this.isBattleEnd()) {
            return true;
        }
        if ($gameTroop.isAllDead()) {
            this.processVictory();
            return true;
        }
        if ($gameParty.isAllDead()) {
            this.processDefeat();
            return true;
        }
        return false;
    };

    // 战斗开始时初始化队列
    const _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        _BattleManager_setup.call(this, troopId, canEscape, canLose);
        selfDamageQueue = [];
    };
})();