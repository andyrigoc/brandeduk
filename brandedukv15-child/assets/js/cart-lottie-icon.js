(function () {
    'use strict';

    var LOTTIE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js';
    var currentScript = document.currentScript;
    var ANIMATION_URL = new URL('../images/ui/cart-icon-loader.json', currentScript.src).href;
    // The cart occupies a small area of the 600x600 composition; crop the viewBox to it.
    var VIEW_BOX = '180 192 216 216';
    // Frame where the orange cart is fully drawn; the icon rests here between plays.
    var REST_FRAME = 46;
    var LAST_FRAME = 120;
    // The static cart stays hidden until the Lottie cart is drawn; reveal it only if loading takes longer than this.
    var FALLBACK_DELAY = 4000;
    var HEADER_CART = '.site-header .header-top-links a.header-top-basket-link:not(.header-util-link)';
    var root = document.documentElement;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canObserveVisibility = 'IntersectionObserver' in window;
    // Same breakpoint pc-header.js uses before it injects the shared PC header.
    var wantsHeaderCart = currentScript.hasAttribute('data-header-cart') && window.innerWidth >= 1024;

    var waiting = [];
    var resourcesRequested = false;
    var animationText = null;
    var status = 'loading';
    var headerObserver = null;

    // cart-lottie-icon.css hides the static carts under these classes from first paint.
    root.classList.add('cart-lottie-js');
    if (wantsHeaderCart) root.classList.add('cart-lottie-header');

    function parseCount(text) {
        var value = parseInt(String(text || '').replace(/\D/g, ''), 10);
        return Number.isFinite(value) ? value : 0;
    }

    function showFallback(icon) {
        if (!icon.ready) icon.wrapper.classList.add('is-anim-failed');
    }

    function playIntro(icon) {
        if (!icon.ready) return;
        if (reduceMotion) {
            icon.animation.goToAndStop(REST_FRAME, true);
            return;
        }
        icon.introPlayed = true;
        icon.animation.playSegments([0, REST_FRAME], true);
    }

    function replay(icon) {
        if (!icon.ready || reduceMotion || icon.animation.isPaused === false) return;
        icon.animation.playSegments([[REST_FRAME, LAST_FRAME], [0, REST_FRAME]], true);
    }

    function start(icon) {
        var animation;
        try {
            animation = window.lottie.loadAnimation({
                container: icon.player,
                renderer: 'svg',
                loop: false,
                autoplay: false,
                animationData: JSON.parse(animationText),
                rendererSettings: { viewBoxSize: VIEW_BOX, preserveAspectRatio: 'xMidYMid meet' }
            });
        } catch (error) {
            showFallback(icon);
            return;
        }
        icon.animation = animation;
        var onReady = function () {
            if (icon.ready) return;
            icon.ready = true;
            clearTimeout(icon.fallbackTimer);
            icon.wrapper.classList.remove('is-anim-failed');
            icon.wrapper.classList.add('is-anim-ready');
            if (icon.visible) playIntro(icon);
            else animation.goToAndStop(REST_FRAME, true);
        };
        animation.addEventListener('DOMLoaded', onReady);
        animation.addEventListener('data_failed', function () { showFallback(icon); });
        if (animation.isLoaded) onReady();
    }

    function startWaiting() {
        if (status === 'failed' || !window.lottie || animationText === null) return;
        status = 'ready';
        waiting.splice(0).forEach(start);
    }

    function failAll() {
        status = 'failed';
        waiting.splice(0).forEach(showFallback);
    }

    function requestResources() {
        if (resourcesRequested) return;
        resourcesRequested = true;
        fetch(ANIMATION_URL, { credentials: 'same-origin' })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            })
            .then(function (text) {
                animationText = text;
                startWaiting();
            }, failAll);
        if (window.lottie) return;
        // The header cart script may already be fetching the same library.
        var script = document.querySelector('script[src="' + LOTTIE_SRC + '"]');
        if (!script) {
            script = document.createElement('script');
            script.src = LOTTIE_SRC;
            script.async = true;
            (document.head || root).appendChild(script);
        }
        script.addEventListener('load', startWaiting);
        script.addEventListener('error', failAll);
    }

    function watchCount(badge, onIncrease) {
        var previous = badge.textContent.trim();
        new MutationObserver(function () {
            var text = badge.textContent.trim();
            if (parseCount(text) > parseCount(previous)) onIncrease();
            previous = text;
        }).observe(badge, { childList: true, characterData: true, subtree: true });
    }

    function watchVisibility(icon) {
        new IntersectionObserver(function (entries) {
            var wasVisible = icon.visible;
            icon.visible = entries[entries.length - 1].isIntersecting;
            if (icon.visible && !wasVisible && (icon.replayOnShow || !icon.introPlayed)) playIntro(icon);
        }).observe(icon.wrapper);
    }

    // host: the link/button holding the cart svg. options.badge: count element (defaults to [data-cart-lottie-badge]).
    // options.replayOnShow: draw the cart in again every time the host becomes visible (e.g. inside a popup).
    function mount(host, options) {
        if (!host || host.classList.contains('cart-lottie-host') || host.querySelector('.header-basket-icon')) return null;
        options = options || {};

        var wrapper = document.createElement('span');
        wrapper.className = 'cart-lottie-icon';
        var svg = host.querySelector('svg');
        host.insertBefore(wrapper, host.firstChild);
        if (svg) wrapper.appendChild(svg);
        var player = document.createElement('span');
        player.className = 'cart-lottie-player';
        player.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(player);
        host.classList.add('cart-lottie-host');

        var icon = {
            wrapper: wrapper,
            player: player,
            animation: null,
            ready: false,
            visible: !canObserveVisibility,
            introPlayed: false,
            replayOnShow: !!options.replayOnShow,
            fallbackTimer: 0
        };

        var badge = options.badge || host.querySelector('[data-cart-lottie-badge]');
        if (badge) {
            badge.classList.add('cart-lottie-badge');
            watchCount(badge, function () { replay(icon); });
        }
        host.addEventListener('mouseenter', function () { replay(icon); });
        if (canObserveVisibility) watchVisibility(icon);

        if (status === 'failed') {
            showFallback(icon);
            return icon;
        }
        icon.fallbackTimer = setTimeout(function () { showFallback(icon); }, FALLBACK_DELAY);
        if (status === 'ready') start(icon);
        else {
            waiting.push(icon);
            requestResources();
        }
        return icon;
    }

    function mountDeclared() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-cart-lottie]'), function (host) {
            mount(host, { replayOnShow: host.getAttribute('data-cart-lottie') === 'show' });
        });
    }

    function mountHeaderCart() {
        if (!wantsHeaderCart || !root.classList.contains('pc-header-ready')) return false;
        var hosts = document.querySelectorAll(HEADER_CART);
        Array.prototype.forEach.call(hosts, function (host) {
            mount(host, { badge: host.querySelector('.header-top-basket-badge') });
        });
        return hosts.length > 0;
    }

    function init() {
        mountDeclared();
        if (headerObserver) headerObserver.disconnect();
        if (wantsHeaderCart && !mountHeaderCart()) root.classList.remove('cart-lottie-header');
    }

    window.BrandedCartLottie = { mount: mount };

    if (wantsHeaderCart) {
        requestResources();
        // pc-header.js marks <html> once the shared header is injected; mount right then instead of waiting for DOMContentLoaded.
        if (!mountHeaderCart()) {
            headerObserver = new MutationObserver(function () {
                if (mountHeaderCart()) headerObserver.disconnect();
            });
            headerObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
        }
    }
    mountDeclared();

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
