/**
 * core.js
 * Purpose: Shared helpers/utilities and shared state keys.
 * Keep this dependency-light (Elementor-friendly).
 */

(function (window) {
  'use strict';

  var CORE_SCRIPT_SRC = (function () {
    try {
      return document.currentScript && document.currentScript.src ? String(document.currentScript.src) : '';
    } catch (e) {
      return '';
    }
  })();

  window.brandedukv15 = window.brandedukv15 || {};

  window.brandedukv15.storageKeys = {
    quoteBasket: 'quoteBasket',
    customizingProduct: 'customizingProduct',
    selectedPositions: 'selectedPositions',
    positionCustomizations: 'positionCustomizations'
  };

  window.brandedukv15.toNumber = function (val, fallback) {
    var n = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(n) ? n : (fallback || 0);
  };

  function getSummaryHref() {
    var pathname = String(window.location && window.location.pathname ? window.location.pathname : '').replace(/\\/g, '/');
    // Pages under these folders need to go one level up to reach quote-form.html
    if (/\/brandeduk\.com(-pc-OLD)?\//.test(pathname) || /\/mobile\//.test(pathname)) {
      return '../quote-form.html';
    }
    return 'quote-form.html';
  }

  function getBasketSafe() {
    try {
      return JSON.parse(localStorage.getItem(window.brandedukv15.storageKeys.quoteBasket)) || [];
    } catch (e) {
      return [];
    }
  }

  function getItemQty(item) {
    if (!item) return 0;
    
    // Handle quantities object (with sizes like {S: 1, M: 1})
    if (item.quantities && typeof item.quantities === 'object') {
      return Object.values(item.quantities).reduce(function(sum, q) {
        var num = parseInt(q, 10);
        return sum + (Number.isFinite(num) && num > 0 ? num : 0);
      }, 0);
    }
    
    // Fallback to single quantity
    var raw = item.quantity;
    var qty = parseInt(raw, 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    return qty;
  }

  function setBadgeCount(badge, totalItems) {
    if (!badge) return;

    var text = totalItems > 99 ? '99+' : String(totalItems);

    // Some pages hide the badge via [data-count="0"] selector.
    try {
      badge.setAttribute('data-count', String(totalItems));
    } catch (e) {}

    if (totalItems > 0) {
      badge.textContent = text;
      badge.style.display = 'flex';
    } else {
      // Ensure :empty or [data-count="0"] rules can hide it.
      badge.textContent = '';
      badge.style.display = 'none';
    }
  }

  function updateBasketLinks() {
    var href = getSummaryHref();
    var links = document.querySelectorAll('a.header-top-basket-link, a.header-basket-view-btn');
    if (!links || !links.length) return;

    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute('href', href);
    }
  }

  // Cart badge update function
  window.brandedukv15.updateCartBadge = function () {
    var basket = getBasketSafe();
    var totalItems = basket.reduce(function (sum, item) {
      return sum + getItemQty(item);
    }, 0);

    // Support multiple badge ids used across pages.
    setBadgeCount(document.getElementById('cartBadge'), totalItems);
    setBadgeCount(document.getElementById('headerBasketBadge'), totalItems);
    setBadgeCount(document.getElementById('basketCount'), totalItems);
  };

  // Update badge on page load
  document.addEventListener('DOMContentLoaded', function() {
    updateBasketLinks();
    window.brandedukv15.updateCartBadge();
  });

  // Desktop-friendly call modal: avoid system tel: app picker on desktop browsers.
  (function initDesktopTelModal() {
    var OVERLAY_ID = 'callModalOverlay';

    function isTouchLikeDevice() {
      try {
        if ((navigator.maxTouchPoints || 0) > 0) return true;
      } catch (e) {}
      return 'ontouchstart' in window;
    }

    function isLikelyMobileOrTabletUA() {
      try {
        if (navigator.userAgentData && navigator.userAgentData.mobile) return true;
      } catch (e) {}
      var ua = String(navigator.userAgent || '').toLowerCase();
      var isTouchMac = ua.indexOf('macintosh') !== -1 && (navigator.maxTouchPoints || 0) > 1;
      return /mobi|android|iphone|ipod|ipad/.test(ua) || /tablet|silk|kindle/.test(ua) || isTouchMac;
    }

    function shouldIntercept() {
      // Never intercept on touch devices (tablet included).
      if (isTouchLikeDevice() || isLikelyMobileOrTabletUA()) return false;

      // Prefer capability detection: only desktop-like pointers.
      try {
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return false;
        if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return false;
      } catch (e) {}

      return (window.innerWidth || 0) >= 1024;
    }

    function ensureCssLoaded() {
      try {
        if (document.querySelector('link[href*="call-modal.css"]')) return;
        if (!CORE_SCRIPT_SRC) return;

        var scriptUrl = new URL(CORE_SCRIPT_SRC, window.location.href);
        var cssUrl = new URL('../css/components/call-modal.css', scriptUrl);

        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl.href;
        document.head.appendChild(link);
      } catch (e) {}
    }

    function getDigitsFromTel(href) {
      var raw = String(href || '').replace(/^tel:/i, '');
      var digits = raw.replace(/[^0-9+]/g, '');
      return digits || null;
    }

    function displayFromDigits(digits) {
      if (!digits) return '020 8974 2722';
      if (digits === '02089742722' || digits === '+442089742722') return '020 8974 2722';
      return digits;
    }

    function ensureModal() {
      var overlay = document.getElementById(OVERLAY_ID);
      if (overlay) return overlay;

      overlay = document.createElement('div');
      overlay.id = OVERLAY_ID;
      overlay.className = 'call-modal-overlay';
      overlay.innerHTML =
        '<div class="call-modal" role="dialog" aria-modal="true" aria-labelledby="callModalTitle">' +
        '  <div class="call-modal__header">' +
        '    <div>' +
        '      <h2 class="call-modal__title" id="callModalTitle">Call our team</h2>' +
        '      <p class="call-modal__subtitle">On desktop, your browser may show a system app picker. Use copy instead.</p>' +
        '    </div>' +
        '    <button class="call-modal__close" type="button" aria-label="Close">' +
        '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '        <line x1="18" y1="6" x2="6" y2="18"></line>' +
        '        <line x1="6" y1="6" x2="18" y2="18"></line>' +
        '      </svg>' +
        '    </button>' +
        '  </div>' +
        '  <div class="call-modal__body">' +
        '    <div class="call-modal__number">' +
        '      <div class="call-modal__number-text" id="callModalNumber"></div>' +
        '      <button class="call-modal__btn call-modal__btn--secondary" type="button" id="callModalCopyBtn">Copy</button>' +
        '    </div>' +
        '    <p class="call-modal__hint">Call us from your phone using the number above.</p>' +
        '    <div class="call-modal__actions">' +
        '      <button class="call-modal__btn call-modal__btn--secondary" type="button" id="callModalCloseBtn">Close</button>' +
        '    </div>' +
        '    <div class="call-modal__toast" id="callModalToast">Copied</div>' +
        '  </div>' +
        '</div>';

      document.body.appendChild(overlay);

      function close() {
        overlay.classList.remove('is-open');
      }

      function open(numberDisplay) {
        var numberEl = overlay.querySelector('#callModalNumber');
        if (numberEl) numberEl.textContent = numberDisplay;
        overlay.classList.add('is-open');
        var closeBtn = overlay.querySelector('.call-modal__close');
        if (closeBtn) closeBtn.focus();
      }

      function showToast(text) {
        var toast = overlay.querySelector('#callModalToast');
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add('is-visible');
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(function () {
          toast.classList.remove('is-visible');
        }, 1400);
      }

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
      });

      var closeX = overlay.querySelector('.call-modal__close');
      if (closeX) closeX.addEventListener('click', close);

      var closeBtn = overlay.querySelector('#callModalCloseBtn');
      if (closeBtn) closeBtn.addEventListener('click', close);

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
      });

      var copyBtn = overlay.querySelector('#callModalCopyBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', function () {
          var value = (overlay.querySelector('#callModalNumber') && overlay.querySelector('#callModalNumber').textContent) || '';
          value = String(value).trim();
          if (!value) return;

          function done(ok) {
            showToast(ok ? 'Copied' : 'Copy failed');
          }

          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(value).then(function () { done(true); }, function () { done(false); });
              return;
            }
          } catch (e) {}

          try {
            var ta = document.createElement('textarea');
            ta.value = value;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            var ok = document.execCommand('copy');
            ta.remove();
            done(!!ok);
          } catch (e) {
            done(false);
          }
        });
      }

      overlay._callModal = { open: open, close: close };
      return overlay;
    }

    function onTelClick(e) {
      var t = e && e.target;
      if (!t || !t.closest) return;
      var a = t.closest('a[href^="tel:"]');
      if (!a) return;
      if (!shouldIntercept()) return;

      e.preventDefault();
      ensureCssLoaded();

      var digits = getDigitsFromTel(a.getAttribute('href'));
      var display = displayFromDigits(digits);
      var overlay = ensureModal();
      overlay._callModal.open(display);
    }

    document.addEventListener('click', onTelClick, true);
  })();

  // Listen for storage changes (cross-tab sync)
  window.addEventListener('storage', function(e) {
    if (e.key === 'quoteBasket') {
      window.brandedukv15.updateCartBadge();
    }
  });

})(window);
