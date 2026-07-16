/*:
 * @target MZ
 * @plugindesc [v1.3] 智能敌人伪装与对话同步系统 (可视化选择版)
 * @author 智能助手
 * 
 * @param disguiseVarId
 * @text 伪装目标ID变量
 * @type variable
 * @desc 存储了“当前伪装目标ID”的全局变量（对应下方列表配置的伪装ID）。
 * @default 15
 * 
 * @param disguiseList
 * @text 伪装对象列表
 * @type struct<DisguiseTarget>[]
 * @desc 在这里统一配置所有伪装/变身对象的数据。完全独立，不占用任何原本的数据库槽位。
 * @default []
 * 
 * @help
 * ■ 核心功能：
 * 1. 在插件参数中“一站式”配置所有伪装角色的名字、战斗图（支持直观选择文件）和对话框头像。
 * 2. 数据库不需要添加任何多余敌人，只需用一个变量（如15号变量）指定伪装列表中的“伪装ID”即可。
 * 3. 战斗中自动寻找带有 <disguiser> 标签的敌人，并根据该变量瞬间完成变身。
 *
 * ■ 数据库设置 (Notetags)：
 * 1. 在“伪装者（如宝箱怪）”的注释框中输入标签以识别它：
 *    <disguiser>
 * 
 * 2. 在“伪装者”的注释框中，还可以绑定它显露本体（解除伪装）后的对话头像：
 *    <face: 图像文件名, 头像索引>
 *    例如： <face: Monster, 3>  （代表显露本体时，使用 img/faces/Monster.png 的第4张头像）
 * 
 * ■ 插件指令：
 * 1. 【设置/激活伪装】 (setupDisguise)
 *    让战斗中带有 <disguiser> 标签的敌人变成当前变量指定形态的形象。
 * 
 * 2. 【解除伪装】 (clearDisguise)
 *    让它们瞬间恢复本体（如宝箱怪），战斗图和对话框也同步变回本体。
 * 
 * 3. 【特定敌人发言】 (enemySpeak)
 *    让这个伪装者说话。它会自动检测自己目前是“变身状态”还是“本体状态”：
 *    - 变身状态下：自动使用你在参数里配好的名字、头像。
 *    - 本体状态下：自动使用数据库本体怪物的名字，以及本体注释里的 <face> 头像。
 *
 * @command setupDisguise
 * @text 激活伪装
 * @desc 激活战斗中伪装者的变身状态（默认进入战斗即自动激活）。
 *
 * @command clearDisguise
 * @text 解除伪装（显露本体）
 * @desc 解除伪装者的变身，使其瞬间恢复原本的样貌和名字。
 *
 * @command enemySpeak
 * @text 伪装者发言
 * @desc 让伪装者（或显露本体后的它）说话，名字和头像将自动完美同步。
 *
 * @arg text
 * @text 对话文本
 * @type note
 * @desc 要说的话。支持换行和各种常用转义字符。
 * @default 嗷嗷！
 *
 * @arg background
 * @text 窗口背景
 * @type select
 * @option 窗口
 * @value 0
 * @option 调暗
 * @value 1
 * @option 透明
 * @value 2
 * @default 0
 *
 * @arg positionType
 * @text 窗口位置
 * @type select
 * @option 上
 * @value 0
 * @option 中
 * @value 1
 * @option 下
 * @value 2
 * @default 2
 */

/*~struct~DisguiseTarget:
 * @param id
 * @text 伪装ID
 * @type number
 * @min 1
 * @max 999999
 * @desc 对应变量里存储的数字值（必须大于0且唯一）。
 * @default 1
 * 
 * @param name
 * @text 伪装名称
 * @type string
 * @desc 变身状态下，战斗画面、状态栏以及对话框中显示的名字。
 * @default 史莱姆
 * 
 * @param battlerName
 * @text 普通战斗图 (FV)
 * @type file
 * @dir img/enemies
 * @desc 传统正面战斗模式下敌人的贴图文件。点击可直接在 img/enemies 中选择。
 * 
 * @param svBattlerName
 * @text 侧视战斗图 (SV)
 * @type file
 * @dir img/sv_enemies
 * @desc 侧视战斗模式下敌人的贴图文件。点击可直接在 img/sv_enemies 中选择。
 * 
 * @param hue
 * @text 战斗图色调 (Hue)
 * @type number
 * @min 0
 * @max 360
 * @desc 战斗图的色彩偏置值。
 * @default 0
 * 
 * @param faceName
 * @text 对话头像图片名
 * @type file
 * @dir img/faces
 * @desc 处于该伪装状态下，使用“伪装者发言”指令时弹出的头像文件名。
 * 
 * @param faceIndex
 * @text 对话头像索引
 * @type number
 * @min 0
 * @max 7
 * @desc 头像格子索引（0-7）。
 * @default 0
 */

(() => {
    const pluginName = "Huanaiyka_EnemyTransformDynamic";
    const parameters = PluginManager.parameters(pluginName);
    const disguiseVarId = Number(parameters["disguiseVarId"] || 15);

    let disguiseList = [];
    try {
        const rawList = parameters["disguiseList"];
        if (rawList) {
            const parsedArray = JSON.parse(rawList);
            disguiseList = parsedArray.map(itemStr => {
                const item = JSON.parse(itemStr);
                return {
                    id: Number(item.id || 0),
                    name: String(item.name || ""),
                    battlerName: String(item.battlerName || ""),
                    svBattlerName: String(item.svBattlerName || ""),
                    hue: Number(item.hue || 0),
                    faceName: String(item.faceName || ""),
                    faceIndex: Number(item.faceIndex || 0)
                };
            });
        }
    } catch (e) {
        console.error("Huanaiyka_EnemyTransformDynamic: 插件参数解析错误！请检查列表格式。", e);
    }

    // 根据变量值获取当前匹配的伪装配置数据
    function getCurrentDisguiseConfig() {
        const targetId = $gameVariables.value(disguiseVarId);
        return disguiseList.find(config => config.id === targetId) || null;
    }

    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._isDisguiseActive = true; 
    };

    const _Game_System_onBattleStart = Game_System.prototype.onBattleStart;
    Game_System.prototype.onBattleStart = function() {
        _Game_System_onBattleStart.call(this);
        this._isDisguiseActive = true; // 每次战斗开始自动重置为激活伪装状态
    };

    // 强力刷新战斗中敌人贴图
    function refreshEnemySprites() {
        if (SceneManager._scene instanceof Scene_Battle && SceneManager._scene._spriteset) {
            const enemySprites = SceneManager._scene._spriteset._enemySprites;
            if (enemySprites && Array.isArray(enemySprites)) {
                enemySprites.forEach(sprite => {
                    if (sprite._enemy) {
                        sprite._enemy.refresh();
                        sprite.loadBitmap(); // 重新加载材质以响应变身
                    }
                });
            }
        }
    }

    PluginManager.registerCommand(pluginName, "setupDisguise", () => {
        $gameSystem._isDisguiseActive = true;
        refreshEnemySprites();
    });

    PluginManager.registerCommand(pluginName, "clearDisguise", () => {
        $gameSystem._isDisguiseActive = false;
        refreshEnemySprites();
    });

    PluginManager.registerCommand(pluginName, "enemySpeak", function(args) {
        // 自动在当前敌群中寻找带 <disguiser> 标签的敌人
        const enemy = $gameTroop.members().find(e => {
            const originalData = $dataEnemies[e._enemyId];
            return originalData && originalData.meta.disguiser;
        });

        if (enemy) {
            let speakerName = "";
            let faceName = "";
            let faceIndex = 0;

            const config = getCurrentDisguiseConfig();

            // 如果当前处于“伪装激活状态”且参数里配有相应数据，直接抓取参数配置
            if ($gameSystem._isDisguiseActive && config) {
                speakerName = config.name;
                faceName = config.faceName;
                faceIndex = config.faceIndex;
            } else {
                // 如果伪装已解除（显示本体），则抓取数据库本体的数据
                speakerName = enemy.originalName();
                const originalData = $dataEnemies[enemy._enemyId];
                if (originalData && originalData.meta.face) {
                    const parts = originalData.meta.face.split(",");
                    faceName = parts[0].trim();
                    faceIndex = parts[1] ? parseInt(parts[1].trim()) : 0;
                }
            }

            // 执行 MZ 标准对话构建
            $gameMessage.setSpeakerName(speakerName);
            $gameMessage.setFaceImage(faceName, faceIndex);
            $gameMessage.setBackground(parseInt(args.background || 0));
            $gameMessage.setPositionType(parseInt(args.positionType || 2));
            
            const rawText = JSON.parse(args.text);
            $gameMessage.add(rawText);

            // 让事件等待对话框关闭
            this.setWaitMode("message");
        } else {
            // 兜底：如果没找到伪装者，输出无头像文本
            const rawText = JSON.parse(args.text);
            $gameMessage.add(rawText);
            this.setWaitMode("message");
        }
    });

    // 1. 判断该敌人是否属于伪装状态
    Game_Enemy.prototype.isDisguised = function() {
        const originalData = $dataEnemies[this._enemyId];
        return !!(originalData && originalData.meta.disguiser && $gameSystem._isDisguiseActive);
    };

    // 2. 重写名字获取方法
    const _Game_Enemy_originalName = Game_Enemy.prototype.originalName;
    Game_Enemy.prototype.originalName = function() {
        if ($gameParty.inBattle() && this.isDisguised()) {
            const config = getCurrentDisguiseConfig();
            if (config) {
                return config.name; // 返回伪装配置中的名字
            }
        }
        return _Game_Enemy_originalName.call(this);
    };

    // 3. 重写战斗贴图文件名获取方法 (智能兼容普通正面FV / 侧视SV战斗)
    const _Game_Enemy_battlerName = Game_Enemy.prototype.battlerName;
    Game_Enemy.prototype.battlerName = function() {
        if ($gameParty.inBattle() && this.isDisguised()) {
            const config = getCurrentDisguiseConfig();
            if (config) {
                if ($gameSystem.isSideView()) {
                    // 如果是侧视战斗模式，优先使用配置的 SV 战斗图，如果没有设置则向下兼容普通战斗图
                    return config.svBattlerName || config.battlerName;
                } else {
                    // 如果是普通战斗模式，优先使用配置的普通战斗图，如果没有设置则兼容 SV 战斗图
                    return config.battlerName || config.svBattlerName;
                }
            }
        }
        return _Game_Enemy_battlerName.call(this);
    };

    // 4. 重写战斗色调获取方法 (Hue)
    const _Game_Enemy_battlerHue = Game_Enemy.prototype.battlerHue;
    Game_Enemy.prototype.battlerHue = function() {
        if ($gameParty.inBattle() && this.isDisguised()) {
            const config = getCurrentDisguiseConfig();
            if (config) {
                return config.hue; // 返回伪装配置中的色调
            }
        }
        return _Game_Enemy_battlerHue.call(this);
    };
})();