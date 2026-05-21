/* ---------------------------------------------------
   CONFIG
--------------------------------------------------- */
console.log('[product.js] v20260411B loaded — NO auto-save, loading overlay enabled');

// Product data will be loaded from API or sessionStorage
let PRODUCT_CODE = null;
let PRODUCT_NAME = null;
let BASE_PRICE = null;
let PRODUCT_DATA = null;
let DISCOUNTS = [];
let ORIGINAL_DISCOUNTS = []; // Store original price breaks for recalculation
let SIZE_PRICE_MAP = {}; // Map of size → sell_price from variants
let ORIGINAL_BASE_PRICE = null; // Original base sell_price before size adjustment
let recommendationsController = null;

// Expose PRODUCT_DATA globally for other scripts
Object.defineProperty(window, 'PRODUCT_DATA', {
    get: function () { return PRODUCT_DATA; },
    set: function (val) { PRODUCT_DATA = val; }
});

// Expose PRODUCT_NAME and PRODUCT_CODE globally for other scripts
Object.defineProperty(window, 'PRODUCT_NAME', {
    get: function () { return PRODUCT_NAME; },
    configurable: true
});
Object.defineProperty(window, 'PRODUCT_CODE', {
    get: function () { return PRODUCT_CODE; },
    configurable: true
});

// API Configuration
function getApiBaseUrl() {
    return window.BrandedProductRecommendations?.resolveApiBaseUrl?.() || 'https://api.brandeduk.com/api';
}

const VAT_STORAGE_KEY = 'brandeduk-vat-mode';
const VAT_FALLBACK_RATE = 0.20;

function getVatApi() {
    return window.brandedukv15 && window.brandedukv15.vat;
}

function fallbackVatOn() {
    try {
        return window.localStorage && window.localStorage.getItem(VAT_STORAGE_KEY) === 'on';
    } catch (error) {
        return false;
    }
}

function isVatOn() {
    var vat = getVatApi();
    return vat ? vat.isOn() : fallbackVatOn();
}

function vatRate() {
    var vat = getVatApi();
    return vat && typeof vat.rate === 'number' ? vat.rate : VAT_FALLBACK_RATE;
}

function formatCurrency(baseAmount, options) {
    options = options || {};
    var currency = options.currency || '\u00A3';
    var decimals = Number.isFinite(options.decimals) ? options.decimals : 2;
    var includeVat = options.includeVat !== false;
    var value = Number(baseAmount) || 0;

    if (includeVat && isVatOn()) {
        value = value * (1 + vatRate());
    }

    return currency + value.toFixed(decimals);
}

function vatSuffix() {
    var vat = getVatApi();
    return vat && typeof vat.suffix === 'function'
        ? vat.suffix()
        : (isVatOn() ? 'inc VAT' : 'ex VAT');
}

function vatAmount(baseAmount) {
    if (!isVatOn()) {
        return 0;
    }
    return (Number(baseAmount) || 0) * vatRate();
}

function normalizeBrandKey(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/\+/g, ' ')
        .replace(/-/g, ' ')
        .replace(/[^a-z0-9& ]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function inferBrandFromProductName(name) {
    const text = normalizeBrandKey(name);
    if (!text) return '';

    const knownBrands = {
        'anthem': 'Anthem',
        'gildan': 'Gildan',
        'fruit of the loom': 'Fruit of the Loom',
        'awdis': 'AWDis',
        'result': 'Result',
        'regatta': 'Regatta',
        'portwest': 'Portwest',
        'russell': 'Russell',
        'premier': 'Premier',
        'yoko': 'Yoko',
        'tridri': 'TriDri'
    };

    for (const key of Object.keys(knownBrands)) {
        if (text.startsWith(key + ' ') || text === key || text.includes(' ' + key + ' ')) {
            return knownBrands[key];
        }
    }

    return '';
}

function resolveBrandLogoPath(brandName) {
    const logos = {
        'anthem': 'brandedukv15-child/assets/images/brands/anthem.jpg',
        'gildan': 'brandedukv15-child/assets/images/brands/gildan2020.webp',
        'fruit of the loom': 'brandedukv15-child/assets/images/brands/fruit-of-the-loom.jpg',
        'awdis': 'brandedukv15-child/assets/images/brands/awdis.webp',
        'result': 'brandedukv15-child/assets/images/brands/result2020.webp',
        'regatta': 'brandedukv15-child/assets/images/brands/regatta.webp',
        'portwest': 'brandedukv15-child/assets/images/brands/portwest.webp',
        'premier': 'brandedukv15-child/assets/images/brands/premier2020.webp',
        'russell': 'brandedukv15-child/assets/images/brands/russell.webp',
        'yoko': 'brandedukv15-child/assets/images/brands/yoko.webp',
        'tridri': 'brandedukv15-child/assets/images/brands/tridri.webp'
    };

    const normalized = normalizeBrandKey(brandName);
    if (!normalized) return '';
    if (logos[normalized]) return logos[normalized];

    for (const key of Object.keys(logos)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return logos[key];
        }
    }

    return '';
}

// Update all pricing displays when VAT changes
function updateAllPricing() {
    // Update main price â€” show lowest tier price with "START FROM"
    const mainPriceEl = document.getElementById('mainPrice');
    if (mainPriceEl && DISCOUNTS && DISCOUNTS.length > 0) {
        // Find the lowest price across all tiers
        const lowestTier = DISCOUNTS.reduce((min, t) => t.price < min.price ? t : min, DISCOUNTS[0]);
        const priceValue = formatCurrency(lowestTier.price);
        const suffix = ' <span>' + vatSuffix() + '</span>';
        mainPriceEl.innerHTML = '<span class="start-from-label">From</span> ' + priceValue + suffix;
    }

    // Update discount boxes (old class .disc-box)
    const discountBoxes = document.querySelectorAll('.disc-box');
    discountBoxes.forEach(box => {
        const basePrice = parseFloat(box.dataset.basePrice);
        if (!isNaN(basePrice)) {
            const priceEl = box.querySelector('.price');
            if (priceEl) {
                priceEl.textContent = formatCurrency(basePrice);
            }
        }
    });

    // Update tier pricing boxes (new class .tier-item)
    const tierItems = document.querySelectorAll('.tier-item');
    tierItems.forEach(item => {
        const basePrice = parseFloat(item.dataset.basePrice);
        if (!isNaN(basePrice)) {
            const priceEl = item.querySelector('.tier-price');
            if (priceEl) {
                priceEl.textContent = formatCurrency(basePrice);
            }
        }
    });

    // Trigger refresh of any basket/summary displays
    if (typeof updateTotals === 'function') {
        updateTotals();
    }
}

// Listen for VAT toggle changes
document.addEventListener('brandeduk:vat-change', function (event) {
    console.log('ðŸ’° VAT changed, updating prices. isVatOn():', isVatOn(), 'suffix:', vatSuffix());
    updateAllPricing();
    updateBasketTotalBox(); // Refresh basket box on VAT change
    recommendationsController?.refreshPricing?.();
});

function getProductCodeFromLocation() {
    // Prefer query string for backwards compatibility
    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('code');
        if (fromQuery) return fromQuery;
    } catch (e) {
        // ignore
    }

    // Fallback to path segment: /product/TL560 or /product/TL560/
    try {
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts[0] === 'product' && parts[1]) {
            return decodeURIComponent(parts[1]);
        }
    } catch (e) {
        // ignore
    }

    return null;
}

// ===== LOAD PRODUCT DATA =====
async function loadProductData() {
    // Try to get product code from URL (query or path) first, then sessionStorage
    const urlProductCode = getProductCodeFromLocation();
    const savedProductCode = sessionStorage.getItem('selectedProduct');

    // URL takes priority, then sessionStorage
    const productCode = urlProductCode || savedProductCode;

    // If we got code from URL, save it to sessionStorage for consistency
    if (urlProductCode && urlProductCode !== savedProductCode) {
        sessionStorage.setItem('selectedProduct', urlProductCode);
    }

    let productData = null;

    // Fetch from BOTH endpoints: detail (/products/CODE) for full data (colors, sizes, description)
    // and listing (/products?q=CODE) for correct/up-to-date pricing.
    // The listing endpoint often has fresher sell prices than the detail endpoint.
    if (productCode) {
        console.log('Fetching product from API...', productCode);
        try {
            // Fetch detail and listing in parallel
            const [detailRes, listingRes] = await Promise.allSettled([
                fetch(`${getApiBaseUrl()}/products/${productCode}`),
                fetch(`${getApiBaseUrl()}/products?q=${encodeURIComponent(productCode)}&limit=1`)
            ]);

            // Process detail endpoint (full product data)
            if (detailRes.status === 'fulfilled' && detailRes.value.ok) {
                productData = await detailRes.value.json();
                console.log('âœ… Loaded product from detail API:', productData);
            }

            // Process listing endpoint (accurate pricing)
            let listingProduct = null;
            if (listingRes.status === 'fulfilled' && listingRes.value.ok) {
                const listingData = await listingRes.value.json();
                const items = listingData.items || listingData.products || [];
                listingProduct = items.find(p => p.code === productCode) || items[0] || null;
                if (listingProduct) {
                    console.log('âœ… Listing price data:', {
                        price: listingProduct.price,
                        breaks: listingProduct.priceBreaks?.length || 0
                    });
                }
            }

            // Merge: use listing prices if available (they are more up-to-date)
            if (productData && listingProduct) {
                const detailPrice = Number(productData.price) || 0;
                const listingPrice = Number(listingProduct.price) || 0;
                if (listingPrice > 0 && listingPrice !== detailPrice) {
                    console.log(`ðŸ’° Price correction: detail \u00A3${detailPrice} â†’ listing \u00A3${listingPrice}`);
                    productData.price = listingProduct.price;
                    productData.basePrice = listingProduct.price;
                    productData.sell_price = listingProduct.price;
                }
                if (listingProduct.priceBreaks && listingProduct.priceBreaks.length > 0) {
                    productData.priceBreaks = listingProduct.priceBreaks;
                }
            } else if (!productData && listingProduct) {
                // Detail failed, use listing data entirely
                productData = listingProduct;
                console.warn('âš ï¸ Using listing data (detail endpoint failed)');
            }

            if (productData) {
                sessionStorage.setItem('selectedProductData', JSON.stringify(productData));
            } else {
                // Both failed â€” try sessionStorage cache
                const savedProductData = sessionStorage.getItem('selectedProductData');
                if (savedProductData) {
                    try {
                        productData = JSON.parse(savedProductData);
                        console.warn('âš ï¸ Using cached data (both endpoints failed)');
                    } catch (e) {
                        console.warn('Failed to parse saved product data:', e);
                    }
                }
            }
        } catch (error) {
            console.error('âŒ Failed to fetch product from API:', error);
            const savedProductData = sessionStorage.getItem('selectedProductData');
            if (savedProductData) {
                try {
                    productData = JSON.parse(savedProductData);
                    console.warn('âš ï¸ Using cached data due to API error');
                } catch (e) {
                    console.warn('Failed to parse saved product data:', e);
                }
            }
        }
    }

    if (!productData) {
        console.error('âŒ No product data available!');
        // No blocking alert â€“ redirect to homepage so user isn't stuck
        window.location.replace('index.html');
        return false;
    }

    // Initialize product variables
    PRODUCT_DATA = productData;
    PRODUCT_CODE = productData.code;
    PRODUCT_NAME = productData.name;

    // Update URL with product code so the link is shareable
    if (PRODUCT_CODE) {
        const url = new URL(window.location);
        if (url.searchParams.get('code') !== PRODUCT_CODE) {
            url.searchParams.set('code', PRODUCT_CODE);
            history.replaceState(null, '', url);
        }
    }

    // Dispatch event so other scripts know product data is ready
    window.dispatchEvent(new CustomEvent('productDataLoaded', { detail: productData }));

    // Convert priceBreaks to DISCOUNTS format - use API percentage directly
    if (productData.priceBreaks && productData.priceBreaks.length > 0) {
        DISCOUNTS = productData.priceBreaks.map((breakItem, index) => {
            return {
                min: breakItem.min,
                max: breakItem.max,
                price: breakItem.price,
                save: breakItem.percentage || 0
            };
        });

        // Set BASE_PRICE to the first tier's price (1-9 tier) so main price matches
        BASE_PRICE = DISCOUNTS[0].price;
        ORIGINAL_BASE_PRICE = BASE_PRICE;
        ORIGINAL_DISCOUNTS = DISCOUNTS.map(d => ({ ...d }));
    } else {
        // Fallback: single price tier
        BASE_PRICE = productData.price;
        ORIGINAL_BASE_PRICE = BASE_PRICE;
        DISCOUNTS = [{ min: 1, max: 99999, price: BASE_PRICE, save: 0 }];
        ORIGINAL_DISCOUNTS = DISCOUNTS.map(d => ({ ...d }));
    }

    // Build SIZE_PRICE_MAP from variants if available
    if (productData.variants && productData.variants.length > 0) {
        buildSizePriceMap(productData.variants);
    }

    // Log available fields for debugging
    console.log('ðŸ“‹ Available product fields:', Object.keys(productData));

    console.log('âœ… Product initialized:', {
        code: PRODUCT_CODE,
        name: PRODUCT_NAME,
        price: BASE_PRICE,
        discounts: DISCOUNTS
    });

    return true;
}

// Initialize tier pricing from API data
function initTierPricing() {
    const tierPricingContainer = document.getElementById('tierPricingContainer');
    if (!tierPricingContainer || !DISCOUNTS || DISCOUNTS.length === 0) {
        return;
    }

    // Clear existing tier items
    tierPricingContainer.innerHTML = '';

    // Create tier items from DISCOUNTS array
    DISCOUNTS.forEach((tier, index) => {
        const tierItem = document.createElement('div');
        tierItem.className = 'tier-item';
        tierItem.setAttribute('data-min', tier.min);
        tierItem.setAttribute('data-max', tier.max);
        tierItem.setAttribute('data-base-price', tier.price);

        // Format quantity range
        // First tier shows range (e.g., "1-9"), all others show min+ (e.g., "10+", "25+")
        let qtyText = '';
        if (index === 0 && tier.max < 99999) {
            // First tier: show full range
            qtyText = `${tier.min}-${tier.max}`;
        } else {
            // All other tiers: show min+
            qtyText = `${tier.min}+`;
        }

        // Use save percentage directly from API priceBreaks data
        const savePercent = tier.save || 0;

        // Use formatCurrency to respect VAT toggle state
        const formattedPrice = formatCurrency(tier.price);

        tierItem.innerHTML = `
            <span class="tier-qty">${qtyText}</span>
            <span class="tier-price">${formattedPrice}</span>
            ${savePercent > 0 ? `<span class="tier-save">-${savePercent}%</span>` : ''}
        `;

        tierPricingContainer.appendChild(tierItem);
    });
}

// Build size→sell_price map from variants, optionally filtered by color
function buildSizePriceMap(variants, colorName) {
    SIZE_PRICE_MAP = {};
    if (!variants || variants.length === 0) return;

    const filtered = colorName
        ? variants.filter(v => v.color === colorName)
        : variants;

    // Use first occurrence per size (all same-color variants of a size should have same price)
    filtered.forEach(v => {
        if (v.size && v.sell_price && !SIZE_PRICE_MAP[v.size]) {
            SIZE_PRICE_MAP[v.size] = v.sell_price;
        }
    });

    // Check if there are actually different prices across sizes
    const uniquePrices = [...new Set(Object.values(SIZE_PRICE_MAP))];
    if (uniquePrices.length <= 1) {
        SIZE_PRICE_MAP = {}; // No size-based pricing differences
    } else {
        console.log('📊 Size-based pricing detected:', SIZE_PRICE_MAP);
    }
}

// Recalculate DISCOUNTS and tier pricing based on a new base sell_price
function recalculateTierPricing(newBaseSellPrice) {
    if (!ORIGINAL_DISCOUNTS || ORIGINAL_DISCOUNTS.length === 0 || !ORIGINAL_BASE_PRICE) return;

    DISCOUNTS = ORIGINAL_DISCOUNTS.map(orig => ({
        min: orig.min,
        max: orig.max,
        price: Math.round(newBaseSellPrice * (1 - (orig.save || 0) / 100) * 100) / 100,
        save: orig.save
    }));

    BASE_PRICE = DISCOUNTS[0].price;
    initTierPricing();
}

// Restore original tier pricing (when no special sizes selected)
function restoreOriginalTierPricing() {
    if (!ORIGINAL_DISCOUNTS || ORIGINAL_DISCOUNTS.length === 0) return;
    DISCOUNTS = ORIGINAL_DISCOUNTS.map(d => ({ ...d }));
    BASE_PRICE = ORIGINAL_BASE_PRICE;
    initTierPricing();
}

// Populate product specs table (Fabric, Weight, Size, Key Info)
function populateProductSpecsTable() {
    const specsEl = document.getElementById('productSpecsTable');
    if (!specsEl || !PRODUCT_DATA) return;

    const details = PRODUCT_DATA.details || {};
    const sizes = PRODUCT_DATA.sizes;
    const rows = [];

    if (details.fabric) {
        rows.push({ label: 'Fabric', value: details.fabric });
    }
    if (details.weight) {
        rows.push({ label: 'Weight', value: details.weight });
    }
    if (sizes && Array.isArray(sizes) && sizes.length > 0) {
        rows.push({ label: 'Size', value: sizes.join(', ') });
    }
    if (details.fit) {
        rows.push({ label: 'Fit', value: details.fit });
    }
    if (details.care) {
        rows.push({ label: 'Care', value: details.care });
    }

    if (rows.length === 0) return;

    let html = '<table>';
    rows.forEach(r => {
        html += `<tr><td class="spec-label">${r.label}</td><td class="spec-value">${r.value}</td></tr>`;
    });
    html += '</table>';

    specsEl.innerHTML = html;
    specsEl.style.display = '';
}

/** Mobile/tablet: scroll to colour + sizes (above recommendations after layout fix). */
function scrollTouchProductPageToBuySection() {
    if (!window.matchMedia('(max-width: 1366px)').matches) return;

    const run = function () {
        const target = document.querySelector('.right-column .tier-pricing-compact') ||
            document.getElementById('colorGrid') ||
            document.querySelector('.right-column .rala-cta-row') ||
            document.querySelector('.right-column');
        if (!target) return;

        const topBar = document.querySelector('.tablet-top-bar') || document.querySelector('.searchbar-header');
        const headerReserve = Math.max(8, (topBar ? topBar.getBoundingClientRect().bottom : 0) + 8);
        const y = window.scrollY + target.getBoundingClientRect().top - headerReserve;
        window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'smooth' });
    };

    requestAnimationFrame(function () {
        requestAnimationFrame(run);
    });
    setTimeout(run, 350);
}

function initProductRecommendationsSection() {
    const root = document.getElementById('productRecommendations');

    if (!root || !PRODUCT_CODE || !window.BrandedProductRecommendations) {
        return;
    }

    recommendationsController = window.BrandedProductRecommendations.init(root, {
        productCode: PRODUCT_CODE,
        pageType: 'desktop',
        priceFormatter: function (basePrice) {
            return 'From ' + formatCurrency(basePrice);
        },
        priceNoteFormatter: function () {
            return vatSuffix();
        },
        onSelect: function (product) {
            try {
                sessionStorage.setItem('selectedProduct', product.code || '');
                sessionStorage.setItem('selectedProductData', JSON.stringify({
                    code: product.code || '',
                    name: product.name || '',
                    price: product.price || 0,
                    image: product.image || '',
                    brand: product.brand || '',
                    productType: product.productType || ''
                }));
                sessionStorage.removeItem('selectedColorName');
                sessionStorage.removeItem('selectedColorUrl');
            } catch (error) {
                console.warn('Failed to persist recommendation selection:', error);
            }
        }
    });
}

// Initialize breadcrumb navigation from API data
function initBreadcrumb() {
        function sanitizeProductLabel(value) {
            return String(value || '')
                .replace(/[\uFFFD\uFFFC]/g, ' ')
                .replace(/[®™©]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

    const breadcrumbBrandLink = document.getElementById('breadcrumbBrandLink');
    const breadcrumbProduct = document.getElementById('breadcrumbProduct');
    const breadcrumbCode = document.getElementById('breadcrumbCode');

    if (!breadcrumbBrandLink || !breadcrumbProduct) {
        return;
    }

    const brandName = PRODUCT_DATA?.brand || '';

    if (brandName) {
        breadcrumbBrandLink.href = `shop-pc.html?brand=${encodeURIComponent(brandName)}`;
        breadcrumbBrandLink.textContent = brandName;
    } else {
        breadcrumbBrandLink.href = 'shop-pc.html';
        breadcrumbBrandLink.textContent = 'Brand';
    }

    // Update product name from API data
    if (PRODUCT_DATA && PRODUCT_DATA.name) {
        breadcrumbProduct.textContent = sanitizeProductLabel(PRODUCT_DATA.name);
    } else if (PRODUCT_NAME) {
        // Fallback to PRODUCT_NAME if PRODUCT_DATA.name is not available
        breadcrumbProduct.textContent = sanitizeProductLabel(PRODUCT_NAME);
    }

    if (breadcrumbCode) {
        breadcrumbCode.textContent = (PRODUCT_DATA && PRODUCT_DATA.code) || PRODUCT_CODE || 'Code';
    }
}

// Initialize product data and then update page
document.addEventListener('DOMContentLoaded', async function () {
    // Clear stale customize state so each customize session starts fresh
    sessionStorage.removeItem('customizingBasketIndex');
    sessionStorage.removeItem('returnAfterCustomize');
    sessionStorage.removeItem('customizingProduct');
    sessionStorage.removeItem('selectedPositions');
    sessionStorage.removeItem('positionCustomizations');
    sessionStorage.removeItem('brandeduk-customize-state');
    sessionStorage.removeItem('editingPosition');

    const loaded = await loadProductData();
    if (loaded) {
        // Update page title
        if (PRODUCT_NAME) {
            const safeProductName = String(PRODUCT_NAME)
                .replace(/[\uFFFD\uFFFC]/g, ' ')
                .replace(/[®™©]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            document.title = `${safeProductName} - Branded UK`;
        }

        // Update product name and code in the page (if elements exist)
        // Use ID selector first to avoid conflicts with productTypeTitle h1
        const productNameEl = document.getElementById('productTitle');
        if (productNameEl && PRODUCT_NAME) {
            productNameEl.textContent = String(PRODUCT_NAME)
                .replace(/[\uFFFD\uFFFC]/g, ' ')
                .replace(/[®™©]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            console.log('âœ… Product name updated:', PRODUCT_NAME, 'in element:', productNameEl);
        } else if (!productNameEl) {
            console.warn('âš ï¸ Product name element (#productTitle) not found');
        } else if (!PRODUCT_NAME) {
            console.warn('âš ï¸ PRODUCT_NAME is missing. Product data:', PRODUCT_DATA);
        }

        // Update garment-main-title (main product title above price tier)
        const garmentMainTitle = document.querySelector('.garment-main-title');
        if (garmentMainTitle && PRODUCT_DATA && PRODUCT_DATA.name) {
            garmentMainTitle.textContent = String(PRODUCT_DATA.name)
                .replace(/[\uFFFD\uFFFC]/g, ' ')
                .replace(/[®™©]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            console.log('âœ… Garment main title updated:', PRODUCT_DATA.name);
        } else if (!garmentMainTitle) {
            console.warn('âš ï¸ Garment main title element (.garment-main-title) not found');
        }

        const productCodeEl = document.querySelector('.product-code, [data-product-code], .prod-code-value');
        if (productCodeEl && PRODUCT_CODE) {
            productCodeEl.textContent = PRODUCT_CODE;
        }

        // Update description box title (h2)
        const descTitleEl = document.getElementById('productDescriptionTitle') || document.querySelector('.description-box h2');
        if (descTitleEl && PRODUCT_NAME) {
            descTitleEl.textContent = String(PRODUCT_NAME)
                .replace(/[\uFFFD\uFFFC]/g, ' ')
                .replace(/[®™©]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        // Update description text
        const descTextEl = document.getElementById('productDescriptionText');
        if (descTextEl && PRODUCT_DATA && PRODUCT_DATA.description) {
            descTextEl.innerHTML = PRODUCT_DATA.description;
        }

        // Update sidebar product name and code
        const sidebarProductName = document.getElementById('sidebarProductName');
        if (sidebarProductName && PRODUCT_NAME) {
            sidebarProductName.textContent = PRODUCT_NAME;
        }

        const sidebarProductCode = document.getElementById('sidebarProductCode');
        if (sidebarProductCode && PRODUCT_CODE) {
            sidebarProductCode.textContent = 'EE-' + PRODUCT_CODE;
        }

        // Update brand logo and link
        if (PRODUCT_DATA && PRODUCT_DATA.brand) {
            const brandLink = document.getElementById('brandLink');
            const brandLogo = document.getElementById('brandLogo');
            if (brandLink && brandLogo) {
                const inferredBrand = inferBrandFromProductName(PRODUCT_DATA.name || '');
                const displayBrand = inferredBrand || PRODUCT_DATA.brand;
                const mappedBrandLogo = resolveBrandLogoPath(displayBrand);

                brandLink.href = `shop-pc.html?brand=${encodeURIComponent(displayBrand)}`;
                brandLink.title = `View all ${displayBrand} products`;
                brandLogo.alt = displayBrand;
                brandLogo.src = mappedBrandLogo || PRODUCT_DATA.brandLogo || '';
                brandLink.style.display = 'block';
            }
        }

        // Populate manufacturer code (supplierRef from API)
        if (PRODUCT_DATA) {
            var mfrCode = PRODUCT_DATA.manufacturerCode || PRODUCT_DATA.supplierCode || PRODUCT_DATA.supplierRef || '';
            if (mfrCode) {
                var mfrLine = document.getElementById('manufacturerCodeLine');
                var mfrVal = document.getElementById('manufacturerCodeValue');
                if (mfrLine && mfrVal) {
                    mfrVal.textContent = mfrCode;
                    mfrLine.style.display = '';
                }
            }
        }

        // Populate Key Info (description) in right column
        if (PRODUCT_DATA && PRODUCT_DATA.description) {
            var keyInfoEl = document.getElementById('ralaKeyInfo');
            var keyInfoText = document.getElementById('ralaKeyInfoText');
            var readMoreBtn = document.getElementById('ralaReadMoreBtn');
            if (keyInfoEl && keyInfoText) {
                keyInfoText.innerHTML = PRODUCT_DATA.description;
                keyInfoEl.style.display = '';
                requestAnimationFrame(function() {
                    if (keyInfoText.scrollHeight > 104) {
                        keyInfoText.classList.add('rala-key-info__text--clamped');
                        if (readMoreBtn) readMoreBtn.style.display = '';
                    }
                });
            }
        }

        // Update customization badges from API
        if (PRODUCT_DATA && PRODUCT_DATA.customization && Array.isArray(PRODUCT_DATA.customization)) {
            const customizationBadge = document.getElementById('customizationBadge');
            if (customizationBadge) {
                customizationBadge.innerHTML = '';
                PRODUCT_DATA.customization.forEach(customType => {
                    const badge = document.createElement('span');
                    badge.className = `cust-badge ${customType}`;
                    badge.textContent = customType.toUpperCase();
                    customizationBadge.appendChild(badge);
                });
            }
        }

        // Update product type title - check multiple possible field names
        const productTypeTitle = document.getElementById('productTypeTitle');

        if (productTypeTitle) {
            // Try productType first, then category, then try to extract from name
            let productType = PRODUCT_DATA?.productType ||
                PRODUCT_DATA?.category ||
                PRODUCT_DATA?.ProductType ||
                PRODUCT_DATA?.Category;

            // If still empty, try to extract from product name (e.g., "Colours bib apron" -> "Aprons")
            if (!productType || productType.trim() === '') {
                const name = PRODUCT_DATA?.name || '';
                // Check if name contains common product types
                const productTypeKeywords = {
                    'apron': 'Aprons',
                    'hoodie': 'Hoodies',
                    't-shirt': 'T-Shirts',
                    'tshirt': 'T-Shirts',
                    'polo': 'Polo Shirts',
                    'jacket': 'Jackets',
                    'trouser': 'Trousers',
                    'fleece': 'Fleeces',
                    'cap': 'Caps',
                    'beanie': 'Beanies'
                };

                const nameLower = name.toLowerCase();
                for (const [keyword, type] of Object.entries(productTypeKeywords)) {
                    if (nameLower.includes(keyword)) {
                        productType = type;
                        break;
                    }
                }
            }

            if (productType && productType.trim() !== '') {
                productTypeTitle.textContent = productType;
                productTypeTitle.style.display = 'block';
                console.log('âœ… Product type title updated:', productType);
            } else {
                console.log('â„¹ï¸ No productType/category found. Available fields:', Object.keys(PRODUCT_DATA || {}));
                console.log('â„¹ï¸ Product name:', PRODUCT_DATA?.name);
                productTypeTitle.style.display = 'none';
            }
        } else {
            console.warn('âš ï¸ Product type title element not found');
        }

        // Set initial main image - ALWAYS prioritize PRODUCT_DATA.image (API primary image)
        if (mainImage && PRODUCT_DATA) {
            if (PRODUCT_DATA.image) {
                // ALWAYS use the top-level API image as the initial display image
                mainImage.src = PRODUCT_DATA.image;
                mainImage.alt = PRODUCT_NAME || 'Product';
            } else if (PRODUCT_DATA.images && Array.isArray(PRODUCT_DATA.images)) {
                const mainImageData = PRODUCT_DATA.images.find(img => img.type === 'main');
                if (mainImageData && mainImageData.url) {
                    mainImage.src = mainImageData.url;
                    mainImage.alt = PRODUCT_NAME || 'Product';
                } else if (PRODUCT_DATA.colors && PRODUCT_DATA.colors.length > 0) {
                    mainImage.src = PRODUCT_DATA.colors[0].main;
                    mainImage.alt = PRODUCT_NAME || 'Product';
                }
            } else if (PRODUCT_DATA.colors && PRODUCT_DATA.colors.length > 0) {
                // Final fallback to first color's main image
                mainImage.src = PRODUCT_DATA.colors[0].main;
                mainImage.alt = PRODUCT_NAME || 'Product';
            }
        }

        // Update description if available (already handled above, but keeping for backward compatibility)
        if (PRODUCT_DATA && PRODUCT_DATA.description) {
            const descTextEl = document.getElementById('productDescriptionText');
            if (descTextEl) {
                descTextEl.innerHTML = PRODUCT_DATA.description;
            } else {
                // Fallback for old structure
                const descEl = document.querySelector('.description-box');
                if (descEl) {
                    let descText = descEl.querySelector('p');
                    if (!descText) {
                        descText = document.createElement('p');
                        descEl.appendChild(descText);
                    }
                    descText.innerHTML = PRODUCT_DATA.description;
                }
            }
        }

        // Update product details (fabric, fit, weight, care)
        if (PRODUCT_DATA && PRODUCT_DATA.details) {
            const details = PRODUCT_DATA.details;
            const detailsHTML = [];

            if (details.fabric) detailsHTML.push(`<b>Fabric:</b> ${details.fabric}`);
            if (details.weight) detailsHTML.push(`<b>Weight:</b> ${details.weight}`);
            if (details.fit) detailsHTML.push(`<b>Fit:</b> ${details.fit}`);
            if (details.care) detailsHTML.push(`<b>Care:</b> ${details.care}`);

            if (detailsHTML.length > 0) {
                const descTextEl = document.getElementById('productDescriptionText');
                if (descTextEl) {
                    // Append details to description text
                    const existingContent = descTextEl.innerHTML.trim();
                    const detailsContent = detailsHTML.join('<br>');
                    if (existingContent) {
                        descTextEl.innerHTML = existingContent + '<br><br>' + detailsContent;
                    } else {
                        descTextEl.innerHTML = detailsContent;
                    }
                } else {
                    // Fallback for old structure
                    const detailsEl = document.querySelector('.description-box, [data-details]');
                    if (detailsEl) {
                        let detailsSection = detailsEl.querySelector('.product-details');
                        if (!detailsSection) {
                            detailsSection = document.createElement('div');
                            detailsSection.className = 'product-details';
                            detailsEl.appendChild(detailsSection);
                        }
                        detailsSection.innerHTML = detailsHTML.join('<br>');
                    }
                }
            }
        }

        // Populate product specs table (Fabric, Weight, Size, Key Info)
        populateProductSpecsTable();

        // Initialize thumbnail column from API data
        if (PRODUCT_DATA && PRODUCT_DATA.colors) {
            initThumbnailColumn(PRODUCT_DATA.colors);
        }

        // Initialize colors from API data
        if (PRODUCT_DATA && PRODUCT_DATA.colors) {
            initColors(PRODUCT_DATA.colors);
        }

        // â”€â”€ Size overrides: API may be missing sizes for certain products â”€â”€
        const SIZE_OVERRIDES = {
            'YK001': ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
        };
        if (PRODUCT_DATA && SIZE_OVERRIDES[PRODUCT_DATA.code]) {
            PRODUCT_DATA.sizes = SIZE_OVERRIDES[PRODUCT_DATA.code];
        }

        // Initialize sizes from API data
        if (PRODUCT_DATA && PRODUCT_DATA.sizes) {
            initSizes(PRODUCT_DATA.sizes);
        }

        // Initialize tier pricing from API data
        initTierPricing();

        // Initialize breadcrumb navigation
        initBreadcrumb();

        // Load the collapsed comparison drawer for related and alternative products
        initProductRecommendationsSection();

        scrollTouchProductPageToBuySection();

        // ===== FINAL SAFEGUARD: Ensure primary API image is shown =====
        // If no color has been actively selected by the user, force the primary image
        const _finalSavedColor = sessionStorage.getItem('selectedColorName');
        if (!_finalSavedColor && !selectedColorName && PRODUCT_DATA && PRODUCT_DATA.image && mainImage) {
            mainImage.src = PRODUCT_DATA.image;
            mainImage.alt = PRODUCT_NAME || 'Product';
        }
    }

    // Wait a tick to ensure VAT toggle has initialized
    setTimeout(() => {
        updateAllPricing();
        updateBasketTotalBox(); // Load basket total box
    }, 0);
});

// Update the Basket Total Box showing all basket items
function updateBasketTotalBox() {
    const basketTotalItems = document.getElementById('basketTotalItems');
    const basketGrandTotal = document.getElementById('basketGrandTotal');
    const basketTotalBox = document.getElementById('basketTotalBox');

    if (!basketTotalItems || !basketGrandTotal) return;

    const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];

    // Hide box if basket is empty
    if (basket.length === 0) {
        if (basketTotalBox) basketTotalBox.style.display = 'none';
        return;
    }

    // Show box if there are items
    if (basketTotalBox) basketTotalBox.style.display = 'block';

    let grandTotal = 0;
    let itemsHTML = '';

    basket.forEach(item => {
        // Calculate total quantity for this item (handle all storage formats)
        let totalQty = 0;
        if (item.quantities && typeof item.quantities === 'object' && Object.keys(item.quantities).length > 0) {
            Object.values(item.quantities).forEach(q => totalQty += Number(q) || 0);
        } else if (item.sizes && typeof item.sizes === 'object' && !Array.isArray(item.sizes) && Object.keys(item.sizes).length > 0) {
            Object.values(item.sizes).forEach(q => totalQty += Number(q) || 0);
        } else {
            totalQty = Number(item.quantity) || Number(item.qty) || 0;
        }

        // Calculate item total (garment + customizations)
        const unitPrice = Number(item.price) || Number(item.unitPrice) || 0;
        let itemTotal = unitPrice * totalQty;

        // Add customization costs if available
        let customizationInfo = '';
        if (item.customizations && item.customizations.length > 0) {
            item.customizations.forEach(c => {
                const custPrice = Number(c.price) || 0;
                itemTotal += custPrice * totalQty;
                customizationInfo += ` + ${c.position}`;
            });
        }

        grandTotal += itemTotal;

        // Format sizes display
        let sizesText = '';
        const sizeSource = item.quantities || item.sizes;
        if (sizeSource && typeof sizeSource === 'object' && !Array.isArray(sizeSource) && Object.keys(sizeSource).length > 0) {
            const sizeList = Object.entries(sizeSource)
                .filter(([s, q]) => Number(q) > 0)
                .map(([s, q]) => `${s}:${q}`)
                .join(', ');
            sizesText = sizeList ? ` (${sizeList})` : '';
        }

        itemsHTML += `
            <div class="basket-total-item">
                <div class="basket-total-item__info">
                    <span class="basket-total-item__name">${item.name || 'Product'}</span>
                    <span class="basket-total-item__details">${item.color || ''} - ${totalQty} pcs${sizesText}${customizationInfo}</span>
                </div>
                <span class="basket-total-item__price">${formatCurrency(itemTotal)}</span>
            </div>
        `;
    });

    basketTotalItems.innerHTML = itemsHTML;
    basketGrandTotal.textContent = formatCurrency(grandTotal) + ' ' + vatSuffix();
}

// Listen for storage changes (cross-tab sync)
window.addEventListener('storage', function (e) {
    if (e.key === 'quoteBasket') {
        updateBasketTotalBox();
    }
});

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

        // Execute clear directly without confirmation
        this.beginClearSequence();
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

const mainImage = document.getElementById("mainImage");
const mainPriceEl = document.getElementById("mainPrice");
const addContinueButton = document.getElementById("addContinueButton");
const continueShoppingButton = document.getElementById("continueShoppingButton");
const addCustomizeButton = document.getElementById("addCustomizeButton");
const belowSummary = document.getElementById("belowBtnSummary");
const productThumbColumn = document.getElementById("productThumbColumn");

const sizesGrid = document.getElementById("sizesGrid");
const colorGrid = document.getElementById("colorGrid");

/* POPUP */
const popup = document.getElementById("quotePopup") || document.getElementById("addedToBasketPopup");
const popupContent = document.getElementById("popupContent") || document.getElementById("addedPopupContent");
const popupSummary = document.getElementById("popupSummary") || document.getElementById("addedPopupSummary");
const closePopup = document.getElementById("closePopup") || document.getElementById("closeAddedPopup");

// Legacy elements (may not exist on new pages)
const uploadBtnPopup = document.getElementById("uploadLogoBtn");
const logoInputHidden = document.getElementById("logoInput");
const logoPreviewPopup = document.getElementById("logoPreview");

/* ---------------------------------------------------
   COLORS
--------------------------------------------------- */

// Colors will be loaded dynamically from PRODUCT_DATA
let colors = [];

// No color selected by default - user must click to select
let selectedColorName = null;
let selectedColorURL = null;

// Expose selected color globally for other scripts
Object.defineProperty(window, 'selectedColorName', {
    get: function() { return selectedColorName; },
    configurable: true
});

function initThumbnailGallery() {
    if (!productThumbColumn) return;

    // Find thumbnails in the slider inner container or directly in column
    const thumbInner = productThumbColumn.querySelector('.thumb-slider-inner');
    const thumbContainer = thumbInner || productThumbColumn;
    const thumbButtons = Array.from(thumbContainer.querySelectorAll('.thumb-item'));
    if (!thumbButtons.length) return;

    const setActive = (button) => {
        thumbButtons.forEach(btn => btn.classList.toggle('active', btn === button));
    };

    thumbButtons.forEach(button => {
        // Remove existing listeners to avoid duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', () => {
            const imgSrc = newButton.dataset.image;
            const colorName = newButton.dataset.colorName || newButton.getAttribute('aria-label')?.replace(/^View /, '').split(' ')[0] || '';

            if (!imgSrc) return;

            // Update main image
            if (mainImage) {
                mainImage.src = imgSrc;
            }

            // Find matching color in color grid and select it
            if (colorName && colors.length > 0) {
                const matchingColor = colors.find(([name]) => name === colorName);
                if (matchingColor) {
                    const [name, url] = matchingColor;
                    const colorThumb = document.querySelector(`.color-thumb[data-color-name="${name}"]`);
                    if (colorThumb) {
                        // Warn if unsaved items before changing color
                        const currentTotal = Object.values(qty).reduce((a, b) => a + b, 0);
                        if (currentTotal > 0 && selectedColorName) {
                            var msg = 'You have ' + currentTotal + ' items of ' + selectedColorName + ' not added to basket.\nSwitch colour and discard them?';
                            if (!confirm(msg)) return;
                        }
                        changeColor(name, url, colorThumb);
                    }
                }
            }

            setActive(newButton);
        });
    });

    // After cloning, re-query the LIVE buttons in the DOM for initial active detection
    const liveThumbButtons = Array.from(thumbContainer.querySelectorAll('.thumb-item'));
    const initialActive = liveThumbButtons.find(btn => btn.classList.contains('active')) || liveThumbButtons[0];
    if (initialActive) {
        liveThumbButtons.forEach(btn => btn.classList.toggle('active', btn === initialActive));
        if (mainImage && initialActive.dataset.image) {
            mainImage.src = initialActive.dataset.image;
        }
    }

    window.setGalleryActiveBySrc = (src) => {
        const thumbInner = productThumbColumn.querySelector('.thumb-slider-inner');
        const thumbContainer = thumbInner || productThumbColumn;
        const thumbButtons = Array.from(thumbContainer.querySelectorAll('.thumb-item'));
        const match = thumbButtons.find(btn => btn.dataset.image === src);
        if (match) {
            thumbButtons.forEach(btn => btn.classList.remove('active'));
            match.classList.add('active');

            // Scroll to active thumbnail if it's not visible
            if (thumbInner && productThumbColumn.querySelectorAll('.thumb-item').length > 5) {
                const matchIndex = parseInt(match.dataset.index || '0');
                const itemHeight = 80;
                const itemsPerView = 5;

                // Calculate if we need to scroll
                const currentStart = thumbnailSliderState.currentIndex;
                const currentEnd = currentStart + itemsPerView - 1;

                if (matchIndex < currentStart) {
                    // Scroll up to show the active item
                    thumbnailSliderState.currentIndex = Math.max(0, matchIndex);
                } else if (matchIndex > currentEnd) {
                    // Scroll down to show the active item
                    const maxIndex = Math.max(0, thumbnailSliderState.totalItems - itemsPerView);
                    thumbnailSliderState.currentIndex = Math.min(maxIndex, matchIndex - itemsPerView + 1);
                }

                const translateY = -thumbnailSliderState.currentIndex * itemHeight;
                thumbInner.style.transform = `translateY(${translateY}px)`;
                updateThumbnailSliderButtons();
            }
        } else {
            thumbButtons.forEach(btn => btn.classList.remove('active'));
        }
    };
}

// Thumbnail slider state
let thumbnailSliderState = {
    currentIndex: 0,
    itemsPerView: 5,
    totalItems: 0
};

/* Initialize thumbnail column dynamically from product colors with slider */
function initThumbnailColumn(productColors) {
    if (!productThumbColumn) {
        console.warn('Thumbnail column element not found');
        return;
    }

    if (!productColors || !Array.isArray(productColors) || productColors.length === 0) {
        console.warn('No colors available for thumbnail column');
        productThumbColumn.innerHTML = '';
        return;
    }

    // Clear existing thumbnails and wrapper
    productThumbColumn.innerHTML = '';

    // Create wrapper for slider
    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'thumb-slider-wrapper';
    sliderWrapper.style.cssText = 'position: relative; display: flex; flex-direction: column; gap: 8px;';

    // Create container for thumbnails
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'thumb-slider-container';
    thumbContainer.style.cssText = 'position: relative; overflow: hidden; max-height: 400px;';

    // Create inner container for all thumbnails
    const thumbInner = document.createElement('div');
    thumbInner.className = 'thumb-slider-inner';
    thumbInner.style.cssText = 'display: flex; flex-direction: column; gap: 8px; transition: transform 0.3s ease;';

    const isDesktopPc = window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;

    // ===== INSERT PRIMARY IMAGE FROM API AS FIRST THUMBNAIL =====
    const primaryImageUrl = PRODUCT_DATA && PRODUCT_DATA.image ? PRODUCT_DATA.image : null;
    let primaryInserted = false;

    if (primaryImageUrl) {
        // Check that the primary image is not already the first color's image
        const firstColorMain = productColors[0] && (productColors[0].main || productColors[0].thumb || productColors[0].url || '');
        const isDuplicate = firstColorMain && primaryImageUrl === firstColorMain;

        if (!isDuplicate) {
            const primaryButton = document.createElement('button');
            primaryButton.type = 'button';
            primaryButton.className = isDesktopPc ? 'thumb-item' : 'thumb-item active';
            primaryButton.setAttribute('data-image', primaryImageUrl);
            primaryButton.setAttribute('data-color-name', '');
            primaryButton.setAttribute('data-index', '-1');
            primaryButton.setAttribute('data-primary', 'true');
            primaryButton.setAttribute('aria-label', `Primary image of ${PRODUCT_NAME || 'product'}`);
            primaryButton.style.cssText = 'width: 72px; height: 72px; flex-shrink: 0; border: 2px solid #273469;';

            const primaryImg = document.createElement('img');
            primaryImg.src = primaryImageUrl;
            primaryImg.alt = 'Primary product image';
            primaryImg.style.cssText = 'width: 100%; height: 100%; object-fit: contain; border-radius: 8px;';

            primaryButton.appendChild(primaryImg);
            thumbInner.appendChild(primaryButton);
            primaryInserted = true;

            // For non-desktop keep API primary image as initial image.
            if (mainImage && !isDesktopPc) {
                mainImage.src = primaryImageUrl;
                mainImage.alt = PRODUCT_NAME || 'Product';
            }
        }
    }

    // Create all thumbnail buttons from colors
    productColors.forEach((color, index) => {
        const colorName = color.name || 'Unknown';
        const thumbUrl = color.thumb || color.main || color.url || '';
        const mainUrl = color.main || color.thumb || color.url || '';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'thumb-item';
        button.setAttribute('data-image', mainUrl);
        button.setAttribute('data-color-name', colorName);
        button.setAttribute('data-index', index);
        button.setAttribute('aria-label', `View ${colorName} ${PRODUCT_NAME || 'product'}`);
        button.style.cssText = 'width: 72px; height: 72px; flex-shrink: 0; padding: 0; background: #ffffff; box-shadow: none; overflow: hidden;';

        // Set first thumbnail as active by default (only if no primary was inserted and no color is saved)
        const savedColorName = sessionStorage.getItem('selectedColorName');
        if (index === 0 && !savedColorName && !primaryInserted) {
            button.classList.add('active');
        } else if (savedColorName === colorName) {
            button.classList.add('active');
            // If a saved color is selected, also remove primary active state
            if (primaryInserted) {
                const primaryBtn = thumbInner.querySelector('[data-primary="true"]');
                if (primaryBtn) primaryBtn.classList.remove('active');
            }
        }

        const img = document.createElement('img');
        img.src = thumbUrl;
        img.alt = `${colorName} thumbnail`;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 10px;';

        button.appendChild(img);
        thumbInner.appendChild(button);
    });

    thumbContainer.appendChild(thumbInner);

    // Add navigation buttons if more than 5 colors
    if (productColors.length > 5) {
        // Previous button - positioned at top
        const prevBtn = document.createElement('button');
        prevBtn.className = 'thumb-slider-btn thumb-slider-prev';
        prevBtn.setAttribute('aria-label', 'Previous colors');
        prevBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12L4 8L8 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        prevBtn.style.cssText = `
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 32px;
            height: 32px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 50%;
            cursor: pointer;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
            color: #374151;
        `;
        prevBtn.onmouseenter = () => {
            if (!prevBtn.disabled) {
                prevBtn.style.background = '#f9fafb';
                prevBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                prevBtn.style.borderColor = '#d1d5db';
            }
        };
        prevBtn.onmouseleave = () => {
            prevBtn.style.background = 'white';
            prevBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            prevBtn.style.borderColor = '#e5e7eb';
        };
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            slideThumbnails('prev');
        };

        // Next button - positioned at bottom
        const nextBtn = document.createElement('button');
        nextBtn.className = 'thumb-slider-btn thumb-slider-next';
        nextBtn.setAttribute('aria-label', 'Next colors');
        nextBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4L12 8L8 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        nextBtn.style.cssText = `
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 32px;
            height: 32px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 50%;
            cursor: pointer;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
            color: #374151;
        `;
        nextBtn.onmouseenter = () => {
            if (!nextBtn.disabled) {
                nextBtn.style.background = '#f9fafb';
                nextBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                nextBtn.style.borderColor = '#d1d5db';
            }
        };
        nextBtn.onmouseleave = () => {
            nextBtn.style.background = 'white';
            nextBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            nextBtn.style.borderColor = '#e5e7eb';
        };
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            slideThumbnails('next');
        };

        sliderWrapper.appendChild(thumbContainer);
        sliderWrapper.appendChild(prevBtn);
        sliderWrapper.appendChild(nextBtn);

        // Initialize slider state
        thumbnailSliderState.totalItems = productColors.length;
        thumbnailSliderState.currentIndex = 0;
        updateThumbnailSliderButtons();
    } else {
        sliderWrapper.appendChild(thumbContainer);
    }

    productThumbColumn.appendChild(sliderWrapper);

    // Initialize gallery functionality
    initThumbnailGallery();

    // Set initial main image - prioritize: savedColor > primaryImage > first color
    const _savedColorName = sessionStorage.getItem('selectedColorName');
    if (productColors.length > 0 && mainImage) {
        if (_savedColorName) {
            // Use saved color
            const savedColor = productColors.find(c => c.name === _savedColorName);
            if (savedColor) {
                const savedMainUrl = savedColor.main || savedColor.thumb || savedColor.url;
                if (savedMainUrl) {
                    mainImage.src = savedMainUrl;
                }
            }
        } else if (isDesktopPc) {
            // Desktop-only: force model/color image as default main image.
            const firstColor = productColors[0];
            const firstMainUrl = firstColor.main || firstColor.thumb || firstColor.url || primaryImageUrl;
            if (firstMainUrl) {
                mainImage.src = firstMainUrl;
                mainImage.alt = PRODUCT_NAME || 'Product';
            }
        } else if (primaryInserted && primaryImageUrl) {
            // Non-desktop: keep API primary image as default.
        } else {
            // Use first color
            const firstColor = productColors[0];
            const firstMainUrl = firstColor.main || firstColor.thumb || firstColor.url;
            if (firstMainUrl && (!mainImage.src || mainImage.src.includes('GD067'))) {
                mainImage.src = firstMainUrl;
            }
        }
    }

    console.log('âœ… Thumbnail column initialized with', productColors.length, 'colors' + (primaryInserted ? ' + primary image' : '') + ' (slider enabled)');
}

function slideThumbnails(direction) {
    const thumbInner = document.querySelector('.thumb-slider-inner');
    if (!thumbInner) return;

    const itemHeight = 80; // 72px height + 8px gap
    const maxIndex = Math.max(0, thumbnailSliderState.totalItems - thumbnailSliderState.itemsPerView);

    if (direction === 'next') {
        thumbnailSliderState.currentIndex = Math.min(
            thumbnailSliderState.currentIndex + 1,
            maxIndex
        );
    } else {
        thumbnailSliderState.currentIndex = Math.max(
            thumbnailSliderState.currentIndex - 1,
            0
        );
    }

    const translateY = -thumbnailSliderState.currentIndex * itemHeight;
    thumbInner.style.transform = `translateY(${translateY}px)`;

    updateThumbnailSliderButtons();
}

function updateThumbnailSliderButtons() {
    const prevBtn = document.querySelector('.thumb-slider-prev');
    const nextBtn = document.querySelector('.thumb-slider-next');

    if (prevBtn) {
        const isDisabled = thumbnailSliderState.currentIndex === 0;
        prevBtn.disabled = isDisabled;
        prevBtn.style.opacity = isDisabled ? '0.3' : '1';
        prevBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
        prevBtn.style.pointerEvents = isDisabled ? 'none' : 'auto';
        if (isDisabled) {
            prevBtn.style.background = '#f3f4f6';
            prevBtn.style.color = '#9ca3af';
        } else {
            prevBtn.style.background = 'white';
            prevBtn.style.color = '#374151';
        }
    }

    if (nextBtn) {
        const maxIndex = Math.max(0, thumbnailSliderState.totalItems - thumbnailSliderState.itemsPerView);
        const isDisabled = thumbnailSliderState.currentIndex >= maxIndex;
        nextBtn.disabled = isDisabled;
        nextBtn.style.opacity = isDisabled ? '0.3' : '1';
        nextBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
        nextBtn.style.pointerEvents = isDisabled ? 'none' : 'auto';
        if (isDisabled) {
            nextBtn.style.background = '#f3f4f6';
            nextBtn.style.color = '#9ca3af';
        } else {
            nextBtn.style.background = 'white';
            nextBtn.style.color = '#374151';
        }
    }
}

/* BUILD COLOR GRID - Dynamic from API */
function initColors(productColors) {
    if (!productColors || !Array.isArray(productColors) || productColors.length === 0) {
        console.warn('No colors available for this product');
        return;
    }

    // Clear existing colors
    colorGrid.innerHTML = '';
    colors = [];

    // Convert API colors format to internal format: [name, url]
    productColors.forEach(color => {
        const name = color.name || 'Unknown';
        const url = color.main || color.thumb || color.url || '';
        colors.push([name, url]);
    });

    // Check for color filter from home page
    const filterColorName = sessionStorage.getItem('filterColorName');
    const savedColorName = sessionStorage.getItem('selectedColorName');
    const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');

    // Priority: 1. Saved color with basket items, 2. Filter color, 3. Saved color
    let colorToSelect = null;
    let colorToSelectUrl = null;

    if (savedColorName) {
        const hasItemsForColor = basket.some(item => item.color === savedColorName);
        if (hasItemsForColor) {
            // Priority 1: Saved color with basket items
            const savedColor = colors.find(([name]) => name === savedColorName);
            if (savedColor) {
                colorToSelect = savedColorName;
                colorToSelectUrl = savedColor[1];
            }
        }
    }

    // If no saved color with basket items, check filter color
    if (!colorToSelect && filterColorName) {
        // Try to find matching color (case-insensitive, partial match)
        const matchingColor = colors.find(([name]) => {
            const nameLower = name.toLowerCase();
            const filterLower = filterColorName.toLowerCase();
            return nameLower === filterLower || nameLower.includes(filterLower) || filterLower.includes(nameLower);
        });
        if (matchingColor) {
            colorToSelect = matchingColor[0];
            colorToSelectUrl = matchingColor[1];
        }
    }

    // If still no color, use saved color (without basket items requirement)
    if (!colorToSelect && savedColorName) {
        const savedColor = colors.find(([name]) => name === savedColorName);
        if (savedColor) {
            colorToSelect = savedColorName;
            colorToSelectUrl = savedColor[1];
        }
    }

    // Build color grid
    colors.forEach(([name, url], i) => {
        const div = document.createElement("div");
        div.className = "color-thumb";
        div.style.backgroundImage = `url('${url}')`;
        div.setAttribute('data-color-name', name);
        div.setAttribute('title', name);

        // Select color if it matches the color to select
        if (colorToSelect && colorToSelect === name) {
            div.classList.add("active");
            selectedColorName = name;
            selectedColorURL = url;
            if (mainImage) mainImage.src = url;

            // Build size price map for this color's variants
            if (PRODUCT_DATA && PRODUCT_DATA.variants && PRODUCT_DATA.variants.length > 0) {
                buildSizePriceMap(PRODUCT_DATA.variants, name);
            }

            // Update thumbnail gallery to show this color's image (use setTimeout to ensure gallery is initialized)
            setTimeout(() => {
                if (typeof window.setGalleryActiveBySrc === 'function') {
                    window.setGalleryActiveBySrc(url);
                }
            }, 100);

            // Update step progress and clear filter if color was auto-selected from filter
            if (filterColorName && filterColorName === colorToSelect) {
                setTimeout(() => {
                    updateStepProgress(1);
                    // Clear filter color after using it
                    sessionStorage.removeItem('filterColorName');
                }, 150);
            }
        }

        div.onclick = () => {
            // Warn user if they have unsaved items for current color
            const currentTotal = Object.values(qty).reduce((a, b) => a + b, 0);

            if (currentTotal > 0 && selectedColorName) {
                var msg = 'You have ' + currentTotal + ' items of ' + selectedColorName + ' not added to basket.\nSwitch colour and discard them?';
                if (!confirm(msg)) {
                    return;
                }
            }

            changeColor(name, url, div);
        };

        colorGrid.appendChild(div);
    });

    console.log('âœ… Colors initialized:', colors.length);
}

// Click outside color grid deselects color if no quantities added
document.addEventListener('click', (e) => {
    const colorGrid = document.getElementById('colorGrid');
    const sizesSection = document.querySelector('.size-grid');
    const currentTotal = Object.values(qty).reduce((a, b) => a + b, 0);

    // If clicked outside color grid and sizes, and no items selected, deselect color
    if (colorGrid && !colorGrid.contains(e.target) &&
        sizesSection && !sizesSection.contains(e.target) &&
        currentTotal === 0 && selectedColorName) {

        // Check if basket has items for current color
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        const hasItemsInBasket = basket.some(item => item.color === selectedColorName);

        if (!hasItemsInBasket) {
            resetColorSelection();
            selectedColorName = null;
            selectedColorURL = null;
        }
    }
});

/* ---------------------------------------------------
   SIZES
--------------------------------------------------- */

// Sizes will be loaded dynamically from PRODUCT_DATA
let sizeList = [];
let qty = {};

// Expose qty globally so other scripts (like customize-positions-inline.js) can read current selection
window.productPageQty = qty;

// Helper function to get current selection total (for other scripts)
window.getProductPageTotalQty = function() {
    if (!qty || typeof qty !== 'object') return 0;
    return Object.values(qty).reduce((sum, q) => sum + (Number(q) || 0), 0);
};

// Helper function to get current selection data
window.getProductPageSelection = function() {
    return {
        qty: qty,
        totalQty: window.getProductPageTotalQty(),
        productName: PRODUCT_NAME,
        productCode: PRODUCT_CODE,
        colorName: selectedColorName,
        unitPrice: typeof getUnitPrice === 'function' ? getUnitPrice(window.getProductPageTotalQty()) : BASE_PRICE
    };
};

function initSizes(productSizes) {
    if (!productSizes || !Array.isArray(productSizes)) {
        console.warn('No sizes available for this product');
        sizeList = [];
        qty = {};
        window.productPageQty = qty; // Update global reference
        renderSizes();
        return;
    }

    // Set size list from API
    sizeList = productSizes;
    qty = {};
    sizeList.forEach(s => qty[s] = 0);
    window.productPageQty = qty; // Update global reference

    // Render sizes
    renderSizes();

    console.log('âœ… Sizes initialized:', sizeList);
}

function renderSizes() {
    if (!sizesGrid) return;

    sizesGrid.innerHTML = "";

    // Check if color is selected
    const colorSelected = selectedColorName !== null;

    sizeList.forEach(size => {
        const box = document.createElement("div");
        box.className = "size-box" + (colorSelected ? "" : " disabled");

        box.innerHTML = `
            <div class="size-header">${size}</div>
            <div class="qty-controls">
                <button class="qty-btn minus" data-size="${size}" ${colorSelected ? "" : "disabled"}>-</button>
                <input 
                    type="number"
                    class="qty-input"
                    data-size="${size}"
                    min="0"
                    value="0"
                    ${colorSelected ? "" : "disabled"}
                >
                <button class="qty-btn plus" data-size="${size}" ${colorSelected ? "" : "disabled"}>+</button>
            </div>
        `;

        sizesGrid.appendChild(box);
    });

    // Add Save button AFTER the grid (below the size boxes)
    let saveWrapper = document.getElementById('saveColorWrapper');
    if (!saveWrapper) {
        saveWrapper = document.createElement('div');
        saveWrapper.id = 'saveColorWrapper';
        saveWrapper.style.cssText = 'margin-top:12px; display:flex; justify-content:center;';
        sizesGrid.parentNode.insertBefore(saveWrapper, sizesGrid.nextSibling);
    }
    saveWrapper.innerHTML = '';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.id = 'saveColorBtn';
    saveBtn.className = 'save-color-btn' + (colorSelected ? '' : ' disabled');
    saveBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
        </svg>
        Save to Basket
    `;
    saveBtn.disabled = !colorSelected;
    saveBtn.onclick = function() {
        var total = Object.values(qty).reduce(function(a, b) { return a + b; }, 0);
        if (total > 0 && selectedColorName) {
            showBasketLoading();
            setTimeout(function() {
                saveCurrentSelectionToBasket();
                if (typeof updateLiveBadge === 'function') updateLiveBadge();
                if (window.brandedukv15 && window.brandedukv15.updateCartBadge) window.brandedukv15.updateCartBadge();
                saveBtn.classList.add('saved');
                saveBtn.textContent = '\u2713 Saved!';
                setTimeout(function() {
                    hideBasketLoading();
                    saveBtn.classList.remove('saved');
                    saveBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Save to Basket';
                }, 400);
            }, 50);
        }
    };
    saveWrapper.appendChild(saveBtn);

    // Show message if no color selected
    updateSizesMessage();

    attachSizeEvents();
}

// Don't render sizes on page load - wait for product data
// renderSizes(); // Removed - will be called by initSizes()

function updateSizesMessage() {
    let msg = document.getElementById('selectColorMessage');
    const colorSelected = selectedColorName !== null;

    if (!colorSelected) {
        if (!msg) {
            msg = document.createElement('div');
            msg.id = 'selectColorMessage';
            msg.className = 'select-color-message';
            msg.innerHTML = 'â¬†ï¸ Please select a colour first';
            sizesGrid.parentNode.insertBefore(msg, sizesGrid);
        }
        msg.style.display = 'block';
    } else if (msg) {
        msg.style.display = 'none';
    }
}

renderSizes();

// Track if step 2 progress was already triggered
let step2ProgressTriggered = false;

function attachSizeEvents() {
    document.querySelectorAll(".qty-btn.plus").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const s = btn.dataset.size;
            if (qty[s] !== undefined) {
                qty[s]++;
                updateInput(s);

                // Trigger step 2 progress on first size selection
                if (!step2ProgressTriggered) {
                    step2ProgressTriggered = true;
                    updateStepProgress(2);
                }
            }
        };
    });

    document.querySelectorAll(".qty-btn.minus").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const s = btn.dataset.size;
            if (qty[s] !== undefined) {
                qty[s] = Math.max(0, qty[s] - 1);
                updateInput(s);
            }
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
    step2ProgressTriggered = false; // Reset the flag
    renderSizes();
    updateTotals();
}

function resetColorSelection() {
    // Remove active class from all color thumbs
    document.querySelectorAll(".color-thumb").forEach(c => c.classList.remove("active"));

    // Clear session storage
    sessionStorage.removeItem('selectedColorName');
    sessionStorage.removeItem('selectedColorUrl');

    // Reset selected color variables
    selectedColorName = null;
    selectedColorURL = null;

    // Reset step progress bar
    resetStepProgress();

    // Re-render sizes to disable them
    renderSizes();
}

// Step Progress Management - using inline styles
function updateStepProgress(stepCompleted) {
    const stepNum1 = document.getElementById('stepNum1');
    const stepNum2 = document.getElementById('stepNum2');
    const stepNum3 = document.getElementById('stepNum3');
    const stepLabel1 = document.getElementById('stepLabel1');
    const stepLabel2 = document.getElementById('stepLabel2');
    const stepLabel3 = document.getElementById('stepLabel3');
    const connector12 = document.getElementById('connector-1-2');
    const connector23 = document.getElementById('connector-2-3');

    const greenStyle = 'width:44px; height:44px; border-radius:50%; background:#10b981; color:white; font-size:1.1rem; font-weight:700; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(16,185,129,0.3);';
    const greenLabelStyle = 'font-size:0.9rem; font-weight:600; color:#10b981;';

    if (stepCompleted === 1) {
        // Color selected - make step 1 green immediately
        if (stepNum1 && !stepNum1.dataset.completed) {
            stepNum1.style.cssText = greenStyle;
            stepNum1.textContent = '1âœ“';
            stepNum1.dataset.completed = 'true';
            if (stepLabel1) stepLabel1.style.cssText = greenLabelStyle;
        }
    } else if (stepCompleted === 2) {
        // Size selected - animate connector 1-2, then make step 2 green
        if (connector12 && !connector12.dataset.completed) {
            // Start loading animation
            connector12.innerHTML = '<div style="height:100%; width:0; background:#10b981; border-radius:2px; animation:loadBar 2s ease-out forwards;"></div>';

            // Add keyframes if not exists
            if (!document.getElementById('loadBarKeyframes')) {
                const style = document.createElement('style');
                style.id = 'loadBarKeyframes';
                style.textContent = '@keyframes loadBar { 0% { width: 0; } 100% { width: 100%; } }';
                document.head.appendChild(style);
            }

            // After 2 seconds, complete step 2
            setTimeout(() => {
                connector12.style.background = '#10b981';
                connector12.innerHTML = '';
                connector12.dataset.completed = 'true';

                if (stepNum2) {
                    stepNum2.style.cssText = greenStyle;
                    stepNum2.textContent = '2âœ“';
                    stepNum2.dataset.completed = 'true';
                }
                if (stepLabel2) stepLabel2.style.cssText = greenLabelStyle;
            }, 2000);
        }
    } else if (stepCompleted === 3) {
        // Logo added - animate connector 2-3, then make step 3 green
        if (connector23 && !connector23.dataset.completed) {
            connector23.innerHTML = '<div style="height:100%; width:0; background:#10b981; border-radius:2px; animation:loadBar 2s ease-out forwards;"></div>';

            setTimeout(() => {
                connector23.style.background = '#10b981';
                connector23.innerHTML = '';
                connector23.dataset.completed = 'true';

                if (stepNum3) {
                    stepNum3.style.cssText = greenStyle;
                    stepNum3.textContent = '3âœ“';
                    stepNum3.dataset.completed = 'true';
                }
                if (stepLabel3) stepLabel3.style.cssText = greenLabelStyle;
            }, 2000);
        }
    }
}

// Reset step progress
function resetStepProgress() {
    const purpleStyle = 'width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#E4D9FF,#273469); color:white; font-size:1.1rem; font-weight:700; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(39, 52, 105,0.3);';
    const purpleLabelStyle = 'font-size:0.9rem; font-weight:600; color:#273469;';
    const connectorStyle = 'width:60px; height:4px; background:#e5e7eb; margin:0 16px; margin-bottom:28px; border-radius:2px;';

    for (let i = 1; i <= 3; i++) {
        const stepNum = document.getElementById('stepNum' + i);
        const stepLabel = document.getElementById('stepLabel' + i);
        if (stepNum) {
            stepNum.style.cssText = purpleStyle;
            stepNum.textContent = i.toString();
            delete stepNum.dataset.completed;
        }
        if (stepLabel) {
            stepLabel.style.cssText = purpleLabelStyle;
        }
    }

    const connector12 = document.getElementById('connector-1-2');
    const connector23 = document.getElementById('connector-2-3');
    if (connector12) {
        connector12.style.cssText = connectorStyle;
        connector12.innerHTML = '';
        delete connector12.dataset.completed;
    }
    if (connector23) {
        connector23.style.cssText = connectorStyle;
        connector23.innerHTML = '';
        delete connector23.dataset.completed;
    }
}

function changeColor(name, url, colorDiv) {
    document.querySelectorAll(".color-thumb").forEach(c => c.classList.remove("active"));
    if (colorDiv) colorDiv.classList.add("active");

    selectedColorName = name;
    selectedColorURL = url;

    if (mainImage) mainImage.src = url;

    // Rebuild size price map for this color's variants
    if (PRODUCT_DATA && PRODUCT_DATA.variants && PRODUCT_DATA.variants.length > 0) {
        buildSizePriceMap(PRODUCT_DATA.variants, name);
        // Restore original pricing when switching colors (sizes are reset)
        restoreOriginalTierPricing();
    }

    // Update thumbnail gallery active state
    if (typeof window.setGalleryActiveBySrc === 'function') {
        window.setGalleryActiveBySrc(url);
    }

    // Save selection to sessionStorage
    sessionStorage.setItem('selectedColorName', name);
    sessionStorage.setItem('selectedColorUrl', url);

    resetSizes();

    // Update step progress - step 1 completed
    updateStepProgress(1);

    // Scroll down to size section so the customer can choose quantity
    const sizeSection = document.getElementById('step2SizeSection') || document.querySelector('.sizes-grid')?.closest('section') || document.querySelector('.size-section');
    if (sizeSection) {
        const rect = sizeSection.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - 100;
        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    }
}

// showColorChangeModal removed â€” auto-save on color change now

/* ---------------------------------------------------
   MINI SUMMARY
--------------------------------------------------- */

function updateBelowSummary(total, unit) {
    // Safety check
    if (!belowSummary) {
        console.warn('belowSummary element not found');
        return;
    }

    // Show ONLY current selection (not basket)
    const currentTotal = total;
    const currentPrice = currentTotal > 0 ? (unit * currentTotal) : 0;

    const perItemLabel = currentTotal > 0 ? ` Â· ${formatCurrency(unit)} each ${vatSuffix()}` : '';
    const summaryMarkup = `
        <div class="summary-text">
            <span class="summary-items"><b>${currentTotal} items</b>${perItemLabel}</span>
            <span class="summary-total">Total: <span class="total-green">${formatCurrency(currentPrice)}</span> ${vatSuffix()}</span>
        </div>
    `;

    belowSummary.innerHTML = `
        ${currentTotal === 0 ? `
            <div class="summary-text">
                <span class="summary-items"><b>0 items</b></span>
                <span class="summary-total">Total: <span class="total-green">${formatCurrency(0)}</span> ${vatSuffix()}</span>
            </div>
        ` : summaryMarkup}
    `;
}

/* ---------------------------------------------------
   DISCOUNT BOX
--------------------------------------------------- */

function updateDiscountBox(total) {
    // Support both old .disc-box and new .tier-item classes
    const boxes = document.querySelectorAll(".disc-box");
    const tierItems = document.querySelectorAll(".tier-item");

    boxes.forEach(b => b.classList.remove("active"));
    tierItems.forEach(t => t.classList.remove("active"));

    let appliedIndex = 0;

    DISCOUNTS.forEach((tier, i) => {
        if (total >= tier.min && total <= tier.max) appliedIndex = i;
    });

    if (boxes[appliedIndex]) boxes[appliedIndex].classList.add("active");
    if (tierItems[appliedIndex]) tierItems[appliedIndex].classList.add("active");
}

/* ---------------------------------------------------
   TOTALS
--------------------------------------------------- */

function getUnitPrice(totalItems) {
    if (totalItems === 0) return BASE_PRICE;
    const tier = DISCOUNTS.find(t => totalItems >= t.min && totalItems <= t.max);
    return tier ? tier.price : BASE_PRICE;
}

// Expose getUnitPrice globally for other scripts
window.getUnitPrice = getUnitPrice;

function getCurrentTier(totalItems) {
    if (totalItems === 0) return DISCOUNTS[0];
    return DISCOUNTS.find(t => totalItems >= t.min && totalItems <= t.max) || DISCOUNTS[0];
}

function updateTotals() {
    const total = Object.values(qty).reduce((a, b) => a + b, 0);

    // If product has size-based pricing (variants with different prices per size),
    // recalculate tier pricing based on weighted average sell_price of selected sizes
    if (Object.keys(SIZE_PRICE_MAP).length > 0 && total > 0) {
        let weightedSum = 0;
        let totalQty = 0;
        for (const [size, q] of Object.entries(qty)) {
            if (q > 0 && SIZE_PRICE_MAP[size]) {
                weightedSum += SIZE_PRICE_MAP[size] * q;
                totalQty += q;
            }
        }
        if (totalQty > 0) {
            const weightedPrice = weightedSum / totalQty;
            recalculateTierPricing(weightedPrice);
        }
    } else if (Object.keys(SIZE_PRICE_MAP).length > 0 && total === 0) {
        // No sizes selected — restore original pricing
        restoreOriginalTierPricing();
    }

    // Check if basket has items
    const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
    hasBasketItems = basket.length > 0;

    // Calculate TOTAL quantity of THIS PRODUCT in basket (OTHER colors only)
    // Exclude current color because we're already counting it via 'total' above
    const basketProductTotal = basket
        .filter(item => item.name === PRODUCT_NAME && item.code === PRODUCT_CODE && item.color !== selectedColorName)
        .reduce((sum, item) => sum + item.quantity, 0);

    // Grand total = other colors in basket + current selection
    const grandProductTotal = basketProductTotal + total;

    updateDiscountBox(grandProductTotal);
    updateTierPricing(grandProductTotal);

    const unit = getUnitPrice(grandProductTotal);

    // Update main price (with safety check)
    if (mainPriceEl) {
        mainPriceEl.innerHTML = `${formatCurrency(unit)} <span>each ${vatSuffix()}</span>`;
    }

    const priceInfoEl = document.getElementById("priceInfo");
    const tier = getCurrentTier(grandProductTotal);
    if (priceInfoEl) {
        if (grandProductTotal === 0) {
            priceInfoEl.innerHTML = `Price listed for 1â€“9 units`;
        } else {
            priceInfoEl.innerHTML =
                `<b>Bulk price applied:</b> ${formatCurrency(tier.price)} ${vatSuffix()} (${tier.min}+ units)`;
        }
    }

    // Buttons: "Add Colour" only enabled when there ARE items selected
    // "Continue Shopping" enabled when basket has items OR current selection exists
    const addColourDisabled = total === 0;
    const continueDisabled = total === 0 && !hasBasketItems;
    if (addContinueButton) addContinueButton.disabled = addColourDisabled;
    if (continueShoppingButton) continueShoppingButton.disabled = continueDisabled;
    if (addCustomizeButton) addCustomizeButton.disabled = continueDisabled;

    // Sync mobile sticky bar â€” show CURRENT color total + "Add to basket"
    const stickyAddToBasket = document.getElementById("stickyAddToBasket");
    const stickyTotal = document.getElementById("stickyTotal");

    // Mobile action bar elements
    const mobileActionPrice = document.getElementById("actionPrice");
    const mobileAddToBasket = document.getElementById("mobileAddToBasket");

    const currentLineTotal = unit * total;

    // Desktop sticky bar
    if (stickyAddToBasket) stickyAddToBasket.disabled = total === 0;
    if (stickyTotal) {
        stickyTotal.textContent = formatCurrency(currentLineTotal);
    }

    // Mobile action bar
    if (mobileActionPrice) {
        mobileActionPrice.textContent = formatCurrency(currentLineTotal);
    }
    if (mobileAddToBasket) {
        mobileAddToBasket.disabled = total === 0;
        if (total > 0) {
            mobileAddToBasket.classList.add('enabled');
        } else {
            mobileAddToBasket.classList.remove('enabled');
        }
    }

    updateBelowSummary(total, unit);

    // Update sidebar in real-time (show current color qty, not grand total)
    updateSidebarFromProduct(total, unit);
}

// Update sidebar with current product selection
function updateSidebarFromProduct(totalQty, unitPrice) {
    const garmentCostEl = document.getElementById('sidebarGarmentCost');
    const garmentUnitPriceEl = document.getElementById('garmentUnitPrice');
    const garmentQtyEl = document.getElementById('garmentQty');
    const totalCostEl = document.getElementById('sidebarTotalCost');

    const garmentTotal = totalQty * unitPrice;

    if (garmentCostEl) {
        garmentCostEl.textContent = `${formatCurrency(garmentTotal)} ${vatSuffix()}`;
    }
    if (garmentUnitPriceEl) {
        garmentUnitPriceEl.textContent = formatCurrency(unitPrice);
    }
    if (garmentQtyEl) {
        garmentQtyEl.textContent = totalQty;
    }
    if (totalCostEl) {
        totalCostEl.textContent = `${formatCurrency(garmentTotal)} ${vatSuffix()}`;
    }
}

// Update tier pricing highlight
function updateTierPricing(total) {
    const tierItems = document.querySelectorAll('.tier-item');
    if (tierItems.length === 0) return;

    tierItems.forEach(item => {
        const min = parseInt(item.dataset.min);
        const max = parseInt(item.dataset.max);
        item.classList.remove('active');
        // If total is 0 or within this tier's range, highlight it
        if (total === 0 && min === 1) {
            // Default: highlight first tier when no quantity selected
            item.classList.add('active');
        } else if (total >= min && (max >= 99999 || total <= max)) {
            // Highlight tier that matches the total quantity
            item.classList.add('active');
        }
    });
}

/* ---------------------------------------------------
   ADD COLOUR BUTTON - saves via loading overlay, resets for new color
--------------------------------------------------- */

if (addContinueButton) {
addContinueButton.onclick = handleAddToBasket;
} // end if (addContinueButton)

/* ---------------------------------------------------
   CONTINUE SHOPPING BUTTON - navigates to shop
--------------------------------------------------- */

if (continueShoppingButton) {
    continueShoppingButton.onclick = () => {
        const total = Object.values(qty).reduce((a, b) => a + b, 0);
        if (total > 0 && selectedColorName) {
            var msg = 'You have ' + total + ' items of ' + selectedColorName + ' not added to basket.\nLeave and discard them?';
            if (!confirm(msg)) return;
        }
        window.location.href = (window.innerWidth < 1024) ? '/shop?category=all' : '/shop-pc.html?category=all';
    };
}

/* ---------------------------------------------------
   HELPER: Save current color+sizes to basket (REPLACE, not merge)
--------------------------------------------------- */

function saveCurrentSelectionToBasket() {
    const total = Object.values(qty).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    let basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];

    console.log('[BASKET-SAVE] Saving', selectedColorName, 'qty:', total, '| basket BEFORE:', basket.length, 'items →', basket.map(i => i.color + ':' + (i.quantity||i.qty||'?')));

    // Find ALL existing entries for this product+color (V2 may have multiple per-size rows)
    const matchingIndices = [];
    basket.forEach((item, idx) => {
        if (item.code === PRODUCT_CODE && item.color === selectedColorName) {
            matchingIndices.push(idx);
        }
    });

    // Preserve customizations/logos from the first matching entry
    let preservedLogos = [];
    let preservedPositionDesigns = {};
    let preservedPositions = [];
    let preservedSelectedPositions = [];
    let preservedCustomizations = [];
    let preservedNotes = '';
    if (matchingIndices.length > 0) {
        const first = basket[matchingIndices[0]];
        preservedLogos = first.logos || [];
        preservedPositionDesigns = first.positionDesigns || {};
        preservedPositions = first.positions || [];
        preservedSelectedPositions = first.selectedPositions || [];
        preservedCustomizations = first.customizations || [];
        preservedNotes = first.notes || '';
    }

    // Remove ALL old entries for this product+color (fixes V2 per-size row duplication)
    for (let i = matchingIndices.length - 1; i >= 0; i--) {
        basket.splice(matchingIndices[i], 1);
    }

    // Build clean sizes object (only non-zero)
    const cleanSizes = {};
    Object.keys(qty).forEach(size => {
        if (qty[size] > 0) cleanSizes[size] = qty[size];
    });

    // Calculate total quantity of THIS PRODUCT across ALL colors (V2 uses qty, old uses quantity)
    const otherColorsTotal = basket
        .filter(item => item.code === PRODUCT_CODE)
        .reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0);

    const newTotal = otherColorsTotal + total;
    const newUnitPrice = getUnitPrice(newTotal);

    // Ensure we have an image URL - use selectedColorURL or fallback to main image
    let imageUrl = selectedColorURL;
    if (!imageUrl && mainImage && mainImage.src) {
        imageUrl = mainImage.src;
    }
    // If still no image, try to find it from color name in PRODUCT_DATA
    if (!imageUrl && selectedColorName && PRODUCT_DATA && PRODUCT_DATA.images) {
        const colorImages = PRODUCT_DATA.images.find(img => img.color === selectedColorName);
        if (colorImages && colorImages.url) {
            imageUrl = colorImages.url;
        }
    }

    const productData = {
        id: 'pd-' + Date.now() + '-' + String(selectedColorName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: PRODUCT_NAME,
        code: PRODUCT_CODE,
        color: selectedColorName,
        image: imageUrl || '',
        quantity: total,
        size: getSizesSummary(),
        price: newUnitPrice.toFixed(2),
        sizes: cleanSizes,
        priceBreaks: typeof DISCOUNTS !== 'undefined' ? DISCOUNTS : [],
        pendingLogoPrompt: preservedLogos.length === 0 && preservedPositions.length === 0
    };

    // Restore preserved customization data (same colour re-save only)
    productData.logos = preservedLogos;
    productData.positionDesigns = preservedPositionDesigns;
    productData.positions = preservedPositions;
    productData.selectedPositions = preservedSelectedPositions;
    productData.customizations = preservedCustomizations;
    productData.notes = preservedNotes;

    basket.push(productData);
    if (productData.pendingLogoPrompt) {
        sessionStorage.setItem('pendingLogoPromptId', productData.id);
    } else {
        sessionStorage.removeItem('pendingLogoPromptId');
    }

    // Update price for ALL items of the SAME PRODUCT (all colors) - handle both V2 and old format
    basket.forEach(item => {
        if (item.code === PRODUCT_CODE) {
            item.price = newUnitPrice.toFixed(2);
            item.unitPrice = parseFloat(newUnitPrice);
        }
    });

    localStorage.setItem('quoteBasket', JSON.stringify(basket));

    console.log('[BASKET-SAVE] AFTER save:', basket.length, 'items →', basket.map(i => i.color + ':' + (i.quantity||i.qty||'?')));

    if (window.brandedukv15 && window.brandedukv15.updateCartBadge) {
        window.brandedukv15.updateCartBadge();
    }
    updateBasketTotalBox();
}
// Auto-save removed — basket saves ONLY when "Add to basket" button is clicked

/* ---------------------------------------------------
   ADD & CUSTOMIZE BUTTON (legacy - button removed, section always visible)
   This handler is kept for backward compatibility if button exists
--------------------------------------------------- */

if (addCustomizeButton) {
    addCustomizeButton.onclick = () => {
        const total = Object.values(qty).reduce((a, b) => a + b, 0);

        // If there's a current selection, save it to basket with loading overlay
        if (total > 0) {
            showBasketLoading();
            setTimeout(() => {
                saveCurrentSelectionToBasket();
                if (typeof updateLiveBadge === 'function') updateLiveBadge();
                if (window.brandedukv15 && window.brandedukv15.updateCartBadge) window.brandedukv15.updateCartBadge();
                setTimeout(() => {
                    hideBasketLoading();
                    // Scroll to customization section
                    const positionsSection = document.getElementById('step3PositionsSection');
                    if (positionsSection) {
                        positionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        updateStepProgress(3);
                    }
                }, 400);
            }, 50);
        } else {
            // No items - just scroll to customization section
            const positionsSection = document.getElementById('step3PositionsSection');
            if (positionsSection) {
                positionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                updateStepProgress(3);
            }
        }
    };
}

function getSizesSummary() {
    const sizeEntries = Object.entries(qty).filter(([s, q]) => q > 0);
    if (sizeEntries.length === 1) {
        return sizeEntries[0][0];
    }
    return sizeEntries.map(([s, q]) => `${q}x${s}`).join(', ');
}

function getSizesSummaryFromSizes(sizes) {
    const sizeEntries = Object.entries(sizes).filter(([s, q]) => q > 0);
    if (sizeEntries.length === 1) {
        return sizeEntries[0][0];
    }
    return sizeEntries.map(([s, q]) => `${q}x${s}`).join(', ');
}

/* ---------------------------------------------------
   BASKET LOADING OVERLAY - shown when saving to basket
--------------------------------------------------- */
function showBasketLoading() {
    var existing = document.getElementById('basketLoadingOverlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'basketLoadingOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.45);z-index:99999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:28px 36px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);">'
        + '<div style="width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#f97316;border-radius:50%;animation:basketSpin .7s linear infinite;margin:0 auto 12px;"></div>'
        + '<div style="font-size:15px;font-weight:600;color:#1f2937;">Saving to basket\u2026</div>'
        + '</div>';
    document.body.appendChild(overlay);

    if (!document.getElementById('basketSpinStyle')) {
        var style = document.createElement('style');
        style.id = 'basketSpinStyle';
        style.textContent = '@keyframes basketSpin{to{transform:rotate(360deg)}}';
        document.head.appendChild(style);
    }
}
function hideBasketLoading() {
    var overlay = document.getElementById('basketLoadingOverlay');
    if (overlay) overlay.remove();
}

/* ---------------------------------------------------
   ADD TO BASKET HANDLER - ONLY way to save to basket
--------------------------------------------------- */
function handleAddToBasket() {
    var total = Object.values(qty).reduce(function(a, b) { return a + b; }, 0);
    if (total === 0) return;

    showBasketLoading();

    setTimeout(function() {
        saveCurrentSelectionToBasket();

        if (typeof updateLiveBadge === 'function') updateLiveBadge();
        if (window.brandedukv15 && window.brandedukv15.updateCartBadge) window.brandedukv15.updateCartBadge();

        setTimeout(function() {
            hideBasketLoading();
            openPopup();
        }, 400);
    }, 50);
}

/* ---------------------------------------------------
   MOBILE STICKY BAR BUTTON - "Add to basket"
--------------------------------------------------- */

var stickyAddToBasketBtn = document.getElementById("stickyAddToBasket");
if (stickyAddToBasketBtn) {
    stickyAddToBasketBtn.onclick = handleAddToBasket;
}

// Mobile "Add to basket" button in action bar
var mobileAddToBasketBtn = document.getElementById("mobileAddToBasket");
if (mobileAddToBasketBtn) {
    mobileAddToBasketBtn.onclick = handleAddToBasket;
}


function openPopup() {
    const total = Object.values(qty).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    // Calculate tier using grand total (all colors of this product)
    const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
    const grandTotal = basket
        .filter(item => item.code === PRODUCT_CODE)
        .reduce((sum, item) => {
            // Handle all storage formats: quantity, qty, sizes, quantities
            if (item.sizes && typeof item.sizes === 'object' && !Array.isArray(item.sizes)) {
                return sum + Object.values(item.sizes).reduce((a, b) => a + (Number(b) || 0), 0);
            }
            if (item.quantities && typeof item.quantities === 'object') {
                return sum + Object.values(item.quantities).reduce((a, b) => a + (Number(b) || 0), 0);
            }
            return sum + (Number(item.quantity) || Number(item.qty) || 0);
        }, 0);

    const unit = getUnitPrice(grandTotal);
    const lineTotal = unit * total;

    const sizeLines = Object.entries(qty)
        .filter(([s, q]) => q > 0)
        .map(([s, q]) => `${s}: ${q}`)
        .join(', ');

    if (popupContent) {
        popupContent.innerHTML = `
            <img src="${selectedColorURL}" alt="${PRODUCT_NAME}">
            <div class="popup-product-info">
                <h3>${PRODUCT_NAME}</h3>
                <div class="popup-meta">
                    ${PRODUCT_CODE} &middot; ${selectedColorName}<br>
                    ${sizeLines} &middot; Qty: ${total}
                </div>
            </div>
        `;
    }

    if (popupSummary) {
        popupSummary.innerHTML = `
            <div>
                <div class="popup-qty">${total} items</div>
                <div class="popup-unit-price">${formatCurrency(unit)} per item ${vatSuffix()}</div>
            </div>
            <div class="popup-total">
                <div class="popup-total-label">Total:</div>
                <div class="popup-total-value">${formatCurrency(lineTotal)} ${vatSuffix()}</div>
            </div>
        `;
    }

    if (popup) popup.style.display = "flex";

    // Reset sizes after adding to basket so bar goes back to \u00A30.00
    resetSizes();
    resetColorSelection();
    hasBasketItems = true;
    updateTotals();
}

if (closePopup) {
    closePopup.onclick = () => {
        if (popup) popup.style.display = "none";
    };
}

window.addEventListener("click", (e) => {
    if (e.target === popup) {
        if (popup) popup.style.display = "none";
    }
});

// View Basket — keep logo prompt flag so basket shows quick-logo popup
const popupViewBasketBtn = document.getElementById('popupViewBasketBtn');
if (popupViewBasketBtn) {
    popupViewBasketBtn.onclick = function () {
        if (popup) popup.style.display = 'none';
        window.location.href = 'basket.html?promptLogo=1';
    };
}

// "Add your logo now" button in popup â€” navigate to customize page
const popupAddLogoBtn = document.getElementById('popupAddLogoBtn');
if (popupAddLogoBtn) {
    popupAddLogoBtn.onclick = () => {
        // Find the basket item we just saved
        const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
        const itemIndex = basket.length - 1; // Last added item
        if (itemIndex >= 0) {
            sessionStorage.setItem('customizingBasketIndex', itemIndex.toString());
            sessionStorage.setItem('returnAfterCustomize', 'basket');

            // Store product data for customize page
            const item = basket[itemIndex];
            sessionStorage.setItem('selectedProduct', item.code);
            sessionStorage.setItem('selectedColorName', item.color);
            sessionStorage.setItem('selectedProductData', JSON.stringify({
                code: item.code || '',
                name: item.name || '',
                price: item.unitPrice || item.price || 0,
                image: item.image || '',
                brand: item.brand || '',
                productType: item.productType || ''
            }));
        }
        try { sessionStorage.setItem('customizeFreshItem', '1'); } catch (e) { /* ignore */ }
        const isMobile = window.innerWidth < 1024;
        window.location.href = isMobile ? 'mobile/customize-mobile.html' : 'customize.html';
    };
}

// "Continue Shopping" link in popup â€” close popup and stay on page
const popupContinueShopping = document.getElementById('popupContinueShopping');
if (popupContinueShopping) {
    popupContinueShopping.onclick = (e) => {
        e.preventDefault();
        if (popup) popup.style.display = "none";
        // Scroll back to color grid for next selection
        const colorGridEl = document.getElementById('colorGrid');
        if (colorGridEl) {
            colorGridEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };
}

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
    if (!grid) return;

    grid.innerHTML = '';

    if (!colors || colors.length === 0) {
        console.warn('No colors available for color selection');
        return;
    }

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

    // Ensure we have an image URL - fallback to main image if needed
    let imageUrl = customizationData.selectedColorUrl;
    if (!imageUrl && mainImage && mainImage.src) {
        imageUrl = mainImage.src;
    }
    // If still no image, try to find it from color name
    if (!imageUrl && customizationData.selectedColor && PRODUCT_DATA && PRODUCT_DATA.images) {
        const colorImages = PRODUCT_DATA.images.find(img => img.color === customizationData.selectedColor);
        if (colorImages && colorImages.url) {
            imageUrl = colorImages.url;
        }
    }

    // Prepare item
    const item = {
        code: PRODUCT_CODE,
        name: PRODUCT_NAME,
        color: customizationData.selectedColor,
        image: imageUrl || '',
        sizes: sizeQuantities,
        price: BASE_PRICE,
        customization: customizationData.positionsData
    };

    basket.push(item);
    localStorage.setItem('quoteBasket', JSON.stringify(basket));

    // Close modal and redirect to basket
    closeCustomizationModal();
    window.location.href = 'basket.html';
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
    const nameEl = document.getElementById('sidebarProductName');
    const codeEl = document.getElementById('sidebarProductCode');
    const colorEl = document.getElementById('sidebarProductColor');
    const garmentCostEl = document.getElementById('sidebarGarmentCost');
    const totalCostEl = document.getElementById('sidebarTotalCost');
    const garmentUnitPriceEl = document.getElementById('garmentUnitPrice');
    const garmentQtyEl = document.getElementById('garmentQty');

    if (!nameEl || !codeEl || !garmentCostEl || !totalCostEl) {
        return;
    }

    nameEl.textContent = PRODUCT_NAME;
    codeEl.textContent = 'EE-' + PRODUCT_CODE;

    // Use the correct 'qty' variable (not undefined 'sizeQuantities')
    const totalQty = typeof qty !== 'undefined' && qty
        ? Object.values(qty).reduce((sum, q) => sum + q, 0)
        : 0;

    const pricePerUnit = typeof getUnitPrice === 'function'
        ? getUnitPrice(totalQty)
        : BASE_PRICE;

    const garmentTotal = totalQty * pricePerUnit;

    garmentCostEl.textContent = `${formatCurrency(garmentTotal)} ${vatSuffix()}`;
    if (garmentUnitPriceEl) {
        garmentUnitPriceEl.textContent = formatCurrency(pricePerUnit);
    }
    if (garmentQtyEl) {
        garmentQtyEl.textContent = totalQty;
    }
    totalCostEl.textContent = `${formatCurrency(garmentTotal)} ${vatSuffix()}`;

    // Update color and sizes display
    if (colorEl) {
        const colorName = selectedColorName || sessionStorage.getItem('selectedColorName') || 'Not selected';

        // Build sizes string from qty object
        let sizesStr = '';
        if (typeof qty !== 'undefined' && qty && Object.keys(qty).length > 0) {
            const sizeEntries = Object.entries(qty)
                .filter(([_, q]) => q > 0)
                .map(([size, q]) => `${q} x ${size}`);
            sizesStr = sizeEntries.join(', ');
        }

        if (sizesStr) {
            colorEl.textContent = `${colorName} / ${sizesStr}`;
        } else {
            colorEl.textContent = colorName;
        }
    }
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

document.addEventListener('brandeduk:vat-change', () => {
    updateTotals();
    updateSidebarProductInfo();
    if (popup && popup.style.display === 'flex') {
        openPopup();
    }
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
