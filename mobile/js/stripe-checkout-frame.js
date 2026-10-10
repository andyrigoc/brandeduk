/**
 * Opens Stripe hosted Checkout as a top-level window.
 *
 * Hosted Checkout (ui_mode hosted) refuses to boot inside an iframe.
 * Its own app leaves the gray skeleton up and logs:
 * "Stripe Checkout is not able to run in an iFrame. Please redirect
 * to Checkout at the top level."
 *
 * A 480px window is still a top-level page, so the real form loads,
 * and it stays under Stripe's two-column breakpoint so the card form
 * sits in one centred column instead of on the right of a wide screen.
 * Card fields stay inside Stripe. We do not rebuild them.
 */
(function () {
    'use strict';

    var STYLE_ID = 'stripe-checkout-frame-style';
    var NOTICE_ID = 'stripe-checkout-notice';
    var watchTimer = 0;
    var activeWindow = null;

    function isStripeCheckoutUrl(url) {
        try {
            var parsed = new URL(url, window.location.href);
            return parsed.protocol === 'https:' && parsed.hostname === 'checkout.stripe.com';
        } catch (e) {
            return false;
        }
    }

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            '#' + NOTICE_ID + ' {',
            '  position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);',
            '  z-index: 10000; max-width: min(440px, calc(100% - 24px));',
            '  display: flex; align-items: center; gap: 12px;',
            '  padding: 12px 14px; border-radius: 999px;',
            '  background: #fff; color: #243044;',
            '  border: 1px solid #e5e7eb; box-shadow: 0 8px 24px rgba(1, 51, 101, 0.12);',
            '  font: 400 14px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
            '}',
            '#' + NOTICE_ID + '[hidden] { display: none !important; }',
            '#' + NOTICE_ID + ' button {',
            '  flex: 0 0 auto; border: 0; background: #013365; color: #fff;',
            '  border-radius: 999px; padding: 8px 14px; cursor: pointer;',
            '  font: 400 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    function ensureNotice() {
        ensureStyle();
        var notice = document.getElementById(NOTICE_ID);
        if (notice) return notice;
        notice = document.createElement('div');
        notice.id = NOTICE_ID;
        notice.hidden = true;
        notice.innerHTML = '<span>Secure payment is open in the centred window.</span>'
            + '<button type="button" id="stripe-checkout-focus">Show window</button>';
        document.body.appendChild(notice);
        document.getElementById('stripe-checkout-focus').addEventListener('click', function () {
            window.focusCenteredStripeCheckout();
        });
        return notice;
    }

    function showNotice() {
        var notice = ensureNotice();
        notice.hidden = false;
    }

    function hideNotice() {
        var notice = document.getElementById(NOTICE_ID);
        if (notice) notice.hidden = true;
    }

    function closeActive() {
        try {
            if (activeWindow && !activeWindow.closed) activeWindow.close();
        } catch (e) {}
        activeWindow = null;
        if (watchTimer) {
            clearInterval(watchTimer);
            watchTimer = 0;
        }
        hideNotice();
    }

    function isReturnUrl(href) {
        try {
            var parsed = new URL(href);
            if (parsed.origin !== window.location.origin) return false;
            var path = parsed.pathname || '';
            return path.indexOf('payment-success') !== -1 || path.indexOf('payment-cancel') !== -1;
        } catch (e) {
            return false;
        }
    }

    function watch(win) {
        if (watchTimer) clearInterval(watchTimer);
        activeWindow = win;
        watchTimer = setInterval(function () {
            if (!win || win.closed) {
                clearInterval(watchTimer);
                watchTimer = 0;
                activeWindow = null;
                hideNotice();
                if (typeof window.onCenteredStripeCheckoutClosed === 'function') {
                    try { window.onCenteredStripeCheckoutClosed(); } catch (e) {}
                }
                return;
            }
            var href = '';
            try {
                href = win.location.href;
            } catch (e) {
                return;
            }
            if (!href || href === 'about:blank') return;
            if (isReturnUrl(href)) {
                clearInterval(watchTimer);
                watchTimer = 0;
                window.location.replace(href);
            }
        }, 400);
    }

    window.openCenteredStripeCheckout = function () {
        // Phones are already a single column. A popup there is easy to lose,
        // so the caller navigates this tab instead.
        if (window.innerWidth < 992) return null;
        var width = 480;
        var availW = window.screen.availWidth || window.innerWidth || width;
        var availH = window.screen.availHeight || window.innerHeight || 800;
        var availLeft = window.screen.availLeft || 0;
        var availTop = window.screen.availTop || 0;
        var height = Math.max(640, Math.min(availH - 80, 940));
        var left = Math.round(availLeft + Math.max(0, (availW - width) / 2));
        var top = Math.round(availTop + Math.max(0, (availH - height) / 2));
        var features = [
            'popup=yes',
            'width=' + width,
            'height=' + height,
            'left=' + left,
            'top=' + top,
            'resizable=yes',
            'scrollbars=yes'
        ].join(',');
        var win = null;
        try {
            win = window.open('about:blank', 'brandedukStripeCheckout', features);
        } catch (e) {
            return null;
        }
        if (!win || win.closed) return null;
        try {
            win.document.open();
            win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Secure payment</title></head><body style="margin:0;background:#fff;color:#243044;font:400 15px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">Loading secure payment…</body></html>');
            win.document.close();
        } catch (e) {}
        return win;
    };

    window.focusCenteredStripeCheckout = function () {
        try {
            if (activeWindow && !activeWindow.closed) {
                activeWindow.focus();
                return true;
            }
        } catch (e) {}
        return false;
    };

    /**
     * @returns {boolean} true when Checkout was handed to a centred window.
     *                    false when this tab is navigating to Checkout.
     */
    window.mountCenteredStripeCheckout = function (url, payWindow) {
        if (!isStripeCheckoutUrl(url)) {
            try {
                if (payWindow && !payWindow.closed) payWindow.close();
            } catch (e) {}
            window.location.href = url;
            return false;
        }

        var win = (payWindow && !payWindow.closed) ? payWindow : null;
        if (!win) {
            try {
                if (payWindow && !payWindow.closed) payWindow.close();
            } catch (e) {}
            window.location.href = url;
            return false;
        }

        try {
            win.location.href = url;
            win.focus();
        } catch (e) {
            window.location.href = url;
            return false;
        }

        showNotice();
        watch(win);
        return true;
    };

    window.closeCenteredStripeCheckout = function () {
        closeActive();
    };
})();
