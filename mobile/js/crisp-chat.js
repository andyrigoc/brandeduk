/**
 * Branded UK — Crisp backend loader (single instance).
 * Crisp is inbox-only: operators still get messages in Crisp web/mobile.
 * NEVER show Crisp launcher or chatbox UI — BrandedUK panel (whatsapp.js) is the only chat UI.
 * Safe to include more than once: guarded against double-init.
 */
(function () {
  'use strict';

  window.$crisp = window.$crisp || [];
  window.CRISP_WEBSITE_ID = window.CRISP_WEBSITE_ID || '4462383f-dc8f-4e34-aa7b-8dc1b0385b70';

  function hideCrispUi() {
    try {
      // Hide Crisp's own launcher + chatbox UI permanently.
      // Keep hide:on:mobile false so the SDK/session still loads on phones.
      window.$crisp.push(['config', 'hide:chat:on']);
      window.$crisp.push(['config', 'hide:on:mobile', [false]]);
      window.$crisp.push(['do', 'chat:hide']);
      window.$crisp.push(['do', 'chat:close']);
    } catch (e) {}
  }

  function applyBrandTheme() {
    try {
      window.$crisp.push(['config', 'color:theme', ['orange']]);
    } catch (e) {}
  }

  function ensureOuterHideCss() {
    if (document.getElementById('buk-crisp-hide-ui-css')) return;
    var style = document.createElement('style');
    style.id = 'buk-crisp-hide-ui-css';
    // Hide ALL Crisp visitor UI (launcher + open chatbox). Backend/session still works.
    style.textContent =
      '#crisp-chatbox,' +
      '#crisp-chatbox-wrapper,' +
      '.crisp-client,' +
      'div[aria-label="Open chat"],' +
      'a[data-crisp-path="chat"]{' +
      'display:none!important;visibility:hidden!important;' +
      'pointer-events:none!important;opacity:0!important;' +
      'width:0!important;height:0!important;overflow:hidden!important;' +
      'max-width:0!important;max-height:0!important;' +
      'z-index:-1!important;' +
      '}';
    (document.head || document.documentElement).appendChild(style);
  }

  // Queue BEFORE Crisp script runs
  hideCrispUi();
  applyBrandTheme();
  ensureOuterHideCss();

  window.$crisp.push([
    'on',
    'session:loaded',
    function () {
      hideCrispUi();
      applyBrandTheme();
      ensureOuterHideCss();
    }
  ]);

  // If anything tries to open Crisp UI, force it closed/hidden again.
  if (!window.__bukCrispForceHideBound) {
    window.__bukCrispForceHideBound = true;
    window.$crisp.push([
      'on',
      'chat:opened',
      function () {
        hideCrispUi();
      }
    ]);
    window.$crisp.push([
      'on',
      'chat:closed',
      function () {
        hideCrispUi();
      }
    ]);
  }

  if (window.__brandedCrispLoaded) return;
  window.__brandedCrispLoaded = true;

  if (document.querySelector('script[src*="client.crisp.chat/l.js"]')) return;

  var d = document;
  var s = d.createElement('script');
  s.src = 'https://client.crisp.chat/l.js';
  s.async = 1;
  d.getElementsByTagName('head')[0].appendChild(s);
})();
