/*:
 * @target MZ
 * @plugindesc 点数商店 使用变量代替默认货币购买物品
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件可以让商店不再消耗金币，而是消耗指定的变量值（点数）。
 * 适合用于积分兑换、代币商店、活动货币等场景。
 * 只需开启对应开关，默认商店的金币显示和支付逻辑会自动切换为点数模式。
 * ============================================================================
 * 使用说明
 * ============================================================================
 * 1. 在插件参数中设置好对应的"点数商店开关"和"点数变量"。
 * 2. 在事件中设置商店前：
 *    - 执行"开关操作"：将对应开关设置为 ON。
 *    - 执行"商店处理"：选择商品。
 *    - 执行"开关操作"：将对应开关设置为 OFF（非常重要，防止影响其它商店）。
 * 
 * 本插件会拦截金币相关的显示和支付逻辑，将其重定向到指定的变量。
 * 
 * @param PointSwitchId
 * @text 点数商店开关ID
 * @type switch
 * @default 1
 * @desc 当此开关开启时，商店将作为点数商店运行。
 * 
 * @param PointVarId
 * @text 点数变量ID
 * @type variable
 * @default 1
 * @desc 用于存储点数的变量ID。
 * 
 * @param CurrencyName
 * @text 货币单位名称
 * @type string
 * @default 点数
 * @desc 在商店窗口中显示的货币单位名称。
 * 
 * @param AllowSell
 * @text 是否允许卖出
 * @type boolean
 * @default false
 * @desc 是否允许卖出物品。设置为 OFF (false) 时，商店禁用出售，且在商品列表按取消键直接退出商店。
 */

(() => {
    const pluginName = 'Huanaiyka_PointShop';
    const parameters = PluginManager.parameters(pluginName);
    const pointSwitch = Number(parameters['PointSwitchId'] || 1);
    const pointVar = Number(parameters['PointVarId'] || 1);
    const currencyName = String(parameters['CurrencyName'] || '点数');
    const allowSell = parameters['AllowSell'] === 'true';

    // 1. 修改金钱窗口显示的数值
    const _Window_Gold_value = Window_Gold.prototype.value;
    Window_Gold.prototype.value = function() {
        if ($gameSwitches.value(pointSwitch)) {
            return $gameVariables.value(pointVar);
        }
        return _Window_Gold_value.call(this);
    };

    // 2. 修改金钱窗口显示的货币单位名称
    const _Window_Gold_currencyUnit = Window_Gold.prototype.currencyUnit;
    Window_Gold.prototype.currencyUnit = function() {
        if ($gameSwitches.value(pointSwitch)) {
            return currencyName;
        }
        return _Window_Gold_currencyUnit.call(this);
    };

    // 3. 拦截并重定向支付/获得逻辑
    const _Game_Party_gainGold = Game_Party.prototype.gainGold;
    Game_Party.prototype.gainGold = function(amount) {
        if ($gameSwitches.value(pointSwitch)) {
            // 如果处于点数商店模式，改变变量
            const currentPoints = $gameVariables.value(pointVar);
            const newPoints = Math.max(0, currentPoints + amount); // 限制不低于0
            $gameVariables.setValue(pointVar, newPoints);
        } else {
            _Game_Party_gainGold.call(this, amount);
        }
    };

    // 4. 确保商店购买逻辑判断读取的是变量而非金钱
    const _Game_Party_gold = Game_Party.prototype.gold;
    Game_Party.prototype.gold = function() {
        if ($gameSwitches.value(pointSwitch)) {
            return $gameVariables.value(pointVar);
        }
        return _Game_Party_gold.call(this);
    };

    // 5. 优化：控制点数商店的出售选项（与 MZ 原生禁用逻辑一致）
    const _Window_ShopCommand_makeCommandList = Window_ShopCommand.prototype.makeCommandList;
    Window_ShopCommand.prototype.makeCommandList = function() {
        if ($gameSwitches.value(pointSwitch) && !allowSell) {
            // 当启用点数商店且不允许卖出时，强制将出售选项的 enabled 状态设为 false
            this.addCommand(TextManager.buy, "buy");
            this.addCommand(TextManager.sell, "sell", false); // 第三个参数为 false 即禁用该选项
            this.addCommand(TextManager.cancel, "cancel");
        } else {
            _Window_ShopCommand_makeCommandList.call(this);
        }
    };

    // 6. 新增：在点数商店禁用出售时，在购买界面按取消键直接退出商店
    const _Scene_Shop_onBuyCancel = Scene_Shop.prototype.onBuyCancel;
    Scene_Shop.prototype.onBuyCancel = function() {
        if ($gameSwitches.value(pointSwitch) && !allowSell) {
            this._buyWindow.deselect();
            this._statusWindow.setItem(null);
            this._helpWindow.clear();
            SoundManager.playCancel();
            this.popScene(); // 直接退出商店场景
        } else {
            _Scene_Shop_onBuyCancel.call(this);
        }
    };

})();