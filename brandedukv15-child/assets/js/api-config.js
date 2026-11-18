/**
 * BrandedUK — API base URL (single source of truth)
 *
 * Production (www.brandeduk.com / brandeduk.com): https://api.brandeduk.com
 *
 * Local preview (localhost, 127.0.0.1, ::1), on any port:
 *   same-origin /__api → api.brandeduk.com
 *   `node scripts/dev-server.js` implements that proxy. The port is whatever
 *   DEV_PORT is (5510, 5522, …). Do not hardcode 5510 and do not send the
 *   browser to http://127.0.0.1:3005 — that process is not the dev server.
 *   A phone on the LAN (http://192.168.x.x:…) still uses port 3005 on that host.
 *
 * Direct browser calls to api.brandeduk.com fail with HTTP 403 because CORS_ORIGIN
 * allow-lists only www.brandeduk.com / brandeduk.com.
 *
 * Opt out of the local proxy (needs DigitalOcean CORS_ORIGIN to include the local origin):
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
    var LOCAL_CORS_PROXY = '/__api';
    var LOCAL_CORS_PROXY_ORIGIN = 'http://127.0.0.1:3005';

    function isLocalHost() {
        var host = (window.location && window.location.hostname) || '';
        return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '';
    }

    function isPrivateLanHost() {
        var host = (window.location && window.location.hostname) || '';
        return /^(?:10\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}$/.test(host);
    }

    function isLocalHttpPreview() {
        var protocol = (window.location && window.location.protocol) || '';
        return (isLocalHost() || isPrivateLanHost()) && (protocol === 'http:' || protocol === 'https:');
    }

    function resolveBrandedApiBase() {
        if (window.API_BASE_URL) {
            return String(window.API_BASE_URL).replace(/\/+$/, '');
        }
        if (window.API_USE_LOCAL === true) {
            return LOCAL_API;
        }
        if (isLocalHttpPreview() && window.API_USE_LOCAL_PROXY !== false) {
            // The phone's own 127.0.0.1 is not the PC running the dev server.
            if (isPrivateLanHost()) {
                return 'http://' + window.location.hostname + ':3005';
            }
            // localhost on any DEV_PORT. The dev server proxies /__api.
            return window.location.origin.replace(/\/+$/, '') + LOCAL_CORS_PROXY;
        }
        return PRODUCTION_API;
    }

    window.resolveBrandedApiBase = resolveBrandedApiBase;
    window.BRANDED_PRODUCTION_API = PRODUCTION_API;
    window.BRANDED_LOCAL_API = LOCAL_API;
    window.BRANDED_LOCAL_CORS_PROXY = LOCAL_CORS_PROXY;
    window.BRANDED_LOCAL_CORS_PROXY_ORIGIN = LOCAL_CORS_PROXY_ORIGIN;
    // Eager default for scripts that read API_BASE_URL directly.
    if (!window.API_BASE_URL) {
        window.API_BASE_URL = resolveBrandedApiBase();
    }
})(window);
