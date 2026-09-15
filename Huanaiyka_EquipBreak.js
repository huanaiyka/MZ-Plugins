/*:
 * @target MZ
 * @plugindesc 装备有概率在进攻或防守时被破坏 
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * 
 * @param 默认攻击损坏概率
 * @type number
 * @min 0
 * @max 100
 * @default 10
 * @desc 当装备未设置 <AtkEquipBreak> 标签或仅填写标签名时，进行攻击时使用的默认损坏概率（%）。
 *
 * @param 默认防守损坏概率
 * @type number
 * @min 0
 * @max 100
 * @default 10
 * @desc 当装备未设置 <DefEquipBreak> 标签或仅填写标签名时，受到伤害时使用的默认损坏概率（%）。
 *
 * @param 连续攻击多次判定
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default true
 * @desc 是否在连续/多段攻击的每一次击中时都独立判定损坏。关闭则整套技能仅判定1次。
 *
 * @param 触发攻击类型
 * @type select
 * @option 所有攻击
 * @option 普通攻击
 * @option 物理技能
 * @option 魔法技能
 * @option 普通攻击+物理技能
 * @option 普通攻击+魔法技能
 * @option 物理技能+魔法技能
 * @default 所有攻击
 * @desc 触发攻击损坏的攻击类型（基于技能命中类型）。可在装备标签中用 <AtkType:类型> 覆盖。
 *
 * @param 触发攻击伤害类型
 * @type select
 * @option 所有伤害
 * @option 直接伤害
 * @default 直接伤害
 * @desc 攻击时触发损坏的伤害类型（基于是否造成HP伤害）。可在装备标签中用 <AtkDmgType:类型> 覆盖。
 *
 * @param 触发防御类型
 * @type select
 * @option 所有伤害
 * @option 物理攻击
 * @option 魔法攻击
 * @option 物理+魔法攻击
 * @default 所有伤害
 * @desc 受击触发防守损坏的防御类型（基于技能命中类型）。可在装备标签中用 <DefType:类型> 覆盖。
 *
 * @param 触发防御伤害类型
 * @type select
 * @option 所有伤害
 * @option 直接伤害
 * @default 直接伤害
 * @desc 受击触发防守损坏的伤害类型（基于是否造成HP伤害）。可在装备标签中用 <DefDmgType:类型> 覆盖。
 *
 * @param --- 文字提示设置 ---
 * @default
 *
 * @param 进攻损坏提示
 * @parent --- 文字提示设置 ---
 * @type string
 * @default %1 的 %2 因用力过度损坏了！
 * @desc 进攻损坏时的提示信息。%1 = 角色名，%2 = 装备名。
 *
 * @param 防守损坏提示
 * @parent --- 文字提示设置 ---
 * @type string
 * @default %1 的 %2 因受到冲击损坏了！
 * @desc 防守损坏时的提示信息。%1 = 角色名，%2 = 装备名。
 *
 * @param --- 音效设置 ---
 * @default
 *
 * @param 损坏 SE 名称
 * @parent --- 音效设置 ---
 * @type file
 * @dir audio/se
 * @default Damage1
 * @desc 装备损坏时播放的音效文件名。（如不需要请留空）
 *
 * @param 损坏 SE 音量
 * @parent --- 音效设置 ---
 * @type number
 * @min 0
 * @max 100
 * @default 80
 * @desc 音效的音量大小 (0 - 100)。
 *
 * @param 损坏 SE 音调
 * @parent --- 音效设置 ---
 * @type number
 * @min 50
 * @max 150
 * @default 100
 * @desc 音效的音调频率 (50 - 150)。
 *
 * @param 损坏 SE 声道
 * @parent --- 音效设置 ---
 * @type number
 * @min -100
 * @max 100
 * @default 0
 * @desc 音效的左右声道偏置 (-100 到 100)。
 *
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件为 RPG Maker MZ 提供装备损坏系统，使角色在战斗中的装备有概率
 * 在进攻或防守时被破坏，增加战斗的策略性和真实感。
 * 
 * 每件装备的损坏概率、触发条件和伤害类型均可在备注栏中独立配置，
 * 允许显示提示文字并播放音效。
 * ============================================================================
 * 标签设置（在装备/武器/防具的备注栏中写入）
 * ============================================================================
 * <AtkEquipBreak>       攻击损坏概率使用参数默认值。
 * <AtkEquipBreak:概率>  攻击损坏概率自定义(0-100)。例：<AtkEquipBreak:15>
 * 
 * <DefEquipBreak>       受击损坏概率使用参数默认值。
 * <DefEquipBreak:概率>  受击损坏概率自定义(0-100)。例：<DefEquipBreak:25>
 * 
 * <AtkType:类型>        [攻击类型覆盖] 覆盖该装备的触发攻击类型（基于技能命中类型）。
 *                        示例：
 *                        <AtkType:all>               - 所有攻击
 *                        <AtkType:normal>            - 仅普通攻击
 *                        <AtkType:physical>          - 仅物理技能
 *                        <AtkType:magical>           - 仅魔法技能
 *                        <AtkType:normal_physical>   - 普通攻击 + 物理技能
 *                        <AtkType:normal_magical>    - 普通攻击 + 魔法技能
 *                        <AtkType:physical_magical>  - 物理技能 + 魔法技能
 *
 * <AtkDmgType:类型>     [攻击伤害类型覆盖] 覆盖该装备的触发攻击伤害类型（基于是否造成HP伤害）。
 *                        示例：
 *                        <AtkDmgType:all>            - 所有伤害（无论是否造成HP伤害）
 *                        <AtkDmgType:direct>         - 仅直接伤害（造成HP伤害）
 *
 * <DefType:类型>        [防御类型覆盖] 覆盖该装备的触发防御类型（基于技能命中类型）。
 *                        示例：
 *                        <DefType:all>               - 所有伤害
 *                        <DefType:physical>          - 仅物理攻击
 *                        <DefType:magical>           - 仅魔法攻击
 *                        <DefType:physical_magical>  - 物理攻击 + 魔法攻击
 *
 * <DefDmgType:类型>     [防御伤害类型覆盖] 覆盖该装备的触发防御伤害类型（基于是否造成HP伤害）。
 *                        示例：
 *                        <DefDmgType:all>            - 所有伤害（包括无法造成伤害的技能）
 *                        <DefDmgType:direct>         - 仅直接伤害（造成HP伤害）
 *
 * ============================================================================
 * 说明
 * ============================================================================
 * 1. 损坏的装备会自动脱下，并彻底从队伍背包中移除。
 * 2. <AtkEquipBreak> 与 <DefEquipBreak> 可同时写在一件装备上。
 * 3. 若未填写标签，装备将不参与损坏判定；若填写无参标签，则使用插件默认概率。
 * 4. 技能类型判断基于技能的命中类型（Hit Type）：物理攻击或魔法攻击。
 * 5. 攻击损坏判定需要同时满足：攻击类型条件 AND 攻击伤害类型条件。
 * 6. 防守损坏判定需要同时满足：防御类型条件 AND 防御伤害类型条件。
 * 7. 普通攻击判断基于技能ID是否为1。
 */

(function() {
    'use strict';

    const pluginName = 'Huanaiyka_EquipBreak';
    const parameters = PluginManager.parameters(pluginName);

    // 数值与基础规则参数
    const defaultAtkBreakRate = Number(parameters['默认攻击损坏概率'] || 10);
    const defaultDefBreakRate = Number(parameters['默认防守损坏概率'] || 10);
    const repeatCheckEnabled = parameters['连续攻击多次判定'] === 'true';
    const defaultAtkType = String(parameters['触发攻击类型'] || '所有攻击');
    const defaultAtkDmgType = String(parameters['触发攻击伤害类型'] || '直接伤害');
    const defaultDefType = String(parameters['触发防御类型'] || '所有伤害');
    const defaultDefDmgType = String(parameters['触发防御伤害类型'] || '直接伤害');

    // 提示文本参数
    const atkMessageFormat = String(parameters['进攻损坏提示'] || '%1 的 %2 因用力过度损坏了！');
    const defMessageFormat = String(parameters['防守损坏提示'] || '%1 的 %2 因受到冲击损坏了！');

    // 音效参数
    const seName = String(parameters['损坏 SE 名称'] || 'Damage1');
    const seVolume = Number(parameters['损坏 SE 音量'] || 80);
    const sePitch = Number(parameters['损坏 SE 音调'] || 100);
    const sePan = Number(parameters['损坏 SE 声道'] || 0);

    // 攻击类型映射（基于技能命中类型）
    const ATK_TYPE_MAP = {
        '所有攻击': 'all',
        '普通攻击': 'normal',
        '物理技能': 'physical',
        '魔法技能': 'magical',
        '普通攻击+物理技能': 'normal_physical',
        '普通攻击+魔法技能': 'normal_magical',
        '物理技能+魔法技能': 'physical_magical'
    };

    const defaultAtkTypeKey = ATK_TYPE_MAP[defaultAtkType] || 'all';

    // 伤害类型映射（基于是否造成HP伤害）
    const DMG_TYPE_MAP = {
        '所有伤害': 'all',
        '直接伤害': 'direct'
    };

    const defaultAtkDmgTypeKey = DMG_TYPE_MAP[defaultAtkDmgType] || 'direct';
    const defaultDefDmgTypeKey = DMG_TYPE_MAP[defaultDefDmgType] || 'direct';

    // 防御类型映射（基于技能命中类型）
    const DEF_TYPE_MAP = {
        '所有伤害': 'all',
        '物理攻击': 'physical',
        '魔法攻击': 'magical',
        '物理+魔法攻击': 'physical_magical'
    };

    const defaultDefTypeKey = DEF_TYPE_MAP[defaultDefType] || 'all';

    // ==========================================================================
    // DataManager - 解析标签
    // ==========================================================================
    const _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!this._equipBreakTagsParsed) {
            this.parseEquipBreakTags();
            this._equipBreakTagsParsed = true;
        }
        return true;
    };

    DataManager.parseEquipBreakTags = function() {
        const allItems = [...$dataWeapons, ...$dataArmors];
        for (const item of allItems) {
            if (!item) continue;
            
            // 防守/受击损坏概率 <DefEquipBreak> 或 <DefEquipBreak:X>
            const defMatch = item.note.match(/<DefEquipBreak(?:\s*:\s*(\d+))?>/i);
            if (defMatch) {
                const rate = defMatch[1] !== undefined ? Number(defMatch[1]) : defaultDefBreakRate;
                item._defBreakRate = Math.min(100, Math.max(0, rate));
            } else {
                item._defBreakRate = 0;
            }

            // 攻击/出招损坏概率 <AtkEquipBreak> 或 <AtkEquipBreak:X>
            const atkMatch = item.note.match(/<AtkEquipBreak(?:\s*:\s*(\d+))?>/i);
            if (atkMatch) {
                const rate = atkMatch[1] !== undefined ? Number(atkMatch[1]) : defaultAtkBreakRate;
                item._atkBreakRate = Math.min(100, Math.max(0, rate));
            } else {
                item._atkBreakRate = 0;
            }

            // 攻击类型 <AtkType:类型>
            const atkTypeMatch = item.note.match(/<AtkType\s*:\s*(\w+)>/i);
            if (atkTypeMatch) {
                const typeStr = atkTypeMatch[1].toLowerCase();
                const validTypes = ['all', 'normal', 'physical', 'magical', 'normal_physical', 'normal_magical', 'physical_magical'];
                if (validTypes.includes(typeStr)) {
                    item._atkType = typeStr;
                } else {
                    item._atkType = defaultAtkTypeKey;
                }
            } else {
                item._atkType = defaultAtkTypeKey;
            }

            // 攻击伤害类型 <AtkDmgType:类型>
            const atkDmgTypeMatch = item.note.match(/<AtkDmgType\s*:\s*(\w+)>/i);
            if (atkDmgTypeMatch) {
                const typeStr = atkDmgTypeMatch[1].toLowerCase();
                const validTypes = ['all', 'direct'];
                if (validTypes.includes(typeStr)) {
                    item._atkDmgType = typeStr;
                } else {
                    item._atkDmgType = defaultAtkDmgTypeKey;
                }
            } else {
                item._atkDmgType = defaultAtkDmgTypeKey;
            }

            // 防御类型 <DefType:类型>
            const defTypeMatch = item.note.match(/<DefType\s*:\s*(\w+)>/i);
            if (defTypeMatch) {
                const typeStr = defTypeMatch[1].toLowerCase();
                const validTypes = ['all', 'physical', 'magical', 'physical_magical'];
                if (validTypes.includes(typeStr)) {
                    item._defType = typeStr;
                } else {
                    item._defType = defaultDefTypeKey;
                }
            } else {
                item._defType = defaultDefTypeKey;
            }

            // 防御伤害类型 <DefDmgType:类型>
            const defDmgTypeMatch = item.note.match(/<DefDmgType\s*:\s*(\w+)>/i);
            if (defDmgTypeMatch) {
                const typeStr = defDmgTypeMatch[1].toLowerCase();
                const validTypes = ['all', 'direct'];
                if (validTypes.includes(typeStr)) {
                    item._defDmgType = typeStr;
                } else {
                    item._defDmgType = defaultDefDmgTypeKey;
                }
            } else {
                item._defDmgType = defaultDefDmgTypeKey;
            }
        }
    };

    // ==========================================================================
    // 攻击类型判断工具（基于技能命中类型）
    // ==========================================================================
    function isAttackTypeValid(equip, action) {
        const atkType = equip._atkType || defaultAtkTypeKey;
        if (atkType === 'all') return true;

        const item = action.item();
        if (!item) return false;

        const isNormalAttack = DataManager.isSkill(item) && item.id === 1;
        const isPhysicalSkill = DataManager.isSkill(item) && item.hitType === 1;
        const isMagicalSkill = DataManager.isSkill(item) && item.hitType === 2;

        switch (atkType) {
            case 'normal':
                return isNormalAttack;
            case 'physical':
                return isPhysicalSkill;
            case 'magical':
                return isMagicalSkill;
            case 'normal_physical':
                return isNormalAttack || isPhysicalSkill;
            case 'normal_magical':
                return isNormalAttack || isMagicalSkill;
            case 'physical_magical':
                return isPhysicalSkill || isMagicalSkill;
            default:
                return true;
        }
    }

    // ==========================================================================
    // 攻击伤害类型判断工具（根据实际结算结果修复）
    // ==========================================================================
    function isAtkDamageTypeValid(equip, action, target) {
        const atkDmgType = equip._atkDmgType || defaultAtkDmgTypeKey;
        if (atkDmgType === 'all') return true;

        switch (atkDmgType) {
            case 'direct':
                // 仅当实际成功造成了大于 0 的 HP 伤害时触发
                if (target && target.result()) {
                    const result = target.result();
                    return result.hpDamage > 0;
                }
                return false;
            default:
                return true;
        }
    }

    // ==========================================================================
    // 防御类型判断工具
    // ==========================================================================
    function isDefenseTypeValid(equip, action) {
        const defType = equip._defType || defaultDefTypeKey;
        if (defType === 'all') return true;

        const item = action ? action.item() : null;
        const isPhysicalSkill = item && DataManager.isSkill(item) && item.hitType === 1;
        const isMagicalSkill = item && DataManager.isSkill(item) && item.hitType === 2;

        switch (defType) {
            case 'physical':
                return isPhysicalSkill;
            case 'magical':
                return isMagicalSkill;
            case 'physical_magical':
                return isPhysicalSkill || isMagicalSkill;
            default:
                return true;
        }
    }

    // ==========================================================================
    // 防御伤害类型判断工具
    // ==========================================================================
    function isDefDamageTypeValid(equip, damageValue) {
        const defDmgType = equip._defDmgType || defaultDefDmgTypeKey;
        if (defDmgType === 'all') return true;

        switch (defDmgType) {
            case 'direct':
                return damageValue > 0;
            default:
                return true;
        }
    }

    // ==========================================================================
    // 逻辑 1：防守判定（受到伤害时）
    // ==========================================================================
    const _Game_Action_executeHpDamage = Game_Action.prototype.executeHpDamage;
    Game_Action.prototype.executeHpDamage = function(target, value) {
        _Game_Action_executeHpDamage.call(this, target, value);

        if (target.isActor() && value > 0) {
            if (!repeatCheckEnabled) {
                target._defBreakCheckedTargets = target._defBreakCheckedTargets || [];
                if (target._defBreakCheckedTargets.includes(this)) return;
                target._defBreakCheckedTargets.push(this);
            }

            target.checkEquipBreakOnDefend(value, this);
        }
    };

    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        
        // 修正逻辑 2：进攻判定
        // 1. 只有当攻击真正命中（没有 Miss / 没有被闪避）时才继续判定
        if (target && target.result() && target.result().isHit()) {
            const subject = this.subject();
            if (subject && subject.isActor()) {
                if (repeatCheckEnabled) {
                    subject.checkEquipBreakOnAttack(this, target);
                } else {
                    // 如果关闭了多段判定，确保整个行动过程只判定 1 次
                    subject._atkBreakCheckedActions = subject._atkBreakCheckedActions || [];
                    if (!subject._atkBreakCheckedActions.includes(this)) {
                        subject._atkBreakCheckedActions.push(this);
                        subject.checkEquipBreakOnAttack(this, target);
                    }
                }
            }
        }

        // 清理防御标记
        if (target && target._defBreakCheckedTargets) {
            target._defBreakCheckedTargets = [];
        }
    };

    // 在行动开始/结束时重置一次性攻击判定标记
    const _Game_Action_clear = Game_Action.prototype.clear;
    Game_Action.prototype.clear = function() {
        _Game_Action_clear.call(this);
        const subject = this.subject ? this.subject() : null;
        if (subject && subject._atkBreakCheckedActions) {
            subject._atkBreakCheckedActions = [];
        }
    };

    Game_Actor.prototype.checkEquipBreakOnDefend = function(damageValue, action) {
        const equips = this.equips();
        let brokenAny = false;

        for (let i = 0; i < equips.length; i++) {
            const equip = equips[i];
            if (!equip) continue;

            const rate = equip._defBreakRate;
            if (!rate || rate <= 0) continue;

            if (!isDefenseTypeValid(equip, action)) continue;
            if (!isDefDamageTypeValid(equip, damageValue)) continue;

            if (Math.random() * 100 < rate) {
                this.breakEquip(i, equip, 'defend');
                brokenAny = true;
            }
        }

        if (brokenAny) this.refresh();
    };

    Game_Actor.prototype.checkEquipBreakOnAttack = function(action, target) {
        const equips = this.equips();
        let brokenAny = false;

        for (let i = 0; i < equips.length; i++) {
            const equip = equips[i];
            if (!equip) continue;

            // 检查攻击类型
            if (!isAttackTypeValid(equip, action)) continue;

            // 检查攻击伤害类型（现在会精确检查 target 的真实伤害结算）
            if (!isAtkDamageTypeValid(equip, action, target)) continue;

            const rate = equip._atkBreakRate;
            if (!rate || rate <= 0) continue;

            if (Math.random() * 100 < rate) {
                this.breakEquip(i, equip, 'attack');
                brokenAny = true;
            }
        }

        if (brokenAny) this.refresh();
    };

    // ==========================================================================
    // 通用装备销毁逻辑
    // ==========================================================================
    Game_Actor.prototype.breakEquip = function(slotIndex, equip, type) {
        this.changeEquip(slotIndex, null);
        $gameParty.loseItem(equip, 1);

        const format = (type === 'attack') ? atkMessageFormat : defMessageFormat;
        const message = format.format(this.name(), equip.name);
        $gameMessage.add(message);

        if (seName && seName.trim() !== '') {
            AudioManager.playSe({
                name: seName,
                volume: seVolume,
                pitch: sePitch,
                pan: sePan
            });
        }
    };

})();