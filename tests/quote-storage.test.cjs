'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'brandedukv15-child', 'assets', 'js', 'storage', 'quote-storage.js'),
  'utf8'
);

function makeStorage() {
  const data = new Map();
  return {
    get length() { return data.size; },
    key(i) { return Array.from(data.keys())[i] || null; },
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) {
      const next = String(value);
      if (this._quota && next.length > this._quota) {
        const err = new Error('The quota has been exceeded.');
        err.name = 'QuotaExceededError';
        throw err;
      }
      data.set(String(key), next);
    },
    removeItem(key) { data.delete(String(key)); },
    clear() { data.clear(); },
    _quota: 0
  };
}

function loadModule(options) {
  const localStorage = (options && options.localStorage) || makeStorage();
  const uploads = [];
  const context = {
    window: {},
    globalThis: {},
    localStorage,
    indexedDB: undefined,
    navigator: { userAgent: 'node-test' },
    console,
    URL: { createObjectURL() { return 'blob:test'; } },
    atob(value) { return Buffer.from(value, 'base64').toString('binary'); },
    Blob: class Blob {},
    fetch() {
      return Promise.resolve({
        ok: true,
        json: async () => {
          uploads.push(1);
          return { url: 'https://cdn.example/logos/test.png', filename: 'logo.png', size: 12 };
        }
      });
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename: 'quote-storage.js' });
  return { api: context.BrandedQuoteStorage, localStorage, uploads };
}

function tinyPng(label) {
  return `data:image/png;base64,${Buffer.from('LOGO-' + label).toString('base64')}${'A'.repeat(800)}`;
}

async function run() {
  const { api } = loadModule();

  assert.strictEqual(api.isDataUrl(tinyPng('a')), true);
  assert.strictEqual(api.isDataUrl('https://cdn.example/x.png'), false);

  const sameA = tinyPng('shared');
  const slim = api.slimBasket([
    { id: '1', code: 'GD005', size: 'S', logos: [{ position: 'left-chest', logo: sameA }] },
    { id: '2', code: 'GD005', size: 'M', logos: [{ position: 'left-chest', logo: sameA }, { position: 'large-back', logo: sameA }] }
  ]);
  assert.strictEqual(slim.extracted.length >= 1, true);
  const ids = new Set(slim.extracted.map((item) => item.id));
  assert.strictEqual(ids.size, 1, 'same artwork must share one logo id');
  JSON.stringify(slim.basket).includes('data:image') && assert.fail('slim basket still contains data URLs');
  assert.ok(api.isLogoRef(slim.basket[0].logos[0].logo));
  assert.strictEqual(
    await api.getQuoteFile(slim.basket[0].logos[0].logo, slim.basket[0].logos[0].logoId),
    sameA,
    'quote submission must recover artwork bytes from a bklogo reference'
  );

  const saved = api.saveBasket([
    { id: '1', code: 'GD005', logos: [{ position: 'left-chest', logo: tinyPng('save') }] }
  ]);
  assert.strictEqual(saved.ok, true);

  const quotaStore = makeStorage();
  quotaStore.setItem('keep-auth', 'token');
  quotaStore._quota = 4000;
  const nearFull = loadModule({ localStorage: quotaStore });
  const huge = `data:image/png;base64,${'B'.repeat(12000)}`;
  const result = nearFull.api.saveBasket([
    { id: 'legacy', logos: [{ position: 'left-chest', logo: huge, method: 'print' }], texts: [] }
  ]);
  assert.strictEqual(result.ok, true, 'save must succeed when localStorage is nearly full');
  const stored = quotaStore.getItem('quoteBasket');
  assert.ok(stored.indexOf('data:image') === -1, 'persisted basket must not contain Base64');
  assert.strictEqual(quotaStore.getItem('keep-auth'), 'token', 'auth keys must not be cleared');

  const quota = api.classifyError({ name: 'QuotaExceededError', message: 'exceeded' }, 'save_basket');
  assert.strictEqual(quota.category, 'quota_exceeded');
  assert.ok(!/Storage full! Please complete your quote or remove items/i.test(quota.customerMessage));

  const network = api.classifyError({ message: 'Failed to fetch' }, 'upload_logo');
  assert.strictEqual(network.category, 'network_timeout');

  const tooBig = api.classifyError({ status: 413, message: 'Image too large (max 5MB)' }, 'upload_logo');
  assert.strictEqual(tooBig.category, 'file_too_large');

  const pcLogo = tinyPng('pc-order');
  const pcBasket = ['S', 'M', 'L'].map((size) => ({
    id: 'gd005-off-white-' + size.toLowerCase(),
    code: 'GD005',
    name: 'Heavy Cotton adult t-shirt',
    color: 'Off White',
    size: size,
    qty: size === 'S' ? 3 : 2,
    logos: [{
      method: 'print',
      position: 'left-chest',
      positionLabel: 'Left Chest',
      logo: pcLogo
    }]
  }));
  const pcStore = makeStorage();
  const pcMod = loadModule({ localStorage: pcStore });
  assert.strictEqual(pcMod.api.saveBasket(pcBasket).ok, true);
  const pcJson = pcStore.getItem('quoteBasket');
  assert.ok(pcJson.indexOf('data:image') === -1, 'PC order popup must not persist Base64 logos');
  const pcParsed = JSON.parse(pcJson);
  assert.strictEqual(pcParsed.length, 3);
  assert.strictEqual(pcParsed[0].logos[0].logo, pcParsed[2].logos[0].logo);

  // Reusing the same artwork on a second item must not erase the first item's
  // logo or preview when callers rebuild hydrated logo objects without logoId.
  const reuseStore = makeStorage();
  const reuse = loadModule({ localStorage: reuseStore });
  const reusedLogo = tinyPng('reused');
  reuse.api.saveBasket([{ id: 'tee', logos: [{ position: 'left-chest', logo: reusedLogo }], designPreview: { logoImage: reusedLogo } }]);
  const reloaded = reuse.api.loadBasket();
  assert.ok(reloaded[0].logos[0].logo.startsWith('blob:'), 'hydrated logos resolve to blob URLs');
  reloaded[0].logos = reloaded[0].logos.map((logo) => ({ position: logo.position, logo: logo.logo }));
  reloaded[0].designPreview = { logoImage: reloaded[0].designPreview.logoImage };
  reloaded.push({ id: 'bag', logos: [{ position: 'centre-front', logo: reusedLogo }] });
  assert.strictEqual(reuse.api.saveBasket(reloaded).ok, true);
  const reusedRef = reuse.api.refFor(reuse.api.fingerprint(reusedLogo));
  const reusedSaved = JSON.parse(reuseStore.getItem('quoteBasket'));
  assert.strictEqual(reusedSaved[0].logos[0].logo, reusedRef, 'first item must keep its logo');
  assert.strictEqual(reusedSaved[0].designPreview.logoImage, reusedRef, 'first item must keep its preview');
  assert.strictEqual(reusedSaved[1].logos[0].logo, reusedRef);

  const staleStore = makeStorage();
  loadModule({ localStorage: staleStore }).api.saveBasket([
    { id: 'stale', logos: [{ position: 'left-chest', logo: 'blob:http://127.0.0.1/unknown' }] }
  ]);
  assert.strictEqual(JSON.parse(staleStore.getItem('quoteBasket'))[0].logos[0].logo, '', 'unknown blob URLs are never stored');

  console.log('quote-storage unit tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
