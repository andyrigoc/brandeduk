// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔵 Quote Form: Loading...');
    loadOrderSummary();
});

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

function refreshProductSummaryPrice() {
    const priceLine = document.getElementById('productPriceLine');
    if (!priceLine) {
        return;
    }
    const unit = Number(priceLine.dataset.unit) || 0;
    const qty = Number(priceLine.dataset.qty) || 0;
    const total = unit * qty;

    const unitEl = priceLine.querySelector('.price-unit');
    const totalEl = priceLine.querySelector('.price-total');
    const suffixEl = priceLine.querySelector('.price-suffix');

    if (unitEl) unitEl.textContent = formatCurrency(unit);
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (suffixEl) suffixEl.textContent = vatSuffix();
}

function refreshSummaryBreakdown() {
    const garmentEl = document.getElementById('summaryGarmentCost');
    if (garmentEl) garmentEl.textContent = formatCurrency(Number(garmentEl.dataset.base) || 0) + ' ' + vatSuffix();

    const applicationEl = document.getElementById('summaryApplicationCost');
    if (applicationEl) applicationEl.textContent = formatCurrency(Number(applicationEl.dataset.base) || 0) + ' ' + vatSuffix();

    const logoEl = document.getElementById('summaryLogoSetupCost');
    if (logoEl) logoEl.textContent = formatCurrency(Number(logoEl.dataset.base) || 0) + ' ' + vatSuffix();

    const deliveryEl = document.getElementById('summaryDeliveryCost');
    if (deliveryEl) deliveryEl.textContent = formatCurrency(Number(deliveryEl.dataset.base) || 0) + ' ' + vatSuffix();

    const vatEl = document.getElementById('summaryVatCost');
    if (vatEl) {
        const vatBase = Number(vatEl.dataset.base) || 0;
        const vatDisplay = isVatOn() ? vatBase : 0;
        vatEl.textContent = formatCurrency(vatDisplay, { includeVat: false });
    }

    const totalEl = document.getElementById('summaryTotalCost');
    if (totalEl) totalEl.textContent = formatCurrency(Number(totalEl.dataset.base) || 0) + ' ' + vatSuffix();
}

document.addEventListener('brandeduk:vat-change', () => {
    refreshProductSummaryPrice();
    refreshSummaryBreakdown();
});

// LOAD ORDER SUMMARY
function loadOrderSummary() {
    // 1) Single-product flow (from customize page)
    const productData = JSON.parse(sessionStorage.getItem('customizingProduct'));
    if (productData) {
        const positionCustomizations = JSON.parse(sessionStorage.getItem('positionCustomizations')) || [];
        renderProductSummary(productData);
        renderCustomizationSummary(positionCustomizations);
        calculateSummaryBreakdown(productData, positionCustomizations);
        setupFormSubmission(productData, positionCustomizations);
        return;
    }

    // 2) Basket flow (from basket page)
    var basket;
    try { basket = JSON.parse(localStorage.getItem('quoteBasket')) || []; } catch(e) { basket = []; }
    if (basket.length > 0) {
        renderBasketProductSummary(basket);
        renderBasketCustomizationSummary(basket);
        calculateBasketBreakdown(basket);
        setupFormSubmission(null, null, basket);
        return;
    }

    alert('No product data found. Please start from the product page.');
    window.location.href = 'index.html';
}

// ───── BASKET-MODE RENDERERS ─────

function renderBasketProductSummary(basket) {
    var container = document.getElementById('productSummary');
    var html = '<h3>Product Details</h3>';
    basket.forEach(function(item) {
        var qty = 0;
        var sizes = item.sizes || item.quantities || {};
        if (Object.keys(sizes).length > 0) {
            qty = Object.values(sizes).reduce(function(s,q){ return s+q; }, 0);
        } else {
            qty = parseInt(item.quantity) || 1;
        }
        var unitPrice = Number(item.unitPrice || item.price) || 0;
        var sizeStr = item.size || Object.keys(sizes).map(function(s){ return s+'×'+sizes[s]; }).join(', ') || '-';
        html += '<div class="product-info-row" style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">' +
            '<img src="' + (item.image || item.colorImage || '') + '" alt="' + (item.name || '') + '" class="product-image-small">' +
            '<div class="product-details">' +
                '<h4>' + (item.name || 'Product') + '</h4>' +
                '<p>Code: ' + (item.code || item.productCode || '-') + '</p>' +
                '<p>Colour: ' + (item.color || 'N/A') + '</p>' +
                '<p>Sizes: ' + sizeStr + '</p>' +
                '<p>Quantity: ' + qty + ' pcs &times; ' + formatCurrency(unitPrice) + ' = <strong>' + formatCurrency(unitPrice * qty) + '</strong></p>' +
            '</div></div>';
    });
    container.innerHTML = html;
}

function renderBasketCustomizationSummary(basket) {
    var container = document.getElementById('customizationSummary');
    var allCustom = [];
    basket.forEach(function(item) {
        var itemName = item.name || item.code || 'Product';
        var sizes = item.sizes || item.quantities || {};
        var qty = Object.keys(sizes).length > 0 ? Object.values(sizes).reduce(function(s,q){ return s+q; }, 0) : (parseInt(item.quantity) || 1);

        // Collect from customizations array
        if (item.customizations && item.customizations.length > 0) {
            item.customizations.forEach(function(c) {
                allCustom.push({ position: c.position || c.posKey, method: c.method, unitPrice: c.unitPrice || 0, qty: qty, itemName: itemName });
            });
        } else if (item.positions && (Array.isArray(item.positions) ? item.positions.length : Object.keys(item.positions).length)) {
            var posArr = Array.isArray(item.positions) ? item.positions : Object.values(item.positions);
            posArr.forEach(function(p) {
                if (p.method) allCustom.push({ position: p.position || p.name, method: p.method, unitPrice: p.unitPrice || 0, qty: qty, itemName: itemName });
            });
        } else if (item.positionDesigns && typeof item.positionDesigns === 'object') {
            Object.entries(item.positionDesigns).forEach(function(entry) {
                var design = entry[1];
                if (design && design.logo) {
                    allCustom.push({ position: design.position || entry[0], method: design.method || 'Embroidery', unitPrice: design.unitPrice || 5, qty: qty, itemName: itemName });
                }
            });
        }
    });

    if (allCustom.length === 0) {
        container.innerHTML = '<h3>Customizations</h3><p style="color:#6b7280;font-size:14px;">No customizations added</p>';
        return;
    }
    var html = '<h3>Customizations</h3>';
    allCustom.forEach(function(c) {
        var isEmb = c.method && c.method.toLowerCase() === 'embroidery';
        html += '<div class="position-item">' +
            '<div class="position-header">' +
                '<span class="position-name">' + (c.position || '-') + ' <small style="color:#9ca3af;">(' + c.itemName + ')</small></span>' +
                '<span class="method-badge ' + (isEmb ? 'embroidery' : 'print') + '">' + (isEmb ? 'EMBROIDERY' : 'PRINT') + '</span>' +
            '</div>' +
            '<div class="position-type">' + formatCurrency(c.unitPrice) + ' × ' + c.qty + ' = ' + formatCurrency(c.unitPrice * c.qty) + '</div>' +
        '</div>';
    });
    container.innerHTML = html;
}

function calculateBasketBreakdown(basket) {
    var garmentsTotal = 0;
    var applicationTotal = 0;
    var uniqueEmbLogos = {};

    basket.forEach(function(item) {
        var sizes = item.sizes || item.quantities || {};
        var qty = Object.keys(sizes).length > 0 ? Object.values(sizes).reduce(function(s,q){ return s+q; }, 0) : (parseInt(item.quantity) || 1);
        var unitPrice = Number(item.unitPrice || item.price) || 0;
        garmentsTotal += unitPrice * qty;

        // Application costs
        var seenPos = {};
        if (item.customizations && item.customizations.length > 0) {
            item.customizations.forEach(function(c) {
                var pk = (c.posKey || c.position || '') + '|' + (c.method || '');
                if (seenPos[pk]) return; seenPos[pk] = true;
                applicationTotal += (c.unitPrice || 0) * qty;
            });
        } else if (item.positions) {
            var posArr = Array.isArray(item.positions) ? item.positions : Object.values(item.positions);
            posArr.forEach(function(p) {
                if (p.method) {
                    var pk = (p.position || p.name || '') + '|' + p.method;
                    if (seenPos[pk]) return; seenPos[pk] = true;
                    applicationTotal += (p.unitPrice || 0) * qty;
                }
            });
        } else if (item.positionDesigns && typeof item.positionDesigns === 'object') {
            Object.entries(item.positionDesigns).forEach(function(entry) {
                var d = entry[1];
                if (d && d.logo) {
                    var up = d.unitPrice || (d.method && d.method.toLowerCase() !== 'embroidery' ? 3.50 : 5);
                    applicationTotal += up * qty;
                }
            });
        }

        // Embroidery logo setup fee (£25 per unique logo)
        var isEmb = function(m){ return !m || (typeof m==='string' && m.toLowerCase()==='embroidery'); };
        if (item.positionDesigns) Object.values(item.positionDesigns).forEach(function(d){ if(d&&d.logo&&isEmb(d.method)) uniqueEmbLogos[d.logo]=true; });
        if (item.positions) { var pa=Array.isArray(item.positions)?item.positions:Object.values(item.positions); pa.forEach(function(p){ if(p&&p.logo&&isEmb(p.method)) uniqueEmbLogos[p.logo]=true; }); }
    });

    var logoSetupCost = Object.keys(uniqueEmbLogos).length * 25;
    var subtotal = garmentsTotal + applicationTotal + logoSetupCost;
    var vatCost = subtotal * vatRate();

    var garmentEl = document.getElementById('summaryGarmentCost');
    var appEl = document.getElementById('summaryApplicationCost');
    var logoEl = document.getElementById('summaryLogoSetupCost');
    var deliveryEl = document.getElementById('summaryDeliveryCost');
    var vatEl = document.getElementById('summaryVatCost');
    var totalEl = document.getElementById('summaryTotalCost');

    if (garmentEl) garmentEl.dataset.base = garmentsTotal;
    if (appEl) appEl.dataset.base = applicationTotal;
    if (logoEl) logoEl.dataset.base = logoSetupCost;
    if (deliveryEl) deliveryEl.dataset.base = 0;
    if (vatEl) vatEl.dataset.base = vatCost;
    if (totalEl) totalEl.dataset.base = subtotal;

    refreshSummaryBreakdown();
}

// RENDER PRODUCT SUMMARY
function renderProductSummary(productData) {
    const container = document.getElementById('productSummary');
    
    const quantity = parseInt(productData.quantity) || 1;
    const price = Number(productData.price) || 0;
    
    container.innerHTML = `
        <h3>Product Details</h3>
        <div class="product-info-row">
            <img src="${productData.selectedColorUrl || productData.image}" alt="${productData.name}" class="product-image-small">
            <div class="product-details">
                <h4>${productData.name}</h4>
                <p>Code: ${productData.code}</p>
                <p>Colour: ${productData.selectedColorName || 'N/A'}</p>
                <p>Quantity: ${quantity} units</p>
                <p id="productPriceLine" data-unit="${price}" data-qty="${quantity}">
                    Price: <span class="price-unit"></span> x ${quantity} = <strong class="price-total"></strong> <span class="price-suffix"></span>
                </p>
            </div>
        </div>
    `;

    refreshProductSummaryPrice();
}

// RENDER CUSTOMIZATION SUMMARY
function renderCustomizationSummary(positionCustomizations) {
    const container = document.getElementById('customizationSummary');
    
    if (!positionCustomizations || positionCustomizations.length === 0) {
        container.innerHTML = `
            <h3>Customizations</h3>
            <p style="color: #6b7280; font-size: 14px;">No customizations added</p>
        `;
        return;
    }
    
    let html = '<h3>Customizations</h3>';
    
    positionCustomizations.forEach((custom, index) => {
        const methodClass = custom.method === 'embroidery' ? 'embroidery' : 'print';
        const methodLabel = custom.method === 'embroidery' ? 'EMBROIDERY' : 'PRINT';
        
        html += `
            <div class="position-item">
                <div class="position-header">
                    <span class="position-name">${custom.position}</span>
                    <span class="method-badge ${methodClass}">${methodLabel}</span>
                </div>
                <div class="position-type">Type: ${custom.type || 'Logo'}</div>
                ${custom.uploadedLogo ? `<img src="${custom.uploadedLogo}" alt="Logo" class="logo-thumb">` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// CALCULATE SUMMARY BREAKDOWN
function calculateSummaryBreakdown(productData, positionCustomizations) {
    const quantity = parseInt(productData.quantity) || 1;
    const garmentPrice = Number(productData.price) || 0;
    const garmentTotal = garmentPrice * quantity;
    
    // Position prices
    const positionPrices = {
        'Left Breast': { embroidery: 5, print: 3.50 },
        'Right Breast': { embroidery: 5, print: 3.50 },
        'Left Arm': { embroidery: 5, print: 3.50 },
        'Right Arm': { embroidery: 5, print: 3.50 },
        'Small Centre Front': { embroidery: 5, print: 3.50 },
        'Large Centre Front': { embroidery: 7, print: 5 },
        'Large Back': { embroidery: 7, print: 5 }
    };
    
    let applicationTotal = 0;
    positionCustomizations.forEach((custom) => {
        if (positionPrices[custom.position]) {
            const price = positionPrices[custom.position][custom.method] || 0;
            applicationTotal += price * quantity;
        }
    });
    
    const hasLogo = positionCustomizations.some(c => c.uploadedLogo);
    const logoSetupCost = hasLogo ? 12.00 : 0;
    const deliveryCost = 0;
    
    const subtotal = garmentTotal + applicationTotal + logoSetupCost + deliveryCost;
    const vatCost = subtotal * vatRate();
    const total = subtotal + vatCost;

    const garmentEl = document.getElementById('summaryGarmentCost');
    const applicationEl = document.getElementById('summaryApplicationCost');
    const logoEl = document.getElementById('summaryLogoSetupCost');
    const deliveryEl = document.getElementById('summaryDeliveryCost');
    const vatEl = document.getElementById('summaryVatCost');
    const totalEl = document.getElementById('summaryTotalCost');

    if (garmentEl) garmentEl.dataset.base = garmentTotal;
    if (applicationEl) applicationEl.dataset.base = applicationTotal;
    if (logoEl) logoEl.dataset.base = logoSetupCost;
    if (deliveryEl) deliveryEl.dataset.base = deliveryCost;
    if (vatEl) vatEl.dataset.base = vatCost;
    if (totalEl) totalEl.dataset.base = subtotal;

    refreshSummaryBreakdown();
}

// SETUP FORM SUBMISSION
function setupFormSubmission(productData, positionCustomizations, basketItems) {
    const form = document.getElementById('quoteForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            address: document.getElementById('address').value.trim(),
            city: document.getElementById('city').value.trim(),
            country: document.getElementById('country').value,
            state: document.getElementById('state').value,
            postcode: document.getElementById('postcode').value.trim(),
            termsAccepted: document.getElementById('terms').checked,
            returnsAccepted: document.getElementById('returns').checked,
            newsletter: document.getElementById('newsletter').checked,
            gdpr: document.getElementById('gdpr').checked,
            shipping: document.querySelector('input[name="shipping"]:checked').value
        };
        
        // Validate required fields
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.postcode) {
            alert('❌ Please fill in all required fields (marked with *)');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('❌ Please enter a valid email address');
            return;
        }
        
        // Check terms and returns checkbox
        if (!formData.termsAccepted || !formData.returnsAccepted) {
            alert('❌ You must agree to the Terms & Conditions and Returns Policy');
            return;
        }
        
        // Show loading
        showLoading();
        
        // Prepare quote data — basket mode or single-product mode
        const quoteData = {
            customer: formData,
            timestamp: new Date().toISOString()
        };
        if (basketItems && basketItems.length > 0) {
            quoteData.basketItems = basketItems;
            quoteData.orderNotes = localStorage.getItem('orderNotes') || '';
        } else {
            quoteData.product = productData;
            quoteData.customizations = positionCustomizations;
        }
        
        // ===== METODO 1: PHP BACKEND (Consigliato per Zoho Mail) =====
        try {
            const response = await fetch('send-quote.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quoteData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('✅ Email sent successfully via PHP');
                hideLoading();
                showSuccessMessage(formData.firstName);
                setTimeout(() => {
                    // Clear ALL storage to reset state completely
                    sessionStorage.clear();
                    localStorage.removeItem('quoteBasket');
                    window.location.replace('index.html');
                }, 3000);
            } else {
                throw new Error(result.message || 'Server error');
            }
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            hideLoading();
            alert('❌ Failed to send quote. Please contact info@brandeduk.com directly.');
        }
        
        // ===== METODO 2: EMAILJS (Alternativa, richiede setup su emailjs.com) =====
        // Decomenta questo se preferisci usare EmailJS invece di PHP:
        /*
        try {
            emailjs.init('YOUR_PUBLIC_KEY');
            
            const templateParams = {
                customer_name: `${formData.firstName} ${formData.lastName}`,
                customer_email: formData.email,
                customer_phone: formData.phone,
                customer_address: `${formData.address}, ${formData.city}, ${formData.postcode}, ${formData.country}`,
                product_name: productData.name,
                product_code: productData.code,
                product_color: productData.selectedColorName,
                quantity: productData.quantity,
                customizations: JSON.stringify(positionCustomizations, null, 2),
                total_price: document.getElementById('summaryTotalCost').textContent,
                timestamp: new Date().toLocaleString()
            };
            
            const response = await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
            console.log('✅ Email sent successfully:', response);
            
            hideLoading();
            showSuccessMessage(formData.firstName);
            setTimeout(() => {
                // Clear ALL storage to reset state completely
                sessionStorage.clear();
                localStorage.removeItem('quoteBasket');
                window.location.replace('index.html');
            }, 3000);
            
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            hideLoading();
            alert('❌ Failed to send quote request. Please try again or contact info@brandeduk.com directly.');
        }
        
        // ===== ALTERNATIVA: Invio tramite PHP backend =====
        // Se preferisci usare PHP invece di EmailJS, decomenta questo:
        /*
        try {
            const response = await fetch('send-quote.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quoteData)
            });
            
            if (response.ok) {
                hideLoading();
                showSuccessMessage(formData.firstName);
                setTimeout(() => {
                    // Clear ALL storage to reset state completely
                    sessionStorage.clear();
                    localStorage.removeItem('quoteBasket');
                    window.location.replace('index.html');
                }, 3000);
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            hideLoading();
            alert('❌ Failed to send quote. Please try again.');
        }
        */

    });
}

// SHOW LOADING
function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <p style="margin: 0; font-weight: 600; color: #374151;">Sending your quote request...</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

// HIDE LOADING
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// SHOW SUCCESS MESSAGE
function showSuccessMessage(firstName) {
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
        <div class="success-content">
            <div class="success-icon">✅</div>
            <h2>Quote Request Sent!</h2>
            <p>Thank you <strong>${firstName}</strong>! Your quote request has been sent to <strong>info@brandeduk.com</strong>.</p>
            <p>We'll review your customization and get back to you within 24 hours.</p>
            <p style="font-size: 12px; color: #9ca3af;">Redirecting you to homepage...</p>
        </div>
    `;
    document.body.appendChild(overlay);
}
