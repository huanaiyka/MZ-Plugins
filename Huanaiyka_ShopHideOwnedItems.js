/*:
 * @target MZ
 * @plugindesc 商店自动隐藏已拥有物品 (支持备注标签)
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * 
 * @param filterConsumables
 * @text 过滤消耗品
 * @desc 是否自动隐藏已拥有的消耗品（如药水）？
 * @type boolean
 * @default false
 * 
 * @param filterKeyItems
 * @text 过滤重要物品
 * @desc 是否自动隐藏已拥有的重要物品？
 * @type boolean
 * @default false
 * 
 * @param filterHiddenItemsA
 * @text 过滤隐藏物品A
 * @desc 是否自动隐藏已拥有的隐藏物品A（RMMZ自带分类）？
 * @type boolean
 * @default false
 * 
 * @param filterHiddenItemsB
 * @text 过滤隐藏物品B
 * @desc 是否自动隐藏已拥有的隐藏物品B（RMMZ自带分类）？
 * @type boolean
 * @default false
 * 
 * @param filterWeapons
 * @text 过滤武器
 * @desc 是否自动隐藏已拥有的武器？
 * @type boolean
 * @default false
 * 
 * @param filterArmors
 * @text 过滤防具
 * @desc 是否自动隐藏已拥有的防具？
 * @type boolean
 * @default false
 * 
 * @param forcedHideItems
 * @text 强制隐藏：道具
 * @desc 在此列表中的道具，拥有时必定隐藏。
 * @type item[]
 * @default []
 * 
 * @param forcedHideWeapons
 * @text 强制隐藏：武器
 * @desc 在此列表中的武器，拥有时必定隐藏。
 * @type weapon[]
 * @default []
 * 
 * @param forcedHideArmors
 * @text 强制隐藏：防具
 * @desc 在此列表中的防具，拥有时必定隐藏。
 * @type armor[]
 * @default []
 * 
 * @help
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 本插件可以让商店在浏览商品时，自动隐藏玩家已经拥有的物品，
 * 避免重复购买，实现某些商品只能获得唯一的一个。
 * 
 * ============================================================================
 * 备注标签 (Notetags)
 * ============================================================================
 * 在 数据库 -> 道具 / 武器 / 防具 的【备注】栏中填入以下标签：
 * 
 * 1. 绝不隐藏（白名单/例外）：
 *    <ShopNoHide>
 *    即使开启了对应分类的过滤，或者在强制隐藏列表中，只要拥有此标签，
 *    已拥有的物品也【绝不隐藏】。
 * 
 * 2. 拥有一律隐藏（黑名单）：
 *    <ShopHideOwned>
 *    无需在插件参数里配置，只要拥有此标签且玩家包里有该物品，【必定隐藏】。
 * 
 * ============================================================================
 * 优先级顺序
 * ============================================================================
 * 未拥有该物品 -> 正常显示
 * 已拥有该物品 -> 检查标签 <ShopNoHide>（若有则显示）
 *              -> 检查标签 <ShopHideOwned>（若有则隐藏）
 *              -> 检查插件参数强制隐藏列表（若在列表中则隐藏）
 *              -> 检查大类过滤设置（如重要物品、装备等）
 * 
 * ============================================================================
 * 注意事项
 * ============================================================================
 * 购买商品后，列表会自动刷新，刚买的物品会立即消失（如果满足隐藏条件）。
 * 该插件默认安装后没有任何功能，请根据需要设置参数或添加备注标签。
 */

(() => {
    const pluginName = "Huanaiyka_ShopHideOwnedItems";
    const parameters = PluginManager.parameters(pluginName);

    const config = {
        filterConsumables: parameters["filterConsumables"] === "true",
        filterKeyItems: parameters["filterKeyItems"] === "true",
        filterHiddenItemsA: parameters["filterHiddenItemsA"] === "true",
        filterHiddenItemsB: parameters["filterHiddenItemsB"] === "true",
        filterWeapons: parameters["filterWeapons"] === "true",
        filterArmors: parameters["filterArmors"] === "true",
        forcedHideItems: JSON.parse(parameters["forcedHideItems"] || "[]").map(Number),
        forcedHideWeapons: JSON.parse(parameters["forcedHideWeapons"] || "[]").map(Number),
        forcedHideArmors: JSON.parse(parameters["forcedHideArmors"] || "[]").map(Number)
    };

    // 检查是否包含不隐藏标签 <ShopNoHide>
    const isExemptedByNote = function(item) {
        if (!item || !item.note) return false;
        return /<ShopNoHide>/i.test(item.note);
    };

    // 检查是否包含强制隐藏标签 <ShopHideOwned>
    const isForcedByNote = function(item) {
        if (!item || !item.note) return false;
        return /<ShopHideOwned>/i.test(item.note);
    };

    // 检查是否在插件参数配置的强制隐藏列表中
    const isForcedHiddenByParam = function(item) {
        if (!item) return false;
        if (DataManager.isItem(item)) return config.forcedHideItems.includes(item.id);
        if (DataManager.isWeapon(item)) return config.forcedHideWeapons.includes(item.id);
        if (DataManager.isArmor(item)) return config.forcedHideArmors.includes(item.id);
        return false;
    };

    const shouldHideItem = function(item) {
        if (!item) return true;
        // 如果玩家没有这个物品，不隐藏
        if (!$gameParty.hasItem(item)) return false;

        // 1. 备注中含有 <ShopNoHide> 标签，优先级最高，强制显示
        if (isExemptedByNote(item)) return false;

        // 2. 备注中含有 <ShopHideOwned> 标签
        if (isForcedByNote(item)) return true;

        // 3. 在插件参数配置的强制隐藏列表中
        if (isForcedHiddenByParam(item)) return true;

        // 4. 根据类型参数设置判断
        if (DataManager.isItem(item)) {
            const itypeId = item.itypeId;
            if (itypeId === 1) return config.filterConsumables;
            if (itypeId === 2) return config.filterKeyItems;
            if (itypeId === 3) return config.filterHiddenItemsA;
            if (itypeId === 4) return config.filterHiddenItemsB;
            return false;
        }

        if (DataManager.isWeapon(item)) {
            return config.filterWeapons;
        }

        if (DataManager.isArmor(item)) {
            return config.filterArmors;
        }

        return false;
    };

    const _Window_ShopBuy_makeItemList = Window_ShopBuy.prototype.makeItemList;
    Window_ShopBuy.prototype.makeItemList = function() {
        _Window_ShopBuy_makeItemList.call(this);

        var filteredData = [];
        var filteredPrices = [];
        for (var i = 0; i < this._data.length; i++) {
            var item = this._data[i];
            if (!shouldHideItem(item)) {
                filteredData.push(item);
                filteredPrices.push(this._price[i]);
            }
        }

        this._data = filteredData;
        this._price = filteredPrices;
    };

    const _Scene_Shop_onBuyOk = Scene_Shop.prototype.onBuyOk;
    Scene_Shop.prototype.onBuyOk = function() {
        _Scene_Shop_onBuyOk.call(this);
        if (this._shopWindow && this._shopWindow.refresh) {
            this._shopWindow.refresh();
        }
    };

    const _Window_ShopBuy_refresh = Window_ShopBuy.prototype.refresh;
    Window_ShopBuy.prototype.refresh = function() {
        this.makeItemList();
        _Window_ShopBuy_refresh.call(this);
    };

})();