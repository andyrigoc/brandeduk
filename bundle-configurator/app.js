import {
  products, bundles, demos, swatches, findBundle, formatPrice, pieceCount, sum,
  newDraft, choiceValid, quotas, allocated, variantsValid, setChoice, setAllocation,
  acceptedFile, logoValid, readyToAdd
} from './catalogue.js';
import { deals } from './deals.js?v=20261113-nosource';

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
const price = pence => `<strong>${formatPrice(pence)}</strong> <small>ex VAT</small>`;
const title = (heading, copy) => `<div class="step-heading"><h3 tabindex="-1">${heading}</h3>${copy ? `<p>${copy}</p>` : ''}</div>`;
const thumb = (code, cls = '') => code === 'BC025'
  ? `<span class="cap-thumb ${cls}">${icon('cap')}</span>`
  : `<img class="thumb ${cls}" src="./assets/${code.toLowerCase()}.webp" alt="" width="432" height="432" decoding="async">`;
const isInclusion = bundle => bundle.methods.length > 1 ? 'One logo included' : `${bundle.methods[0] === 'Print' ? 'Printing' : 'Embroidery'} included`;
const pluralBundles = n => `${n} ${n === 1 ? 'bundle' : 'bundles'}`;
const announcement = $('announcement');

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

const knownGarments = new Set(Object.keys(products));
const offerById = new Map();

function asBundle(deal) {
  const printOnly = /free printing/i.test(deal.title);
  return {
    id: deal.id,
    title: deal.title.replace(/^Bundle:\s*/i, ''),
    price: deal.price,
    methods: printOnly ? ['Print'] : ['Print', 'Embroidery'],
    delivery: /consegna gratis/.test(deal.title) && !/>\s*£/.test(deal.title),
    art: (deal.productType || []).includes('t-shirts') ? 'tee' : 'outdoor',
    fixed: deal.fixed || {}
  };
}

function canBuild(deal) {
  const codes = Object.keys(deal.fixed || {});
  return deal.status === 'ready' && !deal.substitute && !deal.discountCode && codes.length > 0 && codes.every(code => knownGarments.has(code));
}

function findOffer(id) {
  const deal = offerById.get(id);
  if (deal && canBuild(deal)) return asBundle(deal);
  return findBundle(id);
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

function budgetStageEdges(prices) {
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);
  const span = highPrice - lowPrice;
  const increment = span >= 1000 ? 10 : span >= 200 ? 5 : 1;
  const edges = Array.from({length: 7}, (_, index) => {
    const raw = lowPrice + (span * index) / 6;
    const direction = index === 0 ? -1 : index === 6 ? 1 : 0;
    return roundStagePounds(raw, increment, direction);
  });
  edges[0] = Math.min(edges[0], roundStagePounds(lowPrice, increment, -1));
  edges[6] = Math.max(edges[6], roundStagePounds(highPrice, increment, 1));
  for (let index = 1; index < edges.length; index += 1) {
    if (edges[index] <= edges[index - 1]) edges[index] = edges[index - 1] + increment;
  }
  while (edges[6] < highPrice) edges[6] += increment;
  return edges;
}

const budgetEdges = budgetStageEdges(shownBundlePounds());
const BUDGET_STAGES = budgetEdges.slice(0, -1).map((low, index) => {
  const high = budgetEdges[index + 1];
  return {low, high, label: `${stagePound.format(low)}–${stagePound.format(high)}`};
});
const radialCatalog = [
  {id: 'industry', title: 'Industry', iconFile: 'industry', icon: radialIcon('industry'), prompt: 'What industry are you in?', layout: 'checks', multi: true, values: ['Construction', 'Cleaning', 'Hospitality', 'Corporate / Office', 'Education / Leavers', 'Sport & Fitness']},
  {id: 'team', title: 'Team Size', iconFile: 'team-size', icon: radialIcon('team-size'), prompt: 'How many people are you buying for?', layout: 'grid3', values: ['1–2', '3–5', '6–10', '11–20', '21–30', '31–50', '51–100', '100+']},
  {id: 'budget', title: 'Budget', iconFile: 'budget', icon: radialIcon('budget'), prompt: 'What is your budget?', layout: 'stack', values: BUDGET_STAGES.map(stage => stage.label)},
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

function gcd(left, right) {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a;
}

function kitPeople(deal) {
  const quantities = Object.values(deal.fixed || {}).map(Number).filter(count => count > 0);
  if (quantities.length) return quantities.reduce((total, count) => gcd(total, count));
  return Number(deal.qty) || 0;
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

function industryMatches(deal, value) {
  if (!value) return true;
  // Only safety and healthcare are stored as sectors. The other labels use the
  // nearest product type or feature. Cleaning and Sport & Fitness have neither.
  if (value === 'Construction') return hasSector(deal, 'safety') || hasFeature(deal, 'high-visibility') || hasType(deal, 'safety-vests');
  if (value === 'Hospitality') return hasType(deal, 'aprons');
  if (value === 'Corporate / Office') return hasType(deal, 'polos') && !hasType(deal, 'safety-vests') && !hasFeature(deal, 'high-visibility');
  if (value === 'Education / Leavers') return hasType(deal, 'hoodies');
  if (value === 'Cleaning' || value === 'Sport & Fitness') return false;
  return false;
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
  const print = /print|dtf|dtg/i.test(title);
  const embroidery = /embroider|stitch/i.test(title);
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

function renderShop() {
  deals.forEach(deal => offerById.set(deal.id, deal));
  const shown = deals.filter(deal => dealMatchesBundleFilters(deal));
  renderFilterSummary(shown.length);
  if (announceBundleFilters && announcement) announcement.textContent = pluralBundles(shown.length);
  const demoSection = document.querySelector('.demos');
  if (demoSection) demoSection.hidden = chosenRadialFilters().length > 0;
  $('catalogue-grid').innerHTML = shown.length ? shown.map(deal => {
    const bundle = asBundle(deal);
    const items = Object.entries(bundle.fixed);
    const build = canBuild(deal);
    const composition = items.length
      ? items.map(([code, qty]) => `${qty} ${products[code] ? products[code].label.toLowerCase() : code}`).join(' · ')
      : (deal.codes || []).join(', ');
    return `<article class="bundle-card${build ? '' : ' is-blocked'}">
      <div class="card-art art-${bundle.art}">
        <span class="quantity-tag">${deal.qty || pieceCount(bundle)} items</span>
        <div class="product-visual products-${Math.min(items.length, 4) || 1}">${items.map(([code]) => products[code] ? thumb(code) : `<span class="code-chip">${escape(code)}</span>`).join('')}</div>
      </div>
      <div class="card-body">
        <h3>${escape(bundle.title)}</h3>
        ${composition ? `<p class="composition">${escape(composition)}</p>` : ''}
        ${build ? `<p class="inclusion">${icon('tick')} ${isInclusion(bundle)}</p>` : ''}
        <div class="card-footer">
          <div class="card-price">${deal.price ? price(deal.price) : ''}</div>
          <button type="button" class="button primary bundle-view" data-action="open" data-id="${deal.id}" ${build ? '' : 'disabled'}>${build ? `View Bundle ${icon('right')}` : 'Not available'}</button>
        </div>
      </div>
    </article>`;
  }).join('') : `<p class="bundle-empty">${escape(emptyFilterMessage())}</p>`;

  $('demo-grid').innerHTML = demos.map(bundle => `<article class="demo-card">
    <span class="demo-icon">${icon(bundle.group.type === 'exclusive' ? 'cap' : 'layers')}</span>
    <div><p class="card-category">${bundle.tag}</p><h3>${bundle.title}</h3></div>
    <button type="button" class="button secondary" data-action="open" data-id="${bundle.id}" aria-label="Try ${bundle.title}">Try demo ${icon('right')}</button>
  </article>`).join('');
}

function openBuilder(bundle, source, saved) {
  if (!bundle || builder.open) return;
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
  $('builder-kicker').textContent = bundle.demo ? 'CHOICE DEMO' : 'BUILD YOUR BUNDLE';
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
  return `<li class="item-row">${thumb(code)}<div><strong>${products[code].name}</strong><small>${code}</small></div><span class="row-quantity">× ${qty}</span></li>`;
}

function includedMarkup() {
  const bundle = draft.bundle;
  const group = bundle.group;
  return title('What’s included', `${pieceCount(bundle)} items with one logo across the bundle.`) +
    `<ul class="item-list">${Object.entries(bundle.fixed).map(([code, qty]) => itemRow(code, qty)).join('')}
      ${group ? `<li class="item-row"><span class="cap-thumb">${icon('layers')}</span><div><strong>${group.name}</strong>
        <small>${group.codes.map(code => products[code].label).join(group.type === 'exclusive' ? ' or ' : ' and ')}</small></div><span class="row-quantity">× ${group.quantity}</span></li>` : ''}
    </ul>
    <div class="info-panel">${icon('tick')}<div><strong>${isInclusion(bundle)}</strong><small>${bundle.methods.join(' or ')}${bundle.delivery ? ' · Free delivery' : ''}${bundle.demo ? ' · Illustrative price' : ''}</small></div></div>`;
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

function colourDot(colour) {
  return `<span class="colour-swatch" style="--swatch:${swatches[colour]}" aria-hidden="true"></span>`;
}

function variantForm(code, required) {
  const product = products[code];
  const remaining = required - allocated(draft, code);
  const options = variantInputs[code] ?? {};
  const rows = draft.allocations[code] ?? [];
  return `<div class="variant-body">
    ${rows.length ? `<ul class="allocation-list" aria-label="Selected variants">${rows.map(row => `
      <li>${colourDot(row.colour)}<span>${row.colour} · ${row.size}</span><strong>× ${row.quantity}</strong>
        <button class="icon-button small" type="button" data-action="remove-allocation" data-code="${code}" data-colour="${row.colour}" data-size="${row.size}" aria-label="Remove ${row.colour}, ${row.size}, ${row.quantity} pieces">${icon('x')}</button></li>`).join('')}</ul>` : ''}
    ${remaining ? `<form class="allocation-form" data-code="${code}">
      <div class="variant-fields">
        <label>Colour<select name="colour">${product.colours.map(colour => `<option ${options.colour === colour ? 'selected' : ''}>${colour}</option>`).join('')}</select></label>
        <label>Size<select name="size">${product.sizes.map(size => `<option ${options.size === size ? 'selected' : ''}>${size}</option>`).join('')}</select></label>
        <label>Quantity<input name="quantity" type="number" min="1" max="${remaining}" step="1" inputmode="numeric" required value="1"></label>
      </div>
      <p class="inline-error" role="alert" hidden></p>
      <div class="variant-actions">
        <button class="button secondary compact" type="submit">Add selection</button>
        ${remaining > 1 ? `<button class="text-button" type="button" data-action="fill">${rows.length ? `Add remaining ${remaining}` : `Add all ${remaining}`}</button>` : ''}
      </div>
    </form>` : ''}
  </div>`;
}

function variantsMarkup() {
  const items = Object.entries(quotas(draft));
  const total = pieceCount(draft.bundle);
  const selected = sum(items.map(([code]) => allocated(draft, code)));
  const active = draft.activeProduct || items.find(([code, qty]) => allocated(draft, code) < qty)?.[0] || '';
  return title('Colours & sizes', 'Split each product quantity across the colours and sizes you need.') +
    `<div class="quantity-status ${selected === total ? 'finished' : ''}">${selected} / ${total} items configured</div>
    <div class="variants-list">${items.map(([code, qty]) => {
      const count = allocated(draft, code);
      return `<details class="variant-card" name="products" ${active === code ? 'open' : ''}>
        <summary data-code="${code}">${thumb(code)}
          <span class="variant-title"><strong>${products[code].name}</strong><small>${code}${count < qty ? ` · ${qty - count} remaining` : ''}</small></span>
          <span class="variant-counter ${count === qty ? 'finished' : ''}">${count === qty ? icon('tick') : ''}${count}/${qty}</span>
          ${icon('chevron', 'chevron')}</summary>${variantForm(code, qty)}</details>`;
    }).join('')}</div>
    <p class="small-note">Colour and size availability is illustrative in this prototype.</p>`;
}

function logoMarkup() {
  const {bundle, method, logo, notes} = draft;
  return title('Upload your logo', 'Choose one artwork file for the whole bundle.') +
    (bundle.methods.length > 1
      ? `<fieldset class="method-field"><legend>Included decoration</legend><div>${bundle.methods.map(option =>
        `<button type="button" class="button method" data-action="method" data-method="${option}" aria-pressed="${method === option}">${method === option ? icon('tick') : ''}${option}</button>`).join('')}</div></fieldset>`
      : `<div class="info-panel method-info">${icon('tick')}<div><strong>${isInclusion(bundle)}</strong></div></div>`) +
    `<div class="upload-area" id="upload-area">
      <span class="upload-icon">${icon(logo ? 'file' : 'upload')}</span>
      <strong>${pendingArtwork ? 'Checking file…' : logo ? escape(logo.name) : 'Drag your logo here'}</strong>
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
    <li class="item-row">${thumb(code)}<div><strong>${sum(rows.map(row => row.quantity))} × ${products[code].label}</strong>
      <small>${code}</small><ul class="review-variants">${rows.map(row => `<li>${colourDot(row.colour)} ${row.colour} · ${row.size} × ${row.quantity}</li>`).join('')}</ul>
      </div></li>`).join('')}</ul>`;
}

function reviewMarkup() {
  return title('Review your bundle', `${pieceCount(draft.bundle)} items configured.`) +
    `<div class="review-section"><div class="review-heading"><h4>Items</h4><button type="button" class="text-button" data-action="step" data-step="2">Edit items</button></div>
    ${selectedItems(draft.allocations)}</div>
    <div class="review-section">
      <div class="review-heading"><h4>Artwork</h4><button type="button" class="text-button" data-action="step" data-step="3">Edit logo</button></div>
      <div class="info-panel">${icon('file')}<div><strong>${escape(draft.logo?.name ?? '')}</strong><small>${draft.method} included</small></div></div>
      ${draft.notes.trim() ? `<div class="review-notes"><strong>Notes</strong><p>${escape(draft.notes.trim())}</p></div>` : ''}
    </div>
    ${builderError ? `<p class="inline-error" role="alert">${escape(builderError)}</p>` : ''}`;
}

function renderStep({reset = true} = {}) {
  scroll.innerHTML = [includedMarkup, groupsMarkup, variantsMarkup, logoMarkup, reviewMarkup][draft.step]();
  if (reset) scroll.scrollTop = 0;
  renderControls();
}

function goTo(step) {
  if (saving || !canReach(step)) return;
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
    lines = (await basketOperation('readonly', store => store.getAll())).filter(line => findOffer(line.bundleId));
    lines.sort((a, b) => a.createdAt - b.createdAt);
    storeError = '';
  } catch {
    storeError = 'This browser could not open the demo basket. Check that site storage is enabled.';
  }
  const count = $('basket-count');
  count.textContent = String(lines.length);
  count.hidden = lines.length === 0;
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
        <div><h3>${bundle.title}</h3><p>${pieceCount(bundle)} items · ${bundle.demo ? 'Choice demo' : 'One logo included'}</p></div>
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
  renderBasket();
  if (!basket.open) basket.showModal();
  syncScrollLock();
  $('basket-content').scrollTop = 0;
  $('basket-content').querySelector('[tabindex="-1"]')?.focus({preventScroll: true});
  void refreshBasket();
}
basket.addEventListener('close', syncScrollLock);

async function addToBasket() {
  if (saving || !readyToAdd(draft) || !canReach(4) || !canLeave(4)) return;
  saving = true;
  builderError = '';
  renderControls();
  const prior = lines.find(line => line.id === draft.lineId);
  const line = {
    id: draft.lineId ?? crypto.randomUUID(),
    createdAt: prior?.createdAt ?? Date.now(),
    bundleId: draft.bundle.id,
    choice: draft.choice,
    mix: draft.mix,
    allocations: draft.allocations,
    method: draft.method,
    logo: draft.logo,
    notes: draft.notes.trim()
  };
  try {
    await basketOperation('readwrite', store => store.put(line));
    await refreshBasket();
    announcement.textContent = draft.lineId ? 'Bundle updated.' : 'Bundle added to your basket.';
    closeBuilder(true);
  } catch {
    builderError = 'The basket could not be saved. Your configuration is still open. Please try again.';
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
  basket: openBasket,
  'close-builder': requestClose,
  'close-basket': () => basket.close(),
  back: () => goTo(draft.step - 1),
  step: button => goTo(Number(button.dataset.step)),
  next: advance,
  exclusive: button => changeChoice(button.dataset.code),
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
}

function syncRadialButton() {
  bundleFiltersNav?.setAttribute('aria-expanded', String(radialOpen));
  bundleFiltersNav?.setAttribute('aria-label', radialButtonLabel());
  syncRadialPicks();
}

function placeRadialHub() {
  const nav = bundleFiltersNav?.closest('.bottom-nav');
  if (!nav || !bundleRadialAnchor || !bundleFiltersNav) return;
  const navRect = nav.getBoundingClientRect();
  const btnRect = bundleFiltersNav.getBoundingClientRect();
  const icon = bundleFiltersNav.querySelector('.nav-customise-icon');
  const iconRect = icon ? icon.getBoundingClientRect() : btnRect;
  const header = document.querySelector('.mobile-header');
  const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const gutter = 14;
  const labelRoom = 18;
  const reach = 1.82;
  const topLimit = headerBottom + gutter;
  const bottomLimit = navRect.top - gutter;
  const availH = Math.max(0, bottomLimit - topLimit);
  const availW = Math.max(0, window.innerWidth - gutter * 2);
  const factor = reach + 0.5;
  let plate = Math.min(availW / 2 / factor, (availH - labelRoom) / (2 * factor));
  if (!Number.isFinite(plate) || plate <= 0) plate = 56;
  plate = Math.min(70, plate);
  const hub = Math.min(64, Math.max(48, plate * 0.78));
  bundleRadialAnchor.style.setProperty('--radial-plate', `${plate}px`);
  bundleRadialAnchor.style.setProperty('--radial-hub', `${hub}px`);
  bundleRadialAnchor.style.setProperty('--radial-reach', String(reach));
  bundleRadialAnchor.style.setProperty('--radial-diag', String(reach / Math.SQRT2));
  const side = plate * factor;
  const bottomExtent = side + labelRoom;
  const minX = gutter + side;
  const maxX = window.innerWidth - gutter - side;
  const centerX = Math.min(Math.max(btnRect.left + btnRect.width / 2, minX), maxX);
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
  bundleRadial?.classList.remove('is-returning');
  bundleRadial?.classList.remove('is-tucked');
  bundleRadialAnchor?.classList.remove('is-dropping');
  bundleRadialAnchor?.classList.remove('is-open');
  if (bundleRadialAnchor) bundleRadialAnchor.inert = true;
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
    if (hubAlreadyCentered) bundleRadial?.classList.add('show');
    else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!radialOpen) return;
          bundleRadial?.classList.add('show');
          bundleRadialAnchor?.classList.add('show');
        });
      });
    }
  } else if (bundleRadial?.classList.contains('show')) {
    bundleRadial?.classList.add('is-returning');
    bundleRadial?.classList.remove('show');
    bundleRadial?.setAttribute('aria-hidden', 'true');
    if (bundleRadial) bundleRadial.inert = true;
    const lastCircle = bundleRadial?.querySelector('.bundle-radial-item');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    radialMotionStop = whenRadialSettles(lastCircle, 'transform', reduce ? 80 : 1600, () => {
      if (radialOpen) return;
      bundleRadial?.classList.add('is-tucked');
      bundleRadial?.classList.remove('is-returning');
      dropHubBehindFilters();
    });
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

bundleFiltersNav?.addEventListener('click', () => {
  if (radialSheetOpen()) closeRadialSheet(false);
  toggleRadial();
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
renderShop();
void refreshBasket();
