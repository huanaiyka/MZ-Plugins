/*:
 * @target MZ
 * @plugindesc 改变地图上的跟随者数量
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help 
 * =============================================================================
 * 插件说明
 * =============================================================================
 * 本插件允许您动态调整地图上显示的跟随者数量，不影响出战人数。
 *
 * 例如，您可以将跟随者设为 0（隐藏所有队员），或设为 99（显示 99 个跟随者，
 * 若不足则显示所有跟随者）。
 * 同时，当有新人加入队伍时，跟随者会出现在事件位置（如角色加入事件的位置），
 * 避免与玩家重叠，提升剧情演出的自然度。
 * 
 * 如果您需要修改出战人数的插件，可使用 Huanaiyka_MoreBattleMembers.js 插件
 * 或其他战斗类插件。
 * 
 * 【注意】本插件默认不生效，必须使用插件指令来激活并调整跟随者数量。
 * =============================================================================
 * 插件指令
 * =============================================================================
 * 您可以在事件指令的「插件指令」中使用以下命令：
 *
 *   1. 设置最大跟随者数量 SetMaxFollowers
 *      示例： SetMaxFollowers 4   → 最多显示 4 个跟随者
 *            SetMaxFollowers 0   → 隐藏所有跟随者
 *      效果：立即生效，「刷新」并激活「监管模式」（见下文）。
 *   
 *   2. 增加一名跟随者上限 AddFollower
 *      示例： AddFollower → 当前最大跟随者数量 +1（若当前为3，则变为4）

 *   3. 减少一名跟随者上限 RemoveFollower
 *      示例： RemoveFollower → 当前最大跟随者数量 -1（最低为0）
 * 
 *   4. 恢复默认并关闭监管
 *      指令： ResetMaxFollowers
 *      效果：跟随者数量恢复为原版默认的 3 人，并关闭监管模式。
 *            此后队伍变动将不再自动刷新跟随者（除非再次使用 SetMaxFollowers）。
 *            同时也不再受参数设定的数值影响。
 *           
=============================================================================
 * 刷新机制与位置处理
 * =============================================================================
 * 1. 新增跟随者时，其初始位置会智能判断：
 *    - 如果是在事件互动中（例如 NPC 加入队伍），新跟随者将出现在该事件
 *      所在位置，而非与玩家重叠，使演出更自然。
 *    - 普通情况下则出现在玩家所在格。
 *
 * 2. 刷新过程采用「截图覆盖」技术：
 *    - 先截取当前画面作为遮罩，然后重建所有角色精灵，最后移除遮罩。
 *    - 这可以消除传统刷新时可能出现的瞬间空白或闪烁，体验更平滑。
 *    - 这个过程可能会消耗一部分游戏性能。
 *    - 您可以通过插件参数「启用截图覆盖」关闭此功能，改用普通刷新。
 *
 * 3. 如果截图失败（极少发生），插件会自动降级为普通刷新，不影响功能。
 *
 * =============================================================================
 * 监管模式说明
 * =============================================================================
 * · 当您使用 `SetMaxFollowers` 指令后，插件进入「监管模式」。
 * · 在监管模式下，每当队伍中增加新成员（addActor），系统会**自动刷新**
 *   跟随者显示，确保数量始终符合您设定的最大值。
 * · 使用 `ResetMaxFollowers` 可退出监管模式，此后队伍变动不会触发自动刷新。
 * · 退出监管后，跟随者数量固定为原版默认 3 人，适合不需要频繁调整的场景。
 *
 * =============================================================================
 * 核心修改说明
 * =============================================================================
 * 为实现功能，本插件重写了以下核心方法：
 *
 *   • Game_Followers.prototype.setup         → 控制跟随者生成数量
 *   • Game_Party.prototype.addActor          → 队伍加入后自动刷新跟随者
 *   • Game_Party.prototype.removeActor       → 队伍移除后自动刷新跟随者
 *   • Game_Party.prototype.swapOrder         → 队伍排序后自动刷新跟随者
 *
 * 若其他插件也修改了上述方法，则可能产生冲突。
 *
 * @param Enable Screenshot Overlay
 * @text 启用截图覆盖
 * @desc 启用截图覆盖以消除刷新闪烁，关闭则使用普通刷新（可提升性能）
 * @type boolean
 * @default true
 *
 * @command SetMaxFollowers
 * @text 设置最大跟随者数量
 * @desc 最大跟随者数量（不含主角），原版为3
 * @arg value
 * @text 数量
 * @desc 要设置的最大跟随者数量（0 表示不显示任何跟随者）
 * @type number
 * @min 0
 * @default 3
 * 
 * @command AddFollower
 * @text 增加跟随者上限
 * @desc 增加一名跟随者上限
 *
 * @command RemoveFollower
 * @text 减少跟随者上限
 * @desc 减少一名跟随者上限
 * 
 * @command ResetMaxFollowers
 * @text 恢复默认并关闭插件
 * @desc 恢复原版默认的3人跟随，不会遵循参数设置
 * 
 */

(() => {
    const pluginName = "Huanaiyka_MapFollowerCount";
    const params = PluginManager.parameters(pluginName);

    // ----- 读取参数（仅保留截图覆盖开关）-----
    let defaultMaxFollowers = 3; // 原版默认值，仅用作复位时的基准
    let enableScreenshot = true;
    try {
        let raw = params['Enable Screenshot Overlay'] || 'true';
        enableScreenshot = raw.toLowerCase() === 'true';
    } catch (e) { /* ignore */ }

    // ================================================================
    // 1. 扩展 Game_System 以支持存档持久化
    // ================================================================
    const _GameSystem_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _GameSystem_initialize.call(this);
        // 默认关闭插件，需要用户通过指令激活
        this._followerMax = defaultMaxFollowers;
        this._followerPluginActive = false;
        this._followerManualFlag = false;
    };

    // 获取/设置最大跟随者数量
    Game_System.prototype.followerMax = function() {
        if (this._followerMax === undefined) this._followerMax = defaultMaxFollowers;
        return this._followerMax;
    };
    Game_System.prototype.setFollowerMax = function(value) {
        this._followerMax = Math.max(0, value);
    };

    // 获取/设置插件激活状态
    Game_System.prototype.followerPluginActive = function() {
        if (this._followerPluginActive === undefined) this._followerPluginActive = false;
        return this._followerPluginActive;
    };
    Game_System.prototype.setFollowerPluginActive = function(value) {
        this._followerPluginActive = !!value;
    };

    // 获取/设置监管模式标志
    Game_System.prototype.followerManualFlag = function() {
        if (this._followerManualFlag === undefined) this._followerManualFlag = false;
        return this._followerManualFlag;
    };
    Game_System.prototype.setFollowerManualFlag = function(value) {
        this._followerManualFlag = !!value;
    };

    // ================================================================
    // 2. 核心功能函数（使用 $gameSystem 中的状态）
    // ================================================================
    function getActualCount() {
        let partySize = $gameParty.allMembers().length;
        let max = $gameSystem.followerMax();
        return Math.max(0, Math.min(partySize - 1, max));
    }

    const _originalSetup = Game_Followers.prototype.setup;
    Game_Followers.prototype.setup = function() {
        if (!$gameSystem.followerPluginActive()) {
            _originalSetup.call(this);
            return;
        }
        this._data = [];
        this._gathering = false;
        this._stopChase = false;
        this._moveHistory = [];
        let count = getActualCount();
        for (let i = 0; i < count; i++) {
            this._data.push(new Game_Follower(i));
        }
    };

    Game_Follower.prototype.actor = function() {
        let members = $gameParty.allMembers();
        if ($gameSystem.followerManualFlag() && $gameSystem.followerPluginActive()) {
            return members[this._memberIndex + 1];
        } else {
            return members[this._memberIndex];
        }
    };

    // ----- 刷新跟随者（完整重建所有角色精灵）-----
    function refreshFollowers() {
        if (!$gamePlayer || !$gamePlayer.followers) return;
        const followers = $gamePlayer.followers();

        // 只有监管模式开启时才保留旧位置
        let oldData = [];
        if ($gameSystem.followerManualFlag()) {
            oldData = followers._data.map(f => ({
                x: f.x,
                y: f.y,
                direction: f.direction()
            }));
        }

        followers.setup();

        // 判断是否在事件互动中（用于新增跟随者位置）
        let targetX = $gamePlayer.x;
        let targetY = $gamePlayer.y;
        let targetDir = $gamePlayer.direction();
        const interpreter = $gameMap._interpreter;
        if (interpreter && interpreter._eventId > 0) {
            const event = $gameMap.event(interpreter._eventId);
            if (event) {
                targetX = event.x;
                targetY = event.y;
                targetDir = event.direction();
            }
        }

        const newFollowers = followers._data;
        for (let i = 0; i < newFollowers.length; i++) {
            const f = newFollowers[i];
            if ($gameSystem.followerManualFlag() && i < oldData.length) {
                f.setPosition(oldData[i].x, oldData[i].y);
                f.setDirection(oldData[i].direction);
            } else {
                f.setPosition(targetX, targetY);
                f.setDirection(targetDir);
            }
        }

        // 完整重建所有角色精灵（玩家、事件、跟随者）
        $gamePlayer.refresh();
        const spriteset = SceneManager._scene && SceneManager._scene._spriteset;
        if (spriteset) {
            spriteset._characterSprites.forEach(s => {
                spriteset.removeChild(s);
                s.destroy();
            });
            spriteset._characterSprites = [];
            spriteset.createCharacters();
            spriteset._characterSprites.forEach(s => {
                if (!s.parent) spriteset.addChild(s);
            });
        }
        $gameMap.requestRefresh();
    }

    // ----- 无闪烁完整刷新（使用截图覆盖）-----
    function refreshMapWithoutFade() {
        const scene = SceneManager._scene;
        if (!scene) return;

        let coverSprite = null;
        try {
            const bitmap = Bitmap.snap(scene);
            coverSprite = new Sprite(bitmap);
            coverSprite.z = 10000;
            scene.addChild(coverSprite);
        } catch (e) {
            console.warn("截图覆盖失败，继续刷新", e);
        }

        refreshFollowers();

        if (coverSprite) {
            requestAnimationFrame(() => {
                if (scene && coverSprite.parent) {
                    scene.removeChild(coverSprite);
                    coverSprite.bitmap.destroy();
                }
            });
        }
    }

    function refreshAndReloadMap() {
        if (enableScreenshot) {
            refreshMapWithoutFade();
        } else {
            refreshFollowers();
        }
    }

    // 统一刷新入口
    function performRefresh() {
        if ($gameSystem.followerManualFlag() && enableScreenshot) {
            refreshMapWithoutFade();
        } else {
            refreshFollowers();
        }
    }

    // ================================================================
    // 3. 插件指令（操作 $gameSystem 中的状态）
    // ================================================================
    PluginManager.registerCommand(pluginName, "SetMaxFollowers", args => {
        let v = Number(args.value);
        if (!isNaN(v) && v >= 0) {
            $gameSystem.setFollowerMax(v);
            $gameSystem.setFollowerPluginActive(true);
            $gameSystem.setFollowerManualFlag(true);
            refreshAndReloadMap();
        }
    });

    PluginManager.registerCommand(pluginName, "AddFollower", args => {
        let cur = $gameSystem.followerMax();
        $gameSystem.setFollowerMax(cur + 1);
        $gameSystem.setFollowerPluginActive(true);
        $gameSystem.setFollowerManualFlag(true);
        refreshAndReloadMap();
    });

    PluginManager.registerCommand(pluginName, "RemoveFollower", args => {
        let cur = $gameSystem.followerMax();
        if (cur > 0) {
            $gameSystem.setFollowerMax(cur - 1);
        }
        $gameSystem.setFollowerPluginActive(true);
        $gameSystem.setFollowerManualFlag(true);
        refreshAndReloadMap();
    });

    PluginManager.registerCommand(pluginName, "ResetMaxFollowers", args => {
        $gameSystem.setFollowerMax(defaultMaxFollowers);
        $gameSystem.setFollowerPluginActive(false);
        $gameSystem.setFollowerManualFlag(false);
        refreshAndReloadMap();
    });

    // ================================================================
    // 4. 队伍变动响应（使用 performRefresh）
    // ================================================================
    const _addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function(actorId) {
        _addActor.call(this, actorId);
        if (!$gameSystem.followerPluginActive()) return;
        performRefresh();
    };

    const _removeActor = Game_Party.prototype.removeActor;
    Game_Party.prototype.removeActor = function(actorId) {
        _removeActor.call(this, actorId);
        if (!$gameSystem.followerPluginActive()) return;
        performRefresh();
    };

    const _swapOrder = Game_Party.prototype.swapOrder;
    Game_Party.prototype.swapOrder = function(idx1, idx2) {
        _swapOrder.call(this, idx1, idx2);
        if (!$gameSystem.followerPluginActive()) return;
        performRefresh();
    };

})();