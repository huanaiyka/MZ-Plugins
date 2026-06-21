/*:
 * @target MZ
 * @plugindesc 为武器/防具添加角色、职业、等级、开关等专属限制
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 
============================================================================
 * 使用说明
 * ============================================================================
 * 在武器或防具的备注栏中输入以下一个或多个标签（可组合使用）：
 *
 * 1. 角色限制（指定角色ID）：
 *    <exclusiveActor: 1,3,5>   → 只有 ID 为 1、3、5 的角色可以装备
 *    <exclusiveActor: 2>        → 只有 ID 为 2 的角色可以装备
 *
 * 2. 职业限制（指定职业ID）：
 *    <exclusiveClass: 2,4>      → 只有职业 ID 为 2 或 4 的角色可以装备
 *
 * 3. 等级限制（最低等级）：
 *    <exclusiveLevel: 10>       → 角色等级 ≥ 10 才能装备
 *
 * 4. 开关限制（需要指定开关为 ON）：
 *    <exclusiveSwitch: 5>       → 开关 5 必须为 ON 才能装备
 *    <exclusiveSwitch: 5,8>     → 开关 5 和 8 都必须为 ON
 *
 * 5. 变量限制（需要变量值满足条件）：
 *    <exclusiveVariable: 10, 5>      → 变量 10 的值 ≥ 5 才能装备
 *    <exclusiveVariable: 12, 0, 1>   → 变量 12 的值 = 0 才能装备（第三个参数为比较类型：0=≥，1=≤，2==）
 *
 * 6. 综合示例：
 *    <exclusiveActor: 1>
 *    <exclusiveClass: 2>
 *    <exclusiveLevel: 5>
 *    <exclusiveSwitch: 10>
 *    → 只有角色ID为1且职业ID为2且等级≥5且开关10为ON时才能装备
 *
 * 7. 如果不写任何标签，则所有角色都可装备（默认行为）。
 *
 * 注意：多个标签必须同时满足（AND关系）。如果需要OR关系，请单独联系扩展。
 * ============================================================================
 * 兼容性说明
 * ============================================================================
 * - 同时支持武器（Weapon）和防具（Armor）。
 * - 不影响原有的装备类型系统，不占用类型槽位。
 * - 如果使用 VisuStella 等大型插件，请将此插件放在它们下方。
 * - 自动处理：装备界面灰显、无法装备、以及打开菜单时自动卸下违规装备。
 */

(function() {

    //-----------------------------------------------------------------------------
    // 解析装备备注，获取所有限制条件
    // 返回一个对象，包含各个条件的值
    function getEquipmentRestrictions(item) {
        if (!item || !item.note) return null;
        const note = item.note;
        const restrictions = {};

        // 角色限制
        const actorMatch = note.match(/<exclusiveActor:\s*([^>]+)>/i);
        if (actorMatch) {
            let content = actorMatch[1].trim();
            if (content.toLowerCase() !== "all") {
                restrictions.actors = content.split(',').map(s => parseInt(s.trim(), 10)).filter(id => !isNaN(id));
            }
        }

        // 职业限制
        const classMatch = note.match(/<exclusiveClass:\s*([^>]+)>/i);
        if (classMatch) {
            let content = classMatch[1].trim();
            restrictions.classes = content.split(',').map(s => parseInt(s.trim(), 10)).filter(id => !isNaN(id));
        }

        // 等级限制
        const levelMatch = note.match(/<exclusiveLevel:\s*(\d+)>/i);
        if (levelMatch) {
            restrictions.minLevel = parseInt(levelMatch[1], 10);
        }

        // 开关限制
        const switchMatch = note.match(/<exclusiveSwitch:\s*([^>]+)>/i);
        if (switchMatch) {
            let content = switchMatch[1].trim();
            restrictions.switches = content.split(',').map(s => parseInt(s.trim(), 10)).filter(id => !isNaN(id));
        }

        // 变量限制：格式 <exclusiveVariable: varId, value, type?>
        // type: 0=大于等于(默认), 1=小于等于, 2=等于
        const varRegex = /<exclusiveVariable:\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d))?>/i;
        let varMatch;
        while ((varMatch = varRegex.exec(note)) !== null) {
            const varId = parseInt(varMatch[1], 10);
            const value = parseInt(varMatch[2], 10);
            let type = varMatch[3] ? parseInt(varMatch[3], 10) : 0;
            if (!restrictions.variables) restrictions.variables = [];
            restrictions.variables.push({ varId, value, type });
            // 防止死循环（如果同一个标签出现多次，正则每次从上次匹配后继续）
            note = note.replace(varMatch[0], '');
        }

        return Object.keys(restrictions).length ? restrictions : null;
    }

    //-----------------------------------------------------------------------------
    // 检查角色是否满足所有限制条件
    function meetsRestrictions(actor, restrictions) {
        if (!restrictions) return true;

        // 角色ID检查
        if (restrictions.actors && restrictions.actors.length > 0) {
            if (!restrictions.actors.contains(actor.actorId())) return false;
        }

        // 职业ID检查
        if (restrictions.classes && restrictions.classes.length > 0) {
            if (!restrictions.classes.contains(actor.currentClass().id)) return false;
        }

        // 等级检查
        if (restrictions.minLevel !== undefined) {
            if (actor.level < restrictions.minLevel) return false;
        }

        // 开关检查
        if (restrictions.switches && restrictions.switches.length > 0) {
            for (let swId of restrictions.switches) {
                if (!$gameSwitches.value(swId)) return false;
            }
        }

        // 变量检查
        if (restrictions.variables && restrictions.variables.length > 0) {
            for (let v of restrictions.variables) {
                const val = $gameVariables.value(v.varId);
                switch (v.type) {
                    case 0: if (val < v.value) return false; break;
                    case 1: if (val > v.value) return false; break;
                    case 2: if (val !== v.value) return false; break;
                }
            }
        }

        return true;
    }

    //-----------------------------------------------------------------------------
    // 判断角色是否允许装备某物品（武器或防具）
    function canEquipExclusive(actor, item) {
        if (!item) return true;
        // 只处理武器和防具
        if (!DataManager.isWeapon(item) && !DataManager.isArmor(item)) return true;
        const restrictions = getEquipmentRestrictions(item);
        if (!restrictions) return true;
        return meetsRestrictions(actor, restrictions);
    }

    //-----------------------------------------------------------------------------
    // 重写 Game_Actor.prototype.canEquip
    const _Game_Actor_canEquip = Game_Actor.prototype.canEquip;
    Game_Actor.prototype.canEquip = function(item) {
        if (!_Game_Actor_canEquip.call(this, item)) return false;
        return canEquipExclusive(this, item);
    };

    //-----------------------------------------------------------------------------
    // 重写装备窗口的可用性显示
    const _Window_EquipItem_isEnabled = Window_EquipItem.prototype.isEnabled;
    Window_EquipItem.prototype.isEnabled = function(item) {
        if (item && (DataManager.isWeapon(item) || DataManager.isArmor(item))) {
            const actor = this._actor;
            if (actor && !canEquipExclusive(actor, item)) {
                return false;
            }
        }
        return _Window_EquipItem_isEnabled.call(this, item);
    };

    //-----------------------------------------------------------------------------
    // 商店购买时是否允许购买？通常允许购买，但装备时会检查。可选：在商店中显示警告？暂不限制购买。

    //-----------------------------------------------------------------------------
    // 自动卸下角色身上不符合条件的装备（防止事件强制装备）
    function checkAndRemoveInvalidEquipment(actor) {
        if (!actor) return;
        // 检查武器
        const weapon = actor.weapons()[0];
        if (weapon && !canEquipExclusive(actor, weapon)) {
            $gameParty.gainItem(weapon, 1);
            actor.changeEquip(-1, null); // 卸下武器
        }
        // 检查防具
        for (let i = 0; i < actor.equips().length; i++) {
            const item = actor.equips()[i];
            if (item && (DataManager.isWeapon(item) || DataManager.isArmor(item)) && !canEquipExclusive(actor, item)) {
                $gameParty.gainItem(item, 1);
                actor.changeEquip(i, null);
            }
        }
    }

    // 初始化时检查
    const _Game_Actor_initEquips = Game_Actor.prototype.initEquips;
    Game_Actor.prototype.initEquips = function(equips) {
        _Game_Actor_initEquips.call(this, equips);
        checkAndRemoveInvalidEquipment(this);
    };

    // 每次打开装备场景时检查
    const _Scene_Equip_create = Scene_Equip.prototype.create;
    Scene_Equip.prototype.create = function() {
        _Scene_Equip_create.call(this);
        if ($gameParty.inBattle()) return;
        $gameParty.members().forEach(actor => {
            checkAndRemoveInvalidEquipment(actor);
        });
    };

    // 等级变化时也检查（升级后可能满足条件，但不会自动装备；但可以防止升级后仍违规？升级只会放宽条件，不会收紧，所以不需要卸下。但为了安全，可加一个检查）
    // 可选：等级提升后自动尝试装备？不实现，保持简单。

})();