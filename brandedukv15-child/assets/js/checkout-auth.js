/**
 * BrandedUK — Checkout Google OAuth (isolated module)
 *
 * DO NOT add fetch() pre-checks, health probes, or extra redirects here.
 * Only: save return path → redirect to API /auth/google.
 *
 * Loaded by checkout.html. Other checkout logic stays in the page script.
 */
(function (window) {
    'use strict';

    function resolveApiBase() {
        if (typeof window.resolveBrandedApiBase === 'function') {
            return window.resolveBrandedApiBase();
        }
        return (window.API_BASE_URL || 'https://api.brandeduk.com').replace(/\/+$/, '');
    }

    function startGoogleAuth() {
        var basePath = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? '/checkout.html'
            : '/checkout';
        var returnTo = basePath + (location.search || '') + (location.hash || '');
        try {
            localStorage.setItem('authReturnTo', returnTo);
        } catch (e) { /* private mode */ }
        var url = resolveApiBase() + '/auth/google';
        if (typeof window.coToast === 'function') {
            window.coToast('Connecting to Google…');
        }
        window.location.href = url;
    }

    window.BrandedCheckoutAuth = {
        apiBase: resolveApiBase,
        startGoogle: startGoogleAuth
    };

    /** Stable global for onclick handlers — do not redefine in checkout.html */
    window.coStartGoogleAuth = startGoogleAuth;
})(window);
