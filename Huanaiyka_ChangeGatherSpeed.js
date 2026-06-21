/*:
 * @target MZ
 * @plugindesc 调整「集合队列成员」事件指令的执行速度。
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件仅修改「集合队列成员」事件指令中，跟随者向玩家移动的速度。
 * 玩家自身的移动速度、平时跟随者的行走速度均不会改变。
 *
 * @param gatherSpeed
 * @text 集合速度
 * @desc 集合时跟随者的移动速度（数值越大越快）。默认5。
 * @type number
 * @min 1
 * @max 10
 * @default 5
 *
 * @help
 * 使用说明：
 * 1. 将本插件保存到你的项目目录/js/plugins/
 * 2. 在 RPG Maker MZ 插件管理器中添加并开启该插件
 * 3. 根据需要调整「集合速度」参数（默认5，原版速度为4）
 * 4. 游戏中正常使用「集合队列成员」事件指令即可生效
 *
 * 注意：
 * - 本插件不会影响非集合状态下的跟随者移动速度
 * - 速度数值越大，集合越快，建议 5~6 之间
 */

(function() {
    const parameters = PluginManager.parameters('Huanaiyka_ChangeGatherSpeed');
    const gatherSpeed = Number(parameters['gatherSpeed'] || 6);

    // 修改 Game_Follower 的 updateMove 方法
    const _Game_Follower_updateMove = Game_Follower.prototype.updateMove;
    Game_Follower.prototype.updateMove = function() {
        // 检查队伍是否处于集合状态 (通过检查是否有集合动画)
        // 当 gather 正在进行时, 此值会为 true
        const isGathering = $gamePlayer && $gamePlayer._followers && $gamePlayer._followers._gathering;
        
        if (isGathering) {
            // 强制设置跟随者的移动速度为自定义的集合速度
            // 注意: 跟随者的速度范围也是 1-6，但 MZ 内建方法直接设置即可
            this.setMoveSpeed(gatherSpeed);
        }
        
        // 调用原始的 updateMove 方法
        _Game_Follower_updateMove.call(this);
    };
})();