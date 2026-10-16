// Bottom bar "Customise" chooser: Shop & Customise (shop page) or Request a Quote (contact popup).
// Any element with [data-start-sheet-trigger] toggles the sheet. The markup is built once on load.
(function () {
  if (window.__brandedStartSheetLoaded) return;
  window.__brandedStartSheetLoaded = true;

  var QUOTE_MESSAGE = 'Hi, I would like a quote.';
  var CONTACT_SCRIPT_VERSION = '20261003-consent';
  var FALLBACK_BAR_HEIGHT = 64;

  var sheet = null;
  var activeTrigger = null;

  function findScriptSrc() {
    var current = document.currentScript;
    if (current && current.src) return current.src;
    var tag = document.querySelector('script[src*="bottom-nav.js"]');
    return tag ? tag.src : window.location.href;
  }

  var scriptSrc = findScriptSrc();

  // Paths are relative to this file (mobile/js/) so they resolve from any page depth.
  function assetUrl(path) {
    try {
      return new URL(path, scriptSrc).href;
    } catch (error) {
      return path;
    }
  }

  var SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
  var ICON_SHIRT = SVG_OPEN + '><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>';
  var ICON_DOC = SVG_OPEN + '><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
  var ICON_ARROW = SVG_OPEN + ' class="start-sheet__arrow"><polyline points="9 18 15 12 9 6"/></svg>';

  function buildSheet() {
    if (sheet || !document.body) return;
    sheet = document.createElement('div');
    sheet.className = 'start-sheet';
    sheet.id = 'startSheet';
    sheet.hidden = true;
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-labelledby', 'startSheetTitle');
    sheet.innerHTML =
      '<div class="start-sheet__backdrop" data-start-sheet-close></div>' +
      '<div class="start-sheet__panel">' +
        '<h2 class="start-sheet__title" id="startSheetTitle">How would you like to get started?</h2>' +
        '<a class="start-sheet__option start-sheet__option--shop" href="' + assetUrl('../../shop.html') + '">' +
          '<span class="start-sheet__icon">' + ICON_SHIRT + '</span>' +
          '<span class="start-sheet__text">' +
            '<span class="start-sheet__name">Shop &amp; Customise</span>' +
            '<span class="start-sheet__hint">Browse our products and add your logo</span>' +
          '</span>' + ICON_ARROW +
        '</a>' +
        '<button type="button" class="start-sheet__option start-sheet__option--quote" data-start-sheet-quote>' +
          '<span class="start-sheet__icon">' + ICON_DOC + '</span>' +
          '<span class="start-sheet__text">' +
            '<span class="start-sheet__name">Request a Quote</span>' +
            '<span class="start-sheet__hint">Get a tailored quote for larger orders</span>' +
          '</span>' + ICON_ARROW +
        '</button>' +
      '</div>';
    document.body.appendChild(sheet);
  }

  function isOpen() {
    return !!sheet && !sheet.hidden;
  }

  function setExpanded(expanded) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-start-sheet-trigger]'), function (trigger) {
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  // Leaves the bar itself uncovered: the sheet ends where the bar begins.
  function positionAboveBar() {
    var bar = activeTrigger && activeTrigger.closest('nav');
    var offset = FALLBACK_BAR_HEIGHT;
    if (bar) {
      offset = Math.max(0, Math.round(window.innerHeight - bar.getBoundingClientRect().top));
    }
    sheet.style.setProperty('--start-sheet-bottom', offset + 'px');
  }

  function open(trigger) {
    buildSheet();
    if (!sheet) return;
    activeTrigger = trigger;
    positionAboveBar();
    sheet.hidden = false;
    setExpanded(true);
    var first = sheet.querySelector('.start-sheet__option');
    if (first) first.focus({ preventScroll: true });
  }

  function close(restoreFocus) {
    if (!isOpen()) return;
    sheet.hidden = true;
    setExpanded(false);
    if (restoreFocus && activeTrigger) activeTrigger.focus({ preventScroll: true });
    activeTrigger = null;
  }

  function withContactPopup(callback) {
    if (typeof window.openContactPopup === 'function') {
      callback(true);
      return;
    }
    var script = document.createElement('script');
    script.src = assetUrl('popup-contact.js?v=' + CONTACT_SCRIPT_VERSION);
    script.onload = function () { callback(typeof window.openContactPopup === 'function'); };
    script.onerror = function () { callback(false); };
    document.head.appendChild(script);
  }

  function openQuote() {
    withContactPopup(function (ready) {
      if (ready) {
        window.openContactPopup({ message: QUOTE_MESSAGE });
      } else {
        window.location.href = assetUrl('../../contact.html');
      }
    });
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var trigger = target.closest('[data-start-sheet-trigger]');
    if (trigger) {
      event.preventDefault();
      if (isOpen()) close(true);
      else open(trigger);
      return;
    }

    if (!isOpen()) return;

    if (target.closest('[data-start-sheet-quote]')) {
      close(false);
      openQuote();
    } else if (target.closest('[data-start-sheet-close]')) {
      close(true);
    } else if (!target.closest('.start-sheet__panel')) {
      // Any other tap (another bar item, for example) dismisses the sheet.
      close(false);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close(true);
  });

  window.addEventListener('resize', function () {
    if (isOpen()) positionAboveBar();
  });

  // Back/forward cache can restore the page with the sheet still open.
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) close(false);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildSheet);
  } else {
    buildSheet();
  }
})();
