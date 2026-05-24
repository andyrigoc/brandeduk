/**
 * BrandedUK — API base URL (single source of truth)
 *
 * Default: https://api.brandeduk.com (same as LIVE), including on Live Server / 127.0.0.1.
 *
 * Local Node backend only when explicitly enabled:
 *   window.API_USE_LOCAL = true;   // before this script
 *   // → http://localhost:3004
 *
 * Or override manually:
 *   window.API_BASE_URL = 'http://localhost:3004';
 */
(function (window) {
    'use strict';

    var PRODUCTION_API = 'https://api.brandeduk.com';
    var LOCAL_API = 'http://localhost:3004';

    function resolveBrandedApiBase() {
        if (window.API_BASE_URL) {
            return String(window.API_BASE_URL).replace(/\/+$/, '');
        }
        if (window.API_USE_LOCAL === true) {
            return LOCAL_API;
        }
        return PRODUCTION_API;
    }

    window.resolveBrandedApiBase = resolveBrandedApiBase;
    window.BRANDED_PRODUCTION_API = PRODUCTION_API;
    window.BRANDED_LOCAL_API = LOCAL_API;
})(window);
