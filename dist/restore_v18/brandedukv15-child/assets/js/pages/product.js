/* ---------------------------------------------------
   CONFIG
--------------------------------------------------- */

const PRODUCT_CODE = "GD067";
const PRODUCT_NAME = "Gildan Softstyle midweight fleece adult hoodie";
const BASE_PRICE = 17.58;

const DISCOUNTS = [
    { min: 1,   max: 9,     price: BASE_PRICE, save: 0  },
    { min: 10,  max: 24,    price: 16.54,      save: 8  },
    { min: 25,  max: 49,    price: 16.18,      save: 10 },
    { min: 50,  max: 99,    price: 14.94,      save: 15 },
    { min: 100, max: 249,   price: 13.49,      save: 25 },
    { min: 250, max: 99999, price: 12.59,      save: 30 }
];

// Selected customization method (will be set in customize-positions)
let selectedCustomizationMethod = null; // 'embroidery' or 'print'

// Track if basket has items
let hasBasketItems = false;

let clearBasketResolver = null;
let clearBasketModalInitialized = false;

function hideClearBasketPrompt(result = false) {
    const overlay = document.getElementById('clearBasketModal');
    if (overlay) {
        overlay.classList.remove('is-visible');
        overlay.setAttribute('aria-hidden', 'true');
    }
    if (typeof clearBasketResolver === 'function') {
        clearBasketResolver(result);
        clearBasketResolver = null;
    }
}

function initClearBasketModal() {
    if (clearBasketModalInitialized) return;
    const overlay = document.getElementById('clearBasketModal');
    if (!overlay) return;

    const confirmBtn = overlay.querySelector('[data-confirm]');
    const cancelButtons = overlay.querySelectorAll('[data-cancel]');

    confirmBtn?.addEventListener('click', () => hideClearBasketPrompt(true));
    cancelButtons.forEach(btn => btn.addEventListener('click', () => hideClearBasketPrompt(false)));

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            hideClearBasketPrompt(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay.classList.contains('is-visible')) {
            hideClearBasketPrompt(false);
        }
    });

    clearBasketModalInitialized = true;
}

function showClearBasketPrompt() {
    const overlay = document.getElementById('clearBasketModal');

    if (!overlay) {
        const fallback = window.confirm('Are you sure you want to clear the entire basket?');
        return Promise.resolve(fallback);
    }

    initClearBasketModal();

    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');

    const confirmBtn = overlay.querySelector('[data-confirm]');
    setTimeout(() => confirmBtn?.focus(), 10);

    return new Promise(resolve => {
        clearBasketResolver = resolve;
    });
}

class DeleteButton {
    constructor(el, { onClear } = {}) {
        this.el = typeof el === 'string' ? document.querySelector(el) : el;
        this.onClear = onClear;
        this.isRunning = false;
        this.animationHandled = false;

        if (!this.el) return;

        this.letters = this.el.querySelector('[data-anim]');
        this.handleClick = this.handleClick.bind(this);
        this.handleAnimationEnd = this.handleAnimationEnd.bind(this);

        this.el.setAttribute('data-running', 'false');
        this.el.addEventListener('click', this.handleClick);
        this.letters?.addEventListener('animationend', this.handleAnimationEnd);
    }

    handleClick(evt) {
        if (this.isRunning || !this.el) return;
        showClearBasketPrompt().then(confirmed => {
            if (!confirmed) {
                return;
            }
            this.beginClearSequence();
        });
    }

    beginClearSequence() {
        this.isRunning = true;
        this.animationHandled = false;
        if (this.el) {
            this.el.disabled = true;
            this.el.setAttribute('data-running', 'true');
        }
    }

    handleAnimationEnd(event) {
        if (!this.isRunning || this.animationHandled) return;
        const target = event.target;
        if (!target || !target.classList || !target.classList.contains('del-btn__letter')) {
            return;
        }

        const boxes = this.el ? Array.from(this.el.querySelectorAll('.del-btn__letter-box')) : [];
        if (!boxes.length) return;
        const lastBox = boxes[boxes.length - 1];
        if (target.parentElement !== lastBox) {
            return;
        }

        this.animationHandled = true;

        setTimeout(() => {
            this.isRunning = false;
            if (this.el) {
                this.el.setAttribute('data-running', 'false');
            }

            if (typeof this.onClear === 'function') {
                this.onClear();
            }
        }, 1000);
    }
}

/* ---------------------------------------------------
   ELEMENTS
--------------------------------------------------- */

const mainImage    = document.getElementById("mainImage");
const mainPriceEl  = document.getElementById("mainPrice");
const priceInfoEl  = document.getElementById("priceInfo");
const addContinueButton = document.getElementById("addContinueButton");
const addCustomizeButton = document.getElementById("addCustomizeButton");
const belowSummary = document.getElementById("belowBtnSummary");
const thumbButtons = Array.from(document.querySelectorAll('.thumb-item'));

const sizesGrid = document.getElementById("sizesGrid");
const colorGrid = document.getElementById("colorGrid");

/* POPUP */
const popup        = document.getElementById("quotePopup");
const popupContent = document.getElementById("popupContent");
const popupSummary = document.getElementById("popupSummary");
const closePopup   = document.getElementById("closePopup");

const uploadBtnPopup   = document.getElementById("uploadLogoBtn");
const logoInputHidden  = document.getElementById("logoInput");
const logoPreviewPopup = document.getElementById("logoPreview");

/* ---------------------------------------------------
   COLORS
--------------------------------------------------- */

const colors = [
    ["Aquatic", "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg"],
    ["Ash Grey", "https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg"],
    ["Black", "https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg"],
    ["Blue Dusk", "https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg"],
    ["Brown Savana", "https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg"],
    ["Cardinal Red", "https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg"],
    ["Carolina Blue", "https://i.postimg.cc/V6N7kG1D/GD067-Carolina-Blue-FT.jpg"],
    ["Cement", "https://i.postimg.cc/fLbHR2Z2/GD067-Cement-FT.jpg"],
    ["Charcoal", "https://i.postimg.cc/4d38xLZF/GD067-Charcoal-FT.jpg"],
    ["Cobalt", "https://i.postimg.cc/sX2ng6yL/GD067-Cobalt-FT.jpg"],
    ["Cocoa", "https://i.postimg.cc/d10WVHvb/GD067-Cocoa-FT.jpg"],
    ["Daisy", "https://i.postimg.cc/1tzW3Cs1/GD067-Daisy-FT.jpg"],
    ["Dark Heather", "https://i.postimg.cc/j5kMwHdk/GD067-Dark-Heather-FT.jpg"],
    ["Dusty Rose", "https://i.postimg.cc/fLg8tcTP/GD067-Dusty-Rose-FT.jpg"],
    ["Forest Green", "https://i.postimg.cc/FRnTdys8/GD067-Forest-Green-FT.jpg"],
    ["Light Pink", "https://i.postimg.cc/G2SX8FhW/GD067-Light-Pink-FT.jpg"],
    ["Maroon", "https://i.postimg.cc/zBPxbCG1/GD067-Maroon-FT.jpg"],
    ["Military Green", "https://i.postimg.cc/TwHtLV3f/GD067-Military-Green-FT.jpg"],
    ["Mustard", "https://i.postimg.cc/MTr9M7pZ/GD067-Mustard-FT.jpg"],
    ["Navy", "https://i.postimg.cc/MTr9M7pp/GD067-Navy-FT.jpg"],
    ["Off-White", "https://i.postimg.cc/nzw3j4hz/GD067-Off-White-FT.jpg"],
    ["Paragon", "https://i.postimg.cc/j5kMwHSL/GD067-Paragon-FT.jpg"],
    ["Pink Lemonade", "https://i.postimg.cc/zBPxbCGy/GD067-Pink-Lemonade-FT.jpg"],
    ["Pistachio", "https://i.postimg.cc/xCF6Jv1N/GD067-Pistachio-FT.jpg"],
    ["Purple", "https://i.postimg.cc/C5BmjRRx/GD067-Purple-FT.jpg"],
    ["Red", "https://i.postimg.cc/brD3QZZd/GD067-Red-FT.jpg"],
    ["Sport Grey", "https://i.postimg.cc/zvb0nyyg/GD067-Ringspun-Sport-Grey-FT.jpg"],
    ["Royal", "https://i.postimg.cc/VNmG3sVH/GD067-Royal-FT.jpg"],
    ["Sage", "https://i.postimg.cc/tgpSLRcy/GD067-Sage-FT.jpg"],
    ["Sand", "https://i.postimg.cc/Bv4YdZz3/GD067-Sand-FT.jpg"],
    ["Sky", "https://i.postimg.cc/YSMnJ2Pc/GD067-Sky-FT.jpg"],
    ["Smoke", "https://i.postimg.cc/Xv4HTNPb/GD067-Smoke-FT.jpg"],
    ["Stone Blue", "https://i.postimg.cc/g0mSfc72/GD067-Stone-Blue-FT.jpg"],
    ["Tangerine", "https://i.postimg.cc/25GcmRpr/GD067-Tangerine-FT.jpg"],
    ["Texas Orange", "https://i.postimg.cc/TP07GM8x/GD067-Texas-Orange-FT.jpg"],
    ["White", "https://i.postimg.cc/1zBCPhxQ/GD067-White-FT.jpg"],
    ["Yellow Haze", "https://i.postimg.cc/W48WjLRN/GD067-Yellow-Haze-FT.jpg"]
];

let selectedColorName = colors[0][0];
let selectedColorURL  = colors[0][1];

function initStaticGallery() {
    if (!thumbButtons.length) return;

    const setActive = (button) => {
        thumbButtons.forEach(btn => btn.classList.toggle('active', btn === button));
    };

    thumbButtons.forEach(button => {
        button.addEventListener('click', () => {
            const imgSrc = button.dataset.image;
            if (!imgSrc) return;
            if (mainImage) {
                mainImage.src = imgSrc;
            }
            setActive(button);
        });
    });

    const initialActive = thumbButtons.find(btn => btn.classList.contains('active')) || thumbButtons[0];
    if (initialActive) {
        setActive(initialActive);
        if (mainImage && initialActive.dataset.image) {
            mainImage.src = initialActive.dataset.image;
        }
    }

    window.setGalleryActiveBySrc = (src) => {
        const match = thumbButtons.find(btn => btn.dataset.image === src);
        if (match) {
            setActive(match);
        } else {
            thumbButtons.forEach(btn => btn.classList.remove('active'));
        }
    };
}

initStaticGallery();

/* BUILD COLOR GRID */

colors.forEach(([name, url], i) => {
    const div = document.createElement("div");
    div.className = "color-thumb";
    div.style.backgroundImage = `url('${url}')`;

    // Check if this is the saved color from home page
    const savedColorName = sessionStorage.getItem('selectedColorName');
    if (savedColorName && savedColorName === name) {
        div.classList.add("active");
        selectedColorName = name;
        selectedColorURL = url;
        mainImage.src = url;
    } else if (i === 0 && !savedColorName) {
        div.classList.add("active");
    }

    div.onclick = () => {
        // Check if there are unsaved items
        const currentTotal = Object.values(qty).reduce((a,b)=>a+b,0);
        
        if (currentTotal > 0) {
            // Show confirmation modal
            showColorChangeModal(name, url, div);
        } else {
            // No unsaved items, change color directly
            changeColor(name, url, div);
        }
    };

    colorGrid.appendChild(div);
});

/* ---------------------------------------------------
   SIZES
--------------------------------------------------- */

const sizeList = ["XS","S","M","L","XL","2XL","3XL","4XL","5XL"];
let qty = {};
sizeList.forEach(s => qty[s] = 0);

function renderSizes() {
    sizesGrid.innerHTML = "";

    sizeList.forEach(size => {
        const box = document.createElement("div");
        box.className = "size-box";

        box.innerHTML = `
            <div class="size-header">${size}</div>
            <div class="qty-controls">
                <button class="qty-btn minus" data-size="${size}">−</button>
                <input 
                    type="number"
                    class="qty-input"
                    data-size="${size}"
                    min="0"
                    value="0"
                >
                <button class="qty-btn plus" data-size="${size}">+</button>
            </div>
        `;

        sizesGrid.appendChild(box);
    });

    attachSizeEvents();
}

renderSizes();

function attachSizeEvents() {
    document.querySelectorAll(".qty-btn.plus").forEach(btn => {
        btn.onclick = () => {
            const s = btn.dataset.size;
            qty[s]++;
            updateInput(s);
        };
    });

    document.querySelectorAll(".qty-btn.minus").forEach(btn => {
        btn.onclick = () => {
            const s = btn.dataset.size;
            qty[s] = Math.max(0, qty[s] - 1);
            updateInput(s);
        };
    });

    document.querySelectorAll(".qty-input").forEach(inp => {
        inp.oninput = () => {
            const s = inp.dataset.size;
            qty[s] = Math.max(0, parseInt(inp.value) || 0);
            updateTotals();
            updateSizeBoxState(s);
        };
    });
}

function updateInput(size) {
    const input = document.querySelector(`.qty-input[data-size="${size}"]`);
    input.value = qty[size];
    updateSizeBoxState(size);
    updateTotals();
}

function updateSizeBoxState(size) {
    const input = document.querySelector(`.qty-input[data-size="${size}"]`);
    if (!input) return;
    const box = input.closest(".size-box");
    if (!box) return;

    if (qty[size] > 0) box.classList.add("active");
    else box.classList.remove("active");
}

function resetSizes() {
    Object.keys(qty).forEach(s => qty[s] = 0);
    renderSizes();
    updateTotals();
}

function changeColor(name, url, colorDiv) {
    document.querySelectorAll(".color-thumb").forEach(c => c.classList.remove("active"));
    colorDiv.classList.add("active");

    selectedColorName = name;
    selectedColorURL  = url;

    mainImage.src = url;
    if (typeof window.setGalleryActiveBySrc === 'function') {
        window.setGalleryActiveBySrc(url);
    }
    
    // Save selection to sessionStorage
    sessionStorage.setItem('selectedColorName', name);
    sessionStorage.setItem('selectedColorUrl', url);

    resetSizes();
    updateTotals();
}

function showColorChangeModal(newColorName, newColorUrl, newColorDiv) {
    const modal = document.getElementById('colorChangeModal');
    modal.style.display = 'flex';
    
    // Save button - add current selection to basket then change color
    document.getElementById('colorChangeSaveBtn').onclick = () => {
        const total = Object.values(qty).reduce((a,b)=>a+b,0);
        
        if (total > 0) {
            // Get existing basket
            let basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
            
            // Calculate TOTAL quantity of THIS PRODUCT across ALL colors
            const currentProductTotal = basket
                .filter(item => item.name === PRODUCT_NAME && item.code === PRODUCT_CODE)
                .reduce((sum, item) => sum + item.quantity, 0);
            
            const newTotal = currentProductTotal + total;
            const newUnitPrice = getUnitPrice(newTotal);
            
            // Check if same product with same color already exists
            const existingIndex = basket.findIndex(item => 
                item.name === PRODUCT_NAME && 
                item.code === PRODUCT_CODE && 
                item.color === selectedColorName
            );
            
            if (existingIndex !== -1) {
                // Merge sizes with existing item
                Object.keys(qty).forEach(size => {
                    if (qty[size] > 0) {
                        basket[existingIndex].sizes[size] = (basket[existingIndex].sizes[size] || 0) + qty[size];
                    }
                });
                
                // Recalculate total quantity and size summary
                basket[existingIndex].quantity = Object.values(basket[existingIndex].sizes).reduce((a,b)=>a+b,0);
                basket[existingIndex].size = getSizesSummaryFromSizes(basket[existingIndex].sizes);
                basket[existingIndex].price = newUnitPrice.toFixed(2);
            } else {
                // Create new item
                const productData = {
                    name: PRODUCT_NAME,
                    code: PRODUCT_CODE,
                    color: selectedColorName,
                    image: selectedColorURL,
                    quantity: total,
                    size: getSizesSummary(),
                    price: newUnitPrice.toFixed(2),
                    sizes: {...qty}
                };
                basket.push(productData);
            }
            
            // Update price for ALL items of the SAME PRODUCT (all colors)
            basket.forEach(item => {
                if (item.name === PRODUCT_NAME && item.code === PRODUCT_CODE) {
                    item.price = newUnitPrice.toFixed(2);
                }
            });
            
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
            
            hasBasketItems = true;
            
            showToast(`✓ ${total} items saved to basket!`);
        }
        
        // Change color
        changeColor(newColorName, newColorUrl, newColorDiv);
        modal.style.display = 'none';
    };
    
    // Discard button - just change color without saving
    document.getElementById('colorChangeDiscardBtn').onclick = () => {
        changeColor(newColorName, newColorUrl, newColorDiv);
        modal.style.display = 'none';
    };
}

/* ---------------------------------------------------
   MINI SUMMARY
--------------------------------------------------- */

function updateBelowSummary(total, unit) {
    // Get all items from basket
    let basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
    
    // Calculate current selection
    const currentTotal = total;
    const currentPrice = currentTotal > 0 ? (unit * currentTotal) : 0;
    
    // Calculate basket totals
    const basketItems = basket.reduce((sum, item) => sum + item.quantity, 0);
    const basketTotal = basket.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    
    // Grand total including current selection
    const grandTotal = basketTotal + currentPrice;
    const grandItems = basketItems + currentTotal;
    
    const showDeleteButton = basketItems > 0;
    const summaryMarkup = `
        <div class="summary-text">
            <span class="summary-items"><b>${grandItems} items</b>${grandItems > 0 ? ` · £${unit.toFixed(2)} each` : ''}</span>
            <span class="summary-total">Total: <span class="total-green">£${grandTotal.toFixed(2)}</span> ex VAT</span>
        </div>
    `;

    if (grandItems === 0 || !showDeleteButton) {
        belowSummary.innerHTML = grandItems === 0
            ? `
                <div class="summary-text">
                    <span class="summary-items"><b>0 items</b></span>
                    <span class="summary-total">Total: <span class="total-green">£0.00</span> ex VAT</span>
                </div>
            `
            : summaryMarkup;
        return;
    }

    belowSummary.innerHTML = `
        ${summaryMarkup}
        <button id="delete" class="del-btn" type="button" aria-label="Delete" data-running="false">
            <svg class="del-btn__icon" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
                <clipPath id="can-clip">
                    <rect class="del-btn__icon-can-fill" x="5" y="24" width="14" height="11"></rect>
                </clipPath>
                <g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" transform="translate(12,12)">
                    <g class="del-btn__icon-lid">
                        <polyline points="9,5 9,1 15,1 15,5"></polyline>
                        <polyline points="4,5 20,5"></polyline>
                    </g>
                    <g class="del-btn__icon-can">
                        <g stroke-width="0">
                            <polyline id="can-fill" points="6,10 7,23 17,23 18,10"></polyline>
                            <use clip-path="url(#can-clip)" href="#can-fill" fill="#fff"></use>
                        </g>
                        <polyline points="6,10 7,23 17,23 18,10"></polyline>
                    </g>
                </g>
            </svg>
            <span class="del-btn__letters" aria-hidden="true" data-anim>
                <span class="del-btn__letter-box"><span class="del-btn__letter">D</span></span>
                <span class="del-btn__letter-box"><span class="del-btn__letter">e</span></span>
                <span class="del-btn__letter-box"><span class="del-btn__letter">l</span></span>
                <span class="del-btn__letter-box"><span class="del-btn__letter">e</span></span>
                <span class="del-btn__letter-box"><span class="del-btn__letter">t</span></span>
                <span class="del-btn__letter-box"><span class="del-btn__letter">e</span></span>
            </span>
        </button>
    `;

    const deleteBtn = document.getElementById('delete');
    if (deleteBtn) {
        new DeleteButton(deleteBtn, {
            onClear: () => {
                localStorage.removeItem('quoteBasket');
                sessionStorage.removeItem('customizingProduct');
                sessionStorage.removeItem('selectedPositions');
                sessionStorage.removeItem('positionMethods');
                sessionStorage.removeItem('positionCustomizations');
                sessionStorage.removeItem('currentPositionIndex');
                hasBasketItems = false;

                resetSizes();
                setTimeout(() => {
                    updateTotals();
                    showToast('✓ Basket cleared successfully!');
                }, 0);
            }
        });
    }
}

/* ---------------------------------------------------
   DISCOUNT BOX
--------------------------------------------------- */

function updateDiscountBox(total) {
    const boxes = document.querySelectorAll(".disc-box");
    boxes.forEach(b => b.classList.remove("active"));

    let appliedIndex = 0;

    DISCOUNTS.forEach((tier,i)=>{
        if(total >= tier.min && total <= tier.max) appliedIndex = i;
    });

    boxes[appliedIndex].classList.add("active");
}

/* ---------------------------------------------------
   TOTALS
--------------------------------------------------- */

function getUnitPrice(totalItems) {
    if (totalItems === 0) return BASE_PRICE;
    const tier = DISCOUNTS.find(t => totalItems >= t.min && totalItems <= t.max);
    return tier ? tier.price : BASE_PRICE;
}

function getCurrentTier(totalItems) {
    if (totalItems === 0) return DISCOUNTS[0];
    return DISCOUNTS.find(t => totalItems >= t.min && totalItems <= t.max) || DISCOUNTS[0];
}

function updateTotals() {
    const total = Object.values(qty).reduce((a,b)=>a+b,0);
    
    // Check if basket has items
    const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
    hasBasketItems = basket.length > 0;
    
    // Calculate TOTAL quantity of THIS PRODUCT in basket (all colors)
    const basketProductTotal = basket
        .filter(item => item.name === PRODUCT_NAME && item.code === PRODUCT_CODE)
        .reduce((sum, item) => sum + item.quantity, 0);
    
    // Grand total = basket quantity + current selection
    const grandProductTotal = basketProductTotal + total;

    updateDiscountBox(grandProductTotal);

    const unit = getUnitPrice(grandProductTotal);

    mainPriceEl.innerHTML = `£${unit.toFixed(2)} <span>each ex VAT</span>`;

    const tier = getCurrentTier(grandProductTotal);
    if (grandProductTotal === 0) {
        priceInfoEl.innerHTML = "Price listed for 1–9 units";
    } else {
        priceInfoEl.innerHTML =
            `<b>Bulk price applied:</b> £${tier.price.toFixed(2)} ex VAT (${tier.min}+ units)`;
    }

    // Save Selection: enabled if basket has items OR current selection exists
    addContinueButton.disabled = total === 0 && !hasBasketItems;
    
    // Proceed to Customization: enabled if basket has items OR current selection exists
    addCustomizeButton.disabled = total === 0 && !hasBasketItems;

    updateBelowSummary(total, unit);
}

/* ---------------------------------------------------
   ADD TO QUOTE BUTTON (sinistra)
--------------------------------------------------- */

addContinueButton.onclick = () => {
    const total = Object.values(qty).reduce((a,b)=>a+b,0);
    if (total === 0) return;
    
    // Get existing basket
    let basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
    
    // Calculate TOTAL quantity of THIS PRODUCT across ALL colors
    const currentProductTotal = basket
        .filter(item => item.name === PRODUCT_NAME && item.code === PRODUCT_CODE)
        .reduce((sum, item) => sum + item.quantity, 0);
    
    const newTotal = currentProductTotal + total;
    const newUnitPrice = getUnitPrice(newTotal);
    
    // Check if same product with same color already exists
    const existingIndex = basket.findIndex(item => 
        item.name === PRODUCT_NAME && 
        item.code === PRODUCT_CODE && 
        item.color === selectedColorName
    );
    
    if (existingIndex !== -1) {
        // Merge sizes with existing item
        Object.keys(qty).forEach(size => {
            if (qty[size] > 0) {
                basket[existingIndex].sizes[size] = (basket[existingIndex].sizes[size] || 0) + qty[size];
            }
        });
        
        // Recalculate total quantity and size summary
        basket[existingIndex].quantity = Object.values(basket[existingIndex].sizes).reduce((a,b)=>a+b,0);
        basket[existingIndex].size = getSizesSummaryFromSizes(basket[existingIndex].sizes);
        basket[existingIndex].price = newUnitPrice.toFixed(2);
    } else {
        // Create new item
        const productData = {
            name: PRODUCT_NAME,
            code: PRODUCT_CODE,
            color: selectedColorName,
            image: selectedColorURL,
            quantity: total,
            size: getSizesSummary(),
            price: newUnitPrice.toFixed(2),
            sizes: {...qty}
        };
        basket.push(productData);
    }
    
    // Update price for ALL items of the SAME PRODUCT (all colors)
    basket.forEach(item => {
        if (item.name === PRODUCT_NAME && item.code === PRODUCT_CODE) {
            item.price = newUnitPrice.toFixed(2);
        }
    });
    
    localStorage.setItem('quoteBasket', JSON.stringify(basket));
    
    // Show success toast (non alert)
    showToast(`✓ ${total} items added to basket! Continue choosing more colors or sizes.`);
    
    // Update hasBasketItems flag
    hasBasketItems = true;
    
    // Reset sizes per nuova selezione
    resetSizes();
};

/* ---------------------------------------------------
   ADD & CUSTOMIZE BUTTON (destra)
--------------------------------------------------- */

addCustomizeButton.onclick = () => {
    const total = Object.values(qty).reduce((a,b)=>a+b,0);
    
    // If there's a current selection, save it to basket
    if (total > 0) {
        // Get existing basket
        let basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
        
        // Calculate TOTAL quantity of THIS PRODUCT across ALL colors
        const currentProductTotal = basket
            .filter(item => item.name === PRODUCT_NAME && item.code === PRODUCT_CODE)
            .reduce((sum, item) => sum + item.quantity, 0);
        
        const newTotal = currentProductTotal + total;
        const newUnitPrice = getUnitPrice(newTotal);
        
        // Check if same product with same color already exists
        const existingIndex = basket.findIndex(item => 
            item.name === PRODUCT_NAME && 
            item.code === PRODUCT_CODE && 
            item.color === selectedColorName
        );
        
        if (existingIndex !== -1) {
            // Merge sizes with existing item
            Object.keys(qty).forEach(size => {
                if (qty[size] > 0) {
                    basket[existingIndex].sizes[size] = (basket[existingIndex].sizes[size] || 0) + qty[size];
                }
            });
            
            // Recalculate total quantity and size summary
            basket[existingIndex].quantity = Object.values(basket[existingIndex].sizes).reduce((a,b)=>a+b,0);
            basket[existingIndex].size = getSizesSummaryFromSizes(basket[existingIndex].sizes);
            basket[existingIndex].price = newUnitPrice.toFixed(2);
        } else {
            // Create new item
            const productData = {
                name: PRODUCT_NAME,
                code: PRODUCT_CODE,
                color: selectedColorName,
                image: selectedColorURL,
                quantity: total,
                size: getSizesSummary(),
                price: newUnitPrice.toFixed(2),
                sizes: {...qty}
            };
            basket.push(productData);
        }
        
        // Update price for ALL items of the SAME PRODUCT (all colors)
        basket.forEach(item => {
            if (item.name === PRODUCT_NAME && item.code === PRODUCT_CODE) {
                item.price = newUnitPrice.toFixed(2);
            }
        });
        
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
    }
    
    // Navigate to customization positions page (works even if total === 0 but basket has items)
    window.location.href = 'customize-positions.html';
};

function getSizesSummary() {
    const sizeEntries = Object.entries(qty).filter(([s,q]) => q > 0);
    if (sizeEntries.length === 1) {
        return sizeEntries[0][0];
    }
    return sizeEntries.map(([s,q]) => `${q}x${s}`).join(', ');
}

function getSizesSummaryFromSizes(sizes) {
    const sizeEntries = Object.entries(sizes).filter(([s,q]) => q > 0);
    if (sizeEntries.length === 1) {
        return sizeEntries[0][0];
    }
    return sizeEntries.map(([s,q]) => `${q}x${s}`).join(', ');
}

function openPopup() {
    const total = Object.values(qty).reduce((a,b)=>a+b,0);
    const unit  = getUnitPrice(total);
    const tprice = (unit * total).toFixed(2);

    const sizeLines = Object.entries(qty)
        .filter(([s,q]) => q > 0)
        .map(([s,q]) => `${selectedColorName}, ${s}: ${q}`)
        .join("<br>");

    popupContent.innerHTML = `
        <div class="popup-content-fixed">
            <img src="${selectedColorURL}" alt="Product preview">
            <div>
                <h2>${PRODUCT_NAME}</h2>
                <div class="pc-small">
                    <b>${PRODUCT_CODE}</b> — ${selectedColorName}<br>
                    ${sizeLines}
                </div>
            </div>
        </div>
    `;

    popupSummary.innerHTML = `
        <div>
            <b>${total} items</b><br>
            £${unit.toFixed(2)} per item
        </div>
        <div>
            Total: <span class="green">£${tprice}</span> ex. VAT
        </div>
    `;

    popup.style.display = "flex";
}

closePopup.onclick = () => {
    popup.style.display = "none";
};

window.addEventListener("click", (e) => {
    if (e.target === popup) {
        popup.style.display = "none";
    }
});

/* ---------------------------------------------------
   LOGO UPLOAD
--------------------------------------------------- */

uploadBtnPopup.onclick = () => {
    logoInputHidden.click();
};

logoInputHidden.onchange = () => {
    [...logoInputHidden.files].forEach((file) => {
        const reader = new FileReader();
        reader.onload = e => {
            const div = document.createElement("div");
            div.className = "logo-thumb";
            div.style.backgroundImage = `url('${e.target.result}')`;
            logoPreviewPopup.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
};

/* ---------------------------------------------------
   CUSTOMIZATION MODAL
--------------------------------------------------- */

let customizationData = {
    selectedColor: null,
    selectedColorUrl: null,
    selectedPositions: [],
    currentPositionIndex: 0,
    positionsData: []
};

function openCustomizationModal() {
    const modal = document.getElementById('customizationModal');
    modal.style.display = 'block';
    
    // Reset to step 1
    goToStep(1);
    
    // Render color selection grid
    renderColorSelection();
    
    // Set product info in sidebar
    updateSidebarProductInfo();
}

function closeCustomizationModal() {
    const modal = document.getElementById('customizationModal');
    modal.style.display = 'none';
    
    // Reset customization data
    customizationData = {
        selectedColor: null,
        selectedColorUrl: null,
        selectedPositions: [],
        currentPositionIndex: 0,
        positionsData: []
    };
}

function renderColorSelection() {
    const grid = document.getElementById('colorSelectionGrid');
    grid.innerHTML = '';
    
    colors.forEach(([name, url]) => {
        const circle = document.createElement('div');
        circle.className = 'color-circle';
        circle.style.background = `url('${url}') center/cover`;
        circle.title = name;
        
        circle.onclick = () => {
            // Remove previous selection
            document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
            
            // Select this color
            circle.classList.add('selected');
            customizationData.selectedColor = name;
            customizationData.selectedColorUrl = url;
            
            // Update main image
            mainImage.src = url;
        };
        
        grid.appendChild(circle);
    });
}

function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.cust-step').forEach(step => {
        step.classList.remove('active-step');
    });
    
    // Show selected step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active-step');
    }
    
    // Update step indicators
    document.querySelectorAll('.step-circle').forEach(circle => {
        const circleStep = parseInt(circle.dataset.step);
        if (circleStep === stepNumber) {
            circle.classList.add('active');
        } else {
            circle.classList.remove('active');
        }
    });
}

function validateAndGoToStep3() {
    // Check if at least one position is selected
    const checkedPositions = document.querySelectorAll('input[name="position"]:checked');
    
    if (checkedPositions.length === 0) {
        showValidationError('Please select at least one position');
        return;
    }
    
    // Store selected positions
    customizationData.selectedPositions = Array.from(checkedPositions).map(cb => {
        const card = cb.closest('.position-card');
        return {
            value: cb.value,
            name: cb.nextElementSibling.textContent,
            embroideryPrice: card.dataset.embroidery,
            printPrice: card.dataset.print
        };
    });
    
    customizationData.currentPositionIndex = 0;
    
    // Go to first position customization
    showPositionCustomization(0);
    goToStep(3);
}

function showPositionCustomization(index) {
    const position = customizationData.selectedPositions[index];
    const total = customizationData.selectedPositions.length;
    
    // Update position title
    document.getElementById('positionCounter').textContent = `(${index + 1} of ${total})`;
    document.getElementById('currentPositionName').textContent = position.name;
    
    // Update preview image
    document.getElementById('previewHoodieImage').src = customizationData.selectedColorUrl || mainImage.src;
    document.getElementById('sidebarProductImage').src = customizationData.selectedColorUrl || mainImage.src;
}

function validateAndNextPosition() {
    // Validate customisation name
    const nameInput = document.getElementById('customisationName');
    const nameError = document.getElementById('nameError');
    
    if (!nameInput.value.trim()) {
        nameError.style.display = 'block';
        nameInput.focus();
        return;
    } else {
        nameError.style.display = 'none';
    }
    
    // Store current position data
    const currentPosition = customizationData.selectedPositions[customizationData.currentPositionIndex];
    const positionData = {
        position: currentPosition.value,
        name: nameInput.value.trim(),
        method: document.querySelector('.method-btn.active').dataset.method,
        type: document.querySelector('.type-btn.active').dataset.type
    };
    
    customizationData.positionsData[customizationData.currentPositionIndex] = positionData;
    
    // Check if there are more positions
    if (customizationData.currentPositionIndex < customizationData.selectedPositions.length - 1) {
        customizationData.currentPositionIndex++;
        showPositionCustomization(customizationData.currentPositionIndex);
        
        // Clear form for next position
        nameInput.value = '';
    } else {
        // All positions done, add to basket
        addCustomizedItemToBasket();
    }
}

function goBackFromStep3() {
    goToStep(2);
}

function addCustomizedItemToBasket() {
    // Get quote basket from localStorage
    let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
    
    // Prepare item
    const item = {
        code: PRODUCT_CODE,
        name: PRODUCT_NAME,
        color: customizationData.selectedColor,
        image: customizationData.selectedColorUrl,
        sizes: sizeQuantities,
        price: BASE_PRICE,
        customization: customizationData.positionsData
    };
    
    basket.push(item);
    localStorage.setItem('quoteBasket', JSON.stringify(basket));
    
    // Close modal and redirect to basket
    closeCustomizationModal();
    window.location.href = 'quote-basket.html';
}

function showValidationError(message) {
    const errorModal = document.getElementById('validationError');
    const errorMessage = document.getElementById('validationErrorMessage');
    
    errorMessage.textContent = message;
    errorModal.style.display = 'block';
}

function closeValidationError() {
    document.getElementById('validationError').style.display = 'none';
}

function updateSidebarProductInfo() {
    document.getElementById('sidebarProductName').textContent = PRODUCT_NAME;
    document.getElementById('sidebarProductCode').textContent = 'EE-' + PRODUCT_CODE;
    
    // Update costs based on quantities
    const totalQty = Object.values(sizeQuantities).reduce((sum, qty) => sum + qty, 0);
    const pricePerUnit = getCurrentPriceForQty(totalQty);
    const garmentCost = (totalQty * pricePerUnit).toFixed(2);
    
    document.getElementById('sidebarGarmentCost').textContent = `£${garmentCost} x ${totalQty}`;
    document.getElementById('sidebarTotalCost').textContent = `£${garmentCost}`;
}

// Method and Type button toggles
document.addEventListener('DOMContentLoaded', () => {
    // Method buttons
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide sections based on type
            if (btn.dataset.type === 'logo') {
                document.getElementById('logoUploadSection').style.display = 'block';
                document.getElementById('textInputSection').style.display = 'none';
            } else {
                document.getElementById('logoUploadSection').style.display = 'none';
                document.getElementById('textInputSection').style.display = 'block';
            }
        });
    });
    
    // Upload tabs
    document.querySelectorAll('.upload-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
    
    // Dropzone click
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('positionLogoInput');
    
    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    document.getElementById('logoPreviewImage').src = event.target.result;
                    document.getElementById('uploadArea').style.display = 'none';
                    document.getElementById('logoPreviewArea').style.display = 'block';
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Position checkboxes
    document.querySelectorAll('.position-card').forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        
        card.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            
            if (checkbox.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    });
});

/* ---------------------------------------------------
   TOAST NOTIFICATION
--------------------------------------------------- */

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide and remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
