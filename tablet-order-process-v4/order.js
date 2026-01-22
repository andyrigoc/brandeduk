/**
 * Tablet Order Process v4 - JavaScript
 * Based on mobile/js/customize.js
 */

$(function() {
    'use strict';

    const VAT_RATE = 0.2;
    const VAT_KEY = 'brandeduk-vat-mode';

    // === WIZARD STATE ===
    const wizard = {
        step: 1,
        min: 1,
        max: 4
    };

    // === STATE ===
    const state = {
        product: {
            code: null,
            name: null,
            basePrice: 0,
            image: '',
            sizes: []
        },
        selectedColour: null,
        sizeQuantities: {},
        availableSizes: [],
        activeSize: null,
        selectedPositions: [],
        positionMethods: {},      // position -> 'embroidery' or 'print'
        positionLogos: {},        // position -> { original, processed, bgRemoved }
        currentUploadPosition: null
    };

    const FALLBACK_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

    // === DOM CACHE ===
    const $colourGrid = $('#colourGrid');
    const $selectedColourName = $('#selectedColourName');
    const $sizeChipGrid = $('#sizeChipGrid');
    const $activeSizeLabel = $('#activeSizeLabel');
    const $activeSizeQty = $('#activeSizeQty');
    const $sizeActiveBox = $('#sizeActiveBox');
    const $selectedSizesSummary = $('#selectedSizesSummary');
    const $totalQty = $('#totalQty');
    const $positionOptions = $('#positionOptions');
    const $logoFileInput = $('#logoFileInput');
    const $bgRemovalCanvas = $('#bgRemovalCanvas')[0];
    const $submitBtn = $('#submitBtn');
    const $pickAnotherBtn = $('#pickAnotherBtn');
    const $keepShoppingBtn = $('#keepShoppingBtn');

    // === INIT ===
    init();

    function init() {
        hydrateProductFromSession();
        setupWizard();
        setupStep4Redirects();
        setupColourSelection();
        setupSizeSelection();
        setupOrderSummarySidebar();
        setupPositionCards();
        setupLogoUpload();
        updateWizardUI();
        updateOrderSummarySidebar();
    }

    function hydrateProductFromSession() {
        let raw = null;
        try {
            raw = JSON.parse(sessionStorage.getItem('customizingProduct') || 'null');
        } catch {
            raw = null;
        }

        if (!raw) {
            try {
                raw = JSON.parse(sessionStorage.getItem('selectedProductData') || 'null');
            } catch {
                raw = null;
            }
        }

        const product = raw || {};
        state.product.code = product.code || product.productCode || product.sku || product.id || state.product.code;
        state.product.name = product.name || product.title || product.productName || product.displayName || state.product.name || 'Customise Your Product';
        state.product.basePrice = Number(product.price || product.basePrice || product.startPrice || product.startingPrice) || state.product.basePrice || 0;
        state.product.image = product.image || product.photo || state.product.image || '';
        state.product.sizes = normalizeProductSizesFromApi(product);

        state.availableSizes = sortSizes(state.product.sizes && state.product.sizes.length ? state.product.sizes : FALLBACK_SIZES);

        const titleEl = document.getElementById('productTitle');
        const codeEl = document.getElementById('productCode');
        if (titleEl) titleEl.textContent = state.product.name || 'Customise Your Product';
        if (codeEl) codeEl.textContent = state.product.code ? `#${state.product.code}` : 'Sample Product';
    }

    function normalizeProductSizesFromApi(productData) {
        const raw = productData || {};

        const normalizeList = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) {
                return value
                    .map(v => String(v || '').trim())
                    .filter(Boolean);
            }
            if (typeof value === 'string') {
                const parts = value.split(/[;,|]/g);
                const cleaned = parts.map(p => p.trim()).filter(Boolean);
                return cleaned.length ? cleaned : [value.trim()].filter(Boolean);
            }
            return [String(value).trim()].filter(Boolean);
        };

        const uniq = (arr) => {
            const out = [];
            const seen = new Set();
            arr.forEach(v => {
                const key = String(v).trim();
                if (!key) return;
                if (seen.has(key)) return;
                seen.add(key);
                out.push(key);
            });
            return out;
        };

        let sizes = [];
        sizes = sizes.concat(normalizeList(raw.sizes));
        sizes = sizes.concat(normalizeList(raw.SIZES));
        sizes = sizes.concat(normalizeList(raw.size));
        sizes = sizes.concat(normalizeList(raw.SIZE));
        sizes = sizes.concat(normalizeList(raw.SIEZE));
        sizes = sizes.concat(normalizeList(raw.sieze));

        const variantList = Array.isArray(raw.variants) ? raw.variants : (Array.isArray(raw.colors) ? raw.colors : []);
        if (variantList && variantList.length) {
            variantList.forEach(v => {
                sizes = sizes.concat(normalizeList(v?.sizes));
                sizes = sizes.concat(normalizeList(v?.SIEZE));
                sizes = sizes.concat(normalizeList(v?.sieze));
                sizes = sizes.concat(normalizeList(v?.size));
            });
        }

        sizes = uniq(sizes);

        const productType = String(raw.productType || raw.category || raw.type || '').trim().toLowerCase();
        const isOneSizeType = ['beanies', 'caps', 'aprons'].some(t => productType.includes(t));
        if ((!sizes || sizes.length === 0) && isOneSizeType) {
            return ['ONESIZE'];
        }

        return sizes || [];
    }

    function sortSizes(sizes) {
        const order = ['XXS','XS','S','M','L','XL','2XL','3XL','4XL','5XL','6XL','7XL','8XL','ONESIZE','ONE SIZE','OS','O/S'];
        const rank = new Map(order.map((s, i) => [s.toUpperCase(), i]));
        return (sizes || [])
            .map(s => String(s || '').trim())
            .filter(Boolean)
            .sort((a, b) => {
                const ra = rank.has(a.toUpperCase()) ? rank.get(a.toUpperCase()) : 999;
                const rb = rank.has(b.toUpperCase()) ? rank.get(b.toUpperCase()) : 999;
                if (ra !== rb) return ra - rb;
                return a.localeCompare(b);
            });
    }

    function setupStep4Redirects() {
        // Later you can change these targets to your real home/shop routes.
        $pickAnotherBtn.on('click', function() {
            window.location.href = '../index.html';
        });
        $keepShoppingBtn.on('click', function() {
            window.location.href = '../shop.html';
        });
    }

    // === WIZARD ===
    function setupWizard() {
        const $viewport = $('#wizardViewport');
        const $track = $('#wizardTrack');
        if (!$viewport.length) return;

        $('#btnBack').on('click', function() {
            goToStep(wizard.step - 1);
        });

        $('#btnNext').on('click', function() {
            if (wizard.step >= wizard.max) {
                $submitBtn.trigger('click');
                return;
            }
            if (!canAdvanceFromStep(wizard.step)) return;
            goToStep(wizard.step + 1);
        });

        // Swipe/drag support (scroll da destra a sinistra)
        if ($track.length) {
            setupWizardSwipe($viewport, $track);
        }
    }

    function goToStep(step) {
        const $viewport = $('#wizardViewport');
        const $track = $('#wizardTrack');
        if (!$viewport.length) return;

        wizard.step = clamp(step, wizard.min, wizard.max);
        updateWizardUI();

        const width = $viewport[0].clientWidth || 1;
        const targetX = -(wizard.step - 1) * width;
        animateTrackToX($track, targetX);
    }

    function getTrackX($track) {
        const m = ($track.css('transform') || '').match(/matrix\(([^)]+)\)/);
        if (!m) return 0;
        const parts = m[1].split(',').map(s => parseFloat(s.trim()));
        // matrix(a,b,c,d,tx,ty)
        return parts.length >= 6 ? parts[4] : 0;
    }

    function setTrackX($track, x) {
        $track.css('transform', `translate3d(${x}px, 0, 0)`);
    }

    function animateTrackToX($track, targetX) {
        if (!$track || !$track.length) return;
        const startX = getTrackX($track);
        const easing = $.easing && $.easing.easeOutBack ? 'easeOutBack' : 'swing';

        $({ x: startX }).stop(true).animate(
            { x: targetX },
            {
                duration: 520,
                easing,
                step: function(now) {
                    setTrackX($track, now);
                },
                complete: function() {
                    setTrackX($track, targetX);
                }
            }
        );
    }

    function setupWizardSwipe($viewport, $track) {
        let isDown = false;
        let isDragging = false;
        let startClientX = 0;
        let startClientY = 0;
        let startX = 0;
        let lastClientX = 0;
        let lastTime = 0;

        function width() {
            return $viewport[0].clientWidth || 1;
        }

        function boundsClamp(x) {
            const minX = -(wizard.max - 1) * width();
            const maxX = 0;
            // small rubber band
            if (x < minX) return minX - Math.min(60, (minX - x) * 0.25);
            if (x > maxX) return maxX + Math.min(60, (x - maxX) * 0.25);
            return x;
        }

        $viewport.on('pointerdown', function(e) {
            // only primary button
            if (e.originalEvent && e.originalEvent.button && e.originalEvent.button !== 0) return;

            // Don't hijack interactions (colour swatches, selects, buttons, etc.)
            if ($(e.target).closest('button, a, input, select, textarea, label').length) return;

            isDown = true;
            isDragging = false;
            startClientX = e.originalEvent ? e.originalEvent.clientX : e.clientX;
            startClientY = e.originalEvent ? e.originalEvent.clientY : e.clientY;
            lastClientX = startClientX;
            lastTime = Date.now();
            startX = getTrackX($track);
        });

        $viewport.on('pointermove', function(e) {
            if (!isDown) return;
            const clientX = e.originalEvent ? e.originalEvent.clientX : e.clientX;
            const clientY = e.originalEvent ? e.originalEvent.clientY : e.clientY;
            const dx = clientX - startClientX;
            const dy = clientY - startClientY;

            // Only start dragging on clear horizontal intent
            if (!isDragging) {
                if (Math.abs(dx) < 10) return;
                if (Math.abs(dy) > Math.abs(dx)) {
                    // treat as vertical scroll; don't drag
                    isDown = false;
                    return;
                }
                isDragging = true;
            }

            const x = boundsClamp(startX + dx);
            setTrackX($track, x);
            lastClientX = clientX;
            lastTime = Date.now();
        });

        $viewport.on('pointerup pointercancel', function(e) {
            if (!isDown) return;
            isDown = false;

            // If it was just a tap, do nothing (let normal clicks work)
            if (!isDragging) return;

            const currentX = getTrackX($track);
            const w = width();
            const rawStep = Math.round(Math.abs(currentX) / w) + 1;
            const targetStep = clamp(rawStep, wizard.min, wizard.max);
            wizard.step = targetStep;
            updateWizardUI();
            animateTrackToX($track, -(wizard.step - 1) * w);
        });

        // Keep position correct on resize
        $(window).on('resize', function() {
            setTrackX($track, -(wizard.step - 1) * width());
        });
    }

    function updateWizardUI() {
        $('.progress-step').each(function() {
            const $s = $(this);
            const s = parseInt($s.attr('data-step') || '0', 10);
            $s.toggleClass('active', s === wizard.step);
            $s.toggleClass('completed', s < wizard.step);
        });

        $('#btnBack').prop('disabled', wizard.step <= wizard.min);
        $('#btnNext').prop('disabled', !canAdvanceFromStep(wizard.step));
        $('#btnNext').text(wizard.step >= wizard.max ? 'Finish' : 'Continue');

        updateReview();
        updateCurrentItemSummary();
    }

    function canAdvanceFromStep(step) {
        if (step === 1) {
            return !!state.selectedColour;
        }
        if (step === 2) {
            return getTotalQty() > 0;
        }
        if (step === 3) {
            if (!state.selectedPositions.length) return false;
            return state.selectedPositions.every(pos => !!state.positionMethods[pos]);
        }
        return true;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getTotalQty() {
        return Object.values(state.sizeQuantities || {}).reduce((sum, q) => sum + (Number(q) || 0), 0);
    }

    // === COLOUR SELECTION ===
    function setupColourSelection() {
        $colourGrid.on('click', '.colour-swatch', function() {
            $colourGrid.find('.colour-swatch').removeClass('selected');
            $(this).addClass('selected');
            state.selectedColour = $(this).data('colour');
            $selectedColourName.text(state.selectedColour);
            updateWizardUI();
            updateOrderSummarySidebar();
        });
    }

    // === SIZE SELECTION ===
    function setupSizeSelection() {
        renderSizeChips();

        if (!state.activeSize && state.availableSizes && state.availableSizes.length) {
            setActiveSize(state.availableSizes[0]);
        }

        $('#activeSizeMinus').on('click', function() { adjustActiveSize(-1); });
        $('#activeSizePlus').on('click', function() { adjustActiveSize(1); });

        $sizeChipGrid.on('click', '.size-chip', function() {
            setActiveSize($(this).attr('data-size') || null);
        });

        updateTotalsUI();
        updateSelectedSizesSummary();
        updateWizardUI();
    }

    function renderSizeChips() {
        if (!$sizeChipGrid.length) return;
        const sizes = state.availableSizes || [];
        if (!sizes.length) {
            $sizeChipGrid.html('<div class="size-chip-empty">No sizes available</div>');
            return;
        }

        const html = sizes.map(size => {
            const qty = Number(state.sizeQuantities[size]) || 0;
            const activeClass = state.activeSize === size ? 'active' : '';
            const qtyLabel = qty > 0
                ? `<span class="size-chip-qty">${qty}</span>`
                : `<span class="size-chip-qty" style="opacity:0.25">0</span>`;
            return `<button type="button" class="size-chip ${activeClass}" data-size="${escapeAttr(size)}" aria-label="Size ${escapeAttr(size)}">${escapeHtml(size)}${qtyLabel}</button>`;
        }).join('');

        $sizeChipGrid.html(html);
    }

    function setActiveSize(size) {
        if (!size) return;
        state.activeSize = size;
        $activeSizeLabel.text(size);
        $sizeActiveBox.addClass('active');
        $activeSizeQty.text(Number(state.sizeQuantities[size]) || 0);
        renderSizeChips();
        updateSelectedSizesSummary();
        updateTotalsUI();
        updateWizardUI();
        updateOrderSummarySidebar();
    }

    function adjustActiveSize(delta) {
        if (!state.activeSize && state.availableSizes && state.availableSizes.length) {
            setActiveSize(state.availableSizes[0]);
        }

        const size = state.activeSize;
        if (!size) return;

        const current = Number(state.sizeQuantities[size]) || 0;
        const next = Math.max(0, current + delta);

        if (next <= 0) {
            delete state.sizeQuantities[size];
        } else {
            state.sizeQuantities[size] = next;
        }

        $activeSizeQty.text(next);
        updateTotalsUI();
        renderSizeChips();
        updateSelectedSizesSummary();
        updateWizardUI();
        updateOrderSummarySidebar();
    }

    function updateTotalsUI() {
        $totalQty.text(getTotalQty());
    }

    function updateSelectedSizesSummary() {
        if (!$selectedSizesSummary.length) return;
        const parts = Object.entries(state.sizeQuantities || {})
            .filter(([, qty]) => (Number(qty) || 0) > 0)
            .map(([size, qty]) => `${size}×${qty}`);
        $selectedSizesSummary.text(parts.length ? parts.join('  ') : 'No sizes selected');
    }

    // === POSITION CARDS ===
    function setupPositionCards() {
        // Click on image/preview area to RESET the card (as requested)
        $positionOptions.on('click', '.position-preview, .position-placeholder', function(e) {
            e.stopPropagation();
            const $card = $(this).closest('.position-card');
            const position = $card.data('position');
            const hasLogo = !!state.positionLogos[position];

            // Rule: if logo already uploaded, do NOT reset via image.
            // Customer must use the small bin (delete-logo-btn) to restart.
            if (hasLogo) return;

            fullResetPositionCard($card);
            updateWizardUI();
        });

        // Click on card to select/deselect
        $positionOptions.on('click', '.position-card', function(e) {
            // Don't toggle if clicking on buttons
            if ($(e.target).closest('.price-badge, .remove-bg-btn, .delete-logo-btn').length) {
                return;
            }

            const $card = $(this);
            const $checkbox = $card.find('input[type="checkbox"]');
            const position = $card.data('position');

            if ($card.hasClass('selected')) {
                // Mobile-ish rule: only allow deselect when there's no method and no logo
                const hasMethod = !!state.positionMethods[position];
                const hasLogo = !!state.positionLogos[position];
                if (hasMethod || hasLogo) {
                    return;
                }

                $card.removeClass('selected');
                $checkbox.prop('checked', false);
                state.selectedPositions = state.selectedPositions.filter(p => p !== position);
            } else {
                // Select
                $card.addClass('selected');
                $checkbox.prop('checked', true);
                if (!state.selectedPositions.includes(position)) {
                    state.selectedPositions.push(position);
                }
            }

            updateWizardUI();
        });

        // Click on price badge: method selection OR add-logo upload
        $positionOptions.on('click', '.price-badge', function(e) {
            e.stopPropagation();

            const $badge = $(this);
            const $card = $badge.closest('.position-card');
            const position = $card.data('position');
            const role = $badge.attr('data-role') || 'method';
            const method = $badge.data('method');

            // Select the card if not already
            if (!$card.hasClass('selected')) {
                $card.addClass('selected');
                $card.find('input[type="checkbox"]').prop('checked', true);
                if (!state.selectedPositions.includes(position)) {
                    state.selectedPositions.push(position);
                }
            }

            // Set method
            if (role === 'add-logo') {
                state.currentUploadPosition = position;
                $logoFileInput.trigger('click');
                return;
            }

            if (!method) return;
            const hasLogo = !!state.positionLogos[position];
            const currentMethod = state.positionMethods[position];

            // If user taps the already-selected method and no logo exists, reset the method UI
            if (!hasLogo && currentMethod === method) {
                delete state.positionMethods[position];
                $card.find('.price-badge').each(function() { resetPriceBadge($(this)); });
                updateWizardUI();
                return;
            }

            state.positionMethods[position] = method;
            applyMethodUI($card, method);
            updateWizardUI();
        });

        // Remove BG button
        $positionOptions.on('click', '.remove-bg-btn', function(e) {
            e.stopPropagation();
            const $card = $(this).closest('.position-card');
            const position = $card.data('position');
            removeImageBackground($card, position);
        });

        // Delete logo button
        $positionOptions.on('click', '.delete-logo-btn', function(e) {
            e.stopPropagation();
            const $card = $(this).closest('.position-card');
            clearCardLogo($card);
            updateWizardUI();
        });
    }

    function fullResetPositionCard($card) {
        if (!$card || !$card.length) return;
        const position = $card.data('position');

        // Clear selection
        $card.removeClass('selected');
        $card.find('input[type="checkbox"]').prop('checked', false);
        state.selectedPositions = state.selectedPositions.filter(p => p !== position);

        // Clear method + badges
        delete state.positionMethods[position];
        $card.find('.price-badge').each(function() { resetPriceBadge($(this)); });

        // Clear logo
        resetCardLogo($card);

        if (state.currentUploadPosition === position) {
            state.currentUploadPosition = null;
        }
    }

    // === Mobile port: badge UI transform ===
    function resetPriceBadge($badge) {
        const method = $badge.data('method');
        const defaultLabel = ($badge.attr('data-default-label') || (method === 'embroidery' ? 'EMBROIDERY' : 'PRINT')).toString();
        const defaultPrice = ($badge.attr('data-default-price') || '').toString();

        $badge.removeClass('add-logo-btn logo-added active');
        $badge.attr('data-role', 'method');
        $badge.html(
            '<span class="price-label">' + escapeHtml(defaultLabel) + '</span>' +
            '<span class="price-value">' + escapeHtml(defaultPrice) + '</span>'
        );
    }

    function applyMethodUI($card, method) {
        const $badges = $card.find('.price-badge');
        const $selected = $badges.filter('[data-method="' + method + '"]');
        const $other = $badges.not($selected);

        $badges.each(function() { resetPriceBadge($(this)); });
        $selected.addClass('active');

        $other
            .attr('data-role', 'add-logo')
            .addClass('add-logo-btn')
            .html(
                '<svg class="add-logo-cloud-icon" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '  <path d="M46 26c-.9-6.4-6.4-11.4-13.1-11.4-5.1 0-9.6 2.8-11.8 7-5.5.6-9.8 5.2-9.8 10.9 0 6.1 4.9 11.1 11.1 11.1h23.2c5.3 0 9.6-4.3 9.6-9.6 0-5-3.8-9.1-8.8-10z" fill="none" stroke="currentColor" stroke-width="3"/>' +
                '  <g class="cloud-arrow-anim">' +
                '    <path d="M30 23v18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
                '    <path d="M22 31l8-8 8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
                '  </g>' +
                '</svg>' +
                '<div class="add-logo-text">Add Logo</div>'
            );

        // Preserve logo-added state if a logo already exists
        const position = $card.data('position');
        if (state.positionLogos[position] && state.positionLogos[position].processed) {
            $card.find('.price-badge[data-role="add-logo"]').addClass('logo-added');
        }
    }

    function resetCardLogo($card) {
        const position = $card.data('position');

        // Hide logo overlay
        $card.find('.logo-overlay-box').attr('hidden', true);
        $card.find('.logo-overlay-img').attr('src', '');

        // Hide uploaded logo container
        $card.find('.uploaded-logo-container').attr('hidden', true);
        $card.find('.uploaded-logo-thumb').attr('src', '');

        // Reset remove BG button
        $card.find('.remove-bg-btn').removeClass('done').find('span').text('Remove BG');

        // Clear from state
        delete state.positionLogos[position];
    }

    function clearCardLogo($card) {
        const position = $card.data('position');
        resetCardLogo($card);

        // If a method is selected, keep the method UI and just remove the green logo state
        const method = state.positionMethods[position];
        if (method) {
            applyMethodUI($card, method);
            $card.find('.price-badge[data-role="add-logo"]').removeClass('logo-added');
        } else {
            // No method selected; restore defaults
            $card.find('.price-badge').each(function() { resetPriceBadge($(this)); });
        }
    }

    // === LOGO UPLOAD ===
    function setupLogoUpload() {
        $logoFileInput.on('change', function(e) {
            const file = e.target.files[0];
            if (!file || !state.currentUploadPosition) return;

            const position = state.currentUploadPosition;
            const $card = $positionOptions.find(`[data-position="${position}"]`);

            if (!file.type.match(/image.*/)) {
                alert('Please upload an image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(ev) {
                const imgData = ev.target.result;

                // Store original
                state.positionLogos[position] = {
                    original: imgData,
                    processed: imgData,
                    bgRemoved: false
                };

                // Show on card
                showLogoOnCard($card, imgData);

                // Mark add-logo badge as logo-added (mobile-style)
                $card.find('.price-badge[data-role="add-logo"]').addClass('logo-added');

                // Auto remove background
                setTimeout(() => removeImageBackground($card, position), 200);

                updateWizardUI();
            };
            reader.readAsDataURL(file);

            // Reset input
            $(this).val('');
        });
    }

    function showLogoOnCard($card, imgData) {
        // Show logo overlay on garment
        const $overlay = $card.find('.logo-overlay-box');
        $overlay.removeAttr('hidden');
        $overlay.find('.logo-overlay-img').attr('src', imgData);

        // Show uploaded logo container
        const $container = $card.find('.uploaded-logo-container');
        $container.removeAttr('hidden');
        $container.find('.uploaded-logo-thumb').attr('src', imgData);
    }

    // === BACKGROUND REMOVAL (from mobile/js/customize.js) ===
    function removeImageBackground($card, position) {
        const logoData = state.positionLogos[position];
        if (!logoData || !logoData.original) return;

        const $btn = $card.find('.remove-bg-btn');
        $btn.find('span').text('Processing...');

        setTimeout(() => {
            try {
                const ctx = $bgRemovalCanvas.getContext('2d', { willReadFrequently: true });
                const img = new Image();

                img.onload = function() {
                    $bgRemovalCanvas.width = img.width;
                    $bgRemovalCanvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const data = imageData.data;

                    // Sample corners for background color
                    const corners = [
                        { x: 0, y: 0 },
                        { x: img.width - 1, y: 0 },
                        { x: 0, y: img.height - 1 },
                        { x: img.width - 1, y: img.height - 1 }
                    ];

                    let bgR = 0, bgG = 0, bgB = 0, count = 0;
                    corners.forEach(corner => {
                        const idx = (corner.y * img.width + corner.x) * 4;
                        bgR += data[idx];
                        bgG += data[idx + 1];
                        bgB += data[idx + 2];
                        count++;
                    });
                    bgR = Math.round(bgR / count);
                    bgG = Math.round(bgG / count);
                    bgB = Math.round(bgB / count);

                    // Tolerance for background detection (closer to mobile)
                    const tolerance = 42;
                    const tol2 = tolerance * tolerance;

                    // Flood fill from edges (avoid Set/shift for speed)
                    const w = img.width;
                    const h = img.height;
                    const visited = new Uint8Array(w * h);
                    let q = [];

                    // Seed edges
                    for (let x = 0; x < w; x++) {
                        q.push(x, 0);
                        q.push(x, h - 1);
                    }
                    for (let y = 0; y < h; y++) {
                        q.push(0, y);
                        q.push(w - 1, y);
                    }

                    let head = 0;
                    while (head < q.length) {
                        const x = q[head++];
                        const y = q[head++];
                        if (x < 0 || x >= w || y < 0 || y >= h) continue;

                        const pIndex = y * w + x;
                        if (visited[pIndex]) continue;
                        visited[pIndex] = 1;

                        const idx = pIndex * 4;
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];

                        const dr = r - bgR;
                        const dg = g - bgG;
                        const db = b - bgB;
                        if ((dr * dr + dg * dg + db * db) > tol2) continue;

                        data[idx + 3] = 0;

                        q.push(x + 1, y);
                        q.push(x - 1, y);
                        q.push(x, y + 1);
                        q.push(x, y - 1);
                    }

                    ctx.putImageData(imageData, 0, 0);

                    const processedData = $bgRemovalCanvas.toDataURL('image/png');

                    // Update state
                    logoData.processed = processedData;
                    logoData.bgRemoved = true;

                    // Update UI
                    showLogoOnCard($card, processedData);
                    $btn.addClass('done').find('span').text('BG Removed ✓');

                    updateWizardUI();
                };

                img.src = logoData.original;

            } catch (error) {
                console.error('Background removal failed:', error);
                $btn.find('span').text('Remove BG');
            }
        }, 100);
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
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/`/g, '&#96;');
    }

    function updateReview() {
        $('#reviewColour').text(state.selectedColour || '-');
        $('#reviewQty').text(getTotalQty());

        if (!state.selectedPositions.length) {
            $('#reviewPositions').text('-');
            return;
        }

        const parts = state.selectedPositions.map(pos => {
            const $card = $positionOptions.find(`[data-position="${pos}"]`);
            const name = ($card.find('.position-checkbox span').text() || pos).trim();
            const method = state.positionMethods[pos] || '';
            const hasLogo = !!(state.positionLogos[pos] && state.positionLogos[pos].processed);
            return name + (method ? ` (${method})` : '') + (hasLogo ? ' +logo' : '');
        });

        $('#reviewPositions').text(parts.join(' | '));
    }

    // === SUBMIT ===
    $submitBtn.on('click', function() {
        const totalQty = getTotalQty();
        if (!state.product || !state.product.code) {
            alert('Missing product info. Please start from a product page.');
            return;
        }
        if (!state.selectedColour) {
            alert('Please choose a colour.');
            return;
        }
        if (totalQty <= 0) {
            alert('Please select size quantities.');
            return;
        }

        const product = {
            code: state.product.code,
            name: state.product.name,
            color: state.selectedColour,
            image: state.product.image || '',
            price: Number(state.product.basePrice) || 0,
            quantities: { ...state.sizeQuantities },
            quantity: totalQty,
            positions: state.selectedPositions.slice(),
            methods: { ...state.positionMethods },
            logos: {}
        };

        Object.keys(state.positionLogos).forEach(pos => {
            product.logos[pos] = state.positionLogos[pos].processed;
        });

        addToBasket(product);
        updateOrderSummarySidebar();
        alert('Added to basket!');
    });

    // === ORDER SUMMARY SIDEBAR (reused tablet logic) ===
    function isVatIncluded() {
        return localStorage.getItem(VAT_KEY) === 'on';
    }

    function vatSuffix() {
        return isVatIncluded() ? 'inc VAT' : 'ex VAT';
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

    function buildGroupedBasketItems(basket) {
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

    function basketTotalQty(grouped) {
        return grouped.reduce((sum, g) => sum + (Number(g.qty) || 0), 0);
    }

    function setupOrderSummarySidebar() {
        // Re-render on basket updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'quoteBasket' || e.key === VAT_KEY) updateOrderSummarySidebar();
        });
        window.addEventListener('basketUpdated', updateOrderSummarySidebar);
        window.addEventListener('vatToggleChanged', updateOrderSummarySidebar);

        // Delegated +/- + remove
        $('#basketItemsList')
            .on('click', '.qty-toggle-btn.plus', function() {
                const idx = parseInt($(this).attr('data-index') || '0', 10);
                const size = $(this).attr('data-size') || '';
                updateBasketItemQuantity(idx, 1, size);
            })
            .on('click', '.qty-toggle-btn.minus', function() {
                const idx = parseInt($(this).attr('data-index') || '0', 10);
                const size = $(this).attr('data-size') || '';
                updateBasketItemQuantity(idx, -1, size);
            })
            .on('click', '.remove-item-btn', function() {
                const idx = parseInt($(this).attr('data-index') || '0', 10);
                const size = $(this).attr('data-size') || '';
                removeBasketGroup(idx, size);
            });
    }

    function updateOrderSummarySidebar() {
        const root = document.getElementById('tabletOrderSummary');
        if (!root) return;

        const basket = readBasket();
        const grouped = buildGroupedBasketItems(basket);
        const totalQty = basketTotalQty(grouped);

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
                        <div class="product-sizes">${g.qty}×${escapeHtml(g.size || '')}</div>
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
        }
    }

    function updateBasketItemQuantity(index, delta, size) {
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
        updateOrderSummarySidebar();
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
        updateOrderSummarySidebar();
    }

    function addToBasket(product) {
        try {
            const basket = readBasket();
            const existingIndex = basket.findIndex(item => item.code === product.code && item.color === product.color);

            if (existingIndex > -1) {
                const existing = basket[existingIndex];
                if (product.quantities) {
                    existing.quantities = existing.quantities || {};
                    Object.keys(product.quantities).forEach(size => {
                        existing.quantities[size] = (existing.quantities[size] || 0) + (Number(product.quantities[size]) || 0);
                    });
                    existing.quantity = Object.values(existing.quantities).reduce((sum, q) => sum + (Number(q) || 0), 0);
                }
            } else {
                basket.push(product);
            }

            writeBasket(basket);
        } catch (e) {
            console.error('Error adding to basket:', e);
        }
    }

    function updateCurrentItemSummary() {
        const productNameEl = document.getElementById('currentProductName');
        const colourEl = document.getElementById('currentColour');
        const sizesEl = document.getElementById('currentSizes');
        const positionsEl = document.getElementById('currentPositions');

        if (productNameEl) productNameEl.textContent = state.product?.name || '-';
        if (colourEl) colourEl.textContent = state.selectedColour || '-';

        const sizeParts = Object.entries(state.sizeQuantities || {})
            .filter(([, q]) => (Number(q) || 0) > 0)
            .map(([s, q]) => `${s}×${q}`);
        if (sizesEl) sizesEl.textContent = sizeParts.length ? sizeParts.join(' ') : '-';

        if (!state.selectedPositions.length) {
            if (positionsEl) positionsEl.textContent = '-';
            return;
        }

        const posParts = state.selectedPositions.map(pos => {
            const $card = $positionOptions.find(`[data-position="${pos}"]`);
            const name = ($card.find('.position-checkbox span').text() || pos).trim();
            const method = state.positionMethods[pos] || '';
            return name + (method ? ` (${method})` : '');
        });

        if (positionsEl) positionsEl.textContent = posParts.join(' | ');
    }

});
