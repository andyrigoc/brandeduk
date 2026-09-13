// Canonical desktop product routing for the PC catalogue.
// Loaded only by shop-pc.html; mobile pages and mobile routing are untouched.
(function () {
    'use strict';

    var baseOpen = window.openOrderPopup;
    var baseClose = window.closeOrderPopup;

    if (typeof baseOpen !== 'function' || typeof baseClose !== 'function') {
        console.error('PC product popup is unavailable.');
        return;
    }

    function cleanCode(value) {
        return String(value || '').trim();
    }

    function codeFromProductLink(anchor) {
        if (!anchor) return '';

        try {
            var url = new URL(anchor.href, window.location.href);
            var code = url.searchParams.get('product') || url.searchParams.get('code');
            if (code) return cleanCode(code);

            var match = url.pathname.match(/\/product\/([^/]+)\/?$/i);
            return match ? cleanCode(decodeURIComponent(match[1])) : '';
        } catch (error) {
            return '';
        }
    }

    function setProductInUrl(code, mode) {
        var url = new URL(window.location.href);
        var currentCode = cleanCode(url.searchParams.get('product'));
        if (currentCode === code) return;

        url.searchParams.set('product', code);
        url.searchParams.delete('code');

        var state = Object.assign({}, history.state || {}, {
            pcProductModal: true,
            productCode: code
        });

        if (mode === 'replace') {
            history.replaceState(state, '', url.toString());
        } else {
            history.pushState(state, '', url.toString());
        }
    }

    function removeProductFromUrl() {
        var url = new URL(window.location.href);
        if (!url.searchParams.has('product')) return;

        url.searchParams.delete('product');
        var state = Object.assign({}, history.state || {});
        delete state.pcProductModal;
        delete state.productCode;
        history.replaceState(state, '', url.toString());
    }

    window.openPcProductDetails = function (productCode, productData, options) {
        var code = cleanCode(productCode || (productData && (productData.code || productData.style_code)));
        if (!code) return;

        var settings = options || {};
        if (settings.updateUrl !== false) {
            setProductInUrl(code, settings.replaceHistory ? 'replace' : 'push');
        }

        baseOpen(code, productData || null);
    };

    window.closeOrderPopup = function () {
        baseClose();
        removeProductFromUrl();
    };

    // Catch old PC product-detail links injected by shared header components.
    // This listener exists only on shop-pc.html and never affects mobile pages.
    document.addEventListener('click', function (event) {
        if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        var anchor = event.target.closest('a[href]');
        if (!anchor || anchor.target === '_blank') return;

        var href = anchor.getAttribute('href') || '';
        if (!/product-detail(?:\.html)?|[?&]product=/i.test(href)) return;

        var code = codeFromProductLink(anchor);
        if (!code) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        window.openPcProductDetails(code);
    }, true);

    window.addEventListener('popstate', function () {
        var code = cleanCode(new URL(window.location.href).searchParams.get('product'));
        var popup = document.getElementById('orderPopup');
        var isOpen = popup && window.getComputedStyle(popup).display !== 'none';

        if (code) {
            baseOpen(code, null);
        } else if (isOpen) {
            baseClose();
        }
    });

    function openRequestedProduct() {
        var url = new URL(window.location.href);
        var code = cleanCode(url.searchParams.get('product'));
        if (!code) return;

        window.openPcProductDetails(code, null, {
            updateUrl: false,
            replaceHistory: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', openRequestedProduct, { once: true });
    } else {
        openRequestedProduct();
    }
}());
