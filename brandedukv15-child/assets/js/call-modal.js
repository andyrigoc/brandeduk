(function () {
    'use strict';

    const SCRIPT_SRC = (function () {
        try {
            return document.currentScript && document.currentScript.src ? String(document.currentScript.src) : '';
        } catch (e) {
            return '';
        }
    })();

    const DEFAULTS = {
        phoneDisplay: '020 8974 2722',
        phoneTel: '02089742722',
        desktopMinWidth: 1024,
        onlyInterceptOnDesktop: true
    };

    function isTouchLikeDevice() {
        try {
            if ((navigator.maxTouchPoints || 0) > 0) return true;
        } catch (_) {}
        return 'ontouchstart' in window;
    }

    function isLikelyMobileOrTabletUA() {
        try {
            if (navigator.userAgentData && navigator.userAgentData.mobile) return true;
        } catch (_) {}
        const ua = (navigator.userAgent || '').toLowerCase();

        // iPadOS can present as Macintosh; treat touch Macs as iPad.
        const isTouchMac = ua.includes('macintosh') && (navigator.maxTouchPoints || 0) > 1;

        return (
            /mobi|android|iphone|ipod|ipad/.test(ua) ||
            /tablet|silk|kindle/.test(ua) ||
            isTouchMac
        );
    }

    function shouldIntercept(opts) {
        if (!opts.onlyInterceptOnDesktop) return true;

        // Never intercept on touch devices (tablet included).
        if (isTouchLikeDevice() || isLikelyMobileOrTabletUA()) return false;

        // Prefer capability detection: only desktop-like pointers.
        try {
            if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return false;
            if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return false;
        } catch (_) {}

        return window.innerWidth >= opts.desktopMinWidth;
    }

    function formatTelHref(raw) {
        const digits = String(raw || '').replace(/[^0-9+]/g, '');
        return digits ? 'tel:' + digits : 'tel:';
    }

    function ensureCssLoaded() {
        try {
            if (document.querySelector('link[href*="call-modal.css"]')) return;
            if (!SCRIPT_SRC) return;

            const scriptUrl = new URL(SCRIPT_SRC, window.location.href);
            const cssUrl = new URL('../css/components/call-modal.css', scriptUrl);

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssUrl.href;
            document.head.appendChild(link);
        } catch (e) {
            // ignore
        }
    }

    function ensureModal(opts) {
        let overlay = document.getElementById('callModalOverlay');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'callModalOverlay';
        overlay.className = 'call-modal-overlay';
        overlay.innerHTML =
            '<div class="call-modal" role="dialog" aria-modal="true" aria-labelledby="callModalTitle">' +
            '  <div class="call-modal__header">' +
            '    <div>' +
            '      <h2 class="call-modal__title" id="callModalTitle">Call our team</h2>' +
            '      <p class="call-modal__subtitle">On desktop, your browser may show a system app picker. Use copy instead.</p>' +
            '    </div>' +
            '    <button class="call-modal__close" type="button" aria-label="Close">' +
            '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
            '        <line x1="18" y1="6" x2="6" y2="18"></line>' +
            '        <line x1="6" y1="6" x2="18" y2="18"></line>' +
            '      </svg>' +
            '    </button>' +
            '  </div>' +
            '  <div class="call-modal__body">' +
            '    <div class="call-modal__number">' +
            '      <div class="call-modal__number-text" id="callModalNumber"></div>' +
            '      <button class="call-modal__btn call-modal__btn--secondary" type="button" id="callModalCopyBtn">Copy</button>' +
            '    </div>' +
            '    <p class="call-modal__hint">Call us from your phone using the number above.</p>' +
            '    <div class="call-modal__actions">' +
            '      <button class="call-modal__btn call-modal__btn--secondary" type="button" id="callModalCloseBtn">Close</button>' +
            '    </div>' +
            '    <div class="call-modal__toast" id="callModalToast">Copied</div>' +
            '  </div>' +
            '</div>';

        document.body.appendChild(overlay);

        function close() {
            overlay.classList.remove('is-open');
            document.documentElement.classList.remove('is-call-modal-open');
        }

        function open(numberDisplay) {
            const numberEl = overlay.querySelector('#callModalNumber');
            if (numberEl) numberEl.textContent = numberDisplay;
            overlay.classList.add('is-open');
            document.documentElement.classList.add('is-call-modal-open');
            const closeBtn = overlay.querySelector('.call-modal__close');
            if (closeBtn) closeBtn.focus();
        }

        function showToast(text) {
            const toast = overlay.querySelector('#callModalToast');
            if (!toast) return;
            toast.textContent = text;
            toast.classList.add('is-visible');
            window.clearTimeout(showToast._t);
            showToast._t = window.setTimeout(() => toast.classList.remove('is-visible'), 1400);
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        const closeX = overlay.querySelector('.call-modal__close');
        if (closeX) closeX.addEventListener('click', close);

        const closeBtn = overlay.querySelector('#callModalCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', close);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
        });

        const copyBtn = overlay.querySelector('#callModalCopyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                const value = (overlay.querySelector('#callModalNumber')?.textContent || '').trim();
                if (!value) return;

                try {
                    await navigator.clipboard.writeText(value);
                    showToast('Copied');
                } catch (_) {
                    try {
                        const ta = document.createElement('textarea');
                        ta.value = value;
                        ta.setAttribute('readonly', '');
                        ta.style.position = 'fixed';
                        ta.style.left = '-9999px';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        ta.remove();
                        showToast('Copied');
                    } catch (err) {
                        showToast('Copy failed');
                    }
                }
            });
        }

        overlay._callModal = { open, close };
        return overlay;
    }

    function getNumberFromTelHref(href) {
        const raw = String(href || '').replace(/^tel:/i, '');
        const digits = raw.replace(/[^0-9+]/g, '');
        if (!digits) return null;
        return digits;
    }

    function displayFromDigits(digits, fallbackDisplay) {
        if (!digits) return fallbackDisplay;
        // Keep existing display if matches known number.
        if (digits === '02089742722' || digits === '+442089742722') return '020 8974 2722';
        return fallbackDisplay || digits;
    }

    function initCallModal(userOptions) {
        const opts = Object.assign({}, DEFAULTS, userOptions || {});

        ensureCssLoaded();

        document.addEventListener(
            'click',
            (e) => {
                const a = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
                if (!a) return;

                if (!shouldIntercept(opts)) return; // mobile/tablet: let the dialer open normally

                // Desktop: block system picker and show our modal.
                e.preventDefault();

                const digits = getNumberFromTelHref(a.getAttribute('href')) || opts.phoneTel;
                const display = displayFromDigits(digits, opts.phoneDisplay);

                const overlay = ensureModal(opts);
                overlay._callModal.open(display);
            },
            true
        );

        // Optional: ensure tel links are normalized (doesn't change behavior)
        document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
            const digits = getNumberFromTelHref(a.getAttribute('href'));
            if (!digits) return;
            a.setAttribute('href', formatTelHref(digits));
        });
    }

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initCallModal());
    } else {
        initCallModal();
    }
})();
