/*:
 * @target MZ
 * @plugindesc 永久更改道具/武器/防具的名称和说明文，直接修改数据库，保存至存档
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ██████ 功能概述 ██████
 * 本插件直接修改内存中的数据库条目，所有窗口自动显示修改后的名称和说明。
 * 修改记录保存在存档中，读档后自动恢复。
 *
 * ██████ 插件命令 ██████
 *   RenameItem   itemId 新名称
 *   RenameWeapon weaponId 新名称
 *   RenameArmor  armorId 新名称
 *   RenameItemDesc   itemId 新说明
 *   RenameWeaponDesc weaponId 新说明
 *   RenameArmorDesc  armorId 新说明
 *
 * ██████ 换行说明 ██████
 * 在说明中使用 \n 换行，例如：
 *   RenameItemDesc 5 "第一行\n第二行\n第三行"
 * 注意：必须用英文双引号括起来，且 \n 为反斜杠加 n。
 *
 * ██████ 清除修改 ██████
 * 传入空字符串（带引号）可恢复原始内容：
 *   RenameItem 5 ""
 *   RenameItemDesc 5 ""
 *
 * ██████ 脚本调用（无需引号） ██████
 *   $gameSystem.setRenamedItemName('i', id, '新名称');
 *   $gameSystem.setRenamedItemDesc('i', id, '新说明');
 *
 * @command RenameItem
 * @text 修改物品名称
 * @arg itemId
 * @type item
 * @text 物品ID
 * @arg newName
 * @type string
 * @text 新名称
 *
 * @command RenameWeapon
 * @text 修改武器名称
 * @arg itemId
 * @type weapon
 * @text 武器ID
 * @arg newName
 * @type string
 * @text 新名称
 *
 * @command RenameArmor
 * @text 修改防具名称
 * @arg itemId
 * @type armor
 * @text 防具ID
 * @arg newName
 * @type string
 * @text 新名称
 *
 * @command RenameItemDesc
 * @text 修改物品说明
 * @arg itemId
 * @type item
 * @text 物品ID
 * @arg newDesc
 * @type string
 * @text 新说明
 *
 * @command RenameWeaponDesc
 * @text 修改武器说明
 * @arg itemId
 * @type weapon
 * @text 武器ID
 * @arg newDesc
 * @type string
 * @text 新说明
 *
 * @command RenameArmorDesc
 * @text 修改防具说明
 * @arg itemId
 * @type armor
 * @text 防具ID
 * @arg newDesc
 * @type string
 * @text 新说明
 */

(() => {
    const pluginName = 'Huanaiyka_ItemRenamer';

    // ---------- 辅助：将字符串中的 \n 转义为数据库可识别的换行符 ----------
    function escapeNewlines(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/\\n/g, '\n').replace(/\\\\n/g, '\\n');
    }

    // ---------- 获取数据数组 ----------
    function getDataArray(type) {
        if (type === 'i') return $dataItems;
        if (type === 'w') return $dataWeapons;
        if (type === 'a') return $dataArmors;
        return null;
    }

    // ---------- Game_System 扩展 ----------
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._renamedItemNames = {};
        this._renamedItemDescs = {};
        this._originalItemNames = {};
        this._originalItemDescs = {};
    };

    // ---------- 应用所有修改到数据库 ----------
    Game_System.prototype.applyAllRenames = function() {
        const types = ['i', 'w', 'a'];
        types.forEach(type => {
            const data = getDataArray(type);
            if (!data) return;
            Object.keys(this._renamedItemNames || {}).forEach(key => {
                if (key.startsWith(type)) {
                    const id = parseInt(key.slice(1));
                    const newName = this._renamedItemNames[key];
                    if (data[id]) {
                        if (!this._originalItemNames[key]) {
                            this._originalItemNames[key] = data[id].name;
                        }
                        data[id].name = newName;
                    }
                }
            });
            Object.keys(this._renamedItemDescs || {}).forEach(key => {
                if (key.startsWith(type)) {
                    const id = parseInt(key.slice(1));
                    const newDesc = this._renamedItemDescs[key];
                    if (data[id]) {
                        if (!this._originalItemDescs[key]) {
                            this._originalItemDescs[key] = data[id].description;
                        }
                        data[id].description = newDesc;
                    }
                }
            });
        });
    };

    // ---------- 恢复原始值 ----------
    Game_System.prototype.restoreOriginal = function(type, id) {
        const key = type + id;
        const data = getDataArray(type);
        if (!data || !data[id]) return;
        if (this._originalItemNames[key]) {
            data[id].name = this._originalItemNames[key];
            delete this._originalItemNames[key];
        }
        if (this._originalItemDescs[key]) {
            data[id].description = this._originalItemDescs[key];
            delete this._originalItemDescs[key];
        }
    };

    // ---------- 设置名称 ----------
    Game_System.prototype.setRenamedItemName = function(type, id, newName) {
        const key = type + id;
        const data = getDataArray(type);
        if (!data || !data[id]) return;
        if (!this._originalItemNames[key]) {
            this._originalItemNames[key] = data[id].name;
        }
        if (newName && newName.trim() !== '') {
            const trimmed = newName.trim();
            this._renamedItemNames[key] = trimmed;
            data[id].name = trimmed;
        } else {
            delete this._renamedItemNames[key];
            if (this._originalItemNames[key]) {
                data[id].name = this._originalItemNames[key];
                delete this._originalItemNames[key];
            }
        }
    };

    // ---------- 设置说明 ----------
    Game_System.prototype.setRenamedItemDesc = function(type, id, newDesc) {
        const key = type + id;
        const data = getDataArray(type);
        if (!data || !data[id]) return;
        if (!this._originalItemDescs[key]) {
            this._originalItemDescs[key] = data[id].description;
        }
        if (newDesc && newDesc.trim() !== '') {
            const processed = escapeNewlines(newDesc.trim());
            this._renamedItemDescs[key] = processed;
            data[id].description = processed;
        } else {
            delete this._renamedItemDescs[key];
            if (this._originalItemDescs[key]) {
                data[id].description = this._originalItemDescs[key];
                delete this._originalItemDescs[key];
            }
        }
    };

    // ---------- 获取方法 ----------
    Game_System.prototype.getRenamedItemName = function(type, id) {
        return this._renamedItemNames[type + id] || null;
    };
    Game_System.prototype.getRenamedItemDesc = function(type, id) {
        return this._renamedItemDescs[type + id] || null;
    };

    // ---------- 插件命令注册 ----------
    function registerCommandAliases(commandName, func) {
        PluginManager.registerCommand(pluginName, commandName, func);
        PluginManager.registerCommand(pluginName, commandName.toLowerCase(), func);
    }

    function makeNameHandler(type) {
        return args => {
            const id = Number(args.itemId);
            const newName = String(args.newName || '');
            $gameSystem.setRenamedItemName(type, id, newName);
        };
    }
    function makeDescHandler(type) {
        return args => {
            const id = Number(args.itemId);
            const newDesc = String(args.newDesc || '');
            $gameSystem.setRenamedItemDesc(type, id, newDesc);
        };
    }

    registerCommandAliases('RenameItem', makeNameHandler('i'));
    registerCommandAliases('RenameWeapon', makeNameHandler('w'));
    registerCommandAliases('RenameArmor', makeNameHandler('a'));
    registerCommandAliases('RenameItemDesc', makeDescHandler('i'));
    registerCommandAliases('RenameWeaponDesc', makeDescHandler('w'));
    registerCommandAliases('RenameArmorDesc', makeDescHandler('a'));

    // ---------- 读档后自动应用修改 ----------
const _DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    // 确保旧存档具有插件所需的属性
    if ($gameSystem) {
        if (!$gameSystem._renamedItemNames) $gameSystem._renamedItemNames = {};
        if (!$gameSystem._renamedItemDescs) $gameSystem._renamedItemDescs = {};
        if (!$gameSystem._originalItemNames) $gameSystem._originalItemNames = {};
        if (!$gameSystem._originalItemDescs) $gameSystem._originalItemDescs = {};
    }
    if ($gameSystem && $gameSystem.applyAllRenames) {
        $gameSystem.applyAllRenames();
    }
};
    // ---------- 新游戏时应用修改 ----------
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        if ($gameSystem && $gameSystem.applyAllRenames) {
            $gameSystem.applyAllRenames();
        }
    };

    // ---------- 劫持 Window_Help.setItem 强制使用 setText 保证换行 ----------
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
                this.setText(renamedDesc);
                if (this.refresh) this.refresh();
            }
        }
    };

    // ---------- 兼容旧存档 ----------
    const _Game_System_initialize_old = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize_old.call(this);
        if (!this._renamedItemNames) this._renamedItemNames = {};
        if (!this._renamedItemDescs) this._renamedItemDescs = {};
        if (!this._originalItemNames) this._originalItemNames = {};
        if (!this._originalItemDescs) this._originalItemDescs = {};
    };
})();