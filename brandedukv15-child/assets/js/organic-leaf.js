/**
 * Organic / sustainable / recycled product-card leaf badge.
 * Prefers catalog filter data (code index + accreditations/flags/features/fabric).
 * Name/brand keywords are a last-resort fallback only.
 */
(function (root) {
    'use strict';

    var STYLE_ID = 'branded-organic-leaf-style';
    var CACHE_BUST = '20261112-inset1';
    /* Visible gap between the badge box and the bottom-right of the photo. */
    var PHOTO_INSET = 6;

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
            '  /* Fallback until the photo bounds are measured. */',
            '  .product-eco-leaf { width: 32px; height: 32px; right: 19px; bottom: 12px; }',
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
        placeAll();
        return true;
    }

    function axisFraction(token) {
        if (!token) return 0.5;
        if (token === 'left' || token === 'top') return 0;
        if (token === 'right' || token === 'bottom') return 1;
        if (token === 'center') return 0.5;
        if (token.charAt(token.length - 1) === '%') {
            var percent = parseFloat(token);
            return isNaN(percent) ? 0.5 : percent / 100;
        }
        return null;
    }

    function objectPositionFractions(value) {
        var parts = String(value || '50% 50%').trim().split(/\s+/);
        var x = axisFraction(parts[0]);
        var y = parts.length > 1 ? axisFraction(parts[1]) : 0.5;
        return {
            x: x == null ? 0.5 : x,
            y: y == null ? 0.5 : y
        };
    }

    // Visible bitmap inside an object-fit box. Cover/fill fill the element.
    function photoRect(img) {
        var box = img.getBoundingClientRect();
        var nw = img.naturalWidth;
        var nh = img.naturalHeight;
        if (!nw || !nh || box.width < 1 || box.height < 1) return null;
        var cs = getComputedStyle(img);
        var fit = (cs.objectFit || 'fill').trim();
        if (fit !== 'contain' && fit !== 'scale-down' && fit !== 'none') return box;
        var scale = fit === 'none' ? 1 : Math.min(box.width / nw, box.height / nh);
        if (fit === 'scale-down') scale = Math.min(1, scale);
        var dw = nw * scale;
        var dh = nh * scale;
        var pos = objectPositionFractions(cs.objectPosition);
        var ox = pos.x * (box.width - dw);
        var oy = pos.y * (box.height - dh);
        return {
            left: box.left + ox,
            top: box.top + oy,
            right: box.left + ox + dw,
            bottom: box.top + oy + dh
        };
    }

    function siblingPhoto(leaf) {
        var parent = leaf.parentElement;
        if (!parent) return null;
        var kids = parent.children;
        for (var i = 0; i < kids.length; i++) {
            if (kids[i] !== leaf && kids[i].tagName === 'IMG') return kids[i];
        }
        return null;
    }

    function placeLeaf(leaf) {
        var img = siblingPhoto(leaf);
        if (!img) return false;
        var photo = photoRect(img);
        if (!photo) return false;
        var parent = leaf.parentElement;
        var parentRect = parent.getBoundingClientRect();
        var ps = getComputedStyle(parent);
        var borderRight = parseFloat(ps.borderRightWidth) || 0;
        var borderBottom = parseFloat(ps.borderBottomWidth) || 0;
        var edgeRight = parentRect.right - borderRight;
        var edgeBottom = parentRect.bottom - borderBottom;
        var right = edgeRight - photo.right + PHOTO_INSET;
        var bottom = edgeBottom - photo.bottom + PHOTO_INSET;
        if (right < PHOTO_INSET) right = PHOTO_INSET;
        if (bottom < PHOTO_INSET) bottom = PHOTO_INSET;
        var leafBox = leaf.getBoundingClientRect();
        var innerW = parentRect.width - borderRight - (parseFloat(ps.borderLeftWidth) || 0);
        var innerH = parentRect.height - borderBottom - (parseFloat(ps.borderTopWidth) || 0);
        var maxRight = Math.max(PHOTO_INSET, innerW - leafBox.width - PHOTO_INSET);
        var maxBottom = Math.max(PHOTO_INSET, innerH - leafBox.height - PHOTO_INSET);
        if (right > maxRight) right = maxRight;
        if (bottom > maxBottom) bottom = maxBottom;
        leaf.style.right = (Math.round(right * 10) / 10) + 'px';
        leaf.style.bottom = (Math.round(bottom * 10) / 10) + 'px';
        return true;
    }

    function placeAll() {
        if (!document.querySelectorAll) return;
        var leaves = document.querySelectorAll('.product-eco-leaf');
        for (var i = 0; i < leaves.length; i++) placeLeaf(leaves[i]);
    }

    function bindPlacement() {
        if (root.__brandedEcoLeafPlace || !document.documentElement) return;
        root.__brandedEcoLeafPlace = true;
        ensureStyles();
        var pending = false;
        function schedule() {
            if (pending) return;
            pending = true;
            var run = function () {
                pending = false;
                placeAll();
            };
            if (typeof Promise !== 'undefined') Promise.resolve().then(run);
            else if (typeof root.requestAnimationFrame === 'function') root.requestAnimationFrame(run);
            else root.setTimeout(run, 16);
        }
        root.addEventListener('resize', schedule);
        document.addEventListener('load', function (event) {
            var target = event.target;
            if (!target || target.tagName !== 'IMG') return;
            if (target.classList && target.classList.contains('product-eco-leaf')) return;
            schedule();
        }, true);
        if (typeof MutationObserver === 'function') {
            new MutationObserver(schedule).observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src']
            });
        }
        schedule();
    }

    root.BrandedOrganicLeaf = {
        leafSrc: leafSrc,
        isOrganicOrSustainable: isOrganicOrSustainable,
        leafHtml: leafHtml,
        maybeLeafHtml: maybeLeafHtml,
        decorateMedia: decorateMedia,
        ensureStyles: ensureStyles,
        placeLeaves: placeAll
    };

    if (typeof document !== 'undefined') bindPlacement();
})(typeof window !== 'undefined' ? window : globalThis);
