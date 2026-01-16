/* ===================================
   PRODUCT DETAIL - COMPLETE REWRITE
   =================================== */

// Product data loaded dynamically from API
let PRODUCT_CODE = "";
let PRODUCT_NAME = "";
let BASE_PRICE = 0;

// Colors loaded dynamically from API
let colors = [];

const DISCOUNTS = [
    { min: 1,   max: 9,     price: BASE_PRICE, save: 0  },
    { min: 10,  max: 24,    price: 16.54,      save: 8  },
    { min: 25,  max: 49,    price: 16.18,      save: 10 },
    { min: 50,  max: 99,    price: 14.94,      save: 15 },
    { min: 100, max: 249,   price: 13.49,      save: 25 },
    { min: 250, max: 99999, price: 12.59,      save: 30 }
];

// STATE
let selectedColorName = colors[0][0];
let selectedColorURL  = colors[0][1];
let selectedCustomizationMethod = null; // 'embroidery' or 'print'
const sizeList = ["S","M","L","XL","2XL","3XL","4XL","5XL"];
let qty = {};
sizeList.forEach(s => qty[s] = 0);

// ELEMENTS
const mainImage = document.getElementById("mainImage");
const mainPriceEl = document.getElementById("mainPrice");
const priceInfoEl = document.getElementById("priceInfo");
const quoteButton = document.getElementById("quoteButton");
const belowSummary = document.getElementById("belowBtnSummary");
const sizesGrid = document.getElementById("sizesGrid");
const colorGrid = document.getElementById("colorGrid");

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    loadSavedColorSelection();
    buildColorGrid();
    renderSizes();
    updateTotals();
});

// ===== LOAD SAVED COLOR =====
function loadSavedColorSelection() {
    const savedColorName = sessionStorage.getItem('selectedColorName');
    const savedColorUrl = sessionStorage.getItem('selectedColorUrl');
    
    if (savedColorName && savedColorUrl) {
        selectedColorName = savedColorName;
        selectedColorURL = savedColorUrl;
        mainImage.src = savedColorUrl;
    }
}

// ===== BUILD COLOR GRID =====
function buildColorGrid() {
    colorGrid.innerHTML = '';
    
    colors.forEach(([name, url], i) => {
        const div = document.createElement("div");
        div.className = "color-thumb";
        div.style.backgroundImage = `url('${url}')`;
        
        // Mark as active if it's the saved color
        if (name === selectedColorName) {
            div.classList.add("active");
        } else if (i === 0 && !sessionStorage.getItem('selectedColorName')) {
            div.classList.add("active");
        }
        
        div.onclick = () => {
            document.querySelectorAll(".color-thumb").forEach(c => c.classList.remove("active"));
            div.classList.add("active");
            
            selectedColorName = name;
            selectedColorURL  = url;
            mainImage.src = url;
            
            // Save to sessionStorage
            sessionStorage.setItem('selectedColorName', name);
            sessionStorage.setItem('selectedColorUrl', url);
            
            resetSizes();
            updateTotals();
        };
        
        colorGrid.appendChild(div);
    });
}

// ===== SIZES =====
function renderSizes() {
    sizesGrid.innerHTML = "";
    
    sizeList.forEach(size => {
        const box = document.createElement("div");
        box.className = "size-box";
        
        box.innerHTML = `
            <div class="size-label">${size}</div>
            <div class="qty-wrapper">
                <button class="qty-btn minus" data-size="${size}">−</button>
                <input 
                    type="number"
                    class="qty-input"
                    data-size="${size}"
                    min="0"
                    value="${qty[size]}"
                >
                <button class="qty-btn plus" data-size="${size}">+</button>
            </div>
        `;
        
        sizesGrid.appendChild(box);
    });
    
    attachSizeEvents();
}

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

// ===== PRICING =====
function getUnitPrice(totalItems) {
    if (totalItems === 0) return BASE_PRICE;
    const tier = DISCOUNTS.find(t => totalItems >= t.min && totalItems <= t.max);
    return tier ? tier.price : BASE_PRICE;
}

function getCurrentTier(totalItems) {
    if (totalItems === 0) return DISCOUNTS[0];
    return DISCOUNTS.find(t => totalItems >= t.min && totalItems <= t.max) || DISCOUNTS[0];
}

function updateDiscountBox(total) {
    const boxes = document.querySelectorAll(".disc-box");
    boxes.forEach(b => b.classList.remove("active"));
    
    let appliedIndex = 0;
    DISCOUNTS.forEach((tier,i)=>{
        if(total >= tier.min && total <= tier.max) appliedIndex = i;
    });
    
    boxes[appliedIndex]?.classList.add("active");
}

function updateTotals() {
    const total = Object.values(qty).reduce((a,b)=>a+b,0);
    
    updateDiscountBox(total);
    
    const unit = getUnitPrice(total);
    
    mainPriceEl.innerHTML = `£${unit.toFixed(2)} <span>each ex VAT</span>`;
    
    const tier = getCurrentTier(total);
    if (total === 0) {
        priceInfoEl.innerHTML = "Price listed for 1–9 units";
    } else {
        priceInfoEl.innerHTML =
            `<b>Bulk price applied:</b> £${tier.price.toFixed(2)} ex VAT (${tier.min}+ units)`;
    }
    
    quoteButton.disabled = total === 0;
    quoteButton.textContent = `Add ${total} Items to Quote`;
    
    if (total > 0) quoteButton.classList.add("active");
    else quoteButton.classList.remove("active");
    
    updateBelowSummary(total, unit);
}

function updateBelowSummary(total, unit) {
    if (total === 0) {
        belowSummary.innerHTML = "";
        return;
    }
    
    belowSummary.innerHTML = `
        <div class="left-part">
            <b>${total} items</b><br>
            £${unit.toFixed(2)} per item
        </div>
        <div class="right-part">
            Total: <span class="total-amount">£${(unit * total).toFixed(2)}</span> ex VAT
        </div>
    `;
}

// ===== NAVIGATE TO CUSTOMIZATION =====
quoteButton.onclick = () => {
    const total = Object.values(qty).reduce((a,b)=>a+b,0);
    if (total === 0) return;
    
    // Save product data
    const productData = {
        name: PRODUCT_NAME,
        code: PRODUCT_CODE,
        color: selectedColorName,
        image: selectedColorURL,
        quantity: total,
        size: getSizesSummary(),
        price: getUnitPrice(total).toFixed(2),
        sizes: {...qty}
    };
    
    sessionStorage.setItem('customizingProduct', JSON.stringify(productData));
    
    // Navigate to positions
    window.location.href = 'customize-positions.html';
};

function getSizesSummary() {
    const sizeEntries = Object.entries(qty).filter(([s,q]) => q > 0);
    if (sizeEntries.length === 1) {
        return sizeEntries[0][0];
    }
    return sizeEntries.map(([s,q]) => `${q}x${s}`).join(', ');
}
