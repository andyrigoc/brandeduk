/**
 * ORDER DRAWER PC - Slide-in order process for PC version only
 * Does NOT affect mobile or tablet versions
 * 
 * Features:
 * - Slides in from right to left
 * - Multi-step process: Basket → Checkout → Confirmation
 * - Smooth animations between steps
 * - Self-contained, doesn't touch mobile/tablet code
 */

(function() {
    'use strict';

    const ORDER_DRAWER_HTML = `
        <div class="order-drawer-overlay" id="orderDrawerOverlay">
            <div class="order-drawer" id="orderDrawer">
                <!-- Header -->
                <div class="order-drawer-header">
                    <button class="order-drawer-back" id="orderDrawerBack" style="opacity: 0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <h2 class="order-drawer-title" id="orderDrawerTitle">Your Basket</h2>
                    <button class="order-drawer-clear-all" id="orderDrawerClearAll" title="Clear all items">Clear All</button>
                    <button class="order-drawer-close" id="orderDrawerClose">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- Progress Steps -->
                <div class="order-drawer-progress">
                    <div class="order-step active" data-step="1">
                        <div class="step-circle">1</div>
                        <span>Basket</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="order-step" data-step="2">
                        <div class="step-circle">2</div>
                        <span>Checkout</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="order-step" data-step="3">
                        <div class="step-circle">3</div>
                        <span>Done</span>
                    </div>
                </div>

                <!-- Steps Container (slides horizontally) -->
                <div class="order-drawer-viewport">
                    <div class="order-drawer-track" id="orderDrawerTrack">
                        
                        <!-- STEP 1: BASKET -->
                        <div class="order-drawer-step" data-step="1">
                            <div class="order-drawer-content">
                                <div id="basketItemsContainer"></div>
                                
                                <div class="order-drawer-empty" id="basketEmptyMessage" style="display: none;">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                    </svg>
                                    <h3>Your basket is empty</h3>
                                    <p>Add products to start building your quote</p>
                                </div>
                            </div>
                            
                            <div class="order-drawer-footer">
                                <div class="order-total">
                                    <span>Total</span>
                                    <strong id="basketTotalAmount">£0.00 ex VAT</strong>
                                </div>
                                <div class="order-drawer-cta-row">
                                    <button class="btn-view-basket" onclick="window.location.href='basket.html'">
                                        View Basket ›
                                    </button>
                                    <button class="btn-order-next" id="basketNextBtn">
                                        Proceed to Checkout
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M5 12h14M12 5l7 7-7 7"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- STEP 2: CHECKOUT -->
                        <div class="order-drawer-step" data-step="2">
                            <div class="order-drawer-content">
                                <form id="checkoutForm" class="checkout-form">
                                    <div class="form-section">
                                        <h3>Contact Information</h3>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>Name *</label>
                                                <input type="text" name="name" required placeholder="Your name">
                                            </div>
                                            <div class="form-group">
                                                <label>Company</label>
                                                <input type="text" name="company" placeholder="Company name">
                                            </div>
                                        </div>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>Email *</label>
                                                <input type="email" name="email" required placeholder="email@example.com">
                                            </div>
                                            <div class="form-group">
                                                <label>Phone *</label>
                                                <input type="tel" name="phone" required placeholder="020 1234 5678">
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-section">
                                        <h3>Delivery Address</h3>
                                        <div class="form-group">
                                            <label>Address Line 1 *</label>
                                            <input type="text" name="address1" required placeholder="Street address">
                                        </div>
                                        <div class="form-group">
                                            <label>Address Line 2</label>
                                            <input type="text" name="address2" placeholder="Apartment, suite, etc.">
                                        </div>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>City *</label>
                                                <input type="text" name="city" required placeholder="City">
                                            </div>
                                            <div class="form-group">
                                                <label>Postcode *</label>
                                                <input type="text" name="postcode" required placeholder="SW1A 1AA">
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-section">
                                        <h3>Additional Notes</h3>
                                        <div class="form-group">
                                            <label>Special Instructions</label>
                                            <textarea name="notes" rows="4" placeholder="Any special requests or delivery instructions..."></textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            
                            <div class="order-drawer-footer">
                                <button class="btn-order-submit" id="checkoutSubmitBtn">
                                    Submit Quote Request
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- STEP 3: CONFIRMATION -->
                        <div class="order-drawer-step" data-step="3">
                            <div class="order-drawer-content center">
                                <div class="order-success">
                                    <div class="success-icon">
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                            <polyline points="22 4 12 14.01 9 11.01"/>
                                        </svg>
                                    </div>
                                    <h2>Quote Request Submitted!</h2>
                                    <p>Thank you for your quote request. We'll review your order and send you a detailed quote within 24 hours.</p>
                                    <p class="ref-number">Reference: <strong id="orderRefNumber">#ORD-00000</strong></p>
                                    <div class="success-details">
                                        <div class="detail-row">
                                            <span>📧 Email</span>
                                            <strong id="confirmEmail">-</strong>
                                        </div>
                                        <div class="detail-row">
                                            <span>📦 Items</span>
                                            <strong id="confirmItems">0</strong>
                                        </div>
                                        <div class="detail-row">
                                            <span>💷 Total</span>
                                            <strong id="confirmTotal">£0.00</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="order-drawer-footer">
                                <button class="btn-order-done" id="orderDoneBtn">
                                    Continue Shopping
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    `;

    const ORDER_DRAWER_CSS = `
        <style id="orderDrawerStyles">
            /* Overlay */
            .order-drawer-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 99999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }

            .order-drawer-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            /* Drawer */
            .order-drawer {
                position: fixed;
                top: 0;
                right: 0;
                bottom: 0;
                width: 100%;
                max-width: 600px;
                background: #fff;
                box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
                transform: translateX(100%);
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
            }

            .order-drawer-overlay.active .order-drawer {
                transform: translateX(0);
            }

            /* Header */
            .order-drawer-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 20px 24px;
                border-bottom: 1px solid #e5e7eb;
                background: #fff;
                position: relative;
                z-index: 10;
            }

            .order-drawer-back,
            .order-drawer-close {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                border: none;
                background: #f3f4f6;
                color: #374151;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .order-drawer-back:hover,
            .order-drawer-close:hover {
                background: #e5e7eb;
                color: #1f2937;
            }

            .order-drawer-back {
                transition: opacity 0.3s ease;
            }

            .order-drawer-clear-all {
                padding: 6px 12px;
                border: 1.5px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                color: #6b7280;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
                margin-right: 4px;
            }

            .order-drawer-clear-all:hover {
                border-color: #ef4444;
                color: #ef4444;
                background: #fef2f2;
            }

            .order-drawer-title {
                flex: 1;
                font-size: 20px;
                font-weight: 700;
                color: #1f2937;
                margin: 0;
            }

            /* Progress */
            .order-drawer-progress {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 20px 24px;
                background: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
            }

            .order-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                opacity: 0.4;
                transition: opacity 0.3s ease;
            }

            .order-step.active,
            .order-step.completed {
                opacity: 1;
            }

            .step-circle {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #d1d5db;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 14px;
                transition: all 0.3s ease;
            }

            .order-step.active .step-circle {
                background: #273469;
                box-shadow: 0 0 0 4px rgba(39, 52, 105, 0.15);
            }

            .order-step.completed .step-circle {
                background: #10b981;
            }

            .order-step span {
                font-size: 12px;
                font-weight: 600;
                color: #6b7280;
            }

            .step-line {
                width: 60px;
                height: 3px;
                background: #e5e7eb;
                border-radius: 99px;
            }

            /* Viewport & Track */
            .order-drawer-viewport {
                flex: 1;
                overflow: hidden;
                position: relative;
            }

            .order-drawer-track {
                display: flex;
                height: 100%;
                transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .order-drawer-step {
                min-width: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
            }

            .order-drawer-content {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }

            .order-drawer-content.center {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Empty State */
            .order-drawer-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 60px 20px;
                color: #9ca3af;
            }

            .order-drawer-empty svg {
                margin-bottom: 20px;
                opacity: 0.5;
            }

            .order-drawer-empty h3 {
                font-size: 18px;
                font-weight: 600;
                color: #374151;
                margin: 0 0 8px;
            }

            .order-drawer-empty p {
                font-size: 14px;
                margin: 0;
            }

            /* Basket Items */
            .basket-item {
                display: flex;
                gap: 16px;
                padding: 16px;
                background: #f9fafb;
                border-radius: 12px;
                margin-bottom: 12px;
            }

            .basket-item-img {
                width: 80px;
                height: 80px;
                object-fit: cover;
                border-radius: 8px;
                background: #fff;
            }

            .basket-item-info {
                flex: 1;
            }

            .basket-item-name {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
            }

            .basket-item-details {
                font-size: 13px;
                color: #6b7280;
                margin-bottom: 8px;
            }

            .basket-item-price {
                font-weight: 700;
                color: #273469;
                font-size: 16px;
            }

            /* Footer */
            .order-drawer-footer {
                padding: 20px 24px;
                border-top: 1px solid #e5e7eb;
                background: #fff;
            }

            .order-total {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding: 16px;
                background: #f9fafb;
                border-radius: 12px;
            }

            .order-total span {
                font-size: 16px;
                color: #6b7280;
            }

            .order-total strong {
                font-size: 20px;
                color: #1f2937;
            }

            .btn-order-next,
            .btn-order-submit,
            .btn-order-done {
                width: 100%;
                padding: 16px;
                background: #273469;
                color: #fff;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s ease;
            }

            .btn-order-next:hover,
            .btn-order-submit:hover,
            .btn-order-done:hover {
                background: #1e2a52;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(39, 52, 105, 0.3);
            }

            .btn-order-next:disabled,
            .btn-order-submit:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            .order-drawer-cta-row {
                display: flex;
                gap: 10px;
            }

            .order-drawer-cta-row .btn-order-next {
                flex: 1;
                width: auto;
            }

            .btn-view-basket {
                flex: 0 0 auto;
                padding: 16px 18px;
                background: #fff;
                color: #273469;
                border: 2px solid #273469;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            .btn-view-basket:hover {
                background: #f0f2fa;
            }

            /* Form Styles */
            .checkout-form {
                max-width: 100%;
            }

            .form-section {
                margin-bottom: 32px;
            }

            .form-section h3 {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 16px;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }

            .form-group {
                margin-bottom: 16px;
            }

            .form-group label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                margin-bottom: 6px;
            }

            .form-group input,
            .form-group textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                font-family: inherit;
                transition: border-color 0.2s ease;
            }

            .form-group input:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: #273469;
                box-shadow: 0 0 0 3px rgba(39, 52, 105, 0.1);
            }

            .form-group textarea {
                resize: vertical;
            }

            /* Success State */
            .order-success {
                text-align: center;
                max-width: 400px;
            }

            .success-icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 24px;
                background: #d1fae5;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .success-icon svg {
                stroke: #10b981;
            }

            .order-success h2 {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
            }

            .order-success p {
                font-size: 15px;
                color: #6b7280;
                line-height: 1.6;
                margin-bottom: 16px;
            }

            .ref-number {
                font-size: 14px;
                color: #374151;
                padding: 12px;
                background: #f9fafb;
                border-radius: 8px;
                margin-bottom: 24px;
            }

            .ref-number strong {
                color: #273469;
                font-weight: 700;
            }

            .success-details {
                text-align: left;
                margin-top: 24px;
            }

            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
            }

            .detail-row:last-child {
                border-bottom: none;
            }

            .detail-row span {
                font-size: 14px;
                color: #6b7280;
            }

            .detail-row strong {
                font-size: 14px;
                color: #1f2937;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .order-drawer {
                    max-width: 100%;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `;

    // Initialize drawer
    function initOrderDrawer() {
        // Inject CSS
        if (!document.getElementById('orderDrawerStyles')) {
            document.head.insertAdjacentHTML('beforeend', ORDER_DRAWER_CSS);
        }

        // Inject HTML
        if (!document.getElementById('orderDrawerOverlay')) {
            document.body.insertAdjacentHTML('beforeend', ORDER_DRAWER_HTML);
        }

        const overlay = document.getElementById('orderDrawerOverlay');
        const drawer = document.getElementById('orderDrawer');
        const track = document.getElementById('orderDrawerTrack');
        const closeBtn = document.getElementById('orderDrawerClose');
        const backBtn = document.getElementById('orderDrawerBack');
        const title = document.getElementById('orderDrawerTitle');

        let currentStep = 1;

        // Open drawer
        window.openOrderDrawer = function() {
            overlay.classList.add('active');
            currentStep = 1;
            updateStep(1);
            loadBasketData();
        };

        // Close drawer
        function closeDrawer() {
            overlay.classList.remove('active');
            setTimeout(() => {
                currentStep = 1;
                updateStep(1);
            }, 400);
        }

        closeBtn.addEventListener('click', closeDrawer);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeDrawer();
        });

        // Clear All button
        const clearAllBtn = document.getElementById('orderDrawerClearAll');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', function() {
                if (confirm('Remove all items from your basket?')) {
                    localStorage.setItem('quoteBasket', '[]');
                    window.dispatchEvent(new Event('basketUpdated'));
                    loadBasketData();
                }
            });
        }

        // Back button
        backBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStep(currentStep);
            }
        });

        // Next button (basket to checkout)
        document.getElementById('basketNextBtn').addEventListener('click', () => {
            if (currentStep === 1) {
                currentStep = 2;
                updateStep(2);
            }
        });

        // Submit button (checkout to confirmation)
        document.getElementById('checkoutSubmitBtn').addEventListener('click', () => {
            const form = document.getElementById('checkoutForm');
            if (form.checkValidity()) {
                // Submit quote
                submitQuote();
                currentStep = 3;
                updateStep(3);
            } else {
                form.reportValidity();
            }
        });

        // Done button
        document.getElementById('orderDoneBtn').addEventListener('click', () => {
            closeDrawer();
            // Clear basket
            localStorage.removeItem('quoteBasket');
            window.location.reload();
        });

        // Update step
        function updateStep(step) {
            currentStep = step;

            // Update progress indicators
            document.querySelectorAll('.order-step').forEach((el, idx) => {
                el.classList.remove('active', 'completed');
                if (idx + 1 === step) {
                    el.classList.add('active');
                } else if (idx + 1 < step) {
                    el.classList.add('completed');
                }
            });

            // Slide track
            const offset = (step - 1) * -100;
            track.style.transform = `translateX(${offset}%)`;

            // Update title
            const titles = {
                1: 'Your Basket',
                2: 'Checkout',
                3: 'Order Complete'
            };
            title.textContent = titles[step] || 'Order';

            // Show/hide back button
            backBtn.style.opacity = step > 1 && step < 3 ? '1' : '0';
            backBtn.style.pointerEvents = step > 1 && step < 3 ? 'auto' : 'none';
        }

        // Load basket data
        function loadBasketData() {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            const container = document.getElementById('basketItemsContainer');
            const emptyMsg = document.getElementById('basketEmptyMessage');
            const nextBtn = document.getElementById('basketNextBtn');
            const totalEl = document.getElementById('basketTotalAmount');

            if (basket.length === 0) {
                container.innerHTML = '';
                emptyMsg.style.display = 'flex';
                nextBtn.disabled = true;
                totalEl.textContent = '£0.00 ex VAT';
                return;
            }

            emptyMsg.style.display = 'none';
            nextBtn.disabled = false;

            let total = 0;
            let html = '';

            basket.forEach((item, idx) => {
                // Support both formats: item.quantity (old) and item.sizes (new multi-size)
                const sizes = item.sizes || item.quantities || null;
                let totalQty = 0;
                let sizesText = '';
                if (sizes && typeof sizes === 'object' && Object.keys(sizes).length > 0) {
                    Object.entries(sizes).forEach(([s, q]) => { totalQty += Number(q) || 0; });
                    sizesText = Object.entries(sizes).filter(([s,q]) => Number(q) > 0).map(([s,q]) => `${s}×${q}`).join(', ');
                } else {
                    totalQty = Number(item.quantity || item.totalQty || 0);
                    sizesText = '';
                }
                const unitPrice = parseFloat(item.price) || 0;
                const itemTotal = unitPrice * totalQty;
                total += itemTotal;
                const colourLabel = item.colour || item.color || '';

                html += `
                    <div class="basket-item">
                        <img class="basket-item-img" src="${item.image || item.colourImg || 'brandedukv15-child/assets/images/ui/no-image.png'}" alt="${item.name || ''}">
                        <div class="basket-item-info">
                            <div class="basket-item-name">${item.name || 'Product'} <span style="color:#6b7280;font-size:12px;">${item.code || ''}</span></div>
                            <div class="basket-item-details">
                                ${colourLabel ? colourLabel + ' • ' : ''}Qty: ${totalQty}${sizesText ? '<br><span style="font-size:11px;color:#9ca3af;">' + sizesText + '</span>' : ''}
                            </div>
                            <div class="basket-item-price">£${itemTotal.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
            totalEl.textContent = `£${total.toFixed(2)} ex VAT`;
        }

        // Submit quote
        function submitQuote() {
            const form = document.getElementById('checkoutForm');
            const formData = new FormData(form);
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');

            // Generate reference
            const ref = 'ORD-' + Date.now().toString().slice(-8);
            document.getElementById('orderRefNumber').textContent = '#' + ref;
            document.getElementById('confirmEmail').textContent = formData.get('email');
            document.getElementById('confirmItems').textContent = basket.length + ' item(s)';
            
            const total = basket.reduce((sum, item) => {
                const sizes = item.sizes || item.quantities || null;
                let qty = 0;
                if (sizes && typeof sizes === 'object') {
                    Object.values(sizes).forEach(q => { qty += Number(q) || 0; });
                } else {
                    qty = Number(item.quantity || item.totalQty || 0);
                }
                return sum + (parseFloat(item.price) || 0) * qty;
            }, 0);
            document.getElementById('confirmTotal').textContent = '£' + total.toFixed(2) + ' ex VAT';

            // Here you would normally send to backend
            console.log('Quote submitted:', {
                reference: ref,
                customer: Object.fromEntries(formData),
                items: basket,
                total: total
            });

            // You can add API call here
            // fetch('/api/submit-quote', { method: 'POST', body: JSON.stringify(...) })
        }
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOrderDrawer);
    } else {
        initOrderDrawer();
    }

})();
