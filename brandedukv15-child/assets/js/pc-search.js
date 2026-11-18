(function () {
    'use strict';

    /*
     * Desktop header search: instant suggestions, ghost completion, keyboard
     * navigation, recent/popular searches and related searches on the results page.
     * Backed by GET /api/products/suggest (in-memory engine, ~1ms server time).
     */

    if (window.BrandedPcSearchInitialized || window.innerWidth < 700) return;
    window.BrandedPcSearchInitialized = true;

    var currentScript = document.currentScript;
    var scriptUrl = currentScript && currentScript.src
        ? new URL(currentScript.src, window.location.href)
        : new URL('brandedukv15-child/assets/js/pc-search.js', window.location.href);
    var projectRoot = new URL('../../../', scriptUrl);

    var SUGGEST_LIMIT = 12;
    var DEBOUNCE_MS = 90;
    var LOADING_DELAY_MS = 160;
    var CLIENT_CACHE_SIZE = 120;
    var RECENT_KEY = 'bduk_recent_searches_v1';
    var RECENT_MAX = 6;

    var input = document.getElementById('searchbarHeaderInput');
    var dropdown = document.getElementById('searchAutocomplete') ||
        document.getElementById('searchSuggestions');

    window.BrandedPcProductCache = window.BrandedPcProductCache || {};

    var state = {
        controller: null,
        debounceTimer: null,
        loadingTimer: null,
        activeKey: '',
        payload: null,
        payloadQuery: '',
        navIndex: -1,
        popular: null,
        popularPromise: null,
        cache: new Map()
    };

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    function getApiBase() {
        var base = typeof window.resolveBrandedApiBase === 'function'
            ? window.resolveBrandedApiBase()
            : (window.API_BASE_URL || 'https://api.brandeduk.com');
        return String(base || 'https://api.brandeduk.com').replace(/\/+$/, '');
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function fold(value) {
        var text = String(value == null ? '' : value).toLowerCase();
        if (typeof text.normalize === 'function') text = text.normalize('NFKD').replace(/[̀-ͯ]/g, '');
        return text;
    }

    function normalizeKey(query) {
        return fold(query).replace(/\s+/g, ' ').replace(/^ /, '');
    }

    function canonicalSearchQuery(query) {
        return typeof window.normalizeBrandedProductSearchQuery === 'function'
            ? window.normalizeBrandedProductSearchQuery(query)
            : String(query || '').trim();
    }

    function productUrl(code) {
        return new URL('/shop-pc?product=' + encodeURIComponent(code), projectRoot).href;
    }

    function shopUrl(query) {
        return new URL('/shop-pc?q=' + encodeURIComponent(canonicalSearchQuery(query)), projectRoot).href;
    }

    function brandUrl(name) {
        return new URL('/shop-pc?brand=' + encodeURIComponent(name), projectRoot).href;
    }

    function typeUrl(slug) {
        return new URL('/shop-pc?productType=' + encodeURIComponent(slug), projectRoot).href;
    }

    function fallbackImage() {
        return new URL('brandedukv15-child/assets/images/ui/no-image.png', projectRoot).href;
    }

    function safeStorage(kind) {
        try {
            var storage = window[kind];
            var probe = '__bduk_probe__';
            storage.setItem(probe, '1');
            storage.removeItem(probe);
            return storage;
        } catch (error) {
            return null;
        }
    }

    /** Bold the parts of each word that the shopper has typed (JRS style). */
    function emphasise(label, query) {
        var typed = fold(query).split(/[^a-z0-9]+/).filter(Boolean);
        var text = String(label == null ? '' : label);
        if (!typed.length) return escapeHtml(text);
        var out = '';
        var last = 0;
        var wordRe = /[A-Za-z0-9À-ɏ]+/g;
        var match;
        while ((match = wordRe.exec(text))) {
            var word = match[0];
            var folded = fold(word);
            var best = 0;
            for (var i = 0; i < typed.length; i++) {
                if (folded.indexOf(typed[i]) === 0 && typed[i].length > best) best = typed[i].length;
            }
            out += escapeHtml(text.slice(last, match.index));
            if (best) {
                var cut = Math.min(best, word.length);
                out += '<strong>' + escapeHtml(word.slice(0, cut)) + '</strong>' + escapeHtml(word.slice(cut));
            } else {
                out += escapeHtml(word);
            }
            last = match.index + word.length;
        }
        return out + escapeHtml(text.slice(last));
    }

    function highlight(text, query) {
        var raw = String(text == null ? '' : text);
        var words = String(query || '').trim().split(/\s+/).filter(function (word) { return word.length > 1; });
        if (!words.length) return escapeHtml(raw);
        var pattern = words.map(function (word) {
            return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('|');
        return escapeHtml(raw).replace(new RegExp('(' + pattern + ')', 'ig'), '<mark>$1</mark>');
    }

    // ------------------------------------------------------------------
    // Recent searches (per browser) and popular searches (from the API)
    // ------------------------------------------------------------------

    function readRecent() {
        var storage = safeStorage('localStorage');
        if (!storage) return [];
        try {
            var list = JSON.parse(storage.getItem(RECENT_KEY) || '[]');
            return Array.isArray(list) ? list.filter(function (item) { return typeof item === 'string' && item.trim(); }) : [];
        } catch (error) {
            return [];
        }
    }

    function writeRecent(list) {
        var storage = safeStorage('localStorage');
        if (!storage) return;
        try { storage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX))); } catch (error) { /* ignore */ }
    }

    function rememberSearch(query) {
        var value = String(query || '').trim();
        if (value.length < 2) return;
        var key = normalizeKey(value);
        var list = readRecent().filter(function (item) { return normalizeKey(item) !== key; });
        list.unshift(value);
        writeRecent(list);
    }

    function forgetSearch(query) {
        var key = normalizeKey(query);
        writeRecent(readRecent().filter(function (item) { return normalizeKey(item) !== key; }));
    }

    function loadPopular() {
        if (state.popular) return Promise.resolve(state.popular);
        if (state.popularPromise) return state.popularPromise;
        state.popularPromise = fetch(getApiBase() + '/api/products/suggest?popular=1')
            .then(function (response) { return response.ok ? response.json() : {}; })
            .then(function (data) {
                state.popular = Array.isArray(data.popular) ? data.popular.slice(0, 10) : [];
                return state.popular;
            })
            .catch(function () {
                state.popular = [];
                return state.popular;
            });
        return state.popularPromise;
    }

    // ------------------------------------------------------------------
    // Ghost completion (grey text that finishes the word in the input)
    // ------------------------------------------------------------------

    var ghost = null;
    var ghostTyped = null;
    var ghostRest = null;
    var ghostValue = '';

    function ensureGhost() {
        if (ghost || !input.parentElement) return;
        ghost = document.createElement('span');
        ghost.className = 'pc-search-ghost';
        ghost.setAttribute('aria-hidden', 'true');
        ghostTyped = document.createElement('span');
        ghostTyped.className = 'pc-search-ghost__typed';
        ghostRest = document.createElement('span');
        ghostRest.className = 'pc-search-ghost__rest';
        ghost.appendChild(ghostTyped);
        ghost.appendChild(ghostRest);
        input.insertAdjacentElement('afterend', ghost);
    }

    function hideGhost() {
        ghostValue = '';
        if (ghost) ghost.classList.remove('is-visible');
    }

    function positionGhost() {
        var host = ghost.offsetParent || input.parentElement;
        if (!host) return false;
        var inputRect = input.getBoundingClientRect();
        var hostRect = host.getBoundingClientRect();
        var style = window.getComputedStyle(input);
        ghost.style.left = (inputRect.left - hostRect.left + host.scrollLeft) + 'px';
        ghost.style.top = (inputRect.top - hostRect.top + host.scrollTop) + 'px';
        ghost.style.width = inputRect.width + 'px';
        ghost.style.height = inputRect.height + 'px';
        ghost.style.lineHeight = input.clientHeight + 'px';
        ghost.style.paddingLeft = (parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth)) + 'px';
        ghost.style.paddingRight = (parseFloat(style.paddingRight) + parseFloat(style.borderRightWidth)) + 'px';
        ghost.style.fontFamily = style.fontFamily;
        ghost.style.fontSize = style.fontSize;
        ghost.style.fontWeight = style.fontWeight;
        ghost.style.fontStyle = style.fontStyle;
        ghost.style.letterSpacing = style.letterSpacing;
        ghost.style.textTransform = style.textTransform;
        ghost.style.textIndent = style.textIndent;
        return true;
    }

    function updateGhost() {
        var payload = state.payload;
        var value = input.value;
        var completion = payload && payload.completion ? String(payload.completion) : '';
        var caretAtEnd = input.selectionStart === value.length && input.selectionEnd === value.length;
        var matches = completion && value.length >= 2 &&
            completion.length > value.length &&
            completion.toLowerCase().indexOf(value.toLowerCase()) === 0 &&
            normalizeKey(value) === state.payloadQuery;
        if (!matches || !caretAtEnd || document.activeElement !== input || input.scrollWidth > input.clientWidth + 1) {
            hideGhost();
            return;
        }
        ensureGhost();
        if (!ghost || !positionGhost()) return;
        ghostTyped.textContent = value;
        ghostRest.textContent = completion.slice(value.length);
        ghostValue = value + completion.slice(value.length);
        ghost.classList.add('is-visible');
    }

    function acceptGhost() {
        if (!ghostValue) return false;
        input.value = ghostValue;
        hideGhost();
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (error) { /* ignore */ }
        scheduleSuggest(true);
        return true;
    }

    // ------------------------------------------------------------------
    // Dropdown rendering
    // ------------------------------------------------------------------

    function close() {
        dropdown.classList.remove('open', 'active', 'is-loading');
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        state.navIndex = -1;
        hideGhost();
    }

    function open() {
        dropdown.classList.add('open', 'active');
        input.setAttribute('aria-expanded', 'true');
    }

    function navId(index) {
        return 'pcs-opt-' + index;
    }

    function finalizeNav() {
        var items = dropdown.querySelectorAll('[data-nav]');
        for (var i = 0; i < items.length; i++) {
            items[i].id = navId(i);
            items[i].setAttribute('role', 'option');
            items[i].setAttribute('aria-selected', 'false');
        }
        state.navIndex = -1;
        input.removeAttribute('aria-activedescendant');
    }

    function chipHtml(chip, query, extraClass) {
        var label = chip.label || chip.value || '';
        var value = chip.value || label;
        return '<a class="pcs-chip' + (extraClass ? ' ' + extraClass : '') + '" data-nav data-search="' +
            escapeHtml(value) + '" href="' + escapeHtml(shopUrl(value)) + '"><span class="pcs-chip__text">' +
            emphasise(label, query) + '</span></a>';
    }

    function productCard(product, query) {
        var code = product.code || product.value || product.style_code || '';
        var name = product.label || product.name || product.product_name || code;
        var brand = product.brand || '';
        var image = product.image || product.main_image || fallbackImage();
        var priceVal = Number(product.price);
        var priceHtml = Number.isFinite(priceVal) && priceVal > 0
            ? '<span class="pc-search-product__price">From <strong>£' + priceVal.toFixed(2) + '</strong> ex. VAT</span>'
            : '';
        var brandLine = brand
            ? escapeHtml(brand) + (code ? ' · ' + escapeHtml(code) : '')
            : (code ? escapeHtml(code) : '');

        if (code) window.BrandedPcProductCache[String(code)] = product;

        var leafHtml = (window.BrandedOrganicLeaf && window.BrandedOrganicLeaf.maybeLeafHtml)
            ? window.BrandedOrganicLeaf.maybeLeafHtml(product, 'pc-search-product__leaf')
            : '';

        return '<a class="pc-search-product' + (leafHtml ? ' has-eco-leaf' : '') +
            '" data-nav href="' + escapeHtml(productUrl(code)) +
            '" data-code="' + escapeHtml(code) + '">' +
            '<span class="pc-search-product__media"><img src="' + escapeHtml(image) +
            '" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' +
            escapeHtml(fallbackImage()) + '\'">' +
            '</span>' +
            '<span class="pc-search-product__copy">' +
                '<span class="pc-search-product__name">' + highlight(name, query) + '</span>' +
                (brandLine ? '<span class="pc-search-product__brand">' + brandLine + '</span>' : '') +
                priceHtml +
            '</span>' +
            leafHtml +
        '</a>';
    }

    function asideLink(label, count, href, kind) {
        return '<a class="pcs-aside__link" data-nav data-kind="' + kind + '" href="' + escapeHtml(href) + '">' +
            '<span class="pcs-aside__label">' + escapeHtml(label) + '</span>' +
            (count ? '<span class="pcs-aside__count">' + Number(count).toLocaleString('en-GB') + '</span>' : '') +
        '</a>';
    }

    function footerHtml(query) {
        return '<div class="pc-search-footer">' +
            '<span class="pcs-keys" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> to browse · <kbd>Enter</kbd> to open · <kbd>Tab</kbd> to complete · <kbd>Esc</kbd> to close</span>' +
            '<a class="pc-search-suggest__view-all" data-nav data-search="' + escapeHtml(query) + '" href="' +
            escapeHtml(shopUrl(query)) + '">See all results for “' + escapeHtml(query) + '” →</a>' +
        '</div>';
    }

    function render(payload, query) {
        var suggestions = Array.isArray(payload.suggestions) ? payload.suggestions
            : (Array.isArray(payload.keywords) ? payload.keywords : []);
        var brands = Array.isArray(payload.brands) ? payload.brands.slice(0, 3) : [];
        var types = Array.isArray(payload.types) ? payload.types.slice(0, 3) : [];
        var products = Array.isArray(payload.products) ? payload.products.slice(0, SUGGEST_LIMIT) : [];
        var corrected = payload.correctedQuery ? String(payload.correctedQuery) : '';
        var effectiveQuery = corrected || query;
        var html = '';

        if (!suggestions.length && !brands.length && !types.length && !products.length) {
            renderEmpty(query);
            return;
        }

        if (corrected) {
            html += '<div class="pcs-dym">Showing matches for <strong>' + escapeHtml(corrected) + '</strong>' +
                '<a data-nav data-search="' + escapeHtml(query) + '" href="' + escapeHtml(shopUrl(query)) +
                '">Search for “' + escapeHtml(query) + '” instead</a></div>';
        }

        if (suggestions.length) {
            html += '<div class="pcs-chips" role="group" aria-label="Suggested searches">';
            suggestions.slice(0, 6).forEach(function (chip) { html += chipHtml(chip, effectiveQuery); });
            html += '</div>';
        }

        var hasAside = brands.length || types.length;
        html += '<div class="pcs-body' + (hasAside ? ' has-aside' : '') + '">';
        if (hasAside) {
            html += '<aside class="pcs-aside">';
            if (types.length) {
                html += '<div class="pcs-section-title">Categories</div>';
                types.forEach(function (type) {
                    html += asideLink(type.label, type.count, typeUrl(type.value || type.slug || ''), 'type');
                });
            }
            if (brands.length) {
                html += '<div class="pcs-section-title">Brands</div>';
                brands.forEach(function (brand) {
                    html += asideLink(brand.label, brand.count, brandUrl(brand.label || brand.value || ''), 'brand');
                });
            }
            html += '</aside>';
        }
        html += '<section class="pcs-products">';
        if (products.length) {
            html += '<div class="pcs-section-title">Products</div><div class="pc-search-grid">';
            products.forEach(function (product) { html += productCard(product, effectiveQuery); });
            html += '</div>';
        } else {
            html += '<div class="pc-search-empty"><strong>No exact product matches yet</strong>' +
                '<span>Pick a suggestion above or see everything we have for “' + escapeHtml(query) + '”.</span></div>';
        }
        html += '</section></div>';
        html += footerHtml(corrected || query);

        dropdown.innerHTML = html;
        finalizeNav();
        open();
    }

    function renderEmpty(query) {
        var popular = state.popular || [];
        var html = '<div class="pc-search-empty"><strong>No matches for “' + escapeHtml(query) + '”</strong>' +
            '<span>Check the spelling, try a product code (e.g. JH001) or one of these:</span></div>';
        if (popular.length) {
            html += '<div class="pcs-chips pcs-chips--center" role="group" aria-label="Popular searches">';
            popular.forEach(function (chip) { html += chipHtml(chip, ''); });
            html += '</div>';
        }
        html += footerHtml(query);
        dropdown.innerHTML = html;
        finalizeNav();
        open();
        if (!state.popular) loadPopular().then(function () {
            if (normalizeKey(input.value) === normalizeKey(query) && dropdown.classList.contains('open')) renderEmpty(query);
        });
    }

    function renderStart() {
        var recent = readRecent();
        var popular = state.popular || [];
        if (!recent.length && !popular.length) {
            loadPopular().then(function (list) {
                if (!input.value.trim() && document.activeElement === input && list.length) renderStart();
            });
            return;
        }
        var html = '';
        if (recent.length) {
            html += '<div class="pcs-start__head"><span class="pcs-section-title">Recent searches</span>' +
                '<button type="button" class="pcs-clear" data-clear-recent>Clear</button></div>' +
                '<div class="pcs-chips" role="group" aria-label="Recent searches">';
            recent.forEach(function (item) {
                html += '<span class="pcs-chip-wrap">' + chipHtml({ label: item, value: item }, '', 'pcs-chip--recent') +
                    '<button type="button" class="pcs-chip-remove" data-forget="' + escapeHtml(item) +
                    '" aria-label="Remove ' + escapeHtml(item) + ' from recent searches">×</button></span>';
            });
            html += '</div>';
        }
        if (popular.length) {
            html += '<div class="pcs-start__head"><span class="pcs-section-title">Popular searches</span></div>' +
                '<div class="pcs-chips" role="group" aria-label="Popular searches">';
            popular.forEach(function (chip) { html += chipHtml(chip, ''); });
            html += '</div>';
        }
        dropdown.innerHTML = '<div class="pcs-start">' + html + '</div>';
        finalizeNav();
        open();
        if (!state.popular) loadPopular().then(function (list) {
            if (!input.value.trim() && document.activeElement === input && list.length) renderStart();
        });
    }

    // ------------------------------------------------------------------
    // Fetching
    // ------------------------------------------------------------------

    function cacheGet(key) {
        var value = state.cache.get(key);
        if (!value) return null;
        state.cache.delete(key);
        state.cache.set(key, value);
        return value;
    }

    function cacheSet(key, value) {
        state.cache.set(key, value);
        if (state.cache.size > CLIENT_CACHE_SIZE) state.cache.delete(state.cache.keys().next().value);
    }

    function show(payload, query, key) {
        state.payload = payload;
        state.payloadQuery = key;
        render(payload, query);
        updateGhost();
    }

    function abortActive() {
        if (state.controller) {
            state.controller.abort();
            state.controller = null;
        }
        clearTimeout(state.loadingTimer);
        dropdown.classList.remove('is-loading');
    }

    function fetchSuggestions(rawQuery) {
        var query = canonicalSearchQuery(rawQuery);
        var key = normalizeKey(rawQuery);
        if (!key.trim()) return;

        var cached = cacheGet(key);
        if (cached) {
            state.activeKey = key;
            show(cached, rawQuery.trim(), key);
            return;
        }

        abortActive();
        var controller = new AbortController();
        state.controller = controller;
        state.activeKey = key;
        state.loadingTimer = setTimeout(function () {
            if (state.activeKey === key) dropdown.classList.add('is-loading');
        }, LOADING_DELAY_MS);

        // Keep the trailing space: "hard " completes differently from "hard".
        var requestQuery = /\s$/.test(rawQuery) ? query + ' ' : query;
        var url = getApiBase() + '/api/products/suggest?q=' + encodeURIComponent(requestQuery) + '&limit=' + SUGGEST_LIMIT;

        fetch(url, { signal: controller.signal })
            .then(function (response) {
                if (!response.ok) throw new Error('Suggest request failed');
                return response.json();
            })
            .then(function (data) {
                if (state.controller === controller) state.controller = null;
                clearTimeout(state.loadingTimer);
                dropdown.classList.remove('is-loading');
                var payload = data || {};
                cacheSet(key, payload);
                if (state.activeKey !== key) return;
                show(payload, rawQuery.trim(), key);
            })
            .catch(function (error) {
                if (state.controller === controller) state.controller = null;
                clearTimeout(state.loadingTimer);
                dropdown.classList.remove('is-loading');
                if (error && error.name === 'AbortError') return;
                if (state.activeKey !== key) return;
                // Keep previous suggestions on a soft failure; only explain when empty.
                if (!dropdown.classList.contains('open') || !dropdown.innerHTML) {
                    dropdown.innerHTML = '<div class="pc-search-empty"><strong>Search is unavailable</strong>' +
                        '<span>Please press Enter to search, or try again in a moment.</span></div>';
                    open();
                }
            });
    }

    function scheduleSuggest(immediate) {
        var raw = input.value;
        clearTimeout(state.debounceTimer);

        if (!raw.trim()) {
            state.activeKey = '';
            state.payload = null;
            abortActive();
            hideGhost();
            if (document.activeElement === input) renderStart(); else close();
            return;
        }

        var key = normalizeKey(raw);
        var cached = cacheGet(key);
        if (cached) {
            state.activeKey = key;
            abortActive();
            show(cached, raw.trim(), key);
            return;
        }

        // Ghost text that no longer matches must disappear immediately.
        updateGhost();
        if (immediate) {
            fetchSuggestions(raw);
        } else {
            state.debounceTimer = setTimeout(function () { fetchSuggestions(raw); }, DEBOUNCE_MS);
        }
    }

    // ------------------------------------------------------------------
    // Navigation and submission
    // ------------------------------------------------------------------

    function navItems() {
        return dropdown.classList.contains('open') ? dropdown.querySelectorAll('[data-nav]') : [];
    }

    function setActive(index) {
        var items = navItems();
        if (!items.length) return;
        if (state.navIndex >= 0 && items[state.navIndex]) {
            items[state.navIndex].classList.remove('is-active');
            items[state.navIndex].setAttribute('aria-selected', 'false');
        }
        if (index < -1) index = items.length - 1;
        if (index >= items.length) index = -1;
        state.navIndex = index;
        if (index === -1) {
            input.removeAttribute('aria-activedescendant');
            return;
        }
        var item = items[index];
        item.classList.add('is-active');
        item.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', item.id);
        if (typeof item.scrollIntoView === 'function') item.scrollIntoView({ block: 'nearest' });
    }

    function remember(element) {
        if (!element) return;
        if (element.hasAttribute('data-search')) rememberSearch(element.getAttribute('data-search'));
        if (element.classList.contains('pc-search-product') && element.dataset.code) {
            rememberSearch(input.value);
            var storage = safeStorage('sessionStorage');
            if (storage) {
                try {
                    storage.setItem('selectedProduct', element.dataset.code);
                    var cachedProduct = window.BrandedPcProductCache[element.dataset.code];
                    if (cachedProduct) storage.setItem('selectedProductData', JSON.stringify(cachedProduct));
                } catch (error) { /* ignore */ }
            }
        }
        if (element.classList.contains('pcs-aside__link')) rememberSearch(input.value);
    }

    function submit() {
        var query = input.value.trim();
        if (!query) return;
        rememberSearch(query);
        window.location.href = shopUrl(query);
    }

    // ------------------------------------------------------------------
    // Results page: related searches + did-you-mean under the results header
    // ------------------------------------------------------------------

    function initRelatedSearches() {
        if (!/shop-pc(\.html)?$/i.test(window.location.pathname)) return;
        var params = new URLSearchParams(window.location.search);
        var query = (params.get('q') || '').trim();
        if (!query) return;
        var header = document.querySelector('.products-header');
        if (!header || document.querySelector('.pcs-related')) return;

        fetch(getApiBase() + '/api/products/suggest?q=' + encodeURIComponent(query) + '&limit=1')
            .then(function (response) { return response.ok ? response.json() : null; })
            .then(function (data) {
                if (!data) return;
                var current = normalizeKey(query).replace(/s\b/g, '');
                var chips = (Array.isArray(data.suggestions) ? data.suggestions : []).filter(function (chip) {
                    return normalizeKey(chip.label).replace(/s\b/g, '') !== current;
                }).slice(0, 8);
                if (!chips.length && !data.correctedQuery) return;
                var html = '';
                if (data.correctedQuery) {
                    html += '<span class="pcs-related__dym">Did you mean <a href="' + escapeHtml(shopUrl(data.correctedQuery)) +
                        '" data-search="' + escapeHtml(data.correctedQuery) + '">' + escapeHtml(data.correctedQuery) + '</a>?</span>';
                }
                if (chips.length) {
                    html += '<span class="pcs-related__label">Related searches</span>';
                    chips.forEach(function (chip) {
                        html += '<a class="pcs-chip" data-search="' + escapeHtml(chip.value || chip.label) + '" href="' +
                            escapeHtml(shopUrl(chip.value || chip.label)) + '">' + escapeHtml(chip.label) + '</a>';
                    });
                }
                var strip = document.createElement('nav');
                strip.className = 'pcs-related';
                strip.setAttribute('aria-label', 'Related searches');
                strip.innerHTML = html;
                strip.addEventListener('click', function (event) {
                    var link = event.target.closest('[data-search]');
                    if (link) rememberSearch(link.getAttribute('data-search'));
                });
                header.insertAdjacentElement('afterend', strip);
            })
            .catch(function () { /* related searches are optional */ });
    }

    // ------------------------------------------------------------------
    // Wiring
    // ------------------------------------------------------------------

    if (!input || !dropdown) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initRelatedSearches);
        } else {
            initRelatedSearches();
        }
        return;
    }

    input.dataset.acCustom = 'true';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'both');
    input.setAttribute('aria-expanded', 'false');
    if (!dropdown.id) dropdown.id = 'searchAutocomplete';
    input.setAttribute('aria-controls', dropdown.id);
    dropdown.classList.add('pc-search-results');
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-label', 'Search suggestions');

    input.addEventListener('input', function () {
        state.navIndex = -1;
        scheduleSuggest(false);
    });

    input.addEventListener('focus', function () {
        if (input.value.trim()) scheduleSuggest(true);
        else renderStart();
    });

    input.addEventListener('keydown', function (event) {
        var key = event.key;
        if (key === 'ArrowDown' || key === 'ArrowUp') {
            if (!dropdown.classList.contains('open')) {
                scheduleSuggest(true);
                event.preventDefault();
                return;
            }
            event.preventDefault();
            hideGhost();
            setActive(state.navIndex + (key === 'ArrowDown' ? 1 : -1));
        } else if (key === 'Tab' && !event.shiftKey && ghostValue) {
            event.preventDefault();
            acceptGhost();
        } else if (key === 'ArrowRight' && ghostValue && input.selectionStart === input.value.length) {
            event.preventDefault();
            acceptGhost();
        } else if (key === 'Enter') {
            event.preventDefault();
            var items = navItems();
            var active = state.navIndex >= 0 ? items[state.navIndex] : null;
            if (active) {
                remember(active);
                window.location.href = active.href;
            } else {
                submit();
            }
        } else if (key === 'Escape') {
            if (ghostValue) hideGhost();
            else close();
        }
    });

    input.addEventListener('keyup', function (event) {
        if (event.key === 'ArrowLeft' || event.key === 'Home' || event.key === 'End') updateGhost();
    });
    input.addEventListener('blur', hideGhost);
    input.addEventListener('scroll', hideGhost);
    window.addEventListener('resize', function () { if (ghostValue) updateGhost(); });

    dropdown.addEventListener('mousedown', function (event) {
        // Keep focus in the input while clicking buttons inside the dropdown.
        if (event.target.closest('button')) event.preventDefault();
    });

    dropdown.addEventListener('click', function (event) {
        var forget = event.target.closest('[data-forget]');
        if (forget) {
            event.preventDefault();
            forgetSearch(forget.getAttribute('data-forget'));
            renderStart();
            input.focus();
            return;
        }
        if (event.target.closest('[data-clear-recent]')) {
            event.preventDefault();
            writeRecent([]);
            renderStart();
            input.focus();
            return;
        }
        remember(event.target.closest('[data-nav]'));
    });

    dropdown.addEventListener('mousemove', function (event) {
        var item = event.target.closest('[data-nav]');
        if (!item) return;
        var items = navItems();
        for (var i = 0; i < items.length; i++) {
            if (items[i] === item) {
                if (i !== state.navIndex) setActive(i);
                return;
            }
        }
    });

    var lens = input.parentElement && input.parentElement.querySelector('.search-icon-expand');
    if (lens) lens.addEventListener('click', submit);

    document.addEventListener('click', function (event) {
        if (event.target === input || dropdown.contains(event.target)) return;
        if (!event.target.closest('.searchbar-header__search-expand')) close();
    });

    // Warm the popular list in the background so the empty-box state is instant.
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(function () { loadPopular(); }, { timeout: 4000 });
    } else {
        setTimeout(loadPopular, 2500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRelatedSearches);
    } else {
        initRelatedSearches();
    }
})();
