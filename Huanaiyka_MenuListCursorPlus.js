/*:
 * @target MZ
 * @plugindesc 菜单列表光标循环 + 长按加速
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help 
 * ============================================================================
 * 功能说明
 * ============================================================================
 * 1. 光标循环滚动：顶部按「上」跳到底部，底部按「下」跳到顶部。
 * 2. 长按加速：按住上/下键超过设定时间后，光标移动速度自动加快。
 * ============================================================================
 * 补充
 * ============================================================================
 *      - 加速移动时，到达列表顶部或底部会停止，不会循环跳转。
 *      - 松开按键后，恢复正常速度，此时循环功能恢复（如果开启）。
 * 
 * 两个功能可以单独开启/关闭，互不影响。
 * ============================================================================
 * 支持窗口类型（每种均可独立控制循环开关和加速开关）：
 *   - ItemList          ：菜单物品列表
 *   - SkillList         ：菜单技能列表
 *   - EquipItemList     ：装备列表（自定义）
 *   - EquipItem         ：装备选择页面（更换装备时的物品列表）
 *   - SaveFileList      ：存档列表
 *   - BattleItem        ：战斗中使用道具
 *   - BattleSkill       ：战斗中使用技能
 *   - EventItem         ：事件指令「选择物品」
 * ============================================================================
 * @param enableLoopGlobal
 * @text 【循环总开关】
 * @desc 若关闭，所有列表都不会循环；开启后则根据下方各项开关决定。
 * @type boolean
 * @default true
 * 
 * @param loopItemList
 * @text 物品列表（菜单）- 循环
 * @type boolean
 * @default true
 * 
 * @param loopSkillList
 * @text 技能列表（菜单）- 循环
 * @type boolean
 * @default true
 * 
 * @param loopEquipItemList
 * @text 装备列表 - 循环
 * @type boolean
 * @default true
 * 
 * @param loopEquipItem
 * @text 装备选择页面 - 循环
 * @desc 更换装备时的物品列表是否启用光标循环
 * @type boolean
 * @default true
 * 
 * @param loopSaveFileList
 * @text 存档列表 - 循环
 * @type boolean
 * @default true
 * 
 * @param loopBattleItem
 * @text 战斗道具列表 - 循环
 * @type boolean
 * @default true
 * 
 * @param loopBattleSkill
 * @text 战斗技能列表 - 循环
 * @type boolean
 * @default true
 * 
 * @param loopEventItem
 * @text 事件选择物品列表 - 循环
 * @type boolean
 * @default true
 * 
 * @param enableFastMove
 * @text 【长按加速总开关】
 * @desc 独立于循环开关，开启后按住上/下键一段时间光标移动会加速。
 * @type boolean
 * @default true
 * 
 * @param longPressDelay
 * @text 长按加速延迟(秒)
 * @desc 按住方向键超过此时间后开始加速移动。
 * @type number
 * @decimals 1
 * @default 1
 * 
 * @param fastMoveInterval
 * @text 加速移动间隔(帧)
 * @desc 加速模式下每多少帧移动一次（数值越小越快，1为每帧移动）。
 * @type number
 * @min 1
 * @default 8
 * 
 * @param fastMoveItemList
 * @text 物品列表（菜单）- 加速
 * @desc 单独控制物品列表的长按加速开关
 * @type boolean
 * @default true
 * 
 * @param fastMoveSkillList
 * @text 技能列表（菜单）- 加速
 * @desc 单独控制技能列表的长按加速开关
 * @type boolean
 * @default true
 * 
 * @param fastMoveEquipItemList
 * @text 装备列表 - 加速
 * @desc 单独控制装备列表的长按加速开关
 * @type boolean
 * @default true
 * 
 * @param fastMoveEquipItem
 * @text 装备选择页面 - 加速
 * @desc 单独控制装备选择页面的长按加速开关
 * @type boolean
 * @default true
 * 
 * @param fastMoveSaveFileList
 * @text 存档列表 - 加速
 * @desc 单独控制存档列表的长按加速开关
 * @type boolean
 * @default true
 * 
 * @param fastMoveBattleItem
 * @text 战斗道具列表 - 加速
 * @desc 单独控制战斗道具列表的长按加速开关
 * @type boolean
 * @default true
 * 
 * @param fastMoveBattleSkill
 * @text 战斗技能列表 - 加速
 * @desc 单独控制战斗技能列表的长按加速开关
 * @type boolean
 * @default true
 * 
 * @param fastMoveEventItem
 * @text 事件选择物品列表 - 加速
 * @desc 单独控制事件选择物品列表的长按加速开关
 * @type boolean
 * @default true
 */

(function() {
    const params = PluginManager.parameters('Huanaiyka_MenuListCursorPlus');
    
    function getBooleanParam(key, defaultValue) {
        const val = params[key];
        if (val === undefined || val === '') return defaultValue;
        return val === 'true';
    }
    
    const globalLoopEnable = getBooleanParam('enableLoopGlobal', true);
    const loopSwitches = {
        Window_ItemList:      getBooleanParam('loopItemList', true),
        Window_SkillList:     getBooleanParam('loopSkillList', true),
        Window_EquipItemList: getBooleanParam('loopEquipItemList', true),
        Window_EquipItem:     getBooleanParam('loopEquipItem', true),    // 新增装备选择页面
        Window_SaveFileList:  getBooleanParam('loopSaveFileList', true),
        Window_BattleItem:    getBooleanParam('loopBattleItem', true),
        Window_BattleSkill:   getBooleanParam('loopBattleSkill', true),
        Window_EventItem:     getBooleanParam('loopEventItem', true)
    };
    
    const globalFastMoveEnable = getBooleanParam('enableFastMove', true);
    const longPressDelay = parseFloat(params['longPressDelay'] || 0.3);
    const fastMoveInterval = parseInt(params['fastMoveInterval'] || 1, 10);
    
    const fastMoveSwitches = {
        Window_ItemList:      getBooleanParam('fastMoveItemList', true),
        Window_SkillList:     getBooleanParam('fastMoveSkillList', true),
        Window_EquipItemList: getBooleanParam('fastMoveEquipItemList', true),
        Window_EquipItem:     getBooleanParam('fastMoveEquipItem', true),   // 新增装备选择页面
        Window_SaveFileList:  getBooleanParam('fastMoveSaveFileList', true),
        Window_BattleItem:    getBooleanParam('fastMoveBattleItem', true),
        Window_BattleSkill:   getBooleanParam('fastMoveBattleSkill', true),
        Window_EventItem:     getBooleanParam('fastMoveEventItem', true)
    };
    
    function isWrapEnabled(win) {
        if (!globalLoopEnable) return false;
        if (!win || !win.constructor) return false;
        return loopSwitches[win.constructor.name] === true;
    }
    
    function isFastMoveEnabled(win) {
        if (!globalFastMoveEnable) return false;
        if (!win || !win.constructor) return false;
        const className = win.constructor.name;
        return fastMoveSwitches.hasOwnProperty(className) && fastMoveSwitches[className] === true;
    }
    
    const originalCursorUp = Window_Selectable.prototype.cursorUp;
    const originalCursorDown = Window_Selectable.prototype.cursorDown;
    
    Window_Selectable.prototype.cursorUp = function(wrap) {
        if (wrap === undefined) wrap = true;
        const oldIndex = this.index();
        originalCursorUp.call(this, wrap);
        if (isWrapEnabled(this) && wrap && this.index() === oldIndex && this.maxItems() > 0) {
            this.select(this.maxItems() - 1);
            this.ensureCursorVisible();
        }
    };
    
    Window_Selectable.prototype.cursorDown = function(wrap) {
        if (wrap === undefined) wrap = true;
        const oldIndex = this.index();
        originalCursorDown.call(this, wrap);
        if (isWrapEnabled(this) && wrap && this.index() === oldIndex && this.maxItems() > 0) {
            this.select(0);
            this.ensureCursorVisible();
        }
    };
    
    const _initMembers = Window_Selectable.prototype.initMembers;
    Window_Selectable.prototype.initMembers = function() {
        _initMembers.call(this);
        this._longPressTimer = 0;
        this._fastMoveActive = false;
        this._fastMoveFrameCounter = 0;
        this._prevUpdateTime = 0;
    };
    
    const _update = Window_Selectable.prototype.update;
    Window_Selectable.prototype.update = function() {
        _update.call(this);
        
        if (!isFastMoveEnabled(this) || !this.active || !this.isOpen()) {
            this._fastMoveActive = false;
            this._longPressTimer = 0;
            this._prevUpdateTime = 0;
            return;
        }
        
        const now = Date.now();
        if (this._prevUpdateTime === 0) {
            this._prevUpdateTime = now;
            return;
        }
        let delta = Math.min(0.1, (now - this._prevUpdateTime) / 1000);
        this._prevUpdateTime = now;
        
        const pressing = Input.isPressed('up') || Input.isPressed('down');
        
        if (pressing) {
            this._longPressTimer += delta;
            if (this._longPressTimer >= longPressDelay && !this._fastMoveActive) {
                this._fastMoveActive = true;
                this._fastMoveFrameCounter = 0;
            }
        } else {
            this._longPressTimer = 0;
            this._fastMoveActive = false;
            this._fastMoveFrameCounter = 0;
            return;
        }
        
        if (this._fastMoveActive) {
            this._fastMoveFrameCounter++;
            if (this._fastMoveFrameCounter >= fastMoveInterval) {
                this._fastMoveFrameCounter = 0;
                let oldIndex = this.index();
                if (Input.isPressed('up')) {
                    originalCursorUp.call(this, false);
                } else if (Input.isPressed('down')) {
                    originalCursorDown.call(this, false);
                }
                // 仅当光标位置真正改变时播放音效
                if (oldIndex !== this.index()) {
                    SoundManager.playCursor();
                }
            }
        }
    };
    
    Window_Selectable.prototype.updateCursorMovement = function() {
        if (!this.isOpen() || !this.active) return;
        if (Input.isRepeated('left') && this.cursorLeft()) SoundManager.playCursor();
        if (Input.isRepeated('right') && this.cursorRight()) SoundManager.playCursor();
    };
    
    const _initialize = Window_Selectable.prototype.initialize;
    Window_Selectable.prototype.initialize = function(rect) {
        _initialize.call(this, rect);
        this._longPressTimer = 0;
        this._fastMoveActive = false;
        this._fastMoveFrameCounter = 0;
        this._prevUpdateTime = 0;
    };
})();