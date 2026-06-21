/*:
 * @target MZ
 * @plugindesc 在指定范围内随机显示气泡
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help 
 * ============================================================================
 * 插件名称: Huanaiyka_RandomBalloon
 * 版本: 1.5.2
 * 
 * 功能说明:
 *   在指定目标（玩家/当前事件/指定事件）上随机显示一个气泡。
 *   气泡编号范围可在插件参数中自定义，也支持通过插件指令在游戏过程中动态修改。
 *   动态设置的气泡范围会保存在存档中，读档后自动恢复，不会再丢失。
 * 
 * 使用方法（事件指令 → 插件指令）:
 * 
 *   【随机显示气泡】
 *   1. 事件指令中选择「插件指令」
 *   2. 插件: Huanaiyka_RandomBalloon
 *   3. 命令: 随机显示气泡
 *   4. 设置参数:
 *      - 目标选择: 玩家 / 当前事件 / 指定事件
 *      - 事件ID: 仅当目标为“指定事件”时需填写有效的地图事件ID
 * 
 *   【设置气泡范围】
 *   1. 插件指令 → 插件: Huanaiyka_RandomBalloon
 *   2. 命令: 设置气泡范围
 *   3. 参数「范围列表」填写规则同插件参数：
 *        - 逗号分隔: 1,3,5,7
 *        - 范围写法: 1-10
 *        - 特殊关键字: default  （恢复为插件参数中设置的默认列表）
 * 
 *   【重置气泡范围】
 *   1. 插件指令 → 插件: Huanaiyka_RandomBalloon
 *   2. 命令: 重置气泡范围
 *   3. 无需参数，直接将气泡范围恢复为插件参数中设定的列表。
 * 
 * 脚本调用接口（供其他脚本或插件调用）:
 *   $gameMap.randomBalloonOnPlayer()              // 玩家头顶随机气泡
 *   $gameMap.randomBalloonOnEvent(eventId)        // 指定事件头顶随机气泡
 *   $gameMap.randomBalloonOn(target)              // 任意 Game_Character 对象
 *   $gameMap.setRandomBalloonRange(rangeStr)      // 动态设置气泡范围（格式同上），会保存到存档
 *   $gameMap.resetRandomBalloonRange()            // 重置为插件默认范围，会保存到存档
 * 
 * 可用气泡ID参考（RPG Maker MZ 默认）:
 *   1: 惊讶      2: 问号       3: 音符     4: 心形
 *   5: 生气      6: 流汗       7: 纠结     8: 沉默
 *   9: 灯泡     10: ZZZ 
 * ============================================================================
 * @param balloonList
 * @text 可用气泡列表
 * @desc 支持逗号分隔（如 1,3,5,7）或范围写法（如 1-8）
 * @type string
 * @default 1-10
 * 
 * @param skipTransparentEvent
 * @text 跳过自动透明的事件
 * @desc 若开启，则透明度为0或透明标志为true的事件不会显示气泡
 * @type boolean
 * @default true
 * 
 * @param skipNoImageEvent
 * @text 跳过无图像的事件
 * @desc 若开启，则行走图设置为“无”的事件不会显示气泡
 * @type boolean
 * @default true
 * 
 * @command RandomBalloon
 * @text 随机显示气泡
 * @arg target
 * @text 目标选择
 * @type select
 * @option 玩家
 * @value player
 * @option 当前事件
 * @value this
 * @option 指定事件
 * @value event
 * @default this
 * @arg eventId
 * @text 事件ID
 * @type number
 * @min 1
 * @desc 仅当目标选择为“指定事件”时有效
 * 
 * @command SetBalloonRange
 * @text 设置气泡范围
 * @desc 修改可用的随机气泡编号列表，后续随机显示将使用此范围，并保存到存档
 * @arg range
 * @text 范围列表
 * @type string
 * @desc 例如 1-10 或 1,3,5,7 或 default 恢复默认范围
 * @default 1-10
 * 
 * @command ResetBalloonRange
 * @text 重置气泡范围
 * @desc 恢复为插件参数中设置的默认可用气泡列表，并保存到存档
 */

(function() {
    "use strict";

    const pluginName = "Huanaiyka_RandomBalloon";
    const parameters = PluginManager.parameters(pluginName);
    const balloonListParam = parameters['balloonList'] || "1-8";
    const skipTransparentEvent = (parameters['skipTransparentEvent'] || "true") === "true";
    const skipNoImageEvent = (parameters['skipNoImageEvent'] || "true") === "true";

    // 解析气泡列表字符串：逗号分隔或范围写法
    function parseBalloonList(str) {
        if (!str || str.trim() === "") return [];
        str = str.trim();

        let rangeSep = null;
        if (str.includes("-")) rangeSep = "-";
        else if (str.includes("..")) rangeSep = "..";

        if (rangeSep) {
            const parts = str.split(rangeSep);
            if (parts.length === 2) {
                const start = parseInt(parts[0], 10);
                const end = parseInt(parts[1], 10);
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    const list = [];
                    for (let i = start; i <= end; i++) list.push(i);
                    return list;
                }
            }
        }

        return str.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }

    // 默认气泡列表（从插件参数解析，固定不变）
    const defaultBalloonList = parseBalloonList(balloonListParam);

    // ----- 持久化存储：将动态范围保存在 $gameSystem 中，使其随存档保留 -----
    const STORAGE_KEY = "_huanaiykaBalloonRange";   // 存储自定义范围字符串，null 表示使用默认

    // 初始化 Game_System，添加存储属性
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this[STORAGE_KEY] = null;   // 一开始没有自定义范围
    };

    // 获取当前实际使用的气泡列表（优先使用存储的自定义范围，否则默认）
    function getCurrentBalloonList() {
        if (!$gameSystem) return defaultBalloonList.slice();   // 防御
        const customStr = $gameSystem[STORAGE_KEY];
        if (customStr && customStr.trim() !== "") {
            const parsed = parseBalloonList(customStr);
            if (parsed.length > 0) return parsed;
        }
        return defaultBalloonList.slice();
    }

    // 获取随机气泡ID（基于当前存储的有效列表）
    function getRandomBalloonId() {
        const list = getCurrentBalloonList();
        if (list.length === 0) return null;
        return list[Math.floor(Math.random() * list.length)];
    }

    // 动态修改气泡范围（并保存到 $gameSystem 中）
    function setBalloonRange(rangeStr) {
        if (!rangeStr || typeof rangeStr !== "string") return false;
        const trimStr = rangeStr.trim().toLowerCase();
        if (trimStr === "default") {
            // 恢复默认：清除自定义存储
            if ($gameSystem) $gameSystem[STORAGE_KEY] = null;
            return true;
        }
        // 尝试解析，如果解析后为空列表则视为无效，不更改任何内容
        const newList = parseBalloonList(rangeStr);
        if (newList.length === 0) return false;
        // 有效：将原始字符串存储起来（不存储解析后的数组，便于保存和可读性）
        if ($gameSystem) $gameSystem[STORAGE_KEY] = rangeStr;
        return true;
    }

    // 重置气泡范围（清除自定义存储，恢复默认）
    function resetBalloonRange() {
        if ($gameSystem) $gameSystem[STORAGE_KEY] = null;
    }

    // 增强透明检测：同时检查 _opacity 和 _transparent
    function isEventTransparent(event) {
        return event._opacity === 0 || event._transparent === true;
    }

    // MZ 标准气泡显示方式（增加透明/无图像过滤）
    function showRandomBalloonOn(target) {
        if (!target) return false;

        // 针对事件的过滤条件（玩家角色不受影响）
        if (target instanceof Game_Event) {
            // 跳过透明事件（包括移动路线设置的透明 ON 或不透明度 0）
            if (skipTransparentEvent && isEventTransparent(target)) return false;
            // 跳过无图像事件
            if (skipNoImageEvent && !target._characterName) return false;
        }

        const balloonId = getRandomBalloonId();
        if (balloonId === null) return false;
        $gameTemp.requestBalloon(target, balloonId);
        return true;
    }

    // 注册插件指令：随机显示气泡
    PluginManager.registerCommand(pluginName, "RandomBalloon", args => {
        let targetType = args.target;
        // 兼容可能的中文残留
        if (typeof targetType === "string") {
            if (targetType.includes("玩家")) targetType = "player";
            else if (targetType.includes("当前事件")) targetType = "this";
            else if (targetType.includes("指定事件")) targetType = "event";
        }

        let target = null;

        switch (targetType) {
            case "player":
                target = $gamePlayer;
                break;
            case "this": {
                const interpreter = $gameMap._interpreter || $gameTemp._interpreter;
                const eid = interpreter ? interpreter._eventId : 0;
                if (eid > 0) {
                    target = $gameMap.event(eid);
                } else {
                    target = $gamePlayer; // 回退到玩家
                }
                break;
            }
            case "event": {
                const eid = parseInt(args.eventId, 10);
                if (!isNaN(eid)) target = $gameMap.event(eid);
                break;
            }
            default:
                return;
        }

        if (target) showRandomBalloonOn(target);
    });

    // 注册插件指令：设置气泡范围
    PluginManager.registerCommand(pluginName, "SetBalloonRange", args => {
        const range = args.range;
        if (range !== undefined) {
            setBalloonRange(String(range));
        }
    });

    // 注册插件指令：重置气泡范围
    PluginManager.registerCommand(pluginName, "ResetBalloonRange", () => {
        resetBalloonRange();
    });

    // 脚本接口（挂载到 Game_Map 原型，方便使用）
    if (!Game_Map.prototype.randomBalloonOn) {
        Game_Map.prototype.randomBalloonOn = function(target) {
            return showRandomBalloonOn(target);
        };
        Game_Map.prototype.randomBalloonOnPlayer = function() {
            return showRandomBalloonOn($gamePlayer);
        };
        Game_Map.prototype.randomBalloonOnEvent = function(eventId) {
            const event = $gameMap.event(eventId);
            return showRandomBalloonOn(event);
        };
        Game_Map.prototype.setRandomBalloonRange = function(rangeStr) {
            return setBalloonRange(rangeStr);
        };
        Game_Map.prototype.resetRandomBalloonRange = function() {
            resetBalloonRange();
        };
    }

    // 如果 $gameMap 已存在，也添加便捷引用（防止异步加载时的遗漏）
    if ($gameMap) {
        if (!$gameMap.randomBalloonOn) $gameMap.randomBalloonOn = Game_Map.prototype.randomBalloonOn;
        if (!$gameMap.randomBalloonOnPlayer) $gameMap.randomBalloonOnPlayer = Game_Map.prototype.randomBalloonOnPlayer;
        if (!$gameMap.randomBalloonOnEvent) $gameMap.randomBalloonOnEvent = Game_Map.prototype.randomBalloonOnEvent;
        if (!$gameMap.setRandomBalloonRange) $gameMap.setRandomBalloonRange = Game_Map.prototype.setRandomBalloonRange;
        if (!$gameMap.resetRandomBalloonRange) $gameMap.resetRandomBalloonRange = Game_Map.prototype.resetRandomBalloonRange;
    }

    // 保证新游戏开始时 $gameSystem 上的存储字段为 null（默认范围）
    // 若存档没有该字段，加载时会自动沿用 defaultBalloonList，同样符合预期
})();