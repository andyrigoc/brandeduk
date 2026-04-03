(function () {
    'use strict';

    const TAB_COPY = {
        related: {
            empty: 'No related products are available for this style just yet.'
        },
        alternatives: {
            empty: 'No alternative products are available for this style just yet.'
        }
    };

    const DEFAULTS = {
        limit: 12,
        pageType: 'desktop',
        priceFormatter: function (basePrice) {
            return 'From \u00A3' + (Number(basePrice) || 0).toFixed(2);
        },
        priceNoteFormatter: function () {
            return '';
        },
        onSelect: null
    };

    function resolveApiRoot() {
        if (typeof window === 'undefined') {
            return 'https://api.brandeduk.com';
        }

        const override = window.BRANDED_API_BASE_URL ||
            document.documentElement.getAttribute('data-api-base-url') ||
            '';

        if (override) {
            return override.replace(/\/+$/, '').replace(/\/api$/, '');
        }

        return 'https://api.brandeduk.com';
    }

    function resolveApiBaseUrl() {
        return resolveApiRoot() + '/api';
    }

    function asNumber(value) {
        const parsed = typeof value === 'number' ? value : parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function normalizeProduct(rawProduct) {
        const source = rawProduct || {};
        const transformed = (typeof window !== 'undefined' &&
            window.BrandedAPI &&
            typeof window.BrandedAPI.transformProduct === 'function')
            ? window.BrandedAPI.transformProduct(source)
            : source;

        return {
            code: source.code || source.style_code || transformed.code || '',
            name: transformed.name || source.name || source.product_name || 'Product',
            price: asNumber(source.price || transformed.price),
            image: source.image || source.main_image || transformed.image || '',
            brand: source.brand || transformed.brand || '',
            productType: source.productType || source.product_type || transformed.productType || transformed.product_type || ''
        };
    }

    function buildProductUrl(code, pageType) {
        const safeCode = encodeURIComponent(code || '');

        if (pageType === 'mobile') {
            return 'customize-mobile.html?code=' + safeCode;
        }

        if (typeof window !== 'undefined') {
            const pathname = window.location.pathname || '';
            if (/^\/product\/[^/]+\/?$/.test(pathname)) {
                return '/product/' + safeCode;
            }
        }

        return 'product-detail.html?code=' + safeCode;
    }

    function createCard(product, options) {
        const card = document.createElement('a');
        card.className = 'product-recommendations__card';
        card.href = buildProductUrl(product.code, options.pageType);

        if (typeof options.onSelect === 'function') {
            card.addEventListener('click', function () {
                options.onSelect(product);
            });
        }

        const media = document.createElement('div');
        media.className = 'product-recommendations__card-media';

        if (product.image) {
            const image = document.createElement('img');
            image.className = 'product-recommendations__card-image';
            image.src = product.image;
            image.alt = product.name || 'Product';
            image.loading = 'lazy';
            media.appendChild(image);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'product-recommendations__card-placeholder';
            placeholder.textContent = product.code || 'ITEM';
            media.appendChild(placeholder);
        }

        const body = document.createElement('div');
        body.className = 'product-recommendations__card-body';

        const name = document.createElement('p');
        name.className = 'product-recommendations__card-name';
        name.textContent = product.name || 'Product';

        const footer = document.createElement('div');
        footer.className = 'product-recommendations__card-footer';

        const priceWrap = document.createElement('div');
        priceWrap.className = 'product-recommendations__card-price-wrap';

        const price = document.createElement('span');
        price.className = 'product-recommendations__card-price';
        price.setAttribute('data-base-price', String(product.price || 0));
        priceWrap.appendChild(price);

        const priceNote = document.createElement('span');
        priceNote.className = 'product-recommendations__card-price-note';
        priceWrap.appendChild(priceNote);

        const cta = document.createElement('span');
        cta.className = 'product-recommendations__card-cta';
        cta.textContent = 'View product';

        footer.appendChild(priceWrap);
        footer.appendChild(cta);

        body.appendChild(name);
        body.appendChild(footer);

        card.appendChild(media);
        card.appendChild(body);

        return card;
    }

    function applyPricing(root, options) {
        const formatter = typeof options.priceFormatter === 'function'
            ? options.priceFormatter
            : DEFAULTS.priceFormatter;
        const noteFormatter = typeof options.priceNoteFormatter === 'function'
            ? options.priceNoteFormatter
            : DEFAULTS.priceNoteFormatter;

        root.querySelectorAll('.product-recommendations__card-price[data-base-price]').forEach(function (node) {
            const basePrice = asNumber(node.getAttribute('data-base-price'));
            node.textContent = formatter(basePrice);
        });

        const note = noteFormatter();
        root.querySelectorAll('.product-recommendations__card-price-note').forEach(function (node) {
            node.textContent = note;
            node.hidden = !note;
        });
    }

    function createEmptyState(message) {
        const empty = document.createElement('div');
        empty.className = 'product-recommendations__empty';
        empty.textContent = message;
        return empty;
    }

    function getVisibleCount(tabKey) {
        if (tabKey === 'related') {
            return 2;
        }

        if (typeof window !== 'undefined' && window.innerWidth <= 767) {
            return 2;
        }

        return 3;
    }

    function readGap(node) {
        if (!node || typeof window === 'undefined') {
            return 0;
        }

        const styles = window.getComputedStyle(node);
        const gapValue = styles.columnGap || styles.gap || '0';
        const parsed = parseFloat(gapValue);

        return Number.isFinite(parsed) ? parsed : 0;
    }

    function buildCarousel(products, options, tabKey) {
        const carousel = document.createElement('div');
        carousel.className = 'product-recommendations__carousel';

        const frame = document.createElement('div');
        frame.className = 'product-recommendations__carousel-frame';

        const prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'product-recommendations__nav product-recommendations__nav--prev';
        prev.setAttribute('aria-label', 'Show previous products');
        prev.innerHTML = '<span class="product-recommendations__nav-icon" aria-hidden="true"></span>';

        const viewport = document.createElement('div');
        viewport.className = 'product-recommendations__viewport';
        viewport.setAttribute('data-visible-count', '1');

        products.forEach(function (product) {
            viewport.appendChild(createCard(product, options));
        });

        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'product-recommendations__nav product-recommendations__nav--next';
        next.setAttribute('aria-label', 'Show next products');
        next.innerHTML = '<span class="product-recommendations__nav-icon" aria-hidden="true"></span>';

        frame.appendChild(prev);
        frame.appendChild(viewport);
        frame.appendChild(next);
        carousel.appendChild(frame);

        let resizeFrame = null;

        function getCurrentVisibleCount() {
            return Math.min(getVisibleCount(tabKey), Math.max(products.length, 1));
        }

        function shouldShowControls(visibleCount) {
            return tabKey === 'alternatives' && products.length > visibleCount;
        }

        function getStepSize() {
            const firstCard = viewport.querySelector('.product-recommendations__card');
            const firstWidth = firstCard ? firstCard.getBoundingClientRect().width : 0;
            return firstWidth + readGap(viewport);
        }

        function updateNavigation() {
            const maxScroll = Math.max(viewport.scrollWidth - viewport.clientWidth, 0);
            const position = viewport.scrollLeft;
            const tolerance = 4;
            const controlsVisible = carousel.getAttribute('data-show-controls') === 'true';

            prev.disabled = !controlsVisible || position <= tolerance;
            next.disabled = !controlsVisible || position >= (maxScroll - tolerance);
        }

        function refreshLayout() {
            const visibleCount = getCurrentVisibleCount();
            const controlsVisible = shouldShowControls(visibleCount);

            viewport.setAttribute('data-visible-count', String(visibleCount));
            carousel.setAttribute('data-show-controls', controlsVisible ? 'true' : 'false');
            prev.hidden = !controlsVisible;
            next.hidden = !controlsVisible;

            const maxScroll = Math.max(viewport.scrollWidth - viewport.clientWidth, 0);

            if (viewport.scrollLeft > maxScroll) {
                viewport.scrollLeft = maxScroll;
            }

            updateNavigation();
        }

        prev.addEventListener('click', function () {
            const step = getStepSize();
            if (step <= 0) {
                return;
            }

            viewport.scrollBy({
                left: -step,
                behavior: 'smooth'
            });
        });

        next.addEventListener('click', function () {
            const step = getStepSize();
            if (step <= 0) {
                return;
            }

            viewport.scrollBy({
                left: step,
                behavior: 'smooth'
            });
        });

        viewport.addEventListener('scroll', function () {
            if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
                updateNavigation();
                return;
            }

            if (resizeFrame) {
                window.cancelAnimationFrame(resizeFrame);
            }

            resizeFrame = window.requestAnimationFrame(updateNavigation);
        }, { passive: true });

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', function () {
                if (resizeFrame) {
                    window.cancelAnimationFrame(resizeFrame);
                }

                resizeFrame = window.requestAnimationFrame(refreshLayout);
            });
        }

        carousel.__refreshRecommendationsCarousel = refreshLayout;

        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(refreshLayout);
        } else {
            refreshLayout();
        }

        return carousel;
    }

    async function fetchCollection(productCode, type, limit) {
        const response = await fetch(
            resolveApiBaseUrl() + '/products/' + encodeURIComponent(productCode) + '/' + type + '?limit=' + encodeURIComponent(limit),
            { headers: { Accept: 'application/json' } }
        );

        if (!response.ok) {
            throw new Error(type + ' request failed with status ' + response.status);
        }

        const data = await response.json();
        const collection = Array.isArray(data[type]) ? data[type] : [];

        return collection.map(normalizeProduct).filter(function (item) {
            return item.code && item.code !== productCode;
        });
    }

    function setStatusText(root, message, hidden) {
        const status = root.querySelector('.product-recommendations__status');
        if (!status) {
            return;
        }

        status.textContent = message;
        status.hidden = !!hidden;
    }

    function setActiveTab(root, activeTab) {
        const buttons = root.querySelectorAll('.product-recommendations__tab[data-tab]');
        const panels = root.querySelectorAll('.product-recommendations__panel[data-panel]');

        buttons.forEach(function (button) {
            const isActive = button.getAttribute('data-tab') === activeTab;
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        panels.forEach(function (panel) {
            panel.hidden = panel.getAttribute('data-panel') !== activeTab;
        });
    }

    function setExpanded(root, expanded) {
        const body = root.querySelector('[data-recommendation-body]');
        root.setAttribute('data-expanded', expanded ? 'true' : 'false');

        if (body) {
            body.hidden = !expanded;
        }
    }

    function refreshVisibleCarousels(root) {
        root.querySelectorAll('.product-recommendations__panel:not([hidden]) .product-recommendations__carousel').forEach(function (carousel) {
            if (typeof carousel.__refreshRecommendationsCarousel === 'function') {
                carousel.__refreshRecommendationsCarousel();
            }
        });
    }

    function init(rootOrSelector, config) {
        const root = typeof rootOrSelector === 'string'
            ? document.querySelector(rootOrSelector)
            : rootOrSelector;

        if (!root) {
            return null;
        }

        const options = Object.assign({}, DEFAULTS, config || {});
        const productCode = options.productCode;

        if (!productCode) {
            root.hidden = true;
            return null;
        }

        const state = {
            activeTab: null
        };

        const buttons = root.querySelectorAll('.product-recommendations__tab[data-tab]');
        const panels = {
            related: root.querySelector('.product-recommendations__panel[data-panel="related"]'),
            alternatives: root.querySelector('.product-recommendations__panel[data-panel="alternatives"]')
        };

        const controller = {
            refreshPricing: function () {
                applyPricing(root, options);
                refreshVisibleCarousels(root);
            }
        };

        setExpanded(root, false);
        setStatusText(root, 'Finding related and alternative styles for this product...', false);

        buttons.forEach(function (button) {
            button.disabled = true;
            button.addEventListener('click', function () {
                if (button.disabled) {
                    return;
                }

                const tabKey = button.getAttribute('data-tab');

                if (state.activeTab === tabKey && root.getAttribute('data-expanded') === 'true') {
                    state.activeTab = null;
                    setExpanded(root, false);
                    setActiveTab(root, null);
                    return;
                }

                state.activeTab = tabKey;
                setExpanded(root, true);
                setActiveTab(root, tabKey);
                applyPricing(root, options);

                if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                    window.requestAnimationFrame(function () {
                        refreshVisibleCarousels(root);
                    });
                } else {
                    refreshVisibleCarousels(root);
                }
            });
        });

        Promise.allSettled([
            fetchCollection(productCode, 'related', options.limit),
            fetchCollection(productCode, 'alternatives', options.limit)
        ]).then(function (results) {
            const related = results[0].status === 'fulfilled' ? results[0].value : [];
            const alternatives = results[1].status === 'fulfilled' ? results[1].value : [];

            if (panels.related) {
                panels.related.innerHTML = '';
                panels.related.appendChild(
                    related.length
                        ? buildCarousel(related, options, 'related')
                        : createEmptyState(TAB_COPY.related.empty)
                );
            }

            if (panels.alternatives) {
                panels.alternatives.innerHTML = '';
                panels.alternatives.appendChild(
                    alternatives.length
                        ? buildCarousel(alternatives, options, 'alternatives')
                        : createEmptyState(TAB_COPY.alternatives.empty)
                );
            }

            const relatedCountNode = root.querySelector('[data-count-for="related"]');
            const alternativesCountNode = root.querySelector('[data-count-for="alternatives"]');

            if (relatedCountNode) {
                relatedCountNode.textContent = String(related.length);
            }

            if (alternativesCountNode) {
                alternativesCountNode.textContent = String(alternatives.length);
            }

            buttons.forEach(function (button) {
                const tabKey = button.getAttribute('data-tab');
                const count = tabKey === 'related' ? related.length : alternatives.length;
                button.disabled = count === 0;
            });

            if (related.length === 0 && alternatives.length === 0) {
                root.hidden = true;
                return;
            }

            setStatusText(root, '', true);
            applyPricing(root, options);

            // Open 'related' tab by default (or 'alternatives' if no 'related')
            const defaultTab = related.length > 0 ? 'related' : 'alternatives';
            state.activeTab = defaultTab;
            setExpanded(root, true);
            setActiveTab(root, defaultTab);
            if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(function () {
                    refreshVisibleCarousels(root);
                });
            } else {
                refreshVisibleCarousels(root);
            }
        }).catch(function (error) {
            console.error('[ProductRecommendations] Failed to load products:', error);
            root.hidden = true;
        });

        return controller;
    }

    window.BrandedProductRecommendations = {
        init: init,
        resolveApiBaseUrl: resolveApiBaseUrl
    };
})();
