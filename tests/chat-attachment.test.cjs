const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function setup({ failStorage = false } = {}) {
    const uploads = [];
    const context = vm.createContext({ Buffer, URL, process: { env: {} }, console: { error() {} } });
    const sdk = new vm.SyntheticModule(['S3Client', 'PutObjectCommand'], function () {
        this.setExport('S3Client', class {
            async send(command) {
                if (failStorage) throw new Error('Storage unavailable');
                uploads.push(command.input);
            }
        });
        this.setExport('PutObjectCommand', class {
            constructor(input) { this.input = input; }
        });
    }, { context });
    const crypto = new vm.SyntheticModule(['randomUUID'], function () {
        let next = 0;
        this.setExport('randomUUID', () => `test-${++next}`);
    }, { context });
    const module = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, '..', 'api', 'chat-attachment.js'), 'utf8'), { context });
    await module.link(name => name === 'crypto' ? crypto : sdk);
    await module.evaluate();
    async function request(body, options = {}) {
        const res = {
            headers: {},
            setHeader(key, value) { this.headers[key] = value; },
            status(value) { this.statusCode = value; return this; },
            json(value) { this.body = value; return this; },
            end() { return this; }
        };
        await module.namespace.default({
            method: options.method || 'POST',
            headers: { origin: options.origin || 'https://www.brandeduk.com', 'x-forwarded-for': 'test-ip' },
            body
        }, res);
        return res;
    }
    return { request, uploads };
}

test('uploads original bytes with a unique key and downloadable disposition', async () => {
    const { request, uploads } = await setup();
    const body = { filename: 'logo.pdf', data: Buffer.from('%PDF-test').toString('base64') };
    const first = await request(body);
    const second = await request(body);
    assert.equal(first.statusCode, 200);
    assert.equal(first.body.type, 'application/pdf');
    assert.equal(first.body.size, 9);
    assert.notEqual(first.body.url, second.body.url);
    assert.equal(uploads[0].Body.toString(), '%PDF-test');
    assert.match(uploads[0].ContentDisposition, /^attachment;/);
    assert.equal(uploads[0].ACL, 'public-read');
});

test('accepts exactly 3 MB but rejects one additional byte', async () => {
    const { request, uploads } = await setup();
    assert.equal((await request({ filename: 'logo.png', data: Buffer.alloc(3 * 1024 * 1024).toString('base64') })).statusCode, 200);
    assert.equal((await request({ filename: 'logo.png', data: Buffer.alloc(3 * 1024 * 1024 + 1).toString('base64') })).statusCode, 413);
    assert.equal(uploads.length, 1);
});

test('rejects invalid input without uploading', async () => {
    const { request, uploads } = await setup();
    for (const [body, status] of [
        [{}, 400],
        [{ filename: 'file.exe', data: 'YWJj' }, 415],
        [{ filename: 'logo.pdf', data: '' }, 400],
        [{ filename: 'logo.pdf', data: '!!!!' }, 400],
        [{ filename: 'logo.pdf', data: 'YR==' }, 400]
    ]) assert.equal((await request(body)).statusCode, status);
    assert.equal(uploads.length, 0);
});

test('enforces origin, method and preflight handling', async () => {
    const { request, uploads } = await setup();
    assert.equal((await request({}, { origin: 'https://example.com' })).statusCode, 403);
    assert.equal((await request({}, { method: 'GET' })).statusCode, 405);
    const preflight = await request({}, { method: 'OPTIONS', origin: 'http://127.0.0.1:5511' });
    assert.equal(preflight.statusCode, 204);
    assert.equal(preflight.headers['Access-Control-Allow-Origin'], 'http://127.0.0.1:5511');
    assert.equal(uploads.length, 0);
});

test('limits upload requests per client', async () => {
    const { request } = await setup();
    for (let i = 0; i < 10; i++) await request({});
    assert.equal((await request({})).statusCode, 429);
});

test('reports storage failures without a success URL', async () => {
    const { request } = await setup({ failStorage: true });
    const response = await request({ filename: 'logo.pdf', data: 'YWJj' });
    assert.equal(response.statusCode, 500);
    assert.equal(response.body.url, undefined);
    assert.match(response.body.error, /Could not upload/);
});

test('accepts each advertised extension', async () => {
    const { request } = await setup();
    for (const extension of ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf', 'ai', 'eps']) {
        assert.equal((await request({ filename: `logo.${extension}`, data: 'YWJj' })).statusCode, 200);
    }
});
