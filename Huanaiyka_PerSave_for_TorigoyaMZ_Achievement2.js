/*:
 * @target MZ
 * @plugindesc 成就数据绑定到存档补丁
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 使 TorigoyaMZ_Achievement2 的成就数据不再跨存档，
 * 而是随每个游戏存档独立保存。
 * 此补丁必须放在原插件 TorigoyaMZ_Achievement2.js 之后。
 */

(function() {
    const manager = Torigoya.Achievement2.Manager;
    const DATA_KEY = 'achievementData';   // 保存在存档内的键名

    // 1. 禁用原插件的全局存储（save 无操作）
    const originalSave = manager.save;
    manager.save = function() {
        // 数据已通过 DataManager 保存，此处不再额外存储
        return Promise.resolve();
    };

    // 2. 清空已从全局存储加载的数据（避免残留）
    manager.resetData();

    // 3. 在存档保存时写入成就数据
    const _DataManager_makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        const contents = _DataManager_makeSaveContents.call(this);
        contents[DATA_KEY] = manager.createSaveContents();
        return contents;
    };

    // 4. 在读取存档时恢复成就数据
    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        const data = contents[DATA_KEY];
        if (data) {
            manager.extractSaveContents(data);
        } else {
            manager.resetData(); // 新游戏或无数据则清空
        }
    };

    // 5. 新游戏开始时（无存档数据）自动清空成就
    const _DataManager_createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        _DataManager_createGameObjects.call(this);
        manager.resetData();
    };
})();