# Server Setup Guide

## Problem: Directory Listing Instead of index.html

If you're seeing a directory listing instead of your `index.html` page, it means your local development server isn't configured to use `index.html` as the default file.

## Solutions

### Option 1: Use Live Server Extension (VS Code)

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` in the file explorer
3. Select "Open with Live Server"
4. The server will automatically serve `index.html` as the default page

### Option 2: Use Python HTTP Server

```bash
# Python 3
python -m http.server 5505

# Python 2
python -m SimpleHTTPServer 5505
```

Then navigate to: `http://localhost:5505/index.html`

### Option 3: Use Node.js http-server

```bash
# Install globally
npm install -g http-server

# Run server
http-server -p 5505 -o
```

### Option 4: Direct File Access

Instead of accessing `http://127.0.0.1:5505/`, try:
- `http://127.0.0.1:5505/index.html` (will redirect automatically)
- `http://127.0.0.1:5505/home-pc.html` (desktop version)
- `http://127.0.0.1:5505/shop-pc.html` (shop page)

## File Visibility

All files (`home-pc.html`, `shop-pc.html`, etc.) exist in the root directory. If they're not showing in the directory listing:

1. **Check file permissions** - Make sure files are readable
2. **Clear browser cache** - Hard refresh (Ctrl+F5)
3. **Check server configuration** - Some servers hide certain file types

## Quick Test

1. Open `index.html` directly in your browser (file:// protocol)
2. It should automatically redirect to either:
   - `index-mobile.html` (if screen width < 1024px)
   - `home-pc.html` (if screen width >= 1024px)

## Configuration Files Created

- `.htaccess` - For Apache servers
- `web.config` - For IIS servers  
- `.vscode/settings.json` - For VS Code Live Server

These files help ensure `index.html` is served as the default page.

