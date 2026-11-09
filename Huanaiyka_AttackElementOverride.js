/*:
 * @target MZ
 * @plugindesc 武器属性覆盖普通攻击原有属性
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 当普通攻击（攻击技能）通过武器获得了属性时，完全覆盖（替换）普通攻击
 * 原本自带的属性，而不是在其基础上追加。
 *
 * 制作目的：使用 DarkPlasma_MultiElementAction.js 等插件给普通攻击追加
 *           “一般”属性后，当武器为普通攻击赋予“火”属性时，希望普通攻击
 *           只保留“火”属性，而不是“一般 + 火”共存。
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 将本插件保存为 Huanaiyka_AttackElementOverride.js，放入 js/plugins/ 文件夹。
 * 2. 在插件管理器中启用本插件。
 * 3. 无需额外配置。
 *
 * ============================================================================
 * 注意事项
 * ============================================================================
 * · 只影响“攻击技能”（普通攻击，即 Game_Action 的 isAttack() 为 true 的动作）。
 * · 仅当武器为普通攻击实际赋予了属性时才会覆盖；若武器没有任何属性，
 *   则保留普通攻击原有的属性。
 * · 加载顺序：追加属性的插件在前，本插件在后。
 * ============================================================================
 */

(() => {
    const pluginName = "Huanaiyka_AttackElementOverride";

    function weaponElements(action) {
        if (!action.isAttack()) return [];
        const subject = action.subject();
        if (!subject || !subject.weapons) return [];
        const weapons = subject.weapons();
        const result = [];
        for (const weapon of weapons) {
            if (!weapon) continue;
            for (const id of weapon.traits
                .filter(t => t.code === 31)
                .map(t => t.dataId)) {
                if (!result.includes(id)) result.push(id);
            }
        }
        return result;
    }

    // 若 DarkPlasma 插件存在，拦截 actionAttackElements
    if (Game_Action.prototype.actionAttackElements) {
        const _actionAttackElements = Game_Action.prototype.actionAttackElements;
        Game_Action.prototype.actionAttackElements = function() {
            if (this.isAttack()) {
                const wElems = weaponElements(this);
                if (wElems.length > 0) return wElems;
            }
            return _actionAttackElements.call(this);
        };
    }

    // 同时保留对 elements() 的覆盖（兼容无 DarkPlasma 的情况）
    const _elements = Game_Action.prototype.elements;
    Game_Action.prototype.elements = function() {
        if (this.isAttack()) {
            const wElems = weaponElements(this);
            if (wElems.length > 0) return wElems;
        }
        return _elements.call(this);
    };
})();