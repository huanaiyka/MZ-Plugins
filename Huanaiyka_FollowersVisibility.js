/*:
 * @target MZ
 * @plugindesc 用插件指令永久控制队列行进
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
 *   —— 决定新游戏启动时的初始模式：
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
 * 存档
 * ============================================================================
 * 当前模式保存在 $gameSystem 上，会随存档一起保存。
 * 读档后恢复存档时的模式；读旧存档（无此字段）时回退到插件参数。
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

    // 读取插件参数（仅用于新游戏 / 读旧档兜底）
    const pluginParams = PluginManager.parameters(PLUGIN_NAME);
    const paramDefaultMode = pluginParams['defaultMode'] || MODE.AUTO;
    const initialMode = MODE[paramDefaultMode] ? paramDefaultMode : MODE.AUTO;

    // 保存原始 isVisible
    const _Game_Follower_isVisible = Game_Follower.prototype.isVisible;

    // 读取当前模式（兜底：$gameSystem 未就绪时用插件参数）
    const getMode = () => {
        if (!$gameSystem) return initialMode;
        const mode = $gameSystem._followersVisibilityMode;
        return MODE[mode] ? mode : initialMode;
    };

    // 写入当前模式到 $gameSystem
    const setModeInternal = (mode) => {
        if ($gameSystem) {
            $gameSystem._followersVisibilityMode = mode;
        }
    };

    // 刷新当前地图上的跟随者显示
    const refreshFollowers = () => {
        if (SceneManager._scene instanceof Scene_Map) {
            $gamePlayer.refresh();
            $gamePlayer.followers().refresh();
        }
    };

    // 对外切换模式
    const setMode = (mode) => {
        if (!MODE[mode]) {
            console.warn(`[${PLUGIN_NAME}] 未知模式: ${mode}`);
            return;
        }
        setModeInternal(mode);
        refreshFollowers();
    };

    // ---- 覆盖 isVisible ----
    Game_Follower.prototype.isVisible = function() {
        const mode = getMode();
        if (mode === MODE.FORCE_OFF) return false;
        if (mode === MODE.FORCE_ON) return true;
        return _Game_Follower_isVisible.call(this);
    };

    // ---- 新游戏时初始化 ----
    const _DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _DataManager_setupNewGame.call(this);
        setModeInternal(initialMode);
    };

    // ---- 存档时确保字段写入 ----
    const _Game_System_onBeforeSave = Game_System.prototype.onBeforeSave;
    Game_System.prototype.onBeforeSave = function() {
        _Game_System_onBeforeSave.call(this);
        if (!MODE[this._followersVisibilityMode]) {
            this._followersVisibilityMode = initialMode;
        }
    };

    // ---- 读档时兜底（旧存档无字段） ----
    const _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
    Game_System.prototype.onAfterLoad = function() {
        _Game_System_onAfterLoad.call(this);
        if (!MODE[this._followersVisibilityMode]) {
            this._followersVisibilityMode = initialMode;
        }
        // 读档后场景还没完全刷新，延迟到下一帧再刷
        if (typeof SceneManager._scene !== 'undefined') {
            refreshFollowers();
        }
    };

    // ---- 注册插件指令 ----
    PluginManager.registerCommand(PLUGIN_NAME, 'MODE', (args) => {
        setMode(args.mode);
    });
})();