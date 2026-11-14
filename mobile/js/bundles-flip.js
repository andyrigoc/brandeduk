/* ORIGINAL delivery-card flip + scroll + req-active second open. */
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
  var activeCard = null;
  var pressedCard = null;
  var openScrollTopVal = null;
  var openScrollEl = null;

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

  /* Same math as: cardTop = $card.position().top; scrollTopVal = cardTop - 30
     adapted for window or an overflow scroller. */
  function computeScrollTopVal(card, scrollEl) {
    var cardRect = card.getBoundingClientRect();
    if (isWindowScroller(scrollEl)) {
      return getScrollTop(scrollEl) + cardRect.top - 30;
    }
    var scrollerRect = scrollEl.getBoundingClientRect();
    return getScrollTop(scrollEl) + cardRect.top - scrollerRect.top - 30;
  }

  function animateScrollTop(scrollEl, to, duration) {
    var from = getScrollTop(scrollEl);
    var target = Math.max(0, to);
    if (Math.abs(from - target) < 1 || duration <= 0) {
      setScrollTop(scrollEl, target);
      return;
    }
    var start = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      /* jQuery default swing */
      var eased = 0.5 - Math.cos(t * Math.PI) / 2;
      setScrollTop(scrollEl, from + (target - from) * eased);
      if (t < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
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

  /* Exact original open: flip-step1 + animate scroll to cardTop-30, then step2/step3 with same scroll target */
  function openCard(card) {
    if (!isMobile() || animating || !card || card.classList.contains('active')) return;
    if (activeCard && activeCard !== card) closeCard(activeCard, true);
    clearPress(card);
    animating = true;
    activeCard = card;
    var g = grid();
    if (g) g.classList.add('is-opening');

    var scrollEl = getScrollParent(card);
    openScrollEl = scrollEl;
    openScrollTopVal = computeScrollTopVal(card, scrollEl);

    card.classList.add('flip-step1', 'active');
    card.setAttribute('aria-expanded', 'true');
    animateScrollTop(scrollEl, openScrollTopVal, step1);

    window.setTimeout(function () {
      animateScrollTop(scrollEl, openScrollTopVal, step2);
      card.classList.add('flip-step2');

      window.setTimeout(function () {
        animateScrollTop(scrollEl, openScrollTopVal, step3);
        card.classList.add('flip-step3');

        window.setTimeout(function () {
          animating = false;
        }, step3);
      }, step2 * 0.5);
    }, step1 * 0.65);
  }

  /* Exact original close of flip (when not in req-active) */
  function closeFlip(card) {
    animating = true;
    clearPress(card);
    card.classList.remove('flip-step3', 'active');
    card.setAttribute('aria-expanded', 'false');

    window.setTimeout(function () {
      card.classList.remove('flip-step2');

      window.setTimeout(function () {
        card.classList.remove('flip-step1');

        window.setTimeout(function () {
          if (activeCard === card) activeCard = null;
          openScrollTopVal = null;
          openScrollEl = null;
          var g = grid();
          if (g && !g.querySelector('.card.active, .card.flip-step1')) g.classList.remove('is-opening');
          animating = false;
        }, step1);
      }, step2 * 0.65);
    }, step3 / 2);
  }

  /* Exact original req-closing (full shut from second-open state) */
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

  /* Exact original request-button second open */
  function openRequest(card) {
    if (!isMobile() || animating || !card) return;
    if (!card.classList.contains('flip-step3') && !card.classList.contains('active')) return;
    if (card.classList.contains('req-active1')) return;

    animating = true;
    clearPress(card);

    var scrollEl = openScrollEl || getScrollParent(card);
    var scrollTopVal =
      openScrollTopVal != null ? openScrollTopVal : computeScrollTopVal(card, scrollEl);

    card.classList.add('req-active1', 'map-active');

    window.setTimeout(function () {
      card.classList.add('req-active2');
      animateScrollTop(scrollEl, scrollTopVal, reqStep2);

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
    /* Fallback: synthesize data-action open for app.js */
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

      /* When already in second-open: Start opens the builder (product), matching text-2 role */
      if (reqCard.classList.contains('req-active1')) {
        if (reqCard.classList.contains('req-active2') && !animating) {
          openBuilderFromCard(reqCard);
          closeCard(reqCard, true);
        }
        return;
      }

      /* First tap on yellow button → req-active1 then req-active2 */
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
    computeScrollTopVal: computeScrollTopVal
  };
})();
