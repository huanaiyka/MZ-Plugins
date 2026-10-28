/*:
 * @target MZ
 * @plugindesc 菜单列表点击空白处交互增强
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * 
 * @help
 * ============================================================================
 * ■ 插件功能说明
 * ============================================================================
 * 本插件为 RPG Maker MZ 的物品、技能与装备界面提供移动端/鼠标的点击操作优化：
 * 
 * 1. 物品界面 (Scene_Item)：
 *    - 当焦点在顶部分类栏（如：道具/武器/防具/关键物品）时，点击下方物品列表的
 *      任意空白处，会自动切回/激活物品列表窗口并选中第 1 个物品。
 *    - 直接点击具体物品项目时，自动选中该物品并触发“确定”使用。
 * 
 * 2. 技能界面 (Scene_Skill)：
 *    - 当焦点在顶部技能类型栏时，点击下方技能列表任意空白处，会自动激活技能列表
 *      窗口并选中第 1 个技能。
 *    - 直接点击具体技能项目时，自动选中该技能并触发“确定”使用/释放。
 * 
 * 3. 装备界面 (Scene_Equip)：
 *    - 在“装备 / 最强装备 / 全部脱下”指令处，当光标停留在“装备”选项时，
 *      点击界面内任意区域（除返回按钮/切换角色按钮外），均可解除锁定直接进入装备槽。
 *    - 进入装备槽和装备选择列表后，完全恢复原生交互，不再干涉。
 * 
 * 4. 全局防误触保护：
 *    - 每次进入相关场景（物品/技能/装备）时，系统会在设置的保护时间内（默认 100ms）
 *      忽略一切点击，防止连续快速操作导致误触。
 * 
 * ============================================================================
 * ■ 参数设置
 * ============================================================================
 * @param touchProtectTime
 * @text 防误触时间(毫秒)
 * @desc 打开菜单/切换场景后忽略触摸点击的时间（毫秒）。设置为 0 即关闭防误触。
 * @type number
 * @min 0
 * @default 100
 * 
 * ============================================================================
 * ■ 兼容性与配置建议
 * ============================================================================
 * - 本插件适用于 RPG Maker MZ v1.0.0 及更高版本。
 * - 已兼容扩展插件：DarkPlasma_EquipItemInMenuItem。
 * - 建议将本插件放置在菜单UI修改类插件的下方，以保证触摸重写生效。
 * 
 * ============================================================================
 * ■ 更新日志
 * ============================================================================
 * v1.0 - 初始版本，支持物品/技能列表空白区域直接激活与快速点击。
 * v1.1 - 修复选择目标角色时，点击角色误操作物品/技能列表的问题。
 * v1.2 - 兼容 DarkPlasma 扩展插件，修复物品命令窗口误跳转 BUG。
 * v1.3 - 新增装备界面“装备”指令点击空白处自动解锁/进入装备槽功能。
 * v1.4 - 重构装备指令窗口的点击拦截逻辑。
 * v1.5 - 改为在 Scene_Equip 场景层直接拦截触摸，彻底解决装备指令点击空白无响应的问题。
 * v1.6 - 移除 TouchInput.clear()，修复手机端回退键失效问题；
 *        改为在指令窗口矩形内精确拦截空白点击；
 *        新增 Window_EquipSlot 空白点击激活，保留点装备槽空白解锁的行为。
 * v1.7 - 修复点击装备槽空白处强制重置为第 0 个槽位（武器槽）导致的 Bug。
 * v1.8 - 移除 Window_EquipSlot 的重写逻辑，仅在指令窗口处解除锁定，不再干涉装备槽与物品列表。
 * v1.9 - 修复装备指令处点击框架外空白区域无法解除锁定的 BUG。
 */

(function() {
    const pluginName = 'Huanaiyka_MenuListClickBlank';
    const parameters = PluginManager.parameters(pluginName);
    const touchProtectTime = Number(parameters['touchProtectTime'] || 100);

    // 为物品、技能、装备场景添加防误触计时器
    function mixinTouchProtect(sceneClass) {
        const _create = sceneClass.prototype.create;
        sceneClass.prototype.create = function() {
            _create.call(this);
            if (touchProtectTime > 0) this._touchProtectUntil = Date.now() + touchProtectTime;
        };
        const _update = sceneClass.prototype.update;
        sceneClass.prototype.update = function() {
            _update.call(this);
            if (this._touchProtectUntil && Date.now() >= this._touchProtectUntil) this._touchProtectUntil = 0;
        };
        sceneClass.prototype.isTouchProtectionActive = function() {
            return this._touchProtectUntil && Date.now() < this._touchProtectUntil;
        };
    }
    mixinTouchProtect(Scene_Item);
    mixinTouchProtect(Scene_Skill);
    mixinTouchProtect(Scene_Equip);

    function isGlobalTouchProtectionActive() {
        const scene = SceneManager._scene;
        return scene && typeof scene.isTouchProtectionActive === 'function' && scene.isTouchProtectionActive();
    }

    // 为相关顶部分类窗口添加防误触
    function addProtectionToWindow(windowClass) {
        const _processTouch = windowClass.prototype.processTouch;
        windowClass.prototype.processTouch = function() {
            const scene = SceneManager._scene;
            if (scene instanceof Scene_Item || scene instanceof Scene_Skill || scene instanceof Scene_Equip) {
                if (isGlobalTouchProtectionActive()) return;
            }
            _processTouch.call(this);
        };
    }
    addProtectionToWindow(Window_ItemCategory);
    addProtectionToWindow(Window_SkillType);

    // ===== 物品列表（仅在物品场景中生效） =====
    const _Window_ItemList_processTouch = Window_ItemList.prototype.processTouch;
    Window_ItemList.prototype.processTouch = function() {
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Item)) {
            _Window_ItemList_processTouch.call(this);
            return;
        }
        
        if (scene._actorWindow && scene._actorWindow.active) {
            return;
        }
        
        if (scene._itemCommandWindow && scene._itemCommandWindow.active && scene._itemCommandWindow.visible) {
            return;
        }
        
        if (isGlobalTouchProtectionActive()) return;
        if (TouchInput.isTriggered()) {
            const x = TouchInput.x, y = TouchInput.y;
            if (this.isTouchedInsideFrame()) {
                const hitIndex = this.hitTest(x, y);
                if (!this.active) {
                    this.activate();
                    if (scene._categoryWindow) scene._categoryWindow.deactivate();
                    if (scene._commandWindow) scene._commandWindow.deactivate();
                    if (hitIndex >= 0) {
                        this.select(hitIndex);
                        this.processOk();
                    } else {
                        if (this.maxItems() > 0) this.select(0);
                    }
                    return;
                }
            }
        }
        _Window_ItemList_processTouch.call(this);
    };

    // ===== 技能列表（仅在技能场景中生效） =====
    const _Window_SkillList_processTouch = Window_SkillList.prototype.processTouch;
    Window_SkillList.prototype.processTouch = function() {
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Skill)) {
            _Window_SkillList_processTouch.call(this);
            return;
        }
        
        if (scene._actorWindow && scene._actorWindow.active) {
            return;
        }
        
        if (isGlobalTouchProtectionActive()) return;
        if (TouchInput.isTriggered()) {
            const x = TouchInput.x, y = TouchInput.y;
            if (this.isTouchedInsideFrame()) {
                const hitIndex = this.hitTest(x, y);
                if (!this.active) {
                    this.activate();
                    if (scene._commandWindow) scene._commandWindow.deactivate();
                    if (scene._skillTypeWindow) scene._skillTypeWindow.deactivate();
                    if (hitIndex >= 0) {
                        this.select(hitIndex);
                        this.processOk();
                    } else {
                        if (this.maxItems() > 0) this.select(0);
                    }
                    return;
                }
            }
        }
        _Window_SkillList_processTouch.call(this);
    };

    // ===== 装备指令窗口场景层控制 =====
    const _Scene_Equip_update = Scene_Equip.prototype.update;
    Scene_Equip.prototype.update = function() {
        _Scene_Equip_update.call(this);
        this.updateCommandBlankTouch();
    };

    Scene_Equip.prototype.updateCommandBlankTouch = function() {
        if (isGlobalTouchProtectionActive()) return;
        if (!this._commandWindow) return;
        // 只有当焦点处于指令窗口且停留在第 0 项（"装备"）时生效
        if (!this._commandWindow.active || this._commandWindow.index() !== 0) return;
        if (!this._commandWindow.visible) return;
        if (!TouchInput.isTriggered()) return;

        const tx = TouchInput.x;
        const ty = TouchInput.y;

        // 如果点击到了右上角的“取消/返回按钮”，不拦截，让原生逻辑处理返回
        if (this._cancelButton && this._cancelButton.isPressed()) return;

        // 如果点击到了左/右“切换角色按钮”，不拦截
        if (this._pageupButton && this._pageupButton.isPressed()) return;
        if (this._pagedownButton && this._pagedownButton.isPressed()) return;

        // 如果点击到了“最强装备”(1号) 或 “全部脱下”(2号) 按钮，交给原生指令处理
        if (this._commandWindow.isTouchedInsideFrame()) {
            const hitIndex = this._commandWindow.hitTest(tx, ty);
            if (hitIndex === 1 || hitIndex === 2) return;
        }

        // 点击界面任意其他区域（装备槽列表、界面空白处等）：直接解除指令锁定进入装备槽
        this._commandWindow.playOkSound();
        this._commandWindow.processOk();
    };
})();