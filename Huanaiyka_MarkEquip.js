/*:
 * @target MZ
 * @plugindesc 玩家手动标记武器/防具
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 功能说明
 * ============================================================================
 * - 在装备菜单中，选中任意武器或防具，按标记键（默认M）即可添加/取消标记。
 * - 被标记的装备名称前显示★（可自定义符号，留空则不显示符号），文字颜色变为您指定的颜色。
 * - 可设置标记符号显示在图标的左侧（前）或右侧（后）。
 * - 每次标记或取消标记时播放音效。
 * - 标记数据保存在存档中。
 * - 完全兼容 DarkPlasma_HighlightNewItem.js：不会干扰该插件设置的新物品高亮颜色。
 *
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 进入主菜单 → 装备。
 * 2. 选择一个装备栏位，按右方向键打开装备列表。
 * 3. 选中一个武器或防具，按下标记键（默认M）：
 *    - 若未标记：添加标记（★ + 变色 + 音效）
 *    - 若已标记：取消标记（恢复默认 + 音效）
 *
 * ============================================================================
 * 参数设置（可在插件管理器中修改）
 * ============================================================================
 * @param markKey
 * @text 标记键位（字母或数字）
 * @desc 按下哪个键来标记/取消标记。可直接输入字母（如 A、M），也可输入键盘代码（如 77）。默认 M。
 * @type string
 * @default M
 *
 * @param markedColorId
 * @text 标记后的文字颜色编号
 * @desc 被标记的装备名称显示的颜色（0~31）。默认4 = 绿色。
 * @type number
 * @default 4
 *
 * @param markSymbol
 * @text 标记符号
 * @desc 显示在装备名称前面的符号，留空则不显示符号。默认"★"。
 * @type string
 * @default ★
 *
 * @param markSymbolColorId
 * @text 标记符号颜色编号
 * @desc 标记符号的颜色编号（0~31）。默认6 = 黄色。
 * @type number
 * @default 6
 *
 * @param markSymbolPosition
 * @text 标记符号位置
 * @desc 符号显示在图标的左侧（前）还是右侧（后）。
 * @type select
 * @option 图标前 (beforeIcon)
 * @value beforeIcon
 * @option 图标后 (afterIcon)
 * @value afterIcon
 * @default afterIcon
 *
 * @param markSe
 * @text 标记音效
 * @desc 标记/取消标记时播放的音效文件（点击右侧“...”按钮选择）。
 * @type file
 * @dir audio/se
 * @default Flash1
 *
 * @param markSeVolume
 * @text 音效音量
 * @desc 音量 (0~100)。默认80。
 * @type number
 * @default 80
 *
 * @param markSePitch
 * @text 音效音调
 * @desc 音调 (50~150)。默认100。
 * @type number
 * @default 100
 */

(() => {
    "use strict";

    // ============================================================================
    // 动态获取插件名（适配任意文件名）
    // ============================================================================
    const getPluginName = () => {
        const scripts = document.querySelectorAll('script[src]');
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src && src.includes('/js/plugins/') && src.includes('.js')) {
                const match = src.match(/[^/]+(?=\.js$)/);
                if (match) {
                    const possibleName = match[0];
                    const params = PluginManager.parameters(possibleName);
                    if (params && (params['markKey'] !== undefined || params['markedColorId'] !== undefined)) {
                        return possibleName;
                    }
                }
            }
        }
        console.warn("Huanaiyka_MarkEquip: 无法自动检测插件名，使用默认 'Huanaiyka_MarkEquip'");
        return 'Huanaiyka_MarkEquip';
    };

    const pluginName = getPluginName();
    const parameters = PluginManager.parameters(pluginName);

    // 辅助函数：将用户输入的键位（字母或数字字符串）转换为 keyCode
    const parseKeyCode = (keyParam) => {
        if (!keyParam || keyParam.trim() === '') return 77; // 默认 M
        const trimmed = keyParam.trim();
        // 如果是纯数字字符串，则直接作为数字 keyCode
        if (/^\d+$/.test(trimmed)) {
            return Number(trimmed);
        }
        // 否则取第一个字母的大写形式，转换为 ASCII 码
        const firstChar = trimmed.charAt(0).toUpperCase();
        return firstChar.charCodeAt(0);
    };

    // 读取旧版参数 markKeyCode（兼容性）
    let markKeyCode = null;
    if (parameters['markKeyCode'] !== undefined) {
        markKeyCode = Number(parameters['markKeyCode']);
    }
    // 读取新版参数 markKey（优先）
    let markKeyParam = parameters['markKey'] !== undefined ? String(parameters['markKey']) : null;
    let finalKeyCode;
    if (markKeyParam !== null) {
        finalKeyCode = parseKeyCode(markKeyParam);
    } else if (markKeyCode !== null) {
        finalKeyCode = markKeyCode;
    } else {
        finalKeyCode = 77; // 默认 M
    }

    const markedColorId = Number(parameters['markedColorId'] !== undefined ? parameters['markedColorId'] : 4);
    // 符号：如果参数存在（包括空字符串）则使用参数值，否则使用默认值 '★'
    const markSymbol = parameters['markSymbol'] !== undefined ? String(parameters['markSymbol']) : '★';
    const markSymbolColorId = Number(parameters['markSymbolColorId'] !== undefined ? parameters['markSymbolColorId'] : 6);
    const markSymbolPosition = String(parameters['markSymbolPosition'] !== undefined ? parameters['markSymbolPosition'] : 'afterIcon');
    const markSe = parameters['markSe'] !== undefined ? String(parameters['markSe']) : 'Flash1';
    const markSeVolume = Number(parameters['markSeVolume'] !== undefined ? parameters['markSeVolume'] : 80);
    const markSePitch = Number(parameters['markSePitch'] !== undefined ? parameters['markSePitch'] : 100);

    // 尝试读取 DarkPlasma 新物品高亮插件的颜色设置（如果存在）
    let darkPlasmaNewItemColor = null;
    const darkPlasmaPluginName = 'DarkPlasma_HighlightNewItem';
    const darkPlasmaParams = PluginManager.parameters(darkPlasmaPluginName);
    if (darkPlasmaParams && darkPlasmaParams.newItemColor) {
        darkPlasmaNewItemColor = Number(darkPlasmaParams.newItemColor);
    }

    // ============================================================================
    // 数据存储（扩展 Game_System）
    // ============================================================================
    const Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        Game_System_initialize.call(this);
        this._markedWeapons = this._markedWeapons || [];
        this._markedArmors = this._markedArmors || [];
    };

    Game_System.prototype.isWeaponMarked = function(weaponId) {
        return this._markedWeapons && this._markedWeapons.includes(weaponId);
    };
    Game_System.prototype.toggleWeaponMark = function(weaponId) {
        if (!this._markedWeapons) this._markedWeapons = [];
        const idx = this._markedWeapons.indexOf(weaponId);
        if (idx >= 0) this._markedWeapons.splice(idx, 1);
        else this._markedWeapons.push(weaponId);
    };

    Game_System.prototype.isArmorMarked = function(armorId) {
        return this._markedArmors && this._markedArmors.includes(armorId);
    };
    Game_System.prototype.toggleArmorMark = function(armorId) {
        if (!this._markedArmors) this._markedArmors = [];
        const idx = this._markedArmors.indexOf(armorId);
        if (idx >= 0) this._markedArmors.splice(idx, 1);
        else this._markedArmors.push(armorId);
    };

    Game_System.prototype.isEquipmentMarked = function(item) {
        if (!item) return false;
        if (item.wtypeId !== undefined) return this.isWeaponMarked(item.id);
        if (item.atypeId !== undefined) return this.isArmorMarked(item.id);
        return false;
    };
    Game_System.prototype.toggleEquipmentMark = function(item) {
        if (!item) return;
        if (item.wtypeId !== undefined) this.toggleWeaponMark(item.id);
        else if (item.atypeId !== undefined) this.toggleArmorMark(item.id);
    };

    // ============================================================================
    // 音效播放
    // ============================================================================
    const playMarkSe = () => {
        if (markSe && markSe.trim() !== '') {
            AudioManager.playSe({
                name: markSe,
                volume: markSeVolume,
                pitch: markSePitch,
                pan: 0
            });
        }
    };

    // ============================================================================
    // 装备场景：监听标记键
    // ============================================================================
    const _Scene_Equip_update = Scene_Equip.prototype.update;
    Scene_Equip.prototype.update = function() {
        _Scene_Equip_update.call(this);
        const itemWindow = this._itemWindow;
        if (itemWindow && itemWindow.active && itemWindow.item()) {
            if (Input.isTriggered('mark')) {
                const item = itemWindow.item();
                if (item && (item.wtypeId !== undefined || item.atypeId !== undefined)) {
                    $gameSystem.toggleEquipmentMark(item);
                    playMarkSe();
                    itemWindow.refresh();
                }
            }
        }
    };

    // 注册输入键
    Input.keyMapper[finalKeyCode] = 'mark';

    // ============================================================================
    // 完全重写 Window_EquipItem 的 drawItemName（兼容位置参数与符号留空）
    // 同时兼容 DarkPlasma 新物品高亮
    // ============================================================================
    const _Window_EquipItem_drawItemName = Window_EquipItem.prototype.drawItemName;
    Window_EquipItem.prototype.drawItemName = function(item, x, y, width) {
        if (!item) return;

        // 固定图标占用宽度（含右侧间距）
        const iconBoxWidth = ImageManager.iconWidth + 4;
        // 符号占用宽度（如果有符号）
        const symbolWidth = 30;

        // 判断标记状态
        const isMarked = $gameSystem && $gameSystem.isEquipmentMarked(item);
        // 检测是否为 DarkPlasma 定义的新物品（若其方法存在）
        let isNew = false;
        if (typeof this.isNewItem === 'function') {
            try {
                isNew = this.isNewItem(item);
            } catch (e) {}
        }

        // 确定符号文本（仅当标记且符号参数非空时使用）
        let symbolText = '';
        if (isMarked && markSymbol && markSymbol.trim() !== '') {
            symbolText = markSymbol;
        }

        // 确定物品名称颜色
        let itemColorId = null;
        if (isMarked) {
            itemColorId = markedColorId; // 玩家标记优先
        } else if (isNew && darkPlasmaNewItemColor !== null) {
            itemColorId = darkPlasmaNewItemColor; // 未标记的新物品高亮色
        }

        // 开始绘制，根据符号位置决定绘制顺序
        // 情况1：符号在图标前 (beforeIcon)
        if (markSymbolPosition === 'beforeIcon' && symbolText.length > 0) {
            // 绘制符号（单独颜色）
            this.changeTextColor(ColorManager.textColor(markSymbolColorId));
            this.drawText(symbolText, x, y, symbolWidth, 'left');
            const iconX = x + symbolWidth;
            this.drawIcon(item.iconIndex, iconX, y);
            const nameX = iconX + iconBoxWidth;
            const nameWidth = width - symbolWidth - iconBoxWidth;
            if (itemColorId !== null) {
                this.changeTextColor(ColorManager.textColor(itemColorId));
            } else {
                this.resetTextColor();
            }
            this.drawText(item.name, nameX, y, nameWidth, 'left');
        }
        // 情况2：符号在图标后 (afterIcon) 或者符号为空（按图标后逻辑处理，但不绘符号）
        else {
            // 先绘制图标
            this.drawIcon(item.iconIndex, x, y);
            let textX = x + iconBoxWidth;
            let textWidth = width - iconBoxWidth;

            // 如果有符号，绘制符号（占用30px）并调整名称起始位置
            if (symbolText.length > 0) {
                this.changeTextColor(ColorManager.textColor(markSymbolColorId));
                this.drawText(symbolText, textX, y, symbolWidth, 'left');
                textX += symbolWidth;
                textWidth -= symbolWidth;
            }

            // 绘制物品名称
            if (itemColorId !== null) {
                this.changeTextColor(ColorManager.textColor(itemColorId));
            } else {
                this.resetTextColor();
            }
            this.drawText(item.name, textX, y, textWidth, 'left');
        }

        // 恢复默认颜色，避免污染后续绘制
        this.resetTextColor();
    };
})();