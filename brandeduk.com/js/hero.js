/* ============================================
   HERO EXPANDING PANELS - DESKTOP JS
   ============================================ */

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
                
                if (category) {
                    // Map frontend category to API productType slug
                    var categoryToSlug = {
                        'aprons': 'aprons',
                        'hoodies': 'hoodies',
                        'beanies': 'beanies',
                        'hivis': 'safety-vests', // Map Hivis to Safety Vests
                        'polo': 'polos',
                        'jackets': 'jackets',
                        'tshirts': 't-shirts',
                        'trousers': 'trousers',
                        'sustainable': 'sustainable' // Special: will use accreditations filter
                    };
                    
                    var productTypeSlug = categoryToSlug[category];
                    
                    if (category === 'sustainable') {
                        // For sustainable, use accreditation API endpoint with 'recycled' slug
                        // This uses /api/filters/accreditations/recycled/products
                        window.location.href = 'shop-pc.html?accreditation=recycled';
                    } else if (productTypeSlug) {
                        // Use productType parameter only - clean URL with no other params
                        window.location.href = 'shop-pc.html?productType=' + encodeURIComponent(productTypeSlug);
                    } else {
                        // Fallback to category
                        window.location.href = 'shop-pc.html?category=' + encodeURIComponent(category);
                    }
                }
                return;
            }
            
            // Expand this panel
            $cont.classList.add('s--el-active');
            this.classList.add('s--active');
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
