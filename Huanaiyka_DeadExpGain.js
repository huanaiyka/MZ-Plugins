/*:
 * @target MV MZ
 * @plugindesc 让死亡的同伴也能获得一定比例经验值
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @param deadExpRate
 * @text 死亡经验比例
 * @desc 死亡角色获得经验的比例（相对于活着的角色）
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 0.5
 *
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 在战斗胜利时，死亡的角色默认无法获得经验值。
 * 本插件允许死亡角色获得一定比例的经验值，默认为50%。
 *
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 将本插件保存为 .js 文件（例如 Huanaiyka_DeadExpGain.js）。
 * 2. 在 RPG Maker 的插件管理器中添加并启用。
 * 3. 根据需要调整“死亡经验比例”参数（0~1之间的小数）。
 * 4. 开始游戏，战斗胜利后死亡角色会自动获得对应比例的经验。
 *
 * ============================================================================
 * 技术说明
 * ============================================================================
 * - 本插件通过钩子 BattleManager.gainExp 实现，兼容绝大多数战斗插件。
 * - 只影响参战成员（不包括后备队员）。
 * - 经验值计算包含队伍经验倍率（如果有相关插件）。
 * - 使用 Game_Actor.changeExp 安全增加经验，自动处理等级提升。
 */

(function() {
    'use strict';

    const params = PluginManager.parameters('Huanaiyka_DeadExpGain');
    const deadExpRate = parseFloat(params['deadExpRate'] || 0.5);

    const _BattleManager_gainExp = BattleManager.gainExp;

    BattleManager.gainExp = function() {
        _BattleManager_gainExp.call(this);

        let totalExp = $gameTroop.expTotal();
        if (totalExp <= 0) return;

        let expRate = 1.0;
        if ($gameParty && typeof $gameParty.expRate === 'function') {
            expRate = $gameParty.expRate();
        } else if ($gameParty && $gameParty._expRate !== undefined) {
            expRate = $gameParty._expRate;
        }

        const actualExp = Math.floor(totalExp * expRate);
        const extraExp = Math.floor(actualExp * deadExpRate);
        if (extraExp <= 0) return;

        const members = $gameParty.members();
        for (let i = 0; i < members.length; i++) {
            const actor = members[i];
            if (actor && actor.isActor() && actor.isDead()) {
                const newExp = actor.currentExp() + extraExp;
                actor.changeExp(newExp, false);
            }
        }
    };
})();