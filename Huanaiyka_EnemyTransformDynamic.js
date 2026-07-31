/*:
 * @target MZ
 * @plugindesc 智能敌人伪装系统 
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
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
 * @desc 在这里统一配置所有伪装/变身对象的数据。
 * @default []
 * 
 * @help
 * ============================================================================
 * 核心功能：
 * ============================================================================
 * 1. 在插件参数中配置所有伪装角色的名字、战斗图、对话框头像和地图行走图。
 * 2. 自动寻找带有 <disguiser> 标签的敌人或地图事件，并根据“伪装ID”瞬间完成变身。
 * 3. 提供“伪装者发言”指令，自动适配变身/本体状态下的名字和头像。
 * ============================================================================
 * 数据库设置
 * ============================================================================
 * 1. 在“伪装者（如百变怪）”的注释框中输入标签以识别它：
 *    <disguiser>
 *
 * 2. 在“伪装者”的注释框中，还可以绑定它显露本体（解除伪装）后的对话头像：
 *    <face: 图像文件名, 头像索引>
 *    例如： <face: Monster, 3>
 *    （代表显露本体时，使用 img/faces/Monster.png 的第4张头像）
 *
 * ============================================================================
 * 插件指令（插件命令）
 * ============================================================================
 * 1. 【激活伪装】 (setupDisguise)
 *    让战斗中带有 <disguiser> 标签的敌人变成当前变量指定形态的形象。
 *    注：进入战斗时默认自动激活。
 *
 * 2. 【解除伪装】 (clearDisguise)
 *    让它们瞬间恢复本体，战斗图和对话框也同步变回本体。
 *
 * 3. 【伪装者发言】 (enemySpeak)
 *    让这个伪装者说话。它会自动检测自己目前是“变身状态”还是“本体状态”：
 *    - 变身状态下：自动使用你在参数里对应的名字、头像。
 *    - 本体状态下：自动使用数据库本体怪物的名字，以及本体注释里的 <face> 头像。
 *
 * 4. 【应用地图伪装】 (applyMapDisguise)
 *    将当前触发事件的行走图切换为当前伪装配置的行走图。
 *    该指令对任何事件均有效，不要求事件带有 <disguiser> 标签，
 *    可用于临时伪装任意事件。
 *
 * 5. 【解除地图伪装】 (clearMapDisguise)
 *    将当前触发事件的行走图恢复为事件原本设定的行走图。
 *    适用于解除单个事件的伪装状态。
 *
 * 6. 【恢复所有地图伪装】 (clearAllMapDisguise)
 *    将地图上所有事件的行走图恢复为原本设定。
 *    适用于批量解除伪装。
 *
 * ============================================================================
 * 变量与伪装ID说明
 * ============================================================================
 * - 插件参数中设置了一个“伪装目标ID变量”（默认 #15）。
 * - 你只需在游戏中改变该变量的值（例如通过事件指令“变量操作”），
 *   伪装者就会自动切换为对应的伪装形态。
 * - 伪装ID 对应插件参数列表中配置的“伪装对象列表”中的 id 值。
 *
 * ============================================================================
 * 注意事项
 * ============================================================================
 * - 战斗中的伪装状态在每场战斗开始时自动重置为“激活”。
 * - 地图上的伪装事件会在地图加载时自动应用，并会实时响应变量变化。
 * - 请确保伪装列表中的 ID 唯一且大于 0。
 * - 如果变量值在列表中找不到匹配项，伪装者将保持本体状态。
 * ============================================================================
 * 扩展应用：随机NPC系统
 * ============================================================================
 * - 在事件上添加 <disguiser> 标签，然后通过改变“伪装目标ID变量”的数值，
 * - 即可让该事件自动切换为对应的行走图、名字和头像。
 * 
 * - 所有外观模板统一在插件参数中配置，无需额外设置事件页，
 * - 非常适合实现随机路人、动态NPC或可变身角色等效果。
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
 *
 * @command applyMapDisguise
 * @text 应用地图伪装
 * @desc 将当前触发事件的行走图切换为当前伪装配置的行走图。
 *
 * @command clearMapDisguise
 * @text 解除地图伪装
 * @desc 将当前触发事件的行走图恢复为事件原本设定的行走图。
 *
 * @command clearAllMapDisguise
 * @text 恢复所有地图伪装
 * @desc 将地图上所有事件的行走图恢复为原本设定。
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
 * 
 * @param charName
 * @text 地图行走图文件名
 * @type file
 * @dir img/characters
 * @desc 伪装状态下在地图上显示的行走图。
 * 
 * @param charIndex
 * @text 地图行走图索引
 * @type number
 * @min 0
 * @max 7
 * @desc 行走图格子索引（0-7）。
 * @default 0
 * 
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
                    faceIndex: Number(item.faceIndex || 0),
                    charName: String(item.charName || ""),
                    charIndex: Number(item.charIndex || 0)
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

    // 激活伪装指令
    PluginManager.registerCommand(pluginName, "setupDisguise", () => {
        $gameSystem._isDisguiseActive = true;
        refreshEnemySprites();
    });

    // 解除伪装指令
    PluginManager.registerCommand(pluginName, "clearDisguise", () => {
        $gameSystem._isDisguiseActive = false;
        refreshEnemySprites();
    });

    // 伪装者发言指令
    PluginManager.registerCommand(pluginName, "enemySpeak", function(args) {
        let speakerName = "";
        let faceName = "";
        let faceIndex = 0;
        const config = getCurrentDisguiseConfig();

        // 1. 判断场景：如果是战斗，从 $gameTroop 找；如果是地图，从 $gameMap.events 找
        let targetMeta = null;
        if ($gameParty.inBattle()) {
            const enemy = $gameTroop.members().find(e => $dataEnemies[e._enemyId]?.meta.disguiser);
            if (enemy) {
                targetMeta = $dataEnemies[enemy._enemyId].meta;
                if ($gameSystem._isDisguiseActive && config) {
                    speakerName = config.name;
                    faceName = config.faceName;
                    faceIndex = config.faceIndex;
                } else {
                    speakerName = enemy.originalName();
                    const parts = targetMeta.face?.split(",");
                    faceName = parts ? parts[0].trim() : "";
                    faceIndex = parts ? parseInt(parts[1].trim()) : 0;
                }
            }
        } else {
            // 地图模式：寻找当前触发指令的事件（或者备注含有 <disguiser> 的事件）
            const event = $gameMap.event($gameMap._interpreter.eventId());
            if (event && event.event().meta.disguiser) {
                targetMeta = event.event().meta;
                if ($gameSystem._isDisguiseActive && config) {
                    speakerName = config.name;
                    faceName = config.faceName;
                    faceIndex = config.faceIndex;
                } else {
                    speakerName = event.event().name; // 默认使用事件名
                    const parts = targetMeta.face?.split(",");
                    faceName = parts ? parts[0].trim() : "";
                    faceIndex = parts ? parseInt(parts[1].trim()) : 0;
                }
            }
        }

        if (speakerName !== "") {
            $gameMessage.setSpeakerName(speakerName);
            $gameMessage.setFaceImage(faceName, faceIndex);
            $gameMessage.setBackground(parseInt(args.background || 0));
            $gameMessage.setPositionType(parseInt(args.positionType || 2));
            $gameMessage.add(JSON.parse(args.text));
            this.setWaitMode("message");
        }
    });

    // 地图行走图修改指令
    PluginManager.registerCommand(pluginName, "applyMapDisguise", args => {
        const config = getCurrentDisguiseConfig();
        const eventId = $gameMap._interpreter.eventId();
        const event = $gameMap.event(eventId);
        if (config && config.charName && event) {
            event.setImage(config.charName, config.charIndex);
            event.refresh(); 
        }
    });

    // 解除当前事件的地图伪装（恢复原始行走图）
    PluginManager.registerCommand(pluginName, "clearMapDisguise", args => {
        const eventId = $gameMap._interpreter.eventId();
        const event = $gameMap.event(eventId);
        if (event) {
            const page = event.event().pages[0];
            if (page) {
                event.setImage(page.image.characterName, page.image.characterIndex);
                event.refresh();
            }
        }
    });

    // 恢复所有地图事件的伪装（批量还原）
    PluginManager.registerCommand(pluginName, "clearAllMapDisguise", args => {
        $gameMap.events().forEach(event => {
            const page = event.event().pages[0];
            if (page) {
                event.setImage(page.image.characterName, page.image.characterIndex);
                event.refresh();
            }
        });
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

    // --- 新增：地图事件自动伪装逻辑 ---
    const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _Scene_Map_onMapLoaded.call(this);
        const config = getCurrentDisguiseConfig();
        if (config && config.charName) {
            $gameMap.events().forEach(event => {
                // 检测事件备注中是否含有 <disguiser>
                if (event.event().meta.disguiser) {
                    event.setImage(config.charName, config.charIndex);
                }
            });
        }
    };

    // --- 新增：实时监听变量变化并刷新地图事件 ---
    const _Game_Variables_setValue = Game_Variables.prototype.setValue;
    Game_Variables.prototype.setValue = function(variableId, value) {
        _Game_Variables_setValue.call(this, variableId, value);
        
        // 检查变动的变量是否为我们配置的伪装变量
        if (variableId === disguiseVarId && SceneManager._scene instanceof Scene_Map) {
            refreshMapDisguise();
        }
    };

    // 地图刷新逻辑函数
    function refreshMapDisguise() {
        const config = getCurrentDisguiseConfig();
        $gameMap.events().forEach(event => {
            if (event.event().meta.disguiser) {
                if (config && config.charName) {
                    // 如果有配置，则变身为配置的行走图
                    event.setImage(config.charName, config.charIndex);
                } else {
                    // 如果变量清空或未找到配置，恢复事件原本的图像（需重置事件）
                    event.setImage(event.event().pages[0].image.characterName, event.event().pages[0].image.characterIndex);
                }
                event.refresh(); // 强制刷新渲染
            }
        });
    }

})();