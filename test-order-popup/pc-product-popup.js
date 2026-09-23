(function initialisePcProductPopup() {
    'use strict';

    var popup = document.getElementById('orderPopup');
    if (!popup) return;

    var progressItems = Array.prototype.slice.call(popup.querySelectorAll('[data-flow-step]'));

    function text(value) {
        return String(value == null ? '' : value).trim();
    }

    function money(value) {
        var amount = Number(value);
        return Number.isFinite(amount) ? '£' + amount.toFixed(2) : '';
    }

    function quantityTotal() {
        var total = 0;
        popup.querySelectorAll('#sizeQtyGridP3 .qty-input').forEach(function (input) {
            total += parseInt(input.value, 10) || 0;
        });
        return total;
    }

    function updateStepSummary() {
        var product = window.productData || window.currentOrderProduct || {};
        var code = text(product.code || product.sku);
        var colour = text(window.selectedColour);
        var qty = quantityTotal();

        var summaries = [
            code || 'Overview',
            colour || 'Choose a finish',
            qty ? qty + (qty === 1 ? ' item' : ' items') : 'Select sizes',
            'Add your design'
        ];

        progressItems.forEach(function (item, index) {
            var summary = item.querySelector('small');
            if (summary) summary.textContent = summaries[index];
        });

        var tiers = window._p3TierData || [];
        var unitPrice = tiers.length
            ? Number(tiers[0].price) || 0
            : Number(product.basePrice || product.price) || 0;
        tiers.forEach(function (tier) {
            if (qty >= Number(tier.min) && qty <= Number(tier.max || 999999)) {
                unitPrice = Number(tier.price) || unitPrice;
            }
        });

        var totalPieces = popup.querySelector('#p3TotalPieces');
        var currentUnitPrice = popup.querySelector('#p3CurrentUnitPrice');
        var totalCost = popup.querySelector('#p3TotalCost');
        if (totalPieces) totalPieces.textContent = String(qty);
        if (currentUnitPrice) currentUnitPrice.textContent = money(unitPrice);
        if (totalCost) totalCost.textContent = money(unitPrice * qty);
    }

    if (typeof window.updateP3QuantitySummary === 'function') {
        window.updateP3QuantitySummary();
    }

    function updateProgress(step) {
        var activeStep = Math.max(0, Math.min(3, Number(step) || 0));
        progressItems.forEach(function (item, index) {
            item.classList.toggle('is-active', index === activeStep);
            var complete = index < activeStep;
            if (index === 1 && window.selectedColour) complete = true;
            if (index === 2 && quantityTotal() > 0) complete = true;
            item.classList.toggle('is-complete', complete);
            if (index === activeStep) item.setAttribute('aria-current', 'step');
            else item.removeAttribute('aria-current');
        });
        updateStepSummary();
    }

    function resetPanelScroll() {
        var selectors = [
            '.product-shop-info',
            '.colour-swatches-wrapper',
            '.sizes-section-p3',
            '.page-4 .positions-grid',
            '.page-5 .page-content-wrapper'
        ];
        selectors.forEach(function (selector) {
            var panel = popup.querySelector(selector);
            if (panel) panel.scrollTop = 0;
        });
    }

    function normaliseTiers(product) {
        var basePrice = Number(product.basePrice || product.price) || 0;
        var source = Array.isArray(product.priceBreaks) ? product.priceBreaks :
            (Array.isArray(product.tiers) ? product.tiers :
                (Array.isArray(product.priceTiers) ? product.priceTiers : []));
        var tiers = [];

        source.forEach(function (tier) {
            var min = Number(tier.min || tier.minQty || tier.quantity || tier.qty || 1) || 1;
            var max = Number(tier.max || tier.maxQty || 0) || 0;
            var price = Number(tier.price || tier.unitPrice || tier.value);
            var discount = Number(tier.percentage || tier.discount || tier.pct) || 0;
            if (!Number.isFinite(price) && basePrice && discount) price = basePrice * (1 - discount / 100);
            if (!Number.isFinite(price) || price <= 0) return;
            tiers.push({ min: min, max: max, price: price, discount: discount });
        });

        var baseTier = tiers.find(function (tier) { return tier.min <= 1; });
        if (basePrice && baseTier) {
            baseTier.price = basePrice;
        } else if (basePrice) {
            tiers.unshift({ min: 1, max: 0, price: basePrice, discount: 0 });
        }

        tiers.sort(function (a, b) { return a.min - b.min; });
        return tiers.filter(function (tier, index, list) {
            return list.findIndex(function (candidate) { return candidate.min === tier.min; }) === index;
        }).slice(0, 6).map(function (tier, index, list) {
            if (!tier.max && list[index + 1]) tier.max = list[index + 1].min - 1;
            if (tier.min <= 1) tier.discount = 0;
            if (!tier.discount && basePrice > 0 && tier.price < basePrice) {
                tier.discount = Math.round((1 - tier.price / basePrice) * 100);
            }
            return tier;
        });
    }

    function renderPriceBreaks(product) {
        var container = popup.querySelector('#pcPriceBreaks');
        if (!container) return;

        var tiers = normaliseTiers(product || {});
        if (!tiers.length) {
            container.hidden = true;
            container.innerHTML = '';
            return;
        }

        container.hidden = false;
        container.innerHTML = tiers.map(function (tier) {
            var quantity = tier.max && tier.max < 99999
                ? tier.min + '-' + tier.max
                : tier.min + '+';
            var saving = tier.discount > 0
                ? '<em>SAVE ' + Math.round(tier.discount) + '%</em>'
                : '<small>ex VAT</small>';
            return '<div class="pc-price-tier"><span>' + quantity + '</span><strong>' + money(tier.price) + '</strong>' + saving + '</div>';
        }).join('');
    }

    var baseSetProductData = window.setProductData;

    if (typeof baseSetProductData === 'function') {
        window.setProductData = function setProductDataWithPcPresentation(product) {
            var result = baseSetProductData.apply(this, arguments);
            renderPriceBreaks(product || {});
            updateStepSummary();
            window.requestAnimationFrame(resetPanelScroll);
            return result;
        };
    }

    var baseGoToPage = window.goToPage;
    if (typeof baseGoToPage === 'function') {
        window.goToPage = function goToPageWithPcProgress(index) {
            var result = baseGoToPage.apply(this, arguments);
            updateProgress(window.current);
            return result;
        };
    }

    progressItems.forEach(function (item) {
        item.addEventListener('click', function () {
            var requested = Number(item.dataset.flowStep);
            var current = Number(window.current) || 0;
            if (requested <= current && requested <= 2 && typeof window.goToPage === 'function') {
                window.goToPage(requested);
            }
        });
    });

    ['p1AddToBasket', 'p1QuickShop'].forEach(function (id) {
        var action = document.getElementById(id);
        if (!action) return;
        action.addEventListener('click', function () {
            if (typeof window.goToPage === 'function') window.goToPage(1);
        });
    });

    popup.addEventListener('click', function (event) {
        if (event.target.closest('.colour-swatch-item')) {
            window.setTimeout(function () {
                updateProgress(window.current);
            }, 0);
        }
        if (event.target.closest('#sizeQtyGridP3 .qty-btn')) {
            window.setTimeout(function () {
                updateProgress(window.current);
            }, 0);
        }
    });

    popup.addEventListener('input', function (event) {
        if (event.target.matches('#sizeQtyGridP3 .qty-input')) updateProgress(window.current);
    });

    var baseOpenCustomizer = window.openPcOrderCustomizer;
    if (typeof baseOpenCustomizer === 'function') {
        window.openPcOrderCustomizer = function openPcCustomizerWithProgress() {
            var result = baseOpenCustomizer.apply(this, arguments);
            if (popup.classList.contains('pc-customizer-active')) updateProgress(3);
            return result;
        };
    }

    new MutationObserver(function () {
        updateProgress(popup.classList.contains('pc-customizer-active') ? 3 : window.current);
    }).observe(popup, { attributes: true, attributeFilter: ['class'] });

    // Basket icon in the popup header stays in sync on every flow page.
    function updateFlowBasketBadge() {
        var badge = document.getElementById('pcFlowBasketBadge');
        if (!badge) return;
        var totalQty = 0;
        try {
            JSON.parse(localStorage.getItem('quoteBasket') || '[]').forEach(function (row) {
                totalQty += parseInt(row && row.qty, 10) || 0;
            });
        } catch (error) { /* basket unreadable: keep badge hidden */ }
        badge.textContent = String(totalQty);
        badge.hidden = totalQty === 0;
    }

    window.addEventListener('basketUpdated', updateFlowBasketBadge);
    window.addEventListener('storage', function (event) {
        if (event.key === 'quoteBasket') updateFlowBasketBadge();
    });
    updateFlowBasketBadge();

    updateProgress(0);
}());
