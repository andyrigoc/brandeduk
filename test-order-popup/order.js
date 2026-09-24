// order.js - Updated for real product data

// Elegant custom alert (replaces browser alert())
window.showAlert = function(message, btnLabel) {
    btnLabel = btnLabel || 'OK';
    // Inject CSS once
    if (!document.getElementById('_alertModalStyle')) {
        var s = document.createElement('style');
        s.id = '_alertModalStyle';
        s.textContent = [
            '#_alertModal{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);animation:_amFadeIn 0.18s ease}',
            '@keyframes _amFadeIn{from{opacity:0}to{opacity:1}}',
            '#_alertModal .am-card{background:#fff;border-radius:20px;padding:36px 40px 32px;text-align:center;max-width:340px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.18);animation:_amSlideIn 0.22s cubic-bezier(0.34,1.56,0.64,1)}',
            '@keyframes _amSlideIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}',
            '#_alertModal .am-icon{font-size:36px;margin-bottom:12px}',
            '#_alertModal .am-msg{font-size:15px;font-weight:600;color:#1f2937;margin-bottom:24px;line-height:1.5}',
            '#_alertModal .am-btn{background:#f97316;color:#fff;border:none;border-radius:12px;padding:13px 32px;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:0.3px;transition:background 0.2s}',
            '#_alertModal .am-btn:hover{background:#ea6c0a}'
        ].join('');
        document.head.appendChild(s);
    }
    var overlay = document.createElement('div');
    overlay.id = '_alertModal';
    overlay.innerHTML = '<div class="am-card"><div class="am-icon">&#9888;&#65039;</div><div class="am-msg">' + message + '</div><button class="am-btn">' + btnLabel + '</button></div>';
    document.body.appendChild(overlay);
    var close = function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };
    overlay.querySelector('.am-btn').addEventListener('click', close);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
};

// Global variables
window.current = 0;
window.selectedColour = null;
window.quantities = {};
window.productData = null;

let total = 5; // 5 pages now

// Sample product data (will be loaded from API)
const sampleProduct = {
    code: "GD002",
    name: "Ultra Cotton adult t-shirt",
    brand: "GILDAN",
    price: 5.90,
    description: "Classic heavyweight t-shirt made from premium US cotton. Perfect for printing and embroidery. Durable, comfortable, and ideal for workwear.",
    fabric: "100% US Cotton. Ash: 99% US Cotton, 1% Polyester",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    colours: [
        {name: "Ash", hex: "#E5E5E5"},
        {name: "Black", hex: "#000000"},
        {name: "Navy", hex: "#001F3F"},
        {name: "Royal", hex: "#0074D9"},
        {name: "Red", hex: "#FF4136"},
        {name: "White", hex: "#FFFFFF"},
        {name: "Charcoal", hex: "#555555"},
        {name: "Sport Grey", hex: "#AAAAAA"}
    ],
    image: "https://i.postimg.cc/Y4JNXxv1/GD067-Charcoal-FT.jpg"
};

// Initialize
$(document).ready(function() {
    // Only load sample data if running standalone (not integrated)
    if (!window.openOrderPopup) {
        loadProductData();
        setupSizeQuantityControls();
        setupUploadBox();
    }
});

// Navigation function - exposed globally
window.goToPage = function(index) {
    // Validation before moving forward
    if (index > window.current) {
        // Page 2 (colour) -> Page 3: Must select colour
        if (window.current === 1 && !window.selectedColour) {
            window.showAlert('Please select a colour', 'Select Colour');
            return;
        }
        // Page 3 (sizes) -> Page 4: Must select at least one quantity
        if (window.current === 2) {
            syncPage3Quantities();
            const totalQty = Object.values(window.quantities).reduce((a, b) => a + (b || 0), 0);
            if (totalQty === 0) {
                window.showAlert('Please select at least one size/quantity', 'Select Sizes');
                return;
            }
        }
    }
    
    const target = -(index * 100) + "%";

    var closeButton = document.querySelector('#orderPopup .order_close_btn');
    var backToColourButton = document.getElementById('p3BackToColour');
    if (closeButton) closeButton.style.display = '';
    if (backToColourButton) backToColourButton.style.display = index === 2 ? 'inline-flex' : 'none';
    
    // When going to page 3, populate it
    if (index === 2) {
        populatePage3();
    }
    if (index === 3) {
        fillPage4Summary();
    }
    // When going to page 5, populate it
    if (index === 4) {
        populatePage5();
    }
    
    $(".track").stop().animate(
        { left: target },
        {
            duration: 700,
            easing: "easeInOutBack"
        }
    );
    
    window.current = index;
};

// Load product data - exposed globally for integration
window.loadProductData = function() {
    // In real implementation, get from URL params or API
    window.productData = sampleProduct;
    
    $("#productTitle").text(window.productData.name);
    $("#productCode").text(window.productData.code);
    $("#productName").text(window.productData.name);
    $("#productBrand").text(window.productData.brand);
    $("#productPrice").text("£" + window.productData.price.toFixed(2));
    $("#productFabric").text(window.productData.fabric);
    $("#productSizes").text(window.productData.sizes.join(", "));
    $("#productMainImage").attr("src", window.productData.image);
    
    // Set description if available
    if (window.productData.description) {
        $("#productDescription").text(window.productData.description);
    }
    
    // Set colour count
    if (window.productData.colours) {
        $("#productColourCount").text(window.productData.colours.length + " colours");
    }
    
    // Load colours
    loadColours();
};

// Load colour swatches
function loadColours() {
    const colourGrid = $("#colourGrid");
    colourGrid.empty();
    
    if (!window.productData || !window.productData.colours) return;
    
    window.productData.colours.forEach(function(colour) {
        const swatch = $(`
            <div class="colour-swatch" 
                 data-colour="${colour.name}" 
                 style="background-color: ${colour.hex}; ${colour.hex === '#FFFFFF' ? 'border: 3px solid #e5e7eb;' : ''}"
                 title="${colour.name}">
            </div>
        `);
        
        swatch.click(function() {
            $(".colour-swatch").removeClass("selected");
            $(this).addClass("selected");
            window.selectedColour = colour.name;
        });
        
        colourGrid.append(swatch);
    });
}

// Setup size/quantity controls - exposed globally
window.setupSizeQuantityControls = function() {
    const grid = $("#sizeQuantityGrid");
    grid.empty();
    
    if (!window.productData || !window.productData.sizes) return;
    
    window.productData.sizes.forEach(function(size) {
        window.quantities[size] = 0;
        
        const box = $(`
            <div class="size-box">
                <div class="size-label">${size}</div>
                <div class="qty-controls">
                    <button class="qty-btn qty-minus" data-size="${size}">−</button>
                    <span class="qty-value" data-size="${size}">0</span>
                    <button class="qty-btn qty-plus" data-size="${size}">+</button>
                </div>
            </div>
        `);
        
        grid.append(box);
    });
};

// Setup quantity button handlers (only once)
$(document).on("click", ".qty-minus", function() {
    const size = $(this).data("size");
    if (window.quantities[size] > 0) {
        window.quantities[size]--;
        updateQuantityDisplay(size);
    }
});

$(document).on("click", ".qty-plus", function() {
    const size = $(this).data("size");
    window.quantities[size]++;
    updateQuantityDisplay(size);
});

// Update quantity display
function updateQuantityDisplay(size) {
    $(`.qty-value[data-size="${size}"]`).text(window.quantities[size]);
    updateTotals();
}

// Update totals
function updateTotals() {
    if (!window.productData) return;
    
    let totalPieces = 0;
    Object.values(window.quantities).forEach(qty => totalPieces += qty);
    
    const totalCost = totalPieces * window.productData.price;
    
    $("#totalPieces").text(totalPieces);
    $("#totalCost").text("£" + totalCost.toFixed(2));
}

// Setup upload box - exposed globally
window.setupUploadBox = function() {
    $("#uploadBox").off("click").click(function() {
        $("#logoUpload").click();
    });
    
    $("#logoUpload").off("change").change(function() {
        if (this.files && this.files[0]) {
            $("#uploadBox").html(`
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                <p style="color:#10b981">Logo uploaded: ${this.files[0].name}</p>
            `).css("border-color", "#10b981");
        }
    });
};

// Expose productData setter for integration
window.setProductData = function(data) {
    window.productData = data;
};

// Populate page 3 with the selected product, prices, sizes and quantities.
function populatePage3() {
    var product = window.productData || window.currentOrderProduct;
    if (!product) return;

    var selectedItem = document.querySelector('.colour-swatch-item.selected');
    var productColours = (product.colors || product.colours || []).filter(function(colour) {
        return String(colour && colour.name || '').trim().toLowerCase() !== 'model';
    });

    $('#p3ProductTitle').text(product.name || 'Product');
    $('#p3ProductBrand').text(product.brand || '');
    $('#p3ProductDescription').text(product.description || product.features || 'Classic garment with a soft feel and reliable everyday comfort.');

    var galleryImages = productColours.map(function(colour) {
        return colour.main || colour.image || colour.thumb || product.image || '';
    }).filter(Boolean);
    var selectedImage = selectedItem ? selectedItem.dataset.img : '';
    galleryImages = [selectedImage].concat(galleryImages).filter(function(image, index, images) {
        return image && images.indexOf(image) === index;
    }).slice(0, 4);
    if (!galleryImages.length && product.image) galleryImages = [product.image];
    var galleryIndex = 0;
    var galleryImage = galleryImages[galleryIndex] || product.image || product.mainImage || '';
    $('#p3ProductImage').attr({ src: galleryImage, alt: (product.name || 'Selected product') + ' in ' + (window.selectedColour || '') });

    var dots = $('#p3GalleryDots').empty();
    galleryImages.forEach(function(image, index) {
        $('<span class="p3-gallery-dot"></span>').toggleClass('active', index === galleryIndex).appendTo(dots);
    });
    $('#p3GalleryPrev').off('click').on('click', function() {
        if (galleryImages.length < 2) return;
        galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
        $('#p3ProductImage').attr('src', galleryImages[galleryIndex]);
        dots.children().removeClass('active').eq(galleryIndex).addClass('active');
    });
    $('#p3GalleryNext').off('click').on('click', function() {
        if (galleryImages.length < 2) return;
        galleryIndex = (galleryIndex + 1) % galleryImages.length;
        $('#p3ProductImage').attr('src', galleryImages[galleryIndex]);
        dots.children().removeClass('active').eq(galleryIndex).addClass('active');
    });

    // Keep the existing selected-colour hooks available for the rest of the flow.
    if (selectedItem) {
        var imgUrl = selectedItem.dataset.img;
        var colourName = selectedItem.dataset.name || selectedItem.dataset.colour;
        
        $('#selectedColourBarName').text(colourName);
        $('#p3PreviewColour').text('Colour: ' + colourName);
        $('#selectedColourThumb').css({'background-image': 'url(' + imgUrl + ')', 'background-size': 'cover', 'background-position': 'center', 'width': '32px', 'height': '32px', 'border-radius': '4px', 'display': 'inline-block', 'flex-shrink': '0'});
        $('#selectedColourViewLink').off('click').on('click', function(e) {
            e.preventDefault();
            openColorZoom(imgUrl, colourName);
        });
    }
    
    // Populate discount tiers from priceBreaks
    var tiers = product.priceBreaks || product.tiers || product.priceTiers || [];
    var tiersContainer = $('#p3DiscountTiers');
    tiersContainer.empty();

    // Build complete quantity ranges with prices for the PC reference cards.
    var tierData = [];
    if (tiers.length > 0) {
        tiers.forEach(function(tier, index) {
            var min = tier.min || tier.qty || 1;
            var nextTier = tiers[index + 1];
            var nextMin = nextTier ? (nextTier.min || nextTier.qty) : null;
            var max = tier.max || (nextMin ? nextMin - 1 : 99999);
            var pct = tier.percentage || tier.discount || tier.pct || 0;
            var price = parseFloat(tier.price || tier.unitPrice || product.price || product.basePrice) || 0;
            tierData.push({
                min: min,
                max: max,
                price: price,
                pct: parseFloat(pct).toFixed(2).replace(/\.00$/, '')
            });
        });
    } else {
        tierData = [
            { min: 1, max: 9, price: parseFloat(product.price || product.basePrice) || 0, pct: '0' },
            { min: 10, max: 24, price: parseFloat(product.price || product.basePrice) || 0, pct: '5' },
            { min: 25, max: 49, price: parseFloat(product.price || product.basePrice) || 0, pct: '10' },
            { min: 50, max: 99, price: parseFloat(product.price || product.basePrice) || 0, pct: '15' },
            { min: 100, max: 249, price: parseFloat(product.price || product.basePrice) || 0, pct: '20' }
        ];
    }

    // Store for live highlight
    window._p3TierData = tierData;

    tierData.forEach(function(t) {
                var range = t.max && t.max < 99999 ? t.min + '-' + t.max : t.min + '+';
                var save = parseFloat(t.pct) || 0;
        tiersContainer.append(
            '<div class="discount-tier-card" data-min="' + t.min + '" data-max="' + t.max + '">' +
                            '<div class="tier-qty">' + range + '</div>' +
                            '<div class="tier-price">£' + Number(t.price || 0).toFixed(2) + '</div>' +
                            '<div class="tier-label">ex. VAT</div>' +
                            (save > 0 ? '<div class="tier-save">SAVE ' + save + '%</div>' : '') +
            '</div>'
        );
    });

    // Run once immediately in case qty already set
    updateP3TierHighlight();
    
    // Populate size grid
    var sizes = product.sizes || ['S','M','L','XL','2XL','3XL'];
    var basePrice = tierData.length
        ? Number(tierData[0].price) || 0
        : Number(product.price || product.basePrice) || 0;
    var grid = $('#sizeQtyGridP3');
    grid.empty();
    grid.toggleClass('is-multi', sizes.length > 1);
    
    $('#p3BasePrice').text('£' + parseFloat(basePrice).toFixed(2));
    
    sizes.forEach(function(size) {
        var stock = '';
        if (product.colors || product.colours) {
            var colours = product.colors || product.colours;
            var sel = colours.find(function(c) { return (c.name || '') === window.selectedColour; });
            if (sel && sel.sizes && sel.sizes[size]) stock = sel.sizes[size].stock || '';
        }
        
        var box = $('<div class="size-quantity__row size-qty-box-p3" data-size="' + size + '" data-selected="false"></div>');
        box.html('<label class="size-quantity__label size-name-p3" for="quantity-' + size + '">' + size + '</label>' +
            (stock ? '<div class="size-stock-p3">Stock: <strong>' + stock + '</strong></div>' : '') +
            '<div class="size-quantity__counter qty-controls">' +
            '<button type="button" class="size-quantity__button qty-btn minus" data-action="decrease" data-size="' + size + '" aria-label="Remove one ' + size + '" disabled>−</button>' +
            '<input type="number" class="size-quantity__input qty-input" id="quantity-' + size + '" data-size="' + size + '" value="0" min="0" max="9999" step="1" inputmode="numeric" aria-label="Quantity for size ' + size + '">' +
            '<button type="button" class="size-quantity__button qty-btn plus" data-action="increase" data-size="' + size + '" aria-label="Add one ' + size + '">+</button>' +
            '</div>');
        grid.append(box);
    });
}

$(document).on("click", ".next", function(){
    if(window.current < total - 1){
        window.goToPage(window.current + 1);
    }
});

$(document).on("click", ".back", function(){
    if(window.current > 0){
        window.goToPage(window.current - 1);
    }
});

// Returning from bfcache (e.g. browser Back after the customizer redirects to
// basket.html) can leave the sliding .track mid-animation with no visible
// Next/Back button. Snap it back to whatever page window.current says is
// active, with no animation, so navigation always works immediately.
window.addEventListener("pageshow", function() {
    if (typeof window.current !== "number") return;
    var target = -(window.current * 100) + "%";
    $(".track").stop(true, true).css("left", target);
});

// Existing basket rows are one-per-size (see basket.html normalizeBasket, the
// canonical storage shape). Re-adding the same product/colour/size must top
// up that row's qty instead of creating a duplicate line: e.g. 5 already in
// the basket + 5 selected here = 10 in that single row. Editing quantity
// directly on the basket page is unaffected — that still sets the value.
function findExistingBasketRow(basket, code, colourName, size) {
    return basket.findIndex(function(entry) {
        var entryCode = entry.code || entry.productCode || '';
        var entryColour = entry.color || entry.colour || entry.selectedColorName || '';
        return entryCode === code && entryColour === colourName && String(entry.size || '') === String(size);
    });
}

function savePage3SelectionToBasket() {
    var product = window.productData;
    if (!product) return false;

    var sizeQuantities = {};
    var newQty = 0;
    $('#sizeQtyGridP3 .qty-input').each(function() {
        var qty = parseInt($(this).val()) || 0;
        if (qty > 0) {
            sizeQuantities[$(this).data('size')] = qty;
            newQty += qty;
        }
    });

    if (newQty === 0) {
        window.showAlert('Please select at least one size/quantity', 'Select Sizes');
        return false;
    }

    var selectedItem = document.querySelector('.colour-swatch-item.selected');
    var colourName = selectedItem ? (selectedItem.dataset.name || selectedItem.dataset.colour) : (window.selectedColour || '');
    var colourImg = selectedItem ? selectedItem.dataset.img : '';
    var priceBreaks = (product.priceBreaks || product.tiers || product.priceTiers || []).map(function(tier) { return Object.assign({}, tier); });
    var productCode = product.code || product.sku || '';
    var basePrice = parseFloat(product.basePrice || product.price) || 0;

    var basket = [];
    try { basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]'); } catch(e) {}

    // Bulk price tier is based on the combined quantity for this product +
    // colour across every size (existing rows plus this new selection).
    var existingColourRows = basket.filter(function(entry) {
        var entryCode = entry.code || entry.productCode || '';
        var entryColour = entry.color || entry.colour || entry.selectedColorName || '';
        return entryCode === productCode && entryColour === colourName;
    });
    var existingColourQty = existingColourRows.reduce(function(sum, entry) { return sum + (parseInt(entry.qty, 10) || 0); }, 0);
    var combinedColourQty = existingColourQty + newQty;

    var unitPrice = basePrice;
    priceBreaks.forEach(function(tier) {
        var min = Number(tier.min || tier.minQty || tier.qty || 0);
        var max = Number(tier.max || tier.maxQty || 999999);
        var tierPrice = Number(tier.price || tier.unitPrice);
        if (combinedColourQty >= min && combinedColourQty <= max && tierPrice > 0) unitPrice = tierPrice;
    });
    existingColourRows.forEach(function(entry) { entry.unitPrice = unitPrice; });

    Object.keys(sizeQuantities).forEach(function(size) {
        var addQty = sizeQuantities[size];
        var existingIndex = findExistingBasketRow(basket, productCode, colourName, size);

        if (existingIndex !== -1) {
            basket[existingIndex].qty = (parseInt(basket[existingIndex].qty, 10) || 0) + addQty;
            basket[existingIndex].unitPrice = unitPrice;
        } else {
            basket.push({
                id: (productCode + '-' + colourName + '-' + size).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                code: productCode,
                name: product.name || '',
                brand: product.brand || '',
                color: colourName,
                colour: colourName,
                colorImage: colourImg,
                colourImg: colourImg,
                image: colourImg || product.image || '',
                size: size,
                qty: addQty,
                price: parseFloat(product.price) || 0,
                basePrice: basePrice,
                unitPrice: unitPrice,
                priceBreaks: priceBreaks
            });
        }
    });

    localStorage.setItem('quoteBasket', JSON.stringify(basket));
    window.dispatchEvent(new Event('basketUpdated'));

    return {
        item: { colour: colourName, code: productCode },
        sizes: sizeQuantities,
        totalQty: newQty
    };
}

// Add to Quote handler — page 3 button → go to Page 4 (logo)
$(document).on("click", "#btnAddToQuote", function() {
    var savedSelection = savePage3SelectionToBasket();
    if (!savedSelection) return;

    var sizeList = Object.entries(savedSelection.sizes).map(function(e){ return e[0]+' × '+e[1]; }).join(', ');
    $('#successSubtitle').text(savedSelection.item.colour + ' · ' + savedSelection.totalQty + ' items (' + sizeList + ')');
    $('#btnAddToQuote').hide();
    $('#addQuoteSuccess').fadeIn(300);
});

$(document).on("click", "#btnBuyPlain", function() {
    var savedSelection = savePage3SelectionToBasket();
    if (!savedSelection) return;

    var sizeList = Object.entries(savedSelection.sizes).map(function(e){ return e[0]+' × '+e[1]; }).join(', ');
    $('#successSubtitle').text(savedSelection.item.colour + ' · ' + savedSelection.totalQty + ' items (' + sizeList + ')');
    $('#addQuoteSuccess').fadeIn(300);
});

$(document).on("click", "#btnCustomize", function() {
    if (!savePage3SelectionToBasket()) return;

    $('#addQuoteSuccess').hide();
    window.goToPage(3);
});

$(document).on("click", "#p3ContinueCustomise", function() {
    $("#btnCustomize").trigger("click");
});

function fillPage4Summary() {
    var product = window.productData || window.currentOrderProduct || {};
    var name = product.name || '';
    var code = product.code || product.sku || '';
    var colour = window.selectedColour || '';
    var title = document.querySelector('.p4-nav-title strong');
    if (title) title.textContent = page4CustomiseTitle(product);
    $('#p4SummaryCode, #p4ProductCode').text(code);
    $('#p4SummaryName, #p4ProductName').text(name);
    $('#p4SelectedName').text(colour);
    var img = $('#p3ProductImage').attr('src') || product.image || '';
    if (img) $('#p4SummaryImage').attr('src', img);
    var brand = document.getElementById('p3BrandLogo');
    var summaryBrand = document.getElementById('p4SummaryBrand');
    if (brand && summaryBrand && brand.getAttribute('src')) {
        summaryBrand.src = brand.src;
        summaryBrand.style.display = '';
    }
    var swatch = document.getElementById('p4SelectedSwatch');
    if (swatch && img) swatch.style.backgroundImage = 'url(' + img + ')';
    var ex = parseFloat(String($('#p3TotalCost').text() || '0').replace(/[^0-9.]/g, '')) || 0;
    var vat = ex * 0.2;
    var money = function (n) { return '£' + n.toFixed(2); };
    var qty = p4ProductQty();
    $('#p4SumProducts, #p4SumEx').text(money(ex));
    $('#p4SumQty').text(qty + (qty === 1 ? ' item' : ' items'));
    $('#p4SumLogo, #p4SumSetup').text(money(0));
    $('#p4SumVat').text(money(vat));
    $('#p4SumInc').text(money(ex + vat));
    p4ReadLibrary();
    p4RenderPreviousLogos();
    loadPage4PositionImages(product);
}

var P4_METHOD_RANK = { yes: 0, poa: 1, no: 2 };
var P4_CATEGORY_METHODS = {
    tshirts: { dtf: 'yes', screen: 'yes', embroidery: 'poa' },
    polos: { dtf: 'yes', screen: 'yes', embroidery: 'yes' },
    sweatshirts: { dtf: 'yes', screen: 'yes', embroidery: 'yes' },
    hoodies: { dtf: 'yes', screen: 'yes', embroidery: 'yes' },
    shirts: { dtf: 'yes', screen: 'poa', embroidery: 'yes' },
    fleece: { dtf: 'poa', screen: 'no', embroidery: 'yes' },
    jackets: { dtf: 'poa', screen: 'no', embroidery: 'yes' },
    'gilets-body-warmers': { dtf: 'poa', screen: 'no', embroidery: 'yes' },
    'safety-vests': { dtf: 'yes', screen: 'yes', embroidery: 'poa' },
    trousers: { dtf: 'poa', screen: 'no', embroidery: 'yes' },
    shorts: { dtf: 'poa', screen: 'no', embroidery: 'yes' },
    sweatpants: { dtf: 'poa', screen: 'no', embroidery: 'poa' },
    aprons: { dtf: 'yes', screen: 'yes', embroidery: 'yes' },
    bags: { dtf: 'yes', screen: 'yes', embroidery: 'yes' },
    caps: { dtf: 'poa', screen: 'no', embroidery: 'yes' },
    hats: { dtf: 'poa', screen: 'no', embroidery: 'yes' },
    beanies: { dtf: 'no', screen: 'no', embroidery: 'yes' }
};
var P4_NAME_METHOD_OVERRIDES = [
    { pattern: /premium|heavy|ultra|ring ?spun/i, rules: { embroidery: 'yes' } },
    { pattern: /performance|technical|polyester|breathable|active|training/i, rules: { screen: 'poa' } },
    { pattern: /oxford|formal|dress shirt|blouse/i, rules: { dtf: 'poa', screen: 'no' } },
    { pattern: /\bknit|jumper|cardigan/i, rules: { dtf: 'poa', screen: 'no', embroidery: 'yes' } },
    { pattern: /\bwool\b/i, rules: { dtf: 'no', screen: 'no', embroidery: 'poa' } },
    { pattern: /softshell|windbreaker|wind ?shirt|bomber/i, rules: { dtf: 'yes' } },
    { pattern: /waterproof|padded|puffer|parka|quilted|insulated|down\b/i, rules: { dtf: 'poa', screen: 'no' } },
    { pattern: /baby|bodysuit/i, rules: { embroidery: 'no' } }
];
var P4_POSITION_METHODS = {
    'large-front': { embroidery: 'no' },
    'large-front-above-pocket': { embroidery: 'poa' },
    'large-back': { embroidery: 'no' },
    'lower-front': { embroidery: 'poa' },
    'lower-back': { embroidery: 'poa' }
};

function p4WorseRule(first, second) {
    return (P4_METHOD_RANK[second] || 0) > (P4_METHOD_RANK[first] || 0) ? second : first;
}

function p4BetterRule(first, second) {
    return (P4_METHOD_RANK[second] || 0) < (P4_METHOD_RANK[first] || 0) ? second : first;
}

function customizationConfigTarget(product) {
    var text = [product.name, product.productType, product.category, product.type].join(' ').toLowerCase();
    if (/beanie|bobble hat|knit(?:ted)? hat|wool hat/.test(text)) {
        return { slug: 'beanies', subtype: /bobble|pom/.test(text) ? 'bobble' : 'cuffed' };
    }
    if (/fedora|trilby|bucket hat|wide[\s-]?brim|sun hat/.test(text)) return { slug: 'hats', subtype: 'bucket' };
    if (/\bcap\b|baseball|snapback|trucker|visor/.test(text)) {
        return { slug: 'caps', subtype: /trucker/.test(text) ? 'trucker' : 'baseball' };
    }
    if (/polo/.test(text)) return { slug: 'polos', subtype: '' };
    if (/hoodie|hooded|zoodie/.test(text)) return { slug: 'hoodies', subtype: '' };
    if (/sweatshirt/.test(text)) return { slug: 'sweatshirts', subtype: '' };
    if (/fleece/.test(text)) return { slug: 'fleece', subtype: '' };
    if (/soft[\s-]?shell/.test(text)) return { slug: 'softshells', subtype: '' };
    if (/gilet|body[\s-]?warmer/.test(text)) return { slug: 'gilets-body-warmers', subtype: '' };
    if (/hi[\s-]?vis|safety vest|waistcoat/.test(text)) return { slug: 'safety-vests', subtype: 'waistcoat' };
    if (/jacket|parka|coat|anorak/.test(text)) return { slug: 'jackets', subtype: '' };
    if (/apron/.test(text)) return { slug: 'aprons', subtype: '' };
    if (/\bbag\b|tote|backpack|rucksack|holdall/.test(text)) return { slug: 'bags', subtype: '' };
    if (/\bshirt|\bblouse/.test(text) && !/t[\s-]?shirt/.test(text)) return { slug: 'shirts', subtype: '' };
    if (/t[\s-]?shirt|\btee\b/.test(text)) return { slug: 'tshirts', subtype: '' };
    return { slug: 'tshirts', subtype: '' };
}

function page4CustomiseTitle(product) {
    var slug = customizationConfigTarget(product || {}).slug;
    if (slug === 'beanies') return 'Customise your beanie';
    if (slug === 'tshirts') return 'Customise your t-shirt';
    if (slug === 'polos') return 'Customise your polo';
    if (slug === 'hoodies') return 'Customise your hoodie';
    return 'Customise your product';
}

function page4CategoryRules(product) {
    var slug = customizationConfigTarget(product || {}).slug;
    var rules = Object.assign({ dtf: 'yes', screen: 'yes', embroidery: 'yes' }, P4_CATEGORY_METHODS[slug] || {});
    var name = (product && product.name) || '';
    P4_NAME_METHOD_OVERRIDES.forEach(function (item) {
        if (item.pattern.test(name)) Object.assign(rules, item.rules);
    });
    return rules;
}

function page4AllowedMethods(product, position) {
    var category = page4CategoryRules(product);
    var slug = String(position.slug || '').toLowerCase();
    var posRules = P4_POSITION_METHODS[slug] || {};
    var matrix = {
        embroidery: p4WorseRule(category.embroidery, posRules.embroidery || 'yes'),
        print: p4WorseRule(p4BetterRule(category.dtf, category.screen), posRules.print || 'yes')
    };

    function fromApi(name) {
        var found = null;
        (position.methods || []).forEach(function (method) {
            var key = String(method.method || '').toLowerCase();
            if (name === 'print' && (key === 'print' || key === 'dtf' || key === 'screen')) found = method;
            if (name === 'embroidery' && key === 'embroidery') found = method;
        });
        if (matrix[name] === 'no') return { status: 'no', price: null };
        if (!found || found.enabled === false) return { status: matrix[name] === 'yes' ? 'yes' : matrix[name], price: null };
        var hasPrice = found.price !== null && found.price !== undefined && found.price !== '' && !isNaN(Number(found.price));
        return {
            status: hasPrice ? 'yes' : (matrix[name] === 'no' ? 'no' : 'poa'),
            price: hasPrice ? Number(found.price) : null
        };
    }

    return {
        embroidery: fromApi('embroidery'),
        print: fromApi('print')
    };
}

function page4MethodButton(kind, info) {
    if (!info || info.status === 'no') return '';
    var isPoa = info.status === 'poa';
    var label = kind === 'embroidery' ? 'EMBROIDERY' : 'PRINT';
    var price = isPoa ? 'POA' : ('£' + Number(info.price || 0).toFixed(2));
    var cls = 'price-badge price-' + (kind === 'embroidery' ? 'emb' : 'print') + (isPoa ? ' poa-badge' : '');
    var style = kind === 'print' && !isPoa ? ' style="background:#1769D2!important;background-image:none!important"' : '';
    return '<button type="button" class="' + cls + '" data-method="' + kind + '" data-default-label="' + label + '" data-default-price="' + price + '"' + style + '>' +
        '<span class="price-label">' + label + (isPoa ? ' · POA' : '') + '</span>' +
        '<span class="price-value">' + price + '</span></button>';
}

function p4PaintPrintButtons() {
    document.querySelectorAll('#p4PositionOptions .position-prices').forEach(function (wrap) {
        var print = wrap.querySelector('.price-print:not(.poa-badge)');
        if (!print) return;
        print.style.setProperty('background', '#1769D2', 'important');
        print.style.setProperty('background-color', '#1769D2', 'important');
        print.style.setProperty('background-image', 'none', 'important');
    });
}

function page4PositionCard(product, position) {
    var slug = String(position.slug || position.label || '').replace(/"/g, '');
    var methods = page4AllowedMethods(product, position);
    var embroideryPrice = methods.embroidery.price != null ? methods.embroidery.price.toFixed(2) : '0';
    var printPrice = methods.print.price != null ? methods.print.price.toFixed(2) : '0';
    return '<div class="position-card" data-position="' + slug + '" data-embroidery="' + embroideryPrice + '" data-print="' + printPrice + '">' +
        '<div class="position-preview"><img class="position-placeholder" alt=""></div>' +
        '<div class="position-card-header"><label class="position-checkbox"><input type="checkbox" name="p4position" value="' + slug + '"><span></span></label></div>' +
        '<div class="position-prices">' + page4MethodButton('embroidery', methods.embroidery) + page4MethodButton('print', methods.print) + '</div>' +
        '<div class="p4-logo-under" hidden><img alt="Logo"><button type="button" class="p4-logo-remove" aria-label="Remove logo">&times;</button></div></div>';
}

var page4PositionRequest = 0;
function loadPage4PositionImages(product) {
    var host = document.getElementById('p4PositionOptions');
    if (!host) return;
    var target = customizationConfigTarget(product || {});
    var requestId = ++page4PositionRequest;
    var url = 'https://api.brandeduk.com/api/customization-config/' + encodeURIComponent(target.slug);
    if (target.subtype) url += '?subtype=' + encodeURIComponent(target.subtype);
    fetch(url)
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (body) {
            if (requestId !== page4PositionRequest || !body) return;
            var config = body.data || body;
            var positions = (config.positions || []).filter(function (position) {
                return position && position.isActive !== false && (position.imageUrl || position.image_url);
            });
            if (!positions.length) return;
            host.innerHTML = positions.map(function (position) { return page4PositionCard(product, position); }).join('');
            p4PaintPrintButtons();
            host.querySelectorAll('.position-card').forEach(function (card, index) {
                var position = positions[index];
                var label = position.label || position.slug || '';
                var image = position.imageUrl || position.image_url || '';
                var name = card.querySelector('.position-checkbox span');
                var photo = card.querySelector('.position-placeholder');
                if (name) name.textContent = label;
                if (photo) {
                    photo.src = image;
                    photo.alt = label;
                }
            });
            p4LoadBackendPrices().then(function () {
                p4ApplyBackendPricesToCards();
                p4PaintPrintButtons();
                Object.keys(window.p4Assignments || {}).forEach(function (pos) {
                    var assignment = window.p4Assignments[pos];
                    p4AssignLogo(pos, assignment.dataUrl, assignment.method, assignment.filename, assignment.sourceMethod);
                });
                p4RenderPreviousLogos();
                p4UpdateSummary();
            });
        })
        .catch(function () {});
}

window.p4Assignments = window.p4Assignments || {};
window.p4LogoLibrary = window.p4LogoLibrary || [];
window.p4PendingUpload = null;

function p4EnsureFileInput() {
    var input = document.getElementById('p4LogoFileInput');
    if (input) return input;
    input = document.createElement('input');
    input.type = 'file';
    input.id = 'p4LogoFileInput';
    input.accept = 'image/*,.pdf,.svg,.eps,.ai';
    input.hidden = true;
    document.body.appendChild(input);
    return input;
}

function p4ReadLibrary() {
    try {
        var parsed = JSON.parse(sessionStorage.getItem('toolReusableLogos') || '[]');
        if (Array.isArray(parsed)) {
            window.p4LogoLibrary = parsed.filter(function (entry) { return entry && entry.logo; });
        }
    } catch (error) {
        window.p4LogoLibrary = window.p4LogoLibrary || [];
    }
}

function p4SaveLibrary() {
    try {
        sessionStorage.setItem('toolReusableLogos', JSON.stringify(window.p4LogoLibrary.slice(-8)));
    } catch (error) {}
}

function p4RememberLogo(src, method, filename, sourceMethod) {
    if (!src) return;
    if (!window.p4LogoLibrary.some(function (entry) { return entry.logo === src; })) {
        window.p4LogoLibrary.push({
            logo: src,
            method: method || 'print',
            sourceMethod: String(sourceMethod || method || 'print').toLowerCase(),
            filename: filename || ''
        });
    }
    p4SaveLibrary();
    p4RenderPreviousLogos();
}

function p4CreateDragPreview(image) {
    if (!image || !image.complete || !image.naturalWidth || !image.naturalHeight) return null;
    var rect = image.getBoundingClientRect();
    var width = Math.max(1, Math.round((rect.width || 64) * 1.25));
    var height = Math.max(1, Math.round((rect.height || 64) * 1.25));
    var pixelRatio = window.devicePixelRatio || 1;
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.style.position = 'fixed';
    canvas.style.left = '-10000px';
    canvas.style.top = '-10000px';
    var context = canvas.getContext('2d');
    context.scale(pixelRatio, pixelRatio);
    var scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    var drawWidth = image.naturalWidth * scale;
    var drawHeight = image.naturalHeight * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    document.body.appendChild(canvas);
    return { element: canvas, width: width, height: height };
}

function p4RenderPreviousLogos() {
    p4ReadLibrary();
    var host = document.getElementById('p4PreviousLogos');
    if (!host) return;
    host.innerHTML = '';
    host.hidden = window.p4LogoLibrary.length === 0;
    window.p4LogoLibrary.forEach(function (entry) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'p4-previous-logo';
        button.dataset.sourceMethod = String(entry.sourceMethod || entry.method || 'print').toLowerCase();
        button.innerHTML = '<img alt="Saved logo"><span class="p4-previous-remove" aria-label="Remove saved logo">&times;</span>';
        button.querySelector('img').src = entry.logo;
        button.draggable = true;
        button.addEventListener('dragstart', function (event) {
            event.dataTransfer.setData('application/x-brandeduk-logo', entry.logo);
            event.dataTransfer.setData('application/x-brandeduk-source-method', button.dataset.sourceMethod);
            event.dataTransfer.setData('text/plain', entry.logo);
            event.dataTransfer.effectAllowed = 'copy';
            var dragPreview = p4CreateDragPreview(button.querySelector('img'));
            if (dragPreview) {
                event.dataTransfer.setDragImage(dragPreview.element, dragPreview.width / 2, dragPreview.height / 2);
                window.setTimeout(function () { dragPreview.element.remove(); }, 0);
            }
            button.classList.add('is-dragging');
        });
        button.addEventListener('dragend', function () {
            button.classList.remove('is-dragging');
            document.querySelectorAll('#p4PositionOptions .position-card.is-drop-ready')
                .forEach(function (card) { card.classList.remove('is-drop-ready'); });
        });
        button.addEventListener('click', function (event) {
            if (event.target.closest('.p4-previous-remove')) {
                window.p4LogoLibrary = window.p4LogoLibrary.filter(function (item) { return item.logo !== entry.logo; });
                p4SaveLibrary();
                p4RenderPreviousLogos();
                return;
            }
            host.querySelectorAll('.p4-previous-logo').forEach(function (item) {
                item.classList.toggle('is-selected', item === button);
            });
        });
        host.appendChild(button);
    });
}

function p4AssignLogo(position, src, method, filename, sourceMethod) {
    if (!position || !src) return;
    var cardForPrice = document.querySelector('#p4PositionOptions .position-card[data-position="' + position + '"]');
    var unitPrice = p4MethodUnitPrice(method, cardForPrice ? cardForPrice.getAttribute('data-' + method) : 0);
    window.p4Assignments[position] = {
        dataUrl: src,
        method: method,
        sourceMethod: String(sourceMethod || method || '').toLowerCase(),
        filename: filename || '',
        unitPrice: unitPrice
    };
    var card = document.querySelector('#p4PositionOptions .position-card[data-position="' + position + '"]');
    if (!card) return;
    card.classList.add('selected', 'has-logo');
    var box = card.querySelector('input[type="checkbox"]');
    if (box) box.checked = true;
    var under = card.querySelector('.p4-logo-under img');
    if (under) under.src = src;
    var preview = card.querySelector('.p4-logo-under');
    if (preview) preview.hidden = false;
    p4ApplyMethodUI(card, method);
    p4UpdateSummary();
    p4SaveLogosToBasket();
    p4ResetConfirmState();
}

function p4ClearCardLogo(position) {
    delete window.p4Assignments[position];
    var card = document.querySelector('#p4PositionOptions .position-card[data-position="' + position + '"]');
    if (!card) return;
    card.classList.remove('has-logo', 'selected');
    var box = card.querySelector('input[type="checkbox"]');
    if (box) box.checked = false;
    var preview = card.querySelector('.p4-logo-under');
    if (preview) preview.hidden = true;
    p4ResetBadge(card.querySelector('.price-emb'));
    p4ResetBadge(card.querySelector('.price-print'));
    p4UpdateSummary();
    p4SaveLogosToBasket();
    p4ResetConfirmState();
}

function p4CardMethod(card, preferred) {
    if (preferred && card.querySelector('.price-badge[data-method="' + preferred + '"]:not(.poa-badge)')) return preferred;
    var first = card.querySelector('.price-badge:not(.poa-badge)');
    return first ? first.dataset.method : 'embroidery';
}

window.p4Pricing = window.p4Pricing || {
    embroidery: { unitPrice: null, digitisingFeePerDesign: 25 },
    print: { unitPrice: null, digitisingFeePerDesign: 0 }
};

function p4FetchPricing(method, qty) {
    var apiMethod = method === 'print' ? 'dtf' : method;
    return fetch('https://api.brandeduk.com/api/customization-pricing?method=' + encodeURIComponent(apiMethod) + '&quantity=' + encodeURIComponent(qty) + '&priceClass=standard')
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (body) {
            var data = body && (body.data || body);
            if (!data || data.unitPrice == null) return null;
            return {
                unitPrice: Number(data.unitPrice),
                digitisingFeePerDesign: Number(data.digitisingFeePerDesign),
                pricingVersion: data.pricingVersion || ''
            };
        })
        .catch(function () { return null; });
}

function p4LoadBackendPrices() {
    var qty = p4ProductQty();
    return Promise.all([p4FetchPricing('embroidery', qty), p4FetchPricing('print', qty)]).then(function (rows) {
        if (rows[0]) {
            window.p4Pricing.embroidery.unitPrice = rows[0].unitPrice;
            window.p4Pricing.embroidery.digitisingFeePerDesign = Number.isFinite(rows[0].digitisingFeePerDesign)
                ? rows[0].digitisingFeePerDesign
                : 25;
        }
        if (rows[1]) {
            window.p4Pricing.print.unitPrice = rows[1].unitPrice;
            window.p4Pricing.print.digitisingFeePerDesign = Number.isFinite(rows[1].digitisingFeePerDesign)
                ? rows[1].digitisingFeePerDesign
                : 0;
        }
        return window.p4Pricing;
    });
}

function p4MethodUnitPrice(method, fallback) {
    var record = window.p4Pricing[method === 'print' ? 'print' : method];
    if (record && record.unitPrice != null && !isNaN(record.unitPrice)) return Number(record.unitPrice);
    return Number(fallback) || 0;
}

function p4ApplyBackendPricesToCards() {
    document.querySelectorAll('#p4PositionOptions .position-card').forEach(function (card) {
        var embroidery = p4MethodUnitPrice('embroidery', card.getAttribute('data-embroidery'));
        var print = p4MethodUnitPrice('print', card.getAttribute('data-print'));
        if (card.querySelector('.price-emb')) {
            card.setAttribute('data-embroidery', embroidery.toFixed(2));
            var emb = card.querySelector('.price-emb');
            if (emb) emb.dataset.defaultPrice = '£' + embroidery.toFixed(2);
        }
        if (card.querySelector('.price-print')) {
            card.setAttribute('data-print', print.toFixed(2));
            var prnt = card.querySelector('.price-print');
            if (prnt) prnt.dataset.defaultPrice = '£' + print.toFixed(2);
        }
    });
}

function p4ExistingEmbroideryLogosInBasket() {
    var product = window.productData || {};
    var code = product.code || product.sku || '';
    var colour = window.selectedColour || '';
    var found = {};
    var basket = [];
    try { basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]'); } catch (error) {}
    basket.forEach(function (item) {
        var itemCode = item.code || item.productCode || '';
        var itemColour = item.color || item.colour || '';
        if (itemCode === code && itemColour === colour) return;
        (item.logos || []).forEach(function (logo) {
            if (String(logo.method || '').toLowerCase() !== 'embroidery') return;
            if (String(logo.sourceMethod || logo.originalMethod || logo.method || '').toLowerCase() !== 'embroidery') return;
            if (logo.logo) found[logo.logo] = true;
        });
    });
    return found;
}

function p4EmbroiderySetupCost() {
    var fee = Number(window.p4Pricing.embroidery.digitisingFeePerDesign);
    if (!Number.isFinite(fee)) fee = 25;
    var unique = {};
    Object.keys(window.p4Assignments || {}).forEach(function (pos) {
        var assignment = window.p4Assignments[pos];
        if (!assignment || assignment.method !== 'embroidery' || !assignment.dataUrl) return;
        if (String(assignment.sourceMethod || assignment.method).toLowerCase() !== 'embroidery') return;
        unique[assignment.dataUrl] = true;
    });
    var already = p4ExistingEmbroideryLogosInBasket();
    return Object.keys(unique).filter(function (src) { return !already[src]; }).length * fee;
}

function p4ProductQty() {
    var total = 0;
    Object.keys(window.quantities || {}).forEach(function (size) {
        total += parseInt(window.quantities[size], 10) || 0;
    });
    if (total) return total;
    $('#sizeQtyGridP3 .qty-input').each(function () {
        total += parseInt(this.value, 10) || 0;
    });
    return total || 1;
}

function p4UpdateSummary() {
    var products = parseFloat(String($('#p3TotalCost').text() || '0').replace(/[^0-9.]/g, '')) || 0;
    var qty = p4ProductQty();
    var logoUnit = 0;
    Object.keys(window.p4Assignments || {}).forEach(function (pos) {
        var assignment = window.p4Assignments[pos];
        var card = document.querySelector('#p4PositionOptions .position-card[data-position="' + pos + '"]');
        var fallback = card ? parseFloat(card.getAttribute('data-' + assignment.method)) || 0 : 0;
        logoUnit += assignment.unitPrice != null ? Number(assignment.unitPrice) : p4MethodUnitPrice(assignment.method, fallback);
    });
    var logo = logoUnit * qty;
    var setup = p4EmbroiderySetupCost();
    var ex = products + logo + setup;
    var vat = ex * 0.2;
    var money = function (n) { return '£' + n.toFixed(2); };
    $('#p4SumProducts').text(money(products));
    $('#p4SumQty').text(qty + (qty === 1 ? ' item' : ' items'));
    $('#p4SumLogo').text(money(logo));
    $('#p4SumSetup').text(money(setup));
    $('#p4SumEx').text(money(ex));
    $('#p4SumVat').text(money(vat));
    $('#p4SumInc').text(money(ex + vat));
}

function p4CardMethods(card) {
    var methods = [];
    if (!card) return methods;
    card.querySelectorAll('.price-badge:not(.poa-badge)').forEach(function (badge) {
        var method = badge.dataset.method;
        if (!method) return;
        methods.push({
            method: method,
            label: badge.dataset.defaultLabel || (method === 'embroidery' ? 'EMBROIDERY' : 'PRINT'),
            price: p4MethodUnitPrice(method, card.getAttribute('data-' + method))
        });
    });
    return methods;
}

function p4ShowMethodPopup(card, src, filename, sourceMethod) {
    var methods = p4CardMethods(card);
    if (!methods.length) return;
    if (methods.length === 1) {
        p4RememberLogo(src, methods[0].method, filename, sourceMethod || methods[0].method);
        p4AssignLogo(card.dataset.position, src, methods[0].method, filename, sourceMethod || methods[0].method);
        return;
    }
    var existing = document.getElementById('p4MethodModal');
    if (existing) existing.remove();
    var pos = card.querySelector('.position-checkbox span');
    var posName = pos ? pos.textContent : String(card.dataset.position || '').replace(/-/g, ' ');
    var overlay = document.createElement('div');
    overlay.id = 'p4MethodModal';
    overlay.innerHTML = '<div class="p4-method-card">' +
        '<strong>Choose decoration</strong>' +
        '<p>How should we apply your logo on <b>' + posName + '</b>?</p>' +
        '<div class="p4-method-choices"></div>' +
        '<button type="button" class="p4-method-cancel">Cancel</button>' +
        '</div>';
    var choices = overlay.querySelector('.p4-method-choices');
    methods.forEach(function (item) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'p4-method-choice p4-method-' + item.method;
        button.innerHTML = '<span>' + item.label + '</span><em>£' + item.price.toFixed(2) + ' each</em>';
        button.addEventListener('click', function () {
            overlay.remove();
            p4RememberLogo(src, item.method, filename, sourceMethod || item.method);
            p4AssignLogo(card.dataset.position, src, item.method, filename, sourceMethod || item.method);
        });
        choices.appendChild(button);
    });
    overlay.querySelector('.p4-method-cancel').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (event) {
        if (event.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
}

function p4ApplyDroppedLogo(card, src, method, filename, sourceMethod) {
    if (!card || !src) return;
    if (method) {
        p4AssignLogo(card.dataset.position, src, p4CardMethod(card, method), filename || '', sourceMethod || method);
        return;
    }
    p4ShowMethodPopup(card, src, filename || '', sourceMethod);
}

function p4OpenFilePicker(position, method) {
    window.p4PendingUpload = { position: position, method: method };
    var input = p4EnsureFileInput();
    input.value = '';
    input.click();
}

function p4SyncLogoState() {
    window.pendingLogos = {};
    window.logoPositions = [];
    Object.keys(window.p4Assignments || {}).forEach(function (pos) {
        var assignment = window.p4Assignments[pos];
        window.pendingLogos[pos] = {
            dataUrl: assignment.dataUrl,
            filename: assignment.filename || '',
            notes: $('#p4ArtworkNotes').val() || ''
        };
        window.logoPositions.push({
            position: pos,
            application: assignment.method.charAt(0).toUpperCase() + assignment.method.slice(1)
        });
    });
    window.logoData = window.pendingLogos;
    window.logoMethod = 'upload';
}

function p4SaveLogosToBasket() {
    p4SyncLogoState();
    var product = window.productData || {};
    var code = product.code || product.sku || '';
    var colour = window.selectedColour || '';
    var notes = $('#p4ArtworkNotes').val() || '';
    var basket = [];
    try { basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]'); } catch (error) {}
    var logos = Object.keys(window.p4Assignments || {}).map(function (pos) {
        var assignment = window.p4Assignments[pos];
        var card = document.querySelector('#p4PositionOptions .position-card[data-position="' + pos + '"]');
        var price = assignment.unitPrice != null
            ? Number(assignment.unitPrice)
            : (card ? parseFloat(card.getAttribute('data-' + assignment.method)) || 0 : 0);
        return {
            method: assignment.method,
            sourceMethod: assignment.sourceMethod || assignment.method,
            position: pos,
            positionLabel: pos.replace(/-/g, ' '),
            logo: assignment.dataUrl,
            notes: notes,
            unitPrice: price,
            digitisingFeePerDesign: assignment.method === 'embroidery' && (assignment.sourceMethod || assignment.method) === 'embroidery'
                ? (Number(window.p4Pricing.embroidery.digitisingFeePerDesign) || 25)
                : 0
        };
    });
    var setup = p4EmbroiderySetupCost();
    var charged = {};
    logos.forEach(function (logo) {
        if (logo.method !== 'embroidery' || logo.sourceMethod !== 'embroidery' || !logo.logo || charged[logo.logo]) {
            logo.setupCharge = 0;
            return;
        }
        charged[logo.logo] = true;
        logo.setupCharge = Number(window.p4Pricing.embroidery.digitisingFeePerDesign) || 25;
    });
    function updateBasketItem(item) {
        var itemCode = item.code || item.productCode || '';
        var itemColour = item.color || item.colour || '';
        if (itemCode === code && itemColour === colour) {
            item.logos = logos;
            item.logoMethod = 'upload';
            item.embroiderySetup = setup;
        }
    }
    var basketIndex = parseInt(sessionStorage.getItem('customizingBasketIndex'), 10);
    var isBasketEdit = new URLSearchParams(window.location.search).get('from') === 'basket';
    if (isBasketEdit) {
        if (Number.isInteger(basketIndex) && basket[basketIndex]) {
            updateBasketItem(basket[basketIndex]);
        }
    } else {
        basket.forEach(updateBasketItem);
    }
    localStorage.setItem('quoteBasket', JSON.stringify(basket));
    window.dispatchEvent(new Event('basketUpdated'));
}

$(document).on('change', '#p4LogoFileInput', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
        if (typeof window.showAlert === 'function') window.showAlert('Maximum file size is 25 MB', 'File too large');
        return;
    }
    var pending = window.p4PendingUpload || {};
    var reader = new FileReader();
    reader.onload = function (event) {
        var src = event.target.result;
        p4RememberLogo(src, pending.method || '', file.name);
        if (pending.position && pending.method) p4AssignLogo(pending.position, src, pending.method, file.name);
        window.p4PendingUpload = null;
    };
    if (file.type.indexOf('image/') === 0) reader.readAsDataURL(file);
    else {
        p4RememberLogo('data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="12" fill="#eef2ff"/><text x="40" y="46" text-anchor="middle" font-size="12" font-family="Poppins,sans-serif" fill="#1d4ed8">FILE</text></svg>'), pending.method || '', file.name);
        if (pending.position && pending.method) p4AssignLogo(pending.position, window.p4LogoLibrary[window.p4LogoLibrary.length - 1].logo, pending.method, file.name);
        window.p4PendingUpload = null;
    }
});

$(document).on('click', '#p4ChooseFile', function () {
    p4OpenFilePicker('', '');
});

$(document).on('click', '#p4ConfirmBasket', function () {
    p4SaveLogosToBasket();
    this.classList.add('is-confirmed');
});

function p4ResetConfirmState() {
    var confirmBtn = document.getElementById('p4ConfirmBasket');
    if (confirmBtn) confirmBtn.classList.remove('is-confirmed');
}

$(document).on('click', '.p4-saved-logos', function () {
    p4RenderPreviousLogos();
    var host = document.getElementById('p4PreviousLogos');
    if (host) host.hidden = false;
});

$(document).on('click', '#p4PositionOptions .p4-logo-remove', function (e) {
    e.stopPropagation();
    var card = this.closest('.position-card');
    if (card) p4ClearCardLogo(card.dataset.position);
});

$(document).on('dragover', '#p4PositionOptions .position-card', function (e) {
    e.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = 'copy';
    $('#p4PositionOptions .position-card').removeClass('is-drop-ready');
    this.classList.add('is-drop-ready');
});

$(document).on('dragleave', '#p4PositionOptions .position-card', function (e) {
    if (!this.contains(e.relatedTarget)) this.classList.remove('is-drop-ready');
});

$(document).on('drop', '#p4PositionOptions .position-card', function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('is-drop-ready');
    var card = this;
    var badge = e.target.closest('.price-badge');
    var method = badge && !badge.classList.contains('poa-badge') ? badge.dataset.method : '';
    var saved = e.originalEvent.dataTransfer.getData('application/x-brandeduk-logo')
        || e.originalEvent.dataTransfer.getData('text/plain');
    var sourceMethod = e.originalEvent.dataTransfer.getData('application/x-brandeduk-source-method');
    var file = e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files[0];
    if (saved && saved.indexOf('data:') === 0) {
        p4RememberLogo(saved, method, '', sourceMethod || method);
        p4ApplyDroppedLogo(card, saved, method, '', sourceMethod || method);
        return;
    }
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) return;
    var reader = new FileReader();
    reader.onload = function (event) {
        p4RememberLogo(event.target.result, method, file.name);
        p4ApplyDroppedLogo(card, event.target.result, method, file.name);
    };
    if (file.type.indexOf('image/') === 0) reader.readAsDataURL(file);
});

$(document).on('dragover', '#p4ChooseFile, #p4PreviousLogos', function (e) {
    e.preventDefault();
});

$(document).on('drop', '#p4ChooseFile, #p4PreviousLogos', function (e) {
    e.preventDefault();
    var file = e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files[0];
    if (!file || file.type.indexOf('image/') !== 0) return;
    if (file.size > 25 * 1024 * 1024) return;
    var reader = new FileReader();
    reader.onload = function (event) {
        p4RememberLogo(event.target.result, '', file.name);
    };
    reader.readAsDataURL(file);
});

// Final save — called after page 5
function finalSaveToBasket(redirectUrl) {
    var basket = [];
    try { basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]'); } catch(e) {}

    if (window.logoUpdateItemId) {
        // Update the existing item with logo data (user came via "+ Add Your Logo")
        var idx = basket.findIndex(function(i) { return i.id === window.logoUpdateItemId; });
        if (idx !== -1) {
            if (window.logoPositions) basket[idx].logoPositions = window.logoPositions;
            if (window.logoMethod) basket[idx].logoMethod = window.logoMethod;
            if (window.logoData) basket[idx].logoData = window.logoData;

            // Convert to item.logos format (basket.html rendering)
            if (window.logoPositions && window.logoPositions.length) {
                basket[idx].logos = window.logoPositions.map(function(lp) {
                    var posData = (window.logoData || {})[lp.position] || {};
                    var method = lp.application.toLowerCase();
                    var card = document.querySelector('#p4PositionOptions .position-card[data-position="' + lp.position + '"]');
                    var price = 0;
                    if (card) price = parseFloat(card.getAttribute('data-' + method)) || 0;
                    return {
                        method: method,
                        sourceMethod: String((window.p4Assignments[lp.position] || {}).sourceMethod || method).toLowerCase(),
                        position: lp.position.toLowerCase().replace(/ /g, '-'),
                        positionLabel: lp.position,
                        logo: posData.dataUrl || '',
                        notes: posData.notes || '',
                        unitPrice: price
                    };
                });
            }
        }
        window.logoUpdateItemId = null;
    } else {
        // Normal flow: save pending item
        var item = window.pendingBasketItem;
        if (!item) return;
        if (window.logoPositions) item.logoPositions = window.logoPositions;
        if (window.logoMethod) item.logoMethod = window.logoMethod;
        if (window.logoData) item.logoData = window.logoData;

        // Convert logoPositions + logoData → item.logos (format basket.html expects)
        if (window.logoPositions && window.logoPositions.length) {
            item.logos = window.logoPositions.map(function(lp) {
                var posData = (window.logoData || {})[lp.position] || {};
                var method = lp.application.toLowerCase();
                // Get price from position card on page 4
                var card = document.querySelector('#p4PositionOptions .position-card[data-position="' + lp.position + '"]');
                var price = 0;
                if (card) price = parseFloat(card.getAttribute('data-' + method)) || 0;
                return {
                    method: method,
                    sourceMethod: String((window.p4Assignments[lp.position] || {}).sourceMethod || method).toLowerCase(),
                    position: lp.position.toLowerCase().replace(/ /g, '-'),
                    positionLabel: lp.position,
                    logo: posData.dataUrl || '',
                    notes: posData.notes || '',
                    unitPrice: price
                };
            });
        }

        basket.push(item);
        window.pendingBasketItem = null;
    }

    window.logoPositions = null;
    window.logoMethod = null;
    window.logoData = null;

    localStorage.setItem('quoteBasket', JSON.stringify(basket));
    window.dispatchEvent(new Event('basketUpdated'));

    if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
    }

    // Back to page 3 and show success
    window.goToPage(2);
    setTimeout(function() {
        var item = basket[basket.length - 1] || {};
        var sizes = item.sizes || {};
        var totalQty = Object.values(sizes).reduce(function(a,b){ return a + (Number(b)||0); }, 0);
        var sizeList = Object.entries(sizes).map(function(e){ return e[0]+' × '+e[1]; }).join(', ');
        $('#successSubtitle').text((item.colour||'') + ' · ' + totalQty + ' items (' + sizeList + ')');
        $('#btnAddToQuote').hide();
        $('#addQuoteSuccess').fadeIn(300);
    }, 750);
}

// Continue Shopping - close popup and reset
$(document).on("click", "#btnContinueShopping", function() {
    $('#addQuoteSuccess').hide();
    $('#btnAddToQuote').show();
    window.goToPage(0);
    // Close popup
    if (typeof window.closeOrderPopup === 'function') {
        window.closeOrderPopup();
    } else {
        $('#orderPopup').fadeOut(300);
    }
});

// Add Your Logo - keep the existing product/colour/size flow, then open the
// shared backend-driven customizer inside this same PC order window.
$(document).on("click", "#btnAddLogo", function() {
    $('#addQuoteSuccess').hide();
    $('#btnAddToQuote').show();

    // Re-sync window.quantities from the P3 grid to pass validation
    window.quantities = {};
    $('#sizeQtyGridP3 .qty-input').each(function() {
        var qty = parseInt($(this).val()) || 0;
        var size = $(this).data('size');
        if (qty > 0 && size) window.quantities[size] = qty;
    });

    if (typeof window.openPcOrderCustomizer === 'function') {
        window.openPcOrderCustomizer();
        return;
    }

    // Safe fallback if the embedded tool module ever fails to load.
    window.goToPage(3);
});

// The initial PC action bar uses the same quote/customizer flow.
$(document).on("click", "#btnAddLogoInitial", function() {
    var beforeCount = 0;
    try {
        beforeCount = JSON.parse(localStorage.getItem('quoteBasket') || '[]').length;
    } catch (error) {}

    $('#btnAddToQuote').trigger('click');
    window.setTimeout(function() {
        var afterCount = 0;
        try {
            afterCount = JSON.parse(localStorage.getItem('quoteBasket') || '[]').length;
        } catch (error) {}
        if (afterCount > beforeCount) $('#btnAddLogo').trigger('click');
    }, 40);
});

$(document).on("click", "#btnContinueShoppingInitial", function() {
    $('#btnContinueShopping').trigger('click');
});

$(document).on("click", "#p3BackToColour", function() {
    window.goToPage(1);
});

$(document).on("click", "#p1BackToCatalog", function() {
    if (typeof window.closeOrderPopup === 'function') {
        window.closeOrderPopup();
    }
});

// Page 2 has a real previous step (Product overview): go back one page
// instead of closing the whole popup, matching every other step's Back.
$(document).on("click", "#p2BackToCatalog", function() {
    window.goToPage(0);
});

$(document).on("click", ".pc-step-back:not(#p1BackToCatalog):not(#p2BackToCatalog):not(#p3BackToColour)", function() {
    window.goToPage(parseInt($(this).data('target-page'), 10) || 0);
});

// PAGE 4: Helper — reset badge back to original EMBROIDERY/PRINT label
function p4ResetBadge(badge) {
    if (!badge) return;
    badge.classList.remove('active', 'add-logo-btn', 'logo-added');
    badge.dataset.role = 'method';
    delete badge.dataset.activeMethod;
    var method = badge.dataset.method;
    var label = badge.dataset.defaultLabel || (method === 'embroidery' ? 'EMBROIDERY' : 'PRINT');
    var price = badge.dataset.defaultPrice || (method === 'embroidery' ? '£5.00' : '£3.50');
    if (badge.classList.contains('poa-badge') && label.indexOf('POA') === -1) label += ' · POA';
    badge.innerHTML = '<span class="price-label">' + label + '</span><span class="price-value">' + price + '</span>';
}

function p4ApplyMethodUI(card, method) {
    var badges = card.querySelectorAll('.price-badge');
    badges.forEach(function (badge) {
        var isMatch = badge.dataset.method === method;
        badge.classList.toggle('active', isMatch);
        badge.classList.remove('add-logo-btn', 'logo-added');
        badge.dataset.role = 'method';
        if (!isMatch) p4ResetBadge(badge);
    });
}

$(document).on('click', '#p4PositionOptions .price-badge', function(e) {
    e.stopPropagation();
    var badge = this;
    var card = $(badge).closest('.position-card')[0];
    var method = badge.dataset.method;
    if (!method) return;
    if (badge.classList.contains('poa-badge') || (badge.querySelector('.price-value') && badge.querySelector('.price-value').textContent === 'POA')) {
        return;
    }
    var selectedPrev = document.querySelector('#p4PreviousLogos .p4-previous-logo.is-selected img');
    if (selectedPrev && selectedPrev.src) {
        var sourceMethod = selectedPrev.closest('.p4-previous-logo').dataset.sourceMethod;
        p4AssignLogo(card.dataset.position, selectedPrev.src, method, '', sourceMethod || method);
        return;
    }
    p4OpenFilePicker(card.dataset.position, method);
});

// PAGE 4: Save the current state before opening the basket.
$(document).on('click', '#btnP4Next, #p4ViewBasket', function() {
    p4SaveLogosToBasket();
    var params = new URLSearchParams(window.location.search);
    if (params.get('basketEmbed') === '1' && window.parent !== window) {
        window.parent.postMessage({ type: 'closeCustomizePopup' }, window.location.origin);
    } else {
        window.location.href = 'basket.html';
    }
});

// PAGE 4: Skip logo → close popup after saving
$(document).on('click', '#btnSkipLogo', function() {
    if (typeof window.closeOrderPopup === 'function') {
        window.closeOrderPopup();
    } else {
        $('#orderPopup').fadeOut(300);
    }
    window.goToPage(0);
});

// PAGE 4: Back
$(document).on('click', '.back-btn-p4', function() {
    window.goToPage(2);
});

// PAGE 5: Assignment card toggle
$(document).on('click', '.p5-assignment-card', function() {
    $('.p5-assignment-card').removeClass('selected');
    $(this).addClass('selected');
});

// PAGE 5: Method card toggle
$(document).on('click', '.p5-method-card', function() {
    $('.p5-method-card').removeClass('selected');
    $(this).addClass('selected');
});

// PAGE 5: Back
$(document).on('click', '.back-btn-p5', function() {
    window.goToPage(3);
});

// PAGE 5: Final "Add to Quote →"
$(document).on('click', '#btnP5Next', function() {
    var method = $('.p5-method-card.selected').data('method');
    if (!method) {
        window.showAlert('Please choose a logo method', 'Choose Method');
        return;
    }
    // Collect logo positions from page 4 (new card system)
    var positions = [];
    $('#p4PositionOptions .position-card.selected').each(function() {
        var pos = $(this).data('position');
        var assignment = window.p4Assignments[pos];
        var app = assignment ? assignment.method : 'embroidery';
        positions.push({ position: pos, application: app.charAt(0).toUpperCase() + app.slice(1) });
    });
    window.logoPositions = positions;
    window.logoMethod = method;

    if (method === 'upload') {
        // Open upload overlay for each selected position
        var posNames = positions.map(function(p) { return p.position; });
        if (posNames.length === 0) posNames = ['Logo'];
        window.pendingLogos = {}; // reset
        luaOpen(posNames, 0);
        return;
    }
    // Text or existing: save straight to basket
    finalSaveToBasket();
});

// Page 5 method card selection
$(document).on('click', '.p5-method-card', function() {
    $('.p5-method-card').removeClass('selected');
    $(this).addClass('selected');
});

// Page 5 assignment card selection
$(document).on('click', '.p5-assignment-card', function() {
    $('.p5-assignment-card').removeClass('selected');
    $(this).addClass('selected');
});

// Populate page 5 summary chips
function populatePage5() {
    var container = $('#p5PositionsSummary');
    container.empty();
    var selected = $('#p4PositionOptions .position-card.selected');
    if (selected.length === 0) {
        container.html('<p style="padding:0 14px;font-size:12px;color:#9ca3af;">No positions selected — choosing method only.</p>');
        return;
    }
    selected.each(function() {
        var pos = $(this).data('position');
        var img = $(this).find('.position-placeholder').attr('src') || '';
        var assignment = window.p4Assignments[pos];
        var app = assignment ? assignment.method : 'embroidery';
        app = app.charAt(0).toUpperCase() + app.slice(1);
        var chip = $('<div class="p5-pos-chip">' +
            (img ? '<img src="' + img + '" alt="' + pos + '">' : '') +
            '<span>' + pos + '</span>' +
            '<span class="p5-app-badge">' + app + '</span>' +
        '</div>');
        container.append(chip);
    });
}


/* ========================================
   PAGE 2: Colour & Quantities Logic
======================================== */

// Handle colour swatch selection (PAGE 2)
$(document).on("click", ".colour-swatch-item", function(e) {
    // Skip if clicking View button
    if ($(e.target).hasClass('swatch-view-btn') || $(e.target).closest('.swatch-view-btn').length > 0) {
        return;
    }

    // Remove selection from all swatches
    $(".colour-swatch-item").removeClass("selected");

    $(this).addClass("selected");
    const colourName = $(this).data("colour") || $(this).data("name");
    const imgUrl = $(this).data("img");
    const colourHex = $(this).data("hex") || '#64748b';
    window.selectedColour = colourName;
    $("#selectedColourName").text(colourName + ' selected');
    $("#p2ColourSelect").val(colourName);
    $("#orderPopup").css("--pc-selected-colour", colourHex);
    document.querySelectorAll('.colour-swatch-item').forEach(function (el) {
        var match = (el.dataset.colour || el.dataset.name) === String(colourName);
        el.classList.toggle('selected', match);
    });
    if (imgUrl) {
        $("#productMainImage, #p2PreviewImage, #p3ProductImage").attr("src", imgUrl);
        var thumb = document.getElementById('p2SelectedThumb');
        if (thumb) {
            thumb.hidden = false;
            thumb.style.backgroundImage = 'url(' + imgUrl + ')';
        }
    }
    if (typeof window.preloadPcOrderCustomizer === 'function' && window.productData) {
        window.preloadPcOrderCustomizer(window.productData, colourName, imgUrl, colourHex);
    }
});

// Handle quantity controls (PAGE 2)
$(document).on("click", ".qty-btn.minus", function() {
    const input = $(this).siblings(".qty-input");
    let currentValue = parseInt(input.val()) || 0;
    
    if (currentValue > 0) {
        currentValue--;
        input.val(currentValue);
        updatePage2Summary();
        updateBoxHighlight($(this).closest(".size-qty-box-p3, .size-qty-box"));
        updateP3TierHighlight();
    }
});

$(document).on("click", ".qty-btn.plus", function() {
    const input = $(this).siblings(".qty-input");
    let currentValue = parseInt(input.val()) || 0;
    
    currentValue++;
    input.val(currentValue);
    updatePage2Summary();
    updateBoxHighlight($(this).closest(".size-qty-box-p3, .size-qty-box"));
    updateP3TierHighlight();
});

// Handle manual input change
$(document).on("change", ".qty-input", function() {
    let value = parseInt($(this).val()) || 0;
    
    // Ensure positive value
    if (value < 0) value = 0;
    
    $(this).val(value);
    updatePage2Summary();
    updateBoxHighlight($(this).closest(".size-qty-box-p3, .size-qty-box"));
    updateP3TierHighlight();
});

$(document).on("input change click", "#sizeQtyGridP3 .qty-input, #sizeQtyGridP3 .qty-btn", function() {
    window.setTimeout(updateP3QuantitySummary, 0);
});

function syncPage3Quantities() {
    window.quantities = {};
    $('#sizeQtyGridP3 .qty-input').each(function () {
        var qty = parseInt($(this).val(), 10) || 0;
        var size = $(this).data('size') || $(this).closest('.size-qty-box-p3').data('size');
        if (qty > 0 && size) window.quantities[size] = qty;
    });
}

// Update summary totals
function updatePage2Summary() {
    let totalItems = 0;
    
    // Calculate total from all inputs
    $(".qty-input").each(function() {
        totalItems += parseInt($(this).val()) || 0;
    });
    
    // Update display
    $("#totalItems").text(totalItems);
    
    // Store in window object for later use
    syncPage3Quantities();
    
    console.log("Updated quantities:", window.quantities, "Total:", totalItems);
}

// Highlight the reached tier card live
function updateP3TierHighlight() {
    var total = 0;
    $('#sizeQtyGridP3 .qty-input').each(function() {
        total += parseInt($(this).val()) || 0;
    });
    // Also count old page-2 style inputs
    if (total === 0) {
        $('.qty-input').each(function() { total += parseInt($(this).val()) || 0; });
    }
    var tierData = window._p3TierData || [];
    // Find highest tier reached
    var reached = tierData.length ? 0 : -1;
    tierData.forEach(function(t, i) {
        if (total >= t.min) reached = i;
    });
    $('#p3DiscountTiers .discount-tier-card').each(function(i) {
        $(this).toggleClass('tier-active', i === reached);
    });
    updateP3QuantitySummary();
}

function updateP3QuantitySummary() {
    var total = 0;
    $('#sizeQtyGridP3 .qty-input').each(function() {
        total += parseInt($(this).val(), 10) || 0;
    });

    var tiers = window._p3TierData || [];
    var unitPrice = tiers.length
        ? Number(tiers[0].price) || 0
        : Number(window.productData && (window.productData.price || window.productData.basePrice)) || 0;

    tiers.forEach(function(tier) {
        if (total >= Number(tier.min) && total <= Number(tier.max || 999999)) {
            unitPrice = Number(tier.price) || unitPrice;
        }
    });

    $('#p3TotalPieces').text(total);
    $('#p3CurrentUnitPrice').text('£' + unitPrice.toFixed(2));
    $('#p3TotalCost').text('£' + (unitPrice * total).toFixed(2));
}

window.updateP3QuantitySummary = updateP3QuantitySummary;

// Highlight box if has quantity
function updateBoxHighlight(box) {
    const qty = parseInt(box.find(".qty-input").val()) || 0;
    const minusButton = box.find(".qty-btn.minus");
    
    if (qty > 0) {
        box.addClass("has-qty");
        box.attr("data-selected", "true");
    } else {
        box.removeClass("has-qty");
        box.attr("data-selected", "false");
    }

    minusButton.prop("disabled", qty === 0);
}

/* ============================================================
   LOGO UPLOAD OVERLAY (lua = logo upload area)
   ============================================================ */
window.luaPositions  = [];   // ordered array of position names
window.luaCurrentIdx = 0;    // which position we're on
window.pendingLogos  = {};   // { 'Left Chest': { dataUrl, filename, notes }, ... }

function luaOpen(positions, startIdx) {
    window.luaPositions  = positions;
    window.luaCurrentIdx = startIdx || 0;
    luaLoadPosition(window.luaCurrentIdx);
    $('#logoUploadOverlay').fadeIn(180);
}

function luaClose() {
    $('#logoUploadOverlay').fadeOut(180);
}

function luaLoadPosition(idx) {
    var pos = window.luaPositions[idx];
    var total = window.luaPositions.length;

    // Position label
    $('#luaPositionLabel').text(pos);

    // Continue / Done label
    if (idx < total - 1) {
        $('#luaContinue').text('CONTINUE TO NEXT POSITION');
    } else {
        $('#luaContinue').text('ADD TO CART');
    }

    // Restore saved data if revisiting
    var saved = window.pendingLogos[pos];
    if (saved && saved.dataUrl) {
        luaShowPreview(saved.dataUrl, saved.filename);
    } else {
        luaClearPreview();
    }
    $('#luaNotes').val(saved ? (saved.notes || '') : '');
}

function luaShowPreview(dataUrl, filename) {
    $('#luaThumb').attr('src', dataUrl);
    $('#luaFilename').text(filename);
    $('#luaPreviewRow').show();
    $('#luaUploadedLabel').show();
}

function luaClearPreview() {
    $('#luaThumb').attr('src', '');
    $('#luaFilename').text('');
    $('#luaPreviewRow').hide();
    $('#luaUploadedLabel').hide();
    $('#luaFileInput').val('');
}

function luaSaveCurrent() {
    var pos = window.luaPositions[window.luaCurrentIdx];
    var dataUrl = $('#luaThumb').attr('src') || '';
    var filename = $('#luaFilename').text() || '';
    var notes = $('#luaNotes').val() || '';
    window.pendingLogos[pos] = { dataUrl: dataUrl, filename: filename, notes: notes };
}

// File input change
$(document).on('change', '#luaFileInput', function() {
    var file = this.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { window.showAlert('Max file size is 8MB', 'OK'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
        luaShowPreview(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
});

// Remove file
$(document).on('click', '#luaRemoveFile', function() {
    luaClearPreview();
});

// Drop zone click → trigger file input
$(document).on('click', '#luaDropZone', function() {
    $('#luaFileInput').trigger('click');
});

// Drag & drop
$(document).on('dragover', '#luaDropZone', function(e) {
    e.preventDefault();
    $(this).addClass('drag-over');
});
$(document).on('dragleave drop', '#luaDropZone', function(e) {
    $(this).removeClass('drag-over');
});
$(document).on('drop', '#luaDropZone', function(e) {
    e.preventDefault();
    var file = e.originalEvent.dataTransfer.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { window.showAlert('Max file size is 8MB', 'OK'); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
        luaShowPreview(ev.target.result, file.name);
    };
    reader.readAsDataURL(file);
});

// Continue / Done
$(document).on('click', '#luaContinue', function() {
    luaSaveCurrent();
    var next = window.luaCurrentIdx + 1;
    if (next < window.luaPositions.length) {
        // More positions to fill
        window.luaCurrentIdx = next;
        luaLoadPosition(next);
    } else {
        // All positions done → show confirm screen
        luaApplyLogosToCards();
        window.logoData = window.pendingLogos;

        // Build confirm details text
        var lines = window.luaPositions.map(function(pos) {
            var d = (window.pendingLogos[pos] || {});
            return '<strong>' + pos + '</strong>' + (d.filename ? ' — ' + d.filename : '');
        });
        $('#luaConfirmDetails').html(lines.join('<br>'));

        // Show logo preview (first logo with a dataUrl)
        var firstLogo = null;
        window.luaPositions.forEach(function(pos) {
            if (!firstLogo && window.pendingLogos[pos] && window.pendingLogos[pos].dataUrl) {
                firstLogo = window.pendingLogos[pos].dataUrl;
            }
        });
        $('#luaConfirmThumb').attr('src', firstLogo || '');

        // Switch panels
        $('#luaStepUpload').hide();
        $('#luaStepConfirm').fadeIn(200);
    }
});

// Confirm: Add to Basket
$(document).on('click', '#luaGoBasket', function() {
    finalSaveToBasket('basket.html');
});

// Confirm: Proceed to Checkout
$(document).on('click', '#luaGoCheckout', function() {
    finalSaveToBasket('checkout.html');
});

// Confirm: back to upload step
$(document).on('click', '#luaBackToUpload', function() {
    $('#luaStepConfirm').hide();
    $('#luaStepUpload').fadeIn(200);
});

// Back
$(document).on('click', '#luaBackBtn', function() {
    luaClose();
});

// Apply logo data to position cards (show thumb on card)
function luaApplyLogosToCards() {
    Object.keys(window.pendingLogos).forEach(function(pos) {
        var logo = window.pendingLogos[pos];
        if (!logo || !logo.dataUrl) return;
        var card = $('#p4PositionOptions .position-card[data-position="' + pos + '"]');
        if (!card.length) return;
        var thumb = card.find('.uploaded-logo-thumb');
        var box = card.find('.uploaded-logo-container');
        thumb.attr('src', logo.dataUrl);
        box.removeAttr('hidden').show();
        card.find('.position-placeholder').hide();
        // Mark cloud button as logo-added
        card.find('.add-logo-btn').addClass('logo-added');
    });
}
