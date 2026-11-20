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
 *   node scripts/dev-server.js
 *   DEV_PORT=5522 node scripts/dev-server.js
 *   → http://127.0.0.1:<port>/shop-pc.html
 *
 * Windows Node does not trust the same roots as the OS. Without the system
 * CA store, every /__api call dies with
 * "unable to verify the first certificate" (HTTP 502) even though the API is up.
 *
 * Permanent API fix (DigitalOcean App Platform env):
 *   CORS_ORIGIN=https://www.brandeduk.com,https://brandeduk.com,http://127.0.0.1:5510,http://localhost:5510
 * Then Live Server can hit the live API directly (set window.API_USE_LOCAL_PROXY = false).
 */
'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
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
    '.avif': 'image/avif',
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

function upstreamAgent() {
    const options = { keepAlive: true };
    if (typeof tls.getCACertificates === 'function') {
        try {
            const bundled = tls.getCACertificates('default') || [];
            const system = tls.getCACertificates('system') || [];
            const merged = bundled.concat(system).filter(Boolean);
            if (merged.length) options.ca = merged;
        } catch (err) {
            console.warn('System CA store unavailable:', err.message);
        }
    }
    return new https.Agent(options);
}

const API_AGENT = upstreamAgent();

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
        headers,
        agent: API_AGENT
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

function isPhoneUa(userAgent) {
    const ua = String(userAgent || '').toLowerCase();
    const isIPad = ua.indexOf('ipad') !== -1;
    const isIPhone = ua.indexOf('iphone') !== -1 || ua.indexOf('ipod') !== -1;
    const isAndroid = ua.indexOf('android') !== -1;
    const isAndroidTablet = isAndroid && ua.indexOf('mobile') === -1;
    const isTablet = isIPad || isAndroidTablet || ua.indexOf('tablet') !== -1 || ua.indexOf('silk') !== -1;
    if (isTablet) return false;
    if (isIPhone) return true;
    if (isAndroid && ua.indexOf('mobile') !== -1) return true;
    return false;
}

function wantsMobile(req, requestUrl) {
    const force = (requestUrl.searchParams.get('force') || '').toLowerCase();
    const phone = isPhoneUa(req.headers['user-agent']);
    if (phone) return true;
    return force === 'mobile';
}

function serveStatic(req, res) {
    const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);
    const urlPath = decodeURIComponent(requestUrl.pathname);
    const homeAliases = {
        '/home': 1, '/home/': 1, '/home-pc': 1, '/home-pc/': 1, '/home-pc.html': 1,
        '/index-mobile': 1, '/index-mobile/': 1, '/index-mobile.html': 1,
        '/m': 1, '/m/': 1, '/index.html': 1
    };
    if (homeAliases[urlPath]) {
        send(res, 301, { Location: '/' + requestUrl.search }, '');
        return;
    }
    if (urlPath==='/__preview/leave') {
        send(res,303,{'Set-Cookie':'buk_prechat_preview=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict',Location:'/?force=mobile'},'');
        return;
    }
    const previewFiles = {
        '/__preview/prechat': 'scripts/prechat-preview/mobile.html',
        '/__preview/prechat-adapter.js': 'scripts/prechat-preview/adapter.js'
    };
    if (previewFiles[urlPath]) {
        const file = path.join(ROOT,previewFiles[urlPath]);
        const headers={'Content-Type':contentType(file),'Cache-Control':'no-store'};
        if(urlPath==='/__preview/prechat')headers['Set-Cookie']='buk_prechat_preview=1; Path=/; HttpOnly; SameSite=Strict';
        send(res,200,headers,fs.readFileSync(file));
        return;
    }
    let internalPath = urlPath;
    if (urlPath === '/' || urlPath === '') {
        internalPath = wantsMobile(req, requestUrl) ? '/index-mobile.html' : '/home-pc.html';
    } else {
        const productMatch = urlPath.match(/^\/product\/([^/]+)\/?$/);
        if (productMatch) {
            internalPath = wantsMobile(req, requestUrl) ? '/mobile/customize-mobile.html' : '/shop-pc.html';
        }
    }
    let filePath = safeJoin(ROOT, internalPath);
    if (!filePath) {
        send(res, 403, { 'Content-Type': 'text/plain' }, 'Forbidden');
        return;
    }

    fs.stat(filePath, (err, stat) => {
        if (!err && stat.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        fs.readFile(filePath, (readErr, data) => {
            if (readErr && !internalPath.endsWith('.html')) {
                const htmlPath = safeJoin(ROOT, internalPath + '.html');
                if (!htmlPath) {
                    send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found: ' + urlPath);
                    return;
                }
                fs.readFile(htmlPath, (htmlErr, htmlData) => {
                    if (htmlErr) {
                        send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found: ' + urlPath);
                        return;
                    }
                    sendHtml(htmlPath, htmlData);
                });
                return;
            }
            if (readErr) {
                send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found: ' + urlPath);
                return;
            }
            sendHtml(filePath, data);
        });

        function sendHtml(servedPath, data) {
            // Explicit local review mode; never included in production HTML.
            // Load before storefront scripts so no real Crisp SDK can initialise.
            const preview=requestUrl.searchParams.get('prechat-preview')==='1'||/(?:^|;\s*)buk_prechat_preview=1(?:;|$)/.test(req.headers.cookie||'');
            if (preview && path.extname(servedPath)==='.html') {
                data=Buffer.from(data.toString().replace(/<head([^>]*)>/i,'<head$1><script src="/__preview/prechat-adapter.js"></script>'));
            }
            send(res, 200, { 'Content-Type': contentType(servedPath), 'Cache-Control':'no-store' }, data);
        }
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
