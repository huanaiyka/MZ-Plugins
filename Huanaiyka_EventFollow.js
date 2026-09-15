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
 * 支持备注标签和插件指令双重控制方式。
 *
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 事件备注标签（在事件编辑器的备注栏中添加）：
 *    <follow>                    启用跟随（默认关闭）
 *    <follow speed:3>            跟随速度 1~6
 *    <follow distance:2>         停止跟随的距离（格子数）
 *    <follow teleport:true>      切换地图时自动传送到玩家位置（默认 true）
 *
 * 2. 事件触发条件：推荐「确定键」或「玩家接触」
 * 3. 事件优先级：必须设为「与普通角色相同」
 * 4. 移动路线：保持「无」
 *
 * ============================================================================
 * 插件指令
 * ============================================================================
 *
 * 【全局控制】
 *   EventFollowEnableAll    : 所有带 <follow> 标签的事件自动启用跟随
 *   EventFollowDisableAll   : 所有带 <follow> 标签的事件禁用跟随
 *   【注意】全局指令的状态会保存在存档中，切换地图时自动生效
 *
 * 【单个事件控制】
 *   EventFollowEnable       : 启用跟随（移动+转向全开）
 *   EventFollowDisable      : 禁用跟随（完全停止，不走动+不转向）
 *   EventFollowDisableMove  : 禁用移动（停在原地，但仍自动转向玩家）
 *   EventFollowEnableMove   : 恢复移动+转向（完全恢复跟随）
 *   EventFollowDisableTurn  : 禁用转向（仅当移动禁用时生效）
 *   EventFollowEnableTurn   : 恢复转向（仅当移动禁用时生效）
 *   EventFollowEnableTele   : 启用地图传送（切换地图时自动传送到玩家位置）
 *   EventFollowDisableTele  : 禁用地图传送（切换地图时留在原地）
 *
 * 【参数说明】
 *   所有指令都带有"事件ID"参数，填写目标事件编号。
 *   填 0 或不填表示"当前事件"（即执行该指令的事件自身）。
 *   【改进】在公共事件中使用时，会自动识别调用该公共事件的原始事件。
 *   EventFollowEnableAll / EventFollowDisableAll 不需要事件ID参数。
 *
 * 【全局开关状态】
 *   全局开启/关闭的状态会保存在 $gameSystem 中，读档后自动恢复。
 *   切换地图时，插件会自动根据全局状态处理所有带标签的事件。
 *
 * ============================================================================
 * 地图传送说明
 * ============================================================================
 * 地图传送仅在"回到原地图"时生效（即从其他地图切回之前标记的地图）。
 * 例如：事件在 MAP001 被标记为跟随，玩家从 MAP001 传到 MAP002 再传回 MAP001 时，
 * 事件会自动传送到玩家位置。如果从 MAP001 传到 MAP002，事件不会跟随传送。
 *
 * ============================================================================
 * 实战示例
 * ============================================================================
 *
 * 示例1：在事件备注中添加 <follow>，然后使用全局启用
 *   插件指令：EventFollowEnableAll
 *   效果：当前地图所有带 <follow> 标签的事件开始跟随
 *
 * 示例2：全局关闭所有跟随
 *   插件指令：EventFollowDisableAll
 *   效果：所有带 <follow> 标签的事件停止跟随
 *
 * 示例3：让事件3开始跟随玩家（单独控制）
 *   插件指令：EventFollowEnable 事件ID:3
 *
 * 示例4：让事件3停止跟随
 *   插件指令：EventFollowDisable 事件ID:3
 *
 * 示例5：事件只在回到原地图时传送
 *   插件指令：EventFollowEnable 事件ID:3
 *   插件指令：EventFollowEnableTele 事件ID:3
 *
 * 示例6：在公共事件中控制调用者自身（无需指定ID）
 *   公共事件内容：插件指令 EventFollowEnable
 *   地图事件调用该公共事件后，自身会开启跟随
 *
 * ============================================================================
 * 插件参数
 * ============================================================================
 * - 默认跟随速度        : 基础移动速度（1慢～6快）
 * - 默认跟随距离        : 事件与玩家距离小于等于该值时停止移动
 * - 距离类型            : 十字相邻（曼哈顿距离） / 九宫格相邻（切比雪夫距离）
 * - 启用自动跑步        : 是否根据距离自动提高速度（总开关）
 * - 启用阶梯加速        : 距离越远，速度呈阶梯式增长（只增不减，避免频繁变速）
 * - 跑步触发距离        : 大于此距离开始加速
 * - 阶梯步长距离        : 每增加此距离，速度提升一档
 * - 每步速度增量        : 每超过一个步长，速度增加的档位数（1~3）
 * - 最大跑步速度        : 阶梯加速的上限（1~6）
 * - 直接跑步速度        : 若关闭阶梯加速，达到触发距离后直接改用该速度
 * - 跟随延迟模式        : 时间模式（等待固定帧数）/ 距离模式（玩家走远几格再跟）
 * - 延迟时间（帧）      : 时间模式下的等待帧数
 * - 延迟距离（格）      : 距离模式下，玩家需要超出事件多少格才触发移动
 * - 地图传送延迟模式    : 立即传送 / 延迟传送（等待固定帧数后再传送）
 * - 地图传送延迟（帧）  : 延迟模式下的等待帧数，60帧≈1秒
 *
 * ============================================================================
 * 常见问题
 * ============================================================================
 * Q1：全局开启/关闭状态会保存到存档吗？
 * A1：会的，所有全局状态都保存在 $gameSystem 中，读档后自动恢复。
 *
 * Q2：切换地图后全局开启还会生效吗？
 * A2：会的，切换地图时会自动检测全局开启状态，重新应用所有带标签的事件。
 *
 * Q3：单独控制的指令和全局指令冲突怎么办？
 * A3：单独控制的指令具有最高优先级，不会被全局指令覆盖。
 *     如果事件被单独禁用，全局开启不会重新启用它。
 *
 * Q4：地图传送为什么只在回到原地图时生效？
 * A4：这是为了避免事件在切换地图时出现在错误的位置。
 *
 * Q5：在公共事件中使用插件指令，能识别"当前事件"吗？
 * A5：可以！插件会自动追踪调用公共事件的原始事件，无需手动指定ID。
 *
 * ============================================================================
 * 更新日志
 * ============================================================================
 * v2.7 (2026-07-21)
 *   - 重大改进：公共事件中也能智能识别"当前事件"
 *   - 通过事件调用栈追踪原始调用者
 *
 * v2.6 (2026-07-21)
 *   - 新增"全局关闭"指令 EventFollowDisableAll
 *   - 全局开启/关闭状态保存到存档
 *   - 切换地图时自动检测全局状态，重新应用所有带标签的事件
 *   - 单独控制的指令优先级高于全局指令
 *
 * v2.5 (2026-07-21)
 *   - 插件指令改为每项独立command，符合MZ规范
 *
 * v2.4 (2026-07-21)
 *   - 地图传送改为"仅限回到原地图"时生效
 *
 * v2.3 (2026-07-21)
 *   - 新增备注标签支持
 *   - 新增"开启全局跟随"指令
 *
 * ============================================================================ * @command EventFollowEnableAll
 * @text 开启全局跟随
 * @desc 所有带 <follow> 标签的事件自动启用跟随（状态会保存到存档）
 *
 * @command EventFollowDisableAll
 * @text 关闭全局跟随
 * @desc 所有带 <follow> 标签的事件禁用跟随（状态会保存到存档）
 *
 * @command EventFollowEnable
 * @text 启用跟随
 * @desc 事件开始跟随玩家（移动+转向全开）
 * @arg eventId
 * @text 事件ID
 * @desc 目标事件的编号。填0或不填表示当前事件（公共事件中自动识别调用者）
 * @type number
 * @min 0
 * @default 0
 *
 * @command EventFollowDisable
 * @text 禁用跟随
 * @desc 事件完全停止跟随（不走动+不转向）
 * @arg eventId
 * @text 事件ID
 * @desc 目标事件的编号。填0或不填表示当前事件（公共事件中自动识别调用者）
 * @type number
 * @min 0
 * @default 0
 *
 * @command EventFollowDisableMove
 * @text 禁用移动
 * @desc 事件停在原地，但身体会始终面向玩家
 * @arg eventId
 * @text 事件ID
 * @desc 目标事件的编号。填0或不填表示当前事件（公共事件中自动识别调用者）
 * @type number
 * @min 0
 * @default 0
 *
 * @command EventFollowEnableMove
 * @text 恢复移动+转向
 * @desc 完全恢复跟随（移动+自动转向）
 * @arg eventId
 * @text 事件ID
 * @desc 目标事件的编号。填0或不填表示当前事件（公共事件中自动识别调用者）
 * @type number
 * @min 0
 * @default 0
 *
 * @command EventFollowDisableTurn
 * @text 禁用转向
 * @desc 如果事件处于"移动禁用"状态，则不再面向玩家
 * @arg eventId
 * @text 事件ID
 * @desc 目标事件的编号。填0或不填表示当前事件（公共事件中自动识别调用者）
 * @type number
 * @min 0
 * @default 0
 *
 * @command EventFollowEnableTurn
 * @text 恢复转向
 * @desc 如果事件处于"移动禁用"状态，恢复面向玩家
 * @arg eventId
 * @text 事件ID
 * @desc 目标事件的编号。填0或不填表示当前事件（公共事件中自动识别调用者）
 * @type number
 * @min 0
 * @default 0
 *
 * @command EventFollowEnableTele
 * @text 启用地图传送
 * @desc 切换地图时，事件自动传送到玩家位置（仅限回到原地图）
 * @arg eventId
 * @text 事件ID
 * @desc 目标事件的编号。填0或不填表示当前事件（公共事件中自动识别调用者）
 * @type number
 * @min 0
 * @default 0
 *
 * @command EventFollowDisableTele
 * @text 禁用地图传送
 * @desc 切换地图时，事件留在原地（不传送）
 * @arg eventId
 * @text 事件ID
 * @desc 目标事件的编号。填0或不填表示当前事件（公共事件中自动识别调用者）
 * @type number
 * @min 0
 * @default 0
 *
 * @param defaultSpeed
 * @text 默认跟随速度
 * @desc 事件跟随玩家时的基础移动速度。数值越大越快（1~6），默认为3
 * @type number
 * @min 1
 * @max 6
 * @default 3
 *
 * @param defaultDistance
 * @text 默认跟随距离
 * @desc 事件与玩家距离小于等于此值时停止移动。数值为格子数（1~99），默认为2
 * @type number
 * @min 1
 * @max 99
 * @default 2
 *
 * @param distanceType
 * @text 距离类型
 * @desc 计算事件与玩家距离的方式。十字相邻为曼哈顿距离，九宫格相邻为切比雪夫距离
 * @type select
 * @option 十字相邻(曼哈顿) manhattan
 * @option 九宫格相邻(切比雪夫) chebyshev
 * @default manhattan
 *
 * @param autoRunEnable
 * @text 启用自动跑步
 * @desc 总开关。开启后事件会根据与玩家的距离自动提高移动速度
 * @type boolean
 * @default true
 *
 * @param useSpeedLadder
 * @text 启用阶梯加速
 * @desc 开启后距离越远速度呈阶梯式增长（只增不减，避免频繁变速）。关闭则达到触发距离后直接使用"直接跑步速度"
 * @type boolean
 * @default true
 *
 * @param runDistance
 * @text 跑步触发距离
 * @desc 事件与玩家距离大于此值时开始加速跑。数值为格子数，默认为3
 * @type number
 * @min 1
 * @max 99
 * @default 3
 *
 * @param speedLadderStep
 * @text 阶梯步长距离
 * @desc 阶梯加速模式下，每增加此距离，速度提升一档。数值为格子数，默认为2
 * @type number
 * @min 1
 * @max 20
 * @default 2
 *
 * @param speedIncrement
 * @text 每步速度增量
 * @desc 阶梯加速模式下，每超过一个步长，速度增加的档位数（1~3），默认为1
 * @type number
 * @min 1
 * @max 3
 * @default 1
 *
 * @param speedLadderMax
 * @text 最大跑步速度
 * @desc 阶梯加速模式下的速度上限（1~6），默认为5
 * @type number
 * @min 1
 * @max 6
 * @default 5
 *
 * @param runSpeed
 * @text 直接跑步速度
 * @desc 关闭阶梯加速时，达到触发距离后直接改用此速度（1~6），默认为5
 * @type number
 * @min 1
 * @max 6
 * @default 5
 *
 * @param delayMode
 * @text 跟随延迟模式
 * @desc 时间模式：等待固定帧数后开始移动。距离模式：玩家走远几格后才触发移动
 * @type select
 * @option 时间模式(帧) frames
 * @option 距离模式(格数) distance
 * @default distance
 *
 * @param delayFrames
 * @text 延迟时间（帧）
 * @desc 时间模式下的等待帧数。60帧≈1秒，默认为60
 * @type number
 * @min 0
 * @max 300
 * @default 60
 *
 * @param delayDistance
 * @text 延迟距离（格）
 * @desc 距离模式下，玩家需要超出事件多少格才触发移动。默认为2
 * @type number
 * @min 1
 * @max 20
 * @default 2
 *
 * @param enableMapTeleport
 * @text 是否开启地图传送
 * @desc 地图传送总开关。默认关闭(false)，开启后切换地图（回到原地图）时自动将事件传送到玩家位置
 * @type boolean
 * @default false
 *
 * @param teleportDelayMode
 * @text 地图传送延迟模式
 * @desc 切换地图后事件传送到玩家位置的方式。立即传送 / 延迟传送（等待固定帧数）
 * @type select
 * @option 立即传送 immediate
 * @option 延迟传送(帧) delayed
 * @default immediate
 *
 * @param teleportDelayFrames
 * @text 地图传送延迟（帧）
 * @desc 延迟传送模式下的等待帧数。60帧≈1秒，默认为30（0.5秒）
 * @type number
 * @min 0
 * @max 300
 * @default 30
 */

(() => {
    const pluginName = 'Huanaiyka_EventFollow';
    const params = PluginManager.parameters(pluginName);
    
    // 全局地图传送总开关参数（默认为 false）
    const enableMapTeleportParam = params['enableMapTeleport'] === 'true';
    
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
    
    const teleportDelayMode = (params['teleportDelayMode'] || 'immediate').toLowerCase();
    const teleportDelayFrames = Number(params['teleportDelayFrames'] || 30);
    
    const distanceType = (params['distanceType'] || 'manhattan').toLowerCase();
    const useChebyshev = (distanceType === 'chebyshev');

    const MIN_SPEED = 1;
    const MAX_SPEED = 6;

    // 清理非存档全局内存的辅助函数
    function resetRuntimeCaches() {
        window._followTeleportedThisMap = new Set();
        window._followTeleportDelayCounter = {};
    }

    // 初始化运行时缓存
    resetRuntimeCaches();

    // ============================================================
    // Game_System 存取与重置
    // ============================================================
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this.initFollowData();
    };

    Game_System.prototype.initFollowData = function() {
        this._followEnabledMap = {};
        this._followMoveDisabledMap = {};
        this._followTurnWhenMoveDisabledMap = {};
        this._followTeleportEnabledMap = {};
        this._followOriginalMapId = {};
        this._followGlobalEnabled = false;
    };

    // 安全获取 Game_System 中的集合对象（防止读取旧档报错）
    function getSystemData(key, defaultVal = {}) {
        if (!$gameSystem) return defaultVal;
        if ($gameSystem[key] === undefined) {
            $gameSystem[key] = defaultVal;
        }
        return $gameSystem[key];
    }

    // 重写 Game_Title/DataManager 相关逻辑，确保退回主菜单或新游戏时重置内存缓存
    const _Scene_Title_start = Scene_Title.prototype.start;
    Scene_Title.prototype.start = function() {
        _Scene_Title_start.call(this);
        resetRuntimeCaches();
    };

    function getEventKey(event) {
        return $gameMap.mapId() + "_" + event._eventId;
    }

    // ============================================================
    // 备注标签解析
    // ============================================================
    function parseEventNote(event) {
        const note = (event.event() && event.event().note) ? event.event().note : "";
        const lines = note.split('\n');
        let hasFollow = false;
        let speed = null;
        let distance = null;
        let teleport = null;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('<follow')) {
                hasFollow = true;
                const speedMatch = trimmed.match(/speed\s*:\s*(\d+)/i);
                if (speedMatch) {
                    speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, Number(speedMatch[1])));
                }
                const distMatch = trimmed.match(/distance\s*:\s*(\d+)/i);
                if (distMatch) {
                    distance = Math.max(1, Number(distMatch[1]));
                }
                const teleMatch = trimmed.match(/teleport\s*:\s*(true|false)/i);
                if (teleMatch) {
                    teleport = teleMatch[1].toLowerCase() === 'true';
                }
            }
        }

        return { hasFollow, speed, distance, teleport };
    }

    // ============================================================
    // 全局跟随：根据备注标签启用/禁用所有事件
    // ============================================================
    function enableAllFollowByNote() {
        if ($gameSystem) {
            $gameSystem._followGlobalEnabled = true;
        }
        applyGlobalFollowState();
    }

    function disableAllFollowByNote() {
        if ($gameSystem) {
            $gameSystem._followGlobalEnabled = false;
        }
        applyGlobalFollowState();
    }

    function applyGlobalFollowState() {
        if (!$gameSystem || !$gameMap) return;
        const events = $gameMap._events;
        if (!events) return;
        
        const currentMapId = $gameMap.mapId();
        const globalEnabled = $gameSystem._followGlobalEnabled === true;
        
        const followEnabledMap = getSystemData('_followEnabledMap');
        const followMoveDisabledMap = getSystemData('_followMoveDisabledMap');
        const followTurnWhenMoveDisabledMap = getSystemData('_followTurnWhenMoveDisabledMap');
        const followTeleportEnabledMap = getSystemData('_followTeleportEnabledMap');
        const followOriginalMapId = getSystemData('_followOriginalMapId');

        for (let i = 1; i < events.length; i++) {
            const ev = events[i];
            if (!ev) continue;
            
            const noteData = parseEventNote(ev);
            if (!noteData.hasFollow) continue;
            
            const key = getEventKey(ev);
            const hasManualControl = followEnabledMap[key] !== undefined;
            
            // 如果被单独手动指令控制过，跳过
            if (hasManualControl && !followEnabledMap['_global_' + key]) continue;
            
            if (globalEnabled) {
                const speed = noteData.speed !== null ? noteData.speed : defaultSpeed;
                const distance = noteData.distance !== null ? noteData.distance : defaultDistance;
                const teleport = noteData.teleport !== null ? noteData.teleport : true;
                
                if (ev._followSpeed === undefined) {
                    ev._followSpeed = defaultSpeed;
                    ev._followDistance = defaultDistance;
                    ev._followWaiting = false;
                    ev._followWaitStartFrame = 0;
                    ev._followWaitStartPlayerDist = 0;
                    ev._followLockedSpeed = null;
                    ev._followTeleportOnMapChange = true;
                }
                
                ev._followSpeed = speed;
                ev._followDistance = distance;
                ev._followTeleportOnMapChange = teleport;
                
                const origKey = 'e' + ev._eventId;
                if (followOriginalMapId[origKey] === undefined) {
                    followOriginalMapId[origKey] = currentMapId;
                }
                
                ev._followEnabled = true;
                followEnabledMap[key] = true;
                followEnabledMap['_global_' + key] = true;
                
                delete followMoveDisabledMap[key];
                delete followTurnWhenMoveDisabledMap[key];
                followTeleportEnabledMap[key] = teleport;
            } else {
                ev._followEnabled = false;
                delete followEnabledMap[key];
                delete followEnabledMap['_global_' + key];
                delete followMoveDisabledMap[key];
                delete followTurnWhenMoveDisabledMap[key];
                delete followTeleportEnabledMap[key];
                
                if (ev._followSpeed !== undefined) ev._followSpeed = defaultSpeed;
                if (ev._followDistance !== undefined) ev._followDistance = defaultDistance;
                ev._followTeleportOnMapChange = true;
            }
        }
    }

    // ----- 核心函数 -----
    function isFollowEnabled(event) {
        const map = getSystemData('_followEnabledMap');
        return map[getEventKey(event)] === true;
    }

    function setFollowEnabled(event, enabled) {
        const map = getSystemData('_followEnabledMap');
        const key = getEventKey(event);
        if (enabled) {
            map[key] = true;
            delete map['_global_' + key];
        } else {
            delete map[key];
            delete map['_global_' + key];
        }
        event._followEnabled = enabled;
        if (!enabled) {
            setFollowMoveDisabled(event, false);
            setFollowTurnWhenMoveDisabled(event, true);
        }
    }

    function isFollowMoveDisabled(event) {
        if (!isFollowEnabled(event)) return true;
        const map = getSystemData('_followMoveDisabledMap');
        return map[getEventKey(event)] === true;
    }

    function setFollowMoveDisabled(event, disabled) {
        const map = getSystemData('_followMoveDisabledMap');
        const key = getEventKey(event);
        if (disabled) {
            map[key] = true;
        } else {
            delete map[key];
        }
    }

    function isFollowTurnWhenMoveDisabled(event) {
        if (!isFollowEnabled(event)) return false;
        const map = getSystemData('_followTurnWhenMoveDisabledMap');
        const val = map[getEventKey(event)];
        return val !== undefined ? val : true;
    }

    function setFollowTurnWhenMoveDisabled(event, enabled) {
        const map = getSystemData('_followTurnWhenMoveDisabledMap');
        const key = getEventKey(event);
        map[key] = enabled;
    }

    function isFollowTeleportEnabled(event) {
        // 全局传送开关如果开启为 false，则直接返回 false
        if (!enableMapTeleportParam) return false;
        
        const map = getSystemData('_followTeleportEnabledMap');
        const val = map[getEventKey(event)];
        return val !== undefined ? val : true;
    }

    function setFollowTeleportEnabled(event, enabled) {
        const map = getSystemData('_followTeleportEnabledMap');
        const key = getEventKey(event);
        map[key] = enabled;
        event._followTeleportOnMapChange = enabled;
    }

    function fullyEnableFollow(event) {
        const currentMapId = $gameMap.mapId();
        const origKey = 'e' + event._eventId;
        const followOriginalMapId = getSystemData('_followOriginalMapId');
        
        if (followOriginalMapId[origKey] === undefined) {
            followOriginalMapId[origKey] = currentMapId;
        }
        setFollowEnabled(event, true);
        setFollowMoveDisabled(event, false);
        setFollowTurnWhenMoveDisabled(event, true);
        if (isFollowTeleportEnabled(event) === undefined) {
            setFollowTeleportEnabled(event, true);
        }
    }

    function fullyDisableFollow(event) {
        setFollowEnabled(event, false);
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

    // ============================================================
    // 智能获取当前事件ID（支持公共事件）
    // ============================================================
    let _currentCommandEventId = 0;

    function findOriginalEventId() {
        if (Game_Interpreter._instances) {
            for (const inst of Game_Interpreter._instances) {
                if (inst && inst._eventId > 0 && !inst._isCommonEvent) {
                    return inst._eventId;
                }
            }
        }
        
        for (let i = 0; i < 10; i++) {
            const interpreter = $gameMap ? $gameMap._interpreter : null;
            if (interpreter && interpreter._eventId > 0 && !interpreter._isCommonEvent) {
                return interpreter._eventId;
            }
        }
        
        const currentInterpreter = $gameMap ? $gameMap._interpreter : null;
        if (currentInterpreter && currentInterpreter._eventId === 0) {
            if (currentInterpreter._parentInterpreter) {
                let parent = currentInterpreter._parentInterpreter;
                while (parent) {
                    if (parent._eventId > 0 && !parent._isCommonEvent) {
                        return parent._eventId;
                    }
                    parent = parent._parentInterpreter;
                }
            }
        }
        
        return 0;
    }

    function getTargetEvent(eventIdParam) {
        let eventId = parseInt(eventIdParam, 10);
        
        if (isNaN(eventId) || eventId <= 0) {
            if (_currentCommandEventId > 0) {
                eventId = _currentCommandEventId;
            } else {
                eventId = findOriginalEventId();
            }
        }
        
        if (eventId <= 0 || !$gameMap) return null;
        
        const event = $gameMap.event(eventId);
        if (!event) return null;
        
        if (event._followSpeed === undefined) {
            const currentMapId = $gameMap.mapId();
            const origKey = 'e' + eventId;
            const followOriginalMapId = getSystemData('_followOriginalMapId');
            
            event._followSpeed = defaultSpeed;
            event._followDistance = defaultDistance;
            event._followWaiting = false;
            event._followWaitStartFrame = 0;
            event._followWaitStartPlayerDist = 0;
            event._followLockedSpeed = null;
            event._followTeleportOnMapChange = true;
            if (followOriginalMapId[origKey] === undefined) {
                followOriginalMapId[origKey] = currentMapId;
            }
        }
        return event;
    }

    // 拦截 pluginCommand 保存当前事件ID
    const _pluginCommandBase = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _currentCommandEventId = this._eventId;
        _pluginCommandBase.call(this, command, args);
        _currentCommandEventId = 0;
    };

    // ============================================================
    // 注册独立插件指令
    // ============================================================
    PluginManager.registerCommand(pluginName, "EventFollowEnableAll", args => {
        enableAllFollowByNote();
    });

    PluginManager.registerCommand(pluginName, "EventFollowDisableAll", args => {
        disableAllFollowByNote();
    });

    PluginManager.registerCommand(pluginName, "EventFollowEnable", args => {
        const event = getTargetEvent(args.eventId);
        if (event) fullyEnableFollow(event);
    });

    PluginManager.registerCommand(pluginName, "EventFollowDisable", args => {
        const event = getTargetEvent(args.eventId);
        if (event) fullyDisableFollow(event);
    });

    PluginManager.registerCommand(pluginName, "EventFollowDisableMove", args => {
        const event = getTargetEvent(args.eventId);
        if (event) {
            setFollowEnabled(event, true);
            setFollowMoveDisabled(event, true);
            setFollowTurnWhenMoveDisabled(event, true);
        }
    });

    PluginManager.registerCommand(pluginName, "EventFollowEnableMove", args => {
        const event = getTargetEvent(args.eventId);
        if (event) {
            setFollowEnabled(event, true);
            setFollowMoveDisabled(event, false);
            setFollowTurnWhenMoveDisabled(event, true);
        }
    });

    PluginManager.registerCommand(pluginName, "EventFollowDisableTurn", args => {
        const event = getTargetEvent(args.eventId);
        if (event) setFollowTurnWhenMoveDisabled(event, false);
    });

    PluginManager.registerCommand(pluginName, "EventFollowEnableTurn", args => {
        const event = getTargetEvent(args.eventId);
        if (event) setFollowTurnWhenMoveDisabled(event, true);
    });

    PluginManager.registerCommand(pluginName, "EventFollowEnableTele", args => {
        const event = getTargetEvent(args.eventId);
        if (event) setFollowTeleportEnabled(event, true);
    });

    PluginManager.registerCommand(pluginName, "EventFollowDisableTele", args => {
        const event = getTargetEvent(args.eventId);
        if (event) setFollowTeleportEnabled(event, false);
    });

    // ============================================================
    // Game_Event 初始化
    // ============================================================
    const _initMembers = Game_Event.prototype.initMembers;
    Game_Event.prototype.initMembers = function() {
        _initMembers.call(this);
        this._followEnabled = false;
        this._followSpeed = defaultSpeed;
        this._followDistance = defaultDistance;
        this._followWaiting = false;
        this._followWaitStartFrame = 0;
        this._followWaitStartPlayerDist = 0;
        this._followLockedSpeed = null;
        this._followTeleportOnMapChange = true;
        this._followOriginalMapId = $gameMap ? $gameMap.mapId() : 0;
    };

    // ============================================================
    // 地图加载时恢复跟随状态
    // ============================================================
    const _onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _onMapLoaded.call(this);
        
        if ($gameSystem && $gameSystem._followGlobalEnabled !== undefined) {
            applyGlobalFollowState();
        }
        
        resetRuntimeCaches();

        const events = $gameMap._events;
        if (!events) return;
        const player = $gamePlayer;
        const currentMapId = $gameMap.mapId();
        const followOriginalMapId = getSystemData('_followOriginalMapId');
        
        for (let i = 1; i < events.length; i++) {
            const ev = events[i];
            if (!ev) continue;
            
            const enabled = isFollowEnabled(ev);
            ev._followEnabled = enabled;
            
            const teleportEnabled = isFollowTeleportEnabled(ev);
            ev._followTeleportOnMapChange = teleportEnabled;
            
            const origKey = 'e' + ev._eventId;
            const originalMapId = followOriginalMapId[origKey];
            const isReturning = (originalMapId === undefined) || (currentMapId === originalMapId);
            
            // 只有开启了地图传送功能（包含全局参数和事件属性），才执行定位
            if (enableMapTeleportParam && enabled && teleportEnabled && isReturning) {
                const key = getEventKey(ev);
                if (!window._followTeleportedThisMap.has(key)) {
                    if (teleportDelayMode === 'immediate') {
                        ev.locate(player.x, player.y);
                        window._followTeleportedThisMap.add(key);
                        ev._followWaiting = false;
                    } else {
                        window._followTeleportDelayCounter[key] = 0;
                        ev._followPendingTeleport = true;
                    }
                }
            }
        }
    };

    // ============================================================
    // 延迟传送处理
    // ============================================================
    const _updateSceneMap = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _updateSceneMap.call(this);
        
        if (enableMapTeleportParam && teleportDelayMode === 'delayed') {
            const player = $gamePlayer;
            const events = $gameMap ? $gameMap._events : null;
            if (!events) return;

            for (let i = 1; i < events.length; i++) {
                const ev = events[i];
                if (!ev) continue;
                const key = getEventKey(ev);
                if (ev._followPendingTeleport && window._followTeleportDelayCounter[key] !== undefined) {
                    window._followTeleportDelayCounter[key] += 1;
                    if (window._followTeleportDelayCounter[key] >= teleportDelayFrames) {
                        ev.locate(player.x, player.y);
                        ev._followWaiting = false;
                        ev._followPendingTeleport = false;
                        window._followTeleportedThisMap.add(key);
                        delete window._followTeleportDelayCounter[key];
                    }
                }
            }
        }
    };

    // ============================================================
    // update 核心逻辑
    // ============================================================
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