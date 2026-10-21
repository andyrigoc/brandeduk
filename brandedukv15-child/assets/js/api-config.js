/**
 * BrandedUK — API base URL (single source of truth)
 *
 * Production / Vercel: https://api.brandeduk.com
 *
 * Local preview (127.0.0.1 / localhost, any port):
 *   localhost:3005 (scripts/api-cors-proxy.js; start with `npm run api-proxy`)
 *
 * Direct browser calls to api.brandeduk.com fail with HTTP 403 because CORS_ORIGIN
 * allow-lists only www.brandeduk.com / brandeduk.com (Guardian CORS scope).
 *
 * Opt out of local proxy (needs DigitalOcean CORS_ORIGIN to include local origin):
 *   window.API_USE_LOCAL_PROXY = false;  // before this script
 *
 * Local Node backend:
 *   window.API_USE_LOCAL = true;   // → http://localhost:3004
 *
 * Manual override:
 *   window.API_BASE_URL = 'http://localhost:3004';
 */
(function (window) {
    'use strict';

    var PRODUCTION_API = 'https://api.brandeduk.com';
    var LOCAL_API = 'http://localhost:3004';
    var LOCAL_CORS_PROXY = 'http://127.0.0.1:3005';

    function isLocalHost() {
        var host = (window.location && window.location.hostname) || '';
        return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '';
    }

    function isLocalHttpPreview() {
        var protocol = (window.location && window.location.protocol) || '';
        return isLocalHost() && (protocol === 'http:' || protocol === 'https:');
    }

    function resolveBrandedApiBase() {
        if (window.API_BASE_URL) {
            return String(window.API_BASE_URL).replace(/\/+$/, '');
        }
        if (window.API_USE_LOCAL === true) {
            return LOCAL_API;
        }
        // Local static servers (including VS Code Live Server) cannot proxy API
        // requests, so always use the local CORS bridge regardless of port.
        if (isLocalHttpPreview() && window.API_USE_LOCAL_PROXY !== false) {
            return LOCAL_CORS_PROXY;
        }
        return PRODUCTION_API;
    }

    window.resolveBrandedApiBase = resolveBrandedApiBase;
    window.BRANDED_PRODUCTION_API = PRODUCTION_API;
    window.BRANDED_LOCAL_API = LOCAL_API;
    window.BRANDED_LOCAL_CORS_PROXY = LOCAL_CORS_PROXY;
    // Eager default for scripts that read API_BASE_URL directly.
    if (!window.API_BASE_URL) {
        window.API_BASE_URL = resolveBrandedApiBase();
    }
})(window);
