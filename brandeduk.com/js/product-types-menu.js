// Product Types Menu - Dynamic Dropdown Population
(function() {
    'use strict';

    function resolveApiBase() {
        if (typeof window.resolveBrandedApiBase === 'function') {
            return String(window.resolveBrandedApiBase()).replace(/\/+$/, '');
        }
        if (window.API_BASE_URL) {
            return String(window.API_BASE_URL).replace(/\/+$/, '');
        }
        return 'https://api.brandeduk.com';
    }

    const scriptElement = document.currentScript;
    const SHOP_PAGE_URL = scriptElement && scriptElement.src
        ? new URL('../../shop-pc.html', scriptElement.src).href
        : 'shop-pc.html';
    
    // Cache for product types
    let productTypesCache = null;

    function slugifyName(name) {
        return String(name || '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function normalizeProductTypes(list) {
        return (list || []).map(function (type) {
            if (typeof type === 'string') {
                return { name: type, slug: slugifyName(type) };
            }
            var name = type.name || type.title || type.productType || '';
            var slug = type.slug || type.id || slugifyName(name);
            return Object.assign({}, type, { name: name, slug: slug });
        }).filter(function (type) {
            return !!type.name;
        });
    }

    function getFallbackProductTypes() {
        var configTypes = window.BrandedConfig && Array.isArray(window.BrandedConfig.PRODUCT_TYPES)
            ? window.BrandedConfig.PRODUCT_TYPES
            : [];
        return normalizeProductTypes(configTypes);
    }
    
    /**
     * Fetch product types from API
     */
    async function fetchProductTypes() {
        if (productTypesCache) {
            console.log('📦 Using cached product types');
            return productTypesCache;
        }

        var API_BASE = resolveApiBase() + '/api/filters/product-types';
        
        try {
            const apiUrl = `${resolveApiBase()}/api/filters/product-types`;
            console.log('🔄 Fetching product types from:', apiUrl);
            const response = await fetch(apiUrl);
            
            console.log('📡 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📦 Raw API response:', data);
            
            // Handle different response formats
            let productTypes = [];
            
            if (Array.isArray(data)) {
                // Direct array response
                productTypes = data;
            } else if (data.productTypes && Array.isArray(data.productTypes)) {
                // Response with productTypes property (main format)
                productTypes = data.productTypes;
            } else if (data.items && Array.isArray(data.items)) {
                // Response with items property
                productTypes = data.items;
            } else if (data.data && Array.isArray(data.data)) {
                // Response with data property
                productTypes = data.data;
            } else {
                console.warn('⚠️ Unexpected response format:', data);
            }
            
            productTypes = normalizeProductTypes(productTypes);
            
            console.log(`✅ Parsed ${productTypes.length} product types`);
            if (productTypes.length) {
                productTypesCache = productTypes;
                return productTypes;
            }
        } catch (error) {
            console.error('❌ Error fetching product types:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                url: `${resolveApiBase()}/api/filters/product-types`
            });
        }

        var fallback = getFallbackProductTypes();
        if (fallback.length) {
            console.warn('⚠️ Using BrandedConfig.PRODUCT_TYPES fallback (' + fallback.length + ' items)');
            productTypesCache = fallback;
            return fallback;
        }
        return [];
    }
    
    /**
     * Group product types by first letter (alphabetically)
     */
    function groupByAlphabet(productTypes) {
        const grouped = {};
        
        productTypes.forEach(type => {
            // Handle different possible field names: name, title, productType, etc.
            const name = type.name || type.title || type.productType || '';
            const slug = type.slug || type.id || '';
            
            if (!name) return; // Skip if no name
            
            const firstLetter = name.charAt(0).toUpperCase();
            const letter = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
            
            if (!grouped[letter]) {
                grouped[letter] = [];
            }
            
            grouped[letter].push({
                name: name,
                slug: slug
            });
        });
        
        // Sort each group alphabetically
        Object.keys(grouped).forEach(letter => {
            grouped[letter].sort((a, b) => a.name.localeCompare(b.name));
        });
        
        // Sort letters
        const sortedLetters = Object.keys(grouped).sort((a, b) => {
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b);
        });
        
        return { grouped, sortedLetters };
    }
    
    /**
     * Get the correct shop page URL based on current page location
     */
    function getShopPageUrl() {
        return SHOP_PAGE_URL;
    }
    
    /**
     * Generate HTML for product types dropdown
     */
    function generateDropdownHTML(productTypes) {
        const { grouped, sortedLetters } = groupByAlphabet(productTypes);
        const shopUrl = getShopPageUrl();
        let html = '<li class="allprod-view-all"><a href="' + shopUrl + '">View all products</a></li>';
        
        sortedLetters.forEach(letter => {
            html += `<li class="brand-heading">${letter}</li>`;
            grouped[letter].forEach(type => {
                // Use correct path based on current page location
                const href = `${shopUrl}?productType=${encodeURIComponent(type.slug)}`;
                html += `<li><a href="${href}" data-slug="${type.slug}">${type.name}</a></li>`;
            });
        });
        
        return html;
    }

    function bindMenuLinks(menuContainer) {
        const links = menuContainer.querySelectorAll('a[data-slug]');
        console.log(`🔗 Added ${links.length} click handlers`);
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const slug = this.getAttribute('data-slug');
                if (slug) {
                    const shopUrl = getShopPageUrl();
                    const targetUrl = `${shopUrl}?productType=${encodeURIComponent(slug)}`;
                    console.log('🔗 Navigating to shop with productType:', slug, '→', targetUrl);
                    window.location.href = targetUrl;
                }
            });
        });
    }
    
    /**
     * Populate the dropdown menu
     */
    async function populateProductTypesMenu() {
        // Product categories and brands are separate menus. The previous generic
        // selector matched the Brands panel and replaced its contents.
        const menuContainer = document.querySelector('[data-product-types-menu]');
        if (!menuContainer) {
            console.warn('⚠️ Product types menu container not found ([data-product-types-menu])');
            return;
        }

        const hadStaticItems = menuContainer.children.length > 0;
        console.log('🎯 Found menu container, starting population...');
        
        // Keep any static template items visible until we have a replacement list.
        if (!hadStaticItems) {
            menuContainer.innerHTML = '<li style="padding: 20px; text-align: center; color: #6b7280;">Loading...</li>';
        }
        
        try {
            const productTypes = await fetchProductTypes();
            
            console.log(`📊 Product types received: ${productTypes.length} items`);
            
            // Debug: Check if T-shirts is in the list
            const tshirts = productTypes.find(t => t.name && t.name.toLowerCase().includes('t-shirt'));
            console.log('🔍 T-shirts in API response:', tshirts);
            
            if (!productTypes || productTypes.length === 0) {
                console.warn('⚠️ No product types available');
                if (!hadStaticItems) {
                    menuContainer.innerHTML = '<li style="padding: 20px; text-align: center; color: #6b7280;">No product types available. Check console for details.</li>';
                }
                return;
            }
            
            // Log first few items to debug structure
            if (productTypes.length > 0) {
                console.log('📋 Sample product type:', productTypes[0]);
            }
            
            // Generate and insert HTML
            const html = generateDropdownHTML(productTypes);
            console.log(`✅ Generated HTML for ${productTypes.length} product types`);
            
            // Debug: Check if T-shirts is in the generated HTML
            console.log('🔍 T-shirts in HTML:', html.includes('T-shirts') || html.includes('tshirts'));
            
            menuContainer.innerHTML = html;
            bindMenuLinks(menuContainer);
            
        } catch (error) {
            console.error('❌ Error populating product types menu:', error);
            if (!hadStaticItems) {
                menuContainer.innerHTML = '<li style="padding: 20px; text-align: center; color: #ef4444;">Error loading product types. Check console for details.</li>';
            }
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', populateProductTypesMenu);
    } else {
        populateProductTypesMenu();
    }
    
    // Export for manual refresh if needed
    window.refreshProductTypesMenu = populateProductTypesMenu;
})();
