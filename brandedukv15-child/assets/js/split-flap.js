/**
 * Split-flap board.
 * Usage: <span class="buk-sf__board" data-buk-split-flap data-messages="FIRST|SECOND"></span>
 * Optional: data-hold (ms between messages), data-static-index (message shown for reduced motion;
 * defaults to the last one). Animates only while the board is on screen and the tab is visible.
 */
(function () {
    'use strict';

    var CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var FLIP_MS = 120;
    var STAGGER_MS = 60;
    var RANDOM_FLIPS = 8;
    var DEFAULT_HOLD_MS = 2800;

    var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var boards = [];

    function reducedMotion() {
        return !!(motionQuery && motionQuery.matches);
    }

    function sleep(ms) {
        return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
    }

    function display(ch) {
        return ch === ' ' ? '\u00A0' : ch;
    }

    function randomChar() {
        return CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }

    function readInt(el, key, fallback) {
        var n = parseInt(el.dataset[key], 10);
        return isNaN(n) ? fallback : n;
    }

    function createTile(ch) {
        var element = document.createElement('span');
        element.className = 'buk-sf__tile';
        element.innerHTML =
            '<span class="buk-sf__half buk-sf__half--top"><span class="buk-sf__char"></span></span>' +
            '<span class="buk-sf__half buk-sf__half--bottom"><span class="buk-sf__char"></span></span>' +
            '<span class="buk-sf__flap buk-sf__flap--front"><span class="buk-sf__char"></span></span>' +
            '<span class="buk-sf__flap buk-sf__flap--back"><span class="buk-sf__char"></span></span>';
        var tile = { element: element, chars: Array.prototype.slice.call(element.querySelectorAll('.buk-sf__char')), current: ch };
        setTile(tile, ch);
        return tile;
    }

    function setTile(tile, ch) {
        tile.current = ch;
        tile.chars.forEach(function (span) { span.textContent = display(ch); });
        tile.element.classList.remove('is-flipping');
    }

    function createBoard(el) {
        var messages = (el.dataset.messages || '').split('|')
            .map(function (m) { return m.trim().toUpperCase(); })
            .filter(Boolean);
        if (!messages.length) return null;

        var width = Math.max.apply(null, messages.map(function (m) { return m.length; }));
        var normalized = messages.map(function (m) { return m.padEnd(width, ' '); });
        var staticIndex = Math.min(Math.max(readInt(el, 'staticIndex', normalized.length - 1), 0), normalized.length - 1);
        var holdMs = Math.max(readInt(el, 'hold', DEFAULT_HOLD_MS), 500);

        var state = {
            el: el,
            inView: !('IntersectionObserver' in window),
            index: reducedMotion() ? staticIndex : 0,
            generation: 0,
            waiters: []
        };

        var tiles = [];
        var fragment = document.createDocumentFragment();
        normalized[state.index].split('').forEach(function (ch) {
            var tile = createTile(ch);
            tiles.push(tile);
            fragment.appendChild(tile.element);
        });
        el.textContent = '';
        el.appendChild(fragment);
        el.classList.add('is-ready');

        function isActive() {
            return state.inView && !document.hidden && !reducedMotion();
        }

        function waitUntilActive() {
            if (isActive()) return Promise.resolve();
            return new Promise(function (resolve) { state.waiters.push(resolve); });
        }

        function showInstant(message) {
            state.generation++;
            tiles.forEach(function (tile, i) { setTile(tile, message[i]); });
        }

        async function flipOnce(tile, next, gen) {
            var c = tile.chars;
            c[0].textContent = display(tile.current);
            c[1].textContent = display(next);
            c[2].textContent = display(tile.current);
            c[3].textContent = display(next);
            tile.element.classList.remove('is-flipping');
            void tile.element.offsetWidth;
            tile.element.classList.add('is-flipping');
            await sleep(FLIP_MS);
            if (gen === state.generation) setTile(tile, next);
        }

        async function animateTile(tile, target, i, gen) {
            if (tile.current === target) return;
            await sleep(i * STAGGER_MS);
            for (var n = 0; n < RANDOM_FLIPS; n++) {
                if (gen !== state.generation) return;
                await flipOnce(tile, randomChar(), gen);
            }
            if (gen !== state.generation) return;
            await flipOnce(tile, target, gen);
        }

        async function loop() {
            for (;;) {
                await waitUntilActive();
                await sleep(holdMs);
                if (!isActive()) continue;
                state.index = (state.index + 1) % normalized.length;
                var gen = state.generation;
                var target = normalized[state.index];
                await Promise.all(tiles.map(function (tile, i) { return animateTile(tile, target[i], i, gen); }));
            }
        }

        state.update = function () {
            if (reducedMotion()) {
                state.index = staticIndex;
                showInstant(normalized[staticIndex]);
                return;
            }
            if (isActive()) {
                state.waiters.splice(0).forEach(function (resolve) { resolve(); });
            }
        };

        loop();
        return state;
    }

    function init() {
        var els = document.querySelectorAll('[data-buk-split-flap]');
        Array.prototype.forEach.call(els, function (el) {
            if (el.dataset.bukSfReady) return;
            el.dataset.bukSfReady = '1';
            var board = createBoard(el);
            if (board) boards.push(board);
        });
        if (!boards.length) return;

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    boards.forEach(function (board) {
                        if (board.el !== entry.target) return;
                        board.inView = entry.isIntersecting;
                        board.update();
                    });
                });
            });
            boards.forEach(function (board) { observer.observe(board.el); });
        }

        document.addEventListener('visibilitychange', function () {
            boards.forEach(function (board) { board.update(); });
        });

        if (motionQuery) {
            var onMotionChange = function () { boards.forEach(function (board) { board.update(); }); };
            if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
            else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
