/*:
 * @target MZ
 * @plugindesc 数值输入处理可按取消键退出
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 将此插件加载到插件列表中（建议放在靠下的位置），无需任何设置。
 * 
 * 游戏中执行“数值输入的处理”时，按取消键即可立刻结束输入，
 * 并将指定的变量设置为 -1。（可能还需处理“如果变量为-1”时的分支条件）
 * 
============================================================================
 * 其他插件
 * ============================================================================
 * 如果你需要更完善的数值输入体验（触摸屏按钮、自定义返回值、文字前缀后缀、
 * 数字位移动按钮、动态范围等），建议使用 Panda 的 PANDA_ExNumberInput.js。
 * 该插件功能更全面，同样可以实现本插件的取消功能。
 * 本插件的特点：无需任何插件指令配置，不改变默认UI，开启即可全局适用。
 * 
 * ============================================================================
 * 兼容性说明
 * ============================================================================
 * 本插件直接修改了 Window_NumberInput 的 isCancelEnabled 和 processCancel。
 * 如果其他插件也修改了这两个方法，可能会产生冲突，请将此插件放在它们下方。
 * 
 */

(() => {
    'use strict';

    // 强制允许取消键
    const _isCancelEnabled = Window_NumberInput.prototype.isCancelEnabled;
    Window_NumberInput.prototype.isCancelEnabled = function() {
        return true;
    };

    // 重写取消处理：模拟一次成功的输入（但值为 -1），然后正常关闭
    Window_NumberInput.prototype.processCancel = function() {
        const varId = $gameMessage.numInputVariableId();
        if (varId > 0) {
            $gameVariables.setValue(varId, -1);
        }

// 关键：不调用原始取消流程（那会直接无效化输入），
// 而是手动关闭窗口并结束消息等待，让事件解释器继续执行后续命令
        this.deactivate();
        this.close();
        
        // 结束消息窗口的等待状态
        if (this._messageWindow) {
            this._messageWindow.terminateMessage();
        }
        
        // 刷新输入数据（可选，避免残留状态）
        this.updateInputData();
    };
})();