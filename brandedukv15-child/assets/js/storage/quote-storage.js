/**
 * BrandedQuoteStorage
 *
 * quoteBasket in localStorage must stay small. Customer artwork never belongs
 * there as a data: URL. This module:
 *   1. Replaces data:image payloads with bklogo:<id> references
 *   2. Holds the original bytes in IndexedDB until /api/upload-logo returns a URL
 *   3. Reuses one id for the same artwork across garments and positions
 *   4. Migrates legacy baskets without localStorage.clear()
 *
 * Browser storage here is only the quote JSON + tiny logo refs.
 * Permanent artwork lives on DigitalOcean Spaces via /api/upload-logo.
 */
(function (window) {
  'use strict';

  var BASKET_KEY = 'quoteBasket';
  var GALLERY_KEY = 'brandeduk-logos';
  var IDB_NAME = 'brandeduk-artwork';
  var IDB_STORE = 'logos';
  var IDB_VERSION = 1;
  var REF_PREFIX = 'bklogo:';
  var UPLOAD_ENDPOINT = '/api/upload-logo';
  var SCHEMA_VERSION = 1;

  var IMAGE_KEYS = {
    logo: 1, url: 1, dataUrl: 1, fileData: 1, previewData: 1, logoData: 1,
    logoImage: 1, content: 1
  };

  var pendingById = {};
  var blobUrlById = {};
  var serverUrlById = {};
  var uploadInflight = {};
  var memoryBasket = null;
  var migrateStarted = false;

  function isDataUrl(value) {
    return typeof value === 'string' && value.indexOf('data:image') === 0;
  }

  function isHttpUrl(value) {
    return typeof value === 'string' && /^https?:\/\//i.test(value);
  }

  function isBlobUrl(value) {
    return typeof value === 'string' && value.indexOf('blob:') === 0;
  }

  function isLogoRef(value) {
    return typeof value === 'string' && value.indexOf(REF_PREFIX) === 0;
  }

  function refFor(id) {
    return REF_PREFIX + id;
  }

  function idForBlobUrl(url) {
    var ids = Object.keys(blobUrlById);
    for (var i = 0; i < ids.length; i++) {
      if (blobUrlById[ids[i]] === url) return ids[i];
    }
    return '';
  }

  function idFromRef(value) {
    return isLogoRef(value) ? value.slice(REF_PREFIX.length) : '';
  }

  function fingerprint(dataUrl) {
    var text = String(dataUrl || '');
    var hash = 2166136261;
    var step = Math.max(1, Math.floor(text.length / 2048));
    for (var i = 0; i < text.length; i += step) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    hash ^= text.length;
    return 'l' + (hash >>> 0).toString(16) + text.length.toString(16);
  }

  function classifyError(error, operation) {
    var name = error && error.name ? String(error.name) : '';
    var message = error && error.message ? String(error.message) : String(error || '');
    var status = error && error.status ? Number(error.status) : 0;
    var category = 'unknown';
    var customerMessage = 'Something went wrong. Please try again.';
    var recoverable = true;

    if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || /quota|storage full/i.test(message)) {
      category = 'quota_exceeded';
      customerMessage = 'The browser could not save this quote locally. Your design is still on screen — submit the quote or try again. Nothing was deleted.';
    } else if (/private|securityerror|the operation is insecure|storage is disabled/i.test(message) || name === 'SecurityError') {
      category = 'storage_unavailable';
      customerMessage = 'This browser is blocking saved quotes (often private mode). You can still finish this quote on this page.';
    } else if (status === 413 || /too large|max 5mb/i.test(message)) {
      category = 'file_too_large';
      customerMessage = 'That file is too large to upload. Please try a PNG or JPG version of your logo.';
    } else if (status === 415 || /unsupported media/i.test(message)) {
      category = 'invalid_file';
      customerMessage = 'That file type is not supported. Use PNG, JPG, WebP, GIF or SVG.';
    } else if (status === 401 || status === 403) {
      category = 'auth_session';
      customerMessage = 'The logo could not be uploaded. Refresh the page and try again.';
    } else if (status >= 500) {
      category = 'server_error';
      customerMessage = 'The logo service is unavailable. Your design is still on this page — try again in a moment.';
    } else if (status === 429) {
      category = 'server_error';
      customerMessage = 'Too many uploads just now. Please wait a few seconds and try again.';
    } else if (/failed to fetch|network|timeout|offline/i.test(message) || name === 'TypeError') {
      category = 'network_timeout';
      customerMessage = 'The logo could not be uploaded. Check your connection and try again. Your design is still on this page.';
    } else if (/invalid or unsupported image/i.test(message)) {
      category = 'invalid_file';
      customerMessage = 'That image could not be read. Try a PNG or JPG.';
    }

    return {
      category: category,
      customerMessage: customerMessage,
      recoverable: recoverable,
      operation: operation || '',
      name: name,
      status: status || undefined
    };
  }

  function logDiagnostic(info) {
    try {
      var payload = {
        source: 'BrandedQuoteStorage',
        category: info.category,
        operation: info.operation,
        status: info.status,
        recovered: !!info.recovered,
        keys: info.keys,
        sizes: info.sizes,
        ua: typeof navigator !== 'undefined' ? String(navigator.userAgent || '').slice(0, 160) : ''
      };
      console.warn('[quote-storage]', payload);
    } catch (e) { /* never log artwork */ }
  }

  function storageKeySizes() {
    var sizes = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key) continue;
        var value = localStorage.getItem(key) || '';
        sizes[key] = value.length;
      }
    } catch (e) { /* ignore */ }
    return sizes;
  }

  function walk(node, visit) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(function (item) { walk(item, visit); });
      return;
    }
    Object.keys(node).forEach(function (key) {
      var value = node[key];
      if (IMAGE_KEYS[key] && typeof value === 'string') visit(node, key, value);
      if (key === 'colorImage' || key === 'sourceColorImage' || key === 'originalColorImage' || key === 'garmentImage') {
        if (isDataUrl(value)) visit(node, key, value);
      }
      if (value && typeof value === 'object') walk(value, visit);
    });
  }

  function rememberLogo(id, dataUrl, filename) {
    if (!id || !dataUrl) return;
    pendingById[id] = { id: id, dataUrl: dataUrl, filename: filename || 'logo' };
    if (!blobUrlById[id] && typeof URL !== 'undefined' && URL.createObjectURL) {
      try {
        var parts = dataUrl.split(',');
        var mime = (dataUrl.match(/^data:([^;]+);/) || [])[1] || 'image/png';
        var binary = atob(parts[1] || '');
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        blobUrlById[id] = URL.createObjectURL(new Blob([bytes], { type: mime }));
      } catch (e) {
        blobUrlById[id] = dataUrl;
      }
    }
  }

  function slimBasket(basket) {
    var source = Array.isArray(basket) ? basket : [];
    var copy;
    try {
      copy = JSON.parse(JSON.stringify(source));
    } catch (e) {
      copy = source;
    }
    var extracted = [];
    walk(copy, function (obj, key, value) {
      if (isLogoRef(value)) {
        var existingId = idFromRef(value);
        if (obj && !obj.logoId) obj.logoId = existingId;
        return;
      }
      if (isHttpUrl(value)) return;
      if (isBlobUrl(value)) {
        // Hydrated refs become blob: URLs; callers that rebuild logo objects can
        // drop logoId, so map the URL back to its id instead of erasing the logo.
        var blobId = idForBlobUrl(value) || obj.logoId;
        if (blobId) {
          obj[key] = refFor(blobId);
          if (!obj.logoId) obj.logoId = blobId;
        } else {
          obj[key] = '';
        }
        return;
      }
      if (!isDataUrl(value)) return;
      var id = fingerprint(value);
      rememberLogo(id, value, obj.filename);
      extracted.push({ id: id, dataUrl: value, filename: obj.filename || 'logo' });
      obj[key] = refFor(id);
      if (!obj.logoId) obj.logoId = id;
    });
    return { basket: copy, extracted: extracted };
  }

  function hydrateBasket(basket) {
    if (!Array.isArray(basket)) return [];
    walk(basket, function (obj, key, value) {
      if (!isLogoRef(value)) return;
      var id = idFromRef(value);
      obj.logoId = obj.logoId || id;
      if (serverUrlById[id]) {
        obj[key] = serverUrlById[id];
        return;
      }
      if (blobUrlById[id]) {
        obj[key] = blobUrlById[id];
        return;
      }
      if (pendingById[id] && pendingById[id].dataUrl) {
        obj[key] = pendingById[id].dataUrl;
      }
    });
    return basket;
  }

  function resolveSrc(value, logoId) {
    if (isHttpUrl(value)) return value;
    var id = logoId || idFromRef(value);
    if (id && serverUrlById[id]) return serverUrlById[id];
    if (id && blobUrlById[id]) return blobUrlById[id];
    if (id && pendingById[id]) return pendingById[id].dataUrl;
    return isDataUrl(value) || isBlobUrl(value) ? value : '';
  }

  function openDb() {
    return new Promise(function (resolve) {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      try {
        var req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = function () {
          var db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE, { keyPath: 'id' });
          }
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { resolve(null); };
      } catch (e) {
        resolve(null);
      }
    });
  }

  function idbPut(entry) {
    return openDb().then(function (db) {
      if (!db) return false;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put({
            id: entry.id,
            dataUrl: entry.serverUrl ? '' : entry.dataUrl,
            serverUrl: entry.serverUrl || '',
            filename: entry.filename || 'logo',
            updatedAt: Date.now()
          });
          tx.oncomplete = function () { resolve(true); };
          tx.onerror = function () { resolve(false); };
        } catch (e) {
          resolve(false);
        }
      });
    });
  }

  function idbGetAll() {
    return openDb().then(function (db) {
      if (!db) return [];
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(IDB_STORE, 'readonly');
          var req = tx.objectStore(IDB_STORE).getAll();
          req.onsuccess = function () { resolve(req.result || []); };
          req.onerror = function () { resolve([]); };
        } catch (e) {
          resolve([]);
        }
      });
    });
  }

  function idbGet(id) {
    return openDb().then(function (db) {
      if (!db || !id) return null;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(IDB_STORE, 'readonly');
          var req = tx.objectStore(IDB_STORE).get(id);
          req.onsuccess = function () { resolve(req.result || null); };
          req.onerror = function () { resolve(null); };
        } catch (e) {
          resolve(null);
        }
      });
    });
  }

  /**
   * Return the actual artwork bytes for quote submission. Basket entries may
   * contain only a bklogo reference after Base64 data has moved to IndexedDB,
   * or a permanent Spaces URL after the background upload finishes.
   */
  function getQuoteFile(value, logoId) {
    var source = typeof value === 'string' ? value : '';
    var id = logoId || idFromRef(source);

    if (isDataUrl(source)) return Promise.resolve(source);
    if (id && pendingById[id] && isDataUrl(pendingById[id].dataUrl)) {
      return Promise.resolve(pendingById[id].dataUrl);
    }

    return idbGet(id).then(function (row) {
      if (row && isDataUrl(row.dataUrl)) {
        rememberLogo(id, row.dataUrl, row.filename);
        return row.dataUrl;
      }

      var remoteUrl = (id && serverUrlById[id])
        || (row && isHttpUrl(row.serverUrl) ? row.serverUrl : '')
        || (isHttpUrl(source) || isBlobUrl(source) ? source : '');
      if (!remoteUrl || typeof fetch !== 'function') return null;

      return fetch(remoteUrl, { credentials: 'omit' }).then(function (response) {
        if (!response.ok) return null;
        var contentType = String(response.headers && response.headers.get
          ? response.headers.get('content-type') || ''
          : '');
        if (contentType && contentType.indexOf('image/') !== 0) return null;
        return response.blob();
      }).then(function (blob) {
        return blob && (!blob.size || blob.size > 0) ? blob : null;
      }).catch(function () {
        return null;
      });
    });
  }

  function persistExtracted(extracted) {
    extracted.forEach(function (entry) {
      rememberLogo(entry.id, entry.dataUrl, entry.filename);
      idbPut(entry);
      uploadLogo(entry.id);
    });
  }

  function replaceRefsWithUrl(basket, id, url) {
    if (!Array.isArray(basket) || !id || !url) return;
    var ref = refFor(id);
    walk(basket, function (obj, key, value) {
      if (value === ref || obj.logoId === id) obj[key] = url;
    });
  }

  function uploadLogo(id) {
    var entry = pendingById[id];
    if (!entry || !entry.dataUrl || serverUrlById[id] || uploadInflight[id]) {
      return Promise.resolve(serverUrlById[id] || null);
    }
    if (window.BrandedLogoLibrary && typeof window.BrandedLogoLibrary.uploadToServer === 'function') {
      uploadInflight[id] = true;
      return window.BrandedLogoLibrary.uploadToServer(entry.dataUrl, null, entry.filename)
        .then(function (result) {
          uploadInflight[id] = false;
          var url = result && result.url;
          if (!url || !isHttpUrl(url)) return null;
          serverUrlById[id] = url;
          delete pendingById[id];
          idbPut({ id: id, serverUrl: url, filename: entry.filename });
          applyServerUrl(id, url);
          return url;
        })
        .catch(function (error) {
          uploadInflight[id] = false;
          logDiagnostic(Object.assign(classifyError(error, 'upload_logo'), { recovered: false }));
          return null;
        });
    }

    uploadInflight[id] = true;
    return fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo: entry.dataUrl, filename: entry.filename })
    }).then(function (res) {
      if (!res.ok) {
        var err = new Error('Upload failed (' + res.status + ')');
        err.status = res.status;
        throw err;
      }
      return res.json();
    }).then(function (data) {
      uploadInflight[id] = false;
      if (!data || !isHttpUrl(data.url)) return null;
      serverUrlById[id] = data.url;
      delete pendingById[id];
      idbPut({ id: id, serverUrl: data.url, filename: entry.filename });
      applyServerUrl(id, data.url);
      return data.url;
    }).catch(function (error) {
      uploadInflight[id] = false;
      logDiagnostic(Object.assign(classifyError(error, 'upload_logo'), { recovered: false }));
      return null;
    });
  }

  function applyServerUrl(id, url) {
    try {
      var basket = rawRead();
      replaceRefsWithUrl(basket, id, url);
      rawWrite(basket);
      memoryBasket = hydrateBasket(JSON.parse(JSON.stringify(basket)));
    } catch (e) { /* keep refs if rewrite fails */ }

    try {
      var gallery = JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]');
      var changed = false;
      if (Array.isArray(gallery)) {
        gallery.forEach(function (item) {
          if (!item) return;
          if (item.logoId === id || item.url === refFor(id) || isDataUrl(item.url)) {
            if (item.url !== url) {
              item.url = url;
              item.logoId = id;
              changed = true;
            }
          }
        });
        if (changed) localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
      }
    } catch (e) { /* ignore */ }
  }

  function slimGallery() {
    try {
      var logos = JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]');
      if (!Array.isArray(logos) || logos.length === 0) return;
      var changed = false;
      logos.forEach(function (item) {
        if (!item || !isDataUrl(item.url)) return;
        var id = fingerprint(item.url);
        rememberLogo(id, item.url, item.filename);
        persistExtracted([{ id: id, dataUrl: item.url, filename: item.filename }]);
        item.logoId = id;
        item.url = serverUrlById[id] || refFor(id);
        changed = true;
      });
      if (changed) localStorage.setItem(GALLERY_KEY, JSON.stringify(logos));
    } catch (e) { /* ignore */ }
  }

  function rawRead() {
    try {
      var parsed = JSON.parse(localStorage.getItem(BASKET_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function rawWrite(basket) {
    localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
  }

  function saveBasket(basket) {
    var source = Array.isArray(basket) ? basket : [];
    var slim = slimBasket(source);
    persistExtracted(slim.extracted);
    slimGallery();

    try {
      rawWrite(slim.basket);
      memoryBasket = hydrateBasket(JSON.parse(JSON.stringify(slim.basket)));
      return { ok: true, category: 'saved', extracted: slim.extracted.length };
    } catch (error) {
      var info = classifyError(error, 'save_basket');
      info.keys = Object.keys(storageKeySizes());
      info.sizes = storageKeySizes();
      try {
        slimGallery();
        rawWrite(slim.basket);
        memoryBasket = hydrateBasket(JSON.parse(JSON.stringify(slim.basket)));
        info.recovered = true;
        logDiagnostic(info);
        return { ok: true, category: 'saved_after_retry', extracted: slim.extracted.length };
      } catch (retryError) {
        memoryBasket = source;
        info.recovered = false;
        logDiagnostic(Object.assign(info, classifyError(retryError, 'save_basket_retry')));
        return {
          ok: false,
          category: info.category,
          customerMessage: info.customerMessage,
          error: retryError
        };
      }
    }
  }

  function loadBasket() {
    var stored = rawRead();
    if (memoryBasket && stored.length === 0) return memoryBasket;
    var hydrated = hydrateBasket(JSON.parse(JSON.stringify(stored)));
    memoryBasket = hydrated;
    if (!migrateStarted) {
      migrateStarted = true;
      migrateLegacy();
    }
    return hydrated;
  }

  function migrateLegacy() {
    return idbGetAll().then(function (rows) {
      rows.forEach(function (row) {
        if (!row || !row.id) return;
        if (row.serverUrl && isHttpUrl(row.serverUrl)) {
          serverUrlById[row.id] = row.serverUrl;
        } else if (row.dataUrl && isDataUrl(row.dataUrl)) {
          rememberLogo(row.id, row.dataUrl, row.filename);
          uploadLogo(row.id);
        }
      });
      var current = rawRead();
      var slim = slimBasket(current);
      if (slim.extracted.length > 0) {
        persistExtracted(slim.extracted);
        try { rawWrite(slim.basket); } catch (e) { /* keep refs in memory */ }
      }
      slimGallery();
      return slim.extracted.length;
    }).catch(function () { return 0; });
  }

  function persistLogo(dataUrl, filename) {
    if (isHttpUrl(dataUrl)) {
      return Promise.resolve({ ok: true, url: dataUrl, logoId: '' });
    }
    if (!isDataUrl(dataUrl)) {
      return Promise.resolve({ ok: false, category: 'invalid_file', customerMessage: 'That image could not be read. Try a PNG or JPG.' });
    }
    var id = fingerprint(dataUrl);
    rememberLogo(id, dataUrl, filename);
    persistExtracted([{ id: id, dataUrl: dataUrl, filename: filename }]);
    return uploadLogo(id).then(function (url) {
      return {
        ok: !!url,
        url: url || blobUrlById[id] || dataUrl,
        logoId: id,
        pending: !url,
        category: url ? 'saved' : 'network_timeout',
        customerMessage: url ? '' : 'The logo could not be uploaded. Check your connection and try again. Your design is still on this page.'
      };
    });
  }

  window.BrandedQuoteStorage = {
    version: SCHEMA_VERSION,
    saveBasket: saveBasket,
    loadBasket: loadBasket,
    migrateLegacy: migrateLegacy,
    persistLogo: persistLogo,
    slimBasket: slimBasket,
    hydrateBasket: hydrateBasket,
    resolveSrc: resolveSrc,
    getQuoteFile: getQuoteFile,
    classifyError: classifyError,
    isDataUrl: isDataUrl,
    isLogoRef: isLogoRef,
    fingerprint: fingerprint,
    refFor: refFor
  };
})(typeof window !== 'undefined' ? window : globalThis);
