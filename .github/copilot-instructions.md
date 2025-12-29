# Copilot Instructions – brandeduk.com

## Project Structure

```
brandedukv15-child/      # WordPress child theme (PRODUCTION-READY)
├── assets/css/          # Modular CSS (base, layout, components/, pages/)
├── assets/js/           # Modular JS (core, menu, pages/, upload/)
├── assets/images/       # UI icons, brands, products, mockups
├── templates/           # PHP templates (header, parts, woocommerce)
└── woocommerce/         # WooCommerce overrides

design-assets/           # Source design files for customization
├── hi-viz/              # Hi-Viz product designs
└── hoodie/              # Hoodie product designs

mobile/                  # Mobile prototype pages (dev only)
├── css/                 # Mobile-specific styles
├── js/                  # Mobile-specific scripts
├── hero/                # Mobile hero section
├── footer/              # Mobile footer
├── faq-demo/            # FAQ component demo
├── social-buttons/      # Social icons demo
└── contact-form/        # Contact form demo

product-bar-demo/        # Product bar component demo
hero/                    # Hero section assets
tools/                   # Build scripts and utilities
dist/                    # Distribution ZIPs

*.html                   # Desktop prototype pages (dev only)
```

## Key Folders

| Folder | Purpose |
|--------|---------|
| `brandedukv15-child/` | WordPress child theme – ZIP and upload to WP |
| `design-assets/` | Raw design files (.cdr, etc.) |
| `mobile/` | Mobile HTML prototypes for Live Server |
| `product-bar-demo/` | Product bar component demo |
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
