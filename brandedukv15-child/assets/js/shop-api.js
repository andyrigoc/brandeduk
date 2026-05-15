/**
 * BrandedUK Shop Page - API Integration
 * Handles product listing, filtering, pagination, and search
 * Requires: api.js to be loaded first
 */

const ShopManager = (function () {
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
        sort: 'best',
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

    // Category title mappings (from shared config)
    const CATEGORY_TITLES = (window.BrandedConfig && window.BrandedConfig.CATEGORY_TITLES) || {
        'all': 'All Products'
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
        return '\u00A3' + value.toFixed(2);
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
        // Title and description are managed by shop.html inline JS (CATEGORY_INFO maps)
        // Only update breadcrumb here
        const title = CATEGORY_TITLES[currentState.category] ||
            CATEGORY_TITLES[currentState.category.toLowerCase()] ||
            'Products';

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

        // Use query-param style URLs (compatible with static file servers / Live Server)
        if (currentState.category && currentState.category !== 'all') {
            url.searchParams.set('category', currentState.category);
        } else {
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
        if (currentState.sort && currentState.sort !== 'best') {
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
        let badgesBottomHTML = '';

        // Add Best Seller / Recommended badges (top-right)
        if (product.is_best_seller === true || product.is_best_seller === 'true' || product.is_best_seller === 1) {
            badgesHTML += '<span class="badge best-seller">BEST SELLER</span>';
        }
        if (product.is_recommended === true || product.is_recommended === 'true' || product.is_recommended === 1) {
            badgesHTML += '<span class="badge recommended">RECOMMENDED</span>';
        }

        // Hide PRINT badge for products with 'beanie' in the name (embroidery-only)
        const isBeanie = (product.name || '').toLowerCase().includes('beanie');
        if (hasPrint && !isBeanie) {
            badgesBottomHTML += '<span class="badge print">PRINT</span>';
        }

        if (hasEmbroidery) {
            badgesBottomHTML += '<span class="badge embroidery">EMBROIDERY</span>';
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
        // Use the model/lifestyle image as the default thumbnail (not the color variant image)
        // BUT if a colour-related filter (primaryColour or colourShade) is active, show
        // the first matching colour variant image so users see the filtered colour.
        const hasColorFilter = activeColorSlug ||
            (currentState.filters.primaryColour && currentState.filters.primaryColour.length > 0) ||
            (currentState.filters.colourShade && currentState.filters.colourShade.length > 0);

        let defaultThumbImage = product.image;
        if (activeColorSlug && matchedVariant) {
            // Variant-level color filter â€“ show the matched variant
            defaultThumbImage = matchedVariant.main || product.image;
        } else if (hasColorFilter && !activeColorSlug) {
            // primaryColour / colourShade filter active â€“ pick first matching variant
            const filterColorValues = [
                ...(currentState.filters.primaryColour || []),
                ...(currentState.filters.colourShade || [])
            ];
            if (filterColorValues.length > 0 && allColors.length > 0) {
                // Try to find a color variant whose name matches any of the filter values
                const matched = allColors.find(c => {
                    const cSlug = slugifyColor(c.name);
                    return filterColorValues.some(fv => {
                        const fvSlug = slugifyColor(fv);
                        return cSlug === fvSlug || cSlug.includes(fvSlug) || fvSlug.includes(cSlug);
                    });
                });
                if (matched) {
                    defaultThumbImage = matched.main || product.image;
                } else {
                    // No exact match â€“ fall back to first color variant (since API already filtered by color)
                    defaultThumbImage = allColors[0].main || product.image;
                }
            }
        }
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
                <div class="product-badges">
                    ${badgesHTML}
                </div>
                <div class="product-badges-bottom">
                    ${badgesBottomHTML}
                </div>
                <div class="product-figure">
                    <img src="${defaultThumbImage || product.image}" alt="${product.name}" class="product-main-img" loading="lazy">
                </div>
            </div>
            <div class="product-info">
                <div class="product-code">
                    ${product.code}
                    ${brandName && !['absolute','ralawise'].some(ex => brandName.toLowerCase().includes(ex)) ? (brandLogo ? `<img src="${brandLogo}" alt="${brandName}" class="brand-logo" title="${brandName}">` : `<span class="brand-name">${brandName}</span>`) : ''}
                </div>
                <div class="product-name">${(product.name||'').replace(/[\u00AE\u2122\u00A9]/g,'')}</div>
                <div class="product-price" data-price-min="${minPrice}" data-price-max="${maxPrice}">
                    <span class="product-price-label">From</span>
                    <span class="product-price-value">${formatCurrency(minPrice)}</span>
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
                const img = card.querySelector('.product-main-img');
                if (selectedColor) {
                    // If a color was explicitly clicked, revert to that color's image
                    if (img) img.src = selectedColor.url;
                } else {
                    // No color clicked â€“ revert to the model/lifestyle image
                    if (img) img.src = product.image;
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
                window.innerWidth < 1280;
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
        const B = 'brandedukv15-child/assets/images/brands/';
        const brandLogos = {
            // A
            '2786':                         B + '27862020.webp',
            'adidas':                       B + 'adidas.jpg',
            'adidas®':                      B + 'adidas.jpg',
            'afd by dennys':                B + 'add-it-on2020.jpg',
            'anthem':                       B + 'anthem-logo.jpg',
            'asquith & fox':                B + 'asquith-and-fox.jpg',
            'awdis':                        B + 'awdis.webp',
            'awdis academy':                B + 'awdisacademy2020.webp',
            'awdis ecologie':               B + 'awdisecologie2020.jpg',
            'awdis just cool':              B + 'awdisjustcool2020.webp',
            'awdis just hoods':             B + 'awdisjusthoods2020.webp',
            "awdis just polo's":            B + 'awdisjustpolos2020.jpg',
            "awdis just t's":               B + 'awdisjustts2020.webp',
            'awdis so denim':               B + 'awdissodenim2020.jpg',
            // B
            'b&c':                          B + 'bc20202.webp',
            'b&c collection':               B + 'bccollp23.png',
            'babybugz':                     B + 'babybugz2020.jpg',
            'bagbase':                      B + 'bagbase.jpeg',
            'beechfield':                   B + 'beechfield.jpeg',
            'bella canvas':                 B + 'bellapluscanvas.svg',
            'bella+canvas':                 B + 'bellapluscanvas.svg',
            'build your brand':             B + 'build-your-brand.png',
            'build your brand basic':       B + 'build-your-brand-basic-logo-web-2021.jpg',
            'build your brandit':           B + 'build-your-brandit-logo.jpeg',
            // C
            'callaway':                     B + 'callaway2020.jpg',
            'colortone':                    B + 'colortone2020.webp',
            'comfort colors':               B + 'comfort-colors.webp',
            'comfort colors®':              B + 'comfort-colors.webp',
            'craghoppers':                  B + 'craghoppers.jpg',
            // E
            'essentials':                   B + 'everydayessentials2020.jpg',
            // F
            'finden & hales':               B + 'finden-hales.png',
            'flexfit':                      B + 'flexfit.webp',
            'flexfit by yupoong':           B + 'flexfit.webp',
            'front row':                    B + 'front-row.jpg',
            'fruit of the loom':            B + 'fruit-of-the-loom.jpg',
            // G
            'gildan':                       B + 'gildan2020.webp',
            'gildan hammer':                B + 'gildan2020.webp',
            // H
            'henbury':                      B + 'henbury2020.webp',
            'home & living':                B + 'web-logo-homeandliving-2023.webp',
            // K
            'kariban':                      B + 'kariban2020.webp',
            'kariban proact':               B + 'proact.jpg',
            'kimood':                       B + 'kimood2020.jpg',
            'kustom kit':                   B + 'kustom-kit2020.webp',
            // L
            'larkwood':                     B + 'larkwood.jpeg',
            // M
            'maddins':                      B + 'maddins2020.jpg',
            'madeira':                      B + 'web-logo-madeira-2022.jpg',
            'mumbles':                      B + 'mumbles2020.webp',
            // N
            'new morning studios':          B + 'web-logo-new-morning-studios.png',
            'nike':                         B + 'nike2020.jpg',
            'nimbus':                       B + 'nimbus2020.webp',
            'nutshell':                     B + 'nutshell-bag2020.webp',
            'nutshell®':                    B + 'nutshell-bag2020.webp',
            // O
            'ogio':                         B + 'ogio2020.webp',
            'onna by premier':              B + 'web-logo-onna-by-premier-2023.jpg',
            // P
            'portwest':                     B + 'portwest.webp',
            'premier':                      B + 'premier2020.webp',
            'pro rtx':                      B + 'pro-rtx2020.jpg',
            'prortx':                       B + 'pro-rtx2020.jpg',
            'prortx high visibility':       B + 'pro-rtx-hv2020.jpg',
            // Q
            'quadra':                       B + 'quadra-2020.webp',
            // R
            'regatta':                      B + 'regatta.webp',
            'regatta high visibility':      B + 'regattaprofessional-highv2020.webp',
            'regatta honestly made':        B + 'regattaprofessional-hones2020.jpg',
            'regatta junior':               B + 'regattaprofessional-junio2020.jpg',
            'regatta professional':         B + 'regatta-professional2020.webp',
            'regatta safety footwear':      B + 'regattaprofessional-safet2020.jpg',
            'result':                       B + 'result2020.webp',
            'result core':                  B + 'resultcorevalue2020.webp',
            'result headwear':              B + 'resultheadwear2020.webp',
            'result safeguard':             B + 'result-safe-guard-2026.webp',
            'result urban outdoor':         B + 'resulturbanoutdoorwear2020.webp',
            'result winter essentials':     B + 'resultwinteressentials2020.webp',
            'result workguard':             B + 'result-workguard-2026.webp',
            'rhino':                        B + 'rhino2020.jpg',
            'ribbon':                       B + 'brand-logo-ribbon.jpg',
            'russell':                      B + 'russell.webp',
            'russell athletic':             B + 'russel-athletic-2026.webp',
            'russell athletic collection':  B + 'russel-athletic-collection-2026.webp',
            'russell collection':           B + 'russell.webp',
            'russell europe':               B + 'russell.webp',
            // S
            'scruffs':                      B + 'web-logo-scruffs-2023.jpg',
            'sf':                           B + 'sf-clothing.webp',
            'spiro':                        B + 'spiro2022.webp',
            'spiro recycled':               B + 'web-logo-spiro-recycled.png',
            'splashmacs':                   B + 'splashmacs2020.jpg',
            'stanley workwear':             B + 'stanley-logo.jpg',
            'stanley/stella':               B + 'stanley-stella.webp',
            'stormtech':                    B + 'stormtech.webp',
            // T
            'tee jays':                     B + 'tee-jays.jpg',
            'tombo':                        B + 'tombo2020.webp',
            'towel city':                   B + 'towel-city2020.jpg',
            'tridri':                       B + 'tridri.webp',
            'tridri®':                      B + 'web-logo-tridri-2025.webp',
            // U
            'under armour':                 B + 'under-armour.webp',
            'under armour golf':            B + 'under-armour.webp',
            // W
            'westford mill':                B + 'westford-mill-2020.webp',
            'wombat':                       B + 'wombat-logo.jpg',
            // Y
            'yoko':                         B + 'yoko.webp'
        };
        const normalized = (brandName || '').toLowerCase().trim()
            .replace(/[\u00AE\u2122\u00A9]/g, '');   // strip ®™© before lookup
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

            // Add all active filters (array format with [] suffix, matching PC version)
            Object.entries(currentState.filters).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    apiParams[`${key}[]`] = values;
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
                            <button onclick="ShopManager.clearAllFilters()" style="margin-top: 16px; padding: 10px 24px; background: #273469; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Clear Filters</button>
                        </div>
                    `;
                } else {
                    // Check if gender filter is active â€” skip grouping if so
                    var hasGenderFilter = currentState.filters.gender && currentState.filters.gender.length > 0;

                    let rendered = 0;
                    var cardIndex = 0;

                    // Always render flat list â€” no gender grouping
                    result.items.forEach(function(product) {
                        var card = createProductCard(product, cardIndex++);
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
                                <button onclick="ShopManager.clearAllFilters()" style="margin-top: 16px; padding: 10px 24px; background: #273469; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Clear Filters</button>
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
                        <button onclick="ShopManager.renderProducts()" style="margin-top: 16px; padding: 10px 24px; background: #273469; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Try Again</button>
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
        currentState.sort = sortBy || 'best';
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
        currentState.sort = 'best';
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
            if (priceLabel) priceLabel.textContent = `\u00A30 - \u00A3${priceSlider.max}`;
        }

        renderProducts();
    }

    // ==========================================================================
    // UPDATE PRICES ON VAT TOGGLE
    // ==========================================================================

    function updatePrices() {
        document.querySelectorAll('.product-price').forEach(priceEl => {
            const min = Number(priceEl.dataset.priceMin);
            const valueEl = priceEl.querySelector('.product-price-value');
            if (valueEl && Number.isFinite(min)) {
                valueEl.textContent = formatCurrency(min);
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
        currentState.sort = urlParams.get('sort') || 'best';
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
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#273469" stroke-width="2">
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
            btn.addEventListener('click', function () {
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
                    priceLabel.textContent = `\u00A30 - \u00A3${max}`;
                }
            });

            priceSlider.addEventListener('change', (e) => {
                const max = Number(e.target.value);
                setPriceRange(0, max);
            });
        }

        // Sort select (desktop + mobile)
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                setSort(e.target.value);
            });
        }
        const mobileSortSelect = document.getElementById('mobileSortSelect');
        if (mobileSortSelect) {
            mobileSortSelect.addEventListener('change', (e) => {
                setSort(e.target.value);
            });
        }

        // Filter checkboxes
        document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', function () {
                const filterType = this.name;
                const value = this.value;
                toggleFilter(filterType, value);
            });
        });

        // Color swatches (variant color filter)
        document.querySelectorAll('.filter-colour-swatch').forEach(swatch => {
            swatch.addEventListener('click', function () {
                const colour = this.dataset.colour;
                document.querySelectorAll('.filter-colour-swatch').forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                setColor(colour);
            });
        });

        // Checkbox-based color filter (shop.html uses .filter-color)
        document.querySelectorAll('.filter-color input[type="checkbox"], .filter-colour input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', function () {
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
            toggle.addEventListener('change', function () {
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

