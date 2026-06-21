//=============================================================================
// Huanaiyka_SeFader.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 为SE提供淡入淡出
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * @help 
 * ============================================================================
 * 简介
 * ============================================================================
 * 本插件为音效（SE）添加平滑的淡入与淡出功能，
 * 专为长音效（背景环境声、脚步声循环、持续警报等）优化。
 * 
 * - 默认接管原生“播放 SE”指令，所有事件播放的 SE 都可淡出。
 * - 支持同时播放多个 SE，并可一次性淡出所有 SE。
 * - 自动适配 .ogg / .m4a 格式。
 * 
============================================================================
 * 脚本调用
 * ============================================================================
 * $gameSystem.fadeInSe(name, volume, frames, pitch, pan);
 * $gameSystem.fadeOutSe(frames);
 * ============================================================================
 * 注意事项
 * ============================================================================
 * - 音效文件请放在 audio/se 文件夹，支持 .ogg 或 .m4a。
 * - 淡出帧数建议 60~120（60帧≈1秒）。
 * 
 * - 该插件还未做到对 ME 的控制，仅代码中含有 ME 相关的残留。
 * ============================================================================
 * 
 * @param replaceNativeSe
 * @text 替换原生播放 SE
 * @desc 是否用插件的淡入效果替换默认的“播放 SE”指令。默认 true。
 * @type boolean
 * @default true
 * 
 * @command FadeInSE
 * @text 淡入播放 SE
 * @desc 以淡入方式播放指定的音效（SE）。
 * 
 * @arg name
 * @text 音效名称
 * @desc audio/se 文件夹下的文件名（不含扩展名）。
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
 * @desc 完成淡出所需的帧数（60帧≈1秒）。不填则默认为 60。
 * @type number
 * @default 60
 * 
 */

(function() {
    'use strict';

    const params = PluginManager.parameters('Huanaiyka_SeFader');
    const replaceNative = params['replaceNativeSe'] !== 'false';

    let audioContext = null;
    function getAudioContext() {
        if (audioContext) return audioContext;
        if (window.WebAudio && window.WebAudio._context) audioContext = window.WebAudio._context;
        else if (AudioManager && AudioManager._context) audioContext = AudioManager._context;
        return audioContext;
    }

    const extensions = ['ogg', 'm4a'];
    function loadAudio(folder, name, onSuccess, onError) {
        let idx = 0;
        function tryLoad() {
            if (idx >= extensions.length) {
                onError(`无法加载 ${folder}/${name}`);
                return;
            }
            const url = `audio/${folder}/${name}.${extensions[idx]}`;
            const req = new XMLHttpRequest();
            req.open('GET', url);
            req.responseType = 'arraybuffer';
            req.onload = () => {
                if (req.status === 200) onSuccess(req.response, url);
                else { idx++; tryLoad(); }
            };
            req.onerror = () => { idx++; tryLoad(); };
            req.send();
        }
        tryLoad();
    }

    class FadeableSe {
        constructor(name, volume, fadeInFrames, pitch, pan, onEnd) {
            this.name = name;
            this.targetVolume = Math.min(100, Math.max(0, volume));
            this.currentVolume = (fadeInFrames > 0) ? 0 : this.targetVolume;
            this.fadeInTotal = fadeInFrames;
            this.fadeInRem = fadeInFrames;
            this.fadeOutTotal = 0;
            this.fadeOutRem = 0;
            this.fadeOutStartVolume = this.currentVolume;
            this.isPlaying = true;
            this.onEnd = onEnd;
            this.gain = null;
            this.src = null;
            this.pitch = pitch / 100;
            this.pan = pan;
            this._load();
        }
        _load() {
            loadAudio('se', this.name, (data, url) => {
                const ctx = getAudioContext();
                if (!ctx) return this._stop(true);
                ctx.decodeAudioData(data, (buf) => {
                    this._play(buf, url);
                }, () => { this._stop(true); });
            }, () => { this._stop(true); });
        }
        _play(buf, url) {
            const ctx = getAudioContext();
            if (!ctx) return this._stop(true);
            this.gain = ctx.createGain();
            this.gain.gain.value = this.currentVolume / 100;
            let out = this.gain;
            if (this.pan !== 0 && ctx.createStereoPanner) {
                const panner = ctx.createStereoPanner();
                panner.pan.value = this.pan / 100;
                this.gain.connect(panner);
                out = panner;
            }
            this.src = ctx.createBufferSource();
            this.src.buffer = buf;
            this.src.playbackRate.value = this.pitch;
            this.src.connect(this.gain);
            out.connect(ctx.destination);
            this.src.start();
            this.src.onended = () => this._stop(true);
        }
        update() {
            if (!this.isPlaying) return false;
            if (this.fadeInRem > 0) {
                const progress = this.fadeInTotal - this.fadeInRem;
                this.currentVolume = this.targetVolume * progress / this.fadeInTotal;
                if (this.gain) this.gain.gain.value = this.currentVolume / 100;
                this.fadeInRem--;
                return true;
            }
            if (this.fadeOutRem > 0) {
                const step = this.fadeOutStartVolume / this.fadeOutTotal;
                this.currentVolume -= step;
                if (this.currentVolume < 0) this.currentVolume = 0;
                if (this.gain) this.gain.gain.value = this.currentVolume / 100;
                this.fadeOutRem--;
                if (this.fadeOutRem === 0) this._stop(true);
                return true;
            }
            return true;
        }
        fadeOut(frames, callback) {
            if (!this.isPlaying) return;
            if (frames <= 0) {
                this._stop(true);
                if (callback) callback();
                return;
            }
            this.fadeInRem = 0;
            this.fadeOutTotal = frames;
            this.fadeOutRem = frames;
            this.fadeOutStartVolume = this.currentVolume;
            this.onEnd = () => { this._stop(true); if (callback) callback(); };
        }
        _stop(callOnEnd) {
            if (!this.isPlaying) return;
            this.isPlaying = false;
            if (this.src) { try { this.src.stop(); } catch(e) {} this.src.disconnect(); this.src = null; }
            if (this.gain) { this.gain.disconnect(); this.gain = null; }
            if (callOnEnd && this.onEnd) this.onEnd();
        }
        isActive() { return this.isPlaying; }
    }

    // ---------- ME 类：完全参照 SE 的淡出逻辑 ----------
    class FadeableMe {
        constructor(name, volume, fadeInFrames, onEnd) {
            this.name = name;
            this.targetVolume = Math.min(100, Math.max(0, volume));
            this.currentVolume = 0;
            this.fadeInTotal = fadeInFrames;
            this.fadeInRem = fadeInFrames;
            this.fadeOutTotal = 0;
            this.fadeOutRem = 0;
            this.fadeOutStartVolume = 0;
            this.isPlaying = true;
            this.onEnd = onEnd;
            this.gain = null;
            this.src = null;
            this._originalBgm = AudioManager.saveBgm();
            AudioManager.stopBgm();
            this._load();
        }
        _load() {
            loadAudio('me', this.name, (data, url) => {
                const ctx = getAudioContext();
                if (!ctx) return this._restore();
                ctx.decodeAudioData(data, (buf) => {
                    this._play(buf, url);
                }, () => { this._restore(); });
            }, () => { this._restore(); });
        }
        _play(buf, url) {
            const ctx = getAudioContext();
            if (!ctx) return this._restore();
            this.gain = ctx.createGain();
            this.gain.gain.value = 0;
            this.src = ctx.createBufferSource();
            this.src.buffer = buf;
            this.src.connect(this.gain);
            this.gain.connect(ctx.destination);
            this.src.start();
            // 保存原始回调，淡出期间会临时覆盖
            this._originalOnEnded = () => this._restore();
            this.src.onended = this._originalOnEnded;
        }
        update() {
            if (!this.isPlaying) return false;
            // 淡入
            if (this.fadeInRem > 0) {
                const progress = this.fadeInTotal - this.fadeInRem;
                this.currentVolume = this.targetVolume * progress / this.fadeInTotal;
                if (this.gain) this.gain.gain.value = this.currentVolume / 100;
                this.fadeInRem--;
                return true;
            }
            // 淡出（完全同 SE 的线性衰减）
            if (this.fadeOutRem > 0) {
                const step = this.fadeOutStartVolume / this.fadeOutTotal;
                this.currentVolume -= step;
                if (this.currentVolume < 0) this.currentVolume = 0;
                if (this.gain) this.gain.gain.value = this.currentVolume / 100;
                this.fadeOutRem--;
                if (this.fadeOutRem === 0) {
                    this._restore();   // 音量已归零，恢复 BGM
                }
                return true;
            }
            return true;
        }
        fadeOut(frames, callback) {
            if (!this.isPlaying) return;
            if (frames <= 0) {
                this._restore();
                if (callback) callback();
                return;
            }
            // 淡出期间屏蔽自然结束回调，防止提前恢复 BGM
            if (this.src) {
                this.src.onended = () => {};
            }
            this.fadeInRem = 0;
            this.fadeOutTotal = frames;
            this.fadeOutRem = frames;
            this.fadeOutStartVolume = this.currentVolume;
            this.onEnd = () => {
                this._restore();
                if (callback) callback();
            };
        }
        _restore() {
            if (!this.isPlaying) return;
            this.isPlaying = false;
            if (this.src) {
                try { this.src.stop(); } catch(e) {}
                this.src.disconnect();
                this.src = null;
            }
            if (this.gain) {
                this.gain.disconnect();
                this.gain = null;
            }
            if (this._originalBgm) {
                AudioManager.playBgm(this._originalBgm);
            }
            if (this.onEnd) this.onEnd();
        }
        isActive() { return this.isPlaying; }
    }

    const manager = {
        seList: [],
        currentMe: null,
        update() {
            for (let i = this.seList.length-1; i >= 0; i--) {
                const se = this.seList[i];
                if (se.isActive()) se.update();
                else this.seList.splice(i,1);
            }
            if (this.currentMe && this.currentMe.isActive()) {
                this.currentMe.update();
                if (!this.currentMe.isActive()) this.currentMe = null;
            }
        },
        fadeInSe(name, vol, frames, pitch=100, pan=0) {
            const se = new FadeableSe(name, vol, frames, pitch, pan);
            this.seList.push(se);
        },
        fadeOutSe(frames) {
            if (this.seList.length === 0) return;
            for (const se of this.seList) se.fadeOut(frames);
        },
        fadeInMe(name, vol, frames) {
            if (this.currentMe && this.currentMe.isActive()) {
                this.currentMe.fadeOut(0, () => { this.currentMe = new FadeableMe(name, vol, frames); });
            } else {
                this.currentMe = new FadeableMe(name, vol, frames);
            }
        },
        fadeOutMe(frames) {
            if (this.currentMe && this.currentMe.isActive()) this.currentMe.fadeOut(frames);
        }
    };

    Game_System.prototype.fadeInSe = function(name, vol, frames, pitch=100, pan=0) {
        manager.fadeInSe(name, vol, frames, pitch, pan);
    };
    Game_System.prototype.fadeOutSe = function(frames) {
        manager.fadeOutSe(frames);
    };
    Game_System.prototype.fadeInMe = function(name, vol, frames) {
        manager.fadeInMe(name, vol, frames);
    };
    Game_System.prototype.fadeOutMe = function(frames) {
        manager.fadeOutMe(frames);
    };

    if (replaceNative) {
        const orig = AudioManager.playSe;
        AudioManager.playSe = function(se) {
            if (se && se.name) {
                manager.fadeInSe(se.name, se.volume ?? 100, 0, se.pitch ?? 100, se.pan ?? 0);
            } else {
                orig.call(this, se);
            }
        };
    }

    const _baseUpdate = Scene_Base.prototype.update;
    Scene_Base.prototype.update = function() {
        _baseUpdate.call(this);
        manager.update();
    };
    (function raf() { manager.update(); requestAnimationFrame(raf); })();

    const pluginName = 'Huanaiyka_SeFader';
    PluginManager.registerCommand(pluginName, "FadeInSE", args => {
        const name = args.name;
        const volume = parseInt(args.volume, 10);
        const frames = parseInt(args.frames, 10);
        const pitch = args.pitch !== undefined ? parseInt(args.pitch, 10) : 100;
        const pan = args.pan !== undefined ? parseInt(args.pan, 10) : 0;
        if (name && !isNaN(volume) && !isNaN(frames)) {
            manager.fadeInSe(name, volume, frames, pitch, pan);
        }
    });
    PluginManager.registerCommand(pluginName, "FadeOutSE", args => {
        let frames = parseInt(args.frames, 10);
        if (isNaN(frames)) frames = 60;
        manager.fadeOutSe(frames);
    });
    PluginManager.registerCommand(pluginName, "FadeInME", args => {
        const name = args.name;
        const volume = parseInt(args.volume, 10);
        const frames = parseInt(args.frames, 10);
        if (name && !isNaN(volume) && !isNaN(frames)) {
            manager.fadeInMe(name, volume, frames);
        }
    });
    PluginManager.registerCommand(pluginName, "FadeOutME", args => {
        let frames = parseInt(args.frames, 10);
        if (isNaN(frames)) frames = 60;
        manager.fadeOutMe(frames);
    });
})();