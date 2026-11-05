// Shared with the storefront. Never use a style's "from" price for a selected SKU.
(function (root) {
  'use strict';
  const norm = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const money = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  function fail(message) {
    const error = new Error(message);
    error.status = 409;
    throw error;
  }
  function tiersFor(product, variant) {
    const base = Number(variant.sell_price);
    if (!Number.isFinite(base) || base <= 0 || base >= 999.99) fail('Selected variant has no valid selling price');
    if (Array.isArray(variant.priceBreaks) && variant.priceBreaks.length) return variant.priceBreaks;
    return (product.priceBreaks || []).map(tier => {
      const discount = Number(tier.percentage ?? tier.save);
      if (!Number.isFinite(discount) || discount < 0 || discount >= 100) fail('Variant discount rules are unavailable; refresh the product');
      return { ...tier, price: money(base * (1 - discount / 100)) };
    });
  }
  function priceLine(product, item, quantity) {
    const variants = product.variants;
    if (!Array.isArray(variants) || !variants.length) fail('Live variant pricing is unavailable; refresh the product');
    const sizes = item.quantities || item.sizes || (item.size ? { [item.size]: item.qty || item.quantity || item.totalQty || 1 } : {});
    const entries = Object.entries(sizes).filter(([, count]) => Number(count) > 0);
    if (!entries.length) fail('Select a size before ordering');
    const color = norm(item.color || item.colour || item.colorName);
    if (!color) fail('Select a colour before ordering');
    let total = 0;
    let count = 0;
    const selected = [];
    for (const [size, rawCount] of entries) {
      const units = Number(rawCount);
      if (!Number.isInteger(units) || units < 1) fail('Invalid size quantity');
      const matches = variants.filter(v => norm(v.color) === color && norm(v.size) === norm(size));
      if (!matches.length) fail('Selected colour/size is no longer available');
      if (new Set(matches.map(v => Number(v.sell_price))).size !== 1) fail('Conflicting prices for selected colour/size');
      const variant = matches[0];
      const tiers = tiersFor(product, variant);
      const tier = tiers.filter(t => quantity >= Number(t.min) && (t.max == null || quantity <= Number(t.max)))
        .sort((a, b) => Number(b.min) - Number(a.min))[0];
      const floor = Number(variant.minimumPrice) || 0;
      const price = Math.max(Math.ceil(floor * 100 - 1e-8) / 100, Number(tier ? tier.price : variant.sell_price));
      if (!Number.isFinite(price) || price <= 0 || price >= 999.99) fail('Selected variant has no valid price');
      total += money(price) * units;
      count += units;
      selected.push({ ...variant, priceBreaks: tiers });
    }
    return { unitPrice: money(total / count), itemTotal: money(total), quantity: count, variants: selected };
  }
  const api = { priceLine, tiersFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BrandedVariantPricing = api;
})(typeof window !== 'undefined' ? window : globalThis);
