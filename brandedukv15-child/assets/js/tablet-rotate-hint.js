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
 * Video beat (rotate-device-hint.mp4):
 *  0–1s → only “Rotate / Your / Phone” + divider
 *  1s+  → tablet appears and rotates
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

    function playVideo(vid) {
        if (!vid) return;
        vid.muted = true;
        try {
            var p = vid.play();
            if (p && p.catch) p.catch(function () { /* autoplay blocked */ });
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
            '  <div class="bu-tablet-rotate-hint__media" aria-hidden="true">',
            '    <video class="bu-tablet-rotate-hint__video"',
            '      src="' + assetUrl('rotate-device-hint.mp4') + '"',
            '      autoplay muted loop playsinline preload="auto"',
            '      disablepictureinpicture',
            '      controlslist="nodownload noplaybackrate noremoteplayback"></video>',
            '  </div>',
            '</div>'
        ].join('');
        document.body.appendChild(el);
        var vid = el.querySelector('.bu-tablet-rotate-hint__video');
        if (vid) {
            vid.setAttribute('muted', '');
            vid.addEventListener('loadeddata', function () { playVideo(vid); }, { once: true });
        }
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

    function syncTabletRotateHint() {
        if (!document.body) return;
        var el = ensureHint();
        var show = isTabletPortrait();
        var wasHidden = el.hidden;
        el.hidden = !show;
        el.setAttribute('aria-hidden', show ? 'false' : 'true');
        lockPageScroll(show);
        var vid = el.querySelector('.bu-tablet-rotate-hint__video');
        if (show && vid) {
            // Restart from text-only intro whenever the hint opens.
            if (wasHidden) {
                try { vid.currentTime = 0; } catch (error) { /* ignore */ }
            }
            playVideo(vid);
        } else if (vid) {
            try { vid.pause(); } catch (error) { /* ignore */ }
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
