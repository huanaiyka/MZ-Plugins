/*:
 * @target MZ
 * @plugindesc 点击物品/技能列表空白区域激活窗口
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 为物品、技能菜单提供优化交互：
 * - 点击列表空白处激活窗口，并选中第一个项目。
 * - 点击项目直接使用。
 * - 打开菜单后指定时间内忽略点击，防止误触。
 * 
 * 【修复记录】
 * v1.1 (2025) - 修复选择物品/技能后选择目标时，点击角色会误操作物品/技能列表的问题。
 * v1.2 (2025) - 兼容 DarkPlasma_EquipItemInMenuItem。
 *                修复在物品命令窗口（装备/使用菜单）打开时，再次点击同一物品导致光标错误跳转的bug。
 * 
 * @param touchProtectTime
 * @text 防误触时间(毫秒)
 * @type number
 * @default 100
 */

(function() {
    const parameters = PluginManager.parameters('Huanaiyka_ItemListClickBlank');
    const touchProtectTime = Number(parameters['touchProtectTime'] || 100);

    // 仅为物品和技能场景添加防误触计时器
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

    function isGlobalTouchProtectionActive() {
        const scene = SceneManager._scene;
        return scene && typeof scene.isTouchProtectionActive === 'function' && scene.isTouchProtectionActive();
    }

    // 为相关窗口添加防误触（仅限物品和技能场景中的窗口）
    function addProtectionToWindow(windowClass) {
        const _processTouch = windowClass.prototype.processTouch;
        windowClass.prototype.processTouch = function() {
            const scene = SceneManager._scene;
            if (scene instanceof Scene_Item || scene instanceof Scene_Skill) {
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
        
        // 如果正在选择使用对象（角色选择窗口激活），物品列表不响应触摸
        if (scene._actorWindow && scene._actorWindow.active) {
            return;
        }
        
        // 兼容 DarkPlasma_EquipItemInMenuItem：
        // 当物品命令窗口（装备/使用/取消）显示并激活时，物品列表不响应触摸，防止干扰命令菜单
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
        
        // 如果正在选择技能对象，技能列表不响应触摸
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
})();