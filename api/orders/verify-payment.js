'use strict';

/**
 * Vercel Serverless Function
 * GET /api/orders/verify-payment?session_id=cs_...
 *
 * Used by payment-success.html. Looks the Stripe Checkout Session up with the
 * secret key (never trusts the URL alone) and returns:
 *   { verified, paid, total, currency, orderNumber, transactionId,
 *     conversionEligible, conversionMinimum }
 *
 * conversionEligible is the only switch that lets the page send the Google Ads
 * Purchase conversion: the payment must be confirmed by Stripe, in GBP, and the
 * amount actually charged must be at least CONVERSION_MIN_GBP.
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY  - same Stripe account that creates the Checkout Sessions
 */

const CONVERSION_MIN_GBP = 50;

function pickOrderNumber(session) {
    const meta = session.metadata || {};
    const candidates = [
        meta.orderNumber, meta.order_number, meta.orderNo, meta.order_id, meta.orderId,
        session.client_reference_id,
        meta.quoteId, meta.quote_id,
    ];
    const found = candidates.find((v) => typeof v === 'string' && v.trim());
    return found ? found.trim().slice(0, 64) : '';
}

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ verified: false, message: 'Method not allowed' });
    }

    const sessionId = String((req.query && req.query.session_id) || '').trim();
    if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) {
        return res.status(400).json({ verified: false, message: 'Invalid session id' });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        return res.status(503).json({ verified: false, message: 'Payment verification not configured' });
    }

    try {
        const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${secretKey}` },
        });
        const session = await stripeRes.json().catch(() => ({}));

        if (!stripeRes.ok) {
            const status = stripeRes.status === 404 ? 404 : 502;
            return res.status(status).json({ verified: false, message: 'Payment not found' });
        }

        const paid = session.payment_status === 'paid' && session.status === 'complete';
        const currency = String(session.currency || '').toLowerCase();
        const amount = Number(session.amount_total);
        const total = Number.isFinite(amount) ? Math.round(amount) / 100 : null;
        const orderNumber = pickOrderNumber(session);

        const conversionEligible = Boolean(
            paid && currency === 'gbp' && total != null && total >= CONVERSION_MIN_GBP
        );

        return res.status(200).json({
            verified: true,
            paid,
            total: paid ? total : null,
            currency: currency.toUpperCase(),
            orderNumber: paid ? orderNumber : '',
            transactionId: paid ? (orderNumber || session.id) : '',
            conversionEligible,
            conversionMinimum: CONVERSION_MIN_GBP,
        });
    } catch (err) {
        console.error('[verify-payment]', err.message);
        return res.status(502).json({ verified: false, message: 'Payment verification failed' });
    }
};
