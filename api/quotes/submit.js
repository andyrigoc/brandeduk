/**
 * Vercel Serverless Function
 * POST /api/quotes/submit
 *
 * Receives a quote request from checkout and sends a notification email
 * to the Branded UK team via the Resend API (no npm package needed).
 *
 * Environment variables required on Vercel:
 *   RESEND_API_KEY   – From resend.com (free tier: 3,000 emails/month)
 *   QUOTE_TO_EMAIL   – Where quote notifications go (default: info@brandeduk.com)
 *   QUOTE_FROM_EMAIL – Verified sender domain (default: quotes@brandeduk.com)
 */

'use strict';

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;
const rateBuckets = new Map();

function clientIp(req) {
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
}

function rateLimitOk(req) {
    const key = clientIp(req);
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || now - bucket.start > RATE_WINDOW_MS) {
        bucket = { start: now, count: 0 };
        rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    return bucket.count <= RATE_MAX;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!rateLimitOk(req)) {
        return res.status(429).json({ message: 'Too many requests. Please try again shortly.' });
    }

    const body     = req.body || {};
    const basket   = Array.isArray(body.basket)   ? body.basket   : [];
    const customer = body.customer && typeof body.customer === 'object' ? body.customer : {};

    // Honeypot: bots fill hidden fields; real users leave them empty
    if (body.website || body.company_url || body.honeypot) {
        return res.status(200).json({ ok: true });
    }

    if (basket.length > 100) {
        return res.status(400).json({ message: 'Basket too large' });
    }

    // ── Build email HTML (all user/product fields escaped) ─────────────────────
    const itemRows = basket.map(item => {
        const qty       = escapeHtml(item.qty || item.quantity || 1);
        const unitPrice = parseFloat(item.unitPrice || item.price || 0);
        const unitStr   = Number.isFinite(unitPrice) ? unitPrice.toFixed(2) : '0.00';
        const name      = escapeHtml(item.name  || item.productName || 'Unknown item');
        const code      = escapeHtml(item.code  || item.productCode || '');
        const color     = escapeHtml(item.color || item.colour      || '');
        const size      = escapeHtml(item.size  || '');
        const logos     = Array.isArray(item.logos) ? item.logos.length : 0;
        return `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">${name}${code ? ` (${code})` : ''}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${color}${size ? ` / ${size}` : ''}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">£${escapeHtml(unitStr)}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${logos} logo${logos !== 1 ? 's' : ''}</td>
            </tr>`;
    }).join('');

    const basketTotal = basket.reduce((sum, item) => {
        const qty       = parseFloat(item.qty || item.quantity || 1);
        const unitPrice = parseFloat(item.unitPrice || item.price || 0);
        const lineTotal = parseFloat(item.itemTotal || (unitPrice * qty) || 0);
        return sum + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);

    const submittedAt = escapeHtml(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
    const custName    = escapeHtml(customer.fullName || customer.firstName || 'Guest');
    const custEmail   = escapeHtml(customer.email || '—');
    const custPhone   = escapeHtml(customer.phone || '—');
    const custCompany = escapeHtml(customer.company || '—');
    const custAddress = escapeHtml(
        [customer.address, customer.address2, customer.city, customer.postcode, customer.country]
            .filter(Boolean).join(', ') || '—'
    );
    const replyTo = typeof customer.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)
        ? customer.email
        : undefined;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#f97316;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:22px">New Quote Request</h1>
    <p style="margin:4px 0 0;opacity:.9;font-size:13px">${submittedAt}</p>
  </div>
  <div style="border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;padding:24px">
    <h2 style="font-size:16px;margin:0 0 12px;color:#f97316">Customer Details</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr><td style="padding:4px 0;color:#666;width:140px">Name</td><td style="padding:4px 0"><strong>${custName}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#666">Email</td><td style="padding:4px 0">${custEmail}</td></tr>
      <tr><td style="padding:4px 0;color:#666">Phone</td><td style="padding:4px 0">${custPhone}</td></tr>
      <tr><td style="padding:4px 0;color:#666">Company</td><td style="padding:4px 0">${custCompany}</td></tr>
      <tr><td style="padding:4px 0;color:#666">Address</td><td style="padding:4px 0">${custAddress}</td></tr>
    </table>

    <h2 style="font-size:16px;margin:0 0 12px;color:#f97316">Basket (${basket.length} item${basket.length !== 1 ? 's' : ''})</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #eee">Product</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;border-bottom:2px solid #eee">Variant</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;border-bottom:2px solid #eee">Qty</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#666;border-bottom:2px solid #eee">Unit</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;border-bottom:2px solid #eee">Logos</th>
        </tr>
      </thead>
      <tbody>${itemRows || '<tr><td colspan="5" style="padding:12px;text-align:center;color:#999">No items</td></tr>'}</tbody>
    </table>
    <p style="text-align:right;font-size:16px;font-weight:700;margin:0 0 24px">
      Estimated total: <span style="color:#f97316">£${escapeHtml(basketTotal.toFixed(2))}</span> <span style="font-size:12px;font-weight:400;color:#666">(exc. VAT)</span>
    </p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:12px 16px;font-size:13px;color:#9a3412">
      Reply to this email or call the customer to confirm the quote and send a payment link.
    </div>
  </div>
</body>
</html>`;

    const toEmail   = process.env.QUOTE_TO_EMAIL   || 'info@brandeduk.com';
    const fromEmail = process.env.QUOTE_FROM_EMAIL || 'quotes@brandeduk.com';
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
        console.warn('[submit-quote] RESEND_API_KEY not set – email not sent. Customer:', customer.email, 'Items:', basket.length);
        return res.status(503).json({ ok: false, message: 'Quote service temporarily unavailable' });
    }

    try {
        const emailRes = await fetch('https://api.resend.com/emails', {
            method:  'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({
                from:     `Branded UK Quotes <${fromEmail}>`,
                to:       [toEmail],
                reply_to: replyTo,
                subject:  `New Quote Request – ${customer.fullName || customer.email || 'Guest'} (${basket.length} item${basket.length !== 1 ? 's' : ''})`,
                html:     htmlBody,
            }),
        });

        const data = await emailRes.json().catch(() => ({}));

        if (!emailRes.ok) {
            console.error('[submit-quote] Resend error:', data?.message || emailRes.status);
            return res.status(502).json({ ok: false, message: 'Unable to send quote email. Please try again.' });
        }

        return res.status(200).json({ ok: true, emailId: data.id });

    } catch (err) {
        console.error('[submit-quote] fetch error:', err.message);
        return res.status(502).json({ ok: false, message: 'Unable to send quote email. Please try again.' });
    }
};
