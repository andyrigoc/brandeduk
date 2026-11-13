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

const BUNDLE_CATEGORIES = {
  all: { label: 'All' },
  tshirts: { label: 'T-Shirts', types: ['t-shirts'] },
  polo: { label: 'Polo Shirts', types: ['polos'] },
  hoodies: { label: 'Hoodies & Sweatshirts', types: ['hoodies', 'sweatshirts'] },
  jackets: { label: 'Jackets & Softshell', types: ['jackets'] },
  hivis: { label: 'Hi-Vis', types: ['safety-vests'], feature: 'high-visibility' },
  ppe: { label: 'PPE & Safety Wear', sector: 'safety' },
  trousers: { label: 'Work Trousers', types: ['trousers'] },
  fleeces: { label: 'Fleeces', types: ['fleece'] },
  bags: { label: 'Bags', types: ['bags'] },
  caps: { label: 'Caps', types: ['headwear'] },
  beanies: { label: 'Headwear / Accessories', types: ['headwear'] },
  aprons: { label: 'Work & Uniforms', types: ['aprons', 'workwear'] },
  sustainable: { label: 'Sustainable / Recycled & Organic', feature: 'recycled' }
};
let activeCategory = 'all';

function dealMatchesCategory(deal) {
  const category = BUNDLE_CATEGORIES[activeCategory];
  if (!category || activeCategory === 'all') return true;
  const types = facetValues(deal, 'productType');
  if (category.types && types.some(type => category.types.includes(type))) return true;
  if (category.feature && facetValues(deal, 'feature').includes(category.feature)) return true;
  if (category.sector && facetValues(deal, 'sector').includes(category.sector)) return true;
  return false;
}

function renderShop() {
  deals.forEach(deal => offerById.set(deal.id, deal));
  const shown = deals.filter(dealMatchesCategory);
  const count = $('bundle-count');
  if (count) count.textContent = `(${shown.length})`;
  const label = $('activeCatLabel');
  if (label) label.textContent = BUNDLE_CATEGORIES[activeCategory].label;
  $('catalogue-grid').innerHTML = shown.map(deal => {
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
          <button type="button" class="button primary" data-action="open" data-id="${deal.id}" ${build ? '' : 'disabled'}>${build ? `Build bundle ${icon('right')}` : 'Not available'}</button>
        </div>
      </div>
    </article>`;
  }).join('');

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
document.addEventListener('click', event => {
  const menuButton = event.target.closest('#categoryHamburgerBtn');
  if (menuButton) {
    const dropdown = $('categoriesDropdown');
    const open = !dropdown.classList.contains('open');
    dropdown.classList.toggle('open', open);
    menuButton.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    return;
  }
  const card = event.target.closest('.category-filter-card');
  if (!card) return;
  activeCategory = card.dataset.category;
  document.querySelectorAll('.category-filter-card').forEach(item => item.classList.toggle('active', item === card));
  $('categoriesDropdown').classList.remove('open');
  $('categoryHamburgerBtn').classList.remove('open');
  $('categoryHamburgerBtn').setAttribute('aria-expanded', 'false');
  renderShop();
});
renderShop();
void refreshBasket();
