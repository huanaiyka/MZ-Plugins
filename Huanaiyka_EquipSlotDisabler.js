/*:
 * @target MZ
 * @plugindesc 禁用角色装备槽位
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * 
 * @command disableSlot
 * @text 禁用装备槽位
 * @desc 禁用指定角色（默认队伍全体）的指定装备槽位（或全部槽位）。
 *
 * @arg actorId
 * @text 目标角色
 * @desc 0 表示队伍全体角色；选择特定角色则仅对该角色生效。
 * @type actor
 * @default 0
 * 
 * @arg slotId
 * @text 槽位索引
 * @desc 要禁用的装备槽编号（0:武器, 1:盾牌...）。填写 -1 代表禁用【全部槽位】。
 * @type number
 * @min -1
 * @default 0
 *
 * @arg forceUnequip
 * @text 是否强制脱下装备
 * @desc 禁用槽位时，是否将该槽位当前已穿戴的装备强制脱下退回背包？
 * @type boolean
 * @default true
 * 
 * 
 * @command enableSlot
 * @text 解禁装备槽位
 * @desc 解禁指定角色（默认队伍全体）的指定装备槽位（或全部槽位）。
 *
 * @arg actorId
 * @text 目标角色
 * @desc 0 表示队伍全体角色；选择特定角色则仅对该角色生效。
 * @type actor
 * @default 0
 * 
 * @arg slotId
 * @text 槽位索引
 * @desc 要解禁的装备槽编号。填写 -1 代表解禁【全部槽位】。
 * @type number
 * @min -1
 * @default 0
 *
 * 
 * @help

 * ============================================================================
 * 插件简介
 * ============================================================================
 * 本插件用于在 RPG Maker MZ 中通过插件指令精准禁用或解禁指定角色的装备槽位。
 * 适用于剧情锁槽（如手铐限制武器、诅咒装备锁死）、角色状态异常（如负伤无法佩戴盾牌）
 * 或特定副本限制等玩法场景。
 * ============================================================================
 * 说明
 * ============================================================================
 * 1. 禁用槽位后，玩家将无法在该槽位更换或穿戴任何装备。
 * 2. 支持选择在禁用槽位时，是否自动将原有装备脱下退回背包。
 * 3. 完美兼容 RPG Maker MZ 存档系统，禁用状态会实时随游戏存档保存。
 * 4. 支持针对单名角色或当前队伍全体角色生效。
 * ============================================================================
 * 使用方法
 * ============================================================================
 *   1. 禁用队伍全体角色的武器：
 *      直接使用指令 [禁用装备槽位]，无需修改目标角色（默认0），槽位填 0。
 * 
 *   2. 禁用队伍全体角色的所有槽位（全部件封印）：
 *      直接使用指令 [禁用装备槽位]，槽位填 -1。
 * 
 *   3. 解禁队伍全体角色的所有槽位：
 *      直接使用指令 [解禁装备槽位]，槽位填 -1。
 * ============================================================================
 * 更新履历 (Changelog)
 * ============================================================================
 * [v2.4] - 2026-08-01
 *   - 修复：修复全体生效模式（actorId=0）下，会误将数据库中所有未入队角色的
 *           初始装备剥离并塞入背包导致物品暴增的 Bug。现仅对队伍成员生效。
 * 
 * [v2.3] - 2026-08-01
 *   - 修复：将脱装备逻辑优化为原生的 `changeEquipById` 函数，解决直接设置 
 *           `null` 时导致的装备多重触发或背包物品数量异常增长问题。
 * 
 * [v2.2] - 2026-08-01
 *   - 修复：修正底层拦截函数。RPG Maker MZ 原生无 `isEquipSlotEnabled`，
 *           全面改用 MZ 原生的 `isEquipChangeOk` 方法拦截槽位更换行为。
 * 
 * [v2.1] - 2026-08-01
 *   - 新增：支持使用 -1 快速禁用/解禁角色全部槽位。
 *   - 新增：支持配置禁用槽位时是否强制脱下已装备物品 (forceUnequip)。
 * 
 * [v2.0] - 初始发布
 *   - 实现基础的角色单槽位禁用与解禁功能。
 */

(() => {
    const pluginName = 'Huanaiyka_EquipSlotDisabler';

    // ------------------------------------------------------------------------
    // 1. 数据持久化扩展
    // ------------------------------------------------------------------------
    const _Game_Actor_initMembers = Game_Actor.prototype.initMembers;
    Game_Actor.prototype.initMembers = function() {
        _Game_Actor_initMembers.call(this);
        this._disabledEquipSlots = [];
        this._allEquipSlotsDisabled = false;
    };

    /**
     * 安全脱下指定槽位的装备
     */
    Game_Actor.prototype.safeUnequipSlot = function(slotId) {
        if (this.equips()[slotId]) {
            this.changeEquipById(slotId + 1, 0);
        }
    };

    /**
     * 禁用特定槽位
     */
    Game_Actor.prototype.disableEquipSlot = function(slotId, forceUnequip) {
        if (!this._disabledEquipSlots) this._disabledEquipSlots = [];

        if (slotId === -1) {
            this._allEquipSlotsDisabled = true;
            if (forceUnequip) {
                const numSlots = this.equipSlots().length;
                for (let i = 0; i < numSlots; i++) {
                    this.safeUnequipSlot(i);
                }
            }
        } else {
            if (!this._disabledEquipSlots.includes(slotId)) {
                this._disabledEquipSlots.push(slotId);
            }
            if (forceUnequip) {
                this.safeUnequipSlot(slotId);
            }
        }
        this.refresh();
    };

    /**
     * 解禁特定槽位
     */
    Game_Actor.prototype.enableEquipSlot = function(slotId) {
        if (!this._disabledEquipSlots) this._disabledEquipSlots = [];

        if (slotId === -1) {
            this._allEquipSlotsDisabled = false;
            this._disabledEquipSlots = [];
        } else {
            const index = this._disabledEquipSlots.indexOf(slotId);
            if (index !== -1) {
                this._disabledEquipSlots.splice(index, 1);
            }
        }
        this.refresh();
    };

    // ------------------------------------------------------------------------
    // 2. 判定逻辑拦截
    // ------------------------------------------------------------------------
    const _Game_Actor_isEquipChangeOk = Game_Actor.prototype.isEquipChangeOk;
    Game_Actor.prototype.isEquipChangeOk = function(slotId) {
        let enabled = _Game_Actor_isEquipChangeOk.call(this, slotId);
        if (!enabled) return false;

        // 全槽位禁用判定
        if (this._allEquipSlotsDisabled) return false;

        // 特定槽位禁用判定
        if (this._disabledEquipSlots && this._disabledEquipSlots.includes(slotId)) {
            return false;
        }

        return enabled;
    };

    // 界面刷新辅助函数
    const refreshEquipUI = () => {
        const scene = SceneManager._scene;
        if (scene && (scene instanceof Scene_Equip || scene instanceof Scene_Status)) {
            if (scene._statusWindow) scene._statusWindow.refresh();
            if (scene._slotWindow) scene._slotWindow.refresh();
            if (scene._itemWindow) scene._itemWindow.refresh();
        }
    };

    // 获取需要处理的角色列表（修复：目标为0时，只对【当前队伍中的角色】生效）
    const getTargetActors = (actorId) => {
        if (actorId === 0) {
            return $gameParty.members(); // 仅选择当前队伍中的角色
        } else {
            const actor = $gameActors.actor(actorId);
            return actor ? [actor] : [];
        }
    };

    // ------------------------------------------------------------------------
    // 3. 注册 MZ 插件指令
    // ------------------------------------------------------------------------
    
    // 指令：禁用槽位
    PluginManager.registerCommand(pluginName, 'disableSlot', args => {
        const targetActorId = Number(args.actorId || 0);
        const slotId = Number(args.slotId || 0);
        const forceUnequip = String(args.forceUnequip).toLowerCase() === 'true';

        const actors = getTargetActors(targetActorId);
        actors.forEach(actor => {
            if (actor) actor.disableEquipSlot(slotId, forceUnequip);
        });

        refreshEquipUI();
    });

    // 指令：解禁槽位
    PluginManager.registerCommand(pluginName, 'enableSlot', args => {
        const targetActorId = Number(args.actorId || 0);
        const slotId = Number(args.slotId || 0);

        const actors = getTargetActors(targetActorId);
        actors.forEach(actor => {
            if (actor) actor.enableEquipSlot(slotId);
        });

        refreshEquipUI();
    });

})();