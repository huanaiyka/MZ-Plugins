/*:
 * @target MZ
 * @plugindesc 无放回随机抽取池到变量
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help 
 * ============================================================
 * 插件说明
 * ============================================================
 * 从指定池子中无放回随机抽取一个元素（数字或文字均可），
 * 抽完可按设定自动重置或返回 0。多池独立状态，可存盘。
 *
 * ============================================================
 * 插件命令
 * ============================================================
 * DrawUniqueNumber 池子 变量ID      → 抽完自动重置
 * DrawUniqueNumberStrict 池子 变量ID → 抽完返回 0，需手动重置
 * ResetPool                          → 重置所有池（无需参数）
 *
 * 池子写法：英文逗号分隔，例如 "10,20,30" 或 "苹果,香蕉,橙子"。
 *
 * ============================================================
 * 脚本调用
 * ============================================================
 * drawUniqueNumber(poolArray, variableId, autoReset)
 * resetUniqueDrawPool(poolArray)   // 传 null/undefined 重置所有池
 *
 * ============================================================
 * 参数设置
 * ============================================================
 * @param saveState
 * @text 保存抽取状态
 * @desc 开启后抽取进度保存到存档，读档后可继续
 * @type boolean
 * @default false
 *
 * @param defaultPool
 * @text 默认池子
 * @desc 插件命令留空时使用，英文逗号分隔
 * @type string
 * @default
 *
 * @param avoidConsecutive
 * @text 重置后避免连续相同元素
 * @desc 重置后新轮第一个结果 ≠ 上轮最后一个
 * @type boolean
 * @default true
 *
 * @param autoResetOnEmpty
 * @text  脚本模式抽完后自动重置
 * @desc 脚本简写 drawUniqueNumber(池, 变量) 时，抽空后是否自动重置
 * @type boolean
 * @default true
 *
 * @command DrawUniqueNumber
 * @text 无放回抽取（自动重置）
 * @desc 抽完自动重置
 * @arg poolString
 * @text 池子
 * @desc 英文逗号分隔，如 "10,20,30" 或 "苹果,香蕉,橙子"。留空则使用默认池子。
 * @type string
 * @default
 * @arg variable
 * @text 变量ID
 * @type variable
 * @default 1
 *
 * @command DrawUniqueNumberStrict
 * @text 无放回抽取（抽完返回0）
 * @desc 抽完返回0，需手动重置
 * @arg poolString
 * @text 池子
 * @desc 英文逗号分隔，如 "10,20,30" 或 "苹果,香蕉,橙子"。留空则使用默认池子。
 * @type string
 * @default
 * @arg variable
 * @text 变量ID
 * @type variable
 * @default 1
 *
 * @command ResetPool
 * @text 重置所有抽取池
 * @desc 重置所有池的抽取状态（无需参数）
 */
(function() {
    const PLUGIN_NAME = "Huanaiyka_UniqueRandomDraw";
    const parameters = PluginManager.parameters(PLUGIN_NAME);
    const saveState = parameters['saveState'] === 'true';
    const avoidConsecutive = parameters['avoidConsecutive'] !== 'false';
    const globalAutoReset = parameters['autoResetOnEmpty'] !== 'false';
    const defaultPoolStr = parameters['defaultPool'] || '';
    
    let defaultPool = null;
    if (defaultPoolStr.trim() !== '') {
        defaultPool = parsePoolString(defaultPoolStr);
        if (!defaultPool) defaultPool = null;
    }

    function getStorage() {
        return saveState ? $gameSystem : $gameTemp;
    }

    function initStorage() {
        const storage = getStorage();
        if (!storage._uniqueDrawPools) storage._uniqueDrawPools = {};
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function regenerateRemaining(state, avoid) {
        if (!state.fullPool || state.fullPool.length === 0) return false;
        let newRemaining = state.fullPool.slice();
        shuffleArray(newRemaining);
        
        if (avoid && state.lastDrawn !== undefined && state.lastDrawn !== null) {
            if (newRemaining[0] === state.lastDrawn) {
                let swapIndex = -1;
                for (let i = 1; i < newRemaining.length; i++) {
                    if (newRemaining[i] !== state.lastDrawn) {
                        swapIndex = i;
                        break;
                    }
                }
                if (swapIndex !== -1) {
                    [newRemaining[0], newRemaining[swapIndex]] = [newRemaining[swapIndex], newRemaining[0]];
                }
            }
        }
        state.remaining = newRemaining;
        return true;
    }

    function parsePoolString(str) {
        if (!str || str.trim() === '') return null;
        const parts = str.split(',').map(s => s.trim());
        const result = [];
        for (let part of parts) {
            if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
                part = part.slice(1, -1);
            }
            const num = Number(part);
            if (!isNaN(num) && part !== '' && part.trim() !== '') {
                result.push(num);
            } else {
                result.push(part);
            }
        }
        return result.filter(item => item !== '' && item !== undefined);
    }

    window.drawUniqueNumber = function(pool, variableId, autoReset) {
        if (!Array.isArray(pool) || pool.length === 0) return;
        if (typeof variableId !== 'number' || variableId <= 0) return;

        initStorage();
        const storage = getStorage();
        const key = JSON.stringify(pool);
        let state = storage._uniqueDrawPools[key];

        if (!state) {
            state = {
                fullPool: pool.slice(),
                remaining: [],
                lastDrawn: undefined
            };
            storage._uniqueDrawPools[key] = state;
            regenerateRemaining(state, avoidConsecutive);
        }
        
        const useAutoReset = (autoReset !== undefined) ? autoReset : globalAutoReset;

        if (state.remaining.length === 0) {
            if (useAutoReset) {
                regenerateRemaining(state, avoidConsecutive);
            } else {
                $gameVariables.setValue(variableId, 0);
                return;
            }
        }

        const drawn = state.remaining.pop();
        state.lastDrawn = drawn;
        $gameVariables.setValue(variableId, drawn);
    };

    window.resetUniqueDrawPool = function(pool) {
        initStorage();
        const storage = getStorage();
        if (pool === undefined || pool === null) {
            for (let key in storage._uniqueDrawPools) {
                const st = storage._uniqueDrawPools[key];
                regenerateRemaining(st, avoidConsecutive);
            }
        } else if (Array.isArray(pool)) {
            const key = JSON.stringify(pool);
            const st = storage._uniqueDrawPools[key];
            if (st) {
                regenerateRemaining(st, avoidConsecutive);
            } else {
                storage._uniqueDrawPools[key] = {
                    fullPool: pool.slice(),
                    remaining: [],
                    lastDrawn: undefined
                };
                regenerateRemaining(storage._uniqueDrawPools[key], avoidConsecutive);
            }
        }
    };

    // 命令：自动重置模式
    PluginManager.registerCommand(PLUGIN_NAME, "DrawUniqueNumber", args => {
        const poolString = args.poolString;
        const variableId = Number(args.variable);
        if (isNaN(variableId) || variableId <= 0) return;

        let pool = null;
        if (poolString && poolString.trim() !== "") {
            pool = parsePoolString(poolString);
            if (!pool || pool.length === 0) return;
        } else {
            if (defaultPool && defaultPool.length > 0) {
                pool = defaultPool.slice();
            } else {
                return;
            }
        }
        drawUniqueNumber(pool, variableId, true);
    });

    // 命令：抽完返回0模式
    PluginManager.registerCommand(PLUGIN_NAME, "DrawUniqueNumberStrict", args => {
        const poolString = args.poolString;
        const variableId = Number(args.variable);
        if (isNaN(variableId) || variableId <= 0) return;

        let pool = null;
        if (poolString && poolString.trim() !== "") {
            pool = parsePoolString(poolString);
            if (!pool || pool.length === 0) return;
        } else {
            if (defaultPool && defaultPool.length > 0) {
                pool = defaultPool.slice();
            } else {
                return;
            }
        }
        drawUniqueNumber(pool, variableId, false);
    });

    // 重置命令：重置所有池，无需参数
    PluginManager.registerCommand(PLUGIN_NAME, "ResetPool", args => {
        resetUniqueDrawPool();
    });

    if (saveState) {
        const _Game_System_initialize = Game_System.prototype.initialize;
        Game_System.prototype.initialize = function() {
            _Game_System_initialize.call(this);
            this._uniqueDrawPools = {};
        };
    }
})();