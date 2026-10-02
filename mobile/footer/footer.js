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

﻿/* =============================================
   BrandedUK Footer – Production JS
   (Template injection + all init functions)
   ============================================= */
(function () {
  'use strict';

  var footerScriptUrl = (document.currentScript && document.currentScript.src) ||
    new URL('/mobile/footer/footer.js', window.location.origin).href;

  /* --- Template Injection --- */
  function injectFooter() {
    var mount = document.querySelector('[data-mobile-footer]');
    if (!mount) {
      // No mount point — footer HTML is already inline
      initAll();
      return;
    }

    var url;
    try {
      url = new URL('/mobile/footer/footer.tpl', window.location.origin);
      url.searchParams.set('_t', Date.now());
    } catch (e) {
      return;
    }

    fetch(url.toString(), { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load footer');
        return res.text();
      })
      .then(function (html) {
        mount.outerHTML = html;
        initAll();
        if (typeof window.onMobileFooterInjected === 'function') {
          window.onMobileFooterInjected();
        }
      })
      .catch(function () {
        // Fail silently
      });
  }

  /* --- Init All --- */
  function initAll() {
    // Current year
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    initIsoSocial();
    initFooterPopups();
    initLondonClock();
    initQuoteButton();
    initBarMenu();
    initBottomNavigation();
  }

  /* --- Shared Mobile Bottom Navigation --- */
  function initBottomNavigation() {
    var nav = document.querySelector('.bottom-nav');
    if (!nav || nav.querySelector('[data-home-nav]')) return;

    var home = document.createElement('a');
    home.href = '/index-mobile.html?force=mobile';
    home.className = 'nav-item';
    home.setAttribute('data-home-nav', '');
    home.setAttribute('aria-label', 'Home');
    home.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 3l9 8"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path></svg><span class="nav-item-label">Home</span>';
    nav.insertBefore(home, nav.firstChild);
  }

  /* --- 1. Isometric 3D Social Icons (touch) --- */
  function initIsoSocial() {
    if (window.__isoSocialInit) return;
    var isoLinks = document.querySelectorAll('.social.footer-social-3d li a');
    if (!isoLinks.length) return;
    window.__isoSocialInit = true;

    isoLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        isoLinks.forEach(function (l) { l.classList.remove('iso-active'); });
        link.classList.add('iso-active');
      });
    });

    document.addEventListener('click', function (e) {
      var container = document.querySelector('.social.footer-social-3d');
      if (container && !container.contains(e.target)) {
        isoLinks.forEach(function (l) { l.classList.remove('iso-active'); });
      }
    });
  }

  /* --- 2. Footer Popups --- */
  function initFooterPopups() {
    document.querySelectorAll('[data-popup]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var id = 'popup-' + this.getAttribute('data-popup');
        var overlay = document.getElementById(id);
        if (overlay) overlay.classList.add('active');
      });
    });

    document.querySelectorAll('.footer-popup-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('active');
      });
      var btn = overlay.querySelector('.footer-popup-close');
      if (btn) {
        btn.addEventListener('click', function () {
          overlay.classList.remove('active');
        });
      }
    });
  }

  /* --- 3. London Clock (CSS + JS) --- */
  function initLondonClock() {
    var clock = document.querySelector('.clock');
    if (!clock) return;

    var secondHand = document.getElementById('second-hand');
    var minuteHand = document.getElementById('minute-hand');
    var hourHand   = document.getElementById('hour-hand');
    var ticksWrap  = clock.querySelector('.ticks');

    /* Generate 60 tick marks */
    if (ticksWrap) {
      var size = clock.offsetWidth;
      for (var i = 1; i <= 60; i++) {
        var span = document.createElement('span');
        var deg = (i / 60) * 360;
        var isHour = (i % 5 === 0);
        var tickW = isHour ? 5 : 3;
        var dist = size / 2 - tickW;
        span.style.transform = 'rotate(' + deg + 'deg) translateX(' + dist + 'px)';
        if (isHour) span.className = 'hour-mark';
        ticksWrap.appendChild(span);
      }
    }

    /* Get London time */
    function getLondonTime() {
      var now = new Date();
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }).formatToParts(now);
      function getPart(type) {
        return Number(parts.find(function (p) { return p.type === type; }).value);
      }
      return { hours: getPart('hour'), minutes: getPart('minute'), seconds: getPart('second') };
    }

    /* Rotate hands every second */
    function tick() {
      var t = getLondonTime();
      var sDeg = (t.seconds / 60) * 360 - 180;
      var mDeg = ((t.minutes + t.seconds / 60) / 60) * 360 - 180;
      var hDeg = (((t.hours % 12) + t.minutes / 60 + t.seconds / 3600) / 12) * 360 - 180;

      secondHand.style.transform = 'rotate(' + sDeg + 'deg)';
      minuteHand.style.transform = 'rotate(' + mDeg + 'deg)';
      hourHand.style.transform   = 'rotate(' + hDeg + 'deg)';
    }

    tick();
    setInterval(tick, 1000);
  }

  /* --- 4. Quote Button: opens the Get in touch popup --- */
  function initQuoteButton() {
    document.querySelectorAll('footer .quote-btn').forEach(function (btn) {
      btn.setAttribute('data-open-contact', '1');
    });
    ensureContactPopupScript();
  }

  function ensureContactPopupScript() {
    if (typeof window.openContactPopup === 'function') return;
    var loaded = Array.prototype.some.call(document.querySelectorAll('script[src]'), function (script) {
      return /\/popup-contact\.js(?:\?|$)/.test(script.src);
    });
    if (loaded) return;
    var script = document.createElement('script');
    script.src = new URL('../js/popup-contact.js?v=20260927-quoteonly', footerScriptUrl).href;
    document.body.appendChild(script);
  }

  /* --- 5. Hamburger / Purple Sidebar --- */
  function initBarMenu() {
    var menu    = document.getElementById('barMenu');
    var trigger = document.getElementById('barMenuTrigger');
    var panel   = document.getElementById('barMenuPanel');
    var closeBtn = document.getElementById('barMenuClose');
    if (!menu || !trigger || !panel) return;

    var menuLinks = panel.querySelectorAll('a');

    function openMenu() {
      menu.classList.add('is-active');
      panel.classList.add('is-active');
      trigger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      menu.classList.remove('is-active');
      panel.classList.remove('is-active');
      trigger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.contains('is-active') ? closeMenu() : openMenu();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
      });
    }

    menuLinks.forEach(function (link) {
      if (!link.hasAttribute('data-popup') && !link.closest('.footer-social-3d')) {
        link.addEventListener('click', closeMenu);
      }
    });

    document.addEventListener('click', function (e) {
      if (!panel.classList.contains('is-active')) return;
      if (!panel.contains(e.target) && !trigger.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* --- Boot --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }
})();

/* Crisp backend + BrandedUK onsite chat panel (whatsapp.js UI only; Crisp UI hidden) */
(function loadBrandedCrisp() {
  if (window.__brandedCrispLoaded) return;
  if (document.querySelector('script[data-branded-crisp="1"]')) return;
  var s = document.createElement('script');
  s.src = new URL('/mobile/js/crisp-chat.js?v=20261002-ourpanel', window.location.origin).href;
  s.async = true;
  s.setAttribute('data-branded-crisp', '1');
  document.head.appendChild(s);
})();

(function loadBrandedOnsiteChat() {
  if (window.__bukOnsiteChatAssetsLoaded) return;
  window.__bukOnsiteChatAssetsLoaded = true;
  if (!document.querySelector('link[data-buk-whatsapp-css="1"], link[href*="whatsapp.css"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('/mobile/css/whatsapp.css?v=20261002-cta-equal', window.location.origin).href;
    link.setAttribute('data-buk-whatsapp-css', '1');
    document.head.appendChild(link);
  }
  if (document.querySelector('script[data-buk-whatsapp="1"], script[src*="whatsapp.js"]')) return;
  var s = document.createElement('script');
  s.src = new URL('/mobile/js/whatsapp.js?v=20261002-cta-equal', window.location.origin).href;
  s.defer = true;
  s.setAttribute('data-buk-whatsapp', '1');
  document.head.appendChild(s);
})();
