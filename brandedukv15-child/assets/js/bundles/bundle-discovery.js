/**
 * Smart Bundle Discovery.
 * One catalogue, filtered in place. Logistics is classified only as
 * Warehouse & Logistics. Team size is people, not garment count.
 * Offer price is bundlePrice only. A null price is not a budget-band match.
 */
(function (window, document) {
  'use strict';

  var INDUSTRIES = [
    { id: 'construction-trades', label: 'Construction & Trades' },
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'hospitality', label: 'Hospitality' },
    { id: 'corporate-office', label: 'Corporate & Office' },
    { id: 'sport-fitness', label: 'Sport & Fitness' },
    { id: 'education-leavers', label: 'Education & Leavers' },
    { id: 'warehouse-logistics', label: 'Warehouse & Logistics' },
    { id: 'film-media', label: 'Film & Media' },
    { id: 'healthcare', label: 'Healthcare' },
    { id: 'events-promotions', label: 'Events & Promotions' },
    { id: 'other', label: 'Other' }
  ];

  var TEAM_SIZES = ['1', '2', '3', '5', '8', '10', '15', '20', '25', '30', '50+'];

  var BUDGETS = [
    { id: 'any', label: 'Any' },
    { id: 'under-100', label: 'Under £100' },
    { id: '100-250', label: '£100–£250' },
    { id: '250-500', label: '£250–£500' },
    { id: '500-1000', label: '£500–£1,000' },
    { id: '1000-plus', label: '£1,000+' }
  ];

  var CLOTHING = [
    { id: 'polos', label: 'Polos' },
    { id: 'tshirts', label: 'T-shirts' },
    { id: 'hoodies', label: 'Hoodies' },
    { id: 'hivis', label: 'Hi-Vis' },
    { id: 'jackets', label: 'Jackets' },
    { id: 'mixed', label: 'Mixed' }
  ];

  var PURPOSES = [
    { id: 'full-team', label: 'Full Team Uniforms' },
    { id: 'new-starter', label: 'New Starter Kits' },
    { id: 'replacements', label: 'Uniform Replacements' },
    { id: 'complete-kits', label: 'Complete Workwear Kits' },
    { id: 'refresh', label: 'Staff Uniform Refresh' },
    { id: 'events', label: 'Events & Promotions' }
  ];

  var QUANTITY = [
    { id: '6-10', label: '6–10', min: 6, max: 10 },
    { id: '11-20', label: '11–20', min: 11, max: 20 },
    { id: '21-50', label: '21–50', min: 21, max: 50 },
    { id: '51-100', label: '51–100', min: 51, max: 100 },
    { id: '100-plus', label: '100+', min: 101, max: Infinity }
  ];

  var SEASONS = [
    { id: 'summer', label: 'Summer' },
    { id: 'winter', label: 'Winter' },
    { id: 'all-year', label: 'All-Year' }
  ];

  var BRANDING = [
    { id: 'print', label: 'Printing' },
    { id: 'embroidery', label: 'Embroidery' },
    { id: 'mixed', label: 'Mixed' }
  ];

  var CATEGORIES = [
    { id: 'industry', title: 'By Industry', subtitle: 'Your business sector', question: 'What industry are you in?', icon: 'industry' },
    { id: 'team', title: 'By Team Size', subtitle: '1 to 50+ people', question: 'How many people are you buying for?', icon: 'team', hint: 'This is the number of people, not the number of garments in the bundle.' },
    { id: 'budget', title: 'By Budget', subtitle: 'Find your price range', question: 'Budget for the complete order', icon: 'budget', hint: 'Matched on the bundle offer price only.' },
    { id: 'clothing', title: 'By Clothing Type', subtitle: 'Polos, hoodies & more', question: 'Which clothing type?', icon: 'clothing' },
    { id: 'purpose', title: 'By Purpose', subtitle: 'Starters, replacements', question: 'What do you need uniforms for?', icon: 'purpose' },
    { id: 'quantity', title: 'By Quantity', subtitle: '8, 20, 50+ items', question: 'How many garments are in the bundle?', icon: 'quantity', hint: 'Quantity is the sum of the fixed garment quantities, not the team size.' },
    { id: 'season', title: 'By Season', subtitle: 'Summer, winter', question: 'Which season?', icon: 'season' },
    { id: 'branding', title: 'By Branding', subtitle: 'Print or embroidery', question: 'Which branding method?', icon: 'branding', hint: 'Embroidery is listed only when the bundle logo method is embroidery.' }
  ];

  var ICONS = {
    industry: '<path d="M4 16.5v-1a8 8 0 0 1 16 0v1"/><path d="M3 16.5h18v2H3z"/><path d="M12 5.5v2"/>',
    team: '<circle cx="9" cy="8" r="2.2"/><circle cx="16.5" cy="9" r="1.7"/><path d="M4.2 18.5c.5-2.6 2.5-4 4.8-4s4.3 1.4 4.8 4"/><path d="M14 14.8c1.5-.5 3.2 0 4.2 2"/>',
    budget: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M16 14h2"/>',
    clothing: '<path d="M8.5 6.5 4.5 9l1.8 2.2L8.5 10v9h7v-9l2.2 1.2L19.5 9l-4-2.5-1.5 1.6a2.2 2.2 0 0 1-3.9 0L8.5 6.5z"/>',
    purpose: '<path d="M12 3.5 20 8 12 12.5 4 8 12 3.5z"/><path d="M4 8v8.5L12 21l8-4.5V8"/><path d="M12 12.5V21"/>',
    quantity: '<path d="M12 4 20.5 8.5 12 13 3.5 8.5 12 4z"/><path d="M3.5 12.5 12 17l8.5-4.5"/><path d="M3.5 16 12 20.5 20.5 16"/>',
    season: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7 5.6 18.4"/>',
    branding: '<path d="M9 13V8.2a3 3 0 0 1 6 0V13"/><path d="M7 13h10v3.2H7z"/><path d="M5 19.5h14"/>',
    sliders: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.2"/><circle cx="15" cy="17" r="2.2"/>',
    check: '<path d="M5 12.5 9.2 17 19 7"/>',
    back: '<path d="M14.5 6 8.5 12l6 6"/>',
    next: '<path d="M9.5 6 15.5 12l-6 6"/>'
  };

  var root = null;
  var state = {
    view: 'home',
    category: '',
    picks: {},
    wizard: { step: 1, industry: '', teamSize: '', purpose: '', budget: '' },
    resultsFrom: '',
    resultsMode: 'strict',
    filters: {}
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function icon(name, className) {
    return '<svg class="' + (className || 'bd-icon') + '" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }

  function labelOf(list, id) {
    var row = list.filter(function (item) { return item.id === id; })[0];
    return row ? row.label : '';
  }

  function categoryById(id) {
    return CATEGORIES.filter(function (item) { return item.id === id; })[0] || null;
  }

  function isPreview(item) {
    return /preview/i.test(String(item.bundleId || '')) || /preview/i.test(String(item.bundleName || ''));
  }

  function liveBundles() {
    var source = window.BrandedBundleConfig;
    var list = source && Array.isArray(source.bundles) ? source.bundles : [];
    return list.filter(function (item) {
      return item && item.activeStatus === true && !isPreview(item);
    });
  }

  function priceOf(bundle) {
    if (!bundle || bundle.bundlePrice == null || bundle.bundlePrice === '') return null;
    var price = Number(bundle.bundlePrice);
    return isFinite(price) ? price : null;
  }

  function garmentCount(bundle) {
    var total = 0;
    (bundle.groups || []).forEach(function (group) {
      if (String(group.selectionMode || '').toUpperCase() !== 'FIXED') return;
      (group.options || []).forEach(function (option) {
        var qty = Number(option.quantity);
        if (isFinite(qty) && qty > 0) total += qty;
      });
    });
    return total;
  }

  function brandingIds(bundle) {
    var method = String(bundle && bundle.logoMethod || '').toLowerCase();
    if (method === 'dtf' || method === 'print' || method === 'screen' || method === 'screen-print' || method === 'screenprint') return ['print'];
    if (method === 'embroidery') return ['embroidery'];
    if (method === 'mixed') return ['mixed'];
    return [];
  }

  function brandingLabel(bundle) {
    var method = String(bundle && bundle.logoMethod || '').toLowerCase();
    if (method === 'dtf') return 'DTF print';
    if (method === 'print' || method === 'screen' || method === 'screen-print' || method === 'screenprint') return 'Printing';
    if (method === 'embroidery') return 'Embroidery';
    if (method === 'mixed') return 'Mixed branding';
    return '';
  }

  function textList(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(function (item) { return item != null && String(item) !== ''; }).map(function (item) { return String(item); });
  }

  function classify(bundle) {
    var id = String(bundle.bundleId || bundle.bundleSlug || '').toLowerCase();
    var price = priceOf(bundle);
    var quantity = garmentCount(bundle);
    var branding = brandingIds(bundle);
    if (id === 'logistics') {
      return {
        industries: ['warehouse-logistics'],
        teamSizes: [],
        purposes: [],
        clothing: [],
        seasons: [],
        branding: branding,
        quantity: quantity,
        price: price
      };
    }
    return {
      industries: textList(bundle.industries),
      teamSizes: textList(bundle.teamSizes),
      purposes: textList(bundle.purposes),
      clothing: textList(bundle.clothingTypes),
      seasons: textList(bundle.seasons),
      branding: branding,
      quantity: quantity,
      price: price
    };
  }

  function budgetMatches(price, band) {
    if (!band || band === 'any') return true;
    if (price == null) return false;
    if (band === 'under-100') return price < 100;
    if (band === '100-250') return price >= 100 && price <= 250;
    if (band === '250-500') return price >= 250 && price <= 500;
    if (band === '500-1000') return price >= 500 && price <= 1000;
    if (band === '1000-plus') return price >= 1000;
    return false;
  }

  function quantityMatches(count, band) {
    var row = QUANTITY.filter(function (item) { return item.id === band; })[0];
    if (!row) return false;
    return count >= row.min && count <= row.max;
  }

  function listHit(list, value, mode) {
    if (list.indexOf(value) !== -1) return true;
    return mode === 'wizard' && list.length === 0;
  }

  function matches(bundle, filters, mode) {
    var info = classify(bundle);
    if (filters.industry && info.industries.indexOf(filters.industry) === -1) return false;
    if (filters.budget && !budgetMatches(info.price, filters.budget)) return false;
    if (filters.clothing && info.clothing.indexOf(filters.clothing) === -1) return false;
    if (filters.quantity && !quantityMatches(info.quantity, filters.quantity)) return false;
    if (filters.season && info.seasons.indexOf(filters.season) === -1) return false;
    if (filters.branding && info.branding.indexOf(filters.branding) === -1) return false;
    if (filters.teamSize && !listHit(info.teamSizes, String(filters.teamSize), mode)) return false;
    if (filters.purpose && !listHit(info.purposes, filters.purpose, mode)) return false;
    return true;
  }

  function resultsFor(filters, mode) {
    return liveBundles().filter(function (bundle) { return matches(bundle, filters, mode); });
  }

  function peopleLabel(size) {
    if (size === '1') return '1 person';
    if (size === '50+') return '50+ people';
    return size + ' people';
  }

  function priceLabel(bundle) {
    var price = priceOf(bundle);
    if (price == null) return 'Price not set';
    var formatted;
    try {
      formatted = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: bundle.currency || 'GBP'
      }).format(price);
    } catch (error) {
      formatted = String(price);
    }
    return formatted + (bundle.vatExcluded ? ' exc. VAT' : '');
  }

  function builderHref(bundle) {
    var id = bundle.bundleSlug || bundle.bundleId || '';
    return '/bundles.html?force=mobile&bundle=' + encodeURIComponent(id);
  }

  function choiceHtml(group, item, selected, radio) {
    var cls = 'bd-choice' + (radio ? ' bd-choice--radio' : '') + (selected ? ' is-selected' : '');
    var mark = radio ? '<span class="bd-radio-mark" aria-hidden="true"></span>' : '';
    return '<button type="button" class="' + cls + '" data-bd-action="pick" data-group="' + esc(group) + '" data-value="' + esc(item.id) + '" aria-pressed="' + (selected ? 'true' : 'false') + '">' + mark + esc(item.label) + '</button>';
  }

  function sizeHtml(group, size, selected) {
    return '<button type="button" class="bd-size' + (selected ? ' is-selected' : '') + '" data-bd-action="pick" data-group="' + esc(group) + '" data-value="' + esc(size) + '" aria-pressed="' + (selected ? 'true' : 'false') + '">' + esc(size) + '</button>';
  }

  function teamBlock(size) {
    if (!size) return '';
    return '<div class="bd-team-summary"><div><strong>Team of ' + esc(size) + '</strong><p>Show bundles suitable for ' + esc(peopleLabel(size)) + ', based on their fixed garment compositions.</p></div><span class="bd-team-icon">' + icon('team') + '</span></div>';
  }

  function sizesHtml(group, selected) {
    return '<div class="bd-sizes">' + TEAM_SIZES.map(function (size) {
      return sizeHtml(group, size, selected === size);
    }).join('') + '</div>' + teamBlock(selected);
  }

  function optionsHtml(category, group, selected) {
    if (category === 'team') return sizesHtml(group, selected);
    var list = category === 'industry' ? INDUSTRIES
      : category === 'budget' ? BUDGETS
      : category === 'clothing' ? CLOTHING
      : category === 'purpose' ? PURPOSES
      : category === 'quantity' ? QUANTITY
      : category === 'season' ? SEASONS
      : BRANDING;
    var radio = category === 'purpose';
    return '<div class="bd-options">' + list.map(function (item) {
      return choiceHtml(group, item, selected === item.id, radio);
    }).join('') + '</div>';
  }

  function stepsHtml() {
    var html = '';
    var step = state.wizard.step;
    for (var n = 1; n <= 5; n += 1) {
      var cls = 'bd-step';
      var inner = String(n);
      var disabled = n > step ? ' disabled' : '';
      if (n === step) cls += ' is-current';
      else if (n < step) {
        cls += ' is-done';
        inner = icon('check');
      }
      html += '<button type="button" class="' + cls + '" data-bd-action="wizard-goto" data-step="' + n + '"' + disabled + (n === step ? ' aria-current="step"' : '') + ' aria-label="Step ' + n + (n < step ? ', done' : '') + '">' + inner + '</button>';
      if (n < 5) html += '<span class="bd-step-line' + (n < step ? ' is-done' : '') + '"></span>';
    }
    return '<div class="bd-steps" aria-label="Find My Bundle progress">' + html + '</div>';
  }

  function wizardQuestion() {
    var step = state.wizard.step;
    if (step === 1) return 'What industry are you in?';
    if (step === 2) return 'How many people are you buying for?';
    if (step === 3) return 'What do you need uniforms for?';
    if (step === 4) return 'Budget for the complete order';
    return 'Review';
  }

  function wizardBody() {
    var wizard = state.wizard;
    if (wizard.step === 1) return optionsHtml('industry', 'wizard-industry', wizard.industry);
    if (wizard.step === 2) {
      return '<p class="bd-hint">This is the number of people, not the number of garments in the bundle.</p>' + sizesHtml('wizard-team', wizard.teamSize);
    }
    if (wizard.step === 3) return optionsHtml('purpose', 'wizard-purpose', wizard.purpose);
    if (wizard.step === 4) return optionsHtml('budget', 'wizard-budget', wizard.budget);
    var rows = [
      ['Industry', labelOf(INDUSTRIES, wizard.industry)],
      ['Team size', wizard.teamSize ? 'Team of ' + wizard.teamSize : ''],
      ['Purpose', labelOf(PURPOSES, wizard.purpose)],
      ['Budget', labelOf(BUDGETS, wizard.budget)]
    ];
    return '<div class="bd-review">' + rows.map(function (row) {
      return '<div class="bd-review-row"><span>' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong></div>';
    }).join('') + '</div>';
  }

  function wizardReady() {
    var wizard = state.wizard;
    if (wizard.step === 1) return !!wizard.industry;
    if (wizard.step === 2) return !!wizard.teamSize;
    if (wizard.step === 3) return !!wizard.purpose;
    if (wizard.step === 4) return !!wizard.budget;
    return !!(wizard.industry && wizard.teamSize && wizard.purpose && wizard.budget);
  }

  function homeHtml() {
    var cards = CATEGORIES.map(function (item) {
      return '<button type="button" class="bd-cat" data-bd-action="category" data-category="' + item.id + '"><span class="bd-cat-icon">' + icon(item.icon) + '</span><span class="bd-cat-title">' + esc(item.title) + '</span><span class="bd-cat-sub">' + esc(item.subtitle) + '</span></button>';
    }).join('');
    return '<section class="bd-hero"><h1>Workwear Bundle Deals</h1><p>Complete uniform packages for your business.</p></section>' +
      '<h2 class="bd-home-title">Find your perfect bundle</h2>' +
      '<div class="bd-grid">' + cards + '</div>' +
      '<button type="button" class="bd-wizard-entry" data-bd-action="wizard"><span class="bd-wizard-mark">' + icon('sliders') + '</span><span class="bd-wizard-copy"><span class="bd-cat-title">Find My Bundle</span><span class="bd-cat-sub">Industry, team, purpose and budget</span></span>' + icon('next', 'bd-chevron') + '</button>';
  }

  function selectHtml() {
    var category = categoryById(state.category);
    if (!category) return homeHtml();
    var selected = state.picks[category.id] || '';
    var hint = category.hint ? '<p class="bd-hint">' + esc(category.hint) + '</p>' : '';
    return backHtml() + '<div class="bd-panel"><h2>' + esc(category.question) + '</h2>' + hint +
      optionsHtml(category.id, category.id, selected) +
      '<button type="button" class="bd-btn" data-bd-action="find"' + (selected ? '' : ' disabled') + '>Find Bundles</button></div>';
  }

  function wizardHtml() {
    var step = state.wizard.step;
    var label = step === 5 ? 'Find Matching Bundles' : 'Continue';
    var action = step === 5 ? 'wizard-find' : 'wizard-next';
    var hint = step === 2 ? '' : '';
    return backHtml() + '<div class="bd-panel"><div class="bd-wizard-head"><span class="bd-wizard-mark">' + icon('sliders') + '</span>Find My Bundle</div>' +
      stepsHtml() + '<h2>' + esc(wizardQuestion()) + '</h2>' + hint + wizardBody() +
      '<button type="button" class="bd-btn" data-bd-action="' + action + '"' + (wizardReady() ? '' : ' disabled') + '>' + label + '</button></div>';
  }

  function backHtml() {
    return '<button type="button" class="bd-back" data-bd-action="back">' + icon('back') + 'Back</button>';
  }

  function gapNote(bundles) {
    if (state.resultsMode !== 'wizard' || !bundles.length) return '';
    var team = false;
    var purpose = false;
    bundles.forEach(function (bundle) {
      var info = classify(bundle);
      if (state.filters.teamSize && info.teamSizes.indexOf(String(state.filters.teamSize)) === -1) team = true;
      if (state.filters.purpose && info.purposes.indexOf(state.filters.purpose) === -1) purpose = true;
    });
    if (team && purpose) return 'Team size and purpose are not recorded on this bundle, so this is not a match for those.';
    if (team) return 'Team size is not recorded on this bundle, so this is not a match for team size.';
    if (purpose) return 'Purpose is not recorded on this bundle, so this is not a match for purpose.';
    return '';
  }

  function queryParts(bundles) {
    var filters = state.filters;
    var parts = [];
    var wizardHit = state.resultsMode === 'wizard' && bundles.length > 0;
    if (filters.industry) parts.push(labelOf(INDUSTRIES, filters.industry));
    if (filters.teamSize && !wizardHit) parts.push(peopleLabel(filters.teamSize));
    if (filters.purpose && !wizardHit) parts.push(labelOf(PURPOSES, filters.purpose));
    if (filters.budget) parts.push(labelOf(BUDGETS, filters.budget));
    if (filters.clothing) parts.push(labelOf(CLOTHING, filters.clothing));
    if (filters.quantity) parts.push(labelOf(QUANTITY, filters.quantity));
    if (filters.season) parts.push(labelOf(SEASONS, filters.season));
    if (filters.branding) parts.push(labelOf(BRANDING, filters.branding));
    return parts;
  }

  function cardHtml(bundle) {
    var info = classify(bundle);
    var industries = info.industries.map(function (id) { return labelOf(INDUSTRIES, id); }).filter(Boolean);
    var brand = brandingLabel(bundle);
    var metas = [];
    if (industries.length) metas.push(industries.join(', '));
    if (info.quantity > 0) metas.push(info.quantity === 1 ? '1 garment' : info.quantity + ' garments');
    if (brand) metas.push(brand);
    var metaHtml = metas.length ? '<div class="bd-meta">' + metas.map(function (item) {
      return '<span>' + esc(item) + '</span>';
    }).join('') + '</div>' : '';
    var unset = info.price == null;
    return '<article class="bd-result" data-bd-bundle="' + esc(bundle.bundleId) + '" data-bd-industry="' + esc(info.industries.join(' ')) + '" data-bd-price="' + (unset ? 'unset' : String(info.price)) + '" data-bd-garments="' + info.quantity + '" data-bd-branding="' + esc(info.branding.join(' ')) + '" data-bd-team="" data-bd-purpose="">' +
      '<h3>' + esc(bundle.bundleName || '') + '</h3>' +
      (bundle.bundleDescription ? '<p class="bd-desc">' + esc(bundle.bundleDescription) + '</p>' : '') +
      metaHtml +
      '<p class="bd-price' + (unset ? ' is-unset' : '') + '">' + esc(priceLabel(bundle)) + '</p>' +
      '<a class="bd-btn" href="' + esc(builderHref(bundle)) + '">Build Your Bundle</a></article>';
  }

  function resultsHtml() {
    var bundles = resultsFor(state.filters, state.resultsMode);
    var parts = queryParts(bundles);
    var query = parts.length ? '<p class="bd-query">' + esc(parts.join(' · ')) + '</p>' : '';
    var note = gapNote(bundles);
    var noteHtml = note ? '<p class="bd-note">' + esc(note) + '</p>' : '';
    var body;
    if (!bundles.length) {
      body = '<div class="bd-empty" data-bd-count="0"><h2>No exact matches</h2><p>No live bundle is classified for these filters.</p></div>';
    } else {
      body = '<h2 class="bd-results-title">Matching bundles</h2>' + noteHtml + bundles.map(cardHtml).join('');
    }
    return backHtml() + '<div id="bdResults" data-bd-count="' + bundles.length + '" data-bd-ids="' + esc(bundles.map(function (item) { return item.bundleId; }).join(' ')) + '">' + query + body + '</div>';
  }

  function render() {
    var view = state.view;
    var html = view === 'select' ? selectHtml() : view === 'wizard' ? wizardHtml() : view === 'results' ? resultsHtml() : homeHtml();
    root.innerHTML = html;
    root.setAttribute('data-bd-view', view);
    if (view === 'select') root.setAttribute('data-bd-category', state.category);
    else root.removeAttribute('data-bd-category');
    if (view === 'wizard') root.setAttribute('data-bd-step', String(state.wizard.step));
    else root.removeAttribute('data-bd-step');
  }

  function paint() {
    var y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  function reveal() {
    var header = document.querySelector('.mobile-chrome-header');
    var offset = 8;
    if (header && window.getComputedStyle(header).display !== 'none') {
      offset = Math.round(header.getBoundingClientRect().height) + 8;
    }
    var top = root.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo(0, top > 0 ? top : 0);
  }

  function show(view) {
    state.view = view;
    render();
    reveal();
  }

  function categoryFilters(category, value) {
    var filters = {};
    if (category === 'industry') filters.industry = value;
    if (category === 'team') filters.teamSize = value;
    if (category === 'budget') filters.budget = value;
    if (category === 'clothing') filters.clothing = value;
    if (category === 'purpose') filters.purpose = value;
    if (category === 'quantity') filters.quantity = value;
    if (category === 'season') filters.season = value;
    if (category === 'branding') filters.branding = value;
    return filters;
  }

  function onClick(event) {
    var el = event.target.closest('[data-bd-action]');
    if (!el || !root.contains(el)) return;
    var action = el.getAttribute('data-bd-action');
    if (action === 'category') {
      state.category = el.getAttribute('data-category') || '';
      show('select');
      return;
    }
    if (action === 'wizard') {
      state.wizard.step = 1;
      show('wizard');
      return;
    }
    if (action === 'pick') {
      var group = el.getAttribute('data-group') || '';
      var value = el.getAttribute('data-value') || '';
      if (group === 'wizard-industry') state.wizard.industry = value;
      else if (group === 'wizard-team') state.wizard.teamSize = value;
      else if (group === 'wizard-purpose') state.wizard.purpose = value;
      else if (group === 'wizard-budget') state.wizard.budget = value;
      else state.picks[group] = value;
      paint();
      return;
    }
    if (action === 'find') {
      var picked = state.picks[state.category];
      if (!picked) return;
      state.resultsFrom = 'category';
      state.resultsMode = 'strict';
      state.filters = categoryFilters(state.category, picked);
      show('results');
      return;
    }
    if (action === 'wizard-next') {
      if (!wizardReady() || state.wizard.step >= 5) return;
      state.wizard.step += 1;
      show('wizard');
      return;
    }
    if (action === 'wizard-goto') {
      var step = Number(el.getAttribute('data-step'));
      if (!step || step >= state.wizard.step) return;
      state.wizard.step = step;
      show('wizard');
      return;
    }
    if (action === 'wizard-find') {
      if (!wizardReady()) return;
      state.resultsFrom = 'wizard';
      state.resultsMode = 'wizard';
      state.filters = {
        industry: state.wizard.industry,
        teamSize: state.wizard.teamSize,
        purpose: state.wizard.purpose,
        budget: state.wizard.budget
      };
      show('results');
      return;
    }
    if (action === 'back') {
      if (state.view === 'results') {
        if (state.resultsFrom === 'wizard') {
          state.wizard.step = 5;
          show('wizard');
        } else show('select');
        return;
      }
      if (state.view === 'wizard' && state.wizard.step > 1) {
        state.wizard.step -= 1;
        show('wizard');
        return;
      }
      show('home');
    }
  }

  function init() {
    root = document.getElementById('bundleDiscovery');
    if (!root || root.getAttribute('data-bd-ready') === '1') return;
    root.setAttribute('data-bd-ready', '1');
    root.addEventListener('click', onClick);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
