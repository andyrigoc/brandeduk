/**
 * Vercel Serverless Function for Logo Upload & Retrieval
 * Uses DigitalOcean Spaces (S3-compatible) for persistent logo hosting.
 *
 * POST /api/upload-logo  – upload base64 image → returns permanent URL
 * GET  /api/upload-logo?list=1  – list logos (requires UPLOAD_LOGO_SECRET)
 * DELETE /api/upload-logo  – remove a logo by URL (requires UPLOAD_LOGO_SECRET)
 *
 * Environment variables required on Vercel:
 *   DO_SPACES_KEY        – DigitalOcean Spaces access key
 *   DO_SPACES_SECRET     – DigitalOcean Spaces secret key
 *   DO_SPACES_BUCKET     – Bucket name (e.g. "brandeduk")
 *   DO_SPACES_REGION     – Region (e.g. "lon1", "nyc3", "ams3")
 *   DO_SPACES_CDN_URL    – (Optional) Custom CDN endpoint
 *   UPLOAD_LOGO_SECRET   – Shared secret for LIST/DELETE; also accepted for POST
 */

import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { timingSafeEqual } from 'crypto';

/* ── config ──────────────────────────────────────────── */

const REGION = process.env.DO_SPACES_REGION || 'lon1';
const BUCKET = process.env.DO_SPACES_BUCKET || 'brandeduk';
const CDN_URL = process.env.DO_SPACES_CDN_URL || `https://${BUCKET}.${REGION}.cdn.digitaloceanspaces.com`;
const UPLOAD_SECRET = process.env.UPLOAD_LOGO_SECRET || '';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']);
const ALLOWED_ORIGINS = new Set([
    'https://www.brandeduk.com',
    'https://brandeduk.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
]);

const s3 = new S3Client({
    endpoint: `https://${REGION}.digitaloceanspaces.com`,
    region: REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
    forcePathStyle: false,
});

/* ── light in-memory rate limit (per instance) ───────── */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
const rateBuckets = new Map();

function clientIp(req) {
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
}

function rateLimitOk(req) {
    const key = clientIp(req);
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || now - bucket.start > RATE_WINDOW_MS) {
        bucket = { start: now, count: 0 };
        rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    return bucket.count <= RATE_MAX;
}

/* ── helpers ─────────────────────────────────────────── */

function requestOrigin(req) {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin)) return origin;
    const referer = req.headers.referer || req.headers.referrer || '';
    try {
        const refOrigin = new URL(referer).origin;
        if (ALLOWED_ORIGINS.has(refOrigin)) return refOrigin;
    } catch (_) { /* ignore */ }
    return null;
}

function corsHeaders(req) {
    const origin = requestOrigin(req) || 'https://www.brandeduk.com';
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Upload-Logo-Secret',
        'Vary': 'Origin',
    };
}

function respond(res, req, status, body) {
    Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(status).json(body);
}

function secretsMatch(provided, expected) {
    if (!provided || !expected) return false;
    const a = Buffer.from(String(provided));
    const b = Buffer.from(String(expected));
    if (a.length !== b.length) return false;
    try {
        return timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

function extractBearer(req) {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    return m ? m[1].trim() : '';
}

function hasUploadSecret(req) {
    if (!UPLOAD_SECRET) return false;
    const headerSecret = req.headers['x-upload-logo-secret'] || '';
    const bearer = extractBearer(req);
    return secretsMatch(headerSecret, UPLOAD_SECRET) || secretsMatch(bearer, UPLOAD_SECRET);
}

function hasSessionCookie(req) {
    const cookie = req.headers.cookie || '';
    return /(?:^|;\s*)authToken=([^;]+)/.test(cookie);
}

/**
 * POST auth: shared secret, session cookie, or same-site Origin/Referer.
 * LIST/DELETE: shared secret only (never public).
 */
function authorizePost(req) {
    if (hasUploadSecret(req)) return true;
    if (hasSessionCookie(req)) return true;
    if (requestOrigin(req)) return true;
    return false;
}

function authorizeAdmin(req) {
    return hasUploadSecret(req);
}

function base64ToBuffer(dataUrl) {
    const matches = dataUrl.match(/^data:image\/([\w+.-]+);base64,([A-Za-z0-9+/=\s]+)$/);
    if (!matches) return null;
    const subtype = matches[1].toLowerCase();
    const ext = subtype === 'jpeg' ? 'jpg' : subtype === 'svg+xml' ? 'svg' : subtype;
    const mime = `image/${subtype}`;
    if (!ALLOWED_MIME.has(mime) && !ALLOWED_MIME.has(`image/${ext}`)) return null;
    const buffer = Buffer.from(matches[2].replace(/\s/g, ''), 'base64');
    return { ext, buffer, mime: mime === 'image/jpg' ? 'image/jpeg' : mime };
}

/* ── handler ─────────────────────────────────────────── */

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return respond(res, req, 200, { ok: true });
    }

    if (!rateLimitOk(req)) {
        return respond(res, req, 429, { error: 'Too many requests' });
    }

    /* ── GET: list logos — secret required; disabled if unset ── */
    if (req.method === 'GET') {
        if (!authorizeAdmin(req)) {
            return respond(res, req, 401, { error: 'Unauthorized' });
        }
        try {
            const prefix = req.query.prefix || 'logos/';
            const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix });
            const result = await s3.send(command);
            const logos = (result.Contents || []).map(obj => ({
                url: `${CDN_URL}/${obj.Key}`,
                filename: obj.Key.split('/').pop(),
                size: obj.Size,
                uploadedAt: obj.LastModified,
            }));
            return respond(res, req, 200, { success: true, logos });
        } catch (err) {
            console.error('List logos error:', err);
            return respond(res, req, 500, { error: 'Failed to list logos' });
        }
    }

    /* ── DELETE: remove a logo — secret required ──────── */
    if (req.method === 'DELETE') {
        if (!authorizeAdmin(req)) {
            return respond(res, req, 401, { error: 'Unauthorized' });
        }
        try {
            const { url } = req.body || {};
            if (!url) return respond(res, req, 400, { error: 'url is required' });

            const key = url.replace(CDN_URL + '/', '').replace(`https://${BUCKET}.${REGION}.digitaloceanspaces.com/`, '');
            if (!key || key.includes('..') || !key.startsWith('logos/')) {
                return respond(res, req, 400, { error: 'Invalid logo url' });
            }
            const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
            await s3.send(command);
            return respond(res, req, 200, { success: true, deleted: url });
        } catch (err) {
            console.error('Delete logo error:', err);
            return respond(res, req, 500, { error: 'Failed to delete logo' });
        }
    }

    /* ── POST: upload a logo ─────────────────────────── */
    if (req.method !== 'POST') {
        return respond(res, req, 405, { error: 'Method not allowed' });
    }

    if (!authorizePost(req)) {
        return respond(res, req, 401, { error: 'Unauthorized' });
    }

    try {
        const { logo, position, filename } = req.body || {};

        if (!logo) {
            return respond(res, req, 400, { error: 'logo (base64 data URL) is required' });
        }

        const parsed = base64ToBuffer(logo);
        if (!parsed) {
            return respond(res, req, 400, { error: 'Invalid or unsupported image data' });
        }
        if (parsed.buffer.length > MAX_BYTES) {
            return respond(res, req, 413, { error: 'Image too large (max 5MB)' });
        }
        if (!ALLOWED_MIME.has(parsed.mime)) {
            return respond(res, req, 415, { error: 'Unsupported media type' });
        }

        const timestamp = Date.now();
        const safeName = (filename || `logo-${position || 'general'}-${timestamp}`)
            .replace(/[^a-zA-Z0-9_.-]/g, '_')
            .slice(0, 120);
        const key = `logos/${safeName}.${parsed.ext}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: parsed.buffer,
            ContentType: parsed.mime,
            ACL: 'public-read',
        });
        await s3.send(command);

        const publicUrl = `${CDN_URL}/${key}`;

        return respond(res, req, 200, {
            success: true,
            url: publicUrl,
            filename: `${safeName}.${parsed.ext}`,
            size: parsed.buffer.length,
        });
    } catch (err) {
        console.error('Upload logo error:', err);
        return respond(res, req, 500, { error: 'Failed to upload logo' });
    }
}
