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
        var grown = 1 - Math.exp(-Math.max(0, seconds) / 48);
        return Math.min(1, 0.28 + grown * 0.72);
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

    function rand(seed) {
        var next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return { seed: next, value: next / 4294967296 };
    }

    function makeFlakes(count, seed) {
        var html = '';
        var state = seed >>> 0;
        var i;
        for (i = 0; i < count; i += 1) {
            var draw = rand(state);
            state = draw.seed;
            var x = (4 + draw.value * 92).toFixed(2) + '%';
            draw = rand(state); state = draw.seed;
            var size = (2.5 + draw.value * 4.5).toFixed(2) + 'px';
            draw = rand(state); state = draw.seed;
            var opacity = (0.72 + draw.value * 0.28).toFixed(2);
            draw = rand(state); state = draw.seed;
            var duration = (4 + draw.value * 11).toFixed(2) + 's';
            draw = rand(state); state = draw.seed;
            var delay = (-draw.value * 12).toFixed(2) + 's';
            draw = rand(state); state = draw.seed;
            var drift = ((draw.value * 22) - 11).toFixed(1) + 'px';
            html += '<span class="buk-snow-flake" style="--buk-flake-x:' + x +
                ';--s:' + size +
                ';--o:' + opacity +
                ';--d:' + duration +
                ';--delay:' + delay +
                ';--drift:' + drift +
                '"></span>';
        }
        return html;
    }

    function bannerStage() {
        return document.querySelector('[data-hero-banners]') ||
            document.querySelector('.hero-banners-container');
    }

    function modeFlakes(banner) {
        var width = banner && banner.clientWidth ? banner.clientWidth : window.innerWidth;
        return width < 700 ? 110 : 170;
    }

    function mountBanner(banner, index) {
        if (!banner || banner.querySelector(':scope > .buk-snow-fall')) return;
        var fall = document.createElement('div');
        fall.className = 'buk-snow-fall';
        fall.setAttribute('aria-hidden', 'true');
        fall.innerHTML = makeFlakes(modeFlakes(banner), 900 + index * 97);
        var drift = document.createElement('div');
        drift.className = 'buk-snow-drift';
        drift.setAttribute('aria-hidden', 'true');
        drift.innerHTML = '<svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path fill="#fff" stroke="#b7c0cc" stroke-width="2" d="M0 100 L0 68 C28 70 48 34 86 50 C124 66 148 22 196 46 C244 70 268 18 324 44 C380 70 408 26 462 42 C516 58 548 16 604 40 C660 64 692 24 748 48 C804 72 836 30 892 52 C936 68 968 46 1000 58 L1000 100 Z"></path></svg>';
        banner.appendChild(fall);
        banner.appendChild(drift);
        syncTravel(fall, banner);
    }

    function mountBanners() {
        var stage = bannerStage();
        if (!stage) return;
        var banners = stage.querySelectorAll('.hero-banner');
        Array.prototype.forEach.call(banners, mountBanner);
    }

    function syncTravel(fall, box) {
        if (!fall || !box) return;
        var distance = Math.max(80, box.clientHeight + 28);
        fall.style.setProperty('--travel', distance + 'px');
    }

    var headerEl = null;
    var fieldEl = null;

    // Tops measured on the 1916×821 wordmark. Tall stems (b, d) sit higher than a, n, e, r.
    var LETTERS = [
        { name: 'b', cx: 0.099, top: 0.156, rw: 0.055 },
        { name: 'r', cx: 0.219, top: 0.336, rw: 0.042 },
        { name: 'a', cx: 0.325, top: 0.333, rw: 0.055 },
        { name: 'n', cx: 0.465, top: 0.333, rw: 0.052 },
        { name: 'd', cx: 0.609, top: 0.156, rw: 0.055 },
        { name: 'e', cx: 0.755, top: 0.333, rw: 0.050 },
        { name: 'd2', cx: 0.868, top: 0.156, rw: 0.046 }
    ];
    // Hat-image percentages. The overlay uses the same flip and 15deg rotation as the hat.
    var HAT_BLOBS = [
        { x: 48, y: 14, w: 26, h: 12 },
        { x: 64, y: 10, w: 20, h: 11 },
        { x: 76, y: 20, w: 16, h: 14 },
        { x: 30, y: 31, w: 18, h: 9 },
        { x: 46, y: 34, w: 22, h: 10 },
        { x: 20, y: 28, w: 14, h: 8 }
    ];

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
            fall.innerHTML = makeFlakes(mode === 'mobile' ? 120 : 200, mode === 'mobile' ? 42 : 7);
            fieldEl.appendChild(fall);
            header.appendChild(fieldEl);
        }
        syncTravel(fieldEl.querySelector('.buk-snow-fall'), header);
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

    function placeLetterMounds(host, mobile, progress) {
        var word = headerEl.querySelector(mobile ? '.mobile-logo-word' : '.searchbar-header__brand-text');
        if (!word || !word.parentElement) return;
        var parent = word.parentElement;
        if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
        var parentRect = parent.getBoundingClientRect();
        var rect = word.getBoundingClientRect();
        if (rect.width < 8) return;
        var old = fieldEl.querySelectorAll('.buk-snow-letter');
        Array.prototype.forEach.call(old, function (node) { node.remove(); });
        var blobH = (mobile ? 5 : 6) + progress * (mobile ? 2 : 3);
        LETTERS.forEach(function (letter) {
            [0, 1, 2].forEach(function (part) {
                var key = letter.name + '-' + part;
                var cap = parent.querySelector(':scope > .buk-snow-letter[data-letter="' + key + '"]');
                if (!cap) {
                    cap = document.createElement('span');
                    cap.className = 'buk-snow-letter';
                    cap.dataset.letter = key;
                    parent.appendChild(cap);
                }
                var shift = part === 0 ? -0.01 : (part === 1 ? 0.012 : 0.002);
                var scale = part === 0 ? 1 : (part === 1 ? 0.55 : 0.72);
                var width = rect.width * letter.rw * scale;
                var height = blobH * (part === 2 ? 0.7 : scale);
                var cx = (rect.left - parentRect.left) + (letter.cx + shift) * rect.width;
                var inkTop = (rect.top - parentRect.top) + letter.top * rect.height;
                cap.style.left = (cx - width / 2) + 'px';
                cap.style.width = Math.max(0, width) + 'px';
                cap.style.height = Math.max(0, height) + 'px';
                cap.style.top = (inkTop - height * 0.18) + 'px';
                cap.style.zIndex = '6';
            });
        });
        [{ name: 'line-b', cx: 0.11 }, { name: 'line-a', cx: 0.34 }, { name: 'line-n', cx: 0.47 }].forEach(function (mark) {
            var cap = parent.querySelector(':scope > .buk-snow-letter[data-letter="' + mark.name + '"]');
            if (!cap) {
                cap = document.createElement('span');
                cap.className = 'buk-snow-letter';
                cap.dataset.letter = mark.name;
                parent.appendChild(cap);
            }
            var width = rect.width * 0.045;
            var height = Math.max(3, blobH * 0.42);
            var cx = (rect.left - parentRect.left) + mark.cx * rect.width;
            var lineTop = (rect.top - parentRect.top) + 0.655 * rect.height;
            cap.style.left = (cx - width / 2) + 'px';
            cap.style.width = width + 'px';
            cap.style.height = height + 'px';
            cap.style.top = (lineTop - height * 0.35) + 'px';
            cap.style.zIndex = '6';
        });
    }

    function placeHatSnow(mobile, progress) {
        var parent = headerEl.querySelector(mobile ? '.mobile-logo-center' : '.searchbar-header__brand-badge-wrap');
        if (!parent) return;
        var hat = parent.querySelector(':scope > .buk-snow-hat');
        if (!hat) {
            hat = document.createElement('span');
            hat.className = 'buk-snow-hat';
            hat.setAttribute('aria-hidden', 'true');
            HAT_BLOBS.forEach(function (blob, index) {
                var dot = document.createElement('i');
                dot.dataset.hat = String(index);
                hat.appendChild(dot);
            });
            parent.appendChild(hat);
        }
        hat.style.visibility = progress <= 0 ? 'hidden' : 'visible';
        var grow = 0.4 + progress * 0.7;
        Array.prototype.forEach.call(hat.children, function (dot, index) {
            var blob = HAT_BLOBS[index];
            var w = blob.w * grow;
            var h = blob.h * grow;
            dot.style.width = w + '%';
            dot.style.height = h + '%';
            dot.style.left = (blob.x - w / 2) + '%';
            dot.style.top = (blob.y - h / 2) + '%';
        });
    }

    function placeSimpleCaps(mobile, progress) {
        var specs = mobile ? [
            { sel: '.mh-search-control', inset: 0.16 },
            { sel: '.mh-icon-btn', inset: 0.18 }
        ] : [
            { sel: '.header-trust-list li', inset: 0.08 },
            { sel: '.header-top-phone', inset: 0.08 },
            { sel: '.header-top-mail', inset: 0.08 },
            { sel: '.header-top-vat-toggle', inset: 0.1 },
            { sel: '.header-top .header-top-basket-link', inset: 0.12 },
            { sel: '.shop-products-btn', inset: 0.14 },
            { sel: '.searchbar-header__search-expand', inset: 0.14 }
        ];
        var depth = (mobile ? 5 : 6) + progress * (mobile ? 3 : 4);
        var lumps = [
            { x: 0, w: 16, h: 0.45 },
            { x: 10, w: 22, h: 0.95 },
            { x: 26, w: 14, h: 0.4 },
            { x: 36, w: 24, h: 0.75 },
            { x: 54, w: 13, h: 0.5 },
            { x: 64, w: 22, h: 1 },
            { x: 82, w: 18, h: 0.55 }
        ];
        specs.forEach(function (spec) {
            var nodes = headerEl.querySelectorAll(spec.sel);
            Array.prototype.forEach.call(nodes, function (el) {
                if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
                el.style.overflow = 'visible';
                var oldOval = el.querySelector(':scope > .buk-snow-cap--simple');
                if (oldOval) oldOval.remove();
                var host = el.querySelector(':scope > .buk-snow-lumps');
                if (!host) {
                    host = document.createElement('span');
                    host.className = 'buk-snow-lumps';
                    host.setAttribute('aria-hidden', 'true');
                    lumps.forEach(function () {
                        host.appendChild(document.createElement('i'));
                    });
                    el.appendChild(host);
                }
                Array.prototype.forEach.call(host.children, function (dot, index) {
                    var lump = lumps[index];
                    dot.style.left = lump.x + '%';
                    dot.style.width = lump.w + '%';
                    dot.style.height = Math.max(3, depth * lump.h) + 'px';
                });
            });
        });
    }

    function tick() {
        var progress = snowProgress(visitSeconds());
        document.documentElement.style.setProperty('--buk-snow', progress.toFixed(4));
        document.documentElement.dataset.bukSnow = progress.toFixed(3);
        document.documentElement.dataset.bukSnowVis = progress.toFixed(3);
        layoutCaps();
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
        });
        window.addEventListener('load', function () {
            mountHeader();
            mountBanners();
        });
        if (window.ResizeObserver && headerEl) {
            var resizeObserver = new ResizeObserver(function () {
                if (fieldEl) syncTravel(fieldEl.querySelector('.buk-snow-fall'), headerEl);
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
