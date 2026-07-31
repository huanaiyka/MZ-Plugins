/*:
 * @target MZ
 * @plugindesc 每一回合强制指定敌方技能，支持完整的【攻击/技能/防御】面板，智能目标选择与窗口自适应，修复说明框与恢复技能 Bug
 * @author 幻爱
 */

(() => {
    // 1. 拦截战斗流程
    const _BattleManager_startTurn = BattleManager.startTurn;
    BattleManager.startTurn = function() {
        $gameTroop.members().forEach(e => { e.clearActions(); e.setActionState('undecided'); });
        this._enemyQueue = $gameTroop.aliveMembers();
        this.processNextEnemyAction();
    };

    BattleManager.processNextEnemyAction = function() {
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
        
        this._enemyCommandWindow = new Window_EnemyCommand(new Rectangle(0, startY, 240, 400));
        this._enemyCommandWindow.hide();
        this._enemyCommandWindow.setHelpWindow(this._helpWindow);
        this._enemyCommandWindow.setHandler('attack', this.onEnemyCommandAttack.bind(this));
        this._enemyCommandWindow.setHandler('skill', this.onEnemyCommandSkill.bind(this));
        this._enemyCommandWindow.setHandler('guard', this.onEnemyCommandGuard.bind(this));
        this.addWindow(this._enemyCommandWindow);

        this._myEnemySkillWindow = new Window_EnemySkillList(new Rectangle(240, startY, 400, 400));
        this._myEnemySkillWindow.hide();
        this._myEnemySkillWindow.setHelpWindow(this._helpWindow);
        this._myEnemySkillWindow.setHandler('ok', this.onEnemySkillSelectionOk.bind(this));
        this._myEnemySkillWindow.setHandler('cancel', this.onEnemySkillSelectionCancel.bind(this));
        this.addWindow(this._myEnemySkillWindow);

        this._actorTargetWindow = new Window_BattleActor(new Rectangle(240, startY, 400, 400));
        this._actorTargetWindow.hide();
        this._actorTargetWindow.setHandler('ok', this.onTargetSelectionOk.bind(this));
        this._actorTargetWindow.setHandler('cancel', this.onTargetSelectionCancel.bind(this));
        this.addWindow(this._actorTargetWindow);
        
        this._enemyTargetWindow = new Window_BattleEnemy(new Rectangle(240, startY, 400, 400));
        this._enemyTargetWindow.hide();
        this._enemyTargetWindow.setHandler('ok', this.onTargetSelectionOk.bind(this));
        this._enemyTargetWindow.setHandler('cancel', this.onTargetSelectionCancel.bind(this));
        this.addWindow(this._enemyTargetWindow);
        
        this._currentTargetWindow = null;
    };

    // --- 修复：确保第一个敌人行动说明框正确显示 ---
    Scene_Battle.prototype.openEnemyCommandWindow = function(enemy) {
        if (!this._helpWindow.isOpen()) {
            this._helpWindow.open();
        }
        this._helpWindow.show();
        this._helpWindow.setText(enemy.name() + " 的行动");
        this._helpWindow.refresh(); // 强制重绘[cite: 2]
        
        this._enemyCommandWindow.setEnemy(enemy);
        this._enemyCommandWindow.show();
        this._enemyCommandWindow.activate();
        this._enemyCommandWindow.select(0);
    };

    // --- 修复：确保恢复类技能被引擎正确解析 ---
    Scene_Battle.prototype.executeEnemyAction = function(targetIndex) {
        const enemy = this._enemyCommandWindow._enemy; 
        if (enemy && this._selectedSkill) {
            // 确保动作状态被标记，防止被误判为普通攻击[cite: 2]
            enemy.setActionState('waiting');
            enemy.forceAction(this._selectedSkill.id, targetIndex);
            
            if (this._currentTargetWindow) {
                this._currentTargetWindow.hide();
                this._currentTargetWindow.deactivate();
                this._currentTargetWindow = null;
            }
            this._myEnemySkillWindow.hide();
            this._enemyCommandWindow.hide();
            this._helpWindow.hide();
            this._selectedSkill = null;
            
            BattleManager.processNextEnemyAction();
        }
    };

    // --- 命令回调 ---
    Scene_Battle.prototype.onEnemyCommandAttack = function() {
        const enemy = this._enemyCommandWindow._enemy;
        this._selectedSkill = $dataSkills[enemy.attackSkillId()];
        const scope = this._selectedSkill.scope;
        if (![1, 7, 9, 12].includes(scope)) return this.executeEnemyAction(-1);
        this._currentTargetWindow = this._actorTargetWindow;
        this._currentTargetWindow.show();
        this._currentTargetWindow.activate();
        this._currentTargetWindow.select(0);
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
        if (![1, 7, 9, 12].includes(scope)) return this.executeEnemyAction(scope === 11 ? userEnemy.index() : -1);
        this._currentTargetWindow = [7, 9, 12].includes(scope) ? this._enemyTargetWindow : this._actorTargetWindow;
        this._currentTargetWindow.show();
        this._currentTargetWindow.activate();
        this._currentTargetWindow.select(0);
    };

    Scene_Battle.prototype.onTargetSelectionCancel = function() {
        if (this._currentTargetWindow) {
            this._currentTargetWindow.hide();
            this._currentTargetWindow.deactivate();
        }
        if (this._enemyCommandWindow.currentSymbol() === 'attack') this._enemyCommandWindow.activate();
        else { this._myEnemySkillWindow.show(); this._myEnemySkillWindow.activate(); }
    };

    Scene_Battle.prototype.onTargetSelectionOk = function() {
        let targetIndex = this._currentTargetWindow === this._actorTargetWindow ? this._actorTargetWindow.index() : (this._enemyTargetWindow.enemy() ? this._enemyTargetWindow.enemy().index() : 0);
        this.executeEnemyAction(targetIndex);
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
            this.drawText(s.name, rect.x, rect.y, rect.width - 100, "left");
            if (s.tpCost > 0) { this.changeTextColor(ColorManager.tpCostColor()); this.drawText(s.tpCost + " TP", rect.x, rect.y, rect.width, "right"); }
            else if (s.mpCost > 0) { this.changeTextColor(ColorManager.mpCostColor()); this.drawText(s.mpCost + " MP", rect.x, rect.y, rect.width, "right"); }
            this.resetTextColor();
            this.changePaintOpacity(true);
        }
    }
})();