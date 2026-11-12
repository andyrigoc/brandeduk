/**
 * Bundle builder visual layer.
 * Renders whatever groups the config provides. No deal-specific branches.
 * Logo limits match brandedukv15-child/assets/js/upload/logo-upload.js:
 * 25MB, JPG PNG GIF WebP SVG PDF AI EPS, one file for the whole bundle.
 */
(function (window, document) {
  'use strict';

  var MAX_FILE_BYTES = 25 * 1024 * 1024;
  var FILE_ACCEPT = 'image/*,.pdf,.ai,.svg,.eps';
  var FILE_TYPES = 'JPG, PNG, GIF, WebP, SVG, PDF, AI, EPS';
  var root = null;
  var bundle = null;
  var state = null;
  var logoPreviewUrl = '';
  var logoPreviewOwned = false;
  var logoSave = Promise.resolve();

  function configBundles() {
    var source = window.BrandedBundleConfig;
    var list = source && Array.isArray(source.bundles) ? source.bundles : [];
    return list.filter(function (item) { return item && item.activeStatus === true; });
  }

  function findBundle(idOrSlug) {
    var key = String(idOrSlug || '');
    return configBundles().filter(function (item) {
      return item.bundleId === key || item.bundleSlug === key;
    })[0] || null;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cssAttr(value) {
    return String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function coloursOf(option) {
    if (Array.isArray(option.colours) && option.colours.length) return option.colours;
    if (option && option.productCode) return [];
    return [{ colourId: 'colour', label: 'Colour', hex: '#d5d8e0' }];
  }

  function sizesOf(option) {
    if (Array.isArray(option.sizes) && option.sizes.length) return option.sizes;
    if (option && option.productCode) return [];
    return ['One size'];
  }

  function blankLine(option, colourId) {
    var colours = coloursOf(option);
    var preferred = preferredColour(option, colours);
    var sizes = {};
    sizesOf(option).forEach(function (size) { sizes[size] = 0; });
    return {
      colourId: colourId || (preferred && preferred.colourId) || (colours[0] && colours[0].colourId) || '',
      sizes: sizes
    };
  }

  var catalogueRequest = 0;

  function isCatalogueBundle(item) {
    return (item && item.groups || []).some(function (group) {
      return (group.options || []).some(function (option) { return option.productCode; });
    });
  }

  function apiBase() {
    var base = '';
    if (typeof window.resolveBrandedApiBase === 'function') base = window.resolveBrandedApiBase();
    else if (window.API_BASE_URL) base = window.API_BASE_URL;
    return String(base || '').replace(/\/+$/, '');
  }

  function colourKey(name) {
    return String(name || '').toLowerCase().replace(/[*†△®™]/g, '').replace(/\s+/g, ' ').trim();
  }

  function colourIdFor(name, used) {
    var id = colourKey(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'colour';
    var unique = id;
    var n = 2;
    while (used[unique]) {
      unique = id + '-' + n;
      n += 1;
    }
    used[unique] = true;
    return unique;
  }

  function preferredColour(option, colours) {
    var list = colours || [];
    var want = colourKey(option && option.preferredColour);
    if (!want) return list[0] || null;
    return list.filter(function (colour) { return colourKey(colour.label) === want; })[0] || list[0] || null;
  }

  function mapCatalogueColours(product) {
    var used = {};
    return (product.colors || []).filter(function (color) {
      return color && colourKey(color.name) && colourKey(color.name) !== 'model';
    }).map(function (color) {
      return {
        colourId: colourIdFor(color.name, used),
        label: String(color.name),
        image: color.main || color.thumb || color.image_url || '',
        thumb: color.thumb || color.main || color.image_url || ''
      };
    });
  }

  function firstProductImage(product) {
    var images = product.images || [];
    var main = images.filter(function (img) { return img && img.url && img.type === 'main'; })[0]
      || images.filter(function (img) { return img && img.url; })[0];
    return (main && main.url) || product.image || '';
  }

  function isLifestyleUrl(url) {
    return /(?:^|\/)model[-_]|_ls00|lifestyle|model-highres/i.test(String(url || ''));
  }

  function catalogueDefaultImage(product) {
    var colors = (product && product.colors) || [];
    var i;
    for (i = 0; i < colors.length; i++) {
      var color = colors[i];
      if (!color || colourKey(color.name) === 'model') continue;
      var url = color.main || color.thumb || color.image_url || '';
      if (url && !isLifestyleUrl(url)) return url;
    }
    var listed = (product && (product.image || product.main_image)) || '';
    if (listed && !isLifestyleUrl(listed)) return listed;
    var images = (product && product.images) || [];
    var main = images.filter(function (img) {
      return img && img.url && img.type === 'main' && !isLifestyleUrl(img.url);
    })[0];
    if (main && main.url) return main.url;
    for (i = 0; i < colors.length; i++) {
      var fallbackColor = colors[i];
      if (!fallbackColor || colourKey(fallbackColor.name) === 'model') continue;
      var anyUrl = fallbackColor.main || fallbackColor.thumb || fallbackColor.image_url || '';
      if (anyUrl) return anyUrl;
    }
    return firstProductImage(product || {});
  }

  function colourPhoto(colour) {
    if (!colour) return '';
    return colour.image || colour.thumb || '';
  }

  function photoFor(option, colour) {
    var selected = colourPhoto(colour);
    if (selected) return selected;
    if (!option) return '';
    return option.fallbackImage || option.image || '';
  }

  function activeColour(group, option) {
    if (!state || !group || !option || !state.groups || !state.groups[group.groupId]) return null;
    var bucket = state.groups[group.groupId].options[option.optionId];
    var lines = (bucket && bucket.lines) || [];
    var chosen = null;
    lines.some(function (line) {
      if (lineQty(line) > 0) {
        chosen = line;
        return true;
      }
      return false;
    });
    var line = chosen || lines[0];
    if (!line || !line.colourId) return null;
    return coloursOf(option).filter(function (colour) { return colour.colourId === line.colourId; })[0] || null;
  }

  function applyCatalogueProduct(option, product) {
    if (!product || (!product.name && !product.code)) {
      option.catalogueMissing = true;
      option.label = option.productCode || 'Piece';
      option.colours = [];
      option.sizes = [];
      option.image = '';
      option.fallbackImage = '';
      return;
    }
    option.catalogueMissing = false;
    option.catalogueLoaded = true;
    option.label = product.name || option.productCode;
    option.colours = mapCatalogueColours(product);
    option.sizes = (product.sizes || []).map(function (size) { return String(size); }).filter(Boolean);
    option.fallbackImage = catalogueDefaultImage(product);
    var chosen = preferredColour(option, option.colours);
    option.image = (chosen && (chosen.image || chosen.thumb)) || option.fallbackImage;
  }

  function fetchCatalogueProduct(code) {
    return fetch(apiBase() + '/api/products/' + encodeURIComponent(code)).then(function (response) {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Catalogue request failed (' + response.status + ')');
      return response.json();
    });
  }

  function hydrateCatalogue(target) {
    var options = [];
    (target.groups || []).forEach(function (group) {
      (group.options || []).forEach(function (option) {
        if (option.productCode) options.push(option);
      });
    });
    return Promise.all(options.map(function (option) {
      return fetchCatalogueProduct(option.productCode).then(function (product) {
        applyCatalogueProduct(option, product);
      }).catch(function () {
        option.catalogueMissing = true;
        option.label = option.productCode || 'Piece';
        option.colours = [];
        option.sizes = [];
        option.image = '';
        option.fallbackImage = '';
      });
    })).then(function () {
      target.catalogueStatus = 'ready';
    });
  }

  function lineColour(option, line) {
    if (!line) return coloursOf(option)[0] || null;
    return coloursOf(option).filter(function (colour) { return colour.colourId === line.colourId; })[0]
      || coloursOf(option)[0]
      || null;
  }

  function emptyState(nextBundle) {
    var groups = {};
    (nextBundle.groups || []).forEach(function (group) {
      var options = {};
      (group.options || []).forEach(function (option) {
        options[option.optionId] = { lines: [blankLine(option)] };
      });
      groups[group.groupId] = { selectedOptionId: null, options: options };
    });
    return {
      step: 1,
      reached: 1,
      dirty: false,
      saving: false,
      activeGroupId: (nextBundle.groups && nextBundle.groups[0] && nextBundle.groups[0].groupId) || '',
      groups: groups,
      logo: null,
      notes: '',
      message: '',
      confirm: false,
      scrollPiece: null,
      editingId: ''
    };
  }

  function groupById(id) {
    return (bundle.groups || []).filter(function (group) { return group.groupId === id; })[0] || null;
  }

  function optionById(group, id) {
    return (group.options || []).filter(function (option) { return option.optionId === id; })[0] || null;
  }

  function lineQty(line) {
    return Object.keys(line.sizes || {}).reduce(function (sum, key) {
      return sum + (Number(line.sizes[key]) || 0);
    }, 0);
  }

  function optionQty(group, option) {
    var bucket = state.groups[group.groupId].options[option.optionId];
    return (bucket.lines || []).reduce(function (sum, line) { return sum + lineQty(line); }, 0);
  }

  function effectiveMode(group) {
    var mode = String(group && group.selectionMode || 'EXCLUSIVE').toUpperCase();
    if (mode === 'FIXED') return 'FIXED';
    if (mode === 'FLEXIBLE_MIX' && group.allowMixedOptions === true) return 'FLEXIBLE_MIX';
    return 'EXCLUSIVE';
  }

  function optionCap(group, option) {
    if (effectiveMode(group) === 'FIXED') return Number(option.quantity) || 0;
    return Number(group.requiredQuantity) || 0;
  }

  function groupQty(group) {
    var mode = effectiveMode(group);
    if (mode === 'EXCLUSIVE') {
      var selected = state.groups[group.groupId].selectedOptionId;
      var option = selected ? optionById(group, selected) : null;
      return option ? optionQty(group, option) : 0;
    }
    return (group.options || []).reduce(function (sum, option) {
      return sum + optionQty(group, option);
    }, 0);
  }

  function groupValid(group) {
    var mode = effectiveMode(group);
    var required = Number(group.requiredQuantity) || 0;
    if (mode === 'EXCLUSIVE') {
      var selected = state.groups[group.groupId].selectedOptionId;
      if (!selected) return false;
      return (group.options || []).every(function (option) {
        var qty = optionQty(group, option);
        return option.optionId === selected ? qty === required : qty === 0;
      });
    }
    if (mode === 'FIXED') {
      var eachExact = (group.options || []).every(function (option) {
        return optionQty(group, option) === optionCap(group, option);
      });
      return eachExact && groupQty(group) === required;
    }
    return groupQty(group) === required;
  }

  function allGroupsValid() {
    return (bundle.groups || []).every(groupValid);
  }

  function isDirty() {
    return !!(state && state.dirty);
  }

  function markDirty() {
    if (state) state.dirty = true;
  }

  function canLeaveStep(step) {
    var id = flowSteps()[step - 1];
    if (id === 'Included') return true;
    if (id === 'Groups') return allGroupsValid();
    if (id === 'Products') {
      if (skipGroups()) return allGroupsValid();
      var group = groupById(state.activeGroupId);
      return !!(group && groupValid(group));
    }
    if (id === 'Logo') return canAdd();
    return false;
  }

  function canReach(step) {
    var total = flowSteps().length;
    if (!state || step < 1 || step > total) return false;
    if (!skipGroups()) return true;
    if (step > (state.reached || 1)) return false;
    var index;
    for (index = 1; index < step; index += 1) {
      if (!canLeaveStep(index)) return false;
    }
    return true;
  }

  function modeLine(group) {
    var mode = effectiveMode(group);
    if (mode === 'FIXED') {
      return (group.options || []).map(function (option) {
        return (Number(option.quantity) || 0) + ' ' + (option.label || option.productCode || 'Item');
      }).join(' + ');
    }
    if (mode === 'EXCLUSIVE') {
      return (group.options || []).map(function (option) {
        return (Number(group.requiredQuantity) || 0) + ' ' + option.label;
      }).join(' or ');
    }
    return (Number(group.requiredQuantity) || 0) + ' mixed from ' + (group.options || []).map(function (option) {
      return option.label;
    }).join(', ');
  }

  function modeHint(group) {
    var mode = effectiveMode(group);
    if (mode === 'EXCLUSIVE') return 'Choose one option. Switching clears the other.';
    if (mode === 'FIXED') return 'Each item has an exact quantity. Colours of the same item can be split.';
    return 'These options can be mixed. The group total stays exact.';
  }

  function priceText(amount) {
    if (amount == null || amount === '') return '\u2014';
    var number = Number(amount);
    if (!isFinite(number)) return '\u2014';
    return '\u00a3' + number.toFixed(2);
  }

  function silhouette(kind) {
    var pen = 'fill="none" stroke="#273469" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"';
    if (kind === 'polo') {
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><path ' + pen + ' d="M22 14l10 6 10-6 8 6-6 8v24H20V28l-6-8z"/><path ' + pen + ' d="M27 16c1.5 3 8.5 3 10 0"/></svg>';
    }
    if (kind === 'cap') {
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><path ' + pen + ' d="M14 34c8-14 28-14 36 0"/><path ' + pen + ' d="M12 36h28l10 6H16z"/></svg>';
    }
    if (kind === 'beanie') {
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><path ' + pen + ' d="M18 36c1-14 8-20 14-20s13 6 14 20"/><path ' + pen + ' d="M16 36h32v6c-4 6-28 6-32 0z"/><path ' + pen + ' d="M32 16v-4"/></svg>';
    }
    if (kind === 'hoodie') {
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><path ' + pen + ' d="M24 18c2 6 14 6 16 0 4 2 8 6 8 10l-6 6v16H22V34l-6-6c0-4 4-8 8-10z"/><path ' + pen + ' d="M26 20c2 4 10 4 12 0"/></svg>';
    }
    if (kind === 'sweat') {
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><path ' + pen + ' d="M22 16l10 7 10-7 8 6-5 8v20H19V30l-5-8z"/><path ' + pen + ' d="M22 50h20"/></svg>';
    }
    if (kind === 'jacket') {
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><path ' + pen + ' d="M24 14l8 6 8-6 8 7-5 7v22H21V28l-5-7z"/><path ' + pen + ' d="M32 20v26"/><path ' + pen + ' d="M27 28h5M32 34h5"/></svg>';
    }
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><path ' + pen + ' d="M24 16l8 5 8-5 7 5-4 7v22H21V28l-4-7z"/></svg>';
  }

  function focusKey() {
    var active = document.activeElement;
    if (!active || !root.contains(active)) return '';
    return active.getAttribute('data-bb-focus') || '';
  }

  function restoreFocus(key) {
    if (!key) return;
    var next = root.querySelector('[data-bb-focus="' + key.replace(/"/g, '') + '"]');
    if (!next) return;
    next.focus();
    var length = String(next.value || '').length;
    try { next.setSelectionRange(length, length); } catch (error) { /* number inputs */ }
  }

  function skipGroups() {
    return isCatalogueBundle(bundle);
  }

  function flowSteps() {
    if (skipGroups()) return ['Included', 'Products', 'Logo'];
    return ['Included', 'Groups', 'Products', 'Logo'];
  }

  function stepId(step) {
    return flowSteps()[(step || state.step) - 1] || '';
  }

  function render() {
    var key = focusKey();
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    root.querySelector('.bb__title').textContent = bundle.bundleName || 'Bundle';
    var progress = root.querySelector('#bbProgress');
    progress.style.gridTemplateColumns = 'repeat(' + flowSteps().length + ', minmax(0, 1fr))';
    progress.innerHTML = progressHtml();
    root.querySelector('#bbBody').innerHTML = bodyHtml();
    root.querySelector('#bbFoot').innerHTML = footHtml();
    var confirm = root.querySelector('#bbConfirm');
    confirm.hidden = !state.confirm;
    restoreFocus(key);
    scrollToPiece(consumeScrollPiece());
  }

  function consumeScrollPiece() {
    if (!state || !state.scrollPiece) return null;
    var piece = state.scrollPiece;
    state.scrollPiece = null;
    return piece;
  }

  function scrollToPiece(piece) {
    if (!piece) return;
    var body = root.querySelector('#bbBody');
    if (!body) return;
    var card = null;
    if (piece.productCode) {
      card = body.querySelector('.bb__option[data-product-code="' + cssAttr(piece.productCode) + '"]');
    }
    if (!card && piece.optionId) {
      card = body.querySelector('.bb__option[data-option-id="' + cssAttr(piece.optionId) + '"]');
    }
    if (!card) return;
    card.classList.add('is-jumped');
    var top = card.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8;
    body.scrollTop = top > 0 ? top : 0;
  }

  function progressHtml() {
    var steps = flowSteps();
    return steps.map(function (label, index) {
      var step = index + 1;
      var current = step === state.step;
      var enabled = !state.saving && !current && canReach(step);
      if (!skipGroups()) {
        enabled = !state.saving && !current && !(label === 'Logo' && !allGroupsValid());
      }
      var complete = skipGroups() && !current && step < state.step && canLeaveStep(step);
      var cls = 'bb__step' + (current ? ' is-active' : '') + (complete ? ' is-complete' : '');
      return '<button type="button" class="' + cls + '" data-bb-action="step" data-step="' + step + '"' +
        (current ? ' aria-current="step"' : '') +
        (enabled ? '' : ' disabled') + '>' + step + ' ' + esc(label) + '</button>';
    }).join('');
  }

  function bodyHtml() {
    var id = stepId();
    if (id === 'Included') return stepIncluded();
    if (id === 'Groups') return stepGroups();
    if (id === 'Products') return stepProducts();
    return stepLogo();
  }

  function cataloguePieceCards() {
    var cards = [];
    (bundle.groups || []).forEach(function (group) {
      (group.options || []).forEach(function (option) {
        if (option.catalogueMissing) {
          cards.push('<article data-product-code="' + esc(option.productCode || '') + '"><strong>' + esc(option.productCode || 'Piece') + '</strong><p>Not found in the catalogue.</p></article>');
          return;
        }
        var photo = photoFor(option, activeColour(group, option));
        var img = photo ? '<img src="' + esc(photo) + '" alt="">' : '';
        cards.push('<article class="bb__piece-card" data-product-code="' + esc(option.productCode || '') + '">' + img +
          '<div><strong>' + esc(option.label || option.productCode || '') + '</strong><p>' + esc(option.productCode || '') + '</p></div></article>');
      });
    });
    return cards.join('');
  }

  function stepIncluded() {
    if (bundle.catalogueStatus === 'loading') {
      return '<p class="bb__kicker">What\u2019s included</p><h3>' + esc(bundle.bundleName || 'Bundle') + '</h3>' +
        '<p class="bb__lead">Loading the pieces from the catalogue\u2026</p>';
    }
    var cards = isCatalogueBundle(bundle)
      ? cataloguePieceCards()
      : (bundle.groups || []).map(function (group) {
        return '<article><strong>' + esc(group.groupName) + '</strong><p>' + esc(modeLine(group)) + '. ' + esc(modeHint(group)) + '</p></article>';
      }).join('');
    var logo = bundle.includedLogo
      ? '<article><strong>One logo</strong><p>One file for the whole bundle, DTF, one print colour. The same logo goes on every piece. Notes are optional.</p></article>'
      : '';
    return '<p class="bb__kicker">What\u2019s included</p><h3>Build your bundle</h3>' +
      '<p class="bb__lead">' + esc(bundle.bundleDescription || '') + '</p>' +
      '<div class="bb__include">' + cards + logo + '</div>';
  }

  function stepGroups() {
    var cards = (bundle.groups || []).map(function (group) {
      var qty = groupQty(group);
      var required = Number(group.requiredQuantity) || 0;
      var valid = groupValid(group);
      var countClass = valid ? 'bb__count is-done' : 'bb__count is-short';
      return '<button type="button" class="bb__group' + (valid ? ' is-valid' : '') + '" data-bb-action="open-group" data-group="' + esc(group.groupId) + '">' +
        '<span><strong>' + esc(group.groupName) + '</strong><p>' + esc(modeLine(group)) + '</p></span>' +
        '<span class="' + countClass + '"><b>' + qty + ' / ' + required + '</b><small>selected</small></span></button>';
    }).join('');
    var note = allGroupsValid() ? '' : '<p class="bb__warn">Finish every group before the logo step.</p>';
    return '<p class="bb__kicker">Choose a group</p><h3>' + esc(bundle.bundleName || 'Bundle') + '</h3>' +
      '<div class="bb__groups">' + cards + '</div>' + note;
  }

  function stepProducts() {
    if (bundle.catalogueStatus === 'loading') {
      return '<p class="bb__kicker">Products</p><h3>' + esc(bundle.bundleName || 'Bundle') + '</h3>' +
        '<p class="bb__lead">Loading the pieces from the catalogue\u2026</p>';
    }
    if (skipGroups()) return stepCatalogueProducts();
    var group = groupById(state.activeGroupId) || (bundle.groups || [])[0];
    if (!group) return '<p>This bundle has no groups.</p>';
    var qty = groupQty(group);
    var required = Number(group.requiredQuantity) || 0;
    var options = (group.options || []).map(function (option) {
      return optionCard(group, option);
    }).join('');
    return '<p class="bb__kicker">' + esc(group.groupName) + '</p><h3>' + qty + ' / ' + required + ' selected</h3>' +
      '<p class="bb__lead">' + esc(modeHint(group)) + '</p>' +
      '<div class="bb__options">' + options + '</div>' +
      (state.message ? '<p class="bb__warn">' + esc(state.message) + '</p>' : '');
  }

  function stepCatalogueProducts() {
    var groups = bundle.groups || [];
    var qty = groups.reduce(function (sum, group) { return sum + groupQty(group); }, 0);
    var required = groups.reduce(function (sum, group) { return sum + (Number(group.requiredQuantity) || 0); }, 0);
    var options = groups.map(function (group) {
      return (group.options || []).map(function (option) {
        return optionCard(group, option);
      }).join('');
    }).join('');
    if (!options) return '<p>This bundle has no pieces.</p>';
    var lead = groups.length === 1
      ? modeHint(groups[0])
      : 'Choose a colour and size for each piece.';
    return '<p class="bb__kicker">Products</p><h3>' + qty + ' / ' + required + ' selected</h3>' +
      '<p class="bb__lead">' + esc(lead) + '</p>' +
      '<div class="bb__options">' + options + '</div>' +
      (state.message ? '<p class="bb__warn">' + esc(state.message) + '</p>' : '');
  }

  function optionCard(group, option) {
    if (option.catalogueMissing) {
      return '<article class="bb__option" data-product-code="' + esc(option.productCode || '') + '" data-option-id="' + esc(option.optionId) + '"><h4>' +
        esc(option.productCode || 'Piece') + '</h4><p class="bb__warn">Not found in the catalogue.</p></article>';
    }
    var mode = effectiveMode(group);
    var selected = state.groups[group.groupId].selectedOptionId;
    var active = mode !== 'EXCLUSIVE' || selected === option.optionId;
    var cls = 'bb__option' + (mode === 'EXCLUSIVE' && selected === option.optionId ? ' is-selected' : '') +
      (mode === 'EXCLUSIVE' && selected && selected !== option.optionId ? ' is-off' : '');
    var code = option.productCode ? '<p class="bb__code">' + esc(option.productCode) + '</p>' : '';
    var qty = optionQty(group, option);
    var cap = optionCap(group, option);
    var count = mode === 'FLEXIBLE_MIX' ? String(qty) : (qty + ' / ' + cap);
    var editor = active ? linesHtml(group, option) : '';
    var shownColour = activeColour(group, option);
    var photo = photoFor(option, shownColour);
    var visual = photo
      ? '<img src="' + esc(photo) + '" alt="">'
      : (option.productCode ? '' : silhouette(option.silhouette));
    var colourLine = shownColour && (shownColour.image || shownColour.thumb || option.productCode)
      ? '<p class="bb__code">' + esc(shownColour.label) + '</p>'
      : '';
    var pick = mode === 'EXCLUSIVE'
      ? '<button type="button" class="bb__btn bb__btn--primary bb__pick" data-bb-action="select-option" data-group="' + esc(group.groupId) + '" data-option="' + esc(option.optionId) + '">' +
        (selected === option.optionId ? 'Selected' : 'Choose ' + esc(option.label)) + '</button>'
      : '';
    return '<article class="' + cls + '" data-product-code="' + esc(option.productCode || '') + '" data-option-id="' + esc(option.optionId) + '"><div class="bb__option-top"><div class="bb__sil">' + visual +
      '</div><div><h4>' + esc(option.label) + '</h4>' + code + colourLine + '<p class="bb__code">' + count + '</p></div></div>' +
      pick + editor + '</article>';
  }

  function linesHtml(group, option) {
    var bucket = state.groups[group.groupId].options[option.optionId];
    var colours = coloursOf(option);
    var html = (bucket.lines || []).map(function (line, index) {
      var swatches = colours.map(function (colour) {
        var on = line.colourId === colour.colourId ? ' is-on' : '';
        var photo = colour.thumb || colour.image || '';
        var attrs = ' type="button" class="bb__swatch' + (photo ? ' bb__swatch--photo' : '') + on + '" title="' + esc(colour.label) + '" aria-label="' + esc(colour.label) + '" data-bb-action="colour" data-group="' + esc(group.groupId) + '" data-option="' + esc(option.optionId) + '" data-line="' + index + '" data-colour="' + esc(colour.colourId) + '"';
        if (photo) {
          return '<button' + attrs + '><img src="' + esc(photo) + '" alt=""><span>' + esc(colour.label) + '</span></button>';
        }
        return '<button' + attrs + ' style="background:' + esc(colour.hex || '#ddd') + '"></button>';
      }).join('');
      var sizes = sizesOf(option).map(function (size) {
        var value = Number(line.sizes[size]) || 0;
        var focus = group.groupId + ':' + option.optionId + ':' + index + ':' + size;
        var label = sizesOf(option).length === 1 ? 'Quantity' : size;
        return '<label>' + esc(label) + '<input type="number" min="0" inputmode="numeric" value="' + value + '" data-bb-focus="' + esc(focus) + '" data-bb-qty="1" data-group="' + esc(group.groupId) + '" data-option="' + esc(option.optionId) + '" data-line="' + index + '" data-size="' + esc(size) + '"></label>';
      }).join('');
      var remove = bucket.lines.length > 1
        ? '<button type="button" class="bb__link" data-bb-action="remove-colour" data-group="' + esc(group.groupId) + '" data-option="' + esc(option.optionId) + '" data-line="' + index + '">Remove colour</button>'
        : '';
      return '<div class="bb__line"><div class="bb__colours">' + swatches + '</div><div class="bb__sizes">' + sizes + '</div>' + remove + '</div>';
    }).join('');
    var canAdd = group.allowMultipleColours !== false && bucket.lines.length < colours.length;
    var add = canAdd
      ? '<button type="button" class="bb__link" data-bb-action="add-colour" data-group="' + esc(group.groupId) + '" data-option="' + esc(option.optionId) + '">Add another colour</button>'
      : '';
    return html + add;
  }

  function summaryCountText(qty, required) {
    if (!(Number(required) > 0)) return String(qty);
    return String(qty) + '/' + String(required);
  }

  function logoDetailRows() {
    var rows = [];
    (bundle.groups || []).forEach(function (group) {
      var selected = state.groups[group.groupId].selectedOptionId;
      var mode = effectiveMode(group);
      (group.options || []).forEach(function (option) {
        if (mode === 'EXCLUSIVE' && option.optionId !== selected) return;
        var bucket = state.groups[group.groupId].options[option.optionId];
        var required = optionCap(group, option);
        var productQty = optionQty(group, option);
        if (productQty <= 0) return;
        (bucket.lines || []).forEach(function (line) {
          var colour = coloursOf(option).filter(function (item) { return item.colourId === line.colourId; })[0] || null;
          sizesOf(option).forEach(function (size) {
            var qty = Number(line.sizes && line.sizes[size]) || 0;
            if (qty <= 0) return;
            rows.push({
              groupId: group.groupId,
              optionId: option.optionId,
              productCode: option.productCode || '',
              label: option.label || option.productCode || 'Piece',
              colour: colour ? colour.label : '',
              size: size,
              qty: qty,
              quantity: productQty,
              required: required,
              image: photoFor(option, colour)
            });
          });
        });
      });
    });
    return rows;
  }

  function logoSummaryHtml() {
    return logoDetailRows().map(function (line) {
      var facts = [line.colour, line.size, String(line.qty)].filter(function (part) {
        return part != null && String(part) !== '';
      }).join(' \u00b7 ');
      var photo = line.image
        ? '<img class="bb__summary-photo" src="' + esc(line.image) + '" alt="">'
        : '';
      var required = Number(line.required) || 0;
      var countText = summaryCountText(line.quantity, required);
      var done = required > 0 && Number(line.quantity) === required;
      var countClass = 'bb__summary-count' + (done ? ' is-done' : ' is-short');
      var name = line.label || line.productCode || 'this piece';
      return '<li class="is-jump"><button type="button" class="bb__summary-jump" data-bb-action="edit-piece" data-group="' + esc(line.groupId) + '" data-option="' + esc(line.optionId) + '" data-product="' + esc(line.productCode) + '" aria-label="' + esc('Change ' + name + ', ' + facts + ', ' + countText + ' selected') + '">' +
        photo +
        '<span class="bb__summary-copy"><strong>' + esc(line.label) + '</strong><small>' + esc(facts) + '</small></span>' +
        '<span class="' + countClass + '">' + esc(countText) + '</span></button></li>';
    }).join('');
  }

  function stepLogo() {
    var editable = skipGroups();
    var lines = editable ? logoSummaryHtml() : chosenLines().map(function (line) {
      var detail = line.detail ? '<small style="display:block;color:#5c6578;font-weight:500">' + esc(line.detail) + '</small>' : '';
      return '<li><span>' + esc(line.quantity + ' ' + line.label) + detail + '</span></li>';
    }).join('');
    var logoBlock = '';
    if (bundle.logoUploadEnabled !== false) {
      var preview = '';
      if (state.logo && logoPreviewUrl) {
        preview = '<div class="bb__logo-preview"><img src="' + esc(logoPreviewUrl) + '" alt=""><div><strong>' + esc(state.logo.filename) + '</strong><p>DTF, one print colour. Replacing the file keeps a single logo.</p></div></div>';
      } else if (state.logo && state.logo.filename) {
        preview = '<div class="bb__logo-preview"><div><strong>' + esc(state.logo.filename) + '</strong><p>DTF, one print colour. Replacing the file keeps a single logo.</p></div></div>';
      }
      logoBlock = '<div class="bb__drop" data-bb-drop="1"><strong>One logo for every piece</strong>' +
        '<p>DTF only. One print colour. ' + FILE_TYPES + '. Max 25MB.</p>' +
        '<label class="bb__file">Add logo<input type="file" accept="' + FILE_ACCEPT + '" data-bb-file="1"></label>' +
        preview + '</div>';
    }
    var notes = bundle.customerNotesEnabled === false ? '' :
      '<label><span class="bb__code">Notes, optional</span><textarea class="bb__notes" data-bb-notes="1" data-bb-focus="notes" maxlength="500" placeholder="Anything the team should know. Notes do not add positions.">' + esc(state.notes) + '</textarea></label>';
    var totalHtml = '';
    if (editable) {
      var groups = bundle.groups || [];
      var totalQty = groups.reduce(function (sum, group) { return sum + groupQty(group); }, 0);
      var totalRequired = groups.reduce(function (sum, group) { return sum + (Number(group.requiredQuantity) || 0); }, 0);
      var totalDone = totalRequired > 0 && totalQty === totalRequired;
      var totalClass = totalDone ? ' is-done' : ' is-short';
      totalHtml = '<div class="bb__summary-all' + totalClass + '"><span>Selected</span><span class="bb__summary-count' + totalClass + '">' +
        esc(summaryCountText(totalQty, totalRequired)) + '</span></div>';
    }
    return '<p class="bb__kicker">Logo and summary</p><h3>One logo for every piece</h3>' +
      logoBlock + notes +
      '<div class="bb__summary">' + totalHtml + '<ul>' + lines +
      '<li class="is-price"><span>Bundle price</span><span>' + priceText(bundle.bundlePrice) + '</span></li></ul></div>' +
      (bundle.logoUploadEnabled !== false && !state.logo ? '<p class="bb__warn">Add one logo file before this bundle can go in the basket.</p>' : '') +
      (state.message ? '<p class="bb__warn">' + esc(state.message) + '</p>' : '');
  }

  function footHtml() {
    var back = state.step > 1
      ? '<button type="button" class="bb__btn bb__btn--ghost bb__btn--back" data-bb-action="back"' +
        (state.saving ? ' disabled' : '') + '>Back</button>'
      : '';
    var primary = '<button type="button" class="bb__btn bb__btn--primary" data-bb-action="next"' +
      (primaryDisabled() ? ' disabled' : '') + '>' + esc(primaryLabel()) + '</button>';
    return back + primary;
  }

  function primaryLabel() {
    if (state && state.saving) return 'Saving\u2026';
    var id = stepId();
    if (skipGroups()) {
      if (id === 'Included') return 'Choose colours & sizes';
      if (id === 'Products') return 'Continue to logo';
      if (id === 'Logo') return state.editingId ? 'Save bundle' : 'Add to basket';
    }
    if (id === 'Included') return 'Build your bundle';
    if (id === 'Logo') return 'Add bundle to basket';
    return 'Next';
  }

  function primaryDisabled() {
    if (state && state.saving) return true;
    return !canLeaveStep(state.step);
  }

  function canAdd() {
    if (!allGroupsValid()) return false;
    if (bundle.logoUploadEnabled !== false && !state.logo) return false;
    return true;
  }

  function chosenLines() {
    var rows = [];
    (bundle.groups || []).forEach(function (group) {
      var selected = state.groups[group.groupId].selectedOptionId;
      var mode = effectiveMode(group);
      (group.options || []).forEach(function (option) {
        if (mode === 'EXCLUSIVE' && option.optionId !== selected) return;
        var qty = optionQty(group, option);
        if (qty <= 0) return;
        var bucket = state.groups[group.groupId].options[option.optionId];
        var detail = (bucket.lines || []).map(function (line) {
          var count = lineQty(line);
          if (!count) return '';
          var colour = coloursOf(option).filter(function (item) { return item.colourId === line.colourId; })[0];
          var name = colour ? colour.label : 'Colour';
          var sizes = sizesOf(option);
          if (sizes.length === 1) return name + ' ' + count;
          var bits = sizes.filter(function (size) { return (Number(line.sizes[size]) || 0) > 0; })
            .map(function (size) { return size + ' ' + line.sizes[size]; });
          return name + ' ' + bits.join(', ');
        }).filter(Boolean).join('; ');
        rows.push({
          groupId: group.groupId,
          optionId: option.optionId,
          label: option.label,
          productCode: option.productCode || '',
          quantity: qty,
          required: optionCap(group, option),
          detail: detail
        });
      });
    });
    return rows;
  }

  function selectionPayload() {
    return {
      groups: (bundle.groups || []).map(function (group) {
        var mode = effectiveMode(group);
        var selected = state.groups[group.groupId].selectedOptionId;
        return {
          groupId: group.groupId,
          groupName: group.groupName,
          selectionMode: mode,
          requiredQuantity: Number(group.requiredQuantity) || 0,
          selectedOptionId: mode === 'EXCLUSIVE' ? selected : null,
          options: (group.options || []).filter(function (option) {
            if (mode === 'EXCLUSIVE' && option.optionId !== selected) return false;
            return optionQty(group, option) > 0;
          }).map(function (option) {
            var bucket = state.groups[group.groupId].options[option.optionId];
            return {
              optionId: option.optionId,
              label: option.label,
              productCode: option.productCode || undefined,
              lines: (bucket.lines || []).filter(function (line) { return lineQty(line) > 0; }).map(function (line) {
                var colour = coloursOf(option).filter(function (item) { return item.colourId === line.colourId; })[0];
                var sizes = {};
                sizesOf(option).forEach(function (size) {
                  var qty = Number(line.sizes[size]) || 0;
                  if (qty > 0) sizes[size] = qty;
                });
                return {
                  colourId: line.colourId,
                  colourLabel: colour ? colour.label : '',
                  sizes: sizes,
                  quantity: lineQty(line)
                };
              })
            };
          })
        };
      }),
      logo: state.logo ? {
        filename: state.logo.filename,
        logoId: state.logo.logoId || '',
        ref: state.logo.ref || ''
      } : null,
      notes: state.notes.trim(),
      printMethod: 'dtf',
      printColourCount: 1
    };
  }

  function readBasket() {
    try { return JSON.parse(localStorage.getItem('quoteBasket') || '[]'); }
    catch (error) { return []; }
  }

  function writeBasket(basket) {
    if (window.BrandedQuoteStorage && typeof window.BrandedQuoteStorage.saveBasket === 'function') {
      window.BrandedQuoteStorage.saveBasket(basket);
    } else {
      localStorage.setItem('quoteBasket', JSON.stringify(basket));
    }
    try { window.dispatchEvent(new Event('basketUpdated')); } catch (error) { /* ignore */ }
  }

  function addToBasket() {
    if (!state || state.saving) return;
    if (!canAdd()) {
      state.message = bundle.logoUploadEnabled !== false && !state.logo
        ? 'Add one logo file before this bundle can go in the basket.'
        : (skipGroups() ? 'Each piece needs its exact quantity first.' : 'Every group needs its exact quantity first.');
      render();
      return;
    }
    var price = bundle.bundlePrice == null || bundle.bundlePrice === '' ? null : Number(bundle.bundlePrice);
    if (!isFinite(price)) price = null;
    state.saving = true;
    render();
    logoSave.then(function () {
    var basket = readBasket();
    var editingId = state.editingId || '';
    var entry = {
      lineType: 'bundle',
      id: editingId || ('bundle-' + bundle.bundleId + '-' + Date.now()),
      name: bundle.bundleName,
      bundleId: bundle.bundleId,
      bundleSlug: bundle.bundleSlug,
      banner: bundle.banner || '',
      currency: bundle.currency || 'GBP',
      vatExcluded: bundle.vatExcluded !== false,
      price: price,
      bundlePrice: price,
      qty: 1,
      selection: selectionPayload(),
      builderState: {
        groups: JSON.parse(JSON.stringify(state.groups)),
        notes: state.notes,
        activeGroupId: state.activeGroupId,
        logo: state.logo ? {
          filename: state.logo.filename,
          logoId: state.logo.logoId || '',
          ref: state.logo.ref || ''
        } : null
      }
    };
    var index = -1;
    if (editingId) {
      basket.some(function (item, itemIndex) {
        if (item && item.lineType === 'bundle' && item.id === editingId) {
          index = itemIndex;
          return true;
        }
        return false;
      });
    }
    if (index >= 0) basket[index] = entry;
    else basket.push(entry);
    writeBasket(basket);
    state.confirm = false;
    state.dirty = false;
    window.location.href = '/basket.html#orderSummary';
    }).catch(function () {
      state.saving = false;
      state.message = 'The basket could not be saved. Your configuration is still open. Please try again.';
      render();
    });
  }

  function mismatchMessage(group) {
    var mode = effectiveMode(group);
    var required = Number(group.requiredQuantity) || 0;
    if (mode === 'EXCLUSIVE') {
      var selectedId = state.groups[group.groupId].selectedOptionId;
      var selected = selectedId ? optionById(group, selectedId) : null;
      if (!selected) return '';
      var qty = optionQty(group, selected);
      if (qty === 0 || qty === required) return '';
      return qty + ' is not accepted. ' + selected.label + ' must be exactly ' + required + '.';
    }
    if (mode === 'FIXED') {
      var wrong = (group.options || []).filter(function (option) {
        return optionQty(group, option) !== (Number(option.quantity) || 0);
      })[0];
      if (!wrong && groupQty(group) === required) return '';
      if (!wrong) return groupQty(group) + ' is not accepted. This group must be exactly ' + required + '.';
      var got = optionQty(group, wrong);
      if (got === 0) return '';
      return got + ' is not accepted. ' + wrong.label + ' must be exactly ' + (Number(wrong.quantity) || 0) + '.';
    }
    var total = groupQty(group);
    if (total === 0 || total === required) return '';
    return total + ' is not accepted. The group total must be exactly ' + required + '.';
  }

  function setSize(group, option, lineIndex, size, raw) {
    var bucket = state.groups[group.groupId].options[option.optionId];
    var line = bucket.lines[lineIndex];
    if (!line) return;
    var previous = Number(line.sizes[size]) || 0;
    var requested = parseInt(raw, 10);
    if (!isFinite(requested) || requested < 0) requested = 0;
    if (requested > 9999) requested = 9999;
    line.sizes[size] = requested;
    state.message = mismatchMessage(group);
    if (previous !== requested) markDirty();
  }

  function selectOption(group, optionId) {
    if (effectiveMode(group) !== 'EXCLUSIVE') return;
    var bucket = state.groups[group.groupId];
    if (bucket.selectedOptionId === optionId) return;
    (group.options || []).forEach(function (option) {
      if (option.optionId === optionId) return;
      bucket.options[option.optionId].lines = [blankLine(option)];
    });
    bucket.selectedOptionId = optionId;
    state.message = mismatchMessage(group);
    markDirty();
  }

  function addColour(group, option) {
    if (group.allowMultipleColours === false) return;
    var bucket = state.groups[group.groupId].options[option.optionId];
    var used = {};
    bucket.lines.forEach(function (line) { used[line.colourId] = true; });
    var next = coloursOf(option).filter(function (colour) { return !used[colour.colourId]; })[0];
    if (!next) return;
    bucket.lines.push(blankLine(option, next.colourId));
    markDirty();
  }

  function onFile(file) {
    state.message = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      state.message = file.name + ' is too large (max 25MB).';
      state.logo = null;
      render();
      return;
    }
    var name = String(file.name || '');
    var typeOk = /^image\//.test(file.type) || /pdf|postscript|illustrator|svg/.test(file.type) ||
      /\.(png|jpe?g|gif|webp|svg|pdf|ai|eps)$/i.test(name);
    if (!typeOk) {
      state.message = 'That file type is not supported. Use ' + FILE_TYPES + '.';
      render();
      return;
    }
    clearLogoPreview();
    if (/^image\//.test(file.type)) {
      logoPreviewUrl = URL.createObjectURL(file);
      logoPreviewOwned = true;
    }
    state.logo = { filename: file.name, logoId: '', ref: '' };
    state.message = '';
    markDirty();
    render();
    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = String(reader.result || '');
      var storage = window.BrandedQuoteStorage;
      if (!storage || typeof storage.persistLogo !== 'function' || dataUrl.indexOf('data:image') !== 0) return;
      logoSave = storage.persistLogo(dataUrl, file.name).then(function (result) {
        var logoId = result && result.logoId ? result.logoId : '';
        if (!state || !state.logo || state.logo.filename !== file.name) return;
        state.logo.logoId = logoId;
        state.logo.ref = logoId && storage.refFor ? storage.refFor(logoId) : '';
      }).catch(function () {
        return null;
      });
    };
    reader.readAsDataURL(file);
  }

  function go(step) {
    if (!state || state.saving) return;
    var steps = flowSteps();
    var id = steps[step - 1];
    if (!id) return;
    if (skipGroups() && !canReach(step)) return;
    if (!skipGroups() && id === 'Logo' && !allGroupsValid()) {
      state.message = 'Every group needs its exact quantity first.';
      state.step = steps.indexOf('Products') + 1;
      render();
      return;
    }
    state.step = step;
    state.message = '';
    render();
  }

  function advance() {
    if (!state || state.saving) return;
    var id = stepId();
    if (id === 'Logo') {
      addToBasket();
      return;
    }
    if (skipGroups()) {
      if (!canLeaveStep(state.step)) return;
      var nextStep = state.step + 1;
      state.reached = Math.max(state.reached || 1, nextStep);
      go(nextStep);
      return;
    }
    var steps = flowSteps();
    if (id === 'Included') go(state.step + 1);
    else if (id === 'Groups') go(steps.indexOf('Logo') + 1);
    else if (id === 'Products') {
      var current = groupById(state.activeGroupId);
      if (current && groupValid(current)) go(steps.indexOf('Groups') + 1);
    }
  }

  function requestClose() {
    if (state && state.saving) return;
    if (isDirty()) {
      state.confirm = true;
      render();
      return;
    }
    closeNow();
  }

  function closeNow() {
    var returnToBasket = !!(state && state.editingId);
    root.hidden = true;
    if (state) state.confirm = false;
    document.body.style.overflow = '';
    if (returnToBasket) window.location.href = '/basket.html#orderSummary';
  }

  function onClick(event) {
    var actionEl = event.target.closest('[data-bb-action]');
    if (!actionEl || !root.contains(actionEl)) {
      if (event.target && event.target.getAttribute('data-bb-close') != null) requestClose();
      return;
    }
    var action = actionEl.getAttribute('data-bb-action');
    if (action === 'close') requestClose();
    if (action === 'keep') { state.confirm = false; render(); }
    if (action === 'discard') closeNow();
    if (action === 'step') go(Number(actionEl.getAttribute('data-step')));
    if (action === 'back') go(Math.max(1, state.step - 1));
    if (action === 'next') advance();
    if (action === 'open-group') {
      state.activeGroupId = actionEl.getAttribute('data-group');
      go(flowSteps().indexOf('Products') + 1);
    }
    if (action === 'edit-piece') {
      if (!skipGroups()) return;
      var pieceGroup = actionEl.getAttribute('data-group') || '';
      if (pieceGroup) state.activeGroupId = pieceGroup;
      state.scrollPiece = {
        productCode: actionEl.getAttribute('data-product') || '',
        optionId: actionEl.getAttribute('data-option') || ''
      };
      var productStep = flowSteps().indexOf('Products') + 1;
      if (productStep > 0) go(productStep);
    }
    if (action === 'select-option') {
      var group = groupById(actionEl.getAttribute('data-group'));
      if (group) {
        selectOption(group, actionEl.getAttribute('data-option'));
        render();
      }
    }
    if (action === 'colour') {
      var colourGroup = groupById(actionEl.getAttribute('data-group'));
      var colourOption = colourGroup && optionById(colourGroup, actionEl.getAttribute('data-option'));
      var line = colourOption && state.groups[colourGroup.groupId].options[colourOption.optionId].lines[Number(actionEl.getAttribute('data-line'))];
      if (line) {
        var nextColour = actionEl.getAttribute('data-colour');
        var colourLines = state.groups[colourGroup.groupId].options[colourOption.optionId].lines;
        var taken = colourLines.some(function (other, index) {
          return index !== Number(actionEl.getAttribute('data-line')) && other.colourId === nextColour;
        });
        if (taken) {
          state.message = 'That colour is already used on this item.';
        } else {
          line.colourId = nextColour;
          state.message = mismatchMessage(colourGroup);
          markDirty();
        }
        render();
      }
    }
    if (action === 'add-colour') {
      var addGroup = groupById(actionEl.getAttribute('data-group'));
      var addOption = addGroup && optionById(addGroup, actionEl.getAttribute('data-option'));
      if (addOption) { addColour(addGroup, addOption); render(); }
    }
    if (action === 'remove-colour') {
      var removeGroup = groupById(actionEl.getAttribute('data-group'));
      var removeOption = removeGroup && optionById(removeGroup, actionEl.getAttribute('data-option'));
      if (removeOption) {
        var lines = state.groups[removeGroup.groupId].options[removeOption.optionId].lines;
        lines.splice(Number(actionEl.getAttribute('data-line')), 1);
        if (!lines.length) lines.push(blankLine(removeOption));
        markDirty();
        render();
      }
    }
  }

  function onInput(event) {
    var input = event.target;
    if (input.hasAttribute('data-bb-notes')) {
      var nextNotes = input.value.slice(0, 500);
      if (nextNotes !== state.notes) {
        state.notes = nextNotes;
        markDirty();
      }
      return;
    }
    if (!input.hasAttribute('data-bb-qty')) return;
    var group = groupById(input.getAttribute('data-group'));
    var option = group && optionById(group, input.getAttribute('data-option'));
    if (!option) return;
    if (effectiveMode(group) === 'EXCLUSIVE') selectOption(group, option.optionId);
    setSize(group, option, Number(input.getAttribute('data-line')), input.getAttribute('data-size'), input.value);
    render();
  }

  function bind() {
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', function (event) {
      if (event.target && event.target.hasAttribute('data-bb-file')) onFile(event.target.files && event.target.files[0]);
    });
    root.addEventListener('dragover', function (event) {
      if (!event.target.closest('[data-bb-drop]')) return;
      event.preventDefault();
      event.target.closest('[data-bb-drop]').classList.add('is-over');
    });
    root.addEventListener('dragleave', function (event) {
      var zone = event.target.closest && event.target.closest('[data-bb-drop]');
      if (zone) zone.classList.remove('is-over');
    });
    root.addEventListener('drop', function (event) {
      var zone = event.target.closest && event.target.closest('[data-bb-drop]');
      if (!zone) return;
      event.preventDefault();
      zone.classList.remove('is-over');
      onFile(event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && root && !root.hidden) requestClose();
    });
  }

  function clearLogoPreview() {
    if (logoPreviewOwned && logoPreviewUrl) {
      try { URL.revokeObjectURL(logoPreviewUrl); } catch (error) { /* ignore */ }
    }
    logoPreviewUrl = '';
    logoPreviewOwned = false;
  }

  function savedBundleItem(id, bundleKey) {
    var key = String(id || '');
    if (!key) return null;
    var item = readBasket().filter(function (entry) {
      return entry && entry.lineType === 'bundle' && String(entry.id) === key;
    })[0] || null;
    if (!item) return null;
    if (bundleKey && item.bundleId !== bundleKey && item.bundleSlug !== bundleKey) return null;
    return item;
  }

  function restoreLogoPreview() {
    var logo = state && state.logo;
    var storage = window.BrandedQuoteStorage;
    if (!logo || !storage || typeof storage.resolveSrc !== 'function') return;
    var apply = function () {
      if (!state || !state.logo || state.logo.logoId !== logo.logoId || state.logo.filename !== logo.filename) return;
      var src = storage.resolveSrc(logo.ref || '', logo.logoId || '');
      if (!src || !/^data:image|^blob:|^https?:/i.test(src)) return;
      if (logoPreviewUrl === src) return;
      clearLogoPreview();
      logoPreviewUrl = src;
      if (stepId() === 'Logo') render();
    };
    apply();
    if (typeof storage.migrateLegacy === 'function') {
      storage.migrateLegacy().then(apply).catch(function () { /* preview can stay as the filename */ });
    }
  }

  function applySavedBuilderState(saved) {
    var snap = saved && saved.builderState;
    if (!snap || !state) return;
    state.editingId = saved.id || '';
    state.notes = typeof snap.notes === 'string' ? snap.notes : '';
    if (snap.logo && snap.logo.filename) {
      state.logo = {
        filename: String(snap.logo.filename),
        logoId: snap.logo.logoId || '',
        ref: snap.logo.ref || ''
      };
    }
    if (snap.activeGroupId && state.groups[snap.activeGroupId]) state.activeGroupId = snap.activeGroupId;
    var savedGroups = snap.groups || {};
    Object.keys(savedGroups).forEach(function (groupId) {
      if (!state.groups[groupId] || !savedGroups[groupId]) return;
      var group = groupById(groupId);
      var savedGroup = savedGroups[groupId];
      if (savedGroup.selectedOptionId && state.groups[groupId].options[savedGroup.selectedOptionId]) {
        state.groups[groupId].selectedOptionId = savedGroup.selectedOptionId;
      }
      var savedOptions = savedGroup.options || {};
      Object.keys(savedOptions).forEach(function (optionId) {
        var bucket = state.groups[groupId].options[optionId];
        var option = group && optionById(group, optionId);
        if (!bucket || !option) return;
        var lines = savedOptions[optionId] && savedOptions[optionId].lines;
        if (!Array.isArray(lines) || !lines.length) return;
        bucket.lines = lines.map(function (line) {
          var sizes = {};
          sizesOf(option).forEach(function (size) { sizes[size] = 0; });
          Object.keys(line && line.sizes || {}).forEach(function (size) {
            var qty = Number(line.sizes[size]) || 0;
            if (qty > 0) sizes[size] = qty;
          });
          return {
            colourId: (line && line.colourId) || '',
            sizes: sizes
          };
        });
      });
    });
    var logoStep = flowSteps().indexOf('Logo') + 1;
    if (logoStep > 0 && (allGroupsValid() || logoDetailRows().length)) {
      state.step = logoStep;
      state.reached = logoStep;
    }
    state.dirty = false;
    state.saving = false;
    restoreLogoPreview();
  }

  function openBundle(next, savedItem) {
    bundle = JSON.parse(JSON.stringify(next));
    state = emptyState(bundle);
    clearLogoPreview();
    if (!isCatalogueBundle(bundle)) {
      if (savedItem) applySavedBuilderState(savedItem);
      render();
      return;
    }
    var requestId = ++catalogueRequest;
    bundle.catalogueStatus = 'loading';
    render();
    hydrateCatalogue(bundle).then(function () {
      if (requestId !== catalogueRequest) return;
      state = emptyState(bundle);
      if (savedItem) applySavedBuilderState(savedItem);
      render();
    });
  }

  function renderList() {
    var list = document.getElementById('bundleList');
    if (!list || document.getElementById('bundleLanding')) return;
    var bundles = configBundles();
    if (!bundles.length) {
      list.innerHTML = '<div class="bundle-empty">No bundles are available yet.</div>';
      return;
    }
    list.innerHTML = bundles.filter(function (item) { return !item.hideFromList; }).map(function (item) {
      var includes = (item.groups || []).map(function (group) {
        return '<li>' + esc(group.groupName) + ': ' + esc(modeLine(group)) + '</li>';
      }).join('');
      if (item.includedLogo) includes += '<li>One DTF logo, one print colour</li>';
      var badge = /preview/i.test(item.bundleName || '') ? '<span class="bundle-card__badge">Preview</span>' : '';
      return '<article class="bundle-card" data-open-bundle="' + esc(item.bundleId) + '">' + badge +
        '<h2>' + esc(item.bundleName) + '</h2><p>' + esc(item.bundleDescription || '') + '</p><ul>' + includes + '</ul>' +
        '<button type="button" data-open-bundle="' + esc(item.bundleId) + '">Build this bundle</button></article>';
    }).join('');
    list.onclick = function (event) {
      var button = event.target.closest('[data-open-bundle]');
      if (!button) return;
      var next = findBundle(button.getAttribute('data-open-bundle'));
      if (next) openBundle(next);
    };
  }

  function sessionSignedIn() {
    try {
      if (window.BrandedAccountPanel && typeof window.BrandedAccountPanel.isSignedIn === 'function') {
        return !!window.BrandedAccountPanel.isSignedIn();
      }
      if (window.BrandedAccount && typeof window.BrandedAccount.token === 'function') {
        return !!window.BrandedAccount.token();
      }
      return !!(localStorage.getItem('authToken') || localStorage.getItem('coAuthToken'));
    } catch (error) {
      return false;
    }
  }

  function mount() {
    if (!sessionSignedIn()) return;
    root = document.getElementById('bundleBuilder');
    if (!root) return;
    bind();
    renderList();
    var params = new URLSearchParams(window.location.search);
    var query = params.get('bundle');
    if (query) {
      var next = findBundle(query);
      var saved = savedBundleItem(params.get('edit'), query);
      if (next) openBundle(next, saved);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})(window, document);
