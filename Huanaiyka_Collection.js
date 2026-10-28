/*:
 * @target MZ
 * @plugindesc 礼物展示柜
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================
 *  Huanaiyka_Collection - 礼物展示柜
 * ============================================================
 *
 * 【功能简介】
 * 打开一个展示柜界面，玩家可以把背包中带有指定标记的道具
 * （如伊布玩偶、手写册等）以图片形式摆在柜子上，并用鼠标
 * 或触屏自由拖拽调整位置。位置会自动保存到存档中。
 *
 * 此外，开启「修改使用效果为查看图片」参数后，玩家在菜单 → 道具
 * 中对收藏品按确定键即可直接查看对应图片（不消耗道具）。
 *
 * ------------------------------------------------------------
 * 【第一步：准备图片】
 * ------------------------------------------------------------
 * 把展示柜背景图和每个收藏品的图片放进 img/pictures/ 文件夹。
 *
 * 要求：
 *    - 格式为 PNG（收藏品建议去底透明）
 *    - 文件名建议用英文或数字，避免空格和特殊字符
 *
 * 例如：
 *    img/pictures/CabinetBG.png   展示柜背景
 *    img/pictures/EeveeDoll.png   伊布玩偶
 *    img/pictures/Notebook.png    手写册
 *
 * ------------------------------------------------------------
 * 【第二步：给道具绑定图片】
 * ------------------------------------------------------------
 * 打开 数据库 - 道具（或武器、防具），在道具的备注栏写入：
 *
 *    Collectible: 图片文件名
 *
 * 外面要套上尖括号，例如：
 *
 *    <Collectible: EeveeDoll>
 *    <Collectible: Notebook>
 *
 * 注意：
 *    - 冒号后一个空格，图片名前后不要有多余空格
 *    - 图片名不带 .png 扩展名
 *    - 插件会自动扫描 道具 / 武器 / 防具 三类
 *
 * ------------------------------------------------------------
 * 【第三步：让玩家获得道具】
 * ------------------------------------------------------------
 * 光在数据库建好还不够，玩家必须真的持有该道具。
 * 用事件指令「增加道具」把礼物发给玩家即可。
 *
 * ------------------------------------------------------------
 * 【第四步：在事件中调用插件命令】
 * ------------------------------------------------------------
 * 在地图事件里选择：插件命令 - Huanaiyka_Collection - OpenCabinet
 *
 * 参数 Background 填展示柜背景图文件名（不带扩展名）。
 * 例如：CabinetBG
 *
 * ------------------------------------------------------------
 * 【第五步（可选）：在菜单中查看收藏品图片】
 * ------------------------------------------------------------
 * 开启「修改使用效果为查看图片」后，在菜单 → 道具 中对带
 * <Collectible: 图片名> 标记的道具按确定键，即可查看对应图片，
 * 不消耗道具、不执行原效果。再次按确定/取消/ESC/右键/点击关闭。
 *
 * 开启「使用场所改为仅在菜单使用」后，这些道具会被强制视为
 * 仅菜单使用（覆盖数据库原设置），战斗中与事件指令中不可用。
 *
 * ------------------------------------------------------------
 * 【玩家操作】
 * ------------------------------------------------------------
 * 展示柜界面：
 *    - 鼠标或触屏按住收藏品 ：拖动位置
 *    - 松手                 ：自动保存位置
 *    - 确定键（Z/空格/回车） ：隐藏或显示底部提示栏
 *    - 取消键（X/ESC/右键）  ：退出展示柜
 *
 * 提示：拖拽过程中按确定键或取消键，也会结束拖拽并保存。
 *
 * 菜单查看图片：
 *    - 确定键 / 取消键 / ESC / 右键 / 点击屏幕 ：关闭图片
 *
 * ------------------------------------------------------------
 * 【参数说明】
 * ------------------------------------------------------------
 * ViewPicture       修改使用效果为查看图片（默认开启）
 * MenuOnly          使用场所改为仅在菜单使用（默认开启）
 * OffsetX           整体横向偏移（正数右移，负数左移）
 * OffsetY           整体纵向偏移（正数下移，负数上移）
 * SpacingX          多个收藏品自动排列时的横向间距
 * SpacingY          多个收藏品自动排列时的纵向间距
 * Columns           自动排列时每行放几个（默认 4）
 * Scale             收藏品图片整体缩放（1.0 = 原始大小）
 * DragOnTop         拖拽时是否把图片置顶显示
 * HelpVisible       打开时提示栏是否默认显示
 * HelpText          底部提示栏的文字内容
 * ============================================================
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
 * @param OffsetX
 * @text 整体横向偏移
 * @desc 整体横向偏移量。正数右移，负数左移。默认 0 即屏幕正中间
 * @type number
 * @min -9999
 * @max 9999
 * @default 0
 *
 * @param OffsetY
 * @text 整体纵向偏移
 * @desc 整体纵向偏移量。正数下移，负数上移。默认 0 即屏幕正中间
 * @type number
 * @min -9999
 * @max 9999
 * @default 0
 *
 * @param SpacingX
 * @text 横向间距
 * @desc 多个收藏品自动排列时的横向间距
 * @type number
 * @min 0
 * @max 9999
 * @default 120
 *
 * @param SpacingY
 * @text 纵向间距
 * @desc 多个收藏品自动排列时的纵向间距
 * @type number
 * @min 0
 * @max 9999
 * @default 120
 *
 * @param Columns
 * @text 每行数量
 * @desc 自动排列时每行放几个收藏品
 * @type number
 * @min 1
 * @max 20
 * @default 4
 *
 * @param Scale
 * @text 图片缩放
 * @desc 收藏品图片的整体缩放比例。1.0 表示原始大小
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
 * @default 拖拽收藏品调整位置 | 确定键隐藏提示 | 取消键退出
 *
 * @command OpenCabinet
 * @text 打开收藏柜
 * @desc 打开收藏品展示柜界面
 *
 * @arg Background
 * @text 背景图片
 * @desc 展示柜的背景图片文件名（不含扩展名）
 * @type file
 * @dir img/pictures/
 * @default CabinetBG
 */

(() => {
    const pluginName = "Huanaiyka_Collection";
    const params = PluginManager.parameters(pluginName);

    // ==================== 参数读取 ====================
    const PARAM = {
        offsetX:     Number(params.OffsetX     || 0),
        offsetY:     Number(params.OffsetY     || 0),
        spacingX:    Number(params.SpacingX    || 120),
        spacingY:    Number(params.SpacingY    || 120),
        columns:     Number(params.Columns     || 4),
        scale:       Number(params.Scale       || 1.0),
        dragOnTop:   params.DragOnTop   === "true",
        helpVisible: params.HelpVisible === "true",
        helpText:    params.HelpText    || "拖拽收藏品调整位置 | 确定键隐藏提示 | 取消键退出",
        viewPicture: params.ViewPicture === "true",
        menuOnly:    params.MenuOnly    === "true"
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

    Game_System.prototype.getCollectiblePosition = function(itemId) {
        if (!this._collectiblePositions) {
            this._collectiblePositions = {};
        }
        return this._collectiblePositions[itemId] || null;
    };

    Game_System.prototype.setCollectiblePosition = function(itemId, x, y) {
        if (!this._collectiblePositions) {
            this._collectiblePositions = {};
        }
        this._collectiblePositions[itemId] = { x: x, y: y };
    };

    // ==================== 收藏品判定 ====================

    function isCollectibleItem(item) {
        if (!item || !item.meta) return false;
        const name = item.meta.Collectible;
        return name && String(name).trim() !== "";
    }

    // 只在菜单道具场景里对收藏品放行，其它场景保持原版
    function isInItemScene() {
        return SceneManager._scene instanceof Scene_Item;
    }

    // ==================== 使用场所强制覆盖（仅菜单） ====================

    if (PARAM.menuOnly) {
        // 1) 数据库加载后，把所有收藏品的 occasion 覆盖为 2（仅菜单）
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

        // 2) 菜单道具列表条目：收藏品始终可选、不变灰
        const _Window_ItemList_isEnabled = Window_ItemList.prototype.isEnabled;
        Window_ItemList.prototype.isEnabled = function(item) {
            if (item && isCollectibleItem(item) && isInItemScene()) {
                return true;
            }
            return _Window_ItemList_isEnabled.call(this, item);
        };

        // 3) 当前条目确定键有效
        const _Window_ItemList_isCurrentItemEnabled = Window_ItemList.prototype.isCurrentItemEnabled;
        Window_ItemList.prototype.isCurrentItemEnabled = function() {
            const item = this.item();
            if (item && isCollectibleItem(item) && isInItemScene()) {
                return true;
            }
            return _Window_ItemList_isCurrentItemEnabled.call(this);
        };

        // 4) 最终校验：允许在菜单里使用收藏品
        const _Game_Party_canUse = Game_Party.prototype.canUse;
        Game_Party.prototype.canUse = function(item) {
            if (item && isCollectibleItem(item) && isInItemScene()) {
                return true;
            }
            return _Game_Party_canUse.call(this, item);
        };
    }

    // ==================== 场景类 ====================

    function Scene_CollectibleCabinet() {
        this.initialize(...arguments);
    }

    Scene_CollectibleCabinet.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_CollectibleCabinet.prototype.constructor = Scene_CollectibleCabinet;

    Scene_CollectibleCabinet.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._background = "CabinetBG";
        this._sprites = [];
        this._draggingSprite = null;
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
        this._helpVisible = PARAM.helpVisible;
    };

    Scene_CollectibleCabinet.prototype.prepare = function(background) {
        this._background = background || "CabinetBG";
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
        const items = this.getCollectibleItems();
        const cols = PARAM.columns;

        const centerX = Graphics.boxWidth  / 2 + PARAM.offsetX;
        const centerY = Graphics.boxHeight / 2 + PARAM.offsetY;

        let index = 0;
        for (const item of items) {
            const pos = $gameSystem.getCollectiblePosition(item.id);

            let x, y;
            if (pos) {
                x = pos.x;
                y = pos.y;
            } else {
                const row = Math.floor(index / cols);
                const col = index % cols;
                const itemsInRow = Math.min(cols, items.length - row * cols);
                const rowOffset = (col - (itemsInRow - 1) / 2) * PARAM.spacingX;
                x = centerX + rowOffset;
                y = centerY + (row - 0.5) * PARAM.spacingY;
            }

            const sprite = new Sprite();
            sprite.bitmap = ImageManager.loadPicture(item.picture);
            sprite.x = x;
            sprite.y = y;
            sprite._itemId = item.id;
            sprite._pictureName = item.picture;

            sprite.scale.x = PARAM.scale;
            sprite.scale.y = PARAM.scale;

            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;

            this.addChild(sprite);
            this._sprites.push({
                itemId: item.id,
                sprite: sprite,
                data: item
            });

            index++;
        }
    };

    Scene_CollectibleCabinet.prototype.getCollectibleItems = function() {
        const items = [];
        const allItems = $dataItems.concat($dataWeapons, $dataArmors);

        for (const item of allItems) {
            if (!item) continue;
            if (!item.meta) continue;
            if (!item.meta.Collectible) continue;
            if (!$gameParty.hasItem(item)) continue;

            const pictureName = String(item.meta.Collectible).trim();
            if (!pictureName) continue;

            items.push({
                id: item.id,
                picture: pictureName,
                name: item.name
            });
        }

        return items;
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
                    this._draggingSprite._itemId,
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

    PluginManager.registerCommand(pluginName, "OpenCabinet", args => {
        const background = args.Background || "CabinetBG";
        SceneManager.push(Scene_CollectibleCabinet);
        SceneManager.prepareNextScene(background);
    });

    // ==================== 收藏品查看功能 ====================

    // ---------- 在菜单场景内叠加显示图片，不切换场景 ----------
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

    // 在 Scene_Item 上添加显示/隐藏图片的方法
    Scene_Item.prototype.showCollectiblePicture = function(pictureName) {
        // 如果已经有图片在显示，先移除（避免叠加）
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

    // 覆写 Scene_Item 的 update：有图片显示时，任意确定/取消键都关闭图片，并拦截菜单输入
    const _Scene_Item_update = Scene_Item.prototype.update;
    Scene_Item.prototype.update = function() {
        if (this._collectibleSprite) {
            // 只处理关闭逻辑，不往下传，避免菜单同时响应
            if (Input.isTriggered("cancel") || Input.isTriggered("escape") ||
                Input.isTriggered("ok") || TouchInput.isCancelled() ||
                TouchInput.isTriggered()) {
                this.hideCollectiblePicture();
            }
            // 仍然刷新菜单动画，但不处理输入
            Window.prototype.update.call(this._itemWindow);
            Window.prototype.update.call(this._helpWindow);
            return;
        }
        _Scene_Item_update.call(this);
    };

})();