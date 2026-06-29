/**
 * BrandedUK Mobile - Customize Page JavaScript
 * TapStitch-inspired interactions
 */

(function() {
    'use strict';

    const DEBUG = window.BRANDED_DEBUG === true;
    const debugLog = (...args) => { if (DEBUG) console.debug(...args); };
    const debugWarn = (...args) => { if (DEBUG) console.warn(...args); };

    // === VAT Constants ===
    const VAT_STORAGE_KEY = 'brandeduk-vat-mode';
    const VAT_RATE = 0.20;

    // === Canonical Position Display Names (SINGLE SOURCE OF TRUTH) ===
    const POSITION_DISPLAY_NAMES = {
        'left-chest': 'Left Chest',
        'right-chest': 'Right Chest',
        'front-center': 'Front Center',
        'back-large': 'Back Large',
        'left-sleeve': 'Left Sleeve',
        'right-sleeve': 'Right Sleeve',
        'left-breast': 'Left Chest',
        'right-breast': 'Right Chest',
        'small-centre-front': 'Centre Front',
        'large-front-center': 'Front Center',
        'large-back': 'Back Large',
        'left-arm': 'Left Arm',
        'right-arm': 'Right Arm'
    };
    function canonicalPositionName(slug) {
        return POSITION_DISPLAY_NAMES[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    function getPositionLabelFromCard(position) {
        const card = document.querySelector('.position-card[data-position="' + position + '"]')
            || document.querySelector('.position-card input[value="' + position + '"]')?.closest('.position-card');
        const labelSpan = card && card.querySelector('.position-checkbox span');
        if (labelSpan && labelSpan.textContent.trim()) return labelSpan.textContent.trim();
        return canonicalPositionName(position);
    }

    // === Product Colors (default GD067 fallback) ===
    // Will be replaced at runtime if product API data is available
    let PRODUCT_COLORS = [
        { id: 'aquatic', name: 'Aquatic', hex: '#5BA4A4', image: 'https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg' },
        { id: 'ash-grey', name: 'Ash Grey', hex: '#B8B8B8', image: 'https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg' },
        { id: 'black', name: 'Black', hex: '#1a1a1a', image: 'https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg' },
        { id: 'blue-dusk', name: 'Blue Dusk', hex: '#4A6FA5', image: 'https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg' },
        { id: 'brown-savana', name: 'Brown Savana', hex: '#8B7355', image: 'https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg' },
        { id: 'cardinal-red', name: 'Cardinal Red', hex: '#C41E3A', image: 'https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg' },
        { id: 'carolina-blue', name: 'Carolina Blue', hex: '#99BADD', image: 'https://i.postimg.cc/V6N7kG1D/GD067-Carolina-Blue-FT.jpg' },
        { id: 'cement', name: 'Cement', hex: '#9E9E9E', image: 'https://i.postimg.cc/fLbHR2Z2/GD067-Cement-FT.jpg' },
        { id: 'charcoal', name: 'Charcoal', hex: '#4a4a4a', image: 'https://i.postimg.cc/4d38xLZF/GD067-Charcoal-FT.jpg' },
        { id: 'cobalt', name: 'Cobalt', hex: '#0047AB', image: 'https://i.postimg.cc/sX2ng6yL/GD067-Cobalt-FT.jpg' },
        { id: 'cocoa', name: 'Cocoa', hex: '#5C4033', image: 'https://i.postimg.cc/d10WVHvb/GD067-Cocoa-FT.jpg' },
        { id: 'daisy', name: 'Daisy', hex: '#FFD700', image: 'https://i.postimg.cc/1tzW3Cs1/GD067-Daisy-FT.jpg' },
        { id: 'dark-heather', name: 'Dark Heather', hex: '#5a5a5a', image: 'https://i.postimg.cc/j5kMwHdk/GD067-Dark-Heather-FT.jpg' },
        { id: 'dusty-rose', name: 'Dusty Rose', hex: '#D4A5A5', image: 'https://i.postimg.cc/fLg8tcTP/GD067-Dusty-Rose-FT.jpg' },
        { id: 'forest-green', name: 'Forest Green', hex: '#228B22', image: 'https://i.postimg.cc/FRnTdys8/GD067-Forest-Green-FT.jpg' },
        { id: 'light-pink', name: 'Light Pink', hex: '#FFB6C1', image: 'https://i.postimg.cc/G2SX8FhW/GD067-Light-Pink-FT.jpg' },
        { id: 'maroon', name: 'Maroon', hex: '#800000', image: 'https://i.postimg.cc/zBPxbCG1/GD067-Maroon-FT.jpg' },
        { id: 'military-green', name: 'Military Green', hex: '#4B5320', image: 'https://i.postimg.cc/TwHtLV3f/GD067-Military-Green-FT.jpg' },
        { id: 'mustard', name: 'Mustard', hex: '#FFDB58', image: 'https://i.postimg.cc/MTr9M7pZ/GD067-Mustard-FT.jpg' },
        { id: 'navy', name: 'Navy', hex: '#1e3a5f', image: 'https://i.postimg.cc/MTr9M7pp/GD067-Navy-FT.jpg' },
        { id: 'off-white', name: 'Off-White', hex: '#FAF9F6', image: 'https://i.postimg.cc/nzw3j4hz/GD067-Off-White-FT.jpg' },
        { id: 'paragon', name: 'Paragon', hex: '#C0C0C0', image: 'https://i.postimg.cc/j5kMwHSL/GD067-Paragon-FT.jpg' },
        { id: 'pink-lemonade', name: 'Pink Lemonade', hex: '#F8B4D9', image: 'https://i.postimg.cc/zBPxbCGy/GD067-Pink-Lemonade-FT.jpg' },
        { id: 'pistachio', name: 'Pistachio', hex: '#93C572', image: 'https://i.postimg.cc/xCF6Jv1N/GD067-Pistachio-FT.jpg' },
        { id: 'purple', name: 'Purple', hex: '#273469', image: 'https://i.postimg.cc/C5BmjRRx/GD067-Purple-FT.jpg' },
        { id: 'red', name: 'Red', hex: '#dc2626', image: 'https://i.postimg.cc/brD3QZZd/GD067-Red-FT.jpg' },
        { id: 'sport-grey', name: 'Sport Grey', hex: '#9ca3af', image: 'https://i.postimg.cc/zvb0nyyg/GD067-Ringspun-Sport-Grey-FT.jpg' },
        { id: 'royal', name: 'Royal', hex: '#2563eb', image: 'https://i.postimg.cc/VNmG3sVH/GD067-Royal-FT.jpg' },
        { id: 'sage', name: 'Sage', hex: '#9CAF88', image: 'https://i.postimg.cc/tgpSLRcy/GD067-Sage-FT.jpg' },
        { id: 'sand', name: 'Sand', hex: '#C2B280', image: 'https://i.postimg.cc/Bv4YdZz3/GD067-Sand-FT.jpg' },
        { id: 'sky', name: 'Sky', hex: '#87CEEB', image: 'https://i.postimg.cc/YSMnJ2Pc/GD067-Sky-FT.jpg' },
        { id: 'smoke', name: 'Smoke', hex: '#738276', image: 'https://i.postimg.cc/Xv4HTNPb/GD067-Smoke-FT.jpg' },
        { id: 'stone-blue', name: 'Stone Blue', hex: '#6A8EAE', image: 'https://i.postimg.cc/g0mSfc72/GD067-Stone-Blue-FT.jpg' },
        { id: 'tangerine', name: 'Tangerine', hex: '#FF9966', image: 'https://i.postimg.cc/25GcmRpr/GD067-Tangerine-FT.jpg' },
        { id: 'texas-orange', name: 'Texas Orange', hex: '#BF5700', image: 'https://i.postimg.cc/TP07GM8x/GD067-Texas-Orange-FT.jpg' },
        { id: 'white', name: 'White', hex: '#ffffff', image: 'https://i.postimg.cc/1zBCPhxQ/GD067-White-FT.jpg' },
        { id: 'yellow-haze', name: 'Yellow Haze', hex: '#E8D44D', image: 'https://i.postimg.cc/W48WjLRN/GD067-Yellow-Haze-FT.jpg' }
    ];

    // === Pricing Rules (GD067 fallback) ===
    // Will be extended at runtime if product API provides priceBreaks
    let PRICING_RULES = {
        GD067: {
            basePrice: 17.58,
            tiers: [
                { min: 250, price: 12.59 },
                { min: 100, price: 13.49 },
                { min: 50, price: 14.94 },
                { min: 25, price: 16.18 },
                { min: 10, price: 16.54 }
            ]
        }
    };

    // === API ===
    // Minimal API base used by desktop product.js — reuse here for mobile fetches
    const API_BASE_URL = 'https://api.brandeduk.com/api';

    // === DYNAMIC POSITION MAPPING SYSTEM ===
    
    // === IMAGE COMPRESSION UTILITY ===
    // Compress images before upload to avoid 413 errors (max ~800KB target)
    async function compressImageFile(file, maxSizeKB = 800, maxDimension = 1200) {
        // If file is already small enough, return as-is
        if (file.size <= maxSizeKB * 1024) {
            debugLog(`📷 Image already small enough: ${(file.size/1024).toFixed(1)}KB`);
            return file;
        }
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = function() {
                let { width, height } = img;
                
                // Scale down if too large
                if (width > maxDimension || height > maxDimension) {
                    const ratio = Math.min(maxDimension / width, maxDimension / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Try progressively lower quality until size is acceptable
                let quality = 0.85;
                const tryCompress = () => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            resolve(file); // Fallback to original
                            return;
                        }
                        
                        if (blob.size > maxSizeKB * 1024 && quality > 0.3) {
                            quality -= 0.1;
                            tryCompress();
                        } else {
                            const compressedFile = new File([blob], file.name, { 
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            debugLog(`📷 Compressed image: ${(file.size/1024).toFixed(1)}KB → ${(compressedFile.size/1024).toFixed(1)}KB (quality: ${quality.toFixed(2)})`);
                            resolve(compressedFile);
                        }
                    }, 'image/jpeg', quality);
                };
                
                tryCompress();
            };
            
            img.onerror = () => {
                debugWarn('📷 Could not load image for compression, using original');
                resolve(file);
            };
            
            // Load image from file
            const reader = new FileReader();
            reader.onload = (e) => { img.src = e.target.result; };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    }
    
    // Default fallback images (hoodie images)
    const DEFAULT_POSITION_IMAGES = {
        'left-breast': 'https://i.postimg.cc/fTVKLHLj/Chat_GPT_Image_Jan_11_2026_04_51_46_PM.png',
        'right-breast': 'https://i.postimg.cc/fTVKLHLj/Chat_GPT_Image_Jan_11_2026_04_51_46_PM.png',
        'small-centre-front': 'https://i.postimg.cc/RFng3DGw/Chat_GPT_Image_Dec_19_2025_08_06_23_PM.png',
        'large-front-center': 'https://i.postimg.cc/RFng3DGw/Chat_GPT_Image_Dec_19_2025_08_06_23_PM.png',
        'large-centre-front': 'https://i.postimg.cc/RFng3DGw/Chat_GPT_Image_Dec_19_2025_08_06_23_PM.png',
        'large-back': 'https://i.postimg.cc/4NY5d8dt/Chat_GPT_Image_Jan_11_2026_04_51_51_PM.png',
        'left-arm': 'https://i.postimg.cc/hPXrjCjm/Chat_GPT_Image_Jan_11_2026_04_51_53_PM.png',
        'right-arm': 'https://i.postimg.cc/hPXrjCjm/Chat_GPT_Image_Jan_11_2026_04_51_53_PM.png'
    };
    
    // Default prices per position type
    const DEFAULT_POSITION_PRICES = {
        'left-breast': { embroidery: '5.00', print: '3.50' },
        'right-breast': { embroidery: '5.00', print: '3.50' },
        'small-centre-front': { embroidery: '5.00', print: '6.50' },
        'large-front-center': { embroidery: 'POA', print: '8.00' },
        'large-centre-front': { embroidery: 'POA', print: '8.00' },
        'large-back': { embroidery: 'POA', print: '8.00' },
        'left-arm': { embroidery: '5.00', print: '3.50' },
        'right-arm': { embroidery: '5.00', print: '3.50' }
    };

    // Apron tint: neutral PNG + luminance mask (see mobile/apron-tint-poc.html) — do not change apron path for hoodie experiments
    const APRON_GARMENT_TINT_POC = true;
    const HOODIE_GARMENT_TINT_POC = false; // Disabled: hoodie PNGs are light-gray on transparent — screen blend on white bg makes them invisible. Use hex background only.
    const HOODIE_GARMENT_TINT_TYPES = ['Hoodies', 'Sweatshirts'];
    const GARMENT_MASK_WHITE_CUTOFF = 236;
    const GARMENT_MASK_BLACK_CUTOFF = 48;
    const APRON_NEUTRAL_IMAGE = 'brandedukv15-child/assets/images/customization/positions/aprons/bib-apron/apron-neutral.png';
    const APRON_NEUTRAL_FALLBACK = 'brandedukv15-child/assets/images/customization/positions/aprons/bib-apron/apron-neutral.svg';

    /** Root-absolute or ../ from /mobile/ pages — fixes 404 on Live Server */
    function resolveBrandedAssetUrl(assetPath) {
        const clean = String(assetPath || '').replace(/^\//, '');
        if (!clean) return '';
        if (/^https?:\/\//i.test(clean)) return clean;
        if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
            return window.location.origin.replace(/\/$/, '') + '/' + clean;
        }
        const path = window.location.pathname || '';
        if (path.indexOf('/mobile/') !== -1 || /\/mobile\/?$/i.test(path)) {
            return '../' + clean;
        }
        return '/' + clean;
    }

    function apronMaskCssUrl() {
        return 'url("' + resolveBrandedAssetUrl(APRON_NEUTRAL_IMAGE) + '")';
    }

    function isApronProductContext(productType) {
        const pt = productType
            || (state.product && state.product.rawData && (state.product.rawData.productType || state.product.rawData.category || state.product.rawData.type))
            || '';
        if (normalizeProductTypeForFolder(pt) === 'Aprons') return true;
        const name = (state.product && state.product.name) || (state.product && state.product.rawData && state.product.rawData.name) || '';
        return inferProductTypeFromName(name) === 'Aprons';
    }

    function isHoodieGarmentTintContext(productType) {
        if (!HOODIE_GARMENT_TINT_POC) return false;
        const pt = productType
            || (state.product && (state.product.productType || (state.product.rawData && (state.product.rawData.productType || state.product.rawData.category || state.product.rawData.type))))
            || '';
        const normalized = normalizeProductTypeForFolder(pt);
        if (HOODIE_GARMENT_TINT_TYPES.includes(normalized)) return true;
        const name = (state.product && state.product.name) || (state.product && state.product.rawData && state.product.rawData.name) || '';
        return HOODIE_GARMENT_TINT_TYPES.includes(inferProductTypeFromName(name));
    }

    function buildStrictGarmentMaskDataUrl(img) {
        if (!img || !img.naturalWidth || !img.naturalHeight) return null;
        try {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const px = imageData.data;
            const whiteCut = GARMENT_MASK_WHITE_CUTOFF;
            const blackCut = GARMENT_MASK_BLACK_CUTOFF;
            const span = Math.max(1, whiteCut - blackCut);
            for (let i = 0; i < px.length; i += 4) {
                const r = px[i];
                const g = px[i + 1];
                const b = px[i + 2];
                const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                let maskVal = 0;
                if (lum < whiteCut && lum > blackCut) {
                    maskVal = Math.round(Math.min(255, ((whiteCut - lum) / span) * 255));
                }
                px[i] = maskVal;
                px[i + 1] = maskVal;
                px[i + 2] = maskVal;
                px[i + 3] = 255;
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas.toDataURL('image/png');
        } catch (e) {
            debugWarn('Garment mask build failed, using source image mask', e);
            return null;
        }
    }

    function enforceGarmentCardWhiteBackground(scope) {
        const root = scope && scope.querySelectorAll ? scope : document;
        root.querySelectorAll('.position-preview--garment-tint, .garment-tint-stack').forEach(function (el) {
            el.style.setProperty('background-color', '#ffffff', 'important');
            el.style.removeProperty('--garment-bg');
        });
        root.querySelectorAll('.position-card').forEach(function (card) {
            if (!card.querySelector('.position-preview--garment-tint, .garment-tint-stack')) return;
            const preview = card.querySelector('.position-preview');
            if (preview) {
                preview.classList.add('position-preview--garment-tint');
                preview.style.setProperty('background-color', '#ffffff', 'important');
                preview.style.removeProperty('--garment-bg');
            }
        });
    }

    function syncHoodieGarmentTintMaskFromImage(img) {
        if (!img) return;
        const stack = img.closest('.garment-tint-stack');
        if (!stack) return;
        if (img.dataset.garmentMaskData) {
            ensureHoodieGarmentTintLayer(stack, img.dataset.garmentMaskData);
            return;
        }
        const strictMask = buildStrictGarmentMaskDataUrl(img);
        if (strictMask) {
            img.dataset.garmentMaskData = strictMask;
            ensureHoodieGarmentTintLayer(stack, strictMask);
            return;
        }
        const src = img.currentSrc || img.src;
        if (src && src.indexOf('data:') !== 0) {
            ensureHoodieGarmentTintLayer(stack, src);
        }
    }

    function ensureApronGarmentTintLayer(stack) {
        if (!stack) return;
        const legacyLayer = stack.querySelector('.garment-tint-layer');
        if (legacyLayer) legacyLayer.remove();
        if (!stack.querySelector('.garment-tint-mask')) {
            const mask = document.createElement('div');
            mask.className = 'garment-tint-mask';
            mask.setAttribute('aria-hidden', 'true');
            stack.appendChild(mask);
        }
        stack.style.setProperty('--garment-mask-url', apronMaskCssUrl());
    }

    function ensureApronGarmentTintStack(img) {
        if (!img) return;
        const existing = img.closest('.garment-tint-stack');
        if (existing) {
            existing.classList.add('garment-tint-stack--apron');
            ensureApronGarmentTintLayer(existing);
            img.classList.add('garment-tint-base');
            img.classList.remove('garment-tint-base--hidden');
            return;
        }
        const preview = img.closest('.position-preview');
        const stack = document.createElement('div');
        stack.className = 'garment-tint-stack';
        stack.style.setProperty('--garment-mask-url', apronMaskCssUrl());
        img.parentNode.insertBefore(stack, img);
        stack.appendChild(img);
        img.classList.add('garment-tint-base');
        ensureApronGarmentTintLayer(stack);
        if (preview) {
            preview.classList.add('position-preview--garment-tint');
            preview.style.backgroundColor = '#ffffff';
            preview.style.removeProperty('--garment-bg');
        }
    }

    function ensureHoodieGarmentTintLayer(stack, maskUrl) {
        if (!stack) return;
        const legacyMask = stack.querySelector('.garment-tint-mask');
        if (legacyMask) legacyMask.remove();
        if (!stack.querySelector('.garment-tint-layer')) {
            const layer = document.createElement('span');
            layer.className = 'garment-tint-layer';
            layer.setAttribute('aria-hidden', 'true');
            stack.appendChild(layer);
        }
        const url = maskUrl || stack.dataset.garmentMaskUrl || '';
        if (url) {
            stack.dataset.garmentMaskUrl = url;
            stack.style.setProperty('--garment-mask-url', 'url("' + url + '")');
        }
    }

    function ensureHoodieGarmentTintStack(img, maskUrl) {
        if (!img) return;
        const mask = maskUrl || img.currentSrc || img.src || '';
        const existing = img.closest('.garment-tint-stack');
        if (existing) {
            ensureHoodieGarmentTintLayer(existing, mask);
            img.classList.add('garment-tint-base');
            img.classList.remove('garment-tint-base--hidden');
            return;
        }
        const preview = img.closest('.position-preview');
        const stack = document.createElement('div');
        stack.className = 'garment-tint-stack';
        img.parentNode.insertBefore(stack, img);
        stack.appendChild(img);
        img.classList.add('garment-tint-base');
        ensureHoodieGarmentTintLayer(stack, mask);
        if (preview) {
            preview.classList.add('position-preview--garment-tint');
            preview.style.backgroundColor = '#ffffff';
            preview.style.removeProperty('--garment-bg');
        }
    }

    function setPositionCardGarmentImage(img, imageUrl, productType) {
        if (!img || !imageUrl) return;
        if (isApronProductContext(productType)) {
            ensureApronGarmentTintStack(img);
            setApronNeutralImage(img);
            return;
        }
        if (isHoodieGarmentTintContext(productType)) {
            delete img.dataset.garmentMaskData;
            ensureHoodieGarmentTintStack(img, imageUrl);
            img.src = imageUrl;
            if (img.complete) {
                syncHoodieGarmentTintMaskFromImage(img);
            } else {
                img.addEventListener('load', function () {
                    syncHoodieGarmentTintMaskFromImage(img);
                }, { once: true });
            }
            return;
        }
        img.src = imageUrl;
    }

    function applySessionColorFromBasket() {
        try {
            const raw = sessionStorage.getItem('selectedProductData');
            const pd = raw ? JSON.parse(raw) : {};
            const colorName = pd.color || sessionStorage.getItem('selectedColorName') || '';
            const colorHex = pd.colorHex || '';
            const code = state.product && state.product.code ? state.product.code : (pd.code || '');
            if (colorHex && window.BrandedColorHex && colorName) {
                BrandedColorHex.register(colorName, colorHex, code);
            }
            if (!colorName) return;
            const match = PRODUCT_COLORS.find(function (c) {
                return String(c.name || '').toLowerCase() === colorName.toLowerCase();
            });
            if (match) {
                state.selectedColor = match.id;
                state.selectedColorName = match.name;
                state.selectedColorImage = match.image;
                if (colorHex && isUsableColorHex(colorHex)) match.hex = colorHex;
            } else {
                state.selectedColorName = colorName;
                state.selectedColor = slugify(colorName);
            }
        } catch (e) { /* ignore */ }
    }

    function refreshApronPositionCardsFromBasket() {
        if (!APRON_GARMENT_TINT_POC || !isApronProductContext()) return;
        const grids = document.querySelectorAll('#positionOptions, .positions-grid');
        const pt = state.product && (state.product.productType || (state.product.rawData && (state.product.rawData.productType || state.product.rawData.category))) || '';
        reorderPositionCardsInGrids(grids, pt || inferProductTypeFromName(state.product?.name || ''));
        finalizeApronGarmentTintOnCards(grids);
        applyGarmentColorToPositionPreviews();
    }

    function refreshHoodieGarmentTintPositionCardsFromBasket() {
        if (!HOODIE_GARMENT_TINT_POC || !isHoodieGarmentTintContext()) return;
        const grids = document.querySelectorAll('#positionOptions, .positions-grid');
        const pt = state.product && (state.product.productType || (state.product.rawData && (state.product.rawData.productType || state.product.rawData.category))) || '';
        reorderPositionCardsInGrids(grids, pt || inferProductTypeFromName(state.product?.name || ''));
        finalizeHoodieGarmentTintOnCards(grids);
        applyGarmentColorToPositionPreviews();
    }

    function setApronNeutralImage(img) {
        if (!img) return;
        img.src = resolveBrandedAssetUrl(APRON_NEUTRAL_IMAGE);
        img.onerror = function () {
            if (img.dataset.apronNeutralFallback === '1') return;
            img.dataset.apronNeutralFallback = '1';
            img.src = resolveBrandedAssetUrl(APRON_NEUTRAL_FALLBACK);
            img.onerror = null;
        };
    }

    function applyApronGarmentTintStacks(scopeRoot, tintHex) {
        const normalizedTint = String(tintHex || '').replace('#', '').toLowerCase();
        const isNearWhite = normalizedTint === 'fff' || normalizedTint === 'ffffff' || normalizedTint === 'faf9f6';
        const useMaskTint = tintHex && !isNearWhite;
        const root = scopeRoot && scopeRoot.querySelectorAll ? scopeRoot : document;

        root.querySelectorAll('.position-card').forEach(function (card) {
            if (card.style.display === 'none') return;
            const img = card.querySelector('.position-placeholder');
            if (!img) return;
            ensureApronGarmentTintStack(img);
            setApronNeutralImage(img);
        });

        root.querySelectorAll('.garment-tint-stack--apron, .garment-tint-stack').forEach(function (stack) {
            if (!stack.querySelector('.garment-tint-mask')) return;
            ensureApronGarmentTintLayer(stack);
            const tintMask = stack.querySelector('.garment-tint-mask');
            const baseImg = stack.querySelector('.garment-tint-base');
            if (tintMask) {
                if (useMaskTint) {
                    tintMask.style.setProperty('--garment-tint', tintHex);
                    tintMask.style.backgroundColor = tintHex;
                    tintMask.classList.add('is-active');
                } else {
                    tintMask.classList.remove('is-active');
                    tintMask.style.removeProperty('--garment-tint');
                    tintMask.style.backgroundColor = '';
                }
            }
            if (baseImg) {
                baseImg.classList.remove('garment-tint-base--hidden');
                setApronNeutralImage(baseImg);
            }
            stack.style.backgroundColor = '#ffffff';
            stack.style.removeProperty('--garment-bg');
        });

        const logoBoxBg = tintHex || '#f3f4f6';
        root.querySelectorAll('.position-preview-content, .uploaded-logo-box').forEach(function (el) {
            if (tintHex) el.style.setProperty('--garment-bg', tintHex);
            else el.style.removeProperty('--garment-bg');
            el.style.backgroundColor = logoBoxBg;
        });
    }

    function finalizeApronGarmentTintOnCards(positionGrids) {
        if (!APRON_GARMENT_TINT_POC) return;
        const grids = positionGrids || document.querySelectorAll('#positionOptions, .positions-grid');
        applyApronGarmentTintStacks(grids, resolveGarmentPreviewHex());
    }

    function finalizeHoodieGarmentTintOnCards(positionGrids) {
        if (!HOODIE_GARMENT_TINT_POC) return;
        (positionGrids || document.querySelectorAll('#positionOptions, .positions-grid')).forEach(function (grid) {
            grid.querySelectorAll('.position-card').forEach(function (card) {
                if (card.style.display === 'none') return;
                const img = card.querySelector('.position-placeholder');
                if (!img) return;
                ensureHoodieGarmentTintStack(img);
                if (img.complete) {
                    syncHoodieGarmentTintMaskFromImage(img);
                } else {
                    img.addEventListener('load', function () {
                        syncHoodieGarmentTintMaskFromImage(img);
                    }, { once: true });
                }
            });
        });
        enforceGarmentCardWhiteBackground(positionGrids);
        applyGarmentColorToPositionPreviews();
    }
    
    // Position code to CSS class mapping
    const POSITION_TO_CSS_CLASS = {
        'left-breast': 'left-chest',
        'right-breast': 'right-chest',
        'small-centre-front': 'front-center',
        'large-front-center': 'large-front',
        'large-centre-front': 'large-front',
        'large-back': 'large-back',
        'left-arm': 'left-sleeve',
        'right-arm': 'right-sleeve'
    };
    
    // ProductType → Folder Path Mapping
    const PRODUCT_TYPE_TO_FOLDER = {
        'Aprons': 'aprons/bib-apron',
        'Safety Vests': 'adult-tops/hivis-jacket',
        'Hoodies': 'adult-tops/hoodies',
        'Sweatshirts': 'adult-tops/hoodies',
        'Polos': 'adult-tops/long-sleeve-polo',
        'Short Sleeve Polos': 'adult-tops/short-sleeve-polo',
        'T-shirts': 'adult-tops/short-sleeve-crew-neck',
        'Shirts': 'adult-tops/short-sleeve-crew-neck',
        'Jackets': 'adult-tops/soft-shell-jacket',
        'Softshells': 'adult-tops/soft-shell-jacket',
        'Caps': 'headwear/baseball-cap',
        'Beanies': 'headwear/beanie',
        'Trousers': 'pants/workwear-long-trousers',
        'Shorts': 'pants/workwear-shorts',
        'Bags': 'bags/gym-bag',
        'Tote Bags': 'bags/tote-bag',
        'Fleece': 'adult-tops/hoodies',
        'Gilets & Body Warmers': 'adult-tops/soft-shell-jacket',
        'Knitted Jumpers': 'adult-tops/hoodies',
        'Cardigans': 'adult-tops/hoodies',
        'Blouses': 'adult-tops/short-sleeve-crew-neck',
        'Rugby Shirts': 'adult-tops/short-sleeve-crew-neck',
        'Chinos': 'pants/workwear-long-trousers',
        'Sweatpants': 'pants/workwear-shorts',
        'Trackwear': 'adult-tops/short-sleeve-crew-neck'
    };
    
    // Filename → Position Code Mapping
    const FILENAME_TO_POSITION = {
        // Aprons
        'center-front.png': { code: 'small-centre-front', label: 'Center Front', cssClass: 'front-center' },
        'low-left.png': { code: 'left-breast', label: 'Low Left', cssClass: 'apron-low-left' },
        'low-right.png': { code: 'right-breast', label: 'Low Right', cssClass: 'apron-low-right' },
        
        // Adult Tops
        'front.png': { code: 'small-centre-front', label: 'Front Center', cssClass: 'front-center' },
        'front.jpg': { code: 'small-centre-front', label: 'Front Center', cssClass: 'front-center' },
        'front-right.png': { code: 'right-breast', label: 'Front Right', cssClass: 'right-chest' },
        'back.png': { code: 'large-back', label: 'Back Large', cssClass: 'large-back' },
        'back.jpg': { code: 'large-back', label: 'Back Large', cssClass: 'large-back' },
        'left-chest.png': { code: 'left-breast', label: 'Left Chest', cssClass: 'left-chest' },
        'left-chest.jpg': { code: 'left-breast', label: 'Left Chest', cssClass: 'left-chest' },
        'right-chest.png': { code: 'right-breast', label: 'Right Chest', cssClass: 'right-chest' },
        'right-chest.jpg': { code: 'right-breast', label: 'Right Chest', cssClass: 'right-chest' },
        'left-sleeve.png': { code: 'left-arm', label: 'Left Sleeve', cssClass: 'left-sleeve' },
        'left-sleeve.jpg': { code: 'left-arm', label: 'Left Sleeve', cssClass: 'left-sleeve' },
        'right-sleeve.png': { code: 'right-arm', label: 'Right Sleeve', cssClass: 'right-sleeve' },
        'right-sleeve.jpg': { code: 'right-arm', label: 'Right Sleeve', cssClass: 'right-sleeve' },
        
        // Headwear
        'front-logo.png': { code: 'small-centre-front', label: 'Front Centre', cssClass: 'front-center' },
        'left-side.jpg': { code: 'left-breast', label: 'Left Side', cssClass: 'left-chest' },
        'right-side.jpg': { code: 'right-breast', label: 'Right Side', cssClass: 'right-chest' },
        
        // Bags
        'Gym Bag Centered.png': { code: 'small-centre-front', label: 'Centered', cssClass: 'front-center' },
        'Gym Bag Left.png': { code: 'left-breast', label: 'Left', cssClass: 'left-chest' },
        'Gym Bag Right.png': { code: 'right-breast', label: 'Right', cssClass: 'right-chest' },
        'Gym Bag Side.png': { code: 'large-back', label: 'Side', cssClass: 'large-back' },
        
        // Pants
        'Blank Work Trouser.png': { code: 'small-centre-front', label: 'Front', cssClass: 'front-center' },
        'Blank Work short.png': { code: 'small-centre-front', label: 'Front', cssClass: 'front-center' }
    };
    
    // Folder Image Inventory
    const FOLDER_IMAGE_MAP = {
        'aprons/bib-apron': ['center-front.png', 'low-left.png', 'low-right.png'],
        'adult-tops/hivis-jacket': ['back.jpg', 'front.png', 'left-chest.png', 'left-sleeve.jpg', 'right-chest.png', 'right-sleeve.jpg'],
        'adult-tops/hoodies': ['back.png', 'front.png', 'left-chest.png', 'left-sleeve.png', 'right-chest.png', 'right-sleeve.png'],
        'adult-tops/long-sleeve-polo': ['back.png', 'left-sleeve.png', 'right-chest.png', 'right-sleeve.png'],
        // 'adult-tops/short-sleeve-polo': [],   // no images yet — falls back to static HTML cards
        // 'adult-tops/short-sleeve-crew-neck': [], // no images yet — falls back to static HTML cards
        'adult-tops/soft-shell-jacket': ['back.png', 'front-right.png', 'left-sleeve.png', 'right-sleeve.png'],
        'headwear/baseball-cap': ['back.png', 'front.png', 'left-side.jpg', 'right-side.jpg'],
        'headwear/beanie': ['front-logo.png'],
        'pants/workwear-long-trousers': ['Blank Work Trouser.png'],
        'pants/workwear-shorts': ['Blank Work short.png'],
        'bags/gym-bag': ['Gym Bag Centered.png', 'Gym Bag Left.png', 'Gym Bag Right.png', 'Gym Bag Side.png'],
        'bags/tote-bag': ['front.png', 'back.png']
    };

    function normalizeProductTypeForFolder(productType) {
        const raw = String(productType || '').trim();
        if (!raw) return '';

        const lower = raw.toLowerCase();

        // Normalize all known product type variants to their PRODUCT_TYPE_TO_FOLDER key
        if (lower.includes('apron')) return 'Aprons';
        if (lower.includes('beanie') || lower.includes('bobble hat') || lower.includes('knit hat') || lower.includes('knitted hat')) return 'Beanies';
        if (lower.includes('cap') || lower.includes('baseball') || lower.includes('snapback') || lower.includes('trucker') || lower.includes('visor') || lower.includes('bucket hat')) return 'Caps';
        if (lower.includes('hoodie') || lower.includes('hooded')) return 'Hoodies';
        if (lower.includes('sweatshirt') || lower.includes('crew neck sweat') || lower.includes('raglan')) return 'Sweatshirts';
        if (lower.includes('fleece')) return 'Fleece';
        if (lower.includes('polo') && lower.includes('long sleeve')) return 'Polos';
        if (lower.includes('polo')) return 'Short Sleeve Polos';
        if (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('tee ') || lower === 'tee' || lower.includes('vest top')) return 'T-shirts';
        if (lower.includes('jacket') || lower.includes('parka') || lower.includes('coat') || lower.includes('anorak') || lower.includes('windbreaker')) return 'Jackets';
        if (lower.includes('softshell') || lower.includes('soft shell') || lower.includes('soft-shell')) return 'Softshells';
        if (lower.includes('gilet') || lower.includes('body warmer') || lower.includes('bodywarmer')) return 'Gilets & Body Warmers';
        if (lower.includes('hi-vis') || lower.includes('hivis') || lower.includes('hi vis') || lower.includes('high vis') || lower.includes('safety vest')) return 'Safety Vests';
        if (lower.includes('trouser') || lower.includes('pant') || lower.includes('chino')) return 'Trousers';
        if (lower.includes('short') && !lower.includes('shirt')) return 'Shorts';
        if (lower.includes('sweatpant') || lower.includes('jogger') || lower.includes('jogging')) return 'Sweatpants';
        if (lower.includes('tote')) return 'Tote Bags';
        if (lower.includes('bag') || lower.includes('rucksack') || lower.includes('backpack') || lower.includes('holdall') || lower.includes('duffle') || lower.includes('duffel')) return 'Bags';
        if (lower.includes('shirt') || lower.includes('blouse')) return 'Shirts';
        if (lower.includes('rugby')) return 'Rugby Shirts';
        if (lower.includes('cardigan')) return 'Cardigans';
        if (lower.includes('jumper') || lower.includes('knitted')) return 'Knitted Jumpers';

        return raw;
    }

    // Infer product type from product name/description when API doesn't provide productType
    function inferProductTypeFromName(text) {
        if (!text) return '';
        const lower = String(text).toLowerCase();

        // Order matters: more specific matches first
        if (lower.includes('apron')) return 'Aprons';
        if (lower.includes('beanie') || lower.includes('bobble hat') || lower.includes('knit hat')) return 'Beanies';
        if (lower.includes('baseball') || lower.includes('snapback') || lower.includes('trucker') || lower.includes('visor') || lower.includes('bucket hat')) return 'Caps';
        if (lower.includes('cap') && !lower.includes('capsule')) return 'Caps';
        if (lower.includes('hoodie') || lower.includes('hooded sweat') || lower.includes('hooded top') || lower.includes('zip hood')) return 'Hoodies';
        if (lower.includes('sweatshirt') || lower.includes('crew neck sweat') || lower.includes('raglan sweat')) return 'Sweatshirts';
        if (lower.includes('fleece')) return 'Fleece';
        if (lower.includes('polo') && lower.includes('long sleeve')) return 'Polos';
        if (lower.includes('polo')) return 'Short Sleeve Polos';
        if (lower.includes('t-shirt') || lower.includes('tshirt') || (lower.includes('tee') && !lower.includes('steel'))) return 'T-shirts';
        if (lower.includes('softshell') || lower.includes('soft shell') || lower.includes('soft-shell')) return 'Softshells';
        if (lower.includes('jacket') || lower.includes('parka') || lower.includes('coat') || lower.includes('anorak')) return 'Jackets';
        if (lower.includes('gilet') || lower.includes('body warmer') || lower.includes('bodywarmer')) return 'Gilets & Body Warmers';
        if (lower.includes('hi-vis') || lower.includes('hivis') || lower.includes('hi vis') || lower.includes('high vis') || lower.includes('safety vest')) return 'Safety Vests';
        if (lower.includes('trouser') || lower.includes('chino')) return 'Trousers';
        if (lower.includes('short') && !lower.includes('shirt') && !lower.includes('sleeve')) return 'Shorts';
        if (lower.includes('sweatpant') || lower.includes('jogger') || lower.includes('jogging')) return 'Sweatpants';
        if (lower.includes('tote')) return 'Tote Bags';
        if (lower.includes('bag') || lower.includes('rucksack') || lower.includes('backpack') || lower.includes('holdall')) return 'Bags';
        if (lower.includes('blouse')) return 'Shirts';
        if (lower.includes('rugby')) return 'Rugby Shirts';
        if (lower.includes('cardigan')) return 'Cardigans';
        if (lower.includes('jumper')) return 'Knitted Jumpers';
        if (lower.includes('shirt')) return 'Shirts';

        return '';
    }
    
    // Build positions dynamically from productType
    function buildPositionsFromProductType(productType) {
        if (!productType) {
            debugWarn('⚠️ No productType provided, using default');
            return null;
        }
        
        const productTypeStr = String(productType).trim();
        const normalizedProductType = normalizeProductTypeForFolder(productTypeStr);
        const folderPath = PRODUCT_TYPE_TO_FOLDER[normalizedProductType];
        if (!folderPath) {
            debugWarn(`⚠️ No folder mapping for productType: "${productTypeStr}" (normalized: "${normalizedProductType}"), using default`);
            return null;
        }
        
        const imageFiles = FOLDER_IMAGE_MAP[folderPath];
        if (!imageFiles || imageFiles.length === 0) {
            debugWarn(`⚠️ No images found for folder: ${folderPath}, using default`);
            return null;
        }
        
        // Use absolute path from site root for reliable image loading
        const basePath = `/brandedukv15-child/assets/images/customization/positions/${folderPath}`;
        const positions = {};
        
        // Embroidery-only product types (no print option)
        const EMBROIDERY_ONLY_TYPES = ['Beanies', 'Fleece'];
        // Print-only product types (no embroidery option)
        const PRINT_ONLY_TYPES = ['Safety Vests'];
        const isEmbroideryOnly = EMBROIDERY_ONLY_TYPES.includes(normalizedProductType);
        const isPrintOnly = PRINT_ONLY_TYPES.includes(normalizedProductType);
        const useApronNeutral = APRON_GARMENT_TINT_POC && normalizedProductType === 'Aprons';

        imageFiles.forEach(filename => {
            const positionInfo = FILENAME_TO_POSITION[filename];
            if (positionInfo) {
                const positionCode = positionInfo.code;
                const prices = DEFAULT_POSITION_PRICES[positionCode] || { embroidery: '5.00', print: '3.50' };
                
                positions[positionCode] = {
                    label: positionInfo.label,
                    image: useApronNeutral ? APRON_NEUTRAL_IMAGE : `${basePath}/${filename}`,
                    embroidery: isPrintOnly ? null : prices.embroidery,
                    print: isEmbroideryOnly ? null : prices.print,
                    cssClass: positionInfo.cssClass
                };
            } else {
                debugWarn(`⚠️ No position mapping for filename: ${filename} in folder ${folderPath}`);
            }
        });
        
        if (Object.keys(positions).length === 0) {
            debugWarn(`⚠️ No valid positions found for productType: "${productTypeStr}", using default`);
            return null;
        }
        
        const allStandardPositions = ['left-breast', 'right-breast', 'small-centre-front', 'large-front-center', 'large-centre-front', 'large-back', 'left-arm', 'right-arm'];
        const hidePositions = allStandardPositions.filter(pos => !positions[pos]);
        
        debugLog(`✅ Built positions from productType "${productTypeStr}" (normalized: "${normalizedProductType}") :`, Object.keys(positions));
        debugLog(`🙈 Will hide positions:`, hidePositions);
        
        return {
            imagePath: basePath,
            positions: positions,
            hidePositions: hidePositions
        };
    }
    
    function reorderPositionCardsInGrids(positionGrids, productType) {
        const normalizedForOrder = normalizeProductTypeForFolder(productType);
        const HEADWEAR_TYPES = ['Caps', 'Beanies'];
        const APRON_TYPES = ['Aprons'];
        const BAG_TYPES = ['Bags', 'Tote Bags'];

        let positionOrder;
        if (HEADWEAR_TYPES.includes(normalizedForOrder)) {
            positionOrder = ['small-centre-front', 'large-front-center', 'left-breast', 'right-breast', 'left-arm', 'right-arm', 'large-back'];
        } else if (APRON_TYPES.includes(normalizedForOrder)) {
            positionOrder = ['small-centre-front', 'left-breast', 'right-breast', 'large-front-center', 'left-arm', 'right-arm', 'large-back'];
        } else if (BAG_TYPES.includes(normalizedForOrder)) {
            positionOrder = ['small-centre-front', 'large-back', 'left-breast', 'right-breast', 'large-front-center', 'left-arm', 'right-arm'];
        } else {
            positionOrder = ['left-breast', 'right-breast', 'left-arm', 'right-arm', 'small-centre-front', 'large-front-center', 'large-back'];
        }

        positionGrids.forEach(grid => {
            const cards = Array.from(grid.querySelectorAll('.position-card'));
            cards.sort((a, b) => {
                const idxA = positionOrder.indexOf(a.dataset.position);
                const idxB = positionOrder.indexOf(b.dataset.position);
                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
            });
            cards.forEach(card => grid.appendChild(card));
        });
        debugLog('🔀 Position cards reordered for:', normalizedForOrder, positionOrder);
    }

    // Update position cards based on product type
    function updatePositionCardsForProductType(productData) {
        if (!productData) {
            debugWarn('⚠️ No product data for position update');
            return;
        }

        let productType = productData.productType || productData.category || productData.type;
        // Last-resort inference from product name/description
        if ((!productType || String(productType).trim() === '') && productData.name) {
            productType = inferProductTypeFromName(productData.name);
        }
        // If still empty, try from description
        if ((!productType || String(productType).trim() === '') && productData.description) {
            productType = inferProductTypeFromName(productData.description);
        }
        // Try to build positions dynamically from productType
        const config = buildPositionsFromProductType(productType);
        const positionGrids = document.querySelectorAll('#positionOptions, .positions-grid');
        
        if (!config) {
            reorderPositionCardsInGrids(positionGrids, productType);
            // Show static garment-preview images for enabled categories (expand one at a time)
            const STATIC_PREVIEW_TYPES = ['T-shirts', 'Short Sleeve Polos'];
            const normalizedForPreview = normalizeProductTypeForFolder(productType);
            const showPreview = STATIC_PREVIEW_TYPES.includes(normalizedForPreview);
            positionGrids.forEach(function(grid) {
                if (showPreview) grid.setAttribute('data-show-preview', '');
                else grid.removeAttribute('data-show-preview');
            });
            return; // Keep default images
        }
        // Dynamic config found — hide garment preview (images not yet loaded for this category)
        positionGrids.forEach(function(grid) { grid.removeAttribute('data-show-preview'); });
        
        positionGrids.forEach(grid => {
            const allCards = grid.querySelectorAll('.position-card');
            
            allCards.forEach(card => {
                const position = card.dataset.position;
                
                // Hide positions not available for this product type
                if (config.hidePositions && config.hidePositions.includes(position)) {
                    card.style.display = 'none';
                    return;
                }
                
                const positionConfig = config.positions[position];
                if (positionConfig) {
                    card.style.display = '';
                    
                    // Update the image
                    const img = card.querySelector('.position-placeholder');
                    if (img && positionConfig.image) {
                        const newSrc = positionConfig.image;
                        debugLog('🖼️ Setting position card image:', position, '→', newSrc);
                        setPositionCardGarmentImage(img, newSrc, productType);
                        img.alt = positionConfig.label;
                        if (position === 'right-arm') {
                            img.style.removeProperty('transform');
                            img.classList.remove('mirrored');
                        }
                        
                        img.onload = function() {
                            debugLog('✅ Image loaded OK:', newSrc);
                            if (isHoodieGarmentTintContext(productType)) {
                                syncHoodieGarmentTintMaskFromImage(img);
                            }
                        };
                        // Handle image load error - DO NOT fall back to hoodie
                        img.onerror = function() {
                            console.error('❌ Image FAILED to load:', newSrc);
                            img.onerror = null;
                        };
                    }
                    
                    // Update logo overlay CSS class for aprons
                    const logoOverlay = card.querySelector('.logo-overlay-box');
                    if (logoOverlay && positionConfig.cssClass) {
                        const allPositionClasses = ['left-chest', 'right-chest', 'front-center', 'large-front', 'large-back', 'left-sleeve', 'right-sleeve', 'apron-low-left', 'apron-low-right'];
                        allPositionClasses.forEach(cls => logoOverlay.classList.remove(cls));
                        logoOverlay.classList.add(positionConfig.cssClass);
                    }
                    
                    // Update label
                    if (positionConfig.label) {
                        const labelSpan = card.querySelector('.position-checkbox span');
                        if (labelSpan) {
                            labelSpan.textContent = positionConfig.label;
                        }
                    }
                    
                    // Update prices if different
                    if (positionConfig.embroidery === null) {
                        // Print-only product: hide EMBROIDERY button
                        card.dataset.embroidery = '';
                        const embBtn = card.querySelector('.price-emb');
                        if (embBtn) embBtn.style.display = 'none';
                    } else if (positionConfig.embroidery) {
                        card.dataset.embroidery = positionConfig.embroidery;
                        const embBtn = card.querySelector('.price-emb');
                        if (embBtn) {
                            embBtn.style.display = '';
                            const isPOA = String(positionConfig.embroidery).toUpperCase() === 'POA';
                            const value = isPOA ? 'POA' : ('£' + positionConfig.embroidery);
                            embBtn.setAttribute('data-default-price', value);
                            const valueEl = embBtn.querySelector('.price-value');
                            if (valueEl) valueEl.textContent = value;
                        }
                    }
                    if (positionConfig.print === null) {
                        // Embroidery-only product: hide PRINT button
                        card.dataset.print = '';
                        const printBtn = card.querySelector('.price-print');
                        if (printBtn) printBtn.style.display = 'none';
                    } else if (positionConfig.print) {
                        card.dataset.print = positionConfig.print;
                        const printBtn = card.querySelector('.price-print');
                        if (printBtn) {
                            printBtn.style.display = '';
                            const value = '£' + positionConfig.print;
                            printBtn.setAttribute('data-default-price', value);
                            const valueEl = printBtn.querySelector('.price-value');
                            if (valueEl) valueEl.textContent = value;
                        }
                    }
                } else {
                    // Show with default image if not in hide list
                    card.style.display = '';
                }
            });
        });
        
        debugLog('✅ Position cards updated for productType:', productType);
        reorderPositionCardsInGrids(positionGrids, productType);

        if (isApronProductContext(productType)) {
            finalizeApronGarmentTintOnCards(positionGrids);
        } else if (isHoodieGarmentTintContext(productType)) {
            finalizeHoodieGarmentTintOnCards(positionGrids);
        }

        // Hide/show PRINT legend badge based on product type
        const printKeyBadge = document.querySelector('.key-badge.print');
        const embKeyBadge = document.querySelector('.key-badge.embroidery');
        if (printKeyBadge || embKeyBadge) {
            const normalizedType = normalizeProductTypeForFolder(productType);
            const EMBROIDERY_ONLY_TYPES = ['Beanies', 'Fleece'];
            const PRINT_ONLY_TYPES = ['Safety Vests'];
            if (printKeyBadge) printKeyBadge.style.display = EMBROIDERY_ONLY_TYPES.includes(normalizedType) ? 'none' : '';
            if (embKeyBadge) embKeyBadge.style.display = PRINT_ONLY_TYPES.includes(normalizedType) ? 'none' : '';
        }
    }

    // === State ===
    const state = {
        product: {
            code: 'GD067',
            sku: 'GD067',
            name: 'Gildan Softstyle Hoodie',
            basePrice: 17.58
        },
        selectedColor: 'aquatic',
        selectedColorName: 'Aquatic',
        selectedColorImage: PRODUCT_COLORS[0].image,
        sizeQuantities: {},
        quantity: 0,
        technique: 'embroidery',
        positions: ['left-chest'],
        positionMethods: {},      // Track selected method (embroidery/print) per position
        positionCustomizations: {}, // Track customization data per position
        positionDesigns: {},      // Track design data (logo, text) per position
        vatIncluded: false,
        pricing: {
            positionPrices: {
                'left-chest': 2.50,
                'right-chest': 2.50,
                'front-center': 3.50,
                'back-large': 4.50,
                'left-sleeve': 2.00,
                'right-sleeve': 2.00
            },
            logoSetup: 25.00 // One-time logo setup fee
        },
        techniqueDescriptions: {
            'embroidery': '<strong>Embroidery</strong> creates a professional, durable finish using thread stitched directly into the fabric. Perfect for logos and text. Best for: corporate wear, uniforms, premium branding.',
            'dtg': '<strong>DTG (Direct to Garment)</strong> printing applies eco-friendly, water-based inks directly onto fabric. Ideal for vibrantly colored designs and intricate graphics with a soft feel.',
            'screen': '<strong>Screen Printing</strong> is perfect for bulk orders with limited colors. Produces vibrant, long-lasting prints at a cost-effective price for larger quantities.',
            'dtf': '<strong>DTF (Direct to Film)</strong> transfers allow for pre-printed designs to be heat-applied onto fabrics. Great for complex and photorealistic images on various materials.'
        }
    };

    // === Session Storage Keys for State Persistence ===
    const STATE_STORAGE_KEY = 'brandeduk-customize-state';
    const CUSTOMIZE_FRESH_KEY = 'customizeFreshItem';
    const CUSTOMIZE_LAST_PRODUCT_KEY = 'customizeLastProductCode';

    // === Save Customization State to SessionStorage ===
    function saveCustomizationState() {
        try {
            const stateToSave = {
                productCode: state.product?.code || '',
                positionMethods: state.positionMethods || {},
                positionCustomizations: state.positionCustomizations || {},
                positionDesigns: state.positionDesigns || {},
                positions: state.positions || [],
                selectedColor: state.selectedColor,
                selectedColorName: state.selectedColorName,
                selectedColorImage: state.selectedColorImage,
                sizeQuantities: state.sizeQuantities || {},
                quantity: state.quantity || 0,
                technique: state.technique
            };
            sessionStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(stateToSave));
            debugLog('?? Saved customization state to sessionStorage:', stateToSave);
        } catch (e) {
            debugWarn('Unable to save customization state:', e);
        }
    }

    // === Restore Customization State from SessionStorage ===
    function restoreCustomizationState() {
        try {
            const saved = sessionStorage.getItem(STATE_STORAGE_KEY);
            if (!saved) {
                debugLog('?? No saved customization state found');
                return false;
            }
            
            const savedState = JSON.parse(saved);
            debugLog('?? Restoring customization state:', savedState);
            
            // CRITICAL: When editing a specific basket item, do NOT restore position designs
            // from shared session state — the basket item's own data is loaded in Phase 2.1
            const isEditingBasketItem = sessionStorage.getItem('customizingBasketIndex') !== null;
            
            // Check if the saved state is for the SAME product
            const currentProductCode = state.product?.code || sessionStorage.getItem('selectedProduct') || '';
            const savedProductCode = savedState.productCode || '';
            const isSameProduct = savedProductCode && currentProductCode && savedProductCode === currentProductCode;
            
            // Never restore logos/positions from session — each new shop item must run the logo flow.
            // Basket logos are loaded only in Phase 2.1 when editing a specific basket line.
            if (!isEditingBasketItem) {
                state.positionMethods = {};
                state.positionCustomizations = {};
                state.positionDesigns = {};
                state.positions = [];
            } else {
                state.positionMethods = {};
                state.positionCustomizations = {};
                state.positionDesigns = {};
                state.positions = [];
                debugLog('?? Editing basket item — positions will load from basket row');
            }
            
            // CRITICAL FIX: Don't restore selectedColorImage from sessionStorage
            // It will be set from the new product's colors in loadProductFromSessionOrApi()
            // Only restore selectedColor if it matches a color in the current product
            // This prevents showing the previous product's image
            if (savedState.selectedColor && PRODUCT_COLORS.length > 0) {
                const matchingColor = PRODUCT_COLORS.find(c => c.id === savedState.selectedColor);
                if (matchingColor) {
                    state.selectedColor = matchingColor.id;
                    state.selectedColorName = matchingColor.name;
                    state.selectedColorImage = matchingColor.image;
                    debugLog('? Restored color from saved state:', matchingColor.name);
                } else {
                    debugLog('?? Saved color not found in current product, will use first color');
                }
            }
            // Note: selectedColorImage is NOT restored here - it's set from new product data
            
            const isFreshItem = sessionStorage.getItem(CUSTOMIZE_FRESH_KEY) === '1';
            if (!isEditingBasketItem && !isFreshItem && isSameProduct) {
                if (savedState.sizeQuantities) state.sizeQuantities = savedState.sizeQuantities;
                if (savedState.quantity !== undefined) state.quantity = savedState.quantity;
            } else if (!isEditingBasketItem) {
                state.sizeQuantities = {};
                state.quantity = 0;
            }
            if (savedState.technique) state.technique = savedState.technique;
            
            return true;
        } catch (e) {
            debugWarn('Unable to restore customization state:', e);
            return false;
        }
    }

    // === Restore UI from State (call after DOM is ready) ===
    function restoreUIFromState() {
        debugLog('?? Restoring UI from state...');
        debugLog('?? state.positionMethods:', JSON.stringify(state.positionMethods));
        debugLog('?? state.positionDesigns:', JSON.stringify(state.positionDesigns));
        
        // Restore position methods UI
        if (state.positionMethods && Object.keys(state.positionMethods).length > 0) {
            debugLog('?? Found', Object.keys(state.positionMethods).length, 'positions to restore');
            Object.entries(state.positionMethods).forEach(([position, method]) => {
                const card = document.querySelector(`.position-card[data-position="${position}"], .position-card input[value="${position}"]`)?.closest('.position-card');
                if (card) {
                    const checkbox = card.querySelector('input[type="checkbox"]');
                    if (checkbox && !checkbox.checked) {
                        checkbox.checked = true;
                    }
                    card.classList.add('selected');
                    
                    // Apply method UI
                    applyMethodUI(card, method);
                    
                    debugLog('? Restored position:', position, 'with method:', method);
                }
            });
        }
        
        // Restore position previews (logos)
        if (state.positionDesigns && Object.keys(state.positionDesigns).length > 0) {
            Object.entries(state.positionDesigns).forEach(([position, designData]) => {
                const card = document.querySelector(`.position-card[data-position="${position}"], .position-card input[value="${position}"]`)?.closest('.position-card');
                if (card && designData) {
                    // Show logo on product image
                    const logoOverlayBox = card.querySelector('.logo-overlay-box');
                    const logoOverlayImg = card.querySelector('.logo-overlay-img');
                    if (designData.logo && logoOverlayBox && logoOverlayImg) {
                        logoOverlayImg.src = designData.logo;
                        logoOverlayBox.hidden = false;
                    }
                    
                    // Show in preview content
                    const previewContent = card.querySelector('.position-preview-content');
                    const previewImage = card.querySelector('.preview-image');
                    if (previewContent && previewImage && designData.logo) {
                        previewImage.src = designData.logo;
                        previewImage.hidden = false;
                        previewContent.hidden = false;
                    }
                    
                    // Show pill
                    const pill = card.querySelector('.customization-pill');
                    if (pill) pill.hidden = false;
                    
                    // Transform "ADD LOGO" button to green "EDIT" when logo exists
                    if (designData.logo) {
                        const addLogoBtn = card.querySelector('.price-badge.add-logo-btn');
                        if (addLogoBtn) {
                            addLogoBtn.classList.add('logo-added');
                            addLogoBtn.innerHTML = `<span class="add-logo-text">✎ EDIT</span>`;
                        }
                    }
                    
                    debugLog('? Restored design for position:', position);
                }
            });
            applyGarmentColorToPositionPreviews();
        }
        
        // Restore size quantities
        if (state.sizeQuantities && Object.keys(state.sizeQuantities).length > 0) {
            Object.entries(state.sizeQuantities).forEach(([size, qty]) => {
                if (qty > 0) {
                    // Find or create size row
                    const sizeBtn = document.querySelector(`.size-btn[data-size="${size}"]`);
                    if (sizeBtn) {
                        sizeBtn.classList.add('selected');
                    }
                }
            });
        }
        
        // Update pricing
        updatePricingTiers();
        updatePricingSummary();
        
        debugLog('? UI restoration complete');
    }

    // === HELPERS: load product from sessionStorage or API ===
    function slugify(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }

    function isModelColorEntry(entry) {
        if (!entry || typeof entry !== 'object') return false;

        const labels = [
            entry.name,
            entry.displayName,
            entry.label,
            entry.id,
            entry.code,
            entry.color,
            entry.colour
        ].filter(Boolean).map(value => String(value).trim().toLowerCase());

        if (!labels.length) return false;

        return labels.some(label => /^(model|model shot|model image|model photo|lifestyle|lifestyle image|hero|hero image|main image|product image)$/i.test(label));
    }

    function getEntryImage(entry) {
        if (!entry || typeof entry !== 'object') return '';
        return entry.main || entry.image || entry.thumb || entry.thumbnail || entry.imageUrl || entry.url || '';
    }

    function findModelEntryImage(productData) {
        const rawEntries = productData && (productData.colors || productData.colorOptions || productData.variants);
        if (!Array.isArray(rawEntries)) return '';

        const modelEntry = rawEntries.find(isModelColorEntry);
        return getEntryImage(modelEntry);
    }

    async function loadProductFromSessionOrApi() {
        try {
            const savedProductData = sessionStorage.getItem('selectedProductData');
            const savedProductCode = sessionStorage.getItem('selectedProduct');
            let productData = null;
            let cachedData = null; // Keep cached data from shop (has model image)

            // Parse cached data first (from shop page - includes model/hero image)
            if (savedProductData) {
                try {
                    cachedData = JSON.parse(savedProductData);
                } catch (e) { /* ignore parse error */ }
            }

            // ALWAYS fetch fresh product detail from API to get complete sizes
            // Also fetch from listing endpoint for up-to-date pricing
            // Read from sessionStorage first, then fall back to URL ?code= parameter
            let productCode = savedProductCode || (cachedData ? cachedData.code : null);
            
            // Fallback: read code from URL parameter (for direct/shared links)
            if (!productCode) {
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    productCode = urlParams.get('code') || null;
                    if (productCode) {
                        debugLog('🔗 Product code from URL parameter:', productCode);
                    }
                } catch (e) { /* ignore */ }
            }
            
            if (productCode) {
                try {
                    debugLog('📦 Fetching fresh product detail from API for:', productCode);
                    // Fetch detail (full data) and listing (accurate prices) in parallel
                    const [detailRes, listingRes] = await Promise.allSettled([
                        fetch(`${API_BASE_URL}/products/${encodeURIComponent(productCode)}`),
                        fetch(`${API_BASE_URL}/products?q=${encodeURIComponent(productCode)}&limit=1`)
                    ]);

                    if (detailRes.status === 'fulfilled' && detailRes.value.ok) {
                        productData = await detailRes.value.json();
                        // CRITICAL: API detail endpoint doesn't return top-level 'image' (model shot)
                        // Preserve it from the cached shop data if available
                        if (!productData.image && cachedData && cachedData.image) {
                            productData.image = cachedData.image;
                            debugLog('🖼️ Preserved model image from shop data:', productData.image);
                        }
                        debugLog('✅ Fetched product from API:', productData.code);
                        debugLog('📐 Product sizes from API:', productData.sizes);
                        debugLog('🎨 Product colors count:', (productData.colors || []).length);
                    }

                    // Merge listing prices (more up-to-date than detail endpoint)
                    let listingProduct = null;
                    if (listingRes.status === 'fulfilled' && listingRes.value.ok) {
                        const listingData = await listingRes.value.json();
                        const items = listingData.items || listingData.products || [];
                        listingProduct = items.find(p => p.code === productCode) || items[0] || null;
                    }

                    if (productData && listingProduct) {
                        const detailPrice = Number(productData.price) || 0;
                        const listingPrice = Number(listingProduct.price) || 0;
                        if (listingPrice > 0 && listingPrice !== detailPrice) {
                            debugLog(`💰 Price correction: detail £${detailPrice} → listing £${listingPrice}`);
                            productData.price = listingProduct.price;
                            productData.basePrice = listingProduct.price;
                        }
                        if (listingProduct.priceBreaks && listingProduct.priceBreaks.length > 0) {
                            productData.priceBreaks = listingProduct.priceBreaks;
                        }
                        // For direct links: use listing image if detail has no model image
                        if (!productData.image && listingProduct.image) {
                            productData.image = listingProduct.image;
                        }
                    } else if (!productData && listingProduct) {
                        productData = listingProduct;
                        if (!productData.image && cachedData && cachedData.image) {
                            productData.image = cachedData.image;
                        }
                        // Use listing image as main image for direct links (no cached shop data)
                        if (!productData.image && listingProduct.image) {
                            productData.image = listingProduct.image;
                        }
                        debugWarn('⚠️ Using listing data (detail endpoint failed)');
                    }

                    if (productData) {
                        if (cachedData) {
                            if (cachedData.color) productData.color = cachedData.color;
                            if (cachedData.colorHex) productData.colorHex = cachedData.colorHex;
                            if (!productData.productType && cachedData.productType) productData.productType = cachedData.productType;
                        }
                        // Update cache with complete data
                        sessionStorage.setItem('selectedProductData', JSON.stringify(productData));
                    } else {
                        debugWarn('Product API returned error - falling back to cached data');
                    }
                } catch (e) {
                    debugWarn('Failed to fetch product from API, using cached data if available', e);
                }
            }

            // Fallback to cached data only if API fetch failed
            if (!productData && cachedData) {
                productData = cachedData;
                debugLog('⚠️ Using cached product data (API unavailable):', productData.code);
            }

            if (!productData) {
                // No product data available — leave default state (fallback product)
                debugWarn('?? No product data available, using fallback');
                return false;
            }

            // IMPORTANT: Clear old PRODUCT_COLORS before loading new product
            // This prevents showing images from previous products
            PRODUCT_COLORS = [];

            // CRITICAL: Clear old selectedColorImage to prevent showing previous product's image
            // This is the root cause of the issue - old image persists until color is clicked
            state.selectedColor = null;
            state.selectedColorName = null;
            state.selectedColorImage = null;
            debugLog('?? Cleared old color selection to prevent showing previous product image');

            // Map productData into our state
            // Update URL with product code so the link is shareable
            const finalCode = productData.code || productData.productCode || productData.sku || productData.id;
            if (finalCode) {
                const url = new URL(window.location);
                if (url.searchParams.get('code') !== finalCode) {
                    url.searchParams.set('code', finalCode);
                    history.replaceState(null, '', url);
                }
            }

            state.product = state.product || {};
            const prevProductCode = state.product.code || '';
            state.product.code = finalCode || state.product.code;
            if (prevProductCode && finalCode && prevProductCode !== finalCode) {
                clearPositionState();
                debugLog('🧹 Cleared position state — switched product', prevProductCode, '→', finalCode);
            }
            state.product.sku = productData.sku || productData.code || productData.productCode || productData.id || state.product.sku;
            state.product.name = productData.name || productData.title || productData.productName || productData.displayName || state.product.name;
            state.product.basePrice = Number(productData.price || productData.basePrice || productData.startPrice || productData.startingPrice) || state.product.basePrice;
            state.product.brand = productData.brand || productData.brand_name || state.product.brand;
            state.product.sizes = normalizeProductSizesFromApi(productData);
            state.product.weight = productData.weight || (productData.details && productData.details.weight) || '';
            state.product.fabric = productData.fabric || (productData.details && productData.details.fabric) || '';
            state.product.description = productData.description || (productData.details && productData.details.description) || '';
            state.product.productType = productData.productType || productData.category || productData.type || inferProductTypeFromName(productData.name || '') || '';
            if (!productData.image) {
                const modelEntryImage = findModelEntryImage(productData);
                if (modelEntryImage) {
                    productData.image = modelEntryImage;
                    debugLog('🖼️ Using model entry image as product hero:', modelEntryImage);
                }
            }
            state.product.image = productData.image || ''; // Top-level product image (model/hero shot)
            state.product.rawData = productData; // Store full product data for reference
            debugLog('🔍 PRODUCT IMAGE DEBUG:', { topLevelImage: productData.image, firstColorMain: (productData.colors && productData.colors[0]) ? productData.colors[0].main : 'no colors', sameImage: productData.image === ((productData.colors && productData.colors[0]) ? productData.colors[0].main : null) });

            // Map colors (if present) into PRODUCT_COLORS format
            const colorsSource = productData.colors || productData.colorOptions || productData.variants || [];
            const colorEntries = Array.isArray(colorsSource)
                ? colorsSource.filter(c => !isModelColorEntry(c))
                : [];
            const removedModelEntries = Array.isArray(colorsSource) ? colorsSource.length - colorEntries.length : 0;
            if (removedModelEntries > 0) {
                debugLog('🧹 Removed non-color model entries from color options:', removedModelEntries);
            }

            if (colorEntries.length > 0) {
                debugLog('?? Mapping', colorEntries.length, 'colors from product data...');
                PRODUCT_COLORS = colorEntries.map((c, index) => {
                    const name = c.name || c.displayName || c.label || c.id || `Color ${index + 1}`;
                    // Color swatches must use variant imagery only. The model/hero image is
                    // reserved for the main product image and must not become a color.
                    const colorImage = c.main || c.image || c.thumb || c.imageUrl || c.url || '';
                    const colorThumb = c.thumb || c.thumbnail || c.main || c.image || colorImage;
                    
                    debugLog(`  Color ${index + 1}: ${name} - Image: ${colorImage ? '?' : '?'}`);
                    
                    const code = state.product && state.product.code ? state.product.code : '';
                    const resolvedHex = window.BrandedColorHex && typeof BrandedColorHex.resolveForEntry === 'function'
                        ? BrandedColorHex.resolveForEntry(c, code)
                        : (function () {
                            const rawHex = c.hex || c.colourHex || c.colorHex || '';
                            const parsedHex = window.BrandedColorHex
                                ? BrandedColorHex.parseHex(rawHex)
                                : '';
                            return parsedHex || (window.BrandedColorHex
                                ? (BrandedColorHex.lookup(name, code, colorThumb || colorImage) || '')
                                : '');
                        })();
                    return {
                        id: slugify(name) || slugify(c.code || c.id || name) || `color-${index}`,
                        name: name,
                        hex: resolvedHex || '',
                        image: colorImage,
                        thumb: colorThumb // Store thumb separately for thumbnails
                    };
                });
                debugLog('? PRODUCT_COLORS updated with', PRODUCT_COLORS.length, 'colors');
                if (window.BrandedColorHex && state.product && state.product.code) {
                    window.BrandedColorHex.registerProductColors(state.product.code, PRODUCT_COLORS);
                }
                hydrateProductColorHexFromSwatches();

                // CRITICAL FIX: Set the first color as default for the new product
                // This ensures the main image shows the correct product immediately
                if (PRODUCT_COLORS.length > 0) {
                    state.selectedColor = PRODUCT_COLORS[0].id;
                    state.selectedColorName = PRODUCT_COLORS[0].name;
                    state.selectedColorImage = PRODUCT_COLORS[0].image;
                    debugLog('? Set default color to first available:', PRODUCT_COLORS[0].name, 'Image:', PRODUCT_COLORS[0].image);
                }
            } else {
                debugWarn('?? No colors found in product data, using fallback');
                // If no colors, create a single color from the main product image
                if (productData.image) {
                    PRODUCT_COLORS = [{
                        id: 'default',
                        name: 'Default',
                        hex: '#cccccc',
                        image: productData.image,
                        thumb: productData.image
                    }];
                    // Set default color
                    state.selectedColor = 'default';
                    state.selectedColorName = 'Default';
                    state.selectedColorImage = productData.image;
                    debugLog('? Set default color from product image:', productData.image);
                }
            }

            // Store priceBreaks DIRECTLY from API - no modifications
            state.product.priceBreaks = productData.priceBreaks || productData.tiers || productData.discounts || [];
            
            // Map pricing tiers if present (for backward compatibility)
            const breaks = state.product.priceBreaks;
            if (Array.isArray(breaks) && breaks.length > 0) {
                PRICING_RULES = PRICING_RULES || {};
                PRICING_RULES[state.product.code] = {
                    basePrice: state.product.basePrice,
                    tiers: breaks.slice().sort((a,b) => (b.min || 0) - (a.min || 0)).map(pb => ({ min: pb.min || pb.from || 0, price: pb.price || pb.unitPrice || pb.rate || 0 }))
                };
            }

            return true;
        } catch (e) {
            debugWarn('Unexpected error loading product:', e);
            return false;
        }
    }

    // Update visible product DOM elements after dynamic load
    function refreshProductDOM() {
        try {
            // On opened product page, never show bestseller badge over hero image.
            const bestsellerBadge = document.getElementById('bestsellerBadge');
            if (bestsellerBadge) {
                bestsellerBadge.style.display = 'none';
            }

            // Title and SKU
            const titleEl = document.querySelector('.product-title');
            const skuEl = document.querySelector('.product-sku');
            if (titleEl) titleEl.textContent = state.product?.name || titleEl.textContent;
            if (skuEl) {
                let brandName = state.product?.brand || state.product?.name?.split(' ')[0] || '';
                // Hide excluded brands
                const _EXCL_CZ = ['absolute', 'ralawise'];
                if (_EXCL_CZ.some(b => brandName.toLowerCase().includes(b))) brandName = '';
                skuEl.textContent = `#${state.product?.code || ''}${brandName ? ' ' + brandName : ''}`;
            }

            // Main image - use model/hero image from API as default (product.image),
            // fallback to per-color flat image only if model image is unavailable
            const mainImg = document.getElementById('mainImage');
            if (mainImg) {
                const modelImage = state.product?.image || state.product?.rawData?.image || '';
                const flatImage = state.selectedColorImage || (PRODUCT_COLORS && PRODUCT_COLORS[0] && PRODUCT_COLORS[0].image) || '';
                const imgSrc = modelImage || flatImage || state.product?.photo || '';
                debugLog('🖼️ refreshProductDOM image selection:', { modelImage, flatImage, chosen: imgSrc });
                if (imgSrc) {
                    // Force reload by clearing src first, then setting new src with cache buster
                    mainImg.src = '';
                    mainImg.src = imgSrc + (imgSrc.includes('?') ? '&' : '?') + '_t=' + Date.now();
                    // Also update alt text
                    if (state.product?.name) {
                        mainImg.alt = state.product.name;
                    }
                }
            }
            
            // CRITICAL: Ensure main logo overlay is hidden when loading a new product
            // Logos should only appear in customization section, not on main product thumbnail
            const mainLogoOverlayBox = document.getElementById('logoOverlayBox');
            const mainLogoOverlayImg = document.getElementById('logoOverlayImg');
            if (mainLogoOverlayBox) {
                mainLogoOverlayBox.hidden = true;
                mainLogoOverlayBox.classList.remove('active');
            }
            if (mainLogoOverlayImg) {
                mainLogoOverlayImg.src = '';
            }
            
            // Update gallery thumbnails - show different color images
            renderColorThumbnails();

            // Color count
            const colorCount = document.querySelector('.color-count');
            if (colorCount) colorCount.textContent = `${PRODUCT_COLORS.length} colors`;

            // Product specs (S-5XL, Colors, Weight, etc.)
            const specsContainer = document.querySelector('.product-specs');
            if (specsContainer && state.product) {
                const specs = [];
                
                // Sizes
                if (state.product.sizes && Array.isArray(state.product.sizes) && state.product.sizes.length > 0) {
                    const sizes = state.product.sizes;
                    if (sizes.length === 1) {
                        specs.push(sizes[0]);
                    } else if (sizes.length === 2) {
                        specs.push(`${sizes[0]}-${sizes[1]}`);
                    } else {
                        // Format as "S-5XL" or list first and last
                        const first = sizes[0];
                        const last = sizes[sizes.length - 1];
                        specs.push(`${first}-${last}`);
                    }
                } else {
                    specs.push('S-5XL'); // Fallback
                }
                
                // Colors count
                specs.push(`${PRODUCT_COLORS.length} Colors`);
                
                // Weight/GSM - try to extract numeric value and format
                if (state.product.weight) {
                    const weightStr = String(state.product.weight);
                    // Try to extract number from weight string (e.g., "251-300gsm" -> "251-300gsm" or "276" -> "276 gsm")
                    if (weightStr.match(/\d/)) {
                        specs.push(weightStr.includes('gsm') ? weightStr : `${weightStr} gsm`);
                    } else {
                        specs.push(weightStr);
                    }
                } else {
                    specs.push('276 gsm'); // Fallback
                }
                
                // Convert GSM to oz (approximate: 1 oz — 28.35 g)
                // Try to extract numeric GSM value for conversion
                const weightValue = state.product.weight || '276';
                const gsmMatch = String(weightValue).match(/(\d+)/);
                if (gsmMatch) {
                    const gsm = parseFloat(gsmMatch[1]);
                    if (!isNaN(gsm)) {
                        const oz = (gsm / 28.35).toFixed(1);
                        specs.push(`${oz} oz`);
                    } else {
                        specs.push('8.0 oz'); // Fallback
                    }
                } else {
                    specs.push('8.0 oz'); // Fallback
                }
                
                // Update the specs HTML
                specsContainer.innerHTML = specs.map((spec, index) => {
                    return `<span class="spec">${spec}</span>${index < specs.length - 1 ? '<span class="spec-divider">|</span>' : ''}`;
                }).join('');
            }

            // Pricing tiers UI will be rebuilt elsewhere, but update title
            if (state.product && state.product.name) {
                document.title = `${state.product.name} - Branded UK`;

                // Update shared breadcrumbs (breadcrumbs.js)
                const category = state.product.productType || 'Shop';
                if (typeof updateBreadcrumbCategory === 'function') updateBreadcrumbCategory(category);
                if (state.product.code && typeof updateBreadcrumbProduct === 'function') {
                    updateBreadcrumbProduct(state.product.code);
                }
            }

            // === Populate START FROM price (lowest tier) ===
            const mainPriceEl = document.getElementById('productMainPrice');
            if (mainPriceEl && state.product?.priceBreaks?.length > 0) {
                const lowestTier = state.product.priceBreaks.reduce((min, t) => 
                    (t.price < min.price) ? t : min, state.product.priceBreaks[0]);
                const vatOn = localStorage.getItem('brandeduk-vat-mode') === 'on';
                const price = vatOn ? (lowestTier.price * 1.2) : lowestTier.price;
                const priceFormatted = '£' + price.toFixed(2);
                const priceEl = mainPriceEl.querySelector('.start-from-price');
                if (priceEl) priceEl.textContent = priceFormatted;
                const vatEl = mainPriceEl.querySelector('.start-from-vat');
                if (vatEl) vatEl.textContent = vatOn ? 'inc VAT' : 'ex VAT';
            }

            // === Brand Logo (local files) ===
            const brandLogoEl = document.getElementById('brandLogoHero') || document.getElementById('brandLogoCustomize');
            const brandBoxEl = document.getElementById('productBrandBox');
            if (brandLogoEl && state.product?.brand) {
                const BRAND_LOGO_MAP = {
                    '2786': '27862020.webp',
                    'adidas®': 'adidas.jpg',
                    'afd by dennys': 'add-it-on2020.jpg',
                    'anthem': 'anthem-logo.jpg',
                    'asquith & fox': 'asquithfox2020.jpg',
                    'atlantis': null,
                    'awdis': 'awdis.webp',
                    'awdis academy': 'awdisacademy2020.webp',
                    'awdis ecologie': 'awdisecologie2020.jpg',
                    'awdis just cool': 'awdisjustcool2020.webp',
                    'awdis just hoods': 'awdisjusthoods2020.webp',
                    "awdis just polo's": 'awdisjustpolos2020.jpg',
                    "awdis just t's": 'awdisjustts2020.webp',
                    'awdis so denim': 'awdissodenim2020.jpg',
                    'absolute apparel': null,
                    'b&c collection': 'bccollp23.png',
                    'babybugz': 'babybugz2020.jpg',
                    'bagbase': 'bagbase.jpeg',
                    'beechfield': 'beechfield.jpeg',
                    'bella canvas': 'bellapluscanvas.svg',
                    'bonchef': null,
                    'build your brand': 'build-your-brand.png',
                    'build your brand basic': 'build-your-brand-basic-logo-web-2021.jpg',
                    'build your brandit': 'build-your-brandit-logo.jpeg',
                    'callaway': 'callaway2020.jpg',
                    'casual classics': null,
                    'colortone': 'colortone2020.webp',
                    'comfort colors®': 'comfort-colors.webp',
                    'comfy co': null,
                    'craghoppers': 'craghoppers.jpg',
                    'dennys': null,
                    'essentials': 'everydayessentials2020.jpg',
                    'finden & hales': 'finden-and-hales.png',
                    'flexfit by yupoong': 'flexfit.webp',
                    'front row': 'front-row.jpg',
                    'fruit of the loom': 'fruit-of-the-loom.jpg',
                    'gildan': 'gildan2020.webp',
                    'gildan hammer': 'gildan2020.webp',
                    'henbury': 'henbury2020.webp',
                    'home & living': 'web-logo-homeandliving-2023.webp',
                    'jack wolfskin': null,
                    'jerzees': null,
                    'kariban': 'kariban2020.webp',
                    'kariban proact': 'proact.jpg',
                    'kimood': 'kimood2020.jpg',
                    'korntex': null,
                    'kustom kit': 'kustom-kit2020.webp',
                    'larkwood': 'larkwood.jpeg',
                    'maddins': 'maddins2020.jpg',
                    'madeira': 'web-logo-madeira-2022.jpg',
                    'mumbles': 'mumbles2020.webp',
                    'new era': null,
                    'new morning studios': 'web-logo-new-morning-studios.png',
                    'next level apparel': null,
                    'nike': 'nike2020.jpg',
                    'nimbus': 'nimbus2020.webp',
                    'nutshell®': 'nutshell-bag2020.webp',
                    'ogio': 'ogio2020.webp',
                    'onna by premier': 'web-logo-onna-by-premier-2023.jpg',
                    'portwest': 'portwest.webp',
                    'premier': 'premier2020.webp',
                    'prortx': 'pro-rtx2020.jpg',
                    'prortx high visibility': 'pro-rtx-hv2020.jpg',
                    'quadra': 'quadra-2020.webp',
                    'regatta high visibility': 'regattaprofessional-highv2020.webp',
                    'regatta honestly made': 'regattaprofessional-hones2020.jpg',
                    'regatta junior': 'regattaprofessional-junio2020.jpg',
                    'regatta professional': 'regatta-professional2020.webp',
                    'regatta safety footwear': 'regattaprofessional-safet2020.jpg',
                    'result': 'result2020.webp',
                    'result core': 'resultcorevalue2020.webp',
                    'result genuine recycled': null,
                    'result headwear': 'resultheadwear2020.webp',
                    'result safeguard': 'result-safe-guard-2026.webp',
                    'result urban outdoor': 'resulturbanoutdoorwear2020.webp',
                    'result winter essentials': 'resultwinteressentials2020.webp',
                    'result workguard': 'result-workguard-2026.webp',
                    'rhino': 'rhino2020.jpg',
                    'ribbon': 'brand-logo-ribbon.jpg',
                    'russell athletic': 'russel-athletic-2026.webp',
                    'russell athletic collection': 'russel-athletic-collection-2026.webp',
                    'russell collection': 'russell.webp',
                    'russell europe': 'russell.webp',
                    'scruffs': 'web-logo-scruffs-2023.jpg',
                    'sf': 'sf-clothing.webp',
                    'spiro': 'spiro2022.webp',
                    'spiro recycled': 'web-logo-spiro-recycled.png',
                    'splashmacs': 'splashmacs2020.jpg',
                    'stanley workwear': 'stanley-logo.jpg',
                    'stanley/stella': 'stanley-stella.webp',
                    'stedman': null,
                    'stormtech': 'stormtech.webp',
                    'tee jays': 'tee-jays.jpg',
                    'tombo': 'tombo2020.webp',
                    'towel city': 'towel-city2020.jpg',
                    'tridri®': 'web-logo-tridri-2025.webp',
                    'under armour': 'under-armour.webp',
                    'under armour golf': 'under-armour.webp',
                    'uneek clothing': null,
                    'westford mill': 'westford-mill-2020.webp',
                    'wombat': 'wombat-logo.jpg',
                    'yoko': 'yoko.webp'
                };
                const rawBrandKey = String(state.product.brand || '').toLowerCase().trim();
                const normalizedBrandKey = rawBrandKey
                    .replace(/[®™]/g, '')
                    .replace(/[+&/]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                const logoFile = BRAND_LOGO_MAP[rawBrandKey] || BRAND_LOGO_MAP[normalizedBrandKey];
                if (logoFile) {
                    const basePath = window.location.pathname.includes('/mobile/') 
                        ? '../brandedukv15-child/assets/images/brands/' 
                        : 'brandedukv15-child/assets/images/brands/';
                    brandLogoEl.src = basePath + logoFile;
                    brandLogoEl.alt = state.product.brand;
                    brandLogoEl.style.display = '';
                    if (brandBoxEl) brandBoxEl.hidden = false;
                    brandLogoEl.onerror = function () {
                        this.style.display = 'none';
                        if (brandBoxEl) brandBoxEl.hidden = true;
                    };
                } else {
                    brandLogoEl.style.display = 'none';
                    if (brandBoxEl) brandBoxEl.hidden = true;
                }
            } else if (brandBoxEl) {
                brandBoxEl.hidden = true;
            }

            // === Specs Table (Fabric, Weight, Size) ===
            const specsTableEl = document.getElementById('productSpecsTableCustomize');
            if (specsTableEl && state.product) {
                const rows = [];
                if (state.product.fabric) {
                    rows.push({ label: 'Fabric', value: state.product.fabric });
                }
                if (state.product.weight) {
                    rows.push({ label: 'Weight', value: state.product.weight });
                }
                if (state.product.sizes && Array.isArray(state.product.sizes) && state.product.sizes.length > 0) {
                    rows.push({ label: 'Size', value: state.product.sizes.join(', ') });
                }
                if (rows.length > 0) {
                    let html = '<table>';
                    rows.forEach(r => {
                        html += `<tr><td class="spec-label">${r.label}</td><td class="spec-value">${r.value}</td></tr>`;
                    });
                    html += '</table>';
                    specsTableEl.innerHTML = html;
                    specsTableEl.style.display = '';
                }
            }

            // === Manufacturer Code (tablet) ===
            const mfrCodeEl = document.getElementById('mfrCode');
            if (mfrCodeEl && state.product && state.product.code) {
                mfrCodeEl.textContent = state.product.code;
            }

            // === Key Info — separate section with Read More (tablet) ===
            const keyInfoSection = document.getElementById('ralaKeyInfoCust');
            const keyInfoText = document.getElementById('ralaKeyInfoText');
            const readMoreBtn = document.getElementById('ralaReadMoreCust');
            if (keyInfoSection && keyInfoText && state.product && state.product.description) {
                keyInfoText.textContent = state.product.description;
                // Read More toggle
                if (readMoreBtn && !readMoreBtn._bound) {
                    readMoreBtn._bound = true;
                    readMoreBtn.addEventListener('click', function() {
                        const clamped = keyInfoText.classList.contains('rala-key-info-cust__text--clamped');
                        if (clamped) {
                            keyInfoText.classList.remove('rala-key-info-cust__text--clamped');
                            keyInfoText.classList.add('rala-key-info-cust__text--expanded');
                            readMoreBtn.textContent = 'Read less';
                        } else {
                            keyInfoText.classList.add('rala-key-info-cust__text--clamped');
                            keyInfoText.classList.remove('rala-key-info-cust__text--expanded');
                            readMoreBtn.textContent = 'Read more';
                        }
                    });
                }
            }
        } catch (e) {
            debugWarn('Failed to refresh product DOM', e);
        }
    }

    // === Setup State Persistence (save on page leave) ===
    function setupStatePersistence() {
        // Save state when navigating away
        window.addEventListener('pagehide', () => {
            saveCustomizationState();
        });
        
        window.addEventListener('beforeunload', () => {
            saveCustomizationState();
        });
        
        // Also save periodically when state changes (debounced)
        debugLog('?? State persistence setup complete');
    }

    // === VAT Helper Functions ===
    function isVatOn() {
        try {
            return localStorage.getItem(VAT_STORAGE_KEY) === 'on';
        } catch (e) {
            return false;
        }
    }

    function setVatState(isOn) {
        try {
            localStorage.setItem(VAT_STORAGE_KEY, isOn ? 'on' : 'off');
        } catch (e) {
            debugWarn('Unable to persist VAT state');
        }
        state.vatIncluded = isOn;
        updateVatToggleUI();
        updatePricingSummary();
        updatePricingTiers();
    }

    function toggleVat() {
        setVatState(!isVatOn());
    }

    function formatCurrency(baseAmount, options = {}) {
        // Default to current VAT toggle state unless explicitly overridden
        const includeVat = options.includeVat !== undefined ? options.includeVat : isVatOn();
        let value = Number(baseAmount) || 0;
        
        if (includeVat && isVatOn()) {
            value = value * (1 + VAT_RATE);
        }
        
        const currency = options.currency || '£';
        const decimals = options.decimals !== undefined ? options.decimals : 2;
        return currency + value.toFixed(decimals);
    }

    function vatSuffix() {
        return isVatOn() ? 'inc VAT' : 'ex VAT';
    }

    function updateVatToggleUI() {
        const btn = document.getElementById('vatToggleBtn');
        const container = document.getElementById('vatToggleContainer');
        const vatStatus = document.getElementById('vatStatus');
        
        if (btn) {
            const isOn = isVatOn();
            btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
            btn.classList.toggle('is-on', isOn);
            container?.classList.toggle('is-on', isOn);
            
            if (vatStatus) {
                vatStatus.textContent = isOn ? 'inc VAT' : 'ex VAT';
            }
        }
    }

    // === Pricing Functions ===
    
    // Get quantity of same product already in basket (for cumulative discount)
    function getBasketQuantityForProduct(productCode) {
        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            let basketQty = 0;
            
            basket.forEach(item => {
                const itemCode = item.productCode || item.code;
                if (itemCode === productCode) {
                    // Support both old format (quantity) and new format (totalQty)
                    if (item.quantities && typeof item.quantities === 'object') {
                        Object.values(item.quantities).forEach(qty => {
                            basketQty += parseInt(qty) || 0;
                        });
                    } else if (item.totalQty) {
                        basketQty += parseInt(item.totalQty) || 0;
                    } else if (item.quantity) {
                        basketQty += parseInt(item.quantity) || 0;
                    }
                }
            });
            
            return basketQty;
        } catch (e) {
            console.error('Error reading basket for cumulative discount:', e);
            return 0;
        }
    }
    
    // Get total quantity for discount calculation (current selection + basket items of same product)
    function getTotalQuantityForDiscount() {
        const currentQty = state.quantity || 0;
        const basketQty = getBasketQuantityForProduct(state.product.code);
        return currentQty + basketQty;
    }
    
    function getDiscountedUnitPrice(qty) {
        const rule = PRICING_RULES[state.product.code];
        if (!rule) return state.product.basePrice;
        
        // Use cumulative quantity (current + basket) for tier calculation
        const basketQty = getBasketQuantityForProduct(state.product.code);
        const totalQty = qty + basketQty;
        
        const basePrice = rule.basePrice;
        for (const tier of rule.tiers) {
            if (totalQty >= tier.min) {
                return tier.price;
            }
        }
        return basePrice;
    }

    // Alias for getDiscountedUnitPrice (used by order card and subtotal calculations)
    function getUnitPrice(qty) {
        return getDiscountedUnitPrice(qty);
    }

    function getDiscountPercentage(qty) {
        const basePrice = PRICING_RULES[state.product.code]?.basePrice || state.product.basePrice;
        const currentPrice = getDiscountedUnitPrice(qty);
        if (currentPrice >= basePrice) return 0;
        return Math.round(((basePrice - currentPrice) / basePrice) * 100);
    }

    function getCurrentTier() {
        // Use cumulative quantity (current selection + basket items of same product)
        const currentQty = state.quantity;
        const basketQty = getBasketQuantityForProduct(state.product.code);
        const totalQty = currentQty + basketQty;
        
        const tiers = [
            { min: 1, max: 9, label: '1-9' },
            { min: 10, max: 24, label: '10-24' },
            { min: 25, max: 49, label: '25-49' },
            { min: 50, max: 99, label: '50-99' },
            { min: 100, max: 249, label: '100-249' },
            { min: 250, max: Infinity, label: '250+' }
        ];
        
        for (let i = tiers.length - 1; i >= 0; i--) {
            if (totalQty >= tiers[i].min) {
                return { ...tiers[i], discount: getDiscountPercentage(currentQty) };
            }
        }
        return tiers[0];
    }

    // === DOM Elements ===
    const elements = {
        // Color selection
        colorOptions: document.getElementById('colorOptions'),
        selectedColor: document.getElementById('selectedColor'),
        
        // Size selection
        sizeOptions: document.getElementById('sizeOptions'),
        
        // Quantity
        qtyInput: document.getElementById('qtyInput'),
        qtyMinus: document.getElementById('qtyMinus'),
        qtyPlus: document.getElementById('qtyPlus'),
        
        // Pricing
        pricingTiers: document.getElementById('pricingTiers'),
        
        // Technique
        techniqueOptions: document.getElementById('techniqueOptions'),
        techniqueDesc: document.getElementById('techniqueDesc'),
        
        // Positions
        positionOptions: document.getElementById('positionOptions'),
        
        // Gallery
        mainImage: document.getElementById('mainImage'),
        galleryThumbs: document.querySelectorAll('.gallery-thumbs .thumb'),
        
        // Summary
        priceSummary: document.getElementById('priceSummary'),
        
        // Action bar
        designNowBtn: document.getElementById('designNowBtn'),
        addToBasketBtn: document.getElementById('addToBasketBtn'),
        
        // Modals
        sizeGuideBtn: document.getElementById('sizeGuideBtn'),
        sizeGuideModal: document.getElementById('sizeGuideModal'),
        closeSizeGuide: document.getElementById('closeSizeGuide'),
        designEditorModal: document.getElementById('designEditorModal'),
        closeEditor: document.getElementById('closeEditor'),
        doneDesign: document.getElementById('doneDesign'),
        
        // Editor tools
        logoUpload: document.getElementById('logoUpload'),
        uploadPreview: document.getElementById('uploadPreview'),
        previewImage: document.getElementById('previewImage')
    };

    // === Image Compression & LocalStorage Helpers ===
    function compressBase64Image(base64, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Scale down if too large
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Detect transparency: if source is PNG, keep PNG format to preserve alpha
                const isPNG = base64.startsWith('data:image/png');
                if (isPNG) {
                    // Clear canvas (transparent) before drawing
                    ctx.clearRect(0, 0, width, height);
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                // Keep PNG for transparent images, use JPEG for others (smaller)
                const compressed = isPNG
                    ? canvas.toDataURL('image/png')
                    : canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = base64;
        });
    }

    async function compressItemImages(item) {
        // Compress main image
        if (item.colorImage && item.colorImage.startsWith('data:')) {
            try {
                item.colorImage = await compressBase64Image(item.colorImage);
            } catch (e) {
                debugWarn('Failed to compress colorImage:', e);
            }
        }
        
        // Compress customization images
        if (item.customizations && Array.isArray(item.customizations)) {
            for (let custom of item.customizations) {
                if (custom.content && custom.content.startsWith('data:')) {
                    try {
                        custom.content = await compressBase64Image(custom.content);
                    } catch (e) {
                        debugWarn('Failed to compress customization image:', e);
                    }
                }
            }
        }
        
        // Compress position designs
        if (item.positionDesigns) {
            for (let [key, design] of Object.entries(item.positionDesigns)) {
                if (design.logo && design.logo.startsWith('data:')) {
                    try {
                        design.logo = await compressBase64Image(design.logo);
                    } catch (e) {
                        debugWarn('Failed to compress position design:', e);
                    }
                }
            }
        }
        
        return item;
    }

    function getLocalStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += (localStorage[key].length + key.length) * 2; // UTF-16 = 2 bytes per char
            }
        }
        return total;
    }

    async function cleanupLocalStorageIfNeeded() {
        const sizeBytes = getLocalStorageSize();
        const sizeMB = sizeBytes / 1024 / 1024;
        
        debugLog(`?? LocalStorage size: ${sizeMB.toFixed(2)} MB`);
        
        // If over 1MB, compress basket images
        if (sizeMB > 1) {
            debugLog('?? LocalStorage over 1MB, compressing basket images...');
            try {
                let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                for (let i = 0; i < basket.length; i++) {
                    basket[i] = await compressItemImages(basket[i]);
                }
                localStorage.setItem('quoteBasket', JSON.stringify(basket));
                debugLog('? Basket images compressed');
            } catch (e) {
                console.error('Failed to compress basket:', e);
            }
        }
        
        // If over 3MB, show warning
        if (sizeMB > 3) {
            showToast('Storage is getting full. Consider completing your quote soon.');
        }
    }

    // === Positions-Only Popup Mode ===
    // When opened from basket "Add Logo" button, hide everything except position cards
    function applyPositionsOnlyMode() {
        debugLog('🎯 Positions-Only mode activated');

        // Show the positions section (hidden by default in HTML)
        const posSection = document.getElementById('positionsSection');
        const posTitle = document.getElementById('positionsSectionTitle');
        if (posSection) posSection.style.display = '';
        if (posTitle) posTitle.style.display = '';

        // ── POSITION CARD FILTERING via CSS !important ──
        // Read product type from sessionStorage (set by basket.html before opening iframe).
        // Inject CSS rules with !important to GUARANTEE correct card visibility.
        // No JS from any script can override !important CSS.
        let _productType = '';
        try {
            const _sd = sessionStorage.getItem('selectedProductData');
            if (_sd) {
                const _pd = JSON.parse(_sd);
                _productType = _pd.productType || '';
                if (!_productType) _productType = inferProductTypeFromName(_pd.name || '');
                if (!_productType) _productType = inferProductTypeFromName(_pd.description || '');
            }
        } catch(e) { /* ignore */ }

        const _normalizedType = normalizeProductTypeForFolder(_productType);
        const _folderPath = PRODUCT_TYPE_TO_FOLDER[_normalizedType];
        let _positionFilterCSS = '';
        let _availablePositions = new Set();

        if (_folderPath) {
            const _imageFiles = FOLDER_IMAGE_MAP[_folderPath] || [];
            _imageFiles.forEach(fn => {
                const pi = FILENAME_TO_POSITION[fn];
                if (pi) _availablePositions.add(pi.code);
            });

            const _allPositions = ['left-breast', 'right-breast', 'small-centre-front', 'large-front-center', 'large-centre-front', 'large-back', 'left-arm', 'right-arm'];
            const _hidePositions = _allPositions.filter(p => !_availablePositions.has(p));

            if (_hidePositions.length > 0) {
                _positionFilterCSS = _hidePositions.map(p =>
                    `.position-card[data-position="${p}"]`
                ).join(',\n') + ' { display: none !important; }';
            }

            debugLog('🎯 Product type:', _normalizedType, '| Available positions:', [..._availablePositions], '| Hiding:', _hidePositions.length, 'cards');

            // === Reorder position cards based on product type ===
            const HEADWEAR_TYPES = ['Caps', 'Beanies'];
            const APRON_TYPES = ['Aprons'];
            const BAG_TYPES = ['Bags', 'Tote Bags'];
            let _positionOrder;
            if (HEADWEAR_TYPES.includes(_normalizedType)) {
                _positionOrder = ['small-centre-front', 'large-front-center', 'left-breast', 'right-breast', 'left-arm', 'right-arm', 'large-back'];
            } else if (APRON_TYPES.includes(_normalizedType)) {
                _positionOrder = ['small-centre-front', 'left-breast', 'right-breast', 'large-front-center', 'left-arm', 'right-arm', 'large-back'];
            } else if (BAG_TYPES.includes(_normalizedType)) {
                _positionOrder = ['small-centre-front', 'large-back', 'left-breast', 'right-breast', 'large-front-center', 'left-arm', 'right-arm'];
            } else {
                _positionOrder = ['left-breast', 'right-breast', 'left-arm', 'right-arm', 'small-centre-front', 'large-front-center', 'large-back'];
            }
            document.querySelectorAll('#positionOptions, .positions-grid').forEach(grid => {
                const cards = Array.from(grid.querySelectorAll('.position-card'));
                cards.sort((a, b) => {
                    const idxA = _positionOrder.indexOf(a.dataset.position);
                    const idxB = _positionOrder.indexOf(b.dataset.position);
                    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
                });
                cards.forEach(card => grid.appendChild(card));
            });
            debugLog('🔀 [positionsOnly] Reordered position cards for:', _normalizedType);

            // Also update images immediately for available positions
            const _basePath = `/brandedukv15-child/assets/images/customization/positions/${_folderPath}`;
            _imageFiles.forEach(fn => {
                const pi = FILENAME_TO_POSITION[fn];
                if (!pi) return;
                const card = document.querySelector(`.position-card[data-position="${pi.code}"]`);
                if (!card) return;
                const img = card.querySelector('.position-placeholder');
                if (img) {
                    if (isApronProductContext(_normalizedType) || isHoodieGarmentTintContext(_normalizedType)) {
                        setPositionCardGarmentImage(img, `${_basePath}/${fn}`, _normalizedType);
                        img.alt = pi.label;
                    } else {
                        const imgUrl = `${_basePath}/${fn}`;
                        debugLog('🎯 [positionsOnly] Setting card image:', pi.code, '→', imgUrl);
                        img.src = imgUrl;
                        img.alt = pi.label;
                        img.onload = function() {
                            debugLog('✅ [positionsOnly] Image loaded OK:', imgUrl);
                        };
                        img.onerror = function() {
                            console.error('❌ [positionsOnly] Image FAILED:', imgUrl);
                            try {
                                const pd = JSON.parse(sessionStorage.getItem('selectedProductData') || '{}');
                                if (pd.image) { img.src = pd.image; }
                            } catch(e) {}
                            img.onerror = null;
                        };
                    }
                }
                const labelSpan = card.querySelector('.position-checkbox span');
                if (labelSpan) labelSpan.textContent = pi.label;
            });

            if (_normalizedType === 'Aprons') {
                finalizeApronGarmentTintOnCards(document.querySelectorAll('#positionOptions, .positions-grid'));
            } else if (isHoodieGarmentTintContext(_normalizedType)) {
                finalizeHoodieGarmentTintOnCards(document.querySelectorAll('#positionOptions, .positions-grid'));
            }

            // Hide/show embroidery-only (beanies) or print-only products
            const EMBROIDERY_ONLY = ['Beanies', 'Fleece'];
            const PRINT_ONLY = ['Safety Vests'];
            if (EMBROIDERY_ONLY.includes(_normalizedType)) {
                _positionFilterCSS += '\n.position-card .price-badge.price-print { display: none !important; }';
                _positionFilterCSS += '\n.key-badge.print { display: none !important; }';
            }
            if (PRINT_ONLY.includes(_normalizedType)) {
                _positionFilterCSS += '\n.position-card .price-badge.price-emb { display: none !important; }';
                _positionFilterCSS += '\n.key-badge.embroidery { display: none !important; }';
            }
        }

        const style = document.createElement('style');
        style.id = 'positionsOnlyModeCSS';
        style.textContent = `
            /* Hide everything except positions section */
            .mobile-header, .tablet-top-bar, .site-breadcrumbs,
            .product-gallery, .product-info, .customize-section:not(.customization-options),
            .order-summary-section, .action-bar, .bottom-nav,
            .pricing-section, #sizeQtySection,
            footer, .mobile-footer { display: none !important; }
            /* Show positions section */
            .customization-options { display: block !important; }
            /* Style the positions section for popup */
            .customize-main { padding: 0 !important; margin: 0 !important; }
            body { background: #fff !important; overflow-x: hidden !important; }
            .customization-options { margin-top: 0 !important; padding-top: 8px !important; }
            /* "Customize: Logo Positions" title */
            h2.section-title { margin: 12px 16px 4px !important; }
            /* Done button */
            .positions-done-bar {
                position: sticky; bottom: 0; left: 0; right: 0;
                padding: 12px 16px; background: #fff;
                border-top: 1px solid #e5e7eb; z-index: 100;
            }
            .positions-done-btn {
                width: 100%; padding: 14px; border-radius: 12px;
                font-size: 1rem; font-weight: 700; cursor: pointer;
                border: none; color: #fff;
                background: linear-gradient(135deg, #273469, #1E2749);
                display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            /* ── Position card filter (product-type specific) ── */
            ${_positionFilterCSS}
        `;
        document.head.appendChild(style);

        // Add "Done" button at the bottom of the page
        const doneBar = document.createElement('div');
        doneBar.className = 'positions-done-bar';
        doneBar.innerHTML = `<button type="button" class="positions-done-btn" id="positionsDoneBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            Done
        </button>`;
        document.body.appendChild(doneBar);

        // Done button handler: close popup (logo is already auto-saved to basket on upload)
        doneBar.querySelector('#positionsDoneBtn').addEventListener('click', () => {
            persistEditedBasketItemLogos();
            if (window.parent && window.parent !== window) {
                try {
                    if (typeof window.parent.closeCustomizePopup === 'function') {
                        window.parent.closeCustomizePopup();
                        return;
                    }
                } catch(e) {}
                // Fallback: postMessage
                try { window.parent.postMessage({ type: 'closeCustomizePopup' }, '*'); } catch(e) {}
            }
        });

        // ── AUTO-OPEN logo editor when editing a specific position from basket ──
        const _editingPosition = sessionStorage.getItem('editingPosition');
        if (_editingPosition) {
            debugLog('🎯 [positionsOnly] Auto-opening logo editor for position:', _editingPosition);
            // Wait for restoreUIFromState (300ms) + DOM settle
            setTimeout(() => {
                const card = document.querySelector(`.position-card[data-position="${_editingPosition}"]`);
                if (!card) {
                    debugWarn('⚠️ [positionsOnly] Position card not found:', _editingPosition);
                    return;
                }
                // Ensure the checkbox is checked
                const checkbox = card.querySelector('input[type="checkbox"]');
                if (checkbox && !checkbox.checked) {
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change'));
                }
                // Find the active method for this position (embroidery or print)
                const method = state.positionMethods[_editingPosition] || 'embroidery';
                // Open the design modal (logo upload)
                openDesignModal(_editingPosition, method, 'logo');
                // Clean up so it doesn't re-trigger
                sessionStorage.removeItem('editingPosition');
                sessionStorage.removeItem('editingLogoIndex');
            }, 600);
        }
    }

    // === Initialize ===
    async function init() {
        // Guard: Only run on customize pages (not homepage)
        const isCustomizePage = document.getElementById('positionOptions') || 
                                document.getElementById('colorOptions') ||
                                document.querySelector('.customize-page-content') ||
                                document.body.classList.contains('page-customize');
        
        if (!isCustomizePage) {
            debugLog('?? Customize.js: Not on customize page, skipping init');
            return;
        }

        clearStaleBasketEditSessionUnlessEditing();

        // Detect positionsOnly mode (opened from basket "Add Logo" popup)
        const _urlParams = new URLSearchParams(window.location.search);
        const isPositionsOnly = _urlParams.get('positionsOnly') === '1';
        if (isPositionsOnly) {
            applyPositionsOnlyMode();
        }
        normalizePositionBadgeTexts();
        
        debugLog('?? INIT STARTED');
        debugLog('DOM Ready State:', document.readyState);
        
        // CRITICAL FIX: Clear selectedColorImage first to prevent showing old product's image
        // This ensures we don't show the previous product's image while loading new product
        state.selectedColorImage = null;
        state.selectedColor = null;
        state.selectedColorName = null;
        debugLog('?? Cleared color selection state before loading new product');

        // CRITICAL FIX: Load product data FIRST, then restore customization state
        // This ensures PRODUCT_COLORS is populated before we try to match saved colors
        try {
            const loadedEarly = await loadProductFromSessionOrApi();
            if (loadedEarly) {
                debugLog('? Product loaded early during init:', state.product.code, state.product.name);
                
                // Now restore customization state (colors will be matched against new product's colors)
                applyFreshItemSessionIfNeeded();
                restoreCustomizationState();
                
                // Refresh DOM with correct product data
                refreshProductDOM();
                
                // Update position cards with product-specific images (apron, hoodie, etc.)
                // In positionsOnly mode, applyPositionsOnlyMode() already handled this via CSS !important
                if (!isPositionsOnly) {
                    updatePositionCardsForProductType(state.product.rawData);
                }
            } else {
                applyFreshItemSessionIfNeeded();
                restoreCustomizationState();
            }
        } catch (e) {
            debugWarn('Early product load failed, continuing with fallback', e);
            applyFreshItemSessionIfNeeded();
            restoreCustomizationState();
        }

        // Check if coming from shop page with selected color (apply after loading product)
        const shopSelectedColorName = sessionStorage.getItem('selectedColorName');
        const shopSelectedColorUrl = sessionStorage.getItem('selectedColorUrl');
        if (shopSelectedColorName && shopSelectedColorUrl) {
            debugLog('?? Found color from shop:', shopSelectedColorName);
            // Find matching color in PRODUCT_COLORS
            const matchingColor = PRODUCT_COLORS.find(c => 
                c.name.toLowerCase() === shopSelectedColorName.toLowerCase() ||
                c.image === shopSelectedColorUrl
            );
            if (matchingColor) {
                state.selectedColor = matchingColor.id;
                state.selectedColorName = matchingColor.name;
                state.selectedColorImage = matchingColor.image;
                debugLog('? Applied shop color:', matchingColor.name);
                
                // Update color label and active button, but keep model image as main
                setTimeout(() => {
                    // DON'T overwrite main image - keep the model/hero image from refreshProductDOM()
                    // Update color label
                    const selectedColorEl = document.getElementById('selectedColor');
                    if (selectedColorEl) {
                        selectedColorEl.textContent = matchingColor.name;
                    }
                    // Update active button
                    const colorOptions = document.getElementById('colorOptions');
                    if (colorOptions) {
                        colorOptions.querySelectorAll('.color-btn').forEach(b => {
                            b.classList.toggle('active', b.dataset.color === matchingColor.id);
                        });
                    }
                    applyGarmentColorToPositionPreviews();
                }, 100);
            }
            // Clear the shop session storage so it doesn't override next time
            sessionStorage.removeItem('selectedColorName');
            sessionStorage.removeItem('selectedColorUrl');
        }

        // === Phase 2.1: Load basket item context when coming from "Add your logo" ===
        const basketIdx = sessionStorage.getItem('customizingBasketIndex');
        if (basketIdx !== null) {
            try {
                const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                const basketItem = basket[parseInt(basketIdx, 10)];
                if (basketItem) {
                    debugLog('🛒 Loading basket item for customization:', basketItem.productName, basketItem.color);
                } else {
                    // Stale index — basket was cleared or item removed
                    debugWarn('⚠️ Basket item at index', basketIdx, 'no longer exists. Clearing stale sessionStorage keys.');
                    sessionStorage.removeItem('customizingBasketIndex');
                    sessionStorage.removeItem('returnAfterCustomize');
                }
                if (basketItem) {

                    // Link auto-save to this specific basket item
                    _autoSavedItemId = basketItem.id;
                    _sessionSavedIds.add(basketItem.id);

                    // Pre-populate color from basket item
                    const itemColorName = basketItem.color || '';
                    const itemColorId = basketItem.colorId || '';
                    const matchColor = PRODUCT_COLORS.find(c =>
                        c.id === itemColorId ||
                        c.name.toLowerCase() === itemColorName.toLowerCase()
                    );
                    if (matchColor) {
                        state.selectedColor = matchColor.id;
                        state.selectedColorName = matchColor.name;
                        state.selectedColorImage = matchColor.image;
                        debugLog('🎨 Set color from basket item:', matchColor.name);
                    } else if (itemColorName) {
                        state.selectedColorName = itemColorName;
                        state.selectedColor = slugify(itemColorName);
                    }
                    if (window.BrandedColorHex) {
                        const productCode = basketItem.code || basketItem.productCode || '';
                        let itemHex = BrandedColorHex.parseHex(basketItem.colorHex);
                        if (!BrandedColorHex.isUsableHex(itemHex)) {
                            itemHex = BrandedColorHex.lookup(
                                itemColorName,
                                productCode,
                                basketItem.colorImage || basketItem.image,
                                itemColorId
                            ) || '';
                            if (itemHex) basketItem.colorHex = itemHex;
                        }
                        if (BrandedColorHex.isUsableHex(itemHex)) {
                            BrandedColorHex.register(itemColorName || basketItem.color || '', itemHex, productCode);
                            if (state.product && state.product.rawData) {
                                state.product.rawData.colorHex = itemHex;
                                state.product.rawData.color = itemColorName || basketItem.color || state.product.rawData.color;
                            }
                        }
                    }

                    // Pre-populate size quantities
                    if (basketItem.quantities && typeof basketItem.quantities === 'object') {
                        state.sizeQuantities = { ...basketItem.quantities };
                        state.quantity = basketItem.totalQty || Object.values(basketItem.quantities).reduce((s, q) => s + q, 0);
                    } else if (basketItem.sizes && typeof basketItem.sizes === 'object') {
                        // Handle product.js format (sizes instead of quantities)
                        state.sizeQuantities = { ...basketItem.sizes };
                        state.quantity = basketItem.quantity || Object.values(basketItem.sizes).reduce((s, q) => s + q, 0);
                    } else if (basketItem.size) {
                        state.sizeQuantities = { [basketItem.size]: basketItem.qty || 1 };
                        state.quantity = basketItem.qty || 1;
                    }

                    // Pre-populate existing designs/positions if editing
                    if (basketItem.positionDesigns && Object.keys(basketItem.positionDesigns).length > 0) {
                        state.positionDesigns = { ...basketItem.positionDesigns };
                        // Also sync positionCustomizations so card previews/glow show correctly
                        state.positionCustomizations = { ...basketItem.positionDesigns };
                    }
                    if (basketItem.positions) {
                        // positions can be array (new format) or object (old format)
                        if (Array.isArray(basketItem.positions)) {
                            basketItem.positions.forEach(pos => {
                                if (pos.position && pos.method) {
                                    state.positionMethods[pos.position] = pos.method.toLowerCase();
                                }
                            });
                        } else if (typeof basketItem.positions === 'object') {
                            Object.entries(basketItem.positions).forEach(([posKey, posData]) => {
                                if (posData.method) {
                                    state.positionMethods[posKey] = posData.method.toLowerCase();
                                }
                            });
                        }
                    }

                    if (basketItem.logos && basketItem.logos.length > 0) {
                        basketItem.logos.forEach(logo => {
                            if (!logo) return;
                            const pos = logo.position || 'left-breast';
                            const method = (logo.method || 'print').toLowerCase();
                            state.positionMethods[pos] = method;
                            state.positionDesigns[pos] = {
                                logo: logo.logo || '',
                                method: method,
                                position: pos,
                                unitPrice: logo.unitPrice || (method === 'embroidery' ? 5 : 3.5)
                            };
                            state.positionCustomizations[pos] = { ...state.positionDesigns[pos] };
                        });
                    }

                    _logoConfiguredForCurrentItem = basketItemHasLogo(basketItem);
                    debugLog('✅ Basket item loaded into customize state');
                }
            } catch (e) {
                debugWarn('Failed to load basket item for customization:', e);
            }
            // Don't clear customizingBasketIndex yet — needed by addToQuote for return navigation
        }

        // Setup state persistence for when user navigates away
        setupStatePersistence();
        
        // Check and cleanup localStorage if needed
        cleanupLocalStorageIfNeeded();
        
        // Force render colors first (PRODUCT_COLORS may have been updated)
        debugLog('About to call renderColorButtons...');
        renderColorButtons();
        debugLog('renderColorButtons called');
        applySessionColorFromBasket();
        if (isPositionsOnly) {
            if (isApronProductContext()) {
                refreshApronPositionCardsFromBasket();
            } else if (isHoodieGarmentTintContext()) {
                refreshHoodieGarmentTintPositionCardsFromBasket();
            }
        } else if (isApronProductContext()) {
            finalizeApronGarmentTintOnCards();
            applyGarmentColorToPositionPreviews();
        } else if (isHoodieGarmentTintContext()) {
            finalizeHoodieGarmentTintOnCards();
            applyGarmentColorToPositionPreviews();
        } else {
            applyGarmentColorToPositionPreviews();
        }
        
        setupVatToggle();
        setupColorSelection();
        setupSizeSelection();
        setupQuantityControl();
        setupQuickUpload();
        setupPositionSelection();
        setupDeleteLogoButtons(); // Handle delete logo buttons in position cards
        initializePOABadges(); // Initialize POA badges
        setupGallery();
        setupModals();
        setupDesignEditor();
        initDesignModal();
        initCustomizationTypeModal(); // Initialize customization type selection modal
        // setupOrderCard(); // REMOVED - card viola eliminata
        setupSaveSelectionButton();
        setupSubmitQuoteButton();
        setupContinueShoppingButton();
        setupScrollBlock();
        updateVatToggleUI();
        updatePricingTiers();
        updatePricingSummary();
        // updateOrderCard(); // REMOVED - card viola eliminata
        updateDeliveryDate();
        updateQuoteButtonState();
    // Ensure sizes/quantities are recalculated after UI setup
    try { updateSizeQuantities(); } catch (e) { /* ignore if not yet defined */ }
        
        // Update total pieces counter to show current selection only
        const totalSpan = document.getElementById('totalQty');
        if (totalSpan) {
            totalSpan.textContent = state.quantity;
        }
        
        // Initialize selection as saved (no items yet)
        state.selectionSaved = true;
        
        // Restore UI from state if we had saved state (after all UI is rendered)
        setTimeout(() => {
            debugLog('🔄 Running restoreUIFromState after timeout...');
            restoreUIFromState();
        }, 300);
        
        debugLog('✅ INIT COMPLETE');
        
        // REMOVED: Force clear was causing the size rows to disappear after being added
        // The size selection UI is now handled properly by setupSizeSelection()
    }

    // === Order Card Accordion ===
    function setupOrderCard() {
        const card = document.getElementById('orderCard');
        const cardFace = document.getElementById('orderCardFace');
        const closeBtn = document.getElementById('orderCardClose');
        const cardHeader = card?.querySelector('.order-card-header');
        
        if (!card) return;
        
        // Open card on click
        if (cardFace) {
            cardFace.addEventListener('click', () => {
                card.classList.add('active');
                updateOrderCardItemsList();
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }
        
        // Close card - entire header is clickable
        if (cardHeader) {
            cardHeader.addEventListener('click', () => {
                card.classList.remove('active');
                if (navigator.vibrate) navigator.vibrate(10);
            });
            // Make header appear clickable
            cardHeader.style.cursor = 'pointer';
        }
        
        // Also keep the close button functional (redundant but doesn't hurt)
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent double trigger
                card.classList.remove('active');
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }
        
        // Update date
        updateOrderCardDate();
    }
    
    // === Save Selection Button (REMOVED) ===
    function setupSaveSelectionButton() {
        // Save button removed - selection is auto-saved on color change or Add to Quote
        return;
    }
    
    // Add current size selection to basket
    function addCurrentSelectionToBasket() {
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        // Build positions object for any selected branding
        const positions = {};
        const customizations = [];
        
        // DEBUG: Check if positionMethods exists and has data
        let methodsCount = state.positionMethods ? Object.keys(state.positionMethods).length : 0;
        debugLog('DEBUG - Initial positionMethods count:', methodsCount);
        debugLog('DEBUG - state.positionMethods:', JSON.stringify(state.positionMethods));
        
        // If positionMethods is empty, rebuild from UI (fallback)
        if (methodsCount === 0) {
            debugLog('WARNING: positionMethods is empty! Rebuilding from UI...');
            
            if (!state.positionMethods) state.positionMethods = {};
            
            // Rebuild from UI - check all position cards with active badges
            document.querySelectorAll('.position-card').forEach(card => {
                const checkbox = card.querySelector('input[type="checkbox"]');
                const position = checkbox?.value;
                
                // Check for active badge
                const activeBadge = card.querySelector('.price-badge.active');
                if (activeBadge && position) {
                    const method = activeBadge.dataset.method;
                    if (method) {
                        state.positionMethods[position] = method;
                        debugLog('REBUILT position:', position, '=', method);
                    }
                }
            });
            
            methodsCount = Object.keys(state.positionMethods).length;
            debugLog('After rebuild - positionMethods count:', methodsCount);
        }
        
        debugLog('FINAL positionMethods:', JSON.stringify(state.positionMethods));
        debugLog('quantity:', state.quantity);
        
        if (state.positionMethods && Object.keys(state.positionMethods).length > 0) {
            Object.entries(state.positionMethods).forEach(([pos, method]) => {
                // method is 'embroidery' or 'print' (lowercase)
                const unitPrice = method.toLowerCase() === 'embroidery' ? 5.00 : 3.50;
                const totalPrice = unitPrice * state.quantity;
                const methodLabel = method.toLowerCase() === 'embroidery' ? 'Embroidery' : 'Print';
                
                // Convert position ID to readable name (use canonical map)
                const positionLabel = canonicalPositionName(pos);
                
                // Get logo from positionDesigns if available
                const designLogo = state.positionDesigns?.[pos]?.logo || null;
                
                positions[pos] = {
                    method: methodLabel,
                    unitPrice: unitPrice,
                    totalPrice: totalPrice,
                    name: positionLabel,
                    logo: designLogo
                };
                
                // Also add to customizations array for basket display
                customizations.push({
                    posKey: pos,
                    position: positionLabel,
                    method: methodLabel,
                    unitPrice: unitPrice,
                    total: totalPrice,
                    qty: state.quantity
                });
            });
        }
        
        // Create one basket item PER SIZE — each size is its own line
        const currentUnitPrice = getCurrentUnitPrice();
        const priceMode = localStorage.getItem('brandeduk-vat-mode') === 'on' ? 'inc' : 'ex';
        const baseProductCode = state.product?.code || 'GD067';
        const baseProductName = state.product?.name || 'Gildan Softstyle™ Midweight Hoodie';
        const baseColor = state.selectedColorName || state.selectedColor || 'Black';
        const baseColorId = state.selectedColor;
        const baseColorImage = state.selectedColorImage;
        let baseColorHex = getSelectedColorHex();
        if (!baseColorHex && window.BrandedColorHex && baseColor) {
            baseColorHex = BrandedColorHex.lookup(baseColor, baseProductCode, baseColorImage, baseColorId) || BrandedColorHex.lookupByName(baseColor, baseColorId) || '';
            if (baseColorHex) BrandedColorHex.register(baseColor, baseColorHex, baseProductCode);
        }
        const basePositionDesigns = getPositionDesignsForBasket();
        const now = new Date().toISOString();

        const sizesToAdd = Object.entries(state.sizeQuantities).filter(([, qty]) => qty > 0);

        sizesToAdd.forEach(([size, qty]) => {
            const sizeCustomizations = customizations.map(c => ({
                ...c,
                qty: qty,
                total: (c.unitPrice || 0) * qty
            }));
            const sizePositions = {};
            Object.entries(positions).forEach(([pos, posData]) => {
                sizePositions[pos] = {
                    ...posData,
                    totalPrice: (posData.unitPrice || 0) * qty
                };
            });

            const newItem = {
                id: Date.now().toString() + '-' + size,
                productCode: baseProductCode,
                productName: baseProductName,
                color: baseColor,
                colorId: baseColorId,
                colorHex: baseColorHex,
                colorImage: baseColorImage,
                quantities: { [size]: qty },
                totalQty: qty,
                unitPrice: currentUnitPrice,
                priceMode: priceMode,
                positions: sizePositions,
                positionDesigns: JSON.parse(JSON.stringify(basePositionDesigns)),
                customizations: sizeCustomizations,
                addedAt: now
            };

            debugLog('🛒 New Item (size ' + size + '):', JSON.stringify(newItem, null, 2));

            // No merge — each size is always a separate line
            basket.push(newItem);
        });
        
        // Save to localStorage SYNCHRONOUSLY first, then compress in background
        try {
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
            debugLog('✅ Basket saved! Total items:', basket.length);
        } catch (e) {
            debugWarn('⚠️ localStorage full, trying to compress...', e);
            // Synchronous fallback: strip base64 logos to thumbnail size inline
            basket.forEach(item => {
                if (item.positionDesigns) {
                    Object.values(item.positionDesigns).forEach(d => {
                        if (d.logo && d.logo.length > 50000) {
                            // Keep a truncated version rather than nothing
                            d.logo = d.logo.substring(0, 50000);
                        }
                    });
                }
            });
            try {
                localStorage.setItem('quoteBasket', JSON.stringify(basket));
                debugLog('✅ Basket saved after trimming!');
            } catch (e2) {
                console.error('❌ Cannot save basket:', e2);
                showToast('Storage full — please submit your quote', true);
            }
        }
        
        // Background: compress images for future saves (non-blocking)
        setTimeout(async () => {
            try {
                const bsk = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                let changed = false;
                for (let i = 0; i < bsk.length; i++) {
                    const before = JSON.stringify(bsk[i]).length;
                    bsk[i] = await compressItemImages(bsk[i]);
                    if (JSON.stringify(bsk[i]).length < before) changed = true;
                }
                if (changed) {
                    localStorage.setItem('quoteBasket', JSON.stringify(bsk));
                    debugLog('✅ Basket images compressed in background');
                }
            } catch (err) {
                debugWarn('Background compression failed:', err);
            }
        }, 100);
        
        // Reset current selection state BEFORE updating badges so it's not double-counted
        state.quantity = 0;
        state.sizeQuantities = {};
        state.selectionSaved = true;
        
        // Update UI
        updateCartBadge();
        updateBasketCount();
        updateLiveBadge();
        
        updatePricingSummary();
        
        debugLog('✅ Added to basket:', newItem.totalQty, 'items, customizations:', customizations.length);
    }
    
    // Reset size selection form (but keep color)
    function resetSizeSelectionForm() {
        // Reset quantities
        state.quantity = 0;
        state.sizeQuantities = {};
        state.selectionSaved = false;
        
        // Clear ALL size rows
        const container = document.querySelector('.selected-sizes');
        if (container) {
            container.innerHTML = '<!-- Size rows will be added dynamically -->';
        }
        
        // Update displays
        updateSizeQuantities();
        updatePricingSummary();
        updateLiveBadge();
    }
    
    // === Submit Quote Button Handler ===
    function setupSubmitQuoteButton() {
        const submitBtn = document.getElementById('submitQuoteBtn');
        const popupOverlay = document.getElementById('quotePopupOverlay');
        const closePopupBtn = document.getElementById('closeQuotePopup');
        const quoteForm = document.getElementById('quoteRequestForm');
        const popupSubmitBtn = document.getElementById('quotePopupSubmitBtn');
        
        if (!submitBtn) return;
        
        // Open popup when clicking Submit Quote button
        submitBtn.addEventListener('click', () => {
            if (popupOverlay) {
                popupOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(10);
            }
        });
        
        // Close popup when clicking X
        if (closePopupBtn) {
            closePopupBtn.addEventListener('click', () => {
                popupOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Close popup when clicking overlay background
        if (popupOverlay) {
            popupOverlay.addEventListener('click', (e) => {
                if (e.target === popupOverlay) {
                    popupOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Handle form submission
        if (quoteForm) {
            quoteForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Prevent double submit
                if (popupSubmitBtn.classList.contains('submitted')) return;
                
                // Get form data
                const name = document.getElementById('quoteName').value.trim();
                const company = document.getElementById('quoteCompany')?.value.trim() || '';
                const phone = document.getElementById('quotePhone').value.trim();
                const emailValue = document.getElementById('quoteEmail').value.trim();
                const address = document.getElementById('quoteAddress')?.value.trim() || '';
                
                // Validate email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailValue || !emailRegex.test(emailValue)) {
                    const emailInput = document.getElementById('quoteEmail');
                    emailInput.classList.add('invalid-email');
                    
                    // Show error message
                    let errorMsg = emailInput.parentElement.querySelector('.email-error');
                    if (!errorMsg) {
                        errorMsg = document.createElement('span');
                        errorMsg.className = 'email-error';
                        errorMsg.textContent = 'Insert valid email address';
                        emailInput.parentElement.appendChild(errorMsg);
                    }
                    
                    // Haptic feedback for error
                    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                    
                    return; // Don't submit
                }

                // Basic validation
                if (!name || !phone) {
                    alert('Please fill in all fields');
                    return;
                }

                // Show loading state
                if (popupSubmitBtn) {
                    popupSubmitBtn.textContent = 'Sending...';
                    popupSubmitBtn.disabled = true;
                }

                const showToastOrAlert = (message) => {
                    // Try to use toast if available, otherwise alert
                    if (typeof showToast === 'function') {
                        showToast(message);
                    } else {
                        alert(message);
                    }
                };

                try {
                    // Get basket from localStorage
                    let basket = [];
                    try {
                        basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
                    } catch {
                        basket = [];
                    }

                    // If basket is empty but we have a current product, build item from state
                    if (basket.length === 0 && state.product) {
                        const currentQty = state.quantity || Object.values(state.sizeQuantities || {}).reduce((s, q) => s + q, 0);
                        if (currentQty > 0) {
                            basket.push({
                                productCode: state.product.code || '',
                                productName: state.product.name || 'Product',
                                color: state.selectedColorName || '',
                                colorImage: state.selectedColorImage || '',
                                quantities: { ...state.sizeQuantities },
                                totalQty: currentQty,
                                unitPrice: getCurrentUnitPrice(),
                                positions: {},
                                customizations: []
                            });
                        }
                    }

                    // Get product data from sessionStorage
                    let productData = {};
                    try {
                        const savedProductData = sessionStorage.getItem('selectedProductData');
                        if (savedProductData) {
                            productData = JSON.parse(savedProductData);
                        }
                    } catch {
                        // Ignore
                    }

                    // Get customizations from state or sessionStorage
                    let positionCustomizations = {};
                    try {
                        const savedCustomizations = sessionStorage.getItem('positionCustomizations');
                        if (savedCustomizations) {
                            positionCustomizations = JSON.parse(savedCustomizations);
                        } else if (state.positionCustomizations) {
                            positionCustomizations = state.positionCustomizations;
                        }
                    } catch {
                        // Ignore
                    }

                    // Sync any unsaved notes from DOM textareas to basket items before processing
                    document.querySelectorAll('.note-box-input').forEach(textarea => {
                        const idx = textarea.dataset.index;
                        if (idx !== 'current' && basket[Number(idx)]) {
                            const noteVal = textarea.value.trim();
                            if (noteVal) basket[Number(idx)].note = noteVal;
                        }
                    });
                    // Also grab "current item" note
                    const currentNoteTextarea = document.querySelector('.note-box-input[data-index="current"]');
                    const currentItemNote = currentNoteTextarea ? currentNoteTextarea.value.trim() : '';

                    // Calculate summary totals and build detailed basket items
                    let totalGarmentCost = 0;
                    let totalQuantity = 0;
                    let customizationTotal = 0;
                    let digitizingFee = 0;
                    const basketItems = [];
                    const customizationsList = [];

                    // Process basket items
                    basket.forEach((item) => {
                        const qtyMap = item.quantities || item.sizes || {};
                        const itemQuantity = item.totalQty || item.quantity || Object.values(qtyMap).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
                        const unitPrice = Number(item.unitPrice) || Number(item.price) || 0;
                        const itemTotal = unitPrice * itemQuantity;
                        
                        totalGarmentCost += itemTotal;
                        totalQuantity += itemQuantity;
                        
                        // Build sizes string summary (PC ki tarah)
                        const sizesBreakdown = Object.entries(qtyMap)
                            .filter(([size, qty]) => Number(qty) > 0)
                            .reduce((acc, [size, qty]) => {
                                acc[size] = Number(qty);
                                return acc;
                            }, {});
                        
                        // Create sizesSummary string (PC me jo hai waisa)
                        const sizesSummary = Object.entries(qtyMap)
                            .filter(([size, qty]) => Number(qty) > 0)
                            .map(([size, qty]) => `${size}: ${qty}`)
                            .join(', ');
                        
                        // Get image from correct source
                        const productImage = productData.images ? 
                            (Array.isArray(productData.images) ? productData.images[0] : productData.images) : 
                            (productData.image || item.image || item.colorImage || '');
                        
                        // Get note from basket item
                        const itemNote = item.note || '';
                        
                        basketItems.push({
                            name: item.productName || item.name || productData.name || 'Product',
                            code: item.productCode || item.code || productData.code || '',
                            color: item.color || item.selectedColorName || state.selectedColorName || '',
                            quantity: itemQuantity,
                            sizes: sizesBreakdown,
                            sizesSummary: sizesSummary || item.size || 'N/A',
                            unitPrice: unitPrice,
                            itemTotal: itemTotal,
                            image: productImage,
                            note: itemNote
                        });
                    });

                    // Helper function for position name (ISKO OUTER SCOPE ME RAKHO)
                    function getPositionName(positionCode) {
                        // Use the global canonical name for consistency
                        return canonicalPositionName(positionCode);
                    }

                    // Process customizations — collect from basket items first (has prices),
                    // then fall back to positionCustomizations (design data only, no prices)
                    const seenPositions = new Set();
                    
                    // 1) From basket items' positions/customizations (has unitPrice, totalPrice)
                    basket.forEach((item) => {
                        // Try item.positions object (has method, unitPrice, totalPrice, name)
                        if (item.positions && typeof item.positions === 'object') {
                            Object.entries(item.positions).forEach(([pos, posData]) => {
                                if (!posData || seenPositions.has(pos)) return;
                                seenPositions.add(pos);
                                
                                const method = (posData.method || 'embroidery').toLowerCase();
                                const unitPrice = Number(posData.unitPrice) || (method === 'embroidery' ? 5.00 : 3.50);
                                const quantity = Number(item.totalQty) || Number(item.quantity) || totalQuantity;
                                const lineTotal = Number(posData.totalPrice) || (unitPrice * quantity);
                                const hasLogo = !!(posData.logo || state.positionDesigns?.[pos]?.logo);
                                
                                customizationTotal += lineTotal;
                                
                                if (hasLogo && method === 'embroidery') {
                                    digitizingFee = 25.00;
                                }
                                
                                customizationsList.push({
                                    position: posData.name || getPositionName(pos) || pos,
                                    method: method === 'print' ? 'Print' : 'Embroidery',
                                    type: hasLogo ? 'logo' : 'text',
                                    hasLogo: hasLogo,
                                    logo: posData.logo || state.positionDesigns?.[pos]?.logo || null,
                                    unitPrice: unitPrice,
                                    lineTotal: lineTotal,
                                    quantity: quantity
                                });
                            });
                        }
                        
                        // Try item.customizations array (has unitPrice, total, qty)
                        if (Array.isArray(item.customizations)) {
                            item.customizations.forEach(c => {
                                const posKey = (c.position || '').toLowerCase().replace(/\s+/g, '-');
                                if (seenPositions.has(posKey) || seenPositions.has(c.position)) return;
                                seenPositions.add(c.position);
                                
                                const method = (c.method || 'embroidery').toLowerCase();
                                const unitPrice = Number(c.unitPrice) || (method === 'embroidery' ? 5.00 : 3.50);
                                const quantity = Number(c.qty) || Number(c.quantity) || totalQuantity;
                                const lineTotal = Number(c.total) || Number(c.lineTotal) || (unitPrice * quantity);
                                
                                customizationTotal += lineTotal;
                                
                                customizationsList.push({
                                    position: c.position,
                                    method: method === 'print' ? 'Print' : 'Embroidery',
                                    type: c.type || 'logo',
                                    hasLogo: !!c.hasLogo,
                                    logo: c.logo || null,
                                    unitPrice: unitPrice,
                                    lineTotal: lineTotal,
                                    quantity: quantity
                                });
                            });
                        }
                    });
                    
                    // 2) Also check positionCustomizations for any positions not yet in basket
                    const customizationsEntries = Object.entries(positionCustomizations);
                    customizationsEntries.forEach(([position, customization]) => {
                        if (!customization || seenPositions.has(position)) return;
                        seenPositions.add(position);
                        
                        const method = (customization.method || 'embroidery').toLowerCase();
                        const unitPrice = method === 'embroidery' ? 5.00 : 3.50;
                        const quantity = totalQuantity || 1;
                        const hasLogo = !!(customization.logo || customization.logoUrl || customization.logoData);
                        const lineTotal = unitPrice * quantity;
                        
                        customizationTotal += lineTotal;
                        
                        if (hasLogo && method === 'embroidery') {
                            digitizingFee = 25.00;
                        }
                        
                        const positionName = getPositionName(position) || position;
                        
                        customizationsList.push({
                            position: positionName,
                            method: method === 'print' ? 'Print' : 'Embroidery',
                            type: hasLogo ? 'logo' : (customization.text ? 'text' : 'logo'),
                            hasLogo: hasLogo,
                            logo: customization.logo || customization.logoUrl || customization.logoData || null,
                            unitPrice: unitPrice,
                            lineTotal: lineTotal,
                            quantity: quantity
                        });
                    });

                    // Calculate totals
                    const isVatIncluded = localStorage.getItem('brandeduk-vat-mode') === 'on';
                    const vatRate = 0.20;
                    const totalCostExVat = totalGarmentCost + customizationTotal + digitizingFee;
                    const vatAmount = totalCostExVat * vatRate;
                    const totalCostIncVat = totalCostExVat + vatAmount;

                    
                    // Collect logo files for FormData upload
                    const logoFiles = {};
                    Object.entries(positionCustomizations).forEach(([position, customization]) => {
                        if (!customization) return;
                        
                        // Check for logo data in customization or positionDesigns
                        const designData = state.positionDesigns?.[position];
                        const logoDataSource = customization.logo || customization.logoData || customization.logoUrl || designData?.logo || designData?.logoData;
                        
                        debugLog(`🔍 Checking position "${position}" for logo:`, {
                            hasCustomizationLogo: !!customization.logo,
                            hasCustomizationLogoData: !!customization.logoData,
                            hasCustomizationLogoUrl: !!customization.logoUrl,
                            hasDesignLogo: !!designData?.logo,
                            logoDataPrefix: logoDataSource?.substring?.(0, 50),
                            isBase64: logoDataSource?.startsWith?.('data:')
                        });
                        
                        
                        if (logoDataSource && typeof logoDataSource === 'string' && logoDataSource.startsWith('data:')) {
                            try {
                                const matches = logoDataSource.match(/^data:image\/(\w+);base64,(.+)$/);
                                if (matches) {
                                    debugLog(`✅ Converting base64 to File for position "${position}"`);
                                    const mimeType = matches[1] === 'jpeg' ? 'image/jpeg' : `image/${matches[1]}`;
                                    const base64Data = matches[2];
                                    const byteCharacters = atob(base64Data);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: mimeType });
                                    
                                    const timestamp = Date.now();
                                    const filename = `logo-${position}-${timestamp}.${matches[1]}`;
                                    const file = new File([blob], filename, { type: mimeType });
                                    
                                    logoFiles[position] = file;
                                    debugLog(`📎 Collected logo file for position "${position}":`, filename, 'Size:', file.size, 'bytes');
                                }
                            } catch (err) {
                                debugWarn(`Could not convert logo for position "${position}":`, err);
                            }
                        }
                    });
                    
                    debugLog('📦 Logo files collected:', Object.keys(logoFiles).length, Object.keys(logoFiles));
                    
                    // Compress large images before upload to avoid 413 errors
                    const compressedLogoFiles = {};
                    for (const [position, file] of Object.entries(logoFiles)) {
                        try {
                            const compressed = await compressImageFile(file, 800, 1200);
                            compressedLogoFiles[position] = compressed;
                        } catch (err) {
                            debugWarn(`Could not compress logo for ${position}, using original:`, err);
                            compressedLogoFiles[position] = file;
                        }
                    }
                    
                    debugLog('📦 Compressed logo files:', Object.entries(compressedLogoFiles).map(([k,v]) => `${k}: ${(v.size/1024).toFixed(1)}KB`));

                    const quoteData = {
                        customer: {
                            fullName: name,
                            company: company,
                            phone: phone,
                            email: emailValue,
                            address: address
                        },
                        summary: {
                            totalQuantity: totalQuantity,
                            totalItems: basket.length,
                            garmentCost: totalGarmentCost,
                            customizationCost: customizationTotal,
                            digitizingFee: digitizingFee,
                            subtotal: totalCostExVat,
                            vatRate: vatRate,
                            vatAmount: vatAmount,
                            totalExVat: totalCostExVat,
                            totalIncVat: totalCostIncVat,
                            vatMode: isVatIncluded ? 'inc' : 'ex',
                            displayTotal: isVatIncluded ? totalCostIncVat : totalCostExVat,
                            hasPoa: customizationsList.some(c => c.lineTotal === 'POA')
                        },
                        basket: basketItems,
                        customizations: customizationsList.map(c => ({
                            position: c.position,
                            method: c.method,
                            type: c.type,
                            hasLogo: c.hasLogo,
                            unitPrice: c.unitPrice,
                            lineTotal: c.lineTotal,
                            quantity: c.quantity
                        })),
                        // Collect all notes from basket items + current item
                        notes: [
                            ...basketItems
                                .filter(bi => bi.note)
                                .map(bi => `${bi.name} (${bi.color}): ${bi.note}`),
                            ...(currentItemNote ? [`Current item: ${currentItemNote}`] : [])
                        ],
                        logoFiles: Object.keys(compressedLogoFiles).length > 0 ? compressedLogoFiles : undefined,
                        timestamp: new Date().toISOString()
                    };

                    // Submit quote via API
                    let result = { success: false };
                    const API_BASE_URL = 'https://api.brandeduk.com';
                    
                    try {
                        // Try using BrandedAPI if available (handles FormData correctly)
                        if (window.BrandedAPI && typeof window.BrandedAPI.submitQuote === 'function') {
                            result = await window.BrandedAPI.submitQuote(quoteData);
                        } else {
                            // Fallback: direct fetch to API (must use FormData if logoFiles present)
                            const hasLogoFiles = quoteData.logoFiles && Object.keys(quoteData.logoFiles).length > 0;
                            
                            if (hasLogoFiles) {
                                // Use FormData for file uploads (same as BrandedAPI)
                                const formData = new FormData();
                                
                                // Remove logoFiles from quoteData before stringifying
                                const { logoFiles, ...dataWithoutFiles } = quoteData;
                                
                                // Clean customizations to ensure no logoData is included
                                if (dataWithoutFiles.customizations && Array.isArray(dataWithoutFiles.customizations)) {
                                    dataWithoutFiles.customizations = dataWithoutFiles.customizations.map(c => {
                                        const { logoData, logoUrl, ...cleanCustomization } = c;
                                        return cleanCustomization;
                                    });
                                }
                                
                                formData.append('quoteData', JSON.stringify(dataWithoutFiles));
                                
                                // Add logo files with position names (map to backend slugs - same as BrandedAPI)
                                const mapPositionToBackendSlug = (position) => {
                                    const positionMap = {
                                        'left-breast': 'left-breast',
                                        'right-breast': 'right-breast',
                                        'small-centre-front': 'small-centre-front',
                                        'large-front-center': 'large-front-center',
                                        'large-centre-front': 'large-centre-front',
                                        'left-arm': 'left-sleeve',
                                        'right-arm': 'right-sleeve',
                                        'large-back': 'back-center',
                                        'back-center': 'back-center',
                                        'left-sleeve': 'left-sleeve',
                                        'right-sleeve': 'right-sleeve'
                                    };
                                    return positionMap[position] || position.replace(/\s+/g, '-').toLowerCase();
                                };
                                
                                // Use compressed logo files instead of original
                                Object.entries(compressedLogoFiles).forEach(([position, file]) => {
                                    if (file instanceof File || file instanceof Blob) {
                                        // Map frontend position to backend slug (same as BrandedAPI)
                                        const positionSlug = mapPositionToBackendSlug(position);
                                        const formDataKey = `logo_${positionSlug}`;
                                        formData.append(formDataKey, file, file.name || `logo-${positionSlug}.png`);
                                        debugLog(`📎 [Mobile Fallback] Added logo file: ${formDataKey} (${(file.size/1024).toFixed(2)}KB)`);
                                    }
                                });
                                
                                const response = await fetch(`${API_BASE_URL}/api/quotes`, {
                                    method: 'POST',
                                    body: formData
                                });
                                
                                if (!response.ok) {
                                    const errorText = await response.text();
                                    throw new Error(`API Error: ${response.status} - ${errorText}`);
                                }
                                
                                result = await response.json();
                            } else {
                                // No logo files - use JSON
                                const response = await fetch(`${API_BASE_URL}/api/quotes`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(quoteData)
                                });

                                if (!response.ok) {
                                    const errorText = await response.text();
                                    throw new Error(`API Error: ${response.status} - ${errorText}`);
                                }

                                const contentType = response.headers.get('content-type');
                                if (contentType && contentType.includes('application/json')) {
                                    result = await response.json();
                                } else {
                                    const text = await response.text();
                                    console.error('Non-JSON response:', text);
                                    throw new Error('Server returned non-JSON response');
                                }
                            }
                        }
                    } catch (apiError) {
                        console.error('Quote API error, trying PHP fallback:', apiError);
                        
                        // Fallback to PHP send-quote.php
                        try {
                            const phpResponse = await fetch('brandedukv15-child/includes/send-quote.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(quoteData)
                            });
                            
                            if (phpResponse.ok) {
                                const phpResult = await phpResponse.json();
                                if (phpResult.success) {
                                    result = phpResult;
                                } else {
                                    throw new Error(phpResult.message || 'PHP fallback failed');
                                }
                            } else {
                                throw new Error(`PHP fallback error: ${phpResponse.status}`);
                            }
                        } catch (phpError) {
                            console.error('PHP fallback also failed:', phpError);
                            
                            // Provide more specific error messages
                            let errorMessage = 'Failed to send quote. Please contact info@brandeduk.com directly.';
                            if (apiError.message) {
                                if (apiError.message.includes('413') || apiError.message.toLowerCase().includes('too large')) {
                                    errorMessage = 'Logo file is too large. Please use a smaller image (under 1MB) or contact us directly.';
                                } else if (apiError.message.includes('Failed to fetch') || apiError.message.includes('NetworkError')) {
                                    errorMessage = 'Network error. Please check your connection and try again.';
                                } else if (apiError.message.includes('CORS')) {
                                    errorMessage = 'Server connection issue. Please try again or contact info@brandeduk.com';
                                }
                            }
                            
                            showToastOrAlert(errorMessage);
                            if (popupSubmitBtn) {
                                popupSubmitBtn.textContent = 'Submit Quote Request';
                                popupSubmitBtn.disabled = false;
                            }
                            return;
                        }
                    }

                    if (result.success) {
                        debugLog('? Quote submitted successfully');
                        
                        // Update button to submitted state
                        if (popupSubmitBtn) {
                            popupSubmitBtn.classList.add('submitted');
                            popupSubmitBtn.textContent = 'Quote Submitted! ?';
                        }
                        
                        // Also update the main Submit Quote button
                        if (submitBtn) {
                            submitBtn.classList.add('submitted');
                            submitBtn.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Quote Submitted!
                            `;
                        }
                        
                        // Haptic feedback
                        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
                        
                        // Clear storage and redirect after delay
                        setTimeout(() => {
                            // Clear the basket
                            localStorage.removeItem('quoteBasket');
                            localStorage.setItem('quoteBasket', '[]');
                            
                            // Clear ALL customization state
                            sessionStorage.removeItem('brandeduk-customize-state');
                            sessionStorage.removeItem('quoteFormData');
                            sessionStorage.removeItem('selectedColorName');
                            sessionStorage.removeItem('selectedColorUrl');
                            sessionStorage.removeItem('selectedProduct');
                            sessionStorage.removeItem('selectedProductData');
                            sessionStorage.removeItem('customizingProduct');
                            sessionStorage.removeItem('selectedPositions');
                            sessionStorage.removeItem('positionCustomizations');
                            sessionStorage.removeItem('brandeduk-filters');
                            sessionStorage.removeItem('uploadedLogo');
                            sessionStorage.removeItem('logoPreview');
                            
                            // Reset in-memory state
                            state.positionMethods = {};
                            state.positionCustomizations = {};
                            state.positionDesigns = {};
                            state.positions = [];
                            state.sizeQuantities = {};
                            state.quantity = 0;
                            state.selectedColor = null;
                            state.selectedColorName = null;
                            state.selectedColorImage = null;
                            
                            // Close popup
                            if (popupOverlay) {
                                popupOverlay.classList.remove('active');
                                document.body.style.overflow = '';
                            }
                            
                            // Redirect to homepage (use absolute path from root)
                            window.location.replace('/index-mobile.html');
                        }, 1500);
                    } else {
                        throw new Error(result.message || 'Unknown error');
                    }
                } catch (error) {
                    console.error('Quote submission error:', error);
                    showToastOrAlert('Failed to send quote. Please try again or contact info@brandeduk.com directly.');
                    if (popupSubmitBtn) {
                        popupSubmitBtn.textContent = 'Submit Quote Request';
                        popupSubmitBtn.disabled = false;
                    }
                }
            });
        }
        
        // Remove error state when user starts typing again
        const emailInput = document.getElementById('quoteEmail');
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                emailInput.classList.remove('invalid-email');
                const errorMsg = emailInput.parentElement.querySelector('.email-error');
                if (errorMsg) errorMsg.remove();
            });
        }
        
        // Setup phone validation - only allow numbers and spaces
        const phoneInput = document.getElementById('quotePhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                // Remove any non-numeric characters except spaces
                let value = e.target.value.replace(/[^0-9\s]/g, '');
                
                // Remove leading 0 if present (since +44 replaces it)
                if (value.startsWith('0')) {
                    value = value.substring(1);
                }
                
                e.target.value = value;
            });
            
            // Prevent non-numeric input
            phoneInput.addEventListener('keypress', (e) => {
                if (!/[0-9\s]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                    e.preventDefault();
                }
            });
        }
    }
    
    // === Continue Shopping Button — save current selection to basket, then go to home ===
    function setupContinueShoppingButton() {
        const btn = document.getElementById('continueShoppingBtnSummary');
        if (!btn) return;
        
        btn.addEventListener('click', () => {
            // Save current selection to basket if there are items
            if (state.quantity > 0) {
                addToQuote({ silent: true });
            }
            beginNextItemSession();
            try { sessionStorage.setItem(CUSTOMIZE_FRESH_KEY, '1'); } catch (e) { /* ignore */ }

            // Phase 2.2: If coming from basket, return there
            const returnTarget = sessionStorage.getItem('returnAfterCustomize');
            if (returnTarget === 'basket') {
                sessionStorage.removeItem('customizingBasketIndex');
                sessionStorage.removeItem('returnAfterCustomize');
                showToast('Saved! Returning to basket…');
                setTimeout(() => {
                    // If in iframe popup, close popup instead of redirect
                    if (window.parent !== window && typeof window.parent.closeCustomizePopup === 'function') {
                        window.parent.closeCustomizePopup();
                    } else {
                        window.location.href = '../basket.html';
                    }
                }, 800);
                return;
            }

            // Default: go to shop with bestsellers first
            if (state.quantity > 0) {
                showToast('Added to basket! Redirecting to shop…');
                setTimeout(() => {
                    window.location.href = '../shop.html?bestsellers=1';
                }, 1200);
            } else {
                window.location.href = '../shop.html?bestsellers=1';
            }
        });
    }
    
    // === Block Scroll (DISABLED — save button removed) ===
    function setupScrollBlock() {
        // No longer blocking scroll — auto-save handles this
        return;
    }
    
    function updateOrderCardDate() {
        const dateEl = document.getElementById('cardDate');
        if (dateEl) {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            dateEl.textContent = `${day}/${month}/${year}`;
        }
    }
    
    function updateOrderCard() {
        // Calculate totals from BOTH basket AND current selection
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        // First, calculate TOTAL quantity to determine correct tier
        let basketQty = 0;
        basket.forEach(item => {
            basketQty += item.totalQty || item.quantity || 0;
        });
        const currentQty = state.quantity || 0;
        const totalQty = basketQty + currentQty;
        
        // Get the CORRECT unit price based on total quantity (cumulative discount)
        const correctUnitPrice = getDiscountedUnitPrice(currentQty); // This already includes basket in its calculation
        
        // Now recalculate basket total with correct pricing
        let basketTotal = 0;
        let basketBrandingCount = 0;
        
        basket.forEach(item => {
            const itemQty = item.totalQty || item.quantity || 0;
            const itemCode = item.productCode || item.code;
            
            // Use cumulative discount price for same product
            let itemPrice;
            if (itemCode === state.product.code) {
                // Same product - use the cumulative tier price
                itemPrice = correctUnitPrice;
            } else {
                // Different product - use saved price (TODO: implement cross-product discounting)
                itemPrice = parseFloat(item.unitPrice || item.price) || 0;
            }
            
            basketTotal += itemQty * itemPrice;
            
            // Add customization costs for basket items
            if (item.customizations && item.customizations.length > 0) {
                basketBrandingCount += item.customizations.length;
                // Note: customization costs should also be calculated per item
                // but for now we're using the saved values
            }
        });
        
        // Current selection totals
        // Count only positions that have a method selected (embroidery or print)
        let currentBrandingQty = 0;
        if (state.positionMethods && typeof state.positionMethods === 'object') {
            currentBrandingQty = Object.keys(state.positionMethods).length;
        }
        const currentSubtotal = calculateSubtotal();
        
        // Combined totals
        const totalBranding = basketBrandingCount + currentBrandingQty;
        
        // Update card face stats (but NOT the totals - those come from updatePricingSummary)
        const cardItemsQty = document.getElementById('cardItemsQty');
        const cardBrandingQty = document.getElementById('cardBrandingQty');
        const cardLogoQty = document.getElementById('cardLogoQty');
        
        if (cardItemsQty) cardItemsQty.textContent = totalQty; // TOTAL items (basket + current)
        if (cardBrandingQty) cardBrandingQty.textContent = totalBranding; // TOTAL brandings (basket + current)
        if (cardLogoQty) cardLogoQty.textContent = `(${totalQty})`;
        
        // Update item preview rows
        updateOrderCardPreviewRows();
        
        // Update logos list
        updateOrderCardLogosList();
    }
    
    function updateOrderCardPreviewRows() {
        const row1 = document.getElementById('cardItemRow1');
        const row2 = document.getElementById('cardItemRow2');
        
        // Get selected color info
        const colorName = state.selectedColorName || 'Select Color';
        const productCode = state.product?.code || 'GD067';
        
        if (row1) {
            row1.innerHTML = `
                <span class="item-code">${productCode}</span>
                <img src="https://i.postimg.cc/DwLMYJL8/logo-gildan.png" alt="Gildan" class="brand-logo-mini">
                <span class="item-color">${colorName}</span>
            `;
        }
        
        // Second row shows sizes if available
        if (row2) {
            const sizes = Object.entries(state.sizeQuantities || {})
                .filter(([_, qty]) => qty > 0)
                .map(([size, qty]) => `${qty}£${size}`)
                .join(', ');
            
            if (sizes) {
                row2.innerHTML = `
                    <span class="item-code">Sizes:</span>
                    <span class="item-color">${sizes}</span>
                `;
                row2.style.display = 'flex';
            } else {
                row2.style.display = 'none';
            }
        }
    }
    
    function updateOrderCardItemsList() {
        const listContainer = document.getElementById('orderCardItemsList');
        if (!listContainer) return;
        
        let itemsHtml = '';
        
        // PART 1: Show items already in the basket (from localStorage)
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        // Calculate correct unit price based on cumulative quantity
        const cumulativeUnitPrice = getUnitPrice(state.quantity); // Already considers basket
        
        basket.forEach((item, basketIndex) => {
            const itemQty = item.totalQty || item.quantity || 0;
            const itemCode = item.productCode || item.code || 'N/A';
            
            // Use cumulative price for same product code
            const unitPrice = (itemCode === state.product.code) 
                ? cumulativeUnitPrice 
                : (parseFloat(item.unitPrice || item.price) || 0);
            
            const productName = item.productName || item.name || 'Product';
            const colorName = item.color || 'Unknown';
            const colorImage = item.colorImage || item.image || 'https://via.placeholder.com/60';
            
            // Build customizations HTML for this item
            let customizationsHtml = '';
            if (item.customizations && Array.isArray(item.customizations) && item.customizations.length > 0) {
                customizationsHtml = '<div class="order-item-customizations">';
                item.customizations.forEach(custom => {
                    const posName = custom.position || custom.zone || 'Position';
                    const methodName = custom.method || (custom.type === 'embroidery' ? 'Embroidery' : 'Print');
                    const custPrice = custom.unitPrice || 0;
                    const custQty = item.totalQty || item.quantity || 0;
                    const custTotal = custQty * custPrice;
                    customizationsHtml += `
                        <div class="customization-badge-mini">
                            <span class="badge-icon">${methodName === 'Embroidery' ? '??' : '???'}</span>
                            <span class="badge-text">${posName} - ${methodName}</span>
                            <span class="badge-price">${custQty} × ${formatCurrency(custPrice)} = ${formatCurrency(custTotal)}</span>
                        </div>
                    `;
                });
                customizationsHtml += '</div>';
            }
            
            // For basket items with multiple sizes, create ONE card per SIZE (so each has +/- controls)
            if (item.quantities && typeof item.quantities === 'object') {
                Object.entries(item.quantities).forEach(([size, sizeQty]) => {
                    if (sizeQty <= 0) return;
                    
                    const sizeTotal = sizeQty * unitPrice;
                    
                    itemsHtml += `
                        <div class="order-item-card basket-item" data-basket-index="${basketIndex}" data-size="${size}">
                            <img src="${colorImage}" alt="${productName}" class="order-item-image">
                            <div class="order-item-details">
                                <div class="order-item-name">${productName}</div>
                                <div class="order-item-meta">${itemCode} - ${colorName}</div>
                                <div class="order-item-size">${sizeQty}£${size}</div>
                                ${customizationsHtml}
                                <div class="order-item-qty-control">
                                    <button class="order-item-qty-btn basket-qty-btn" data-action="decrease" data-basket-index="${basketIndex}" data-size="${size}">-</button>
                                    <span class="order-item-qty-value">${sizeQty}</span>
                                    <button class="order-item-qty-btn basket-qty-btn" data-action="increase" data-basket-index="${basketIndex}" data-size="${size}">+</button>
                                </div>
                                <div class="order-item-price">${sizeQty} × ${formatCurrency(unitPrice)} = <strong>${formatCurrency(sizeTotal)}</strong> ${vatSuffix()}</div>
                            </div>
                            <button class="order-item-delete basket-delete" data-basket-index="${basketIndex}" data-size="${size}" title="Remove size">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    `;
                });
            } else {
                // Single size item (legacy format)
                const sizesStr = item.size ? `${itemQty}£${item.size}` : `${itemQty} pcs`;
                const itemTotal = itemQty * unitPrice;
                
                itemsHtml += `
                    <div class="order-item-card basket-item" data-basket-index="${basketIndex}">
                        <img src="${colorImage}" alt="${productName}" class="order-item-image">
                        <div class="order-item-details">
                            <div class="order-item-name">${productName}</div>
                            <div class="order-item-meta">${itemCode} - ${colorName}</div>
                            <div class="order-item-size">${sizesStr}</div>
                            ${customizationsHtml}
                            <div class="order-item-price">${itemQty} × ${formatCurrency(unitPrice)} = <strong>${formatCurrency(itemTotal)}</strong> ${vatSuffix()}</div>
                        </div>
                        <button class="order-item-delete basket-delete" data-basket-index="${basketIndex}" title="Remove from basket">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                `;
            }
        });
        
        // PART 2: Show current selection (not yet saved to basket)
        const unitPrice = getUnitPrice(state.quantity);
        const productName = state.product?.name || 'Gildan Softstyle Hoodie';
        const productCode = state.product?.code || 'GD067';
        const colorName = state.selectedColorName || 'Black';
        const colorImage = state.selectedColorImage || 'https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg';
        
        // Build current selection customizations
        let currentCustomizationsHtml = '';
        if (state.positionMethods && Object.keys(state.positionMethods).length > 0) {
            currentCustomizationsHtml = '<div class="order-item-customizations">';
            Object.entries(state.positionMethods).forEach(([position, method]) => {
                const posName = position.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const methodName = method === 'embroidery' ? 'Embroidery' : 'Print';
                const custPrice = method === 'embroidery' ? 5.00 : 3.50;
                const currentQty = state.quantity || 0;
                const custTotal = currentQty * custPrice;
                currentCustomizationsHtml += `
                    <div class="customization-badge-mini">
                        <span class="badge-icon">${methodName === 'Embroidery' ? '??' : '???'}</span>
                        <span class="badge-text">${posName} - ${methodName}</span>
                        <span class="badge-price">${currentQty} × ${formatCurrency(custPrice)} = ${formatCurrency(custTotal)}</span>
                    </div>
                `;
            });
            currentCustomizationsHtml += '</div>';
        }
        
        // Generate item cards for each size in current selection
        Object.entries(state.sizeQuantities || {}).forEach(([size, qty]) => {
            if (qty <= 0) return;
            
            const itemTotal = qty * unitPrice;
            
            itemsHtml += `
                <div class="order-item-card current-selection" data-size="${size}">
                    <img src="${colorImage}" alt="${productName}" class="order-item-image">
                    <div class="order-item-details">
                        <div class="order-item-name">${productName}</div>
                        <div class="order-item-meta">${productCode} - ${colorName}</div>
                        <div class="order-item-size">${qty}£${size}</div>
                        ${currentCustomizationsHtml}
                        <div class="order-item-qty-control">
                            <button class="order-item-qty-btn" data-action="decrease" data-size="${size}">-</button>
                            <span class="order-item-qty-value">${qty}</span>
                            <button class="order-item-qty-btn" data-action="increase" data-size="${size}">+</button>
                        </div>
                        <div class="order-item-price">${qty} × ${formatCurrency(unitPrice)} = <strong>${formatCurrency(itemTotal)}</strong> ${vatSuffix()}</div>
                    </div>
                    <button class="order-item-delete" data-size="${size}" title="Remove">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        });
        
        if (!itemsHtml) {
            itemsHtml = '<div class="order-item-card"><p style="color: var(--gray-500); text-align: center; width: 100%;">No items added yet. Select sizes above.</p></div>';
        }
        
        listContainer.innerHTML = itemsHtml;
        
        // Add event listeners for basket delete buttons
        listContainer.querySelectorAll('.basket-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const basketIndex = parseInt(btn.dataset.basketIndex);
                let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                basket.splice(basketIndex, 1);
                localStorage.setItem('quoteBasket', JSON.stringify(basket));
                
                // Update UI
                updateOrderCardItemsList();
                // updateOrderCard(); // REMOVED
                updatePricingTiers();
                updateCartBadge();
                
                if (navigator.vibrate) navigator.vibrate(10);
                showToast('Item removed from basket');
            });
        });
        
        // Add event listeners for BASKET item qty buttons (+/-)
        listContainer.querySelectorAll('.basket-qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const basketIndex = parseInt(btn.dataset.basketIndex);
                const size = btn.dataset.size;
                const action = btn.dataset.action;
                
                let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                if (!basket[basketIndex]) return;
                
                const item = basket[basketIndex];
                if (!item.quantities) item.quantities = {};
                
                if (action === 'increase') {
                    item.quantities[size] = (item.quantities[size] || 0) + 1;
                } else if (action === 'decrease') {
                    if (item.quantities[size] > 1) {
                        item.quantities[size] -= 1;
                    } else {
                        // Remove size if qty becomes 0
                        delete item.quantities[size];
                    }
                }
                
                // Recalculate totalQty for this item
                item.totalQty = Object.values(item.quantities).reduce((sum, q) => sum + q, 0);
                
                // If no sizes left, remove the entire item
                if (item.totalQty === 0) {
                    basket.splice(basketIndex, 1);
                    showToast('Item removed from basket');
                }
                
                // Save back to localStorage
                localStorage.setItem('quoteBasket', JSON.stringify(basket));
                
                debugLog('?? Basket updated, recalculating totals...');
                
                // Update UI - DON'T recreate entire list, just update the specific row
                const row = btn.closest('.order-item-card');
                if (row) {
                    const qtyDisplay = row.querySelector('.order-item-qty-value');
                    const newQty = item.quantities[size] || 0;
                    if (qtyDisplay) qtyDisplay.textContent = newQty;
                    
                    // Update price
                    const priceEl = row.querySelector('.order-item-price');
                    const unitPrice = parseFloat(item.unitPrice || item.price) || 0;
                    const newTotal = newQty * unitPrice;
                    if (priceEl) {
                        priceEl.innerHTML = `${newQty} × ${formatCurrency(unitPrice)} = <strong>${formatCurrency(newTotal)}</strong> ${vatSuffix()}`;
                    }
                }
                
                // Update totals without recreating HTML
                // updateOrderCard(); // REMOVED
                updatePricingSummary();
                updatePricingTiers();
                updateLiveBadge();
                updateCartBadge();
                
                debugLog('? All updates complete');
                
                if (navigator.vibrate) navigator.vibrate(5);
            });
        });
        
        // Add event listeners for current selection qty buttons (NOT basket)
        listContainer.querySelectorAll('.order-item-qty-btn:not(.basket-qty-btn)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = btn.dataset.size;
                const action = btn.dataset.action;
                
                if (action === 'increase') {
                    state.sizeQuantities[size] = (state.sizeQuantities[size] || 0) + 1;
                } else if (action === 'decrease' && state.sizeQuantities[size] > 1) {
                    state.sizeQuantities[size] -= 1;
                }
                
                // Recalculate total quantity
                state.quantity = Object.values(state.sizeQuantities).reduce((sum, q) => sum + q, 0);
                
                // Update UI
                updateOrderCardItemsList();
                updateOrderCard();
                updatePricingSummary();
                updatePricingTiers();
                syncSizeSelectionUI();
                
                if (navigator.vibrate) navigator.vibrate(5);
            });
        });
        
        // Add event listeners for delete buttons (current selection only)
        listContainer.querySelectorAll('.order-item-delete:not(.basket-delete)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = btn.dataset.size;
                delete state.sizeQuantities[size];
                
                // Recalculate total quantity
                state.quantity = Object.values(state.sizeQuantities).reduce((sum, q) => sum + q, 0);
                
                // Update UI
                updateOrderCardItemsList();
                updateOrderCard();
                updatePricingSummary();
                updatePricingTiers();
                syncSizeSelectionUI();
                
                if (navigator.vibrate) navigator.vibrate(10);
                showToast('Item removed');
            });
        });
    }
    
    function syncSizeSelectionUI() {
        // Sync the size selection section with updated quantities
        // Since we use event delegation, no need to re-setup listeners
        updateSizeQuantities();
    }
    
    function calculateSubtotal() {
        const qty = state.quantity || 0;
        const unitPrice = getUnitPrice(qty);
        const garmentTotal = qty * unitPrice;
        
        // Calculate customization costs
        let customTotal = 0;
        if (state.positions && state.positions.length > 0) {
            state.positions.forEach(pos => {
                const method = state.positionMethods?.[pos] || 'embroidery';
                const card = document.querySelector(`.position-card[data-position="${pos}"], .position-card input[value="${pos}"]`)?.closest('.position-card');
                const price = method === 'print' 
                    ? parseFloat(card?.dataset?.print || 3.50)
                    : parseFloat(card?.dataset?.embroidery || 5.00);
                customTotal += price * qty;
            });
        }
        
        return garmentTotal + customTotal;
    }

    // === VAT Toggle Setup ===
    function setupVatToggle() {
        // VAT toggle click is handled by mobile.js
        // We just initialize state and listen for the global event
        state.vatIncluded = isVatOn();
        
        // Listen for VAT toggle changes from mobile.js
        window.addEventListener('vatToggleChanged', function(e) {
            state.vatIncluded = e.detail.vatOn;
            state.isVatToggling = true; // Flag to prevent auto-scroll
            updateVatToggleUI();
            updatePricingTiers();
            updatePricingSummary();
            updateOrderCardItemsList(); // Update item prices in order card
            updateOrderCard(); // Update order card total
            state.isVatToggling = false;
        });
    }

    // === Update Pricing Tiers Display ===
    function updatePricingTiers() {
        const tiersContainer = document.getElementById('pricingTiers');
        if (!tiersContainer) return;

        const tiers = [
            { min: 1, max: 9, label: '1-9' },
            { min: 10, max: 24, label: '10-24' },
            { min: 25, max: 49, label: '25-49' },
            { min: 50, max: 99, label: '50-99' },
            { min: 100, max: 249, label: '100-249' },
            { min: 250, max: Infinity, label: '250+' }
        ];

        // Use cumulative quantity (current + basket) for tier highlighting
        const basketQty = getBasketQuantityForProduct(state.product.code);
        const totalQty = state.quantity + basketQty;

        // Get priceBreaks DIRECTLY from API - no sessionStorage, no modifications
        const priceBreaks = state.product.priceBreaks || [];
        const vatOn = isVatOn();
        const basePrice = state.product.basePrice || state.product.price || 0;

        tiersContainer.innerHTML = tiers.map(tier => {
            // Find matching priceBreak from API by matching min value exactly
            let rawPrice = basePrice; // fallback to basePrice
            const matchingBreak = priceBreaks.find(pb => pb.min === tier.min);
            
            if (matchingBreak) {
                rawPrice = Number(matchingBreak.price || matchingBreak.unitPrice || matchingBreak.rate || basePrice);
            }
            
            // Apply VAT ONLY if VAT toggle is ON, otherwise use raw price
            const displayPrice = vatOn ? rawPrice * (1 + VAT_RATE) : rawPrice;
            
            // Calculate discount percentage compared to first tier (1-9)
            const firstTierBreak = priceBreaks.find(pb => pb.min === 1) || priceBreaks[0];
            const firstTierPrice = firstTierBreak ? Number(firstTierBreak.price || firstTierBreak.unitPrice || firstTierBreak.rate || basePrice) : basePrice;
            const discount = firstTierPrice > 0 && rawPrice < firstTierPrice 
                ? Math.round(((firstTierPrice - rawPrice) / firstTierPrice) * 100) 
                : 0;
            
            // Highlight tier based on TOTAL quantity (current + basket)
            const isActive = totalQty >= tier.min && (tier.max === Infinity || totalQty <= tier.max);
            
            return `
                <div class="tier-card ${isActive ? 'active' : ''}" data-min="${tier.min}" data-max="${tier.max === Infinity ? '999999' : tier.max}">
                    <div class="tier-qty">${tier.label}</div>
                    <div class="tier-price">£${displayPrice.toFixed(2)}</div>
                    <div class="tier-suffix">${vatSuffix()}</div>
                    ${discount > 0 ? `<div class="tier-save">SAVE ${discount}%</div>` : ''}
                </div>
            `;
        }).join('');
        
        // Update basket quantity notice
        const basketNotice = document.getElementById('basketQtyNotice');
        const basketQtyCount = document.getElementById('basketQtyCount');
        if (basketNotice && basketQtyCount) {
            if (basketQty > 0) {
                basketQtyCount.textContent = basketQty;
                basketNotice.style.display = 'flex';
            } else {
                basketNotice.style.display = 'none';
            }
        }
        
        // DISABLED: No auto-scroll - user stays where they are
        // if (state.quantity > 0 && !state.isSelectingPosition && !state.isVatToggling && !state.isUpdatingQuantity) {
        //     setTimeout(() => {
        //         const activeTier = tiersContainer.querySelector('.tier-card.active');
        //         if (activeTier) {
        //             const rect = activeTier.getBoundingClientRect();
        //             const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        //             if (!isVisible) {
        //                 activeTier.scrollIntoView({ 
        //                     behavior: 'smooth', 
        //                     block: 'nearest',
        //                     inline: 'center'
        //                 });
        //             }
        //         }
        //     }, 100);
        // }
    }

    // === Color Selection ===
    function setupColorSelection() {
        const colorOptions = document.getElementById('colorOptions');
        if (!colorOptions) {
            console.error('? colorOptions not found in setupColorSelection');
            return;
        }

        colorOptions.addEventListener('click', (e) => {
            const btn = e.target.closest('.color-btn');
            if (!btn) return;
            
            // Check if same color is clicked
            if (btn.dataset.color === state.selectedColor) return;

            if (isBasketSingleItemEdit()) {
                const prevColorId = state.selectedColor;
                applyColorChange(btn);
                if (prevColorId && btn.dataset.color && btn.dataset.color !== prevColorId) {
                    sessionStorage.setItem('basketEditNewColor', '1');
                    clearPositionState();
                    _autoSavedItemId = null;
                    _sessionSavedIds.clear();
                    state.selectionSaved = false;
                }
                return;
            }

            // Check if there are sizes selected
            const hasSelection = Object.values(state.sizeQuantities || {}).some(qty => qty > 0);
            
            // Only show confirmation if has selection AND not yet saved
            if (hasSelection && !state.selectionSaved) {
                showColorChangeConfirm(btn);
                return;
            }

            // If already saved or no selection, clear and proceed directly
            if (hasSelection && state.selectionSaved) {
                // Reset tracking so the next save doesn't overwrite the old colour's items
                _autoSavedItemId = null;
                _sessionSavedIds.clear();
                state.selectionSaved = false;
                clearSizeSelection();
            }
            
            applyColorChange(btn);
        });
    }
    
    // Auto-save and change color (no modal)
    function showColorChangeConfirm(btn) {
        // Auto-save current selection to basket
        if (state.quantity > 0) {
            addToQuote({ silent: true });
            showToast(`✓ ${state.quantity} pcs of ${state.selectedColorName || 'current colour'} saved to basket.`);
        }
        
        // CRITICAL: Reset save tracking so the NEW color doesn't overwrite the OLD one
        _autoSavedItemId = null;
        _sessionSavedIds.clear();
        
        // Clear sizes and apply color change
        clearSizeSelection();
        applyColorChange(btn);
    }
    
    // Clear all size selections and optionally positions
    function clearSizeSelection(clearPositions = true) {
        state.sizeQuantities = {};
        state.quantity = 0;
        
        // Remove all size rows from UI
        const selectedSizes = document.querySelector('.selected-sizes');
        if (selectedSizes) {
            selectedSizes.innerHTML = '';
        }
        
        // Update totals - show basket qty even when current selection is 0
        const totalSpan = document.getElementById('totalQty');
        if (totalSpan) {
            const basketQty = getBasketQuantityForProduct(state.product.code);
            totalSpan.textContent = basketQty;
        }
        
        // Also clear position selections when saving to quote
        if (clearPositions) {
            // Reset all position checkboxes
            document.querySelectorAll('.position-card input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    const card = checkbox.closest('.position-card');
                    if (card) {
                        card.classList.remove('selected');
                        // Reset badges
                        const embBadge = card.querySelector('.price-emb');
                        const printBadge = card.querySelector('.price-print');
                        if (embBadge) resetPriceBadge(embBadge);
                        if (printBadge) resetPriceBadge(printBadge);
                        
                        // Hide preview
                        const previewContent = card.querySelector('.position-preview-content');
                        const placeholder = card.querySelector('.position-placeholder');
                        const pill = card.querySelector('.customization-pill');
                        if (previewContent) previewContent.hidden = true;
                        if (placeholder) placeholder.hidden = false;
                        if (pill) pill.hidden = true;
                    }
                }
            });
            
            // Clear position state
            state.positions = [];
            state.positionMethods = {};
            state.positionCustomizations = {};
            state.positionDesigns = {};
        }
        
        updatePricingTiers();
        updatePricingSummary();
        updateLiveBadge();
        updateQuoteButtonState();

        // Re-build the size rows so user can pick sizes for the new colour
        rebuildSizeRows();
    }

    // Lightweight: re-create size rows without re-attaching container event listeners
    function rebuildSizeRows() {
        const container = document.querySelector('.size-qty-compact');
        if (!container) return;

        const selectedSizes = container.querySelector('.selected-sizes');
        if (selectedSizes) selectedSizes.innerHTML = '';

        const productSizes = getProductSizes();
        const isOneSize = productSizes.length === 1 &&
            (productSizes[0].toLowerCase() === 'one size' ||
             productSizes[0].toLowerCase() === 'onesize' ||
             productSizes[0].toLowerCase() === 'os');

        const addBtn = container.querySelector('.add-size-btn');

        if (isOneSize) {
            if (addBtn) addBtn.style.display = 'none';
            setTimeout(() => addOneSizeRow(container), 100);
        } else {
            if (addBtn) {
                addBtn.style.display = 'flex';
                // Re-clone to reset listener
                const newBtn = addBtn.cloneNode(true);
                addBtn.parentNode.replaceChild(newBtn, addBtn);
                newBtn.addEventListener('click', () => {
                    addSizeRow(container);
                    if (navigator.vibrate) navigator.vibrate(10);
                });
            }
            setTimeout(() => addSizeRow(container), 100);
        }

        updateSizeQuantities();
    }
    
    function syncColorSelectionUI(colorId) {
        const colorData = PRODUCT_COLORS.find(function (c) { return c.id === colorId; });
        if (!colorData) return;

        const colorOptions = document.getElementById('colorOptions');
        if (colorOptions) {
            colorOptions.querySelectorAll('.color-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.color === colorId);
            });
        }

        const galleryThumbsContainer = document.getElementById('galleryThumbsContainer') || document.querySelector('.gallery-thumbs');
        if (galleryThumbsContainer) {
            galleryThumbsContainer.querySelectorAll('.thumb').forEach(function (thumb) {
                const thumbColorId = thumb.getAttribute('data-color-id');
                if (thumbColorId) {
                    thumb.classList.toggle('active', thumbColorId === colorId);
                }
            });
            const activeThumb = galleryThumbsContainer.querySelector('.thumb.active');
            if (activeThumb) {
                const thumbLeft = activeThumb.offsetLeft - galleryThumbsContainer.offsetLeft;
                const centerOffset = thumbLeft - (galleryThumbsContainer.clientWidth / 2) + (activeThumb.offsetWidth / 2);
                galleryThumbsContainer.scrollTo({ left: centerOffset, behavior: 'smooth' });
            }
        }

        const selectedColorEl = document.getElementById('selectedColor');
        if (selectedColorEl) {
            selectedColorEl.textContent = colorData.name;
        }
    }

    // Apply color change
    function applyColorChange(btn) {
        const colorData = PRODUCT_COLORS.find(c => c.id === btn.dataset.color);
        if (!colorData) return;

        if (btn.dataset.color === state.selectedColor) {
            syncColorSelectionUI(state.selectedColor);
            return;
        }

        state.selectedColor = colorData.id;
        state.selectedColorName = colorData.name;
        state.selectedColorImage = colorData.image;
        if (window.BrandedColorHex && isUsableColorHex(colorData.hex)) {
            BrandedColorHex.register(colorData.name, colorData.hex, state.product && state.product.code);
        }

        const mainImage = document.getElementById('mainImage') || document.querySelector('.gallery-main img');
        if (mainImage && colorData.image) {
            mainImage.src = '';
            const cacheBuster = '_t=' + Date.now();
            mainImage.src = colorData.image + (colorData.image.includes('?') ? '&' : '?') + cacheBuster;
            if (state.product?.name) {
                mainImage.alt = state.product.name + ' - ' + colorData.name;
            }
        }

        syncColorSelectionUI(colorData.id);

        const applyTintFromColor = function () {
            if (window.BrandedColorHex && isUsableColorHex(colorData.hex)) {
                BrandedColorHex.register(colorData.name, colorData.hex, state.product && state.product.code);
            }
            applyGarmentColorToLogoPreview();
            applyGarmentColorToPositionPreviews();
        };

        if (isUsableColorHex(colorData.hex)) {
            applyTintFromColor();
        } else if (window.GarmentColorBehindScenes && (colorData.thumb || colorData.image)) {
            refreshGarmentLogoBackgroundBehindScenes().then(function (hex) {
                if (isUsableColorHex(hex)) {
                    colorData.hex = hex;
                }
                applyTintFromColor();
            });
        } else if (window.BrandedColorHex && (colorData.thumb || colorData.image)) {
            BrandedColorHex.sampleFromImage(colorData.thumb || colorData.image).then(function (hex) {
                if (isUsableColorHex(hex)) {
                    colorData.hex = hex;
                }
                applyTintFromColor();
            });
        } else {
            applyTintFromColor();
        }

        if (navigator.vibrate) navigator.vibrate(10);

        updatePricingSummary();

        scrollMobileCustomizeAfterColorPick();
    }

    /** True on mobile + tablet customize (skip desktop wide layout only). */
    function isCustomizeTouchViewport() {
        return window.matchMedia('(max-width: 1366px)').matches;
    }

    /**
     * After colour pick: scroll so Total Pieces sits just above the ATC bar.
     * Unit Price stays in view above (natural result when total bar is anchored to footer).
     * Runs on all products; mobile + tablet only.
     */
    function scrollMobileCustomizeAfterColorPick() {
        if (!isCustomizeTouchViewport()) return;

        const scrollToQtyAnchor = function () {
            const totalBar = document.querySelector('.qty-total-bar');
            const actionBar = document.querySelector('.action-bar--atc');
            if (!totalBar || !actionBar) return;

            const gapPx = 12;
            const scrollY = window.scrollY || window.pageYOffset || 0;
            const totalRect = totalBar.getBoundingClientRect();
            const actionRect = actionBar.getBoundingClientRect();
            let targetY = scrollY + totalRect.bottom - actionRect.top + gapPx;

            const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            targetY = Math.min(Math.max(0, targetY), maxY);

            if (Math.abs(targetY - scrollY) < 4) return;
            window.scrollTo({ top: targetY, left: 0, behavior: 'smooth' });
        };

        requestAnimationFrame(function () {
            requestAnimationFrame(scrollToQtyAnchor);
        });
        setTimeout(scrollToQtyAnchor, 120);
        setTimeout(scrollToQtyAnchor, 380);
    }

    // Render color buttons with product thumbnails
    function renderColorButtons() {
        const colorOptions = document.getElementById('colorOptions');
        if (!colorOptions) {
            console.error('? colorOptions element not found!');
            return;
        }
        
        debugLog('?? Rendering', PRODUCT_COLORS.length, 'colors...');
        debugLog('?? First color image:', PRODUCT_COLORS[0]?.image);
        
        if (PRODUCT_COLORS.length === 0) {
            debugWarn('?? No colors to render!');
            colorOptions.innerHTML = '<p style="color: #6b7280; padding: 16px;">No colors available</p>';
            return;
        }
        
        colorOptions.innerHTML = PRODUCT_COLORS.map((color, index) => {
            // Use color image with cache buster to prevent showing cached images from other products
            const imageUrl = color.image || '';
            const cacheBuster = imageUrl ? (imageUrl.includes('?') ? '&' : '?') + '_t=' + Date.now() + '_' + index : '';
            const fullImageUrl = imageUrl + cacheBuster;
            
            return `
            <button class="color-btn ${color.id === state.selectedColor ? 'active' : ''}" 
                    data-color="${color.id}" 
                    data-name="${color.name}"
                    style="background-image: url('${fullImageUrl}'); background-size: cover; background-position: center;">
                <svg class="color-check" width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <polyline points="20 6 9 17 4 12" stroke="white" stroke-width="3" fill="none"/>
                </svg>
            </button>
        `;
        }).join('');

        // Update color count
        const colorCount = document.querySelector('.color-count');
        if (colorCount) {
            colorCount.textContent = `${PRODUCT_COLORS.length} colors`;
        }
        
        // Re-render color thumbnails in gallery when colors are updated
        renderColorThumbnails();

        if (state.selectedColor) {
            syncColorSelectionUI(state.selectedColor);
        }
        
        debugLog('? Colors rendered successfully!');
    }

    // Render color thumbnails in gallery (showing different color variants)
    function renderColorThumbnails() {
        const galleryThumbsContainer = document.getElementById('galleryThumbsContainer') || document.querySelector('.gallery-thumbs');
        if (!galleryThumbsContainer) {
            debugWarn('?? Gallery thumbs container not found');
            return;
        }

        if (!PRODUCT_COLORS || PRODUCT_COLORS.length === 0) {
            debugWarn('?? No colors available for thumbnails');
            return;
        }

        debugLog('?? Rendering', PRODUCT_COLORS.length, 'color thumbnails in gallery...');

        // Clear existing thumbnails
        galleryThumbsContainer.innerHTML = '';

        // Create thumbnails for each color
        PRODUCT_COLORS.forEach((color, index) => {
            const isActive = color.id === state.selectedColor;
            const thumbButton = document.createElement('button');
            thumbButton.className = `thumb ${isActive ? 'active' : ''}`;
            thumbButton.setAttribute('data-color-id', color.id);
            thumbButton.setAttribute('data-color-index', index);
            
            const thumbPlaceholder = document.createElement('div');
            thumbPlaceholder.className = 'thumb-placeholder';
            
            const thumbImg = document.createElement('img');
            const imageUrl = color.thumb || color.image || '';
            if (imageUrl) {
                const cacheBuster = '_t=' + Date.now() + '_' + index;
                thumbImg.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + cacheBuster;
            }
            thumbImg.alt = `${state.product?.name || 'Product'} - ${color.name}`;
            
            thumbPlaceholder.appendChild(thumbImg);
            thumbButton.appendChild(thumbPlaceholder);
            
            // Add click handler to change main image and selected color
            thumbButton.addEventListener('click', () => {
                state.selectedColor = color.id;
                state.selectedColorName = color.name;
                state.selectedColorImage = color.image;

                const mainImg = document.getElementById('mainImage');
                if (mainImg && color.image) {
                    mainImg.src = '';
                    const cacheBuster = '_t=' + Date.now();
                    mainImg.src = color.image + (color.image.includes('?') ? '&' : '?') + cacheBuster;
                    mainImg.alt = `${state.product?.name || 'Product'} - ${color.name}`;
                }

                syncColorSelectionUI(color.id);
                applyGarmentColorToLogoPreview();
                applyGarmentColorToPositionPreviews();
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(10);
                
                // Update pricing summary
                updatePricingSummary();
            });
            
            galleryThumbsContainer.appendChild(thumbButton);
        });

        debugLog('? Color thumbnails rendered:', PRODUCT_COLORS.length);
    }

    // === Get product sizes from API or fallback ===
    function normalizeProductSizesFromApi(productData) {
        const raw = productData || {};

        const normalizeList = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) {
                return value
                    .map(v => String(v || '').trim())
                    .filter(Boolean);
            }
            if (typeof value === 'string') {
                // Split on commas/semicolons/pipes; keep single tokens intact (e.g. "ONESIZE")
                const parts = value.split(/[;,|]/g);
                const cleaned = parts.map(p => p.trim()).filter(Boolean);
                return cleaned.length ? cleaned : [value.trim()].filter(Boolean);
            }
            return [String(value).trim()].filter(Boolean);
        };

        const uniq = (arr) => {
            const out = [];
            const seen = new Set();
            arr.forEach(v => {
                const key = String(v).trim();
                if (!key) return;
                if (seen.has(key)) return;
                seen.add(key);
                out.push(key);
            });
            return out;
        };

        // Pull sizes from multiple possible fields.
        // NOTE: Some feeds use a misspelled "SIEZE" field.
        let sizes = [];
        sizes = sizes.concat(normalizeList(raw.sizes));
        sizes = sizes.concat(normalizeList(raw.SIZES));
        sizes = sizes.concat(normalizeList(raw.size));
        sizes = sizes.concat(normalizeList(raw.SIZE));
        sizes = sizes.concat(normalizeList(raw.SIEZE));
        sizes = sizes.concat(normalizeList(raw.sieze));

        // Some APIs store size info per variant/color.
        const variantList = Array.isArray(raw.variants) ? raw.variants : (Array.isArray(raw.colors) ? raw.colors : []);
        if (variantList && variantList.length) {
            variantList.forEach(v => {
                sizes = sizes.concat(normalizeList(v?.sizes));
                sizes = sizes.concat(normalizeList(v?.SIEZE));
                sizes = sizes.concat(normalizeList(v?.sieze));
                sizes = sizes.concat(normalizeList(v?.size));
            });
        }

        sizes = uniq(sizes);

        // If sizes are missing for one-size product types, force a single ONESIZE.
        const productType = String(raw.productType || raw.category || raw.type || '').trim().toLowerCase();
        const isOneSizeType = ['beanies', 'caps', 'aprons'].some(t => productType.includes(t));
        if ((!sizes || sizes.length === 0) && isOneSizeType) {
            return ['ONESIZE'];
        }

        return sizes || [];
    }

    function getProductSizes() {
        // Get sizes from product data
        let sizes = state.product?.sizes || [];
        
        debugLog('📐 getProductSizes() called - raw state.product.sizes:', state.product?.sizes);
        
        // Normalize: if it's a string, convert to array
        if (typeof sizes === 'string') {
            sizes = [sizes];
        }
        
        // If no sizes from API, try to detect one-size product types before falling back
        if (!sizes || sizes.length === 0) {
            const rawType = String(state.product?.rawData?.productType || state.product?.rawData?.category || state.product?.rawData?.type || '').trim().toLowerCase();
            const isOneSizeType = ['beanies', 'caps', 'aprons'].some(t => rawType.includes(t));
            sizes = isOneSizeType
                ? ['ONESIZE']
                : ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
            debugLog('📐 getProductSizes() - no sizes from API, using fallback:', sizes);
        }
        
        debugLog('📐 getProductSizes() returning:', sizes);
        return sizes;
    }

    // === Add "One size" row with plus/minus quantity selector ===
    function addOneSizeRow(container) {
        debugLog('📐 addOneSizeRow CALLED');
        const selectedSizes = container.querySelector('.selected-sizes');
        if (!selectedSizes) {
            console.error('❌ addOneSizeRow: .selected-sizes NOT FOUND in container!');
            return;
        }

        // Prefer whatever the API provided (e.g. ONESIZE/One Size/OS)
        const productSizes = getProductSizes();
        const sizeKey = (productSizes && productSizes[0]) ? String(productSizes[0]) : 'ONESIZE';
        const displayLabel = 'One Size';
        debugLog('📐 addOneSizeRow: Creating row with sizeKey=', sizeKey);
        
        const newRow = document.createElement('div');
        newRow.className = 'size-qty-item one-size-item';
        newRow.innerHTML = `
            <div class="one-size-label">${displayLabel}</div>
            <div class="item-qty-control">
                <button type="button" class="item-qty-btn minus">-</button>
                <input type="number" class="item-qty-input" value="0" min="0" max="999" data-size="${sizeKey}">
                <button type="button" class="item-qty-btn plus">+</button>
            </div>
        `;
        
        // Store the size value for quantity tracking
        newRow.dataset.size = sizeKey;
        
        selectedSizes.appendChild(newRow);
        debugLog('📐 addOneSizeRow: Row appended! Children count:', selectedSizes.children.length);
        updateSizeQuantities();
    }

    // === Size/Qty Compact Selection ===
    function setupSizeSelection() {
        debugLog('📐 setupSizeSelection CALLED');
        const container = document.querySelector('.size-qty-compact');
        if (!container) {
            console.error('❌ setupSizeSelection: .size-qty-compact container NOT FOUND!');
            return;
        }
        debugLog('📐 setupSizeSelection: container found');

        // Initialize state for size quantities
        state.sizeQuantities = {};

        // Clear any existing rows (in case browser cached them)
        const selectedSizes = container.querySelector('.selected-sizes');
        if (selectedSizes) {
            selectedSizes.innerHTML = '';
            debugLog('📐 setupSizeSelection: cleared existing rows');
        }

        // Get product sizes from API - fallback to default if not available
        const productSizes = getProductSizes();
        debugLog('📐 setupSizeSelection: productSizes =', productSizes);
        const isOneSize = productSizes.length === 1 && 
            (productSizes[0].toLowerCase() === 'one size' || 
             productSizes[0].toLowerCase() === 'onesize' ||
             productSizes[0].toLowerCase() === 'os');

        // Add size button
        const addBtn = container.querySelector('.add-size-btn');
        
        debugLog('📐 setupSizeSelection - productSizes:', productSizes, 'isOneSize:', isOneSize, 'addBtn found:', !!addBtn);
        
        if (isOneSize) {
            // For "One size" products: hide "Add Size" button and auto-create a row
            if (addBtn) {
                addBtn.style.display = 'none';
            }
            // Auto-add a "One size" row - use setTimeout to ensure it stays after all other init code
            setTimeout(() => {
                addOneSizeRow(container);
                debugLog('📐 Product is "One size" - auto-added row with quantity selector (delayed)');
            }, 500);
        } else {
            // For multi-size products: show "Add Size" button AND add first row automatically
            debugLog('📐 Multi-size product - showing Add Size button and adding first row');
            if (addBtn) {
                addBtn.style.display = 'flex';
                // Remove any existing listener to prevent duplicates
                const newBtn = addBtn.cloneNode(true);
                addBtn.parentNode.replaceChild(newBtn, addBtn);
                
                newBtn.addEventListener('click', () => {
                    addSizeRow(container);
                    if (navigator.vibrate) navigator.vibrate(10);
                });
            }
            // Auto-add first size row so user can immediately select size & qty - delayed to ensure it stays
            setTimeout(() => {
                addSizeRow(container);
                debugLog('📐 First size row auto-added for multi-size product (delayed)');
            }, 500);
        }

        // Event delegation for size/qty items
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.item-qty-btn');
            if (btn) {
                const row = btn.closest('.size-qty-item');
                const sizeSelect = row.querySelector('.size-select');
                // Block qty change if no size selected
                if (sizeSelect && (!sizeSelect.value || sizeSelect.value === '')) {
                    showToast('Please select a size first', true, row);
                    sizeSelect.focus();
                    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                    return;
                }
                const input = row.querySelector('.item-qty-input');
                const isPlus = btn.classList.contains('plus');
                let value = parseInt(input.value) || 0;
                
                if (isPlus && value < 999) {
                    value++;
                } else if (!isPlus && value > 0) {
                    value--;
                }
                
                input.value = value;
                updateSizeQuantities();
                if (navigator.vibrate) navigator.vibrate(10);
            }

            const removeBtn = e.target.closest('.remove-size-btn');
            if (removeBtn) {
                const row = removeBtn.closest('.size-qty-item');
                row.remove();
                updateAvailableSizes(container);
                updateSizeQuantities();
                if (navigator.vibrate) navigator.vibrate(10);
            }


        });

    // Extra listeners to ensure any direct input/change triggers a quantities recalculation
    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-qty-input')) {
            const row = e.target.closest('.size-qty-item');
            const sizeSelect = row && row.querySelector('.size-select');
            if (sizeSelect && (!sizeSelect.value || sizeSelect.value === '')) {
                e.target.value = 0;
                showToast('Please select a size first', true, row);
                sizeSelect.focus();
                if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                return;
            }
        }
        updateSizeQuantities();
    });
    container.addEventListener('change', () => updateSizeQuantities());

        // Event delegation for select and input changes
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('size-select') || e.target.classList.contains('item-qty-input')) {
                updateSizeQuantities();
            }
        });

        // Save Selection button removed — auto-save on color change / Add to Quote

        // Initial update
        updateSizeQuantities();
    }

    function addSizeRow(container) {
        const selectedSizes = container.querySelector('.selected-sizes');
        
        // Get already selected sizes for this color
        const alreadySelected = new Set();
        selectedSizes.querySelectorAll('.size-select').forEach(select => {
            if (select.value) {
                alreadySelected.add(select.value);
            }
        });
        
        const newRow = document.createElement('div');
        newRow.className = 'size-qty-item';
        
        // Build options excluding already selected sizes - use product sizes from API
        let optionsHTML = '<option value="">Size</option>';
        const allSizes = getProductSizes();
        allSizes.forEach(size => {
            if (!alreadySelected.has(size)) {
                optionsHTML += `<option value="${size}">${size}</option>`;
            }
        });
        
        newRow.innerHTML = `
            <select class="size-select">
                ${optionsHTML}
            </select>
            <div class="item-qty-control">
                <button type="button" class="item-qty-btn minus">-</button>
                <input type="number" class="item-qty-input" value="0" min="0" max="999">
                <button type="button" class="item-qty-btn plus">+</button>
            </div>
            <button type="button" class="remove-size-btn">×</button>
        `;
        
        // Add event listener to update available sizes when a size is selected
        const select = newRow.querySelector('.size-select');
        select.addEventListener('change', function() {
            updateAvailableSizes(container);
        });
        
        selectedSizes.appendChild(newRow);
        updateSizeQuantities();
    }

    // New function to update available sizes across all dropdowns
    function updateAvailableSizes(container) {
        const selectedSizes = container.querySelector('.selected-sizes');
        const allSelects = selectedSizes.querySelectorAll('.size-select');
        const allSizes = getProductSizes(); // Use product sizes from API
        
        // Collect all selected sizes
        const selected = new Set();
        allSelects.forEach(select => {
            if (select.value) {
                selected.add(select.value);
            }
        });
        
        // Update each select to show only available options
        allSelects.forEach(currentSelect => {
            const currentValue = currentSelect.value;
            
            // Build new options
            let optionsHTML = '<option value="">Size</option>';
            allSizes.forEach(size => {
                if (size === currentValue || !selected.has(size)) {
                    const selectedAttr = size === currentValue ? ' selected' : '';
                    optionsHTML += `<option value="${size}"${selectedAttr}>${size}</option>`;
                }
            });
            
            currentSelect.innerHTML = optionsHTML;
        });
    }

    function updateSizeQuantities() {
        const container = document.querySelector('.size-qty-compact');
        if (!container) return;

        debugLog('DEBUG: updateSizeQuantities called');
        try { debugLog('DEBUG: container exists?', !!container, 'selected sizes count=', container.querySelectorAll('.size-qty-item').length); } catch(e){}

        let total = 0;
        state.sizeQuantities = {};

        container.querySelectorAll('.size-qty-item').forEach(row => {
            const select = row.querySelector('.size-select');
            const input = row.querySelector('.item-qty-input');
            
            // Get size from select OR from data attribute (for "One size" rows)
            let size = '';
            if (select) {
                size = select.value;
            } else if (row.dataset.size) {
                size = row.dataset.size;
            } else if (input && input.dataset.size) {
                size = input.dataset.size;
            }
            
            // Primary: read from input.value
            let qty = 0;
            try {
                if (input) {
                    // prefer numeric value property
                    qty = parseInt(input.value || input.getAttribute('value') || 0) || 0;
                }
            } catch (e) {
                qty = 0;
            }

            // Fallback: some UI variants render the qty as plain text inside buttons/divs
            if ((!qty || qty === 0) && row) {
                // look for data attributes first
                const dataVal = row.querySelector('[data-qty], [data-value]');
                if (dataVal) {
                    const v = dataVal.getAttribute('data-qty') || dataVal.getAttribute('data-value');
                    qty = parseInt(v) || qty;
                }
            }

            if ((!qty || qty === 0) && row) {
                // look for any child element that contains only digits (visible number)
                const children = Array.from(row.querySelectorAll('*'));
                for (const el of children) {
                    try {
                        const text = (el.innerText || '').trim();
                        if (/^\d+$/.test(text)) {
                            qty = parseInt(text, 10) || qty;
                            break;
                        }
                    } catch (e) { /* ignore */ }
                }
            }

            // If no explicit size selected but a quantity exists, count it under 'unspecified'
            let sizeKey = size;
            if ((!sizeKey || sizeKey === '') && qty > 0) {
                sizeKey = 'unspecified';
                debugLog('DEBUG: size not selected for a row but quantity present - counting under "unspecified"');
            }

            if (sizeKey && qty > 0) {
                state.sizeQuantities[sizeKey] = (state.sizeQuantities[sizeKey] || 0) + qty;
                total += qty;
            }
        });

        // Update total display - show current selection only
        const totalSpan = document.getElementById('totalQty');
        if (totalSpan) {
            totalSpan.textContent = total;
        }

        // Update global quantity for pricing
        state.quantity = total;
        
        // Save button removed — hide it if it still exists in DOM
        const saveBtn = document.getElementById('saveSelectionBtn');
        if (saveBtn) {
            saveBtn.style.display = 'none';
        }
        
        // Track selection state
        state.selectionSaved = total === 0;
        
        // Set flag to prevent auto-scroll when updating quantities
        state.isUpdatingQuantity = true;
        try { updatePricingTiers(); } catch (e) { console.error('updatePricingTiers error:', e); }
        try { updatePricingSummary(); } catch (e) { console.error('updatePricingSummary error:', e); }
        state.isUpdatingQuantity = false;
        
        // Update live badge with current selection
        updateLiveBadge();
        
        // Update Add to Quote button state
        updateQuoteButtonState();

        // Restart auto-save timer (saves to basket after 3s of inactivity)
        resetAutoSaveTimer();
    }

    // === Quantity Control ===
    function setupQuantityControl() {
        if (!elements.qtyInput) return;

        elements.qtyMinus?.addEventListener('click', () => {
            const current = parseInt(elements.qtyInput.value) || 1;
            if (current > 1) {
                state.quantity = current - 1;
                elements.qtyInput.value = state.quantity;
                updatePricingTier();
                updatePricingSummary();
            }
        });

        elements.qtyPlus?.addEventListener('click', () => {
            const current = parseInt(elements.qtyInput.value) || 1;
            if (current < 9999) {
                state.quantity = current + 1;
                elements.qtyInput.value = state.quantity;
                updatePricingTier();
                updatePricingSummary();
            }
        });

        elements.qtyInput.addEventListener('change', () => {
            let value = parseInt(elements.qtyInput.value) || 1;
            value = Math.max(1, Math.min(9999, value));
            state.quantity = value;
            elements.qtyInput.value = value;
            updatePricingTier();
            updatePricingSummary();
        });
    }

    // === Pricing Tier ===
    function updatePricingTier() {
        if (!elements.pricingTiers) return;

        // Support both old (.pricing-tier) and new (.tier-card) selectors
        const tiers = elements.pricingTiers.querySelectorAll('.tier-card, .pricing-tier');
        
        tiers.forEach(tier => {
            const min = parseInt(tier.dataset.min) || 0;
            const max = parseInt(tier.dataset.max) || 999999;
            const isActive = state.quantity >= min && state.quantity <= max;
            tier.classList.toggle('active', isActive);
        });
    }

    function getCurrentUnitPrice() {
        const calculated = getDiscountedUnitPrice(state.quantity);
        
        // Fallback: read price from active tier badge in the UI
        // (ensures we always use the price the user SEES)
        const activeTier = document.querySelector('.tier-card.active .tier-price, .pricing-tier.active .tier-price');
        if (activeTier) {
            const tierText = activeTier.textContent || '';
            const match = tierText.match(/[\d.]+/);
            if (match) {
                const uiPrice = parseFloat(match[0]);
                // Use UI price if calculated seems wrong (equals base price but tier is active)
                if (uiPrice > 0 && uiPrice < calculated) {
                    debugLog('?? Using UI tier price:', uiPrice, 'instead of calculated:', calculated);
                    return uiPrice;
                }
            }
        }
        
        return calculated;
    }

    // === Technique Selection ===
    function setupTechniqueSelection() {
        if (!elements.techniqueOptions) return;

        elements.techniqueOptions.addEventListener('click', (e) => {
            // Support both old .technique-btn and new .technique-pill
            const btn = e.target.closest('.technique-btn, .technique-pill');
            if (!btn) return;

            // Update state
            state.technique = btn.dataset.technique;
            
            // Update UI
            elements.techniqueOptions.querySelectorAll('.technique-btn, .technique-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update description (if exists)
            if (elements.techniqueDesc) {
                elements.techniqueDesc.innerHTML = `<p>${state.techniqueDescriptions[state.technique]}</p>`;
            }

            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(10);

            updatePricingSummary();
        });
    }

    // === Quick Upload ===
    function setupQuickUpload() {
        const uploadInput = document.getElementById('quickLogoUpload');
        const previewContainer = document.getElementById('quickUploadPreview');
        const previewImg = document.getElementById('quickPreviewImg');
        const uploadZone = document.getElementById('quickUploadZone');
        const removeBtn = document.getElementById('removeUpload');
        
        if (!uploadInput) return;

        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Show preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    previewImg.src = ev.target.result;
                    previewContainer.style.display = 'flex';
                    uploadZone.querySelector('.upload-prompt').style.display = 'none';
                };
                reader.readAsDataURL(file);
            } else {
                // For non-image files, show filename
                previewImg.src = '';
                previewImg.alt = file.name;
                previewContainer.style.display = 'flex';
                uploadZone.querySelector('.upload-prompt').style.display = 'none';
            }

            state.uploadedLogo = file;
            if (navigator.vibrate) navigator.vibrate(10);
            showToast('Logo uploaded!');
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                uploadInput.value = '';
                previewContainer.style.display = 'none';
                uploadZone.querySelector('.upload-prompt').style.display = 'flex';
                state.uploadedLogo = null;
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }
    }

    // === Delete Logo Buttons in Position Cards ===
    function setupDeleteLogoButtons() {
        document.querySelectorAll('.delete-logo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.position-card');
                if (!card) return;
                
                const checkbox = card.querySelector('input[type="checkbox"]');
                const position = card.dataset.position || checkbox?.value;
                
                // Deseleziona la checkbox e triggera il reset completo
                if (checkbox && checkbox.checked) {
                    checkbox.checked = false;
                    checkbox.dispatchEvent(new Event('change'));
                }
                
                // Hide the logo from product preview
                const uploadedLogoPreview = card.querySelector('.uploaded-logo-preview');
                if (uploadedLogoPreview) {
                    uploadedLogoPreview.src = '';
                    uploadedLogoPreview.hidden = true;
                }
                
                // Hide the logo container below product
                const uploadedLogoContainer = card.querySelector('.uploaded-logo-container');
                if (uploadedLogoContainer) {
                    uploadedLogoContainer.hidden = true;
                }
                
                // Reset uploaded logo thumb
                const uploadedLogoThumb = card.querySelector('.uploaded-logo-thumb');
                if (uploadedLogoThumb) {
                    uploadedLogoThumb.src = '';
                }
                
                // Reset customization pill
                const pill = card.querySelector('.customization-pill');
                if (pill) {
                    pill.hidden = true;
                }
                
                // Reset logo added pill
                const logoAddedPill = card.querySelector('.logo-added-pill');
                if (logoAddedPill) {
                    logoAddedPill.hidden = true;
                }
                
                // Remove from state
                if (state.positionDesigns && state.positionDesigns[position]) {
                    delete state.positionDesigns[position];
                }
                if (state.positionCustomizations && state.positionCustomizations[position]) {
                    delete state.positionCustomizations[position];
                }
                if (state.positionMethods && state.positionMethods[position]) {
                    delete state.positionMethods[position];
                }
                
                // Reset price badges
                const embBadge = card.querySelector('.price-emb');
                const printBadge = card.querySelector('.price-print');
                if (embBadge) {
                    embBadge.classList.remove('active', 'add-logo-btn', 'logo-added');
                    embBadge.dataset.role = 'method';
                }
                if (printBadge) {
                    printBadge.classList.remove('active', 'add-logo-btn', 'logo-added');
                    printBadge.dataset.role = 'method';
                }
                
                // Update pricing
                updatePricingTiers();
                updatePricingSummary();
                
                // Show toast
                showToast('Customization removed');
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(10);
            });
        });
    }

    // === Position Selection ===
    function setupPositionSelection() {
        const cards = document.querySelectorAll('.position-card');
        debugLog('?? setupPositionSelection called. Found', cards.length, 'position cards');
        
        cards.forEach(card => {
            const checkbox = card.querySelector('input[type="checkbox"]');
            const position = checkbox ? checkbox.value : null;
            
            if (!position) {
                debugWarn('?? Card missing checkbox or position value:', card);
                return;
            }
            
            debugLog('? Setting up position:', position);
            
            // Initialize position method storage
            if (!state.positionMethods) {
                state.positionMethods = {};
            }
            
            // Click handler for price badges (EMBROIDERY/PRINT buttons)
            card.querySelectorAll('.price-badge').forEach(badge => {
                debugLog('?? Attaching click handler to badge:', badge.dataset.method, 'for position:', position);
                badge.addEventListener('click', (e) => {
                    debugLog('??? BADGE CLICKED!', badge.dataset.method, 'for position:', position);
                    e.stopPropagation();
                    
                    const role = badge.dataset.role || 'method';
                    
                    // Handle "Add Logo" button click
                    if (role === 'add-logo') {
                        const activeMethod = badge.dataset.activeMethod || state.positionMethods[position];
                        if (!activeMethod) return;
                        
                        if (!checkbox.checked) {
                            checkbox.checked = true;
                            checkbox.dispatchEvent(new Event('change'));
                        }
                        
                        // Open customization modal
                        openCustomizationModal(position, activeMethod);
                        return;
                    }
                    
                    const method = badge.dataset.method; // 'embroidery' or 'print'
                    if (!method) return;
                    
                    // Check if this is a POA badge (disabled for embroidery on large positions)
                    const isPOA = badge.classList.contains('poa-badge') || badge.querySelector('.price-value')?.textContent === 'POA';
                    if (isPOA) {
                        // Show toast notification for POA
                        showToast('Price On Application - Contact us for a custom quote');
                        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
                        return; // Don't allow selection
                    }
                    
                    // Check if this badge is already active (allow toggle off)
                    const isCurrentlyActive = badge.classList.contains('active');
                    
                    if (isCurrentlyActive) {
                        // Deselect: uncheck the position and reset
                        checkbox.checked = false;
                        card.classList.remove('selected');
                        
                        // Reset badges
                        const embBadge = card.querySelector('.price-emb');
                        const printBadge = card.querySelector('.price-print');
                        resetPriceBadge(embBadge);
                        resetPriceBadge(printBadge);
                        
                        // Clear position method and customization data
                        delete state.positionMethods[position];
                        if (state.positionCustomizations) {
                            delete state.positionCustomizations[position];
                        }
                        if (state.positionDesigns) {
                            delete state.positionDesigns[position];
                        }
                        
                        // Hide and clear customization preview
                        const previewContent = card.querySelector('.position-preview-content');
                        const placeholder = card.querySelector('.position-placeholder');
                        const pill = card.querySelector('.customization-pill');
                        const previewImage = card.querySelector('.preview-image');
                        const previewText = card.querySelector('.preview-text');
                        
                        // Pulisci anche il logo overlay sul prodotto
                        const logoOverlayBox = card.querySelector('.logo-overlay-box');
                        const logoOverlayImg = card.querySelector('.logo-overlay-img');
                        if (logoOverlayBox) {
                            logoOverlayBox.hidden = true;
                        }
                        if (logoOverlayImg) {
                            logoOverlayImg.src = '';
                        }
                        
                        if (previewContent) previewContent.hidden = true;
                        if (placeholder) placeholder.hidden = false;
                        if (pill) pill.hidden = true;
                        
                        // Pulisci anche i contenuti dell'anteprima
                        if (previewImage) {
                            previewImage.src = '';
                            previewImage.hidden = true;
                        }
                        if (previewText) {
                            previewText.textContent = '';
                            previewText.hidden = true;
                        }
                        
                        // Update positions array
                        state.positions = Array.from(
                            document.querySelectorAll('.position-card input:checked')
                        ).map(input => input.value);
                        
                        // Haptic feedback
                        if (navigator.vibrate) navigator.vibrate(10);
                        
                        // Update pricing
                        updatePricingTiers();
                        updatePricingSummary();
                        return;
                    }
                    
                    // Store selected method for this position
                    state.positionMethods[position] = method;
                    debugLog('?? METHOD SELECTED!', position, '=', method);
                    debugLog('?? Current positionMethods:', JSON.stringify(state.positionMethods));
                    
                    // Save state immediately for persistence
                    saveCustomizationState();
                    
                    // Apply method UI (transform other badge to "Add Logo")
                    applyMethodUI(card, method);
                    
                    // Auto-check the checkbox if not already checked
                    if (!checkbox.checked) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change'));
                    }

                    // Logo upload / existing-logo picker — only after method is chosen
                    openCustomizationTypeModal(position, method);
                    
                    // Haptic feedback
                    if (navigator.vibrate) navigator.vibrate(10);
                    
                    // Update pricing
                    updatePricingSummary();
                });
            });
            
            // Checkbox change handler
            checkbox.addEventListener('change', () => {
                // Set flag to prevent auto-scroll during position selection
                state.isSelectingPosition = true;
                
                if (checkbox.checked) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                    // Reset badges when unchecked
                    const embBadge = card.querySelector('.price-emb');
                    const printBadge = card.querySelector('.price-print');
                    resetPriceBadge(embBadge);
                    resetPriceBadge(printBadge);
                    delete state.positionMethods[position];
                    
                    // Also clear customization data
                    if (state.positionCustomizations) {
                        delete state.positionCustomizations[position];
                    }
                    if (state.positionDesigns) {
                        delete state.positionDesigns[position];
                    }
                    
                    // Hide and clear customization preview
                    const previewContent = card.querySelector('.position-preview-content');
                    const placeholder = card.querySelector('.position-placeholder');
                    const pill = card.querySelector('.customization-pill');
                    const previewImage = card.querySelector('.preview-image');
                    const previewText = card.querySelector('.preview-text');
                    
                    // Pulisci anche il logo overlay sul prodotto
                    const logoOverlayBox = card.querySelector('.logo-overlay-box');
                    const logoOverlayImg = card.querySelector('.logo-overlay-img');
                    if (logoOverlayBox) {
                        logoOverlayBox.hidden = true;
                    }
                    if (logoOverlayImg) {
                        logoOverlayImg.src = '';
                    }
                    
                    if (previewContent) previewContent.hidden = true;
                    if (placeholder) placeholder.hidden = false;
                    if (pill) pill.hidden = true;
                    
                    // Pulisci anche i contenuti dell'anteprima
                    if (previewImage) {
                        previewImage.src = '';
                        previewImage.hidden = true;
                    }
                    if (previewText) {
                        previewText.textContent = '';
                        previewText.hidden = true;
                    }
                }
                
                // Update state
                state.positions = Array.from(
                    document.querySelectorAll('.position-card input:checked')
                ).map(input => input.value);
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(10);
                
                updatePricingTiers();
                updatePricingSummary();
                
                // Reset flag after a delay
                setTimeout(() => {
                    state.isSelectingPosition = false;
                }, 500);
            });
            
            // Click handler on card itself - only deselect if NO logo is loaded
            card.addEventListener('click', (e) => {
                // Ignore clicks on interactive elements
                if (e.target.closest('.price-badge') || 
                    e.target.closest('.preview-delete-btn') ||
                    e.target.closest('input[type="checkbox"]') ||
                    e.target.closest('.position-checkbox')) {
                    return;
                }
                
                // Check if there's a logo loaded - if so, do nothing (user must use bin to remove)
                const logoOverlayBox = card.querySelector('.logo-overlay-box');
                const logoOverlayImg = card.querySelector('.logo-overlay-img');
                const hasLogo = logoOverlayBox && !logoOverlayBox.hidden && logoOverlayImg && logoOverlayImg.src;
                
                // Also check if there's customization data
                const hasCustomization = state.positionCustomizations && 
                                         state.positionCustomizations[position] && 
                                         (state.positionCustomizations[position].logo || 
                                          state.positionCustomizations[position].text);
                
                // If logo is loaded, don't allow deselection via card click
                if (hasLogo || hasCustomization) {
                    return; // User must use the bin button to remove
                }
                
                // If position is selected but NO logo, allow deselection
                if (checkbox.checked) {
                    // Deselect: uncheck the position and reset
                    checkbox.checked = false;
                    card.classList.remove('selected');
                    
                    // Reset badges
                    const embBadge = card.querySelector('.price-emb');
                    const printBadge = card.querySelector('.price-print');
                    resetPriceBadge(embBadge);
                    resetPriceBadge(printBadge);
                    
                    // Clear position method and customization data
                    delete state.positionMethods[position];
                    if (state.positionCustomizations) {
                        delete state.positionCustomizations[position];
                    }
                    if (state.positionDesigns) {
                        delete state.positionDesigns[position];
                    }
                    
                    // Hide and clear customization preview
                    const previewContent = card.querySelector('.position-preview-content');
                    const placeholder = card.querySelector('.position-placeholder');
                    const pill = card.querySelector('.customization-pill');
                    const previewImage = card.querySelector('.preview-image');
                    const previewText = card.querySelector('.preview-text');
                    
                    // Pulisci anche il logo overlay sul prodotto
                    if (logoOverlayBox) {
                        logoOverlayBox.hidden = true;
                    }
                    if (logoOverlayImg) {
                        logoOverlayImg.src = '';
                    }
                    
                    if (previewContent) previewContent.hidden = true;
                    if (placeholder) placeholder.hidden = false;
                    if (pill) pill.hidden = true;
                    
                    // Pulisci anche i contenuti dell'anteprima
                    if (previewImage) {
                        previewImage.src = '';
                        previewImage.hidden = true;
                    }
                    if (previewText) {
                        previewText.textContent = '';
                        previewText.hidden = true;
                    }
                    
                    // Update positions array
                    state.positions = Array.from(
                        document.querySelectorAll('.position-card input:checked')
                    ).map(input => input.value);
                    
                    // Haptic feedback
                    if (navigator.vibrate) navigator.vibrate(10);
                    
                    // Update pricing
                    updatePricingTiers();
                    updatePricingSummary();
                }
            });
            
            // Click handler for preview delete button (cestino)
            const deleteBtn = card.querySelector('.preview-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Deselect the card
                    checkbox.checked = false;
                    checkbox.dispatchEvent(new Event('change'));
                    
                    // Show toast feedback
                    showToast('Customization removed');
                    
                    // Haptic feedback
                    if (navigator.vibrate) navigator.vibrate(10);
                });
            }
            
            // Logo drag disabled - logos are now fixed in predefined positions
            // const logoOverlayBox = card.querySelector('.logo-overlay-box');
            // if (logoOverlayBox) {
            //     setupLogoDrag(logoOverlayBox, card);
            // }
        });
    }
    
    // === Logo Drag & Drop ===
    function setupLogoDrag(logoBox, card) {
        let isDragging = false;
        let isPinching = false;
        let isActive = false;
        let startX, startY;
        let initialLeft, initialTop;
        let initialDistance, initialWidth, initialHeight;
        let activeTimeout;
        const preview = card.querySelector('.position-preview');
        
        // Calculate distance between two touch points
        function getTouchDistance(touches) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
        
        // Get center point between two touches
        function getTouchCenter(touches) {
            return {
                x: (touches[0].clientX + touches[1].clientX) / 2,
                y: (touches[0].clientY + touches[1].clientY) / 2
            };
        }
        
        // Lock scroll
        function lockScroll() {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            document.documentElement.style.overflow = 'hidden';
        }
        
        // Unlock scroll
        function unlockScroll() {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.documentElement.style.overflow = '';
        }
        
        // Activate logo editing mode
        function activateLogo() {
            isActive = true;
            logoBox.classList.add('active');
            lockScroll();
            if (navigator.vibrate) navigator.vibrate(15);
        }
        
        // Deactivate logo editing mode
        function deactivateLogo() {
            isActive = false;
            logoBox.classList.remove('active');
            unlockScroll();
        }
        
        // Deactivate frame after delay (only if not dragging/pinching)
        function deactivateFrame() {
            clearTimeout(activeTimeout);
            activeTimeout = setTimeout(() => {
                if (!isDragging && !isPinching) {
                    deactivateLogo();
                }
            }, 2000);
        }
        
        // Touch start - handle both drag (1 finger) and pinch (2 fingers)
        logoBox.addEventListener('touchstart', (e) => {
            if (logoBox.hidden) return;
            e.preventDefault();
            e.stopPropagation();
            
            clearTimeout(activeTimeout);
            
            // Toggle active state on single tap
            if (!isActive) {
                activateLogo();
            }
            
            if (e.touches.length === 2) {
                // Pinch to resize
                isPinching = true;
                isDragging = false;
                logoBox.classList.add('resizing');
                logoBox.classList.remove('dragging');
                
                initialDistance = getTouchDistance(e.touches);
                initialWidth = logoBox.offsetWidth;
                initialHeight = logoBox.offsetHeight;
                
                if (navigator.vibrate) navigator.vibrate(10);
            } else if (e.touches.length === 1) {
                // Single finger drag
                isDragging = true;
                isPinching = false;
                logoBox.classList.add('dragging');
                logoBox.classList.remove('resizing');
                
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                
                const rect = logoBox.getBoundingClientRect();
                const parentRect = preview.getBoundingClientRect();
                initialLeft = rect.left - parentRect.left;
                initialTop = rect.top - parentRect.top;
                
                logoBox.style.left = initialLeft + 'px';
                logoBox.style.top = initialTop + 'px';
                logoBox.style.right = 'auto';
                logoBox.style.transform = 'none';
            }
        }, { passive: false });
        
        // Touch move - drag or pinch
        logoBox.addEventListener('touchmove', (e) => {
            if (!isDragging && !isPinching) return;
            e.preventDefault();
            e.stopPropagation();
            
            if (isPinching && e.touches.length === 2) {
                // Pinch to resize - smooth sensitivity
                const currentDistance = getTouchDistance(e.touches);
                const distanceChange = currentDistance - initialDistance;
                
                // Balanced sensitivity (2x - smooth and controlled)
                const sensitivity = 2;
                const sizeChange = distanceChange * sensitivity;
                
                const parentRect = preview.getBoundingClientRect();
                const logoLeft = parseFloat(logoBox.style.left) || 0;
                const logoTop = parseFloat(logoBox.style.top) || 0;
                
                // Calculate new size based on distance change
                let newSize = Math.max(15, initialWidth + sizeChange);
                
                // Constrain to parent bounds and max size
                const maxWidth = parentRect.width - logoLeft;
                const maxHeight = parentRect.height - logoTop;
                newSize = Math.min(newSize, maxWidth, maxHeight, 180);
                
                logoBox.style.width = newSize + 'px';
                logoBox.style.height = newSize + 'px';
                
            } else if (isDragging && e.touches.length === 1) {
                // Single finger drag
                const touch = e.touches[0];
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;
                
                const parentRect = preview.getBoundingClientRect();
                const boxWidth = logoBox.offsetWidth;
                const boxHeight = logoBox.offsetHeight;
                
                let newLeft = initialLeft + deltaX;
                let newTop = initialTop + deltaY;
                
                newLeft = Math.max(0, Math.min(newLeft, parentRect.width - boxWidth));
                newTop = Math.max(0, Math.min(newTop, parentRect.height - boxHeight));
                
                logoBox.style.left = newLeft + 'px';
                logoBox.style.top = newTop + 'px';
            }
        }, { passive: false });
        
        // Touch end
        logoBox.addEventListener('touchend', (e) => {
            if (!isDragging && !isPinching) return;
            
            // If we still have 2 fingers, don't end pinch yet
            if (e.touches.length >= 1 && isPinching) {
                // Switch to drag mode with remaining finger
                isPinching = false;
                isDragging = true;
                logoBox.classList.remove('resizing');
                logoBox.classList.add('dragging');
                
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                
                const rect = logoBox.getBoundingClientRect();
                const parentRect = preview.getBoundingClientRect();
                initialLeft = rect.left - parentRect.left;
                initialTop = rect.top - parentRect.top;
                return;
            }
            
            isDragging = false;
            isPinching = false;
            logoBox.classList.remove('dragging', 'resizing');
            
            deactivateFrame();
            
            // Save position and size to state
            const position = card.dataset.position || card.querySelector('input[type="checkbox"]')?.value;
            if (position && state.positionDesigns && state.positionDesigns[position]) {
                state.positionDesigns[position].logoPosition = {
                    left: logoBox.style.left,
                    top: logoBox.style.top,
                    width: logoBox.style.width,
                    height: logoBox.style.height
                };
            }
            
            if (navigator.vibrate) navigator.vibrate(5);
        });
        
        // Mouse support for desktop testing
        logoBox.addEventListener('mousedown', (e) => {
            if (logoBox.hidden) return;
            e.preventDefault();
            e.stopPropagation();
            
            clearTimeout(activeTimeout);
            
            if (!isActive) {
                activateLogo();
            }
            
            isDragging = true;
            logoBox.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = logoBox.getBoundingClientRect();
            const parentRect = preview.getBoundingClientRect();
            initialLeft = rect.left - parentRect.left;
            initialTop = rect.top - parentRect.top;
            
            logoBox.style.left = initialLeft + 'px';
            logoBox.style.top = initialTop + 'px';
            logoBox.style.right = 'auto';
            logoBox.style.transform = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const parentRect = preview.getBoundingClientRect();
            const boxWidth = logoBox.offsetWidth;
            const boxHeight = logoBox.offsetHeight;
            
            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;
            
            newLeft = Math.max(0, Math.min(newLeft, parentRect.width - boxWidth));
            newTop = Math.max(0, Math.min(newTop, parentRect.height - boxHeight));
            
            logoBox.style.left = newLeft + 'px';
            logoBox.style.top = newTop + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            logoBox.classList.remove('dragging');
            
            deactivateFrame();
            
            const position = card.dataset.position || card.querySelector('input[type="checkbox"]')?.value;
            if (position && state.positionDesigns && state.positionDesigns[position]) {
                state.positionDesigns[position].logoPosition = {
                    left: logoBox.style.left,
                    top: logoBox.style.top,
                    width: logoBox.style.width,
                    height: logoBox.style.height
                };
            }
        });
        
        // Mouse wheel for resize on desktop
        logoBox.addEventListener('wheel', (e) => {
            if (logoBox.hidden) return;
            e.preventDefault();
            
            clearTimeout(activeTimeout);
            if (!isActive) activateLogo();
            
            const parentRect = preview.getBoundingClientRect();
            const logoLeft = parseFloat(logoBox.style.left) || 0;
            const logoTop = parseFloat(logoBox.style.top) || 0;
            
            const currentWidth = logoBox.offsetWidth;
            const currentHeight = logoBox.offsetHeight;
            const delta = e.deltaY > 0 ? -5 : 5;
            
            let newSize = Math.max(15, Math.min(currentWidth + delta, 180));
            newSize = Math.min(newSize, parentRect.width - logoLeft, parentRect.height - logoTop);
            
            logoBox.style.width = newSize + 'px';
            logoBox.style.height = newSize + 'px';
            
            deactivateFrame();
        }, { passive: false });
        
        // Click outside logo to deactivate
        document.addEventListener('touchstart', (e) => {
            if (!isActive) return;
            // Allow touches on entire card area for expanded pinch zone
            if (card.contains(e.target)) return;
            if (!logoBox.contains(e.target)) {
                deactivateLogo();
            }
        }, { passive: true });
        
        document.addEventListener('mousedown', (e) => {
            if (!isActive) return;
            if (card.contains(e.target)) return;
            if (!logoBox.contains(e.target)) {
                deactivateLogo();
            }
        });
        
        // Expanded pinch area - listen on entire CARD when active (much larger area)
        card.addEventListener('touchstart', (e) => {
            // Don't interfere with badge clicks
            if (e.target.closest('.price-badge') || 
                e.target.closest('.preview-delete-btn') ||
                e.target.closest('input[type="checkbox"]')) {
                return;
            }
            
            if (logoBox.hidden || !isActive) return;
            if (e.touches.length === 2) {
                e.preventDefault();
                e.stopPropagation();
                
                isPinching = true;
                isDragging = false;
                logoBox.classList.add('resizing');
                logoBox.classList.remove('dragging');
                
                initialDistance = getTouchDistance(e.touches);
                initialWidth = logoBox.offsetWidth;
                initialHeight = logoBox.offsetHeight;
                
                if (navigator.vibrate) navigator.vibrate(10);
            }
        }, { passive: false });
        
        card.addEventListener('touchmove', (e) => {
            if (!isPinching || e.touches.length !== 2) return;
            e.preventDefault();
            e.stopPropagation();
            
            // Pinch to resize - smooth and controlled
            const currentDistance = getTouchDistance(e.touches);
            const distanceChange = currentDistance - initialDistance;
            
            // Balanced sensitivity (2x - smooth and controlled)
            const sensitivity = 2;
            const sizeChange = distanceChange * sensitivity;
            
            const parentRect = preview.getBoundingClientRect();
            const logoLeft = parseFloat(logoBox.style.left) || 0;
            const logoTop = parseFloat(logoBox.style.top) || 0;
            
            // Calculate new size based on distance change
            let newSize = Math.max(12, initialWidth + sizeChange);
            
            // Constrain to parent bounds and max size
            const maxWidth = parentRect.width - logoLeft;
            const maxHeight = parentRect.height - logoTop;
            newSize = Math.min(newSize, maxWidth, maxHeight, 200);
            
            logoBox.style.width = newSize + 'px';
            logoBox.style.height = newSize + 'px';
        }, { passive: false });
        
        card.addEventListener('touchend', (e) => {
            if (!isPinching) return;
            if (e.touches.length === 0) {
                isPinching = false;
                logoBox.classList.remove('resizing');
                
                // Save size to state
                const position = card.dataset.position || card.querySelector('input[type="checkbox"]')?.value;
                if (position && state.positionDesigns && state.positionDesigns[position]) {
                    state.positionDesigns[position].logoPosition = {
                        left: logoBox.style.left,
                        top: logoBox.style.top,
                        width: logoBox.style.width,
                        height: logoBox.style.height
                    };
                }
                
                deactivateFrame();
                if (navigator.vibrate) navigator.vibrate(5);
            }
        });
    }

    // === Initialize POA Badges ===
    function initializePOABadges() {
        // Find all position cards and check for POA pricing
        document.querySelectorAll('.position-card').forEach(card => {
            const embroideryPrice = card.dataset.embroidery;
            const printPrice = card.dataset.print;
            
            // Check embroidery badge for POA
            if (embroideryPrice === 'POA') {
                const embBadge = card.querySelector('.price-emb');
                if (embBadge) {
                    embBadge.classList.add('poa-badge');
                    embBadge.style.cursor = 'not-allowed';
                }
            }
            
            // Check print badge for POA (if needed in future)
            if (printPrice === 'POA') {
                const printBadge = card.querySelector('.price-print');
                if (printBadge) {
                    printBadge.classList.add('poa-badge');
                    printBadge.style.cursor = 'not-allowed';
                }
            }
        });
        
        debugLog('? POA badges initialized');
    }

    // === Quantity Adjusters in Order Summary ===
    function setupQuantityAdjusters() {
        const adjustBtns = document.querySelectorAll('.qty-adjust-btn');
        adjustBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                const currentQty = state.quantity;
                
                if (action === 'decrease' && currentQty > 1) {
                    state.quantity = currentQty - 1;
                } else if (action === 'increase' && currentQty < 9999) {
                    state.quantity = currentQty + 1;
                }
                
                // Update quantity input
                const qtyInput = document.getElementById('quantityInput');
                if (qtyInput) qtyInput.value = state.quantity;
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(5);
                
                // Recalculate
                updatePricingTiers();
                updatePricingSummary();
            });
        });
    }

    // === Apply Method UI (Transform badges) ===
    function applyMethodUI(card, method) {
        if (!card) return;
        
        const embBadge = card.querySelector('.price-emb');
        const printBadge = card.querySelector('.price-print');
        
        // Reset both badges first
        resetPriceBadge(embBadge);
        resetPriceBadge(printBadge);
        
        if (!method) return;
        
        // Active badge (the selected method)
        const methodBadge = method === 'embroidery' ? embBadge : printBadge;
        // Other badge (becomes "Add Logo" with cloud animation)
        const addBadge = method === 'embroidery' ? printBadge : embBadge;
        
        // Check if the other badge is hidden (e.g. embroidery-only products like beanies)
        const otherBadgeHidden = addBadge && (addBadge.style.display === 'none' || addBadge.offsetParent === null);
        
        if (otherBadgeHidden) {
            // Only one method available: transform the METHOD badge itself into "Upload Logo"
            if (methodBadge) {
                methodBadge.classList.add('active', 'add-logo-btn');
                methodBadge.dataset.role = 'add-logo';
                methodBadge.dataset.activeMethod = method;
                const uniqueId = 'cloud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                const origPrice = methodBadge.querySelector('.price-value')?.textContent || (method === 'embroidery' ? '+ \u00A35.00' : '+ \u00A33.50');
                methodBadge.innerHTML = `
                    <span class="price-value" style="display:none;">${origPrice}</span>
                    <span class="price-label" style="font-size:9px;">UPLOAD LOGO</span>
                    <svg class="add-logo-cloud-icon" width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <clipPath id="${uniqueId}">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M76.3818 41.5239C76.3818 41.7358 76.3818 41.7358 76.3818 41.9477C86.9769 44.0667 94.3935 54.0261 93.334 64.8332C92.2745 75.6402 83.1627 83.9044 72.1438 83.9044H29.7633C18.9563 83.9044 9.84454 75.6402 8.57313 64.8332C7.30172 54.0261 14.9302 44.0667 25.5253 41.9477C25.5253 41.7358 25.5253 41.7358 25.5253 41.5239C25.5253 27.5384 36.968 16.0957 50.9536 16.0957C64.9391 16.0957 76.3818 27.5384 76.3818 41.5239Z" />
                            </clipPath>
                        </defs>
                        <g clip-path="url(#${uniqueId})">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M100 -100H0V200H100V-100ZM34.8377 49.1524L47.426 36.4383C48.2652 35.5907 49.3142 35.1669 50.3632 35.1669C51.4122 35.1669 52.671 35.5907 53.3005 36.4383L65.8888 49.1524C66.9378 50.4238 67.3574 52.3309 66.728 53.8143C66.0986 55.2976 64.6299 56.3571 62.9514 56.3571H54.5593V69.0712C54.5593 71.4021 52.671 73.3093 50.3632 73.3093C48.0554 73.3093 46.1672 71.4021 46.1672 69.0712V56.3571H37.775C36.0966 56.3571 34.6279 55.2976 33.9985 53.8143C33.3691 52.119 33.5789 50.4238 34.8377 49.1524Z" fill="white" class="cloud-arrow-anim" />
                        </g>
                    </svg>
                `;
                
                // Store the method so the position is counted correctly
                const position = card.dataset.position;
                if (position) {
                    state.positionMethods[position] = method;
                }
            }
        } else {
            // Normal two-badge flow
            if (methodBadge) {
                methodBadge.classList.add('active');
                methodBadge.dataset.role = 'method';
            }
            
            if (addBadge) {
                addBadge.classList.remove('active');
                addBadge.classList.add('add-logo-btn');
                addBadge.dataset.role = 'add-logo';
                addBadge.dataset.activeMethod = method;
                // Cloud upload animation SVG - unique ID per badge
                const uniqueId = 'cloud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                addBadge.innerHTML = `
                    <svg class="add-logo-cloud-icon" width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <clipPath id="${uniqueId}">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M76.3818 41.5239C76.3818 41.7358 76.3818 41.7358 76.3818 41.9477C86.9769 44.0667 94.3935 54.0261 93.334 64.8332C92.2745 75.6402 83.1627 83.9044 72.1438 83.9044H29.7633C18.9563 83.9044 9.84454 75.6402 8.57313 64.8332C7.30172 54.0261 14.9302 44.0667 25.5253 41.9477C25.5253 41.7358 25.5253 41.7358 25.5253 41.5239C25.5253 27.5384 36.968 16.0957 50.9536 16.0957C64.9391 16.0957 76.3818 27.5384 76.3818 41.5239Z" />
                            </clipPath>
                        </defs>
                        <g clip-path="url(#${uniqueId})">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M100 -100H0V200H100V-100ZM34.8377 49.1524L47.426 36.4383C48.2652 35.5907 49.3142 35.1669 50.3632 35.1669C51.4122 35.1669 52.671 35.5907 53.3005 36.4383L65.8888 49.1524C66.9378 50.4238 67.3574 52.3309 66.728 53.8143C66.0986 55.2976 64.6299 56.3571 62.9514 56.3571H54.5593V69.0712C54.5593 71.4021 52.671 73.3093 50.3632 73.3093C48.0554 73.3093 46.1672 71.4021 46.1672 69.0712V56.3571H37.775C36.0966 56.3571 34.6279 55.2976 33.9985 53.8143C33.3691 52.119 33.5789 50.4238 34.8377 49.1524Z" fill="white" class="cloud-arrow-anim" />
                        </g>
                    </svg>
                `;
            }
        }
    }

    function normalizeBadgePriceText(value) {
        const raw = String(value || '').replace(/\u00A0/g, ' ').trim();
        if (!raw) return '£0.00';
        if (/^\s*POA\s*$/i.test(raw)) return 'POA';

        const numericMatch = raw.match(/-?\d+(?:\.\d{1,2})?/);
        if (!numericMatch) return raw;

        const amount = Number(numericMatch[0]);
        if (!Number.isFinite(amount)) return raw;
        return `£${amount.toFixed(2)}`;
    }

    function normalizePositionBadgeTexts() {
        const embLegend = document.querySelector('.key-badge.embroidery');
        const printLegend = document.querySelector('.key-badge.print');
        if (embLegend) embLegend.textContent = 'Embroidery';
        if (printLegend) printLegend.textContent = 'Print';

        document.querySelectorAll('.position-card .price-badge').forEach((badge) => {
            const method = (badge.dataset.method || '').toLowerCase();
            const labelEl = badge.querySelector('.price-label');
            const valueEl = badge.querySelector('.price-value');

            if (labelEl) {
                if (method === 'embroidery') labelEl.textContent = 'EMBROIDERY';
                if (method === 'print') labelEl.textContent = 'PRINT';
            }

            const sourcePrice = badge.dataset.defaultPrice || valueEl?.textContent || '';
            const normalizedPrice = normalizeBadgePriceText(sourcePrice);
            badge.dataset.defaultPrice = normalizedPrice;
            if (valueEl) valueEl.textContent = normalizedPrice;
        });
    }

    // === Reset Price Badge ===
    function resetPriceBadge(badge) {
        if (!badge) return;
        
        badge.classList.remove('active', 'add-logo-btn', 'logo-added');
        badge.dataset.role = 'method';
        delete badge.dataset.activeMethod;
        
        // Restore original content
        const method = badge.dataset.method;
        const defaultLabel = badge.dataset.defaultLabel || (method === 'embroidery' ? 'EMBROIDERY' : 'PRINT');
        const defaultPrice = normalizeBadgePriceText(badge.dataset.defaultPrice || '£0.00');
        badge.dataset.defaultPrice = defaultPrice;
        
        badge.innerHTML = `
            <span class="price-label">${defaultLabel}</span>
            <span class="price-value">${defaultPrice}</span>
        `;
    }

    function isMobileLogoFlow() {
        return window.matchMedia('(max-width: 1024px)').matches;
    }

    function closeMobileLogoUploadOverlay() {
        const overlay = document.getElementById('mobileLogoUploadOverlay');
        if (overlay) overlay.remove();
        document.body.style.overflow = '';
    }

    async function _applyLogoToPositionFromMobile(position, method, logoUrl) {
        let url = logoUrl;
        if (url && url.startsWith('data:')) {
            try {
                url = await compressBase64Image(url, 600, 0.65);
            } catch (e) {
                debugWarn('Logo compress failed:', e);
            }
        }
        if (typeof window.BrandedLogoLibrary !== 'undefined' && url) {
            window.BrandedLogoLibrary.add({
                url: url,
                filename: 'logo.png',
                uploadedAt: new Date().toISOString()
            });
        }
        _applyExistingLogoToPosition(position, method, url);
        try { autoSaveToBasket(); } catch (e) { /* ignore */ }
        showToast('Logo applied!');
    }

    /** Mobile: gallery + tap-to-browse only — no designModal / drag-and-drop. */
    function openMobileLogoUploadOverlay(position, method) {
        closeMobileLogoUploadOverlay();

        const card = document.querySelector(`.position-card[data-position="${position}"], .position-card input[value="${position}"]`)?.closest('.position-card');
        const positionName = card?.querySelector('.position-checkbox span')?.textContent || String(position || '').replace(/-/g, ' ');

        const overlay = document.createElement('div');
        overlay.id = 'mobileLogoUploadOverlay';
        overlay.className = 'mobile-logo-upload-overlay';

        const sheet = document.createElement('div');
        sheet.className = 'mobile-logo-upload-sheet';

        const header = document.createElement('div');
        header.className = 'mobile-logo-upload-header';
        const titleEl = document.createElement('h3');
        titleEl.textContent = 'Upload Logo – ' + positionName;
        titleEl.className = 'mobile-logo-upload-title';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'background:none;border:none;font-size:21px;line-height:1;cursor:pointer;color:#6b7280;padding:0 4px;';
        closeBtn.addEventListener('click', closeMobileLogoUploadOverlay);
        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'mobile-logo-upload-body';
        const galleryHost = document.createElement('div');
        galleryHost.id = 'mobileLogoGalleryHost';
        body.appendChild(galleryHost);

        sheet.appendChild(header);
        sheet.appendChild(body);
        overlay.appendChild(sheet);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeMobileLogoUploadOverlay();
        });
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        if (typeof window.BrandedLogoLibrary !== 'undefined') {
            window.BrandedLogoLibrary.renderGallery(galleryHost, {
                mobile: true,
                onSelect: function (logoEntry) {
                    _applyLogoToPositionFromMobile(position, method, logoEntry.url);
                    closeMobileLogoUploadOverlay();
                },
                onFileUploaded: function (dataUrl, file) {
                    const status = document.createElement('p');
                    status.className = 'mobile-logo-upload-status';
                    status.textContent = 'Removing background…';
                    galleryHost.innerHTML = '';
                    galleryHost.appendChild(status);
                    applyLogoWithAutoBackgroundRemoval(position, method, dataUrl, file && file.name)
                        .then(function () {
                            closeMobileLogoUploadOverlay();
                        })
                        .catch(function () {
                            closeMobileLogoUploadOverlay();
                        });
                }
            });
        } else {
            galleryHost.innerHTML = '<p style="text-align:center;color:#6b7280;font-size:14px;">Tap below to choose an image from your device.</p>';
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.cssText = 'display:block;margin:12px auto;';
            input.addEventListener('change', function (e) {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function (ev) {
                    applyLogoWithAutoBackgroundRemoval(position, method, ev.target.result, file.name)
                        .then(function () { closeMobileLogoUploadOverlay(); })
                        .catch(function () { closeMobileLogoUploadOverlay(); });
                };
                reader.readAsDataURL(file);
            });
            galleryHost.appendChild(input);
        }
    }

    function openCustomizationTypeModal(position, method) {
        const existingLogos = _getExistingLogosFromBasket();
        if (existingLogos.length > 0) {
            _showExistingLogoPopup(position, method, existingLogos);
        } else if (isMobileLogoFlow()) {
            openMobileLogoUploadOverlay(position, method);
        } else {
            openDesignModal(position, method, 'logo');
        }
    }

    function _getExistingLogosFromBasket() {
        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            const seen = new Set();
            const logos = [];

            basket.forEach(item => {
                if (item.logos && Array.isArray(item.logos)) {
                    item.logos.forEach(l => {
                        if (l && l.logo && !seen.has(l.logo)) {
                            seen.add(l.logo);
                            logos.push({ url: l.logo, productName: item.name || item.productName || '', color: item.color || '' });
                        }
                    });
                }
                if (item.positionDesigns) {
                    Object.values(item.positionDesigns).forEach(d => {
                        if (d && d.logo && !seen.has(d.logo)) {
                            seen.add(d.logo);
                            logos.push({ url: d.logo, productName: item.productName || item.name || '', color: item.color || '' });
                        }
                    });
                }
            });
            return logos;
        } catch (e) {
            return [];
        }
    }

    /** Show popup: "Use existing logo or upload new?" */
    function _showExistingLogoPopup(position, method, logos) {
        // Remove any existing popup
        const old = document.getElementById('existingLogoPopup');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'existingLogoPopup';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10002;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);';

        const card = document.createElement('div');
        card.style.cssText = 'background:#fff;border-radius:16px;padding:24px 20px;max-width:340px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.25);';

        // Title
        const title = document.createElement('h3');
        title.textContent = 'Logo already uploaded';
        title.style.cssText = 'margin:0 0 6px;font-size:17px;color:#1a1a2e;';
        card.appendChild(title);

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Would you like to use an existing logo or upload a new one?';
        subtitle.style.cssText = 'margin:0 0 16px;font-size:13px;color:#666;';
        card.appendChild(subtitle);

        // Logo thumbnails
        const thumbRow = document.createElement('div');
        thumbRow.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:18px;';

        logos.forEach(logo => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'cursor:pointer;border:2px solid #ddd;border-radius:12px;padding:6px;transition:border .2s;';

            const img = document.createElement('img');
            img.src = logo.url;
            img.alt = 'Logo';
            img.style.cssText = 'width:72px;height:72px;object-fit:contain;border-radius:8px;display:block;';
            wrapper.appendChild(img);

            wrapper.addEventListener('click', () => {
                // Apply this logo directly
                _applyExistingLogoToPosition(position, method, logo.url);
                overlay.remove();
            });
            wrapper.addEventListener('mouseenter', () => { wrapper.style.borderColor = '#6c3fff'; });
            wrapper.addEventListener('mouseleave', () => { wrapper.style.borderColor = '#ddd'; });

            thumbRow.appendChild(wrapper);
        });
        card.appendChild(thumbRow);

        // "Upload new" button
        const uploadBtn = document.createElement('button');
        uploadBtn.textContent = '⬆ Upload New Logo';
        uploadBtn.style.cssText = 'width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#6c3fff,#9b59b6);color:#fff;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:8px;';
        uploadBtn.addEventListener('click', () => {
            overlay.remove();
            if (isMobileLogoFlow()) {
                openMobileLogoUploadOverlay(position, method);
            } else {
                openDesignModal(position, method, 'logo');
            }
        });
        card.appendChild(uploadBtn);

        // Cancel
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'width:100%;padding:10px;border:none;border-radius:10px;background:#f0f0f0;color:#666;font-weight:600;font-size:13px;cursor:pointer;';
        cancelBtn.addEventListener('click', () => { overlay.remove(); });
        card.appendChild(cancelBtn);

        overlay.appendChild(card);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
    }

    /** Apply a previously-uploaded logo to the current position */
    function _applyExistingLogoToPosition(position, method, logoUrl) {
        // Save in state
        if (!state.positionDesigns) state.positionDesigns = {};
        const methodNorm = (method || 'embroidery').toLowerCase();
        state.positionDesigns[position] = {
            logo: logoUrl,
            method: methodNorm,
            unitPrice: methodNorm === 'print' ? 3.50 : 5.00
        };

        if (!state.positionMethods) state.positionMethods = {};
        state.positionMethods[position] = methodNorm;

        // Ensure position is checked
        const card = document.querySelector(`.position-card[data-position="${position}"], .position-card input[value="${position}"]`)?.closest('.position-card');
        if (card) {
            const checkbox = card.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
            }
            card.classList.add('selected');
            applyMethodUI(card, method);

            // Show logo preview on position card
            const logoOverlayBox = card.querySelector('.logo-overlay-box');
            const logoOverlayImg = card.querySelector('.logo-overlay-img');
            if (logoOverlayBox && logoOverlayImg) {
                logoOverlayImg.src = logoUrl;
                logoOverlayBox.hidden = false;
            }
            const previewContent = card.querySelector('.position-preview-content');
            const previewImage = card.querySelector('.preview-image');
            if (previewContent && previewImage) {
                previewImage.src = logoUrl;
                previewImage.hidden = false;
                previewContent.hidden = false;
            }
            const pill = card.querySelector('.customization-pill');
            if (pill) pill.hidden = false;

            // Transform badge to green "EDIT"
            const addLogoBtn = card.querySelector('.price-badge.add-logo-btn');
            if (addLogoBtn) {
                addLogoBtn.classList.add('logo-added');
                addLogoBtn.innerHTML = `<span class="add-logo-text">✎ EDIT</span>`;
            }
        }

        saveCustomizationState();
        updatePricingSummary();
        resetAutoSaveTimer();
        applyGarmentColorToPositionPreviews(card);
        persistEditedBasketItemLogos();
        showToast('Logo applied!');
        if (navigator.vibrate) navigator.vibrate(10);
    }
    
    function closeCustomizationTypeModal() {
        const modal = document.getElementById('customizationTypeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    function initCustomizationTypeModal() {
        // No longer needed - direct logo upload now
    }

    // === Logo Gallery helper (renders saved logos + "Upload new" in design modal) ===
    function _renderLogoGalleryInModal(position, method) {
        const container = document.getElementById('logoGalleryContainer');
        if (!container) return;
        if (typeof window.BrandedLogoLibrary === 'undefined') {
            container.innerHTML = '';
            return;
        }

        container.style.display = '';
        window.BrandedLogoLibrary.renderGallery(container, {
            mobile: isMobileLogoFlow(),
            onSelect: function (logoEntry) {
                // User picked/uploaded a logo → apply directly to the preview
                const previewImg = document.getElementById('designPreviewImg');
                const uploadPreview = document.getElementById('designUploadPreview');
                const uploadZone = document.getElementById('designUploadZone');
                const uploadTitle = document.getElementById('uploadLogoTitle');
                const addMoreBtn = document.getElementById('addMoreLogosBtn');

                if (previewImg) previewImg.src = logoEntry.url;
                if (uploadZone) { uploadZone.hidden = true; uploadZone.style.display = 'none'; }
                if (uploadPreview) uploadPreview.hidden = false;
                if (uploadTitle) uploadTitle.textContent = 'Your Logo';
                applyGarmentColorToLogoPreview();

                // Hide gallery, show "Add More Logos" button
                if (container) container.style.display = 'none';
                if (addMoreBtn) addMoreBtn.style.display = 'flex';

                // Store in state so it flows to basket unchanged
                state.originalLogoImage = logoEntry.url;
                state.backgroundRemoved = false;

                const methodNorm = (method || 'embroidery').toLowerCase();
                if (!state.positionDesigns) state.positionDesigns = {};
                state.positionDesigns[position] = {
                    logo: logoEntry.url,
                    method: methodNorm,
                    position: position,
                    unitPrice: methodNorm === 'print' ? 3.50 : 5.00
                };
                if (!state.positionMethods) state.positionMethods = {};
                state.positionMethods[position] = methodNorm;
                if (!state.positionCustomizations) state.positionCustomizations = {};
                state.positionCustomizations[position] = { ...state.positionDesigns[position] };
                persistEditedBasketItemLogos();

                // Haptic
                if (navigator.vibrate) navigator.vibrate(10);
                showToast('Logo selected!');
            },
            onFileUploaded: function (dataUrl, file) {
                // Show in large preview with REMOVE BG button before saving to gallery
                const previewImg = document.getElementById('designPreviewImg');
                const uploadPreview = document.getElementById('designUploadPreview');
                const uploadZone = document.getElementById('designUploadZone');
                const uploadTitle = document.getElementById('uploadLogoTitle');

                if (previewImg) previewImg.src = dataUrl;
                if (uploadZone) { uploadZone.hidden = true; uploadZone.style.display = 'none'; }
                if (uploadPreview) uploadPreview.hidden = false;
                if (uploadTitle) uploadTitle.textContent = 'Your Logo';
                applyGarmentColorToLogoPreview();
                if (container) container.style.display = 'none';

                // Store original for BG removal toggle
                state.originalLogoImage = dataUrl;
                state.backgroundRemoved = false;

                // Reset Remove BG button
                const removeBgBtn = document.getElementById('removeBgBtn');
                if (removeBgBtn) {
                    removeBgBtn.classList.remove('processing', 'done');
                    removeBgBtn.disabled = false;
                    const spanEl = removeBgBtn.querySelector('span');
                    if (spanEl) spanEl.textContent = 'KEEP BG';
                }

                // Mark pending → will be added to gallery after BG removal
                state._pendingGalleryFile = { filename: file.name, originalDataUrl: dataUrl };

                // Auto-remove background
                setTimeout(() => removeImageBackground(), 150);
            },
        });

        // Wire up "Add More Logos" button
        const addMoreBtn = document.getElementById('addMoreLogosBtn');
        if (addMoreBtn) {
            // Clone to remove old listeners
            const newBtn = addMoreBtn.cloneNode(true);
            addMoreBtn.parentNode.replaceChild(newBtn, addMoreBtn);
            newBtn.addEventListener('click', () => {
                // Show gallery again (keeps existing logos)
                if (container) container.style.display = '';
                // Scroll gallery into view
                container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }

        // Hide the old upload dropzone since the gallery has its own
        const oldUploadZone = document.getElementById('designUploadZone');
        if (oldUploadZone) { oldUploadZone.hidden = true; oldUploadZone.style.display = 'none'; }
    }

    // === Open Design Modal (with specific section focus) ===
    function openDesignModal(position, method, section = 'all') {
        if (isMobileLogoFlow() && section === 'logo') {
            openMobileLogoUploadOverlay(position, method);
            return;
        }
        const modal = document.getElementById('designModal');
        const modalTitle = document.getElementById('designModalTitle');
        
        if (!modal) return;
        
        // Get position name from the card
        const card = document.querySelector(`.position-card[data-position="${position}"], .position-card input[value="${position}"]`)?.closest('.position-card');
        const positionName = card?.querySelector('.position-checkbox span')?.textContent || position.replace(/-/g, ' ');
        
        // Update modal title based on section
        if (modalTitle) {
            let titleText = `Customise ${positionName}`;
            if (section === 'logo') titleText = `Upload Logo - ${positionName}`;
            else if (section === 'text') titleText = `Add Text - ${positionName}`;
            else if (section === 'artwork') titleText = `Pick Artwork - ${positionName}`;
            modalTitle.textContent = titleText;
        }
        
        // Store current position/method for when applying design
        modal.dataset.position = position;
        modal.dataset.method = method;
        
        // Reset modal state, then gallery (hides legacy drag-and-drop zone)
        resetDesignModal();
        _renderLogoGalleryInModal(position, method);

        // ── PRE-POPULATE existing logo when editing from basket ──
        const existingDesign = state.positionDesigns && state.positionDesigns[position];
        if (existingDesign && existingDesign.logo) {
            const uploadZone = document.getElementById('designUploadZone');
            const uploadPreview = document.getElementById('designUploadPreview');
            const previewImg = document.getElementById('designPreviewImg');
            if (uploadZone) { uploadZone.hidden = true; uploadZone.style.display = 'none'; }
            if (previewImg) { previewImg.src = existingDesign.logo; }
            if (uploadPreview) { uploadPreview.hidden = false; }
            applyGarmentColorToLogoPreview();
            const gcPre = document.getElementById('logoGalleryContainer');
            if (gcPre) gcPre.style.display = 'none';
            // Update title to indicate editing
            if (modalTitle) {
                const posName = card?.querySelector('.position-checkbox span')?.textContent || position.replace(/-/g, ' ');
                modalTitle.textContent = `Edit Logo - ${posName}`;
            }
        }
        
        // Scroll to specific section based on selection
        setTimeout(() => {
            const modalBody = modal.querySelector('.design-modal-body');
            if (modalBody && section !== 'all') {
                let targetSection = null;
                if (section === 'logo') {
                    targetSection = document.getElementById('uploadLogoSection');
                } else if (section === 'text') {
                    targetSection = modal.querySelector('.design-section-title')?.closest('.design-section');
                    // Find the "Add Text" section
                    const sections = modal.querySelectorAll('.design-section');
                    sections.forEach(sec => {
                        const title = sec.querySelector('.design-section-title');
                        if (title && title.textContent.includes('Add Text')) {
                            targetSection = sec;
                        }
                    });
                } else if (section === 'artwork') {
                    // Find the clipart section
                    const sections = modal.querySelectorAll('.design-section');
                    sections.forEach(sec => {
                        const title = sec.querySelector('.design-section-title');
                        if (title && title.textContent.includes('Clipart')) {
                            targetSection = sec;
                        }
                    });
                }
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }, 350);
        
        // Open modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);
    }

    // === Open Customization Modal (legacy - now opens type selection first) ===
    function openCustomizationModal(position, method) {
        // Now opens the type selection modal first
        openCustomizationTypeModal(position, method);
    }
    
    function closeCustomizationModal() {
        const modal = document.getElementById('designModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    function resetDesignModal() {
        // Reset upload
        const uploadZone = document.getElementById('designUploadZone');
        const uploadPreview = document.getElementById('designUploadPreview');
        const previewImg = document.getElementById('designPreviewImg');
        const fileInput = document.getElementById('designLogoUpload');
        
        // Ripristina la dropzone (visibilità e display)
        if (uploadZone) {
            uploadZone.hidden = false;
            uploadZone.style.display = '';
        }
        if (uploadPreview) uploadPreview.hidden = true;
        if (previewImg) previewImg.src = '';
        if (fileInput) fileInput.value = '';
        clearGarmentLogoPreviewMode();
        
        // Ripristina il titolo a "Upload Logo"
        const uploadTitle = document.getElementById('uploadLogoTitle');
        if (uploadTitle) uploadTitle.textContent = 'Upload Logo';
        
        // Reset Remove BG button
        const removeBgBtn = document.getElementById('removeBgBtn');
        if (removeBgBtn) {
            removeBgBtn.classList.remove('processing', 'done');
            const btnText = removeBgBtn.querySelector('span');
            if (btnText) btnText.textContent = 'KEEP BG';
        }
        
        // Reset Undo button and original image state
        const undoBgBtn = document.getElementById('undoBgBtn');
        if (undoBgBtn) {
            undoBgBtn.hidden = true;
        }
        state.originalLogoImage = null;
        
        // Reset text
        const textInput = document.getElementById('designTextInput');
        if (textInput) textInput.value = '';
        
        // Reset colors
        document.querySelectorAll('#designModal .color-circle').forEach((c, i) => {
            c.classList.toggle('active', i === 0);
        });
        document.querySelectorAll('#designModal .stroke-circle').forEach((c, i) => {
            c.classList.toggle('active', i === 0);
        });
        
        // Reset clipart
        document.querySelectorAll('#designModal .clipart-item').forEach(c => {
            c.classList.remove('selected');
        });
        document.querySelectorAll('#designModal .clipart-tab').forEach((t, i) => {
            t.classList.toggle('active', i === 0);
        });
        
        // Reset none checkbox
        const noneCheckbox = document.getElementById('textColorNone');
        if (noneCheckbox) noneCheckbox.checked = false;
    }
    
    function initDesignModal() {
        const modal = document.getElementById('designModal');
        if (!modal) return;
        
        // Close button
        const closeBtn = document.getElementById('closeDesignModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCustomizationModal);
        }
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCustomizationModal();
            }
        });
        
        // Upload dropzone
        const uploadZone = document.getElementById('designUploadZone');
        const fileInput = document.getElementById('designLogoUpload');
        const uploadPreview = document.getElementById('designUploadPreview');
        const previewImg = document.getElementById('designPreviewImg');
        const removeBtn = document.getElementById('removeUploadedLogo');
        
        if (uploadZone && fileInput) {
            uploadZone.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (previewImg) previewImg.src = ev.target.result;
                        // Nascondi completamente la dropzone (non solo hidden)
                        if (uploadZone) {
                            uploadZone.hidden = true;
                            uploadZone.style.display = 'none';
                        }
                        if (uploadPreview) uploadPreview.hidden = false;
                        applyGarmentColorToLogoPreview();
                        const gcUp = document.getElementById('logoGalleryContainer');
                        if (gcUp) gcUp.style.display = 'none';
                        
                        // Cambia il titolo da "Upload Logo" a "Your Logo"
                        const uploadTitle = document.getElementById('uploadLogoTitle');
                        if (uploadTitle) uploadTitle.textContent = 'Your Logo';
                        
                        // REMOVED: Don't show logo on main product preview - only in customization section
                        // The logo should only appear in the position cards, not on the main product thumbnail
                        // const logoOverlayBox = document.getElementById('logoOverlayBox');
                        // const logoOverlayImg = document.getElementById('logoOverlayImg');
                        // if (logoOverlayBox && logoOverlayImg) {
                        //     logoOverlayImg.src = ev.target.result;
                        //     logoOverlayBox.classList.add('active');
                        // }
                        
                        // Save original image for auto background removal
                        state.originalLogoImage = ev.target.result;
                        state.backgroundRemoved = false;

                        // Reset Remove BG button to initial state
                        const removeBgBtn = document.getElementById('removeBgBtn');
                        if (removeBgBtn) {
                            removeBgBtn.classList.remove('processing', 'done');
                            removeBgBtn.disabled = false;
                            const spanEl = removeBgBtn.querySelector('span');
                            if (spanEl) spanEl.textContent = 'KEEP BG';
                        }

                        // Auto-remove background after load
                        setTimeout(() => removeImageBackground(), 150);

                        // ── Upload to server in background & add to gallery ──
                        if (typeof window.BrandedLogoLibrary !== 'undefined') {
                            window.BrandedLogoLibrary.uploadToServer(ev.target.result, modal?.dataset?.position, file.name)
                                .then(result => {
                                    if (result && result.url && !result.url.startsWith('data:')) {
                                        debugLog('✅ Logo uploaded to server:', result.url);
                                        // Update preview to use permanent URL
                                        // (only if user hasn't changed it since)
                                        if (previewImg && previewImg.src === ev.target.result) {
                                            previewImg.src = result.url;
                                        }
                                    }
                                })
                                .catch(err => debugWarn('Logo upload bg failed:', err));
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                if (fileInput) fileInput.value = '';
                if (previewImg) previewImg.src = '';
                // Ripristina la dropzone
                if (uploadZone) {
                    uploadZone.hidden = false;
                    uploadZone.style.display = '';
                }
                if (uploadPreview) uploadPreview.hidden = true;
                clearGarmentLogoPreviewMode();
                
                // Ripristina il titolo a "Upload Logo"
                const uploadTitle = document.getElementById('uploadLogoTitle');
                if (uploadTitle) uploadTitle.textContent = 'Upload Logo';
                
                // Nascondi il logo dalla preview del prodotto
                const logoOverlayBox = document.getElementById('logoOverlayBox');
                const logoOverlayImg = document.getElementById('logoOverlayImg');
                if (logoOverlayBox) logoOverlayBox.classList.remove('active');
                if (logoOverlayImg) logoOverlayImg.src = '';
                
                // Reset completo dello state per nuovo logo
                const logoSrc = previewImg ? previewImg.src : null;
                const originalSrc = state.originalLogoImage;
                state.originalLogoImage = null;
                state._pendingGalleryFile = null;
                
                // Remove from gallery and cache
                if (typeof window.BrandedLogoLibrary !== 'undefined') {
                    if (logoSrc) window.BrandedLogoLibrary.remove(logoSrc);
                    if (originalSrc && originalSrc !== logoSrc) window.BrandedLogoLibrary.remove(originalSrc);
                }

                // Show gallery again and re-render
                const gc = document.getElementById('logoGalleryContainer');
                if (gc) {
                    gc.style.display = '';
                    _renderLogoGalleryInModal();
                }

                // Reset Remove BG button
                const removeBgBtn = document.getElementById('removeBgBtn');
                if (removeBgBtn) {
                    removeBgBtn.classList.remove('processing', 'done');
                    const btnText = removeBgBtn.querySelector('span');
                    if (btnText) btnText.textContent = 'KEEP BG';
                }
            });
        }
        
        // Color circles
        modal.querySelectorAll('.color-circle').forEach(circle => {
            circle.addEventListener('click', () => {
                modal.querySelectorAll('.color-circle').forEach(c => c.classList.remove('active'));
                circle.classList.add('active');
                const noneCheckbox = document.getElementById('textColorNone');
                if (noneCheckbox) noneCheckbox.checked = false;
            });
        });
        
        // Stroke circles
        modal.querySelectorAll('.stroke-circle').forEach(circle => {
            circle.addEventListener('click', () => {
                modal.querySelectorAll('.stroke-circle').forEach(c => c.classList.remove('active'));
                circle.classList.add('active');
            });
        });
        
        // Clipart tabs
        modal.querySelectorAll('.clipart-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.clipart-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                // TODO: Filter clipart by category
            });
        });
        
        // Clipart items
        modal.querySelectorAll('.clipart-item').forEach(item => {
            item.addEventListener('click', () => {
                modal.querySelectorAll('.clipart-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                if (navigator.vibrate) navigator.vibrate(10);
            });
        });
        
        // Apply design button (main bottom button)
        const applyBtn = document.getElementById('applyDesignBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                applyDesignToPosition();
            });
        }
        
        // Quick Apply Logo button (inside preview container)
        const quickApplyBtn = document.getElementById('quickApplyLogo');
        if (quickApplyBtn) {
            quickApplyBtn.addEventListener('click', () => {
                applyDesignToPosition();
            });
        }
        
        // Remove Background button - toggle behavior based on state
        const removeBgBtn = document.getElementById('removeBgBtn');
        if (removeBgBtn) {
            removeBgBtn.addEventListener('click', () => {
                // Check if background was already removed (button shows "KEEP BACKGROUND")
                if (state.backgroundRemoved) {
                    restoreOriginalImage();
                } else {
                    removeImageBackground();
                }
            });
        }
        
        // Undo Background Removal button
        const undoBgBtn = document.getElementById('undoBgBtn');
        if (undoBgBtn) {
            undoBgBtn.addEventListener('click', () => {
                restoreOriginalImage();
            });
        }
    }
    
    function processLogoBackgroundRemovalFromDataUrl(imgSrc) {
        return new Promise(function (resolve, reject) {
            if (!imgSrc) {
                reject(new Error('No image'));
                return;
            }
            const img = new Image();
            if (!imgSrc.startsWith('data:')) {
                img.crossOrigin = 'Anonymous';
            }
            img.onload = function () {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const width = canvas.width;
                    const height = canvas.height;

                    const corners = [
                        getPixelColorAt(data, 0, 0, width),
                        getPixelColorAt(data, width - 1, 0, width),
                        getPixelColorAt(data, 0, height - 1, width),
                        getPixelColorAt(data, width - 1, height - 1, width)
                    ];

                    const bgColor = findDominantCornerColor(corners);
                    const tolerance = 45;
                    const visited = new Uint8Array(width * height);
                    const qx = [];
                    const qy = [];

                    for (let x = 0; x < width; x++) {
                        qx.push(x); qy.push(0);
                        qx.push(x); qy.push(height - 1);
                    }
                    for (let y = 1; y < height - 1; y++) {
                        qx.push(0); qy.push(y);
                        qx.push(width - 1); qy.push(y);
                    }

                    let qi = 0;
                    while (qi < qx.length) {
                        const x = qx[qi];
                        const y = qy[qi];
                        qi += 1;

                        if (x < 0 || x >= width || y < 0 || y >= height) continue;

                        const idx = y * width + x;
                        if (visited[idx]) continue;
                        visited[idx] = 1;

                        const pixelIdx = idx * 4;
                        const r = data[pixelIdx];
                        const g = data[pixelIdx + 1];
                        const b = data[pixelIdx + 2];

                        if (isColorSimilarTo(r, g, b, bgColor, tolerance)) {
                            data[pixelIdx + 3] = 0;
                            qx.push(x + 1); qy.push(y);
                            qx.push(x - 1); qy.push(y);
                            qx.push(x); qy.push(y + 1);
                            qx.push(x); qy.push(y - 1);
                        }
                    }

                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = function () {
                reject(new Error('Image load failed'));
            };
            img.src = imgSrc;
        });
    }

    async function applyLogoWithAutoBackgroundRemoval(position, method, dataUrl, filename) {
        let processedUrl = dataUrl;
        try {
            processedUrl = await processLogoBackgroundRemovalFromDataUrl(dataUrl);
        } catch (e) {
            debugWarn('Background removal failed, using original:', e);
        }
        if (typeof window.BrandedLogoLibrary !== 'undefined') {
            window.BrandedLogoLibrary.uploadToServer(processedUrl, position, filename || 'logo.png').catch(function () {});
        }
        await _applyLogoToPositionFromMobile(position, method, processedUrl);
    }

    // === Background Removal Algorithm (recreated for mobile/tablet) ===
    function removeImageBackground() {
        const previewImg = document.getElementById('designPreviewImg');
        const removeBgBtn = document.getElementById('removeBgBtn');
        const undoBgBtn = document.getElementById('undoBgBtn');

        if (!previewImg || !previewImg.src) {
            return;
        }

        if (!state.originalLogoImage) {
            state.originalLogoImage = previewImg.src;
        }

        if (removeBgBtn) {
            removeBgBtn.classList.add('processing');
            removeBgBtn.disabled = true;
            const spanEl = removeBgBtn.querySelector('span');
            if (spanEl) spanEl.textContent = 'PROCESSING';
        }

        const imgSrc = previewImg.src;

        processLogoBackgroundRemovalFromDataUrl(imgSrc).then(function (processedUrl) {
            previewImg.src = processedUrl;

            if (removeBgBtn) {
                removeBgBtn.classList.remove('processing');
                removeBgBtn.classList.add('done');
                removeBgBtn.disabled = false;
                const spanEl = removeBgBtn.querySelector('span');
                if (spanEl) spanEl.textContent = 'KEEP BG';
            }

            state.backgroundRemoved = true;

            if (state._pendingGalleryFile) {
                const pending = state._pendingGalleryFile;
                state._pendingGalleryFile = null;
                if (typeof window.BrandedLogoLibrary !== 'undefined') {
                    window.BrandedLogoLibrary.add({
                        url: processedUrl,
                        filename: pending.filename,
                        uploadedAt: new Date().toISOString()
                    });
                    window.BrandedLogoLibrary.uploadToServer(processedUrl, null, pending.filename).catch(function () {});
                    const gc = document.getElementById('logoGalleryContainer');
                    if (gc) _renderLogoGalleryInModal();
                }
            }

            if (undoBgBtn) {
                undoBgBtn.hidden = true;
            }

            if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        }).catch(function () {
            if (removeBgBtn) {
                removeBgBtn.classList.remove('processing');
                removeBgBtn.disabled = false;
                const spanEl = removeBgBtn.querySelector('span');
                if (spanEl) spanEl.textContent = 'REMOVE BG';
            }
            if (state._pendingGalleryFile) {
                const pending = state._pendingGalleryFile;
                state._pendingGalleryFile = null;
                if (typeof window.BrandedLogoLibrary !== 'undefined') {
                    window.BrandedLogoLibrary.add({
                        url: pending.originalDataUrl,
                        filename: pending.filename,
                        uploadedAt: new Date().toISOString()
                    });
                    window.BrandedLogoLibrary.uploadToServer(pending.originalDataUrl, null, pending.filename).catch(function () {});
                    const gc = document.getElementById('logoGalleryContainer');
                    if (gc) _renderLogoGalleryInModal();
                }
            }
        });
    }
    
    // Get pixel color at specific coordinates
    function getPixelColorAt(data, x, y, width) {
        const idx = (y * width + x) * 4;
        return {
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2]
        };
    }
    
    // Find the most common color from corner samples
    function findDominantCornerColor(colors) {
        const avgR = Math.round(colors.reduce((sum, c) => sum + c.r, 0) / colors.length);
        const avgG = Math.round(colors.reduce((sum, c) => sum + c.g, 0) / colors.length);
        const avgB = Math.round(colors.reduce((sum, c) => sum + c.b, 0) / colors.length);
        
        return { r: avgR, g: avgG, b: avgB };
    }
    
    // Check if two colors are similar within tolerance
    function isColorSimilarTo(r, g, b, target, tolerance) {
        const dr = Math.abs(r - target.r);
        const dg = Math.abs(g - target.g);
        const db = Math.abs(b - target.b);
        
        return dr <= tolerance && dg <= tolerance && db <= tolerance;
    }
    
    // === Restore Original Image (Undo Background Removal) ===
    function restoreOriginalImage() {
        const previewImg = document.getElementById('designPreviewImg');
        const removeBgBtn = document.getElementById('removeBgBtn');
        const undoBgBtn = document.getElementById('undoBgBtn');
        const logoOverlayImg = document.getElementById('logoOverlayImg');
        
        if (!previewImg || !state.originalLogoImage) return;
        
        // Restore original image
        previewImg.src = state.originalLogoImage;
        
        // REMOVED: Don't update main product preview - only customization section
        // The logo should only appear in the position cards, not on the main product thumbnail
        // if (logoOverlayImg) {
        //     logoOverlayImg.src = state.originalLogoImage;
        // }
        
        // Reset Remove BG button
        if (removeBgBtn) {
            removeBgBtn.classList.remove('processing', 'done');
            const btnText = removeBgBtn.querySelector('span');
            if (btnText) btnText.textContent = 'KEEP BG';
        }
        
        // Reset state flag
        state.backgroundRemoved = false;
        
        // Hide Undo button
        if (undoBgBtn) {
            undoBgBtn.hidden = true;
        }
        
        // NON cancellare l'immagine originale (permette di alternare)
        // state.originalLogoImage = null;
        
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);
        
        // Show toast
        showToast('Background restored');
    }
    
    async function applyDesignToPosition() {
        const modal = document.getElementById('designModal');
        if (!modal) return;
        
        // Close modal IMMEDIATELY so it never stays open
        closeCustomizationModal();
        
        const position = modal.dataset.position;
        const method = modal.dataset.method;
        
        // Gather design data
        let logoSrc = document.getElementById('designPreviewImg')?.src || null;

        // ── Compress base64 logos to prevent QuotaExceededError ──
        if (logoSrc && logoSrc.startsWith('data:')) {
            try {
                logoSrc = await compressBase64Image(logoSrc, 600, 0.65);
                debugLog('📷 Logo compressed for storage, length:', logoSrc.length);
            } catch (e) {
                debugWarn('Logo compression failed, using original:', e);
            }
        }

        const designData = {
            position,
            method,
            logo: logoSrc,
            text: document.getElementById('designTextInput')?.value || '',
            textColor: modal.querySelector('.color-circle.active')?.dataset.color || '#1f2937',
            strokeColor: modal.querySelector('.stroke-circle.active')?.dataset.color || '#1f2937',
            clipart: modal.querySelector('.clipart-item.selected')?.textContent || null
        };
        
        
        // CRITICAL: Ensure positionMethods is updated for basket saving
        if (!state.positionMethods) state.positionMethods = {};
        state.positionMethods[position] = method;
        debugLog('?? applyDesignToPosition - Updated positionMethods:', state.positionMethods);
        
        // Store in state (both positionDesigns and positionCustomizations for compatibility)
        if (!state.positionDesigns) state.positionDesigns = {};
        state.positionDesigns[position] = designData;
        
        // Also store in positionCustomizations for glow effect tracking
        if (!state.positionCustomizations) state.positionCustomizations = {};
        state.positionCustomizations[position] = designData;

        if (designData.logo) {
            _logoConfiguredForCurrentItem = true;
        }

        if (isActiveBasketItemEdit()) {
            persistEditedBasketItemLogos();
        } else if (designData.logo) {
            // Full customize flow: update all same product+colour rows
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            const code = state.product?.code;
            const color = state.selectedColorName || state.selectedColor;
            let updated = false;
            basket.forEach(existing => {
                if (((existing.productCode || existing.code) === code) &&
                    (existing.colorId === state.selectedColor || existing.color === color)) {
                    if (state.positionDesigns && Object.keys(state.positionDesigns).length > 0) {
                        existing.positionDesigns = { ...(existing.positionDesigns || {}), ...state.positionDesigns };
                    }
                    if (state.positionMethods && Object.keys(state.positionMethods).length > 0) {
                        const existingQty = existing.totalQty || existing.qty || 0;
                        const updatedPositions = [];
                        const updatedCustomizations = [];
                        Object.entries(state.positionMethods).forEach(([pos, m]) => {
                            const unitPrice = m === 'embroidery' ? 5.00 : 3.50;
                            const posLabel = canonicalPositionName(pos);
                            const logo = state.positionDesigns?.[pos]?.logo || null;
                            const methodLabel = m === 'embroidery' ? 'Embroidery' : 'Print';
                            updatedPositions.push({ position: pos, name: posLabel, method: m, unitPrice, logo });
                            updatedCustomizations.push({ posKey: pos, position: posLabel, method: methodLabel, unitPrice, total: unitPrice * existingQty, qty: existingQty });
                        });
                        existing.positions = updatedPositions;
                        if (updatedCustomizations.length > 0) existing.customizations = updatedCustomizations;
                    }
                    syncBasketItemLogos(existing);
                    updated = true;
                }
            });
            if (updated) {
                try {
                    localStorage.setItem('quoteBasket', JSON.stringify(basket));
                } catch (e) {
                    console.error('applyDesignToPosition basket save failed:', e);
                }
            }
        }
        state.selectionSaved = true;
        updatePricingSummary();
        
        // Update the position card preview
        const card = document.querySelector(`.position-card[data-position="${position}"], .position-card input[value="${position}"]`)?.closest('.position-card');
        if (card) {
            const previewContent = card.querySelector('.position-preview-content');
            const previewImage = card.querySelector('.preview-image');
            const previewText = card.querySelector('.preview-text');
            const pill = card.querySelector('.customization-pill');
            
            // Show logo on product image (logo overlay box)
            const logoOverlayBox = card.querySelector('.logo-overlay-box');
            const logoOverlayImg = card.querySelector('.logo-overlay-img');
            if (designData.logo && logoOverlayBox && logoOverlayImg) {
                logoOverlayImg.src = designData.logo;
                logoOverlayBox.hidden = false;
            }
            
            if (previewContent) {
                previewContent.hidden = false;
                
                if (designData.logo && previewImage) {
                    previewImage.src = designData.logo;
                    previewImage.hidden = false;
                }
                
                if (designData.text && previewText) {
                    previewText.textContent = designData.text;
                    previewText.style.color = designData.textColor;
                    previewText.hidden = false;
                }
            }
            
            if (pill) {
                pill.hidden = true;
            }
            
            // Transform "ADD LOGO" button to green "EDIT" when logo is uploaded
            if (designData.logo) {
                const addLogoBtn = card.querySelector('.price-badge.add-logo-btn');
                if (addLogoBtn) {
                    addLogoBtn.classList.add('logo-added');
                    addLogoBtn.innerHTML = `<span class="add-logo-text">✎ EDIT</span>`;
                }
            }
        }
        
        // Update order card logo preview
        updateOrderCardLogo(designData);

        if (card) applyGarmentColorToPositionPreviews(card);
        
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        
        // Save state for persistence
        saveCustomizationState();
        
        // Update pricing
        updatePricingSummary();
        
        // IMMEDIATELY inject logo into the summary note box (current item)
        if (designData.logo) {
            const currentItemLogo = document.getElementById('currentItemLogo');
            if (currentItemLogo) {
                currentItemLogo.innerHTML = `<img src="${designData.logo}" alt="Logo" style="width:60px;height:60px;object-fit:contain;border-radius:6px;">`;
            }
            // Also update any existing note-box-logo elements
            document.querySelectorAll('.note-box-logo').forEach(logoBox => {
                if (logoBox.querySelector('.no-logo')) {
                    logoBox.innerHTML = `<img src="${designData.logo}" alt="Logo" style="width:60px;height:60px;object-fit:contain;border-radius:6px;">`;
                }
            });
        }
        
        // Update logos list in order card
        updateOrderCardLogosList();
    }
    
    function updateOrderCardLogo(designData) {
        // This function is now replaced by updateOrderCardLogosList
        updateOrderCardLogosList();
    }
    
    // Update the logos list in the order card - shows all logos from basket and current selection
    function updateOrderCardLogosList() {
        const logosList = document.getElementById('cardLogosList');
        if (!logosList) return;
        
        let logosHtml = '';
        let hasLogos = false;
        
        // PART 1: Get logos from basket items
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        basket.forEach((item, itemIndex) => {
            // Check positionDesigns or customizations
            if (item.customizations && item.customizations.length > 0) {
                item.customizations.forEach(custom => {
                    if (custom.type === 'logo' && custom.content) {
                        hasLogos = true;
                        const positionName = custom.zone.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        
                        logosHtml += `
                            <div class="logo-section-content">
                                <div class="logo-preview-thumb">
                                    <img src="${custom.content}" alt="Logo">
                                </div>
                                <div class="logo-section-info">
                                    <span class="logo-position">${positionName}</span>
                                    <span class="logo-method">${item.color || 'Product'}</span>
                                </div>
                            </div>
                        `;
                    }
                });
            }
        });
        
        // PART 2: Get logos from current selection (positionDesigns or positionCustomizations)
        if (state.positionDesigns) {
            Object.entries(state.positionDesigns).forEach(([position, design]) => {
                if (design && design.logo) {
                    hasLogos = true;
                    const positionName = position.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const methodName = design.method === 'embroidery' ? 'Embroidery' : 'Print';
                    
                    logosHtml += `
                        <div class="logo-section-content">
                            <div class="logo-preview-thumb">
                                <img src="${design.logo}" alt="Logo">
                            </div>
                            <div class="logo-section-info">
                                <span class="logo-position">${positionName}</span>
                                <span class="logo-method">${methodName} - ${state.selectedColorName || 'Current'}</span>
                            </div>
                        </div>
                    `;
                }
            });
        }
        
        // If no logos, show empty state
        if (!hasLogos) {
            logosHtml = `
                <div class="logo-section-content empty-logo">
                    <div class="logo-preview-thumb">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                    </div>
                    <div class="logo-section-info">
                        <span class="logo-method">No logo added</span>
                        <span class="logo-hint">Select a position and add your logo</span>
                    </div>
                </div>
            `;
        }
        
        logosList.innerHTML = logosHtml;
    }

    // === Pricing Summary ===
    // === Pricing Summary ===
    // Shows FULL ORDER: basket items + current selection
    // Uses SAME logic as updateOrderCard() for consistency
    function updatePricingSummary() {
        // Read basket EXACTLY like updateOrderCard does
        const fullBasket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        // Exclude the item currently being edited to avoid double-counting
        // (its quantities are live in state.quantity / currentQty)
        const basket = fullBasket.filter(item => !(_autoSavedItemId && item.id === _autoSavedItemId));
        
        // Calculate total qty from basket
        let basketQty = 0;
        basket.forEach(item => {
            basketQty += item.totalQty || item.quantity || 0;
        });
        const currentQty = state.quantity || 0;
        const totalQty = basketQty + currentQty;
        
        debugLog('?? PRICING SUMMARY:', { currentQty, basketQty, totalQty, basketLength: basket.length });
        
        // Get unit price based on TOTAL quantity (cumulative tier)
        const basePrice = PRICING_RULES[state.product.code]?.basePrice || state.product.basePrice;
        const tiers = PRICING_RULES[state.product.code]?.tiers || [];
        
        // Find correct tier for total quantity
        // Tiers are sorted DESCENDING by min (250, 100, 50, 25, 10, 1)
        // Iterate from highest to lowest, first match = best tier
        let unitPrice = basePrice;
        for (let i = 0; i < tiers.length; i++) {
            if (totalQty >= tiers[i].min) {
                unitPrice = tiers[i].price;
                break;
            }
        }
        
        debugLog('?? UNIT PRICE:', unitPrice, 'for', totalQty, 'items, tiers:', JSON.stringify(tiers));
        
        const currentTier = getCurrentTier();
        
        // ===== GET ALL BASKET ITEMS =====
        // Calculate FULL basket totals (ALL items)
        let totalBasketGarmentCost = 0;
        let allBasketCustomizations = [];
        let hasEmbroidery = false;
        
        // First, group all items by productCode to calculate cumulative customization quantity
        const productCodeGroups = {};
        basket.forEach(item => {
            const itemCode = item.productCode || item.code;
            const itemQty = item.totalQty || item.quantity || 0;
            
            if (!productCodeGroups[itemCode]) {
                productCodeGroups[itemCode] = {
                    totalQty: 0,
                    items: []
                };
            }
            productCodeGroups[itemCode].totalQty += itemQty;
            productCodeGroups[itemCode].items.push(item);
        });
        
        basket.forEach(item => {
            const itemCode = item.productCode || item.code;
            const itemQty = item.totalQty || item.quantity || 0;
            
            // ALWAYS use the saved unitPrice from the basket item (tier-calculated at save time)
            // Only override with fresh tier data if explicitly available AND different product qty
            const savedUnitPrice = parseFloat(item.unitPrice || item.price) || 0;
            let itemUnitPrice = savedUnitPrice;
            
            // If same product and PRICING_RULES has actual tier data loaded, recalculate
            // (qty may have changed since save, so fresh tier is more accurate)
            if (itemCode === state.product.code && tiers.length > 0) {
                itemUnitPrice = unitPrice; // unitPrice already tier-calculated above
            }
            
            // Final safety: if calculated price is 0 but saved price exists, use saved
            if (itemUnitPrice <= 0 && savedUnitPrice > 0) {
                itemUnitPrice = savedUnitPrice;
            }
            
            debugLog('?? BASKET ITEM:', itemCode, 'qty:', itemQty, 'unitPrice:', itemUnitPrice, 'total:', itemUnitPrice * itemQty);
            
            totalBasketGarmentCost += itemUnitPrice * itemQty;
            
            // CRITICAL FIX: Customizations apply to ALL items with same productCode
            const cumulativeQtyForThisProduct = productCodeGroups[itemCode]?.totalQty || itemQty;
            
            // Track whether we found customization data from positions (to avoid double-counting with customizations)
            let foundPositionData = false;
            
            // Helper: normalize method string to canonical form
            const normalizeMethod = (m) => (m || '').toLowerCase() === 'embroidery' ? 'Embroidery' : 'Print';
            const isEmbroidery = (m) => (m || '').toLowerCase() === 'embroidery';
            
            // Collect basket customizations from positions (handles BOTH array and object formats)
            const positionsArr = Array.isArray(item.positions)
                ? item.positions
                : (item.positions && typeof item.positions === 'object')
                    ? Object.entries(item.positions).map(([key, val]) => ({ ...val, _posKey: key }))
                    : [];
            
            positionsArr.forEach(pos => {
                const posMethod = pos.method;
                if (!posMethod) return;
                foundPositionData = true;
                
                const methodLabel = normalizeMethod(posMethod);
                const custUnitPrice = pos.unitPrice || (isEmbroidery(posMethod) ? 5.00 : 3.50);
                const posSlug = pos._posKey || pos.position || '';
                const positionName = canonicalPositionName(posSlug);
                
                // Check if this customization was already added for this productCode (dedup by SLUG)
                const existingCustom = allBasketCustomizations.find(c => 
                    c.productCode === itemCode && 
                    c.posKey === posSlug && 
                    c.method === methodLabel
                );
                
                if (!existingCustom) {
                    allBasketCustomizations.push({
                        productCode: itemCode,
                        posKey: posSlug,
                        position: positionName,
                        method: methodLabel,
                        unitPrice: custUnitPrice,
                        qty: cumulativeQtyForThisProduct,
                        total: custUnitPrice * cumulativeQtyForThisProduct,
                        color: item.color || item.colorName
                    });
                }
                if (isEmbroidery(posMethod)) hasEmbroidery = true;
            });
            
            // Only check customizations if positions didn't already provide data (avoid double-counting)
            if (!foundPositionData && item.customizations) {
                // Handle both array format and object format
                const custEntries = Array.isArray(item.customizations)
                    ? item.customizations.map((c, i) => ({ ...c, _idx: i }))
                    : (typeof item.customizations === 'object')
                        ? Object.entries(item.customizations).map(([k, v]) => ({ ...v, _posKey: k }))
                        : [];
                
                custEntries.forEach(posData => {
                    if (!posData || !posData.method) return;
                    
                    const methodLabel = normalizeMethod(posData.method);
                    const custUnitPrice = posData.unitPrice || (isEmbroidery(posData.method) ? 5.00 : 3.50);
                    const posSlug = posData.posKey || posData._posKey || '';
                    const positionName = posSlug ? canonicalPositionName(posSlug) : (posData.position || posData.name || 'Position');
                    // Also derive canonical name for robust dedup
                    const canonName = canonicalPositionName(posSlug || positionName);
                    
                    // Check if already added (dedup by SLUG when available, ALSO by canonical display name)
                    const existingCustom = allBasketCustomizations.find(c => 
                        c.productCode === itemCode && 
                        c.method === methodLabel &&
                        (
                            (posSlug && c.posKey === posSlug) ||
                            c.position === canonName ||
                            c.position === positionName
                        )
                    );
                    
                    if (!existingCustom) {
                        allBasketCustomizations.push({
                            productCode: itemCode,
                            posKey: posSlug,
                            position: positionName,
                            method: methodLabel,
                            unitPrice: custUnitPrice,
                            qty: cumulativeQtyForThisProduct,
                            total: custUnitPrice * cumulativeQtyForThisProduct,
                            color: item.color || item.colorName
                        });
                    }
                    if (isEmbroidery(posData.method)) hasEmbroidery = true;
                });
            }
        });
        
        // ===== CURRENT SELECTION (not yet saved) =====
        const currentGarmentTotal = unitPrice * currentQty;
        let currentCustomTotal = 0;
        const currentCustomizations = [];
        
        // Use only current item quantity for customization calculations
        let totalQtyForCustomizations = currentQty;
        
        // Build set of position keys AND canonical names already in basket customizations (to avoid dupes)
        const basketPositionKeys = new Set(allBasketCustomizations.map(c => c.posKey).filter(Boolean));
        const basketPositionNames = new Set(allBasketCustomizations.map(c => c.position).filter(Boolean));
        
        // Get all checked position cards
        const checkedCards = document.querySelectorAll('.position-card input[type="checkbox"]:checked');
        debugLog('?? Checked position cards:', checkedCards.length);
        
        checkedCards.forEach(checkbox => {
            const card = checkbox.closest('.position-card');
            const position = checkbox.value;
            const positionName = canonicalPositionName(position);
            const method = state.positionMethods && state.positionMethods[position];
            
            // Skip if this position is already accounted for in basket customizations
            // Check BOTH by slug key AND by canonical display name (handles inconsistent formats)
            if (basketPositionKeys.has(position) || basketPositionNames.has(positionName)) {
                debugLog('?? Skipping position (already in basket):', position);
                return;
            }
            
            debugLog('?? Analyzing position:', { position, positionName, method, totalQtyForCustomizations });
            
            if (method && totalQtyForCustomizations > 0) {
                // Get price from active badge
                const activeBadge = card.querySelector(`.price-badge.price-${method === 'embroidery' ? 'emb' : 'print'}.active`);
                debugLog('?? Active badge found:', activeBadge, 'for method:', method);
                
                if (activeBadge) {
                    const priceText = activeBadge.querySelector('.price-value')?.textContent || '';
                    const fallbackPrice = method === 'embroidery' ? '5.00' : '3.50';
                    const priceMatch = priceText.match(/[\d.]+/) || fallbackPrice.match(/[\d.]+/);
                    if (priceMatch) {
                        const pricePerItem = parseFloat(priceMatch[0]);
                        const totalForPosition = pricePerItem * totalQtyForCustomizations;
                        currentCustomTotal += totalForPosition;
                        
                        debugLog('?? Adding customization cost:', { position, method, pricePerItem, totalQtyForCustomizations, totalForPosition });
                        
                        if (method === 'embroidery') hasEmbroidery = true;
                        
                        currentCustomizations.push({
                            posKey: position,
                            position: positionName,
                            method: method === 'embroidery' ? 'Embroidery' : 'Print',
                            unitPrice: pricePerItem,
                            qty: totalQtyForCustomizations,
                            total: totalForPosition
                        });
                    }
                }
            }
        });
        
        // ===== CURRENT-ITEM-ONLY TOTALS (for Cost Breakdown sidebar) =====
        let currentHasEmbroidery = currentCustomizations.some(c => c.method === 'Embroidery');
        let currentCustomTotalOnly = 0;
        currentCustomizations.forEach(c => currentCustomTotalOnly += c.total);
        const currentSetupFee = currentHasEmbroidery ? 25.00 : 0;
        const currentItemTotal = currentGarmentTotal + currentCustomTotalOnly + currentSetupFee;

        // ===== GRAND TOTALS (basket + current, for action bar) =====
        const grandGarmentTotal = totalBasketGarmentCost + currentGarmentTotal;
        const allCustomizations = [...allBasketCustomizations, ...currentCustomizations];
        let grandCustomTotal = 0;
        allCustomizations.forEach(c => grandCustomTotal += c.total);

        // Prevent double digitizing fee (apply only once if any embroidery logo present)
        let digitizingFee = 0;
        let digitizingFeeApplied = false; // NEW: track if already applied
        
        // Setup fee (£25 one-time for embroidery only)
        const setupFeeBase = hasEmbroidery ? 25.00 : 0;
        
        // GRAND TOTAL (ex VAT)
        const grandTotal = grandGarmentTotal + grandCustomTotal + setupFeeBase;
        
        debugLog('?? GRAND TOTALS:', {
            basketGarment: totalBasketGarmentCost,
            currentGarment: currentGarmentTotal,
            grandGarment: grandGarmentTotal,
            customizations: grandCustomTotal,
            setup: setupFeeBase,
            GRAND_TOTAL: grandTotal
        });

        // Update summary color
        const summaryColor = document.getElementById('summaryColor');
        if (summaryColor) {
            summaryColor.textContent = state.selectedColorName || state.selectedColor;
        }

        // Update size breakdown
        const summarySizes = document.getElementById('summarySizes');
        if (summarySizes) {
            let sizesHtml = '';
            if (state.sizeQuantities && Object.keys(state.sizeQuantities).length > 0) {
                Object.entries(state.sizeQuantities).forEach(([size, sizeQty]) => {
                    if (sizeQty > 0) {
                        sizesHtml += `<div class="size-row"><span>${size}</span><span>£${sizeQty}</span></div>`;
                    }
                });
            } else {
                sizesHtml = `<div class="size-row"><span>Select sizes above</span></div>`;
            }
            summarySizes.innerHTML = sizesHtml;
        }

        // Get total items count from basket
        let totalItemsInBasket = 0;
        basket.forEach(item => {
            // Check for totalQty first (new format), then quantity/qty, then sum sizes/quantities objects
            if (item.totalQty) {
                totalItemsInBasket += item.totalQty;
            } else if (item.quantity || item.qty) {
                totalItemsInBasket += item.quantity || item.qty || 0;
            } else if (item.sizes) {
                // Sum up sizes object
                Object.values(item.sizes).forEach(qty => {
                    totalItemsInBasket += parseInt(qty) || 0;
                });
            } else if (item.quantities) {
                // Sum up quantities object
                Object.values(item.quantities).forEach(qty => {
                    totalItemsInBasket += parseInt(qty) || 0;
                });
            }
        });
        const displayQty = totalItemsInBasket + currentQty;
        
        debugLog('?? DISPLAY QTY:', { totalItemsInBasket, currentQty, displayQty, basketLength: basket.length });

        // Update quantity and prices
        const summaryQty = document.getElementById('summaryQty');
        if (summaryQty) summaryQty.textContent = displayQty;

        const summaryUnitPrice = document.getElementById('summaryUnitPrice');
        if (summaryUnitPrice) {
            summaryUnitPrice.textContent = formatCurrency(unitPrice);
        }

        // TOTAL garment cost (ALL basket + current)
        const summaryGarmentTotal = document.getElementById('summaryGarmentTotal');
        if (summaryGarmentTotal) {
            summaryGarmentTotal.textContent = formatCurrency(grandGarmentTotal);
        }

        // Discount row (based on current tier)
        const summaryDiscountRow = document.getElementById('summaryDiscount');
        if (summaryDiscountRow) {
            if (currentTier && currentTier.discount > 0) {
                summaryDiscountRow.style.display = 'flex';
                document.getElementById('summaryDiscountPercent').textContent = `-${currentTier.discount}%`;
                const fullPriceTotal = basePrice * displayQty;
                const discountAmount = fullPriceTotal - grandGarmentTotal;
                document.getElementById('summaryDiscountAmount').textContent = `-${formatCurrency(discountAmount)}`;
            } else {
                summaryDiscountRow.style.display = 'none';
            }
        }

        // Update customization breakdown - ALL customizations (basket + current)
        const summaryCustomizationBreakdown = document.getElementById('summaryCustomizationBreakdown');
        if (summaryCustomizationBreakdown) {
            if (allCustomizations.length > 0) {
                let breakdownHtml = '';
                allCustomizations.forEach(item => {
                    const methodClass = item.method === 'Embroidery' ? 'customization-card-embroidery' : 'customization-card-print';
                    
                    breakdownHtml += `
                        <div class="customization-card ${methodClass}">
                            <div class="customization-card-header">
                                <span class="customization-position">${item.position} ${item.method}</span>
                                <span class="customization-total">${item.qty} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)} <span class="vat-suffix">${vatSuffix()}</span></span>
                            </div>
                        </div>
                    `;
                });
                summaryCustomizationBreakdown.innerHTML = breakdownHtml;
            } else {
                summaryCustomizationBreakdown.innerHTML = '';
            }
        }
        
        // ===== UPDATE NEW SIDEBAR-COSTS (current item only) =====
        // Update Garment Cost in sidebar — show CURRENT item only
        const sidebarGarmentCost = document.getElementById('sidebarGarmentCost');
        if (sidebarGarmentCost) {
            sidebarGarmentCost.textContent = formatCurrency(currentGarmentTotal);
        }
        
        const garmentDetailCalc = document.getElementById('garmentDetailCalc');
        if (garmentDetailCalc) {
            if (currentQty > 0) {
                garmentDetailCalc.textContent = `${formatCurrency(unitPrice)} × ${currentQty} = ${formatCurrency(currentGarmentTotal)}`;
            } else {
                garmentDetailCalc.textContent = `${formatCurrency(0)} × 0 = ${formatCurrency(0)}`;
            }
        }
        
        // Also update legacy detail elements (old HTML may still be cached)
        const garmentUnitPrice = document.getElementById('garmentUnitPrice');
        if (garmentUnitPrice) {
            const effectiveUnitPrice = displayQty > 0 ? grandGarmentTotal / displayQty : 0;
            garmentUnitPrice.textContent = formatCurrency(effectiveUnitPrice);
        }
        const garmentQty = document.getElementById('garmentQty');
        if (garmentQty) {
            garmentQty.textContent = `Qty: ${displayQty}`;
        }
        
        // Update Step Discount row in sidebar
        const sidebarDiscountRow = document.getElementById('sidebarDiscountRow');
        if (sidebarDiscountRow) {
            if (currentTier && currentTier.discount > 0 && displayQty > 0) {
                sidebarDiscountRow.style.display = 'block';
                document.getElementById('sidebarDiscountPercent').textContent = `${currentTier.discount}%`;
                const fullPriceTotal = basePrice * displayQty;
                const discountSaving = fullPriceTotal - grandGarmentTotal;
                document.getElementById('sidebarDiscountAmount').textContent = `-${formatCurrency(discountSaving)}`;
            } else {
                sidebarDiscountRow.style.display = 'none';
            }
        }
        
        // Update customization costs list with colored cards — current item only
        const customizationCostsList = document.getElementById('customizationCostsList');
        if (customizationCostsList) {
            if (currentCustomizations.length > 0) {
                let costsHtml = '';
                currentCustomizations.forEach(item => {
                    // Use different class for print vs embroidery
                    const sectionClass = item.method === 'Print' ? 'section print-method' : 'section embroidery';
                    const methodLabel = item.method === 'Embroidery' ? 'Embroidery' : 'Print';
                    
                    costsHtml += `
                        <div class="${sectionClass}">
                            <div class="row">
                                <span class="label white">${item.position} ${methodLabel}</span>
                                <span class="value white">${formatCurrency(item.total)}</span>
                            </div>
                            <div class="row detail white">
                                <span>${formatCurrency(item.unitPrice)} × ${item.qty} = ${formatCurrency(item.total)}</span>
                            </div>
                        </div>
                    `;
                });
                
                // Add digitizing fee if current item has embroidery
                if (currentHasEmbroidery) {
                    costsHtml += `
                        <div class="row detail" style="padding: 10px 0; border-top: 1px dashed #e5e7eb; margin-top: 8px;">
                            <span style="color: #666;">Digitizing Fee (one-time)</span>
                            <span style="color: #666;">£25.00 ${vatSuffix()}</span>
                        </div>
                    `;
                }
                
                customizationCostsList.innerHTML = costsHtml;
            } else {
                customizationCostsList.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 12px 0; font-size: 13px;">No customizations selected</p>';
            }
        }
        
        // Update sidebar total — current item only
        const sidebarTotalCost = document.getElementById('sidebarTotalCost');
        if (sidebarTotalCost) {
            sidebarTotalCost.innerHTML = `${formatCurrency(currentItemTotal)} <span class="vat-suffix">${vatSuffix()}</span>`;
        }
        
        // Update basket items list
        updateBasketItemsList(basket, unitPrice);
        
        // Show/hide Digitizing Fee row
        const digitizingFeeRow = document.getElementById('digitizingFeeRow');
        if (digitizingFeeRow) {
            digitizingFeeRow.style.display = hasEmbroidery ? 'flex' : 'none';
        }
        
        // Calculate and update Branding Total (customizations + digitizing if applicable)
        const brandingTotalEl = document.getElementById('brandingTotal');
        if (brandingTotalEl) {
            const brandingTotal = grandCustomTotal + (hasEmbroidery ? 25.00 : 0);
            brandingTotalEl.textContent = formatCurrency(brandingTotal);
        }

        // GRAND TOTAL (ALL basket + current)
        const summaryTotal = document.getElementById('summaryTotal');
        if (summaryTotal) {
            summaryTotal.innerHTML = `<span style="color: #E8A0BF; font-weight: 600;">${formatCurrency(grandTotal)}</span> <span class="vat-suffix">${vatSuffix()}</span>`;
        }
        
        // Also update the card header total to match
        const cardHeaderTotal = document.getElementById('cardHeaderTotal');
        if (cardHeaderTotal) {
            cardHeaderTotal.textContent = formatCurrency(grandTotal);
        }
        
        // And the card face total
        const cardTotal = document.getElementById('cardTotal');
        if (cardTotal) {
            cardTotal.textContent = formatCurrency(grandTotal);
        }

        // Update VAT suffix labels
        document.querySelectorAll('.vat-suffix').forEach(el => {
            el.textContent = vatSuffix();
        });

        // Update action bar total — current item only
        const actionBarTotal = document.getElementById('actionBarTotal');
        if (actionBarTotal) {
            actionBarTotal.textContent = formatCurrency(currentItemTotal);
        }
        
        // Update action bar qty
        const actionBarQty = document.getElementById('actionBarQty');
        if (actionBarQty) {
            actionBarQty.textContent = displayQty;
        }
        
        // Update action bar suffix
        const actionVatSuffix = document.querySelector('.action-bar .price-suffix');
        if (actionVatSuffix) {
            actionVatSuffix.textContent = vatSuffix();
        }
        
        // Update order card
        updateOrderCard();
    }

    // === Update Basket Count Badge in Navigation ===
    function updateBasketCount() {
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        let totalItems = 0;
        
        basket.forEach(item => {
            const sizes = item.sizes || item.quantities || {};
            if (Object.keys(sizes).length > 0) {
                Object.values(sizes).forEach(qty => {
                    totalItems += Number(qty) || 0;
                });
            } else if (item.totalQty) {
                totalItems += Number(item.totalQty) || 0;
            } else if (item.quantity) {
                totalItems += Number(item.quantity) || 0;
            }
        });
        
        // Update all basket badges in navigation
        const badges = document.querySelectorAll('.nav-badge');
        badges.forEach(badge => {
            if (totalItems > 0) {
                badge.textContent = totalItems > 99 ? '99+' : totalItems;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    // === Update Basket Items List with full basket-like controls ===
    function updateBasketItemsList(basket, unitPrice) {
        const basketItemsList = document.getElementById('basketItemsList');
        if (!basketItemsList) return;
        
        let itemsHtml = '';
        
        // Position name helper (same as basket.html)
        const posMap = {
            'left-chest':'Left Chest','right-chest':'Right Chest','front-center':'Front Center',
            'back-large':'Back Large','left-sleeve':'Left Sleeve','right-sleeve':'Right Sleeve',
            'left-breast':'Left Chest','right-breast':'Right Chest',
            'small-centre-front':'Centre Front','large-front-center':'Front Center',
            'large-back':'Back','left-arm':'Left Arm','right-arm':'Right Arm'
        };
        function toReadablePos(slug) {
            if (!slug) return 'Logo';
            return posMap[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        
        // FIRST: Show CURRENT product being customized (if any items selected)
        if (state.quantity > 0 && state.product) {
            const currentImage = state.selectedColorImage || state.product.imageUrl || 'assets/images/products/default.jpg';
            const currentColor = state.selectedColorName || 'Not selected';
            const currentName = state.product.name || 'Custom Product';
            const currentCode = state.product.code || '';
            
            // Build sizes with +/- controls for current product
            let currentSizesHtml = '';
            if (state.sizeQuantities && Object.keys(state.sizeQuantities).length > 0) {
                Object.entries(state.sizeQuantities).filter(([, qty]) => qty > 0).forEach(([size, qty]) => {
                    currentSizesHtml += `
                        <div class="summary-size-row">
                            <span class="summary-size-label">${size}</span>
                            <div class="summary-qty-controls">
                                <button type="button" class="summary-qty-btn minus" data-index="current" data-size="${size}">\u2212</button>
                                <span class="summary-qty-value">${qty}</span>
                                <button type="button" class="summary-qty-btn plus" data-index="current" data-size="${size}">+</button>
                            </div>
                        </div>`;
                });
            }
            
            // Get logo for current item
            const currentLogo = getLogoFromState();
            const currentLogoThumb = currentLogo
                ? `<img src="${currentLogo}" alt="Logo" style="width:100%;height:100%;object-fit:contain;">`
                : `<span style="font-size:10px;color:#9ca3af;text-align:center;">No logo</span>`;
            
            itemsHtml += `
                <div class="summary-item-card current-item" style="border: 2px solid #273469; background: #f0eef5;">
                    <div class="summary-item-top">
                        <label class="summary-item-checkbox"><input type="checkbox" class="summary-select-cb" data-index="current"></label>
                        <div class="summary-item-image">
                            <img src="${currentImage}" alt="${currentName}" onerror="this.src='../brandedukv15-child/assets/images/products/default.jpg'">
                        </div>
                        <div class="summary-item-info">
                            <h4>${currentName} <span style="color: #273469; font-size: 11px;">(Current)</span></h4>
                            <p style="font-size: 11px; color: #6b7280;">${currentCode}</p>
                            <p style="font-size: 12px; color: #6b7280;">Color: ${currentColor}</p>
                        </div>
                        <div class="summary-logo-col">
                            <div class="summary-item-logo-thumb">${currentLogoThumb}</div>
                            <span class="summary-customize-badge" data-index="current">
                                ${currentLogo ? '✎ Edit' : '+ Add Logo'}
                            </span>
                        </div>
                        <button type="button" class="summary-item-remove" data-index="current">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                        </button>
                    </div>
                    <div class="summary-item-sizes">${currentSizesHtml}</div>
                </div>
            `;
        }
        
        // THEN: Show basket items
        if (!basket || basket.length === 0) {
            if (itemsHtml === '') {
                basketItemsList.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 16px 0; font-size: 13px;">No items in basket</p>';
                return;
            }
        }
        
        // Add basket items
        if (basket && basket.length > 0) {
            basket.forEach((item, index) => {
                const itemImage = item.colorImage || item.image || 'assets/images/products/default.jpg';
                const itemColor = item.color || 'Black';
                const itemName = item.productName || item.name || 'Custom Product';
                const itemCode = item.productCode || '';
                
                const sizes = item.sizes || item.quantities || {};
                
                // Build +/- controls for each size
                let sizesHtml = '';
                Object.entries(sizes).filter(([, qty]) => qty > 0).forEach(([size, qty]) => {
                    sizesHtml += `
                        <div class="summary-size-row">
                            <span class="summary-size-label">${size}</span>
                            <div class="summary-qty-controls">
                                <button type="button" class="summary-qty-btn minus" data-index="${index}" data-size="${size}">\u2212</button>
                                <span class="summary-qty-value">${qty}</span>
                                <button type="button" class="summary-qty-btn plus" data-index="${index}" data-size="${size}">+</button>
                            </div>
                        </div>`;
                });
                
                // Get logo thumbnail — fallback to sibling with same productCode, or current state
                let logoSrc = getItemLogoSrc(item);
                if (!logoSrc && itemCode) {
                    const currentLogo = getLogoFromState();
                    if (currentLogo && state.product?.code === itemCode) {
                        logoSrc = currentLogo;
                    }
                    if (!logoSrc) {
                        const sibling = basket.find(b => (b.productCode || '') === itemCode && b !== item && getItemLogoSrc(b));
                        if (sibling) logoSrc = getItemLogoSrc(sibling);
                    }
                }
                const logoThumb = logoSrc
                    ? `<img src="${logoSrc}" alt="Logo" style="width:100%;height:100%;object-fit:contain;">`
                    : `<span style="font-size:10px;color:#9ca3af;text-align:center;">No logo</span>`;
                
                // Logo position labels
                let logoPosLabels = '';
                if (item.positionDesigns) {
                    const labels = Object.keys(item.positionDesigns).map(p => toReadablePos(p));
                    if (labels.length) logoPosLabels = `<div style="font-size:9px;color:#6b7280;margin-top:2px;text-align:center;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${labels.join(', ')}</div>`;
                }
                
                // Item note
                const savedNote = item.note || '';
                
                itemsHtml += `
                    <div class="summary-item-card" data-index="${index}">
                        <div class="summary-item-top">
                            <label class="summary-item-checkbox"><input type="checkbox" class="summary-select-cb" data-index="${index}"></label>
                            <div class="summary-item-image">
                                <img src="${itemImage}" alt="${itemName}" onerror="this.src='../brandedukv15-child/assets/images/products/default.jpg'">
                            </div>
                            <div class="summary-item-info">
                                <h4>${itemName}</h4>
                                <p style="font-size: 12px; color: #6b7280;">Color: ${itemColor}</p>
                            </div>
                            <div class="summary-logo-col">
                                <div class="summary-item-logo-thumb">${logoThumb}${logoPosLabels}</div>
                                <span class="summary-customize-badge" data-index="${index}">
                                    ${logoSrc ? '✎ Edit' : '+ Add Logo'}
                                </span>
                            </div>
                            <button type="button" class="summary-item-remove" data-index="${index}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                            </button>
                        </div>
                        <div class="summary-item-sizes">${sizesHtml}</div>
                        <div class="summary-item-actions">
                            <button type="button" class="summary-edit-btn" data-index="${index}">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Edit
                            </button>
                            <button type="button" class="summary-copy-btn" data-index="${index}">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                                Copy
                            </button>
                        </div>
                        ${savedNote ? `<div class="summary-item-note-preview">\u{1F4DD} ${savedNote.substring(0, 50)}${savedNote.length > 50 ? '...' : ''}</div>` : ''}
                    </div>
                `;
            });
        }
        
        basketItemsList.innerHTML = itemsHtml;
        
        // --- Floating "Delete Selected" bar ---
        let deleteBar = document.getElementById('summaryDeleteBar');
        if (!deleteBar) {
            deleteBar = document.createElement('div');
            deleteBar.id = 'summaryDeleteBar';
            deleteBar.style.cssText = 'display:none;position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;padding:10px 20px;border-radius:24px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.25);cursor:pointer;gap:8px;align-items:center;';
            deleteBar.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> <span id="deleteBarText">Delete Selected (0)</span>';
            document.body.appendChild(deleteBar);
            deleteBar.addEventListener('click', () => {
                deleteSelectedSummaryItems();
            });
        }
        
        function updateDeleteBar() {
            const checked = basketItemsList.querySelectorAll('.summary-select-cb:checked');
            if (checked.length > 0) {
                deleteBar.style.display = 'flex';
                document.getElementById('deleteBarText').textContent = 'Delete Selected (' + checked.length + ')';
            } else {
                deleteBar.style.display = 'none';
            }
        }
        
        // --- Attach event listeners ---
        
        // Checkbox change
        basketItemsList.querySelectorAll('.summary-select-cb').forEach(cb => {
            cb.addEventListener('change', () => { updateDeleteBar(); });
        });
        
        // Remove buttons
        basketItemsList.querySelectorAll('.summary-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idxRaw = btn.dataset.index;
                if (idxRaw === 'current') {
                    // Clear current selection
                    state.sizeQuantities = {};
                    state.quantity = 0;
                    // Reset size UI
                    const sizeRows = document.querySelectorAll('.size-qty-value');
                    sizeRows.forEach(el => { el.textContent = '0'; });
                    const totalSpan = document.getElementById('totalQty');
                    if (totalSpan) totalSpan.textContent = '0';
                    updatePricingSummary();
                    if (typeof showToast === 'function') showToast('Current selection cleared');
                    return;
                }
                const idx = parseInt(idxRaw);
                removeBasketItem(idx);
            });
        });
        
        // +/- qty buttons
        basketItemsList.querySelectorAll('.summary-qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = btn.dataset.index;
                const size = btn.dataset.size;
                const delta = btn.classList.contains('plus') ? 1 : -1;
                
                if (idx === 'current') {
                    // Modify current state
                    if (!state.sizeQuantities) return;
                    const newQty = Math.max(0, (state.sizeQuantities[size] || 0) + delta);
                    if (newQty === 0) {
                        delete state.sizeQuantities[size];
                    } else {
                        state.sizeQuantities[size] = newQty;
                    }
                    state.quantity = Object.values(state.sizeQuantities).reduce((s, q) => s + q, 0);
                    updatePricingSummary();
                } else {
                    // Modify basket item
                    let bsk = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                    const i = parseInt(idx);
                    if (!bsk[i]) return;
                    const sizes = bsk[i].sizes || bsk[i].quantities || {};
                    const newQty = Math.max(0, (sizes[size] || 0) + delta);
                    if (newQty === 0) {
                        delete sizes[size];
                    } else {
                        sizes[size] = newQty;
                    }
                    // Update totalQty
                    const totalQ = Object.values(sizes).reduce((s, q) => s + q, 0);
                    if (totalQ === 0) {
                        // Remove item if no sizes left
                        bsk.splice(i, 1);
                    } else {
                        bsk[i].totalQty = totalQ;
                        if (bsk[i].sizes) bsk[i].sizes = sizes;
                        if (bsk[i].quantities) bsk[i].quantities = sizes;
                    }
                    localStorage.setItem('quoteBasket', JSON.stringify(bsk));
                    updateBasketCount();
                    updatePricingSummary();
                }
            });
        });
        
        // Copy buttons
        basketItemsList.querySelectorAll('.summary-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                let bsk = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                if (!bsk[idx]) return;
                const copy = JSON.parse(JSON.stringify(bsk[idx]));
                copy.id = Date.now().toString();
                copy.addedAt = new Date().toISOString();
                bsk.splice(idx + 1, 0, copy);
                localStorage.setItem('quoteBasket', JSON.stringify(bsk));
                updateBasketCount();
                updatePricingSummary();
            });
        });
        
        // Edit buttons - go to basket page
        basketItemsList.querySelectorAll('.summary-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = '../basket.html';
            });
        });
        
        // --- Method picker mini popup ---
        function _showMethodPicker(position, itemIndex) {
            // Remove existing picker if any
            let existing = document.getElementById('methodPickerOverlay');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'methodPickerOverlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:10002;display:flex;align-items:center;justify-content:center;padding:16px;';

            const sheet = document.createElement('div');
            sheet.style.cssText = 'background:#fff;border-radius:20px;padding:24px 20px;max-width:320px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.18);text-align:center;animation:logoGalleryScaleIn 0.3s ease;';
            sheet.innerHTML = `
                <h4 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 6px;">Choose Method</h4>
                <p style="font-size:12px;color:#6b7280;margin:0 0 16px;">Select customisation type for this logo</p>
                <div style="display:flex;gap:12px;justify-content:center;">
                    <button type="button" id="mpEmb" style="flex:1;padding:14px 8px;border-radius:12px;border:none;background:linear-gradient(135deg,#4f7df9,#3b6ce7);color:#fff;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(59,108,231,0.3);transition:transform 0.15s;">
                        EMBROIDERY<br><span style="font-size:11px;font-weight:400;opacity:0.85;">£5.00 /item</span>
                    </button>
                    <button type="button" id="mpPrint" style="flex:1;padding:14px 8px;border-radius:12px;border:none;background:linear-gradient(135deg,#f0c040,#daa520);color:#fff;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(218,165,32,0.3);transition:transform 0.15s;">
                        PRINT<br><span style="font-size:11px;font-weight:400;opacity:0.85;">£3.50 /item</span>
                    </button>
                </div>
            `;

            overlay.appendChild(sheet);
            document.body.appendChild(overlay);

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });

            // Embroidery
            sheet.querySelector('#mpEmb').addEventListener('click', () => {
                overlay.remove();
                openDesignModal(position, 'embroidery', 'logo');
            });

            // Print
            sheet.querySelector('#mpPrint').addEventListener('click', () => {
                overlay.remove();
                openDesignModal(position, 'print', 'logo');
            });
        }

        // Customize badge click - open positions section as popup overlay
        basketItemsList.querySelectorAll('.summary-customize-badge[data-index]').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openPositionsPopup();
            });
        });
        

    }

    function ensurePositionsPopupLayout(overlay) {
        const popup = overlay.querySelector('.positions-popup-panel') || overlay.firstElementChild;
        if (!popup || popup.dataset.layoutV2 === '1') return;

        const posSection = document.getElementById('positionsSection');
        const posTitle = document.getElementById('positionsSectionTitle');
        if (!posSection) return;

        const doneBar = popup.querySelector('.positions-popup-footer') ||
            Array.from(popup.children).find(el => el.querySelector && el.querySelector('.positions-done-btn, button'));
        const closeBtn = popup.querySelector('button[aria-label="Close"]') ||
            Array.from(popup.querySelectorAll('button')).find(b => b.textContent.trim() === '×' || b.textContent.trim() === '&times;');

        popup.className = 'positions-popup-panel';
        popup.dataset.layoutV2 = '1';
        popup.style.cssText = '';

        const popupHeader = document.createElement('div');
        popupHeader.className = 'positions-popup-header';
        const popupBody = document.createElement('div');
        popupBody.className = 'positions-popup-scroll';

        if (closeBtn) {
            closeBtn.remove();
            popupHeader.appendChild(closeBtn);
        }
        if (posTitle && posTitle.parentElement !== popupHeader) {
            posTitle.remove();
            popupHeader.appendChild(posTitle);
        }
        if (posSection.parentElement !== popupBody) {
            posSection.remove();
            popupBody.appendChild(posSection);
        }

        if (doneBar) {
            doneBar.className = 'positions-popup-footer';
            doneBar.style.cssText = '';
            if (doneBar.parentElement) doneBar.remove();
        }

        while (popup.firstChild) popup.removeChild(popup.firstChild);
        popup.appendChild(popupHeader);
        popup.appendChild(popupBody);
        if (doneBar) popup.appendChild(doneBar);
    }

    // Open positions section as a popup overlay
    function openPositionsPopup(options) {
        const animate = !options || options.animate !== false;
        // If popup already exists, just show it
        let overlay = document.getElementById('positionsPopupOverlay');
        if (overlay) {
            ensurePositionsPopupLayout(overlay);
            // Re-apply product type position hiding
            if (state.product && state.product.rawData) {
                updatePositionCardsForProductType(state.product.rawData);
            }
            // Force-hide cards not in product config
            const pt = state.product && state.product.rawData ? (state.product.rawData.productType || state.product.rawData.category || state.product.rawData.type || '') : '';
            const nt = normalizeProductTypeForFolder(pt || (state.product && state.product.rawData && state.product.rawData.name ? inferProductTypeFromName(state.product.rawData.name) : ''));
            // Update title
            const titleEl = document.getElementById('positionsSectionTitle');
            if (titleEl) {
                const ptName2 = nt || 'Logo';
                titleEl.textContent = 'Logo Positions: ' + ptName2;
            }
            const fp = PRODUCT_TYPE_TO_FOLDER[nt];
            if (fp) {
                const imgs = FOLDER_IMAGE_MAP[fp] || [];
                const avail = [];
                imgs.forEach(fn => { const pi = FILENAME_TO_POSITION[fn]; if (pi) avail.push(pi.code); });
                // Only hide cards when there are configured images; if empty, show all static defaults
                if (avail.length > 0) {
                    document.querySelectorAll('#positionOptions .position-card, .positions-grid .position-card').forEach(card => {
                        const pos = card.dataset.position;
                        if (!avail.includes(pos)) card.style.display = 'none';
                    });
                } else {
                    document.querySelectorAll('#positionOptions .position-card, .positions-grid .position-card').forEach(card => { card.style.display = ''; });
                }

                // Direct image update (same as basket flow)
                const imgBase = `/brandedukv15-child/assets/images/customization/positions/${fp}`;
                imgs.forEach(fn => {
                    const pi = FILENAME_TO_POSITION[fn];
                    if (!pi) return;
                    const card = document.querySelector(`.position-card[data-position="${pi.code}"]`);
                    if (!card) return;
                    const img = card.querySelector('.position-placeholder');
                    if (img) {
                        if (isApronProductContext(nt) || isHoodieGarmentTintContext(nt)) {
                            setPositionCardGarmentImage(img, `${imgBase}/${fn}`, nt);
                        } else {
                            img.src = `${imgBase}/${fn}`;
                        }
                        img.alt = pi.label;
                    }
                    const labelSpan = card.querySelector('.position-checkbox span');
                    if (labelSpan) labelSpan.textContent = pi.label;
                });

                if (nt === 'Aprons') {
                    finalizeApronGarmentTintOnCards(document.querySelectorAll('#positionOptions, .positions-grid'));
                } else if (isHoodieGarmentTintContext(nt)) {
                    finalizeHoodieGarmentTintOnCards(document.querySelectorAll('#positionOptions, .positions-grid'));
                }

                // Embroidery-only / Print-only
                const EMB_ONLY2 = ['Beanies', 'Fleece'];
                const PRINT_ONLY2 = ['Safety Vests'];
                if (EMB_ONLY2.includes(nt)) {
                    document.querySelectorAll('.price-badge.price-print').forEach(b => b.style.display = 'none');
                }
                if (PRINT_ONLY2.includes(nt)) {
                    document.querySelectorAll('.price-badge.price-emb').forEach(b => b.style.display = 'none');
                }
            }
            revealPositionsPopup(overlay, animate);
            applyGarmentColorToPositionPreviews(overlay);
            const posSec = document.getElementById('positionsSection');
            if (posSec) applyGarmentColorToPositionPreviews(posSec);
            return;
        }

        const posSection = document.getElementById('positionsSection');
        const posTitle = document.getElementById('positionsSectionTitle');
        if (!posSection) return;

        // Create overlay
        overlay = document.createElement('div');
        overlay.id = 'positionsPopupOverlay';
        overlay.removeAttribute('style');

        // Create popup container (header + scroll body + fixed footer)
        const popup = document.createElement('div');
        popup.className = 'positions-popup-panel';
        popup.dataset.layoutV2 = '1';

        const popupHeader = document.createElement('div');
        popupHeader.className = 'positions-popup-header';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            closePositionsPopup();
        });
        popupHeader.appendChild(closeBtn);

        const popupBody = document.createElement('div');
        popupBody.className = 'positions-popup-scroll';

        posSection.style.display = '';
        popupBody.appendChild(posSection);

        // Re-apply product type position hiding after moving cards into popup
        if (state.product && state.product.rawData) {
            updatePositionCardsForProductType(state.product.rawData);
        }
        // Force-hide cards not in product config
        const productType = state.product && state.product.rawData ? (state.product.rawData.productType || state.product.rawData.category || state.product.rawData.type || '') : '';
        const normalizedType = normalizeProductTypeForFolder(productType || (state.product && state.product.rawData && state.product.rawData.name ? inferProductTypeFromName(state.product.rawData.name) : ''));

        if (posTitle) {
            const ptName = normalizedType || 'Logo';
            posTitle.textContent = 'Logo Positions: ' + ptName;
            posTitle.style.display = '';
            popupHeader.appendChild(posTitle);
        }

        const folderPath = PRODUCT_TYPE_TO_FOLDER[normalizedType];
        if (folderPath) {
            const imageFiles = FOLDER_IMAGE_MAP[folderPath] || [];
            const availablePositions = [];
            imageFiles.forEach(fn => { const pi = FILENAME_TO_POSITION[fn]; if (pi) availablePositions.push(pi.code); });
            // Only hide cards when there are configured images; if empty, show all static defaults
            if (availablePositions.length > 0) {
                posSection.querySelectorAll('.position-card').forEach(card => {
                    const pos = card.dataset.position;
                    if (!availablePositions.includes(pos)) {
                        card.style.display = 'none';
                    }
                });
            } else {
                posSection.querySelectorAll('.position-card').forEach(card => { card.style.display = ''; });
            }

            // Direct image update for each visible position card
            // (same approach as applyPositionsOnlyMode in basket flow)
            const imgBasePath = `/brandedukv15-child/assets/images/customization/positions/${folderPath}`;
            imageFiles.forEach(fn => {
                const pi = FILENAME_TO_POSITION[fn];
                if (!pi) return;
                const card = posSection.querySelector(`.position-card[data-position="${pi.code}"]`);
                if (!card) return;
                const img = card.querySelector('.position-placeholder');
                if (img) {
                    if (isApronProductContext(normalizedType) || isHoodieGarmentTintContext(normalizedType)) {
                        setPositionCardGarmentImage(img, `${imgBasePath}/${fn}`, normalizedType);
                    } else {
                        img.src = `${imgBasePath}/${fn}`;
                    }
                    img.alt = pi.label;
                }
                const labelSpan = card.querySelector('.position-checkbox span');
                if (labelSpan) labelSpan.textContent = pi.label;
            });

            if (normalizedType === 'Aprons') {
                finalizeApronGarmentTintOnCards([posSection]);
            } else if (isHoodieGarmentTintContext(normalizedType)) {
                finalizeHoodieGarmentTintOnCards([posSection]);
            }

            // Embroidery-only / Print-only filtering
            const EMB_ONLY = ['Beanies', 'Fleece'];
            const PRINT_ONLY = ['Safety Vests'];
            if (EMB_ONLY.includes(normalizedType)) {
                posSection.querySelectorAll('.price-badge.price-print').forEach(b => b.style.display = 'none');
            }
            if (PRINT_ONLY.includes(normalizedType)) {
                posSection.querySelectorAll('.price-badge.price-emb').forEach(b => b.style.display = 'none');
            }
        }

        const doneBar = document.createElement('div');
        doneBar.className = 'positions-popup-footer';
        doneBar.innerHTML = `<button type="button" class="positions-done-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Done
        </button>`;
        doneBar.querySelector('button').addEventListener('click', () => {
            closePositionsPopup();
            autoSaveToBasket();
            window.location.href = '../basket.html';
        });

        popup.appendChild(popupHeader);
        popup.appendChild(popupBody);
        popup.appendChild(doneBar);

        overlay.appendChild(popup);

        // Close on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closePositionsPopup();
            }
        });

        document.body.appendChild(overlay);
        overlay.style.display = 'none';
        applyGarmentColorToPositionPreviews(posSection);
        applyGarmentColorToPositionPreviews(overlay);
        revealPositionsPopup(overlay, animate);
        requestAnimationFrame(function () {
            applyGarmentColorToPositionPreviews(overlay);
        });
    }

    // Extract logo image src from a basket item
    function getItemLogoSrc(item) {
        // Check customizations array (preferred)
        if (item.customizations && Array.isArray(item.customizations)) {
            const logo = item.customizations.find(c => c.type === 'logo' && c.content);
            if (logo) return logo.content;
            // Also check for logoUrl / logoData fields
            const withLogo = item.customizations.find(c => c.logoUrl || c.logoData || c.uploadedLogo);
            if (withLogo) return withLogo.logoUrl || withLogo.logoData || withLogo.uploadedLogo;
        }
        // Check positionDesigns
        if (item.positionDesigns) {
            for (const design of Object.values(item.positionDesigns)) {
                if (design.logo) return design.logo;
                if (design.logoUrl) return design.logoUrl;
            }
        }
        // Check positions for logo data
        if (item.positions) {
            const posArr = Array.isArray(item.positions) ? item.positions : Object.values(item.positions);
            for (const pos of posArr) {
                if (pos.logo) return pos.logo;
                if (pos.logoUrl) return pos.logoUrl;
            }
        }
        return null;
    }
    
    // === Logo Action Modal ===
    let _logoActionTargetIdx = null;
    let _logoActionSelectedSrc = null;
    
    // Open logo modal for the CURRENT item being customized (in-memory state)
    function openCurrentItemLogoModal() {
        _logoActionTargetIdx = 'current';
        _logoActionSelectedSrc = null;
        
        const modal = document.getElementById('logoActionModal');
        if (!modal) return;
        
        const itemName = state.product?.name || state.productName || 'Current Item';
        
        // Current logo
        const currentLogo = getLogoFromState();
        
        // Title - dynamic based on existing logo
        const title = document.getElementById('logoActionTitle');
        if (title) title.textContent = currentLogo ? `Change Logo – ${itemName}` : `Add Logo – ${itemName}`;
        
        // Populate notes textarea
        const notesArea = document.getElementById('logoActionNote');
        if (notesArea) notesArea.value = state.itemNote || '';
        
        // Show/hide remove button
        let removeBtn = document.getElementById('logoActionRemoveBtn');
        if (!removeBtn) {
            // Create remove button if not exists
            const header = modal.querySelector('.logo-action-header');
            if (header) {
                removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.id = 'logoActionRemoveBtn';
                removeBtn.className = 'logo-action-remove-btn';
                removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Remove Logo';
                removeBtn.style.cssText = 'display:none;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;width:100%;margin-bottom:8px;';
                removeBtn.addEventListener('click', () => {
                    removeCurrentItemLogo();
                    closeLogoActionModal();
                });
                const body = modal.querySelector('.logo-action-body');
                if (body) body.insertBefore(removeBtn, body.firstChild);
            }
        }
        if (removeBtn) removeBtn.style.display = currentLogo ? 'block' : 'none';
        
        // Collect all available logos
        const allLogos = new Set();
        const stateLogo = getLogoFromState();
        if (stateLogo) allLogos.add(stateLogo);
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        basket.forEach(bi => {
            const l = getItemLogoSrc(bi);
            if (l) allLogos.add(l);
        });
        try {
            const galleryLogos = JSON.parse(localStorage.getItem('brandeduk-logos') || '[]');
            galleryLogos.forEach(entry => {
                if (entry.url) allLogos.add(entry.url);
                if (entry.src) allLogos.add(entry.src);
            });
        } catch(e) {}
        
        // Render gallery
        const gallery = document.getElementById('logoActionGallery');
        const existingSection = document.getElementById('logoActionExisting');
        const divider = document.getElementById('logoActionDivider');
        const applyBtn = document.getElementById('logoActionApply');
        const previewDiv = document.getElementById('logoActionPreview');
        
        if (previewDiv) previewDiv.style.display = 'none';
        // Always show Apply/Save button (user can save notes even without logo)
        if (applyBtn) { applyBtn.style.display = 'block'; applyBtn.textContent = 'Save'; }
        
        if (allLogos.size > 0 && gallery && existingSection) {
            existingSection.style.display = 'block';
            if (divider) divider.style.display = 'block';
            gallery.innerHTML = '';
            allLogos.forEach(src => {
                const div = document.createElement('div');
                div.className = 'logo-action-gallery-item';
                if (src === currentLogo) div.className += ' selected';
                div.innerHTML = `<img src="${src}" alt="Logo">`;
                div.addEventListener('click', () => {
                    gallery.querySelectorAll('.logo-action-gallery-item').forEach(el => el.classList.remove('selected'));
                    div.classList.add('selected');
                    _logoActionSelectedSrc = src;
                    if (applyBtn) applyBtn.textContent = 'Apply Logo';
                    if (previewDiv) previewDiv.style.display = 'none';
                });
                gallery.appendChild(div);
            });
        } else {
            if (existingSection) existingSection.style.display = 'none';
            if (divider) divider.style.display = 'none';
        }
        
        // File input handler
        const fileInput = document.getElementById('logoActionFileInput');
        if (fileInput) {
            fileInput.value = '';
            const newInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newInput, fileInput);
            newInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    _logoActionSelectedSrc = ev.target.result;
                    if (gallery) gallery.querySelectorAll('.logo-action-gallery-item').forEach(el => el.classList.remove('selected'));
                    const previewImg = document.getElementById('logoActionPreviewImg');
                    if (previewImg) previewImg.src = ev.target.result;
                    if (previewDiv) previewDiv.style.display = 'block';
                    if (applyBtn) { applyBtn.style.display = 'block'; applyBtn.textContent = 'Apply Logo'; }
                };
                reader.readAsDataURL(file);
            });
        }
        
        // Show modal
        modal.style.display = 'flex';
    }
    
    // Remove logo from current item in-memory state
    function removeCurrentItemLogo() {
        if (state.positionDesigns) {
            for (const key of Object.keys(state.positionDesigns)) {
                if (state.positionDesigns[key]) {
                    state.positionDesigns[key].logo = null;
                }
            }
        }
        // Clear any logo overlay images on the page
        document.querySelectorAll('.logo-overlay-img').forEach(img => {
            img.src = '';
            img.style.display = 'none';
        });
        const previewImg = document.getElementById('designPreviewImg');
        if (previewImg) {
            previewImg.src = '';
            const previewContainer = document.getElementById('designUploadPreview');
            if (previewContainer) previewContainer.hidden = true;
            const uploadZone = document.getElementById('designUploadZone');
            if (uploadZone) uploadZone.style.display = '';
        }
        updatePricingSummary();
        if (typeof showToast === 'function') showToast('Logo removed');
    }
    
    // Remove logo from a saved basket item in localStorage
    function removeBasketItemLogo(itemIndex) {
        let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        const item = basket[itemIndex];
        if (!item) return;
        if (item.positionDesigns) {
            Object.keys(item.positionDesigns).forEach(key => {
                if (item.positionDesigns[key]) item.positionDesigns[key].logo = null;
            });
        }
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
        updatePricingSummary();
        if (typeof showToast === 'function') showToast('Logo removed');
    }
    
    function openLogoActionModal(itemIndex) {
        _logoActionTargetIdx = itemIndex;
        _logoActionSelectedSrc = null;
        
        const modal = document.getElementById('logoActionModal');
        if (!modal) return;
        
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        const item = basket[itemIndex];
        const itemName = item ? (item.productName || item.name || 'Item') : 'Item';
        const existingLogo = item ? getItemLogoSrc(item) : null;
        
        // Title
        const title = document.getElementById('logoActionTitle');
        if (title) title.textContent = existingLogo ? `Change Logo – ${itemName}` : `Add Logo – ${itemName}`;
        
        // Show/hide remove button
        let removeBtn = document.getElementById('logoActionRemoveBtn');
        if (!removeBtn) {
            const body = modal.querySelector('.logo-action-body');
            if (body) {
                removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.id = 'logoActionRemoveBtn';
                removeBtn.className = 'logo-action-remove-btn';
                removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Remove Logo';
                removeBtn.style.cssText = 'display:none;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;width:100%;margin-bottom:8px;';
                body.insertBefore(removeBtn, body.firstChild);
            }
        }
        if (removeBtn) {
            removeBtn.style.display = existingLogo ? 'block' : 'none';
            const newRemoveBtn = removeBtn.cloneNode(true);
            removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
            newRemoveBtn.addEventListener('click', () => {
                removeBasketItemLogo(itemIndex);
                closeLogoActionModal();
            });
        }
        
        // Notes
        let notesArea = document.getElementById('logoActionNote');
        if (notesArea) notesArea.value = item?.note || '';
        
        // Hide old small gallery sections
        const existingSection = document.getElementById('logoActionExisting');
        const divider = document.getElementById('logoActionDivider');
        const uploadBtn = document.getElementById('logoActionUploadBtn');
        const previewDiv = document.getElementById('logoActionPreview');
        if (existingSection) existingSection.style.display = 'none';
        if (divider) divider.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'none';
        if (previewDiv) previewDiv.style.display = 'none';
        
        // Render the full gallery (drag-drop + thumbnails) inside the modal body
        let galleryContainer = document.getElementById('logoActionFullGallery');
        if (!galleryContainer) {
            galleryContainer = document.createElement('div');
            galleryContainer.id = 'logoActionFullGallery';
            const body = modal.querySelector('.logo-action-body');
            if (body) body.insertBefore(galleryContainer, body.firstChild.nextSibling || null);
        }
        
        const applyBtn = document.getElementById('logoActionApply');
        if (applyBtn) { applyBtn.style.display = 'block'; applyBtn.textContent = 'Save'; }
        
        if (typeof window.BrandedLogoLibrary !== 'undefined') {
            window.BrandedLogoLibrary.renderGallery(galleryContainer, {
                onSelect: function(logoEntry) {
                    _logoActionSelectedSrc = logoEntry.url;
                    if (applyBtn) { applyBtn.style.display = 'block'; applyBtn.textContent = 'Apply Logo'; }
                    if (navigator.vibrate) navigator.vibrate(10);
                },
            });
        }
        
        // Show modal
        modal.style.display = 'flex';
    }
    
    function closeLogoActionModal() {
        const modal = document.getElementById('logoActionModal');
        if (modal) modal.style.display = 'none';
        _logoActionTargetIdx = null;
        _logoActionSelectedSrc = null;
    }
    
    function applyLogoAction() {
        // Get notes value (always saveable, even without logo)
        const notesArea = document.getElementById('logoActionNote');
        const noteValue = notesArea ? notesArea.value.trim() : '';
        
        const hasLogo = !!_logoActionSelectedSrc;
        const hasNote = noteValue.length > 0;
        
        if (_logoActionTargetIdx === null || (!hasLogo && !hasNote)) return;
        
        if (_logoActionTargetIdx === 'current') {
            // Save note to state
            state.itemNote = noteValue;
            
            // Apply logo to current in-memory state (if selected)
            if (hasLogo) {
                if (!state.positionDesigns) state.positionDesigns = {};
                let posKey = Object.keys(state.positionDesigns)[0] || 'small-centre-front';
                if (!state.positionDesigns[posKey]) {
                    state.positionDesigns[posKey] = { logo: _logoActionSelectedSrc, position: posKey };
                } else {
                    state.positionDesigns[posKey].logo = _logoActionSelectedSrc;
                }
                // Update logo overlay on position cards
                document.querySelectorAll('.logo-overlay-img').forEach(img => {
                    img.src = _logoActionSelectedSrc;
                    img.style.display = 'block';
                });
                // Update design preview
                const previewImg = document.getElementById('designPreviewImg');
                if (previewImg) {
                    previewImg.src = _logoActionSelectedSrc;
                    const previewContainer = document.getElementById('designUploadPreview');
                    if (previewContainer) previewContainer.hidden = false;
                    const uploadZone = document.getElementById('designUploadZone');
                    if (uploadZone) uploadZone.style.display = 'none';
                }
            }
            // Save to logo gallery
            if (hasLogo) {
                try {
                    const logos = JSON.parse(localStorage.getItem('brandeduk-logos') || '[]');
                    if (!logos.some(l => l.url === _logoActionSelectedSrc || l.src === _logoActionSelectedSrc)) {
                        logos.push({ url: _logoActionSelectedSrc, name: 'Logo', date: new Date().toISOString() });
                        localStorage.setItem('brandeduk-logos', JSON.stringify(logos));
                    }
                } catch(e) {}
            }
            closeLogoActionModal();
            updatePricingSummary();
            resetAutoSaveTimer();
            if (typeof showToast === 'function') showToast(hasLogo ? 'Logo applied!' : 'Note saved!');
            return;
        }
        
        let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        const item = basket[_logoActionTargetIdx];
        if (!item) { closeLogoActionModal(); return; }
        
        // Save note to basket item
        item.note = noteValue;
        
        // Apply logo (if selected)
        if (hasLogo) {
            let posKey = 'small-centre-front';
            if (item.positions && typeof item.positions === 'object') {
                const keys = Object.keys(item.positions);
                if (keys.length) posKey = keys[0];
            }
            if (!item.positionDesigns) item.positionDesigns = {};
            if (!item.positionDesigns[posKey]) {
                item.positionDesigns[posKey] = { logo: _logoActionSelectedSrc, position: posKey };
            } else {
                item.positionDesigns[posKey].logo = _logoActionSelectedSrc;
            }
        }
        
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
        closeLogoActionModal();
        updatePricingSummary();
        if (typeof showToast === 'function') showToast(hasLogo ? 'Logo applied!' : 'Note saved!');
    }
    
    // Wire up modal close/apply on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        const closeBtn = document.getElementById('logoActionClose');
        if (closeBtn) closeBtn.addEventListener('click', closeLogoActionModal);
        
        const applyBtn = document.getElementById('logoActionApply');
        if (applyBtn) applyBtn.addEventListener('click', applyLogoAction);
        
        const overlay = document.getElementById('logoActionModal');
        if (overlay) overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeLogoActionModal();
        });
    });

    // Get logo from current in-memory state (not localStorage)
    function getLogoFromState() {
        // Check positionDesigns
        if (state.positionDesigns) {
            for (const design of Object.values(state.positionDesigns)) {
                if (design && design.logo) return design.logo;
            }
        }
        // Check the design preview img as fallback
        const previewImg = document.getElementById('designPreviewImg');
        if (previewImg && previewImg.src && previewImg.src !== window.location.href) {
            return previewImg.src;
        }
        // Check any logo overlay on position cards
        const overlayImg = document.querySelector('.logo-overlay-img[src]');
        if (overlayImg && overlayImg.src && overlayImg.src !== window.location.href) {
            return overlayImg.src;
        }
        return null;
    }
    
    // Handle +/- quantity changes in basket
    function handleBasketQtyChange(itemIndex, size, isIncrement) {
        let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        if (itemIndex < 0 || itemIndex >= basket.length) return;
        
        const item = basket[itemIndex];
        if (!item.sizes || !item.sizes[size]) return;
        
        if (isIncrement) {
            item.sizes[size]++;
        } else {
            item.sizes[size]--;
            if (item.sizes[size] <= 0) {
                delete item.sizes[size];
            }
        }
        
        // Remove item if no sizes left
        if (Object.keys(item.sizes).length === 0) {
            basket.splice(itemIndex, 1);
        }
        
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
        updateBasketCount();
        updatePricingSummary();
    }
    
    // Remove item from basket
    function removeBasketItem(itemIndex) {
        let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        if (itemIndex < 0 || itemIndex >= basket.length) return;
        
        basket.splice(itemIndex, 1);
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
        updateBasketCount();
        updatePricingSummary();
    }

    /** Delete all selected items from summary (multi-select delete) */
    function deleteSelectedSummaryItems() {
        const checked = document.querySelectorAll('.summary-select-cb:checked');
        if (!checked.length) return;

        const basketIndices = [];
        let clearCurrent = false;

        checked.forEach(cb => {
            const idx = cb.dataset.index;
            if (idx === 'current') {
                clearCurrent = true;
            } else {
                basketIndices.push(parseInt(idx));
            }
        });

        // Clear current selection if checked
        if (clearCurrent) {
            state.sizeQuantities = {};
            state.quantity = 0;
            const sizeRows = document.querySelectorAll('.size-qty-value');
            sizeRows.forEach(el => { el.textContent = '0'; });
            const totalSpan = document.getElementById('totalQty');
            if (totalSpan) totalSpan.textContent = '0';
        }

        // Remove basket items (in reverse order to preserve indices)
        if (basketIndices.length > 0) {
            let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            basketIndices.sort((a, b) => b - a).forEach(idx => {
                if (idx >= 0 && idx < basket.length) basket.splice(idx, 1);
            });
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
            updateBasketCount();
        }

        // Hide delete bar
        const bar = document.getElementById('summaryDeleteBar');
        if (bar) bar.style.display = 'none';

        if (typeof showToast === 'function') showToast('Deleted ' + checked.length + ' item(s)');
        updatePricingSummary();
    }

    // === Add to Quote Button State ===
    function hasUploadedDesign() {
        // Check if there's any uploaded logo in sessionStorage or state
        const customizingPosition = sessionStorage.getItem('customizingPosition');
        if (customizingPosition) {
            // Check if there's an uploaded image for this position
            const uploadedKey = `uploaded_${customizingPosition}`;
            return sessionStorage.getItem(uploadedKey) !== null;
        }
        
        // Check if any position has a design uploaded
        const positions = ['left-chest', 'right-chest', 'front-center', 'back-large', 'left-sleeve', 'right-sleeve'];
        return positions.some(pos => {
            const uploadedKey = `uploaded_${pos}`;
            return sessionStorage.getItem(uploadedKey) !== null;
        });
    }

    function updateQuoteButtonState() {
        const quoteBtn = document.getElementById('designNowBtn');
        const addBtn = document.getElementById('addToBasketBtn');

        const hasSizes = state.quantity > 0;
        const hasDesign = hasUploadedDesign();
        
        if (quoteBtn) {
            if (hasSizes && hasDesign) {
                quoteBtn.classList.add('enabled');
            } else {
                quoteBtn.classList.remove('enabled');
            }
        }

        // Add to Basket: enable as soon as sizes are selected
        if (addBtn) {
            if (hasSizes) {
                addBtn.disabled = false;
                addBtn.style.opacity = '1';
            } else {
                addBtn.disabled = true;
                addBtn.style.opacity = '0.5';
            }
        }
    }

    // === Position Selection ===

    // === Delivery Date ===
    function updateDeliveryDate() {
        const deliveryDate = document.getElementById('deliveryDate');
        if (!deliveryDate) return;

        const today = new Date();
        const minDays = 5; // production + shipping min
        const maxDays = 8; // production + shipping max

        const minDate = new Date(today);
        minDate.setDate(today.getDate() + minDays);

        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + maxDays);

        const formatDate = (date) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}`;
        };

        deliveryDate.textContent = `${formatDate(minDate)} - ${formatDate(maxDate)}`;
    }

    // === Gallery ===
    function setupGallery() {
        // Gallery thumbnails are now dynamically rendered by renderColorThumbnails()
        // This function is kept for backward compatibility
        // Thumbnails will be rendered when colors are loaded via refreshProductDOM()
        debugLog('? Gallery setup complete (thumbnails rendered dynamically)');
    }

    // Keep in sync with mobile/css/rainbow-atc-bar.css (--fill-d + cart::after transition)
    const RAINBOW_ATC_TIMING = {
        fillDelayMs: 700,
        fillDurationMs: 1150,
        completeMs: 1950,
        resetMs: 2900,
        /** Pause after ATC checkmark before Logo Positions popup */
        logoFlowPauseAfterCompleteMs: 500
    };

    const POSITIONS_POPUP_ANIM_MS = 420;

    function getAddedToQuoteModalDelay() {
        const btn = document.getElementById('addToBasketBtn');
        if (btn && btn.classList.contains('rainbow-atc')) {
            return RAINBOW_ATC_TIMING.completeMs + RAINBOW_ATC_TIMING.logoFlowPauseAfterCompleteMs;
        }
        return 400;
    }

    function closePositionsPopup() {
        const overlay = document.getElementById('positionsPopupOverlay');
        if (!overlay || window.getComputedStyle(overlay).display === 'none') return;
        overlay.classList.remove('is-visible');
        window.setTimeout(function () {
            if (overlay.classList.contains('is-visible')) return;
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, POSITIONS_POPUP_ANIM_MS);
    }

    function revealPositionsPopup(overlay, animate) {
        if (!overlay) return;
        overlay.style.display = 'grid';
        document.body.style.overflow = 'hidden';
        overlay.classList.remove('is-visible');
        if (animate === false) {
            overlay.classList.add('is-visible');
            return;
        }
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                overlay.classList.add('is-visible');
            });
        });
    }

    let _atcAnimationTimers = [];

    function runNavBasketAddAnimation() {
        const link = document.getElementById('basketNavLink');
        if (!link) return;

        link.classList.remove('nav-basket-atc-complete');
        link.classList.add('nav-basket-atc-loading');

        _atcAnimationTimers.push(setTimeout(function () {
            link.classList.add('nav-basket-atc-complete');
        }, RAINBOW_ATC_TIMING.completeMs));

        _atcAnimationTimers.push(setTimeout(function () {
            link.classList.remove('nav-basket-atc-loading', 'nav-basket-atc-complete');
        }, RAINBOW_ATC_TIMING.resetMs));
    }

    function runRainbowAtcAnimation(btn) {
        if (!btn || btn.disabled || btn.classList.contains('loading')) return;

        _atcAnimationTimers.forEach(clearTimeout);
        _atcAnimationTimers = [];

        btn.classList.remove('complete');
        btn.classList.add('loading');
        runNavBasketAddAnimation();

        _atcAnimationTimers.push(setTimeout(() => btn.classList.add('complete'), RAINBOW_ATC_TIMING.completeMs));
        _atcAnimationTimers.push(setTimeout(() => {
            btn.classList.remove('loading', 'complete');
        }, RAINBOW_ATC_TIMING.resetMs));
    }

    // === Modals ===
    function setupModals() {
        // Size Guide Modal
        elements.sizeGuideBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(elements.sizeGuideModal);
        });

        elements.closeSizeGuide?.addEventListener('click', () => {
            closeModal(elements.sizeGuideModal);
        });

        // Design Editor Modal (legacy designNowBtn)
        elements.designNowBtn?.addEventListener('click', () => {
            openModal(elements.designEditorModal);
            updateZoneVisibility();
            setupZoneDeleteButtons();
        });

        // Add to Basket button
        const addToBasketBtn = document.getElementById('addToBasketBtn');
        if (addToBasketBtn) {
            addToBasketBtn.addEventListener('click', () => {
                debugLog('🔘 Add to basket button clicked! state.quantity:', state.quantity);
                if (state.quantity === 0 && !isBasketSingleItemEdit()) {
                    showToast('Please add at least one item', true);
                    return;
                }
                if (needsLogoStepBeforeBasket()) {
                    runRainbowAtcAnimation(addToBasketBtn);
                    addToQuote();
                    return;
                }
                runRainbowAtcAnimation(addToBasketBtn);
                addToQuote();
            });
        }

        elements.closeEditor?.addEventListener('click', () => {
            closeModal(elements.designEditorModal);
        });

        elements.doneDesign?.addEventListener('click', () => {
            addToQuote();
        });

        // Close on backdrop click
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });
    }

    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // === Design Editor ===
    function setupDesignEditor() {
        // Browse link and upload dropzone
        const browseLink = document.getElementById('browseLink');
        const uploadDropzone = document.getElementById('uploadDropzone');
        
        browseLink?.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.logoUpload?.click();
        });
        
        uploadDropzone?.addEventListener('click', () => {
            elements.logoUpload?.click();
        });

        elements.logoUpload?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });

        // Color circles for text
        const colorCircles = document.querySelectorAll('.color-circle:not(.none-circle)');
        colorCircles.forEach(circle => {
            circle.addEventListener('click', () => {
                colorCircles.forEach(c => c.classList.remove('active'));
                circle.classList.add('active');
            });
        });

        // Stroke color circles
        const strokeCircles = document.querySelectorAll('.stroke-circle');
        strokeCircles.forEach(circle => {
            circle.addEventListener('click', () => {
                strokeCircles.forEach(c => c.classList.remove('active'));
                circle.classList.add('active');
            });
        });

        // Clipart tabs
        const clipartTabs = document.querySelectorAll('.clipart-tab');
        clipartTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                clipartTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });



        // Text panel
        const addTextBtn = document.getElementById('addTextBtn');
        const designText = document.getElementById('designText');
        
        addTextBtn?.addEventListener('click', () => {
            const text = designText?.value.trim();
            if (text) {
                showToast(`Text "${text}" added to design`);
                designText.value = '';
            }
        });

        // Text colors
        document.querySelectorAll('.text-color').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.text-color').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Font size control
        const fontSizeValue = document.getElementById('fontSizeValue');
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                let size = parseInt(fontSizeValue?.textContent) || 24;
                if (btn.dataset.action === 'increase') {
                    size = Math.min(72, size + 2);
                } else {
                    size = Math.max(8, size - 2);
                }
                if (fontSizeValue) fontSizeValue.textContent = size;
            });
        });

        // Clipart categories
        document.querySelectorAll('.clipart-cat').forEach(cat => {
            cat.addEventListener('click', () => {
                document.querySelectorAll('.clipart-cat').forEach(c => c.classList.remove('active'));
                cat.classList.add('active');
            });
        });

        // Clipart items
        document.querySelectorAll('.clipart-item').forEach(item => {
            item.addEventListener('click', () => {
                showToast('Clipart added to design');
            });
        });
    }

    function handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const logoSrc = e.target.result;
            
            // Update panel preview
            if (elements.previewImage) {
                elements.previewImage.src = logoSrc;
            }
            if (elements.uploadDropzone) {
                elements.uploadDropzone.style.display = 'none';
            }
            if (elements.uploadPreview) {
                elements.uploadPreview.style.display = 'block';
            }
            
            // Show logo in active design zone(s)
            state.positions.forEach(posId => {
                const zone = document.querySelector(`.design-zone[data-zone="${posId}"]`);
                if (zone) {
                    const zoneLogo = zone.querySelector('.zone-logo');
                    if (zoneLogo) {
                        zoneLogo.src = logoSrc;
                        zoneLogo.style.display = 'block';
                        zone.classList.add('has-logo');
                    }
                }
            });
            
            // Save uploaded logo to sessionStorage
            const customizingPosition = sessionStorage.getItem('customizingPosition');
            if (customizingPosition) {
                const uploadedKey = `uploaded_${customizingPosition}`;
                sessionStorage.setItem(uploadedKey, logoSrc);
            }
            
            showToast('Logo uploaded successfully!');
            
            // Update quote button state
            updateQuoteButtonState();
        };
        reader.readAsDataURL(file);

        // Setup replace/remove buttons
        const replaceBtn = elements.uploadPreview?.querySelector('.replace');
        const removeBtn = elements.uploadPreview?.querySelector('.remove');

        replaceBtn?.addEventListener('click', () => {
            elements.logoUpload?.click();
        });

        removeBtn?.addEventListener('click', () => {
            if (elements.uploadDropzone) {
                elements.uploadDropzone.style.display = 'flex';
            }
            if (elements.uploadPreview) {
                elements.uploadPreview.style.display = 'none';
            }
            if (elements.previewImage) {
                elements.previewImage.src = '';
            }
            // Also remove from all zones
            clearAllZoneLogos();
            
            // Remove from sessionStorage
            const customizingPosition = sessionStorage.getItem('customizingPosition');
            if (customizingPosition) {
                const uploadedKey = `uploaded_${customizingPosition}`;
                sessionStorage.removeItem(uploadedKey);
            }
            
            // Update quote button state
            updateQuoteButtonState();
        });
    }
    
    // === Zone Logo Management ===
    function clearAllZoneLogos() {
        document.querySelectorAll('.design-zone').forEach(zone => {
            const zoneLogo = zone.querySelector('.zone-logo');
            if (zoneLogo) {
                zoneLogo.src = '';
                zoneLogo.style.display = 'none';
            }
            zone.classList.remove('has-logo');
        });
    }
    
    function clearZoneLogo(zone) {
        const zoneLogo = zone.querySelector('.zone-logo');
        if (zoneLogo) {
            zoneLogo.src = '';
            zoneLogo.style.display = 'none';
        }
        zone.classList.remove('has-logo');
    }
    
    function setupZoneDeleteButtons() {
        document.querySelectorAll('.zone-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const zone = btn.closest('.design-zone');
                if (zone) {
                    clearZoneLogo(zone);
                    showToast('Logo removed from ' + zone.querySelector('.zone-label')?.textContent);
                }
            });
        });
    }
    
    function updateZoneVisibility() {
        // Hide all zones first
        document.querySelectorAll('.design-zone').forEach(zone => {
            zone.style.display = 'none';
        });
        
        // Show only selected position zones
        state.positions.forEach(posId => {
            const zone = document.querySelector(`.design-zone[data-zone="${posId}"]`);
            if (zone) {
                zone.style.display = 'flex';
            }
        });
    }

    // === Toast Notification ===
    function showToast(message, isError, anchorEl) {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        // Create toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        if (anchorEl) {
            // Position near the anchor element
            const rect = anchorEl.getBoundingClientRect();
            toast.style.cssText = `
                position: fixed;
                top: ${rect.top - 48}px;
                left: 0;
                right: 0;
                width: fit-content;
                margin: 0 auto;
                padding: 10px 22px;
                background: ${isError ? '#ffffff' : 'rgba(31, 41, 55, 0.95)'};
                color: ${isError ? '#222' : 'white'};
                font-size: 13px;
                font-weight: 600;
                border-radius: 8px;
                z-index: 1000;
                animation: slideUp 0.3s ease;
                white-space: nowrap;
                box-shadow: ${isError ? '0 2px 12px rgba(0,0,0,0.15)' : 'none'};
            `;
        } else {
            toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 0;
                right: 0;
                width: fit-content;
                margin: 0 auto;
                padding: 12px 24px;
                background: ${isError ? '#ffffff' : 'rgba(31, 41, 55, 0.95)'};
                color: ${isError ? '#222' : 'white'};
                font-size: 14px;
                font-weight: 500;
                border-radius: 8px;
                z-index: 1000;
                animation: slideUp 0.3s ease;
                box-shadow: ${isError ? '0 2px 12px rgba(0,0,0,0.15)' : 'none'};
            `;
        }

        document.body.appendChild(toast);

        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // === Auto-Save Timer (3 seconds of inactivity) ===
    let _autoSaveTimer = null;
    let _autoSavedItemId = null; // Track the ID of the auto-saved item so we can update it
    // Track item IDs saved in THIS customize session (to prevent qty doubling)
    const _sessionSavedIds = new Set();
    /** True only after user uploads/applies a logo on the current item (stable logo-step gate). */
    let _logoConfiguredForCurrentItem = false;

    /**
     * Reset the 3-second auto-save timer. Called whenever state changes
     * (qty change, color change, logo change, position change).
     * Disabled: no more auto-save. Save only on explicit user action (Done / Add to basket).
     */
    function resetAutoSaveTimer() {
        // No-op: auto-save disabled
    }

    // Expose force-save so parent (basket iframe popup) can trigger immediate save
    window._forceAutoSave = function() {
        if (_autoSaveTimer) { clearTimeout(_autoSaveTimer); _autoSaveTimer = null; }
        if (isActiveBasketItemEdit()) {
            persistEditedBasketItemLogos();
            return;
        }
        autoSaveToBasket();
    };

    /**
     * Save logo edits back to quoteBasket when editing from basket (Edit logo / positionsOnly popup).
     * Does not depend on qty state or the removed customization-pill auto-save path.
     */
    function persistEditedBasketItemLogos() {
        if (!isActiveBasketItemEdit()) return false;

        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        const basePositionDesigns = getPositionDesignsForBasket();
        const positions = mergePositionsWithDesigns(
            buildPositionsFromDOM(),
            basePositionDesigns,
            state.positionMethods
        );

        let existing = null;
        let existingIdx = -1;

        if (_autoSavedItemId) {
            existingIdx = basket.findIndex(i => i.id === _autoSavedItemId);
            if (existingIdx !== -1) existing = basket[existingIdx];
        }
        if (!existing) {
            const basketIdx = parseInt(sessionStorage.getItem('customizingBasketIndex'), 10);
            if (!isNaN(basketIdx) && basketIdx >= 0 && basketIdx < basket.length) {
                existing = basket[basketIdx];
                existingIdx = basketIdx;
            }
        }
        if (!existing) {
            debugWarn('persistEditedBasketItemLogos: basket row not found');
            return false;
        }

        existing.positions = positions;
        existing.positionDesigns = JSON.parse(JSON.stringify(state.positionDesigns || {}));
        if (state.selectedColorName) existing.color = state.selectedColorName;
        if (state.selectedColor) existing.colorId = state.selectedColor;
        if (state.selectedColorImage) existing.colorImage = state.selectedColorImage;
        const saveHex = getCurrentGarmentColorHex();
        if (saveHex) existing.colorHex = saveHex;
        syncBasketItemLogos(existing);

        const key = (existing.productCode || existing.code || '') + '|' + (existing.color || '');
        basket.forEach((item, i) => {
            if (i === existingIdx) return;
            const itemKey = (item.productCode || item.code || '') + '|' + (item.color || '');
            if (itemKey === key) {
                item.positions = JSON.parse(JSON.stringify(positions));
                item.positionDesigns = JSON.parse(JSON.stringify(state.positionDesigns || {}));
                syncBasketItemLogos(item);
            }
        });

        try {
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
            _logoConfiguredForCurrentItem = true;
            debugLog('💾 persistEditedBasketItemLogos: saved', existing.productName || existing.name, existing.color);
            return true;
        } catch (e) {
            console.error('persistEditedBasketItemLogos failed:', e);
            return false;
        }
    }

    /** Build positions[] from checked cards + positionDesigns (logo always included) */
    function buildPositionsFromDOM() {
        const positions = [];
        const checkedCards = document.querySelectorAll('.position-card input[type="checkbox"]:checked');
        checkedCards.forEach(checkbox => {
            const card = checkbox.closest('.position-card');
            const position = checkbox.value;
            const positionName = getPositionLabelFromCard(position);
            const method = state.positionMethods && state.positionMethods[position];
            if (method) {
                const activeBadge = card.querySelector(`.price-badge.price-${method === 'embroidery' ? 'emb' : 'print'}.active`);
                let unitPrice = method === 'embroidery' ? 5.00 : 3.50;
                if (activeBadge) {
                    const priceText = activeBadge.querySelector('.price-value')?.textContent || '';
                    const priceMatch = priceText.match(/[\d.]+/);
                    if (priceMatch) unitPrice = parseFloat(priceMatch[0]);
                }
                const designData = state.positionDesigns?.[position];
                const logoSrc = designData?.logo || null;
                positions.push({ position, name: positionName, method, unitPrice, logo: logoSrc });
            }
        });
        return positions;
    }

    function mergePositionsWithDesigns(domPositions, positionDesigns, positionMethods) {
        const byPos = new Map();
        (domPositions || []).forEach(p => {
            if (p && p.position) byPos.set(p.position, { ...p });
        });
        Object.entries(positionDesigns || {}).forEach(([posKey, d]) => {
            if (!d || !d.logo) return;
            const method = (positionMethods && positionMethods[posKey]) || d.method || 'embroidery';
            const unitPrice = byPos.has(posKey) && byPos.get(posKey).unitPrice != null
                ? byPos.get(posKey).unitPrice
                : (method === 'print' ? 3.50 : 5.00);
            if (byPos.has(posKey)) {
                const ex = byPos.get(posKey);
                ex.logo = d.logo;
                if (!ex.method) ex.method = method;
            } else {
                byPos.set(posKey, {
                    position: posKey,
                    name: getPositionLabelFromCard(posKey),
                    method,
                    unitPrice,
                    logo: d.logo
                });
            }
        });
        return Array.from(byPos.values());
    }

    /** Sync logos[] on basket row (mobile: BrandedBasketLogos) */
    function syncBasketItemLogos(item) {
        if (!item) return;
        if (window.BrandedBasketLogos) {
            BrandedBasketLogos.syncItemLogos(item, {
                labelFn: function (pos, entry) {
                    return entry.positionLabel || entry.name || getPositionLabelFromCard(pos);
                }
            });
            return;
        }
    }

    function getPositionDesignsForBasket() {
        const raw = state.positionDesigns ? JSON.parse(JSON.stringify(state.positionDesigns)) : {};
        if (window.BrandedBasketLogos) {
            return BrandedBasketLogos.enrichPositionDesigns(raw, state.positionMethods);
        }
        Object.keys(raw).forEach(function (pos) {
            const m = state.positionMethods && state.positionMethods[pos];
            if (m && raw[pos]) raw[pos].method = String(m).toLowerCase();
        });
        return raw;
    }

    function syncAllBasketLogos(basket) {
        if (!Array.isArray(basket)) return;
        basket.forEach(syncBasketItemLogos);
    }

    /**
     * Silently save/update the current item in localStorage basket.
     * Uses REPLACE logic (not merge) so repeated saves don't duplicate quantities.
     */
    function autoSaveToBasket() {
        const isFromBasket = sessionStorage.getItem('returnAfterCustomize') === 'basket' && isActiveBasketItemEdit();
        if (isFromBasket) {
            persistEditedBasketItemLogos();
            return;
        }
        if (!state.quantity || state.quantity === 0) return;

        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');

        const basePositionDesigns = getPositionDesignsForBasket();
        const positions = mergePositionsWithDesigns(buildPositionsFromDOM(), basePositionDesigns, state.positionMethods);

        // If coming from basket "Add Logo", UPDATE the existing item in-place
        if (isFromBasket && _autoSavedItemId) {
            const existingIdx = basket.findIndex(i => i.id === _autoSavedItemId);
            if (existingIdx !== -1) {
                const existing = basket[existingIdx];
                existing.positions = positions;
                existing.positionDesigns = state.positionDesigns ? JSON.parse(JSON.stringify(state.positionDesigns)) : {};
                if (!existing.productType) {
                    existing.productType = state.product?.rawData?.productType || state.product?.rawData?.category || state.product?.rawData?.type || '';
                }
                existing.customizations = getActiveCustomizations().map(c => ({
                    ...c,
                    qty: existing.totalQty,
                    total: (c.unitPrice || 0) * existing.totalQty
                }));
                syncBasketItemLogos(existing);
                try {
                    localStorage.setItem('quoteBasket', JSON.stringify(basket));
                } catch (e) {
                    console.error('Auto-save failed:', e);
                    return;
                }
                updateCartBadge();
                showAutoSaveIndicator();
                debugLog('💾 Auto-saved logo to basket item:', existing.productName, existing.color);
                return;
            }
        }

        // Normal flow: create one item PER SIZE
        const currentUnitPrice = getCurrentUnitPrice();
        const priceMode = localStorage.getItem('brandeduk-vat-mode') === 'on' ? 'inc' : 'ex';
        const baseProductCode = state.product?.code || '';
        const baseProductName = state.product?.name || 'Product';
        const baseColor = state.selectedColorName || state.selectedColor;
        const baseColorId = state.selectedColor;
        const baseColorImage = state.selectedColorImage;
        const baseNote = state.itemNote || '';
        const now = new Date().toISOString();

        const sizesToAdd = Object.entries(state.sizeQuantities).filter(([, qty]) => qty > 0);

        // Remove any previously auto-saved items from this session
        if (_autoSavedItemId) {
            const oldIdx = basket.findIndex(i => i.id === _autoSavedItemId);
            if (oldIdx !== -1) basket.splice(oldIdx, 1);
        }
        _sessionSavedIds.forEach(sid => {
            const oldIdx = basket.findIndex(i => i.id === sid);
            if (oldIdx !== -1) basket.splice(oldIdx, 1);
        });
        _sessionSavedIds.clear();
        _autoSavedItemId = null;

        let lastAutoItem = null;
        sizesToAdd.forEach(([size, qty]) => {
            const sizePositions = positions.map(p => ({ ...p }));
            const sizeCustomizations = getActiveCustomizations().map(c => ({
                ...c,
                qty: qty,
                total: (c.unitPrice || 0) * qty
            }));

            const itemId = Date.now().toString() + '-auto-' + size;
            const autoColorHex = getCurrentGarmentColorHex();
            lastAutoItem = {
                id: itemId,
                productCode: baseProductCode,
                productName: baseProductName,
                productType: state.product?.rawData?.productType || state.product?.rawData?.category || state.product?.rawData?.type || '',
                color: baseColor,
                colorId: baseColorId,
                colorHex: autoColorHex || '',
                colorImage: baseColorImage,
                quantities: { [size]: qty },
                totalQty: qty,
                unitPrice: currentUnitPrice,
                priceMode: priceMode,
                positions: sizePositions,
                positionDesigns: JSON.parse(JSON.stringify(basePositionDesigns)),
                customizations: sizeCustomizations,
                note: baseNote,
                addedAt: now,
                _autoSaved: true
            };

            syncBasketItemLogos(lastAutoItem);
            _sessionSavedIds.add(itemId);
            basket.push(lastAutoItem);
        });

        if (sizesToAdd.length > 0) {
            _autoSavedItemId = [..._sessionSavedIds][_sessionSavedIds.size - 1];
        }

        try {
            syncAllBasketLogos(basket);
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
        } catch (e) {
            console.error('Auto-save failed:', e);
            return;
        }

        // Update cart badge
        updateCartBadge();

        // Show subtle feedback
        showAutoSaveIndicator();

        debugLog('💾 Auto-saved to basket:', lastAutoItem?.productName, lastAutoItem?.color, 'qty:', lastAutoItem?.totalQty);
    }

    /**
     * Show a brief "Saved ✓" indicator on the action bar button
     */
    function showAutoSaveIndicator() {
        const btn = document.getElementById('addToBasketBtn') || document.getElementById('designNowBtn');
        if (!btn) return;

        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>✓ Saved to Basket</span>';
        btn.style.background = '#10b981';
        btn.style.transition = 'background 0.3s';

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
        }, 1500);
    }

    // === Add to Quote ===
    /**
     * Recalculate unit prices for ALL basket items with the given productCode.
     * Uses the combined total quantity across all colours/sizes to determine the tier.
     */
    function _recalcPricesForProduct(basket, productCode) {
        const rule = PRICING_RULES[productCode];
        if (!rule || !rule.tiers || rule.tiers.length === 0) return;

        // Sum total qty for this product code across all colours
        let totalQty = 0;
        basket.forEach(item => {
            if ((item.productCode || item.code) === productCode) {
                totalQty += parseInt(item.totalQty) || 0;
            }
        });

        // Find the correct tier price
        let tierPrice = rule.basePrice;
        for (const tier of rule.tiers) {
            if (totalQty >= tier.min) {
                tierPrice = tier.price;
                break;
            }
        }

        // Apply to every item with this product code
        basket.forEach(item => {
            if ((item.productCode || item.code) === productCode) {
                if (item.unitPrice !== tierPrice) {
                    debugLog('💰 Price updated:', item.color, item.unitPrice, '→', tierPrice, '(total qty:', totalQty, ')');
                    item.unitPrice = tierPrice;
                }
            }
        });
    }

    function isUsableColorHex(hex) {
        if (window.BrandedColorHex && typeof BrandedColorHex.isUsableHex === 'function') {
            return BrandedColorHex.isUsableHex(hex);
        }
        if (!hex) return false;
        const h = String(hex).trim().toLowerCase();
        return h !== '#cccccc' && h !== '#ccc' && h !== '#d1d5db';
    }

    function isBasketSingleItemEdit() {
        return sessionStorage.getItem('returnAfterCustomize') === 'basket' &&
            sessionStorage.getItem('basketEditSingleItem') === '1';
    }

    function isActiveBasketItemEdit() {
        const idx = sessionStorage.getItem('customizingBasketIndex');
        if (idx === null || idx === '') return false;
        return sessionStorage.getItem('returnAfterCustomize') === 'basket' ||
            sessionStorage.getItem('basketEditSingleItem') === '1' ||
            new URLSearchParams(window.location.search).get('positionsOnly') === '1';
    }

    /** Clear basket-edit session keys when starting a fresh product (not editing one line from basket). */
    function clearStaleBasketEditSessionUnlessEditing() {
        // A brand-new product opened from the shop must NEVER inherit a lingering
        // basket-edit context (e.g. left over from a previous item's "Add logo" flow),
        // otherwise it skips the "Add logo / Continue" popup and jumps to the basket.
        var isFreshFromShop = sessionStorage.getItem(CUSTOMIZE_FRESH_KEY) === '1';
        if (!isFreshFromShop && isActiveBasketItemEdit()) return;
        sessionStorage.removeItem('customizingBasketIndex');
        sessionStorage.removeItem('returnAfterCustomize');
        sessionStorage.removeItem('basketEditSingleItem');
        sessionStorage.removeItem('basketEditItemId');
        sessionStorage.removeItem('basketEditNewColor');
        sessionStorage.removeItem('pendingLogoPromptId');
        sessionStorage.removeItem('editingPosition');
        sessionStorage.removeItem('editingLogoIndex');
        _autoSavedItemId = null;
        _sessionSavedIds.clear();
    }

    function persistCleanCustomizeSession(productCode) {
        try {
            sessionStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({
                productCode: productCode || '',
                positionMethods: {},
                positionCustomizations: {},
                positionDesigns: {},
                positions: [],
                sizeQuantities: {},
                quantity: 0,
                technique: state.technique || 'embroidery'
            }));
        } catch (e) { /* ignore */ }
    }

    /** On new product from shop (or after continue shopping) — never inherit previous logos. */
    function applyFreshItemSessionIfNeeded() {
        const fresh = sessionStorage.getItem(CUSTOMIZE_FRESH_KEY) === '1';
        const currentCode = (state.product && state.product.code) || sessionStorage.getItem('selectedProduct') || '';
        const lastCode = sessionStorage.getItem(CUSTOMIZE_LAST_PRODUCT_KEY) || '';
        const productChanged = !!(currentCode && lastCode && currentCode !== lastCode);

        if (fresh || productChanged) {
            _logoConfiguredForCurrentItem = false;
            clearPositionState();
            state.sizeQuantities = {};
            state.quantity = 0;
            persistCleanCustomizeSession(currentCode);
            debugLog('🆕 Fresh customize item:', currentCode, fresh ? '(from shop)' : '(product changed)');
        }

        if (fresh) sessionStorage.removeItem(CUSTOMIZE_FRESH_KEY);
        if (currentCode) sessionStorage.setItem(CUSTOMIZE_LAST_PRODUCT_KEY, currentCode);
    }

    function updateLogoConfiguredFlagFromState() {
        _logoConfiguredForCurrentItem = selectionHasLogoOnCheckedPositions();
    }

    function needsLogoStepBeforeBasket() {
        if (isBasketSingleItemEdit()) return false;
        if (isActiveBasketItemEdit()) {
            try {
                const idx = parseInt(sessionStorage.getItem('customizingBasketIndex'), 10);
                const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                const item = basket[idx];
                if (item && basketItemHasLogo(item)) return false;
            } catch (e) { /* ignore */ }
        }
        return !_logoConfiguredForCurrentItem;
    }

    /** After add-to-basket / continue shopping — next product must not inherit logos or overwrite prior lines. */
    function beginNextItemSession() {
        clearStaleBasketEditSessionUnlessEditing();
        _autoSavedItemId = null;
        _sessionSavedIds.clear();
        _logoConfiguredForCurrentItem = false;
        state.selectionSaved = true;
        clearPositionState();
        state.sizeQuantities = {};
        state.quantity = 0;
        persistCleanCustomizeSession(state.product?.code || sessionStorage.getItem('selectedProduct') || '');
    }

    function selectionHasLogoOnCheckedPositions() {
        const positions = mergePositionsWithDesigns(
            buildPositionsFromDOM(),
            state.positionDesigns || {},
            state.positionMethods
        );
        return positions.some(function (p) { return p && p.logo; });
    }

    function resetAllPositionCardsUI() {
        document.querySelectorAll('.position-card').forEach(function (card) {
            const checkbox = card.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = false;
            card.classList.remove('selected', 'has-logo', 'has-design');

            const embBadge = card.querySelector('.price-emb');
            const printBadge = card.querySelector('.price-print');
            resetPriceBadge(embBadge);
            resetPriceBadge(printBadge);

            const logoOverlayBox = card.querySelector('.logo-overlay-box');
            const logoOverlayImg = card.querySelector('.logo-overlay-img');
            if (logoOverlayBox) logoOverlayBox.hidden = true;
            if (logoOverlayImg) logoOverlayImg.src = '';

            const previewContent = card.querySelector('.position-preview-content');
            const placeholder = card.querySelector('.position-placeholder');
            const pill = card.querySelector('.customization-pill');
            const previewImage = card.querySelector('.preview-image');
            const previewText = card.querySelector('.preview-text');
            if (previewContent) previewContent.hidden = true;
            if (placeholder) placeholder.hidden = false;
            if (pill) pill.hidden = true;
            if (previewImage) {
                previewImage.src = '';
                previewImage.hidden = true;
            }
            if (previewText) {
                previewText.textContent = '';
                previewText.hidden = true;
            }

            const uploadedLogoPreview = card.querySelector('.uploaded-logo-preview');
            if (uploadedLogoPreview) {
                uploadedLogoPreview.src = '';
                uploadedLogoPreview.hidden = true;
            }
            const uploadedLogoContainer = card.querySelector('.uploaded-logo-container');
            if (uploadedLogoContainer) uploadedLogoContainer.hidden = true;
        });
    }

    function clearPositionState(clearUI) {
        state.positionMethods = {};
        state.positionCustomizations = {};
        state.positionDesigns = {};
        state.positions = [];
        if (clearUI !== false) {
            resetAllPositionCardsUI();
        }
    }

    /** After Add to basket: open clean position picker (no success modal). */
    function beginLogoFlowForNewBasketItem(item) {
        if (!item || !item.id) {
            setTimeout(function () { showAddedToQuoteModal(item); }, getAddedToQuoteModalDelay());
            return;
        }
        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            const idx = basket.findIndex(function (i) { return i.id === item.id; });
            if (idx !== -1) {
                sessionStorage.setItem('customizingBasketIndex', String(idx));
                _autoSavedItemId = item.id;
            }
        } catch (e) {
            debugWarn('beginLogoFlowForNewBasketItem:', e);
        }
        clearPositionState(true);
        saveCustomizationState();
        setTimeout(function () { showAddedToQuoteModal(item); }, getAddedToQuoteModalDelay());
    }

    function basketItemHasLogo(item) {
        if (!item) return false;
        if (item.logos && item.logos.length > 0) return true;
        if (Array.isArray(item.positions) && item.positions.some(function (p) { return p && p.logo; })) return true;
        if (item.positionDesigns && typeof item.positionDesigns === 'object') {
            return Object.values(item.positionDesigns).some(function (d) { return d && d.logo; });
        }
        return false;
    }

    function stripLogosFromBasketItem(item) {
        if (!item) return;
        item.logos = [];
        item.positions = [];
        item.positionDesigns = {};
        delete item.customizations;
    }

    function clearBasketLogoPromptIfHasLogo(item) {
        if (item && basketItemHasLogo(item)) delete item.pendingLogoPrompt;
    }

    /** Tag new basket line for logo step later — does NOT leave customize page */
    function markItemForLogoPrompt(lastNewItem) {
        if (!lastNewItem || !lastNewItem.id) return;
        if (basketItemHasLogo(lastNewItem)) return;
        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            const idx = basket.findIndex(function (i) { return i.id === lastNewItem.id; });
            if (idx === -1) return;
            basket[idx].pendingLogoPrompt = true;
            stripLogosFromBasketItem(basket[idx]);
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
        } catch (e) {
            debugWarn('markItemForLogoPrompt failed:', e);
        }
    }

    function makeBasketRowId(code, color, size) {
        const slug = String(color || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return (code || 'ITEM') + '-' + slug + '-' + (size || 'OS');
    }

    function hydrateProductColorHexFromSwatches() {
        if (!window.BrandedColorHex || !Array.isArray(PRODUCT_COLORS) || PRODUCT_COLORS.length === 0) return;
        const code = state.product && state.product.code ? state.product.code : '';
        PRODUCT_COLORS.forEach(function (color) {
            if (!color || isUsableColorHex(color.hex)) return;
            if (typeof BrandedColorHex.resolveForName === 'function') {
                const resolved = BrandedColorHex.resolveForName(
                    color.name,
                    code,
                    color.thumb || color.image || '',
                    color.hex || ''
                );
                if (isUsableColorHex(resolved)) {
                    color.hex = resolved;
                    BrandedColorHex.register(color.name, resolved, code);
                    if (color.id === state.selectedColor || color.name === state.selectedColorName) {
                        applyGarmentColorToLogoPreview();
                        applyGarmentColorToPositionPreviews();
                    }
                    return;
                }
            }
            const swatchUrl = color.thumb || color.image;
            if (!swatchUrl) return;
            BrandedColorHex.sampleFromImage(swatchUrl).then(function (hex) {
                if (!isUsableColorHex(hex)) return;
                color.hex = hex;
                BrandedColorHex.register(color.name, hex, code);
                if (color.id === state.selectedColor || color.name === state.selectedColorName) {
                    applyGarmentColorToLogoPreview();
                    applyGarmentColorToPositionPreviews();
                }
            });
        });
    }

    function getSelectedColorHex() {
        const id = state.selectedColor;
        const name = String(state.selectedColorName || state.selectedColor || '').trim();
        const code = state.product && state.product.code ? state.product.code : '';
        const imageUrl = state.selectedColorImage || '';

        if (Array.isArray(PRODUCT_COLORS) && PRODUCT_COLORS.length > 0) {
            if (id) {
                const byId = PRODUCT_COLORS.find(c => c.id === id);
                if (byId && isUsableColorHex(byId.hex)) return byId.hex;
            }
            if (name) {
                const lower = name.toLowerCase();
                const byName = PRODUCT_COLORS.find(c => String(c.name || '').toLowerCase() === lower);
                if (byName && isUsableColorHex(byName.hex)) return byName.hex;
            }
        }

        if (window.BrandedColorHex && name) {
            const found = BrandedColorHex.lookup(name, code, imageUrl, id);
            if (BrandedColorHex.isUsableHex(found)) {
                BrandedColorHex.register(name, found, code);
                return found;
            }
        }
        return '';
    }

    function getGarmentThumbUrlForSampling() {
        const id = state.selectedColor;
        if (Array.isArray(PRODUCT_COLORS) && id) {
            const match = PRODUCT_COLORS.find(function (c) { return c.id === id; });
            if (match) return match.thumb || match.image || '';
        }
        return state.selectedColorImage || '';
    }

    /** Campiona colore dalla foto prodotto nascosta; non tocca il PNG front nelle card posizione. */
    function refreshGarmentLogoBackgroundBehindScenes(root) {
        const G = window.GarmentColorBehindScenes;
        if (!G) return Promise.resolve('');
        const thumbUrl = getGarmentThumbUrlForSampling();
        if (!thumbUrl) return Promise.resolve('');

        const selectedHex = getSelectedColorHex();
        return G.resolveGarmentLogoBackgroundHex({
            colorImageUrl: thumbUrl,
            apiHex: isUsableColorHex(selectedHex) ? selectedHex : ''
        }).then(function (result) {
            if (!result || !result.hex) return '';
            const name = state.selectedColorName || '';
            const code = state.product && state.product.code ? state.product.code : '';
            if (window.BrandedColorHex) {
                BrandedColorHex.register(name, result.hex, code);
            }
            if (Array.isArray(PRODUCT_COLORS) && state.selectedColor) {
                const colorRow = PRODUCT_COLORS.find(function (c) { return c.id === state.selectedColor; });
                if (colorRow) colorRow.hex = result.hex;
            }
            G.applyLogoBoxGarmentBackground(root || document, result.hex);
            return result.hex;
        });
    }

    function getCurrentGarmentColorHex() {
        let hex = getSelectedColorHex();
        if (!hex && state.product && state.product.rawData && window.BrandedColorHex) {
            const fromRaw = BrandedColorHex.parseHex(state.product.rawData.colorHex);
            if (BrandedColorHex.isUsableHex(fromRaw)) hex = fromRaw;
        }
        if (!hex && window.BrandedColorHex) {
            const code = state.product && state.product.code ? state.product.code : '';
            hex = BrandedColorHex.lookup(
                state.selectedColorName || state.selectedColor || '',
                code,
                state.selectedColorImage,
                state.selectedColor
            ) || '';
        }
        return hex || '';
    }

    function resolveGarmentPreviewHex() {
        const code = state.product && state.product.code ? state.product.code : '';
        const colourName = state.selectedColorName || state.selectedColor || '';
        const imageUrl = state.selectedColorImage || '';
        let hex = getCurrentGarmentColorHex();
        const raw = state.product && state.product.rawData;
        if (raw && raw.colorHex && window.BrandedColorHex) {
            const fromBasket = BrandedColorHex.parseHex(raw.colorHex);
            if (BrandedColorHex.isUsableHex(fromBasket)) hex = fromBasket;
        }
        if (window.BrandedColorHex) {
            const cached = typeof BrandedColorHex.getImageHexSync === 'function'
                ? BrandedColorHex.getImageHexSync(imageUrl)
                : '';
            if (BrandedColorHex.isUsableHex(cached)) return cached;
            if (typeof BrandedColorHex.resolveGarmentTint === 'function') {
                const tinted = BrandedColorHex.resolveGarmentTint(hex, colourName, code, imageUrl);
                if (BrandedColorHex.isUsableHex(tinted) && tinted !== '#ffffff') return tinted;
            }
            const parsed = BrandedColorHex.parseHex(hex);
            if (BrandedColorHex.isUsableHex(parsed)) return parsed;
        }
        return '';
    }

    function applyGarmentColorToPositionPreviews(root) {
        const scope = root && root.querySelectorAll ? root : document;
        const hex = resolveGarmentPreviewHex();

        function applyGarmentTintStacks(scopeRoot, tintHex, enforceWhiteCardBg) {
            const normalizedTint = String(tintHex || '').replace('#', '').toLowerCase();
            const isNearWhite = normalizedTint === 'fff' || normalizedTint === 'ffffff' || normalizedTint === 'faf9f6';
            const useMaskTint = tintHex && !isNearWhite;

            scopeRoot.querySelectorAll('.garment-tint-stack').forEach(function (stack) {
                const tintMask = stack.querySelector('.garment-tint-mask');
                const tintLayer = stack.querySelector('.garment-tint-layer');
                const tintTarget = tintMask || tintLayer;
                const baseImg = stack.querySelector('.garment-tint-base');
                if (tintTarget) {
                    if (useMaskTint) {
                        tintTarget.style.setProperty('--garment-tint', tintHex);
                        tintTarget.style.backgroundColor = tintHex;
                        tintTarget.classList.add('is-active');
                    } else {
                        tintTarget.classList.remove('is-active');
                        tintTarget.style.removeProperty('--garment-tint');
                        tintTarget.style.backgroundColor = '';
                    }
                }
                if (baseImg) {
                    if (useMaskTint) {
                        baseImg.classList.add('garment-tint-base--hidden');
                    } else {
                        baseImg.classList.remove('garment-tint-base--hidden');
                    }
                }
                stack.style.backgroundColor = '#ffffff';
                stack.style.removeProperty('--garment-bg');
            });

            if (enforceWhiteCardBg) {
                enforceGarmentCardWhiteBackground(scopeRoot);
            }

            /* Logo preview boxes keep garment hex — only garment photo / tint stack stay white */
            const logoBoxBg = tintHex || '#f3f4f6';
            scopeRoot.querySelectorAll('.position-preview-content, .uploaded-logo-box').forEach(function (el) {
                if (tintHex) el.style.setProperty('--garment-bg', tintHex);
                else el.style.removeProperty('--garment-bg');
                el.style.backgroundColor = logoBoxBg;
            });
        }

        if (APRON_GARMENT_TINT_POC && isApronProductContext()) {
            applyApronGarmentTintStacks(scope, hex);
            return;
        }

        if (HOODIE_GARMENT_TINT_POC && isHoodieGarmentTintContext()) {
            applyGarmentTintStacks(scope, hex, true);
            return;
        }

        const isGarmentPhotoPreview = function (el) {
            if (!el || !el.classList || !el.classList.contains('position-preview')) return false;
            return !!el.querySelector('.position-placeholder, .garment-tint-stack');
        };

        scope.querySelectorAll('.position-preview, .position-preview-content, .uploaded-logo-box').forEach(function (el) {
            if (isGarmentPhotoPreview(el)) {
                el.style.backgroundColor = '#ffffff';
                el.style.removeProperty('--garment-bg');
                return;
            }
            const bg = hex || 'transparent';
            if (hex) el.style.setProperty('--garment-bg', hex);
            else el.style.removeProperty('--garment-bg');
            el.style.backgroundColor = bg;
        });
    }

    function applyGarmentColorToLogoPreview() {
        const preview = document.getElementById('designUploadPreview');
        const section = document.getElementById('uploadLogoSection');
        if (!preview) return;
        const hex = resolveGarmentPreviewHex() || '#f3f4f6';
        preview.style.setProperty('--garment-bg', hex);
        preview.style.backgroundColor = hex;
        if (section) section.classList.add('preview-active');
    }

    function clearGarmentLogoPreviewMode() {
        const preview = document.getElementById('designUploadPreview');
        const section = document.getElementById('uploadLogoSection');
        if (section) section.classList.remove('preview-active');
        if (preview) {
            preview.style.removeProperty('--garment-bg');
            preview.style.backgroundColor = '';
        }
        const container = document.getElementById('logoGalleryContainer');
        if (container) container.style.display = '';
    }

    function addToQuote(options = {}) {
        const { silent = false } = options; // silent = true skips the success modal
        debugLog('🛒 addToQuote called, silent:', silent, 'state.quantity:', state.quantity, 'sizeQuantities:', JSON.stringify(state.sizeQuantities));

        // Cancel any pending auto-save to prevent race-condition duplicates
        if (_autoSaveTimer) { clearTimeout(_autoSaveTimer); _autoSaveTimer = null; }
        
        // Validate that we have items (skip check when editing existing basket item)
        const isFromBasket = sessionStorage.getItem('returnAfterCustomize') === 'basket' && isActiveBasketItemEdit();
        if (state.quantity === 0 && !isFromBasket && !isBasketSingleItemEdit()) {
            showToast('Please add at least one item', true);
            return;
        }

        // Get current basket from localStorage
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        const basePositionDesigns = getPositionDesignsForBasket();
        const positions = mergePositionsWithDesigns(buildPositionsFromDOM(), basePositionDesigns, state.positionMethods);
        const positionsHaveLogo = positions.some(function (p) { return p && p.logo; });

        // Create one basket item PER SIZE — each size is its own line
        // isFromBasket already declared above
        const currentUnitPrice = getCurrentUnitPrice();
        const priceMode = localStorage.getItem('brandeduk-vat-mode') === 'on' ? 'inc' : 'ex';
        const baseProductCode = state.product?.code || 'GD067';
        const baseProductName = state.product?.name || 'Gildan Softstyle™ Midweight Hoodie';
        const baseColor = state.selectedColorName || state.selectedColor;
        const baseColorId = state.selectedColor;
        const baseColorImage = state.selectedColorImage;
        let baseColorHex = getSelectedColorHex();
        if (!baseColorHex && window.BrandedColorHex && baseColor) {
            baseColorHex = BrandedColorHex.lookup(baseColor, baseProductCode, baseColorImage, baseColorId) || BrandedColorHex.lookupByName(baseColor, baseColorId) || '';
            if (baseColorHex) BrandedColorHex.register(baseColor, baseColorHex, baseProductCode);
        }
        const baseNote = state.itemNote || '';
        const now = new Date().toISOString();

        // If coming from basket row tap — update that line only (colour, size, logos)
        const basketEditNewColor = sessionStorage.getItem('basketEditNewColor') === '1';
        let lastNewItem = null;
        if (isBasketSingleItemEdit() && !basketEditNewColor) {
            const editId = sessionStorage.getItem('basketEditItemId');
            let basketIdx = parseInt(sessionStorage.getItem('customizingBasketIndex'), 10);
            if (editId) {
                const byId = basket.findIndex(i => i.id === editId);
                if (byId !== -1) basketIdx = byId;
            }
            if (!isNaN(basketIdx) && basketIdx >= 0 && basketIdx < basket.length) {
                const existing = basket[basketIdx];
                const code = baseProductCode || existing.code || existing.productCode || '';
                existing.code = code;
                existing.productCode = code;
                existing.name = baseProductName || existing.name || existing.productName;
                existing.productName = existing.name;
                existing.color = baseColor;
                existing.colorId = baseColorId;
                existing.colorImage = baseColorImage || existing.colorImage;
                existing.image = existing.colorImage;
                if (baseColorHex) existing.colorHex = baseColorHex;
                const sizeEntries = Object.entries(state.sizeQuantities || {}).filter(([, q]) => q > 0);
                if (sizeEntries.length >= 1) {
                    existing.size = sizeEntries[0][0];
                    existing.qty = sizeEntries[0][1];
                }
                existing.unitPrice = currentUnitPrice;
                existing.positions = positions;
                existing.positionDesigns = JSON.parse(JSON.stringify(basePositionDesigns));
                syncBasketItemLogos(existing);
                clearBasketLogoPromptIfHasLogo(existing);
                existing.id = makeBasketRowId(code, existing.color, existing.size);
                _autoSavedItemId = existing.id;
                lastNewItem = existing;
                sessionStorage.setItem('basketEditItemId', existing.id);
                sessionStorage.setItem('customizingBasketIndex', String(basketIdx));
                debugLog('🔄 [basketEdit] Updated item:', existing.color, existing.size, 'qty', existing.qty);
            }
        } else if (isFromBasket && _autoSavedItemId) {
            const existingIdx = basket.findIndex(i => i.id === _autoSavedItemId);
            if (existingIdx !== -1) {
                const existing = basket[existingIdx];
                existing.positions = positions;
                existing.positionDesigns = JSON.parse(JSON.stringify(basePositionDesigns));
                syncBasketItemLogos(existing);
                clearBasketLogoPromptIfHasLogo(existing);
                existing.customizations = getActiveCustomizations().map(c => ({
                    ...c,
                    qty: existing.totalQty,
                    total: (c.unitPrice || 0) * existing.totalQty
                }));
                existing.color = baseColor;
                existing.colorId = baseColorId;
                existing.colorImage = baseColorImage || existing.colorImage;
                if (baseColorHex) existing.colorHex = baseColorHex;
                const quantityKeys = Object.keys(existing.quantities || {});
                debugLog('🔄 Updated basket item in-place:', existing.productName, existing.color, quantityKeys.join(','));
            }
        } else if (isFromBasket && !_autoSavedItemId) {
            // iframe positionsOnly mode: _autoSavedItemId is null (fresh JS instance).
            // Use customizingBasketIndex from sessionStorage to find the item.
            const basketIdx = parseInt(sessionStorage.getItem('customizingBasketIndex'), 10);
            if (!isNaN(basketIdx) && basketIdx >= 0 && basketIdx < basket.length) {
                const existing = basket[basketIdx];
                existing.positions = positions;
                existing.positionDesigns = JSON.parse(JSON.stringify(basePositionDesigns));
                syncBasketItemLogos(existing);
                clearBasketLogoPromptIfHasLogo(existing);
                existing.color = baseColor;
                existing.colorId = baseColorId;
                existing.colorImage = baseColorImage || existing.colorImage;
                if (baseColorHex) existing.colorHex = baseColorHex;
                // Propagate logos to sibling rows with same product+colour (positions-only flow)
                const key = (existing.productCode || existing.code || '') + '|' + (existing.color || '');
                basket.forEach((item, i) => {
                    if (i === basketIdx) return;
                    const itemKey = (item.productCode || item.code || '') + '|' + (item.color || '');
                    if (itemKey === key) {
                        item.positions = JSON.parse(JSON.stringify(positions));
                        item.positionDesigns = JSON.parse(JSON.stringify(basePositionDesigns));
                        syncBasketItemLogos(item);
                        clearBasketLogoPromptIfHasLogo(item);
                        if (baseColorHex) item.colorHex = baseColorHex;
                    }
                });
                debugLog('🔄 [iframe] Updated basket item via customizingBasketIndex:', basketIdx, existing.productName || existing.name);
                debugLog('💾 [iframe] Saved positions:', existing.positions);
                debugLog('💾 [iframe] Saved positionDesigns:', existing.positionDesigns);
            } else {
                debugWarn('⚠️ [iframe] isFromBasket but no valid customizingBasketIndex');
            }
        } else {
            // Normal flow: create separate items per size
            const sizesToAdd = Object.entries(state.sizeQuantities).filter(([, qty]) => qty > 0);

            // Replace only draft lines for THIS product (never remove other products e.g. apron after t-shirt)
            function removeDraftIfSameProduct(itemId) {
                const oldIdx = basket.findIndex(i => i.id === itemId);
                if (oldIdx === -1) return;
                const row = basket[oldIdx];
                const rowCode = row.productCode || row.code || '';
                if (rowCode === baseProductCode) basket.splice(oldIdx, 1);
            }
            if (_autoSavedItemId) removeDraftIfSameProduct(_autoSavedItemId);
            _sessionSavedIds.forEach(sid => removeDraftIfSameProduct(sid));
            _sessionSavedIds.clear();
            _autoSavedItemId = null;

            sizesToAdd.forEach(([size, qty]) => {
                const sizePositions = positions.map(p => ({ ...p }));
                const sizeCustomizations = positionsHaveLogo ? getActiveCustomizations().map(c => ({
                    ...c,
                    qty: qty,
                    total: (c.unitPrice || 0) * qty
                })) : [];

                const itemId = Date.now().toString() + '-' + size;
                lastNewItem = {
                    id: itemId,
                    pendingLogoPrompt: !positionsHaveLogo,
                    productCode: baseProductCode,
                    productName: baseProductName,
                    color: baseColor,
                    colorId: baseColorId,
                    colorHex: baseColorHex,
                    colorImage: baseColorImage,
                    productType: state.product?.productType || '',
                    quantities: { [size]: qty },
                    totalQty: qty,
                    unitPrice: currentUnitPrice,
                    basePrice: state.product?.basePrice || currentUnitPrice,
                    priceBreaks: state.product?.priceBreaks || [],
                    priceMode: priceMode,
                    positions: sizePositions,
                    positionDesigns: positionsHaveLogo ? JSON.parse(JSON.stringify(basePositionDesigns)) : {},
                    customizations: sizeCustomizations,
                    note: baseNote,
                    addedAt: now
                };

                _sessionSavedIds.add(itemId);
                basket.push(lastNewItem);
                debugLog('🛒 Added basket item (size ' + size + '), totalQty:', qty);
            });

            if (sizesToAdd.length > 0) {
                _autoSavedItemId = [..._sessionSavedIds][_sessionSavedIds.size - 1];
            }
        }
        
        debugLog('✅ Basket after save:', basket.length, 'items, total quantities:', basket.map(i => i.totalQty));
        
        // ── RECALCULATE prices for ALL items with the same productCode ──
        // Total quantity across all colours determines the tier discount
        _recalcPricesForProduct(basket, baseProductCode);
        
        // Save to localStorage with error handling
        try {
            syncAllBasketLogos(basket);
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
            debugLog('💾 [addToQuote] Saved basket to localStorage, total items:', basket.length);
            if (isFromBasket) {
                const basketIdx = parseInt(sessionStorage.getItem('customizingBasketIndex'), 10);
                if (!isNaN(basketIdx) && basketIdx >= 0 && basketIdx < basket.length) {
                    debugLog('💾 [addToQuote] Item at basketIdx', basketIdx, ':', {
                        code: basket[basketIdx].code || basket[basketIdx].productCode,
                        color: basket[basketIdx].color,
                        hasPositions: !!basket[basketIdx].positions,
                        positionsLength: basket[basketIdx].positions?.length,
                        hasPositionDesigns: !!basket[basketIdx].positionDesigns,
                        positionDesignsKeys: basket[basketIdx].positionDesigns ? Object.keys(basket[basketIdx].positionDesigns) : []
                    });
                }
            }
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('?? LocalStorage quota exceeded!');
                
                // Try to compress and save again
                compressItemImages(lastNewItem).then(compressedItem => {
                    basket[basket.length - 1] = compressedItem;
                    try {
                        localStorage.setItem('quoteBasket', JSON.stringify(basket));
                        showToast('Item added (images compressed due to storage limit)');
                    } catch (e2) {
                        showToast('Storage full! Please complete your quote or remove items.', true);
                        basket.pop(); // Remove the item we just added
                    }
                });
                return; // Exit early, will continue after compression
            } else {
                throw e; // Re-throw other errors
            }
        }
        
        // Close the editor modal
        closeModal(elements.designEditorModal);
        
        // Update the cart badge
        updateCartBadge();
        
        // ── Background: upgrade base64 logos to server URLs ──
        _upgradeBasketLogosToServer();
        
        // Logo-only flow from basket (positions popup) — return to basket.
        // Only when genuinely editing an existing basket line; a fresh product
        // must fall through to the "Add logo / Continue" popup below.
        const returnTarget = sessionStorage.getItem('returnAfterCustomize');
        if (returnTarget === 'basket' && !isBasketSingleItemEdit() && isActiveBasketItemEdit()) {
            sessionStorage.removeItem('customizingBasketIndex');
            sessionStorage.removeItem('returnAfterCustomize');
            showToast('Logo saved! Returning to basket…');
            setTimeout(() => {
                if (window.parent !== window && typeof window.parent.closeCustomizePopup === 'function') {
                    window.parent.closeCustomizePopup();
                } else {
                    window.location.href = '../basket.html';
                }
            }, 800);
            return;
        }

        const showLogoAddedModal = !silent && lastNewItem && (
            !isBasketSingleItemEdit() ||
            basketEditNewColor ||
            (isBasketSingleItemEdit() && !basketItemHasLogo(lastNewItem))
        );

        if (showLogoAddedModal && lastNewItem && !basketItemHasLogo(lastNewItem)) {
            markItemForLogoPrompt(lastNewItem);
        }

        if (showLogoAddedModal && lastNewItem && !basketItemHasLogo(lastNewItem)) {
            sessionStorage.removeItem('basketEditNewColor');
            beginLogoFlowForNewBasketItem(lastNewItem);
            return;
        }

        // Same basket line updated (qty/size only) — close popup back to basket
        if (!silent && lastNewItem && isBasketSingleItemEdit() && !basketEditNewColor) {
            sessionStorage.removeItem('basketEditNewColor');
            sessionStorage.removeItem('basketEditSingleItem');
            sessionStorage.removeItem('basketEditItemId');
            sessionStorage.removeItem('customizingBasketIndex');
            showToast('Item updated');
            if (window.parent !== window && typeof window.parent.closeCustomizePopup === 'function') {
                setTimeout(function () { window.parent.closeCustomizePopup(); }, 400);
            }
            return;
        }
    }

    /**
     * Scan quoteBasket for base64 logos and upload them to Vercel Blob in the background.
     * Replaces data-URLs with permanent URLs to reduce localStorage pressure.
     */
    async function _upgradeBasketLogosToServer() {
        if (typeof window.BrandedLogoLibrary === 'undefined') return;
        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            let changed = false;

            for (const item of basket) {
                // Upgrade positions[] logos
                if (Array.isArray(item.positions)) {
                    for (const pos of item.positions) {
                        if (pos.logo && pos.logo.startsWith('data:')) {
                            const result = await window.BrandedLogoLibrary.uploadToServer(pos.logo, pos.position);
                            if (result && result.url && !result.url.startsWith('data:')) {
                                pos.logo = result.url;
                                changed = true;
                            }
                        }
                    }
                }
                // Upgrade positionDesigns logos
                if (item.positionDesigns && typeof item.positionDesigns === 'object') {
                    for (const key of Object.keys(item.positionDesigns)) {
                        const design = item.positionDesigns[key];
                        if (design && design.logo && design.logo.startsWith('data:')) {
                            const result = await window.BrandedLogoLibrary.uploadToServer(design.logo, key);
                            if (result && result.url && !result.url.startsWith('data:')) {
                                design.logo = result.url;
                                changed = true;
                            }
                        }
                    }
                }
            }

            if (changed) {
                localStorage.setItem('quoteBasket', JSON.stringify(basket));
                debugLog('✅ Basket logos upgraded to server URLs');
            }
        } catch (err) {
            debugWarn('[LogoUpgrade] Background upgrade failed:', err.message);
        }
    }

    // Note: getCurrentUnitPrice() is defined earlier in the file (around line 1039)
    // and uses state.pricing.tiers correctly

    function getActiveCustomizations() {
        const customizations = [];
        
        // Check each zone for content
        document.querySelectorAll('.design-zone').forEach(zone => {
            const zoneName = zone.getAttribute('data-zone');
            const logoImg = zone.querySelector('.zone-logo');
            const textEl = zone.querySelector('.zone-text');
            
            if (logoImg && logoImg.style.display !== 'none' && logoImg.src) {
                customizations.push({
                    zone: zoneName,
                    type: 'logo',
                    content: logoImg.src
                });
            }
            
            if (textEl && textEl.style.display !== 'none' && textEl.textContent) {
                customizations.push({
                    zone: zoneName,
                    type: 'text',
                    content: textEl.textContent,
                    font: textEl.style.fontFamily || 'Arial',
                    color: textEl.style.color || '#000'
                });
            }
        });
        
        return customizations;
    }

    function showAddedToQuoteModal(item) {
        // Build size detail string (e.g. "Antique Cherry Red, M\nAntique Cherry Red, L")
        const sizeDetails = Object.entries(item.quantities || {})
            .filter(([, qty]) => qty > 0)
            .map(([size]) => `${item.color}, ${size}`)
            .join('<br>');
        
        const itemImage = item.colorImage || state.selectedColorImage || '';
        const unitPrice = item.unitPrice || 0;
        const totalPrice = unitPrice * (item.totalQty || 0);
        const vatMode = localStorage.getItem('brandeduk-vat-mode') === 'on';
        const displayUnit = vatMode ? (unitPrice * 1.2).toFixed(2) : unitPrice.toFixed(2);
        const displayTotal = vatMode ? (totalPrice * 1.2).toFixed(2) : totalPrice.toFixed(2);
        const vatLabel = vatMode ? 'inc. VAT' : 'ex. VAT';

        // Remove any existing modal
        document.querySelector('.quote-added-modal')?.remove();

        const modal = document.createElement('div');
        modal.className = 'quote-added-modal';
        modal.innerHTML = `
            <div class="quote-added-content" style="max-width:420px;width:92%;background:#fff;border-radius:16px;padding:24px 20px;position:relative;box-shadow:0 8px 32px rgba(0,0,0,.2);">
                <button type="button" id="closeAddedModal" style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:#6b7280;line-height:1;">&times;</button>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 12l2.5 2.5L16 9"/>
                    </svg>
                    <h3 style="margin:0;font-size:18px;font-weight:700;color:#16a34a;">Added to basket</h3>
                </div>
                <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:16px;">
                    ${itemImage ? `<img src="${itemImage}" alt="${item.productName}" style="width:64px;height:64px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;flex-shrink:0;">` : ''}
                    <div style="min-width:0;">
                        <h4 style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1f2937;">${item.productName || 'Product'}</h4>
                        <p style="margin:0;font-size:12px;color:#6b7280;">${item.productCode || ''}</p>
                        <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${sizeDetails}</p>
                        <p style="margin:2px 0 0;font-size:12px;color:#374151;font-weight:600;">Qty: ${item.totalQty}</p>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
                    <span style="font-size:14px;font-weight:700;color:#1f2937;">${item.totalQty} items</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;">
                    <span style="font-size:13px;color:#6b7280;">£${displayUnit} per item</span>
                    <span style="font-size:15px;color:#16a34a;font-weight:700;">Total: £${displayTotal} <span style="font-size:11px;font-weight:400;">${vatLabel}</span></span>
                </div>
                <div class="quote-added-actions" style="display:flex;flex-direction:column;gap:10px;">
                    <button class="btn-primary" id="addLogoNowBtn" style="width:100%;padding:14px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;border:none;color:#fff;background:linear-gradient(135deg,#273469,#1E2749);display:flex;align-items:center;justify-content:center;gap:8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        Add your logo now
                    </button>
                    <button class="btn-secondary" id="viewBasketBtn" style="width:100%;padding:12px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;border:1px solid #15803d;background:#16a34a;color:#ffffff;">View Basket</button>
                    <button class="btn-secondary" id="continueShoppingBtn" style="width:100%;padding:12px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;border:2px dashed #7c3aed;background:#ffffff;color:#7c3aed;">Continue Shopping</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        const clearModalButtonFocus = () => {
            const active = document.activeElement;
            if (active && modal.contains(active) && typeof active.blur === 'function') {
                active.blur();
            }
        };

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
        });
        
        // Close button
        modal.querySelector('#closeAddedModal').addEventListener('click', () => {
            clearModalButtonFocus();
            modal.remove();
        });

        // Add your logo now — start the new customization tool
        modal.querySelector('#addLogoNowBtn').addEventListener('click', () => {
            clearModalButtonFocus();
            modal.remove();
            clearPositionState();
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            const idx = basket.findIndex(function (i) { return i.id === item.id; });
            if (idx !== -1) {
                sessionStorage.setItem('customizingBasketIndex', String(idx));
                sessionStorage.setItem('returnAfterCustomize', 'basket');
                _autoSavedItemId = basket[idx].id;
                sessionStorage.removeItem('basketEditSingleItem');
            }

            // Pass the currently selected garment colour to the standalone tool.
            try {
                const chosenColorName = String(state.selectedColorName || item.color || '').trim();
                const chosenColorHex = String(getCurrentGarmentColorHex() || item.colorHex || '').trim();

                if (chosenColorName) {
                    sessionStorage.setItem('selectedColorName', chosenColorName);
                }
                if (chosenColorHex) {
                    sessionStorage.setItem('selectedColorHex', chosenColorHex);
                }

                const existingRaw = sessionStorage.getItem('selectedProductData');
                const existingData = existingRaw ? JSON.parse(existingRaw) : {};
                const mergedData = Object.assign({}, existingData, {
                    code: existingData.code || (state.product && state.product.code) || item.productCode || item.code || '',
                    name: existingData.name || (state.product && state.product.name) || item.productName || item.name || '',
                    color: chosenColorName || existingData.color || '',
                    selectedColorName: chosenColorName || existingData.selectedColorName || '',
                    colorHex: chosenColorHex || existingData.colorHex || '',
                    selectedColorHex: chosenColorHex || existingData.selectedColorHex || ''
                });
                sessionStorage.setItem('selectedProductData', JSON.stringify(mergedData));
            } catch (e) {
                // Keep redirect flow working even if sessionStorage is unavailable.
            }

            const productCode = encodeURIComponent((state.product && state.product.code) || item.productCode || item.code || '');
            const productName = String((item && (item.productName || item.name)) || '').toLowerCase();
            const productCategory = String((item && item.category) || '').toLowerCase();
            let toolProduct = '';
            if (/t\s*-?shirt|tee/.test(productName) || /t\s*-?shirt|tee/.test(productCategory)) toolProduct = 'tshirt';
            else if (/hoodie|sweatshirt/.test(productName) || /hoodie|sweatshirt/.test(productCategory)) toolProduct = 'hoodie';
            else if (/beanie/.test(productName) || /beanie/.test(productCategory)) toolProduct = 'beanie';
            else if (/cap/.test(productName) || /cap/.test(productCategory)) toolProduct = 'cap';
            else if (/polo/.test(productName) || /polo/.test(productCategory)) toolProduct = 'polo';

            const queryParts = ['from=customize-mobile'];
            if (productCode) queryParts.unshift('code=' + productCode);
            if (toolProduct) queryParts.push('product=' + encodeURIComponent(toolProduct));
            const query = '?' + queryParts.join('&');
            window.location.href = '../customization-tool/index.html' + query;
        });

        // View Basket — basket quick-logo popup if item still needs logo
        modal.querySelector('#viewBasketBtn').addEventListener('click', () => {
            clearModalButtonFocus();
            modal.remove();
            if (!basketItemHasLogo(item) && item.id) {
                sessionStorage.setItem('pendingLogoPromptId', item.id);
            }
            window.location.href = '../basket.html?promptLogo=1';
        });
        
        // Continue Shopping
        modal.querySelector('#continueShoppingBtn').addEventListener('click', () => {
            // Force clear basket-edit context so next product does not auto-redirect to basket.
            sessionStorage.removeItem('customizingBasketIndex');
            sessionStorage.removeItem('returnAfterCustomize');
            sessionStorage.removeItem('basketEditSingleItem');
            sessionStorage.removeItem('basketEditItemId');
            sessionStorage.removeItem('basketEditNewColor');
            sessionStorage.removeItem('pendingLogoPromptId');
            clearModalButtonFocus();
            modal.remove();
            resetCustomizationForm();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                clearModalButtonFocus();
                modal.remove();
            }
        });

        modal.addEventListener('pointerdown', (e) => {
            const card = modal.querySelector('.quote-added-content');
            if (card && !card.contains(e.target)) {
                clearModalButtonFocus();
            }
        });
    }

    function resetCustomizationForm() {
        beginNextItemSession();
        state.selectionSaved = false;

        const container = document.querySelector('.selected-sizes');
        if (container) container.innerHTML = '';

        updateSizeQuantities();
        updatePricingSummary();
        updateLiveBadge();
        rebuildSizeRows();
        showToast('Ready for next item!');
    }

    // === Cart Badge ===
    function updateCartBadge() {
        // Try all badge IDs (header and bottom nav)
        const badges = [
            document.getElementById('cartBadge'),
            document.getElementById('cartCount'),
            document.getElementById('navCartBadge')
        ].filter(Boolean);
        
        if (badges.length === 0) return;

        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            let totalItems = 0;
            
            // Count total quantities across all items (supports V2 per-size rows and legacy)
            basket.forEach(item => {
                if (item.qty) {
                    totalItems += parseInt(item.qty) || 0;
                } else if (item.quantities && typeof item.quantities === 'object') {
                    Object.values(item.quantities).forEach(qty => {
                        totalItems += parseInt(qty) || 0;
                    });
                } else if (item.totalQty) {
                    totalItems += parseInt(item.totalQty) || 0;
                } else if (item.quantity) {
                    totalItems += parseInt(item.quantity) || 0;
                } else {
                    totalItems += 1;
                }
            });
            
            badges.forEach(badge => {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'flex' : 'none';
            });
        } catch (e) {
            badges.forEach(badge => {
                badge.style.display = 'none';
            });
        }
    }

    // Update badge with CURRENT selection + basket items
    function updateLiveBadge() {
        const badges = [
            document.getElementById('cartBadge'),
            document.getElementById('cartCount'),
            document.getElementById('navCartBadge')
        ].filter(Boolean);
        
        if (badges.length === 0) return;

        // Current selection from state
        let currentQty = state.quantity || 0;
        
        // Plus items already in basket (supports V2 per-size rows and legacy)
        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            basket.forEach(item => {
                if (item.qty) {
                    currentQty += parseInt(item.qty) || 0;
                } else if (item.quantities && typeof item.quantities === 'object') {
                    Object.values(item.quantities).forEach(qty => {
                        currentQty += parseInt(qty) || 0;
                    });
                } else if (item.totalQty) {
                    currentQty += parseInt(item.totalQty) || 0;
                } else if (item.quantity) {
                    currentQty += parseInt(item.quantity) || 0;
                }
            });
        } catch (e) {}
        
        badges.forEach(badge => {
            badge.textContent = currentQty;
            badge.style.display = currentQty > 0 ? 'flex' : 'none';
        });
    }

    // === Initialize on DOM Ready ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Update cart badge with live quantities
    updateLiveBadge();

    // Refresh badge when returning via back button (bfcache)
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) { updateCartBadge(); updateLiveBadge(); }
    });

    // === Handle Back Button (for iframe popup from basket) ===
    document.addEventListener('DOMContentLoaded', () => {
        const backBtn = document.getElementById('breadcrumbBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // Check if coming from basket customization
                const returnTarget = sessionStorage.getItem('returnAfterCustomize');
                
                // If in iframe popup, close the popup
                if (window.parent !== window && typeof window.parent.closeCustomizePopup === 'function') {
                    sessionStorage.removeItem('customizingBasketIndex');
                    sessionStorage.removeItem('returnAfterCustomize');
                    window.parent.closeCustomizePopup();
                } else if (returnTarget === 'basket') {
                    // Navigate back to basket
                    sessionStorage.removeItem('customizingBasketIndex');
                    sessionStorage.removeItem('returnAfterCustomize');
                    window.location.href = '../basket.html';
                } else {
                    // Otherwise, go back in history or to shop
                    if (window.history.length > 1) {
                        window.history.back();
                    } else {
                        window.location.href = '../shop.html';
                    }
                }
            });
        }
    });

})();

