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
  const MAX_LOGOS = 4;                           // max 4 logos in gallery

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
   * NOTE: Does NOT auto-add to gallery - caller handles that.
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
      // DO NOT auto-add here - _processFiles handles gallery updates
      return data;                       // { url, filename, size }
    } catch (err) {
      console.warn('[LogoLibrary] Server upload failed, keeping data-URL:', err.message);
      // Fallback: return data-URL (caller already added to gallery)
      return {
        url: base64DataUrl,
        filename: filename || `logo-${Date.now()}`,
        size: base64DataUrl.length,
      };
    }
  }

  /**
   * Build a gallery of previously uploaded logos inside `containerEl`.
   * Includes a drag-and-drop upload zone and a thumbnail grid with
   * hover overlays, delete buttons, and selection state.
   *
   * @param {HTMLElement} containerEl  – the wrapper that will receive the grid
   * @param {Object}      opts
   * @param {Function}    opts.onSelect     – called with (logoEntry) when a thumb is tapped
   * @param {Function}    opts.onUploadNew  – called when the "[+] Upload new" box is tapped
   */
  function renderGallery(containerEl, opts = {}) {
    if (!containerEl) return;
    const logos = _load();

    containerEl.innerHTML = '';
    containerEl.classList.add('logo-gallery');

    /* ── Drag & Drop Upload Zone ────────────────────── */
    const dropzone = document.createElement('div');
    dropzone.className = 'logo-gallery__dropzone';
    dropzone.innerHTML = `
      <div class="logo-gallery__dropzone-content">
        <div class="logo-gallery__upload-icon">
          <svg viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
        </div>
        <h4>Drag &amp; Drop Your Logo</h4>
        <p>or click to browse from your device</p>
        <label class="logo-gallery__browse-btn">
          <span>Add Logo</span>
        </label>
        <div class="logo-gallery__file-types">
          JPG, PNG, GIF, WebP, SVG, PDF, AI, EPS
        </div>
      </div>
    `;

    // Hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf,.ai,.svg,.eps';
    fileInput.style.display = 'none';
    fileInput.multiple = true;
    dropzone.appendChild(fileInput);

    // Browse btn / dropzone click → open file picker
    dropzone.addEventListener('click', (e) => {
      if (e.target === fileInput) return;
      fileInput.click();
    });

    // Drag events
    ['dragenter', 'dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    // Drop handler
    dropzone.addEventListener('drop', (e) => {
      const files = [...e.dataTransfer.files].filter(f =>
        f.type.startsWith('image/') || /\.(pdf|ai|svg|eps)$/i.test(f.name)
      );
      if (files.length) _processFiles(files, containerEl, opts);
    });

    // File input change handler
    fileInput.addEventListener('change', (e) => {
      const files = [...e.target.files];
      if (files.length) _processFiles(files, containerEl, opts);
      fileInput.value = '';
    });

    containerEl.appendChild(dropzone);

    /* ── Gallery Grid (if logos exist) ───────────────── */
    if (logos.length > 0) {
      // Header
      const header = document.createElement('div');
      header.className = 'logo-gallery__header';
      header.innerHTML = `
        <h4>Your Logos <span class="logo-gallery__count">${logos.length}</span></h4>
        <button type="button" class="logo-gallery__clear-all">Clear All</button>
      `;
      header.querySelector('.logo-gallery__clear-all').addEventListener('click', () => {
        clear();
        renderGallery(containerEl, opts);
      });
      containerEl.appendChild(header);

      // Grid
      const grid = document.createElement('div');
      grid.className = 'logo-gallery__grid';

      logos.forEach(logo => {
        const item = document.createElement('div');
        item.className = 'logo-gallery__item';
        item.dataset.url = logo.url;

        const img = document.createElement('img');
        img.src = logo.url;
        img.alt = logo.filename || 'Saved logo';
        img.loading = 'lazy';
        img.draggable = false;

        // Filename label
        const fname = document.createElement('div');
        fname.className = 'logo-gallery__filename';
        fname.textContent = logo.filename || 'logo';

        item.appendChild(img);
        item.appendChild(fname);

        // Select handler
        item.addEventListener('click', () => {
          grid.querySelectorAll('.logo-gallery__item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          if (typeof opts.onSelect === 'function') opts.onSelect(logo);
        });

        grid.appendChild(item);
      });

      containerEl.appendChild(grid);
    }
  }

  /**
   * Process dropped/selected files: read → optional compress → add to gallery
   */
  function _processFiles(files, containerEl, opts) {
    const currentCount = _load().length;
    if (currentCount >= MAX_LOGOS) {
      if (typeof window.showToast === 'function') window.showToast('Max ' + MAX_LOGOS + ' logos allowed');
      return;
    }
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        if (typeof window.showToast === 'function') {
          window.showToast(file.name + ' is too large (max 10MB)');
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;

        // If caller wants to handle the file first (e.g. preview + BG removal)
        if (typeof opts.onFileUploaded === 'function') {
          opts.onFileUploaded(dataUrl, file);
          return;
        }

        // Default: add to local gallery immediately
        const entry = {
          url: dataUrl,
          filename: file.name,
          uploadedAt: new Date().toISOString(),
        };
        add(entry);

        // Check max limit
        const current = _load();
        if (current.length > MAX_LOGOS) {
          if (typeof window.showToast === 'function') window.showToast('Max ' + MAX_LOGOS + ' logos allowed');
          return;
        }

        // Re-render gallery to show the new logo (don't auto-select)
        renderGallery(containerEl, opts);

        // Attempt server upload in background
        uploadToServer(dataUrl, null, file.name).then(serverResult => {
          if (serverResult && serverResult.url && serverResult.url !== dataUrl) {
            // Replace local data-URL with CDN URL
            const logos = _load();
            const idx = logos.findIndex(l => l.url === dataUrl);
            if (idx !== -1) {
              logos[idx].url = serverResult.url;
              _save(logos);
            }
          }
        }).catch(() => {});
      };
      reader.readAsDataURL(file);
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
