/*:
 * @target MZ
 * @plugindesc 对多个变量进行排序
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 插件说明
 * ----------------------------------------------------------------------------
 * 本插件用于对一组游戏变量按数值从大到小排序，
 * 并返回指定名次对应的变量ID（例如第1名、第2名……）。
 * 
 * 可以指定一个额外的变量来存储最高分（第1名）在原变量列表中的“第几位”。
 * ============================================================================
 * 插件指令
 * ----------------------------------------------------------------------------
 * 变量ID列表 : 参与排序的变量ID，支持逗号和范围，如 10-15,20-25
 * 输出变量ID : 存放结果的变量编号
 * 位置变量ID : 存放最高分在列表中的排位（从1开始），0=不输出
 * 排名数量   : 只取前几位参与排名（0=全部变量）
 * 输出索引   : 1=第1名ID，2=第2名ID……
 *
 * 示例：变量ID列表填 10-15，输出变量ID填 31，位置变量ID填 32，
 *       排名数量填 0，输出索引填 1。
 *       → 将变量10~15中数值最大的变量ID存入变量31，
 *         并将该最高分在列表中的位置(如: 4)存入变量32。
 * ============================================================================
 * 更新履历 (Changelog)
 * ----------------------------------------------------------------------------
 * v1.9
 *  - 优化安全过滤：变量为空或非数字时当作0处理，避免排序异常。
 * 
 * v1.8
 *  - 修复“排名数量”语义：明确为只取前几位参与排名（0=全部）。
 * 
 * v1.7
 *  - 新增功能：可额外输出最高分在列表中的排位（第几位）。
 * 
 * v1.6
 *  - 将“输出索引”从下拉选择改为数字输入框，支持任意排名。
 *  - 默认参数调整为：变量列表 1-10，输出变量 1。
 * 
 * v1.5
 *  - 初始版本：支持变量范围排序并输出指定排名变量ID。
 * ============================================================================
 * 
 * @param defaultVarList
 * @text 默认变量ID列表
 * @desc 变量ID，支持逗号和范围。示例：1-10,20-25
 * @type string
 * @default 1-10
 * 
 * @param defaultOutputVar
 * @text 默认输出变量ID
 * @desc 存放结果的游戏变量编号
 * @type variable
 * @default 1
 * 
 * @param defaultPosOutputVar
 * @text 默认位置变量ID
 * @desc 存放最高分在列表中的排位（从1开始），0=不输出
 * @type variable
 * @default 2
 * 
 * @param defaultTopCount
 * @text 默认排名数量
 * @desc 参与排名的数量（0=全部变量）
 * @type number
 * @decimals 0
 * @default 0
 * 
 * @param defaultResultIndex
 * @text 默认输出索引
 * @desc 1=第一名ID，2=第二名ID...
 * @type number
 * @min 1
 * @decimals 0
 * @default 1
 * 
 * @command VarRank
 * @text 变量排行
 * @desc 对变量列表排序，输出指定排名的变量ID
 * 
 * @arg varList
 * @text 变量ID列表
 * @desc 要排序的变量ID，支持逗号和范围，如 1-10,20-25
 * @type string
 * @default 1-10
 * 
 * @arg outputVar
 * @text 输出变量ID
 * @desc 存放结果变量的编号
 * @type variable
 * @default 1
 * 
 * @arg posOutputVar
 * @text 位置变量ID
 * @desc 存放最高分在列表中的排位（从1开始），0=不输出
 * @type variable
 * @default 2
 * 
 * @arg topCount
 * @text 排名数量
 * @desc 只取前几位参与排名（0=全部变量）
 * @type number
 * @decimals 0
 * @default 0
 * 
 * @arg resultIndex
 * @text 输出索引
 * @desc 1=第一名ID，2=第二名...
 * @type number
 * @min 1
 * @decimals 0
 * @default 1
 */

(() => {
    const PLUGIN_NAME = 'Huanaiyka_VariableRanking';
    const parameters = PluginManager.parameters(PLUGIN_NAME);

    const defaultVarList = parameters['defaultVarList'] || '1-10';
    const defaultOutputVar = Number(parameters['defaultOutputVar']) || 1;
    const defaultPosOutputVar = Number(parameters['defaultPosOutputVar']) || 2;
    const defaultTopCount = Number(parameters['defaultTopCount']) || 0;
    const defaultResultIndex = Number(parameters['defaultResultIndex']) || 1;

    function parseVarList(str) {
        const ids = [];
        if (!str) return ids;
        const parts = String(str).split(',');
        for (let part of parts) {
            part = part.trim();
            if (part === '') continue;
            const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
            if (rangeMatch) {
                let start = parseInt(rangeMatch[1], 10);
                let end = parseInt(rangeMatch[2], 10);
                if (start > end) [start, end] = [end, start];
                for (let i = start; i <= end; i++) ids.push(i);
            } else {
                const num = parseInt(part, 10);
                if (!isNaN(num)) ids.push(num);
            }
        }
        return [...new Set(ids)];
    }

    function rankAndOutput(varListStr, outputVarId, posOutputVarId, topCount, resultIndex) {
        const varIds = parseVarList(varListStr);
        if (varIds.length === 0) {
            console.error(`${PLUGIN_NAME}: 变量ID列表无效`);
            return;
        }
        if (isNaN(outputVarId) || outputVarId <= 0) {
            console.error(`${PLUGIN_NAME}: 输出变量ID无效`);
            return;
        }

        let effectiveTopCount;
        if (topCount === null || topCount === undefined || isNaN(topCount) || topCount < 1) {
            effectiveTopCount = varIds.length;
        } else {
            effectiveTopCount = Math.min(topCount, varIds.length);
        }

        if (isNaN(resultIndex) || resultIndex < 1) resultIndex = 1;

        // 记录原始列表的顺序，用于获取最高分是在第几个
        const originalIndexMap = new Map();
        varIds.forEach((id, index) => {
            originalIndexMap.set(id, index + 1);
        });

        // 安全过滤：如果变量为空或不是数字，则当作 0 处理
        const scores = varIds.map(id => {
            let val = $gameVariables.value(id);
            let numVal = Number(val);
            if (isNaN(numVal) || val === null || val === undefined || val === '') {
                numVal = 0;
            }
            return { id, value: numVal };
        });
        
        // 稳定排序（当分值相同时，保持原列表顺序）
        scores.sort((a, b) => b.value - a.value);

        const topIds = [];
        for (let i = 0; i < effectiveTopCount; i++) topIds.push(scores[i].id);

        let result = 0;
        if (resultIndex >= 1 && resultIndex <= topIds.length) {
            result = topIds[resultIndex - 1];
        }
        $gameVariables.setValue(outputVarId, result);

        // 处理位置变量输出
        if (posOutputVarId && !isNaN(posOutputVarId) && posOutputVarId > 0) {
            let highestPos = 0;
            // 只要列表中至少有一个变量，就能找出最高分所在位置
            if (scores.length > 0) {
                // scores 排序后第一个就是最高分
                highestPos = originalIndexMap.get(scores[0].id);
            }
            $gameVariables.setValue(posOutputVarId, highestPos);
        }
    }

    PluginManager.registerCommand(PLUGIN_NAME, 'VarRank', args => {
        const varList = (args.varList !== undefined && args.varList !== '') ? args.varList : defaultVarList;
        const outputVar = (args.outputVar !== undefined && args.outputVar !== '') ? Number(args.outputVar) : defaultOutputVar;
        
        const posOutputVar = (args.posOutputVar !== undefined && args.posOutputVar !== '')
            ? Number(args.posOutputVar)
            : defaultPosOutputVar;

        let topCount;
        if (args.topCount !== undefined && args.topCount !== '') {
            topCount = Number(args.topCount);
        } else {
            topCount = defaultTopCount;
        }

        const resultIndex = (args.resultIndex !== undefined && args.resultIndex !== '')
            ? Number(args.resultIndex)
            : defaultResultIndex;

        rankAndOutput(varList, outputVar, posOutputVar, topCount, resultIndex);
    });
})();