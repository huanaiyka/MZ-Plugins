/*:
 * @target MZ
 * @plugindesc 隐藏菜单中的原生选项，并可设置其默认开启状态
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 说明
 * ============================================================================
 * 本插件允许你通过插件参数，自由隐藏 RPG Maker MZ 原生的选项菜单项目，
 * 并可指定这些选项在游戏内的初始默认状态。玩家之后仍可在菜单中自由开关，
 * 修改结果会正常保存。
 *
 * ============================================================================
 * 参数说明
 * ============================================================================
 * - 隐藏触屏UI：开启后，菜单中将不再显示"触屏UI"选项。
 * - 隐藏记住指令：开启后，菜单中将不再显示"记住指令"选项。
 * - 隐藏始终跑步：开启后，菜单中将不再显示"始终跑步"选项。
 * - 默认开启触屏UI：触屏UI的初始默认状态。
 * - 默认开启记住指令：记住指令的初始默认状态。
 * - 默认开启始终跑步：始终跑步的初始默认状态。
 *
 * @param HideTouchUI
 * @text 隐藏触屏UI
 * @type boolean
 * @on 隐藏
 * @off 显示
 * @default false
 * @desc 开启后，菜单中将不再显示"触屏UI"选项。
 *
 * @param HideCommandRemember
 * @text 隐藏记住指令
 * @type boolean
 * @on 隐藏
 * @off 显示
 * @default false
 * @desc 开启后，菜单中将不再显示"记住指令"选项。
 *
 * @param HideAlwaysDash
 * @text 隐藏始终跑步
 * @type boolean
 * @on 隐藏
 * @off 显示
 * @default false
 * @desc 开启后，菜单中将不再显示"始终跑步"选项。
 *
 * @param DefaultTouchUI
 * @text 默认开启触屏UI
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default false
 * @desc 触屏UI的初始默认状态（玩家之后可自行修改并保存）。
 *
 * @param DefaultCommandRemember
 * @text 默认开启记住指令
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default false
 * @desc 记住指令的初始默认状态（玩家之后可自行修改并保存）。
 *
 * @param DefaultAlwaysDash
 * @text 默认开启始终跑步
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default false
 * @desc 始终跑步的初始默认状态（玩家之后可自行修改并保存）。
 *
 */
(() => {
    'use strict';

    const PLUGIN_NAME = 'Huanaiyka_HideDefaultOptions';
    const params = PluginManager.parameters(PLUGIN_NAME);

    // 读取参数（兼容布尔值）
    const HIDE_TOUCH_UI = String(params['HideTouchUI']).toLowerCase() === 'true';
    const HIDE_COMMAND_REMEMBER = String(params['HideCommandRemember']).toLowerCase() === 'true';
    const HIDE_ALWAYS_DASH = String(params['HideAlwaysDash']).toLowerCase() === 'true';

    const DEFAULT_TOUCH_UI = String(params['DefaultTouchUI']).toLowerCase() === 'true';
    const DEFAULT_COMMAND_REMEMBER = String(params['DefaultCommandRemember']).toLowerCase() === 'true';
    const DEFAULT_ALWAYS_DASH = String(params['DefaultAlwaysDash']).toLowerCase() === 'true';

    //=============================================================================
    // ConfigManager
    //=============================================================================

    // 仅在生成默认配置时应用插件参数；玩家改过的值会从 config.rpgsave 读取，不受影响
    const _ConfigManager_applyDataDefaults = ConfigManager.applyDataDefaults;
    ConfigManager.applyDataDefaults = function() {
        _ConfigManager_applyDataDefaults.call(this);
        if (this._config) {
            this._config.touchUI = DEFAULT_TOUCH_UI;
            this._config.commandRemember = DEFAULT_COMMAND_REMEMBER;
            this._config.alwaysDash = DEFAULT_ALWAYS_DASH;
        }
    };

    //=============================================================================
    // Window_Options
    //=============================================================================
    
    const _Window_Options_makeCommandList = Window_Options.prototype.makeCommandList;
    Window_Options.prototype.makeCommandList = function() {
        _Window_Options_makeCommandList.call(this);
        
        // 过滤不需要的选项
        this._list = this._list.filter(item => {
            if (HIDE_TOUCH_UI && item.symbol === 'touchUI') return false;
            if (HIDE_COMMAND_REMEMBER && item.symbol === 'commandRemember') return false;
            if (HIDE_ALWAYS_DASH && item.symbol === 'alwaysDash') return false;
            return true;
        });
    };
})();