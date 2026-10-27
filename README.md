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

## Support chat attachments

The shared support panel uploads PNG, JPG, GIF, WebP, SVG, PDF, AI and EPS
files (one at a time, maximum 3 MB) to `/api/chat-attachment`, then sends the
public file URL through Crisp's documented `message:send` file command.
Google sign-in and the existing Analytics-cookie consent are still required.
The panel displays a sent attachment only after Crisp's `message:sent` event.

Deploy the new Vercel function together with the frontend. It uses the same
`DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_BUCKET`, `DO_SPACES_REGION` and
optional `DO_SPACES_CDN_URL` as the existing logo uploader. Objects are stored
under `chat-attachments/` with unique keys and a download disposition; URLs
are public so Crisp operators can retrieve them. Do not send sensitive files.
Local static previews call the production upload endpoint, so uploads require
that endpoint to have been deployed. Test frontend flows with mocked uploads
before deployment; do not treat a queued SDK command as delivery confirmation.

Endpoint checks (storage mocked, no credentials or real uploads):

```powershell
node --experimental-vm-modules --test tests\chat-attachment.test.cjs
```

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
  reused, or a new image uploaded. Logos only go to a position the customer picked:
  tapping a library logo opens the same popup for a position they have tapped or
  used the + of; dropping a logo onto a position does the same for that position.
  Until a position is picked, library logos stay in the library and a hint explains
  how to place them. "Upload another logo" in the library only adds the artwork to
  the library (after the copyright check) without asking for a technique; print or
  embroidery is chosen when it is dropped on a position. Tapping an assigned logo changes only that position's
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
