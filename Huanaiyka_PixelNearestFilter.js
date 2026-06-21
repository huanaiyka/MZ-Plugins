/*:
 * @target MZ
 * @plugindesc 强制角色图片使用点过滤，避免边缘杂色
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help
 * 本插件通过强制所有角色图片使用“点过滤”渲染模式，
 * 防止线性过滤导致的像素混合，从而彻底解决角色边缘的杂色问题。
 *
 * ▸ 具体效果：
 *   • 像素图的边缘不再模糊，而是保持清晰的像素块。
 *   • 人物行走图的头顶不会再露出相邻图片中另一个角色的脚底。
 *
 * 该插件对通过 Bitmap.load 加载的所有图片生效，包括行走图、脸图、图标等。
 * 无需任何额外设置，直接使用即可。
 */

(function() {
    // 在 Bitmap 加载完成后，修改其 _baseTexture 的 scaleMode
    const _Bitmap_load = Bitmap.load;
    Bitmap.load = function(url) {
        const bitmap = _Bitmap_load.call(this, url);
        bitmap.addLoadListener(function(loadedBitmap) {
            if (loadedBitmap.isReady() && loadedBitmap._baseTexture) {
                loadedBitmap._baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            }
        });
        return bitmap;
    };
})();