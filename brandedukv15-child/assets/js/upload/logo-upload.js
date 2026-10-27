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
 *   fitForUpload(dataUrl, maxLength?)
 *                         → Promise<dataUrl> resized to fit the upload limit
 *   renderGallery(containerEl, { onSelect, onUploadNew })
 *                         → builds the thumbnail grid + "[+] Upload new" box
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'brandeduk-logos';
  const UPLOAD_ENDPOINT = '/api/upload-logo';   // Vercel serverless
  const MAX_LOGOS = 4;                           // max 4 logos in gallery
  const MAX_FILE_BYTES = 25 * 1024 * 1024;
  // Vercel rejects request bodies above ~4.5 MB, so bigger artwork is resized
  // in the browser (transparency kept) before upload instead of failing.
  const MAX_UPLOAD_DATA_URL_LENGTH = 3600000;
  const RETRY_UPLOAD_DATA_URL_LENGTH = 1800000;
  const UPLOAD_MAX_DIMENSIONS = [3000, 2400, 2000, 1600, 1200, 1000, 800];

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
    const url = entry.url;
    if (typeof url === 'string' && url.indexOf('data:image') === 0) {
      const storage = window.BrandedQuoteStorage;
      if (storage && typeof storage.persistLogo === 'function') {
        storage.persistLogo(url, entry.filename).then(function (result) {
          add({
            url: (result && result.url && result.url.indexOf('data:') !== 0) ? result.url : (result && result.logoId ? storage.refFor(result.logoId) : ''),
            logoId: result && result.logoId,
            filename: entry.filename,
            uploadedAt: entry.uploadedAt
          });
        });
        return;
      }
      return;
    }
    // Deduplicate by URL
    if (logos.some(l => l.url === url || (entry.logoId && l.logoId === entry.logoId))) return;
    logos.unshift({
      url: url,
      logoId: entry.logoId || '',
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

  /* ── upload size fitting ───────────────────────────── */

  function _loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to decode image'));
      image.src = src;
    });
  }

  let _webpEncodeSupport = null;
  function _canEncodeWebp() {
    if (_webpEncodeSupport === null) {
      try {
        const probe = document.createElement('canvas');
        probe.width = 1;
        probe.height = 1;
        // Safari silently returns PNG for unsupported encoder types.
        _webpEncodeSupport = probe.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      } catch (e) {
        _webpEncodeSupport = false;
      }
    }
    return _webpEncodeSupport;
  }

  function _hasTransparency(image) {
    try {
      const size = 96;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, size, size);
      const pixels = context.getImageData(0, 0, size, size).data;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255) return true;
      }
      return false;
    } catch (e) {
      return true;
    }
  }

  /**
   * Resize/re-encode an image data URL until it fits `maxLength` characters.
   * Small files are returned untouched; transparent artwork stays transparent.
   */
  async function fitForUpload(dataUrl, maxLength = MAX_UPLOAD_DATA_URL_LENGTH) {
    if (typeof dataUrl !== 'string' || dataUrl.indexOf('data:image/') !== 0 || dataUrl.length <= maxLength) {
      return dataUrl;
    }

    let image;
    try {
      image = await _loadImage(dataUrl);
    } catch (e) {
      return dataUrl;
    }

    const isSvg = dataUrl.indexOf('data:image/svg') === 0;
    const isJpeg = /^data:image\/jpe?g/i.test(dataUrl);
    const sourceWidth = image.naturalWidth || image.width || 2000;
    const sourceHeight = image.naturalHeight || image.height || 2000;
    const keepAlpha = !isJpeg && _hasTransparency(image);
    let types;
    if (keepAlpha) types = [_canEncodeWebp() ? 'image/webp' : 'image/png'];
    else types = isJpeg ? ['image/jpeg'] : ['image/png', 'image/jpeg'];
    let best = dataUrl;
    let lastWidth = 0;

    for (let i = 0; i < UPLOAD_MAX_DIMENSIONS.length; i += 1) {
      const ratio = UPLOAD_MAX_DIMENSIONS[i] / Math.max(sourceWidth, sourceHeight);
      // Vector art has no native resolution, so it may be rendered larger.
      const scale = isSvg ? ratio : Math.min(1, ratio);
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      if (width === lastWidth) continue;
      lastWidth = width;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      try {
        const context = canvas.getContext('2d');
        if (!context) break;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        if (!keepAlpha) {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, width, height);
        }
        context.drawImage(image, 0, 0, width, height);

        for (let t = 0; t < types.length; t += 1) {
          const candidate = canvas.toDataURL(types[t], 0.92);
          if (candidate.indexOf('data:image/') !== 0) continue;
          if (candidate.length < best.length) best = candidate;
          if (candidate.length <= maxLength) return candidate;
        }
      } catch (e) {
        break;
      } finally {
        // Release the bitmap immediately: iOS caps total canvas memory.
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    return best;
  }

  function _postLogo(dataUrl, position, filename) {
    return fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo: dataUrl, position, filename }),
    });
  }

  /**
   * Upload a base64 data-URL logo to DigitalOcean Spaces via the API.
   * Oversized images are resized first so they pass the upload limit.
   * Returns url '' (with error/status) if the server is unreachable.
   * NOTE: Does NOT auto-add to gallery - caller handles that.
   */
  async function uploadToServer(base64DataUrl, position, filename) {
    // Guard: if already a remote URL, return as-is
    if (base64DataUrl && !base64DataUrl.startsWith('data:')) {
      return { url: base64DataUrl, filename: filename || 'logo', size: 0 };
    }

    try {
      let payload = await fitForUpload(base64DataUrl, MAX_UPLOAD_DATA_URL_LENGTH);
      let res = await _postLogo(payload, position, filename);
      if (res.status === 413) {
        payload = await fitForUpload(payload, RETRY_UPLOAD_DATA_URL_LENGTH);
        res = await _postLogo(payload, position, filename);
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const error = new Error(errData.error || `Upload failed (${res.status})`);
        error.status = res.status;
        throw error;
      }

      const data = await res.json();
      return data;                       // { url, filename, size }
    } catch (err) {
      console.warn('[LogoLibrary] Server upload failed:', err.message);
      return {
        url: '',
        filename: filename || `logo-${Date.now()}`,
        size: 0,
        error: err.message,
        status: err.status || 0
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
    const isMobile = !!opts.mobile || window.matchMedia('(max-width: 699px)').matches;

    containerEl.innerHTML = '';
    containerEl.classList.add('logo-gallery');
    if (isMobile) containerEl.classList.add('logo-gallery--mobile');

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
        <h4>${isMobile ? 'Choose your logo' : 'Drag &amp; Drop Your Logo'}</h4>
        <p>${isMobile ? 'Tap Add Logo to select from your device' : 'or click to browse from your device'}</p>
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

    if (!isMobile) {
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
      dropzone.addEventListener('drop', (e) => {
        const files = [...e.dataTransfer.files].filter(f =>
          f.type.startsWith('image/') || /\.(pdf|ai|svg|eps)$/i.test(f.name)
        );
        if (files.length) _processFiles(files, containerEl, opts);
      });
    }

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
        const resolved = window.BrandedQuoteStorage && window.BrandedQuoteStorage.resolveSrc
          ? window.BrandedQuoteStorage.resolveSrc(logo.url, logo.logoId)
          : logo.url;
        img.src = resolved && resolved.indexOf('data:image') === 0 ? '' : resolved;
        if (!img.src && resolved) img.src = resolved;
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
      if (file.size > MAX_FILE_BYTES) {
        if (typeof window.showToast === 'function') {
          window.showToast(file.name + ' is too large (max 25MB)');
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

        const finish = (url, logoId) => {
          if (!url) return;
          add({
            url: url,
            logoId: logoId || '',
            filename: file.name,
            uploadedAt: new Date().toISOString(),
          });
          renderGallery(containerEl, opts);
        };

        if (window.BrandedQuoteStorage && typeof window.BrandedQuoteStorage.persistLogo === 'function') {
          window.BrandedQuoteStorage.persistLogo(dataUrl, file.name).then((result) => {
            const url = result && result.url && result.url.indexOf('data:') !== 0
              ? result.url
              : (result && result.logoId ? window.BrandedQuoteStorage.refFor(result.logoId) : '');
            finish(url, result && result.logoId);
            if (result && !result.ok && typeof window.showToast === 'function') {
              window.showToast(result.customerMessage || 'The logo could not be uploaded. Try again.');
            }
          });
          return;
        }

        uploadToServer(dataUrl, null, file.name).then(serverResult => {
          if (serverResult && serverResult.url && serverResult.url.indexOf('data:') !== 0) {
            finish(serverResult.url);
          } else if (typeof window.showToast === 'function') {
            window.showToast('The logo could not be uploaded. Check your connection and try again.');
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
    fitForUpload,
    renderGallery,
  };
})();
