/**
 * Tablet portrait rotate hint — PC pages ONLY (home-pc / shop-pc).
 *
 * Mobile phones (normal dimensions, width < 700 → index-mobile / mobile/*)
 * stay on the existing mobile system and must never load or show this.
 * Tablets are part of the PC experience; this overlay only helps them
 * rotate to landscape on PC pages.
 *
 * No dismiss / "Continue anyway": portrait tablets stay locked on the
 * blurry gate until they rotate to landscape.
 *
 * Animation beat (CSS):
 *  0–1s → only “Rotate / Your / Screen” + divider
 *  1s+  → device appears and rotates with room so edges never clip
 */
(function setupTabletRotateHint() {
    if (window.__buTabletRotateHintInit) return;
    // Hard stop: never attach on mobile routes.
    try {
        var path = String(location.pathname || '');
        if (/index-mobile\.html|(?:^|\/)mobile\//i.test(path)) return;
    } catch (error) { /* continue */ }
    window.__buTabletRotateHintInit = true;

    var HINT_ID = 'buTabletRotateHint';
    var PC_MIN = 700;
    var scrollLockY = 0;

    function ensureHint() {
        var el = document.getElementById(HINT_ID);
        if (el) return el;
        el = document.createElement('div');
        el.id = HINT_ID;
        el.className = 'bu-tablet-rotate-hint';
        el.hidden = true;
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-label', 'Rotate your screen for the best experience');
        el.innerHTML = [
            '<div class="bu-tablet-rotate-hint__glass">',
            '  <div class="bu-tablet-rotate-hint__stage" aria-hidden="true">',
            '    <div class="bu-tablet-rotate-hint__rail">',
            '      <div class="bu-tablet-rotate-hint__copy">',
            '        <span class="bu-tablet-rotate-hint__line">Rotate</span>',
            '        <span class="bu-tablet-rotate-hint__line">Your</span>',
            '        <span class="bu-tablet-rotate-hint__line bu-tablet-rotate-hint__line--accent">Screen</span>',
            '      </div>',
            '      <div class="bu-tablet-rotate-hint__divider"></div>',
            '      <div class="bu-tablet-rotate-hint__motion">',
            '        <div class="bu-tablet-rotate-hint__spin">',
            '          <svg class="bu-tablet-rotate-hint__device" viewBox="0 0 120 200" width="120" height="200" focusable="false">',
            '            <rect x="14" y="10" width="92" height="180" rx="16" ry="16" fill="none" stroke="currentColor" stroke-width="6"/>',
            '            <rect x="38" y="22" width="44" height="8" rx="4" ry="4" fill="currentColor"/>',
            '            <rect x="46" y="168" width="28" height="6" rx="3" ry="3" fill="currentColor" opacity="0.55"/>',
            '            <rect x="4" y="52" width="8" height="28" rx="3" ry="3" fill="currentColor" opacity="0.7"/>',
            '            <rect x="4" y="92" width="8" height="42" rx="3" ry="3" fill="currentColor" opacity="0.7"/>',
            '            <rect x="108" y="70" width="8" height="48" rx="3" ry="3" fill="currentColor" opacity="0.7"/>',
            '          </svg>',
            '          <svg class="bu-tablet-rotate-hint__arrows" viewBox="0 0 220 220" width="220" height="220" focusable="false">',
            '            <path d="M150 42c34 10 58 42 58 78" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>',
            '            <path d="M198 102l18 18-28 4z" fill="currentColor"/>',
            '            <path d="M70 178c-34-10-58-42-58-78" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>',
            '            <path d="M22 118L4 100l28-4z" fill="currentColor"/>',
            '          </svg>',
            '        </div>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
        document.body.appendChild(el);
        // Block scroll/gesture bleed-through to the page behind the overlay.
        el.addEventListener('touchmove', function (event) {
            event.preventDefault();
        }, { passive: false });
        el.addEventListener('wheel', function (event) {
            event.preventDefault();
        }, { passive: false });
        return el;
    }

    function isPortrait() {
        try {
            if (window.matchMedia('(orientation: portrait)').matches) return true;
        } catch (error) { /* fall through */ }
        return window.innerHeight > window.innerWidth;
    }

    function isTouchLike() {
        var touchPoints = Number(navigator.maxTouchPoints || 0);
        var coarse = false;
        try {
            coarse = window.matchMedia('(pointer: coarse)').matches;
        } catch (error) { /* ignore */ }
        return touchPoints >= 1 || coarse;
    }

    function isTabletPortrait() {
        if (!isTouchLike()) return false;
        if (!isPortrait()) return false;
        var minSide = Math.min(window.innerWidth, window.innerHeight);
        var maxSide = Math.max(window.innerWidth, window.innerHeight);
        if (minSide < PC_MIN) return false;
        if (maxSide > 1400) return false;
        return true;
    }

    function lockPageScroll(lock) {
        var root = document.documentElement;
        if (!document.body || !root) return;
        if (lock) {
            if (!document.body.classList.contains('bu-tablet-rotate-hint-active')) {
                scrollLockY = window.scrollY || window.pageYOffset || 0;
            }
            root.classList.add('bu-tablet-rotate-hint-active');
            document.body.classList.add('bu-tablet-rotate-hint-active');
            document.body.style.top = '-' + scrollLockY + 'px';
        } else {
            root.classList.remove('bu-tablet-rotate-hint-active');
            document.body.classList.remove('bu-tablet-rotate-hint-active');
            document.body.style.top = '';
            if (scrollLockY) {
                window.scrollTo(0, scrollLockY);
                scrollLockY = 0;
            }
        }
    }

    function restartAnim(el) {
        var stage = el.querySelector('.bu-tablet-rotate-hint__stage');
        if (!stage) return;
        stage.classList.remove('bu-tablet-rotate-hint__stage--run');
        // Force reflow so the CSS animation restarts cleanly.
        void stage.offsetWidth;
        stage.classList.add('bu-tablet-rotate-hint__stage--run');
    }

    function syncTabletRotateHint() {
        if (!document.body) return;
        var el = ensureHint();
        var show = isTabletPortrait();
        var wasHidden = el.hidden;
        el.hidden = !show;
        el.setAttribute('aria-hidden', show ? 'false' : 'true');
        lockPageScroll(show);
        if (show) {
            if (wasHidden) restartAnim(el);
        } else {
            var stage = el.querySelector('.bu-tablet-rotate-hint__stage');
            if (stage) stage.classList.remove('bu-tablet-rotate-hint__stage--run');
        }
    }

    window.syncTabletRotateHint = syncTabletRotateHint;

    function bind() {
        // Clear any legacy dismiss so a previous "Continue anyway" cannot stick.
        try { sessionStorage.removeItem('buTabletRotateHintDismissed'); } catch (error) { /* ignore */ }

        window.addEventListener('orientationchange', function () {
            window.setTimeout(syncTabletRotateHint, 60);
            window.setTimeout(syncTabletRotateHint, 280);
        });
        window.addEventListener('resize', syncTabletRotateHint, { passive: true });
        syncTabletRotateHint();
        window.setTimeout(syncTabletRotateHint, 0);
        window.setTimeout(syncTabletRotateHint, 320);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})();
