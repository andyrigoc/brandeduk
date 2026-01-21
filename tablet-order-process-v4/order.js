/**
 * Tablet Order Process v4 - JavaScript
 * Based on mobile/js/customize.js
 */

$(function() {
    'use strict';

    // === WIZARD STATE ===
    const wizard = {
        step: 1,
        min: 1,
        max: 4
    };

    // === STATE ===
    const state = {
        selectedColour: null,
        sizeQuantities: {},
        selectedPositions: [],
        positionMethods: {},      // position -> 'embroidery' or 'print'
        positionLogos: {},        // position -> { original, processed, bgRemoved }
        currentUploadPosition: null
    };

    // Available sizes
    const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

    // === DOM CACHE ===
    const $colourGrid = $('#colourGrid');
    const $selectedColourName = $('#selectedColourName');
    const $selectedSizes = $('#selectedSizes');
    const $addSizeBtn = $('#addSizeBtn');
    const $totalQty = $('#totalQty');
    const $positionOptions = $('#positionOptions');
    const $logoFileInput = $('#logoFileInput');
    const $bgRemovalCanvas = $('#bgRemovalCanvas')[0];
    const $submitBtn = $('#submitBtn');

    // === INIT ===
    init();

    function init() {
        setupWizard();
        setupColourSelection();
        setupSizeSelection();
        setupPositionCards();
        setupLogoUpload();
        addInitialSizeRow();
        updateWizardUI();
    }

    // === WIZARD ===
    function setupWizard() {
        const $viewport = $('#wizardViewport');
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

        // Sync when user swipes/scrolls manually
        let scrollTimer;
        $viewport.on('scroll', function() {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function() {
                const width = $viewport[0].clientWidth || 1;
                const s = Math.round($viewport[0].scrollLeft / width) + 1;
                const newStep = clamp(s, wizard.min, wizard.max);
                if (newStep !== wizard.step) {
                    wizard.step = newStep;
                    updateWizardUI();
                }
            }, 80);
        });
    }

    function goToStep(step) {
        const $viewport = $('#wizardViewport');
        if (!$viewport.length) return;

        wizard.step = clamp(step, wizard.min, wizard.max);
        updateWizardUI();

        const width = $viewport[0].clientWidth || 1;
        const targetScrollLeft = (wizard.step - 1) * width;
        const easing = $.easing && $.easing.easeOutBack ? 'easeOutBack' : 'swing';
        $viewport.stop().animate({ scrollLeft: targetScrollLeft }, 520, easing);
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
        let total = 0;
        $selectedSizes.find('.size-qty-item').each(function() {
            const size = $(this).find('.size-select').val();
            const qty = parseInt($(this).find('.item-qty-input').val()) || 0;
            if (size && qty > 0) total += qty;
        });
        return total;
    }

    // === COLOUR SELECTION ===
    function setupColourSelection() {
        $colourGrid.on('click', '.colour-swatch', function() {
            $colourGrid.find('.colour-swatch').removeClass('selected');
            $(this).addClass('selected');
            state.selectedColour = $(this).data('colour');
            $selectedColourName.text(state.selectedColour);
            updateWizardUI();
        });
    }

    // === SIZE SELECTION ===
    function setupSizeSelection() {
        // Add size button
        $addSizeBtn.on('click', function() {
            addSizeRow();
        });

        // Delegated events for size controls
        $('#sizeQtyCompact').on('click', '.item-qty-btn.minus', function() {
            const $input = $(this).siblings('.item-qty-input');
            let val = parseInt($input.val()) || 0;
            if (val > 0) {
                $input.val(val - 1);
                updateTotalQty();
                updateWizardUI();
            }
        });

        $('#sizeQtyCompact').on('click', '.item-qty-btn.plus', function() {
            const $input = $(this).siblings('.item-qty-input');
            let val = parseInt($input.val()) || 0;
            if (val < 999) {
                $input.val(val + 1);
                updateTotalQty();
                updateWizardUI();
            }
        });

        $('#sizeQtyCompact').on('click', '.remove-size-btn', function() {
            $(this).closest('.size-qty-item').remove();
            updateAvailableSizes();
            updateTotalQty();
            updateWizardUI();
        });

        $('#sizeQtyCompact').on('change', '.size-select', function() {
            updateAvailableSizes();
            updateTotalQty();
            updateWizardUI();
        });

        $('#sizeQtyCompact').on('input change', '.item-qty-input', function() {
            updateTotalQty();
            updateWizardUI();
        });
    }

    function addInitialSizeRow() {
        addSizeRow();
    }

    function addSizeRow() {
        const usedSizes = getUsedSizes();
        const availableSizes = AVAILABLE_SIZES.filter(s => !usedSizes.includes(s));

        if (availableSizes.length === 0) {
            alert('All sizes have been added');
            return;
        }

        let optionsHTML = '<option value="">Size</option>';
        availableSizes.forEach(size => {
            optionsHTML += `<option value="${size}">${size}</option>`;
        });

        const $row = $(`
            <div class="size-qty-item">
                <select class="size-select">${optionsHTML}</select>
                <div class="item-qty-control">
                    <button type="button" class="item-qty-btn minus">−</button>
                    <input type="number" class="item-qty-input" value="1" min="0" max="999">
                    <button type="button" class="item-qty-btn plus">+</button>
                </div>
                <button type="button" class="remove-size-btn">×</button>
            </div>
        `);

        $selectedSizes.append($row);
        updateAvailableSizes();
        updateTotalQty();
        updateWizardUI();
    }

    function getUsedSizes() {
        const used = [];
        $selectedSizes.find('.size-select').each(function() {
            const val = $(this).val();
            if (val) used.push(val);
        });
        return used;
    }

    function updateAvailableSizes() {
        const usedSizes = getUsedSizes();

        $selectedSizes.find('.size-select').each(function() {
            const $select = $(this);
            const currentVal = $select.val();
            const otherUsed = usedSizes.filter(s => s !== currentVal);

            let optionsHTML = '<option value="">Size</option>';
            AVAILABLE_SIZES.forEach(size => {
                if (!otherUsed.includes(size)) {
                    const selected = size === currentVal ? 'selected' : '';
                    optionsHTML += `<option value="${size}" ${selected}>${size}</option>`;
                }
            });

            $select.html(optionsHTML);
        });

        // Show/hide add button
        const remaining = AVAILABLE_SIZES.filter(s => !usedSizes.includes(s));
        $addSizeBtn.toggle(remaining.length > 0);
    }

    function updateTotalQty() {
        state.sizeQuantities = {};
        let total = 0;
        $selectedSizes.find('.size-qty-item').each(function() {
            const size = $(this).find('.size-select').val();
            const qty = parseInt($(this).find('.item-qty-input').val()) || 0;
            if (size && qty > 0) {
                total += qty;
                state.sizeQuantities[size] = qty;
            }
        });
        $totalQty.text(total);
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
                state.selectedPositions.push(position);
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
                state.selectedPositions.push(position);
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
        // Collect data
        const orderData = {
            colour: state.selectedColour,
            sizes: state.sizeQuantities,
            positions: state.selectedPositions,
            methods: state.positionMethods,
            logos: {}
        };

        // Include logo data
        Object.keys(state.positionLogos).forEach(pos => {
            orderData.logos[pos] = state.positionLogos[pos].processed;
        });

        console.log('Order Data:', orderData);
        alert('Order added to quote! Check console for details.');
    });

});
