/**
 * Local static server + same-origin API proxy.
 *
 * Why: api.brandeduk.com CORS allow-list is production-only
 * (https://www.brandeduk.com, https://brandeduk.com). Browser fetches from
 * http://127.0.0.1:5510 get HTTP 403 → shop shows 0 products.
 *
 * This server proxies /__api/* → https://api.brandeduk.com/* without forwarding
 * the browser Origin header, so local shop works like production.
 *
 * Usage:
 *   npm run dev
 *   → http://127.0.0.1:5510/shop-pc.html
 *
 * Permanent API fix (DigitalOcean App Platform env):
 *   CORS_ORIGIN=https://www.brandeduk.com,https://brandeduk.com,http://127.0.0.1:5510,http://localhost:5510
 * Then Live Server can hit the live API directly (set window.API_USE_LOCAL_PROXY = false).
 */
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.DEV_PORT || 5510);
const HOST = process.env.DEV_HOST || '127.0.0.1';
const API_UPSTREAM = (process.env.BRANDED_API_UPSTREAM || 'https://api.brandeduk.com').replace(/\/+$/, '');
const PROXY_PREFIX = '/__api';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.map': 'application/json',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};

function contentType(filePath) {
    return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function send(res, status, headers, body) {
    res.writeHead(status, headers);
    res.end(body);
}

function proxyApi(req, res) {
    const incoming = new URL(req.url, `http://${HOST}:${PORT}`);
    const upstreamPath = incoming.pathname.slice(PROXY_PREFIX.length) || '/';
    const target = new URL(upstreamPath + incoming.search, API_UPSTREAM + '/');

    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
        const lower = key.toLowerCase();
        // Drop hop-by-hop / browser-origin headers that trigger API 403 allow-list.
        if (lower === 'host' || lower === 'origin' || lower === 'referer' ||
            lower === 'connection' || lower === 'content-length') {
            continue;
        }
        headers[key] = value;
    }
    headers.host = target.host;
    // Present as production storefront so credentialed CORS middleware accepts the request.
    headers.origin = 'https://www.brandeduk.com';
    headers.referer = 'https://www.brandeduk.com/';

    const upstreamReq = https.request(target, {
        method: req.method,
        headers
    }, (upstreamRes) => {
        const outHeaders = { ...upstreamRes.headers };
        // Same-origin to the browser — no CORS dance needed.
        delete outHeaders['access-control-allow-origin'];
        delete outHeaders['access-control-allow-credentials'];
        delete outHeaders['access-control-allow-methods'];
        delete outHeaders['access-control-allow-headers'];
        res.writeHead(upstreamRes.statusCode || 502, outHeaders);
        upstreamRes.pipe(res);
    });

    upstreamReq.on('error', (err) => {
        send(res, 502, { 'Content-Type': 'application/json' },
            JSON.stringify({ error: 'API proxy failed', message: err.message }));
    });

    if (req.method === 'GET' || req.method === 'HEAD') {
        upstreamReq.end();
    } else {
        req.pipe(upstreamReq);
    }
}

function safeJoin(root, requestPath) {
    const decoded = decodeURIComponent(requestPath.split('?')[0]);
    const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
    const full = path.join(root, normalized);
    if (!full.startsWith(root)) return null;
    return full;
}

function serveStatic(req, res) {
    const urlPath = decodeURIComponent(new URL(req.url, `http://${HOST}:${PORT}`).pathname);
    let filePath = safeJoin(ROOT, urlPath === '/' ? '/index.html' : urlPath);
    if (!filePath) {
        send(res, 403, { 'Content-Type': 'text/plain' }, 'Forbidden');
        return;
    }

    fs.stat(filePath, (err, stat) => {
        if (!err && stat.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        fs.readFile(filePath, (readErr, data) => {
            if (readErr) {
                send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found: ' + urlPath);
                return;
            }
            send(res, 200, { 'Content-Type': contentType(filePath) }, data);
        });
    });
}

const server = http.createServer((req, res) => {
    if (!req.url) {
        send(res, 400, { 'Content-Type': 'text/plain' }, 'Bad request');
        return;
    }

    if (req.url === PROXY_PREFIX || req.url.startsWith(PROXY_PREFIX + '/') ||
        req.url.startsWith(PROXY_PREFIX + '?')) {
        if (req.method === 'OPTIONS') {
            send(res, 204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
                'Access-Control-Max-Age': '86400'
            });
            return;
        }
        proxyApi(req, res);
        return;
    }

    serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
    console.log(`BrandedUK local dev: http://${HOST}:${PORT}/`);
    console.log(`API proxy:           http://${HOST}:${PORT}${PROXY_PREFIX} → ${API_UPSTREAM}`);
    console.log(`Shop:                http://${HOST}:${PORT}/shop-pc.html`);
    console.log('');
    console.log('Stop Live Server on this port first if it is already running.');
});
