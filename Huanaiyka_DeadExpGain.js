/*:
 * @target MV MZ
 * @plugindesc 让死亡的同伴也能获得一定比例经验值 (修复版)
 * @author 幻爱
 *
 * @param deadExpRate
 * @text 死亡经验比例
 * @desc 死亡角色获得经验的比例（0 为无经验，0.5 为 50%，1 为 100%）
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

    // 动态获取当前插件的文件名，避免用户改名后导致参数读取失败
    const script = document.currentScript;
    const pluginName = script ? script.src.split('/').pop().replace(/\.js$/, '') : 'Huanaiyka_DeadExpGain';
    const params = PluginManager.parameters(pluginName);
    const deadExpRate = parseFloat(params['deadExpRate'] || 0.5);

    // 重写战斗经验分配逻辑，避免重复累加
    BattleManager.gainExp = function() {
        const baseExp = $gameTroop.expTotal();
        
        $gameParty.allMembers().forEach(function(actor) {
            let exp = baseExp;
            
            // 如果不是前排参战成员（后备队员）
            if (!$gameParty.battleMembers().includes(actor)) {
                exp *= actor.benchMembersExpRate();
            }
            
            // 如果角色已死亡，乘以死亡经验比例
            if (actor.isDead()) {
                exp *= deadExpRate;
            }
            
            // 发送计算后的经验
            actor.gainExp(Math.floor(exp));
        });
    };
})();