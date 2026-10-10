/**
 * Fixed delivery charge and minimum order rules shared by basket and checkout.
 * Delivery price is VAT inclusive; everything is worked in pence so
 * total ex VAT + VAT always equals total inc VAT exactly.
 */
(function () {
    'use strict';

    var DELIVERY_GBP_INC_VAT = 7.95;
    var VAT_PERCENT = 20;
    var MIN_ORDER_GOODS_EX_VAT = 50;
    var EMBROIDERY_MIN_PIECES = 8;

    function toPence(value) {
        var n = parseFloat(value);
        return isFinite(n) ? Math.round((n + Number.EPSILON) * 100) : 0;
    }

    function fromPence(pence) {
        return pence / 100;
    }

    /**
     * goodsExVat: products + logos + setup fees, ex VAT.
     * itemCount: number of pieces; an empty basket gets no delivery.
     */
    function brandedOrderTotals(goodsExVat, itemCount) {
        var goodsExP = toPence(goodsExVat);
        var goodsVatP = Math.round(goodsExP * VAT_PERCENT / 100);
        var hasItems = Number(itemCount) > 0 || goodsExP > 0;
        var deliveryIncP = hasItems ? toPence(DELIVERY_GBP_INC_VAT) : 0;
        var deliveryVatP = Math.round(deliveryIncP * VAT_PERCENT / (100 + VAT_PERCENT));
        var deliveryExP = deliveryIncP - deliveryVatP;

        return {
            goodsExVat: fromPence(goodsExP),
            goodsVatAmount: fromPence(goodsVatP),
            goodsIncVat: fromPence(goodsExP + goodsVatP),
            deliveryIncVat: fromPence(deliveryIncP),
            deliveryExVat: fromPence(deliveryExP),
            deliveryVatAmount: fromPence(deliveryVatP),
            totalExVat: fromPence(goodsExP + deliveryExP),
            vatAmount: fromPence(goodsVatP + deliveryVatP),
            totalIncVat: fromPence(goodsExP + goodsVatP + deliveryIncP)
        };
    }

    function isEmbroideryMethod(method) {
        var key = String(method || '').toLowerCase();
        return key === 'embroidery' || key === 'embroidery-voa';
    }

    function lineQty(item) {
        var n = parseFloat(item && (item.qty || item.quantity || item.totalQty));
        return isFinite(n) && n > 0 ? n : 0;
    }

    /**
     * Decoration methods on one basket line. Mirrors the basket's logo
     * extraction: positions[] wins over positionDesigns over logos[] for the
     * same position, and a logo with no method is priced as embroidery.
     */
    function lineDecorationMethods(item) {
        var methods = [];
        var seenPos = {};
        var methodByPos = {};
        if (!item || typeof item !== 'object') return methods;

        if (Array.isArray(item.positions)) {
            item.positions.forEach(function (p) {
                if (p && p.position && p.method) methodByPos[p.position] = String(p.method).toLowerCase();
            });
        }

        function add(pos, entry) {
            if (!entry || !(entry.logo || entry.logoData)) return;
            if (pos) {
                if (seenPos[pos]) return;
                seenPos[pos] = true;
            }
            methods.push(String(entry.method || methodByPos[pos] || 'embroidery').toLowerCase());
        }

        if (Array.isArray(item.positions)) {
            item.positions.forEach(function (p) { add(p && p.position, p); });
        }
        if (item.positionDesigns && typeof item.positionDesigns === 'object') {
            Object.keys(item.positionDesigns).forEach(function (pos) { add(pos, item.positionDesigns[pos]); });
        }
        var flat = Array.isArray(item.logos) && item.logos.length
            ? item.logos
            : (Array.isArray(item.customizations) ? item.customizations : []);
        flat.forEach(function (l) { add(l && l.position, l); });

        (Array.isArray(item.texts) ? item.texts : []).forEach(function (t) {
            if (t && String(t.text || '').trim()) methods.push(String(t.method || 'print').toLowerCase());
        });

        return methods;
    }

    /**
     * Embroidery present: at least EMBROIDERY_MIN_PIECES embroidered garments
     * (that alone puts the invoice well above the value minimum).
     * No embroidery: goods (ex VAT, delivery excluded) of at least
     * MIN_ORDER_GOODS_EX_VAT.
     */
    function brandedCheckOrderRules(basket, goodsExVat) {
        var items = Array.isArray(basket) ? basket : [];
        var embroideredQty = 0;
        var hasPrint = false;

        items.forEach(function (item) {
            var methods = lineDecorationMethods(item);
            if (methods.some(isEmbroideryMethod)) embroideredQty += lineQty(item);
            if (methods.some(function (m) { return !isEmbroideryMethod(m); })) hasPrint = true;
        });

        var goodsP = toPence(goodsExVat);
        var minP = toPence(MIN_ORDER_GOODS_EX_VAT);
        var result = {
            ok: true,
            rule: '',
            message: '',
            hasEmbroidery: embroideredQty > 0,
            hasPrint: hasPrint,
            embroideredQty: embroideredQty,
            embroideryMinPieces: EMBROIDERY_MIN_PIECES,
            piecesShort: 0,
            goodsExVat: fromPence(goodsP),
            minGoodsExVat: MIN_ORDER_GOODS_EX_VAT,
            shortfallExVat: 0
        };

        if (!items.length) return result;

        if (embroideredQty > 0) {
            if (embroideredQty < EMBROIDERY_MIN_PIECES) {
                var short = Math.ceil(EMBROIDERY_MIN_PIECES - embroideredQty);
                result.ok = false;
                result.rule = 'embroidery';
                result.piecesShort = short;
                result.message = 'Embroidery has a minimum of ' + EMBROIDERY_MIN_PIECES + ' pieces. Add ' +
                    short + ' more embroidered piece' + (short === 1 ? '' : 's') + ' to continue.';
            }
        } else if (goodsP < minP) {
            result.ok = false;
            result.rule = 'value';
            result.shortfallExVat = fromPence(minP - goodsP);
            result.message = 'Minimum order' + (hasPrint ? ' for printed items' : '') + ' is \u00A3' +
                MIN_ORDER_GOODS_EX_VAT + ' + VAT (delivery not included). Add \u00A3' +
                result.shortfallExVat.toFixed(2) + ' more to continue.';
        }

        return result;
    }

    window.DELIVERY_GBP_INC_VAT = DELIVERY_GBP_INC_VAT;
    window.BRANDED_MIN_ORDER_EX_VAT = MIN_ORDER_GOODS_EX_VAT;
    window.BRANDED_EMBROIDERY_MIN_PIECES = EMBROIDERY_MIN_PIECES;
    window.brandedOrderTotals = brandedOrderTotals;
    window.brandedCheckOrderRules = brandedCheckOrderRules;
})();
