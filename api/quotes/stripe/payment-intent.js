/**
 * Vercel Serverless Function
 * POST /api/quotes/stripe/payment-intent
 *
 * Creates a Stripe PaymentIntent using the Stripe REST API directly (no npm package).
 *
 * Environment variables required on Vercel:
 *   STRIPE_SECRET_KEY  – Stripe secret key (sk_live_... or sk_test_...)
 *   API_BASE_URL       – Optional override for product catalog (default https://api.brandeduk.com)
 *
 * SECURITY:
 *   Client-supplied unitPrice/itemTotal are NOT trusted for charging.
 *   This handler looks up garment prices from api.brandeduk.com when a product
 *   code is present. Customization / logo application fees are NOT fully priced
 *   server-side yet — those amounts are still a residual risk until the
 *   customization catalog is available to this function. Absurd totals are capped.
 */

'use strict';

const API_BASE = (process.env.API_BASE_URL || 'https://api.brandeduk.com').replace(/\/+$/, '');
const MAX_LINE_QTY = 5000;
const MAX_UNIT_GBP = 500;          // single garment unit ceiling
const MAX_TOTAL_PENCE = 500_000_00; // £500,000 hard cap
const MIN_STRIPE_PENCE = 30;

const productCache = new Map();

function pickPriceBreak(priceBreaks, qty) {
    if (!Array.isArray(priceBreaks) || !priceBreaks.length) return null;
    const sorted = [...priceBreaks].sort((a, b) => {
        const amin = Number(a.minQty ?? a.min ?? a.from ?? 0);
        const bmin = Number(b.minQty ?? b.min ?? b.from ?? 0);
        return amin - bmin;
    });
    let chosen = sorted[0];
    for (const br of sorted) {
        const min = Number(br.minQty ?? br.min ?? br.from ?? 0);
        if (qty >= min) chosen = br;
    }
    const price = Number(chosen.price ?? chosen.unitPrice ?? chosen.sell_price ?? chosen.value);
    return Number.isFinite(price) && price >= 0 ? price : null;
}

async function fetchCatalogUnitPrice(code, qty) {
    if (!code) return null;
    const cacheKey = String(code).trim().toUpperCase();
    let product = productCache.get(cacheKey);
    if (!product) {
        try {
            const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(cacheKey)}`, {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) return null;
            const data = await res.json();
            product = data.product || data.data || data;
            productCache.set(cacheKey, product);
        } catch (err) {
            console.warn('[payment-intent] catalog fetch failed:', err.message);
            return null;
        }
    }
    const breaks = product.priceBreaks || product.price_breaks || [];
    const breakPrice = pickPriceBreak(breaks, qty);
    if (breakPrice != null) return breakPrice;
    const base = Number(product.price ?? product.sell_price ?? product.basePrice ?? product.unitPrice);
    return Number.isFinite(base) && base >= 0 ? base : null;
}

/**
 * Resolve a trusted line total in GBP.
 * Prefer catalog unit price × qty. Fall back to validated client prices only
 * when catalog lookup fails (documented residual risk for custom fees).
 */
async function resolveLineTotalGbp(item) {
    const qtyRaw = parseFloat(item.qty ?? item.quantity ?? 1);
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.min(qtyRaw, MAX_LINE_QTY) : 0;
    if (qty <= 0) {
        throw new Error('Invalid quantity');
    }

    const code = item.code || item.productCode || item.styleCode || '';
    let unit = await fetchCatalogUnitPrice(code, qty);

    // RESIDUAL RISK: if catalog is unreachable or item has no code (e.g. pure
    // customization line), we accept a capped client unit price rather than
    // blocking checkout entirely. Prefer wiring a server customization tariff.
    if (unit == null) {
        const clientUnit = parseFloat(item.unitPrice ?? item.price ?? item.basePrice ?? NaN);
        if (!Number.isFinite(clientUnit) || clientUnit < 0) {
            throw new Error('Missing or invalid price');
        }
        if (clientUnit > MAX_UNIT_GBP) {
            throw new Error('Unit price exceeds allowed maximum');
        }
        unit = clientUnit;
        // Do not trust client itemTotal when falling back — always unit * qty
    }

    if (unit > MAX_UNIT_GBP) {
        throw new Error('Catalog unit price exceeds allowed maximum');
    }

    // Optional decoration add-on from client, capped (not catalog-backed yet)
    let decoPerUnit = 0;
    const clientDeco = parseFloat(item.decorationUnitPrice ?? item.logoUnitPrice ?? item.customizationUnitPrice ?? 0);
    if (Number.isFinite(clientDeco) && clientDeco > 0) {
        decoPerUnit = Math.min(clientDeco, 100); // £100/unit decoration cap
    }

    return (unit + decoPerUnit) * qty;
}

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

        if (!basket.length) {
            return res.status(400).json({ message: 'Basket is empty' });
        }

        let totalGbp = 0;
        for (const item of basket) {
            totalGbp += await resolveLineTotalGbp(item);
        }

        if (!Number.isFinite(totalGbp) || totalGbp < 0) {
            return res.status(400).json({ message: 'Invalid basket total' });
        }

        let totalPence = Math.round(totalGbp * 100);
        if (totalPence < MIN_STRIPE_PENCE) totalPence = MIN_STRIPE_PENCE;
        if (totalPence > MAX_TOTAL_PENCE) {
            return res.status(400).json({ message: 'Order total exceeds allowed maximum' });
        }

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
        const clientMsg = /Invalid|Missing|exceeds|Basket/i.test(err.message)
            ? err.message
            : 'Unable to create payment';
        return res.status(400).json({ message: clientMsg });
    }
};
