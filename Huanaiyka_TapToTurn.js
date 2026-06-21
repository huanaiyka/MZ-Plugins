/*:
 * @plugindesc 轻点方向键转向
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @target MZ
 *
 * @param thresholdFrames
 * @text 长按阈值（帧）
 * @desc 按住方向键超过此帧数才开始移动。1帧约0.017秒（60fps）
 * @type number
 * @min 1
 * @default 1
 *
 * @param emptyFramesTolerance
 * @text 空帧容忍度（帧）
 * @desc 在切换方向时，允许短暂无方向输入的帧数，超过则重置移动状态。默认3帧（约0.05秒）
 * @type number
 * @min 0
 * @default 3
 *
 * @param skipKey
 * @text 跳过按键
 * @desc 按下此键时临时禁用转向功能，恢复原版立即移动。常用键名：shift, control, alt
 * @type string
 * @default shift
 *
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 此插件让玩家角色轻点方向键时仅转向，长按超过阈值后才开始连续移动。
 * 按下指定的跳过按键（如 Shift）时，临时恢复原版立即移动行为，便于快速操作。
 * 
 * 特性：
 *   - 轻点（短按）→ 角色转向
 *   - 长按超过阈值 → 角色开始移动
 *   - 移动过程中改变方向 → 立即响应，无延迟
 *   - 快速切换方向（如从左到右）时，即使中间有短暂无方向，也不会卡顿
 *   - 按住跳过按键时，方向键立即移动（原版行为）
 * 
 * 参数说明：
 *   - 长按阈值：数值越小响应越快，但容易误判为移动。推荐3~6帧。
 *   - 空帧容忍度：在切换方向时，允许角色无方向输入的帧数，超过则重置移动模式。
 *     设置0则任何无方向都会立即重置（相当于v1.1.0行为）。
 *   - 跳过按键：按下此键时插件功能暂时关闭，方向键立即移动。支持常用修饰键：shift, control, alt。
 * 
 * 使用方式：放入 js/plugins 并开启即可。
 * ============================================================================
 */

(() => {
    const pluginName = 'Huanaiyka_TapToTurn';
    const params = PluginManager.parameters(pluginName);
    const thresholdFrames = Number(params['thresholdFrames'] || 3);
    const emptyFramesTolerance = Number(params['emptyFramesTolerance'] || 3);
    const skipKey = String(params['skipKey'] || 'shift').toLowerCase();

    const _Game_Player_moveByInput = Game_Player.prototype.moveByInput;

    Game_Player.prototype.moveByInput = function() {
        // 如果无法移动（如事件中），重置状态并返回
        if (!this.canMove()) {
            this._turnMoveMode = false;
            this._lastDir = 0;
            this._pressStartFrame = null;
            this._emptyFrameCount = 0;
            return;
        }

        // 初始化内部属性（兼容旧存档）
        if (this._turnMoveMode === undefined) this._turnMoveMode = false;
        if (this._lastDir === undefined) this._lastDir = 0;
        if (this._pressStartFrame === undefined) this._pressStartFrame = null;
        if (this._emptyFrameCount === undefined) this._emptyFrameCount = 0;

        // 检测跳过键是否按下
        const skipPressed = Input.isPressed(skipKey);

        // 如果跳过键按下，重置插件状态并直接调用原方法（立即移动）
        if (skipPressed) {
            // 重置插件内部状态，释放跳过键后重新开始检测
            this._turnMoveMode = false;
            this._lastDir = 0;
            this._pressStartFrame = null;
            this._emptyFrameCount = 0;
            _Game_Player_moveByInput.call(this);
            return;
        }

        const d = Input.dir4;                     // 当前按下的方向（0表示无）
        const currentFrame = Graphics.frameCount;  // 当前帧计数

        // ----- 无方向输入 -----
        if (d === 0) {
            // 如果之前是移动模式，增加空帧计数
            if (this._turnMoveMode) {
                this._emptyFrameCount++;
                // 如果空帧超过容忍度，则退出移动模式
                if (this._emptyFrameCount > emptyFramesTolerance) {
                    this._turnMoveMode = false;
                    this._lastDir = 0;
                    this._pressStartFrame = null;
                }
            } else {
                // 非移动模式下，无方向直接重置
                this._lastDir = 0;
                this._pressStartFrame = null;
            }
            // 无论何种情况，无方向时不移动
            _Game_Player_moveByInput.call(this);
            return;
        }

        // ----- 有方向输入 -----
        // 重置空帧计数
        this._emptyFrameCount = 0;

        if (this._turnMoveMode) {
            // 已进入移动模式：直接调用原方法（自动转向并移动）
            _Game_Player_moveByInput.call(this);
        } else {
            // 尚未进入移动模式
            // 如果方向改变，更新记录并立即转向
            if (d !== this._lastDir) {
                this._lastDir = d;
                this._pressStartFrame = currentFrame;
                this.setDirection(d);
            }

            // 计算当前方向已按下的帧数
            const framesPressed = currentFrame - this._pressStartFrame;

            if (framesPressed >= thresholdFrames) {
                // 超过阈值：进入移动模式，并立即移动一次
                this._turnMoveMode = true;
                _Game_Player_moveByInput.call(this);
            }
            // 否则：只转向（已处理），不移动
        }
    };
})();