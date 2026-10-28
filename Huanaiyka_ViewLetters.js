/*:
 * @target MZ
 * @plugindesc 信件列表界面
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @param switchStartId
 * @text 开关起始ID
 * @desc 第一封“是否得到信”的开关ID。
 * @type switch
 * @default 1
 *
 * @param commonEventStartId
 * @text 公共事件起始ID
 * @desc 第一封“查看信内容”的公共事件ID。
 * @type common_event
 * @default 1
 *
 * @param letterCount
 * @text 信件总数
 * @desc 一共有多少封信。
 * @type number
 * @min 1
 * @default 40
 *
 * @param noLetterText
 * @text 没有信件时的提示
 * @desc 一封都没获得时显示的文字。
 * @type text
 * @default 你还没有收到任何信。
 *
 * @param titleText
 * @text 界面标题
 * @desc 列表界面顶部的标题文字。
 * @type text
 * @default 信件
 *
 * @param windowWidth
 * @text 窗口宽度
 * @desc 列表窗口的宽度（像素）。
 * @type number
 * @min 200
 * @default 600
 *
 * @param windowHeight
 * @text 窗口高度
 * @desc 列表窗口的高度（像素）。0 表示自动适应。
 * @type number
 * @min 0
 * @default 0
 *
 * @param pinTop
 * @text 置顶显示
 * @desc 开启后列表从屏幕顶部开始显示，而不是垂直居中。
 * @type boolean
 * @on 置顶
 * @off 居中
 * @default false
 *
 * @param topMargin
 * @text 顶部边距
 * @desc 置顶显示时，距离屏幕顶部的像素。
 * @type number
 * @min 0
 * @default 0
 *
 * @command openLetterList
 * @text 打开信件列表
 * @desc 打开列表界面。不填参数时默认使用插件全局设置。
 *
 * @arg switchStartId
 * @text 开关起始ID
 * @desc 覆盖全局设置（留空或0表示使用全局设置）。
 * @type switch
 * @default 0
 *
 * @arg commonEventStartId
 * @text 公共事件起始ID
 * @desc 覆盖全局设置（留空或0表示使用全局设置）。
 * @type common_event
 * @default 0
 *
 * @arg letterCount
 * @text 信件总数
 * @desc 覆盖全局设置（留空或0表示使用全局设置）。
 * @type number
 * @min 0
 * @default 0
 *
 * @help
 * ============================================================
 *  信件列表界面 Huanaiyka_ViewLetters
 * ============================================================
 *
 * 【功能】
 * 打开一个自定义列表界面，列出所有已获得的信件（开关 ON），
 * 玩家用方向键选择，按确定键查看内容（播放对应公共事件）。
 *
 * 【使用方法】
 * 1. 在数据库中，把“得到信”的开关和“查看信内容”的公共事件
 *    设置成连续编号，并且一一对应。
 * 2. 在事件里插入“插件命令” → “Huanaiyka_ViewLetters: 打开信件列表”。
 * 3. 填写参数即可。
 *
 * 【按键说明】
 * - 查看信件：确定键（ok）。
 * - 关闭列表：取消键（cancel）。
 *
 * 【注意】
 * - 公共事件的触发条件请设为“无”。
 * - 列表只显示已获得的信（开关 ON）。
 * - 选项文字使用开关名。
 */

(() => {
    "use strict";

    const pluginName = "Huanaiyka_ViewLetters";

    const rawParameters = PluginManager.parameters(pluginName);
    const globalParams = {
        switchStart: Number(rawParameters["switchStartId"]) || 1,
        commonStart: Number(rawParameters["commonEventStartId"]) || 1,
        count: Math.max(1, Number(rawParameters["letterCount"]) || 40),
        noLetterText: rawParameters["noLetterText"] || "你还没有收到任何信。",
        titleText: rawParameters["titleText"] || "信件",
        windowWidth: Number(rawParameters["windowWidth"]) || 600,
        windowHeight: Number(rawParameters["windowHeight"]) || 0,
        pinTop: rawParameters["pinTop"] === "true",
        topMargin: Number(rawParameters["topMargin"]) || 0
    };

    //-------------------------------------------------------------------------
    // 布局常量
    //-------------------------------------------------------------------------

    const TITLE_HEIGHT = 56;   // 标题窗口高度
    const TITLE_GAP = 8;       // 标题与列表之间的间隙
    const ROW_HEIGHT = 40;     // 每行高度
    const LIST_PADDING = 16;   // 列表窗口上下内边距
    const MIN_ROWS = 3;        // 最少显示行数（少于这个数也占这么多行高）
    const MAX_ROWS = 8;        // 最多显示行数（超过则滚动）

    //-------------------------------------------------------------------------
    // 信件数据
    //-------------------------------------------------------------------------

    class LetterData {
        constructor(params) {
            this.switchStart = params.switchStart;
            this.commonStart = params.commonStart;
            this.count = params.count;
            this.noLetterText = params.noLetterText;
            this.titleText = params.titleText;
            this.windowWidth = params.windowWidth;
            this.windowHeight = params.windowHeight;
            this.pinTop = params.pinTop;
            this.topMargin = params.topMargin;
            this.items = [];
            this.refresh();
        }

        refresh() {
            this.items = [];
            for (let i = 0; i < this.count; i++) {
                const switchId = this.switchStart + i;
                if (switchId > 0 && $gameSwitches.value(switchId)) {
                    this.items.push({
                        index: i,
                        switchId: switchId,
                        commonEventId: this.commonStart + i,
                        name: $dataSystem.switches[switchId] || `信件 ${i + 1}`
                    });
                }
            }
        }

        maxItems() {
            return this.items.length;
        }

        itemAt(index) {
            return this.items[index] || null;
        }
    }

    //-------------------------------------------------------------------------
    // 标题窗口（独立）
    //-------------------------------------------------------------------------

    class Window_LetterTitle extends Window_Base {
        initialize(title, rect) {
            super.initialize(rect);
            this._title = title || "";
            this.refresh();
        }

        refresh() {
            this.contents.clear();
            if (!this._title) return;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(this._title, 0, 0, this.contentsWidth(), "center");
            this.resetTextColor();
        }
    }

    //-------------------------------------------------------------------------
    // 列表窗口
    //-------------------------------------------------------------------------

    class Window_LetterList extends Window_Selectable {
        initialize(letterData, rect) {
            this._letterData = letterData;
            super.initialize(rect);
            this.refresh();
            this.select(0);
            this.activate();
        }

        maxItems() {
            return Math.max(1, this._letterData.maxItems());
        }

        itemHeight() {
            return ROW_HEIGHT;
        }

        // 不显示滚动条
        scrollBarVisible() {
            return false;
        }

        // 不绘制滚动条箭头
        drawScrollBar() {
            // 什么都不画
        }

        drawItem(index) {
            const rect = this.itemRect(index);
            const item = this._letterData.itemAt(index);
            this.resetTextColor();
            if (item) {
                this.drawText(item.name, rect.x + 12, rect.y, rect.width - 24, "left");
            } else {
                this.changeTextColor(ColorManager.systemColor());
                this.drawText(this._letterData.noLetterText, rect.x + 12, rect.y, rect.width - 24, "left");
                this.resetTextColor();
            }
        }

        refresh() {
            if (!this.contents) return;
            this.contents.clear();
            this.drawAllItems();
        }

        isOkEnabled() {
            return !!this._letterData.itemAt(this.index());
        }

        isCancelEnabled() {
            return true;
        }

        processOk() {
            const item = this._letterData.itemAt(this.index());
            if (item) {
                SoundManager.playOk();
                this.updateInputData();
                this.callOkHandler();
            } else {
                SoundManager.playBuzzer();
            }
        }

        processCancel() {
            SoundManager.playCancel();
            this.updateInputData();
            this.callCancelHandler();
        }
    }

    //-------------------------------------------------------------------------
    // 场景
    //-------------------------------------------------------------------------

    class Scene_LetterList extends Scene_MenuBase {
        prepare(letterData) {
            this._letterData = letterData || null;
        }

        create() {
            super.create();

            if (!this._letterData) {
                this._letterData = new LetterData(globalParams);
            } else {
                this._letterData.refresh();
            }

            this.createTitleWindow();
            this.createListWindow();
        }

        calcLayout() {
            const width = this._letterData.windowWidth;
            const itemCount = this._letterData.maxItems();
            const rows = Math.min(Math.max(itemCount, MIN_ROWS), MAX_ROWS);
            const listHeight = this._letterData.windowHeight > 0
                ? this._letterData.windowHeight
                : ROW_HEIGHT * rows + LIST_PADDING * 2;
            const totalHeight = TITLE_HEIGHT + TITLE_GAP + listHeight;
            const x = Math.max(0, (Graphics.boxWidth - width) / 2);
            const baseY = this._letterData.pinTop
                ? this._letterData.topMargin
                : Math.max(0, (Graphics.boxHeight - totalHeight) / 2);
            return { width, listHeight, x, baseY };
        }

        createTitleWindow() {
            const l = this.calcLayout();
            const rect = new Rectangle(l.x, l.baseY, l.width, TITLE_HEIGHT);
            this._titleWindow = new Window_LetterTitle(this._letterData.titleText, rect);
            this.addWindow(this._titleWindow);
        }

        createListWindow() {
            const l = this.calcLayout();
            const rect = new Rectangle(
                l.x,
                l.baseY + TITLE_HEIGHT + TITLE_GAP,
                l.width,
                l.listHeight
            );
            this._listWindow = new Window_LetterList(this._letterData, rect);
            this._listWindow.setHandler("ok", this.onListOk.bind(this));
            this._listWindow.setHandler("cancel", this.onListCancel.bind(this));
            this.addWindow(this._listWindow);
        }

        onListOk() {
            const item = this._letterData.itemAt(this._listWindow.index());
            if (item) {
                this.popScene();
                $gameTemp.reserveCommonEvent(item.commonEventId);
            }
        }

        onListCancel() {
            this.popScene();
        }
    }

    //-------------------------------------------------------------------------
    // 插件命令
    //-------------------------------------------------------------------------

    PluginManager.registerCommand(pluginName, "openLetterList", args => {
        const params = {
            switchStart: Number(args.switchStartId) || globalParams.switchStart,
            commonStart: Number(args.commonEventStartId) || globalParams.commonStart,
            count: Number(args.letterCount) || globalParams.count,
            noLetterText: globalParams.noLetterText,
            titleText: globalParams.titleText,
            windowWidth: globalParams.windowWidth,
            windowHeight: globalParams.windowHeight,
            pinTop: globalParams.pinTop,
            topMargin: globalParams.topMargin
        };

        const letterData = new LetterData(params);

        SceneManager.push(Scene_LetterList);
        SceneManager.prepareNextScene(letterData);
    });

})();