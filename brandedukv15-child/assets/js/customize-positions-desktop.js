/**
 * BrandedUK Desktop - Customize Positions JavaScript
 * Ported from mobile version with desktop adaptations
 */

(function() {
    'use strict';

    // === State ===
    const state = {
        positionMethods: {},      // { 'left-breast': 'embroidery', 'large-back': 'print' }
        positionDesigns: {},      // { position: { logo: 'base64...', originalLogo: 'base64...' } }
        currentPosition: null,    // Currently active position for upload modal
        originalLogoImage: null   // For undo background removal
    };

    // === Init ===
    function init() {
        console.log('🚀 Desktop Customize Positions Init');
        
        initializePOABadges();
        setupPriceBadgeClicks();
        setupUploadModal();
        setupCardDeselect();
        setupDeleteLogoBtns();
        
        console.log('✅ Desktop Customize Positions Ready');
    }

    // === Initialize POA Badges ===
    function initializePOABadges() {
        document.querySelectorAll('.position-card').forEach(card => {
            const embroideryPrice = card.dataset.embroidery;
            
            if (embroideryPrice === 'POA') {
                const embBadge = card.querySelector('.price-emb');
                if (embBadge) {
                    embBadge.classList.add('poa-badge');
                    embBadge.style.cursor = 'not-allowed';
                }
            }
        });
    }

    // === Setup Price Badge Clicks ===
    function setupPriceBadgeClicks() {
        document.querySelectorAll('.position-card').forEach(card => {
            const embBadge = card.querySelector('.price-emb');
            const printBadge = card.querySelector('.price-print');
            const checkbox = card.querySelector('input[type="checkbox"]');
            const position = checkbox?.value || card.dataset.position;

            // Click on Embroidery badge
            if (embBadge) {
                embBadge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Check if POA
                    const isPOA = embBadge.classList.contains('poa-badge') || 
                                  embBadge.querySelector('.price-value')?.textContent === 'POA';
                    if (isPOA) {
                        showToast('Price On Application - Contact us for a custom quote');
                        return;
                    }
                    
                    // Check if already active (deselect)
                    if (embBadge.classList.contains('active')) {
                        deselectPosition(card, position);
                        return;
                    }
                    
                    // Check if this is an "Add Logo" button
                    if (embBadge.classList.contains('add-logo-btn')) {
                        window.openDesignModal(position, card);
                        return;
                    }
                    
                    // Select embroidery method
                    selectMethod(card, position, 'embroidery');
                });
            }

            // Click on Print badge
            if (printBadge) {
                printBadge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Check if already active (deselect)
                    if (printBadge.classList.contains('active')) {
                        deselectPosition(card, position);
                        return;
                    }
                    
                    // Check if this is an "Add Logo" button
                    if (printBadge.classList.contains('add-logo-btn')) {
                        window.openDesignModal(position, card);
                        return;
                    }
                    
                    // Select print method
                    selectMethod(card, position, 'print');
                });
            }
        });
    }

    // === Select Method (Embroidery or Print) ===
    function selectMethod(card, position, method) {
        console.log('📍 Selecting method:', method, 'for position:', position);
        
        // Update checkbox
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = true;
        
        // Add selected class to card
        card.classList.add('selected');
        
        // Save to state
        state.positionMethods[position] = method;
        
        // Apply UI changes
        applyMethodUI(card, method);
    }

    // === Apply Method UI (Transform badges) ===
    function applyMethodUI(card, method) {
        const embBadge = card.querySelector('.price-emb');
        const printBadge = card.querySelector('.price-print');
        
        // Reset both badges first
        resetPriceBadge(embBadge);
        resetPriceBadge(printBadge);
        
        if (!method) return;
        
        const methodBadge = method === 'embroidery' ? embBadge : printBadge;
        const addBadge = method === 'embroidery' ? printBadge : embBadge;
        
        // Make method badge active
        if (methodBadge && !methodBadge.classList.contains('poa-badge')) {
            methodBadge.classList.add('active');
            methodBadge.dataset.role = 'method';
        }
        
        // Transform other badge to "Add Logo" button
        if (addBadge && !addBadge.classList.contains('poa-badge')) {
            addBadge.classList.remove('active');
            addBadge.classList.add('add-logo-btn');
            addBadge.dataset.role = 'add-logo';
            addBadge.dataset.activeMethod = method;
            
            // Cloud upload animation SVG - unique ID per badge (SAME AS MOBILE)
            const uniqueId = 'cloud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            addBadge.innerHTML = `
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
            
            // Check if logo already exists for this position
            const position = card.querySelector('input[type="checkbox"]')?.value || card.dataset.position;
            if (state.positionDesigns[position]?.logo) {
                transformToLogoAdded(addBadge);
            }
        }
    }

    // === Reset Price Badge to Default ===
    function resetPriceBadge(badge) {
        if (!badge) return;
        
        // Skip POA badges
        if (badge.classList.contains('poa-badge')) return;
        
        badge.classList.remove('active', 'add-logo-btn', 'logo-added');
        badge.dataset.role = 'method';
        delete badge.dataset.activeMethod;
        
        const method = badge.dataset.method;
        const defaultLabel = badge.dataset.defaultLabel || (method === 'embroidery' ? 'EMBROIDERY' : 'PRINT');
        const defaultPrice = badge.dataset.defaultPrice || '£0.00';
        
        badge.innerHTML = `
            <span class="price-label">${defaultLabel}</span>
            <span class="price-value">${defaultPrice}</span>
        `;
    }

    // === Transform to "LOGO ADDED" green state ===
    function transformToLogoAdded(badge) {
        if (!badge) return;
        badge.classList.add('logo-added');
        badge.innerHTML = `<span class="add-logo-text">LOGO ADDED</span>`;
    }

    // === Deselect Position ===
    function deselectPosition(card, position) {
        console.log('❌ Deselecting position:', position);
        
        // Update checkbox
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = false;
        
        // Remove selected class
        card.classList.remove('selected');
        
        // Clear from state
        delete state.positionMethods[position];
        delete state.positionDesigns[position];
        
        // Reset badges
        const embBadge = card.querySelector('.price-emb');
        const printBadge = card.querySelector('.price-print');
        resetPriceBadge(embBadge);
        resetPriceBadge(printBadge);
        
        // Hide logo overlay
        const logoOverlay = card.querySelector('.logo-overlay-box');
        if (logoOverlay) logoOverlay.hidden = true;
        
        // Hide customization pill
        const pill = card.querySelector('.customization-pill');
        if (pill) pill.hidden = true;
        
        // Hide uploaded logo container
        const uploadedContainer = card.querySelector('.uploaded-logo-container');
        if (uploadedContainer) uploadedContainer.hidden = true;
    }

    // === Setup Card Deselect on card click ===
    function setupCardDeselect() {
        document.querySelectorAll('.position-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Only deselect if clicking on card background (not buttons)
                if (e.target === card || e.target.classList.contains('position-preview') || 
                    e.target.classList.contains('position-placeholder')) {
                    
                    const checkbox = card.querySelector('input[type="checkbox"]');
                    const position = checkbox?.value || card.dataset.position;
                    
                    if (card.classList.contains('selected')) {
                        deselectPosition(card, position);
                    }
                }
            });
        });
    }

    // === Setup Delete Logo Buttons ===
    function setupDeleteLogoBtns() {
        document.querySelectorAll('.delete-logo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const card = btn.closest('.position-card');
                if (!card) return;
                
                const checkbox = card.querySelector('input[type="checkbox"]');
                const position = checkbox?.value || card.dataset.position;
                
                // Hide uploaded logo container
                const uploadedContainer = card.querySelector('.uploaded-logo-container');
                if (uploadedContainer) uploadedContainer.hidden = true;
                
                // Hide logo overlay
                const logoOverlay = card.querySelector('.logo-overlay-box');
                if (logoOverlay) logoOverlay.hidden = true;
                
                // Hide customization pill
                const pill = card.querySelector('.customization-pill');
                if (pill) pill.hidden = true;
                
                // Transform "LOGO ADDED" back to cloud icon
                const addLogoBtn = card.querySelector('.price-badge.logo-added');
                if (addLogoBtn) {
                    addLogoBtn.classList.remove('logo-added');
                    const method = state.positionMethods[position];
                    const uniqueId = 'cloud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                    addLogoBtn.innerHTML = `
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
                
                // Clear from state
                delete state.positionDesigns[position];
                
                // Also update global state
                if (typeof positionCustomizationsMap !== 'undefined') {
                    delete positionCustomizationsMap[position];
                }
                
                showToast('Logo removed');
            });
        });
    }
    // === Upload Modal Functions ===
    function setupUploadModal() {
        const modal = document.getElementById('designModal');
        const closeBtn = document.getElementById('closeDesignModal');
        const uploadZone = document.getElementById('designUploadZone');
        const fileInput = document.getElementById('designLogoUpload');
        const applyBtn = document.getElementById('applyDesignBtn');
        const removeLogoBtn = document.getElementById('removeUploadedLogo');
        const removeBgBtn = document.getElementById('removeBgBtn');
        
        if (!modal) return;
        
        // Close modal
        closeBtn?.addEventListener('click', closeUploadModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeUploadModal();
        });
        
        // Upload zone click
        uploadZone?.addEventListener('click', () => fileInput?.click());
        
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
            if (file) handleFileUpload(file);
        });
        
        // File input change
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileUpload(file);
        });
        
        // Remove uploaded logo
        removeLogoBtn?.addEventListener('click', () => {
            const previewContainer = document.getElementById('designUploadPreview');
            const previewImg = document.getElementById('designPreviewImg');
            const dropzone = document.getElementById('designUploadZone');
            
            if (previewContainer) previewContainer.hidden = true;
            if (dropzone) dropzone.style.display = '';
            if (previewImg) previewImg.src = '';
            
            state.originalLogoImage = null;
        });
        
        // Remove background button
        removeBgBtn?.addEventListener('click', () => {
            if (removeBgBtn.classList.contains('bg-removed')) {
                // Undo - restore original
                restoreOriginalBackground();
            } else {
                // Remove background
                removeImageBackground();
            }
        });
        
        // Apply design button
        applyBtn?.addEventListener('click', applyDesignToPosition);
    }

    // === Open Upload Modal === (exposed as global for original JS)
    window.openDesignModal = function(position, card) {
        console.log('📂 Opening upload modal for position:', position);
        
        state.currentPosition = position;
        
        const modal = document.getElementById('designModal');
        const title = document.getElementById('designModalTitle');
        const dropzone = document.getElementById('designUploadZone');
        const previewContainer = document.getElementById('designUploadPreview');
        
        if (title) {
            const positionName = card?.querySelector('.position-checkbox span')?.textContent || position;
            title.textContent = `Upload Logo - ${positionName}`;
        }
        
        // Reset upload state
        if (dropzone) dropzone.style.display = '';
        if (previewContainer) previewContainer.hidden = true;
        state.originalLogoImage = null;
        
        // Show modal
        if (modal) modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // === Close Upload Modal ===
    function closeUploadModal() {
        const modal = document.getElementById('designModal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
        state.currentPosition = null;
    }

    // === Handle File Upload ===
    function handleFileUpload(file) {
        if (!file) return;
        
        console.log('📁 Uploading file:', file.name, file.type);
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            const previewContainer = document.getElementById('designUploadPreview');
            const previewImg = document.getElementById('designPreviewImg');
            const dropzone = document.getElementById('designUploadZone');
            const removeBgBtn = document.getElementById('removeBgBtn');
            
            if (previewImg) previewImg.src = ev.target.result;
            if (dropzone) dropzone.style.display = 'none';
            if (previewContainer) previewContainer.hidden = false;
            
            // Reset remove BG button
            if (removeBgBtn) {
                removeBgBtn.classList.remove('bg-removed', 'processing');
                removeBgBtn.querySelector('span').textContent = 'Remove BG';
            }
            
            // Save original for undo
            state.originalLogoImage = ev.target.result;
            
            // Auto remove background for JPEG with embroidery
            const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || 
                           file.name.toLowerCase().endsWith('.jpg') || 
                           file.name.toLowerCase().endsWith('.jpeg');
            
            // Get current method for this position
            const method = state.positionMethods[state.currentPosition];
            
            if (isJpeg && method === 'embroidery') {
                console.log('🎨 Auto-removing background for JPEG embroidery');
                setTimeout(() => removeImageBackground(), 200);
            }
        };
        reader.readAsDataURL(file);
    }

    // === Remove Image Background (Flood-fill algorithm) ===
    function removeImageBackground() {
        const previewImg = document.getElementById('designPreviewImg');
        const canvas = document.getElementById('bgRemovalCanvas');
        const removeBgBtn = document.getElementById('removeBgBtn');
        
        if (!previewImg || !previewImg.src || !canvas) return;
        
        // Save original for undo
        if (!state.originalLogoImage) {
            state.originalLogoImage = previewImg.src;
        }
        
        // Show processing state
        if (removeBgBtn) {
            removeBgBtn.classList.add('processing');
            removeBgBtn.querySelector('span').textContent = 'Processing...';
        }
        
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Sample corner pixels to detect background color
            const corners = [
                0, // top-left
                (canvas.width - 1) * 4, // top-right
                (canvas.height - 1) * canvas.width * 4, // bottom-left
                ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4 // bottom-right
            ];
            
            let bgR = 0, bgG = 0, bgB = 0;
            corners.forEach(idx => {
                bgR += data[idx];
                bgG += data[idx + 1];
                bgB += data[idx + 2];
            });
            bgR = Math.round(bgR / 4);
            bgG = Math.round(bgG / 4);
            bgB = Math.round(bgB / 4);
            
            console.log('🎨 Detected background color:', bgR, bgG, bgB);
            
            // Tolerance for color matching
            const tolerance = 50;
            
            // Simple background removal - make matching pixels transparent
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
                
                if (diff < tolerance) {
                    data[i + 3] = 0; // Make transparent
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Update preview
            previewImg.src = canvas.toDataURL('image/png');
            
            // Update button state
            if (removeBgBtn) {
                removeBgBtn.classList.remove('processing');
                removeBgBtn.classList.add('bg-removed');
                removeBgBtn.querySelector('span').textContent = 'Undo';
            }
            
            console.log('✅ Background removed');
        };
        img.src = state.originalLogoImage;
    }

    // === Restore Original Background ===
    function restoreOriginalBackground() {
        const previewImg = document.getElementById('designPreviewImg');
        const removeBgBtn = document.getElementById('removeBgBtn');
        
        if (state.originalLogoImage && previewImg) {
            previewImg.src = state.originalLogoImage;
        }
        
        if (removeBgBtn) {
            removeBgBtn.classList.remove('bg-removed');
            removeBgBtn.querySelector('span').textContent = 'Remove BG';
        }
        
        console.log('↩️ Background restored');
    }

    // === Apply Design to Position ===
    function applyDesignToPosition() {
        const position = state.currentPosition;
        const previewImg = document.getElementById('designPreviewImg');
        
        if (!position || !previewImg?.src) {
            showToast('Please upload a logo first');
            return;
        }
        
        console.log('✅ Applying design to position:', position);
        
        // Save to local state
        state.positionDesigns[position] = {
            logo: previewImg.src,
            originalLogo: state.originalLogoImage
        };
        
        // Also update global state (from customize-positions.js) if available
        if (typeof positionCustomizationsMap !== 'undefined') {
            positionCustomizationsMap[position] = {
                type: 'logo',
                uploadedLogo: previewImg.src,
                name: 'Logo',
                method: state.positionMethods[position] || 'embroidery'
            };
        }
        if (typeof currentModalPosition !== 'undefined') {
            window.currentModalPosition = null;
        }
        
        // Find the card
        const card = document.querySelector(`.position-card input[value="${position}"]`)?.closest('.position-card') ||
                     document.querySelector(`.position-card[data-position="${position}"]`);
        
        if (card) {
            // Show logo on preview
            const logoOverlay = card.querySelector('.logo-overlay-box');
            const logoImg = card.querySelector('.logo-overlay-img');
            if (logoOverlay && logoImg) {
                logoImg.src = previewImg.src;
                logoOverlay.hidden = false;
            }
            
            // Show customization pill
            const pill = card.querySelector('.customization-pill');
            if (pill) pill.hidden = false;
            
            // Show uploaded logo container
            const uploadedContainer = card.querySelector('.uploaded-logo-container');
            const uploadedThumb = card.querySelector('.uploaded-logo-thumb');
            if (uploadedContainer && uploadedThumb) {
                uploadedThumb.src = previewImg.src;
                uploadedContainer.hidden = false;
            }
            
            // Transform "Add Logo" button to "LOGO ADDED"
            const addLogoBtn = card.querySelector('.price-badge.add-logo-btn');
            if (addLogoBtn) {
                transformToLogoAdded(addLogoBtn);
            }
            
            // Add selected class to card
            card.classList.add('selected');
            
            // Check the checkbox
            const checkbox = card.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
            }
        }
        
        // Close modal
        closeUploadModal();
        
        showToast('Logo added successfully!');
        
        // Update step progress if function exists
        if (typeof updateStepProgress === 'function') {
            updateStepProgress();
        }
    }

    // === Toast Notification ===
    function showToast(message, duration = 3000) {
        // Remove existing toast
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // === Run on DOM Ready ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
