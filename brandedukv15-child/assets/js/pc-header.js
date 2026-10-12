/* Start at the top on reload/navigation unless the URL targets an in-page anchor. Shared by pc-header.js, pc-footer.js and mobile/footer/footer.js. */
(function () {
    if (window.__brandedScrollTopOnReload) return;
    window.__brandedScrollTopOnReload = true;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    function hasAnchorTarget() {
        var id = window.location.hash.slice(1);
        if (!id) return false;
        try { id = decodeURIComponent(id); } catch (error) { /* keep raw hash */ }
        return !!(document.getElementById(id) || document.getElementsByName(id)[0]);
    }

    function resetScroll(event) {
        if (event && event.persisted) return;
        if (hasAnchorTarget()) return;
        window.scrollTo(0, 0);
    }

    resetScroll();
    window.addEventListener('pageshow', resetScroll);
    window.addEventListener('load', resetScroll);
})();

(function () {
    'use strict';

    var currentScript = document.currentScript;
    var scriptUrl = new URL(currentScript.src, window.location.href);
    var projectRoot = new URL('../../../', scriptUrl);
    var assetsRoot = new URL('brandedukv15-child/assets/', projectRoot);
    var mounted = false;
    var contactPopupPending = false;
    var contactPopupCallbacks = [];

    if (window.innerWidth < 700) {
        window.BrandedPcHeader = { mount: function () { return false; } };
        return;
    }

    function addStylesheet(href, marker) {
        var targetPath = new URL(href, window.location.href).pathname;
        var alreadyLoaded = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]')).some(function (link) {
            try {
                return new URL(link.href, window.location.href).pathname === targetPath;
            } catch (error) {
                return false;
            }
        });
        if (alreadyLoaded || document.querySelector('link[data-pc-header-style="' + marker + '"]')) return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.pcHeaderStyle = marker;
        document.head.appendChild(link);
    }

    function ensureSharedAssets() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            addStylesheet(
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
                'font-awesome'
            );
        }
        addStylesheet(new URL('css/components/header.css?v=20260220', assetsRoot).href, 'base');
        addStylesheet(new URL('css/components/promo-bar.css?v=20260425a', assetsRoot).href, 'promo');
        addStylesheet(new URL('css/components/pc-header.css?v=20261012-more', assetsRoot).href, 'standard');
        addStylesheet(new URL('css/components/pc-search.css?v=20261008-searchleaf1', assetsRoot).href, 'search');
        addStylesheet(new URL('css/components/header-basket-lottie.css?v=20261012-allpages', assetsRoot).href, 'basket');
        addFonts();
    }

    /* Same webfonts as home-pc: Inter for the header, Poppins for its buttons and the ticker. */
    function addFonts() {
        var href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap';
        if (document.querySelector('link[rel="stylesheet"][href="' + href + '"]')) return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.pcHeaderStyle = 'fonts';
        document.head.appendChild(link);
    }

    function resolveTemplateUrls(root) {
        root.querySelectorAll('[href], [src]').forEach(function (element) {
            ['href', 'src'].forEach(function (attribute) {
                var value = element.getAttribute(attribute);
                if (!value || value.charAt(0) === '#' || /^(?:mailto:|tel:|javascript:|data:)/i.test(value)) return;
                try {
                    element.setAttribute(attribute, new URL(value, projectRoot).href);
                } catch (error) {
                    // Keep the original value when it is not a URL.
                }
            });
        });
    }

    function configureSearch(header) {
        var input = header.querySelector('#searchbarHeaderInput');
        if (input) {
            input.dataset.acCustom = 'true';
            input.dataset.pcHeaderSearch = 'true';
        }
    }

    function configureBasket(header) {
        header.querySelectorAll('.header-top-basket-link').forEach(function (basket) {
            basket.removeAttribute('onclick');
            basket.href = new URL('basket.html', projectRoot).href;
            // The small top-bar cart goes to the basket page; the Basket link opens the side summary.
            if (!basket.classList.contains('header-util-link')) {
                basket.setAttribute('aria-label', 'View basket');
                return;
            }
            basket.addEventListener('click', function (event) {
                if (typeof window.openOrderDrawer === 'function') {
                    event.preventDefault();
                    window.openOrderDrawer();
                } else if (isBasketPage()) {
                    event.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    function relocateShopProducts(header) {
        var inner = header.querySelector('.searchbar-header__inner');
        var dropdown = header.querySelector('.category-dropdown');
        var actions = inner && inner.querySelector('.searchbar-header__actions');
        if (!inner || !dropdown || !actions || dropdown.parentElement === inner) return;
        inner.insertBefore(dropdown, actions);
    }

    /* Match home-pc: lock header rail to hero width, or viewport when no hero (basket/shop). */
    function syncHeaderRailWidth() {
        var header = document.querySelector('.site-header');
        if (!header) return;
        var hero = document.querySelector('.hero-banners-container');
        var width = 0;
        if (hero) {
            width = Math.round(hero.getBoundingClientRect().width);
        }
        if (!(width > 0)) {
            width = Math.min(Math.round(window.innerWidth), 1440);
        }
        if (width > 0) {
            header.style.setProperty('--bu-hero-width', width + 'px');
        }
    }

    function bindHeaderRailSync() {
        if (window.__buHeroRailBound) {
            syncHeaderRailWidth();
            return;
        }
        window.__buHeroRailBound = true;
        var scheduled = false;
        function schedule() {
            if (scheduled) return;
            scheduled = true;
            window.requestAnimationFrame(function () {
                scheduled = false;
                syncHeaderRailWidth();
            });
        }
        syncHeaderRailWidth();
        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('load', schedule);
        if (typeof ResizeObserver === 'function') {
            var hero = document.querySelector('.hero-banners-container');
            if (hero) new ResizeObserver(schedule).observe(hero);
        }
    }

    /* Fold overflowing primary-nav items into a trailing More dropdown. Measures drawn
       sizes (getBoundingClientRect) so the 0.95 zoom on .header-with-promo is included. */
    var navOverflow = null;

    function navZoomFactor(el) {
        var promo = el && el.closest ? el.closest('.header-with-promo') : null;
        if (!promo) return 1;
        var zoom = window.getComputedStyle(promo).zoom;
        if (!zoom || zoom === 'normal') return 1;
        var value = parseFloat(zoom);
        return value > 0 ? value : 1;
    }

    function drawnWidth(el) {
        return el ? el.getBoundingClientRect().width : 0;
    }

    function navItemLabel(item) {
        var trigger = item.querySelector(':scope > a');
        if (!trigger) return '';
        var clone = trigger.cloneNode(true);
        var caret = clone.querySelector('.nav-caret');
        if (caret) caret.remove();
        return (clone.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function navItemHref(item) {
        var trigger = item.querySelector(':scope > a');
        var raw = trigger ? (trigger.getAttribute('href') || '').trim() : '';
        if (raw && raw !== '#') return trigger.href;
        var viewAll = item.querySelector('.allprod-view-all a');
        if (viewAll && (viewAll.getAttribute('href') || '').trim() && viewAll.getAttribute('href') !== '#') {
            return viewAll.href;
        }
        var heroCta = item.querySelector('.mega-hero-cta');
        if (heroCta && (heroCta.getAttribute('href') || '').trim() && heroCta.getAttribute('href') !== '#') {
            return heroCta.href;
        }
        var label = navItemLabel(item).toLowerCase();
        if (label === 'industries') return new URL('industries.html', projectRoot).href;
        return new URL('shop-pc.html', projectRoot).href;
    }

    function navOverflowItems(menu) {
        return Array.prototype.filter.call(menu.children, function (el) {
            return el.tagName === 'LI' && !el.classList.contains('nav-more');
        });
    }

    function closeNavOverflow(state) {
        if (!state || !state.more) return;
        state.more.classList.remove('is-open');
        state.toggle.setAttribute('aria-expanded', 'false');
        state.panel.hidden = true;
    }

    function openNavOverflow(state, focusFirst) {
        if (!state || state.more.hidden) return;
        state.more.classList.add('is-open');
        state.toggle.setAttribute('aria-expanded', 'true');
        state.panel.hidden = false;
        document.querySelectorAll('.main-nav .menu > li.has-megamenu.is-open').forEach(function (item) {
            item.classList.remove('is-open');
            var trigger = item.querySelector(':scope > a');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
        if (focusFirst) {
            var first = state.panel.querySelector('a');
            if (first) first.focus();
        }
    }

    function populateNavOverflow(state, overflow) {
        state.panel.textContent = '';
        overflow.forEach(function (item) {
            var li = document.createElement('li');
            var link = document.createElement('a');
            link.href = navItemHref(item);
            link.textContent = navItemLabel(item);
            li.appendChild(link);
            state.panel.appendChild(li);
        });
        var overflowActive = overflow.some(function (item) {
            return item.classList.contains('is-active') ||
                !!(item.querySelector(':scope > a[aria-current="page"]'));
        });
        state.more.classList.toggle('is-active', overflowActive);
    }

    function measureNavGap(menu, items, zoom) {
        var visible = items.filter(function (item) {
            return !item.classList.contains('is-nav-overflow');
        });
        if (visible.length >= 2) {
            var first = visible[0].getBoundingClientRect();
            var second = visible[1].getBoundingClientRect();
            var gap = second.left - first.right;
            if (gap >= 0 && gap < 80) return gap;
        }
        var style = window.getComputedStyle(menu);
        var raw = style.columnGap && style.columnGap !== 'normal' ? style.columnGap : style.gap;
        var px = parseFloat(raw) || 0;
        return px * zoom;
    }

    function recalcNavOverflow(state) {
        if (!state || !state.nav || !state.menu) return;
        var menu = state.menu;
        var items = navOverflowItems(menu);
        if (!items.length) {
            state.more.hidden = true;
            closeNavOverflow(state);
            return;
        }

        var wasOpen = state.more.classList.contains('is-open');
        closeNavOverflow(state);
        menu.classList.add('is-nav-measuring');
        items.forEach(function (item) { item.classList.remove('is-nav-overflow'); });
        state.more.hidden = true;

        var navWidth = drawnWidth(state.nav);
        var zoom = navZoomFactor(state.nav);
        var gap = measureNavGap(menu, items, zoom);
        var widths = items.map(drawnWidth);

        function itemsWidth(count) {
            var total = 0;
            var i;
            for (i = 0; i < count; i += 1) {
                total += widths[i];
                if (i) total += gap;
            }
            return total;
        }

        var allWidth = itemsWidth(items.length);
        var overflow = [];
        var visibleCount = items.length;
        var i;

        if (allWidth > navWidth + 0.75) {
            state.more.hidden = false;
            var moreWidth = Math.max(drawnWidth(state.more), 1);
            var budget = navWidth - moreWidth - gap;
            visibleCount = items.length;
            while (visibleCount > 1 && itemsWidth(visibleCount) > budget + 0.75) {
                visibleCount -= 1;
            }
            overflow = items.slice(visibleCount);
        }

        for (i = 0; i < items.length; i += 1) {
            if (i >= visibleCount) {
                items[i].classList.add('is-nav-overflow');
                items[i].classList.remove('is-open');
                var trigger = items[i].querySelector(':scope > a');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            } else {
                items[i].classList.remove('is-nav-overflow');
            }
        }

        if (overflow.length) {
            state.more.hidden = false;
            populateNavOverflow(state, overflow);
            if (wasOpen) openNavOverflow(state, false);
        } else {
            state.more.hidden = true;
            state.panel.textContent = '';
            state.more.classList.remove('is-active');
        }
        menu.classList.remove('is-nav-measuring');
    }

    function scheduleNavOverflow() {
        if (!navOverflow) return;
        if (navOverflow.scheduled) return;
        navOverflow.scheduled = true;
        window.requestAnimationFrame(function () {
            if (!navOverflow) return;
            navOverflow.scheduled = false;
            recalcNavOverflow(navOverflow);
        });
    }

    function ensureNavMore(menu) {
        var existing = menu.querySelector(':scope > li.nav-more');
        if (existing) return existing;
        var more = document.createElement('li');
        more.className = 'nav-more';
        more.hidden = true;
        more.innerHTML =
            '<a class="nav-more-toggle" href="#" aria-haspopup="true" aria-expanded="false">' +
                'More<span class="nav-caret" aria-hidden="true"></span>' +
            '</a>' +
            '<ul class="nav-more-panel" hidden></ul>';
        menu.appendChild(more);
        return more;
    }

    function bindNavOverflow(header) {
        var root = header || document.querySelector('.site-header');
        if (!root) return;
        var nav = root.querySelector('.main-nav');
        var menu = nav && nav.querySelector(':scope > .menu');
        if (!nav || !menu) return;

        if (navOverflow && navOverflow.nav === nav) {
            scheduleNavOverflow();
            return;
        }

        var more = ensureNavMore(menu);
        var toggle = more.querySelector('.nav-more-toggle');
        var panel = more.querySelector('.nav-more-panel');
        if (!toggle || !panel) return;

        navOverflow = {
            nav: nav,
            menu: menu,
            more: more,
            toggle: toggle,
            panel: panel,
            scheduled: false
        };

        toggle.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (navOverflow.more.hidden) return;
            if (navOverflow.more.classList.contains('is-open')) closeNavOverflow(navOverflow);
            else openNavOverflow(navOverflow, false);
        });

        toggle.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
                event.preventDefault();
                if (navOverflow.more.classList.contains('is-open')) closeNavOverflow(navOverflow);
                else openNavOverflow(navOverflow, true);
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                openNavOverflow(navOverflow, true);
            } else if (event.key === 'Escape') {
                closeNavOverflow(navOverflow);
            }
        });

        panel.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            closeNavOverflow(navOverflow);
            toggle.focus();
        });

        if (!window.__buNavOverflowDocBound) {
            window.__buNavOverflowDocBound = true;
            document.addEventListener('click', function (event) {
                if (!navOverflow) return;
                if (!(event.target instanceof Element)) return;
                if (event.target.closest('.nav-more')) return;
                closeNavOverflow(navOverflow);
            });
            document.addEventListener('keydown', function (event) {
                if (event.key !== 'Escape' || !navOverflow) return;
                if (!navOverflow.more.classList.contains('is-open')) return;
                closeNavOverflow(navOverflow);
                navOverflow.toggle.focus();
            });
            window.addEventListener('resize', scheduleNavOverflow, { passive: true });
            window.addEventListener('load', scheduleNavOverflow);
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(scheduleNavOverflow);
            }
        }

        if (typeof ResizeObserver === 'function') {
            var observer = new ResizeObserver(scheduleNavOverflow);
            observer.observe(nav);
            var container = nav.closest('.header-container');
            if (container) observer.observe(container);
        }

        var allprod = root.querySelector('[data-product-types-menu]');
        if (allprod && typeof MutationObserver === 'function') {
            new MutationObserver(scheduleNavOverflow).observe(allprod, {
                childList: true,
                subtree: true
            });
        }

        recalcNavOverflow(navOverflow);
    }

    /* pc-header.css hides VAT labels without .is-active â€” seed Ex VAT visible after inject. */
    function configureVatLabels(header) {
        header.querySelectorAll('.header-top-vat-control').forEach(function (control) {
            var button = control.querySelector('.header-top-vat-toggle');
            var exc = control.querySelector('[data-vat-exc]');
            var inc = control.querySelector('[data-vat-inc]');
            if (!button) return;
            var isOn = button.classList.contains('is-on') || button.getAttribute('aria-pressed') === 'true';
            if (window.brandedukv15 && window.brandedukv15.vat && typeof window.brandedukv15.vat.isOn === 'function') {
                isOn = !!window.brandedukv15.vat.isOn();
            }
            button.classList.toggle('is-on', isOn);
            button.setAttribute('aria-pressed', isOn ? 'true' : 'false');
            if (exc) exc.classList.toggle('is-active', !isOn);
            if (inc) inc.classList.toggle('is-active', isOn);
        });
    }

    function configureContactActions(header) {
        var whatsapp = header.querySelector('[data-open-whatsapp="1"]');
        if (whatsapp) {
            whatsapp.href = 'https://wa.me/447447348564';
            whatsapp.target = '_blank';
            whatsapp.rel = 'noopener';
        }
        header.querySelectorAll('[data-open-contact="1"]').forEach(function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                ensureContactPopup(openContactPopup);
            });
        });
    }

    function openContactPopup() {
        if (typeof window.openContactPopup === 'function') {
            window.openContactPopup();
            return;
        }
        var popup = document.getElementById('popupContact');
        var overlay = document.getElementById('popupOverlay');
        if (!popup) return;
        popup.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function flushContactPopupCallbacks() {
        var callbacks = contactPopupCallbacks.splice(0);
        callbacks.forEach(function (callback) { callback(); });
    }

    function hasAsset(selector, attribute, fileName) {
        return Array.from(document.querySelectorAll(selector)).some(function (element) {
            try {
                return new URL(element.getAttribute(attribute), window.location.href).pathname.split('/').pop() === fileName;
            } catch (error) {
                return false;
            }
        });
    }

    function ensureContactPopup(callback) {
        if (typeof callback === 'function') contactPopupCallbacks.push(callback);
        if (document.getElementById('popupContact')) {
            flushContactPopupCallbacks();
            return;
        }
        if (contactPopupPending || !window.BrandedPcContactTemplate || !document.body) return;
        contactPopupPending = true;

        function injectMarkup() {
            if (!document.getElementById('popupContact')) {
                document.body.insertAdjacentHTML('beforeend', window.BrandedPcContactTemplate);
            }
            if (typeof window.openContactPopup !== 'function' && !hasAsset('script[src]', 'src', 'popup-contact.js')) {
                var script = document.createElement('script');
                script.src = new URL('mobile/js/popup-contact.js?v=20261003-consent', projectRoot).href;
                script.dataset.pcContactPopup = 'true';
                document.body.appendChild(script);
            }
            contactPopupPending = false;
            flushContactPopupCallbacks();
        }

        // The popup markup must not render before its stylesheet hides it.
        if (hasAsset('link[rel="stylesheet"][href]', 'href', 'popup-contact.css')) {
            injectMarkup();
            return;
        }
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = new URL('mobile/css/popup-contact.css?v=20261003-consent', projectRoot).href;
        link.dataset.pcHeaderStyle = 'contact';
        link.addEventListener('load', injectMarkup);
        link.addEventListener('error', injectMarkup);
        document.head.appendChild(link);
    }

    function initAllProductsDescriptions(header) {
        var panel = header.querySelector('.allprod-desc-panel');
        if (!panel) return;
        var name = panel.querySelector('.allprod-desc-name');
        var description = panel.querySelector('.allprod-desc-text');
        header.querySelectorAll('.allprod-list li[data-catdesc]').forEach(function (item) {
            item.addEventListener('mouseenter', function () {
                var link = item.querySelector('a');
                if (name) name.textContent = link ? link.textContent.trim() : '';
                if (description) description.textContent = item.dataset.catdesc || '';
                panel.classList.add('has-content');
            });
        });
    }

    function loadHeaderBehaviour() {
        if (window.__brandedukHeaderScriptsInitialized === true) return;
        var script = document.createElement('script');
        script.src = new URL('js/header.js?v=20260924-header3', assetsRoot).href;
        script.dataset.pcHeaderBehaviour = 'true';
        document.head.appendChild(script);
    }

    function loadPcSearch() {
        if (window.BrandedPcSearchInitialized || document.querySelector('script[data-pc-search]')) return;

        function appendScript(src, attrs) {
            return new Promise(function (resolve, reject) {
                var existing = attrs && attrs['data-pc-search']
                    ? document.querySelector('script[data-pc-search]')
                    : null;
                if (existing) {
                    resolve(existing);
                    return;
                }
                var script = document.createElement('script');
                script.src = new URL(src, assetsRoot).href;
                if (attrs) {
                    Object.keys(attrs).forEach(function (key) {
                        script.setAttribute(key, attrs[key]);
                    });
                }
                script.onload = function () { resolve(script); };
                script.onerror = function () { reject(new Error('Failed to load ' + src)); };
                document.head.appendChild(script);
            });
        }

        var chain = Promise.resolve();
        if (!window.BrandedOrganicSustainableCodes && !document.querySelector('script[data-organic-codes]')) {
            chain = chain.then(function () {
                return appendScript('data/organic-sustainable-codes.js?v=20261006-leaf3', { 'data-organic-codes': 'true' });
            });
        }
        if (!window.BrandedOrganicLeaf && !document.querySelector('script[data-organic-leaf]')) {
            chain = chain.then(function () {
                return appendScript('js/organic-leaf.js?v=20261006-leaf4', { 'data-organic-leaf': 'true' });
            });
        }
        chain.then(function () {
            return appendScript('js/pc-search.js?v=20261008-searchleaf1', { 'data-pc-search': 'true' });
        }).catch(function () {
            // Search should still work even if the eco badge assets fail to load.
            appendScript('js/pc-search.js?v=20261008-searchleaf1', { 'data-pc-search': 'true' });
        });
    }

    function isBasketPage() {
        return /\/basket(?:\.html)?$/i.test(window.location.pathname);
    }

    /* All Products list, laptop basket icon and side basket drawer, as on home-pc. Waits for DOMContentLoaded
       so pages that already include these scripts later in <body> (home, shop-pc) are not given a second copy. */
    function loadHeaderExtras() {
        function hasScript(fileName) {
            return hasAsset('script[src]', 'src', fileName);
        }
        function appendScript(src) {
            var script = document.createElement('script');
            script.src = src;
            script.dataset.pcHeaderBasket = 'true';
            document.body.appendChild(script);
        }
        if (!hasScript('product-types-menu.js')) {
            appendScript(new URL('brandeduk.com/js/product-types-menu.js?v=20261006-apibase', projectRoot).href);
        }
        // The basket page already shows the full basket, so its laptop icon does not open the drawer.
        if (!isBasketPage() && typeof window.openOrderDrawer !== 'function' && !hasScript('order-drawer-pc.js')) {
            appendScript(new URL('order-drawer-pc.js?v=20261007-tablet-side', projectRoot).href);
        }
        if (!hasScript('header-basket-lottie.js')) {
            appendScript(new URL('js/header-basket-lottie.js?v=20261012-allpages', assetsRoot).href);
        }
    }

    function mount() {
        if (mounted) return true;
        var templateSource = window.BrandedPcHeaderTemplate;
        var existingHeader = document.querySelector('.site-header');
        if (!templateSource || !existingHeader) return false;

        var template = document.createElement('template');
        template.innerHTML = templateSource.trim();
        var newHeader = template.content.querySelector('.site-header');
        var newPromo = template.content.querySelector('.top-promo-bar');
        if (!newHeader || !newPromo) return false;

        resolveTemplateUrls(newHeader);
        configureSearch(newHeader);
        configureBasket(newHeader);
        configureContactActions(newHeader);
        relocateShopProducts(newHeader);
        configureVatLabels(newHeader);
        existingHeader.replaceWith(newHeader);

        var existingPromo = document.querySelector('.top-promo-bar');
        if (existingPromo) {
            existingPromo.replaceWith(newPromo);
        } else {
            newHeader.insertAdjacentElement('afterend', newPromo);
        }

        var wrapper = newHeader.closest('.header-with-promo');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'header-with-promo';
            newHeader.parentNode.insertBefore(wrapper, newHeader);
            wrapper.appendChild(newHeader);
            wrapper.appendChild(newPromo);
        } else if (newPromo.parentElement !== wrapper) {
            wrapper.appendChild(newPromo);
        }

        if (window.BrandedConfig && typeof window.BrandedConfig.applyMegaDropAssets === 'function') {
            window.BrandedConfig.applyMegaDropAssets(newHeader);
        }
        initAllProductsDescriptions(newHeader);
        var standardStyles = document.querySelector('link[data-pc-header-style="standard"]');
        if (standardStyles) document.head.appendChild(standardStyles);
        loadHeaderBehaviour();
        loadPcSearch();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadHeaderExtras);
        } else {
            loadHeaderExtras();
        }
        bindHeaderRailSync();
        document.documentElement.classList.remove('pc-header-loading');
        document.documentElement.classList.add('pc-header-ready');
        mounted = true;
        return true;
    }

    document.documentElement.classList.add('pc-header-loading');
    ensureSharedAssets();
    window.BrandedPcHeader = { mount: mount };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { ensureContactPopup(); });
    } else {
        ensureContactPopup();
    }

    window.addEventListener('load', function () {
        if (!mounted) {
            document.documentElement.classList.remove('pc-header-loading');
            loadHeaderBehaviour();
        }
    });
})();
