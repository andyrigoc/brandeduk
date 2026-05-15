/**
 * Vercel Serverless Function
 * POST /api/quotes/stripe/payment-intent
 *
 * Creates a Stripe PaymentIntent for the basket total.
 *
 * Environment variables required on Vercel:
 *   STRIPE_SECRET_KEY  – Stripe secret key (sk_live_... or sk_test_...)
 */

/**
 * Vercel Serverless Function
 * POST /api/quotes/stripe/payment-intent
 *
 * Creates a Stripe PaymentIntent using the Stripe REST API directly (no npm package).
 *
 * Environment variables required on Vercel:
 *   STRIPE_SECRET_KEY  – Stripe secret key (sk_live_... or sk_test_...)
 */

'use strict';

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        return res.status(500).json({ message: 'Stripe not configured on server' });
    }

    try {
        const body     = req.body || {};
        const basket   = Array.isArray(body.basket) ? body.basket : [];
        const customer = body.customer || {};
        const currency = (body.currency || 'gbp').toLowerCase();

        // Calculate total from basket items (pence)
        let totalPence = 0;
        for (const item of basket) {
            const qty       = parseFloat(item.qty || item.quantity || 1);
            const unitPrice = parseFloat(item.unitPrice || item.price || 0);
            const itemTotal = parseFloat(item.itemTotal || (unitPrice * qty) || 0);
            if (!isNaN(itemTotal) && itemTotal > 0) {
                totalPence += Math.round(itemTotal * 100);
            }
        }
        if (totalPence < 30) totalPence = 30; // Stripe minimum

        // Call Stripe REST API directly (no npm package needed)
        const params = new URLSearchParams({
            amount:   String(totalPence),
            currency,
            'automatic_payment_methods[enabled]': 'true',
            'metadata[customer_email]': customer.email || '',
            'metadata[customer_name]':  customer.fullName || customer.firstName || '',
            'metadata[basket_items]':   String(basket.length),
        });

        const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
            method:  'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type':  'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const data = await stripeRes.json();

        if (!stripeRes.ok) {
            return res.status(stripeRes.status).json({ message: data?.error?.message || 'Stripe error' });
        }

        return res.status(200).json({
            clientSecret: data.client_secret,
            id:           data.id,
            amount:       data.amount,
        });

    } catch (err) {
        console.error('[payment-intent]', err.message);
        return res.status(500).json({ message: err.message || 'Internal server error' });
    }
};

