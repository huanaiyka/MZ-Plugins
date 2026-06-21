/*:
 * @target MZ 
 * @plugindesc 根据开关状态切换防具提供的技能
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 这个插件允许防具根据一个开关的状态提供不同的技能。
 * 
 * 在防具的备注栏中添加以下标签：
 *   <switchSkill: 开关ID, 关闭时技能ID, 开启时技能ID>
 * 例如：
 *   <switchSkill: 1, 10, 20>
 *   当开关 1 关闭时，装备该防具会学习技能 10；
 *   当开关 1 开启时，装备该防具会学习技能 20。
 * 
 * 当开关状态改变时，所有角色的技能会自动更新。
 * 当防具被卸下时，对应的技能会被遗忘。
 * 
 * 注意：
 * - 如果多个防具提供了相同的技能，只要其中至少一个仍被装备，该技能就会保留。
 * - 技能 ID 可以设置为 0，表示“无技能”（即不学习任何技能）。
 * 
 * 插件命令：
 *   updateSwitchSkills  - 手动触发所有角色的技能更新（通常不需要手动调用）
 * 
 * @command updateSwitchSkills
 * @text 更新开关技能
 * @desc 手动更新所有角色的开关技能
 */

var Imported = Imported || {};
Imported.SwitchBasedSkillEquip = true;

(function() {
    'use strict';

    // 存储防具数据：armorId -> { switchId, skillOff, skillOn }
    const switchSkillData = {};

    // 解析防具备注
    function parseArmorNote(armor) {
        const note = armor.note;
        const regex = /<switchSkill:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*>/gi;
        let match;
        while ((match = regex.exec(note)) !== null) {
            const switchId = parseInt(match[1], 10);
            const skillOff = parseInt(match[2], 10);
            const skillOn = parseInt(match[3], 10);
            switchSkillData[armor.id] = { switchId, skillOff, skillOn };
        }
    }

    // 加载所有防具并解析备注
    function loadAllArmors() {
        const dataArmors = $dataArmors;
        if (!dataArmors) return;
        for (let i = 1; i < dataArmors.length; i++) {
            const armor = dataArmors[i];
            if (armor && armor.note) {
                parseArmorNote(armor);
            }
        }
    }

    // 数据库加载完成后解析
    const aliasDataManagerCreateGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        aliasDataManagerCreateGameObjects.call(this);
        loadAllArmors();
    };

    // 读取存档后更新技能
    const aliasDataManagerExtractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        aliasDataManagerExtractSaveContents.call(this, contents);
        updateAllActorsSwitchSkills();
    };

    // ------------------ Game_Actor 扩展 ------------------
    const _Game_Actor_initMembers = Game_Actor.prototype.initMembers;
    Game_Actor.prototype.initMembers = function() {
        _Game_Actor_initMembers.call(this);
        this._switchSkillIds = []; // 当前由本插件激活的技能ID列表
    };

    // 获取当前装备下应生效的开关技能ID（去重）
    Game_Actor.prototype.currentSwitchSkillIds = function() {
        const ids = [];
        const equips = this.equips();
        for (const item of equips) {
            if (item && DataManager.isArmor(item)) {
                const data = switchSkillData[item.id];
                if (data) {
                    const switchState = $gameSwitches.value(data.switchId);
                    const skillId = switchState ? data.skillOn : data.skillOff;
                    // 检查技能是否存在，避免学习无效技能
                    if ($dataSkills[skillId]) {
                        ids.push(skillId);
                    }
                }
            }
        }
        // 去重后返回
        return [...new Set(ids)];
    };

    // 更新该角色的开关技能
    Game_Actor.prototype.updateSwitchSkills = function() {
        const newIds = this.currentSwitchSkillIds();
        const oldIds = this._switchSkillIds || [];

        // 需要遗忘的技能：旧有但新没有
        const toForget = oldIds.filter(id => !newIds.includes(id));
        // 需要学习的技能：新有但旧没有
        const toLearn = newIds.filter(id => !oldIds.includes(id));

        toForget.forEach(id => this.forgetSkill(id));
        toLearn.forEach(id => this.learnSkill(id));

        this._switchSkillIds = newIds;
    };

    // 装备变更时更新技能
    const _Game_Actor_changeEquip = Game_Actor.prototype.changeEquip;
    Game_Actor.prototype.changeEquip = function(slotId, item) {
        _Game_Actor_changeEquip.call(this, slotId, item);
        this.updateSwitchSkills();
    };

    const _Game_Actor_forceChangeEquip = Game_Actor.prototype.forceChangeEquip;
    Game_Actor.prototype.forceChangeEquip = function(slotId, item) {
        _Game_Actor_forceChangeEquip.call(this, slotId, item);
        this.updateSwitchSkills();
    };

    const _Game_Actor_discardEquip = Game_Actor.prototype.discardEquip;
    Game_Actor.prototype.discardEquip = function(item) {
        _Game_Actor_discardEquip.call(this, item);
        this.updateSwitchSkills();
    };

    // refresh 时也更新（例如状态变化导致装备重算）
    const _Game_Actor_refresh = Game_Actor.prototype.refresh;
    Game_Actor.prototype.refresh = function() {
        _Game_Actor_refresh.call(this);
        this.updateSwitchSkills();
    };

    // ------------------ 全局更新函数 ------------------
    function updateAllActorsSwitchSkills() {
        const party = $gameParty ? $gameParty.members() : [];
        party.forEach(actor => {
            if (actor && actor.updateSwitchSkills) {
                actor.updateSwitchSkills();
            }
        });
    }

    // ------------------ 监听开关变化 ------------------
    const _Game_Switches_setValue = Game_Switches.prototype.setValue;
    Game_Switches.prototype.setValue = function(switchId, value) {
        _Game_Switches_setValue.call(this, switchId, value);
        // 检查该开关是否被任何防具使用
        const used = Object.values(switchSkillData).some(data => data.switchId === switchId);
        if (used) {
            updateAllActorsSwitchSkills();
        }
    };

    // ------------------ 插件命令 ------------------
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'updateSwitchSkills') {
            updateAllActorsSwitchSkills();
        }
    };

})();