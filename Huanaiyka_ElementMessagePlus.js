//=============================================================================
// Huanaiyka_ElementMessagePlus.js
// ver1.10 2017/10/14（KPoal制作）
// ver2.00 2025（幻爱改变）
// =============================================================================
/*:
 * @target MZ
 * @plugindesc 属性消息追加插件
 * @author 幻爱（原作者：KPoal）
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 【插件简介】
 * 受到属性攻击时，根据属性有效度显示额外的消息。
 * 消息中的 %1 会自动替换为目标名字。无需显示消息时，对应参数留空即可。
 * 
 * 【修改说明】
 * 本修改版为避免与其他倍率类插件冲突，
 * 强制使用原生的 target.elementRate() 进行属性判定。
 * 即使其他插件修改了 calcElementRate 的返回值，
 * 本插件的属性相克消息与弹窗颜色依然基于真实的属性倍率，
 * 从而保证战斗逻辑的准确性。
 * 同时，已将插件翻译为中文，改变了默认信息文字，并加入了系统冲突提示。
 * 衷心感谢插件原作者的贡献。
 * 
 * 若希望 0.6 倍率显示抵抗消息，请在插件参数中将【耐性阈值】改为 0.6 或更高。
 *
 * @param WeakRate
 * @type number
 * @min 1.0
 * @decimals 2
 * @text 弱点阈值
 * @desc 视为弱点的最小属性有效度。超过此倍率时显示弱点消息。
 * @default 2.0
 * 
 * @param ResistRate
 * @type number
 * @max 1.0
 * @decimals 2
 * @text 耐性阈值
 * @desc 视为有耐性的最大属性有效度。低于此倍率时显示耐性消息。
 * @default 0.5
 * 
 * @param WeakEffect
 * @type boolean
 * @text 弱点闪烁效果
 * @desc 弱点属性伤害是否使伤害弹窗红色闪烁。
 * @default true
 * 
 * @param ResistEffect
 * @type boolean
 * @text 耐性闪烁效果
 * @desc 耐性属性伤害是否使伤害弹窗蓝色闪烁。
 * @default true
 * 
 * @param GuardEffect
 * @type boolean
 * @text 无效化闪烁效果
 * @desc 无效化属性伤害是否使伤害弹窗黑色闪烁。
 * @default true
 * 
 * @param ActorWeak
 * @text 角色被弱点击中时
 * @desc 角色被弱点属性击中时的消息。留空则不显示。
 * @default 效果拔群！
 *
 * @param EnemyWeak
 * @text 敌方被弱点击中时
 * @desc 敌方被弱点属性击中时的消息。留空则不显示。
 * @default 效果拔群！
 *
 * @param ActorResist
 * @text 角色有耐性时
 * @desc 角色对攻击属性有耐性时的消息。留空则不显示。
 * @default 效果甚微...
 *
 * @param EnemyResist
 * @text 敌方有耐性时
 * @desc 敌方对我方攻击属性有耐性时的消息。留空则不显示。
 * @default 效果甚微...
 *
 * @param ActorGuard
 * @text 角色免疫时
 * @desc 角色免疫攻击属性时的消息。（与系统设置冲突，建议留空）
 * @default
 *
 * @param EnemyGuard
 * @text 敌方免疫时
 * @desc 敌方免疫我方攻击属性时的消息。（与系统设置冲突，建议留空）
 * @default
 *
 * @param ActorImpartial
 * @text 角色等倍伤害时
 * @desc 角色受到等倍属性伤害时的消息。（通常建议留空）
 * @default 
 *
 * @param EnemyImpartial
 * @text 敌方等倍伤害时
 * @desc 敌方受到等倍属性伤害时的消息。（通常建议留空）
 * @default 
 */

(function() {

var parameters = PluginManager.parameters('Huanaiyka_ElementMessagePlus');
var aWeak   = String(parameters['ActorWeak'] || '');
var eWeak   = String(parameters['EnemyWeak'] || '');
var aresist = String(parameters['ActorResist']|| '');
var eresist = String(parameters['EnemyResist']|| '');
var aguard  = String(parameters['ActorGuard']|| '');
var eguard  = String(parameters['EnemyGuard']|| '');
var aimp    = String(parameters['ActorImpartial']|| '');
var eimp    = String(parameters['EnemyImpartial']|| '');
var WeakEf  = String(parameters['WeakEffect']|| 'false');
var ResistEf= String(parameters['ResistEffect']|| 'false');
var GuardEf = String(parameters['GuardEffect']|| 'false');
var elemRateForMess = 0;

// ----------------------------------------------------------------------------
// 辅助函数：获取纯净的属性有效度（忽略其他插件的污染）
// ----------------------------------------------------------------------------
function getPureElementRate(action, target) {
    var elementId = action.item().damage.elementId;
    // 无属性或元素ID无效：返回等倍 1.0
    if (elementId <= 0) return 1.0;
    // 直接读取目标对该属性的原始倍率
    return target.elementRate(elementId);
}

// ----------------------------------------------------------------------------
// 修改 makeDamageValue：在伤害计算前记录纯净的属性有效度
// ----------------------------------------------------------------------------
var Game_Action_prototype_makeDamageValue = Game_Action.prototype.makeDamageValue;
Game_Action.prototype.makeDamageValue = function(target, critical) {
    // 使用纯净的属性有效度，不受其他倍率插件影响
    elemRateForMess = getPureElementRate(this, target);
    return Game_Action_prototype_makeDamageValue.call(this, target, critical);
};

// ----------------------------------------------------------------------------
// 战斗日志：根据属性有效度生成额外消息
// ----------------------------------------------------------------------------
Window_BattleLog.prototype.makeElementDamageText = function(target) {
    var result = target.result();
    var damage = result.hpDamage;
    var isActor = target.isActor();
    var fmt;
    var weakRate = Number(parameters.WeakRate);
    var resistRate = Number(parameters.ResistRate);
    if (elemRateForMess >= weakRate && damage >= 0) {
        fmt = isActor ? aWeak : eWeak;
        if (fmt) return fmt.format(target.name());
    } else if (elemRateForMess <= 0.0 && damage >= 0) {
        fmt = isActor ? aguard : eguard;
        if (fmt) return fmt.format(target.name());
    } else if (elemRateForMess <= resistRate && damage >= 0) {
        fmt = isActor ? aresist : eresist;
        if (fmt) return fmt.format(target.name());
    } else {
        fmt = isActor ? aimp : eimp;
        if (fmt) return fmt.format(target.name());
    }
    return "";
};

// ----------------------------------------------------------------------------
// 覆盖显示HP伤害的方法，加入属性消息
// ----------------------------------------------------------------------------
Window_BattleLog.prototype.displayHpDamage = function(target) {
    if (target.result().hpAffected) {
        if (target.result().hpDamage > 0 && !target.result().drain) {
            this.push('performDamage', target);
        }
        if (target.result().hpDamage < 0) {
            this.push('performRecovery', target);
        }     
        var elemMsg = this.makeElementDamageText(target);
        if (elemMsg !== "") {
            this.push('addText', elemMsg);
        }   
        this.push('addText', this.makeHpDamageText(target));
    }
};

// ----------------------------------------------------------------------------
// 伤害弹窗颜色闪烁效果（基于纯净属性有效度）
// ----------------------------------------------------------------------------
Sprite_Damage.prototype.setupWeakPEffect = function() {
    this._flashColor = [255, 0, 0, 160];
    this._flashDuration = 60;
};
Sprite_Damage.prototype.setupResistPEffect = function() {
    this._flashColor = [0, 0, 255, 160];
    this._flashDuration = 60;
};
Sprite_Damage.prototype.setupGuardPEffect = function() {
    this._flashColor = [0, 0, 0, 255];
    this._flashDuration = 60;
};

var _Sprite_Damage_prototype_setup = Sprite_Damage.prototype.setup;
Sprite_Damage.prototype.setup = function(target) {
    _Sprite_Damage_prototype_setup.call(this, target);
    var result = target.result();
    if (!result.missed && !result.evaded && result.hpDamage >= 0) {
        var weakRate = Number(parameters.WeakRate);
        var resistRate = Number(parameters.ResistRate);
        if (elemRateForMess >= weakRate && eval(WeakEf)) {
            this.setupWeakPEffect();
        } else if (elemRateForMess <= 0 && eval(GuardEf)) {
            this.setupGuardPEffect();
        } else if (elemRateForMess <= resistRate && eval(ResistEf)) {
            this.setupResistPEffect();
        }
    }
};

})();