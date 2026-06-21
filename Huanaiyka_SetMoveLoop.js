/*:
 * @target MV MZ
 * @plugindesc 事件踏步/行走动画改为重头循环
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 在事件备注栏或任意页面备注栏写入以下标签启用循环动画（0,1,2,0,1,2...）：
 *   <PatternMode: restart>
 * 不写则保持 RPG Maker 默认的往复模式（0,1,2,1,0...）。
 * 支持行走图文件名后缀 _M数字 自定义帧数，如 Actor1_M4。
 * 
 * 修复内容：
 *   - 不再修改非 restart 事件的初始帧和内部状态
 *   - 完全兼容其他插件和默认踏步动画
 */

(() => {
    // 获取行走图实际帧数（默认 3 帧，支持 _M数字）
    function getFrameCount(characterName) {
        const match = characterName && characterName.match(/_M(\d+)$/);
        return match ? parseInt(match[1]) : 3;
    }

    // 初始化成员变量（只添加新变量，不改变原有 _pattern 初值）
    const _initMembers = Game_CharacterBase.prototype.initMembers;
    Game_CharacterBase.prototype.initMembers = function() {
        _initMembers.call(this);
        this._customPatternMode = null;   // 仅 'restart' 或 null
        this._realNumPattern = 3;
        this._restartCounter = 0;
        // 注意：不修改 this._pattern，保持原系统默认值（0）
    };

    // 换图时更新帧数，但不覆盖原有 _pattern（除非是 restart 模式需要重置计数器）
    const _setImage = Game_CharacterBase.prototype.setImage;
    Game_CharacterBase.prototype.setImage = function(characterName, characterIndex) {
        _setImage.call(this, characterName, characterIndex);
        this._realNumPattern = getFrameCount(characterName);
        
        // 如果当前是 restart 模式，则需要重置计数器为中间帧（保持外观平滑）
        if (this._customPatternMode === 'restart') {
            const middle = Math.floor(this._realNumPattern / 2);
            this._restartCounter = middle;
        }
        // 非 restart 模式：完全不管 _pattern 和 _restartCounter
    };

    // 供外部获取实际帧数
    Game_CharacterBase.prototype.numPattern = function() {
        return this._realNumPattern;
    };

    // 覆写 pattern（仅 restart 事件返回循环计数，否则走原始逻辑）
    const _basePattern = Game_CharacterBase.prototype.pattern;
    Game_CharacterBase.prototype.pattern = function() {
        if (this instanceof Game_Event && this._customPatternMode === 'restart') {
            return this._restartCounter % this.numPattern();
        }
        return _basePattern.call(this);
    };

    // 覆写 updatePattern（仅 restart 事件采用每帧递增，否则走原始逻辑）
    const _updatePattern = Game_CharacterBase.prototype.updatePattern;
    Game_CharacterBase.prototype.updatePattern = function() {
        if (this instanceof Game_Event && this._customPatternMode === 'restart') {
            this._restartCounter++;
            return;
        }
        _updatePattern.call(this);
    };

    // ---------- 以下为事件备注读取与模式设置 ----------
    function getEventData(event) {
        if (event._event) return event._event;
        const map = $dataMap;
        if (map && map.events && map.events[event._eventId]) {
            return map.events[event._eventId];
        }
        return null;
    }

    function hasRestartTag(event, pageIndex = null) {
        const eventData = getEventData(event);
        if (!eventData) return false;

        if (pageIndex !== null && eventData.pages && eventData.pages[pageIndex]) {
            const note = eventData.pages[pageIndex].note || "";
            if (/<PatternMode:\s*restart\s*>/i.test(note)) return true;
        }

        if (eventData.pages) {
            for (let i = 0; i < eventData.pages.length; i++) {
                const note = eventData.pages[i].note || "";
                if (/<PatternMode:\s*restart\s*>/i.test(note)) return true;
            }
        }

        if (eventData.note && /<PatternMode:\s*restart\s*>/i.test(eventData.note)) return true;
        return false;
    }

    Game_Event.prototype._readPatternNote = function() {
        try {
            let isRestart = false;
            if (this._page) {
                let pageIndex = -1;
                const eventData = getEventData(this);
                if (eventData && eventData.pages) {
                    for (let i = 0; i < eventData.pages.length; i++) {
                        if (eventData.pages[i] === this._page) {
                            pageIndex = i;
                            break;
                        }
                    }
                }
                if (pageIndex !== -1) {
                    isRestart = hasRestartTag(this, pageIndex);
                }
            }
            if (!isRestart) {
                isRestart = hasRestartTag(this);
            }

            const newMode = isRestart ? 'restart' : null;
            if (newMode !== this._customPatternMode) {
                this._customPatternMode = newMode;
                if (newMode === 'restart') {
                    // 启用 restart 模式时，将计数器设为中间帧，保证起始帧与外观一致
                    const middle = Math.floor(this.numPattern() / 2);
                    this._restartCounter = middle;
                }
            }
        } catch (e) {
            // 静默失败
        }
    };

    // 在切换页面、刷新、初始化时读取备注
    const _setupPage = Game_Event.prototype.setupPage;
    Game_Event.prototype.setupPage = function() {
        _setupPage.call(this);
        this._readPatternNote();
    };
    const _refresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function() {
        _refresh.call(this);
        this._readPatternNote();
    };
    const _initialize = Game_Event.prototype.initialize;
    Game_Event.prototype.initialize = function(mapId, eventId) {
        _initialize.call(this, mapId, eventId);
        this._readPatternNote();
    };
})();