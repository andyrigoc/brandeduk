'use strict';

/**
 * Vercel Serverless Function
 * GET /api/quotes/stripe/payment-intent/:id
 *
 * Returns the status of an existing Stripe PaymentIntent.
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY
 */
module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        return res.status(500).json({ message: 'Stripe not configured on server' });
    }

    const intentId = req.query.id;
    if (!intentId || !intentId.startsWith('pi_')) {
        return res.status(400).json({ message: 'Invalid payment intent ID' });
    }

    try {
        const stripeRes = await fetch(`https://api.stripe.com/v1/payment_intents/${intentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
            },
        });

        const data = await stripeRes.json();

        if (!stripeRes.ok) {
            return res.status(stripeRes.status).json({ message: data?.error?.message || 'Stripe error' });
        }

        return res.status(200).json({
            status:   data.status,
            amount:   data.amount,
            currency: data.currency,
            id:       data.id,
        });

    } catch (err) {
        console.error('[payment-intent GET]', err.message);
        return res.status(500).json({ message: err.message || 'Internal server error' });
    }
};
