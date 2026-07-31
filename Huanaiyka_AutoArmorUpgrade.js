/*:
 * @target MZ
 * @plugindesc 动态链式防具自动升级系统
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件提供多种方式实现防具自动升级，完全支持自定义装备类型。
 * 所有角色、防具、变量均可通过下拉菜单选择，装备槽支持直接输入数字。
 * ============================================================================
 * 基本功能
 * ============================================================================
 * 1. 将指定角色装备的旧防具替换为新防具（upgrade）
 * 2. 基于基础防具ID和等级变量实现链式升级，满足等级条件后自动升级到下一阶（upgradeByBase）
 * 3. 将指定槽位的防具升级到ID+1（假设ID连续）（upgradeSlot）
 * 4. 检测全队是否有人装备了指定防具，若有则升级该防具（仅升级第一个找到的），若无则忽略（upgradeParty）
 * 5. 全队搜索并自动升级到ID+1（upgradePartyAuto）
 *
 * 注：可使用在分支条件中，使用MZ自带脚本
 *     $gameParty.members().some(actor => actor.equips().some(equip => equip && equip.id === 装备ID))
 *     检测全队是否有人装备了指定防具。
 * 
 * ============================================================================
 * @param showMessage
 * @text 显示消息
 * @desc 升级成功后是否在对话框中显示提示
 * @type boolean
 * @default true
 *
 * @param successMessage
 * @text 成功消息
 * @desc 升级成功时显示的文字，%1 旧防具名，%2 新防具名
 * @type string
 * @default %1 升级为了 %2 ！
 *
 * ============================================================================
 * 命令定义
 * ============================================================================
 * @command upgrade
 * @text 升级防具（指定新旧防具）
 * @desc 将角色装备的旧防具替换为新防具
 *
 * @arg actorId
 * @text 角色
 * @type actor
 * @default 1
 *
 * @arg oldArmorId
 * @text 旧防具
 * @type armor
 * @default 1
 *
 * @arg newArmorId
 * @text 新防具
 * @type armor
 * @default 2
 *
 * @arg slotId
 * @text 装备槽
 * @type number
 * @desc 输入数字指定槽位（留空或-1为自动检测）
 * @default -1
 *
 * @arg silent
 * @text 静默升级
 * @desc 若开启，则不显示升级消息（覆盖全局设置）
 * @type boolean
 * @default false
 *
 * @command upgradeByBase
 * @text 升级防具（基础+变量）
 * @desc 基于基础防具ID和等级变量进行链式升级
 *
 * @arg actorId
 * @text 角色
 * @type actor
 * @default 1
 *
 * @arg baseArmorId
 * @text 基础防具
 * @type armor
 * @desc 系列装备的起始防具（插件取其ID）
 * @default 1
 *
 * @arg levelVarId
 * @text 等级变量
 * @type variable
 * @desc 记录当前等级索引的变量
 * @default 1
 *
 * @arg conditionLevel
 * @text 条件等级
 * @type number
 * @desc 角色需达到的等级才能升级
 * @default 5
 *
 * @arg slotId
 * @text 装备槽
 * @type number
 * @desc 输入数字指定槽位（留空或-1为自动检测）
 * @default -1
 *
 * @arg silent
 * @text 静默升级
 * @desc 若开启，则不显示升级消息（覆盖全局设置）
 * @type boolean
 * @default false
 *
 * @command upgradeSlot
 * @text 升级当前槽位（ID+1）
 * @desc 将指定槽位当前装备的防具自动升级到ID+1（假设ID连续）
 *
 * @arg actorId
 * @text 角色
 * @type actor
 * @default 1
 *
 * @arg slotId
 * @text 装备槽
 * @type number
 * @desc 输入数字指定要升级的槽位
 * @default 1
 *
 * @arg silent
 * @text 静默升级
 * @desc 若开启，则不显示升级消息（覆盖全局设置）
 * @type boolean
 * @default false
 *
 * @command upgradeParty
 * @text 升级全队防具（按装备搜索）
 * @desc 检测全队是否有人装备了指定防具，若有则升级该防具（仅升级第一个找到的），若无则忽略
 *
 * @arg oldArmorId
 * @text 旧防具
 * @type armor
 * @desc 需要查找并升级的防具
 * @default 1
 *
 * @arg newArmorId
 * @text 新防具
 * @type armor
 * @desc 升级后的防具
 * @default 2
 *
 * @arg silent
 * @text 静默升级
 * @desc 若开启，则不显示升级消息（覆盖全局设置）
 * @type boolean
 * @default false
 *
 * @command upgradePartyAuto
 * @text 升级全队防具（自动ID+1）
 * @desc 检测全队是否有人装备了指定防具，若有则自动升级到ID+1（假设ID连续），若无则忽略
 *
 * @arg oldArmorId
 * @text 旧防具
 * @type armor
 * @desc 需要查找并升级的防具（新防具ID = 旧防具ID + 1）
 * @default 1
 *
 * @arg silent
 * @text 静默升级
 * @desc 若开启，则不显示升级消息（覆盖全局设置）
 * @type boolean
 * @default false
 */

var Huanaiyka_AutoArmorUpgrade = Huanaiyka_AutoArmorUpgrade || {};

(function() {
    'use strict';

    var pluginName = 'Huanaiyka_AutoArmorUpgrade';
    var parameters = PluginManager.parameters(pluginName);
    var showMessage = parameters['showMessage'] === 'true';
    var successMessage = parameters['successMessage'] || '%1 进化为了 %2 ！';

    function getArmorName(armorId) {
        var armor = $dataArmors[armorId];
        return armor ? armor.name : '未知防具';
    }

    // 查找指定防具当前被装备的槽位（仅根据ID匹配，无视etypeId）
    function findEquipSlot(actor, armorId) {
        var equips = actor.equips();
        for (var i = 0; i < equips.length; i++) {
            var item = equips[i];
            if (item && item.id === armorId) {
                return i;
            }
        }
        return -1;
    }

    // 在全队中查找第一个装备了指定防具的角色和槽位
    function findFirstEquippedArmor(armorId) {
        var partyMembers = $gameParty.members();
        for (var i = 0; i < partyMembers.length; i++) {
            var actor = partyMembers[i];
            var slot = findEquipSlot(actor, armorId);
            if (slot !== -1) {
                return { actor: actor, slotId: slot };
            }
        }
        return null;
    }

    // 核心升级逻辑（直接指定新旧ID），增加 silent 参数控制是否显示消息
    function upgradeArmor(actorId, oldArmorId, newArmorId, slotId, silent) {
        var actor = $gameActors.actor(actorId);
        if (!actor) {
            return false;
        }

        var targetSlot = slotId;
        if (targetSlot === undefined || targetSlot === -1) {
            targetSlot = findEquipSlot(actor, oldArmorId);
            if (targetSlot === -1) {
                return false;
            }
        }

        // 检查槽位是否有效
        if (targetSlot < 0 || targetSlot >= actor.equips().length) {
            return false;
        }

        var equip = actor.equips()[targetSlot];
        if (!equip) {
            return false;
        }
        // 只检查ID是否匹配
        if (equip.id !== oldArmorId) {
            return false;
        }

        var oldArmorName = getArmorName(oldArmorId);
        var oldArmor = $dataArmors[oldArmorId];
        var newArmor = $dataArmors[newArmorId];

        // 记录卸下前背包中旧防具的数量
        var oldCountBefore = $gameParty.numItems(oldArmor);

        // 卸下旧防具（会进入背包）
        actor.changeEquip(targetSlot, null);

        // 卸下后背包中旧防具的数量
        var oldCountAfter = $gameParty.numItems(oldArmor);

        // 移除刚卸下的那一个（如果数量增加）
        if (oldCountAfter > oldCountBefore) {
            $gameParty.loseItem(oldArmor, 1, false);
        } else {
            // 保险：背包数量未增加，直接尝试减少一个（可能背包满或其他情况）
            $gameParty.loseItem(oldArmor, 1, false);
        }

        // 给予新防具
        $gameParty.gainItem(newArmor, 1, false);

        // 装备新防具到同一槽位
        actor.changeEquip(targetSlot, newArmor);

        // 静默判断：如果 silent 为 true，则不显示；否则根据全局 showMessage
        if (!silent && showMessage) {
            var newArmorName = getArmorName(newArmorId);
            var text = successMessage.replace('%1', oldArmorName).replace('%2', newArmorName);
            $gameMessage.add(text);
        }

        return true;
    }

    // --- 命令注册（均支持 silent） ---
    PluginManager.registerCommand(pluginName, 'upgrade', function(args) {
        var actorId = Number(args.actorId);
        var oldArmorId = Number(args.oldArmorId);
        var newArmorId = Number(args.newArmorId);
        var slotId = args.slotId !== undefined ? Number(args.slotId) : -1;
        if (slotId === -1) slotId = undefined;
        var silent = args.silent === 'true';

        upgradeArmor(actorId, oldArmorId, newArmorId, slotId, silent);
    });

    PluginManager.registerCommand(pluginName, 'upgradeByBase', function(args) {
        var actorId = Number(args.actorId);
        var baseArmorId = Number(args.baseArmorId);
        var levelVarId = Number(args.levelVarId);
        var conditionLevel = Number(args.conditionLevel);
        var slotId = args.slotId !== undefined ? Number(args.slotId) : -1;
        if (slotId === -1) slotId = undefined;
        var silent = args.silent === 'true';

        var actor = $gameActors.actor(actorId);
        if (!actor) {
            return;
        }

        var currentLevelIndex = $gameVariables.value(levelVarId);
        var oldArmorId = baseArmorId + currentLevelIndex;
        var newArmorId = baseArmorId + currentLevelIndex + 1;

        if (actor.level < conditionLevel) {
            return;
        }

        var success = upgradeArmor(actorId, oldArmorId, newArmorId, slotId, silent);
        if (success) {
            $gameVariables.setValue(levelVarId, currentLevelIndex + 1);
        }
    });

    PluginManager.registerCommand(pluginName, 'upgradeSlot', function(args) {
        var actorId = Number(args.actorId);
        var slotId = Number(args.slotId);
        var silent = args.silent === 'true';

        var actor = $gameActors.actor(actorId);
        if (!actor) {
            return;
        }

        if (slotId < 0 || slotId >= actor.equips().length) {
            return;
        }

        var equip = actor.equips()[slotId];
        if (!equip) {
            return;
        }
        var oldArmorId = equip.id;
        var newArmorId = oldArmorId + 1;

        if (!$dataArmors[newArmorId]) {
            return;
        }

        upgradeArmor(actorId, oldArmorId, newArmorId, slotId, silent);
    });

    PluginManager.registerCommand(pluginName, 'upgradeParty', function(args) {
        var oldArmorId = Number(args.oldArmorId);
        var newArmorId = Number(args.newArmorId);
        var silent = args.silent === 'true';

        if (!$dataArmors[newArmorId]) {
            return;
        }

        var result = findFirstEquippedArmor(oldArmorId);
        if (!result) {
            return;
        }

        var actor = result.actor;
        var slotId = result.slotId;
        upgradeArmor(actor.actorId(), oldArmorId, newArmorId, slotId, silent);
    });

    PluginManager.registerCommand(pluginName, 'upgradePartyAuto', function(args) {
        var oldArmorId = Number(args.oldArmorId);
        var newArmorId = oldArmorId + 1;
        var silent = args.silent === 'true';

        if (!$dataArmors[newArmorId]) {
            return;
        }

        var result = findFirstEquippedArmor(oldArmorId);
        if (!result) {
            return;
        }

        var actor = result.actor;
        var slotId = result.slotId;
        upgradeArmor(actor.actorId(), oldArmorId, newArmorId, slotId, silent);
    });

})();