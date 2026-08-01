/*:
 * @target MZ
 * @plugindesc 打开商店时自动进入商品列表，并支持仅购买时快速退出
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Pluginsz
 *
 * @param autoSilentEnter
 * @text 静默自动进入
 * @desc 自动进入商品列表时是否不播放确定音效。
 * @type boolean
 * @default true
 *
 * @param directExitWhenPurchaseOnly
 * @text 仅购买时取消直接退出
 * @desc 当商店设置为“仅购买”且从商品列表按取消时，是否直接退出商店。
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
 * 如果勾选了“仅购买时取消直接退出”且当前商店开启了“仅购买”选项，
 * 在商品购买列表中按“取消”按键时，将直接退出商店场景，无需二次确认。
 * 
 * 【参数说明】
 * - 静默自动进入：开启后（默认），自动进入商品列表时不会播放确定音效。
 * - 仅购买时取消直接退出：开启后（默认），在仅购买模式下按取消直接退出商店。
 * ============================================================================
 */

(function() {
    // 获取插件参数
    const pluginName = "Huanaiyka_AutoShopEnter";
    const parameters = PluginManager.parameters(pluginName);
    const silent = parameters['autoSilentEnter'] !== 'false';
    const directExitWhenPurchaseOnly = parameters['directExitWhenPurchaseOnly'] !== 'false';

    // 保存原始 initialize 方法
    const _Scene_Shop_initialize = Scene_Shop.prototype.initialize;
    Scene_Shop.prototype.initialize = function() {
        _Scene_Shop_initialize.call(this);
        this._autoEnterTriggered = false;
    };

    // 保存原始 update 方法
    const _Scene_Shop_update = Scene_Shop.prototype.update;
    Scene_Shop.prototype.update = function() {
        _Scene_Shop_update.call(this);

        // 检查是否满足自动进入条件：未触发过、命令窗口存在、激活且可见
        if (!this._autoEnterTriggered && this._commandWindow && this._commandWindow.active && this._commandWindow.visible) {
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

    // 重写/扩展 购买窗口的取消（Cancel）回调
    const _Scene_Shop_onBuyCancel = Scene_Shop.prototype.onBuyCancel;
    Scene_Shop.prototype.onBuyCancel = function() {
        // 如果开启了参数，且商店当前为“仅购买”模式
        if (directExitWhenPurchaseOnly && this._purchaseOnly) {
            this.buyCancelDirectExit();
        } else {
            // 否则执行默认逻辑（返回命令选择窗口）
            _Scene_Shop_onBuyCancel.call(this);
        }
    };

    // 定义直接退出的逻辑处理
    Scene_Shop.prototype.buyCancelDirectExit = function() {
        this._buyWindow.deselect();
        this._statusWindow.setItem(null);
        this._helpWindow.clear();
        // 播放取消音效并弹出（退出）商店场景
        SoundManager.playCancel();
        this.popScene();
    };

})();