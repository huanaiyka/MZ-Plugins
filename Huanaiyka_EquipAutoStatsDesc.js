//=============================================================================
// Huanaiyka_EquipAutoStatsDesc.js
// ----------------------------------------------------------------------------
// (C)2021 GEMINI
// (C)2026 幻爱（DeepSeek）
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 在装备说明文末尾自动加上能力值增减
 * @base PluginCommonBase
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @author 幻爱（原作者：GMN）
 *
 * @help
 * ============================================================================
 * 功能说明
 * ============================================================================
 * 在装备的说明文字中自动显示该装备带来的能力值增减效果。
 * 修改说明：相比原版增加了显示场景、描述位置、参数名与数值独立颜色及正负自动染色等自定义功能。
 *
 * 你可以自由控制：
 *   • 在哪些场景显示（所有场景 / 仅商店购买界面）
 *   • 能力值描述放在原始说明文的前面还是后面
 *   • 放在后面时，是否换行
 *   • 能力值描述中参数名和数值的独立颜色
 *   • 是否将格式字符（方括号、空格、分隔符等）也染成参数名颜色
 *   • 是否根据正负号自动将数值染成蓝色（正）或红色（负）
 *
============================================================================
 * 与原版 GMN_DescriptionWithFomula 的区别
 * ============================================================================
 * 本插件在原版基础上增强了可定制性，主要改进：
 *   • 显示场景：可选择仅商店显示或全部场景显示
 *   • 描述位置：可放在前面或后面，且后面可换行/不换行
 *   • 颜色控制：参数名、数值均可单独设置颜色，且支持正负自动染色
 *   • 格式字符染色：可选择是否将括号、空格等也染成参数名颜色
 *   • 默认风格更简洁（格式默认 "%1 %2" ，分隔符默认为空）
 *  
============================================================================
 * 注意事项
 * ============================================================================
 * • 本插件依赖 PluginCommonBase.js，必须放在它下面。
 * • 如果装备没有任何能力值增减，则不会添加任何额外文字。
 *
 * @param displayScene
 * @type select
 * @option 所有场景
 * @value all
 * @option 仅商店场景
 * @value shopOnly
 * @text 显示场景
 * @desc 选择在哪些场景中显示能力值增减信息。
 * @default all
 *
 * @param descriptionPosition
 * @type select
 * @option 放在前面
 * @value before
 * @option 放在后面(换行)
 * @value after
 * @option 放在后面(不换行)
 * @value afterInline
 * @text 描述位置
 * @desc 能力值描述放在原始说明文的前面，还是后面（可以换行或不换行）。
 * @default before
 *
 * @param format
 * @type string
 * @default %1 %2
 * @text 能力值格式
 * @desc 每个能力值的显示格式，%1=参数名，%2=数值。建议使用简单格式。
 *
 * @param separeator
 * @type string
 * @default 
 * @text 多能力值分隔符
 * @desc 当装备有多个能力值增减时，用此符号连接（可留空或加空格）。
 *
 * @param plusSign
 * @type string
 * @default +
 * @text 增加符号
 * @desc 能力值增加时，数值前面显示的符号。
 *
 * @param minusSign
 * @type string
 * @default -
 * @text 减少符号
 * @desc 能力值减少时，数值前面显示的符号。
 *
 * @param paramName
 * @type string[]
 * @default ["最大HP","最大MP","攻击力","防御力","魔法力","魔法防御","敏捷性","运气"]
 * @text 参数名称
 * @desc 8项基本能力在说明文中显示的名字，从左到右依次对应：最大HP、最大MP、攻击力、防御力、魔法力、魔法防御、敏捷性、运气。
 *
 * @param paramNameColor
 * @type number
 * @min 0
 * @max 31
 * @default 0
 * @text 参数名颜色
 * @desc 参数名称的颜色索引（0=白色，3=红色，4=绿色，5=蓝色，6=黄色，31=黑色等）。
 *
 * @param paramValueColor
 * @type number
 * @min 0
 * @max 31
 * @default 0
 * @text 数值颜色
 * @desc 能力数值的统一颜色索引，仅在【根据正负自动染色数值】关闭时生效。
 *
 * @param colorizeFormatChars
 * @type boolean
 * @on 是
 * @off 否
 * @default true
 * @text 染色格式字符
 * @desc 是否将格式字符串中的方括号、空格、分隔符等也染成参数名颜色。
 *
 * @param autoColorBySign
 * @type boolean
 * @on 是
 * @off 否
 * @default true
 * @text 根据正负自动染色数值
 * @desc 开启后正数使用【正数颜色】，负数使用【负数颜色】；关闭后使用统一的【数值颜色】。
 *
 * @param positiveValueColor
 * @type number
 * @min 0
 * @max 31
 * @default 5
 * @text 正数颜色
 * @desc 正数值的颜色索引（默认5=蓝色）。
 *
 * @param negativeValueColor
 * @type number
 * @min 0
 * @max 31
 * @default 3
 * @text 负数颜色
 * @desc 负数值的颜色索引（默认3=红色）。
 */
"use strict";
{
  const script = document.currentScript;
  const param = PluginManagerEx.createParameter(script);
  const formatTemplate = param.format;
  const statuses = param.paramName;
  const paramNameColor = param.paramNameColor;
  const paramValueColor = param.paramValueColor;
  const colorizeFormatChars = param.colorizeFormatChars;
  const autoColorBySign = param.autoColorBySign;
  const positiveColor = param.positiveValueColor;
  const negativeColor = param.negativeValueColor;
  const separator = param.separeator || "";
  const plusSign = param.plusSign;
  const minusSign = param.minusSign;

  const colorCode = (idx) => `\\C[${idx}]`;
  const colorReset = () => `\\C[0]`;

  const getParamDescription = (item) => {
    if (!item || !item.etypeId) return "";
    const descriptions = [];

    for (let i = 0; i < statuses.length; i++) {
      const val = item.params[i];
      if (val === 0) continue;

      let signedVal;
      if (val > 0) signedVal = plusSign + val;
      else signedVal = minusSign + Math.abs(val);

      let valueColorIdx;
      if (autoColorBySign) {
        valueColorIdx = (val > 0) ? positiveColor : negativeColor;
      } else {
        valueColorIdx = paramValueColor;
      }

      let formatted;
      if (colorizeFormatChars) {
        // 模式：整个条目使用参数名颜色，数值部分单独染色并恢复为参数名颜色
        const paramNameRaw = statuses[i];
        const coloredValuePart = `${colorCode(valueColorIdx)}${signedVal}${colorCode(paramNameColor)}`;
        let entry = formatTemplate.replace(/%1/g, paramNameRaw);
        entry = entry.replace(/%2/g, coloredValuePart);
        formatted = `${colorCode(paramNameColor)}${entry}${colorReset()}`;
      } else {
        // 原逻辑：参数名和数值各自独立染色并重置
        const coloredParamName = `${colorCode(paramNameColor)}${statuses[i]}${colorReset()}`;
        const coloredValue = `${colorCode(valueColorIdx)}${signedVal}${colorReset()}`;
        let entry = formatTemplate.replace(/%1/g, coloredParamName);
        entry = entry.replace(/%2/g, coloredValue);
        formatted = entry;
      }

      descriptions.push(formatted);
    }

    const txt = descriptions.join(separator);
    if (!txt) return "";
    return txt;
  };

  const shouldDisplay = () => {
    if (param.displayScene === "all") return true;
    if (param.displayScene === "shopOnly") {
      return SceneManager._scene instanceof Scene_Shop;
    }
    return false;
  };

  const buildHelpText = (item) => {
    if (!item) return "";
    const originalDesc = item.description || "";
    const paramDesc = getParamDescription(item);
    if (!paramDesc) return originalDesc;
    if (!shouldDisplay()) return originalDesc;

    const pos = param.descriptionPosition;
    if (pos === "before") {
      return paramDesc + "\n" + originalDesc;
    } else if (pos === "after") {
      return originalDesc + "\n" + paramDesc;
    } else {
      return originalDesc + paramDesc;
    }
  };

  Window_Help.prototype.setItem = function (item) {
    this.setText(buildHelpText(item));
  };
}