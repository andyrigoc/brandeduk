/* ═══════════════════════════════════════════════════════
   SITE BREADCRUMBS JS – Shared auto-populating logic
   Reads page context from URL params & sessionStorage
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── Category slug mapping (pretty API name → shop URL slug) ── */
    var CATEGORY_SLUG_MAP = {
        'hoodies': 'hoodies',
        'caps': 'caps',
        'beanies': 'beanies',
        'polos': 'polo',
        'polo': 'polo',
        'polo shirts': 'polo',
        't-shirts': 'tshirts',
        'tshirts': 'tshirts',
        'tees': 'tshirts',
        'jackets': 'jackets',
        'fleeces': 'fleeces',
        'fleece': 'fleeces',
        'hi-vis': 'hivis',
        'hivis': 'hivis',
        'hi vis': 'hivis',
        'hi-viz': 'hivis',
        'safety vests': 'hivis',
        'trousers': 'trousers',
        'bags': 'bags',
        'aprons': 'aprons',
        'sweatshirts': 'sweatshirts',
        'shirts': 'shirts',
        'softshells': 'softshells',
        'gilets': 'gilets',
        'gilets & body warmers': 'gilets',
        'shorts': 'shorts',
        'sweatpants': 'sweatpants',
        'workwear': 'workwear',
        'sustainable': 'sustainable',
        'headwear': 'headwear'
    };

    /** Convert any category value to a shop URL slug */
    function toSlug(cat) {
        if (!cat) return '';
        var lower = String(cat).trim().toLowerCase();
        return CATEGORY_SLUG_MAP[lower] || lower.replace(/\s+/g, '-');
    }

    /** Pretty display name from a category value */
    var SLUG_DISPLAY = {
        'hoodies': 'Hoodies', 'caps': 'Caps', 'beanies': 'Beanies',
        'polo': 'Polo Shirts', 'tshirts': 'T-Shirts', 'jackets': 'Jackets',
        'fleeces': 'Fleeces', 'hivis': 'Hi-Vis', 'trousers': 'Trousers',
        'bags': 'Bags', 'aprons': 'Aprons', 'sweatshirts': 'Sweatshirts',
        'shirts': 'Shirts', 'softshells': 'Softshells', 'gilets': 'Gilets',
        'shorts': 'Shorts', 'sweatpants': 'Sweatpants', 'workwear': 'Workwear',
        'sustainable': 'Sustainable', 'headwear': 'Headwear'
    };

    function prettyCategory(cat) {
        if (!cat) return '';
        var slug = toSlug(cat);
        if (SLUG_DISPLAY[slug]) return SLUG_DISPLAY[slug];
        // fallback: capitalise
        return cat.replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    /* ── Helpers ────────────────────────────────────── */

    /** Read a URL search param (works from the current page URL) */
    function param(name) {
        return new URLSearchParams(window.location.search).get(name) || '';
    }

    /** Resolve the correct path prefix (root vs mobile/ subfolder) */
    function rootPrefix() {
        // If we're inside /mobile/, go up one level
        var path = window.location.pathname.replace(/\\/g, '/');
        if (/\/mobile\//i.test(path)) return '../';
        return '';
    }

    /* ── Page detection ────────────────────────────── */

    /** Detect which page we're on from the filename */
    function detectPage() {
        var path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
        var file = path.split('/').pop() || '';

        if (/customize|customis/.test(file))  return 'customize';
        if (/product/.test(file))             return 'product';
        if (/shop/.test(file))                return 'shop';
        if (/basket/.test(file))              return 'basket';
        if (/checkout/.test(file))            return 'checkout';
        if (/quote/.test(file))               return 'quote';
        if (/home|index/.test(file))          return 'home';
        return 'unknown';
    }

    /* ── Category resolution ───────────────────────── */

    /** Get category slug from URL, sessionStorage, or fallback */
    function resolveCategory() {
        // 1. URL param ?category=headwear
        var cat = param('category') || param('cat');
        if (cat) {
            var slug = toSlug(cat);
            sessionStorage.setItem('breadcrumbCategory', slug);
            return slug;
        }
        // 2. sessionStorage (set when navigating from shop)
        cat = sessionStorage.getItem('breadcrumbCategory');
        if (cat) return toSlug(cat);
        // 3. fallback
        return '';
    }

    /** Get product code from URL or sessionStorage */
    function resolveProduct() {
        var code = param('code') || param('product') || param('id');
        if (code) {
            sessionStorage.setItem('breadcrumbProduct', code.toUpperCase());
            return code.toUpperCase();
        }
        return (sessionStorage.getItem('breadcrumbProduct') || '').toUpperCase();
    }

    /* ── Build breadcrumb trail ────────────────────── */

    function buildTrail(page) {
        var prefix = rootPrefix();
        var crumbs = [];
        var category = resolveCategory();  // always a slug now
        var product = resolveProduct();
        var catDisplay = prettyCategory(category);
        var shopUrl = prefix + 'shop.html';
        var homeUrl = prefix + 'index.html';

        /* Always start with Home */
        crumbs.push({ label: 'Home', href: homeUrl });

        switch (page) {

            case 'shop':
                if (category && category !== 'all') {
                    crumbs.push({ label: catDisplay, href: null }); // current
                } else {
                    crumbs.push({ label: 'All Products', href: null });
                }
                break;

            case 'product':
            case 'customize':
                if (category) {
                    crumbs.push({
                        label: catDisplay,
                        href: shopUrl + '?category=' + encodeURIComponent(category)
                    });
                } else {
                    crumbs.push({ label: 'Shop', href: shopUrl });
                }
                if (product) {
                    crumbs.push({ label: product, href: null });
                }
                break;

            case 'basket':
                crumbs.push({ label: 'Quote Basket', href: null });
                break;

            case 'checkout':
                crumbs.push({
                    label: 'Quote Basket',
                    href: prefix + 'basket.html'
                });
                crumbs.push({ label: 'Checkout', href: null });
                break;

            case 'quote':
                crumbs.push({
                    label: 'Quote Basket',
                    href: prefix + 'basket.html'
                });
                crumbs.push({ label: 'Request Quote', href: null });
                break;

            default:
                break;
        }

        return crumbs;
    }

    /* ── Back button target ────────────────────────── */

    function getBackTarget(page) {
        var prefix = rootPrefix();
        var category = resolveCategory();

        switch (page) {
            case 'shop':
                return prefix + 'index.html';
            case 'product':
            case 'customize':
                if (category) {
                    return prefix + 'shop.html?category=' + encodeURIComponent(category);
                }
                return prefix + 'shop.html';
            case 'basket':
                return prefix + 'shop.html';
            case 'checkout':
                return prefix + 'basket.html';
            case 'quote':
                return prefix + 'basket.html';
            default:
                return prefix + 'index.html';
        }
    }

    /* ── Render ─────────────────────────────────────── */

    function renderBreadcrumbs() {
        var nav = document.getElementById('siteBreadcrumbs');
        if (!nav) return; // no breadcrumb container on this page

        var page = detectPage();
        if (page === 'home') {
            nav.style.display = 'none';
            return;
        }

        var trail = buildTrail(page);
        var backTarget = getBackTarget(page);

        // Build back button (replace listener to avoid duplicates)
        var backBtn = nav.querySelector('.breadcrumb-back-btn');
        if (backBtn) {
            var newBtn = backBtn.cloneNode(true);
            backBtn.parentNode.replaceChild(newBtn, backBtn);
            newBtn.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = backTarget;
            });
        }

        // Build trail
        var trailEl = nav.querySelector('.breadcrumb-trail');
        if (!trailEl) return;

        var html = '';
        trail.forEach(function (crumb, i) {
            if (i > 0) {
                html += '<span class="breadcrumb-sep" aria-hidden="true">›</span>';
            }
            if (crumb.href && i < trail.length - 1) {
                html += '<a href="' + crumb.href + '" class="breadcrumb-link">' + crumb.label + '</a>';
            } else {
                html += '<span class="breadcrumb-current">' + crumb.label + '</span>';
            }
        });
        trailEl.innerHTML = html;
    }

    /* ── Public API for pages that need to update breadcrumbs ── */

    /** Call this from page JS to update category after API load.
     *  Accepts ANY format (slug, pretty name, API name) — normalizes to slug. */
    window.updateBreadcrumbCategory = function (category) {
        if (!category) return;
        sessionStorage.setItem('breadcrumbCategory', toSlug(category));
        renderBreadcrumbs(); // re-render with new data
    };

    /** Call this from page JS to update product code after API load */
    window.updateBreadcrumbProduct = function (code) {
        if (!code) return;
        sessionStorage.setItem('breadcrumbProduct', code.toUpperCase());
        renderBreadcrumbs(); // re-render with new data
    };

    /** Store category when user clicks a category link (call from shop).
     *  Accepts ANY format — normalizes to slug. */
    window.storeBreadcrumbCategory = function (categorySlug) {
        sessionStorage.setItem('breadcrumbCategory', toSlug(categorySlug));
    };

    /* ── Init ───────────────────────────────────────── */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderBreadcrumbs);
    } else {
        renderBreadcrumbs();
    }

})();
