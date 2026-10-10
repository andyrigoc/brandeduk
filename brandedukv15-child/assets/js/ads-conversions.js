/**
 * Branded UK - Google Ads conversions helper (tag AW-438771987).
 *
 * window.brandedAdsConversion(name, params) sends:
 *   1. gtag('event', name, params)  - recommended event (generate_lead, add_to_cart,
 *      begin_checkout), always.
 *   2. gtag('event', 'conversion', { send_to: 'AW-438771987/<label>', ... }) - only when
 *      a label for that name is filled in CONVERSION_LABELS below.
 *   It refuses 'purchase': a Purchase can only be sent by window.brandedAdsPurchase().
 *
 * Wired automatically:
 *   - generate_lead : successful POST to /api/contact or /api/quotes (contact popup,
 *                     basket / checkout quote request, design tool quote), except the
 *                     quote that is created as the first step of a card payment.
 *   - add_to_cart   : the basket (localStorage quoteBasket) gains lines.
 *   - begin_checkout: checkout pages call it on load.
 *
 * window.brandedAdsPurchase(verified) is called only by payment-success.html with
 * the response of /api/orders/verify-payment. It sends the Purchase conversion
 * once per transaction, and only when the server answered conversionEligible
 * (Stripe confirmed the payment, GBP, total >= 150).
 *
 * Enhanced conversions: email / phone from the submitted form are passed with
 * gtag('set', 'user_data', ...) only when the visitor accepted Advertising cookies
 * (ad_user_data granted). Google hashes them before sending.
 */
(function () {
  'use strict';

  var AW_ID = 'AW-438771987';

  // Paste the conversion labels from Google Ads here (Goals > Conversions >
  // the conversion action > Tag setup > "Use Google tag" > the part after
  // "AW-438771987/" in send_to). Leave '' to send only the recommended event.
  var CONVERSION_LABELS = {
    generate_lead: '',
    add_to_cart: '',
    begin_checkout: '',
    // MISSING LABEL: searched ads-conversions.js, payment-success, checkout and
    // comments. No real Google Ads Purchase send_to label exists in this repo.
    // Paste the label from Google Ads (Goals > Conversions > the Purchase action
    // > Tag setup > the part after "AW-438771987/"). Do not invent one.
    // Until this is filled, payment-success sends gtag('event','purchase') only,
    // not gtag('event','conversion',{send_to:...}).
    purchase: 'PzEFCL7kkpgdEJPCnNEB'
  };

  var CURRENCY = 'GBP';
  var PURCHASE_MIN_GBP = 150;
  var PENDING_USER_KEY = 'bukAdsUserData';
  var SENT_TX_KEY = 'bukAdsSentTransactions';

  function debug() {
    if (window.BUK_ADS_DEBUG || /[?&]ads_debug=1\b/.test(window.location.search)) {
      try { console.info.apply(console, ['[BrandedAds]'].concat([].slice.call(arguments))); } catch (e) {}
    }
  }

  function topHelper() {
    if (window.self === window.top) return null;
    try {
      var fn = window.top.__bukAdsFire;
      return typeof fn === 'function' ? fn : null;
    } catch (e) {
      return null;
    }
  }

  function adUserDataGranted() {
    try {
      var c = window.BrandedCookieConsent && window.BrandedCookieConsent.get
        ? window.BrandedCookieConsent.get()
        : JSON.parse(window.localStorage.getItem('brandedukCookieConsent') || 'null');
      return !!(c && c.advertising && (!c.timestamp || Date.now() - c.timestamp < 365 * 864e5));
    } catch (e) {
      return false;
    }
  }

  function normalisePhone(raw) {
    var digits = String(raw || '').replace(/[^\d+]/g, '');
    if (!digits) return '';
    if (digits.indexOf('+') === 0) return /^\+\d{8,15}$/.test(digits) ? digits : '';
    if (digits.indexOf('00') === 0) return normalisePhone('+' + digits.slice(2));
    if (digits.indexOf('44') === 0 && digits.length >= 12) return '+' + digits;
    if (digits.indexOf('0') === 0 && digits.length === 11) return '+44' + digits.slice(1);
    return '';
  }

  function cleanUserData(data) {
    if (!data) return null;
    var out = {};
    var email = String(data.email || '').trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) out.email = email;
    var phone = normalisePhone(data.phone_number || data.phone);
    if (phone) out.phone_number = phone;
    return out.email || out.phone_number ? out : null;
  }

  function applyUserData(data) {
    var clean = cleanUserData(data);
    if (!clean || !adUserDataGranted() || typeof window.gtag !== 'function') return;
    window.gtag('set', 'user_data', clean);
    debug('user_data set', Object.keys(clean));
  }

  function fire(name, params) {
    params = params || {};
    if (name === 'purchase') return;
    var top = topHelper();
    if (top) {
      top(name, params);
      return;
    }
    if (typeof window.gtag !== 'function') return;

    var eventParams = {};
    Object.keys(params).forEach(function (key) {
      if (key !== 'user_data') eventParams[key] = params[key];
    });
    if (params.user_data) applyUserData(params.user_data);

    window.gtag('event', name, eventParams);
    debug('event', name, eventParams);

    var label = CONVERSION_LABELS[name];
    if (label) {
      var conversion = { send_to: AW_ID + '/' + label };
      if (typeof eventParams.value === 'number' && isFinite(eventParams.value)) {
        conversion.value = eventParams.value;
        conversion.currency = eventParams.currency || CURRENCY;
      }
      if (eventParams.transaction_id) conversion.transaction_id = String(eventParams.transaction_id);
      window.gtag('event', 'conversion', conversion);
      debug('conversion', name, conversion);
    }
  }

  function readJson(storage, key) {
    try { return JSON.parse(storage.getItem(key) || 'null'); } catch (e) { return null; }
  }

  function basketItems(raw) {
    try {
      var list = JSON.parse(raw || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function toNumber(v) {
    var n = parseFloat(v);
    return isFinite(n) ? n : NaN;
  }

  function mapItem(item) {
    var out = {
      item_id: String(item.code || item.productCode || item.sku || item.id || ''),
      item_name: String(item.productName || item.name || item.title || ''),
      quantity: Math.max(1, Math.round(toNumber(item.quantity || item.qty || item.totalQuantity) || 1))
    };
    var price = toNumber(item.unitPrice || item.price);
    if (isFinite(price) && price > 0) out.price = Math.round(price * 100) / 100;
    return out;
  }

  function basketValue(list, useSiteTotals) {
    if (useSiteTotals && typeof window.calculateBasketTotals === 'function') {
      try {
        var totals = window.calculateBasketTotals(list);
        var inc = toNumber(totals && (totals.totalIncVat || totals.displayTotal || totals.total));
        if (isFinite(inc) && inc > 0) return Math.round(inc * 100) / 100;
      } catch (e) {}
    }
    var sum = list.reduce(function (acc, item) {
      var line = toNumber(item.itemTotal);
      if (!isFinite(line)) line = (toNumber(item.unitPrice || item.price) || 0) * (toNumber(item.quantity) || 0);
      return acc + (isFinite(line) ? line : 0);
    }, 0);
    return sum > 0 ? Math.round(sum * 100) / 100 : NaN;
  }

  window.__bukAdsFire = fire;

  window.brandedAdsConversion = function (name, params) {
    params = params || {};
    try {
      if (name === 'begin_checkout') {
        var list = basketItems(window.localStorage.getItem('quoteBasket'));
        if (!list.length) return;
        if (!params.items) params.items = list.map(mapItem);
        if (params.value == null) {
          var value = basketValue(list, true);
          if (isFinite(value)) { params.value = value; params.currency = CURRENCY; }
        }
      } else if (name === 'purchase') {
        debug('refused: purchase only via brandedAdsPurchase()');
        return;
      }
    } catch (e) {}
    fire(name, params);
  };

  function alreadySent(txId) {
    var sent = readJson(window.localStorage, SENT_TX_KEY) || [];
    var sessionFlag = false;
    try { sessionFlag = window.sessionStorage.getItem(SENT_TX_KEY + ':' + txId) === '1'; } catch (e) {}
    return sessionFlag || sent.indexOf(txId) !== -1;
  }

  function markSent(txId) {
    var sent = readJson(window.localStorage, SENT_TX_KEY) || [];
    sent.push(txId);
    try { window.localStorage.setItem(SENT_TX_KEY, JSON.stringify(sent.slice(-20))); } catch (e) {}
    try { window.sessionStorage.setItem(SENT_TX_KEY + ':' + txId, '1'); } catch (e) {}
  }

  // verified = JSON from /api/orders/verify-payment. Returns true when sent.
  window.brandedAdsPurchase = function (verified) {
    try {
      if (window.self !== window.top) return false;
      if (!verified || verified.verified !== true || verified.paid !== true || verified.conversionEligible !== true) {
        debug('purchase not sent: not eligible', verified);
        return false;
      }
      var value = toNumber(verified.total);
      var txId = String(verified.transactionId || verified.orderNumber || '').trim();
      if (!isFinite(value) || value < PURCHASE_MIN_GBP || String(verified.currency).toUpperCase() !== CURRENCY || !txId) {
        debug('purchase not sent: invalid server data', verified);
        return false;
      }
      if (alreadySent(txId)) {
        debug('purchase already sent for', txId);
        return false;
      }
      if (typeof window.gtag !== 'function') return false;
      markSent(txId);

      var user = readJson(window.sessionStorage, PENDING_USER_KEY);
      if (user) applyUserData(user);
      try { window.sessionStorage.removeItem(PENDING_USER_KEY); } catch (e) {}

      var params = { transaction_id: txId, value: value, currency: CURRENCY };
      window.gtag('event', 'purchase', params);
      debug('event', 'purchase', params);
      if (CONVERSION_LABELS.purchase) {
        var conversion = { send_to: AW_ID + '/' + CONVERSION_LABELS.purchase, value: value, currency: CURRENCY, transaction_id: txId };
        window.gtag('event', 'conversion', conversion);
        debug('conversion', 'purchase', conversion);
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  // ---- generate_lead: successful contact / quote submissions ----------------

  var CONTACT_RE = /\/api\/contact\/?(?:[?#]|$)/;
  var QUOTE_RE = /\/api\/quotes\/?(?:[?#]|$)/;

  function findContact(obj, depth) {
    var found = {};
    (function walk(node, d) {
      if (!node || typeof node !== 'object' || d > 4) return;
      Object.keys(node).forEach(function (key) {
        var val = node[key];
        if (typeof val === 'string') {
          if (!found.email && /^(email|customerEmail|emailAddress)$/i.test(key)) found.email = val;
          else if (!found.phone && /^(phone|telephone|phoneNumber|mobile|customerPhone)$/i.test(key)) found.phone = val;
        } else if (val && typeof val === 'object' && !(typeof Blob !== 'undefined' && val instanceof Blob)) {
          walk(val, d + 1);
        }
      });
    })(obj, depth || 0);
    return found;
  }

  function parseBody(body) {
    if (!body) return null;
    if (typeof body === 'string') {
      try { return JSON.parse(body); } catch (e) { return null; }
    }
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      var out = {};
      body.forEach(function (value, key) {
        if (typeof value !== 'string') return;
        if (/^[\[{]/.test(value)) {
          try { out[key] = JSON.parse(value); return; } catch (e) {}
        }
        out[key] = value;
      });
      return out;
    }
    return null;
  }

  function isCheckoutPage() {
    return /checkout/i.test(window.location.pathname);
  }

  function checkoutIsQuoteMode() {
    try { return window.sessionStorage.getItem('checkoutMode') === 'quote'; } catch (e) { return false; }
  }

  function onSubmitted(kind, data) {
    if (data && data.quoteData && typeof data.quoteData === 'object') data = data.quoteData;
    var contact = findContact(data);
    if (kind === 'quote' && isCheckoutPage() && !checkoutIsQuoteMode()) {
      // Card payment flow: not a lead. Keep the customer's email/phone (only with
      // ad_user_data consent) for enhanced conversions on the verified Purchase.
      try {
        var clean = cleanUserData(contact);
        if (clean && adUserDataGranted()) window.sessionStorage.setItem(PENDING_USER_KEY, JSON.stringify(clean));
      } catch (e) {}
      return;
    }
    window.brandedAdsConversion('generate_lead', {
      lead_source: kind === 'contact' ? 'contact_form' : 'quote_request',
      currency: CURRENCY,
      user_data: contact
    });
  }

  if (typeof window.fetch === 'function' && !window.fetch.__bukAdsWrapped) {
    var originalFetch = window.fetch;
    var wrappedFetch = function (input, init) {
      var promise = originalFetch.apply(window, arguments);
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || String(input || '');
        var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
        var kind = method === 'POST' ? (CONTACT_RE.test(url) ? 'contact' : (QUOTE_RE.test(url) ? 'quote' : '')) : '';
        if (kind) {
          var data = parseBody(init && init.body);
          promise.then(function (response) {
            if (!response || !response.ok) return;
            // Some endpoints answer 200 with { success: false }; those are not leads.
            response.clone().json().then(function (json) {
              if (json && json.success === false) return;
              onSubmitted(kind, data, json);
            }, function () {
              onSubmitted(kind, data, null);
            });
          }, function () {});
        }
      } catch (e) {}
      return promise;
    };
    wrappedFetch.__bukAdsWrapped = true;
    window.fetch = wrappedFetch;
  }

  // ---- add_to_cart: basket gains lines --------------------------------------

  try {
    var storageProto = window.Storage && window.Storage.prototype;
    if (storageProto && !storageProto.setItem.__bukAdsWrapped) {
      var originalSetItem = storageProto.setItem;
      var wrappedSetItem = function (key, value) {
        var before = null;
        var watch = this === window.localStorage && key === 'quoteBasket';
        if (watch) {
          try { before = basketItems(this.getItem('quoteBasket')); } catch (e) { watch = false; }
        }
        var result = originalSetItem.apply(this, arguments);
        if (watch) {
          try {
            var after = basketItems(value);
            if (after.length > before.length) {
              var added = after.slice(before.length);
              var addedValue = basketValue(added);
              var params = { items: added.map(mapItem) };
              if (isFinite(addedValue)) { params.value = addedValue; params.currency = CURRENCY; }
              window.setTimeout(function () { window.brandedAdsConversion('add_to_cart', params); }, 0);
            }
          } catch (e) {}
        }
        return result;
      };
      wrappedSetItem.__bukAdsWrapped = true;
      storageProto.setItem = wrappedSetItem;
    }
  } catch (e) {}

  // Calls made before this file loaded (inline stub in <head>).
  var queued = window.brandedAdsQueue || [];
  window.brandedAdsQueue = [];
  queued.forEach(function (args) {
    try { window.brandedAdsConversion.apply(window, args); } catch (e) {}
  });
})();
