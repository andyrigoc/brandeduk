/* Mobile JavaScript - BrandedUK */

document.addEventListener('DOMContentLoaded', function() {
    initVatToggle();
    initMobileMenu();
    initSearch();
    initCategories();
    initBottomNav();
    updateCartCount();
    initAccountPanel();
    initBrandsMarqueeLogos();
});

// Helper to handle relative paths since this script runs on both root (index-mobile.html) and mobile/ folders
function getMobileBaseUrl() {
    return window.location.pathname.indexOf('/mobile/') !== -1 ? '' : 'mobile/';
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
// MOBILE MENU
// ============================================
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const menuOverlay = document.getElementById('menuOverlay');
    const slideMenu = document.getElementById('slideMenu');
    const closeMenu = document.getElementById('closeMenu');

    if (!menuToggle || !slideMenu) return;

    function openMenu() {
        slideMenu.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenuFn() {
        slideMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', openMenu);
    closeMenu?.addEventListener('click', closeMenuFn);
    menuOverlay?.addEventListener('click', closeMenuFn);

    // Handle swipe to close
    let touchStartX = 0;
    slideMenu.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });

    slideMenu.addEventListener('touchmove', (e) => {
        const touchX = e.touches[0].clientX;
        const diff = touchStartX - touchX;
        if (diff > 50) {
            closeMenuFn();
        }
    });
}

// ============================================
// SEARCH (with live suggestions like main page)
// ============================================
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
            let { products = [] } = data;
            // Strip hidden brand names
            products = products.map(p => {
                let label = p.label || '';
                _HIDDEN_BRANDS.forEach(b => { label = label.replace(new RegExp(b, 'gi'), '').trim(); });
                return { ...p, label };
            });
            if (products.length === 0) { suggestionBox.classList.remove('active'); return; }

            const highlight = (text) => {
                const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                return text.replace(regex, '<mark>$1</mark>');
            };

            let html = '<div class="suggestion-group-title">Product Results</div>';
            
            // Check if we're not already in the mobile folder (e.g. from index-mobile.html)
            const baseUrl = getMobileBaseUrl();

            products.slice(0, 8).forEach(product => {
                const detailUrl = `${baseUrl}customize-mobile.html?code=${product.value}`;
                const imgUrl = product.image || '../brandedukv15-child/assets/images/ui/no-image.png';
                const safeName = (product.label || '').replace(/'/g, "\\'");
                html += `
                    <a href="${detailUrl}" class="suggestion-item" data-product-code="${product.value}"
                       onclick="sessionStorage.setItem('selectedProduct','${product.value}');sessionStorage.setItem('selectedProductData',JSON.stringify({code:'${product.value}',name:'${safeName}'}));">
                        <img src="${imgUrl}" class="suggestion-item-image" onerror="this.src='../brandedukv15-child/assets/images/ui/no-image.png'">
                        <div class="suggestion-item-content">
                            <div class="suggestion-item-label">${highlight(product.label)}</div>
                            <div class="suggestion-item-sub"><span>Code: ${product.value}</span></div>
                        </div>
                    </a>`;
            });
            html += `<a href="${baseUrl}shop-mobile.html?q=${encodeURIComponent(query)}" class="view-all-results">View all results for "${query}" →</a>`;
            suggestionBox.innerHTML = html;
            suggestionBox.classList.add('active');
        };

        const fetchSuggestions = async (query) => {
            if (query.length < 2) { suggestionBox.classList.remove('active'); return; }
            try {
                const res = await fetch(`https://api.brandeduk.com/api/products/suggest?q=${encodeURIComponent(query)}`);
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
                    window.location.href = `${getMobileBaseUrl()}shop-mobile.html?q=${encodeURIComponent(query)}`;
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
                window.location.href = `${getMobileBaseUrl()}shop-mobile.html?q=${encodeURIComponent(query)}`;
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
                window.location.href = `${getMobileBaseUrl()}shop-mobile.html?category=${category}`;
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
// ============================================
function initBottomNav() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
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
function updateCartCount() {
    const cartCountEl = document.getElementById('cartCount');
    if (!cartCountEl) return;

    try {
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        let totalItems = 0;

        basket.forEach(item => {
            if (item.quantities && typeof item.quantities === 'object') {
                Object.values(item.quantities).forEach(qty => {
                    totalItems += parseInt(qty) || 0;
                });
            } else if (item.quantity) {
                totalItems += parseInt(item.quantity) || 0;
            }
        });

        cartCountEl.textContent = totalItems;
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
        document.getElementById('navCartBadge')
    ].filter(Boolean);
    
    if (badges.length === 0) return;

    let totalQty = 0;
    
    // Get items from basket
    try {
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        basket.forEach(item => {
            if (item.quantities && typeof item.quantities === 'object') {
                Object.values(item.quantities).forEach(qty => {
                    totalQty += parseInt(qty) || 0;
                });
            } else if (item.sizes && typeof item.sizes === 'object' && !Array.isArray(item.sizes)) {
                Object.values(item.sizes).forEach(qty => {
                    totalQty += parseInt(qty) || 0;
                });
            } else if (item.sizeQuantities && typeof item.sizeQuantities === 'object') {
                Object.values(item.sizeQuantities).forEach(qty => {
                    totalQty += parseInt(qty) || 0;
                });
            } else if (item.quantity) {
                totalQty += parseInt(item.quantity) || 0;
            } else if (item.qty) {
                totalQty += parseInt(item.qty) || 0;
            }
        });
    } catch (e) {
        console.error('Error reading basket:', e);
    }
    
    // Update all badge elements
    badges.forEach(badge => {
        if (totalQty > 0) {
            badge.textContent = totalQty;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

// Export to global scope
window.updateLiveBadge = updateLiveBadge;

// Update badge when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateLiveBadge();
    
    // Also update when storage changes (from other tabs)
    window.addEventListener('storage', (e) => {
        if (e.key === 'quoteBasket') {
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
// HERO BANNERS CAROUSEL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const banners = document.querySelectorAll('.hero-banner');
    const dots = document.querySelectorAll('.banner-dot');
    
    if (banners.length === 0 || dots.length === 0) return;
    
    let currentBanner = 0;
    let autoSlideTimeout;

    function getBannerDurationMs(index) {
        const raw = banners[index]?.getAttribute('data-duration');
        const ms = Number(raw);
        return Number.isFinite(ms) && ms > 0 ? ms : 12000;
    }
    
    function showBanner(index) {
        // Hide all banners
        banners.forEach(b => b.classList.remove('hero-banner--active'));
        dots.forEach(d => d.classList.remove('banner-dot--active'));
        
        // Show selected
        banners[index].classList.add('hero-banner--active');
        dots[index].classList.add('banner-dot--active');
        currentBanner = index;
    }
    
    function nextBanner() {
        const next = (currentBanner + 1) % banners.length;
        showBanner(next);
    }
    
    function startAutoSlide() {
        stopAutoSlide();
        autoSlideTimeout = setTimeout(() => {
            nextBanner();
            startAutoSlide();
        }, getBannerDurationMs(currentBanner));
    }
    
    function stopAutoSlide() {
        clearTimeout(autoSlideTimeout);
        autoSlideTimeout = undefined;
    }
    
    // Dot click handlers
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            stopAutoSlide();
            showBanner(index);
            startAutoSlide();
        });
    });
    
    // Start auto slide
    showBanner(currentBanner);
    startAutoSlide();
    
    // Swipe support
    const container = document.querySelector('.hero-banners-container');
    if (container) {
        let startX = 0;
        let endX = 0;
        
        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            stopAutoSlide();
        });
        
        container.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    // Swipe left - next
                    showBanner((currentBanner + 1) % banners.length);
                } else {
                    // Swipe right - prev
                    showBanner((currentBanner - 1 + banners.length) % banners.length);
                }
            }
            startAutoSlide();
        });
    }
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
    
    // Open filters
    filtersBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openFilters();
    });
    
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
                const groupName = filterGroup.dataset.filter;
                if (!activeFilters.checkboxes[groupName]) {
                    activeFilters.checkboxes[groupName] = [];
                }
                activeFilters.checkboxes[groupName].push(cb.value);
            }
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
        
        // If on home page, redirect to shop with filters
        if (window.location.pathname.includes('home-mobile')) {
            window.location.href = 'shop-mobile.html?filtered=true';
        }
    }
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
    
    if (!accountBtn || !accountPanel) return;
    
    // Storage key for user session
    const USER_SESSION_KEY = 'brandeduk-user-session';

    if (!document.getElementById('accountNavAvatarStyle')) {
        const navAvatarStyle = document.createElement('style');
        navAvatarStyle.id = 'accountNavAvatarStyle';
        navAvatarStyle.textContent = '.account-nav-avatar{width:24px;height:24px;border-radius:999px;overflow:hidden;display:inline-grid;place-items:center;background:#273469;color:#fff;font-size:10px;font-weight:900;line-height:1;}.account-nav-avatar img{width:100%;height:100%;object-fit:cover;display:block;}';
        document.head.appendChild(navAvatarStyle);
    }

    // Resolve the signed-in user from the mobile session OR the shared
    // Google/OAuth keys, so the nav reflects any sign-in method.
    function getCurrentUser() {
        const sources = [USER_SESSION_KEY, 'authUser', 'coUser'];
        for (const key of sources) {
            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object') return parsed;
                }
            } catch (e) {}
        }
        return null;
    }

    function userFirstName(user) {
        if (!user) return '';
        if (user.firstName) return String(user.firstName).trim();
        if (user.name) return String(user.name).trim().split(/\s+/)[0];
        if (user.email) return String(user.email).split('@')[0];
        return 'there';
    }

    function userInitials(user) {
        const src = (user && (user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email)) || 'BU';
        const m = String(src).match(/\b\w/g) || ['B', 'U'];
        return m.slice(0, 2).join('').toUpperCase();
    }

    function userPhoto(user) {
        if (!user) return '';
        const url = user.picture || user.avatar || user.avatarUrl || user.photo ||
            user.photoURL || user.image || user.imageUrl || user.profileImage || '';
        return typeof url === 'string' ? url.trim() : '';
    }

    // Swap the bottom-nav person icon for the Google profile photo (or initials)
    // when signed in, so it's obvious the user is logged in.
    function updateAccountNavIcon(user) {
        const svg = accountBtn.querySelector('svg');
        const label = accountBtn.querySelector('.nav-item-label');
        let avatar = accountBtn.querySelector('.account-nav-avatar');
        if (user) {
            if (svg) svg.style.display = 'none';
            if (!avatar) {
                avatar = document.createElement('span');
                avatar.className = 'account-nav-avatar';
                if (label) accountBtn.insertBefore(avatar, label);
                else accountBtn.appendChild(avatar);
            }
            const photo = userPhoto(user);
            const initials = userInitials(user);
            avatar.innerHTML = photo
                ? '<img src="' + photo + '" alt="" referrerpolicy="no-referrer" onerror="this.remove();this.parentNode.textContent=\'' + initials + '\';">'
                : initials;
            if (label) label.textContent = 'Hi, ' + userFirstName(user);
        } else {
            if (avatar) avatar.remove();
            if (svg) svg.style.display = '';
            if (label) label.textContent = 'Account';
        }
    }

    // Reflect any existing session in the nav as soon as the page loads.
    updateAccountNavIcon(getCurrentUser());
    
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
    signinForm.addEventListener('click', () => {
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
