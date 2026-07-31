/*:
 * @target MZ
 * @plugindesc v3.0 地图动态追加敌群控制（多重开关条件追加版）
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件允许通过全局开关，动态向当前地图的随机遇敌池中“追加”新的敌群。
 * 开关关闭时，地图维持数据库原样；开关打开时，对应的新敌群会带着权重混入遇敌池。
 * 
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 打开数据库 -> 地图 -> 选择目标地图。
 * 2. 在“注释”区域中，按以下格式编写标签：
 * 
 *    格式一（带权重与开关）：<AddTroop: 敌群ID(权重) | 开关ID>
 *    格式二（多敌群带开关）：<AddTroop: 敌群ID(权重), 敌群ID(权重) | 开关ID>
 *    格式三（无开关直接追加）：<AddTroop: 敌群ID(权重)>
 * 
 *    【示例 1：剧情解锁新怪物】
 *    <AddTroop: 5(10), 6(12) | 15>
 *    表示：当 15 号开关为 ON 时，当前地图的随机遇敌池会额外加入 5 号敌群（权重10）
 *          和 6 号敌群（权重12）。如果开关为 OFF，则这两只怪绝不会出现。
 * 
 *    【示例 2：多重条件叠加（例如：深夜遇到稀有怪 + 悬赏令解锁精英怪）】
 *    <AddTroop: 7(5) | 21>   <- 21号开关（夜间模式）打开时，追加 7 号稀有怪
 *    <AddTroop: 8(8) | 22>   <- 22号开关（悬赏接取）打开时，追加 8 号精英怪
 *    表示：当两个开关都打开时，7号和8号会同时混入普通怪物的池子里。
 * 
 *    【注意】
 *    权重(weight)决定了怪物出现的几率，数字越大越容易被踩到。如果不写括号里的权重，
 *    例如 <AddTroop: 5 | 15>，系统会自动将权重默认为 10。
 * ============================================================================
 */

(function() {
    'use strict';

    /**
     * 解析地图注释，提取包含开关条件的追加敌群配置
     * @param {string} note - 地图备注文本
     * @returns {Array<{troopId: number, weight: number, switchId: number}>} 配置数组
     */
    function parseMultiAddConfigs(note) {
        const configs = [];
        if (!note) return configs;

        // 匹配 <AddTroop: 后面直到 > 结束的内容
        const regex = /<AddTroop:\s*([^>]+)>/gi;
        let match;

        while ((match = regex.exec(note)) !== null) {
            const rawContent = match[1];
            let troopPart = rawContent;
            let switchId = 0; // 默认 0 表示无开关限制，无条件追加

            // 如果包含 '|'，拆分敌群部分和开关条件部分
            if (rawContent.includes('|')) {
                const parts = rawContent.split('|');
                troopPart = parts[0];
                switchId = parseInt(parts[1].trim(), 10) || 0;
            }

            // 解析形如 "5(10), 6" 这样的敌群+权重组合
            const troopTokens = troopPart.split(',');
            for (const token of troopTokens) {
                const trimmed = token.trim();
                if (!trimmed) continue;

                let troopId = NaN;
                let weight = 10; // 默认权重给予 10

                // 检查是否带有括号指定权重，如 "5(15)"
                const weightMatch = trimmed.match(/^(\d+)\s*\((\d+)\)$/);
                if (weightMatch) {
                    troopId = parseInt(weightMatch[1], 10);
                    weight = parseInt(weightMatch[2], 10);
                } else {
                    // 没有括号，纯数字情况
                    troopId = parseInt(trimmed, 10);
                }

                if (!isNaN(troopId)) {
                    configs.push({
                        troopId: troopId,
                        weight: weight,
                        switchId: switchId
                    });
                }
            }
        }
        return configs;
    }

    // ---- 挂载到 Game_Map 处理缓存 ----
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        // 在换地图时，一次性解析出所有的动态追加配置
        this._dynamicAddTroopConfigs = parseMultiAddConfigs($dataMap ? $dataMap.note : "");
    };

    /**
     * 获取当前开关状态下，所有已经满足追加条件的敌群列表
     * @returns {Array<{troopId: number, weight: number, regionFlags: number[]}>}
     */
    Game_Map.prototype.getValidAddedEncounters = function() {
        const configs = this._dynamicAddTroopConfigs || [];
        const addedEncounters = [];

        for (const config of configs) {
            // 当没有开关限制(0) 或者 对应全局开关打开时，条件成立
            const isConditionMet = (config.switchId === 0) || $gameSwitches.value(config.switchId);
            
            if (isConditionMet) {
                addedEncounters.push({
                    troopId: config.troopId,
                    weight: config.weight,
                    regionFlags: [] // 动态追加的怪物默认全地图或不限制区域图块。也可留空，MZ底层支持空数组
                });
            }
        }
        return addedEncounters;
    };

    // ---- 拦截并扩展玩家的随机遇敌列表 ----
    const _Game_Player_makeEncounterList = Game_Player.prototype.makeEncounterList;
    Game_Player.prototype.makeEncounterList = function() {
        // 1. 获取原图自带的初始遇敌列表
        const originalList = _Game_Player_makeEncounterList.call(this) || [];

        // 2. 获取当前地图通过备注条件触发、需要新塞入的敌群
        const extraEncounters = $gameMap.getValidAddedEncounters();

        // 3. 如果有需要追加的怪物，直接拼接到原生遇敌池里
        if (extraEncounters.length > 0) {
            return originalList.concat(extraEncounters);
        }

        // 4. 没有符合条件的新怪，直接返回原列表
        return originalList;
    };

})();