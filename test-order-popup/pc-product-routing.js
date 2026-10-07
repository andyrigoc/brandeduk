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

    function getCachedProduct(code) {
        var memoryProduct = window.BrandedPcProductCache && window.BrandedPcProductCache[code];
        if (memoryProduct) return memoryProduct;

        try {
            var stored = JSON.parse(sessionStorage.getItem('selectedProductData') || 'null');
            var storedCode = cleanCode(stored && (stored.code || stored.style_code));
            return storedCode === code ? stored : null;
        } catch (error) {
            return null;
        }
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

    function openBasketCustomization(url, code) {
        if (url.searchParams.get('from') !== 'basket' || url.searchParams.get('customize') !== '1') return;

        var basket = [];
        try { basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]'); } catch (error) {}
        var basketIndex = parseInt(url.searchParams.get('basketIndex'), 10);
        if (!Number.isInteger(basketIndex)) {
            basketIndex = parseInt(sessionStorage.getItem('customizingBasketIndex'), 10);
        }
        var item = basket[basketIndex];
        if (!item || cleanCode(item.code || item.productCode) !== code) return;

        sessionStorage.setItem('customizingBasketIndex', String(basketIndex));
        sessionStorage.setItem('returnAfterCustomize', 'basket');
        window.selectedColour = item.color || item.colour || item.selectedColorName || '';

        var quantities = item.sizes || item.quantities;
        if (!quantities || typeof quantities !== 'object' || Array.isArray(quantities)) {
            quantities = {};
            quantities[item.size || 'One Size'] = Number(item.qty || item.quantity || item.totalQty) || 1;
        }
        window.quantities = Object.assign({}, quantities);

        var totalQty = Object.keys(window.quantities).reduce(function (sum, size) {
            return sum + (parseInt(window.quantities[size], 10) || 0);
        }, 0);
        var unitPrice = Number(item.unitPrice || item.price) || 0;
        var image = item.colorImage || item.colourImg || item.image || '';
        if (image) $('#p3ProductImage').attr('src', image);
        $('#p3TotalPieces').text(totalQty);
        $('#p3TotalCost').text('£' + (unitPrice * totalQty).toFixed(2));

        window.p4Assignments = {};
        (item.logos || []).forEach(function (logo) {
            var position = String(logo.position || logo.positionLabel || '')
                .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            var dataUrl = logo.logo || logo.dataUrl || logo.preview || '';
            if (!position || !dataUrl) return;
            window.p4Assignments[position] = {
                dataUrl: dataUrl,
                method: String(logo.method || logo.application || 'embroidery').toLowerCase(),
                sourceMethod: String(logo.sourceMethod || logo.originalMethod || logo.method || logo.application || 'embroidery').toLowerCase(),
                filename: logo.filename || '',
                unitPrice: logo.unitPrice != null ? Number(logo.unitPrice) : null
            };
        });

        var notes = (item.logos && item.logos[0] && item.logos[0].notes) || item.notes || '';
        $('#p4ArtworkNotes').val(notes);
        window.goToPage(3);
    }

    function notifyBasketWhenReady(url) {
        if (url.searchParams.get('basketEmbed') !== '1' || window.parent === window) return;
        var attempts = 0;
        var timer = window.setInterval(function () {
            attempts += 1;
            var cards = Array.prototype.slice.call(document.querySelectorAll('#p4PositionOptions .position-card'));
            var imagesReady = cards.length > 0 && cards.every(function (card) {
                var image = card.querySelector('.position-placeholder');
                return !image || (image.getAttribute('src') && image.complete);
            });
            if (window.current === 3 && cards.length > 0 && imagesReady) {
                window.clearInterval(timer);
                window.parent.postMessage({ type: 'pcCustomizerReady' }, window.location.origin);
            } else if (attempts >= 200) {
                window.clearInterval(timer);
                window.parent.postMessage({ type: 'pcCustomizerReady' }, window.location.origin);
            }
        }, 50);
    }

    window.openPcProductDetails = function (productCode, productData, options) {
        var code = cleanCode(productCode || (productData && (productData.code || productData.style_code)));
        if (!code) return;

        var settings = options || {};
        if (settings.updateUrl !== false) {
            setProductInUrl(code, settings.replaceHistory ? 'replace' : 'push');
        }

        return baseOpen(code, productData || getCachedProduct(code));
    };

    window.closeOrderPopup = function () {
        var url = new URL(window.location.href);
        if (url.searchParams.get('basketEmbed') === '1' && window.parent !== window) {
            window.parent.postMessage({ type: 'closeCustomizePopup' }, window.location.origin);
            return;
        }
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
        var openProduct = window.currentOrderProduct || window.productData || {};
        var openCode = cleanCode(openProduct.code || openProduct.sku || openProduct.style_code);

        // A tablet file picker, and an edge swipe while choosing a photo,
        // fires popstate without leaving this product. openOrderPopup always
        // restarts the wizard at the first step and drops the file.
        if (code && isOpen && openCode === code) return;

        if (code) {
            baseOpen(code, getCachedProduct(code));
        } else if (isOpen) {
            baseClose();
        }
    });

    function restoreTabletUploadStep(url, code) {
        if (url.searchParams.get('from') === 'basket') return;
        var saved = null;
        try {
            saved = JSON.parse(sessionStorage.getItem('pcOrderResume') || 'null');
        } catch (error) {
            saved = null;
        }
        sessionStorage.removeItem('pcOrderResume');
        if (!saved || cleanCode(saved.code) !== code) return;
        if (!saved.at || Date.now() - saved.at > 180000) return;

        if (saved.colour) window.selectedColour = saved.colour;
        if (saved.quantities && typeof saved.quantities === 'object') {
            window.quantities = saved.quantities;
        }
        var step = Number(saved.step);
        if (step > 0 && step < 5 && typeof window.goToPage === 'function') {
            window.goToPage(step);
        }
        if (saved.customizer && typeof window.openPcOrderCustomizer === 'function') {
            window.openPcOrderCustomizer();
        }
    }

    window.addEventListener('pagehide', function () {
        var popup = document.getElementById('orderPopup');
        if (!popup || window.getComputedStyle(popup).display === 'none') return;
        if (typeof window.current !== 'number' || window.current < 1) return;
        var product = window.currentOrderProduct || window.productData || {};
        var code = cleanCode(product.code || product.sku || product.style_code);
        if (!code) return;
        var panel = document.getElementById('pcCustomizerPanel');
        try {
            sessionStorage.setItem('pcOrderResume', JSON.stringify({
                code: code,
                step: window.current,
                colour: window.selectedColour || '',
                quantities: window.quantities || {},
                customizer: !!(panel && !panel.hidden),
                at: Date.now()
            }));
        } catch (error) {
            /* sessionStorage can be unavailable in private mode */
        }
    });

    function openRequestedProduct() {
        var url = new URL(window.location.href);
        var code = cleanCode(url.searchParams.get('product'));
        if (!code) return;

        var request = window.openPcProductDetails(code, getCachedProduct(code), {
            updateUrl: false,
            replaceHistory: true
        });
        Promise.resolve(request).then(function () {
            openBasketCustomization(url, code);
            restoreTabletUploadStep(url, code);
            notifyBasketWhenReady(url);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', openRequestedProduct, { once: true });
    } else {
        openRequestedProduct();
    }
}());
