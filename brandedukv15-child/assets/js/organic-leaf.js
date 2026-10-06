/**
 * Organic / sustainable / recycled product-card leaf badge.
 * Prefers catalog filter data (code index + accreditations/flags/features/fabric).
 * Name/brand keywords are a last-resort fallback only.
 */
(function (root) {
    'use strict';

    var STYLE_ID = 'branded-organic-leaf-style';
    var CACHE_BUST = '20261006-leaf4';

    var ACCREDITATION_TOKENS = [
        'organic', 'certified-organic', 'recycled', 'certified-recycled',
        'gots', 'gots-licence', 'ocs', 'ocs-100', 'ocs-100-licence',
        'ocs-blended', 'ocs-blended-licence', 'rcs', 'rcs-100', 'rcs-blended',
        'rcs-blended-licence', 'global-recycled-standard', 'grs', 'grs-licence'
    ];

    var FLAG_TOKENS = [
        'recycled-organic', 'organic', 'recycled', 'sustainable', 'eco'
    ];

    var FEATURE_TOKENS = [
        'organic', 'recycled', 'eco', 'sustainable', 'eco-friendly'
    ];

    var FABRIC_TOKENS = [
        'organic', 'organic-100', 'organic-cotton', 'organic-cotton-100',
        'recycled', 'recycled-100', 'recycled-polyester', 'recycled-cotton',
        'recycled-nylon', 'rpet'
    ];

    var NAME_KEYWORDS = [
        'organic', 'recycled', 'sustainable', 'eco-friendly', 'eco friendly',
        'gots', 'rcs', 'global recycled', 'rpet'
    ];

    function resolveAssetUrl(relativeFromJs) {
        var script = document.currentScript;
        var base;
        if (script && script.src) {
            base = new URL('.', script.src);
        } else {
            base = new URL('brandedukv15-child/assets/js/', root.location.href);
        }
        return new URL(relativeFromJs, base).href;
    }

    var leafSrc = resolveAssetUrl('../images/ui/organic-leaf.png') + '?v=' + CACHE_BUST;

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            '.product-media, .product-figure, .pc-search-product__media { position: relative; }',
            '.product-eco-leaf {',
            '  position: absolute;',
            '  right: 8px;',
            '  bottom: 8px;',
            '  width: 36px;',
            '  height: 36px;',
            '  z-index: 12;',
            '  pointer-events: none;',
            '  display: block;',
            '  object-fit: contain;',
            '  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.18));',
            '}',
            '.pc-search-product__media .product-eco-leaf {',
            '  width: 30px;',
            '  height: 30px;',
            '  right: 6px;',
            '  bottom: 6px;',
            '}',
            /* Keep print/embroidery badges off the leaf corner */
            '.product-badges-bottom {',
            '  right: auto !important;',
            '  left: 8px !important;',
            '  align-items: flex-start !important;',
            '}',
            '@media (max-width: 767px) {',
            '  .product-badges-bottom {',
            '    right: auto !important;',
            '    left: 6px !important;',
            '    align-items: flex-start !important;',
            '  }',
            '  .product-eco-leaf { width: 32px; height: 32px; right: 6px; bottom: 6px; }',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    function collectTokens(value) {
        var out = [];
        if (value == null) return out;

        function pushOne(item) {
            if (item == null) return;
            if (typeof item === 'string' || typeof item === 'number') {
                var s = String(item).trim().toLowerCase();
                if (s) out.push(s);
                return;
            }
            if (typeof item === 'object') {
                ['slug', 'value', 'id', 'name', 'label', 'code'].forEach(function (key) {
                    if (item[key] != null) pushOne(item[key]);
                });
            }
        }

        if (Array.isArray(value)) {
            value.forEach(pushOne);
        } else {
            pushOne(value);
        }
        return out;
    }

    function tokenMatches(tokens, needles) {
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            for (var j = 0; j < needles.length; j++) {
                var needle = needles[j];
                if (token === needle || token.indexOf(needle) !== -1) return true;
            }
        }
        return false;
    }

    function textHasKeyword(text) {
        if (!text) return false;
        var lower = String(text).toLowerCase();
        for (var i = 0; i < NAME_KEYWORDS.length; i++) {
            if (lower.indexOf(NAME_KEYWORDS[i]) !== -1) return true;
        }
        return false;
    }

    function codeInIndex(code) {
        var index = root.BrandedOrganicSustainableCodes;
        if (!index || typeof index.has !== 'function') return false;
        return index.has(code);
    }

    function isOrganicOrSustainable(product) {
        if (!product || typeof product !== 'object') return false;

        if (codeInIndex(product.code || product.style_code || product.value)) {
            return true;
        }

        var accreditations = collectTokens(
            product.accreditations || product.accreditation || product.certs || product.certifications
        );
        if (tokenMatches(accreditations, ACCREDITATION_TOKENS)) return true;

        var flags = collectTokens(product.flags || product.flag || product.tags || product.tag);
        if (tokenMatches(flags, FLAG_TOKENS)) return true;

        var features = collectTokens(product.features || product.feature || product.styles);
        if (tokenMatches(features, FEATURE_TOKENS)) return true;

        var fabricTokens = collectTokens(product.fabric || (product.details && product.details.fabric));
        if (tokenMatches(fabricTokens, FABRIC_TOKENS)) return true;
        if (textHasKeyword(product.fabric) || textHasKeyword(product.details && product.details.fabric)) {
            return true;
        }

        // Last resort: name / brand keywords only when structured flags are absent.
        if (textHasKeyword(product.name) || textHasKeyword(product.label) || textHasKeyword(product.product_name)) {
            return true;
        }
        if (textHasKeyword(product.brand) || textHasKeyword(product.brand_name)) {
            return true;
        }

        return false;
    }

    function leafHtml(extraClass) {
        ensureStyles();
        var cls = 'product-eco-leaf' + (extraClass ? ' ' + extraClass : '');
        return '<img class="' + cls + '" src="' + leafSrc + '" alt="" width="36" height="36" loading="lazy" decoding="async" aria-hidden="true">';
    }

    function leafElement() {
        ensureStyles();
        var img = document.createElement('img');
        img.className = 'product-eco-leaf';
        img.src = leafSrc;
        img.alt = '';
        img.width = 36;
        img.height = 36;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.setAttribute('aria-hidden', 'true');
        return img;
    }

    function maybeLeafHtml(product, extraClass) {
        return isOrganicOrSustainable(product) ? leafHtml(extraClass) : '';
    }

    function decorateMedia(mediaEl, product) {
        if (!mediaEl || !isOrganicOrSustainable(product)) return false;
        ensureStyles();
        if (mediaEl.querySelector('.product-eco-leaf')) return true;
        mediaEl.appendChild(leafElement());
        return true;
    }

    root.BrandedOrganicLeaf = {
        leafSrc: leafSrc,
        isOrganicOrSustainable: isOrganicOrSustainable,
        leafHtml: leafHtml,
        maybeLeafHtml: maybeLeafHtml,
        decorateMedia: decorateMedia,
        ensureStyles: ensureStyles
    };
})(typeof window !== 'undefined' ? window : globalThis);
