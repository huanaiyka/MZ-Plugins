/*:
 * @target MZ
 * @plugindesc 事件距离隐形
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件可以让地图上的事件在玩家离开指定距离后自动隐藏（透明度变为0），
 * 靠近后自动显示。支持同一组事件联动显示。
 * 
 * 完全不影响事件的移动、触发、并行处理等原有功能、
 * 只修改显示层，绝对不会导致卡死或交互异常。
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 将本插件添加到 RPG Maker MZ 的插件管理器。
 * 2. 在事件（需要自动显隐的事件）的备注栏中写入标签：
 * 
 *    【必须】距离阈值：
 *        <Visible Distance: 数字>
 *        或 <VisibleDistance:数字>
 *        数字表示玩家与事件之间的最大可见距离（以格子为单位）。
 *        例如 <Visible Distance: 3> 表示玩家距离该事件 ≤ 3 格时显示，否则隐藏。
 * 
 *    【可选】组名（联动）：
 *        <VisibleGroup: 组名>
 *        组名可以是任意字符串（建议英文/数字）。同一组名的事件，只要玩家
 *        与组内任意一个事件的距离满足该事件自身的阈值，那么组内所有事件
 *        都会显示；否则全部隐藏。
 * 
 * 3. 根据需要调整插件参数「距离计算方式」（见下方说明）。
 * 4. 进入游戏测试。
 * 
 * ============================================================================
 * 标签书写示例
 * ============================================================================
 *   // 单一事件独立控制
 *   <Visible Distance: 4>
 * 
 *   // 两个事件联动（组名 A）
 *   事件1备注：<Visible Distance: 3><VisibleGroup: 1>
 *   事件2备注：<Visible Distance: 5><VisibleGroup: 1>
 *   → 只要玩家距离事件1 ≤ 3 或 距离事件2 ≤ 5，两个事件都会显示。
 * 
 * ============================================================================
 * 距离计算方式（插件参数）
 * ============================================================================
 *   ○ 曼哈顿距离（十字形范围，默认）
 *       距离 = |横向差| + |纵向差|
 *   ○ 切比雪夫距离（正方形范围）
 *       距离 = max(|横向差|, |纵向差|)
 * 
 * ============================================================================
 * 注意事项
 * ============================================================================
 * - 未写入任何距离标签的事件不受本插件影响，始终显示，且手动设置透明度有效。
 * - 距离阈值必须为正整数，0 表示仅当玩家与事件完全重叠时才显示。
 * - 组联动纯粹是视觉效果，玩家与组内事件的交互（对话、触碰等）
 *   仍按照事件原本的触发条件进行，不会因为隐藏而无法触发。
 * - 本插件采用“只修改显示层”的策略，完全不改动游戏逻辑对象，
 *   因此可以放心与其他事件类插件共用。
 * 
 * ============================================================================
 * 更新履历
 * ============================================================================
 * 【v1.2 修复】
 * - 修正了 `ev.isErased is not a function` 错误，改用 `ev._erased` 判断。
 * 
 * 【v1.1 改进】
 * - 仅对带有距离标签的事件进行自动显隐，无标签的事件完全不受影响。
 * - 手动“设置移动路线”中的不透明度命令可以对无标签事件正常生效。
 * 
 * @param distanceType
 * @text 距离计算方式
 * @type select
 * @option 曼哈顿距离（十字形范围）
 * @value 0
 * @option 切比雪夫距离（正方形范围）
 * @value 1
 * @default 0
 * @desc 选择距离算法：曼哈顿（菱形范围）或切比雪夫（正方形范围）。
 * 
 * ============================================================================
 * 版本历史
 * ============================================================================
 * v1.2 (2025-xx-xx)
 *   - 修复 isErased 方法不存在的错误。
 * v1.1 (2025-02-xx)
 *   - 修复手动透明度被覆盖的问题。
 * v1.0 (2025-02-xx)
 *   - 首发稳定版
 */

(function() {
    "use strict";

    // 获取插件名称
    let pluginName = "VisibleDistance";
    try {
        const scripts = document.querySelectorAll("script");
        for (let script of scripts) {
            if (script.src && script.src.includes("/plugins/") && script.src.includes(".js")) {
                const match = script.src.match(/\/([^\/]+)\.js$/);
                if (match && match[1] && script.innerText.includes("VisibleGroup")) {
                    pluginName = match[1];
                    break;
                }
            }
        }
    } catch(e) {}

    const params = PluginManager.parameters(pluginName);
    const distanceType = Number(params.distanceType || 0);

    // 距离计算函数
    function getDistance(px, py, ex, ey) {
        const dx = Math.abs(px - ex);
        const dy = Math.abs(py - ey);
        return distanceType === 1 ? Math.max(dx, dy) : dx + dy;
    }

    // 存储事件数据：eventId -> { threshold, group }
    const eventData = new Map();

    // 从事件备注中提取数据（只执行一次）
    function loadEventData(event) {
        if (event._loadedVisibleData) return;
        event._loadedVisibleData = true;
        const eventDataObj = event.event ? event.event() : event._event;
        if (!eventDataObj || !eventDataObj.meta) return;
        const meta = eventDataObj.meta;
        let threshold = undefined;
        const candidates = ['Visible Distance', 'VisibleDistance', 'visible distance'];
        for (let key of candidates) {
            if (meta[key] !== undefined) {
                let v = parseInt(meta[key]);
                if (!isNaN(v)) { threshold = v; break; }
            }
        }
        if (threshold === undefined) {
            for (let k in meta) {
                if (/visible.*distance/i.test(k)) {
                    let v = parseInt(meta[k]);
                    if (!isNaN(v)) { threshold = v; break; }
                }
            }
        }
        if (threshold === undefined) return;
        let group = undefined;
        if (meta.VisibleGroup !== undefined) group = String(meta.VisibleGroup);
        else if (meta.visiblegroup !== undefined) group = String(meta.visiblegroup);
        eventData.set(event.eventId(), { threshold, group });
    }

    // 每帧更新所有受控事件的透明度（直接修改角色 _opacity）
    function updateCharactersOpacity() {
        if (!SceneManager._scene || !(SceneManager._scene instanceof Scene_Map)) return;
        const map = $gameMap;
        if (!map) return;
        const player = $gamePlayer;
        const px = player.x, py = player.y;

        // 1. 计算每个事件自身是否满足距离条件
        const selfActive = new Map();
        for (let [id, data] of eventData.entries()) {
            const ev = map.event(id);
            if (!ev || ev._erased) continue;   // 修复：ev.isErased -> ev._erased
            const dist = getDistance(px, py, ev.x, ev.y);
            selfActive.set(id, dist <= data.threshold);
        }
        // 2. 计算每个组是否激活
        const groupActive = new Map();
        for (let [id, data] of eventData.entries()) {
            if (data.group && selfActive.get(id)) {
                groupActive.set(data.group, true);
            }
        }
        // 3. 应用透明度到角色属性
        for (let [id, data] of eventData.entries()) {
            const ev = map.event(id);
            if (!ev || ev._erased) continue;   // 修复：ev.isErased -> ev._erased
            let targetOpacity = 0;
            if (data.group) {
                targetOpacity = groupActive.get(data.group) ? 255 : 0;
            } else {
                targetOpacity = selfActive.get(id) ? 255 : 0;
            }
            // 直接修改 _opacity，引擎会自动同步到精灵
            if (ev._opacity !== targetOpacity) ev._opacity = targetOpacity;
        }
    }

    // 覆写 setupPage：在事件页刷新时重新读取备注
    const _setupPage = Game_Event.prototype.setupPage;
    Game_Event.prototype.setupPage = function() {
        _setupPage.call(this);
        this._loadedVisibleData = false;
        loadEventData(this);
    };

    // 地图切换时清空缓存并重新加载所有事件数据
    const _mapSetup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _mapSetup.call(this, mapId);
        eventData.clear();
        for (let ev of this._events) {
            if (ev) {
                ev._loadedVisibleData = false;
                loadEventData(ev);
            }
        }
    };

    // 每帧在地图画面的最后刷新透明度
    const _sceneUpdate = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _sceneUpdate.call(this);
        updateCharactersOpacity();
    };
})();