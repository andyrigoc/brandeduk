// Store selected positions with their methods
let selectedPositions = [];
let positionMethods = {}; // Store selected method for each position (embroidery or print)
let positionCustomizationsMap = {}; // Store customization details keyed by position id
let currentModalPosition = null;
let currentModalData = {
    method: 'embroidery',
    type: 'logo',
    logo: null,
    text: '',
    name: ''
};

const CUSTOM_UPLOAD_TEXT_LIMIT = 60;

const customUploadState = {
    file: null,
    progressTimer: null,
    progressValue: 0,
    processing: false,
    text: ''
};

let customUploadElements = null;

// Pricing configuration shared with product detail page
const PRICING_RULES = {
    GD067: {
        basePrice: 17.58,
        tiers: [
            { min: 250, price: 12.59 },
            { min: 100, price: 13.49 },
            { min: 50, price: 14.94 },
            { min: 25, price: 16.18 },
            { min: 10, price: 16.54 }
        ]
    }
};

function buildSizeSummaryFromQuantities(qtyMap) {
    const entries = Object.entries(qtyMap || {}).filter(([, qty]) => qty > 0);
    if (!entries.length) return '';
    return entries.map(([size, qty]) => `${qty}x${size}`).join(', ');
}

function getDiscountedUnitPrice(code, totalQty, fallbackBase) {
    const rule = PRICING_RULES[code];
    const base = rule ? rule.basePrice : (Number(fallbackBase) || 0);
    if (!rule) return base;
    for (const tier of rule.tiers) {
        if (totalQty >= tier.min) {
            return tier.price;
        }
    }
    return base;
}

function normalizeItemQuantities(item) {
    let changed = false;
    let quantities = null;

    if (item && typeof item === 'object') {
        if (item.quantities && typeof item.quantities === 'object') {
            quantities = {};
            Object.entries(item.quantities).forEach(([size, qty]) => {
                const numericQty = Number(qty) || 0;
                if (numericQty > 0) {
                    quantities[size] = numericQty;
                }
                if (numericQty !== qty) {
                    changed = true;
                }
            });
            if (Object.keys(quantities).length !== Object.keys(item.quantities).length) {
                changed = true;
            }
        } else if (item.sizes && typeof item.sizes === 'object') {
            quantities = {};
            Object.entries(item.sizes).forEach(([size, qty]) => {
                const numericQty = Number(qty) || 0;
                if (numericQty > 0) {
                    quantities[size] = numericQty;
                }
            });
            changed = true;
        }
    }

    if (quantities) {
        item.quantities = quantities;
        item.sizes = { ...quantities };
        const summary = buildSizeSummaryFromQuantities(quantities);
        if (item.size !== summary) {
            item.size = summary;
            changed = true;
        }
    }

    const fallbackQty = Number(item && item.quantity ? item.quantity : 0) || 0;
    const totalQty = quantities
        ? Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
        : Math.max(0, fallbackQty);

    if (item && item.quantity !== totalQty) {
        item.quantity = totalQty;
        changed = true;
    }

    return { totalQty, changed };
}

function applyPricingAndNormalize(basket) {
    const totalsByCode = {};
    let changed = false;

    basket.forEach(item => {
        const { totalQty, changed: itemChanged } = normalizeItemQuantities(item);
        if (itemChanged) changed = true;
        const code = item && item.code ? item.code : 'UNKNOWN';
        totalsByCode[code] = (totalsByCode[code] || 0) + totalQty;
    });

    basket.forEach(item => {
        const code = item && item.code ? item.code : 'UNKNOWN';
        const totalQty = totalsByCode[code] || 0;
        const fallbackBase = item && item.basePrice !== undefined ? Number(item.basePrice) : Number(item && item.price ? item.price : 0);
        const unitPrice = getDiscountedUnitPrice(code, totalQty, fallbackBase);
        if (item && item.basePrice === undefined && PRICING_RULES[code]) {
            item.basePrice = PRICING_RULES[code].basePrice;
            changed = true;
        }
        const formatted = unitPrice.toFixed(2);
        if (item && item.price !== formatted) {
            item.price = formatted;
            changed = true;
        }
    });

    return { changed, totalsByCode };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBasketData();
    loadSavedSelections(); // Load previous selections if coming back
    loadExistingCustomizations();
    initPositionSelection();
    initMethodSelection();
    restorePreviousSelections(); // Restore UI state
    initCustomUploadModal();
    initAddLogoModal();
});

function loadBasketData() {
    const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
    const basketListEl = document.getElementById('basketItemsList');

    if (basket.length === 0) {
        alert('No items in basket. Please add products first.');
        window.location.href = 'home.html';
        return;
    }

    const { changed, totalsByCode } = applyPricingAndNormalize(basket);
    if (changed) {
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
    }

    let basketHTML = '';
    let totalGarmentCost = 0;
    const grouped = [];

    basket.forEach((item, index) => {
        const qtyMap = item.quantities && Object.keys(item.quantities).length ? item.quantities : null;
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
                        price: Number(item.price),
                        basePrice: item.basePrice !== undefined ? Number(item.basePrice) : Number(item.price)
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
                    price: Number(item.price),
                    basePrice: item.basePrice !== undefined ? Number(item.basePrice) : Number(item.price)
                });
            }
        }
    });

    grouped.forEach(g => {
        const safeSizeKey = (g.size || 'all').replace(/[^a-z0-9_-]/gi, '-');
        const tempKey = `${g.index}_${safeSizeKey}`;
        const totalQtyForProduct = totalsByCode[g.code] || g.qty;
        const storedPrice = basket[g.index] && basket[g.index].price ? Number(basket[g.index].price) : NaN;
        const unitPrice = Number.isFinite(storedPrice) ? storedPrice : getDiscountedUnitPrice(g.code, totalQtyForProduct, g.basePrice);
        const itemTotal = unitPrice * g.qty;
        totalGarmentCost += itemTotal;

        basketHTML += `
            <div class="sidebar-basket-item" data-index="${g.index}" data-size="${g.size}">
                <img src="${g.image}" alt="${g.color}">
                <div class="sidebar-basket-details">
                    <strong>${g.name}</strong>
                    <div class="product-code" id="product-code-${tempKey}">${g.code} - ${g.color}</div>
                    <div class="product-sizes" style="font-size:0.98em;font-weight:bold;letter-spacing:0.2px;">${g.qty}x${g.size}</div>
                    <div class="product-price">
                        <div class="qty-toggle">
                            <button type="button" class="qty-toggle-btn minus" data-index="${g.index}" data-size="${g.size}" aria-label="Decrease quantity">-</button>
                            <span class="qty-toggle-value" id="qty-display-${tempKey}">${g.qty}</span>
                            <button type="button" class="qty-toggle-btn plus" data-index="${g.index}" data-size="${g.size}" aria-label="Increase quantity">+</button>
                        </div>
                        <span id="row-total-${tempKey}">${g.qty} x £${unitPrice.toFixed(2)} = <span class="item-total">£${itemTotal.toFixed(2)}</span></span>
                    </div>
                </div>
                <button class="remove-item-btn" data-index="${g.index}" data-size="${g.size}" title="Remove item">
                    ❌
                </button>
            </div>
        `;
    });

    basketListEl.innerHTML = basketHTML;

    const basketTotal = totalGarmentCost;

    let basketTotalEl = document.getElementById('basketTotalExcVAT');
    if (!basketTotalEl) {
        basketTotalEl = document.createElement('div');
        basketTotalEl.id = 'basketTotalExcVAT';
        basketTotalEl.style.margin = '16px 0';
        basketTotalEl.style.fontWeight = 'bold';
        basketTotalEl.style.fontSize = '1.1em';
        basketListEl.parentNode.insertBefore(basketTotalEl, basketListEl);
    }
    basketTotalEl.innerHTML = `<span>Quote Basket</span><br><span>Totale exc VAT: £${basketTotal.toFixed(2)}</span>`;

    const proceedBtn = document.getElementById('proceedToCustomizationBtn');
    if (proceedBtn) {
        if (basket.length > 0) {
            proceedBtn.disabled = false;
            proceedBtn.classList.add('active');
            proceedBtn.onclick = () => {
                window.location.href = 'customize-detail.html';
            };
        } else {
            proceedBtn.disabled = true;
            proceedBtn.classList.remove('active');
            proceedBtn.onclick = null;
        }
    }

    document.querySelectorAll('.qty-toggle-btn.plus').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.index, 10);
            const size = btn.dataset.size;
            updateItemQuantity(idx, 1, size);
        };
    });

    document.querySelectorAll('.qty-toggle-btn.minus').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.index, 10);
            const size = btn.dataset.size;
            updateItemQuantity(idx, -1, size);
        };
    });

    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.index, 10);
            const size = btn.dataset.size;
            removeItem(idx, size);
        };
    });

    const totalQuantity = Object.values(totalsByCode).reduce((sum, qty) => sum + qty, 0);
    const averageUnitPrice = totalQuantity > 0 ? (totalGarmentCost / totalQuantity) : 0;

    if (totalQuantity > 0) {
        document.getElementById('sidebarGarmentCost').textContent = `£${averageUnitPrice.toFixed(2)} x ${totalQuantity}`;
    } else {
        document.getElementById('sidebarGarmentCost').textContent = `£0.00`;
    }

    updateSidebarCosts();
}

function loadSavedSelections() {
    // Load previously selected positions and methods from sessionStorage
    const savedPositions = sessionStorage.getItem('selectedPositions');
    const savedMethods = sessionStorage.getItem('positionMethods');
    
    if (savedPositions) {
        selectedPositions = JSON.parse(savedPositions);
        console.log('Loaded saved positions:', selectedPositions);
    }
    
    if (savedMethods) {
        positionMethods = JSON.parse(savedMethods);
        console.log('Loaded saved methods:', positionMethods);
    }
}

function loadExistingCustomizations() {
    positionCustomizationsMap = {};
    const stored = sessionStorage.getItem('positionCustomizations');
    if (!stored) return;

    try {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
            arr.forEach((custom, index) => {
                if (!custom) return;
                const positionEntry = selectedPositions[index];
                if (positionEntry && positionEntry.position) {
                    positionCustomizationsMap[positionEntry.position] = custom;
                }
            });
        }
    } catch (error) {
        console.warn('Unable to parse saved customizations', error);
    }
}

function resetPriceBadge(badge) {
    if (!badge) return;
    badge.classList.remove('active', 'add-logo-btn');
    badge.dataset.role = 'method';
    badge.dataset.activeMethod = '';
    const label = (badge.dataset.defaultLabel || '').toUpperCase();
    const price = badge.dataset.defaultPrice || '';
    badge.innerHTML = `
        <span class="price-label">${label}</span>
        <span class="price-value">${price}</span>
    `;
}

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
        const priceText = methodBadge ? (methodBadge.dataset.defaultPrice || '') : (addBadge.dataset.defaultPrice || '');
        addBadge.innerHTML = `
            <span class="add-logo-text">${customization ? 'Edit Customization' : 'Add Logo'}</span>
            <span class="add-logo-price">${priceText}</span>
        `;
    }
}

function updateCustomizationIndicator(card, hasCustomization) {
    if (!card) return;
    const pill = card.querySelector('.customization-pill');
    const previewContent = card.querySelector('.position-preview-content');
    const previewImage = previewContent ? previewContent.querySelector('.preview-image') : null;
    const previewText = previewContent ? previewContent.querySelector('.preview-text') : null;
    if (!pill) return;

    const resetPreview = () => {
        if (previewContent) {
            previewContent.hidden = true;
        }
        if (previewImage) {
            previewImage.hidden = true;
            previewImage.removeAttribute('src');
        }
        if (previewText) {
            previewText.hidden = true;
            previewText.textContent = '';
        }
    };

    resetPreview();

    if (hasCustomization) {
        const position = card.querySelector('input[type="checkbox"]').value;
        const customization = positionCustomizationsMap[position];
        const typeText = customization?.type === 'text' ? 'Text ready' : 'Logo ready';
        pill.textContent = typeText;
        pill.hidden = false;
        card.classList.add('customized');

        if (customization && previewContent) {
            if (customization.type === 'logo') {
                const logoData = customization.uploadedLogo || '';
                const logoName = customization.logoName || customization.name || 'Logo ready';
                const logoType = customization.logoType || '';
                const isImage = (logoType && logoType.startsWith('image')) || logoData.startsWith('data:image');

                if (isImage && previewImage && logoData) {
                    previewImage.src = logoData;
                    previewImage.hidden = false;
                    if (previewText) {
                        previewText.hidden = true;
                        previewText.textContent = '';
                    }
                } else if (previewText) {
                    previewText.textContent = logoName;
                    previewText.hidden = false;
                }
            } else if (customization.type === 'text' && previewText) {
                previewText.textContent = customization.text || typeText;
                previewText.hidden = false;
                if (previewImage) {
                    previewImage.hidden = true;
                    previewImage.removeAttribute('src');
                }
            }

            previewContent.hidden = false;
        }
    } else {
        pill.hidden = true;
        card.classList.remove('customized');
    }
}

function refreshCardState(position) {
    const checkbox = document.querySelector(`.position-card input[value="${position}"]`);
    if (!checkbox) return;
    const card = checkbox.closest('.position-card');
    applyMethodUI(card, positionMethods[position]);
    updateCustomizationIndicator(card, Boolean(positionCustomizationsMap[position]));
}

function persistSelections() {
    if (selectedPositions.length) {
        sessionStorage.setItem('selectedPositions', JSON.stringify(selectedPositions));
    } else {
        sessionStorage.removeItem('selectedPositions');
    }

    if (Object.keys(positionMethods).length) {
        sessionStorage.setItem('positionMethods', JSON.stringify(positionMethods));
    } else {
        sessionStorage.removeItem('positionMethods');
    }

    syncPositionCustomizationsArray();
}

function syncPositionCustomizationsArray() {
    if (selectedPositions.length) {
        const arrayData = selectedPositions.map(pos => positionCustomizationsMap[pos.position] || null);
        sessionStorage.setItem('positionCustomizations', JSON.stringify(arrayData));
    } else {
        sessionStorage.removeItem('positionCustomizations');
    }
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function restorePreviousSelections() {
    // Restore UI state based on saved data
    const cards = document.querySelectorAll('.position-card');
    
    cards.forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        const position = checkbox.value;
        
        // Check if this position was previously selected
        const isSelected = selectedPositions.some(p => p.position === position);
        
        if (isSelected) {
            // Check the checkbox
            checkbox.checked = true;
            card.classList.add('selected');
            
            refreshCardState(position);
        }
    });
    
    // Update sidebar costs with restored selections
    updateSidebarCosts();
}

function updateItemQuantity(index, delta, size) {
    const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
    const item = basket[index];
    if (!item) return;

    if (item.quantities && size) {
        const updatedQty = (Number(item.quantities[size]) || 0) + delta;
        if (updatedQty > 0) {
            item.quantities[size] = updatedQty;
        } else {
            delete item.quantities[size];
            if (Object.keys(item.quantities).length === 0) {
                basket.splice(index, 1);
            }
        }
    } else {
        const updatedQty = (Number(item.quantity) || 0) + delta;
        if (updatedQty > 0) {
            item.quantity = updatedQty;
        } else {
            basket.splice(index, 1);
        }
    }

    const { changed } = applyPricingAndNormalize(basket);
    if (changed) {
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
    } else {
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
    }

    if (basket.length === 0) {
        sessionStorage.removeItem('selectedPositions');
        sessionStorage.removeItem('positionMethods');
        sessionStorage.removeItem('positionCustomizations');
        sessionStorage.removeItem('currentPositionIndex');
        sessionStorage.removeItem('customizingProduct');
        window.location.href = 'home.html';
    } else {
        loadBasketData();
    }
}

let itemToRemove = null;
let itemToRemoveSize = null;

function removeItem(index, size) {
    itemToRemove = index;
    itemToRemoveSize = size || null;
    document.getElementById('confirmRemoveModal').style.display = 'flex';
}

function closeRemoveModal() {
    document.getElementById('confirmRemoveModal').style.display = 'none';
    itemToRemove = null;
}

function confirmRemove() {
    if (itemToRemove !== null) {
        const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
        if (itemToRemoveSize && basket[itemToRemove] && basket[itemToRemove].quantities) {
            delete basket[itemToRemove].quantities[itemToRemoveSize];
            if (Object.keys(basket[itemToRemove].quantities).length === 0) {
                basket.splice(itemToRemove, 1);
            }
        } else {
            basket.splice(itemToRemove, 1);
        }
        applyPricingAndNormalize(basket);
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
        closeRemoveModal();
        if (basket.length === 0) {
            sessionStorage.removeItem('selectedPositions');
            sessionStorage.removeItem('positionMethods');
            sessionStorage.removeItem('positionCustomizations');
            sessionStorage.removeItem('currentPositionIndex');
            sessionStorage.removeItem('customizingProduct');
            window.location.href = 'home.html';
        } else {
            loadBasketData();
        }
    }
    itemToRemove = null;
    itemToRemoveSize = null;
}


function initPositionSelection() {
    const cards = document.querySelectorAll('.position-card');
    
    cards.forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        const position = checkbox.value;
        
        // NO default method - buttons start disabled/grey
        
        // Click on card checks if method is selected
        card.addEventListener('click', (e) => {
            // Don't toggle if clicking on price badges
            if (e.target.closest('.price-badge')) return;
            
            // Check if method is selected for this position
            if (!positionMethods[position]) {
                showMethodSelectionPopup();
                return;
            }
            
            // Method selected, toggle checkbox
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
        
        // Checkbox change updates card state
        checkbox.addEventListener('change', () => {
            const positionName = card.querySelector('.position-checkbox span').textContent.trim();
            const priceEmb = parseFloat(card.dataset.embroidery || '0');
            const pricePrint = parseFloat(card.dataset.print || '0');
            
            if (checkbox.checked) {
                card.classList.add('selected');
                
                // Check if already in array
                const existingIndex = selectedPositions.findIndex(p => p.position === position);
                if (existingIndex === -1) {
                    selectedPositions.push({
                        position: position,
                        name: positionName,
                        priceEmb: priceEmb,
                        pricePrint: pricePrint,
                        method: positionMethods[position] || 'embroidery'
                    });
                }
                refreshCardState(position);
            } else {
                card.classList.remove('selected');
                selectedPositions = selectedPositions.filter(p => p.position !== position);
                delete positionMethods[position];
                delete positionCustomizationsMap[position];
                card.querySelectorAll('.price-badge').forEach(resetPriceBadge);
                updateCustomizationIndicator(card, false);
            }
            
            // Update costs in sidebar
            persistSelections();
            updateSidebarCosts();
        });
    });
}

function initMethodSelection() {
    const cards = document.querySelectorAll('.position-card');
    
    cards.forEach(card => {
        const position = card.querySelector('input[type="checkbox"]').value;
        const checkbox = card.querySelector('input[type="checkbox"]');
        
        card.querySelectorAll('.price-badge').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.stopPropagation();

                const role = badge.dataset.role || 'method';
                const wasChecked = checkbox.checked;

                if (role === 'add-logo') {
                    const activeMethod = badge.dataset.activeMethod || positionMethods[position] || badge.dataset.method;
                    if (!activeMethod) {
                        return;
                    }

                    if (!checkbox.checked) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change'));
                    }

                    startLogoUploadFlow(position, activeMethod);
                    return;
                }

                const method = badge.dataset.method;
                if (!method) {
                    return;
                }

                positionMethods[position] = method;

                if (positionCustomizationsMap[position]) {
                    positionCustomizationsMap[position].method = method;
                }

                applyMethodUI(card, method);
                updateCustomizationIndicator(card, Boolean(positionCustomizationsMap[position]));

                if (!wasChecked) {
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change'));
                } else {
                    const existing = selectedPositions.find(p => p.position === position);
                    if (existing) {
                        existing.method = method;
                    }
                    persistSelections();
                    updateSidebarCosts();
                }
            });
        });
    });
}

function initAddLogoModal() {
    const modal = document.getElementById('addLogoModal');
    if (!modal) {
        return;
    }

    const typeButtons = modal.querySelectorAll('.add-logo-type-buttons .type-btn');
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setAddLogoType(btn.dataset.type || 'logo');
        });
    });

    const textArea = document.getElementById('addLogoText');
    if (textArea) {
        textArea.addEventListener('input', (event) => {
            currentModalData.text = event.target.value;
        });
    }

    const nameInput = document.getElementById('addLogoName');
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            hideAddLogoError();
        });
    }

    const dropzone = document.getElementById('addLogoDropzone');

    if (dropzone) {
        dropzone.addEventListener('click', (event) => {
            event.preventDefault();
            openCustomUploadModal();
        });
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeAddLogoModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            closeAddLogoModal();
        }
    });

    setAddLogoType(currentModalData.type || 'logo');
    updateAddLogoDropzonePreview(currentModalData.logo);
    hideAddLogoError();
}

function initCustomUploadModal() {
    const modal = document.getElementById('customUploadModal');
    if (!modal) {
        return;
    }

    customUploadElements = {
        modal,
        dropArea: document.getElementById('customUploadDropArea'),
        fileInput: document.getElementById('customUploadFile'),
        fileInfo: document.getElementById('customUploadFileInfo'),
        fileName: document.getElementById('customUploadFileName'),
        fileSize: document.getElementById('customUploadFileSize'),
        progressBar: document.getElementById('customUploadProgressBar'),
        previewBox: document.getElementById('customUploadPreviewBox'),
        previewImage: document.getElementById('customUploadPreview'),
        textField: document.getElementById('customUploadText'),
        counterEl: document.getElementById('customUploadTextCounter'),
        removeBtn: document.getElementById('customUploadRemoveBtn'),
        cancelBtn: document.getElementById('customUploadCancel'),
        continueBtn: document.getElementById('customUploadContinue'),
        errorEl: document.getElementById('customUploadError')
    };

    const { dropArea, fileInput, removeBtn, cancelBtn, continueBtn, textField } = customUploadElements;

    if (dropArea && fileInput) {
        dropArea.addEventListener('click', () => {
            hideCustomUploadError();
            fileInput.click();
        });

        ['dragenter', 'dragover'].forEach(evt => {
            dropArea.addEventListener(evt, (event) => {
                event.preventDefault();
                dropArea.classList.add('dragover');
            });
        });

        ['dragleave', 'dragend'].forEach(evt => {
            dropArea.addEventListener(evt, () => {
                dropArea.classList.remove('dragover');
            });
        });

        dropArea.addEventListener('drop', (event) => {
            event.preventDefault();
            dropArea.classList.remove('dragover');
            const file = event.dataTransfer?.files?.[0];
            if (file) {
                handleCustomUploadSelection(file);
            }
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target?.files?.[0];
            if (file) {
                handleCustomUploadSelection(file);
            }
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            clearCustomUploadFile();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            resetCustomUploadModal();
            closeCustomUploadModal();
        });
    }

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            handleCustomUploadContinue();
        });
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            resetCustomUploadModal();
            closeCustomUploadModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            resetCustomUploadModal();
            closeCustomUploadModal();
        }
    });

    if (textField) {
        textField.addEventListener('input', handleCustomUploadTextInput);
    }
}

function handleCustomUploadTextInput(event) {
    if (!customUploadElements) {
        return;
    }

    const { textField } = customUploadElements;
    if (!textField) {
        return;
    }

    let value = event.target.value || '';
    if (value.length > CUSTOM_UPLOAD_TEXT_LIMIT) {
        value = value.slice(0, CUSTOM_UPLOAD_TEXT_LIMIT);
        textField.value = value;
    }

    customUploadState.text = value;
    currentModalData.text = value;
    hideCustomUploadError();
    updateCustomUploadTextCounter();
    updateCustomUploadContinueState();
}

function updateCustomUploadTextCounter() {
    if (!customUploadElements) {
        return;
    }

    const { textField, counterEl } = customUploadElements;
    if (!textField || !counterEl) {
        return;
    }

    const length = textField.value.length;
    counterEl.textContent = `${length} / ${CUSTOM_UPLOAD_TEXT_LIMIT}`;
    counterEl.classList.toggle('over-limit', length >= CUSTOM_UPLOAD_TEXT_LIMIT);
}

function updateCustomUploadContinueState() {
    if (!customUploadElements) {
        return;
    }

    const { continueBtn, textField, previewBox } = customUploadElements;
    if (!continueBtn) {
        return;
    }

    if (customUploadState.processing) {
        continueBtn.disabled = true;
        continueBtn.classList.remove('enabled');
        return;
    }

    const textValue = textField ? textField.value.trim() : '';
    const hasText = Boolean(textValue);
    const hasFileReady = Boolean(customUploadState.file) && previewBox && !previewBox.classList.contains('hidden');

    if (hasFileReady || hasText) {
        continueBtn.disabled = false;
        continueBtn.classList.add('enabled');
    } else {
        continueBtn.disabled = true;
        continueBtn.classList.remove('enabled');
    }
}

function startLogoUploadFlow(position, method) {
    const checkbox = document.querySelector(`.position-card input[value="${position}"]`);
    const card = checkbox ? checkbox.closest('.position-card') : null;
    const existingCustomization = positionCustomizationsMap[position] || null;

    positionMethods[position] = method;
    currentModalPosition = position;
    currentModalData = {
        method,
        type: 'logo',
        logo: null,
        text: '',
        name: existingCustomization?.name || ''
    };

    const prefillLogo = existingCustomization && existingCustomization.type === 'logo' && existingCustomization.uploadedLogo
        ? {
            data: existingCustomization.uploadedLogo,
            name: existingCustomization.logoName || existingCustomization.name || 'Uploaded logo'
        }
        : null;

    const prefillText = existingCustomization && existingCustomization.type === 'text'
        ? existingCustomization.text || ''
        : '';

    if (card && checkbox && !checkbox.checked) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
    }

    openCustomUploadModal({ existingLogo: prefillLogo, existingText: prefillText });
}

function openCustomUploadModal(options = {}) {
    const modal = customUploadElements?.modal;
    if (!modal) {
        initCustomUploadModal();
    }

    if (!customUploadElements?.modal) {
        return;
    }

    resetCustomUploadModal();
    customUploadElements.modal.style.display = 'flex';
    const continueBtn = customUploadElements.continueBtn;
    if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.classList.remove('enabled');
    }

    if (options.existingLogo && customUploadElements.previewBox) {
        const { data, name } = options.existingLogo;
        const { previewBox, previewImage } = customUploadElements;
        const isImageData = typeof data === 'string' && data.startsWith('data:image');

        if (previewImage) {
            if (data && isImageData) {
                previewImage.src = data;
                previewImage.classList.remove('hidden');
            } else {
                previewImage.removeAttribute('src');
                previewImage.classList.add('hidden');
            }
        }

        previewBox.classList.remove('hidden');
    }

    if (typeof options.existingText === 'string' && customUploadElements.textField) {
        const text = options.existingText.slice(0, CUSTOM_UPLOAD_TEXT_LIMIT);
        customUploadElements.textField.value = text;
        customUploadState.text = text;
        updateCustomUploadTextCounter();
        updateCustomUploadContinueState();
    }
}

function closeCustomUploadModal() {
    if (!customUploadElements?.modal) {
        return;
    }
    customUploadElements.modal.style.display = 'none';
    resetCustomUploadModal();
    currentModalPosition = null;
    currentModalData.logo = null;
    currentModalData.name = '';
}

function resetCustomUploadModal() {
    clearInterval(customUploadState.progressTimer);
    customUploadState.progressTimer = null;
    customUploadState.progressValue = 0;
    customUploadState.processing = false;
    customUploadState.file = null;
    customUploadState.text = '';

    if (!customUploadElements) {
        return;
    }

    const {
        dropArea,
        fileInput,
        fileInfo,
        fileName,
        fileSize,
        progressBar,
        previewBox,
        previewImage,
        continueBtn,
        textField,
        counterEl
    } = customUploadElements;

    hideCustomUploadError();

    if (fileInput) {
        fileInput.value = '';
    }

    if (fileInfo) {
        fileInfo.classList.add('hidden');
    }

    if (dropArea) {
        dropArea.classList.remove('dragover');
    }

    if (fileName) {
        fileName.textContent = '';
    }

    if (fileSize) {
        fileSize.textContent = '';
    }

    if (progressBar) {
        progressBar.style.width = '0%';
    }

    if (previewBox) {
        previewBox.classList.add('hidden');
    }

    if (previewImage) {
        previewImage.removeAttribute('src');
        previewImage.classList.add('hidden');
    }

    if (textField) {
        textField.value = '';
    }
    if (counterEl) {
        counterEl.textContent = `0 / ${CUSTOM_UPLOAD_TEXT_LIMIT}`;
        counterEl.classList.remove('over-limit');
    }

    if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.classList.remove('enabled');
    }

    updateCustomUploadContinueState();
}

function clearCustomUploadFile() {
    customUploadState.file = null;
    customUploadState.processing = false;
    customUploadState.progressValue = 0;
    if (customUploadState.progressTimer) {
        clearInterval(customUploadState.progressTimer);
        customUploadState.progressTimer = null;
    }
    if (!customUploadElements) {
        return;
    }

    const { fileInput, previewBox, previewImage, fileInfo, progressBar, continueBtn } = customUploadElements;
    if (fileInput) {
        fileInput.value = '';
    }
    if (previewImage) {
        previewImage.removeAttribute('src');
        previewImage.classList.add('hidden');
    }
    if (previewBox) {
        previewBox.classList.add('hidden');
    }
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    if (fileInfo) {
        fileInfo.classList.add('hidden');
    }
    if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.classList.remove('enabled');
    }
    hideCustomUploadError();
    updateCustomUploadContinueState();
}

function handleCustomUploadSelection(file) {
    if (!customUploadElements) {
        return;
    }

    const validationError = validateLogoFile(file);
    if (validationError) {
        showCustomUploadError(validationError);
        return;
    }

    hideCustomUploadError();
    customUploadState.file = file;
    customUploadState.processing = false;

    const { fileInfo, fileName, fileSize, progressBar, previewBox, previewImage, continueBtn } = customUploadElements;

    if (fileInfo && fileName && fileSize) {
        fileInfo.classList.remove('hidden');
        fileName.textContent = file.name;
        fileSize.textContent = `(${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }

    if (previewBox) {
        previewBox.classList.add('hidden');
    }

    if (previewImage) {
        previewImage.classList.add('hidden');
        previewImage.removeAttribute('src');
    }

    if (progressBar) {
        progressBar.style.width = '0%';
    }

    if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.classList.remove('enabled');
    }

    simulateCustomUploadProgress(() => showCustomUploadPreview(file));

    if (customUploadElements.fileInput) {
        customUploadElements.fileInput.value = '';
    }
}

function simulateCustomUploadProgress(callback) {
    clearInterval(customUploadState.progressTimer);
    customUploadState.progressValue = 0;

    const progressBar = customUploadElements?.progressBar;
    if (!progressBar) {
        callback();
        return;
    }

    customUploadState.progressTimer = setInterval(() => {
        customUploadState.progressValue = Math.min(100, customUploadState.progressValue + 2);
        progressBar.style.width = `${customUploadState.progressValue}%`;

        if (customUploadState.progressValue >= 100) {
            clearInterval(customUploadState.progressTimer);
            customUploadState.progressTimer = null;
            setTimeout(callback, 600);
        }
    }, 30);
}

function showCustomUploadPreview(file) {
    if (!customUploadElements) {
        return;
    }

    const { previewBox, previewImage, continueBtn } = customUploadElements;
    const mimeType = file?.type || '';
    const extension = (file?.name || '').split('.').pop().toLowerCase();
    const isImage = mimeType.startsWith('image') || ['svg'].includes(extension);

    const finalize = () => {
        if (previewBox) {
            previewBox.classList.remove('hidden');
        }
        if (continueBtn) {
            continueBtn.disabled = false;
            continueBtn.classList.add('enabled');
        }
        updateCustomUploadContinueState();
    };

    if (isImage && previewImage) {
        const reader = new FileReader();
        reader.onload = () => {
            previewImage.src = reader.result;
            previewImage.classList.remove('hidden');
            finalize();
        };
        reader.readAsDataURL(file);
    } else {
        if (previewImage) {
            previewImage.removeAttribute('src');
            previewImage.classList.add('hidden');
        }
        finalize();
    }
}

function showCustomUploadError(message) {
    if (!customUploadElements?.errorEl) {
        return;
    }
    customUploadElements.errorEl.textContent = message;
    customUploadElements.errorEl.classList.remove('hidden');
}

function hideCustomUploadError() {
    if (!customUploadElements?.errorEl) {
        return;
    }
    customUploadElements.errorEl.textContent = '';
    customUploadElements.errorEl.classList.add('hidden');
}

function handleCustomUploadContinue() {
    if (!customUploadElements) {
        return;
    }

    if (customUploadState.processing) {
        return;
    }

    const file = customUploadState.file;
    const rawText = customUploadElements.textField ? customUploadElements.textField.value : '';
    const trimmedText = rawText.trim();
    customUploadState.text = rawText;
    const continueBtn = customUploadElements.continueBtn;

    if (!file && !trimmedText) {
        showCustomUploadError('Please upload a logo or enter text to continue.');
        return;
    }

    if (file) {
        const validationError = validateLogoFile(file);
        if (validationError) {
            showCustomUploadError(validationError);
            return;
        }
    }

    hideCustomUploadError();
    customUploadState.processing = true;

    if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.classList.remove('enabled');
    }

    if (file) {
        readFileAsDataURL(file)
            .then(dataUrl => {
                applyLogoCustomizationFromData({
                    position: currentModalPosition,
                    method: currentModalData.method || positionMethods[currentModalPosition] || 'embroidery',
                    file,
                    dataUrl,
                    text: trimmedText
                });
                closeCustomUploadModal();
            })
            .catch(error => {
                console.error('Logo upload failed', error);
                showCustomUploadError('Unable to process the selected file. Please try again.');
                if (continueBtn) {
                    continueBtn.disabled = false;
                    continueBtn.classList.add('enabled');
                }
            })
            .finally(() => {
                customUploadState.processing = false;
                updateCustomUploadContinueState();
            });
    } else if (trimmedText) {
        applyTextCustomization({
            position: currentModalPosition,
            method: currentModalData.method || positionMethods[currentModalPosition] || 'embroidery',
            text: trimmedText
        });
        closeCustomUploadModal();
        customUploadState.processing = false;
        updateCustomUploadContinueState();
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Unable to read file.'));
        reader.readAsDataURL(file);
    });
}

function applyLogoCustomizationFromData({ position, method, file, dataUrl, text = '' }) {
    if (!position || !dataUrl) {
        return;
    }

    const fileName = file?.name || 'Uploaded logo';
    const defaultName = fileName.replace(/\.[^/.]+$/, '') || 'Custom Logo';
    const sanitizedText = typeof text === 'string' ? text.trim().slice(0, CUSTOM_UPLOAD_TEXT_LIMIT) : '';
    const displayName = currentModalData.name?.trim() || sanitizedText || defaultName;

    currentModalData.logo = {
        data: dataUrl,
        name: fileName,
        type: file?.type || ''
    };
    currentModalData.name = displayName;
    currentModalData.text = sanitizedText;
    currentModalData.type = 'logo';

    const checkbox = document.querySelector(`.position-card input[value="${position}"]`);
    const card = checkbox ? checkbox.closest('.position-card') : null;

    if (card) {
        card.classList.add('selected');
    }

    const customization = {
        position,
        name: displayName,
        method,
        type: 'logo',
        uploadedLogo: dataUrl,
        logoName: fileName,
        logoType: file?.type || '',
        logoSize: file?.size || null,
        text: sanitizedText
    };

    positionMethods[position] = method;
    positionCustomizationsMap[position] = customization;

    const existing = selectedPositions.find(item => item.position === position);
    if (existing) {
        existing.method = method;
    } else {
        const positionName = card ? card.querySelector('.position-checkbox span')?.textContent.trim() : capitalize(position.replace(/-/g, ' '));
        const priceEmb = card ? parseFloat(card.dataset.embroidery || '0') : 0;
        const pricePrint = card ? parseFloat(card.dataset.print || '0') : 0;

        selectedPositions.push({
            position,
            name: positionName || capitalize(position.replace(/-/g, ' ')),
            priceEmb,
            pricePrint,
            method
        });

        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
        }
    }

    persistSelections();
    refreshCardState(position);
    updateSidebarCosts();
    currentModalPosition = null;
}

function applyTextCustomization({ position, method, text }) {
    if (!position) {
        return;
    }

    const sanitizedText = typeof text === 'string' ? text.trim().slice(0, CUSTOM_UPLOAD_TEXT_LIMIT) : '';
    if (!sanitizedText) {
        return;
    }

    const checkbox = document.querySelector(`.position-card input[value="${position}"]`);
    const card = checkbox ? checkbox.closest('.position-card') : null;
    const displayName = sanitizedText.length > 24 ? `${sanitizedText.slice(0, 24)}...` : sanitizedText;

    currentModalData.logo = null;
    currentModalData.type = 'text';
    currentModalData.text = sanitizedText;
    currentModalData.name = displayName;

    const customization = {
        position,
        name: displayName,
        method,
        type: 'text',
        uploadedLogo: null,
        logoName: null,
        logoType: null,
        logoSize: null,
        text: sanitizedText
    };

    positionMethods[position] = method;
    positionCustomizationsMap[position] = customization;

    if (card) {
        card.classList.add('selected');
    }

    const existing = selectedPositions.find(item => item.position === position);
    if (existing) {
        existing.method = method;
    } else {
        const positionName = card ? card.querySelector('.position-checkbox span')?.textContent.trim() : capitalize(position.replace(/-/g, ' '));
        const priceEmb = card ? parseFloat(card.dataset.embroidery || '0') : 0;
        const pricePrint = card ? parseFloat(card.dataset.print || '0') : 0;

        selectedPositions.push({
            position,
            name: positionName || capitalize(position.replace(/-/g, ' ')),
            priceEmb,
            pricePrint,
            method
        });

        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
        }
    }

    persistSelections();
    refreshCardState(position);
    updateSidebarCosts();
    currentModalPosition = null;
}

function openAddLogoModal(position, method) {
    const modal = document.getElementById('addLogoModal');
    if (!modal) {
        return;
    }

    const checkbox = document.querySelector(`.position-card input[value="${position}"]`);
    const card = checkbox ? checkbox.closest('.position-card') : null;
    const positionLabel = card ? card.querySelector('.position-checkbox span')?.textContent.trim() : capitalize(position.replace(/-/g, ' '));
    const customization = positionCustomizationsMap[position] || null;

    currentModalPosition = position;
    currentModalData = {
        method: method,
        type: customization?.type || 'logo',
        logo: null,
        text: customization?.text || ''
    };

    if (customization?.uploadedLogo) {
        currentModalData.logo = {
            data: customization.uploadedLogo,
            name: customization.logoName || customization.name || 'Uploaded file',
            type: customization.logoType || ''
        };
    }

    const titleEl = document.getElementById('addLogoModalTitle');
    if (titleEl) {
        titleEl.textContent = customization ? 'Edit Customization' : 'Add Customization';
    }

    const subtitleEl = document.getElementById('addLogoModalSubtitle');
    if (subtitleEl) {
        subtitleEl.textContent = `${positionLabel || capitalize(position)} · ${capitalize(method)}`;
    }

    const methodLabel = document.getElementById('addLogoMethod');
    if (methodLabel) {
        methodLabel.textContent = capitalize(method);
    }

    const nameInput = document.getElementById('addLogoName');
    if (nameInput) {
        nameInput.value = customization?.name || '';
    }

    const textArea = document.getElementById('addLogoText');
    if (textArea) {
        textArea.value = currentModalData.text || '';
    }

    setAddLogoType(currentModalData.type);
    updateAddLogoDropzonePreview(currentModalData.logo);
    hideAddLogoError();

    modal.style.display = 'flex';

    if (nameInput) {
        setTimeout(() => nameInput.focus(), 50);
    }
}

function closeAddLogoModal() {
    const modal = document.getElementById('addLogoModal');
    if (!modal) {
        return;
    }

    modal.style.display = 'none';
    resetAddLogoModalState();
}

function resetAddLogoModalState() {
    currentModalPosition = null;
    currentModalData = {
        method: 'embroidery',
        type: 'logo',
        logo: null,
        text: '',
        name: ''
    };

    const nameInput = document.getElementById('addLogoName');
    if (nameInput) {
        nameInput.value = '';
    }

    const textArea = document.getElementById('addLogoText');
    if (textArea) {
        textArea.value = '';
    }

    setAddLogoType('logo');
    updateAddLogoDropzonePreview(null);
    hideAddLogoError();
}

function setAddLogoType(type) {
    const selectedType = type || 'logo';
    currentModalData.type = selectedType;

    const typeButtons = document.querySelectorAll('.add-logo-type-buttons .type-btn');
    typeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === selectedType);
    });

    const uploadSection = document.getElementById('addLogoUploadSection');
    const textSection = document.getElementById('addLogoTextSection');

    if (uploadSection) {
        uploadSection.style.display = selectedType === 'logo' ? 'block' : 'none';
    }

    if (textSection) {
        textSection.style.display = selectedType === 'text' ? 'block' : 'none';
    }

    if (selectedType === 'text') {
        hideAddLogoError();
    }
}

function validateLogoFile(file) {
    if (!file) {
        return 'Please select a file to upload.';
    }

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml', 'application/pdf', 'application/postscript'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.eps', '.ai', '.pdf'];
    const extension = file.name ? `.${file.name.split('.').pop().toLowerCase()}` : '';
    const mimeType = file.type || '';

    if (!validMimeTypes.includes(mimeType) && !validExtensions.includes(extension)) {
        return 'Please upload a valid logo file (JPG, PNG, SVG, PDF, AI, EPS).';
    }

    if (file.size > 5 * 1024 * 1024) {
        return 'File size must be below 5MB.';
    }

    return null;
}

function handleAddLogoFile(file) {
    const validationError = validateLogoFile(file);
    if (validationError) {
        showAddLogoError(validationError);
        return false;
    }

    hideAddLogoError();

    const reader = new FileReader();
    const mimeType = file.type || '';
    reader.onload = (event) => {
        currentModalData.logo = {
            data: event.target?.result,
            name: file.name,
            type: mimeType
        };
        updateAddLogoDropzonePreview(currentModalData.logo);
    };
    reader.readAsDataURL(file);

    return true;
}

function updateAddLogoDropzonePreview(logoInfo) {
    const dropzone = document.getElementById('addLogoDropzone');
    const content = document.getElementById('addLogoDropzoneContent');
    const preview = document.getElementById('addLogoPreview');

    if (!dropzone || !content || !preview) {
        return;
    }

    if (logoInfo && logoInfo.data) {
        dropzone.classList.add('has-file');
        const isImage = (logoInfo.type || '').startsWith('image');

        if (isImage) {
            preview.src = logoInfo.data;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }

        content.innerHTML = `
            <strong>${logoInfo.name || 'Uploaded file'}</strong>
            <span>Click to replace</span>
        `;
    } else {
        dropzone.classList.remove('has-file');
        preview.style.display = 'none';
        content.innerHTML = `
            <strong>Upload your logo</strong>
            <span>Drag & drop or click to browse</span>
            <span class="max-size">Max 5MB • JPG, PNG, PDF, AI, EPS</span>
        `;
    }
}

function showAddLogoError(message) {
    const errorEl = document.getElementById('addLogoError');
    if (!errorEl) {
        return;
    }
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideAddLogoError() {
    const errorEl = document.getElementById('addLogoError');
    if (!errorEl) {
        return;
    }
    errorEl.style.display = 'none';
}

function saveAddLogoCustomization() {
    if (!currentModalPosition) {
        return;
    }

    const nameInput = document.getElementById('addLogoName');
    const textArea = document.getElementById('addLogoText');

    const customizationName = nameInput ? nameInput.value.trim() : '';
    const customizationText = textArea ? textArea.value.trim() : '';

    if (!customizationName) {
        showAddLogoError('Please provide a customization name.');
        if (nameInput) {
            nameInput.focus();
        }
        return;
    }

    if (currentModalData.type === 'logo' && !currentModalData.logo) {
        showAddLogoError('Please upload a logo file.');
        return;
    }

    if (currentModalData.type === 'text' && !customizationText) {
        showAddLogoError('Please enter the text for this customization.');
        if (textArea) {
            textArea.focus();
        }
        return;
    }

    hideAddLogoError();

    const method = positionMethods[currentModalPosition] || currentModalData.method || 'embroidery';

    const customization = {
        position: currentModalPosition,
        name: customizationName,
        method: method,
        type: currentModalData.type,
        uploadedLogo: currentModalData.type === 'logo' && currentModalData.logo ? currentModalData.logo.data : null,
        logoName: currentModalData.type === 'logo' && currentModalData.logo ? currentModalData.logo.name : null,
        logoType: currentModalData.type === 'logo' && currentModalData.logo ? currentModalData.logo.type : null,
        text: currentModalData.type === 'text' ? customizationText : ''
    };

    currentModalData.text = customizationText;

    positionCustomizationsMap[currentModalPosition] = customization;

    const existing = selectedPositions.find(p => p.position === currentModalPosition);
    if (existing) {
        existing.method = method;
    }

    persistSelections();
    refreshCardState(currentModalPosition);
    updateSidebarCosts();

    closeAddLogoModal();
}

function showMethodSelectionPopup() {
    const modal = document.getElementById('confirmRemoveModal');
    const modalBox = modal.querySelector('.modal-box');
    const h3 = modalBox.querySelector('h3');
    const buttons = modalBox.querySelector('.modal-buttons');
    
    h3.textContent = 'Please select Embroidery or Print method first';
    buttons.innerHTML = '<button class="modal-btn modal-btn-ok" onclick="closeRemoveModal()">OK</button>';
    
    modal.style.display = 'flex';
}

function updateSidebarCosts() {
    // Get ALL products from basket
    const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
    if (basket.length === 0) return;
    
    // Calculate total quantity of all items
    const totalQuantity = basket.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate garment cost from basket (already shown separately)
    const garmentCost = basket.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    
    // Calculate application costs and build individual rows
    let totalApplicationCosts = 0;
    let customizationHTML = '';
    
    selectedPositions.forEach((pos, index) => {
        const method = positionMethods[pos.position] || 'embroidery';
        const price = method === 'print' ? pos.pricePrint : pos.priceEmb;
        const positionTotal = price * totalQuantity;
        totalApplicationCosts += positionTotal;
        
        // Create individual row for each customization
        const positionNumber = index + 1;
        customizationHTML += `
            <div class="cost-row">
                <span>Customization ${positionNumber}</span>
                <span>£${price.toFixed(2)} x ${totalQuantity}</span>
            </div>
        `;
    });
    
    const total = garmentCost + totalApplicationCosts;
    
    // Update sidebar with individual customization rows
    const customizationList = document.getElementById('customizationCostsList');
    if (customizationHTML) {
        customizationList.innerHTML = customizationHTML;
    } else {
        customizationList.innerHTML = '';
    }
    
    document.getElementById('sidebarTotalCost').textContent = `£${total.toFixed(2)}`;
}

function proceedToCustomization() {
    console.log('Selected positions:', selectedPositions);
    
    // Re-check all selected checkboxes in case array is empty
    if (selectedPositions.length === 0) {
        const checkedBoxes = document.querySelectorAll('.position-card input[type="checkbox"]:checked');
        console.log('Checked boxes found:', checkedBoxes.length);
        
        checkedBoxes.forEach(checkbox => {
            const card = checkbox.closest('.position-card');
            const positionName = card.querySelector('.position-checkbox span').textContent.trim();
            const priceEmb = parseFloat(card.dataset.embroidery || '0');
            const pricePrint = parseFloat(card.dataset.print || '0');
            const position = checkbox.value;
            
            selectedPositions.push({
                position: position,
                name: positionName,
                priceEmb: priceEmb,
                pricePrint: pricePrint,
                method: positionMethods[position] || 'embroidery'
            });
        });
    }
    
    if (selectedPositions.length === 0) {
        alert('Please select at least one position');
        return;
    }
    
    console.log('Saving to sessionStorage:', selectedPositions);
    
    // Save selected positions and methods to sessionStorage
    sessionStorage.setItem('selectedPositions', JSON.stringify(selectedPositions));
    sessionStorage.setItem('positionMethods', JSON.stringify(positionMethods));
    sessionStorage.setItem('currentPositionIndex', '0');
    
    // Go to first customization page
    window.location.href = 'customize-detail.html';
}
