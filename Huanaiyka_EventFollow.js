//=============================================================================
// Huanaiyka_EventFollow.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc NPC更自然地跟随玩家
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 让事件像同伴一样跟随玩家移动，具备自动寻路、距离延迟、阶梯加速、
 * 移动/转向独立控制等功能。
 *
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 在事件的备注栏（右上角）写入标签 <follow>
 *    （可选参数同行追加，例如 <follow speed:4 distance:3>）
 * 2. 事件触发条件：推荐「确定键」或「玩家接触」
 * 3. 事件优先级：必须设为「与普通角色相同」
 * 4. 移动路线：保持「无」
 *
 * ============================================================================
 * 备注标签详解
 * ============================================================================
 *   <follow>                    启用跟随（必须）
 *   <follow speed:数值>         跟随速度 1~6，默认为插件参数中的「默认跟随速度」
 *   <follow distance:数值>      停止跟随的距离（格子数），1~99，默认为插件参数中的值
 *
 * 示例：<follow speed:4 distance:2>
 *
 * ============================================================================
 * 插件参数（可在插件管理器中调节）
 * ============================================================================
 * - 默认跟随速度        : 基础移动速度（1慢～6快）
 * - 默认跟随距离        : 事件与玩家距离小于等于该值时停止移动
 * - 距离类型            : 十字相邻（曼哈顿距离） / 九宫格相邻（切比雪夫距离）
 * - 启用自动跑步        : 是否根据距离自动提高速度（总开关）
 * - 启用阶梯加速        : 距离越远，速度呈阶梯式增长（只增不减，避免频繁变速）
 * - 跑步触发距离        : 大于此距离开始加速
 * - 阶梯步长距离        : 每增加此距离，速度提升一档
 * - 每步速度增量        : 每超过一个步长，速度增加的档位数（1~3）
 * - 最大跑步速度        : 阶梯加速的上限（1~6）
 * - 直接跑步速度        : 若关闭阶梯加速，达到触发距离后直接改用该速度
 * - 跟随延迟模式        : 时间模式（等待固定帧数）/ 距离模式（玩家走远几格再跟）
 * - 延迟时间（帧）      : 时间模式下的等待帧数
 * - 延迟距离（格）      : 距离模式下，玩家需要超出事件多少格才触发移动
 *
 * ============================================================================
 * 插件指令（事件指令 → 插件指令 → Huanaiyka_EventFollow → EventFollow）
 * ============================================================================
 *
 * 【动作】下拉选择（共4项）：
 *   ① 禁用移动 (仍自动转向玩家)   → 事件停在原地，但身体会始终面向玩家
 *   ② 恢复移动+转向               → 完全恢复跟随（移动 + 自动转向）
 *   ③ 禁用转向 (仅当移动禁用时)   → 如果事件处于“移动禁用”状态，则不再面向玩家
 *   ④ 恢复转向 (仅当移动禁用时)   → 如果事件处于“移动禁用”状态，恢复面向玩家
 *
 * 【事件ID】填写目标事件编号。填 0 或不填表示“当前事件”（即执行该指令的事件）。
 *
 * ============================================================================
 * 实战示例
 * ============================================================================
 *
 * 示例1：让当前事件停在原地，但脸一直朝向玩家
 *   动作：禁用移动 (仍自动转向玩家)
 *   事件ID：<留空>
 *
 * 示例2：让事件3彻底定住（不走动，也不转头）
 *   【第一条指令】动作：禁用移动 (仍自动转向玩家)  事件ID：3
 *   【第二条指令】动作：禁用转向 (仅当移动禁用时)  事件ID：3
 *
 * 示例3：让事件3恢复完全跟随
 *   动作：恢复移动+转向
 *   事件ID：3
 *
 * 示例4：事件5跟随玩家走路，但从不自动转向（永远不回头）
 *   ※ 本插件设计为：移动启用时转向强制开启，无法关闭。
 *   如需“移动时不转头”，请使用旧版 v1.6 或自行修改。
 *
 * ============================================================================
 * 常见问题
 * ============================================================================
 * Q1：事件备注了 <follow> 却不跟随？
 * A1：检查事件优先级是否为「与普通角色相同」，移动路线是否为「无」。
 *     同时确保插件指令没有误禁用移动。
 *
 * Q2：禁用移动指令无效，事件还在走？
 * A2：请更新到 v1.8 以上版本，该版本已修复动作识别问题。
 *     如果问题依旧，请查看 F12 控制台的日志输出。
 *
 * Q3：阶梯加速不生效？
 * A3：检查插件参数中「启用自动跑步」和「启用阶梯加速」是否为 true。
 *     跑步触发距离建议大于默认跟随距离。
 *
 * Q4：游戏切换地图后，之前禁用的状态还会保留吗？
 * A4：是的，每个事件的禁用状态会按地图独立保存。切换地图再回来，状态不变。
 *
 * ============================================================================
 * 更新日志
 * ============================================================================
 * v1.8 (2025-05-12)
 *   - 修复插件指令动作识别失败的问题（提取内部值）
 *   - 补充完整帮助文档和示例
 *   - 增加详细控制台调试输出（可忽略）
 *
 * v1.7
 *   - 新增移动/转向独立控制
 *   - 精简插件指令选项
 *
 * v1.5
 *   - 初始版本：跟随延迟、阶梯加速、速度只增不减
 *
 * ============================================================================
 * @command EventFollow
 * @text 事件跟随控制
 * @desc 启用/禁用指定事件的移动或转向功能
 * @arg action
 * @text 动作
 * @type select
 * @option 禁用移动 (仍自动转向玩家) disable
 * @option 恢复移动+转向 enable
 * @option 禁用转向 (仅当移动禁用时) disable_turn_when_disabled
 * @option 恢复转向 (仅当移动禁用时) enable_turn_when_disabled
 * @default disable
 * @arg eventId
 * @text 事件ID
 * @desc 填0或不填表示当前事件
 * @type number
 * @min 0
 * @default 0
 *
 * @param defaultSpeed
 * @text 默认跟随速度
 * @type number
 * @min 1
 * @max 6
 * @default 3
 *
 * @param defaultDistance
 * @text 默认跟随距离
 * @type number
 * @min 1
 * @max 99
 * @default 2
 *
 * @param distanceType
 * @text 距离类型
 * @type select
 * @option 十字相邻(曼哈顿) manhattan
 * @option 九宫格相邻(切比雪夫) chebyshev
 * @default manhattan
 *
 * @param autoRunEnable
 * @text 启用自动跑步
 * @type boolean
 * @default true
 *
 * @param useSpeedLadder
 * @text 启用阶梯加速
 * @type boolean
 * @default true
 *
 * @param runDistance
 * @text 跑步触发距离
 * @type number
 * @min 1
 * @max 99
 * @default 3
 *
 * @param speedLadderStep
 * @text 阶梯步长距离
 * @type number
 * @min 1
 * @max 20
 * @default 2
 *
 * @param speedIncrement
 * @text 每步速度增量
 * @type number
 * @min 1
 * @max 3
 * @default 1
 *
 * @param speedLadderMax
 * @text 最大跑步速度
 * @type number
 * @min 1
 * @max 6
 * @default 5
 *
 * @param runSpeed
 * @text 直接跑步速度
 * @type number
 * @min 1
 * @max 6
 * @default 5
 *
 * @param delayMode
 * @text 跟随延迟模式
 * @type select
 * @option 时间模式(帧) frames
 * @option 距离模式(格数) distance
 * @default distance
 *
 * @param delayFrames
 * @text 延迟时间（帧）
 * @type number
 * @min 0
 * @max 300
 * @default 60
 *
 * @param delayDistance
 * @text 延迟距离（格）
 * @type number
 * @min 1
 * @max 20
 * @default 2
 */

(() => {
    const params = PluginManager.parameters('Huanaiyka_EventFollow');
    const defaultSpeed = Number(params['defaultSpeed'] || 3);
    const defaultDistance = Number(params['defaultDistance'] || 2);
    const autoRunEnable = params['autoRunEnable'] !== 'false';
    const useSpeedLadder = params['useSpeedLadder'] !== 'false';
    const runDistance = Number(params['runDistance'] || 5);
    const speedLadderStep = Number(params['speedLadderStep'] || 2);
    const speedIncrement = Number(params['speedIncrement'] || 2);
    const speedLadderMax = Number(params['speedLadderMax'] || 5);
    const runSpeed = Number(params['runSpeed'] || 5);
    
    const delayMode = (params['delayMode'] || 'distance').toLowerCase();
    const delayFrames = Number(params['delayFrames'] || 30);
    const delayDistance = Number(params['delayDistance'] || 2);
    
    const distanceType = (params['distanceType'] || 'manhattan').toLowerCase();
    const useChebyshev = (distanceType === 'chebyshev');

    const MIN_SPEED = 1;
    const MAX_SPEED = 6;

    if (window._followMoveDisabledMap === undefined) {
        window._followMoveDisabledMap = new Map();
    }
    if (window._followTurnWhenMoveDisabledMap === undefined) {
        window._followTurnWhenMoveDisabledMap = new Map();
    }

    function getEventKey(event) {
        return $gameMap.mapId() + "_" + event._eventId;
    }

    function isFollowMoveDisabled(event) {
        return window._followMoveDisabledMap.get(getEventKey(event)) === true;
    }

    function setFollowMoveDisabled(event, disabled) {
        const key = getEventKey(event);
        if (disabled) {
            window._followMoveDisabledMap.set(key, true);
        } else {
            window._followMoveDisabledMap.delete(key);
        }
    }

    function isFollowTurnWhenMoveDisabled(event) {
        const val = window._followTurnWhenMoveDisabledMap.get(getEventKey(event));
        return val !== undefined ? val : true;
    }

    function setFollowTurnWhenMoveDisabled(event, enabled) {
        const key = getEventKey(event);
        window._followTurnWhenMoveDisabledMap.set(key, enabled);
    }

    function fullyEnableFollow(event) {
        setFollowMoveDisabled(event, false);
        setFollowTurnWhenMoveDisabled(event, true);
    }

    function getDistanceToPlayer(event) {
        const dx = Math.abs(event.deltaXFrom($gamePlayer.x));
        const dy = Math.abs(event.deltaYFrom($gamePlayer.y));
        return useChebyshev ? Math.max(dx, dy) : dx + dy;
    }

    function calcLadderSpeed(baseSpeed, currentDist, triggerDist, stepDist, incrementPerStep, maxSpeed) {
        if (currentDist <= triggerDist) return baseSpeed;
        const extra = currentDist - triggerDist;
        const steps = Math.floor(extra / stepDist);
        let speed = baseSpeed + steps * incrementPerStep;
        if (speed > maxSpeed) speed = maxSpeed;
        if (speed > MAX_SPEED) speed = MAX_SPEED;
        if (speed < MIN_SPEED) speed = MIN_SPEED;
        return speed;
    }

    let _currentCommandEventId = 0;
    const _pluginCommandBase = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _currentCommandEventId = this._eventId;
        _pluginCommandBase.call(this, command, args);
        _currentCommandEventId = 0;
    };

    function getCurrentEventId() {
        return _currentCommandEventId;
    }

    function extractInternalValue(raw) {
        if (!raw) return "";
        const lastSpace = raw.lastIndexOf(' ');
        if (lastSpace !== -1) {
            return raw.substring(lastSpace + 1).toLowerCase();
        }
        return raw.toLowerCase();
    }

    function operateEventFollow(rawAction, eventIdParam) {
        const action = extractInternalValue(rawAction);
        let eventId = parseInt(eventIdParam, 10);
        if (isNaN(eventId) || eventId <= 0) {
            eventId = getCurrentEventId();
        }
        if (eventId <= 0) return;
        const event = $gameMap.event(eventId);
        if (!event) return;

        switch (action) {
            case "disable":
                setFollowMoveDisabled(event, true);
                setFollowTurnWhenMoveDisabled(event, true);
                break;
            case "enable":
                fullyEnableFollow(event);
                break;
            case "disable_turn_when_disabled":
                setFollowTurnWhenMoveDisabled(event, false);
                break;
            case "enable_turn_when_disabled":
                setFollowTurnWhenMoveDisabled(event, true);
                break;
            default:
                break;
        }
    }

    PluginManager.registerCommand("Huanaiyka_EventFollow", "EventFollow", args => {
        const actionRaw = args.action || "";
        const eventId = args.eventId;
        operateEventFollow(actionRaw, eventId);
    });

    const _pluginCommandOld = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommandOld.call(this, command, args);
        if (command === "EventFollow") {
            const action = args[0] || "";
            let eventId = this._eventId;
            if (args[1] && !isNaN(parseInt(args[1]))) {
                eventId = parseInt(args[1], 10);
            }
            operateEventFollow(action, eventId);
        }
    };

    const _setup = Game_Event.prototype.setupPageSettings;
    Game_Event.prototype.setupPageSettings = function() {
        _setup.call(this);
        if (this._followEnabled === undefined) {
            this._followEnabled = false;
            this._followSpeed = defaultSpeed;
            this._followDistance = defaultDistance;
            this._followWaiting = false;
            this._followWaitStartFrame = 0;
            this._followWaitStartPlayerDist = 0;
            this._followLockedSpeed = null;
        }
        const eventData = this.event();
        if (eventData) {
            const note = eventData.note;
            if (/<follow>/i.test(note)) {
                this._followEnabled = true;
                const speedMatch = note.match(/<follow\s+speed:\s*(\d+)>/i);
                if (speedMatch) {
                    let sp = parseInt(speedMatch[1], 10);
                    this._followSpeed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, sp || defaultSpeed));
                }
                const distMatch = note.match(/<follow\s+distance:\s*(\d+)>/i);
                if (distMatch) {
                    let dist = parseInt(distMatch[1], 10);
                    if (isNaN(dist)) dist = defaultDistance;
                    this._followDistance = Math.min(99, Math.max(1, dist));
                }
            } else {
                this._followEnabled = false;
            }
        }
    };

    const _update = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        _update.call(this);
        if (!this._followEnabled) return;

        const player = $gamePlayer;
        const currentDist = getDistanceToPlayer(this);
        const moveDisabled = isFollowMoveDisabled(this);
        const turnWhenMoveDisabled = isFollowTurnWhenMoveDisabled(this);

        if (autoRunEnable && !moveDisabled) {
            const isStopped = (currentDist <= this._followDistance);
            if (isStopped) {
                if (this._followLockedSpeed !== null) {
                    this._followLockedSpeed = null;
                }
                if (this._moveSpeed !== this._followSpeed) {
                    this.setMoveSpeed(this._followSpeed);
                }
            } else {
                let desiredSpeed = this._followSpeed;
                if (currentDist > runDistance) {
                    if (useSpeedLadder) {
                        desiredSpeed = calcLadderSpeed(
                            this._followSpeed, currentDist,
                            runDistance, speedLadderStep, speedIncrement, speedLadderMax
                        );
                    } else {
                        desiredSpeed = runSpeed;
                    }
                }
                desiredSpeed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, desiredSpeed));
                let finalSpeed = desiredSpeed;
                if (this._followLockedSpeed !== null) {
                    finalSpeed = this._followLockedSpeed;
                }
                if (desiredSpeed > this._moveSpeed) {
                    finalSpeed = desiredSpeed;
                    const maxPossibleSpeed = useSpeedLadder ? speedLadderMax : runSpeed;
                    if (desiredSpeed >= maxPossibleSpeed) {
                        this._followLockedSpeed = desiredSpeed;
                    }
                }
                if (this._moveSpeed !== finalSpeed) {
                    this.setMoveSpeed(finalSpeed);
                }
            }
        } else if (!autoRunEnable && !moveDisabled) {
            if (this._moveSpeed !== this._followSpeed) {
                this.setMoveSpeed(this._followSpeed);
            }
        }

        if (this.isMoving()) return;

        if (!moveDisabled) {
            this.turnTowardCharacter(player);
            if (currentDist > this._followDistance) {
                let shouldMove = false;
                if (this._followWaiting) {
                    if (delayMode === 'frames') {
                        const elapsed = Graphics.frameCount - this._followWaitStartFrame;
                        if (elapsed >= delayFrames) {
                            shouldMove = true;
                            this._followWaiting = false;
                        }
                    } else {
                        if (this._followWaitStartPlayerDist !== undefined) {
                            if (currentDist - this._followWaitStartPlayerDist >= delayDistance) {
                                shouldMove = true;
                                this._followWaiting = false;
                            }
                        } else {
                            shouldMove = true;
                            this._followWaiting = false;
                        }
                    }
                } else {
                    shouldMove = true;
                }
                if (shouldMove) {
                    const direction = this.findDirectionTo(player.x, player.y);
                    if (direction > 0) {
                        this.moveStraight(direction);
                    } else {
                        this.moveTowardCharacter(player);
                    }
                    if (this._followWaiting) this._followWaiting = false;
                }
            } else {
                if (this._followWaiting === false) {
                    this._followWaiting = true;
                    this._followWaitStartFrame = Graphics.frameCount;
                    this._followWaitStartPlayerDist = currentDist;
                }
            }
        } else {
            if (turnWhenMoveDisabled) {
                this.turnTowardCharacter(player);
            }
            if (this._followWaiting) {
                this._followWaiting = false;
            }
        }
    };
})();