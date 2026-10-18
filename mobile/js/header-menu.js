(function () {
    var toggle = document.getElementById('menuToggle');
    var menu = document.getElementById('slideMenu');
    var overlay = document.getElementById('menuOverlay');

    function placeMenuNow() {
        var header = document.querySelector('.mobile-header--v2');
        var promo = document.querySelector('.mh-promo');
        var nav = document.querySelector('.bottom-nav');
        var searchRow = document.querySelector('.mobile-header--v2 .mh-search');
        var top = header ? header.getBoundingClientRect().bottom : 118;
        if (searchRow) {
            document.documentElement.style.setProperty('--mh-search-bottom', Math.round(searchRow.getBoundingClientRect().bottom) + 'px');
        }
        if (promo) {
            var promoBox = promo.getBoundingClientRect();
            if (promoBox.height > 0 && promoBox.bottom > top - 1) top = promoBox.bottom;
        }
        var bottom = 0;
        if (nav) bottom = Math.max(0, window.innerHeight - nav.getBoundingClientRect().top);
        document.documentElement.style.setProperty('--mh-menu-top', Math.round(top) + 'px');
        document.documentElement.style.setProperty('--mh-menu-bottom', Math.round(bottom) + 'px');
    }

    var placeScheduled = false;
    function placeMenu() {
        if (placeScheduled) return;
        placeScheduled = true;
        requestAnimationFrame(function () {
            placeScheduled = false;
            placeMenuNow();
        });
    }

    function setMenuIcon(open) {
        if (!toggle) return;
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    function openDrawer() {
        if (menu) menu.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        var toggle = document.getElementById('menuToggle');
        var menu = document.getElementById('slideMenu');
        var overlay = document.getElementById('menuOverlay');
        if (menu) menu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
        showView('main');
        setMenuIcon(false);
    }

    function showView(name) {
        document.querySelectorAll('#slideMenu [data-mh-view]').forEach(function (view) {
            view.hidden = view.getAttribute('data-mh-view') !== name;
        });
        var back = document.getElementById('mhBack');
        if (back) {
            back.hidden = name === 'main';
            back.dataset.backTo = name === 'all-products' ? 'products' : 'main';
        }
        var scroll = document.querySelector('#slideMenu [data-mh-view="' + name + '"] .mh-view-scroll');
        if (scroll) scroll.scrollTop = 0;
    }

    document.querySelectorAll('#slideMenu [data-mh-open]').forEach(function (button) {
        button.addEventListener('click', function () {
            showView(button.getAttribute('data-mh-open'));
        });
    });

    var back = document.getElementById('mhBack');
    if (back) {
        back.addEventListener('click', function () {
            showView(back.dataset.backTo || 'main');
        });
    }

    var azReady = null;
    function slugifyName(name) {
        return String(name || '')
            .toLowerCase()
            .replace(/&/g, ' ')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    function shopTypeHref(slug) {
        return '/mobile/shop-mobile.html?productType=' + encodeURIComponent(slug) + '&force=mobile';
    }
    function fallbackTypes() {
        var list = window.BrandedConfig && Array.isArray(window.BrandedConfig.PRODUCT_TYPES)
            ? window.BrandedConfig.PRODUCT_TYPES
            : [];
        return list.map(function (name) {
            return { name: name, slug: slugifyName(name) };
        });
    }
    function loadProductTypes() {
        if (azReady) return azReady;
        var base = typeof window.resolveBrandedApiBase === 'function'
            ? window.resolveBrandedApiBase()
            : (window.API_BASE_URL || 'https://api.brandeduk.com');
        azReady = fetch(String(base).replace(/\/+$/, '') + '/api/filters/product-types')
            .then(function (response) { return response.ok ? response.json() : null; })
            .then(function (data) {
                var list = data && (data.productTypes || data.items || data.data);
                if (!Array.isArray(list) && Array.isArray(data)) list = data;
                var seen = {};
                var types = (list || []).map(function (type) {
                    var name = typeof type === 'string' ? type : (type.name || type.title || '');
                    var slug = (type && type.slug) || slugifyName(name);
                    return { name: name, slug: slug };
                }).filter(function (type) {
                    var key = type.slug || type.name.toLowerCase();
                    if (!type.name || key === 'tunic' || seen[key]) return false;
                    seen[key] = true;
                    return true;
                });
                types.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }); });
                return types.length ? types : fallbackTypes();
            })
            .catch(function () { return fallbackTypes(); });
        return azReady;
    }
    function ensureAllProductsView() {
        var panels = document.querySelector('#slideMenu .mh-panels');
        if (!panels || panels.querySelector('[data-mh-view="all-products"]')) {
            return panels && panels.querySelector('[data-mh-view="all-products"]');
        }
        var view = document.createElement('div');
        view.className = 'mh-view';
        view.setAttribute('data-mh-view', 'all-products');
        view.hidden = true;
        view.innerHTML = '<div class="mh-section-title">View all products</div><div class="mh-az"><div class="mh-view-scroll" data-az-list></div><nav class="mh-az-rail" data-az-rail aria-label="Letters"></nav></div>';
        panels.appendChild(view);
        return view;
    }
    function renderAllProducts(types) {
        var view = ensureAllProductsView();
        if (!view) return;
        var list = view.querySelector('[data-az-list]');
        var rail = view.querySelector('[data-az-rail]');
        var grouped = {};
        types.forEach(function (type) {
            var letter = (type.name.charAt(0) || '#').toUpperCase();
            if (!/[A-Z]/.test(letter)) letter = '#';
            if (!grouped[letter]) grouped[letter] = [];
            grouped[letter].push(type);
        });
        var letters = Object.keys(grouped).sort();
        list.innerHTML = letters.map(function (letter) {
            var rows = grouped[letter].map(function (type) {
                return '<a class="mh-row mh-az-row" href="' + shopTypeHref(type.slug) + '"><span>' + type.name.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span><span class="mh-chev" aria-hidden="true"></span></a>';
            }).join('');
            return '<h2 class="mh-az-letter" id="mh-az-' + letter + '" data-az-letter="' + letter + '">' + letter + '</h2>' + rows;
        }).join('');
        rail.innerHTML = letters.map(function (letter, index) {
            return '<button type="button" data-letter="' + letter + '"' + (index === 0 ? ' class="is-active"' : '') + '>' + letter + '</button>';
        }).join('');
        rail.onclick = function (event) {
            var button = event.target.closest('button[data-letter]');
            if (!button) return;
            var target = list.querySelector('[data-az-letter="' + button.getAttribute('data-letter') + '"]');
            if (target) target.scrollIntoView({ block: 'start' });
        };
        list.onscroll = function () {
            var top = list.getBoundingClientRect().top;
            var current = letters[0];
            letters.forEach(function (letter) {
                var node = list.querySelector('[data-az-letter="' + letter + '"]');
                if (node && node.getBoundingClientRect().top - top <= 28) current = letter;
            });
            rail.querySelectorAll('button').forEach(function (button) {
                button.classList.toggle('is-active', button.getAttribute('data-letter') === current);
            });
        };
    }
    function openAllProducts(event) {
        event.preventDefault();
        ensureAllProductsView();
        showView('all-products');
        loadProductTypes().then(renderAllProducts);
    }
    document.querySelectorAll('#slideMenu a.mh-row').forEach(function (link) {
        var label = (link.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (label !== 'view all categories' && label !== 'view all products') return;
        link.textContent = '';
        link.appendChild(document.createTextNode('View all products'));
        var chev = document.createElement('span');
        chev.className = 'mh-chev';
        chev.setAttribute('aria-hidden', 'true');
        link.appendChild(chev);
        link.setAttribute('href', '#all-products');
        link.addEventListener('click', openAllProducts);
    });

    document.querySelectorAll('[data-mh-quote]').forEach(function (button) {
        button.addEventListener('click', function () {
            closeDrawer();
            if (typeof window.openContactPopup === 'function') window.openContactPopup();
        });
    });

    document.querySelectorAll('#slideMenu a[href="#faq"]').forEach(function (link) {
        link.addEventListener('click', function () {
            closeDrawer();
        });
    });

    if (toggle && menu) {
        // Pages without mobile.js (basket, checkout) rely on these; with mobile.js both open/close the same way.
        toggle.addEventListener('click', function (event) {
            placeMenu();
            if (menu.classList.contains('active')) {
                event.preventDefault();
                event.stopImmediatePropagation();
                closeDrawer();
                return;
            }
            openDrawer();
        }, true);
        var closeButton = document.getElementById('closeMenu');
        if (closeButton) closeButton.addEventListener('click', closeDrawer);
        if (overlay) overlay.addEventListener('click', closeDrawer);

        new MutationObserver(function () {
            var open = menu.classList.contains('active');
            setMenuIcon(open);
            if (open) placeMenu();
        }).observe(menu, { attributes: true, attributeFilter: ['class'] });
    }

    placeMenu();
    window.addEventListener('resize', placeMenu);
})();
