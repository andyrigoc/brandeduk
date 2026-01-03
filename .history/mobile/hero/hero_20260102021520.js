// Hero Expanding Sections
(function() {
  var $cont = document.querySelector('.hero-cont');
  if (!$cont) return;
  
  var $elsArr = [].slice.call($cont.querySelectorAll('.hero-el'));
  var $closeBtnsArr = [].slice.call($cont.querySelectorAll('.hero-el__close-btn'));

  // Remove s--inactive after a short delay to trigger animation
  setTimeout(function() {
    $cont.classList.remove('s--inactive');
  }, 300);

  $elsArr.forEach(function($el) {
    $el.addEventListener('click', function(e) {
      // Don't navigate if clicking close button or CTA link
      if (e.target.closest('.hero-el__close-btn') || e.target.closest('.hero-el__cta')) {
        return;
      }
      
      // If already active, navigate to category page
      if (this.classList.contains('s--active')) {
        var category = this.getAttribute('data-category');
        console.log('Hero clicked, category:', category);
        if (category) {
          window.location.href = 'shop.html?category=' + category;
        }
        return;
      }
      $cont.classList.add('s--el-active');
      this.classList.add('s--active');
    });
  });

  $closeBtnsArr.forEach(function($btn) {
    $btn.addEventListener('click', function(e) {
      e.stopPropagation();
      $cont.classList.remove('s--el-active');
      var activeEl = $cont.querySelector('.hero-el.s--active');
      if (activeEl) activeEl.classList.remove('s--active');
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
