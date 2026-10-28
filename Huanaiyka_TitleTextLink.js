/*:
 * @target MZ
 * @name 标题文字链接
 * @plugindesc 在标题界面显示可点击跳转的文字或图片
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 插件说明
 * ============================================================================
 * 本插件允许你在标题界面显示一行自定义的小字。
 * 你可以设置这行字的内容、位置、颜色、大小、粗细、斜体、描边，
 * 以及点击后要执行的脚本（例如跳转到指定网页）。
 *
 * 请在“点击执行的脚本”参数中，替换成你需要使用的网页地址。
 *
 * 此外，本插件还支持在标题界面显示多张图片（列表配置），
 * 图片的透明部分不响应点击，只有有效像素部分可以点击跳转。
 *
 * @param position
 * @text 位置预设
 * @type select
 * @desc 选择文字在标题界面的显示位置。
 * @default bottom_center
 * @option 正下方居中
 * @value bottom_center
 * @option 左下角
 * @value bottom_left
 * @option 右下角
 * @value bottom_right
 * @option 正上方居中
 * @value top_center
 * @option 左上角
 * @value top_left
 * @option 右上角
 * @value top_right
 * @option 自定义坐标
 * @value custom
 *
 * @param margin
 * @text 边距
 * @type number
 * @min 0
 * @max 9999
 * @desc 文字距离屏幕边缘的像素距离（用于预设位置）。
 * @default 3
 *
 * @param text
 * @text 显示的文字
 * @desc 要在标题界面显示的文字内容。
 * @default 游戏版本：ver0.1
 *
 * @param x
 * @text X坐标（自定义）
 * @desc 仅当位置预设为“自定义坐标”时生效。可以使用数字或JavaScript表达式。
 * @default Graphics.width / 2
 *
 * @param y
 * @text Y坐标（自定义）
 * @desc 仅当位置预设为“自定义坐标”时生效。可以使用数字或JavaScript表达式。
 * @default Graphics.height - 40
 *
 * @param fontSize
 * @text 字体大小
 * @type number
 * @min 8
 * @max 200
 * @desc 文字的字号大小（像素）。
 * @default 16
 *
 * @param color
 * @text 文字颜色
 * @desc 文字的颜色，支持CSS颜色格式，如 #ffffff、rgba(255,255,255,0.8) 等。
 * @default rgba(255,255,255,1)
 *
 * @param hoverColor
 * @text 悬停颜色
 * @desc 鼠标悬停时文字的颜色。留空则使用原颜色。
 * @default rgba(255,255,0,1)
 *
 * @param bold
 * @text 加粗
 * @type boolean
 * @desc 是否将文字加粗显示。
 * @default false
 *
 * @param italic
 * @text 斜体
 * @type boolean
 * @desc 是否将文字以斜体显示。
 * @default false
 *
 * @param outlineWidth
 * @text 描边宽度
 * @type number
 * @min 0
 * @max 20
 * @desc 文字描边的像素宽度。设为 0 可关闭描边。
 * @default 3
 *
 * @param outlineColor
 * @text 描边颜色
 * @desc 文字描边的颜色，支持CSS颜色格式。
 * @default rgba(0, 0, 0, 1)
 *
 * @param script
 * @text 点击执行的脚本
 * @desc 点击文字后要执行的 JavaScript 代码。this 指向文字控件对象。
 * @default window.open('https://www.example.com', '_blank');
 *
 * @param clickable
 * @text 是否可点击
 * @type boolean
 * @desc 设置为 true 时文字可点击，false 时仅显示不可点击。
 * @default true
 *
 * @param imageList
 * @text 图片列表
 * @type struct<ImageLink>[]
 * @desc 配置在标题界面显示的可点击图片列表。透明部分不响应点击。
 * @default []
 */

/*~struct~ImageLink:
 * @param name
 * @text 图片文件名
 * @type file
 * @dir img/pictures/
 * @desc 选择 img/pictures/ 目录下的图片文件。
 * @default
 *
 * @param script
 * @text 点击执行的脚本
 * @desc 点击图片有效像素后要执行的 JavaScript 代码。this 指向图片控件对象。
 * @default window.open('https://www.example.com', '_blank');
 *
 * @param clickable
 * @text 是否可点击
 * @type boolean
 * @desc 设置为 true 时图片可点击，false 时仅显示不可点击。
 * @default true
 */

(() => {
    'use strict';

    const pluginName = 'Huanaiyka_TitleTextLink';
    const params = PluginManager.parameters(pluginName);

    const POSITION = (params['position'] || 'bottom_center').trim() || 'bottom_center';
    const MARGIN = Number(params['margin']) ?? 12;
    const TEXT = params['text'] || '点击这里';
    const CUSTOM_X = params['x'] || 'Graphics.width / 2';
    const CUSTOM_Y = params['y'] || 'Graphics.height - 40';
    const FONT_SIZE = Number(params['fontSize']) || 16;
    const COLOR = params['color'] || 'rgba(255,255,255,0.8)';
    const HOVER_COLOR = params['hoverColor'] || '';
    const BOLD = params['bold'] === 'true';
    const ITALIC = params['italic'] === 'true';
    const OUTLINE_WIDTH = Number(params['outlineWidth']) ?? 2;
    const OUTLINE_COLOR = params['outlineColor'] || 'rgba(0, 0, 0, 0.8)';
    const SCRIPT = params['script'] || '';
    const CLICKABLE = params['clickable'] === 'true';

    //-------------------------------------------------------------------------
    // 图片文件名规范化
    //-------------------------------------------------------------------------
    // @type file + @dir img/pictures/ 存储的可能是带目录/扩展名的字符串，
    // 这里统一剥离前缀和扩展名，得到 ImageManager.loadPicture 可用的名字。
    function normalizePictureName(raw) {
        if (!raw) return '';
        return String(raw)
            .replace(/^img[\\/]pictures[\\/]/i, '')
            .replace(/\.(png|jpe?g|webp)$/i, '')
            .trim();
    }

    // 解析图片列表
    function parseImageList(raw) {
        if (!raw) return [];
        let arr;
        try {
            arr = JSON.parse(raw);
        } catch (e) {
            console.warn(pluginName + ': 解析图片列表失败', e);
            return [];
        }
        if (!Array.isArray(arr)) return [];
        const result = [];
        for (const item of arr) {
            let obj;
            try {
                obj = typeof item === 'string' ? JSON.parse(item) : item;
            } catch (e) {
                console.warn(pluginName + ': 解析图片列表项失败', item, e);
                continue;
            }
            if (!obj) continue;
            const name = normalizePictureName(obj['name']);
            if (!name) continue;
            result.push({
                name: name,
                script: obj['script'] || '',
                clickable: obj['clickable'] === 'true'
            });
        }
        return result;
    }

    const IMAGE_LIST = parseImageList(params['imageList']);

    function parseCoordinate(value) {
        if (typeof value === 'number') return value;
        try {
            return Function('"use strict"; return (' + value + ')')();
        } catch (e) {
            console.warn(pluginName + ': 解析坐标失败 - ' + value, e);
            return 0;
        }
    }

    //=============================================================================
    // Window_TitleTextLink
    //=============================================================================
    class Window_TitleTextLink extends Window_Base {
        initialize() {
            const rect = new Rectangle(0, 0, Graphics.width, FONT_SIZE * 2 + 12);
            super.initialize(rect);

            this.opacity = 0;
            this._text = TEXT;
            this._fontSize = FONT_SIZE;
            this._color = COLOR;
            this._hoverColor = HOVER_COLOR || COLOR;
            this._bold = BOLD;
            this._italic = ITALIC;
            this._outlineWidth = OUTLINE_WIDTH;
            this._outlineColor = OUTLINE_COLOR;
            this._script = SCRIPT;
            this._clickable = CLICKABLE;
            this._isHovered = false;

            this.updatePosition();
            this.refresh();
        }

        updatePosition() {
            const h = Graphics.height;
            const w = Graphics.width;
            const bh = this.height;

            if (POSITION === 'custom') {
                this.x = parseCoordinate(CUSTOM_X) - w / 2;
                this.y = parseCoordinate(CUSTOM_Y) - bh / 2;
                this._align = 'center';
            } else {
                this.x = 0;
                switch (POSITION) {
                    case 'bottom_left':
                        this.y = h - MARGIN - bh;
                        this._align = 'left';
                        break;
                    case 'bottom_right':
                        this.y = h - MARGIN - bh;
                        this._align = 'right';
                        break;
                    case 'bottom_center':
                    default:
                        this.y = h - MARGIN - bh;
                        this._align = 'center';
                        break;
                    case 'top_left':
                        this.y = MARGIN;
                        this._align = 'left';
                        break;
                    case 'top_right':
                        this.y = MARGIN;
                        this._align = 'right';
                        break;
                    case 'top_center':
                        this.y = MARGIN;
                        this._align = 'center';
                        break;
                }
            }
        }

        resetFontSettings() {
            super.resetFontSettings();
            this.contents.fontSize = this._fontSize;
            this.contents.fontBold = this._bold;
            this.contents.fontItalic = this._italic;
            this.contents.textColor = this._isHovered ? this._hoverColor : this._color;
            this.contents.outlineColor = this._outlineColor;
            this.contents.outlineWidth = this._outlineWidth;
        }

        isHit(mx, my) {
            if (!this._clickable) return false;
            if (my < this.y || my > this.y + this.height) return false;

            const textW = this.textSizeEx(this._text).width;
            let left, right;

            if (POSITION === 'custom') {
                const centerX = parseCoordinate(CUSTOM_X);
                left = centerX - textW / 2;
                right = centerX + textW / 2;
            } else {
                if (this._align === 'center') {
                    const cx = Graphics.width / 2;
                    left = cx - textW / 2;
                    right = cx + textW / 2;
                } else if (this._align === 'right') {
                    right = Graphics.width - MARGIN;
                    left = right - textW;
                } else {
                    left = MARGIN;
                    right = left + textW;
                }
            }

            return mx >= left && mx <= right;
        }

        setHovered(hovered) {
            if (this._isHovered === hovered) return;
            this._isHovered = hovered;
            this.refresh();
        }

        callScript() {
            if (!this._script) return;
            try {
                const func = new Function('"use strict"; return (function() { ' + this._script + ' })');
                const fn = func();
                fn.call(this);
            } catch (e) {
                console.error(pluginName + ': 执行脚本时出错 - ', e);
            }
        }

        refresh() {
            this.contents.clear();
            this.resetFontSettings();

            let startX = 0;
            const padding = this.padding;
            const drawWidth = this.contentsWidth();

            if (this._align === 'left') {
                startX = MARGIN - padding;
            } else if (this._align === 'right') {
                startX = drawWidth - MARGIN + padding - this.textSizeEx(this._text).width;
            } else {
                startX = 0;
            }

            this.contents.drawText(
                this._text,
                startX,
                0,
                drawWidth,
                this.contentsHeight(),
                this._align
            );
        }
    }

    //=============================================================================
    // Sprite_TitleImageLink
    //=============================================================================
    class Sprite_TitleImageLink extends Sprite {
        initialize(config) {
            super.initialize();
            this._config = config;
            this._script = config.script;
            this._clickable = config.clickable;
            this._isHovered = false;
            this._hitData = null;

            this.loadImage();
        }

        loadImage() {
            const name = this._config.name;
            if (!name) return;
            const bmp = ImageManager.loadPicture(name);
            bmp.addLoadListener(() => {
                this.bitmap = bmp;
                this.x = 0;
                this.y = 0;
                this._buildHitData();
            });
        }

        _buildHitData() {
            // 构建透明像素判断数据：将图片绘制到离屏canvas读取像素
            try {
                const w = this.bitmap.width;
                const h = this.bitmap.height;
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(this.bitmap.canvas, 0, 0);
                const imgData = ctx.getImageData(0, 0, w, h);
                this._hitData = {
                    width: w,
                    height: h,
                    data: imgData.data
                };
            } catch (e) {
                console.warn(pluginName + ': 构建图片点击数据失败，将使用整体矩形区域 - ', e);
                this._hitData = null;
            }
        }

        isHit(mx, my) {
            if (!this._clickable) return false;
            if (!this.bitmap) return false;

            const lx = Math.floor(mx - this.x);
            const ly = Math.floor(my - this.y);
            if (lx < 0 || ly < 0 || lx >= this.bitmap.width || ly >= this.bitmap.height) {
                return false;
            }

            // 若无法读取像素数据，则退化为矩形区域判断
            if (!this._hitData) return true;

            const idx = (ly * this._hitData.width + lx) * 4;
            const alpha = this._hitData.data[idx + 3];
            // 透明度阈值：alpha 大于 0 视为有效像素
            return alpha > 0;
        }

        setHovered(hovered) {
            if (this._isHovered === hovered) return;
            this._isHovered = hovered;
            // 悬停时可稍微调整透明度作为反馈
            this.opacity = hovered ? 220 : 255;
        }

        callScript() {
            if (!this._script) return;
            try {
                const func = new Function('"use strict"; return (function() { ' + this._script + ' })');
                const fn = func();
                fn.call(this);
            } catch (e) {
                console.error(pluginName + ': 执行图片脚本时出错 - ', e);
            }
        }
    }

    //=============================================================================
    // Scene_Title 扩展
    //=============================================================================
    const _Scene_Title_createForeground = Scene_Title.prototype.createForeground;
    Scene_Title.prototype.createForeground = function() {
        _Scene_Title_createForeground.call(this);
        this._createTitleImageLinks();
        this._createTitleTextLinkWindow();
    };

    Scene_Title.prototype._createTitleImageLinks = function() {
        // 清理旧的图片精灵
        if (this._titleImageLinks) {
            for (const sprite of this._titleImageLinks) {
                if (sprite.parent) sprite.parent.removeChild(sprite);
            }
        }
        this._titleImageLinks = [];

        for (const config of IMAGE_LIST) {
            const sprite = new Sprite_TitleImageLink(config);
            this.addChild(sprite);
            this._titleImageLinks.push(sprite);
        }
    };

    Scene_Title.prototype._createTitleTextLinkWindow = function() {
        if (this._titleTextLinkWindow) {
            this.removeChild(this._titleTextLinkWindow);
            this._titleTextLinkWindow = null;
        }
        const win = new Window_TitleTextLink();
        this.addChild(win);
        this._titleTextLinkWindow = win;
    };

    const _Scene_Title_update = Scene_Title.prototype.update;
    Scene_Title.prototype.update = function() {
        _Scene_Title_update.call(this);
        this._updateTitleTextLink();
        this._updateTitleImageLinks();
    };

    Scene_Title.prototype._updateTitleTextLink = function() {
        const win = this._titleTextLinkWindow;
        if (!win) return;

        if (win.parent && win.parent.children[win.parent.children.length - 1] !== win) {
            win.parent.addChild(win);
        }

        const mx = TouchInput.x;
        const my = TouchInput.y;
        const hit = win.isHit(mx, my);
        win.setHovered(hit);

        if (TouchInput.isTriggered() && hit) {
            win.callScript();
        }
    };

    Scene_Title.prototype._updateTitleImageLinks = function() {
        if (!this._titleImageLinks) return;

        const mx = TouchInput.x;
        const my = TouchInput.y;
        const triggered = TouchInput.isTriggered();

        // 从后往前遍历，后添加的图片（上层）优先响应
        for (let i = this._titleImageLinks.length - 1; i >= 0; i--) {
            const sprite = this._titleImageLinks[i];
            const hit = sprite.isHit(mx, my);
            sprite.setHovered(hit);
            if (triggered && hit) {
                sprite.callScript();
                break;
            }
        }
    };

    const _Scene_Title_terminate = Scene_Title.prototype.terminate;
    Scene_Title.prototype.terminate = function() {
        if (this._titleImageLinks) {
            for (const sprite of this._titleImageLinks) {
                if (sprite.parent) sprite.parent.removeChild(sprite);
            }
            this._titleImageLinks = null;
        }
        if (this._titleTextLinkWindow) {
            if (this._titleTextLinkWindow.parent) {
                this._titleTextLinkWindow.parent.removeChild(this._titleTextLinkWindow);
            }
            this._titleTextLinkWindow = null;
        }
        _Scene_Title_terminate.call(this);
    };

})();