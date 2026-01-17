/* ============================================
   BrandedUK 2 - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    initVatToggle();
    initSearch();
    updateBasketCount();
    initFaqTabs();
    initHeroBanners();
    initBrandsMarqueeLogos();
});

// ============================================
// BRANDS MARQUEE LOGOS (PC)
// ============================================
function initBrandsMarqueeLogos() {
    const brandCards = document.querySelectorAll('.brands-section .brand-card');
    if (!brandCards.length) return;

    const slugifyBrand = (name) => {
        return (name || '')
            .toLowerCase()
            .trim()
            .replace(/&/g, 'and')
            .replace(/\+/g, 'plus')
            .replace(/\//g, '-')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-');
    };

    brandCards.forEach((card) => {
        if (!(card instanceof HTMLElement)) return;
        if (card.querySelector('img')) return;

        const brandName = (card.textContent || '').trim();
        if (!brandName) return;

        const slug = slugifyBrand(brandName);
        if (!slug) return;

        // PC pages live in /brandeduk.com/, so we go up one level to reach the shared assets.
        const candidates = [
            `../brandedukv15-child/assets/images/brands/${slug}.svg`,
            `../brandedukv15-child/assets/images/brands/${slug}.webp`,
            `../brandedukv15-child/assets/images/brands/${slug}.png`,
            `../brandedukv15-child/assets/images/brands/${slug}.jpg`,
            `../brandedukv15-child/assets/images/brands/${slug}.jpeg`,

            `../brandedukv15-child/assets/images/brands/${slug}2020.webp`,
            `../brandedukv15-child/assets/images/brands/${slug}2020.jpg`,
            `../brandedukv15-child/assets/images/brands/${slug}_2020.webp`,
            `../brandedukv15-child/assets/images/brands/${slug}_2020.jpg`,
            `../brandedukv15-child/assets/images/brands/${slug}-2020.webp`,
            `../brandedukv15-child/assets/images/brands/${slug}-2020.jpg`
        ];

        const img = document.createElement('img');
        img.className = 'brand-logo-img';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = brandName;

        const fallbackToText = () => {
            if (!card.isConnected) return;
            card.innerHTML = '';
            card.textContent = brandName;
        };

        let idx = 0;
        const tryNext = () => {
            const nextSrc = candidates[idx++];
            if (!nextSrc) return fallbackToText();
            img.src = nextSrc;
        };

        img.addEventListener('error', tryNext);

        card.title = brandName;
        card.innerHTML = '';
        card.appendChild(img);
        tryNext();
    });
}

// ============================================
// VAT TOGGLE
// ============================================
function initVatToggle() {
    const vatToggle = document.querySelector('.header-top-vat-toggle');
    if (!vatToggle) {
        console.log('VAT toggle not found');
        return;
    }
    
    const excLabel = vatToggle.querySelector('.header-top-vat-toggle__label--exc');
    const incLabel = vatToggle.querySelector('.header-top-vat-toggle__label--inc');
    const thumb = vatToggle.querySelector('.header-top-vat-toggle__thumb');
    
    // Load saved state
    const isIncVat = localStorage.getItem('brandeduk-vat') === 'inc';
    updateVatState(vatToggle, excLabel, incLabel, isIncVat);
    
    // Update all prices on page load
    updateAllPrices(isIncVat);
    
    vatToggle.addEventListener('click', function(e) {
        e.preventDefault();
        const currentState = this.getAttribute('aria-pressed') === 'true';
        const newState = !currentState;
        localStorage.setItem('brandeduk-vat', newState ? 'inc' : 'exc');
        updateVatState(this, excLabel, incLabel, newState);
        
        // Update all prices immediately
        updateAllPrices(newState);
    });
}

function updateVatState(toggle, excLabel, incLabel, isIncVat) {
    toggle.setAttribute('aria-pressed', isIncVat ? 'true' : 'false');
    toggle.classList.toggle('is-on', isIncVat);
    
    if (excLabel) {
        excLabel.classList.toggle('is-active', !isIncVat);
    }
    if (incLabel) {
        incLabel.classList.toggle('is-active', isIncVat);
    }
}

// Update all prices on the page based on VAT state
function updateAllPrices(includeVat) {
    const VAT_RATE = 0.20; // 20% VAT
    
    // Find all price elements with data-price-exc attribute (base price without VAT)
    document.querySelectorAll('[data-price-exc]').forEach(el => {
        const excPrice = parseFloat(el.getAttribute('data-price-exc'));
        if (isNaN(excPrice)) return;
        
        const displayPrice = includeVat ? excPrice * (1 + VAT_RATE) : excPrice;
        el.textContent = '£' + displayPrice.toFixed(2);
    });
    
    // Update VAT labels next to prices
    document.querySelectorAll('.price-vat-label').forEach(el => {
        el.textContent = includeVat ? 'inc VAT' : 'ex VAT';
    });
    
    // Dispatch custom event for other scripts to listen
    document.dispatchEvent(new CustomEvent('vatStateChanged', { 
        detail: { includeVat: includeVat }
    }));
}

// Helper to get current VAT state
function isVatIncluded() {
    return localStorage.getItem('brandeduk-vat') === 'inc';
}

// ============================================
// SEARCH
// ============================================
function initSearch() {
    const searchInput = document.querySelector('.header-search__input');
    const searchBtn = document.querySelector('.header-search__btn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `search-results.html?s=${encodeURIComponent(query)}`;
            }
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    window.location.href = `search-results.html?s=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

// ============================================
// BASKET COUNT
// ============================================
function updateBasketCount() {
    const badge = document.getElementById('basketCount');
    if (!badge) return;
    
    try {
        const basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
        const count = basket.reduce((sum, item) => sum + (item.quantity || 1), 0);
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    } catch (e) {
        badge.textContent = '0';
        badge.style.display = 'none';
    }
}

// ============================================
// FAQ TABS
// ============================================
function initFaqTabs() {
    const tabs = document.querySelectorAll('.faq-tab');
    const panels = document.querySelectorAll('.faq-panel');
    
    if (!tabs.length || !panels.length) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked tab
            this.classList.add('active');
            
            // Hide all panels
            panels.forEach(p => p.classList.remove('active'));
            // Show target panel
            const targetPanel = document.getElementById('faq-' + target);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// ============================================
// HERO BANNERS - Carousel with Auto-rotate (Slide)
// ============================================
function initHeroBanners() {
    const banners = document.querySelectorAll('.hero-banner');
    const dots = document.querySelectorAll('.banner-dot');
    const neonContainer = document.querySelector('.neon-container');
    
    if (!banners.length) return;
    
    let currentBanner = 0;
    let autoRotateInterval;
    
    // Initialize: first banner active, others waiting on right
    banners.forEach((banner, i) => {
        if (i === 0) {
            banner.classList.add('hero-banner--active');
        } else {
            banner.classList.remove('hero-banner--active');
            banner.classList.remove('hero-banner--exit');
        }
    });
    
    // Function to switch banners with slide effect
    function switchBanner(index) {
        if (index === currentBanner) return;
        
        const currentEl = banners[currentBanner];
        const nextEl = banners[index];
        
        // Current banner exits to the left
        currentEl.classList.remove('hero-banner--active');
        currentEl.classList.add('hero-banner--exit');
        
        // Next banner enters from the right
        nextEl.classList.remove('hero-banner--exit');
        nextEl.classList.add('hero-banner--active');
        
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('banner-dot--active', i === index);
        });
        
        // Reset exited banner after transition
        setTimeout(() => {
            currentEl.classList.remove('hero-banner--exit');
        }, 600);
        
        currentBanner = index;
    }
    
    // Auto-rotate every 10 seconds
    function startAutoRotate() {
        autoRotateInterval = setInterval(() => {
            const nextIndex = (currentBanner + 1) % banners.length;
            switchBanner(nextIndex);
        }, 10000);
    }
    
    // Dot click handler
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(autoRotateInterval);
            switchBanner(index);
            startAutoRotate();
        });
    });
    
    // Click on neon container opens contact popup (if exists)
    if (neonContainer) {
        neonContainer.addEventListener('click', function() {
            // If there's a contact popup function, call it
            if (typeof openContactPopup === 'function') {
                openContactPopup();
            } else {
                // Otherwise scroll to contact section
                const contactSection = document.querySelector('.contact-section');
                if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
    
    // Start auto-rotate
    startAutoRotate();
}
