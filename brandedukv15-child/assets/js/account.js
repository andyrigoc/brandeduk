window.BrandedAccount = (function () {
    'use strict';

    function isLocalHost() {
        return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    }

    function apiBaseUrl() {
        if (typeof window.resolveBrandedApiBase === 'function') {
            return window.resolveBrandedApiBase();
        }
        return (window.API_BASE_URL || 'https://api.brandeduk.com').replace(/\/+$/, '');
    }

    function token() {
        return localStorage.getItem('authToken') || localStorage.getItem('coAuthToken') || '';
    }

    function authHeaders(extraHeaders) {
        var headers = Object.assign({}, extraHeaders || {});
        var jwt = token();
        if (jwt) headers.Authorization = 'Bearer ' + jwt;
        return headers;
    }

    function pageHref(name) {
        var routes = {
            basket: isLocalHost() ? '/basket.html' : '/basket',
            checkout: isLocalHost() ? '/checkout.html' : '/checkout',
            home: isLocalHost() ? '/home-pc.html' : '/',
            profile: isLocalHost() ? '/profile.html' : '/profile',
            orders: isLocalHost() ? '/orders.html' : '/orders',
            orderDetail: isLocalHost() ? '/order-detail.html' : '/order-detail',
            trackOrder: isLocalHost() ? '/track-order.html' : '/track-order',
        };
        return routes[name] || '/';
    }

    function clearSession() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('coAuthToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('coUser');
        document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax';
    }

    function number(value, fallback) {
        var parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function orderItems(order) {
        return Array.isArray(order && order.items) ? order.items : [];
    }

    function itemQuantity(item) {
        var qty = parseInt(item && (item.quantity || item.qty || item.totalQty || item.totalQuantity), 10);
        return Number.isFinite(qty) && qty > 0 ? qty : 1;
    }

    function itemName(item) {
        return (item && (item.productName || item.name || item.title || item.code)) || 'Product';
    }

    function itemImage(item) {
        if (!item) return '';
        return item.image || item.imageUrl || item.thumbnail || item.primaryImage || '';
    }

    function orderItemToBasketItem(item, index) {
        var qty = itemQuantity(item);
        var unitPrice = number(item && (item.unitPrice || item.price), 0);
        var total = number(item && (item.total || item.itemTotal), unitPrice * qty);
        return {
            id: (item && (item.id || item.code || item.productCode)) || ('reorder-' + Date.now() + '-' + index),
            code: (item && (item.code || item.productCode)) || '',
            productCode: (item && (item.productCode || item.code)) || '',
            name: itemName(item),
            productName: itemName(item),
            selectedColorName: (item && (item.selectedColorName || item.colorName || item.color)) || '',
            color: (item && (item.color || item.selectedColorName || item.colorName)) || '',
            qty: qty,
            quantity: qty,
            totalQty: qty,
            unitPrice: unitPrice,
            price: unitPrice,
            itemTotal: total,
            total: total,
            image: itemImage(item),
            imageUrl: itemImage(item),
            sizes: (item && (item.sizes || item.sizeBreakdown)) || null,
            size: (item && item.size) || '',
            reorder: true,
        };
    }

    function saveOrderToBasket(order) {
        var basket = orderItems(order).map(orderItemToBasketItem).filter(Boolean);
        if (!basket.length) {
            throw new Error('This order has no items to reorder.');
        }
        if (window.BrandedCart && typeof window.BrandedCart.save === 'function') {
            window.BrandedCart.save(basket);
        } else {
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
            try {
                window.dispatchEvent(new CustomEvent('basketUpdated'));
            } catch (e) {
                var evt = document.createEvent('Event');
                evt.initEvent('basketUpdated', true, true);
                window.dispatchEvent(evt);
            }
        }
        sessionStorage.setItem('reorderNotice', 'We added your previous order to your basket. Please review sizes, artwork, quantities, and totals before checkout.');
        return basket.length;
    }

    async function request(path, options) {
        var response = await fetch(apiBaseUrl() + path, options || {});
        var json = await response.json().catch(function () { return {}; });
        if (!response.ok || json.success === false) {
            throw new Error(json.message || json.error || ('Request failed: ' + response.status));
        }
        return json;
    }

    return {
        apiBaseUrl: apiBaseUrl,
        authHeaders: authHeaders,
        clearSession: clearSession,
        isLocalHost: isLocalHost,
        pageHref: pageHref,
        request: request,
        saveOrderToBasket: saveOrderToBasket,
        token: token,
    };
})();
