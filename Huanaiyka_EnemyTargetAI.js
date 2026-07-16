//=============================================================================
// Huanaiyka_EnemyTargetAI.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 敌人智能AI：不会对目标使用元素无效的技能，支持进攻偏好
 * @author 幻爱
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件让敌人更智能：
 * 1. 自动避开元素无效技能（不会用火焰打火免疫角色）。
 * 2. 支持进攻偏好规则（优先打血量最低、带有特定状态、被属性克制、六围高低等）。
 * 两者可同时使用（先过滤免疫，再按偏好选目标），也可单独使用其中一种。
 * 如果所有技能对所有目标都免疫，敌人会“不得已”打出免疫伤害（不会跳过回合）。
 *
 * 3. 在技能的备注栏中填写 <SkillNoSelf>
 * 当敌人使用目标为“我方单体”（对怪物而言即它的队友）的技能时，会自动把自身从目标池中剔除，
 * 绝不会选择自己作为目标（除非场上仅剩它一人，为了防止卡死会进行兜底）。
 *
 * ============================================================================
 * 进攻偏好标签（可独立使用，不依赖 EnemyElementAvoid）
 * ============================================================================
 *
 * 在数据库的敌人备注栏中写入以下标签（不区分大小写）：
 * 
 * 【血量/蓝量/TP/等级】（均为当前数值，除标注“最大值”外）
 *   <TargetPref: lowest_hp>         → 当前 HP 最小的角色
 *   <TargetPref: highest_hp>        → 当前 HP 最大的角色
 *   <TargetPref: lowest_mp>         → 当前 MP 最小的角色
 *   <TargetPref: highest_mp>        → 当前 MP 最大的角色
 *   <TargetPref: lowest_tp>         → 当前 TP 最小的角色
 *   <TargetPref: highest_tp>        → 当前 TP 最大的角色
 *   <TargetPref: lowest_level>      → 等级最低的角色
 *   <TargetPref: highest_level>     → 等级最高的角色
 *
 * 【基于最大值】
 *   <TargetPref: lowest_maxhp>      → 最大 HP 最小的角色
 *   <TargetPref: highest_maxhp>     → 最大 HP 最大的角色
 *   <TargetPref: lowest_maxmp>      → 最大 MP 最小的角色
 *   <TargetPref: highest_maxmp>     → 最大 MP 最大的角色
 *
 * 【六围属性】（atk 物攻, def 物防, mat 魔攻, mdf 魔防, agi 敏捷, luk 幸运，均为当前值）
 *   <TargetPref: lowest_atk>        → 物攻最低的角色
 *   <TargetPref: highest_atk>       → 物攻最高的角色
 *   <TargetPref: lowest_def>        → 物防最低的角色
 *   <TargetPref: highest_def>       → 物防最高的角色
 *   <TargetPref: lowest_mat>        → 魔攻最低的角色
 *   <TargetPref: highest_mat>       → 魔攻最高的角色
 *   <TargetPref: lowest_mdf>        → 魔防最低的角色
 *   <TargetPref: highest_mdf>       → 魔防最高的角色
 *   <TargetPref: lowest_agi>        → 敏捷最低的角色
 *   <TargetPref: highest_agi>       → 敏捷最高的角色
 *   <TargetPref: lowest_luk>        → 幸运最低的角色
 *   <TargetPref: highest_luk>       → 幸运最高的角色
 *
 * 【状态】
 *   <TargetPref: state(状态ID)>     → 优先选择拥有该状态的角色
 *   <TargetPref: no_state(状态ID)>  → 优先选择没有该状态的角色
 *
 * 【属性克制】
 *   <TargetPref: highest_element_rate> → 优先选择被当前技能元素克制的角色（倍率最高）
 *   <TargetPref: lowest_element_rate>  → 优先选择抵抗当前技能元素的角色（倍率最低）
 *
 * 【角色名字】（支持 \N[编号] 自动替换为数据库角色名，\V[编号] 替换为游戏变量值）
 *   <TargetPref: target_name("名字")>  → 优先打指定名字的角色
 *   <TargetPref: target_name("\N[1]")> → 优先打 1 号角色
 *   <TargetPref: target_name("\V[1]")> → 优先打变量 1 中存储的名字
 *   <TargetPref: avoid_name("名字")>   → 避免打指定名字的角色
 *
 * 【角色 ID】
 *   <TargetPref: target_id(角色ID)>    → 优先打指定 ID 的角色
 *   <TargetPref: avoid_id(角色ID)>     → 避免打指定 ID 的角色
 *
 * 【随机】
 *   <TargetPref: random>            → 完全随机选择（基于 TGR 权重，相当于原版随机行为）
 * 
 * 多个规则用英文逗号分隔，按从左到右的顺序依次应用。
 * 
 * 同时可控制是否启用元素智能（覆盖全局参数）：
 *   <EnemyElementAvoid:true>   → 强制启用
 *   <EnemyElementAvoid:false>  → 强制禁用
 *   <EnemyElementAvoid>        → 等同于 true
 *
 * ============================================================================
 * 使用示例
 * ============================================================================
 * 1. 只使用元素避免：<EnemyElementAvoid:true>
 *
 * 2. 优先打当前 HP 最低的角色：<TargetPref: lowest_hp>
 *
 * 3. 优先打最大 HP 最高的角色：<TargetPref: highest_maxhp>
 *
 * 4. 优先打最大 MP 最小的角色：<TargetPref: lowest_maxmp>
 *
 * 5. 组合规则：先找最大 HP 最小的，再从中挑物防最低的：<TargetPref: lowest_maxhp, lowest_def>
 *
 * 6. 动态名字（变量 1 存储目标名字）：<TargetPref: target_name("\V[1]")>
 *
 * 7. 多规则分行写法（换行和缩进不影响解析）：
 *    <TargetPref:
 *      avoid_name("角色名A"),
 *      avoid_name("角色名B"),
 *      lowest_hp
 *    >
 *
 * @param enable
 * @text 默认启用元素避免
 * @type boolean
 * @default true
 * @desc 敌人没有备注<EnemyElementAvoid>时是否启用元素避免。关闭后只有带<EnemyElementAvoid:true>的敌人才会进行免疫过滤。
 *
 * @param immunityThreshold
 * @text 免疫阈值
 * @type number
 * @decimals 2
 * @default 0
 * @desc 元素倍率 ≤ 该值时视为免疫。通常0为完全免疫。
 *
 * @param checkNonDamage
 * @text 检查非伤害技能
 * @type boolean
 * @default false
 * @desc 是否也对无伤害的纯状态/效果技能进行免疫检查。
 *
 * @param ignoreNoElement
 * @text 忽略无属性技能
 * @type boolean
 * @default true
 * @desc 元素ID为0（无属性）的技能是否跳过检查。
 *
 * @param wholeSkillMode
 * @text 全体技能模式
 * @type select
 * @option 任一目标有效即可使用 (any)
 * @value any
 * @option 所有目标都必须有效 (all)
 * @value all
 * @default any
 * @desc any：只要有一个目标不免疫，敌人就仍会使用该全体技能。
 *      all ：必须所有存活目标都不免疫，敌人才会使用。
 *
 * @param retargetOnRandom
 * @text 随机目标时重选
 * @type boolean
 * @default true
 * @desc 当敌人使用单体技能且目标为随机时，自动过滤掉免疫目标（若启用元素避免），并按进攻偏好选择目标。
 */

(function() {
    "use strict";

    //---------------------------------------------
    // 读取并解析参数
    //---------------------------------------------
    const params = PluginManager.parameters("Huanaiyka_EnemyTargetAI");
    const DEFAULT_ENABLE      = params["enable"] !== "false";
    const IMMUNE_THRESHOLD    = parseFloat(params["immunityThreshold"] || 0);
    const CHECK_NON_DAMAGE    = params["checkNonDamage"] === "true";
    const IGNORE_NO_ELEMENT   = params["ignoreNoElement"] !== "false";
    const WHOLE_SKILL_MODE    = params["wholeSkillMode"] === "all" ? "all" : "any";
    const RETARGET_RANDOM     = params["retargetOnRandom"] !== "false";

    // 六围属性映射表 (paramId 对应 RMMZ 默认属性)
    const PARAM_MAP = {
        mhp: 0, mmp: 1, atk: 2, def: 3, mat: 4, mdf: 5, agi: 6, luk: 7
    };

    //---------------------------------------------
    // 辅助函数：根据 TGR (受到攻击几率) 权重选取唯一目标
    //---------------------------------------------
    function selectTargetByTgr(candidates) {
        if (!candidates || candidates.length === 0) return null;
        if (candidates.length === 1) return candidates[0];

        const tgrSum = candidates.reduce((r, member) => r + member.tgr, 0);
        if (tgrSum <= 0) {
            // 如果所有候选目标的 TGR 全都为 0，则退回到完全均等随机
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        let rand = Math.random() * tgrSum;
        for (const member of candidates) {
            rand -= member.tgr;
            if (rand < 0) {
                return member;
            }
        }
        return candidates[candidates.length - 1];
    }

    //---------------------------------------------
    // 辅助函数：解析转义字符 \N[n] 和 \V[n]
    //---------------------------------------------
    function resolveNameString(str) {
        if (!str) return str;
        // 替换 \N[数字] -> 角色名
        str = str.replace(/\\N\[(\d+)\]/gi, (_, id) => {
            const actor = $dataActors ? $dataActors[parseInt(id, 10)] : null;
            return actor ? actor.name : "";
        });
        // 替换 \V[数字] -> 变量值
        str = str.replace(/\\V\[(\d+)\]/gi, (_, id) => {
            return String($gameVariables.value(parseInt(id, 10)) || "");
        });
        return str;
    }

    //---------------------------------------------
    // 辅助函数：获取敌人的元素避免 AI 开关
    //---------------------------------------------
    function isEnemyAIActive(enemy) {
        if (!enemy || !enemy.enemy()) return DEFAULT_ENABLE;
        const meta = enemy.enemy().meta;
        if (meta && meta.EnemyElementAvoid !== undefined) {
            const val = String(meta.EnemyElementAvoid).trim().toLowerCase();
            if (val === "" || val === "true") return true;
            if (val === "false") return false;
        }
        return DEFAULT_ENABLE;
    }

    //---------------------------------------------
    // 进攻偏好规则解析
    //---------------------------------------------
    function parseTargetPrefRules(meta) {
        if (!meta || !meta.TargetPref) return [];
        const ruleStr = String(meta.TargetPref).trim();
        if (ruleStr === "") return [];
        
        // 移除多余的空白和换行，并分割
        const parts = ruleStr.replace(/\s+/g, " ").split(",").map(s => s.trim());
        const rules = [];

        for (let part of parts) {
            const lowerPart = part.toLowerCase();
            
            // 基础属性、最大值与六围
            if ([
                "lowest_hp", "highest_hp", "lowest_mp", "highest_mp", "lowest_tp", "highest_tp",
                "lowest_level", "highest_level", "lowest_maxhp", "highest_maxhp", "lowest_maxmp", "highest_maxmp",
                "lowest_atk", "highest_atk", "lowest_def", "highest_def", "lowest_mat", "highest_mat",
                "lowest_mdf", "highest_mdf", "lowest_agi", "highest_agi", "lowest_luk", "highest_luk",
                "highest_element_rate", "lowest_element_rate", "random"
            ].includes(lowerPart)) {
                rules.push({ type: lowerPart });
                continue;
            }

            // 状态规则
            let match = part.match(/^(no_)?state\((\d+)\)$/i);
            if (match) {
                const isNoState = !!match[1];
                const stateId = parseInt(match[2], 10);
                if (!isNaN(stateId)) {
                    rules.push({ type: isNoState ? "no_state" : "state", value: stateId });
                }
                continue;
            }

            // 名字规则 (保留双/单引号，并支持变量延迟解析)
            match = part.match(/^(target|avoid)_name\((['"]?)(.*?)\2\)$/i);
            if (match) {
                const type = match[1].toLowerCase() === "target" ? "target_name" : "avoid_name";
                const rawName = match[3];
                rules.push({ type: type, rawValue: rawName });
                continue;
            }

            // 角色ID规则
            match = part.match(/^(target|avoid)_id\((\d+)\)$/i);
            if (match) {
                const type = match[1].toLowerCase() === "target" ? "target_id" : "avoid_id";
                const actorId = parseInt(match[2], 10);
                if (!isNaN(actorId)) {
                    rules.push({ type: type, value: actorId });
                }
                continue;
            }

            console.warn("Huanaiyka_EnemyTargetAI: 未知的 TargetPref 规则 - " + part);
        }
        return rules;
    }

    // 检查技能是否适用元素倍率规则
    function isElementRateRuleApplicable(action) {
        if (!action) return false;
        const skill = action.item();
        if (!skill) return false;
        const elementId = skill.damage.elementId;
        if (IGNORE_NO_ELEMENT && elementId === 0) return false;
        if (!CHECK_NON_DAMAGE && !action.isDamage()) return false;
        return elementId > 0;
    }

    //---------------------------------------------
    // 根据规则递归筛选目标 (完美兼容 TGR)
    //---------------------------------------------
    function selectTargetByPreference(candidates, rules, index, action) {
        if (!candidates || candidates.length === 0) return undefined;
        if (index >= rules.length) {
            // 筛选至最后一个过滤链或没有规则时，通过 TGR 权重从剩下的候选人中抽取目标
            return selectTargetByTgr(candidates);
        }

        const rule = rules[index];
        if (rule.type === "random") {
            // 如果规则为 "random"，同样直接利用 TGR 权重分配
            return selectTargetByTgr(candidates);
        }

        let filtered = [];

        switch (rule.type) {
            case "state":
                filtered = candidates.filter(t => t.isStateAffected(rule.value));
                break;
            case "no_state":
                filtered = candidates.filter(t => !t.isStateAffected(rule.value));
                break;
            case "target_name": {
                const resolvedName = resolveNameString(rule.rawValue);
                filtered = candidates.filter(t => t.name() === resolvedName);
                break;
            }
            case "avoid_name": {
                const resolvedName = resolveNameString(rule.rawValue);
                filtered = candidates.filter(t => t.name() !== resolvedName);
                break;
            }
            case "target_id":
                filtered = candidates.filter(t => t.actorId() === rule.value);
                break;
            case "avoid_id":
                filtered = candidates.filter(t => t.actorId() !== rule.value);
                break;
            case "highest_element_rate":
            case "lowest_element_rate": {
                if (!isElementRateRuleApplicable(action)) break;
                const elementId = action.item().damage.elementId;
                const isHighest = rule.type === "highest_element_rate";
                let targetValue = isHighest ? -Infinity : Infinity;
                for (const t of candidates) {
                    const val = t.elementRate(elementId);
                    if ((isHighest && val > targetValue) || (!isHighest && val < targetValue)) {
                        targetValue = val;
                        filtered = [t];
                    } else if (val === targetValue) {
                        filtered.push(t);
                    }
                }
                break;
            }
            default: {
                // 数值与六围属性的比对
                let getValue = null;
                let isLowest = rule.type.startsWith("lowest_");

                if (rule.type.includes("_hp")) {
                    getValue = t => rule.type.includes("max") ? t.mhp : t.hp;
                } else if (rule.type.includes("_mp")) {
                    getValue = t => rule.type.includes("max") ? t.mmp : t.mp;
                } else if (rule.type.includes("_tp")) {
                    getValue = t => t.tp;
                } else if (rule.type.includes("_level")) {
                    getValue = t => t.level;
                } else {
                    const statKey = rule.type.split("_")[1];
                    if (PARAM_MAP[statKey] !== undefined) {
                        const paramId = PARAM_MAP[statKey];
                        getValue = t => t.param(paramId);
                    }
                }

                if (getValue) {
                    let targetValue = isLowest ? Infinity : -Infinity;
                    for (const t of candidates) {
                        const val = getValue(t);
                        if ((isLowest && val < targetValue) || (!isLowest && val > targetValue)) {
                            targetValue = val;
                            filtered = [t];
                        } else if (val === targetValue) {
                            filtered.push(t);
                        }
                    }
                }
                break;
            }
        }

        // 如果该规则没有筛选出任何角色，则平滑过渡到下一个优先级规则
        if (filtered.length === 0) {
            return selectTargetByPreference(candidates, rules, index + 1, action);
        }
        return selectTargetByPreference(filtered, rules, index + 1, action);
    }

    // 获取敌人的目标偏好规则（缓存）
    function getEnemyTargetPrefRules(enemy) {
        if (!enemy) return [];
        if (enemy._targetPrefRulesParsed === undefined) {
            const meta = enemy.enemy() ? enemy.enemy().meta : null;
            enemy._targetPrefRules = parseTargetPrefRules(meta);
            enemy._targetPrefRulesParsed = true;
        }
        return enemy._targetPrefRules;
    }

    //---------------------------------------------
    // 核心判断：某技能对某个目标是否有效
    //---------------------------------------------
    function isSkillEffectiveOnTarget(action, target) {
        const skill = action.item();
        if (!skill) return true;

        const elementId = skill.damage.elementId;
        if (IGNORE_NO_ELEMENT && elementId === 0) return true;
        if (!CHECK_NON_DAMAGE && !action.isDamage()) return true;
        if (elementId <= 0) return true;

        const rate = target.elementRate(elementId);
        return rate > IMMUNE_THRESHOLD;
    }

    // 判断某技能在当前战斗中对敌方是否整体有效
    function isSkillUsableByElement(action, subject) {
        const opponents = subject.opponentsUnit().aliveMembers();
        if (opponents.length === 0) return false;

        if (WHOLE_SKILL_MODE === "any") {
            return opponents.some(target => isSkillEffectiveOnTarget(action, target));
        } else {
            return opponents.every(target => isSkillEffectiveOnTarget(action, target));
        }
    }

    // 过滤敌人的行动列表
    function filterEnemyActions(enemy) {
        if (!isEnemyAIActive(enemy)) return;
        const oldActions = enemy._actions;
        if (!oldActions || oldActions.length === 0) return;
        
        const newActions = [];
        for (const action of oldActions) {
            if (!action || !action.item()) continue;
            if (isSkillUsableByElement(action, enemy)) {
                newActions.push(action);
            }
        }
        
        if (newActions.length > 0) {
            enemy._actions = newActions;
            enemy._elementAvoidFallback = false;
        } else {
            // 所有技能完全被免疫：保留原行动组的第一个作为保底（不得已释放）
            enemy._actions = [oldActions[0]];
            enemy._elementAvoidFallback = true;
        }
    }

    // 拦截制作动作方法
    const _Game_Enemy_makeActions = Game_Enemy.prototype.makeActions;
    Game_Enemy.prototype.makeActions = function() {
        this._elementAvoidFallback = false;
        _Game_Enemy_makeActions.call(this);
        if (isEnemyAIActive(this)) {
            filterEnemyActions(this);
        }
    };

    //---------------------------------------------
    // 重选随机单体目标逻辑（已整合 <SkillNoSelf> 排除自身逻辑）
    //---------------------------------------------
    const _Game_Action_targetsForFriends = Game_Action.prototype.targetsForFriends;
    Game_Action.prototype.targetsForFriends = function() {
        const subject = this.subject();
        // 如果是敌人在准备释放对友方（我方单体）的随机目标技能时
        if (subject && subject.isEnemy() && this.isForFriend() && this.isForOne() && this._targetIndex < 0) {
            const skill = this.item();
            if (skill && skill.meta.SkillNoSelf) {
                const allFriends = this.friendsUnit().aliveMembers();
                // 核心改动：如果技能有 <SkillNoSelf>，在获取同伴时直接把“自己”踢出去！
                const otherFriends = allFriends.filter(member => member !== subject);
                if (otherFriends.length > 0) {
                    // 在没有自己的队友名单中，通过 TGR/偏好 筛选目标
                    const prefRules = getEnemyTargetPrefRules(subject);
                    if (prefRules && prefRules.length > 0) {
                        const chosen = selectTargetByPreference(otherFriends, prefRules, 0, this);
                        if (chosen) return [chosen];
                    }
                    const target = selectTargetByTgr(otherFriends);
                    if (target) return [target];
                }
            }
        }
        return _Game_Action_targetsForFriends.call(this);
    };

    if (RETARGET_RANDOM) {
        const _Game_Action_targetsForOpponents = Game_Action.prototype.targetsForOpponents;
        Game_Action.prototype.targetsForOpponents = function() {
            const subject = this.subject();
            if (subject && subject.isEnemy() && this.isForOne() && this._targetIndex < 0) {
                const skill = this.item();
                if (!skill) return _Game_Action_targetsForOpponents.call(this);
                
                const elementId = skill.damage.elementId;
                const isElemental = !(IGNORE_NO_ELEMENT && elementId === 0) &&
                                    (CHECK_NON_DAMAGE || this.isDamage()) &&
                                    elementId > 0;
                
                const allOpponents = this.opponentsUnit().aliveMembers();
                if (allOpponents.length === 0) return [];
                
                let candidateTargets = allOpponents;
                const avoidActive = isEnemyAIActive(subject);
                const isFallback = subject._elementAvoidFallback === true;

                // 1. 先进行元素过滤（去除免疫的目标）
                if (avoidActive && !isFallback && isElemental) {
                    const validTargets = allOpponents.filter(target => {
                        return target.elementRate(elementId) > IMMUNE_THRESHOLD;
                    });
                    if (validTargets.length > 0) {
                        candidateTargets = validTargets;
                    }
                }
                
                // 2. 如果配置了进攻偏好标签
                const prefRules = getEnemyTargetPrefRules(subject);
                if (prefRules && prefRules.length > 0) {
                    const chosen = selectTargetByPreference(candidateTargets, prefRules, 0, this);
                    if (chosen) return [chosen];
                }
                
                // 3. 未配置偏好标签或规则退化时的保底选择：利用原生的 TGR (受到攻击几率) 权重
                const target = selectTargetByTgr(candidateTargets);
                if (target) return [target];
            }
            return _Game_Action_targetsForOpponents.call(this);
        };
    }

})();