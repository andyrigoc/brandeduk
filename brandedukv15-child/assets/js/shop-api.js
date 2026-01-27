/**
 * BrandedUK Shop Page - API Integration
 * Handles product listing, filtering, pagination, and search
 * Requires: api.js to be loaded first
 */

const ShopManager = (function() {
    'use strict';

    // ==========================================================================
    // STATE
    // ==========================================================================

    let currentState = {
        page: 1,
        limit: 24,
        total: 0,
        category: 'all',
        search: '',
        priceMin: null,
        priceMax: null,
        sort: 'newest',
        // Variant-driven color filter (API param: color=black)
        color: '',
        filters: {
            gender: [],
            ageGroup: [],
            sleeve: [],
            neckline: [],
            fabric: [],
            size: [],
            primaryColour: [],
            colourShade: [],
            style: [],
            tag: [],
            weight: [],
            fit: [],
            sector: [],
            sport: [],
            effect: [],
            accreditations: [],
            features: []
        }
    };

    let isLoading = false;
    let productsGrid = null;
    let loadingOverlay = null;

    // Abort/cancel in-flight product fetches
    let activeProductsAbortController = null;
    let colorDebounceTimer = null;
    const COLOR_DEBOUNCE_MS = 300;

    // Category title mappings
    const CATEGORY_TITLES = {
        'all': 'All Products',
        'tshirts': 'T-Shirts',
        't-shirts': 'T-Shirts',
        'polo': 'Polo Shirts',
        'polos': 'Polo Shirts',
        'hoodies': 'Hoodies & Sweatshirts',
        'jackets': 'Jackets & Softshell',
        'hivis': 'Hi-Viz',
        'safety-vests': 'Hi-Viz',
        'trousers': 'Work Trousers',
        'fleeces': 'Fleeces',
        'fleece': 'Fleece',
        'bags': 'Bags',
        'caps': 'Caps',
        'beanies': 'Beanies',
        'headwear': 'Headwear / Accessories',
        'hats': 'Hats',
        'aprons': 'Aprons',
        'sustainable': 'Sustainable / Recycled & Organic',
        'workwear': 'Workwear',
        'sweatshirts': 'Sweatshirts',
        'softshells': 'Softshell Jackets',
        'shorts': 'Shorts',
        'shirts': 'Shirts',
        'gilets': 'Gilets & Body Warmers',
        'gilets-&-body-warmers': 'Gilets & Body Warmers'
    };

    // ==========================================================================
    // VAT & PRICE FORMATTING
    // ==========================================================================

    function formatCurrency(baseAmount) {
        const VAT_RATE = 0.20;
        let value = Number(baseAmount) || 0;
        const vatOn = localStorage.getItem('brandeduk-vat-mode') === 'on';
        if (vatOn) {
            value = value * (1 + VAT_RATE);
        }
        return '£' + value.toFixed(2);
    }

    function vatSuffix() {
        const vatOn = localStorage.getItem('brandeduk-vat-mode') === 'on';
        return vatOn ? 'inc VAT' : 'ex VAT';
    }

    function formatPriceRange(minPrice, maxPrice) {
        const minVal = Number(minPrice) || 0;
        const maxVal = Number(maxPrice) || 0;
        if (Math.abs(minVal - maxVal) < 0.005) {
            return formatCurrency(minVal);
        }
        return formatCurrency(minVal) + ' - ' + formatCurrency(maxVal);
    }

    function getProductPriceRange(product) {
        const breaks = product.priceBreaks || [];
        if (!breaks.length) {
            const base = Number(product.price) || 0;
            return { min: base, max: base };
        }
        const values = breaks.map(step => Number(step.price)).filter(price => price > 0);
        if (values.length === 0) {
            const base = Number(product.price) || 0;
            return { min: base, max: base };
        }
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    // ==========================================================================
    // UI HELPERS
    // ==========================================================================

    function showLoading() {
        isLoading = true;
        if (productsGrid) {
            productsGrid.classList.add('loading');
        }
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        // Add loading class to existing cards
        document.querySelectorAll('.product-card-shop').forEach(card => {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
        });
    }

    function hideLoading() {
        isLoading = false;
        if (productsGrid) {
            productsGrid.classList.remove('loading');
        }
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    function updatePageTitle() {
        const title = CATEGORY_TITLES[currentState.category] || 
                     CATEGORY_TITLES[currentState.category.toLowerCase()] || 
                     'Products';
        
        // Update various title elements
        const categoryTitleEl = document.getElementById('categoryTitle');
        if (categoryTitleEl) {
            categoryTitleEl.textContent = title;
        }

        const shopCategoryHeading = document.getElementById('shopCategoryHeading');
        if (shopCategoryHeading) {
            shopCategoryHeading.textContent = title;
        }

        const breadcrumbCategoryEl = document.getElementById('shopBreadcrumbCategory') || 
                                     document.getElementById('breadcrumbCategory');
        if (breadcrumbCategoryEl) {
            breadcrumbCategoryEl.textContent = title.toUpperCase();
        }
    }

    function updateResultsCount(total) {
        const resultsCountEl = document.getElementById('resultsCount');
        if (resultsCountEl) {
            resultsCountEl.textContent = `${total.toLocaleString()} items`;
        }
    }

    function updateURL() {
        const url = new URL(window.location);

        // For clean category URLs, prefer /category/:slug when category is set
        if (currentState.category && currentState.category !== 'all') {
            const cleanPath = `/category/${encodeURIComponent(currentState.category)}`;
            url.pathname = cleanPath;
            url.searchParams.delete('category');
        } else {
            // Default to /shop for "all" category
            url.pathname = '/shop';
            url.searchParams.delete('category');
        }

        // Set search
        if (currentState.search) {
            url.searchParams.set('q', currentState.search);
        } else {
            url.searchParams.delete('q');
        }

        // Set page if not 1
        if (currentState.page > 1) {
            url.searchParams.set('page', currentState.page);
        } else {
            url.searchParams.delete('page');
        }

        // Set sort if not default
        if (currentState.sort && currentState.sort !== 'newest') {
            url.searchParams.set('sort', currentState.sort);
        } else {
            url.searchParams.delete('sort');
        }

        // Set variant color filter
        if (currentState.color) {
            url.searchParams.set('color', currentState.color);
        } else {
            url.searchParams.delete('color');
        }

        window.history.replaceState({}, '', url);
    }

    // ==========================================================================
    // PRODUCT CARD RENDERING
    // ==========================================================================

    function slugifyColor(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function findColorVariant(product, colorSlug) {
        if (!colorSlug) return null;
        const colors = Array.isArray(product?.colors) ? product.colors : [];
        return colors.find(c => slugifyColor(c?.name) === colorSlug) || null;
    }

    function createProductCard(product, index) {
        const card = document.createElement('div');
        card.className = 'product-card-shop';
        card.dataset.productCode = product.code;

        // Badges
        const hasEmbroidery = product.customization.includes('embroidery');
        const hasPrint = product.customization.includes('print');
        
        let badgesHTML = '';
        if (hasEmbroidery) {
            badgesHTML += '<span class="badge embroidery">EMBROIDERY</span>';
        }
        if (hasPrint) {
            badgesHTML += '<span class="badge print">PRINT</span>';
        }

        // Colors / variant selection
        const allColors = product.colors || [];
        const activeColorSlug = currentState.color || '';
        const matchedVariant = activeColorSlug ? findColorVariant(product, activeColorSlug) : null;

        // If a color filter is active and this product has no matching variant, exclude it.
        if (activeColorSlug && !matchedVariant) {
            return null;
        }

        const displayColor = matchedVariant || allColors[0] || { name: 'Default', main: product.image };
        const displayColors = activeColorSlug ? [displayColor] : allColors.slice(0, 12);

        const colorsHTML = displayColors.map(c => {
            const imgUrl = c.main || product.image;
            const isActive = activeColorSlug ? 'active' : '';
            return `<button type="button" class="color-dot ${isActive}" data-color="${c.name}" data-main="${imgUrl}" style="background-image: url('${imgUrl}'); background-size: cover; background-position: center;" title="${c.name}"></button>`;
        }).join('');

        // More colors indicator (hide when filtered)
        const moreColorsHTML = (!activeColorSlug && allColors.length > 12)
            ? `<span class="more-colors">+${allColors.length - 12}</span>`
            : '';

        // Price range
        const { min: minPrice, max: maxPrice } = getProductPriceRange(product);

        // Brand logo - use brand name or default
        const brandName = product.brand || 'Brand';
        const brandLogo = getBrandLogo(brandName);

        card.innerHTML = `
            <div class="product-media">
                <div class="product-badges-top">
                    ${badgesHTML}
                </div>
                <div class="product-figure">
                    <img src="${displayColor.main || product.image}" alt="${product.name}" class="product-main-img" loading="lazy">
                </div>
            </div>
            <div class="product-info">
                <div class="product-code">
                    ${product.code}
                    ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" class="brand-logo" title="${brandName}">` : `<span class="brand-name">${brandName}</span>`}
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-price" data-price-min="${minPrice}" data-price-max="${maxPrice}">
                    <span class="product-price-label">Start From</span>
                    <span class="product-price-value">${formatPriceRange(minPrice, maxPrice)}</span>
                    <span class="product-price-suffix">${vatSuffix()}</span>
                </div>
                <div class="product-colors">${colorsHTML}${moreColorsHTML}</div>
            </div>
        `;

        // Color dot interactions (disable switching when a global color filter is active)
        let selectedColor = null;
        card.querySelectorAll('.color-dot').forEach(dot => {
            if (currentState.color) {
                // Keep the variant fixed when filtering by color
                return;
            }
            dot.addEventListener('mouseenter', () => {
                if (!selectedColor) {
                    const img = card.querySelector('.product-main-img');
                    if (img) img.src = dot.dataset.main;
                }
            });

            dot.addEventListener('mouseleave', () => {
                if (selectedColor) {
                    const img = card.querySelector('.product-main-img');
                    const activeDot = card.querySelector('.color-dot.active');
                    if (img && activeDot) img.src = activeDot.dataset.main;
                }
            });

            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const img = card.querySelector('.product-main-img');
                if (img) img.src = dot.dataset.main;
                card.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                selectedColor = {
                    name: dot.dataset.color,
                    url: dot.dataset.main
                };
            });
        });

        // Card click - navigate to customize
        card.addEventListener('click', () => {
            console.log('[ShopManager] Card clicked:', product.code);
            sessionStorage.setItem('selectedProduct', product.code);
            sessionStorage.setItem('selectedProductData', JSON.stringify(product));
            
            const activeColorDot = card.querySelector('.color-dot.active');
            if (displayColor) {
                sessionStorage.setItem('selectedColorName', displayColor.name);
                sessionStorage.setItem('selectedColorUrl', displayColor.main);
            } else if (activeColorDot) {
                sessionStorage.setItem('selectedColorName', activeColorDot.dataset.color);
                sessionStorage.setItem('selectedColorUrl', activeColorDot.dataset.main);
            }
            
            // Determine if we're on mobile or desktop
            const isMobile = window.location.pathname.includes('mobile/') || 
                            window.innerWidth < 768;
            // Use explicit mobile path so redirects from the root shop page land on the correct file
            const targetPage = isMobile ? 'mobile/customize-mobile.html' : 'customize.html';
            const url = new URL(targetPage, window.location.origin);
            if (currentState.color) {
                url.searchParams.set('color', currentState.color);
            }
            window.location.href = url.toString();
        });

        return card;
    }

    function getBrandLogo(brandName) {
        // Common brand logo mappings - can be expanded
        const brandLogos = {
            'gildan': 'https://i.postimg.cc/3WpCDK5M/gildan-logo.png',
            'fruit of the loom': 'https://i.postimg.cc/placeholder-fotl.png',
            'russell': 'https://i.postimg.cc/placeholder-russell.png',
            'awdis': 'https://i.postimg.cc/placeholder-awdis.png'
            // Add more as needed
        };
        
        const normalized = (brandName || '').toLowerCase();
        return brandLogos[normalized] || null;
    }

    // ==========================================================================
    // MAIN RENDER FUNCTION
    // ==========================================================================

    async function renderProducts(options = {}) {
        // Cancel any previous in-flight request
        if (activeProductsAbortController) {
            try { activeProductsAbortController.abort(); } catch { /* ignore */ }
        }
        activeProductsAbortController = new AbortController();
        const signal = activeProductsAbortController.signal;

        showLoading();

        try {
            // Build API params from current state
            const apiParams = {
                page: currentState.page,
                limit: currentState.limit,
                category: currentState.category,
                search: currentState.search,
                sort: currentState.sort
            };

            if (currentState.color) {
                apiParams.color = currentState.color;
            }

            // Add price filters
            if (currentState.priceMin !== null) {
                apiParams.priceMin = currentState.priceMin;
            }
            if (currentState.priceMax !== null) {
                apiParams.priceMax = currentState.priceMax;
            }

            // Add all active filters
            Object.entries(currentState.filters).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    apiParams[key] = values.join(',');
                }
            });

            console.log('[ShopManager] Fetching products with params:', apiParams);

            // Fetch from API
            const result = await BrandedAPI.getProducts({ ...apiParams, signal });

            // Update state
            currentState.total = result.total;

            // Update UI
            updatePageTitle();
            updateResultsCount(result.total);
            updateURL();

            // Clear and render grid
            if (!productsGrid) {
                productsGrid = document.getElementById('productsGrid');
            }

            if (productsGrid) {
                // Fade out animation
                productsGrid.style.opacity = '0';
                productsGrid.style.transform = 'translateY(10px)';
                
                await new Promise(resolve => setTimeout(resolve, 150));
                
                productsGrid.innerHTML = '';

                if (result.items.length === 0) {
                    productsGrid.innerHTML = `
                        <div class="no-products-message" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" style="margin-bottom: 16px;">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <h3 style="color: #374151; font-size: 18px; margin-bottom: 8px;">No products found${currentState.color ? ' for this colour' : ''}</h3>
                            <p style="color: #6b7280; font-size: 14px;">${currentState.color ? 'Try a different colour or clear the colour filter' : 'Try adjusting your filters or search terms'}</p>
                            <button onclick="ShopManager.clearAllFilters()" style="margin-top: 16px; padding: 10px 24px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Clear Filters</button>
                        </div>
                    `;
                } else {
                    let rendered = 0;
                    result.items.forEach((product, index) => {
                        const card = createProductCard(product, index);
                        if (!card) return;
                        rendered++;
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        productsGrid.appendChild(card);
                    });

                    if (rendered === 0) {
                        productsGrid.innerHTML = `
                            <div class="no-products-message" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                                <h3 style="color: #374151; font-size: 18px; margin-bottom: 8px;">No products found for this colour</h3>
                                <p style="color: #6b7280; font-size: 14px;">Try a different colour or clear the colour filter</p>
                                <button onclick="ShopManager.clearAllFilters()" style="margin-top: 16px; padding: 10px 24px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Clear Filters</button>
                            </div>
                        `;
                    }

                    // Animate cards in with stagger
                    const cards = productsGrid.querySelectorAll('.product-card-shop');
                    cards.forEach((card, i) => {
                        setTimeout(() => {
                            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, i * 30);
                    });
                }

                // Fade in grid
                productsGrid.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                productsGrid.style.opacity = '1';
                productsGrid.style.transform = 'translateY(0)';
            }

            // Render pagination if needed
            if (result.total > currentState.limit) {
                renderPagination(result.total);
            }

            hideLoading();

        } catch (error) {
            if (error && (error.name === 'AbortError' || error.code === 20)) {
                // Request was cancelled due to a newer filter selection
                return;
            }
            console.error('[ShopManager] Error fetching products:', error);
            hideLoading();
            
            if (productsGrid) {
                productsGrid.innerHTML = `
                    <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" style="margin-bottom: 16px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 8v4"></path>
                            <path d="M12 16h.01"></path>
                        </svg>
                        <h3 style="color: #374151; font-size: 18px; margin-bottom: 8px;">Failed to load products</h3>
                        <p style="color: #6b7280; font-size: 14px;">${error.message}</p>
                        <button onclick="ShopManager.renderProducts()" style="margin-top: 16px; padding: 10px 24px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Try Again</button>
                    </div>
                `;
            }
        }
    }

    // ==========================================================================
    // PAGINATION
    // ==========================================================================

    function renderPagination(total) {
        const totalPages = Math.ceil(total / currentState.limit);
        const currentPage = currentState.page;

        let paginationContainer = document.getElementById('shopPagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'shopPagination';
            paginationContainer.className = 'shop-pagination';
            productsGrid.parentNode.insertBefore(paginationContainer, productsGrid.nextSibling);
        }

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        let html = '<div class="pagination-inner">';

        // Previous button
        html += `<button class="pagination-btn pagination-prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>`;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            html += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        html += `<button class="pagination-btn pagination-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </button>`;

        html += '</div>';

        // Page info
        html += `<div class="pagination-info">Page ${currentPage} of ${totalPages}</div>`;

        paginationContainer.innerHTML = html;

        // Bind click events
        paginationContainer.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page, 10);
                if (page && page !== currentPage) {
                    goToPage(page);
                }
            });
        });
    }

    function goToPage(page) {
        currentState.page = page;
        renderProducts();
        
        // Scroll to top of products
        const shopTitleBar = document.querySelector('.shop-title-bar');
        if (shopTitleBar) {
            shopTitleBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // ==========================================================================
    // FILTER METHODS
    // ==========================================================================

    function setCategory(category) {
        currentState.category = category || 'all';
        currentState.page = 1;
        renderProducts();
    }

    function setSearch(query) {
        currentState.search = query || '';
        currentState.page = 1;
        renderProducts();
    }

    function setPriceRange(min, max) {
        currentState.priceMin = min;
        currentState.priceMax = max;
        currentState.page = 1;
        renderProducts();
    }

    function setSort(sortBy) {
        currentState.sort = sortBy || 'newest';
        currentState.page = 1;
        renderProducts();
    }

    function setFilter(filterType, values) {
        if (currentState.filters.hasOwnProperty(filterType)) {
            currentState.filters[filterType] = Array.isArray(values) ? values : [values];
            currentState.page = 1;
            renderProducts();
        }
    }

    function toggleFilter(filterType, value) {
        if (currentState.filters.hasOwnProperty(filterType)) {
            const values = currentState.filters[filterType];
            const index = values.indexOf(value);
            if (index > -1) {
                values.splice(index, 1);
            } else {
                values.push(value);
            }
            currentState.page = 1;
            renderProducts();
        }
    }

    function clearFilter(filterType) {
        if (currentState.filters.hasOwnProperty(filterType)) {
            currentState.filters[filterType] = [];
            currentState.page = 1;
            renderProducts();
        }
    }

    function clearAllFilters() {
        currentState.page = 1;
        currentState.search = '';
        currentState.priceMin = null;
        currentState.priceMax = null;
        currentState.sort = 'newest';
        currentState.color = '';
        Object.keys(currentState.filters).forEach(key => {
            currentState.filters[key] = [];
        });
        
        // Clear UI filter states
        document.querySelectorAll('.filter-option input:checked').forEach(cb => {
            cb.checked = false;
        });
        document.querySelectorAll('.filter-colour-swatch.active').forEach(swatch => {
            swatch.classList.remove('active');
        });
        document.querySelectorAll('.filter-toggle input:checked').forEach(toggle => {
            toggle.checked = false;
        });

        // Clear any checkbox-based color filter UI if present
        document.querySelectorAll('.filter-color input[type="checkbox"], .filter-colour input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        const searchInput = document.getElementById('sidebarTextSearch');
        if (searchInput) searchInput.value = '';
        
        const priceSlider = document.getElementById('priceRangeSlider');
        if (priceSlider) {
            priceSlider.value = priceSlider.max;
            const priceLabel = document.getElementById('priceRangeLabel');
            if (priceLabel) priceLabel.textContent = `£0 - £${priceSlider.max}`;
        }

        renderProducts();
    }

    // ==========================================================================
    // UPDATE PRICES ON VAT TOGGLE
    // ==========================================================================

    function updatePrices() {
        document.querySelectorAll('.product-price').forEach(priceEl => {
            const min = Number(priceEl.dataset.priceMin);
            const max = Number(priceEl.dataset.priceMax);
            const valueEl = priceEl.querySelector('.product-price-value');
            if (valueEl && Number.isFinite(min) && Number.isFinite(max)) {
                valueEl.textContent = formatPriceRange(min, max);
            }
            const suffixEl = priceEl.querySelector('.product-price-suffix');
            if (suffixEl) {
                suffixEl.textContent = vatSuffix();
            }
        });
    }

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================

    function getCategoryFromLocation() {
        const urlParams = new URLSearchParams(window.location.search);
        const fromQuery = urlParams.get('category');
        if (fromQuery) return fromQuery;

        // Support /category/:name paths for clean URLs
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts[0] === 'category' && parts[1]) {
            return decodeURIComponent(parts[1]);
        }

        return 'all';
    }

    function initFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        currentState.category = getCategoryFromLocation();
        currentState.search = urlParams.get('q') || '';
        currentState.page = parseInt(urlParams.get('page'), 10) || 1;
        currentState.sort = urlParams.get('sort') || 'newest';
        currentState.color = slugifyColor(urlParams.get('color') || '');
    }

    function syncColorFilterUI() {
        const active = currentState.color || '';

        // Checkbox-based color controls
        document.querySelectorAll('.filter-color input[type="checkbox"], .filter-colour input[type="checkbox"]').forEach(cb => {
            cb.checked = !!active && slugifyColor(cb.value) === active;
        });

        // Swatch-based color controls
        document.querySelectorAll('.filter-colour-swatch').forEach(swatch => {
            const raw = swatch.dataset.colour || swatch.dataset.color || '';
            swatch.classList.toggle('active', !!active && slugifyColor(raw) === active);
        });
    }

    function setColor(colorValue) {
        const next = slugifyColor(colorValue);
        currentState.color = next;
        currentState.page = 1;
        syncColorFilterUI();

        // Debounce just the color filter to avoid hammering the API
        if (colorDebounceTimer) {
            clearTimeout(colorDebounceTimer);
        }
        colorDebounceTimer = setTimeout(() => {
            renderProducts();
        }, COLOR_DEBOUNCE_MS);
    }

    function clearColor() {
        currentState.color = '';
        currentState.page = 1;
        syncColorFilterUI();
        renderProducts();
    }

    async function init() {
        console.log('[ShopManager] Initializing...');
        
        // Get grid element
        productsGrid = document.getElementById('productsGrid');
        
        // Create loading overlay if needed
        if (!document.getElementById('shopLoadingOverlay')) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'shopLoadingOverlay';
            loadingOverlay.className = 'shop-loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                </div>
            `;
            loadingOverlay.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.8); z-index: 1000; justify-content: center; align-items: center;';
            document.body.appendChild(loadingOverlay);
        } else {
            loadingOverlay = document.getElementById('shopLoadingOverlay');
        }

        // Parse URL params
        initFromURL();
        syncColorFilterUI();

        // Set active category button
        const filterButtons = document.querySelectorAll('.category-filter-card');
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === currentState.category) {
                btn.classList.add('active');
            }
        });

        // Initial render
        await renderProducts();

        // Set up event listeners
        setupEventListeners();

        console.log('[ShopManager] Initialization complete');
    }

    function setupEventListeners() {
        // Category filter buttons
        document.querySelectorAll('.category-filter-card').forEach(btn => {
            btn.addEventListener('click', function() {
                const category = this.dataset.category;
                
                // Update active state
                document.querySelectorAll('.category-filter-card').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Scroll into view
                this.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                
                // Set category and render
                setCategory(category);
            });
        });

        // Search input
        const searchInput = document.getElementById('sidebarTextSearch') || document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    setSearch(e.target.value);
                }, 500);
            });
        }

        // Price range slider
        const priceSlider = document.getElementById('priceRangeSlider');
        if (priceSlider) {
            priceSlider.addEventListener('input', (e) => {
                const max = Number(e.target.value);
                const priceLabel = document.getElementById('priceRangeLabel');
                if (priceLabel) {
                    priceLabel.textContent = `£0 - £${max}`;
                }
            });
            
            priceSlider.addEventListener('change', (e) => {
                const max = Number(e.target.value);
                setPriceRange(0, max);
            });
        }

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                setSort(e.target.value);
            });
        }

        // Filter checkboxes
        document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', function() {
                const filterType = this.name;
                const value = this.value;
                toggleFilter(filterType, value);
            });
        });

        // Color swatches (variant color filter)
        document.querySelectorAll('.filter-colour-swatch').forEach(swatch => {
            swatch.addEventListener('click', function() {
                const colour = this.dataset.colour;
                document.querySelectorAll('.filter-colour-swatch').forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                setColor(colour);
            });
        });

        // Checkbox-based color filter (shop.html uses .filter-color)
        document.querySelectorAll('.filter-color input[type="checkbox"], .filter-colour input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', function() {
                const value = this.value;
                if (this.checked) {
                    // Enforce single selection for variant color
                    document.querySelectorAll('.filter-color input[type="checkbox"], .filter-colour input[type="checkbox"]').forEach(other => {
                        if (other !== this) other.checked = false;
                    });
                    setColor(value);
                } else {
                    clearColor();
                }
            });
        });

        // Quick filter toggles
        document.querySelectorAll('.filter-toggle input[type="checkbox"]').forEach(toggle => {
            toggle.addEventListener('change', function() {
                const filterValue = this.value;
                
                if (filterValue === 'in-stock') {
                    // Handle stock filter - may need special API param
                    console.log('[ShopManager] In-stock filter:', this.checked);
                } else if (filterValue === 'recycled') {
                    if (this.checked) {
                        setFilter('accreditations', ['recycled', 'organic']);
                    } else {
                        clearFilter('accreditations');
                    }
                } else if (filterValue === 'plus-sizes') {
                    if (this.checked) {
                        setFilter('size', ['3xl', '4xl', '5xl']);
                    } else {
                        clearFilter('size');
                    }
                }
                // Add more quick filter handlers as needed
            });
        });

        // Clear all button
        const clearAllBtn = document.querySelector('.filter-clear-action');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', clearAllFilters);
        }

        // VAT toggle listener
        window.addEventListener('vatToggleChanged', updatePrices);

        // Listen for popstate (browser back/forward)
        window.addEventListener('popstate', () => {
            initFromURL();
            syncColorFilterUI();
            renderProducts();
        });
    }

    // ==========================================================================
    // EXPOSE PUBLIC API
    // ==========================================================================

    return {
        init,
        renderProducts,
        setCategory,
        setSearch,
        setPriceRange,
        setSort,
        setColor,
        clearColor,
        setFilter,
        toggleFilter,
        clearFilter,
        clearAllFilters,
        updatePrices,
        goToPage,
        getState: () => ({ ...currentState }),
        
        // Expose formatting for external use
        formatCurrency,
        vatSuffix,
        formatPriceRange
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ShopManager.init();
    });
} else {
    // DOM already ready
    setTimeout(() => ShopManager.init(), 0);
}

