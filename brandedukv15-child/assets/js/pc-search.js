(function () {
    'use strict';

    if (window.BrandedPcSearchInitialized || window.innerWidth < 1024) return;
    window.BrandedPcSearchInitialized = true;

    var currentScript = document.currentScript;
    var scriptUrl = currentScript && currentScript.src
        ? new URL(currentScript.src, window.location.href)
        : new URL('brandedukv15-child/assets/js/pc-search.js', window.location.href);
    var projectRoot = new URL('../../../', scriptUrl);
    var apiUrl = 'https://api.brandeduk.com/api/products';
    var pageSize = 12;
    var input = document.getElementById('searchbarHeaderInput');
    var dropdown = document.getElementById('searchAutocomplete');
    var requestController = null;
    var debounceTimer = null;
    var activeQuery = '';

    // Exact category searches use productType so autocomplete, shop results,
    // filters and homepage category links all report the same catalogue total.
    var exactProductTypes = {
        't shirt': 'T-Shirts', 't shirts': 'T-Shirts', 'tshirt': 'T-Shirts', 'tshirts': 'T-Shirts',
        'tee': 'T-Shirts', 'tees': 'T-Shirts', 'tee shirt': 'T-Shirts', 'tee shirts': 'T-Shirts',
        'polo': 'Polos', 'polos': 'Polos', 'polo shirt': 'Polos', 'polo shirts': 'Polos',
        'hoodie': 'Hoodies', 'hoodies': 'Hoodies', 'hooded top': 'Hoodies', 'hooded tops': 'Hoodies',
        'sweatshirt': 'Sweatshirts', 'sweatshirts': 'Sweatshirts',
        'fleece': 'Fleece', 'fleeces': 'Fleece', 'jacket': 'Jackets', 'jackets': 'Jackets',
        'softshell': 'Softshells', 'softshells': 'Softshells', 'soft shell': 'Softshells', 'soft shells': 'Softshells',
        'gilet': 'Gilets & Body Warmers', 'gilets': 'Gilets & Body Warmers',
        'bodywarmer': 'Gilets & Body Warmers', 'bodywarmers': 'Gilets & Body Warmers',
        'body warmer': 'Gilets & Body Warmers', 'body warmers': 'Gilets & Body Warmers',
        'cap': 'Caps', 'caps': 'Caps', 'beanie': 'Beanies', 'beanies': 'Beanies',
        'shirt': 'Shirts', 'shirts': 'Shirts', 'bag': 'Bags', 'bags': 'Bags',
        'apron': 'Aprons', 'aprons': 'Aprons', 'trouser': 'Trousers', 'trousers': 'Trousers',
        'short': 'Shorts', 'shorts': 'Shorts', 'sweatpant': 'Sweatpants', 'sweatpants': 'Sweatpants',
        'jogger': 'Sweatpants', 'joggers': 'Sweatpants', 'vest': 'Vests (t-shirt)', 'vests': 'Vests (t-shirt)',
        't shirt vest': 'Vests (t-shirt)', 't shirt vests': 'Vests (t-shirt)',
        'hat': 'Hats', 'hats': 'Hats', 'towel': 'Towels', 'towels': 'Towels',
        'knitwear': 'Knitted Jumpers', 'knitted jumper': 'Knitted Jumpers', 'knitted jumpers': 'Knitted Jumpers',
        'jumper': 'Knitted Jumpers', 'jumpers': 'Knitted Jumpers', 'legging': 'Leggings', 'leggings': 'Leggings',
        'soft toy': 'Soft Toys', 'soft toys': 'Soft Toys', 'hi vis': 'Hi Vis', 'hi viz': 'Hi Vis',
        'high vis': 'Hi Vis', 'high visibility': 'Hi Vis', 'safety vest': 'Hi Vis', 'safety vests': 'Hi Vis',
        'glove': 'Gloves', 'gloves': 'Gloves', 'accessory': 'Accessories', 'accessories': 'Accessories',
        'sock': 'Socks', 'socks': 'Socks', 'baselayer': 'Baselayers', 'baselayers': 'Baselayers',
        'base layer': 'Baselayers', 'base layers': 'Baselayers', 'blanket': 'Blankets', 'blankets': 'Blankets',
        'blouse': 'Blouses', 'blouses': 'Blouses', 'snood': 'Snoods', 'snoods': 'Snoods',
        'boot': 'Boots', 'boots': 'Boots', 'scarf': 'Scarves', 'scarves': 'Scarves',
        'trackwear': 'Trackwear', 'trainer': 'Trainers', 'trainers': 'Trainers', 'tie': 'Ties', 'ties': 'Ties',
        'dress': 'Dresses', 'dresses': 'Dresses', 'chino': 'Chinos', 'chinos': 'Chinos',
        'chef jacket': 'Chef Jackets', 'chef jackets': 'Chef Jackets', 'chefswear': 'Chef Jackets',
        'cardigan': 'Cardigans', 'cardigans': 'Cardigans', 'robe': 'Robes', 'robes': 'Robes',
        'belt': 'Belts', 'belts': 'Belts', 'loungewear bottom': 'Loungewear Bottoms',
        'loungewear bottoms': 'Loungewear Bottoms', 'bodysuit': 'Bodysuits', 'bodysuits': 'Bodysuits',
        'rain suit': 'Rain Suits', 'rain suits': 'Rain Suits', 'tunic': 'Tunics', 'tunics': 'Tunics',
        'tabard': 'Tabards', 'tabards': 'Tabards', 'coverall': 'Coveralls', 'coveralls': 'Coveralls',
        'keyring': 'Keyrings', 'keyrings': 'Keyrings', 'waistcoat': 'Waistcoats', 'waistcoats': 'Waistcoats',
        'bra': 'Bras', 'bras': 'Bras', 'sports overtop': 'Sports Overtops', 'sports overtops': 'Sports Overtops',
        'anti static': 'anti-static', 'anti static esd': 'anti-static', 'esd': 'anti-static', 'arc flash': 'arc-flash',
        'autumn workwear': 'autumn-workwear', 'bib and brace': 'bib-brace-overalls',
        'bib brace': 'bib-brace-overalls', 'bib and brace overalls': 'bib-brace-overalls',
        'bib brace overalls': 'bib-brace-overalls', 'bodywarmers and gilets': 'Gilets & Body Warmers',
        'chainsaw clothing': 'chainsaw-forestry', 'chainsaw and forestry': 'chainsaw-forestry',
        'forestry clothing': 'chainsaw-forestry', 'chem splash': 'chem-splash',
        'chemical splash': 'chem-splash', 'coat': 'Jackets', 'coats': 'Jackets', 'coats and jackets': 'Jackets',
        'coldstore': 'coldstore', 'cold store': 'coldstore', 'construction': 'construction',
        'disposable': 'disposable', 'disposables': 'disposable', 'dtf supplies': 'dtf-supplies',
        'face mask': 'face-masks', 'face masks': 'face-masks', 'face covering': 'face-masks',
        'face coverings': 'face-masks', 'face masks and covers': 'face-masks', 'flame retardant': 'flame-retardant',
        'fleece jacket': 'Fleece', 'fleece jackets': 'Fleece', 'footwear': 'footwear',
        'golf': 'golf', 'gloves ppe': 'Gloves', 'gloves winter': 'Gloves', 'headwear': 'caps', 'healthcare': 'healthcare', 'helmet': 'helmets',
        'helmets': 'helmets', 'hospitality': 'hospitality', 'lab coat': 'lab-coats',
        'lab coats': 'lab-coats', 'medical coat': 'lab-coats', 'medical coats': 'lab-coats', 'lab medical coats': 'lab-coats',
        'lounge and underwear': 'lounge-underwear', 'loungewear': 'lounge-underwear',
        'underwear': 'lounge-underwear', 'maternity': 'maternity', 'offshore': 'offshore', 'offshore clothing': 'offshore',
        'overall': 'overalls', 'overalls': 'overalls', 'painter clothing': 'painter-decorator',
        'decorator clothing': 'painter-decorator', 'painter and decorator': 'painter-decorator',
        'painter and decorator clothing': 'painter-decorator',
        'plus size': 'plus-size', 'ppe': 'ppe', 'rail spec': 'rail-spec', 'rail clothing': 'rail-spec',
        'schoolwear': 'schoolwear', 'school wear': 'schoolwear', 'scrub': 'scrubs', 'scrubs': 'scrubs',
        'security': 'security', 'security clothing': 'security', 'skirt': 'skirts', 'skirts': 'skirts',
        'sports and teamwear': 'sports-teamwear', 'sports teamwear': 'sports-teamwear',
        'teamwear': 'sports-teamwear', 'softshell jacket': 'Softshells', 'softshell jackets': 'Softshells',
        'spring workwear': 'spring-workwear', 'suit': 'suits', 'suits': 'suits', 'tailoring': 'suits',
        'suits and tailoring': 'suits', 'summer workwear': 'summer-workwear',
        'thermal': 'Baselayers', 'thermals': 'Baselayers', 'thermals and base layers': 'Baselayers',
        'towelling': 'Towels', 'trades': 'trades',
        'umbrella': 'umbrellas', 'umbrellas': 'umbrellas', 'welding': 'welding',
        'welding workwear': 'welding', 'winter workwear': 'winter-workwear'
    };

    if (!input || !dropdown) return;

    input.dataset.acCustom = 'true';
    input.setAttribute('autocomplete', 'off');
    dropdown.classList.add('pc-search-results');
    dropdown.setAttribute('role', 'region');
    dropdown.setAttribute('aria-label', 'Product search results');

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function productUrl(code) {
        return new URL('shop-pc.html?product=' + encodeURIComponent(code), projectRoot).href;
    }

    function shopUrl(query) {
        return new URL('shop-pc.html?q=' + encodeURIComponent(query), projectRoot).href;
    }

    function exactProductType(query) {
        var key = String(query || '')
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, ' ');
        return exactProductTypes[key] || null;
    }

    function imageUrl(product) {
        var colour = Array.isArray(product.colors) ? product.colors[0] : null;
        return product.image || product.main_image || (colour && (colour.main || colour.image || colour.thumb)) ||
            new URL('brandedukv15-child/assets/images/ui/no-image.png', projectRoot).href;
    }

    function price(product) {
        var value = Number(product.price);
        if (!Number.isFinite(value) && Array.isArray(product.priceBreaks) && product.priceBreaks.length) {
            value = Number(product.priceBreaks[0].price);
        }
        return Number.isFinite(value) ? value : 0;
    }

    function close() {
        dropdown.classList.remove('open');
        dropdown.innerHTML = '';
        input.setAttribute('aria-expanded', 'false');
    }

    function open() {
        dropdown.classList.add('open');
        input.setAttribute('aria-expanded', 'true');
    }

    function pageNumbers(page, totalPages) {
        var start = Math.max(1, page - 2);
        var end = Math.min(totalPages, start + 4);
        start = Math.max(1, end - 4);
        var html = '';
        for (var number = start; number <= end; number += 1) {
            html += '<button type="button" class="pc-search-page' + (number === page ? ' is-current' : '') +
                '" data-search-page="' + number + '" aria-label="Search results page ' + number + '"' +
                (number === page ? ' aria-current="page"' : '') + '>' + number + '</button>';
        }
        return html;
    }

    function productCard(product) {
        var code = product.code || product.style_code || '';
        var name = product.name || product.product_name || code;
        var brand = product.brand || '';
        var fallback = new URL('brandedukv15-child/assets/images/ui/no-image.png', projectRoot).href;
        return '<a class="pc-search-product" href="' + escapeHtml(productUrl(code)) + '" data-code="' + escapeHtml(code) + '">' +
            '<span class="pc-search-product__media"><img src="' + escapeHtml(imageUrl(product)) + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'' + escapeHtml(fallback) + '\'"></span>' +
            '<span class="pc-search-product__copy">' +
                '<span class="pc-search-product__name">' + escapeHtml(name) + '</span>' +
                (brand ? '<span class="pc-search-product__brand">' + escapeHtml(brand) + '</span>' : '') +
                '<span class="pc-search-product__price">From <strong>£' + price(product).toFixed(2) + '</strong> ex. VAT</span>' +
            '</span>' +
        '</a>';
    }

    function render(payload, query) {
        var products = Array.isArray(payload.items) ? payload.items.slice(0, pageSize) : [];
        var total = Number(payload.total);
        if (!Number.isFinite(total)) total = products.length;
        var page = Math.max(1, Number(payload.page) || 1);
        var limit = Math.max(1, Number(payload.limit) || pageSize);
        var totalPages = Math.max(1, Math.ceil(total / limit));

        if (!products.length) {
            dropdown.innerHTML = '<div class="pc-search-empty"><strong>No products found</strong><span>Try another product name, brand or code.</span></div>';
            open();
            return;
        }

        dropdown.innerHTML =
            '<div class="pc-search-head"><span>Products</span><a href="' + escapeHtml(shopUrl(query)) + '">View all results</a></div>' +
            '<div class="pc-search-grid">' + products.map(productCard).join('') + '</div>' +
            '<div class="pc-search-footer">' +
                '<a class="pc-search-total" href="' + escapeHtml(shopUrl(query)) + '"><strong>' + total.toLocaleString('en-GB') + '</strong> results</a>' +
                '<nav class="pc-search-pages" aria-label="Search result pages">' +
                    '<button type="button" class="pc-search-page pc-search-page--word" data-search-page="' + Math.max(1, page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>Previous</button>' +
                    pageNumbers(page, totalPages) +
                    '<button type="button" class="pc-search-page pc-search-page--word" data-search-page="' + Math.min(totalPages, page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + '>Next</button>' +
                '</nav>' +
            '</div>';
        open();
    }

    async function search(query, page) {
        if (requestController) requestController.abort();
        requestController = new AbortController();
        activeQuery = query;
        dropdown.innerHTML = '<div class="pc-search-loading">Searching products…</div>';
        open();

        try {
            var productType = exactProductType(query);
            var searchParam = productType
                ? 'productType=' + encodeURIComponent(productType)
                : 'q=' + encodeURIComponent(query);
            var url = apiUrl + '?' + searchParam + '&page=' + page + '&limit=' + pageSize;
            var response = await fetch(url, { signal: requestController.signal });
            if (!response.ok) throw new Error('Search request failed');
            render(await response.json(), query);
        } catch (error) {
            if (error.name === 'AbortError') return;
            dropdown.innerHTML = '<div class="pc-search-empty"><strong>Search is unavailable</strong><span>Please try again in a moment.</span></div>';
            open();
        }
    }

    function submit() {
        var query = input.value.trim();
        if (query) window.location.href = shopUrl(query);
    }

    input.addEventListener('input', function () {
        var query = input.value.trim();
        clearTimeout(debounceTimer);
        if (query.length < 2) {
            close();
            return;
        }
        debounceTimer = setTimeout(function () { search(query, 1); }, 250);
    });

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            submit();
        } else if (event.key === 'Escape') {
            close();
        }
    });

    dropdown.addEventListener('click', function (event) {
        var pageButton = event.target.closest('[data-search-page]');
        if (pageButton && !pageButton.disabled) {
            event.preventDefault();
            event.stopPropagation();
            search(activeQuery, Number(pageButton.dataset.searchPage) || 1);
            return;
        }
        var product = event.target.closest('.pc-search-product');
        if (product && product.dataset.code) {
            sessionStorage.setItem('selectedProduct', product.dataset.code);
        }
    });

    var lens = input.parentElement && input.parentElement.querySelector('.search-icon-expand');
    if (lens) lens.addEventListener('click', submit);

    document.addEventListener('click', function (event) {
        if (!event.target.closest('.searchbar-header__search-expand')) close();
    });
})();
