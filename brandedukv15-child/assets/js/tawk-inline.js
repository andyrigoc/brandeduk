/**
 * Tawk.to – prevent pop-out (new tab / new page).
 * Intercepts window.open calls targeting tawk.to and maximizes the
 * embedded widget instead, so the chat always stays on the current page.
 *
 * Load this script BEFORE the Tawk embed snippet on every page.
 */
(function () {
    var _origOpen = window.open;
    window.open = function (url, target, features) {
        if (url && typeof url === 'string' && url.indexOf('tawk.to') !== -1) {
            try {
                if (window.Tawk_API && typeof Tawk_API.maximize === 'function') {
                    Tawk_API.maximize();
                }
            } catch (e) { /* silent */ }
            return null;
        }
        return _origOpen.apply(this, arguments);
    };
})();
