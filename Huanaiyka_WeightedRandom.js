/*:
 * @target MZ
 * @plugindesc 基于权重的随机数选择
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 插件概述
 * ============================================================================
 * 本插件允许您在事件中轻松实现基于权重的随机选择。
 * 例如：设定选项 A 权重为 1，选项 B 权重为 2，选项 C 权重为 5，
 * 则 C 被选中的概率是 A 的 5 倍，B 是 A 的 2 倍。
 * 
 * 随机结果会存入指定的游戏变量，之后您只需使用【条件分支】判断该变量，
 * 即可执行对应的事件逻辑（例如“如果变量 = 1 则执行 A 事件”）。
 * 
 * ============================================================================
 * 使用方法
 * ============================================================================

插件指令下方会显示两个参数：
 *  权重列表(weights)   : 输入用英文逗号分隔的权重，例如 1,2,5
 *                            （也支持中文逗号“1，2，5”或空格“1 2 5”）
 *  结果变量ID(resultVar): 输入用于存储结果的变量编号，例如 10
 * 
 * 执行后，指定的变量（如上例中的 10）将获得一个整数结果：
 *   - 若结果为 1，代表选中了第 1 个权重对应的选项（权重 1）
 *   - 若结果为 2，代表选中了第 2 个权重对应的选项（权重 2）
 *   - 若结果为 3，代表选中了第 3 个权重对应的选项（权重 5）
 *   - 若结果为 0，表示权重列表无效或为空（请检查控制台错误）
 * 
 * 之后在事件中使用【条件分支】指令判断该变量的值：
 *   ◆条件分支：变量 10 == 1
 *     ◆文本：选中了A事件
 *   ：分支结束
 *   ◆条件分支：变量 10 == 2
 *     ◆文本：选中了B事件
 *   ：分支结束
 *   ◆条件分支：变量 10 == 3
 *     ◆文本：选中了C事件
 *   ：分支结束
 *   ◆条件分支：变量 10 == 0
 *     ◆文本：权重设置错误，请检查插件命令
 *   ：分支结束
 * 
 * ============================================================================
 * 脚本调用（高级用户）
 * ============================================================================
 * 您也可以直接在事件脚本中使用以下函数：
 * 
 * 1. 将随机结果存入变量（索引从1开始，便于条件分支）
 *    WeightedRandom.drawToVariable(权重数组, 变量ID);
 *    示例：WeightedRandom.drawToVariable([1,2,5], 10);
 * 
 * 2. 仅获取随机索引（0-based，便于自行处理）
 *    var idx = WeightedRandom.randomIndexByWeight(权重数组);
 *    示例：var idx = WeightedRandom.randomIndexByWeight([1,2,5]);
 * 
 * ============================================================================
 * 常见问题与解决
 * ============================================================================
 * Q：执行插件命令后，变量值没有变化（仍然是0或之前的数值）
 * A：请检查以下几点：
 *    1. 确保插件已启用（插件管理器中勾选）。
 *    2. 确保【结果变量ID】填的是数字（如10），而不是变量名称。
 *    3. 权重列表请使用正数（整数或小数），例如 0.5, 1, 2 是允许的。
 *    4. 如果使用中文字符，请确保逗号为全角“，”或半角“,”均支持。
 *    5. 打开游戏控制台（F12）查看是否有红色的错误信息。
 * 
 * ============================================================================
 * 更新日志
 * ============================================================================
 * v1.2.0 修复变量不更新的潜在问题：增强权重解析（支持中英文逗号、空格），
 *         强化错误处理，出错时将变量设为 0。
 * v1.1.0 添加了插件命令的可视化界面参数。
 * v1.0.0 首个版本发布。
 * 
 * @command draw
 * @text 权重随机分支
 * @desc 根据权重列表随机选取一个选项，并将结果存入变量。
 * 
 * @arg weights
 * @text 权重列表
 * @desc 正数权重，支持英文逗号分隔(1,2,5) 或中文逗号(1，2，5) 或空格(1 2 5)
 * @type string
 * @default 1,1,1
 * 
 * @arg resultVar
 * @text 结果变量ID
 * @desc 存储选中项编号（从1开始）的变量ID。如果出错会存入0。
 * @type number
 * @default 1
 */

(() => {
    const PLUGIN_NAME = "Huanaiyka_WeightedRandom";

    /**
     * 将用户输入的权重字符串标准化为英文逗号分隔的字符串
     * @param {string} raw 原始输入
     * @returns {string} 标准化后的字符串
     */
    function normalizeWeightsString(raw) {
        if (typeof raw !== 'string') return "";
        // 将中文逗号、全角逗号替换为英文逗号
        let str = raw.replace(/[，、]/g, ',');
        // 将空白（空格、制表符、多个空格）替换为英文逗号
        str = str.replace(/\s+/g, ',');
        // 去除连续逗号
        str = str.replace(/,+/g, ',');
        // 去除首尾逗号
        str = str.replace(/^,|,$/g, '');
        return str;
    }

    /**
     * 根据权重数组返回随机的索引（0-based）
     * @param {number[]} weights 权重数组，例如 [1, 2, 5]
     * @returns {number} 选中项的索引（0 起始），如果权重无效则返回 -1
     */
    function randomIndexByWeight(weights) {
        if (!Array.isArray(weights) || weights.length === 0) {
            return -1;
        }

        let total = 0;
        for (let w of weights) {
            if (typeof w !== 'number' || w <= 0) {
                return -1;
            }
            total += w;
        }

        if (total <= 0) {
            return -1;
        }

        let rand = Math.random() * total;
        let accumulator = 0;
        for (let i = 0; i < weights.length; i++) {
            accumulator += weights[i];
            if (rand < accumulator) {
                return i;
            }
        }
        // 保险回退（理论上不会执行到这里）
        return weights.length - 1;
    }

    /**
     * 执行权重随机，并将结果存入指定变量。
     * 存储的值是从 1 开始的序号（便于条件分支判断 1,2,3...）。
     * @param {number[]} weights 权重数组
     * @param {number} variableId 要存储结果的变量 ID
     */
    function drawToVariable(weights, variableId) {
        // 确保 variableId 是有效数字
        let vid = (typeof variableId === 'number' && !isNaN(variableId)) ? variableId : 1;
        if (variableId !== vid) {
            console.warn(`[${PLUGIN_NAME}] 变量ID无效，已自动改为 1。`);
        }

        let idx0 = randomIndexByWeight(weights);
        let result = (idx0 >= 0) ? (idx0 + 1) : 0;
        $gameVariables.setValue(vid, result);
        
        // 调试输出（可在控制台查看）
        if (result === 0) {
            console.error(`[${PLUGIN_NAME}] 权重随机失败，结果变量 ${vid} 已被设为 0。请检查权重列表。`);
        } else {
            console.log(`[${PLUGIN_NAME}] 权重随机成功，选中序号 ${result} (索引 ${idx0})，结果存入变量 ${vid}`);
        }
    }

    // 注册插件命令（带可视化参数）
    PluginManager.registerCommand(PLUGIN_NAME, "draw", args => {
        // 获取参数
        let weightsRaw = args.weights;
        let resultVarId = parseInt(args.resultVar, 10);

        // 校验结果变量 ID，若无效则回退到 1 号变量
        if (isNaN(resultVarId)) {
            console.error(`[${PLUGIN_NAME}] 参数错误: resultVar 必须是数字，已自动使用变量 1。`);
            resultVarId = 1;
        }

        // 校验权重输入是否为空
        if (!weightsRaw || weightsRaw.trim() === "") {
            $gameVariables.setValue(resultVarId, 0);
            console.warn(`[${PLUGIN_NAME}] 权重列表为空，结果变量 ${resultVarId} 已设为 0。`);
            return;
        }

        // 标准化权重字符串（支持中文逗号、空格等）
        let normalized = normalizeWeightsString(weightsRaw);
        if (normalized === "") {
            $gameVariables.setValue(resultVarId, 0);
            console.warn(`[${PLUGIN_NAME}] 标准化后的权重列表为空，结果变量 ${resultVarId} 已设为 0。`);
            return;
        }

        // 解析权重列表
        let weightParts = normalized.split(",");
        let weights = [];
        for (let part of weightParts) {
            let w = parseFloat(part.trim());
            if (isNaN(w) || w <= 0) {
                $gameVariables.setValue(resultVarId, 0);
                console.error(`[${PLUGIN_NAME}] 无效权重值: "${part}"，权重必须为正数。结果变量 ${resultVarId} 已设为 0。`);
                return;
            }
            weights.push(w);
        }

        // 执行随机并存入变量
        drawToVariable(weights, resultVarId);
    });

    // 将核心函数暴露到全局，方便脚本调用
    window.WeightedRandom = {
        randomIndexByWeight: randomIndexByWeight,
        drawToVariable: drawToVariable
    };
})();