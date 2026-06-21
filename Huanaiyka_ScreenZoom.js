// DarkPlasma_EquipDetail
// Copyright (c) 2021 神無月サスケ
// Copyright (c) 2026 幻爱
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php
//=============================================================================
// 插件名称: ScreenZoom.js (RPG Maker MZ)
//=============================================================================
// [更新历史]
// Ver1.0.0 首次发布
// Ver1.1.0 场景切换后返回地图时，恢复缩放倍率
// Ver1.1.1 错误修复：屏幕淡出时图片显示异常
// Ver1.2.0 新增：快捷键循环缩放（默认 Q）、鼠标点击修正
// Ver1.3.0 新增：缩放状态下方向键移动相机，并允许超出地图边缘
// Ver1.3.1 修改：只有按 Q 进入缩放时，才启用方向键移动相机和鼠标修正
// Ver1.3.2 新增：恢复 100% 缩放时强制将玩家置于屏幕中央
// Ver1.3.3 修改：快捷键循环缩放取消 50% 档位，顺序改为 100% → 200% → 400% → 100%
// Ver1.3.4 修复：缩放时方向键移动相机无法到达地图最边缘的问题
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 屏幕缩放与相机移动
 * @author 幻爱（原作者：神無月サスケ）
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @param shortcutKeyCode
 * @text 快捷键代码
 * @desc 循环缩放的按键代码（默认81 = Q键）
 * @type number
 * @default 81
 *
 * @param cyclePictureZoom
 * @text 循环时也缩放图片？
 * @desc 使用快捷键循环缩放时，是否一同缩放图片
 * @type boolean
 * @default false
 *
 * @param cycleCenter
 * @text 循环中心点
 * @desc 缩放循环的中心：0=玩家，1=当前事件
 * @type select
 * @option 玩家
 * @value 0
 * @option 当前事件
 * @value 1
 * @default 0
 *
 * @param enableCameraMove
 * @text 缩放时方向键移动相机
 * @desc 是否在缩放状态下用方向键移动画面（不移动角色）
 * @type boolean
 * @default true
 *
 * @param cameraMoveSpeed
 * @text 相机移动速度（像素/帧）
 * @desc 缩放时方向键移动画面的速度，建议 5~20
 * @type number
 * @min 1
 * @max 50
 * @default 8
 *
 * @command set
 * @text 设置缩放
 * @desc 开始缩放画面
 *
 * @arg EventId
 * @text 中心事件ID
 * @desc -1表示玩家，0表示当前事件
 * @type number
 * @min -1
 * @default -1
 *
 * @arg OffsetX
 * @text X偏移
 * @desc 中心点X轴偏移像素量
 * @type number
 * @min -9999
 * @default 0
 *
 * @arg OffsetY
 * @text Y偏移
 * @desc 中心点Y轴偏移像素量
 * @type number
 * @min -9999
 * @default 0
 *
 * @arg scale
 * @text 缩放倍率
 * @desc 可设置小数点后两位
 * @decimals 2
 * @type number
 * @min 1.00
 * @default 1.00
 *
 * @arg FramesToZoom
 * @text 缩放帧数
 * @desc 完成缩放所需的帧数，设为1则立即缩放
 * @type number
 * @default 1
 *
 * @arg isPictureZoom
 * @text 同时缩放图片？
 * @desc 是否将图片一同缩放
 * @on 是
 * @off 否
 * @type boolean
 * @default false
 *
 * @command Zoom200
 * @text 200%缩放
 * @desc 自定义：立即显示并完成缩放
 *
 * @arg EventId
 * @text 中心事件ID
 * @desc -1表示玩家，0表示当前事件
 * @type number
 * @min -1
 * @default -1
 *
 * @arg isPictureZoom
 * @text 同时缩放图片？
 * @desc 是否将图片一同缩放
 * @on 是
 * @off 否
 * @type boolean
 * @default false
 *
 * @command Zoom300
 * @text 300%缩放
 * @desc 自定义：立即显示并完成缩放
 *
 * @arg EventId
 * @text 中心事件ID
 * @desc -1表示玩家，0表示当前事件
 * @type number
 * @min -1
 * @default -1
 *
 * @arg isPictureZoom
 * @text 同时缩放图片？
 * @desc 是否将图片一同缩放
 * @on 是
 * @off 否
 * @type boolean
 * @default false
 *
 * @command reset
 * @text 重置缩放
 * @desc 立即重置缩放
 *
 * @help 
 * 
 * 临时将画面以指定事件（或玩家）为中心进行缩放。
 * 该插件基于【神無月サスケ】制作的SreenZoom插件，修改制作而成。
 * 非常感谢原作者的贡献。
 * 
 * 主要功能：
 * - 通过插件命令设置缩放倍率、中心点、偏移、缩放帧数，可选择是否同时缩放图片。
 * - 快捷键 Q 循环缩放：100% → 200% → 400% → 100%。
 * - 缩放状态下方向键可在不移动角色的情况下移动相机。
 * - 可配合插件DarkPlasma_ScreenshotGallery来制作更好的屏幕截图。
 *
 * [许可证]
 * MIT License
 * http://opensource.org/licenses/mit-license.php
 */

/*:ja
 * @target MZ
 * @plugindesc 画面ズームとカメラ移動
 * @author 幻爱（原作者：神無月サスケ）
 * @url https://github.com/huanaiyka/MZ-Plugins
 *
 * @param shortcutKeyCode
 * @text ショートカットキーコード
 * @desc ズーム切り替えキー（デフォルト81 = Q）
 * @type number
 * @default 81
 *
 * @param cyclePictureZoom
 * @text ピクチャもズームする
 * @desc ショートカットでズーム切り替え時にピクチャもズームするか
 * @type boolean
 * @default false
 *
 * @param cycleCenter
 * @text 切り替え時の中心
 * @desc ズーム中心：0=プレイヤー、1=現在のイベント
 * @type select
 * @option プレイヤー
 * @value 0
 * @option 現在のイベント
 * @value 1
 * @default 0
 *
 * @param enableCameraMove
 * @text ズーム中カメラ移動
 * @desc ズーム中に方向キーでカメラ移動を有効にする
 * @type boolean
 * @default true
 *
 * @param cameraMoveSpeed
 * @text カメラ移動速度(px/フレーム)
 * @desc ズーム中のカメラ移動速度
 * @type number
 * @min 1
 * @max 50
 * @default 8
 *
 * @command set
 * @text ズーム開始
 * @desc 指定された中心点および倍率でズームします
 *
 * @arg EventId
 * @text 中心点イベントID
 * @desc プレイヤーの時は-1に、現在のイベントの時は0に
 * @type number
 * @min -1
 * @default -1
 *
 * @arg OffsetX
 * @text オフセットX
 * @desc 中心点よりずらすX座標
 * @type number
 * @min -9999
 * @default 0
 *
 * @arg OffsetY
 * @text オフセットY
 * @desc 中心点よりずらすY座標
 * @type number
 * @min -9999
 * @default 0
 *
 * @arg scale
 * @text ズーム倍率
 * @desc 小数点2桁まで指定可能です。
 * @type number
 * @default 1.00
 * @min 1.00
 *
 * @arg FramesToZoom
 * @text フレーム数
 * @desc ズームにかかるフレーム数
 * 即座にズームさせるときは1に。
 * @type number
 * @default 1
 * 
 * @arg isPictureZoom
 * @text ピクチャもズームする？
 * @desc falseの時は、ピクチャをズームしません。
 * @on する
 * @off しない
 * @type boolean
 * @default false
 *
 * @command reset
 * @text ズーム終了
 * @desc 拡大を中止し、元の画面に戻す
 * 
 * @command Zoom200
 * @text 200%拡大
 * @desc カスタム。即ズーム表示
 *
 * @arg EventId
 * @text 中心点イベントID
 * @desc プレイヤーの時は-1に、現在のイベントの時は0に
 * @type number
 * @min -1
 * @default -1
 *
 * @arg isPictureZoom
 * @text ピクチャもズームする？
 * @desc falseの時は、ピクチャをズームしません。
 * @on する
 * @off しない
 * @type boolean
 * @default false
 *
 * @command Zoom300
 * @text 300%拡大
 * @desc カスタム。即ズーム表示
 *
 * @arg EventId
 * @text 中心点イベントID
 * @desc プレイヤーの時は-1に、現在のイベントの時は0に
 * @type number
 * @min -1
 * @default -1
 *
 * @arg isPictureZoom
 * @text ピクチャもズームする？
 * @desc falseの時は、ピクチャをズームしません。
 * @on する
 * @off しない
 * @type boolean
 * @default false
 *
 * @help
 * 指定されたイベント（またはプレイヤー）を中心に画面を一時的に拡大します。
 * このプラグインは【神無月サスケ】氏のSreenZoomプラグインを基に、改変・制作されました。
 * 原作者の貢献に深く感謝いたします。
 *
 * 主な機能：
 * - プラグインコマンドで拡大率、中心点、オフセット、フレーム数を設定し、ピクチャも同時に拡大するか選択可能。
 * - ショートカットキー Q で循環拡大：100% → 200% → 400% → 100%。
 * - 拡大中、方向キーでキャラクターを移動させずにカメラを移動できます。
 * - プラグイン「DarkPlasma_ScreenshotGallery」と連携して、より良いスクリーンショットが作成可能です。
 *
 * [ライセンス]
 * MIT License
 * http://opensource.org/licenses/mit-license.php
 */

(() => {
  const pluginName = 'Huanaiyka_ScreenZoom';

  // 读取插件参数
  const params = PluginManager.parameters(pluginName);
  const shortcutKeyCode = Number(params['shortcutKeyCode'] || 81);
  const cyclePictureZoom = params['cyclePictureZoom'] === 'true';
  const cycleCenter = Number(params['cycleCenter'] || 0);
  const enableCameraMove = params['enableCameraMove'] !== 'false';
  const cameraMoveSpeed = Number(params['cameraMoveSpeed'] || 8);

  // 强制将玩家置于屏幕中央（仅当缩放倍率为 1 时有效）
  const centerOnPlayer = () => {
    if (!$gamePlayer || !$gameMap) return;
    const tileW = $gameMap.tileWidth();
    const tileH = $gameMap.tileHeight();
    const screenCenterX = Graphics.width / 2;
    const screenCenterY = Graphics.height / 2;
    const playerScreenX = $gamePlayer.screenX();
    const playerScreenY = $gamePlayer.screenY();
    const deltaX = playerScreenX - screenCenterX;
    const deltaY = playerScreenY - screenCenterY;
    if (deltaX !== 0 || deltaY !== 0) {
      let newDisplayX = $gameMap.displayX() + deltaX / tileW;
      let newDisplayY = $gameMap.displayY() + deltaY / tileH;
      // 限制在地图范围内
      const maxX = $gameMap.width() - Graphics.width / tileW;
      const maxY = $gameMap.height() - Graphics.height / tileH;
      newDisplayX = Math.min(Math.max(newDisplayX, 0), maxX);
      newDisplayY = Math.min(Math.max(newDisplayY, 0), maxY);
      $gameMap.setDisplayPos(newDisplayX, newDisplayY);
    }
  };

  // 场景切换时，返回地图场景后恢复缩放倍率
  const _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    this.zoomInfo = null;
    this.zoomFromShortcut = false;   // 标记是否由快捷键 Q 触发缩放
  };

  const _Scene_Map_createDisplayObjects =
    Scene_Map.prototype.createDisplayObjects;
  Scene_Map.prototype.createDisplayObjects = function() {
    _Scene_Map_createDisplayObjects.call(this);
    setupMapZoomFirst();
  };

  const setupMapZoomFirst = () => {
    const info = $gameSystem.zoomInfo;
    if (info) {
      info.FramesToZoom = 1;
      setZoom(info);
    }
  };

  // 处理插件命令
  let currentEventId = 0;
  let _offsetX = 0;
  let _offsetY = 0;
  let container = null;

  const currentSpriteset = () => SceneManager._scene._spriteset;

  const thisEventId = () => $gameMap._interpreter.eventId();

  const xFromEventId = eventId => {
    let x;
    if (!eventId) {
      eventId = thisEventId();
    }
    if (eventId === -1) {
      x = $gamePlayer.screenX();
    } else if (eventId > 0) {
      const event = $gameMap.event(eventId);
      if (event) {
        x = event.screenX();
      }
    }
    return x;
  };

  const yFromEventId = eventId => {
    let y;
    if (!eventId) {
      eventId = thisEventId();
    }
    if (eventId === -1) {
      y = $gamePlayer.screenY();
    } else if (eventId > 0) {
      const event = $gameMap.event(eventId);
      if (event) {
        y = event.screenY();
      }
    }
    return y;
  };

  const setZoom = (args, fromShortcut = false) => {
    const eventId = +args.EventId;
    currentEventId = eventId ? eventId : thisEventId();
    const offsetX = +args.OffsetX;
    const offsetY = +args.OffsetY;
    let x = xFromEventId(eventId);
    let y = yFromEventId(eventId);
    if (x != null && y != null) {
      x += _offsetX = offsetX;
      y += _offsetY = offsetY;
      $gameScreen.startZoom(x, y, +args.scale, +args.FramesToZoom);
      if (!container && !eval(args.isPictureZoom)) {
        SceneManager._scene.undertakeSpritePicture();
      }
      $gameSystem.zoomInfo = args;
      $gameSystem.zoomFromShortcut = fromShortcut;

      // 如果目标倍率为 1（即恢复正常大小），强制将玩家置于屏幕中央
      if (Math.abs(+args.scale - 1.0) < 0.001) {
        centerOnPlayer();
      }
    }
  };

  PluginManager.registerCommand(pluginName, 'set', args => {
    setZoom(args, false);   // 插件命令触发，不启用特殊相机移动
  });

  PluginManager.registerCommand(pluginName, 'Zoom200', args => {
    const args2 = {};
    args2.EventId = +args.EventId;
    args2.isPictureZoom = args.isPictureZoom;
    args2.OffsetX = 0;
    args2.OffsetY = 0;
    args2.scale = 2;
    args2.FramesToZoom = 1;
    setZoom(args2, false);
  });

  PluginManager.registerCommand(pluginName, 'Zoom300', args => {
    const args2 = {};
    args2.EventId = +args.EventId;
    args2.isPictureZoom = args.isPictureZoom;
    args2.OffsetX = 0;
    args2.OffsetY = 0;
    args2.scale = 3;
    args2.FramesToZoom = 1;
    setZoom(args2, false);
  });

  PluginManager.registerCommand(pluginName, 'reset' , args => {
    if (currentEventId) {
      const x = xFromEventId(currentEventId);
      const y = yFromEventId(currentEventId);
      $gameScreen.startZoom(x, y, 1, 1);
      if (container) {
        SceneManager._scene.remandSpritePicture();
      }
      $gameSystem.zoomInfo = null;
    }
    currentEventId = 0;
    $gameSystem.zoomFromShortcut = false;
    centerOnPlayer();   // 重置缩放时强制居中玩家
  });

  // 图片不随画面缩放
  Scene_Map.prototype.undertakeSpritePicture = function () {
    const spriteset = currentSpriteset();
    spriteset.removePictureContainer();
    this.removeChild(this._windowLayer);
    this.addChild(container);
    this.addChild(this._windowLayer);
  };

  Scene_Map.prototype.remandSpritePicture = function () {
    const spriteset = currentSpriteset();
    this.removeChild(container);
    spriteset.addPictureContainerAgain();
  };

  Spriteset_Base.prototype.removePictureContainer = function () {
    this.removeChild(this._pictureContainer);
    container = this._pictureContainer;
  };

  Spriteset_Base.prototype.addPictureContainerAgain = function () {
     this.removeChild(this._timerSprite);
     this.addChild(this._pictureContainer);
     this.addChild(this._timerSprite);
     container = null;
  };

  const _Scene_Map_terminate = Scene_Map.prototype.terminate;
  Scene_Map.prototype.terminate = function () {
    if (container) {
      this.removeChild(container);
      container = null;
    }
    _Scene_Map_terminate.call(this);
  };

  const _Sprite_Picture_updateOther = Sprite_Picture.prototype.updateOther;
  Sprite_Picture.prototype.updateOther = function() {
    _Sprite_Picture_updateOther.call(this);
    if (container) {
      const brightness = $gameScreen.brightness();
      if (brightness < 255) {
        const opacity = this.picture().opacity();
        this.opacity = opacity * (brightness / 256);
      }
    }
  };

  // =========================================================================
  // 快捷键循环缩放（已移除 50% 档位）
  // 顺序：100% → 200% → 400% → 100%
  // =========================================================================
  Input.keyMapper[shortcutKeyCode] = 'zoomCycle';

  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    if (Input.isTriggered('zoomCycle')) {
      this.cycleZoom();
    }
  };

  Scene_Map.prototype.cycleZoom = function() {
    const currentScale = $gameScreen.zoomScale();
    const epsilon = 0.05;
    let nextScale;

    if (Math.abs(currentScale - 1.0) < epsilon) {
      nextScale = 2.0;
    } else if (Math.abs(currentScale - 2.0) < epsilon) {
      nextScale = 4.0;
    } else if (Math.abs(currentScale - 4.0) < epsilon) {
      nextScale = 1.0;    // 直接回到 100%，不再经过 50%
    } else {
      nextScale = 2.0;
    }

    if (Math.abs(nextScale - 1.0) < epsilon) {
      // 重置缩放
      if (currentEventId) {
        const x = xFromEventId(currentEventId);
        const y = yFromEventId(currentEventId);
        $gameScreen.startZoom(x, y, 1, 1);
        if (container) {
          this.remandSpritePicture();
        }
        $gameSystem.zoomInfo = null;
      }
      currentEventId = 0;
      $gameSystem.zoomFromShortcut = false;
      centerOnPlayer();   // 重置时强制居中玩家
    } else {
      let eventId = -1;
      if (cycleCenter === 1) {
        const curEventId = thisEventId();
        if (curEventId) {
          eventId = curEventId;
        }
      }
      const args = {
        EventId: eventId.toString(),
        OffsetX: "0",
        OffsetY: "0",
        scale: nextScale.toString(),
        FramesToZoom: "1",
        isPictureZoom: cyclePictureZoom ? "true" : "false"
      };
      setZoom(args, true);   // 快捷键触发，启用相机移动和鼠标修正
    }
  };

  // =========================================================================
  // 修正缩放后的鼠标点击移动（仅当由快捷键触发时生效）
  // =========================================================================
  const _Game_Map_canvasToMapX = Game_Map.prototype.canvasToMapX;
  Game_Map.prototype.canvasToMapX = function(x) {
    if ($gameSystem.zoomFromShortcut) {
      const scale = $gameScreen.zoomScale();
      if (Math.abs(scale - 1.0) > 0.001) {
        const centerX = $gameScreen.zoomX();
        const centerY = $gameScreen.zoomY();
        const logicalX = centerX + (x - centerX) / scale;
        return Math.floor((logicalX - this._displayX * this.tileWidth()) / this.tileWidth());
      }
    }
    return _Game_Map_canvasToMapX.call(this, x);
  };

  const _Game_Map_canvasToMapY = Game_Map.prototype.canvasToMapY;
  Game_Map.prototype.canvasToMapY = function(y) {
    if ($gameSystem.zoomFromShortcut) {
      const scale = $gameScreen.zoomScale();
      if (Math.abs(scale - 1.0) > 0.001) {
        const centerX = $gameScreen.zoomX();
        const centerY = $gameScreen.zoomY();
        const logicalY = centerY + (y - centerY) / scale;
        return Math.floor((logicalY - this._displayY * this.tileHeight()) / this.tileHeight());
      }
    }
    return _Game_Map_canvasToMapY.call(this, y);
  };

  // =========================================================================
  // 缩放时方向键移动相机 + 允许超出地图边缘（仅当由快捷键触发时生效）
  // =========================================================================
  const _Game_Player_moveByInput = Game_Player.prototype.moveByInput;
  Game_Player.prototype.moveByInput = function() {
    if (enableCameraMove && $gameSystem.zoomFromShortcut && Math.abs($gameScreen.zoomScale() - 1.0) > 0.001) {
      // 快捷键缩放模式下，不移动角色，由下方相机移动接管
      return;
    }
    _Game_Player_moveByInput.call(this);
  };

  // 修正：计算缩放时允许的额外偏移（格子数），使相机可以滚动到地图边缘
  function getScrollExtra() {
    const scale = $gameScreen.zoomScale();
    if (Math.abs(scale - 1.0) <= 0.001) return { extraX: 0, extraY: 0 };
    const screenWidthPx = Graphics.width;
    const screenHeightPx = Graphics.height;
    const tileW = $gameMap.tileWidth();
    const tileH = $gameMap.tileHeight();
    const normalWidthInTiles = screenWidthPx / tileW;
    const normalHeightInTiles = screenHeightPx / tileH;
    const zoomedWidthInTiles = screenWidthPx / tileW / scale;
    const zoomedHeightInTiles = screenHeightPx / tileH / scale;
    // 使用完整差值，确保边缘格子可完全进入视野
    const deltaX = normalWidthInTiles - zoomedWidthInTiles;
    const deltaY = normalHeightInTiles - zoomedHeightInTiles;
    const extraX = Math.ceil(deltaX) + 5;
    const extraY = Math.ceil(deltaY) + 5;
    return { extraX, extraY };
  }

  const _Scene_Map_updateCameraMove = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_updateCameraMove.call(this);
    if (!enableCameraMove) return;
    if (!$gameSystem.zoomFromShortcut) return;   // 只有快捷键缩放才允许移动相机
    const scale = $gameScreen.zoomScale();
    if (Math.abs(scale - 1.0) <= 0.001) return;

    let dx = 0, dy = 0;
    if (Input.isPressed('down')) dy += 1;
    if (Input.isPressed('up')) dy -= 1;
    if (Input.isPressed('right')) dx += 1;
    if (Input.isPressed('left')) dx -= 1;
    if (dx === 0 && dy === 0) return;

    const speed = cameraMoveSpeed;
    const pixelDx = dx * speed;
    const pixelDy = dy * speed;

    let newDisplayX = $gameMap.displayX() + pixelDx / $gameMap.tileWidth();
    let newDisplayY = $gameMap.displayY() + pixelDy / $gameMap.tileHeight();

    const { extraX, extraY } = getScrollExtra();
    const maxX = $gameMap.width() - Graphics.width / $gameMap.tileWidth();
    const maxY = $gameMap.height() - Graphics.height / $gameMap.tileHeight();
    const minX = -extraX;
    const minY = -extraY;
    const maxXExt = maxX + extraX;
    const maxYExt = maxY + extraY;

    newDisplayX = Math.min(Math.max(newDisplayX, minX), maxXExt);
    newDisplayY = Math.min(Math.max(newDisplayY, minY), maxYExt);
    $gameMap.setDisplayPos(newDisplayX, newDisplayY);
  };
})();