/**
 * Mounts Stripe hosted Checkout in a centered column on our page.
 * The column stays under 992px so Stripe's own layout stays a single
 * column instead of pinning the payment form to the right of a wide page.
 * Card fields stay inside Stripe. We do not rebuild them.
 */
(function () {
    'use strict';

    var STYLE_ID = 'stripe-checkout-frame-style';

    function isStripeCheckoutUrl(url) {
        try {
            var parsed = new URL(url, window.location.href);
            return parsed.protocol === 'https:' && parsed.hostname === 'checkout.stripe.com';
        } catch (e) {
            return false;
        }
    }

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            'body.stripe-checkout-open { overflow: hidden; }',
            '#stripe-checkout-stage {',
            '  position: fixed; inset: 0; z-index: 10000;',
            '  display: flex; justify-content: center;',
            '  background: #fff; overflow: hidden;',
            '}',
            '#stripe-checkout-stage[hidden] { display: none !important; }',
            '.stripe-checkout-column {',
            '  width: min(100%, 480px); height: 100%; margin: 0 auto;',
            '  display: flex; flex-direction: column; background: #fff;',
            '}',
            '.stripe-checkout-back {',
            '  flex: 0 0 auto; align-self: center;',
            '  margin: 16px 0 8px; padding: 0; border: 0; background: none;',
            '  color: #1d1d1f; cursor: pointer;',
            '  font: 400 14px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
            '  text-decoration: underline; text-underline-offset: 3px;',
            '}',
            '#stripe-checkout-mount { flex: 1 1 auto; min-height: 0; width: 100%; }',
            '#stripe-checkout-mount iframe {',
            '  display: block; width: 100%; height: 100%; border: 0; background: #fff;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    function ensureStage() {
        ensureStyle();
        var stage = document.getElementById('stripe-checkout-stage');
        if (stage) return stage;
        stage = document.createElement('div');
        stage.id = 'stripe-checkout-stage';
        stage.hidden = true;
        stage.innerHTML = '<div class="stripe-checkout-column">'
            + '<button type="button" class="stripe-checkout-back" id="stripe-checkout-back">Back</button>'
            + '<div id="stripe-checkout-mount"></div>'
            + '</div>';
        document.body.appendChild(stage);
        document.getElementById('stripe-checkout-back').addEventListener('click', function () {
            window.closeCenteredStripeCheckout();
        });
        return stage;
    }

    function promoteReturn(frame) {
        var href = '';
        try {
            href = frame.contentWindow.location.href;
        } catch (e) {
            return;
        }
        if (!href || href === 'about:blank') return;
        try {
            var parsed = new URL(href);
            var path = parsed.pathname || '';
            if (path.indexOf('payment-success') !== -1 || path.indexOf('payment-cancel') !== -1) {
                window.location.replace(href);
            }
        } catch (e) {}
    }

    window.mountCenteredStripeCheckout = function (url) {
        if (!isStripeCheckoutUrl(url)) {
            window.location.href = url;
            return;
        }
        var stage = ensureStage();
        var mount = document.getElementById('stripe-checkout-mount');
        mount.textContent = '';
        var frame = document.createElement('iframe');
        frame.title = 'Secure payment';
        frame.setAttribute('allow', 'payment *; publickey-credentials-get *');
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.addEventListener('load', function () { promoteReturn(frame); });
        frame.src = url;
        mount.appendChild(frame);
        stage.hidden = false;
        document.body.classList.add('stripe-checkout-open');
    };

    window.closeCenteredStripeCheckout = function () {
        var stage = document.getElementById('stripe-checkout-stage');
        var mount = document.getElementById('stripe-checkout-mount');
        if (mount) mount.textContent = '';
        if (stage) stage.hidden = true;
        document.body.classList.remove('stripe-checkout-open');
    };
})();
