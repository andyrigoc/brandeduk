/**
 * Send wide viewports to the PC experience.
 *
 * Mobile: CSS width < 700px (real phones, typically ~390–430).
 * PC: CSS width >= 700px (iPad mini 6 at 744, iPad mini at 768, tablets, desktops).
 *
 * ?force=mobile stays on the mobile page. Tablets are not classified by user-agent.
 */
(function () {
    'use strict';

    var PC_MIN_WIDTH = 700;

    try {
        var params = new URLSearchParams(window.location.search);
        if ((params.get('force') || '').toLowerCase() === 'mobile') return;
    } catch (e) {
        /* ignore */
    }

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
        dest = root + '/home-pc.html';
        if (!/[?&]force=/i.test(search)) {
            dest += '?force=desktop';
            if (/[?&]contact=1(?:&|$)/.test(search)) dest += '&contact=1';
        } else {
            dest += search;
        }
    }

    window.location.replace(dest + hash);
})();
