#!/usr/bin/env node
/**
 * SEO / AI-search crawler audit script (brief Phase 24-26).
 *
 * Tests representative live URLs on https://www.brandeduk.com and reports:
 *   URL, HTTP status, robots meta, canonical, title, meta description,
 *   H1 text, detected JSON-LD @type values, and whether OAI-SearchBot
 *   receives the same status as a normal browser.
 *
 * Usage:
 *   node scripts/seo-audit.js
 *   node scripts/seo-audit.js https://www.brandeduk.com   (override base URL, e.g. for a preview deployment)
 */
'use strict';

const BASE_URL = process.argv[2] || 'https://www.brandeduk.com';

// Phase 25: minimum required test set.
const URLS = [
  '/',
  '/services',
  '/shop',
  '/shop-pc',
  '/polos',
  '/hivis',
  '/bundles',
  '/bulk-orders',
  '/privacy-policy',
  '/terms-and-conditions',
  '/blog/',
  '/blog/articles/workwear-embroidery-guide.html',
  '/sitemap.xml',
  '/robots.txt',
];

const USER_AGENTS = {
  browser: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  oaiSearchBot: 'Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)',
};

function extract(html, regex) {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
}

function extractJsonLdTypes(html) {
  const types = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const collect = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(collect); return; }
        if (node['@type']) types.push(Array.isArray(node['@type']) ? node['@type'].join('+') : node['@type']);
        if (node['@graph']) collect(node['@graph']);
      };
      collect(data);
    } catch (e) {
      types.push('INVALID_JSON');
    }
  }
  return types;
}

async function fetchWithUA(url, userAgent) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': userAgent }, redirect: 'manual' });
    const body = res.status >= 200 && res.status < 300 ? await res.text() : '';
    return { status: res.status, body };
  } catch (e) {
    return { status: 0, body: '', error: e.message };
  }
}

async function auditUrl(path) {
  const url = BASE_URL.replace(/\/$/, '') + path;
  const [browserResult, botResult] = await Promise.all([
    fetchWithUA(url, USER_AGENTS.browser),
    fetchWithUA(url, USER_AGENTS.oaiSearchBot),
  ]);

  const html = browserResult.body;
  const title = extract(html, /<title[^>]*>([^<]*)<\/title>/i);
  const description = extract(html, /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const robots = extract(html, /<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const canonical = extract(html, /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const h1 = extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const schemaTypes = extractJsonLdTypes(html);

  return {
    path,
    status: browserResult.status,
    oaiSearchBotStatus: botResult.status,
    sameStatusForBot: browserResult.status === botResult.status,
    robots: robots || '(default: index,follow)',
    canonical: canonical || '(none found)',
    title: title || '(none found)',
    description: description ? description.slice(0, 80) + (description.length > 80 ? '…' : '') : '(none found)',
    h1: h1 ? h1.replace(/<[^>]+>/g, '').trim().slice(0, 60) : '(none found)',
    schemaTypes: schemaTypes.length ? schemaTypes.join(', ') : '(none found)',
  };
}

async function run() {
  console.log(`\nSEO audit for ${BASE_URL}\n`);
  const results = [];
  for (const path of URLS) {
    // Sequential to avoid hammering production with parallel requests.
    // eslint-disable-next-line no-await-in-loop
    results.push(await auditUrl(path));
  }

  results.forEach((r) => {
    console.log(`\n${r.path}`);
    console.log(`  status:          ${r.status}${r.sameStatusForBot ? '' : '  ⚠ OAI-SearchBot got ' + r.oaiSearchBotStatus}`);
    console.log(`  robots:          ${r.robots}`);
    console.log(`  canonical:       ${r.canonical}`);
    console.log(`  title:           ${r.title}`);
    console.log(`  description:     ${r.description}`);
    console.log(`  h1:              ${r.h1}`);
    console.log(`  schema @type(s): ${r.schemaTypes}`);
  });

  const failures = results.filter((r) => r.status >= 400 || !r.sameStatusForBot);
  console.log(`\n${results.length} URLs tested, ${failures.length} with issues.\n`);
  if (failures.length) {
    console.log('URLs needing attention:', failures.map((f) => f.path).join(', '));
    process.exitCode = 1;
  }
}

run();
