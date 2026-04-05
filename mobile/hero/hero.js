// Hero Expanding Sections
(function() {
  var $cont = document.querySelector('.hero-cont');
  if (!$cont) return;

  var lastScrollLeft = 0;
  
  var $elsArr = [].slice.call($cont.querySelectorAll('.hero-el'));
  var $closeBtnsArr = [].slice.call($cont.querySelectorAll('.hero-el__close-btn'));

  // Remove s--inactive after a short delay to trigger animation
  setTimeout(function() {
    $cont.classList.remove('s--inactive');
    // Hide loading placeholder once hero panels animate in
    var placeholder = document.getElementById('heroLoadingPlaceholder');
    if (placeholder) {
      placeholder.classList.add('hidden');
      // Remove from DOM after fade-out completes
      setTimeout(function() {
        if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      }, 500);
    }
  }, 300);

  // ── Touch-aware tap detection ──
  // On touch devices, we handle tap ourselves and block the native click.
  // A "tap" = finger down + up with < 10px total movement and < 300ms hold.
  var TAP_MOVE_LIMIT = 10;   // px – anything beyond this is a swipe/scroll
  var TAP_TIME_LIMIT = 300;  // ms – anything longer is a long-press / scroll

  // Track the last touch interaction globally so the click handler knows
  // whether to let the event through.
  var lastTouchHandledAt = 0;

  function handlePanelActivation($el) {
    var category = $el.getAttribute('data-category');
    if (!category) return;

    // Expand visually first, then navigate after animation completes
    $cont.classList.add('s--el-active');
    $el.classList.add('s--active');
    setTimeout(function() {
      window.location.href = 'shop.html?category=' + category;
    }, 800);
  }

  $elsArr.forEach(function($el) {
    var elTouchStartX = 0;
    var elTouchStartY = 0;
    var elTouchStartTime = 0;
    var elTouchStartScroll = 0;
    var elTouchMoved = false;

    // Track touch on each panel element individually
    $el.addEventListener('touchstart', function(e) {
      elTouchMoved = false;
      if (e.touches.length > 0) {
        elTouchStartX = e.touches[0].clientX;
        elTouchStartY = e.touches[0].clientY;
        elTouchStartTime = Date.now();
        elTouchStartScroll = $cont.scrollLeft;
      }
    }, { passive: true });

    $el.addEventListener('touchmove', function(e) {
      if (elTouchMoved) return; // already flagged
      if (e.touches.length > 0) {
        var dx = Math.abs(e.touches[0].clientX - elTouchStartX);
        var dy = Math.abs(e.touches[0].clientY - elTouchStartY);
        if (dx > TAP_MOVE_LIMIT || dy > TAP_MOVE_LIMIT) {
          elTouchMoved = true;
        }
      }
    }, { passive: true });

    $el.addEventListener('touchend', function(e) {
      // Also check if the scroll position changed (browser-handled scroll)
      var scrollDelta = Math.abs($cont.scrollLeft - elTouchStartScroll);
      var elapsed = Date.now() - elTouchStartTime;

      // Check if the auto-scroll drag script detected a drag (exposed globally)
      var autoScrollDragged = !!window._heroAutoscrollDragMoved;

      // Only treat as tap if: finger barely moved, scroll didn't change, quick touch
      if (!elTouchMoved && !autoScrollDragged && scrollDelta < TAP_MOVE_LIMIT && elapsed < TAP_TIME_LIMIT) {
        // Check we didn't tap on close button or CTA
        var target = e.target;
        if (target.closest && (target.closest('.hero-el__close-btn') || target.closest('.hero-el__cta'))) {
          return; // let default behavior handle these
        }
        e.preventDefault(); // prevent the upcoming click event
        lastTouchHandledAt = Date.now();
        handlePanelActivation($el);
      }
    }, { passive: false }); // passive:false needed for preventDefault()

    // For mouse/desktop: keep click but only for non-touch
    $el.addEventListener('click', function(e) {
      // On touch devices, touchend already handled it; block click to avoid double-fire.
      // Detect touch device: if last interaction was touch, skip.
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        // On touch-capable devices, block click – touchend handles everything.
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Desktop mouse click
      if (e.target.closest('.hero-el__close-btn') || e.target.closest('.hero-el__cta')) {
        return;
      }
      handlePanelActivation($el);
    });
  });

  $closeBtnsArr.forEach(function($btn) {
    $btn.addEventListener('click', function(e) {
      e.stopPropagation();
      $cont.classList.remove('s--el-active');
      var activeEl = $cont.querySelector('.hero-el.s--active');
      if (activeEl) activeEl.classList.remove('s--active');

      // Restore previous scroll position after closing
      if (lastScrollLeft) {
        requestAnimationFrame(function() {
          try {
            $cont.scrollLeft = lastScrollLeft;
          } catch (err) {}
        });
      }
    });
  });
})();

// Hero Switcher - Toggle between Hero 1, Hero 2 and Hero 3
(function() {
  var hero1 = document.getElementById('hero1');
  var hero2 = document.getElementById('hero2');
  var hero3 = document.getElementById('hero3');
  var dots = document.querySelectorAll('.hero-dot');
  
  if (!hero1 || !hero2 || dots.length === 0) return;
  
  var totalHeroes = hero3 ? 3 : 2;
  var currentHero = 1;
  var autoSwitchTimer = null;
  var isInteracting = false;

  // Initialize: remove inline style and set up initial state
  hero2.classList.remove('hero-visible');
  if (hero3) hero3.classList.remove('hero-visible');

  function showHero(num) {
    var prevHero = currentHero;
    
    // Skip if same hero
    if (num === prevHero) return;
    
    // Remove active from all dots
    dots.forEach(function(d) { d.classList.remove('hero-dot--active'); });
    
    // Exit current hero to the left
    if (prevHero === 1) {
      hero1.classList.remove('hero-active');
      hero1.classList.add('hero-hidden');
    } else if (prevHero === 2) {
      hero2.classList.add('hero-exiting');
      hero2.classList.remove('hero-visible');
    } else if (prevHero === 3 && hero3) {
      hero3.classList.add('hero-exiting');
      hero3.classList.remove('hero-visible');
    }
    
    // Enter new hero from the right
    if (num === 1) {
      // Disable transition, position to right
      hero1.style.transition = 'none';
      hero1.classList.remove('hero-hidden');
      hero1.classList.add('hero-entering');
      
      // Force browser to apply the position
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          // Re-enable transition and animate to center
          hero1.style.transition = '';
          hero1.classList.remove('hero-entering');
          hero1.classList.add('hero-active');
        });
      });
      dots[0].classList.add('hero-dot--active');
    } else if (num === 2) {
      hero2.classList.remove('hero-exiting');
      hero2.classList.add('hero-visible');
      dots[1].classList.add('hero-dot--active');
    } else if (num === 3 && hero3) {
      hero3.classList.remove('hero-exiting');
      hero3.classList.add('hero-visible');
      dots[2].classList.add('hero-dot--active');
    }
    
    // Clean up exiting classes after animation
    setTimeout(function() {
      hero2.classList.remove('hero-exiting');
      if (hero3) hero3.classList.remove('hero-exiting');
    }, 800);
    
    currentHero = num;
  }

  function startAutoSwitch() {
    if (autoSwitchTimer) clearTimeout(autoSwitchTimer);
    autoSwitchTimer = setTimeout(function() {
      if (!isInteracting) {
        var nextHero = currentHero + 1;
        if (nextHero > totalHeroes) nextHero = 1;
        showHero(nextHero);
        startAutoSwitch(); // Continue cycling
      }
    }, 12000); // 12 seconds
  }

  // Dot click handlers
  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      var heroNum = parseInt(this.getAttribute('data-hero'));
      if (heroNum !== currentHero) {
        showHero(heroNum);
        startAutoSwitch(); // Reset timer on manual switch
      }
    });
  });

  // Pause auto-switch when interacting with expanding panels
  if (hero1) {
    hero1.addEventListener('click', function() {
      isInteracting = true;
      setTimeout(function() {
        isInteracting = false;
      }, 30000);
    });
  }

  // Touch swipe functionality
  var touchStartX = 0;
  var touchEndX = 0;
  var heroWrapper = document.querySelector('.hero-wrapper');
  
  if (heroWrapper) {
    heroWrapper.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    heroWrapper.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }
  
  function handleSwipe() {
    var swipeThreshold = 50; // minimum swipe distance
    var diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - go to next hero
        var nextHero = currentHero + 1;
        if (nextHero > totalHeroes) nextHero = 1;
        showHero(nextHero);
      } else {
        // Swipe right - go to previous hero
        var prevHero = currentHero - 1;
        if (prevHero < 1) prevHero = totalHeroes;
        showHero(prevHero);
      }
      startAutoSwitch(); // Reset timer after swipe
    }
  }

  // Start auto-switch timer
  startAutoSwitch();
})();
