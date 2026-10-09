/**
 * Branded UK - cookie consent banner + Google Consent Mode v2 (UK GDPR / PECR).
 *
 * The consent defaults (all advertising/analytics storage denied) and the
 * synchronous restore of a saved choice live inline in every page <head>,
 * before the Google tag. This file only renders the banner, the settings
 * dialog and the floating cookie button, and sends gtag('consent','update').
 *
 * Storage key brandedukCookieConsent = { version, timestamp, analytics, advertising }.
 * Bump CONSENT_VERSION to ask everybody again (for example after adding a new
 * cookie category). Choices expire after 12 months.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'brandedukCookieConsent';
  var CONSENT_VERSION = 1;
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
  var POLICY_URL = '/privacy-policy.html#cookies';
  var scriptRef = document.currentScript;

  function gtagSafe() {
    if (typeof window.gtag === 'function') window.gtag.apply(window, arguments);
  }

  function readConsent() {
    try {
      var c = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (!c || typeof c !== 'object') return null;
      if (c.version !== CONSENT_VERSION) return { stale: true, previous: c };
      if (!c.timestamp || Date.now() - c.timestamp > MAX_AGE_MS) return { stale: true, previous: c };
      return c;
    } catch (e) {
      return null;
    }
  }

  function consentState(choice) {
    var ads = choice && choice.advertising ? 'granted' : 'denied';
    return {
      ad_storage: ads,
      ad_user_data: ads,
      ad_personalization: ads,
      analytics_storage: choice && choice.analytics ? 'granted' : 'denied'
    };
  }

  function deleteGoogleCookies() {
    var names = document.cookie.split(';').map(function (part) {
      return part.split('=')[0].trim();
    }).filter(function (name) {
      return /^(_gcl_|_ga|_gid|_gat|FPGCLAW|FPAU)/.test(name);
    });
    if (!names.length) return;
    var host = window.location.hostname;
    var domains = ['', host];
    var parts = host.split('.');
    for (var i = 1; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));
    names.forEach(function (name) {
      domains.forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
      });
    });
  }

  var api = {
    get: function () {
      var c = readConsent();
      return c && !c.stale ? { analytics: !!c.analytics, advertising: !!c.advertising, timestamp: c.timestamp } : null;
    },
    hasAdUserDataConsent: function () {
      var c = api.get();
      return !!(c && c.advertising);
    },
    open: function () {},
    save: function () {}
  };
  window.BrandedCookieConsent = api;

  // Pages embedded in same-origin iframes (basket edit popup, design studio,
  // hidden preload) never show the banner or button; the top page owns them.
  if (window.self !== window.top) return;

  var current = readConsent();
  if (current && current.stale) {
    var prev = current.previous || {};
    if (prev.analytics || prev.advertising) gtagSafe('consent', 'update', consentState(null));
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    current = null;
  }

  function ensureStyles() {
    if (document.getElementById('buk-cc-styles')) return;
    var script = scriptRef || document.querySelector('script[src*="cookie-consent.js"]');
    var href = '/brandedukv15-child/assets/css/components/cookie-consent.css';
    var version = '';
    if (script && script.src) {
      var m = /[?&]v=([^&#]+)/.exec(script.src);
      if (m) version = m[1];
      try { href = new URL('../css/components/cookie-consent.css', script.src).pathname; } catch (e) {}
    }
    var link = document.createElement('link');
    link.id = 'buk-cc-styles';
    link.rel = 'stylesheet';
    link.href = href + (version ? '?v=' + version : '');
    (document.head || document.documentElement).appendChild(link);
  }

  var banner = null;
  var dialog = null;
  var floatBtn = null;
  var lastFocus = null;

  function save(choice) {
    var record = {
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      analytics: !!choice.analytics,
      advertising: !!choice.advertising
    };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch (e) {}
    gtagSafe('consent', 'update', consentState(record));
    if (!record.advertising && !record.analytics) deleteGoogleCookies();
    current = record;
    hideBanner();
    closeDialog();
    showFloatButton();
    try {
      window.dispatchEvent(new CustomEvent('brandeduk:consent', { detail: api.get() }));
    } catch (e) {}
  }
  api.save = save;

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (html != null) node.innerHTML = html;
    return node;
  }

  function buildBanner() {
    banner = el('div', {
      class: 'buk-cc-banner',
      role: 'region',
      'aria-label': 'Cookie consent',
      'aria-live': 'polite'
    },
      '<p class="buk-cc-banner__text">' +
        '<strong>Cookies on Branded UK.</strong> ' +
        'We use necessary storage to run the site (basket, login, checkout). ' +
        'With your permission we also use Google cookies to measure our ads and improve the site. ' +
        '<a href="' + POLICY_URL + '">Cookie policy</a>' +
      '</p>' +
      '<div class="buk-cc-banner__actions">' +
        '<button type="button" class="buk-cc-btn buk-cc-btn--choice" data-cc="reject">Reject all</button>' +
        '<button type="button" class="buk-cc-btn buk-cc-btn--choice" data-cc="accept">Accept all</button>' +
        '<button type="button" class="buk-cc-btn buk-cc-btn--link" data-cc="manage">Manage</button>' +
      '</div>');
    banner.addEventListener('click', onAction);
    document.body.appendChild(banner);
  }

  function hideBanner() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function buildDialog() {
    var backdrop = el('div', { class: 'buk-cc-backdrop', hidden: '' });
    backdrop.innerHTML =
      '<div class="buk-cc-dialog" role="dialog" aria-modal="true" aria-labelledby="bukCcTitle" aria-describedby="bukCcIntro" tabindex="-1">' +
        '<div class="buk-cc-dialog__head">' +
          '<h2 id="bukCcTitle" class="buk-cc-dialog__title">Cookie settings</h2>' +
          '<button type="button" class="buk-cc-dialog__close" data-cc="close" aria-label="Close cookie settings">&times;</button>' +
        '</div>' +
        '<p id="bukCcIntro" class="buk-cc-dialog__intro">Choose which optional cookies we may use. You can change this at any time from the cookie button or the footer. <a href="' + POLICY_URL + '">Read our cookie policy</a>.</p>' +
        '<div class="buk-cc-cat">' +
          '<div class="buk-cc-cat__row">' +
            '<span class="buk-cc-cat__name" id="bukCcNecLabel">Strictly necessary</span>' +
            '<span class="buk-cc-cat__always">Always on</span>' +
          '</div>' +
          '<p class="buk-cc-cat__desc">Keeps your basket, login, checkout and security working. Stored on your device only for these purposes, so it does not need consent.</p>' +
        '</div>' +
        '<div class="buk-cc-cat">' +
          '<label class="buk-cc-cat__row" for="bukCcAnalytics">' +
            '<span class="buk-cc-cat__name">Analytics</span>' +
            '<input type="checkbox" class="buk-cc-switch" id="bukCcAnalytics" role="switch">' +
          '</label>' +
          '<p class="buk-cc-cat__desc">Lets Google count visits and see how the site is used, so we can improve it.</p>' +
        '</div>' +
        '<div class="buk-cc-cat">' +
          '<label class="buk-cc-cat__row" for="bukCcAds">' +
            '<span class="buk-cc-cat__name">Advertising</span>' +
            '<input type="checkbox" class="buk-cc-switch" id="bukCcAds" role="switch">' +
          '</label>' +
          '<p class="buk-cc-cat__desc">Lets Google Ads measure which ads bring enquiries and orders, and show you relevant Branded UK ads on other sites.</p>' +
        '</div>' +
        '<div class="buk-cc-dialog__actions">' +
          '<button type="button" class="buk-cc-btn buk-cc-btn--choice" data-cc="reject">Reject all</button>' +
          '<button type="button" class="buk-cc-btn buk-cc-btn--choice" data-cc="accept">Accept all</button>' +
          '<button type="button" class="buk-cc-btn buk-cc-btn--outline" data-cc="save">Save choices</button>' +
        '</div>' +
      '</div>';
    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) closeDialog();
      else onAction(event);
    });
    backdrop.addEventListener('keydown', onDialogKey);
    document.body.appendChild(backdrop);
    dialog = backdrop;
  }

  function openDialog() {
    ensureStyles();
    if (!dialog) buildDialog();
    var saved = api.get();
    dialog.querySelector('#bukCcAnalytics').checked = !!(saved && saved.analytics);
    dialog.querySelector('#bukCcAds').checked = !!(saved && saved.advertising);
    lastFocus = document.activeElement;
    dialog.hidden = false;
    var box = dialog.querySelector('.buk-cc-dialog');
    window.setTimeout(function () { box.focus(); }, 0);
  }
  api.open = openDialog;

  function closeDialog() {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    if (lastFocus && typeof lastFocus.focus === 'function' && document.contains(lastFocus)) {
      lastFocus.focus();
    } else if (banner) {
      var first = banner.querySelector('button');
      if (first) first.focus();
    }
  }

  function onDialogKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusable = dialog.querySelectorAll('button, input, a[href]');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.querySelector('.buk-cc-dialog'))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onAction(event) {
    var target = event.target.closest ? event.target.closest('[data-cc]') : null;
    if (!target) return;
    var action = target.getAttribute('data-cc');
    if (action === 'accept') save({ analytics: true, advertising: true });
    else if (action === 'reject') save({ analytics: false, advertising: false });
    else if (action === 'manage') openDialog();
    else if (action === 'close') closeDialog();
    else if (action === 'save' && dialog) {
      save({
        analytics: dialog.querySelector('#bukCcAnalytics').checked,
        advertising: dialog.querySelector('#bukCcAds').checked
      });
    }
  }

  function showFloatButton() {
    if (floatBtn) return;
    floatBtn = el('button', {
      type: 'button',
      class: 'buk-cc-float',
      'aria-label': 'Cookie settings',
      title: 'Cookie settings'
    },
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5Zm-3.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-1 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm3-4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/>' +
      '</svg>');
    floatBtn.addEventListener('click', openDialog);
    document.body.appendChild(floatBtn);
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest ? event.target.closest('[data-cookie-settings], a[href$="#cookie-settings"]') : null;
    if (!trigger) return;
    event.preventDefault();
    openDialog();
  });

  function init() {
    ensureStyles();
    if (current) showFloatButton();
    else buildBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
