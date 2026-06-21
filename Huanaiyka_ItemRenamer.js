/*:
 * @target MZ
 * @plugindesc 永久更改道具/武器/防具的名称和说明文，保存至存档
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ██████ 功能概述 ██████
 * 这个插件允许你在游戏中永久修改物品、武器、防具的「名称」和「说明文」。
 * 修改后的内容会保存在存档中，读档后依然有效，且所有显示位置（菜单、商店、图鉴、帮助窗口等）都会自动更新。
 *
 * ██████ 插件命令 ██████
 * ─── 修改名称 ───
 *   RenameItem   itemId 新名称      // 修改物品名称
 *   RenameWeapon weaponId 新名称     // 修改武器名称
 *   RenameArmor  armorId 新名称      // 修改防具名称
 *
 * ─── 修改说明文 ───
 *   RenameItemDesc   itemId 新说明文   // 修改物品说明
 *   RenameWeaponDesc weaponId 新说明文  // 修改武器说明
 *   RenameArmorDesc  armorId 新说明文   // 修改防具说明
 *
 * ██████ 使用示例 ██████
 *   RenameItem 5 勇者之剑              // 将5号物品改名为“勇者之剑”
 *   RenameItemDesc 5 一把传说中的圣剑    // 将5号物品的说明改为“一把传说中的圣剑”
 *   RenameWeapon 3 "传说之弓"           // 武器名带空格时需要用英文引号括起来
 *   RenameArmorDesc 1 "龙鳞制成的铠甲，防御力极高"
 *
 * ██████ 注意事项（非常重要！） ██████
 * 1. 如果新名称或新说明文中包含空格，必须用英文双引号括起来，例如：
 *       RenameItem 5 "传说中的 圣剑"
 *    否则插件会错误解析参数，导致改名失败或只取空格前的部分。
 * 2. 修改的内容保存在存档中，因此：
 *       ✓ 读档后修改效果依然存在
 *       ✗ 新开始的游戏不会继承旧存档的修改（除非在游戏开始时重新执行一次插件命令）
 * 3. 若要恢复原名或原说明，可将新内容设为空字符串，例如：
 *       RenameItem 5 ""          // 清除改名，恢复数据库原名
 *       RenameItemDesc 5 ""       // 清除改说明，恢复数据库原说明
 * 4. 插件通过劫持绘制方法实现，因此兼容性极好。只要游戏窗口使用标准的 drawItemName 和 Window_Help 显示，就能自动生效。
 *    目前已知与 NUUN_ItemBook 图鉴插件完全兼容（请将该插件置于 NUUN_ItemBook 之后）。
 *
 * ██████ 原理说明（写给开发者） ██████
 * 1. 数据存储：在 Game_System 中新增两个对象 _renamedItemNames 和 _renamedItemDescs，
 *    以 `${type}${id}` 为键（如 "i5"）保存修改后的内容。这些对象随存档一起保存/加载。
 * 2. 名称修改：覆盖 Window_Base.drawItemName 方法，绘制时从存档中获取替换后的名称。
 * 3. 说明文修改：覆盖 Window_Help.setItem 方法，在调用原方法后，检查是否有存档中的说明，
 *    若有则调用 this.setText() 替换显示文本。
 * 4. 由于修改发生在绘制层，数据库原始数据始终不变，因此不会与其他插件产生冲突。
 *
 * ██████ 高级脚本调用 ██████
 *   // 修改名称
 *   $gameSystem.setRenamedItemName('i', itemId, '新名称');   // i=物品, w=武器, a=防具
 *   $gameSystem.getRenamedItemName('i', itemId);             // 获取名称
 *
 *   // 修改说明
 *   $gameSystem.setRenamedItemDesc('i', itemId, '新说明');
 *   $gameSystem.getRenamedItemDesc('i', itemId);
 *
 * @command RenameItem
 * @text 修改物品名称
 * @desc 永久修改指定ID的物品名称
 * @arg itemId
 * @type item
 * @text 物品ID
 * @desc 物品ID
 * @arg newName
 * @type string
 * @text 新名称
 * @desc 新名称（如需空格请用英文引号括起）
 *
 * @command RenameWeapon
 * @text 修改武器名称
 * @desc 永久修改指定ID的武器名称
 * @arg itemId
 * @type weapon
 * @text 武器ID
 * @desc 武器ID
 * @arg newName
 * @type string
 * @text 新名称
 * @desc 新名称（如需空格请用英文引号括起）
 *
 * @command RenameArmor
 * @text 修改防具名称
 * @desc 永久修改指定ID的防具名称
 * @arg itemId
 * @type armor
 * @text 防具ID
 * @desc 防具ID
 * @arg newName
 * @type string
 * @text 新名称
 * @desc 新名称（如需空格请用英文引号括起）
 *
 * @command RenameItemDesc
 * @text 修改物品说明文
 * @desc 永久修改指定ID的物品说明文
 * @arg itemId
 * @type item
 * @text 物品ID
 * @desc 物品ID
 * @arg newDesc
 * @type string
 * @text 新说明文
 * @desc 新说明文（如需空格请用英文引号括起）
 *
 * @command RenameWeaponDesc
 * @text 修改武器说明文
 * @desc 永久修改指定ID的武器说明文
 * @arg itemId
 * @type weapon
 * @text 武器ID
 * @desc 武器ID
 * @arg newDesc
 * @type string
 * @text 新说明文
 * @desc 新说明文（如需空格请用英文引号括起）
 *
 * @command RenameArmorDesc
 * @text 修改防具说明文
 * @desc 永久修改指定ID的防具说明文
 * @arg itemId
 * @type armor
 * @text 防具ID
 * @desc 防具ID
 * @arg newDesc
 * @type string
 * @text 新说明文
 * @desc 新说明文（如需空格请用英文引号括起）
 */

(() => {
    const pluginName = 'Huanaiyka_ItemRenamer';

    // ------------------------------------------------------------
    // Game_System 扩展：保存改名映射 + 改说明映射
    // ------------------------------------------------------------
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._renamedItemNames = {}; // 名称存储 { "i5": "新名字", ... }
        this._renamedItemDescs = {}; // 说明存储 { "i5": "新说明", ... }
    };

    // ---- 名称操作 ----
    Game_System.prototype.setRenamedItemName = function(type, id, newName) {
        if (!this._renamedItemNames) this._renamedItemNames = {};
        const key = type + id;
        if (newName && newName.trim() !== '') {
            this._renamedItemNames[key] = String(newName);
        } else {
            delete this._renamedItemNames[key]; // 空字符串表示清除
        }
    };

    Game_System.prototype.getRenamedItemName = function(type, id) {
        if (!this._renamedItemNames) return null;
        return this._renamedItemNames[type + id] || null;
    };

    // ---- 说明操作 ----
    Game_System.prototype.setRenamedItemDesc = function(type, id, newDesc) {
        if (!this._renamedItemDescs) this._renamedItemDescs = {};
        const key = type + id;
        if (newDesc && newDesc.trim() !== '') {
            this._renamedItemDescs[key] = String(newDesc);
        } else {
            delete this._renamedItemDescs[key];
        }
    };

    Game_System.prototype.getRenamedItemDesc = function(type, id) {
        if (!this._renamedItemDescs) return null;
        return this._renamedItemDescs[type + id] || null;
    };

    // ------------------------------------------------------------
    // 插件命令注册（名称修改）
    // ------------------------------------------------------------
    PluginManager.registerCommand(pluginName, 'RenameItem', args => {
        const itemId = Number(args.itemId);
        const newName = String(args.newName);
        $gameSystem.setRenamedItemName('i', itemId, newName);
    });

    PluginManager.registerCommand(pluginName, 'RenameWeapon', args => {
        const weaponId = Number(args.itemId);
        const newName = String(args.newName);
        $gameSystem.setRenamedItemName('w', weaponId, newName);
    });

    PluginManager.registerCommand(pluginName, 'RenameArmor', args => {
        const armorId = Number(args.itemId);
        const newName = String(args.newName);
        $gameSystem.setRenamedItemName('a', armorId, newName);
    });

    // ------------------------------------------------------------
    // 插件命令注册（说明修改）
    // ------------------------------------------------------------
    PluginManager.registerCommand(pluginName, 'RenameItemDesc', args => {
        const itemId = Number(args.itemId);
        const newDesc = String(args.newDesc);
        $gameSystem.setRenamedItemDesc('i', itemId, newDesc);
    });

    PluginManager.registerCommand(pluginName, 'RenameWeaponDesc', args => {
        const weaponId = Number(args.itemId);
        const newDesc = String(args.newDesc);
        $gameSystem.setRenamedItemDesc('w', weaponId, newDesc);
    });

    PluginManager.registerCommand(pluginName, 'RenameArmorDesc', args => {
        const armorId = Number(args.itemId);
        const newDesc = String(args.newDesc);
        $gameSystem.setRenamedItemDesc('a', armorId, newDesc);
    });

    // ------------------------------------------------------------
    // 覆盖 Window_Base.drawItemName 使名称生效
    // ------------------------------------------------------------
    const _Window_Base_drawItemName = Window_Base.prototype.drawItemName;
    Window_Base.prototype.drawItemName = function(item, x, y, width) {
        if (!item) return;

        let type = null;
        if (DataManager.isItem(item)) type = 'i';
        else if (DataManager.isWeapon(item)) type = 'w';
        else if (DataManager.isArmor(item)) type = 'a';

        let displayName = item.name;
        if (type && $gameSystem) {
            const renamed = $gameSystem.getRenamedItemName(type, item.id);
            if (renamed) displayName = renamed;
        }

        const iconY = y + (this.lineHeight() - ImageManager.iconHeight) / 2;
        const textMargin = item.iconIndex > 0 ? ImageManager.iconWidth + 4 : 0;
        const itemWidth = Math.max(0, width - textMargin);
        if (item.iconIndex > 0) {
            this.drawIcon(item.iconIndex, x, iconY);
        }
        this.drawText(displayName, x + textMargin, y, itemWidth);
    };

    // ------------------------------------------------------------
    // 覆盖 Window_Help.setItem 使说明文生效
    // ------------------------------------------------------------
    const _Window_Help_setItem = Window_Help.prototype.setItem;
    Window_Help.prototype.setItem = function(item) {
        _Window_Help_setItem.call(this, item);
        if (!item) return;

        let type = null;
        if (DataManager.isItem(item)) type = 'i';
        else if (DataManager.isWeapon(item)) type = 'w';
        else if (DataManager.isArmor(item)) type = 'a';

        if (type && $gameSystem) {
            const renamedDesc = $gameSystem.getRenamedItemDesc(type, item.id);
            if (renamedDesc) {
                this.setText(renamedDesc); // 覆盖为存档中的说明文
            }
        }
    };
})();