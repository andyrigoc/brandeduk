/* Homepage snow.
   Settled depth starts at 0 on every page load. It is not stored.
   Progress p after 1s, t = seconds - 1: p = 1 - e^(-t/42).
   About 0.33 at 18s (a thin drift) and about 0.52 at 32s (thicker, still capped).
   Letter snow is a separate mound on each of b, r, a, n, d, e, d.
   Banner drift is one uneven wave along the bottom rim only. */
(function () {
    var pageStart = Date.now();

    function isHome() {
        var path = (location.pathname || '/').replace(/\/+$/, '') || '/';
        return path === '/' ||
            path === '/home-pc' ||
            path === '/home-pc.html' ||
            path === '/index-mobile' ||
            path === '/index-mobile.html' ||
            path === '/mobile/home-mobile' ||
            path === '/mobile/home-mobile.html';
    }

    function visitSeconds() {
        return Math.max(0, (Date.now() - pageStart) / 1000);
    }

    function snowProgress(seconds) {
        // Fresh load deposits nothing. A light layer appears around 15–20s.
        if (seconds < 6) return 0;
        return Math.min(1, 1 - Math.exp(-(seconds - 6) / 70));
    }

    function shown(el) {
        if (!el) return false;
        var cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        var rect = el.getBoundingClientRect();
        return rect.width > 8 && rect.height > 8;
    }

    function pickHeader() {
        var pc = document.querySelector('.site-header');
        var mobile = document.querySelector('.mobile-header--v2');
        var pcOn = shown(pc);
        var mobileOn = shown(mobile);
        if (pcOn && mobileOn) return window.innerWidth < 700 ? mobile : pc;
        if (pcOn) return pc;
        if (mobileOn) return mobile;
        return null;
    }

    function bannerStage() {
        return document.querySelector('[data-hero-banners]') ||
            document.querySelector('.hero-banners-container');
    }

    function flakeCount(box, kind) {
        var width = box && box.clientWidth ? box.clientWidth : 800;
        var height = box && box.clientHeight ? box.clientHeight : 160;
        var area = Math.max(1, width * height);
        var count = Math.round(area / (kind === 'header' ? 2800 : 4200));
        var cap = kind === 'header' ? 160 : 140;
        var floor = kind === 'header' ? 70 : 50;
        return Math.max(floor, Math.min(cap, count));
    }

    var reducedMotion = false;
    try {
        reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (err) {}

    var snowFields = [];
    var snowFrame = 0;

    function makeFlake(width, height) {
        var depth = Math.pow(Math.random(), 1.6);
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            depth: depth,
            radius: 1.2 + depth * 3.8,
            speedY: 0.7 + depth * 2.4,
            swayAmp: 0.3 + depth * 1.4,
            swaySpeed: 0.008 + Math.random() * 0.015,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.28 + depth * 0.72,
            sprite: Math.round(depth * 11)
        };
    }

    function resizeSnowField(field) {
        var rect = field.host.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var width = Math.max(1, Math.round(rect.width));
        var height = Math.max(1, Math.round(rect.height));
        if (width === field.width && height === field.height && field.canvas.width) return;
        field.width = width;
        field.height = height;
        field.canvas.width = Math.round(width * dpr);
        field.canvas.height = Math.round(height * dpr);
        field.canvas.style.width = width + 'px';
        field.canvas.style.height = height + 'px';
        field.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var target = flakeCount(field.host, field.kind);
        while (field.flakes.length < target) field.flakes.push(makeFlake(width, height));
        if (field.flakes.length > target) field.flakes.length = target;
    }

    var flakeSprites = null;

    function buildFlakeSprites() {
        if (flakeSprites) return flakeSprites;
        flakeSprites = [];
        var step;
        for (step = 0; step < 12; step += 1) {
            var depth = step / 11;
            var radius = 1.2 + depth * 3.8;
            var alpha = 0.28 + depth * 0.72;
            var size = Math.ceil(radius * 2 + 2);
            var sprite = document.createElement('canvas');
            sprite.width = size;
            sprite.height = size;
            var gctx = sprite.getContext('2d');
            var gradient = gctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, radius);
            gradient.addColorStop(0, 'rgba(255,255,255,' + alpha.toFixed(3) + ')');
            gradient.addColorStop(0.55, 'rgba(255,255,255,' + (alpha * 0.35).toFixed(3) + ')');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            gctx.fillStyle = gradient;
            gctx.beginPath();
            gctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
            gctx.fill();
            flakeSprites.push(sprite);
        }
        return flakeSprites;
    }

    function stepSnowField(field, now, frame) {
        if (now >= field.nextWind) {
            field.windTarget = (Math.random() - 0.5) * 1.8;
            field.nextWind = now + 3500;
        }
        field.wind += (field.windTarget - field.wind) * (0.01 * frame);
        var ctx = field.ctx;
        var width = field.width;
        var height = field.height;
        ctx.clearRect(0, 0, width, height);
        var flakes = field.flakes;
        var i;
        for (i = 0; i < flakes.length; i += 1) {
            var flake = flakes[i];
            flake.phase += flake.swaySpeed * frame;
            flake.y += flake.speedY * frame;
            flake.x += (Math.sin(flake.phase) * flake.swayAmp + field.wind) * frame;
            if (flake.x < -10) flake.x = width + 10;
            else if (flake.x > width + 10) flake.x = -10;
            if (flake.y - flake.radius > height) {
                flake.y = -flake.radius - Math.random() * 24;
                flake.x = Math.random() * width;
            }
            paintFlake(ctx, flake);
        }
        if (field.kind === 'header') {
            settleOnLogo(field);
            settleOnHat(field);
            if (logoSnow && logoSnow.surface) {
                logoSnow.reveal = Math.min(1, (logoSnow.reveal || 0) + 0.0015 * frame);
                drawLogoPile();
            }
            if (hatSnow && hatSnow.surface) {
                hatSnow.reveal = Math.min(1, (hatSnow.reveal || 0) + 0.0012 * frame);
                drawSurfacePile(hatSnow);
            }
        }
    }

    function paintFlake(ctx, flake) {
        var sprite = buildFlakeSprites()[flake.sprite];
        var size = sprite.width;
        ctx.drawImage(sprite, flake.x - size / 2, flake.y - size / 2);
    }

    function fieldIsLive(field) {
        if (!field.banner) return true;
        if (field.banner.classList.contains('hero-banner--active')) return true;
        var stage = field.banner.parentElement;
        if (!stage) return true;
        var i;
        for (i = 0; i < stage.children.length; i += 1) {
            var child = stage.children[i];
            if (child.classList && child.classList.contains('hero-banner--active')) return false;
        }
        return true;
    }

    var snowLast = 0;

    function snowTick(now) {
        var frame = 1;
        if (snowLast) frame = Math.min(2, (now - snowLast) / 16.67);
        snowLast = now;
        var i;
        for (i = 0; i < snowFields.length; i += 1) {
            var field = snowFields[i];
            if (!fieldIsLive(field)) continue;
            stepSnowField(field, now, frame);
        }
        snowFrame = requestAnimationFrame(snowTick);
    }

    function ensureSnowLoop() {
        if (reducedMotion || snowFrame) return;
        snowFrame = requestAnimationFrame(snowTick);
    }

    function attachCanvas(host, kind, banner) {
        if (!host) return;
        var old = host.querySelectorAll('.buk-snow-flake');
        Array.prototype.forEach.call(old, function (node) { node.remove(); });
        if (host.querySelector(':scope > .buk-snow-canvas')) return;
        var canvas = document.createElement('canvas');
        canvas.className = 'buk-snow-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        host.appendChild(canvas);
        var field = {
            host: host,
            kind: kind,
            banner: banner || null,
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            flakes: [],
            width: 0,
            height: 0,
            wind: 0,
            windTarget: 0,
            nextWind: 0
        };
        resizeSnowField(field);
        snowFields.push(field);
        ensureSnowLoop();
    }

    function resizeSnowFields() {
        var i;
        for (i = 0; i < snowFields.length; i += 1) resizeSnowField(snowFields[i]);
    }

    function mountBanner(banner, index) {
        if (!banner || banner.querySelector(':scope > .buk-snow-fall')) return;
        var fall = document.createElement('div');
        fall.className = 'buk-snow-fall';
        fall.setAttribute('aria-hidden', 'true');
        banner.style.overflow = 'hidden';
        banner.appendChild(fall);
        attachCanvas(fall, 'banner', banner);
        var drift = document.createElement('div');
        drift.className = 'buk-snow-drift';
        drift.setAttribute('aria-hidden', 'true');
        drift.innerHTML = '<svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path fill="#ffffff" stroke="none" d="M0 100 L0 72 L28 64 L46 38 L70 58 L96 28 L124 52 L150 22 L178 48 L206 30 L236 56 L268 18 L300 46 L332 26 L364 54 L396 20 L430 48 L462 32 L498 58 L530 16 L566 44 L598 24 L632 50 L668 22 L700 46 L736 28 L770 54 L806 18 L840 42 L874 30 L908 52 L940 24 L972 46 L1000 34 L1000 100 Z"></path></svg>';
        banner.appendChild(drift);
    }

    function mountBanners() {
        var stage = bannerStage();
        if (!stage) return;
        var banners = stage.querySelectorAll('.hero-banner');
        Array.prototype.forEach.call(banners, mountBanner);
        resizeSnowFields();
    }

    var headerEl = null;
    var fieldEl = null;

    // Irregular crusts in the hat's own box, before its flip: crown, brim, pom.
    var HAT_PATHS = [
        'M44 8 L50 2 L56 6 L63 3 L70 9 L77 15 L74 22 L66 18 L58 25 L50 20 L44 16 L40 11 Z',
        'M12 33 L22 28 L34 36 L48 30 L60 38 L70 31 L74 40 L62 47 L48 41 L34 49 L22 43 L14 47 L10 38 Z',
        'M70 74 L78 70 L86 73 L93 80 L91 89 L82 95 L74 91 L69 84 L73 77 Z'
    ];
    // Jagged lip along a control's top edge. The bottom of the shape is the edge.
    var EDGE_DRIFT = 'M0 24 L16 18 L34 26 L52 12 L74 22 L96 15 L118 28 L142 14 L166 24 L190 16 L214 27 L238 13 L262 23 L286 17 L300 24 L300 36 L0 36 Z';

    function mountHeader() {
        var header = pickHeader();
        if (!header) return;
        var mode = header.classList.contains('mobile-header') ? 'mobile' : 'pc';
        document.documentElement.classList.toggle('buk-snow-mobile', mode === 'mobile');
        document.documentElement.classList.toggle('buk-snow-pc', mode === 'pc');
        if (getComputedStyle(header).position === 'static') header.style.position = 'relative';
        headerEl = header;
        fieldEl = header.querySelector(':scope > .buk-snow-field');
        if (!fieldEl) {
            fieldEl = document.createElement('div');
            fieldEl.className = 'buk-snow-field';
            fieldEl.setAttribute('aria-hidden', 'true');
            var fall = document.createElement('div');
            fall.className = 'buk-snow-fall';
            fieldEl.appendChild(fall);
            header.appendChild(fieldEl);
            attachCanvas(fall, 'header', null);
        }
        resizeSnowFields();
        layoutCaps();
    }

    function layoutCaps() {
        if (!headerEl || !fieldEl || !shown(headerEl)) return;
        var host = fieldEl.getBoundingClientRect();
        var mobile = headerEl.classList.contains('mobile-header');
        var progress = snowProgress(visitSeconds());
        var straight = fieldEl.querySelectorAll('.buk-snow-cap--letters, .buk-snow-cap--line');
        Array.prototype.forEach.call(straight, function (node) { node.remove(); });
        placeLetterMounds(host, mobile, progress);
        placeHatSnow(mobile, progress);
        placeSimpleCaps(mobile, progress);
    }

    function svgEl(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    var logoSnow = null;

    function placeLetterMounds(host, mobile, progress) {
        var word = headerEl.querySelector(mobile ? '.mobile-logo-word' : '.searchbar-header__brand-text');
        if (!word || !word.parentElement) return;
        var parent = word.parentElement;
        Array.prototype.forEach.call(parent.querySelectorAll(':scope > .buk-snow-letter, :scope > .buk-snow-letterdrift'), function (node) {
            node.remove();
        });
        if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
        parent.style.overflow = 'visible';
        if (!word.naturalWidth) {
            if (!word.dataset.bukSnowWait) {
                word.dataset.bukSnowWait = '1';
                word.addEventListener('load', function () { placeLetterMounds(host, mobile, progress); }, { once: true });
            }
            return;
        }
        var canvas = parent.querySelector(':scope > .buk-snow-letterpile');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'buk-snow-letterpile';
            canvas.setAttribute('aria-hidden', 'true');
            parent.appendChild(canvas);
        }
        if (!logoSnow || logoSnow.word !== word) {
            var mask = document.createElement('canvas');
            logoSnow = {
                word: word,
                canvas: canvas,
                ctx: canvas.getContext('2d'),
                mask: mask,
                maskCtx: mask.getContext('2d'),
                surface: null,
                pile: null,
                width: 0,
                height: 0,
                dpr: 1,
                offsetX: 0,
                offsetY: 0,
                cap: 12,
                reveal: 0
            };
        } else {
            logoSnow.canvas = canvas;
        }
        rebuildLogoSurface();
    }

    function rebuildLogoSurface() {
        var snow = logoSnow;
        if (!snow || !snow.word.naturalWidth) return;
        var rect = snow.word.getBoundingClientRect();
        var parentRect = snow.word.parentElement.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var width = Math.max(1, Math.round(rect.width * dpr));
        var height = Math.max(1, Math.round(rect.height * dpr));
        snow.dpr = dpr;
        snow.canvas.style.position = 'absolute';
        snow.canvas.style.left = (rect.left - parentRect.left) + 'px';
        snow.canvas.style.top = (rect.top - parentRect.top) + 'px';
        snow.canvas.style.width = rect.width + 'px';
        snow.canvas.style.height = rect.height + 'px';
        snow.canvas.style.zIndex = '40';
        snow.canvas.style.pointerEvents = 'none';
        var fall = fieldEl && fieldEl.querySelector('.buk-snow-canvas');
        if (fall) {
            var fallRect = fall.getBoundingClientRect();
            snow.offsetX = rect.left - fallRect.left;
            snow.offsetY = rect.top - fallRect.top;
        }
        if (snow.width === width && snow.height === height && snow.surface && snow.pile) return;
        var previous = snow.pile;
        snow.width = width;
        snow.height = height;
        snow.canvas.width = width;
        snow.canvas.height = height;
        snow.mask.width = width;
        snow.mask.height = height;
        snow.maskCtx.clearRect(0, 0, width, height);
        try {
            snow.maskCtx.drawImage(snow.word, 0, 0, width, height);
            var pixels = snow.maskCtx.getImageData(0, 0, width, height).data;
            var surface = new Float32Array(width);
            var glyphBottom = new Float32Array(width);
            var x;
            var y;
            for (x = 0; x < width; x += 1) {
                surface[x] = height;
                glyphBottom[x] = -1;
                for (y = 0; y < height; y += 1) {
                    if (pixels[(y * width + x) * 4 + 3] > 48) {
                        surface[x] = y;
                        break;
                    }
                }
                for (y = height - 1; y >= 0; y -= 1) {
                    if (pixels[(y * width + x) * 4 + 3] > 48) {
                        glyphBottom[x] = y;
                        break;
                    }
                }
            }
            snow.surface = surface;
            snow.glyphBottom = glyphBottom;
            snow.ink = pixels;
        } catch (err) {
            snow.surface = null;
            snow.ink = null;
            return;
        }
        snow.cap = 2 * dpr;
        if (previous && previous.length === width) snow.pile = previous;
        else snow.pile = new Float32Array(width);
        drawLogoPile();
    }

    function depositSnow(column, amount) {
        var snow = logoSnow;
        var radius = Math.max(2, Math.round(3 * snow.dpr));
        var i;
        for (i = -radius; i <= radius; i += 1) {
            var x = column + i;
            if (x < 0 || x >= snow.pile.length) continue;
            if (snow.surface[x] >= snow.height) continue;
            var falloff = 1 - Math.abs(i) / (radius + 1);
            var next = snow.pile[x] + amount * falloff;
            snow.pile[x] = next > snow.cap ? snow.cap : next;
        }
    }

    function smoothSnow() {
        var snow = logoSnow;
        var pile = snow.pile;
        var surface = snow.surface;
        var height = snow.height;
        var next = new Float32Array(pile.length);
        var x;
        for (x = 0; x < pile.length; x += 1) {
            if (surface[x] >= height) continue;
            var left = x > 0 && surface[x - 1] < height ? pile[x - 1] : pile[x];
            var right = x + 1 < pile.length && surface[x + 1] < height ? pile[x + 1] : pile[x];
            var blended = pile[x] * 0.5 + left * 0.25 + right * 0.25;
            next[x] = blended > snow.cap ? snow.cap : blended;
        }
        snow.pile = next;
    }

    function drawLogoPile() {
        var snow = logoSnow;
        if (!snow || !snow.surface || !snow.ink) return;
        var ctx = snow.ctx;
        var width = snow.width;
        var height = snow.height;
        var ink = snow.ink;
        var reveal = snow.reveal || 0;
        ctx.clearRect(0, 0, width, height);
        if (reveal < 0.04) return;
        ctx.fillStyle = '#ffffff';
        var x;
        var y;
        var gapLimit = Math.max(3, Math.round(height * 0.035));
        for (x = 0; x < width; x += 1) {
            var surfaceY = snow.surface[x];
            if (surfaceY >= height) continue;
            var end = Math.floor(surfaceY);
            var gap = 0;
            var limit = snow.glyphBottom ? snow.glyphBottom[x] : height - 1;
            for (y = end; y <= limit; y += 1) {
                if (ink[(y * width + x) * 4 + 3] > 48) {
                    end = y;
                    gap = 0;
                } else {
                    gap += 1;
                    if (gap > gapLimit) break;
                }
            }
            var letterH = end - Math.floor(surfaceY) + 1;
            if (letterH < 6) continue;
            var stem = surfaceY < height * 0.25;
            var wobble = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(x * 0.55 + 1.1));
            var ratio = (stem ? 0.07 : 0.05) * wobble;
            var cover = Math.max(2, Math.round(letterH * ratio * reveal));
            var maxCover = Math.max(2, Math.round(letterH * (stem ? 0.08 : 0.055)));
            if (cover > maxCover) cover = maxCover;
            var start = Math.floor(surfaceY);
            for (y = 0; y < cover; y += 1) {
                var py = start + y;
                if (py < 0 || py >= height) continue;
                if (ink[(py * width + x) * 4 + 3] < 48) continue;
                var fade = 1 - (y / cover) * 0.35;
                ctx.globalAlpha = Math.min(1, reveal * 1.05) * fade;
                ctx.fillRect(x, py, 1, 1);
            }
        }
        ctx.globalAlpha = 1;
    }

    function settleOnLogo(field) {
        var snow = logoSnow;
        if (!snow || !snow.canvas) return;
        if (!snow.pile || !snow.surface) return;
        var scale = snow.dpr;
        var flakes = field.flakes;
        var i;
        var hit = false;
        for (i = 0; i < flakes.length; i += 1) {
            var flake = flakes[i];
            if (flake.depth < 0.55) continue;
            var lx = (flake.x - snow.offsetX) * scale;
            var ly = (flake.y - snow.offsetY) * scale;
            if (lx < 0 || lx >= snow.width) continue;
            var column = lx | 0;
            if (snow.surface[column] >= snow.height) continue;
            var top = snow.surface[column] - snow.pile[column];
            var reach = flake.radius * scale;
            if (ly < top - reach) continue;
            if (ly > top + reach + 6 * scale) continue;
            var stem = snow.surface[column] < snow.height * 0.25 ? 1.8 : 1;
            depositSnow(column, flake.depth * 6 * 0.3 * scale * stem);
            flake.y = -flake.radius - Math.random() * 20;
            flake.x = Math.random() * field.width;
            hit = true;
        }
        if (!hit) return;
        smoothSnow();
        drawLogoPile();
    }

    var hatSnow = null;

    function drawSurfacePile(snow) {
        if (!snow || !snow.surface) return;
        var ctx = snow.ctx;
        var reveal = snow.reveal || 0;
        ctx.clearRect(0, 0, snow.width, snow.height);
        if (reveal < 0.05) return;
        ctx.fillStyle = '#ffffff';
        var x;
        var y;
        for (x = 0; x < snow.width; x += 1) {
            var surfaceY = snow.surface[x];
            if (surfaceY >= snow.height) continue;
            var wobble = 0.8 + 0.2 * (0.5 + 0.5 * Math.sin(x * 0.7));
            var cover = Math.max(1, Math.round(snow.height * 0.06 * wobble * reveal));
            if (cover > Math.round(snow.height * 0.08)) cover = Math.round(snow.height * 0.08);
            for (y = 0; y < cover; y += 1) {
                var py = Math.floor(surfaceY) + y;
                if (py < 0 || py >= snow.height) continue;
                ctx.globalAlpha = Math.min(0.9, reveal) * (1 - (y / cover) * 0.4);
                ctx.fillRect(x, py, 1, 1);
            }
        }
        ctx.globalAlpha = 1;
    }

    function smoothSurface(snow) {
        var pile = snow.pile;
        var surface = snow.surface;
        var height = snow.height;
        var next = new Float32Array(pile.length);
        var x;
        for (x = 0; x < pile.length; x += 1) {
            if (surface[x] >= height) continue;
            var left = x > 0 && surface[x - 1] < height ? pile[x - 1] : pile[x];
            var right = x + 1 < pile.length && surface[x + 1] < height ? pile[x + 1] : pile[x];
            var blended = pile[x] * 0.5 + left * 0.25 + right * 0.25;
            next[x] = blended > snow.cap ? snow.cap : blended;
        }
        snow.pile = next;
    }

    function depositSurface(snow, column, amount) {
        var radius = Math.max(2, Math.round(2 * snow.dpr));
        var i;
        for (i = -radius; i <= radius; i += 1) {
            var x = column + i;
            if (x < 0 || x >= snow.pile.length) continue;
            if (snow.surface[x] >= snow.height) continue;
            var falloff = 1 - Math.abs(i) / (radius + 1);
            var next = snow.pile[x] + amount * falloff;
            snow.pile[x] = next > snow.cap ? snow.cap : next;
        }
    }

    function rebuildHatSurface() {
        var snow = hatSnow;
        if (!snow || !snow.img) return;
        var rect = snow.el.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var layoutW = snow.el.offsetWidth || 50;
        var layoutH = snow.el.offsetHeight || 56;
        var width = Math.max(8, Math.round(layoutW * dpr));
        var height = Math.max(8, Math.round(layoutH * dpr));
        var fall = fieldEl && fieldEl.querySelector('.buk-snow-canvas');
        if (fall) {
            var fallRect = fall.getBoundingClientRect();
            snow.offsetX = rect.left - fallRect.left;
            snow.offsetY = rect.top - fallRect.top;
            snow.cssW = rect.width || layoutW;
            snow.cssH = rect.height || layoutH;
        }
        if (snow.width === width && snow.height === height && snow.surface && snow.pile) return;
        snow.dpr = dpr;
        snow.width = width;
        snow.height = height;
        snow.canvas.width = width;
        snow.canvas.height = height;
        snow.mask.width = width;
        snow.mask.height = height;
        snow.maskCtx.clearRect(0, 0, width, height);
        snow.maskCtx.drawImage(snow.img, 0, 0, width, height);
        var pixels = snow.maskCtx.getImageData(0, 0, width, height).data;
        var surface = new Float32Array(width);
        var x;
        var y;
        for (x = 0; x < width; x += 1) {
            surface[x] = height;
            for (y = 0; y < height; y += 1) {
                if (pixels[(y * width + x) * 4 + 3] > 140) {
                    surface[x] = y;
                    break;
                }
            }
        }
        snow.surface = surface;
        snow.cap = 10 * dpr;
        if (!snow.pile || snow.pile.length !== width) snow.pile = new Float32Array(width);
        drawSurfacePile(snow);
    }

    function settleOnHat(field) {
        var snow = hatSnow;
        if (!snow || !snow.pile || !snow.surface || !snow.cssW) return;
        var scaleX = snow.width / snow.cssW;
        var scaleY = snow.height / snow.cssH;
        var flakes = field.flakes;
        var i;
        var hit = false;
        for (i = 0; i < flakes.length; i += 1) {
            var flake = flakes[i];
            if (flake.depth < 0.55) continue;
            var lx = (flake.x - snow.offsetX) * scaleX;
            var ly = (flake.y - snow.offsetY) * scaleY;
            if (lx < 0 || lx >= snow.width || ly < -6 || ly > snow.height) continue;
            var column = lx | 0;
            if (snow.surface[column] >= snow.height) continue;
            var top = snow.surface[column] - snow.pile[column];
            if (ly < top - 4) continue;
            if (ly > top + 8) continue;
            depositSurface(snow, column, flake.depth * 5 * (snow.dpr || 1));
            flake.y = -flake.radius - Math.random() * 16;
            flake.x = Math.random() * field.width;
            hit = true;
        }
        if (!hit) return;
        smoothSurface(snow);
        drawSurfacePile(snow);
    }

    function placeHatSnow(mobile, progress) {
        var parent = headerEl.querySelector(mobile ? '.mobile-logo-center' : '.searchbar-header__brand-badge-wrap');
        if (!parent) return;
        var hat = parent.querySelector(':scope > .buk-snow-hat');
        if (hat && hat.querySelector('svg')) {
            hat.remove();
            hat = null;
            hatSnow = null;
        }
        if (!hat) {
            hat = document.createElement('span');
            hat.className = 'buk-snow-hat';
            hat.setAttribute('aria-hidden', 'true');
            var canvas = document.createElement('canvas');
            canvas.className = 'buk-snow-hatpile';
            canvas.setAttribute('aria-hidden', 'true');
            hat.appendChild(canvas);
            parent.appendChild(hat);
        }
        hat.style.visibility = 'visible';
        hat.style.opacity = '1';
        var canvasEl = hat.querySelector('canvas');
        if (!hatSnow || hatSnow.el !== hat) {
            var mask = document.createElement('canvas');
            hatSnow = {
                el: hat,
                canvas: canvasEl,
                ctx: canvasEl.getContext('2d'),
                mask: mask,
                maskCtx: mask.getContext('2d'),
                img: hatSnow && hatSnow.img,
                surface: null,
                pile: null,
                width: 0,
                height: 0,
                dpr: 1,
                offsetX: 0,
                offsetY: 0,
                cssW: 50,
                cssH: 56,
                cap: 10
            };
            if (!hatSnow.img) {
                var img = new Image();
                img.onload = function () {
                    if (!hatSnow) return;
                    hatSnow.img = img;
                    rebuildHatSurface();
                };
                img.src = '/brandedukv15-child/assets/images/ui/santa-hat.png';
            }
        } else {
            hatSnow.canvas = canvasEl;
            hatSnow.ctx = canvasEl.getContext('2d');
        }
        rebuildHatSurface();
    }

    function isSearchBar(el) {
        return el.classList.contains('mh-search-control') ||
            el.classList.contains('searchbar-header__search-expand');
    }

    function searchRadius(el) {
        var probe = el.querySelector('.search-input-expand') || el;
        var radius = parseFloat(getComputedStyle(probe).borderTopLeftRadius) || 0;
        var limit = Math.min(el.clientWidth || 0, el.clientHeight || 0) / 2;
        if (!radius || radius > limit) radius = limit;
        return radius > 0 ? radius : 0;
    }

    function searchRimPath(width, height, radius) {
        var overlap = Math.min(2, height);
        var steps = Math.max(24, Math.round(width / 7));
        var crest = [];
        var base = [];
        var i;
        for (i = 0; i <= steps; i += 1) {
            var x = width * i / steps;
            var curve = 0;
            if (radius > 1) {
                var dx = 0;
                if (x < radius) dx = radius - x;
                else if (x > width - radius) dx = x - (width - radius);
                if (dx > 0) {
                    var inside = radius * radius - dx * dx;
                    curve = inside > 0 ? radius - Math.sqrt(inside) : radius;
                }
            }
            if (curve > overlap + 0.2) continue;
            var yBottom = (height - overlap) + curve;
            var jag = (Math.sin(i * 1.37) + Math.sin(i * 0.51 + 0.8)) * Math.min(1.5, height * 0.16);
            var yTop = Math.max(0, yBottom - (height - overlap) - 0.6 + jag);
            crest.push(x.toFixed(1) + ' ' + yTop.toFixed(1));
            base.push(x.toFixed(1) + ' ' + Math.min(height, yBottom).toFixed(1));
        }
        if (crest.length < 2) return '';
        var d = 'M' + crest[0];
        for (i = 1; i < crest.length; i += 1) d += ' L' + crest[i];
        for (i = base.length - 1; i >= 0; i -= 1) d += ' L' + base[i];
        return d + ' Z';
    }

    function placeRim(edge, el, progress) {
        var lip = progress <= 0 ? 0 : Math.min(6, progress * 36);
        edge.classList.add('buk-snow-edge--rim');
        edge.style.left = '0';
        edge.style.right = '0';
        edge.style.bottom = 'auto';
        edge.style.transform = 'none';
        edge.style.overflow = 'hidden';
        edge.style.maxHeight = '6px';
        if (lip < 0.6) {
            edge.style.height = '0px';
            edge.style.visibility = 'hidden';
            return;
        }
        var overlap = Math.min(2, lip);
        edge.style.height = lip.toFixed(2) + 'px';
        edge.style.top = (-(lip - overlap)).toFixed(2) + 'px';
        edge.style.visibility = 'visible';
        var width = Math.max(1, Math.round(el.clientWidth || el.getBoundingClientRect().width));
        var height = Math.max(1, lip);
        var svg = edge.querySelector('svg');
        var path = edge.querySelector('path');
        if (!svg || !path) return;
        var key = width + 'x' + height.toFixed(1);
        if (edge.dataset.rim === key) return;
        edge.dataset.rim = key;
        svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height.toFixed(2));
        svg.setAttribute('preserveAspectRatio', 'none');
        path.setAttribute('d', searchRimPath(width, height, searchRadius(el)));
    }

    function placeSimpleCaps(mobile, progress) {
        var specs = mobile ? [
            '.mh-search-control'
        ] : [
            '.header-trust-list li',
            '.header-top-phone',
            '.header-top-mail',
            '.header-top-vat-toggle',
            '.header-top .header-top-basket-link',
            '.shop-products-btn',
            '.searchbar-header__search-expand'
        ];
        var depth = Math.min(6, progress * 20);
        specs.forEach(function (sel) {
            var nodes = headerEl.querySelectorAll(sel);
            Array.prototype.forEach.call(nodes, function (el) {
                if (el.closest('.mh-account, .account-nav-avatar, .account-trigger-avatar')) return;
                if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
                el.style.overflow = 'visible';
                var oldOval = el.querySelector(':scope > .buk-snow-cap--simple');
                if (oldOval) oldOval.remove();
                var oldLumps = el.querySelector(':scope > .buk-snow-lumps');
                if (oldLumps) oldLumps.remove();
                var edge = el.querySelector(':scope > .buk-snow-edge');
                if (!edge) {
                    edge = document.createElement('span');
                    edge.className = 'buk-snow-edge';
                    edge.setAttribute('aria-hidden', 'true');
                    var svg = svgEl('svg');
                    svg.setAttribute('viewBox', '0 0 300 40');
                    svg.setAttribute('preserveAspectRatio', 'none');
                    svg.setAttribute('aria-hidden', 'true');
                    var path = svgEl('path');
                    path.setAttribute('fill', '#ffffff');
                    path.setAttribute('stroke', 'none');
                    path.setAttribute('d', EDGE_DRIFT);
                    svg.appendChild(path);
                    edge.appendChild(svg);
                    el.appendChild(edge);
                }
                if (isSearchBar(el)) {
                    if (el.parentElement && el.classList.contains('mh-search-control')) {
                        el.parentElement.style.position = 'relative';
                        el.parentElement.style.zIndex = '14';
                    }
                    placeRim(edge, el, progress);
                    return;
                }
                edge.style.height = depth.toFixed(2) + 'px';
                edge.style.maxHeight = '6px';
                edge.style.bottom = 'calc(100% - 2px)';
                edge.style.top = 'auto';
                edge.style.transform = 'none';
                edge.style.overflow = 'hidden';
                edge.style.visibility = depth > 0.4 ? 'visible' : 'hidden';
            });
        });
    }

    function applySettled(progress) {
        document.documentElement.style.setProperty('--buk-snow', progress.toFixed(4));
        var visible = progress > 0.004;
        var opacity = visible ? progress.toFixed(3) : '0';
        var settled = document.querySelectorAll('.buk-snow-letterdrift');
        var i;
        for (i = 0; i < settled.length; i += 1) {
            settled[i].style.opacity = opacity;
            settled[i].style.visibility = visible ? 'visible' : 'hidden';
        }
        var edges = document.querySelectorAll('.buk-snow-edge');
        var height = visible ? Math.min(6, progress * 20) : 0;
        for (i = 0; i < edges.length; i += 1) {
            var edge = edges[i];
            if (edge.classList.contains('buk-snow-edge--rim')) {
                var host = edge.parentElement;
                if (host) placeRim(edge, host, progress);
                continue;
            }
            edge.style.height = height.toFixed(2) + 'px';
            edge.style.maxHeight = '6px';
            edge.style.bottom = 'calc(100% - 2px)';
            edge.style.top = 'auto';
            edge.style.overflow = 'hidden';
            edge.style.visibility = visible ? 'visible' : 'hidden';
            edge.style.transform = 'none';
        }
    }

    function tick() {
        applySettled(snowProgress(visitSeconds()));
    }

    function start() {
        if (!isHome()) return;
        try { sessionStorage.removeItem('bukSnowVisitStart'); } catch (err) {}
        mountHeader();
        mountBanners();
        tick();
        setInterval(tick, 400);

        var stage = bannerStage();
        if (stage && window.MutationObserver) {
            var observer = new MutationObserver(function () {
                mountBanners();
            });
            observer.observe(stage, { childList: true, subtree: true });
        }

        window.addEventListener('resize', function () {
            mountHeader();
            mountBanners();
            resizeSnowFields();
        });
        window.addEventListener('load', function () {
            mountHeader();
            mountBanners();
            resizeSnowFields();
        });
        if (window.ResizeObserver && headerEl) {
            var resizeObserver = new ResizeObserver(function () {
                resizeSnowFields();
                layoutCaps();
            });
            resizeObserver.observe(headerEl);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
