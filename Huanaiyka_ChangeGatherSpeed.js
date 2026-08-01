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
 * @max 6
 * @default 5
 *
 * @help
 * 使用说明：
 * 1. 将本插件保存为 Huanaiyka_ChangeGatherSpeed.js 到你的项目目录/js/plugins/
 * 2. 在 RPG Maker MZ 插件管理器中添加并开启该插件
 * 3. 根据需要调整「集合速度」参数（默认5，原版速度为4）
 * 4. 游戏中正常使用「集合队列成员」事件指令即可生效
 */

(function() {
    // 动态获取当前插件文件名，防止改名后读取失败
    const pluginName = document.currentScript.src.match(/^.*\/(.*)\.js$/)[1];
    const parameters = PluginManager.parameters(pluginName);
    const gatherSpeed = Number(parameters['gatherSpeed'] || 5);

    // 1. 备份跟随者原始速度的恢复逻辑
    const _Game_Followers_gather = Game_Followers.prototype.gather;
    Game_Followers.prototype.gather = function() {
        _Game_Followers_gather.call(this);
        // 标记开始集合，并为每个跟随者记录原始速度
        for (const follower of this._data) {
            follower._originalSpeed = follower.realMoveSpeed();
        }
    };

    // 2. 修改 Game_Follower 的 updateMove 方法
    const _Game_Follower_updateMove = Game_Follower.prototype.updateMove;
    Game_Follower.prototype.updateMove = function() {
        const isGathering = $gamePlayer && $gamePlayer._followers && $gamePlayer._followers.areGathering();
        
        if (isGathering) {
            // 强制设置集合时的速度
            this.setMoveSpeed(gatherSpeed);
        } else if (this._originalSpeed !== undefined) {
            // 集合结束后恢复原始速度
            this.setMoveSpeed(this._originalSpeed);
            delete this._originalSpeed;
        }
        
        _Game_Follower_updateMove.call(this);
    };
})();