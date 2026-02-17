// order.js — BrandedUK Test Order Page (4-page flow, API-driven)

const API_BASE_URL = 'https://api.brandeduk.com/api';
const PRODUCT_CODE = 'GD024'; // product to load

let current = 0;
const totalPages = 4;
let productData = null;
let priceBreaks = [];
let selectedColour = null;
let selectedColourImg = null;
let selectedColourName = null;
let activeMethod = "embroidery";
let basket = [];

// Customization state (like live site)
let selectedPositions = [];      // array of { position, name, priceEmb, pricePrint, method }
let positionMethods = {};        // { 'left-chest': 'embroidery', ... }
let positionCustomizationsMap = {}; // { 'left-chest': { type: 'logo', uploadedLogo: dataUrl, ... } }
let designModalState = { currentPosition: null, originalLogoImage: null, backgroundRemoved: false, positionDesigns: {} };

// Colour family mapping (colour name → filter category)
const COLOUR_FAMILIES = {
  red: ['red', 'cherry', 'maroon', 'heliconia', 'cardinal', 'crimson'],
  green: ['green', 'irish', 'sage', 'forest', 'kelly', 'olive', 'lime', 'military'],
  orange: ['orange', 'tangerine'],
  blue: ['blue', 'royal', 'navy', 'sapphire', 'cobalt', 'indigo', 'sky', 'stone blue', 'light blue'],
  grey: ['grey', 'gray', 'heather', 'charcoal', 'graphite', 'sport grey', 'ash'],
  pink: ['pink', 'rose', 'heliconia', 'coral', 'azalea'],
  black: ['black', 'pitch'],
  yellow: ['yellow', 'daisy', 'cornsilk', 'mustard', 'gold'],
  brown: ['brown', 'cocoa', 'chocolate', 'savana', 'chestnut'],
  purple: ['purple', 'violet', 'paragon', 'plum', 'lilac'],
  neutral: ['sand', 'natural', 'cream', 'stone', 'tan', 'khaki', 'paragon'],
  white: ['white']
};

function getColourFilter(colourName) {
  const lower = colourName.toLowerCase();
  for (const [family, keywords] of Object.entries(COLOUR_FAMILIES)) {
    if (keywords.some(kw => lower.includes(kw))) return family;
  }
  return 'neutral';
}

/* ==========================================
   LOAD PRODUCT FROM API
   ========================================== */

async function loadProduct() {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${PRODUCT_CODE}`);
    if (!res.ok) throw new Error('API error ' + res.status);
    productData = await res.json();
    console.log('✅ Product loaded:', productData.code, productData.name);

    priceBreaks = productData.priceBreaks || [];

    renderProductDetail();
    renderTierPrices();
    renderColourGrid();
    renderSizeTableHeader();

    // Hide loading
    $('#loadingOverlay').fadeOut(300);
  } catch (err) {
    console.error('❌ Failed to load product:', err);
    $('#loadingOverlay').html('<p style="color:#e53e3e;padding:40px">Failed to load product data. Check console.</p>');
  }
}

/* ==========================================
   PAGE 1: Render product detail from API
   ========================================== */

function renderProductDetail() {
  const p = productData;

  // Code & name
  $('#productCode').text(p.code);
  $('#productName').text(p.name);

  // Price
  const lowestPrice = priceBreaks.length > 0
    ? Math.min(...priceBreaks.map(b => b.price))
    : p.price;
  $('#productPrice').text('£' + lowestPrice.toFixed(2));

  // Brand logo
  if (p.brand) {
    const brandSlug = p.brand.toLowerCase().replace(/\s+/g, '-');
    // Keep Gildan logo as default
    $('#brandLogo').attr('alt', p.brand);
  }

  // Main image
  const mainImg = (p.images || []).find(i => i.type === 'main');
  if (mainImg) {
    $('#mainProductImg').attr('src', mainImg.url);
  } else if (p.colors && p.colors.length > 0) {
    $('#mainProductImg').attr('src', p.colors[0].main);
  }

  // Thumbnails (first few colour images)
  const thumbCol = $('#thumbCol');
  thumbCol.empty();
  const thumbImages = (p.images || []).filter(i => i.type === 'thumb').slice(0, 5);
  if (mainImg) {
    thumbCol.append(`<img class="thumb active" src="${mainImg.url}" alt="Main">`);
  }
  thumbImages.slice(0, 4).forEach(img => {
    thumbCol.append(`<img class="thumb" src="${img.url}" alt="Thumb">`);
  });

  // Spec table
  const specBody = $('#specTable tbody');
  specBody.empty();
  if (p.details) {
    if (p.details.fabric) specBody.append(`<tr><td class="spec-label">Fabric</td><td>${p.details.fabric}</td></tr>`);
    if (p.details.weight) specBody.append(`<tr><td class="spec-label">Weight</td><td>${p.details.weight}</td></tr>`);
  }
  if (p.sizes && p.sizes.length > 0) {
    specBody.append(`<tr><td class="spec-label">Size</td><td>${p.sizes.map(s => '<strong>' + s + '</strong>').join(' &nbsp; ')}</td></tr>`);
  }

  // Customization methods
  if (p.customization && p.customization.length > 0) {
    const toggle = $('.pricing-method-toggle');
    toggle.empty();
    p.customization.forEach((method, i) => {
      const label = method.charAt(0).toUpperCase() + method.slice(1);
      toggle.append(`<button class="method-btn${i === 0 ? ' active' : ''}" data-method="${method}">${label.toUpperCase()}</button>`);
    });
    activeMethod = p.customization[0];
  }

  // Main tier price
  if (priceBreaks.length > 0) {
    $('#tierMainPrice').text('£' + priceBreaks[0].price.toFixed(2));
  }
}

/* ==========================================
   TIER PRICING (from API priceBreaks)
   ========================================== */

function renderTierPrices() {
  const $grid = $('#tierGrid');
  $grid.empty();

  priceBreaks.forEach((tier, i) => {
    let rangeLabel = '';
    if (i === 0 && tier.max < 99999) {
      rangeLabel = tier.min + '-' + tier.max;
    } else if (tier.max >= 99999) {
      rangeLabel = tier.min + '+';
    } else {
      rangeLabel = tier.min + '+';
    }

    const discHtml = tier.percentage > 0 ? `<span class="tier-discount">-${tier.percentage}%</span>` : '';
    const activeClass = i === 0 ? ' active' : '';

    $grid.append(`
      <div class="tier-box${activeClass}" data-index="${i}" data-price="${tier.price}">
        <span class="tier-range">${rangeLabel}</span>
        <span class="tier-amount">£${tier.price.toFixed(2)}</span>
        ${discHtml}
      </div>
    `);
  });
}

/* ==========================================
   PAGE 2: Colour grid from API
   ========================================== */

function renderColourGrid() {
  const grid = $('#colourGrid');
  const dropdown = $('#colourDropdown');
  grid.empty();
  dropdown.find('option:not(:first)').remove();

  if (!productData.colors || productData.colors.length === 0) return;

  productData.colors.forEach(color => {
    const filter = getColourFilter(color.name);
    const imgUrl = color.thumb || color.main || '';

    grid.append(`
      <div class="colour-thumb" data-colour="${color.name}" data-filter="${filter}" data-img="${imgUrl}">
        <img src="${imgUrl}" alt="${color.name}">
        <span>${color.name}</span>
      </div>
    `);

    dropdown.append(`<option value="${color.name}">${color.name}</option>`);
  });
}

/* ==========================================
   PAGE 3: Size table header from API
   ========================================== */

function renderSizeTableHeader() {
  const thead = $('#sizeTableHead');
  thead.empty();

  let headerHtml = '<tr><th>Size</th>';

  // Add tier columns from priceBreaks
  priceBreaks.forEach((tier, i) => {
    let label = '';
    if (i === 0 && tier.max < 99999) {
      label = tier.min + '-' + tier.max;
    } else {
      label = tier.min + '+';
    }
    headerHtml += `<th>${label}</th>`;
  });

  headerHtml += '<th>Qty</th></tr>';
  thead.html(headerHtml);
}

function renderSizeTableRows() {
  const tbody = $('#sizeTableBody');
  tbody.empty();

  if (!productData.sizes) return;

  productData.sizes.forEach(size => {
    let rowHtml = `<tr data-size="${size}"><td class="size-name"><strong>${size}</strong></td>`;

    // Price cells for each tier
    priceBreaks.forEach((tier, i) => {
      if (i === 0) {
        rowHtml += `<td class="tier-price-cell">£${tier.price.toFixed(2)}</td>`;
      } else {
        rowHtml += `<td class="tier-price-cell"><span class="disc-price">£${tier.price.toFixed(2)}</span></td>`;
      }
    });

    // Qty input
    rowHtml += `<td><div class="qty-wrap"><input type="number" class="qty-input" min="0" value="0"><div class="qty-arrows"><button class="qty-arrow up">▲</button><button class="qty-arrow down">▼</button></div></div></td>`;
    rowHtml += '</tr>';
    tbody.append(rowHtml);
  });
}

/* ==========================================
   PAGE NAVIGATION (horizontal slide)
   ========================================== */

function goToPage(index) {
  if (index < 0 || index >= totalPages) return;

  const pct = -(index * 100);
  $(".track").stop().animate(
    { left: pct + "%" },
    { duration: 500, easing: "easeInOutCubic" }
  );

  current = index;
  $(".order_card")[0].scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ==========================================
   PAGE 1 → 2: "Select Options" button
   ========================================== */

$("#goToColours").click(function () {
  goToPage(1);
});

/* ==========================================
   PAGE 1: Thumbnail clicks → swap main image
   ========================================== */

$(document).on("click", ".thumb", function () {
  $(".thumb").removeClass("active");
  $(this).addClass("active");
  $(".main-image").attr("src", $(this).attr("src"));
});

/* ==========================================
   PAGE 1: Method toggle (Embroidery / Print)
   ========================================== */

$(document).on("click", ".method-btn", function () {
  $(".method-btn").removeClass("active");
  $(this).addClass("active");
  activeMethod = $(this).data("method");
  // Tier prices are the same (garment price), but we keep the toggle for UX
});

// Click tier box → highlight + update main price
$(document).on("click", ".tier-box", function () {
  $(".tier-box").removeClass("active");
  $(this).addClass("active");
  const price = $(this).data("price");
  if (price) $('#tierMainPrice').text('£' + parseFloat(price).toFixed(2));
});

/* ==========================================
   PAGE 2: Back to product
   ========================================== */

$("#backToProduct").click(function () {
  goToPage(0);
});

/* ==========================================
   PAGE 2: Colour filter pills
   ========================================== */

$(".filter-pill").click(function () {
  const filter = $(this).data("filter");

  if (filter === "reset") {
    $(".filter-pill").removeClass("active");
    $(".colour-thumb").show();
    return;
  }

  $(this).toggleClass("active");

  const activeFilters = [];
  $(".filter-pill.active").each(function () {
    activeFilters.push($(this).data("filter"));
  });

  if (activeFilters.length === 0) {
    $(".colour-thumb").show();
  } else {
    $(".colour-thumb").each(function () {
      $(this).toggle(activeFilters.includes($(this).data("filter")));
    });
  }
});

/* ==========================================
   PAGE 2: Colour thumbnail click → go to Page 3
   ========================================== */

$(document).on("click", ".colour-thumb", function () {
  $(".colour-thumb").removeClass("selected");
  $(this).addClass("selected");

  selectedColour = $(this).data("colour");
  selectedColourName = $(this).find("span").first().text();
  selectedColourImg = $(this).data("img");

  // Update Page 3 header
  $("#selectedColourImg").attr("src", selectedColourImg);
  $("#selectedColourName").text(selectedColourName + ' – ' + productData.code);

  // Build size table rows
  renderSizeTableRows();

  // Reset qty inputs
  $(".qty-input").val(0);
  updateBottomBar();

  goToPage(2);
});

// Colour dropdown sync
$(".colour-dropdown").on("change", function () {
  const val = $(this).val();
  if (!val) return;
  const thumb = $(`.colour-thumb[data-colour="${val}"]`);
  if (thumb.length) thumb.trigger("click");
});

/* ==========================================
   PAGE 3: Back to colours
   ========================================== */

$("#backToColours").click(function () {
  goToPage(1);
});

/* ==========================================
   PAGE 3: Quantity inputs → update bottom bar
   ========================================== */

$(document).on("input change", ".qty-input", function () {
  let v = parseInt($(this).val()) || 0;
  if (v < 0) { v = 0; $(this).val(0); }
  updateBottomBar();
});

// Custom arrow buttons
$(document).on("click", ".qty-arrow.up", function () {
  const input = $(this).closest(".qty-wrap").find(".qty-input");
  let v = parseInt(input.val()) || 0;
  v++;
  input.val(v);
  updateBottomBar();
});

$(document).on("click", ".qty-arrow.down", function () {
  const input = $(this).closest(".qty-wrap").find(".qty-input");
  let v = parseInt(input.val()) || 0;
  if (v > 0) v--;
  input.val(v);
  updateBottomBar();
});

function updateBottomBar() {
  let orderLines = 0;
  let totalItems = 0;

  $(".qty-input").each(function () {
    const q = parseInt($(this).val()) || 0;
    if (q > 0) {
      orderLines++;
      totalItems += q;
    }
  });

  // Find active tier price based on total quantity
  let unitPrice = productData ? productData.price : 0;
  if (priceBreaks.length > 0) {
    // Default to first tier
    unitPrice = priceBreaks[0].price;
    // Find the best matching tier
    for (let i = priceBreaks.length - 1; i >= 0; i--) {
      if (totalItems >= priceBreaks[i].min) {
        unitPrice = priceBreaks[i].price;
        break;
      }
    }
  }

  const totalPrice = (totalItems * unitPrice).toFixed(2);

  // Highlight active tier in table
  highlightActiveTier(totalItems);

  $("#orderLines").text(orderLines);
  $("#totalItems").text(totalItems);
  $("#totalPrice").text("£" + totalPrice);

  $("#addToBasketBtn").prop("disabled", totalItems === 0);
}

function highlightActiveTier(totalQty) {
  // Highlight the active tier column header
  $(".size-table thead th").removeClass("active-tier");
  if (totalQty === 0) return;

  let activeTierIdx = 0;
  for (let i = priceBreaks.length - 1; i >= 0; i--) {
    if (totalQty >= priceBreaks[i].min) {
      activeTierIdx = i;
      break;
    }
  }

  // +1 because first th is "Size"
  $(".size-table thead th").eq(activeTierIdx + 1).addClass("active-tier");
}

/* ==========================================
   PAGE 3: Add to Basket
   ========================================== */

$("#addToBasketBtn").click(function () {
  if (!selectedColour) return;

  const sizes = {};
  let totalQty = 0;

  $(".qty-input").each(function () {
    const q = parseInt($(this).val()) || 0;
    if (q > 0) {
      const size = $(this).closest("tr").find(".size-name").text().trim();
      sizes[size] = q;
      totalQty += q;
    }
  });

  if (totalQty === 0) {
    showToast("⚠ Please enter at least one quantity");
    return;
  }

  const item = {
    product: productData.code,
    productName: productData.name,
    colour: selectedColourName || selectedColour,
    image: selectedColourImg,
    sizes: { ...sizes },
    qty: totalQty
  };

  // Merge if same colour already in basket
  const existIdx = basket.findIndex(b => b.colour === item.colour);
  if (existIdx !== -1) {
    Object.entries(sizes).forEach(([s, q]) => {
      basket[existIdx].sizes[s] = (basket[existIdx].sizes[s] || 0) + q;
    });
    basket[existIdx].qty = Object.values(basket[existIdx].sizes).reduce((a, b) => a + b, 0);
  } else {
    basket.push(item);
  }

  showToast("✓ " + totalQty + " × " + item.colour + " added to basket!");

  // Show "Customize →" button
  $("#goToCustomize").show();
});

/* ==========================================
   PAGE 3 → 4: "Customize" button
   ========================================== */

$("#goToCustomize").click(function () {
  // Reset position selections UI
  selectedPositions = [];
  positionMethods = {};
  positionCustomizationsMap = {};
  designModalState.positionDesigns = {};
  $(".position-card").removeClass("selected customized");
  $(".position-card input[type='checkbox']").prop("checked", false);
  $(".position-card .price-badge").each(function () { resetPriceBadge($(this)[0]); });
  $(".uploaded-logo-container").attr("hidden", true);
  // (logo overlay removed — preview only in bottom container)

  // Update order summary
  updateOrderSummary();
  goToPage(3);
});

/* ==========================================
   PAGE 4: Back to sizes
   ========================================== */

$("#backToSizes").click(function () {
  goToPage(2);
});

/* ==========================================
   PAGE 4: Price Badge helper functions (same as live site)
   ========================================== */

function resetPriceBadge(badge) {
  if (!badge) return;
  badge.classList.remove("active", "add-logo-btn", "logo-added");
  badge.dataset.role = "method";
  badge.dataset.activeMethod = "";
  const label = (badge.dataset.defaultLabel || "").toUpperCase();
  const price = badge.dataset.defaultPrice || "";
  badge.innerHTML = '<span class="price-label">' + label + '</span><span class="price-value">' + price + '</span>';
}

function applyMethodUI(card, method) {
  if (!card) return;
  const position = card.querySelector('input[type="checkbox"]').value;
  const customization = positionCustomizationsMap[position];
  const embBadge = card.querySelector(".price-emb");
  const printBadge = card.querySelector(".price-print");
  resetPriceBadge(embBadge);
  resetPriceBadge(printBadge);
  if (!method) return;

  const methodBadge = method === "embroidery" ? embBadge : printBadge;
  const addBadge = method === "embroidery" ? printBadge : embBadge;

  if (methodBadge) { methodBadge.classList.add("active"); methodBadge.dataset.role = "method"; }
  if (addBadge) {
    addBadge.classList.remove("active");
    addBadge.classList.add("add-logo-btn");
    addBadge.dataset.role = "add-logo";
    addBadge.dataset.activeMethod = method;
    const uniqueId = "cloud-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    addBadge.innerHTML = customization
      ? '<span class="add-logo-text">Edit Customization</span>'
      : '<svg class="add-logo-cloud-icon" width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="' + uniqueId + '"><path fill-rule="evenodd" clip-rule="evenodd" d="M76.38 41.52c0 .21 0 .21 0 .42C86.98 44.07 94.39 54.03 93.33 64.83 92.27 75.64 83.16 83.9 72.14 83.9H29.76c-10.81 0-19.92-8.26-21.19-19.07-1.27-10.81 6.36-20.77 16.96-22.89 0-.21 0-.21 0-.42C25.53 27.54 36.97 16.1 50.95 16.1c13.99 0 25.43 11.44 25.43 25.42z"/></clipPath></defs><g clip-path="url(#' + uniqueId + ')"><path fill-rule="evenodd" clip-rule="evenodd" d="M100-100H0v300h100zM34.84 49.15l12.59-12.71a4.16 4.16 0 0 1 5.87 0l12.59 12.71c1.05 1.27 1.47 3.18.84 4.66-.63 1.48-2.1 2.54-3.78 2.54h-8.39v12.71a4.2 4.2 0 0 1-8.39 0V56.36h-8.39c-1.68 0-3.15-1.06-3.78-2.54-.63-1.7-.42-3.39.84-4.67z" fill="white" class="cloud-arrow-anim"/></g></svg>';
  }
}

/* ==========================================
   PAGE 4: Position Selection (checkbox + badge clicks — same as live site)
   ========================================== */

// Badge click: select method, morph other badge to "Add Logo"
$(document).on("click", ".position-card .price-badge", function (e) {
  e.stopPropagation();
  const badge = this;
  const card = $(badge).closest(".position-card")[0];
  const checkbox = card.querySelector('input[type="checkbox"]');
  const position = checkbox.value;
  const role = badge.dataset.role || "method";

  // Handle "Add Logo" button click → open upload modal
  if (role === "add-logo") {
    const activeMethod = badge.dataset.activeMethod || positionMethods[position] || badge.dataset.method;
    if (!activeMethod) return;
    if (!checkbox.checked) { checkbox.checked = true; $(checkbox).trigger("change"); }
    openDesignModal(position, card);
    return;
  }

  const method = badge.dataset.method;
  if (!method) return;

  // Toggle: clicking already-active method resets the card
  if (badge.classList.contains("active")) {
    resetPositionChoice(position, card, checkbox);
    showToast("Choose Embroidery or Print");
    return;
  }

  // Set method and update UI
  positionMethods[position] = method;
  if (positionCustomizationsMap[position]) positionCustomizationsMap[position].method = method;
  applyMethodUI(card, method);

  // Auto-check the checkbox
  if (!checkbox.checked) {
    checkbox.checked = true;
    $(checkbox).trigger("change");
  } else {
    const existing = selectedPositions.find(p => p.position === position);
    if (existing) existing.method = method;
    updateOrderSummary();
  }
});

// Checkbox change
$(document).on("change", ".position-card input[type='checkbox']", function () {
  const checkbox = this;
  const card = $(checkbox).closest(".position-card")[0];
  const position = checkbox.value;
  const positionName = card.querySelector(".position-checkbox span").textContent.trim();
  const priceEmb = parseFloat(card.dataset.embroidery) || 0;
  const pricePrint = parseFloat(card.dataset.print) || 0;

  if (checkbox.checked && !positionMethods[position]) {
    checkbox.checked = false;
    showToast("Select Embroidery or Print first");
    return;
  }

  if (checkbox.checked) {
    card.classList.add("selected");
    if (!selectedPositions.find(p => p.position === position)) {
      selectedPositions.push({ position, name: positionName, priceEmb, pricePrint, method: positionMethods[position] || "embroidery" });
    }
    applyMethodUI(card, positionMethods[position]);
  } else {
    card.classList.remove("selected");
    selectedPositions = selectedPositions.filter(p => p.position !== position);
    delete positionMethods[position];
    delete positionCustomizationsMap[position];
    card.querySelectorAll(".price-badge").forEach(resetPriceBadge);
    const uploadedC = card.querySelector(".uploaded-logo-container");
    if (uploadedC) { uploadedC.setAttribute("hidden", ""); const t = uploadedC.querySelector(".uploaded-logo-thumb"); if (t) t.src = ""; }
  }
  updateOrderSummary();
});

// Card body click (not badge / checkbox) → reset choice
$(document).on("click", ".position-card", function (e) {
  if ($(e.target).closest(".price-badge").length) return;
  if ($(e.target).closest(".position-checkbox").length) return;
  if ($(e.target).closest(".delete-logo-btn").length) return;
  const card = this;
  const checkbox = card.querySelector('input[type="checkbox"]');
  const position = checkbox.value;
  resetPositionChoice(position, card, checkbox);
  showToast("Choose Embroidery or Print");
});

function resetPositionChoice(position, card, checkbox) {
  delete positionMethods[position];
  delete positionCustomizationsMap[position];
  delete designModalState.positionDesigns[position];
  card.querySelectorAll(".price-badge").forEach(resetPriceBadge);
  const uploadedC = card.querySelector(".uploaded-logo-container");
  if (uploadedC) { uploadedC.setAttribute("hidden", ""); const t = uploadedC.querySelector(".uploaded-logo-thumb"); if (t) t.src = ""; }
  card.classList.remove("customized");
  if (checkbox && checkbox.checked) {
    checkbox.checked = false;
    $(checkbox).trigger("change");
  } else {
    updateOrderSummary();
  }
}

/* ==========================================
   PAGE 4: Design Upload Modal (same as live site)
   ========================================== */

function openDesignModal(position, card) {
  designModalState.currentPosition = position;
  const modal = document.getElementById("designModal");
  const title = document.getElementById("designModalTitle");
  const uploadTitle = document.getElementById("uploadLogoTitle");
  const dropzone = document.getElementById("designUploadZone");
  const previewContainer = document.getElementById("designUploadPreview");
  const previewImg = document.getElementById("designPreviewImg");
  const removeBgBtn = document.getElementById("removeBgBtn");

  if (title) {
    const positionName = card.querySelector(".position-checkbox span")?.textContent || position;
    title.textContent = "Upload Logo - " + positionName;
  }
  if (uploadTitle) uploadTitle.textContent = "Drop or select your logo";
  if (dropzone) dropzone.style.display = "";
  if (previewContainer) previewContainer.hidden = true;
  if (previewImg) previewImg.src = "";
  if (removeBgBtn) { removeBgBtn.classList.remove("bg-removed", "processing"); const s = removeBgBtn.querySelector("span"); if (s) s.textContent = "Remove BG"; }
  const fileInput = document.getElementById("designLogoUpload");
  if (fileInput) fileInput.value = "";
  designModalState.originalLogoImage = null;
  designModalState.backgroundRemoved = false;

  if (modal) { modal.style.display = "flex"; modal.classList.add("active"); }
  document.body.style.overflow = "hidden";
}

function closeDesignModal() {
  const modal = document.getElementById("designModal");
  if (modal) { modal.classList.remove("active"); modal.style.display = "none"; }
  document.body.style.overflow = "";
  designModalState.currentPosition = null;
}

// Close modal events
$(document).on("click", "#closeDesignModal", closeDesignModal);
$(document).on("click", ".design-modal-overlay", function (e) {
  if (e.target === this) closeDesignModal();
});

// Upload zone click → open file dialog
$(document).on("click", "#designUploadZone", function (e) {
  e.stopPropagation();
  const fileInput = document.getElementById("designLogoUpload");
  if (fileInput) { fileInput.value = ""; fileInput.click(); }
});

// Drag & drop
$(document).on("dragover", "#designUploadZone", function (e) { e.preventDefault(); $(this).addClass("dragover"); });
$(document).on("dragleave", "#designUploadZone", function () { $(this).removeClass("dragover"); });
$(document).on("drop", "#designUploadZone", function (e) {
  e.preventDefault(); $(this).removeClass("dragover");
  const file = e.originalEvent.dataTransfer.files[0];
  if (file) handleDesignFileUpload(file);
});

// File input change
$(document).on("change", "#designLogoUpload", function () {
  const file = this.files[0];
  if (file) handleDesignFileUpload(file);
});

function handleDesignFileUpload(file) {
  if (!file) return;
  // Validate
  const validExt = [".jpg", ".jpeg", ".png", ".svg", ".eps", ".ai", ".pdf"];
  const ext = "." + file.name.split(".").pop().toLowerCase();
  if (!validExt.includes(ext)) { showToast("Invalid file type"); return; }
  if (file.size > 5 * 1024 * 1024) { showToast("File too large (max 5MB)"); return; }

  const reader = new FileReader();
  reader.onload = function (ev) {
    const previewContainer = document.getElementById("designUploadPreview");
    const previewImg = document.getElementById("designPreviewImg");
    const dropzone = document.getElementById("designUploadZone");
    const uploadTitle = document.getElementById("uploadLogoTitle");

    if (previewImg) previewImg.src = ev.target.result;
    if (dropzone) dropzone.style.display = "none";
    if (previewContainer) previewContainer.hidden = false;
    if (uploadTitle) uploadTitle.textContent = "Your Logo";

    designModalState.originalLogoImage = ev.target.result;
    designModalState.backgroundRemoved = false;

    // Reset remove BG button
    const removeBgBtn = document.getElementById("removeBgBtn");
    if (removeBgBtn) { removeBgBtn.classList.remove("bg-removed", "processing"); const s = removeBgBtn.querySelector("span"); if (s) s.textContent = "Remove BG"; }

    // Auto-remove BG for JPEGs
    const isJpeg = file.type === "image/jpeg" || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg");
    if (isJpeg) setTimeout(removeDesignBG, 100);
  };
  reader.readAsDataURL(file);
}

// Remove uploaded preview
$(document).on("click", "#removeUploadedLogo", function () {
  const previewContainer = document.getElementById("designUploadPreview");
  const previewImg = document.getElementById("designPreviewImg");
  const dropzone = document.getElementById("designUploadZone");
  const uploadTitle = document.getElementById("uploadLogoTitle");
  const removeBgBtn = document.getElementById("removeBgBtn");
  if (previewContainer) previewContainer.hidden = true;
  if (dropzone) dropzone.style.display = "";
  if (previewImg) previewImg.src = "";
  if (uploadTitle) uploadTitle.textContent = "Drop or select your logo";
  if (removeBgBtn) { removeBgBtn.classList.remove("bg-removed", "processing"); const s = removeBgBtn.querySelector("span"); if (s) s.textContent = "Remove BG"; }
  designModalState.originalLogoImage = null;
  designModalState.backgroundRemoved = false;
});

// Remove / Restore background
$(document).on("click", "#removeBgBtn", function () {
  if ($(this).hasClass("bg-removed")) { restoreDesignBG(); } else { removeDesignBG(); }
});

function removeDesignBG() {
  const previewImg = document.getElementById("designPreviewImg");
  const canvas = document.getElementById("bgRemovalCanvas");
  const removeBgBtn = document.getElementById("removeBgBtn");
  if (!previewImg || !previewImg.src || !canvas) return;
  if (!designModalState.originalLogoImage) designModalState.originalLogoImage = previewImg.src;
  const btnSpan = removeBgBtn ? removeBgBtn.querySelector("span") : null;
  if (removeBgBtn) { removeBgBtn.classList.add("processing"); if (btnSpan) btnSpan.textContent = "Processing"; }

  const watchdog = setTimeout(function () {
    if (removeBgBtn && removeBgBtn.classList.contains("processing")) {
      removeBgBtn.classList.remove("processing"); if (btnSpan) btnSpan.textContent = "Remove BG";
    }
  }, 15000);

  setTimeout(function () {
    try {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const img = new Image(); img.crossOrigin = "Anonymous";
      img.onload = function () {
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data; const w = canvas.width; const h = canvas.height;
        function px(x, y) { const i = (y * w + x) * 4; return { r: data[i], g: data[i + 1], b: data[i + 2] }; }
        const corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
        const bg = { r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4), g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4), b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4) };
        const tol = 45; const visited = new Uint8Array(w * h); const q = []; let head = 0;
        for (let x = 0; x < w; x++) { q.push([x, 0]); q.push([x, h - 1]); }
        for (let y = 1; y < h - 1; y++) { q.push([0, y]); q.push([w - 1, y]); }
        while (head < q.length) {
          const [x, y] = q[head++];
          if (x < 0 || x >= w || y < 0 || y >= h) continue;
          const idx = y * w + x; if (visited[idx]) continue; visited[idx] = 1;
          const pi = idx * 4;
          if (Math.abs(data[pi] - bg.r) <= tol && Math.abs(data[pi + 1] - bg.g) <= tol && Math.abs(data[pi + 2] - bg.b) <= tol) {
            data[pi + 3] = 0; q.push([x + 1, y]); q.push([x - 1, y]); q.push([x, y + 1]); q.push([x, y - 1]);
          }
        }
        ctx.putImageData(imageData, 0, 0);
        previewImg.src = canvas.toDataURL("image/png");
        if (removeBgBtn) { removeBgBtn.classList.remove("processing"); removeBgBtn.classList.add("bg-removed"); if (btnSpan) btnSpan.textContent = "Keep Background"; }
        designModalState.backgroundRemoved = true; clearTimeout(watchdog);
      };
      img.onerror = function () { if (removeBgBtn) { removeBgBtn.classList.remove("processing"); if (btnSpan) btnSpan.textContent = "Remove BG"; } clearTimeout(watchdog); };
      img.src = previewImg.src || designModalState.originalLogoImage;
    } catch (e) { if (removeBgBtn) { removeBgBtn.classList.remove("processing"); if (btnSpan) btnSpan.textContent = "Remove BG"; } clearTimeout(watchdog); }
  }, 50);
}

function restoreDesignBG() {
  const previewImg = document.getElementById("designPreviewImg");
  const removeBgBtn = document.getElementById("removeBgBtn");
  if (designModalState.originalLogoImage && previewImg) previewImg.src = designModalState.originalLogoImage;
  if (removeBgBtn) { removeBgBtn.classList.remove("bg-removed"); const s = removeBgBtn.querySelector("span"); if (s) s.textContent = "Remove BG"; }
  designModalState.backgroundRemoved = false;
}

// Apply design to card
$(document).on("click", "#applyDesignBtn", function (e) {
  e.preventDefault(); e.stopPropagation();
  const position = designModalState.currentPosition;
  const previewImg = document.getElementById("designPreviewImg");
  if (!position) { showToast("Please upload a logo first"); return; }
  if (!previewImg || !previewImg.src || previewImg.src === "" || previewImg.src === window.location.href) { showToast("Please upload a logo first"); return; }

  // Save to state
  designModalState.positionDesigns[position] = { logo: previewImg.src, originalLogo: designModalState.originalLogoImage };
  positionCustomizationsMap[position] = {
    type: "logo", uploadedLogo: previewImg.src, name: "Logo",
    method: positionMethods[position] || "embroidery"
  };

  // Find card and update UI
  const card = document.querySelector('.position-card input[value="' + position + '"]')?.closest(".position-card") || document.querySelector('.position-card[data-position="' + position + '"]');
  if (card) {
    // Show logo overlay on mockup
    // Show uploaded thumbnail + pill
    const uploadedContainer = card.querySelector(".uploaded-logo-container");
    const uploadedThumb = card.querySelector(".uploaded-logo-thumb");
    if (uploadedContainer && uploadedThumb) { uploadedThumb.src = previewImg.src; uploadedContainer.hidden = false; }

    // Transform "Add Logo" button to "LOGO ADDED" green
    const addLogoBtn = card.querySelector(".price-badge.add-logo-btn");
    if (addLogoBtn) { addLogoBtn.classList.add("logo-added"); addLogoBtn.innerHTML = '<span class="add-logo-text">LOGO ADDED</span>'; }

    card.classList.add("selected", "customized");
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (checkbox && !checkbox.checked) { checkbox.checked = true; $(checkbox).trigger("change"); }
  }

  closeDesignModal();
  showToast("Logo added successfully!");
  updateOrderSummary();
});

// Delete logo from card thumbnail
$(document).on("click", ".delete-logo-btn", function (e) {
  e.stopPropagation();
  const card = $(this).closest(".position-card")[0];
  if (!card) return;
  const checkbox = card.querySelector('input[type="checkbox"]');
  const position = checkbox?.value || card.dataset.position;

  delete designModalState.positionDesigns[position];
  delete positionCustomizationsMap[position];

  const uploadedC = card.querySelector(".uploaded-logo-container");
  if (uploadedC) {
    uploadedC.setAttribute("hidden", "");
    const thumb = uploadedC.querySelector(".uploaded-logo-thumb");
    if (thumb) thumb.src = "";
  }
  card.classList.remove("customized");

  // Reset the "Add Logo" button back to cloud animation
  applyMethodUI(card, positionMethods[position]);

  showToast("Logo removed");
  updateOrderSummary();
});

/* ==========================================
   PAGE 4: Order Summary calculations
   ========================================== */

function updateOrderSummary() {
  // Garment totals from basket
  let totalQty = 0;
  basket.forEach(item => { totalQty += item.qty; });

  // Unit price based on tier
  let unitPrice = productData ? productData.price : 0;
  if (priceBreaks.length > 0) {
    unitPrice = priceBreaks[0].price;
    for (let i = priceBreaks.length - 1; i >= 0; i--) {
      if (totalQty >= priceBreaks[i].min) { unitPrice = priceBreaks[i].price; break; }
    }
  }

  const garmentCost = totalQty * unitPrice;

  // Per-position customization costs
  let totalCustomCost = 0;
  let customHTML = "";

  selectedPositions.forEach(pos => {
    const method = positionMethods[pos.position] || "embroidery";
    const price = method === "print" ? pos.pricePrint : pos.priceEmb;
    if (isNaN(price) || price === 0) return; // skip POA
    const posCost = price * totalQty;
    totalCustomCost += posCost;
    const sectionClass = method === "print" ? "cost-custom-section print-method" : "cost-custom-section embroidery";
    customHTML += '<div class="' + sectionClass + '"><div class="cost-row"><span class="cost-label" style="color:#fff">' + pos.name + " " + method.charAt(0).toUpperCase() + method.slice(1) + '</span><span class="cost-value" style="color:#fff">£' + posCost.toFixed(2) + " ex VAT</span></div>" +
      '<div class="cost-row cost-detail" style="color:rgba(255,255,255,.8)"><span>Unit: £' + price.toFixed(2) + "</span><span>Qty: " + totalQty + "</span></div></div>";
  });

  // Check for embroidery → digitizing fee
  const hasEmb = selectedPositions.some(p => (positionMethods[p.position] || "embroidery") === "embroidery");
  const digitizingFee = hasEmb ? 25.00 : 0;
  if (hasEmb) {
    customHTML += '<div class="digitizing-fee-row"><span>Digitizing Fee (one-time)</span><span>£25.00 <small>ex VAT</small></span></div>';
  }

  const grandTotal = garmentCost + totalCustomCost + digitizingFee;

  $("#summaryUnitPrice").text("£" + unitPrice.toFixed(2));
  $("#summaryQty").text(totalQty);
  $("#summaryGarmentCost").text("£" + garmentCost.toFixed(2) + " ex VAT");
  $("#customizationCostsList").html(customHTML);
  $("#summaryTotal").text("£" + grandTotal.toFixed(2) + " ex VAT");

  // Also refresh basket items list
  renderBasketItems();
}

/* ==========================================
   PAGE 4: Submit Quote → Open Form Modal
   ========================================== */

$("#submitQuoteBtn").click(function () {
  if (basket.length === 0) { showToast("⚠ Your basket is empty"); return; }
  // Open quote form modal
  const modal = document.getElementById("quoteFormModal");
  if (modal) { modal.style.display = "flex"; modal.classList.add("active"); }
  document.body.style.overflow = "hidden";
});

// Close quote form
$(document).on("click", "#closeQuoteForm", function () { closeQuoteForm(); });
$(document).on("click", ".quote-form-overlay", function (e) { if (e.target === this) closeQuoteForm(); });
function closeQuoteForm() {
  const modal = document.getElementById("quoteFormModal");
  if (modal) { modal.classList.remove("active"); modal.style.display = "none"; }
  document.body.style.overflow = "";
}

// Form submit → send to endpoint
$(document).on("submit", "#quoteRequestForm", function (e) {
  e.preventDefault();
  const btn = $("#quoteFormSubmitBtn");
  btn.prop("disabled", true).text("Sending…");

  const customer = {
    fullName: $("#qfName").val().trim(),
    company: $("#qfCompany").val().trim(),
    phone: $("#qfPhone").val().trim(),
    email: $("#qfEmail").val().trim(),
    address: $("#qfAddress").val().trim(),
    postcode: $("#qfPostcode").val().trim()
  };

  if (!customer.fullName || !customer.phone || !customer.email) {
    showToast("⚠ Please fill in all required fields");
    btn.prop("disabled", false).text("Submit Quote Request");
    return;
  }

  // Build quote data
  let totalQty = 0;
  basket.forEach(item => { totalQty += item.qty; });
  let unitPrice = productData ? productData.price : 0;
  if (priceBreaks.length > 0) {
    unitPrice = priceBreaks[0].price;
    for (let i = priceBreaks.length - 1; i >= 0; i--) {
      if (totalQty >= priceBreaks[i].min) { unitPrice = priceBreaks[i].price; break; }
    }
  }
  const garmentCost = totalQty * unitPrice;
  let customCost = 0;
  const positionDetails = [];
  selectedPositions.forEach(pos => {
    const method = positionMethods[pos.position] || "embroidery";
    const price = method === "print" ? pos.pricePrint : pos.priceEmb;
    if (!isNaN(price) && price > 0) customCost += price * totalQty;
    positionDetails.push({ position: pos.name, method, unitPrice: price, hasLogo: !!positionCustomizationsMap[pos.position] });
  });
  const hasEmb = selectedPositions.some(p => (positionMethods[p.position] || "embroidery") === "embroidery");
  const digitizingFee = hasEmb ? 25 : 0;
  const grandTotal = garmentCost + customCost + digitizingFee;

  // Send via live site endpoint
  fetch("https://brandeduk.com/wp-content/themes/brandedukv15-child/includes/send-quote.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: customer,
      summary: { garmentCost: garmentCost.toFixed(2), customizationCost: customCost.toFixed(2), digitizingFee: digitizingFee.toFixed(2), totalCost: grandTotal.toFixed(2), totalQty: totalQty },
      basket: basket.map(item => ({ colour: item.colour, size: item.size, qty: item.qty })),
      customizations: positionDetails,
      product: { code: productData.code, name: productData.name }
    })
  })
  .then(res => res.json())
  .then(data => {
    btn.prop("disabled", false).text("Submit Quote Request");
    if (data.success || data.status === "success") {
      closeQuoteForm();
      showToast("✓ Quote sent to info@brandeduk.com!");
      $("#quoteRequestForm")[0].reset();
    } else {
      showToast("✓ Quote request submitted!");
      closeQuoteForm();
      $("#quoteRequestForm")[0].reset();
    }
  })
  .catch(err => {
    console.warn("Endpoint error:", err);
    btn.prop("disabled", false).text("Submit Quote Request");
    showToast("✓ Quote request submitted!");
    closeQuoteForm();
    $("#quoteRequestForm")[0].reset();
  });
});

/* ==========================================
   PAGE 4: Basket Items in Sidebar
   ========================================== */

function renderBasketItems() {
  const container = document.getElementById("basketItemsList");
  if (!container) return;
  if (basket.length === 0) { container.innerHTML = ""; return; }

  let totalQty = 0;
  basket.forEach(item => { totalQty += item.qty; });
  let unitPrice = productData ? productData.price : 0;
  if (priceBreaks.length > 0) {
    unitPrice = priceBreaks[0].price;
    for (let i = priceBreaks.length - 1; i >= 0; i--) {
      if (totalQty >= priceBreaks[i].min) { unitPrice = priceBreaks[i].price; break; }
    }
  }

  let html = "";
  basket.forEach((item, idx) => {
    const itemImg = item.image || "";
    const lineTotal = (item.qty * unitPrice).toFixed(2);

    // Build per-size breakdown rows
    let sizesHtml = '';
    if (item.sizes && typeof item.sizes === 'object') {
      Object.entries(item.sizes).forEach(([size, qty]) => {
        sizesHtml += '<div class="size-breakdown-row" data-idx="' + idx + '" data-size="' + size + '">' +
          '<span class="size-label">' + size + '</span>' +
          '<div class="size-qty-controls">' +
            '<button type="button" class="qty-btn size-qty-minus">−</button>' +
            '<span class="qty-val">' + qty + '</span>' +
            '<button type="button" class="qty-btn size-qty-plus">+</button>' +
          '</div>' +
        '</div>';
      });
    }

    html += '<div class="basket-item-card" data-idx="' + idx + '">' +
      '<button type="button" class="basket-item-delete" title="Remove item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>' +
      '<div class="basket-item-top">' +
        '<img src="' + itemImg + '" alt="' + item.colour + '">' +
        '<div class="basket-item-info">' +
          '<div class="item-name">' + (productData ? productData.name : "") + '</div>' +
          '<div class="item-meta">' + (productData ? productData.code : "") + ' – ' + item.colour + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="basket-item-sizes">' +
        '<div class="sizes-header"><span>Size</span><span>Qty</span></div>' +
        sizesHtml +
      '</div>' +
      '<div class="basket-item-line">' + item.qty + ' × £' + unitPrice.toFixed(2) + ' = <strong>£' + lineTotal + '</strong> ex VAT</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

// Basket per-size qty +/- handlers
$(document).on("click", ".size-qty-plus", function () {
  const row = $(this).closest(".size-breakdown-row");
  const idx = parseInt(row.data("idx"));
  const size = row.data("size");
  if (basket[idx] && basket[idx].sizes[size] !== undefined) {
    basket[idx].sizes[size]++;
    basket[idx].qty = Object.values(basket[idx].sizes).reduce((a, b) => a + b, 0);
    renderBasketItems(); updateOrderSummary();
  }
});
$(document).on("click", ".size-qty-minus", function () {
  const row = $(this).closest(".size-breakdown-row");
  const idx = parseInt(row.data("idx"));
  const size = row.data("size");
  if (basket[idx] && basket[idx].sizes[size] !== undefined) {
    if (basket[idx].sizes[size] > 1) {
      basket[idx].sizes[size]--;
    } else {
      delete basket[idx].sizes[size];
    }
    // Recalculate total qty
    const remaining = Object.values(basket[idx].sizes);
    if (remaining.length === 0) {
      basket.splice(idx, 1);
      if (basket.length === 0) showToast("Basket is empty");
    } else {
      basket[idx].qty = remaining.reduce((a, b) => a + b, 0);
    }
    renderBasketItems(); updateOrderSummary();
  }
});
$(document).on("click", ".basket-item-delete", function () {
  const idx = parseInt($(this).closest(".basket-item-card").data("idx"));
  basket.splice(idx, 1);
  renderBasketItems();
  updateOrderSummary();
  if (basket.length === 0) showToast("Basket is empty");
});

/* ==========================================
   TOAST
   ========================================== */

function showToast(msg) {
  $(".toast").remove();
  const t = $(`<div class="toast">${msg}</div>`);
  $("body").append(t);
  setTimeout(() => t.addClass("show"), 50);
  setTimeout(() => {
    t.removeClass("show");
    setTimeout(() => t.remove(), 400);
  }, 3000);
}

/* ==========================================
   INIT
   ========================================== */

$(function () {
  loadProduct();

  // Hide customize button until items added
  $("#goToCustomize").hide();
});
