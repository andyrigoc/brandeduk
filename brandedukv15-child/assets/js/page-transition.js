/**
 * Branded UK - page transition loader.
 *
 * On a click on an internal link to another page, the current page is blurred,
 * the brand orbiting-squares loader (components/loader.css, .branded-orbit-loader)
 * is shown in the middle, and the browser navigates after DELAY_MS.
 * Nothing runs on page load: landings (Google Ads traffic) stay instant.
 *
 * Skipped: modifier / middle clicks, target other than _self, download links,
 * same-page #anchors, non-http(s) links (tel:, mailto:, javascript:, ...),
 * other domains (wa.me, social, ...), file links (pdf, images, ...),
 * basket / checkout / payment / auth / api URLs, menu toggles (href="#",
 * role="button", data-toggle), clicks already handled by other scripts
 * (event.defaultPrevented), and anything inside [data-no-loader].
 *
 * Loaded on every live page by cookie-consent.js.
 */
(function () {
  'use strict';

  // Fake loading time before navigating to the clicked page.
  var DELAY_MS = 1500;
  // If the browser is still on this page this long after navigating
  // (beforeunload prompt cancelled, download, very slow server), drop the overlay.
  var STUCK_MS = 6000;

  if (window.self !== window.top) return;
  if (window.BrandedPageTransition) return;

  var OVERLAY_ID = 'bukPageTransition';
  var STYLE_ID = 'bukPageTransitionStyles';
  var FILE_RE = /\.(pdf|zip|rar|7z|csv|xlsx?|docx?|pptx?|txt|json|xml|jpe?g|png|gif|webp|avif|svg|ico|mp4|webm|mov|mp3|wav|ai|eps|psd)$/i;
  var NO_LOADER_PATH_RE = /(^|\/)(checkout|basket|payment-|quote-review)|\/(auth|api)\//i;

  var overlay = null;
  var navTimer = null;
  var stuckTimer = null;
  var pending = false;

  var CSS =
    '#' + OVERLAY_ID + '{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(255,255,255,.35);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);' +
      'opacity:0;transition:opacity .15s ease;cursor:progress}' +
    '#' + OVERLAY_ID + '.is-active{opacity:1}' +
    '@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){#' + OVERLAY_ID + '{background:rgba(255,255,255,.65)}}' +
    '#' + OVERLAY_ID + ' .buk-pt-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' +
    /* Same values as .branded-orbit-loader in components/loader.css (not loaded on every page).
       Delays are the negative equivalents of 1.5s / 1s / .5s on the 2s cycle, so all four
       squares are already moving on the first frame of a short transition. */
    '#' + OVERLAY_ID + ' .branded-orbit-loader{position:relative;width:100px;height:100px;contain:layout paint}' +
    '#' + OVERLAY_ID + ' .branded-orbit-loader span{display:block;position:absolute;width:40%;height:40%;border-radius:50%;' +
      'box-shadow:2px 2px 3px rgba(0,0,0,.4);-webkit-animation:buk-pt-orbit-run 2s infinite ease-in-out;animation:buk-pt-orbit-run 2s infinite ease-in-out}' +
    '#' + OVERLAY_ID + ' .branded-orbit-loader .branded-orbit-1{background:#f3b222;-webkit-animation-delay:-.5s;animation-delay:-.5s}' +
    '#' + OVERLAY_ID + ' .branded-orbit-loader .branded-orbit-2{background:#f0653e;-webkit-animation-delay:-1s;animation-delay:-1s}' +
    '#' + OVERLAY_ID + ' .branded-orbit-loader .branded-orbit-3{background:#b9c0c0;-webkit-animation-delay:-1.5s;animation-delay:-1.5s}' +
    '#' + OVERLAY_ID + ' .branded-orbit-loader .branded-orbit-4{background:#8f7473}' +
    '@-webkit-keyframes buk-pt-orbit-run{0%{transform:translate(0%);border-radius:50%}25%{transform:translate(150%) scale(.5);border-radius:0%}' +
      '50%{transform:translate(150%,150%);border-radius:50%}75%{transform:translate(0%,150%) scale(.5);border-radius:0%}}' +
    '@keyframes buk-pt-orbit-run{0%{transform:translate(0%);border-radius:50%}25%{transform:translate(150%) scale(.5);border-radius:0%}' +
      '50%{transform:translate(150%,150%);border-radius:50%}75%{transform:translate(0%,150%) scale(.5);border-radius:0%}}' +
    '@media (prefers-reduced-motion: reduce){#' + OVERLAY_ID + '{transition:none}' +
      '#' + OVERLAY_ID + ' .branded-orbit-loader span{-webkit-animation-duration:4s;animation-duration:4s}}';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function show() {
    ensureStyles();
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = OVERLAY_ID;
      overlay.setAttribute('role', 'status');
      overlay.setAttribute('aria-live', 'polite');
      overlay.innerHTML =
        '<div class="branded-orbit-loader" aria-hidden="true">' +
          '<span class="branded-orbit-1"></span>' +
          '<span class="branded-orbit-2"></span>' +
          '<span class="branded-orbit-3"></span>' +
          '<span class="branded-orbit-4"></span>' +
        '</div>' +
        '<span class="buk-pt-sr"></span>';
    }
    overlay.classList.remove('is-active');
    if (!overlay.parentNode) document.body.appendChild(overlay);
    void overlay.offsetWidth;
    overlay.classList.add('is-active');
    overlay.querySelector('.buk-pt-sr').textContent = 'Loading';
  }

  function hide() {
    pending = false;
    clearTimeout(navTimer);
    clearTimeout(stuckTimer);
    navTimer = stuckTimer = null;
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  function samePage(url) {
    function norm(path) { return path.replace(/\/index(\.html)?$/i, '/').replace(/\.html$/i, ''); }
    return norm(url.pathname) === norm(window.location.pathname) && url.search === window.location.search;
  }

  function targetUrl(event) {
    if (event.defaultPrevented || event.button !== 0) return null;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;

    var link = event.target && event.target.closest ? event.target.closest('a[href], area[href]') : null;
    if (!link || !(link instanceof HTMLAnchorElement || link instanceof HTMLAreaElement)) return null;
    if (link.closest('[data-no-loader]')) return null;

    var target = (link.getAttribute('target') || '').toLowerCase();
    if (target && target !== '_self') return null;
    if (link.hasAttribute('download')) return null;
    if (link.getAttribute('role') === 'button') return null;
    if (link.hasAttribute('data-toggle') || link.hasAttribute('data-bs-toggle')) return null;

    var raw = (link.getAttribute('href') || '').trim();
    if (!raw || raw.charAt(0) === '#') return null;

    var url;
    try { url = new URL(link.href, window.location.href); } catch (e) { return null; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.origin !== window.location.origin) return null;
    if (url.hash && samePage(url)) return null;
    if (FILE_RE.test(url.pathname)) return null;
    if (NO_LOADER_PATH_RE.test(url.pathname)) return null;
    return url;
  }

  function prefetch(href) {
    try {
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      (document.head || document.documentElement).appendChild(link);
    } catch (e) {}
  }

  function onClick(event) {
    if (pending) {
      var again = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (again && !event.defaultPrevented) event.preventDefault();
      return;
    }
    var url = targetUrl(event);
    if (!url) return;

    event.preventDefault();
    pending = true;
    show();
    prefetch(url.href);
    navTimer = setTimeout(function () {
      navTimer = null;
      window.location.assign(url.href);
      stuckTimer = setTimeout(hide, STUCK_MS);
    }, DELAY_MS);
  }

  // Bubble phase on window: runs after page scripts that handle the same click
  // on elements or document, so their preventDefault() is already visible.
  window.addEventListener('click', onClick);

  document.addEventListener('keydown', function (event) {
    if (pending && navTimer && (event.key === 'Escape' || event.key === 'Esc')) hide();
  });

  // Back/forward cache: never restore a blurred page.
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) hide();
  });

  window.BrandedPageTransition = { delay: DELAY_MS, show: show, hide: hide };
})();
