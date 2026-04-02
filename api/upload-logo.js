/**
 * Vercel Serverless Function for Logo Upload & Retrieval
 * Uses DigitalOcean Spaces (S3-compatible) for persistent logo hosting.
 *
 * POST /api/upload-logo  – upload base64 image → returns permanent URL
 * GET  /api/upload-logo?list=1  – list logos stored in DO Spaces
 * DELETE /api/upload-logo  – remove a logo by URL
 *
 * Environment variables required on Vercel:
 *   DO_SPACES_KEY        – DigitalOcean Spaces access key
 *   DO_SPACES_SECRET     – DigitalOcean Spaces secret key
 *   DO_SPACES_BUCKET     – Bucket name (e.g. "brandeduk")
 *   DO_SPACES_REGION     – Region (e.g. "lon1", "nyc3", "ams3")
 *   DO_SPACES_CDN_URL    – (Optional) Custom CDN endpoint (e.g. "https://brandeduk.lon1.cdn.digitaloceanspaces.com")
 */

import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

/* ── config ──────────────────────────────────────────── */

const REGION = process.env.DO_SPACES_REGION || 'lon1';
const BUCKET = process.env.DO_SPACES_BUCKET || 'brandeduk';
const CDN_URL = process.env.DO_SPACES_CDN_URL || `https://${BUCKET}.${REGION}.cdn.digitaloceanspaces.com`;

const s3 = new S3Client({
    endpoint: `https://${REGION}.digitaloceanspaces.com`,
    region: REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
    forcePathStyle: false,
});

/* ── helpers ─────────────────────────────────────────── */

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

function respond(res, status, body) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(status).json(body);
}

function base64ToBuffer(dataUrl) {
    const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;
    return {
        ext: matches[1] === 'jpeg' ? 'jpg' : matches[1],
        buffer: Buffer.from(matches[2], 'base64'),
        mime: `image/${matches[1]}`,
    };
}

/* ── handler ─────────────────────────────────────────── */

export default async function handler(req, res) {
    // Pre-flight CORS
    if (req.method === 'OPTIONS') {
        return respond(res, 200, { ok: true });
    }

    /* ── GET: list logos ──────────────────────────────── */
    if (req.method === 'GET') {
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
            return respond(res, 200, { success: true, logos });
        } catch (err) {
            console.error('List logos error:', err);
            return respond(res, 500, { error: 'Failed to list logos', message: err.message });
        }
    }

    /* ── DELETE: remove a logo ────────────────────────── */
    if (req.method === 'DELETE') {
        try {
            const { url } = req.body || {};
            if (!url) return respond(res, 400, { error: 'url is required' });

            // Extract the key from the full URL
            const key = url.replace(CDN_URL + '/', '').replace(`https://${BUCKET}.${REGION}.digitaloceanspaces.com/`, '');
            const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
            await s3.send(command);
            return respond(res, 200, { success: true, deleted: url });
        } catch (err) {
            console.error('Delete logo error:', err);
            return respond(res, 500, { error: 'Failed to delete logo', message: err.message });
        }
    }

    /* ── POST: upload a logo ─────────────────────────── */
    if (req.method !== 'POST') {
        return respond(res, 405, { error: 'Method not allowed' });
    }

    try {
        const { logo, position, filename } = req.body || {};

        if (!logo) {
            return respond(res, 400, { error: 'logo (base64 data URL) is required' });
        }

        const parsed = base64ToBuffer(logo);
        if (!parsed) {
            return respond(res, 400, { error: 'Invalid base64 image data' });
        }

        const timestamp = Date.now();
        const safeName = (filename || `logo-${position || 'general'}-${timestamp}`)
            .replace(/[^a-zA-Z0-9_.-]/g, '_');
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

        return respond(res, 200, {
            success: true,
            url: publicUrl,
            filename: `${safeName}.${parsed.ext}`,
            size: parsed.buffer.length,
        });
    } catch (err) {
        console.error('Upload logo error:', err);
        return respond(res, 500, { error: 'Failed to upload logo', message: err.message });
    }
}

