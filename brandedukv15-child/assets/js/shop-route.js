/**
 * Shop routing: mobile → /shop (shop.html), desktop → /shop-pc.html
 */
(function (w) {
    'use strict';

    var BP = 1024;

    function isMobileViewport() {
        try {
            if (w.matchMedia) {
                return w.matchMedia('(max-width: ' + (BP - 1) + 'px)').matches;
            }
        } catch (e) { /* ignore */ }
        return (w.innerWidth || 0) < BP;
    }

    function normalizeQuery(query) {
        if (!query) return '';
        return query.charAt(0) === '?' ? query : '?' + query;
    }

    function shopPath(query) {
        var q = normalizeQuery(query);
        return isMobileViewport() ? '/mobile/shop-mobile.html' + q : '/shop-pc.html' + q;
    }

    w.BrandedShopRoute = {
        breakpoint: BP,
        isMobile: isMobileViewport,
        shopPath: shopPath,
        goShop: function (query) {
            w.location.replace(shopPath(query));
        },
        redirectDesktopShopIfMobile: function () {
            if (!isMobileViewport()) return false;
            var q = w.location.search || '?category=all';
            w.location.replace('/mobile/shop-mobile.html' + (q.charAt(0) === '?' ? q : '?' + q));
            return true;
        },
        redirectMobileShopIfDesktop: function () {
            if (isMobileViewport()) return false;
            w.location.replace('/shop-pc.html' + (w.location.search || ''));
            return true;
        }
    };
})(window);
