/*:
 * @plugindesc 强制最低伤害为可配置的最小值
 * @target MZ
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 使用插件后，战斗造成的最低伤害可以是1而不是0
 * 除非对方使用了属性无效的技能。
 * 
 * 本插件强制指定类型的伤害（HP/MP伤害或吸收），如果计算出的原始伤害值 ≤ 0，
 * 且属性倍率 > 0（即非无效/吸收），则将其修正为设定的最小值（默认 1）。
 * 属性倍率为 0（无效）或 负值（吸收）时，伤害保持原值（0 或负值），不受修正。
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 将本文件放入项目的 js/plugins 文件夹中。
 * 2. 在 RPG Maker MZ 的插件管理器中启用本插件。
 * 3. 根据需要调整各参数。
 *
 * ============================================================================
 * 注意事项
 * ============================================================================
 * - 仅当属性倍率 > 0 时修正才会生效，以保证元素无效/吸收机制正常运作。
 * - 若某类型开关关闭，则该类型伤害保持游戏原始计算值，不受任何修正。
 * - 兼容性良好，不影响其他伤害相关插件。
 *
 * ============================================================================
 * 更新日志
 * ============================================================================
 * v2.1.0
 * - 增加 executeDamage 终极修正，解决部分插件覆盖伤害值的问题。
 * - 移除调试日志，正式发布。
 * v2.0.0
 * - 增加四个独立开关参数，支持按伤害类型启用/关闭修正。
 * v1.5.0
 * - 修复伤害为0时显示重复提示的问题。
 * v1.4.0
 * - 新增对属性倍率为0或负值的兼容。
 * v1.3.0
 * - 新增对 MP 伤害和 MP 吸收的支持。
 * v1.2.0
 * - 修正逻辑：仅对 HP 伤害/吸收类型生效。
 * v1.1.0
 * - 新增参数“最低伤害值”。
 * v1.0.0
 * - 适配 MZ。
 * 
 * @param minDamage
 * @text 最低伤害值
 * @desc 当修正生效时，伤害将被提升至此数值（整数）
 * @type number
 * @min 0
 * @default 1
 *
 * @param enableHpDamage
 * @text 启用HP伤害修正
 * @desc 是否对HP伤害（type=1）应用强制最低伤害
 * @type boolean
 * @default true
 *
 * @param enableMpDamage
 * @text 启用MP伤害修正
 * @desc 是否对MP伤害（type=2）应用强制最低伤害
 * @type boolean
 * @default true
 *
 * @param enableHpDrain
 * @text 启用HP吸收修正
 * @desc 是否对HP吸收（type=5）应用强制最低伤害
 * @type boolean
 * @default true
 *
 * @param enableMpDrain
 * @text 启用MP吸收修正
 * @desc 是否对MP吸收（type=6）应用强制最低伤害
 * @type boolean
 * @default true
 *
 */
var pluginName = 'Huanaiyka_MinimumDamage';
var parameters = PluginManager.parameters(pluginName);
var minDamage = Number(parameters['minDamage'] || 1);
var enableHpDamage = parameters['enableHpDamage'] !== 'false';   // 默认 true
var enableMpDamage = parameters['enableMpDamage'] !== 'false';
var enableHpDrain  = parameters['enableHpDrain']  !== 'false';
var enableMpDrain  = parameters['enableMpDrain']  !== 'false';

// ============================================================================
// 核心修正函数（第一次修正）
// ============================================================================
var _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
Game_Action.prototype.makeDamageValue = function(target, critical) {
    var value = _Game_Action_makeDamageValue.call(this, target, critical);
    var damageType = this.item().damage.type;
    
    var typeEnabled = false;
    switch (damageType) {
        case 1: typeEnabled = enableHpDamage; break;   // HP伤害
        case 2: typeEnabled = enableMpDamage; break;   // MP伤害
        case 5: typeEnabled = enableHpDrain;  break;   // HP吸收
        case 6: typeEnabled = enableMpDrain;  break;   // MP吸收
        default: typeEnabled = false; break;
    }
    
    if (typeEnabled && value <= 0) {
        var elementRate = this.calcElementRate(target);
        if (elementRate > 0) {
            value = minDamage;
        }
    }
    return value;
};

// ============================================================================
// 终极保障：在执行伤害时再次强制最小值（防止被其他插件覆盖）
// ============================================================================
var _Game_Action_executeDamage = Game_Action.prototype.executeDamage;
Game_Action.prototype.executeDamage = function(target, value) {
    var damageType = this.item().damage.type;
    var typeEnabled = false;
    switch (damageType) {
        case 1: typeEnabled = enableHpDamage; break;
        case 2: typeEnabled = enableMpDamage; break;
        case 5: typeEnabled = enableHpDrain;  break;
        case 6: typeEnabled = enableMpDrain;  break;
        default: typeEnabled = false; break;
    }
    if (typeEnabled && value <= 0) {
        var elementRate = this.calcElementRate(target);
        if (elementRate > 0) {
            value = minDamage;
        }
    }
    _Game_Action_executeDamage.call(this, target, value);
};

// ============================================================================
// 修复伤害显示：防止伤害为0时重复显示Miss
// ============================================================================
var _Sprite_Damage_createMiss = Sprite_Damage.prototype.createMiss;
Sprite_Damage.prototype.createMiss = function() {
    if (this._creatingMiss) return;
    this._creatingMiss = true;
    _Sprite_Damage_createMiss.call(this);
    this._creatingMiss = false;
};