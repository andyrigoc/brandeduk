/* =============================================
   BrandedUK Footer – Production JS
   (Template injection + all init functions)
   ============================================= */
(function () {
  'use strict';

  /* --- Template Injection --- */
  function injectFooter() {
    var mount = document.querySelector('[data-mobile-footer]');
    if (!mount) {
      // No mount point — footer HTML is already inline
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

    initIsoSocial();
    initFooterPopups();
    initLondonClock();
    initQuoteButton();
    initBarMenu();
  }

  /* --- 1. Isometric 3D Social Icons (touch) --- */
  function initIsoSocial() {
    if (window.__isoSocialInit) return;
    var isoLinks = document.querySelectorAll('.social.footer-social-3d li a');
    if (!isoLinks.length) return;
    window.__isoSocialInit = true;

    isoLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (!link.classList.contains('iso-active')) {
          e.preventDefault();
          e.stopPropagation();
          isoLinks.forEach(function (l) { l.classList.remove('iso-active'); });
          link.classList.add('iso-active');
        }
      });
    });

    document.addEventListener('click', function (e) {
      var container = document.querySelector('.social.footer-social-3d');
      if (container && !container.contains(e.target)) {
        isoLinks.forEach(function (l) { l.classList.remove('iso-active'); });
      }
    });
  }

  /* --- 2. Footer Popups --- */
  function initFooterPopups() {
    document.querySelectorAll('[data-popup]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var id = 'popup-' + this.getAttribute('data-popup');
        var overlay = document.getElementById(id);
        if (overlay) overlay.classList.add('active');
      });
    });

    document.querySelectorAll('.footer-popup-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('active');
      });
      var btn = overlay.querySelector('.footer-popup-close');
      if (btn) {
        btn.addEventListener('click', function () {
          overlay.classList.remove('active');
        });
      }
    });
  }

  /* --- 3. London Clock (CSS + JS) --- */
  function initLondonClock() {
    var clock = document.querySelector('.clock');
    if (!clock) return;

    var secondHand = document.getElementById('second-hand');
    var minuteHand = document.getElementById('minute-hand');
    var hourHand   = document.getElementById('hour-hand');
    var ticksWrap  = clock.querySelector('.ticks');

    /* Generate 60 tick marks */
    if (ticksWrap) {
      var size = clock.offsetWidth;
      for (var i = 1; i <= 60; i++) {
        var span = document.createElement('span');
        var deg = (i / 60) * 360;
        var isHour = (i % 5 === 0);
        var tickW = isHour ? 5 : 3;
        var dist = size / 2 - tickW;
        span.style.transform = 'rotate(' + deg + 'deg) translateX(' + dist + 'px)';
        if (isHour) span.className = 'hour-mark';
        ticksWrap.appendChild(span);
      }
    }

    /* Get London time */
    function getLondonTime() {
      var now = new Date();
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }).formatToParts(now);
      function getPart(type) {
        return Number(parts.find(function (p) { return p.type === type; }).value);
      }
      return { hours: getPart('hour'), minutes: getPart('minute'), seconds: getPart('second') };
    }

    /* Rotate hands every second */
    function tick() {
      var t = getLondonTime();
      var sDeg = (t.seconds / 60) * 360 - 180;
      var mDeg = ((t.minutes + t.seconds / 60) / 60) * 360 - 180;
      var hDeg = (((t.hours % 12) + t.minutes / 60 + t.seconds / 3600) / 12) * 360 - 180;

      secondHand.style.transform = 'rotate(' + sDeg + 'deg)';
      minuteHand.style.transform = 'rotate(' + mDeg + 'deg)';
      hourHand.style.transform   = 'rotate(' + hDeg + 'deg)';
    }

    tick();
    setInterval(tick, 1000);
  }

  /* --- 4. Quote Button --- */
  function initQuoteButton() {
    var btn = document.querySelector('.quote-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      // Navigate to quote form
      window.location.href = 'quote-form.html';
    });
  }

  /* --- 5. Hamburger / Purple Sidebar --- */
  function initBarMenu() {
    var menu    = document.getElementById('barMenu');
    var trigger = document.getElementById('barMenuTrigger');
    var panel   = document.getElementById('barMenuPanel');
    var closeBtn = document.getElementById('barMenuClose');
    if (!menu || !trigger || !panel) return;

    var menuLinks = panel.querySelectorAll('a');

    function openMenu() {
      menu.classList.add('is-active');
      panel.classList.add('is-active');
      trigger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      menu.classList.remove('is-active');
      panel.classList.remove('is-active');
      trigger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.contains('is-active') ? closeMenu() : openMenu();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
      });
    }

    menuLinks.forEach(function (link) {
      if (!link.hasAttribute('data-popup') && !link.closest('.footer-social-3d')) {
        link.addEventListener('click', closeMenu);
      }
    });

    document.addEventListener('click', function (e) {
      if (!panel.classList.contains('is-active')) return;
      if (!panel.contains(e.target) && !trigger.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* --- Boot --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }
})();
