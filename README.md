# brandeduk.com - Project Overview

Complete workwear e-commerce solution with custom product customization features for brandeduk.com.

## 📁 Project Structure

```
brandedukv15-child/      # ✅ WordPress child theme (PRODUCTION-READY)
├── assets/css/          # Modular CSS
├── assets/js/           # Modular JavaScript
├── assets/images/       # UI assets
├── templates/           # PHP templates
└── woocommerce/         # WooCommerce overrides

design-assets/           # Design source files
├── hi-viz/              # Hi-Viz product designs (.cdr)
└── hoodie/              # Hoodie product designs

mobile/                  # Mobile prototypes (development only)
├── css/                 # Mobile styles
├── js/                  # Mobile scripts
└── [demo folders]/      # Component demos

product-bar-demo/        # Product bar component demo
hero/                    # Hero section assets
tools/                   # Build & export scripts
dist/                    # Distribution ZIPs
```

## 🚀 Quick Start

### For WordPress Installation
1. ZIP the `brandedukv15-child/` folder
2. Upload via **Appearance → Themes → Add New → Upload Theme**
3. Activate the child theme
4. Ensure parent theme `teecheap` is installed

### For Local Development (Prototypes)
1. Open project in VS Code
2. Install Live Server extension
3. Right-click any `.html` file → "Open with Live Server"
4. Port: `5501` (configured in `.vscode/settings.json`)

## Guided mobile logo customizer

The mobile **Add your logo now** flow opens `customization-tool-mobile/index.html`.
`guided.css` and `guided.js` provide the product summary, position carousel, logo
library, the per-position technique popup and notes. The existing mobile `app.js`
continues to handle artwork, placement, pricing and basket serialization.
The desktop and mobile tools share technique/conflict rules through
`customization-tool/decoration-rules.js`.

- Product, colour and size quantities remain attached to the existing basket item;
  the customizer pins its ID in the URL rather than relying on an array index.
- There is no confirm/save button: every change is autosaved to the existing
  basket line (removing a logo also clears legacy copies). A fixed bottom bar shows
  the decoration total and save status, with **+ Add product** (opens the mobile
  shop) and **View basket** (opens the basket); both save any pending change first.
- Position cards scroll continuously (swipe, or mouse drag in desktop previews);
  there are no paging arrows or dots.
- Uploaded logos are kept for the browser session and logos already used on any
  basket line are offered again, so artwork never has to be uploaded twice.
- Position previews come from the customization configuration API. The advanced
  editor remains available below the notes.
- There is no global technique selector. The plus button opens a compact
  Embroidery/Printing popup before artwork selection; existing logos can then be
  reused, or a new image uploaded. Tapping a library logo opens the same popup for
  the active position, and tapping an assigned logo changes only that position's
  technique. Overlapping positions are removed only once the new logo is assigned.
- The guided upload accepts PNG, JPG, WEBP and SVG up to 25 MB. Other artwork
  formats are not advertised as supported by this image-based flow.

For an API-enabled local preview, use `npm run dev` (or set `DEV_PORT=5511`
before running it). A plain static server does not implement the `/__api` proxy;
VS Code Live Server is static too, so stop it before using the same port.
On a desktop browser, add `force=mobile` to preview the mobile route.

Focused checks:

```powershell
node --test tests\guided-customizer.test.cjs
node tests\guided-customizer.browser.cjs
```

The browser check uses Playwright and Microsoft Edge in an isolated context.
Playwright is not a project dependency; install it separately (for example
`npm install --no-save playwright`). It expects the `npm run dev` server at
`http://127.0.0.1:5510`; override with `CUSTOMIZER_TEST_URL`. It never changes
the basket in the user's preview browser.

## 📋 Requirements

- **WordPress**: 6.0+
- **WooCommerce**: 8.0+
- **Parent Theme**: `teecheap` (must match `Template:` in style.css)
- **PHP**: 7.4+

## 📦 Distribution

Ready-to-upload ZIPs are in the `dist/` folder.

To create a new ZIP:
```powershell
cd tools
.\export-zip.ps1
```

## 🔧 Development Notes

- **No inline CSS/JS** - Use modular files in `assets/css/` and `assets/js/`
- **State management** uses `localStorage` and `sessionStorage`
- **Pricing logic** - Search for `PRICING_RULES` in JS files
- See `.github/copilot-instructions.md` for detailed conventions

## 📄 Key Files

| File | Purpose |
|------|---------|
| `brandedukv15-child/style.css` | Theme header + CSS imports |
| `brandedukv15-child/functions.php` | Enqueue scripts/styles |
| `brandedukv15-child/header-mega.php` | Mega menu entry point |
| `tools/reorganize-folders.ps1` | Folder rename script |

---

**brandeduk.com** © 2026 - Workwear & Custom Apparel
