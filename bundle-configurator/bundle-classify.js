// How many people a bundle covers, worked out from the bundle's own API data
// (title, quantity, products). Pure function, no network.
//
// Rules follow the competitor deals document ("Schema bundle per team"):
//  - Workwear Express and GoCustom: one garment per person, so a single-product
//    bundle covers `quantity` people. A pack of several products covers as many
//    people as the products' shared quantity (5 jackets + 5 beanies = 5 people).
//  - JRS counts items, not people. Titles often say "Team of N" or "Perfect for
//    N people"; "Kickstarter" and "Lone Ranger" kits are one person; the other
//    mixed kits follow JRS's own ladder (16 items = 2 people ... 90 items = 15).

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

// Items in a JRS mixed kit -> people it covers (from the document's tiers).
const JRS_KIT_PEOPLE = {4: 1, 6: 1, 7: 1, 8: 1, 9: 1, 16: 2, 24: 3, 32: 4, 36: 6, 48: 8, 60: 10, 90: 15};

const sourceOf = deal => String(deal.slug || '').split('-')[0];

// A JRS "N Item" / "N Piece" bundle, or a combo, is a kit of different garments.
function isJrsKit(title) {
  const t = title.toLowerCase();
  if (/regatta dover jacket bundle/.test(t)) return false; // N identical jackets
  return /\b\d+\s*(item|piece)\b/.test(t) || /combo|kickstarter|lone ranger|mix\s*&\s*match/.test(t);
}

export function teamSize(deal) {
  const title = String(deal.title || '');
  const quantity = Number(deal.qty) || 0;
  const said = title.match(/team of (\d+)/i) || title.match(/perfect for (\d+) people/i);
  if (said) return Number(said[1]);
  if (sourceOf(deal) === 'jrs') {
    if (/kickstarter|lone ranger|combo|buckbootz/i.test(title)) return 1;
    if (isJrsKit(title)) return JRS_KIT_PEOPLE[quantity] || Math.max(1, Math.round(quantity / 7));
    return quantity; // 8x beanies, 25x hi-vis vests ...: one per person
  }
  const lines = Object.values(deal.fixed || {}).map(Number).filter(count => count > 0);
  if (lines.length) return lines.reduce(gcd);
  return quantity;
}
