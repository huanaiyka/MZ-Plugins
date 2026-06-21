/*:
 * @target MZ
 * @plugindesc 批量复制防具备注
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 功能说明
 * ============================================================================
 * 将指定“源防具”的备注内容，批量复制到目标列表中的所有防具。
 * 支持覆盖或追加两种模式。追加时自动换行。
 * 
 * 本插件修改的是内存中的防具数据，不会改动 Armors.json 文件。
 * 游戏启动时自动执行（若启用），也可通过插件指令手动执行。
 * 
 * @param enabled
 * @text 启用插件
 * @desc 是否在游戏启动时自动执行。
 * @type boolean
 * @default false
 * 
 * @param mode
 * @text 复制模式
 * @type select
 * @option 追加 (append)
 * @value append
 * @option 覆盖 (overwrite)
 * @value overwrite
 * @default append
 * 
 * @param sourceId
 * @text 源防具ID
 * @type number
 * @min 1
 * @default 1
 * 
 * @param targetList
 * @text 目标列表
 * @desc 支持范围（如2-50）和单独ID（如55），用英文逗号分隔。
 * @type string
 * @default 2-999
 * 
 * @param includeSource
 * @text 包含源防具自身
 * @desc 如果目标列表中包含源防具ID，是否处理其备注。
 * @type boolean
 * @default false
 * 
 * @command Huanaiyka_CloneArmorNote
 * @text 执行防具备注复制
 * @desc 手动触发复制（忽略 enabled 开关）
 */

(() => {
    const pluginName = "Huanaiyka_CloneArmorNote";
    let hasAutoExecuted = false;

    const parameters = PluginManager.parameters(pluginName);
    const enabled = parameters["enabled"] === "true";
    const mode = parameters["mode"] || "append";
    const sourceId = Number(parameters["sourceId"] || 1);
    const targetListStr = parameters["targetList"] || "2-999";
    const includeSource = parameters["includeSource"] === "true";

    // 调试日志开关（默认关闭，可手动改为 true 以查看过程）
    const DEBUG = false;

    function log(...args) {
        if (DEBUG) console.log(pluginName, ...args);
    }

    function warn(...args) {
        if (DEBUG) console.warn(pluginName, ...args);
    }

    function parseTargetList(str) {
        const ids = new Set();
        const parts = str.split(",");
        for (let part of parts) {
            part = part.trim();
            if (part === "") continue;
            if (part.includes("-")) {
                const [startStr, endStr] = part.split("-");
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (isNaN(start) || isNaN(end)) continue;
                const minId = Math.min(start, end);
                const maxId = Math.max(start, end);
                for (let i = minId; i <= maxId; i++) ids.add(i);
            } else {
                const id = parseInt(part, 10);
                if (!isNaN(id)) ids.add(id);
            }
        }
        return Array.from(ids).sort((a, b) => a - b);
    }

    function applyNoteToArmor(targetArmor, sourceNote) {
        if (!targetArmor) return;
        if (mode === "overwrite") {
            targetArmor.note = sourceNote;
        } else if (mode === "append") {
            const original = targetArmor.note || "";
            if (original === "") targetArmor.note = sourceNote;
            else targetArmor.note = original + "\n" + sourceNote;
        } else {
            targetArmor.note = sourceNote;
        }
    }

    function applyNoteFromSourceArmor() {
        if (!$dataArmors || $dataArmors.length <= 1) return;
        const sourceArmor = $dataArmors[sourceId];
        if (!sourceArmor) return;
        const sourceNote = sourceArmor.note || "";
        const maxId = $dataArmors.length - 1;
        let targetIds = parseTargetList(targetListStr);
        targetIds = targetIds.filter(id => id >= 1 && id <= maxId);
        if (targetIds.length === 0) return;

        for (const id of targetIds) {
            if (id === sourceId && !includeSource) continue;
            const armor = $dataArmors[id];
            if (armor) applyNoteToArmor(armor, sourceNote);
        }
    }

    // DataManager 加载完成后触发
    const _DataManager_makeDataAfterLoad = DataManager.makeDataAfterLoad;
    DataManager.makeDataAfterLoad = function() {
        _DataManager_makeDataAfterLoad.call(this);
        if (enabled && !hasAutoExecuted) {
            hasAutoExecuted = true;
            applyNoteFromSourceArmor();
        }
    };

    // Scene_Boot 后备触发
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        if (enabled && !hasAutoExecuted) {
            hasAutoExecuted = true;
            setTimeout(() => applyNoteFromSourceArmor(), 0);
        }
    };

    // 插件指令
    PluginManager.registerCommand(pluginName, "Huanaiyka_CloneArmorNote", function() {
        applyNoteFromSourceArmor();
    });
})();