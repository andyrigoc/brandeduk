/* Mobile product page: pinch, pan and double-tap zoom inside the main image box (#mainImageZoom).
   No popup: the photo scales in place from 1x to 4x and the box clips it.
   Any change of #mainImage src (colour swatch, gallery thumb, product load) resets it to 1x. */
(function () {
    'use strict';

    var frame = document.getElementById('mainImageZoom');
    var img = document.getElementById('mainImage');
    if (!frame || !img || !frame.contains(img)) return;

    var MAX_SCALE = 4;
    var DOUBLE_TAP_SCALE = 2.5;
    var TAP_SLOP = 10;
    var TAP_MS = 300;
    var DOUBLE_TAP_MS = 350;
    var DOUBLE_TAP_SLOP = 40;
    var EASE_MS = 220;

    var scale = 1;
    var tx = 0;
    var ty = 0;
    var mode = '';          // '' | 'tap' (1x, one finger) | 'pan' | 'pinch' | 'hold' (wait for fingers up)
    var start = null;
    var tap = null;
    var lastTap = null;
    var box = null;
    var raf = 0;
    var easeTimer = 0;
    var frameW = frame.clientWidth;
    var frameH = frame.clientHeight;

    function insideTouches(list) {
        var out = [];
        for (var i = 0; i < list.length; i++) {
            if (frame.contains(list[i].target)) out.push(list[i]);
        }
        return out;
    }

    function offset(token, free) {
        if (token === 'left' || token === 'top') return 0;
        if (token === 'right' || token === 'bottom') return free;
        var n = parseFloat(token);
        if (isNaN(n)) return free / 2;
        return token.slice(-1) === '%' ? free * n / 100 : n;
    }

    // Photo area inside the <img> box: object-fit: contain can letterbox it.
    function measure() {
        var fr = frame.getBoundingClientRect();
        var cs = getComputedStyle(img);
        var ew = parseFloat(cs.width) || fr.width;
        var eh = parseFloat(cs.height) || fr.height;
        var b = { w: fr.width, h: fr.height, x: img.offsetLeft, y: img.offsetTop, cw: ew, ch: eh };
        if (img.naturalWidth && img.naturalHeight && cs.objectFit === 'contain') {
            var r = Math.min(ew / img.naturalWidth, eh / img.naturalHeight);
            var pos = (cs.objectPosition || '50% 50%').split(' ');
            b.cw = img.naturalWidth * r;
            b.ch = img.naturalHeight * r;
            b.x += offset(pos[0], ew - b.cw);
            b.y += offset(pos[1], eh - b.ch);
        }
        return b;
    }

    // Photo edges stay on or outside the box edges; a photo smaller than the box stays fully in view.
    function clampAxis(t, s, from, len, frameLen) {
        var a = -s * from;
        var b = frameLen - s * (from + len);
        return s * len >= frameLen ? Math.min(a, Math.max(b, t)) : Math.min(b, Math.max(a, t));
    }

    function clampX(t, s) { return clampAxis(t, s, box.x, box.cw, box.w); }
    function clampY(t, s) { return clampAxis(t, s, box.y, box.ch, box.h); }

    function apply() {
        var easing = frame.classList.contains('is-easing');
        frame.classList.toggle('is-zoomed', scale > 1.001);
        img.style.transform = (scale === 1 && tx === 0 && ty === 0 && !easing)
            ? ''
            : 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + scale + ')';
    }

    function schedule() {
        if (!raf) raf = requestAnimationFrame(function () { raf = 0; apply(); });
    }

    function idle() {
        if (!frame.classList.contains('is-easing')) frame.classList.remove('is-active');
    }

    function endEase() {
        frame.classList.remove('is-easing');
        if (!mode) frame.classList.remove('is-active');
        apply();
    }

    // Gesture over: anything under 1.01x eases back to exactly 1x so page scrolling returns.
    function finish() {
        if (scale === 1 && tx === 0 && ty === 0) idle();
        else if (scale < 1.01) easeTo(1, 0, 0);
        else {
            idle();
            apply();
        }
    }

    function easeTo(s, x, y) {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        scale = s;
        tx = x;
        ty = y;
        frame.classList.add('is-active', 'is-easing');
        apply();
        clearTimeout(easeTimer);
        easeTimer = setTimeout(endEase, EASE_MS + 50);
    }

    // A finger landing mid-ease continues from what is on screen, not from the ease target.
    function stopEase() {
        if (!frame.classList.contains('is-easing')) return;
        clearTimeout(easeTimer);
        var m = /\(([^)]*)\)/.exec(getComputedStyle(img).transform || '');
        var v = m ? m[1].split(',').map(parseFloat) : [1, 0, 0, 1, 0, 0];
        var is3d = v.length === 16;
        scale = v[0];
        tx = v[is3d ? 12 : 4];
        ty = v[is3d ? 13 : 5];
        frame.classList.remove('is-easing');
        apply();
    }

    function reset() {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        clearTimeout(easeTimer);
        scale = 1;
        tx = 0;
        ty = 0;
        if (mode === 'pinch' || mode === 'pan') mode = 'hold';
        tap = null;
        lastTap = null;
        frame.classList.remove('is-zoomed', 'is-active', 'is-easing');
        img.style.transform = '';
    }

    function beginPinch(a, b) {
        var r = frame.getBoundingClientRect();
        box = measure();
        start = {
            s: scale,
            x: tx,
            y: ty,
            d: Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)),
            mx: (a.clientX + b.clientX) / 2 - r.left,
            my: (a.clientY + b.clientY) / 2 - r.top
        };
        mode = 'pinch';
        tap = null;
        lastTap = null;
        frame.classList.add('is-active');
    }

    // The photo point under the starting midpoint follows the fingers' midpoint.
    function pinchMove(a, b) {
        var r = frame.getBoundingClientRect();
        var s = start.s * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / start.d;
        if (s > MAX_SCALE) s = MAX_SCALE;
        else if (s < 1) s = 1 - (1 - s) / 2;
        var x = (a.clientX + b.clientX) / 2 - r.left - (start.mx - start.x) / start.s * s;
        var y = (a.clientY + b.clientY) / 2 - r.top - (start.my - start.y) / start.s * s;
        if (s >= 1) {
            x = clampX(x, s);
            y = clampY(y, s);
        }
        scale = s;
        tx = x;
        ty = y;
        schedule();
    }

    function beginPan(t) {
        box = measure();
        start = { x: tx, y: ty, px: t.clientX, py: t.clientY };
        mode = 'pan';
        frame.classList.add('is-active');
    }

    function panMove(t) {
        tx = clampX(start.x + t.clientX - start.px, scale);
        ty = clampY(start.y + t.clientY - start.py, scale);
        schedule();
    }

    function toggleZoom(clientX, clientY) {
        if (scale > 1.001) {
            easeTo(1, 0, 0);
            return;
        }
        var r = frame.getBoundingClientRect();
        var s = DOUBLE_TAP_SCALE;
        var px = (clientX - r.left - tx) / scale;
        var py = (clientY - r.top - ty) / scale;
        box = measure();
        easeTo(s, clampX(box.w / 2 - px * s, s), clampY(box.h / 2 - py * s, s));
    }

    function onTap(e, p) {
        var now = Date.now();
        if (lastTap && now - lastTap.time < DOUBLE_TAP_MS &&
            Math.abs(p.x - lastTap.x) < DOUBLE_TAP_SLOP && Math.abs(p.y - lastTap.y) < DOUBLE_TAP_SLOP) {
            lastTap = null;
            if (e.cancelable) e.preventDefault();
            toggleZoom(p.x, p.y);
            return;
        }
        lastTap = { x: p.x, y: p.y, time: now };
    }

    function onStart(e) {
        var t = insideTouches(e.touches);
        if (!t.length || !frame.clientWidth || !frame.clientHeight) return;
        // Easing back to 1x: land there now so this finger scrolls the page.
        if (t.length === 1 && scale === 1 && frame.classList.contains('is-easing')) {
            clearTimeout(easeTimer);
            endEase();
        }
        stopEase();
        if (t.length >= 2) {
            beginPinch(t[0], t[1]);
            if (e.cancelable) e.preventDefault();
            return;
        }
        tap = { x: t[0].clientX, y: t[0].clientY, time: Date.now() };
        if (scale > 1.001) beginPan(t[0]);
        else mode = 'tap';
    }

    function onMove(e) {
        if (!mode) return;
        var t = insideTouches(e.touches);
        if (tap && t.length && Math.hypot(t[0].clientX - tap.x, t[0].clientY - tap.y) > TAP_SLOP) tap = null;
        // 1x: one finger scrolls the page exactly as before.
        if (mode === 'tap') return;
        if (e.cancelable) e.preventDefault();
        if (mode === 'pinch' && t.length >= 2) pinchMove(t[0], t[1]);
        else if (mode === 'pan' && t.length === 1) panMove(t[0]);
    }

    function onEnd(e) {
        if (!mode) return;
        var t = insideTouches(e.touches);
        if (mode === 'pinch') {
            if (t.length >= 2) {
                beginPinch(t[0], t[1]);
            } else if (t.length === 1 && scale >= 1.01) {
                beginPan(t[0]);
            } else {
                mode = t.length ? 'hold' : '';
                finish();
            }
            return;
        }
        if (t.length) return;
        var p = tap;
        var wasTap = mode !== 'hold' && e.type === 'touchend' && p && Date.now() - p.time < TAP_MS;
        mode = '';
        tap = null;
        finish();
        if (wasTap) onTap(e, p);
    }

    function prevent(e) {
        e.preventDefault();
    }

    function onResize() {
        var w = frame.clientWidth;
        var h = frame.clientHeight;
        if (w === frameW && h === frameH) return;
        frameW = w;
        frameH = h;
        reset();
    }

    var active = { passive: false };
    frame.addEventListener('touchstart', onStart, active);
    frame.addEventListener('touchmove', onMove, active);
    frame.addEventListener('touchend', onEnd, active);
    frame.addEventListener('touchcancel', onEnd, active);
    // iOS Safari ignores user-scalable=no and would zoom the whole page on a pinch over the photo.
    frame.addEventListener('gesturestart', prevent, active);
    frame.addEventListener('gesturechange', prevent, active);
    frame.addEventListener('contextmenu', function (e) {
        if (scale > 1.001) e.preventDefault();
    });

    new MutationObserver(reset).observe(img, { attributes: true, attributeFilter: ['src', 'srcset'] });
    // Re-tapping the colour already shown leaves src as it is, but should still show the whole garment.
    document.addEventListener('click', function (e) {
        var el = e.target;
        if (el && el.closest && el.closest('#colorOptions .color-btn, .gallery-thumbs .thumb')) reset();
    }, true);
    window.addEventListener('orientationchange', reset);
    window.addEventListener('resize', onResize);
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(frame);
})();
