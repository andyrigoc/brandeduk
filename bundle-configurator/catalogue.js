// Runtime registry of the products used by the bundles that have been loaded.
// Everything in it comes from the bundle API (see bundle-api.js): names, brands,
// images, and the live colour x size SKUs. Nothing is hardcoded here.
//   products[styleCode] = {name, label, brand, image, componentId, loaded,
//                          colours: [], sizes: [], skus: Map('colour|size' -> sku)}
export const products = {};

export const skuKey = (colour, size) => `${colour}|${size}`;

// Supplier colour names carry markers ("Black*", stray non-breaking spaces and
// replacement characters). Customers see the clean name.
export const cleanColour = name => String(name ?? '').replace(/[*\u2020\u2021\u00a0\ufffd]+/g, ' ').replace(/\s+/g, ' ').trim();

export function registerProduct(component) {
  const existing = products[component.code];
  if (existing) return existing;
  return (products[component.code] = {
    code: component.code,
    name: component.name,
    label: component.type || component.name,
    brand: component.brand,
    image: component.image,
    componentId: component.id,
    loaded: false,
    colours: [],
    sizes: [],
    skus: new Map(),
    images: new Map()
  });
}

export function fillOptions(product, options) {
  const colours = [];
  const sizes = new Map();
  product.skus = new Map();
  product.images = new Map();
  for (const option of options) {
    const colour = cleanColour(option.colourName);
    const size = option.sizeName;
    if (!colour || !size) continue;
    if (!product.skus.has(skuKey(colour, size))) product.skus.set(skuKey(colour, size), option.skuCode);
    if (option.image && !product.images.has(colour)) product.images.set(colour, option.image);
    if (!colours.includes(colour)) colours.push(colour);
    if (!sizes.has(size)) sizes.set(size, option.sizeOrder ?? 9999);
  }
  product.colours = colours;
  product.sizes = [...sizes.entries()].sort((a, b) => a[1] - b[1]).map(([size]) => size);
  product.loaded = true;
}

export const sizesFor = (product, colour) => product.sizes.filter(size => product.skus.has(skuKey(colour, size)));

// Swatch colour from the supplier colour name. Unknown names get a neutral grey.
const SWATCH_WORDS = [
  [/black|jet/, '#202227'], [/navy|oxford|midnight|marine/, '#233354'], [/white|snow|natural|ivory|cream/, '#ffffff'],
  [/charcoal|graphite|anthracite|gunmetal/, '#545a63'], [/grey|gray|silver|ash|stone|heather|steel/, '#b5bac1'],
  [/royal|cobalt|sapphire|bright blue/, '#224db4'], [/sky|light blue|baby blue|aqua|turquoise/, '#7fb7e6'], [/blue|denim|petrol/, '#2f5fa8'],
  [/bottle|forest|emerald|olive|khaki|sage|military/, '#2f6b45'], [/lime|fluorescent green|hi-?vis green/, '#9bd52a'], [/green/, '#3f9a55'],
  [/fluorescent yellow|hi-?vis yellow|yellow|gold|sun|lemon|mustard/, '#e8d21d'], [/fluorescent orange|hi-?vis orange|orange|amber|pumpkin|rust/, '#f68027'],
  [/burgundy|maroon|wine|claret|plum/, '#6f1d34'], [/red|cherry|scarlet|fire|crimson/, '#c8202d'],
  [/pink|rose|fuchsia|magenta|blush|coral/, '#e56aa0'], [/purple|violet|lilac|lavender|mauve/, '#7a4aa8'],
  [/brown|chocolate|coffee|walnut|tan|caramel|biscuit|sand|camel/, '#8a6a4a'], [/teal/, '#1f8a8a']
];
export function swatchFor(name) {
  const text = String(name).toLowerCase();
  return SWATCH_WORDS.find(([pattern]) => pattern.test(text))?.[1] ?? '#c9ced6';
}

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
        product.skus.has(skuKey(row.colour, row.size)) && Number.isInteger(row.quantity) && row.quantity > 0);
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
  if (!max || !product?.skus.has(skuKey(colour, size)) || !Number.isInteger(quantity) || quantity < 0) return false;
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
