/*:
 * @target MZ
 * @plugindesc  硬边聚光灯演出
 * @author 幻爱
 * @url https://github.com/huanaiyka/MZ-Plugins
 * 
 * @command SpotDrift
 * @text 追光漂移
 * @desc 多个硬边圆形追光在画面内缓动移动，光斑较浅，暗底与关灯一致。
 * 
 * @arg count
 * @text 光斑数量
 * @desc 同时存在的追光个数。建议 2~6。
 * @type number
 * @min 1
 * @default 3
 * 
 * @arg radius
 * @text 半径(像素)
 * @desc 追光基础半径（固定，不缩放）。
 * @type number
 * @min 1
 * @default 110
 * 
 * @arg darkness
 * @text 暗底暗度
 * @desc 0~1，全屏暗底暗度，与关灯一致。默认 0.85。
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 0.85
 * 
 * @arg lightAlpha
 * @text 光斑亮度
 * @desc 0~1，光斑亮度。0=无光斑(全黑)，1=完全挖透(全亮)。越小越浅。默认 0.45。
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 0.45
 * 
 * @arg speed
 * @text 移动速度
 * @desc 每段移动的基准速度（像素/帧）。越大越快。建议 4~8。
 * @type number
 * @min 0.1
 * @decimals 2
 * @default 6
 * 
 * @command SpotOn
 * @text 开启聚光灯
 * @desc 以指定事件/玩家为中心，周围变暗，中心呈硬边圆形亮区。
 * 
 * @arg evId
 * @text 目标
 * @desc 0=当前事件, -1=玩家, 1以上=事件ID
 * @type number
 * @min -1
 * @default 0
 * 
 * @arg radius
 * @text 半径(像素)
 * @desc 亮区圆形半径，单位像素。建议 80~150。
 * @type number
 * @min 1
 * @default 120
 * 
 * @command SpotOff
 * @text 关闭聚光灯
 * @desc 取消当前聚光灯（含追光漂移），恢复全屏正常亮度（若已关灯，则仅移除聚光灯，仍保持关灯）。
 * 
 * @command LightOff
 * @text 关灯
 * @desc 全屏变暗（无亮区），即聚光灯打上之前的效果。可单独使用。
 * 
 * @arg darkness
 * @text 暗度
 * @desc 0~1，0=不暗，1=全黑。默认 0.85。
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 0.85
 * 
 * @command LightOn
 * @text 开灯
 * @desc 恢复全屏正常亮度。若聚光灯仍开启，则保留聚光灯亮区。
 * 
 * @help
 * ============================================================================
 * Huanaiyka_SpotlightShow — 硬边聚光灯演出插件
 * ============================================================================
 * 
 * 【插件指令】
 * ◆ 追光漂移：SpotDrift
 *   参数 光斑数量、半径、暗底暗度、光斑亮度、移动速度
 *   追光连续缓动移动，无停顿；光斑为浅色硬边圆，
 *   重叠处只是更透亮，不会变黑。
 * 
 * ◆ 开启聚光灯：SpotOn
 * ◆ 关闭聚光灯：SpotOff
 * ◆ 关灯：LightOff（参数 暗度 0~1）
 * ◆ 开灯：LightOn
 * 
 * 【使用示例】
 *   插件指令：SpotDrift 3 110 0.85 0.45 6
 *   插件指令：SpotOff
 * 
 * ============================================================================
 */

(() => {
    const pluginName = "Huanaiyka_SpotlightShow";

    let _spotlight = {
        active: false,
        target: null,
        radius: 120
    };

    let _lightOff = {
        active: false,
        darkness: 0.85
    };

    let _drift = {
        active: false,
        lights: [],
        radius: 110,
        darkness: 0.85,
        lightAlpha: 0.45,
        speed: 6
    };

    const rand = (min, max) => min + Math.random() * (max - min);

    // 平滑缓动，两端速度不归零，避免“停顿感”
    const easeInOutSoft = t => t * t * (3 - 2 * t);

    const TOP_LIMIT_RATE = 0.25;

    function yMin() { return Graphics.height * TOP_LIMIT_RATE; }
    function yMax() { return Graphics.height; }

    function resolveCharacter(evId) {
        if (evId === 0) {
            return $gameMap.event($gameMap._interpreter.eventId());
        } else if (evId === -1) {
            return $gamePlayer;
        } else {
            return $gameMap.event(evId);
        }
    }

    function pickNewTarget(light) {
        light.startX = light.x;
        light.startY = light.y;
        light.targetX = rand(0, Graphics.width);
        light.targetY = rand(yMin(), yMax());

        const dx = light.targetX - light.startX;
        const dy = light.targetY - light.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        light.duration = Math.max(4, Math.floor(dist / _drift.speed));
        light.frame = 0;
    }

    function createLight() {
        const light = {
            x: rand(0, Graphics.width),
            y: rand(yMin(), yMax()),
            radius: _drift.radius
        };
        pickNewTarget(light);
        return light;
    }

    PluginManager.registerCommand(pluginName, "SpotDrift", args => {
        const count = Math.max(1, Number(args.count) || 3);
        const radius = Math.max(1, Number(args.radius) || 110);
        const darkness = Math.max(0, Math.min(1, Number(args.darkness)));
        const lightAlpha = Math.max(0, Math.min(1, Number(args.lightAlpha)));
        const speed = Math.max(0.1, Number(args.speed) || 6);

        _spotlight.active = false;
        _spotlight.target = null;

        _drift.active = true;
        _drift.radius = radius;
        _drift.darkness = isNaN(darkness) ? 0.85 : darkness;
        _drift.lightAlpha = isNaN(lightAlpha) ? 0.45 : lightAlpha;
        _drift.speed = speed;

        _drift.lights = [];
        for (let i = 0; i < count; i++) {
            _drift.lights.push(createLight());
        }

        _spotlight.active = true;
    });

    PluginManager.registerCommand(pluginName, "SpotOn", args => {
        const character = resolveCharacter(Number(args.evId));
        if (character) {
            _drift.active = false;
            _drift.lights = [];
            _spotlight.active = true;
            _spotlight.target = character;
            _spotlight.radius = Number(args.radius) || 120;
        }
    });

    PluginManager.registerCommand(pluginName, "SpotOff", () => {
        _spotlight.active = false;
        _spotlight.target = null;
        _drift.active = false;
        _drift.lights = [];
    });

    PluginManager.registerCommand(pluginName, "LightOff", args => {
        _lightOff.active = true;
        const d = Number(args.darkness);
        _lightOff.darkness = isNaN(d) ? 0.85 : Math.max(0, Math.min(1, d));
    });

    PluginManager.registerCommand(pluginName, "LightOn", () => {
        _lightOff.active = false;
    });

    const _Spriteset_Map_createUpperLayer = Spriteset_Map.prototype.createUpperLayer;
    Spriteset_Map.prototype.createUpperLayer = function() {
        _Spriteset_Map_createUpperLayer.call(this);

        this._spotlightSprite = new Sprite();
        this._spotlightSprite.bitmap = new Bitmap(Graphics.width, Graphics.height);
        this._spotlightSprite.z = 9999;
        this.addChild(this._spotlightSprite);
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        this.updateSpotlight();
    };

    Spriteset_Map.prototype.updateDrift = function() {
        if (!_drift.active) return;

        for (const light of _drift.lights) {
            light.frame++;
            const t = Math.min(1, light.frame / light.duration);
            const e = easeInOutSoft(t);

            light.x = light.startX + (light.targetX - light.startX) * e;
            light.y = light.startY + (light.targetY - light.startY) * e;
            light.y = Math.max(yMin(), Math.min(yMax(), light.y));

            if (t >= 1) {
                pickNewTarget(light); // 立即接下一段，无停顿
            }
        }
    };

    Spriteset_Map.prototype.updateSpotlight = function() {
        const sprite = this._spotlightSprite;
        if (!sprite || !sprite.bitmap) return;

        this.updateDrift();

        const bmp = sprite.bitmap;
        const ctx = bmp.context;

        bmp.clear();

        const drifting = _drift.active && _drift.lights.length > 0;
        const spotOn = _spotlight.active && _spotlight.target;
        const lightOff = _lightOff.active;

        if (!drifting && !spotOn && !lightOff) return;

        let darkness = 0.85;
        if (drifting) {
            darkness = _drift.darkness;
        } else if (lightOff) {
            darkness = _lightOff.darkness;
        }

        ctx.save();

        // 全屏暗色（与关灯一致）
        ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
        ctx.fillRect(0, 0, bmp.width, bmp.height);

        // 追光：半透明挖洞实现浅光，重叠不会变黑
        if (drifting) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = 1 - _drift.lightAlpha; // 越大挖得越透越亮
            ctx.fillStyle = '#000000';
            for (const light of _drift.lights) {
                ctx.beginPath();
                ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // 固定聚光灯（硬边圆，无描边）
        if (spotOn) {
            const character = _spotlight.target;
            const screenX = character.screenX();
            const screenY = character.screenY() - (character.pattern ? 16 : 0);
            const radius = _spotlight.radius;

            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        sprite.setFrame(0, 0, bmp.width, bmp.height);
    };
})();