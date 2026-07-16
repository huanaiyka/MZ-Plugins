//=============================================================================
// Huanaiyka_SeFader.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 为SE提供平滑的淡入淡出
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help 
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件通过平滑控制音量，为 SE 音效提供淡入与淡出功能。
 * 
============================================================================
 * 脚本调用
 * ============================================================================
 * $gameSystem.fadeInSe(name, volume, frames, pitch, pan);
 * $gameSystem.fadeOutSe(frames);
 * ============================================================================
 * 
 * @command FadeInSE
 * @text 淡入播放 SE
 * @desc 以淡入方式播放指定的音效（SE）。
 * 
 * @arg name
 * @text 音效名称
 * @desc audio/se 文件夹下的文件名。
 * @type file
 * @dir audio/se
 * @default ""
 * 
 * @arg volume
 * @text 音量
 * @desc 0～100。
 * @type number
 * @default 100
 * 
 * @arg frames
 * @text 淡入帧数
 * @desc 完成淡入所需的帧数（60帧≈1秒）。
 * @type number
 * @default 30
 * 
 * @arg pitch
 * @text 音调
 * @desc 50～200，100 为原调。
 * @type number
 * @default 100
 * 
 * @arg pan
 * @text 声像
 * @desc -100（左）～100（右），0 为中央。
 * @type number
 * @default 0
 * 
 * @command FadeOutSE
 * @text 淡出所有 SE
 * @desc 让当前正在播放的所有音效淡出并停止。
 * 
 * @arg frames
 * @text 淡出帧数
 * @desc 完成淡出所需的帧数（60帧≈1秒）。
 * @type number
 * @default 60
 */

(function() {
    'use strict';

    const pluginName = 'Huanaiyka_SeFader';

    // 存放当前正在淡入淡出的 SE 辅助对象
    let activeFadingSes = [];

    // 更新音量的核心逻辑
    const updateFaders = function() {
        for (let i = activeFadingSes.length - 1; i >= 0; i--) {
            const fader = activeFadingSes[i];
            const buffer = fader.buffer;

            // 如果 buffer 已经被销毁或停止播放，则移出队列
            if (!buffer || !buffer.isPlaying()) {
                activeFadingSes.splice(i, 1);
                continue;
            }

            if (fader.mode === 'in') {
                fader.currentFrame++;
                const progress = Math.min(1, fader.currentFrame / fader.targetFrames);
                buffer.volume = (fader.startVolume + (fader.targetVolume - fader.startVolume) * progress) / 100;
                if (fader.currentFrame >= fader.targetFrames) {
                    activeFadingSes.splice(i, 1);
                }
            } else if (fader.mode === 'out') {
                fader.currentFrame++;
                const progress = Math.min(1, fader.currentFrame / fader.targetFrames);
                buffer.volume = (fader.startVolume * (1 - progress)) / 100;
                if (fader.currentFrame >= fader.targetFrames) {
                    buffer.stop();
                    activeFadingSes.splice(i, 1);
                }
            }
        }
    };

    // 挂载到场景更新中，安全可靠，不使用全局 requestAnimationFrame
    const _Scene_Base_update = Scene_Base.prototype.update;
    Scene_Base.prototype.update = function() {
        _Scene_Base_update.call(this);
        updateFaders();
    };

    // --- 核心方法实现 ---
    
    // 淡入播放 SE
    const fadeInSe = function(name, volume, frames, pitch = 100, pan = 0) {
        if (!name) return;
        const se = { name: name, volume: volume, pitch: pitch, pan: pan };
        
        // 使用原生方法播放并获取 WebAudio 实例
        const buffer = AudioManager.createBuffer('se', name);
        if (buffer) {
            buffer.volume = 0; // 从 0 开始淡入
            buffer.pitch = (pitch || 100) / 100;
            buffer.pan = (pan || 0) / 100;
            buffer.play(false);

            // 记录到淡入列表
            activeFadingSes.push({
                buffer: buffer,
                mode: 'in',
                startVolume: 0,
                targetVolume: volume,
                currentFrame: 0,
                targetFrames: Math.max(1, frames)
            });

            // 顺手丢进原生的静态缓冲池，防止被垃圾回收
            AudioManager._seBuffers.push(buffer);
            AudioManager.cleanupSe();
        }
    };

    // 淡出当前所有正在播放的 SE
    const fadeOutSe = function(frames) {
        const targetFrames = Math.max(1, frames);

        // 1. 先把当前记录在淡入状态的 SE 转为淡出
        activeFadingSes.forEach(fader => {
            fader.mode = 'out';
            fader.startVolume = (fader.buffer.volume || 0) * 100;
            fader.currentFrame = 0;
            fader.targetFrames = targetFrames;
        });

        // 2. 找到原生 AudioManager 里正在播放但没被我们记录的 SE，也丢进淡出队列
        AudioManager._seBuffers.forEach(buffer => {
            if (buffer && buffer.isPlaying()) {
                const isAlreadyFading = activeFadingSes.some(fader => fader.buffer === buffer);
                if (!isAlreadyFading) {
                    activeFadingSes.push({
                        buffer: buffer,
                        mode: 'out',
                        startVolume: (buffer.volume || 0) * 100,
                        currentFrame: 0,
                        targetFrames: targetFrames
                    });
                }
            }
        });
    };

    // --- 注册 API 到 Game_System 方便脚本调用 ---
    Game_System.prototype.fadeInSe = function(name, vol, frames, pitch = 100, pan = 0) {
        fadeInSe(name, vol, frames, pitch, pan);
    };

    Game_System.prototype.fadeOutSe = function(frames) {
        fadeOutSe(frames);
    };

    // --- 注册插件命令 ---
    PluginManager.registerCommand(pluginName, "FadeInSE", args => {
        const name = args.name;
        const volume = parseInt(args.volume, 10) || 100;
        const frames = parseInt(args.frames, 10) || 30;
        const pitch = parseInt(args.pitch, 10) || 100;
        const pan = parseInt(args.pan, 10) || 0;
        fadeInSe(name, volume, frames, pitch, pan);
    });

    PluginManager.registerCommand(pluginName, "FadeOutSE", args => {
        const frames = parseInt(args.frames, 10) || 60;
        fadeOutSe(frames);
    });

})();