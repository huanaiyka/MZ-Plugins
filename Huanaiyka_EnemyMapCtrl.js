/*:
 * @target MZ
 * @plugindesc 通过开关控制地图的敌群列表
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件用于控制 RPG Maker 数据库中“地图遇敌列表”的解锁条件。
 * 可以指定“从第 N 个敌群开始，必须开启指定开关后才能被玩家遇到”。
 * 
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 在数据库 -> 地图 -> 随机遇敌列表中，正常配置好你的敌群顺序。
 * 2. 在地图的“注释”区域中填写以下标签：
 * 
 *    <ControlEncounter: 列表起始序号 | 开关ID>
 * 
 * 【使用示例】
 * 假设你在地图遇敌列表中配置了 5 组怪物：
 *   第 1 组：史莱姆
 *   第 2 组：野狼
 *   第 3 组：哥布林（精英）
 *   第 4 组：兽人战士
 *   第 5 组：区域 Boss
 * 
 * 在地图注释填入：
 * <ControlEncounter: 3 | 15>
 * 
 * 效果：
 * - 当开关 15 为 OFF 时：玩家只会遇到第 1、2 组（史莱姆、野狼）。
 * - 当开关 15 为 ON 时：玩家可以遇到第 1 ~ 5 组的所有怪物。
 * ============================================================================
 */

(function() {
    'use strict';

    /**
     * 解析地图注释中的敌群控制标签
     * @param {string} note - 地图备注
     * @returns {{startIndex: number, switchId: number} | null}
     */
    function parseEncounterControlConfig(note) {
        if (!note) return null;

        const match = note.match(/<ControlEncounter:\s*(\d+)\s*\|\s*(\d+)>/i);
        if (match) {
            return {
                startIndex: parseInt(match[1], 10), // 从第几个开始（1-based）
                switchId: parseInt(match[2], 10)     // 控制开关 ID
            };
        }
        return null;
    }

    // ---- 在地图加载时缓存解析配置 ----
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        const note = $dataMap ? $dataMap.note : "";
        this._encounterControlConfig = parseEncounterControlConfig(note);
    };

    // ---- 拦截并过滤遇敌列表 ----
    const _Game_Player_makeEncounterList = Game_Player.prototype.makeEncounterList;
    Game_Player.prototype.makeEncounterList = function() {
        // 1. 获取地图原本配置的所有遇敌项
        const originalList = _Game_Player_makeEncounterList.call(this) || [];
        const config = $gameMap._encounterControlConfig;

        // 2. 如果没有设置标签，或者设置的起始序号非法，直接返回原列表
        if (!config || config.startIndex <= 1) {
            return originalList;
        }

        // 3. 检查控制开关的状态
        const isSwitchOn = $gameSwitches.value(config.switchId);

        // 4. 如果开关打开，允许遇到全部敌群；如果开关关闭，截取前面的部分
        if (isSwitchOn) {
            return originalList;
        } else {
            // startIndex 是 1-based，转为数组索引需要 -1
            // 例如 startIndex = 3，则截取 index 0 和 1（即第 1、2 项）
            const cutoffIndex = config.startIndex - 1;
            return originalList.slice(0, cutoffIndex);
        }
    };

})();