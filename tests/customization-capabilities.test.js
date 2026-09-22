'use strict';

const assert = require('node:assert/strict');
const {
    resolveDecorationStatus,
    resolveAllDecorationMethods,
} = require('../server/customization/resolve-decoration-status');

function status(input, options) {
    return resolveDecorationStatus(input, options).status;
}

assert.equal(status({
    productType: 'heavy_premium_tshirt',
    position: 'left_chest',
    method: 'dtf',
}), 'AVAILABLE');

assert.equal(status({
    productType: 'cotton_tshirt',
    position: 'left_chest',
    method: 'embroidery',
}), 'POA');

assert.equal(status({
    productType: 'heavy_premium_tshirt',
    position: 'large_back',
    method: 'embroidery',
}), 'POA');

assert.equal(status({
    productType: 'beanie',
    position: 'cap_front',
    method: 'screen_print',
}), 'HIDDEN');

assert.equal(status({
    productType: 'unknown_product',
    position: 'unknown_position',
    method: 'dtf',
}), 'POA');

assert.equal(status({
    productType: 'heavy-premium-tshirt',
    position: 'left chest',
    method: 'screen',
}), 'HIDDEN');

assert.equal(status({
    sku: 'example-sku-001',
    productType: 'heavy_premium_tshirt',
    position: 'large_back',
    method: 'screen_print',
}, {
    skuOverrides: {
        'EXAMPLE-SKU-001': {
            positions: {
                large_back: { screen_print: 'UNAVAILABLE' },
            },
        },
    },
}), 'HIDDEN');

const capMethods = resolveAllDecorationMethods({
    productType: 'baseball_cap',
    position: 'cap_front',
});
assert.equal(capMethods.methods.embroidery.status, 'AVAILABLE');
assert.equal(capMethods.methods.dtf.status, 'POA');
assert.equal(capMethods.methods.screen_print.status, 'HIDDEN');
assert.equal(capMethods.methods.screen_print.visible, false);
assert.deepEqual(capMethods.methods.screen_print.alternatives, [
    { method: 'embroidery', label: 'Embroidery', status: 'AVAILABLE' },
]);

assert.throws(() => resolveDecorationStatus({
    productType: 'cotton_tshirt',
    position: 'left_chest',
    method: 'vinyl',
}), /Unknown decoration method/);

console.log('Customization capability tests passed');
