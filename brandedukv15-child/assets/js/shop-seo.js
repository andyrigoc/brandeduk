/**
 * Shop query metadata only. Does not change headings, grids, or filters.
 * Category query URLs are noindex and canonical to the existing landing.
 * Other filters are noindex and canonical to that landing, or to /shop.
 */
(function () {
    'use strict';

    var ORIGIN = 'https://www.brandeduk.com';
    var LANDINGS = {
        polos: {
            path: '/polos',
            title: 'Custom Embroidered Polo Shirts | BrandedUK',
            description: 'Custom embroidered and printed polo shirts from £9.99. Bulk discounts, your logo added by embroidery or print. Ideal for workwear, corporate uniforms and teams across the UK.'
        },
        tshirts: {
            path: '/tshirts',
            title: 'Custom Printed T-Shirts UK - BrandedUK',
            description: 'Custom Printed T-Shirts UK - From £5.99. Screen Print, DTG & Vinyl Transfer. Bulk Discounts. Perfect for Events, Teams, Workwear. Free Quote in 8 Hours!'
        },
        hoodies: {
            path: '/hoodies',
            title: 'Custom Printed Hoodies UK - BrandedUK',
            description: 'Custom Printed Hoodies UK - From £14.99. Embroidery & Screen Print Available. Bulk Discounts. Perfect for Teams, Events, Workwear. Fast Delivery!'
        },
        jackets: {
            path: '/jackets',
            title: 'Custom Embroidered Jackets UK - BrandedUK',
            description: 'Custom Embroidered Jackets UK - From £19.99. Fleece, Softshell & Hi-Vis Jackets with Your Logo. Perfect for Corporate, Trade & Outdoor Workwear. Bulk Discounts!'
        },
        hivis: {
            path: '/hivis',
            title: 'Custom Hi-Vis Workwear UK - BrandedUK',
            description: 'Custom Hi-Vis Workwear UK - From £8.99. Hi-Visibility Vests, Jackets & Trousers with Your Logo. EN ISO 20471 Certified. Bulk Discounts. Fast Delivery!'
        },
        workwear: {
            path: '/workwear',
            title: 'Custom Workwear & Uniforms | BrandedUK',
            description: 'Custom workwear and uniforms: polo shirts, T-shirts, hoodies, hi-vis and jackets with your logo. Embroidery and printing, bulk discounts, UK-wide delivery.'
        }
    };
    var ALIAS = {
        polo: 'polos',
        polos: 'polos',
        tshirt: 'tshirts',
        tshirts: 'tshirts',
        't-shirt': 'tshirts',
        't-shirts': 'tshirts',
        hoodie: 'hoodies',
        hoodies: 'hoodies',
        jacket: 'jackets',
        jackets: 'jackets',
        hivis: 'hivis',
        hiviz: 'hivis',
        'hi-vis': 'hivis',
        'safety-vests': 'hivis',
        safetyvests: 'hivis',
        workwear: 'workwear'
    };
    var PAIRS = {
        'hoodies|sweatshirts': 'hoodies',
        'jackets|softshells': 'jackets'
    };

    function isTracking(key) {
        if (key.indexOf('utm_') === 0) return true;
        return {
            contact: 1, gclid: 1, fbclid: 1, msclkid: 1, gclsrc: 1, dclid: 1,
            wbraid: 1, gbraid: 1, gad_source: 1, gad_campaignid: 1, ttclid: 1,
            mc_cid: 1, mc_eid: 1, _ga: 1, force: 1
        }[key] === 1;
    }

    function values(params, key) {
        var out = [];
        params.forEach(function (value, name) {
            var bare = name.replace(/\[\]$/, '');
            if (bare === key && value) out.push(value);
        });
        return out;
    }

    function landingFor(types) {
        var norm = types.map(function (value) {
            var key = String(value || '').toLowerCase().trim();
            if (!key || key === 'all') return '';
            return ALIAS[key] || key;
        }).filter(Boolean);
        var unique = norm.filter(function (value, index) { return norm.indexOf(value) === index; }).sort();
        if (!unique.length) return null;
        if (unique.length > 1) return LANDINGS[PAIRS[unique.join('|')]] || null;
        return LANDINGS[unique[0]] || null;
    }

    function setMeta(selector, attr, value) {
        var el = document.head.querySelector(selector);
        if (!el) {
            el = document.createElement(selector.indexOf('link') === 0 ? 'link' : 'meta');
            if (selector.indexOf('canonical') !== -1) el.setAttribute('rel', 'canonical');
            if (selector.indexOf('robots') !== -1) el.setAttribute('name', 'robots');
            if (selector.indexOf('description') !== -1) el.setAttribute('name', 'description');
            document.head.appendChild(el);
        }
        el.setAttribute(attr, value);
    }

    function apply() {
        var product = (location.pathname || '').match(/^\/product\/([^/]+)\/?$/i);
        if (product) {
            var code = product[1];
            try { code = decodeURIComponent(code); } catch (e) {}
            var productUrl = ORIGIN + '/product/' + encodeURIComponent(code);
            if (document.title.indexOf('| Branded UK') === -1) {
                document.title = code + ' | Branded UK';
            }
            setMeta('link[rel="canonical"]', 'href', productUrl);
            setMeta('meta[name="robots"]', 'content', 'index, follow');
            setMeta('meta[name="description"]', 'content', 'Customise ' + code + ' with embroidery or printing at Branded UK.');
            var og = document.head.querySelector('meta[property="og:url"]');
            if (og) og.setAttribute('content', productUrl);
            return;
        }

        var path = (location.pathname || '').replace(/\/+$/, '');
        if (path !== '/shop' && path !== '/shop-pc') return;

        var params;
        try { params = new URLSearchParams(location.search); } catch (e) { return; }

        var types = values(params, 'productType').concat(values(params, 'category'));
        var hasType = types.some(function (value) {
            var key = String(value || '').toLowerCase().trim();
            return key && key !== 'all';
        });
        var landing = landingFor(types);
        var page = parseInt(params.get('page') || '1', 10);
        if (!page || page < 1) page = 1;
        var meaningful = [];
        params.forEach(function (value, key) {
            var bare = key.replace(/\[\]$/, '');
            if (!value || isTracking(bare)) return;
            if (bare === 'productType' || bare === 'category' || bare === 'page') return;
            meaningful.push(bare);
        });

        if (!landing && !hasType && !meaningful.length && page === 1) return;

        var robots = 'noindex, follow';
        var canonical = landing ? ORIGIN + landing.path : ORIGIN + '/shop';
        if (page > 1 && !meaningful.length && !landing) {
            robots = 'index, follow';
            canonical = ORIGIN + path + location.search;
        } else if (page > 1 && !meaningful.length && landing) {
            canonical = ORIGIN + path + location.search;
        }

        setMeta('meta[name="robots"]', 'content', robots);
        setMeta('link[rel="canonical"]', 'href', canonical);
        if (landing && page === 1 && !meaningful.length) {
            document.title = landing.title;
            setMeta('meta[name="description"]', 'content', landing.description);
            var ogTitle = document.head.querySelector('meta[property="og:title"]');
            var ogDesc = document.head.querySelector('meta[property="og:description"]');
            var ogUrl = document.head.querySelector('meta[property="og:url"]');
            if (ogTitle) ogTitle.setAttribute('content', landing.title);
            if (ogDesc) ogDesc.setAttribute('content', landing.description);
            if (ogUrl) ogUrl.setAttribute('content', canonical);
        }
    }

    apply();
    document.addEventListener('DOMContentLoaded', apply);
})();
