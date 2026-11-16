import {
  products, registerProduct, fillOptions, sizesFor, skuKey, swatchFor, formatPrice, pieceCount, sum,
  newDraft, choiceValid, quotas, allocated, variantsValid, setChoice, setAllocation,
  acceptedFile, logoValid, readyToAdd
} from './catalogue.js';
import { loadBundles, loadDetail, loadAllDetails, loadComponentOptions, validateSelection, availability } from './bundle-api.js';

const icons = {
  bag: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
  right: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  left: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  down: '<path d="M12 5v14m-6-6 6 6 6-6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  tick: '<path d="m5 12 4 4L19 6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm9 9-9 5-9-5m18 4-9 5-9-5"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4m-9 5h6m-6 4h6"/>',
  cap: '<path d="M4 14a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v2H4zM4 16h16l3 2c-2 2-5 2-9 0l-3-2m2-9c-2 2-2 5-2 9"/>'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const $ = id => document.getElementById(id);
const builder = $('builder');
const basket = $('basket');
const confirmation = $('confirmation');
const scroll = $('step-content');
const next = $('next');
const labels = ['Included', 'Groups', 'Colours & sizes', 'Logo', 'Review'];
const nextLabels = ['Continue to groups', 'Choose colours & sizes', 'Continue to logo', 'Review bundle', 'Add to basket'];
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const catalogueVatOn = () => (typeof window.isVatOn === 'function' ? window.isVatOn() : localStorage.getItem('brandeduk-vat-mode') === 'on');
const catalogueVatLabel = () => (typeof window.vatSuffix === 'function' ? window.vatSuffix() : (catalogueVatOn() ? 'inc VAT' : 'ex VAT'));
const catalogueMoney = pounds => (typeof window.formatCurrency === 'function'
  ? window.formatCurrency(pounds)
  : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(catalogueVatOn() ? pounds * 1.2 : pounds));
const price = pence => {
  const pounds = (Number(pence) || 0) / 100;
  return `<strong data-base-price="${pounds}">${catalogueMoney(pounds)}</strong> <small class="vat-suffix">${catalogueVatLabel()}</small>`;
};
const title = (heading, copy) => `<div class="step-heading"><h3 tabindex="-1">${heading}</h3>${copy ? `<p>${copy}</p>` : ''}</div>`;
const thumb = (code, cls = '') => products[code]?.image
  ? `<img class="thumb ${cls}" src="${escape(products[code].image)}" alt="" width="432" height="432" loading="lazy" decoding="async" data-thumb="${escape(code)}">`
  : `<span class="cap-thumb ${cls}">${icon('layers')}</span>`;
const isInclusion = bundle => bundle.methods.length > 1 ? 'One logo included' : `${bundle.methods[0] === 'Print' ? 'Printing' : 'Embroidery'} included`;
const pluralBundles = n => `${n} ${n === 1 ? 'bundle' : 'bundles'}`;
const announcement = $('announcement');

/** Black catalogue thumbs for closed flip cards — one image per SKU, never composites. */
const blackImageByCode = new Map(); // code -> url | null
const blackImagePending = new Map();
const blackImageSkipped = new Set();
const brandedApiBase = () => {
  const base = typeof window.resolveBrandedApiBase === 'function'
    ? window.resolveBrandedApiBase()
    : (window.API_BASE_URL || 'https://api.brandeduk.com');
  return String(base || 'https://api.brandeduk.com').replace(/\/+$/, '');
};
const slugifyColourName = value => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');
const pickExactBlackImage = product => {
  const colours = Array.isArray(product?.colors) ? product.colors : [];
  const black = colours.find(colour => slugifyColourName(colour?.name) === 'black');
  if (!black) return null;
  return black.main || black.thumb || black.image || black.image_url || null;
};
const bundleSkuCodes = deal => {
  const fixed = Object.keys(deal?.fixed || {});
  if (fixed.length) return fixed;
  return Array.isArray(deal?.codes) ? deal.codes.slice() : [];
};
async function fetchBlackImageForCode(code) {
  const key = String(code || '').trim().toUpperCase();
  if (!key) return null;
  if (blackImageByCode.has(key)) return blackImageByCode.get(key);
  if (blackImagePending.has(key)) return blackImagePending.get(key);
  const job = (async () => {
    try {
      const response = await fetch(`${brandedApiBase()}/api/products/${encodeURIComponent(key)}`);
      if (!response.ok) {
        blackImageByCode.set(key, null);
        blackImageSkipped.add(key);
        return null;
      }
      const product = await response.json();
      const url = pickExactBlackImage(product);
      blackImageByCode.set(key, url || null);
      if (!url) blackImageSkipped.add(key);
      return url || null;
    } catch (err) {
      blackImageByCode.set(key, null);
      blackImageSkipped.add(key);
      return null;
    } finally {
      blackImagePending.delete(key);
    }
  })();
  blackImagePending.set(key, job);
  return job;
}
function closedSkuThumbsHtml(deal) {
  const codes = bundleSkuCodes(deal);
  const figures = codes.map(code => {
    const url = skuImage(code);
    if (!url) return '';
    return `<figure class="card__sku-thumb"><img src="${escape(url)}" alt="" width="72" height="72" loading="lazy" decoding="async"><figcaption>${escape(code)}</figcaption></figure>`;
  }).filter(Boolean);
  return figures.length ? `<div class="card__face__thumbs" data-sku-thumbs="1">${figures.join('')}</div>` : '';
}
// Black catalogue image if there is one, otherwise the bundle API's product image.
const skuImage = code => blackImageByCode.get(String(code).toUpperCase()) || products[code]?.image || '';

async function hydrateBlackThumbs() {
  const codes = [...new Set(deals.flatMap(deal => bundleSkuCodes(deal).map(code => String(code).toUpperCase())))];
  const chunk = 8;
  for (let i = 0; i < codes.length; i += chunk) {
    await Promise.all(codes.slice(i, i + chunk).map(code => fetchBlackImageForCode(code)));
  }
  window.__bfBlackThumbStats = {
    codes: codes.length,
    withBlack: codes.filter(code => blackImageByCode.get(code)).length,
    skipped: [...blackImageSkipped]
  };
  renderShop();
  refreshCatalogueVatLabels();
}

let draft;
let lines = [];
let storeError = '';
let saving = false;
let pendingArtwork = false;
let fileError = '';
let builderError = '';
let variantInputs = {};
let returnToBasket = false;
let trigger;

document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });

const FILTER_SEARCH_KEYS = new Set(['productType', 'brand']);
const FILTER_GROUPS = [
  {key: 'productType', title: 'Product type', labels: {'t-shirts': 'T-shirts', polos: 'Polo shirts', hoodies: 'Hoodies', sweatshirts: 'Sweatshirts', jackets: 'Jackets', fleece: 'Fleeces', 'safety-vests': 'Hi-vis', trousers: 'Trousers', headwear: 'Headwear', bags: 'Bags', aprons: 'Aprons', scrubs: 'Scrubs', workwear: 'Workwear kits'}},
  {key: 'brand', title: 'Brand'},
  {key: 'sector', title: 'Sector', labels: {safety: 'Safety', hospitality: 'Hospitality', healthcare: 'Healthcare', education: 'Education', corporate: 'Corporate', sport: 'Sport', cleaning: 'Cleaning', logistics: 'Logistics', construction: 'Construction'}},
  {key: 'gender', title: 'Gender', labels: {female: "Women's", male: "Men's"}},
  {key: 'feature', title: 'Feature', labels: {'high-visibility': 'High visibility', waterproof: 'Waterproof', recycled: 'Recycled / organic'}},
  {key: 'status', title: 'Deal status'}
];
const selectedFilters = Object.fromEntries(FILTER_GROUPS.map(group => [group.key, new Set()]));
const optionSearch = {};
const openFacets = new Set();
let resultQuery = '';

// Live bundles from the API (see bundle-api.js). `deals` is filled by init().
let deals = [];
const offerById = new Map();
let listState = 'loading'; // loading | ready | error

function asBundle(deal) {
  return {
    id: deal.id,
    slug: deal.slug,
    title: deal.title,
    price: deal.price,
    methods: deal.methods,
    delivery: deal.delivery,
    logoCount: deal.logoCount,
    bundleNumber: deal.bundleNumber || 0,
    art: deal.productType.includes('t-shirts') ? 'tee' : 'outdoor',
    fixed: deal.fixed,
    components: deal.components
  };
}

// A bundle can be built only when the API says it is orderable, every
// component is a real catalogue product and its decoration terms are known.
function canBuild(deal) {
  return deal.orderable && deal.buildable;
}

function findOffer(id) {
  const deal = offerById.get(id);
  return deal && canBuild(deal) ? asBundle(deal) : undefined;
}

function dealMatchesQuery(deal) {
  if (!resultQuery) return true;
  const haystack = [deal.title, ...(deal.codes || []), ...(deal.brand || [])].join(' ').toLowerCase();
  return haystack.includes(resultQuery);
}

function facetValues(deal, key) {
  const value = deal[key];
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function dealMatchesFilters(deal) {
  return FILTER_GROUPS.every(group => {
    const chosen = selectedFilters[group.key];
    if (!chosen.size) return true;
    return facetValues(deal, group.key).some(value => chosen.has(value));
  });
}

function optionLabel(group, value) {
  return group.labels?.[value] || value;
}

// Radial filter windows. Team size is how many people the fixed garment lines
// already cover (their greatest common divisor), falling back to piece count.
// It never rewrites those quantities. Budget per person is the stored offer
// price divided by that people count. Industry, season and branding are only
// partly stored, so unmatched choices use the closest sector, product type,
// feature or title that already exists.
const optIcon = (cls, body) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const SEASON_ICONS = {
  Spring: optIcon('season-spring', '<path d="M12 20.5V11"/><path d="M12 13.2c-2.7-.7-4.6-2.8-5.2-6.2 3.2.6 5.2 2.6 5.2 6.2z"/><path d="M12 11.2c2.4-.4 4.4-2.2 5.2-5.4-2.8.5-4.6 2.4-5.2 5.4z"/>'),
  Summer: optIcon('season-summer', '<circle cx="12" cy="12" r="3.1" fill="currentColor" stroke="none"/><path d="M12 3.2v2.3M12 18.5v2.3M3.2 12h2.3M18.5 12h2.3M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6 5.8 18.2"/>'),
  Autumn: optIcon('season-autumn', '<path d="M12 20.5c.2-4.2 2.2-6.2 2.2-9.2a4.6 4.6 0 0 0-4.8-4.4c.4 3.6 1.5 5.6 2.6 7.4"/><path d="M12 13.4c2.2-.1 3.8-1.2 5.2-3"/>'),
  Winter: optIcon('season-winter', '<path d="M12 3.2v17.6M12 12 5.4 7.6M12 12l6.6-4.4M12 12 5.4 16.4M12 12l6.6 4.4M5.4 7.6 7.1 6.4M5.4 7.6l.6 2M18.6 7.6 16.9 6.4M18.6 7.6l-.6 2M5.4 16.4l.6-2M5.4 16.4 7.1 17.6M18.6 16.4l-.6-2M18.6 16.4 16.9 17.6"/>')
};
const CLOTHING_ICONS = {
  'T-Shirts': optIcon('', '<path d="M8.2 6.4 4.6 8.6 6.2 11.4 8.2 10.4V18h7.6v-7.6l2 .1 1.6-2.8-3.6-2.2"/><path d="M9.6 6.5c.5 1.3 1.2 2 2.4 2s1.9-.7 2.4-2"/>'),
  Polos: optIcon('', '<path d="M8.2 6.4 4.6 8.6 6.2 11.4 8.2 10.4V18h7.6v-7.6l2 .1 1.6-2.8-3.6-2.2"/><path d="M10 6.4c.3 1.6.9 2.5 2 2.5s1.7-.9 2-2.5"/><path d="M12 8.9v3.2"/>'),
  Hoodies: optIcon('', '<path d="M8 8.2 5 10.2v2.6h2.1V19h9.8v-6.2H19v-2.6l-3-2"/><path d="M9.1 8.2c.2-2 1.4-3.2 2.9-3.2s2.7 1.2 2.9 3.2c-.7 1.3-1.6 1.9-2.9 1.9s-2.2-.6-2.9-1.9z"/>'),
  Sweats: optIcon('', '<path d="M8.2 6.6 4.8 8.8 6.4 11.4 8.2 10.6V18h7.6v-7.4l1.8.8 1.6-2.6-3.4-2.2"/><path d="M9.8 6.6c.4 1.2 1.1 1.8 2.2 1.8s1.8-.6 2.2-1.8"/><path d="M10 18v-2.4h4V18"/>'),
  Jackets: optIcon('', '<path d="M8.2 6.4 4.6 8.7 6.3 11.6 8.2 10.6V18h7.6v-7.4l1.9 1 1.7-2.9L15.8 6.4"/><path d="M12 7.6v10.4"/><path d="M10.1 6.5c.4 1.2 1 1.8 1.9 1.8s1.5-.6 1.9-1.8"/>'),
  Workwear: optIcon('', '<path d="M8 5.2h8l.8 2.6V19H7.2V7.8L8 5.2z"/><path d="M9.2 8h5.6"/><path d="M8 12.2h8M8 15.2h8"/>')
};
const radialIcon = file => `<img src="./assets/filters/${file}.png?v=20261113-filters" alt="" width="72" height="72" decoding="async">`;
const stagePound = new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0});

function shownBundlePounds() {
  return deals.map(deal => deal.price).filter(price => price > 0).map(price => price / 100);
}

function roundStagePounds(value, increment, direction) {
  const scaled = value / increment;
  const nudged = direction < 0 ? scaled + 1e-9 : direction > 0 ? scaled - 1e-9 : scaled;
  const stepped = direction < 0 ? Math.floor(nudged) : direction > 0 ? Math.ceil(nudged) : Math.round(nudged);
  return stepped * increment;
}

// Seven bands with a similar number of bundles in each (price quantiles), so one
// very large bundle cannot stretch the scale. Edges are rounded to tidy numbers.
function budgetStageEdges(prices) {
  const sorted = prices.slice().sort((x, y) => x - y);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  const tidy = value => {
    const step = value < 100 ? 5 : value < 500 ? 10 : value < 2000 ? 50 : 100;
    return Math.round(value / step) * step;
  };
  const edges = [roundStagePounds(low, low < 100 ? 5 : 10, -1)];
  for (let index = 1; index < 6; index += 1) {
    const raw = sorted[Math.floor((sorted.length * index) / 6)];
    const edge = tidy(raw);
    if (edge > edges[edges.length - 1]) edges.push(edge);
  }
  edges.push(roundStagePounds(high, high < 500 ? 10 : 50, 1));
  return edges;
}

let BUDGET_STAGES = [];
function rebuildBudgetStages() {
  const prices = shownBundlePounds();
  if (!prices.length) {
    BUDGET_STAGES = [];
    return;
  }
  const edges = budgetStageEdges(prices);
  BUDGET_STAGES = edges.slice(0, -1).map((low, index) => {
    const high = edges[index + 1];
    return {low, high, label: `${stagePound.format(low)}–${stagePound.format(high)}`};
  });
  const item = radialCatalog.find(entry => entry.id === 'budget');
  if (item) item.values = BUDGET_STAGES.map(stage => stage.label);
}
const radialCatalog = [
  {id: 'industry', title: 'Industry', iconFile: 'industry', icon: radialIcon('industry'), prompt: 'What industry are you in?', layout: 'checks', multi: true, values: ['Construction', 'Cleaning', 'Hospitality', 'Corporate / Office', 'Education / Leavers', 'Sport & Fitness']},
  {id: 'team', title: 'Team Size', iconFile: 'team-size', icon: radialIcon('team-size'), prompt: 'How many people are you buying for?', layout: 'grid3', values: ['1–2', '3–5', '6–10', '11–20', '21–30', '31–50', '51–100', '100+']},
  {id: 'budget', title: 'Budget', iconFile: 'budget', icon: radialIcon('budget'), prompt: 'What is your budget?', layout: 'stack', values: []},
  {id: 'clothing', title: 'Clothing', iconFile: 'clothing', icon: radialIcon('clothing'), prompt: 'What type of clothing do you need?', layout: 'grid3', icons: CLOTHING_ICONS, values: ['T-Shirts', 'Polos', 'Hoodies', 'Sweats', 'Jackets', 'Workwear']},
  {id: 'purpose', title: 'Purpose', iconFile: 'purpose', icon: radialIcon('purpose'), prompt: 'What is the main purpose?', layout: 'radios', values: ['Staff Uniforms', 'New Starter Kits', 'Team / Event', 'Promotional / Branding', 'Workwear / PPE', 'Corporate / Office']},
  {id: 'quantity', title: 'Quantity', iconFile: 'quantity', icon: radialIcon('quantity'), prompt: 'How many items in total?', layout: 'grid2', values: ['Up to 10', '11–25', '26–50', '51–100', '101–250', '250+']},
  {id: 'season', title: 'Season', iconFile: 'season', icon: radialIcon('season'), prompt: 'When will the uniforms be used?', layout: 'grid2', icons: SEASON_ICONS, values: ['Spring', 'Summer', 'Autumn', 'Winter']},
  {id: 'branding', title: 'Branding', iconFile: 'branding', icon: radialIcon('branding'), prompt: 'How do you want to brand them?', layout: 'stack', values: ['Embroidery', 'Printing (DTF / DTG)', 'Both (Embroidery & Print)', 'No Branding (Plain)']}
];
const appliedBundleFilters = Object.fromEntries(radialCatalog.map(item => [item.id, item.multi ? [] : '']));
let announceBundleFilters = false;
let radialOpen = false;
let radialCurrent = null;
let sheetDraft = null;
let sheetFocusId = null;
let otherFiltersOpen = false;

// People covered by the bundle (rules in bundle-classify.js).
function kitPeople(deal) {
  return deal.people || Number(deal.qty) || 0;
}

function hasType(deal, ...types) {
  const found = new Set(facetValues(deal, 'productType'));
  return types.some(type => found.has(type));
}

function hasFeature(deal, feature) {
  return facetValues(deal, 'feature').includes(feature);
}

function hasSector(deal, sector) {
  return facetValues(deal, 'sector').includes(sector);
}

// Industry comes from the bundle's real products, brands and title (rules in
// bundle-api.js) until the API stores an industry for each bundle.
const INDUSTRY_SECTORS = {
  Construction: 'construction',
  Cleaning: 'cleaning',
  Hospitality: 'hospitality',
  'Corporate / Office': 'corporate',
  'Education / Leavers': 'education',
  'Sport & Fitness': 'sport'
};

function industryMatches(deal, value) {
  if (!value) return true;
  const sector = INDUSTRY_SECTORS[value];
  return Boolean(sector) && hasSector(deal, sector);
}

const TEAM_RANGES = {
  '1–2': [1, 2],
  '3–5': [3, 5],
  '6–10': [6, 10],
  '11–20': [11, 20],
  '21–30': [21, 30],
  '31–50': [31, 50],
  '51–100': [51, 100],
  '100+': [101, Infinity]
};

function teamMatches(deal, team) {
  if (!team) return true;
  const people = kitPeople(deal);
  const range = TEAM_RANGES[team];
  if (!people || !range) return false;
  return people >= range[0] && people <= range[1];
}

function budgetMatches(deal, band) {
  if (!band) return true;
  const stage = BUDGET_STAGES.find(entry => entry.label === band);
  if (!stage || !deal.price) return false;
  const last = stage === BUDGET_STAGES[BUDGET_STAGES.length - 1];
  const lowPence = stage.low * 100;
  const highPence = stage.high * 100;
  return last
    ? deal.price >= lowPence && deal.price <= highPence
    : deal.price >= lowPence && deal.price < highPence;
}

function clothingMatches(deal, value) {
  if (!value) return true;
  if (value === 'T-Shirts') return hasType(deal, 't-shirts');
  if (value === 'Polos') return hasType(deal, 'polos');
  if (value === 'Hoodies') return hasType(deal, 'hoodies');
  if (value === 'Sweats') return hasType(deal, 'sweatshirts');
  if (value === 'Jackets') return hasType(deal, 'jackets', 'fleece');
  if (value === 'Workwear') return hasType(deal, 'workwear', 'safety-vests', 'trousers');
  return false;
}

function purposeMatches(deal, purpose) {
  if (!purpose) return true;
  const people = kitPeople(deal);
  const title = deal.title || '';
  if (purpose === 'Staff Uniforms') return people >= 3 && hasType(deal, 'polos', 't-shirts', 'workwear', 'hoodies', 'sweatshirts', 'jackets', 'safety-vests');
  if (purpose === 'New Starter Kits') return /starter/i.test(title) || (people >= 1 && people <= 2);
  if (purpose === 'Team / Event') return /event/i.test(title) || people >= 11;
  if (purpose === 'Promotional / Branding') return /print/i.test(title) || hasType(deal, 't-shirts');
  if (purpose === 'Workwear / PPE') return hasType(deal, 'workwear', 'safety-vests', 'trousers') || hasFeature(deal, 'high-visibility') || /ppe|hi-vis/i.test(title);
  if (purpose === 'Corporate / Office') return hasType(deal, 'polos') && !hasType(deal, 'safety-vests') && !hasFeature(deal, 'high-visibility');
  return false;
}

const QTY_RANGES = {
  'Up to 10': [1, 10],
  '11–25': [11, 25],
  '26–50': [26, 50],
  '51–100': [51, 100],
  '101–250': [101, 250],
  '250+': [251, Infinity]
};

function quantityMatches(deal, band) {
  if (!band) return true;
  const qty = Number(deal.qty) || 0;
  const range = QTY_RANGES[band];
  if (!range) return false;
  return qty >= range[0] && qty <= range[1];
}

function seasonMatches(deal, season) {
  if (!season) return true;
  const title = deal.title || '';
  if (season === 'Summer') return hasType(deal, 't-shirts', 'polos') || /summer/i.test(title);
  if (season === 'Winter') return hasType(deal, 'fleece', 'hoodies', 'sweatshirts', 'jackets') || /beanie/i.test(title);
  if (season === 'Spring') return hasType(deal, 'polos', 'sweatshirts');
  if (season === 'Autumn') return hasType(deal, 'jackets', 'fleece', 'hoodies');
  return false;
}

function brandingMatches(deal, value) {
  if (!value) return true;
  const title = deal.title || '';
  // The decoration methods stored on the bundle win; the title is the fallback.
  const stored = deal.methods || [];
  const print = stored.length ? stored.includes('Print') : /print|dtf|dtg/i.test(title);
  const embroidery = stored.length ? stored.includes('Embroidery') : /embroider|stitch/i.test(title);
  if (value === 'Embroidery') return embroidery;
  if (value === 'Printing (DTF / DTG)') return print;
  if (value === 'Both (Embroidery & Print)') return print && embroidery;
  if (value === 'No Branding (Plain)') return !print && !embroidery && !/logo/i.test(title);
  return false;
}

function radialMatches(deal, item, filters = appliedBundleFilters) {
  const value = filters[item.id] ?? (item.multi ? [] : '');
  if (item.multi) {
    if (!value.length) return true;
    return value.some(choice => industryMatches(deal, choice));
  }
  if (item.id === 'team') return teamMatches(deal, value);
  if (item.id === 'budget') return budgetMatches(deal, value);
  if (item.id === 'clothing') return clothingMatches(deal, value);
  if (item.id === 'purpose') return purposeMatches(deal, value);
  if (item.id === 'quantity') return quantityMatches(deal, value);
  if (item.id === 'season') return seasonMatches(deal, value);
  if (item.id === 'branding') return brandingMatches(deal, value);
  return true;
}

function dealMatchesBundleFilters(deal, filters) {
  const source = filters && typeof filters === 'object' ? filters : appliedBundleFilters;
  return radialCatalog.every(item => radialMatches(deal, item, source));
}

function matchCount(filters = appliedBundleFilters) {
  return deals.filter(deal => dealMatchesBundleFilters(deal, filters)).length;
}

function cloneBundleFilters(source = appliedBundleFilters) {
  return Object.fromEntries(radialCatalog.map(item => [
    item.id,
    item.multi ? [...(source[item.id] || [])] : (source[item.id] || '')
  ]));
}

function filterIsSet(item, filters) {
  const value = filters[item.id];
  return item.multi ? value.length > 0 : Boolean(value);
}

function choiceList(item, filters) {
  const value = filters[item.id];
  return item.multi ? value : (value ? [value] : []);
}

function activeFilterCount(filters) {
  return radialCatalog.reduce((total, item) => total + choiceList(item, filters).length, 0);
}

function chipLabel(item, value) {
  return item.id === 'team' ? `${value} People` : value;
}

function removeFilterValue(filters, id, value) {
  const item = radialCatalog.find(entry => entry.id === id);
  if (!item || !filters) return;
  if (item.multi) filters[id] = filters[id].filter(entry => entry !== value);
  else if (filters[id] === value) filters[id] = '';
}

function chosenRadialFilters() {
  return radialCatalog.filter(item => {
    const value = appliedBundleFilters[item.id];
    return item.multi ? value.length > 0 : Boolean(value);
  });
}

function choiceText(item) {
  const value = appliedBundleFilters[item.id];
  return item.multi ? value.join(', ') : value;
}

const trashIcon = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M8 7l1 13h6l1-13"/><path d="M10 11v6M14 11v6"/></svg>`;

function renderFilterSummary(count) {
  const line = $('bundle-result-line');
  if (!line) return;
  const choices = chosenRadialFilters();
  const activeCount = activeFilterCount(appliedBundleFilters);
  const badge = $('bundleFilterCount');
  if (badge) {
    badge.hidden = activeCount === 0;
    badge.textContent = String(activeCount);
  }
  syncRadialButton();
  if (!choices.length) {
    line.className = 'bundle-result-line';
    line.textContent = pluralBundles(count);
    return;
  }
  const summary = `${pluralBundles(count)} · ${choices.map(item => `${item.title}: ${choiceText(item)}`).join(' · ')}`;
  const chips = choices.flatMap(item => choiceList(item, appliedBundleFilters).map(value => `
    <button type="button" class="bundle-active-chip" data-remove-filter="${item.id}" data-filter-value="${escape(value)}">
      <img src="./assets/filters/${item.iconFile}.png?v=20261113-filters" alt="" width="22" height="22">
      <span>${escape(chipLabel(item, value))}</span>
      <span class="chip-x" aria-hidden="true">&times;</span>
      <span class="sr-only">Remove ${escape(chipLabel(item, value))}</span>
    </button>`)).join('');
  line.className = 'bundle-result-line is-filtered';
  line.innerHTML = `
    <p class="bundle-filter-kicker">${escape(summary)}</p>
    <div class="bundle-active-row">
      <span class="bundle-active-label">Active filters:</span>
      <div class="bundle-active-chips">${chips}</div>
    </div>
    <div class="bundle-filter-actions">
      <button type="button" class="bundle-clear-link" data-clear-bundle-filters>${trashIcon} Clear filters</button>
      <span class="bundle-found-pill">${escape(pluralBundles(count))} found</span>
    </div>`;
}

function emptyFilterMessage() {
  const industry = appliedBundleFilters.industry;
  if (industry.length && !deals.some(deal => industry.some(value => industryMatches(deal, value)))) {
    return industry.length === 1
      ? `No bundles are tagged for ${industry[0]}.`
      : 'No bundles are tagged for those industries.';
  }
  return 'No bundles match these filters.';
}

let catalogueSort = 'cost';

function accentTheme(deal, index) {
  if (hasSector(deal, 'construction') || hasFeature(deal, 'high-visibility') || hasType(deal, 'safety-vests')) return 'construction';
  if (hasSector(deal, 'hospitality') || hasType(deal, 'aprons')) return 'hospitality';
  if (hasSector(deal, 'cleaning')) return 'cleaning';
  if (hasSector(deal, 'logistics') || hasType(deal, 'jackets')) return 'logistics';
  return ['construction', 'hospitality', 'cleaning', 'logistics'][index % 4];
}

function sortCatalogue(list) {
  const sorted = list.slice();
  if (catalogueSort === 'team') sorted.sort((a, b) => kitPeople(b) - kitPeople(a) || (Number(b.qty) || 0) - (Number(a.qty) || 0));
  else if (catalogueSort === 'cost') sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  else if (catalogueSort === 'revenue') sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  return sorted;
}

function bundleFaceNumber(deal) {
  if (Number(deal.bundleNumber) > 0) return String(deal.bundleNumber);
  const slug = String(deal.slug || deal.id || '');
  const match = slug.match(/(?:^|-)(\d+)(?:-|$)/);
  return match ? match[1] : '';
}

function flipCardMarkup(deal, index) {
  const bundle = asBundle(deal);
  const items = Object.entries(bundle.fixed);
  const build = canBuild(deal);
  const qty = deal.qty || pieceCount(bundle) || 0;
  const team = kitPeople(deal) || qty;
  const theme = accentTheme(deal, index);
  const shortTitle = bundle.title.length > 42 ? `${bundle.title.slice(0, 40)}…` : bundle.title;
  const closedThumbs = closedSkuThumbsHtml(deal);
  const openThumbs = codes => {
    const figs = (codes || []).map(code => {
      const url = skuImage(code);
      if (!url) return '';
      return `<img src="${escape(url)}" alt="" width="48" height="48" loading="lazy" decoding="async">`;
    }).filter(Boolean).join('');
    return figs ? `<div class="card__stats-panel__thumbs">${figs}</div>` : '';
  };
  const skuCodes = bundleSkuCodes(deal);
  const includedInline = items.length
    ? items.map(([code, n]) => {
        const label = products[code] ? products[code].label : code;
        const blackUrl = skuImage(code);
        const img = blackUrl ? `<img src="${escape(blackUrl)}" alt="">` : '';
        return `<li>${img}<span>${escape(label)} × ${n}</span></li>`;
      }).join('')
    : `<li><span>${escape((deal.codes || []).join(', ') || 'See bundle details')}</span></li>`;
  const ctaLabel = build ? 'Build Your Bundle' : availability(deal).label;
  const ctaDisabled = build ? '' : 'disabled';

  return `<section class="card theme-${theme}${build ? '' : ' is-blocked'}" data-bundle-id="${escape(deal.id)}" data-can-build="${build ? '1' : '0'}" aria-expanded="false">
    <div class="card__map">
      <div class="card__map__inner">
        <p class="card__map__title">${escape(bundle.title)}</p>
        <p class="card__map__meta">${deal.price ? price(deal.price) : ''} · Team of ${team} · ${qty} items</p>
        <ul class="card__map__list">${includedInline}</ul>
      </div>
    </div>
    <section class="card__part card__part-1">
      <div class="card__part__inner">
        <div class="card__header__close-btn" role="button" tabindex="0" aria-label="Close bundle details">&times;</div>
        <header class="card__header">
          <span class="card__header__id">${escape(bundle.title)}</span>
          <span class="card__header__price">${deal.price ? price(deal.price) : ''}</span>
        </header>
        <div class="card__stats-panel">
          ${openThumbs(skuCodes)}
          <div>
            <p class="card__text__heading">Team</p>
            <p class="card__text__middle">Team of ${team}</p>
            <p class="card__text__heading" style="margin-top:6px">Items</p>
            <p class="card__text__middle">${qty} items</p>
          </div>
        </div>
      </div>
    </section>
    <section class="card__part card__part-2">
      <div class="card__part__side m--back">
        <div class="card__part__inner card__face">
          <div class="card__face__colored-side" aria-hidden="true"></div>
          <div class="card__face__meta">
            <h3 class="card__face__price">${deal.price ? price(deal.price) : ''}</h3>
            <span class="card__face__team">Team of ${team}</span>
            <span class="card__face__items">${qty} items</span>
          </div>
          <div class="card__face__preview">
            ${closedThumbs}
            <div class="card__face__title-row">
              <h3 class="card__face__title">${escape(shortTitle)}</h3>
              <span class="card__face__chev" aria-hidden="true">›</span>
            </div>
            <p class="card__face__number">${escape(bundleFaceNumber(deal))}</p>
          </div>
        </div>
      </div>
      <div class="card__part__side m--front">
        <div class="card__sender">
          <h4 class="card__sender__heading">What's included</h4>
          <p class="card__sender__name">${escape(bundle.title)}</p>
          <ul class="card__included-inline">${includedInline}</ul>
        </div>
        <div class="card__from-to">
          <div class="card__from-to__inner">
            <div class="card__text card__text--left">
              <p class="card__text__heading">Team</p>
              <p class="card__text__middle">Team of ${team}</p>
            </div>
            <div class="card__text card__text--right">
              <p class="card__text__heading">Items</p>
              <p class="card__text__middle">${qty} items</p>
            </div>
          </div>
        </div>
        <section class="card__part card__part-3">
          <div class="card__part__side m--back"></div>
          <div class="card__part__side m--front">
            <div class="card__timings">
              <div class="card__timings__inner">
                <div class="card__text card__text--left">
                  <p class="card__text__heading">Bundle price</p>
                  <p class="card__text__middle">${deal.price ? price(deal.price) : ''}</p>
                </div>
                <div class="card__text card__text--right">
                  <p class="card__text__heading">Logo</p>
                  <p class="card__text__middle">Included</p>
                </div>
              </div>
            </div>
            <div class="card__timer" aria-hidden="true"></div>
            <section class="card__part card__part-4">
              <div class="card__part__side m--back"></div>
              <div class="card__part__side m--front">
                <button type="button" class="card__request-btn" data-id="${escape(deal.id)}" ${ctaDisabled}>
                  <span class="card__request-btn__text-1">${ctaLabel}</span>
                  <span class="card__request-btn__text-2">Start</span>
                </button>
                <p class="card__counter">${qty} garments · Team of ${team}</p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </section>
  </section>`;
}

function renderShop() {
  deals.forEach(deal => offerById.set(deal.id, deal));
  const grid = $('catalogue-grid');
  if (listState !== 'ready') {
    const line = $('bundle-result-line');
    if (line) {
      line.className = 'bundle-result-line';
      line.textContent = listState === 'loading' ? 'Loading bundles…' : '';
    }
    grid.innerHTML = listState === 'loading'
      ? '<p class="bundle-empty" role="status">Loading the latest bundles…</p>'
      : '<p class="bundle-empty" role="alert">We couldn\u2019t load the bundles just now. <button type="button" class="text-button" data-action="retry">Try again</button></p>';
    return;
  }
  const shown = sortCatalogue(deals.filter(deal => dealMatchesBundleFilters(deal)));
  renderFilterSummary(shown.length);
  if (announceBundleFilters && announcement) announcement.textContent = pluralBundles(shown.length);
  grid.innerHTML = shown.length
    ? shown.map((deal, index) => flipCardMarkup(deal, index)).join('')
    : `<p class="bundle-empty">${escape(emptyFilterMessage())}</p>`;

  if (window.BundlesFlip?.refresh) window.BundlesFlip.refresh();
}

let opening = false;

function showNotice(message) {
  let note = $('bundle-notice');
  if (!note) {
    note = document.createElement('p');
    note.id = 'bundle-notice';
    note.className = 'bundle-notice';
    note.setAttribute('role', 'alert');
    $('bundle-result-line').after(note);
  }
  note.textContent = message;
  note.hidden = !message;
  if (message) announcement.textContent = message;
}

function registerDeal(deal) {
  deal.components.filter(component => component.linked).forEach(registerProduct);
}

// Load a bundle's components and the live colour/size SKUs for each product.
async function prepareBundle(deal) {
  await loadDetail(deal);
  registerDeal(deal);
  await Promise.all(deal.components.filter(component => component.linked).map(async component => {
    const product = products[component.code];
    if (product.loaded) return;
    fillOptions(product, await loadComponentOptions(deal, component));
  }));
  if (!deal.components.every(component => products[component.code]?.skus.size)) {
    throw new Error('Some products have no live colours or sizes.');
  }
}

async function openBuilder(bundle, source, saved) {
  if (!bundle || builder.open || opening) return;
  opening = true;
  const original = source?.innerHTML;
  if (source) {
    source.disabled = true;
    source.textContent = 'Loading\u2026';
  }
  showNotice('');
  try {
    await prepareBundle(offerById.get(bundle.id));
    bundle = asBundle(offerById.get(bundle.id));
  } catch {
    showNotice('We couldn\u2019t load the latest colours and sizes for this bundle. Please try again.');
    return;
  } finally {
    opening = false;
    if (source) {
      source.disabled = false;
      source.innerHTML = original;
    }
  }
  trigger = source;
  draft = newDraft(bundle, saved);
  if (saved && !readyToAdd(draft)) draft.step = draft.reached = 0;
  returnToBasket = Boolean(saved);
  if (basket.open) basket.close();
  variantInputs = {};
  pendingArtwork = false;
  fileError = '';
  builderError = '';
  $('builder-title').textContent = bundle.title;
  $('builder-kicker').textContent = 'BUILD YOUR BUNDLE';
  $('builder-price').innerHTML = price(bundle.price);
  renderStep();
  builder.showModal();
  syncScrollLock();
  focusHeading();
}

function syncScrollLock() {
  document.body.classList.toggle('dialog-open', builder.open || basket.open);
}

function focusHeading() {
  scroll.querySelector('h3')?.focus({preventScroll: true});
}

function closeBuilder(added = false) {
  builder.close();
  draft = undefined;
  if (added || returnToBasket) {
    openBasket();
  } else {
    syncScrollLock();
    trigger?.focus();
  }
}

function requestClose() {
  if (saving) return;
  if (!draft.dirty) {
    closeBuilder();
    return;
  }
  confirmation.returnValue = 'keep';
  confirmation.showModal();
}
builder.addEventListener('cancel', event => { event.preventDefault(); requestClose(); });
confirmation.addEventListener('close', () => {
  if (confirmation.returnValue === 'discard') closeBuilder();
});

function canLeave(step) {
  return [
    () => true,
    () => choiceValid(draft),
    () => variantsValid(draft),
    () => !pendingArtwork && logoValid(draft),
    () => !pendingArtwork && readyToAdd(draft)
  ][step]();
}

function canReach(step) {
  return Number.isInteger(step) && step >= 0 && step <= draft.reached && labels.slice(0, step).every((_, index) => canLeave(index));
}

function renderControls() {
  $('steps').innerHTML = labels.map((label, step) => {
    const current = draft.step === step;
    const complete = !current && step < draft.reached && canReach(step) && canLeave(step);
    const enabled = !current && !saving && canReach(step);
    return `<li><button type="button" class="step ${current ? 'current' : ''} ${complete ? 'complete' : ''}"
      data-action="step" data-step="${step}" ${current ? 'aria-current="step"' : ''} ${enabled ? '' : 'disabled'}
      aria-label="${label}${complete ? ', complete' : current ? ', current step' : !enabled ? ', locked' : ''}">
      <span class="step-number">${complete ? icon('tick') : step + 1}</span><span>${label}</span>
    </button></li>`;
  }).join('');
  $('back').hidden = draft.step === 0;
  $('back').disabled = saving;
  next.innerHTML = saving ? 'Saving…' : `${draft.lineId && draft.step === 4 ? 'Save bundle' : nextLabels[draft.step]} ${icon(draft.step === 4 ? 'bag' : 'right')}`;
  next.disabled = saving || !canLeave(draft.step);
}

function itemRow(code, qty) {
  return `<li class="item-row">${thumb(code)}<div><strong>${escape(products[code].name)}</strong><small>${escape(code)}</small></div><span class="row-quantity">× ${qty}</span></li>`;
}

function includedMarkup() {
  const bundle = draft.bundle;
  const group = bundle.group;
  return title('What’s included', `${pieceCount(bundle)} items with one logo across the bundle.`) +
    `<ul class="item-list">${Object.entries(bundle.fixed).map(([code, qty]) => itemRow(code, qty)).join('')}
      ${group ? `<li class="item-row"><span class="cap-thumb">${icon('layers')}</span><div><strong>${group.name}</strong>
        <small>${group.codes.map(code => products[code].label).join(group.type === 'exclusive' ? ' or ' : ' and ')}</small></div><span class="row-quantity">× ${group.quantity}</span></li>` : ''}
    </ul>
    <div class="info-panel">${icon('tick')}<div><strong>${isInclusion(bundle)}</strong><small>${bundle.methods.join(' or ')}${bundle.delivery ? ' · Free delivery' : ''}</small></div></div>`;
}

function groupsMarkup() {
  const group = draft.bundle.group;
  if (!group) {
    return title('Fixed composition', 'The products and quantities are set for this bundle. Next, choose the colours and sizes.') +
      `<ul class="item-list">${Object.entries(draft.bundle.fixed).map(([code, qty]) => itemRow(code, qty)).join('')}</ul>`;
  }
  if (group.type === 'exclusive') {
    return title('Choose one headwear style', `Choose all ${group.quantity} pieces in one style.`) + `<div class="choice-list">${group.codes.map(code => {
      const selected = draft.choice === code;
      return `<button type="button" class="choice-card" aria-pressed="${selected}" data-action="exclusive" data-code="${code}">
        ${thumb(code)}<span><strong>${group.quantity} ${products[code].label.toLowerCase()}</strong><small>${products[code].name} · ${code}</small></span>
        <span class="square-check">${selected ? icon('tick') : ''}</span></button>`;
    }).join('')}</div>`;
  }
  const selected = sum(Object.values(draft.mix));
  return title('Choose your mix', `Allocate exactly ${group.quantity} pieces across polos and T-shirts.`) +
    `<div class="quantity-status ${selected === group.quantity ? 'finished' : ''}">${selected} / ${group.quantity} pieces selected</div>
     <div class="choice-list">${group.codes.map(code => {
        const qty = draft.mix[code] ?? 0;
        const max = group.quantity - selected + qty;
        return `<div class="choice-card">${thumb(code)}<span><strong>${products[code].label}</strong><small>${code}</small></span>
          <label class="mix-control"><span class="sr-only">Quantity of ${products[code].label.toLowerCase()}</span>
          <select data-mix="${code}">${Array.from({length: max + 1}, (_, n) => `<option value="${n}" ${n === qty ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        </div>`;
      }).join('')}</div>`;
}

let logoPreviewUrl = '';

function rememberLogoPreview(file) {
  if (logoPreviewUrl) {
    URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = '';
  }
  if (file instanceof File && /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)) {
    logoPreviewUrl = URL.createObjectURL(file);
  }
}

function logoPreviewSrc(logo) {
  if (!logo) return '';
  if (logo instanceof File) return logoPreviewUrl;
  const storage = window.BrandedQuoteStorage;
  const raw = String(logo.logo || logo.ref || '');
  if (storage && typeof storage.resolveSrc === 'function') {
    const resolved = storage.resolveSrc(raw, logo.logoId);
    if (resolved && /^(https?:|data:image|blob:)/i.test(resolved)) return resolved;
  }
  return /^(https?:|data:image|blob:)/i.test(raw) ? raw : '';
}

function logoPreviewMarkup(logo, className) {
  const src = logoPreviewSrc(logo);
  if (!src) return '';
  return `<img class="${className}" src="${escape(src)}" alt="Uploaded logo preview">`;
}

function colourDot(colour) {
  return `<span class="colour-swatch" style="--swatch:${swatchFor(colour)}" aria-hidden="true"></span>`;
}

function variantForm(code, required) {
  const product = products[code];
  const options = variantInputs[code] ?? {};
  const colour = product.colours.includes(options.colour) ? options.colour : product.colours[0];
  variantInputs[code] = {colour};
  const sizes = sizesFor(product, colour);
  const rows = draft.allocations[code] ?? [];
  const qtyFor = size => rows.find(row => row.colour === colour && row.size === size)?.quantity ?? 0;
  const remaining = required - allocated(draft, code);
  const colourButtons = product.colours.map(name => {
    const image = product.images.get(name);
    const active = name === colour;
    const face = image
      ? `<img src="${escape(image)}" alt="">`
      : `<span class="bundle-colour-swatch" style="--swatch:${swatchFor(name)}"></span>`;
    return `<button type="button" class="bundle-colour${active ? ' is-active' : ''}" data-action="pick-colour" data-code="${escape(code)}" data-colour="${escape(name)}" aria-pressed="${active}" title="${escape(name)}">${face}<span>${escape(name)}</span></button>`;
  }).join('');
  const sizeRows = sizes.map(size => {
    const qty = qtyFor(size);
    return `<div class="bundle-size-row">
      <span>${escape(size)}</span>
      <button type="button" data-action="size-qty" data-code="${escape(code)}" data-colour="${escape(colour)}" data-size="${escape(size)}" data-delta="-1" aria-label="Decrease ${escape(size)}" ${qty ? '' : 'disabled'}>−</button>
      <strong>${qty}</strong>
      <button type="button" data-action="size-qty" data-code="${escape(code)}" data-colour="${escape(colour)}" data-size="${escape(size)}" data-delta="1" aria-label="Increase ${escape(size)}" ${remaining ? '' : 'disabled'}>+</button>
    </div>`;
  }).join('');
  return `<div class="variant-body">
    ${rows.length ? `<ul class="allocation-list" aria-label="Selected variants">${rows.map(row => `
      <li>${colourDot(row.colour)}<span>${escape(row.colour)} · ${escape(row.size)}</span><strong>× ${row.quantity}</strong>
        <button class="icon-button small" type="button" data-action="remove-allocation" data-code="${code}" data-colour="${row.colour}" data-size="${row.size}" aria-label="Remove ${row.colour}, ${row.size}, ${row.quantity} pieces">${icon('x')}</button></li>`).join('')}</ul>` : ''}
    <div class="bundle-picker">
      <div class="bundle-colours">${colourButtons}</div>
      <p class="bundle-colour-name">${escape(colour)} · ${remaining} still to assign</p>
      <div class="bundle-sizes">${sizeRows}</div>
    </div>
  </div>`;
}

function variantsMarkup() {
  const items = Object.entries(quotas(draft));
  const total = pieceCount(draft.bundle);
  const selected = sum(items.map(([code]) => allocated(draft, code)));
  const active = draft.activeProduct || items.find(([code, qty]) => allocated(draft, code) < qty)?.[0] || '';
  return title('Colours & sizes', 'Choose a colour, then set the quantity for each size. Every garment in the bundle must be assigned before the logo step.') +
    `<div class="quantity-status ${selected === total ? 'finished' : ''}">${selected} / ${total} items configured</div>
    <div class="variants-list">${items.map(([code, qty]) => {
      const count = allocated(draft, code);
      return `<details class="variant-card" name="products" ${active === code ? 'open' : ''}>
        <summary data-code="${code}">${thumb(code)}
          <span class="variant-title"><strong>${escape(products[code].name)}</strong><small>${escape(code)}${count < qty ? ` · ${qty - count} remaining` : ''}</small></span>
          <span class="variant-counter ${count === qty ? 'finished' : ''}">${count === qty ? icon('tick') : ''}${count}/${qty}</span>
          ${icon('chevron', 'chevron')}</summary>${variantForm(code, qty)}</details>`;
    }).join('')}</div>
    ${draft.logo ? `<div class="logo-preview-slot">${logoPreviewMarkup(draft.logo, 'logo-preview') || icon('file')}<small>${escape(draft.logo.name || draft.logo.filename || 'Uploaded logo')}</small></div>` : ''}
    <p class="small-note">Colours and sizes shown are the live options for each product.</p>`;
}

function logoMarkup() {
  const {bundle, method, logo, notes} = draft;
  return title('Upload your logo', 'Choose one artwork file for the whole bundle.') +
    (bundle.methods.length > 1
      ? `<fieldset class="method-field"><legend>Included decoration</legend><div>${bundle.methods.map(option =>
        `<button type="button" class="button method" data-action="method" data-method="${option}" aria-pressed="${method === option}">${method === option ? icon('tick') : ''}${option}</button>`).join('')}</div></fieldset>`
      : `<div class="info-panel method-info">${icon('tick')}<div><strong>${isInclusion(bundle)}</strong></div></div>`) +
    `<div class="upload-area" id="upload-area">
      ${logoPreviewMarkup(logo, 'logo-preview') || `<span class="upload-icon">${icon(logo ? 'file' : 'upload')}</span>`}
      <strong>${pendingArtwork ? 'Checking file…' : logo ? escape(logo.name || logo.filename || '') : 'Drag your logo here'}</strong>
      <small>PNG, JPG, PDF, SVG, AI or EPS · up to 10 MB</small>
      <button class="button secondary compact" type="button" data-action="browse">${logo ? 'Replace file' : 'Browse files'}</button>
      <input id="logo-file" type="file" accept=".png,.jpg,.jpeg,.pdf,.svg,.ai,.eps" aria-label="Upload your logo" hidden>
    </div>
    <p class="inline-error" id="file-error" role="alert" ${fileError ? '' : 'hidden'}>${escape(fileError)}</p>
    <label class="notes-label">Notes <span>Optional</span>
      <textarea id="notes" maxlength="500" rows="3" placeholder="Add any instructions for your logo.">${escape(notes)}</textarea>
    </label>
    <p class="small-note count-note"><span id="notes-count">${notes.length}</span> / 500</p>`;
}

function selectedItems(allocations) {
  return `<ul class="item-list review-list">${Object.entries(allocations).filter(([, rows]) => rows.length).map(([code, rows]) => `
    <li class="item-row">${thumb(code)}<div><strong>${sum(rows.map(row => row.quantity))} × ${escape(products[code].label)}</strong>
      <small>${escape(code)}</small><ul class="review-variants">${rows.map(row => `<li>${colourDot(row.colour)} ${escape(row.colour)} · ${escape(row.size)} × ${row.quantity}</li>`).join('')}</ul>
      </div></li>`).join('')}</ul>`;
}

function reviewMarkup() {
  return title('Review your bundle', `${pieceCount(draft.bundle)} items configured.`) +
    `<div class="review-section"><div class="review-heading"><h4>Items</h4><button type="button" class="text-button" data-action="step" data-step="2">Edit items</button></div>
    ${selectedItems(draft.allocations)}</div>
    <div class="review-section">
      <div class="review-heading"><h4>Artwork</h4><button type="button" class="text-button" data-action="step" data-step="3">Edit logo</button></div>
      <div class="info-panel artwork-panel">${logoPreviewMarkup(draft.logo, 'logo-preview logo-preview--row') || icon('file')}<div><strong>${escape(draft.logo?.name || draft.logo?.filename || '')}</strong><small>${draft.method} included</small></div></div>
      ${draft.notes.trim() ? `<div class="review-notes"><strong>Notes</strong><p>${escape(draft.notes.trim())}</p></div>` : ''}
    </div>
    ${builderError ? `<p class="inline-error" role="alert">${escape(builderError)}</p>` : ''}`;
}

function openBundleColourPage() {
  const components = Object.entries(quotas(draft)).map(([code, qty]) => ({
    code,
    qty,
    name: products[code]?.name || code
  })).filter(item => item.qty > 0);
  if (!components.length) return;
  sessionStorage.setItem('buk-bundle-build', JSON.stringify({
    bundleId: draft.bundle.id,
    slug: draft.bundle.slug || draft.bundle.id,
    title: draft.bundle.title,
    price: draft.bundle.price,
    bundleNumber: draft.bundle.bundleNumber || 0,
    itemCount: components.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    components,
    index: 0,
    picks: {}
  }));
  const first = components[0];
  window.location.href = `/mobile/customize-mobile.html?code=${encodeURIComponent(first.code)}&bundleBuild=1`;
}

function renderStep({reset = true} = {}) {
  scroll.innerHTML = [includedMarkup, groupsMarkup, variantsMarkup, logoMarkup, reviewMarkup][draft.step]();
  if (reset) scroll.scrollTop = 0;
  renderControls();
}

function goTo(step) {
  if (saving || !canReach(step)) return;
  if (step === 2) {
    openBundleColourPage();
    return;
  }
  builderError = '';
  draft.step = step;
  renderStep();
  focusHeading();
}

function changeChoice(code, amount) {
  if (!setChoice(draft, code, amount)) return;
  draft.activeProduct = '';
  renderStep({reset: false});
  scroll.querySelector(`[data-mix="${code}"], [data-action="exclusive"][data-code="${code}"]`)?.focus();
}

function addAllocation(form, all = false) {
  const code = form.dataset.code;
  const {colour, size, quantity} = form.elements;
  const selected = {colour: colour.value, size: size.value};
  const current = (draft.allocations[code] ?? []).find(row => row.colour === selected.colour && row.size === selected.size)?.quantity ?? 0;
  const amount = all ? quotas(draft)[code] - allocated(draft, code) : quantity.valueAsNumber;
  if (!Number.isInteger(amount) || amount < 1 || !setAllocation(draft, code, selected.colour, selected.size, current + amount)) {
    const error = form.querySelector('.inline-error');
    error.textContent = 'Enter a whole quantity within the remaining limit.';
    error.hidden = false;
    quantity.focus();
    return;
  }
  variantInputs[code] = selected;
  draft.activeProduct = code;
  renderStep({reset: false});
  const card = scroll.querySelector(`summary[data-code="${code}"]`);
  (card.parentElement.querySelector('input[name="quantity"]') ?? card).focus({preventScroll: true});
  announcement.textContent = `${amount} added. ${allocated(draft, code)} of ${quotas(draft)[code]} configured.`;
}

function removeAllocation(button) {
  const {code, colour, size} = button.dataset;
  if (!setAllocation(draft, code, colour, size, 0)) return;
  draft.activeProduct = code;
  renderStep({reset: false});
  scroll.querySelector(`summary[data-code="${code}"]`)?.focus({preventScroll: true});
  announcement.textContent = 'Selection removed.';
}

async function chooseArtwork(files) {
  if (pendingArtwork || !draft || draft.step !== 3) return;
  const current = draft;
  const focusBrowse = () => scroll.querySelector('[data-action="browse"]')?.focus({preventScroll: true});
  if (files.length !== 1 || !acceptedFile(files[0])) {
    fileError = files.length > 1 ? 'Choose exactly one logo file.' : 'Choose a supported file up to 10 MB.';
    if (draft.logo) fileError += ' Your current logo is still attached.';
    renderStep({reset: false});
    focusBrowse();
    return;
  }
  const file = files[0];
  pendingArtwork = true;
  fileError = '';
  renderStep({reset: false});
  try {
    // Read only a prefix to confirm the browser can access the file.
    await file.slice(0, 16).arrayBuffer();
    if (draft !== current) return;
    draft.logo = file;
    rememberLogoPreview(file);
    draft.dirty = true;
    announcement.textContent = `Logo added: ${file.name}`;
  } catch {
    if (draft === current) fileError = 'The file could not be read. Please choose it again.';
  } finally {
    if (draft === current) {
      pendingArtwork = false;
      if (draft.step === 3) {
        renderStep({reset: false});
        focusBrowse();
      }
    }
  }
}

const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open('branded-uk-bundle-prototype', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('basket', {keyPath: 'id'});
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
  request.onblocked = () => reject(new Error('Basket storage is blocked'));
});

async function basketOperation(mode, operation) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('basket', mode);
    const request = operation(transaction.objectStore('basket'));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function refreshBasket() {
  try {
    const saved = await basketOperation('readonly', store => store.getAll());
    // Rebuild each saved bundle from the API so names, prices and images are live.
    await Promise.all([...new Set(saved.map(line => line.bundleId))].map(id => {
      const deal = offerById.get(id);
      return deal ? prepareBundle(deal).catch(() => {}) : undefined;
    }));
    lines = saved.filter(line => findOffer(line.bundleId));
    lines.sort((a, b) => a.createdAt - b.createdAt);
    storeError = '';
  } catch {
    storeError = 'This browser could not open your basket. Check that site storage is enabled.';
  }
  syncHeaderBasketCount();
  if (basket.open) renderBasket();
}

function renderBasket() {
  $('basket-total').innerHTML = price(sum(lines.map(line => findOffer(line.bundleId).price)));
  const content = $('basket-content');
  if (storeError) {
    content.innerHTML = `<p class="inline-error" role="alert">${storeError}</p>`;
    return;
  }
  if (!lines.length) {
    content.innerHTML = `<div class="empty-basket">${icon('bag')}<h3 tabindex="-1">Your basket is empty</h3><p>Build a bundle to add it here.</p></div>`;
    return;
  }
  content.innerHTML = `<p class="basket-intro" tabindex="-1">${pluralBundles(lines.length)} · Saved in this browser</p><div class="basket-lines">${lines.map(line => {
    const bundle = findOffer(line.bundleId);
    return `<article class="basket-line">
      <div class="basket-line-heading">
        <div><h3>${escape(bundle.title)}</h3><p>${pieceCount(bundle)} items · ${bundle.logoCount > 1 ? `${bundle.logoCount} logos included` : 'One logo included'}</p></div>
        <div class="line-price">${price(bundle.price)}</div>
      </div>
      <div class="basket-line-actions">
        <button class="text-button" type="button" data-action="edit" data-id="${line.id}">Edit bundle</button>
        <button class="text-button muted" type="button" data-action="remove-line" data-id="${line.id}">Remove</button>
      </div>
      <details class="basket-details"><summary>View items ${icon('chevron')}</summary>
        ${selectedItems(line.allocations)}
        <div class="info-panel">${icon('file')}<div><strong>${escape(line.logo.name)}</strong><small>${line.method} included</small></div></div>
        ${line.notes ? `<div class="review-notes"><strong>Notes</strong><p>${escape(line.notes)}</p></div>` : ''}
      </details>
    </article>`;
  }).join('')}</div>`;
}

function openBasket() {
  // Always use the shared Branded UK basket (quoteBasket), not the prototype drawer.
  window.location.href = quoteBasketHref();
}
basket.addEventListener('close', syncScrollLock);

function readQuoteBasket() {
  try {
    if (window.BrandedCart && typeof window.BrandedCart.get === 'function') {
      const cart = window.BrandedCart.get();
      return Array.isArray(cart) ? cart : [];
    }
    if (window.BrandedQuoteStorage && typeof window.BrandedQuoteStorage.loadBasket === 'function') {
      const stored = window.BrandedQuoteStorage.loadBasket();
      return Array.isArray(stored) ? stored : [];
    }
    const parsed = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQuoteBasket(next) {
  if (window.BrandedCart && typeof window.BrandedCart.save === 'function') {
    window.BrandedCart.save(next);
    return;
  }
  if (window.BrandedQuoteStorage && typeof window.BrandedQuoteStorage.saveBasket === 'function') {
    window.BrandedQuoteStorage.saveBasket(next);
  } else {
    localStorage.setItem('quoteBasket', JSON.stringify(next));
  }
  try { window.dispatchEvent(new Event('basketUpdated')); } catch { /* ignore */ }
}

function syncHeaderBasketCount() {
  const count = $('basket-count');
  if (!count) return;
  const basketLines = readQuoteBasket();
  const total = window.BrandedCart && typeof window.BrandedCart.itemCount === 'function'
    ? window.BrandedCart.itemCount()
    : basketLines.length;
  count.hidden = total === 0;
  count.textContent = String(total);
}

function chosenLinesFromDraft(current) {
  return Object.entries(current.allocations || {}).flatMap(([code, rows]) => {
    const product = products[code];
    return (rows || []).map(row => ({
      code,
      name: product?.label || code,
      label: `${product?.label || code} · ${row.colour} · ${row.size}`,
      colour: row.colour,
      size: row.size,
      quantity: row.quantity,
      image: product?.image || ''
    }));
  });
}

async function persistDraftLogo(file, methodLabel) {
  if (!file) return null;
  if (!(file instanceof File)) return file;
  const method = /embroid/i.test(String(methodLabel || '')) ? 'embroidery' : 'dtf';
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('logo read failed'));
    reader.readAsDataURL(file);
  });
  const storage = window.BrandedQuoteStorage;
  if (!storage || typeof storage.persistLogo !== 'function' || dataUrl.indexOf('data:image') !== 0) {
    return {
      filename: file.name,
      logoId: '',
      ref: '',
      logo: '',
      method,
      position: 'bundle',
      positionLabel: 'Bundle logo'
    };
  }
  try {
    const result = await storage.persistLogo(dataUrl, file.name);
    const logoId = result && result.logoId ? result.logoId : '';
    const ref = logoId && storage.refFor ? storage.refFor(logoId) : '';
    const preview = result && /^https?:/i.test(String(result.url || '')) ? result.url : (ref || dataUrl);
    return {
      filename: file.name,
      logoId,
      ref,
      logo: preview,
      method,
      position: 'bundle',
      positionLabel: 'Bundle logo',
      included: true,
      unitPrice: 0
    };
  } catch {
    return {
      filename: file.name,
      logoId: '',
      ref: '',
      logo: '',
      method,
      position: 'bundle',
      positionLabel: 'Bundle logo'
    };
  }
}

function quoteBasketHref() {
  return '/basket.html#orderSummary';
}

async function addToBasket() {
  if (saving || !readyToAdd(draft) || !canReach(4) || !canLeave(4)) return;
  saving = true;
  builderError = '';
  renderControls();
  try {
    // Best-effort SKU check only. Never block on CMS draft / "not approved"
    // flags — those bundles are already offered on the storefront.
    try {
      const check = await validateSelection(draft.bundle, {
        components: draft.bundle.components.map(component => ({
          componentId: component.id,
          selections: (draft.allocations[component.code] ?? []).map(row => ({
            skuCode: products[component.code].skus.get(skuKey(row.colour, row.size)),
            quantity: row.quantity
          }))
        }))
      });
      const hardErrors = (check.errors || []).filter(text =>
        !/not approved|not orderable|no longer available to order|pending.?customization|draft/i.test(String(text))
      );
      if (!check.valid && hardErrors.length) {
        builderError = 'One of the selected colours or sizes is no longer available. Please review your items.';
        renderStep({reset: false});
        scroll.querySelector('.inline-error')?.scrollIntoView({block: 'nearest'});
        return;
      }
    } catch {
      /* Validation is optional; basket save continues. */
    }

    const logoRecord = await persistDraftLogo(draft.logo, draft.method);
    const pounds = (Number(draft.bundle.price) || 0) / 100;
    const firstImage = chosenLinesFromDraft(draft).find(line => line.image)?.image
      || products[Object.keys(draft.allocations || {})[0]]?.image
      || '';
    const entryId = draft.lineId || (`bundle-${draft.bundle.id}-${Date.now()}`);
    const entry = {
      lineType: 'bundle',
      id: entryId,
      name: draft.bundle.title,
      bundleId: draft.bundle.id,
      bundleSlug: draft.bundle.slug || draft.bundle.id,
      bundleNumber: draft.bundle.bundleNumber || 0,
      currency: 'GBP',
      vatExcluded: true,
      price: pounds,
      bundlePrice: pounds,
      qty: 1,
      image: firstImage,
      chosenLines: chosenLinesFromDraft(draft),
      logos: logoRecord ? [logoRecord] : [],
      selection: {
        choice: draft.choice,
        mix: draft.mix,
        allocations: draft.allocations,
        method: draft.method,
        notes: draft.notes.trim(),
        logo: logoRecord
      },
      builderState: {
        choice: draft.choice,
        mix: draft.mix,
        allocations: draft.allocations,
        method: draft.method,
        notes: draft.notes.trim()
      }
    };

    const quote = readQuoteBasket();
    const existing = quote.findIndex(item => item && item.lineType === 'bundle' && item.id === entryId);
    if (existing >= 0) quote[existing] = entry;
    else quote.push(entry);
    writeQuoteBasket(quote);
    syncHeaderBasketCount();

    // Keep prototype IDB in sync as a local cache, but the real cart is quoteBasket.
    try {
      await basketOperation('readwrite', store => store.put({
        id: entryId,
        createdAt: Date.now(),
        bundleId: draft.bundle.id,
        choice: draft.choice,
        mix: draft.mix,
        allocations: draft.allocations,
        method: draft.method,
        notes: draft.notes.trim()
      }));
    } catch { /* optional cache */ }

    announcement.textContent = draft.lineId ? 'Bundle updated.' : 'Bundle added to your basket.';
    window.location.href = quoteBasketHref();
  } catch {
    builderError = 'We couldn\u2019t save this bundle. Your configuration is still open. Please try again.';
    renderStep({reset: false});
    scroll.querySelector('.inline-error')?.scrollIntoView({block: 'nearest'});
  } finally {
    saving = false;
    if (builder.open) renderControls();
  }
}

function advance() {
  if (saving || !canLeave(draft.step)) return;
  if (draft.step === 4) {
    void addToBasket();
    return;
  }
  const nextStep = draft.step + 1;
  draft.reached = Math.max(draft.reached, nextStep);
  goTo(nextStep);
}

const actions = {
  open: button => openBuilder(findOffer(button.dataset.id), button),
  retry: () => { void init(); },
  basket: openBasket,
  'close-builder': requestClose,
  'close-basket': () => basket.close(),
  back: () => goTo(draft.step - 1),
  step: button => goTo(Number(button.dataset.step)),
  next: advance,
  exclusive: button => changeChoice(button.dataset.code),
  'pick-colour': button => {
    variantInputs[button.dataset.code] = {colour: button.dataset.colour};
    renderStep({reset: false});
    scroll.querySelector(`[data-action="pick-colour"][data-code="${button.dataset.code}"][data-colour="${CSS.escape(button.dataset.colour)}"]`)?.focus({preventScroll: true});
  },
  'size-qty': button => {
    const code = button.dataset.code;
    const colour = button.dataset.colour;
    const size = button.dataset.size;
    const delta = Number(button.dataset.delta);
    const current = (draft.allocations[code] ?? []).find(row => row.colour === colour && row.size === size)?.quantity ?? 0;
    if (!setAllocation(draft, code, colour, size, Math.max(0, current + delta))) return;
    variantInputs[code] = {colour};
    renderStep({reset: false});
  },
  fill: button => addAllocation(button.closest('form'), true),
  'remove-allocation': removeAllocation,
  method: button => {
    draft.method = button.dataset.method;
    draft.dirty = true;
    renderStep({reset: false});
    scroll.querySelector(`[data-method="${draft.method}"]`)?.focus();
  },
  browse: () => $('logo-file').click(),
  edit: button => {
    const line = lines.find(entry => entry.id === button.dataset.id);
    if (line) openBuilder(findOffer(line.bundleId), button, line);
  },
  'remove-line': async button => {
    button.disabled = true;
    try {
      await basketOperation('readwrite', store => store.delete(button.dataset.id));
      await refreshBasket();
      announcement.textContent = 'Bundle removed.';
      $('basket-content').querySelector('[tabindex="-1"]')?.focus({preventScroll: true});
    } catch {
      button.disabled = false;
      announcement.textContent = 'The bundle could not be removed. Please try again.';
    }
  }
};

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (button && !button.disabled) actions[button.dataset.action]?.(button);
});
scroll.addEventListener('submit', event => {
  if (!event.target.matches('.allocation-form')) return;
  event.preventDefault();
  addAllocation(event.target);
});
scroll.addEventListener('change', event => {
  const field = event.target;
  if (field.dataset.mix) changeChoice(field.dataset.mix, Number(field.value));
  if (field.name === 'colour' && field.form?.matches('.allocation-form')) {
    const code = field.form.dataset.code;
    variantInputs[code] = {colour: field.value, size: field.form.elements.size.value};
    renderStep({reset: false});
    scroll.querySelector(`.allocation-form[data-code="${code}"] select[name="colour"]`)?.focus({preventScroll: true});
  }
  if (field.name === 'size' && field.form?.matches('.allocation-form')) {
    variantInputs[field.form.dataset.code] = {colour: field.form.elements.colour.value, size: field.value};
  }
  if (field.id === 'logo-file' && field.files.length) void chooseArtwork(field.files);
});
scroll.addEventListener('input', event => {
  if (event.target.id !== 'notes') return;
  draft.notes = event.target.value;
  draft.dirty = true;
  $('notes-count').textContent = draft.notes.length;
});
scroll.addEventListener('toggle', event => {
  const card = event.target;
  if (card.matches('.variant-card') && card.open && scroll.contains(card)) draft.activeProduct = card.querySelector('summary').dataset.code;
}, true);
scroll.addEventListener('dragover', event => {
  const upload = event.target.closest('#upload-area');
  if (!upload) return;
  event.preventDefault();
  upload.classList.add('dragging');
});
scroll.addEventListener('dragleave', event => {
  const upload = event.target.closest('#upload-area');
  if (upload && !upload.contains(event.relatedTarget)) upload.classList.remove('dragging');
});
scroll.addEventListener('drop', event => {
  const upload = event.target.closest('#upload-area');
  if (!upload) return;
  event.preventDefault();
  upload.classList.remove('dragging');
  void chooseArtwork(event.dataTransfer.files);
});
const bundleRadial = $('bundleRadial');
const bundleRadialAnchor = $('bundleRadialAnchor');
const bundleRadialHub = $('bundleRadialHub');
const bundleRadialDim = $('bundleRadialDim');
const bundleRadialSheet = $('bundleRadialSheet');
const bundleRadialSheetBack = $('bundleRadialSheetBack');
const bundleFiltersNav = $('bundleFiltersNav');
let radialHideTimer = 0;
let radialMotionStop = () => {};

function radialButtonLabel() {
  const count = activeFilterCount(appliedBundleFilters);
  const action = radialOpen ? 'Close bundle filters' : 'Open bundle filters';
  return count ? `${action}, ${count} selected` : action;
}

function syncRadialPicks() {
  bundleRadial?.querySelectorAll('.bundle-radial-item').forEach(button => {
    const item = radialCatalog.find(entry => entry.id === button.dataset.filterId);
    button.classList.toggle('is-picked', Boolean(item && filterIsSet(item, appliedBundleFilters)));
  });
  syncHorizontalFilterChips();
}

function syncHorizontalFilterChips() {
  const row = $('bundleFilterRow');
  if (!row) return;
  row.querySelectorAll('[data-filter-id]').forEach(button => {
    const item = radialCatalog.find(entry => entry.id === button.dataset.filterId);
    const picked = Boolean(item && filterIsSet(item, appliedBundleFilters));
    button.classList.toggle('is-picked', picked);
    button.setAttribute('aria-pressed', String(picked));
  });
}

function mountHorizontalFilterChips() {
  const row = $('bundleFilterRow');
  if (!row || row.dataset.ready === '1') return;
  row.dataset.ready = '1';
  radialCatalog.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bundle-filter-chip';
    button.dataset.filterId = item.id;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `Filter by ${item.title}`);
    button.innerHTML = `${item.icon}<span>${item.title}</span>`;
    button.addEventListener('click', () => openRadialSheet(item));
    row.append(button);
  });
  syncHorizontalFilterChips();
}

function syncRadialButton() {
  bundleFiltersNav?.setAttribute('aria-expanded', String(radialOpen));
  bundleFiltersNav?.setAttribute('aria-label', radialButtonLabel());
  syncRadialPicks();
}

function placeRadialHub() {
  const nav = bundleFiltersNav?.closest('#branded-nav, .bottom-nav');
  if (!nav || !bundleRadialAnchor || !bundleFiltersNav) return;
  const anchor = window.__bukFilterAnchor;
  const navRect = anchor
    ? { top: anchor.navTop, left: 0, width: window.innerWidth, height: 82, bottom: anchor.navTop + 82 }
    : nav.getBoundingClientRect();
  const btnRect = anchor
    ? { left: anchor.left, top: anchor.top, width: anchor.width, height: anchor.height }
    : bundleFiltersNav.getBoundingClientRect();
  const disk = bundleFiltersNav.querySelector('.context-disc');
  const icon = bundleFiltersNav.querySelector('.nav-customise-icon, .icon');
  const iconRect = anchor ? btnRect : ((disk || icon) ? (disk || icon).getBoundingClientRect() : btnRect);
  const header = document.querySelector('.mobile-header');
  const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const gutter = 14;
  const labelDrop = 18;
  const reach = 1.82;
  const topLimit = headerBottom + gutter;
  const indicator = nav.querySelector('.indicator');
  const indicatorBox = indicator ? indicator.getBoundingClientRect() : null;
  const circleTop = indicatorBox && indicatorBox.height ? indicatorBox.top - 2 : navRect.top - 18;
  const bottomLimit = circleTop - 12;
  const availH = Math.max(0, bottomLimit - topLimit);
  const availW = Math.max(0, window.innerWidth - gutter * 2);
  const factor = reach + 0.5;
  let plate = Math.min(availW / 2 / factor, (availH - labelDrop) / (2 * factor));
  if (!Number.isFinite(plate) || plate <= 0) plate = 56;
  plate = Math.min(70, plate);
  const hub = Math.min(64, Math.max(48, plate * 0.78));
  bundleRadialAnchor.style.setProperty('--radial-plate', `${plate}px`);
  bundleRadialAnchor.style.setProperty('--radial-hub', `${hub}px`);
  bundleRadialAnchor.style.setProperty('--radial-reach', String(reach));
  bundleRadialAnchor.style.setProperty('--radial-diag', String(reach / Math.SQRT2));
  const side = plate * factor;
  const bottomExtent = side + labelDrop;
  const minX = gutter + side;
  const maxX = window.innerWidth - gutter - side;
  const centerX = Math.min(Math.max(iconRect.left + iconRect.width / 2, minX), maxX);
  let centerY = bottomLimit - bottomExtent;
  if (centerY - side < topLimit) centerY = (topLimit + side + bottomLimit - bottomExtent) / 2;
  bundleRadialAnchor.style.left = `${centerX}px`;
  bundleRadialAnchor.style.top = `${centerY}px`;
  const iconCx = iconRect.left + iconRect.width / 2;
  const iconCy = iconRect.top + iconRect.height / 2;
  let fromX = iconCx - centerX;
  let fromY = iconCy - centerY;
  const hubTop = centerY + fromY - hub / 2;
  const tucked = navRect.top - hubTop;
  if (tucked < 8) fromY += 8 - tucked;
  bundleRadialAnchor.style.setProperty('--hub-from-x', `${fromX}px`);
  bundleRadialAnchor.style.setProperty('--hub-from-y', `${fromY}px`);
  clearFanOfBar();
}

function bukPingSpeed() {
  try {
    if (typeof window.__bukSyncSpeedPark === 'function') window.__bukSyncSpeedPark();
    if (window.parent && window.parent !== window && typeof window.parent.__bukSyncSpeedPark === 'function') {
      window.parent.__bukSyncSpeedPark();
    }
  } catch (error) {
    /* the parent page owns the speed control */
  }
}

function clearFanOfBar() {
  if (!bundleRadial || !bundleRadialAnchor) return;
  const nav = bundleFiltersNav?.closest('.bottom-nav') || document.querySelector('nav.bottom-nav');
  if (!nav) return;
  const indicator = nav.querySelector('.indicator');
  const indicatorBox = indicator ? indicator.getBoundingClientRect() : null;
  const circleTop = indicatorBox && indicatorBox.height ? indicatorBox.top - 2 : nav.getBoundingClientRect().top - 18;
  const limit = circleTop - 12;
  const hadShow = bundleRadial.classList.contains('show');
  bundleRadial.style.visibility = 'hidden';
  bundleRadial.classList.add('show', 'buk-radial-measure');
  let lowest = -Infinity;
  bundleRadial.querySelectorAll('.bundle-radial-item').forEach((item) => {
    const box = item.getBoundingClientRect();
    if (box.width <= 0) return;
    const label = item.querySelector('.bundle-radial-label');
    const labelBottom = label ? label.getBoundingClientRect().bottom : box.bottom;
    lowest = Math.max(lowest, box.bottom, labelBottom);
  });
  bundleRadial.classList.remove('buk-radial-measure', 'show');
  if (!hadShow) {
    bundleRadial.classList.add('is-armed');
    void bundleRadial.offsetWidth;
    bundleRadial.classList.remove('is-armed');
  }
  bundleRadial.style.visibility = '';
  if (Number.isFinite(lowest) && lowest > limit + 0.5) {
    const current = parseFloat(bundleRadialAnchor.style.top) || 0;
    bundleRadialAnchor.style.top = `${current - (lowest - limit)}px`;
  }
}

function stopRadialItemMotion() {
  bundleRadial?.querySelectorAll('.bundle-radial-item').forEach((item) => {
    item.getAnimations().forEach((anim) => anim.cancel());
    item.style.transform = '';
  });
}

function radialOpenTargets() {
  const style = getComputedStyle(bundleRadialAnchor);
  const plate = parseFloat(style.getPropertyValue('--radial-plate')) || 70;
  const reach = (parseFloat(style.getPropertyValue('--radial-reach')) || 1.82) * plate;
  const diag = (parseFloat(style.getPropertyValue('--radial-diag')) || (1.82 / Math.SQRT2)) * plate;
  return [
    `translate(0px, ${(-reach).toFixed(2)}px) scale(1)`,
    `translate(${diag.toFixed(2)}px, ${(-diag).toFixed(2)}px) scale(1)`,
    `translate(${reach.toFixed(2)}px, 0px) scale(1)`,
    `translate(${diag.toFixed(2)}px, ${diag.toFixed(2)}px) scale(1)`,
    `translate(0px, ${reach.toFixed(2)}px) scale(1)`,
    `translate(${(-diag).toFixed(2)}px, ${diag.toFixed(2)}px) scale(1)`,
    `translate(${(-reach).toFixed(2)}px, 0px) scale(1)`,
    `translate(${(-diag).toFixed(2)}px, ${(-diag).toFixed(2)}px) scale(1)`
  ];
}

function playRadialOpen(hubAlreadyCentered) {
  if (!bundleRadial) return;
  stopRadialItemMotion();
  bundleRadial.classList.remove('show', 'is-returning', 'is-tucked', 'is-opening', 'is-armed');
  const release = () => {
    if (!radialOpen || !bundleRadial) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = [...bundleRadial.querySelectorAll('.bundle-radial-item')];
    const ends = radialOpenTargets();
    bundleRadial.classList.remove('show', 'is-returning', 'is-tucked');
    bundleRadial.classList.add('is-armed');
    void bundleRadial.offsetWidth;
    bundleRadial.classList.remove('is-armed');
    bundleRadial.classList.add('is-opening');
    if (reduce) {
      bundleRadial.classList.add('show');
      bundleRadial.classList.remove('is-opening');
      return;
    }
    let pending = items.length;
    items.forEach((item, index) => {
      const anim = item.animate(
        [
          { transform: 'translate3d(0px, 0px, 0px) scale(0.46)' },
          { transform: (ends[index] || ends[0]).replace('translate(', 'translate3d(').replace(') scale', ', 0px) scale') }
        ],
        {
          duration: 420,
          delay: index * 90,
          easing: 'cubic-bezier(0.16, 0.84, 0.32, 1)',
          fill: 'forwards'
        }
      );
      const done = () => {
        pending -= 1;
        if (pending > 0 || !radialOpen || !bundleRadial) return;
        bundleRadial.classList.add('show');
        bundleRadial.classList.remove('is-opening');
        items.forEach((entry) => {
          entry.getAnimations().forEach((running) => running.cancel());
        });
      };
      anim.onfinish = done;
      anim.oncancel = () => {
        pending -= 1;
      };
    });
  };
  if (hubAlreadyCentered) {
    release();
    return;
  }
  bundleRadialAnchor?.classList.add('show');
  radialMotionStop = whenRadialSettles(bundleRadialHub, 'transform', 480, release);
}

function cancelRadialMotion() {
  clearTimeout(radialHideTimer);
  radialMotionStop();
  radialMotionStop = () => {};
}

function whenRadialSettles(el, propertyName, fallbackMs, fn) {
  let settled = false;
  const finish = event => {
    if (settled) return;
    if (event && (event.target !== el || event.propertyName !== propertyName)) return;
    settled = true;
    el?.removeEventListener('transitionend', onEnd);
    clearTimeout(timer);
    fn();
  };
  const onEnd = event => finish(event);
  const timer = setTimeout(() => finish(), fallbackMs);
  el?.addEventListener('transitionend', onEnd);
  return () => {
    settled = true;
    el?.removeEventListener('transitionend', onEnd);
    clearTimeout(timer);
  };
}

function finishRadialClose() {
  if (radialOpen) return;
  bundleRadialDim?.classList.remove('show');
  bundleRadialDim?.setAttribute('aria-hidden', 'true');
  bundleRadial?.classList.remove('is-returning', 'is-tucked', 'is-opening', 'is-armed');
  stopRadialItemMotion();
  bundleRadialAnchor?.classList.remove('is-dropping');
  bundleRadialAnchor?.classList.remove('is-open');
  if (bundleRadialAnchor) bundleRadialAnchor.inert = true;
  document.dispatchEvent(new CustomEvent('buk-fan-closed'));
  try {
    if (window.parent && window.parent !== window) {
      window.parent.document.dispatchEvent(new CustomEvent('buk-fan-closed'));
    }
  } catch (error) {
    /* the parent bar restores its own circle */
  }
}

function playRadialClose() {
  const items = [...(bundleRadial?.querySelectorAll('.bundle-radial-item') || [])];
  const froms = items.map((item) => getComputedStyle(item).transform);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bundleRadial?.classList.add('is-returning');
  bundleRadial?.classList.remove('show', 'is-opening', 'is-armed');
  bundleRadial?.setAttribute('aria-hidden', 'true');
  if (bundleRadial) bundleRadial.inert = true;
  const done = () => {
    if (radialOpen || !bundleRadial) return;
    items.forEach((item) => {
      item.getAnimations().forEach((anim) => anim.cancel());
      item.style.transform = '';
    });
    bundleRadial.classList.add('is-tucked');
    bundleRadial.classList.remove('is-returning');
    dropHubBehindFilters();
  };
  if (!items.length || reduce) {
    done();
    return;
  }
  const running = [];
  items.forEach((item, index) => {
    const from = froms[index];
    item.getAnimations().forEach((anim) => anim.cancel());
    const anim = item.animate(
      [
        { transform: from && from !== 'none' ? from : 'translate3d(0px, 0px, 0px) scale(0.46)' },
        { transform: 'translate3d(0px, 0px, 0px) scale(0.46)' }
      ],
      {
        duration: 400,
        delay: (items.length - 1 - index) * 100,
        easing: 'ease-in',
        fill: 'both'
      }
    );
    running.push(anim);
    if (index === 0) anim.onfinish = () => done();
  });
  radialMotionStop = () => {
    running.forEach((anim) => anim.cancel());
  };
}

function dropHubBehindFilters() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bundleRadialAnchor?.classList.add('is-dropping');
  if (bundleRadialHub) void bundleRadialHub.getBoundingClientRect();
  bundleRadialAnchor?.classList.remove('show');
  radialMotionStop = whenRadialSettles(bundleRadialHub, 'transform', reduce ? 80 : 800, finishRadialClose);
}

function toggleRadial(force) {
  const next = typeof force === 'boolean' ? force : !radialOpen;
  if (next === radialOpen) return;
  radialOpen = next;
  cancelRadialMotion();
  if (radialOpen) {
    placeRadialHub();
    bundleRadialAnchor?.classList.add('is-open');
    bundleRadialAnchor?.classList.remove('is-dropping');
    bundleRadial?.classList.remove('is-returning');
    bundleRadial?.classList.remove('is-tucked');
    bundleRadialDim?.classList.add('show');
    bundleRadial?.setAttribute('aria-hidden', 'false');
    bundleRadialDim?.setAttribute('aria-hidden', 'false');
    if (bundleRadial) bundleRadial.inert = false;
    if (bundleRadialAnchor) bundleRadialAnchor.inert = false;
    const hubAlreadyCentered = bundleRadialAnchor?.classList.contains('show');
    bukPingSpeed();
    playRadialOpen(hubAlreadyCentered);
    bukPingSpeed();
  } else if (bundleRadial?.classList.contains('show') || bundleRadial?.classList.contains('is-opening')) {
    playRadialClose();
  } else if (bundleRadialAnchor?.classList.contains('show') || bundleRadialAnchor?.classList.contains('is-dropping')) {
    dropHubBehindFilters();
  } else {
    finishRadialClose();
  }
  syncRadialButton();
}

function valueSelected(filters, item, value) {
  return item.multi ? filters[item.id].includes(value) : filters[item.id] === value;
}

function toggleDraftValue(id, value) {
  const item = radialCatalog.find(entry => entry.id === id);
  if (!item || !sheetDraft) return;
  if (item.multi) {
    const on = new Set(sheetDraft[id]);
    if (on.has(value)) on.delete(value);
    else on.add(value);
    sheetDraft[id] = item.values.filter(entry => on.has(entry));
  } else {
    sheetDraft[id] = sheetDraft[id] === value ? '' : value;
  }
}

function sectionMarkup(item, filters) {
  const chips = item.values.map(value => {
    const on = valueSelected(filters, item, value);
    return `<button type="button" class="bundle-radial-option${on ? ' selected' : ''}" data-filter-choice="${item.id}" data-filter-value="${escape(value)}" aria-pressed="${on}">${on ? '<span class="opt-tick" aria-hidden="true">✓</span>' : ''}${escape(value)}</button>`;
  }).join('');
  return `<section class="bundle-filter-section">
    <div class="bundle-filter-section-head">
      <img src="./assets/filters/${item.iconFile}.png?v=20261113-filters" alt="" width="42" height="42">
      <div class="bundle-filter-section-copy">
        <h3>${escape(item.title)}</h3>
        <p>${escape(item.prompt)}</p>
      </div>
      ${filterIsSet(item, filters) ? '<span class="bundle-filter-selected">Selected <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg></span>' : ''}
    </div>
    <div class="bundle-radial-options${item.id === 'budget' ? ' bundle-radial-options--budget' : ''}" role="group" aria-label="${escape(item.title)}">${chips}</div>
  </section>`;
}

function renderFilterSheet() {
  if (!sheetDraft) return;
  const count = matchCount(sheetDraft);
  const focus = radialCatalog.find(item => item.id === sheetFocusId) || radialCatalog[0];
  const others = radialCatalog.filter(item => item.id !== focus.id);
  const picks = radialCatalog.flatMap(item => choiceList(item, sheetDraft).map(value => ({item, value})));
  const match = $('bundleFilterMatch');
  if (match) {
    match.innerHTML = `
      <div class="bundle-filter-match-copy">
        <strong>${escape(pluralBundles(count))}</strong>
        <span>matching your filters</span>
      </div>
      ${picks.length ? `<div class="bundle-filter-match-chips">${picks.map(({item, value}) => `
        <button type="button" class="bundle-sheet-chip" data-draft-remove="${item.id}" data-filter-value="${escape(value)}">
          <img src="./assets/filters/${item.iconFile}.png?v=20261113-filters" alt="" width="18" height="18">
          <span>${escape(value)}</span>
          <span class="chip-x" aria-hidden="true">&times;</span>
          <span class="sr-only">Remove ${escape(value)}</span>
        </button>`).join('')}</div>` : ''}`;
  }
  const apply = $('bundleRadialApply');
  if (apply) apply.textContent = `Apply filters (${count}) →`;
  const body = $('bundleRadialSheetBody');
  if (!body) return;
  const scrollTop = body.scrollTop;
  const layers = '<svg class="bundle-other-layers" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></svg>';
  const chevron = '<svg class="bundle-other-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
  body.innerHTML = `
    ${sectionMarkup(focus, sheetDraft)}
    <button type="button" class="bundle-other-filters" id="bundleOtherFilters" aria-expanded="${otherFiltersOpen}">
      ${layers}
      <span class="bundle-other-copy">
        <strong>Other Filters</strong>
        <span>${escape(others.map(item => item.title).join(', '))}</span>
      </span>
      ${chevron}
    </button>
    ${otherFiltersOpen ? `<div class="bundle-other-groups">${others.map(item => sectionMarkup(item, sheetDraft)).join('')}</div>` : ''}`;
  body.scrollTop = scrollTop;
}

function radialSheetOpen() {
  return bundleRadialSheet?.classList.contains('show');
}

function openRadialSheet(item) {
  toggleRadial(false);
  bundleRadialDim?.classList.remove('show');
  bundleRadialDim?.setAttribute('aria-hidden', 'true');
  radialCurrent = item;
  sheetFocusId = item.id;
  sheetDraft = cloneBundleFilters();
  otherFiltersOpen = false;
  bundleRadialSheetBack?.classList.add('show');
  bundleRadialSheet?.classList.add('show');
  bundleRadialSheetBack?.setAttribute('aria-hidden', 'false');
  bundleRadialSheet?.setAttribute('aria-hidden', 'false');
  if (bundleRadialSheet) bundleRadialSheet.inert = false;
  document.body.classList.add('bundle-radial-sheet-open');
  renderFilterSheet();
  bukPingSpeed();
  $('bundleRadialSheetBody')?.querySelector('.bundle-radial-option')?.focus({preventScroll: true});
}

function closeRadialSheet(restore = true) {
  if (!radialSheetOpen()) return;
  bundleRadialSheetBack?.classList.remove('show');
  bundleRadialSheet?.classList.remove('show');
  bundleRadialSheetBack?.setAttribute('aria-hidden', 'true');
  bundleRadialSheet?.setAttribute('aria-hidden', 'true');
  if (bundleRadialSheet) bundleRadialSheet.inert = true;
  document.body.classList.remove('bundle-radial-sheet-open');
  radialCurrent = null;
  sheetDraft = null;
  sheetFocusId = null;
  otherFiltersOpen = false;
  if (!radialOpen && bundleRadialAnchor?.classList.contains('is-open')) {
    bundleRadialDim?.classList.add('show');
    bundleRadialDim?.setAttribute('aria-hidden', 'false');
  }
  if (restore) bundleFiltersNav?.focus();
  bukPingSpeed();
}

function applyRadialFilter() {
  if (!sheetDraft) return;
  radialCatalog.forEach(item => {
    appliedBundleFilters[item.id] = item.multi ? [...sheetDraft[item.id]] : (sheetDraft[item.id] || '');
  });
  announceBundleFilters = true;
  renderShop();
  closeRadialSheet(false);
  $('bundles')?.scrollIntoView({behavior: 'smooth', block: 'start'});
}

function clearSheetDraft() {
  if (!sheetDraft) return;
  radialCatalog.forEach(item => { sheetDraft[item.id] = item.multi ? [] : ''; });
  renderFilterSheet();
}

function clearBundleFilters() {
  radialCatalog.forEach(item => { appliedBundleFilters[item.id] = item.multi ? [] : ''; });
  if (sheetDraft) clearSheetDraft();
  announceBundleFilters = true;
  renderShop();
}

radialCatalog.forEach(item => {
  const button = document.createElement('button');
  const glyph = document.createElement('span');
  const label = document.createElement('span');
  button.type = 'button';
  button.className = 'bundle-radial-item';
  button.dataset.filterId = item.id;
  glyph.className = 'glyph';
  glyph.setAttribute('aria-hidden', 'true');
  glyph.innerHTML = item.icon;
  label.className = 'bundle-radial-label';
  label.setAttribute('aria-hidden', 'true');
  label.textContent = item.title;
  button.append(glyph, label);
  button.setAttribute('aria-label', `Filter by ${item.title}`);
  button.addEventListener('click', () => openRadialSheet(item));
  bundleRadial?.append(button);
});
placeRadialHub();
window.addEventListener('resize', () => {
  if (radialOpen || bundleRadialAnchor?.classList.contains('is-open')) placeRadialHub();
});
if (bundleRadial) bundleRadial.inert = true;
if (bundleRadialAnchor) bundleRadialAnchor.inert = true;
if (bundleRadialSheet) bundleRadialSheet.inert = true;

function openBundleFiltersFromBar(force) {
  if (radialSheetOpen()) closeRadialSheet(false);
  if (force === true) toggleRadial(true);
  else if (force === false) toggleRadial(false);
  else toggleRadial();
}
window.__bukOpenBundleFilters = openBundleFiltersFromBar;
bundleFiltersNav?.addEventListener('buk-open-filters', openBundleFiltersFromBar);
document.addEventListener('buk-close-filters', () => {
  if (radialSheetOpen()) closeRadialSheet(false);
  toggleRadial(false);
});
bundleFiltersNav?.addEventListener('click', () => {
  if (bundleFiltersNav.closest('#branded-nav, nav.bottom-nav.nav')) return;
  openBundleFiltersFromBar();
});
bundleRadialHub?.addEventListener('click', () => {
  toggleRadial(false);
  bundleFiltersNav?.focus({preventScroll: true});
});
bundleRadialDim?.addEventListener('click', () => toggleRadial(false));
$('bundleRadialClose')?.addEventListener('click', () => closeRadialSheet());
bundleRadialSheetBack?.addEventListener('click', () => closeRadialSheet());
$('bundleRadialApply')?.addEventListener('click', applyRadialFilter);
$('bundleRadialClear')?.addEventListener('click', clearSheetDraft);
bundleRadialSheet?.addEventListener('click', event => {
  const choice = event.target.closest('[data-filter-choice]');
  if (choice && sheetDraft) {
    toggleDraftValue(choice.dataset.filterChoice, choice.dataset.filterValue);
    renderFilterSheet();
    return;
  }
  const remove = event.target.closest('[data-draft-remove]');
  if (remove && sheetDraft) {
    removeFilterValue(sheetDraft, remove.dataset.draftRemove, remove.dataset.filterValue);
    renderFilterSheet();
    return;
  }
  if (event.target.closest('#bundleOtherFilters')) {
    otherFiltersOpen = !otherFiltersOpen;
    renderFilterSheet();
  }
});
bundleRadialSheet?.addEventListener('keydown', event => {
  if (event.key !== 'Tab' || !radialSheetOpen()) return;
  const items = [...bundleRadialSheet.querySelectorAll('button')].filter(item => !item.disabled);
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
$('bundle-result-line')?.addEventListener('click', event => {
  const remove = event.target.closest('[data-remove-filter]');
  if (remove) {
    removeFilterValue(appliedBundleFilters, remove.dataset.removeFilter, remove.dataset.filterValue);
    announceBundleFilters = true;
    renderShop();
    return;
  }
  if (event.target.closest('[data-clear-bundle-filters]')) clearBundleFilters();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (radialSheetOpen()) {
    event.preventDefault();
    closeRadialSheet();
  } else if (radialOpen) {
    event.preventDefault();
    toggleRadial(false);
  }
});
mountHorizontalFilterChips();

const bundleSortSelect = $('bundleSort');
if (bundleSortSelect) {
  bundleSortSelect.value = catalogueSort;
  bundleSortSelect.addEventListener('change', event => {
    const value = event.target.value || 'cost';
    if (value.startsWith('filter:')) {
      const filterId = value.slice(7);
      const item = radialCatalog.find(entry => entry.id === filterId);
      bundleSortSelect.value = catalogueSort;
      if (item) openRadialSheet(item);
      return;
    }
    catalogueSort = value;
    renderShop();
  });
}

function refreshCatalogueVatLabels() {
  document.querySelectorAll('.vat-suffix').forEach(el => {
    el.textContent = catalogueVatLabel();
  });
  document.querySelectorAll('[data-base-price]').forEach(el => {
    const pounds = parseFloat(el.dataset.basePrice);
    if (!Number.isFinite(pounds)) return;
    el.textContent = catalogueMoney(pounds);
  });
}

window.addEventListener('vatToggleChanged', refreshCatalogueVatLabels);

window.BrandedOpenBundle = (id, source) => {
  const offer = findOffer(id);
  if (!offer) return false;
  openBuilder(offer, source || undefined);
  return true;
};

function registerAll() {
  deals.forEach(deal => { if (deal.detail) registerDeal(deal); });
}

let renderTimer;
function renderSoon() {
  if (renderTimer) return;
  renderTimer = setTimeout(() => {
    renderTimer = undefined;
    // Don't swap the grid under someone who is tabbing through it.
    if (builder.open || basket.open || $('catalogue-grid').contains(document.activeElement)) { renderSoon(); return; }
    registerAll();
    renderShop();
    refreshCatalogueVatLabels();
  }, 700);
}

async function resumeQuoteEdit() {
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit') || '';
  const bundleKey = params.get('bundle') || '';
  if (!editId && !bundleKey) return;
  const line = readQuoteBasket().find(item =>
    item && item.lineType === 'bundle' &&
    ((editId && item.id === editId) || (bundleKey && (item.bundleSlug === bundleKey || item.bundleId === bundleKey)))
  );
  if (!line) return;
  const deal = [...offerById.values()].find(entry =>
    entry.id === line.bundleId || entry.slug === line.bundleSlug || entry.id === line.bundleSlug || entry.slug === line.bundleId
  );
  const bundle = deal && canBuild(deal) ? asBundle(deal) : undefined;
  if (!bundle) return;
  const state = line.builderState || line.selection || {};
  const logo = state.logo || (Array.isArray(line.logos) ? line.logos[0] : null);
  if (logo && !logo.name) logo.name = logo.filename || 'Uploaded logo';
  await openBuilder(bundle, null, {
    id: line.id,
    choice: state.choice || '',
    mix: state.mix || {},
    allocations: state.allocations || {},
    method: state.method || '',
    notes: state.notes || '',
    logo
  });
}

async function init() {
  listState = 'loading';
  renderShop();
  try {
    deals = await loadBundles();
    listState = 'ready';
  } catch {
    listState = 'error';
    renderShop();
    return;
  }
  registerAll();
  rebuildBudgetStages();
  renderShop();
  refreshCatalogueVatLabels();
  void hydrateBlackThumbs();
  syncHeaderBasketCount();
  window.addEventListener('basketUpdated', syncHeaderBasketCount);
  window.addEventListener('storage', event => {
    if (!event.key || event.key === 'quoteBasket') syncHeaderBasketCount();
  });
  void refreshBasket();
  void resumeQuoteEdit();
  // Older API builds don't return contents in the list; load them slowly.
  void loadAllDetails(deals, {onProgress: renderSoon}).then(() => {
    clearTimeout(renderTimer);
    renderTimer = undefined;
    registerAll();
    renderShop();
    refreshCatalogueVatLabels();
  });
}

// A broken product image falls back to a plain tile instead of a broken icon.
document.addEventListener('error', event => {
  const image = event.target;
  if (image?.matches?.('img[data-thumb]')) {
    const code = image.dataset.thumb;
    if (products[code]) products[code].image = '';
    image.replaceWith(Object.assign(document.createElement('span'), {className: 'cap-thumb', innerHTML: icon('layers')}));
  }
}, true);

void init();
