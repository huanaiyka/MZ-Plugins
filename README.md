# MZ-Plugins

Plugins for RPG Maker MZ

这里所有的插件由我（幻爱）借助AI（Deepseek和Gemini）制作而成。
改变版的插件已确认原作者允许更改和分发。

所有插件遵守MIT协议，请自由地使用。
署名请标注“幻爱”或“Huanaiyka”，也可以标注“幻愛”。

衷心感谢为RPGMaker世界做出贡献的作者们。
请享受RPGMaker的乐趣，祝你玩的开心(｡･ω･｡)ﾉ♡

---

## 插件列表

### AOE与伤害

- [Huanaiyka_AoeDamageCut.js](Huanaiyka_AoeDamageCut.js) — **AOE攻击的伤害削减**
  <sub><span style="color:#888">此插件允许你为“全体攻击”的伤害设置一个固定百分比削减。例如设置削减 20%，则全体攻击的最终伤害会变为原来的 80%。</span></sub>
- [Huanaiyka_CriticalDamage.js](Huanaiyka_CriticalDamage.js) — **全局暴击伤害倍率调整插件**
  <sub><span style="color:#888">本插件允许你通过参数修改游戏全局的暴击伤害倍率。</span></sub>
- [Huanaiyka_EffectiveBoost.js](Huanaiyka_EffectiveBoost.js) — **特殊装备使属性克制时增伤**
  <sub><span style="color:#888">本插件可以在攻击属性克制目标（属性有效度 > 100%）时，额外提升伤害倍率。在武器或防具的备注栏中写入：`<EffectiveBoost: 倍率>`</span></sub>
- [Huanaiyka_EnemyStateDamageBoost.js](Huanaiyka_EnemyStateDamageBoost.js) — **特定技能对异常状态的敌人伤害翻倍**
  <sub><span style="color:#888">该插件的功能完全可被伤害公式：`(基础伤害公式) * (b.isStateAffected(状态ID) ? 2 : 1)`替代。</span></sub>
- [Huanaiyka_MinimumDamage.js](Huanaiyka_MinimumDamage.js) — **强制最低伤害为可配置的最小值**
  <sub><span style="color:#888">使用插件后，战斗造成的最低伤害可以是1而不是0。除非对方使用了属性无效的技能。</span></sub>
- [Huanaiyka_SkillSelfDamage.js](Huanaiyka_SkillSelfDamage.js) — **制作对自身造成反伤的技能**
  <sub><span style="color:#888">本插件可用于制作命中敌人后，对使用者自身造成反伤的技能。技能的备注栏添加标签，即可让该技能命中敌人后，使用者自身也受到对应数值或百分比的伤害。</span></sub>

### 防具与装备

- [Huanaiyka_ArmorLockHP.js](Huanaiyka_ArmorLockHP.js) — **制作锁血防具**
  <sub><span style="color:#888">本插件允许您通过防具备注栏设置“锁血”效果。可显示自定义的台词信息，还可选择触发后防具是否消失。</span></sub>
- [Huanaiyka_AutoArmorUpgrade.js](Huanaiyka_AutoArmorUpgrade.js) — **动态链式防具自动升级系统**
  <sub><span style="color:#888">支持按指定新旧ID升级、按基础ID+等级变量链式升级、槽位ID+1升级，以及全队搜索升级等多种方式，适用于装备进化、强化等游戏机制。</span></sub>
- [Huanaiyka_CloneArmorNote.js](Huanaiyka_CloneArmorNote.js) — **批量复制防具备注**
  <sub><span style="color:#888">将指定“源防具”的备注内容，批量复制到目标列表中的所有防具。支持覆盖或追加两种模式。追加时自动换行。</span></sub>
- [Huanaiyka_EquipActionEvent.js](Huanaiyka_EquipActionEvent.js) — **穿上/脱下装备触发公共事件，可拒绝脱下装备**
  <sub><span style="color:#888">在装备的备注栏中写入指定标签，即可在角色穿上或脱下该装备时自动触发公共事件。公共事件只会在菜单关闭之后执行。可以单独选择「只触发事件但允许操作」或「触发事件并拒绝操作」。拒绝脱下装备的表现方式是“音效和流程正常，但装备没有被脱下。”</span></sub>
- [Huanaiyka_EquipActorTags.js](Huanaiyka_EquipActorTags.js) — **提供额外装备角色许可机制**
  <sub><span style="color:#888">本插件通过备注标签灵活控制武器/防具的装备权限。支持全装备、禁止、专属、额外允许四种标签，并按优先级处理，便于管理复杂限制。</span></sub>
- [Huanaiyka_EquipAutoStatsDesc.js](Huanaiyka_EquipAutoStatsDesc.js) — **在装备说明文末尾自动加上能力值增减**（原作者：GMN）
  <sub><span style="color:#888">修改说明：相比原版增加了显示场景、描述位置、参数名与数值独立颜色及正负自动染色等自定义功能。</span></sub>
- [Huanaiyka_EquipBreak.js](Huanaiyka_EquipBreak.js) — **装备有概率在进攻或防守时被破坏**
  <sub><span style="color:#888">每件装备的损坏概率、触发条件和伤害类型均可在备注栏中独立配置，允许显示提示文字并播放音效。</span></sub>
- [Huanaiyka_EquipDetailWithCodes.js](Huanaiyka_EquipDetailWithCodes.js) — **装备详细说明窗口与防具信息转义码**（原作者：DarkPlasma）
  <sub><span style="color:#888">1. 装备详情窗口：在装备场景按指定按键（默认 Shift）显示装备的详细说明。支持 `<detail:文本>`、`<presetDetail:ID>`、`<detailButton开关号:文本>` 标签。2. 防具信息转义码：通过变量存储防具ID，在任意文本中使用 `\armor_name`、`\skill_entryN` 等动态显示信息。修改说明：本插件在原版（仅支持简单 `<detail>` 标签）基础上，新增了预设说明、开关控制标签、自动换行、装备ID存储等扩展功能，并提供更丰富的配置参数。</span></sub>
- [Huanaiyka_EquipElementResist.js](Huanaiyka_EquipElementResist.js) — **装备属性有效度完全覆盖**
  <sub><span style="color:#888">本插件让特定装备在穿戴后，角色的所有属性有效度（抗性）完全由该装备自带的“属性有效度”特性提供，无视角色本身、职业、状态等其他来源。</span></sub>
- [Huanaiyka_EquipSlotDisabler.js](Huanaiyka_EquipSlotDisabler.js) — **禁用角色装备槽位**
  <sub><span style="color:#888">通过插件指令精准禁用或解禁指定角色的装备槽位。适用于剧情锁槽、角色状态异常或特定副本限制等玩法场景。</span></sub>
- [Huanaiyka_MarkEquip.js](Huanaiyka_MarkEquip.js) — **玩家手动标记武器/防具**
  <sub><span style="color:#888">在装备菜单中，选中任意武器或防具，按标记键（默认M）即可添加/取消标记。被标记的装备名称前显示★（可自定义符号，留空则不显示符号），文字颜色变为您指定的颜色。</span></sub>
- [Huanaiyka_SwitchBasedSkillEquip.js](Huanaiyka_SwitchBasedSkillEquip.js) — **根据开关状态切换防具提供的技能**
  <sub><span style="color:#888">`<switchSkill: 1, 10, 20>` 当开关 1 关闭时，装备该防具会学习技能 10；当开关 1 开启时，装备该防具会学习技能 20。</span></sub>

### 战斗系统

- [Huanaiyka_AutoAttackOnHold.js](Huanaiyka_AutoAttackOnHold.js) — **快速战斗，鼠标长按时自动为所有角色选择攻击第一个敌人**
  <sub><span style="color:#888">自动为当前待机的角色选择“攻击”命令。自动选择第一个敌人作为目标。自动确认选择，直到所有角色命令输入完毕或鼠标松开。效果类似键盘操作时“长按确定键”。</span></sub>
- [Huanaiyka_BattleResultDelay.js](Huanaiyka_BattleResultDelay.js) — **敌群页延迟执行战斗结果**
  <sub><span style="color:#888">在敌群事件页中使用四个插件指令，分别标记通用、胜利、失败、逃跑时延迟执行的事件指令块。战斗结束后，按「通用块 → 结果块」的顺序在地图上执行。本插件的优势在于能够更好地控制随机遇敌等场景下的执行流程。</span></sub>
- [Huanaiyka_ChampionshipSystem.js](Huanaiyka_ChampionshipSystem.js) — **擂台赛模拟器**
  <sub><span style="color:#888">本插件用于实现多轮淘汰制擂台赛：1. 从预设敌群池中按出现概率抽取指定数量作为对手。2. 每轮玩家随机与一组敌群战斗，其余敌群按基础胜率与克制关系模拟内部淘汰。3. 最终决出冠军，玩家与冠军敌群对战。4. 若玩家在中途战败，只需调用“一键决出总冠军”指令，系统将自动完成剩余模拟，合并输出所有战报，并直接返回最终冠军 ID。</span></sub>
- [Huanaiyka_DeadExpGain.js](Huanaiyka_DeadExpGain.js) — **让死亡的同伴也能获得一定比例经验值**
  <sub><span style="color:#888">在战斗胜利时，死亡的角色默认无法获得经验值。本插件允许死亡角色获得一定比例的经验值，默认为50%。</span></sub>
- [Huanaiyka_EnemyParamRate.js](Huanaiyka_EnemyParamRate.js) — **通过备注标签为敌人设置能力值倍率**
  <sub><span style="color:#888">本插件允许你在敌人的备注栏中写入特定标签，从而直接提升或降低该敌人的各项基础属性倍率。倍率会作用于数据库原始数值，然后再与特性叠加计算。</span></sub>
- [Huanaiyka_EnemyStateImage.js](Huanaiyka_EnemyStateImage.js) — **状态备注控制敌人透明度**
  <sub><span style="color:#888">本插件允许通过在状态的备注中添加标签，动态调整敌人精灵的透明度。</span></sub>
- [Huanaiyka_EnemyTargetAI.js](Huanaiyka_EnemyTargetAI.js) — **敌人智能AI：不会对目标使用元素无效的技能，并支持进攻偏好**
  <sub><span style="color:#888">本插件让敌人更智能：1. 自动避开元素无效技能（不会用火焰打火免疫角色）。2. 支持进攻偏好规则（优先打血量最低、带有特定状态、被属性克制、六围高低、指定名字/ID、变量动态名字、基于最大值等）。3. 在技能的备注栏中填写 `<SkillNoSelf>`，敌人绝不会选择自己作为目标。</span></sub>
- [Huanaiyka_EnemyTransformDynamic.js](Huanaiyka_EnemyTransformDynamic.js) — **智能敌人伪装系统**
  <sub><span style="color:#888">1. 在插件参数中配置所有伪装角色的名字、战斗图、对话框头像和地图行走图。2. 自动寻找带有 `<disguiser>` 标签的敌人或地图事件，并根据“伪装ID”瞬间完成变身。3. 提供“伪装者发言”指令，自动适配变身/本体状态下的名字和头像。扩展应用：事件自动切换为对应的行走图、名字和头像，实现随机路人等效果。</span></sub>
- [Huanaiyka_EscapeAlways.js](Huanaiyka_EscapeAlways.js) — **非随机遇敌逃跑率控制**
  <sub><span style="color:#888">1. 默认行为：启用插件后，所有事件战斗的初始逃跑成功率默认为 100%。2. 插件指令控制：为下一次事件战斗单独指定精准的逃跑成功率（0%~100%），插件指令的设置会优先覆盖默认行为。</span></sub>
- [Huanaiyka_MoreBattleMembers.js](Huanaiyka_MoreBattleMembers.js) — **增加战斗的最大出战人数**
  <sub><span style="color:#888">本插件允许您自定义战斗中最多可出战的角色数量。- 当战斗人数 ≤ 4 时，完全使用原版UI。- 当战斗人数 ≥ 5 时，自动切换为宽度自适应UI。- 支持插件指令动态开关功能、修改最大出战人数。</span></sub>
- [Huanaiyka_PlayerControlEnemies.js](Huanaiyka_PlayerControlEnemies.js) — **强制指定敌方操作**
  <sub><span style="color:#888">本插件允许玩家在战斗中手动控制敌人的行动，包括攻击、防御和使用技能。适用于调试、测试或特殊的游戏机制设计。</span></sub>
- [Huanaiyka_StateConflictNoReset.js](Huanaiyka_StateConflictNoReset.js) — **状态互斥，状态回合不重置**
  <sub><span style="color:#888">1. 状态互斥：同一互斥组内的状态不能共存（后来的状态不会附加）2. 状态回合不重置：同一状态再次附加时，不重置剩余回合数</span></sub>

### 技能与属性

- [Huanaiyka_AutoSkillDesc.js](Huanaiyka_AutoSkillDesc.js) — **自动为技能添加前缀**
  <sub><span style="color:#888">本插件会自动为所有技能描述的前方添加一个前缀。前缀内容默认基于技能的「伤害属性」和「技能类型」生成。支持自定义前缀格式，也支持为无属性技能单独设定一个固定前缀（如【变化招式】）。</span></sub>
- [Huanaiyka_ElementMessagePlus.js](Huanaiyka_ElementMessagePlus.js) — **属性消息追加插件**（原作者：KPoal）
  <sub><span style="color:#888">受到属性攻击时，根据属性有效度显示额外的消息。修改说明：本修改版为避免与其他倍率类插件冲突，强制使用原生的 `target.elementRate()` 进行属性判定。同时，已将插件翻译为中文，改变了默认信息文字，并加入了系统冲突提示。</span></sub>

### 物品与商店

- [Huanaiyka_AutoShopEnter.js](Huanaiyka_AutoShopEnter.js) — **打开商店时自动进入商品列表，并支持仅购买时快速退出**
  <sub><span style="color:#888">无需再手动选择“购买”，相当于自动为你按下了确认键。在商品购买列表中按“取消”按键时，将直接退出商店场景，无需二次确认。</span></sub>
- [Huanaiyka_ItemCursorMemory.js](Huanaiyka_ItemCursorMemory.js) — **物品选择光标位置记忆**
  <sub><span style="color:#888">在事件“物品选择处理”中，自动记住上次选中的物品。下次打开同一个物品选择界面时，光标自动移动到上次位置。</span></sub>
- [Huanaiyka_ItemListClickBlank.js](Huanaiyka_ItemListClickBlank.js) — **点击物品/技能列表空白区域激活窗口**
  <sub><span style="color:#888">- 点击列表空白处激活窗口，并选中第一个项目。- 点击项目直接使用。</span></sub>
- [Huanaiyka_ItemRenamer.js](Huanaiyka_ItemRenamer.js) — **永久更改道具/武器/防具的名称和说明文**
  <sub><span style="color:#888">本插件动态修改内存中的数据库条目，所有窗口自动显示修改后的名称和说明。修改记录随存档保存。</span></sub>
- [Huanaiyka_PointShop.js](Huanaiyka_PointShop.js) — **点数商店 使用变量代替默认货币购买物品**
  <sub><span style="color:#888">本插件可以让商店不再消耗金币，而是消耗指定的变量值（点数）。适合用于积分兑换、代币商店、活动货币等场景。只需开启对应开关，默认商店的金币显示和支付逻辑会自动切换为点数模式。</span></sub>
- [Huanaiyka_ShopHideOwnedItems.js](Huanaiyka_ShopHideOwnedItems.js) — **商店自动隐藏已拥有物品**
  <sub><span style="color:#888">本插件可以让商店在浏览商品时，自动隐藏玩家已经拥有的物品，避免重复购买，实现某些商品只能获得唯一的一个。</span></sub>

### 地图与事件

- [Huanaiyka_ChangeGatherSpeed.js](Huanaiyka_ChangeGatherSpeed.js) — **调整「集合队列成员」事件指令的执行速度**
  <sub><span style="color:#888">可根据需要调整「集合速度」参数（默认5，原版速度为4）</span></sub>
- [Huanaiyka_EnemyMapCtrl.js](Huanaiyka_EnemyMapCtrl.js) — **通过开关控制地图的敌群列表**
  <sub><span style="color:#888">本插件用于控制 RPG Maker 数据库中“地图遇敌列表”的解锁条件。可以指定“从第 N 个敌群开始，必须开启指定开关后才能被玩家遇到”。</span></sub>
- [Huanaiyka_EventFollow.js](Huanaiyka_EventFollow.js) — **NPC更自然地跟随玩家**
  <sub><span style="color:#888">让事件像同伴一样跟随玩家移动，具备自动寻路、距离延迟、阶梯加速、移动/转向独立控制等功能。</span></sub>
- [Huanaiyka_EveryEventIsMove.js](Huanaiyka_EveryEventIsMove.js) — **长按推动NPC**（原作者：李先生）
  <sub><span style="color:#888">本插件在原版（仅支持长按推动与推箱子）基础上，增加了移动类型过滤、自定义长按帧数、推动冷却、记录被推信息（ID/坐标/方向）及插件指令、触发公共事件等扩展功能。</span></sub>
- [Huanaiyka_MapFollowerCount.js](Huanaiyka_MapFollowerCount.js) — **改变地图上的跟随者数量**
  <sub><span style="color:#888">本插件允许您动态调整地图上显示的跟随者数量，不影响出战人数。同时，当有新人加入队伍时，跟随者会出现在事件位置（如角色加入事件的位置），避免与玩家重叠，提升剧情演出的自然度。</span></sub>
- [Huanaiyka_MapMoveRestrict.js](Huanaiyka_MapMoveRestrict.js) — **限制玩家只能站在允许的区域ID上**
  <sub><span style="color:#888">当开关开启时，玩家只能移动到目标格子的区域ID在允许列表中的位置。当按下方向键无法移动时，角色仍会转向该方向。</span></sub>
- [Huanaiyka_RandomBalloon.js](Huanaiyka_RandomBalloon.js) — **在指定范围内随机显示气泡**
  <sub><span style="color:#888">功能说明：在指定目标（玩家/当前事件/指定事件）上随机显示一个气泡。气泡编号范围可在插件参数中自定义，也支持通过插件指令在游戏过程中动态修改。</span></sub>
- [Huanaiyka_SetMoveLoop.js](Huanaiyka_SetMoveLoop.js) — **事件踏步/行走动画改为重头循环**
  <sub><span style="color:#888">在事件备注栏或任意页面备注栏写入以下标签启用循环动画（0,1,2,0,1,2...）：`<PatternMode: restart>`</span></sub>
- [Huanaiyka_TapToTurn.js](Huanaiyka_TapToTurn.js) — **轻点方向键转向**
  <sub><span style="color:#888">此插件让玩家角色轻点方向键时仅转向，长按超过阈值后才开始连续移动。按下指定的跳过按键（如 Shift）时，临时恢复原版立即移动行为，便于快速操作。</span></sub>
- [Huanaiyka_VisibleDistance.js](Huanaiyka_VisibleDistance.js) — **事件距离隐形**
  <sub><span style="color:#888">本插件可以让地图上的事件在玩家离开指定距离后自动隐藏（透明度变为0），靠近后自动显示。支持同一组事件联动显示。</span></sub>

### 界面与菜单

- [Huanaiyka_FaceImageSwitcher.js](Huanaiyka_FaceImageSwitcher.js) — **开关控制头像文件替换**
  <sub><span style="color:#888">这个插件允许你在指定的一组开关满足条件时，将整个头像文件替换为另一个文件。</span></sub>
- [Huanaiyka_MenuHideOptions.js](Huanaiyka_MenuHideOptions.js) — **隐藏主菜单中的“选项”命令**
  <sub><span style="color:#888">开启后，玩家在游戏中按 ESC 打开的菜单里不会出现“选项”按钮。但游戏刚开始的标题画面中的“选项”会完好保留，方便玩家调音量或按键。</span></sub>
- [Huanaiyka_MenuListCursorPlus.js](Huanaiyka_MenuListCursorPlus.js) — **菜单列表光标循环 + 长按加速**
  <sub><span style="color:#888">1. 光标循环滚动：顶部按「上」跳到底部，底部按「下」跳到顶部。2. 长按加速：按住上/下键超过设定时间后，光标移动速度自动加快。</span></sub>
- [Huanaiyka_NumberInputCancel.js](Huanaiyka_NumberInputCancel.js) — **数值输入处理可按取消键退出**
  <sub><span style="color:#888">游戏中执行“数值输入的处理”时，按取消键即可立刻结束输入，并将指定的变量设置为 -1。（可能还需处理“如果变量为-1”时的分支条件）</span></sub>
- [Huanaiyka_SaveNope.js](Huanaiyka_SaveNope.js) — **禁用存档并显示文字**
  <sub><span style="color:#888">在指定的地图或条件下，玩家点击菜单中的“存档”按钮时，不会进入存档界面，而是弹出一个自定义文字的提示窗口。</span></sub>
- [Huanaiyka_ScreenZoom.js](Huanaiyka_ScreenZoom.js) — **临时将画面以指定事件（或玩家）为中心进行缩放**（原作者：神無月サスケ）
  <sub><span style="color:#888">修改说明：支持快捷键循环缩放（100%→200%→400%）、缩放时方向键移动相机、场景切换后自动恢复缩放倍率。</span></sub>

### 音频与画面

- [Huanaiyka_PixelNearestFilter.js](Huanaiyka_PixelNearestFilter.js) — **像素点过滤增强**
  <sub><span style="color:#888">本插件通过强制所有角色图片使用“点过滤”渲染模式，防止线性过滤导致的像素混合，从而彻底解决角色边缘的杂色问题。</span></sub>
- [Huanaiyka_SeFader.js](Huanaiyka_SeFader.js) — **为SE提供淡入淡出**
  <sub><span style="color:#888">本插件为音效（SE）添加平滑的淡入与淡出功能，专为长音效（背景环境声、脚步声循环、持续警报等）优化。</span></sub>

### 系统与数据

- [Huanaiyka_PerSave_for_TorigoyaMZ_Achievement2.js](Huanaiyka_PerSave_for_TorigoyaMZ_Achievement2.js) — **成就数据绑定到存档补丁**
  <sub><span style="color:#888">使 TorigoyaMZ_Achievement2 的成就数据不再跨存档，而是随每个游戏存档独立保存。该补丁必须放在原插件 TorigoyaMZ_Achievement2.js 之后。</span></sub>
- [Huanaiyka_TempParty.js](Huanaiyka_TempParty.js) — **临时队伍与道具切换插件**
  <sub><span style="color:#888">本插件适用于进入特殊副本、剧情事件或临时挑战时，保存玩家当前的队伍结构及背包道具，并切换为指定的临时队伍或清空背包。离开副本或事件结束时，可通过指令快速一键还原队伍与道具。临时队伍与道具的功能可单独使用。</span></sub>
- [Huanaiyka_UniqueRandomDraw.js](Huanaiyka_UniqueRandomDraw.js) — **无放回随机抽取池到变量**
  <sub><span style="color:#888">从指定池子中无放回随机抽取一个元素（数字或文字均可），抽完可按设定自动重置或返回 0。多池独立状态，可存盘。</span></sub>
- [Huanaiyka_WeightedRandom.js](Huanaiyka_WeightedRandom.js) — **基于权重的随机数选择**
  <sub><span style="color:#888">例如：设定选项 A 权重为 1，选项 B 权重为 2，选项 C 权重为 5，则 C 被选中的概率是 A 的 5 倍，B 是 A 的 2 倍。</span></sub>
