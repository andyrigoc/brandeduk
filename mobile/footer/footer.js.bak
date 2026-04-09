(function () {
    function injectFooter() {
        var mount = document.querySelector('[data-mobile-footer]');
        if (!mount) return;

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

                var year = String(new Date().getFullYear());
                document.querySelectorAll('[data-current-year]').forEach(function (el) {
                    el.textContent = year;
                });

                if (typeof window.onMobileFooterInjected === 'function') {
                    try {
                        window.onMobileFooterInjected();
                    } catch (e) {}
                }
            })
            .catch(function () {
                // Fail silently: page will just have no footer if fetch is blocked.
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectFooter);
    } else {
        injectFooter();
    }
})();
