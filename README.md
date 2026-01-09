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

**brandeduk.com** © 2025 - Workwear & Custom Apparel
