/*:
 * @target MZ
 * @plugindesc 临时队伍切换插件
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 使用说明
 * ============================================================================
 * 本插件提供三个插件指令，用于在进入副本时存储当前队伍并切换到临时队伍，
 * 在离开副本时恢复原队伍。支持多套临时队伍预设。
 * 
 * 插件指令（事件指令 -> 插件指令）：
 * 
 * 1. 存储并切换至临时队伍（自定义成员）：
 *    TempParty SaveAndSwitch [memberIds] [variableId]
 *    - memberIds（可选）: 临时队伍的成员ID列表，用英文逗号分隔，例如 5,6,7
 *      若不填，则使用插件参数中的【默认临时成员】
 *    - variableId（可选）: 用于存储原队伍的变量ID，若不填则使用插件参数中的【默认存储变量ID】
 *    示例：TempParty SaveAndSwitch 5,6,7 10
 *          TempParty SaveAndSwitch        （全部使用默认值）
 * 
 * 2. 存储并切换至临时队伍（使用预设）：
 *    TempParty SaveAndSwitchPreset [presetId] [variableId]
 *    - presetId（必填）: 预设ID（在插件参数【临时队伍预设】中定义，例如 dungeon）
 *    - variableId（可选）: 用于存储原队伍的变量ID，若不填则使用插件参数中的【默认存储变量ID】
 *    示例：TempParty SaveAndSwitchPreset dungeon 10
 *          TempParty SaveAndSwitchPreset boss
 * 
 * 3. 恢复原队伍：
 *    TempParty Restore [variableId]
 *    - variableId（可选）: 之前存储原队伍的变量ID，若不填则使用插件参数中的【默认存储变量ID】
 *    示例：TempParty Restore 10
 *          TempParty Restore
 * 
 * ============================================================================
 * 预设格式说明
 * ============================================================================
 * 在插件参数【临时队伍预设】中，可以定义多套临时队伍，格式如下：
 *   预设ID1:角色ID列表; 预设ID2:角色ID列表; ...
 * 示例：
 *   dungeon:5,6,7; boss:8,9,10; explore:1,2,3,4
 * 
 * 预设ID只能使用字母、数字和下划线，角色ID必须是正整数。
 * 
 * ============================================================================
 * 注意事项
 * ============================================================================
 * - 存储原队伍时会完整保存队员顺序，恢复时会按照原顺序入队。
 * - 临时队伍切换时会清空原队伍，请确保临时队伍至少有一名成员。
 * - 如果存储的变量内容无效（非数组），恢复指令会给出控制台警告并跳过操作。
 * - 本插件不依赖任何其他插件，可直接使用。
 * 
 * @param defaultVariableId
 * @text 默认存储变量ID
 * @desc 默认用于存储原队伍的变量编号（1~9999）
 * @type variable
 * @default 1
 * 
 * @param defaultTempMembers
 * @text 默认临时成员ID列表
 * @desc 默认的临时队伍成员角色ID，用英文逗号分隔，例如 5,6,7
 * @type string
 * @default 5,6,7
 * 
 * @param tempPresets
 * @text 临时队伍预设
 * @desc 多套临时队伍预设，格式：预设ID:成员列表; 预设ID:成员列表; ... 例如 dungeon:5,6,7; boss:8,9,10
 * @type string
 * @default 
 * 
 * @command SaveAndSwitch
 * @text 存储并切换至临时队伍（自定义）
 * @desc 存储当前队伍，并切换到指定成员列表的临时队伍
 * 
 * @arg memberIds
 * @text 临时成员ID列表
 * @desc 用英文逗号分隔的角色ID，例如 5,6,7。留空则使用插件参数默认值。
 * @type string
 * @default
 * 
 * @arg variableId
 * @text 存储变量ID
 * @desc 用于存储原队伍的变量编号，留空则使用插件参数默认值。
 * @type variable
 * @default
 * 
 * @command SaveAndSwitchPreset
 * @text 存储并切换至临时队伍（使用预设）
 * @desc 存储当前队伍，并切换到预设的临时队伍
 * 
 * @arg presetId
 * @text 预设ID
 * @desc 在插件参数【临时队伍预设】中定义的ID
 * @type string
 * @default
 * 
 * @arg variableId
 * @text 存储变量ID
 * @desc 用于存储原队伍的变量编号，留空则使用插件参数默认值。
 * @type variable
 * @default
 * 
 * @command Restore
 * @text 恢复原队伍
 * @desc 恢复之前存储的队伍
 * 
 * @arg variableId
 * @text 存储变量ID
 * @desc 之前存储原队伍所用的变量编号，留空则使用插件参数默认值。
 * @type variable
 * @default
 */

(() => {
    // 读取插件参数
    const parameters = PluginManager.parameters('Huanaiyka_TempParty');
    const defaultVariableId = Number(parameters['defaultVariableId'] || 1);
    const defaultTempMembersStr = parameters['defaultTempMembers'] || '5,6,7';
    const tempPresetsStr = parameters['tempPresets'] || '';

    // 解析默认临时成员ID数组
    const defaultTempMembers = defaultTempMembersStr.split(',').map(Number).filter(id => !isNaN(id) && id > 0);

    // 解析预设
    const presets = new Map(); // key: presetId (string), value: number[]
    if (tempPresetsStr.trim()) {
        const entries = tempPresetsStr.split(';');
        for (const entry of entries) {
            const [presetId, membersStr] = entry.split(':');
            if (presetId && membersStr) {
                const members = membersStr.split(',').map(Number).filter(id => !isNaN(id) && id > 0);
                if (members.length > 0) {
                    presets.set(presetId.trim(), members);
                } else {
                    console.warn(`[Huanaiyka_TempParty] 预设 "${presetId}" 的成员列表无效，已跳过。`);
                }
            } else {
                console.warn(`[Huanaiyka_TempParty] 预设格式错误，跳过条目: ${entry}`);
            }
        }
    }

    // ============================================================================
    // 辅助函数
    // ============================================================================

    /**
     * 存储当前队伍到指定变量
     * @param {number} variableId 变量ID
     */
    function storeParty(variableId) {
        const currentMembers = $gameParty._actors.slice(); // 克隆当前队员ID数组
        $gameVariables.setValue(variableId, currentMembers);
        console.log(`[Huanaiyka_TempParty] 已存储队伍到变量 ${variableId}，队伍成员：`, currentMembers);
    }

    /**
     * 清空当前队伍
     */
    function clearParty() {
        $gameParty._actors.length = 0;
        // 刷新游戏状态，避免残留
        $gamePlayer.refresh();
        $gameMap.requestRefresh();
    }

    /**
     * 将指定角色ID列表加入队伍
     * @param {number[]} actorIds 角色ID数组
     */
    function addActorsToParty(actorIds) {
        for (const id of actorIds) {
            if (id > 0) {
                $gameParty.addActor(id);
            } else {
                console.warn(`[Huanaiyka_TempParty] 尝试添加无效角色ID: ${id}`);
            }
        }
    }

    /**
     * 切换队伍到临时成员
     * @param {number[]} tempMemberIds 临时成员ID列表
     * @param {number} variableId 存储原队伍的变量ID
     * @returns {boolean} 是否成功
     */
    function switchToTempParty(tempMemberIds, variableId) {
        if (!tempMemberIds || tempMemberIds.length === 0) {
            console.error('[Huanaiyka_TempParty] 临时队伍成员列表为空，切换操作已取消。');
            return false;
        }
        // 1. 存储当前队伍
        storeParty(variableId);
        // 2. 清空队伍
        clearParty();
        // 3. 添加临时成员
        addActorsToParty(tempMemberIds);
        console.log(`[Huanaiyka_TempParty] 已切换至临时队伍：`, tempMemberIds);
        return true;
    }

    /**
     * 根据预设ID切换临时队伍
     * @param {string} presetId 预设ID
     * @param {number} variableId 存储原队伍的变量ID
     * @returns {boolean} 是否成功
     */
    function switchToTempPartyByPreset(presetId, variableId) {
        const members = presets.get(presetId);
        if (!members) {
            console.error(`[Huanaiyka_TempParty] 未找到预设ID: ${presetId}，可用的预设: ${Array.from(presets.keys()).join(', ')}`);
            return false;
        }
        return switchToTempParty(members, variableId);
    }

    /**
     * 恢复之前存储的队伍
     * @param {number} variableId 存储原队伍的变量ID
     * @returns {boolean} 是否成功
     */
    function restoreParty(variableId) {
        const stored = $gameVariables.value(variableId);
        if (!Array.isArray(stored)) {
            console.warn(`[Huanaiyka_TempParty] 变量 ${variableId} 的值不是有效数组，无法恢复队伍。`, stored);
            return false;
        }
        if (stored.length === 0) {
            console.warn(`[Huanaiyka_TempParty] 存储的队伍为空，将清空当前队伍。`);
        }
        // 清空当前队伍
        clearParty();
        // 恢复原队伍
        addActorsToParty(stored);
        console.log(`[Huanaiyka_TempParty] 已从变量 ${variableId} 恢复队伍：`, stored);
        return true;
    }

    // ============================================================================
    // 注册插件指令
    // ============================================================================

    // 1. 存储并切换临时队伍指令（自定义成员）
    PluginManager.registerCommand('Huanaiyka_TempParty', 'SaveAndSwitch', args => {
        let memberIdsArg = args.memberIds ? args.memberIds.trim() : '';
        let variableIdArg = args.variableId ? Number(args.variableId) : defaultVariableId;

        let tempMembers;
        if (memberIdsArg === '') {
            tempMembers = defaultTempMembers.slice(); // 使用默认
        } else {
            tempMembers = memberIdsArg.split(',').map(Number).filter(id => !isNaN(id) && id > 0);
        }

        if (tempMembers.length === 0) {
            console.error('[Huanaiyka_TempParty] 插件指令 SaveAndSwitch 未提供有效的临时成员ID列表，操作取消。');
            return;
        }

        switchToTempParty(tempMembers, variableIdArg);
    });

    // 2. 存储并切换临时队伍指令（使用预设）
    PluginManager.registerCommand('Huanaiyka_TempParty', 'SaveAndSwitchPreset', args => {
        const presetId = args.presetId ? args.presetId.trim() : '';
        const variableIdArg = args.variableId ? Number(args.variableId) : defaultVariableId;

        if (!presetId) {
            console.error('[Huanaiyka_TempParty] 插件指令 SaveAndSwitchPreset 缺少 presetId 参数，操作取消。');
            return;
        }

        switchToTempPartyByPreset(presetId, variableIdArg);
    });

    // 3. 恢复原队伍指令
    PluginManager.registerCommand('Huanaiyka_TempParty', 'Restore', args => {
        let variableIdArg = args.variableId ? Number(args.variableId) : defaultVariableId;
        restoreParty(variableIdArg);
    });

    // 为了兼容手动调用，暴露全局方法（可选）
    window.Huanaiyka_TempParty = {
        storeParty,
        restoreParty,
        switchToTempParty,
        switchToTempPartyByPreset,
        presets
    };

    console.log(`[Huanaiyka_TempParty] 插件已加载。
    默认存储变量ID = ${defaultVariableId}
    默认临时成员 = ${defaultTempMembersStr}
    预设数量 = ${presets.size}`);
})();