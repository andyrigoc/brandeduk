(function () {
    'use strict';

    var currentScript = document.currentScript;
    var scriptUrl = new URL(currentScript.src, window.location.href);
    var projectRoot = new URL('../../../', scriptUrl);
    var assetsRoot = new URL('brandedukv15-child/assets/', projectRoot);
    var mounted = false;

    if (window.innerWidth < 1024) {
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
        addStylesheet(new URL('css/components/pc-header.css?v=20260925-header28', assetsRoot).href, 'standard');
        addStylesheet(new URL('css/components/pc-search.css?v=20260924-search3', assetsRoot).href, 'search');
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
                if (typeof window.openContactPopup === 'function') {
                    window.openContactPopup();
                    return;
                }
                var popup = document.getElementById('popupContact');
                var overlay = document.getElementById('popupOverlay');
                if (popup) {
                    popup.classList.add('active');
                    if (overlay) overlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    return;
                }
                window.location.href = new URL('quote-form.html', projectRoot).href;
            });
        });
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
        script.src = new URL('js/pc-search.js?v=20260920-product-cache', assetsRoot).href;
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
        document.documentElement.classList.remove('pc-header-loading');
        document.documentElement.classList.add('pc-header-ready');
        mounted = true;
        return true;
    }

    document.documentElement.classList.add('pc-header-loading');
    ensureSharedAssets();
    window.BrandedPcHeader = { mount: mount };

    window.addEventListener('load', function () {
        if (!mounted) {
            document.documentElement.classList.remove('pc-header-loading');
            loadHeaderBehaviour();
        }
    });
})();
