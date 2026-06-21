/*:
 * @plugindesc 开关控制头像文件替换
 * @target MZ
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 这个插件允许你在指定的一组开关满足条件时，将整个头像文件替换为另一个文件。
 * 例如，当开关1和开关2都打开时，所有原本使用 "Actor1" 头像文件的地方
 * 都会自动显示 "Actor2" 文件中对应索引的头像。
 * 
 * 使用方法：
 * 在插件参数中配置替换规则列表。每条规则包含：
 * - 开关列表：控制替换生效的开关ID（可多个）。
 * - 逻辑模式：选择需要所有开关打开(AND)还是任意一个打开(OR)。
 * - 原始头像文件名：要被替换的头像图片文件名（位于 Graphics/Faces/，无需扩展名）。
 * - 目标头像文件名：替换后的头像图片文件名。
 * 
 * 注意：文件名不要包含路径（如 "faces/"），只需填写 "Actor1" 这样的纯名称。
 * 插件会自动清理可能误输入的 "faces/" 前缀。
 * 
 * 如果多条规则同时匹配同一个原始文件名，将按照列表中顺序应用第一条匹配的规则。
 * 
 * @param rules
 * @text 替换规则列表
 * @type struct<Rule>[]
 * @desc 配置开关控制头像文件替换的规则列表。
 */

/*~struct~Rule:
 * @param switchIds
 * @text 开关列表
 * @type switch[]
 * @desc 参与控制的开关ID（可多个）。
 * @default [1]
 * 
 * @param mode
 * @text 逻辑模式
 * @type select
 * @option 所有开关打开(AND)
 * @value and
 * @option 任一开关打开(OR)
 * @value or
 * @desc 选择满足条件的方式：所有开关打开(AND) 或 任一开关打开(OR)。
 * @default and
 * 
 * @param originalFaceName
 * @text 原始头像文件名
 * @type file
 * @dir faces
 * @desc 要被替换的头像图片文件名（不包括扩展名，也不包括路径）。
 * @default Actor1
 * 
 * @param targetFaceName
 * @text 目标头像文件名
 * @type file
 * @dir faces
 * @desc 替换后的头像图片文件名（不包括扩展名，也不包括路径）。
 * @default Actor2
 */

(() => {
    const pluginName = 'Huanaiyka_FaceImageSwitcher';
    const parameters = PluginManager.parameters(pluginName);

    // 辅助函数：清理文件名中的路径前缀
    const cleanName = (name) => name.replace(/^faces[\/\\]/, '');

    // 辅助函数：检查规则是否满足开关条件
    const checkSwitches = (switchIds, mode) => {
        if (!switchIds || switchIds.length === 0) return false;
        if (mode === 'or') {
            return switchIds.some(id => $gameSwitches.value(id));
        } else { // 默认 and
            return switchIds.every(id => $gameSwitches.value(id));
        }
    };

    let rules = [];

    // 解析规则
    if (parameters.rules) {
        try {
            let ruleList = parameters.rules;
            if (typeof ruleList === 'string') ruleList = JSON.parse(ruleList);
            if (Array.isArray(ruleList)) {
                ruleList.forEach(item => {
                    let ruleObj = item;
                    if (typeof item === 'string') ruleObj = JSON.parse(item);
                    if (ruleObj && typeof ruleObj === 'object') {
// ---------- 增强版 switchIds 解析 ----------
let switchIds = ruleObj.switchIds;
if (typeof switchIds === 'string') {
    // 尝试将字符串解析为 JSON 数组（如 "[\"3\"]"）
    try {
        let parsed = JSON.parse(switchIds);
        if (Array.isArray(parsed)) {
            switchIds = parsed.map(id => Number(id));
        } else {
            // 不是数组，视为单个数字字符串
            switchIds = [Number(switchIds)];
        }
    } catch (e) {
        // 解析失败，直接转为数字（可能是单个ID）
        switchIds = [Number(switchIds)];
    }
} else if (typeof switchIds === 'number') {
    switchIds = [switchIds];
} else if (Array.isArray(switchIds)) {
    switchIds = switchIds.map(id => Number(id));
} else {
    switchIds = [];
}
// 过滤掉 NaN
switchIds = switchIds.filter(id => !isNaN(id));
// -------------------------------------------
                        const mode = ruleObj.mode === 'or' ? 'or' : 'and'; // 默认为 and
                        const originalFaceName = cleanName(String(ruleObj.originalFaceName || ''));
                        const targetFaceName = cleanName(String(ruleObj.targetFaceName || ''));
                        if (switchIds.length > 0 && originalFaceName && targetFaceName) {
                            rules.push({
                                switchIds: switchIds,
                                mode: mode,
                                originalFaceName: originalFaceName,
                                targetFaceName: targetFaceName
                            });
                        }
                    }
                });
            }
        } catch (e) {
            // 解析失败时不输出任何信息，静默忽略
        }
    }

    // 保存原始方法
    const _Game_Message_setFaceImage = Game_Message.prototype.setFaceImage;

    Game_Message.prototype.setFaceImage = function(faceName, faceIndex) {
        // 应用替换规则
        for (const rule of rules) {
            if (checkSwitches(rule.switchIds, rule.mode) && faceName === rule.originalFaceName) {
                faceName = rule.targetFaceName;
                break;
            }
        }
        _Game_Message_setFaceImage.call(this, faceName, faceIndex);
    };
})();