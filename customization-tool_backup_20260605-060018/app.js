const state = {
  product: "polo",
  productName: "Polo",
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

function sanitizeToolUrlQuery() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const code = params.get("code") || "";
    const product = params.get("product") || "";

    const clean = new URLSearchParams();
    if (code) clean.set("code", code);
    if (product) clean.set("product", product);

    const next = clean.toString();
    const current = params.toString();
    if (next !== current) {
      const cleanUrl = window.location.pathname + (next ? ("?" + next) : "") + (window.location.hash || "");
      window.history.replaceState({}, "", cleanUrl);
    }
  } catch (e) {
    // Ignore invalid URL state.
  }
}

sanitizeToolUrlQuery();

// Calibration: print area width = 30cm. Computed dynamically from actual rendered customArea.
const PRINT_AREA_WIDTH_CM = 30;
function getPxPerCm() {
  const w = customArea ? customArea.clientWidth : 180;
  return (w > 10 ? w : 180) / PRINT_AREA_WIDTH_CM;
}

const screens = document.querySelectorAll(".screen");
const productPreview = document.getElementById("productPreview");
const customArea = document.getElementById("customArea");
const productShape = document.getElementById("productShape");
const colourGrid = document.getElementById("colourGrid");
const selectedColourName = document.getElementById("selectedColourName");
const productSelect = document.getElementById("productSelect");
const productPageTitle = document.getElementById("productPageTitle");
const sizesContainer = document.getElementById("sizesContainer");
const mainQtyInput = document.getElementById("mainQtyInput");
const mainPrice = document.getElementById("mainPrice");

const colourLayer = document.getElementById("colourLayer");
const designLayer = document.getElementById("designLayer");
const uploadedLogo = document.getElementById("uploadedLogo");
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

function enforceDeleteButtonStyle() {
  [deleteLogoBtn, deleteTextBtn].forEach(btn => {
    if (!btn) return;
    btn.textContent = "×";
    btn.style.setProperty("background", "transparent", "important");
    btn.style.setProperty("color", "#dc2626", "important");
    btn.style.setProperty("border", "1.5px dashed #dc2626", "important");
    btn.style.setProperty("box-shadow", "none", "important");
    btn.style.setProperty("border-radius", "50%", "important");
    btn.style.setProperty("width", "16px", "important");
    btn.style.setProperty("height", "16px", "important");
    btn.style.setProperty("right", "-14px", "important");
    btn.style.setProperty("top", "-14px", "important");
    btn.style.setProperty("align-items", "center", "important");
    btn.style.setProperty("justify-content", "center", "important");
    btn.style.setProperty("font-weight", "700", "important");
    btn.style.setProperty("font-size", "11px", "important");
    btn.style.setProperty("line-height", "1", "important");
    btn.style.setProperty("z-index", "220", "important");
  });
}

enforceDeleteButtonStyle();

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

const colours = [
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
  screens.forEach(screen => screen.classList.remove("active-screen"));
  document.getElementById(screenId).classList.add("active-screen");
  if (screenId === "textEditorPage") {
    syncTextEditorFieldsFromState();
  }
  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => openScreen(button.dataset.open));
});

function updateVisibilityByPrintArea(layer) {
  const layerRect = layer.getBoundingClientRect();
  const areaRect = customArea.getBoundingClientRect();
  const contentEl = layer === textLayer ? textContent : uploadedLogo;
  const contentRect = contentEl ? contentEl.getBoundingClientRect() : layerRect;

  const isFullyInside =
    layerRect.left >= areaRect.left &&
    layerRect.right <= areaRect.right &&
    layerRect.top >= areaRect.top &&
    layerRect.bottom <= areaRect.bottom;

  const isCompletelyOutside =
    layerRect.right < areaRect.left ||
    layerRect.left > areaRect.right ||
    layerRect.bottom < areaRect.top ||
    layerRect.top > areaRect.bottom;

  if (contentEl) {
    if (contentRect.width <= 0 || contentRect.height <= 0) {
      contentEl.style.clipPath = "none";
      contentEl.style.webkitClipPath = "none";
    } else if (isCompletelyOutside) {
      const hiddenClip = "inset(100% 100% 100% 100%)";
      contentEl.style.clipPath = hiddenClip;
      contentEl.style.webkitClipPath = hiddenClip;
    } else {
      const clipTop = Math.max(0, areaRect.top - contentRect.top);
      const clipRight = Math.max(0, contentRect.right - areaRect.right);
      const clipBottom = Math.max(0, contentRect.bottom - areaRect.bottom);
      const clipLeft = Math.max(0, areaRect.left - contentRect.left);

      const clippedTop = Math.min(contentRect.height, clipTop);
      const clippedRight = Math.min(contentRect.width, clipRight);
      const clippedBottom = Math.min(contentRect.height, clipBottom);
      const clippedLeft = Math.min(contentRect.width, clipLeft);

      const clipRule = `inset(${clippedTop}px ${clippedRight}px ${clippedBottom}px ${clippedLeft}px)`;
      contentEl.style.clipPath = clipRule;
      contentEl.style.webkitClipPath = clipRule;
    }
  }

  layer.classList.remove("inside-print-area", "outside-print-area", "fully-outside-print-area");

  if (isFullyInside) {
    layer.classList.add("inside-print-area");
    return;
  }

  if (isCompletelyOutside) {
    layer.classList.add("fully-outside-print-area");
    return;
  }

  layer.classList.add("outside-print-area");
}

function renderColours() {
  colourGrid.innerHTML = "";

  colours.forEach(([name, hex]) => {
    const swatch = document.createElement("button");
    swatch.className = "colour-swatch";
    swatch.style.background = hex;
    swatch.title = name;

    if (name === state.colourName) swatch.classList.add("selected");

    swatch.addEventListener("click", () => {
      state.colourName = name;
      state.colourHex = hex;
      selectedColourName.textContent = name;
      colourLayer.style.backgroundColor = hex;

      document.querySelectorAll(".colour-swatch").forEach(item => item.classList.remove("selected"));
      swatch.classList.add("selected");
    });

    colourGrid.appendChild(swatch);
  });
}

const tshirtImages = {
  front: "https://i.postimg.cc/J4H7k7N0/vecteezy-white-polo-mockup-47872842.png",
  back:  "https://i.postimg.cc/J4H7k7N0/vecteezy-white-polo-mockup-47872842.png",
  right: "https://i.postimg.cc/J4H7k7N0/vecteezy-white-polo-mockup-47872842.png",
  left:  "https://i.postimg.cc/J4H7k7N0/vecteezy-white-polo-mockup-47872842.png"
};

function applyBootstrapContext() {
  try {
    const raw = sessionStorage.getItem("customizationToolBootstrap");
    if (!raw) return;
    const ctx = JSON.parse(raw);
    if (!ctx || typeof ctx !== "object") return;

    const image = (ctx.image || "").trim();
    if (image) {
      tshirtImages.front = image;
      tshirtImages.back = image;
      tshirtImages.left = image;
      tshirtImages.right = image;
    }

    const codeEl = document.getElementById("cibCode");
    if (codeEl && ctx.code) codeEl.textContent = String(ctx.code);

    if (ctx.productName) {
      state.productName = String(ctx.productName);
      if (productPageTitle) productPageTitle.textContent = `Custom ${state.productName}`;
      const cibModel = document.getElementById("cibModelName");
      if (cibModel) cibModel.textContent = state.productName;
    }
  } catch (e) {
    // Ignore malformed bootstrap payloads.
  }
}

function applyArea() {
  productPreview.className = "product-preview";
  productPreview.classList.add(`area-${state.selectedArea}`);

  const imgSrc = tshirtImages[state.selectedArea] || tshirtImages.front;
  const productShapeEl = document.getElementById("productShape");
  const colourLayerEl  = document.getElementById("colourLayer");
  const wrapEl         = document.querySelector(".polo-colour-wrap");

  productShapeEl.src = imgSrc;

  // Mirror the wrap for left sleeve
  wrapEl.style.transform = (state.selectedArea === "left") ? "scaleX(-1)" : "";

  setTimeout(() => {
    if (state.uploadedLogo) centerLogo();
    if (state.text) centerText();
  }, 0);
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
  mainPrice.textContent = `£${state.price.toFixed(2)}`;
}

document.getElementById("changeProductBtn").addEventListener("click", () => {
  const changer = document.getElementById("productChanger");
  changer.style.display = changer.style.display === "none" ? "block" : "none";
});

productSelect.addEventListener("change", () => {
  state.product = productSelect.value;
  state.productName = productSelect.options[productSelect.selectedIndex].text;
  productPageTitle.textContent = `Custom ${state.productName}`;
  const cibModel = document.getElementById("cibModelName");
  if (cibModel) cibModel.textContent = state.productName;
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
  const pxPerCm = getPxPerCm();
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
    state.decorationType = card.dataset.designType;
    document.getElementById("logoFileInput").click();
  });
});

document.getElementById("logoFileInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    state.uploadedLogo = e.target.result;
    state.originalUploadedLogo = e.target.result;
    document.getElementById("copyrightImagePreview").src = state.uploadedLogo;
    openScreen("copyrightPage");
  };

  reader.readAsDataURL(file);
});

document.getElementById("continueLogoBtn").addEventListener("click", () => {
  if (!state.uploadedLogo) {
    alert("Please upload a design first.");
    return;
  }

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

  if (!checkbox.checked) {
    alert("Please confirm you own the rights to print this image.");
    return;
  }

  state.copyrightConfirmed = true;
  openScreen("mainEditor");
  showLogoOnCanvas(state.uploadedLogo);
  calculatePrice();
});

function showLogoOnCanvas(imageSrc) {
  state.uploadedLogo = imageSrc;

  uploadedLogo.src = imageSrc;
  uploadedLogo.style.display = "block";

  designLayer.style.display = "flex";
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

  // Fill almost all printable area while preserving aspect ratio.
  const maxWidth = Math.max(30, customArea.clientWidth * 0.96);
  const maxHeight = Math.max(30, customArea.clientHeight * 0.96);

  let width = maxWidth;
  let height = width / imageRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * imageRatio;
  }

  designLayer.style.width = `${Math.round(width)}px`;
  designLayer.style.height = `${Math.round(height)}px`;
}

function getLogoAspectRatio() {
  const naturalWidth = uploadedLogo.naturalWidth || 0;
  const naturalHeight = uploadedLogo.naturalHeight || 0;

  if (naturalWidth > 0 && naturalHeight > 0) {
    return naturalWidth / naturalHeight;
  }

  const fallbackHeight = Math.max(1, designLayer.offsetHeight || 1);
  const fallbackWidth = Math.max(1, designLayer.offsetWidth || 1);
  return fallbackWidth / fallbackHeight;
}

function getRenderedLogoSizePx() {
  const containerWidth = Math.max(1, designLayer.offsetWidth);
  const containerHeight = Math.max(1, designLayer.offsetHeight);
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
  designLayer.style.left = `${customArea.offsetWidth / 2 - designLayer.offsetWidth / 2}px`;
  designLayer.style.top = `${customArea.offsetHeight / 2 - designLayer.offsetHeight / 2}px`;
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
  const pxPerCm = getPxPerCm();
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
    e.target.classList.contains("resize-dot") ||
    e.target.id === "rotateHandle" ||
    e.target.tagName === "BUTTON"
  ) return;

  e.preventDefault();

  logoAction = "move";

  const rect = designLayer.getBoundingClientRect();
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
    logoStartWidth = designLayer.offsetWidth;
    logoStartHeight = designLayer.offsetHeight;

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
  layer.style.width = `${newWidth}px`;
  layer.style.height = `${newHeight}px`;
  layer.style.transform = "none";

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
  let newWidth = designLayer.offsetWidth + amount;
  let newHeight = newWidth * aspectRatio;

  if (newWidth < 25) newWidth = 25;
  if (newHeight < 25) {
    newHeight = 25;
    newWidth = newHeight / aspectRatio;
  }

  designLayer.style.width = `${newWidth}px`;
  designLayer.style.height = `${newHeight}px`;

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
    const oldLeft = designLayer.style.left;
    const oldTop = designLayer.style.top;
    const oldWidth = designLayer.style.width;
    const oldHeight = designLayer.style.height;
    const oldRotate = designLayer.style.rotate;

    const cleanedLogo = await removeImageBackground(state.uploadedLogo, 55);

    state.uploadedLogo = cleanedLogo;
    uploadedLogo.src = cleanedLogo;
    uploadedLogo.style.display = "block";

    designLayer.style.display = "flex";
    designLayer.style.left = oldLeft;
    designLayer.style.top = oldTop;
    designLayer.style.width = oldWidth;
    designLayer.style.height = oldHeight;
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
      left = customArea.offsetWidth / 2 - designLayer.offsetWidth / 2;
      top = customArea.offsetHeight / 2 - designLayer.offsetHeight / 2;
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
document.getElementById("closeCustomiserBtn").addEventListener("click", () => alert("Customiser closed."));
document.getElementById("previewBtn").addEventListener("click", () => {
  const origPreview = document.getElementById("productPreview");
  const slot = document.getElementById("previewPoloSlot");
  if (!origPreview || !slot) return;

  const poloClone = origPreview.querySelector(".polo-colour-wrap")?.cloneNode(true);
  const customAreaClone = origPreview.querySelector(".custom-area")?.cloneNode(true);
  if (!poloClone || !customAreaClone) return;

  // Build a clean preview scene: polo + print area with logo only
  const scene = document.createElement("div");
  scene.className = "product-preview " + origPreview.className.replace("product-preview", "").trim();
  scene.style.transform = "none";

  const textLayerClone = customAreaClone.querySelector(".text-layer");
  if (textLayerClone) textLayerClone.remove();

  customAreaClone.querySelectorAll(
    "button, .resize-dot, .rotate-handle, .text-dot-br, .text-rotate-handle, .logo-size-label, .text-size-label"
  ).forEach((el) => el.remove());

  const cloneCL = poloClone.querySelector(".colour-layer");
  if (cloneCL && colourLayer) {
    cloneCL.style.backgroundColor = colourLayer.style.backgroundColor || "#ffffff";
  }

  const clonedProductImage = poloClone.querySelector(".product-image");
  if (clonedProductImage && productShape) {
    clonedProductImage.src = productShape.currentSrc || productShape.src;
  }

  const clonedLogo = customAreaClone.querySelector("#uploadedLogo");
  if (clonedLogo && uploadedLogo) {
    clonedLogo.src = uploadedLogo.currentSrc || uploadedLogo.src;
    if (!clonedLogo.src) clonedLogo.remove();
  }

  scene.appendChild(poloClone);
  scene.appendChild(customAreaClone);

  // Avoid duplicate IDs in modal clone
  scene.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));

  const origW = origPreview.offsetWidth || 270;
  const origH = Math.max(origPreview.offsetHeight || 320, origW);
  const maxW = Math.min(window.innerWidth * 0.9, 470);
  const maxH = window.innerHeight * 0.68;
  const fitScale = Math.min(maxW / origW, maxH / origH);
  const scale = Math.max(fitScale, 1);
  const previewOffsetX = Math.round(origW * 0.045);

  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    width:${origW * scale}px;
    height:${origH * scale}px;
    position:relative;
    overflow:hidden;
    border-radius:12px;
  `;

  scene.style.cssText = `
    position:absolute;
    top:0; left:-${previewOffsetX}px;
    width:${origW}px;
    height:${origH}px;
    transform:scale(${scale});
    transform-origin:top left;
  `;

  wrapper.appendChild(scene);
  slot.innerHTML = "";
  slot.appendChild(wrapper);

  document.getElementById("previewModal").classList.add("open");
});

document.getElementById("previewCloseBtn").addEventListener("click", () => {
  document.getElementById("previewModal").classList.remove("open");
});

document.getElementById("previewModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
});
document.getElementById("basketBtn").addEventListener("click", () => document.getElementById("buyBtn").click());

document.getElementById("priceBtn").addEventListener("click", () => {
  calculatePrice();
  alert(`Estimated total: £${state.price.toFixed(2)}`);
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  alert("Download proof function can be added with html2canvas.");
});

document.getElementById("shareBtn").addEventListener("click", () => {
  alert("Share function can be added later.");
});

document.getElementById("buyBtn").addEventListener("click", () => {
  collectSizes();

  const sizeBreakdown = state.sizes.map(item => `${item.size} x ${item.qty}`).join(", ");

  const namesBreakdown = state.names.length
    ? state.names.map(item => `${item.size} x${item.qty} - ${item.name || ""} ${item.number || ""}`).join("\n")
    : "No names / numbers";

  const body = `
Custom Product Request

Product: ${state.productName}
Colour: ${state.colourName}
Sizes: ${sizeBreakdown}
Total Quantity: ${state.totalQty}
Decoration Type: ${state.decorationType || "Not selected"}
Area: ${state.selectedArea}
Text Type: ${state.textType || "Not selected"}
Text: ${state.text || "No text"}
Names / Numbers:
${namesBreakdown}

Copyright Confirmed: ${state.copyrightConfirmed ? "Yes" : "No"}
Estimated Total: £${state.price.toFixed(2)}
  `.trim();

  const subject = encodeURIComponent("Custom Product Quote Request");
  const mailBody = encodeURIComponent(body);

  window.location.href = `mailto:quotes@brandeduk.com?subject=${subject}&body=${mailBody}`;
});

// Keep the bottom-sheet product select in sync with the product page select
const mainProductSelect = document.getElementById("mainProductSelect");
if (mainProductSelect) {
  mainProductSelect.addEventListener("change", () => {
    productSelect.value = mainProductSelect.value;
    productSelect.dispatchEvent(new Event("change"));
  });
}

applyBootstrapContext();

function applyProductFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const raw = (params.get("product") || "").toLowerCase().trim();
    if (!raw) return;

    const normalized = raw.replace(/[^a-z]/g, "");
    const aliasToValue = {
      tshirt: "tshirt",
      tee: "tshirt",
      teeshirt: "tshirt",
      polo: "polo",
      hoodie: "hoodie",
      sweatshirt: "hoodie",
      cap: "cap",
      beanie: "beanie"
    };

    const targetValue = aliasToValue[normalized];
    if (!targetValue) return;

    if (!productSelect || !productSelect.querySelector(`option[value="${targetValue}"]`)) return;
    productSelect.value = targetValue;

    if (mainProductSelect && mainProductSelect.querySelector(`option[value="${targetValue}"]`)) {
      mainProductSelect.value = targetValue;
    }

    productSelect.dispatchEvent(new Event("change"));
  } catch (e) {
    // Ignore malformed URL/query values.
  }
}

applyProductFromQuery();

renderColours();
applyArea();
calculatePrice();

/* =====================================================
   REDESIGNED MAIN EDITOR — new interactions
   ===================================================== */

// Mini colour row (4 swatches + plus)
function renderMiniColours() {
  const row = document.getElementById("miniColourRow");
  const dropdown = document.getElementById("colourDropdown");
  if (!row) return;
  row.innerHTML = "";
  if (dropdown) dropdown.innerHTML = "";

  // Helper: select a colour and update all state/UI
  function selectColour(name, hex) {
    state.colourName = name;
    state.colourHex = hex;
    colourLayer.style.backgroundColor = hex;
    if (typeof selectedColourName !== "undefined") selectedColourName.textContent = name;
    document.querySelectorAll(".mini-swatch").forEach(s => s.classList.remove("selected"));
    document.querySelectorAll(".mini-swatch").forEach(s => {
      if (s.title === name) s.classList.add("selected");
    });
    document.querySelectorAll(".colour-swatch").forEach(s => {
      s.classList.toggle("selected", s.title === name);
    });
  }

  // All colours visible in the row (2 rows with wrap)
  colours.forEach(([name, hex]) => {
    const btn = document.createElement("button");
    btn.className = "mini-swatch" + (name === state.colourName ? " selected" : "");
    btn.style.background = hex;
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
      btn.style.background = hex;
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

// Tool buttons — Select / Pan
(function () {
  const selectBtn = document.getElementById("selectToolBtn");
  const panBtn    = document.getElementById("panToolBtn");
  if (!selectBtn || !panBtn) return;

  function activateTool(activeBtn, inactiveBtn) {
    activeBtn.classList.add("active-tool");
    inactiveBtn.classList.remove("active-tool");
    state.activeTool = activeBtn.id === "selectToolBtn" ? "select" : "pan";
  }

  selectBtn.addEventListener("click", () => activateTool(selectBtn, panBtn));
  panBtn.addEventListener("click",    () => activateTool(panBtn, selectBtn));
})();

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

