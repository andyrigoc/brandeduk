(function () {
    'use strict';
    var currentScript = document.currentScript;
    var scriptUrl = new URL(currentScript.src, window.location.href);
    var projectRoot = new URL('../../../', scriptUrl);
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
        if (window.innerWidth < 700) {
            items.forEach(function (item) { item.classList.remove('is-nav-overflow'); });
            state.more.hidden = true;
            state.panel.textContent = '';
            closeNavOverflow(state);
            return;
        }
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
    window.BrandedPcNavOverflow = { bind: bindNavOverflow };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { bindNavOverflow(document); }, { once: true });
    } else {
        bindNavOverflow(document);
    }
})();
