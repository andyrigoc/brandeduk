/**
 * Send wide non-phone viewports to the PC experience.
 *
 * Mobile phones stay on mobile forever (never force=desktop).
 * - ?force=mobile → stay on this mobile page
 * - Phone UA (iPhone / Android phone) → stay, even in landscape
 * - Tablets / desktop with CSS width >= 700 → home-pc / shop-pc / etc.
 */
(function () {
    'use strict';

    var PC_MIN_WIDTH = 700;

    function isPhoneUa() {
        var ua = (navigator.userAgent || '').toLowerCase();
        var uaDataMobile = false;
        try {
            uaDataMobile = !!(navigator.userAgentData && navigator.userAgentData.mobile);
        } catch (e) {
            uaDataMobile = false;
        }
        var isIPad = ua.indexOf('ipad') !== -1 || (ua.indexOf('macintosh') !== -1 && (navigator.maxTouchPoints || 0) > 1);
        var isIPhone = ua.indexOf('iphone') !== -1 || ua.indexOf('ipod') !== -1;
        var isAndroid = ua.indexOf('android') !== -1;
        var isAndroidTablet = isAndroid && ua.indexOf('mobile') === -1;
        var isTabletUA = isIPad || isAndroidTablet || ua.indexOf('tablet') !== -1 || ua.indexOf('silk') !== -1;
        return !isTabletUA && (uaDataMobile || isIPhone || (isAndroid && ua.indexOf('mobile') !== -1));
    }

    try {
        var params = new URLSearchParams(window.location.search);
        if ((params.get('force') || '').toLowerCase() === 'mobile') return;
    } catch (e) {
        /* ignore */
    }

    // Phones must never be forced onto the desktop/PC experience.
    if (isPhoneUa()) return;

    var isPc = window.matchMedia
        ? window.matchMedia('(min-width: ' + PC_MIN_WIDTH + 'px)').matches
        : (window.innerWidth || 0) >= PC_MIN_WIDTH;
    if (!isPc) return;

    var path = (window.location.pathname || '').replace(/\\/g, '/');
    var lower = path.toLowerCase();
    var search = window.location.search || '';
    var hash = window.location.hash || '';

    function projectRoot(pathname) {
        var idx = pathname.toLowerCase().lastIndexOf('/brandeduk/');
        if (idx !== -1) return pathname.slice(0, idx + '/brandeduk'.length);
        return '';
    }

    function withParam(url, key, value) {
        if (new RegExp('[?&]' + key + '=', 'i').test(url)) return url;
        return url + (url.indexOf('?') === -1 ? '?' : '&') + encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }

    var root = projectRoot(path);
    var dest;

    if (lower.indexOf('shop-mobile') !== -1) {
        dest = root + '/shop-pc.html' + search;
    } else if (lower.indexOf('customize-mobile') !== -1) {
        dest = withParam(root + '/customization-tool/index.html' + search, 'from', 'customize-pc');
    } else if (lower.indexOf('customization-tool-mobile') !== -1) {
        dest = path.replace(/customization-tool-mobile/i, 'customization-tool') + search;
    } else {
        // Tablets → PC. Do not use force=desktop here: phones never reach this branch.
        dest = root + '/home-pc.html' + search;
        if (/[?&]contact=1(?:&|$)/.test(search) && !/[?&]contact=1(?:&|$)/.test(dest)) {
            dest += (dest.indexOf('?') === -1 ? '?' : '&') + 'contact=1';
        }
    }

    window.location.replace(dest + hash);
})();
