/* ============================================
   HERO EXPANDING PANELS - DESKTOP JS
   ============================================ */

(function() {
    var $cont = document.querySelector('.hero-cont');
    if (!$cont) return;
    
    var $elsArr = [].slice.call($cont.querySelectorAll('.hero-el'));
    var $closeBtnsArr = [].slice.call($cont.querySelectorAll('.hero-el__close-btn'));

    function revealHeroBackground($el) {
        if ($el && !$el.classList.contains('is-bg-ready')) {
            $el.classList.add('is-bg-ready');
        }
    }

    function scheduleHeroBackgrounds() {
        var queuedIndex = 0;

        function revealNext() {
            if (queuedIndex >= $elsArr.length) return;
            revealHeroBackground($elsArr[queuedIndex]);
            queuedIndex += 1;
            setTimeout(revealNext, queuedIndex <= 5 ? 70 : 180);
        }

        revealNext();
    }

    scheduleHeroBackgrounds();

    // Remove s--inactive after a short delay to trigger animation
    setTimeout(function() {
        $cont.classList.remove('s--inactive');
    }, 300);

    // Map frontend category to API productType slug
    var categoryToSlug = {
        'aprons': 'aprons',
        'hoodies': 'hoodies',
        'beanies': 'beanies',
        'hivis': 'safety-vests',
        'polo': 'polos',
        'jackets': 'jackets',
        'tshirts': 't-shirts',
        'trousers': 'trousers',
        'sustainable': 'sustainable'
    };

    function navigateToCategory(category) {
        if (!category) return;
        var productTypeSlug = categoryToSlug[category];
        if (category === 'sustainable') {
            window.location.href = 'shop-pc.html?accreditation=recycled';
        } else if (productTypeSlug) {
            window.location.href = 'shop-pc.html?productType=' + encodeURIComponent(productTypeSlug);
        } else {
            window.location.href = 'shop-pc.html?category=' + encodeURIComponent(category);
        }
    }

    $elsArr.forEach(function($el) {
        $el.addEventListener('click', function(e) {
            // Don't navigate if clicking close button or CTA link
            if (e.target.closest('.hero-el__close-btn') || e.target.closest('.hero-el__cta')) {
                return;
            }
            
            // If already active, navigate immediately
            if (this.classList.contains('s--active')) {
                navigateToCategory(this.getAttribute('data-category'));
                return;
            }
            
            // Step 1: Expand this panel (visual effect)
            revealHeroBackground(this);
            $cont.classList.add('s--el-active');
            this.classList.add('s--active');

            // Step 2: After full expansion animation, auto-navigate to the category
            var clickedEl = this;
            setTimeout(function() {
                navigateToCategory(clickedEl.getAttribute('data-category'));
            }, 2500);
        });
    });

    // Close button handler
    $closeBtnsArr.forEach(function($btn) {
        $btn.addEventListener('click', function(e) {
            e.stopPropagation();
            $cont.classList.remove('s--el-active');
            var activeEl = $cont.querySelector('.hero-el.s--active');
            if (activeEl) activeEl.classList.remove('s--active');
        });
    });

    // ESC key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            $cont.classList.remove('s--el-active');
            var activeEl = $cont.querySelector('.hero-el.s--active');
            if (activeEl) activeEl.classList.remove('s--active');
        }
    });
})();

/* ============================================
   HERO BANNER - BRANDED BOUNCING (split into chars)
   ============================================ */
(function() {
    var bounceEls = document.querySelectorAll('[data-bounce-text]');
    if (!bounceEls.length) return;

    bounceEls.forEach(function(el) {
        var text = (el.textContent || '').trim();
        if (!text) return;

        el.textContent = '';
        Array.from(text).forEach(function(ch, idx) {
            var span = document.createElement('span');
            span.className = 'hero-bounce-char';
            span.style.setProperty('--char-index', String(idx));
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            el.appendChild(span);
        });
    });
})();
