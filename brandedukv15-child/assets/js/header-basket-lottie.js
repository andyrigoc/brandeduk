(function () {
    'use strict';

    var LOTTIE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js';
    var scriptSrc = document.currentScript.src;
    var ANIMATION_URL = new URL('../images/ui/cart-icon-loader.json', scriptSrc).href;
    var VIDEO_URL = new URL('../images/ui/header-basket-anim-orange.webm', scriptSrc).href;
    // The cart occupies a small area of the 600x600 composition; crop the viewBox to it.
    var VIEW_BOX = '180 192 216 216';
    // Frame where the orange cart is fully drawn; the icon rests here between plays.
    var REST_FRAME = 46;
    var LAST_FRAME = 120;
    var VIDEO_REST_TIME = 1.6;
    var FALLBACK_DELAY = 4000;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var lottieIcons = [];
    var videoIcons = [];
    var animations = [];
    var videos = [];

    function parseCount(text) {
        var value = parseInt(String(text || '').replace(/\D/g, ''), 10);
        return Number.isFinite(value) ? value : 0;
    }

    function wrapIcon(link, modifier) {
        var existing = link.querySelector('.header-basket-icon');
        if (existing) return existing;
        var wrapper = document.createElement('span');
        wrapper.className = 'header-basket-icon header-basket-icon--' + modifier;
        var svg = link.querySelector('svg');
        link.insertBefore(wrapper, link.firstChild);
        if (svg) wrapper.appendChild(svg);
        setTimeout(function () { showFallback(wrapper); }, FALLBACK_DELAY);
        return wrapper;
    }

    function showFallback(icon) {
        if (!icon.classList.contains('is-anim-ready')) icon.classList.add('is-anim-fallback');
    }

    function buildLottieIcon(link) {
        var wrapper = wrapIcon(link, 'lottie');
        var player = document.createElement('span');
        player.className = 'header-basket-lottie';
        player.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(player);
        return wrapper;
    }

    function buildVideoIcon(link) {
        var wrapper = wrapIcon(link, 'video');
        var player = document.createElement('video');
        player.className = 'header-basket-video';
        player.setAttribute('aria-hidden', 'true');
        player.muted = true;
        player.defaultMuted = true;
        player.loop = !reduceMotion;
        player.autoplay = !reduceMotion;
        player.playsInline = true;
        player.setAttribute('playsinline', '');
        player.setAttribute('muted', '');
        player.tabIndex = -1;
        player.src = VIDEO_URL;
        wrapper.appendChild(player);
        return wrapper;
    }

    function replayLottie(animation) {
        if (!animation || reduceMotion || animation.isPaused === false) return;
        animation.playSegments([[REST_FRAME, LAST_FRAME], [0, REST_FRAME]], true);
    }

    function replayVideo(video) {
        if (!video || reduceMotion) return;
        var restart = function () {
            try {
                video.currentTime = 0;
                var play = video.play();
                if (play && play.catch) play.catch(function () {});
            } catch (e) {}
        };
        if (video.readyState >= 1) restart();
        else video.addEventListener('loadeddata', restart, { once: true });
    }

    function replayAll() {
        animations.forEach(replayLottie);
        videos.forEach(replayVideo);
    }

    function replayOnCountIncrease(source) {
        var previous = null;
        function sync() {
            var text = source.textContent.trim();
            if (previous !== null && parseCount(text) > parseCount(previous)) replayAll();
            previous = text;
        }
        sync();
        new MutationObserver(sync).observe(source, {
            childList: true,
            characterData: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'data-count']
        });
    }

    function startLottie(icon) {
        var animation = window.lottie.loadAnimation({
            container: icon.querySelector('.header-basket-lottie'),
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: ANIMATION_URL,
            rendererSettings: { viewBoxSize: VIEW_BOX, preserveAspectRatio: 'xMidYMid meet' }
        });
        animations.push(animation);
        animation.addEventListener('DOMLoaded', function () {
            icon.classList.add('is-anim-ready');
            if (reduceMotion) {
                animation.goToAndStop(REST_FRAME, true);
            } else {
                animation.playSegments([0, REST_FRAME], true);
            }
        });
        animation.addEventListener('data_failed', function () {
            icon.classList.remove('is-anim-ready');
            showFallback(icon);
        });
        icon.closest('a').addEventListener('mouseenter', function () { replayLottie(animation); });
    }

    function loadLottie() {
        if (!lottieIcons.length) return;
        if (window.lottie) {
            lottieIcons.forEach(startLottie);
            return;
        }
        var script = document.createElement('script');
        script.src = LOTTIE_SRC;
        script.async = true;
        script.onload = function () { if (window.lottie) lottieIcons.forEach(startLottie); };
        script.onerror = function () { lottieIcons.forEach(showFallback); };
        document.head.appendChild(script);
    }

    function startVideo(icon) {
        var video = icon.querySelector('video');
        if (!video) return;
        videos.push(video);
        var ready = function () {
            icon.classList.add('is-anim-ready');
            if (reduceMotion) {
                try { video.currentTime = VIDEO_REST_TIME; } catch (e) {}
                video.pause();
            } else {
                var play = video.play();
                if (play && play.catch) play.catch(function () {});
            }
        };
        if (video.readyState >= 2) ready();
        else video.addEventListener('loadeddata', ready, { once: true });
        video.addEventListener('error', function () {
            icon.classList.remove('is-anim-ready');
            showFallback(icon);
        });
        var link = icon.closest('a');
        if (link) link.addEventListener('mouseenter', function () { replayVideo(video); });
    }

    function init() {
        if (lottieIcons.length || videoIcons.length) return;
        var links = Array.prototype.slice.call(document.querySelectorAll('.site-header a.header-top-basket-link'));
        if (!links.length) return;
        // The Basket link next to Account plays the recorded laptop loop without a count; the small top-bar cart keeps the Lottie cart.
        links.forEach(function (link) {
            if (link.classList.contains('header-util-link')) videoIcons.push(buildVideoIcon(link));
            else lottieIcons.push(buildLottieIcon(link));
        });

        var headerBadge = document.getElementById('headerBasketBadge');
        if (headerBadge) replayOnCountIncrease(headerBadge);

        videoIcons.forEach(startVideo);
        loadLottie();
    }

    // The script sits after the header markup, so mount right away rather than waiting for DOMContentLoaded.
    init();
    if (!lottieIcons.length && !videoIcons.length) document.addEventListener('DOMContentLoaded', init);
})();
