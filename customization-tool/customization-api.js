(function initializeCustomizationApi(global) {
  "use strict";

  const API_BASE_URL = "https://api.brandeduk.com/api";
  const REQUEST_TIMEOUT_MS = 3000;
  const FEATURE_FLAG_KEY = "brandeduk-customization-api";
  const capabilityCache = new Map();
  const priceCache = new Map();
  const inflightRequests = new Map();

  const VERIFIED_SKU_PRODUCT_TYPES = Object.freeze({
    BC045: "beanie"
  });

  const POSITION_MAP = Object.freeze({
    "left-chest": "left_chest",
    "right-chest": "right_chest",
    "centre-chest": "centre_chest",
    "center-chest": "centre_chest",
    "small-centre-front": "centre_chest",
    "small-center-front": "centre_chest",
    "large-centre-front": "large_front",
    "large-center-front": "large_front",
    "large-front": "large_front",
    "upper-back": "upper_back",
    "large-back": "large_back",
    "back-large": "large_back",
    "left-sleeve": "left_sleeve",
    "right-sleeve": "right_sleeve",
    "back-neck": "back_neck",
    "lower-front": "lower_front",
    "lower-back": "lower_back",
    "trouser-thigh": "trouser_thigh",
    "trouser-leg": "trouser_leg",
    "cap-front": "cap_front",
    "front-centre": "cap_front",
    "front-center": "cap_front",
    "front-left": "cap_side",
    "front-right": "cap_side",
    "cap-side": "cap_side",
    "cap-back": "cap_back",
    "bag-front": "bag_front",
    "apron-front": "apron_front"
  });

  function isEnabled() {
    const params = new URLSearchParams(global.location.search);
    if (params.get("customizationApi") === "1") return true;
    if (params.get("customizationApi") === "0") return false;
    try {
      return global.localStorage.getItem(FEATURE_FLAG_KEY) === "on";
    } catch (error) {
      return false;
    }
  }

  function normalizeMethod(method) {
    const value = String(method || "").trim().toLowerCase();
    return value === "print" ? "dtf" : value;
  }

  function normalizePosition(position) {
    const value = String(position || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return POSITION_MAP[value] || value.replace(/-/g, "_");
  }

  function resolveProductType(product, sku) {
    const explicit = String(
      product?.customizationProductType
      || product?.customization_product_type
      || product?.customizationType
      || ""
    ).trim().toLowerCase();
    if (explicit) return explicit.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return VERIFIED_SKU_PRODUCT_TYPES[String(sku || product?.sku || product?.code || "").trim().toUpperCase()] || "";
  }

  function recordUnmappedSku(sku) {
    const code = String(sku || "").trim().toUpperCase();
    if (!code) return;
    try {
      const parsed = JSON.parse(global.sessionStorage.getItem("unmappedCustomizationSkus") || "[]");
      const codes = new Set(Array.isArray(parsed) ? parsed : []);
      codes.add(code);
      global.sessionStorage.setItem("unmappedCustomizationSkus", JSON.stringify([...codes].sort()));
    } catch (error) {
      // Diagnostics must never block the customizer.
    }
  }

  async function requestJson(url, cacheKey) {
    if (inflightRequests.has(cacheKey)) return inflightRequests.get(cacheKey);
    const request = (async () => {
      const controller = new AbortController();
      const timeout = global.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success || !payload?.data) {
          throw new Error(payload?.message || `Request failed (${response.status})`);
        }
        return payload.data;
      } finally {
        global.clearTimeout(timeout);
        inflightRequests.delete(cacheKey);
      }
    })();
    inflightRequests.set(cacheKey, request);
    return request;
  }

  async function getCustomizationCapabilities({ productType, position, sku, method } = {}) {
    const canonicalType = String(productType || "").trim().toLowerCase();
    const canonicalPosition = normalizePosition(position);
    const canonicalMethod = normalizeMethod(method);
    if (!canonicalType || !canonicalPosition) {
      return {
        rulesetVersion: "",
        productType: canonicalType,
        position: canonicalPosition,
        sku: String(sku || ""),
        unmapped: !canonicalType,
        methods: {
          dtf: { method: "dtf", status: "POA", visible: true, buttonEnabled: true, allowAddToBasket: false, requiresApproval: true },
          embroidery: { method: "embroidery", status: "POA", visible: true, buttonEnabled: true, allowAddToBasket: false, requiresApproval: true }
        }
      };
    }

    const cacheKey = [canonicalType, canonicalPosition, String(sku || "").toUpperCase(), canonicalMethod].join("|");
    if (capabilityCache.has(cacheKey)) return capabilityCache.get(cacheKey);
    const params = new URLSearchParams({ productType: canonicalType, position: canonicalPosition });
    if (sku) params.set("sku", sku);
    if (canonicalMethod) params.set("method", canonicalMethod);
    const data = await requestJson(`${API_BASE_URL}/customization-capabilities?${params}`, `cap:${cacheKey}`);
    capabilityCache.set(cacheKey, data);
    return data;
  }

  async function getCustomizationPrice({ method, quantity, priceClass = "standard" } = {}) {
    const canonicalMethod = normalizeMethod(method);
    const numericQuantity = Number(quantity);
    if (!["dtf", "embroidery"].includes(canonicalMethod)) throw new Error("Unsupported customization method");
    if (!Number.isInteger(numericQuantity) || numericQuantity < 1) throw new Error("Quantity must be a positive whole number");

    const exactKey = [canonicalMethod, priceClass, numericQuantity].join("|");
    for (const entry of priceCache.values()) {
      if (
        entry.method === canonicalMethod
        && entry.priceClass === priceClass
        && numericQuantity >= Number(entry.tier?.minQuantity || 1)
        && numericQuantity <= Number(entry.tier?.maxQuantity || Number.MAX_SAFE_INTEGER)
      ) {
        return { ...entry, quantity: numericQuantity, applicationTotal: entry.unitPrice * numericQuantity };
      }
    }
    if (priceCache.has(exactKey)) return priceCache.get(exactKey);
    const params = new URLSearchParams({ method: canonicalMethod, quantity: String(numericQuantity), priceClass });
    const data = await requestJson(`${API_BASE_URL}/customization-pricing?${params}`, `price:${exactKey}`);
    priceCache.set(exactKey, data);
    return data;
  }

  global.BrandedCustomizationApi = Object.freeze({
    FEATURE_FLAG_KEY,
    getCustomizationCapabilities,
    getCustomizationPrice,
    isEnabled,
    normalizeMethod,
    normalizePosition,
    recordUnmappedSku,
    resolveProductType
  });
})(window);
