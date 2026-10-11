#!/usr/bin/env node
/**
 * Builds the "Shop by Industry" pages from brandedukv15-child/assets/data/industries.json
 * (extracted from BrandedUK_Industries_Product_List.pdf).
 *
 *   node --use-system-ca scripts/build-industries.js --fetch   refresh the product snapshot from the API, then build
 *   node scripts/build-industries.js                           rebuild the HTML from the saved snapshot
 *   node --use-system-ca scripts/build-industries.js --fetch-missing   only re-check codes the last fetch did not find
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
const ASSET_VERSION = '20261011-ind2';
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
        productType: product.productType || product.product_type || ''
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
        const retry = new Set((previous.missing || []).map((entry) => entry.code));
        for (const code of Array.from(codes.keys())) if (!retry.has(code)) codes.delete(code);
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
    <script defer src="/brandedukv15-child/assets/js/cookie-consent.js?v=20261008"></script>
    <script defer src="/brandedukv15-child/assets/js/ads-conversions.js?v=20261009"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#273469">`;
}

function headAssets() {
    return `    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/brandedukv15-child/assets/css/components/header.css?v=20260926-vatgap">
    <link rel="stylesheet" href="/brandedukv15-child/assets/css/components/pc-header.css?v=20261005-searchoverflow">
    <link rel="stylesheet" href="/brandedukv15-child/assets/css/components/promo-bar.css?v=20260425a">
    <link rel="stylesheet" href="/mobile/css/mobile.css?v=20260923-home-nav">
    <link rel="stylesheet" href="/mobile/footer/footer.css?v=20260409B">
    <link rel="stylesheet" href="/footer-dev/pc-footer.css?v=20261009-phones">
    <link rel="stylesheet" href="/brandedukv15-child/assets/css/pages/industries.css?v=${ASSET_VERSION}">
    <script src="/brandedukv15-child/assets/js/shared-config.js?v=20261005-megafit"></script>
    <script src="/brandedukv15-child/assets/js/pc-header-template.js?v=20261005-megafit"></script>
    <script src="/brandedukv15-child/assets/js/pc-header.js?v=20261008-searchleaf1"></script>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    <link rel="preconnect" href="https://cdn.pimber.ly">
    <link rel="preload" as="script" href="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js" media="(min-width: 700px)">
    <link rel="preload" as="fetch" href="/brandedukv15-child/assets/images/ui/cart-icon-loader.json" crossorigin media="(min-width: 700px)">
    <link rel="stylesheet" href="/brandedukv15-child/assets/css/components/cart-lottie-icon.css?v=20260927-cartlottie2">
    <script src="/brandedukv15-child/assets/js/cart-lottie-icon.js?v=20260927-cartlottie2" data-header-cart></script>
    <script src="/footer-dev/pc-footer.js?v=20261009-phones" defer></script>`;
}

function mobileBar(backHref, label) {
    return `    <header class="ind-mobile-bar">
        <a class="ind-back" href="${esc(backHref)}" aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6"></path>
            </svg>
        </a>
        <div>
            <span class="ind-brand">Branded<span>UK</span></span>
            <span class="ind-mobile-title">${esc(label)}</span>
        </div>
    </header>
    <header class="site-header"></header>`;
}

function pageEnd() {
    return `    <div data-pc-footer></div>
    <div data-mobile-footer></div>

    <nav class="bottom-nav" aria-label="Mobile navigation">
        <a href="/index-mobile.html?force=mobile" class="nav-item" data-home-nav>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 11 12 3l9 8"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path>
            </svg>
            <span class="nav-item-label">Home</span>
        </a>
        <a href="/profile.html" class="nav-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span class="nav-item-label">Account</span>
        </a>
        <a href="/shop.html" class="nav-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>
            <span class="nav-item-label">Shop</span>
        </a>
        <a href="/basket.html#orderSummary" class="nav-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span class="nav-item-label">Basket</span>
        </a>
        <a href="https://wa.me/447447348564" class="nav-item" target="_blank" rel="noopener">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path></svg>
            <span class="nav-item-label">Chat</span>
        </a>
    </nav>

    <script>if (window.BrandedPcHeader) window.BrandedPcHeader.mount();</script>
    <script src="/brandedukv15-child/assets/js/vat-toggle.js?v=20251230"></script>
    <script src="/brandedukv15-child/assets/js/pages/industries.js?v=${ASSET_VERSION}" defer></script>
    <script src="/mobile/js/popup-contact.js?v=20261003-consent" defer></script>
    <script src="/mobile/footer/footer.js?v=20261002-cta-equal" defer></script>
</body>
</html>
`;
}

function sectorImage(slug, alt, extra) {
    const base = `/brandedukv15-child/assets/images/industries/${slug}`;
    return `<img src="${base}-800.webp" srcset="${base}-800.webp 800w, ${base}.webp 1600w" sizes="${extra && extra.sizes ? extra.sizes : '(min-width: 900px) 560px, 100vw'}" width="1600" height="900" alt="${esc(alt)}"${extra && extra.lazy ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`;
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

/* ------------------------------------------------------------------ sector page */

function buildSector(slug, sector, data, snapshot, logoMap, report) {
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
    report.push({ slug, title: sector.title, pdfTotal: sector.pdfTotal, shown: shownCount, hidden, missing });

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
    const jumpLinks = groups.map((group) => `<a href="/industries/${slug}#${group.id}">${esc(group.name)} <span>${group.cards.length}</span></a>`).join('\n                ');
    const sections = groups.map((group) => `
        <section class="ind-group" id="${group.id}" aria-labelledby="${group.id}-title">
            <div class="ind-group__head">
                <h2 id="${group.id}-title">${esc(group.name)}</h2>
                <span class="ind-group__count">${group.cards.length} ${group.cards.length === 1 ? 'style' : 'styles'}</span>
            </div>
            <div class="products-grid">${group.cards.map((card) => productCard(card, logoMap)).join('')}
            </div>
        </section>`).join('\n');

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
</head>
<body class="ind-page" data-sector="${slug}">
${mobileBar('/industries', sector.title)}

    <main class="ind-main">
        <nav class="ind-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span><a href="/industries">Industries</a><span aria-hidden="true">/</span><span aria-current="page">${esc(sector.title)}</span>
        </nav>

        <section class="ind-hero">
            <div class="ind-hero__text">
                <p class="ind-eyebrow">Shop by industry</p>
                <h1>${esc(sector.title)}</h1>
                <p class="ind-intro">${esc(sector.intro)}</p>
                <p class="ind-meta">${shownCount} ${shownCount === 1 ? 'style' : 'styles'} &middot; Prices shown <span data-ind-vat-label>ex VAT</span> &middot; Standard production 7&ndash;10 working days after artwork approval</p>
                <div class="ind-cta-row">
                    <a class="ind-btn ind-btn--primary" href="/bulk-orders" data-open-contact="1" data-contact-message="${esc(quoteMessage)}">Get a bulk quote</a>
                    <a class="ind-btn ind-btn--ghost" href="/industries">All industries</a>
                </div>
            </div>
            <div class="ind-hero__media">
                ${sectorImage(slug, sector.title)}
            </div>
        </section>

        <nav class="ind-jump" aria-label="${esc(sector.title)} categories">
            <div class="ind-jump__inner">
                ${jumpLinks}
            </div>
        </nav>
${sections}

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

${pageEnd()}`;

    writeFile(path.join(OUT_DIR, slug + '.html'), html);
}

/* ------------------------------------------------------------------ hub page */

function buildHub(data, report) {
    const pageUrl = `${SITE}/industries`;
    const title = 'Workwear & Uniforms by Industry | BrandedUK';
    const description = 'Find branded workwear and uniforms chosen for your sector: construction, cleaning, hospitality, healthcare, logistics, corporate, education, retail and sports.';
    const counts = Object.fromEntries(report.map((row) => [row.slug, row.shown]));

    const cards = SECTOR_ORDER.map((slug) => {
        const sector = data.sectors[slug];
        return `
            <a class="ind-sector-card" href="/industries/${slug}">
                <span class="ind-sector-card__media">${sectorImage(slug, sector.title, { lazy: true, sizes: '(min-width: 1100px) 360px, (min-width: 700px) 45vw, 100vw' })}</span>
                <span class="ind-sector-card__body">
                    <span class="ind-sector-card__title">${esc(sector.title)}</span>
                    <span class="ind-sector-card__count">${counts[slug]} styles</span>
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
</head>
<body class="ind-page ind-page--hub">
${mobileBar('/index-mobile.html?force=mobile', 'Shop by Industry')}

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

    const logoMap = loadBrandLogoMap();
    const report = [];
    for (const slug of SECTOR_ORDER) {
        buildSector(slug, data.sectors[slug], data, snapshot, logoMap, report);
    }
    buildHub(data, report);

    console.log('\nsector        PDF total  shown  not in API  incomplete  hidden (--on-site-only)');
    for (const row of report) {
        const count = (issue) => row.missing.filter((item) => item.issue === issue).length;
        console.log(`${row.slug.padEnd(13)} ${String(row.pdfTotal).padStart(9)}  ${String(row.shown).padStart(5)}  ${String(count(ISSUE_NOT_IN_API)).padStart(10)}  ${String(count(ISSUE_INCOMPLETE)).padStart(10)}  ${String(row.hidden).padStart(6)}`);
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
