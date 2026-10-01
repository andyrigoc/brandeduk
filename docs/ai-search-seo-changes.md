# AI Search & SEO — Changes Implemented

Companion to [ai-search-seo-audit.md](ai-search-seo-audit.md). All changes below are **local git commits, not yet pushed** to GitHub/Vercel. Each commit is an isolated, revertable checkpoint (see commit list at the end).

## 1. robots.txt
- Removed a dead rule for `/mobile/home-mobile.html` (file doesn't exist under that name).
- Stopped blocking render-critical assets: `brandeduk.com/css/*` and `test-order-popup/*.css|*.js` are live production assets loaded by `home-pc.html` and `shop-pc.html`. Only the legacy/dead HTML pages inside those folders remain blocked.
- Removed `Disallow` rules for folders that no longer exist (already deleted from the repo): `brandeduk.com-pc-OLD/`, `tablet-order-process-v4/`, `test-order-page/`, `customization-tool_backup_20260605-060018/`.
- Added explicit `Allow: /` blocks for `OAI-SearchBot`, `GPTBot`, `ChatGPT-User` (functionally identical to the existing wildcard `*` rule, added for clarity/documentation as requested).

## 2. Organization JSON-LD (index.html, index-mobile.html, home-pc.html)
- Corrected `address` from `"addressLocality": "London"` to the real registered address: Unit 8, Red Lion Business Centre, Red Lion Road, Surbiton, Surrey, KT6 7QD, GB (matches the address already used in the live contact popup / Google Maps link elsewhere in the codebase).
- Added `areaServed`: London, Greater London, Surrey, Surbiton, Kingston upon Thames, United Kingdom.
- Removed a duplicate `https://www.instagram.com/brandeduk_workwear/` entry from `sameAs`.

## 3. sitemap.xml
- Removed `https://www.brandeduk.com/quote`, which 307-redirects to `/?contact=1` — a redirecting URL should not be listed as an indexable sitemap entry.

## 4. Homepage content (index.html)
- The canonical homepage (`/`) previously showed a near-empty splash screen to any crawler that doesn't execute the device-detection JavaScript redirect (verified live with OAI-SearchBot, GPTBot and Googlebot user-agents — all received the same empty shell).
- Added a genuinely visible `<h1>`, a description paragraph (reusing the existing meta description), and a small navigation block linking to the main shop/category pages (Shop, Embroidery & printing, Polo shirts, Hoodies, Hi-Vis, Workwear).
- The existing device-detection redirect logic (`index-mobile.html` vs `home-pc.html`) and its timing were **not changed** — real users with JavaScript still get redirected exactly as before.

## 5. FAQPage structured data (home-pc.html)
- Added `FAQPage` JSON-LD mirroring the 28 genuinely visible Q&A pairs already present in the `.faq-section` (Embroidery, DTF, Vinyl, Screen Printing). No new claims or figures were introduced — text matches the visible content, with two known mojibake artifacts (`Â£` → `£`, `â€“` → `–`) corrected to their intended characters.

## 6. Canonical URL consistency (privacy-policy.html, terms-and-conditions.html)
- Added clean-URL routes (`/privacy-policy`, `/terms-and-conditions`) in `vercel.json`, matching the existing rewrite/redirect pattern used for every other page.
- Updated `canonical` and `og:url` on both pages to the new clean URLs.

## 7. Category pages missing explicit meta robots (hivis.html, hoodies.html, jackets.html, tshirts.html, workwear.html)
- Added `<meta name="robots" content="index, follow">` for consistency with sibling category pages that already had it explicit (polos.html, bundles.html, etc.). Behaviour is unchanged (these pages were already indexable by default) — this just removes the inconsistency flagged in the audit.

## Not changed / deferred
- The apex-domain (`brandeduk.com` → `www.brandeduk.com`) redirect returns `307` instead of a permanent redirect. This is controlled by Vercel's domain settings, not by anything in this repository — logged in [external-seo-actions.md](external-seo-actions.md).
- New location/service landing pages (Phase 4 of the brief), About/Contact standalone pages, Product/CollectionPage schema, and the OpenAI product feed script were **not started** in this pass — they require business data (opening hours, VAT/company registration, confirmed page list) that hasn't been provided yet.
- Mobile-architecture consolidation (separate brief) is intentionally out of scope here.

## 8. Thin JS-redirect category pages (polos, hoodies, jackets, tshirts, workwear, hivis)
- These pages immediately redirect via JavaScript to `shop.html?productType=X`. Before this fix, most had a body of only `<h1>...</h1><p>Redirecting...</p>` — the same empty-shell problem as the homepage, discovered while implementing the meta-robots consistency fix.
- Added one real descriptive sentence per page (reused from each page's own existing `<meta name="description">` copy — no new claims invented) plus a plain `<a href="shop.html?productType=...">` fallback link, so non-JS crawlers see genuine content and a working link instead of just "Redirecting...".
- The JS redirect logic itself and real-user behaviour are unchanged.

## 9. shop.html / shop-pc.html metadata gap
- `shop.html` was missing an explicit `<meta name="robots">` tag — added for consistency.
- `shop-pc.html` had **no canonical, no meta description, and no meta robots at all**, despite being directly reachable at `/shop-pc`. Added all three, canonicalizing to `/shop` (the single chosen canonical shop URL, matching the existing home-pc.html/index.html pattern) to prevent duplicate-content risk between the two device-specific shop pages.

## 10. Broken internal links from every blog article (`/embroidery/`, `/printing/`, `/contact/`)
- All 11 blog articles share the same navigation header, which links to `/embroidery/`, `/printing/`, `/contact/` and `/workwear/`. Verified live: `/workwear/` resolves (200), but `/embroidery/`, `/printing/` and `/contact/` all returned **404**.
- Added temporary (non-permanent) redirects in `vercel.json` pointing these to the closest genuinely relevant existing content: `/embroidery` and `/printing` → `/services` (which already covers embroidery, DTF, DTG and screen printing), `/contact` → `/?contact=1` (opens the real contact popup, same pattern already used for `/quote`).
- These are intentionally **non-permanent redirects**, so dedicated `/embroidery/` and `/printing/` landing pages (Phase 4/6 of the brief) can replace them later without an awkward double-redirect.

## 11. Fake review fallback removed (shop-pc.html / test-order-popup/order-integration.js)
- Product pages showed a hardcoded `4.8 stars (124 reviews)` whenever the product API didn't provide real review data — a fabricated rating shown on every product lacking genuine reviews.
- Fixed: the rating block is now hidden entirely (`hidden` attribute) unless the API returns genuine `rating` and `reviewCount` values. No fallback numbers are shown.

## 12. Email consistency (services.html)
- Footer showed `sales@brandeduk.com` while every other page uses `info@brandeduk.com`. Standardised to `info@brandeduk.com`.

## 13. Opening hours corrected everywhere (confirmed 2026-10-01: 7 days a week, 9:00–21:00)
- Previously showed inconsistent values across the site: "Mon–Fri, 9:00–18:00" (popup contact, mojibake in 2 files), "Monday-Friday - 9:00-18:00" (pc-footer.js), "Mon-Fri 9am-5pm" (product-detail.html, services.html footer).
- Updated all occurrences to "Open 7 days a week, 9:00–21:00" (or "Open 7 days, 9am-9pm" in the shorter footer blurbs), including regenerating `pc-header-template.js` and `mobile/js/popup-contact-template.js` via `npm run build:pc-header` since they're derived from `home-pc.html`.
- Added `"openingHours": "Mo-Su 09:00-21:00"` to the Organization JSON-LD in `index.html`, `index-mobile.html` and `home-pc.html`.

## Commit checkpoints (local only, not pushed) — updated
1. `chore: remove dead/legacy files (old PC prototype, test pages, dated backup)`
2. `seo: fix robots.txt render-blocking rules, correct business address to Surbiton, dedupe sameAs, remove redirecting URL from sitemap`
3. `seo: add real visible H1/description/nav links to index.html splash screen so non-JS crawlers see content before device redirect`
4. `seo: add FAQPage structured data mirroring the visible FAQ content on home-pc.html`
5. `seo: add clean URL routes for privacy-policy/terms-and-conditions and align their canonical/og:url tags`
6. `seo: add explicit meta robots tag to category pages for consistency with sibling pages`
7. `docs: add SEO changes log and external manual actions list (Phase 40 deliverables)`
8. `seo: restore original splash-screen visual appearance, keep SEO content accessible-hidden instead of visible`
9. `seo: add real descriptive content and fallback links to thin JS-redirect category pages (same empty-shell issue as homepage)`
10. `seo: add missing canonical/description/robots meta to shop.html and shop-pc.html`

Roll back any single step with `git reset --hard <commit-before-it>`. Nothing has been pushed, so production (Vercel) is unaffected until you approve and push.
