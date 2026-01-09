// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔵 Quote Form: Loading...');
    loadOrderSummary();
});

// LOAD ORDER SUMMARY
function loadOrderSummary() {
    const productData = JSON.parse(sessionStorage.getItem('customizingProduct'));
    const positionCustomizations = JSON.parse(sessionStorage.getItem('positionCustomizations')) || [];
    
    if (!productData) {
        alert('No product data found. Please start from the product page.');
        window.location.href = 'home-pc.html';
        return;
    }
    
    // Populate product summary
    renderProductSummary(productData);
    
    // Populate customization summary
    renderCustomizationSummary(positionCustomizations);
    
    // Calculate and display breakdown
    calculateSummaryBreakdown(productData, positionCustomizations);
    
    // Setup form submission
    setupFormSubmission(productData, positionCustomizations);
}

// RENDER PRODUCT SUMMARY
function renderProductSummary(productData) {
    const container = document.getElementById('productSummary');
    
    const quantity = parseInt(productData.quantity) || 1;
    const price = parseFloat(productData.price);
    const totalPrice = (price * quantity).toFixed(2);
    
    container.innerHTML = `
        <h3>Product Details</h3>
        <div class="product-info-row">
            <img src="${productData.selectedColorUrl || productData.image}" alt="${productData.name}" class="product-image-small">
            <div class="product-details">
                <h4>${productData.name}</h4>
                <p>Code: ${productData.code}</p>
                <p>Colour: ${productData.selectedColorName || 'N/A'}</p>
                <p>Quantity: ${quantity} units</p>
                <p>Price: £${price} x ${quantity} = <strong>£${totalPrice}</strong></p>
            </div>
        </div>
    `;
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
    const garmentPrice = parseFloat(productData.price);
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
    const vatCost = subtotal * 0.20;
    const total = subtotal + vatCost;
    
    document.getElementById('summaryGarmentCost').textContent = `£${garmentTotal.toFixed(2)}`;
    document.getElementById('summaryApplicationCost').textContent = `£${applicationTotal.toFixed(2)}`;
    document.getElementById('summaryLogoSetupCost').textContent = `£${logoSetupCost.toFixed(2)}`;
    document.getElementById('summaryDeliveryCost').textContent = `£${deliveryCost.toFixed(2)}`;
    document.getElementById('summaryVatCost').textContent = `£${vatCost.toFixed(2)}`;
    document.getElementById('summaryTotalCost').textContent = `£${total.toFixed(2)}`;
}

// SETUP FORM SUBMISSION
function setupFormSubmission(productData, positionCustomizations) {
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
        
        // Prepare quote data
        const quoteData = {
            customer: formData,
            product: productData,
            customizations: positionCustomizations,
            timestamp: new Date().toISOString()
        };
        
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
                    sessionStorage.clear();
                    window.location.href = 'home-pc.html';
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
                sessionStorage.clear();
                window.location.href = 'home-pc.html';
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
                    sessionStorage.clear();
                    window.location.href = 'home-pc.html';
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
