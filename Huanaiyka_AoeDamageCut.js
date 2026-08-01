/*:
 * @target MZ
 * @plugindesc AOE攻击的伤害削减
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 此插件允许你为“全体攻击”的伤害设置一个固定百分比削减。
 * 例如设置削减 30%，则全体攻击的最终伤害会变为原来的 70%。
 *
 * 可自行修改哪些范围被视为“全体攻击”，支持多个范围（逗号分隔）。
 * 范围数值参考：
 *   1 : 单个敌人
 *   2 : 全体敌人  （默认）
 *   3 : 单个队友
 *   4 : 全体队友
 *   5 : 单个使用者
 *   6 : 全体使用者
 *
 * 插件不会影响非全体攻击的技能或物品。
 *
 * 【可选特性】当敌人只剩一个时，全体攻击是否不进行削减（默认开启）。
 * ============================================================================
 * 参数设置
 * ============================================================================
 * @param reducePercent
 * @text 削减百分比
 * @desc 全体攻击的伤害减少百分之多少（0~100）。例如 20 表示减少20%伤害。
 * @type number
 * @min 0
 * @max 100
 * @default 20
 *
 * @param targetScopes
 * @text 目标范围
 * @desc 哪些范围被视为“全体攻击”，多个范围用英文逗号隔开。默认 2（全体敌人）
 * @type string
 * @default 2
 *
 * @param enableSingleEnemyNoReduce
 * @text 剩单敌不减伤
 * @desc 开启后，全体攻击范围内只剩一个存活敌人时，不进行伤害削减（只对范围2有效）。
 * @type boolean
 * @default true
 *
 */

(() => {
    const parameters = PluginManager.parameters('Huanaiyka_AoeDamageCut');
    const reducePercent = Number(parameters['reducePercent'] || 30);
    const scopesString = parameters['targetScopes'] || '2';
    const targetScopes = scopesString.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    // 新增：是否启用“只剩一个敌人时不削减”的功能（默认为 true）
    const enableSingleEnemyNoReduce = parameters['enableSingleEnemyNoReduce'] !== 'false'; // 只要不是字符串'false'即为true

    const damageRate = 1 - reducePercent / 100;

    // 保存原始方法
    const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;

    Game_Action.prototype.makeDamageValue = function(target, critical) {
        // 先调用原始计算获取基础伤害值
        let value = _Game_Action_makeDamageValue.call(this, target, critical);

        // 仅对技能或物品进行处理
        if (this.isSkill() || this.isItem()) {
            const item = this.item();
            const scope = item.scope;
            // 判断当前范围是否属于配置的“全体攻击”范围
            if (targetScopes.includes(scope)) {
                // 判断是否需要应用削减
                let shouldReduce = true;
                // 当功能开启，且当前技能范围是全体敌人（2），且存活敌人数量为1时，不削减
                if (enableSingleEnemyNoReduce && scope === 2 && $gameTroop && $gameTroop.aliveMembers().length === 1) {
                    shouldReduce = false;
                }
                
                if (shouldReduce) {
                    value = Math.floor(value * damageRate);
                    if (value < 0) value = 0;
                }
            }
        }

        return value;
    };
})();