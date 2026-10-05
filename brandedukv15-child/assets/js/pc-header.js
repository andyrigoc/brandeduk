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
        addStylesheet(new URL('css/components/pc-header.css?v=20261005-searchoverflow', assetsRoot).href, 'standard');
        addStylesheet(new URL('css/components/pc-search.css?v=20261005-searchgrid2', assetsRoot).href, 'search');
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

    /* pc-header.css hides VAT labels without .is-active — seed Ex VAT visible after inject. */
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
            whatsapp.href = 'https://wa.me/447931372126';
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
        var script = document.createElement('script');
        script.src = new URL('js/pc-search.js?v=20261005-searchgrid2', assetsRoot).href;
        script.dataset.pcSearch = 'true';
        document.head.appendChild(script);
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
