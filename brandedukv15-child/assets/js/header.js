(function () {
    if (typeof window !== 'undefined') {
        if (window.__brandedukHeaderScriptsInitialized === true) {
            return;
        }
        window.__brandedukHeaderScriptsInitialized = true;
    }

    function closeAllPromoDropdowns(exceptItem) {
        document.querySelectorAll('.promotions-menu.is-open').forEach((item) => {
            if (exceptItem && item === exceptItem) {
                return;
            }
            item.classList.remove('is-open');
            const trigger = item.querySelector(':scope > a');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function closeAllCatalogueDropdowns(exceptItem) {
        document.querySelectorAll('.catalogue-menu.is-open').forEach((item) => {
            if (exceptItem && item === exceptItem) return;
            item.classList.remove('is-open');
            const trigger = item.querySelector(':scope > a');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
    }

    function closeAllExclusivesDropdowns(exceptItem) {
        document.querySelectorAll('.exclusives-menu.is-open').forEach((item) => {
            if (exceptItem && item === exceptItem) return;
            item.classList.remove('is-open');
            const trigger = item.querySelector(':scope > a');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
    }

    function resetExpandedMenus(root) {
        if (!root) {
            return;
        }
        root.querySelectorAll('.category-menu > li.is-expanded').forEach((item) => {
            item.classList.remove('is-expanded');
        });
    }

    function closeAllDropdowns() {
        document.querySelectorAll('.category-dropdown[data-visible="true"]').forEach((dropdown) => {
            dropdown.setAttribute('data-visible', 'false');
            resetExpandedMenus(dropdown);
            const button = dropdown.querySelector('.category-toggle');
            if (button) {
                button.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function closeAllSearchbarDropdowns() {
        document.querySelectorAll('.searchbar-header__categories.is-open').forEach((container) => {
            container.classList.remove('is-open');
            const trigger = container.querySelector('.searchbar-header__categories-trigger');
            const dropdown = container.querySelector('.searchbar-header__dropdown');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
            if (dropdown) {
                dropdown.hidden = true;
            }
        });
    }

    function closeAllMegaMenus(exceptItem) {
        document.querySelectorAll('.has-megamenu.is-open').forEach((item) => {
            if (exceptItem && item === exceptItem) return;
            item.classList.remove('is-open');
            const trigger = item.querySelector(':scope > a');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
    }

    function initMegaMenuToggle() {
        // Handle plain has-megamenu items (e.g. "All Products")
        // Excludes promotions-menu, exclusives-menu, catalogue-menu (handled elsewhere)
        const items = Array.from(document.querySelectorAll(
            '.main-nav .menu > li.has-megamenu:not(.promotions-menu):not(.exclusives-menu):not(.catalogue-menu)'
        ));
        if (!items.length) return;

        items.forEach((item) => {
            const trigger = item.querySelector(':scope > a');
            const megamenu = item.querySelector(':scope > .nav-megamenu');
            if (!trigger || !megamenu) return;

            trigger.setAttribute('aria-expanded', 'false');

            const toggle = (event) => {
                if (event) { event.preventDefault(); event.stopPropagation(); }
                const willOpen = !item.classList.contains('is-open');
                closeAllMegaMenus(item);
                closeAllPromoDropdowns();
                closeAllExclusivesDropdowns();
                closeAllCatalogueDropdowns();
                closeAllDropdowns();
                closeAllSearchbarDropdowns();
                item.classList.toggle('is-open', willOpen);
                trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            };

            trigger.addEventListener('click', toggle);
            trigger.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Spacebar') toggle(e);
                if (e.key === 'Escape') closeAllMegaMenus();
            });
            megamenu.addEventListener('click', (e) => e.stopPropagation());
        });

        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) return;
            if (event.target.closest('.main-nav .menu > li.has-megamenu')) return;
            closeAllMegaMenus();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeAllMegaMenus();
        });
    }

    function initPromoDropdownToggle() {
        const promoItems = Array.from(document.querySelectorAll('.promotions-menu'));
        if (!promoItems.length) {
            return;
        }

        promoItems.forEach((item) => {
            const trigger = item.querySelector(':scope > a');
            const dropdown = item.querySelector(':scope > .promo-dropdown');
            if (!trigger || !dropdown) {
                return;
            }

            if (!trigger.hasAttribute('aria-expanded')) {
                trigger.setAttribute('aria-expanded', 'false');
            }

            const toggle = (event) => {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                const willOpen = !item.classList.contains('is-open');
                closeAllPromoDropdowns(item);
                closeAllCatalogueDropdowns();
                closeAllExclusivesDropdowns();
                closeAllMegaMenus();
                closeAllDropdowns();
                closeAllSearchbarDropdowns();

                item.classList.toggle('is-open', willOpen);
                trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            };

            trigger.addEventListener('click', toggle);

            trigger.addEventListener('keydown', (event) => {
                if (event.key === ' ' || event.key === 'Spacebar') {
                    toggle(event);
                }
                if (event.key === 'Escape') {
                    closeAllPromoDropdowns();
                }
            });

            dropdown.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) return;
            if (event.target.closest('.promotions-menu')) return;
            closeAllPromoDropdowns();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeAllPromoDropdowns();
            }
        });
    }

    function initCategoryDropdown() {
        document.querySelectorAll('.category-dropdown').forEach((dropdown) => {
            const button = dropdown.querySelector('.category-toggle');
            const dropdownBox = dropdown.querySelector('.dropdown-box');
            if (!button) return;

            const closeDropdown = () => {
                if (dropdown.getAttribute('data-visible') !== 'true') {
                    return;
                }
                dropdown.setAttribute('data-visible', 'false');
                resetExpandedMenus(dropdown);
                button.setAttribute('aria-expanded', 'false');
            };

            button.addEventListener('click', (event) => {
                event.preventDefault();
                const currentlyVisible = dropdown.getAttribute('data-visible') === 'true';

                closeAllDropdowns();
                closeAllSearchbarDropdowns();

                dropdown.setAttribute('data-visible', currentlyVisible ? 'false' : 'true');
                button.setAttribute('aria-expanded', currentlyVisible ? 'false' : 'true');
            });

            dropdown.addEventListener('pointerleave', closeDropdown);

            if (dropdownBox) {
                dropdownBox.addEventListener('pointerleave', closeDropdown);
            }

            // Mobile/tablet behaviour: tapping the caret opens/closes subcategories,
            // while tapping the main category text navigates to its href.
            dropdown.querySelectorAll('.category-menu > li.has-children').forEach((item) => {
                const link = item.querySelector(':scope > a');
                if (!link) {
                    return;
                }

                const caret = link.querySelector('.category-caret');
                if (!caret) {
                    return;
                }

                caret.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    const isExpanded = item.classList.contains('is-expanded');
                    dropdown.querySelectorAll('.category-menu > li.is-expanded').forEach((other) => {
                        if (other !== item) {
                            other.classList.remove('is-expanded');
                        }
                    });

                    item.classList.toggle('is-expanded', !isExpanded);
                });
            });
        });

        document.querySelectorAll('.main-nav .menu > li > a').forEach((link) => {
            link.addEventListener('mouseenter', () => {
                if (link.closest('.category-dropdown')) {
                    return;
                }
                closeAllDropdowns();
            });
        });

        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (target.closest('.category-dropdown')) return;
            closeAllDropdowns();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            closeAllDropdowns();
        });
    }

    function initSearchbarHeaderDropdown() {
        const containers = Array.from(document.querySelectorAll('.searchbar-header__categories'));
        if (!containers.length) return;

        const closeContainer = (container) => {
            container.classList.remove('is-open');
            const trigger = container.querySelector('.searchbar-header__categories-trigger');
            const dropdown = container.querySelector('.searchbar-header__dropdown');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
            if (dropdown) {
                dropdown.hidden = true;
            }
        };

        const closeAll = () => {
            containers.forEach(closeContainer);
        };

        containers.forEach((container) => {
            const trigger = container.querySelector('.searchbar-header__categories-trigger');
            const dropdown = container.querySelector('.searchbar-header__dropdown');
            if (!trigger || !dropdown) return;

            dropdown.hidden = true;

            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const isOpen = container.classList.contains('is-open');
                closeAll();
                closeAllDropdowns();
                if (!isOpen) {
                    container.classList.add('is-open');
                    trigger.setAttribute('aria-expanded', 'true');
                    dropdown.hidden = false;
                }
            });

            trigger.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    trigger.click();
                }
                if (event.key === 'Escape') {
                    closeAll();
                }
            });

            dropdown.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) return;
            if (event.target.closest('.searchbar-header__categories')) return;
            closeAll();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeAll();
            }
        });
    }

    function initModernSearchDropdown() {
        const container = document.querySelector('.header-modern__categories');
        if (!container) return;

        const trigger = container.querySelector('.header-modern__categories-trigger');
        const dropdown = container.querySelector('.header-modern__categories-dropdown');
        if (!trigger || !dropdown) return;

        const openClass = 'header-modern__categories--open';

        const closeModernDropdown = () => {
            container.classList.remove(openClass);
            trigger.setAttribute('aria-expanded', 'false');
            dropdown.hidden = true;
        };

        const toggleModernDropdown = () => {
            const willOpen = !container.classList.contains(openClass);
            if (willOpen) {
                container.classList.add(openClass);
                trigger.setAttribute('aria-expanded', 'true');
                dropdown.hidden = false;
            } else {
                closeModernDropdown();
            }
        };

        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleModernDropdown();
        });

        trigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleModernDropdown();
            }

            if (event.key === 'Escape') {
                closeModernDropdown();
            }
        });

        dropdown.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) return;
            if (container.contains(event.target)) return;
            closeModernDropdown();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeModernDropdown();
            }
        });
    }

    function initSearchExpandToggle() {
        const containers = document.querySelectorAll('.searchbar-header__search-expand');
        if (!containers.length) return;

        containers.forEach((container) => {
            const input = container.querySelector('.search-input-expand');
            const icon = container.querySelector('.search-icon-expand');
            if (!(input instanceof HTMLInputElement) || !(icon instanceof SVGElement)) return;
            if (icon.dataset.searchToggleBound === 'true') return;
            icon.dataset.searchToggleBound = 'true';

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
            icon.addEventListener('pointerdown', toggle);
            icon.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    toggle(event);
                }
            });
        });
    }

    function initExclusivesDropdownToggle() {
        const excItems = Array.from(document.querySelectorAll('.exclusives-menu'));
        if (!excItems.length) return;

        excItems.forEach((item) => {
            const trigger = item.querySelector(':scope > a');
            const dropdown = item.querySelector(':scope > .exclusives-dropdown');
            if (!trigger || !dropdown) return;

            if (!trigger.hasAttribute('aria-expanded')) {
                trigger.setAttribute('aria-expanded', 'false');
            }

            const toggle = (event) => {
                if (event) { event.preventDefault(); event.stopPropagation(); }
                const willOpen = !item.classList.contains('is-open');
                closeAllExclusivesDropdowns(item);
                closeAllPromoDropdowns();
                closeAllCatalogueDropdowns();
                closeAllMegaMenus();
                closeAllDropdowns();
                closeAllSearchbarDropdowns();
                item.classList.toggle('is-open', willOpen);
                trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            };

            trigger.addEventListener('click', toggle);
            trigger.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Spacebar') toggle(e);
                if (e.key === 'Escape') closeAllExclusivesDropdowns();
            });
            dropdown.addEventListener('click', (e) => e.stopPropagation());
        });

        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) return;
            if (event.target.closest('.exclusives-menu')) return;
            closeAllExclusivesDropdowns();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeAllExclusivesDropdowns();
        });
    }

    function initCatalogueDropdownToggle() {
        const catItems = Array.from(document.querySelectorAll('.catalogue-menu'));
        if (!catItems.length) return;

        catItems.forEach((item) => {
            const trigger = item.querySelector(':scope > a');
            const dropdown = item.querySelector(':scope > .catalogue-dropdown');
            if (!trigger || !dropdown) return;

            if (!trigger.hasAttribute('aria-expanded')) {
                trigger.setAttribute('aria-expanded', 'false');
            }

            const toggle = (event) => {
                if (event) { event.preventDefault(); event.stopPropagation(); }
                const willOpen = !item.classList.contains('is-open');
                closeAllCatalogueDropdowns(item);
                closeAllPromoDropdowns();
                closeAllMegaMenus();
                closeAllDropdowns();
                closeAllSearchbarDropdowns();
                item.classList.toggle('is-open', willOpen);
                trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            };

            trigger.addEventListener('click', toggle);
            trigger.addEventListener('keydown', (event) => {
                if (event.key === ' ' || event.key === 'Spacebar') toggle(event);
                if (event.key === 'Escape') closeAllCatalogueDropdowns();
            });
            dropdown.addEventListener('click', (event) => event.stopPropagation());
        });

        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) return;
            if (event.target.closest('.catalogue-menu')) return;
            closeAllCatalogueDropdowns();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeAllCatalogueDropdowns();
        });
    }

    function initFixedHeaderOffset() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        const update = () => {
            const rect = header.getBoundingClientRect();
            const height = Math.max(0, Math.ceil(rect.height));
            document.documentElement.style.setProperty('--brandeduk-site-header-height', `${height}px`);
        };

        update();

        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => update());
            ro.observe(header);
        }

        window.addEventListener('resize', update, { passive: true });
    }

    function initSearchTypeahead() {
        // List of all known search input IDs on the site
        const searchInputIds = ['searchbarHeaderInput', 'desktopSearchInput', 'searchInput', 'search-input'];

        searchInputIds.forEach(id => {
            const searchInput = document.getElementById(id);
            if (!searchInput) return;

            // Skip if a custom autocomplete is already attached (e.g. home-pc 3-column dropdown)
            if (searchInput.dataset.acCustom === 'true') return;

            // Ensure parent has relative positioning
            const inputWrap = searchInput.parentElement;
            if (inputWrap) {
                inputWrap.classList.add('search-input-wrap-relative');
            }

            // Inject suggestion box if it doesn't exist for THIS input
            const suggestionBoxId = `searchSuggestions_${id}`;
            let suggestionBox = document.getElementById(suggestionBoxId);
            if (!suggestionBox) {
                suggestionBox = document.createElement('div');
                suggestionBox.id = suggestionBoxId;
                suggestionBox.className = 'search-suggestions';
                inputWrap.appendChild(suggestionBox);
            }

            // Disable browser autocomplete
            searchInput.setAttribute('autocomplete', 'off');

            let debounceTimer;
            const debounce = (callback, time) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(callback, time);
            };

            const renderSuggestions = (data, query) => {
                let { products = [] } = data;

                // Strip hidden brand names from suggestion labels
                const _HIDDEN_HDR = ['absolute apparel', 'ralawise'];
                products = products.map(p => {
                    let label = p.label || '';
                    _HIDDEN_HDR.forEach(b => { label = label.replace(new RegExp(b, 'gi'), '').trim(); });
                    return { ...p, label };
                });

                if (products.length === 0) {
                    suggestionBox.classList.remove('active');
                    return;
                }

                const highlight = (text) => {
                    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    return text.replace(regex, '<mark>$1</mark>');
                };

                // Premium UI for Products
                const isMobile = window.innerWidth < 1280;
                let html = '<div class="suggestion-group-title">Product Results</div>';

                products.slice(0, 8).forEach(product => {
                    const detailUrl = `product-detail.html?code=${product.value}`;
                    const imgUrl = product.image || '/brandedukv15-child/assets/images/ui/no-image.png';

                    html += `
                        <a href="${detailUrl}" class="suggestion-item" data-product-code="${product.value}" onclick="if(window.innerWidth<1280){sessionStorage.setItem('selectedProduct','${product.value}');sessionStorage.setItem('selectedProductData',JSON.stringify({code:'${product.value}',name:'${(product.label||'').replace(/'/g,"\\'")}'}));}">
                            <img src="${imgUrl}" class="suggestion-item-image" onerror="this.src='/brandedukv15-child/assets/images/ui/no-image.png'">
                            <div class="suggestion-item-content">
                                <div class="suggestion-item-label">${highlight(product.label)}</div>
                                <div class="suggestion-item-sub">
                                    <span>Code: ${product.value}</span>
                                </div>
                            </div>
                        </a>`;
                });

                // View all results link
                const viewAllUrl = isMobile
                    ? `shop.html?q=${encodeURIComponent(query)}`
                    : `shop-pc.html?q=${encodeURIComponent(query)}`;
                html += `
                    <a href="${viewAllUrl}" class="view-all-results">
                        View all results for "${query}" →
                    </a>`;

                suggestionBox.innerHTML = html;
                suggestionBox.classList.add('active');
            };

            const fetchSuggestions = async (query) => {
                if (query.length < 2) {
                    suggestionBox.classList.remove('active');
                    return;
                }

                try {
                    const response = await fetch(`https://api.brandeduk.com/api/products/suggest?q=${encodeURIComponent(query)}`);
                    if (!response.ok) throw new Error('API Error');
                    const data = await response.json();
                    renderSuggestions(data, query);
                } catch (error) {
                    console.error('Search Suggestion Error:', error);
                }
            };

            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                debounce(() => fetchSuggestions(query), 300);
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestionBox.contains(e.target)) {
                    suggestionBox.classList.remove('active');
                }
            });

            // Handle enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = e.target.value.trim();
                    if (query) {
                        const isMobile = window.innerWidth < 1280;
                        window.location.href = isMobile
                            ? `shop.html?q=${encodeURIComponent(query)}`
                            : `shop-pc.html?q=${encodeURIComponent(query)}`;
                    }
                }
            });
        });
    }

    function initHideHeaderOnScroll() {
        // Desktop only — do not hide header on mobile/tablet
        if (window.innerWidth < 1024) return;
        var header = document.querySelector('.site-header');
        if (!header) return;
        var lastY = window.scrollY;
        var ticking = false;

        window.addEventListener('scroll', function () {
            if (window.innerWidth < 1024) return;
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    var currentY = window.scrollY;
                    if (currentY > lastY && currentY > 80) {
                        header.classList.add('header-hidden');
                    } else {
                        header.classList.remove('header-hidden');
                    }
                    lastY = currentY;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    function initHeaderScripts() {
        initFixedHeaderOffset();
        initCategoryDropdown();
        initSearchbarHeaderDropdown();
        initModernSearchDropdown();
        initSearchExpandToggle();
        initMegaMenuToggle();
        initPromoDropdownToggle();
        initExclusivesDropdownToggle();
        initCatalogueDropdownToggle();
        initSearchTypeahead();
        initHideHeaderOnScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeaderScripts);
    } else {
        initHeaderScripts();
    }
})();
