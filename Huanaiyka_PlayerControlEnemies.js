/*:
 * @target MZ
 * @plugindesc 强制指定敌方操作
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * 
 * @help
 * ============================================================================
 * 插件功能
 * ============================================================================
 * 本插件允许玩家在战斗中手动控制敌人的行动，包括攻击、防御和使用技能。
 * 适用于调试、测试或特殊的游戏机制设计。
 * 
 * ============================================================================
 * 使用说明
 * ============================================================================
 * 1. 在战斗中，轮到敌人行动时，会弹出敌人指令窗口
 * 2. 玩家可以为每个敌人选择:
 *    - 攻击: 选择一名我方角色作为目标
 *    - 技能: 选择一个技能类型 → 选择具体技能 → 选择目标
 *    - 防御: 直接执行防御
 * 3. 选择目标时:
 *    - 攻击/恢复类技能 → 选择我方角色（底部状态栏）
 *    - 伤害类技能 → 选择敌方角色（右侧敌方窗口）
 *    - 全体/自身技能 → 自动执行，无需选择目标
 * 
 * 
 * ============================================================================
 * 插件指令
 * ============================================================================
 * 通过插件指令可以动态开启或关闭插件功能：
 * 
 *   EnemyCommand setEnable enabled:true    # 启用插件
 *   EnemyCommand setEnable enabled:false   # 禁用插件
 * 
 * @command setEnable
 * @text 切换插件状态
 * @desc 开启或关闭敌人强制指定技能功能。
 * 
 * @arg enabled
 * @text 是否开启
 * @type boolean
 * @default true
 * @desc 选择 true 开启插件功能，false 关闭插件功能。
 * 
 */

(() => {
    const pluginName = "Huanaiyka_PlayerControlEnemies";
    
    // 注册插件指令
    PluginManager.registerCommand(pluginName, "setEnable", args => {
        $gameSystem._enemyCommandEnabled = (args.enabled === "true");
    });

    // 辅助函数：判断插件是否处于启用状态（默认返回 false，即游戏开始时默认关闭）
    function isEnemyCommandEnabled() {
        return $gameSystem ? ($gameSystem._enemyCommandEnabled === true) : false;
    }

    // 1. 拦截战斗流程
    const _BattleManager_startTurn = BattleManager.startTurn;
    BattleManager.startTurn = function() {
        if (isEnemyCommandEnabled()) {
            $gameTroop.members().forEach(e => { e.clearActions(); e.setActionState('undecided'); });
            this._enemyQueue = $gameTroop.aliveMembers();
            this.processNextEnemyAction();
        } else {
            _BattleManager_startTurn.call(this);
        }
    };

    BattleManager.processNextEnemyAction = function() {
        if (!isEnemyCommandEnabled()) {
            _BattleManager_startTurn.call(this);
            return;
        }
        if (this._enemyQueue.length > 0) {
            const enemy = this._enemyQueue.shift();
            if (enemy.canMove()) {
                SceneManager._scene.openEnemyCommandWindow(enemy);
            } else {
                this.processNextEnemyAction();
            }
        } else {
            _BattleManager_startTurn.call(this);
        }
    };

    // 2. 界面与窗口逻辑
    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        
        const startY = this._helpWindow ? this._helpWindow.y + this._helpWindow.height : 100;
        
        // 敌人指令主窗口
        this._enemyCommandWindow = new Window_EnemyCommand(new Rectangle(0, startY, 240, 400));
        this._enemyCommandWindow.hide();
        this._enemyCommandWindow.setHelpWindow(this._helpWindow);
        this._enemyCommandWindow.setHandler('attack', this.onEnemyCommandAttack.bind(this));
        this._enemyCommandWindow.setHandler('skill', this.onEnemyCommandSkill.bind(this));
        this._enemyCommandWindow.setHandler('guard', this.onEnemyCommandGuard.bind(this));
        this.addWindow(this._enemyCommandWindow);

        // 敌人技能列表窗口
        this._myEnemySkillWindow = new Window_EnemySkillList(new Rectangle(240, startY, 400, 400));
        this._myEnemySkillWindow.hide();
        this._myEnemySkillWindow.setHelpWindow(this._helpWindow);
        this._myEnemySkillWindow.setHandler('ok', this.onEnemySkillSelectionOk.bind(this));
        this._myEnemySkillWindow.setHandler('cancel', this.onEnemySkillSelectionCancel.bind(this));
        this.addWindow(this._myEnemySkillWindow);

        // 绑定底部队伍状态栏（Window_BattleStatus）作为我方目标选择窗口
        this._statusWindow.setHandler('ok', this.onActorTargetOk.bind(this));
        this._statusWindow.setHandler('cancel', this.onActorTargetCancel.bind(this));

        // 敌方目标选择窗口（用于选敌人队友的恢复技能）
        this._enemyTargetWindow = new Window_BattleEnemy(new Rectangle(240, startY, 400, 400));
        this._enemyTargetWindow.hide();
        this._enemyTargetWindow.setHandler('ok', this.onEnemyTargetOk.bind(this));
        this._enemyTargetWindow.setHandler('cancel', this.onEnemyTargetCancel.bind(this));
        this.addWindow(this._enemyTargetWindow);
        
        this._currentTargetWindow = null;
    };

    // --- 确保第一个敌人行动说明框正确显示 ---
    Scene_Battle.prototype.openEnemyCommandWindow = function(enemy) {
        if (!this._helpWindow.isOpen()) {
            this._helpWindow.open();
        }
        this._helpWindow.show();
        this._helpWindow.setText(enemy.name() + " 的行动");
        this._helpWindow.refresh();
        
        this._enemyCommandWindow.setEnemy(enemy);
        this._enemyCommandWindow.show();
        this._enemyCommandWindow.activate();
        this._enemyCommandWindow.select(0);
    };

    // --- 执行行动逻辑 ---
    Scene_Battle.prototype.executeEnemyAction = function(targetIndex) {
        const enemy = this._enemyCommandWindow._enemy; 
        if (enemy && this._selectedSkill) {
            enemy.setActionState('waiting');
            enemy.forceAction(this._selectedSkill.id, targetIndex);
            
            // 关闭/停用目标窗口
            if (this._statusWindow.active) {
                this._statusWindow.deactivate();
                this._statusWindow.deselect();
            }
            if (this._enemyTargetWindow.active) {
                this._enemyTargetWindow.hide();
                this._enemyTargetWindow.deactivate();
            }

            this._myEnemySkillWindow.hide();
            this._enemyCommandWindow.hide();
            this._helpWindow.hide();
            this._selectedSkill = null;
            this._currentTargetWindow = null;
            
            BattleManager.processNextEnemyAction();
        }
    };

    // --- 激活底部的队伍状态窗口选择我方 ---
    Scene_Battle.prototype.selectActorTarget = function() {
        this._currentTargetWindow = this._statusWindow;
        this._statusWindow.show();
        this._statusWindow.activate();
        this._statusWindow.select(0);
    };

    // --- 激活敌人选择窗口选择敌方 ---
    Scene_Battle.prototype.selectEnemyTarget = function() {
        this._currentTargetWindow = this._enemyTargetWindow;
        this._enemyTargetWindow.show();
        this._enemyTargetWindow.activate();
        this._enemyTargetWindow.select(0);
    };

    // --- 命令回调 ---
    Scene_Battle.prototype.onEnemyCommandAttack = function() {
        const enemy = this._enemyCommandWindow._enemy;
        this._selectedSkill = $dataSkills[enemy.attackSkillId()];
        const scope = this._selectedSkill.scope;
        
        // 如果不需要单体选择，直接执行；否则调用底部我方角色选择
        if (![1, 7, 9, 12].includes(scope)) return this.executeEnemyAction(-1);
        this.selectActorTarget();
    };

    Scene_Battle.prototype.onEnemyCommandGuard = function() {
        const enemy = this._enemyCommandWindow._enemy;
        this._selectedSkill = $dataSkills[enemy.guardSkillId()];
        this.executeEnemyAction(enemy.index());
    };

    Scene_Battle.prototype.onEnemyCommandSkill = function() {
        const stypeId = this._enemyCommandWindow.currentExt();
        const enemy = this._enemyCommandWindow._enemy;
        this._myEnemySkillWindow.setEnemyAndType(enemy, stypeId);
        this._myEnemySkillWindow.show();
        this._myEnemySkillWindow.activate();
        this._myEnemySkillWindow.select(0);
    };

    Scene_Battle.prototype.onEnemySkillSelectionCancel = function() {
        this._myEnemySkillWindow.hide();
        this._enemyCommandWindow.activate();
    };

    Scene_Battle.prototype.onEnemySkillSelectionOk = function() {
        this._selectedSkill = this._myEnemySkillWindow.currentExt();
        const userEnemy = this._enemyCommandWindow._enemy;
        const scope = this._selectedSkill.scope;

        if (![1, 7, 9, 12].includes(scope)) {
            return this.executeEnemyAction(scope === 11 ? userEnemy.index() : -1);
        }

        // 判断是选我方还是敌方
        if ([7, 9, 12].includes(scope)) {
            this.selectEnemyTarget();
        } else {
            this.selectActorTarget();
        }
    };

    // --- 我方目标选择的回调 ---
    Scene_Battle.prototype.onActorTargetOk = function() {
        const targetIndex = this._statusWindow.index();
        this.executeEnemyAction(targetIndex);
    };

    Scene_Battle.prototype.onActorTargetCancel = function() {
        this._statusWindow.deactivate();
        this._statusWindow.deselect();
        
        if (this._enemyCommandWindow.currentSymbol() === 'attack') {
            this._enemyCommandWindow.activate();
        } else {
            this._myEnemySkillWindow.show();
            this._myEnemySkillWindow.activate();
        }
    };

    // --- 敌方目标选择的回调 ---
    Scene_Battle.prototype.onEnemyTargetOk = function() {
        const enemy = this._enemyTargetWindow.enemy();
        const targetIndex = enemy ? enemy.index() : 0;
        this.executeEnemyAction(targetIndex);
    };

    Scene_Battle.prototype.onEnemyTargetCancel = function() {
        this._enemyTargetWindow.hide();
        this._enemyTargetWindow.deactivate();
        
        if (this._enemyCommandWindow.currentSymbol() === 'attack') {
            this._enemyCommandWindow.activate();
        } else {
            this._myEnemySkillWindow.show();
            this._myEnemySkillWindow.activate();
        }
    };

    // 3. 增强版界面类
    class Window_EnemyCommand extends Window_Command {
        setEnemy(enemy) { this._enemy = enemy; this.refresh(); }
        refresh() { super.refresh(); if (this._enemy) this.height = this.fittingHeight(this.maxItems()); }
        updateHelp() { if (this._enemy && this._helpWindow) this._helpWindow.setText(this._enemy.name() + " 的行动"); }
        makeCommandList() {
            if (!this._enemy) return;
            this.addCommand(TextManager.attack, 'attack', this._enemy.canAttack());
            const skillIds = new Set();
            this._enemy.enemy().actions.forEach(a => skillIds.add(a.skillId));
            this._enemy.addedSkills().forEach(id => skillIds.add(id));
            const stypes = new Set();
            skillIds.forEach(id => { if ($dataSkills[id] && id !== this._enemy.attackSkillId() && id !== this._enemy.guardSkillId()) stypes.add($dataSkills[id].stypeId); });
            Array.from(stypes).sort((a, b) => a - b).forEach(sid => this.addCommand(sid === 0 ? "常规技能" : $dataSystem.skillTypes[sid], 'skill', true, sid));
            this.addCommand(TextManager.guard, 'guard', this._enemy.canGuard());
        }
    }

    class Window_EnemySkillList extends Window_Command {
        setEnemyAndType(enemy, stypeId) { this._enemy = enemy; this._stypeId = stypeId; this.refresh(); }
        refresh() { super.refresh(); if (this._enemy) this.height = this.fittingHeight(Math.max(1, Math.min(this.maxItems(), 7))); }
        updateHelp() { if (this._helpWindow && this.currentExt()) this._helpWindow.setItem(this.currentExt()); }
        makeCommandList() {
            if (!this._enemy) return;
            const skillIds = new Set();
            this._enemy.enemy().actions.forEach(a => skillIds.add(a.skillId));
            this._enemy.addedSkills().forEach(id => skillIds.add(id));
            skillIds.forEach(id => {
                if (id === this._enemy.attackSkillId() || id === this._enemy.guardSkillId()) return;
                const s = $dataSkills[id];
                if (s && s.stypeId === this._stypeId) this.addCommand(s.name, 'ok', this._enemy.canPaySkillCost(s), s);
            });
        }
        drawItem(index) {
            const s = this._list[index].ext;
            if (!s) return;
            const rect = this.itemLineRect(index);
            this.changePaintOpacity(this.isCommandEnabled(index));

            const costWidth = 80;
            const nameWidth = Math.max(0, rect.width - costWidth - 10);
            
            this.drawText(s.name, rect.x, rect.y, nameWidth, "left");

            const costX = rect.x + nameWidth + 10;
            if (s.tpCost > 0) { 
                this.changeTextColor(ColorManager.tpCostColor()); 
                this.drawText(s.tpCost + " TP", costX, rect.y, costWidth, "right"); 
            }
            else if (s.mpCost > 0) { 
                this.changeTextColor(ColorManager.mpCostColor()); 
                this.drawText(s.mpCost + " MP", costX, rect.y, costWidth, "right"); 
            }
            
            this.resetTextColor();
            this.changePaintOpacity(true);
        }
    }
})();