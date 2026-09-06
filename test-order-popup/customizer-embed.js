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

    // Warm the Design Studio document while the customer is still choosing
    // colour and quantities. The visible iframe is still opened only on click.
    window.preloadPcOrderCustomizer = function preloadPcOrderCustomizer(product, colour, colourImage, colourHex) {
        var code = product && (product.code || product.sku || '');
        var preloadKey = code + '::' + String(colour || '').trim().toLowerCase();
        if (!code || preloadKey === preloadedCode) return;

        if (!preloadFrame) {
            preloadFrame = document.createElement('iframe');
            preloadFrame.setAttribute('aria-hidden', 'true');
            preloadFrame.tabIndex = -1;
            preloadFrame.style.position = 'fixed';
            preloadFrame.style.width = '1px';
            preloadFrame.style.height = '1px';
            preloadFrame.style.opacity = '0';
            preloadFrame.style.pointerEvents = 'none';
            preloadFrame.style.border = '0';
            preloadFrame.style.left = '-10000px';
            preloadFrame.style.top = '0';
            document.body.appendChild(preloadFrame);
        }

        var target = new URL('customization-tool/index.html', window.location.href);
        target.searchParams.set('code', code);
        target.searchParams.set('from', 'basket');
        target.searchParams.set('logoOnly', '1');
        target.searchParams.set('embedded', 'pc-order-preload');
        target.searchParams.set('_cb', 'pc-preload');
        var preloadType = product.productType || product.category || product.type || product.name || '';
        if (preloadType) target.searchParams.set('productType', preloadType);
        if (colour) target.searchParams.set('color', colour);
        if (colourImage) target.searchParams.set('colorImage', colourImage);
        if (colourHex) target.searchParams.set('colorHex', colourHex);
        preloadedCode = preloadKey;
        preloadFrame.src = target.toString();
    };

    function closeCustomizer(saved) {
        panel.hidden = true;
        panel.classList.remove('is-loaded');
        orderCard.classList.remove('customizer-open');
        if (orderPopup) orderPopup.classList.remove('pc-customizer-active');

        window.setTimeout(function() {
            if (panel.hidden) frame.removeAttribute('src');
        }, 220);

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

        panel.hidden = false;
        panel.classList.remove('is-loaded');
        orderCard.classList.add('customizer-open');
        if (orderPopup) orderPopup.classList.add('pc-customizer-active');
        frame.src = target.toString();
    };

    frame.addEventListener('load', function() {
        if (frame.getAttribute('src')) panel.classList.add('is-loaded');
    });

    if (backButton) {
        backButton.addEventListener('click', function() {
            closeCustomizer(false);
        });
    }

    window.addEventListener('message', function(event) {
        if (event.origin !== window.location.origin) return;
        if (!event.data || event.data.type !== 'brandeduk:customization-saved') return;
        closeCustomizer(true);
    });

    var originalCloseOrderPopup = window.closeOrderPopup;
    if (typeof originalCloseOrderPopup === 'function') {
        window.closeOrderPopup = function closeOrderPopupWithCustomizer() {
            if (!panel.hidden) closeCustomizer(false);
            return originalCloseOrderPopup.apply(this, arguments);
        };
    }
}());
