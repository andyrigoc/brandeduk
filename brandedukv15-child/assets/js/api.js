/**
 * BrandedUK API Service Module
 * Handles all API calls to the backend
 * Base URL: https://api.brandeduk.com
 */

const BrandedAPI = (function() {
    'use strict';

    // ==========================================================================
    // CONFIGURATION
    // ==========================================================================
    
    const BASE_URL = 'https://api.brandeduk.com';
    const DEFAULT_LIMIT = 24;
    const MAX_LIMIT = 200;

    // Cache for filter options (loaded once)
    let filterOptionsCache = null;
    let productTypesCache = null;

    // ==========================================================================
    // SLUG MAPPING - Frontend URL params to API params
    // ==========================================================================

    const CATEGORY_SLUG_MAP = {
        // Frontend category → API productType slug
        'all': null,
        'tshirts': 't-shirts',
        't-shirt': 't-shirts',
        't-shirts': 't-shirts',
        'tees': 't-shirts',
        'polo': 'polos',
        'polo-shirts': 'polos',
        'fleeces': 'fleece',
        'hivis': 'safety-vests',
        'hi-vis': 'safety-vests',
        'hi-viz': 'safety-vests',
        'headwear': 'hats',
        'sustainable': null, // Special filter - organic/recycled
        'workwear': null, // Special - multiple types
        
        // Direct matches
        'hoodies': 'hoodies',
        'jackets': 'jackets',
        'caps': 'caps',
        'beanies': 'beanies',
        'trousers': 'trousers',
        'aprons': 'aprons',
        'sweatshirts': 'sweatshirts',
        'softshells': 'softshells',
        'shorts': 'shorts',
        'shirts': 'shirts',
        'bags': 'bags',
        'gilets': 'gilets-&-body-warmers',
        'fleece': 'fleece',
        'towels': 'towels',
        'gloves': 'gloves',
        'hats': 'hats',
        'boots': 'boots',
        'trainers': 'trainers',
        'leggings': 'leggings',
        'sweatpants': 'sweatpants',
        'scarves': 'scarves',
        'socks': 'socks'
    };

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
        
        console.log('🌐 [BrandedAPI] Making API Request:', {
            method: 'GET',
            endpoint: endpoint,
            fullUrl: url,
            params: params,
            timestamp: new Date().toISOString()
        });
        
        try {
            const response = await fetch(url, fetchOptions);
            
            console.log('📡 [BrandedAPI] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                timestamp: new Date().toISOString()
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ [BrandedAPI] Response data:', { 
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

    /**
     * Transform API product to frontend format
     */
    function transformProduct(apiProduct) {
        // Handle colors - API returns array of color objects
        const colors = (apiProduct.colors || []).map(color => {
            if (typeof color === 'string') {
                return { name: color, main: apiProduct.image };
            }
            return {
                name: color.name || color.colour_name || 'Default',
                main: color.main || color.image_url || apiProduct.image,
                thumb: color.thumb || color.thumbnail || null
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

        return {
            code: apiProduct.code || apiProduct.style_code || '',
            name: apiProduct.name || apiProduct.product_name || '',
            price: price,
            priceBreaks: priceBreaks,
            category: apiProduct.product_type || apiProduct.category || '',
            image: apiProduct.image || apiProduct.main_image || '',
            colors: colors,
            sizes: apiProduct.sizes || [],
            customization: customization,
            brand: apiProduct.brand || apiProduct.brand_name || '',
            // Additional fields from API
            description: apiProduct.description || '',
            fabric: apiProduct.fabric || '',
            weight: apiProduct.weight || '',
            fit: apiProduct.fit || '',
            gender: apiProduct.gender || '',
            ageGroup: apiProduct.age_group || apiProduct.ageGroup || ''
        };
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
            params.q = options.q || options.search;
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
        // brand[]: ['adidas', 'B&C Collection']
        const arrayParamNames = [
            'gender[]', 'ageGroup[]', 'sleeve[]', 'neckline[]', 'accreditations[]',
            'primaryColour[]', 'colourShade[]', 'style[]', 'feature[]', 'size[]',
            'fabric[]', 'weight[]', 'fit[]', 'sector[]', 'sport[]', 'tag[]',
            'effect[]', 'cmyk[]', 'pantone[]', 'flag[]', 'brand[]'
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

        const fetchOptions = options.signal ? { signal: options.signal } : {};
        const response = await apiRequest('/api/products', params, fetchOptions);

        return {
            items: (response.items || []).map(transformProduct),
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

        console.log('🔍 [BrandedAPI] Fetching filter counts from /api/products with params:', params);
        
        const response = await apiRequest('/api/products', params);
        
        console.log('📊 [BrandedAPI] Filter counts response:', {
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
     * Submit quote request
     * @param {Object} quoteData - Quote data object
     * @param {Object} quoteData.customer - Customer details { fullName, company, phone, email, address }
     * @param {Object} quoteData.product - Product details { name, code, selectedColorName, quantity, price, sizes }
     * @param {Array} quoteData.basket - Basket items array
     * @param {Array} quoteData.customizations - Customizations array
     * @returns {Promise<Object>} - { success: boolean, message: string }
     */
    async function submitQuote(quoteData) {
        const url = `${BASE_URL}/api/quotes`;
        
        console.log('📧 [BrandedAPI] Submitting quote:', {
            endpoint: '/api/quotes',
            fullUrl: url,
            customer: quoteData.customer?.fullName || 'N/A',
            timestamp: new Date().toISOString()
        });
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(quoteData)
            });
            
            console.log('📡 [BrandedAPI] Quote response:', {
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
            console.log('✅ [BrandedAPI] Quote submitted successfully:', {
                success: data.success,
                message: data.message,
                timestamp: new Date().toISOString()
            });
            
            return data;
        } catch (error) {
            console.error('❌ [BrandedAPI] Quote submission error:', {
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

