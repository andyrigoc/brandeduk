/* Mobile JavaScript - BrandedUK */

document.addEventListener('DOMContentLoaded', function() {
    bootBrandedNav();
    startCustomiseRise();
    const mobileNavigation = window.matchMedia('(max-width: 699px)');
    ensureBukNavCss();
    upgradeAllBukNavs();
    if (mobileNavigation.matches) initMobileNavigation();
    mobileNavigation.addEventListener('change', (event) => {
        if (event.matches) {
            initMobileNavigation();
            initBottomNav();
            mountBukNavIndicators();
        }
    });
    initVatToggle();
    initSearch();
    initCategories();
    initBottomNav();
    updateCartCount();
    initAccountPanel();
    bindMobileAccountAvatarSync();
    syncMobileAccountAvatar();
    initBrandsMarqueeLogos();
    initStickyBarFooterPush();
    mountBukNavIndicators();
});

function initMobileNavigation() {
    const actions = document.querySelector('.mobile-header--v2 .mh-actions');
    const header = document.querySelector('.mobile-header--v2');
    if (!actions || !header || header.querySelector('.mh-account')) return;

    const nav = document.querySelector('.bottom-nav');
    const shop = nav && Array.from(nav.querySelectorAll('a.nav-item')).find((item) => {
        return item.textContent.trim() === 'Shop';
    });
    if (shop) shop.href = '/mobile/shop-categories-mobile.html?force=mobile';

    let account = nav && Array.from(nav.querySelectorAll('a.nav-item')).find((item) => {
        return item.id === 'accountNavBtn' || item.textContent.trim() === 'Account';
    });

    if (account && account.closest('nav.bottom-nav')) {
        const accountLabel = account.querySelector('.nav-item-label, .nav-label');
        if (accountLabel) accountLabel.remove();
        account.remove();
    }
    if (!account) {
        account = document.createElement('a');
        account.className = 'nav-item';
        account.href = '/profile.html';
        account.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    }

    if (!document.getElementById('accountPanel') && account.getAttribute('href') === '#') {
        account.href = '/profile.html';
    }
    account.id = 'accountNavBtn';
    account.classList.add('mh-icon-btn', 'mh-account');
    account.setAttribute('aria-label', 'Account');
    actions.parentElement.prepend(account);
    syncMobileAccountAvatar();
}

// The shop's sticky category bar lives directly in <body>, so CSS sticky never releases it and it
// would sit on top of the footer. Push it up with the footer, like the end of a sticky container.
function initStickyBarFooterPush() {
    const bar = document.querySelector('.categories-filter-scroll');
    if (!bar) return;
    let ticking = false;
    const update = () => {
        ticking = false;
        const footer = document.querySelector('.mfooter') || document.querySelector('[data-mobile-footer]');
        if (!footer) return;
        const stuckTop = parseFloat(getComputedStyle(bar).top) || 0;
        const overlap = footer.getBoundingClientRect().top - (stuckTop + bar.offsetHeight);
        bar.style.transform = overlap < 0 ? `translateY(${overlap}px)` : '';
    };
    const schedule = () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
}

// Root-relative so links also work from nested folders such as /blog/articles/.
function getMobileBaseUrl() {
    return '/mobile/';
}

function getCanonicalShopUrl(queryString = '') {
    const query = queryString ? (queryString.charAt(0) === '?' ? queryString : `?${queryString}`) : '';
    return `/mobile/shop-mobile.html${query}`;
}

function initBrandsMarqueeLogos() {
    const brandCards = document.querySelectorAll('.brands-section .brand-card');
    if (!brandCards.length) return;

    // Direct mapping: brand display name → exact filename (avoids 404 errors)
    const brandFileMap = {
        '2786': '27862020.webp',
        'Adidas': 'adidas.jpg',
        'Anthem': 'anthem.jpg',
        'Asquith & Fox': 'asquith-and-fox.jpg',
        'AWDis': 'awdis.webp',
        'B&C Collection': 'bandc-collection.png',
        'BabyBugz': 'babybugz2020.jpg',
        'BagBase': 'bagbase.jpeg',
        'Beechfield': 'beechfield.jpeg',
        'Bella+Canvas': 'bellapluscanvas.svg',
        'Callaway': 'callaway2020.jpg',
        'Colortone': 'colortone2020.webp',
        'Comfort Colors': 'comfort-colors.webp',
        'Craghoppers': 'craghoppers.jpg',
        'Finden & Hales': 'finden-and-hales.png',
        'Flexfit': 'flexfit.webp',
        'Front Row': 'front-row.jpg',
        'Fruit of the Loom': 'fruit-of-the-loom.jpg',
        'Gamegear': 'gamegear.webp',
        'Gildan': 'gildan2020.webp',
        'Henbury': 'henbury2020.webp',
        'Kariban': 'kariban2020.webp',
        'KiMood': 'kimood2020.jpg',
        'Kustom Kit': 'kustom-kit2020.webp',
        'Larkwood': 'larkwood.jpeg',
        'Maddins': 'maddins2020.jpg',
        'Mumbles': 'mumbles2020.webp',
        'Nike': 'nike2020.jpg',
        'Nimbus': 'nimbus2020.webp',
        'OGIO': 'ogio2020.webp',
        'Portwest': 'portwest.webp',
        'Premier': 'premier2020.webp',
        'Pro RTX': 'pro-rtx2020.jpg',
        'Quadra': 'quadra-2020.webp',
        'Regatta': 'regatta.webp',
        'Result': 'result2020.webp',
        'Rhino': 'rhino2020.jpg',
        'Russell': 'russell.webp',
        'Scruffs': 'scruffs.jpg',
        'SF Clothing': 'sf-clothing.webp',
        'Spiro': 'spiro.webp',
        'Stanley/Stella': 'stanley-stella.webp',
        'Stormtech': 'stormtech.webp',
        'Tee Jays': 'tee-jays.jpg',
        'Tombo': 'tombo2020.webp',
        'Towel City': 'towel-city2020.jpg',
        'TriDri': 'tridri.webp',
        'Under Armour': 'under-armour.webp',
        'Westford Mill': 'westford-mill-2020.webp',
        'Wombat': 'wombat.jpg',
        'Xpres': 'xpres2020.jpg',
        'Yoko': 'yoko.webp'
    };

    const basePath = 'brandedukv15-child/assets/images/brands/';

    brandCards.forEach((card) => {
        if (!(card instanceof HTMLElement)) return;
        if (card.querySelector('img')) return;

        const brandName = (card.textContent || '').trim();
        if (!brandName) return;

        const filename = brandFileMap[brandName];
        if (!filename) {
            // No mapping found, keep text
            return;
        }

        const img = document.createElement('img');
        img.className = 'brand-logo-img';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = brandName;
        img.src = basePath + filename;

        img.addEventListener('error', () => {
            if (!card.isConnected) return;
            card.innerHTML = '';
            card.textContent = brandName;
        });

        card.title = brandName;
        card.innerHTML = '';
        card.appendChild(img);
    });
}

// ============================================
// VAT TOGGLE (Global)
// ============================================
const VAT_RATE = 0.20;

function isVatOn() {
    return localStorage.getItem('brandeduk-vat-mode') === 'on';
}

function setVatMode(on) {
    localStorage.setItem('brandeduk-vat-mode', on ? 'on' : 'off');
}

function formatCurrency(baseAmount, options = {}) {
    const includeVat = options.includeVat !== undefined ? options.includeVat : isVatOn();
    const amount = includeVat ? baseAmount * (1 + VAT_RATE) : baseAmount;
    return `\u00A3${amount.toFixed(2)}`;
}

function vatSuffix() {
    return isVatOn() ? 'inc VAT' : 'ex VAT';
}

// Export to global scope for other pages
window.isVatOn = isVatOn;
window.setVatMode = setVatMode;
window.formatCurrency = formatCurrency;
window.vatSuffix = vatSuffix;

function initVatToggle() {
    const vatToggleBtn = document.getElementById('vatToggleBtn');
    const vatToggleCheckbox = document.getElementById('vatToggleCheckbox');
    const vatToggleTablet = document.getElementById('vatToggleTablet');

    if (!vatToggleBtn && !vatToggleCheckbox && !vatToggleTablet) return;

    const applyVatMode = (newState) => {
        setVatMode(newState);
        updateVatToggleUI();
        updateAllPrices();
        window.dispatchEvent(new CustomEvent('vatToggleChanged', { detail: { vatOn: newState } }));
    };

    // Initialize state from localStorage
    updateVatToggleUI();
    updateAllPrices();

    if (vatToggleBtn) {
        vatToggleBtn.addEventListener('click', function() {
            applyVatMode(!isVatOn());
        });
    }

    if (vatToggleCheckbox) {
        vatToggleCheckbox.addEventListener('change', function() {
            applyVatMode(!!vatToggleCheckbox.checked);
        });
    }

    if (vatToggleTablet) {
        vatToggleTablet.addEventListener('change', function() {
            applyVatMode(!!vatToggleTablet.checked);
        });
    }

    window.addEventListener('vatToggleChanged', function () {
        updateVatToggleUI();
        updateAllPrices();
    });
}

function updateVatToggleUI() {
    const vatToggleBtn = document.getElementById('vatToggleBtn');
    const vatToggleContainer = document.getElementById('vatToggleContainer');
    const vatStatus = document.getElementById('vatStatus');
    const vatToggleCheckbox = document.getElementById('vatToggleCheckbox');
    const vatToggleTablet = document.getElementById('vatToggleTablet');
    const vatOn = isVatOn();
    
    if (vatToggleBtn) {
        vatToggleBtn.classList.toggle('is-on', vatOn);
        vatToggleBtn.setAttribute('aria-pressed', vatOn);
    }

    if (vatToggleCheckbox) {
        vatToggleCheckbox.checked = vatOn;
    }

    if (vatToggleTablet) {
        vatToggleTablet.checked = vatOn;
    }

    if (vatToggleContainer) {
        vatToggleContainer.classList.toggle('is-on', vatOn);
    }
    if (vatStatus) {
        vatStatus.textContent = vatOn ? 'inc VAT' : 'ex VAT';
    }
    
    // Update all vat-suffix elements
    document.querySelectorAll('.vat-suffix').forEach(el => {
        el.textContent = vatSuffix();
    });
}

function updateAllPrices() {
    // Update product cards
    document.querySelectorAll('[data-base-price]').forEach(el => {
        const basePrice = parseFloat(el.dataset.basePrice);
        if (!isNaN(basePrice)) {
            el.textContent = formatCurrency(basePrice);
        }
    });
    
    // Update price elements with data-price attribute
    document.querySelectorAll('[data-price]').forEach(el => {
        const basePrice = parseFloat(el.dataset.price);
        if (!isNaN(basePrice)) {
            el.textContent = formatCurrency(basePrice);
        }
    });
}

// ============================================
// SEARCH (with live suggestions like main page)
// ============================================
// The suggest API also returns category-related items (e.g. chef jackets for "apron");
// keep only products whose title contains every searched word, or that match the code/brand.
function filterSuggestByTitle(products, query) {
    const norm = (s) => String(s || '').toLowerCase();
    const words = norm(query).split(/[^a-z0-9]+/).filter((w) => w.length >= 2);
    if (!words.length) return products || [];
    const variants = words.map((w) => [w, w.replace(/s$/, ''), w.replace(/es$/, '')].filter((v) => v.length >= 2));
    const hasAll = (text) => variants.every((vs) => vs.some((v) => text.includes(v)));
    return (products || []).filter((p) => {
        const title = norm(p.label || p.name);
        if (hasAll(title)) return true;
        const code = norm(p.value || p.code);
        if (code && code.startsWith(norm(query).replace(/\s+/g, ''))) return true;
        const brand = norm(p.brand || p.brand_name);
        return !!brand && hasAll(brand + ' ' + title);
    });
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchNavBtn = document.getElementById('searchNavBtn');
    const _HIDDEN_BRANDS = ['absolute apparel', 'ralawise'];

    if (searchNavBtn) {
        searchNavBtn.addEventListener('click', (e) => {
            e.preventDefault();
            searchInput?.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Search Suggestions Helper ---
    function setupSearchSuggestions(inputEl, wrapperEl) {
        if (!inputEl) return;

        // Create suggestion box
        let suggestionBox = wrapperEl.querySelector('.search-suggestions');
        if (!suggestionBox) {
            suggestionBox = document.createElement('div');
            suggestionBox.className = 'search-suggestions';
            wrapperEl.style.position = 'relative';
            wrapperEl.appendChild(suggestionBox);
        }

        inputEl.setAttribute('autocomplete', 'off');

        let debounceTimer;
        const debounce = (cb, ms) => { clearTimeout(debounceTimer); debounceTimer = setTimeout(cb, ms); };

        const renderSuggestions = (data, query) => {
            let { products = [], keywords = [] } = data;
            keywords = Array.isArray(keywords) ? keywords.slice(0, 3) : [];
            products = filterSuggestByTitle(products, query);
            // Strip hidden brand names
            products = products.map(p => {
                let label = p.label || '';
                _HIDDEN_BRANDS.forEach(b => { label = label.replace(new RegExp(b, 'gi'), '').trim(); });
                return { ...p, label };
            });
            if (products.length === 0 && keywords.length === 0) { suggestionBox.classList.remove('active'); return; }

            const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

            const highlight = (text) => {
                const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                return esc(text).replace(regex, '<mark>$1</mark>');
            };

            let html = '';
            
            // Check if we're not already in the mobile folder (e.g. from index-mobile.html)
            const baseUrl = getMobileBaseUrl();

            if (keywords.length) {
                html += '<div class="suggestion-group-title">Suggested searches</div>';
                keywords.forEach(keyword => {
                    const value = keyword.value || keyword.label || '';
                    const keywordUrl = getCanonicalShopUrl(`q=${encodeURIComponent(value)}`);
                    html += `
                        <a href="${keywordUrl}" class="suggestion-item suggestion-keyword">
                            <span class="suggestion-keyword-icon" aria-hidden="true">↗</span>
                            <div class="suggestion-item-content">
                                <div class="suggestion-item-label">${highlight(value)}</div>
                            </div>
                        </a>`;
                });
            }

            if (products.length) html += '<div class="suggestion-group-title">Product Results</div>';

            products.slice(0, 8).forEach(product => {
                const detailUrl = `${baseUrl}customize-mobile.html?code=${product.value}`;
                const imgUrl = product.image || '/brandedukv15-child/assets/images/ui/no-image.png';
                const safeName = (product.label || '').replace(/'/g, "\\'");
                const brand = product.brand || product.brand_name || '';
                const priceVal = Number(product.price);
                const vatOn = typeof window.isVatOn === 'function' && window.isVatOn();
                const amount = Number.isFinite(priceVal) ? (vatOn ? priceVal * 1.2 : priceVal) : null;
                const brandHtml = brand ? `<span class="suggestion-item-brand">${esc(brand)}</span>` : '';
                const priceHtml = amount == null ? '' : `<span class="suggestion-item-price">From <strong>£${amount.toFixed(2)}</strong> ${vatOn ? 'inc. VAT' : 'ex. VAT'}</span>`;
                html += `
                    <a href="${detailUrl}" class="suggestion-item" data-product-code="${product.value}"
                       onclick="sessionStorage.setItem('selectedProduct','${product.value}');sessionStorage.setItem('selectedProductData',JSON.stringify({code:'${product.value}',name:'${safeName}'}));">
                        <img src="${imgUrl}" class="suggestion-item-image" onerror="this.src='/brandedukv15-child/assets/images/ui/no-image.png'">
                        <div class="suggestion-item-content">
                            <div class="suggestion-item-label">${highlight(product.label)}</div>
                            <div class="suggestion-item-sub"><span>Code: ${product.value}</span></div>
                        </div>
                        <div class="suggestion-item-aside">${brandHtml}${priceHtml}</div>
                    </a>`;
            });
            html += `<a href="${getCanonicalShopUrl(`q=${encodeURIComponent(query)}`)}" class="view-all-results">View all results for "${query}" →</a>`;
            suggestionBox.innerHTML = html;
            suggestionBox.classList.add('active');
        };

        const fetchSuggestions = async (query) => {
            if (query.length < 1) { suggestionBox.classList.remove('active'); return; }
            try {
                const apiBase = (typeof window.resolveBrandedApiBase === 'function'
                    ? window.resolveBrandedApiBase()
                    : (window.API_BASE_URL || 'https://api.brandeduk.com')).replace(/\/+$/, '');
                const res = await fetch(`${apiBase}/api/products/suggest?q=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                renderSuggestions(data, query);
            } catch (err) { console.error('Search Suggestion Error:', err); }
        };

        inputEl.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            debounce(() => fetchSuggestions(query), 300);
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!inputEl.contains(e.target) && !suggestionBox.contains(e.target)) {
                suggestionBox.classList.remove('active');
            }
        });

        // Enter key → go to shop
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    suggestionBox.classList.remove('active');
                    window.location.href = getCanonicalShopUrl(`q=${encodeURIComponent(query)}`);
                }
            }
        });
    }

    // Attach suggestions to main #searchInput
    if (searchInput) {
        const wrapper = searchInput.closest('.search-wrapper-expand') || searchInput.parentElement;
        setupSearchSuggestions(searchInput, wrapper);
    }

    // Handle search wrapper icon click (toggle focus / perform search)
    document.querySelectorAll('.search-wrapper-expand').forEach((wrapper) => {
        const input = wrapper.querySelector('.search-input-expand');
        const icon = wrapper.querySelector('.search-icon-expand');
        if (!(input instanceof HTMLInputElement) || !(icon instanceof SVGElement)) return;
        if (icon.dataset.searchToggleBound === 'true') return;
        icon.dataset.searchToggleBound = 'true';

        // Also attach suggestions to this input if different from #searchInput
        if (input !== searchInput) {
            setupSearchSuggestions(input, wrapper);
        }

        const performSearch = () => {
            const query = input.value.trim();
            if (query) {
                window.location.href = getCanonicalShopUrl(`q=${encodeURIComponent(query)}`);
            }
        };

        const toggle = (event) => {
            event.preventDefault();
            event.stopPropagation();
            const isOpen = document.activeElement === input;
            if (isOpen) {
                input.blur();
            } else {
                input.focus();
            }
        };

        icon.setAttribute('role', 'button');
        icon.setAttribute('tabindex', '0');
        icon.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const isOpen = document.activeElement === input;
            if (isOpen && input.value.trim()) {
                performSearch();
            } else {
                toggle(event);
            }
        });
        icon.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (input.value.trim()) {
                    performSearch();
                } else {
                    toggle(event);
                }
            }
        });
    });
}

// ============================================
// CATEGORIES
// ============================================
function initCategories() {
    const categoryItems = document.querySelectorAll('.category-item');

    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            if (category) {
                window.location.href = getCanonicalShopUrl(`category=${encodeURIComponent(category)}`);
            }
        });
    });

    // Infinite Auto-Scroll for Categories
    const categoriesScroll = document.querySelector('.categories-scroll');
    if (!categoriesScroll) return;

    let isAutoScrolling = true;
    let userInteracting = false;
    let scrollSpeed = 0.4; // pixels per frame (rallentato)

    // Clone categories for infinite scroll
    const categories = Array.from(categoriesScroll.children);
    categories.forEach(category => {
        const clone = category.cloneNode(true);
        categoriesScroll.appendChild(clone);
    });

    // Auto-scroll function with requestAnimationFrame for smooth animation
    function autoScroll() {
        if (isAutoScrolling && !userInteracting) {
            categoriesScroll.scrollLeft += scrollSpeed;

            // Reset to beginning for infinite loop (seamless)
            const maxScroll = categoriesScroll.scrollWidth / 2;
            if (categoriesScroll.scrollLeft >= maxScroll) {
                categoriesScroll.scrollLeft = 0;
            }
        }
        requestAnimationFrame(autoScroll);
    }

    // Start smooth auto-scroll
    requestAnimationFrame(autoScroll);

    // Stop on touch/mouse interaction
    let touchTimeout;
    
    categoriesScroll.addEventListener('touchstart', () => {
        userInteracting = true;
        isAutoScrolling = false;
        clearTimeout(touchTimeout);
    });

    categoriesScroll.addEventListener('touchend', () => {
        userInteracting = false;
        // Resume auto-scroll after 3 seconds of inactivity
        touchTimeout = setTimeout(() => {
            isAutoScrolling = true;
        }, 3000);
    });

    categoriesScroll.addEventListener('mousedown', () => {
        userInteracting = true;
        isAutoScrolling = false;
        clearTimeout(touchTimeout);
    });

    categoriesScroll.addEventListener('mouseup', () => {
        userInteracting = false;
        touchTimeout = setTimeout(() => {
            isAutoScrolling = true;
        }, 3000);
    });

    // Stop on manual scroll
    categoriesScroll.addEventListener('scroll', () => {
        if (!userInteracting) return;
        clearTimeout(touchTimeout);
        isAutoScrolling = false;
        touchTimeout = setTimeout(() => {
            isAutoScrolling = true;
        }, 3000);
    }, { passive: true });
}

// ============================================
// BOTTOM NAVIGATION
// Branded-UK-Navbar-V2 dark bar (body.dark): midnight bar, light icons,
// white circle. CSS variables live on .nav.dark. Do not follow
// prefers-color-scheme. Chat and Filters open panels and do not move the
// circle. Customise uses V2 selectItem, so the circle moves onto it.
// ============================================

const BUK_NAV_CSS = '/mobile/css/bottom-nav.css?v=20261115-corretta2';

const BUK_ICONS = {
    home: '<svg viewBox="0 0 52 52" aria-hidden="true"><path d="M10 24v20h11V32h10v12h11V24"/><path class="accent" d="m5 25 21-18 21 18M36 14V8h6v11"/></svg>',
    shop: '<svg viewBox="0 0 52 52" aria-hidden="true"><path d="M10 25v20h32V25M15 45V31h12v14M32 31h6v7h-6z"/><path fill="#ff7a00" d="M10 9h6.4l-3 15q0 5-4.2 5T5 24Z"/><path fill="#ffffff" d="M16.4 9h6.4l-1 15q0 5-4.2 5t-4.2-5Z"/><path fill="#ff7a00" d="M22.8 9h6.4l1 15q0 5-4.2 5t-4.2-5Z"/><path fill="#ffffff" d="M29.2 9h6.4l3 15q0 5-4.2 5t-4.2-5Z"/><path fill="#ff7a00" d="M35.6 9H42l5 15q0 5-4.2 5t-4.2-5Z"/></svg>',
    customise: '<svg viewBox="0 0 52 52" aria-hidden="true"><path d="m17 9-10 5-4 10 9 4 3-6v23h22V22l3 6 9-4-4-10-10-5a9 9 0 0 1-18 0Z"/><path class="accent sparkle sparkle-chest" d="M21 29h10M26 24v10"/><path class="accent sparkle sparkle-shoulder" d="m39 5 1.5 4.5L45 11l-4.5 1.5L39 17l-1.5-4.5L33 11l4.5-1.5Z"/></svg>',
    filters: '<svg viewBox="0 0 52 52" aria-hidden="true"><path d="M12 6v40M26 6v40M40 6v40"/><rect class="orange-fill filter-level level-one" x="7" y="14" width="10" height="8" rx="3"/><rect class="surface-fill filter-level level-two" x="21" y="30" width="10" height="8" rx="3"/><rect class="orange-fill filter-level level-three" x="35" y="10" width="10" height="8" rx="3"/></svg>',
    chat: '<svg viewBox="0 0 52 52" aria-hidden="true"><path class="orange-fill" d="M28 23h12a8 8 0 0 1 8 8v6a7 7 0 0 1-5 7l1 6-8-6h-8a8 8 0 0 1-8-8v-5a8 8 0 0 1 8-8Z"/><path class="surface-fill" d="M12 6h22a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H19l-9 8 1-8a8 8 0 0 1-7-8V14a8 8 0 0 1 8-8Z"/><circle class="chat-dot dot-1" cx="15" cy="20" r="1.8" fill="currentColor" stroke="none"/><circle class="chat-dot dot-2" cx="23" cy="20" r="1.8" fill="currentColor" stroke="none"/><circle class="chat-dot dot-3" cx="31" cy="20" r="1.8" fill="currentColor" stroke="none"/></svg>',
    /* Bundles B is the icon the source bar shows in the slot (pointed base, centre line). */
    bundles: '<svg class="bundle-three" viewBox="0 0 104 108" aria-hidden="true"><g stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path class="surface-fill" d="M13 17 5 21 1 30l8 5 5-6v30h19V29l4 6 7-5-5-9-8-4c-4 5-13 5-18 0Z"/><path d="M14 17c2 9 14 9 17 0"/><path fill="currentColor" d="m42 9 8-2 6 9 6-9 9 2-3 14c0 5 1 9 5 12v27H39V35c4-3 5-7 5-12Z"/><path class="bundle-detail" d="m43 12 7-2 6 12 7-12 6 2M56 22v34M44 15c2 10 1 15-3 19M68 15c-2 10-1 15 3 19"/><path class="bundle-band" d="M41 41h30v5H41z"/><path fill="currentColor" d="M79 13h17l3 48H88l-2-25-3 25H73Z"/><path class="bundle-band" d="M79 16h16v3H79z"/></g><g stroke-width="2" stroke-linejoin="round"><path class="orange-fill" d="m12 57 39 11 38-11v30l-38 18-39-18Z"/><path d="M51 68v37"/><path class="orange-fill" d="m12 48 39 12-5 13L3 59Zm77 0L51 60l5 13 42-14Z"/></g></svg>'
};

function ensureBukNavCss() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    for (let i = 0; i < links.length; i += 1) {
        if ((links[i].getAttribute('href') || '').indexOf('bottom-nav.css') !== -1) return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = BUK_NAV_CSS;
    document.head.appendChild(link);
}

function bukLabel(item) {
    if (!item) return '';
    const label = item.querySelector('.nav-label, .nav-item-label');
    return (label ? label.textContent : '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function findBukSlot(nav, names) {
    const wanted = names.map((name) => name.toLowerCase());
    return Array.from(nav.querySelectorAll(':scope > a, :scope > button')).find((item) => wanted.indexOf(bukLabel(item)) !== -1) || null;
}

function currentBukSection() {
    const path = (window.location.pathname || '/').replace(/\\/g, '/').toLowerCase();
    const file = path.split('/').filter(Boolean).pop() || '';
    if (path.indexOf('/bundle-configurator') !== -1 || file === 'bundles.html' || file === 'bundles') return 'bundles';
    if (file.indexOf('shop-categories-mobile') !== -1 || file.indexOf('shop-mobile') !== -1 || file === 'shop.html' || file === 'shop') return 'shop';
    if (file === 'index-mobile.html' || file === 'home-mobile.html' || file === 'index.html' || file === '') return 'home';
    return '';
}

function bukIcon(name) {
    const span = document.createElement('span');
    span.className = 'nav-icon';
    if (name === 'bundles') span.setAttribute('data-bundle', '');
    span.innerHTML = BUK_ICONS[name] || '';
    return span;
}

function bukText(text) {
    const span = document.createElement('span');
    span.className = 'nav-label';
    span.textContent = text;
    return span;
}

function readBukCentre(nav) {
    const filters = nav.querySelector('#bundleFiltersNav, #filtersNavBtn')
        || findBukSlot(nav, ['filter', 'filters']);
    if (filters) {
        return {
            kind: 'filters',
            id: filters.id || 'filtersNavBtn',
            ariaLabel: filters.getAttribute('aria-label') || 'Filters',
            haspopup: filters.getAttribute('aria-haspopup') || '',
            controls: filters.getAttribute('aria-controls') || '',
            expanded: filters.getAttribute('aria-expanded') || 'false'
        };
    }
    const custom = nav.querySelector('#customiseNavBtn, [data-start-sheet-trigger]');
    if (custom || !/bundle-configurator/i.test(window.location.pathname)) {
        return {
            kind: 'customise',
            id: (custom && custom.id) || 'customiseNavBtn',
            controls: (custom && custom.getAttribute('aria-controls')) || 'startSheet',
            expanded: (custom && custom.getAttribute('aria-expanded')) || 'false'
        };
    }
    return {
        kind: 'filters',
        id: 'bundleFiltersNav',
        ariaLabel: 'Open bundle filters',
        haspopup: 'dialog',
        controls: 'bundleRadial',
        expanded: 'false'
    };
}

function makeBukCentre(spec, countNode) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-item';
    button.setAttribute('data-nav-action', '');
    button.id = spec.id;
    const icon = bukIcon(spec.kind === 'filters' ? 'filters' : 'customise');
    if (spec.id === 'bundleFiltersNav') icon.classList.add('nav-customise-icon');
    if (spec.kind === 'customise') {
        button.setAttribute('data-start-sheet-trigger', '');
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-expanded', spec.expanded || 'false');
        button.setAttribute('aria-controls', spec.controls || 'startSheet');
    } else {
        button.setAttribute('aria-label', spec.ariaLabel || 'Filters');
        if (spec.haspopup) button.setAttribute('aria-haspopup', spec.haspopup);
        if (spec.controls) button.setAttribute('aria-controls', spec.controls);
        button.setAttribute('aria-expanded', spec.expanded || 'false');
    }
    button.append(icon, bukText(spec.kind === 'filters' ? 'Filters' : 'Customise'));
    if (countNode) button.append(countNode);
    return button;
}

function makeBukSwap(countNode) {
    const slot = document.createElement('div');
    slot.className = 'nav-slot nav-slot-swap';
    const customise = document.createElement('button');
    customise.type = 'button';
    customise.id = 'customiseNavBtn';
    customise.className = 'nav-item swap-button customise-button';
    customise.setAttribute('data-nav-action', '');
    customise.setAttribute('data-start-sheet-trigger', '');
    customise.setAttribute('aria-haspopup', 'dialog');
    customise.setAttribute('aria-expanded', 'false');
    customise.setAttribute('aria-controls', 'startSheet');
    customise.append(bukIcon('customise'), bukText('Customise'));
    const filters = document.createElement('button');
    filters.type = 'button';
    filters.id = 'bundleFiltersNav';
    filters.className = 'nav-item swap-button filters-button';
    filters.setAttribute('data-nav-action', '');
    filters.setAttribute('aria-label', 'Open bundle filters');
    filters.setAttribute('aria-haspopup', 'dialog');
    filters.setAttribute('aria-expanded', 'false');
    filters.setAttribute('aria-controls', 'bundleRadial');
    filters.setAttribute('aria-hidden', 'true');
    filters.tabIndex = -1;
    filters.disabled = true;
    const icon = bukIcon('filters');
    icon.classList.add('nav-customise-icon');
    filters.append(icon, bukText('Filters'));
    if (countNode) filters.append(countNode);
    slot.append(customise, filters);
    return slot;
}

function setBundlesContext(nav, on) {
    if (!nav) return;
    nav.classList.toggle('is-bundles', on);
    const customise = nav.querySelector('.customise-button');
    const filters = nav.querySelector('.filters-button');
    if (customise) {
        customise.disabled = !!on;
        customise.tabIndex = on ? -1 : 0;
        if (on) customise.setAttribute('aria-hidden', 'true');
        else customise.removeAttribute('aria-hidden');
    }
    if (filters) {
        filters.disabled = !on;
        filters.tabIndex = on ? 0 : -1;
        filters.classList.toggle('is-context-active', on);
        if (on) filters.removeAttribute('aria-hidden');
        else filters.setAttribute('aria-hidden', 'true');
    }
}

const NAV_SWAP_MS = 540;
let swapUntil = 0;

function armSwap() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        swapUntil = 0;
        return;
    }
    swapUntil = performance.now() + NAV_SWAP_MS;
}

function whenSettled(callback) {
    const wait = swapUntil - performance.now();
    if (wait > 16) window.setTimeout(callback, wait);
    else callback();
}

function makeBukLink(href, section, label, iconName, extra) {
    const link = document.createElement('a');
    link.className = 'nav-item';
    link.href = href;
    if (section) link.dataset.section = section;
    if (section === 'home') link.setAttribute('data-home-nav', '');
    if (section === 'bundles') link.setAttribute('aria-label', 'Limited Bundles');
    if (extra) {
        if (extra.target) link.target = extra.target;
        if (extra.rel) link.rel = extra.rel;
    }
    link.append(bukIcon(iconName), bukText(label));
    return link;
}

/* Chat opens the in-page support panel (whatsapp.js openPopup / window.openBrandedChat).
   It must not be a wa.me link: pages that do not load that script would otherwise leave the site. */
function makeBukChat() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-item';
    button.setAttribute('data-open-whatsapp', '');
    button.setAttribute('data-nav-action', '');
    button.setAttribute('aria-label', 'Chat');
    button.append(bukIcon('chat'), bukText('Chat'));
    return button;
}

function ensureBrandedChat() {
    if (typeof window.openBrandedChat === 'function') return Promise.resolve();
    if (!document.querySelector('link[href*="whatsapp.css"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = '/mobile/css/whatsapp.css?v=20261116-slimchat';
        document.head.appendChild(css);
    }
    const existing = document.querySelector('script[src*="whatsapp.js"]');
    if (existing && typeof window.openBrandedChat === 'function') return Promise.resolve();
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = '/mobile/js/whatsapp.js?v=20261116-prechat';
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.body.appendChild(script);
    });
}

function syncBukActive(nav) {
    const section = currentBukSection();
    if (section) nav.dataset.active = section;
    else delete nav.dataset.active;
    nav.querySelectorAll('.nav-item').forEach((item) => {
        const selected = !item.hasAttribute('data-nav-action') && item.dataset.section === section && section !== '';
        item.classList.toggle('active', selected);
        if (selected) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
    });
}

function upgradeBukNav(nav) {
    if (!nav) return;
    nav.classList.add('bottom-nav', 'bottom-nav--v2', 'buk-nav', 'nav', 'dark');
    nav.style.removeProperty('--page');
    const built = nav.classList.contains('buk-nav') && nav.querySelector(':scope > .indicator') && nav.querySelector('[data-section]');
    if (built) {
        nav.querySelectorAll(':scope > .mobile-nav__indicator').forEach((node) => node.remove());
        syncBukActive(nav);
        mountCentreFaces(nav);
        return;
    }

    const homeNode = nav.querySelector('[data-home-nav]') || findBukSlot(nav, ['home']);
    const shopNode = findBukSlot(nav, ['shop']);
    const bundlesNode = findBukSlot(nav, ['bundles']);
    const centre = readBukCentre(nav);
    const count = nav.querySelector('#bundleFilterCount');
    if (count) count.remove();

    const homeHref = (homeNode && homeNode.getAttribute('href')) || '/index-mobile.html?force=mobile';
    const shopHref = (shopNode && shopNode.getAttribute('href')) || '/mobile/shop-categories-mobile.html?force=mobile';
    const bundlesHref = (bundlesNode && bundlesNode.getAttribute('href')) || '/bundle-configurator/?force=mobile';

    nav.classList.add('bottom-nav', 'bottom-nav--v2', 'buk-nav', 'nav', 'dark');
    nav.classList.remove('mobile-nav');
    nav.style.removeProperty('--indicator-x');
    while (nav.firstChild) nav.removeChild(nav.firstChild);

    const indicator = document.createElement('span');
    indicator.className = 'indicator';
    indicator.setAttribute('aria-hidden', 'true');
    nav.append(
        indicator,
        makeBukLink(homeHref, 'home', 'Home', 'home'),
        makeBukLink(shopHref, 'shop', 'Shop', 'shop'),
        makeBukSwap(count),
        makeBukLink(bundlesHref, 'bundles', 'Bundles', 'bundles'),
        makeBukChat()
    );
    if (count && centre.kind !== 'filters' && !count.parentNode) {
        const filters = nav.querySelector('#bundleFiltersNav, #filtersNavBtn');
        if (filters) filters.append(count);
    }
    syncBukActive(nav);
    mountCentreFaces(nav);
}

function upgradeAllBukNavs() {
    document.querySelectorAll('nav.bottom-nav').forEach(upgradeBukNav);
}

const BUK_Z_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const BUK_Z_BACK_KEY = 'buk-z-back';
const BUK_Z_MS = 500;

function pageKeyFromUrl(url) {
    let path = '';
    try {
        path = new URL(url, window.location.href).pathname.toLowerCase();
    } catch (error) {
        return '';
    }
    if (path.indexOf('bundle-configurator') !== -1) return 'bundles';
    if (path.indexOf('shop-categories-mobile') !== -1) return 'shop';
    if (path.indexOf('index-mobile') !== -1 || path.indexOf('home-mobile') !== -1 || path === '/' || path === '') return 'home';
    return '';
}

const CENTRE_SWAP_MS = 320;

function centreFace(kind) {
    const face = document.createElement('span');
    face.className = 'nav-centre-face';
    face.dataset.centre = kind;
    const icon = bukIcon(kind === 'filters' ? 'filters' : 'customise');
    if (kind === 'filters') icon.classList.add('nav-customise-icon');
    face.append(icon, bukText(kind === 'filters' ? 'Filters' : 'Customise'));
    return face;
}

function applyCentreIdentity(button, kind) {
    button.dataset.centre = kind;
    button.querySelectorAll('.nav-centre-face').forEach((face) => {
        face.setAttribute('aria-hidden', face.dataset.centre === kind ? 'false' : 'true');
    });
    const locked = button.dataset.centreLock === 'filters';
    if (!locked && kind === 'customise') {
        button.id = 'customiseNavBtn';
        button.setAttribute('data-start-sheet-trigger', '');
        button.setAttribute('aria-controls', 'startSheet');
        button.removeAttribute('aria-label');
    } else if (!locked) {
        button.id = 'bundleFiltersNav';
        button.removeAttribute('data-start-sheet-trigger');
        button.setAttribute('aria-label', 'Filters');
        button.setAttribute('aria-controls', 'bundleRadial');
    }
    button.setAttribute('aria-haspopup', 'dialog');
    if (!button.getAttribute('aria-expanded')) button.setAttribute('aria-expanded', 'false');
}

function swapCentre(nav, kind) {
    const button = nav && nav.querySelector(':scope > .nav-centre');
    if (!button) return;
    const incoming = button.querySelector('.nav-centre-face[data-centre="' + kind + '"]');
    const outgoing = button.querySelector('.nav-centre-face.is-current');
    if (!incoming || !outgoing || button.dataset.centre === kind) {
        applyCentreIdentity(button, kind);
        return;
    }
    incoming.classList.remove('is-current', 'is-leaving');
    incoming.classList.add('is-below');
    incoming.getBoundingClientRect();
    outgoing.classList.remove('is-current');
    outgoing.classList.add('is-leaving');
    incoming.classList.remove('is-below');
    incoming.classList.add('is-current');
    applyCentreIdentity(button, kind);
}

function mountCentreFaces(nav) {
    if (nav.querySelector('.nav-slot-swap')) {
        if (currentPageKey() === 'bundles' && !nav.classList.contains('is-bundles')) {
            window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
                nav.classList.remove('is-positioning', 'instant');
                setBundlesContext(nav, true);
            }));
        } else if (nav.classList.contains('is-bundles')) {
            setBundlesContext(nav, true);
        }
        return;
    }
    const button = nav.querySelector(':scope > #customiseNavBtn, :scope > #bundleFiltersNav, :scope > #filtersNavBtn');
    if (!button || button.querySelector('.nav-centre-face')) return;
    const kind = button.id === 'customiseNavBtn' ? 'customise' : 'filters';
    if (button.id === 'bundleFiltersNav') button.dataset.centreLock = 'filters';
    button.classList.add('nav-centre', 'nav-centre--instant');
    const current = document.createElement('span');
    current.className = 'nav-centre-face is-current';
    current.dataset.centre = kind;
    while (button.firstChild) current.appendChild(button.firstChild);
    const otherKind = kind === 'filters' ? 'customise' : 'filters';
    const other = centreFace(otherKind);
    if (kind === 'filters') {
        button.append(other, current);
        applyCentreIdentity(button, 'filters');
        button.classList.remove('nav-centre--instant');
        return;
    }
    if (kind === 'customise') button.append(current, other);
    else button.append(other, current);
    applyCentreIdentity(button, kind);
    window.requestAnimationFrame(() => button.classList.remove('nav-centre--instant'));
}

function ensureZRoot() {
    let root = document.getElementById('buk-z-root');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'buk-z-root';
    root.className = 'buk-z-root';
    const skip = (node) => {
        if (!node || node.nodeType !== 1) return false;
        return node.matches('nav.bottom-nav, .buk-z-frame, .wa-popup, .start-sheet');
    };
    const children = Array.from(document.body.childNodes);
    children.forEach((node) => {
        if (skip(node)) return;
        root.appendChild(node);
    });
    document.body.insertBefore(root, document.body.firstChild);
    return root;
}

const bukZWarm = new Map();
let bukZPlaying = false;
let bukZCurrent = null;
let bukZPrevious = null;

function currentPageKey() {
    if (bukZCurrent && bukZCurrent.key) return bukZCurrent.key;
    return pageKeyFromUrl(window.location.href);
}

function closeChatPanel() {
    if (typeof window.closeBrandedChat === 'function') {
        window.closeBrandedChat();
        return;
    }
    const popup = document.getElementById('waPopup');
    if (!popup) return;
    popup.classList.remove('is-active', 'is-minimized');
    popup.setAttribute('aria-hidden', 'true');
}

function dismissOtherBarSurfaces(item) {
    const isChat = item.hasAttribute('data-open-whatsapp');
    const isCustomise = item.hasAttribute('data-start-sheet-trigger') || item.id === 'customiseNavBtn';
    const isFilters = item.id === 'filtersNavBtn' || item.id === 'bundleFiltersNav';
    if (!isChat) closeChatPanel();
    if (!isCustomise && typeof window.__brandedCloseStartSheet === 'function') {
        window.__brandedCloseStartSheet(false);
    }
    if (!isFilters) {
        if (typeof window.__brandedCloseFilters === 'function') window.__brandedCloseFilters();
        document.dispatchEvent(new CustomEvent('buk-close-filters'));
    }
}

function fillCircleIcon(circle, item) {
    if (!circle || !item) return;
    let holder = circle.querySelector(':scope > .indicator-icon');
    if (!holder) {
        holder = document.createElement('span');
        holder.className = 'indicator-icon';
        circle.appendChild(holder);
    }
    const svg = item.querySelector('.nav-centre-face.is-current .nav-icon svg')
        || item.querySelector(':scope > .nav-icon svg')
        || item.querySelector('.nav-icon svg');
    holder.replaceChildren();
    if (svg) holder.appendChild(svg.cloneNode(true));
}

const CENTRE_DOWN_MS = 180;
const CENTRE_UP_MS = 200;

function centreButton(nav) {
    return nav && nav.querySelector(':scope > .nav-centre, :scope > #customiseNavBtn, :scope > #bundleFiltersNav');
}

function whenTravelDone(el, done) {
    let ran = false;
    const run = () => {
        if (ran) return;
        ran = true;
        done();
    };
    if (!el) {
        window.setTimeout(run, CENTRE_DOWN_MS);
        return;
    }
    const onEnd = (event) => {
        const name = event.propertyName || event.animationName || '';
        if (name !== 'transform' && name !== 'buk-filters-down' && name !== 'buk-hole-down') return;
        el.removeEventListener('transitionend', onEnd);
        el.removeEventListener('animationend', onEnd);
        run();
    };
    el.addEventListener('transitionend', onEnd);
    el.addEventListener('animationend', onEnd);
    window.setTimeout(() => {
        const raw = getComputedStyle(el).transform;
        const y = raw && raw !== 'none' ? new DOMMatrix(raw).m42 : 0;
        if (y > 70) run();
    }, CENTRE_DOWN_MS + 40);
    window.setTimeout(run, 700);
}

function lowerCurrentCentre(nav) {
    const button = centreButton(nav);
    if (!button) return;
    const current = button.querySelector('.nav-centre-face.is-current');
    if (!current) return;
    current.classList.remove('is-current');
    current.classList.add('is-leaving');
}

function ensureFiltersCircle(face) {
    let circle = face.querySelector(':scope > .indicator-filters');
    if (!circle) {
        circle = document.createElement('span');
        circle.className = 'indicator-filters';
        circle.setAttribute('aria-hidden', 'true');
        face.insertBefore(circle, face.firstChild);
    }
    fillCircleIcon(circle, face);
    return circle;
}

function raiseFiltersCircle(nav) {
    if (!nav || nav.dataset.filtersShown === '1') return;
    const button = centreButton(nav);
    const face = button && button.querySelector('.nav-centre-face[data-centre="filters"]');
    if (!face) return;
    nav.dataset.filtersShown = '1';
    face.classList.remove('is-leaving');
    face.style.transition = 'none';
    face.style.transform = 'translateY(120px)';
    ensureFiltersCircle(face);
    button.classList.add('has-slot-circle');
    face.classList.add('is-current');
    nav.classList.add('has-filters-circle', 'filters-swap');
    face.getBoundingClientRect();
    face.style.transition = 'transform ' + CENTRE_UP_MS + 'ms cubic-bezier(0.4, 0, 0.2, 1)';
    face.style.transform = 'translateY(0)';
}

function dropFiltersThenCustomise(nav) {
    if (!nav || nav.dataset.filtersLeaving === '1') return;
    nav.dataset.filtersLeaving = '1';
    nav.classList.add('filters-leave');
    const rise = nav.querySelector('.centre-rise');
    whenTravelDone(rise, () => {
        const button = centreButton(nav);
        nav.classList.remove('has-filters-circle', 'filters-leave', 'filters-swap', 'filters-risen', 'filters-armed');
        if (button) button.classList.remove('has-slot-circle');
        const filtersFace = button && button.querySelector('.nav-centre-face[data-centre="filters"]');
        const customiseFace = button && button.querySelector('.nav-centre-face[data-centre="customise"]');
        if (filtersFace) {
            filtersFace.classList.remove('is-current', 'is-leaving');
            filtersFace.style.transform = '';
            filtersFace.style.transition = '';
        }
        if (customiseFace) {
            customiseFace.classList.remove('is-leaving');
            customiseFace.style.transition = 'none';
            customiseFace.style.transform = 'translateY(120px)';
            customiseFace.classList.add('is-current');
            customiseFace.getBoundingClientRect();
            customiseFace.style.transition = 'transform ' + CENTRE_UP_MS + 'ms cubic-bezier(0.4, 0, 0.2, 1)';
            customiseFace.style.transform = 'translateY(0)';
        }
        if (button && button.dataset.centreLock !== 'filters') applyCentreIdentity(button, 'customise');
        delete nav.dataset.filtersShown;
    });
}

function startFiltersRise() {
    return;
}

function startCustomiseRise() {
    const root = document.documentElement;
    if (!root.classList.contains('buk-rise-customise') || root.dataset.customiseRise === '1') return;
    root.dataset.customiseRise = '1';
    try { sessionStorage.removeItem('buk-centre-enter'); } catch (error) { /* ignore */ }
    const run = () => {
        root.classList.add('buk-customise-armed');
        window.setTimeout(() => {
            root.classList.add('buk-customise-risen');
            const face = document.querySelector('.nav-centre-face.is-current[data-centre="customise"]');
            const clear = () => {
                root.classList.remove('buk-rise-customise', 'buk-customise-armed', 'buk-customise-risen');
            };
            if (!face) {
                window.setTimeout(clear, 320);
                return;
            }
            const onEnd = (event) => {
                if (event.propertyName !== 'transform') return;
                face.removeEventListener('transitionend', onEnd);
                clear();
            };
            face.addEventListener('transitionend', onEnd);
            window.setTimeout(clear, 360);
        }, 32);
    };
    window.requestAnimationFrame(run);
    window.setTimeout(run, 48);
}

function syncFiltersCircle(nav) {
    if (!nav) return;
    return;
    const button = nav.querySelector(':scope > #bundleFiltersNav, :scope > #customiseNavBtn, :scope > #filtersNavBtn');
    const face = button && button.querySelector('.nav-centre-face.is-current[data-centre="filters"]');
    const show = !!(button && (face || (button.id === 'bundleFiltersNav' && !button.querySelector('.nav-centre-face'))));
    nav.classList.toggle('has-filters-circle', show);
    if (!button) return;
    button.classList.toggle('has-slot-circle', show);
    let circle = button.querySelector('.indicator-filters');
    if (!show) return;
    if (!circle) {
        circle = document.createElement('span');
        circle.className = 'indicator-filters';
        circle.setAttribute('aria-hidden', 'true');
        button.appendChild(circle);
    }
    fillCircleIcon(circle, button);
    startFiltersRise(nav);
}

function visibleBundleFrame() {
    const frame = document.querySelector('iframe.buk-z-frame[aria-hidden="false"]');
    if (!frame || !frame.contentWindow) return null;
    let doc = null;
    try {
        doc = frame.contentDocument;
    } catch (error) {
        return null;
    }
    if (!doc || !doc.getElementById('bundleRadial')) return null;
    return { frame, doc, inner: doc.getElementById('bundleFiltersNav') };
}

function hideEmbeddedNav(frame) {
    try {
        const doc = frame.contentDocument;
        if (!doc || !doc.head) return;
        const style = doc.createElement('style');
        style.textContent = 'nav.bottom-nav{display:none!important}';
        doc.head.appendChild(style);
    } catch (error) {
        /* same-origin only */
    }
}

function warmSharedZ(href) {
    const key = pageKeyFromUrl(href);
    if (!key || bukZWarm.has(href)) return;
    if ((bukZPrevious && bukZPrevious.key === key) || (bukZCurrent && bukZCurrent.key === key)) return;
    const frame = document.createElement('iframe');
    frame.className = 'buk-z-frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    frame.style.zIndex = '1';
    const ready = new Promise((resolve, reject) => {
        let settled = false;
        const finish = () => {
            if (settled) return;
            try {
                const doc = frame.contentDocument;
                if (!doc || (doc.readyState !== 'interactive' && doc.readyState !== 'complete')) return;
            } catch (error) {
                return;
            }
            settled = true;
            window.clearTimeout(timer);
            window.clearInterval(poll);
            hideEmbeddedNav(frame);
            window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve(frame)));
        };
        const timer = window.setTimeout(() => {
            if (settled) return;
            settled = true;
            window.clearInterval(poll);
            reject(new Error('slow'));
        }, 12000);
        const poll = window.setInterval(finish, 40);
        frame.addEventListener('load', finish);
        frame.addEventListener('error', () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            window.clearInterval(poll);
            reject(new Error('load'));
        });
    });
    frame.src = href;
    document.body.appendChild(frame);
    bukZWarm.set(href, { key, url: href, el: frame, kind: 'frame', ready });
}

function pinRoot(el) {
    if (!el || el.classList.contains('buk-z-frame')) return;
    el.classList.add('buk-z-fixed');
}

function playLayer(el, name, ms, zIndex) {
    el.style.visibility = 'visible';
    el.style.pointerEvents = 'none';
    el.style.zIndex = String(zIndex);
    el.style.transformOrigin = 'center center';
    el.style.animation = 'none';
    el.getBoundingClientRect();
    el.style.animation = name + ' ' + ms + 'ms ' + BUK_Z_EASE + ' forwards';
}

function settleLayer(el, visible) {
    el.style.animation = 'none';
    el.style.transform = 'none';
    el.style.opacity = visible ? '1' : '0';
    el.style.pointerEvents = visible ? 'auto' : 'none';
    el.style.visibility = visible ? 'visible' : 'hidden';
    el.style.zIndex = visible ? '2' : '1';
    if (el.classList.contains('buk-z-frame')) {
        el.setAttribute('aria-hidden', visible ? 'false' : 'true');
    } else if (visible) {
        el.classList.remove('buk-z-fixed');
    }
}

function loadBarPage(href) {
    const next = new URL(href, window.location.href);
    try {
        const here = new URL(window.location.href);
        if (here.searchParams.get('force') === 'mobile' && !next.searchParams.has('force')) {
            next.searchParams.set('force', 'mobile');
        }
        if (pageKeyFromUrl(next.href) === 'bundles' && pageKeyFromUrl(here.href) !== 'bundles') {
            sessionStorage.setItem('buk-filters-settled', '1');
        }
    } catch (error) {
        /* keep the link address */
    }
    window.location.assign(next.href);
}

async function playSharedZ(href, pop) {
    const key = pageKeyFromUrl(href);
    if (!key) {
        window.location.assign(href);
        return;
    }
    if (bukZPlaying) return;
    bukZPlaying = true;
    const hostNav = document.querySelector('nav.bottom-nav.buk-nav');
    if (hostNav) swapCentre(hostNav, key === 'bundles' ? 'filters' : 'customise');
    const fromKey = pageKeyFromUrl(window.location.href) || (bukZCurrent && bukZCurrent.key) || 'home';
    const reverse = key === sessionStorage.getItem(BUK_Z_BACK_KEY);
    const ms = BUK_Z_MS;
    try {
        if (!bukZCurrent) {
            bukZCurrent = { key: fromKey, url: window.location.href, el: ensureZRoot(), kind: 'root' };
        }
        let incoming = null;
        if (bukZPrevious && bukZPrevious.key === key) incoming = bukZPrevious;
        if (!incoming) {
            warmSharedZ(href);
            const warmed = bukZWarm.get(href);
            incoming = { key, url: href, el: await warmed.ready, kind: 'frame' };
            bukZWarm.delete(href);
        }
        const outgoing = bukZCurrent;
        if (outgoing.el === incoming.el) {
            bukZPlaying = false;
            return;
        }
        pinRoot(outgoing.el);
        pinRoot(incoming.el);
        sessionStorage.setItem(BUK_Z_BACK_KEY, outgoing.key);
        playLayer(outgoing.el, reverse ? 'bukZOutRev' : 'bukZOutFwd', ms, reverse ? 2 : 4);
        playLayer(incoming.el, reverse ? 'bukZInRev' : 'bukZInFwd', ms, reverse ? 4 : 2);
        await new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                outgoing.el.removeEventListener('animationend', onEnd);
                incoming.el.removeEventListener('animationend', onEnd);
                resolve();
            };
            let left = 2;
            const onEnd = (event) => {
                if (event.target !== outgoing.el && event.target !== incoming.el) return;
                left -= 1;
                if (left <= 0) finish();
            };
            outgoing.el.addEventListener('animationend', onEnd);
            incoming.el.addEventListener('animationend', onEnd);
            const started = performance.now();
            const watch = () => {
                if (settled) return;
                const anims = outgoing.el.getAnimations().concat(incoming.el.getAnimations());
                const held = anims.some((anim) => anim.playState === 'running' || anim.playState === 'paused');
                if (held && performance.now() - started < ms + 8000) {
                    window.setTimeout(watch, 80);
                    return;
                }
                finish();
            };
            window.setTimeout(watch, ms + 80);
        });
        settleLayer(outgoing.el, false);
        settleLayer(incoming.el, true);
        if (bukZPrevious && bukZPrevious !== outgoing && bukZPrevious !== incoming && bukZPrevious.kind === 'frame') {
            bukZPrevious.el.remove();
        }
        bukZPrevious = outgoing;
        bukZCurrent = incoming;
        if (!pop) history.pushState({ bukZ: key }, '', href);
        try {
            if (incoming.kind === 'frame' && incoming.el.contentDocument && incoming.el.contentDocument.title) {
                document.title = incoming.el.contentDocument.title;
            }
        } catch (error) {
            /* title is optional */
        }
    } catch (error) {
        window.location.assign(href);
    } finally {
        bukZPlaying = false;
    }
}

window.addEventListener('popstate', () => {
    const key = pageKeyFromUrl(window.location.href);
    if (!key || bukZPlaying || !bukZCurrent) return;
    playSharedZ(window.location.href, true);
});

function initBukNav(nav) {
    if (!nav) return null;
    const indicator = nav.querySelector(':scope > .indicator');
    if (!indicator) return null;
    nav.style.removeProperty('--page');
    const items = [...nav.querySelectorAll('.nav-item')];
    let activeItem = items.find((item) => item.classList.contains('active') && !item.hasAttribute('data-nav-action')) || null;
    let frame;

    function readXDuration() {
        const style = getComputedStyle(nav);
        const props = style.transitionProperty.split(',').map((part) => part.trim());
        const durations = style.transitionDuration.split(',').map((part) => part.trim());
        const index = props.indexOf('--x');
        const raw = (index >= 0 ? durations[index] : durations[durations.length - 1]) || '0s';
        if (raw.endsWith('ms')) return parseFloat(raw) || 0;
        if (raw.endsWith('s')) return (parseFloat(raw) || 0) * 1000;
        return 0;
    }

    let slideUntil = 0;

    function positionIndicator(instant) {
        if (!activeItem || nav.getBoundingClientRect().width === 0) return;
        const svg = activeItem.querySelector('.nav-centre-face.is-current .nav-icon svg')
            || activeItem.querySelector('.nav-icon svg');
        if (!svg) return;
        const width = indicator.offsetWidth || indicator.getBoundingClientRect().width;
        if (!width) {
            frame = requestAnimationFrame(() => positionIndicator(instant));
            return;
        }
        if (instant) {
            cancelAnimationFrame(frame);
            nav.classList.add('instant', 'is-positioning');
        } else {
            nav.classList.remove('instant', 'is-positioning');
        }
        indicator.getBoundingClientRect();
        const buttonRect = activeItem.getBoundingClientRect();
        const currentX = parseFloat(getComputedStyle(nav).getPropertyValue('--x')) || 0;
        const originLeft = indicator.getBoundingClientRect().left - currentX;
        const x = buttonRect.left + buttonRect.width / 2 - width / 2 - originLeft;
        if (!instant) slideUntil = performance.now() + readXDuration();
        nav.style.setProperty('--x', x + 'px');
        nav.classList.add('ready', 'is-ready');
        if (instant) {
            indicator.getBoundingClientRect();
            frame = requestAnimationFrame(() => nav.classList.remove('instant', 'is-positioning'));
        }
    }

    const resizeObserver = new ResizeObserver(() => {
        if (performance.now() < slideUntil) return;
        positionIndicator(true);
    });
    resizeObserver.observe(nav);
    if (activeItem) positionIndicator(true);

    function showOnItem(item, animate) {
        activeItem = item;
        items.forEach((candidate) => {
            const selected = candidate === item;
            candidate.classList.toggle('active', selected);
            if (!selected) candidate.removeAttribute('aria-current');
        });
        positionIndicator(!animate);
    }

    let arriveToken = 0;

    function whenArrived(startX, callback) {
        const token = ++arriveToken;
        const target = parseFloat(nav.style.getPropertyValue('--x')) || 0;
        if (Math.abs(target - startX) < 0.5) {
            callback();
            return;
        }
        let finished = false;
        const finish = () => {
            nav.removeEventListener('transitionend', onEnd);
            window.clearTimeout(timer);
            if (finished || token !== arriveToken) return;
            finished = true;
            callback();
        };
        const onEnd = (event) => {
            if (event.target !== nav || event.propertyName !== '--x') return;
            finish();
        };
        nav.addEventListener('transitionend', onEnd);
        const started = performance.now();
        const timer = window.setTimeout(function check() {
            const slide = nav.getAnimations().find((anim) => anim.transitionProperty === '--x');
            if (slide && slide.playState === 'running' && performance.now() - started < 1200) {
                window.setTimeout(check, 50);
                return;
            }
            finish();
        }, readXDuration() + 60);
    }

    // Capture runs before the item's own click handler, so the panel or the
    // next page cannot open until the circle has finished travelling.
    nav.addEventListener('click', (event) => {
        const item = event.target.closest('.nav-item');
        if (!item || !nav.contains(item)) return;
        const isLink = item.tagName === 'A' && item.getAttribute('href');
        if (isLink && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
        if (isLink && item.target && item.target !== '_self') return;
        dismissOtherBarSurfaces(item);

        const opensLater = isLink
            || item.hasAttribute('data-open-whatsapp')
            || item.hasAttribute('data-start-sheet-trigger')
            || item.id === 'customiseNavBtn'
            || item.id === 'filtersNavBtn'
            || item.id === 'bundleFiltersNav';
        if (!opensLater) {
            showOnItem(item, true);
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        const destKey = isLink ? pageKeyFromUrl(item.href) : '';
        const customiseNow = item.querySelector('.nav-centre-face.is-current[data-centre="customise"]');
        const localRadial = document.getElementById('bundleRadial');
        if (item.id === 'bundleFiltersNav' && localRadial && !customiseNow) {
            const fanOpen = !localRadial.classList.contains('is-returning') && (
                localRadial.classList.contains('show')
                || localRadial.classList.contains('is-opening')
                || localRadial.classList.contains('is-armed')
            );
            if (typeof window.__bukOpenBundleFilters === 'function') {
                window.__bukOpenBundleFilters(!fanOpen);
            } else {
                item.dispatchEvent(new CustomEvent('buk-open-filters', { bubbles: true }));
            }
            return;
        }
        if (destKey === 'bundles' && currentPageKey() !== 'bundles') {
            setBundlesContext(nav, true);
            armSwap();
        } else if (nav.classList.contains('is-bundles') && destKey !== 'bundles') {
            setBundlesContext(nav, false);
            armSwap();
        }
        syncFiltersCircle(nav);
        const already = item.classList.contains('active');
        const startX = parseFloat(getComputedStyle(nav).getPropertyValue('--x')) || 0;
        const arrive = (action) => {
            if (already) {
                action();
                return;
            }
            showOnItem(item, true);
            whenArrived(startX, () => whenSettled(action));
        };

        if (isLink) {
            const href = item.href;
            arrive(() => {
                if (destKey && destKey === currentPageKey()) return;
                loadBarPage(href);
            });
            return;
        }
        if (item.hasAttribute('data-start-sheet-trigger') || item.id === 'customiseNavBtn') {
            const sheet = document.getElementById('startSheet');
            if (already && sheet && !sheet.hidden && typeof window.__brandedCloseStartSheet === 'function') {
                window.__brandedCloseStartSheet(true);
                return;
            }
            arrive(() => {
                if (typeof window.__brandedOpenStartSheet === 'function') window.__brandedOpenStartSheet(item);
            });
            return;
        }
        if (item.hasAttribute('data-open-whatsapp')) {
            arrive(() => {
                ensureBrandedChat().then(() => {
                    if (typeof window.openBrandedChat === 'function') window.openBrandedChat();
                });
            });
            return;
        }
        arrive(() => {
            const frame = document.querySelector('iframe.buk-z-frame[aria-hidden="false"]');
            const inner = frame && frame.contentDocument && (
                frame.contentDocument.getElementById('bundleFiltersNav')
                || frame.contentDocument.getElementById('filtersNavBtn')
            );
            if (inner && frame.contentWindow) {
                const icon = item.querySelector('.nav-centre-face.is-current .nav-icon') || item;
                const box = icon.getBoundingClientRect();
                const navBox = nav.getBoundingClientRect();
                frame.contentWindow.__bukFilterAnchor = {
                    left: box.left,
                    top: box.top,
                    width: box.width,
                    height: box.height,
                    navTop: navBox.top
                };
                inner.dispatchEvent(new CustomEvent('buk-open-filters'));
                return;
            }
            item.dispatchEvent(new CustomEvent('buk-open-filters'));
        });
    }, true);

    return {
        setActive(item) {
            if (!items.includes(item) || item.hasAttribute('data-nav-action')) return;
            activeItem = item;
            items.forEach((candidate) => {
                const selected = candidate === item;
                candidate.classList.toggle('active', selected);
                if (selected) candidate.setAttribute('aria-current', 'page');
                else candidate.removeAttribute('aria-current');
            });
            if (item.dataset.section) nav.dataset.active = item.dataset.section;
            positionIndicator(false);
        },
        destroy() {
            resizeObserver.disconnect();
            cancelAnimationFrame(frame);
        }
    };
}

function mountBukNavIndicators() {
    if (!window.__bukNavVisibilityBound) {
        window.__bukNavVisibilityBound = true;
        document.addEventListener('visibilitychange', () => {
            const state = document.hidden ? 'paused' : 'running';
            document.querySelectorAll('.buk-nav .chat-dot, .buk-nav .filter-level, .buk-nav .sparkle').forEach((el) => {
                el.style.animationPlayState = state;
            });
        });
    }
    let primary = null;
    document.querySelectorAll('nav.bottom-nav.buk-nav').forEach((nav) => {
        if (nav.__bukNav && typeof nav.__bukNav.destroy === 'function') nav.__bukNav.destroy();
        nav.__bukNav = initBukNav(nav);
        if (!primary && nav.__bukNav) primary = nav.__bukNav;
    });
    window.mobileNav = primary;
}

function initBottomNav() {
    const navItems = document.querySelectorAll('.bottom-nav:not(.buk-nav) .nav-item');
    const currentPage = window.location.pathname.split('/').pop() || 'home-mobile.html';

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            item.classList.add('active');
        } else if (item.id !== 'searchNavBtn') {
            item.classList.remove('active');
        }
    });
}

// ============================================
// CART COUNT
// ============================================
function getBasketTotalQty(basket) {
    let total = 0;
    (basket || []).forEach((item) => {
        const rawSizes = item?.sizes || item?.quantities;
        let sum = 0;
        if (Array.isArray(rawSizes)) {
            rawSizes.forEach((entry) => {
                sum += Number(entry?.qty ?? entry?.quantity ?? entry?.value) || 0;
            });
        } else if (rawSizes && typeof rawSizes === 'object') {
            Object.values(rawSizes).forEach((value) => {
                if (value && typeof value === 'object') {
                    sum += Number(value.qty ?? value.quantity ?? value.value) || 0;
                } else {
                    sum += Number(value) || 0;
                }
            });
        }
        if (sum > 0) total += sum;
        else total += Number(item?.qty ?? item?.quantity ?? item?.totalQty ?? item?.totalQuantity) || 0;
    });
    return total;
}

function updateCartCount() {
    const cartCountEl = document.getElementById('cartCount');
    if (!cartCountEl) return;

    try {
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        const totalItems = getBasketTotalQty(basket);

        cartCountEl.textContent = totalItems > 99 ? '99+' : String(totalItems);
        cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
    } catch (e) {
        cartCountEl.textContent = '0';
        cartCountEl.style.display = 'none';
    }
}

// Listen for storage changes
window.addEventListener('storage', updateCartCount);

// ============================================
// FILTERS PANEL (for shop page)
// ============================================
function initFilters() {
    const filterBtn = document.querySelector('.filter-btn');
    const filtersOverlay = document.querySelector('.filters-overlay');
    const filtersPanel = document.querySelector('.filters-panel');
    const filtersClose = document.querySelector('.filters-close');
    const filterApply = document.querySelector('.filter-apply-btn');
    const filterClear = document.querySelector('.filter-clear-btn');

    if (!filterBtn || !filtersPanel) return;

    function openFilters() {
        filtersPanel.classList.add('active');
        filtersOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeFilters() {
        filtersPanel.classList.remove('active');
        filtersOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    filterBtn.addEventListener('click', openFilters);
    filtersClose?.addEventListener('click', closeFilters);
    filtersOverlay?.addEventListener('click', closeFilters);
    filterApply?.addEventListener('click', closeFilters);
    filterClear?.addEventListener('click', () => {
        // Clear all filters
        document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    });
}

// ============================================
// PRODUCT GALLERY (for product page)
// ============================================
function initProductGallery() {
    const mainImage = document.querySelector('.product-main-image');
    const thumbnails = document.querySelectorAll('.thumb-img');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            if (mainImage) {
                mainImage.src = thumb.src;
            }
        });
    });

    // Swipe for gallery
    let touchStartX = 0;
    let touchEndX = 0;

    mainImage?.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });

    mainImage?.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
    });

    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        const activeThumb = document.querySelector('.thumb-img.active');
        let nextThumb;

        if (Math.abs(diff) < 50) return;

        if (diff > 0) {
            // Swipe left - next image
            nextThumb = activeThumb?.nextElementSibling || thumbnails[0];
        } else {
            // Swipe right - previous image
            nextThumb = activeThumb?.previousElementSibling || thumbnails[thumbnails.length - 1];
        }

        if (nextThumb) {
            nextThumb.click();
        }
    }
}

// ============================================
// COLOR & SIZE SELECTION
// ============================================
function initProductOptions() {
    // Colors
    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            colorSwatches.forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
    });

    // Sizes
    const sizeBtns = document.querySelectorAll('.size-btn');
    sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sizeBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // Quantity controls
    const qtyInput = document.querySelector('.qty-input');
    const qtyBtns = document.querySelectorAll('.qty-btn');

    qtyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!qtyInput) return;
            let val = parseInt(qtyInput.value) || 1;
            if (btn.textContent === '+') {
                val++;
            } else if (btn.textContent === '−' || btn.textContent === '-') {
                val = Math.max(1, val - 1);
            }
            qtyInput.value = val;
        });
    });
}

// ============================================
// CUSTOMIZATION PAGE
// ============================================
function initCustomization() {
    // Clipart tabs
    const clipartTabs = document.querySelectorAll('.clipart-tab');
    clipartTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            clipartTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Load clipart for this category
            loadClipart(tab.dataset.category);
        });
    });

    // Clipart selection
    const clipartItems = document.querySelectorAll('.clipart-item');
    clipartItems.forEach(item => {
        item.addEventListener('click', () => {
            clipartItems.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
        });
    });

    // Text colors
    const textColors = document.querySelectorAll('.text-color-btn');
    textColors.forEach(color => {
        color.addEventListener('click', () => {
            textColors.forEach(c => c.classList.remove('selected'));
            color.classList.add('selected');
        });
    });

    // Upload area
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    uploadArea?.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });
}

function loadClipart(category) {
    // Placeholder for loading clipart
    console.log('Loading clipart for:', category);
}

function handleFileUpload(file) {
    // Placeholder for file upload handling
    console.log('Uploading:', file.name);
    // Show progress bar, etc.
}

// ============================================
// ADD TO BASKET
// ============================================
function addToBasket(product) {
    try {
        let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        // Check if product already exists
        const existingIndex = basket.findIndex(item => 
            item.code === product.code && item.color === product.color
        );

        if (existingIndex > -1) {
            // Update quantities
            const existing = basket[existingIndex];
            if (product.quantities) {
                Object.keys(product.quantities).forEach(size => {
                    existing.quantities[size] = (existing.quantities[size] || 0) + product.quantities[size];
                });
            }
        } else {
            basket.push(product);
        }

        localStorage.setItem('quoteBasket', JSON.stringify(basket));
        updateCartCount();

        // Show confirmation
        showToast('Added to basket!');
    } catch (e) {
        console.error('Error adding to basket:', e);
    }
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, duration = 2000) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${message}</span>
    `;
    
    // Toast styles
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        background: '#1f2937',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '9999',
        animation: 'toastIn 0.3s ease'
    });

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Add toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes toastOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
`;
document.head.appendChild(style);

// ============================================
// PAGE-SPECIFIC INITIALIZATION
// ============================================
function initPage() {
    const path = window.location.pathname;
    
    if (path.includes('shop')) {
        initFilters();
    }
    
    if (path.includes('product')) {
        initProductGallery();
        initProductOptions();
    }
    
    if (path.includes('customize')) {
        initCustomization();
    }
}

// Run page-specific init
document.addEventListener('DOMContentLoaded', initPage);

// ============================================
// UPDATE CART BADGE (GLOBAL)
// ============================================
function updateLiveBadge() {
    const badges = [
        document.getElementById('cartBadge'),
        document.getElementById('cartCount'),
        document.getElementById('navCartBadge'),
        document.getElementById('headerBasketBadge')
    ].filter(Boolean);
    
    if (badges.length === 0) return;

    let totalItems = 0;
    
    // Get items from basket — total garment quantity, not distinct product types
    try {
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        totalItems = getBasketTotalQty(basket);
    } catch (e) {
        console.error('Error reading basket:', e);
    }
    
    // Update all badge elements
    badges.forEach(badge => {
        badge.textContent = totalItems > 99 ? '99+' : String(totalItems);
        badge.setAttribute('data-count', String(totalItems));
        if (totalItems > 0) {
            badge.hidden = false;
            badge.style.display = 'flex';
        } else {
            badge.hidden = true;
            badge.style.display = 'none';
        }
    });
}

// Export to global scope
window.updateLiveBadge = updateLiveBadge;
window.addEventListener('basketUpdated', updateLiveBadge);
window.addEventListener('pageshow', updateLiveBadge);

// Update badge when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateLiveBadge();
    
    // Also update when storage changes (from other tabs)
    window.addEventListener('storage', (e) => {
        if (e.key === 'quoteBasket' || e.key === null) {
            updateLiveBadge();
        }
    });
});

// ============================================
// SOCIAL BUTTONS - Single click toggles, Double click opens link
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const socialLinks = document.querySelectorAll('.social-buttons-header a');
    
    socialLinks.forEach(link => {
        // Prevent default click - we handle everything manually
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Toggle activated state
            this.classList.toggle('activated');
        });
        
        // Double click - open link
        link.addEventListener('dblclick', function(e) {
            e.preventDefault();
            const url = this.getAttribute('href');
            if (url) {
                window.open(url, '_blank', 'noopener');
            }
        });
    });
});

// ============================================
// HERO BANNERS CAROUSEL (DJ-scratch drag)
// Finger down = full control, 1:1 scrub forward/back.
// Finger up = snap to nearest slide, hold 7s, then autoplay.
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    if (window.BrandedConfig && typeof window.BrandedConfig.applyHeroBanners === 'function') {
        window.BrandedConfig.applyHeroBanners({ view: 'mobile' });
    }
    const container = document.querySelector('.hero-banners-container');
    const banners = container
        ? Array.from(container.querySelectorAll('.hero-banner'))
        : [];
    const dots = Array.from(document.querySelectorAll('.hero-banner-dots .banner-dot'));

    if (!container || banners.length === 0) return;

    const n = banners.length;
    const HOLD_MS = 7000;
    const AXIS_LOCK_PX = 6;

    let position = 0;
    let currentBanner = 0;
    let autoSlideTimeout;
    let isDragging = false;
    let dragMoved = false;
    let suppressClick = false;
    let startX = 0;
    let startY = 0;
    let startPos = 0;
    let width = 1;
    let axisLocked = null; // null | 'x' | 'y'

    function normalizeIndex(i) {
        return ((Math.round(i) % n) + n) % n;
    }

    function getBannerDurationMs(index) {
        const raw = banners[index]?.getAttribute('data-duration');
        const ms = Number(raw);
        return Number.isFinite(ms) && ms > 0 ? ms : HOLD_MS;
    }

    function render(pos, animate) {
        container.classList.toggle('is-snapping', !!animate);
        container.classList.toggle('is-dragging', isDragging && !animate);

        banners.forEach((banner, i) => {
            let d = i - pos;
            while (d > n / 2) d -= n;
            while (d < -n / 2) d += n;

            const abs = Math.abs(d);
            banner.style.transform = `translate3d(${d * 100}%, 0, 0)`;
            banner.style.opacity = abs < 1.001 ? '1' : (abs < 1.5 ? String(Math.max(0, 1 - (abs - 1) * 2)) : '0');
            banner.style.visibility = abs < 1.55 ? 'visible' : 'hidden';
            banner.style.pointerEvents = abs < 0.45 ? 'auto' : 'none';
            banner.classList.toggle('hero-banner--active', abs < 0.45);
            banner.classList.remove('hero-banner--exit');
        });

        const nearest = normalizeIndex(pos);
        dots.forEach((dot, i) => {
            dot.classList.toggle('banner-dot--active', i === nearest);
        });
    }

    function showBanner(index, animate) {
        currentBanner = normalizeIndex(index);
        position = currentBanner;
        render(position, animate !== false);
    }

    function stopAutoSlide() {
        clearTimeout(autoSlideTimeout);
        autoSlideTimeout = undefined;
    }

    function startAutoSlide(delayMs) {
        stopAutoSlide();
        const delay = delayMs != null ? delayMs : getBannerDurationMs(currentBanner);
        autoSlideTimeout = setTimeout(() => {
            showBanner(currentBanner + 1, true);
            startAutoSlide();
        }, delay);
    }

    function beginDrag(clientX, clientY) {
        stopAutoSlide();
        isDragging = true;
        dragMoved = false;
        axisLocked = null;
        width = container.offsetWidth || 1;
        startX = clientX;
        startY = clientY;
        startPos = position;
        container.classList.add('is-dragging');
        container.classList.remove('is-snapping');
    }

    function moveDrag(clientX, clientY, event) {
        if (!isDragging) return;

        const dx = clientX - startX;
        const dy = clientY - startY;

        if (!axisLocked) {
            if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
            axisLocked = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
            if (axisLocked === 'y') {
                // Vertical intent: release banner control so the page can scroll.
                isDragging = false;
                container.classList.remove('is-dragging');
                startAutoSlide(HOLD_MS);
                return;
            }
        }

        if (axisLocked !== 'x') return;

        if (event && event.cancelable) event.preventDefault();
        if (Math.abs(dx) > 3) dragMoved = true;

        // 1:1 scrub — finger right reveals previous, finger left reveals next.
        position = startPos - (dx / width);
        render(position, false);
    }

    function endDrag() {
        if (!isDragging) return;

        isDragging = false;
        container.classList.remove('is-dragging');

        const snapped = Math.round(position);
        showBanner(snapped, true);

        if (dragMoved) {
            suppressClick = true;
            setTimeout(() => { suppressClick = false; }, 450);
        }
        dragMoved = false;
        axisLocked = null;
        startAutoSlide(HOLD_MS);
    }

    container.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        beginDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 1) return;
        moveDrag(e.touches[0].clientX, e.touches[0].clientY, e);
    }, { passive: false });

    container.addEventListener('touchend', endDrag, { passive: true });
    container.addEventListener('touchcancel', endDrag, { passive: true });

    // Desktop / device-emulation pointer drag
    container.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        if (e.button != null && e.button !== 0) return;
        beginDrag(e.clientX, e.clientY);
        try { container.setPointerCapture(e.pointerId); } catch (_) {}
    });

    container.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        moveDrag(e.clientX, e.clientY, e);
    });

    container.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'touch') return;
        endDrag();
    });

    container.addEventListener('pointercancel', (e) => {
        if (e.pointerType === 'touch') return;
        endDrag();
    });

    // Prevent accidental link navigation after a scrub
    container.addEventListener('click', (e) => {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopPropagation();
    }, true);

    banners.forEach((banner) => {
        banner.querySelectorAll('img').forEach((img) => {
            img.setAttribute('draggable', 'false');
        });
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopAutoSlide();
            showBanner(index, true);
            startAutoSlide(HOLD_MS);
        });
    });

    showBanner(0, false);
    startAutoSlide();
});

// ============================================
// HERO BANNER 3 - BRANDED BOUNCING (split into chars)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const bounceEls = document.querySelectorAll('[data-bounce-text]');
    if (!bounceEls.length) return;

    bounceEls.forEach(el => {
        const text = (el.textContent || '').trim();
        if (!text) return;

        el.textContent = '';
        Array.from(text).forEach((ch, idx) => {
            const span = document.createElement('span');
            span.className = 'hero-bounce-char';
            span.style.setProperty('--char-index', String(idx));
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            el.appendChild(span);
        });
    });
});

// ============================================
// FILTERS DROP-UP MENU
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initFiltersDropup();
});

function initFiltersDropup() {
    const filtersBtn = document.getElementById('filtersNavBtn');
    const filtersDropup = document.getElementById('filtersDropup');
    const filtersOverlay = document.getElementById('filtersOverlay');
    const filtersClose = document.getElementById('filtersClose');
    const filtersClearAll = document.getElementById('filtersClearAll');
    const filtersApply = document.getElementById('filtersApplyBtn');
    const priceSlider = document.getElementById('filterPriceRange');
    const priceMaxDisplay = document.getElementById('priceMaxDisplay');
    
    if (!filtersBtn || !filtersDropup) return;
    
    // Open filters. The bottom bar slides first, then dispatches buk-open-filters.
    filtersBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (filtersBtn.closest('nav.bottom-nav.nav')) return;
        openFilters();
    });
    filtersBtn.addEventListener('buk-open-filters', openFilters);
    
    // Close filters
    if (filtersClose) {
        filtersClose.addEventListener('click', closeFilters);
    }
    if (filtersOverlay) {
        filtersOverlay.addEventListener('click', closeFilters);
    }
    
    // Apply filters
    if (filtersApply) {
        filtersApply.addEventListener('click', function() {
            applyFilters();
            closeFilters();
        });
    }
    
    // Clear all filters
    if (filtersClearAll) {
        filtersClearAll.addEventListener('click', clearAllFilters);
    }
    
    // Price slider
    if (priceSlider && priceMaxDisplay) {
        priceSlider.addEventListener('input', function() {
            priceMaxDisplay.textContent = '\u00A3' + this.value;
        });
    }
    
    // Toggle buttons
    document.querySelectorAll('.filter-toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const isPressed = this.getAttribute('aria-pressed') === 'true';
            this.setAttribute('aria-pressed', !isPressed);
        });
    });

    // Primary Colour behaves like a single-select (radio) on mobile
    const primaryColourGroup = document.querySelector('.filter-expandable[data-filter="primaryColour"]');
    if (primaryColourGroup) {
        const primaryColourCheckboxes = Array.from(primaryColourGroup.querySelectorAll('input[type="checkbox"]'));
        primaryColourCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                if (!cb.checked) return;
                primaryColourCheckboxes.forEach(other => {
                    if (other !== cb) other.checked = false;
                });
            });
        });
    }
    
    // Expandable filters
    document.querySelectorAll('.filter-expandable__header').forEach(header => {
        header.addEventListener('click', function() {
            const expandable = this.closest('.filter-expandable');
            const isExpanded = expandable.dataset.expanded === 'true';
            expandable.dataset.expanded = !isExpanded;
        });
    });
    
    function openFilters() {
        filtersDropup.classList.add('active');
        if (filtersOverlay) filtersOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeFilters() {
        filtersDropup.classList.remove('active');
        if (filtersOverlay) filtersOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function clearAllFilters() {
        // Reset toggles
        document.querySelectorAll('.filter-toggle-btn').forEach(btn => {
            btn.setAttribute('aria-pressed', 'false');
        });
        
        // Reset checkboxes
        document.querySelectorAll('.filters-dropup input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Reset search
        const searchInput = document.getElementById('filterSearchInput');
        if (searchInput) searchInput.value = '';
        
        // Reset price slider
        if (priceSlider) {
            priceSlider.value = 100;
            if (priceMaxDisplay) priceMaxDisplay.textContent = '\u00A3100';
        }
        
        // Reset text inputs
        document.querySelectorAll('.filter-text-input').forEach(input => {
            input.value = '';
        });
        
        // Collapse all expandables
        document.querySelectorAll('.filter-expandable').forEach(exp => {
            exp.dataset.expanded = 'false';
        });

        // Trigger ShopManager to clear state and re-fetch products
        if (typeof ShopManager !== 'undefined' && ShopManager.clearAllFilters) {
            ShopManager.clearAllFilters();
        }
    }
    
    function applyFilters() {
        // Collect all active filters
        const activeFilters = {
            toggles: {},
            search: '',
            priceMax: 100,
            checkboxes: {},
            // Canonical variant-color slug for shop list (maps from Primary Colour)
            color: ''
        };
        
        // Get toggle states
        document.querySelectorAll('.filter-toggle-btn').forEach(btn => {
            const filterName = btn.dataset.filter;
            activeFilters.toggles[filterName] = btn.getAttribute('aria-pressed') === 'true';
        });
        
        // Get search
        const searchInput = document.getElementById('filterSearchInput');
        if (searchInput) activeFilters.search = searchInput.value;
        
        // Get price
        if (priceSlider) activeFilters.priceMax = parseInt(priceSlider.value);
        
        // Get checked checkboxes
        document.querySelectorAll('.filters-dropup input[type="checkbox"]:checked').forEach(cb => {
            const filterGroup = cb.closest('.filter-expandable');
            if (filterGroup) {
                let groupName = filterGroup.dataset.filter;
                if (groupName === 'features') groupName = 'feature';
                if (!activeFilters.checkboxes[groupName]) {
                    activeFilters.checkboxes[groupName] = [];
                }
                activeFilters.checkboxes[groupName].push(cb.value);
            }
        });

        // CMYK / Pantone text fields
        document.querySelectorAll('.filters-dropup .filter-expandable .filter-text-input').forEach(input => {
            const filterGroup = input.closest('.filter-expandable');
            const value = String(input.value || '').trim();
            if (!filterGroup || !value) return;
            const groupName = filterGroup.dataset.filter;
            if (!groupName) return;
            if (!activeFilters.checkboxes[groupName]) {
                activeFilters.checkboxes[groupName] = [];
            }
            activeFilters.checkboxes[groupName].push(value);
        });
        
        // Store in sessionStorage for use on shop page
        // Primary Colour is treated as single-select and persisted to `activeFilters.color`
        if (activeFilters.checkboxes.primaryColour && activeFilters.checkboxes.primaryColour.length) {
            activeFilters.color = String(activeFilters.checkboxes.primaryColour[0] || '').trim();
            activeFilters.checkboxes.primaryColour = [activeFilters.color];
        }
        sessionStorage.setItem('brandeduk-filters', JSON.stringify(activeFilters));
        
        // Count active filters
        let filterCount = 0;
        Object.values(activeFilters.toggles).forEach(v => { if (v) filterCount++; });
        if (activeFilters.search) filterCount++;
        if (activeFilters.priceMax < 100) filterCount++;
        Object.values(activeFilters.checkboxes).forEach(arr => { filterCount += arr.length; });
        
        // Update badge on filter button if needed
        console.log('Filters applied:', activeFilters);
        console.log('Total active filters:', filterCount);
        
        // Home (and any other mobile page with this panel) applies filters by
        // navigating to the shop. The standalone mobile shop reloads itself
        // with the persisted filter payload so its inline product loader
        // reads and applies the new selection.
        if (window.location.pathname.includes('shop-mobile')) {
            const filteredShopUrl = new URL(window.location.href);
            filteredShopUrl.searchParams.set('filtered', 'true');
            filteredShopUrl.searchParams.set('page', '1');
            window.location.href = filteredShopUrl.toString();
        } else {
            window.location.href = getCanonicalShopUrl('filtered=true');
        }
    }
    window.__brandedCloseFilters = closeFilters;
}

// ============================================
// HEADER ACCOUNT PHOTO
// The person control is moved beside the hamburger on pages that do not
// include the account panel. The photo swap has to run for that button too.
// ============================================
const MOBILE_ACCOUNT_SESSION_KEY = 'brandeduk-user-session';
const MOBILE_BRANDED_MARK_URL = '/brandedukv15-child/assets/images/ui/bd-mark-orange.png';

function parseStoredAccountUser(key) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '');
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) {
        return null;
    }
}

function mobileAccountPhoto(user) {
    if (!user) return '';
    const url = user.picture || user.avatar || user.avatarUrl || user.photo ||
        user.photoURL || user.image || user.imageUrl || user.profileImage || '';
    return typeof url === 'string' ? url.trim() : '';
}

function mobileAccountFirstName(user) {
    if (!user) return '';
    if (user.firstName) return String(user.firstName).trim();
    if (user.givenName) return String(user.givenName).trim();
    if (user.name) return String(user.name).trim().split(/\s+/)[0];
    if (user.email) return String(user.email).split('@')[0];
    return 'there';
}

function mobileAccountInitials(user) {
    const src = (user && (user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email)) || 'BU';
    const letters = String(src).match(/\b\w/g) || ['B', 'U'];
    return letters.slice(0, 2).join('').toUpperCase();
}

function isMobileBrandedMarkAccount(user) {
    if (!user) return false;
    const email = String(user.email || '').toLowerCase();
    const provider = String(user.provider || '').toLowerCase();
    const picture = mobileAccountPhoto(user).toLowerCase();
    const name = String(user.name || [user.firstName, user.lastName].filter(Boolean).join(' ')).toLowerCase();
    if (provider.includes('google-local-preview')) return true;
    if (email.endsWith('@brandeduk.com') || email.endsWith('@brandeduk.co.uk') || email.endsWith('@brandeduk.test')) return true;
    if (/bd-logo|bd-mark|orange-circle|use-the-provided-circular/.test(picture)) return true;
    if (name === 'branded' || name === 'branded uk' || name === 'brandeduk') return true;
    return false;
}

function readMobileAccountUser() {
    const googleUser = parseStoredAccountUser('authUser') || parseStoredAccountUser('coUser');
    const legacyUser = parseStoredAccountUser(MOBILE_ACCOUNT_SESSION_KEY);
    if (googleUser && (mobileAccountPhoto(googleUser) || googleUser.email || googleUser.name)) return googleUser;
    return legacyUser || googleUser || null;
}

function mobileAccountButton() {
    return document.getElementById('accountNavBtn') || document.querySelector('.mobile-header--v2 .mh-account');
}

function ensureMobileAccountAvatarStyles() {
    if (document.getElementById('accountNavAvatarStyle')) return;
    const style = document.createElement('style');
    style.id = 'accountNavAvatarStyle';
    style.textContent = '.account-nav-avatar{width:36.25px;height:36.25px;border-radius:999px;overflow:hidden;display:inline-grid;place-items:center;background:#273469;color:#fff;font-size:12.5px;font-weight:900;line-height:1;flex:0 0 36.25px;}.account-nav-avatar img{width:36.25px;height:36.25px;max-width:none;max-height:none;object-fit:cover;display:block;border-radius:999px;}.account-nav-avatar.is-brand-mark{border-radius:0;background:transparent;}.account-nav-avatar.is-brand-mark img{object-fit:contain;border-radius:0;}.mh-account:has(.account-nav-avatar)>svg,.nav-item.is-signed-in>svg{display:none!important;}';
    document.head.appendChild(style);
}

function paintMobileAccountAvatar(accountBtn, user) {
    if (!accountBtn) return;
    ensureMobileAccountAvatarStyles();
    const svg = accountBtn.querySelector(':scope > svg') || accountBtn.querySelector('svg');
    const label = accountBtn.querySelector('.nav-item-label');
    let avatar = accountBtn.querySelector('.account-nav-avatar');
    const inHeader = accountBtn.classList.contains('mh-account') || !!accountBtn.closest('.mobile-header--v2');

    if (!user) {
        if (avatar) avatar.remove();
        accountBtn.classList.remove('is-signed-in');
        if (svg) svg.hidden = false;
        if (svg) svg.style.display = '';
        if (label && !inHeader) label.textContent = 'Account';
        if (accountBtn.getAttribute('aria-label') !== 'Account') accountBtn.setAttribute('aria-label', 'Account');
        return;
    }

    accountBtn.classList.add('is-signed-in');
    if (svg) svg.hidden = true;
    if (svg) svg.style.display = 'none';
    if (inHeader && label) label.remove();
    if (!avatar) {
        avatar = document.createElement('span');
        avatar.className = 'account-nav-avatar';
        const liveLabel = accountBtn.querySelector('.nav-item-label');
        if (liveLabel) accountBtn.insertBefore(avatar, liveLabel);
        else accountBtn.appendChild(avatar);
    }

    const brandMark = isMobileBrandedMarkAccount(user);
    const photo = brandMark ? MOBILE_BRANDED_MARK_URL : mobileAccountPhoto(user);
    const initials = mobileAccountInitials(user);
    avatar.classList.toggle('is-brand-mark', brandMark);
    avatar.replaceChildren();
    if (photo) {
        const img = document.createElement('img');
        img.src = photo;
        img.alt = '';
        img.width = 36;
        img.height = 36;
        img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', function () {
            avatar.classList.remove('is-brand-mark');
            avatar.textContent = initials;
        });
        avatar.appendChild(img);
    } else {
        avatar.textContent = initials;
    }

    const liveLabel = accountBtn.querySelector('.nav-item-label');
    if (!inHeader && liveLabel) liveLabel.textContent = 'Hi, ' + mobileAccountFirstName(user);
    const who = user.email || mobileAccountFirstName(user) || 'customer';
    accountBtn.setAttribute('aria-label', 'My account, signed in as ' + who);
}

function syncMobileAccountAvatar(user) {
    const accountBtn = mobileAccountButton();
    if (!accountBtn) return;
    const resolved = arguments.length ? user : readMobileAccountUser();
    paintMobileAccountAvatar(accountBtn, resolved || null);
}

function bindMobileAccountAvatarSync() {
    if (window.__buMobileAccountAvatarBound) return;
    window.__buMobileAccountAvatarBound = true;
    window.addEventListener('branded:auth-changed', function (event) {
        const detail = event && event.detail;
        if (detail && detail.signedIn === false) {
            syncMobileAccountAvatar(null);
            return;
        }
        if (detail && detail.user) syncMobileAccountAvatar(detail.user);
        else syncMobileAccountAvatar();
    });
    window.addEventListener('storage', function (event) {
        if (event.key && event.key !== 'authUser' && event.key !== 'coUser' && event.key !== 'authToken' && event.key !== 'coAuthToken' && event.key !== MOBILE_ACCOUNT_SESSION_KEY) return;
        syncMobileAccountAvatar();
    });
}

// ============================================
// ACCOUNT PANEL - SIGN IN / SIGN UP
// ============================================
function initAccountPanel() {
    const accountBtn = document.getElementById('accountNavBtn');
    const accountPanel = document.getElementById('accountPanel');
    const accountOverlay = document.getElementById('accountOverlay');
    const accountCloseBtn = document.getElementById('accountCloseBtn');
    const accountArrow = document.getElementById('accountArrow');
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const signinFormData = document.getElementById('signinFormData');
    const signupFormData = document.getElementById('signupFormData');
    const accountLoggedIn = document.getElementById('accountLoggedIn');
    const accountLogoutBtn = document.getElementById('accountLogoutBtn');

    bindMobileAccountAvatarSync();
    syncMobileAccountAvatar();

    if (!accountBtn || !accountPanel) return;
    
    // Storage key for user session
    const USER_SESSION_KEY = 'brandeduk-user-session';

    function updateAccountNavIcon(user) {
        syncMobileAccountAvatar(user);
    }
    
    // Check if user is logged in
    function checkLoggedIn() {
        const session = localStorage.getItem(USER_SESSION_KEY);
        if (session) {
            const user = JSON.parse(session);
            showLoggedInView(user);
            return true;
        }
        return false;
    }
    
    // Show logged in view
    function showLoggedInView(user) {
        document.querySelector('.account-forms-container').style.display = 'none';
        accountLoggedIn.style.display = 'block';
        updateAccountNavIcon(user);
        
        document.getElementById('accountUserName').textContent = `Welcome, ${user.firstName}!`;
        document.getElementById('accountUserEmail').textContent = user.email;
        
        const detailsHtml = `
            <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
            <p><strong>Company:</strong> ${user.company || 'Not provided'}</p>
        `;
        document.getElementById('accountUserDetails').innerHTML = detailsHtml;
    }
    
    // Show forms view
    function showFormsView() {
        document.querySelector('.account-forms-container').style.display = 'flex';
        accountLoggedIn.style.display = 'none';
    }
    
    // Open panel
    function openPanel() {
        checkLoggedIn();
        accountPanel.classList.add('active');
        accountOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (navigator.vibrate) navigator.vibrate(10);
    }
    
    // Close panel
    function closePanel() {
        accountPanel.classList.remove('active');
        accountOverlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset forms
        resetForms();
    }
    
    // Reset forms to initial state
    function resetForms() {
        signinForm.classList.remove('active', 'inactive');
        signupForm.classList.remove('active', 'inactive');
        accountArrow.classList.remove('visible');
    }
    
    // Event listeners
    accountBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openPanel();
    });
    
    accountCloseBtn.addEventListener('click', closePanel);
    accountOverlay.addEventListener('click', closePanel);
    
    // Form switching
    signinForm.addEventListener('click', (e) => {
        if (window.BrandedAccountPanel && typeof window.BrandedAccountPanel.openGoogleSignIn === 'function') {
            e.preventDefault();
            e.stopPropagation();
            window.BrandedAccountPanel.openGoogleSignIn();
            return;
        }
        if (!signinForm.classList.contains('active')) {
            signinForm.classList.add('active');
            signinForm.classList.remove('inactive');
            signupForm.classList.add('inactive');
            signupForm.classList.remove('active');
            accountArrow.classList.add('visible');
        }
    });
    
    signupForm.addEventListener('click', () => {
        if (!signupForm.classList.contains('active')) {
            signupForm.classList.add('active');
            signupForm.classList.remove('inactive');
            signinForm.classList.add('inactive');
            signinForm.classList.remove('active');
            accountArrow.classList.add('visible');
        }
    });
    
    // Arrow back - reset forms
    accountArrow.addEventListener('click', () => {
        resetForms();
        if (navigator.vibrate) navigator.vibrate(10);
    });
    
    // Sign In form submit
    signinFormData.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signinEmail').value;
        const password = document.getElementById('signinPassword').value;
        
        try {
            // Try to authenticate with backend
            const response = await fetch('../brandedukv15-child/includes/auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'signin',
                    email: email,
                    password: password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem(USER_SESSION_KEY, JSON.stringify(result.user));
                showLoggedInView(result.user);
                showToast('Welcome back, ' + result.user.firstName + '!');
            } else {
                showToast(result.message || 'Invalid credentials');
            }
        } catch (error) {
            // Fallback: check localStorage for demo
            const users = JSON.parse(localStorage.getItem('brandeduk-users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
                showLoggedInView(user);
                showToast('Welcome back, ' + user.firstName + '!');
            } else {
                showToast('Invalid email or password');
            }
        }
        
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    });
    
    // Sign Up form submit
    signupFormData.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userData = {
            firstName: document.getElementById('signupFirstName').value,
            lastName: document.getElementById('signupLastName').value,
            email: document.getElementById('signupEmail').value,
            phone: document.getElementById('signupPhone').value,
            company: document.getElementById('signupCompany').value,
            password: document.getElementById('signupPassword').value
        };
        
        try {
            // Try to register with backend
            const response = await fetch('../brandedukv15-child/includes/auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'signup',
                    ...userData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem(USER_SESSION_KEY, JSON.stringify(result.user));
                showLoggedInView(result.user);
                showToast('Account created! Welcome, ' + result.user.firstName + '!');
            } else {
                showToast(result.message || 'Registration failed');
            }
        } catch (error) {
            // Fallback: save to localStorage for demo
            const users = JSON.parse(localStorage.getItem('brandeduk-users') || '[]');
            
            // Check if email already exists
            if (users.some(u => u.email === userData.email)) {
                showToast('Email already registered');
                return;
            }
            
            userData.id = Date.now();
            users.push(userData);
            localStorage.setItem('brandeduk-users', JSON.stringify(users));
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
            
            showLoggedInView(userData);
            showToast('Account created! Welcome, ' + userData.firstName + '!');
        }
        
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    });
    
    // Logout
    accountLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem(USER_SESSION_KEY);
        showFormsView();
        resetForms();
        updateAccountNavIcon(null);
        showToast('You have been signed out');
        
        if (navigator.vibrate) navigator.vibrate(10);
    });
    
    // Toast notification helper
    function showToast(message) {
        // Check if there's a global showToast function
        if (window.showToast) {
            window.showToast(message);
        } else {
            // Simple fallback toast
            const toast = document.createElement('div');
            toast.className = 'account-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: #1f2937;
                color: #fff;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
                animation: fadeInUp 0.3s ease;
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }
}

function bootBrandedNav() {
    const nav = document.getElementById('branded-nav');
    if (!nav || nav.dataset.brandedInit === '1') return;
    nav.dataset.brandedInit = '1';
    const surface = nav.querySelector('.nav-surface');
    const mask = nav.querySelector('mask');
    const shape = nav.querySelector('.nav-shape');
    const buttons = [...nav.querySelectorAll('[data-page]')];
    const customise = nav.querySelector('.customise');
    const filters = nav.querySelector('.filters');
    const swapSlot = nav.querySelector('.swap-slot');
    let active = 'home';
    let frame;
    let shown = pageKeyFromUrl(window.location.href) || '';
    let routeToken = 0;

    function startInstant() {
        cancelAnimationFrame(frame);
        nav.classList.add('instant');
    }
    function endInstant() {
        nav.getBoundingClientRect();
        frame = requestAnimationFrame(() => nav.classList.remove('instant'));
    }
    function geometry(instant) {
        const bounds = nav.getBoundingClientRect();
        if (!bounds.width || !surface || !mask || !shape || !swapSlot) return;
        if (instant) startInstant();
        const w = bounds.width;
        const h = bounds.height;
        surface.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        mask.setAttribute('width', String(w));
        mask.setAttribute('height', String(h));
        shape.setAttribute('d', 'M20 0 H' + (w - 20) + ' Q' + w + ' 0 ' + w + ' 20 V' + h + ' H0 V20 Q0 0 20 0Z');
        const target = buttons.find((b) => b.dataset.page === active);
        const slotBox = swapSlot.getBoundingClientRect();
        nav.style.setProperty('--filter-x', (slotBox.left - bounds.left + slotBox.width / 2) + 'px');
        if (target) {
            const r = target.getBoundingClientRect();
            nav.style.setProperty('--active-x', (r.left - bounds.left + r.width / 2) + 'px');
        }
        nav.classList.add('ready');
        if (instant) endInstant();
    }
    function available(button, yes) {
        if (!button) return;
        button.disabled = !yes;
        button.tabIndex = yes ? 0 : -1;
        if (yes) button.removeAttribute('aria-hidden');
        else button.setAttribute('aria-hidden', 'true');
    }
    function selectPage(page, options) {
        const opts = options || {};
        const instant = !!opts.instant;
        const emit = opts.emit !== false;
        const next = buttons.find((b) => b.dataset.page === page);
        if (!next) return;
        if (instant) startInstant();
        active = page;
        const bundles = page === 'bundles';
        const focus = document.activeElement;
        if ((bundles && focus === customise) || (!bundles && focus === filters)) {
            next.disabled = false;
            next.removeAttribute('aria-hidden');
            try { next.focus({ preventScroll: true }); } catch (error) { /* ignore */ }
        }
        buttons.forEach((b) => {
            const chosen = b === next;
            b.classList.toggle('is-active', chosen);
            if (chosen) b.setAttribute('aria-current', 'page');
            else b.removeAttribute('aria-current');
        });
        nav.classList.toggle('is-bundles', bundles);
        available(customise, !bundles);
        available(filters, bundles);
        geometry(false);
        if (instant) endInstant();
        if (emit) window.dispatchEvent(new CustomEvent('branded:navigate', { detail: { page: page } }));
    }
    function playBundlesEntrance() {
        active = 'bundles';
        buttons.forEach((b) => {
            const chosen = b.dataset.page === 'bundles';
            b.classList.toggle('is-active', chosen);
            if (chosen) b.setAttribute('aria-current', 'page');
            else b.removeAttribute('aria-current');
        });
        nav.classList.remove('is-bundles');
        available(customise, true);
        available(filters, false);
        geometry(true);
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
            if (active !== 'bundles') return;
            nav.classList.add('is-bundles');
            available(customise, false);
            available(filters, true);
        }));
    }
    buttons.forEach((b) => b.addEventListener('click', () => selectPage(b.dataset.page)));
    if (filters) {
        filters.addEventListener('click', () => {
            if (active === 'bundles') {
                window.dispatchEvent(new CustomEvent('branded:filters', { detail: { page: 'bundles' } }));
            }
        });
    }
    const observer = new ResizeObserver(() => geometry(true));
    observer.observe(nav);
    let swapFlag = '';
    try { swapFlag = sessionStorage.getItem('buk-bar-swap') || ''; } catch (error) { swapFlag = ''; }
    const here = pageKeyFromUrl(window.location.href);
    if (here === 'bundles' && window.__bukBundlesIntro) {
        try { sessionStorage.removeItem('buk-bar-swap'); } catch (error) { /* ignore */ }
        selectPage('bundles', { instant: true, emit: false });
    }
    else if (here === 'bundles' && swapFlag !== 'bundles') playBundlesEntrance();
    else if (here) {
        if (swapFlag === 'bundles') {
            try { sessionStorage.removeItem('buk-bar-swap'); } catch (error) { /* ignore */ }
        }
        selectPage(here, { instant: true, emit: false });
    } else geometry(true);
    window.brandedNav = { selectPage: selectPage };

    function dismissExcept(next) {
        if (next !== 'chat' && typeof window.closeBrandedChat === 'function') window.closeBrandedChat();
        if (next !== 'customise' && typeof window.__brandedCloseStartSheet === 'function') window.__brandedCloseStartSheet(false);
        if (next !== 'filters') {
            const radial = document.getElementById('bundleRadial');
            if (radial && (radial.classList.contains('show') || radial.classList.contains('is-opening')) && typeof window.__bukOpenBundleFilters === 'function') {
                window.__bukOpenBundleFilters(false);
            }
        }
    }
    function go(page) {
        if (page === 'customise') {
            if (typeof window.__brandedOpenStartSheet === 'function') window.__brandedOpenStartSheet(customise);
            return;
        }
        if (page === 'chat') {
            ensureBrandedChat().then(() => {
                if (typeof window.openBrandedChat === 'function') window.openBrandedChat();
            });
            return;
        }
        const hrefs = {
            home: '/index-mobile.html?force=mobile',
            shop: '/mobile/shop-categories-mobile.html?force=mobile',
            bundles: '/bundle-configurator/?force=mobile'
        };
        if (!hrefs[page]) return;
        if (pageKeyFromUrl(window.location.href) === page) return;
        if (page === 'bundles') {
            try { sessionStorage.setItem('buk-bar-swap', 'bundles'); } catch (error) { /* ignore */ }
        }
        try {
            const vt = document.activeViewTransition || window.__bukVt;
            if (vt && typeof vt.skipTransition === 'function') vt.skipTransition();
        } catch (error) { /* already finished */ }
        loadBarPage(hrefs[page]);
    }
    window.addEventListener('branded:navigate', (event) => {
        const next = event.detail && event.detail.page;
        if (!next) return;
        const from = shown;
        shown = next;
        if (next === 'customise' && from === 'customise') {
            const sheet = document.getElementById('startSheet');
            if (sheet && !sheet.hidden && typeof window.__brandedCloseStartSheet === 'function') {
                window.__brandedCloseStartSheet(true);
                return;
            }
        }
        if (next === 'chat' && from === 'chat') {
            const popup = document.getElementById('waPopup');
            if (popup && popup.classList.contains('is-active') && typeof window.closeBrandedChat === 'function') {
                window.closeBrandedChat();
                return;
            }
        }
        if ((next === 'home' || next === 'shop' || next === 'bundles') && next === pageKeyFromUrl(window.location.href)) {
            return;
        }
        dismissExcept(next);
        const swap = (from === 'bundles') !== (next === 'bundles');
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const wait = reduce ? 0 : (swap ? 540 : 440);
        const token = ++routeToken;
        window.setTimeout(() => {
            if (token !== routeToken) return;
            try { go(next); } catch (error) { /* a failed navigation must not wedge the bar */ }
        }, wait);
        window.setTimeout(() => {
            if (token !== routeToken) return;
            routeToken += 1;
        }, wait + 4000);
    });
    function skipActiveTransition() {
        try {
            const vt = document.activeViewTransition || window.__bukVt;
            if (vt && typeof vt.skipTransition === 'function') vt.skipTransition();
        } catch (error) { /* already finished */ }
    }
    function resyncBar() {
        routeToken += 1;
        const key = pageKeyFromUrl(window.location.href);
        if (!key) return;
        shown = key;
        selectPage(key, { instant: true, emit: false });
    }
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;
        skipActiveTransition();
        resyncBar();
    });
    window.addEventListener('pagehide', () => {
        routeToken += 1;
    });
    window.addEventListener('branded:filters', () => {
        dismissExcept('filters');
        if (typeof window.__bukOpenBundleFilters === 'function') window.__bukOpenBundleFilters();
    });
}

bootBrandedNav();
