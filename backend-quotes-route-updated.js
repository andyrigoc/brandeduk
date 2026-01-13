const express = require('express');
const router = express.Router();
const { sendQuoteEmail } = require('../utils/emailService');

router.post('/', async (req, res) => {
  try {
    const {
      customer,
      summary,
      basket,
      customizations,
      timestamp,
    } = req.body;

    // ✅ minimal required checks
    if (!customer || !customer.email) {
      return res.status(400).json({
        success: false,
        message: 'Customer email is required',
      });
    }

    if (!Array.isArray(basket) || basket.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Basket is required',
      });
    }

    // ✅ pass-through spec structure with company and address support
    const emailData = {
      customer: {
        fullName: customer.fullName || 'N/A',
        company: customer.company || 'N/A',
        phone: customer.phone || 'N/A',
        email: customer.email,
        address: customer.address || 'N/A',
      },

      summary: summary || {},

      basket: basket.map(item => ({
        name: item.name,
        code: item.code,
        color: item.color,
        quantity: item.quantity,
        sizes: item.sizes || {},
        sizesSummary: item.sizesSummary || '',
        unitPrice: item.unitPrice,
        itemTotal: item.itemTotal,
        image: item.image || null,
      })),

      customizations: Array.isArray(customizations)
        ? customizations.map(c => ({
            position: c.position,
            method: c.method,
            type: c.type,
            hasLogo: c.hasLogo,
            text: c.text ?? null,
            unitPrice: c.unitPrice,
            lineTotal: c.lineTotal,
            quantity: c.quantity,
          }))
        : [],

      timestamp: timestamp || new Date().toISOString(),
    };

    const emailResult = await sendQuoteEmail(emailData);

    if (emailResult?.success) {
      return res.status(200).json({
        success: true,
        message: 'Quote sent successfully',
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      return res.status(200).json({
        success: true,
        message: 'Quote received (email disabled in dev)',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to send quote email',
    });

  } catch (error) {
    console.error('[QUOTES ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting quote',
    });
  }
});

module.exports = router;

