// Product Types Menu - Dynamic Dropdown Population
(function() {
    'use strict';

    const BASE_URL = 'https://api.brandeduk.com';
    const API_BASE = `${BASE_URL}/api/filters/product-types`;
    
    // Cache for product types
    let productTypesCache = null;
    
    /**
     * Fetch product types from API
     */
    async function fetchProductTypes() {
        if (productTypesCache) {
            console.log('📦 Using cached product types');
            return productTypesCache;
        }
        
        try {
            console.log('🔄 Fetching product types from:', API_BASE);
            const response = await fetch(API_BASE);
            
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
            
            // Generate slugs from names if not present
            productTypes = productTypes.map(type => {
                if (!type.slug && type.name) {
                    type.slug = type.name
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '');
                }
                return type;
            });
            
            console.log(`✅ Parsed ${productTypes.length} product types`);
            productTypesCache = productTypes;
            return productTypes;
        } catch (error) {
            console.error('❌ Error fetching product types:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                url: API_BASE
            });
            return [];
        }
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
        // ALWAYS use clean absolute path
        return '/shop';
    }
    
    /**
     * Generate HTML for product types dropdown
     */
    function generateDropdownHTML(productTypes) {
        const { grouped, sortedLetters } = groupByAlphabet(productTypes);
        const shopUrl = getShopPageUrl();
        let html = '';
        
        sortedLetters.forEach(letter => {
            html += `<li class="brand-heading">${letter}</li>`;
            grouped[letter].forEach(type => {
                // Use correct path based on current page location
                const href = `${shopUrl}/productType/${encodeURIComponent(type.slug)}`;
                html += `<li><a href="${href}" data-slug="${type.slug}">${type.name}</a></li>`;
            });
        });
        
        return html;
    }
    
    /**
     * Populate the dropdown menu
     */
    async function populateProductTypesMenu() {
        const menuContainer = document.querySelector('.nav-megamenu.brand-grid');
        if (!menuContainer) {
            console.warn('⚠️ Product types menu container not found (.nav-megamenu.brand-grid)');
            return;
        }
        
        console.log('🎯 Found menu container, starting population...');
        
        // Show loading state
        menuContainer.innerHTML = '<li style="padding: 20px; text-align: center; color: #6b7280;">Loading...</li>';
        
        try {
            const productTypes = await fetchProductTypes();
            
            console.log(`📊 Product types received: ${productTypes.length} items`);
            
            if (!productTypes || productTypes.length === 0) {
                console.warn('⚠️ No product types available');
                menuContainer.innerHTML = '<li style="padding: 20px; text-align: center; color: #6b7280;">No product types available. Check console for details.</li>';
                return;
            }
            
            // Log first few items to debug structure
            if (productTypes.length > 0) {
                console.log('📋 Sample product type:', productTypes[0]);
            }
            
            // Generate and insert HTML
            const html = generateDropdownHTML(productTypes);
            console.log(`✅ Generated HTML for ${productTypes.length} product types`);
            menuContainer.innerHTML = html;
            
            // Add click handlers for navigation
            const links = menuContainer.querySelectorAll('a[data-slug]');
            console.log(`🔗 Added ${links.length} click handlers`);
            
            links.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const slug = this.getAttribute('data-slug');
                    if (slug) {
                        const shopUrl = getShopPageUrl();
                        const targetUrl = `${shopUrl}/productType/${encodeURIComponent(slug)}`;                        console.log('🔗 Navigating to shop with productType:', slug, '→', targetUrl);
                        // Navigate to shop page with product type filter
                        window.location.href = targetUrl;
                    }
                });
            });
            
        } catch (error) {
            console.error('❌ Error populating product types menu:', error);
            menuContainer.innerHTML = '<li style="padding: 20px; text-align: center; color: #ef4444;">Error loading product types. Check console for details.</li>';
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

