/**
 * Vercel Serverless Function
 * POST /api/quotes/stripe/payment-intent
 *
 * Creates a Stripe PaymentIntent for the basket total.
 *
 * Environment variables required on Vercel:
 *   STRIPE_SECRET_KEY  – Stripe secret key (sk_live_... or sk_test_...)
 */

'use strict';

const Stripe = require('stripe');

module.exports = async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        return res.status(500).json({ error: 'Stripe not configured on server' });
    }

    try {
        const body = req.body || {};
        const basket   = Array.isArray(body.basket)   ? body.basket   : [];
        const customer = body.customer || {};
        const currency = (body.currency || 'gbp').toLowerCase();

        // Calculate total server-side from basket items (pence)
        let totalPence = 0;
        for (const item of basket) {
            const itemTotal = parseFloat(item.itemTotal || 0);
            if (!isNaN(itemTotal) && itemTotal > 0) {
                totalPence += Math.round(itemTotal * 100);
            }
        }

        // Minimum Stripe amount is 30p GBP
        if (totalPence < 30) totalPence = 30;

        const stripe = Stripe(secretKey);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalPence,
            currency,
            automatic_payment_methods: { enabled: true },
            metadata: {
                customer_email: customer.email || '',
                customer_name:  customer.fullName || customer.firstName || '',
                basket_items:   String(basket.length),
            },
        });

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            id:           paymentIntent.id,
            amount:       paymentIntent.amount,
        });

    } catch (err) {
        console.error('[payment-intent]', err.message);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
};
