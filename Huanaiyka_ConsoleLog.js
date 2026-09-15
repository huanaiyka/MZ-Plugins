/*:
 * @target MZ
 * @plugindesc 从控制台输出信息
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @command LogLongCode
 * @text 输出文字
 * @desc 在开发者控制台按行输出文本。
 *
 * @arg content
 * @text 文字内容
 * @desc 要输出的代码或文本（支持直接换行，无需手动写 \n）。
 * @type note
 * @default ""
 *
 * @help
 * ============================================================================
 * 插件功能
 * ============================================================================
 * 本插件可以在 RPG Maker MZ 游戏运行时，通过插件命令向开发者控制台
 * （F12 或 DevTools）输出多行文本信息，便于调试和查看日志。
 * 
 * 本插件的制作目的是，用「特殊的方式」将长文本、代码或日志信息「交给玩家」，
 * 而无需让玩家跳转到外部网页或使用浏览器查看。
 * ============================================================================
 * 注意事项
 * ============================================================================
 * 1. 本插件仅在「开发者控制台」中输出信息，玩家在正常游戏中看不到输出内容。
 * 2. 要查看请在游戏运行时按 F12 打开开发者工具，切换到 Console（控制台）选项卡。
 * 3. 内容为空时，控制台会输出「(空内容)」提示。
 * 4. 本插件不解析 JavaScript 表达式，仅按纯文本输出。如需输出变量值，
 *    建议在事件中用「显示文字」或「注释」辅助查看，或使用其他调试插件。
 */

(() => {
    'use strict';

    // 获取当前插件的文件名（请保证文件名与本文件名一致，默认为此文件名）
    const pluginName = "Huanaiyka_ConsoleLog";

    // 注册 MZ 插件命令
    PluginManager.registerCommand(pluginName, "LogLongCode", args => {
        // 获取内容参数
        let content = args.content;

        // 如果内容为空，给出提示
        if (!content || content.trim() === '') {
            console.log('(空内容)');
            return;
        }

        // 处理 @type note 产生的 JSON 字符串或直接的多行文本
        try {
            content = JSON.parse(content);
        } catch (e) {
            // 如果不是 JSON 格式，直接按原文本处理
        }

        // 按换行符分割并输出每一行
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            console.log(lines[i]);
        }
    });

})();