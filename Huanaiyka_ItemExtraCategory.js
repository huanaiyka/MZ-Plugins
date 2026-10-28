/*:
 * @target MZ
 * @plugindesc 在物品分类栏右侧添加任意数量的额外分类
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================
 *  功能简介
 * ============================================================
 * 本插件允许你在物品界面的分类栏中，额外添加任意数量的自定义分类。
 * 每个分类都可以通过插件指令单独控制显示或隐藏。
 * 道具是否属于某个额外分类，由数据库备注中的标签决定。
 * ============================================================
 *  使用方法
 * ============================================================
 * 1. 在插件参数「额外分类列表」里添加分类，每个分类包含：
 *      名称      显示在标签栏上的文字，例如「收藏」
 *      符号      内部唯一标识（英文），例如 extra
 *      标签      写在道具备注里的 notetag，例如 ExtraCategory
 *      图标      可选图标索引，0 表示不显示
 *      默认显示  游戏开始时是否显示该分类
 *
 * 2. 在数据库的物品/武器/防具/重要物品的「备注」里写：
 *      <你的标签>
 *    例如 <ExtraCategory>，该道具就会被归入对应分类。
 *
 * 3. 插件指令（对指定符号的分类操作）：
 *      Huanaiyka_ItemExtraCategory show   extra
 *      Huanaiyka_ItemExtraCategory hide   extra
 *      Huanaiyka_ItemExtraCategory toggle extra
 *      Huanaiyka_ItemExtraCategory showAll
 *      Huanaiyka_ItemExtraCategory hideAll
 *
 * 4. 默认不干涉原版行为；只有显示的分类才会出现在标签栏。
 *
 * 5. 参数「重要物品不再出现在原版分类」：
 *      开启后，凡是带有任意额外分类标签的重要物品，
 *      将不再出现在原版的“物品选择处理”的“重要物品”中。
 * ============================================================
 *
 * @param categories
 * @text 额外分类列表
 * @desc 在此添加任意数量的额外分类。
 * @type struct<Category>[]
 * @default []
 *
 * @param excludeKeyItemsFromOriginal
 * @text 重要物品不再出现在“物品选择处理”的“重要物品”中。
 * @desc 开启后，带有任意额外分类标签的重要物品，将不再显示在原版“物品选择处理”的“重要物品”中。
 * @type boolean
 * @default false
 *
 * @command show
 * @text 显示分类
 * @desc 显示指定符号的分类。
 *
 * @arg symbol
 * @text 分类符号
 * @desc 要显示的分类符号。
 * @default extra
 *
 * @command hide
 * @text 隐藏分类
 * @desc 隐藏指定符号的分类。
 *
 * @arg symbol
 * @text 分类符号
 * @desc 要隐藏的分类符号。
 * @default extra
 *
 * @command toggle
 * @text 切换分类
 * @desc 切换指定符号的分类显示状态。
 *
 * @arg symbol
 * @text 分类符号
 * @desc 要切换的分类符号。
 * @default extra
 *
 * @command showAll
 * @text 显示全部分类
 * @desc 显示所有额外分类。
 *
 * @command hideAll
 * @text 隐藏全部分类
 * @desc 隐藏所有额外分类。
 */

/*~struct~Category:
 * @param name
 * @text 名称
 * @desc 显示在标签栏上的文字。
 * @default 收藏
 *
 * @param symbol
 * @text 符号
 * @desc 内部唯一标识（英文）。
 * @default extra
 *
 * @param tag
 * @text 标签
 * @desc 道具备注里的 notetag。
 * @default ExtraCategory
 *
 * @param icon
 * @text 图标
 * @desc 图标索引，0 表示不显示。
 * @type number
 * @default 0
 *
 * @param visible
 * @text 默认显示
 * @type boolean
 * @default false
 */

(() => {
    'use strict';

    const PLUGIN_NAME = 'Huanaiyka_ItemExtraCategory';

    //-------------------------------------------------------------------------
    // 解析插件参数（增强兼容性）
    //-------------------------------------------------------------------------
    const params = PluginManager.parameters(PLUGIN_NAME);

    function parseCategories(raw) {
        if (!raw) return [];
        try {
            const parsedArray = JSON.parse(raw);
            if (!Array.isArray(parsedArray)) return [];
            
            return parsedArray.map(entry => {
                const obj = typeof entry === 'string' ? JSON.parse(entry) : entry;
                return {
                    name: obj.name || '收藏',
                    symbol: obj.symbol || 'extra',
                    tag: obj.tag || 'ExtraCategory',
                    icon: Number(obj.icon || 0),
                    visible: String(obj.visible) === 'true'
                };
            });
        } catch (e) {
            console.error('Huanaiyka_ItemExtraCategory: 参数解析失败', e);
            return [];
        }
    }

    const CATEGORIES = parseCategories(params['categories']);
    const EXCLUDE_KEY_ITEMS_FROM_ORIGINAL = String(params['excludeKeyItemsFromOriginal']) === 'true';

    //-------------------------------------------------------------------------
    // 数据持久化（存入 $gameSystem 中，确保存档有效）
    //-------------------------------------------------------------------------
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._itemExtraCategoryVisibility = {};
        for (const cat of CATEGORIES) {
            this._itemExtraCategoryVisibility[cat.symbol] = cat.visible;
        }
    };

    function getVisibilityMap() {
        if (!$gameSystem) {
            const map = {};
            for (const cat of CATEGORIES) map[cat.symbol] = cat.visible;
            return map;
        }
        if (!$gameSystem._itemExtraCategoryVisibility) {
            $gameSystem._itemExtraCategoryVisibility = {};
            for (const cat of CATEGORIES) {
                $gameSystem._itemExtraCategoryVisibility[cat.symbol] = cat.visible;
            }
        }
        return $gameSystem._itemExtraCategoryVisibility;
    }

    //-------------------------------------------------------------------------
    // 工具函数
    //-------------------------------------------------------------------------
    function getCategoryBySymbol(symbol) {
        return CATEGORIES.find(c => c.symbol === symbol);
    }

    function isCategoryVisible(symbol) {
        return !!getVisibilityMap()[symbol];
    }

    function isExtraCategoryItem(item, tag) {
        if (!item) return false;
        return item.meta && item.meta[tag] !== undefined;
    }

    function isItemInAnyExtraCategory(item) {
        if (!item) return false;
        return CATEGORIES.some(cat => isExtraCategoryItem(item, cat.tag));
    }

    function refreshItemScene() {
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Item) {
            if (scene._categoryWindow) scene._categoryWindow.refresh();
            if (scene._itemWindow) scene._itemWindow.refresh();
        }
    }

    //-------------------------------------------------------------------------
    // 插件指令
    //-------------------------------------------------------------------------
    PluginManager.registerCommand(PLUGIN_NAME, 'show', args => {
        if (getCategoryBySymbol(args.symbol)) {
            getVisibilityMap()[args.symbol] = true;
            refreshItemScene();
        }
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'hide', args => {
        if (getCategoryBySymbol(args.symbol)) {
            getVisibilityMap()[args.symbol] = false;
            refreshItemScene();
        }
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'toggle', args => {
        if (getCategoryBySymbol(args.symbol)) {
            const map = getVisibilityMap();
            map[args.symbol] = !map[args.symbol];
            refreshItemScene();
        }
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'showAll', () => {
        const map = getVisibilityMap();
        for (const cat of CATEGORIES) {
            map[cat.symbol] = true;
        }
        refreshItemScene();
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'hideAll', () => {
        const map = getVisibilityMap();
        for (const cat of CATEGORIES) {
            map[cat.symbol] = false;
        }
        refreshItemScene();
    });

    //-------------------------------------------------------------------------
    // 当前显示中的分类列表
    //-------------------------------------------------------------------------
    function activeCategories() {
        return CATEGORIES.filter(cat => isCategoryVisible(cat.symbol));
    }

    //-------------------------------------------------------------------------
    // 扩展 Window_ItemCategory：添加额外分类及支持图标绘制
    //-------------------------------------------------------------------------
    const _Window_ItemCategory_makeCommandList = Window_ItemCategory.prototype.makeCommandList;
    Window_ItemCategory.prototype.makeCommandList = function() {
        _Window_ItemCategory_makeCommandList.call(this);

        for (const cat of activeCategories()) {
            this.addCommand(cat.name, cat.symbol, true, cat.icon);
        }
    };

    const _Window_ItemCategory_maxCols = Window_ItemCategory.prototype.maxCols;
    Window_ItemCategory.prototype.maxCols = function() {
        const base = _Window_ItemCategory_maxCols.call(this);
        const total = base + activeCategories().length;
        return Math.max(base, total);
    };

    Window_ItemCategory.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        const ext = this._list && this._list[index] ? this._list[index].ext : 0;
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));

        if (ext && ext > 0) {
            this.drawIcon(ext, rect.x, rect.y + (rect.height - ImageManager.iconHeight) / 2);
            const iconWidth = ImageManager.iconWidth + 4;
            this.drawText(this.commandName(index), rect.x + iconWidth, rect.y, rect.width - iconWidth, 'center');
        } else {
            this.drawText(this.commandName(index), rect.x, rect.y, rect.width, 'center');
        }
    };

    //-------------------------------------------------------------------------
    // 扩展判断逻辑
    //-------------------------------------------------------------------------
    const _Window_ItemCategory_includes = Window_ItemCategory.prototype.includes;
    Window_ItemCategory.prototype.includes = function(item) {
        const symbol = this.currentSymbol();
        const cat = getCategoryBySymbol(symbol);
        if (cat) {
            return isExtraCategoryItem(item, cat.tag);
        }

        // 原版重要物品分类：可选排除已归入额外分类的重要物品
        if (EXCLUDE_KEY_ITEMS_FROM_ORIGINAL && symbol === 'keyItem') {
            if (isItemInAnyExtraCategory(item)) {
                return false;
            }
        }

        return _Window_ItemCategory_includes.call(this, item);
    };

    const _Window_ItemList_includes = Window_ItemList.prototype.includes;
    Window_ItemList.prototype.includes = function(item) {
        const cat = getCategoryBySymbol(this._category);
        if (cat) {
            return isExtraCategoryItem(item, cat.tag);
        }

        // 原版重要物品分类：可选排除已归入额外分类的重要物品
        if (EXCLUDE_KEY_ITEMS_FROM_ORIGINAL && this._category === 'keyItem') {
            if (isItemInAnyExtraCategory(item)) {
                return false;
            }
        }

        return _Window_ItemList_includes.call(this, item);
    };

    //-------------------------------------------------------------------------
    // 【新增修复】扩展事件中的“物品选择处理”窗口 (Window_EventItem)
    //-------------------------------------------------------------------------
    if (typeof Window_EventItem !== 'undefined') {
        const _Window_EventItem_includes = Window_EventItem.prototype.includes;
        Window_EventItem.prototype.includes = function(item) {
            if (EXCLUDE_KEY_ITEMS_FROM_ORIGINAL && item && item.itypeId === 2) {
                if (isItemInAnyExtraCategory(item)) {
                    return false;
                }
            }
            return _Window_EventItem_includes ? _Window_EventItem_includes.call(this, item) : true;
        };
    }

    //-------------------------------------------------------------------------
    // 额外分类：跨类型列出所有带标签的道具
    //-------------------------------------------------------------------------
    const _Window_ItemList_makeItemList = Window_ItemList.prototype.makeItemList;
    Window_ItemList.prototype.makeItemList = function() {
        const cat = getCategoryBySymbol(this._category);
        if (cat) {
            this._data = [];
            const pushIf = item => {
                if (isExtraCategoryItem(item, cat.tag) && !this._data.includes(item)) {
                    this._data.push(item);
                }
            };
            for (const item of $gameParty.items()) pushIf(item);
            for (const item of $gameParty.weapons()) pushIf(item);
            for (const item of $gameParty.armors()) pushIf(item);
            return;
        }
        _Window_ItemList_makeItemList.call(this);
    };

})();