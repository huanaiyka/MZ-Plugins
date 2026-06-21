/*=============================================================================
 ExpForOutsideParty.js
----------------------------------------------------------------------------
 (C)2018 Triacontane
 (C)2026 幻爱
 This software is released under the MIT License.
 http://opensource.org/licenses/mit-license.php
----------------------------------------------------------------------------
 Version
 1.3.1 2026/06/09 [幻爱更新] 移除旧存档限制：未记录过加入队伍的角色也能正常获得经验；
                   修复 document.currentScript 为 null 时参数无法读取的问题；
                   修复 findOutsideCustomExpRate 无标签时返回 null 导致经验率变为 0 的问题；
                   在英文/日文/中文帮助中补充旧存档兼容说明。
 1.3.0 2024/01/02 控えメンバーとパーティ外メンバとで別々の取得割合を指定できる機能を追加
 1.2.1 2023/08/13 割合をメモ欄から指定するとき、0も指定できるよう修正
 1.2.0 2023/08/12 MZで動作するよう修正
 1.1.0 2018/09/16 一度もパーティに加わっていないアクターも対しても経験値が加算される場合がある問題を修正
                  パーティ外アクターのレベルアップ時にメッセージを表示するかどうかを選択できる機能を追加
 1.0.1 2018/09/06 アクターが抜けている状態でセーブしたデータに対して本プラグインを適用して戦闘終了するとエラーになる問題を修正
 1.0.0 2018/09/04 初版
----------------------------------------------------------------------------
 [Blog]   : https://triacontane.blogspot.jp/
 [Twitter]: https://twitter.com/triacontane/
 [GitHub] : https://github.com/triacontane/
=============================================================================*/

/*:en
@plugindesc Experience value acquisition plugin for non-party members
@target MZ
@url https://github.com/huanaiyka/MZ-Plugins
@base PluginCommonBase
@orderAfter PluginCommonBase
@author 幻爱(Original: Triacontane)

@param expPercent
@text Reserve Member Rate
@desc The percentage of experience points that reserve members can receive.
@type number
@default 100

@param expPercentForOutParty
@text Outside Party Rate
@desc The percentage of experience points that non-party members can receive.
@type number
@default 100

@param showLevelUpMessage
@text Show Level Up Message
@desc Choose whether to display a message when a non-party member levels up.
@type boolean
@default true

@help
ExpForOutsideParty.js

【Feature】
Allows non-party members (including reserve members and those who have left the party) to gain a percentage of experience points after battle.

【Target Actors】
- Reserve members: Currently in the party but not participating in battle.
- Former members: Have joined the party at least once but are not currently in it.
- Modified version note: Even if an actor has never joined (e.g., old save data), they will still gain EXP as an "outside member." You can enable this plugin at any time without starting a new game.

【Parameters】
- Reserve Member Rate: EXP percentage for reserve members (default 100%).
- Outside Party Rate: EXP percentage for former members (default 100%).
- Show Level Up Message: Whether to show messages when outside members level up (default ON).

【Notetags】
You can specify custom EXP rates for actors, classes, weapons, armors, or states using notetags. If multiple tags exist, the highest value takes priority and overrides global parameters.

Tag format (choose one):
<OutsidePartyExpRate:50>
<パーティ外経験値レート:50>

【Whitelist Mode】
To grant EXP only to actors with the notetag, set both "Reserve Member Rate" and "Outside Party Rate" to 0. Only actors with valid tags will then gain EXP.

【Dependency】
Requires "PluginCommonBase.js" located in:
dlc/BasicResources/plugins/official

【Terms of Use】
You may freely modify and redistribute this plugin with no restrictions (commercial, adult content, etc.). This plugin is now yours.
*/

/*:ja
@plugindesc パーティ外メンバーの経験値取得プラグイン
@target MZ
@url https://github.com/huanaiyka/MZ-Plugins
@base PluginCommonBase
@orderAfter PluginCommonBase
@author 幻爱(Original: Triacontane)

@param expPercent
@text 控えメンバー取得率
@desc 控えメンバーが受け取ることのできる経験値の割合(%)です。
@type number
@default 100

@param expPercentForOutParty
@text パーティ外取得率
@desc パーティ外の仲間が受け取ることのできる経験値の割合(%)です。
@type number
@default 100

@param showLevelUpMessage
@text レベルアップメッセージ表示
@desc パーティ外の仲間がレベルアップしたときにメッセージを表示するかどうかを選択します。
@type boolean
@default true

@help
ExpForOutsideParty.js

【機能】
パーティ外のアクター（控えメンバーおよび離脱メンバー）に対しても、戦闘後に一定割合の経験値を付与します。

【対象アクター】
- 控えメンバー：パーティに所属しているが戦闘に不参加のメンバー。
- 離脱メンバー：一度でもパーティに加入したことがあるが、現在はパーティにいないメンバー。
- 修正版特記事項：一度も加入したことがないアクター（旧セーブデータ）でも「パーティ外」として正常に経験値を取得できます。プラグインを途中から有効にしても問題ありません。

【パラメータ】
- 控えメンバー取得率：控えメンバーが得られる経験値の割合（デフォルト100%）。
- パーティ外取得率：離脱メンバーが得られる経験値の割合（デフォルト100%）。
- レベルアップメッセージ表示：パーティ外メンバーがレベルアップした際にメッセージを表示するか（デフォルトON）。

【メモ欄タグ】
アクター、職業、武器、防具、ステートのメモ欄にタグを記述することで、個別に取得率を指定できます。複数定義された場合は最大値が優先され、プラグインパラメータより優先されます。

タグ形式（どちらか一方）：
<OutsidePartyExpRate:50>
<パーティ外経験値レート:50>

【ホワイトリストモード】
タグが付いたアクターだけに経験値を与えたい場合は、「控えメンバー取得率」と「パーティ外取得率」を両方0に設定してください。有効なタグを持つアクターのみが経験値を得られます。

【依存プラグイン】
ベースプラグイン「PluginCommonBase.js」が必要です。
RPGツクールMZインストールフォルダ内：
dlc/BasicResources/plugins/official

【利用規約】
作者に無断で改変・再配布可能で、利用形態（商用、18禁等）に制限はありません。このプラグインはもうあなたのものです。
*/

/*:zh
@plugindesc 非队伍成员获得经验值插件
@target MZ
@url https://github.com/huanaiyka/MZ-Plugins
@base PluginCommonBase
@orderAfter PluginCommonBase
@author 幻爱(Original: Triacontane)

@param expPercent
@text 待机成员获得率
@desc 未参战的待机成员可以获得的经验值百分比。
@type number
@default 100

@param expPercentForOutParty
@text 离队成员获得率
@desc 已离开队伍的成员可以获得的经验值百分比。
@type number
@default 100

@param showLevelUpMessage
@text 显示升级消息
@desc 当非队伍成员升级时是否显示消息。
@type boolean
@default true

@help
ExpForOutsideParty.js

【插件功能】
允许非队伍成员（包括未参战的待机成员和曾经加入过队伍但已离队的成员）在战斗结束后获得一定比例的经验值。

【适用对象】
- 待机成员：当前在队伍中但未参加战斗的成员。
- 离队成员：曾经加入过队伍，但当前不在队伍中的成员。
- 修正版特别说明：即使角色从未加入过队伍（即旧存档），也会被视作“队伍外成员”正常获得经验，因此可以随时启用本插件，无需新开存档。

【参数设置】
在插件管理器中设置以下参数：
- 待机成员获得率：待机成员获得的经验值百分比（默认100%）。
- 离队成员获得率：离队成员获得的经验值百分比（默认100%）。
- 显示升级消息：当非队伍成员升级时是否显示消息（默认开启）。

【备注标签】
您可以为角色、职业、武器、防具或状态添加备注标签，单独指定该对象的经验值获得率。
如果存在多个标签，则取最大值，且会覆盖插件参数中的全局设置。

标签格式（二选一）：
<OutsidePartyExpRate:50>
<パーティ外経験値レート:50>

【白名单模式】
如果您希望只有带有备注标签的角色才能获得经验，请将“待机成员获得率”和“离队成员获得率”都设为0，这样只有拥有有效标签的角色才会受益。

【依赖项】
本插件需要基础插件“PluginCommonBase.js”，该文件位于RPG Maker MZ安装目录下的：
dlc/BasicResources/plugins/official

【使用条款】
您可自由修改、再分发本插件，无任何使用限制（包括商业、成人内容等）。本插件现已属于您。
*/

(()=> {
    'use strict';
    // 修复：如果 currentScript 为 null，则通过选择器获取
    let script = document.currentScript;
    if (!script) {
        script = document.querySelector('script[src*="ExpForOutsideParty.js"]');
    }
    const param = PluginManagerEx.createParameter(script);

    /**
     * BattleManager.gainExp
     * EXPを加算します。
     */
    const _BattleManager_gainExp = BattleManager.gainExp;
    BattleManager.gainExp = function() {
        _BattleManager_gainExp.apply(this, arguments);
        $gameActors.gainExpWithoutParty(this._rewards.exp);
    };

    /**
     * Game_Actors.prototype.gainExpWithoutParty
     * パーティ外のメンバーにEXPを加算します。
     * @param exp EXP
     */
    Game_Actors.prototype.gainExpWithoutParty = function(exp) {
        const partyMember = $gameParty.allMembers();
        // 修改：兼容旧存档，将没有 _addParty 标志的角色也视为“曾加入过”
        this._data.filter(actor => actor && !partyMember.includes(actor) && (actor.isInPartyAtLeastOnce() || actor._addParty === undefined))
            .forEach(actor => actor.gainExp(exp));
    };

    const _Game_Actor_shouldDisplayLevelUp = Game_Actor.prototype.shouldDisplayLevelUp;
    Game_Actor.prototype.shouldDisplayLevelUp = function() {
        if (!$gameParty.battleMembers().includes(this)) {
            return param.showLevelUpMessage;
        } else {
            return _Game_Actor_shouldDisplayLevelUp.apply(this, arguments);
        }
    };

    Game_Actor.prototype.addParty = function() {
        this._addParty = true;
    };

    Game_Actor.prototype.isInPartyAtLeastOnce = function() {
        return this._addParty === true;
    };

    /**
     * Game_Actor.prototype.benchMembersExpRate
     * パーティ外のメンバーのレートを返します。
     */
    const _Game_Actor_benchMembersExpRate = Game_Actor.prototype.benchMembersExpRate;
    Game_Actor.prototype.benchMembersExpRate = function() {
        const rate = _Game_Actor_benchMembersExpRate.apply(this, arguments);
        if (!$gameParty.battleMembers().includes(this)) {
            const customRate = this.findOutsideCustomExpRate();
            const paramRate = $gameParty.allMembers().includes(this) ? param.expPercent : param.expPercentForOutParty;
            return (customRate !== undefined ? customRate : paramRate) / 100;
        } else {
            return rate;
        }
    };

    // 修复 findOutsideCustomExpRate：无有效标签时返回 undefined，而不是 null
    Game_Actor.prototype.findOutsideCustomExpRate = function() {
        let maxRate = undefined;
        for (const obj of this.traitObjects()) {
            const value = PluginManagerEx.findMetaValue(obj, ['OutsidePartyExpRate', 'パーティ外経験値レート']);
            if (value !== undefined && value !== null) {
                const num = Number(value);
                if (isNaN(num)) continue;
                if (maxRate === undefined || num > maxRate) maxRate = num;
            }
        }
        return maxRate;
    };

    const _Game_Party_addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function(actorId) {
        _Game_Party_addActor.apply(this, arguments);
        $gameActors.actor(actorId).addParty();
    };

    const _Game_Party_setupStartingMembers = Game_Party.prototype.setupStartingMembers;
    Game_Party.prototype.setupStartingMembers = function() {
        _Game_Party_setupStartingMembers.apply(this, arguments);
        this._actors.forEach(actorId => $gameActors.actor(actorId).addParty());
    };
})();