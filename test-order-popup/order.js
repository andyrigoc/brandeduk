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
    var product = window.productData;
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
    var prices = product.prices || {};
    var basePrice = product.price || 0;
    var grid = $('#sizeQtyGridP3');
    grid.empty();
    
    $('#p3BasePrice').text('£' + parseFloat(basePrice).toFixed(2));
    
    sizes.forEach(function(size) {
        var sizePrice = (prices[size] || basePrice);
        var stock = '';
        if (product.colors || product.colours) {
            var colours = product.colors || product.colours;
            var sel = colours.find(function(c) { return (c.name || '') === window.selectedColour; });
            if (sel && sel.sizes && sel.sizes[size]) stock = sel.sizes[size].stock || '';
        }
        
        var box = $('<div class="size-qty-box-p3"></div>');
        box.html('<div class="size-name-p3">' + size + '</div>' +
            '<div class="size-price-p3">£' + parseFloat(sizePrice).toFixed(2) + '</div>' +
            (stock ? '<div class="size-stock-p3">Stock: <strong>' + stock + '</strong></div>' : '') +
            '<div class="qty-controls">' +
            '<button class="qty-btn minus" data-size="' + size + '">-</button>' +
            '<input type="number" class="qty-input" data-size="' + size + '" value="0" min="0" max="9999">' +
            '<button class="qty-btn plus" data-size="' + size + '">+</button>' +
            '</div>');
        grid.append(box);
    });
}

$(".next").click(function(){
    if(window.current < total - 1){
        window.goToPage(window.current + 1);
    }
});

$(".back").click(function(){
    if(window.current > 0){
        window.goToPage(window.current - 1);
    }
});

// Add to Quote handler — page 3 button → go to Page 4 (logo)
$(document).on("click", "#btnAddToQuote", function(e) {
    var product = window.productData;
    if (!product) return;

    // Collect quantities from page 3 grid
    var sizes = {};
    var totalQty = 0;
    $('#sizeQtyGridP3 .qty-input').each(function() {
        var qty = parseInt($(this).val()) || 0;
        if (qty > 0) {
            sizes[$(this).data('size')] = qty;
            totalQty += qty;
        }
    });

    if (totalQty === 0) {
        window.showAlert('Please select at least one size/quantity', 'Select Sizes');
        return;
    }

    // Store pending basket item globally (finalised on page 5)
    var selectedItem = document.querySelector('.colour-swatch-item.selected');
    var colourName = selectedItem ? (selectedItem.dataset.name || selectedItem.dataset.colour) : (window.selectedColour || '');
    var colourImg = selectedItem ? selectedItem.dataset.img : '';

    var item = {
        id: Date.now(),
        code: product.code || product.sku || '',
        name: product.name || '',
        brand: product.brand || '',
        colour: colourName,
        colourImg: colourImg,
        image: colourImg || product.image || '',
        price: parseFloat(product.price) || 0,
        sizes: sizes
    };

    // Save directly to basket
    var basket = [];
    try { basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]'); } catch(e) {}
    basket.push(item);
    localStorage.setItem('quoteBasket', JSON.stringify(basket));
    window.dispatchEvent(new Event('basketUpdated'));

    // Show success state
    var sizeList = Object.entries(sizes).map(function(e){ return e[0]+' × '+e[1]; }).join(', ');
    $('#successSubtitle').text(item.colour + ' · ' + totalQty + ' items (' + sizeList + ')');
    $('#p3InitialActions').hide();
    $('#addQuoteSuccess').fadeIn(300);
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
    $('#p3InitialActions').show();
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
    $('#p3InitialActions').hide();

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

$(document).on("click", ".pc-step-back:not(#p3BackToColour)", function() {
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
    badge.innerHTML = '<span class="price-label">' + label + '</span><span class="price-value">' + price + '</span>';
}

// PAGE 4: applyMethodUI — active badge + other becomes upload cloud (identical to mobile)
function p4ApplyMethodUI(card, method) {
    var embBadge = card.querySelector('.price-emb');
    var printBadge = card.querySelector('.price-print');
    p4ResetBadge(embBadge);
    p4ResetBadge(printBadge);
    if (!method) return;
    var methodBadge = method === 'embroidery' ? embBadge : printBadge;
    var addBadge   = method === 'embroidery' ? printBadge : embBadge;
    if (methodBadge) {
        methodBadge.classList.add('active');
        methodBadge.dataset.role = 'method';
    }
    if (addBadge) {
        addBadge.classList.remove('active');
        addBadge.classList.add('add-logo-btn');
        addBadge.dataset.role = 'add-logo';
        addBadge.dataset.activeMethod = method;
        var uid = 'cloud-' + Date.now();
        addBadge.innerHTML = '<svg class="add-logo-cloud-icon" width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="' + uid + '"><path fill-rule="evenodd" clip-rule="evenodd" d="M76.3818 41.5239C76.3818 41.7358 76.3818 41.7358 76.3818 41.9477C86.9769 44.0667 94.3935 54.0261 93.334 64.8332C92.2745 75.6402 83.1627 83.9044 72.1438 83.9044H29.7633C18.9563 83.9044 9.84454 75.6402 8.57313 64.8332C7.30172 54.0261 14.9302 44.0667 25.5253 41.9477C25.5253 41.7358 25.5253 41.7358 25.5253 41.5239C25.5253 27.5384 36.968 16.0957 50.9536 16.0957C64.9391 16.0957 76.3818 27.5384 76.3818 41.5239Z"/></clipPath></defs><g clip-path="url(#' + uid + ')"><path fill-rule="evenodd" clip-rule="evenodd" d="M100 -100H0V200H100V-100ZM34.8377 49.1524L47.426 36.4383C48.2652 35.5907 49.3142 35.1669 50.3632 35.1669C51.4122 35.1669 52.671 35.5907 53.3005 36.4383L65.8888 49.1524C66.9378 50.4238 67.3574 52.3309 66.728 53.8143C66.0986 55.2976 64.6299 56.3571 62.9514 56.3571H54.5593V69.0712C54.5593 71.4021 52.671 73.3093 50.3632 73.3093C48.0554 73.3093 46.1672 71.4021 46.1672 69.0712V56.3571H37.775C36.0966 56.3571 34.6279 55.2976 33.9985 53.8143C33.3691 52.119 33.5789 50.4238 34.8377 49.1524Z" fill="white" class="cloud-arrow-anim"/></g></svg>';
    }
}

// PAGE 4: Price badge click — identical to mobile customize.js logic
$(document).on('click', '#p4PositionOptions .price-badge', function(e) {
    e.stopPropagation();
    var badge = this;
    var card = $(badge).closest('.position-card')[0];
    var role = badge.dataset.role || 'method';

    // "Add Logo" upload button clicked → select position + go to Next Step (page 5)
    if (role === 'add-logo') {
        card.classList.add('selected');
        card.querySelector('input[type="checkbox"]').checked = true;
        populatePage5();
        goToPage(4);
        return;
    }

    var method = badge.dataset.method;
    if (!method) return;

    // POA — don't allow selection
    if (badge.classList.contains('poa-badge') || (badge.querySelector('.price-value') && badge.querySelector('.price-value').textContent === 'POA')) {
        return;
    }

    // Already active → toggle OFF (deselect)
    if (badge.classList.contains('active')) {
        card.classList.remove('selected');
        card.querySelector('input[type="checkbox"]').checked = false;
        var emb = card.querySelector('.price-emb');
        var prnt = card.querySelector('.price-print');
        p4ResetBadge(emb);
        p4ResetBadge(prnt);
        return;
    }

    // Select this method
    card.classList.add('selected');
    card.querySelector('input[type="checkbox"]').checked = true;
    p4ApplyMethodUI(card, method);
});

// PAGE 4: Click on card body (not badge) — toggle selection, default to embroidery
$(document).on('click', '#p4PositionOptions .position-card', function(e) {
    if ($(e.target).closest('.price-badge').length) return;
    var card = this;
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        card.querySelector('input[type="checkbox"]').checked = false;
        p4ResetBadge(card.querySelector('.price-emb'));
        p4ResetBadge(card.querySelector('.price-print'));
    } else {
        card.classList.add('selected');
        card.querySelector('input[type="checkbox"]').checked = true;
        if (!card.querySelector('.price-badge.active')) {
            p4ApplyMethodUI(card, 'embroidery');
        }
    }
});

// PAGE 4: Next → go to page 5
$(document).on('click', '#btnP4Next', function() {
    var selected = $('#p4PositionOptions .position-card.selected');
    if (selected.length === 0) {
        window.showAlert('Please select at least one logo position, or click &quot;Skip (no logo)&quot;', 'Select Position');
        return;
    }
    window.goToPage(4);
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
        var activeBadge = $(this).find('.price-badge.active');
        var app = activeBadge.length ? (activeBadge.attr('data-method') || 'embroidery') : 'embroidery';
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
        var activeBadge = $(this).find('.price-badge.active');
        // fallback: if active badge not found, check role='method' badge
        if (!activeBadge.length) {
            activeBadge = $(this).find('.price-badge[data-role="method"]:not(.add-logo-btn)');
        }
        var app = activeBadge.length ? (activeBadge.data('method') || activeBadge.attr('data-method')) : 'embroidery';
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
    
    const wasSelected = $(this).hasClass("selected");
    
    // Remove selection from all swatches
    $(".colour-swatch-item").removeClass("selected");
    
    if (!wasSelected) {
        // Select this one
        $(this).addClass("selected");
        const colourName = $(this).data("colour") || $(this).data("name");
        const imgUrl = $(this).data("img");
        window.selectedColour = colourName;
        $("#selectedColourName").text(colourName);
        if (imgUrl) $("#productMainImage").attr("src", imgUrl);
        if (typeof window.preloadPcOrderCustomizer === 'function' && window.productData) {
            window.preloadPcOrderCustomizer(window.productData, colourName, imgUrl, $(this).data("hex") || '');
        }
    } else {
        // Deselect completely
        window.selectedColour = null;
        $("#selectedColourName").text("None");
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
        updateBoxHighlight($(this).closest(".size-qty-box"));
        updateP3TierHighlight();
    }
});

$(document).on("click", ".qty-btn.plus", function() {
    const input = $(this).siblings(".qty-input");
    let currentValue = parseInt(input.val()) || 0;
    
    currentValue++;
    input.val(currentValue);
    updatePage2Summary();
    updateBoxHighlight($(this).closest(".size-qty-box"));
    updateP3TierHighlight();
});

// Handle manual input change
$(document).on("change", ".qty-input", function() {
    let value = parseInt($(this).val()) || 0;
    
    // Ensure positive value
    if (value < 0) value = 0;
    
    $(this).val(value);
    updatePage2Summary();
    updateBoxHighlight($(this).closest(".size-qty-box"));
    updateP3TierHighlight();
});

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
    window.quantities = {};
    $(".size-qty-box").each(function() {
        const sizeName = $(this).find(".size-name").text().trim();
        const qty = parseInt($(this).find(".qty-input").val()) || 0;
        if (qty > 0) {
            window.quantities[sizeName] = qty;
        }
    });
    
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
}

// Highlight box if has quantity
function updateBoxHighlight(box) {
    const qty = parseInt(box.find(".qty-input").val()) || 0;
    
    if (qty > 0) {
        box.addClass("has-qty");
    } else {
        box.removeClass("has-qty");
    }
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
