const state = {
  product: "polo",
  productName: "Polo",
  productCode: "SKU-2024",
  brandName: "GILDAN",
  brandLogo: "",
  selectedColorImage: "",
  colourName: "White",
  colourHex: "#ffffff",
  sizes: [{ size: "Medium", qty: 1 }],
  totalQty: 1,
  selectedArea: "front",
  decorationType: null,
  textType: null,
  uploadedLogo: null,
  originalUploadedLogo: null,
  copyrightConfirmed: false,
  text: "",
  textColour: "#ff2b2b",
  font: "Arial",
  textAlign: "center",
  names: [],
  basePrice: 11.99,
  price: 11.99,
  logoRotation: 0,
  textRotation: 0,
  logoZIndex: 40
};

// Calibration: print area width = 30cm. Computed dynamically from actual rendered customArea.
const PRINT_AREA_WIDTH_CM = 30;
const INITIAL_LOGO_WIDTH_CM = 30;
// Beanie embroidery is physically much smaller than the printable reference used
// for garments, so its cm readout is calibrated separately: the visual size that
// fills the cuff area must read ~6cm tall (≈ 10.40cm at the default scale → 6cm).
const BEANIE_CM_SCALE = 10.4 / 6;
const BEANIE_INITIAL_HEIGHT_CM = 6;

function getPrintableAreaRatioByView(area) {
  const key = String(area || "").toLowerCase();
  if (key === "left" || key === "right") return { w: 0.26, h: 0.46 };
  if (key === "left-sleeve" || key === "right-sleeve") return { w: 0.2, h: 0.36 };
  if (key === "left-chest" || key === "right-chest") return { w: 0.24, h: 0.3 };
  return { w: 0.42, h: 0.52 }; // front/back default
}

function getPrintableReferenceWidthPx() {
  const ratio = getPrintableAreaRatioByView(state.selectedArea);
  const garmentWidth = Math.max(
    0,
    productShape?.clientWidth || 0,
    Math.round(productShape?.getBoundingClientRect?.().width || 0)
  );

  if (garmentWidth > 20) {
    return Math.max(96, garmentWidth * ratio.w);
  }

  const fallback = customArea ? customArea.clientWidth * ratio.w : 120;
  return Math.max(96, fallback || 120);
}

function getPrintableReferenceHeightPx() {
  const ratio = getPrintableAreaRatioByView(state.selectedArea);
  const garmentHeight = Math.max(
    0,
    productShape?.clientHeight || 0,
    Math.round(productShape?.getBoundingClientRect?.().height || 0)
  );

  if (garmentHeight > 20) {
    return Math.max(120, garmentHeight * ratio.h);
  }

  const fallback = customArea ? customArea.clientHeight * ratio.h : 180;
  return Math.max(120, fallback || 180);
}

function getPxPerCm() {
  const refWidth = getPrintableReferenceWidthPx();
  return refWidth / PRINT_AREA_WIDTH_CM;
}

// Effective px-per-cm used for size labels and the initial fit. Beanies use a
// dedicated calibration so the embroidery reads at realistic cm values.
function getEffectivePxPerCm() {
  const base = getPxPerCm();
  return state.product === "beanie" ? base * BEANIE_CM_SCALE : base;
}

const screens = document.querySelectorAll(".screen");
const productPreview = document.getElementById("productPreview");
const customArea = document.getElementById("customArea");
const productShape = document.getElementById("productShape");
const colourGrid = document.getElementById("colourGrid");
const selectedColourName = document.getElementById("selectedColourName");
const selectedCanvasColourName = document.getElementById("selectedCanvasColourName");
const sheetColourLabel = document.getElementById("sheetColourLabel");
const productSelect = document.getElementById("productSelect");
const productPageTitle = document.getElementById("productPageTitle");
const sizesContainer = document.getElementById("sizesContainer");
const mainQtyInput = document.getElementById("mainQtyInput");
const basketTotalAmount = document.getElementById("basketTotalAmount");
const basketTotalMeta = document.getElementById("basketTotalMeta");
const cartBadge = document.querySelector(".cart-badge");
const toolBottomBasketBadge = document.getElementById("toolBottomBasketBadge");
const toolBottomNav = document.querySelector(".tool-bottom-nav");
const confirmQualityBtn = document.getElementById("confirmQualityBtn");

const colourLayer = document.getElementById("colourLayer");
const designLayer = document.getElementById("designLayer");
const uploadedLogo = document.getElementById("uploadedLogo");

function getLogoFrameEl() {
  return designLayer?.querySelector(".logo-frame") || designLayer;
}
const logoSettingsBtn = document.getElementById("logoSettingsBtn");
const deleteLogoBtn = document.getElementById("deleteLogoBtn");
const logoSizeLabel = document.getElementById("logoSizeLabel");
const rotateHandle = document.getElementById("rotateHandle");

const textLayer = document.getElementById("textLayer");
const textContent = document.getElementById("textContent");
const textSettingsBtn = document.getElementById("textSettingsBtn");
const deleteTextBtn = document.getElementById("deleteTextBtn");
const textRotateHandle = document.getElementById("textRotateHandle");
const textSizeLabel = document.getElementById("textSizeLabel");
const phBrandLogo = document.getElementById("phBrandLogo");
const phBrandText = document.getElementById("phBrandText");
const customizerBackLink = document.getElementById("customizerBackLink");
const customizerBreadcrumbLabel = document.getElementById("customizerBreadcrumbLabel");
const customizerLoadingOverlay = document.getElementById("customizerLoadingOverlay");
const customizerLoadingStatus = document.getElementById("customizerLoadingStatus");
const customizerLoadingProgress = document.getElementById("customizerLoadingProgress");
const customizerLoadingProgressBar = document.getElementById("customizerLoadingProgressBar");

let customizerLoadingValue = 12;
let customizerLoadingTimer = null;
let customizerLoadingFinished = false;

function updateCustomizerLoadingProgress(nextValue) {
  const value = Math.max(0, Math.min(100, Number(nextValue) || 0));
  customizerLoadingValue = value;
  if (customizerLoadingProgressBar) {
    customizerLoadingProgressBar.style.width = `${value}%`;
  }
  if (customizerLoadingProgress) {
    customizerLoadingProgress.setAttribute("aria-valuenow", String(Math.round(value)));
  }
}

function setCustomizerLoadingStatus(text) {
  if (!customizerLoadingStatus) return;
  customizerLoadingStatus.textContent = String(text || "Loading colours and mockups...");
}

function startCustomizerLoadingProgress() {
  if (!customizerLoadingOverlay || customizerLoadingTimer) return;

  updateCustomizerLoadingProgress(customizerLoadingValue);
  customizerLoadingTimer = setInterval(() => {
    if (customizerLoadingValue >= 92) return;
    const step = 2 + Math.random() * 5;
    updateCustomizerLoadingProgress(Math.min(92, customizerLoadingValue + step));
  }, 130);
}

function finishCustomizerLoading() {
  if (!customizerLoadingOverlay || customizerLoadingFinished) return;
  customizerLoadingFinished = true;

  if (customizerLoadingTimer) {
    clearInterval(customizerLoadingTimer);
    customizerLoadingTimer = null;
  }

  setCustomizerLoadingStatus("Customiser ready");
  updateCustomizerLoadingProgress(100);

  window.setTimeout(() => {
    customizerLoadingOverlay.classList.add("is-hidden");
    customizerLoadingOverlay.setAttribute("aria-busy", "false");
  }, 220);
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((resolve) => setTimeout(resolve, timeoutMs))
  ]);
}

function updateSelectedColourLabels(colourName) {
  const safeName = String(colourName || "").trim() || "White";
  if (selectedColourName) selectedColourName.textContent = safeName;
  if (selectedCanvasColourName) selectedCanvasColourName.textContent = safeName;
}

function updateAvailableColoursLabel() {
  if (!sheetColourLabel) return;
  const count = Array.isArray(colours) ? colours.length : 0;
  sheetColourLabel.textContent = count > 0 ? `Colour (${count})` : "Colour";
}

/** PNG neutro per area (sidebar / mockup) — mai il thumbnail API. */
function resolveNeutralGarmentPngForArea(area) {
  const normalizedArea = String(area || "front").trim() || "front";
  if (state.product === "beanie") {
    return beanieFrontImage;
  }

  const tabThumb = document.querySelector(
    `.view-tabs-side .view-tab[data-area="${normalizedArea}"] .view-thumb`
  );
  const tabSrc = tabThumb?.getAttribute("src") || tabThumb?.currentSrc || "";
  if (tabSrc) return tabSrc;

  if (state.product === "tshirt" && normalizedArea === "front") {
    return tshirtFrontCustomImage;
  }
  return tshirtImages[normalizedArea] || tshirtImages.front;
}

function isWhiteColourName(name) {
  return /\b(white|off[\s-]?white|arctic white|natural)\b/i.test(String(name || ""));
}

function applyGarmentTintHex(hex) {
  const thumbUrl = state.selectedColorImage || getColourImageForName(state.colourName);
  const BCH = brandedColour();
  let tintHex = BCH && typeof BCH.getImageHexSync === "function" ? BCH.getImageHexSync(thumbUrl) : "";

  if (!tintHex) {
    tintHex = resolveGarmentDisplayHex(hex, state.colourName, state.productCode, thumbUrl);
  }
  if (!tintHex && state.colourHex && !isPlaceholderSwatchHex(state.colourHex)) {
    tintHex = state.colourHex;
  }
  if (!tintHex && isWhiteColourName(state.colourName)) {
    tintHex = "#ffffff";
  }
  if (!tintHex || (tintHex === "#ffffff" && !isWhiteColourName(state.colourName))) {
    return;
  }

  state.colourHex = tintHex;
  if (colourLayer) colourLayer.style.backgroundColor = tintHex;
  syncViewThumbTint();
}

/** Eyedropper RGB dal thumbnail API — mai dal nome colore. */
async function refreshColourHexFromProductThumb(options) {
  const opts = options || {};
  const thumbUrl = String(
    opts.thumbUrl ||
    state.selectedColorImage ||
    getColourImageForName(state.colourName) ||
    ""
  ).trim();
  if (!thumbUrl) return state.colourHex || "#ffffff";

  const apiHexOnly = normalizeHex(opts.apiHex || "");

  let sampled = "";
  const BCH = brandedColour();
  if (BCH && typeof BCH.resolveGarmentHexAsync === "function") {
    sampled = await BCH.resolveGarmentHexAsync(
      state.colourName,
      state.productCode,
      thumbUrl,
      apiHexOnly
    );
  } else {
    const G = window.GarmentColorBehindScenes;
    if (G && typeof G.resolveGarmentLogoBackgroundHex === "function") {
      G.ensureHiddenSamplerImage(thumbUrl);
      const resolved = await G.resolveGarmentLogoBackgroundHex({
        colorImageUrl: thumbUrl,
        apiHex: apiHexOnly
      });
      sampled = resolved?.hex || "";
    }
  }

  if (!sampled || isPlaceholderSwatchHex(sampled)) {
    return state.colourHex || "";
  }

  state.colourHex = sampled;
  const colourIdx = colours.findIndex(
    ([name]) => normalizeColorKey(name) === normalizeColorKey(state.colourName)
  );
  if (colourIdx >= 0) colours[colourIdx][1] = sampled;
  if (BCH && typeof BCH.register === "function") {
    BCH.register(state.colourName, sampled, state.productCode);
  }
  applyGarmentTintHex(sampled);
  renderColours();
  renderMiniColours();
  return sampled;
}

async function hydrateGarmentColoursFromThumbs(productCode) {
  const BCH = brandedColour();
  if (!BCH || typeof BCH.sampleFromImage !== "function" || !Array.isArray(colours) || colours.length === 0) {
    return false;
  }

  let changed = false;
  await Promise.allSettled(
    colours.map(async ([name, currentHex], index) => {
      const imageUrl = getColourImageForName(name);
      if (!imageUrl) return;
      if (BCH.getImageHexSync && BCH.getImageHexSync(imageUrl)) return;

      const sampled = await BCH.sampleFromImage(imageUrl);
      if (!sampled || isPlaceholderSwatchHex(sampled)) return;

      colours[index][1] = sampled;
      BCH.register(name, sampled, productCode);
      changed = true;
    })
  );

  return changed;
}

function applySelectedProductColour(name, hex) {
  state.colourName = name;
  state.selectedColorImage = getColourImageForName(name) || "";
  updateSelectedColourLabels(name);
  applyGarmentTintHex(hex || "");

  refreshColourHexFromProductThumb({
    apiHex: normalizeHex(hex || ""),
    thumbUrl: state.selectedColorImage
  }).then(() => {
    applyArea();
  });

  document.querySelectorAll(".colour-swatch, .mini-swatch").forEach((item) => {
    item.classList.toggle("selected", item.title === name);
  });
}

function syncViewThumbTint() {
  const thumbUrl = state.selectedColorImage || getColourImageForName(state.colourName);
  const BCH = brandedColour();
  let safeHex = BCH && typeof BCH.getImageHexSync === "function" ? BCH.getImageHexSync(thumbUrl) : "";
  if (!safeHex) {
    safeHex = resolveGarmentDisplayHex(
      state.colourHex,
      state.colourName,
      state.productCode,
      thumbUrl
    );
  }
  if (!safeHex || (safeHex === "#ffffff" && !isWhiteColourName(state.colourName))) {
    safeHex = "";
  }

  document.querySelectorAll(".view-tabs-side .view-tab").forEach((tabBtn) => {
    const thumbImg = tabBtn.querySelector(".view-thumb");
    if (!thumbImg) return;

    let thumbWrap = tabBtn.querySelector(".view-thumb-wrap");
    if (!thumbWrap) {
      thumbWrap = document.createElement("span");
      thumbWrap.className = "view-thumb-wrap";
      thumbImg.parentNode.insertBefore(thumbWrap, thumbImg);
      thumbWrap.appendChild(thumbImg);
    }

    let colourLayer = thumbWrap.querySelector(".view-thumb-colour-layer");
    if (!colourLayer) {
      colourLayer = document.createElement("span");
      colourLayer.className = "view-thumb-colour-layer";
      thumbWrap.appendChild(colourLayer);
    }

    const thumbSrc = thumbImg.currentSrc || thumbImg.getAttribute("src") || "";
    if (!thumbSrc) return;

    if (!safeHex) {
      colourLayer.style.opacity = "0";
      return;
    }

    colourLayer.style.opacity = "1";
    colourLayer.style.backgroundColor = safeHex;
    colourLayer.style.webkitMaskImage = `url("${thumbSrc}")`;
    colourLayer.style.maskImage = `url("${thumbSrc}")`;
  });
}

const removeBackgroundCheck = document.getElementById("removeBackgroundCheck");
const resizeProportionallyCheck = document.getElementById("resizeProportionallyCheck");
const applyImagePropertiesBtn = document.getElementById("applyImagePropertiesBtn");
const propertySizeLabel = document.getElementById("propertySizeLabel");
const rotateInput = document.getElementById("rotateInput");

const textPropertyInput = document.getElementById("textPropertyInput");
const textPropertyColour = document.getElementById("textPropertyColour");
const textResizeProportionallyCheck = document.getElementById("textResizeProportionallyCheck");
const textRotateInput = document.getElementById("textRotateInput");
const textPropertySizeLabel = document.getElementById("textPropertySizeLabel");

const FALLBACK_COLOURS = [
  ["White", "#ffffff"],
  ["Black", "#1d2327"],
  ["Navy", "#24153b"],
  ["Royal Blue", "#006b90"],
  ["Red", "#cc3428"],
  ["Burgundy", "#8f2140"],
  ["Grey", "#c8c8c8"],
  ["Green", "#087b32"],
  ["Orange", "#f8be1d"],
  ["Pink", "#e96aa3"],
  ["Purple", "#a64b93"],
  ["Cream", "#efd8a9"]
];

let colours = [...FALLBACK_COLOURS];
let colourImageByName = new Map();
const API_BASE_URL = "https://api.brandeduk.com/api";

const LOGO_METHOD_UNIT_PRICES = {
  print: 3.50,
  embroidery: 5.00,
  dtf: 3.95,
  screen: 2.95,
  vinyl: 3.50,
  logo: 3.50
};

const VAT_STORAGE_KEY = "brandeduk-vat-mode";
const LEGACY_INCLUDE_VAT_KEY = "includeVAT";
const VAT_RATE = 0.20;

const BRAND_LOGO_MAP = {
  "gildan": "gildan2020.webp",
  "fruit of the loom": "fruit-of-the-loom.jpg",
  "awdis": "awdis.webp",
  "beechfield": "beechfield.jpeg",
  "bagbase": "bagbase.jpeg",
  "russell": "russell.webp",
  "russell europe": "russell.webp",
  "kustom kit": "kustom-kit2020.webp",
  "regatta professional": "regatta-professional2020.webp",
  "portwest": "portwest.webp"
};

function isUsableHex(hex) {
  if (!hex) return false;
  return /^#[0-9A-Fa-f]{6}$/.test(String(hex).trim());
}

const cssColorHexCache = new Map();

function toHexComponent(value) {
  const n = Math.max(0, Math.min(255, Number(value) || 0));
  return n.toString(16).padStart(2, "0");
}

function rgbToHex(r, g, b) {
  return `#${toHexComponent(r)}${toHexComponent(g)}${toHexComponent(b)}`;
}

function hslToHex(h, s, l) {
  const hue = ((Number(h) % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, Number(s) || 0)) / 100;
  const light = Math.max(0, Math.min(100, Number(l) || 0)) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = light - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hue < 60) [r1, g1, b1] = [c, x, 0];
  else if (hue < 120) [r1, g1, b1] = [x, c, 0];
  else if (hue < 180) [r1, g1, b1] = [0, c, x];
  else if (hue < 240) [r1, g1, b1] = [0, x, c];
  else if (hue < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return rgbToHex(
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255)
  );
}

function parseRgbLike(value) {
  const match = String(value || "").trim().match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return "";

  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3) return "";

  const nums = parts.slice(0, 3).map((part) => {
    if (part.endsWith("%")) {
      const pct = parseFloat(part);
      if (Number.isNaN(pct)) return NaN;
      return Math.round((pct / 100) * 255);
    }
    const n = parseFloat(part);
    return Number.isNaN(n) ? NaN : n;
  });

  if (nums.some((n) => Number.isNaN(n))) return "";
  return rgbToHex(nums[0], nums[1], nums[2]);
}

function parseHslLike(value) {
  const match = String(value || "").trim().match(/^hsla?\(([^)]+)\)$/i);
  if (!match) return "";

  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3) return "";

  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  if ([h, s, l].some((n) => Number.isNaN(n))) return "";

  return hslToHex(h, s, l);
}

function parseCssColorToHex(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (cssColorHexCache.has(raw)) return cssColorHexCache.get(raw);

  const probe = document.createElement("span");
  probe.style.color = "";
  probe.style.color = raw;
  if (!probe.style.color) {
    cssColorHexCache.set(raw, "");
    return "";
  }

  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color || "";
  probe.remove();

  const parsed = parseRgbLike(resolved) || "";
  cssColorHexCache.set(raw, parsed);
  return parsed;
}

function normalizeHex(hex) {
  if (!hex) return "";
  const value = String(hex).trim();
  if (!value) return "";

  const shortHexMatch = value.match(/^#?([0-9A-Fa-f]{3})$/);
  if (shortHexMatch) {
    const [r, g, b] = shortHexMatch[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  let maybeHex = value;
  if (!maybeHex.startsWith("#") && /^[0-9A-Fa-f]{6}$/.test(maybeHex)) {
    maybeHex = `#${maybeHex}`;
  }
  if (isUsableHex(maybeHex)) return maybeHex.toLowerCase();

  const rgbHex = parseRgbLike(value);
  if (rgbHex) return rgbHex.toLowerCase();

  const hslHex = parseHslLike(value);
  if (hslHex) return hslHex.toLowerCase();

  const cssHex = parseCssColorToHex(value);
  return cssHex ? cssHex.toLowerCase() : "";
}

function normalizeBrandName(value) {
  return String(value || "")
    .replace(/[®™]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeColorKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[®™*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function brandedColour() {
  return window.BrandedColorHex || null;
}

function isPlaceholderSwatchHex(hex) {
  const BCH = brandedColour();
  if (BCH && typeof BCH.isPlaceholderSwatchHex === "function") {
    return BCH.isPlaceholderSwatchHex(hex);
  }
  const normalized = normalizeHex(hex);
  return !normalized || normalized === "#d1d5db" || normalized === "#cccccc" || normalized === "#ccc";
}

function resolveColourHexForName(name, productCode, imageUrl, directHex) {
  const BCH = brandedColour();
  if (BCH && typeof BCH.resolveForName === "function") {
    return BCH.resolveForName(name, productCode || "", imageUrl || "", directHex || "");
  }
  return "";
}

function resolveColourHexForEntry(entry, productCode) {
  const BCH = brandedColour();
  if (BCH && typeof BCH.resolveForEntry === "function") {
    return BCH.resolveForEntry(entry, productCode || "");
  }
  return "";
}

function resolveGarmentDisplayHex(hex, colourName, productCode, imageUrl) {
  const BCH = brandedColour();
  const thumb = String(imageUrl || "").trim();
  if (BCH && typeof BCH.getImageHexSync === "function" && thumb) {
    const cached = BCH.getImageHexSync(thumb);
    if (cached) return cached;
  }
  if (BCH && typeof BCH.resolveGarmentTint === "function") {
    return BCH.resolveGarmentTint(hex, colourName, productCode, thumb);
  }
  const normalized = normalizeHex(hex);
  if (normalized && !isPlaceholderSwatchHex(normalized)) return normalized;
  return "#ffffff";
}

function fillMissingCatalogueColourHexes(productCode) {
  const BCH = brandedColour();
  if (!BCH || typeof BCH.fillColourPairs !== "function") return false;
  return BCH.fillColourPairs(colours, productCode, getColourImageForName);
}

function applySwatchAppearance(el, name, hex) {
  const BCH = brandedColour();
  if (BCH && typeof BCH.applySwatchAppearance === "function") {
    BCH.applySwatchAppearance(el, name, hex, getColourImageForName(name));
    return;
  }
  if (el) el.style.backgroundColor = hex || "#f3f4f6";
}

function resolveBrandLogoUrl(brandName, productData) {
  const explicitLogo = productData?.brandLogo || productData?.brand_logo || productData?.logo || "";
  if (explicitLogo) return explicitLogo;

  const normalized = normalizeBrandName(brandName).toLowerCase();
  if (!normalized) return "";

  const fileName = BRAND_LOGO_MAP[normalized] || BRAND_LOGO_MAP[normalized.replace(/&/g, "and")];
  return fileName ? `../brandedukv15-child/assets/images/brands/${fileName}` : "";
}

const sampledColourHexCache = new Map();

function getVariantImageUrl(entry) {
  return String(entry?.main || entry?.image || entry?.thumb || entry?.thumbnail || "").trim();
}

function rgbToHsl(r, g, b) {
  const rn = (Number(r) || 0) / 255;
  const gn = (Number(g) || 0) / 255;
  const bn = (Number(b) || 0) / 255;
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

  return {
    h,
    s: s * 100,
    l: l * 100
  };
}

async function sampleHexFromImage(url) {
  const source = String(url || "").trim();
  if (!source) return "";
  if (sampledColourHexCache.has(source)) return sampledColourHexCache.get(source);

  const task = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
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
        const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

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

          const { s, l } = rgbToHsl(r, g, b);
          if (l < 6 || l > 95) continue;

          const satWeight = 0.45 + Math.min(1, s / 100);
          const lightWeight = l > 82 ? 0.5 : 1;
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

        const avgR = Math.round(sumR / weightTotal);
        const avgG = Math.round(sumG / weightTotal);
        const avgB = Math.round(sumB / weightTotal);
        resolve(rgbToHex(avgR, avgG, avgB));
      } catch (error) {
        resolve("");
      }
    };

    img.onerror = () => resolve("");
    img.src = source;
  }).then((hex) => normalizeHex(hex));

  sampledColourHexCache.set(source, task);
  return task;
}

async function refineSwatchesFromVariantImages(productData, productCode) {
  const source = productData?.colors || productData?.colorOptions || productData?.variants || [];
  if (!Array.isArray(source) || source.length === 0) return false;

  const byName = new Map();
  for (const entry of source) {
    const name = String(entry?.name || entry?.displayName || entry?.label || entry?.id || "").trim();
    if (!name) continue;
    byName.set(normalizeColorKey(name), entry);
  }

  if (byName.size === 0 || !Array.isArray(colours) || colours.length === 0) return false;

  let changed = false;
  const nextColours = [];

  for (const [name, currentHex] of colours) {
    const entry = byName.get(normalizeColorKey(name));
    const imageUrl = getVariantImageUrl(entry);
    const sampledHex = imageUrl ? await sampleHexFromImage(imageUrl) : "";
    const directHex = normalizeHex(entry?.hex || entry?.colourHex || entry?.colorHex || "");
    const resolvedHex = sampledHex || directHex || normalizeHex(currentHex);
    const nextHex = resolvedHex && !isPlaceholderSwatchHex(resolvedHex) ? resolvedHex : "";
    if (normalizeHex(nextHex) !== normalizeHex(currentHex)) changed = true;
    nextColours.push([name, nextHex]);
  }

  if (changed) {
    colours = nextColours;
  }
  return changed;
}

function normalizeProductColours(productData, productCode) {
  const source = productData?.colors || productData?.colorOptions || productData?.variants || [];
  if (!Array.isArray(source) || source.length === 0) return [];

  return source.map((entry) => {
    const name = String(entry?.name || entry?.displayName || entry?.label || entry?.id || "").trim();
    if (!name) return null;

    const apiHex = normalizeHex(entry?.hex || entry?.colourHex || entry?.colorHex || "");
    return [name, isPlaceholderSwatchHex(apiHex) ? "" : apiHex];
  }).filter(Boolean);
}

function setColourLoading(isLoading) {
  if (colourGrid) {
    colourGrid.classList.toggle("is-loading", !!isLoading);
  }
  const miniRow = document.getElementById("miniColourRow");
  if (miniRow) {
    miniRow.classList.toggle("is-loading", !!isLoading);
  }
}

function buildColourImageMap(productData) {
  const source = productData?.colors || productData?.colorOptions || productData?.variants || [];
  const map = new Map();
  if (!Array.isArray(source)) return map;

  source.forEach((entry) => {
    const name = String(entry?.name || entry?.displayName || entry?.label || entry?.id || "").trim();
    if (!name) return;

    const image = String(entry?.main || entry?.image || entry?.thumb || entry?.thumbnail || "").trim();
    if (!image) return;

    map.set(normalizeColorKey(name), image);
  });

  return map;
}

function getColourImageForName(name) {
  return colourImageByName.get(normalizeColorKey(name)) || "";
}

function syncCurrentColourHexFromPalette() {
  if (!Array.isArray(colours) || colours.length === 0) return;
  const currentName = normalizeColorKey(state.colourName || "");
  if (!currentName) return;

  const match = colours.find(([name]) => normalizeColorKey(name) === currentName);
  if (!match) return;

  const nextHex = resolveGarmentDisplayHex(
    match[1],
    state.colourName,
    state.productCode,
    state.selectedColorImage || getColourImageForName(state.colourName)
  );
  if (!nextHex) return;

  state.colourHex = nextHex;
  if (colourLayer) {
    colourLayer.style.backgroundColor = nextHex;
  }
  syncViewThumbTint();
}

function setupCustomizerBreadcrumb() {
  const params = new URLSearchParams(window.location.search);
  const from = String(params.get("from") || "").toLowerCase();
  const code = String(params.get("code") || "").trim();

  let fallbackTarget = "../shop.html";
  let label = "Home > Logo Tool";

  if (from === "basket" || sessionStorage.getItem("returnAfterCustomize") === "basket") {
    fallbackTarget = "../basket.html";
    label = "Home > Quote Basket > Logo Tool";
  } else if (from === "customize-mobile") {
    fallbackTarget = code ? `../mobile/customize-mobile.html?code=${encodeURIComponent(code)}` : "../mobile/customize-mobile.html";
    label = "Home > Customize > Logo Tool";
  }

  if (customizerBreadcrumbLabel) {
    customizerBreadcrumbLabel.textContent = label;
  }

  const goBack = () => {
    const sameOriginReferrer = !!(document.referrer && document.referrer.indexOf(window.location.origin) === 0);
    if (sameOriginReferrer && window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = fallbackTarget;
  };

  if (customizerBackLink) {
    customizerBackLink.addEventListener("click", goBack);
  }

  const closeBtn = document.getElementById("closeCustomiserBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", goBack);
  }

  // When leaving to sign in, remember this exact page so the post-login
  // redirect brings the user back here (basket is never cleared by login).
  const signInLink = document.querySelector('.tool-bottom-nav a[href$="profile.html"]');
  if (signInLink) {
    signInLink.addEventListener("click", () => {
      try {
        localStorage.setItem("authReturnTo", window.location.href);
      } catch (error) {}
    });
  }
}

function normalizeDecorationMethod(method) {
  const normalized = String(method || "").trim().toLowerCase();
  if (normalized === "embroidery" || normalized === "print" || normalized === "dtf" || normalized === "screen" || normalized === "vinyl") {
    return normalized;
  }
  return "print";
}

function getLogoUnitPrice(method) {
  return LOGO_METHOD_UNIT_PRICES[normalizeDecorationMethod(method)] || LOGO_METHOD_UNIT_PRICES.print;
}

function applyProductHeaderUI() {
  const modelEl = document.getElementById("cibModelName");
  const codeEl = document.getElementById("cibCode");
  if (modelEl) modelEl.textContent = state.productName || "Product";
  if (codeEl) codeEl.textContent = state.productCode || "SKU-2024";
  if (productPageTitle) productPageTitle.textContent = `Custom ${state.productName || "Product"}`;

  if (phBrandText) {
    phBrandText.textContent = state.brandName || "BRANDED";
  }

  if (phBrandLogo) {
    if (state.brandLogo) {
      phBrandLogo.src = state.brandLogo;
      phBrandLogo.alt = state.brandName ? `${state.brandName} logo` : "Brand logo";
      phBrandLogo.style.display = "inline-block";
    } else {
      phBrandLogo.src = "";
      phBrandLogo.style.display = "none";
    }
  }
}

function applySelectedProductContext() {
  let selectedProductData = null;
  try {
    selectedProductData = JSON.parse(sessionStorage.getItem("selectedProductData") || "null");
  } catch (error) {
    selectedProductData = null;
  }

  const params = new URLSearchParams(window.location.search);
  const urlCode = String(params.get("code") || "").trim();

  if (!selectedProductData && urlCode) {
    try {
      const basket = JSON.parse(localStorage.getItem("quoteBasket") || "[]");
      const matched = Array.isArray(basket)
        ? basket.find((item) => String(item?.productCode || item?.code || "").trim() === urlCode)
        : null;

      if (matched) {
        selectedProductData = {
          code: matched.productCode || matched.code,
          name: matched.productName || matched.name,
          brand: matched.brand || "",
          brandLogo: matched.brandLogo || "",
          color: matched.color || "",
          colorHex: matched.colorHex || "",
          colorImage: matched.colorImage || matched.image || "",
          image: matched.image || matched.colorImage || "",
          colors: Array.isArray(matched.colorsSnapshot) ? matched.colorsSnapshot : []
        };
      }
    } catch (error) {
      // no-op
    }
  }

  state.productCode = selectedProductData?.code || selectedProductData?.productCode || selectedProductData?.sku || urlCode || state.productCode || "GD067";
  state.productName = selectedProductData?.name || selectedProductData?.title || selectedProductData?.productName || state.productName;
  const contextProductType = inferProductTypeFromCatalog(
    state.productName,
    selectedProductData?.productType || selectedProductData?.category || selectedProductData?.type
  );
  if (contextProductType) {
    state.product = contextProductType;
    if (productSelect) productSelect.value = contextProductType;
    if (mainProductSelect) mainProductSelect.value = contextProductType;
    configureViewTabsForProduct();
  }
  state.brandName = selectedProductData?.brand || selectedProductData?.brand_name || state.brandName;
  state.brandLogo = resolveBrandLogoUrl(state.brandName, selectedProductData);
  state.selectedColorImage = selectedProductData?.colorImage || selectedProductData?.selectedColorImage || selectedProductData?.image || state.selectedColorImage || "";

  colourImageByName = buildColourImageMap(selectedProductData);

  const productColours = normalizeProductColours(selectedProductData, state.productCode);
  colours = productColours.length > 0 ? productColours : [...FALLBACK_COLOURS];
  fillMissingCatalogueColourHexes(state.productCode);
  updateAvailableColoursLabel();

  const selectedFromSession = String(
    selectedProductData?.color
    || selectedProductData?.selectedColorName
    || sessionStorage.getItem("selectedColorName")
    || ""
  ).trim();
  const selectedFromSessionKey = normalizeColorKey(selectedFromSession);
  const colorMatch = colours.find(([name]) => normalizeColorKey(name) === selectedFromSessionKey);
  const firstColour = colours[0] || ["White", "#ffffff"];
  const activeColour = colorMatch || (selectedFromSession ? [selectedFromSession, ""] : firstColour);

  state.colourName = activeColour[0];
  const mappedColourImage = getColourImageForName(state.colourName);
  if (mappedColourImage) {
    state.selectedColorImage = mappedColourImage;
  }
  applyGarmentTintHex(activeColour[1] || "");
  updateSelectedColourLabels(state.colourName);

  refreshColourHexFromProductThumb({
    apiHex: normalizeHex(activeColour[1] || "")
  }).then(() => {
    applyArea();
  });

  applyProductHeaderUI();
}

async function hydrateSelectedProductFromApi() {
  const productCode = String(state.productCode || "").trim();
  if (!productCode) return;

  setColourLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productCode)}`);
    if (!response.ok) return;

    const productData = await response.json();
    if (!productData || typeof productData !== "object") return;

    state.productName = productData.name || productData.title || state.productName;
    state.brandName = productData.brand || productData.brand_name || state.brandName;
    state.brandLogo = resolveBrandLogoUrl(state.brandName, productData);

    const inferredType = inferProductTypeFromCatalog(
      state.productName,
      productData.productType || productData.category || productData.type
    );
    if (inferredType) {
      state.product = inferredType;
      if (productSelect) productSelect.value = inferredType;
      if (mainProductSelect) mainProductSelect.value = inferredType;
      configureViewTabsForProduct();
    }

    colourImageByName = buildColourImageMap(productData);
    const dynamicColours = normalizeProductColours(productData, productCode);
    if (dynamicColours.length > 0) {
      colours = dynamicColours;
      fillMissingCatalogueColourHexes(productCode);
      updateAvailableColoursLabel();
      const incomingName = String(state.colourName || sessionStorage.getItem("selectedColorName") || "").trim();
      const currentMatch = colours.find(([name]) => normalizeColorKey(name) === normalizeColorKey(incomingName));
      const activeColour = currentMatch || (incomingName ? [incomingName, ""] : colours[0]);
      state.colourName = activeColour[0];
      const mappedColourImage = getColourImageForName(state.colourName);
      if (mappedColourImage) {
        state.selectedColorImage = mappedColourImage;
      }
      state.colourHex = resolveGarmentDisplayHex(
        state.colourHex || activeColour[1],
        state.colourName,
        productCode,
        state.selectedColorImage
      ) || "#ffffff";
      colourLayer.style.backgroundColor = state.colourHex;
      syncCurrentColourHexFromPalette();
      updateSelectedColourLabels(state.colourName);
      syncViewThumbTint();
    }
    updateAvailableColoursLabel();

    applyProductHeaderUI();
    renderColours();
    renderMiniColours();

    const refined = await refineSwatchesFromVariantImages(productData, productCode);
    const filled = fillMissingCatalogueColourHexes(productCode);
    const sampledAll = await hydrateGarmentColoursFromThumbs(productCode);
    if (refined || filled || sampledAll) {
      syncCurrentColourHexFromPalette();
      renderColours();
      renderMiniColours();
    }

    await refreshColourHexFromProductThumb();
    const tintHex = resolveGarmentDisplayHex(
      state.colourHex,
      state.colourName,
      productCode,
      state.selectedColorImage
    ) || "#ffffff";
    if (colourLayer) colourLayer.style.backgroundColor = tintHex;
    syncViewThumbTint();
    applyArea();
  } catch (error) {
    // keep session/fallback product data when API is unavailable
  } finally {
    setColourLoading(false);
  }
}

function updateConfirmButtonState() {
  if (!confirmQualityBtn) return;
  confirmQualityBtn.disabled = !(state.uploadedLogo && state.copyrightConfirmed);
}

const BASE_FONT_OPTIONS = [
  { name: "Arial", cssFamily: "Arial, Helvetica, sans-serif" },
  { name: "Impact", cssFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
  { name: "Georgia", cssFamily: "Georgia, 'Times New Roman', Times, serif" },
  { name: "Verdana", cssFamily: "Verdana, Geneva, Tahoma, sans-serif" },
  { name: "Times New Roman", cssFamily: "'Times New Roman', Times, serif" },
  { name: "Courier New", cssFamily: "'Courier New', Courier, monospace" },
  { name: "Trebuchet MS", cssFamily: "'Trebuchet MS', Tahoma, sans-serif" },
  { name: "Arial Black", cssFamily: "'Arial Black', Arial, sans-serif" }
];

const CUSTOM_FONT_FILES = [
  { name: "Bebas Neue", file: "BebasNeue-Regular.ttf", format: "truetype" },
  { name: "Montserrat", file: "Montserrat-Regular.ttf", format: "truetype" },
  { name: "Montserrat Black", file: "Montserrat-Black.ttf", format: "truetype" },
  { name: "Roboto", file: "Roboto-Regular.ttf", format: "truetype" },
  { name: "Rubik", file: "Rubik.ttf", format: "truetype" },
  { name: "Yellowtail", file: "Yellowtail-Regular.ttf", format: "truetype" },
  { name: "Bank Gothic Bold", file: "BankGothic Bold.ttf", format: "truetype" },
  { name: "Bank Gothic Light", file: "Bank Gothic Light Regular.otf", format: "opentype" },
  { name: "Gotham Bold", file: "Gotham Bold.otf", format: "opentype" },
  { name: "Futura Extra Bold", file: "Futura Extra Bold.otf", format: "opentype" },
  { name: "Sports World", file: "Sports World-Regular.ttf", format: "truetype" },
  { name: "AniMe Matrix", file: "AniMeMatrix-MB_EN.ttf", format: "truetype" }
  // Add more copied files here:
  // { name: "My Brand Font", file: "MyBrandFont-Regular.ttf", format: "truetype" }
];

let FONT_OPTIONS = [...BASE_FONT_OPTIONS];

async function loadCustomFontsFromFolder() {
  if (!("FontFace" in window)) return;

  const loadedFonts = await Promise.all(CUSTOM_FONT_FILES.map(async ({ name, file, format }) => {
    try {
      const fileUrl = `assets/fonts/${encodeURIComponent(file)}`;
      const fontFace = new FontFace(name, `url("${fileUrl}") format("${format}")`);
      await fontFace.load();
      document.fonts.add(fontFace);
      return { name, cssFamily: `'${name}', Arial, sans-serif` };
    } catch (error) {
      return null;
    }
  }));

  const customFontOptions = loadedFonts.filter(Boolean);
  FONT_OPTIONS = [...BASE_FONT_OPTIONS, ...customFontOptions];
}

function getFontByName(name) {
  return FONT_OPTIONS.find(font => font.name === name) || FONT_OPTIONS[0];
}

function renderFontOptions() {
  const nativeSelect = document.getElementById("fontSelect");
  const dropdown = document.getElementById("teFontDropdown");
  const fontPageList = document.getElementById("fontPageList");
  const selected = document.getElementById("teFontSelected");
  const fontSelectorBtn = document.getElementById("fontSelectorBtn");

  if (!nativeSelect || !dropdown || !fontPageList) return;

  nativeSelect.innerHTML = "";
  dropdown.innerHTML = "";
  fontPageList.innerHTML = "";

  FONT_OPTIONS.forEach(({ name, cssFamily }) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    nativeSelect.appendChild(option);

    const pickerOption = document.createElement("div");
    pickerOption.className = "te-font-option";
    pickerOption.dataset.font = name;
    pickerOption.style.fontFamily = cssFamily;
    pickerOption.textContent = `${name} - The quick brown fox`;
    dropdown.appendChild(pickerOption);

    const pageButton = document.createElement("button");
    pageButton.dataset.font = name;
    pageButton.style.fontFamily = cssFamily;
    pageButton.textContent = name;
    fontPageList.appendChild(pageButton);
  });

  const activeFont = getFontByName(state.font);
  nativeSelect.value = activeFont.name;

  if (selected) {
    selected.textContent = activeFont.name;
    selected.style.fontFamily = activeFont.cssFamily;
  }

  if (fontSelectorBtn) {
    fontSelectorBtn.textContent = activeFont.name;
  }
}

function setSelectedFont(fontName) {
  const font = getFontByName(fontName);
  const nativeSelect = document.getElementById("fontSelect");
  const selected = document.getElementById("teFontSelected");
  const textarea = document.getElementById("customTextInput");
  const fontSelectorBtn = document.getElementById("fontSelectorBtn");
  const dropdown = document.getElementById("teFontDropdown");

  state.font = font.name;

  if (nativeSelect) nativeSelect.value = font.name;
  if (selected) {
    selected.textContent = font.name;
    selected.style.fontFamily = font.cssFamily;
  }
  if (textarea) textarea.style.fontFamily = font.cssFamily;
  if (fontSelectorBtn) fontSelectorBtn.textContent = font.name;

  if (dropdown) {
    dropdown.querySelectorAll(".te-font-option").forEach(opt => {
      opt.classList.toggle("active-font", opt.dataset.font === font.name);
    });
  }
}

loadCustomFontsFromFolder().finally(() => {
  renderFontOptions();
  setSelectedFont(state.font);
});

function openScreen(screenId) {
  if (screenId === "locationsPage") {
    showPositionPickerModal({
      title: "Pick your new position",
      subtitle: "",
      restrictToRemaining: !!state.uploadedLogo,
      onPick: () => openScreen("mainEditor"),
      onCancel: () => openScreen("mainEditor")
    });
    return;
  }

  screens.forEach(screen => screen.classList.remove("active-screen"));
  document.getElementById(screenId).classList.add("active-screen");
  if (toolBottomNav) {
    toolBottomNav.classList.toggle("is-hidden", screenId !== "mainEditor");
  }
  if (screenId === "textEditorPage") {
    syncTextEditorFieldsFromState();
  }
  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => openScreen(button.dataset.open));
});

function updateVisibilityByPrintArea(layer) {
  const contentEl = layer === textLayer ? textContent : uploadedLogo;
  if (contentEl) {
    contentEl.style.clipPath = "none";
    contentEl.style.webkitClipPath = "none";
  }
  layer.classList.remove("inside-print-area", "outside-print-area", "fully-outside-print-area");
  layer.classList.add("inside-print-area");
}

function renderColours() {
  updateAvailableColoursLabel();
  colourGrid.innerHTML = "";

  colours.forEach(([name, hex]) => {
    const swatch = document.createElement("button");
    swatch.className = "colour-swatch";
    applySwatchAppearance(swatch, name, hex);
    swatch.title = name;

    if (name === state.colourName) swatch.classList.add("selected");

    swatch.addEventListener("click", () => {
      applySelectedProductColour(name, hex);
    });

    colourGrid.appendChild(swatch);
  });
}

const tshirtImages = {
  front: "https://i.postimg.cc/rp4qqNzw/Front-T-shirt.png",
  back:  "https://i.postimg.cc/cHZG0qVh/BAck-T-shirt.png",
  "left-sleeve": "https://i.postimg.cc/gJRjBP34/Left-Sleeve-T-shirt.png",
  "right-sleeve": "https://i.postimg.cc/gJRjBP34/Left-Sleeve-T-shirt.png",
  right: "https://i.postimg.cc/gJRjBP34/Left-Sleeve-T-shirt.png",
  left:  "https://i.postimg.cc/gJRjBP34/Left-Sleeve-T-shirt.png"
};

const tshirtFrontCustomImage = "https://i.postimg.cc/rp4qqNzw/Front-T-shirt.png";
const beanieFrontImage = "https://i.postimg.cc/xdX8y8Mr/beanie-folding.png";

const garmentImageLoadCache = new Map();
let areaRenderRequestId = 0;
// Tracks the last print area we re-centred for, so a colour-only refresh
// (which also calls applyArea) does NOT yank the logo back to centre.
let lastCenteredArea = null;

function ensureGarmentImageLoaded(url) {
  if (!url) return Promise.resolve(false);
  if (garmentImageLoadCache.has(url)) return garmentImageLoadCache.get(url);

  const loadPromise = new Promise((resolve) => {
    const img = new Image();
    let settled = false;

    const done = (ok) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.src = url;

    if (img.complete && img.naturalWidth > 0) {
      done(true);
    }
  });

  garmentImageLoadCache.set(url, loadPromise);
  return loadPromise;
}

// Preload active garment images so area switches do not flash old assets.
(function preloadTshirtImages() {
  const urls = new Set([...Object.values(tshirtImages), tshirtFrontCustomImage, beanieFrontImage]);
  urls.forEach((url) => {
    ensureGarmentImageLoaded(url);
  });
})();

function getFrontThumbImageSrc() {
  if (state.product === "beanie") return beanieFrontImage;
  if (state.product === "tshirt") return tshirtFrontCustomImage;
  return tshirtImages.front;
}

function inferProductTypeFromCatalog(name, productType) {
  const label = String(name || "").toLowerCase();
  const type = String(productType || "").toLowerCase();
  if (/beanie|bobble hat|knit hat|wool hat/.test(label) || /beanie|headwear/.test(type)) return "beanie";
  if (/t\s*-?shirt|tee/.test(label) || /t-?shirt/.test(type)) return "tshirt";
  if (/hoodie|sweatshirt/.test(label) || /hoodie|sweatshirt/.test(type)) return "hoodie";
  if (/\bcap\b|baseball cap/.test(label) || /\bcap\b/.test(type)) return "cap";
  if (/polo/.test(label) || /polo/.test(type)) return "polo";
  return "";
}

function restoreDefaultViewTabThumbs() {
  const thumbMap = {
    front: tshirtImages.front,
    back: tshirtImages.back,
    left: tshirtImages.left,
    right: tshirtImages.right
  };
  Object.entries(thumbMap).forEach(([area, src]) => {
    const thumb = document.querySelector(`.view-tab[data-area="${area}"] .view-thumb`);
    if (thumb) thumb.src = src;
  });
}

function configureViewTabsForProduct() {
  const isBeanie = state.product === "beanie";
  const appRoot = document.querySelector(".customiser-app");
  if (appRoot) {
    appRoot.classList.toggle("product-beanie", isBeanie);
    appRoot.classList.toggle("product-tshirt", state.product === "tshirt");
  }
  if (productPreview) {
    productPreview.classList.toggle("product-beanie", isBeanie);
  }

  document.querySelectorAll('.view-tab[data-area="back"], .view-tab[data-area="left"], .view-tab[data-area="right"], .view-tab[data-area="left-sleeve"], .view-tab[data-area="right-sleeve"]').forEach((tab) => {
    tab.hidden = isBeanie;
  });

  const frontTab = document.querySelector('.view-tab[data-area="front"]');
  if (frontTab) frontTab.hidden = false;

  if (isBeanie) {
    const frontThumb = frontTab?.querySelector(".view-thumb");
    if (frontThumb) frontThumb.src = beanieFrontImage;
    state.selectedArea = "front";
    document.querySelectorAll(".view-tab").forEach((btn) => btn.classList.remove("active-view"));
    frontTab?.classList.add("active-view");
  } else {
    restoreDefaultViewTabThumbs();
  }

  configureDesignTypesForProduct(isBeanie);
}

/**
 * Beanies are embroidery-only: grey out DTF & Screen Printing logo options and
 * show a folding-area height warning. Other products keep all methods enabled.
 */
function configureDesignTypesForProduct(isBeanie) {
  document.querySelectorAll("#designTypePage [data-design-type]").forEach((card) => {
    const type = card.dataset.designType;
    const disabled = isBeanie && type !== "embroidery";
    card.classList.toggle("is-disabled", disabled);
    card.setAttribute("aria-disabled", disabled ? "true" : "false");
  });

  const list = document.querySelector("#designTypePage .print-type-list");
  if (!list) return;
  let warning = document.getElementById("beanieEmbroideryWarning");
  if (isBeanie) {
    if (!warning) {
      warning = document.createElement("div");
      warning.id = "beanieEmbroideryWarning";
      warning.className = "embroidery-warning";
      warning.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' +
        '<span>Embroidery on folding area &mdash; max height 5.5cm</span>';
      list.insertBefore(warning, list.firstChild);
    }
    warning.hidden = false;
  } else if (warning) {
    warning.hidden = true;
  }
}

function preloadCurrentColourSet() {
  const urls = new Set();

  if (state.selectedColorImage) {
    urls.add(String(state.selectedColorImage).trim());
  }

  if (colourImageByName && typeof colourImageByName.forEach === "function") {
    colourImageByName.forEach((url) => {
      if (url) urls.add(String(url).trim());
    });
  }

  const jobs = [];
  urls.forEach((url) => {
    if (url) jobs.push(ensureGarmentImageLoaded(url));
  });

  return Promise.allSettled(jobs);
}

async function applyArea() {
  const requestId = ++areaRenderRequestId;

  productPreview.className = "product-preview";
  productPreview.classList.add(`area-${state.selectedArea}`);
  document.querySelector(".customiser-app")?.classList.toggle("product-tshirt", state.product === "tshirt");
  document.querySelector(".customiser-app")?.classList.toggle("product-beanie", state.product === "beanie");
  productPreview.classList.toggle("product-beanie", state.product === "beanie");
  productPreview.classList.toggle("mirror-right", state.selectedArea === "right" && state.product !== "beanie");

  const isTshirtFront = state.product === "tshirt" && state.selectedArea === "front";
  if (isTshirtFront) {
    productPreview.classList.add("custom-tshirt-front");
  }

  // Vista utente: sempre PNG neutro (box laterale). Il thumb API serve solo al campionamento colore.
  const neutralPngSrc = resolveNeutralGarmentPngForArea(state.selectedArea);
  const productShapeEl = document.getElementById("productShape");
  const colourLayerEl  = document.getElementById("colourLayer");
  const wrapEl         = document.querySelector(".polo-colour-wrap");

  if (wrapEl) {
    wrapEl.classList.add("is-switching-area");
  }

  await ensureGarmentImageLoaded(neutralPngSrc);
  if (requestId !== areaRenderRequestId) return;

  productShapeEl.src = neutralPngSrc;
  colourLayerEl.style.opacity = "1";
  const areaTintHex = (() => {
    const thumb = state.selectedColorImage || getColourImageForName(state.colourName);
    const BCH = brandedColour();
    const cached = BCH && typeof BCH.getImageHexSync === "function" ? BCH.getImageHexSync(thumb) : "";
    if (cached) return cached;
    if (state.colourHex && !isPlaceholderSwatchHex(state.colourHex)) return state.colourHex;
    return isWhiteColourName(state.colourName) ? "#ffffff" : "#ffffff";
  })();
  colourLayerEl.style.backgroundColor = areaTintHex;

  // Maschera tint sul PNG neutro, non sulla foto catalogo.
  colourLayerEl.style.webkitMaskImage = `url("${neutralPngSrc}")`;
  colourLayerEl.style.maskImage = `url("${neutralPngSrc}")`;
  colourLayerEl.style.webkitMaskSize = "contain";
  colourLayerEl.style.maskSize = "contain";
  colourLayerEl.style.webkitMaskRepeat = "no-repeat";
  colourLayerEl.style.maskRepeat = "no-repeat";
  colourLayerEl.style.webkitMaskPosition = "center center";
  colourLayerEl.style.maskPosition = "center center";
  syncViewThumbTint();

  // Size T-shirt views via layout width so the canvas collapses to the visible garment height.
  const tshirtWidth = (state.selectedArea === "left" || state.selectedArea === "right") ? "56%" : "86%";
  // Beanie is enlarged via width (centred by flex on .product-beanie) — NOT a CSS
  // transform scale, which would distort pointer coordinates and break logo dragging.
  const beanieWidth = "117%";
  let wrapWidth = "100%";
  if (state.product === "tshirt") wrapWidth = tshirtWidth;
  else if (state.product === "beanie") wrapWidth = beanieWidth;
  wrapEl.style.setProperty("--wrap-width", wrapWidth);
  wrapEl.style.setProperty("--wrap-mirror", state.selectedArea === "right" && state.product !== "beanie" ? "-1" : "1");

  requestAnimationFrame(() => {
    if (requestId !== areaRenderRequestId) return;
    wrapEl?.classList.remove("is-switching-area");
  });

  // Only re-centre when the print AREA actually changed. A colour change keeps
  // the logo exactly where the user left it.
  const areaChanged = lastCenteredArea !== state.selectedArea;
  lastCenteredArea = state.selectedArea;
  if (areaChanged) {
    setTimeout(() => {
      if (requestId !== areaRenderRequestId) return;
      if (state.uploadedLogo) centerLogo();
      if (state.text) centerText();
    }, 0);
  }
}

function collectSizes() {
  const rows = sizesContainer.querySelectorAll(".size-row");
  state.sizes = [];

  rows.forEach(row => {
    const size = row.querySelector(".size-select").value;
    const qty = parseInt(row.querySelector(".size-qty").value) || 1;
    state.sizes.push({ size, qty });
  });

  state.totalQty = state.sizes.reduce((sum, item) => sum + item.qty, 0);
  mainQtyInput.value = state.totalQty;
}

function calculatePrice() {
  const qty = parseInt(mainQtyInput.value) || state.totalQty || 1;
  let unit = state.basePrice;

  if (state.decorationType === "embroidery") unit += 4.5;
  if (state.decorationType === "dtf") unit += 3.95;
  if (state.decorationType === "screen") unit += 2.95;
  if (state.decorationType === "vinyl") unit += 3.5;
  if (state.text) unit += 1.5;
  if (state.names.length > 0) unit += 4;

  state.price = qty * unit;
}

function isVatOn() {
  try {
    const mode = localStorage.getItem(VAT_STORAGE_KEY);
    if (mode === "on") return true;
    if (mode === "off") return false;
    return localStorage.getItem(LEGACY_INCLUDE_VAT_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function persistVatMode(isOn) {
  try {
    localStorage.setItem(VAT_STORAGE_KEY, isOn ? "on" : "off");
    localStorage.setItem(LEGACY_INCLUDE_VAT_KEY, isOn ? "true" : "false");
  } catch (error) {
    // no-op
  }
}

function toDisplayAmount(exVatAmount) {
  const safe = Number(exVatAmount) || 0;
  return isVatOn() ? safe * (1 + VAT_RATE) : safe;
}

function vatSuffixLabel() {
  return isVatOn() ? "inc. VAT" : "exc. VAT";
}

function setupVatToggle() {
  const checkbox = document.getElementById("vatToggleCheckbox");
  const container = document.getElementById("vatToggleContainer");
  if (!checkbox) return;

  const syncUi = () => {
    const vatOn = isVatOn();
    checkbox.checked = vatOn;
    if (container) {
      container.classList.toggle("is-on", vatOn);
      container.setAttribute("aria-checked", vatOn ? "true" : "false");
    }
  };

  syncUi();

  checkbox.addEventListener("change", () => {
    persistVatMode(checkbox.checked);
    syncUi();
    updateBasketUIFromStorage();
    calculatePrice();
    window.dispatchEvent(new CustomEvent("vatToggleChanged", { detail: { vatOn: checkbox.checked } }));
  });
}

function readQuoteBasket() {
  try {
    const raw = localStorage.getItem("quoteBasket");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeQuoteBasket(basket) {
  localStorage.setItem("quoteBasket", JSON.stringify(basket));
}

function getItemQty(item) {
  if (!item || typeof item !== "object") return 0;
  if (Number.isFinite(item.qty)) return item.qty;
  if (Number.isFinite(item.totalQty)) return item.totalQty;

  const sizeObj = item.sizes || item.quantities;
  if (sizeObj && typeof sizeObj === "object") {
    return Object.values(sizeObj).reduce((sum, value) => sum + (parseInt(value, 10) || 0), 0);
  }

  return Number.isFinite(item.quantity) ? item.quantity : 0;
}

function getBasketTotals(basket) {
  let items = 0;
  let subtotal = 0;

  basket.forEach((item) => {
    const qty = getItemQty(item);
    const unitPrice = parseFloat(item.unitPrice || item.price || 0) || 0;
    items += qty;
    subtotal += unitPrice * qty;

    if (Array.isArray(item.logos)) {
      item.logos.forEach((logo) => {
        subtotal += (parseFloat(logo.unitPrice || 0) || 0) * qty;
      });
    }
  });

  return { items, subtotal };
}

function updateBasketUIFromStorage() {
  const basket = readQuoteBasket();
  const totals = getBasketTotals(basket);
  const shownTotal = toDisplayAmount(totals.subtotal);

  if (basketTotalAmount) basketTotalAmount.textContent = `£${shownTotal.toFixed(2)}`;
  if (basketTotalMeta) basketTotalMeta.textContent = `${totals.items} item${totals.items === 1 ? "" : "s"} • ${vatSuffixLabel()}`;
  if (cartBadge) cartBadge.textContent = String(totals.items);
  if (toolBottomBasketBadge) {
    toolBottomBasketBadge.textContent = String(totals.items);
    toolBottomBasketBadge.classList.toggle("is-empty", totals.items <= 0);
  }
}

function showPostConfirmModal() {
  const modal = document.getElementById("postConfirmModal");
  if (!modal) return;
  modal.classList.add("open");
}

function closePostConfirmModal() {
  const modal = document.getElementById("postConfirmModal");
  if (!modal) return;
  modal.classList.remove("open");
}

function buildBasketItemFromState() {
  const quantities = {};
  state.sizes.forEach(({ size, qty }) => {
    quantities[size] = (quantities[size] || 0) + qty;
  });

  const unitPrice = state.totalQty > 0 ? state.price / state.totalQty : state.basePrice;
  const productCode = state.productCode || new URLSearchParams(window.location.search).get("code") || "GD067";
  const logoQualityPct = parseInt((document.getElementById("mainQualityPct")?.textContent || "0").replace(/[^0-9]/g, ""), 10) || 0;
  const logoMethod = normalizeDecorationMethod(state.decorationType);
  const logoUnitPrice = getLogoUnitPrice(logoMethod);
  const logos = state.uploadedLogo ? [{
    type: "logo",
    method: logoMethod,
    area: state.selectedArea,
    position: state.selectedArea,
    logo: state.uploadedLogo,
    dataUrl: state.uploadedLogo,
    url: state.uploadedLogo,
    image: state.uploadedLogo,
    unitPrice: logoUnitPrice,
    qualityPct: logoQualityPct
  }] : [];
  const legacyPositions = state.uploadedLogo ? [{
    position: state.selectedArea,
    name: state.selectedArea,
    method: logoMethod,
    logo: state.uploadedLogo,
    unitPrice: logoUnitPrice
  }] : [{ area: state.selectedArea, method: logoMethod }];
  const legacyPositionDesigns = state.uploadedLogo ? {
    [state.selectedArea]: {
      position: state.selectedArea,
      method: logoMethod,
      logo: state.uploadedLogo,
      dataUrl: state.uploadedLogo,
      url: state.uploadedLogo,
      unitPrice: logoUnitPrice
    }
  } : {};

  const basketColorImage = state.selectedColorImage || productShape.currentSrc || productShape.src || "";

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    code: productCode,
    productCode,
    name: state.productName,
    productName: state.productName,
    brand: state.brandName || "",
    brandLogo: state.brandLogo || "",
    colorsSnapshot: colours.map(([name, hex]) => ({ name, hex })),
    color: state.colourName,
    colorHex: state.colourHex,
    colorImage: basketColorImage,
    image: basketColorImage,
    quantities,
    totalQty: state.totalQty,
    unitPrice: parseFloat(unitPrice.toFixed(2)),
    positions: legacyPositions,
    positionDesigns: legacyPositionDesigns,
    logos
  };
}

function isNeutralToolMockupImage(url) {
  const source = String(url || "").trim();
  if (!source) return true;

  return Object.values(tshirtImages).some((imgUrl) => source.includes(imgUrl))
    || source.includes(tshirtFrontCustomImage)
    || source.includes(beanieFrontImage);
}

function upsertBasketItemFromState() {
  collectSizes();
  if (state.totalQty < 1) state.totalQty = 1;
  calculatePrice();

  const routeParams = new URLSearchParams(window.location.search);
  const isBasketLogoFlow = String(routeParams.get("from") || "").toLowerCase() === "basket" && routeParams.get("logoOnly") === "1";
  const sessionBasketIndexRaw = sessionStorage.getItem("customizingBasketIndex");
  const sessionBasketIndex = sessionBasketIndexRaw === null ? -1 : parseInt(sessionBasketIndexRaw, 10);
  const hasSessionBasketIndex = Number.isInteger(sessionBasketIndex) && sessionBasketIndex >= 0;
  const isBasketContext = isBasketLogoFlow || hasSessionBasketIndex || sessionStorage.getItem("returnAfterCustomize") === "basket";

  const basket = readQuoteBasket();
  const nextItem = buildBasketItemFromState();

  const inferredIndex = hasSessionBasketIndex && basket[sessionBasketIndex] ? sessionBasketIndex : -1;
  const fallbackIndex = basket.findIndex((item) => {
    const sameCode = String(item?.productCode || item?.code || "") === String(nextItem.productCode);
    const sameColor = String(item?.color || "").toLowerCase() === String(nextItem.color || "").toLowerCase();
    return sameCode && sameColor;
  });
  const matchIndex = inferredIndex >= 0 ? inferredIndex : fallbackIndex;

  if (matchIndex >= 0) {
    const previousId = basket[matchIndex].id;
    const prevItem = basket[matchIndex] || {};
    const previousPreview = prevItem.colorImage || prevItem.image || "";
    const nextLooksNeutral = isNeutralToolMockupImage(nextItem.colorImage || nextItem.image || "");
    const mergedLogos = isBasketContext && Array.isArray(nextItem.logos) && nextItem.logos.length > 0
      ? [...(Array.isArray(prevItem.logos) ? prevItem.logos : []), ...nextItem.logos]
      : nextItem.logos;
    const nextColorHex = normalizeHex(nextItem.colorHex || "");
    const prevColorHex = normalizeHex(prevItem.colorHex || "");

    const mergedPositions = isBasketContext
      ? (prevItem.positions || nextItem.positions)
      : nextItem.positions;

    const mergedPositionDesigns = isBasketContext
      ? { ...(prevItem.positionDesigns || {}), ...(nextItem.positionDesigns || {}) }
      : nextItem.positionDesigns;

    basket[matchIndex] = {
      ...prevItem,
      ...nextItem,
      positions: mergedPositions,
      positionDesigns: mergedPositionDesigns,
      logos: mergedLogos,
      colorHex: nextColorHex || prevColorHex || "",
      colorImage: (previousPreview && nextLooksNeutral) ? previousPreview : (nextItem.colorImage || previousPreview || ""),
      image: (previousPreview && nextLooksNeutral) ? previousPreview : (nextItem.image || previousPreview || ""),
      quantities: isBasketContext ? (prevItem.quantities || nextItem.quantities) : nextItem.quantities,
      qty: isBasketContext ? (prevItem.qty || nextItem.qty) : nextItem.qty,
      size: isBasketContext ? (prevItem.size || nextItem.size) : nextItem.size,
      totalQty: isBasketContext ? (prevItem.totalQty || nextItem.totalQty) : nextItem.totalQty,
      unitPrice: isBasketContext ? (prevItem.unitPrice || nextItem.unitPrice) : nextItem.unitPrice,
      id: previousId
    };
  } else {
    basket.push(nextItem);
  }

  writeQuoteBasket(basket);
  updateBasketUIFromStorage();

  return nextItem;
}

document.getElementById("changeProductBtn").addEventListener("click", () => {
  const changer = document.getElementById("productChanger");
  changer.style.display = changer.style.display === "none" ? "block" : "none";
});

productSelect.addEventListener("change", () => {
  state.product = productSelect.value;
  state.productName = productSelect.options[productSelect.selectedIndex].text;
  configureViewTabsForProduct();
  applyProductHeaderUI();
  applyArea();
});

document.getElementById("addSizeBtn").addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "size-row";
  row.innerHTML = `
    <select class="size-select">
      <option>XS</option>
      <option>Small</option>
      <option selected>Medium</option>
      <option>Large</option>
      <option>XL</option>
      <option>XXL</option>
      <option>3XL</option>
    </select>
    <input class="size-qty" type="number" min="1" value="1">
  `;
  sizesContainer.appendChild(row);
});

document.getElementById("applyProductBtn").addEventListener("click", () => {
  collectSizes();
  calculatePrice();
  renderMiniColours();
  openScreen("mainEditor");
});

mainQtyInput.addEventListener("input", () => {
  state.totalQty = parseInt(mainQtyInput.value) || 1;
  calculatePrice();
});

document.querySelectorAll("[data-text-type]").forEach(card => {
  card.addEventListener("click", () => {
    state.textType = card.dataset.textType;
    syncTextEditorFieldsFromState();
    openScreen("textEditorPage");
  });
});

// Text editor — colour swatches
document.querySelectorAll(".te-dot[data-colour]").forEach(dot => {
  dot.addEventListener("click", () => {
    document.querySelectorAll(".te-dot").forEach(d => d.classList.remove("selected"));
    dot.classList.add("selected");
    document.getElementById("textColourInput").value = dot.dataset.colour;
  });
});

// Custom colour picker sync
const textColourInput = document.getElementById("textColourInput");
if (textColourInput) {
  textColourInput.addEventListener("input", () => {
    document.querySelectorAll(".te-dot").forEach(d => d.classList.remove("selected"));
  });
}

// Char counter + font-family preview on textarea
const customTextInput = document.getElementById("customTextInput");
const teCharCount = document.getElementById("teCharCount");
if (customTextInput && teCharCount) {
  customTextInput.addEventListener("input", () => {
    teCharCount.textContent = customTextInput.value.length;
  });
}

const teLineBreakBtn = document.getElementById("teLineBreakBtn");
if (teLineBreakBtn && customTextInput) {
  teLineBreakBtn.addEventListener("click", () => {
    const start = customTextInput.selectionStart || 0;
    const end = customTextInput.selectionEnd || 0;
    const value = customTextInput.value;
    const next = `${value.slice(0, start)}\n${value.slice(end)}`;

    customTextInput.value = next;
    customTextInput.selectionStart = customTextInput.selectionEnd = start + 1;
    teCharCount.textContent = next.length;
    customTextInput.dispatchEvent(new Event("input", { bubbles: true }));
    customTextInput.focus();
  });
}

// Custom font picker
(function () {
  const trigger  = document.getElementById("teFontTrigger");
  const dropdown = document.getElementById("teFontDropdown");
  if (!trigger || !dropdown) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  dropdown.addEventListener("click", (event) => {
    const option = event.target.closest(".te-font-option");
    if (!option) return;

    setSelectedFont(option.dataset.font);
    dropdown.classList.remove("open");
  });

  // close when clicking outside
  document.addEventListener("click", (e) => {
    if (!trigger.closest(".te-font-picker").contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });

  setSelectedFont(state.font);
})();

document.getElementById("applyTextBtn").addEventListener("click", () => {
  state.text = document.getElementById("customTextInput").value.trim() || "TEXT";
  state.textColour = document.getElementById("textColourInput").value;
  state.font = document.getElementById("fontSelect").value;
  openScreen("mainEditor");

  showTextOnCanvas(state.text);
  calculatePrice();
});

function showTextOnCanvas(value) {
  textContent.textContent = value;
  textContent.style.color = state.textColour;
  textContent.style.fontFamily = getFontByName(state.font).cssFamily;
  textContent.style.textAlign = state.textAlign || "center";

  textLayer.style.display = "flex";
  textLayer.style.rotate = "0deg";
  textLayer.style.transform = "none";

  state.textRotation = 0;

  const placeText = () => {
    // Wait until main editor/custom area is visible to get real dimensions.
    if (customArea.clientWidth < 20 || customArea.clientHeight < 20) {
      requestAnimationFrame(placeText);
      return;
    }

    fitTextLayerToContent();
    centerText();
    textLayer.classList.remove("active-text");
    designLayer.classList.remove("active-logo");
    updateTextSizeLabels();
    updateVisibilityByPrintArea(textLayer);
  };

  placeText();
}

function fitTextLayerToContent() {
  const content = textContent.textContent || "TEXT";
  const style = window.getComputedStyle(textContent);
  const measurer = document.createElement("span");
  const maxWidth = Math.max(24, customArea.clientWidth - 1);
  const maxHeight = Math.max(24, customArea.clientHeight * 0.96);
  const initialFontSize = parseFloat(style.fontSize) || 48;
  const computedLineHeight = parseFloat(style.lineHeight);
  const lineHeightRatio = Number.isFinite(computedLineHeight) && initialFontSize > 0
    ? computedLineHeight / initialFontSize
    : 1.1;

  measurer.textContent = content;
  measurer.style.position = "absolute";
  measurer.style.visibility = "hidden";
  measurer.style.pointerEvents = "none";
  measurer.style.whiteSpace = "pre-line";
  measurer.style.fontFamily = style.fontFamily;
  measurer.style.fontSize = style.fontSize;
  measurer.style.fontWeight = style.fontWeight;
  measurer.style.fontStyle = style.fontStyle;
  measurer.style.letterSpacing = style.letterSpacing;
  measurer.style.lineHeight = `${lineHeightRatio}`;
  measurer.style.webkitTextStroke = style.webkitTextStroke;

  document.body.appendChild(measurer);
  let fontSize = initialFontSize;
  let bounds = measurer.getBoundingClientRect();

  // Shrink until text fits inside the printable box width/height.
  while ((bounds.width > maxWidth || bounds.height > maxHeight) && fontSize > 12) {
    fontSize -= 1;
    measurer.style.fontSize = `${fontSize}px`;
    bounds = measurer.getBoundingClientRect();
  }

  // Keep the current font size unless it overflows the printable area.

  document.body.removeChild(measurer);

  const strokeSize = parseFloat(style.webkitTextStrokeWidth || "0") || 0;
  const contentWidth = Math.min(maxWidth, Math.max(20, Math.ceil(bounds.width + strokeSize * 2 + 2)));
  const contentHeight = Math.min(maxHeight, Math.max(20, Math.ceil(bounds.height + strokeSize * 2 + 2)));

  textContent.style.fontSize = `${fontSize}px`;
  textLayer.style.width = `${contentWidth}px`;
  textLayer.style.height = `${contentHeight}px`;
}

function fitTextFontToLayerBounds() {
  const content = textContent.textContent || "TEXT";
  const style = window.getComputedStyle(textContent);
  const measurer = document.createElement("span");
  const maxWidth = Math.max(10, textLayer.clientWidth - 2);
  const initialFontSize = parseFloat(style.fontSize) || 24;
  const computedLineHeight = parseFloat(style.lineHeight);
  const lineHeightRatio = Number.isFinite(computedLineHeight) && initialFontSize > 0
    ? computedLineHeight / initialFontSize
    : 1.1;

  measurer.textContent = content;
  measurer.style.position = "absolute";
  measurer.style.visibility = "hidden";
  measurer.style.pointerEvents = "none";
  measurer.style.whiteSpace = "pre-line";
  measurer.style.fontFamily = style.fontFamily;
  measurer.style.fontWeight = style.fontWeight;
  measurer.style.fontStyle = style.fontStyle;
  measurer.style.letterSpacing = style.letterSpacing;
  measurer.style.lineHeight = `${lineHeightRatio}`;
  measurer.style.webkitTextStroke = style.webkitTextStroke;

  let fontSize = initialFontSize;
  measurer.style.fontSize = `${fontSize}px`;
  document.body.appendChild(measurer);

  let bounds = measurer.getBoundingClientRect();
  while (bounds.width > maxWidth && fontSize > 4) {
    fontSize -= 1;
    measurer.style.fontSize = `${fontSize}px`;
    bounds = measurer.getBoundingClientRect();
  }

  // If there is extra gap, grow text until it nearly reaches the layer bounds.
  while (bounds.width < maxWidth * 0.985 && fontSize < 420) {
    fontSize += 1;
    measurer.style.fontSize = `${fontSize}px`;
    const nextBounds = measurer.getBoundingClientRect();

    if (nextBounds.width > maxWidth) {
      fontSize -= 1;
      measurer.style.fontSize = `${fontSize}px`;
      bounds = measurer.getBoundingClientRect();
      break;
    }

    bounds = nextBounds;
  }

  document.body.removeChild(measurer);
  textContent.style.fontSize = `${fontSize}px`;

  const strokeSize = parseFloat(style.webkitTextStrokeWidth || "0") || 0;
  const fittedWidth = Math.max(20, Math.ceil(bounds.width + strokeSize * 2 + 2));
  const fittedHeight = Math.max(20, Math.ceil(bounds.height + strokeSize * 2 + 2));
  textLayer.style.width = `${fittedWidth}px`;
  textLayer.style.height = `${fittedHeight}px`;
}

function centerText() {
  textLayer.style.left = `${customArea.offsetWidth / 2 - textLayer.offsetWidth / 2}px`;
  textLayer.style.top = `${customArea.offsetHeight / 2 - textLayer.offsetHeight / 2}px`;
  updateVisibilityByPrintArea(textLayer);
}

function activateText() {
  if (!state.text) return;
  textLayer.classList.add("active-text");
  designLayer.classList.remove("active-logo");
  updateTextSizeLabels();
}

function setTextAlignment(align) {
  const allowedAlignments = ["left", "center", "right"];
  const normalized = allowedAlignments.includes(align) ? align : "center";

  state.textAlign = normalized;
  textContent.style.textAlign = normalized;
  if (customTextInput) customTextInput.style.textAlign = normalized;

  const inlineTextInput = document.getElementById("teInlineTextInput");
  if (inlineTextInput) inlineTextInput.style.textAlign = normalized;

  document.querySelectorAll(".text-align-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.align === normalized);
  });

  document.querySelectorAll(".te-inline-align-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.inlineAlign === normalized);
  });
}

function updateTextSizeLabels() {
  const textRect = textContent.getBoundingClientRect();
  const widthPx = Math.max(1, Math.ceil(textRect.width));
  const heightPx = Math.max(1, Math.ceil(textRect.height));
  const pxPerCm = getEffectivePxPerCm();
  const widthCm = (widthPx / pxPerCm).toFixed(2);
  const heightCm = (heightPx / pxPerCm).toFixed(2);
  const label = `${widthCm}cm x ${heightCm}cm`;

  textSizeLabel.textContent = label;
  textPropertySizeLabel.textContent = label;

  const inlineSizeLabel = document.getElementById("teInlineSizeLabel");
  if (inlineSizeLabel) inlineSizeLabel.textContent = label;
}

textSettingsBtn.addEventListener("click", e => {
  e.stopPropagation();
  syncTextEditorFieldsFromState();
  openScreen("textEditorPage");
  setTeAccordionOpen("tePositionItem", false);
  setTeAccordionOpen("teTextPropertiesItem", false);
});

function openTextPropertiesPage(section = "formatting") {
  textPropertyInput.value = state.text || textContent.textContent;
  textPropertyColour.value = state.textColour;
  textRotateInput.value = Math.round(state.textRotation || 0);
  setTextAlignment(state.textAlign || "center");
  updateTextSizeLabels();

  const panel = document.getElementById("textPositionSizePanel");
  if (panel) {
    panel.classList.toggle("open", section === "position");
  }

  openScreen("textPropertiesPage");
}

const openTePositionSizeBtn = document.getElementById("openTePositionSize");
const openTeTextPropertiesBtn = document.getElementById("openTeTextProperties");

function setTeAccordionOpen(itemId, forceState = null) {
  const item = document.getElementById(itemId);
  const panel = item ? item.querySelector(".te-dropdown-panel") : null;
  if (!item || !panel) return;

  const openState = forceState === null ? !item.classList.contains("open") : !!forceState;
  item.classList.toggle("open", openState);

  const trigger = item.querySelector(".te-property-link");
  if (trigger) {
    trigger.setAttribute("aria-expanded", openState ? "true" : "false");
  }
}

function syncTextEditorFieldsFromState() {
  const activeAlign = state.textAlign || "center";

  if (customTextInput) {
    customTextInput.value = state.text || textContent.textContent || "";
    customTextInput.style.textAlign = activeAlign;
    if (teCharCount) teCharCount.textContent = customTextInput.value.length;
  }

  if (textColourInput) textColourInput.value = state.textColour || "#ff2b2b";

  const inlineTextInput = document.getElementById("teInlineTextInput");
  if (inlineTextInput) {
    inlineTextInput.value = state.text || textContent.textContent || "";
    inlineTextInput.style.textAlign = activeAlign;
  }

  const inlineColourInput = document.getElementById("teInlineColourInput");
  if (inlineColourInput) inlineColourInput.value = state.textColour || "#ff2b2b";

  const inlineRotateInput = document.getElementById("teInlineRotateInput");
  if (inlineRotateInput) inlineRotateInput.value = Math.round(state.textRotation || 0);

  const inlineSizeLabel = document.getElementById("teInlineSizeLabel");
  if (inlineSizeLabel) inlineSizeLabel.textContent = textSizeLabel.textContent;

  const inlineResizeCheck = document.getElementById("teInlineResizeProportionallyCheck");
  if (inlineResizeCheck) inlineResizeCheck.checked = textResizeProportionallyCheck.checked;

  document.querySelectorAll(".te-inline-align-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.inlineAlign === (state.textAlign || "center"));
  });
}

if (openTePositionSizeBtn) {
  openTePositionSizeBtn.addEventListener("click", () => setTeAccordionOpen("tePositionItem"));
}

if (openTeTextPropertiesBtn) {
  openTeTextPropertiesBtn.addEventListener("click", () => setTeAccordionOpen("teTextPropertiesItem"));
}

deleteTextBtn.addEventListener("click", e => {
  e.stopPropagation();

  state.text = "";
  textContent.textContent = "";
  textLayer.style.display = "none";
  textLayer.classList.remove("active-text");
  calculatePrice();
});

document.querySelectorAll("[data-design-type]").forEach(card => {
  card.addEventListener("click", () => {
    if (card.classList.contains("is-disabled")) return;
    state.decorationType = card.dataset.designType;
    const library = getSessionLogoLibrary();
    if (library.length > 0) {
      showLogoLibraryPicker(library);
    } else {
      document.getElementById("logoFileInput").click();
    }
  });
});

// In-session logos the user already uploaded (kept so we don't re-open the gallery).
const sessionLogoLibrary = [];

function getSessionLogoLibrary() {
  const seen = new Set();
  const out = [];
  const add = (src, method) => {
    const key = String(src || "").trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ logo: key, method: method || "logo" });
  };
  sessionLogoLibrary.forEach((entry) => add(entry.logo, entry.method));
  try {
    const parsed = JSON.parse(sessionStorage.getItem("toolReusableLogos") || "[]");
    if (Array.isArray(parsed)) parsed.forEach((entry) => entry && add(entry.logo, entry.method));
  } catch (e) { /* ignore */ }
  return out;
}

function rememberUploadedLogo(src, method) {
  const key = String(src || "").trim();
  if (!key) return;
  if (sessionLogoLibrary.some((entry) => entry.logo === key)) return;
  sessionLogoLibrary.push({ logo: key, method: method || state.decorationType || "logo" });
}

function reuseLibraryLogo(src) {
  state.copyrightConfirmed = true;
  openScreen("mainEditor");
  showLogoOnCanvas(src);
  calculatePrice();
  updateConfirmButtonState();
}

function showLogoLibraryPicker(library) {
  const existing = document.getElementById("toolLogoLibraryOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "toolLogoLibraryOverlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;";

  const panel = document.createElement("div");
  panel.style.cssText = "width:min(94vw,520px);background:#fff;border-radius:16px;box-shadow:0 16px 36px rgba(2,8,23,.22);padding:18px 16px;";
  panel.innerHTML = `
    <h3 style="margin:0 0 4px;font-size:18px;line-height:1.2;color:#0f172a;">Your logos</h3>
    <p style="margin:0 0 12px;font-size:13px;line-height:1.4;color:#475569;">Tap a logo to reuse it, or upload a new one.</p>
    <div id="toolLogoLibraryGrid" style="display:flex;gap:10px;overflow-x:auto;padding:2px 0 8px;"></div>
    <button id="toolLogoLibraryUpload" type="button" style="display:block;width:100%;margin-top:6px;padding:12px 14px;border-radius:10px;border:1px solid #0f172a;background:#0f172a;color:#fff;font-weight:700;cursor:pointer;">Upload new logo</button>
    <button id="toolLogoLibraryCancel" type="button" style="display:block;width:100%;margin-top:10px;padding:10px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-weight:600;cursor:pointer;">Cancel</button>
  `;

  const grid = panel.querySelector("#toolLogoLibraryGrid");
  library.forEach((entry) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.style.cssText = "flex:0 0 auto;width:90px;height:90px;border-radius:12px;border:1px solid #e2e8f0;background:#f8fafc center/contain no-repeat;cursor:pointer;padding:0;";
    cell.style.backgroundImage = `url("${entry.logo}")`;
    cell.title = "Reuse this logo";
    cell.addEventListener("click", () => {
      overlay.remove();
      state.decorationType = entry.method || state.decorationType || "logo";
      reuseLibraryLogo(entry.logo);
    });
    grid.appendChild(cell);
  });

  panel.querySelector("#toolLogoLibraryUpload").addEventListener("click", () => {
    overlay.remove();
    document.getElementById("logoFileInput").click();
  });
  panel.querySelector("#toolLogoLibraryCancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => { if (event.target === overlay) overlay.remove(); });

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

function maybeHandleBasketLogoChoice() {
  const params = new URLSearchParams(window.location.search);
  const fromBasket = String(params.get("from") || "").toLowerCase() === "basket";
  const wantsChoice = params.get("askLogoChoice") === "1" || sessionStorage.getItem("toolAskLogoChoice") === "1";
  if (!fromBasket || !wantsChoice) return;

  let reusableLogos = [];
  try {
    const parsed = JSON.parse(sessionStorage.getItem("toolReusableLogos") || "[]");
    reusableLogos = Array.isArray(parsed) ? parsed.filter((logo) => !!(logo && logo.logo)) : [];
  } catch (error) {
    reusableLogos = [];
  }

  sessionStorage.removeItem("toolAskLogoChoice");
  if (params.get("askLogoChoice") === "1") {
    params.delete("askLogoChoice");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash || ""}`;
    window.history.replaceState({}, "", nextUrl);
  }

  if (reusableLogos.length === 0) {
    showPositionPickerModal({
      title: "Pick your new position",
      subtitle: "Choose where to place your new logo",
      restrictToRemaining: true,
      onPick: () => {
        clearLogo();
        openScreen("designTypePage");
      }
    });
    return;
  }

  const existing = document.getElementById("basketLogoChoiceOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "basketLogoChoiceOverlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;";

  const panel = document.createElement("div");
  panel.style.cssText = "width:min(92vw,420px);background:#fff;border-radius:16px;box-shadow:0 16px 36px rgba(2,8,23,.22);padding:18px 16px;";

  panel.innerHTML = `
    <h3 style="margin:0 0 8px;font-size:18px;line-height:1.2;color:#0f172a;">Add Another Logo</h3>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.45;color:#334155;">Choose one option:</p>
    <button id="choiceUseSameLogo" type="button" style="display:block;width:100%;margin:0 0 10px;padding:12px 14px;border-radius:10px;border:1px solid #0f172a;background:#0f172a;color:#fff;font-weight:700;cursor:pointer;">Use same logo</button>
    <button id="choiceAddNewLogo" type="button" style="display:block;width:100%;margin:0 0 10px;padding:12px 14px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:700;cursor:pointer;">Add new logo</button>
    <button id="choiceCancelLogo" type="button" style="display:block;width:100%;padding:10px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-weight:600;cursor:pointer;">Cancel</button>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const closeChoice = () => {
    overlay.remove();
  };

  const useSameBtn = panel.querySelector("#choiceUseSameLogo");
  const addNewBtn = panel.querySelector("#choiceAddNewLogo");
  const cancelBtn = panel.querySelector("#choiceCancelLogo");

  if (useSameBtn) {
    useSameBtn.addEventListener("click", () => {
      const selected = reusableLogos[0];
      closeChoice();
      showPositionPickerModal({
        title: "Pick your new position",
        subtitle: "Select one of the remaining positions",
        restrictToRemaining: true,
        onPick: () => {
          state.decorationType = selected.method || state.decorationType || "logo";
          state.copyrightConfirmed = true;
          showLogoOnCanvas(selected.logo);
          updateConfirmButtonState();
          openScreen("mainEditor");
        }
      });
    });
  }

  if (addNewBtn) {
    addNewBtn.addEventListener("click", () => {
      closeChoice();
      showPositionPickerModal({
        title: "Pick your new position",
        subtitle: "Then upload your new logo",
        restrictToRemaining: true,
        onPick: () => {
          clearLogo();
          openScreen("designTypePage");
        }
      });
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      closeChoice();
    });
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeChoice();
  });
}

function normalizeAreaForPicker(area) {
  const raw = String(area || "").toLowerCase().trim();
  if (!raw) return "";
  if (raw.includes("front")) return "front";
  if (raw.includes("back")) return "back";
  if (raw.includes("left")) return "left";
  if (raw.includes("right")) return "right";
  return raw;
}

function areaLabelForPicker(area) {
  const normalized = normalizeAreaForPicker(area);
  if (normalized === "front") return "Front";
  if (normalized === "back") return "Back";
  if (normalized === "left") return "Left";
  if (normalized === "right") return "Right";
  return "Front";
}

function getPickerAreas() {
  // Beanies are front-only — never offer Back/Left/Right.
  if (state.product === "beanie") return ["front"];
  const areas = [];
  document.querySelectorAll(".view-tab[data-area]").forEach((btn) => {
    if (btn.hidden) return;
    const normalized = normalizeAreaForPicker(btn.dataset.area);
    if (normalized && !areas.includes(normalized)) {
      areas.push(normalized);
    }
  });
  if (areas.length === 0) return ["front", "back", "left", "right"];
  return areas;
}

function getUsedLogoAreasForCurrentProduct() {
  const used = new Set();
  const code = String(state.productCode || "").trim().toLowerCase();
  const color = String(state.colourName || "").trim().toLowerCase();
  if (!code) return used;

  const basket = readQuoteBasket();
  basket.forEach((item) => {
    const itemCode = String(item?.productCode || item?.code || "").trim().toLowerCase();
    const itemColor = String(item?.color || "").trim().toLowerCase();
    if (itemCode !== code || itemColor !== color) return;

    const logos = Array.isArray(item?.logos) ? item.logos : [];
    logos.forEach((logo) => {
      const area = normalizeAreaForPicker(logo?.position || logo?.area);
      if (area) used.add(area);
    });
  });

  return used;
}

function setSelectedAreaFromPicker(area) {
  const normalized = normalizeAreaForPicker(area) || "front";
  state.selectedArea = normalized;

  document.querySelectorAll(".view-tab").forEach((btn) => {
    const isActive = normalizeAreaForPicker(btn.dataset.area) === normalized;
    btn.classList.toggle("active-view", isActive);
  });

  const viewLabel = document.getElementById("viewNameLabel");
  if (viewLabel) viewLabel.textContent = normalized.toUpperCase();

  applyArea();
}

function showPositionPickerModal(options = {}) {
  const {
    title = "Pick your new position",
    subtitle = "",
    restrictToRemaining = false,
    onPick,
    onCancel
  } = options;

  const existing = document.getElementById("toolPositionPickerOverlay");
  if (existing) existing.remove();

  const allAreas = getPickerAreas();
  const usedAreas = getUsedLogoAreasForCurrentProduct();
  let choices = restrictToRemaining
    ? allAreas.filter((area) => !usedAreas.has(area))
    : [...allAreas];

  if (choices.length === 0) choices = [...allAreas];

  const overlay = document.createElement("div");
  overlay.id = "toolPositionPickerOverlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;";

  const panel = document.createElement("div");
  panel.style.cssText = "width:min(94vw,520px);background:#fff;border-radius:16px;box-shadow:0 16px 36px rgba(2,8,23,.22);padding:16px;";

  const subtitleHtml = subtitle ? `<p style=\"margin:0 0 12px;font-size:13px;line-height:1.4;color:#475569;\">${subtitle}</p>` : "";
  panel.innerHTML = `
    <h3 style="margin:0 0 8px;font-size:18px;line-height:1.2;color:#0f172a;">${title}</h3>
    ${subtitleHtml}
    <div id="toolPositionPickerChoices" style="display:flex;gap:8px;overflow-x:auto;white-space:nowrap;padding-bottom:2px;"></div>
    <button id="toolPositionPickerCancel" type="button" style="display:block;width:100%;margin-top:12px;padding:10px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-weight:600;cursor:pointer;">Cancel</button>
  `;

  const choicesWrap = panel.querySelector("#toolPositionPickerChoices");
  choices.forEach((area) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = areaLabelForPicker(area);
    btn.style.cssText = "flex:0 0 auto;padding:10px 14px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:700;cursor:pointer;";
    btn.addEventListener("click", () => {
      setSelectedAreaFromPicker(area);
      overlay.remove();
      if (typeof onPick === "function") onPick(area);
    });
    choicesWrap.appendChild(btn);
  });

  const cancelBtn = panel.querySelector("#toolPositionPickerCancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      overlay.remove();
      if (typeof onCancel === "function") onCancel();
    });
  }

  overlay.addEventListener("click", (event) => {
    if (event.target !== overlay) return;
    overlay.remove();
    if (typeof onCancel === "function") onCancel();
  });

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

document.getElementById("logoFileInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    state.uploadedLogo = e.target.result;
    state.originalUploadedLogo = e.target.result;
    rememberUploadedLogo(e.target.result, state.decorationType);

    const copyrightPreview = document.getElementById("copyrightImagePreview");
    if (copyrightPreview) {
      copyrightPreview.src = state.uploadedLogo;
    }

    const checkbox = document.getElementById("copyrightCheckbox");
    if (checkbox) {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change"));
    }

    state.copyrightConfirmed = false;
    updateConfirmButtonState();
    openScreen("copyrightPage");
  };

  reader.readAsDataURL(file);
});

document.getElementById("continueLogoBtn").addEventListener("click", () => {
  if (!state.uploadedLogo) {
    alert("Please upload a design first.");
    return;
  }

  const copyrightPreview = document.getElementById("copyrightImagePreview");
  if (copyrightPreview) {
    copyrightPreview.src = state.uploadedLogo;
  }

  const checkbox = document.getElementById("copyrightCheckbox");
  if (checkbox) {
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change"));
  }

  state.copyrightConfirmed = false;
  updateConfirmButtonState();
  openScreen("copyrightPage");
});

const copyrightCheckbox = document.getElementById("copyrightCheckbox");
const copyrightCheckCard = document.querySelector(".copyright-check");

if (copyrightCheckbox && copyrightCheckCard) {
  const syncCopyrightCheckState = () => {
    copyrightCheckCard.classList.toggle("is-checked", copyrightCheckbox.checked);
  };

  copyrightCheckbox.addEventListener("change", syncCopyrightCheckState);
  syncCopyrightCheckState();
}

document.getElementById("copyrightOkBtn").addEventListener("click", () => {
  const checkbox = document.getElementById("copyrightCheckbox");
  const checkCard = document.querySelector(".copyright-check");

  if (!checkbox.checked) {
    if (checkCard) {
      checkCard.classList.remove("needs-attention");
      void checkCard.offsetWidth;
      checkCard.classList.add("needs-attention");
      checkCard.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => checkCard.classList.remove("needs-attention"), 2600);
    }
    checkbox.focus({ preventScroll: true });
    return;
  }

  state.copyrightConfirmed = true;
  openScreen("mainEditor");
  showLogoOnCanvas(state.uploadedLogo);
  calculatePrice();
  updateConfirmButtonState();
});

function showLogoOnCanvas(imageSrc) {
  state.uploadedLogo = imageSrc;

  uploadedLogo.src = imageSrc;
  uploadedLogo.style.display = "block";

  designLayer.style.display = "block";
  designLayer.style.rotate = "0deg";
  designLayer.style.transform = "none";

  state.logoRotation = 0;

  const placeLogo = () => {
    // When main editor is hidden, customArea measures as 0x0; wait until visible.
    if (customArea.clientWidth < 20 || customArea.clientHeight < 20) {
      requestAnimationFrame(placeLogo);
      return;
    }

    fitLogoToPrintArea();
    centerLogo();
    activateLogo();
    updateLogoSizeLabels();
    updateVisibilityByPrintArea(designLayer);
  };

  if (uploadedLogo.complete && uploadedLogo.naturalWidth > 0 && uploadedLogo.naturalHeight > 0) {
    placeLogo();
    return;
  }

  uploadedLogo.onload = () => {
    placeLogo();
    uploadedLogo.onload = null;
  };
}

function fitLogoToPrintArea() {
  const imageRatio = getLogoAspectRatio();
  const pxPerCm = getPxPerCm();

  // Beanie: embroidery on the folding area — start at 6cm HEIGHT (calibrated to
  // the cuff area, see BEANIE_CM_SCALE), width follows the logo ratio, centred.
  if (state.product === "beanie") {
    const logoFrameEl = getLogoFrameEl();
    const beanieHeight = BEANIE_INITIAL_HEIGHT_CM * getEffectivePxPerCm();
    const beanieWidth = beanieHeight * imageRatio;
    logoFrameEl.style.width = `${Math.round(beanieWidth)}px`;
    logoFrameEl.style.height = `${Math.round(beanieHeight)}px`;
    return;
  }

  // Start each newly loaded logo at ~30cm relative to garment printable area.
  const targetWidth = Math.max(30, INITIAL_LOGO_WIDTH_CM * pxPerCm);
  const maxWidth = Math.max(60, getPrintableReferenceWidthPx() * 1.04);
  const maxHeight = Math.max(60, getPrintableReferenceHeightPx() * 0.98);

  let width = Math.min(targetWidth, maxWidth);
  let height = width / imageRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * imageRatio;
  }

  if (width > maxWidth) {
    width = maxWidth;
    height = width / imageRatio;
  }

  const logoFrame = getLogoFrameEl();
  logoFrame.style.width = `${Math.round(width)}px`;
  logoFrame.style.height = `${Math.round(height)}px`;
}

function getLogoAspectRatio() {
  const naturalWidth = uploadedLogo.naturalWidth || 0;
  const naturalHeight = uploadedLogo.naturalHeight || 0;

  if (naturalWidth > 0 && naturalHeight > 0) {
    return naturalWidth / naturalHeight;
  }

  const logoFrame = getLogoFrameEl();
  const fallbackHeight = Math.max(1, logoFrame.offsetHeight || 1);
  const fallbackWidth = Math.max(1, logoFrame.offsetWidth || 1);
  return fallbackWidth / fallbackHeight;
}

function getRenderedLogoSizePx() {
  const logoFrame = getLogoFrameEl();
  const containerWidth = Math.max(1, logoFrame.offsetWidth);
  const containerHeight = Math.max(1, logoFrame.offsetHeight);
  const logoRatio = getLogoAspectRatio();
  const containerRatio = containerWidth / containerHeight;

  if (containerRatio > logoRatio) {
    const height = containerHeight;
    const width = height * logoRatio;
    return { width, height };
  }

  const width = containerWidth;
  const height = width / logoRatio;
  return { width, height };
}

function centerLogo() {
  const logoFrame = getLogoFrameEl();
  designLayer.style.left = `${customArea.offsetWidth / 2 - logoFrame.offsetWidth / 2}px`;
  designLayer.style.top = `${customArea.offsetHeight / 2 - logoFrame.offsetHeight / 2}px`;
  updateVisibilityByPrintArea(designLayer);
}

function activateLogo() {
  if (!state.uploadedLogo) return;
  designLayer.classList.add("active-logo");
  textLayer.classList.remove("active-text");
  updateLogoSizeLabels();
}

function updateLogoSizeLabels() {
  const renderedSize = getRenderedLogoSizePx();
  const pxPerCm = getEffectivePxPerCm();
  const widthCm = (renderedSize.width / pxPerCm).toFixed(2);
  const heightCm = (renderedSize.height / pxPerCm).toFixed(2);
  const label = `${widthCm}cm x ${heightCm}cm`;

  logoSizeLabel.textContent = label;
  propertySizeLabel.textContent = label;
  updateQualityBar(parseFloat(widthCm));
}

function updateQualityBar(widthCm) {
  const mask = document.getElementById('qualityMask');
  const pctEl = document.getElementById('qualityPct');
  const mainBar = document.getElementById('mainQualityBar');
  const mainMask = document.getElementById('mainQualityMask');
  const mainPct = document.getElementById('mainQualityPct');

  // quality: 20% at full print area (30cm), 100% at 12cm or smaller
  const maxCm = PRINT_AREA_WIDTH_CM;
  const minCm = 12;
  const quality = Math.max(20, Math.min(100, Math.round(20 + (maxCm - widthCm) / (maxCm - minCm) * 80)));
  const maskWidth = 100 - quality;

  function applyToBar(maskEl, pctElLocal) {
    if (!maskEl || !pctElLocal) return;
    maskEl.style.width = maskWidth + '%';
    if (maskWidth === 0) maskEl.style.borderRadius = '0';
    else maskEl.style.borderRadius = '0 8px 8px 0';
    pctElLocal.textContent = quality + '%';
    if (quality < 35) pctElLocal.style.color = '#e53e3e';
    else if (quality < 50) pctElLocal.style.color = '#ed8936';
    else if (quality < 65) pctElLocal.style.color = '#ecc94b';
    else pctElLocal.style.color = '#48bb78';
  }

  applyToBar(mask, pctEl);
  applyToBar(mainMask, mainPct);

  const warning = document.getElementById('qualityWarning');
  if (warning) warning.style.display = 'flex';
}

logoSettingsBtn.addEventListener("click", e => {
  e.stopPropagation();
  updateLogoSizeLabels();
  rotateInput.value = Math.round(state.logoRotation || 0);
  openScreen("imagePropertiesPage");
});

deleteLogoBtn.addEventListener("click", e => {
  e.stopPropagation();
  clearLogo();
});

document.getElementById("deleteDesignShortcut").addEventListener("click", clearLogo);

function clearLogo() {
  uploadedLogo.src = "";
  uploadedLogo.style.display = "none";
  designLayer.style.display = "none";
  designLayer.classList.remove("active-logo");

  state.uploadedLogo = null;
  state.originalUploadedLogo = null;
  state.copyrightConfirmed = false;
  state.logoRotation = 0;
  updateConfirmButtonState();

  // Reset quality bar to 0%
  const mainBarReset = document.getElementById('mainQualityBar');
  const mainMaskReset = document.getElementById('mainQualityMask');
  const mainPctReset = document.getElementById('mainQualityPct');
  if (mainMaskReset) { mainMaskReset.style.width = '100%'; mainMaskReset.style.borderRadius = '0 6px 6px 0'; }
  if (mainPctReset) { mainPctReset.textContent = '0%'; mainPctReset.style.color = '#9098a3'; }
  const warningReset = document.getElementById('qualityWarning');
  if (warningReset) warningReset.style.display = 'none';

  calculatePrice();
}

if (confirmQualityBtn) {
  confirmQualityBtn.addEventListener("click", () => {
    if (!state.uploadedLogo) {
      alert("Please upload your logo before confirming.");
      return;
    }

    if (!state.copyrightConfirmed) {
      alert("Please confirm copyright permission first.");
      return;
    }

    upsertBasketItemFromState();
    const previousText = confirmQualityBtn.textContent;
    confirmQualityBtn.classList.add("is-confirmed");
    confirmQualityBtn.textContent = "CONFIRMED";
    setTimeout(() => {
      confirmQualityBtn.textContent = previousText;
      confirmQualityBtn.classList.remove("is-confirmed");
    }, 1200);
    showPostConfirmModal();
  });
}

const postConfirmAddAnotherLogoBtn = document.getElementById("postConfirmAddAnotherLogo");
if (postConfirmAddAnotherLogoBtn) {
  postConfirmAddAnotherLogoBtn.addEventListener("click", () => {
    closePostConfirmModal();
    clearLogo();
    openScreen("designTypePage");
  });
}

const postConfirmContinueShoppingBtn = document.getElementById("postConfirmContinueShopping");
if (postConfirmContinueShoppingBtn) {
  postConfirmContinueShoppingBtn.addEventListener("click", () => {
    window.location.href = "../shop.html";
  });
}

const postConfirmViewBasketBtn = document.getElementById("postConfirmViewBasket");
if (postConfirmViewBasketBtn) {
  postConfirmViewBasketBtn.addEventListener("click", () => {
    window.location.href = "../basket.html";
  });
}

const postConfirmCloseBtn = document.getElementById("postConfirmClose");
if (postConfirmCloseBtn) {
  postConfirmCloseBtn.addEventListener("click", closePostConfirmModal);
}

const postConfirmModal = document.getElementById("postConfirmModal");
if (postConfirmModal) {
  postConfirmModal.addEventListener("click", (event) => {
    if (event.target === postConfirmModal) {
      closePostConfirmModal();
    }
  });
}

let logoAction = null;
let logoStartX = 0;
let logoStartY = 0;
let logoStartLeft = 0;
let logoStartTop = 0;
let logoStartWidth = 0;
let logoStartHeight = 0;
let logoStartRotation = 0;
let logoStartAngle = 0;

let textAction = null;
let textStartX = 0;
let textStartY = 0;
let textStartLeft = 0;
let textStartTop = 0;
let textStartWidth = 0;
let textStartHeight = 0;
let textStartRotation = 0;
let textStartAngle = 0;

designLayer.addEventListener("pointerdown", e => {
  if (!state.uploadedLogo) return;

  if (
    e.target.closest(".logo-toolbar") ||
    e.target.closest(".logo-size-label") ||
    e.target.classList.contains("resize-dot") ||
    e.target.id === "rotateHandle" ||
    e.target.tagName === "BUTTON"
  ) return;

  e.preventDefault();

  logoAction = "move";

  const logoFrame = getLogoFrameEl();
  const rect = logoFrame.getBoundingClientRect();
  const parentRect = customArea.getBoundingClientRect();

  logoStartX = e.clientX;
  logoStartY = e.clientY;
  logoStartLeft = rect.left - parentRect.left;
  logoStartTop = rect.top - parentRect.top;

  activateLogo();
  designLayer.setPointerCapture(e.pointerId);
});

document.querySelectorAll(".resize-dot").forEach(handle => {
  handle.addEventListener("pointerdown", e => {
    if (!state.uploadedLogo) return;

    e.preventDefault();
    e.stopPropagation();

    logoAction = handle.dataset.resize;

    const rect = designLayer.getBoundingClientRect();
    const parentRect = customArea.getBoundingClientRect();

    logoStartX = e.clientX;
    logoStartY = e.clientY;
    logoStartLeft = rect.left - parentRect.left;
    logoStartTop = rect.top - parentRect.top;
    const logoFrame = getLogoFrameEl();
    logoStartWidth = logoFrame.offsetWidth;
    logoStartHeight = logoFrame.offsetHeight;

    activateLogo();
    handle.setPointerCapture(e.pointerId);
  });
});

rotateHandle.addEventListener("pointerdown", e => {
  if (!state.uploadedLogo) return;

  e.preventDefault();
  e.stopPropagation();

  logoAction = "rotate";

  const rect = designLayer.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  logoStartAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  logoStartRotation = state.logoRotation || 0;

  activateLogo();
  rotateHandle.setPointerCapture(e.pointerId);
});

textLayer.addEventListener("pointerdown", e => {
  if (!state.text) return;

  if (
    e.target.classList.contains("text-resize-dot") ||
    e.target.id === "textRotateHandle" ||
    e.target.tagName === "BUTTON"
  ) return;

  e.preventDefault();

  textAction = "move";

  const rect = textLayer.getBoundingClientRect();
  const parentRect = customArea.getBoundingClientRect();

  textStartX = e.clientX;
  textStartY = e.clientY;
  textStartLeft = rect.left - parentRect.left;
  textStartTop = rect.top - parentRect.top;

  activateText();
  textLayer.setPointerCapture(e.pointerId);
});

document.querySelectorAll(".text-resize-dot").forEach(handle => {
  handle.addEventListener("pointerdown", e => {
    if (!state.text) return;

    e.preventDefault();
    e.stopPropagation();

    textAction = handle.dataset.textResize;

    const rect = textLayer.getBoundingClientRect();
    const parentRect = customArea.getBoundingClientRect();

    textStartX = e.clientX;
    textStartY = e.clientY;
    textStartLeft = rect.left - parentRect.left;
    textStartTop = rect.top - parentRect.top;
    textStartWidth = textLayer.offsetWidth;
    textStartHeight = textLayer.offsetHeight;

    activateText();
    handle.setPointerCapture(e.pointerId);
  });
});

textRotateHandle.addEventListener("pointerdown", e => {
  if (!state.text) return;

  e.preventDefault();
  e.stopPropagation();

  textAction = "rotate";

  const rect = textLayer.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  textStartAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  textStartRotation = state.textRotation || 0;

  activateText();
  textRotateHandle.setPointerCapture(e.pointerId);
});

document.addEventListener("pointermove", e => {
  if (logoAction) handleObjectTransform(e, "logo");
  if (textAction) handleObjectTransform(e, "text");
});

document.addEventListener("pointerup", () => {
  logoAction = null;
  textAction = null;
});

function handleObjectTransform(e, type) {
  e.preventDefault();

  const isLogo = type === "logo";
  const layer = isLogo ? designLayer : textLayer;
  const action = isLogo ? logoAction : textAction;

  if (action === "move") {
    const dx = e.clientX - (isLogo ? logoStartX : textStartX);
    const dy = e.clientY - (isLogo ? logoStartY : textStartY);
    const startLeft = isLogo ? logoStartLeft : textStartLeft;
    const startTop = isLogo ? logoStartTop : textStartTop;

    layer.style.left = `${startLeft + dx}px`;
    layer.style.top = `${startTop + dy}px`;
    layer.style.transform = "none";

    isLogo ? updateLogoSizeLabels() : updateTextSizeLabels();
    updateVisibilityByPrintArea(layer);
    return;
  }

  if (action === "rotate") {
    const rect = layer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

    if (isLogo) {
      const angleDiff = currentAngle - logoStartAngle;
      state.logoRotation = logoStartRotation + angleDiff * (180 / Math.PI);
      designLayer.style.rotate = `${state.logoRotation}deg`;
      rotateInput.value = Math.round(state.logoRotation);
      updateVisibilityByPrintArea(designLayer);
    } else {
      const angleDiff = currentAngle - textStartAngle;
      state.textRotation = textStartRotation + angleDiff * (180 / Math.PI);
      textLayer.style.rotate = `${state.textRotation}deg`;
      textRotateInput.value = Math.round(state.textRotation);
      updateVisibilityByPrintArea(textLayer);
    }

    return;
  }

  const startX = isLogo ? logoStartX : textStartX;
  const startY = isLogo ? logoStartY : textStartY;
  const startLeft = isLogo ? logoStartLeft : textStartLeft;
  const startTop = isLogo ? logoStartTop : textStartTop;
  const startWidth = isLogo ? logoStartWidth : textStartWidth;
  const startHeight = isLogo ? logoStartHeight : textStartHeight;
  const proportional = isLogo ? true : textResizeProportionallyCheck.checked;
  const aspectRatio = isLogo ? (1 / getLogoAspectRatio()) : (startHeight / startWidth);

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  let newLeft = startLeft;
  let newTop = startTop;
  let newWidth = startWidth;
  let newHeight = startHeight;

  if (action === "br") {
    newWidth = startWidth + dx;
    newHeight = proportional ? startHeight + dx * aspectRatio : startHeight + dy;
  }

  if (action === "bl") {
    newWidth = startWidth - dx;
    newHeight = proportional ? startHeight - dx * aspectRatio : startHeight + dy;
    newLeft = startLeft + dx;
  }

  if (action === "tr") {
    newWidth = startWidth + dx;
    newHeight = proportional ? startHeight + dx * aspectRatio : startHeight - dy;
    newTop = proportional ? startTop - dx * aspectRatio : startTop + dy;
  }

  if (action === "tl") {
    newWidth = startWidth - dx;
    newHeight = proportional ? startHeight - dx * aspectRatio : startHeight - dy;
    newLeft = startLeft + dx;
    newTop = proportional ? startTop + dx * aspectRatio : startTop + dy;
  }

  if (newWidth < 25) newWidth = 25;
  if (newHeight < 20) newHeight = 20;
  if (newWidth > 500) newWidth = 500;
  if (newHeight > 500) newHeight = 500;

  // Keep text box ratio stable while proportional resize is enabled,
  // even after min/max constraints kick in.
  if (!isLogo && proportional) {
    newHeight = newWidth * aspectRatio;

    if (newHeight < 20) {
      newHeight = 20;
    }

    if (newHeight > 500) {
      newHeight = 500;
    }

    if (newWidth < 25) {
      newWidth = 25;
      newHeight = newWidth * aspectRatio;
    }

    if (newWidth > 500) {
      newWidth = 500;
      newHeight = newWidth * aspectRatio;
    }
  }

  layer.style.left = `${newLeft}px`;
  layer.style.top = `${newTop}px`;
  layer.style.transform = "none";

  const sizeTarget = isLogo ? getLogoFrameEl() : layer;
  sizeTarget.style.width = `${newWidth}px`;
  sizeTarget.style.height = `${newHeight}px`;

  if (!isLogo) {
    fitTextFontToLayerBounds();
  }

  isLogo ? updateLogoSizeLabels() : updateTextSizeLabels();
  updateVisibilityByPrintArea(layer);
}

designLayer.addEventListener("click", e => {
  e.stopPropagation();
  activateLogo();
  updateVisibilityByPrintArea(designLayer);
});

textLayer.addEventListener("click", e => {
  e.stopPropagation();
  activateText();
  updateVisibilityByPrintArea(textLayer);
});

document.addEventListener("click", e => {
  if (!designLayer.contains(e.target)) designLayer.classList.remove("active-logo");
  if (!textLayer.contains(e.target)) textLayer.classList.remove("active-text");
});

function resizeLogoBy(amount) {
  const aspectRatio = 1 / getLogoAspectRatio();
  const logoFrame = getLogoFrameEl();
  let newWidth = logoFrame.offsetWidth + amount;
  let newHeight = newWidth * aspectRatio;

  if (newWidth < 25) newWidth = 25;
  if (newHeight < 25) {
    newHeight = 25;
    newWidth = newHeight / aspectRatio;
  }

  logoFrame.style.width = `${newWidth}px`;
  logoFrame.style.height = `${newHeight}px`;

  activateLogo();
  updateLogoSizeLabels();
  updateVisibilityByPrintArea(designLayer);
}

function resizeTextBy(amount) {
  const aspectRatio = Math.max(0.05, textLayer.offsetHeight / Math.max(1, textLayer.offsetWidth));
  let newWidth = textLayer.offsetWidth + amount;
  let newHeight = newWidth * aspectRatio;

  if (newWidth < 40) {
    newWidth = 40;
    newHeight = newWidth * aspectRatio;
  }

  if (newHeight < 24) {
    newHeight = 24;
  }

  textLayer.style.width = `${newWidth}px`;
  textLayer.style.height = `${newHeight}px`;
  fitTextFontToLayerBounds();

  activateText();
  updateTextSizeLabels();
  updateVisibilityByPrintArea(textLayer);
}

document.getElementById("resizeLargeBtn").addEventListener("click", () => {
  if (designLayer.classList.contains("active-logo")) resizeLogoBy(10);
  if (textLayer.classList.contains("active-text")) resizeTextBy(10);
});

document.getElementById("resizeSmallBtn").addEventListener("click", () => {
  if (designLayer.classList.contains("active-logo")) resizeLogoBy(-10);
  if (textLayer.classList.contains("active-text")) resizeTextBy(-10);
});

rotateInput.addEventListener("input", () => {
  state.logoRotation = parseFloat(rotateInput.value) || 0;
  designLayer.style.rotate = `${state.logoRotation}deg`;
  activateLogo();
  updateVisibilityByPrintArea(designLayer);
});

applyImagePropertiesBtn.addEventListener("click", async () => {
  if (!state.uploadedLogo) {
    openScreen("mainEditor");
    return;
  }

  if (removeBackgroundCheck.checked) {
    const logoFrame = getLogoFrameEl();
    const oldLeft = designLayer.style.left;
    const oldTop = designLayer.style.top;
    const oldWidth = logoFrame.style.width;
    const oldHeight = logoFrame.style.height;
    const oldRotate = designLayer.style.rotate;

    const cleanedLogo = await removeImageBackground(state.uploadedLogo, 55);

    state.uploadedLogo = cleanedLogo;
    uploadedLogo.src = cleanedLogo;
    uploadedLogo.style.display = "block";

    designLayer.style.display = "block";
    designLayer.style.left = oldLeft;
    designLayer.style.top = oldTop;
    logoFrame.style.width = oldWidth;
    logoFrame.style.height = oldHeight;
    designLayer.style.rotate = oldRotate;
    designLayer.style.transform = "none";
  }

  openScreen("mainEditor");
  requestAnimationFrame(() => {
    activateLogo();
    updateVisibilityByPrintArea(designLayer);
  });
});

async function removeImageBackground(imageSrc, tolerance = 45) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const bg = getCornerAverageColour(data, canvas.width, canvas.height);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distance = Math.sqrt(
          Math.pow(r - bg.r, 2) +
          Math.pow(g - bg.g, 2) +
          Math.pow(b - bg.b, 2)
        );

        const isNearWhite = r > 235 && g > 235 && b > 235;
        const isNearBlack = r < 25 && g < 25 && b < 25;

        if (distance < tolerance || isNearWhite || isNearBlack) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.src = imageSrc;
  });
}

function getCornerAverageColour(data, width, height) {
  const samples = [
    getPixel(data, 0, 0, width),
    getPixel(data, width - 1, 0, width),
    getPixel(data, 0, height - 1, width),
    getPixel(data, width - 1, height - 1, width)
  ];

  return {
    r: Math.round(samples.reduce((sum, p) => sum + p.r, 0) / samples.length),
    g: Math.round(samples.reduce((sum, p) => sum + p.g, 0) / samples.length),
    b: Math.round(samples.reduce((sum, p) => sum + p.b, 0) / samples.length)
  };
}

function getPixel(data, x, y, width) {
  const index = (y * width + x) * 4;

  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2]
  };
}

document.querySelectorAll("[data-move]").forEach(button => {
  button.addEventListener("click", () => {
    const move = button.dataset.move;
    const step = 10;

    let left = designLayer.offsetLeft;
    let top = designLayer.offsetTop;

    if (move.includes("left")) left -= step;
    if (move.includes("right")) left += step;
    if (move.includes("up")) top -= step;
    if (move.includes("down")) top += step;

    if (move === "center") {
      const logoFrame = getLogoFrameEl();
      left = customArea.offsetWidth / 2 - logoFrame.offsetWidth / 2;
      top = customArea.offsetHeight / 2 - logoFrame.offsetHeight / 2;
    }

    designLayer.style.left = `${left}px`;
    designLayer.style.top = `${top}px`;
    designLayer.style.transform = "none";

    activateLogo();
    updateLogoSizeLabels();
    updateVisibilityByPrintArea(designLayer);
  });
});

document.getElementById("sizeUpBtn").addEventListener("click", () => resizeLogoBy(10));
document.getElementById("sizeDownBtn").addEventListener("click", () => resizeLogoBy(-10));

document.getElementById("applyTextPropertiesBtn").addEventListener("click", () => {
  state.text = textPropertyInput.value.trim() || "TEXT";
  state.textColour = textPropertyColour.value;

  textContent.textContent = state.text;
  textContent.style.color = state.textColour;

  state.textRotation = parseFloat(textRotateInput.value) || 0;
  textLayer.style.rotate = `${state.textRotation}deg`;

  fitTextLayerToContent();
  activateText();
  updateTextSizeLabels();
  updateVisibilityByPrintArea(textLayer);
  openScreen("mainEditor");
});

textPropertyInput.addEventListener("input", () => {
  state.text = textPropertyInput.value;
  textContent.textContent = state.text;
  fitTextLayerToContent();
  updateTextSizeLabels();
  updateVisibilityByPrintArea(textLayer);
});

textPropertyColour.addEventListener("input", () => {
  state.textColour = textPropertyColour.value;
  textContent.style.color = state.textColour;
});

textRotateInput.addEventListener("input", () => {
  state.textRotation = parseFloat(textRotateInput.value) || 0;
  textLayer.style.rotate = `${state.textRotation}deg`;
  updateVisibilityByPrintArea(textLayer);
});

document.getElementById("boldTextBtn").addEventListener("click", () => {
  textContent.style.fontWeight = textContent.style.fontWeight === "800" ? "400" : "800";
});

document.getElementById("italicTextBtn").addEventListener("click", () => {
  textContent.style.fontStyle = textContent.style.fontStyle === "italic" ? "normal" : "italic";
});

const alignLeftBtn = document.getElementById("alignLeftBtn");
if (alignLeftBtn) {
  alignLeftBtn.addEventListener("click", () => {
    setTextAlignment("left");
  });
}

const alignCenterBtn = document.getElementById("alignCenterBtn");
if (alignCenterBtn) {
  alignCenterBtn.addEventListener("click", () => {
    setTextAlignment("center");
  });
}

const alignRightBtn = document.getElementById("alignRightBtn");
if (alignRightBtn) {
  alignRightBtn.addEventListener("click", () => {
    setTextAlignment("right");
  });
}

document.getElementById("outlineRange").addEventListener("input", function () {
  const size = parseInt(this.value) || 0;
  const colour = document.getElementById("outlineColour").value;
  textContent.style.webkitTextStroke = `${size}px ${colour}`;
});

document.getElementById("outlineColour").addEventListener("input", function () {
  const size = parseInt(document.getElementById("outlineRange").value) || 0;
  textContent.style.webkitTextStroke = `${size}px ${this.value}`;
});

document.getElementById("openTextPositionSize").addEventListener("click", () => {
  document.getElementById("textPositionSizePanel").classList.toggle("open");
});

document.getElementById("fontSelectorBtn").addEventListener("click", () => {
  openScreen("fontPage");
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("#fontPage [data-font]");
  if (!button) return;

  const font = getFontByName(button.dataset.font);
  setSelectedFont(font.name);
  textContent.style.fontFamily = font.cssFamily;

  openScreen("textEditorPage");
});

document.querySelectorAll("[data-text-move]").forEach(button => {
  button.addEventListener("click", () => {
    const move = button.dataset.textMove;
    const step = 10;

    let left = textLayer.offsetLeft;
    let top = textLayer.offsetTop;

    if (move.includes("left")) left -= step;
    if (move.includes("right")) left += step;
    if (move.includes("up")) top -= step;
    if (move.includes("down")) top += step;

    if (move === "center") {
      left = customArea.offsetWidth / 2 - textLayer.offsetWidth / 2;
      top = customArea.offsetHeight / 2 - textLayer.offsetHeight / 2;
    }

    textLayer.style.left = `${left}px`;
    textLayer.style.top = `${top}px`;
    textLayer.style.transform = "none";

    activateText();
    updateTextSizeLabels();
    updateVisibilityByPrintArea(textLayer);
  });
});

document.getElementById("textSizeUpBtn").addEventListener("click", () => resizeTextBy(10));
document.getElementById("textSizeDownBtn").addEventListener("click", () => resizeTextBy(-10));

const teInlineTextInput = document.getElementById("teInlineTextInput");
if (teInlineTextInput) {
  teInlineTextInput.addEventListener("input", () => {
    const value = teInlineTextInput.value;
    state.text = value;
    if (customTextInput) {
      customTextInput.value = value;
      if (teCharCount) teCharCount.textContent = value.length;
    }

    if (textLayer.style.display !== "none" && value.trim()) {
      textContent.textContent = value;
      fitTextLayerToContent();
      updateTextSizeLabels();
      updateVisibilityByPrintArea(textLayer);
    }
  });
}

const teInlineColourInput = document.getElementById("teInlineColourInput");
if (teInlineColourInput) {
  teInlineColourInput.addEventListener("input", () => {
    state.textColour = teInlineColourInput.value;
    if (textColourInput) textColourInput.value = state.textColour;
    textContent.style.color = state.textColour;
  });
}

const teInlineResizeProportionallyCheck = document.getElementById("teInlineResizeProportionallyCheck");
if (teInlineResizeProportionallyCheck) {
  teInlineResizeProportionallyCheck.addEventListener("change", () => {
    textResizeProportionallyCheck.checked = teInlineResizeProportionallyCheck.checked;
  });
}

const teInlineRotateInput = document.getElementById("teInlineRotateInput");
if (teInlineRotateInput) {
  teInlineRotateInput.addEventListener("input", () => {
    state.textRotation = parseFloat(teInlineRotateInput.value) || 0;
    textLayer.style.rotate = `${state.textRotation}deg`;
    if (textRotateInput) textRotateInput.value = Math.round(state.textRotation || 0);
    updateVisibilityByPrintArea(textLayer);
  });
}

document.querySelectorAll("[data-inline-text-move]").forEach(button => {
  button.addEventListener("click", () => {
    const move = button.dataset.inlineTextMove;
    const step = 10;

    let left = textLayer.offsetLeft;
    let top = textLayer.offsetTop;

    if (move.includes("left")) left -= step;
    if (move.includes("right")) left += step;
    if (move.includes("up")) top -= step;
    if (move.includes("down")) top += step;

    if (move === "center") {
      left = customArea.offsetWidth / 2 - textLayer.offsetWidth / 2;
      top = customArea.offsetHeight / 2 - textLayer.offsetHeight / 2;
    }

    textLayer.style.left = `${left}px`;
    textLayer.style.top = `${top}px`;
    textLayer.style.transform = "none";
    updateVisibilityByPrintArea(textLayer);
  });
});

const teInlineSizeUpBtn = document.getElementById("teInlineSizeUpBtn");
if (teInlineSizeUpBtn) teInlineSizeUpBtn.addEventListener("click", () => resizeTextBy(10));

const teInlineSizeDownBtn = document.getElementById("teInlineSizeDownBtn");
if (teInlineSizeDownBtn) teInlineSizeDownBtn.addEventListener("click", () => resizeTextBy(-10));

const teInlineBoldBtn = document.getElementById("teInlineBoldBtn");
if (teInlineBoldBtn) {
  teInlineBoldBtn.addEventListener("click", () => {
    textContent.style.fontWeight = textContent.style.fontWeight === "800" ? "400" : "800";
  });
}

const teInlineItalicBtn = document.getElementById("teInlineItalicBtn");
if (teInlineItalicBtn) {
  teInlineItalicBtn.addEventListener("click", () => {
    textContent.style.fontStyle = textContent.style.fontStyle === "italic" ? "normal" : "italic";
  });
}

document.querySelectorAll(".te-inline-align-btn").forEach(button => {
  button.addEventListener("click", () => {
    const align = button.dataset.inlineAlign || "center";
    setTextAlignment(align);
    document.querySelectorAll(".te-inline-align-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.inlineAlign === align);
    });
  });
});

const teInlineOutlineRange = document.getElementById("teInlineOutlineRange");
const teInlineOutlineColour = document.getElementById("teInlineOutlineColour");

if (teInlineOutlineRange && teInlineOutlineColour) {
  const applyInlineStroke = () => {
    const size = parseInt(teInlineOutlineRange.value, 10) || 0;
    const colour = teInlineOutlineColour.value || "#000000";
    textContent.style.webkitTextStroke = `${size}px ${colour}`;
  };

  teInlineOutlineRange.addEventListener("input", applyInlineStroke);
  teInlineOutlineColour.addEventListener("input", applyInlineStroke);
}

document.getElementById("addNameBtn").addEventListener("click", () => {
  const size = document.getElementById("namesSizeSelect").value;
  const qty = parseInt(document.getElementById("namesQtyInput").value) || 1;
  const name = document.getElementById("teamNameInput").value.trim();
  const number = document.getElementById("teamNumberInput").value.trim();

  if (!name && !number) {
    alert("Add a name or number.");
    return;
  }

  state.names.push({ size, qty, name, number });
  renderNames();

  document.getElementById("teamNameInput").value = "";
  document.getElementById("teamNumberInput").value = "";
});

function renderNames() {
  const list = document.getElementById("namesList");
  list.innerHTML = "";

  state.names.forEach(item => {
    const row = document.createElement("div");
    row.className = "names-item";
    row.innerHTML = `
      <div>${item.name || "-"} ${item.number ? "#" + item.number : ""}</div>
      <div>${item.size}</div>
      <div>x${item.qty}</div>
    `;
    list.appendChild(row);
  });
}

document.getElementById("namesNextBtn").addEventListener("click", () => {
  calculatePrice();
  openScreen("mainEditor");
});

document.querySelectorAll(".location-item").forEach(item => {
  item.addEventListener("click", () => {
    state.selectedArea = item.dataset.area;
    applyArea();
    openScreen("mainEditor");
  });
});

document.getElementById("colourShortcut").addEventListener("click", () => openScreen("productPage"));

function copyInlineStyles(source, target, props) {
  if (!source || !target) return;
  props.forEach((prop) => {
    target.style[prop] = source.style[prop] || "";
  });
}

function syncPreviewGarmentClone(poloClone) {
  const origWrap = document.querySelector(".polo-colour-wrap");
  poloClone.classList.remove("is-switching-area");

  if (origWrap) {
    poloClone.style.setProperty("--wrap-width", origWrap.style.getPropertyValue("--wrap-width") || "100%");
    poloClone.style.setProperty("--wrap-mirror", origWrap.style.getPropertyValue("--wrap-mirror") || "1");
  }

  const cloneCL = poloClone.querySelector(".colour-layer");
  if (cloneCL && colourLayer) {
    copyInlineStyles(colourLayer, cloneCL, [
      "backgroundColor",
      "opacity",
      "mixBlendMode",
      "webkitMaskImage",
      "maskImage",
      "webkitMaskSize",
      "maskSize",
      "webkitMaskRepeat",
      "maskRepeat",
      "webkitMaskPosition",
      "maskPosition"
    ]);
    if (!cloneCL.style.backgroundColor) {
      cloneCL.style.backgroundColor = colourLayer.style.backgroundColor || "#ffffff";
    }
    if (!cloneCL.style.maskImage && !cloneCL.style.webkitMaskImage && productShape) {
      const maskSrc = productShape.currentSrc || productShape.src || "";
      if (maskSrc) {
        cloneCL.style.webkitMaskImage = `url("${maskSrc}")`;
        cloneCL.style.maskImage = `url("${maskSrc}")`;
        cloneCL.style.webkitMaskSize = "contain";
        cloneCL.style.maskSize = "contain";
        cloneCL.style.webkitMaskRepeat = "no-repeat";
        cloneCL.style.maskRepeat = "no-repeat";
        cloneCL.style.webkitMaskPosition = "center center";
        cloneCL.style.maskPosition = "center center";
      }
    }
    cloneCL.style.opacity = "1";
  }

  const clonedProductImage = poloClone.querySelector(".product-image");
  if (clonedProductImage && productShape) {
    clonedProductImage.src = productShape.currentSrc || productShape.src;
    clonedProductImage.style.opacity = "1";
  }

  const customAreaInClone = poloClone.querySelector(".custom-area");
  if (customAreaInClone) {
    const textLayerClone = customAreaInClone.querySelector(".text-layer");
    if (textLayerClone) textLayerClone.remove();

    customAreaInClone.querySelectorAll(
      ".logo-toolbar, .logo-size-label, .text-size-label, button, .resize-dot, .rotate-handle, .text-dot-br, .text-rotate-handle"
    ).forEach((el) => el.remove());

    const designLayerClone = customAreaInClone.querySelector(".design-layer");
    if (designLayerClone) {
      designLayerClone.classList.remove("active-logo");
      if (designLayer) {
        copyInlineStyles(designLayer, designLayerClone, [
          "display",
          "left",
          "top",
          "width",
          "height",
          "rotate",
          "transform"
        ]);
      }

      const clonedLogo = designLayerClone.querySelector("img");
      if (clonedLogo && uploadedLogo) {
        clonedLogo.src = uploadedLogo.currentSrc || uploadedLogo.src;
        if (!clonedLogo.src) designLayerClone.remove();
      }
    }
  }

  poloClone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
}

document.getElementById("previewBtn").addEventListener("click", () => {
  const origPreview = document.getElementById("productPreview");
  const slot = document.getElementById("previewPoloSlot");
  if (!origPreview || !slot) return;

  const origWrap = origPreview.querySelector(".polo-colour-wrap");
  if (!origWrap) return;
  // Capture the exact rendered pixel size of the garment in the tool so the
  // cloned preview keeps the identical internal coordinate system (logo px
  // positions match 1:1). The whole scene is then uniformly scaled to fit.
  const wrapRect = origWrap.getBoundingClientRect();

  const poloClone = origWrap.cloneNode(true);
  if (!poloClone) return;

  syncPreviewGarmentClone(poloClone);
  poloClone.style.width = `${Math.round(wrapRect.width)}px`;
  poloClone.style.height = `${Math.round(wrapRect.height)}px`;
  poloClone.style.maxWidth = "none";
  poloClone.style.margin = "0";

  const scene = document.createElement("div");
  scene.className = origPreview.className;
  scene.style.transition = "none";
  scene.style.transformOrigin = "center center";
  scene.style.display = "flex";
  scene.style.justifyContent = "center";
  scene.style.alignItems = "center";
  scene.appendChild(poloClone);

  slot.innerHTML = "";
  slot.appendChild(scene);

  document.getElementById("previewModal").classList.add("open");

  requestAnimationFrame(() => {
    const slotW = slot.clientWidth || wrapRect.width;
    const slotH = slot.clientHeight || wrapRect.height;
    const scale = Math.min(1, slotW / wrapRect.width, slotH / wrapRect.height);
    scene.style.transform = scale < 1 ? `scale(${scale})` : "none";
  });
});

document.getElementById("previewCloseBtn").addEventListener("click", () => {
  document.getElementById("previewModal").classList.remove("open");
});

document.getElementById("previewModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
});
document.getElementById("basketBtn").addEventListener("click", () => {
  window.location.href = "../basket.html";
});

document.getElementById("priceBtn").addEventListener("click", () => {
  calculatePrice();
  alert(`Estimated total: £${toDisplayAmount(state.price).toFixed(2)} (${vatSuffixLabel()})`);
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  alert("Download proof function can be added with html2canvas.");
});

document.getElementById("shareBtn").addEventListener("click", () => {
  alert("Share function can be added later.");
});

const buyBtn = document.getElementById("buyBtn");
if (buyBtn) {
  buyBtn.addEventListener("click", () => {
    collectSizes();

    if (state.totalQty < 1) {
      return;
    }

    calculatePrice();
    const basket = readQuoteBasket();
    basket.push(buildBasketItemFromState());
    writeQuoteBasket(basket);
    updateBasketUIFromStorage();
    window.location.href = "../basket.html";
  });
}

function setupToolHeaderSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchIcon = document.querySelector(".tool-header-logo-row .search-icon-expand");

  if (!searchInput) return;

  const runSearch = () => {
    const query = searchInput.value.trim();
    const baseUrl = "../shop.html";
    const target = query ? `${baseUrl}?q=${encodeURIComponent(query)}` : baseUrl;
    window.location.href = target;
  };

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  });

  if (searchIcon) {
    searchIcon.addEventListener("click", runSearch);
  }
}

function inferInitialProductType() {
  const params = new URLSearchParams(window.location.search);
  const explicitProduct = String(params.get("product") || "").trim().toLowerCase();
  if (["polo", "tshirt", "hoodie", "beanie", "cap"].includes(explicitProduct)) {
    return explicitProduct;
  }

  const code = String(params.get("code") || "").trim().toLowerCase();

  let matchedName = "";
  try {
    const basket = JSON.parse(localStorage.getItem("quoteBasket") || "[]");
    if (Array.isArray(basket) && code) {
      const byCode = basket.find((item) => {
        const itemCode = String(item?.productCode || item?.code || "").trim().toLowerCase();
        return itemCode === code;
      });
      matchedName = String(byCode?.productName || byCode?.name || "").toLowerCase();
    }
  } catch (error) {
    matchedName = "";
  }

  if (/t\s*-?shirt|tee/.test(matchedName)) return "tshirt";
  if (/hoodie|sweatshirt/.test(matchedName)) return "hoodie";
  if (/beanie/.test(matchedName)) return "beanie";
  if (/cap/.test(matchedName)) return "cap";
  if (/polo/.test(matchedName)) return "polo";

  // Fallback heuristic for common T-shirt codes used in this project.
  if (/^gd0*2$/.test(code) || /^gd0*3$/.test(code) || /^gd0*4$/.test(code) || /^gd0*5$/.test(code) || /^8700/.test(code) || /^ts/.test(code)) {
    return "tshirt";
  }

  return "";
}

// Keep the bottom-sheet product select in sync with the product page select
const mainProductSelect = document.getElementById("mainProductSelect");
if (mainProductSelect) {
  mainProductSelect.addEventListener("change", () => {
    productSelect.value = mainProductSelect.value;
    productSelect.dispatchEvent(new Event("change"));
  });
}

const inferredProduct = inferInitialProductType();
if (inferredProduct) {
  if (productSelect) productSelect.value = inferredProduct;
  if (mainProductSelect) mainProductSelect.value = inferredProduct;
  productSelect.dispatchEvent(new Event("change"));
}

startCustomizerLoadingProgress();
setCustomizerLoadingStatus("Loading colours and mockups...");

applySelectedProductContext();

setupVatToggle();
setupCustomizerBreadcrumb();
renderColours();
const initialAreaPromise = applyArea();
calculatePrice();
updateBasketUIFromStorage();
setupToolHeaderSearch();
updateConfirmButtonState();
maybeHandleBasketLogoChoice();
const hydratePromise = withTimeout(hydrateSelectedProductFromApi(), 3000);

Promise.allSettled([initialAreaPromise, hydratePromise])
  .then(() => withTimeout(preloadCurrentColourSet(), 800))
  .finally(() => finishCustomizerLoading());

/* =====================================================
   REDESIGNED MAIN EDITOR — new interactions
   ===================================================== */

// Mini colour row (4 swatches + plus)
function renderMiniColours() {
  updateAvailableColoursLabel();
  const row = document.getElementById("miniColourRow");
  const dropdown = document.getElementById("colourDropdown");
  if (!row) return;
  row.innerHTML = "";
  if (dropdown) dropdown.innerHTML = "";

  function selectColour(name, hex) {
    applySelectedProductColour(name, hex);
  }

  // All colours visible in the row (2 rows with wrap)
  colours.forEach(([name, hex]) => {
    const btn = document.createElement("button");
    btn.className = "mini-swatch" + (name === state.colourName ? " selected" : "");
    applySwatchAppearance(btn, name, hex);
    btn.title = name;
    btn.addEventListener("click", () => selectColour(name, hex));
    row.appendChild(btn);
  });

  // "+" toggle button
  const plus = document.createElement("button");
  plus.className = "mini-swatch-plus";
  plus.textContent = "+";
  plus.title = "More colours";
  plus.addEventListener("click", (e) => {
    e.stopPropagation();
    if (dropdown) dropdown.classList.toggle("open");
  });
  row.appendChild(plus);

  // All colours in the dropdown
  if (dropdown) {
    colours.forEach(([name, hex]) => {
      const btn = document.createElement("button");
      btn.className = "mini-swatch" + (name === state.colourName ? " selected" : "");
      applySwatchAppearance(btn, name, hex);
      btn.title = name;
      btn.addEventListener("click", () => selectColour(name, hex));
      dropdown.appendChild(btn);
    });
  }
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("colourDropdown");
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove("open");
  }
});

renderMiniColours();

// View tabs (Front / Back / Left / Right)
const viewNameLabel = document.getElementById("viewNameLabel");

document.querySelectorAll(".view-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".view-tab").forEach(b => b.classList.remove("active-view"));
    btn.classList.add("active-view");
    state.selectedArea = btn.dataset.area;
    if (viewNameLabel) viewNameLabel.textContent = btn.dataset.area.toUpperCase();
    applyArea();
  });
});

function syncProductSpecificTabs() {
  configureViewTabsForProduct();

  const leftSleeveTab = document.querySelector('.view-tab[data-area="left-sleeve"]');
  if (leftSleeveTab) {
    leftSleeveTab.classList.toggle("active-view", state.selectedArea === "left-sleeve");
  }
}

syncProductSpecificTabs();

const frontMiniThumb = document.getElementById("frontMiniThumb");
if (frontMiniThumb) {
  frontMiniThumb.addEventListener("click", () => {
    const frontBtn = document.querySelector('.view-tab[data-area="front"]');
    if (frontBtn) frontBtn.click();
  });
}

// QTY +/- buttons
const qtyDisplay = document.getElementById("qtyDisplay");

document.getElementById("qtyMinusBtn").addEventListener("click", () => {
  const v = Math.max(1, (parseInt(mainQtyInput.value) || 1) - 1);
  mainQtyInput.value = v;
  if (qtyDisplay) qtyDisplay.textContent = v;
  mainQtyInput.dispatchEvent(new Event("input"));
});

document.getElementById("qtyPlusBtn").addEventListener("click", () => {
  const v = (parseInt(mainQtyInput.value) || 1) + 1;
  mainQtyInput.value = v;
  if (qtyDisplay) qtyDisplay.textContent = v;
  mainQtyInput.dispatchEvent(new Event("input"));
});

// Keep qty display in sync when collectSizes() updates mainQtyInput
mainQtyInput.addEventListener("input", () => {
  if (qtyDisplay) qtyDisplay.textContent = mainQtyInput.value;
});

// Zoom buttons
let currentZoom = 1;
const ZOOM_STEP = 0.15;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const productPreviewEl = document.getElementById("productPreview");

function applyZoom() {
  productPreviewEl.style.transform = `scale(${currentZoom})`;
}

document.getElementById("zoomInBtn").addEventListener("click", () => {
  currentZoom = Math.min(ZOOM_MAX, +(currentZoom + ZOOM_STEP).toFixed(2));
  applyZoom();
});

document.getElementById("zoomOutBtn").addEventListener("click", () => {
  currentZoom = Math.max(ZOOM_MIN, +(currentZoom - ZOOM_STEP).toFixed(2));
  applyZoom();
});

document.getElementById("resetViewBtn").addEventListener("click", () => {
  currentZoom = 1;
  applyZoom();
});

function resetLayerRotationToStraight(layerType) {
  if (layerType === "logo") {
    state.logoRotation = 0;
    designLayer.style.rotate = "0deg";
    if (rotateInput) rotateInput.value = 0;
    updateVisibilityByPrintArea(designLayer);
    return true;
  }

  if (layerType === "text") {
    state.textRotation = 0;
    textLayer.style.rotate = "0deg";
    if (textRotateInput) textRotateInput.value = 0;
    const teInlineRotateInput = document.getElementById("teInlineRotateInput");
    if (teInlineRotateInput) teInlineRotateInput.value = 0;
    updateVisibilityByPrintArea(textLayer);
    return true;
  }

  return false;
}

document.getElementById("straightenBtn").addEventListener("click", () => {
  const textIsActive = textLayer.classList.contains("active-text");
  const logoIsActive = designLayer.classList.contains("active-logo");

  if (textIsActive) {
    resetLayerRotationToStraight("text");
    return;
  }

  if (logoIsActive) {
    resetLayerRotationToStraight("logo");
    return;
  }

  // Fallback: if nothing is selected, straighten any visible rotated layer.
  let changed = false;
  if (Math.abs(state.textRotation || 0) > 0.01 && textLayer.style.display !== "none") {
    changed = resetLayerRotationToStraight("text") || changed;
  }
  if (Math.abs(state.logoRotation || 0) > 0.01 && designLayer.style.display !== "none") {
    changed = resetLayerRotationToStraight("logo") || changed;
  }

  if (!changed) {
    resetLayerRotationToStraight("text");
  }
});

