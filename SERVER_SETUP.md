# Server Setup Guide

## Local shop shows 0 products (CORS)

`api.brandeduk.com` allows only production origins (`https://www.brandeduk.com`, `https://brandeduk.com`).
Browser requests from Live Server (`http://127.0.0.1:5510`) get **HTTP 403** → empty catalogue everywhere.

### Fix A — local CORS proxy (works with Live Server on 5510)

```bash
npm run api-proxy
```

Leave Live Server running. Hard-refresh the shop.
`api-config.js` on localhost uses `http://127.0.0.1:3005` → live API.

Or open shop via the VS Code **Go Live** task (starts the proxy if needed).

### Fix B — all-in-one (replaces Live Server on 5510)

```bash
# Stop Live Server first
npm run dev
```

Then open `http://127.0.0.1:5510/shop-pc.html` and set:

```html
<script>window.API_BASE_URL = location.origin + '/__api';</script>
```

before `api-config.js` (only needed if you are not using the :3005 proxy default).

### Fix C — permanent API allow-list (DigitalOcean)

On the **API** app env (DigitalOcean App Platform / wherever `api.brandeduk.com` runs):

```env
CORS_ORIGIN=https://www.brandeduk.com,https://brandeduk.com,http://127.0.0.1:5510,http://localhost:5510,http://127.0.0.1:5501,http://localhost:5501
```

Redeploy the API. Then Live Server can call the live API directly with:

```html
<script>window.API_USE_LOCAL_PROXY = false;</script>
```

before `api-config.js`.

---

## Problem: Directory Listing Instead of index.html

If you're seeing a directory listing instead of your `index.html` page, it means your local development server isn't configured to use `index.html` as the default file.

## Solutions

### Option 1: Live Server + `npm run api-proxy` (preferred)

1. Live Server on port **5510**
2. `npm run api-proxy` (port **3005**)
3. Open `shop-pc.html`

### Option 2: `npm run dev`

Serves static files on **5510** and proxies `/__api` → `https://api.brandeduk.com`.

### Option 3: Python HTTP Server

```bash
python -m http.server 5505
```

Still needs `npm run api-proxy` (or Fix C).

## Quick Test

```bash
npm run api-proxy
# other terminal:
# open http://127.0.0.1:5510/shop-pc.html?productType=T-Shirts
```

In DevTools → Network, product requests should go to `http://127.0.0.1:3005/api/products...` with status 200.
