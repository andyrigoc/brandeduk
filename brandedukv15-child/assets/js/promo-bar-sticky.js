(function () {
    var promoSelector = '.top-promo-bar';
    var headerCandidates = [
        '.desktop-site-header',
        '.site-header',
        '.tablet-top-bar',
        '.mobile-header',
        '.header-top',
        '.searchbar-header',
        '.header-modern'
    ];

    function isVisible(element) {
        if (!element) {
            return false;
        }

        var style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) {
            return false;
        }

        return element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;
    }

    function collectFixedHeaderBottom(promoBar) {
        var maxBottom = 0;
        var visited = new Set();

        headerCandidates.forEach(function (selector) {
            document.querySelectorAll(selector).forEach(function (element) {
                if (visited.has(element) || element === promoBar || element.contains(promoBar) || promoBar.contains(element)) {
                    return;
                }

                visited.add(element);

                if (!isVisible(element)) {
                    return;
                }

                var style = window.getComputedStyle(element);
                if (style.position !== 'fixed' && style.position !== 'sticky') {
                    return;
                }

                var rect = element.getBoundingClientRect();
                if (rect.bottom <= 0 || rect.top > 2) {
                    return;
                }

                if (rect.bottom > maxBottom) {
                    maxBottom = rect.bottom;
                }
            });
        });

        return Math.max(0, Math.round(maxBottom));
    }

    var rafScheduled = false;
    function updatePromoOffsets() {
        rafScheduled = false;

        document.querySelectorAll(promoSelector).forEach(function (promoBar) {
            var offset = collectFixedHeaderBottom(promoBar);
            promoBar.style.setProperty('--promo-sticky-top', offset + 'px');
        });
    }

    function requestUpdate() {
        if (rafScheduled) {
            return;
        }

        rafScheduled = true;
        window.requestAnimationFrame(updatePromoOffsets);
    }

    window.addEventListener('resize', requestUpdate);
    window.addEventListener('orientationchange', requestUpdate);
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('load', requestUpdate);
    document.addEventListener('DOMContentLoaded', requestUpdate);

    requestUpdate();
})();
