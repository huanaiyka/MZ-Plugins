/*:
 * @target MZ
 * @plugindesc 礼物展示柜（参数逐张配置图片与对应道具）
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================
 *  Huanaiyka_Collection - 礼物展示柜（参数配置版）
 * ============================================================
 *
 * 【功能简介】
 * 打开一个展示柜界面，按插件参数中配置的每一张图片，
 * 依次摆放在柜子上，可用鼠标或触屏自由拖拽调整位置。
 * 位置会自动保存到存档中。
 *
 * 每张图片可绑定一个「对应道具」：只有玩家持有该道具时，
 * 这张图片才会出现在展示柜中；未绑定道具的图片始终显示。
 *
 * 此外，开启「修改使用效果为查看图片」参数后，玩家在菜单 → 道具
 * 中对带 <Collectible: 图片名> 备注的道具按确定键即可查看对应图片
 *（不消耗道具）。
 *
 * ------------------------------------------------------------
 * 【第一步：准备图片】
 * ------------------------------------------------------------
 * 把展示柜背景图和每张收藏品图片放进 img/pictures/ 文件夹。
 * 要求 PNG 格式，文件名建议用英文或数字。
 *
 * ------------------------------------------------------------
 * 【第二步：配置背景】
 * ------------------------------------------------------------
 * 插件参数「展示柜背景」选择背景图（不含扩展名）。
 *
 * ------------------------------------------------------------
 * 【第三步：配置图片与对应道具】
 * ------------------------------------------------------------
 * 在插件管理器中编辑「图片列表」参数，每一项包含：
 *   - 图片文件名（不含 .png）
 *   - 对应道具（可选：道具 / 武器 / 防具；留空表示始终显示）
 *   - 存档标识（留空则使用图片文件名；同一标识共享位置）
 *   - X / Y 坐标（留空表示自动排列）
 *   - 缩放（留空使用全局缩放）
 *   - 是否可拖拽
 *
 * 位置以「存档标识」为键保存到存档，同一标识共享位置。
 *
 * ------------------------------------------------------------
 * 【第四步：让玩家获得对应道具】
 * ------------------------------------------------------------
 * 用事件指令「增加道具」把绑定的道具发给玩家，对应图片就会
 * 出现在展示柜中。若未绑定道具，则图片始终显示。
 *
 * ------------------------------------------------------------
 * 【第五步：在事件中调用插件命令】
 * ------------------------------------------------------------
 * 插件命令 - Huanaiyka_Collection - OpenCabinet
 * 直接执行即可，背景由插件参数决定。
 *
 * ------------------------------------------------------------
 * 【第六步（可选）：在菜单中查看收藏品图片】
 * ------------------------------------------------------------
 * 开启「修改使用效果为查看图片」后，在菜单 → 道具 中对带
 * <Collectible: 图片名> 备注的道具按确定键，即可查看对应图片。
 * 此功能依赖道具备注，与展示柜参数中的「对应道具」相互独立。
 *
 * ------------------------------------------------------------
 * 【玩家操作】
 * ------------------------------------------------------------
 * 展示柜界面：
 *    - 鼠标或触屏按住图片 ：拖动位置（仅可拖拽的图片）
 *    - 松手               ：自动保存位置
 *    - 确定键             ：隐藏或显示底部提示栏
 *    - 取消键             ：退出展示柜
 *
 * 菜单查看图片：
 *    - 确定键 / 取消键 / ESC / 右键 / 点击屏幕 ：关闭图片
 *
 * ------------------------------------------------------------
 * 【参数说明】
 * ------------------------------------------------------------
 * Background        展示柜背景
 * PictureList       图片列表（每项一张图，可绑定对应道具）
 * ViewPicture       修改使用效果为查看图片（默认开启）
 * MenuOnly          使用场所改为仅在菜单使用（默认开启）
 * Scale             全局图片缩放（列表项未填缩放时使用）
 * DragOnTop         拖拽时是否把图片置顶显示
 * HelpVisible       打开时提示栏是否默认显示
 * HelpText          底部提示栏的文字内容
 * ============================================================
 *
 * @param Background
 * @text 展示柜背景
 * @desc 展示柜背景图片文件名（不含扩展名，放在 img/pictures/ 下）
 * @type file
 * @dir img/pictures/
 * @default CabinetBG
 *
 * @param PictureList
 * @text 图片列表
 * @desc 逐张配置要展示的图片及其对应道具。可增删条目。
 * @type struct<PictureEntry>[]
 * @default []
 *
 * @param ViewPicture
 * @text 修改使用效果为查看图片
 * @desc 开启后，菜单中使用带 <Collectible: 图片名> 标记的道具时改为查看图片，不消耗道具、不执行原效果
 * @type boolean
 * @on 是
 * @off 否
 * @default true
 *
 * @param MenuOnly
 * @text 使用场所改为仅在菜单使用
 * @desc 开启后，带 <Collectible> 标记的道具一律强制视为仅可在菜单使用（覆盖数据库原使用场所）
 * @type boolean
 * @on 是
 * @off 否
 * @default true
 *
 * @param Scale
 * @text 全局图片缩放
 * @desc 图片列表中未填写缩放时使用的默认缩放比例。1.0 表示原始大小
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 10
 * @default 1.00
 *
 * @param DragOnTop
 * @text 拖拽时置顶
 * @desc 拖拽时是否把图片移到最上层显示
 * @type boolean
 * @on 是
 * @off 否
 * @default true
 *
 * @param HelpVisible
 * @text 提示栏默认显示
 * @desc 打开展示柜时，底部提示栏是否默认显示
 * @type boolean
 * @on 是
 * @off 否
 * @default true
 *
 * @param HelpText
 * @text 提示栏文字
 * @desc 底部提示栏显示的文字内容
 * @type string
 * @default 拖拽图片调整位置 | 确定键隐藏提示 | 取消键退出
 *
 * @command OpenCabinet
 * @text 打开收藏柜
 * @desc 打开收藏品展示柜界面
 */

/*~struct~PictureEntry:
 * @param Picture
 * @text 图片文件名
 * @desc 收藏品图片文件名（不含扩展名，放在 img/pictures/ 下）
 * @type file
 * @dir img/pictures/
 * @default
 *
 * @param ItemId
 * @text 对应道具
 * @desc 绑定一个道具/武器/防具。玩家持有该道具时才显示此图。留空表示始终显示
 * @type item
 * @default 0
 *
 * @param Key
 * @text 存档标识
 * @desc 用于在存档中保存位置的唯一标识。留空则使用图片文件名。同一标识共享位置
 * @type string
 * @default
 *
 * @param X
 * @text X 坐标
 * @desc 初始 X 坐标（像素）。留空表示按自动排列计算
 * @type number
 * @min -99999
 * @max 99999
 * @default
 *
 * @param Y
 * @text Y 坐标
 * @desc 初始 Y 坐标（像素）。留空表示按自动排列计算
 * @type number
 * @min -99999
 * @max 99999
 * @default
 *
 * @param Scale
 * @text 缩放
 * @desc 该图片的缩放比例。留空表示使用全局缩放
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 10
 * @default
 *
 * @param Draggable
 * @text 可拖拽
 * @desc 该图片是否允许玩家拖拽调整位置
 * @type boolean
 * @on 是
 * @off 否
 * @default true
 */

(() => {
    const pluginName = "Huanaiyka_Collection";
    const params = PluginManager.parameters(pluginName);

    // ==================== 参数读取 ====================
    function parseNumber(value, fallback) {
        if (value === undefined || value === null || value === "") return fallback;
        const n = Number(value);
        return isNaN(n) ? fallback : n;
    }

    function parseBoolean(value, fallback) {
        if (value === undefined || value === null || value === "") return fallback;
        return value === "true";
    }

    // 解析 struct 数组（MZ 中数组元素是 JSON 字符串）
    function parsePictureList(raw) {
        const result = [];
        let list = [];
        try {
            list = JSON.parse(raw || "[]");
        } catch (e) {
            list = [];
        }
        if (!Array.isArray(list)) list = [];
        for (const rawEntry of list) {
            let entry = rawEntry;
            if (typeof entry === "string") {
                try {
                    entry = JSON.parse(entry);
                } catch (e) {
                    entry = {};
                }
            }
            if (!entry || typeof entry !== "object") continue;
            const picture = String(entry.Picture || "").trim();
            if (!picture) continue;
            result.push({
                picture: picture,
                itemId: parseNumber(entry.ItemId, 0) || 0,
                key: String(entry.Key || "").trim() || picture,
                x: parseNumber(entry.X, null),
                y: parseNumber(entry.Y, null),
                scale: parseNumber(entry.Scale, null),
                draggable: parseBoolean(entry.Draggable, true)
            });
        }
        return result;
    }

    const PARAM = {
        background:  String(params.Background || "").trim() || "CabinetBG",
        pictureList: parsePictureList(params.PictureList),
        scale:       parseNumber(params.Scale, 1.0),
        dragOnTop:   parseBoolean(params.DragOnTop, true),
        helpVisible: parseBoolean(params.HelpVisible, true),
        helpText:    params.HelpText || "拖拽图片调整位置 | 确定键隐藏提示 | 取消键退出",
        viewPicture: parseBoolean(params.ViewPicture, true),
        menuOnly:    parseBoolean(params.MenuOnly, true)
    };

    // ==================== 数据管理 ====================

    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._collectiblePositions = {};
    };

    const _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
    Game_System.prototype.onAfterLoad = function() {
        _Game_System_onAfterLoad.call(this);
        if (!this._collectiblePositions) {
            this._collectiblePositions = {};
        }
    };

    Game_System.prototype.getCollectiblePosition = function(key) {
        if (!this._collectiblePositions) {
            this._collectiblePositions = {};
        }
        return this._collectiblePositions[key] || null;
    };

    Game_System.prototype.setCollectiblePosition = function(key, x, y) {
        if (!this._collectiblePositions) {
            this._collectiblePositions = {};
        }
        this._collectiblePositions[key] = { x: x, y: y };
    };

    // ==================== 道具判定 ====================

    // 根据 itemId 查找道具/武器/防具对象
    // MZ 的 @type item 参数值可能是 "i123" / "w12" / "a5" 这样的字符串，
    // 也可能直接是数字 ID。这里统一解析。
    function resolveItemById(idValue) {
        if (!idValue) return null;
        const str = String(idValue).trim();
        if (!str || str === "0") return null;

        let type = "item";
        let id = 0;
        const m = str.match(/^([iwa])(\d+)$/i);
        if (m) {
            const prefix = m[1].toLowerCase();
            type = prefix === "i" ? "item" : prefix === "w" ? "weapon" : "armor";
            id = Number(m[2]);
        } else {
            id = Number(str);
        }
        if (!id) return null;

        if (type === "item")   return $dataItems[id] || null;
        if (type === "weapon") return $dataWeapons[id] || null;
        if (type === "armor")  return $dataArmors[id] || null;
        return null;
    }

    // 判断玩家是否持有该条目对应的道具（未绑定则视为始终持有）
    function isEntryOwned(entry) {
        if (!entry.itemId) return true;
        const item = resolveItemById(entry.itemId);
        if (!item) return false;
        return $gameParty.hasItem(item);
    }

    // ==================== 收藏品判定（仅菜单查看图片功能使用） ====================

    function isCollectibleItem(item) {
        if (!item || !item.meta) return false;
        const name = item.meta.Collectible;
        return name && String(name).trim() !== "";
    }

    function isInItemScene() {
        return SceneManager._scene instanceof Scene_Item;
    }

    // ==================== 使用场所强制覆盖（仅菜单） ====================

    if (PARAM.menuOnly) {
        const _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
        DataManager.isDatabaseLoaded = function() {
            if (!_DataManager_isDatabaseLoaded.call(this)) return false;
            if (!this._collectibleMenuOnlyApplied) {
                this._collectibleMenuOnlyApplied = true;
                const allItems = $dataItems.concat($dataWeapons, $dataArmors);
                for (const item of allItems) {
                    if (item && isCollectibleItem(item)) {
                        item.occasion = 2;
                    }
                }
            }
            return true;
        };

        const _Window_ItemList_isEnabled = Window_ItemList.prototype.isEnabled;
        Window_ItemList.prototype.isEnabled = function(item) {
            if (item && isCollectibleItem(item) && isInItemScene()) {
                return true;
            }
            return _Window_ItemList_isEnabled.call(this, item);
        };

        const _Window_ItemList_isCurrentItemEnabled = Window_ItemList.prototype.isCurrentItemEnabled;
        Window_ItemList.prototype.isCurrentItemEnabled = function() {
            const item = this.item();
            if (item && isCollectibleItem(item) && isInItemScene()) {
                return true;
            }
            return _Window_ItemList_isCurrentItemEnabled.call(this);
        };

        const _Game_Party_canUse = Game_Party.prototype.canUse;
        Game_Party.prototype.canUse = function(item) {
            if (item && isCollectibleItem(item) && isInItemScene()) {
                return true;
            }
            return _Game_Party_canUse.call(this, item);
        };
    }

    // ==================== 展示柜场景 ====================

    function Scene_CollectibleCabinet() {
        this.initialize(...arguments);
    }

    Scene_CollectibleCabinet.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_CollectibleCabinet.prototype.constructor = Scene_CollectibleCabinet;

    Scene_CollectibleCabinet.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._background = PARAM.background;
        this._sprites = [];
        this._draggingSprite = null;
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
        this._helpVisible = PARAM.helpVisible;
    };

    Scene_CollectibleCabinet.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createBackground();
        this.createCollectibleSprites();
        this.createHelpWindow();
    };

    Scene_CollectibleCabinet.prototype.createBackground = function() {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = ImageManager.loadPicture(this._background);
        this.addChild(this._backgroundSprite);
    };

    Scene_CollectibleCabinet.prototype.createHelpWindow = function() {
        const width = Graphics.boxWidth;
        const height = this.calcWindowHeight(1, true);
        const rect = new Rectangle(0, Graphics.boxHeight - height, width, height);
        this._helpWindow = new Window_Help(rect);
        this._helpWindow.setText(PARAM.helpText);
        this._helpWindow.visible = this._helpVisible;
        this.addChild(this._helpWindow);
    };

    Scene_CollectibleCabinet.prototype.createCollectibleSprites = function() {
        // 只取玩家已持有对应道具（或未绑定道具）的条目
        const list = PARAM.pictureList.filter(entry => isEntryOwned(entry));
        const centerX = Graphics.boxWidth / 2;
        const centerY = Graphics.boxHeight / 2;

        // 自动排列参数（未填坐标时使用）
        const cols = 4;
        const spacingX = 120;
        const spacingY = 120;

        // 先统计需要自动排列的条目数量，用于居中对齐
        const autoCount = list.filter(e => e.x === null && e.y === null).length;

        let autoIndex = 0;

        for (let i = 0; i < list.length; i++) {
            const entry = list[i];
            const saved = $gameSystem.getCollectiblePosition(entry.key);

            let x, y;
            if (saved) {
                x = saved.x;
                y = saved.y;
            } else {
                // 优先使用配置的坐标，缺省则自动排列
                if (entry.x !== null && entry.y !== null) {
                    x = entry.x;
                    y = entry.y;
                } else if (entry.x !== null) {
                    x = entry.x;
                    y = centerY;
                } else if (entry.y !== null) {
                    x = centerX;
                    y = entry.y;
                } else {
                    const row = Math.floor(autoIndex / cols);
                    const col = autoIndex % cols;
                    const itemsInRow = Math.min(cols, autoCount - row * cols);
                    const rowOffset = (col - (itemsInRow - 1) / 2) * spacingX;
                    x = centerX + rowOffset;
                    y = centerY + (row - 0.5) * spacingY;
                    autoIndex++;
                }
            }

            const sprite = new Sprite();
            sprite.bitmap = ImageManager.loadPicture(entry.picture);
            sprite.x = x;
            sprite.y = y;
            sprite._positionKey = entry.key;
            sprite._pictureName = entry.picture;
            sprite._draggable = entry.draggable;

            const scale = entry.scale !== null ? entry.scale : PARAM.scale;
            sprite.scale.x = scale;
            sprite.scale.y = scale;

            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;

            this.addChild(sprite);
            this._sprites.push({
                key: entry.key,
                sprite: sprite,
                data: entry
            });
        }
    };

    // ==================== 交互处理 ====================

    Scene_CollectibleCabinet.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        this.updateDragging();
        this.updateInput();
    };

    Scene_CollectibleCabinet.prototype.updateDragging = function() {
        if (this._draggingSprite) {
            if (TouchInput.isPressed()) {
                const newX = TouchInput.x - this._dragOffsetX;
                const newY = TouchInput.y - this._dragOffsetY;
                this._draggingSprite.x = newX;
                this._draggingSprite.y = newY;
            }

            if (TouchInput.isReleased() ||
                Input.isTriggered("ok") ||
                Input.isTriggered("cancel")) {
                $gameSystem.setCollectiblePosition(
                    this._draggingSprite._positionKey,
                    Math.round(this._draggingSprite.x),
                    Math.round(this._draggingSprite.y)
                );
                this._draggingSprite = null;
                this.restoreHelpText();
            }
        } else {
            if (TouchInput.isTriggered()) {
                this.checkSpriteClick(TouchInput.x, TouchInput.y);
            }
        }
    };

    Scene_CollectibleCabinet.prototype.checkSpriteClick = function(x, y) {
        for (let i = this._sprites.length - 1; i >= 0; i--) {
            const entry = this._sprites[i];
            const sprite = entry.sprite;

            if (!sprite._draggable) continue;

            const bitmap = sprite.bitmap;
            if (!bitmap || !bitmap.isReady()) continue;

            const scaleX = sprite.scale.x || 1;
            const scaleY = sprite.scale.y || 1;
            const localX = (x - sprite.x) / scaleX + bitmap.width  * sprite.anchor.x;
            const localY = (y - sprite.y) / scaleY + bitmap.height * sprite.anchor.y;

            if (localX >= 0 && localX < bitmap.width &&
                localY >= 0 && localY < bitmap.height) {
                if (bitmap.getAlphaPixel(localX, localY) > 0) {
                    this.startDragging(entry, x, y);
                    return;
                }
            }
        }
    };

    Scene_CollectibleCabinet.prototype.startDragging = function(entry, x, y) {
        this._draggingSprite = entry.sprite;
        this._dragOffsetX = x - entry.sprite.x;
        this._dragOffsetY = y - entry.sprite.y;

        if (PARAM.dragOnTop) {
            this.removeChild(entry.sprite);
            this.addChild(entry.sprite);
        }

        this._helpWindow.setText("拖拽中... 松手保存位置");
    };

    Scene_CollectibleCabinet.prototype.restoreHelpText = function() {
        this._helpWindow.setText(PARAM.helpText);
    };

    Scene_CollectibleCabinet.prototype.updateInput = function() {
        if (Input.isTriggered("ok")) {
            if (!this._draggingSprite) {
                this._helpVisible = !this._helpVisible;
                this._helpWindow.visible = this._helpVisible;
            }
        }

        if (Input.isTriggered("cancel") || Input.isTriggered("escape")) {
            if (!this._draggingSprite) {
                this.popScene();
            }
        }
    };

    // ==================== 插件管理器命令注册 ====================

    PluginManager.registerCommand(pluginName, "OpenCabinet", () => {
        SceneManager.push(Scene_CollectibleCabinet);
    });

    // ==================== 收藏品查看功能 ====================

    const _Scene_Item_useItem = Scene_Item.prototype.useItem;
    Scene_Item.prototype.useItem = function() {
        if (PARAM.viewPicture) {
            const item = this.item();
            if (item && isCollectibleItem(item)) {
                const pictureName = String(item.meta.Collectible).trim();
                this.showCollectiblePicture(pictureName);
                return;
            }
        }
        _Scene_Item_useItem.call(this);
    };

    Scene_Item.prototype.showCollectiblePicture = function(pictureName) {
        this.hideCollectiblePicture();

        const sprite = new Sprite();
        sprite.bitmap = ImageManager.loadPicture(pictureName);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.x = Graphics.boxWidth / 2;
        sprite.y = Graphics.boxHeight / 2;
        sprite.bitmap.addLoadListener(() => {
            const bmp = sprite.bitmap;
            const maxW = Graphics.boxWidth;
            const maxH = Graphics.boxHeight;
            const scale = Math.min(1, maxW / bmp.width, maxH / bmp.height);
            sprite.scale.x = scale;
            sprite.scale.y = scale;
        });

        this.addChild(sprite);
        this._collectibleSprite = sprite;
    };

    Scene_Item.prototype.hideCollectiblePicture = function() {
        if (this._collectibleSprite) {
            this.removeChild(this._collectibleSprite);
            this._collectibleSprite = null;
        }
    };

    const _Scene_Item_update = Scene_Item.prototype.update;
    Scene_Item.prototype.update = function() {
        if (this._collectibleSprite) {
            if (Input.isTriggered("cancel") || Input.isTriggered("escape") ||
                Input.isTriggered("ok") || TouchInput.isCancelled() ||
                TouchInput.isTriggered()) {
                this.hideCollectiblePicture();
            }
            Window.prototype.update.call(this._itemWindow);
            Window.prototype.update.call(this._helpWindow);
            return;
        }
        _Scene_Item_update.call(this);
    };

})();