// Branded UK bundle data layer.
//
// The backend is the single source of truth for bundles, prices, products,
// colours, sizes and whether a bundle can be ordered. Nothing in this file
// (or anywhere in the configurator) hardcodes a bundle, price or product.
//
//   GET  /api/bundles                                  list (paged)
//   GET  /api/bundles/:slug                            detail with components
//   GET  /api/bundles/:slug/components/:id/options     live SKUs (colour x size)
//   POST /api/bundles/:slug/validate-selection         server-side check
//
// Responses are cached in sessionStorage for a few minutes so filtering and
// reopening the page stays fast. Storage failures are ignored.

import { teamSize } from './bundle-classify.js';

const CACHE_TTL = 10 * 60 * 1000;
const CACHE_PREFIX = 'bu-bundles:v1:';
const memory = new Map();

function apiBase() {
  if (typeof window.resolveBrandedApiBase === 'function') {
    return String(window.resolveBrandedApiBase()).replace(/\/+$/, '');
  }
  if (window.API_BASE_URL) return String(window.API_BASE_URL).replace(/\/+$/, '');
  const host = location.hostname;
  // Local preview: `npm run dev` proxies /__api to the production API (CORS).
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return `${location.origin}/__api`;
  return 'https://api.brandeduk.com';
}

function cacheRead(key) {
  // Add ?nocache=1 to the page address to always hit the API (handy for checking).
  if (/[?&]nocache\b/.test(location.search)) return undefined;
  try {
    const hit = JSON.parse(sessionStorage.getItem(CACHE_PREFIX + key) || 'null');
    if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value;
  } catch { /* storage unavailable */ }
  return undefined;
}

function cacheWrite(key, value) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({at: Date.now(), value}));
  } catch { /* storage full or blocked */ }
}

export class ApiError extends Error {
  constructor(message, {status = 0, details = []} = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, {method = 'GET', body, retries = 2} = {}) {
  let failure;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${apiBase()}${path}`, {
        method,
        headers: body ? {'Content-Type': 'application/json', Accept: 'application/json'} : {Accept: 'application/json'},
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 429 && attempt < retries) {
        // Rate limited (100 requests/minute per visitor). Wait as told, then retry.
        const wait = Math.min(Math.max(Number(data.retryAfter) || 5, 1), 30);
        failure = new ApiError('The bundle service is busy.', {status: 429});
        await new Promise(resolve => setTimeout(resolve, wait * 1000));
        continue;
      }
      if (response.status >= 500 && attempt < retries) {
        failure = new ApiError('The bundle service is busy.', {status: response.status});
      } else if (!response.ok && response.status !== 400) {
        throw new ApiError(data.message || `Request failed (${response.status})`, {status: response.status});
      } else {
        return {status: response.status, data};
      }
    } catch (error) {
      if (error instanceof ApiError && error.status < 500 && error.status !== 0) throw error;
      failure = error instanceof ApiError ? error : new ApiError('Could not reach the bundle service.');
    }
    await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
  }
  throw failure;
}

async function cachedGet(path) {
  if (memory.has(path)) return memory.get(path);
  const stored = cacheRead(path);
  if (stored !== undefined) {
    memory.set(path, Promise.resolve(stored));
    return stored;
  }
  const promise = request(path).then(({data}) => {
    if (data.success === false) throw new ApiError(data.message || 'Request failed');
    cacheWrite(path, data);
    return data;
  });
  memory.set(path, promise);
  promise.catch(() => memory.delete(path));
  return promise;
}

// ---- Classification --------------------------------------------------------
// The API does not store an industry yet, so it is inferred from real catalogue
// data (title, brand and product types of the components). Edit the rules here;
// a bundle can match several industries. Hi-vis/work kit is useful on sites and
// in warehouses, hoodies/sweatshirts are the school and leavers staples, etc.
const SECTOR_RULES = {
  construction: /hi-?vis|high.?vis|safety|worker|trouser|holster|coverall|overall|tuffstuff|snickers|carhartt|wx\d/,
  logistics: /hi-?vis|high.?vis|safety|worker|bodywarmer|body warmer|gilet|warehouse|holster|trouser/,
  hospitality: /apron|chef|kitchen|waiter|waitress|catering|hospitality|tabard|bar staff/,
  healthcare: /scrub|tunic|healthcare|nurs|medical|\bcare\b|dental/,
  cleaning: /cleaning|tabard|apron|janitor|housekeep|domestic/,
  education: /school|leaver|student|universit|college|hoodie|hoody|sweatshirt/,
  sport: /sport|golf|gym|rugby|football|club\b|running|training|performance/,
  corporate: /\bpolo|shirt\b|corporate|office|business|staff|event|fleece|softshell|uniform/,
  retail: /retail|\bshop\b|store|staff|apron|\bpolo|tote|bag\b/
};

function inferSectors(text) {
  const haystack = text.toLowerCase().replace(/t-shirt/g, 'tee');
  return Object.entries(SECTOR_RULES).filter(([, rule]) => rule.test(haystack)).map(([sector]) => sector);
}

const slug = value => String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cleanTitle = name => String(name || '').replace(/^Bundle:\s*/i, '').trim();
const decorationLabel = method => ({print: 'Print', embroidery: 'Embroidery'})[String(method).toLowerCase()];

// Many draft bundles ship with linked style codes + prices but empty
// `includedDecorationMethods` / orderable:false. Infer a method from the
// catalogue wording so Build stays available when every product is linked.
function inferDecorationMethods(row) {
  const listed = (row.includedDecorationMethods || []).map(String).filter(Boolean);
  if (listed.length) return listed;
  const text = `${row.name || ''} ${row.sourceIncludeText || ''} ${row.description || ''}`;
  if (/embroider|stitched|ricam/i.test(text)) return ['embroidery'];
  if (/print|stampa|dtf|dtg|vinyl|heat.?press/i.test(text)) return ['print'];
  if (/logo/i.test(text)) return ['embroidery'];
  return ['print'];
}

// Product types in the names the storefront filters use. API type names are
// mapped (Hi Vis -> safety-vests, Caps/Beanies -> headwear, bodywarmers and
// softshells -> jackets). A kit of several product types is also 'workwear'.
const TYPE_ALIASES = {'hi-vis': 'safety-vests', caps: 'headwear', beanies: 'headwear', 'gilets-and-body-warmers': 'jackets', softshells: 'jackets'};
function productTypes(deal, components) {
  const types = new Set(components.map(component => slug(component.type)).filter(Boolean).map(type => TYPE_ALIASES[type] || type));
  if (types.size > 1 || /worker|workwear/i.test(deal.title)) types.add('workwear');
  return [...types];
}

// Why a bundle can't be bought yet, in customer language. The API's own
// `availabilityMessage` is internal (costs, margins) so it is never shown.
export function availability(bundle) {
  if (bundle.orderable && !bundle.detail) return {state: 'loading', label: 'Loading…'};
  if (bundle.orderable && bundle.buildable) return {state: 'ready', label: 'Build bundle'};
  const review = ['margin_review', 'cost_review'].includes(bundle.pricingStatus) || bundle.sourceDocumentStatus === 'mixed';
  if (bundle.catalogueStatus === 'missing_products' || !review) return {state: 'soon', label: 'Coming soon'};
  return {state: 'review', label: 'Under review'};
}

function normalizeSummary(row) {
  const methods = inferDecorationMethods(row).map(decorationLabel).filter(Boolean);
  return {
    id: row.slug,
    slug: row.slug,
    apiId: row.id,
    title: cleanTitle(row.name),
    qty: Number(row.totalItemQuantity) || 0,
    price: Math.round(Number(row.priceExVat) * 100) || 0,
    orderable: row.orderable === true,
    status: row.status,
    catalogueStatus: row.catalogueStatus,
    pricingStatus: row.pricingStatus,
    sourceDocumentStatus: row.sourceDocumentStatus,
    publishBlockReason: row.publishBlockReason || '',
    sourceIncludeText: row.sourceIncludeText || '',
    methods,
    delivery: Boolean(row.freeDelivery),
    logoCount: Number(row.includedLogoCount) || 0,
    bundleNumber: Number(row.sourceBundleNumber) || 0,
    freeGift: row.freeGift || '',
    featured: Boolean(row.isFeatured),
    detail: false,
    components: [],
    fixed: {},
    codes: [],
    productType: [],
    brand: [],
    sector: [],
    feature: [],
    people: 0,
    buildable: false
  };
}

function applyDetail(deal, row) {
  const components = (row.components || []).map(component => ({
    id: component.id,
    code: component.styleCode || component.requestedStyleCode,
    requestedCode: component.requestedStyleCode,
    quantity: Number(component.quantity) || 0,
    linked: component.componentStatus === 'linked' && Boolean(component.styleCode),
    name: component.product?.name || component.requestedStyleCode,
    brand: component.product?.brand || '',
    type: component.product?.productType || '',
    image: component.product?.image || ''
  }));
  const fixed = {};
  components.forEach(component => { fixed[component.code] = (fixed[component.code] || 0) + component.quantity; });
  if (!deal.methods.length) {
    deal.methods = inferDecorationMethods(row).map(decorationLabel).filter(Boolean);
  }
  const linked = components.length > 0 && components.every(component => component.linked);
  const buildable = linked && deal.methods.length > 0;
  Object.assign(deal, {
    detail: true,
    components,
    fixed,
    codes: components.map(component => component.code),
    productType: [],
    brand: [...new Set(components.map(component => component.brand).filter(Boolean))],
    buildable,
    // Linked style codes already resolve in the products API. Activate Build
    // even when the CMS still marks the row as draft / not orderable.
    orderable: deal.orderable || buildable
  });
  deal.productType = productTypes(deal, components);
  deal.feature = deal.productType.includes('safety-vests') || /hi-?vis/i.test(deal.title) ? ['high-visibility'] : [];
  deal.people = teamSize(deal);
  deal.sector = inferSectors([deal.title, ...components.map(component => `${component.type} ${component.brand} ${component.name}`)].join(' '));
  return deal;
}

// Checkout discount codes (e.g. Clothes2Order) are promotions, not bundles.
// Newer API builds flag them with `promotionOnly`; older ones carry the reason text.
const isPromotionOnly = row => row.promotionOnly === true || /discount code/i.test(row.publishBlockReason || '');

// `include=components` returns every bundle's products in the same response, so
// the whole page costs 3 requests. (The API allows 100 requests a minute per
// visitor, so one request per bundle is not an option.) Older API builds ignore
// it; those bundles load their contents later through loadAllDetails().
export async function loadBundles() {
  const rows = [];
  for (let page = 1, pages = 1; page <= pages; page += 1) {
    const data = await cachedGet(`/api/bundles?page=${page}&limit=100&include=components`);
    rows.push(...(data.bundles || []));
    pages = data.totalPages || 1;
  }
  return rows.filter(row => !isPromotionOnly(row)).map(row => {
    const deal = normalizeSummary(row);
    if (Array.isArray(row.components)) applyDetail(deal, row);
    return deal;
  });
}

export async function loadDetail(deal) {
  if (deal.detail) return deal;
  const data = await cachedGet(`/api/bundles/${encodeURIComponent(deal.slug)}`);
  if (data.bundle) {
    // Keep any storefront activation (linked catalogue) — do not let a draft
    // CMS flag wipe orderable before applyDetail can re-enable Build.
    deal.orderable = deal.orderable || data.bundle.orderable === true;
    deal.price = Math.round(Number(data.bundle.priceExVat) * 100) || deal.price;
    applyDetail(deal, data.bundle);
  }
  return deal;
}

// Fallback for API builds without `include=components`: fetch contents one at a
// time, slowly (about 70 a minute), so the visitor's rate-limit budget is never
// exhausted. Does nothing once every bundle already has its contents.
export async function loadAllDetails(deals, {gap = 850, onProgress} = {}) {
  const queue = deals.filter(deal => !deal.detail);
  let finished = 0;
  let failures = 0;
  while (queue.length && failures < 5) {
    const deal = queue.shift();
    try {
      await loadDetail(deal);
      failures = 0;
    } catch {
      failures += 1; // card stays a preview without its contents
    }
    finished += 1;
    onProgress?.(finished, deal);
    if (queue.length) await new Promise(resolve => setTimeout(resolve, gap));
  }
}

// Live colour x size options for one component, as SKU rows.
export async function loadComponentOptions(deal, component) {
  const options = [];
  for (let page = 1, pages = 1; page <= pages; page += 1) {
    const data = await cachedGet(`/api/bundles/${encodeURIComponent(deal.slug)}/components/${component.id}/options?page=${page}&limit=250`);
    options.push(...(data.options || []));
    pages = data.totalPages || 1;
  }
  return options;
}

export async function validateSelection(deal, selection) {
  const {status, data} = await request(`/api/bundles/${encodeURIComponent(deal.slug)}/validate-selection`, {
    method: 'POST',
    body: selection,
    retries: 1
  });
  return {valid: status === 200 && data.success !== false && data.valid !== false, errors: data.errors || [], message: data.message || ''};
}
