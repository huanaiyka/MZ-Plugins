/*:
 * @target MZ
 * @plugindesc 长按推动NPC
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 1. 长按方向键（默认约1秒）可推动面前的事件（NPC）。
 * 2. 可限制仅对特定移动类型的事件生效（随机/接近/远离/固定/自定义）。
 * 3. 可调整连续推动的速度（两次推动间隔帧数）。
 * 4. 独立功能：事件备注 <箱子> 后，点击即可推动（自动推箱子）。
 *
 * ============================================================================
 * 事件备注标签
 * ============================================================================
 * 1. <箱子>               → 点击事件时推动（推箱子）
 * 2. <被推:公共事件ID>    → 被推动后执行指定的公共事件
 *
 * ============================================================================
 * 插件指令
 * ============================================================================
 * ◆ GetPushedEventId 变量     → 将被推事件的ID存入指定变量（变量下拉选择）
 * ◆ GetPushedEventX 变量      → 将被推事件的X坐标存入指定变量
 * ◆ GetPushedEventY 变量      → 将被推事件的Y坐标存入指定变量
 * ◆ GetPushedDirection 变量   → 将推动方向(2/4/6/8)存入指定变量
 *
 * 注意：如果没有发生过任何推动，则存入0。
 * 
 * 使用例：使用公共事件，检测若该事件被推动，则变量+1。
 * 变量增加一定程度后，NPC的对话发生改变。
 * ============================================================================
 * 脚本调用
 * ============================================================================
 *   Huanaiyka.EveryEventIsMove.getLastPushedEventId()
 *   Huanaiyka.EveryEventIsMove.getLastPushedEventX()
 *   Huanaiyka.EveryEventIsMove.getLastPushedEventY()
 *   Huanaiyka.EveryEventIsMove.getLastPushedDirection()
 *
============================================================================
 * 与原版（李先生版 everyEventIs_move）的区别
 * ============================================================================
 * 本插件基于李先生的开源作品进行重构与增强，主要变更如下：
 *   • 移动类型过滤：可单独控制是否允许推动随机、接近、远离、固定、自定义移动类型的事件。
 *   • 长按帧数可调：支持自定义长按判定帧数。
 *   • 连续推动冷却：可设置两次推动之间的间隔帧数，避免误触。
 *   • 记录推动信息：自动记录最后被推事件的ID、坐标和推动方向，方便通过变量或脚本调用。
 *   • 插件指令：提供4条插件指令获取被推事件信息（ID、X、Y、方向）。
 *   • 触发公共事件：支持备注 <被推:公共事件ID> 在推动后自动执行公共事件。
 *   • 更稳健的长按检测：采用 Input._pressedTime 与最新按键结合，兼容性更好。
 *   • 兼容性增强：对旧存档自动补齐冷却属性，避免报错。
 *
============================================================================
 *
 * @param enablePushNPC
 * @text 启用推动NPC
 * @type boolean
 * @on 启用
 * @off 禁用
 * @desc 是否允许长按方向键推动NPC（推箱子功能不受此影响）。
 * @default true
 *
 * @param enableRandomMove
 * @text 允许推动【随机移动】事件
 * @type boolean
 * @on 允许
 * @off 禁止
 * @default true
 *
 * @param enableApproachMove
 * @text 允许推动【接近移动】事件
 * @type boolean
 * @on 允许
 * @off 禁止
 * @default true
 *
 * @param enableAwayMove
 * @text 允许推动【远离移动】事件
 * @type boolean
 * @on 允许
 * @off 禁止
 * @default true
 *
 * @param enableFixedMove
 * @text 允许推动【固定移动】事件
 * @type boolean
 * @on 允许
 * @off 禁止
 * @desc 允许推动移动类型为“固定”的事件
 * @default false
 *
 * @param enableCustomMove
 * @text 允许推动【自定义移动】事件
 * @type boolean
 * @on 允许
 * @off 禁止
 * @desc 允许推动移动类型为“自定义”的事件
 * @default false
 *
 * @param longPressFrames
 * @text 长按判定帧数
 * @type number
 * @desc 方向键需持续按下的帧数（60帧≈1秒）。
 * @default 60
 *
 * @param pushCooldownFrames
 * @text 连续推动间隔帧数
 * @type number
 * @desc 每次成功推动后需等待的帧数。建议 ≥6。
 * @default 15
 *
 * @command GetPushedEventId
 * @text 获取被推事件ID
 * @desc 将最后被推事件的ID存入指定变量
 * @arg varId
 * @text 存储变量
 * @type variable
 * @default 1
 *
 * @command GetPushedEventX
 * @text 获取被推事件X坐标
 * @desc 将最后被推事件的X坐标存入指定变量
 * @arg varId
 * @text 存储变量
 * @type variable
 * @default 1
 *
 * @command GetPushedEventY
 * @text 获取被推事件Y坐标
 * @desc 将最后被推事件的Y坐标存入指定变量
 * @arg varId
 * @text 存储变量
 * @type variable
 * @default 1
 *
 * @command GetPushedDirection
 * @text 获取推动方向
 * @desc 将最后推动的方向值(2/4/6/8)存入指定变量
 * @arg varId
 * @text 存储变量
 * @type variable
 * @default 1
 */

var Huanaiyka = Huanaiyka || {};
Huanaiyka.EveryEventIsMove = Huanaiyka.EveryEventIsMove || {};

// 存储最后一次被推动事件的信息
Huanaiyka.EveryEventIsMove._lastPushed = {
    eventId: 0,
    x: 0,
    y: 0,
    direction: 0
};

Huanaiyka.EveryEventIsMove.getLastPushedEventId = function() {
    return this._lastPushed.eventId;
};
Huanaiyka.EveryEventIsMove.getLastPushedEventX = function() {
    return this._lastPushed.x;
};
Huanaiyka.EveryEventIsMove.getLastPushedEventY = function() {
    return this._lastPushed.y;
};
Huanaiyka.EveryEventIsMove.getLastPushedDirection = function() {
    return this._lastPushed.direction;
};

// 读取插件参数
(function() {
    const params = PluginManager.parameters('Huanaiyka_EveryEventIsMove');
    Huanaiyka.EveryEventIsMove.enablePushNPC = params['enablePushNPC'] === 'true';
    Huanaiyka.EveryEventIsMove.enableRandom = params['enableRandomMove'] === 'true';
    Huanaiyka.EveryEventIsMove.enableApproach = params['enableApproachMove'] === 'true';
    Huanaiyka.EveryEventIsMove.enableAway = params['enableAwayMove'] === 'true';
    Huanaiyka.EveryEventIsMove.enableFixed = params['enableFixedMove'] === 'true';
    Huanaiyka.EveryEventIsMove.enableCustom = params['enableCustomMove'] === 'true';
    Huanaiyka.EveryEventIsMove.longPressFrames = parseInt(params['longPressFrames'] || 60, 10);
    Huanaiyka.EveryEventIsMove.pushCooldownFrames = parseInt(params['pushCooldownFrames'] || 15, 10);
})();

// 注册四个独立插件指令
PluginManager.registerCommand('Huanaiyka_EveryEventIsMove', 'GetPushedEventId', args => {
    const varId = parseInt(args.varId, 10);
    if (!isNaN(varId)) $gameVariables.setValue(varId, Huanaiyka.EveryEventIsMove._lastPushed.eventId);
});
PluginManager.registerCommand('Huanaiyka_EveryEventIsMove', 'GetPushedEventX', args => {
    const varId = parseInt(args.varId, 10);
    if (!isNaN(varId)) $gameVariables.setValue(varId, Huanaiyka.EveryEventIsMove._lastPushed.x);
});
PluginManager.registerCommand('Huanaiyka_EveryEventIsMove', 'GetPushedEventY', args => {
    const varId = parseInt(args.varId, 10);
    if (!isNaN(varId)) $gameVariables.setValue(varId, Huanaiyka.EveryEventIsMove._lastPushed.y);
});
PluginManager.registerCommand('Huanaiyka_EveryEventIsMove', 'GetPushedDirection', args => {
    const varId = parseInt(args.varId, 10);
    if (!isNaN(varId)) $gameVariables.setValue(varId, Huanaiyka.EveryEventIsMove._lastPushed.direction);
});

// ========== 核心推动方法 ==========
Huanaiyka.EveryEventIsMove.pushBox = function(event) {
    const playerDir = $gamePlayer.direction();
    let newX = event._x;
    let newY = event._y;
    switch (playerDir) {
        case 2: newY++; break;
        case 4: newX--; break;
        case 6: newX++; break;
        case 8: newY--; break;
    }
    if (!event.canPass(newX, newY, playerDir)) {
        return false;
    }
    event.turnAwayFromPlayer();
    event.moveForward();

    // 记录被推信息
    Huanaiyka.EveryEventIsMove._lastPushed.eventId = event._eventId;
    Huanaiyka.EveryEventIsMove._lastPushed.x = event._x;
    Huanaiyka.EveryEventIsMove._lastPushed.y = event._y;
    Huanaiyka.EveryEventIsMove._lastPushed.direction = playerDir;

    // 检测 <被推:数字>
    if (event.event() && event.event().note) {
        const match = event.event().note.match(/<被推:(\d+)>/);
        if (match) {
            const commonEventId = parseInt(match[1], 10);
            if (commonEventId > 0) $gameTemp.reserveCommonEvent(commonEventId);
        }
    }
    return true;
};

// ========== 移动类型筛选 ==========
Huanaiyka.EveryEventIsMove.isMoveTypeAllowed = function(event) {
    const moveType = event._moveType;
    switch (moveType) {
        case 0: return Huanaiyka.EveryEventIsMove.enableFixed;   // 固定
        case 1: return Huanaiyka.EveryEventIsMove.enableRandom;  // 随机
        case 2: return Huanaiyka.EveryEventIsMove.enableApproach; // 接近
        case 3: return Huanaiyka.EveryEventIsMove.enableCustom;   // 自定义
        case 4: return Huanaiyka.EveryEventIsMove.enableAway;     // 远离
        default: return false;
    }
};

// ========== 长按检测 ==========
Game_Map.prototype.directionToKeyName = function(d) {
    switch (d) {
        case 2: return 'down';
        case 4: return 'left';
        case 6: return 'right';
        case 8: return 'up';
        default: return '';
    }
};

Game_Map.prototype.islongPress = function() {
    if (($gamePlayer._x !== $gamePlayer._realX) || ($gamePlayer._y !== $gamePlayer._realY)) return false;
    const key = this.directionToKeyName($gamePlayer.direction());
    if (!key) return false;
    return (Input._latestButton === key && Input._pressedTime >= Huanaiyka.EveryEventIsMove.longPressFrames);
};

// ========== 获取玩家面前的事件 ==========
Game_Map.prototype.getEventInFrontOfPlayer = function() {
    if (!(SceneManager._scene instanceof Scene_Map)) return null;
    let x = $gamePlayer._x;
    let y = $gamePlayer._y;
    switch ($gamePlayer.direction()) {
        case 2: y++; break;
        case 4: x--; break;
        case 6: x++; break;
        case 8: y--; break;
    }
    const events = this.events();
    if (!events) return null;
    for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev && ev._x === x && ev._y === y) return ev;
    }
    return null;
};

// ========== 冷却机制（修复旧存档兼容性） ==========
const _Game_Map_initialize = Game_Map.prototype.initialize;
Game_Map.prototype.initialize = function() {
    _Game_Map_initialize.call(this);
    this._pushCooldown = 0;
};

// 确保冷却属性始终存在（旧存档补齐）
Game_Map.prototype.ensurePushCooldown = function() {
    if (this._pushCooldown === undefined || this._pushCooldown === null) {
        this._pushCooldown = 0;
    }
};

Game_Map.prototype.updatePushCooldown = function() {
    this.ensurePushCooldown();
    if (this._pushCooldown > 0) this._pushCooldown--;
};

const _Game_Map_update = Game_Map.prototype.update;
Game_Map.prototype.update = function(sceneActive) {
    _Game_Map_update.call(this, sceneActive);
    this.ensurePushCooldown();          // 关键：确保旧存档有该属性
    this.updatePushCooldown();
    if (Huanaiyka.EveryEventIsMove.enablePushNPC) {
        if (this._pushCooldown === 0) {
            const event = this.getEventInFrontOfPlayer();
            if (event && Huanaiyka.EveryEventIsMove.isMoveTypeAllowed(event) && this.islongPress()) {
                if (Huanaiyka.EveryEventIsMove.pushBox(event)) {
                    this._pushCooldown = Huanaiyka.EveryEventIsMove.pushCooldownFrames;
                }
            }
        }
    }
};

// ========== 推箱子（点击推动） ==========
const _Game_Event_start = Game_Event.prototype.start;
Game_Event.prototype.start = function() {
    _Game_Event_start.call(this);
    if (this.event() && this.event().note && this.event().note.contains('箱子')) {
        if (this.canPass(this._x, this._y, $gamePlayer.direction())) {
            Huanaiyka.EveryEventIsMove.pushBox(this);
        }
    }
};

// ========== 按键记录兼容 ==========
let latestButton = '';
const _Input_update = Input.update;
Input.update = function() {
    _Input_update.call(this);
    if (this._currentState[this._latestButton]) latestButton = this._latestButton;
};
Input.isLongPressed_ex = function() { return false; };

var KSYD = KSYD || {};
KSYD.Ayano_pushBox = KSYD.Ayano_pushBox || {};
KSYD.Ayano_pushBox.pushBox = Huanaiyka.EveryEventIsMove.pushBox;