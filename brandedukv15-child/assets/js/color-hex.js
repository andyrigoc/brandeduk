/**
 * BrandedColorHex — global colour name → hex registry
 * Used by basket, customize, shop, and API layer.
 */
(function (window) {
    'use strict';

    var STORAGE_KEY = 'brandedukColorHexIndex';
    var PLACEHOLDER_HEX = new Set(['#cccccc', '#ccc', '#f3f4f6']);

    /** Gildan / catalog defaults + shop primary-colour swatches + common workwear names */
    var BUILTIN = {
        'aquatic': '#5BA4A4', 'ash grey': '#B8B8B8', 'black': '#1a1a1a', 'black/black': '#0a0a0a',
        'blue': '#0000ff', 'blue dusk': '#4A6FA5', 'bottle green': '#1B4D3E', 'bottle green/off white': '#1B4D3E',
        'brown': '#8b4513', 'brown savana': '#8B7355', 'burgundy': '#800020', 'cardinal red': '#C41E3A',
        'carolina blue': '#99BADD', 'cement': '#9E9E9E', 'charcoal': '#4a4a4a', 'charcoal/black': '#2f3033',
        'cobalt': '#0047AB', 'cocoa': '#5C4033', 'coral': '#ff7f50', 'cream': '#fffdd0', 'daisy': '#FFD700',
        'dark green': '#013220', 'dark grey': '#505050', 'dark heather': '#5a5a5a', 'dusty rose': '#D4A5A5',
        'forest green': '#228B22', 'french navy': '#002366', 'gold': '#ffd700', 'green': '#008000',
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
        'texas orange': '#BF5700', 'white': '#ffffff', 'yellow': '#eab308', 'yellow haze': '#E8D44D',
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
        'classic navy': '#1e3a5f', 'fuchsia': '#ff00ff', 'heather': '#b6b6b4', 'indigo': '#4b0082',
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

    function normName(name) {
        return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
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
        return p && !PLACEHOLDER_HEX.has(p);
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

    function registerProductColors(productCode, colors) {
        if (!productCode || !Array.isArray(colors)) return;
        colors.forEach(function (c) {
            if (!c) return;
            var name = c.name || c.colour_name || c.label || '';
            var hex = c.hex || c.colourHex || c.colorHex || c.colour_hex || c.color_hex || '';
            if (!isUsableHex(hex)) hex = lookupByName(name);
            register(name, hex, productCode);
        });
        persist();
    }

    function lookupByName(colorName) {
        var raw = normName(colorName);
        if (!raw) return '';
        if (globalMap[raw]) return globalMap[raw];
        var primary = raw.split('/')[0].trim();
        if (globalMap[primary]) return globalMap[primary];
        var best = '';
        var bestLen = 0;
        Object.keys(globalMap).forEach(function (key) {
            if (raw.includes(key) || key.includes(raw)) {
                if (key.length > bestLen) {
                    bestLen = key.length;
                    best = globalMap[key];
                }
            }
        });
        return best;
    }

    function lookup(colorName, productCode, imageUrl) {
        var code = productCode ? String(productCode).trim().toUpperCase() : '';
        var n = normName(colorName);
        if (code && byProduct[code] && n && byProduct[code][n]) {
            return byProduct[code][n];
        }
        var fromName = lookupByName(colorName);
        if (fromName) return fromName;
        if (imageUrl && byImage[imageUrl]) return byImage[imageUrl];
        return '';
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

    function sampleFromImage(imageUrl) {
        if (!imageUrl || byImage[imageUrl]) {
            return Promise.resolve(byImage[imageUrl] || '');
        }
        return new Promise(function (resolve) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () {
                try {
                    var canvas = document.createElement('canvas');
                    var size = 24;
                    canvas.width = size;
                    canvas.height = size;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, size, size);
                    var data = ctx.getImageData(0, 0, size, size).data;
                    var r = 0, g = 0, b = 0, count = 0;
                    var margin = Math.floor(size * 0.25);
                    for (var y = margin; y < size - margin; y++) {
                        for (var x = margin; x < size - margin; x++) {
                            var i = (y * size + x) * 4;
                            var pr = data[i], pg = data[i + 1], pb = data[i + 2], pa = data[i + 3];
                            if (pa < 128) continue;
                            var lum = (0.299 * pr + 0.587 * pg + 0.114 * pb) / 255;
                            if (lum > 0.94 || lum < 0.06) continue;
                            r += pr; g += pg; b += pb; count++;
                        }
                    }
                    if (!count) {
                        resolve('');
                        return;
                    }
                    var hex = '#' + [r, g, b].map(function (v) {
                        return Math.round(v / count).toString(16).padStart(2, '0');
                    }).join('');
                    if (isUsableHex(hex)) {
                        byImage[imageUrl] = hex;
                        persist();
                    }
                    resolve(hex);
                } catch (e) {
                    resolve('');
                }
            };
            img.onerror = function () { resolve(''); };
            img.src = imageUrl;
        });
    }

    /** Resolve missing hex on basket line items; re-render via optional callback */
    function hydrateBasketItems(items, onUpdated) {
        if (!Array.isArray(items) || items.length === 0) {
            return Promise.resolve(false);
        }
        var changed = false;
        items.forEach(function (item) {
            if (!item) return;
            var stored = parseHex(item.colorHex);
            if (isUsableHex(stored)) return;
            var code = item.code || item.productCode || '';
            var found = lookup(item.color, code, item.colorImage || item.image);
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
                        var found = lookup(item.color, code, item.colorImage);
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

    window.BrandedColorHex = {
        parseHex: parseHex,
        isUsableHex: isUsableHex,
        register: register,
        registerProductColors: registerProductColors,
        lookup: lookup,
        lookupByName: lookupByName,
        hydrateProduct: hydrateProduct,
        hydrateBasketItems: hydrateBasketItems,
        sampleFromImage: sampleFromImage,
        PLACEHOLDER_HEX: PLACEHOLDER_HEX
    };
})(window);
