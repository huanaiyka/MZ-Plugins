/*:
 * @plugindesc 敌人技能目标修正：防止选中自身 (强化版)
 * @author Gemini
 * @help 在技能的备注栏中填写 <SkillNoSelf>
 * 当敌人使用目标为“我方单体”的技能时，会自动把自身从目标池中剔除。
 */

(function() {
    // 拦截 Game_Action 的 targetsForFriends 方法（该方法用于获取所有友方候选目标）
    const _Game_Action_targetsForFriends = Game_Action.prototype.targetsForFriends;
    Game_Action.prototype.targetsForFriends = function() {
        // 首先获取默认的友方目标列表
        let targets = _Game_Action_targetsForFriends.call(this);
        
        // 检查是否是技能、是否是单体友方目标
        if (this.isSkill() && this.isForFriend() && !this.isForAll()) {
            const skill = this.item();
            // 检查备注栏中是否存在 <SkillNoSelf> 标签
            if (skill && skill.meta.SkillNoSelf) {
                const subject = this.subject();
                // 如果行动发起者是敌人，且备选目标里包含它自己
                if (subject.isEnemy() && targets.includes(subject)) {
                    // 从候选目标中过滤掉自己
                    const filteredTargets = targets.filter(target => target !== subject);
                    
                    // 兜底逻辑：如果过滤后还有其他队友，则使用过滤后的列表；
                    // 如果过滤后没有其他人了（只剩自己），则保留自己，防止游戏报错卡死。
                    if (filteredTargets.length > 0) {
                        return filteredTargets;
                    }
                }
            }
        }
        return targets;
    };
})();