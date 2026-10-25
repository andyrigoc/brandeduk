#!/usr/bin/env node
/**
 * Builds the "Shop by Industry" pages from brandedukv15-child/assets/data/industries.json
 * (extracted from BrandedUK_Industries_Product_List.pdf).
 *
 *   node --use-system-ca scripts/build-industries.js --fetch   refresh the product snapshot from the API, then build
 *   node scripts/build-industries.js                           rebuild the HTML from the saved snapshot
 *   node --use-system-ca scripts/build-industries.js --fetch-missing   only fetch codes the last fetch did not find or that are new in industries.json
 *   node --use-system-ca scripts/build-industries.js --fetch-sectors   only refresh the API sector products + filter values
 *
 * Every PDF code the API returns is shown, whatever the PDF says about its site status.
 *   --on-site-only              only show codes the PDF marks "On site"
 *   --missing-report <dir>      write codes-to-import.csv + codes-to-import.txt (codes the API does not return)
 *
 * Output:
 *   industries.html                 hub page        -> /industries
 *   industries/<sector>.html        one per sector  -> /industries/<sector>
 *   brandedukv15-child/assets/data/industries-products.json   product snapshot (name, price, images, methods)
 *
 * The public API has no "list of codes" filter and is rate limited (100 requests per window),
 * so product cards are pre-rendered from a snapshot instead of being fetched per visitor.
 * Re-run with --fetch whenever prices or the catalogue change.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'brandedukv15-child/assets/data/industries.json');
const SNAPSHOT_FILE = path.join(ROOT, 'brandedukv15-child/assets/data/industries-products.json');
const SHOP_PC_FILE = path.join(ROOT, 'shop-pc.html');
const OUT_DIR = path.join(ROOT, 'industries');
const HUB_FILE = path.join(ROOT, 'industries.html');

const API = 'https://api.brandeduk.com';
const SITE = 'https://www.brandeduk.com';
const ASSET_VERSION = '20261018-mheader';
const HIDDEN_BRAND_NAMES = ['absolute', 'ralawise'];
const ON_SITE_ONLY = process.argv.includes('--on-site-only');
const MISSING_REPORT_DIR = (() => {
    const index = process.argv.indexOf('--missing-report');
    return index > -1 && process.argv[index + 1] ? path.resolve(process.argv[index + 1]) : null;
})();
const SUPPLIER_ORDER = ['Ralawise 2026', 'PenCarrie 2026', 'Uneek 2026'];
const ISSUE_NOT_IN_API = 'Not in API';
const ISSUE_INCOMPLETE = 'In API but no price/sizes';
const SECTOR_ORDER = ['construction', 'cleaning', 'hospitality', 'healthcare', 'logistics', 'corporate', 'education', 'retail', 'sports'];
const SECTORS_FILE = path.join(ROOT, 'brandedukv15-child/assets/data/industries-sectors.json');
const CLIENT_DATA_DIR = path.join(ROOT, 'brandedukv15-child/assets/data/industries');
const CLIENT_DATA_URL = '/brandedukv15-child/assets/data/industries';

/* Our industries -> the API "Product Sector" values (GET /api/filters/sectors, same as the shop's Related Sector filter).
   The API has no cleaning, healthcare or retail sector, so those use the product-type queries in SOURCE_QUERIES. */
const API_SECTORS = {
    construction: { sectors: ['safety'], more: 'More construction workwear' },
    cleaning: { sectors: ['type-tabards', 'type-tunics'], more: 'More cleaning tabards & tunics' },
    hospitality: { sectors: ['hospitality'], more: 'More hospitality workwear' },
    healthcare: { sectors: ['type-tunics'], more: 'More healthcare tunics' },
    logistics: { sectors: ['safety'], more: 'More logistics & warehouse workwear' },
    corporate: { sectors: ['corporate'], more: 'More corporate workwear' },
    education: { sectors: ['school'], more: 'More school & education wear' },
    retail: { sectors: ['corporate-retail'], more: 'More retail staff uniforms' },
    sports: { sectors: ['sport'], more: 'More sports teamwear' }
};
/* Sources that are not an API sector; anything else is fetched as sector[]=<key>. */
const RETAIL_TYPES = ['polos', 'shirts', 'blouses', 'fleece', 'softshells', 'aprons'];
const SOURCE_QUERIES = {
    'type-tabards': 'productType[]=tabards',
    'type-tunics': 'productType[]=tunics',
    'corporate-retail': 'sector[]=corporate&' + RETAIL_TYPES.map((type) => `productType[]=${type}`).join('&')
};

function sourceQuery(key) {
    return (SOURCE_QUERIES[key] || `sector[]=${encodeURIComponent(key)}`) + '&sort=best';
}

/* Sidebar filters, in the shop's FILTER_CONFIG order. "api" facets are read from the API per value
   (GET /api/products?<key>[]=<slug>); the others come from the product list fields. */
const FILTERS = [
    { key: 'gender', title: 'Gender', api: true },
    { key: 'ageGroup', title: 'Age Group', api: true },
    { key: 'brand', title: 'Brand', searchable: true, expanded: true },
    { key: 'productType', title: 'Product Type', searchable: true, expanded: true },
    { key: 'sleeve', title: 'Sleeve', api: true },
    { key: 'neckline', title: 'Neckline', api: true },
    { key: 'primaryColour', title: 'Primary Colour', api: true, swatch: true },
    { key: 'size', title: 'Size', searchable: true },
    { key: 'fabric', title: 'Fabric', api: true, searchable: true },
    { key: 'weight', title: 'Weight (GSM)', api: true }
];
const FILTER_VISIBLE_LIMIT = 8;
const MORE_BATCH = 24;

/* ------------------------------------------------------------------ helpers */

function esc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function slugify(value) {
    return String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function money(value) {
    return '\u00A3' + (Number(value) || 0).toFixed(2);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeFile(file, contents) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents, 'utf8');
}

/* ------------------------------------------------------------------ API snapshot */

function normaliseMethods(customization) {
    let list = customization || [];
    if (typeof list === 'string') list = list.split(',');
    if (!Array.isArray(list)) list = [];
    return Array.from(new Set(list.map((entry) => {
        const lower = String(entry).trim().toLowerCase();
        if (lower.includes('emb')) return 'embroidery';
        if (lower.includes('print') || lower.includes('screen')) return 'print';
        return lower;
    }).filter(Boolean)));
}

/* Mirrors transformProduct() in brandedukv15-child/assets/js/api.js for the fields a card needs. */
function toCard(product) {
    let brand = product.brand || product.brand_name || '';
    let name = product.name || product.product_name || '';
    if (HIDDEN_BRAND_NAMES.some((hidden) => brand.toLowerCase().includes(hidden))) brand = '';
    HIDDEN_BRAND_NAMES.forEach((hidden) => {
        name = name.replace(new RegExp(hidden + '\\s*apparel', 'gi'), '').replace(new RegExp(hidden, 'gi'), '').replace(/^\s*[-\u2013\u2014]\s*/, '').trim();
    });
    name = name.replace(/[\u00AE\u2122\u00A9]/g, '');

    const breaks = product.priceBreaks || product.price_breaks || [];
    const price = Number(product.price) || Number(product.basePrice) || Number(breaks[0] && breaks[0].price) || 0;
    const image = product.image || product.main_image || '';
    const colors = (product.colors || []).map((color) => {
        if (typeof color === 'string') return { name: color, image };
        return { name: color.name || color.colour_name || 'Default', image: color.main || color.image_url || color.thumb || image };
    }).filter((color) => color.image);

    return {
        code: product.code || product.style_code,
        name,
        brand,
        price,
        image: image || (colors[0] && colors[0].image) || '',
        colors,
        customization: normaliseMethods(product.customization),
        isBestSeller: product.is_best_seller === true || product.is_best_seller === 'true' || product.is_best_seller === 1,
        isRecommended: product.is_recommended === true || product.is_recommended === 'true' || product.is_recommended === 1,
        productType: product.productType || product.product_type || '',
        sizes: Array.isArray(product.sizes) ? product.sizes.map(String) : []
    };
}

async function apiGet(url) {
    for (let attempt = 1; attempt <= 8; attempt++) {
        const response = await fetch(url, { headers: { Origin: SITE, Referer: SITE + '/', Accept: 'application/json' } });
        if (response.status === 429) {
            const retryAfter = Number(response.headers.get('retry-after')) || 30;
            console.log(`  rate limited, waiting ${retryAfter}s`);
            await sleep(retryAfter * 1000);
            continue;
        }
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
        const remaining = Number(response.headers.get('x-ratelimit-remaining'));
        if (Number.isFinite(remaining) && remaining < 5) await sleep(15000);
        return response.json();
    }
    throw new Error('Too many retries for ' + url);
}

function sameCode(a, b) {
    const norm = (value) => String(value || '').toUpperCase().replace(/[\s-]+/g, '');
    return norm(a) === norm(b);
}

async function findProduct(code) {
    const search = await apiGet(`${API}/api/products?q=${encodeURIComponent(code)}&limit=50`);
    const exact = ((search && search.items) || []).find((item) => sameCode(item.code || item.style_code, code));
    if (exact) return exact;
    await sleep(250);
    const detail = await apiGet(`${API}/api/products/${encodeURIComponent(code)}`);
    if (detail && sameCode(detail.code || detail.style_code, code)) return detail;
    return null;
}

/* Name search for codes the API does not return - only a hint for whoever imports them, never shown on the site. */
async function possibleMatches(item) {
    const query = item.name.replace(/[^\w\s'-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!query) return [];
    const search = await apiGet(`${API}/api/products?q=${encodeURIComponent(query)}&limit=5`);
    return ((search && search.items) || []).slice(0, 3).map((product) => `${product.code} ${product.name || ''}`.trim());
}

async function fetchSnapshot(data, previous) {
    const codes = new Map();
    for (const sector of Object.values(data.sectors)) {
        for (const group of sector.groups) {
            for (const item of group.items) {
                if (!codes.has(item.code)) codes.set(item.code, item);
            }
        }
    }
    if (previous) {
        /* Re-check codes the last fetch did not find, plus codes added to industries.json since then. */
        const retry = new Set((previous.missing || []).map((entry) => entry.code));
        for (const code of Array.from(codes.keys())) if (!retry.has(code) && previous.products[code]) codes.delete(code);
    }

    const products = previous ? { ...previous.products } : {};
    const missing = [];
    let index = 0;
    for (const [code, item] of codes) {
        index++;
        const product = await findProduct(item.apiCode || code);
        if (product) {
            products[code] = toCard(product);
        } else {
            await sleep(250);
            missing.push({ code, possibleMatches: await possibleMatches(item) });
        }
        console.log(`[${index}/${codes.size}] ${code} ${product ? 'found' : 'NOT IN API'}${item.onSite ? '' : ' (PDF: needs adding)'}`);
        await sleep(250);
    }

    const snapshot = {
        generatedAt: previous ? previous.generatedAt : new Date().toISOString(),
        missingCheckedAt: new Date().toISOString(),
        api: API,
        missing,
        products
    };
    writeFile(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 1) + '\n');
    console.log(`Snapshot saved: ${Object.keys(products).length} products, ${missing.length} PDF codes not in the API.`);
    return snapshot;
}

async function fetchAllPages(query) {
    const items = [];
    for (let page = 1; ; page++) {
        const result = await apiGet(`${API}/api/products?${query}&limit=200&page=${page}`);
        const list = (result && result.items) || [];
        items.push(...list);
        if (!list.length || page * 200 >= (Number(result.total) || 0)) break;
        await sleep(150);
    }
    return items;
}

/* Every product in the mapped API sectors (shop "Best Sellers" order) plus the facet values used by the
   sidebar filters, for those products and the curated ones. */
async function fetchSectorData(snapshot) {
    const apiSectors = Array.from(new Set(Object.values(API_SECTORS).flatMap((entry) => entry.sectors)));
    const sectors = {};
    const products = {};
    for (const apiSector of apiSectors) {
        const items = await fetchAllPages(sourceQuery(apiSector));
        sectors[apiSector] = [];
        for (const item of items) {
            const card = toCard(item);
            if (!card.code || sectors[apiSector].includes(card.code)) continue;
            sectors[apiSector].push(card.code);
            products[card.code] = card;
        }
        console.log(`sector ${apiSector}: ${sectors[apiSector].length} products`);
        await sleep(150);
    }

    const wanted = new Set(Object.keys(products));
    Object.values(snapshot.products).forEach((card) => wanted.add(card.code));

    const definitions = (await apiGet(`${API}/api/products/filters`)).filters || {};
    const facetValues = {};
    const attributes = {};
    for (const filter of FILTERS.filter((entry) => entry.api)) {
        const seen = new Set();
        facetValues[filter.key] = [];
        for (const value of definitions[filter.key] || []) {
            if (!value.slug || seen.has(value.slug)) continue;
            seen.add(value.slug);
            const items = await fetchAllPages(`${filter.key}[]=${encodeURIComponent(value.slug)}`);
            let members = 0;
            for (const item of items) {
                const code = item.code || item.style_code;
                if (!wanted.has(code)) continue;
                const entry = attributes[code] = attributes[code] || {};
                (entry[filter.key] = entry[filter.key] || []);
                if (!entry[filter.key].includes(value.slug)) entry[filter.key].push(value.slug);
                members++;
            }
            if (members) facetValues[filter.key].push({ slug: value.slug, name: value.name || value.slug });
            await sleep(150);
        }
        console.log(`facet ${filter.key}: ${facetValues[filter.key].length} values used`);
    }

    const sectorData = { generatedAt: new Date().toISOString(), api: API, sectors, facetValues, attributes, products };
    writeFile(SECTORS_FILE, JSON.stringify(sectorData) + '\n');
    console.log(`Sector data saved: ${Object.keys(products).length} sector products, ${Object.keys(attributes).length} with facet values.`);
    return sectorData;
}

/* ------------------------------------------------------------------ brand logos (reuse the shop map) */

function loadBrandLogoMap() {
    try {
        const html = fs.readFileSync(SHOP_PC_FILE, 'utf8');
        const match = html.match(/function getBrandLogo\(b\)\s*\{\s*var m = (\{[\s\S]*?\});/);
        if (!match) return {};
        // eslint-disable-next-line no-new-func
        return Function('"use strict"; return (' + match[1] + ');')();
    } catch (error) {
        console.warn('Brand logo map not loaded:', error.message);
        return {};
    }
}

function brandLogoFor(map, brand) {
    const input = String(brand || '').toLowerCase().trim();
    if (!input) return null;
    const candidates = [
        input,
        input.replace(/\+/g, ' '),
        input.replace(/-/g, ' '),
        input.replace(/\+/g, ' ').replace(/-/g, ' '),
        input.replace(/[^a-z0-9& ]+/g, ' ').replace(/\s+/g, ' ').trim()
    ];
    for (const candidate of candidates) if (map[candidate]) return map[candidate];
    const normalised = candidates[candidates.length - 1] || input;
    for (const key of Object.keys(map)) {
        if (normalised.includes(key) || key.includes(normalised)) return map[key];
    }
    return null;
}

/* ------------------------------------------------------------------ shared page chrome */

const ICONS = {
    crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 17.5h17"/><path d="M4 17.5 6.2 9.2 10 13.2 12 6.2 14 13.2 17.8 9.2 20 17.5"/><circle cx="6.2" cy="7.4" r="1.15" fill="currentColor" stroke="none"/><circle cx="12" cy="4.6" r="1.15" fill="currentColor" stroke="none"/><circle cx="17.8" cy="7.4" r="1.15" fill="currentColor" stroke="none"/></svg>',
    needle: '<svg viewBox="0 0 40 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 8c2.2-3 4-2 5.2.6"/><path d="M2 7.5h12"/><path d="M3 7.5v13M13 7.5v13"/><path d="M2 20.5h12"/><path d="M3.4 11h9.2M3.4 14.2h9.2M3.4 17.2h9.2"/><path d="M13.5 9.5c3-1.4 4.6.4 5.2 2.4"/><path d="M22 5.2 35.2 24"/><circle cx="23.6" cy="7.6" r="1.15" fill="currentColor" stroke="none"/><circle cx="27.2" cy="13" r="0.85" fill="currentColor" stroke="none"/><circle cx="30.4" cy="17.6" r="0.85" fill="currentColor" stroke="none"/><circle cx="33.6" cy="22.2" r="0.85" fill="currentColor" stroke="none"/></svg>',
    shirt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.2 4.2 4 7.2l2.1 2.6 2-1.1V20h7.8V8.7l2 1.1L20 7.2l-4.2-3-1.6 2.2H9.8L8.2 4.2z"/></svg>'
};

function headStart() {
    return `<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="utf-8">
    <base href="/">
    <!-- Google Consent Mode v2 defaults (must stay before the Google tag) -->
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
        wait_for_update: 500
      });
      gtag('set', 'ads_data_redaction', true);
      gtag('set', 'url_passthrough', true);
      (function () {
        try {
          var c = JSON.parse(localStorage.getItem('brandedukCookieConsent') || 'null');
          if (c && c.timestamp && Date.now() - c.timestamp < 31536000000) {
            var ads = c.advertising ? 'granted' : 'denied';
            gtag('consent', 'update', { ad_storage: ads, ad_user_data: ads, ad_personalization: ads, analytics_storage: c.analytics ? 'granted' : 'denied' });
          }
        } catch (e) {}
        try {
          var u = new URL(location.href), strip = false;
          ['token', 'email', 'session_id', 'access_token', 'id_token', 'refresh_token'].forEach(function (k) {
            if (u.searchParams.has(k)) { u.searchParams.delete(k); strip = true; }
          });
          if (strip) gtag('set', 'page_location', u.href);
        } catch (e) {}
      })();
      window.brandedAdsConversion = window.brandedAdsConversion || function () { (window.brandedAdsQueue = window.brandedAdsQueue || []).push(arguments); };
    </script>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=AW-438771987"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'AW-438771987');
    </script>
    <script defer src="/brandedukv15-child/assets/js/cookie-consent.js?v=20261016"></script>
    <script defer src="/brandedukv15-child/assets/js/ads-conversions.js?v=20261009"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#273469">`;
}

function headAssets() {
    return `    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/brandedukv15-child/assets/css/components/header.css?v=20260926-vatgap">
    <link rel="stylesheet" href="/brandedukv15-child/assets/css/components/pc-header.css?v=20261012-homechrome">
    <link rel="stylesheet" href="/brandedukv15-child/assets/css/components/promo-bar.css?v=20260425a">
    <link rel="stylesheet" href="/mobile/css/mobile.css?v=20260923-home-nav">
    <link rel="stylesheet" href="/mobile/css/header-v2.css?v=20261025-worddn">
    <link rel="stylesheet" href="/mobile/footer/footer.css?v=20260409B">
    <link rel="stylesheet" href="/footer-dev/pc-footer.css?v=20261009-phones">
    <link rel="stylesheet" href="/brandedukv15-child/assets/css/pages/industries.css?v=${ASSET_VERSION}">
    <script src="/brandedukv15-child/assets/js/shared-config.js?v=20261005-megafit"></script>
    <script src="/brandedukv15-child/assets/js/api-config.js?v=20261016-apiproxy"></script>
    <script src="/brandedukv15-child/assets/js/pc-header-template.js?v=20261015-nodeals"></script>
    <script src="/brandedukv15-child/assets/js/pc-header.js?v=20261012-navmore"></script>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    <link rel="preconnect" href="https://cdn.pimber.ly">
    <link rel="preload" as="script" href="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js" media="(min-width: 700px)">
    <link rel="preload" as="fetch" href="/brandedukv15-child/assets/images/ui/cart-icon-loader.json" crossorigin media="(min-width: 700px)">
    <link rel="stylesheet" href="/brandedukv15-child/assets/css/components/cart-lottie-icon.css?v=20260927-cartlottie2">
    <script src="/brandedukv15-child/assets/js/cart-lottie-icon.js?v=20260927-cartlottie2" data-header-cart></script>
    <script src="/footer-dev/pc-footer.js?v=20261020-noclose" defer></script>`;
}

/* Same header and menu as the mobile home (index-mobile.html). industries.js opens the menu and runs
   search, VAT and the basket count; mobile/js/header-menu.js switches the menu panels. */
const PHONE_PATH = 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z';

function mobileHeader() {
    return `    <header class="mobile-header mobile-header--v2">
        <div class="mh-bar">
            <button type="button" class="mh-icon-btn" id="menuToggle" aria-label="Open menu" aria-expanded="false" aria-controls="slideMenu">
                <svg class="mh-icon-open" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                    <line x1="4" y1="7" x2="20" y2="7"></line>
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                    <line x1="4" y1="17" x2="20" y2="17"></line>
                </svg>
                <svg class="mh-icon-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                </svg>
            </button>
            <a href="/index-mobile.html?force=mobile" class="mobile-logo-center mh-logo" aria-label="brandedUK home">
                <img class="mobile-logo-badge" src="/brandedukv15-child/assets/videos/use-the-provided-circular-1727756126.gif?v=20261001-newgif" alt="" width="64" height="64">
                <img class="mobile-logo-word" src="/brandedukv15-child/assets/images/ui/Branded UK Logo on Transparent Background.png?v=20261002-logocombo" alt="branded" width="120" height="52">
            </a>
            <div class="mh-actions">
                <a href="tel:02089742722" class="mh-icon-btn" aria-label="Call 020 8974 2722">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="${PHONE_PATH}"></path>
                    </svg>
                </a>
                <a href="/basket.html#orderSummary" class="mh-icon-btn mh-cart" aria-label="View basket">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span class="mh-cart-count" id="cartBadge" hidden>0</span>
                </a>
            </div>
        </div>
        <div class="mh-search">
            <div class="mh-search-control">
                <div class="search-wrapper-expand">
                    <input type="text" placeholder="Search 9,000+ products..." id="searchInput" autocomplete="off" class="search-input-expand" aria-label="Search products">
                    <svg class="search-icon-expand" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </div>
                <span class="mh-search-divider" aria-hidden="true"></span>
                <div class="mh-search-vat vat-toggle-mobile" id="vatToggleContainer">
                    <span class="vat-label vat-label--exc">EXC VAT</span>
                    <input type="checkbox" id="vatToggleCheckbox" class="vat-checkbox">
                    <label for="vatToggleCheckbox" class="vat-toggle-label">Toggle VAT</label>
                    <span class="vat-label vat-label--inc">INC VAT</span>
                </div>
            </div>
        </div>
    </header>
    <header class="site-header"></header>`;
}

function mobileMenu() {
    const helpIcon = '<span class="mh-row-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M9.4 9.6a2.6 2.6 0 1 1 3.4 2.5c-.8.4-1.3 1-1.3 1.9"/></svg></span>';
    const productRow = '<button type="button" class="mh-row" data-mh-open="products"><span class="mh-row-icon" aria-hidden="true"><img class="mh-bag mh-product" src="/brandedukv15-child/assets/images/icons/menu/shop-product.png?v=20261016-file" alt="" width="46" height="46"></span>Shop by Product<span class="mh-chev" aria-hidden="true"></span></button>';
    const industryRow = '<button type="button" class="mh-row" data-mh-open="industries"><span class="mh-row-icon" aria-hidden="true"><img class="mh-bag mh-industry" src="/brandedukv15-child/assets/images/icons/menu/shop-by-industry.png?v=20261016-file" alt="" width="46" height="46"></span>Shop by Industry<span class="mh-chev" aria-hidden="true"></span></button>';
    const dealsRow = '<a class="mh-row" href="/bundles.html"><span class="mh-row-icon" aria-hidden="true"><img class="mh-bag mh-deals" src="/brandedukv15-child/assets/images/icons/menu/deals-bundles.png?v=20261016-nobg" alt="" width="46" height="46"></span>Deals &amp; Bundles<span class="mh-chev" aria-hidden="true"></span></a>';
    const helpRow = `<button type="button" class="mh-row" data-mh-open="help">${helpIcon}Help &amp; Support<span class="mh-chev" aria-hidden="true"></span></button>`;
    const productTypes = [
        ['tshirts', 'icon-shirt-71%201.png', 'T-Shirts'],
        ['polos', 'Polo.png', 'Polo Shirts'],
        ['[]=hoodies&amp;productType[]=sweatshirts', 'icon-hoodies-71%201.png', 'Hoodies &amp; Sweatshirts'],
        ['[]=jackets&amp;productType[]=softshells', 'Jacket.png', 'Jackets &amp; Softshell'],
        ['safety-vests', 'Hi%20Vis.png', 'Hi-Vis Clothing'],
        ['trousers', 'Trousers.png', 'Work Trousers'],
        ['aprons', 'Apron.png', 'Work &amp; Uniforms'],
        ['fleece', 'Fleece.png', 'Fleeces'],
        ['caps', 'Cap.png', 'Headwear']
    ].map(([type, icon, label]) => `
            <a class="mh-row" href="/shop-pc.html?productType${type.startsWith('[]') ? type : '=' + type}"><span class="mh-row-icon mh-row-icon--pc" aria-hidden="true"><img src="/brandedukv15-child/assets/images/ui/icons/categories/${icon}" alt=""></span>${label}<span class="mh-chev" aria-hidden="true"></span></a>`).join('');
    const industryLinks = [
        ['construction', '<path d="M5 15.5a7 7 0 0 1 14 0"/><path d="M3.5 15.5h17v2.2h-17z"/>', 'Construction'],
        ['hospitality', '<path d="M7 4v6.2a2 2 0 1 0 2 0V4"/><path d="M8 12.2V20"/><path d="M15 4c2.2 1.6 2.2 4 0 5.6V20"/>', 'Hospitality'],
        ['healthcare', '<path d="M10 4.5h4v15h-4z"/><path d="M4.5 10h15v4h-15z"/>', 'Healthcare'],
        ['education', '<path d="M3 10.5 12 6l9 4.5L12 15z"/><path d="M7 12.2v3.6c1.6 1.6 8.4 1.6 10 0v-3.6"/>', 'Schools &amp; Leavers'],
        ['corporate', '<rect x="3.5" y="8" width="17" height="11" rx="1.6"/><path d="M8.5 8V6.2A1.8 1.8 0 0 1 10.3 4.4h3.4A1.8 1.8 0 0 1 15.5 6.2V8"/>', 'Corporate'],
        ['sports', '<path d="M8 4.5h8v5.2a4 4 0 0 1-8 0z"/><path d="M12 13.7V16.5"/><path d="M9.2 19.5h5.6"/>', 'Sports'],
        ['cleaning', '', 'Cleaning'],
        ['logistics', '', 'Logistics'],
        ['retail', '', 'Retail']
    ].map(([slug, icon, label]) => `
            <a class="mh-row" href="/industries/${slug}.html">${icon ? `<span class="mh-row-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${icon}</svg></span>` : ''}${label}<span class="mh-chev" aria-hidden="true"></span></a>`).join('');

    return `    <div class="menu-overlay" id="menuOverlay"></div>
    <nav class="slide-menu slide-menu--v2" id="slideMenu" aria-label="Menu">
        <div class="mh-drawer-top">
            <button type="button" class="mh-icon-btn mh-back" id="mhBack" hidden aria-label="Back to menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18 9 12l6-6"></path></svg>
            </button>
        </div>
        <div class="mh-panels">
        <div class="mh-view" data-mh-view="main">
        <div class="mh-view-scroll">
            <div class="mh-menu-block">
            ${productRow}
            ${industryRow}
            ${dealsRow}
            </div>
            <div class="mh-menu-block">
            ${helpRow}
            <button type="button" class="mh-row" data-mh-quote><span class="mh-row-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3.5h7.2L19 8.2V20.5H7z"/><path d="M14.2 3.5V8.2H19"/><path d="M9.5 13h5"/><path d="M9.5 16.5h5"/></svg></span>Request a Quote</button>
            <a class="mh-row" href="/track-order.html"><span class="mh-row-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2.5" y="8" width="11" height="7.5" rx="1"/><path d="M13.5 11H17l3 2.6v1.9h-6.5"/><circle cx="6.5" cy="17.8" r="1.5"/><circle cx="17.2" cy="17.8" r="1.5"/></svg></span>Track Your Order<span class="mh-chev" aria-hidden="true"></span></a>
            <a class="mh-row" href="/about.html"><span class="mh-row-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg></span>About Us<span class="mh-chev" aria-hidden="true"></span></a>
            <button type="button" class="mh-row" data-mh-quote><span class="mh-row-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${PHONE_PATH}"/></svg></span>Contact Us</button>
            <div class="mh-contact-stack">
            <a class="mh-contact mh-contact--call" href="tel:02089742722">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${PHONE_PATH}"/></svg>
                <span><strong>Call Us</strong><small>020 8974 2722</small></span>
            </a>
            <a class="mh-contact mh-contact--email" href="mailto:info@brandeduk.com">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span><strong>Email Us</strong><small>info@brandeduk.com</small></span>
            </a>
            </div>
            </div>
        </div>
        </div>
        <div class="mh-view" data-mh-view="products" hidden>
            <div class="mh-section-title"><span class="mh-row-icon" aria-hidden="true"><img class="mh-bag mh-product" src="/brandedukv15-child/assets/images/icons/menu/shop-product.png?v=20261016-file" alt="" width="46" height="46"></span>Shop by Product</div>
            <div class="mh-view-scroll">${productTypes}
            <a class="mh-row mh-row--eco" href="/shop-pc.html?accreditation=recycled"><span class="mh-row-icon mh-row-icon--pc" aria-hidden="true"><img src="/brandedukv15-child/assets/images/ui/icons/categories/Recycle.png" alt=""></span>Sustainable / Recycled &amp; Organic<span class="mh-chev" aria-hidden="true"></span></a>
            <a class="mh-row" href="/shop-pc.html">View All Categories<span class="mh-chev" aria-hidden="true"></span></a>
                <div class="mh-sibling-group">
            ${industryRow}
            ${dealsRow}
            ${helpRow}
                </div>
            </div>
        </div>
        <div class="mh-view" data-mh-view="industries" hidden>
            <div class="mh-section-title"><span class="mh-row-icon" aria-hidden="true"><img class="mh-bag mh-industry" src="/brandedukv15-child/assets/images/icons/menu/shop-by-industry.png?v=20261016-file" alt="" width="46" height="46"></span>Shop by Industry</div>
            <div class="mh-view-scroll">${industryLinks}
            <a class="mh-row" href="/industries.html">View All Industries<span class="mh-chev" aria-hidden="true"></span></a>
                <div class="mh-sibling-group">
            ${productRow}
            ${dealsRow}
            ${helpRow}
                </div>
            </div>
        </div>
        <div class="mh-view" data-mh-view="help" hidden>
            <div class="mh-section-title">${helpIcon}Help &amp; Support</div>
            <div class="mh-view-scroll">
            <a class="mh-row" href="/index-mobile.html?force=mobile#faq">${helpIcon}Help &amp; FAQs<span class="mh-chev" aria-hidden="true"></span></a>
            <a class="mh-row" href="/pricing-guide.html">Delivery &amp; Returns<span class="mh-chev" aria-hidden="true"></span></a>
                <div class="mh-sibling-group">
            ${productRow}
            ${industryRow}
            ${dealsRow}
                </div>
            </div>
        </div>
        </div>
    </nav>`;
}

function pageEnd(options) {
    const filterButton = options && options.filters ? `
        <button type="button" class="nav-item nav-item--filter" data-ind-open-filters aria-controls="filtersDropup" aria-expanded="false">
            ${FILTER_ICON}
            <span class="nav-item-label">Filter</span>
        </button>` : '';
    return `    <div data-pc-footer></div>
    <div data-mobile-footer></div>

${mobileMenu()}

    <nav class="bottom-nav" aria-label="Mobile navigation">
        <a href="/index-mobile.html?force=mobile" class="nav-item" data-home-nav>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 11 12 3l9 8"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path>
            </svg>
            <span class="nav-item-label">Home</span>
        </a>
        <a href="/shop.html" class="nav-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>
            <span class="nav-item-label">Shop</span>
        </a>${filterButton}
        <a href="/profile.html" class="nav-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span class="nav-item-label">Account</span>
        </a>
        <a href="https://wa.me/447447348564" class="nav-item" target="_blank" rel="noopener" data-open-whatsapp aria-label="Chat">
            <span class="chat-nav-icon" aria-hidden="true"><span class="chat-nav-bubble"><span class="chat-nav-dot"></span><span class="chat-nav-dot"></span><span class="chat-nav-dot"></span></span></span>
            <span class="nav-item-label">Chat</span>
        </a>
    </nav>

    <script>if (window.BrandedPcHeader) window.BrandedPcHeader.mount();</script>
    <script src="/brandedukv15-child/assets/js/vat-toggle.js?v=20251230"></script>
    <script src="/brandedukv15-child/assets/js/pages/industries.js?v=20261020-items" defer></script>
    <script src="/mobile/js/header-menu.js?v=20261018-drawer" defer></script>
    <script src="/mobile/js/popup-contact.js?v=20261003-consent" defer></script>
    <script src="/mobile/footer/footer.js?v=20261020-noclose" defer></script>
</body>
</html>
`;
}

function sectorImage(slug, alt, extra) {
    const base = `/brandedukv15-child/assets/images/industries/${slug}`;
    return `<img src="${base}-800.webp" srcset="${base}-800.webp 800w, ${base}.webp 1600w" sizes="${extra && extra.sizes ? extra.sizes : '(min-width: 900px) 720px, 100vw'}" width="1600" height="900" alt="${esc(alt)}"${extra && extra.lazy ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`;
}

/* ------------------------------------------------------------------ product card (same markup/classes as shop-pc.html) */

function productCard(card, logoMap) {
    const href = `/product/${encodeURIComponent(card.code)}`;
    const methods = [];
    if (card.isBestSeller) methods.push(`<span class="method-item best-seller">${ICONS.crown}<span>Best Seller</span></span>`);
    if (card.isRecommended) methods.push('<span class="method-item recommended"><span>Recommended</span></span>');
    if (card.customization.includes('embroidery')) methods.push(`<span class="method-item embroidery">${ICONS.needle}<span>EMB</span></span>`);
    if (card.customization.includes('print') && !/beanie/i.test(card.name)) methods.push(`<span class="method-item print">${ICONS.shirt}<span>Print</span></span>`);

    const logo = brandLogoFor(logoMap, card.brand);
    const brandHtml = !card.brand ? '' : logo
        ? `<img src="/${esc(logo)}" alt="${esc(card.brand)}" class="brand-logo" title="${esc(card.brand)}" loading="lazy" decoding="async">`
        : `<span class="brand-name">${esc(card.brand)}</span>`;

    const colors = card.colors.length ? card.colors : [{ name: 'Default', image: card.image }];
    const dots = colors.map((color, i) => `<button type="button" class="color-dot${i === 0 ? ' active' : ''}" data-color="${esc(color.name)}" data-main="${esc(color.image)}" title="${esc(color.name)}" aria-label="${esc(color.name)}"></button>`).join('');
    const controls = colors.length > 6 ? `
                        <div class="color-slider-controls">
                            <button type="button" class="color-arrow color-prev" aria-label="Previous colours">&lsaquo;</button>
                            <div class="color-progress"><div class="color-progress-bar" style="width: ${Math.min(100, (7 / colors.length) * 100).toFixed(0)}%;"></div></div>
                            <button type="button" class="color-arrow color-next" aria-label="Next colours">&rsaquo;</button>
                        </div>` : '';

    return `
                <article class="product-card" data-code="${esc(card.code)}" data-href="${href}">
                    <a class="product-media" href="${href}" tabindex="-1" aria-hidden="true">
                        <img src="${esc(card.image)}" alt="${esc(card.name)}" class="product-image" width="400" height="400" loading="lazy" decoding="async">
                    </a>
                    <div class="product-info">
                        <div class="product-method-row">${methods.join('<span class="method-sep" aria-hidden="true"></span>')}</div>
                        <div class="product-code-row">
                            <span class="product-code">${esc(card.code)}</span>
                            ${brandHtml}
                        </div>
                        <h3 class="product-name"><a href="${href}">${esc(card.name)}</a></h3>
                        <div class="product-price" data-price="${card.price.toFixed(2)}">
                            <span class="price-label">From</span>
                            <span class="price-value">${money(card.price)}</span>
                            <span class="price-suffix">ex VAT</span>
                        </div>
                        <div class="product-colors-wrapper">
                            <div class="product-colors">${dots}</div>${controls}
                        </div>
                    </div>
                </article>`;
}

/* ------------------------------------------------------------------ filters + client data */

const IMAGE_BASE = 'https://cdn.pimber.ly/public/asset/raw/571f95845f13380f0056d06a/';
const LETTER_SIZES = ['XXS', '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL'];

function sizeName(raw) {
    let value = String(raw || '').trim().replace(/\s+(relaxed|classic|reg|regular|slim|long|tall|short|petite)$/i, '').trim();
    if (!value) return '';
    if (/^\d+\.0$/.test(value)) value = value.replace(/\.0$/, '');
    if (/^one[\s-]?size$|^os$/i.test(value)) return 'One size';
    const upper = value.toUpperCase().replace(/^XXXL$/, '3XL').replace(/^XXL$/, '2XL');
    return LETTER_SIZES.includes(upper) ? upper : value;
}

function sizeRank(name) {
    const letter = LETTER_SIZES.indexOf(name);
    if (letter > -1) return letter;
    const women = name.match(/^wom\w*\s+(\d+)/i);
    if (women) return 100 + Number(women[1]);
    if (/^\d+(\.\d+)?$/.test(name)) return 200 + Number(name);
    const age = name.match(/^(\d+)/);
    if (age) return 400 + Number(age[1]);
    if (name === 'One size') return 900;
    return 1000;
}

function compactImage(url) {
    return url && url.startsWith(IMAGE_BASE) ? '~' + url.slice(IMAGE_BASE.length) : url;
}

function methodFlags(card) {
    return (card.isBestSeller ? 1 : 0) | (card.isRecommended ? 2 : 0)
        | (card.customization.includes('embroidery') ? 4 : 0) | (card.customization.includes('print') ? 8 : 0);
}

/* Facet values for one product, keyed like the sidebar filters. */
function productFacets(card, sectorData, names) {
    const facets = {};
    const add = (key, name) => {
        const slug = slugify(name);
        if (!slug) return;
        names[key] = names[key] || {};
        if (!names[key][slug]) names[key][slug] = name;
        (facets[key] = facets[key] || []);
        if (!facets[key].includes(slug)) facets[key].push(slug);
    };
    if (card.brand) add('brand', card.brand);
    if (card.productType) add('productType', card.productType);
    const sizes = card.sizes && card.sizes.length ? card.sizes : ((sectorData.products[card.code] || {}).sizes || []);
    sizes.map(sizeName).filter(Boolean).forEach((name) => add('size', name));
    const attributes = sectorData.attributes[card.code] || {};
    for (const filter of FILTERS.filter((entry) => entry.api)) {
        if (attributes[filter.key] && attributes[filter.key].length) facets[filter.key] = attributes[filter.key].slice();
    }
    return facets;
}

function filterOptions(records, sectorData, names) {
    const options = [];
    for (const filter of FILTERS) {
        const counts = {};
        for (const record of records) for (const slug of record.f[filter.key] || []) counts[slug] = (counts[slug] || 0) + 1;
        let values;
        if (filter.api) {
            values = (sectorData.facetValues[filter.key] || []).filter((value) => counts[value.slug])
                .map((value) => ({ slug: value.slug, name: value.name, count: counts[value.slug] }));
            if (filter.key === 'primaryColour' || filter.key === 'fabric') values.sort((a, b) => b.count - a.count);
        } else {
            values = Object.keys(counts).map((slug) => ({ slug, name: names[filter.key][slug], count: counts[slug] }));
            if (filter.key === 'size') values.sort((a, b) => sizeRank(a.name) - sizeRank(b.name) || a.name.localeCompare(b.name));
            else values.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        }
        if (values.length > 1) options.push({ ...filter, values });
    }
    return options;
}

function filterSection(option) {
    const id = `ind-filter-${option.key}`;
    const items = option.values.map((value, index) => {
        const hiddenByLimit = !option.swatch && index >= FILTER_VISIBLE_LIMIT ? ' is-hidden-by-limit' : '';
        return option.swatch
            ? `<label class="color-swatch-item" data-color="${esc(value.slug)}" data-filter-option title="${esc(value.name)}"><input type="checkbox" value="${esc(value.slug)}" data-filter-key="${option.key}"><span class="color-swatch-circle"></span><span class="color-swatch-name">${esc(value.name)}</span><span class="count">${value.count}</span></label>`
            : `<label class="filter-checkbox-item${hiddenByLimit}" data-filter-option><input type="checkbox" value="${esc(value.slug)}" data-filter-key="${option.key}"><span>${esc(value.name)}</span><span class="count">(${value.count})</span></label>`;
    }).join('\n                        ');
    const more = !option.swatch && option.values.length > FILTER_VISIBLE_LIMIT;
    return `
                <div class="filter-expandable-row${option.expanded ? ' expanded' : ''}" data-filter-row="${option.key}" role="button" tabindex="0" aria-expanded="${option.expanded ? 'true' : 'false'}" aria-controls="${id}">
                    <div class="filter-title-wrap"><h4>${esc(option.title)}</h4><span class="filter-selection-count" hidden>0</span></div>
                    <div class="filter-row-actions"><button type="button" class="filter-section-clear" data-filter-clear="${option.key}" hidden>Clear</button><span class="filter-expandable-arrow" aria-hidden="true"></span></div>
                </div>
                <div class="filter-expandable-content" id="${id}">${option.searchable && more ? `
                    <input type="search" class="filter-list-search" placeholder="Search ${esc(option.title.toLowerCase())}" aria-label="Search ${esc(option.title.toLowerCase())}" data-filter-search="${option.key}">` : ''}
                    <div class="${option.swatch ? 'filter-color-swatches' : 'filter-checkbox-list'}">
                        ${items}
                    </div>${more ? `
                    <button type="button" class="filter-list-toggle" data-filter-toggle aria-expanded="false">Show more</button>` : ''}
                </div>`;
}

function filtersBody(options, priceMin, priceMax) {
    return `<div class="ind-filters__body" data-ind-filters>
                <div class="filter-group">
                    <h4>Search products</h4>
                    <input type="search" class="filter-search" placeholder="Search these items" aria-label="Search these items" data-ind-search>
                </div>
                <div class="price-range-section expanded" data-price-min="${priceMin}" data-price-max="${priceMax}">
                    <div class="price-range-header" role="button" tabindex="0" aria-expanded="true">
                        <h4>Price Range</h4>
                        <span class="price-range-arrow" aria-hidden="true"></span>
                    </div>
                    <div class="price-range-display" data-price-display>${money(priceMin)} &ndash; ${money(priceMax)}</div>
                    <div class="price-range-slider-container">
                        <div class="price-range-track"></div>
                        <div class="price-range-selected" data-price-selected></div>
                        <input type="range" class="price-slider" min="${priceMin}" max="${priceMax}" step="1" value="${priceMin}" aria-label="Minimum price" data-price-slider="min">
                        <input type="range" class="price-slider" min="${priceMin}" max="${priceMax}" step="1" value="${priceMax}" aria-label="Maximum price" data-price-slider="max">
                    </div>
                    <div class="price-range-inputs">
                        <div class="price-input-group"><label for="indPriceMin">Min</label><input type="number" class="price-input" id="indPriceMin" min="0" step="1" value="${priceMin}" inputmode="numeric" data-price-input="min"></div>
                        <div class="price-input-group"><label for="indPriceMax">Max</label><input type="number" class="price-input" id="indPriceMax" min="0" step="1" value="${priceMax}" inputmode="numeric" data-price-input="max"></div>
                    </div>
                </div>${options.map(filterSection).join('')}
            </div>`;
}

const FILTER_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><line x1="6" y1="21" x2="6" y2="3"></line><line x1="12" y1="21" x2="12" y2="3"></line><line x1="18" y1="21" x2="18" y2="3"></line><circle cx="6" cy="8" r="2"></circle><circle cx="12" cy="14" r="2"></circle><circle cx="18" cy="10" r="2"></circle></svg>';

function filtersDrawer() {
    return `    <div class="filters-overlay" id="filtersOverlay" data-ind-close-filters></div>
    <div class="filters-dropup ind-filters-drawer" id="filtersDropup" role="dialog" aria-modal="true" aria-label="Filter products" inert>
        <div class="filters-dropup__header">
            <h2 class="filters-dropup__title">Filter By</h2>
            <button type="button" class="filters-dropup__clear" data-ind-clear>Clear All</button>
            <button type="button" class="filters-dropup__close" data-ind-close-filters aria-label="Close filters">&times;</button>
        </div>
        <div class="filters-dropup__body" data-ind-drawer-body></div>
        <div class="ind-drawer-foot">
            <button type="button" class="ind-btn ind-btn--primary" data-ind-close-filters>Show <span data-ind-visible-count></span> items</button>
        </div>
    </div>
`;
}

/* ------------------------------------------------------------------ sector page */

function buildSector(slug, sector, data, snapshot, sectorData, logoMap, report) {
    const pageUrl = `${SITE}/industries/${slug}`;
    const groups = [];
    const shownCodes = [];
    const missing = [];
    let hidden = 0;

    for (const group of sector.groups) {
        const cards = [];
        for (const item of group.items) {
            if (ON_SITE_ONLY && !item.onSite) { hidden++; continue; }
            const card = snapshot.products[item.code];
            if (!card) {
                if (item.onSite) console.warn(`[${slug}] ${item.code} is marked "On site" in the PDF but the API does not return it - skipped`);
                missing.push({ ...item, group: group.name, issue: ISSUE_NOT_IN_API });
                continue;
            }
            /* The detail endpoint returns bare records (price 0, no sizes) for some styles that cannot be ordered yet. */
            if (!card.image || !(card.price > 0)) {
                console.warn(`[${slug}] ${item.code} is in the API without ${card.image ? 'a price' : 'an image'} - skipped`);
                missing.push({ ...item, group: group.name, issue: ISSUE_INCOMPLETE });
                continue;
            }
            cards.push(card);
            if (!shownCodes.includes(item.code)) shownCodes.push(item.code);
        }
        if (cards.length) groups.push({ name: group.name, id: slugify(group.name), cards });
    }

    const shownCount = groups.reduce((sum, group) => sum + group.cards.length, 0);

    /* Curated cards stay in the HTML; the rest of the API sector is rendered client-side from the JSON. */
    const mapping = API_SECTORS[slug] || { sectors: [] };
    const curatedCards = [];
    const curatedCodes = new Set();
    for (const group of groups) {
        for (const card of group.cards) {
            if (curatedCodes.has(card.code)) continue;
            curatedCodes.add(card.code);
            curatedCards.push(card);
        }
    }
    const extras = [];
    const extraCodes = new Set();
    for (const apiSector of mapping.sectors) {
        for (const code of sectorData.sectors[apiSector] || []) {
            const card = sectorData.products[code];
            if (!card || curatedCodes.has(code) || extraCodes.has(code) || !card.image || !(card.price > 0)) continue;
            extraCodes.add(code);
            extras.push(card);
        }
    }
    const moreId = 'more';
    const moreTitle = mapping.more || '';
    const names = {};
    const records = curatedCards.map((card) => ({ c: card.code, n: card.name, p: card.price, f: productFacets(card, sectorData, names) }))
        .concat(extras.map((card) => {
            const colors = card.colors.length ? card.colors : [{ name: 'Default', image: card.image }];
            return {
                c: card.code, n: card.name, p: card.price, f: productFacets(card, sectorData, names), x: 1,
                b: card.brand, i: compactImage(card.image), m: methodFlags(card),
                k: colors.map((color) => [color.name, compactImage(color.image)])
            };
        }));
    const options = filterOptions(records, sectorData, names);
    const prices = records.map((record) => record.p);
    const priceMin = Math.floor(Math.min(...prices));
    const priceMax = Math.ceil(Math.max(...prices));
    const logos = {};
    for (const card of extras) {
        const logo = card.brand && brandLogoFor(logoMap, card.brand);
        if (logo) logos[card.brand] = '/' + logo;
    }
    const clientData = { version: ASSET_VERSION, imageBase: IMAGE_BASE, batch: MORE_BATCH, logos, products: records };
    writeFile(path.join(CLIENT_DATA_DIR, slug + '.json'), JSON.stringify(clientData));
    const totalStyles = curatedCards.length + extras.length;

    report.push({ slug, title: sector.title, pdfTotal: sector.pdfTotal, shown: shownCount, curated: curatedCards.length, extra: extras.length, total: totalStyles, apiSectors: mapping.sectors, hidden, missing });

    const breadcrumb = {
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
            { '@type': 'ListItem', position: 2, name: 'Industries', item: SITE + '/industries' },
            { '@type': 'ListItem', position: 3, name: sector.title, item: pageUrl }
        ]
    };
    const collection = {
        '@type': 'CollectionPage',
        name: sector.title,
        description: sector.metaDescription,
        url: pageUrl,
        isPartOf: { '@type': 'WebSite', name: 'BrandedUK', url: SITE + '/' },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: shownCodes.length,
            itemListElement: shownCodes.map((code, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: snapshot.products[code].name,
                url: `${SITE}/product/${encodeURIComponent(snapshot.products[code].code)}`
            }))
        }
    };
    const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [breadcrumb, collection] }, null, 2).replace(/</g, '\\u003c');

    const quoteMessage = `Hi, I would like a bulk quote for ${sector.title.toLowerCase()}.`;
    const styles = (count) => `${count} ${count === 1 ? 'item' : 'items'}`;
    const jumpLinks = groups.map((group) => `<a href="/industries/${slug}#${group.id}" data-ind-chip="${group.id}">${esc(group.name)} <span>${group.cards.length}</span></a>`)
        .concat(extras.length ? [`<a href="/industries/${slug}#${moreId}" data-ind-chip="${moreId}">${esc(moreTitle)} <span>${extras.length}</span></a>`] : [])
        .join('\n                    ');
    const sections = groups.map((group) => `
            <section class="ind-group" id="${group.id}" aria-labelledby="${group.id}-title" data-ind-group>
                <div class="ind-group__head">
                    <h2 id="${group.id}-title">${esc(group.name)}</h2>
                    <span class="ind-group__count" data-ind-group-count>${styles(group.cards.length)}</span>
                </div>
                <div class="products-grid">${group.cards.map((card) => productCard(card, logoMap)).join('')}
                </div>
            </section>`).join('\n');
    const moreSection = extras.length ? `
            <section class="ind-group ind-more" id="${moreId}" aria-labelledby="${moreId}-title" data-ind-more>
                <div class="ind-group__head">
                    <h2 id="${moreId}-title">${esc(moreTitle)}</h2>
                    <span class="ind-group__count" data-ind-group-count>${styles(extras.length)}</span>
                </div>
                <p class="ind-more__intro">More items from our ${esc(sector.title.toLowerCase())} range, best sellers first.</p>
                <div class="products-grid" data-ind-more-grid aria-live="polite"></div>
                <div class="ind-more__actions">
                    <p class="ind-more__status" data-ind-more-status>Loading items&hellip;</p>
                    <button type="button" class="ind-btn ind-btn--ghost" data-ind-more-btn hidden>Show more</button>
                </div>
            </section>` : '';
    const filterBody = filtersBody(options, priceMin, priceMax);

    const others = SECTOR_ORDER.filter((other) => other !== slug)
        .map((other) => `<a href="/industries/${other}">${esc(data.sectors[other].title)}</a>`).join('\n                ');

    const html = `${headStart()}
    <title>${esc(sector.seoTitle)}</title>
    <meta name="description" content="${esc(sector.metaDescription)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${pageUrl}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${esc(sector.seoTitle)}">
    <meta property="og:description" content="${esc(sector.metaDescription)}">
    <meta property="og:image" content="${SITE}/brandedukv15-child/assets/images/industries/${slug}.webp">
    <meta property="og:site_name" content="BrandedUK">
    <meta property="og:locale" content="en_GB">
    <script type="application/ld+json">
${jsonLd}
    </script>
${headAssets()}
    <link rel="stylesheet" href="/mobile/css/chat-nav-icon.css?v=20261020b">
</head>
<body class="ind-page ind-page--sector" data-sector="${slug}" data-ind-data="${CLIENT_DATA_URL}/${slug}.json?v=${ASSET_VERSION}">
${mobileHeader()}

    <main class="ind-main">
        <nav class="ind-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span><a href="/industries">Industries</a><span aria-hidden="true">/</span><span aria-current="page">${esc(sector.title)}</span>
        </nav>

        <section class="ind-hero">
            <div class="ind-hero__text">
                <p class="ind-eyebrow">Shop by industry</p>
                <h1>${esc(sector.title)}</h1>
                <p class="ind-intro">${esc(sector.intro)}</p>
                <p class="ind-meta">${styles(totalStyles)} &middot; Prices shown <span data-ind-vat-label>ex VAT</span> &middot; Standard production 7&ndash;10 working days after artwork approval</p>
                <div class="ind-cta-row">
                    <a class="ind-btn ind-btn--primary" href="/bulk-orders" data-open-contact="1" data-contact-message="${esc(quoteMessage)}">Get a bulk quote</a>
                    <a class="ind-btn ind-btn--ghost" href="/index.html#industries">All industries</a>
                </div>
            </div>
            <div class="ind-hero__media">
                ${sectorImage(slug, sector.title)}
            </div>
        </section>

        <div class="ind-shop">
            <aside class="ind-filters filters-sidebar" aria-label="Filter products" data-ind-sidebar>
                <div class="filters-header">
                    <h3>Filter By</h3>
                    <button type="button" class="clear-all-btn" data-ind-clear>Clear All</button>
                </div>
            ${filterBody}
            </aside>

            <div class="ind-results">
                <nav class="ind-jump" aria-label="${esc(sector.title)} categories" data-ind-jump>
                    <button type="button" class="ind-jump__arrow ind-jump__arrow--prev" aria-label="Scroll categories left" data-ind-jump-prev hidden>&lsaquo;</button>
                    <div class="ind-jump__inner" data-ind-jump-row>
                    ${jumpLinks}
                    </div>
                    <button type="button" class="ind-jump__arrow ind-jump__arrow--next" aria-label="Scroll categories right" data-ind-jump-next hidden>&rsaquo;</button>
                </nav>

                <div class="ind-toolbar">
                    <button type="button" class="ind-filter-btn" data-ind-open-filters aria-controls="filtersDropup" aria-expanded="false">${FILTER_ICON}<span>Filters</span><span class="ind-filter-btn__count" data-ind-active-count hidden></span></button>
                    <p class="ind-results-count" aria-live="polite"><span data-ind-visible-count>${totalStyles}</span> of ${styles(totalStyles)}</p>
                    <div class="ind-active-filters" data-ind-active-filters></div>
                </div>
                <div class="ind-empty" data-ind-empty hidden>
                    <h2>No items match these filters</h2>
                    <p>Try removing a filter, or ask us for a bulk quote and we will find the right style for you.</p>
                    <button type="button" class="ind-btn ind-btn--ghost" data-ind-clear>Clear all filters</button>
                </div>
${sections}
${moreSection}
            </div>
        </div>

        <section class="ind-quote">
            <div>
                <h2>Kitting out your whole team?</h2>
                <p>Tell us the styles, colours, sizes and quantities you need and we will send you a bulk quote with your logo.</p>
            </div>
            <a class="ind-btn ind-btn--primary" href="/bulk-orders" data-open-contact="1" data-contact-message="${esc(quoteMessage)}">Get a bulk quote</a>
        </section>

        <nav class="ind-others" aria-label="Other industries">
            <h2>Other industries</h2>
            <div class="ind-others__list">
                ${others}
            </div>
        </nav>
    </main>

${filtersDrawer()}
${pageEnd({ filters: true })}`;

    writeFile(path.join(OUT_DIR, slug + '.html'), html);
}

/* ------------------------------------------------------------------ hub page */

function buildHub(data, report) {
    const pageUrl = `${SITE}/industries`;
    const title = 'Workwear & Uniforms by Industry | BrandedUK';
    const description = 'Find branded workwear and uniforms chosen for your sector: construction, cleaning, hospitality, healthcare, logistics, corporate, education, retail and sports.';
    const counts = Object.fromEntries(report.map((row) => [row.slug, row.total]));

    const cards = SECTOR_ORDER.map((slug) => {
        const sector = data.sectors[slug];
        return `
            <a class="ind-sector-card" href="/industries/${slug}">
                <span class="ind-sector-card__media">${sectorImage(slug, sector.title, { lazy: true, sizes: '(min-width: 1100px) 360px, (min-width: 700px) 45vw, 100vw' })}</span>
                <span class="ind-sector-card__body">
                    <span class="ind-sector-card__title">${esc(sector.title)}</span>
                    <span class="ind-sector-card__count">${counts[slug]} items</span>
                    <span class="ind-sector-card__cta">Explore <span aria-hidden="true">&rarr;</span></span>
                </span>
            </a>`;
    }).join('');

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
                    { '@type': 'ListItem', position: 2, name: 'Industries', item: pageUrl }
                ]
            },
            {
                '@type': 'CollectionPage',
                name: 'Shop by Industry',
                description,
                url: pageUrl,
                hasPart: SECTOR_ORDER.map((slug) => ({ '@type': 'CollectionPage', name: data.sectors[slug].title, url: `${SITE}/industries/${slug}` }))
            }
        ]
    }, null, 2).replace(/</g, '\\u003c');

    const html = `${headStart()}
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${pageUrl}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${SITE}/brandedukv15-child/assets/images/industries/construction.webp">
    <meta property="og:site_name" content="BrandedUK">
    <meta property="og:locale" content="en_GB">
    <script type="application/ld+json">
${jsonLd}
    </script>
${headAssets()}
    <link rel="stylesheet" href="/mobile/css/chat-nav-icon.css?v=20261020b">
</head>
<body class="ind-page ind-page--hub">
${mobileHeader()}

    <main class="ind-main">
        <nav class="ind-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Industries</span>
        </nav>

        <section class="ind-hub-intro">
            <p class="ind-eyebrow">Industry solutions</p>
            <h1>Shop by Industry</h1>
            <p class="ind-intro">Branded workwear and uniforms selected for the way your sector works. Pick your industry to see the styles we recommend, then add your logo by embroidery or print.</p>
        </section>

        <div class="ind-sector-grid">${cards}
        </div>

        <section class="ind-quote">
            <div>
                <h2>Not sure which styles to choose?</h2>
                <p>Tell us about your team and we will put together a bulk quote with your logo.</p>
            </div>
            <a class="ind-btn ind-btn--primary" href="/bulk-orders" data-open-contact="1" data-contact-message="Hi, I would like a bulk quote for workwear for my team.">Get a bulk quote</a>
        </section>
    </main>

${pageEnd()}`;

    writeFile(HUB_FILE, html);
}

/* ------------------------------------------------------------------ main */

async function main() {
    const data = readJson(DATA_FILE);
    let snapshot;
    if (process.argv.includes('--fetch') || !fs.existsSync(SNAPSHOT_FILE)) {
        snapshot = await fetchSnapshot(data);
    } else if (process.argv.includes('--fetch-missing')) {
        snapshot = await fetchSnapshot(data, readJson(SNAPSHOT_FILE));
    } else {
        snapshot = readJson(SNAPSHOT_FILE);
    }
    const sectorData = process.argv.includes('--fetch') || process.argv.includes('--fetch-sectors') || !fs.existsSync(SECTORS_FILE)
        ? await fetchSectorData(snapshot)
        : readJson(SECTORS_FILE);

    const logoMap = loadBrandLogoMap();
    const report = [];
    for (const slug of SECTOR_ORDER) {
        buildSector(slug, data.sectors[slug], data, snapshot, sectorData, logoMap, report);
    }
    buildHub(data, report);

    console.log('\nsector        PDF total  shown  not in API  incomplete  curated  API sector         extra  total');
    for (const row of report) {
        const count = (issue) => row.missing.filter((item) => item.issue === issue).length;
        const apiSectors = row.apiSectors.length ? row.apiSectors.map((name) => `${name} (${(sectorData.sectors[name] || []).length})`).join(', ') : '-';
        console.log(`${row.slug.padEnd(13)} ${String(row.pdfTotal).padStart(9)}  ${String(row.shown).padStart(5)}  ${String(count(ISSUE_NOT_IN_API)).padStart(10)}  ${String(count(ISSUE_INCOMPLETE)).padStart(10)}  ${String(row.curated).padStart(7)}  ${apiSectors.padEnd(17)}  ${String(row.extra).padStart(5)}  ${String(row.total).padStart(5)}`);
    }

    if (MISSING_REPORT_DIR) writeMissingReport(data, snapshot, report);
}

/* ------------------------------------------------------------------ codes the API does not return */

function csvCell(value) {
    const text = String(value == null ? '' : value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeMissingReport(data, snapshot, report) {
    const supplierRank = (source) => {
        const rank = SUPPLIER_ORDER.indexOf(source);
        return rank === -1 ? SUPPLIER_ORDER.length : rank;
    };
    const supplierLabel = (source) => String(source || 'Unknown').replace(/\s+\d{4}$/, '');
    const hints = Object.fromEntries((snapshot.missing || []).map((entry) => [entry.code, entry.possibleMatches || []]));

    const sectorsByCode = {};
    for (const row of report) {
        for (const item of row.missing) {
            (sectorsByCode[item.code] = sectorsByCode[item.code] || []).push(row.title);
        }
    }

    const rows = [];
    for (const row of report) {
        for (const item of row.missing) {
            rows.push({ ...item, sector: row.title, sectorRank: SECTOR_ORDER.indexOf(row.slug) });
        }
    }
    rows.sort((a, b) => supplierRank(a.source) - supplierRank(b.source) || a.sectorRank - b.sectorRank);

    const header = ['Supplier', 'Sector', 'Group', 'Code', 'Issue', 'Brand', 'Product name (PDF)', 'PDF site status', 'Also listed in', 'Possible API matches by name (check, not confirmed)'];
    const lines = [header.map(csvCell).join(',')];
    for (const item of rows) {
        lines.push([
            supplierLabel(item.source),
            item.sector,
            item.group,
            item.code,
            item.issue,
            item.brand,
            item.name,
            item.onSite ? 'On site' : 'Needs adding',
            sectorsByCode[item.code].filter((title) => title !== item.sector).join('; '),
            (hints[item.code] || []).join(' | ')
        ].map(csvCell).join(','));
    }
    const csvFile = path.join(MISSING_REPORT_DIR, 'codes-to-import.csv');
    writeFile(csvFile, '\uFEFF' + lines.join('\r\n') + '\r\n');

    const unique = new Map();
    for (const item of rows) if (!unique.has(item.code)) unique.set(item.code, item);
    const notInApi = Array.from(unique.values()).filter((item) => item.issue === ISSUE_NOT_IN_API);
    const incomplete = Array.from(unique.values()).filter((item) => item.issue === ISSUE_INCOMPLETE);
    const bySupplier = {};
    for (const item of notInApi) (bySupplier[supplierLabel(item.source)] = bySupplier[supplierLabel(item.source)] || []).push(item);
    const allCodes = new Set();
    const aliases = new Map();
    for (const sector of Object.values(data.sectors)) {
        for (const group of sector.groups) {
            for (const item of group.items) {
                allCodes.add(item.code);
                if (item.apiCode) aliases.set(item.code, item);
            }
        }
    }

    const generated = (snapshot.generatedAt || '').slice(0, 10);
    const text = [
        'BrandedUK - product codes to import into the product API',
        '',
        `Source: BrandedUK_Industries_Product_List.pdf, checked against ${API} on ${generated}.`,
        'Each code was looked up by product search and by the product detail endpoint.',
        'Once fixed, re-run "node --use-system-ca scripts/build-industries.js --fetch" and the styles appear on the industry pages automatically.',
        '',
        `PDF codes: ${allCodes.size} unique. Shown on the industry pages: ${allCodes.size - unique.size}. Still to fix: ${unique.size} unique codes (${rows.length} sector listings, as some codes appear in more than one sector).`,
        '',
        `1) Not in the API at all - ${notInApi.length} codes to import, by supplier:`,
        ...Object.keys(bySupplier).sort((a, b) => supplierRank(a + ' 2026') - supplierRank(b + ' 2026'))
            .map((supplier) => `  ${supplier}: ${bySupplier[supplier].length} - ${bySupplier[supplier].map((item) => item.code).join(', ')}`),
        '',
        ...(incomplete.length ? [
            `2) In the API but incomplete - ${incomplete.length} codes: the detail endpoint returns price 0 and no sizes, and product search does not list them:`,
            ...incomplete.map((item) => `  ${item.code} ${item.brand} - ${item.name} (${supplierLabel(item.source)})`),
            ''
        ] : []),
        'By sector (listings not on the page yet / PDF total):',
        ...report.map((row) => `  ${row.title}: ${row.missing.length} / ${row.pdfTotal}${row.missing.length ? ' - ' + row.missing.map((item) => item.code).join(', ') : ''}`),
        '',
        ...(aliases.size ? [
            'Shown under a different API code (not in the list above):',
            ...Array.from(aliases.values()).map((item) => `  ${item.code} -> ${item.apiCode}: ${item.apiCodeNote || ''}`.trimEnd()),
            ''
        ] : []),
        'Full detail (brand, product name, group, sector) is in codes-to-import.csv next to this file.',
        'The "Possible API matches by name" column is only a hint from a name search - those products have different codes and are not shown on the site.',
        ''
    ].join('\r\n');
    writeFile(path.join(MISSING_REPORT_DIR, 'codes-to-import.txt'), text);
    console.log(`\nMissing-codes report written to ${csvFile} (${notInApi.length} not in API, ${incomplete.length} incomplete, ${rows.length} rows).`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
