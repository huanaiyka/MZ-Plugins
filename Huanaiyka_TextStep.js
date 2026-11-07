/*:
 * @target MZ
 * @plugindesc 内嵌整篇文本逐段显示
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 使用说明
 * ============================================================================
 * 
 * 【功能概述】
 * 台词直接写在插件参数的【文本条目列表】里，不需要外部 txt 文件。
 * 每次调用插件指令只读出一段，以"前缀 + 左引号 + 内容 + 右引号"的格式显示。
 * 读完后可选择自动触发一个公共事件。
 * 
 * ----------------------------------------------------------------------------
 * 【文本格式】
 * ----------------------------------------------------------------------------
 * 在参数【文本内容】里写台词。段落之间用一个【空行】分隔。
 * 段落内部的换行会被保留，在同一个消息框里显示为多行。
 * 
 * 示例：
 *     很久很久以前，这片大陆上存在着一位魔王。
 *     他所到之处，村庄化为灰烬，河流尽数干涸。
 * 
 *     （这里空一行）
 * 
 *     于是，四位勇者踏上了讨伐魔王的旅途。
 *     他们分别来自森林、雪原、沙漠与深海。
 * 
 *     （这里空一行）
 * 
 *     而如今，传说才刚刚开始。
 * 
 * 以上会被识别为 3 段，分 3 次显示。
 * 
 * ----------------------------------------------------------------------------
 * 【读完触发公共事件】
 * ----------------------------------------------------------------------------
 * 每个条目可以配置一个"读完触发公共事件"：
 *   - 填 0 = 不触发（默认）
 *   - 填正整数 = 读完最后一段后，自动调用对应 ID 的公共事件
 * 
 * 触发时机：读完最后一段、玩家关闭消息框后，立刻排队执行。
 * 如果多段台词连续播放（每次调用插件指令），只有最后一段读完后才会触发。
 * 
 * 常见用途：
 *   - 剧情结束后传送到下一张地图
 *   - 播放结束 BGM
 *   - 打开某个开关、接下一段剧情
 *   - 弹出选项让玩家选择
 * 
 * ----------------------------------------------------------------------------
 * 【进度是否随存档保存】
 * ----------------------------------------------------------------------------
 * 插件参数【进度随存档保存】：
 * 
 *   启用 = true（默认）
 *       当前读到第几段，会跟着玩家的存档一起保存。
 *       玩家存档、读档后，进度会接着之前的位置继续。
 *       不同存档各自独立，互不影响。
 * 
 *   关闭 = false
 *       进度只存在于本次游戏运行期间，不写入存档。
 *       玩家关掉游戏再打开、或读档后，进度都会从第 1 段开始。
 *       适合"每次对话都从头播放"的场景。
 * 
 * ----------------------------------------------------------------------------
 * 【批次号是什么】
 * ----------------------------------------------------------------------------
 * 批次号用于区分【同一份文本内容】被用在不同场合时各自的读取进度。
 * 
 *   - 同一内容只在【一个】地方播 → 批次号填 1 即可。
 *   - 同一内容在【多个】地方各播一遍，且进度互不干扰 → 分别填 1、2、3…
 * 
 * 说明：如果你每个条目都只在【一个】地方播，
 *       那所有条目的批次号都填 1 即可，完全不用管它。
 * 
 * ----------------------------------------------------------------------------
 * 【插件参数：文本条目列表】
 * ----------------------------------------------------------------------------
 * 为每个场景配置一条，包含：
 *   显示名称         —— 在插件指令里手动输入的名字
 *   文本内容         —— 台词，空行分段
 *   统一前缀         —— 该条目每段文本前加上的字符
 *   批次号           —— 该条目的读取进度编号（一般填 1）
 *   窗口位置         —— 顶部 / 中间 / 底部
 *   读完触发公共事件 —— 读完最后一段后要调用的公共事件 ID（0 = 不触发）
 * 
 * ----------------------------------------------------------------------------
 * 【插件指令】
 * ----------------------------------------------------------------------------
 * 显示下一句：
 *   文本条目 —— 手动输入条目的"显示名称"（必须与列表里完全一致）。
 *   每次执行，就往下读一段。
 * 
 * 重置进度：
 *   文本条目 —— 手动输入要重置的条目名称，进度归零，下次从第一段开始。
 * 
 * 重置所有进度：
 *   清空所有条目的读取进度。
 * 
 * ----------------------------------------------------------------------------
 * 【注意事项】
 * ----------------------------------------------------------------------------
 * - 文本条目名称必须与插件指令里输入的名称完全一致（区分大小写、空格）。
 * - 修改了参数内容后需重启游戏（插件会缓存已解析的文本）。
 * 
 * @param saveProgress
 * @text 进度随存档保存
 * @desc 启用后，读取进度会随玩家存档保存，读档后接着之前的进度继续。
 * @type boolean
 * @default true
 * 
 * @param textList
 * @text 文本条目列表
 * @desc 为每个场景配置条目：显示名称、文本内容、前缀、批次号、窗口位置、读完触发公共事件。
 * @type struct<TextEntry>[]
 * @default []
 * 
 * @param leftQuote
 * @text 左引号
 * @desc 加在每段内容前的左引号。留空表示不加。
 * @default “
 * 
 * @param rightQuote
 * @text 右引号
 * @desc 加在每段内容后的右引号。留空表示不加。
 * @default ”
 * 
 * @command ShowNext
 * @text 显示下一句
 * @desc 读取选定的条目，显示当前进度对应的下一段台词。
 * 
 * @arg listName
 * @text 文本条目
 * @desc 输入要显示的条目名称（必须与插件参数列表里的"显示名称"完全一致）
 * @default text1
 * 
 * @command ResetProgress
 * @text 重置进度
 * @desc 重置指定条目的读取进度，下次显示会从第一段开始。
 * 
 * @arg listName
 * @text 文本条目
 * @desc 输入要重置的条目名称（必须与插件参数列表里的"显示名称"完全一致）
 * @default text1
 * 
 * @command ResetAll
 * @text 重置所有进度
 * @desc 清空所有条目的读取进度。
 */

/*~struct~TextEntry:
 * @param displayName
 * @text 显示名称
 * @desc 在插件指令里手动输入的名字。
 * @default text1
 * 
 * @param content
 * @text 文本内容
 * @desc 台词内容，段落之间用空行分隔。段落内部的换行会保留。
 * @type multiline_string
 * @default 很久很久以前，这片大陆上存在着一位魔王。
 * 
 * 于是，四位勇者踏上了讨伐魔王的旅途。
 * 
 * 而如今，传说才刚刚开始。
 * 
 * @param prefix
 * @text 统一前缀
 * @desc 该条目每段文本前加上的字符。
 * @default ：
 * 
 * @param batchId
 * @text 批次号
 * @desc 该条目的读取进度编号。同一内容多处使用互不干扰时用不同编号，一般填 1。
 * @type number
 * @default 1
 * 
 * @param position
 * @text 窗口位置
 * @desc 该条目的显示位置。
 * @option 顶部
 * @value 顶部
 * @option 中间
 * @value 中间
 * @option 底部
 * @value 底部
 * @default 底部
 * 
 * @param afterCommonEvent
 * @text 读完触发公共事件
 * @desc 读完最后一段后要调用的公共事件 ID。填 0 表示不触发。
 * @type common_event
 * @default 0
 */

(() => {
    const pluginName = "Huanaiyka_TextStep";

    const params = PluginManager.parameters(pluginName);
    const SAVE_PROGRESS = String(params["saveProgress"]) === "true";
    const LEFT_QUOTE  = String(params["leftQuote"]  !== undefined ? params["leftQuote"]  : "“");
    const RIGHT_QUOTE = String(params["rightQuote"] !== undefined ? params["rightQuote"] : "”");

    // 解析文本条目列表
    let textList = [];
    try {
        const rawList = JSON.parse(params["textList"] || "[]");
        textList = rawList.map(item => {
            const obj = JSON.parse(item);
            return {
                displayName:     String(obj.displayName || ""),
                content:         String(obj.content     || ""),
                prefix:          String(obj.prefix      || ""),
                batchId:         String(obj.batchId !== undefined ? obj.batchId : "1"),
                position:        String(obj.position    || "底部"),
                afterCommonEvent: Number(obj.afterCommonEvent || 0)
            };
        });
    } catch (e) {
        console.error("Huanaiyka_TextStep: 解析文本条目列表失败。", e);
    }

    function findEntry(name) {
        return textList.find(e => e.displayName === name) || null;
    }

    // 缓存每个条目的分段结果
    let segmentCache = {};

    // 不随存档保存时的临时进度
    let tempProgressMap = {};

    function parseSegments(text) {
        const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        return normalized
            .split(/\n[ \t]*\n+/)
            .map(seg => seg.replace(/[ \t]+$/gm, "").replace(/^\n+|\n+$/g, ""))
            .filter(seg => seg.trim() !== "");
    }

    function getSegments(entry) {
        if (segmentCache[entry.displayName]) {
            return segmentCache[entry.displayName];
        }
        const segs = parseSegments(entry.content);
        segmentCache[entry.displayName] = segs;
        return segs;
    }

    function getProgressKey(entry) {
        return entry.displayName + "_" + entry.batchId;
    }

    // ---- 进度读写 ----
    function getProgressContainer() {
        if (SAVE_PROGRESS) {
            if (!$gameSystem._huanaiykaTextStep) {
                $gameSystem._huanaiykaTextStep = {};
            }
            return $gameSystem._huanaiykaTextStep;
        } else {
            return tempProgressMap;
        }
    }

    function getProgress(key) {
        const container = getProgressContainer();
        if (container[key] === undefined) container[key] = 0;
        return container[key];
    }

    function setProgress(key, value) {
        const container = getProgressContainer();
        container[key] = value;
    }

    function clearAllProgress() {
        if (SAVE_PROGRESS) {
            if ($gameSystem._huanaiykaTextStep) {
                $gameSystem._huanaiykaTextStep = {};
            }
        } else {
            tempProgressMap = {};
        }
    }

    function buildDisplayText(prefix, segment) {
        const segLines = segment.split("\n");
        if (segLines.length === 1) {
            return prefix + LEFT_QUOTE + segLines[0] + RIGHT_QUOTE;
        }
        const first  = prefix + LEFT_QUOTE + segLines[0];
        const middle = segLines.slice(1, -1);
        const last   = segLines[segLines.length - 1] + RIGHT_QUOTE;
        return [first, ...middle, last].join("\n");
    }

    // —— 显示下一句 ——
    PluginManager.registerCommand(pluginName, "ShowNext", args => {
        const displayName = String(args.listName || "");
        const entry = findEntry(displayName);
        if (!entry) {
            console.warn(`Huanaiyka_TextStep: 找不到条目「${displayName}」。`);
            return;
        }

        const segments = getSegments(entry);
        if (segments.length === 0) { console.warn("文本为空"); return; }

        const key = getProgressKey(entry);
        const idx = getProgress(key);
        if (idx >= segments.length) { console.warn("已读完"); return; }

        const currentText = buildDisplayText(entry.prefix, segments[idx]);
        setProgress(key, idx + 1);

        // 判断是否是最后一段
        const isLast = (idx + 1 >= segments.length);

        let position = 2;
        if (entry.position === "顶部") position = 0;
        else if (entry.position === "中间") position = 1;

        $gameMessage.setFaceImage("", 0);
        $gameMessage.setBackground(0);
        $gameMessage.setPositionType(position);
        $gameMessage.add(currentText);

        // 如果读完了最后一段，并且配置了公共事件，就排队执行
        // 使用 setCallback：等这条消息被玩家关闭之后再触发
        if (isLast && entry.afterCommonEvent > 0) {
            const commonEventId = entry.afterCommonEvent;
            $gameMessage.setCallback(() => {
                $gameTemp.reserveCommonEvent(commonEventId);
            });
        }

        $gameMessage._trigger = true;
    });

    // —— 重置进度 ——
    PluginManager.registerCommand(pluginName, "ResetProgress", args => {
        const entry = findEntry(String(args.listName || ""));
        if (!entry) {
            console.warn(`Huanaiyka_TextStep: 找不到条目「${args.listName}」。`);
            return;
        }
        setProgress(getProgressKey(entry), 0);
    });

    // —— 重置所有 ——
    PluginManager.registerCommand(pluginName, "ResetAll", args => {
        clearAllProgress();
    });

})();