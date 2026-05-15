// Checkout Page JavaScript

// ─── Stripe configuration ────────────────────────────────────────────────────
// Replace with your actual publishable key from the Stripe Dashboard.
// For Netlify/Vercel you can inject it via a meta tag or window variable.
const STRIPE_PK = (typeof window.STRIPE_PUBLISHABLE_KEY !== 'undefined')
    ? window.STRIPE_PUBLISHABLE_KEY
    : 'pk_live_51TOc1NBorzr6Fe4Yg49Hwzl9AGX1Q5RzI21LfUo3eP6TaaTuUUCtqc9h578i5OkUaCtR4v5zgXN2epeZ6hfoCIkP00y9x6a04G';

let stripe = null;
let cardElement = null;
let paymentIntentId = null;
let paymentIntentClientSecret = null;

// ─── Tab switching ────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        if (navigator.vibrate) navigator.vibrate(5);

        if (tabName === 'payment') initStripePayment();
    });
});

// ─── Modal helpers ─────────────────────────────────────────────────────────────
function openAddressModal() {
    document.getElementById('addressModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeAddressModal() {
    document.getElementById('addressModal').classList.remove('active');
    document.body.style.overflow = '';
}
function openShippingModal() {
    document.getElementById('shippingModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeShippingModal() {
    document.getElementById('shippingModal').classList.remove('active');
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

// ─── "Request Quote" button → switch to Payment tab ──────────────────────────
document.querySelector('.request-quote-btn')?.addEventListener('click', () => {
    // Switch to payment tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const payBtn = document.querySelector('[data-tab="payment"]');
    if (payBtn) payBtn.classList.add('active');
    const payTab = document.getElementById('payment-tab');
    if (payTab) payTab.classList.add('active');

    initStripePayment();
});

// ─── Stripe initialisation ────────────────────────────────────────────────────
async function initStripePayment() {
    // Avoid re-initialising if already done
    if (cardElement) return;

    // Show loading state
    setPaymentView('loading');

    try {
        // 1️⃣  Create a PaymentIntent on the server
        const basket  = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        const summary = buildBasketSummary(basket);

        const intentRes = await fetch('/api/quotes/stripe/payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currency: 'gbp',
                basket,
                summary,
                customer: getCustomerData(),
            }),
        });

        if (!intentRes.ok) {
            const err = await intentRes.json().catch(() => ({}));
            throw new Error(err.message || `Server error ${intentRes.status}`);
        }

        const { clientSecret, id } = await intentRes.json();
        paymentIntentId       = id;
        paymentIntentClientSecret = clientSecret;

        // 2️⃣  Mount Stripe Elements card form
        stripe = Stripe(STRIPE_PK);
        const elements = stripe.elements();
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '15px',
                    fontFamily: 'Inter, sans-serif',
                    color: '#1a1a1a',
                    '::placeholder': { color: '#9ca3af' },
                },
                invalid: { color: '#ef4444' },
            },
        });
        cardElement.mount('#card-element');

        cardElement.on('change', ({ error }) => {
            const el = document.getElementById('card-errors');
            el.textContent = error ? error.message : '';
        });

        setPaymentView('form');

    } catch (err) {
        console.error('[STRIPE INIT]', err);
        showPaymentError(err.message || 'Could not initialise payment. Please try again.');
    }
}

// ─── Stripe payment form submit ───────────────────────────────────────────────
document.getElementById('stripe-payment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!stripe || !cardElement || !paymentIntentClientSecret) return;

    setPayBtnLoading(true);

    try {
        const { paymentIntent, error } = await stripe.confirmCardPayment(
            paymentIntentClientSecret,
            { payment_method: { card: cardElement } }
        );

        if (error) {
            document.getElementById('card-errors').textContent = error.message;
            setPayBtnLoading(false);
            return;
        }

        // 3️⃣  Verify status via GET endpoint
        await verifyPaymentStatus(paymentIntent.id || paymentIntentId);

    } catch (err) {
        console.error('[STRIPE CONFIRM]', err);
        showPaymentError(err.message || 'Payment failed. Please try again.');
        setPayBtnLoading(false);
    }
});

async function verifyPaymentStatus(intentId) {
    try {
        const res = await fetch(`/api/quotes/stripe/payment-intent/${intentId}`);
        if (!res.ok) throw new Error(`Status check failed (${res.status})`);

        const { status } = await res.json();

        if (status === 'succeeded') {
            setPaymentView('success');
            // Clear basket and redirect after short delay
            setTimeout(() => {
                localStorage.removeItem('quoteBasket');
                localStorage.setItem('quoteBasket', '[]');
                window.location.replace('/');
            }, 2500);
        } else {
            // Payment is in a pending/processing state – show friendly message
            showPaymentError(`Payment status: ${status}. Please contact us if the problem persists.`);
        }
    } catch (err) {
        console.error('[STRIPE VERIFY]', err);
        // Payment may still have succeeded; show a neutral message
        setPaymentView('success');
    }
}

// ─── Retry button ─────────────────────────────────────────────────────────────
document.getElementById('payment-retry-btn')?.addEventListener('click', () => {
    cardElement = null;
    paymentIntentId = null;
    paymentIntentClientSecret = null;
    initStripePayment();
});

// ─── UI helpers ───────────────────────────────────────────────────────────────
function setPaymentView(view) {
    // view: 'loading' | 'form' | 'success' | 'error'
    document.getElementById('payment-loading').style.display       = view === 'loading' ? 'flex'  : 'none';
    document.getElementById('stripe-payment-form').style.display   = view === 'form'    ? 'block' : 'none';
    document.getElementById('payment-success').style.display       = view === 'success' ? 'block' : 'none';
    document.getElementById('payment-error-state').style.display   = view === 'error'   ? 'block' : 'none';
}

function showPaymentError(msg) {
    document.getElementById('payment-error-msg').textContent = msg;
    setPaymentView('error');
}

function setPayBtnLoading(loading) {
    const btn     = document.getElementById('stripe-pay-btn');
    const text    = document.getElementById('stripe-btn-text');
    const spinner = document.getElementById('stripe-btn-spinner');
    btn.disabled        = loading;
    text.style.display  = loading ? 'none'   : 'inline';
    spinner.style.display = loading ? 'inline' : 'none';
}

// ─── Data helpers ──────────────────────────────────────────────────────────────
function buildBasketSummary(basket) {
    const total = basket.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
    return { totalGBP: parseFloat(total.toFixed(2)), itemCount: basket.length };
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

// ─── Promo timer ───────────────────────────────────────────────────────────────
function startPromoTimer() {
    const timerEl = document.getElementById('promoTimer');
    if (!timerEl) return;

    let hours = 145, minutes = 26, seconds = 52;

    setInterval(() => {
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--;   }
        if (hours   < 0) { hours = minutes = seconds = 0; }
        timerEl.textContent = `${hours}H : ${minutes}M : ${String(seconds).padStart(2, '0')}S`;
    }, 1000);
}

// ─── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    startPromoTimer();
    const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
    console.log('[CHECKOUT] Basket items:', basket.length);
});
