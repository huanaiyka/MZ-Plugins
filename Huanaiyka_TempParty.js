/*:
 * @target MZ
 * @plugindesc 临时队伍与道具切换插件
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * 
 * @help
 * ============================================================================
 * ■ 插件功能简介
 * ============================================================================
 * 本插件适用于进入特殊副本、剧情事件或临时挑战时，保存玩家当前的队伍结构及
 * 背包道具，并切换为指定的临时队伍或清空背包。
 * 离开副本或事件结束时，可通过指令快速一键还原队伍与道具。
 * 队伍与道具的功能可单独使用。
 * ============================================================================
 * ■ 插件指令说明
 * ============================================================================
 * 
 * 【队伍相关】
 *  1. 存储并切换至临时队伍（自定义）：
 *     - 存储当前队伍，并切换为指定的角色列表。
 *     
 *  2. 存储并切换至临时队伍（使用预设）：
 *     - 存储当前队伍，并切换为插件参数中配置好的预设队伍。
 * 
 *  3. 存储并保留前 N 位角色：
 *     - 截取当前队伍的前 N 名角色（默认 1 名），其余队员暂时移出。
 * 
 *  4. 恢复原队伍：
 *     - 还原之前存储的队伍成员及顺序。
 * 
 * 【道具相关】
 *  5. 存储并清空道具：
 *     - 存储当前背包道具并按选择的类型清空（普通物品/武器/防具/重要物品）。
 * 
 *  6. 恢复道具：
 *     - 还原之前存储的道具。支持选择【是否保留身上现有的物品】。
 * 
 * 【组合指令】
 *  7. 存储全部（队伍+道具）：
 *     - 同时存储队伍与背包道具，并切换至临时状态。
 * 
 *  8. 恢复全部（队伍+道具）：
 *     - 同时还原队伍与背包道具。支持选择【是否保留身上现有的物品】。
 * 
 * 
 * @param defaultVariableId
 * @text 默认队伍存储变量ID
 * @desc 默认用于存储原队伍数据的游戏变量编号（1~9999）
 * @type variable
 * @default 1
 * 
 * @param defaultItemVariableId
 * @text 默认道具存储变量ID
 * @desc 默认用于存储背包道具数据的游戏变量编号（1~9999）
 * @type variable
 * @default 2
 * 
 * @param defaultTempMembers
 * @text 默认临时成员列表
 * @desc 当未指定成员时默认使用的临时角色列表
 * @type actor[]
 * @default ["5","6","7"]
 * 
 * @param tempPresets
 * @text 临时队伍预设
 * @desc 配置多套常用的临时队伍预设
 * @type struct<Preset>[]
 * @default []
 * 
 * @command SaveAndSwitch
 * @text 存储并切换队伍（自定义）
 * @desc 存储当前队伍，并切换到指定的临时角色列表
 * 
 * @arg memberIds
 * @text 临时成员ID列表
 * @desc 角色ID用英文逗号分隔（例：5,6,7）。留空则使用插件参数默认值。
 * @type string
 * @default
 * 
 * @arg variableId
 * @text 队伍存储变量
 * @desc 存储原队伍数据的变量编号。留空使用默认值。
 * @type variable
 * @default 0
 * 
 * @command SaveAndSwitchPreset
 * @text 存储并切换队伍（预设）
 * @desc 存储当前队伍，并切换到指定的预设队伍
 * 
 * @arg presetId
 * @text 预设标识符(ID)
 * @desc 在插件参数【临时队伍预设】中配置的预设ID
 * @type string
 * @default
 * 
 * @arg variableId
 * @text 队伍存储变量
 * @desc 存储原队伍数据的变量编号。留空使用默认值。
 * @type variable
 * @default 0
 * 
 * @command SaveAndSwitchTopN
 * @text 存储并保留前 N 位角色
 * @desc 存储当前队伍，仅保留队头前 N 位角色
 * 
 * @arg count
 * @text 保留角色数量
 * @desc 保留队伍前几位角色，默认为 1
 * @type number
 * @min 1
 * @default 1
 * 
 * @arg variableId
 * @text 队伍存储变量
 * @desc 存储原队伍数据的变量编号。留空使用默认值。
 * @type variable
 * @default 0
 * 
 * @command Restore
 * @text 恢复原队伍
 * @desc 还原之前存储的队伍成员及顺序
 * 
 * @arg variableId
 * @text 队伍存储变量
 * @desc 存储原队伍数据的变量编号。留空使用默认值。
 * @type variable
 * @default 0
 * 
 * @command StoreAndClearItems
 * @text 存储并清空道具
 * @desc 存储背包中的道具并进行清空
 * 
 * @arg itemTypes
 * @text 要清空的道具类型
 * @desc 用逗号分隔: item(物品), weapon(武器), armor(防具), key(重要物品)。留空全部清空。
 * @type string
 * @default
 * 
 * @arg variableId
 * @text 道具存储变量
 * @desc 存储道具数据的变量编号。留空使用默认值。
 * @type variable
 * @default 0
 * 
 * @command RestoreItems
 * @text 恢复道具
 * @desc 还原之前存储的背包道具
 * 
 * @arg keepCurrentItems
 * @text 保留身上现有物品
 * @desc 是否保留当前背包里已有的物品。否 = 覆盖还原，是 = 叠加还原。
 * @type boolean
 * @on 保留
 * @off 不保留
 * @default false
 * 
 * @arg variableId
 * @text 道具存储变量
 * @desc 存储道具数据的变量编号。留空使用默认值。
 * @type variable
 * @default 0
 * 
 * @command SaveAll
 * @text 存储全部（队伍+道具）
 * @desc 同时存储队伍与道具，并切换到临时状态
 * 
 * @arg memberIds
 * @text 临时成员ID列表
 * @desc 角色ID用英文逗号分隔（例：5,6,7）。留空使用默认值。
 * @type string
 * @default
 * 
 * @arg itemTypes
 * @text 要清空的道具类型
 * @desc 用逗号分隔: item, weapon, armor, key。留空全部清空。
 * @type string
 * @default
 * 
 * @arg partyVarId
 * @text 队伍存储变量
 * @desc 存储原队伍数据的变量编号。留空使用默认值。
 * @type variable
 * @default 0
 * 
 * @arg itemVarId
 * @text 道具存储变量
 * @desc 存储道具数据的变量编号。留空使用默认值。
 * @type variable
 * @default 0
 * 
 * @command RestoreAll
 * @text 恢复全部（队伍+道具）
 * @desc 同时还原队伍与背包道具
 * 
 * @arg keepCurrentItems
 * @text 保留身上现有物品
 * @desc 还原道具时是否保留身上现有物品。否 = 覆盖还原，是 = 叠加还原。
 * @type boolean
 * @on 保留
 * @off 不保留
 * @default false
 * 
 * @arg partyVarId
 * @text 队伍存储变量
 * @desc 存储原队伍数据的变量编号。留空使用默认值。
 * @type variable
 * @default 0
 * 
 * @arg itemVarId
 * @text 道具存储变量
 * @desc 存储道具数据的变量编号。留空使用默认值。
 * @type variable
 * @default 0
 */

/*~struct~Preset:
 * @param id
 * @text 预设标识符(ID)
 * @desc 英文标识符，例如：dungeon 或 boss（在指令中调用此ID）
 * @type string
 * @default dungeon
 *
 * @param members
 * @text 预设队伍角色
 * @desc 该预设包含的角色列表
 * @type actor[]
 * @default []
 */

(() => {
    // 读取插件参数
    const parameters = PluginManager.parameters('Huanaiyka_TempParty');
    const defaultVariableId = Number(parameters['defaultVariableId'] || 1);
    const defaultItemVariableId = Number(parameters['defaultItemVariableId'] || 2);
    
    // 解析默认临时成员列表
    let defaultTempMembers = [];
    try {
        const rawDefaultMembers = JSON.parse(parameters['defaultTempMembers'] || '[]');
        defaultTempMembers = rawDefaultMembers.map(Number).filter(id => !isNaN(id) && id > 0);
    } catch (e) {
        defaultTempMembers = [5, 6, 7];
    }

    // 解析结构体预设列表
    const presets = new Map();
    try {
        const rawPresets = JSON.parse(parameters['tempPresets'] || '[]');
        for (const presetJson of rawPresets) {
            const presetObj = JSON.parse(presetJson);
            if (presetObj && presetObj.id) {
                const presetId = presetObj.id.trim();
                const membersRaw = JSON.parse(presetObj.members || '[]');
                const members = membersRaw.map(Number).filter(id => !isNaN(id) && id > 0);
                
                if (presetId && members.length > 0) {
                    presets.set(presetId, members);
                }
            }
        }
    } catch (e) {
        // 静默处理解析异常
    }

    // ============================================================================
    // 辅助函数
    // ============================================================================

    function getValidVariableId(varId) {
        const num = Number(varId);
        return (num && num > 0) ? num : defaultVariableId;
    }

    function getValidItemVariableId(varId) {
        const num = Number(varId);
        return (num && num > 0) ? num : defaultItemVariableId;
    }

    function storeParty(variableId) {
        const currentMembers = $gameParty._actors.slice();
        $gameVariables.setValue(variableId, currentMembers);
    }

    function clearParty() {
        $gameParty._actors.length = 0;
        $gamePlayer.refresh();
        $gameMap.requestRefresh();
    }

    function addActorsToParty(actorIds) {
        for (const id of actorIds) {
            if (id > 0) {
                $gameParty.addActor(id);
            }
        }
    }

    // ============================================================================
    // 道具存储/恢复相关函数
    // ============================================================================

    function parseItemTypes(typeStr) {
        const validTypes = ['item', 'weapon', 'armor', 'key'];
        if (!typeStr || typeStr.trim() === '') {
            return validTypes.slice();
        }
        return typeStr.split(',').map(s => s.trim().toLowerCase()).filter(t => validTypes.includes(t));
    }

    function getItemData(itemTypes) {
        const data = { item: [], weapon: [], armor: [], key: [] };
        
        if (itemTypes.includes('item')) {
            for (const item of $dataItems) {
                if (item && item.itypeId === 1 && $gameParty.numItems(item) > 0) {
                    data.item.push({ id: item.id, count: $gameParty.numItems(item) });
                }
            }
        }
        
        if (itemTypes.includes('weapon')) {
            for (const item of $dataWeapons) {
                if (item && $gameParty.numItems(item) > 0) {
                    data.weapon.push({ id: item.id, count: $gameParty.numItems(item) });
                }
            }
        }
        
        if (itemTypes.includes('armor')) {
            for (const item of $dataArmors) {
                if (item && $gameParty.numItems(item) > 0) {
                    data.armor.push({ id: item.id, count: $gameParty.numItems(item) });
                }
            }
        }
        
        if (itemTypes.includes('key')) {
            for (const item of $dataItems) {
                if (item && item.itypeId === 2 && $gameParty.numItems(item) > 0) {
                    data.key.push({ id: item.id, count: $gameParty.numItems(item) });
                }
            }
        }
        
        return data;
    }

    function storeItems(itemTypes, variableId) {
        const itemData = getItemData(itemTypes);
        $gameVariables.setValue(variableId, itemData);
        return itemData;
    }

    function clearItems(itemTypes) {
        if (itemTypes.includes('item')) {
            const itemsToRemove = $dataItems.filter(item => item && item.itypeId === 1);
            for (const item of itemsToRemove) {
                $gameParty.loseItem(item, $gameParty.numItems(item));
            }
        }
        
        if (itemTypes.includes('weapon')) {
            const weaponsToRemove = $dataWeapons.filter(item => item);
            for (const item of weaponsToRemove) {
                $gameParty.loseItem(item, $gameParty.numItems(item));
            }
        }
        
        if (itemTypes.includes('armor')) {
            const armorsToRemove = $dataArmors.filter(item => item);
            for (const item of armorsToRemove) {
                $gameParty.loseItem(item, $gameParty.numItems(item));
            }
        }
        
        if (itemTypes.includes('key')) {
            const keyItems = $dataItems.filter(item => item && item.itypeId === 2);
            for (const item of keyItems) {
                $gameParty.loseItem(item, $gameParty.numItems(item));
            }
        }
    }

    function storeAndClearItems(itemTypes, variableId) {
        const validVarId = getValidItemVariableId(variableId);
        const types = parseItemTypes(itemTypes);
        
        if (types.length === 0) {
            return false;
        }
        
        storeItems(types, validVarId);
        clearItems(types);
        return true;
    }

    /**
     * 恢复道具
     * @param {number} variableId 变量ID
     * @param {boolean} keepCurrentItems 是否保留身上现有物品
     */
    function restoreItems(variableId, keepCurrentItems = false) {
        const validVarId = getValidItemVariableId(variableId);
        const storedData = $gameVariables.value(validVarId);
        
        if (!storedData || typeof storedData !== 'object') {
            return false;
        }
        
        // 若不保留身上物品，则先清空存储数据中包含的相关类型
        if (!keepCurrentItems) {
            const types = [];
            if (storedData.item && storedData.item.length > 0) types.push('item');
            if (storedData.weapon && storedData.weapon.length > 0) types.push('weapon');
            if (storedData.armor && storedData.armor.length > 0) types.push('armor');
            if (storedData.key && storedData.key.length > 0) types.push('key');
            clearItems(types);
        }
        
        // 恢复普通物品
        if (storedData.item) {
            for (const entry of storedData.item) {
                const item = $dataItems[entry.id];
                if (item && item.itypeId === 1) {
                    $gameParty.gainItem(item, entry.count);
                }
            }
        }
        
        // 恢复武器
        if (storedData.weapon) {
            for (const entry of storedData.weapon) {
                const item = $dataWeapons[entry.id];
                if (item) {
                    $gameParty.gainItem(item, entry.count);
                }
            }
        }
        
        // 恢复防具
        if (storedData.armor) {
            for (const entry of storedData.armor) {
                const item = $dataArmors[entry.id];
                if (item) {
                    $gameParty.gainItem(item, entry.count);
                }
            }
        }
        
        // 恢复重要物品
        if (storedData.key) {
            for (const entry of storedData.key) {
                const item = $dataItems[entry.id];
                if (item && item.itypeId === 2) {
                    $gameParty.gainItem(item, entry.count);
                }
            }
        }
        
        return true;
    }

    // ============================================================================
    // 队伍切换函数
    // ============================================================================

    function switchToTempParty(tempMemberIds, variableId) {
        if (!tempMemberIds || tempMemberIds.length === 0) {
            return false;
        }
        const validVarId = getValidVariableId(variableId);
        storeParty(validVarId);
        clearParty();
        addActorsToParty(tempMemberIds);
        return true;
    }

    function switchToTempPartyByPreset(presetId, variableId) {
        const members = presets.get(presetId);
        if (!members) {
            return false;
        }
        return switchToTempParty(members, variableId);
    }

    function saveAndSwitchTopN(count = 1, variableId) {
        const n = Math.max(1, Number(count) || 1);
        const currentMembers = $gameParty._actors.slice();
        if (currentMembers.length === 0) {
            return false;
        }
        const topNMembers = currentMembers.slice(0, n);
        return switchToTempParty(topNMembers, variableId);
    }

    function restoreParty(variableId) {
        const validVarId = getValidVariableId(variableId);
        const stored = $gameVariables.value(validVarId);
        if (!Array.isArray(stored)) {
            return false;
        }
        clearParty();
        addActorsToParty(stored);
        return true;
    }

    // ============================================================================
    // 组合功能
    // ============================================================================

    function saveAll(memberIds, itemTypes, partyVarId, itemVarId) {
        let tempMembers;
        if (!memberIds || memberIds.trim() === '') {
            tempMembers = defaultTempMembers.slice();
        } else {
            tempMembers = memberIds.split(',').map(Number).filter(id => !isNaN(id) && id > 0);
        }
        
        if (tempMembers.length === 0) {
            return false;
        }
        
        const validPartyVarId = getValidVariableId(partyVarId);
        const validItemVarId = getValidItemVariableId(itemVarId);
        const types = parseItemTypes(itemTypes);
        
        const partySuccess = switchToTempParty(tempMembers, validPartyVarId);
        const itemSuccess = storeAndClearItems(types, validItemVarId);
        
        return partySuccess && itemSuccess;
    }

    function restoreAll(partyVarId, itemVarId, keepCurrentItems = false) {
        const validPartyVarId = getValidVariableId(partyVarId);
        const validItemVarId = getValidItemVariableId(itemVarId);
        
        const itemSuccess = restoreItems(validItemVarId, keepCurrentItems);
        const partySuccess = restoreParty(validPartyVarId);
        
        return partySuccess && itemSuccess;
    }

    // ============================================================================
    // 注册插件指令
    // ============================================================================

    PluginManager.registerCommand('Huanaiyka_TempParty', 'SaveAndSwitch', args => {
        let memberIdsArg = args.memberIds ? args.memberIds.trim() : '';
        let variableIdArg = getValidVariableId(args.variableId);

        let tempMembers;
        if (memberIdsArg === '') {
            tempMembers = defaultTempMembers.slice();
        } else {
            tempMembers = memberIdsArg.split(',').map(Number).filter(id => !isNaN(id) && id > 0);
        }

        if (tempMembers.length === 0) return;

        switchToTempParty(tempMembers, variableIdArg);
    });

    PluginManager.registerCommand('Huanaiyka_TempParty', 'SaveAndSwitchPreset', args => {
        const presetId = args.presetId ? args.presetId.trim() : '';
        const variableIdArg = getValidVariableId(args.variableId);

        if (!presetId) return;

        switchToTempPartyByPreset(presetId, variableIdArg);
    });

    PluginManager.registerCommand('Huanaiyka_TempParty', 'SaveAndSwitchTopN', args => {
        const count = args.count ? Number(args.count) : 1;
        const variableIdArg = getValidVariableId(args.variableId);

        saveAndSwitchTopN(count, variableIdArg);
    });

    PluginManager.registerCommand('Huanaiyka_TempParty', 'Restore', args => {
        let variableIdArg = getValidVariableId(args.variableId);
        restoreParty(variableIdArg);
    });

    PluginManager.registerCommand('Huanaiyka_TempParty', 'StoreAndClearItems', args => {
        const itemTypes = args.itemTypes ? args.itemTypes.trim() : '';
        const variableIdArg = getValidItemVariableId(args.variableId);
        
        storeAndClearItems(itemTypes, variableIdArg);
    });

    PluginManager.registerCommand('Huanaiyka_TempParty', 'RestoreItems', args => {
        const variableIdArg = getValidItemVariableId(args.variableId);
        const keepCurrentItems = args.keepCurrentItems === 'true';
        
        restoreItems(variableIdArg, keepCurrentItems);
    });

    PluginManager.registerCommand('Huanaiyka_TempParty', 'SaveAll', args => {
        const memberIds = args.memberIds ? args.memberIds.trim() : '';
        const itemTypes = args.itemTypes ? args.itemTypes.trim() : '';
        const partyVarId = args.partyVarId ? args.partyVarId : 0;
        const itemVarId = args.itemVarId ? args.itemVarId : 0;
        
        saveAll(memberIds, itemTypes, partyVarId, itemVarId);
    });

    PluginManager.registerCommand('Huanaiyka_TempParty', 'RestoreAll', args => {
        const partyVarId = args.partyVarId ? args.partyVarId : 0;
        const itemVarId = args.itemVarId ? args.itemVarId : 0;
        const keepCurrentItems = args.keepCurrentItems === 'true';
        
        restoreAll(partyVarId, itemVarId, keepCurrentItems);
    });

    // ============================================================================
    // 暴露全局 API
    // ============================================================================

    window.Huanaiyka_TempParty = {
        storeParty,
        restoreParty,
        switchToTempParty,
        switchToTempPartyByPreset,
        saveAndSwitchTopN,
        presets,
        storeItems,
        restoreItems,
        clearItems,
        storeAndClearItems,
        saveAll,
        restoreAll,
        parseItemTypes,
        getValidVariableId,
        getValidItemVariableId
    };
})();