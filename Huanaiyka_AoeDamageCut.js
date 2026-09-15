/*: * @target MZ
 * @plugindesc AOE攻击的伤害削减
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 此插件允许你为“全体攻击”的伤害设置一个固定百分比削减。
 * 例如设置削减 20%，则全体攻击的最终伤害会变为原来的 80%。
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
 * 【可选特性】当敌人只剩一个时，全体攻击是否不进行削减（默认开启）。
 * 
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
    // 动态获取当前插件文件名
    const pluginName = decodeURIComponent(document.currentScript.src.match(/^.*\/(.+)\.js[?#]?.*$/)[1]);
    const parameters = PluginManager.parameters(pluginName);

    const reducePercent = Number(parameters['reducePercent'] || 20);
    const scopesString = parameters['targetScopes'] || '2';
    const targetScopes = scopesString.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    
    // 严谨的布尔值判断
    const enableSingleEnemyNoReduce = String(parameters['enableSingleEnemyNoReduce'] || 'true') === 'true';

    const damageRate = 1 - reducePercent / 100;

    // 保存原始方法
    const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;

    Game_Action.prototype.makeDamageValue = function(target, critical) {
        // 先调用原始计算获取基础伤害值
        let value = _Game_Action_makeDamageValue.call(this, target, critical);

        if (this.isSkill() || this.isItem()) {
            const item = this.item();
            if (item) {
                const scope = item.scope;

                // 判断是否命中配置的全体范围
                if (targetScopes.includes(scope)) {
                    let shouldReduce = true;
                    const aliveCount = $gameTroop ? $gameTroop.aliveMembers().length : 0;

                    // 单敌不削减判定
                    if (enableSingleEnemyNoReduce && scope === 2 && aliveCount === 1) {
                        shouldReduce = false;
                    }
                    
                    if (shouldReduce) {
                        const finalValue = Math.floor(value * damageRate);
                        value = finalValue;
                        if (value < 0) value = 0;
                    }
                }
            }
        }

        return value;
    };
})();