/**
 * Build a static colour database by eyedropper-sampling product thumbnails.
 * Result is read by the browser (color-hex.js) with NO server and NO CORS issue.
 *
 * Usage:
 *   node scripts/build-color-database.js GD001 GD002 SS422 ...
 *   node scripts/build-color-database.js            (uses DEFAULT_CODES)
 *
 * Writes/merges:  brandedukv15-child/assets/data/color-hex-sampled.json
 *   { version, count, global: { "<color name>": "#hex" }, byImage: { "<thumb url>": "#hex" } }
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { sampleColorFromUrl } = require('../api/sample-color.js');

const API_BASE = 'https://api.brandeduk.com/api';
const OUT_FILE = path.join(__dirname, '..', 'brandedukv15-child', 'assets', 'data', 'color-hex-sampled.json');

const DEFAULT_CODES = ['GD001', 'GD002', 'GD005', 'SS422', 'SS044', 'AM010'];

function normName(name) {
    return String(name || '').trim().toLowerCase().replace(/\*+$/, '').replace(/\s+/g, ' ');
}

function loadExisting() {
    try {
        const raw = fs.readFileSync(OUT_FILE, 'utf8');
        const data = JSON.parse(raw);
        return {
            global: data.global && typeof data.global === 'object' ? data.global : {},
            byImage: data.byImage && typeof data.byImage === 'object' ? data.byImage : {}
        };
    } catch (e) {
        return { global: {}, byImage: {} };
    }
}

async function fetchProduct(code) {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error(`API ${code} → ${res.status}`);
    return res.json();
}

async function run() {
    const codes = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_CODES;
    const db = loadExisting();
    let sampled = 0;
    let skipped = 0;

    for (const code of codes) {
        let product;
        try {
            product = await fetchProduct(code);
        } catch (e) {
            console.warn(`! ${code}: ${e.message}`);
            continue;
        }

        const colors = Array.isArray(product.colors) ? product.colors : [];
        console.log(`\n${code} — ${product.name} (${colors.length} colours)`);

        for (const col of colors) {
            const name = String(col.name || '').trim();
            if (!name || name.toLowerCase() === 'model') continue;
            const url = String(col.thumb || col.main || col.image || '').trim();
            if (!url) { skipped++; continue; }

            if (db.byImage[url]) { console.log(`  = ${name} (cached ${db.byImage[url]})`); continue; }

            try {
                const result = await sampleColorFromUrl(url);
                if (result && result.hex) {
                    db.byImage[url] = result.hex;
                    db.global[normName(name)] = result.hex;
                    sampled++;
                    console.log(`  + ${name} → ${result.hex}`);
                } else {
                    skipped++;
                    console.log(`  x ${name} (no sample)`);
                }
            } catch (e) {
                skipped++;
                console.log(`  x ${name} (${e.message})`);
            }
        }
    }

    const payload = {
        version: 1,
        builtAt: new Date().toISOString(),
        count: Object.keys(db.byImage).length,
        global: db.global,
        byImage: db.byImage
    };
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(payload), 'utf8');

    console.log(`\nDone. Sampled ${sampled}, skipped ${skipped}. Total byImage: ${payload.count}`);
    console.log(`Written: ${OUT_FILE}`);
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
