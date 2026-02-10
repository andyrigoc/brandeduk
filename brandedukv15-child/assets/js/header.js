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

    function initHeaderScripts() {
        initFixedHeaderOffset();
        initCategoryDropdown();
        initSearchbarHeaderDropdown();
        initModernSearchDropdown();
        initSearchExpandToggle();
        initPromoDropdownToggle();
        initExclusivesDropdownToggle();
        initCatalogueDropdownToggle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeaderScripts);
    } else {
        initHeaderScripts();
    }
})();
