#!/usr/bin/env node
/**
 * Builds mobile/css/mobile-chrome-base.css: the mobile header, slide menu, bottom nav and search
 * suggestion rules from mobile.css and header.css, without mobile.css's global reset.
 *
 *   node scripts/build-mobile-chrome-css.js
 *
 * Pages with their own layout (about, contact, account pages, ...) load this file plus
 * header-v2.css and mobile-chrome.css instead of the whole mobile.css.
 * Re-run after changing header, menu, bottom nav or VAT toggle rules in mobile.css / header.css.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MOBILE_CSS = path.join(ROOT, 'mobile/css/mobile.css');
const HEADER_CSS = path.join(ROOT, 'brandedukv15-child/assets/css/components/header.css');
const OUT_FILE = path.join(ROOT, 'mobile/css/mobile-chrome-base.css');

const CHROME_SELECTOR = /\.(mobile-header|mh-[\w-]+|slide-menu|menu-overlay|bottom-nav|nav-item[\w-]*|search-wrapper-expand|search-input-expand|search-icon-expand|search-autocomplete|vat-toggle-mobile|vat-checkbox|vat-toggle-label|vat-label[\w-]*|vat-status|mobile-logo(?!-upload)[\w-]*|logo-badge|logo-image|logo-text|logo-uk|close-menu|cart-count|menu-[\w-]+)(?![\w-])/;
const SUGGEST_SELECTOR = /\.(search-suggestions|suggestion-[\w-]+|view-all-results)(?![\w-])/;
// Page-specific contexts that never exist on the pages using this file.
const SKIP_SELECTOR = /^\.(home-page|filters-toggles|customize-page)\b/;

const CHROME_ROOTS = ':where(.mobile-chrome-header, .slide-menu, .menu-overlay, .bottom-nav)';

function stripComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function splitSelectors(selector) {
    const parts = [];
    let depth = 0, start = 0;
    for (let i = 0; i < selector.length; i++) {
        const ch = selector[i];
        if (ch === '(' || ch === '[') depth++;
        else if (ch === ')' || ch === ']') depth--;
        else if (ch === ',' && depth === 0) {
            parts.push(selector.slice(start, i).trim());
            start = i + 1;
        }
    }
    parts.push(selector.slice(start).trim());
    return parts.filter(Boolean);
}

/** Walks rules, recursing into @media / @supports; calls visit(prelude, body, context). */
function walk(css, visit, context) {
    let pos = 0;
    while (pos < css.length) {
        const open = css.indexOf('{', pos);
        if (open < 0) break;
        const prelude = css.slice(pos, open).trim();
        let depth = 1, end = open + 1;
        while (end < css.length && depth) {
            if (css[end] === '{') depth++;
            else if (css[end] === '}') depth--;
            end++;
        }
        const body = css.slice(open + 1, end - 1);
        if (/^@(media|supports)/.test(prelude)) walk(body, visit, prelude);
        else visit(prelude, body, context || '');
        pos = end;
    }
}

function extract(css, pattern) {
    const rules = [];
    walk(stripComments(css), (prelude, body, context) => {
        if (prelude.startsWith('@')) return;
        const selectors = splitSelectors(prelude).filter((s) => pattern.test(s) && !SKIP_SELECTOR.test(s));
        if (selectors.length) rules.push({ context, selector: selectors.join(',\n'), body: body.trim() });
    });
    return rules;
}

function collectRoot(css) {
    const vars = new Map();
    walk(stripComments(css), (prelude, body, context) => {
        if (context || prelude !== ':root') return;
        for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars.set(m[1], m[2].trim());
    });
    return vars;
}

function collectKeyframes(css) {
    const frames = new Map();
    const clean = stripComments(css);
    for (const m of clean.matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{/g)) {
        let depth = 1, end = m.index + m[0].length;
        while (end < clean.length && depth) {
            if (clean[end] === '{') depth++;
            else if (clean[end] === '}') depth--;
            end++;
        }
        frames.set(m[1], clean.slice(m.index, end));
    }
    return frames;
}

function formatRule(rule) {
    const declarations = rule.body.split(';').map((d) => d.trim()).filter(Boolean).map((d) => '    ' + d + ';').join('\n');
    const block = rule.selector + ' {\n' + declarations + '\n}';
    if (!rule.context) return block;
    return rule.context + ' {\n' + block.split('\n').map((l) => '    ' + l).join('\n') + '\n}';
}

const mobileCss = fs.readFileSync(MOBILE_CSS, 'utf8');
const headerCss = fs.readFileSync(HEADER_CSS, 'utf8');
const rules = extract(mobileCss, CHROME_SELECTOR).concat(extract(headerCss, SUGGEST_SELECTOR));

const rootVars = new Map([...collectRoot(headerCss), ...collectRoot(mobileCss)]);
const usedVars = new Set();
const pending = rules.map((r) => r.body).join('\n');
const queue = [...pending.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]);
while (queue.length) {
    const name = queue.pop();
    if (usedVars.has(name) || !rootVars.has(name)) continue;
    usedVars.add(name);
    for (const m of rootVars.get(name).matchAll(/var\((--[\w-]+)/g)) queue.push(m[1]);
}

const frames = collectKeyframes(mobileCss);
const usedFrames = [...frames.keys()].filter((name) => new RegExp('animation(?:-name)?\\s*:[^;]*\\b' + name + '\\b').test(pending));

const out = [
    '/* Generated by scripts/build-mobile-chrome-css.js from mobile.css and header.css - do not edit by hand. */',
    '',
    '/* mobile.css normally provides these through :root and its global reset; here they stay inside the header, menu',
    '   and bottom nav so the host page keeps its own variables, and its element styles (button, input, label, a) stay out. */',
    CHROME_ROOTS + ' {',
    ...[...usedVars].sort().map((name) => '    ' + name + ': ' + rootVars.get(name) + ';'),
    "    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;",
    '    font-size: 14px;',
    '    line-height: 1.5;',
    '    color: var(--gray-800, #1f2937);',
    '    -webkit-font-smoothing: antialiased;',
    '}',
    '',
    // Not img/svg: revert would also drop their width/height and fill/stroke attributes.
    CHROME_ROOTS + ' :is(a, button, input, label, span, div, nav, p, strong, small, mark) {',
    '    all: revert;',
    '}',
    '',
    CHROME_ROOTS + ',',
    CHROME_ROOTS + ' *,',
    CHROME_ROOTS + ' *::before,',
    CHROME_ROOTS + ' *::after {',
    '    box-sizing: border-box;',
    '    margin: 0;',
    '    padding: 0;',
    '}',
    '',
    CHROME_ROOTS + ' :is(a, button, input, label, span, div, nav, p, strong, small, mark) {',
    '    box-sizing: border-box;',
    '    margin: 0;',
    '    padding: 0;',
    '}',
    '',
    CHROME_ROOTS + ' a {',
    '    color: inherit;',
    '    text-decoration: none;',
    '}',
    '',
    CHROME_ROOTS + ' button {',
    '    font-family: inherit;',
    '    font-size: inherit;',
    '    cursor: pointer;',
    '    border: none;',
    '    background: none;',
    '    color: inherit;',
    '}',
    '',
    CHROME_ROOTS + ' input {',
    '    font-family: inherit;',
    '}',
    '',
    CHROME_ROOTS + ' img {',
    '    max-width: 100%;',
    '    height: auto;',
    '    display: block;',
    '}',
    '',
    ...usedFrames.map((name) => frames.get(name) + '\n'),
    rules.map(formatRule).join('\n\n'),
    ''
].join('\n');

fs.writeFileSync(OUT_FILE, out);
console.log('Wrote ' + path.relative(ROOT, OUT_FILE) + ': ' + rules.length + ' rules, ' + usedVars.size + ' variables, ' + usedFrames.length + ' keyframes');
