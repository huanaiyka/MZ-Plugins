/*:
 * @target MZ
 * @plugindesc 友方/无差别技能在原有范围基础上，排除使用者自身。
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @help
 * 【功能简介】
 * 让【友方类技能】以及【敌人&我方】的技能，
 * 在原有目标范围基础上自动排除“使用者自身”。
 *
 * 【使用方法】
 * 1. 数据库 → 技能 → 备注栏写入：
 *      <SkillNoSelfFriend>
 * 2. 保存测试，使用者不再出现在目标列表中。
 * 
 * 【注意】
 * 范围为“使用者”的技能不受影响。
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN_NAME = 'Huanaiyka_SkillNoSelf';
    const META_KEY = 'SkillNoSelfFriend';

    const hasFriendNoSelfTag = function(skill) {
        if (!skill || !skill.meta) return false;
        return skill.meta[META_KEY] === true;
    };

    const _Game_Action_makeTargets = Game_Action.prototype.makeTargets;
    Game_Action.prototype.makeTargets = function() {
        const targets = _Game_Action_makeTargets.call(this);
        const item = this.item();
        if (!item || !hasFriendNoSelfTag(item)) return targets;

        const user = this.subject();
        if (!user) return targets;
        
        // 如果范围是“使用者”本人，则跳过（1是使用者，11也是使用者相关）
        if (this.isForUser()) return targets;

        // 判断是否是“敌人&我方”无差别范围 (Scope = 7)
        const isAllExceptUserScope = item.scope === 7;

        // 如果是友方技能，或者是无差别攻击(Scope 7)，则执行排除自己的逻辑
        if (this.isForFriend() || isAllExceptUserScope) {
            return targets.filter(target => target !== user);
        }

        // 其他情况（如纯打敌方全体）不处理
        return targets;
    };
})();