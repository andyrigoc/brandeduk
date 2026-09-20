(function setupPcOrderCustomizer() {
    'use strict';

    var panel = document.getElementById('pcCustomizerPanel');
    var frame = document.getElementById('pcCustomizerFrame');
    var backButton = document.getElementById('pcCustomizerBack');
    var title = document.getElementById('pcCustomizerTitle');
    var summary = document.getElementById('pcCustomizerSummary');
    var orderCard = document.querySelector('#orderPopup .order_card');
    var orderPopup = document.getElementById('orderPopup');
    var preloadFrame = null;
    var preloadedCode = '';
    var preloadReady = false;
    var frameReadyPoll = null;
    var pendingFrameUrl = '';
    var pendingCustomizerContext = null;
    var activeFrameKey = '';

    if (!panel || !frame || !orderCard) return;

    function readBasket() {
        try {
            var parsed = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    function writeBasket(basket) {
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
    }

    function quantityTotal(sizes) {
        return Object.values(sizes || {}).reduce(function(total, qty) {
            return total + (parseInt(qty, 10) || 0);
        }, 0);
    }

    function buildSizeSummary(sizes) {
        return Object.entries(sizes || {})
            .filter(function(entry) { return (parseInt(entry[1], 10) || 0) > 0; })
            .map(function(entry) { return entry[0] + ' x ' + entry[1]; })
            .join(', ');
    }

    function buildPreloadKey(code) {
        return String(code || '').trim().toLowerCase();
    }

    function persistPreloadProduct(product, colour, colourImage, colourHex) {
        if (!product || typeof product !== 'object') return;
        try {
            sessionStorage.setItem('selectedProductData', JSON.stringify(Object.assign({}, product, {
                color: colour || product.color || product.colour || '',
                selectedColorName: colour || product.selectedColorName || '',
                colorImage: colourImage || product.colorImage || product.colourImg || product.image || '',
                selectedColorImage: colourImage || product.selectedColorImage || product.colorImage || product.image || '',
                colorHex: colourHex || product.colorHex || ''
            })));
        } catch (error) {}
    }

    // Warm the Design Studio document while the customer is still choosing
    // colour and quantities. The visible iframe is still opened only on click.
    window.preloadPcOrderCustomizer = function preloadPcOrderCustomizer(product, colour, colourImage, colourHex) {
        var code = product && (product.code || product.sku || '');
        var productType = product && (product.productType || product.category || product.type || product.name || '');
        persistPreloadProduct(product, colour, colourImage, colourHex);
        var preloadKey = buildPreloadKey(code);
        if (!code || preloadKey === preloadedCode) return;
        preloadReady = false;

        if (!preloadFrame) {
            preloadFrame = document.createElement('iframe');
            preloadFrame.setAttribute('aria-hidden', 'true');
            preloadFrame.tabIndex = -1;
            preloadFrame.style.position = 'absolute';
            preloadFrame.style.width = 'min(1680px, calc(100vw - 48px))';
            preloadFrame.style.height = 'min(826px, calc(100vh - 98px))';
            preloadFrame.style.opacity = '0';
            preloadFrame.style.visibility = 'hidden';
            preloadFrame.style.pointerEvents = 'none';
            preloadFrame.style.border = '0';
            preloadFrame.style.left = '0';
            preloadFrame.style.top = '0';
            frame.parentNode.appendChild(preloadFrame);
        }

        var target = new URL('customization-tool/index.html', window.location.href);
        target.searchParams.set('code', code);
        target.searchParams.set('from', 'basket');
        target.searchParams.set('logoOnly', '1');
        target.searchParams.set('embedded', 'pc-order-preload');
        target.searchParams.set('_cb', 'pc-preload');
        if (productType) target.searchParams.set('productType', productType);
        if (colour) target.searchParams.set('color', colour);
        if (colourImage) target.searchParams.set('colorImage', colourImage);
        if (colourHex) target.searchParams.set('colorHex', colourHex);
        preloadedCode = preloadKey;
        preloadFrame.src = target.toString();
    };

    function sendCustomizerContext() {
        if (!pendingCustomizerContext || !frame.contentWindow) return;
        frame.contentWindow.postMessage(pendingCustomizerContext, window.location.origin);
    }

    function adoptPreloadedFrame(preloadKey) {
        if (!preloadFrame || preloadKey !== preloadedCode) return false;
        stopFrameReadyWatch();
        frame.remove();
        frame = preloadFrame;
        preloadFrame = null;
        preloadedCode = '';
        activeFrameKey = preloadKey;
        frame.id = 'pcCustomizerFrame';
        frame.className = 'pc-customizer-frame';
        frame.title = 'BrandedUK desktop customization tool';
        frame.setAttribute('allow', 'clipboard-read; clipboard-write');
        frame.removeAttribute('aria-hidden');
        frame.removeAttribute('style');
        frame.tabIndex = 0;
        frame.addEventListener('load', function() {
            showCustomizerFrame();
            sendCustomizerContext();
        });

        try {
            if (frame.contentDocument && frame.contentDocument.body) showCustomizerFrame();
        } catch (error) {}
        if (preloadReady) showCustomizerFrame();
        window.setTimeout(sendCustomizerContext, 0);
        return true;
    }

    function stopFrameReadyWatch() {
        if (frameReadyPoll) {
            window.clearInterval(frameReadyPoll);
            frameReadyPoll = null;
        }
    }

    function showCustomizerFrame() {
        if (!frame.getAttribute('src')) return;
        stopFrameReadyWatch();
        panel.classList.add('is-loaded');
    }

    function watchForFrameDocument() {
        stopFrameReadyWatch();

        // The customizer has its own progress screen. Reveal it once its HTML
        // is interactive instead of waiting for every image/font request to
        // finish, which can otherwise leave Live Server behind this spinner.
        frameReadyPoll = window.setInterval(function() {
            try {
                var frameDocument = frame.contentDocument;
                var frameLocation = frame.contentWindow && frame.contentWindow.location.href;
                var documentReady = frameDocument
                    && frameDocument.body
                    && (frameDocument.readyState === 'interactive' || frameDocument.readyState === 'complete');

                if (documentReady && frameLocation === pendingFrameUrl) {
                    showCustomizerFrame();
                }
            } catch (error) {
                // Same-origin is expected here. Keep the native load listener
                // as the fallback if the hosting arrangement ever differs.
            }
        }, 100);
    }

    function closeCustomizer(saved) {
        stopFrameReadyWatch();
        pendingFrameUrl = '';
        pendingCustomizerContext = null;
        panel.hidden = true;
        panel.classList.remove('is-loaded');
        orderCard.classList.remove('customizer-open');
        if (orderPopup) orderPopup.classList.remove('pc-customizer-active');

        var success = document.getElementById('addQuoteSuccess');
        var initialActions = document.getElementById('p3InitialActions');
        var addButton = document.getElementById('btnAddToQuote');
        var logoButton = document.getElementById('btnAddLogo');
        if (saved) {
            if (success) success.style.display = 'none';
            if (initialActions) initialActions.style.display = '';
            if (addButton) addButton.style.display = '';
            if (logoButton) logoButton.textContent = 'Add Your Logo';
        } else {
            if (success) success.style.display = '';
            if (addButton) addButton.style.display = 'none';
        }

        if (saved) {
            window.dispatchEvent(new Event('basketUpdated'));
        }
    }

    window.openPcOrderCustomizer = function openPcOrderCustomizer() {
        var basket = readBasket();
        if (basket.length === 0) {
            if (typeof window.showAlert === 'function') {
                window.showAlert('Please add the product to your quote first.', 'Back to order');
            }
            return;
        }

        var product = window.productData || window.currentOrderProduct || {};
        var selectedSwatch = document.querySelector('.colour-swatch-item.selected');
        var selectedUiColour = selectedSwatch
            ? (selectedSwatch.dataset.name || selectedSwatch.dataset.colour || '')
            : (window.selectedColour || '');
        var productCode = product.code || product.sku || '';
        var basketIndex = basket.length - 1;
        if (selectedUiColour || productCode) {
            for (var candidateIndex = basket.length - 1; candidateIndex >= 0; candidateIndex -= 1) {
                var candidate = basket[candidateIndex] || {};
                var candidateCode = candidate.productCode || candidate.code || '';
                var candidateColour = candidate.color || candidate.colour || '';
                var sameProduct = !productCode || candidateCode === productCode;
                var sameColour = !selectedUiColour || candidateColour === selectedUiColour;
                if (sameProduct && sameColour) {
                    basketIndex = candidateIndex;
                    break;
                }
            }
        }
        var item = basket[basketIndex] || {};
        var sizes = item.sizes || item.quantities || {};
        var totalQty = quantityTotal(sizes);
        var colour = selectedUiColour || item.color || item.colour || '';
        var colourImage = selectedSwatch
            ? (selectedSwatch.dataset.img || '')
            : (item.colorImage || item.colourImg || item.image || '');
        var colourHex = selectedSwatch
            ? (selectedSwatch.dataset.hex || '')
            : (item.colorHex || '');

        // Normalise the legacy PC line before the shared tool edits it. This
        // makes quantity and price preservation explicit and prevents the
        // editor's display quantity from replacing the selected size matrix.
        basket[basketIndex] = Object.assign({}, item, {
            code: product.code || product.sku || item.code || '',
            productCode: product.code || product.sku || item.productCode || item.code || '',
            name: product.name || item.name || '',
            productName: product.name || item.productName || item.name || '',
            brand: product.brand || item.brand || '',
            productType: product.productType || product.category || product.type || item.productType || '',
            color: colour,
            colorHex: colourHex || item.colorHex || product.colorHex || '',
            colorImage: colourImage,
            image: colourImage || item.image || product.image || '',
            quantities: Object.assign({}, sizes),
            totalQty: totalQty,
            unitPrice: parseFloat(item.unitPrice || item.price || product.price || product.basePrice || 0) || 0
        });
        item = basket[basketIndex];
        writeBasket(basket);

        sessionStorage.setItem('customizingBasketIndex', String(basketIndex));
        sessionStorage.setItem('returnAfterCustomize', 'basket');
        sessionStorage.setItem('selectedProduct', item.productCode || item.code || '');
        sessionStorage.setItem('selectedColorName', colour);
        if (colourImage) sessionStorage.setItem('selectedColorUrl', colourImage);
        sessionStorage.removeItem('editingLogoIndex');
        sessionStorage.removeItem('editingPosition');
        sessionStorage.removeItem('toolAskLogoChoice');
        sessionStorage.removeItem('customizeFreshItem');
        sessionStorage.setItem('selectedProductData', JSON.stringify(Object.assign({}, product, item, {
            color: colour,
            selectedColorName: colour,
            selectedColorImage: colourImage
        })));

        if (title) title.textContent = 'Customize ' + (item.name || item.productName || item.code || 'your product');
        if (summary) {
            var parts = [];
            if (colour) parts.push(colour);
            if (totalQty) parts.push(totalQty + (totalQty === 1 ? ' item' : ' items'));
            var sizeSummary = buildSizeSummary(sizes);
            if (sizeSummary) parts.push(sizeSummary);
            summary.textContent = parts.join('  |  ') || 'Your order selections are preserved';
        }

        var target = new URL('customization-tool/index.html', window.location.href);
        target.searchParams.set('code', item.productCode || item.code || '');
        target.searchParams.set('from', 'basket');
        target.searchParams.set('logoOnly', '1');
        target.searchParams.set('embedded', 'pc-order');
        target.searchParams.set('_cb', 'pc-preload');
        target.searchParams.set('color', colour);
        if (colourImage) target.searchParams.set('colorImage', colourImage);
        if (colourHex) target.searchParams.set('colorHex', colourHex);
        var currentProductType = product.productType || product.category || product.type || product.name || '';
        if (currentProductType) target.searchParams.set('productType', currentProductType);

        var preloadKey = buildPreloadKey(item.productCode || item.code || '');
        pendingCustomizerContext = {
            type: 'brandeduk:customization-context',
            code: item.productCode || item.code || '',
            basketIndex: basketIndex,
            item: item
        };

        panel.hidden = false;
        panel.classList.remove('is-loaded');
        orderCard.classList.add('customizer-open');
        if (orderPopup) orderPopup.classList.add('pc-customizer-active');
        pendingFrameUrl = target.toString();
        if (activeFrameKey === preloadKey && frame.getAttribute('src')) {
            try {
                if (frame.contentDocument && frame.contentDocument.body) showCustomizerFrame();
            } catch (error) {}
            sendCustomizerContext();
        } else if (!adoptPreloadedFrame(preloadKey)) {
            activeFrameKey = preloadKey;
            frame.src = pendingFrameUrl;
            watchForFrameDocument();
        }
    };

    frame.addEventListener('load', function() {
        showCustomizerFrame();
    });

    if (backButton) {
        backButton.addEventListener('click', function() {
            closeCustomizer(false);
        });
    }

    window.addEventListener('message', function(event) {
        if (event.origin !== window.location.origin) return;
        if (event.data && event.data.type === 'brandeduk:customizer-ready') {
            if (preloadFrame && event.source === preloadFrame.contentWindow) preloadReady = true;
            if (event.source === frame.contentWindow) {
                showCustomizerFrame();
                sendCustomizerContext();
            }
            return;
        }
        if (event.data && event.data.type === 'brandeduk:customizer-context-ready') {
            if (event.source === frame.contentWindow) pendingCustomizerContext = null;
            return;
        }
        if (!event.data || event.data.type !== 'brandeduk:customization-saved') return;
        closeCustomizer(true);
        window.location.assign(new URL('basket.html', window.location.href).href);
    });

    var originalCloseOrderPopup = window.closeOrderPopup;
    if (typeof originalCloseOrderPopup === 'function') {
        window.closeOrderPopup = function closeOrderPopupWithCustomizer() {
            if (!panel.hidden) closeCustomizer(false);
            return originalCloseOrderPopup.apply(this, arguments);
        };
    }
}());
