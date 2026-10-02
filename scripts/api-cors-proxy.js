/**
 * CORS bridge for local Live Server → live API.
 *
 * api.brandeduk.com returns 403 for Origin http://127.0.0.1:* / localhost:*
 * (CORS_ORIGIN allow-list is production-only after Guardian hardening).
 *
 * This process fetches the API server-side (no browser Origin) and re-emits
 * Access-Control-Allow-Origin for local frontends.
 *
 *   npm run api-proxy
 *   → http://127.0.0.1:3005/api/products?limit=1
 *
 * Keep Live Server on 5510; api-config.js points localhost at this proxy.
 */
'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = Number(process.env.API_PROXY_PORT || 3005);
const HOST = process.env.API_PROXY_HOST || '127.0.0.1';
const API_UPSTREAM = (process.env.BRANDED_API_UPSTREAM || 'https://api.brandeduk.com').replace(/\/+$/, '');

function isLocalDevOrigin(origin) {
    if (!origin) return false;
    try {
        const u = new URL(origin);
        return u.protocol === 'http:' &&
            (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '[::1]');
    } catch (_) {
        return false;
    }
}

function corsHeaders(req) {
    const origin = req.headers.origin || '';
    const allow = isLocalDevOrigin(origin) ? origin : 'http://127.0.0.1:5510';
    return {
        'Access-Control-Allow-Origin': allow,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
    };
}

function proxy(req, res) {
    const incoming = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    const target = new URL(incoming.pathname + incoming.search, API_UPSTREAM + '/');

    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
        const lower = key.toLowerCase();
        if (lower === 'host' || lower === 'origin' || lower === 'referer' ||
            lower === 'connection' || lower === 'content-length') {
            continue;
        }
        headers[key] = value;
    }
    headers.host = target.host;
    headers.origin = 'https://www.brandeduk.com';
    headers.referer = 'https://www.brandeduk.com/';

    const upstreamReq = https.request(target, {
        method: req.method,
        headers
    }, (upstreamRes) => {
        const out = { ...corsHeaders(req) };
        for (const [key, value] of Object.entries(upstreamRes.headers)) {
            const lower = key.toLowerCase();
            if (lower.startsWith('access-control-')) continue;
            out[key] = value;
        }
        res.writeHead(upstreamRes.statusCode || 502, out);
        upstreamRes.pipe(res);
    });

    upstreamReq.on('error', (err) => {
        res.writeHead(502, { ...corsHeaders(req), 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API proxy failed', message: err.message }));
    });

    if (req.method === 'GET' || req.method === 'HEAD') {
        upstreamReq.end();
    } else {
        req.pipe(upstreamReq);
    }
}

const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders(req));
        res.end();
        return;
    }
    proxy(req, res);
});

server.listen(PORT, HOST, () => {
    console.log(`BrandedUK API CORS proxy: http://${HOST}:${PORT} → ${API_UPSTREAM}`);
    console.log(`Test: http://${HOST}:${PORT}/api/products?limit=1`);
});
