/*
 * Logo Position Marker Editor
 * --------------------------------------------------------------
 * Adds a draggable + resizable marker box to each .position-card
 * inside the #positionsPopupOverlay. The marker shows where the
 * printed/embroidered logo will sit on the garment.
 *
 * USAGE:
 *   - Drag the box body to MOVE it.
 *   - Drag the small handle in the bottom-right corner to RESIZE it.
 *   - Current top/left/width/height (in %) are shown above the box.
 *   - Open the browser console: window.dumpMarkerPositions() will
 *     print all CSS-ready percentages so they can be saved into mobile.css.
 *
 * Notes:
 *   - Disable the CSS ::after marker (or this editor will overlap it).
 *   - Initial positions come from DEFAULTS below; tweak per card.
 *   - Persists changes to localStorage so a refresh keeps them.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'logoMarkerPositions_v1';

    // Initial defaults per data-position (top, left, width, height in %)
    var DEFAULTS = {
        'left-breast':        { top: 30, left: 38, width: 12, height: 7  },
        'right-breast':       { top: 30, left: 50, width: 12, height: 7  },
        'small-centre-front': { top: 33, left: 30, width: 40, height: 9  },
        'large-front-center': { top: 28, left: 30, width: 40, height: 50 },
        'large-centre-front': { top: 28, left: 30, width: 40, height: 50 },
        'large-back':         { top: 26, left: 28, width: 44, height: 50 },
        'left-arm':           { top: 32, left: 38, width: 24, height: 8  },
        'right-arm':          { top: 32, left: 38, width: 24, height: 8  }
    };

    function loadSaved() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return {};
            return JSON.parse(raw) || {};
        } catch (e) {
            return {};
        }
    }

    function save(positions) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(positions)); }
        catch (e) { /* noop */ }
    }

    // Lock state — when true, dots render but cannot be moved.
    // Toggle from console: window.unlockMarkers() / window.lockMarkers()
    var LOCKED = true;

    // Keys that should remain draggable even when LOCKED is true.
    var UNLOCKED_KEYS = {};
    function isKeyLocked(key) {
        if (!LOCKED) return false;
        return !UNLOCKED_KEYS[key];
    }

    window.unlockMarkers = function () { LOCKED = false; console.log('Markers UNLOCKED — drag enabled'); };
    window.lockMarkers   = function () { LOCKED = true;  console.log('Markers LOCKED — drag disabled'); };

    var saved = loadSaved();
    var state = {};

    function getInitial(key) {
        if (saved[key]) return Object.assign({}, saved[key]);
        if (DEFAULTS[key]) return Object.assign({}, DEFAULTS[key]);
        return { top: 35, left: 35, width: 30, height: 15 };
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function getImg(preview) {
        return preview.querySelector('img.position-placeholder');
    }

    // Position the marker box in PIXELS relative to .position-preview,
    // but calculated from the IMAGE's rendered box. This way the dot stays
    // anchored to the same spot on the t-shirt even if the card grows /
    // shrinks (e.g. when a logo preview row appears below).
    function applyToBox(box, pos, preview) {
        if (!preview) preview = box.parentElement;
        var img = getImg(preview);
        if (!img || !img.complete || !img.naturalWidth) {
            // Fallback to % of preview until the image is ready.
            box.style.top  = pos.top  + '%';
            box.style.left = pos.left + '%';
            return;
        }
        var prevRect = preview.getBoundingClientRect();
        var imgRect  = img.getBoundingClientRect();
        var offTop   = imgRect.top  - prevRect.top;
        var offLeft  = imgRect.left - prevRect.left;
        var topPx    = offTop  + (pos.top  / 100) * imgRect.height;
        var leftPx   = offLeft + (pos.left / 100) * imgRect.width;
        box.style.top  = topPx  + 'px';
        box.style.left = leftPx + 'px';
        // width/height are fixed via CSS for the dot; ignore pos.width/height
    }

    // Keep references so we can reposition all markers when an image resizes
    var registry = []; // [{ box, key, preview, img }]
    var repositionScheduled = false;
    function scheduleReposition() {
        if (repositionScheduled) return;
        repositionScheduled = true;
        requestAnimationFrame(function () {
            repositionScheduled = false;
            registry.forEach(function (r) {
                if (!r.box.isConnected) return;
                applyToBox(r.box, state[r.key] || getInitial(r.key), r.preview);
            });
        });
    }

    function setupCard(card) {
        var key = card.getAttribute('data-position');
        if (!key) return;
        var preview = card.querySelector('.position-preview');
        if (!preview) return;
        if (preview.querySelector('.marker-edit-box')) return; // already added

        preview.style.position = 'relative';

        var box = document.createElement('div');
        box.className = 'marker-edit-box';
        box.setAttribute('data-key', key);
        box.innerHTML =
            '<div class="marker-label"></div>' +
            '<div class="marker-handle marker-handle-br"></div>';
        preview.appendChild(box);

        var pos = getInitial(key);
        state[key] = pos;
        applyToBox(box, pos, preview);

        // Reposition once the image finishes loading (rect known then)
        var img = getImg(preview);
        if (img) {
            if (!img.complete) {
                img.addEventListener('load', function () {
                    applyToBox(box, state[key], preview);
                });
            }
            // Re-anchor whenever the image's rendered size changes
            if (window.ResizeObserver) {
                try {
                    var ro = new ResizeObserver(function () {
                        applyToBox(box, state[key], preview);
                    });
                    ro.observe(img);
                    ro.observe(preview);
                } catch (e) { /* noop */ }
            }
        }

        registry.push({ box: box, key: key, preview: preview, img: img });

        if (!isKeyLocked(key)) {
            bindDrag(box, key, preview);
            bindResize(box, key, preview);
        } else {
            box.style.cursor = 'default';
            box.style.pointerEvents = 'none';
        }
    }

    function getPercent(rect, parentRect) {
        return {
            top:    ((rect.top    - parentRect.top)  / parentRect.height) * 100,
            left:   ((rect.left   - parentRect.left) / parentRect.width)  * 100,
            width:  (rect.width  / parentRect.width)  * 100,
            height: (rect.height / parentRect.height) * 100
        };
    }

    function bindDrag(box, key, parent) {
        var dragging = false;
        var startX = 0, startY = 0;
        var startPos = null;
        var imgRect = null;

        function onDown(e) {
            // Ignore if starting on the resize handle
            if (e.target && e.target.classList && e.target.classList.contains('marker-handle')) return;
            e.preventDefault();
            e.stopPropagation();
            dragging = true;
            var img = getImg(parent);
            imgRect = img ? img.getBoundingClientRect() : parent.getBoundingClientRect();
            var p = pointer(e);
            startX = p.x;
            startY = p.y;
            startPos = Object.assign({}, state[key]);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
        }

        function onMove(e) {
            if (!dragging || !imgRect) return;
            e.preventDefault();
            var p = pointer(e);
            var dxPct = ((p.x - startX) / imgRect.width)  * 100;
            var dyPct = ((p.y - startY) / imgRect.height) * 100;
            var newLeft = clamp(startPos.left + dxPct, -10, 110);
            var newTop  = clamp(startPos.top  + dyPct, -10, 110);
            state[key].left = newLeft;
            state[key].top  = newTop;
            applyToBox(box, state[key], parent);
        }

        function onUp() {
            if (!dragging) return;
            dragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
            saved[key] = Object.assign({}, state[key]);
            save(saved);
        }

        box.addEventListener('mousedown', onDown);
        box.addEventListener('touchstart', onDown, { passive: false });
    }

    function bindResize(box, key, parent) {
        var handle = box.querySelector('.marker-handle-br');
        if (!handle) return;
        var resizing = false;
        var startX = 0, startY = 0;
        var startPos = null;
        var parentRect = null;

        function onDown(e) {
            e.preventDefault();
            e.stopPropagation();
            resizing = true;
            parentRect = parent.getBoundingClientRect();
            var p = pointer(e);
            startX = p.x;
            startY = p.y;
            startPos = Object.assign({}, state[key]);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
        }

        function onMove(e) {
            if (!resizing || !parentRect) return;
            e.preventDefault();
            var p = pointer(e);
            var dxPct = ((p.x - startX) / parentRect.width)  * 100;
            var dyPct = ((p.y - startY) / parentRect.height) * 100;
            var newWidth  = clamp(startPos.width  + dxPct, 4, 110 - startPos.left);
            var newHeight = clamp(startPos.height + dyPct, 3, 110 - startPos.top);
            state[key].width  = newWidth;
            state[key].height = newHeight;
            applyToBox(box, state[key], parent);
        }

        function onUp() {
            if (!resizing) return;
            resizing = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
            saved[key] = Object.assign({}, state[key]);
            save(saved);
        }

        handle.addEventListener('mousedown', onDown);
        handle.addEventListener('touchstart', onDown, { passive: false });
    }

    function pointer(e) {
        if (e.touches && e.touches.length) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function init() {
        // Initial scan (in case popup already exists)
        scanAndSetup();

        // The popup is built dynamically by customize.js, so watch the body
        // for new nodes and (re-)setup any .position-card we find inside
        // #positionsPopupOverlay.
        var observer = new MutationObserver(function () {
            scanAndSetup();
            scheduleReposition();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Reposition on viewport changes
        window.addEventListener('resize', scheduleReposition);
        window.addEventListener('orientationchange', scheduleReposition);
    }

    function scanAndSetup() {
        var popup = document.getElementById('positionsPopupOverlay');
        if (!popup) return;
        var cards = popup.querySelectorAll('.position-card');
        cards.forEach(setupCard);
    }

    // Expose helper to dump positions as CSS-ready snippet
    window.dumpMarkerPositions = function () {
        var out = '/* Paste into mobile.css */\n';
        Object.keys(state).forEach(function (key) {
            var p = state[key];
            out +=
                '#positionsPopupOverlay .position-card[data-position="' + key + '"] .position-preview::after {\n' +
                '    top: '    + p.top.toFixed(1)    + '%;\n' +
                '    left: '   + p.left.toFixed(1)   + '%;\n' +
                '    width: '  + p.width.toFixed(1)  + '%;\n' +
                '    height: ' + p.height.toFixed(1) + '%;\n' +
                '}\n';
        });
        console.log(out);
        return out;
    };

    window.resetMarkerPositions = function () {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
