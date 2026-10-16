/**
 * Bundle trial. Open shop-pc.html?bundle=proof
 * Slots 0/3, 0/2, 0/1. Each product opens the existing order popup.
 * Confirming sizes fills the active slot. Pay unlocks when every slot is full.
 */
(function () {
    'use strict';

    var params = new URLSearchParams(window.location.search);
    if (params.get('bundle') !== 'proof') return;

    var BUNDLE_PRICE = 126;
    var SLOTS = [
        { id: 'tops', label: 'Polo Shirts/T-Shirts', need: 3, filled: 0, picks: [] },
        { id: 'mids', label: 'Sweatshirts/Hoodies', need: 2, filled: 0, picks: [] },
        { id: 'outer', label: 'Jackets', need: 1, filled: 0, picks: [] }
    ];
    var CHOICES = {
        tops: [
            { id: 's170', code: 'PW421', title: 'Portwest Hi-Vis Cotton Comfort T-Shirt Short Sleeved - S170', catalogue: 'Nearest in catalogue: PW421 PW3 Hi-vis t-shirt (T181)' },
            { id: 'rt22', code: 'PW024', title: 'Portwest Hi-Vis Short Sleeve Polo Shirt – RT22 – RIS 3279 TOM Rail Orange', catalogue: 'Catalogue: PW024 Hi-vis short sleeved polo (S477/RT22)' },
            { id: 's477', code: 'PW024', title: 'Portwest Hi-Vis Polo Shirt Short Sleeved - S477', catalogue: 'Catalogue: PW024 Hi-vis short sleeved polo (S477/RT22)' },
            { id: 's277', code: 'PW368', title: 'Portwest Hi-Vis Polo Shirt Long Sleeved - S277', catalogue: 'S277 is not in the catalogue. Nearest hi-vis polo: PW368 (T180)' }
        ],
        mids: [
            { id: 'b304', code: 'PW337', title: 'Portwest Hi-Vis Hoodie - Orange/Yellow - B304', catalogue: 'Catalogue: PW337 Hi-vis hooded sweatshirt (B304)' },
            { id: 'b303', code: 'PW424', title: 'Portwest Hi-Vis Sweatshirt - B303', catalogue: 'B303 is not in the catalogue. Nearest hi-vis sweat: PW424 (T172)' }
        ],
        outer: [
            { id: 's463', code: 'PW001', title: 'Portwest Best Hi-Vis Padded Winter Bomber Jacket - S463', catalogue: 'Catalogue: PW001 Hi-vis bomber jacket (S463/S226)' },
            { id: 's460', code: 'PW003', title: 'Portwest Hi-Vis Winter Traffic Padded Jacket - S460', catalogue: 'Catalogue: PW003 Hi-vis traffic jacket (S460)' }
        ]
    };
    var activeSlotId = 'tops';
    var activeChoiceTitle = '';

    function apiBase() {
        if (typeof window.resolveBrandedApiBase === 'function') {
            return window.resolveBrandedApiBase().replace(/\/+$/, '');
        }
        return (window.API_BASE_URL || 'https://api.brandeduk.com').replace(/\/+$/, '');
    }

    function slotById(id) {
        return SLOTS.filter(function (slot) { return slot.id === id; })[0];
    }

    function remaining(slot) {
        return Math.max(0, slot.need - slot.filled);
    }

    function allFull() {
        return SLOTS.every(function (slot) { return slot.filled >= slot.need; });
    }

    function money(value) {
        return '£' + Number(value).toFixed(2);
    }

    function ensureStyle() {
        if (document.getElementById('bundleProofStyle')) return;
        var style = document.createElement('style');
        style.id = 'bundleProofStyle';
        style.textContent = [
            '#bundleProof { position: fixed; inset: 0; z-index: 10000; overflow: auto; background: #f4f6f8; color: #111827; font-family: Inter, Arial, sans-serif; }',
            '#orderPopup, #p4MethodModal, #colorZoomModal, .popup-overlay, .popup-contact { z-index: 100001 !important; }',
            '#bundleProof header { position: sticky; top: 0; z-index: 2; background: #fff; border-bottom: 1px solid #e5e7eb; padding: 16px 24px 12px; }',
            '#bundleProof h1 { margin: 0 0 4px; font-size: 22px; }',
            '#bundleProof .bp-price { margin: 0 0 12px; color: #374151; }',
            '#bundleProof .bp-price strong { font-size: 22px; color: #111827; }',
            '#bundleProof .bp-slots { display: flex; gap: 10px; flex-wrap: wrap; align-items: stretch; }',
            '#bundleProof .bp-slot { flex: 1; min-width: 180px; text-align: left; border: 1px solid #d1d5db; background: #fff; border-radius: 10px; padding: 10px 12px; cursor: pointer; }',
            '#bundleProof .bp-slot.is-active { border-color: #111827; box-shadow: 0 0 0 1px #111827; }',
            '#bundleProof .bp-slot.is-full { background: #f0fdf4; border-color: #16a34a; }',
            '#bundleProof .bp-count { font-size: 20px; font-weight: 700; }',
            '#bundleProof .bp-picks { margin: 6px 0 0; padding: 0; list-style: none; font-size: 12px; color: #4b5563; }',
            '#bundleProof .bp-pay { margin-left: auto; align-self: center; min-width: 180px; height: 48px; border: 0; border-radius: 10px; background: #d1d5db; color: #6b7280; font-weight: 700; cursor: not-allowed; }',
            '#bundleProof .bp-pay.is-ready { background: #111827; color: #fff; cursor: pointer; }',
            '#bundleProof main { padding: 20px 24px 48px; }',
            '#bundleProof .bp-group { margin-bottom: 28px; }',
            '#bundleProof .bp-group h2 { margin: 0 0 12px; font-size: 16px; }',
            '#bundleProof .bp-list { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }',
            '#bundleProof .bp-card { display: grid; grid-template-columns: 72px 1fr auto; gap: 14px; align-items: center; width: 100%; padding: 14px 16px; border: 0; border-bottom: 1px solid #e5e7eb; background: #fff; text-align: left; cursor: pointer; }',
            '#bundleProof .bp-card:last-child { border-bottom: 0; }',
            '#bundleProof .bp-card img { width: 72px; height: 72px; object-fit: contain; background: #f9fafb; }',
            '#bundleProof .bp-card strong { display: block; font-size: 15px; }',
            '#bundleProof .bp-card span { display: block; margin-top: 4px; font-size: 12px; color: #6b7280; }',
            '#bundleProof .bp-chevron { color: #9ca3af; font-size: 22px; }',
            '#bundleProof .bp-note { margin: 8px 0 0; font-size: 13px; color: #6b7280; }'
        ].join('');
        document.head.appendChild(style);
    }

    function render() {
        var root = document.getElementById('bundleProof');
        if (!root) return;
        root.querySelectorAll('[data-slot]').forEach(function (button) {
            var slot = slotById(button.getAttribute('data-slot'));
            button.classList.toggle('is-active', slot.id === activeSlotId);
            button.classList.toggle('is-full', slot.filled >= slot.need);
            button.querySelector('.bp-count').textContent = slot.filled + '/' + slot.need;
            var list = button.querySelector('.bp-picks');
            list.innerHTML = slot.picks.map(function (pick) {
                return '<li>' + pick.qty + ' × ' + pick.name + (pick.colour ? ' · ' + pick.colour : '') + '</li>';
            }).join('');
        });
        var pay = document.getElementById('bundleProofPay');
        var ready = allFull();
        pay.disabled = !ready;
        pay.classList.toggle('is-ready', ready);
        pay.textContent = ready ? 'Go to payment' : 'Fill every slot';
    }

    function mount() {
        ensureStyle();
        var root = document.createElement('div');
        root.id = 'bundleProof';
        root.innerHTML = [
            '<header>',
            '<h1>6 item hi-vis bundle trial</h1>',
            '<p class="bp-price">Trial package price <strong>' + money(BUNDLE_PRICE) + '</strong> ex VAT. Logo stays in the usual popup.</p>',
            '<div class="bp-slots">',
            SLOTS.map(function (slot) {
                return '<button type="button" class="bp-slot" data-slot="' + slot.id + '"><div>' + slot.label + '</div><div class="bp-count">0/' + slot.need + '</div><ul class="bp-picks"></ul></button>';
            }).join(''),
            '<button type="button" class="bp-pay" id="bundleProofPay" disabled>Fill every slot</button>',
            '</div>',
            '<p class="bp-note">Choose a slot, open a product, then confirm colour and sizes in the popup. The counter only moves when the popup confirms the quantity.</p>',
            '</header>',
            '<main id="bundleProofMain"><p>Loading products…</p></main>'
        ].join('');
        document.body.appendChild(root);

        root.addEventListener('click', function (event) {
            var slotButton = event.target.closest('[data-slot]');
            if (!slotButton) return;
            activeSlotId = slotButton.getAttribute('data-slot');
            render();
            var group = document.getElementById('bundle-group-' + activeSlotId);
            if (group) group.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        document.getElementById('bundleProofPay').addEventListener('click', function () {
            if (!allFull()) return;
            window.location.href = 'checkout.html';
        });
        render();
    }

    function productImage(product) {
        if (!product) return '';
        if (product.image || product.mainImage || product.imageUrl) {
            return product.image || product.mainImage || product.imageUrl;
        }
        var images = Array.isArray(product.images) ? product.images : [];
        var first = images[0];
        if (typeof first === 'string') return first;
        if (first) return first.url || first.src || first.main || '';
        var colours = product.colors || product.colours || [];
        var colour = colours[0] || {};
        return colour.main || colour.image || colour.thumb || '';
    }

    function cardHtml(choice, product, slotId) {
        return '<button type="button" class="bp-card" data-open-slot="' + slotId + '" data-choice="' + choice.id + '">' +
            '<img alt="" src="' + productImage(product) + '">' +
            '<span><strong>' + choice.title + '</strong><span>' + choice.catalogue + '</span></span>' +
            '<span class="bp-chevron" aria-hidden="true">›</span>' +
            '</button>';
    }

    function fetchProducts(query) {
        return fetch(apiBase() + '/api/products?' + query)
            .then(function (response) { return response.ok ? response.json() : { items: [] }; })
            .then(function (data) { return Array.isArray(data.items) ? data.items : []; })
            .catch(function () { return []; });
    }

    function unique(items) {
        var seen = {};
        return items.filter(function (item) {
            if (!item || !item.code || seen[item.code]) return false;
            seen[item.code] = true;
            return true;
        });
    }

    function fetchProduct(code) {
        return fetch(apiBase() + '/api/products/' + encodeURIComponent(code))
            .then(function (response) { return response.ok ? response.json() : null; })
            .catch(function () { return null; });
    }

    function loadGroups() {
        var codes = [];
        Object.keys(CHOICES).forEach(function (slotId) {
            CHOICES[slotId].forEach(function (choice) {
                if (codes.indexOf(choice.code) === -1) codes.push(choice.code);
            });
        });
        Promise.all(codes.map(fetchProduct)).then(function (products) {
            var byCode = {};
            products.forEach(function (product) {
                if (product && product.code) byCode[product.code] = product;
            });
            window.__bundleProofChoices = {};
            var main = document.getElementById('bundleProofMain');
            main.innerHTML = SLOTS.map(function (slot) {
                var rows = CHOICES[slot.id].map(function (choice) {
                    var product = byCode[choice.code] || { code: choice.code, name: choice.title, image: '' };
                    window.__bundleProofChoices[choice.id] = { choice: choice, product: product };
                    return cardHtml(choice, product, slot.id);
                }).join('');
                return '<section class="bp-group" id="bundle-group-' + slot.id + '"><h2>Select ' + slot.need + ' · ' + slot.label + '</h2><div class="bp-list">' + rows + '</div></section>';
            }).join('');

            main.addEventListener('click', function (event) {
                var card = event.target.closest('[data-choice]');
                if (!card) return;
                var slot = slotById(card.getAttribute('data-open-slot'));
                if (remaining(slot) <= 0) {
                    window.alert(slot.label + ' is already ' + slot.need + '/' + slot.need + '.');
                    return;
                }
                var entry = (window.__bundleProofChoices || {})[card.getAttribute('data-choice')];
                if (!entry) return;
                activeSlotId = slot.id;
                activeChoiceTitle = entry.choice.title;
                render();
                if (typeof window.openPcProductDetails === 'function') {
                    window.openPcProductDetails(entry.product.code, entry.product, { updateUrl: false });
                }
            });
        });
    }

    function selectedQty() {
        var total = 0;
        document.querySelectorAll('#sizeQtyGridP3 .qty-input').forEach(function (input) {
            total += parseInt(input.value, 10) || 0;
        });
        return total;
    }

    function tagLatestRows(saved) {
        var basket = [];
        try { basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]'); } catch (error) { basket = []; }
        basket.forEach(function (row) {
            var code = row.code || row.productCode || '';
            var colour = row.color || row.colour || '';
            if (code === saved.item.code && colour === saved.item.colour) {
                row.bundleTrial = 'kickstarter';
                row.bundleSlot = activeSlotId;
                row.bundlePrice = BUNDLE_PRICE;
            }
        });
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
    }

    function hookPopupSave() {
        if (typeof window.savePage3SelectionToBasket !== 'function') return;
        var original = window.savePage3SelectionToBasket;
        window.savePage3SelectionToBasket = function () {
            var slot = slotById(activeSlotId);
            var qty = selectedQty();
            var left = remaining(slot);
            if (qty > left) {
                window.alert(slot.label + ' has ' + left + ' place' + (left === 1 ? '' : 's') + ' left. Lower the quantity in the popup.');
                return false;
            }
            var saved = original.apply(this, arguments);
            if (!saved) return saved;
            slot.filled += saved.totalQty;
            slot.picks.push({
                qty: saved.totalQty,
                name: saved.item.code,
                colour: saved.item.colour || ''
            });
            var product = window.productData || {};
            slot.picks[slot.picks.length - 1].name = activeChoiceTitle || product.name || saved.item.code;
            tagLatestRows(saved);
            render();
            return saved;
        };
    }

    function start() {
        mount();
        hookPopupSave();
        loadGroups();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
