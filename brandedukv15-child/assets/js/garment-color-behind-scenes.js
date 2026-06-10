/**
 * Campionamento colore capo "dietro le quinte".
 * La foto prodotto (thumb/main API) non sostituisce mai il PNG neutro in vista;
 * serve solo a ricavare l'hex per lo sfondo delle box logo.
 */
(function (global) {
  "use strict";

  const sampledHexCache = new Map();

  function normalizeHex(value) {
    const raw = String(value || "").trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return "";
    if (raw.length === 3) {
      return (
        "#" +
        raw
          .split("")
          .map(function (ch) {
            return ch + ch;
          })
          .join("")
          .toLowerCase()
      );
    }
    return "#" + raw.toLowerCase();
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map(function (n) {
          const v = Math.max(0, Math.min(255, Math.round(n)));
          return v.toString(16).padStart(2, "0");
        })
        .join("")
    );
  }

  function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
      s = delta / (1 - Math.abs(2 * l - 1));
      if (max === rn) h = ((gn - bn) / delta) % 6;
      else if (max === gn) h = (bn - rn) / delta + 2;
      else h = (rn - gn) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }

    return { h: h, s: s * 100, l: l * 100 };
  }

  async function sampleHexFromImage(url) {
    const source = String(url || "").trim();
    if (!source) return "";
    if (sampledHexCache.has(source)) return sampledHexCache.get(source);

    const task = new Promise(function (resolve) {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = function () {
        try {
          const sampleSize = 24;
          const canvas = document.createElement("canvas");
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            resolve("");
            return;
          }

          ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
          const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

          let sumR = 0;
          let sumG = 0;
          let sumB = 0;
          let weightTotal = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 140) continue;

            const hsl = rgbToHsl(r, g, b);
            if (hsl.l < 6 || hsl.l > 95) continue;

            const satWeight = 0.45 + Math.min(1, hsl.s / 100);
            const lightWeight = hsl.l > 82 ? 0.5 : 1;
            const weight = satWeight * lightWeight;

            sumR += r * weight;
            sumG += g * weight;
            sumB += b * weight;
            weightTotal += weight;
          }

          if (weightTotal <= 0) {
            resolve("");
            return;
          }

          resolve(
            rgbToHex(
              sumR / weightTotal,
              sumG / weightTotal,
              sumB / weightTotal
            )
          );
        } catch (err) {
          resolve("");
        }
      };

      img.onerror = function () {
        resolve("");
      };
      img.src = source;
    }).then(normalizeHex);

    sampledHexCache.set(source, task);
    return task;
  }

  function ensureHiddenSamplerImage(url) {
    if (typeof document === "undefined") return null;
    let el = document.getElementById("garment-color-sampler-hidden");
    if (!el) {
      el = document.createElement("img");
      el.id = "garment-color-sampler-hidden";
      el.alt = "";
      el.setAttribute("aria-hidden", "true");
      el.setAttribute("data-behind-scenes", "sampler");
      el.style.cssText =
        "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:auto;clip:rect(0,0,0,0);";
      document.body.appendChild(el);
    }
    if (url) el.src = url;
    return el;
  }

  async function resolveGarmentLogoBackgroundHex(options) {
    const opts = options || {};
    const imageUrl = String(opts.colorImageUrl || opts.thumbUrl || opts.mainUrl || "").trim();
    const apiHex = normalizeHex(opts.apiHex || opts.colorHex || "");

    if (imageUrl) {
      ensureHiddenSamplerImage(imageUrl);
      if (global.BrandedColorHex && typeof BrandedColorHex.sampleFromImage === "function") {
        const shared = await BrandedColorHex.sampleFromImage(imageUrl);
        if (shared) {
          return { hex: shared, source: "eyedropper" };
        }
      }
      const sampled = await sampleHexFromImage(imageUrl);
      if (sampled) {
        return { hex: sampled, source: "eyedropper" };
      }
    }

    if (apiHex) {
      return { hex: apiHex, source: "api" };
    }
    return { hex: "", source: "none" };
  }

  function applyLogoBoxGarmentBackground(root, hex) {
    if (typeof document === "undefined") return;
    const scope = root && root.querySelectorAll ? root : document;
    const safeHex = normalizeHex(hex);
    const bg = safeHex || "#f3f4f6";

    scope.querySelectorAll(
      ".position-preview-content, .uploaded-logo-box, .logo-thumb-wrap, [data-logo-box-garment-bg]"
    ).forEach(function (el) {
      if (safeHex) el.style.setProperty("--garment-bg", safeHex);
      else el.style.removeProperty("--garment-bg");
      el.style.backgroundColor = bg;
    });
  }

  const api = {
    normalizeHex: normalizeHex,
    sampleHexFromImage: sampleHexFromImage,
    ensureHiddenSamplerImage: ensureHiddenSamplerImage,
    resolveGarmentLogoBackgroundHex: resolveGarmentLogoBackgroundHex,
    applyLogoBoxGarmentBackground: applyLogoBoxGarmentBackground
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  global.GarmentColorBehindScenes = api;
})(typeof window !== "undefined" ? window : globalThis);
