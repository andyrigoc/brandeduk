(function () {
    'use strict';

    if (window.BrandedPcSearchInitialized || window.innerWidth < 700) return;
    window.BrandedPcSearchInitialized = true;

    var currentScript = document.currentScript;
    var scriptUrl = currentScript && currentScript.src
        ? new URL(currentScript.src, window.location.href)
        : new URL('brandedukv15-child/assets/js/pc-search.js', window.location.href);
    var projectRoot = new URL('../../../', scriptUrl);
    var SUGGEST_LIMIT = 12;
    var DEBOUNCE_MS = 200;
    var MIN_CHARS = 2;
    var input = document.getElementById('searchbarHeaderInput');
    var dropdown = document.getElementById('searchAutocomplete') ||
        document.getElementById('searchSuggestions');
    var requestController = null;
    var debounceTimer = null;
    var activeNormalized = '';
    var suggestCache = Object.create(null);
    var inflightKeys = Object.create(null);
    window.BrandedPcProductCache = window.BrandedPcProductCache || {};

    if (!input || !dropdown) return;

    input.dataset.acCustom = 'true';
    input.setAttribute('autocomplete', 'off');
    dropdown.classList.add('pc-search-results');
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-label', 'Search suggestions');

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

    function normalizeQuery(query) {
        return String(query || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }

    function productUrl(code) {
        return new URL('shop-pc.html?product=' + encodeURIComponent(code), projectRoot).href;
    }

    function shopUrl(query) {
        return new URL('shop-pc.html?q=' + encodeURIComponent(query), projectRoot).href;
    }

    function brandUrl(slug) {
        return new URL('shop-pc.html?brand=' + encodeURIComponent(slug), projectRoot).href;
    }

    function typeUrl(slug) {
        return new URL('shop-pc.html?productType=' + encodeURIComponent(slug), projectRoot).href;
    }

    function fallbackImage() {
        return new URL('brandedukv15-child/assets/images/ui/no-image.png', projectRoot).href;
    }

    function close() {
        dropdown.classList.remove('open', 'active');
        input.setAttribute('aria-expanded', 'false');
    }

    function open() {
        dropdown.classList.add('open', 'active');
        input.setAttribute('aria-expanded', 'true');
    }

    function highlight(text, query) {
        var raw = String(text == null ? '' : text);
        var q = String(query || '').trim();
        if (!q) return escapeHtml(raw);
        var escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return escapeHtml(raw).replace(
            new RegExp('(' + escaped + ')', 'ig'),
            '<mark>$1</mark>'
        );
    }

    function productCard(product, query) {
        var code = product.code || product.value || product.style_code || '';
        var name = product.label || product.name || product.product_name || code;
        var brand = product.brand || '';
        var image = product.image || product.main_image || fallbackImage();
        var priceVal = Number(product.price);
        var priceHtml = Number.isFinite(priceVal)
            ? '<span class="pc-search-product__price">From <strong>£' + priceVal.toFixed(2) + '</strong> ex. VAT</span>'
            : '';
        var brandLine = brand
            ? escapeHtml(brand) + (code ? ' · ' + escapeHtml(code) : '')
            : (code ? escapeHtml(code) : '');

        if (code) {
            window.BrandedPcProductCache[String(code)] = product;
        }

        return '<a class="pc-search-product" href="' + escapeHtml(productUrl(code)) +
            '" data-code="' + escapeHtml(code) + '" role="option">' +
            '<span class="pc-search-product__media"><img src="' + escapeHtml(image) +
            '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'' +
            escapeHtml(fallbackImage()) + '\'"></span>' +
            '<span class="pc-search-product__copy">' +
                '<span class="pc-search-product__name">' + highlight(name, query) + '</span>' +
                (brandLine ? '<span class="pc-search-product__brand">' + brandLine + '</span>' : '') +
                priceHtml +
            '</span>' +
        '</a>';
    }

    function textRow(item, href, iconLabel) {
        return '<a class="pc-search-suggest__item" href="' + escapeHtml(href) + '" role="option">' +
            '<span class="pc-search-suggest__icon" aria-hidden="true">' + escapeHtml(iconLabel) + '</span>' +
            '<span class="pc-search-suggest__copy">' +
                '<span class="pc-search-suggest__label">' + escapeHtml(item.label || item.value || '') + '</span>' +
            '</span>' +
        '</a>';
    }

    function render(payload, query) {
        var brands = Array.isArray(payload.brands) ? payload.brands : [];
        var types = Array.isArray(payload.types) ? payload.types : [];
        var products = Array.isArray(payload.products) ? payload.products.slice(0, SUGGEST_LIMIT) : [];
        var html = '';

        if (!brands.length && !types.length && !products.length) {
            dropdown.innerHTML = '<div class="pc-search-empty"><strong>No suggestions</strong>' +
                '<span>Try another product name, brand or code.</span></div>' +
                '<a class="pc-search-suggest__view-all" href="' + escapeHtml(shopUrl(query)) +
                '">Search all results for "' + escapeHtml(query) + '" →</a>';
            open();
            return;
        }

        if (brands.length) {
            html += '<div class="pc-search-suggest__group">' +
                '<div class="pc-search-suggest__title">Brands</div>' +
                '<div class="pc-search-suggest__grid">';
            brands.forEach(function (brand) {
                html += textRow(brand, brandUrl(brand.value || brand.slug || ''), 'B');
            });
            html += '</div></div>';
        }

        if (types.length) {
            html += '<div class="pc-search-suggest__group">' +
                '<div class="pc-search-suggest__title">Categories</div>' +
                '<div class="pc-search-suggest__grid">';
            types.forEach(function (type) {
                html += textRow(type, typeUrl(type.value || type.slug || ''), 'C');
            });
            html += '</div></div>';
        }

        if (products.length) {
            html += '<div class="pc-search-suggest__group pc-search-suggest__group--products">' +
                '<div class="pc-search-suggest__title">Products</div>' +
                '<div class="pc-search-grid">';
            products.forEach(function (product) {
                html += productCard(product, query);
            });
            html += '</div></div>';
        }

        html += '<a class="pc-search-suggest__view-all" href="' + escapeHtml(shopUrl(query)) +
            '">View all results for "' + escapeHtml(query) + '" →</a>';

        dropdown.innerHTML = html;
        open();
    }

    function clearInflight(key) {
        if (key) delete inflightKeys[key];
    }

    function abortActiveRequest() {
        if (requestController) {
            requestController.abort();
            requestController = null;
        }
        Object.keys(inflightKeys).forEach(function (key) {
            delete inflightKeys[key];
        });
    }

    function fetchSuggestions(query) {
        var normalized = normalizeQuery(query);
        if (normalized.length < MIN_CHARS) {
            activeNormalized = '';
            close();
            return;
        }

        if (suggestCache[normalized]) {
            activeNormalized = normalized;
            render(suggestCache[normalized], query.trim());
            return;
        }

        if (inflightKeys[normalized]) {
            activeNormalized = normalized;
            return;
        }

        abortActiveRequest();

        var controller = new AbortController();
        requestController = controller;
        activeNormalized = normalized;
        inflightKeys[normalized] = true;

        var url = getApiBase() + '/api/products/suggest?q=' + encodeURIComponent(query.trim()) +
            '&limit=' + SUGGEST_LIMIT;

        fetch(url, { signal: controller.signal })
            .then(function (response) {
                if (!response.ok) throw new Error('Suggest request failed');
                return response.json();
            })
            .then(function (data) {
                clearInflight(normalized);
                if (requestController === controller) requestController = null;
                suggestCache[normalized] = data || {};
                if (activeNormalized !== normalized) return;
                render(suggestCache[normalized], query.trim());
            })
            .catch(function (error) {
                clearInflight(normalized);
                if (requestController === controller) requestController = null;
                if (error && error.name === 'AbortError') return;
                if (activeNormalized !== normalized) return;
                // Keep previous suggestions visible on soft failure; only show error if empty.
                if (!dropdown.classList.contains('open') || !dropdown.innerHTML) {
                    dropdown.innerHTML = '<div class="pc-search-empty"><strong>Search is unavailable</strong>' +
                        '<span>Please try again in a moment.</span></div>';
                    open();
                }
            });
    }

    function scheduleSuggest() {
        var query = input.value.trim();
        clearTimeout(debounceTimer);

        if (query.length < MIN_CHARS) {
            activeNormalized = '';
            abortActiveRequest();
            close();
            return;
        }

        var normalized = normalizeQuery(query);
        if (suggestCache[normalized]) {
            activeNormalized = normalized;
            render(suggestCache[normalized], query);
            return;
        }

        debounceTimer = setTimeout(function () {
            fetchSuggestions(query);
        }, DEBOUNCE_MS);
    }

    function submit() {
        var query = input.value.trim();
        if (!query) return;
        window.location.href = shopUrl(query);
    }

    input.addEventListener('input', scheduleSuggest);

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            submit();
        } else if (event.key === 'Escape') {
            close();
        }
    });

    dropdown.addEventListener('click', function (event) {
        var product = event.target.closest('.pc-search-product');
        if (product && product.dataset.code) {
            sessionStorage.setItem('selectedProduct', product.dataset.code);
            var cachedProduct = window.BrandedPcProductCache[product.dataset.code];
            if (cachedProduct) {
                sessionStorage.setItem('selectedProductData', JSON.stringify(cachedProduct));
            }
        }
    });

    var lens = input.parentElement && input.parentElement.querySelector('.search-icon-expand');
    if (lens) lens.addEventListener('click', submit);

    document.addEventListener('click', function (event) {
        if (!event.target.closest('.searchbar-header__search-expand')) close();
    });
})();
