    'use strict';

    const photos = {
  "GD005": "assets/gd005.webp",
  "RX101": "assets/rx101.webp",
  "RG045": "assets/rg045.webp",
  "RX301": "assets/rx301.webp",
  "BC045": "assets/bc045.webp",
  "YK001": "assets/yk001.webp"
};
    const swatchColours = {
      Black: '#202227', Navy: '#233354', White: '#fff', 'Sport Grey': '#b5bac1',
      'Royal Blue': '#224db4', Charcoal: '#545a63', Yellow: '#d9ed22', Orange: '#f68027',
    };
    const colourFamily = {
      Black: 'blacks', Navy: 'blues', White: 'whites', 'Sport Grey': 'greys',
      'Royal Blue': 'blues', Charcoal: 'greys', Yellow: 'greens', Orange: 'reds',
    };
    const colourFamilies = [
      ['all', 'All'], ['blacks', 'Blacks'], ['greens', 'Greens'], ['blues', 'Blues'],
      ['reds', 'Reds'], ['browns', 'Browns'], ['greys', 'Greys'], ['pinks', 'Pinks'], ['whites', 'Whites'],
    ];
    const familyDot = {
      blacks: '#111827', greens: '#36a852', blues: '#2749a8', reds: '#ef2f2f',
      browns: '#914915', greys: '#858585', pinks: '#ef3c8d', whites: '#fff',
    };
    const positionSets = {
      GD005: ['Left Chest', 'Right Chest', 'Centre Chest', 'Large Front', 'Upper Back', 'Large Back', 'Left Sleeve', 'Right Sleeve'],
      RX101: ['Left Chest', 'Right Chest', 'Centre Chest', 'Upper Back', 'Large Back', 'Left Sleeve', 'Right Sleeve'],
      RG045: ['Left Chest', 'Right Chest', 'Left Front', 'Right Front', 'Upper Back', 'Large Back', 'Left Sleeve', 'Right Sleeve'],
      RX301: ['Left Chest', 'Right Chest', 'Centre Chest', 'Large Front', 'Upper Back', 'Large Back', 'Left Sleeve', 'Right Sleeve', 'Nape of Neck'],
      BC045: ['Front'],
      YK001: ['Left Chest', 'Right Chest', 'Upper Back', 'Large Back'],
    };
    const adultSizes = ['S', 'M', 'L', 'XL', '2XL'];

    // Product names, codes, bundle compositions and Branded prices: supplied PDF, pages 2–3.
    // The PDF does not list variant availability. These options are examples for the prototype.
    const catalogue = {
      GD005: {
        name: 'Gildan Heavy Cotton™ adult t-shirt', short: 'Heavy Cotton T-shirts',
        colours: ['Black', 'Navy', 'White', 'Sport Grey', 'Royal Blue'], sizes: adultSizes,
      },
      RX101: {
        name: 'ProRTX Pro Polo', short: 'Polos',
        colours: ['Navy', 'Black', 'White', 'Royal Blue', 'Charcoal'], sizes: adultSizes,
      },
      RG045: {
        name: 'Regatta Professional Dover Jacket', short: 'Jackets',
        colours: ['Navy', 'Black'], sizes: adultSizes,
      },
      RX301: {
        name: 'ProRTX Pro Sweatshirt', short: 'Sweatshirts',
        colours: ['Sport Grey', 'Navy', 'Black', 'Charcoal'], sizes: adultSizes,
      },
      BC045: {
        name: 'Beechfield Original Cuffed Beanie', short: 'Beanies',
        colours: ['Charcoal', 'Black', 'Navy'], sizes: ['One size'],
      },
      YK001: {
        name: 'Yoko Hi-vis 2-band-and-braces waistcoat (HVW100)', short: 'Hi-vis vests',
        colours: ['Yellow', 'Orange'], sizes: adultSizes,
      },
    };

    const bundles = [
      {
        id: 'BUN-GD005-24', title: '24 Heavy Cotton T-Shirts',
        exVat: 14699, incVat: 17639, methods: ['Print'], freeDelivery: true,
        items: [{ code: 'GD005', quantity: 24, positions: ['Left Chest'] }],
      },
      {
        id: 'BUN-5-OUTDOOR', title: '5 × Outdoor Worker Bundle',
        exVat: 48999, incVat: 58799, methods: ['Print', 'Embroidery'], application: 'PRINT ONLY AVAILABLE', freeDelivery: false,
        items: [
          { code: 'RX101', quantity: 15, positions: ['Left Chest'] },
          { code: 'RG045', quantity: 5, positions: ['Left Chest', 'Upper Back'] },
          { code: 'RX301', quantity: 10, positions: ['Left Chest', 'Large Back'] },
          { code: 'BC045', quantity: 5, positions: ['Front'] },
        ],
      },
      {
        id: 'BUN-5-COLD', title: '5 × Cold Weather Bundle',
        exVat: 19599, incVat: 23519, methods: ['Print', 'Embroidery'], application: 'PRINT ONLY AVAILABLE', freeDelivery: false,
        items: [
          { code: 'RG045', quantity: 5, positions: ['Left Chest', 'Upper Back'] },
          { code: 'BC045', quantity: 5, positions: ['Front'] },
        ],
      },
      {
        id: 'BUN-EVENT-10', title: '10 × Staff Event Bundle',
        exVat: 15249, incVat: 18299, methods: ['Print', 'Embroidery'], application: 'PRINT ONLY AVAILABLE', freeDelivery: false,
        items: [
          { code: 'RX101', quantity: 10, positions: ['Left Chest'] },
          { code: 'YK001', quantity: 10, positions: ['Left Chest', 'Upper Back'] },
        ],
      },
      {
        id: 'BUN-GD005-100', title: '100 Heavy Cotton T-Shirts',
        exVat: 58799, incVat: 70559, methods: ['Print'], freeDelivery: true,
        items: [{ code: 'GD005', quantity: 100, positions: ['Centre Chest', 'Large Back'] }],
      },
    ];

    const stepNames = ['Product', 'Colour', 'Customise'];
    const get = id => document.getElementById(id);
    const bundleDrawer = get('orderPopup');
    let popupOpen = false;
    const basketDrawer = get('basket-drawer');
    const stepContent = get('step-content');
    const continueButton = get('continue');
    const drafts = new Map();
    const basket = [];
    let draft;
    let nextBasketId = 1;

    const moneyFormatter = new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP'});
    const money = pence => moneyFormatter.format(pence / 100);
    const escape = value => String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
    const pieceCount = bundle => bundle.items.reduce((sum, item) => sum + item.quantity, 0);
    const artworkAccepted = file => /\.(png|jpe?g|pdf|svg|eps|ai)$/i.test(file.name);

    function price(exVat, incVat) {
      return `<div class="price"><strong>${money(exVat)}</strong> <small>ex VAT</small>
        <span class="vat-included">${money(incVat)} inc VAT</span></div>`;
    }

    function familyId(name) {
      const value = String(name || '').toLowerCase();
      if (value.includes('black') || value.includes('charcoal') || value.includes('graphite')) return 'blacks';
      if (value.includes('green') || value.includes('olive') || value.includes('lime')) return 'greens';
      if (value.includes('blue') || value.includes('navy') || value.includes('royal') || value.includes('surf')) return 'blues';
      if (value.includes('red') || value.includes('burgundy') || value.includes('maroon')) return 'reds';
      if (value.includes('brown') || value.includes('chocolate') || value.includes('caramel')) return 'browns';
      if (value.includes('grey') || value.includes('gray') || value.includes('silver')) return 'greys';
      if (value.includes('pink') || value.includes('fuchsia')) return 'pinks';
      if (value.includes('white') || value.includes('ivory') || value.includes('cream')) return 'whites';
      return 'other';
    }

    function colourEntries(product) {
      return (product && product.colours || []).map(entry => {
        if (entry && typeof entry === 'object') return entry;
        return { name: String(entry), image: '', thumb: '', family: colourFamily[entry] || familyId(entry) };
      });
    }

    function colourName(entry) {
      return entry && typeof entry === 'object' ? entry.name : String(entry || '');
    }

    function photo(code, className = '') {
      const product = catalogue[code] || {};
      const src = product.image || photos[code] || '';
      const alt = product.name || code;
      return `<img class="${className}" src="${escape(src)}" alt="${escape(alt)}"
        width="432" height="432" decoding="async">`;
    }

    function bundlePhotos(bundle) {
      const kind = {1: 'one', 2: 'two', 4: 'four'}[bundle.items.length];
      return `<div class="photo-grid ${kind}" aria-hidden="true">
        ${bundle.items.map(item => photo(item.code)).join('')}
      </div>`;
    }

    function inclusion(bundle) {
      const method = bundle.methods.length === 1 ? 'Printing included' : 'Logo included';
      return bundle.freeDelivery ? method + ' · Free delivery' : method;
    }

    function renderShop() {
      get('hero-art').innerHTML = ['RG045', 'RX101', 'YK001'].map(code => photo(code)).join('');
      get('bundle-count').textContent = bundles.length + ' bundles';
      get('bundle-grid').innerHTML = bundles.map(bundle => `
        <article class="bundle-card" data-id="${bundle.id}" tabindex="0" role="button" aria-label="Build ${bundle.title}">
          <figure class="card-art">
            ${bundlePhotos(bundle)}
            <span class="piece-label">${pieceCount(bundle)} items</span>
          </figure>
          <div class="card-content">
            <h3>${bundle.title}</h3>
            <p class="inclusion">${inclusion(bundle)}</p>
            <ul class="pack-contents" aria-label="Included garments">
              ${bundle.items.map(item => `<li>${item.quantity} × ${catalogue[item.code].short}</li>`).join('')}
            </ul>
            <div class="card-bottom">
              ${price(bundle.exVat, bundle.incVat)}
              <span class="btn primary">Build bundle <span aria-hidden="true">→</span></span>
            </div>
          </div>
        </article>`).join('');
    }

    function createDraft(bundle) {
      return {
        bundle, step: 0, activeCode: bundle.items[0].code,
        selections: Object.fromEntries(bundle.items.map(item => [item.code, []])),
        colours: Object.fromEntries(bundle.items.map(item => [item.code, colourName(catalogue[item.code].colours[0])])),
        method: bundle.methods.length === 1 ? bundle.methods[0] : '',
        family: 'all',
        decoration: {},
        logo: null, notes: '', fileError: '',
      };
    }

    let openTimer = 0;

    function armBundle(card) {
      if (!card || card.classList.contains('is-opening')) return;
      document.querySelectorAll('.bundle-card.is-opening').forEach(openCard => openCard.classList.remove('is-opening'));
      card.classList.add('is-opening');
      clearTimeout(openTimer);
      openTimer = setTimeout(() => {
        card.classList.remove('is-opening');
        openBundle(card.dataset.id);
      }, 1000);
    }

    function openBundle(id) {
      const bundle = bundles.find(item => item.id === id);
      if (!bundle) return;
      if (!drafts.has(id)) drafts.set(id, createDraft(bundle));
      draft = drafts.get(id);
      renderStep();
      popupOpen = true;
      bundleDrawer.classList.add('active');
      document.body.classList.add('popup-open');
      focusStep();
    }

    function closeBundle() {
      popupOpen = false;
      bundleDrawer.classList.remove('active');
      document.body.classList.remove('popup-open');
    }

    function allocated(code) {
      return draft.selections[code].reduce((sum, line) => sum + line.quantity, 0);
    }

    function allocatedTotal() {
      return draft.bundle.items.reduce((sum, item) => sum + allocated(item.code), 0);
    }

    function quantitiesComplete() {
      return draft.bundle.items.every(item => {
        const product = catalogue[item.code];
        const lines = draft.selections[item.code];
        return allocated(item.code) === item.quantity && lines.every(line =>
          colourEntries(product).some(entry => entry.name === line.colour) && product.sizes.includes(line.size) &&
          Number.isInteger(line.quantity) && line.quantity > 0);
      });
    }

    function logoComplete() {
      if (draft.bundle.items.length > 1) return Boolean(draft.logo) && !draft.fileError;
      return draft.bundle.methods.includes(draft.method) && Boolean(draft.logo) && !draft.fileError;
    }

    function focusStep() {
      stepContent.scrollTop = 0;
      stepContent.querySelector('h3')?.focus({preventScroll: true});
    }

    function goToStep(step) {
      draft.step = step;
      renderStep();
      focusStep();
    }

    function renderStep() {
      const bundle = draft.bundle;
      get('bundle-title').textContent = bundle.title;
      get('bundle-caption').textContent = bundle.id + ' · ' + pieceCount(bundle) + ' items · ' + money(bundle.exVat) + ' ex VAT';
      const stepNotes = ['Overview', 'Choose a finish', 'Add your design'];
      get('flow-progress').innerHTML = stepNames.map((name, index) => {
        const complete = index < draft.step;
        const current = index === draft.step;
        const state = current ? ' is-active' : (complete ? ' is-complete' : '');
        const body = `<span class="pc-progress-number">${index + 1}</span><span><strong>${name}</strong><small>${stepNotes[index]}</small></span>`;
        if (complete) {
          return `<li class="${state.trim()}"><button type="button" class="step-hit" data-action="step" data-step="${index}">${body}</button></li>`;
        }
        return `<li class="${state.trim()}" ${current ? 'aria-current="step"' : ''}>${body}</li>`;
      }).join('');
      const renderers = [renderOverview, renderColour, renderCustomise];
      stepContent.innerHTML = renderers[draft.step]();
      if (draft.step === 1) refreshQuantities();
      refreshFooter();
    }

    function renderOverview() {
      const bundle = draft.bundle;
      return `
        <h3 tabindex="-1">What’s included</h3>
        <p class="caption">${inclusion(bundle)}</p>
        <div class="overview-grid">
          <div class="included-list">
            ${bundle.items.map(item => `<button class="included-item" type="button" data-action="pick-item" data-code="${item.code}">
              ${photo(item.code, 'thumb')}
              <span><span class="line-name">${catalogue[item.code].name}</span><span class="sku">${item.code}</span></span>
              <span class="qty-pill">×${item.quantity}</span>
            </button>`).join('')}
          </div>
          <figure class="overview-art">${bundlePhotos(bundle)}</figure>
        </div>`;
    }

    function offeredPositions(code) {
      const item = draft.bundle.items.find(entry => entry.code === code);
      return Array.isArray(item && item.positions) ? item.positions : [];
    }

    function garmentTabs() {
      if (draft.bundle.items.length < 2) return '';
      return `<div class="garment-tabs" aria-label="Bundle garments">
        ${draft.bundle.items.map(item => `
          <button class="garment-tab" type="button" data-action="garment" data-code="${item.code}"
            aria-pressed="${draft.activeCode === item.code}">
            ${photo(item.code, 'thumb')}
            <span>${catalogue[item.code].short}</span>
          </button>`).join('')}
      </div>`;
    }

    function renderColour() {
      const code = draft.activeCode;
      const product = catalogue[code];
      const selected = draft.colours[code];
      const colours = colourEntries(product);
      const chosen = colours.find(entry => entry.name === selected) || colours[0];
      const visible = colours.filter(entry => draft.family === 'all' || entry.family === draft.family);
      const preview = chosen && (chosen.image || chosen.thumb) ? (chosen.image || chosen.thumb) : (product.image || photos[code]);
      return `
        <div class="progress-row colour-progress">
          <p class="alloc-readout" id="allocation-progress" aria-live="polite"></p>
          <div class="qty-bar" id="quantity-progress" role="progressbar" aria-valuemin="0"
            aria-valuemax="${pieceCount(draft.bundle)}" aria-valuenow="0" aria-label="Items allocated">
            <span class="qty-bar-fill"></span>
          </div>
        </div>
        <div class="flow-head">
          <div>
            <h3 tabindex="-1">Choose your colour</h3>
            <p class="caption">Select a finish to preview this garment. The same bundle quantity is split across the colours you use.</p>
          </div>
        </div>
        ${garmentTabs()}
        <div class="colour-layout">
          <figure class="colour-stage">
            <img src="${escape(preview || '')}" alt="${escape(product.name + ' ' + (chosen ? chosen.name : ''))}" width="432" height="432">
            <figcaption><strong>${escape(product.name)}</strong><span>${escape(selected || '')}</span></figcaption>
          </figure>
          <div class="colour-panel page-2">
            <div class="p2-filter-group">
              <span class="p2-filter-title">Filter By Colour</span>
              <div class="p2-filter-options" role="group" aria-label="Filter by colour">
                ${colourFamilies.map(([id, label]) => `
                  <button class="p2-filter-chip${draft.family === id ? ' is-active' : ''}" type="button" data-action="family" data-family="${id}"
                    aria-pressed="${draft.family === id}">
                    ${id === 'all' ? '' : `<span class="p2-filter-dot" style="background:${familyDot[id]}" aria-hidden="true"></span>`}${label}
                  </button>`).join('')}
                <button class="p2-filter-reset" type="button" data-action="family" data-family="all">Reset <span aria-hidden="true">↶</span></button>
              </div>
            </div>
            <div class="colour-swatches-grid">
              ${visible.map(entry => `
                <button class="colour-swatch-item${selected === entry.name ? ' selected' : ''}" type="button" data-action="colour" data-colour="${escape(entry.name)}"
                  aria-pressed="${selected === entry.name}">
                  <span class="swatch-thumb" style="background-image:url('${escape(entry.thumb || entry.image || preview || '')}')"></span>
                  <span class="swatch-info"><span class="swatch-name">${escape(entry.name)}</span></span>
                </button>`).join('') || '<p class="caption">No colours in this group.</p>'}
            </div>
            <section class="size-block" id="variant-editor" aria-label="Choose sizes">
              <div class="editor-heading">
                <h4>Sizes</h4><span class="remaining" id="remaining"></span>
              </div>
              <div class="size-grid${product.sizes.length < 4 ? ' few' : ''}">
                ${product.sizes.map(size => `<div class="size-row">
                  <span class="size-label">${size}</span>
                  <div class="quantity-control">
                    <button type="button" data-action="decrease" data-size="${size}" aria-label="Decrease ${size}">−</button>
                    <input type="number" min="0" step="1" inputmode="numeric" data-quantity="${size}" aria-label="${size} quantity">
                    <button type="button" data-action="increase" data-size="${size}" aria-label="Increase ${size}">+</button>
                  </div>
                </div>`).join('')}
              </div>
              <div class="selected-lines" id="selected-lines" aria-label="Selected variants"></div>
              <button type="button" class="btn secondary next-garment" id="next-garment"
                data-action="next-garment" hidden>Next garment →</button>
            </section>
          </div>
        </div>`;
    }

    function decorationChosen() {
      if (draft.bundle.items.length > 1) return true;
      return draft.bundle.items.every(item => {
        const chosen = draft.decoration[item.code] || {};
        return (item.positions || []).some(name => chosen[name]);
      });
    }

    function renderUpload() {
      return `
        <div class="upload-zone">
          <input class="visually-hidden" id="logo-file" type="file"
            accept=".png,.jpg,.jpeg,.pdf,.svg,.eps,.ai" aria-label="Upload your logo">
          <label class="btn secondary" for="logo-file">${draft.logo ? 'Replace logo' : 'Upload your logo'}</label>
          ${draft.logo ? `<p class="file-name">${escape(draft.logo.name)}</p>
            <button class="text-action" type="button" data-action="remove-logo">Remove logo</button>`
            : '<p class="caption">PNG, JPG, PDF, SVG, EPS or AI.</p>'}
          <p class="error" role="alert">${escape(draft.fileError)}</p>
        </div>`;
    }

    function renderCustomise() {
      if (draft.bundle.items.length > 1) {
        const application = draft.bundle.application || 'PRINT ONLY AVAILABLE';
        return `
          <ul class="bundle-lineup">
            ${draft.bundle.items.map(item => `<li>${item.quantity} × ${catalogue[item.code].short}</li>`).join('')}
          </ul>
          <div class="logo-standard">
            <h3 tabindex="-1">LOGO PER IL TUO BUNDLE</h3>
            <p>(${escape(application)})</p>
          </div>
          ${renderUpload()}`;
      }
      const code = draft.activeCode;
      const offered = offeredPositions(code);
      const chosen = draft.decoration[code] || {};
      const methods = draft.bundle.methods.map(method => method.toLowerCase());
      return `
        <h3 tabindex="-1">Customise</h3>
        <p class="caption">Choose a print position, then upload the logo. Positions that are not in this bundle stay off.</p>
        <div class="pos-grid">
          ${(positionSets[code] || []).map(name => {
            const on = offered.includes(name);
            const pick = chosen[name] || '';
            return `<article class="pos${on ? '' : ' is-off'}${pick ? ' is-on' : ''}">
              <div class="pos-photo">${photo(code)}</div>
              <h4>${name}</h4>
              ${['Embroidery', 'Print'].map(method => {
                const allowed = on && methods.includes(method.toLowerCase());
                return `<button class="pos-method ${method === 'Embroidery' ? 'emb' : 'print'}" type="button"
                  data-action="position" data-position="${name}" data-method="${method}"
                  aria-pressed="${pick === method}" ${allowed ? '' : 'disabled'}>${method}</button>`;
              }).join('')}
            </article>`;
          }).join('')}
        </div>
        ${renderUpload()}`;
    }

    function activeQuantity(size) {
      const code = draft.activeCode;
      return draft.selections[code].find(line => line.colour === draft.colours[code] && line.size === size)?.quantity ?? 0;
    }

    function changeQuantity(size, proposed, input) {
      const code = draft.activeCode;
      const colour = draft.colours[code];
      const item = draft.bundle.items.find(item => item.code === code);
      if (!catalogue[code].sizes.includes(size)) return;
      const existing = activeQuantity(size);
      const maximum = item.quantity - allocated(code) + existing;
      const quantity = Math.min(maximum, Math.max(0, Number.isFinite(proposed) ? Math.trunc(proposed) : 0));
      const otherLines = draft.selections[code].filter(line => line.colour !== colour || line.size !== size);
      if (quantity > 0) otherLines.push({colour, size, quantity});
      draft.selections[code] = otherLines;
      if (input && input.value !== '' && quantity !== proposed) input.value = quantity;
      refreshQuantities(input);
    }

    function refreshQuantities(activeInput) {
      const bundle = draft.bundle;
      const count = allocatedTotal();
      const code = draft.activeCode;
      const currentItem = bundle.items.find(item => item.code === code);
      const remaining = currentItem.quantity - allocated(code);
      const total = pieceCount(bundle);
      const full = total > 0 && count === total;
      const progress = get('quantity-progress');
      progress.setAttribute('aria-valuemax', total);
      progress.setAttribute('aria-valuenow', count);
      progress.classList.toggle('is-full', full);
      progress.querySelector('.qty-bar-fill').style.width = (total ? (count / total) * 100 : 0) + '%';
      progress.closest('.progress-row').classList.toggle('is-full', full);
      get('allocation-progress').innerHTML = `<strong>${count} / ${total}</strong> allocated`;
      get('remaining').textContent = remaining === 0 ? '✓ Complete' : remaining + ' remaining';
      for (const item of bundle.items) {
        const counter = stepContent.querySelector(`[data-counter="${item.code}"]`);
        if (!counter) continue;
        const assigned = allocated(item.code);
        counter.textContent = assigned + ' / ' + item.quantity;
        counter.classList.toggle('complete', assigned === item.quantity);
      }
      for (const input of stepContent.querySelectorAll('[data-quantity]')) {
        const size = input.dataset.quantity;
        const quantity = activeQuantity(size);
        input.max = quantity + remaining;
        if (input !== activeInput) input.value = quantity;
        input.previousElementSibling.disabled = quantity === 0;
        input.nextElementSibling.disabled = remaining === 0;
      }
      get('selected-lines').innerHTML = draft.selections[code].map((line, index) => `
        <button class="allocation" type="button" data-action="remove-variant" data-index="${index}"
          aria-label="Remove ${line.quantity} ${line.colour} ${line.size}">
          ${line.colour} · ${line.size} ×${line.quantity} <span aria-hidden="true">×</span>
        </button>`).join('');
      get('next-garment').hidden = remaining > 0 || quantitiesComplete();
      refreshFooter();
    }

    function chooseGarment(code) {
      if (!draft.bundle.items.some(item => item.code === code)) return;
      draft.activeCode = code;
      renderStep();
    }

    function chooseColour(colour) {
      if (!colourEntries(catalogue[draft.activeCode]).some(entry => entry.name === colour)) return;
      const scroll = stepContent.scrollTop;
      draft.colours[draft.activeCode] = colour;
      renderStep();
      stepContent.scrollTop = scroll;
    }

    function renderLogo() {
      const methods = draft.bundle.methods;
      return `
        <h3 tabindex="-1">Add your logo</h3>
        <p class="caption">One logo for the whole bundle.</p>
        <div class="branding">
          ${methods.length === 1 ? '<p class="inclusion">Printing included</p>' : `
            <fieldset><legend>Application method</legend>
              <div class="methods">${methods.map(method => `
                <label class="method"><input type="radio" name="method" value="${method}"
                  ${draft.method === method ? 'checked' : ''}> ${method}</label>`).join('')}
              </div>
            </fieldset>`}
          <div class="upload-zone">
            <input class="visually-hidden" id="logo-file" type="file"
              accept=".png,.jpg,.jpeg,.pdf,.svg,.eps,.ai" aria-label="Upload your logo">
            <label class="btn secondary" for="logo-file">${draft.logo ? 'Replace logo' : 'Upload your logo'}</label>
            ${draft.logo ? `<p class="file-name">${escape(draft.logo.name)}</p>
              <button class="text-action" type="button" data-action="remove-logo">Remove logo</button>`
              : '<p class="caption">PNG, JPG, PDF, SVG, EPS or AI</p>'}
            <p class="error" role="alert">${escape(draft.fileError)}</p>
          </div>
          <label class="notes-label" for="notes">Notes for our team (optional)
            <textarea id="notes" placeholder="Add any instructions for your logo.">${escape(draft.notes)}</textarea>
          </label>
        </div>`;
    }

    function selectionSummary(bundle, selections) {
      return bundle.items.map(item => `
        <section class="review-product">
          <strong>${catalogue[item.code].name} <span class="sku">· ${item.code} · ×${item.quantity}</span></strong>
          <ul class="variant-list">
            ${selections[item.code].map(line => `<li>
              <span>${line.colour} · ${line.size}</span><b>×${line.quantity}</b>
            </li>`).join('')}
          </ul>
        </section>`).join('');
    }

    function renderReview() {
      return `
        <h3 tabindex="-1">Review your bundle</h3>
        <p class="caption">${pieceCount(draft.bundle)} items · ${inclusion(draft.bundle)}</p>
        <section class="review-section">
          <div class="review-title"><h4>Garments</h4>
            <button class="text-action" type="button" data-action="step" data-step="1">Edit colours &amp; sizes</button>
          </div>
          ${selectionSummary(draft.bundle, draft.selections)}
        </section>
        <section class="review-section">
          <div class="review-title"><h4>Logo and notes</h4>
            <button class="text-action" type="button" data-action="step" data-step="2">Edit logo</button>
          </div>
          <p class="caption">${draft.method} · ${escape(draft.logo?.name ?? '')}</p>
          ${draft.notes.trim() ? `<p class="review-note">${escape(draft.notes.trim())}</p>` : ''}
        </section>`;
    }

    function refreshFooter() {
      const last = draft.step === stepNames.length - 1;
      continueButton.className = last ? 'p4-btn-next' : 'btn-continue next';
      continueButton.innerHTML = last
        ? 'ADD TO BASKET <span aria-hidden="true">→</span>'
        : 'NEXT <span aria-hidden="true">→</span>';
      get('back').hidden = draft.step === 0;
      let status = '';
      let ready = true;
      if (draft.step === 1 && !quantitiesComplete()) {
        const left = pieceCount(draft.bundle) - allocatedTotal();
        status = left + (left === 1 ? ' item left to allocate' : ' items left to allocate');
        ready = false;
      }
      if (draft.step === 2) {
        if (!decorationChosen()) status = 'Choose a position to continue.';
        else if (!logoComplete()) status = 'Upload your logo to continue.';
        ready = quantitiesComplete() && decorationChosen() && logoComplete();
      }
      continueButton.disabled = !ready;
      get('step-status').textContent = status;
    }

    function garmentSrc(code) {
      const file = photos[code] || '';
      return file ? 'workwear-bundles/' + file : '';
    }

    function bundleLines(bundle) {
      return bundle.items.map(item => {
        const lines = (draft.selections[item.code] || []).map(line =>
          line.colour + ' · ' + line.size + ' ×' + line.quantity);
        const placed = Object.entries(draft.decoration[item.code] || {})
          .filter(([, method]) => method)
          .map(([position, method]) => position + ' · ' + method);
        const detail = lines.concat(placed).join(', ');
        return {
          quantity: item.quantity,
          label: catalogue[item.code].name,
          detail: detail,
          image: garmentSrc(item.code)
        };
      });
    }

    function storeLogo(file) {
      return new Promise(resolve => {
        if (!file) {
          resolve(null);
          return;
        }
        const image = /^image\//.test(file.type) || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
        if (!image) {
          resolve({ filename: file.name, logoId: '', ref: '' });
          return;
        }
        const reader = new FileReader();
        reader.onerror = () => resolve({ filename: file.name, logoId: '', ref: '' });
        reader.onload = () => {
          const dataUrl = String(reader.result || '');
          const storage = window.BrandedQuoteStorage;
          if (!storage || typeof storage.persistLogo !== 'function' || dataUrl.indexOf('data:image') !== 0) {
            resolve({ filename: file.name, logoId: '', ref: '' });
            return;
          }
          storage.persistLogo(dataUrl, file.name).then(result => {
            const logoId = result && result.logoId ? result.logoId : '';
            resolve({
              filename: file.name,
              logoId: logoId,
              ref: logoId && storage.refFor ? storage.refFor(logoId) : ''
            });
          }).catch(() => resolve({ filename: file.name, logoId: '', ref: '' }));
        };
        reader.readAsDataURL(file);
      });
    }

    function readQuoteBasket() {
      try {
        if (window.BrandedQuoteStorage && typeof window.BrandedQuoteStorage.loadBasket === 'function') {
          const stored = window.BrandedQuoteStorage.loadBasket();
          return Array.isArray(stored) ? stored : [];
        }
        const parsed = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function writeQuoteBasket(next) {
      if (window.BrandedQuoteStorage && typeof window.BrandedQuoteStorage.saveBasket === 'function') {
        window.BrandedQuoteStorage.saveBasket(next);
      } else {
        localStorage.setItem('quoteBasket', JSON.stringify(next));
      }
      try { window.dispatchEvent(new Event('basketUpdated')); } catch (error) { /* ignore */ }
    }

    function refreshRealCount() {
      const node = document.getElementById('basket-count');
      if (node) node.textContent = String(readQuoteBasket().length);
    }

    async function commitBundle() {
      if (draft.bundle.items.length > 1) draft.method = draft.bundle.application || 'PRINT ONLY AVAILABLE';
      continueButton.disabled = true;
      const savedLogo = await storeLogo(draft.logo);
      const method = String(draft.method || '').toLowerCase().indexOf('embroid') >= 0 ? 'embroidery' : 'dtf';
      const logoRecord = savedLogo ? {
        filename: savedLogo.filename,
        logoId: savedLogo.logoId || '',
        ref: savedLogo.ref || '',
        logo: savedLogo.ref || '',
        position: 'bundle',
        positionLabel: draft.bundle.items.length > 1 ? (draft.bundle.application || 'PRINT ONLY AVAILABLE') : 'Bundle logo',
        method: method
      } : null;
      const lines = bundleLines(draft.bundle);
      const quote = readQuoteBasket();
      quote.push({
        lineType: 'bundle',
        id: 'bundle-' + draft.bundle.id + '-' + Date.now(),
        name: draft.bundle.title,
        bundleId: draft.bundle.id,
        currency: 'GBP',
        vatExcluded: true,
        price: draft.bundle.exVat / 100,
        bundlePrice: draft.bundle.exVat / 100,
        qty: 1,
        image: lines[0] ? lines[0].image : '',
        chosenLines: lines,
        logos: logoRecord ? [logoRecord] : [],
        selection: {
          logo: logoRecord,
          notes: draft.notes.trim(),
          application: draft.bundle.items.length > 1 ? (draft.bundle.application || 'PRINT ONLY AVAILABLE') : draft.method
        }
      });
      writeQuoteBasket(quote);
      window.location.href = '../basket.html#orderSummary';
    }

    function nextStep() {
      if (continueButton.disabled) return;
      if (draft.step < stepNames.length - 1) {
        goToStep(draft.step + 1);
      } else if (quantitiesComplete() && decorationChosen() && logoComplete()) {
        commitBundle();
      }
    }

    function renderBasket() {
      get('basket-count').textContent = basket.length;
      get('basket-total').innerHTML = price(
        basket.reduce((sum, line) => sum + line.bundle.exVat, 0),
        basket.reduce((sum, line) => sum + line.bundle.incVat, 0),
      );
      get('basket-content').innerHTML = basket.length === 0 ? '<p>Your basket is empty.</p>' : basket.map(line => `
        <article class="basket-line">
          <h3>${line.bundle.title}</h3>
          <p class="caption">${pieceCount(line.bundle)} items · ${line.method} · ${escape(line.logo.name)}</p>
          ${price(line.bundle.exVat, line.bundle.incVat)}
          <details>
            <summary>View configuration</summary>
            <div>${selectionSummary(line.bundle, line.selections)}
              ${line.notes ? `<p class="review-note">${escape(line.notes)}</p>` : ''}
            </div>
          </details>
          <button class="text-action" type="button" data-action="remove-basket" data-id="${line.id}"
            aria-label="Remove ${line.bundle.title}">Remove</button>
        </article>`).join('');
    }

    function openBasket() {
      renderBasket();
      if (!basketDrawer.open) basketDrawer.showModal();
      document.body.classList.add('dialog-open');
    }

    document.addEventListener('click', event => {
      const card = event.target.closest('.bundle-card');
      if (card && !popupOpen) {
        armBundle(card);
        return;
      }
      const button = event.target.closest('button[data-action]');
      if (!button || button.disabled) return;
      const action = button.dataset.action;
      switch (action) {
        case 'open-bundle': openBundle(button.dataset.id); break;
        case 'close-bundle': closeBundle(); break;
        case 'open-basket': openBasket(); break;
        case 'close-basket': basketDrawer.close(); break;
        case 'continue': nextStep(); break;
        case 'back': if (draft.step > 0) goToStep(draft.step - 1); break;
        case 'step': {
          const step = Number(button.dataset.step);
          if (step >= 0 && step < draft.step) goToStep(step);
          break;
        }
        case 'pick-item':
          if (draft.bundle.items.some(item => item.code === button.dataset.code)) {
            draft.activeCode = button.dataset.code;
            goToStep(1);
          }
          break;
        case 'garment': chooseGarment(button.dataset.code); break;
        case 'colour': chooseColour(button.dataset.colour); break;
        case 'family': {
          const scroll = stepContent.scrollTop;
          draft.family = button.dataset.family;
          renderStep();
          stepContent.scrollTop = scroll;
          break;
        }
        case 'position': {
          const code = draft.activeCode;
          const position = button.dataset.position;
          const method = button.dataset.method;
          if (!offeredPositions(code).includes(position)) break;
          if (!draft.bundle.methods.some(entry => entry.toLowerCase() === method.toLowerCase())) break;
          const current = draft.decoration[code] || {};
          current[position] = current[position] === method ? '' : method;
          draft.decoration[code] = current;
          if (!draft.method) draft.method = method;
          renderStep();
          break;
        }
        case 'increase':
        case 'decrease': {
          const size = button.dataset.size;
          changeQuantity(size, activeQuantity(size) + (action === 'increase' ? 1 : -1));
          break;
        }
        case 'remove-variant':
          draft.selections[draft.activeCode].splice(Number(button.dataset.index), 1);
          refreshQuantities();
          break;
        case 'next-garment': {
          const next = draft.bundle.items.find(item => allocated(item.code) < item.quantity);
          if (next) chooseGarment(next.code);
          break;
        }
        case 'remove-logo':
          draft.logo = null;
          draft.fileError = '';
          renderStep();
          get('logo-file').focus();
          break;
        case 'remove-basket': {
          const index = basket.findIndex(line => line.id === Number(button.dataset.id));
          if (index >= 0) basket.splice(index, 1);
          renderBasket();
          break;
        }
      }
    });

    stepContent.addEventListener('input', event => {
      const input = event.target;
      if (input.matches('[data-quantity]')) {
        changeQuantity(input.dataset.quantity, input.value === '' ? 0 : input.valueAsNumber, input);
      } else if (input.id === 'notes') {
        draft.notes = input.value;
      }
    });
    stepContent.addEventListener('change', event => {
      const input = event.target;
      if (input.matches('[data-quantity]')) input.value = activeQuantity(input.dataset.quantity);
      if (input.name === 'method') {
        draft.method = input.value;
        refreshFooter();
      }
      if (input.id === 'logo-file' && input.files.length > 0) {
        const file = input.files[0];
        if (artworkAccepted(file)) {
          draft.logo = file;
          draft.fileError = '';
        } else {
          draft.fileError = 'Choose a PNG, JPG, PDF, SVG, EPS or AI file.';
        }
        renderStep();
      }
    });

    document.addEventListener('keydown', event => {
      const card = event.target.closest('.bundle-card');
      if (!card || popupOpen) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        armBundle(card);
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && popupOpen) closeBundle();
    });
    if (basketDrawer) {
      basketDrawer.addEventListener('close', () => {
        if (!popupOpen && !basketDrawer.open) document.body.classList.remove('dialog-open');
      });
    }

    function applyLiveProduct(code, data) {
      const product = catalogue[code];
      if (!product || !data) return;
      const brand = String(data.brand || '').trim();
      const rawName = String(data.name || product.name).replace(/\s+/g, ' ').trim();
      product.name = brand && rawName.toLowerCase().indexOf(brand.toLowerCase()) === -1 ? brand + ' ' + rawName : rawName;
      product.short = rawName.replace(/™/g, '').trim();
      const colors = data.colours || data.colors || [];
      if (colors.length) {
        product.colours = colors.filter(entry => String(entry && entry.name || '').toLowerCase() !== 'model').map(entry => ({
          name: entry.name,
          image: entry.image || entry.main || entry.thumb || '',
          thumb: entry.thumb || entry.main || entry.image || '',
          family: familyId(entry.name)
        }));
      }
      if (Array.isArray(data.sizes) && data.sizes.length) product.sizes = data.sizes.slice();
      const model = (data.colors || data.colours || []).find(entry => String(entry && entry.name || '').toLowerCase() === 'model');
      product.image = data.image || (model && (model.main || model.thumb || model.image)) || (product.colours[0] && (product.colours[0].image || product.colours[0].thumb)) || product.image;
    }

    async function hydrateCatalogue() {
      try {
        const response = await fetch('catalogue-live.json?v=20261111-real');
        if (response.ok) {
          const payload = await response.json();
          Object.keys(catalogue).forEach(code => applyLiveProduct(code, payload[code]));
        }
      } catch (error) { /* keep the local fallback */ }
      await Promise.all(Object.keys(catalogue).map(async code => {
        try {
          const response = await fetch('https://api.brandeduk.com/api/products/' + encodeURIComponent(code));
          if (!response.ok) return;
          applyLiveProduct(code, await response.json());
        } catch (error) { /* same-origin snapshot already applied */ }
      }));
      renderShop();
      if (popupOpen && draft) renderStep();
    }

    renderShop();
    refreshRealCount();
    hydrateCatalogue();
