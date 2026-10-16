(function () {
    var toggle = document.getElementById('menuToggle');
    var menu = document.getElementById('slideMenu');
    var overlay = document.getElementById('menuOverlay');

    function placeMenu() {
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
        var bottom = 72;
        if (nav) bottom = Math.max(0, window.innerHeight - nav.getBoundingClientRect().top);
        document.documentElement.style.setProperty('--mh-menu-top', Math.round(top) + 'px');
        document.documentElement.style.setProperty('--mh-menu-bottom', Math.round(bottom) + 'px');
    }

    function setMenuIcon(open) {
        if (!toggle) return;
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
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
        if (back) back.hidden = name === 'main';
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
            showView('main');
        });
    }

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
        toggle.addEventListener('click', function (event) {
            placeMenu();
            if (menu.classList.contains('active')) {
                event.preventDefault();
                event.stopImmediatePropagation();
                closeDrawer();
            }
        }, true);

        new MutationObserver(function () {
            var open = menu.classList.contains('active');
            setMenuIcon(open);
            if (open) placeMenu();
        }).observe(menu, { attributes: true, attributeFilter: ['class'] });
    }

    placeMenu();
    window.addEventListener('resize', placeMenu);
})();
