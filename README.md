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

- [Huanaiyka_AoeDamageCut.js](Huanaiyka_AoeDamageCut.js)
  <details><summary><sub>说明</sub></summary><sub>AOE攻击的伤害削减。为“全体攻击”的伤害设置固定百分比削减，例如削减 20%，则全体攻击最终伤害变为原来的 80%。</sub></details>
- [Huanaiyka_CriticalDamage.js](Huanaiyka_CriticalDamage.js)
  <details><summary><sub>说明</sub></summary><sub>全局暴击伤害倍率调整插件，通过参数修改游戏全局的暴击伤害倍率。</sub></details>
- [Huanaiyka_EffectiveBoost.js](Huanaiyka_EffectiveBoost.js)
  <details><summary><sub>说明</sub></summary><sub>特殊装备使属性克制时增伤。攻击属性克制目标（属性有效度 > 100%）时额外提升伤害倍率，在武器或防具备注栏写入 `<EffectiveBoost: 倍率>`。</sub></details>
- [Huanaiyka_EnemyStateDamageBoost.js](Huanaiyka_EnemyStateDamageBoost.js)
  <details><summary><sub>说明</sub></summary><sub>特定技能对异常状态的敌人伤害翻倍。功能完全可被伤害公式 `(基础伤害公式) * (b.isStateAffected(状态ID) ? 2 : 1)` 替代。</sub></details>
- [Huanaiyka_MinimumDamage.js](Huanaiyka_MinimumDamage.js)
  <details><summary><sub>说明</sub></summary><sub>强制最低伤害为可配置的最小值，最低伤害可以是 1 而不是 0，除非对方使用了属性无效的技能。</sub></details>
- [Huanaiyka_SkillSelfDamage.js](Huanaiyka_SkillSelfDamage.js)
  <details><summary><sub>说明</sub></summary><sub>制作对自身造成反伤的技能。技能备注栏添加标签后，命中敌人时使用者自身也受到对应数值或百分比的伤害。</sub></details>

### 防具与装备

- [Huanaiyka_ArmorLockHP.js](Huanaiyka_ArmorLockHP.js)
  <details><summary><sub>说明</sub></summary><sub>制作锁血防具。通过防具备注栏设置“锁血”效果，可显示自定义台词信息，还可选择触发后防具是否消失。</sub></details>
- [Huanaiyka_AutoArmorUpgrade.js](Huanaiyka_AutoArmorUpgrade.js)
  <details><summary><sub>说明</sub></summary><sub>动态链式防具自动升级系统。支持按指定新旧ID升级、按基础ID+等级变量链式升级、槽位ID+1升级、全队搜索升级等方式。</sub></details>
- [Huanaiyka_CloneArmorNote.js](Huanaiyka_CloneArmorNote.js)
  <details><summary><sub>说明</sub></summary><sub>批量复制防具备注。将指定“源防具”的备注内容批量复制到目标列表中的所有防具，支持覆盖或追加，追加时自动换行。</sub></details>
- [Huanaiyka_EquipActionEvent.js](Huanaiyka_EquipActionEvent.js)
  <details><summary><sub>说明</sub></summary><sub>穿上/脱下装备触发公共事件，可拒绝脱下装备。公共事件只在菜单关闭后执行，可选择“只触发事件但允许操作”或“触发事件并拒绝操作”。</sub></details>
- [Huanaiyka_EquipActorTags.js](Huanaiyka_EquipActorTags.js)
  <details><summary><sub>说明</sub></summary><sub>提供额外装备角色许可机制。通过备注标签控制武器/防具装备权限，支持全装备、禁止、专属、额外允许四种标签并按优先级处理。</sub></details>
- [Huanaiyka_EquipAutoStatsDesc.js](Huanaiyka_EquipAutoStatsDesc.js) <sub>（原作者：GMN）</sub>
  <details><summary><sub>说明</sub></summary><sub>在装备说明文末尾自动加上能力值增减。相比原版增加了显示场景、描述位置、参数名与数值独立颜色及正负自动染色等自定义功能。</sub></details>
- [Huanaiyka_EquipBreak.js](Huanaiyka_EquipBreak.js)
  <details><summary><sub>说明</sub></summary><sub>装备有概率在进攻或防守时被破坏。每件装备的损坏概率、触发条件和伤害类型均可在备注栏独立配置，允许显示提示文字并播放音效。</sub></details>
- [Huanaiyka_EquipDetailWithCodes.js](Huanaiyka_EquipDetailWithCodes.js) <sub>（原作者：DarkPlasma）</sub>
  <details><summary><sub>说明</sub></summary><sub>装备详细说明窗口与防具信息转义码。支持 `<detail:文本>`、`<presetDetail:ID>`、`<detailButton开关号:文本>` 标签；可通过变量存储防具ID，使用 `\armor_name`、`\skill_entryN` 等动态显示信息。</sub></details>
- [Huanaiyka_EquipElementResist.js](Huanaiyka_EquipElementResist.js)
  <details><summary><sub>说明</sub></summary><sub>装备属性有效度完全覆盖。特定装备穿戴后，角色所有属性有效度完全由该装备自带的“属性有效度”特性提供，无视其他来源。</sub></details>
- [Huanaiyka_EquipSlotDisabler.js](Huanaiyka_EquipSlotDisabler.js)
  <details><summary><sub>说明</sub></summary><sub>禁用角色装备槽位。通过插件指令精准禁用或解禁指定角色的装备槽位，适用于剧情锁槽、状态异常或副本限制等场景。</sub></details>
- [Huanaiyka_MarkEquip.js](Huanaiyka_MarkEquip.js)
  <details><summary><sub>说明</sub></summary><sub>玩家手动标记武器/防具。在装备菜单中按标记键（默认M）添加/取消标记，被标记装备名称前显示★（可自定义，留空则不显示），文字颜色可变。</sub></details>
- [Huanaiyka_SwitchBasedSkillEquip.js](Huanaiyka_SwitchBasedSkillEquip.js)
  <details><summary><sub>说明</sub></summary><sub>根据开关状态切换防具提供的技能。`<switchSkill: 1, 10, 20>`：开关 1 关闭时学习技能 10，开启时学习技能 20。</sub></details>

### 战斗系统

- [Huanaiyka_AutoAttackOnHold.js](Huanaiyka_AutoAttackOnHold.js)
  <details><summary><sub>说明</sub></summary><sub>快速战斗，鼠标长按时自动为所有角色选择攻击第一个敌人。自动选择“攻击”命令、第一个敌人并自动确认，直到所有角色命令输入完毕或鼠标松开。</sub></details>
- [Huanaiyka_BattleResultDelay.js](Huanaiyka_BattleResultDelay.js)
  <details><summary><sub>说明</sub></summary><sub>敌群页延迟执行战斗结果。在敌群事件页用四个插件指令分别标记通用、胜利、失败、逃跑时延迟执行的事件指令块，战斗结束后按「通用块 → 结果块」顺序在地图上执行。</sub></details>
- [Huanaiyka_ChampionshipSystem.js](Huanaiyka_ChampionshipSystem.js)
  <details><summary><sub>说明</sub></summary><sub>擂台赛模拟器。从敌群池按概率抽取对手，每轮玩家随机与一组敌群战斗，其余敌群按胜率与克制关系模拟淘汰，最终决出冠军；中途战败可调用“一键决出总冠军”完成剩余模拟并返回冠军 ID。</sub></details>
- [Huanaiyka_DeadExpGain.js](Huanaiyka_DeadExpGain.js)
  <details><summary><sub>说明</sub></summary><sub>让死亡的同伴也能获得一定比例经验值，默认为 50%。</sub></details>
- [Huanaiyka_EnemyParamRate.js](Huanaiyka_EnemyParamRate.js)
  <details><summary><sub>说明</sub></summary><sub>通过备注标签为敌人设置能力值倍率。倍率作用于数据库原始数值，然后再与特性叠加计算。</sub></details>
- [Huanaiyka_EnemyStateImage.js](Huanaiyka_EnemyStateImage.js)
  <details><summary><sub>说明</sub></summary><sub>状态备注控制敌人透明度。在状态备注中添加标签，动态调整敌人精灵的透明度。</sub></details>
- [Huanaiyka_EnemyTargetAI.js](Huanaiyka_EnemyTargetAI.js)
  <details><summary><sub>说明</sub></summary><sub>敌人智能AI：自动避开元素无效技能，支持进攻偏好（血量最低、特定状态、被属性克制、六围高低、指定名字/ID、变量动态名字等），技能备注 `<SkillNoSelf>` 可禁止选择自己。</sub></details>
- [Huanaiyka_EnemyTransformDynamic.js](Huanaiyka_EnemyTransformDynamic.js)
  <details><summary><sub>说明</sub></summary><sub>智能敌人伪装系统。配置伪装角色的名字、战斗图、头像和行走图，自动寻找 `<disguiser>` 标签的敌人或事件并按“伪装ID”变身，提供“伪装者发言”指令自动适配名字和头像。</sub></details>
- [Huanaiyka_EscapeAlways.js](Huanaiyka_EscapeAlways.js)
  <details><summary><sub>说明</sub></summary><sub>非随机遇敌逃跑率控制。默认所有事件战斗初始逃跑成功率 100%，也可用插件指令为下一次事件战斗单独指定 0%~100% 的逃跑率。</sub></details>
- [Huanaiyka_MoreBattleMembers.js](Huanaiyka_MoreBattleMembers.js)
  <details><summary><sub>说明</sub></summary><sub>增加战斗的最大出战人数。≤4 人使用原版UI，≥5 人自动切换为宽度自适应UI，支持插件指令动态开关和修改最大出战人数。</sub></details>
- [Huanaiyka_PlayerControlEnemies.js](Huanaiyka_PlayerControlEnemies.js)
  <details><summary><sub>说明</sub></summary><sub>强制指定敌方操作。允许玩家在战斗中手动控制敌人的行动，包括攻击、防御和使用技能，适用于调试、测试或特殊机制。</sub></details>
- [Huanaiyka_StateConflictNoReset.js](Huanaiyka_StateConflictNoReset.js)
  <details><summary><sub>说明</sub></summary><sub>状态互斥，状态回合不重置。同一互斥组内的状态不能共存（后来的状态不会附加）；同一状态再次附加时不重置剩余回合数。</sub></details>

### 技能与属性

- [Huanaiyka_AutoSkillDesc.js](Huanaiyka_AutoSkillDesc.js)
  <details><summary><sub>说明</sub></summary><sub>自动为技能添加前缀。前缀默认基于技能的「伤害属性」和「技能类型」生成，支持自定义格式，也支持为无属性技能单独设定固定前缀（如【变化招式】）。</sub></details>
- [Huanaiyka_ElementMessagePlus.js](Huanaiyka_ElementMessagePlus.js) <sub>（原作者：KPoal）</sub>
  <details><summary><sub>说明</sub></summary><sub>属性消息追加插件。受到属性攻击时根据属性有效度显示额外消息；修改版强制使用原生 `target.elementRate()` 判定，已翻译为中文并加入系统冲突提示。</sub></details>

### 物品与商店

- [Huanaiyka_AutoShopEnter.js](Huanaiyka_AutoShopEnter.js)
  <details><summary><sub>说明</sub></summary><sub>打开商店时自动进入商品列表，并支持仅购买时快速退出。在商品购买列表中按“取消”将直接退出商店场景，无需二次确认。</sub></details>
- [Huanaiyka_ItemCursorMemory.js](Huanaiyka_ItemCursorMemory.js)
  <details><summary><sub>说明</sub></summary><sub>物品选择光标位置记忆。在事件“物品选择处理”中自动记住上次选中物品，下次打开同一界面时光标自动移动回上次位置。</sub></details>
- [Huanaiyka_ItemListClickBlank.js](Huanaiyka_ItemListClickBlank.js)
  <details><summary><sub>说明</sub></summary><sub>点击物品/技能列表空白区域激活窗口并选中第一个项目；点击项目直接使用。</sub></details>
- [Huanaiyka_ItemRenamer.js](Huanaiyka_ItemRenamer.js)
  <details><summary><sub>说明</sub></summary><sub>永久更改道具/武器/防具的名称和说明文。动态修改内存中的数据库条目，所有窗口自动显示修改后内容，修改记录随存档保存。</sub></details>
- [Huanaiyka_PointShop.js](Huanaiyka_PointShop.js)
  <details><summary><sub>说明</sub></summary><sub>点数商店，使用变量代替默认货币购买物品。开启对应开关后，默认商店的金币显示和支付逻辑自动切换为点数模式。</sub></details>
- [Huanaiyka_ShopHideOwnedItems.js](Huanaiyka_ShopHideOwnedItems.js)
  <details><summary><sub>说明</sub></summary><sub>商店自动隐藏已拥有物品，避免重复购买，实现某些商品只能获得唯一一个。</sub></details>

### 地图与事件

- [Huanaiyka_ChangeGatherSpeed.js](Huanaiyka_ChangeGatherSpeed.js)
  <details><summary><sub>说明</sub></summary><sub>调整「集合队列成员」事件指令的执行速度，可调整「集合速度」参数（默认5，原版速度为4）。</sub></details>
- [Huanaiyka_EnemyMapCtrl.js](Huanaiyka_EnemyMapCtrl.js)
  <details><summary><sub>说明</sub></summary><sub>通过开关控制地图的敌群列表。可指定“从第 N 个敌群开始，必须开启指定开关后才能被玩家遇到”。</sub></details>
- [Huanaiyka_EventFollow.js](Huanaiyka_EventFollow.js)
  <details><summary><sub>说明</sub></summary><sub>NPC更自然地跟随玩家。具备自动寻路、距离延迟、阶梯加速、移动/转向独立控制等功能。</sub></details>
- [Huanaiyka_EveryEventIsMove.js](Huanaiyka_EveryEventIsMove.js) <sub>（原作者：李先生）</sub>
  <details><summary><sub>说明</sub></summary><sub>长按推动NPC。在原版长按推动与推箱子基础上，增加移动类型过滤、自定义长按帧数、推动冷却、记录被推信息（ID/坐标/方向）及插件指令、触发公共事件等扩展功能。</sub></details>
- [Huanaiyka_MapFollowerCount.js](Huanaiyka_MapFollowerCount.js)
  <details><summary><sub>说明</sub></summary><sub>改变地图上的跟随者数量，不影响出战人数。新人加入队伍时跟随者会出现在事件位置，避免与玩家重叠。</sub></details>
- [Huanaiyka_MapMoveRestrict.js](Huanaiyka_MapMoveRestrict.js)
  <details><summary><sub>说明</sub></summary><sub>限制玩家只能站在允许的区域ID上。开关开启时玩家只能移动到目标格子区域ID在允许列表中的位置；无法移动时角色仍会转向该方向。</sub></details>
- [Huanaiyka_RandomBalloon.js](Huanaiyka_RandomBalloon.js)
  <details><summary><sub>说明</sub></summary><sub>在指定范围内随机显示气泡。在玩家/当前事件/指定事件上随机显示气泡，编号范围可在插件参数中自定义，也支持插件指令动态修改。</sub></details>
- [Huanaiyka_SetMoveLoop.js](Huanaiyka_SetMoveLoop.js)
  <details><summary><sub>说明</sub></summary><sub>事件踏步/行走动画改为重头循环。在事件备注栏或任意页面备注栏写入 `<PatternMode: restart>` 启用循环动画（0,1,2,0,1,2...）。</sub></details>
- [Huanaiyka_TapToTurn.js](Huanaiyka_TapToTurn.js)
  <details><summary><sub>说明</sub></summary><sub>轻点方向键转向。轻点方向键仅转向，长按超过阈值后才连续移动；按下跳过按键（如 Shift）时临时恢复原版立即移动行为。</sub></details>
- [Huanaiyka_VisibleDistance.js](Huanaiyka_VisibleDistance.js)
  <details><summary><sub>说明</sub></summary><sub>事件距离隐形。事件在玩家离开指定距离后自动隐藏（透明度变为0），靠近后自动显示，支持同一组事件联动显示。</sub></details>

### 界面与菜单

- [Huanaiyka_FaceImageSwitcher.js](Huanaiyka_FaceImageSwitcher.js)
  <details><summary><sub>说明</sub></summary><sub>开关控制头像文件替换。当指定的一组开关满足条件时，将整个头像文件替换为另一个文件。</sub></details>
- [Huanaiyka_MenuHideOptions.js](Huanaiyka_MenuHideOptions.js)
  <details><summary><sub>说明</sub></summary><sub>隐藏主菜单中的“选项”命令。游戏中按 ESC 打开的菜单不显示“选项”按钮，但标题画面的“选项”完好保留。</sub></details>
- [Huanaiyka_MenuListCursorPlus.js](Huanaiyka_MenuListCursorPlus.js)
  <details><summary><sub>说明</sub></summary><sub>菜单列表光标循环 + 长按加速。顶部按“上”跳到底部，底部按“下”跳到顶部；按住上/下键超过设定时间后光标移动速度自动加快。</sub></details>
- [Huanaiyka_NumberInputCancel.js](Huanaiyka_NumberInputCancel.js)
  <details><summary><sub>说明</sub></summary><sub>数值输入处理可按取消键退出。执行“数值输入的处理”时按取消键立刻结束输入，并将指定变量设置为 -1。</sub></details>
- [Huanaiyka_SaveNope.js](Huanaiyka_SaveNope.js)
  <details><summary><sub>说明</sub></summary><sub>禁用存档并显示文字。在指定地图或条件下，点击菜单“存档”按钮时不会进入存档界面，而是弹出自定义文字提示窗口。</sub></details>
- [Huanaiyka_ScreenZoom.js](Huanaiyka_ScreenZoom.js) <sub>（原作者：神無月サスケ）</sub>
  <details><summary><sub>说明</sub></summary><sub>临时将画面以指定事件（或玩家）为中心进行缩放。支持快捷键循环缩放（100%→200%→400%）、缩放时方向键移动相机、场景切换后自动恢复缩放倍率。</sub></details>

### 音频与画面

- [Huanaiyka_PixelNearestFilter.js](Huanaiyka_PixelNearestFilter.js)
  <details><summary><sub>说明</sub></summary><sub>像素点过滤增强。强制所有角色图片使用“点过滤”渲染模式，防止线性过滤导致的像素混合，解决角色边缘杂色问题。</sub></details>
- [Huanaiyka_SeFader.js](Huanaiyka_SeFader.js)
  <details><summary><sub>说明</sub></summary><sub>为SE提供淡入淡出。为音效添加平滑的淡入与淡出功能，专为长音效（背景环境声、脚步声循环、持续警报等）优化。</sub></details>

### 系统与数据

- [Huanaiyka_PerSave_for_TorigoyaMZ_Achievement2.js](Huanaiyka_PerSave_for_TorigoyaMZ_Achievement2.js)
  <details><summary><sub>说明</sub></summary><sub>成就数据绑定到存档补丁。使 TorigoyaMZ_Achievement2 的成就数据随每个游戏存档独立保存，必须放在原插件之后。</sub></details>
- [Huanaiyka_TempParty.js](Huanaiyka_TempParty.js)
  <details><summary><sub>说明</sub></summary><sub>临时队伍与道具切换插件。进入特殊副本、剧情事件或临时挑战时保存当前队伍结构和背包道具并切换为临时队伍或清空背包，离开时可通过指令一键还原。</sub></details>
- [Huanaiyka_UniqueRandomDraw.js](Huanaiyka_UniqueRandomDraw.js)
  <details><summary><sub>说明</sub></summary><sub>无放回随机抽取池到变量。从指定池子中无放回随机抽取一个元素（数字或文字均可），抽完可按设定自动重置或返回 0，多池独立状态，可存盘。</sub></details>
- [Huanaiyka_WeightedRandom.js](Huanaiyka_WeightedRandom.js)
  <details><summary><sub>说明</sub></summary><sub>基于权重的随机数选择。例如选项 A 权重 1、B 权重 2、C 权重 5，则 C 被选中的概率是 A 的 5 倍，B 是 A 的 2 倍。</sub></details>
