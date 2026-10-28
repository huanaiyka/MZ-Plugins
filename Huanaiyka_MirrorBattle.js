/*:
 * @target MZ
 * @plugindesc 镜像战斗：将队伍成员复制为敌人并开战
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 功能
 * ============================================================================
 * 读取队伍成员，复制其属性、技能、装备技能、特性，生成为敌人数据。
 *
 * 两种用法：
 *   1. MirrorBattle start    ：生成敌人并立即开战（临时敌群）。
 *   2. MirrorBattle generate ：仅生成敌人数据，不开战。
 *      之后可正常把对应敌人 ID 编入敌群，用游戏原生遇敌流程战斗。
 *
 * ============================================================================
 * 插件指令
 * ============================================================================
 * MirrorBattle start count:4 startId:10000
 *   生成敌人并立即开战。
 *     count   ：取队伍前几名角色（0 = 全部）
 *     startId ：生成的敌人起始 ID（默认 10000）
 *
 * MirrorBattle generate count:4 startId:10000 troopId:1
 *   仅生成敌人数据，不开始战斗。
 *   生成后，可把 startId 起的敌人 ID 正常编入敌群。
 *     count   ：取队伍前几名角色（0 = 全部）
 *     startId ：生成的敌人起始 ID（默认 10000）
 *     troopId ：要覆盖成员的敌群 ID（0 = 不覆盖任何敌群）
 *               覆盖行为受参数 OverwriteTroopMembers 控制。
 *
 * MirrorBattle abort
 *   中止当前镜像战斗流程（一般不需要手动调用）。
 *
 * ============================================================================
 * 插件参数
 * ============================================================================
 * NamePrefix
 *   敌人名称前缀，默认“敌·”。最终名称为：前缀 + 角色名 + 后缀。
 *
 * NameSuffix
 *   敌人名称后缀，默认为空。
 *
 * BattlerNameMap
 *   角色名 → 战斗图名的映射，每行一条，格式：角色名=战斗图名。
 *   角色名必须与 actor.name() 完全一致（含空格与标点）。
 *   战斗图名不含 .png；误写 .png 会被自动去掉。
 *   未列出的角色使用 Goblin（哥布林）战斗图。
 *
 * OverwriteTroopMembers
 *   是否用生成的敌人覆盖指定敌群原有成员，默认开启。
 *   仅在 generate 指令带 troopId 时生效。
 *
 * ============================================================================
 * 使用示例
 * ============================================================================
 * 【例1】仅生成敌人，之后原生遇敌
 *   MirrorBattle generate count:4 startId:10000
 *   效果：
 *     队伍前 4 名角色生成敌人 10000～10003，写入 $dataEnemies。
 *     在数据库敌群里加入 10000～10003，正常遇敌即可战斗。
 *
 * 【例2】生成敌人并覆盖 1 号敌群成员
 *   MirrorBattle generate count:4 startId:10000 troopId:1
 *   效果：
 *     生成 10000～10003，并把 1 号敌群的成员替换为这四个敌人。
 *
 * 【例3】生成并立即开战
 *   MirrorBattle start count:4 startId:10000
 *
 * 【例4】自定义命名与战斗图
 *   NamePrefix = 镜像·
 *   NameSuffix =（复制体）
 *   BattlerNameMap =
 *     勇者=Hero
 *     法师=Mage
 *
 * @command start
 * @text 开始镜像战斗
 * @desc 读取队伍成员生成敌人并立即开始战斗。
 *
 * @arg count
 * @text 角色数量
 * @type number
 * @min 0
 * @default 4
 * @desc 取队伍前几名角色（0 = 全部）。
 *
 * @arg startId
 * @text 起始敌人ID
 * @type number
 * @min 1
 * @default 10000
 * @desc 生成的敌人起始 ID。
 *
 * @command generate
 * @text 仅生成敌人
 * @desc 读取队伍成员生成敌人数据，不开始战斗。之后可正常编入敌群。
 *
 * @arg count
 * @text 角色数量
 * @type number
 * @min 0
 * @default 4
 * @desc 取队伍前几名角色（0 = 全部）。
 *
 * @arg startId
 * @text 起始敌人ID
 * @type number
 * @min 1
 * @default 10000
 * @desc 生成的敌人起始 ID。
 *
 * @arg troopId
 * @text 覆盖敌群ID
 * @type number
 * @min 0
 * @default 0
 * @desc 要覆盖成员的敌群 ID（0 = 不覆盖）。
 *
 * @param NamePrefix
 * @text 名称前缀
 * @type string
 * @default 敌·
 * @desc 敌人名称前缀，最终名称为：前缀 + 角色名 + 后缀。
 *
 * @param NameSuffix
 * @text 名称后缀
 * @type string
 * @default 
 * @desc 敌人名称后缀，默认为空。
 *
 * @param BattlerNameMap
 * @text 角色战斗图映射
 * @type note
 * @default ""
 * @desc 每行一条，格式：角色名=战斗图名。未列出的角色使用 Goblin。例如：勇者=Hero
 *
 * @param OverwriteTroopMembers
 * @text 覆盖敌群成员
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default true
 * @desc 是否用生成的敌人覆盖指定敌群原有成员。默认开启。
 */

(() => {
    const pluginName = "Huanaiyka_MirrorBattle";
    const params = PluginManager.parameters(pluginName);

    const NAME_PREFIX = params["NamePrefix"] !== undefined ? String(params["NamePrefix"]) : "敌·";
    const NAME_SUFFIX = params["NameSuffix"] !== undefined ? String(params["NameSuffix"]) : "";
    const DEFAULT_BATTLER_NAME = "Goblin";
    const DEFAULT_START_ID = 10000;
    const OVERWRITE_TROOP_MEMBERS = params["OverwriteTroopMembers"] !== "false";

    function parseBattlerNameMap(text) {
        const map = {};
        if (!text) return map;
        const lines = String(text).split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("//")) continue;
            const idx = trimmed.indexOf("=");
            if (idx <= 0) continue;
            const name = trimmed.slice(0, idx).trim();
            let battler = trimmed.slice(idx + 1).trim();
            battler = battler.replace(/\.png$/i, "");
            if (name && battler) map[name] = battler;
        }
        return map;
    }

    const BATTLER_NAME_MAP = parseBattlerNameMap(params["BattlerNameMap"]);

    function normalizeParams(p) {
        const arr = (p || []).map(v => Math.round(v));
        while (arr.length < 8) arr.push(0);
        return arr.slice(0, 8);
    }

    function getBattlerName(actorName) {
        if (BATTLER_NAME_MAP[actorName]) return BATTLER_NAME_MAP[actorName];
        return DEFAULT_BATTLER_NAME;
    }

    function buildEnemyName(actorName) {
        return NAME_PREFIX + actorName + NAME_SUFFIX;
    }

    function extractSkillIds(traits) {
        const ids = [];
        for (const t of traits) {
            if (t && t.code === 43 && typeof t.dataId === "number" && t.dataId > 0) {
                if (!ids.includes(t.dataId)) ids.push(t.dataId);
            }
        }
        return ids;
    }

    function buildActions(skillIds) {
        const actions = [
            { skillId: 1, rating: 3, conditionType: 0, conditionParam1: 0, conditionParam2: 0 }
        ];
        for (const sid of skillIds) {
            if (sid === 1) continue;
            actions.push({ skillId: sid, rating: 5, conditionType: 0, conditionParam1: 0, conditionParam2: 0 });
        }
        return actions;
    }

    // 生成敌人数据并写入 $dataEnemies，返回敌人 id 数组
    function buildMirrorEnemies(count, startId) {
        const party = $gameParty.members();
        const limitedParty = count > 0 ? party.slice(0, count) : party.slice();

        let enemies = [];
        let id = startId;

        for (let idx = 0; idx < limitedParty.length; idx++) {
            const actor = limitedParty[idx];
            const traits = actor.allTraits().filter(t => ![41, 51, 52, 53].includes(t.code));

            const skills = actor.skills();
            for (const sid of skills) {
                if (!traits.some(t => t.code === 43 && t.dataId === sid)) {
                    traits.push({ code: 43, dataId: sid, value: 0 });
                }
            }

            const skillIds = extractSkillIds(traits);
            const actions = buildActions(skillIds);
            const actorName = actor.name();

            enemies.push({
                id: id++,
                name: buildEnemyName(actorName),
                level: actor._level || 1,
                params: [actor.mhp, actor.mmp, actor.atk, actor.def, actor.mat, actor.mdf, actor.agi, actor.luk],
                exp: 0, gold: 0, dropItems: [],
                actions: actions,
                battlerName: getBattlerName(actorName),
                traits: traits,
                note: ""
            });
        }

        const result = [];
        let cur = startId;
        for (let i = 0; i < enemies.length; i++) {
            const src = enemies[i];
            const name = src.name || "未命名";
            const params = normalizeParams(src.params);
            const battlerName = src.battlerName || DEFAULT_BATTLER_NAME;
            const battlerHue = 0;
            const exp = 0;
            const gold = 0;
            const level = src.level || 1;
            const levelTag = `<level:${level}>`;
            const note = levelTag;

            const dropItems = [
                { kind: 0, dataId: 0, denominator: 1 },
                { kind: 0, dataId: 0, denominator: 1 },
                { kind: 0, dataId: 0, denominator: 1 }
            ];

            let actions = src.actions;
            if (!actions || actions.length === 0) {
                actions = [{ skillId: 1, rating: 1, conditionType: 0, conditionParam1: 0, conditionParam2: 0 }];
            }

            let traits = Array.isArray(src.traits) ? src.traits : [];
            const invalidCodes = [41, 51, 52, 53];
            traits = traits.filter(t => t && typeof t === "object" && !invalidCodes.includes(t.code));
            for (const t of traits) {
                if (t.dataId && typeof t.dataId === "object") {
                    if ("id" in t.dataId && typeof t.dataId.id === "number") t.dataId = t.dataId.id;
                    else if (Array.isArray(t.dataId) && t.dataId.length > 0 && typeof t.dataId[0] === "number") t.dataId = t.dataId[0];
                    else t.dataId = 0;
                }
                if (typeof t.dataId !== "number") t.dataId = 0;
            }
            const map = new Map();
            for (const t of traits) {
                const key = t.code + "-" + t.dataId;
                if (!map.has(key) || t.value > map.get(key).value) map.set(key, { ...t });
            }
            traits = Array.from(map.values());
            traits.sort((a, b) => a.code - b.code || a.dataId - b.dataId);
            traits = traits.filter(t => t.code !== 14);

            result.push({
                id: cur++,
                actions, battlerHue, battlerName, dropItems, exp, traits, gold, name, note, params
            });
        }

        result.forEach(enemy => {
            if (!enemy.meta) {
                enemy.meta = {};
                if (enemy.note) {
                    const match = enemy.note.match(/<level:\s*(\d+)>/i);
                    if (match) enemy.meta.level = match[1];
                }
            }
            $dataEnemies[enemy.id] = enemy;
            if (typeof DataManager.extractMetadata === "function") {
                DataManager.extractMetadata(enemy);
            }
        });

        return result.map(e => e.id);
    }

    // 用生成的敌人覆盖指定敌群成员
    function overwriteTroopMembers(troopId, enemyIds) {
        if (!troopId || troopId <= 0) return;
        const troop = $dataTroops[troopId];
        if (!troop) {
            console.warn("[MirrorBattle] 找不到敌群 ID:", troopId);
            return;
        }
        const width = Graphics.width || 816;
        const height = Graphics.height || 624;
        const xStep = Math.floor(width / (enemyIds.length + 1));
        troop.members = enemyIds.map((enemyId, index) => ({
            enemyId: enemyId,
            x: xStep * (index + 1),
            y: Math.floor(height * 0.6),
            hidden: false
        }));
        console.log("[MirrorBattle] 已覆盖敌群", troopId, "成员为:", enemyIds.join(", "));
    }

    // 仅生成敌人，不开战
    function generateMirrorEnemies(count, startId, troopId) {
        const ids = buildMirrorEnemies(count, startId);
        if (typeof EnemyLevelManager !== "undefined" && EnemyLevelManager.setup) {
            EnemyLevelManager.setup();
        }
        if (OVERWRITE_TROOP_MEMBERS && troopId > 0) {
            overwriteTroopMembers(troopId, ids);
        }
        console.log("[MirrorBattle] 已生成敌人 ID:", ids.join(", "));
        return ids;
    }

    // 生成敌人并立即开战（临时敌群）
    function startMirrorBattle(count, startId) {
        const enemyIds = buildMirrorEnemies(count, startId);
        if (enemyIds.length === 0) {
            console.warn("[MirrorBattle] 队伍为空，无法开始镜像战斗。");
            return;
        }

        if (typeof EnemyLevelManager !== "undefined" && EnemyLevelManager.setup) {
            EnemyLevelManager.setup();
        }

        const tempTroopId = $dataTroops.length;
        const width = Graphics.width || 816;
        const height = Graphics.height || 624;
        const xStep = Math.floor(width / (enemyIds.length + 1));

        const members = enemyIds.map((enemyId, index) => ({
            enemyId: enemyId,
            x: xStep * (index + 1),
            y: Math.floor(height * 0.6),
            hidden: false
        }));

        $dataTroops[tempTroopId] = {
            id: tempTroopId,
            name: "Mirror_Battle",
            members: members,
            pages: [{
                conditions: {
                    actorHp: 50, actorId: 1, enemyHp: 50, enemyIndex: 0,
                    switchId: 1, switchValid: false, turnA: 0, turnB: 0,
                    turnEnding: false, turnValid: false
                },
                list: [{ code: 0, indent: 0, parameters: [] }],
                span: 0
            }]
        };

        BattleManager.setup(tempTroopId, true, true);
        $gamePlayer.makeEncounterCount();
        SceneManager.push(Scene_Battle);
    }

    PluginManager.registerCommand(pluginName, "start", args => {
        const count = Number(args.count) || 0;
        const startId = Number(args.startId) || DEFAULT_START_ID;
        startMirrorBattle(count, startId);
    });

    PluginManager.registerCommand(pluginName, "generate", args => {
        const count = Number(args.count) || 0;
        const startId = Number(args.startId) || DEFAULT_START_ID;
        const troopId = Number(args.troopId) || 0;
        generateMirrorEnemies(count, startId, troopId);
    });

    PluginManager.registerCommand(pluginName, "abort", () => {
        // 预留：中止流程。当前实现无需额外清理。
    });
})();