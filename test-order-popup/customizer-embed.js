(function setupPcOrderCustomizer() {
    'use strict';

    var panel = document.getElementById('pcCustomizerPanel');
    var frame = document.getElementById('pcCustomizerFrame');
    var backButton = document.getElementById('pcCustomizerBack');
    var title = document.getElementById('pcCustomizerTitle');
    var summary = document.getElementById('pcCustomizerSummary');
    var orderCard = document.querySelector('#orderPopup .order_card');
    var orderPopup = document.getElementById('orderPopup');

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

    function closeCustomizer(saved) {
        panel.hidden = true;
        panel.classList.remove('is-loaded');
        orderCard.classList.remove('customizer-open');
        if (orderPopup) orderPopup.classList.remove('pc-customizer-active');

        window.setTimeout(function() {
            if (panel.hidden) frame.removeAttribute('src');
        }, 220);

        var success = document.getElementById('addQuoteSuccess');
        var addButton = document.getElementById('btnAddToQuote');
        var logoButton = document.getElementById('btnAddLogo');
        if (success) success.style.display = '';
        if (addButton) addButton.style.display = 'none';
        if (saved && logoButton) logoButton.textContent = 'Edit customization';

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

        // The established flow has just added this line, so the last entry is
        // the exact colour and size combination the customer selected.
        var basketIndex = basket.length - 1;
        var item = basket[basketIndex] || {};
        var product = window.productData || window.currentOrderProduct || {};
        var sizes = item.sizes || item.quantities || {};
        var totalQty = quantityTotal(sizes);
        var colour = item.color || item.colour || window.selectedColour || '';
        var colourImage = item.colorImage || item.colourImg || item.image || '';

        // Normalise the legacy PC line before the shared tool edits it. This
        // makes quantity and price preservation explicit and prevents the
        // editor's display quantity from replacing the selected size matrix.
        basket[basketIndex] = Object.assign({}, item, {
            code: item.code || product.code || product.sku || '',
            productCode: item.productCode || item.code || product.code || product.sku || '',
            name: item.name || product.name || '',
            productName: item.productName || item.name || product.name || '',
            brand: item.brand || product.brand || '',
            productType: item.productType || product.productType || product.category || product.type || '',
            color: colour,
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
        target.searchParams.set('_cb', String(Date.now()));

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
