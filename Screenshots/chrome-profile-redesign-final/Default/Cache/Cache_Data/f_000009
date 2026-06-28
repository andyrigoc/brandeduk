/**
 * BrandedColorHex — global colour name → hex registry
 * Used by basket, customize, shop, and API layer.
 */
(function (window) {
    'use strict';

    var STORAGE_KEY = 'brandedukColorHexIndexV2';
    var PLACEHOLDER_HEX = new Set(['#cccccc', '#ccc', '#f3f4f6']);
    /** Never use for garment tint or swatch fill — catalogue unknown fallback only */
    var PLACEHOLDER_SWATCH = new Set(['#d1d5db', '#cccccc', '#ccc']);

    /** Extra catalog hints (substring match) — all products, all suppliers */
    var COLOR_HINTS = {
        'classic olive': '#5f6741', 'olive': '#5f6741', 'bottle green': '#1b4d3e',
        'deep navy': '#1a2744', 'heather grey': '#9aa0a9', 'light graphite': '#6b7280',
        'royal blue': '#1f4fa8', 'classic navy': '#1f2f4f', 'classic red': '#c02b33',
        'black marl': '#2e2e2e', 'carbon': '#4a4a4a', 'dark grey marl': '#8f9399',
        'desert sand': '#d8c5a3', 'eco raw': '#e8dcc8', 'forest green': '#2d6a3e',
        'grey marl': '#9aa0a9', 'hot pink': '#ff69b4', 'kelly green': '#4cbb17',
        'navy marl': '#2d3c56', 'pine green': '#1f5c37', 'orchid': '#ae78b7',
        'lavender': '#b7a3d2', 'sage': '#9caf88', 'sport grey': '#b5b8be',
        'ice grey': '#d5d8dd', 'military green': '#4d5a43', 'stone blue': '#70879e',
        'light blue': '#9dc0e8', 'sky': '#8fb8d8', 'sapphire': '#1360a8',
        'cardinal red': '#a02134', 'cherry red': '#b32636', 'texas orange': '#c45b23',
        'safety orange': '#ef7f28', 'safety green': '#b7d43a', 'prairie dust': '#d6c5a7',
        'dark heather': '#575b63', 'heather navy': '#2d3c56', 'graphite': '#4b515a'
    };

    /** Gildan / catalog defaults + shop primary-colour swatches + common workwear names */
    var BUILTIN = {
        'aquatic': '#5BA4A4', 'ash grey': '#B8B8B8', 'black': '#1a1a1a', 'black/black': '#0a0a0a',
        'blue': '#0000ff', 'blue dusk': '#4A6FA5', 'bottle green': '#1B4D3E', 'bottle green/off white': '#1B4D3E',
        'brown': '#8b4513', 'brown savana': '#8B7355', 'burgundy': '#800020', 'cardinal red': '#C41E3A',
        'carolina blue': '#99BADD', 'cement': '#9E9E9E', 'charcoal': '#4a4a4a', 'charcoal/black': '#2f3033',
        'cobalt': '#0047AB', 'cocoa': '#5C4033', 'coral': '#ff7f50', 'cream': '#fffdd0', 'daisy': '#FFD700',
        'dark green': '#013220', 'dark grey': '#505050', 'dark heather': '#5a5a5a', 'dusty rose': '#D4A5A5',
        'forest': '#228B22', 'forest green': '#228B22', 'french navy': '#002366', 'gold': '#ffd700', 'green': '#008000',
        'heather grey': '#b6b6b4', 'hot pink': '#ff69b4', 'kelly green': '#4CBB17', 'khaki': '#c3b091',
        'light blue': '#add8e6', 'light grey': '#d3d3d3', 'light pink': '#FFB6C1', 'lime': '#00ff00',
        'lime green': '#84BD00', 'maroon': '#800000', 'military green': '#4B5320', 'mustard': '#FFDB58',
        'natural': '#f5f0e6', 'navy': '#1e3a5f', 'navy/navy': '#000060', 'navy/royal': '#1e3a6d',
        'neutral': '#d1d5db', 'off white': '#FAF9F6', 'off-white': '#FAF9F6', 'olive': '#808000',
        'orange': '#ea580c', 'paragon': '#C0C0C0', 'pink': '#ec4899', 'pink lemonade': '#F8B4D9',
        'pistachio': '#93C572', 'purple': '#7c3aed', 'red': '#dc2626', 'red/black': '#8b0000',
        'royal': '#2563eb', 'royal blue': '#4169E1', 'sage': '#9CAF88', 'sand': '#C2B280',
        'silver': '#c0c0c0', 'sky': '#87CEEB', 'smoke': '#738276', 'sport grey': '#9ca3af',
        'stone': '#928e85', 'stone blue': '#6A8EAE', 'tangerine': '#FF9966', 'teal': '#008080',
        'texas orange': '#BF5700', 'safety orange': '#FF6600', 'white': '#ffffff', 'yellow': '#eab308', 'yellow haze': '#E8D44D',
        'beige': '#f5f5dc', 'grey': '#9ca3af', 'gray': '#9ca3af', 'other': '#e5e7eb',
        'aubergine': '#4a2c4a', 'aubergene': '#4a2c4a', 'eggplant': '#4a2c4a',
        'emerald': '#008c5a', 'emerald green': '#008c5a', 'jade': '#00a86b', 'mint': '#98ff98',
        'mint green': '#98ff98', 'apple green': '#8db600', 'grass green': '#7cfc00',
        'hunter green': '#355e3b', 'irish green': '#009a44', 'kelly': '#4cbb17',
        'lime green': '#84bd00', 'mid green': '#228b22', 'midnight': '#191970',
        'midnight blue': '#191970', 'navy blue': '#1e3a5f', 'ocean blue': '#006994',
        'orange': '#ea580c', 'peach': '#ffcba4', 'petrol': '#005f6a', 'petrol blue': '#005f6a',
        'plum': '#8e4585', 'raspberry': '#e30b5d', 'red': '#dc2626', 'reflex blue': '#002395',
        'rose': '#ff007f', 'royal': '#2563eb', 'sapphire': '#0f52ba', 'sunflower': '#ffda03',
        'sun yellow': '#ffda03', 'tan': '#d2b48c', 'turquoise': '#40e0d0', 'violet': '#8f00ff',
        'wine': '#722f37', 'yellow': '#eab308', 'zinc': '#7d7d7d', 'airforce blue': '#5d8aa8',
        'arctic white': '#f8f9fa', 'bright royal': '#4169e1', 'classic red': '#c41e3a',
        'classic navy': '#1e3a5f', 'fuchsia': '#ff00ff', 'heather': '#b6b6b4', 'indigo': '#4b0082', 'indigo blue': '#4b0082',
        'lemon': '#fff44f', 'magenta': '#ff00ff', 'neon green': '#39ff14', 'neon orange': '#ff6700',
        'neon pink': '#ff6ec7', 'neon yellow': '#ffff00', 'oxford navy': '#002147', 'powder blue': '#b0e0e6',
        'process blue': '#0085ca', 'purple': '#7c3aed', 'sand': '#c2b280', 'sky blue': '#87ceeb',
        'slate grey': '#708090', 'slate gray': '#708090', 'steel grey': '#71797e', 'steel gray': '#71797e',
        'true navy': '#000080', 'ultramarine': '#3f00ff', 'vermillion': '#e34234'
    };

    var globalMap = Object.assign({}, BUILTIN);
    var byProduct = Object.create(null);
    var byImage = Object.create(null);
    var productFetchPending = Object.create(null);
    var samplePending = Object.create(null);
    var databaseLoadPromise = null;
    var DATABASE_URL = '/brandedukv15-child/assets/data/color-hex-database.json';
    function resolveProxyEndpoints() {
        var list = [];
        var isLocal = false;
        try {
            var host = (typeof location !== 'undefined' && location.hostname) ? location.hostname : '';
            isLocal = host === '127.0.0.1' || host === 'localhost' || host === '';
        } catch (e) { isLocal = false; }

        if (isLocal) {
            // Local dev (Live Server :5507 has no /api): hit the standalone eyedropper server first.
            list.push('http://127.0.0.1:8787/api/sample-color');
            list.push('/api/sample-color');
            list.push('https://www.brandeduk.com/api/sample-color');
        } else {
            list.push('/api/sample-color');
            list.push('https://www.brandeduk.com/api/sample-color');
        }
        return list;
    }

    var SAMPLE_COLOR_PROXY_ENDPOINTS = resolveProxyEndpoints();

    function normName(name) {
        return String(name || '')
            .trim()
            .toLowerCase()
            .replace(/\*+$/, '')
            .replace(/\s+/g, ' ');
    }

    function parseHex(hex) {
        if (!hex) return '';
        var h = String(hex).trim();
        if (!h) return '';
        if (!h.startsWith('#')) h = '#' + h;
        if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
            h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
        }
        return /^#[0-9A-Fa-f]{6}$/.test(h) ? h.toLowerCase() : '';
    }

    function isUsableHex(hex) {
        var p = parseHex(hex);
        return p && !PLACEHOLDER_HEX.has(p) && !PLACEHOLDER_SWATCH.has(p);
    }

    function isPlaceholderSwatchHex(hex) {
        var p = parseHex(hex);
        return !p || PLACEHOLDER_SWATCH.has(p);
    }

    function inferHexFromColourName(name) {
        var n = normName(name);
        if (!n) return '';
        if (n.indexOf('lilac') >= 0 || n.indexOf('lavender') >= 0) return '#b7a3d2';
        if (n.indexOf('violet') >= 0 || n.indexOf('plum') >= 0) return '#7b5ca7';
        if (n.indexOf('purple') >= 0) return '#6f53a6';
        if (n.indexOf('orchid') >= 0) return '#ae78b7';
        if (n.indexOf('sage') >= 0) return '#9caf88';
        if (n.indexOf('olive') >= 0) return '#5f6741';
        if (n.indexOf('charcoal') >= 0 || n.indexOf('graphite') >= 0 || n.indexOf('anthracite') >= 0) return '#4b515a';
        if (n.indexOf('heather') >= 0 && (n.indexOf('grey') >= 0 || n.indexOf('gray') >= 0)) return '#9aa0a9';
        if (n.indexOf('marl') >= 0 && n.indexOf('black') >= 0) return '#2e2e2e';
        if (n.indexOf('marl') >= 0 && n.indexOf('navy') >= 0) return '#2d3c56';
        if (n.indexOf('marl') >= 0 && (n.indexOf('grey') >= 0 || n.indexOf('gray') >= 0)) return '#9aa0a9';
        if (n.indexOf('carbon') >= 0) return '#4a4a4a';
        if (n.indexOf('desert sand') >= 0) return '#d8c5a3';
        if (n.indexOf('eco raw') >= 0) return '#e8dcc8';
        if (n.indexOf('hot pink') >= 0) return '#ff69b4';
        if (n.indexOf('bottle') >= 0) return '#1b4d3e';
        if (n.indexOf('forest') >= 0 || n.indexOf('pine') >= 0 || n.indexOf('kelly') >= 0) return '#2d6a3e';
        if (n.indexOf('green') >= 0) return '#2d6a3e';
        if (n.indexOf('khaki') >= 0) return '#c3b091';
        if (n.indexOf('teal') >= 0) return '#008080';
        if (n.indexOf('yellow') >= 0) return '#eab308';
        if (n.indexOf('sand') >= 0) return '#d8c5a3';
        if (n.indexOf('pink') >= 0) return '#e96aa3';
        if (n.indexOf('orange') >= 0) return '#de6a24';
        if (n.indexOf('royal') >= 0) return '#1f4fa8';
        if (n.indexOf('navy') >= 0) return '#1f2f4f';
        if (n.indexOf('blue') >= 0) return '#4a90c6';
        if (n.indexOf('grey') >= 0 || n.indexOf('gray') >= 0) return '#9ca3af';
        if (n.indexOf('red') >= 0) return '#c02b33';
        if (n.indexOf('black') >= 0) return '#1a1a1a';
        if (n.indexOf('white') >= 0) return '#ffffff';
        return '';
    }

    function findHintHexByName(name) {
        var key = normName(name);
        if (!key) return '';
        if (COLOR_HINTS[key]) return COLOR_HINTS[key];
        var best = '';
        var bestLen = 0;
        Object.keys(COLOR_HINTS).forEach(function (hintKey) {
            if (hintKey === 'model') return;
            if (key.indexOf(hintKey) >= 0 && hintKey.length > bestLen) {
                best = COLOR_HINTS[hintKey];
                bestLen = hintKey.length;
            }
        });
        return best;
    }

    function variantImageUrl(entry) {
        if (!entry || typeof entry !== 'object') return '';
        return String(entry.main || entry.image || entry.thumb || entry.thumbnail || '').trim();
    }

    function resolveForName(colorName, productCode, imageUrl, directHex) {
        var direct = parseHex(directHex);
        if (isUsableHex(direct)) return direct;
        var fromLookup = lookup(colorName, productCode, imageUrl);
        if (isUsableHex(fromLookup)) return fromLookup;
        var hint = findHintHexByName(colorName);
        if (isUsableHex(hint)) return hint;
        var inferred = inferHexFromColourName(colorName);
        if (isUsableHex(inferred)) return inferred;
        return '';
    }

    function resolveForEntry(entry, productCode) {
        if (!entry || typeof entry !== 'object') return '';
        var name = String(entry.name || entry.displayName || entry.label || entry.id || '').trim();
        if (!name) return '';
        return resolveForName(
            name,
            productCode,
            variantImageUrl(entry),
            entry.hex || entry.colourHex || entry.colorHex || ''
        );
    }

    function getImageHexSync(imageUrl) {
        var url = String(imageUrl || '').trim();
        if (!url) return '';
        return parseHex(byImage[url] || '');
    }

    /**
     * Garment tint, progressive:
     *  1) eyedropper-sampled hex (best, from thumbnail RGB)
     *  2) explicit API hex
     *  3) known colour (DB / name) so the garment is never blank
     */
    function resolveGarmentTint(hex, colorName, productCode, imageUrl) {
        var fromImage = getImageHexSync(imageUrl);
        if (isUsableHex(fromImage)) return fromImage;
        var direct = parseHex(hex);
        if (isUsableHex(direct)) return direct;
        var byNameHex = resolveForName(colorName, productCode, imageUrl, '');
        if (isUsableHex(byNameHex)) return byNameHex;
        return '#ffffff';
    }

    function fillColourPairs(pairs, productCode, getImageForName) {
        if (!Array.isArray(pairs) || !pairs.length) return false;
        var changed = false;
        for (var i = 0; i < pairs.length; i++) {
            var hex = pairs[i][1];
            if (!isPlaceholderSwatchHex(hex) && isUsableHex(hex)) continue;
            var imageUrl = typeof getImageForName === 'function' ? getImageForName(pairs[i][0]) : '';
            var fromImage = getImageHexSync(imageUrl);
            if (fromImage) {
                pairs[i][1] = fromImage;
                changed = true;
            }
        }
        return changed;
    }

    function applySwatchAppearance(el, name, hex, thumbUrl) {
        if (!el) return;
        el.style.backgroundColor = '';
        el.style.backgroundImage = '';
        el.style.backgroundSize = '';
        el.style.backgroundPosition = '';
        el.style.backgroundRepeat = '';
        delete el.dataset.swatchSource;
        var thumb = String(thumbUrl || '').trim();
        if (thumb) {
            el.style.backgroundColor = '#f3f4f6';
            el.style.backgroundImage = 'url("' + thumb + '")';
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center top';
            el.dataset.swatchSource = 'thumb';
            return;
        }
        if (!isPlaceholderSwatchHex(hex) && isUsableHex(hex)) {
            el.style.backgroundColor = hex;
            return;
        }
        el.style.backgroundColor = '#f3f4f6';
    }

    function loadPersisted() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            var data = JSON.parse(raw);
            if (data.global && typeof data.global === 'object') {
                Object.keys(data.global).forEach(function (k) {
                    var h = parseHex(data.global[k]);
                    if (h) globalMap[normName(k)] = h;
                });
            }
            if (data.byProduct && typeof data.byProduct === 'object') {
                byProduct = data.byProduct;
            }
            if (data.byImage && typeof data.byImage === 'object') {
                byImage = data.byImage;
            }
        } catch (e) { /* ignore */ }
    }

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                global: globalMap,
                byProduct: byProduct,
                byImage: byImage
            }));
        } catch (e) { /* quota */ }
    }

    function register(name, hex, productCode) {
        var n = normName(name);
        var h = parseHex(hex);
        if (!n || !isUsableHex(h)) return;
        globalMap[n] = h;
        if (productCode) {
            var code = String(productCode).trim().toUpperCase();
            if (!byProduct[code]) byProduct[code] = Object.create(null);
            byProduct[code][n] = h;
        }
    }

    function mergeDatabaseGlobal(data) {
        if (!data || typeof data !== 'object') return 0;
        var src = data.global || data;
        var added = 0;
        Object.keys(src).forEach(function (k) {
            var before = globalMap[normName(k)];
            register(k, src[k]);
            if (!before && globalMap[normName(k)]) added++;
        });
        // Merge eyedropper-sampled colours keyed by thumbnail URL (exact RGB match).
        if (data.byImage && typeof data.byImage === 'object') {
            Object.keys(data.byImage).forEach(function (url) {
                var h = parseHex(data.byImage[url]);
                if (url && isUsableHex(h) && !byImage[url]) byImage[url] = h;
            });
        }
        return added;
    }

    function resolveDatabaseUrls() {
        var names = ['color-hex-database.json', 'color-hex-sampled.json'];
        if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
            try {
                return names.map(function (n) {
                    return new URL('../data/' + n, document.currentScript.src).href;
                });
            } catch (e) { /* fall through */ }
        }
        return names.map(function (n) {
            return '/brandedukv15-child/assets/data/' + n;
        });
    }

    function loadExternalDatabase() {
        if (databaseLoadPromise) return databaseLoadPromise;
        var urls = resolveDatabaseUrls();
        databaseLoadPromise = Promise.all(urls.map(function (url) {
            return fetch(url, { cache: 'no-cache' })
                .then(function (res) { return res.ok ? res.json() : null; })
                .then(function (data) { if (data) mergeDatabaseGlobal(data); return !!data; })
                .catch(function () { return false; });
        })).then(function (results) {
            return results.some(Boolean);
        });
        return databaseLoadPromise;
    }

    function registerProductColors(productCode, colors) {
        if (!productCode || !Array.isArray(colors)) return;
        colors.forEach(function (c) {
            if (!c) return;
            var name = c.name || c.colour_name || c.label || '';
            var imageUrl = variantImageUrl(c);
            var hex = getImageHexSync(imageUrl) || parseHex(c.hex || c.colourHex || c.colorHex || '');
            register(name, hex, productCode);
        });
        persist();
    }

    function nameFromColorId(colorId) {
        var id = String(colorId || '').trim();
        if (!id || id.indexOf(' ') >= 0) return '';
        return normName(id.replace(/[-_]+/g, ' '));
    }

    function lookupByName(colorName, colorId) {
        var raw = normName(colorName);
        if (!raw && colorId) raw = nameFromColorId(colorId);
        if (!raw) return '';
        if (globalMap[raw]) return globalMap[raw];
        var primary = raw.split('/')[0].trim();
        if (primary && globalMap[primary]) return globalMap[primary];
        var fromId = colorId ? nameFromColorId(colorId) : '';
        if (fromId && fromId !== raw && globalMap[fromId]) return globalMap[fromId];
        var prefixBest = '';
        Object.keys(globalMap).forEach(function (k) {
            if (k.indexOf(raw) !== 0) return;
            if (k.length === raw.length) return;
            if (k.charAt(raw.length) !== ' ') return;
            if (!prefixBest || k.length < prefixBest.length) prefixBest = k;
        });
        if (prefixBest) return globalMap[prefixBest];
        var firstWord = raw.split(/\s+/)[0];
        if (firstWord && firstWord !== raw && globalMap[firstWord]) return globalMap[firstWord];
        var hint = findHintHexByName(colorName);
        if (hint) return hint;
        var best = '';
        var bestLen = 0;
        Object.keys(globalMap).forEach(function (k) {
            if (k === 'model' || k === 'neutral') return;
            if (raw.indexOf(k) >= 0 && k.length > bestLen) {
                best = globalMap[k];
                bestLen = k.length;
            }
        });
        if (best) return best;
        return inferHexFromColourName(colorName) || '';
    }

    function resolveDisplayName(colorName, colorId) {
        var raw = normName(colorName);
        var fromId = nameFromColorId(colorId);
        var key = '';
        if (raw && globalMap[raw]) key = raw;
        else if (fromId && globalMap[fromId]) key = fromId;
        else {
            var hex = lookupByName(colorName, colorId);
            if (!hex) return String(colorName || '').trim();
            Object.keys(globalMap).some(function (k) {
                if (globalMap[k] === hex && (!key || k.length < key.length)) key = k;
                return false;
            });
        }
        if (!key) key = fromId || raw;
        if (!key) return String(colorName || '').trim();
        return key.split(' ').map(function (w) {
            return w.charAt(0).toUpperCase() + w.slice(1);
        }).join(' ');
    }

    function lookup(colorName, productCode, imageUrl, colorId) {
        var code = productCode ? String(productCode).trim().toUpperCase() : '';
        var n = normName(colorName);
        var idName = nameFromColorId(colorId);
        if (code && byProduct[code]) {
            if (n && byProduct[code][n]) return byProduct[code][n];
            if (idName && byProduct[code][idName]) return byProduct[code][idName];
        }
        var fromName = lookupByName(colorName, colorId);
        if (fromName) return fromName;
        if (imageUrl && byImage[imageUrl]) return byImage[imageUrl];
        var hint = findHintHexByName(colorName);
        if (hint) return hint;
        return inferHexFromColourName(colorName) || '';
    }

    function hydrateProduct(productCode) {
        var code = String(productCode || '').trim().toUpperCase();
        if (!code || !window.BrandedAPI || typeof window.BrandedAPI.getProductByCode !== 'function') {
            return Promise.resolve();
        }
        if (productFetchPending[code]) return productFetchPending[code];
        productFetchPending[code] = window.BrandedAPI.getProductByCode(code)
            .then(function (product) {
                registerProductColors(product.code || code, product.colors || []);
            })
            .catch(function () { /* product not found */ })
            .finally(function () {
                delete productFetchPending[code];
            });
        return productFetchPending[code];
    }

    function cacheSampledHex(imageUrl, hex) {
        var url = String(imageUrl || '').trim();
        var parsed = parseHex(hex);
        if (!url || !isUsableHex(parsed)) return '';
        byImage[url] = parsed;
        persist();
        return parsed;
    }

    function sampleImageElement(imageUrl, img) {
        var ED = global.BrandedColorEyedropper;
        try {
            var sample = ED && typeof ED.sampleEyedropperFromImageElement === 'function'
                ? ED.sampleEyedropperFromImageElement(img, 48)
                : null;
            return sample && sample.hex ? cacheSampledHex(imageUrl, sample.hex) : '';
        } catch (e) {
            return '';
        }
    }

    /**
     * Bulletproof browser eyedropper: fetch the thumbnail as a CORS blob and draw it
     * from an object URL. Object URLs are same-origin, so the canvas is never tainted
     * even if the swatch already cached the image without CORS. The CDN
     * (cdn.pimber.ly) returns Access-Control-Allow-Origin:* so this works with no server.
     */
    function sampleFromBlob(imageUrl) {
        return fetchWithTimeout(imageUrl, 6000)
            .then(function (res) { return res && res.ok ? res.blob() : null; })
            .then(function (blob) {
                if (!blob) return '';
                return new Promise(function (resolve) {
                    var objUrl = URL.createObjectURL(blob);
                    var img = new Image();
                    img.onload = function () {
                        var hex = sampleImageElement(imageUrl, img);
                        URL.revokeObjectURL(objUrl);
                        resolve(hex);
                    };
                    img.onerror = function () { URL.revokeObjectURL(objUrl); resolve(''); };
                    img.src = objUrl;
                });
            })
            .catch(function () { return ''; });
    }

    /** Fallback: crossOrigin <img> direct (works when not previously cached no-cors). */
    function sampleFromCrossOriginImage(imageUrl) {
        return new Promise(function (resolve) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () { resolve(sampleImageElement(imageUrl, img)); };
            img.onerror = function () { resolve(''); };
            img.src = imageUrl;
        });
    }

    function sampleFromImageViaCanvas(imageUrl) {
        return sampleFromBlob(imageUrl).then(function (hex) {
            if (isUsableHex(hex)) return hex;
            return sampleFromCrossOriginImage(imageUrl);
        });
    }

    function fetchWithTimeout(url, timeoutMs) {
        if (typeof AbortController === 'undefined') {
            return fetch(url, { mode: 'cors', credentials: 'omit' });
        }
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, timeoutMs || 4000);
        return fetch(url, { mode: 'cors', credentials: 'omit', signal: controller.signal })
            .finally(function () { clearTimeout(timer); });
    }

    function sampleFromImageViaProxy(imageUrl) {
        var encoded = encodeURIComponent(imageUrl);
        var chain = Promise.resolve('');

        SAMPLE_COLOR_PROXY_ENDPOINTS.forEach(function (base) {
            chain = chain.then(function (hex) {
                if (isUsableHex(hex)) return hex;
                var proxyUrl = base + '?url=' + encoded;
                return fetchWithTimeout(proxyUrl, 4000)
                    .then(function (res) {
                        if (!res.ok) return '';
                        return res.json();
                    })
                    .then(function (payload) {
                        var sampled = payload && payload.hex ? payload.hex : '';
                        return cacheSampledHex(imageUrl, sampled);
                    })
                    .catch(function () { return ''; });
            });
        });

        return chain;
    }

    /** Eyedropper RGB from thumbnail — canvas first, then /api/sample-color (CORS bypass). */
    function sampleFromImage(imageUrl) {
        var url = String(imageUrl || '').trim();
        if (!url) return Promise.resolve('');
        if (byImage[url]) return Promise.resolve(byImage[url]);
        if (samplePending[url]) return samplePending[url];

        samplePending[url] = sampleFromImageViaCanvas(url)
            .then(function (hex) {
                if (isUsableHex(hex)) return hex;
                return sampleFromImageViaProxy(url);
            })
            .finally(function () {
                delete samplePending[url];
            });

        return samplePending[url];
    }

    function resolveGarmentHexAsync(colorName, productCode, imageUrl, apiHex) {
        var url = String(imageUrl || '').trim();
        var direct = parseHex(apiHex);
        // Ensure the static sampled database (byImage) is loaded first — gives the
        // exact eyedropper colour instantly with no live sampling / CORS / server.
        return loadExternalDatabase().then(function () {
            return resolveGarmentHexAfterDb(url, direct, colorName, productCode);
        });
    }

    function resolveGarmentHexAfterDb(url, direct, colorName, productCode) {
        var cached = getImageHexSync(url);
        if (isUsableHex(cached)) return Promise.resolve(cached);
        if (!url) {
            return Promise.resolve(isUsableHex(direct) ? direct : '');
        }
        return sampleFromImage(url).then(function (sampled) {
            if (isUsableHex(sampled)) {
                register(colorName, sampled, productCode);
                try { console.log('[eyedropper]', colorName, '→', sampled, url); } catch (e) {}
                return sampled;
            }
            try { console.warn('[eyedropper] sampling failed for', colorName, url, '(is the API server running? npm run eyedropper-api)'); } catch (e) {}
            if (isUsableHex(direct)) return direct;
            return '';
        });
    }

    /** Resolve missing hex on basket line items; re-render via optional callback */
    function hydrateBasketItems(items, onUpdated) {
        if (!Array.isArray(items) || items.length === 0) {
            return Promise.resolve(false);
        }
        return loadExternalDatabase().then(function () {
            return hydrateBasketItemsCore(items, onUpdated);
        });
    }

    function hydrateBasketItemsCore(items, onUpdated) {
        var changed = false;
        items.forEach(function (item) {
            if (!item) return;
            var stored = parseHex(item.colorHex);
            if (isUsableHex(stored)) return;
            var code = item.code || item.productCode || '';
            var found = lookup(item.color, code, item.colorImage || item.image, item.colorId);
            if (found) {
                item.colorHex = found;
                changed = true;
            }
        });

        var codes = [];
        items.forEach(function (item) {
            if (!item) return;
            if (isUsableHex(item.colorHex)) return;
            var code = (item.code || item.productCode || '').toUpperCase();
            if (code && codes.indexOf(code) === -1) codes.push(code);
        });

        var chain = Promise.resolve(changed);
        codes.forEach(function (code) {
            chain = chain.then(function (c) {
                return hydrateProduct(code).then(function () {
                    var any = c;
                    items.forEach(function (item) {
                        if (isUsableHex(item.colorHex)) return;
                        var ic = (item.code || item.productCode || '').toUpperCase();
                        if (ic !== code) return;
                        var found = lookup(item.color, code, item.colorImage, item.colorId);
                        if (found) {
                            item.colorHex = found;
                            any = true;
                        }
                    });
                    return any;
                });
            });
        });

        return chain.then(function (c) {
            var tasks = [];
            items.forEach(function (item) {
                if (!item || isUsableHex(item.colorHex)) return;
                var url = item.colorImage || item.image;
                if (!url) return;
                tasks.push(sampleFromImage(url).then(function (hex) {
                    if (isUsableHex(hex)) {
                        item.colorHex = hex;
                        register(item.color, hex, item.code || item.productCode);
                        return true;
                    }
                    return false;
                }));
            });
            if (!tasks.length) return c;
            return Promise.all(tasks).then(function (flags) {
                return c || flags.some(Boolean);
            });
        }).then(function (c) {
            if (c && typeof onUpdated === 'function') onUpdated();
            return c;
        });
    }

    loadPersisted();
    loadExternalDatabase();

    window.BrandedColorHex = {
        parseHex: parseHex,
        isUsableHex: isUsableHex,
        isPlaceholderSwatchHex: isPlaceholderSwatchHex,
        inferFromName: inferHexFromColourName,
        resolveForName: resolveForName,
        resolveForEntry: resolveForEntry,
        resolveGarmentTint: resolveGarmentTint,
        fillColourPairs: fillColourPairs,
        applySwatchAppearance: applySwatchAppearance,
        variantImageUrl: variantImageUrl,
        register: register,
        registerProductColors: registerProductColors,
        lookup: lookup,
        lookupByName: lookupByName,
        resolveDisplayName: resolveDisplayName,
        nameFromColorId: nameFromColorId,
        hydrateProduct: hydrateProduct,
        hydrateBasketItems: hydrateBasketItems,
        loadExternalDatabase: loadExternalDatabase,
        sampleFromImage: sampleFromImage,
        getImageHexSync: getImageHexSync,
        resolveGarmentHexAsync: resolveGarmentHexAsync,
        PLACEHOLDER_HEX: PLACEHOLDER_HEX,
        PLACEHOLDER_SWATCH: PLACEHOLDER_SWATCH
    };
})(window);
