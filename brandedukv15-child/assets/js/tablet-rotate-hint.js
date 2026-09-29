/**
 * Tablet portrait rotate hint for PC pages (home-pc / shop-pc).
 * Shows on open when a touch tablet is portrait; hides on landscape or "Continue anyway".
 * Phones on mobile (<700) never load these pages under the normal desktop gate.
 */
(function setupTabletRotateHint() {
    if (window.__buTabletRotateHintInit) return;
    window.__buTabletRotateHintInit = true;

    var HINT_ID = 'buTabletRotateHint';
    var DISMISS_KEY = 'buTabletRotateHintDismissed';
    var PC_MIN = 700;

    function assetUrl(relPath) {
        try {
            var scripts = document.getElementsByTagName('script');
            for (var i = scripts.length - 1; i >= 0; i--) {
                var src = scripts[i].src || '';
                if (src.indexOf('tablet-rotate-hint.js') !== -1) {
                    return new URL('../images/ui/' + relPath, src).href;
                }
            }
        } catch (error) { /* fall through */ }
        return 'brandedukv15-child/assets/images/ui/' + relPath;
    }

    function wasDismissed() {
        try {
            return sessionStorage.getItem(DISMISS_KEY) === '1';
        } catch (error) {
            return false;
        }
    }

    function markDismissed() {
        try {
            sessionStorage.setItem(DISMISS_KEY, '1');
        } catch (error) { /* ignore */ }
    }

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
        el.setAttribute('aria-label', 'Rotate your tablet for the best experience');
        el.innerHTML = [
            '<div class="bu-tablet-rotate-hint__glass">',
            '  <div class="bu-tablet-rotate-hint__icon" aria-hidden="true">',
            '    <img src="' + assetUrl('rotate-device-hint.png') + '" alt="">',
            '  </div>',
            '  <p class="bu-tablet-rotate-hint__title">Rotate your tablet for the best experience</p>',
            '  <p class="bu-tablet-rotate-hint__sub">Please turn your device horizontally</p>',
            '  <button type="button" class="bu-tablet-rotate-hint__continue">Continue anyway</button>',
            '</div>'
        ].join('');
        document.body.appendChild(el);
        var btn = el.querySelector('.bu-tablet-rotate-hint__continue');
        if (btn) {
            btn.addEventListener('click', function () {
                markDismissed();
                syncTabletRotateHint();
            });
        }
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

    /**
     * Target tablet PC experience only:
     * - touch / coarse pointer
     * - portrait (or taller than wide)
     * - short side in tablet/PC band (≥700 desktop gate; exclude phones)
     * - long side not a giant desktop monitor
     */
    function isTabletPortrait() {
        if (!isTouchLike()) return false;
        if (!isPortrait()) return false;
        var minSide = Math.min(window.innerWidth, window.innerHeight);
        var maxSide = Math.max(window.innerWidth, window.innerHeight);
        if (minSide < PC_MIN) return false;
        if (maxSide > 1400) return false;
        return true;
    }

    function syncTabletRotateHint() {
        if (!document.body) return;
        var el = ensureHint();
        var show = !wasDismissed() && isTabletPortrait();
        el.hidden = !show;
        el.setAttribute('aria-hidden', show ? 'false' : 'true');
        document.body.classList.toggle('bu-tablet-rotate-hint-active', show);
    }

    window.syncTabletRotateHint = syncTabletRotateHint;

    function bind() {
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
