import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const MAX_BYTES = 3 * 1024 * 1024;
const TYPES = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    pdf: 'application/pdf', ai: 'application/postscript', eps: 'application/postscript'
};
const REGION = process.env.DO_SPACES_REGION || 'lon1';
const BUCKET = process.env.DO_SPACES_BUCKET || 'brandeduk';
const CDN = (process.env.DO_SPACES_CDN_URL || `https://${BUCKET}.${REGION}.cdn.digitaloceanspaces.com`).replace(/\/+$/, '');
const s3 = new S3Client({
    endpoint: `https://${REGION}.digitaloceanspaces.com`,
    region: REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET
    }
});
const requests = new Map();

function allowedOrigin(origin) {
    if (origin === 'https://www.brandeduk.com' || origin === 'https://brandeduk.com') return true;
    try {
        const url = new URL(origin);
        return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    } catch {
        return false;
    }
}

export default async function handler(req, res) {
    const origin = req.headers.origin;
    res.setHeader('Vary', 'Origin');
    res.setHeader('Cache-Control', 'no-store');
    if (!allowedOrigin(origin)) return res.status(403).json({ error: 'Origin not allowed' });
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const now = Date.now();
    for (const [ip, bucket] of requests) {
        if (now - bucket.start >= 60000) requests.delete(ip);
    }
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const bucket = requests.get(ip) || { start: now, count: 0 };
    requests.set(ip, bucket);
    if (++bucket.count > 10) return res.status(429).json({ error: 'Too many uploads. Please try again in a minute.' });

    const { filename, data } = req.body || {};
    if (typeof filename !== 'string' || !filename || filename.length > 255 || typeof data !== 'string') {
        return res.status(400).json({ error: 'Filename and file data are required' });
    }
    const extension = filename.split('.').pop().toLowerCase();
    if (!Object.hasOwn(TYPES, extension)) {
        return res.status(415).json({ error: 'Use PNG, JPG, GIF, WebP, SVG, PDF, AI or EPS files.' });
    }
    if (data.length > 4 * Math.ceil(MAX_BYTES / 3)) {
        return res.status(413).json({ error: 'File too large. Maximum size is 3 MB.' });
    }
    if (!data || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
        return res.status(400).json({ error: 'Invalid file data' });
    }
    const body = Buffer.from(data, 'base64');
    if (body.toString('base64') !== data) {
        return res.status(400).json({ error: 'Invalid file data' });
    }
    if (!body.length || body.length > MAX_BYTES) {
        return res.status(413).json({ error: 'File must contain data and be no larger than 3 MB.' });
    }
    const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(-120);
    const key = `chat-attachments/${randomUUID()}/${safeName}`;
    try {
        await s3.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: body, ContentType: TYPES[extension],
            ContentDisposition: `attachment; filename="${safeName}"`, ACL: 'public-read'
        }));
        return res.status(200).json({ url: `${CDN}/${key}`, name: filename.slice(0, 255), type: TYPES[extension], size: body.length });
    } catch (error) {
        console.error('Chat attachment upload failed:', error);
        return res.status(500).json({ error: 'Could not upload the file. Please try again.' });
    }
}
