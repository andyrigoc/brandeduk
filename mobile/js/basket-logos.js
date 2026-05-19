/**
 * Mobile-only: canonical logo list per basket row.
 * One logo per position — positions[] wins over positionDesigns (avoids Print+Embroidery dupes).
 */
(function (global) {
    'use strict';

    var PRINT_PRICE = 3.5;
    var EMB_PRICE = 5;

    function buildMethodByPos(item) {
        var map = {};
        if (Array.isArray(item.positions)) {
            item.positions.forEach(function (p) {
                if (p && p.position && p.method) {
                    map[p.position] = String(p.method).toLowerCase();
                }
            });
        }
        return map;
    }

    function unitPriceForMethod(method, fallback) {
        if (fallback != null && !isNaN(fallback)) return Number(fallback);
        return method === 'print' ? PRINT_PRICE : EMB_PRICE;
    }

    /**
     * @param {object} item - basket row
     * @param {{ labelFn?: function(string, object): string }} [options]
     * @returns {Array<{position, positionLabel, method, logo, unitPrice}>}
     */
    function collectFromItem(item, options) {
        if (!item) return [];
        var logos = [];
        var seenPos = {};
        var methodByPos = buildMethodByPos(item);
        var labelFn = (options && options.labelFn) || function (pos, entry) {
            return entry.positionLabel || entry.name || pos;
        };

        function push(entry) {
            var pos = entry.position || '';
            if (!pos || !entry.logo || seenPos[pos]) return;
            var method = (entry.method || methodByPos[pos] || 'embroidery').toLowerCase();
            seenPos[pos] = true;
            logos.push({
                position: pos,
                positionLabel: labelFn(pos, entry),
                method: method,
                logo: entry.logo,
                unitPrice: unitPriceForMethod(method, entry.unitPrice)
            });
        }

        if (Array.isArray(item.positions)) {
            item.positions.forEach(function (p) {
                if (!p || !p.logo) return;
                push({
                    position: p.position || '',
                    positionLabel: p.positionLabel || p.name,
                    method: p.method || methodByPos[p.position],
                    logo: p.logo,
                    unitPrice: p.unitPrice
                });
            });
        }

        if (item.positionDesigns && typeof item.positionDesigns === 'object') {
            Object.keys(item.positionDesigns).forEach(function (posKey) {
                var d = item.positionDesigns[posKey];
                if (!d || !d.logo || seenPos[posKey]) return;
                var method = (d.method || methodByPos[posKey] || 'embroidery').toLowerCase();
                push({
                    position: posKey,
                    positionLabel: d.positionLabel || d.name || d.position,
                    method: method,
                    logo: d.logo,
                    unitPrice: d.unitPrice
                });
            });
        }

        if (Array.isArray(item.logos)) {
            item.logos.forEach(function (l) {
                if (!l || !l.logo) return;
                push({
                    position: l.position || '',
                    positionLabel: l.positionLabel,
                    method: l.method || methodByPos[l.position],
                    logo: l.logo,
                    unitPrice: l.unitPrice
                });
            });
        }

        return logos;
    }

    function syncItemLogos(item, options) {
        var logos = collectFromItem(item, options);
        if (logos.length > 0) {
            item.logos = logos;
            if (item.pendingLogoPrompt) delete item.pendingLogoPrompt;
        }
        return logos;
    }

    function normalizeBasket(basket, options) {
        if (!Array.isArray(basket)) return basket;
        basket.forEach(function (item) {
            syncItemLogos(item, options);
        });
        return basket;
    }

    function enrichPositionDesigns(positionDesigns, positionMethods) {
        var designs = positionDesigns ? JSON.parse(JSON.stringify(positionDesigns)) : {};
        Object.keys(designs).forEach(function (pos) {
            var d = designs[pos];
            if (!d) return;
            var m = (positionMethods && positionMethods[pos]) || d.method;
            if (m) d.method = String(m).toLowerCase();
        });
        return designs;
    }

    global.BrandedBasketLogos = {
        collectFromItem: collectFromItem,
        syncItemLogos: syncItemLogos,
        normalizeBasket: normalizeBasket,
        enrichPositionDesigns: enrichPositionDesigns,
        PRINT_PRICE: PRINT_PRICE,
        EMB_PRICE: EMB_PRICE
    };
})(typeof window !== 'undefined' ? window : globalThis);
