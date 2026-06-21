/*:
 * @target MZ
 * @plugindesc 自动为技能添加前缀
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * 
 * @help 
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 本插件会自动为所有技能描述的前方添加一个前缀。
 * 前缀内容默认基于技能的「伤害属性（damage.elementId）」和「技能类型（stypeId）」生成。
 * 
 * 支持自定义前缀格式，也支持为无属性技能单独设定一个固定前缀（如【变化招式】）。
 * 
 * ============================================================================
 * 使用示例
 * ============================================================================
 * 
 * 1. 普通有属性技能：
 *    - 技能：火球术，伤害元素ID=1（火），技能类型=魔法
 *    - 默认格式：【火】【魔法】火球术的描述...
 * 
 * 2. 无属性技能，且「启用无属性特殊前缀」= 开启：
 *    - 技能：变身，伤害元素ID=0
 *    - 前缀 = 【变化招式】
 *    - 最终描述：【变化招式】变身的描述...
 * 
 * 3. 无属性技能，但「启用无属性特殊前缀」= 关闭：
 *    - 技能：变身，伤害元素ID=0
 *    - 前缀格式为【%e】【%t】，其中 %e 显示「无属性」，%t 显示「无类型」
 *    - 最终描述：【无属性】【无类型】变身的描述...
 * 
 * 4. 自定义前缀格式（例如改为 “%e · %t - ”）：
 *    - 有属性技能显示：火 · 魔法 - 火球术的描述...
 *    - 无属性且未启用特殊前缀时：无属性 · 无类型 - 变身的描述...
 * 
 * ============================================================================
 * 注意事项
 * ============================================================================
 * 
 * - 插件在数据库加载完成后自动为所有技能添加前缀，并保留原始描述。
 * - 如果你在游戏中动态修改了技能属性，需要重新加载数据库或刷新技能描述，否则前缀不会更新。
 * 
 * ============================================================================
 * 
 * @param prefixFormat
 * @text 前缀格式
 * @type string
 * @default 【%e】【%t】
 * @desc 普通情况下的前缀格式。可用占位符：%e → 属性名称，%t → 技能类型名称。
 * 
 * @param emptyElementText
 * @text 无属性默认文本
 * @type string
 * @default 无属性
 * @desc 当技能伤害元素ID为0（无属性）时，%e 将显示为此文本。
 * 
 * @param emptySkillTypeText
 * @text 无类型默认文本
 * @type string
 * @default 无类型
 * @desc 当技能未设置技能类型（stypeId=0）时，%t 将显示为此文本。
 * 
 * @param useNoElementPrefix
 * @text 启用无属性特殊前缀
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default true
 * @desc 若开启，则无属性技能将忽略上述格式，直接使用「无属性技能特殊前缀」。
 * 
 * @param noElementPrefix
 * @text 无属性技能特殊前缀
 * @type string
 * @default 【变化技能】
 * @desc 仅当「启用无属性特殊前缀」开启且技能无属性时生效。可自定义文本，留空则不加任何前缀。
 */

(() => {
    const pluginName = document.currentScript?.src?.split('/').pop().replace(/\.js$/, '') || 'SkillPrefixDamageElement';
    const params = PluginManager.parameters(pluginName);
    const prefixFormat = params['prefixFormat'] || '【%e】【%t】';
    const emptyElementText = params['emptyElementText'] || '无属性';
    const emptySkillTypeText = params['emptySkillTypeText'] || '无类型';
    const useNoElementPrefix = params['useNoElementPrefix'] === 'true';
    const noElementPrefix = params['noElementPrefix'] || '【变化招式】';

    let processed = false;

    function getElementId(skill) {
        if (skill.damage && typeof skill.damage.elementId !== 'undefined') {
            return Number(skill.damage.elementId);
        }
        if (skill.elementId !== undefined) return Number(skill.elementId);
        return 0;
    }

    function getElementName(skill) {
        const id = getElementId(skill);
        if (id <= 0) return emptyElementText;
        const elements = $dataSystem.elements;
        if (elements && elements[id] && elements[id] !== '') {
            return elements[id];
        }
        return emptyElementText;
    }

    function getSkillTypeId(skill) {
        if (skill.stypeId !== undefined && skill.stypeId > 0) return Number(skill.stypeId);
        return 0;
    }

    function getSkillTypeName(skill) {
        const id = getSkillTypeId(skill);
        if (id <= 0) return emptySkillTypeText;
        const types = $dataSystem.skillTypes;
        if (types && types[id] && types[id] !== '') {
            return types[id];
        }
        return emptySkillTypeText;
    }

    function buildPrefix(skill) {
        const elementId = getElementId(skill);

        if (useNoElementPrefix && elementId <= 0) {
            return noElementPrefix;
        }

        let prefix = prefixFormat;
        const elem = getElementName(skill);
        const stype = getSkillTypeName(skill);
        prefix = prefix.replace(/%e/g, elem);
        prefix = prefix.replace(/%t/g, stype);
        return prefix;
    }

    function applyPrefix() {
        if (processed) return;
        if (!$dataSkills || !$dataSystem) return;

        for (let i = 1; i < $dataSkills.length; i++) {
            const skill = $dataSkills[i];
            if (!skill) continue;
            if (skill._originalDescription === undefined) {
                skill._originalDescription = skill.description || '';
            }
            skill.description = buildPrefix(skill) + skill._originalDescription;
        }
        processed = true;
    }

    const _load = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        const ret = _load.call(this);
        if (ret && !processed) applyPrefix();
        return ret;
    };

    if (DataManager.isDatabaseLoaded()) applyPrefix();
})();