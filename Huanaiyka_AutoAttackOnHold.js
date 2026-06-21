/*:
 * @target MZ
 * @plugindesc 快速战斗，鼠标长按时自动为所有角色选择攻击第一个敌人
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
============================================================================
 * 使用说明
============================================================================
 * 在战斗场景中，在任意处长按鼠标左键（或指定按键）将触发自动战斗模式：
 * 
 * - 自动为当前待机的角色选择“攻击”命令。
 * - 自动选择第一个敌人作为目标。
 * - 自动确认选择，直到所有角色命令输入完毕或鼠标松开。
 * - 效果类似键盘操作时“长按确定键”。
 * 
============================================================================
 * 插件参数
============================================================================
 * - holdButton: 触发自动功能的按键，默认为鼠标左键（'left'）。
 *               可选值：'left'（左键）、'right'（右键）、'middle'（中键）。
 * - checkInterval: 检查间隔帧数（1帧≈1/60秒），默认5，即每5帧执行一次自动操作。
 *                 数值越小响应越快，但可能增加性能开销。
 * - targetIndex: 目标敌人索引，默认为0（第一个敌人）。如果改为其他数字，则攻击指定索引的敌人。
 * - firstDelay: 首次触发延迟帧数，即按住后经过多少帧才开始执行第一次自动操作，默认15（约0.25秒）。
 *               增加此值可避免短暂点击误触发，设为0则按下后立即开始。
 * 
============================================================================
 * 注意
============================================================================
 * - 插件仅在战斗场景中生效。
 * - 如果角色没有“攻击”命令（如某些事件或状态禁止攻击），则自动跳过该角色。
 * - 松开鼠标立即停止自动操作。
 * 
 * @param holdButton
 * @text 触发按键
 * @desc 长按此键触发自动攻击。可选 left/right/middle。
 * @default left
 * @type select
 * @option 鼠标左键
 * @value left
 * @option 鼠标右键
 * @value right
 * @option 鼠标中键
 * @value middle
 * 
 * @param checkInterval
 * @text 检查间隔(帧)
 * @desc 每多少帧执行一次自动操作（1帧≈1/60秒）。默认5。
 * @default 60
 * @type number
 * @min 1
 * @max 60
 * 
 * @param targetIndex
 * @text 目标敌人索引
 * @desc 攻击第几个敌人（0=第一个）。默认0。
 * @default 0
 * @type number
 * @min 0
 * 
 * @param firstDelay
 * @text 首次触发延迟(帧)
 * @desc 长按后经过多少帧才执行第一次自动操作（1帧≈1/60秒）。默认15（约0.25秒）。
 * @default 120
 * @type number
 * @min 0
 */

(() => {
    const pluginName = 'AutoAttackOnHold';

    // 读取插件参数
    const parameters = PluginManager.parameters(pluginName);
    const holdButton = String(parameters['holdButton'] || 'left');
    const checkInterval = Number(parameters['checkInterval'] || 5);
    const targetIndex = Number(parameters['targetIndex'] || 0);
    const firstDelay = Number(parameters['firstDelay'] || 15);  // 新增首次延迟参数

    // 鼠标按键映射
    const buttonMap = {
        'left': 0,
        'right': 2,
        'middle': 1
    };
    const targetButton = buttonMap[holdButton] !== undefined ? buttonMap[holdButton] : 0;

    // 状态变量
    let isHolding = false;          // 是否正在长按
    let frameCounter = 0;           // 帧计数器，用于间隔控制（首次触发后使用）
    let firstDelayCounter = 0;      // 首次延迟计数器
    let firstActionDone = false;    // 是否已完成首次触发

    // 鼠标事件监听
    document.addEventListener('mousedown', (e) => {
        if (e.button === targetButton && SceneManager._scene instanceof Scene_Battle) {
            isHolding = true;
            // 重置所有计数器，准备开始首次延迟计时
            firstDelayCounter = 0;
            firstActionDone = false;
            frameCounter = 0;
            e.preventDefault();       // 防止浏览器默认行为（如右键菜单）
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button === targetButton) {
            isHolding = false;
        }
    });

    // 离开窗口时强制停止
    document.addEventListener('mouseleave', () => {
        isHolding = false;
    });

    // 核心更新逻辑：挂载到场景的update
    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);

        if (!isHolding) return;                 // 没有长按则退出
        if (!(this instanceof Scene_Battle)) return;

        // --- 首次延迟处理 ---
        if (!firstActionDone) {
            firstDelayCounter++;
            if (firstDelayCounter < firstDelay) return; // 尚未达到首次延迟
            // 达到首次延迟，标记已完成，并重置帧计数器（准备后续间隔）
            firstActionDone = true;
            frameCounter = 0;
            // 继续执行本次自动操作（下方统一代码）
        } else {
            // 后续操作：按 checkInterval 间隔执行
            frameCounter++;
            if (frameCounter < checkInterval) return;
            frameCounter = 0;
        }

        // --- 自动操作核心代码（保持不变）---
        // 获取当前战斗状态
        const phase = BattleManager._phase;
        const actor = BattleManager.actor();     // 当前正在输入命令的角色

        // 仅在“输入命令”阶段且有角色时执行
        if (phase !== 'input' || !actor) return;

        // 获取角色的攻击技能
        const attackSkillId = actor.attackSkillId();
        const attackSkill = $dataSkills[attackSkillId];

        // 检查角色是否可以使用攻击技能
        if (!actor.canUse($dataSkills[attackSkillId])) return;

        // 设置战斗管理器的当前行动
        const action = new Game_Action(actor);
        action.setSkill(attackSkillId);
        // 设置目标为第一个敌人（索引由参数指定）
        action.setTarget(targetIndex);
        BattleManager._action = action;

        // 强制结束命令输入（相当于按下确定键）
        const commandWindow = this._actorCommandWindow;
        const enemyWindow = this._enemyWindow;

        if (commandWindow && commandWindow.active) {
            // 如果在角色命令窗口，选择“攻击”选项（假设攻击是第一个命令）
            commandWindow.select(0);
            commandWindow.processOk();
        } else if (enemyWindow && enemyWindow.active) {
            // 如果在敌人选择窗口，直接选择目标
            enemyWindow.select(targetIndex);
            enemyWindow.processOk();
        }
        // 其他情况（如物品、技能窗口）不处理
    };

})();