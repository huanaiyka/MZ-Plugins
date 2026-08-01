/*:
 * @plugindesc 状态备注控制敌人透明度
 * @target MZ
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 本插件允许通过在状态的备注中添加标签，动态调整敌人精灵的透明度。
 * 
 * 标签格式：
 *   <transparent:数值>   （例如 <transparent:128>）
 *   数值范围 0～255，0=全透明，255=完全不透明。
 * 
 * 透明度规则：
 *   - 若敌人拥有多个带透明度标签的状态，取最小值（最透明）。
 *   - 若敌人没有任何带标签的状态，则使用【默认透明度】。
 *   - 若敌人死亡，则不干预透明度，让默认死亡动画正常播放。
 * 
 *   @param defaultOpacity
 *   @text 默认透明度
 *   @desc 敌人没有透明度状态时使用的透明度（0全透明～255不透明）
 *   @type number
 *   @min 0
 *   @max 255
 *   @default 255
 * 
 *   @param tagName
 *   @text 标签名称
 *   @desc 在状态备注中用于指定透明度的标签名，格式为 <标签:数值>
 *   @default transparent
 */

(() => {
    // 自动获取当前脚本文件名，防止因重命名脚本导致参数读取失败
    const scriptName = document.currentScript ? document.currentScript.src.match(/\/([^\/]+)\.js$/)[1] : 'Huanaiyka_EnemyStateImage';
    const parameters = PluginManager.parameters(scriptName);
    
    // 增加严格兜底：若解析结果无效或未设置，强制默认为 255
    const parsedOpacity = Number(parameters.defaultOpacity);
    const defaultOpacity = (isNaN(parsedOpacity) || parameters.defaultOpacity === undefined || parameters.defaultOpacity === '') ? 255 : parsedOpacity;
    
    const tagName = String(parameters.tagName || 'transparent');

    // 构建正则表达式，用于从备注中提取透明度数值
    const tagRegex = new RegExp(`<${tagName}:\\s*(\\d+)>`, 'i');

    // 保存原始 update 方法
    const _Sprite_Enemy_update = Sprite_Enemy.prototype.update;

    // 扩展 Sprite_Enemy 的 update 方法
    Sprite_Enemy.prototype.update = function() {
        _Sprite_Enemy_update.call(this);
        this.updateTransparencyByStates();
    };

    // 根据状态计算并设置透明度
    Sprite_Enemy.prototype.updateTransparencyByStates = function() {
        const battler = this._battler;
        if (!battler || !battler.isEnemy()) return;

        // 死亡时不干预透明度，让默认死亡动画正常播放
        if (battler.isDead()) {
            return;
        }

        const states = battler.states();
        let minOpacity = defaultOpacity;      // 默认透明度
        let found = false;

        for (const state of states) {
            const note = state.note;
            if (!note) continue; // 安全检查：防止 note 为空

            const match = note.match(tagRegex);
            if (match) {
                const opacity = parseInt(match[1], 10);
                if (!isNaN(opacity) && opacity >= 0 && opacity <= 255) {
                    minOpacity = Math.min(minOpacity, opacity);
                    found = true;
                }
            }
        }

        // 更新精灵透明度
        this.opacity = found ? minOpacity : defaultOpacity;
    };
})();