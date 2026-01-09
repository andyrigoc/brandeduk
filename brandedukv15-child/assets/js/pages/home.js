// ===== PRODUCTS DATABASE (keep in sync with search/results) =====
const PRODUCTS_DB = [
    {
        code: "GD067",
        name: "Softstyle™ midweight fleece adult hoodie",
        price: "17.58",
        image: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg",
        colors: [
            {name: "Aquatic", main: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg", thumb: "https://i.postimg.cc/NFTwJPWm/GD067-Aquatic-FT.jpg"},
            {name: "Ash Grey", main: "https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg", thumb: "https://i.postimg.cc/fLVsXbCp/GD067-Ash-Grey-FT.jpg"},
            {name: "Black", main: "https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg", thumb: "https://i.postimg.cc/C1R0DK7W/GD067-Black-FT.jpg"},
            {name: "Blue Dusk", main: "https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg", thumb: "https://i.postimg.cc/1t8S6zBk/GD067-Blue-Dusk-FT.jpg"},
            {name: "Brown Savana", main: "https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg", thumb: "https://i.postimg.cc/Hxrm5L3G/GD067-Brown-Savana-FT.jpg"},
            {name: "Cardinal Red", main: "https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg", thumb: "https://i.postimg.cc/wv1zJBF8/GD067-Cardinal-Red-FT.jpg"},
            {name: "Carolina Blue", main: "https://i.postimg.cc/V6N7kG1D/GD067-Carolina-Blue-FT.jpg", thumb: "https://i.postimg.cc/261Yv5TN/GD067-Carolina-Blue-FT.jpg"},
            {name: "Cement", main: "https://i.postimg.cc/fLbHR2Z2/GD067-Cement-FT.jpg", thumb: "https://i.postimg.cc/Ssn48KVh/GD067-Cement-FT.jpg"},
            {name: "Charcoal", main: "https://i.postimg.cc/4d38xLZF/GD067-Charcoal-FT.jpg", thumb: "https://i.postimg.cc/V6JwMN4w/GD067-Charcoal-FT.jpg"},
            {name: "Cobalt", main: "https://i.postimg.cc/sX2ng6yL/GD067-Cobalt-FT.jpg", thumb: "https://i.postimg.cc/9MD2Tf1V/GD067-Cobalt-FT.jpg"},
            {name: "Cocoa", main: "https://i.postimg.cc/d10WVHvb/GD067-Cocoa-FT.jpg", thumb: "https://i.postimg.cc/Y9v7gS8r/GD067-Cocoa-FT.jpg"},
            {name: "Daisy", main: "https://i.postimg.cc/1tzW3Cs1/GD067-Daisy-FT.jpg", thumb: "https://i.postimg.cc/76547LXP/GD067-Daisy-FT.jpg"},
            {name: "Dark Heather", main: "https://i.postimg.cc/j5kMwHdk/GD067-Dark-Heather-FT.jpg", thumb: "https://i.postimg.cc/nzXx7LTL/GD067-Dark-Heather-FT.jpg"},
            {name: "Dusty Rose", main: "https://i.postimg.cc/fLg8tcTP/GD067-Dusty-Rose-FT.jpg", thumb: "https://i.postimg.cc/C1R0DKJx/GD067-Dusty-Rose-FT.jpg"},
            {name: "Forest Green", main: "https://i.postimg.cc/FRnTdys8/GD067-Forest-Green-FT.jpg", thumb: "https://i.postimg.cc/RF2BTzbB/GD067-Forest-Green-FT.jpg"},
            {name: "Light Pink", main: "https://i.postimg.cc/G2SX8FhW/GD067-Light-Pink-FT.jpg", thumb: "https://i.postimg.cc/50XJvtpj/GD067-Light-Pink-FT.jpg"},
            {name: "Maroon", main: "https://i.postimg.cc/zBPxbCG1/GD067-Maroon-FT.jpg", thumb: "https://i.postimg.cc/RFWmf0Gh/GD067-Maroon-FT.jpg"},
            {name: "Military Green", main: "https://i.postimg.cc/TwHtLV3f/GD067-Military-Green-FT.jpg", thumb: "https://i.postimg.cc/LXGpVM0R/GD067-Military-Green-FT.jpg"},
            {name: "Mustard", main: "https://i.postimg.cc/MTr9M7pZ/GD067-Mustard-FT.jpg", thumb: "https://i.postimg.cc/9MshBjNm/GD067-Mustard-FT.jpg"},
            {name: "Navy", main: "https://i.postimg.cc/MTr9M7pp/GD067-Navy-FT.jpg", thumb: "https://i.postimg.cc/76jkNyQP/GD067-Navy-FT.jpg"},
            {name: "Off White", main: "https://i.postimg.cc/nzw3j4hz/GD067-Off-White-FT.jpg", thumb: "https://i.postimg.cc/zB4rk1PG/GD067-Off-White-FT.jpg"},
            {name: "Paragon", main: "https://i.postimg.cc/j5kMwHSL/GD067-Paragon-FT.jpg", thumb: "https://i.postimg.cc/85xSbVnC/GD067-Paragon-FT.jpg"},
            {name: "Pink Lemonade", main: "https://i.postimg.cc/zBPxbCGy/GD067-Pink-Lemonade-FT.jpg", thumb: "https://i.postimg.cc/3RzTZHbW/GD067-Pink-Lemonade-FT.jpg"},
            {name: "Pistachio", main: "https://i.postimg.cc/xCF6Jv1N/GD067-Pistachio-FT.jpg", thumb: "https://i.postimg.cc/d1gY9KS1/GD067-Pistachio-FT.jpg"},
            {name: "Purple", main: "https://i.postimg.cc/C5BmjRRx/GD067-Purple-FT.jpg", thumb: "https://i.postimg.cc/nzNJ1twr/GD067-Purple-FT.jpg"},
            {name: "Red", main: "https://i.postimg.cc/brD3QZZd/GD067-Red-FT.jpg", thumb: "https://i.postimg.cc/pT3HBt1m/GD067-Red-FT.jpg"},
            {name: "Ringspun Sport Grey", main: "https://i.postimg.cc/zvb0nyyg/GD067-Ringspun-Sport-Grey-FT.jpg", thumb: "https://i.postimg.cc/SsHhGptM/GD067-Ringspun-Sport-Grey-FT.jpg"},
            {name: "Royal", main: "https://i.postimg.cc/VNmG3sVH/GD067-Royal-FT.jpg", thumb: "https://i.postimg.cc/Qtv3qrn9/GD067-Royal-FT.jpg"},
            {name: "Sage", main: "https://i.postimg.cc/tgpSLRcy/GD067-Sage-FT.jpg", thumb: "https://i.postimg.cc/9MshBjNw/GD067-Sage-FT.jpg"},
            {name: "Sand", main: "https://i.postimg.cc/Bv4YdZz3/GD067-Sand-FT.jpg", thumb: "https://i.postimg.cc/FRw4xQn3/GD067-Sand-FT.jpg"},
            {name: "Sky", main: "https://i.postimg.cc/YSMnJ2Pc/GD067-Sky-FT.jpg", thumb: "https://i.postimg.cc/HxFgtCPb/GD067-Sky-FT.jpg"},
            {name: "Smoke", main: "https://i.postimg.cc/Xv4HTNPb/GD067-Smoke-FT.jpg", thumb: "https://i.postimg.cc/mDKsSG6y/GD067-Smoke-FT.jpg"},
            {name: "Stone Blue", main: "https://i.postimg.cc/g0mSfc72/GD067-Stone-Blue-FT.jpg", thumb: "https://i.postimg.cc/Px0jMkF4/GD067-Stone-Blue-FT.jpg"},
            {name: "Tangerine", main: "https://i.postimg.cc/25GcmRpr/GD067-Tangerine-FT.jpg", thumb: "https://i.postimg.cc/8cWVKnqr/GD067-Tangerine-FT.jpg"},
            {name: "Texas Orange", main: "https://i.postimg.cc/TP07GM8x/GD067-Texas-Orange-FT.jpg", thumb: "https://i.postimg.cc/V628FcHg/GD067-Texas-Orange-FT.jpg"},
            {name: "White", main: "https://i.postimg.cc/1zBCPhxQ/GD067-White-FT.jpg", thumb: "https://i.postimg.cc/PJZk3FBD/GD067-White-FT.jpg"},
            {name: "Yellow Haze", main: "https://i.postimg.cc/W48WjLRN/GD067-Yellow-Haze-FT.jpg", thumb: "https://i.postimg.cc/90Tj8NvT/GD067-Yellow-Haze-FT.jpg"}
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    },
    {
        code: "GD067",
        name: "Softstyle™ midweight fleece adult hoodie",
        price: "17.58",
        image: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg",
        colors: [
            {name: "Aquatic", url: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg"},
            {name: "Ash Grey", url: "https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg"},
            {name: "Black", url: "https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg"},
            {name: "Blue Dusk", url: "https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg"},
            {name: "Brown Savana", url: "https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg"},
            {name: "Cardinal Red", url: "https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg"}
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    },
    {
        code: "GD067",
        name: "Softstyle™ midweight fleece adult hoodie",
        price: "17.58",
        image: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg",
        colors: [
            {name: "Aquatic", url: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg"},
            {name: "Ash Grey", url: "https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg"},
            {name: "Black", url: "https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg"},
            {name: "Blue Dusk", url: "https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg"},
            {name: "Brown Savana", url: "https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg"},
            {name: "Cardinal Red", url: "https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg"}
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    },
    {
        code: "GD067",
        name: "Softstyle™ midweight fleece adult hoodie",
        price: "17.58",
        image: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg",
        colors: [
            {name: "Aquatic", url: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg"},
            {name: "Ash Grey", url: "https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg"},
            {name: "Black", url: "https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg"},
            {name: "Blue Dusk", url: "https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg"},
            {name: "Brown Savana", url: "https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg"},
            {name: "Cardinal Red", url: "https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg"}
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    },
    {
        code: "GD067",
        name: "Softstyle™ midweight fleece adult hoodie",
        price: "17.58",
        image: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg",
        colors: [
            {name: "Aquatic", url: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg"},
            {name: "Ash Grey", url: "https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg"},
            {name: "Black", url: "https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg"},
            {name: "Blue Dusk", url: "https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg"},
            {name: "Brown Savana", url: "https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg"},
            {name: "Cardinal Red", url: "https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg"}
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    },
    {
        code: "GD067",
        name: "Softstyle™ midweight fleece adult hoodie",
        price: "17.58",
        image: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg",
        colors: [
            {name: "Aquatic", url: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg"},
            {name: "Ash Grey", url: "https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg"},
            {name: "Black", url: "https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg"},
            {name: "Blue Dusk", url: "https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg"},
            {name: "Brown Savana", url: "https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg"},
            {name: "Cardinal Red", url: "https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg"}
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    },
    {
        code: "GD067",
        name: "Softstyle™ midweight fleece adult hoodie",
        price: "17.58",
        image: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg",
        colors: [
            {name: "Aquatic", url: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg"},
            {name: "Ash Grey", url: "https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg"},
            {name: "Black", url: "https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg"},
            {name: "Blue Dusk", url: "https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg"},
            {name: "Brown Savana", url: "https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg"},
            {name: "Cardinal Red", url: "https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg"}
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    },
    {
        code: "GD067",
        name: "Softstyle™ midweight fleece adult hoodie",
        price: "17.58",
        image: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg",
        colors: [
            {name: "Aquatic", url: "https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg"},
            {name: "Ash Grey", url: "https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg"},
            {name: "Black", url: "https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg"},
            {name: "Blue Dusk", url: "https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg"},
            {name: "Brown Savana", url: "https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg"},
            {name: "Cardinal Red", url: "https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg"}
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    }
];

// Duplicate products to reach 40 for testing scroll behavior
const baseProduct = PRODUCTS_DB[0];
while (PRODUCTS_DB.length < 40) {
    PRODUCTS_DB.push({ ...baseProduct });
}

const colorMap = {
    black: "#1a1a1a",
    white: "#ffffff",
    grey: "#808080",
    navy: "#000080",
    red: "#ff0000",
    blue: "#0000ff",
    green: "#008000",
    burgundy: "#800020"
};

const PRICE_BREAKS_BY_CODE = {
    GD067: [
        { min: 1,   max: 9,     price: 17.58 },
        { min: 10,  max: 24,    price: 16.54 },
        { min: 25,  max: 49,    price: 16.18 },
        { min: 50,  max: 99,    price: 14.94 },
        { min: 100, max: 249,   price: 13.49 },
        { min: 250, max: 99999, price: 12.59 }
    ]
};

let quoteBasket = JSON.parse(localStorage.getItem('quoteBasket')) || [];

// ===== VAT HELPERS =====
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
    var vat = getVatApi();
    if (vat && typeof vat.format === 'function') {
        return vat.format(baseAmount, options);
    }

    options = options || {};
    var currency = options.currency || '£';
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
    if (vat && typeof vat.suffix === 'function') {
        return vat.suffix();
    }
    return isVatOn() ? 'inc VAT' : 'ex VAT';
}

function formatPriceRange(minPrice, maxPrice) {
    var minVal = Number(minPrice) || 0;
    var maxVal = Number(maxPrice) || 0;
    if (Math.abs(minVal - maxVal) < 0.005) {
        return formatCurrency(minVal);
    }
    return formatCurrency(minVal) + ' - ' + formatCurrency(maxVal);
}

function updateCardPriceRanges() {
    document.querySelectorAll('.product-card .product-price').forEach(function (priceEl) {
        var min = Number(priceEl.dataset.priceMin);
        var max = Number(priceEl.dataset.priceMax);
        var valueEl = priceEl.querySelector('.product-price-value');
        if (valueEl && Number.isFinite(min) && Number.isFinite(max)) {
            valueEl.textContent = formatPriceRange(min, max);
        }
        var suffixEl = priceEl.querySelector('.product-price-suffix');
        if (suffixEl) {
            suffixEl.textContent = vatSuffix();
        }
    });
}

document.addEventListener('brandeduk:vat-change', updateCardPriceRanges);

// ===== PRICE HELPERS =====
function toPriceNumber(val) {
    const n = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(n) ? n : 0;
}

function getRangeFromProducts(list) {
    if (!list.length) return { min: 0, max: 0 };
    const prices = list.map(p => toPriceNumber(p.price));
    return {
        min: Math.min(...prices),
        max: Math.max(...prices)
    };
}

function getProductPriceRange(product) {
    const breaks = PRICE_BREAKS_BY_CODE[product.code];
    if (!breaks || !breaks.length) {
        const base = toPriceNumber(product.price);
        return { min: base, max: base };
    }
    const values = breaks.map(step => toPriceNumber(step.price)).filter(price => price > 0);
    if (!values.length) {
        const fallback = toPriceNumber(product.price);
        return { min: fallback, max: fallback };
    }
    return {
        min: Math.min(...values),
        max: Math.max(...values)
    };
}

// ===== RENDER PRODUCTS =====
function renderProducts(productsToRender = PRODUCTS_DB) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    if (!productsToRender.length) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No products found. Try searching GD067</p>';
        return;
    }

    productsToRender.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const badgesLeft = product.customization.filter(c => c === 'print').map(c =>
            `<span class="badge ${c}">PRINT</span>`
        ).join('');
        
        const badgesRight = product.customization.filter(c => c === 'embroidery').map(c =>
            `<span class="badge ${c}">EMBROIDERY</span>`
        ).join('');

        // Use different color for each card (cycle through available colors)
        const colorIndex = index % product.colors.length;
        const colorData = product.colors[colorIndex];
        const displayColor = typeof colorData === 'object' 
            ? {
                name: colorData.name,
                main: colorData.main || colorData.url || product.image,
                thumb: colorData.thumb || colorData.url || product.image
              }
            : {name: colorData, main: product.image, thumb: product.image};
        
        const colors = product.colors.map(c => {
            const color = typeof c === 'object' 
                ? {
                    name: c.name,
                    main: c.main || c.url || product.image,
                    thumb: c.thumb || c.url || product.image
                  }
                : {name: c, main: product.image, thumb: product.image};
            return `<button type="button" class="color-dot" data-color="${color.name}" data-main="${color.main}" style="background-image: url('${color.thumb}')" title="${color.name}"></button>`;
        }).join('');

        const { min: minPrice, max: maxPrice } = getProductPriceRange(product);

        card.innerHTML = `
            <div class="product-media">
                <div class="product-badges-top">
                    ${badgesLeft}
                    ${badgesRight}
                </div>
                <div class="product-figure">
                    <img src="${displayColor.main}" alt="${product.name}" class="product-main-img">
                </div>
            </div>
            <div class="product-info">
                <div class="product-code">
                    ${product.code}
                    <img src="https://i.postimg.cc/3WpCDK5M/gildan-logo.png" alt="Gildan" class="brand-logo" title="Gildan Brand">
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-price" data-price-min="${minPrice}" data-price-max="${maxPrice}">
                    <span class="product-price-label">Start From</span>
                    <span class="product-price-value">${formatPriceRange(minPrice, maxPrice)}</span>
                    <span class="product-price-suffix">${vatSuffix()}</span>
                </div>
                <div class="product-colors">${colors}</div>
            </div>
        `;

        // Store selected color for this card
        let selectedColorForCard = null;
        
        card.querySelectorAll('.color-dot').forEach(dot => {
            dot.addEventListener('mouseenter', (event) => {
                // Only change on hover if no color is selected
                if (!selectedColorForCard) {
                    const img = card.querySelector('.product-main-img');
                    if (img) img.src = dot.dataset.main;
                }
            });
            
            dot.addEventListener('mouseleave', (event) => {
                // Restore selected color when mouse leaves
                if (selectedColorForCard && !event.currentTarget.classList.contains('active')) {
                    const img = card.querySelector('.product-main-img');
                    const activeDot = card.querySelector('.color-dot.active');
                    if (img && activeDot) img.src = activeDot.dataset.main;
                }
            });
            
            dot.addEventListener('click', (event) => {
                event.stopPropagation();
                const img = card.querySelector('.product-main-img');
                if (img) img.src = dot.dataset.main;
                card.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                // Save selected color
                selectedColorForCard = {
                    name: dot.dataset.color,
                    url: dot.dataset.main
                };
            });
        });

        card.addEventListener('click', (evt) => goToProduct(product.code, evt));

        grid.appendChild(card);
    });

    updateCardPriceRanges();
}

// ===== NAVIGATION =====
function goToProduct(code, evt = null, selectedColor = null) {
    const product = PRODUCTS_DB.find(p => p.code === code);
    if (product) {
        sessionStorage.setItem('selectedProduct', code);
        sessionStorage.setItem('selectedProductData', JSON.stringify(product));
        
        // Save selected color if any
        const eventSource = evt?.currentTarget || evt?.target || event?.target;
        const activeColorDot = eventSource?.closest('.product-card')?.querySelector('.color-dot.active');
        if (activeColorDot) {
            sessionStorage.setItem('selectedColorName', activeColorDot.dataset.color);
            sessionStorage.setItem('selectedColorUrl', activeColorDot.dataset.main);
        }
    }
    window.location.href = 'product-detail.html';
}

// ===== BASKET COUNT =====
function updateBasketCount() {
    document.querySelectorAll('.basket-count').forEach(el => {
        el.textContent = quoteBasket.length;
    });
}

function initBrowseCategories() {
    const dropdown = document.querySelector('.header-bottom .category-dropdown');

    if (!dropdown) {
        return;
    }

    const toggle = dropdown.querySelector('.category-toggle');
    const menuItems = dropdown.querySelectorAll('.category-menu > li.has-children');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const hoverQuery = window.matchMedia('(hover: hover)');
    let isOpen = false;

    const resetExpanded = () => {
        menuItems.forEach(item => {
            item.classList.remove('is-expanded');
        });
    };

    const expandMenuItem = (item) => {
        if (!item) {
            return;
        }
        menuItems.forEach(other => {
            if (other !== item) {
                other.classList.remove('is-expanded');
            }
        });
        item.classList.add('is-expanded');
    };

    const setOpenState = (open) => {
        isOpen = open;
        dropdown.classList.toggle('show', open);
        dropdown.setAttribute('data-visible', open ? 'true' : 'false');
        if (toggle) {
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        if (!open) {
            resetExpanded();
        }
    };

    const openDropdown = () => {
        if (!isOpen) {
            setOpenState(true);
        }
    };

    const closeDropdown = () => {
        if (isOpen) {
            setOpenState(false);
        }
    };

    const handleDocumentClick = (event) => {
        if (!isOpen) {
            return;
        }

        if (!dropdown.contains(event.target) && event.target !== toggle) {
            closeDropdown();
        }
    };

    const handleToggleClick = (event) => {
        if (event) {
            event.preventDefault();
        }

        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    };

    const handleMenuItemClick = (item, event) => {
        if (desktopQuery.matches && hoverQuery.matches) {
            return;
        }

        event.preventDefault();
        const alreadyExpanded = item.classList.contains('is-expanded');
        menuItems.forEach(other => {
            if (other !== item) {
                other.classList.remove('is-expanded');
            }
        });
        item.classList.toggle('is-expanded', !alreadyExpanded);
    };

    if (toggle) {
        toggle.addEventListener('click', handleToggleClick);
        toggle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                handleToggleClick(event);
            }
        });
        toggle.addEventListener('focus', () => {
            if (desktopQuery.matches && hoverQuery.matches) {
                openDropdown();
            }
        });
    }

    if (hoverQuery.matches) {
        dropdown.addEventListener('mouseenter', () => {
            if (desktopQuery.matches) {
                openDropdown();
            }
        });

        dropdown.addEventListener('mouseleave', () => {
            if (desktopQuery.matches) {
                closeDropdown();
            }
        });
    }

    menuItems.forEach(item => {
        const link = item.querySelector(':scope > a');
        if (!link) {
            return;
        }

            item.addEventListener('mouseenter', () => {
                if (desktopQuery.matches && hoverQuery.matches) {
                    expandMenuItem(item);
                }
            });

            item.addEventListener('mouseleave', () => {
                if (desktopQuery.matches && hoverQuery.matches) {
                    item.classList.remove('is-expanded');
                }
            });

        link.addEventListener('click', (event) => handleMenuItemClick(item, event));

        link.addEventListener('focus', () => {
            if (desktopQuery.matches && hoverQuery.matches) {
                    expandMenuItem(item);
            }
        });

        link.addEventListener('blur', () => {
            if (desktopQuery.matches && hoverQuery.matches) {
                setTimeout(() => {
                    if (!item.contains(document.activeElement)) {
                        item.classList.remove('is-expanded');
                    }
                }, 0);
            }
        });
    });

    if (typeof desktopQuery.addEventListener === 'function') {
        desktopQuery.addEventListener('change', () => {
            closeDropdown();
        });
    } else if (typeof desktopQuery.addListener === 'function') {
        desktopQuery.addListener(() => {
            closeDropdown();
        });
    }

    if (typeof hoverQuery.addEventListener === 'function') {
        hoverQuery.addEventListener('change', () => {
            closeDropdown();
        });
    }

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeDropdown();
        }
    });

    setOpenState(false);
}

// ===== SEARCH & INIT =====
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const headerSearchForm = document.querySelector('.header-search');

    updateBasketCount();
    initFilters();
    applyFilters();
    initBrowseCategories();

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const q = searchInput.value.trim();
                window.location.href = `search-results.html${q ? `?q=${encodeURIComponent(q)}` : ''}`;
            }
        });
    }

    if (headerSearchForm) {
        headerSearchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!searchInput) {
                return;
            }
            const query = searchInput.value.trim();
            window.location.href = `search-results.html${query ? `?q=${encodeURIComponent(query)}` : ''}`;
        });
    }
});

// ===== FILTER FUNCTIONALITY =====
function initFilters() {
    // Category expand/collapse
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            const isExpanded = item.classList.contains('expanded');
            
            // Find subcategories container
            const subcategories = document.querySelector(`.subcategories[data-parent="${category}"]`);

            // Ensure container is measurable for smooth CSS transitions.
            if (subcategories && subcategories.style.display === 'none') {
                subcategories.style.display = 'block';
            }
            
            // Toggle expansion
            if (isExpanded) {
                item.classList.remove('expanded');
            } else {
                item.classList.add('expanded');
            }
        });
    });

    // Subcategory expandable items
    const subcategoryExpandables = document.querySelectorAll('.subcategory-expandable');
    subcategoryExpandables.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = item.classList.contains('expanded');
            const text = item.querySelector('span:last-child').textContent.toLowerCase();
            
            // Find sub-subcategories if they exist
            const subSubcategories = item.nextElementSibling;
            const isSubSubContainer = subSubcategories && subSubcategories.classList.contains('sub-subcategories');

            // Ensure container is measurable for smooth CSS transitions.
            if (isSubSubContainer && subSubcategories.style.display === 'none') {
                subSubcategories.style.display = 'block';
            }
            
            if (isExpanded) {
                item.classList.remove('expanded');
            } else {
                item.classList.add('expanded');
            }
        });
    });

    // Filter accordion sections
    const filterSections = document.querySelectorAll('.filter-section');
    filterSections.forEach(section => {
        const toggle = section.querySelector('.filter-section-toggle');
        const body = section.querySelector('.filter-section-body');
        if (!toggle || !body) {
            return;
        }

        const setExpanded = (state) => {
            section.classList.toggle('is-expanded', state);
            body.style.display = state ? 'block' : 'none';
            toggle.setAttribute('aria-expanded', state ? 'true' : 'false');
        };

        const initialState = section.classList.contains('is-expanded') || toggle.getAttribute('aria-expanded') === 'true';
        setExpanded(initialState);

        toggle.addEventListener('click', () => {
            const nextState = !section.classList.contains('is-expanded');
            setExpanded(nextState);
        });
    });

    // Quick filters toggle state helper
    const quickFilterInputs = Array.from(document.querySelectorAll('.filter-toggle input[type="checkbox"]'));
    const quickTargetMap = new Map();

    quickFilterInputs.forEach(input => {
        const parent = input.closest('.filter-toggle');
        if (!parent) {
            return;
        }

        const targetId = input.dataset.target;
        const targetCheckbox = targetId ? document.getElementById(targetId) : null;
        if (targetCheckbox) {
            quickTargetMap.set(targetId, input);
            if (targetCheckbox.checked !== input.checked) {
                targetCheckbox.checked = input.checked;
            }
        }

        parent.classList.toggle('is-active', input.checked);

        input.addEventListener('change', () => {
            parent.classList.toggle('is-active', input.checked);

            if (targetCheckbox) {
                targetCheckbox.checked = input.checked;
                targetCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                applyFilters();
            }
        });
    });

    const colourSwatches = document.querySelectorAll('.filter-colour-swatch');
    colourSwatches.forEach(button => {
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => {
            const nextState = !button.classList.contains('is-active');
            button.classList.toggle('is-active', nextState);
            button.setAttribute('aria-pressed', nextState ? 'true' : 'false');
            applyFilters();
        });
    });

    // Filter checkboxes
    const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const quickSource = quickTargetMap.get(checkbox.id);
            if (quickSource) {
                quickSource.checked = checkbox.checked;
                const quickLabel = quickSource.closest('.filter-toggle');
                if (quickLabel) {
                    quickLabel.classList.toggle('is-active', quickSource.checked);
                }
            }

            applyFilters();
        });
    });

    // Clear all filters action
    const clearFiltersButton = document.querySelector('.filter-clear-action');
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', () => {
            filterCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });

            quickFilterInputs.forEach(input => {
                input.checked = false;
                const quickLabel = input.closest('.filter-toggle');
                if (quickLabel) {
                    quickLabel.classList.remove('is-active');
                }
            });

            const textSearch = document.querySelector('.text-search-input');
            if (textSearch) {
                textSearch.value = '';
            }

            const sliderElement = document.getElementById('priceRangeSlider');
            if (sliderElement) {
                sliderElement.value = sliderElement.max;
            }

            applyFilters();
        });
    }

    // Price range slider
    const priceSlider = document.getElementById('priceRangeSlider');
    const priceLabel = document.getElementById('priceRangeLabel');
    if (priceSlider && priceLabel) {
        // Initialize bounds from the whole catalogue
        const { min, max } = getRangeFromProducts(PRODUCTS_DB);
        priceSlider.min = min.toFixed(2);
        priceSlider.max = max.toFixed(2);
        priceSlider.step = 0.01;
        priceSlider.value = max.toFixed(2);
        priceLabel.textContent = `£${min.toFixed(2)} - £${priceSlider.value}`;

        priceSlider.addEventListener('input', () => {
            priceLabel.textContent = `£${priceSlider.min} - £${Number(priceSlider.value).toFixed(2)}`;
            applyFilters({ fromSlider: true });
        });
    }

    // Text search
    const textSearch = document.querySelector('.text-search-input');
    if (textSearch) {
        textSearch.addEventListener('input', applyFilters);
    }
}

function applyFilters(options = {}) {
    const { fromSlider = false } = options;

    // Get all selected filters
    const filters = {
        genders: [],
        ageGroups: [],
        sleeves: [],
        necklines: [],
        accreditations: [],
        primaryColours: [],
        colourShades: [],
        cmyk: [],
        pantone: [],
        styles: [],
        features: [],
        sizes: [],
        fabrics: [],
        weights: [],
        fits: [],
        sectors: [],
        sports: [],
        tags: [],
        effects: [],
        priceMin: 0,
        priceMax: document.getElementById('priceRangeSlider')?.value || 100,
        text: document.querySelector('.text-search-input')?.value || ''
    };

    // Collect checked filters
    document.querySelectorAll('input[name="gender"]:checked').forEach(cb => {
        filters.genders.push(cb.value);
    });
    document.querySelectorAll('input[name="age-group"]:checked').forEach(cb => {
        filters.ageGroups.push(cb.value);
    });
    document.querySelectorAll('input[name="sleeve"]:checked').forEach(cb => {
        filters.sleeves.push(cb.value);
    });
    document.querySelectorAll('input[name="neckline"]:checked').forEach(cb => {
        filters.necklines.push(cb.value);
    });
    document.querySelectorAll('input[name="accreditations"]:checked').forEach(cb => {
        filters.accreditations.push(cb.value);
    });
    document.querySelectorAll('.filter-colour-swatch.is-active').forEach(btn => {
        const colour = btn.dataset.colour;
        if (colour) {
            filters.primaryColours.push(colour);
        }
    });
    document.querySelectorAll('input[name="colour-shade"]:checked').forEach(cb => {
        filters.colourShades.push(cb.value);
    });
    document.querySelectorAll('input[name="cmyk"]:checked').forEach(cb => {
        filters.cmyk.push(cb.value);
    });
    document.querySelectorAll('input[name="pantone"]:checked').forEach(cb => {
        filters.pantone.push(cb.value);
    });
    document.querySelectorAll('input[name="style"]:checked').forEach(cb => {
        filters.styles.push(cb.value);
    });
    document.querySelectorAll('input[name="features"]:checked').forEach(cb => {
        filters.features.push(cb.value);
    });
    document.querySelectorAll('input[name="size"]:checked').forEach(cb => {
        filters.sizes.push(cb.value);
    });
    document.querySelectorAll('input[name="fabric"]:checked').forEach(cb => {
        filters.fabrics.push(cb.value);
    });
    document.querySelectorAll('input[name="weight"]:checked').forEach(cb => {
        filters.weights.push(cb.value);
    });
    document.querySelectorAll('input[name="fit"]:checked').forEach(cb => {
        filters.fits.push(cb.value);
    });
    document.querySelectorAll('input[name="related-sector"]:checked').forEach(cb => {
        filters.sectors.push(cb.value);
    });
    document.querySelectorAll('input[name="related-sport"]:checked').forEach(cb => {
        filters.sports.push(cb.value);
    });
    document.querySelectorAll('input[name="tag"]:checked').forEach(cb => {
        filters.tags.push(cb.value);
    });
    document.querySelectorAll('input[name="effect"]:checked').forEach(cb => {
        filters.effects.push(cb.value);
    });

    // First, filter by non-price criteria to derive the available price range
    let filtered = PRODUCTS_DB.filter(p => {
        const textMatch = filters.text
            ? (p.name.toLowerCase().includes(filters.text.toLowerCase()) || p.code.toLowerCase().includes(filters.text.toLowerCase()))
            : true;

        return textMatch;
    });

    // Update price slider bounds based on the current subset (unless the user is dragging the slider)
    const slider = document.getElementById('priceRangeSlider');
    const label = document.getElementById('priceRangeLabel');
    if (slider && label) {
        const { min, max } = getRangeFromProducts(filtered);
        const prevValue = toPriceNumber(slider.value);

        slider.min = min.toFixed(2);
        slider.max = max.toFixed(2);
        slider.step = 0.01;

        if (!fromSlider) {
            slider.value = Math.min(prevValue || max, max).toFixed(2);
        }

        // Keep label in sync with the latest bounds/value
        label.textContent = `£${slider.min} - £${Number(slider.value).toFixed(2)}`;
        filters.priceMin = toPriceNumber(slider.min);
        filters.priceMax = toPriceNumber(slider.value);
    } else {
        filters.priceMax = toPriceNumber(filters.priceMax);
    }

    // Apply price filter
    filtered = filtered.filter(p => {
        const price = toPriceNumber(p.price);
        return price >= filters.priceMin && price <= filters.priceMax;
    });

    renderProducts(filtered);
}
