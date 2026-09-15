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

(() => {
    'use strict';

    // 重写地图遇敌列表获取逻辑
    const _Game_Map_encounterList = Game_Map.prototype.encounterList;
    Game_Map.prototype.encounterList = function() {
        // 获取原始遇敌列表
        const list = _Game_Map_encounterList.call(this);

        // 如果地图没有配置备注，直接返回原始列表
        if (!$dataMap || !$dataMap.meta) {
            return list;
        }

        // 解析地图备注 <ControlEncounter: 起始序号 | 开关ID>
        const tag = $dataMap.meta.ControlEncounter;
        if (tag) {
            const params = tag.split('|').map(item => parseInt(item.trim(), 10));
            const startIndex = params[0]; // 1-based index (如 3 表示第3组)
            const switchId = params[1];

            // 校验参数合法性以及对应开关状态
            if (startIndex && switchId && !$gameSwitches.value(switchId)) {
                // 如果指定开关为 OFF，截取第 1 个到第 (startIndex - 1) 个敌群
                // 索引转换：数组下标从 0 开始，所以截取 0 到 startIndex - 1
                return list.slice(0, Math.max(0, startIndex - 1));
            }
        }

        return list;
    };
})();