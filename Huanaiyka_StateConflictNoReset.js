/*:
 * @target MZ
 * @plugindesc 状态互斥，状态回合不重置
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 
 * 本插件提供两个功能：
 * 1. 状态互斥：同一互斥组内的状态不能共存（后来的状态不会附加）
 * 2. 状态回合不重置：同一状态再次附加时，不重置剩余回合数
 * 
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 
 * 【状态互斥】
 * 在状态的备注栏中输入以下标签来设置分组：
 * 
 *   <ExclusiveGroup: A>
 * 
 * 其中 "A" 是分组名称，可以是任意文字。同一分组内的状态会互斥。
 * 例如：状态1设置 <ExclusiveGroup: Elemental>，状态2也设置 <ExclusiveGroup: Elemental>，
 * 则这两个状态不能同时存在。
 * 
 * 可以给一个状态设置多个互斥分组：
 * 
 *   <ExclusiveGroup: A>
 *   <ExclusiveGroup: B>
 * 
 * 【状态回合不重置】
 * 在状态的备注栏中输入以下标签：
 * 
 *   <NoResetTurns>
 * 
 * 拥有此标签的状态，被重复附加时不会重置回合数。
 * 
 * ============================================================================
 * 注意事项
 * ============================================================================
 * 
 * 1. 两个功能完全独立，可以单独使用或组合使用
 * 2. 互斥功能：后来的状态不会成功附加；不会自动移除已有状态
 * 3. 回合不重置功能：仅影响回合数，状态的强度/效果不受影响
 * 4. 不依赖任何其他插件，可与 VisuStella 等插件共用
 * 
 * ============================================================================
 * @param exclusiveGroups
 * @text 互斥组配置
 * @type struct<ExclusiveGroup>[]
 * @desc 配置互斥组的优先级等扩展属性（预留，暂时只有基础功能）
 * @default []
 * 
 */

var ZTT = ZTT || {};
ZTT.StatesEx = ZTT.StatesEx || {};

(() => {
    //=========================================================================
    // 读取备注标签
    //=========================================================================
    
    /**
     * 获取状态的互斥组列表
     * @param {number} stateId - 状态ID
     * @returns {string[]} 互斥组名称数组
     */
    function getExclusiveGroups(stateId) {
        const state = $dataStates[stateId];
        if (!state || !state.note) return [];
        
        const groups = [];
        const lines = state.note.split(/\r?\n/);
        const regex = /<ExclusiveGroup:\s*([^>]+)>/i;
        
        for (const line of lines) {
            const match = line.match(regex);
            if (match) {
                groups.push(match[1].trim());
            }
        }
        return groups;
    }
    
    /**
     * 检查状态是否禁止重置回合数
     * @param {number} stateId - 状态ID
     * @returns {boolean} 是否不重置回合数
     */
    function isNoResetTurns(stateId) {
        const state = $dataStates[stateId];
        if (!state || !state.note) return false;
        
        const regex = /<NoResetTurns>/i;
        return regex.test(state.note);
    }
    
    /**
     * 检查互斥组是否有冲突
     * @param {number} newStateId - 要附加的新状态
     * @param {number[]} currentStates - 当前已有的状态数组
     * @returns {boolean} 是否有冲突（true表示有冲突，新状态不应该附加）
     */
    function hasExclusiveConflict(newStateId, currentStates) {
        const newGroups = getExclusiveGroups(newStateId);
        if (newGroups.length === 0) return false;
        
        for (const stateId of currentStates) {
            const existingGroups = getExclusiveGroups(stateId);
            for (const group of newGroups) {
                if (existingGroups.includes(group)) {
                    return true;  // 发现冲突
                }
            }
        }
        return false;
    }
    
    //=========================================================================
    // 重写 addState 方法
    //=========================================================================
    
    const _Game_Battler_addState = Game_Battler.prototype.addState;
    
    Game_Battler.prototype.addState = function(stateId) {
        // ========== 功能1：互斥检查 ==========
        if (stateId !== this.deathStateId()) {  // 战斗不能状态不参与互斥
            if (hasExclusiveConflict(stateId, this._states)) {
                return;  // 有冲突，不附加
            }
        }
        
        // ========== 功能2：回合不重置 ==========
        if (isNoResetTurns(stateId)) {
            // 如果状态已存在，保留原有的回合数，直接返回（不重置）
            if (this.isStateAffected(stateId)) {
                return;
            }
        }
        
        // 调用原始方法
        _Game_Battler_addState.call(this, stateId);
    };
    
    //=========================================================================
    // 控制台输出确认插件已加载
    //=========================================================================
    
    console.log("ZTT_StatesEx 插件已加载！");
})();