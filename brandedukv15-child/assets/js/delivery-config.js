/**
 * Fixed delivery charge shared by basket and checkout totals.
 * Delivery price is VAT inclusive; everything is worked in pence so
 * total ex VAT + VAT always equals total inc VAT exactly.
 */
(function () {
    'use strict';

    var DELIVERY_GBP_INC_VAT = 7.95;
    var VAT_PERCENT = 20;

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

    window.DELIVERY_GBP_INC_VAT = DELIVERY_GBP_INC_VAT;
    window.brandedOrderTotals = brandedOrderTotals;
})();
