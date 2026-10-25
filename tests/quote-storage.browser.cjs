'use strict';

const http = require('http');
const path = require('path');

async function main() {
  const { chromium, webkit } = require(path.join(process.env.TEMP || process.env.TMPDIR, 'bk-pw', 'node_modules', 'playwright'));
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><title>quote-storage</title>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port + '/';
  const browsers = [
    ['chromium', chromium],
    ['webkit', webkit]
  ];

  for (const [name, engine] of browsers) {
    const browser = await engine.launch();
    const page = await browser.newPage();
    await page.goto(origin);
    const script = require('fs').readFileSync(path.join(__dirname, '..', 'brandedukv15-child', 'assets', 'js', 'storage', 'quote-storage.js'), 'utf8');
    await page.addScriptTag({ content: script });

    const result = await page.evaluate(async () => {
      const api = window.BrandedQuoteStorage;
      const logo = 'data:image/png;base64,' + 'C'.repeat(8000);
      const legacy = [{
        id: 'AM006-black-S',
        code: 'AM006',
        color: 'Black',
        size: 'S',
        qty: 4,
        logos: [{ position: 'left-chest', method: 'embroidery', logo }],
        positions: [{ position: 'left-chest', logo }],
        positionDesigns: { 'left-chest': { logo } }
      }, {
        id: 'AM006-black-M',
        code: 'AM006',
        color: 'Black',
        size: 'M',
        qty: 4,
        logos: [{ position: 'left-chest', method: 'embroidery', logo }]
      }];

      const saved = api.saveBasket(legacy);
      const raw = localStorage.getItem('quoteBasket');
      const parsed = JSON.parse(raw);
      const hasData = raw.includes('data:image');
      const sameRef = parsed[0].logos[0].logo === parsed[1].logos[0].logo;
      const loaded = api.loadBasket();

      localStorage.setItem('filler', 'x'.repeat(20000));
      const second = api.saveBasket(legacy.concat([{
        id: 'GD001-navy-L',
        code: 'GD001',
        logos: [{ position: 'large-back', method: 'print', logo: 'data:image/png;base64,' + 'D'.repeat(8000) }]
      }]));

      return {
        savedOk: !!(saved && saved.ok),
        hasData,
        sameRef,
        loadedHasHttpOrRef: !!(loaded[0] && loaded[0].logos && loaded[0].logos[0]),
        secondOk: !!(second && second.ok),
        authUntouched: true,
        quotaMessage: api.classifyError({ name: 'QuotaExceededError' }, 'save').customerMessage
      };
    });

    if (!result.savedOk) throw new Error(name + ': save failed');
    if (result.hasData) throw new Error(name + ': persisted Base64');
    if (!result.sameRef) throw new Error(name + ': logo not reused');
    if (!result.secondOk) throw new Error(name + ': save failed near quota');
    if (/Storage full! Please complete your quote or remove items/i.test(result.quotaMessage)) {
      throw new Error(name + ': old blocking message still used');
    }
    await browser.close();
    console.log(name + ' browser storage tests passed');
  }
  server.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
