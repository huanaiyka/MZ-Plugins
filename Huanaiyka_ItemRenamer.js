/*:
 * @target MZ
 * @plugindesc 永久更改道具/武器/防具的名称和说明文
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 功能概述
 * ============================================================================
 * 本插件直接修改内存中的数据库条目，所有窗口自动显示修改后的名称和说明。
 * 修改记录保存在存档中，读档后自动恢复。
============================================================================
 * 插件指令列表
 * ============================================================================
 *   RenameItem <物品ID> <新名称>          - 修改物品名称
 *   RenameWeapon <武器ID> <新名称>        - 修改武器名称
 *   RenameArmor <防具ID> <新名称>         - 修改防具名称
 *   RenameItemDesc <物品ID> <新说明>      - 修改物品说明
 *   RenameWeaponDesc <武器ID> <新说明>    - 修改武器说明
 *   RenameArmorDesc <防具ID> <新说明>     - 修改防具说明
 *
============================================================================
 * 脚本调用
 * ============================================================================
 *   $gameSystem.setRenamedItemName('i', id, '新名称');
 *   $gameSystem.setRenamedItemDesc('i', id, '新说明');
 *
 * @command RenameItem
 * @text 修改物品名称
 * @desc 修改指定物品的名称，传入空字符串可恢复原名
 * @arg itemId
 * @type item
 * @text 物品ID
 * @desc 选择要修改名称的物品
 * @arg newName
 * @type string
 * @text 新名称
 * @desc 输入新的物品名称，留空或输入""可恢复原名
 *
 * @command RenameWeapon
 * @text 修改武器名称
 * @desc 修改指定武器的名称，传入空字符串可恢复原名
 * @arg itemId
 * @type weapon
 * @text 武器ID
 * @desc 选择要修改名称的武器
 * @arg newName
 * @type string
 * @text 新名称
 * @desc 输入新的武器名称，留空或输入""可恢复原名
 *
 * @command RenameArmor
 * @text 修改防具名称
 * @desc 修改指定防具的名称，传入空字符串可恢复原名
 * @arg itemId
 * @type armor
 * @text 防具ID
 * @desc 选择要修改名称的防具
 * @arg newName
 * @type string
 * @text 新名称
 * @desc 输入新的防具名称，留空或输入""可恢复原名
 *
 * @command RenameItemDesc
 * @text 修改物品说明
 * @desc 修改指定物品的说明文，支持\n换行，传入空字符串可恢复原说明
 * @arg itemId
 * @type item
 * @text 物品ID
 * @desc 选择要修改说明的物品
 * @arg newDesc
 * @type string
 * @text 新说明
 * @desc 输入新的物品说明，可使用\n换行，留空或输入""可恢复原说明
 *
 * @command RenameWeaponDesc
 * @text 修改武器说明
 * @desc 修改指定武器的说明文，支持\n换行，传入空字符串可恢复原说明
 * @arg itemId
 * @type weapon
 * @text 武器ID
 * @desc 选择要修改说明的武器
 * @arg newDesc
 * @type string
 * @text 新说明
 * @desc 输入新的武器说明，可使用\n换行，留空或输入""可恢复原说明
 *
 * @command RenameArmorDesc
 * @text 修改防具说明
 * @desc 修改指定防具的说明文，支持\n换行，传入空字符串可恢复原说明
 * @arg itemId
 * @type armor
 * @text 防具ID
 * @desc 选择要修改说明的防具
 * @arg newDesc
 * @type string
 * @text 新说明
 * @desc 输入新的防具说明，可使用\n换行，留空或输入""可恢复原说明
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
            
            // 应用名称修改
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

            // 应用说明修改
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

        if (this._originalItemNames[key] !== undefined) {
            data[id].name = this._originalItemNames[key];
            delete this._originalItemNames[key];
            delete this._renamedItemNames[key];
        }
        if (this._originalItemDescs[key] !== undefined) {
            data[id].description = this._originalItemDescs[key];
            delete this._originalItemDescs[key];
            delete this._renamedItemDescs[key];
        }
    };

    // ---------- 设置名称 ----------
    Game_System.prototype.setRenamedItemName = function(type, id, newName) {
        const key = type + id;
        const data = getDataArray(type);
        if (!data || !data[id]) return;

        // 备份原名
        if (this._originalItemNames[key] === undefined) {
            this._originalItemNames[key] = data[id].name;
        }

        if (newName && newName !== '') {
            this._renamedItemNames[key] = newName;
            data[id].name = newName;
        } else {
            // 恢复默认
            delete this._renamedItemNames[key];
            if (this._originalItemNames[key] !== undefined) {
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

        // 备份原说明
        if (this._originalItemDescs[key] === undefined) {
            this._originalItemDescs[key] = data[id].description;
        }

        if (newDesc && newDesc !== '') {
            const processed = escapeNewlines(newDesc);
            this._renamedItemDescs[key] = processed;
            data[id].description = processed;
        } else {
            // 恢复默认
            delete this._renamedItemDescs[key];
            if (this._originalItemDescs[key] !== undefined) {
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
        if ($gameSystem) {
            if (!$gameSystem._renamedItemNames) $gameSystem._renamedItemNames = {};
            if (!$gameSystem._renamedItemDescs) $gameSystem._renamedItemDescs = {};
            if (!$gameSystem._originalItemNames) $gameSystem._originalItemNames = {};
            if (!$gameSystem._originalItemDescs) $gameSystem._originalItemDescs = {};
            $gameSystem.applyAllRenames();
        }
    };

    // ---------- 新游戏时应用修改 ----------
    const _DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _DataManager_setupNewGame.call(this);
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
})();