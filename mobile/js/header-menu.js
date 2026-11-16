/* Sets --mh-search-bottom, where header-v2.css opens the search suggestions, from the header's search row. */
(function () {
    function placeSearchNow() {
        var searchRow = document.querySelector('.mobile-header--v2 .mh-search');
        if (!searchRow) return;
        document.documentElement.style.setProperty('--mh-search-bottom', Math.round(searchRow.getBoundingClientRect().bottom) + 'px');
    }

    var placeScheduled = false;
    function placeSearch() {
        if (placeScheduled) return;
        placeScheduled = true;
        requestAnimationFrame(function () {
            placeScheduled = false;
            placeSearchNow();
        });
    }

    placeSearch();
    window.addEventListener('resize', placeSearch);
})();
