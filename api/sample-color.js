/**
 * GET /api/sample-color?url=<encoded-image-url>
 * Server-side eyedropper — bypasses CDN CORS for thumbnail RGB sampling.
 */
'use strict';

const jpeg = { decode: require('./vendor/jpeg-decoder.js') };

const ALLOWED_HOSTS = [
    'cdn.pimber.ly',
    'api.brandeduk.com',
    'i.postimg.cc',
    'brandeduk.lon1.cdn.digitaloceanspaces.com'
];

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
}

function rgbToHex(r, g, b) {
    return (
        '#' +
        [r, g, b]
            .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
            .join('')
    );
}

function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));
        if (max === rn) h = ((gn - bn) / delta) % 6;
        else if (max === gn) h = (bn - rn) / delta + 2;
        else h = (rn - gn) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
    }

    return { h, s: s * 100, l: l * 100 };
}

function sampleEyedropperFromRgba(data, width, height) {
    const cx = width / 2;
    const cy = height / 2;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let weightTotal = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 140) continue;

            const hsl = rgbToHsl(r, g, b);
            if (hsl.l > 96) continue;
            if (hsl.l < 2) continue;

            const dx = (x - cx) / Math.max(1, cx);
            const dy = (y - cy) / Math.max(1, cy);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.88) continue;

            const centerWeight = 1 - dist * 0.4;
            const satWeight = 0.4 + Math.min(1, hsl.s / 100);
            const weight = centerWeight * satWeight;

            sumR += r * weight;
            sumG += g * weight;
            sumB += b * weight;
            weightTotal += weight;
        }
    }

    if (weightTotal <= 0) return null;

    const avgR = sumR / weightTotal;
    const avgG = sumG / weightTotal;
    const avgB = sumB / weightTotal;

    return {
        hex: rgbToHex(avgR, avgG, avgB),
        rgb: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) }
    };
}

function downscaleRgba(srcData, srcW, srcH, targetSize) {
    const canvas = { width: targetSize, height: targetSize, data: new Uint8ClampedArray(targetSize * targetSize * 4) };
    for (let ty = 0; ty < targetSize; ty++) {
        for (let tx = 0; tx < targetSize; tx++) {
            const sx = Math.min(srcW - 1, Math.floor((tx / targetSize) * srcW));
            const sy = Math.min(srcH - 1, Math.floor((ty / targetSize) * srcH));
            const si = (sy * srcW + sx) * 4;
            const ti = (ty * targetSize + tx) * 4;
            canvas.data[ti] = srcData[si];
            canvas.data[ti + 1] = srcData[si + 1];
            canvas.data[ti + 2] = srcData[si + 2];
            canvas.data[ti + 3] = srcData[si + 3] || 255;
        }
    }
    return canvas;
}

function decodeImageBuffer(buffer, contentType, pathname) {
    const type = String(contentType || '').toLowerCase();
    const path = String(pathname || '').toLowerCase();

    if (type.includes('jpeg') || type.includes('jpg') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        const decoded = jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true });
        return { data: decoded.data, width: decoded.width, height: decoded.height };
    }

    return null;
}

function isAllowedUrl(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'https:') return false;
        return ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
    } catch (error) {
        return false;
    }
}

async function sampleColorFromUrl(imageUrl) {
    if (!isAllowedUrl(imageUrl)) return null;
    const imgRes = await fetch(imageUrl, { headers: { Accept: 'image/*' }, redirect: 'follow' });
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const parsed = new URL(imageUrl);
    const decoded = decodeImageBuffer(buffer, imgRes.headers.get('content-type'), parsed.pathname);
    if (!decoded) return null;
    const scaled = downscaleRgba(decoded.data, decoded.width, decoded.height, 48);
    return sampleEyedropperFromRgba(scaled.data, scaled.width, scaled.height);
}

async function handler(req, res) {
    Object.entries(corsHeaders()).forEach(([key, value]) => res.setHeader(key, value));

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const imageUrl = String(req.query.url || '').trim();
    if (!imageUrl || !isAllowedUrl(imageUrl)) {
        return res.status(400).json({ error: 'Invalid or missing image url' });
    }

    try {
        const imgRes = await fetch(imageUrl, {
            headers: { Accept: 'image/*' },
            redirect: 'follow'
        });

        if (!imgRes.ok) {
            return res.status(502).json({ error: 'Image fetch failed', status: imgRes.status });
        }

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const parsed = new URL(imageUrl);
        const decoded = decodeImageBuffer(buffer, imgRes.headers.get('content-type'), parsed.pathname);

        if (!decoded) {
            return res.status(415).json({ error: 'Unsupported image format' });
        }

        const scaled = downscaleRgba(decoded.data, decoded.width, decoded.height, 48);
        const sample = sampleEyedropperFromRgba(scaled.data, scaled.width, scaled.height);

        if (!sample) {
            return res.status(422).json({ error: 'Could not sample colour from image' });
        }

        return res.status(200).json({
            hex: sample.hex,
            rgb: sample.rgb,
            source: 'eyedropper'
        });
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Sampling failed' });
    }
}

module.exports = handler;
module.exports.sampleColorFromUrl = sampleColorFromUrl;
