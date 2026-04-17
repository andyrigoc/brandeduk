/**
 * cart.js – Centralized persistent cart management for BrandedUK
 *
 * Provides a clean API via window.BrandedCart that wraps localStorage['quoteBasket'].
 * Handles persistence, corruption recovery, deduplication, cross-tab sync, and
 * dispatches 'basketUpdated' events so any UI can react.
 *
 * Usage:
 *   BrandedCart.get()                     → returns array of cart items
 *   BrandedCart.add(item)                 → adds/merges item, returns updated cart
 *   BrandedCart.remove(index)             → removes item at index
 *   BrandedCart.removeById(id)            → removes item by its .id field
 *   BrandedCart.update(index, props)      → patches item at index with props
 *   BrandedCart.updateQty(index, qty)     → sets qty for item at index
 *   BrandedCart.clear()                   → empties cart
 *   BrandedCart.count()                   → total quantity across all items
 *   BrandedCart.itemCount()               → number of line items
 *   BrandedCart.save(basket)              → overwrites cart (for migrations, bulk ops)
 *   BrandedCart.onChange(callback)         → registers a listener for cart changes
 */
(function (window) {
  'use strict';

  var STORAGE_KEY = 'quoteBasket';

  // ───── Internal helpers ─────

  /** Safely read cart from localStorage, returning [] on any error. */
  function _read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      // Corrupted data – wipe it and start fresh
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      return [];
    }
  }

  /** Persist basket to localStorage and notify listeners. */
  function _write(basket) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
    } catch (e) {
      // Storage full or blocked – best-effort
    }
    _notify();
  }

  /** Dispatch custom event so any page UI can react. */
  function _notify() {
    try {
      window.dispatchEvent(new CustomEvent('basketUpdated'));
    } catch (e) {
      // IE11 fallback
      try {
        var evt = document.createEvent('Event');
        evt.initEvent('basketUpdated', true, true);
        window.dispatchEvent(evt);
      } catch (_) {}
    }
  }

  /** Parse a numeric qty from various item shapes. */
  function _getQty(item) {
    if (!item) return 0;
    var raw = item.qty || item.quantity || item.totalQty || item.totalQuantity;
    var n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  /**
   * Build a dedup key for an item.
   * Items sharing the same product code + color + size are considered the same line.
   */
  function _itemKey(item) {
    var code = (item.code || item.productCode || '').toLowerCase();
    var color = (item.color || item.selectedColorName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    var size = (item.size || 'OS').toUpperCase();
    return code + '|' + color + '|' + size;
  }

  // ───── Public API ─────

  var BrandedCart = {};

  /** Returns the current basket array (always a safe copy). */
  BrandedCart.get = function () {
    return _read();
  };

  /**
   * Add an item to the cart.
   * If an item with the same code+color+size exists, qty is merged.
   * Returns the updated basket.
   */
  BrandedCart.add = function (item) {
    if (!item || typeof item !== 'object') return _read();

    var basket = _read();
    var key = _itemKey(item);
    var found = false;

    for (var i = 0; i < basket.length; i++) {
      if (_itemKey(basket[i]) === key) {
        basket[i].qty = _getQty(basket[i]) + _getQty(item);
        found = true;
        break;
      }
    }

    if (!found) {
      // Ensure item has an id
      if (!item.id) {
        item.id = _makeRowId(
          item.code || item.productCode,
          item.color,
          item.size
        );
      }
      basket.push(item);
    }

    _write(basket);
    return basket;
  };

  /** Remove item at a given index. Returns the updated basket. */
  BrandedCart.remove = function (index) {
    var basket = _read();
    index = parseInt(index, 10);
    if (index >= 0 && index < basket.length) {
      basket.splice(index, 1);
      _write(basket);
    }
    return basket;
  };

  /** Remove item by its .id field. Returns the updated basket. */
  BrandedCart.removeById = function (id) {
    if (!id) return _read();
    var basket = _read();
    var filtered = basket.filter(function (item) {
      return item.id !== id;
    });
    if (filtered.length !== basket.length) {
      _write(filtered);
    }
    return filtered;
  };

  /** Patch item at index with a partial object of properties. */
  BrandedCart.update = function (index, props) {
    var basket = _read();
    index = parseInt(index, 10);
    if (index >= 0 && index < basket.length && props && typeof props === 'object') {
      var keys = Object.keys(props);
      for (var i = 0; i < keys.length; i++) {
        basket[index][keys[i]] = props[keys[i]];
      }
      _write(basket);
    }
    return basket;
  };

  /** Set quantity for item at index. Removes item if qty <= 0. */
  BrandedCart.updateQty = function (index, qty) {
    var basket = _read();
    index = parseInt(index, 10);
    qty = parseInt(qty, 10);
    if (index >= 0 && index < basket.length) {
      if (!Number.isFinite(qty) || qty <= 0) {
        basket.splice(index, 1);
      } else {
        basket[index].qty = qty;
      }
      _write(basket);
    }
    return basket;
  };

  /** Empty the cart completely. */
  BrandedCart.clear = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    _notify();
  };

  /** Total quantity across all items. */
  BrandedCart.count = function () {
    var basket = _read();
    var total = 0;
    for (var i = 0; i < basket.length; i++) {
      total += _getQty(basket[i]);
    }
    return total;
  };

  /** Number of distinct line items. */
  BrandedCart.itemCount = function () {
    return _read().length;
  };

  /**
   * Overwrite the entire cart. Use for migrations or bulk operations.
   * Skips dedup – caller is responsible for clean data.
   */
  BrandedCart.save = function (basket) {
    if (!Array.isArray(basket)) return;
    _write(basket);
  };

  /**
   * Register a callback that fires whenever the cart changes
   * (from this tab, other tabs, or programmatic updates).
   * Returns an unsubscribe function.
   */
  BrandedCart.onChange = function (callback) {
    if (typeof callback !== 'function') return function () {};

    // Same-tab changes via custom event
    var onCustom = function () { callback(BrandedCart.get()); };
    window.addEventListener('basketUpdated', onCustom);

    // Cross-tab changes via storage event
    var onStorage = function (e) {
      if (e.key === STORAGE_KEY) {
        callback(BrandedCart.get());
      }
    };
    window.addEventListener('storage', onStorage);

    // Unsubscribe
    return function () {
      window.removeEventListener('basketUpdated', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  };

  // ───── Row ID helper (matches basket.html convention) ─────

  function _makeRowId(code, color, size) {
    var slug = (color || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return (code || 'ITEM') + '-' + slug + '-' + (size || 'OS');
  }

  // ───── Auto-recovery on load ─────
  // Validate stored data once. If it's corrupt, _read already handles it.
  // If it's valid but has stale entries (qty 0), clean them out.
  (function _autoClean() {
    var basket = _read();
    if (basket.length === 0) return;

    var cleaned = basket.filter(function (item) {
      return item && typeof item === 'object' && _getQty(item) > 0;
    });

    if (cleaned.length !== basket.length) {
      _write(cleaned);
    }
  })();

  // ───── Expose globally ─────
  window.BrandedCart = BrandedCart;

})(window);
