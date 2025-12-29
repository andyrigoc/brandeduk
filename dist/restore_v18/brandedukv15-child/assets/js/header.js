(function () {
    function closeAllDropdowns() {
        document.querySelectorAll('.category-dropdown[data-visible="true"]').forEach((dropdown) => {
            dropdown.setAttribute('data-visible', 'false');
            const button = dropdown.querySelector('.category-toggle');
            if (button) {
                button.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function initCategoryDropdown() {
        document.querySelectorAll('.category-dropdown').forEach((dropdown) => {
            const button = dropdown.querySelector('.category-toggle');
            if (!button) return;

            button.addEventListener('click', (event) => {
                event.preventDefault();
                const currentlyVisible = dropdown.getAttribute('data-visible') === 'true';

                closeAllDropdowns();

                dropdown.setAttribute('data-visible', currentlyVisible ? 'false' : 'true');
                button.setAttribute('aria-expanded', currentlyVisible ? 'false' : 'true');
            });
        });

        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (target.closest('.category-dropdown')) return;
            closeAllDropdowns();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            closeAllDropdowns();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCategoryDropdown);
    } else {
        initCategoryDropdown();
    }
})();
