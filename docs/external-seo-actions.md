# External / Manual SEO Actions Required

These cannot be completed from within this repository — they require access to external dashboards, verified business accounts, or information only you can confirm.

## 1. Vercel dashboard
- ~~Apex → www redirect is `307` (temporary) instead of permanent.~~ — **Fixed 2026-10-01**: changed in Vercel Project → Domains → brandeduk.com → Edit → Redirect to Another Domain → `301 Moved Permanently` → `www.brandeduk.com`. Confirmed live.
- Confirm whether any **Deployment Protection** (password/SSO gate) is enabled on the production domain — if so, it would block all crawlers including OAI-SearchBot regardless of `robots.txt`.
- Confirm there is no **Vercel Firewall / rate-limiting rule** configured that could affect bot traffic (nothing is visible in the repo; this can only be checked in the dashboard).

## 2. Google Search Console
- Verify domain ownership (via DNS TXT record or HTML meta tag) if not already done.
- Submit `https://www.brandeduk.com/sitemap.xml`.
- Monitor the "Pages" / indexing report after the homepage content fix (Section 4 of the changes doc) to confirm Google starts indexing real homepage content instead of the empty splash shell.

## 3. Bing Webmaster Tools
- Verify domain ownership.
- Submit sitemap.
- Consider enabling **IndexNow** (Bing-backed, also used by some other search engines) if you want near-instant re-crawl notifications when content changes. This would need API key generation in Bing Webmaster Tools and a small script in this repo to ping it — not yet implemented, can be added on request.

## 4. Google Business Profile
- The current `sameAs` array has no Google Business Profile URL. If Branded UK / Branded Europe Limited has a verified Google Business Profile for the Surbiton location, send me the public URL and I'll add it to the structured data.

## 5. Verified social profiles
- Confirm the LinkedIn URL currently used in `sameAs` (`linkedin.com/in/anderson-ricotta-92a394321/`) is the one you want represented as the business's official profile — it's currently a personal profile URL, not a company page. If there's a dedicated LinkedIn Company Page for Branded UK / Branded Europe Limited, send me that URL instead.
- YouTube and Pinterest links already appear in some page headers/footers (e.g. `youtube.com/@barudanamericainc3060`, a Pinterest search URL) — confirm whether these should also be added to the Organization `sameAs`, and whether the YouTube channel is genuinely Branded UK's own channel.

## 6. Business data needed for remaining SEO phases
To proceed with Phase 4 (location/service landing pages), Phase 16 (central business-info object), and the About/Contact pages, the following confirmed facts are needed:
- VAT number / company registration number (for footer + LocalBusiness schema, if you want it displayed).
- ~~Confirmed opening hours~~ — **Confirmed 2026-10-01: open 7 days a week, 9:00–21:00.** Updated everywhere on the site (popup contact, footer, product/services pages) and added to the `openingHours` schema.org property.
- Confirmation of which of the brief's suggested landing-page URLs you actually want created (vs. optimising existing category pages instead).

## 7. OpenAI product feed (Phase 39)
- Submitting a merchant feed to OpenAI's Agentic Commerce Protocol requires an approved merchant account — not something available yet. The codebase can be prepared for feed generation (a script reading from the existing product API), but nothing can be submitted externally without that approval. No action needed from you right now; flagging so expectations are clear.
