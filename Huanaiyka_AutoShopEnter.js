/*:
 * @target MZ
 * @plugindesc 打开商店时自动进入商品列表
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @param autoSilentEnter
 * @text 静默自动进入
 * @desc 自动进入商品列表时是否不播放确定音效。
 * @type boolean
 * @default true
 *
 * @help ============================================================================
 * Huanaiyka_AutoShopEnter.js
 * ----------------------------------------------------------------------------
 * 【功能说明】
 * 执行“商店处理”事件指令时，商店场景会直接显示商品购买列表，
 * 无需再手动选择“购买”命令，相当于自动为你按下了确认键。
 * 
 * 如果从购买界面按“取消”，则会正常返回到“购买/卖出/退出”命令窗口，
 * 并且不会再自动进入购买，玩家可以自由选择卖出等操作，窗口显示正常。
 * 
 * 【参数说明】
 * - 静默自动进入：开启后（默认），自动进入商品列表时不会播放确定音效；
 *   关闭后则会播放确定音效，与手动按下购买键效果一致。
 * 
 * 【使用说明】
 * 1. 将本插件保存为 .js 文件，放入项目的 js/plugins 文件夹。
 * 2. 在 RPG Maker MZ 编辑器插件管理中添加并启用本插件。
 * 3. 根据需要调整“静默自动进入”参数。
 * 
 * 【更新日志】
 * v1.2.0 - 增加“静默自动进入”参数，可关闭自动进入时的确定音效，默认关闭音效。
 * v1.1.0 - 修复了从出售界面返回后窗口混乱的问题，改用模拟按键方式确保状态正确。
 * ============================================================================
 */

(function() {
    // 获取插件参数
    const pluginName = "Huanaiyka_AutoShopEnter";
    const parameters = PluginManager.parameters(pluginName);
    // 默认静默模式为 true（不播放音效），仅当参数显式设置为 "false" 时才播放音效
    const silent = parameters['autoSilentEnter'] !== 'false';
    
    // 保存原始 update 方法
    const _Scene_Shop_update = Scene_Shop.prototype.update;
    
    // 重写 initialize，添加自动进入标志
    const _Scene_Shop_initialize = Scene_Shop.prototype.initialize;
    Scene_Shop.prototype.initialize = function() {
        _Scene_Shop_initialize.call(this);
        this._autoEnterTriggered = false;
    };
    
    Scene_Shop.prototype.update = function() {
        // 先调用原始更新，确保窗口状态正常
        _Scene_Shop_update.call(this);
        
        // 检查是否满足自动进入条件：未触发过、命令窗口存在、激活且可见
        if (!this._autoEnterTriggered && this._commandWindow && this._commandWindow.active && this._commandWindow.visible) {
            // 标记已触发，防止重复执行
            this._autoEnterTriggered = true;
            
            if (silent) {
                // 静默模式：临时屏蔽确定音效
                const originalPlayOk = SoundManager.playOk;
                SoundManager.playOk = function() {};
                try {
                    this._commandWindow.processOk();
                } finally {
                    SoundManager.playOk = originalPlayOk;
                }
            } else {
                // 非静默模式：正常播放音效
                this._commandWindow.processOk();
            }
        }
    };
})();