/**
 * logo-upload.js  (logo-library)
 * ─────────────────────────────────────────────────────────────────
 * Purpose:
 *   • Upload logos to Vercel Blob via /api/upload-logo
 *   • Keep a local gallery in localStorage so users can reuse
 *     previously uploaded logos across products
 *   • Expose a small render helper that builds the gallery HTML
 *
 * Storage key: localStorage['brandeduk-logos']
 * Each entry: { url, filename, uploadedAt, thumbnailUrl? }
 *
 * Public API (attached to window.BrandedLogoLibrary):
 *   getAll()              → Array of saved logos
 *   add(logoEntry)        → adds & persists
 *   remove(url)           → removes & persists
 *   clear()               → empties the gallery
 *   uploadToServer(base64DataUrl, position?, filename?)
 *                         → Promise<{ url, filename, size }>
 *   renderGallery(containerEl, { onSelect, onUploadNew })
 *                         → builds the thumbnail grid + "[+] Upload new" box
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'brandeduk-logos';
  const UPLOAD_ENDPOINT = '/api/upload-logo';   // Vercel serverless
  const MAX_LOGOS = 20;                          // prevent unbounded growth

  /* ── localStorage helpers ──────────────────────────── */

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function _save(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn('[LogoLibrary] localStorage save failed:', e.message);
    }
  }

  /* ── public methods ────────────────────────────────── */

  function getAll() {
    return _load();
  }

  function add(entry) {
    if (!entry || !entry.url) return;
    const logos = _load();
    // Deduplicate by URL
    if (logos.some(l => l.url === entry.url)) return;
    logos.unshift({
      url: entry.url,
      filename: entry.filename || 'logo',
      uploadedAt: entry.uploadedAt || new Date().toISOString(),
    });
    // Cap at MAX_LOGOS
    if (logos.length > MAX_LOGOS) logos.length = MAX_LOGOS;
    _save(logos);
  }

  function remove(url) {
    const logos = _load().filter(l => l.url !== url);
    _save(logos);
  }

  function clear() {
    _save([]);
  }

  /**
   * Upload a base64 data-URL logo to Vercel Blob.
   * Falls back to keeping the data-URL if the server is unreachable.
   */
  async function uploadToServer(base64DataUrl, position, filename) {
    // Guard: if already a remote URL, return as-is
    if (base64DataUrl && !base64DataUrl.startsWith('data:')) {
      return { url: base64DataUrl, filename: filename || 'logo', size: 0 };
    }

    try {
      const res = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: base64DataUrl, position, filename }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      // Auto-add to local gallery
      add({ url: data.url, filename: data.filename });
      return data;                       // { url, filename, size }
    } catch (err) {
      console.warn('[LogoLibrary] Server upload failed, keeping data-URL:', err.message);
      // Fallback: save data-URL locally (old behaviour)
      const fallback = {
        url: base64DataUrl,
        filename: filename || `logo-${Date.now()}`,
        size: base64DataUrl.length,
      };
      add(fallback);
      return fallback;
    }
  }

  /**
   * Build a gallery of previously uploaded logos inside `containerEl`.
   *
   * @param {HTMLElement} containerEl  – the wrapper that will receive the grid
   * @param {Object}      opts
   * @param {Function}    opts.onSelect     – called with (logoEntry) when a thumb is tapped
   * @param {Function}    opts.onUploadNew  – called when the "[+] Upload new" box is tapped
   */
  function renderGallery(containerEl, opts = {}) {
    if (!containerEl) return;
    const logos = _load();

    containerEl.innerHTML = '';                       // clear old content
    containerEl.classList.add('logo-gallery');

    // "[+] Upload new" button — always first
    const uploadBox = document.createElement('div');
    uploadBox.className = 'logo-gallery__item logo-gallery__upload-new';
    uploadBox.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span>Upload new</span>
    `;
    uploadBox.addEventListener('click', () => {
      if (typeof opts.onUploadNew === 'function') opts.onUploadNew();
    });
    containerEl.appendChild(uploadBox);

    // Logo thumbnails
    logos.forEach(logo => {
      const item = document.createElement('div');
      item.className = 'logo-gallery__item';
      item.dataset.url = logo.url;

      const img = document.createElement('img');
      img.src = logo.url;
      img.alt = logo.filename || 'Saved logo';
      img.loading = 'lazy';
      img.draggable = false;

      // Delete button (top right)
      const delBtn = document.createElement('button');
      delBtn.className = 'logo-gallery__delete';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Remove from library';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        remove(logo.url);
        item.remove();
      });

      item.appendChild(img);
      item.appendChild(delBtn);

      item.addEventListener('click', () => {
        // Visual feedback: highlight selected
        containerEl.querySelectorAll('.logo-gallery__item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        if (typeof opts.onSelect === 'function') opts.onSelect(logo);
      });

      containerEl.appendChild(item);
    });
  }

  /* ── expose ────────────────────────────────────────── */

  window.BrandedLogoLibrary = {
    getAll,
    add,
    remove,
    clear,
    uploadToServer,
    renderGallery,
  };
})();
