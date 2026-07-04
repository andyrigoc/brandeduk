/**
 * BrandedUK API Service Module
 * Handles all API calls to the backend
 * Base URL: https://api.brandeduk.com
 */

const BrandedAPI = (function () {
    'use strict';

    // ==========================================================================
    // CONFIGURATION
    // ==========================================================================

    const BASE_URL = (typeof window !== 'undefined' && typeof window.resolveBrandedApiBase === 'function')
        ? window.resolveBrandedApiBase()
        : 'https://api.brandeduk.com';
    const DEFAULT_LIMIT = 24;
    const MAX_LIMIT = 200;
    const DEBUG = typeof window !== 'undefined' && window.BRANDED_DEBUG === true;
    const debugLog = (...args) => { if (DEBUG) console.debug(...args); };
    const debugWarn = (...args) => { if (DEBUG) console.warn(...args); };

    // Cache for filter options (loaded once)
    let filterOptionsCache = null;
    let productTypesCache = null;

    // ==========================================================================
    // SLUG MAPPING - Frontend URL params to API params
    // ==========================================================================

    // Category slug map (from shared config)
    const CATEGORY_SLUG_MAP = (window.BrandedConfig && window.BrandedConfig.CATEGORY_SLUG_MAP) || { 'all': null };

    // ==========================================================================
    // HELPER FUNCTIONS
    // ==========================================================================

    /**
     * Build query string from params object
     * Handles array parameters (e.g., gender[]=male&gender[]=female)
     */
    function buildQueryString(params) {
        const filteredParams = [];

        for (const [key, value] of Object.entries(params)) {
            // Skip null, undefined, empty string, or 'all'
            if (value === null || value === undefined || value === '' || value === 'all') {
                continue;
            }

            // Handle array parameters (keys ending with [])
            if (key.endsWith('[]') && Array.isArray(value)) {
                // For each value in the array, add key[]=value
                value.forEach(v => {
                    if (v !== null && v !== undefined && v !== '') {
                        filteredParams.push(`${key}=${encodeURIComponent(v)}`);
                    }
                });
            } else if (Array.isArray(value)) {
                // If it's an array but key doesn't end with [], handle as key[]=value format
                value.forEach(v => {
                    if (v !== null && v !== undefined && v !== '') {
                        filteredParams.push(`${key}[]=${encodeURIComponent(v)}`);
                    }
                });
            } else {
                // Single value parameter
                filteredParams.push(`${key}=${encodeURIComponent(value)}`);
            }
        }

        return filteredParams.join('&');
    }

    /**
     * Make API request with error handling
     */
    async function apiRequest(endpoint, params = {}, fetchOptions = {}) {
        const queryString = buildQueryString(params);
        const url = `${BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;

        debugLog('[BrandedAPI] Making API Request:', {
            method: 'GET',
            endpoint: endpoint,
            fullUrl: url,
            params: params,
            timestamp: new Date().toISOString()
        });

        try {
            const response = await fetch(url, fetchOptions);

            debugLog('[BrandedAPI] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                timestamp: new Date().toISOString()
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            debugLog('[BrandedAPI] Response data:', {
                endpoint,
                total: data.total || data.items?.length || 'N/A',
                itemsCount: data.items?.length || 0,
                timestamp: new Date().toISOString()
            });
            return data;
        } catch (error) {
            console.error('❌ [BrandedAPI] Error:', {
                message: error.message,
                url: url,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Map frontend category to API productType slug
     */
    function mapCategoryToProductType(category) {
        if (!category || category === 'all') return null;
        const normalized = category.toLowerCase().trim();
        return CATEGORY_SLUG_MAP[normalized] || normalized;
    }

    // ── Brands whose NAME we hide from the UI (products still appear) ──
    const HIDDEN_BRAND_NAMES = ['absolute', 'ralawise'];

    /**
     * Transform API product to frontend format
     */
    function transformProduct(apiProduct) {
        // Handle colors - API returns array of color objects
        const colors = (apiProduct.colors || []).map(color => {
            if (typeof color === 'string') {
                const name = color;
                const hex = (typeof window !== 'undefined' && window.BrandedColorHex)
                    ? (window.BrandedColorHex.lookupByName(name) || '')
                    : '';
                return { name: name, main: apiProduct.image, hex: hex };
            }
            const name = color.name || color.colour_name || 'Default';
            const rawHex = color.hex || color.colourHex || color.colorHex || color.colour_hex || color.color_hex || '';
            let hex = '';
            if (typeof window !== 'undefined' && window.BrandedColorHex) {
                hex = window.BrandedColorHex.parseHex(rawHex) || window.BrandedColorHex.lookupByName(name) || '';
            }
            return {
                name: name,
                main: color.main || color.image_url || apiProduct.image,
                thumb: color.thumb || color.thumbnail || null,
                hex: hex
            };
        });

        // If no colors, create default from main image
        if (colors.length === 0 && apiProduct.image) {
            colors.push({ name: 'Default', main: apiProduct.image });
        }

        // Handle customization/decoration methods
        let customization = apiProduct.customization || [];
        if (typeof customization === 'string') {
            customization = customization.split(',').map(s => s.trim().toLowerCase());
        }
        if (!Array.isArray(customization)) {
            customization = [];
        }
        // Ensure we have standard values
        customization = customization.map(c => {
            const lower = c.toLowerCase();
            if (lower.includes('emb')) return 'embroidery';
            if (lower.includes('print') || lower.includes('screen')) return 'print';
            return lower;
        });

        // Get price - API returns number
        const price = typeof apiProduct.price === 'number'
            ? apiProduct.price
            : parseFloat(apiProduct.price) || 0;

        // Build price breaks from API data
        const priceBreaks = apiProduct.priceBreaks || apiProduct.price_breaks || [];

        // Hide excluded brand names from the UI (products still appear)
        let rawBrand = apiProduct.brand || apiProduct.brand_name || '';
        let rawName = apiProduct.name || apiProduct.product_name || '';
        if (HIDDEN_BRAND_NAMES.some(b => rawBrand.toLowerCase().includes(b))) {
            rawBrand = '';
        }
        // Strip brand text from product name (e.g. "Absolute Apparel AA89 ..." → "AA89 ...")
        HIDDEN_BRAND_NAMES.forEach(b => {
            rawName = rawName.replace(new RegExp(b + '\\s*apparel', 'gi'), '').replace(new RegExp(b, 'gi'), '').replace(/^\s*[-–—]\s*/, '').trim();
        });
        // Strip ™ ® © symbols that render as boxes in some fonts
        rawName = rawName.replace(/[\u00AE\u2122\u00A9]/g, '');

        const result = {
            code: apiProduct.code || apiProduct.style_code || '',
            name: rawName,
            price: price,
            priceBreaks: priceBreaks,
            category: apiProduct.product_type || apiProduct.category || '',
            image: apiProduct.image || apiProduct.main_image || '',
            colors: colors,
            sizes: apiProduct.sizes || [],
            customization: customization,
            brand: rawBrand,
            // Additional fields from API
            description: apiProduct.description || '',
            fabric: apiProduct.fabric || '',
            weight: apiProduct.weight || '',
            fit: apiProduct.fit || '',
            gender: apiProduct.gender || '',
            ageGroup: apiProduct.age_group || apiProduct.ageGroup || '',
            // Product badges
            is_best_seller: apiProduct.is_best_seller || apiProduct.isBestSeller || false,
            is_recommended: apiProduct.is_recommended || apiProduct.isRecommended || false,
            is_featured: apiProduct.is_featured || apiProduct.isFeatured || false
        };

        if (typeof window !== 'undefined' && window.BrandedColorHex && result.code) {
            window.BrandedColorHex.registerProductColors(result.code, result.colors);
        }

        return result;
    }

    // ==========================================================================
    // PUBLIC API METHODS
    // ==========================================================================

    /**
     * Get products with filters
     * @param {Object} options - Filter options (can include array params like gender[]: ['male', 'female'])
     * @returns {Promise<Object>} - { items, page, limit, total, priceRange }
     */
    async function getProducts(options = {}) {
        const params = {
            page: options.page || 1,
            limit: Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT)
        };

        // Variant color filter (expects normalized slug e.g. "black")
        if (options.color) {
            params.color = options.color;
        }

        // Search query (mutually exclusive with productType)
        if (options.q || options.search) {
            params.q = (options.q || options.search || '').trim();
        } else if (options.productType) {
            // Only add productType if there's no search query
            params.productType = options.productType;
        } else if (options.category && options.category !== 'all') {
            // Map category slug to productType
            const productType = mapCategoryToProductType(options.category);
            if (productType) {
                params.productType = productType;
            }
            // Handle special categories
            if (options.category === 'sustainable') {
                params['accreditations[]'] = ['organic', 'recycled'];
            }
        }

        // Price range
        if (options.priceMin !== undefined && options.priceMin !== null && options.priceMin > 0) {
            params.priceMin = options.priceMin;
        }
        if (options.priceMax !== undefined && options.priceMax !== null && options.priceMax > 0) {
            params.priceMax = options.priceMax;
        }

        // Copy all array parameters directly (keys ending with [])
        // These come from buildApiParams in the shop page and include values like:
        // gender[]: ['male', 'female']
        // size[]: ['m', 'l']
        // flag[]: ['raladeal', 'offers']
        const arrayParamNames = [
            'gender[]', 'ageGroup[]', 'sleeve[]', 'neckline[]', 'accreditations[]',
            'primaryColour[]', 'colourShade[]', 'style[]', 'feature[]', 'size[]',
            'fabric[]', 'weight[]', 'fit[]', 'sector[]', 'sport[]', 'tag[]',
            'effect[]', 'cmyk[]', 'pantone[]', 'flag[]', 'brand[]', 'productType[]'
        ];

        arrayParamNames.forEach(paramName => {
            if (options[paramName] && Array.isArray(options[paramName])) {
                params[paramName] = options[paramName];
            }
        });

        // Sorting
        if (options.sort) {
            params.sort = options.sort;
        }

        // Brand filter (from URL, e.g., ?brand=nike)
        if (options.brand) {
            params.brand = options.brand;
        }

        // Featured products filter
        if (options.isFeatured === true || options.isFeatured === 'true') {
            params.isFeatured = 'true';
        }

        const fetchOptions = options.signal ? { signal: options.signal } : {};
        const response = await apiRequest('/api/products', params, fetchOptions);

        const allItems = (response.items || []).map(transformProduct);

        return {
            items: allItems,
            page: response.page || params.page,
            limit: response.limit || params.limit,
            total: response.total || 0,
            priceRange: response.priceRange || { min: 0, max: 200 }
        };
    }

    /**
     * Get single product by code
     * @param {string} code - Product code (e.g., "GD067")
     * @returns {Promise<Object>} - Transformed product object
     */
    async function getProductByCode(code) {
        if (!code) {
            throw new Error('Product code is required');
        }

        const response = await apiRequest(`/api/products/${encodeURIComponent(code)}`);
        return transformProduct(response);
    }

    /**
     * Get related products for a product
     * @param {string} code - Product code
     * @param {number} limit - Max number of related products
     * @returns {Promise<Object>} - { related, currentProduct, total }
     */
    async function getRelatedProducts(code, limit = 12) {
        if (!code) {
            throw new Error('Product code is required');
        }

        const response = await apiRequest(`/api/products/${encodeURIComponent(code)}/related`, { limit });

        return {
            currentProduct: response.currentProduct || {},
            related: (response.related || []).map(transformProduct),
            total: response.total || 0,
            sameBrandAndType: response.sameBrandAndType || 0,
            sameTypeOnly: response.sameTypeOnly || 0
        };
    }

    /**
     * Get all product types with counts
     * @param {boolean} useCache - Whether to use cached data
     * @returns {Promise<Array>} - Array of product types
     */
    async function getProductTypes(useCache = true) {
        if (useCache && productTypesCache) {
            return productTypesCache;
        }

        const response = await apiRequest('/api/products/types');
        productTypesCache = response.productTypes || [];
        return productTypesCache;
    }

    /**
     * Get filter aggregations/counts based on current filters
     * Uses the same /api/products endpoint with filter parameters
     * @param {Object} currentFilters - Currently applied filters (same format as getProducts)
     * @returns {Promise<Object>} - Filter counts by category
     */
    async function getFilterCounts(currentFilters = {}) {
        // Use the same endpoint and parameters as getProducts
        // Build params exactly like getProducts does
        const params = {
            page: 1,
            limit: 1 // Only need metadata, not products
        };

        // Variant color filter
        if (currentFilters.color) {
            params.color = currentFilters.color;
        }

        // Search query (mutually exclusive with productType)
        if (currentFilters.q || currentFilters.search) {
            params.q = currentFilters.q || currentFilters.search;
        } else if (currentFilters.productType) {
            params.productType = currentFilters.productType;
        } else if (currentFilters.category && currentFilters.category !== 'all') {
            const productType = mapCategoryToProductType(currentFilters.category);
            if (productType) {
                params.productType = productType;
            }
        }

        // Price range
        if (currentFilters.priceMin !== undefined && currentFilters.priceMin !== null && currentFilters.priceMin > 0) {
            params.priceMin = currentFilters.priceMin;
        }
        if (currentFilters.priceMax !== undefined && currentFilters.priceMax !== null && currentFilters.priceMax > 0) {
            params.priceMax = currentFilters.priceMax;
        }

        // Copy all array parameters directly (keys ending with [])
        const arrayParamNames = [
            'gender[]', 'ageGroup[]', 'sleeve[]', 'neckline[]', 'accreditations[]',
            'primaryColour[]', 'colourShade[]', 'style[]', 'feature[]', 'size[]',
            'fabric[]', 'weight[]', 'fit[]', 'sector[]', 'sport[]', 'tag[]',
            'effect[]', 'cmyk[]', 'pantone[]', 'flag[]'
        ];

        arrayParamNames.forEach(paramName => {
            if (currentFilters[paramName] && Array.isArray(currentFilters[paramName])) {
                params[paramName] = currentFilters[paramName];
            }
        });

        debugLog('[BrandedAPI] Fetching filter counts from /api/products with params:', params);

        const response = await apiRequest('/api/products', params);

        debugLog('[BrandedAPI] Filter counts response:', {
            hasFilters: !!response.filters,
            hasAggregations: !!response.aggregations,
            responseKeys: Object.keys(response)
        });

        // The API response should include filter aggregations
        // If the response has a 'filters' property, return it
        // Otherwise, return empty object (filter counts might be in a different format)
        return response.filters || response.aggregations || {};
    }

    /**
     * Get price range (min/max across all products)
     * @returns {Promise<Object>} - { min, max }
     */
    async function getPriceRange() {
        const response = await apiRequest('/api/filters/price-range');
        return {
            min: response.min || 0,
            max: response.max || 200
        };
    }

    /**
     * Get all available filter options from API
     * @returns {Promise<Object>} - All filter options
     */
    async function getAllFilterOptions() {
        if (filterOptionsCache) {
            return filterOptionsCache;
        }

        // Fetch all filter endpoints in parallel
        const [
            genders,
            ageGroups,
            sleeves,
            necklines,
            fabrics,
            sizes,
            primaryColors,
            styles,
            tags,
            weights,
            fits,
            sectors,
            sports,
            effects,
            accreditations,
            colourShades,
            brands
        ] = await Promise.all([
            apiRequest('/api/filters/genders').catch(() => ({ genders: [] })),
            apiRequest('/api/filters/age-groups').catch(() => ({ ageGroups: [] })),
            apiRequest('/api/filters/sleeves').catch(() => ({ sleeves: [] })),
            apiRequest('/api/filters/necklines').catch(() => ({ necklines: [] })),
            apiRequest('/api/filters/fabrics').catch(() => ({ fabrics: [] })),
            apiRequest('/api/filters/sizes').catch(() => ({ sizes: [] })),
            apiRequest('/api/filters/primary-colors').catch(() => ({ primaryColors: [] })),
            apiRequest('/api/filters/styles').catch(() => ({ styles: [] })),
            apiRequest('/api/filters/tags').catch(() => ({ tags: [] })),
            apiRequest('/api/filters/weights').catch(() => ({ weights: [] })),
            apiRequest('/api/filters/fits').catch(() => ({ fits: [] })),
            apiRequest('/api/filters/sectors').catch(() => ({ sectors: [] })),
            apiRequest('/api/filters/sports').catch(() => ({ sports: [] })),
            apiRequest('/api/filters/effects').catch(() => ({ effects: [] })),
            apiRequest('/api/filters/accreditations').catch(() => ({ accreditations: [] })),
            apiRequest('/api/filters/colour-shades').catch(() => ({ colourShades: [] })),
            apiRequest('/api/filters/brands').catch(() => ({ brands: [] }))
        ]);

        filterOptionsCache = {
            genders: genders.genders || [],
            ageGroups: ageGroups.ageGroups || [],
            sleeves: sleeves.sleeves || [],
            necklines: necklines.necklines || [],
            fabrics: fabrics.fabrics || [],
            sizes: sizes.sizes || [],
            primaryColors: primaryColors.primaryColors || [],
            styles: styles.styles || [],
            tags: tags.tags || [],
            weights: weights.weights || [],
            fits: fits.fits || [],
            sectors: sectors.sectors || [],
            sports: sports.sports || [],
            effects: effects.effects || [],
            accreditations: accreditations.accreditations || [],
            colourShades: colourShades.colourShades || [],
            brands: brands.brands || []
        };

        return filterOptionsCache;
    }

    /**
     * Health check
     * @returns {Promise<boolean>}
     */
    async function healthCheck() {
        try {
            await apiRequest('/health');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Clear all caches
     */
    function clearCache() {
        filterOptionsCache = null;
        productTypesCache = null;
    }

    /**
     * Map frontend position codes to backend position slugs
     * @param {string} position - Frontend position code (e.g., "left-arm", "large-back")
     * @returns {string} - Backend position slug (e.g., "left-sleeve", "back-center")
     */
    function mapPositionToBackendSlug(position) {
        const positionMap = {
            // Direct matches
            'left-breast': 'left-breast',
            'right-breast': 'right-breast',
            'small-centre-front': 'small-centre-front',
            'large-front-center': 'large-front-center',
            'large-centre-front': 'large-centre-front',

            // Mappings for different naming conventions
            'left-arm': 'left-sleeve',
            'right-arm': 'right-sleeve',
            'large-back': 'back-center',
            'back-center': 'back-center',
            'left-sleeve': 'left-sleeve',
            'right-sleeve': 'right-sleeve'
        };

        // Check if we have a direct mapping
        if (positionMap[position]) {
            return positionMap[position];
        }

        // Fallback: convert position name to slug format
        // Replace spaces with hyphens and lowercase
        return position.replace(/\s+/g, '-').toLowerCase();
    }

    /**
     * Convert base64 data URL to Blob
     * @param {string} dataUrl - Base64 data URL (e.g., "data:image/png;base64,...")
     * @param {string} filename - Optional filename for the blob
     * @returns {Blob} - Blob object
     */
    function getExtensionForMimeType(mimeType) {
        if (mimeType === 'image/jpeg') return 'jpg';
        if (mimeType === 'image/png') return 'png';
        if (mimeType === 'image/webp') return 'webp';
        if (mimeType === 'image/gif') return 'gif';
        return 'bin';
    }

    function buildUploadFileName(baseName, mimeType, currentName = '') {
        const normalizedBase = (baseName || 'logo').replace(/\.[^.]+$/, '');
        const extension = getExtensionForMimeType(mimeType);
        const sourceName = currentName || normalizedBase;

        if (sourceName && /\.[^.]+$/.test(sourceName)) {
            return sourceName.replace(/\.[^.]+$/, `.${extension}`);
        }

        return `${normalizedBase}.${extension}`;
    }

    function base64ToBlob(dataUrl, filename = 'logo.png') {
        try {
            const matches = dataUrl.match(/^data:image\/([\w+.-]+);base64,(.+)$/);
            if (!matches) {
                throw new Error('Invalid base64 data URL format');
            }

            const mimeType = matches[1] === 'jpeg' ? 'image/jpeg' : `image/${matches[1]}`;
            const base64Data = matches[2];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });

            // Convert Blob to File for better compatibility
            const timestamp = Date.now();
            const finalFilename = buildUploadFileName(
                filename || `logo-${timestamp}`,
                mimeType,
                filename
            );

            return new File([blob], finalFilename, { type: mimeType });
        } catch (error) {
            console.error('Error converting base64 to Blob:', error);
            throw error;
        }
    }

    /**
     * Compress an image file to reduce size
     * @param {File|Blob} file - Image file to compress
     * @param {number} quality - Compression quality (0.0 to 1.0)
     * @param {number} maxWidth - Maximum width in pixels
     * @returns {Promise<File>} - Compressed file
     */
    async function compressImageFile(file, quality = 0.7, maxWidth = 1200) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Scale down if too large (more aggressive: 1200px instead of 1920px)
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to JPEG for better compression (PNG doesn't support quality parameter)
                    // Use JPEG even if original was PNG - much better compression ratio
                    const outputType = 'image/jpeg';
                    const outputQuality = quality; // 0.7 = 70% quality

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Convert blob to File with .jpg extension
                        const originalName = file.name || 'compressed-logo.jpg';
                        const fileName = originalName.replace(/\.(png|gif|webp)$/i, '.jpg');
                        const compressedFile = new File([blob], fileName, { type: outputType });
                        resolve(compressedFile);
                    }, outputType, outputQuality);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Submit quote request with file uploads
     * @param {Object} quoteData - Quote data object
     * @param {Object} quoteData.customer - Customer details { fullName, company, phone, email, address }
     * @param {Object} quoteData.product - Product details { name, code, selectedColorName, quantity, price, sizes }
     * @param {Array} quoteData.basket - Basket items array
     * @param {Array} quoteData.customizations - Customizations array (may contain logoFile or logoData)
     * @param {Object} [quoteData.logoFiles] - Optional object mapping position to File objects { position: File }
     * @returns {Promise<Object>} - { success: boolean, message: string }
     */
    async function submitQuote(quoteData) {
        const url = `${BASE_URL}/api/quotes`;

        // Log the current origin for CORS debugging
        debugLog('🌐 [BrandedAPI] Current origin:', window.location.origin, 'Target URL:', url);

        debugLog('📧 [BrandedAPI] Submitting quote:', {
            endpoint: '/api/quotes',
            fullUrl: url,
            customer: quoteData.customer?.fullName || 'N/A',
            hasLogoFiles: !!quoteData.logoFiles,
            logoFilesKeys: quoteData.logoFiles ? Object.keys(quoteData.logoFiles) : [],
            timestamp: new Date().toISOString()
        });

        // DEBUG: Log logo files details
        if (quoteData.logoFiles) {
            Object.entries(quoteData.logoFiles).forEach(([position, file]) => {
                debugLog(`🖼️ [BrandedAPI] Logo file for "${position}":`, {
                    isFile: file instanceof File,
                    isBlob: file instanceof Blob,
                    name: file?.name,
                    type: file?.type,
                    size: file?.size
                });
            });
        }

        try {
            // Check if we have logo files to upload
            const hasLogoFiles = quoteData.logoFiles && Object.keys(quoteData.logoFiles).length > 0;

            // If we have logo files, use FormData; otherwise use JSON
            if (hasLogoFiles) {
                const formData = new FormData();

                // Add all quote data as JSON string (except logoFiles)
                // Also remove any logoData from customizations to avoid sending base64 in JSON
                const { logoFiles, ...dataWithoutFiles } = quoteData;

                // Clean customizations to ensure no logoData/previewImage base64 is included
                if (dataWithoutFiles.customizations && Array.isArray(dataWithoutFiles.customizations)) {
                    dataWithoutFiles.customizations = dataWithoutFiles.customizations.map(c => {
                        const { logoData, logoUrl, ...cleanCustomization } = c;
                        // Strip previewImage if it's a data URL (sent via files instead)
                        if (cleanCustomization.previewImage && /^data:/i.test(cleanCustomization.previewImage)) {
                            delete cleanCustomization.previewImage;
                        }
                        return cleanCustomization;
                    });
                }

                // Clean basket items to strip any embedded base64 data
                if (dataWithoutFiles.basket && Array.isArray(dataWithoutFiles.basket)) {
                    dataWithoutFiles.basket = dataWithoutFiles.basket.map(item => {
                        const clean = { ...item };
                        if (clean.previewImage && /^data:/i.test(clean.previewImage)) delete clean.previewImage;
                        if (clean.image && /^data:/i.test(clean.image)) delete clean.image;
                        return clean;
                    });
                }

                // Strip top-level previewImage/previewImages if they contain base64
                if (dataWithoutFiles.previewImage && /^data:/i.test(dataWithoutFiles.previewImage)) {
                    delete dataWithoutFiles.previewImage;
                }
                if (Array.isArray(dataWithoutFiles.previewImages)) {
                    dataWithoutFiles.previewImages = dataWithoutFiles.previewImages.filter(p => !p || !/^data:/i.test(p));
                    if (!dataWithoutFiles.previewImages.length) delete dataWithoutFiles.previewImages;
                }

                const quoteDataJson = JSON.stringify(dataWithoutFiles);
                const quoteDataSize = new Blob([quoteDataJson]).size;
                debugLog(`📋 [BrandedAPI] quoteData JSON size: ${(quoteDataSize / 1024).toFixed(2)}KB`);

                // Warn if quoteData is unusually large (might indicate logo data is included)
                if (quoteDataSize > 100 * 1024) { // >100KB
                    debugWarn(`⚠️ [BrandedAPI] quoteData JSON is large (${(quoteDataSize / 1024).toFixed(2)}KB). Checking for logo data...`);
                    if (quoteDataJson.includes('data:image')) {
                        console.error('❌ [BrandedAPI] ERROR: quoteData JSON contains base64 image data! This should not happen.');
                    }
                }

                formData.append('quoteData', quoteDataJson);

                // Add logo files with position names (no compression - try original files first)
                debugLog(`🔍 [BrandedAPI] Processing ${Object.keys(logoFiles).length} logo files for FormData`);

                // Track total file size and individual file sizes for error detection
                let totalFileSize = 0;
                const fileSizes = {};

                // Process files - compress if >1.5MB to avoid proxy/CDN limits
                for (const [position, file] of Object.entries(logoFiles)) {
                    // Map frontend position code to backend slug
                    const positionSlug = mapPositionToBackendSlug(position);
                    const formDataKey = `logo_${positionSlug}`;

                    let fileToUpload = file;

                    if (file instanceof File || file instanceof Blob) {
                        // Compress if file is >1.5MB (likely to hit 2MB proxy limit with multipart overhead)
                        if (file.size > 1.5 * 1024 * 1024) {
                            try {
                                debugLog(`🗜️ [BrandedAPI] File "${formDataKey}" is ${(file.size / 1024 / 1024).toFixed(2)}MB - compressing to avoid proxy limit...`);
                                fileToUpload = await compressImageFile(file, 0.7, 1200);
                                const reductionPercent = ((1 - fileToUpload.size / file.size) * 100).toFixed(1);
                                debugLog(`✅ [BrandedAPI] Compressed to ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB (${reductionPercent}% reduction)`);
                            } catch (compressErr) {
                                debugWarn(`⚠️ [BrandedAPI] Compression failed, using original:`, compressErr);
                                fileToUpload = file;
                            }
                        }

                        formData.append(
                            formDataKey,
                            fileToUpload,
                            buildUploadFileName(`logo-${positionSlug}`, fileToUpload.type, fileToUpload.name || '')
                        );
                        fileSizes[position] = fileToUpload.size;
                        totalFileSize += fileToUpload.size;
                        debugLog(`📎 [BrandedAPI] Added file to FormData: "${formDataKey}" (${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB)`);
                    } else if (typeof file === 'string' && file.startsWith('data:')) {
                        // Convert base64 data URL to Blob
                        const blob = base64ToBlob(file, `logo-${positionSlug}.png`);

                        // Compress if blob is >1.5MB
                        if (blob.size > 1.5 * 1024 * 1024) {
                            try {
                                debugLog(`🗜️ [BrandedAPI] Base64 image "${formDataKey}" is ${(blob.size / 1024 / 1024).toFixed(2)}MB - compressing...`);
                                fileToUpload = await compressImageFile(blob, 0.7, 1200);
                                const reductionPercent = ((1 - fileToUpload.size / blob.size) * 100).toFixed(1);
                                debugLog(`✅ [BrandedAPI] Compressed to ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB (${reductionPercent}% reduction)`);
                            } catch (compressErr) {
                                debugWarn(`⚠️ [BrandedAPI] Compression failed, using original:`, compressErr);
                                fileToUpload = blob;
                            }
                        } else {
                            fileToUpload = blob;
                        }

                        formData.append(
                            formDataKey,
                            fileToUpload,
                            buildUploadFileName(`logo-${positionSlug}`, fileToUpload.type, fileToUpload.name || '')
                        );
                        fileSizes[position] = fileToUpload.size;
                        totalFileSize += fileToUpload.size;
                        debugLog(`📎 [BrandedAPI] Converted base64 to Blob and added to FormData: "${formDataKey}" (${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB)`);
                    }
                }

                debugLog(`📊 [BrandedAPI] Total file size: ${(totalFileSize / 1024 / 1024).toFixed(2)}MB`);


                // Try request first without compression
                let response;
                let needsCompression = false;
                const fetchStartTime = Date.now(); // Move outside try block so it's accessible in catch

                try {

                    // Log exact FormData contents for debugging
                    debugLog('📤 [BrandedAPI] FormData contents:');
                    for (const [key, value] of formData.entries()) {
                        if (value instanceof File || value instanceof Blob) {
                            debugLog(`  - ${key}: File (${(value.size / 1024 / 1024).toFixed(2)}MB, ${value.type || 'no type'})`);
                        } else {
                            const strValue = String(value);
                            debugLog(`  - ${key}: ${strValue.length > 200 ? strValue.substring(0, 200) + '...' : strValue}`);
                        }
                    }


                    response = await fetch(url, {
                        method: 'POST',
                        body: formData
                        // Removed mode and credentials - let browser use defaults
                        // Note: Don't set Content-Type header - browser will set it with boundary
                    });

                    const fetchEndTime = Date.now();
                    const fetchDuration = fetchEndTime - fetchStartTime;


                    // Check if we got a 413 error (Request Entity Too Large)
                    if (response.status === 413) {
                        debugWarn('⚠️ [BrandedAPI] Received 413 error - file too large. Retrying with compression...');
                        needsCompression = true;
                    }
                } catch (fetchErr) {
                    // Log full error details for debugging
                    const errorDetails = {
                        message: fetchErr.message,
                        name: fetchErr.name,
                        stack: fetchErr.stack,
                        toString: fetchErr.toString(),
                        // Try to get more error info
                        cause: fetchErr.cause,
                        // Check if it's a network error
                        isNetworkError: fetchErr.message === 'Failed to fetch' || fetchErr.name === 'TypeError'
                    };

                    console.error('❌ [BrandedAPI] Fetch error details:', errorDetails);

                    // Check network timing - if it fails very quickly, might be CORS preflight failure
                    const fetchDuration = Date.now() - fetchStartTime;
                    const isQuickFailure = fetchDuration < 100; // Less than 100ms suggests preflight failure


                    // Check if error message indicates 413 (browser might show it in error message or stack)
                    const errorStr = JSON.stringify(errorDetails) + ' ' + (fetchErr.message || '') + ' ' + (fetchErr.stack || '');
                    const is413Error = errorStr.includes('413') || errorStr.includes('Request Entity Too Large') || errorStr.includes('ERR_FAILED 413');

                    // Also check if file size is very large (>1.5MB) - likely to cause 413 errors
                    // This is a heuristic: if fetch fails with large files, it's likely a 413 error
                    const isLargeFile = totalFileSize > 1.5 * 1024 * 1024; // 1.5MB

                    // Calculate estimated total request size (files + JSON + multipart overhead ~10%)
                    const estimatedRequestSize = (totalFileSize + quoteDataSize) * 1.1;

                    if (is413Error || (isLargeFile && fetchErr.message === 'Failed to fetch')) {
                        debugWarn(`⚠️ [BrandedAPI] ${is413Error ? '413 error' : 'Large file'} detected. Estimated request size: ${(estimatedRequestSize / 1024 / 1024).toFixed(2)}MB. Retrying with compression...`);
                        needsCompression = true;
                    } else {
                        throw fetchErr;
                    }
                }

                // If we got 413, retry with compression
                if (needsCompression) {
                    debugLog('🗜️ [BrandedAPI] Retrying with compressed files...');
                    const compressedFormData = new FormData();
                    compressedFormData.append('quoteData', JSON.stringify(dataWithoutFiles));

                    // Compress and add files
                    for (const [position, file] of Object.entries(logoFiles)) {
                        const positionSlug = mapPositionToBackendSlug(position);
                        const formDataKey = `logo_${positionSlug}`;

                        let fileToUpload = file;

                        if (file instanceof File || file instanceof Blob) {
                            try {
                                debugLog(`🗜️ [BrandedAPI] Compressing file "${formDataKey}" (${(file.size / 1024).toFixed(2)}KB)`);
                                const originalSize = file.size;
                                // Use aggressive compression: 0.7 quality, 1200px max width, convert to JPEG
                                fileToUpload = await compressImageFile(file, 0.7, 1200);
                                const compressedSize = fileToUpload.size;
                                const reductionPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
                                debugLog(`✅ [BrandedAPI] Compressed to ${(compressedSize / 1024).toFixed(2)}KB (${reductionPercent}% reduction)`);
                            } catch (compressErr) {
                                debugWarn(`⚠️ [BrandedAPI] Compression failed, using original:`, compressErr);
                                fileToUpload = file;
                            }
                            compressedFormData.append(
                                formDataKey,
                                fileToUpload,
                                buildUploadFileName(`logo-${positionSlug}`, fileToUpload.type, fileToUpload.name || '')
                            );
                        } else if (typeof file === 'string' && file.startsWith('data:')) {
                            const blob = base64ToBlob(file, `logo-${positionSlug}.png`);
                            try {
                                debugLog(`🗜️ [BrandedAPI] Compressing base64 image "${formDataKey}" (${(blob.size / 1024).toFixed(2)}KB)`);
                                const originalSize = blob.size;
                                // Use aggressive compression: 0.7 quality, 1200px max width, convert to JPEG
                                fileToUpload = await compressImageFile(blob, 0.7, 1200);
                                const compressedSize = fileToUpload.size;
                                const reductionPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
                                debugLog(`✅ [BrandedAPI] Compressed to ${(compressedSize / 1024).toFixed(2)}KB (${reductionPercent}% reduction)`);
                            } catch (compressErr) {
                                debugWarn(`⚠️ [BrandedAPI] Compression failed, using original:`, compressErr);
                                fileToUpload = blob;
                            }
                            compressedFormData.append(
                                formDataKey,
                                fileToUpload,
                                buildUploadFileName(`logo-${positionSlug}`, fileToUpload.type, fileToUpload.name || '')
                            );
                        }
                    }

                    // Calculate compressed total size
                    let compressedTotalSize = quoteDataSize;
                    for (const [key, value] of compressedFormData.entries()) {
                        if (value instanceof File || value instanceof Blob) {
                            compressedTotalSize += value.size;
                        }
                    }

                    // Retry with compressed files

                    debugLog(`🔄 [BrandedAPI] Retrying with compressed files. Original: ${(totalFileSize / 1024 / 1024).toFixed(2)}MB, Compressed: ${(compressedTotalSize / 1024 / 1024).toFixed(2)}MB`);

                    const retryStartTime = Date.now();

                    try {
                        response = await fetch(url, {
                            method: 'POST',
                            body: compressedFormData
                            // Removed mode and credentials - let browser use defaults
                        });

                        const retryEndTime = Date.now();
                        const retryDuration = retryEndTime - retryStartTime;

                    } catch (retryErr) {
                        const retryEndTime = Date.now();
                        const retryDuration = retryEndTime - retryStartTime;
                        console.error('❌ [BrandedAPI] Compressed retry also failed:', retryErr);
                        throw retryErr;
                    }
                }


                debugLog('📡 [BrandedAPI] Quote response (with files):', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    timestamp: new Date().toISOString()
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const data = await response.json();
                debugLog('✅ [BrandedAPI] Quote submitted successfully (with files):', {
                    success: data.success,
                    message: data.message,
                    timestamp: new Date().toISOString()
                });

                return data;
            } else {
                // No files - use JSON (backward compatibility)
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(quoteData)
                });

                debugLog('📡 [BrandedAPI] Quote response (JSON):', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    timestamp: new Date().toISOString()
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const data = await response.json();
                debugLog('✅ [BrandedAPI] Quote submitted successfully (JSON):', {
                    success: data.success,
                    message: data.message,
                    timestamp: new Date().toISOString()
                });

                return data;
            }
        } catch (error) {
            console.error('❌ [BrandedAPI] Quote submission error:', {
                message: error.message,
                url: url,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Submit contact form (Get in Touch)
     * @param {Object} contactData - Contact form data
     * @param {string} contactData.name - Contact name (required)
     * @param {string} contactData.email - Contact email (required)
     * @param {string} contactData.interest - What they're interested in (required)
     * @param {string} [contactData.phone] - Phone number (optional)
     * @param {string} [contactData.address] - Address (optional, desktop only)
     * @param {string} [contactData.postCode] - Post code (optional, desktop only)
     * @param {string} contactData.message - Message (required)
     * @returns {Promise<Object>} API response
     */
    async function submitContactForm(contactData) {
        const url = `${BASE_URL}/api/contact`;

        debugLog('📧 [BrandedAPI] Submitting contact form:', {
            endpoint: '/api/contact',
            fullUrl: url,
            name: contactData.name || 'N/A',
            email: contactData.email || 'N/A',
            interest: contactData.interest || 'N/A',
            timestamp: new Date().toISOString()
        });

        // Log the full payload being sent
        debugLog('📦 [BrandedAPI] Contact form payload:', JSON.stringify(contactData, null, 2));


        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify(contactData)
            });


            debugLog('📡 [BrandedAPI] Contact form response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                timestamp: new Date().toISOString()
            });

            if (!response.ok) {
                // Read response body once - try JSON first, fallback to text
                let errorDetails = '';
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await response.json();
                        errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
                        console.error('❌ [BrandedAPI] Contact form error response:', errorData);

                        // Extract specific validation errors if available
                        if (errorData.errors && typeof errorData.errors === 'object') {
                            const validationErrors = Object.entries(errorData.errors)
                                .map(([field, msg]) => field.charAt(0).toUpperCase() + field.slice(1) + ': ' + msg)
                                .join('\n');
                            errorDetails = validationErrors || errorDetails;
                        }
                    } catch (e) {
                        console.error('❌ [BrandedAPI] Failed to parse error as JSON:', e);
                        errorDetails = 'Invalid JSON response';
                    }
                } else {
                    try {
                        const errorText = await response.text();
                        errorDetails = errorText;
                        console.error('❌ [BrandedAPI] Contact form error text:', errorText);
                    } catch (textError) {
                        errorDetails = 'Unknown error';
                        console.error('❌ [BrandedAPI] Could not read error response:', textError);
                    }
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}${errorDetails ? ' - ' + errorDetails : ''}`);
            }

            const data = await response.json();
            debugLog('✅ [BrandedAPI] Contact form submitted successfully:', {
                success: data.success,
                message: data.message,
                timestamp: new Date().toISOString()
            });

            return data;
        } catch (error) {
            console.error('❌ [BrandedAPI] Contact form submission error:', {
                message: error.message,
                url: url,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    // ==========================================================================
    // EXPOSE PUBLIC API
    // ==========================================================================

    return {
        // Core methods
        getProducts,
        getProductByCode,
        getRelatedProducts,

        // Filter methods
        getProductTypes,
        getFilterCounts,
        getPriceRange,
        getAllFilterOptions,

        // Utilities
        healthCheck,
        clearCache,
        mapCategoryToProductType,
        transformProduct,

        // Quote submission
        submitQuote,

        // Contact form submission
        submitContactForm,

        // Constants
        BASE_URL,
        DEFAULT_LIMIT,
        MAX_LIMIT,
        CATEGORY_SLUG_MAP
    };
})();

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrandedAPI;
}

// Explicitly expose to window for browser access
if (typeof window !== 'undefined') {
    window.BrandedAPI = BrandedAPI;
    if (window.BRANDED_DEBUG === true) { console.debug('[BrandedAPI] Module loaded successfully. submitQuote available:', typeof BrandedAPI.submitQuote === 'function'); }
}

