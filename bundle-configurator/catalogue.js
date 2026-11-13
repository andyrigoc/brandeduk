// The first five offers use the 9 Nov 2026 Branded UK deal analysis.
// Colour and size options come from the earlier Branded UK builder prototype.
const adultSizes = ['S', 'M', 'L', 'XL', '2XL'];
const oneSize = ['One size'];

export const products = {
  GD005: {name: 'Gildan Heavy Cotton™ adult T-shirt', label: 'T-shirts', colours: ['Black', 'Navy', 'White', 'Sport Grey', 'Royal Blue'], sizes: adultSizes},
  RX101: {name: 'ProRTX Pro Polo', label: 'Polos', colours: ['Navy', 'Black', 'White', 'Royal Blue', 'Charcoal'], sizes: adultSizes},
  RG045: {name: 'Regatta Professional Dover Jacket', label: 'Jackets', colours: ['Navy', 'Black'], sizes: adultSizes},
  RX301: {name: 'ProRTX Pro Sweatshirt', label: 'Sweatshirts', colours: ['Sport Grey', 'Navy', 'Black', 'Charcoal'], sizes: adultSizes},
  BC045: {name: 'Beechfield Original Cuffed Beanie', label: 'Beanies', colours: ['Charcoal', 'Black', 'Navy'], sizes: oneSize},
  YK001: {name: 'Yoko Hi-vis 2-band-and-braces waistcoat', label: 'Hi-vis vests', colours: ['Yellow', 'Orange'], sizes: adultSizes},
  BC025: {name: 'Beechfield Authentic 5-Panel Cap', label: 'Caps', colours: ['Black', 'Navy', 'White'], sizes: oneSize}
};

export const swatches = {
  Black: '#202227', Navy: '#233354', White: '#fff', 'Sport Grey': '#b5bac1',
  'Royal Blue': '#224db4', Charcoal: '#545a63', Yellow: '#d9ed22', Orange: '#f68027'
};

const print = ['Print'];
const printOrEmbroidery = ['Print', 'Embroidery'];
export const bundles = [
  {id: 'BUN-GD005-24', title: '24 Heavy Cotton T-Shirts', tag: 'Bulk printing', price: 14699, methods: print, delivery: true, art: 'tee', fixed: {GD005: 24}},
  {id: 'BUN-5-OUTDOOR', title: '5 × Outdoor Worker Bundle', tag: 'Team workwear', price: 48999, methods: printOrEmbroidery, art: 'outdoor', fixed: {RX101: 15, RG045: 5, RX301: 10, BC045: 5}},
  {id: 'BUN-5-COLD', title: '5 × Cold Weather Bundle', tag: 'Cold weather', price: 19599, methods: printOrEmbroidery, art: 'cold', fixed: {RG045: 5, BC045: 5}},
  {id: 'BUN-EVENT-10', title: '10 × Staff Event Bundle', tag: 'Event teams', price: 15249, methods: printOrEmbroidery, art: 'event', fixed: {RX101: 10, YK001: 10}},
  {id: 'BUN-GD005-100', title: '100 Heavy Cotton T-Shirts', tag: 'Bulk printing', price: 58799, methods: print, delivery: true, art: 'bulk', fixed: {GD005: 100}}
];

export const demos = [
  {id: 'DEMO-HEADWEAR-100', title: '100 Caps or Beanies', tag: 'Single type', price: 39900, methods: ['Embroidery'], demo: true, fixed: {},
    group: {name: 'Headwear style', type: 'exclusive', quantity: 100, codes: ['BC025', 'BC045']}},
  {id: 'DEMO-MIXED-10', title: '10 Polos & T-Shirts', tag: 'Mix and match', price: 9900, methods: print, demo: true, fixed: {},
    group: {name: 'Garment mix', type: 'mixed', quantity: 10, codes: ['RX101', 'GD005']}}
];

export const findBundle = id => [...bundles, ...demos].find(bundle => bundle.id === id);
export const sum = quantities => quantities.reduce((total, quantity) => total + quantity, 0);
export const pieceCount = bundle => sum(Object.values(bundle.fixed)) + (bundle.group?.quantity ?? 0);

const money = new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP'});
export const formatPrice = pence => money.format(pence / 100);

export function newDraft(bundle, saved) {
  return {
    bundle,
    step: saved ? 4 : 0,
    reached: saved ? 4 : 0,
    choice: saved?.choice ?? '',
    mix: {...saved?.mix},
    allocations: structuredClone(saved?.allocations ?? {}),
    method: saved?.method ?? (bundle.methods.length === 1 ? bundle.methods[0] : ''),
    logo: saved?.logo ?? null,
    notes: saved?.notes ?? '',
    lineId: saved?.id,
    activeProduct: '',
    dirty: false
  };
}

export function choiceValid(draft) {
  const group = draft.bundle.group;
  if (!group) return true;
  if (group.type === 'exclusive') return group.codes.includes(draft.choice);
  const entries = Object.entries(draft.mix);
  return entries.every(([code, n]) => group.codes.includes(code) && Number.isInteger(n) && n >= 0) &&
    sum(Object.values(draft.mix)) === group.quantity;
}

export function quotas(draft) {
  const result = {...draft.bundle.fixed};
  const group = draft.bundle.group;
  if (!group) return result;
  const chosen = group.type === 'exclusive' ? {[draft.choice]: group.quantity} : draft.mix;
  for (const code of group.codes) {
    if (Number.isInteger(chosen[code]) && chosen[code] > 0) result[code] = (result[code] ?? 0) + chosen[code];
  }
  return result;
}

export const allocated = (draft, code) => sum((draft.allocations[code] ?? []).map(row => row.quantity));

export function variantsValid(draft) {
  if (!choiceValid(draft)) return false;
  const target = quotas(draft);
  return Object.entries(draft.allocations).every(([code, rows]) => Boolean(target[code]) || rows.length === 0) &&
    Object.entries(target).every(([code, quantity]) => {
      const product = products[code];
      return allocated(draft, code) === quantity && (draft.allocations[code] ?? []).every(row =>
        product.colours.includes(row.colour) && product.sizes.includes(row.size) && Number.isInteger(row.quantity) && row.quantity > 0);
    });
}

export function setChoice(draft, code, quantity) {
  const group = draft.bundle.group;
  if (!group?.codes.includes(code)) return false;
  const old = quotas(draft);
  if (group.type === 'exclusive') {
    draft.choice = code;
  } else {
    const others = sum(Object.entries(draft.mix).filter(([key]) => key !== code).map(([, n]) => n));
    if (!Number.isInteger(quantity) || quantity < 0 || others + quantity > group.quantity) return false;
    draft.mix[code] = quantity;
  }
  const updated = quotas(draft);
  for (const key of group.codes) {
    if (old[key] !== updated[key]) delete draft.allocations[key];
  }
  draft.dirty = true;
  return true;
}

export function setAllocation(draft, code, colour, size, quantity) {
  const max = quotas(draft)[code];
  const product = products[code];
  if (!max || !product.colours.includes(colour) || !product.sizes.includes(size) || !Number.isInteger(quantity) || quantity < 0) return false;
  const rows = draft.allocations[code] ?? [];
  const otherRows = rows.filter(row => row.colour !== colour || row.size !== size);
  if (sum(otherRows.map(row => row.quantity)) + quantity > max) return false;
  draft.allocations[code] = quantity ? [...otherRows, {colour, size, quantity}] : otherRows;
  draft.dirty = true;
  return true;
}

export const fileMax = 10 * 1024 * 1024;
export const acceptedFile = file => file && file.size > 0 && file.size <= fileMax && /\.(png|jpe?g|pdf|svg|eps|ai)$/i.test(file.name);
export const logoValid = draft => Boolean(acceptedFile(draft.logo) && draft.bundle.methods.includes(draft.method));
export const readyToAdd = draft => variantsValid(draft) && logoValid(draft);
