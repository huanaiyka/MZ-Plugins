//=============================================================================
// Huanaiyka_EnemyTargetAI.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 敌人智能AI：不会对目标使用元素无效的技能，并支持进攻偏好
 * @author 幻爱
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件让敌人更智能：
 * 1. 自动避开元素无效技能（不会用火焰打火免疫角色）。
 * 2. 支持进攻偏好规则（优先打血量最低、带有特定状态、被属性克制、六围高低、指定名字/ID、变量动态名字、基于最大值等）。
 * 
 * 两者可同时使用（先过滤免疫，再按偏好选目标），也可单独使用其中一种。
 * 如果所有技能对所有目标都免疫，敌人会“不得已”打出免疫伤害（不会跳过回合）。
 *
 * 兼容性：与大多数修改敌人AI的插件（如NRP_EnemyRoutineKai）兼容，
 * 建议将此插件放在其他敌人AI插件之后。
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
 *   <TargetPref: random>            → 完全随机选择（插件默认行为）
 * 
 * 多个规则用英文逗号分隔，按从左到右的顺序依次应用。
 * 
 * 同时可控制是否启用元素智能（覆盖全局参数）：
 *   <EnemyElementAvoid:true>   → 强制启用
 *   <EnemyElementAvoid:false>  → 强制禁用
 *   <EnemyElementAvoid>        → 等同于 true

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
    // 读取参数
    //---------------------------------------------
    const params = PluginManager.parameters("Huanaiyka_EnemyTargetAI");
    const DEFAULT_ENABLE      = params["enable"] !== "false";
    const IMMUNE_THRESHOLD    = parseFloat(params["immunityThreshold"] || 0);
    const CHECK_NON_DAMAGE    = params["checkNonDamage"] === "true";
    const IGNORE_NO_ELEMENT   = params["ignoreNoElement"] !== "false";
    const WHOLE_SKILL_MODE    = params["wholeSkillMode"] === "all" ? "all" : "any";
    const RETARGET_RANDOM     = params["retargetOnRandom"] !== "false";

    //---------------------------------------------
    // 辅助函数：将字符串中的 \N[数字] 和 \V[数字] 替换为实际值
    //---------------------------------------------
    function resolveNameString(str) {
        if (!str) return str;
        // 替换 \N[数字] → 角色名
        str = str.replace(/\\N\[(\d+)\]/gi, function(match, id) {
            const actorId = parseInt(id, 10);
            const actor = $dataActors[actorId];
            return actor ? actor.name : match;
        });
        // 替换 \V[数字] → 变量的字符串形式
        str = str.replace(/\\V\[(\d+)\]/gi, function(match, id) {
            const varId = parseInt(id, 10);
            const value = $gameVariables.value(varId);
            return String(value);
        });
        return str;
    }

    //---------------------------------------------
    // 辅助函数：获取敌人的元素避免AI开关
    //---------------------------------------------
    function isEnemyAIActive(enemy) {
        if (!enemy || !enemy.enemy) return DEFAULT_ENABLE;
        const meta = enemy.enemy().meta;
        if (meta.EnemyElementAvoid !== undefined) {
            let val = meta.EnemyElementAvoid;
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
        const ruleStr = meta.TargetPref.trim();
        if (ruleStr === "") return [];
        const parts = ruleStr.split(",").map(s => s.trim().toLowerCase());
        const rules = [];
        for (let part of parts) {
            // 当前血量/蓝量/TP/等级
            if (part === "lowest_hp") rules.push({ type: "lowest_hp" });
            else if (part === "highest_hp") rules.push({ type: "highest_hp" });
            else if (part === "lowest_mp") rules.push({ type: "lowest_mp" });
            else if (part === "highest_mp") rules.push({ type: "highest_mp" });
            else if (part === "lowest_tp") rules.push({ type: "lowest_tp" });
            else if (part === "highest_tp") rules.push({ type: "highest_tp" });
            else if (part === "lowest_level") rules.push({ type: "lowest_level" });
            else if (part === "highest_level") rules.push({ type: "highest_level" });
            // 最大值规则
            else if (part === "lowest_maxhp") rules.push({ type: "lowest_maxhp" });
            else if (part === "highest_maxhp") rules.push({ type: "highest_maxhp" });
            else if (part === "lowest_maxmp") rules.push({ type: "lowest_maxmp" });
            else if (part === "highest_maxmp") rules.push({ type: "highest_maxmp" });
            // 六围
            else if (part === "lowest_atk") rules.push({ type: "lowest_atk" });
            else if (part === "highest_atk") rules.push({ type: "highest_atk" });
            else if (part === "lowest_def") rules.push({ type: "lowest_def" });
            else if (part === "highest_def") rules.push({ type: "highest_def" });
            else if (part === "lowest_mat") rules.push({ type: "lowest_mat" });
            else if (part === "highest_mat") rules.push({ type: "highest_mat" });
            else if (part === "lowest_mdf") rules.push({ type: "lowest_mdf" });
            else if (part === "highest_mdf") rules.push({ type: "highest_mdf" });
            else if (part === "lowest_agi") rules.push({ type: "lowest_agi" });
            else if (part === "highest_agi") rules.push({ type: "highest_agi" });
            else if (part === "lowest_luk") rules.push({ type: "lowest_luk" });
            else if (part === "highest_luk") rules.push({ type: "highest_luk" });
            // 元素倍率
            else if (part === "highest_element_rate") rules.push({ type: "highest_element_rate" });
            else if (part === "lowest_element_rate") rules.push({ type: "lowest_element_rate" });
            // 随机
            else if (part === "random") rules.push({ type: "random" });
            // 状态
            else if (part.startsWith("state(") && part.endsWith(")")) {
                const id = parseInt(part.slice(6, -1));
                if (!isNaN(id)) rules.push({ type: "state", value: id });
            }
            else if (part.startsWith("no_state(") && part.endsWith(")")) {
                const id = parseInt(part.slice(9, -1));
                if (!isNaN(id)) rules.push({ type: "no_state", value: id });
            }
            // 名字规则
            else if (part.startsWith("target_name(") && part.endsWith(")")) {
                let namePart = part.slice(12, -1);
                if ((namePart.startsWith('"') && namePart.endsWith('"')) ||
                    (namePart.startsWith("'") && namePart.endsWith("'"))) {
                    namePart = namePart.slice(1, -1);
                }
                namePart = resolveNameString(namePart);
                if (namePart.length > 0) rules.push({ type: "target_name", value: namePart });
            }
            else if (part.startsWith("avoid_name(") && part.endsWith(")")) {
                let namePart = part.slice(11, -1);
                if ((namePart.startsWith('"') && namePart.endsWith('"')) ||
                    (namePart.startsWith("'") && namePart.endsWith("'"))) {
                    namePart = namePart.slice(1, -1);
                }
                namePart = resolveNameString(namePart);
                if (namePart.length > 0) rules.push({ type: "avoid_name", value: namePart });
            }
            // 角色ID规则
            else if (part.startsWith("target_id(") && part.endsWith(")")) {
                const id = parseInt(part.slice(10, -1));
                if (!isNaN(id)) rules.push({ type: "target_id", value: id });
            }
            else if (part.startsWith("avoid_id(") && part.endsWith(")")) {
                const id = parseInt(part.slice(9, -1));
                if (!isNaN(id)) rules.push({ type: "avoid_id", value: id });
            }
            else {
                console.warn("Huanaiyka_EnemyTargetAI: 未知的 TargetPref 规则 - " + part);
            }
        }
        return rules;
    }

    // 检查技能是否适用元素倍率规则
    function isElementRateRuleApplicable(action) {
        if (!action) return false;
        const skill = action.item();
        if (!skill) return false;
        let elementId = skill.damage.elementId;
        if (IGNORE_NO_ELEMENT && elementId === 0) return false;
        if (!CHECK_NON_DAMAGE && !action.isDamage()) return false;
        if (elementId <= 0) return false;
        return true;
    }

    // 获取角色的六围值
    function getActorParam(actor, paramId) {
        // paramId: 0 = MHP, 1 = MMP, 2 = ATK, 3 = DEF, 4 = MAT, 5 = MDF, 6 = AGI, 7 = LUK
        return actor.param(paramId);
    }

    // 根据规则从候选人中选出一个目标（递归）
    function selectTargetByPreference(candidates, rules, index, action) {
        if (!candidates || candidates.length === 0) return undefined;
        if (index >= rules.length) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }
        const rule = rules[index];
        
        if (rule.type === "random") {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }
        else if (rule.type === "state") {
            const filtered = candidates.filter(t => t.isStateAffected(rule.value));
            if (filtered.length === 0) {
                return selectTargetByPreference(candidates, rules, index + 1, action);
            } else {
                return selectTargetByPreference(filtered, rules, index + 1, action);
            }
        }
        else if (rule.type === "no_state") {
            const filtered = candidates.filter(t => !t.isStateAffected(rule.value));
            if (filtered.length === 0) {
                return selectTargetByPreference(candidates, rules, index + 1, action);
            } else {
                return selectTargetByPreference(filtered, rules, index + 1, action);
            }
        }
        else if (rule.type === "target_name") {
            const filtered = candidates.filter(t => t.name() === rule.value);
            if (filtered.length === 0) {
                return selectTargetByPreference(candidates, rules, index + 1, action);
            } else {
                return selectTargetByPreference(filtered, rules, index + 1, action);
            }
        }
        else if (rule.type === "avoid_name") {
            const filtered = candidates.filter(t => t.name() !== rule.value);
            if (filtered.length === 0) {
                return selectTargetByPreference(candidates, rules, index + 1, action);
            } else {
                return selectTargetByPreference(filtered, rules, index + 1, action);
            }
        }
        else if (rule.type === "target_id") {
            const filtered = candidates.filter(t => t.actorId() === rule.value);
            if (filtered.length === 0) {
                return selectTargetByPreference(candidates, rules, index + 1, action);
            } else {
                return selectTargetByPreference(filtered, rules, index + 1, action);
            }
        }
        else if (rule.type === "avoid_id") {
            const filtered = candidates.filter(t => t.actorId() !== rule.value);
            if (filtered.length === 0) {
                return selectTargetByPreference(candidates, rules, index + 1, action);
            } else {
                return selectTargetByPreference(filtered, rules, index + 1, action);
            }
        }
        else if (rule.type === "highest_element_rate" || rule.type === "lowest_element_rate") {
            if (!isElementRateRuleApplicable(action)) {
                return selectTargetByPreference(candidates, rules, index + 1, action);
            }
            const skill = action.item();
            const elementId = skill.damage.elementId;
            const compareFn = (rule.type === "highest_element_rate") 
                ? (a, b) => b - a
                : (a, b) => a - b;
            let bestValue = null;
            let bestTargets = [];
            for (let t of candidates) {
                let val = t.elementRate(elementId);
                if (bestValue === null || compareFn(val, bestValue) < 0) {
                    bestValue = val;
                    bestTargets = [t];
                } else if (compareFn(val, bestValue) === 0) {
                    bestTargets.push(t);
                }
            }
            if (bestTargets.length === 0) {
                return selectTargetByPreference(candidates, rules, index + 1, action);
            }
            return selectTargetByPreference(bestTargets, rules, index + 1, action);
        }
        // 数值型规则（当前值、最大值、等级、六围）
        else {
            let compareFn = null;
            let getValue = null;
            const paramMap = {
                "atk": 2, "def": 3, "mat": 4, "mdf": 5, "agi": 6, "luk": 7
            };
            switch (rule.type) {
                // 当前值
                case "lowest_hp":   getValue = t => t.hp; compareFn = (a,b) => a - b; break;
                case "highest_hp":  getValue = t => t.hp; compareFn = (a,b) => b - a; break;
                case "lowest_mp":   getValue = t => t.mp; compareFn = (a,b) => a - b; break;
                case "highest_mp":  getValue = t => t.mp; compareFn = (a,b) => b - a; break;
                case "lowest_tp":   getValue = t => t.tp; compareFn = (a,b) => a - b; break;
                case "highest_tp":  getValue = t => t.tp; compareFn = (a,b) => b - a; break;
                // 最大值
                case "lowest_maxhp": getValue = t => t.mhp; compareFn = (a,b) => a - b; break;
                case "highest_maxhp": getValue = t => t.mhp; compareFn = (a,b) => b - a; break;
                case "lowest_maxmp": getValue = t => t.mmp; compareFn = (a,b) => a - b; break;
                case "highest_maxmp": getValue = t => t.mmp; compareFn = (a,b) => b - a; break;
                // 等级
                case "lowest_level":getValue = t => t.level; compareFn = (a,b) => a - b; break;
                case "highest_level":getValue = t => t.level; compareFn = (a,b) => b - a; break;
                // 六围
                case "lowest_atk":  getValue = t => getActorParam(t, paramMap.atk); compareFn = (a,b) => a - b; break;
                case "highest_atk": getValue = t => getActorParam(t, paramMap.atk); compareFn = (a,b) => b - a; break;
                case "lowest_def":  getValue = t => getActorParam(t, paramMap.def); compareFn = (a,b) => a - b; break;
                case "highest_def": getValue = t => getActorParam(t, paramMap.def); compareFn = (a,b) => b - a; break;
                case "lowest_mat":  getValue = t => getActorParam(t, paramMap.mat); compareFn = (a,b) => a - b; break;
                case "highest_mat": getValue = t => getActorParam(t, paramMap.mat); compareFn = (a,b) => b - a; break;
                case "lowest_mdf":  getValue = t => getActorParam(t, paramMap.mdf); compareFn = (a,b) => a - b; break;
                case "highest_mdf": getValue = t => getActorParam(t, paramMap.mdf); compareFn = (a,b) => b - a; break;
                case "lowest_agi":  getValue = t => getActorParam(t, paramMap.agi); compareFn = (a,b) => a - b; break;
                case "highest_agi": getValue = t => getActorParam(t, paramMap.agi); compareFn = (a,b) => b - a; break;
                case "lowest_luk":  getValue = t => getActorParam(t, paramMap.luk); compareFn = (a,b) => a - b; break;
                case "highest_luk": getValue = t => getActorParam(t, paramMap.luk); compareFn = (a,b) => b - a; break;
                default: return selectTargetByPreference(candidates, rules, index + 1, action);
            }
            if (!getValue || !compareFn) return selectTargetByPreference(candidates, rules, index + 1, action);
            let bestValue = null;
            let bestTargets = [];
            for (let t of candidates) {
                let val = getValue(t);
                if (bestValue === null || compareFn(val, bestValue) < 0) {
                    bestValue = val;
                    bestTargets = [t];
                } else if (compareFn(val, bestValue) === 0) {
                    bestTargets.push(t);
                }
            }
            if (bestTargets.length === 0) return selectTargetByPreference(candidates, rules, index + 1, action);
            return selectTargetByPreference(bestTargets, rules, index + 1, action);
        }
    }

    // 获取敌人的目标偏好规则（缓存）
    function getEnemyTargetPrefRules(enemy) {
        if (!enemy._targetPrefRulesParsed) {
            const meta = enemy.enemy() ? enemy.enemy().meta : null;
            enemy._targetPrefRules = parseTargetPrefRules(meta);
            enemy._targetPrefRulesParsed = true;
        }
        return enemy._targetPrefRules;
    }

    //---------------------------------------------
    // 核心判断：某技能对某个目标是否有效（元素层面）
    //---------------------------------------------
    function isSkillEffectiveOnTarget(action, target) {
        const skill = action.item();
        if (!skill) return true;

        let elementId = skill.damage.elementId;
        if (IGNORE_NO_ELEMENT && elementId === 0) return true;
        if (!CHECK_NON_DAMAGE && !action.isDamage()) return true;
        if (elementId <= 0) return true;

        const rate = target.elementRate(elementId);
        return rate > IMMUNE_THRESHOLD;
    }

    // 判断某技能在当前战斗中对敌方是否有效
    function isSkillUsableByElement(action, subject) {
        const skill = action.item();
        if (!skill) return true;

        let elementId = skill.damage.elementId;
        if (IGNORE_NO_ELEMENT && elementId === 0) return true;
        if (!CHECK_NON_DAMAGE && !action.isDamage()) return true;
        if (elementId <= 0) return true;

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
        for (let action of oldActions) {
            if (!action) continue;
            const skill = action.item();
            if (!skill) continue;
            const skillId = skill.id;
            if (!skillId) continue;
            const tempAction = new Game_Action(enemy);
            tempAction.setSkill(skillId);
            if (isSkillUsableByElement(tempAction, enemy)) {
                newActions.push(action);
            }
        }
        
// 修复本回合固定技能后我方只有免疫属性角色时无限循环普攻的bug
if (newActions.length > 0) {
    // 有至少一个技能对某些目标有效 → 使用过滤后的行动列表
    enemy._actions = newActions;
    enemy._elementAvoidFallback = false;
} else {
    // 所有技能对所有目标都免疫（或无效）
    // 保留第一个行动作为“不得已”的选项，让敌人至少做出一个动作（通常是免疫伤害）
    // 只保留一个，避免因行动列表累积导致无限循环（原插件保留整个 oldActions 会引发 bug）
    enemy._actions = [oldActions[0]];
    enemy._elementAvoidFallback = true;
}
    }

    // 拦截 makeActions
    const _Game_Enemy_makeActions = Game_Enemy.prototype.makeActions;
    Game_Enemy.prototype.makeActions = function() {
        this._elementAvoidFallback = false;
        _Game_Enemy_makeActions.call(this);
        if (isEnemyAIActive(this)) {
            filterEnemyActions(this);
        }
    };

    // 处理随机单体目标：元素过滤 + 进攻偏好
    if (RETARGET_RANDOM) {
        const _Game_Action_targetsForOpponents = Game_Action.prototype.targetsForOpponents;
        Game_Action.prototype.targetsForOpponents = function() {
            const subject = this.subject();
            if (subject && subject.isEnemy() && this.isForOne() && this._targetIndex < 0) {
                const skill = this.item();
                if (!skill) return _Game_Action_targetsForOpponents.call(this);
                
                let elementId = skill.damage.elementId;
                const isElemental = !(IGNORE_NO_ELEMENT && elementId === 0) &&
                                    (CHECK_NON_DAMAGE || this.isDamage()) &&
                                    elementId > 0;
                
                const allOpponents = this.opponentsUnit().aliveMembers();
                if (allOpponents.length === 0) return [];
                
                let candidateTargets = allOpponents;
                const avoidActive = isEnemyAIActive(subject);
                const isFallback = subject._elementAvoidFallback === true;
                if (avoidActive && !isFallback && isElemental) {
                    const validTargets = allOpponents.filter(target => {
                        const rate = target.elementRate(elementId);
                        return rate > IMMUNE_THRESHOLD;
                    });
                    if (validTargets.length === 0) {
                        return [];
                    }
                    candidateTargets = validTargets;
                }
                
                const prefRules = getEnemyTargetPrefRules(subject);
                if (prefRules && prefRules.length > 0) {
                    const chosen = selectTargetByPreference(candidateTargets, prefRules, 0, this);
                    if (chosen) return [chosen];
                }
                
                const target = candidateTargets[Math.floor(Math.random() * candidateTargets.length)];
                return [target];
            }
            return _Game_Action_targetsForOpponents.call(this);
        };
    }

})();