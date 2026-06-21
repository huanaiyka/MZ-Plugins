/*:
 * @target MZ
 * @plugindesc  穿上/脱下装备触发公共事件，可拒绝脱下装备
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================
 * 功能说明：
 * 在装备的备注栏中写入指定标签，即可在角色穿上或脱下该装备时自动触发公共事件。
 * 公共事件只会在菜单关闭之后执行。
 * 
 * 可以单独选择「只触发事件但允许操作」或「触发事件并拒绝操作」。
 * 拒绝脱下装备的表现方式是“音效和流程正常，但装备没有被脱下。”
 * 
============================================================
 * 相关插件：
 * hichi 制作的 EquipMenuChangeEvent 也提供装备事件功能，
 * 支持直接显示消息、播放音效、操作开关/变量及强制结束菜单等。
 * 
 * 如果你在寻找的功能是“装备后立即出现文字信息”，
 * 推荐使用EquipMenuChangeEvent 插件。
 * 
============================================================
 * 标签格式（写在装备（武器/防具）的备注栏中）：
 * ------------------------------------------------------------
 * 穿上操作：
 *   <equipTrigger: 事件ID, 角色ID1, 角色ID2, ...>   – 指定角色穿上时触发公共事件，允许穿上
 *   <equipBlock: 事件ID, 角色ID1, 角色ID2, ...>     – 指定角色穿上时触发公共事件，并拒绝穿上
 *
 * 脱下操作：
 *   <unequipTrigger: 事件ID, 角色ID1, 角色ID2, ...> – 指定角色脱下时触发公共事件，允许脱下
 *   <unequipBlock: 事件ID, 角色ID1, 角色ID2, ...>   – 指定角色脱下时触发公共事件，并拒绝脱下
 *
 *例如：
 *<equipBlock: 5, 1, 3> → 只有1号或3号角色穿上时阻止并触发公共事件5
 *<unequipTrigger: 12, 2> → 只有2号角色脱下时触发公共事件12
 *
 *
 * 角色专属效果（穿上时设置开关）：
 *   <specialTrigger: 角色ID, 开关ID, 目标值>
 *   <specialMsg: 提示文本>  （可选）
 *     目标值：0 关闭开关，1 打开开关（不写则默认为1）
 *
 * 角色专属效果（脱下时设置开关）：
 *   <specialUnequipTrigger: 角色ID, 开关ID, 目标值>
 *   <specialUnequipMsg: 提示文本>  （可选）
 *     目标值：0 关闭开关，1 打开开关（不写则默认为1）
 * ------------------------------------------------------------
 *
 * 注意：
 *   - 如果标签中指定了角色ID，则只有对应角色操作时才会触发/阻止。
 *   - 未指定角色ID时，所有角色操作都会触发。
 *   - 在同一装备菜单打开期间，同一个公共事件只会触发一次。
 *   - 标签格式允许空格，不区分大小写。
 *   - 专属开关现在可以直接设置为关闭(0)或打开(1)，不再只能打开。
 *
============================================================
 *
 * @param prefix_equipTrigger
 * @text 穿上触发标签
 * @type string
 * @default equipTrigger
 *
 * @param prefix_equipBlock
 * @text 穿上阻止标签
 * @type string
 * @default equipBlock
 *
 * @param prefix_unequipTrigger
 * @text 脱下触发标签
 * @type string
 * @default unequipTrigger
 *
 * @param prefix_unequipBlock
 * @text 脱下阻止标签
 * @type string
 * @default unequipBlock
 *
 * @param prefix_specialTrigger
 * @text 穿上专属开关标签
 * @type string
 * @default specialTrigger
 *
 * @param prefix_specialMsg
 * @text 穿上专属消息标签
 * @type string
 * @default specialMsg
 *
 * @param prefix_specialUnequipTrigger
 * @text 脱下专属开关标签
 * @type string
 * @default specialUnequipTrigger
 *
 * @param prefix_specialUnequipMsg
 * @text 脱下专属消息标签
 * @type string
 * @default specialUnequipMsg
 */

(() => {
    const pluginName = 'Huanaiyka_EquipActionEvent';
    const params = PluginManager.parameters(pluginName);
    const tagEquipTrigger = params['prefix_equipTrigger'] || 'equipTrigger';
    const tagEquipBlock   = params['prefix_equipBlock']   || 'equipBlock';
    const tagUnequipTrigger = params['prefix_unequipTrigger'] || 'unequipTrigger';
    const tagUnequipBlock   = params['prefix_unequipBlock']   || 'unequipBlock';
    const tagSpecialTrigger = params['prefix_specialTrigger'] || 'specialTrigger';
    const tagSpecialMsg     = params['prefix_specialMsg']     || 'specialMsg';
    const tagSpecialUnequipTrigger = params['prefix_specialUnequipTrigger'] || 'specialUnequipTrigger';
    const tagSpecialUnequipMsg     = params['prefix_specialUnequipMsg']     || 'specialUnequipMsg';

    // ----- 会话级防重复触发（装备菜单打开期间每个事件只触发一次）-----
    const sessionTriggeredEvents = new Set();
    let isEquipSceneActive = false;

    // 监听场景变化：进入装备场景时清空记录
    const _Scene_Equip_initialize = Scene_Equip.prototype.initialize;
    Scene_Equip.prototype.initialize = function() {
        _Scene_Equip_initialize.call(this);
        sessionTriggeredEvents.clear();
        isEquipSceneActive = true;
    };
    // 离开装备场景时标记为非活跃（可选，用于精确判断）
    const _Scene_Equip_terminate = Scene_Equip.prototype.terminate;
    Scene_Equip.prototype.terminate = function() {
        _Scene_Equip_terminate.call(this);
        isEquipSceneActive = false;
    };

    // 辅助：判断当前是否在装备场景
    function isInEquipScene() {
        return isEquipSceneActive && SceneManager._scene instanceof Scene_Equip;
    }

    // 防重复触发（原有时间防重 + 会话防重）
    const _lastEventTrigger = {};
    function triggerCommonEventSafe(eventId) {
        if (!eventId || eventId <= 0) return;
        // 会话内防重复
        if (isInEquipScene() && sessionTriggeredEvents.has(eventId)) return;
        // 时间防重（5帧内）
        const currentFrame = Graphics.frameCount;
        if (_lastEventTrigger[eventId] && (currentFrame - _lastEventTrigger[eventId] < 5)) return;
        _lastEventTrigger[eventId] = currentFrame;
        if (isInEquipScene()) sessionTriggeredEvents.add(eventId);
        $gameTemp.reserveCommonEvent(eventId);
    }

    // 解析标签（支持角色过滤）
    // 返回 { eventId, isBlock, actorIds }，actorIds 为 null 表示所有角色，否则为数组
    function getEventIdWithActors(note, triggerTag, blockTag) {
        // 优先匹配 Block 标签
        let match = note.match(new RegExp(`<${blockTag}:\\s*([^>]+)>`, 'i'));
        let isBlock = true;
        if (!match) {
            match = note.match(new RegExp(`<${triggerTag}:\\s*([^>]+)>`, 'i'));
            isBlock = false;
        }
        if (!match) return null;

        const content = match[1].trim();
        // 按逗号分割
        const parts = content.split(',').map(s => s.trim());
        if (parts.length === 0) return null;
        const eventId = parseInt(parts[0], 10);
        if (isNaN(eventId)) return null;

        let actorIds = null;
        if (parts.length > 1) {
            actorIds = [];
            for (let i = 1; i < parts.length; i++) {
                const id = parseInt(parts[i], 10);
                if (!isNaN(id)) actorIds.push(id);
            }
            if (actorIds.length === 0) actorIds = null;
        }
        return { eventId, isBlock, actorIds };
    }

    // 向下兼容旧版简单标签（纯数字），如果新解析失败则尝试旧格式
    function getEventId(note, triggerTag, blockTag) {
        const info = getEventIdWithActors(note, triggerTag, blockTag);
        if (info) return info;
        // 旧格式：只有事件ID，无角色限制
        const blockMatch = note.match(new RegExp(`<${blockTag}:\\s*(\\d+)>`, 'i'));
        if (blockMatch) return { eventId: parseInt(blockMatch[1], 10), isBlock: true, actorIds: null };
        const triggerMatch = note.match(new RegExp(`<${triggerTag}:\\s*(\\d+)>`, 'i'));
        if (triggerMatch) return { eventId: parseInt(triggerMatch[1], 10), isBlock: false, actorIds: null };
        return null;
    }

    // 专属开关解析（支持第三个参数：目标值 0 或 1，默认 1）
    function getSpecialInfo(note, tag) {
        const regex = new RegExp(`<${tag}:\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*(\\d+))?>`, 'i');
        const match = note.match(regex);
        if (match) {
            const actorId = parseInt(match[1], 10);
            const switchId = parseInt(match[2], 10);
            let targetValue = 1; // 默认打开
            if (match[3] !== undefined) targetValue = parseInt(match[3], 10);
            return { actorId, switchId, targetValue };
        }
        return null;
    }

    function getSpecialMessage(note, tag) {
        const regex = new RegExp(`<${tag}:\\s*(.+?)>`, 'i');
        const match = note.match(regex);
        return match ? match[1].trim() : null;
    }

    const _Game_Actor_changeEquip = Game_Actor.prototype.changeEquip;

    Game_Actor.prototype.changeEquip = function(slotId, newItem) {
        const oldItem = this.equips()[slotId];
        const actorId = this.actorId();

        if (oldItem === newItem) return false;

        // 辅助函数：检查角色是否匹配 actorIds
        function isActorMatch(actorIds, currentActorId) {
            if (actorIds === null) return true;
            return actorIds.includes(currentActorId);
        }

        // 1. 脱下旧装备事件
        if (oldItem) {
            const info = getEventId(oldItem.note, tagUnequipTrigger, tagUnequipBlock);
            if (info && isActorMatch(info.actorIds, actorId)) {
                triggerCommonEventSafe(info.eventId);
                if (info.isBlock) return false;
            }
        }

        // 2. 穿上新装备事件
        if (newItem) {
            const info = getEventId(newItem.note, tagEquipTrigger, tagEquipBlock);
            if (info && isActorMatch(info.actorIds, actorId)) {
                triggerCommonEventSafe(info.eventId);
                if (info.isBlock) return false;
            }
        }

        // 3. 执行实际装备变更
        _Game_Actor_changeEquip.call(this, slotId, newItem);
        const currentItem = this.equips()[slotId];
        if (currentItem !== newItem) return false;

        // 4. 穿上专属效果（直接设置开关为目标值）
        if (newItem) {
            const special = getSpecialInfo(newItem.note, tagSpecialTrigger);
            if (special && actorId === special.actorId) {
                $gameSwitches.setValue(special.switchId, special.targetValue === 1);
                const msg = getSpecialMessage(newItem.note, tagSpecialMsg);
                if (msg) $gameMessage.add(msg);
            }
        }

        // 5. 脱下专属效果（直接设置开关为目标值）
        if (oldItem) {
            const special = getSpecialInfo(oldItem.note, tagSpecialUnequipTrigger);
            if (special && actorId === special.actorId) {
                $gameSwitches.setValue(special.switchId, special.targetValue === 1);
                const msg = getSpecialMessage(oldItem.note, tagSpecialUnequipMsg);
                if (msg) $gameMessage.add(msg);
            }
        }

        return true;
    };
})();