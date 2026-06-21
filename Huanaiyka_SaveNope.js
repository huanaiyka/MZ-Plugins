/*:
 * @target MZ
 * @plugindesc 禁用存档并显示文字
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 功能说明:
 *   在指定的地图或条件下，玩家点击菜单中的“存档”按钮时，不会进入存档界面，
 *   而是弹出一个自定义文字的提示窗口。
 * 
 * ============================================================================
 * 控制条件（优先级从高到低）:
 *   1. 通过插件指令强制开启/关闭封禁（优先级最高）
 *   2. 通过一个游戏开关控制（需要在插件参数中启用并指定开关ID）
 *   3. 通过一个地图ID列表控制（在插件参数中指定禁止存档的地图ID）
 *
 * ============================================================================
 * 插件指令（在事件的「插件指令」中选择 Huanaiyka_SaveNope）:
 * ----------------------------------------------------------------------------
 * 指令格式                    说明
 * block                      强制启用存档封禁（之后点存档只会显示提示）
 * unblock                    解除强制封禁（恢复到开关/地图ID的判断方式）
 * message <文字>             设置临时提示文字（例如：message 剧情中无法保存）
 * defaultmsg                 恢复提示文字为插件参数中设置的默认文字
 * reset                      完全重置所有指令状态（解除封禁 + 恢复默认文字）
 * ----------------------------------------------------------------------------
 * 注意: 使用 message 指令时，如果文字中包含空格，建议用英文双引号包裹。
 *
 * ============================================================================
 * 注意事项:
 *   - 所有通过插件指令设置的状态都会被保存在存档文件中，读档后依然生效。
 *   - 如果遇到与其他菜单修改类插件的冲突，请调整插件加载顺序（将本插件放在下方）。
 *   - 提示窗口使用的是 Window_Base 的子类，完全兼容 MZ 的默认绘制。
 *   - 输入检测使用 Input.isTriggered("ok"/"cancel") 和 TouchInput.isTriggered()。
 * ============================================================================
 * @param mapIds
 * @text 禁止存档的地图ID
 * @desc 多个ID用英文逗号分隔，例如：1,5,8。留空则禁用此列表。
 * @default 
 *
 * @param message
 * @text 默认提示文字
 * @desc 点击存档时显示的默认消息（当没有使用 message 指令覆盖时）
 * @default 当前地图无法进行存档。
 *
 * @param useSwitch
 * @text 启用开关控制
 * @type boolean
 * @on 启用
 * @off 禁用
 * @desc 若启用，则当下方指定的开关为 ON 时禁止存档。
 * @default false
 *
 * @param switchId
 * @text 控制开关ID
 * @type switch
 * @desc 当“启用开关控制”为 ON 时，此开关开启会禁止存档。
 * @default 1
 *
 * @command block
 * @text 强制启用存档封禁
 * @desc 启用后无视地图与开关设置，点击存档将显示提示。
 *
 * @command unblock
 * @text 解除强制封禁
 * @desc 解除“强制启用存档封禁”状态，恢复地图ID/开关的判断。
 *
 * @command message
 * @text 设置封禁提示文字
 * @desc 设置当存档被封禁时显示的提示消息。
 * @arg text
 * @text 提示文字内容
 * @type string
 * @default
 *
 * @command defaultmsg
 * @text 恢复默认提示文字
 * @desc 将提示文字恢复为插件参数中设置的默认文字。
 *
 * @command reset
 * @text 重置所有指令状态
 * @desc 解除强制封禁，并恢复默认提示文字。
 */

(() => {
    const pluginName = "Huanaiyka_SaveNope";
    const params = PluginManager.parameters(pluginName);
    const mapIds = params['mapIds'] ? params['mapIds'].split(',').map(Number) : [];
    const defaultMessage = params['message'] || '当前地图无法进行存档。';
    const useSwitch = params['useSwitch'] === 'true';
    const switchId = Number(params['switchId']) || 1;

    // 持久化数据初始化
    const init = () => {
        if ($gameSystem.saveNopeForceBlock === undefined) $gameSystem.saveNopeForceBlock = null;
        if ($gameSystem.saveNopeCustomMessage === undefined) $gameSystem.saveNopeCustomMessage = null;
    };

    function isBlocked() {
        init();
        if ($gameSystem.saveNopeForceBlock !== null) return $gameSystem.saveNopeForceBlock;
        if (useSwitch) return $gameSwitches.value(switchId);
        return mapIds.includes($gameMap.mapId());
    }

    function getMessage() {
        init();
        return $gameSystem.saveNopeCustomMessage !== null ? $gameSystem.saveNopeCustomMessage : defaultMessage;
    }

    // --- 提示窗口（支持键盘确定/取消 + 鼠标左键/右键关闭）---
    class BlockPopup extends Window_Base {
        constructor(text, menuScene) {
            // 测量文本宽度
            const temp = new Window_Base(new Rectangle(0,0,Graphics.boxWidth,Graphics.boxHeight));
            const textW = temp.textWidth(text);
            temp.destroy();
            let width = Math.max(150, Math.min(Graphics.boxWidth-40, textW+40));
            const height = 80;
            const x = (Graphics.boxWidth - width)/2;
            const y = Graphics.boxHeight - height - 40;
            super(new Rectangle(x, y, width, height));
            this._menuScene = menuScene;
            this.drawText(text, 0, 0, width-20, "center");
            this.activate();
            // 禁用菜单命令窗口
            if (menuScene._commandWindow) menuScene._commandWindow.deactivate();
        }

        update() {
            super.update();
            // 键盘确定/取消
            if (Input.isTriggered("ok") || Input.isTriggered("cancel")) {
                this.closePopup();
                return;
            }
            // 鼠标任意键点击（左键或右键）均可关闭
            if (TouchInput.isTriggered()) {
                this.closePopup();
            }
        }

        closePopup() {
            this.close();
            // 恢复菜单命令窗口
            if (this._menuScene && this._menuScene._commandWindow) {
                this._menuScene._commandWindow.activate();
            }
            if (this.parent) this.parent.removeChild(this);
            this.destroy();
        }
    }

    // 重写菜单存档命令
    const _commandSave = Scene_Menu.prototype.commandSave;
    Scene_Menu.prototype.commandSave = function() {
        if (isBlocked()) {
            this.addChild(new BlockPopup(getMessage(), this));
        } else {
            _commandSave.call(this);
        }
    };

    // 插件指令注册
    PluginManager.registerCommand(pluginName, "block", () => { init(); $gameSystem.saveNopeForceBlock = true; });
    PluginManager.registerCommand(pluginName, "unblock", () => { init(); $gameSystem.saveNopeForceBlock = false; });
    PluginManager.registerCommand(pluginName, "message", args => { init(); $gameSystem.saveNopeCustomMessage = args.text || null; });
    PluginManager.registerCommand(pluginName, "defaultmsg", () => { init(); $gameSystem.saveNopeCustomMessage = null; });
    PluginManager.registerCommand(pluginName, "reset", () => { init(); $gameSystem.saveNopeForceBlock = null; $gameSystem.saveNopeCustomMessage = null; });
})();