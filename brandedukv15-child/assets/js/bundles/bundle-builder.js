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
  var STEPS = ['Included', 'Groups', 'Products', 'Logo'];
  var root = null;
  var bundle = null;
  var state = null;
  var logoPreviewUrl = '';
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

  function coloursOf(option) {
    return Array.isArray(option.colours) && option.colours.length
      ? option.colours
      : [{ colourId: 'colour', label: 'Colour', hex: '#d5d8e0' }];
  }

  function sizesOf(option) {
    return Array.isArray(option.sizes) && option.sizes.length ? option.sizes : ['One size'];
  }

  function blankLine(option, colourId) {
    var colours = coloursOf(option);
    var sizes = {};
    sizesOf(option).forEach(function (size) { sizes[size] = 0; });
    return {
      colourId: colourId || colours[0].colourId,
      sizes: sizes
    };
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
      activeGroupId: (nextBundle.groups && nextBundle.groups[0] && nextBundle.groups[0].groupId) || '',
      groups: groups,
      logo: null,
      notes: '',
      message: '',
      confirm: false
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
    if (state.notes.trim() || state.logo) return true;
    return (bundle.groups || []).some(function (group) {
      if (state.groups[group.groupId].selectedOptionId) return true;
      return (group.options || []).some(function (option) { return optionQty(group, option) > 0; });
    });
  }

  function modeLine(group) {
    var mode = effectiveMode(group);
    if (mode === 'FIXED') {
      return (group.options || []).map(function (option) {
        return (Number(option.quantity) || 0) + ' ' + option.label;
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

  function render() {
    var key = focusKey();
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    root.querySelector('.bb__title').textContent = bundle.bundleName || 'Bundle';
    root.querySelector('#bbProgress').innerHTML = progressHtml();
    root.querySelector('#bbBody').innerHTML = bodyHtml();
    root.querySelector('#bbFoot').innerHTML = footHtml();
    var confirm = root.querySelector('#bbConfirm');
    confirm.hidden = !state.confirm;
    restoreFocus(key);
  }

  function progressHtml() {
    return STEPS.map(function (label, index) {
      var step = index + 1;
      var disabled = step === 4 && !allGroupsValid();
      var cls = step === state.step ? 'bb__step is-active' : 'bb__step';
      return '<button type="button" class="' + cls + '" data-bb-action="step" data-step="' + step + '"' +
        (disabled ? ' disabled' : '') + '>' + step + ' ' + esc(label) + '</button>';
    }).join('');
  }

  function bodyHtml() {
    if (state.step === 1) return stepIncluded();
    if (state.step === 2) return stepGroups();
    if (state.step === 3) return stepProducts();
    return stepLogo();
  }

  function stepIncluded() {
    var cards = (bundle.groups || []).map(function (group) {
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

  function optionCard(group, option) {
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
    var pick = mode === 'EXCLUSIVE'
      ? '<button type="button" class="bb__btn bb__btn--primary bb__pick" data-bb-action="select-option" data-group="' + esc(group.groupId) + '" data-option="' + esc(option.optionId) + '">' +
        (selected === option.optionId ? 'Selected' : 'Choose ' + esc(option.label)) + '</button>'
      : '';
    return '<article class="' + cls + '"><div class="bb__option-top"><div class="bb__sil">' + silhouette(option.silhouette) +
      '</div><div><h4>' + esc(option.label) + '</h4>' + code + '<p class="bb__code">' + count + '</p></div></div>' +
      pick + editor + '</article>';
  }

  function linesHtml(group, option) {
    var bucket = state.groups[group.groupId].options[option.optionId];
    var colours = coloursOf(option);
    var html = (bucket.lines || []).map(function (line, index) {
      var swatches = colours.map(function (colour) {
        var on = line.colourId === colour.colourId ? ' is-on' : '';
        return '<button type="button" class="bb__swatch' + on + '" style="background:' + esc(colour.hex || '#ddd') + '" title="' + esc(colour.label) + '" aria-label="' + esc(colour.label) + '" data-bb-action="colour" data-group="' + esc(group.groupId) + '" data-option="' + esc(option.optionId) + '" data-line="' + index + '" data-colour="' + esc(colour.colourId) + '"></button>';
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

  function stepLogo() {
    var lines = chosenLines().map(function (line) {
      var detail = line.detail ? '<small style="display:block;color:#5c6578;font-weight:500">' + esc(line.detail) + '</small>' : '';
      return '<li><span>' + esc(line.quantity + ' ' + line.label) + detail + '</span></li>';
    }).join('');
    var logoBlock = '';
    if (bundle.logoUploadEnabled !== false) {
      var preview = state.logo && logoPreviewUrl
        ? '<div class="bb__logo-preview"><img src="' + esc(logoPreviewUrl) + '" alt=""><div><strong>' + esc(state.logo.filename) + '</strong><p>DTF, one print colour. Replacing the file keeps a single logo.</p></div></div>'
        : '';
      logoBlock = '<div class="bb__drop" data-bb-drop="1"><strong>One logo for every piece</strong>' +
        '<p>DTF only. One print colour. ' + FILE_TYPES + '. Max 25MB.</p>' +
        '<label class="bb__file">Add logo<input type="file" accept="' + FILE_ACCEPT + '" data-bb-file="1"></label>' +
        preview + '</div>';
    }
    var notes = bundle.customerNotesEnabled === false ? '' :
      '<label><span class="bb__code">Notes, optional</span><textarea class="bb__notes" data-bb-notes="1" data-bb-focus="notes" maxlength="500" placeholder="Anything the team should know. Notes do not add positions.">' + esc(state.notes) + '</textarea></label>';
    return '<p class="bb__kicker">Logo and summary</p><h3>One logo for every piece</h3>' +
      logoBlock + notes +
      '<div class="bb__summary"><ul>' + lines +
      '<li class="is-price"><span>Bundle price</span><span>' + priceText(bundle.bundlePrice) + '</span></li></ul></div>' +
      (bundle.logoUploadEnabled !== false && !state.logo ? '<p class="bb__warn">Add one logo file before this bundle can go in the basket.</p>' : '') +
      (state.message ? '<p class="bb__warn">' + esc(state.message) + '</p>' : '');
  }

  function footHtml() {
    var back = state.step > 1
      ? '<button type="button" class="bb__btn bb__btn--ghost bb__btn--back" data-bb-action="back">Back</button>'
      : '<span></span>';
    var primary = '<button type="button" class="bb__btn bb__btn--primary" data-bb-action="next"' +
      (primaryDisabled() ? ' disabled' : '') + '>' + esc(primaryLabel()) + '</button>';
    return back + primary;
  }

  function primaryLabel() {
    if (state.step === 1) return 'Build your bundle';
    if (state.step === 4) return 'Add bundle to basket';
    return 'Next';
  }

  function primaryDisabled() {
    if (state.step === 2) return !allGroupsValid();
    if (state.step === 3) {
      var group = groupById(state.activeGroupId);
      return !group || !groupValid(group);
    }
    if (state.step === 4) return !canAdd();
    return false;
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
    if (!canAdd()) {
      state.message = bundle.logoUploadEnabled !== false && !state.logo
        ? 'Add one logo file before this bundle can go in the basket.'
        : 'Every group needs its exact quantity first.';
      render();
      return;
    }
    var price = bundle.bundlePrice == null || bundle.bundlePrice === '' ? null : Number(bundle.bundlePrice);
    if (!isFinite(price)) price = null;
    logoSave.then(function () {
    var basket = readBasket();
    basket.push({
      lineType: 'bundle',
      id: 'bundle-' + bundle.bundleId + '-' + Date.now(),
      name: bundle.bundleName,
      bundleId: bundle.bundleId,
      bundleSlug: bundle.bundleSlug,
      currency: bundle.currency || 'GBP',
      vatExcluded: bundle.vatExcluded !== false,
      price: price,
      bundlePrice: price,
      qty: 1,
      chosenLines: chosenLines(),
      selection: selectionPayload()
    });
    writeBasket(basket);
    state.confirm = false;
    window.location.href = '/basket.html#orderSummary';
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
    var requested = parseInt(raw, 10);
    if (!isFinite(requested) || requested < 0) requested = 0;
    if (requested > 9999) requested = 9999;
    line.sizes[size] = requested;
    state.message = mismatchMessage(group);
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
  }

  function addColour(group, option) {
    if (group.allowMultipleColours === false) return;
    var bucket = state.groups[group.groupId].options[option.optionId];
    var used = {};
    bucket.lines.forEach(function (line) { used[line.colourId] = true; });
    var next = coloursOf(option).filter(function (colour) { return !used[colour.colourId]; })[0];
    if (!next) return;
    bucket.lines.push(blankLine(option, next.colourId));
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
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = /^image\//.test(file.type) ? URL.createObjectURL(file) : '';
    state.logo = { filename: file.name, logoId: '', ref: '' };
    state.message = '';
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
    if (step === 4 && !allGroupsValid()) {
      state.message = 'Every group needs its exact quantity first.';
      state.step = 2;
      render();
      return;
    }
    state.step = step;
    state.message = '';
    render();
  }

  function requestClose() {
    if (isDirty()) {
      state.confirm = true;
      render();
      return;
    }
    closeNow();
  }

  function closeNow() {
    root.hidden = true;
    state.confirm = false;
    document.body.style.overflow = '';
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
    if (action === 'back') {
      if (state.step === 3) go(2);
      else go(Math.max(1, state.step - 1));
    }
    if (action === 'next') {
      if (state.step === 1) go(2);
      else if (state.step === 2) go(4);
      else if (state.step === 3) {
        var current = groupById(state.activeGroupId);
        if (current && groupValid(current)) go(2);
      } else addToBasket();
    }
    if (action === 'open-group') {
      state.activeGroupId = actionEl.getAttribute('data-group');
      go(3);
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
        render();
      }
    }
  }

  function onInput(event) {
    var input = event.target;
    if (input.hasAttribute('data-bb-notes')) {
      state.notes = input.value.slice(0, 500);
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

  function openBundle(next) {
    bundle = next;
    state = emptyState(next);
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = '';
    render();
  }

  function renderList() {
    var list = document.getElementById('bundleList');
    if (!list) return;
    var bundles = configBundles();
    if (!bundles.length) {
      list.innerHTML = '<div class="bundle-empty">No bundles are available yet.</div>';
      return;
    }
    list.innerHTML = bundles.map(function (item) {
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

  function mount() {
    root = document.getElementById('bundleBuilder');
    if (!root) return;
    bind();
    renderList();
    var query = new URLSearchParams(window.location.search).get('bundle');
    if (query) {
      var next = findBundle(query);
      if (next) openBundle(next);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})(window, document);
