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
                    <button class="order-drawer-back is-hidden" id="orderDrawerBack">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <h2 class="order-drawer-title" id="orderDrawerTitle">Your Basket</h2>
                    <button class="order-drawer-clear-all" id="orderDrawerClearAll" title="Clear basket">Clear basket</button>
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
                                <div class="basket-items-scroll" id="basketItemsScroll">
                                    <div id="basketItemsContainer"></div>
                                </div>
                                <div class="basket-scroll-hint" id="basketScrollHint" hidden aria-hidden="true">
                                    <span class="basket-scroll-hint__line" aria-hidden="true"></span>
                                    <span class="basket-scroll-hint__label">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                                        Scroll for more items
                                    </span>
                                    <span class="basket-scroll-hint__line" aria-hidden="true"></span>
                                </div>
                                <div class="order-drawer-empty" id="basketEmptyMessage" style="display: none;">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                    </svg>
                                    <h3>Your basket is empty</h3>
                                    <p>Add products to start building your quote</p>
                                </div>
                            </div>

                            <div class="order-drawer-footer" id="basketSummary">
                                <div class="drawer-summary-card">
                                    <div class="drawer-summary-head">
                                        <h4 class="drawer-summary-title">Order summary</h4>
                                        <span><span id="drProductLines">0</span> <span id="drProductLinesLabel">product lines</span></span>
                                        <span>Total quantity <span id="drTotalQty">0</span></span>
                                    </div>
                                    <div class="drawer-summary-row"><span>Product Costs</span><span id="drProductCosts">£0.00</span></div>
                                    <button type="button" class="drawer-summary-row drawer-summary-row--toggle" data-summary-toggle="logo">
                                        <span>Customisation <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></span>
                                        <span id="drLogoCosts">£0.00</span>
                                    </button>
                                    <div class="drawer-summary-detail" id="drLogoDetail" hidden></div>
                                    <button type="button" class="drawer-summary-row drawer-summary-row--toggle" id="drDigitizingRow" data-summary-toggle="setup" style="display:none;">
                                        <span>Setup fees <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></span>
                                        <span id="drDigitizingFee">£0.00</span>
                                    </button>
                                    <div class="drawer-summary-detail" id="drSetupDetail" hidden></div>
                                    <div class="drawer-summary-row drawer-summary-row--strong"><span>Total (exc. VAT)</span><span id="drExcVat">£0.00</span></div>
                                    <div class="drawer-summary-row"><span>VAT (20%)</span><span id="drVat">£0.00</span></div>
                                    <div class="drawer-grand-total"><span>Total (inc. VAT)</span><strong id="basketTotalAmount">£0.00</strong></div>
                                </div>
                                <div class="drawer-actions">
                                    <button class="btn-view-basket" onclick="window.location.href='basket.html'">View basket →</button>
                                    <button class="btn-order-next" id="basketNextBtn">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                                        Proceed to checkout →
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
                                                <input type="text" name="name" required placeholder="Your name" autocomplete="name">
                                            </div>
                                            <div class="form-group">
                                                <label>Company</label>
                                                <input type="text" name="company" placeholder="Company name" autocomplete="organization">
                                            </div>
                                        </div>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>Email *</label>
                                                <input type="email" name="email" required placeholder="email@example.com" autocomplete="email">
                                            </div>
                                            <div class="form-group">
                                                <label>Phone *</label>
                                                <input type="tel" name="phone" required placeholder="020 1234 5678" autocomplete="tel">
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-section">
                                        <h3>Delivery Address</h3>
                                        <div class="form-group">
                                            <label>Address Line 1 *</label>
                                            <input type="text" name="address1" required placeholder="Street address" autocomplete="shipping address-line1">
                                        </div>
                                        <div class="form-group">
                                            <label>Address Line 2</label>
                                            <input type="text" name="address2" placeholder="Apartment, suite, etc." autocomplete="shipping address-line2">
                                        </div>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>City *</label>
                                                <input type="text" name="city" required placeholder="City" autocomplete="shipping address-level2">
                                            </div>
                                            <div class="form-group">
                                                <label>Postcode *</label>
                                                <input type="text" name="postcode" required placeholder="SW1A 1AA" autocomplete="shipping postal-code">
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

        <!-- Clear basket confirmation (site modal, not browser confirm) -->
        <div class="order-drawer-clear-overlay" id="orderDrawerClearModal" aria-hidden="true">
            <div class="order-drawer-clear-modal" role="dialog" aria-modal="true" aria-labelledby="orderDrawerClearTitle">
                <button type="button" class="order-drawer-clear-close" id="orderDrawerClearClose" aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
                <div class="order-drawer-clear-icon" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                </div>
                <h3 class="order-drawer-clear-title" id="orderDrawerClearTitle">Clear your basket?</h3>
                <p class="order-drawer-clear-body">
                    This will remove all items, customisations and<br>quantities from your basket and reset everything.
                </p>
                <div class="order-drawer-clear-warning">
                    <span class="order-drawer-clear-warning-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/>
                        </svg>
                    </span>
                    <div>
                        <strong>This action cannot be undone.</strong>
                        <span>All items will be permanently removed.</span>
                    </div>
                </div>
                <div class="order-drawer-clear-actions">
                    <button type="button" class="order-drawer-clear-btn" id="orderDrawerClearCancel">Cancel</button>
                    <button type="button" class="order-drawer-clear-btn order-drawer-clear-btn--danger" id="orderDrawerClearConfirm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                        </svg>
                        <span>Clear All</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6"/>
                        </svg>
                    </button>
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
                max-width: 480px;
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
                width: 36px;
                height: 36px;
                border-radius: 8px;
                border: none;
                background: transparent;
                color: #111827;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .order-drawer-back.is-hidden {
                width: 0;
                min-width: 0;
                padding: 0;
                opacity: 0;
                overflow: hidden;
                pointer-events: none;
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
                margin-left: auto;
                padding: 0;
                border: none;
                background: transparent;
                color: #e11d48;
                font-size: 14px;
                font-weight: 650;
                cursor: pointer;
                white-space: nowrap;
            }

            .order-drawer-clear-all:hover {
                color: #be123c;
            }

            .order-drawer-title {
                flex: 0 1 auto;
                font-size: 22px;
                font-weight: 800;
                color: #1e3a5f;
                margin: 0;
            }

            /* Progress */
            .order-drawer-progress {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 8px 24px 16px;
                background: #fff;
                border-bottom: none;
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
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #fff;
                color: #9ca3af;
                border: 2px solid #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 13px;
                transition: all 0.3s ease;
            }

            .order-step.active .step-circle {
                background: #ff7a00;
                border-color: #ff7a00;
                color: #fff;
                box-shadow: none;
            }

            .order-step.active span {
                color: #ff7a00;
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
                width: 72px;
                height: 2px;
                background: #e5e7eb;
                border-radius: 99px;
                margin-bottom: 18px;
            }

            .order-step.active + .step-line {
                background: linear-gradient(90deg, #ff7a00 0 55%, #e5e7eb 55% 100%);
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
                min-height: 0;
                overflow: hidden;
                padding: 14px 18px 10px;
                display: flex;
                flex-direction: column;
            }

            .order-drawer-content.center {
                display: flex;
                align-items: center;
                justify-content: center;
                overflow-y: auto;
            }

            .order-drawer-step[data-step="2"] .order-drawer-content {
                overflow-y: auto;
                display: block;
            }

            .basket-items-scroll {
                flex: 1;
                min-height: 0;
                overflow-y: auto;
                overscroll-behavior: contain;
            }

            .basket-scroll-hint {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 0 0 auto;
                margin-top: 10px;
                color: #9ca3af;
                font-size: 12px;
                font-weight: 500;
                letter-spacing: 0.01em;
                user-select: none;
                pointer-events: none;
            }

            .basket-scroll-hint[hidden] {
                display: none;
            }

            .basket-scroll-hint__line {
                flex: 1;
                height: 1px;
                background: #e5e7eb;
            }

            .basket-scroll-hint__label {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                white-space: nowrap;
            }

            .basket-scroll-hint__label svg {
                flex: 0 0 auto;
                opacity: 0.85;
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
                display: grid;
                grid-template-columns: 64px 1fr;
                gap: 10px;
                padding: 10px;
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                margin-bottom: 6px;
            }

            .basket-item-img {
                width: 64px;
                height: 74px;
                box-sizing: border-box;
                padding: 3px;
                object-fit: contain;
                object-position: center;
                border-radius: 8px;
                background: #f8fafc;
            }

            .basket-item-main {
                min-width: 0;
            }

            .basket-item-top {
                display: flex;
                justify-content: space-between;
                gap: 12px;
            }

            .basket-item-name {
                font-weight: 650;
                color: #111827;
                font-size: 14px;
                line-height: 1.25;
            }

            .basket-item-code,
            .basket-item-meta {
                margin-top: 1px;
                font-size: 12px;
                color: #6b7280;
            }

            .basket-item-price {
                text-align: right;
                font-weight: 700;
                color: #111827;
                font-size: 14px;
                white-space: nowrap;
            }

            .basket-item-price small {
                display: block;
                margin-top: 1px;
                color: #9ca3af;
                font-size: 11px;
                font-weight: 500;
            }

            .basket-logo-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 6px;
            }

            .basket-logo-thumb {
                width: 32px;
                height: 32px;
                flex: 0 0 32px;
                object-fit: contain;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                background: #fff;
            }

            .basket-logo-label {
                flex: 1;
                min-width: 0;
                color: #374151;
                font-size: 13px;
            }

            .basket-item-tools {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 12px;
                margin-top: 6px;
            }

            .basket-qty {
                display: inline-flex;
                align-items: center;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                overflow: hidden;
            }

            .basket-qty button {
                width: 28px;
                height: 28px;
                border: none;
                background: #fff;
                color: #111827;
                cursor: pointer;
                font-size: 16px;
            }

            .basket-qty-input {
                width: 46px;
                height: 28px;
                padding: 0;
                margin: 0;
                border: 0;
                border-left: 1px solid #e5e7eb;
                border-right: 1px solid #e5e7eb;
                border-radius: 0;
                background: #fff;
                color: #111827;
                font: inherit;
                font-size: 14px;
                font-weight: 650;
                text-align: center;
                box-sizing: border-box;
                -moz-appearance: textfield;
                appearance: textfield;
            }

            .basket-qty-input::-webkit-outer-spin-button,
            .basket-qty-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }

            .basket-qty-input:focus {
                outline: 2px solid #f97316;
                outline-offset: -2px;
            }

            .basket-item-remove {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                border: none;
                background: transparent;
                color: #e11d48;
                font-size: 13px;
                font-weight: 650;
                cursor: pointer;
            }

            /* Top CTA (basket step) */
            .order-drawer-top-cta {
                display: flex;
                gap: 10px;
                padding: 14px 20px;
                border-bottom: 1px solid #e5e7eb;
                background: #fff;
            }

            .order-drawer-top-cta .btn-view-basket {
                flex: 0 0 auto;
            }

            .order-drawer-top-cta .btn-order-next {
                flex: 1;
                width: auto;
            }

            /* Stats bar */
            .drawer-stats-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 20px;
                background: #f3f4f6;
                border-top: 1px solid #e5e7eb;
                font-size: 13px;
                color: #374151;
            }

            .drawer-stats-bar strong {
                font-weight: 700;
                color: #1f2937;
            }

            /* Footer / order summary */
            .order-drawer-footer {
                padding: 6px 14px 12px;
                border-top: none;
                background: #fff;
            }

            .drawer-summary-card {
                padding: 8px 10px 6px;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
            }

            .drawer-summary-head {
                display: flex;
                align-items: baseline;
                gap: 8px;
                margin-bottom: 4px;
                color: #9ca3af;
                font-size: 11px;
                font-weight: 500;
            }

            .drawer-summary-title {
                margin-right: auto;
                font-size: 13px;
                font-weight: 650;
                color: #1e3a5f;
            }

            .drawer-summary-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                padding: 3px 0;
                border: none;
                background: transparent;
                color: #6b7280;
                font-size: 12px;
                font-weight: 500;
                text-align: left;
            }

            .drawer-summary-row span:first-child {
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }

            .drawer-summary-row--toggle {
                cursor: pointer;
            }

            .drawer-summary-row--toggle svg {
                width: 15px;
                height: 15px;
                stroke: #ff7a00;
                stroke-width: 2.6;
                transition: transform 0.2s ease;
            }

            .drawer-summary-row--toggle.is-open svg {
                transform: rotate(180deg);
            }

            .drawer-summary-row--strong {
                font-weight: 650;
                color: #374151;
            }

            .drawer-summary-detail {
                margin: -1px 0 3px 10px;
                color: #9ca3af;
                font-size: 11px;
            }

            .drawer-summary-detail div {
                display: flex;
                justify-content: space-between;
                padding: 1px 0;
            }

            .drawer-grand-total {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 4px;
                padding: 6px 10px;
                border-radius: 8px;
                background: #ecfdf3;
                color: #166534;
                font-size: 12px;
                font-weight: 600;
            }

            .drawer-grand-total strong {
                font-size: 16px;
                font-weight: 700;
                color: #16a34a;
            }

            .drawer-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }

            .btn-order-next,
            .btn-order-submit,
            .btn-order-done {
                width: 100%;
                padding: 14px 16px;
                background: #ff7a00;
                color: #fff;
                border: none;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: background 0.2s ease;
            }

            .btn-order-next:hover,
            .btn-order-submit:hover,
            .btn-order-done:hover {
                background: #e86e00;
            }

            .btn-order-next:disabled,
            .btn-order-submit:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            .btn-view-basket {
                flex: 0 0 auto;
                padding: 14px 16px;
                background: #ffffff;
                color: #26366d;
                border: 1.5px solid #26366d;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                white-space: nowrap;
            }

            .btn-view-basket:hover {
                background: #f3f6fb;
                border-color: #1e2c5c;
            }

            .btn-view-basket:active {
                background: #e9eef7;
                border-color: #1e2c5c;
            }

            .drawer-actions .btn-order-next,
            .drawer-actions .btn-view-basket {
                flex: 1;
                width: auto;
                padding: 8px 10px;
                font-size: 13px;
                font-weight: 650;
                border-radius: 10px;
                white-space: nowrap;
            }

            .drawer-actions .btn-order-next svg {
                width: 14px;
                height: 14px;
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

            /* Clear basket confirmation modal */
            .order-drawer-clear-overlay {
                position: fixed;
                inset: 0;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 16px;
                background: rgba(17, 24, 39, 0.45);
                z-index: 100050;
            }
            .order-drawer-clear-overlay.active {
                display: flex;
            }
            .order-drawer-clear-modal {
                position: relative;
                width: 100%;
                max-width: 430px;
                padding: 28px 22px 20px;
                border-radius: 20px;
                background: #fff;
                box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
                text-align: center;
            }
            .order-drawer-clear-close {
                position: absolute;
                top: 14px;
                right: 14px;
                width: 28px;
                height: 28px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border: 0;
                border-radius: 50%;
                background: transparent;
                color: #9ca3af;
                cursor: pointer;
            }
            .order-drawer-clear-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            .order-drawer-clear-icon {
                width: 64px;
                height: 64px;
                margin: 0 auto 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: #fff4ed;
                color: #f97316;
            }
            .order-drawer-clear-title {
                margin: 0;
                color: #1e293b;
                font-size: 24px;
                line-height: 1.2;
                font-weight: 800;
                letter-spacing: -0.02em;
            }
            .order-drawer-clear-body {
                max-width: 360px;
                margin: 8px auto 16px;
                color: #6b7280;
                font-size: 14px;
                line-height: 1.45;
            }
            .order-drawer-clear-warning {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 12px 14px;
                border-radius: 12px;
                background: #f3f4f6;
                text-align: left;
            }
            .order-drawer-clear-warning-icon {
                flex: 0 0 22px;
                width: 22px;
                height: 22px;
                margin-top: 1px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
            }
            .order-drawer-clear-warning strong,
            .order-drawer-clear-warning span {
                display: block;
            }
            .order-drawer-clear-warning strong {
                color: #374151;
                font-size: 13px;
                font-weight: 700;
            }
            .order-drawer-clear-warning span {
                margin-top: 2px;
                color: #6b7280;
                font-size: 12px;
                line-height: 1.35;
            }
            .order-drawer-clear-actions {
                display: flex;
                gap: 12px;
                padding: 16px 0 0;
            }
            .order-drawer-clear-btn {
                flex: 1;
                height: 46px;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                background: #fff;
                color: #111827;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
            }
            .order-drawer-clear-btn:hover {
                background: #f9fafb;
            }
            .order-drawer-clear-btn--danger {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                border: none;
                background: #f97316;
                color: #fff;
            }
            .order-drawer-clear-btn--danger:hover {
                background: #ea580c;
            }
        </style>
    `;

    // Initialize drawer
    function initOrderDrawer() {
        // Inject CSS
        if (!document.getElementById('orderDrawerStyles')) {
            document.head.insertAdjacentHTML('beforeend', ORDER_DRAWER_CSS);
        } else if (!document.getElementById('orderDrawerClearStyles')) {
            document.head.insertAdjacentHTML(
                'beforeend',
                '<style id="orderDrawerClearStyles">' +
                ORDER_DRAWER_CSS.slice(
                    ORDER_DRAWER_CSS.indexOf('/* Clear basket confirmation modal */'),
                    ORDER_DRAWER_CSS.lastIndexOf('</style>')
                ) +
                '</style>'
            );
        }

        // Inject HTML
        if (!document.getElementById('orderDrawerOverlay')) {
            document.body.insertAdjacentHTML('beforeend', ORDER_DRAWER_HTML);
        } else if (!document.getElementById('orderDrawerClearModal')) {
            // Older sessions may already have the drawer without the confirm modal
            document.body.insertAdjacentHTML(
                'beforeend',
                ORDER_DRAWER_HTML.slice(ORDER_DRAWER_HTML.indexOf('<!-- Clear basket confirmation'))
            );
        }

        const overlay = document.getElementById('orderDrawerOverlay');
        const drawer = document.getElementById('orderDrawer');
        const track = document.getElementById('orderDrawerTrack');
        const closeBtn = document.getElementById('orderDrawerClose');
        const backBtn = document.getElementById('orderDrawerBack');
        const title = document.getElementById('orderDrawerTitle');
        const clearModal = document.getElementById('orderDrawerClearModal');

        let currentStep = 1;

        // Open drawer
        window.openOrderDrawer = function() {
            overlay.classList.add('active');
            currentStep = 1;
            updateStep(1);
            loadBasketData();
            updateBasketScrollHint();
        };

        // Close drawer
        function closeDrawer() {
            overlay.classList.remove('active');
            setTimeout(() => {
                currentStep = 1;
                updateStep(1);
            }, 400);
        }

        function openClearConfirmModal() {
            if (!clearModal) return;
            clearModal.classList.add('active');
            clearModal.setAttribute('aria-hidden', 'false');
        }

        function closeClearConfirmModal() {
            if (!clearModal) return;
            clearModal.classList.remove('active');
            clearModal.setAttribute('aria-hidden', 'true');
        }

        function performClearBasket() {
            try {
                localStorage.setItem('quoteBasket', '[]');
                localStorage.removeItem('orderNotes');
            } catch (e) {}
            try {
                [
                    'reorderNotice', 'pendingLogoPromptId', 'pendingLogoPromptIndex',
                    'customizingBasketIndex', 'editingLogoIndex', 'editingPosition',
                    'returnAfterCustomize', 'basketEditNewColor', 'basketEditSingleItem',
                    'basketEditItemId', 'occupiedPositions', 'toolReusableLogos',
                    'toolAskLogoChoice'
                ].forEach((key) => sessionStorage.removeItem(key));
            } catch (e) {}
            window.dispatchEvent(new Event('basketUpdated'));
            closeClearConfirmModal();
            closeDrawer();
            window.location.href = 'home-pc.html';
        }

        closeBtn.addEventListener('click', closeDrawer);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeDrawer();
        });

        // Clear All — dedicated confirmation modal (same pattern as basket.html)
        const clearAllBtn = document.getElementById('orderDrawerClearAll');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', openClearConfirmModal);
        }
        document.getElementById('orderDrawerClearCancel')?.addEventListener('click', closeClearConfirmModal);
        document.getElementById('orderDrawerClearClose')?.addEventListener('click', closeClearConfirmModal);
        document.getElementById('orderDrawerClearConfirm')?.addEventListener('click', performClearBasket);
        clearModal?.addEventListener('click', (e) => {
            if (e.target === clearModal) closeClearConfirmModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && clearModal?.classList.contains('active')) {
                closeClearConfirmModal();
            }
        });

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

        document.getElementById('basketItemsContainer').addEventListener('click', (event) => {
            const button = event.target.closest('[data-drawer-action]');
            if (!button) return;
            const index = Number(button.dataset.index);
            const action = button.dataset.drawerAction;
            if (action === 'qty') adjustDrawerQty(index, Number(button.dataset.delta) || 0);
            if (action === 'remove') removeDrawerItem(index);
            if (action === 'add-logo') openDrawerLogoEditor(index);
        });

        const basketItemsContainer = document.getElementById('basketItemsContainer');
        basketItemsContainer.addEventListener('change', (event) => {
            const input = event.target.closest('.basket-qty-input');
            if (input) setDrawerQty(Number(input.dataset.index), input.value);
        });
        basketItemsContainer.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && event.target.closest('.basket-qty-input')) event.target.blur();
        });
        basketItemsContainer.addEventListener('focusin', (event) => {
            if (event.target.closest('.basket-qty-input')) event.target.select();
        });

        window.addEventListener('resize', function () {
            if (overlay.classList.contains('active')) updateBasketScrollHint();
        });

        document.getElementById('basketSummary').addEventListener('click', (event) => {
            const toggle = event.target.closest('[data-summary-toggle]');
            if (!toggle) return;
            const detail = document.getElementById(toggle.dataset.summaryToggle === 'logo' ? 'drLogoDetail' : 'drSetupDetail');
            if (!detail) return;
            detail.hidden = !detail.hidden;
            toggle.classList.toggle('is-open', !detail.hidden);
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
            backBtn.classList.toggle('is-hidden', !(step > 1 && step < 3));
        }

        function getItemQuantityDetails(item) {
            const rawSizes = item.sizes || item.quantities;
            let entries = [];

            if (Array.isArray(rawSizes)) {
                entries = rawSizes.map(entry => [
                    entry && (entry.size || entry.name) || '',
                    Number(entry && (entry.qty ?? entry.quantity ?? entry.value)) || 0
                ]);
            } else if (rawSizes && typeof rawSizes === 'object') {
                entries = Object.entries(rawSizes).map(([size, value]) => [
                    size,
                    Number(value && typeof value === 'object' ? (value.qty ?? value.quantity ?? value.value) : value) || 0
                ]);
            }

            entries = entries.filter(([, quantity]) => quantity > 0);
            const mappedTotal = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
            const fallbackTotal = Number(item.qty ?? item.quantity ?? item.totalQty ?? item.totalQuantity) || 0;
            const total = mappedTotal || fallbackTotal;
            const sizeText = entries.length > 0
                ? entries.map(([size, quantity]) => `${size} x ${quantity}`).join(', ')
                : (item.size && total > 0 ? `${item.size} x ${total}` : '');

            return { total, sizeText, entries };
        }

        function escapeHtml(value) {
            return String(value ?? '').replace(/[&<>"']/g, function (ch) {
                return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
            });
        }

        function safeImageSrc(src) {
            const value = String(src || '').trim();
            if (/^(https?:|data:image\/)/i.test(value)) return value;
            if (/^(brandeduk|\.\/|\/)/i.test(value)) return value;
            return '';
        }

        function formatMethod(method) {
            const value = String(method || 'embroidery').toLowerCase();
            if (value === 'dtf') return 'DTF';
            if (value === 'screen') return 'Screen print';
            if (value === 'print') return 'Print';
            return 'Embroidery';
        }

        function formatPosition(logo) {
            return String(logo.positionLabel || logo.position || 'front')
                .replace(/[-_]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
        }

        function readBasket() {
            try { return JSON.parse(localStorage.getItem('quoteBasket') || '[]'); }
            catch (error) { return []; }
        }

        function writeBasket(basket) {
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
            window.dispatchEvent(new Event('basketUpdated'));
            loadBasketData();
        }

        function setItemQuantity(item, nextTotal) {
            const raw = item.sizes || item.quantities;
            if (Array.isArray(raw)) {
                const active = raw.filter(entry => Number(entry && (entry.qty ?? entry.quantity ?? entry.value)) > 0);
                const target = active[0] || raw[0];
                if (target) {
                    if ('qty' in target || !('quantity' in target)) target.qty = nextTotal;
                    else target.quantity = nextTotal;
                }
            } else if (raw && typeof raw === 'object') {
                const keys = Object.keys(raw).filter(key => {
                    const value = raw[key];
                    const amount = Number(value && typeof value === 'object' ? (value.qty ?? value.quantity ?? value.value) : value);
                    return amount > 0;
                });
                const key = keys[0] || Object.keys(raw)[0];
                if (key) {
                    if (raw[key] && typeof raw[key] === 'object') raw[key].qty = nextTotal;
                    else raw[key] = nextTotal;
                }
            }
            item.qty = nextTotal;
            item.quantity = nextTotal;
            item.totalQty = nextTotal;
            item.totalQuantity = nextTotal;
        }

        function adjustDrawerQty(index, delta) {
            const basket = readBasket();
            const item = basket[index];
            if (!item) return;
            const next = Math.max(1, getItemQuantityDetails(item).total + delta);
            setItemQuantity(item, next);
            writeBasket(basket);
        }

        function setDrawerQty(index, value) {
            const basket = readBasket();
            const item = basket[index];
            if (!item) return;
            const parsed = parseInt(value, 10);
            const next = Number.isFinite(parsed) ? Math.min(99999, Math.max(1, parsed)) : getItemQuantityDetails(item).total;
            setItemQuantity(item, next);
            writeBasket(basket);
        }

        function removeDrawerItem(index) {
            const basket = readBasket();
            if (index < 0 || index >= basket.length) return;
            basket.splice(index, 1);
            writeBasket(basket);
        }

        function openDrawerLogoEditor(index) {
            const item = readBasket()[index];
            if (!item) return;
            const params = new URLSearchParams({
                code: item.code || item.productCode || '',
                product: item.code || item.productCode || '',
                from: 'basket',
                logoOnly: '1',
                customize: '1',
                basketIndex: String(index),
                productType: item.productType || '',
                color: item.color || item.colour || ''
            });
            sessionStorage.setItem('customizingBasketIndex', String(index));
            window.location.href = 'shop-pc.html?' + params.toString();
        }

        function getBasketTotalQuantity(basket) {
            return basket.reduce((sum, item) => sum + getItemQuantityDetails(item).total, 0);
        }

        function updateDesktopBasketBadge(basket) {
            const items = Array.isArray(basket)
                ? basket
                : JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            const totalQuantity = getBasketTotalQuantity(items);
            const badge = document.getElementById('headerBasketBadge');
            if (!badge) return;
            badge.textContent = String(totalQuantity);
            badge.dataset.count = String(totalQuantity);
            badge.style.display = totalQuantity > 0 ? 'flex' : 'none';
        }

        function getDrawerLogos(item) {
            const logos = [];
            const seenPositions = new Set();
            const defaultUnitPrice = method => {
                const normalized = String(method || '').toLowerCase();
                if (normalized === 'embroidery') return 5.00;
                if (normalized === 'dtf') return 3.95;
                if (normalized === 'screen') return 2.95;
                return 3.50;
            };
            const addLogo = (entry, fallbackPosition) => {
                if (!entry || !entry.logo) return;
                const position = String(entry.position || entry.posKey || fallbackPosition || '').trim();
                if (!position || seenPositions.has(position)) return;
                seenPositions.add(position);
                const method = String(entry.method || 'embroidery').toLowerCase();
                const parsedPrice = parseFloat(entry.unitPrice);
                logos.push({
                    position,
                    positionLabel: entry.positionLabel || '',
                    method,
                    logo: entry.logo,
                    unitPrice: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : defaultUnitPrice(method)
                });
            };

            if (Array.isArray(item.positions)) {
                item.positions.forEach(position => addLogo(position));
            } else if (item.positions && typeof item.positions === 'object') {
                Object.entries(item.positions).forEach(([position, design]) => addLogo(design, position));
            }
            if (item.positionDesigns && typeof item.positionDesigns === 'object') {
                Object.entries(item.positionDesigns).forEach(([position, design]) => addLogo(design, position));
            }
            if (Array.isArray(item.logos)) {
                item.logos.forEach(logo => addLogo(logo));
            }
            if (Array.isArray(item.customizations)) {
                item.customizations.forEach(customization => addLogo(customization));
            }

            return logos;
        }

        // Load basket data
        function loadBasketData() {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            updateDesktopBasketBadge(basket);
            const container = document.getElementById('basketItemsContainer');
            const emptyMsg = document.getElementById('basketEmptyMessage');
            const nextBtn = document.getElementById('basketNextBtn');
            const totalEl = document.getElementById('basketTotalAmount');

            function setEl(id, val) { const e = document.getElementById(id); if (e) e.textContent = val; }

            const summary = document.getElementById('basketSummary');
            if (basket.length === 0) {
                container.innerHTML = '';
                emptyMsg.style.display = 'flex';
                if (summary) summary.style.display = 'none';
                nextBtn.disabled = true;
                totalEl.textContent = '£0.00';
                setEl('drProductCosts', '£0.00'); setEl('drLogoCosts', '£0.00');
                setEl('drExcVat', '£0.00'); setEl('drVat', '£0.00');
                setEl('drProductLines', '0'); setEl('drTotalQty', '0');
                const dr = document.getElementById('drDigitizingRow'); if (dr) dr.style.display = 'none';
                updateBasketScrollHint(true);
                return;
            }
            if (summary) summary.style.display = '';

            emptyMsg.style.display = 'none';
            nextBtn.disabled = false;

            let productCosts = 0;
            let logoCosts = 0;
            let totalQtyAll = 0;
            const uniqueEmbroideryDesigns = new Set();
            let html = '';

            basket.forEach(item => {
                const quantityDetails = getItemQuantityDetails(item);
                const totalQty = quantityDetails.total;
                const sizesText = quantityDetails.sizeText;
                const unitPrice = parseFloat(item.unitPrice ?? item.price) || 0;
                const garmentTotal = unitPrice * totalQty;
                const itemLogos = getDrawerLogos(item);
                const itemLogoTotal = itemLogos.reduce((sum, logo) => sum + (logo.unitPrice * totalQty), 0);
                const itemTotal = garmentTotal + itemLogoTotal;
                productCosts += garmentTotal;
                logoCosts += itemLogoTotal;
                totalQtyAll += totalQty;
                itemLogos.forEach(logo => {
                    if (logo.method === 'embroidery') uniqueEmbroideryDesigns.add(logo.logo);
                });
                (Array.isArray(item.texts) ? item.texts : []).forEach(textDesign => {
                    if (String(textDesign?.method || '').toLowerCase() !== 'embroidery') return;
                    const text = String(textDesign?.text || '').trim().toLowerCase();
                    if (text) uniqueEmbroideryDesigns.add(`text:${text}:${textDesign.font || textDesign.fontFamily || 'default'}`);
                });
                const colourLabel = item.colour || item.color || '';
                const sizeLabel = quantityDetails.entries.length === 1
                    ? 'Size ' + quantityDetails.entries[0][0]
                    : (quantityDetails.entries.length > 1 ? sizesText : (item.size ? 'Size ' + item.size : ''));
                const meta = [colourLabel, sizeLabel, 'Qty: ' + totalQty].filter(Boolean).join(' · ');
                const logoRows = itemLogos.map(logo => {
                    const src = safeImageSrc(logo.logo);
                    const thumb = src ? `<img class="basket-logo-thumb" src="${escapeHtml(src)}" alt="">` : '';
                    return `<div class="basket-logo-row">${thumb}<span class="basket-logo-label">${escapeHtml(formatMethod(logo.method) + ' – ' + formatPosition(logo))}</span></div>`;
                }).join('');
                const itemIndex = basket.indexOf(item);

                html += `
                    <div class="basket-item">
                        <img class="basket-item-img" src="${escapeHtml(item.image || item.colourImg || 'brandedukv15-child/assets/images/ui/no-image.png')}" alt="${escapeHtml(item.name || '')}">
                        <div class="basket-item-main">
                            <div class="basket-item-top">
                                <div>
                                    <div class="basket-item-name">${escapeHtml(item.name || 'Product')}</div>
                                    <div class="basket-item-code">${escapeHtml(item.code || item.productCode || '')}</div>
                                    <div class="basket-item-meta">${escapeHtml(meta)}</div>
                                </div>
                                <div class="basket-item-price">£${(garmentTotal + itemLogoTotal).toFixed(2)}<small>(exc. VAT)</small></div>
                            </div>
                            ${logoRows}
                            <div class="basket-item-tools">
                                <div class="basket-qty">
                                    <button type="button" data-drawer-action="qty" data-delta="-1" data-index="${itemIndex}" aria-label="Decrease quantity">−</button>
                                    <input type="number" class="basket-qty-input" min="1" step="1" inputmode="numeric" value="${totalQty}" data-index="${itemIndex}" aria-label="Quantity">
                                    <button type="button" data-drawer-action="qty" data-delta="1" data-index="${itemIndex}" aria-label="Increase quantity">+</button>
                                </div>
                                <button type="button" class="basket-item-remove" data-drawer-action="remove" data-index="${itemIndex}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            const digitizingFee = uniqueEmbroideryDesigns.size * 25.00;
            const subtotalExVat = productCosts + logoCosts + digitizingFee;
            const vatAmount = subtotalExVat * 0.20;
            const grandTotal = subtotalExVat + vatAmount;

            container.innerHTML = html;
            setEl('drProductCosts', `\u00a3${productCosts.toFixed(2)}`);
            setEl('drLogoCosts', `£${logoCosts.toFixed(2)}`);
            setEl('drExcVat', `£${subtotalExVat.toFixed(2)}`);
            setEl('drVat', `£${vatAmount.toFixed(2)}`);
            totalEl.textContent = `£${grandTotal.toFixed(2)}`;
            setEl('drProductLines', basket.length);
            const linesLabel = document.getElementById('drProductLinesLabel');
            if (linesLabel) linesLabel.textContent = basket.length === 1 ? 'product line' : 'product lines';
            setEl('drTotalQty', totalQtyAll);
            const drRow = document.getElementById('drDigitizingRow');
            if (drRow) drRow.style.display = digitizingFee > 0 ? 'flex' : 'none';
            setEl('drDigitizingFee', `\u00a3${digitizingFee.toFixed(2)}`);
            const logoDetail = document.getElementById('drLogoDetail');
            if (logoDetail) {
                // Aggregate by decoration method: qty = garments, unit = total ÷ qty
                const methodGroups = new Map();
                basket.forEach(item => {
                    const qty = getItemQuantityDetails(item).total;
                    getDrawerLogos(item).forEach(logo => {
                        const label = formatMethod(logo.method);
                        const unitPrice = parseFloat(logo.unitPrice) || 0;
                        const group = methodGroups.get(label) || { label, count: 0, total: 0 };
                        group.count += qty;
                        group.total += unitPrice * qty;
                        methodGroups.set(label, group);
                    });
                });
                logoDetail.innerHTML = Array.from(methodGroups.values()).map(group => {
                    const unitEach = group.count > 0 ? group.total / group.count : 0;
                    return `<div><span>${escapeHtml(group.label)} (${group.count} &times; £${unitEach.toFixed(2)})</span><span>£${group.total.toFixed(2)}</span></div>`;
                }).join('');
            }
            const setupDetail = document.getElementById('drSetupDetail');
            if (setupDetail) {
                setupDetail.innerHTML = uniqueEmbroideryDesigns.size
                    ? `<div><span>Digitising &amp; test</span><span>£${digitizingFee.toFixed(2)}</span></div>`
                    : '';
            }
            updateBasketScrollHint();
        }

        function updateBasketScrollHint(forceHide) {
            const scrollEl = document.getElementById('basketItemsScroll');
            const hint = document.getElementById('basketScrollHint');
            if (!scrollEl || !hint) return;
            const apply = function () {
                if (forceHide) {
                    hint.hidden = true;
                    hint.setAttribute('aria-hidden', 'true');
                    return;
                }
                const canScroll = scrollEl.scrollHeight > scrollEl.clientHeight + 1;
                hint.hidden = !canScroll;
                hint.setAttribute('aria-hidden', canScroll ? 'false' : 'true');
            };
            // Measure after flex layout settles.
            requestAnimationFrame(function () {
                requestAnimationFrame(apply);
            });
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
            document.getElementById('confirmItems').textContent = getBasketTotalQuantity(basket) + ' item(s)';
            
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

        updateDesktopBasketBadge();
        window.addEventListener('basketUpdated', () => updateDesktopBasketBadge());
        window.addEventListener('storage', event => {
            if (event.key === 'quoteBasket') updateDesktopBasketBadge();
        });
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOrderDrawer);
    } else {
        initOrderDrawer();
    }

})();
