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

    function applyToBox(box, pos) {
        box.style.top    = pos.top    + '%';
        box.style.left   = pos.left   + '%';
        box.style.width  = pos.width  + '%';
        box.style.height = pos.height + '%';
        var label = box.querySelector('.marker-label');
        if (label) {
            label.textContent =
                'T:' + pos.top.toFixed(0) + '% ' +
                'L:' + pos.left.toFixed(0) + '% ' +
                'W:' + pos.width.toFixed(0) + '% ' +
                'H:' + pos.height.toFixed(0) + '%';
        }
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
        applyToBox(box, pos);

        bindDrag(box, key, preview);
        bindResize(box, key, preview);
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
        var parentRect = null;

        function onDown(e) {
            // Ignore if starting on the resize handle
            if (e.target && e.target.classList && e.target.classList.contains('marker-handle')) return;
            e.preventDefault();
            e.stopPropagation();
            dragging = true;
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
            if (!dragging || !parentRect) return;
            e.preventDefault();
            var p = pointer(e);
            var dxPct = ((p.x - startX) / parentRect.width)  * 100;
            var dyPct = ((p.y - startY) / parentRect.height) * 100;
            var newLeft = clamp(startPos.left + dxPct, -10, 110 - startPos.width);
            var newTop  = clamp(startPos.top  + dyPct, -10, 110 - startPos.height);
            state[key].left = newLeft;
            state[key].top  = newTop;
            applyToBox(box, state[key]);
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
            applyToBox(box, state[key]);
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
        });
        observer.observe(document.body, { childList: true, subtree: true });
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
