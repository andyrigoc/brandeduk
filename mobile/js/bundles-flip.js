/* Delivery-card flip: scroll once under the sticky header, THEN four-phase rotateX.
   No concurrent scroll during the roll (that caused the open/close tremble). */
(function () {
  'use strict';
  if (window.__brandedBundlesFlipLoaded) return;
  window.__brandedBundlesFlipLoaded = true;

  var animating = false;
  var step1 = 500;
  var step2 = 500;
  var step3 = 500;
  var reqStep1 = 600;
  var reqStep2 = 800;
  var reqClosingStep1 = 500;
  var reqClosingStep2 = 500;
  var preScrollMs = 280;
  var activeCard = null;
  var pressedCard = null;
  var openScrollTopVal = null;
  var openScrollEl = null;
  var scrollAnimToken = 0;

  function grid() {
    return document.getElementById('catalogue-grid');
  }

  function isMobile() {
    return window.matchMedia('(max-width: 699px)').matches || /force=mobile/i.test(window.location.search);
  }

  function isWindowScroller(el) {
    return !el || el === document.documentElement || el === document.body || el === document.scrollingElement;
  }

  function getScrollParent(el) {
    var node = el && el.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      var style = window.getComputedStyle(node);
      var oy = style.overflowY;
      if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && node.scrollHeight > node.clientHeight + 1) {
        return node;
      }
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  function getScrollTop(scrollEl) {
    if (isWindowScroller(scrollEl)) {
      return window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    return scrollEl.scrollTop;
  }

  function setScrollTop(scrollEl, value) {
    if (isWindowScroller(scrollEl)) {
      window.scrollTo(0, value);
      return;
    }
    scrollEl.scrollTop = value;
  }

  function getHeaderBottom() {
    var selectors = [
      '.header-with-promo',
      '.mobile-header--v2',
      '.mobile-header',
      '.mh-search',
      '.mh-search-control'
    ];
    var bottom = 0;
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (!el) continue;
      bottom = Math.max(bottom, el.getBoundingClientRect().bottom);
    }
    return bottom;
  }

  function getChromeInsets() {
    var nav = document.querySelector('.bottom-nav');
    var topPad = 16;
    var bottomPad = 12;
    var top = Math.ceil(getHeaderBottom()) + topPad;
    var bottom = bottomPad;
    if (nav) {
      bottom = Math.ceil(window.innerHeight - nav.getBoundingClientRect().top) + bottomPad;
    }
    return { top: Math.max(topPad, top), bottom: Math.max(bottomPad, bottom) };
  }

  /* Place card top just under the sticky header (never under logo/search). */
  function computeScrollTopVal(card, scrollEl) {
    var insets = getChromeInsets();
    var cardRect = card.getBoundingClientRect();
    if (isWindowScroller(scrollEl)) {
      return Math.max(0, getScrollTop(scrollEl) + cardRect.top - insets.top);
    }
    var scrollerRect = scrollEl.getBoundingClientRect();
    var padTop = Math.max(8, insets.top - scrollerRect.top);
    return Math.max(0, getScrollTop(scrollEl) + cardRect.top - scrollerRect.top - padTop);
  }

  function animateScrollTop(scrollEl, to, duration, onDone) {
    var token = ++scrollAnimToken;
    var from = getScrollTop(scrollEl);
    var target = Math.max(0, to);
    var settled = false;
    var doneFired = false;
    function finish() {
      if (token !== scrollAnimToken || doneFired) return;
      doneFired = true;
      settled = true;
      setScrollTop(scrollEl, target);
      if (typeof onDone === 'function') onDone();
    }
    if (Math.abs(from - target) < 1 || duration <= 0) {
      finish();
      return;
    }
    var start = performance.now();
    function apply(now) {
      if (token !== scrollAnimToken || settled) return;
      var t = Math.min(1, (now - start) / duration);
      var eased = 0.5 - Math.cos(t * Math.PI) / 2;
      setScrollTop(scrollEl, from + (target - from) * eased);
      if (t >= 1) finish();
    }
    function rafTick(now) {
      apply(now);
      if (!settled && token === scrollAnimToken) window.requestAnimationFrame(rafTick);
    }
    window.requestAnimationFrame(rafTick);
    var iv = window.setInterval(function () {
      if (token !== scrollAnimToken) {
        window.clearInterval(iv);
        return;
      }
      apply(performance.now());
      if (settled) window.clearInterval(iv);
    }, 32);
    window.setTimeout(function () {
      window.clearInterval(iv);
      finish();
    }, duration + 40);
  }

  function clearPress(card) {
    if (card) {
      card.classList.remove('is-pressing');
      if (pressedCard === card) pressedCard = null;
      return;
    }
    if (pressedCard) {
      pressedCard.classList.remove('is-pressing');
      pressedCard = null;
    }
    document.querySelectorAll('.catalogue .card.is-pressing').forEach(function (el) {
      el.classList.remove('is-pressing');
    });
  }

  function resetCardClasses(card) {
    card.classList.remove(
      'req-closing2',
      'req-closing1',
      'req-active2',
      'req-active1',
      'map-active',
      'flip-step3',
      'flip-step2',
      'flip-step1',
      'active',
      'is-pressing',
      'no-transition',
      'hidden-hack'
    );
    card.setAttribute('aria-expanded', 'false');
  }

  function startFlipSequence(card) {
    card.classList.add('flip-step1', 'active');
    card.setAttribute('aria-expanded', 'true');

    window.setTimeout(function () {
      card.classList.add('flip-step2');

      window.setTimeout(function () {
        card.classList.add('flip-step3');

        window.setTimeout(function () {
          animating = false;
        }, step3);
      }, step2 * 0.5);
    }, step1 * 0.65);
  }

  /* Scroll ONCE under the header, THEN the four-phase roll (no scroll during flip). */
  function openCard(card) {
    if (!isMobile() || animating || !card || card.classList.contains('active')) return;
    if (activeCard && activeCard !== card) closeCard(activeCard, true);
    clearPress(card);
    animating = true;
    activeCard = card;
    var g = grid();
    if (g) g.classList.add('is-opening');

    openScrollEl = getScrollParent(card);
    card.style.overflowAnchor = 'none';
    if (g) g.style.overflowAnchor = 'none';
    document.documentElement.style.overflowAnchor = 'none';

    /* Recompute after a forced layout so the pin uses the live card position. */
    void card.offsetTop;
    openScrollTopVal = computeScrollTopVal(card, openScrollEl);
    /* Instant snap under the header, THEN the four-phase roll (no scroll during flip). */
    setScrollTop(openScrollEl, openScrollTopVal);
    void card.offsetTop;
    openScrollTopVal = computeScrollTopVal(card, openScrollEl);
    setScrollTop(openScrollEl, openScrollTopVal);
    startFlipSequence(card);
  }

  /* Close roll without mid-animation scroll fights; final snap keeps card under header. */
  function closeFlip(card) {
    animating = true;
    clearPress(card);
    var scrollEl = openScrollEl || getScrollParent(card);
    var scrollTopVal =
      openScrollTopVal != null ? openScrollTopVal : computeScrollTopVal(card, scrollEl);
    openScrollEl = scrollEl;
    openScrollTopVal = scrollTopVal;
    /* Freeze scroll position for the whole close — do not re-animate each step. */
    setScrollTop(scrollEl, scrollTopVal);
    scrollAnimToken += 1;

    card.classList.remove('flip-step3', 'active');
    card.setAttribute('aria-expanded', 'false');

    window.setTimeout(function () {
      card.classList.remove('flip-step2');

      window.setTimeout(function () {
        card.classList.remove('flip-step1');

        window.setTimeout(function () {
          /* Closed card is the topmost fully visible row, just under the header. */
          openScrollTopVal = computeScrollTopVal(card, scrollEl);
          setScrollTop(scrollEl, openScrollTopVal);
          card.style.overflowAnchor = '';
          document.documentElement.style.overflowAnchor = '';
          if (activeCard === card) activeCard = null;
          openScrollTopVal = null;
          openScrollEl = null;
          var g = grid();
          if (g) g.style.overflowAnchor = '';
          if (g && !g.querySelector('.card.active, .card.flip-step1')) g.classList.remove('is-opening');
          animating = false;
        }, step1);
      }, step2 * 0.65);
    }, step3 / 2);
  }

  function closeReq(card) {
    animating = true;
    clearPress(card);
    card.classList.add('req-closing1');

    window.setTimeout(function () {
      card.classList.add('req-closing2');

      window.setTimeout(function () {
        card.classList.add('no-transition', 'hidden-hack');
        void card.offsetTop;
        resetCardClasses(card);
        card.classList.remove('no-transition', 'hidden-hack');
        if (openScrollEl) {
          openScrollTopVal = computeScrollTopVal(card, openScrollEl);
          setScrollTop(openScrollEl, openScrollTopVal);
        }
        if (activeCard === card) activeCard = null;
        openScrollTopVal = null;
        openScrollEl = null;
        var g = grid();
        if (g && !g.querySelector('.card.active, .card.flip-step1')) g.classList.remove('is-opening');
        animating = false;
      }, reqClosingStep2);
    }, reqClosingStep1);
  }

  function closeCard(card, instant) {
    if (!card) return;
    if (!instant && animating) return;
    if (
      !card.classList.contains('active') &&
      !card.classList.contains('flip-step1') &&
      !card.classList.contains('req-active1')
    ) {
      return;
    }

    if (instant) {
      scrollAnimToken += 1;
      resetCardClasses(card);
      if (activeCard === card) activeCard = null;
      openScrollTopVal = null;
      openScrollEl = null;
      var gInstant = grid();
      if (gInstant && !gInstant.querySelector('.card.active')) gInstant.classList.remove('is-opening');
      animating = false;
      return;
    }

    if (card.classList.contains('req-active1')) {
      closeReq(card);
      return;
    }
    closeFlip(card);
  }

  function openRequest(card) {
    if (!isMobile() || animating || !card) return;
    if (!card.classList.contains('flip-step3') && !card.classList.contains('active')) return;
    if (card.classList.contains('req-active1')) return;

    animating = true;
    clearPress(card);
    card.classList.add('req-active1', 'map-active');

    window.setTimeout(function () {
      card.classList.add('req-active2');
      window.setTimeout(function () {
        animating = false;
      }, reqStep2);
    }, reqStep1);
  }

  function openBuilderFromCard(card) {
    var btn = card.querySelector('.card__request-btn[data-id]');
    var id = btn && btn.getAttribute('data-id');
    if (!id) return;
    if (typeof window.BrandedOpenBundle === 'function') {
      window.BrandedOpenBundle(id, btn);
      return;
    }
    document.dispatchEvent(
      new CustomEvent('branded:build-bundle', { detail: { id: id, source: btn } })
    );
    if (btn) {
      btn.setAttribute('data-action', 'open');
      btn.click();
      btn.removeAttribute('data-action');
    }
  }

  function pressCardFromEvent(event) {
    var target = event.target;
    if (!target || !target.closest || !isMobile()) return null;
    if (target.closest('.card__request-btn, .card__header__close-btn')) return null;
    var card = target.closest('.card');
    if (!card || card.classList.contains('active')) return null;
    if (!target.closest('.card__face, .card__part-2 > .m--back')) return null;
    var g = grid();
    if (!g || !g.contains(card)) return null;
    return card;
  }

  function onClick(event) {
    var target = event.target;
    if (!target || !target.closest || !isMobile()) return;

    var requestBtn = target.closest('.card__request-btn');
    if (requestBtn) {
      var reqCard = requestBtn.closest('.card');
      if (!reqCard || !grid() || !grid().contains(reqCard)) return;
      event.preventDefault();
      event.stopPropagation();
      if (requestBtn.disabled) return;

      if (reqCard.classList.contains('req-active1')) {
        if (reqCard.classList.contains('req-active2') && !animating) {
          openBuilderFromCard(reqCard);
          closeCard(reqCard, true);
        }
        return;
      }

      openRequest(reqCard);
      return;
    }

    var closeBtn = target.closest('.card__header__close-btn');
    if (closeBtn) {
      event.preventDefault();
      event.stopPropagation();
      closeCard(closeBtn.closest('.card'));
      return;
    }

    var card = target.closest('.card');
    if (!card || !grid() || !grid().contains(card)) return;
    if (card.classList.contains('active') || card.classList.contains('req-active1')) return;
    event.preventDefault();
    openCard(card);
  }

  function onKey(event) {
    if (event.key === 'Escape' && activeCard) closeCard(activeCard);
  }

  function onPressStart(event) {
    if (event.type === 'mousedown' && event.button !== 0) return;
    var card = pressCardFromEvent(event);
    if (!card) return;
    clearPress();
    pressedCard = card;
    card.classList.add('is-pressing');
  }

  function onPressEnd() {
    clearPress();
  }

  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onPressStart, true);
  document.addEventListener('pointerup', onPressEnd, true);
  document.addEventListener('pointercancel', onPressEnd, true);
  document.addEventListener('touchstart', onPressStart, { capture: true, passive: true });
  document.addEventListener('touchend', onPressEnd, true);
  document.addEventListener('touchcancel', onPressEnd, true);

  window.BundlesFlip = {
    refresh: function () {
      clearPress();
      activeCard = null;
      animating = false;
      openScrollTopVal = null;
      openScrollEl = null;
      scrollAnimToken += 1;
      var g = grid();
      if (g) g.classList.remove('is-opening');
    },
    close: function () {
      if (activeCard) closeCard(activeCard, true);
    },
    open: function (card) {
      openCard(card);
    },
    getScrollParent: getScrollParent,
    computeScrollTopVal: computeScrollTopVal,
    getChromeInsets: getChromeInsets
  };
})();
