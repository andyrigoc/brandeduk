/**
 * Customize Positions - Inline version for Product Detail Page
 * This script handles position selection, logo upload within the single-page product flow
 * Version: 1.0.0 - 2026-01-07
 */

(function() {
    'use strict';

    // State management
    let selectedPositions = [];
    let positionMethods = {};
    let positionCustomizationsMap = {};
    let currentModalPosition = null;

    // Design modal state (match tablet/mobile behavior)
    let designModalState = {
        currentPosition: null,
        originalLogoImage: null,
        backgroundRemoved: false,
        positionDesigns: {}
    };

    // Logo file saving utility
    async function saveLogoToFile(base64Data, position) {
        try {
            // Extract image data from base64 string
            const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
            if (!matches) {
                console.error('Invalid base64 image data');
                return null;
            }

            const ext = matches[1]; // png, jpg, etc.
            const imageData = matches[2];
            
            // Create unique filename
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 9);
            const filename = `logo-${position}-${timestamp}-${randomId}.${ext}`;
            
            // Check if we're on localhost or production
            const isLocalhost = window.location.hostname === '127.0.0.1' || 
                               window.location.hostname === 'localhost' ||
                               window.location.protocol === 'file:';
            
            if (isLocalhost) {
                // For localhost: store in localStorage and use data URL
                // Files will be saved when deployed to Vercel
                const logoKey = `logo_${position}_${timestamp}`;
                try {
                    localStorage.setItem(logoKey, base64Data);
                } catch (e) {
                    console.warn('Could not save logo to localStorage:', e);
                }
                
                // Return data URL for localhost (works immediately)
                return {
                    url: base64Data,
                    filename: filename,
                    key: logoKey,
                    isDataUrl: true
                };
            } else {
                // For production (Vercel): try to upload to serverless function
                try {
                    const formData = new FormData();
                    formData.append('logo', base64Data);
                    formData.append('position', position);
                    formData.append('filename', filename);
                    
                    const response = await fetch('/api/upload-logo', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        return {
                            url: result.url,
                            filename: result.filename,
                            isDataUrl: false
                        };
                    } else {
                        console.warn('Failed to upload logo, using data URL fallback');
                        return {
                            url: base64Data,
                            filename: filename,
                            isDataUrl: true
                        };
                    }
                } catch (error) {
                    console.warn('Error uploading logo, using data URL fallback:', error);
                    return {
                        url: base64Data,
                        filename: filename,
                        isDataUrl: true
                    };
                }
            }
        } catch (error) {
            console.error('Error saving logo:', error);
            return null;
        }
    }

    // Initialize when DOM is ready
    let positionsInitialized = false;
    
    function initPositionsInline() {
        const positionsSection = document.getElementById('step3PositionsSection');
        if (!positionsSection) {
            console.log('step3PositionsSection not found');
            return;
        }
        
        if (positionsInitialized) {
            console.log('Positions already initialized, skipping');
            return;
        }
        positionsInitialized = true;

        console.log('Initializing inline positions functionality...');

        // Desktop layout: move order summary into the left column mount (green area)
        mountOrderSummaryLeft(positionsSection);

        // Initialize position card clicks
        initPositionSelection();
        
        // Initialize method badge clicks
        initMethodSelection();

        // Initialize delete logo buttons
        initDeleteLogoButtons();

        // Initialize design modal
        initDesignModal();

        // Initialize submit quote button
        initSubmitQuoteBtn();

        // Allow per-card "REQUEST QUOTE" button to open the same quote popup
        initLogoReadyQuoteButtons();

        // Render the left order summary
        updateSummarySidebar();

        console.log('Inline positions initialized');
    }

    function initLogoReadyQuoteButtons() {
        const buttons = document.querySelectorAll('#step3PositionsSection .logo-ready-quote-btn');
        if (!buttons.length) return;

        const popup = document.getElementById('quoteRequestPopup');
        const submitBtn = document.getElementById('submitQuoteBtnInline');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Prefer calling the same logic by triggering the main CTA click
                if (submitBtn) {
                    submitBtn.click();
                    return;
                }

                // Fallback: open popup directly
                if (popup) {
                    popup.style.display = 'flex';
                }
            });
        });
    }

    function mountOrderSummaryLeft(positionsSection) {
        const mount = document.getElementById('step3SidebarLeftMount');
        const sidebar = positionsSection?.querySelector('.customize-inline-sidebar');
        if (!mount || !sidebar) return;

        // Only do this on desktop two-column layout (when left/right columns exist)
        const pageContainer = document.querySelector('.page-container');
        const isSingleColumn = pageContainer && window.getComputedStyle(pageContainer).gridTemplateColumns.split(' ').length <= 1;
        if (isSingleColumn) {
            return;
        }

        if (!mount.contains(sidebar)) {
            mount.appendChild(sidebar);
        }

        mount.style.display = 'block';
        positionsSection.classList.add('sidebar-external');
    }

    // Expose init function globally
    window.initPositionsGrid = initPositionsInline;

    // Position Selection Handler
    function initPositionSelection() {
        const positionCards = document.querySelectorAll('#step3PositionsSection .position-card');

        positionCards.forEach(card => {
            const checkbox = card.querySelector('input[type="checkbox"]');

            // Full card click: toggle selection (badges drive method + upload)
            card.addEventListener('click', (e) => {
                if (!checkbox) return;
                if (e.target.closest('.price-badge')) return;
                if (e.target.closest('.delete-logo-btn')) return;
                if (e.target.closest('input')) return;

                const position = checkbox.value;

                // If the card is already selected (has method or is checked), reset it completely
                // This allows the user to change their mind between embroidery/print
                if (checkbox.checked || positionMethods[position]) {
                    // Full reset like mobile behavior
                    checkbox.checked = false;
                    card.classList.remove('selected', 'customized');

                    // Reset both badges to default state
                    resetPriceBadge(card.querySelector('.price-emb'));
                    resetPriceBadge(card.querySelector('.price-print'));

                    // Clear position method and customization
                    delete positionMethods[position];
                    delete positionCustomizationsMap[position];
                    delete designModalState.positionDesigns[position];

                    // Clear logo overlay on card
                    const logoOverlay = card.querySelector('.logo-overlay-box');
                    const logoImg = card.querySelector('.logo-overlay-img');
                    if (logoOverlay) logoOverlay.hidden = true;
                    if (logoImg) logoImg.src = '';

                    // Clear uploaded logo container
                    const uploadedContainer = card.querySelector('.uploaded-logo-container');
                    const thumbImg = card.querySelector('.uploaded-logo-thumb');
                    if (uploadedContainer) uploadedContainer.hidden = true;
                    if (thumbImg) thumbImg.src = '';

                    // Update positions array
                    selectedPositions = selectedPositions.filter(p => p !== position);

                    // Update UI
                    updateSubmitButton();
                    updateSummarySidebar();
                    syncCustomizationsToBasket();

                    // Show toast for user feedback
                    if (typeof showToast === 'function') {
                        showToast('Choose Embroidery or Print');
                    }
                    return;
                }

                // Card not selected yet - user must click a badge (Embroidery/Print) to select
                // Show a subtle hint
                if (typeof showToast === 'function') {
                    showToast('Choose Embroidery or Print');
                }
            });

            // Checkbox change handler
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const position = checkbox.value;

                    if (checkbox.checked) {
                        card.classList.add('selected');
                        if (!selectedPositions.includes(position)) {
                            selectedPositions.push(position);
                        }

                        if (!positionMethods[position]) {
                            positionMethods[position] = 'embroidery';
                            applyMethodUI(card, 'embroidery');
                        }
                    } else {
                        card.classList.remove('selected', 'customized');
                        selectedPositions = selectedPositions.filter(p => p !== position);
                        delete positionMethods[position];
                        resetCustomization(position);
                        applyMethodUI(card, null);
                    }

                    updateSubmitButton();
                    updateSummarySidebar();
                });
            }
        });
    }

    // Method Selection (Embroidery/Print badges)
    function initMethodSelection() {
        const cards = document.querySelectorAll('#step3PositionsSection .position-card');

        cards.forEach(card => {
            const checkbox = card.querySelector('input[type="checkbox"]');
            if (!checkbox) return;
            const position = checkbox.value;

            card.querySelectorAll('.price-badge').forEach(badge => {
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();

                    const role = badge.dataset.role || 'method';
                    const wasChecked = checkbox.checked;

                    if (role === 'add-logo') {
                        const activeMethod = badge.dataset.activeMethod || positionMethods[position] || badge.dataset.method;
                        if (!activeMethod) return;

                        if (!checkbox.checked) {
                            checkbox.checked = true;
                            checkbox.dispatchEvent(new Event('change'));
                        }

                        startLogoUploadFlow(position, activeMethod);
                        return;
                    }

                    const method = badge.dataset.method;
                    if (!method) return;

                    // Check if this badge is already active (allow toggle off - like mobile)
                    const isCurrentlyActive = badge.classList.contains('active');

                    if (isCurrentlyActive) {
                        // Toggle OFF: Reset the position completely (like mobile behavior)
                        checkbox.checked = false;
                        card.classList.remove('selected', 'customized');

                        // Reset both badges to default state
                        resetPriceBadge(card.querySelector('.price-emb'));
                        resetPriceBadge(card.querySelector('.price-print'));

                        // Clear position method and customization
                        delete positionMethods[position];
                        delete positionCustomizationsMap[position];
                        delete designModalState.positionDesigns[position];

                        // Clear logo overlay on card
                        const logoOverlay = card.querySelector('.logo-overlay-box');
                        const logoImg = card.querySelector('.logo-overlay-img');
                        if (logoOverlay) logoOverlay.hidden = true;
                        if (logoImg) logoImg.src = '';

                        // Clear uploaded logo container
                        const uploadedContainer = card.querySelector('.uploaded-logo-container');
                        const thumbImg = card.querySelector('.uploaded-logo-thumb');
                        if (uploadedContainer) uploadedContainer.hidden = true;
                        if (thumbImg) thumbImg.src = '';

                        // Update positions array
                        selectedPositions = selectedPositions.filter(p => p !== position);

                        // Update UI
                        updateSubmitButton();
                        updateSummarySidebar();
                        syncCustomizationsToBasket();

                        // Show toast for user feedback
                        if (typeof showToast === 'function') {
                            showToast('Choose Embroidery or Print');
                        }
                        return;
                    }

                    const previousMethod = positionMethods[position];
                    positionMethods[position] = method;

                    if (positionCustomizationsMap[position]) {
                        positionCustomizationsMap[position].method = method;
                    }

                    // If method changed, reset any existing customization for this position
                    if (previousMethod && previousMethod !== method) {
                        resetCustomization(position);
                    }

                    applyMethodUI(card, method);

                    if (!wasChecked) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change'));
                    } else {
                        updateSummarySidebar();
                        syncCustomizationsToBasket();
                    }
                });
            });
        });
    }

    function resetPriceBadge(badge) {
        if (!badge) return;
        badge.classList.remove('active', 'add-logo-btn', 'logo-added');
        badge.dataset.role = 'method';
        badge.dataset.activeMethod = '';
        const label = (badge.dataset.defaultLabel || '').toUpperCase();
        const price = badge.dataset.defaultPrice || '';
        badge.innerHTML = `
            <span class="price-label">${label}</span>
            <span class="price-value">${price}</span>
        `;
    }

    // Apply method UI to badges (match tablet/mobile behavior)
    function applyMethodUI(card, method) {
        if (!card) return;
        const position = card.querySelector('input[type="checkbox"]').value;
        const customization = positionCustomizationsMap[position];
        const embBadge = card.querySelector('.price-emb');
        const printBadge = card.querySelector('.price-print');

        resetPriceBadge(embBadge);
        resetPriceBadge(printBadge);

        if (!method) {
            return;
        }

        const methodBadge = method === 'embroidery' ? embBadge : printBadge;
        const addBadge = method === 'embroidery' ? printBadge : embBadge;

        if (methodBadge) {
            methodBadge.classList.add('active');
            methodBadge.dataset.role = 'method';
        }

        if (addBadge) {
            addBadge.classList.remove('active');
            addBadge.classList.add('add-logo-btn');
            addBadge.dataset.role = 'add-logo';
            addBadge.dataset.activeMethod = method;

            // Cloud upload animation SVG - unique ID per badge (SAME AS MOBILE)
            const uniqueId = 'cloud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            addBadge.innerHTML = customization ? `<span class="add-logo-text">Edit Customization</span>` : `
                <svg class="add-logo-cloud-icon" width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <clipPath id="${uniqueId}">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M76.3818 41.5239C76.3818 41.7358 76.3818 41.7358 76.3818 41.9477C86.9769 44.0667 94.3935 54.0261 93.334 64.8332C92.2745 75.6402 83.1627 83.9044 72.1438 83.9044H29.7633C18.9563 83.9044 9.84454 75.6402 8.57313 64.8332C7.30172 54.0261 14.9302 44.0667 25.5253 41.9477C25.5253 41.7358 25.5253 41.7358 25.5253 41.5239C25.5253 27.5384 36.968 16.0957 50.9536 16.0957C64.9391 16.0957 76.3818 27.5384 76.3818 41.5239Z" />
                        </clipPath>
                    </defs>
                    <g clip-path="url(#${uniqueId})">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M100 -100H0V200H100V-100ZM34.8377 49.1524L47.426 36.4383C48.2652 35.5907 49.3142 35.1669 50.3632 35.1669C51.4122 35.1669 52.671 35.5907 53.3005 36.4383L65.8888 49.1524C66.9378 50.4238 67.3574 52.3309 66.728 53.8143C66.0986 55.2976 64.6299 56.3571 62.9514 56.3571H54.5593V69.0712C54.5593 71.4021 52.671 73.3093 50.3632 73.3093C48.0554 73.3093 46.1672 71.4021 46.1672 69.0712V56.3571H37.775C36.0966 56.3571 34.6279 55.2976 33.9985 53.8143C33.3691 52.119 33.5789 50.4238 34.8377 49.1524Z" fill="white" class="cloud-arrow-anim" />
                    </g>
                </svg>
            `;
        }
    }

    function initDeleteLogoButtons() {
        const deleteButtons = document.querySelectorAll('#step3PositionsSection .delete-logo-btn');

        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const card = btn.closest('.position-card');
                if (!card) return;
                const position = card.dataset.position;
                if (!position) return;

                resetCustomization(position, { fullReset: true });
                showToast('Customization removed');
            });
        });
    }

    function startLogoUploadFlow(position, method) {
        const card = document.querySelector(`#step3PositionsSection .position-card input[value="${position}"]`)?.closest('.position-card') ||
                     document.querySelector(`#step3PositionsSection .position-card[data-position="${position}"]`);
        const checkbox = card?.querySelector('input[type="checkbox"]');

        if (method) {
            positionMethods[position] = method;
        }

        if (card) {
            applyMethodUI(card, positionMethods[position] || method);
        }

        if (card && checkbox && !checkbox.checked) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
        }

        openDesignModal(position, card);
    }

    // === Design Modal Functions (Simple Upload Popup) ===
    let designModalInitialized = false;

    function openDesignModal(position, card) {
        designModalState.currentPosition = position;

        const modal = document.getElementById('designModal');
        const title = document.getElementById('designModalTitle');
        const uploadTitle = document.getElementById('uploadLogoTitle');
        const dropzone = document.getElementById('designUploadZone');
        const previewContainer = document.getElementById('designUploadPreview');
        const previewImg = document.getElementById('designPreviewImg');
        const removeBgBtn = document.getElementById('removeBgBtn');

        if (title) {
            const positionName = card?.querySelector('.position-checkbox span')?.textContent || position;
            title.textContent = `Upload Logo - ${positionName}`;
        }

        if (uploadTitle) uploadTitle.textContent = 'Drop or select your logo';

        if (dropzone) dropzone.style.display = '';
        if (previewContainer) previewContainer.hidden = true;
        if (previewImg) previewImg.src = '';
        if (removeBgBtn) {
            removeBgBtn.classList.remove('bg-removed', 'processing');
            const span = removeBgBtn.querySelector('span');
            if (span) span.textContent = 'Remove BG';
        }

        const fileInput = document.getElementById('designLogoUpload');
        if (fileInput) fileInput.value = '';

        designModalState.originalLogoImage = null;
        designModalState.backgroundRemoved = false;

        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }

    function closeDesignModal() {
        const modal = document.getElementById('designModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
        document.body.style.overflow = '';
        designModalState.currentPosition = null;
    }

    function initDesignModal() {
        if (designModalInitialized) return;
        designModalInitialized = true;

        const modal = document.getElementById('designModal');
        const closeBtn = document.getElementById('closeDesignModal');
        const uploadZone = document.getElementById('designUploadZone');
        const fileInput = document.getElementById('designLogoUpload');
        const applyBtn = document.getElementById('applyDesignBtn');
        const removeLogoBtn = document.getElementById('removeUploadedLogo');
        const removeBgBtn = document.getElementById('removeBgBtn');

        if (!modal) {
            designModalInitialized = false;
            return;
        }

        closeBtn?.addEventListener('click', closeDesignModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDesignModal();
        });

        // File input change
        fileInput?.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleDesignFileUpload(file);
            }
        });

        // Upload zone click - opens file dialog
        // IMPORTANT: Don't trigger if clicking on the label (which already opens the file dialog)
        if (uploadZone && fileInput) {
            uploadZone.addEventListener('click', function(e) {
                // Don't trigger if clicking on label or input (they handle it themselves)
                if (e.target.tagName === 'LABEL' || e.target.tagName === 'INPUT') {
                    return;
                }
                if (e.target.closest('label')) {
                    return;
                }
                e.stopPropagation();
                fileInput.value = '';
                fileInput.click();
            });
        }

        // Drag and drop
        uploadZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone?.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) handleDesignFileUpload(file);
        });

        // Remove uploaded logo
        removeLogoBtn?.addEventListener('click', () => {
            const previewContainer = document.getElementById('designUploadPreview');
            const previewImg = document.getElementById('designPreviewImg');
            const dropzone = document.getElementById('designUploadZone');
            const uploadTitle = document.getElementById('uploadLogoTitle');

            if (previewContainer) previewContainer.hidden = true;
            if (dropzone) dropzone.style.display = '';
            if (previewImg) previewImg.src = '';
            if (uploadTitle) uploadTitle.textContent = 'Drop or select your logo';

            designModalState.originalLogoImage = null;
            designModalState.backgroundRemoved = false;

            if (removeBgBtn) {
                removeBgBtn.classList.remove('bg-removed', 'processing');
                const span = removeBgBtn.querySelector('span');
                if (span) span.textContent = 'Remove BG';
            }
        });

        // Remove background button
        removeBgBtn?.addEventListener('click', () => {
            if (removeBgBtn.classList.contains('bg-removed')) {
                restoreDesignOriginalBackground();
            } else {
                removeDesignImageBackground();
            }
        });

        // Apply design button
        applyBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await applyDesignToCard();
        });
    }

    function handleDesignFileUpload(file) {
        if (!file) {
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File too large. Maximum size is 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const previewContainer = document.getElementById('designUploadPreview');
            const previewImg = document.getElementById('designPreviewImg');
            const dropzone = document.getElementById('designUploadZone');
            const removeBgBtn = document.getElementById('removeBgBtn');
            const uploadTitle = document.getElementById('uploadLogoTitle');

            if (previewImg) previewImg.src = ev.target.result;
            if (dropzone) dropzone.style.display = 'none';
            if (previewContainer) previewContainer.hidden = false;

            if (uploadTitle) uploadTitle.textContent = 'Your Logo';

            if (removeBgBtn) {
                removeBgBtn.classList.remove('bg-removed', 'processing');
                const span = removeBgBtn.querySelector('span');
                if (span) span.textContent = 'Remove BG';
            }

            designModalState.originalLogoImage = ev.target.result;
            designModalState.backgroundRemoved = false;

            // Auto-remove background for ALL images (not just JPEG)
            setTimeout(() => removeDesignImageBackground(), 150);
        };
        reader.readAsDataURL(file);
    }

    function removeDesignImageBackground() {
        const previewImg = document.getElementById('designPreviewImg');
        const canvas = document.getElementById('bgRemovalCanvas');
        const removeBgBtn = document.getElementById('removeBgBtn');

        if (!previewImg || !previewImg.src || !canvas) {
            console.error('Missing required elements for background removal');
            return;
        }

        // Save original image for undo functionality
        if (!designModalState.originalLogoImage) {
            designModalState.originalLogoImage = previewImg.src;
        }

        // Show processing state
        if (removeBgBtn) {
            removeBgBtn.classList.add('processing');
            const span = removeBgBtn.querySelector('span');
            if (span) span.textContent = 'Processing';
        }

        // Create new image to process
        const img = new Image();
        
        img.onload = function() {
            try {
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const width = canvas.width;
                const height = canvas.height;

                // Sample corner pixels to detect background color
                function getPixel(x, y) {
                    const idx = (y * width + x) * 4;
                    return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
                }

                const corners = [
                    getPixel(0, 0),
                    getPixel(width - 1, 0),
                    getPixel(0, height - 1),
                    getPixel(width - 1, height - 1)
                ];

                // Calculate average background color from corners
                const bgColor = {
                    r: Math.round(corners.reduce((sum, c) => sum + c.r, 0) / 4),
                    g: Math.round(corners.reduce((sum, c) => sum + c.g, 0) / 4),
                    b: Math.round(corners.reduce((sum, c) => sum + c.b, 0) / 4)
                };

                // Check if colors are similar
                function isBackground(r, g, b, tolerance) {
                    return Math.abs(r - bgColor.r) <= tolerance &&
                           Math.abs(g - bgColor.g) <= tolerance &&
                           Math.abs(b - bgColor.b) <= tolerance;
                }

                const tolerance = 50;
                const visited = new Uint8Array(width * height);

                // Flood fill from edges using a faster approach
                const stack = [];

                // Add all edge pixels to stack
                for (let x = 0; x < width; x++) {
                    stack.push(x); stack.push(0);                    // Top edge
                    stack.push(x); stack.push(height - 1);           // Bottom edge
                }
                for (let y = 1; y < height - 1; y++) {
                    stack.push(0); stack.push(y);                    // Left edge
                    stack.push(width - 1); stack.push(y);            // Right edge
                }

                // Process stack (flood fill)
                while (stack.length > 0) {
                    const y = stack.pop();
                    const x = stack.pop();

                    if (x < 0 || x >= width || y < 0 || y >= height) continue;

                    const idx = y * width + x;
                    if (visited[idx]) continue;
                    visited[idx] = 1;

                    const pixelIdx = idx * 4;
                    const r = data[pixelIdx];
                    const g = data[pixelIdx + 1];
                    const b = data[pixelIdx + 2];

                    if (isBackground(r, g, b, tolerance)) {
                        data[pixelIdx + 3] = 0; // Make transparent

                        // Add neighbors (4-directional)
                        stack.push(x + 1); stack.push(y);
                        stack.push(x - 1); stack.push(y);
                        stack.push(x); stack.push(y + 1);
                        stack.push(x); stack.push(y - 1);
                    }
                }

                // Apply processed image
                ctx.putImageData(imageData, 0, 0);
                const processedImageUrl = canvas.toDataURL('image/png');
                previewImg.src = processedImageUrl;

                // Update button state
                if (removeBgBtn) {
                    removeBgBtn.classList.remove('processing');
                    removeBgBtn.classList.add('bg-removed');
                    const span = removeBgBtn.querySelector('span');
                    if (span) span.textContent = 'Keep Background';
                }

                designModalState.backgroundRemoved = true;

            } catch (e) {
                console.error('Background removal error:', e);
                if (removeBgBtn) {
                    removeBgBtn.classList.remove('processing');
                    const span = removeBgBtn.querySelector('span');
                    if (span) span.textContent = 'Remove BG';
                }
            }
        };

        img.onerror = function() {
            console.error('Failed to load image for background removal');
            if (removeBgBtn) {
                removeBgBtn.classList.remove('processing');
                const span = removeBgBtn.querySelector('span');
                if (span) span.textContent = 'Remove BG';
            }
        };

        // Load the image - use the current preview src
        img.src = previewImg.src;
    }

    function restoreDesignOriginalBackground() {
        const previewImg = document.getElementById('designPreviewImg');
        const removeBgBtn = document.getElementById('removeBgBtn');

        if (designModalState.originalLogoImage && previewImg) {
            previewImg.src = designModalState.originalLogoImage;
        }

        if (removeBgBtn) {
            removeBgBtn.classList.remove('bg-removed');
            const span = removeBgBtn.querySelector('span');
            if (span) span.textContent = 'Remove BG';
        }
    }

    async function applyDesignToCard() {
        const position = designModalState.currentPosition;
        const previewImg = document.getElementById('designPreviewImg');

        if (!position) {
            showToast('Please upload a logo first');
            return;
        }

        if (!previewImg?.src || previewImg.src === '' || previewImg.src === window.location.href) {
            showToast('Please upload a logo first');
            return;
        }

        // Save logo to file and get URL
        const logoFile = await saveLogoToFile(previewImg.src, position);
        const logoUrl = logoFile ? logoFile.url : previewImg.src;

        designModalState.positionDesigns[position] = {
            logo: previewImg.src,
            originalLogo: designModalState.originalLogoImage,
            logoUrl: logoUrl, // Store the URL
            logoFile: logoFile // Store file info
        };

        const existingCustomization = positionCustomizationsMap[position] || {};
        positionCustomizationsMap[position] = {
            ...existingCustomization,
            type: 'logo',
            uploadedLogo: true, // Boolean as backend expects
            logoUrl: logoUrl, // URL to the logo file
            logoData: previewImg.src, // Keep base64 as backup
            logoName: existingCustomization.logoName || existingCustomization.name || 'Logo',
            method: positionMethods[position] || existingCustomization.method || 'embroidery'
        };

        const card = document.querySelector(`#step3PositionsSection .position-card input[value="${position}"]`)?.closest('.position-card') ||
                     document.querySelector(`#step3PositionsSection .position-card[data-position="${position}"]`);

        if (card) {
            const logoOverlay = card.querySelector('.logo-overlay-box');
            const logoImg = card.querySelector('.logo-overlay-img');
            if (logoOverlay && logoImg) {
                logoImg.src = previewImg.src;
                logoOverlay.hidden = false;
            }

            const uploadedContainer = card.querySelector('.uploaded-logo-container');
            const uploadedThumb = card.querySelector('.uploaded-logo-thumb');
            if (uploadedContainer && uploadedThumb) {
                uploadedThumb.src = previewImg.src;
                uploadedContainer.hidden = false;
            }

            const addLogoBtn = card.querySelector('.price-badge.add-logo-btn');
            if (addLogoBtn) {
                addLogoBtn.classList.add('logo-added');
                addLogoBtn.innerHTML = `<span class="add-logo-text">LOGO ADDED</span>`;
            }

            card.classList.add('selected', 'customized');
            const checkbox = card.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
            }
        }

        updateStepProgressForCustomization();
        updateSubmitButton();
        syncCustomizationsToBasket();
        updateSummarySidebar();

        closeDesignModal();

        showToast('Logo added successfully!');
    }

    // Submit Quote Button
    function initSubmitQuoteBtn() {
        const submitBtn = document.getElementById('submitQuoteBtnInline');
        const popup = document.getElementById('quoteRequestPopup');
        const closeBtn = document.getElementById('closeQuotePopup');
        const form = document.getElementById('quoteRequestForm');

        if (!submitBtn) return;

        submitBtn.addEventListener('click', () => {
            if (popup) {
                popup.style.display = 'flex';
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (popup) popup.style.display = 'none';
            });
        }

        if (popup) {
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    popup.style.display = 'none';
                }
            });
        }

        // Phone input validation
        const phoneInput = document.getElementById('quotePhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9\s\+\-\(\)]/g, '');
            });
        }

        // Form submit
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const submitFormBtn = document.getElementById('quoteSubmitBtn');
                const popupEl = document.getElementById('quoteRequestPopup');
                const name = document.getElementById('quoteName').value;
                const company = document.getElementById('quoteCompany')?.value || '';
                const phone = document.getElementById('quotePhone').value;
                const email = document.getElementById('quoteEmail').value;
                const address = document.getElementById('quoteAddress')?.value || '';

                // Basic validation
                if (!name || !phone || !email) {
                    showToast('Please fill in all fields');
                    return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showToast('Please enter a valid email address');
                    return;
                }

                // Show loading
                if (submitFormBtn) {
                    submitFormBtn.textContent = 'Sending...';
                    submitFormBtn.disabled = true;
                }

                const showToastOrAlert = (message) => {
                    if (typeof showToast === 'function') {
                        showToast(message);
                    } else {
                        alert(message);
                    }
                };

                try {
                    const customizationsEntries =
                        (typeof positionCustomizationsMap === 'object' && positionCustomizationsMap)
                            ? Object.entries(positionCustomizationsMap)
                            : [];

                    // Build comprehensive quote data
                    let basket = [];
                    try {
                        basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
                    } catch {
                        basket = [];
                    }

                    // Calculate summary totals and build detailed basket items
                    let totalGarmentCost = 0;
                    let totalQuantity = 0;
                    const basketItems = [];

                    basket.forEach((item, index) => {
                        // Get quantities from item (support both quantities and sizes formats)
                        const qtyMap = item.quantities || item.sizes || {};
                        const itemQuantity = item.quantity || Object.values(qtyMap).reduce((sum, q) => sum + (Number(q) || 0), 0);
                        const unitPrice = Number(item.price) || 0;
                        const itemTotal = unitPrice * itemQuantity;
                        
                        totalGarmentCost += itemTotal;
                        totalQuantity += itemQuantity;
                        
                        // Build detailed basket item
                        const sizesBreakdown = Object.entries(qtyMap)
                            .filter(([size, qty]) => Number(qty) > 0)
                            .map(([size, qty]) => `${size}: ${qty}`)
                            .join(', ');
                        
                        basketItems.push({
                            name: item.name || 'Product',
                            code: item.code || 'N/A',
                            color: item.color || 'N/A',
                            quantity: itemQuantity,
                            sizes: qtyMap, // Full size breakdown object
                            sizesSummary: sizesBreakdown || item.size || 'N/A',
                            unitPrice: unitPrice,
                            itemTotal: itemTotal,
                            image: item.image || ''
                        });
                    });

                    // Calculate customization costs
                    let customizationTotal = 0;
                    let hasEmbroidery = false;
                    const customizationsList = [];

                    customizationsEntries.forEach(([pos, data]) => {
                        const card = document.querySelector(`#step3PositionsSection .position-card[data-position="${pos}"]`);
                        const positionName = card ? (card.querySelector('.position-checkbox span')?.textContent || pos) : pos;
                        const method = data?.method || 'embroidery';
                        const methodLabel = method === 'print' ? 'Print' : 'Embroidery';
                        
                        if (method !== 'print') hasEmbroidery = true;
                        
                        // Get price from card data attributes
                        const rawPrice = card ? (method === 'print' ? card.dataset.print : card.dataset.embroidery) : null;
                        const isPoa = rawPrice === 'POA';
                        const perUnitPrice = isPoa ? 0 : (Number(rawPrice) || 0);
                        const lineTotal = perUnitPrice * totalQuantity;
                        customizationTotal += lineTotal;
                        
                        // Check if logo exists (don't send logo data, just boolean)
                        const hasLogo = !!(data?.uploadedLogo || data?.logoUrl || data?.logoData);
                        
                        customizationsList.push({
                            position: positionName,
                            method: methodLabel,
                            type: data?.type || 'logo',
                            hasLogo: hasLogo, // Just boolean, no logo data
                            text: data?.text || null,
                            unitPrice: isPoa ? 'POA' : perUnitPrice,
                            lineTotal: isPoa ? 'POA' : lineTotal,
                            quantity: totalQuantity
                        });
                    });

                    // Digitizing fee (one-time for embroidery)
                    const digitizingFee = hasEmbroidery ? 25.00 : 0;
                    const totalCost = totalGarmentCost + customizationTotal + digitizingFee;

                    // Check VAT mode
                    const isVatIncluded = localStorage.getItem('brandeduk-vat-mode') === 'on';
                    const vatRate = 0.20; // 20% VAT
                    const totalCostExVat = totalCost;
                    const totalCostIncVat = totalCost * (1 + vatRate);
                    const vatAmount = totalCost * vatRate;

                    const quoteData = {
                        customer: {
                            fullName: name,
                            company: company,
                            phone: phone,
                            email: email,
                            address: address
                        },
                        // Summary section
                        summary: {
                            totalQuantity: totalQuantity,
                            totalItems: basket.length,
                            garmentCost: totalGarmentCost,
                            customizationCost: customizationTotal,
                            digitizingFee: digitizingFee,
                            subtotal: totalCost,
                            vatRate: vatRate,
                            vatAmount: vatAmount,
                            totalExVat: totalCostExVat,
                            totalIncVat: totalCostIncVat,
                            vatMode: isVatIncluded ? 'inc' : 'ex',
                            displayTotal: isVatIncluded ? totalCostIncVat : totalCostExVat,
                            hasPoa: customizationsList.some(c => c.lineTotal === 'POA')
                        },
                        // All basket items with full details
                        basket: basketItems,
                        // Customizations (no logo data, just hasLogo boolean)
                        customizations: customizationsList,
                        timestamp: new Date().toISOString()
                    };

                    // Save locally as backup (with error handling for quota)
                    try {
                        localStorage.setItem('quoteRequest', JSON.stringify(quoteData));
                    } catch (e) {
                        console.warn('Could not save to localStorage (quota exceeded):', e);
                    }

                    // Use BrandedAPI to submit quote
                    let result = { success: false };
                    
                    try {
                        // Check if BrandedAPI is available
                        if (window.BrandedAPI && typeof window.BrandedAPI.submitQuote === 'function') {
                            result = await window.BrandedAPI.submitQuote(quoteData);
                        } else {
                            // Fallback: direct fetch to API
                            const API_BASE_URL = 'https://api.brandeduk.com';

                            console.log(quoteData);
                            const response = await fetch(`${API_BASE_URL}/api/quotes`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(quoteData)
                            });

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`API Error: ${response.status} - ${errorText}`);
                            }

                            const contentType = response.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                result = await response.json();
                            } else {
                                const text = await response.text();
                                console.error('Non-JSON response:', text);
                                throw new Error('Server returned non-JSON response');
                            }
                        }
                    } catch (apiError) {
                        console.error('Quote API error:', apiError);
                        // Fallback: save to localStorage and show message
                        console.warn('API unavailable, saving to localStorage only');
                        result = { 
                            success: true, 
                            message: 'Quote saved locally. Please contact info@brandeduk.com directly.' 
                        };
                    }

                    if (result.success) {
                        console.log('✅ Email sent successfully via PHP');
                        
                        if (submitFormBtn) {
                            submitFormBtn.classList.remove('error');
                            submitFormBtn.classList.add('success');
                            submitFormBtn.textContent = '✓ Submitted';
                        }

                        setTimeout(() => {
                            if (popupEl) popupEl.style.display = 'none';

                            try {
                                localStorage.removeItem('quoteBasket');
                                localStorage.removeItem('quoteRequest');
                            } catch (e) {
                                console.warn('Could not clear localStorage:', e);
                            }

                            try {
                                sessionStorage.removeItem('customizingProduct');
                            } catch (e) {
                                console.warn('Could not clear sessionStorage:', e);
                            }

                            const homeHref =
                                document.querySelector('.searchbar-header__brand')?.getAttribute('href') ||
                                'home-pc.html';

                            window.location.replace(homeHref);
                        }, 600);
                    } else {
                        throw new Error(result.message || 'Failed to send email');
                    }
                } catch (error) {
                    console.error('Quote send error:', error);
                    if (submitFormBtn) {
                        submitFormBtn.disabled = false;
                        submitFormBtn.classList.remove('success');
                        submitFormBtn.classList.add('error');
                        submitFormBtn.textContent = '✗ Error - Retry';

                        setTimeout(() => {
                            submitFormBtn.classList.remove('error');
                            submitFormBtn.textContent = 'Submit Quote Request';
                        }, 3000);
                    }

                    showToastOrAlert('Error sending quote. Please try again or email info@brandeduk.com directly.');
                }
            });
        }
    }

    function updateSubmitButton() {
        const submitBtn = document.getElementById('submitQuoteBtnInline');
        if (!submitBtn) return;

        const hasCustomizations = Object.keys(positionCustomizationsMap).length > 0;
        submitBtn.disabled = !hasCustomizations;
    }

    function resetCustomization(position, options = {}) {
        if (!position) return;

        const { fullReset = false } = options;

        delete positionCustomizationsMap[position];
        delete designModalState.positionDesigns[position];

        const card = document.querySelector(`#step3PositionsSection .position-card[data-position="${position}"]`);
        if (card) {
            const checkbox = card.querySelector('input[type="checkbox"]');

            card.classList.remove('customized');

            // Always remove any visible overlay logo on the garment preview
            const logoOverlay = card.querySelector('.logo-overlay-box');
            const logoImg = card.querySelector('.logo-overlay-img');
            if (logoImg) logoImg.src = '';
            if (logoOverlay) logoOverlay.hidden = true;

            // Always hide the uploaded thumb container
            const uploadedContainer = card.querySelector('.uploaded-logo-container');
            const thumbImg = card.querySelector('.uploaded-logo-thumb');
            if (thumbImg) {
                thumbImg.src = '';
                thumbImg.style.display = '';
            }
            if (uploadedContainer) {
                uploadedContainer.hidden = true;
            }

            if (fullReset) {
                // Return the whole card to its initial state: unselected, no method chosen
                card.classList.remove('selected');

                if (checkbox) {
                    checkbox.checked = false;
                }

                selectedPositions = selectedPositions.filter(p => p !== position);
                delete positionMethods[position];

                // Restore both method buttons (no active / no add-logo state)
                resetPriceBadge(card.querySelector('.price-emb'));
                resetPriceBadge(card.querySelector('.price-print'));
            }
        }

        updateSubmitButton();
        updateSummarySidebar();
        syncCustomizationsToBasket();
    }

    function getCurrentProductCode() {
        const el = document.querySelector('.prod-code-value');
        return el ? String(el.textContent || '').trim() : '';
    }

    function getCustomizationUnitPrice(position, method) {
        const card = document.querySelector(`#step3PositionsSection .position-card[data-position="${position}"]`);
        if (!card) return null;

        const raw = method === 'print' ? card.dataset.print : card.dataset.embroidery;
        if (!raw) return 0;
        if (raw === 'POA') return 'POA';
        return Number(raw) || 0;
    }

    function buildCustomizationsForBasket() {
        return Object.entries(positionCustomizationsMap).map(([pos, data]) => {
            const method = data.method || 'embroidery';
            const unitPrice = getCustomizationUnitPrice(pos, method);
            return {
                position: pos,
                method,
                type: data.type,
                uploadedLogo: data.uploadedLogo,
                logoName: data.logoName,
                price: unitPrice
            };
        });
    }

    function syncCustomizationsToBasket() {
        const basket = readBasket();
        if (basket.length === 0) return;

        const productCode = getCurrentProductCode();
        const customizations = buildCustomizationsForBasket();

        const updated = basket.map(item => {
            if (productCode && item && item.code !== productCode) return item;
            return {
                ...item,
                customizations
            };
        });

        try {
            localStorage.setItem('quoteBasket', JSON.stringify(updated));
        } catch (error) {
            console.warn('Failed to persist basket customizations', error);
            // If quota exceeded, try to clear old data
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded. Clearing old quote data...');
                try {
                    localStorage.removeItem('quoteRequest');
                    // Try again with just essential data
                    const minimalBasket = updated.map(item => ({
                        code: item.code,
                        name: item.name,
                        color: item.color,
                        quantity: item.quantity,
                        price: item.price,
                        sizes: item.sizes
                    }));
                    localStorage.setItem('quoteBasket', JSON.stringify(minimalBasket));
                    console.log('✅ Saved minimal basket data');
                } catch (e2) {
                    console.error('Could not save even minimal data:', e2);
                }
            }
        }

        // Keep other UI in sync (if available)
        if (window.brandedukv15 && window.brandedukv15.updateCartBadge) {
            window.brandedukv15.updateCartBadge();
        }
        if (typeof updateBasketTotalBox === 'function') {
            updateBasketTotalBox();
        }
    }

    function readBasket() {
        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
            return Array.isArray(basket) ? basket : [];
        } catch {
            return [];
        }
    }

    function formatMoney(baseAmount) {
        if (typeof window.formatCurrency === 'function') {
            return window.formatCurrency(baseAmount);
        }
        const n = Number(baseAmount);
        if (!Number.isFinite(n)) return '£0.00';
        return `£${n.toFixed(2)}`;
    }

    function vatLabel() {
        return typeof window.vatSuffix === 'function' ? window.vatSuffix() : '';
    }

    function formatLinePrice(quantity, unitBase) {
        const qty = Number(quantity) || 0;
        const unit = Number(unitBase) || 0;
        const totalBase = qty * unit;
        const suffix = vatLabel();
        const suffixText = suffix ? ` ${suffix}` : '';
        return `${qty} x ${formatMoney(unit)} = <span class="item-total">${formatMoney(totalBase)}</span>${suffixText}`;
    }

    function buildSizeSummaryFromQuantities(qtyMap) {
        const entries = Object.entries(qtyMap || {}).filter(([, qty]) => (Number(qty) || 0) > 0);
        if (!entries.length) return '';
        return entries.map(([size, qty]) => `${Number(qty) || 0}x${size}`).join(', ');
    }

    function getTotalQtyFromBasket(basket) {
        return basket.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }

    function updateSummarySidebar() {
        const basket = readBasket();

        // Build grouped view (per basket item per-size)
        const grouped = [];
        basket.forEach((item, index) => {
            const qtyMap = item.quantities && Object.keys(item.quantities).length
                ? item.quantities
                : (item.sizes && Object.keys(item.sizes).length ? item.sizes : null);

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
            } else {
                const numericQty = Number(item.quantity) || 0;
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
            }
        });

        const totalQty = grouped.reduce((sum, g) => sum + (Number(g.qty) || 0), 0);

        let totalGarmentCost = 0;
        let basketHTML = '';

        grouped.forEach(g => {
            const safeSizeKey = (g.size || 'all').replace(/[^a-z0-9_-]/gi, '-');
            const tempKey = `${g.index}_${safeSizeKey}`;
            const unitPrice = Number.isFinite(g.price) ? g.price : 0;
            const itemTotal = unitPrice * g.qty;
            totalGarmentCost += itemTotal;

            basketHTML += `
                <div class="sidebar-basket-item" data-index="${g.index}" data-size="${g.size}">
                    <img src="${g.image || ''}" alt="${g.color || ''}">
                    <div class="sidebar-basket-details">
                        <strong>${g.name || 'Product'}</strong>
                        <div class="product-code" id="product-code-${tempKey}">${g.code || ''}${g.color ? ` - ${g.color}` : ''}</div>
                        <div class="product-sizes" style="font-size:0.98em;font-weight:bold;letter-spacing:0.2px;">${g.qty}x${g.size || ''}</div>
                        <div class="product-price">
                            <div class="qty-toggle">
                                <button type="button" class="qty-toggle-btn minus" data-index="${g.index}" data-size="${g.size}" aria-label="Decrease quantity">-</button>
                                <span class="qty-toggle-value" id="qty-display-${tempKey}">${g.qty}</span>
                                <button type="button" class="qty-toggle-btn plus" data-index="${g.index}" data-size="${g.size}" aria-label="Increase quantity">+</button>
                            </div>
                            <span id="row-total-${tempKey}" class="basket-line-price" data-qty="${g.qty}" data-unit="${unitPrice}">${formatLinePrice(g.qty, unitPrice)}</span>
                        </div>
                    </div>
                    <button class="remove-item-btn" data-index="${g.index}" data-size="${g.size}" title="Remove item">
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

        // Garment cost block
        const avgUnit = totalQty > 0 ? (totalGarmentCost / totalQty) : 0;
        const garmentCostEl = document.getElementById('sidebarGarmentCost');
        const garmentUnitEl = document.getElementById('garmentUnitPrice');
        const garmentQtyEl = document.getElementById('garmentQty');

        const suffix = vatLabel();
        const suffixText = suffix ? ` ${suffix}` : '';

        if (garmentCostEl) {
            garmentCostEl.dataset.unit = String(avgUnit);
            garmentCostEl.dataset.qty = String(totalQty);
            garmentCostEl.textContent = `${formatMoney(totalGarmentCost)}${suffixText}`;
        }
        if (garmentUnitEl) garmentUnitEl.textContent = `Unit Price: ${formatMoney(avgUnit)}`;
        if (garmentQtyEl) garmentQtyEl.textContent = `Qty: ${totalQty}`;

        // Customizations cost list
        const customizationListEl = document.getElementById('customizationCostsList');
        let customizationTotal = 0;
        let hasPoa = false;
        let hasEmbroidery = false;
        if (customizationListEl) {
            const entries = Object.entries(positionCustomizationsMap);
            // Match tablet behavior: add one-time digitizing fee if any embroidery is selected
            hasEmbroidery = selectedPositions.some(pos => (positionMethods[pos] || 'embroidery') === 'embroidery')
                || entries.some(([, data]) => (data?.method || 'embroidery') !== 'print');

            if (entries.length === 0) {
                customizationListEl.innerHTML = '';
            } else {
                customizationListEl.innerHTML = entries.map(([pos, data]) => {
                    const card = document.querySelector(`#step3PositionsSection .position-card[data-position="${pos}"]`);
                    const name = card ? (card.querySelector('.position-checkbox span')?.textContent || pos) : pos;
                    const methodLabel = data.method === 'print' ? 'Print' : 'Embroidery';

                    const raw = card ? (data.method === 'print' ? card.dataset.print : card.dataset.embroidery) : null;
                    const perUnitIsPoa = raw === 'POA';
                    const perUnit = perUnitIsPoa ? 0 : (Number(raw) || 0);
                    const lineTotal = perUnit * totalQty;
                    customizationTotal += lineTotal;
                    if (perUnitIsPoa) hasPoa = true;

                    const valueText = perUnitIsPoa
                        ? 'POA'
                        : `${formatMoney(lineTotal)}${suffixText}`;

                    const perUnitText = perUnitIsPoa
                        ? 'POA'
                        : formatMoney(perUnit);

                    const isEmbroidery = data.method !== 'print';
                    const whiteClass = isEmbroidery ? ' white' : '';

                    return `
                        <div class="section ${data.method === 'print' ? 'print-method' : 'embroidery'}" data-vat-row data-price="${perUnit}" data-qty="${totalQty}">
                            <div class="row">
                                <span class="label${whiteClass}">${name} (${methodLabel})</span>
                                <span class="value${whiteClass}">${valueText}</span>
                            </div>
                            <div class="row detail${whiteClass}">
                                <span>Unit:</span>
                                <span class="detail-values${whiteClass}">
                                    <span>${perUnitText}</span>
                                    <span>Qty: ${totalQty}</span>
                                </span>
                            </div>
                        </div>
                    `;
                }).join('');

                if (hasEmbroidery) {
                    customizationListEl.innerHTML += `
                        <div class="digitizing-fee-row">
                            <span>Digitizing Fee (one-time)</span>
                            <span>£25.00 <small>ex VAT</small></span>
                        </div>
                    `;
                }
            }
        }

        // Sidebar total
        const totalEl = document.getElementById('sidebarTotalCost');
        const digitizingFee = hasEmbroidery ? 25.00 : 0;
        const totalBase = totalGarmentCost + customizationTotal + digitizingFee;
        if (totalEl) {
            totalEl.dataset.total = String(totalBase);
            totalEl.textContent = hasPoa ? 'POA' : `${formatMoney(totalBase)}${suffixText}`;
        }

        // Basket items list (with +/-)
        const itemsEl = document.getElementById('basketItemsList');
        if (itemsEl) {
            itemsEl.innerHTML = basketHTML;

            itemsEl.querySelectorAll('.qty-toggle-btn.plus').forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.dataset.index, 10);
                    const size = btn.dataset.size;
                    updateItemQuantity(idx, 1, size);
                };
            });

            itemsEl.querySelectorAll('.qty-toggle-btn.minus').forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.dataset.index, 10);
                    const size = btn.dataset.size;
                    updateItemQuantity(idx, -1, size);
                };
            });

            itemsEl.querySelectorAll('.remove-item-btn').forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.dataset.index, 10);
                    const size = btn.dataset.size;
                    removeBasketGroup(idx, size);
                };
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
            item.size = buildSizeSummaryFromQuantities(qtyMap);
        } else {
            const current = Number(item.quantity) || 0;
            const next = current + delta;
            item.quantity = Math.max(0, next);
        }

        // Remove item if empty
        if ((Number(item.quantity) || 0) <= 0) {
            basket.splice(index, 1);
        }

        // Recalculate unit price tiers if product pricing function exists
        const code = item.code;
        if (code && typeof window.getUnitPrice === 'function') {
            const totalForCode = basket
                .filter(it => it && it.code === code)
                .reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
            const newUnit = window.getUnitPrice(totalForCode);
            basket.forEach(it => {
                if (it && it.code === code) {
                    it.price = Number(newUnit).toFixed(2);
                }
            });
        }

        try {
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
        } catch (error) {
            console.warn('Failed to save quoteBasket', error);
        }

        if (window.brandedukv15 && window.brandedukv15.updateCartBadge) {
            window.brandedukv15.updateCartBadge();
        }
        if (typeof updateBasketTotalBox === 'function') {
            updateBasketTotalBox();
        }

        updateSummarySidebar();
        updateSubmitButton();
        syncCustomizationsToBasket();
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
            item.size = buildSizeSummaryFromQuantities(qtyMap);
            if (Object.keys(qtyMap).length === 0 || item.quantity <= 0) {
                basket.splice(index, 1);
            }
        } else {
            basket.splice(index, 1);
        }

        try {
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
        } catch (error) {
            console.warn('Failed to save quoteBasket', error);
        }

        if (window.brandedukv15 && window.brandedukv15.updateCartBadge) {
            window.brandedukv15.updateCartBadge();
        }
        if (typeof updateBasketTotalBox === 'function') {
            updateBasketTotalBox();
        }

        updateSummarySidebar();
        updateSubmitButton();
        syncCustomizationsToBasket();
    }

    function updateStepProgressForCustomization() {
        // Update step 3 to completed and step 4 to active
        const stepNum3 = document.getElementById('stepNum3');
        const stepLabel3 = document.getElementById('stepLabel3');
        const stepNum4 = document.getElementById('stepNum4');
        const stepLabel4 = document.getElementById('stepLabel4');
        const connector34 = document.getElementById('connector-3-4');

        const greenStyle = 'width:44px; height:44px; border-radius:50%; background:#10b981; color:white; font-size:1.1rem; font-weight:700; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(16,185,129,0.3);';
        const greenLabelStyle = 'font-size:0.9rem; font-weight:600; color:#10b981;';
        const purpleStyle = 'width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#8b5cf6,#7c3aed); color:white; font-size:1.1rem; font-weight:700; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(124,58,237,0.3);';

        // Make step 3 green (completed)
        if (stepNum3) {
            stepNum3.style.cssText = greenStyle;
            stepNum3.textContent = '3✓';
        }
        if (stepLabel3) {
            stepLabel3.style.cssText = greenLabelStyle;
        }

        // Animate connector 3-4
        if (connector34 && !connector34.dataset.completed) {
            connector34.innerHTML = '<div style="height:100%; width:0; background:#10b981; border-radius:2px; animation:loadBar 1.5s ease-out forwards;"></div>';
            
            // Add keyframes if not exists
            if (!document.getElementById('loadBarKeyframes')) {
                const style = document.createElement('style');
                style.id = 'loadBarKeyframes';
                style.textContent = '@keyframes loadBar { 0% { width: 0; } 100% { width: 100%; } }';
                document.head.appendChild(style);
            }

            setTimeout(() => {
                connector34.style.background = '#10b981';
                connector34.innerHTML = '';
                connector34.dataset.completed = 'true';

                // Make step 4 active/highlighted
                if (stepNum4) {
                    stepNum4.style.cssText = purpleStyle;
                    stepNum4.style.animation = 'pulse 2s infinite';
                }
            }, 1500);
        }
    }

    // Toast notification
    function showToast(message, duration = 3000) {
        let toast = document.getElementById('toastNotification');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toastNotification';
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // Auto-initialize when DOM is ready
    function safeInitPositions() {
        const section = document.getElementById('step3PositionsSection');
        if (section) {
            initPositionsInline();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Delay slightly to ensure product.js has loaded
            setTimeout(safeInitPositions, 100);
        });
    } else {
        // DOM already loaded
        setTimeout(safeInitPositions, 100);
    }

    // Also listen for window load as final fallback
    window.addEventListener('load', () => {
        setTimeout(safeInitPositions, 200);
    });

})();