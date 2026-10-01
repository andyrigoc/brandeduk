# AI Search & SEO Technical Audit — brandeduk.com

Date: 2026-10-01
Scope: Phase 1 of the AI-search SEO brief. **Read-only audit — no code changed in this document.**
Production platform confirmed: **Vercel** (`Server: Vercel`, GitHub repo "About" link → `brandeduk-com-lab.vercel.app`). `netlify.toml` is present in the repo but **no Netlify site is connected** — treat it as inert/legacy, not a source of truth.

---

## 1. Robots.txt

File: [robots.txt](/robots.txt), served live at `https://www.brandeduk.com/robots.txt` → **200 OK**.

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /backend/
Disallow: /.git/
Disallow: /.vscode/
Disallow: /node_modules/
Disallow: /test-*
Disallow: /*?*customizingProduct=*
Disallow: /*?*sessionId=*
Disallow: /brandeduk.com/
Disallow: /brandeduk.com-pc-OLD/
Disallow: /mobile/home-mobile.html
Disallow: /tablet-order-process-v4/
Disallow: /test-order-page/
Disallow: /footer-dev/
Disallow: /.history/
Disallow: /tools/
Disallow: /dist/
Disallow: /design-assets/
Disallow: /customization-tool_backup_20260605-060018/
Disallow: /test-order-popup/
Disallow: /tests/
Disallow: /.github/
Disallow: /.cursor/

Sitemap: https://www.brandeduk.com/sitemap.xml
Crawl-delay: 1
```

There are **no dedicated rules for `OAI-SearchBot`, `GPTBot`, or `ChatGPT-User`** — they are governed entirely by the `User-agent: *` block, which is `Allow: /`.

| Crawler | Current status | Allowed/Blocked | Action required |
|---|---|---|---|
| `*` (wildcard) | `Allow: /` with specific `Disallow` paths | **Allowed** | None — correct baseline |
| Googlebot | Covered by `*`, no dedicated rule | **Allowed** | None |
| Bingbot | Covered by `*`, no dedicated rule | **Allowed** | None |
| GPTBot | Covered by `*`, no dedicated rule | **Allowed** | Optional: add explicit block/allow for clarity, but not required |
| OAI-SearchBot | Covered by `*`, no dedicated rule | **Allowed** | None required, but brief asks for explicit `Allow` — low-risk to add |
| ChatGPT-User | Covered by `*`, no dedicated rule | **Allowed** | None |

**Issues found:**
- `Disallow: /mobile/home-mobile.html` targets a file that **does not exist** (the real mobile homepage is `index-mobile.html`). This rule is dead/no-op — harmless but should be cleaned up.
- `Crawl-delay: 1` is a Bing-only/legacy directive; Googlebot ignores it. Not harmful, just has no effect on Google.
- `Disallow: /test-order-popup/` blocks a folder whose CSS/JS **are actively loaded by the live `shop-pc.html`** (see repo memory `pc-customizer-layout.md` / earlier audit). Blocking crawler access to render-critical CSS/JS can degrade Google's mobile-friendliness/rendering evaluation of `shop-pc.html`. Needs a narrower rule (block only any stray HTML inside that folder, not the `.css`/`.js` assets).
- `Disallow: /brandeduk.com/` blocks a folder whose `css/*.css` files (style.css, hero.css, halloween-banner.css, uniform-cube.css, embroidery-scroll.css) are **loaded live by `home-pc.html`**. Same rendering-evaluation risk as above.

**Live crawler simulation (curl, Vercel production):**

| User-Agent | HTTP status for `/` |
|---|---|
| Normal browser UA | 200 |
| `OAI-SearchBot/1.0` | 200 |
| `GPTBot/1.1` | 200 |
| `Googlebot/2.1` | 200 |

No user-agent blocking, no WAF challenge, no 403, at the HTTP layer. **The real problem is not access — it's content (see Section 9).**

---

## 2. Meta Robots

Grep across all root/blog HTML files for `name="robots"` / canonical:

| Page | Meta robots | Canonical | Notes |
|---|---|---|---|
| `index.html` | `index, follow, max-image-preview:large,...` | `https://www.brandeduk.com/` | OK |
| `index-mobile.html` | same as above | `https://www.brandeduk.com/` | Duplicated manually, consistent |
| `home-pc.html` | same as above | `https://www.brandeduk.com/` | Duplicated manually, consistent |
| `shop.html` / `shop-pc.html` | not explicit (defaults to indexable) | `https://www.brandeduk.com/shop` | Works but should be explicit |
| `polos.html`, `bundles.html`, `bulk-orders.html`, `services.html`, `privacy-policy.html`, `terms-and-conditions.html` | `index, follow` | present | OK |
| `hivis.html`, `hoodies.html`, `jackets.html`, `tshirts.html`, `workwear.html` | **no explicit `<meta name="robots">` found** | canonical present | Defaults to indexable (fine) but inconsistent with sibling category pages that do set it explicitly |
| `basket.html`, `checkout.html`, `orders.html`, `profile.html`, `payment-success.html`, `track-order.html`, `quote-review.html` | `noindex, follow` | present | **Correct** — private/transactional pages properly excluded |
| `product-detail.html` | none found | canonical via JS (`id="canonicalLink"`) | This page immediately JS-redirects almost all real traffic to `shop-pc.html?product=` or `mobile/customize-mobile.html` — a crawler that doesn't execute JS sees a near-empty shell here too (see Section 9) |
| `privacy-policy.html`, `terms-and-conditions.html` | `index, follow` | canonical points to **`.html` URL**, not the clean path | Minor inconsistency vs. the clean-URL pattern used everywhere else |
| Blog articles (`blog/articles/*.html`) | canonical present and correct | — | Did not find explicit robots meta in the truncated grep; low risk, default is indexable |

No `X-Robots-Tag` HTTP header found on the homepage response (checked live). No accidental `noindex` found on any public commercial page. **No accidental blocking detected.**

---

## 3. HTTP Access (live production tests, Vercel)

| URL | HTTP status | Notes |
|---|---|---|
| `https://www.brandeduk.com/` | **200** | Canonical domain, correct |
| `https://brandeduk.com/` (apex, no www) | **307** → `https://www.brandeduk.com/` | ⚠️ Temporary redirect used for a **permanent** domain consolidation. Should be 301/308. |
| `http://www.brandeduk.com/` (http) | **308** → `https://www.brandeduk.com/` | Correct — permanent, HTTPS enforced |
| `https://www.brandeduk.com/robots.txt` | 200 | OK |
| `https://www.brandeduk.com/sitemap.xml` | 200 | OK |
| `https://www.brandeduk.com/shop` | 200 (no redirect) | Clean URL serves directly, correct |
| `https://www.brandeduk.com/quote` | **307** → `/?contact=1` | This URL is **listed in sitemap.xml** with priority 0.8 — a redirecting URL inside the sitemap, which the brief explicitly flags to avoid |
| `https://www.brandeduk.com/does-not-exist-123` | **404** | Correct, no soft-404 |

No 403s, no 429s, no 5xx, no WAF/challenge pages encountered at the HTTP layer for any tested URL or user-agent.

---

## 4. CDN / WAF / Bot Protection

Platform is **Vercel**, not Cloudflare. No Cloudflare zone, firewall rules, or bot-management config exist in this repository (there is nothing to audit in-repo — Vercel's edge/WAF settings, if any, live in the Vercel project dashboard, not in version control).

`vercel.json` `headers` block only sets permissive CORS (`Access-Control-Allow-Origin: *`) on `/(.*)` — this is **not a crawler-blocking mechanism** and was not found to interfere with crawling. No `X-Robots-Tag`, no bot-challenge headers, no rate-limit headers observed.

**Action required (external, cannot be done from this repo):** verify in the Vercel dashboard whether any "Deployment Protection" / password-protection / firewall rule is enabled for the production domain, and whether the apex→www redirect (currently 307) can be changed to a permanent redirect at the domain level. Logged in `/docs/external-seo-actions.md`.

---

## 5. Sitemap

`sitemap.xml` is static, hand-maintained, manually referenced from `robots.txt`. **Not a sitemap index** — single flat file, 29 URLs total.

Included: homepage, `/shop`, `/services`, `/quote`, 8 category pages (`polos`, `hoodies`, `tshirts`, `hivis`, `workwear`, `jackets`, `bundles`, `bulk-orders`), blog index, 14 blog articles.

**Issues found:**
- `https://www.brandeduk.com/quote` is listed but **307-redirects** to `/?contact=1` — remove from sitemap or point directly at the destination.
- Every single `<lastmod>` is hardcoded to the same date (`2026-04-23`) regardless of actual content — this looks like a static placeholder rather than real modification tracking. Not fabricated maliciously, but not trustworthy either; brief says not to invent dates.
- No individual product pages, no new London/Surrey landing pages (because none exist yet — see Section 8).
- Correctly excludes basket/checkout/account/admin/API — good.

---

## 6. Canonical URLs

All public commercial pages carry a `<link rel="canonical">`. Findings:

- **Consistent pattern**: most pages canonicalize to the clean URL (`/shop`, `/polos`, etc.), matching the `vercel.json` rewrite/redirect pairs. Good — prevents `.html` vs clean-URL duplicate indexing.
- **Inconsistency**: `privacy-policy.html` and `terms-and-conditions.html` canonicalize to their own `.html` path instead of a clean URL, even though `vercel.json` doesn't define a clean alias for them. Not a duplicate-content risk (no clean-URL alternative exists to compete with), but worth standardizing if these ever get clean routes.
- `index.html`, `index-mobile.html`, and `home-pc.html` **all three independently declare** `canonical = https://www.brandeduk.com/`. This is correct in intent (single canonical URL) but means the directive is maintained **by hand in three separate files** — a real maintenance risk if one copy drifts from the others.
- No query-parameter, pagination, or filter-URL canonical issues found in the pages inspected — shop filters appear to be handled client-side via query string without generating separate crawlable/indexable URLs.

---

## 7 & 8. WWW/HTTPS Normalisation

Canonical domain is clearly `https://www.brandeduk.com/` (used consistently across all canonical tags, JSON-LD `url`/`@id` fields, and OG tags).

| Variant | Result |
|---|---|
| `https://www.brandeduk.com/` | 200 (canonical) |
| `https://brandeduk.com/` | 307 → www ⚠️ (works, but wrong status code) |
| `http://www.brandeduk.com/` | 308 → https (correct) |
| `http://brandeduk.com/` | not tested directly, but chain above implies it will eventually reach the canonical URL via two hops |

**Action required:** change the apex-to-www redirect from 307 to a permanent redirect (301/308). This is very likely controlled by Vercel's domain settings (not `vercel.json`), so it needs to be done in the Vercel dashboard — logged in `/docs/external-seo-actions.md`.

---

## 9. Critical finding — Homepage has no crawlable content

This is the single most important issue in this audit.

`https://www.brandeduk.com/` serves [index.html](/index.html), which is a **splash screen**:
- `<head>` has good static metadata: title, meta description, canonical, OG/Twitter tags, and a JSON-LD `Organization` block — **this part is genuinely present in the raw HTML and available to any crawler, including non-JS ones.**
- `<body>` contains only a loading-spinner animation and **one `<h1>` that is visually hidden via CSS clip** (`position:absolute; clip:rect(0,0,0,0)` — a standard, legitimate a11y-hidden pattern, not cloaking).
- There is **no visible paragraph text, no navigation, no product links, no FAQ, no internal links** in the static HTML.
- Real content only exists after a **client-side JavaScript redirect** (`window.location.replace(...)`) to `home-pc.html` (desktop/tablet) or `index-mobile.html` (phones), executed after up to 3 seconds or on load.

**Verified live**: curled with `OAI-SearchBot/1.0`, `GPTBot/1.1`, `Googlebot/2.1`, and a normal browser UA — all four get the exact same near-empty HTML shell at `/`. Googlebot can execute JS during its render pass and *may* eventually index the real content, but this cannot be assumed for GPTBot/OAI-SearchBot/Bingbot, which are far less likely to execute arbitrary redirect JS, and even for Google the content is not available in the **initial HTML response**, only after a rendering pass — which is unreliable for AI answer engines that tend to rely on fetched HTML rather than a full rendering pipeline.

**Net effect:** the single most important URL on the entire site — the canonical homepage — is close to contentless for a large class of crawlers, despite returning 200 and despite having otherwise well-formed metadata/schema in `<head>`.

The same splash pattern (JS redirect based on device) also exists, to a lesser degree, in `product-detail.html`.

**Update (same pass, found while fixing category pages):** `polos.html`, `hoodies.html`, `jackets.html`, `tshirts.html`, `workwear.html` and `hivis.html` are **all thin JS-redirect shells** using `BrandedShopRoute.goShop('?productType=...')` to forward to `shop.html`/`shop-pc.html`. Before the fix in this pass, five of them had a body of literally just `<h1>...</h1><p>Redirecting...</p>` — the exact same empty-shell problem as the homepage, just smaller in scope. `bundles.html`, `bulk-orders.html` and `services.html` are, by contrast, genuine content pages with real HTML (hero sections, pricing tiers, FAQ, etc.) — not redirect shells.

**`shop-pc.html` gap:** despite being directly reachable at the clean URL `/shop-pc` (per `vercel.json`), this file had **no canonical tag, no meta description, and no meta robots tag at all** — a real duplicate-content risk against `/shop`, since Google had no signal pointing back to the canonical shop URL.

---

## 10. Structured Data (JSON-LD) inventory

| Page | Schema types found | Notes |
|---|---|---|
| `index.html` | `Organization` | Minimal — no `WebSite`, no `BreadcrumbList` |
| `index-mobile.html` | `@graph`: `Organization`, `WebSite` (with `SearchAction`), `ItemList`/`SiteNavigationElement` | More complete than `index.html` |
| `home-pc.html` | Same `@graph` structure as `index-mobile.html`, but `SearchAction` target points to `shop-pc.html?search=` instead of `shop.html?search=` | **Inconsistent between mobile/desktop copies** |
| Category pages (`polos.html`, etc.) | None found | No `CollectionPage`/`BreadcrumbList`/`ItemList` schema |
| `product-detail.html` | None found (redirects before rendering) | Real product schema would need to live in `shop-pc.html`'s product popup or `mobile/customize-mobile.html` |
| Blog articles | Not checked for `Article`/`BlogPosting` schema in this pass | Flag for follow-up |
| Anywhere in repo | `FAQPage` | **Not found anywhere** — despite a large, genuinely visible FAQ section existing in `home-pc.html` (4 categories × 6-7 real Q&A pairs). This is a real, fixable gap: content exists, schema doesn't. |

**Organization data accuracy issues** (found in `index.html`, `index-mobile.html`, `home-pc.html` — all three, independently):
- `address.addressLocality` is set to **"London"**. The brief states the real registered/physical address is Surbiton, Surrey (KT6 7QD) — this is a factual mismatch versus the business's real location that the brief explicitly says not to misrepresent.
- `sameAs` array contains `instagram.com/brandeduk_workwear/` **listed twice**.
- No Google Business Profile URL in `sameAs`.
- `LinkedIn` URL (`linkedin.com/in/anderson-ricotta-92a394321/`) is a **personal profile**, not a company page — worth flagging for accuracy (not necessarily wrong, but should be confirmed as intentional).

---

## 11. Core landing pages (Phase 4) — existing vs missing

None of the suggested URLs from the brief currently exist as dedicated pages:

`/custom-uniforms-london/`, `/embroidered-workwear-london/`, `/t-shirt-printing-london/`, `/custom-workwear-surrey/`, `/company-uniforms-london/`, `/embroidered-polo-shirts-london/`, `/printed-workwear-london/`, `/custom-hi-vis-workwear/`, `/hospitality-uniforms-london/`, `/construction-workwear-london/`, `/school-leavers-hoodies-london/` — **none found**.

Closest existing equivalents are the generic category pages (`polos.html`, `hivis.html`, `workwear.html`, etc.) which are product-catalogue pages, not location/service landing pages with the FAQ/sector/lead-time content structure the brief wants. There's no existing `/embroidery/`, `/screen-printing/`, `/dtf-printing/`, `/dtg-printing/` service pages either, despite the relevant content existing as FAQ panels on the homepage.

No dedicated **About** or **Contact** page exists as a standalone file (`file_search` for `about*.html`, `contact*.html`, `faq*.html` returned nothing). Contact details (phone, email, address, map) appear embedded inside a shared contact popup component (`brandedukv15-child/assets/js/pc-header-template.js` → `BrandedPcContactTemplate`), not as a standalone indexable Contact page.

---

## 12. FAQ content

A real, substantial, genuinely-visible FAQ section exists in `home-pc.html` (`<section class="faq-section">`), organized in 4 tabs (Embroidery, DTF, Vinyl, Screen Printing) with real Q&A content (digitisation fees, minimums, turnaround times, wash durability, etc.). This is good content — but:
- It is **not duplicated/confirmed on the mobile homepage** in the same depth (needs a dedicated check against `index-mobile.html`/`mobile/` to confirm parity — ties into the separate mobile-architecture audit).
- It has **no `FAQPage` JSON-LD**, so it gets no rich-result/AI-citation benefit despite being real, visible content.
- Some figures in the FAQ (e.g., "25+ pieces" screen printing minimum, "£25 digitisation fee") should be cross-checked against the official operational data provided in the original brief (screen printing minimum: 25 garments ✓ matches; general minimum 8 garments — not mentioned in this FAQ; minimum order value £150 — not mentioned).

---

## 13. Open Graph / Social metadata

Spot-checked `index.html`, `home-pc.html`, `shop.html`: `og:title`, `og:description`, `og:image` (absolute URL), `og:site_name`, `og:locale`, and matching `twitter:card`/`twitter:title`/`twitter:image` are present and consistently absolute. No issues found here.

---

## 14–15. Product feed / Google-Bing compatibility

Not evaluated in depth in this pass — deferred to the dedicated `/docs/openai-product-feed-readiness.md` (Phase 39), since it requires inspecting live product API data (`api.brandeduk.com`), which is a separate backend service outside this repo's direct control.

## 16. Image SEO (Phases 15-22, spot check)

- **Naming convention is largely already good.** `brandedukv15-child/assets/images/services/` uses genuinely descriptive names (`screen-printing-streetwear-graffiti.jpg`, `embroidery-rocket-machine.jpg`, etc.) matching the brief's recommended pattern. No `IMG_1234.jpg` / `Screenshot-...` / `final-copy.jpg` style filenames were found among the ~530 local image assets checked.
- **Duplicate brand logos with inconsistent naming**: the `brands/` folder has multiple near-duplicate files per brand using different naming conventions for the same logo, e.g. `asquithfox_2020.jpg`, `asquithfox2020.jpg`, and `asquith-and-fox.jpg` all appear to be the same Asquith & Fox logo. This pattern repeats across several brands (AWDis, BC Collection, etc.). Not fixed in this pass — needs a dependency check (which filename each page actually references) before any safe de-duplication, per the brief's explicit renaming-safety rule.
- **Customizer type-selection icons are hosted externally** on `i.postimg.cc` (a free third-party image host), e.g. `https://i.postimg.cc/bvG3nXgM/Screenshot-2026-06-01-111523.png` used for "DTF Printing" / "Embroidery" / "Screen Printing" / "Vinyl Heat Press" icons in `customization-tool/index.html` and `customization-tool-mobile/index.html`. This isn't primarily a naming problem — it's a reliability/control risk: no SLA, no CDN guarantee, and the filename (date-stamped screenshot) can't be changed since it's not our asset to rename. Recommend migrating these specific icons into `brandedukv15-child/assets/images/` with proper descriptive names if/when there's time for that follow-up.

No image renaming was performed in this pass — only documented as findings, per the brief's Phase 19 safety rule (audit table first, no blind renaming).

---

## Summary table

| Area | Status |
|---|---|
| Crawler access (HTTP layer) | ✅ PASS — no blocking for any tested UA |
| Homepage crawlable content | 🔴 FAIL — near-empty static HTML, JS-only redirect |
| robots.txt | 🟡 WARNING — blocks render-critical assets (`/brandeduk.com/`, `/test-order-popup/`), one dead rule |
| Meta robots | ✅ PASS — no accidental noindex on public pages, private pages correctly noindexed |
| Canonical tags | 🟡 WARNING — correct domain/intent, but triplicated by hand across 3 files, 2 legal pages use non-clean URLs |
| WWW/HTTPS normalisation | 🟡 WARNING — works, but apex→www uses 307 instead of a permanent redirect |
| Sitemap | 🟡 WARNING — one redirecting URL included, uniform/stale lastmod dates |
| Structured data | 🟡 WARNING — Organization/WebSite present but address wrong (London vs Surbiton), duplicate sameAs, no FAQPage, no Product/Category schema |
| Core landing pages (Phase 4) | 🔴 NOT STARTED — none of the suggested URLs exist |
| About / Contact standalone pages | 🔴 NOT STARTED — content only exists inside shared popup components |

No code has been changed as part of this document. Proposed fixes will be tracked separately in `/docs/ai-search-seo-changes.md` once you confirm which of the above to act on first.
