/*:
 * @target MZ
 * @plugindesc 擂台赛模拟器
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ----------------------------------------------------------------------------
 * 本插件用于实现多轮淘汰制擂台赛：
 * 1. 从预设敌群池中按出现概率抽取指定数量作为对手。
 * 2. 每轮玩家随机与一组敌群战斗，其余敌群按基础胜率与克制关系模拟内部淘汰。
 * 3. 最终决出冠军，玩家与冠军敌群对战。
 * 4. 若玩家在中途战败，只需调用“一键决出总冠军”指令，
 *    系统将自动完成剩余模拟，合并输出所有战报，并直接返回最终冠军 ID。
 * *============================================================================
 * 推荐事件流程（先战后报）
 * ----------------------------------------------------------------------------
 * 1. 插件指令：擂台赛开始 15
 * 2. 插件指令：擂台赛下一轮 (此时仅锁定当前对手，不进行其余人模拟)
 * 3. 循环
 *      擂台赛获取对手 → 战斗处理：敌群 \V[1]
 *      胜利后 → 擂台赛显示战报 (此时会先自动模拟其余人对战，并完整显示战报)
 *      擂台赛下一轮
 *      擂台赛是否决赛 → 若决赛则跳出循环
 * 4. 最终战斗(决赛) → 结束
 * 
 * @command startArena
 * @text 擂台赛开始
 * @desc 开始新一届擂台赛，抽取敌群。
 * @arg troopCount
 * @text 敌群数量
 * @type number
 * @desc 本次擂台赛抽取的敌群数量（不含玩家）。留空则使用默认值。
 * 
 * @command nextRound
 * @text 擂台赛下一轮
 * @desc 进行下一轮：累计轮次、抽选玩家对手。（若未开启“先战后报”，会同时模拟其余人）
 * 
 * @command showReport
 * @text 擂台赛显示战报
 * @desc 显示上一轮内部模拟 of 详细战报。若开启“先战后报”且未模拟，会在此触发其余人模拟。
 * 
 * @command isFinal
 * @text 擂台赛是否决赛
 * @desc 将决赛标志（1=决赛/已决出最后1人，0=非决赛）存入指定变量。
 * 
 * @command getOpponent
 * @text 擂台赛获取对手
 * @desc 将当前需要挑战的敌群ID或最终存活的冠军NPC ID存入指定变量。
 * @arg type
 * @text 获取类型
 * @type select
 * @option ID (数字)
 * @value id
 * @option 名称 (字符串)
 * @value name
 * @default id
 * @desc 选择获取对手的ID还是名称。
 * 
 * @command getRound
 * @text 擂台赛获取轮次
 * @desc 获取当前比赛的最新轮数，并将其输出存入对应的轮次变量。
 * 
 * @command clearArena
 * @text 擂台赛清理
 * @desc [可选] 彻底清空当前擂台赛数据与系统变量。
 * 
 * @command setGuaranteedTroop
 * @text 设定必出敌群
 * @desc 强制指定某一个敌群在下一次擂台赛开启时100%出现在名单中。
 * @arg type
 * @text 指定方式
 * @type select
 * @option 固定敌群ID
 * @value ID
 * @option 通过变量指定ID
 * @value Var
 * @default ID
 * @desc 选择直接输入敌群ID，还是读取一个RMMZ变量里的数值。
 * @arg value
 * @text 敌群ID / 变量ID
 * @type number
 * @min 1
 * @default 1
 * @desc 根据上面的选择，在此输入对应的 敌群ID 或 变量ID。
 * 
 * @command autoFinishArena
 * @text 一键决出总冠军
 * @desc 【战败极简】淘汰玩家，在后台瞬间推算完所有NPC对决，并把所有剩余战报合并一次性显示出来。
 * 
 * ============================================================================
 * 参数设置
 * ============================================================================
 * @param divider_core
 * @text ====核心基础设置====
 * @desc 基础系统参数设定区域（变量、默认数量、特殊ID等）
 * 
 * @param defaultTroopCount
 * @text 默认抽取数量
 * @parent divider_core
 * @type number
 * @min 1
 * @default 15
 * @desc 每次擂台赛默认抽取的敌群数量（不含玩家）。可通过插件指令参数覆盖。
 * 
 * @param playerSymbolId
 * @text 玩家标志ID
 * @parent divider_core
 * @type number
 * @default 0
 * @desc 用于在参赛列表中代表玩家的特殊ID值。请勿与其他敌群ID冲突。
 * 
 * @param opponentVarId
 * @text 对手ID变量
 * @parent divider_core
 * @type variable
 * @default 1
 * @desc 存储当前玩家需要挑战的对手ID的RMMZ变量编号。
 * 
 * @param finalFlagVarId
 * @text 决赛标志变量
 * @parent divider_core
 * @type variable
 * @default 2
 * @desc 存储决赛状态标志的RMMZ变量编号（1=决赛，0=非决赛）。
 * 
 * @param roundVarId
 * @text 当前轮次变量
 * @parent divider_core
 * @type variable
 * @default 3
 * @desc 存储当前比赛已进行轮数的RMMZ变量编号。
 * 
 * @param battleFirstMode
 * @text 先战后报模式
 * @parent divider_core
 * @type boolean
 * @default false
 * @desc 开启后，每轮只锁定对手不立即模拟其他NPC，战报将在显示时统一生成。适合先战斗后看战报的流程。
 * 
 * @param divider_switch
 * @text ====战报显示开关====
 * 
 * @param showAutoReport
 * @text 自动显示战报
 * @parent divider_switch
 * @type boolean
 * @default false
 * @desc 开启后，每轮模拟结束会自动弹出战报消息，无需手动调用"显示战报"指令。启用“先战后报”时不建议开启。
 * 
 * @param showWinRate
 * @text 显示概率与括号
 * @parent divider_switch
 * @type boolean
 * @default false
 * @desc 在对战结果后显示括号内的胜率百分比，例如「哈罗德 获胜 (65%)」。
 * 
 * @param showMatchupLabel
 * @text 显示克制标签
 * @parent divider_switch
 * @type boolean
 * @default false
 * @desc 当存在克制关系时，在获胜者名称前显示【克制】或【被克制】标签。
 * 
 * @param showOpponentInReport
 * @text 战报中提示当前对手
 * @parent divider_switch
 * @type boolean
 * @default true
* @desc 在战报末尾追加一行提示，告知玩家本轮需要挑战的对手是谁。启用“先战后报”不建议开启。
 * 
 * @param divider_smart_calc
 * @text ====克制与胜率计算基准====
 * 
 * @param overrideBaseWinRate
 * @text 克制覆盖基础胜率
 * @type boolean
 * @default true
* @desc 开启后，若存在克制关系则直接使用克制设定的胜率覆盖双方基础胜率。关闭则改为在基础胜率上加减修正值。
 * 
 * @param winRateDisplayType
 * @text 胜率显示基准
 * @type select
 * @option 获胜者 (Winner)
 * @value Winner
 * @option 左侧选手A (Left)
 * @value Left
 * @default Winner
* @desc 在战报中显示的胜率百分比以哪一方为基准：获胜者的胜率（Winner）或固定显示左侧选手的胜率（Left）。
 * 
 * @param divider_template
 * @text ====战报文本模板====
 * 
 * @param reportHeaderFormat
 * @text 战报首段文本模板
 * @parent divider_template
 * @type string
 * @default 第 %1 轮开始！
 * @desc 常规轮次战报开始时的标题行。%1 将被替换为当前轮次数。
 * 
 * @param reportFinalHeaderFormat
 * @text 决赛战报首段文本模板
 * @parent divider_template
 * @type string
 * @default 最终决战开始！
 * @desc 决赛轮战报开始时的标题行。%1 将被替换为当前轮次数。
 * 
 * @param battleFormat
 * @text 战报对战文本模板
 * @parent divider_template
 * @type string
 * @default %1 VS %2 -> %3 获胜 %4%5
 * @desc 单场对战的战报格式。%1=左侧选手名，%2=右侧选手名，%3=获胜者名，%4=克制标签，%5=胜率百分比。
 * 
 * @param byeFormat
 * @text 战报轮空文本模板
 * @parent divider_template
 * @type string
 * @default %1 轮空，直接晋级。
 * @desc 当某选手因对手数为奇数而轮空时的显示文本。%1 将被替换为轮空选手名。
 * 
 * @param showAutoFinishHeader
 * @text 显示一键冠军首段
 * @parent divider_template
 * @type boolean
 * @default true
 * @desc 是否显示一键决出总冠军后的首段文字。
 * 
 * @param showAutoFinishWinner
 * @text 显示一键冠军获胜者
 * @parent divider_template
 * @type boolean
 * @default true
 * @desc 是否显示一键决出总冠军后的获胜者名单。
 * 
 * @param opponentFormat
 * @text 战报揭晓对手文本模板
 * @parent divider_template
 * @type string
 * @default 【提示】本轮你的对手是: %1
 * @desc 在战报末尾提示玩家当前对手的文本格式。%1 将被替换为对手名称。
 * 
 * @param autoFinishHeaderFormat
 * @text 一键冠军首段文本模板
 * @parent divider_template
 * @type string
 * @default 【最终播报】大会已决出最终总冠军！
 * @desc 玩家战败一键决出总冠军后，合并播报时显示的首段文字。
 * 
 * @param autoFinishWinnerFormat
 * @text 一键冠军获胜文本模板
 * @parent divider_template
 * @type string
 * @default 恭喜选手「%1」夺得桂冠！
 * @desc 一键决出总冠军后宣布获胜者的文字。%1 将被替换为最终冠军的名称。
 * 
 * @param divider_data
 * @text ====参赛成员与关系====
 * 
 * @param troops
 * @text 敌群列表
 * @parent divider_data
 * @type struct<Troop>[]
 * @default []
 * @desc 定义所有可参赛的敌群，每个敌群需填写ID、自定义名称、基础胜率和出现权重。
 * 
 * @param matchups
 * @text 克制关系
 * @parent divider_data
 * @type struct<Matchup>[]
 * @default []
 * @desc 定义敌群之间的克制关系列表，可指定攻击方、防御方和克制胜率。
 */

/*~struct~Troop:
 * @param id
 * @text 敌群ID
 * @type troop
 * @desc 对应RMMZ数据库中的敌群ID。
 * 
 * @param name
 * @text 自定义名称
 * @type string
 * @desc 在战报中显示的敌群名称，留空则使用数据库中的名称。
 * 
 * @param winRate
 * @text 基础胜率/战斗指数
 * @type number
 * @min 0
 * @default 50
 * @desc 该敌群的基础胜率，数值越高越强。在模拟对决中作为胜率计算的基准值。
 * 
 * @param spawnWeight
 * @text 出现权重
 * @type number
 * @decimals 4
 * @min 0.01
 * @default 10
 * @desc 该敌群在擂台赛开赛时被抽选为参赛者的相对权重。数值越大，被抽中的概率越高。
 */

/*~struct~Matchup:
 * @param attackerName
 * @text 攻击方(克制方)名称
 * @type string
 * @desc 拥有克制优势的一方敌群名称（需与敌群列表中定义的自定义名称完全匹配）。
 * 
 * @param defenderName
 * @text 防御方(被克方)名称
 * @type string
 * @desc 处于劣势、被克制的一方敌群名称（需与敌群列表中定义的自定义名称完全匹配）。
 * 
 * @param winRate
 * @text 克制胜率/指数
 * @type number
 * @min 0
 * @default 80
 * @desc 当攻击方对阵防御方时，攻击方的胜率。会根据"克制覆盖基础胜率"设置决定如何参与计算。
 */

(function() {
    const pluginName = 'Huanaiyka_ChampionshipSystem';
    const parameters = PluginManager.parameters(pluginName);
    const DEFAULT_TROOP_COUNT = Number(parameters['defaultTroopCount'] || 15);
    const PLAYER_SYMBOL = Number(parameters['playerSymbolId'] || 0);
    const OPPONENT_VAR_ID = Number(parameters['opponentVarId'] || 1);
    const FINAL_FLAG_VAR_ID = Number(parameters['finalFlagVarId'] || 2);
    const ROUND_VAR_ID = Number(parameters['roundVarId'] || 3);
    const BATTLE_FIRST_MODE = parameters['battleFirstMode'] === 'true';
    const SHOW_AUTO_REPORT = parameters['showAutoReport'] === 'true';
    
    const SHOW_AUTO_FINISH_HEADER = parameters['showAutoFinishHeader'] === 'true';
    const SHOW_AUTO_FINISH_WINNER = parameters['showAutoFinishWinner'] === 'true';

    const SHOW_WIN_RATE = parameters['showWinRate'] === 'true';
    const SHOW_MATCHUP_LABEL = parameters['showMatchupLabel'] === 'true';
    const SHOW_OPPONENT_IN_REPORT = parameters['showOpponentInReport'] === 'true';
    
    const OVERRIDE_BASE_WIN_RATE = parameters['overrideBaseWinRate'] === 'true';
    const WIN_RATE_DISPLAY_TYPE = String(parameters['winRateDisplayType'] || 'Winner');

    const REPORT_HEADER_FORMAT = String(parameters['reportHeaderFormat'] || "第 %1 轮开始！");
    const REPORT_FINAL_HEADER_FORMAT = String(parameters['reportFinalHeaderFormat'] || "最终决战开始！");
    const BATTLE_FORMAT = String(parameters['battleFormat'] || "%1 VS %2 -> %3 获胜 %4%5");
    const BYE_FORMAT = String(parameters['byeFormat'] || "%1 轮空，直接晋级。");
    const OPPONENT_FORMAT = String(parameters['opponentFormat'] || "【提示】本轮你的对手是: %1");

    // 新增：一键决出冠军自定义文本
    const AUTO_FINISH_HEADER_FORMAT = String(parameters['autoFinishHeaderFormat'] || "【最终播报】大会已决出最终总冠军！");
    const AUTO_FINISH_WINNER_FORMAT = String(parameters['autoFinishWinnerFormat'] || "恭喜选手「%1」夺得桂冠！");

    // 解析敌群列表
    const troopListRaw = JSON.parse(parameters['troops'] || '[]');
    const Roster = {};
    const SpawnWeights = {};
    const NameToIdMap = {};
    
    for (const t of troopListRaw) {
        if (!t) continue;
        const struct = JSON.parse(t);
        const id = Number(struct.id);
        if (isNaN(id)) continue;
        const customName = struct.name ? String(struct.name).trim() : '';
        Roster[id] = {
            name: customName,
            winRate: Number(struct.winRate || 50)
        };
        SpawnWeights[id] = parseFloat(struct.spawnWeight) || 10;
        if (customName) {
            NameToIdMap[customName] = id;
        }
    }
    
    function getTroopName(id) {
        if (id === PLAYER_SYMBOL) {
            return $gameParty.leader() ? $gameParty.leader().name() : '玩家';
        }
        if (Roster[id] && Roster[id].name) {
            return Roster[id].name;
        }
        if ($dataTroops && $dataTroops[id]) {
            return $dataTroops[id].name || `敌群${id}`;
        }
        return `敌群${id}`;
    }
    
    // 解析克制关系
    const MatchupBonus = {};
    const matchupRaw = JSON.parse(parameters['matchups'] || '[]');
    for (const item of matchupRaw) {
        if (!item || typeof item !== 'string') continue;
        if (item.trim().startsWith('{')) {
            try {
                const config = JSON.parse(item);
                const attackerName = config.attackerName ? String(config.attackerName).trim() : '';
                const defenderName = config.defenderName ? String(config.defenderName).trim() : '';
                const ratePercent = Number(config.winRate || 80);
                const attacker = NameToIdMap[attackerName];
                const defender = NameToIdMap[defenderName];
                if (attacker !== undefined && defender !== undefined) {
                    MatchupBonus[`${attacker},${defender}`] = ratePercent;
                }
            } catch (e) {
                console.error("解析可视化克制关系出错:", e);
            }
        } else {
            const colonIdx = item.lastIndexOf(':');
            if (colonIdx === -1) continue;
            const pair = item.substring(0, colonIdx).trim();
            const prob = parseFloat(item.substring(colonIdx+1).trim());
            if (isNaN(prob)) continue;
            const commaIdx = pair.indexOf(',');
            if (commaIdx === -1) continue;
            const attacker = parseInt(pair.substring(0, commaIdx).trim());
            const defender = parseInt(pair.substring(commaIdx+1).trim());
            if (isNaN(attacker) || isNaN(defender)) continue;
            const convertedProb = prob <= 1.0 ? prob * 100 : prob;
            MatchupBonus[`${attacker},${defender}`] = convertedProb;
        }
    }
    
    // 胜率计算核心
    function fightWithMatchup(idA, idB) {
        let rateA = Roster[idA] ? Roster[idA].winRate : 50;
        let rateB = Roster[idB] ? Roster[idB].winRate : 50;

        const key = `${idA},${idB}`;
        const revKey = `${idB},${idA}`;

        let specialTriggered = false;
        let labelAttacker = null;

        if (MatchupBonus.hasOwnProperty(key)) {
            specialTriggered = true;
            labelAttacker = idA;
            const matchupRate = MatchupBonus[key]; 
            if (OVERRIDE_BASE_WIN_RATE) {
                rateA = matchupRate;
            } else {
                rateA = Math.max(0, rateA + (matchupRate - 50));
            }
        } else if (MatchupBonus.hasOwnProperty(revKey)) {
            specialTriggered = true;
            labelAttacker = idB;
            const matchupRateRev = MatchupBonus[revKey]; 
            if (OVERRIDE_BASE_WIN_RATE) {
                rateB = matchupRateRev;
            } else {
                rateB = Math.max(0, rateB + (matchupRateRev - 50));
            }
        }

        const total = rateA + rateB;
        const finalProbA = total > 0 ? rateA / total : 0.5;

        const isAWins = Math.random() < finalProbA;
        const winner = isAWins ? idA : idB;

        return { 
            winner: winner, 
            probA: finalProbA, 
            special: specialTriggered,
            labelAttacker: labelAttacker
        };
    }
    
    let reportCache = { header: [], middle: [], footer: [] };
    function addMiddleReport(msg) { reportCache.middle.push(msg); }
    function clearReport() { 
        reportCache.header = [];
        reportCache.middle = [];
        reportCache.footer = [];
    }
    
    function fightAndReport(idA, idB) {
        const res = fightWithMatchup(idA, idB);
        const winnerId = res.winner;
        const nameA = getTroopName(idA);
        const nameB = getTroopName(idB);
        const winnerName = getTroopName(winnerId);
        
        let displayedProb = 0.5;
        let mark = '';

        const baseId = (WIN_RATE_DISPLAY_TYPE === 'Left') ? idA : winnerId;

        if (WIN_RATE_DISPLAY_TYPE === 'Left') {
            displayedProb = res.probA;
        } else {
            displayedProb = (winnerId === idA) ? res.probA : (1 - res.probA);
        }

        if (res.special) {
            if (baseId === res.labelAttacker) {
                mark = '【克制】';
            } else {
                mark = '【被克制】';
            }
        }

        const pctText = SHOW_WIN_RATE ? ` (${Math.round(displayedProb * 100)}%)` : '';
        const finalMark = SHOW_MATCHUP_LABEL ? mark : '';
        
        const reportLine = BATTLE_FORMAT
            .replace('%1', nameA)
            .replace('%2', nameB)
            .replace('%3', winnerName)
            .replace('%4', finalMark)
            .replace('%5', pctText);
            
        addMiddleReport(reportLine);
        return winnerId;
    }
    
    function simulateInternalRound(troopIds) {
        const shuffled = [...troopIds];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const winners = [];
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                winners.push(fightAndReport(shuffled[i], shuffled[i+1]));
            } else {
                const byeId = shuffled[i];
                const byeName = getTroopName(byeId);
                const reportLine = BYE_FORMAT.replace('%1', byeName);
                addMiddleReport(reportLine);
                winners.push(byeId);
            }
        }
        return winners;
    }
    
    function drawUniqueByWeight(count, weightMap, totalPoolIds, guaranteedId = null) {
        const result = [];
        const available = [...totalPoolIds];

        if (guaranteedId !== null && available.includes(guaranteedId)) {
            result.push(guaranteedId);
            const index = available.indexOf(guaranteedId);
            available.splice(index, 1);
        }

        let weights = available.map(id => weightMap[id] || 1);
        const remainingCount = count - result.length;

        for (let i = 0; i < remainingCount && available.length > 0; i++) {
            let totalWeight = weights.reduce((a,b) => a+b, 0);
            if (totalWeight <= 0) break;
            let rand = Math.random() * totalWeight;
            let accum = 0;
            let selectedIdx = 0;
            for (let j = 0; j < available.length; j++) {
                accum += weights[j];
                if (rand <= accum) {
                    selectedIdx = j;
                    break;
                }
            }
            const selected = available[selectedIdx];
            result.push(selected);
            available.splice(selectedIdx, 1);
            weights.splice(selectedIdx, 1);
        }
        return result;
    }
    
    const tempKey = '_arenaTournament';
    function getState() {
        if (!$gameSystem) return {};
        if (!$gameSystem[tempKey]) {
            $gameSystem[tempKey] = {
                participants: [],
                isFinal: false,
                currentOpponent: -1,
                initialized: false,
                currentRound: 0,
                reportCache: { header: [], middle: [], footer: [] },
                pendingEnemies: [], 
                hasSimulatedThisRound: false,
                guaranteedTroopId: null 
            };
        }
        return $gameSystem[tempKey];
    }

    function setGuaranteedTroop(id) {
        const state = getState();
        state.guaranteedTroopId = Number(id);
    }
    
    function startTournament(troopCount) {
        const count = troopCount || DEFAULT_TROOP_COUNT;
        const allTroopIds = Object.keys(Roster).map(Number);
        if (allTroopIds.length === 0) {
            console.warn("擂台赛插件：未配置任何敌群，无法开始。");
            return false;
        }
        const state = getState();
        const guaranteed = state.guaranteedTroopId;

        const actualCount = Math.min(count, allTroopIds.length);
        const drawn = drawUniqueByWeight(actualCount, SpawnWeights, allTroopIds, guaranteed);
        
        const participants = [PLAYER_SYMBOL, ...drawn];
        state.participants = participants;
        state.isFinal = false;
        state.currentOpponent = -1;
        state.currentRound = 0;
        clearReport();
        state.reportCache = { header: [], middle: [], footer: [] };
        state.pendingEnemies = [];
        state.hasSimulatedThisRound = false;
        state.initialized = true;
        
        state.guaranteedTroopId = null;
        $gameVariables.setValue(ROUND_VAR_ID, 0);
        return true;
    }
    
    function clearTournament() {
        const state = getState();
        state.participants = [];
        state.isFinal = false;
        state.currentOpponent = -1;
        state.currentRound = 0;
        clearReport();
        state.reportCache = { header: [], middle: [], footer: [] };
        state.pendingEnemies = [];
        state.hasSimulatedThisRound = false;
        state.initialized = false;
        state.guaranteedTroopId = null;
        $gameVariables.setValue(OPPONENT_VAR_ID, 0);
        $gameVariables.setValue(FINAL_FLAG_VAR_ID, 0);
        $gameVariables.setValue(ROUND_VAR_ID, 0);
    }

    function eliminatePlayer() {
        const state = getState();
        if (!state.initialized) return;
        state.participants = state.participants.filter(id => id !== PLAYER_SYMBOL);
        state.currentOpponent = -1;
    }

// 战败后一键推算 (修正版：保留玩家当前对手进入模拟)
function autoFinishTournament(interpreter) {
        const state = getState();
        if (!state.initialized) return;

        // 1. 确保有对手
        if (state.currentOpponent === -1) return;

        // 2. 准备：将轮次强行设定为“下一轮”，或者如果还没开始则从1开始
        // 这样可以确保战报从当前该进行的轮次开始记录
        let currentRound = (state.currentRound || 0);
        state.currentRound = currentRound;

        // 3. 构建战报容器
        const combinedMiddle = [];
        
        // 4. 记录玩家这一场的战斗（作为第一场对局）
        const nameA = getTroopName(PLAYER_SYMBOL);
        const nameB = getTroopName(state.currentOpponent);
        const playerBattleLine = BATTLE_FORMAT
            .replace('%1', nameA)
            .replace('%2', nameB)
            .replace('%3', nameB)
            .replace('%4', '')
            .replace('%5', '');
        
        // 这一轮的开始标题
        const headerTemplate = (state.participants.length <= 2) ? REPORT_FINAL_HEADER_FORMAT : REPORT_HEADER_FORMAT;
        combinedMiddle.push(`\n=== ${headerTemplate.replace('%1', currentRound)} ===`);
        combinedMiddle.push(playerBattleLine);

        // 5. 模拟剩下的对手对决
        const remainingNpcs = state.participants.filter(id => id !== PLAYER_SYMBOL && id !== state.currentOpponent);
        // 先进行当前轮剩余的 NPC 对战
        const roundWinners = simulateInternalRound(remainingNpcs);
        combinedMiddle.push(...reportCache.middle); // 把剩下的对决也加上
        
        // 更新当前参与者名单（包含玩家那场获胜的 NPC）
        let participants = [state.currentOpponent, ...roundWinners];
        state.participants = participants;

        // 6. 如果还没决出冠军，继续后续轮次
        while (participants.length > 1) {
            currentRound++;
            state.currentRound = currentRound;
            reportCache.middle = []; 
            
            participants = simulateInternalRound(participants);
            state.participants = participants;
            state.isFinal = (participants.length === 1);

            const hTpl = state.isFinal ? REPORT_FINAL_HEADER_FORMAT : REPORT_HEADER_FORMAT;
            combinedMiddle.push(`\n=== ${hTpl.replace('%1', currentRound)} ===`);
            combinedMiddle.push(...reportCache.middle);
        }

        // 7. 保存最终状态
state.isFinal = true;
        $gameVariables.setValue(ROUND_VAR_ID, currentRound);
        $gameVariables.setValue(FINAL_FLAG_VAR_ID, 1);
        const finalWinner = participants[0];
        $gameVariables.setValue(OPPONENT_VAR_ID, finalWinner);

        // 使用刚才在第1步定义的开关进行判断
        const footerLines = [];
        if (SHOW_AUTO_FINISH_HEADER) footerLines.push(AUTO_FINISH_HEADER_FORMAT);
        if (SHOW_AUTO_FINISH_WINNER) footerLines.push(AUTO_FINISH_WINNER_FORMAT.replace('%1', getTroopName(finalWinner)));

        state.reportCache = {
            header: [],
            middle: combinedMiddle,
            footer: footerLines
        };

        showReportAndAwait(interpreter);
    }

    function advanceToNextRound(interpreter) {
        const state = getState();
        let participants = state.participants;
        if (!state.initialized || !participants || participants.length < 2) {
            console.warn("擂台赛未开始或已结束。");
            return -1;
        }
        
        const enemies = participants.filter(id => id !== PLAYER_SYMBOL);
        if (enemies.length === 0) return -1;
        
        state.currentRound = (state.currentRound || 0) + 1;
        $gameVariables.setValue(ROUND_VAR_ID, state.currentRound);

        const oppIndex = Math.floor(Math.random() * enemies.length);
        const playerOpponent = enemies[oppIndex];
        
        const remainingEnemies = enemies.filter((_, idx) => idx !== oppIndex);
        
        clearReport();

        if (BATTLE_FIRST_MODE) {
            state.pendingEnemies = remainingEnemies;
            state.hasSimulatedThisRound = false;
            
            const headerTemplate = (remainingEnemies.length === 0) ? REPORT_FINAL_HEADER_FORMAT : REPORT_HEADER_FORMAT;
            const headerText = headerTemplate.replace('%1', state.currentRound);
            reportCache.header.push(headerText);
            
            const opponentName = getTroopName(playerOpponent);
            if (SHOW_OPPONENT_IN_REPORT) {
                const oppHint = OPPONENT_FORMAT.replace('%1', opponentName);
                const lines = oppHint.split('\\n');
                for (const line of lines) {
                    reportCache.footer.push(line);
                }
            }
            state.reportCache = JSON.parse(JSON.stringify(reportCache));
        } else {
            const nextEnemies = simulateInternalRound(remainingEnemies);
            const nextParticipants = [PLAYER_SYMBOL, ...nextEnemies];
            state.participants = nextParticipants;
            state.isFinal = (nextParticipants.length === 1);
            
            const headerTemplate = state.isFinal ? REPORT_FINAL_HEADER_FORMAT : REPORT_HEADER_FORMAT;
            const headerText = headerTemplate.replace('%1', state.currentRound);
            reportCache.header.push(headerText);
            
            const opponentName = getTroopName(playerOpponent);
            if (SHOW_OPPONENT_IN_REPORT) {
                const oppHint = OPPONENT_FORMAT.replace('%1', opponentName);
                const lines = oppHint.split('\\n');
                for (const line of lines) {
                    reportCache.footer.push(line);
                }
            }
            state.reportCache = JSON.parse(JSON.stringify(reportCache));
        }
        
        state.currentOpponent = playerOpponent;
        
        if (SHOW_AUTO_REPORT && interpreter && !BATTLE_FIRST_MODE) {
            showReportAndAwait(interpreter);
        }
        return playerOpponent;
    }

    function executePendingSimulation() {
        const state = getState();
        if (!BATTLE_FIRST_MODE || state.hasSimulatedThisRound) return;

        clearReport();

        if (state.currentOpponent !== -1) {
            const playerId = PLAYER_SYMBOL;
            const opponentId = state.currentOpponent;
            
            const nameA = getTroopName(playerId);      
            const nameB = getTroopName(opponentId);   
            const winnerName = nameA;                 
            
            const playerBattleLine = BATTLE_FORMAT
                .replace('%1', nameA)
                .replace('%2', nameB)
                .replace('%3', winnerName)
                .replace('%4', '')
                .replace('%5', '');
                
            addMiddleReport(playerBattleLine);
        }

        const nextEnemies = simulateInternalRound(state.pendingEnemies || []);
        const nextParticipants = [PLAYER_SYMBOL, ...nextEnemies];
        state.participants = nextParticipants;
        state.isFinal = (nextParticipants.length === 1);

        $gameVariables.setValue(FINAL_FLAG_VAR_ID, state.isFinal ? 1 : 0);

        const headerTemplate = state.isFinal ? REPORT_FINAL_HEADER_FORMAT : REPORT_HEADER_FORMAT;
        const headerText = headerTemplate.replace('%1', state.currentRound);
        
        const finalCache = {
            header: [headerText],
            middle: [...reportCache.middle],
            footer: [] 
        };

        state.reportCache = finalCache;
        state.hasSimulatedThisRound = true;
    }
    
    function showReportAndAwait(interpreter) {
        const state = getState();
        if (BATTLE_FIRST_MODE && !state.hasSimulatedThisRound && state.participants.includes(PLAYER_SYMBOL)) {
            executePendingSimulation();
        }

        const cache = state.reportCache || { header: [], middle: [], footer: [] };
        let hasContent = false;

        if (cache.header && cache.header.length > 0) {
            for (const line of cache.header) {
                $gameMessage.add(line);
            }
            hasContent = true;
        }

        if (cache.middle && cache.middle.length > 0) {
            if (hasContent) $gameMessage.newPage();
            for (const line of cache.middle) {
                $gameMessage.add(line);
            }
            hasContent = true;
        }

        if (cache.footer && cache.footer.length > 0) {
            if (hasContent) $gameMessage.newPage();
            for (const line of cache.footer) {
                $gameMessage.add(line);
            }
        }

        if (interpreter) {
            interpreter.setWaitMode('message');
        }
    }
    
function getCurrentOpponent(returnType) {
    const state = getState();
    let id = -1;
    
    if (!state.participants.includes(PLAYER_SYMBOL)) {
        id = state.participants[0] || -1;
    } else {
        id = state.currentOpponent || -1;
    }
    
    // 如果 returnType 是 'name'，返回名称；否则返回 ID
    if (returnType === 'name') {
        return id === -1 ? '无对手' : getTroopName(id);
    }
    return id;
}
    
    function isFinalRound() {
        const state = getState();
        const pCount = state.participants ? state.participants.length : 0;
        
        if (!state.participants.includes(PLAYER_SYMBOL)) {
            return pCount <= 1 ? 1 : 0;
        }

        if (BATTLE_FIRST_MODE && !state.hasSimulatedThisRound) {
            const enemies = (state.participants || []).filter(id => id !== PLAYER_SYMBOL);
            if (enemies.length <= 1) return 1;
            return 0;
        }
        return state.isFinal ? 1 : 0;
    }

    function getRoundCount() {
        return getState().currentRound || 0;
    }
    
    // ============================================================================
    // 注册插件指令 (保持极简与新排序)
    // ============================================================================
    PluginManager.registerCommand(pluginName, 'startArena', args => {
        let count = DEFAULT_TROOP_COUNT;
        if (args.troopCount && !isNaN(parseInt(args.troopCount))) {
            count = parseInt(args.troopCount);
        }
        startTournament(count);
    });

    PluginManager.registerCommand(pluginName, 'nextRound', function() {
        const opp = advanceToNextRound(this);
        if (opp !== -1 && opp !== undefined) $gameVariables.setValue(OPPONENT_VAR_ID, opp);
        $gameVariables.setValue(FINAL_FLAG_VAR_ID, isFinalRound());
    });
    
    PluginManager.registerCommand(pluginName, 'showReport', function() {
        showReportAndAwait(this);
    });

    PluginManager.registerCommand(pluginName, 'isFinal', () => {
        $gameVariables.setValue(FINAL_FLAG_VAR_ID, isFinalRound());
    });
    
PluginManager.registerCommand(pluginName, 'getOpponent', args => {
    const returnType = args.type || 'id';
    const result = getCurrentOpponent(returnType);
    $gameVariables.setValue(OPPONENT_VAR_ID, result);
});

    PluginManager.registerCommand(pluginName, 'getRound', () => {
        $gameVariables.setValue(ROUND_VAR_ID, getRoundCount());
    });
    
    PluginManager.registerCommand(pluginName, 'clearArena', () => {
        clearTournament();
    });

    PluginManager.registerCommand(pluginName, 'setGuaranteedTroop', args => {
        const isVar = args.type === 'Var';
        const rawVal = Number(args.value || 1);
        const targetId = isVar ? $gameVariables.value(rawVal) : rawVal;
        setGuaranteedTroop(targetId);
    });

    PluginManager.registerCommand(pluginName, 'autoFinishArena', function() {
        autoFinishTournament(this);
    });
    
    // ============================================================================
    // 兼容旧式手动输入指令
    // ============================================================================
    const _GameInterpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        if (command === '擂台赛开始') {
            let count = DEFAULT_TROOP_COUNT;
            if (args.length > 0) {
                const parsed = parseInt(args[0]);
                if (!isNaN(parsed)) count = parsed;
            }
            startTournament(count);
            return;
        }
        if (command === '擂台赛下一轮') {
            const opp = advanceToNextRound(this);
            if (opp !== -1 && opp !== undefined) $gameVariables.setValue(OPPONENT_VAR_ID, opp);
            $gameVariables.setValue(FINAL_FLAG_VAR_ID, isFinalRound());
            return;
        }
        if (command === '擂台赛显示战报') {
            showReportAndAwait(this);
            return;
        }
        if (command === '擂台赛是否决赛') {
            $gameVariables.setValue(FINAL_FLAG_VAR_ID, isFinalRound());
            return;
        }
if (command === '擂台赛获取对手') {
    // 检查第二个参数：如果包含 'name' 或 '名字' 则返回名称
    const returnType = (args.length > 0 && (args[0] === 'name' || args[0] === '名字')) ? 'name' : 'id';
    const result = getCurrentOpponent(returnType);
    $gameVariables.setValue(OPPONENT_VAR_ID, result);
    return;
}
        if (command === '擂台赛获取轮次') {
            $gameVariables.setValue(ROUND_VAR_ID, getRoundCount());
            return;
        }
        if (command === '擂台赛清理' || command === '擂台赛重置') {
            clearTournament();
            return;
        }
        if (command === '擂台赛设定必出' || command === '设定必出敌群') {
            if (args.length > 0) {
                const targetId = parseInt(args[0]);
                if (!isNaN(targetId)) setGuaranteedTroop(targetId);
            }
            return;
        }
        if (command === '一键决出总冠军' || command === '一键推算') {
            autoFinishTournament(this);
            return;
        }
        _GameInterpreter_pluginCommand.call(this, command, args);
    };
    
    window.ArenaTournament = {
        start: startTournament,
        nextRound: advanceToNextRound,
        showReport: showReportAndAwait,
        isFinal: isFinalRound,
        getOpponent: getCurrentOpponent,
        getRoundCount: getRoundCount,
        clear: clearTournament,
        setGuaranteed: setGuaranteedTroop,
        autoFinish: autoFinishTournament,
        getRoster: () => Roster,
        getTroopName: getTroopName,
        executeSimulation: executePendingSimulation
    };
})();