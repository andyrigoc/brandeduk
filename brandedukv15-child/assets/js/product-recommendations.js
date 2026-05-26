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
        layout: 'tabs',
        relatedSidebarSelector: '',
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

    function toArray(value) {
        if (Array.isArray(value)) {
            return value;
        }

        if (typeof value === 'string' && value.trim()) {
            return value.split(/[|,\/]+/g).map(function (item) {
                return item.trim();
            }).filter(Boolean);
        }

        return [];
    }

    function normalizeSizeValue(sizeEntry) {
        if (!sizeEntry) {
            return '';
        }

        if (typeof sizeEntry === 'string' || typeof sizeEntry === 'number') {
            return String(sizeEntry).trim();
        }

        if (typeof sizeEntry === 'object') {
            return String(sizeEntry.size || sizeEntry.name || sizeEntry.label || '').trim();
        }

        return '';
    }

    function sizeOrderIndex(size) {
        const order = ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL'];
        const normalized = String(size || '').toUpperCase().replace(/\s+/g, '');
        const direct = order.indexOf(normalized);

        if (direct >= 0) {
            return direct;
        }

        const numeric = normalized.match(/^(\d+)XL$/);
        if (numeric) {
            return 5 + parseInt(numeric[1], 10);
        }

        return 999;
    }

    function deriveSizeLabel(source, transformed) {
        const rawSizes = []
            .concat(toArray(source && source.sizes))
            .concat(toArray(source && source.available_sizes))
            .concat(toArray(transformed && transformed.sizes));

        const unique = Array.from(new Set(rawSizes.map(normalizeSizeValue).filter(Boolean)));
        if (!unique.length) {
            return '';
        }

        const hasOneSize = unique.some(function (size) {
            return /^(one\s*size|os)$/i.test(size);
        });

        if (hasOneSize || unique.length === 1) {
            return 'One size';
        }

        const sorted = unique.slice().sort(function (a, b) {
            return sizeOrderIndex(a) - sizeOrderIndex(b);
        });

        return sorted[0] + '-' + sorted[sorted.length - 1];
    }

    function deriveSideDescription(productName, code) {
        const name = String(productName || '').replace(/[\u00AE\u2122\u00A9]/g, '').trim();
        const safeCode = String(code || '').trim();
        if (!name) {
            return '';
        }

        if (!safeCode) {
            return name;
        }

        const codeRegex = new RegExp('^' + safeCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\s:-]*', 'i');
        return name.replace(codeRegex, '').trim() || name;
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
            description: deriveSideDescription(transformed.name || source.name || source.product_name || 'Product', source.code || source.style_code || transformed.code || ''),
            sizeLabel: deriveSizeLabel(source, transformed),
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
        name.textContent = (product.name || 'Product').replace(/[\u00AE\u2122\u00A9]/g,'');

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

    function createRelatedSideCard(product, options) {
        const card = document.createElement('a');
        card.className = 'product-recommendations__side-card';
        card.href = buildProductUrl(product.code, options.pageType);

        if (typeof options.onSelect === 'function') {
            card.addEventListener('click', function () {
                options.onSelect(product);
            });
        }

        const imageWrap = document.createElement('div');
        imageWrap.className = 'product-recommendations__side-image-wrap';

        if (product.image) {
            const image = document.createElement('img');
            image.className = 'product-recommendations__side-image';
            image.src = product.image;
            image.alt = product.name || 'Product';
            image.loading = 'lazy';
            imageWrap.appendChild(image);
        }

        const meta = document.createElement('div');
        meta.className = 'product-recommendations__side-meta';

        const top = document.createElement('div');
        top.className = 'product-recommendations__side-top';

        const code = document.createElement('span');
        code.className = 'product-recommendations__side-code';
        code.textContent = product.code || '';

        const size = document.createElement('span');
        size.className = 'product-recommendations__side-size';
        size.textContent = product.sizeLabel || '';

        top.appendChild(code);
        top.appendChild(size);

        const desc = document.createElement('p');
        desc.className = 'product-recommendations__side-desc';
        desc.textContent = product.description || product.name || '';

        const cta = document.createElement('span');
        cta.className = 'product-recommendations__side-cta';
        cta.textContent = 'Buy Now';

        meta.appendChild(top);
        meta.appendChild(desc);
        meta.appendChild(cta);

        card.appendChild(imageWrap);
        card.appendChild(meta);

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

    function getVisibleCount(tabKey, options) {
        if (options && options.layout === 'split' && tabKey === 'alternatives') {
            return 1;
        }

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
            return Math.min(getVisibleCount(tabKey, options), Math.max(products.length, 1));
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

    function buildSplitLayout(related, alternatives, options) {
        const split = document.createElement('div');
        split.className = 'product-recommendations__split';

        const left = document.createElement('div');
        left.className = 'product-recommendations__split-left';

        const alternativesTitle = document.createElement('h3');
        alternativesTitle.className = 'product-recommendations__split-heading';
        alternativesTitle.textContent = 'Alternatives';
        left.appendChild(alternativesTitle);

        left.appendChild(
            alternatives.length
                ? buildCarousel(alternatives, options, 'alternatives')
                : createEmptyState(TAB_COPY.alternatives.empty)
        );

        const right = document.createElement('div');
        right.className = 'product-recommendations__split-right';

        const relatedTitle = document.createElement('h3');
        relatedTitle.className = 'product-recommendations__split-heading';
        relatedTitle.textContent = 'Related Products';
        right.appendChild(relatedTitle);

        const relatedList = document.createElement('div');
        relatedList.className = 'product-recommendations__side-list';

        if (related.length) {
            related.slice(0, 2).forEach(function (product) {
                relatedList.appendChild(createRelatedSideCard(product, options));
            });
        } else {
            relatedList.appendChild(createEmptyState(TAB_COPY.related.empty));
        }

        right.appendChild(relatedList);

        split.appendChild(left);

        if (!options.relatedSidebarSelector) {
            split.appendChild(right);
        }

        return split;
    }

    function mountRelatedSidebar(related, options) {
        if (!options.relatedSidebarSelector) {
            return;
        }

        const host = document.querySelector(options.relatedSidebarSelector);
        if (!host) {
            return;
        }

        host.innerHTML = '';

        if (!related.length) {
            host.setAttribute('data-has-related', 'false');
            return;
        }

        const title = document.createElement('h3');
        title.className = 'product-recommendations__split-heading';
        title.textContent = 'Alternative products';

        const list = document.createElement('div');
        list.className = 'product-recommendations__side-list';
        related.slice(0, 2).forEach(function (product) {
            list.appendChild(createRelatedSideCard(product, options));
        });

        host.appendChild(title);
        host.appendChild(list);
        host.setAttribute('data-has-related', 'true');
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
        const splitLayout = options.layout === 'split';

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

        if (splitLayout) {
            root.classList.add('product-recommendations--split');
            if (options.relatedSidebarSelector) {
                root.classList.add('product-recommendations--sidebar-hosted');
            }
            setExpanded(root, true);
        }

        buttons.forEach(function (button) {
            if (splitLayout) {
                button.hidden = true;
                return;
            }

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

            mountRelatedSidebar(alternatives, options);

            if (splitLayout) {
                const body = root.querySelector('[data-recommendation-body]');
                if (body) {
                    body.hidden = false;
                    const splitNode = buildSplitLayout(related, alternatives, options);
                    body.appendChild(splitNode);
                }

                if (panels.related) panels.related.hidden = true;
                if (panels.alternatives) panels.alternatives.hidden = true;

                if (related.length === 0 && alternatives.length === 0) {
                    root.hidden = true;
                    return;
                }

                setStatusText(root, '', true);
                applyPricing(root, options);
                refreshVisibleCarousels(root);
                return;
            }

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
