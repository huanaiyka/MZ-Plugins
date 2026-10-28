/*:
 * @target MZ
 * @plugindesc 用插件指令控制队列行进：强制关闭 / 强制开启 / 恢复原版
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @param defaultMode
 * @text 默认模式
 * @desc 游戏启动时的初始模式。插件指令可在运行中随时覆盖。
 * @type select
 * @option 恢复原版逻辑
 * @value AUTO
 * @option 强制关闭队列
 * @value FORCE_OFF
 * @option 强制开启队列
 * @value FORCE_ON
 * @default AUTO
 *
 * @command MODE
 * @text 设置队列模式
 * @desc 控制跟随者的显示模式。
 *
 * @arg mode
 * @text 模式
 * @desc 选择要应用的队列模式。
 * @type select
 * @option 强制关闭队列
 * @value FORCE_OFF
 * @option 强制开启队列
 * @value FORCE_ON
 * @option 恢复原版逻辑
 * @value AUTO
 * @default AUTO
 *
 * @help
 * ============================================================================
 * 插件参数
 * ============================================================================
 *
 * 默认模式（defaultMode）
 *   —— 决定游戏启动时的初始模式：
 *     恢复原版逻辑 跟随原版逻辑，受数据库设置和事件指令控制（默认）。
 *     强制关闭队列 启动即强制关闭，跟随者不显示，事件指令无法开启。
 *     强制开启队列 启动即强制开启，跟随者始终显示，事件指令无法关闭。
 *
 * ============================================================================
 * 插件指令
 * ============================================================================
 *
 * Huanaiyka_FollowersVisibility
 *   模式：强制关闭队列
 *   —— 强制关闭队列行进，跟随者不再显示。即使事件指令开启队列行进也无效。
 *
 * Huanaiyka_FollowersVisibility
 *   模式：强制开启队列
 *   —— 强制开启队列行进，跟随者始终显示。即使事件指令关闭队列行进也无效。
 *
 * Huanaiyka_FollowersVisibility
 *   模式：恢复原版逻辑
 *   —— 解除强制，恢复游戏原本的队列行进逻辑，受数据库设置和事件指令控制。
 *
 * 插件指令会覆盖插件参数的初始设置，可在游戏运行中任意切换。
 *
 * ============================================================================
 * 说明
 * ============================================================================
 * 本插件通过覆盖 Game_Follower.prototype.isVisible 实现。
 * 强制关闭时 isVisible 恒返回 false；
 * 强制开启时 isVisible 恒返回 true；
 * 恢复原版时调用原始逻辑，受数据库设置和事件指令控制。
 */

(() => {
    'use strict';

    const PLUGIN_NAME = 'Huanaiyka_FollowersVisibility';

    // 模式常量
    const MODE = {
        AUTO: 'AUTO',
        FORCE_OFF: 'FORCE_OFF',
        FORCE_ON: 'FORCE_ON'
    };

    // 读取插件参数，作为初始模式（参数三选一，默认 AUTO）
    const pluginParams = PluginManager.parameters(PLUGIN_NAME);
    const paramDefaultMode = pluginParams['defaultMode'] || MODE.AUTO;

    // 当前模式，初始值来自插件参数；参数缺失或非法时兜底为 AUTO
    let _mode = MODE[paramDefaultMode] || MODE.AUTO;

    // 保存原始方法
    const _Game_Follower_isVisible = Game_Follower.prototype.isVisible;

    Game_Follower.prototype.isVisible = function() {
        if (_mode === MODE.FORCE_OFF) {
            return false;
        }
        if (_mode === MODE.FORCE_ON) {
            return true;
        }
        return _Game_Follower_isVisible.call(this);
    };

    // 刷新当前地图上的跟随者显示
    const refreshFollowers = () => {
        if (SceneManager._scene instanceof Scene_Map) {
            $gamePlayer.refresh();
            $gamePlayer.followers().refresh();
        }
    };

    // 切换模式
    const setMode = (mode) => {
        if (!MODE[mode]) {
            console.warn(`[${PLUGIN_NAME}] 未知模式: ${mode}`);
            return;
        }
        _mode = MODE[mode];
        refreshFollowers();
    };

    // 注册插件指令
    PluginManager.registerCommand(PLUGIN_NAME, 'MODE', (args) => {
        setMode(args.mode);
    });
})();