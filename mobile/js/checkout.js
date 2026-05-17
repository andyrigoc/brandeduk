// Checkout Page JavaScript

// For local testing you can set `window.API_BASE_URL = "http://localhost:3004"` before this script loads.
const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL)
    ? String(window.API_BASE_URL).replace(/\/+$/, '')
    : 'https://api.brandeduk.com';

const QUOTES_ENDPOINT = `${API_BASE_URL}/api/quotes`;
const CHECKOUT_SESSION_ENDPOINT = `${API_BASE_URL}/api/quotes/stripe/checkout-session`;
const VAT_RATE = 0.20;

let checkoutSessionPending = false;

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`)?.classList.add('active');

        if (navigator.vibrate) navigator.vibrate(5);
    });
});

function openAddressModal() {
    document.getElementById('addressModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeAddressModal() {
    document.getElementById('addressModal')?.classList.remove('active');
    document.body.style.overflow = '';
}
function openShippingModal() {
    document.getElementById('shippingModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeShippingModal() {
    document.getElementById('shippingModal')?.classList.remove('active');
    document.body.style.overflow = '';
}

document.querySelector('.change-address-btn')?.addEventListener('click', openShippingModal);

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

document.getElementById('addressForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    closeAddressModal();
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
});

document.querySelector('.request-quote-btn')?.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.querySelector('[data-tab="payment"]')?.classList.add('active');
    document.getElementById('payment-tab')?.classList.add('active');
});

document.getElementById('stripe-payment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await startStripeCheckout();
});

document.getElementById('payment-retry-btn')?.addEventListener('click', () => {
    setCheckoutButtonLoading(false);
    showPaymentStart();
});

async function initStripePayment() {
    showPaymentStart();
}

async function startStripeCheckout() {
    if (checkoutSessionPending) return;

    const basket = readBasket();
    if (!basket.length) {
        showPaymentError('Your basket is empty. Please add items before paying.');
        return;
    }

    checkoutSessionPending = true;
    setCheckoutButtonLoading(true);
    setPaymentView('loading');

    try {
        const quoteData = buildQuoteData(basket);

        // Call Quotes API first (this is what triggers the "code/quote" email).
        // Business requirement: if this fails, do NOT proceed to Stripe Checkout.
        let quoteId = '';
        try {
            const quoteRes = await fetch(QUOTES_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quoteData),
            });
            const quoteJson = await quoteRes.json().catch(() => ({}));
            if (!quoteRes.ok) {
                throw new Error(quoteJson.message || `Unable to submit quote (${quoteRes.status})`);
            }
            quoteId = quoteJson.quoteId || quoteJson.data?.quoteId || quoteJson.id || '';
        } catch (e) {
            throw new Error(e?.message || 'Unable to submit quote. Please try again.');
        }

        const response = await fetch(CHECKOUT_SESSION_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quoteData }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success || !result.data?.checkoutUrl) {
            throw new Error(result.message || result.error || `Unable to start payment (${response.status})`);
        }

        try {
            sessionStorage.setItem('pendingStripeQuoteId', quoteId || result.data.quoteId || '');
            sessionStorage.setItem('pendingStripeCheckoutSessionId', result.data.checkoutSessionId || '');
        } catch (storageError) {}

        window.location.href = result.data.checkoutUrl;
    } catch (err) {
        checkoutSessionPending = false;
        setCheckoutButtonLoading(false);
        showPaymentError(err.message || 'Unable to start secure checkout. Please try again.');
    }
}

function showPaymentStart() {
    const qf = document.getElementById('coQuoteForm');
    if (qf) qf.style.display = 'none';
    setPaymentView('form');
}

function setPaymentView(view) {
    const loading = document.getElementById('payment-loading');
    const form = document.getElementById('stripe-payment-form');
    const success = document.getElementById('payment-success');
    const error = document.getElementById('payment-error-state');

    if (loading) loading.style.display = view === 'loading' ? 'flex' : 'none';
    if (form) form.style.display = view === 'form' ? 'block' : 'none';
    if (success) success.style.display = view === 'success' ? 'block' : 'none';
    if (error) error.style.display = view === 'error' ? 'block' : 'none';
}

function showPaymentError(msg) {
    const err = document.getElementById('payment-error-msg');
    if (err) err.textContent = msg;
    setPaymentView('error');
}

function setCheckoutButtonLoading(loading) {
    const btn = document.getElementById('stripe-pay-btn');
    const text = document.getElementById('stripe-btn-text');
    const spinner = document.getElementById('stripe-btn-spinner');

    if (btn) btn.disabled = loading;
    if (text) text.style.display = loading ? 'none' : 'inline';
    if (spinner) spinner.style.display = loading ? 'inline' : 'none';
}

function buildQuoteData(basket) {
    const customer = typeof window.coGetCustomer === 'function' ? window.coGetCustomer() : getCustomerData();
    const totals = calculateBasketTotals(basket);

    return {
        customer,
        summary: {
            totalQuantity: totals.totalQuantity,
            totalItems: basket.length,
            garmentCost: roundMoney(totals.garmentCost),
            customizationCost: roundMoney(totals.customizationCost),
            digitizingFee: roundMoney(totals.digitizingFee),
            subtotal: roundMoney(totals.totalExVat),
            vatRate: VAT_RATE,
            vatAmount: roundMoney(totals.vatAmount),
            totalExVat: roundMoney(totals.totalExVat),
            totalIncVat: roundMoney(totals.totalIncVat),
            displayTotal: roundMoney(totals.totalIncVat),
            vatMode: 'inc',
        },
        basket: buildBasketItems(basket),
        customizations: totals.customizations,
        selectedGraphic: readJson('selectedGraphic') || readJson('vecteezySelectedGraphic') || undefined,
        notes: [localStorage.getItem('orderNotes') || ''].filter(Boolean),
        timestamp: new Date().toISOString(),
    };
}

function calculateBasketTotals(basket) {
    let garmentCost = 0;
    let customizationCost = 0;
    let totalQuantity = 0;
    const customizations = [];
    const uniqueEmbLogos = new Set();

    basket.forEach(item => {
        const qty = number(item.qty || item.quantity || item.totalQty || 1, 1);
        const unitPrice = number(item.unitPrice || item.price || 0, 0);
        const itemTotal = unitPrice * qty;
        garmentCost += itemTotal;
        totalQuantity += qty;

        extractItemCustomizations(item).forEach(customization => {
            const unit = number(customization.unitPrice || customization.price || 0, 0);
            const lineTotal = number(customization.lineTotal || (unit * qty), 0);
            customizationCost += lineTotal;

            if (String(customization.method || '').toLowerCase() === 'embroidery' && customization.logo) {
                uniqueEmbLogos.add(customization.logo);
            }

            customizations.push({
                productName: item.productName || item.name || 'Product',
                productCode: item.code || item.productCode || '',
                position: customization.positionLabel || customization.position || '',
                method: normalizeMethod(customization.method),
                hasLogo: Boolean(customization.logo || customization.logoData),
                logo: customization.logo || null,
                unitPrice: unit,
                lineTotal,
                quantity: qty,
            });
        });
    });

    const digitizingFee = uniqueEmbLogos.size > 0 ? 25 : 0;
    const totalExVat = garmentCost + customizationCost + digitizingFee;
    const vatAmount = totalExVat * VAT_RATE;

    return {
        garmentCost,
        customizationCost,
        digitizingFee,
        totalQuantity,
        totalExVat,
        vatAmount,
        totalIncVat: totalExVat + vatAmount,
        customizations,
    };
}

function buildBasketItems(basket) {
    return basket.map(item => {
        const qty = number(item.qty || item.quantity || item.totalQty || 1, 1);
        const unitPrice = number(item.unitPrice || item.price || 0, 0);
        return {
            name: item.name || item.productName || 'Product',
            code: item.code || item.productCode || '',
            color: item.color || item.colour || '',
            size: item.size || '',
            quantity: qty,
            unitPrice,
            itemTotal: unitPrice * qty,
            image: item.image || item.colorImage || '',
            logos: Array.isArray(item.logos) ? item.logos : [],
        };
    });
}

function extractItemCustomizations(item) {
    if (Array.isArray(item.logos)) return item.logos;
    if (Array.isArray(item.customizations)) return item.customizations;

    if (item.positionDesigns && typeof item.positionDesigns === 'object') {
        return Object.entries(item.positionDesigns).map(([position, data]) => ({ position, ...data }));
    }

    if (Array.isArray(item.positions)) {
        return item.positions.map(position => ({
            position: position.position || position.id || position,
            method: position.method,
            logo: position.logo,
            logoData: position.logoData,
            unitPrice: position.unitPrice,
        }));
    }

    return [];
}

function normalizeMethod(method) {
    const value = String(method || '').toLowerCase();
    if (value === 'embroidery') return 'Embroidery';
    if (value === 'print') return 'Print';
    if (value === 'text') return 'Text';
    return method || '';
}

function readBasket() {
    return readJson('quoteBasket') || [];
}

function readJson(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) {
        return null;
    }
}

function number(value, fallback) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value) {
    return Math.round((number(value, 0) + Number.EPSILON) * 100) / 100;
}

function getCustomerData() {
    return {
        fullName: [
            document.querySelector('[placeholder="First name"]')?.value,
            document.querySelector('[placeholder="Last name"]')?.value,
        ].filter(Boolean).join(' ') || 'Guest',
        email: document.querySelector('[placeholder="Email"]')?.value || '',
        phone: document.querySelector('[placeholder="Phone"]')?.value || '',
        address: document.querySelector('[placeholder="Address line 1"]')?.value || '',
    };
}

function startPromoTimer() {
    const timerEl = document.getElementById('promoTimer');
    if (!timerEl) return;

    let hours = 145, minutes = 26, seconds = 52;

    setInterval(() => {
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = minutes = seconds = 0; }
        timerEl.textContent = `${hours}H : ${minutes}M : ${String(seconds).padStart(2, '0')}S`;
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    startPromoTimer();
    console.log('[CHECKOUT] Basket items:', readBasket().length);
});
