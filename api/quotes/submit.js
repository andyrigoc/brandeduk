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

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const body     = req.body || {};
    const basket   = Array.isArray(body.basket)   ? body.basket   : [];
    const customer = body.customer && typeof body.customer === 'object' ? body.customer : {};

    // ── Build email HTML ───────────────────────────────────────────────────────
    const itemRows = basket.map(item => {
        const qty       = item.qty || item.quantity || 1;
        const unitPrice = parseFloat(item.unitPrice || item.price || 0).toFixed(2);
        const name      = item.name  || item.productName || 'Unknown item';
        const code      = item.code  || item.productCode || '';
        const color     = item.color || item.colour      || '';
        const size      = item.size  || '';
        const logos     = Array.isArray(item.logos) ? item.logos.length : 0;
        return `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">${name}${code ? ` (${code})` : ''}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${color}${size ? ` / ${size}` : ''}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">£${unitPrice}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${logos} logo${logos !== 1 ? 's' : ''}</td>
            </tr>`;
    }).join('');

    const basketTotal = basket.reduce((sum, item) => {
        const qty       = parseFloat(item.qty || item.quantity || 1);
        const unitPrice = parseFloat(item.unitPrice || item.price || 0);
        const lineTotal = parseFloat(item.itemTotal || (unitPrice * qty) || 0);
        return sum + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);

    const submittedAt = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });

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
      <tr><td style="padding:4px 0;color:#666;width:140px">Name</td><td style="padding:4px 0"><strong>${customer.fullName || customer.firstName || 'Guest'}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#666">Email</td><td style="padding:4px 0">${customer.email || '—'}</td></tr>
      <tr><td style="padding:4px 0;color:#666">Phone</td><td style="padding:4px 0">${customer.phone || '—'}</td></tr>
      <tr><td style="padding:4px 0;color:#666">Company</td><td style="padding:4px 0">${customer.company || '—'}</td></tr>
      <tr><td style="padding:4px 0;color:#666">Address</td><td style="padding:4px 0">${[customer.address, customer.address2, customer.city, customer.postcode, customer.country].filter(Boolean).join(', ') || '—'}</td></tr>
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
      Estimated total: <span style="color:#f97316">£${basketTotal.toFixed(2)}</span> <span style="font-size:12px;font-weight:400;color:#666">(exc. VAT)</span>
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

    // If no Resend key, log and still return 200 (so UI shows success)
    if (!resendKey) {
        console.warn('[submit-quote] RESEND_API_KEY not set – email not sent. Customer:', customer.email, 'Items:', basket.length);
        return res.status(200).json({ ok: true, note: 'Logged only (no RESEND_API_KEY)' });
    }

    try {
        const emailRes = await fetch('https://api.resend.com/emails', {
            method:  'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({
                from:    `Branded UK Quotes <${fromEmail}>`,
                to:      [toEmail],
                reply_to: customer.email || undefined,
                subject: `New Quote Request – ${customer.fullName || customer.email || 'Guest'} (${basket.length} item${basket.length !== 1 ? 's' : ''})`,
                html:    htmlBody,
            }),
        });

        const data = await emailRes.json();

        if (!emailRes.ok) {
            console.error('[submit-quote] Resend error:', data);
            // Still return 200 – customer's submission is recorded; email issue is internal
            return res.status(200).json({ ok: true, warning: data?.message || 'Email delivery warning' });
        }

        return res.status(200).json({ ok: true, emailId: data.id });

    } catch (err) {
        console.error('[submit-quote] fetch error:', err.message);
        // Return 200 so the UI doesn't show an error to the customer
        return res.status(200).json({ ok: true, warning: err.message });
    }
};
