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
})(window);
