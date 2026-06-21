
/*:
 * @target MV MZ
 * @plugindesc 限制玩家只能站在允许的区域ID上
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件使用地图的“区域ID”（Region ID，编辑器中区域层涂抹的数字）。
 * 定义一个开关和一组允许移动的区域ID。
 * 当开关开启时，玩家只能移动到目标格子的区域ID在允许列表中的位置。
 * 如果当前站立位置的区域ID被禁止，则无法开始任何移动。
 *
 * 区域ID范围：0~63（0表示无区域，通常可视为禁止区域）。
 *
 * 当按下方向键无法移动时，角色仍会转向该方向（与RPG Maker默认行为一致）。
 *
 * ============================================================================
 * 插件参数设置
 * ============================================================================
 * @param masterSwitchId
 * @text 限制开关ID
 * @desc 用于控制是否启用移动限制的开关ID。
 * @type switch
 * @default 1
 *
 * @param defaultAllowedRegions
 * @text 默认允许的区域ID列表
 * @desc 开关开启时允许行走的区域ID数组。支持范围语法，如 1-3,5,8-10。
 * @default 1
 *
 * ============================================================================
 * 插件命令（事件指令 -> 插件命令）
 * ============================================================================
 * 以下命令用于动态修改允许的区域ID列表（会保存）。
 *
 * 1. 添加允许区域ID：
 *    RegionMove add 5
 *    或添加范围：RegionMove add 5-8
 *
 * 2. 移除允许区域ID：
 *    RegionMove remove 10
 *    或移除范围：RegionMove remove 2-4
 *
 * 3. 设置允许区域ID列表（覆盖）：
 *    RegionMove set 1,3,5-7
 *
 * 4. 清空允许列表：
 *    RegionMove clear
 *
 * 5. 重置为默认列表：
 *    RegionMove reset
 *
 * ============================================================================
 * 使用示例
 * ============================================================================
 * 1. 在地图区域层用区域ID 1、2、3 画出允许行走的路线。
 * 2. 设置插件参数：默认允许列表 "1-3"。
 * 3. 打开开关 ID=1 后，玩家只能走在区域1~3的格子上。
 * 4. 按下方向键即使无法移动，角色也会转向该方向。
 */

(function() {
    'use strict';

    const pluginName = 'Huanaiyka_MapMoveRestrict';

    // 解析区域范围字符串 "1-3,5,8-10" 为数组
    function parseRegionRange(str) {
        const result = [];
        if (!str) return result;
        const parts = str.split(',');
        for (let part of parts) {
            part = part.trim();
            if (!part) continue;
            const match = /^(\d+)-(\d+)$/.exec(part);
            if (match) {
                const start = parseInt(match[1], 10);
                const end = parseInt(match[2], 10);
                if (start <= end) {
                    for (let i = start; i <= end; i++) result.push(i);
                } else {
                    for (let i = start; i >= end; i--) result.push(i);
                }
            } else {
                const num = parseInt(part, 10);
                if (!isNaN(num)) result.push(num);
            }
        }
        return result;
    }

    // 将数组转换为区域范围字符串（紧凑显示，仅用于日志）
    function regionArrayToString(arr) {
        if (arr.length === 0) return '';
        arr.sort((a,b)=>a-b);
        let ranges = [];
        let start = arr[0], end = arr[0];
        for (let i = 1; i <= arr.length; i++) {
            if (i < arr.length && arr[i] === end + 1) {
                end = arr[i];
            } else {
                ranges.push(start === end ? `${start}` : `${start}-${end}`);
                if (i < arr.length) start = end = arr[i];
            }
        }
        return ranges.join(',');
    }

    // 获取插件参数
    const parameters = PluginManager.parameters(pluginName);
    const masterSwitchId = Number(parameters['masterSwitchId'] || 1);
    const defaultAllowedStr = parameters['defaultAllowedRegions'] || '1';
    let defaultAllowedRegions = parseRegionRange(defaultAllowedStr);

    //-------------------------------------------------------------------------
    // Game_System 扩展 - 存储允许的区域ID列表
    //-------------------------------------------------------------------------
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        if (this._regionMoveAllowedRegions === undefined) {
            this._regionMoveAllowedRegions = defaultAllowedRegions.slice();
        }
    };

    Game_System.prototype.getRegionMoveAllowed = function() {
        if (!Array.isArray(this._regionMoveAllowedRegions)) {
            this._regionMoveAllowedRegions = defaultAllowedRegions.slice();
        }
        return this._regionMoveAllowedRegions;
    };

    Game_System.prototype.setRegionMoveAllowed = function(regions) {
        this._regionMoveAllowedRegions = regions.filter(r => typeof r === 'number' && !isNaN(r));
    };

    // 添加单个区域（或范围字符串，如 "5-8"）
    Game_System.prototype.addRegionMoveAllowed = function(input) {
        let toAdd = [];
        if (typeof input === 'string' && input.includes('-')) {
            toAdd = parseRegionRange(input);
        } else {
            const num = Number(input);
            if (!isNaN(num)) toAdd = [num];
        }
        if (toAdd.length === 0) return;
        const current = this.getRegionMoveAllowed();
        const newSet = new Set(current);
        toAdd.forEach(id => newSet.add(id));
        this.setRegionMoveAllowed(Array.from(newSet));
    };

    // 移除单个区域（或范围）
    Game_System.prototype.removeRegionMoveAllowed = function(input) {
        let toRemove = [];
        if (typeof input === 'string' && input.includes('-')) {
            toRemove = parseRegionRange(input);
        } else {
            const num = Number(input);
            if (!isNaN(num)) toRemove = [num];
        }
        if (toRemove.length === 0) return;
        const current = this.getRegionMoveAllowed();
        const newList = current.filter(id => !toRemove.includes(id));
        this.setRegionMoveAllowed(newList);
    };

    Game_System.prototype.clearRegionMoveAllowed = function() {
        this.setRegionMoveAllowed([]);
    };

    Game_System.prototype.resetRegionMoveAllowed = function() {
        this.setRegionMoveAllowed(defaultAllowedRegions.slice());
    };

    /**
     * 检查某坐标是否允许移动（考虑总开关）
     * @param {number} regionId 目标格子的区域ID
     */
    Game_System.prototype.isRegionMoveAllowed = function(regionId) {
        if (!$gameSwitches.value(masterSwitchId)) return true;
        const allowed = this.getRegionMoveAllowed();
        return allowed.includes(regionId);
    };

    //-------------------------------------------------------------------------
    // Game_Player 移动拦截（保持转向）
    //-------------------------------------------------------------------------
    const _Game_Player_moveStraight = Game_Player.prototype.moveStraight;
    Game_Player.prototype.moveStraight = function(d) {
        // 先转向（原版第一行就是 setDirection）
        this.setDirection(d);
        
        // 计算目标坐标
        const newX = this.x + (d === 4 ? -1 : d === 6 ? 1 : 0);
        const newY = this.y + (d === 8 ? -1 : d === 2 ? 1 : 0);
        const targetRegion = $gameMap.regionId(newX, newY);
        
        // 如果目标区域不允许移动，则只转向，不调用原移动
        if (!$gameSystem.isRegionMoveAllowed(targetRegion)) {
            return;
        }
        // 否则调用原移动逻辑
        _Game_Player_moveStraight.call(this, d);
    };

    const _Game_Player_moveDiagonal = Game_Player.prototype.moveDiagonal;
    if (_Game_Player_moveDiagonal) {
        Game_Player.prototype.moveDiagonal = function(horz, vert) {
            // 斜向移动时也需要转向，但原版 moveDiagonal 中并没有转向调用。
            // 为了体验，我们将组合方向转为标准方向（优先水平/垂直？原版无转向，但我们可以设置一个最接近的方向）
            let newDir = 0;
            if (horz === 4 && vert === 8) newDir = 7; // 左上
            else if (horz === 6 && vert === 8) newDir = 9; // 右上
            else if (horz === 4 && vert === 2) newDir = 1; // 左下
            else if (horz === 6 && vert === 2) newDir = 3; // 右下
            if (newDir !== 0) this.setDirection(newDir);
            
            const newX = this.x + (horz === 4 ? -1 : horz === 6 ? 1 : 0);
            const newY = this.y + (vert === 8 ? -1 : vert === 2 ? 1 : 0);
            const targetRegion = $gameMap.regionId(newX, newY);
            if (!$gameSystem.isRegionMoveAllowed(targetRegion)) {
                return;
            }
            _Game_Player_moveDiagonal.call(this, horz, vert);
        };
    }

    const _Game_Player_jump = Game_Player.prototype.jump;
    Game_Player.prototype.jump = function(xPlus, yPlus) {
        const newX = this.x + xPlus;
        const newY = this.y + yPlus;
        const targetRegion = $gameMap.regionId(newX, newY);
        if (!$gameSystem.isRegionMoveAllowed(targetRegion)) {
            return;
        }
        _Game_Player_jump.call(this, xPlus, yPlus);
    };

    // 可选：检查当前站立位置是否允许（如果禁止则完全禁止移动）
    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        const currentRegion = $gameMap.regionId(this.x, this.y);
        if (!$gameSystem.isRegionMoveAllowed(currentRegion)) return false;
        return _Game_Player_canMove.call(this);
    };

    //-------------------------------------------------------------------------
    // 插件命令处理
    //-------------------------------------------------------------------------
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command.toLowerCase() !== 'regionmove') return;
        if (!args || args.length === 0) return;
        const sub = args[0].toLowerCase();
        const param = args[1];
        switch (sub) {
            case 'add':
                if (param) $gameSystem.addRegionMoveAllowed(param);
                break;
            case 'remove':
                if (param) $gameSystem.removeRegionMoveAllowed(param);
                break;
            case 'set':
                const setStr = args.slice(1).join(',');
                const newList = parseRegionRange(setStr);
                $gameSystem.setRegionMoveAllowed(newList);
                break;
            case 'clear':
                $gameSystem.clearRegionMoveAllowed();
                break;
            case 'reset':
                $gameSystem.resetRegionMoveAllowed();
                break;
            default:
                console.warn(`RegionMove: 未知命令 ${sub}`);
        }
    };

    console.log(`${pluginName} 已加载。开关ID: ${masterSwitchId}, 允许区域: ${regionArrayToString(defaultAllowedRegions)}`);
})();