/**
 * core.js
 * Purpose: Shared helpers/utilities and shared state keys.
 * Keep this dependency-light (Elementor-friendly).
 */

(function (window) {
  'use strict';

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

  // Listen for storage changes (cross-tab sync)
  window.addEventListener('storage', function(e) {
    if (e.key === 'quoteBasket') {
      window.brandedukv15.updateCartBadge();
    }
  });

})(window);
