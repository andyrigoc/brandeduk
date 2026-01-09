# Copilot Instructions – brandeduk.com

## Project Structure (Mobile-First)

```
/                        # ROOT - Unified Mobile-First Pages
├── index.html           # Homepage (mobile-first, responsive)
├── shop.html            # Shop page
├── customize.html       # Customization page
├── product.html         # Product detail page
├── basket.html          # Basket page
├── checkout.html        # Checkout page

brandedukv15-child/      # WordPress child theme (PRODUCTION-READY)
├── assets/css/          # Modular CSS (base, layout, components/, pages/)
│   └── responsive.css   # ⭐ TABLET/DESKTOP media queries
├── assets/js/           # Modular JS (core, menu, pages/, upload/)
├── assets/images/       # UI icons, brands, products, mockups
├── templates/           # PHP templates (header, parts, woocommerce)
└── woocommerce/         # WooCommerce overrides

mobile/                  # Mobile CSS/JS/assets (base styles)
├── css/                 # Mobile-first CSS (base styles)
│   ├── mobile.css       # Main mobile styles
│   ├── popup-contact.css
│   ├── faq.css
│   └── social-buttons.css
├── js/                  # Mobile JS
├── hero/                # Hero section (CSS + JS)
├── footer/              # Footer component
└── images/              # Mobile images

design-assets/           # Source design files for customization
hero/                    # Hero section images
tools/                   # Build scripts and utilities
dist/                    # Distribution ZIPs
```

## Mobile-First Architecture

**CSS Loading Order:**
1. `mobile/css/mobile.css` - Base mobile styles (default)
2. `mobile/hero/hero.css` - Hero component
3. `mobile/css/*.css` - Other mobile components
4. `brandedukv15-child/assets/css/responsive.css` - Tablet/Desktop overrides

**Breakpoints:**
- Mobile: 0 - 767px (default/base styles)
- Tablet: 768px+ (`@media (min-width: 768px)`)
- Desktop: 1024px+ (`@media (min-width: 1024px)`)

## Key Folders

| Folder | Purpose |
|--------|---------|
| `/` (root HTML) | Unified responsive pages (mobile-first) |
| `mobile/` | Mobile-first CSS, JS, and assets |
| `brandedukv15-child/` | WordPress child theme |
| `brandedukv15-child/assets/css/responsive.css` | Tablet/Desktop breakpoints |
| `design-assets/` | Raw design files (.cdr, etc.) |
| `tools/` | PowerShell scripts for export/build |
| `dist/` | Ready-to-upload ZIP files |

## Local dev workflows
- **Prototype (recommended for quick UI checks):**
  - Use VS Code Live Server (port is set to `5501` in `.vscode/settings.json`).
  - Root HTML files have been updated to load assets from `brandedukv15-child/assets/...`.
- **WordPress/WooCommerce:**
  - Zip/upload `brandedukv15-child/` (or use the prepared `dist/brandeduk.comv15.zip`).
  - Ensure `Template:` in `brandedukv15-child/style.css` matches the parent theme folder name.

## Conventions / patterns
- **No inline CSS/JS** in templates/pages. Put styles in CSS files and behaviors in JS files.
- **State passing in prototype JS** relies heavily on `localStorage` / `sessionStorage`:
  - Basket: `localStorage['quoteBasket']`
  - Customization flows: `sessionStorage['customizingProduct']`, `sessionStorage['selectedPositions']`, `sessionStorage['positionCustomizations']`
- Pricing is tiered per product code in multiple scripts; when changing pricing logic, search for `PRICING_RULES`.

## Where to edit what
- Header/mega menu markup: `brandedukv15-child/templates/header/header-mega.php` (WordPress entry: `brandedukv15-child/header-mega.php`)
- Product/basket/customization page behaviors (prototype-ported): `brandedukv15-child/assets/js/pages/`
- Global utilities: `brandedukv15-child/assets/js/core.js`
- Enqueue and hooks only (keep clean): `brandedukv15-child/functions.php`

## Guardrails for agents
- Prefer **small, surgical changes**: update the modular file that owns the concern (page CSS vs component CSS).
- If modifying prototype HTML, keep it **linking to the child theme assets** (don’t reintroduce root `*.css` / `*.js`).
- Don’t introduce build tools (npm/webpack) unless the repo adds them explicitly.
