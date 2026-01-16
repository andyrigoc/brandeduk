# BrandedUK API flows & reference

This repo is primarily a **static frontend + WordPress child theme**, but it integrates with an external backend API hosted on Render:

- **Backend base URL:** `https://brandeduk-backend.onrender.com`
- **Backend API prefix:** `/api`

There are also **deployment-specific** endpoints:

- **Vercel serverless (this repo):** `/api/upload-logo` (see [api/upload-logo.js](../api/upload-logo.js))
- **WordPress/PHP mail helper (child theme):** `brandedukv15-child/includes/send-quote.php`

---

## Where API calls live

### Primary API client (recommended)
- [brandedukv15-child/assets/js/api.js](../brandedukv15-child/assets/js/api.js)
  - Exposes `window.BrandedAPI` with methods:
    - `getProducts(options)`
    - `getProductByCode(code)`
    - `getRelatedProducts(code, limit)`
    - `getProductTypes()`
    - `getFilterCounts(currentFilters)`
    - `getPriceRange()`
    - `getAllFilterOptions()`
    - `submitQuote(quoteData)`

### Direct fetch usage (also present)
- Product detail page JS: [brandedukv15-child/assets/js/pages/product.js](../brandedukv15-child/assets/js/pages/product.js)
  - Uses `https://brandeduk-backend.onrender.com/api` and calls `/products/:code`
- Mega menu product types: [brandeduk.com/js/product-types-menu.js](../brandeduk.com/js/product-types-menu.js)
  - Calls `/api/filters/product-types`

---

## State & data handoff (front-end flows)

These keys matter because they determine what gets sent to the quote endpoints.

### Basket
- `localStorage['quoteBasket']`: array of basket items used by multiple pages

### Customization flows
- `sessionStorage['customizingProduct']`: current product being customized
- `sessionStorage['selectedPositions']`: selected print/embroidery positions
- `sessionStorage['positionCustomizations']`: details per position
- `sessionStorage['positionCustomizationsMap']` (some flows): map-like structure for positions

---

## Backend API (Render) — Endpoint reference

Base: `https://brandeduk-backend.onrender.com`

### Health
- `GET /health`
  - Used by: `BrandedAPI.healthCheck()`

### Products
- `GET /api/products`
  - Used by: shop/catalog pages (via `BrandedAPI.getProducts()`)
  - Typical query params:
    - `page`, `limit`
    - `q` (search)
    - `productType`
    - `priceMin`, `priceMax`
    - `sort`
    - Multi-select filters (arrays):
      - `gender[]`, `ageGroup[]`, `sleeve[]`, `neckline[]`
      - `accreditations[]`
      - `primaryColour[]`, `colourShade[]`
      - `style[]`, `feature[]`, `tag[]`, `flag[]`
      - `fabric[]`, `weight[]`, `fit[]`
      - `sector[]`, `sport[]`
      - `effect[]`, `cmyk[]`, `pantone[]`
  - Response shape (observed from client expectations):
    - `{ items, page, limit, total, priceRange?, filters?/aggregations? }`

- `GET /api/products/{code}`
  - Used by: product detail
  - Response: a single product object (client transforms fields like `price`, `priceBreaks`, `colors`, etc.)

- `GET /api/products/{code}/related?limit=12`
  - Used by: related products section
  - Response shape (observed):
    - `{ currentProduct, related, total, sameBrandAndType?, sameTypeOnly? }`

- `GET /api/products/types`
  - Used by: `BrandedAPI.getProductTypes()`
  - Response shape (observed): `{ productTypes: [...] }`

### Filters
- `GET /api/filters/price-range`
- `GET /api/filters/genders`
- `GET /api/filters/age-groups`
- `GET /api/filters/sleeves`
- `GET /api/filters/necklines`
- `GET /api/filters/fabrics`
- `GET /api/filters/sizes`
- `GET /api/filters/primary-colors`
- `GET /api/filters/styles`
- `GET /api/filters/tags`
- `GET /api/filters/weights`
- `GET /api/filters/fits`
- `GET /api/filters/sectors`
- `GET /api/filters/sports`
- `GET /api/filters/effects`
- `GET /api/filters/accreditations`
- `GET /api/filters/colour-shades`
- `GET /api/filters/brands`

Additional filter endpoint used by the legacy PC pages:
- `GET /api/filters/product-types`
  - Used by: [brandeduk.com/js/product-types-menu.js](../brandeduk.com/js/product-types-menu.js)

### Quotes
- `POST /api/quotes`
  - Used by:
    - `BrandedAPI.submitQuote(quoteData)`
    - Mobile flows (fallback direct fetch)
    - Inline customize flow (fallback direct fetch)
  - Request body (observed from frontend + backend router):

```json
{
  "customer": {
    "fullName": "Jane Doe",
    "company": "Acme Ltd",
    "phone": "+44 ...",
    "email": "jane@example.com",
    "address": "..."
  },
  "summary": {
    "totalQuantity": 25,
    "totalItems": 2,
    "garmentCost": 123.45,
    "customizationCost": 67.89,
    "digitizingFee": 25,
    "subtotal": 216.34,
    "vatRate": 0.2,
    "vatAmount": 43.27,
    "totalExVat": 216.34,
    "totalIncVat": 259.61,
    "vatMode": "inc",
    "displayTotal": 259.61,
    "hasPoa": false
  },
  "basket": [
    {
      "name": "...",
      "code": "GD067",
      "color": "...",
      "quantity": 25,
      "sizes": {"S": 10, "M": 15},
      "unitPrice": 12.34,
      "itemTotal": 308.50,
      "image": "https://..."
    }
  ],
  "customizations": [
    {
      "position": "Left Chest",
      "method": "embroidery",
      "type": "logo",
      "hasLogo": true,
      "text": null,
      "unitPrice": 5,
      "lineTotal": 125,
      "quantity": 25
    }
  ],
  "timestamp": "2026-01-14T12:34:56.000Z"
}
```

Backend-side validation (observed in [backend-quotes-route-updated.js](../backend-quotes-route-updated.js)):
- requires `customer.email`
- requires `basket` array with at least 1 item

---

## WordPress/PHP quote submission (theme)

Some desktop/theme flows submit quotes via PHP rather than the Render backend.

- `POST brandedukv15-child/includes/send-quote.php`
  - Used by: [brandedukv15-child/assets/js/pages/customize-positions.js](../brandedukv15-child/assets/js/pages/customize-positions.js)
  - Payload is very similar to the JSON above; the PHP builds an HTML email and sends it.

Also note:
- [brandedukv15-child/assets/js/pages/quote-form.js](../brandedukv15-child/assets/js/pages/quote-form.js) calls `send-quote.php` as a *relative* URL. In WordPress deployment this likely resolves to the theme helper; in plain static/live-server it will not work.

---

## Vercel logo upload (serverless)

- `POST /api/upload-logo`
  - Handler: [api/upload-logo.js](../api/upload-logo.js)
  - Purpose: accept a logo image and return a URL (currently returns the same data URL; storage is TODO).

Important implementation note:
- Some client code sends `multipart/form-data` (via `FormData`) but the handler currently reads `req.body` like JSON. If you rely on this in production, you’ll want to align request/handler formats (either JSON-only or add multipart parsing / blob storage).

---

## End-to-end flows (quick map)

### 1) Browse catalogue (Shop)
1. UI collects filters
2. `BrandedAPI.getProducts(filters)` → `GET /api/products?...`
3. UI renders products + uses `priceRange` and `filters/aggregations` when present

### 2) Product detail
1. Product code is read from `sessionStorage['selectedProduct']`
2. `GET /api/products/{code}` to ensure fresh pricing / breaks
3. Product page renders tiers from `priceBreaks`

### 3) Customization + basket
1. Position selections stored in sessionStorage (and/or merged into `localStorage['quoteBasket']`)
2. VAT state stored in `localStorage['brandeduk-vat-mode']` and broadcast via `brandeduk:vat-change`

### 4) Quote submission
One of:
- Render backend: `POST /api/quotes`
- WordPress helper: `POST brandedukv15-child/includes/send-quote.php`

