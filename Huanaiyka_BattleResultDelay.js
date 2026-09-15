/*:
 * @plugindesc 敌群页延迟执行战斗结果
 * @author 幻爱
 * @target MZ
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 功能
 * ============================================================================
 * 在敌群事件页中使用四个插件指令，分别标记通用、胜利、失败、逃跑时，
 * 延迟执行的事件指令块。战斗结束后，按「通用块 → 结果块」的顺序在地图上执行。
 * 
 * ============================================================================
 * 注意事项 / 使用规范
 * ============================================================================
 * 1. 块拦截依赖同级的插件指令标记，请确保各个 Block 指令位于同一缩进层级。
 * 2. 延迟到地图执行的事件指令中，请避免使用“本事件”、“显示在事件头顶”等
 *    强依赖特定地图事件 ID (eventId) 的指令。
 * 
 * @command AlwaysBlock
 * @text 通用块
 * @desc 标记无论胜负都执行的指令块（优先执行）
 * 
 * @command VictoryBlock
 * @text 胜利块
 * @desc 标记胜利时执行的指令块
 * 
 * @command DefeatBlock
 * @text 失败块
 * @desc 标记失败时执行的指令块
 * 
 * @command EscapeBlock
 * @text 逃跑块
 * @desc 标记逃跑时执行的指令块
 */

(function() {
    const pluginName = "Huanaiyka_BattleResultDelay";

    const CMD_ALWAYS   = "AlwaysBlock";
    const CMD_VICTORY  = "VictoryBlock";
    const CMD_DEFEAT   = "DefeatBlock";
    const CMD_ESCAPE   = "EscapeBlock";
    const RESULT_CMDS  = [CMD_ALWAYS, CMD_VICTORY, CMD_DEFEAT, CMD_ESCAPE];

    const STORAGE_KEY  = "_battleResultCommands";
    const RESULT_KEY   = "_battleResult";

    // ---- 数据管理 ----
    function getStorage() {
        if (!$gameTemp[STORAGE_KEY]) {
            $gameTemp[STORAGE_KEY] = { always: null, victory: null, defeat: null, escape: null };
        }
        return $gameTemp[STORAGE_KEY];
    }

    function clearAllCommands() {
        if ($gameTemp) {
            $gameTemp[STORAGE_KEY] = null;
            $gameTemp[RESULT_KEY]  = null;
        }
    }

    function setCommand(type, commands) {
        // 深拷贝指令，并重置基本缩进，追加标准的事件结束符 { code: 0 }
        const copy = JSON.parse(JSON.stringify(commands));
        
        // 校正缩进偏移，防止截取块中的条件分支导致地图解释器缩进错乱
        if (copy.length > 0) {
            const baseIndent = copy[0].indent || 0;
            for (let i = 0; i < copy.length; i++) {
                copy[i].indent = Math.max(0, copy[i].indent - baseIndent);
            }
        }

        copy.push({ code: 0, indent: 0, parameters: [] });
        getStorage()[type] = copy;
    }

    function getCommand(type) {
        return getStorage()[type] || null;
    }

    // ---- 拦截并截取指令块 ----
    function processBlockInterception(interpreter, type) {
        const list = interpreter._list;
        const idx  = interpreter._index;
        if (!list) return;

        const currentIndent = list[idx].indent;
        let nextBlockIdx = list.length;

        // 寻找下一个同级或上级的本插件指令作为边界
        for (let i = idx + 1; i < list.length; i++) {
            const item = list[i];
            if (item && item.code === 357 && item.parameters[0] === pluginName) {
                if (RESULT_CMDS.includes(item.parameters[1])) {
                    if (item.indent <= currentIndent) {
                        nextBlockIdx = i;
                        break;
                    }
                }
            }
        }

        const block = list.slice(idx + 1, nextBlockIdx);
        if (block.length > 0) {
            setCommand(type, block);
        }

        // 跳过这部分指令，不让它们在战斗中当场执行
        interpreter._index = nextBlockIdx - 1;
    }

    // ---- 注册插件指令 ----
    PluginManager.registerCommand(pluginName, CMD_ALWAYS, function() { processBlockInterception(this, "always"); });
    PluginManager.registerCommand(pluginName, CMD_VICTORY, function() { processBlockInterception(this, "victory"); });
    PluginManager.registerCommand(pluginName, CMD_DEFEAT, function() { processBlockInterception(this, "defeat"); });
    PluginManager.registerCommand(pluginName, CMD_ESCAPE, function() { processBlockInterception(this, "escape"); });

    // ---- 数据安全清理防污染 Hook ----
    const _BattleManager_startBattle = BattleManager.startBattle;
    BattleManager.startBattle = function() {
        clearAllCommands();
        _BattleManager_startBattle.call(this);
    };

    const _DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _DataManager_setupNewGame.call(this);
        clearAllCommands();
    };

    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        clearAllCommands();
    };

    // ---- 战斗结果监听 ----
    const _BattleManager_processDefeat = BattleManager.processDefeat;
    BattleManager.processDefeat = function() {
        _BattleManager_processDefeat.call(this);
        $gameTemp[RESULT_KEY] = "defeat";
    };

    const _BattleManager_processEscape = BattleManager.processEscape;
    BattleManager.processEscape = function() {
        _BattleManager_processEscape.call(this);
        $gameTemp[RESULT_KEY] = "escape";
    };

    const _BattleManager_processVictory = BattleManager.processVictory;
    BattleManager.processVictory = function() {
        _BattleManager_processVictory.call(this);
        $gameTemp[RESULT_KEY] = "victory";
    };

    // ---- 核心注入：回到地图且地图解释器准备就绪时注入指令 ----
    const _Game_Map_updateInterpreter = Game_Map.prototype.updateInterpreter;
    Game_Map.prototype.updateInterpreter = function() {
        // 当地图的主解释器空闲，且有待处理的战斗延迟指令时
        if (!this._interpreter.isRunning() && $gameTemp && $gameTemp[RESULT_KEY]) {
            const result = $gameTemp[RESULT_KEY];
            const alwaysCmds = getCommand("always");
            const resultCmds = getCommand(result);

            let finalCustomCommands = [];

            if (alwaysCmds) finalCustomCommands = finalCustomCommands.concat(alwaysCmds);
            if (resultCmds) finalCustomCommands = finalCustomCommands.concat(resultCmds);

            if (finalCustomCommands.length > 0) {
                // 将指令交给地图主解释器执行，eventId 设置为 0 确保安全
                this._interpreter.setup(finalCustomCommands, 0);
            }
            
            // 消费掉数据，防止重复触发
            clearAllCommands();
        }
        
        _Game_Map_updateInterpreter.call(this);
    };

})();