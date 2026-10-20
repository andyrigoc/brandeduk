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

/* =============================================
   BrandedUK Footer - Production JS
   (Template injection + all init functions)
   ============================================= */
(function () {
  'use strict';

  var footerScriptUrl = (document.currentScript && document.currentScript.src) ||
    new URL('/mobile/footer/footer.js?v=20261020-noclose', window.location.origin).href;

  /* --- Template Injection --- */
  function injectFooter() {
    var mount = document.querySelector('[data-mobile-footer]');
    if (!mount) {
      // No mount point - footer HTML is already inline
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

    initFooterAccordion();
    initWatermarkLink();
    ensureContactPopupScript();
    initBottomNavigation();
  }

  /* --- Footer accordion: one group open at a time --- */
  function initFooterAccordion() {
    document.querySelectorAll('.mfooter__nav').forEach(function (nav) {
      if (nav.__mfooterAccordion) return;
      nav.__mfooterAccordion = true;
      var groups = nav.querySelectorAll('details.mfooter__group');
      nav.addEventListener('toggle', function (event) {
        var opened = event.target;
        if (!opened.open || !opened.classList || !opened.classList.contains('mfooter__group')) return;
        groups.forEach(function (group) {
          if (group !== opened && group.open) group.open = false;
        });
      }, true);
    });
  }

  /* --- Wordmark: scroll up instead of reloading when already on the home page --- */
  function initWatermarkLink() {
    document.querySelectorAll('.mfooter__watermark').forEach(function (link) {
      if (link.__mfooterHome) return;
      link.__mfooterHome = true;
      link.addEventListener('click', function (event) {
        var path = window.location.pathname.replace(/\.html$/, '');
        if (!/\/index-mobile$/.test(path)) return;
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
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

  /* --- "Request a Quote" uses the shared Get in touch popup --- */
  function ensureContactPopupScript() {
    if (typeof window.openContactPopup === 'function') return;
    var loaded = Array.prototype.some.call(document.querySelectorAll('script[src]'), function (script) {
      return /\/popup-contact\.js(?:\?|$)/.test(script.src);
    });
    if (loaded) return;
    var script = document.createElement('script');
    script.src = new URL('../js/popup-contact.js?v=20261003-consent', footerScriptUrl).href;
    document.body.appendChild(script);
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
  s.src = new URL('/mobile/js/crisp-chat.js?v=20261005-mobilefix', window.location.origin).href;
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
    link.href = new URL('/mobile/css/whatsapp.css?v=20261020-noclose', window.location.origin).href;
    link.setAttribute('data-buk-whatsapp-css', '1');
    document.head.appendChild(link);
  }
  if (document.querySelector('script[data-buk-whatsapp="1"], script[src*="whatsapp.js"]')) return;
  var s = document.createElement('script');
  s.src = new URL('/mobile/js/whatsapp.js?v=20261005-mobilefix', window.location.origin).href;
  s.defer = true;
  s.setAttribute('data-buk-whatsapp', '1');
  document.head.appendChild(s);
})();
