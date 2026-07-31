/*:
 * @target MZ
 * @plugindesc 根据开关禁用所有角色的指定装备槽位
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * GlobalEquipSlotDisabler.js
 * ============================================================================
 * 功能：
 *   当指定的开关打开时，所有角色的指定装备槽位将被禁用。
 *   开关关闭时恢复正常。
 *
 *   @param Control Switch
 *   @text 控制开关ID
 *   @desc 用于开启/禁用的开关编号
 *   @type switch
 *   @min 1
 *   @default 1
 *
 *   @param Target Slot
 *   @text 目标槽位ID
 *   @desc 要禁用的装备槽编号（从0开始，通常6=宝石）
 *   @type number
 *   @min 0
 *   @default 6
 *
 * 槽位ID参考（默认）：
 *   0:武器, 1:盾牌, 2:头部, 3:身体, 4:饰品1, 5:饰品2, 6:宝石（或自设）
 *   请以您数据库-类型页签中的实际顺序为准。
 *
 * 使用方法：
 *   1. 在数据库中创建一个开关（例如 #1）。
 *   2. 在插件参数中填入该开关ID和目标槽位ID。
 *   3. 需要禁用时打开开关，需要恢复时关闭开关。
 *   4. 效果即时生效，自动刷新角色状态。
 * ============================================================================
 */

(() => {
    // 获取插件参数
    const parameters = PluginManager.parameters('GlobalEquipSlotDisabler');
    const controlSwitch = Number(parameters['Control Switch'] || 1);
    const targetSlotId = Number(parameters['Target Slot'] || 6);

    // 保存原始方法
    const _Game_Actor_isEquipSlotEnabled = Game_Actor.prototype.isEquipSlotEnabled;

    /**
     * 重写 isEquipSlotEnabled
     * 根据全局开关状态决定指定槽位是否可用
     */
    Game_Actor.prototype.isEquipSlotEnabled = function(slotId) {
        // 先调用原始逻辑
        let enabled = _Game_Actor_isEquipSlotEnabled.call(this, slotId);
        if (!enabled) return false;

        // 如果全局开关打开，并且当前检查的槽位等于目标槽位 → 禁用
        if ($gameSwitches && $gameSwitches.value(controlSwitch) && slotId === targetSlotId) {
            return false;
        }
        return enabled;
    };

    // 保存原始的开关 setValue 方法
    const _Game_Switches_setValue = Game_Switches.prototype.setValue;

    /**
     * 当指定开关发生变化时，刷新所有角色（使禁用效果实时生效）
     */
    Game_Switches.prototype.setValue = function(switchId, value) {
        _Game_Switches_setValue.call(this, switchId, value);
        // 如果改变的开关正是控制开关，强制刷新所有角色
        if (switchId === controlSwitch && $gameParty) {
            $gameParty.members().forEach(actor => actor.refresh());
            // 如果当前处于装备或角色场景，刷新窗口显示
            const scene = SceneManager._scene;
            if (scene && (scene instanceof Scene_Equip || scene instanceof Scene_Status)) {
                if (scene._statusWindow) scene._statusWindow.refresh();
                if (scene._slotWindow) scene._slotWindow.refresh();
                if (scene._itemWindow) scene._itemWindow.refresh();
            }
        }
    };
})();