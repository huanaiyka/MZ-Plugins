/*:
 * @target MZ
 * @plugindesc 物品选择光标位置记忆
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @help
 * ----------------------------------------------------------------------------
 * 功能说明
 * ----------------------------------------------------------------------------
 * ・在物品选择窗口（物品菜单、事件“选择物品”等）中，自动记住上次选中的物品。
 * ・下次打开同一个物品选择界面时，光标自动移动到上次位置。
 * ・
 * ・读档后记忆自动清除（数据不存入存档文件）。
 * ・可通过插件参数决定“移动地图时”是否清除记忆。
 * ・可通过插件指令手动重置光标记忆。
 *
 * ----------------------------------------------------------------------------
 * 注意事项
 * ----------------------------------------------------------------------------
 * ・本插件记忆的是光标位置索引（第几个物品），而非具体物品 ID。
 * ・如果记忆中的物品在使用过程中消失（例如被消耗、丢弃），再次打开物品窗口时：
 *   - 若记忆的索引仍在列表范围内，光标会停留在原索引位置（可能显示其他物品）；
 *   - 若记忆的索引超出当前列表长度，光标会自动跳到最后一个物品；
 *   - 若列表为空，则不会恢复光标。
 *   - 以上情况均**不会导致游戏报错或崩溃**，可放心使用。
 *
 * ----------------------------------------------------------------------------
 * 更新日志
 * ----------------------------------------------------------------------------
 * v1.1 (2026-06-13)
 *   - 修复：恢复光标后窗口可视区域不跟随滚动的问题（调用 ensureCursorVisible）。
 *   - 修复：避免空物品列表时记忆无效索引导致的潜在错误。
 *   - 优化：保存记忆时只记录有效物品索引（忽略 -1）。
 *
 * v1.0
 *   - 初始版本：基础光标位置记忆功能。
 *
 * ----------------------------------------------------------------------------
 * 兼容性
 * ----------------------------------------------------------------------------
 *   本插件修改了 Window_ItemList 的 activate、processCursorMove、onTouch 方法，
 *   并监听 Game_Map.setup。若与其他同类插件冲突，请调整加载顺序。
 *
 * ----------------------------------------------------------------------------
 * 使用步骤
 * ----------------------------------------------------------------------------
 *   1. 将本文件保存为 ItemCursorMemory.js（UTF-8 无 BOM）。
 *   2. 放入项目 js/plugins 文件夹。
 *   3. 在 MZ 编辑器插件管理器中添加本插件，按需修改参数。
 *   4. 无需额外配置，即开即用。
 * ----------------------------------------------------------------------------
 *
 * @param resetOnMoveMap
 * @text 移动地图时重置
 * @desc 切换地图时是否清除记忆（是 = 重置，否 = 保留）
 * @type boolean
 * @on 是
 * @off 否
 * @default true
 *
 * @command ResetItemCursor
 * @text 重置物品光标记忆
 * @desc 执行后清除所有物品选择窗口的光标位置记忆。
 */

(function() {
    'use strict';

    // ---------- 获取参数 ----------
    const pluginName = 'Huanaiyka_ItemCursorMemory';
    const params = PluginManager.parameters(pluginName);
    const resetOnMoveMap = params['resetOnMoveMap'] === 'true';

    // ---------- 记忆存取函数 ----------
    function saveItemCursorIndex(index) {
        if ($gameTemp && typeof index === 'number' && index >= 0) {
            $gameTemp._lastItemCursorIndex = index;
        }
    }

    function loadItemCursorIndex() {
        return $gameTemp ? $gameTemp._lastItemCursorIndex : null;
    }

    function resetItemCursorMemory() {
        if ($gameTemp) {
            delete $gameTemp._lastItemCursorIndex;
        }
    }

    // ---------- 地图切换时重置（可选） ----------
    if (resetOnMoveMap) {
        const _GameMap_setup = Game_Map.prototype.setup;
        Game_Map.prototype.setup = function(mapId) {
            _GameMap_setup.call(this, mapId);
            resetItemCursorMemory();
        };
    }

    // ---------- 窗口激活时恢复光标（并滚动到可见区域）----------
    const _Window_ItemList_activate = Window_ItemList.prototype.activate;
    Window_ItemList.prototype.activate = function() {
        _Window_ItemList_activate.call(this);
        // 空列表时不做恢复，避免出错
        if (!this._data || this._data.length === 0) return;

        const savedIdx = loadItemCursorIndex();
        if (savedIdx !== undefined && savedIdx !== null) {
            const maxIdx = this._data.length - 1;
            let targetIdx = savedIdx;
            if (targetIdx > maxIdx) targetIdx = maxIdx;
            if (targetIdx >= 0) {
                this.select(targetIdx);
                // 关键修复：强制滚动到光标所在行
                if (this.ensureCursorVisible) {
                    this.ensureCursorVisible();
                } else if (this.scrollTo) {
                    // 备用方案（MZ基类通常包含 ensureCursorVisible）
                    this.scrollTo(this.index());
                }
            } else {
                this.select(0);
            }
        }
    };

    // ---------- 光标移动时保存 ----------
    const _Window_ItemList_processCursorMove = Window_ItemList.prototype.processCursorMove;
    Window_ItemList.prototype.processCursorMove = function() {
        _Window_ItemList_processCursorMove.call(this);
        saveItemCursorIndex(this.index());
    };

    // ---------- 鼠标/触摸选择时保存 ----------
    const _Window_ItemList_onTouch = Window_ItemList.prototype.onTouch;
    Window_ItemList.prototype.onTouch = function(trigger) {
        _Window_ItemList_onTouch.call(this, trigger);
        saveItemCursorIndex(this.index());
    };

// ---------- 处理插件指令 (RM MZ 标准方式) ----------
    PluginManager.registerCommand(pluginName, 'ResetItemCursor', () => {
        resetItemCursorMemory();
    });
})();