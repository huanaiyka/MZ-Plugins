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
 * ============================================================================
 * 用法
 * ============================================================================
 * 在敌群事件页（如第0回合，条件：回合0）中，按以下顺序编写：
 * * 插件指令：AlwaysBlock       ← 通用块开始（无论胜负都执行）
 * ... 通用指令 ...
 * 插件指令：VictoryBlock      ← 胜利块开始
 * ... 胜利奖励指令 ...
 * 插件指令：DefeatBlock       ← 失败块开始
 * ... 失败惩罚指令 ...
 * 插件指令：EscapeBlock       ← 逃跑块开始
 * ... 逃跑处理指令 ...
 * 
 * * @command AlwaysBlock
 * @text 通用块
 * @desc 标记无论胜负都执行的指令块（优先执行）
 * @command VictoryBlock
 * @text 胜利块
 * @desc 标记胜利时执行的指令块
 * @command DefeatBlock
 * @text 失败块
 * @desc 标记失败时执行的指令块
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
        $gameTemp[STORAGE_KEY] = null;
        $gameTemp[RESULT_KEY]  = null;
    }

    function setCommand(type, commands) {
        // 深拷贝指令，并追加标准的事件结束符 { code: 0 } 确保安全
        const copy = JSON.parse(JSON.stringify(commands));
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

        let nextBlockIdx = list.length;
        for (let i = idx + 1; i < list.length; i++) {
            const item = list[i];
            if (item && item.code === 357 && item.parameters[0] === pluginName) {
                if (RESULT_CMDS.includes(item.parameters[1])) {
                    nextBlockIdx = i;
                    break;
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

    // ---- 注册指令 ----
    PluginManager.registerCommand(pluginName, CMD_ALWAYS, function() { processBlockInterception(this, "always"); });
    PluginManager.registerCommand(pluginName, CMD_VICTORY, function() { processBlockInterception(this, "victory"); });
    PluginManager.registerCommand(pluginName, CMD_DEFEAT, function() { processBlockInterception(this, "defeat"); });
    PluginManager.registerCommand(pluginName, CMD_ESCAPE, function() { processBlockInterception(this, "escape"); });

    // ---- 战斗结果监听 ----
    const _BattleManager_startBattle = BattleManager.startBattle;
    BattleManager.startBattle = function() {
        clearAllCommands();
        _BattleManager_startBattle.call(this);
    };

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

    // ---- 核心注入：在回到地图且地图解释器准备就绪时注入指令 ----
    const _Game_Map_updateInterpreter = Game_Map.prototype.updateInterpreter;
    Game_Map.prototype.updateInterpreter = function() {
        // 当地图的主解释器空闲，且有待处理的战斗延迟指令时
        if (!this._interpreter.isRunning() && $gameTemp[RESULT_KEY]) {
            const result = $gameTemp[RESULT_KEY];
            const alwaysCmds = getCommand("always");
            const resultCmds = getCommand(result);

            let finalCustomCommands = [];

            if (alwaysCmds) finalCustomCommands = finalCustomCommands.concat(alwaysCmds);
            if (resultCmds) finalCustomCommands = finalCustomCommands.concat(resultCmds);

            if (finalCustomCommands.length > 0) {
                // 使用官方推荐的方法，直接将这组指令作为主解释器的全新流程启动
                this._interpreter.setup(finalCustomCommands, 0);
            }
            
            // 消费掉数据，防止重复触发
            clearAllCommands();
        }
        
        _Game_Map_updateInterpreter.call(this);
    };

})();