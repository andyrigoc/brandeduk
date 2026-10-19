/* Mobile customise page: 4-step order progress (Product · Colour · Quantity · Customise).
   Reads window.BrandedCustomizeProgress (customize.js) and recolours steps as the user advances. */
(function () {
    'use strict';

    var root = document.getElementById('orderSteps');
    if (!root) return;

    var colourPicked = false;
    var lastKey = '';

    function readProgress() {
        var p = typeof window.BrandedCustomizeProgress === 'function' ? window.BrandedCustomizeProgress() : {};
        var totalEl = document.getElementById('totalQty');
        var domQty = totalEl ? parseInt(totalEl.textContent, 10) || 0 : 0;
        p.quantity = Math.max(Number(p.quantity) || 0, domQty);
        var urlCode = new URLSearchParams(window.location.search).get('code');
        if (urlCode) p.productCode = urlCode.toUpperCase();
        if (!p.logoConfigured && basketHasLogoFor(p.productCode, p.colorName)) p.logoConfigured = true;
        return p;
    }

    // Logos are applied in the customiser tool and saved to the basket, so check it too.
    function basketHasLogoFor(code, colour) {
        if (!code) return false;
        var basket;
        try { basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]'); } catch (e) { return false; }
        if (!Array.isArray(basket)) return false;
        code = String(code).toUpperCase();
        return basket.some(function (item) {
            if (!item || String(item.productCode || item.code || '').toUpperCase() !== code) return false;
            if (colour && item.color && String(item.color).toLowerCase() !== String(colour).toLowerCase()) return false;
            if (item.logos && item.logos.length) return true;
            if (Array.isArray(item.positions) && item.positions.some(function (pos) { return pos && pos.logo; })) return true;
            return !!(item.positionDesigns && Object.values(item.positionDesigns).some(function (d) { return d && d.logo; }));
        });
    }

    function setStep(name, status, sub) {
        var li = root.querySelector('[data-step="' + name + '"]');
        if (!li) return;
        li.classList.toggle('is-done', status === 'done');
        li.classList.toggle('is-current', status === 'current');
        var btn = li.querySelector('.order-step__btn');
        if (status === 'current') btn.setAttribute('aria-current', 'step');
        else btn.removeAttribute('aria-current');
        var subEl = li.querySelector('[data-step-sub]');
        if (subEl && sub != null) subEl.textContent = sub;
    }

    function update() {
        var p = readProgress();
        var qty = p.quantity;
        var done = {
            product: true,
            colour: colourPicked || qty > 0,
            quantity: qty > 0,
            customise: !!p.logoConfigured
        };
        var order = ['product', 'colour', 'quantity', 'customise'];
        var current = order.find(function (s) { return !done[s]; }) || null;
        var key = JSON.stringify([done, current, p.productCode, p.colorName, qty, p.designCount]);
        if (key === lastKey) return;
        lastKey = key;

        var subs = {
            product: p.productCode || '\u00a0',
            colour: done.colour && p.colorName ? p.colorName : 'Choose',
            quantity: qty > 0 ? qty + ' pcs' : 'Sizes',
            customise: p.designCount > 0 ? p.designCount + (p.designCount === 1 ? ' logo' : ' logos') : (done.customise ? 'Added' : 'Add logo')
        };
        order.forEach(function (s) {
            setStep(s, done[s] ? 'done' : (s === current ? 'current' : 'todo'), subs[s]);
        });
        root.setAttribute('data-progress', String(order.filter(function (s) { return done[s]; }).length));
    }

    var pending = null;
    function schedule() {
        if (pending) return;
        pending = setTimeout(function () { pending = null; update(); }, 60);
    }

    document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('#colorOptions [data-color]')) colourPicked = true;
        schedule();
    }, true);
    ['input', 'change', 'basketUpdated', 'pageshow'].forEach(function (ev) {
        document.addEventListener(ev, schedule, true);
        window.addEventListener(ev, schedule);
    });

    var totalEl = document.getElementById('totalQty');
    if (totalEl && window.MutationObserver) {
        new MutationObserver(schedule).observe(totalEl, { childList: true, characterData: true, subtree: true });
    }
    // Logos can be applied asynchronously (upload / popup); a light poll keeps the bar honest.
    setInterval(function () { if (!document.hidden) update(); }, 1000);

    root.addEventListener('click', function (e) {
        var btn = e.target.closest('.order-step__btn');
        if (!btn) return;
        var target = document.getElementById(btn.getAttribute('data-target'));
        if (!target) return;
        if (target.id === 'addToBasketBtn') {
            target.click();
            return;
        }
        scrollToSection(target);
    });

    function scrollToSection(target) {
        var section = target.closest('section') || target;
        var header = document.querySelector('.header, header');
        var offset = (header ? header.getBoundingClientRect().height : 100) + 12;
        window.scrollTo({ top: section.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
    }

    // After the product loads and a short pause, glide down to the colour picker
    // unless the user has already started scrolling or interacting.
    var userInteracted = false;
    ['touchstart', 'wheel', 'keydown', 'mousedown'].forEach(function (ev) {
        window.addEventListener(ev, function () { userInteracted = true; }, { once: true, passive: true });
    });

    var autoScrollTries = 0;
    var autoScrollTimer = setInterval(function () {
        autoScrollTries++;
        var colours = document.getElementById('colorOptions');
        var ready = colours && colours.querySelector('[data-color]');
        if (!ready && autoScrollTries < 40) return;
        clearInterval(autoScrollTimer);
        if (!ready) return;
        setTimeout(function () {
            var p = readProgress();
            if (userInteracted || colourPicked || p.quantity > 0 || window.pageYOffset > 40) return;
            scrollToSection(colours);
        }, 900);
    }, 250);

    update();
})();
