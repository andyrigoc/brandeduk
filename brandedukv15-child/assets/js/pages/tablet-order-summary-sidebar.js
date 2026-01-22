(function () {
    'use strict';

    const VAT_RATE = 0.2;
    const VAT_KEY = 'brandeduk-vat-mode';

    function isVatIncluded() {
        return localStorage.getItem(VAT_KEY) === 'on';
    }

    function vatSuffix() {
        return isVatIncluded() ? 'inc VAT' : 'ex VAT';
    }

    function readBasket() {
        try {
            return JSON.parse(localStorage.getItem('quoteBasket')) || [];
        } catch {
            return [];
        }
    }

    function writeBasket(basket) {
        try {
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
        } catch {
            // ignore
        }
        window.dispatchEvent(new CustomEvent('basketUpdated'));
    }

    function formatMoney(amount) {
        const n = Number(amount) || 0;
        return '£' + n.toFixed(2);
    }

    function displayMoney(baseExVat) {
        const base = Number(baseExVat) || 0;
        const display = isVatIncluded() ? base * (1 + VAT_RATE) : base;
        return formatMoney(display);
    }

    function buildGroupedItems(basket) {
        const grouped = [];

        basket.forEach((item, index) => {
            const qtyMap = item && (item.quantities && Object.keys(item.quantities).length
                ? item.quantities
                : (item.sizes && Object.keys(item.sizes).length ? item.sizes : null));

            if (qtyMap) {
                Object.entries(qtyMap).forEach(([size, qty]) => {
                    const numericQty = Number(qty) || 0;
                    if (numericQty > 0) {
                        grouped.push({
                            index,
                            name: item.name,
                            code: item.code,
                            color: item.color,
                            size,
                            qty: numericQty,
                            image: item.image,
                            price: Number(item.price)
                        });
                    }
                });
                return;
            }

            const numericQty = Number(item.quantity || item.totalQty) || 0;
            if (numericQty > 0) {
                grouped.push({
                    index,
                    name: item.name,
                    code: item.code,
                    color: item.color,
                    size: item.size || '',
                    qty: numericQty,
                    image: item.image,
                    price: Number(item.price)
                });
            }
        });

        return grouped;
    }

    function getTotalQty(grouped) {
        return grouped.reduce((sum, g) => sum + (Number(g.qty) || 0), 0);
    }

    function updateSummarySidebar() {
        const root = document.getElementById('tabletOrderSummary');
        if (!root) return;

        const basket = readBasket();
        const grouped = buildGroupedItems(basket);
        const totalQty = getTotalQty(grouped);

        const garmentCostEl = document.getElementById('sidebarGarmentCost');
        const garmentUnitEl = document.getElementById('garmentUnitPrice');
        const garmentQtyEl = document.getElementById('garmentQty');
        const totalEl = document.getElementById('sidebarTotalCost');
        const itemsEl = document.getElementById('basketItemsList');
        const emptyEl = document.getElementById('tabletOrderSummaryEmpty');
        const vatSuffixEl = document.getElementById('tabletVatSuffix');

        let garmentTotal = 0;
        let basketHTML = '';

        grouped.forEach(g => {
            const safeSizeKey = (g.size || 'all').replace(/[^a-z0-9_-]/gi, '-');
            const tempKey = `${g.index}_${safeSizeKey}`;
            const unit = Number.isFinite(g.price) ? g.price : 0;
            const lineTotal = unit * g.qty;
            garmentTotal += lineTotal;

            basketHTML += `
                <div class="sidebar-basket-item" data-index="${g.index}" data-size="${escapeAttr(g.size)}">
                    <img src="${escapeAttr(g.image || '')}" alt="${escapeAttr(g.color || '')}">
                    <div class="sidebar-basket-details">
                        <strong>${escapeHtml(g.name || 'Product')}</strong>
                        <div class="product-code" id="product-code-${tempKey}">${escapeHtml(g.code || '')}${g.color ? ` - ${escapeHtml(g.color)}` : ''}</div>
                        <div class="product-sizes" style="font-size:0.98em;font-weight:bold;letter-spacing:0.2px;">${g.qty}x${escapeHtml(g.size || '')}</div>
                        <div class="product-price">
                            <div class="qty-toggle">
                                <button type="button" class="qty-toggle-btn minus" data-index="${g.index}" data-size="${escapeAttr(g.size)}" aria-label="Decrease quantity">-</button>
                                <span class="qty-toggle-value" id="qty-display-${tempKey}">${g.qty}</span>
                                <button type="button" class="qty-toggle-btn plus" data-index="${g.index}" data-size="${escapeAttr(g.size)}" aria-label="Increase quantity">+</button>
                            </div>
                            <span id="row-total-${tempKey}" class="basket-line-price" data-qty="${g.qty}" data-unit="${unit}">${displayMoney(lineTotal)} ${vatSuffix()}</span>
                        </div>
                    </div>
                    <button class="remove-item-btn" data-index="${g.index}" data-size="${escapeAttr(g.size)}" title="Remove item" aria-label="Remove item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            `;
        });

        if (emptyEl) {
            emptyEl.hidden = grouped.length > 0;
        }

        const avgUnit = totalQty > 0 ? (garmentTotal / totalQty) : 0;

        if (vatSuffixEl) {
            vatSuffixEl.textContent = vatSuffix();
        }

        if (garmentCostEl) {
            garmentCostEl.textContent = displayMoney(garmentTotal);
        }
        if (garmentUnitEl) {
            garmentUnitEl.textContent = displayMoney(avgUnit);
        }
        if (garmentQtyEl) {
            garmentQtyEl.textContent = `Qty: ${totalQty}`;
        }
        if (totalEl) {
            totalEl.innerHTML = `${displayMoney(garmentTotal)} <span class="vat-suffix">${vatSuffix()}</span>`;
        }

        if (itemsEl) {
            itemsEl.innerHTML = basketHTML;

            itemsEl.querySelectorAll('.qty-toggle-btn.plus').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.index || '0', 10);
                    const size = btn.dataset.size || '';
                    updateItemQuantity(idx, 1, size);
                });
            });

            itemsEl.querySelectorAll('.qty-toggle-btn.minus').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.index || '0', 10);
                    const size = btn.dataset.size || '';
                    updateItemQuantity(idx, -1, size);
                });
            });

            itemsEl.querySelectorAll('.remove-item-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.index || '0', 10);
                    const size = btn.dataset.size || '';
                    removeBasketGroup(idx, size);
                });
            });
        }
    }

    function updateItemQuantity(index, delta, size) {
        const basket = readBasket();
        const item = basket[index];
        if (!item) return;

        const qtyMap = item.quantities && Object.keys(item.quantities).length
            ? item.quantities
            : (item.sizes && Object.keys(item.sizes).length ? item.sizes : null);

        if (qtyMap && size) {
            const current = Number(qtyMap[size]) || 0;
            const next = current + delta;
            if (next <= 0) {
                delete qtyMap[size];
            } else {
                qtyMap[size] = next;
            }
            item.quantity = Object.values(qtyMap).reduce((sum, q) => sum + (Number(q) || 0), 0);
        } else {
            const current = Number(item.quantity || item.totalQty) || 0;
            const next = current + delta;
            item.quantity = Math.max(0, next);
        }

        if ((Number(item.quantity) || 0) <= 0) {
            basket.splice(index, 1);
        }

        writeBasket(basket);
        updateSummarySidebar();
    }

    function removeBasketGroup(index, size) {
        const basket = readBasket();
        const item = basket[index];
        if (!item) return;

        const qtyMap = item.quantities && Object.keys(item.quantities).length
            ? item.quantities
            : (item.sizes && Object.keys(item.sizes).length ? item.sizes : null);

        if (qtyMap && size) {
            delete qtyMap[size];
            item.quantity = Object.values(qtyMap).reduce((sum, q) => sum + (Number(q) || 0), 0);
            if (Object.keys(qtyMap).length === 0 || item.quantity <= 0) {
                basket.splice(index, 1);
            }
        } else {
            basket.splice(index, 1);
        }

        writeBasket(basket);
        updateSummarySidebar();
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(str) {
        return escapeHtml(str).replace(/`/g, '');
    }

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateSummarySidebar);
    } else {
        updateSummarySidebar();
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'quoteBasket' || e.key === VAT_KEY) updateSummarySidebar();
    });

    window.addEventListener('basketUpdated', updateSummarySidebar);
    window.addEventListener('vatToggleChanged', updateSummarySidebar);
})();
