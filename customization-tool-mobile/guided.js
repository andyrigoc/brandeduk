(function () {
  "use strict";

  const rules = window.BrandedDecorationRules;
  const byId = (id) => document.getElementById(id);
  const positionsEl = byId("guidedPositions");
  const libraryEl = byId("guidedLibrary");
  const notesEl = byId("guidedNotes");
  const methodDialog = byId("guidedMethodDialog");
  let ready = false;
  let switching = false;
  let managing = false;
  let cleanFingerprint = "";
  let baseline = "";
  let draftTimer;
  let saveTimer;
  let saveErrorShown = false;
  let renderFrame;
  let draftKey = "";
  let allowNavigation = false;
  let popupContext = null;
  let uploadContext = null;
  let preservePendingMethod = false;
  const hiddenLibraryLogos = new Set();

  function message(text) {
    byId("guidedMessage").textContent = text;
    byId("guidedMessage").hidden = !text;
  }

  function currentItem() {
    return readQuoteBasket().find((item) => String(item.id) === state.basketItemId);
  }

  function basketFingerprint() {
    const item = currentItem();
    return JSON.stringify(item ? {
      logos: item.logos, positions: item.positions, positionDesigns: item.positionDesigns,
      texts: item.texts, customizationNotes: item.customizationNotes
    } : null);
  }

  function snapshot() {
    return {
      designs: getDraftAreaDesigns(),
      textDesigns: getDraftTextDesigns(),
      notes: state.customizationNotes
    };
  }

  // Logos already used on any basket line stay reusable on every product, so
  // the customer never has to upload the same artwork twice.
  function library() {
    const session = getSessionLogoLibrary();
    const seen = new Set(session.map((entry) => entry.logo));
    const fromBasket = [];
    readQuoteBasket().forEach((item) => (item.logos || []).forEach((logo) => {
      const source = String(logo?.logo || "").trim();
      if (!source || seen.has(source)) return;
      seen.add(source);
      fromBasket.push({ logo: source, method: logo.method || "print", name: logo.name || "Your logo" });
    }));
    return [...fromBasket, ...session].filter((entry) => (
      !hiddenLibraryLogos.has(entry.logo)
      && (state.copyrightConfirmed || entry.logo !== state.uploadedLogo)
    )).slice(-6);
  }

  function saveDraft() {
    if (!ready || !draftKey || switching || state.logoUploadBusy || (state.uploadedLogo && !state.copyrightConfirmed)) return;
    captureCurrentAreaDesign();
    captureCurrentTextDesign();
    const draft = snapshot();
    try {
      sessionStorage.setItem("toolReusableLogos", JSON.stringify(getSessionLogoLibrary().filter((entry) => (
        !hiddenLibraryLogos.has(entry.logo)
      )).slice(-6)));
      sessionStorage.setItem(draftKey, JSON.stringify({
        baseline, ...draft,
        selectedPosition: getDesignAreaKey(),
        hiddenLogos: [...hiddenLibraryLogos]
      }));
    } catch (error) {
      console.error("Unable to save customizer draft", error);
    }
  }

  function setSaveStatus(saved) {
    const status = byId("guidedSaveStatus");
    const label = saved ? "All changes saved" : "Latest changes not saved";
    status.dataset.state = saved ? "saved" : "error";
    status.setAttribute("aria-label", label);
    status.title = label;
  }

  function saveFailed(text) {
    saveErrorShown = true;
    setSaveStatus(false);
    message(text);
    return false;
  }

  // There is no confirm step: every change is written straight to the
  // existing basket line. The session draft only keeps the logo library and
  // selected position for refreshes.
  function persist() {
    clearTimeout(saveTimer);
    if (!ready || !state.basketItemId || !currentItem()) return true;
    if (switching) {
      scheduleSave();
      return false;
    }
    if (state.logoUploadBusy || (state.uploadedLogo && !state.copyrightConfirmed)) {
      return saveFailed("Please wait for your logo to finish uploading.");
    }
    const current = JSON.stringify(snapshot());
    if (current === cleanFingerprint) return true;
    const error = getGuidedValidationError();
    if (error) return saveFailed(error);
    let result;
    try {
      result = upsertBasketItemFromState();
    } catch (saveError) {
      console.error("Customizer autosave failed", saveError);
      return saveFailed(saveError.message || "Your changes could not be saved. Please try again.");
    }
    if (result?.saved === false) {
      return saveFailed("Your basket storage is full, so the latest changes could not be saved. Remove an item from the basket and try again.");
    }
    baseline = basketFingerprint();
    cleanFingerprint = JSON.stringify(snapshot());
    setSaveStatus(true);
    if (saveErrorShown) {
      saveErrorShown = false;
      message("");
    }
    saveDraft();
    return true;
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 400);
  }

  async function saveAndGo(url) {
    for (let attempt = 0; attempt < 40 && (switching || state.logoUploadBusy); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!persist()) return;
    allowNavigation = true;
    window.location.href = url;
  }

  function scheduleRender() {
    if (!ready) return;
    cancelAnimationFrame(renderFrame);
    renderFrame = requestAnimationFrame(render);
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 250);
    scheduleSave();
  }

  function methods(position = getDesignAreaKey()) {
    return rules.allowedMethods(state.customizationProductTypeSlug, state.productName, position);
  }

  function defaultMethod(position) {
    const allowed = methods(position);
    return allowed[state.decorationType] === "yes" ? state.decorationType
      : allowed.print === "yes" ? "print" : allowed.embroidery === "yes" ? "embroidery" : "";
  }

  async function selectPosition(position) {
    if (switching || state.logoUploadBusy || !ready) return false;
    switching = true;
    positionsEl.setAttribute("aria-busy", "true");
    try {
      await switchToDesignArea(position, { position });
      if (!state.uploadedLogo) state.decorationType = defaultMethod(position);
      render();
      positionsEl.querySelector(`[data-position="${CSS.escape(position)}"]`)?.scrollIntoView({
        block: "nearest", inline: "nearest", behavior: "auto"
      });
      return true;
    } catch (error) {
      console.error("Unable to select decoration position", error);
      message("This position could not be loaded. Please try again.");
      return false;
    } finally {
      switching = false;
      positionsEl.setAttribute("aria-busy", "false");
    }
  }

  // Conflicting positions are only removed once the new logo is actually
  // assigned, so cancelling the popup or the file picker never loses work.
  async function checkAssignment(position) {
    if (!await selectPosition(position)) return null;
    const designs = getDraftAreaDesigns();
    const textDesigns = getDraftTextDesigns();
    const used = new Set([
      ...Object.keys(designs).filter((key) => designs[key]?.logo),
      ...Object.keys(textDesigns).filter((key) => textDesigns[key]?.text)
    ]);
    if (!used.has(position) && used.size >= rules.maxPositions) {
      message(`You can customise up to ${rules.maxPositions} positions per product. Remove one to add another.`);
      return null;
    }
    const conflicts = [...used].filter((key) => (
      rules.conflicts[position]?.conflictsWith.includes(key)
      || rules.conflicts[key]?.conflictsWith.includes(position)
    ));
    if (conflicts.length && !window.confirm(`${getDesignAreaLabel(position)} overlaps ${conflicts.map(getDesignAreaLabel).join(", ")}. Replace those customisations?`)) return null;
    message("");
    return conflicts;
  }

  function removeConflicts(conflicts) {
    conflicts.forEach((key) => {
      delete state.areaDesigns[key];
      delete state.areaTextDesigns[key];
    });
  }

  function openFilePicker() {
    const input = byId("logoFileInput");
    input.accept = ".png,.jpg,.jpeg,.webp,.svg";
    input.removeAttribute("hidden");
    input.classList.add("guided-file-input");
    input.click();
  }

  // intent: "add" (empty position), "change" (assigned logo), "reuse" (library
  // logo) or "upload" (new file). The technique is always chosen in this popup.
  async function openMethodPopup(position, intent, entry = null) {
    const conflicts = await checkAssignment(position);
    if (!conflicts) return;
    popupContext = { position, intent, entry, conflicts };
    state.pendingDecorationType = null;
    showMethodChoices();
    methodDialog.showModal();
    methodDialog.querySelector("[data-popup-method]:not(:disabled)")?.focus();
  }

  function showMethodChoices() {
    const { position, intent, entry } = popupContext;
    const current = getDraftAreaDesigns()[position];
    const currentMethod = current?.logo ? (current.method === "embroidery" ? "embroidery" : "print") : "";
    byId("guidedMethodTitle").textContent = "Choose decoration method";
    byId("guidedMethodPosition").textContent = entry
      ? `${getDesignAreaLabel(position)} \u00b7 ${entry.name || "Your logo"}`
      : getDesignAreaLabel(position);
    byId("guidedMethodChoices").hidden = false;
    byId("guidedArtworkChoices").hidden = true;
    const allowed = methods(position);
    const unavailable = allowed.embroidery === "no" && allowed.print === "no";
    byId("guidedMethodNotice").textContent = unavailable
      ? "No decoration method is available online for this position. Contact us for a quote."
      : "";
    byId("guidedMethodNotice").hidden = !unavailable;
    byId("guidedMethodContact").hidden = !unavailable;
    methodDialog.querySelectorAll("[data-popup-method]").forEach((button) => {
      const method = button.dataset.popupMethod;
      const status = allowed[method];
      const label = method === "embroidery" ? "EMBROIDERY" : "PRINTING";
      button.textContent = `${label}${status === "poa" ? " \u00b7 POA" : status === "no" ? " \u00b7 UNAVAILABLE" : ""}`;
      button.disabled = status === "no";
      button.setAttribute("aria-pressed", String(intent === "change" && currentMethod === method));
    });
  }

  function closeMethodDialog(keepMethod = false) {
    preservePendingMethod = keepMethod;
    methodDialog.close();
  }

  function choosePopupMethod(method) {
    const { position, intent, entry, conflicts } = popupContext;
    if (methods(position)[method] !== "yes") {
      byId("guidedMethodNotice").textContent = "This technique is available on request. Contact us for a personalised quote.";
      byId("guidedMethodNotice").hidden = false;
      byId("guidedMethodContact").hidden = false;
      return;
    }
    if (intent === "change") {
      closeMethodDialog();
      removeConflicts(conflicts);
      if (state.areaDesigns[position]) state.areaDesigns[position].method = method;
      state.decorationType = method;
      if (state.uploadedLogo) captureCurrentAreaDesign();
      calculatePrice();
      scheduleRender();
      return;
    }
    if (entry) {
      closeMethodDialog();
      assignLogo(entry, method, conflicts);
      return;
    }
    state.pendingDecorationType = method;
    const entries = library();
    if (intent === "upload" || !entries.length) {
      startUpload();
      return;
    }
    byId("guidedMethodTitle").textContent = "Add your logo";
    byId("guidedMethodPosition").textContent = `${getDesignAreaLabel(position)} \u00b7 ${method === "embroidery" ? "Embroidery" : "Printing"}`;
    byId("guidedMethodChoices").hidden = true;
    byId("guidedMethodNotice").hidden = true;
    byId("guidedMethodContact").hidden = true;
    byId("guidedArtworkChoices").hidden = false;
    byId("guidedPopupLibrary").replaceChildren(...entries.map((libraryEntry) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `Reuse ${libraryEntry.name || "logo"} on ${getDesignAreaLabel(position)}`);
      const image = document.createElement("img");
      image.src = libraryEntry.logo;
      image.alt = libraryEntry.name || "Uploaded logo";
      const name = document.createElement("small");
      name.textContent = libraryEntry.name || "Your logo";
      button.append(image, name);
      button.addEventListener("click", () => {
        closeMethodDialog();
        assignLogo(libraryEntry, method, conflicts);
      });
      return button;
    }));
    byId("guidedPopupUpload").focus();
  }

  function startUpload() {
    uploadContext = { position: popupContext.position, conflicts: popupContext.conflicts };
    closeMethodDialog(true);
    openFilePicker();
  }

  function assignLogo(entry, method, conflicts = []) {
    removeConflicts(conflicts);
    state.decorationType = method;
    state.pendingDecorationType = null;
    state.uploadedLogoName = entry.name || "Your logo";
    state.originalUploadedLogo = entry.logo;
    state.copyrightConfirmed = true;
    reuseLibraryLogo(entry.logo);
    scheduleRender();
  }

  async function removeLogo(position) {
    if (!await selectPosition(position)) return;
    clearLogo();
    scheduleRender();
  }

  function positionCard(position, designs) {
    const key = normalizeProductTypeSlug(position.slug);
    const design = designs[key];
    const active = getDesignAreaKey() === key;
    const card = document.createElement("article");
    card.className = `guided-position${active ? " is-active" : ""}${design?.logo ? " has-logo" : ""}`;
    card.dataset.position = key;

    const select = document.createElement("button");
    select.type = "button";
    select.className = "guided-position-select";
    select.setAttribute("aria-pressed", String(active));
    select.setAttribute("aria-label", `Select ${position.label}`);
    const image = document.createElement("img");
    image.src = position.apiImageUrl || resolveConfiguredGarmentImage(configuredPositionArea(position), key);
    image.alt = position.label;
    image.draggable = false;
    image.addEventListener("error", () => message(`The ${position.label} preview could not be loaded. Please retry your connection.`));
    const label = document.createElement("span");
    label.className = "guided-position-label";
    label.textContent = position.label;
    select.append(image, label);
    select.addEventListener("click", () => selectPosition(key));

    const logoButton = document.createElement("button");
    logoButton.type = "button";
    logoButton.className = "guided-position-logo";
    logoButton.setAttribute("aria-label", design?.logo ? `Change technique on ${position.label}` : `Add logo on ${position.label}`);
    if (design?.logo) {
      const logo = document.createElement("img");
      logo.src = design.logo;
      logo.alt = "Assigned logo";
      const method = document.createElement("small");
      method.textContent = design.method === "embroidery" ? "Embroidery" : "Print";
      logoButton.append(logo, method);
    } else {
      const plus = document.createElement("span");
      plus.textContent = "+";
      const copy = document.createElement("small");
      copy.textContent = "Add logo";
      logoButton.append(plus, copy);
    }
    logoButton.addEventListener("click", () => openMethodPopup(key, design?.logo ? "change" : "add"));
    card.append(select, logoButton);
    if (design?.logo) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "guided-position-remove";
      remove.textContent = "\u00d7";
      remove.setAttribute("aria-label", `Remove logo from ${position.label}`);
      remove.addEventListener("click", () => removeLogo(key));
      card.append(remove);
    }
    return card;
  }

  function renderLibrary() {
    const entries = library();
    byId("guidedLibraryTitle").textContent = `Your uploaded logos (${entries.length})`;
    byId("guidedManageLogos").textContent = managing ? "Done" : "Manage";
    byId("guidedManageLogos").setAttribute("aria-pressed", String(managing));
    const cells = entries.map((entry) => {
      const cell = document.createElement("div");
      cell.className = "guided-logo-item";
      const use = document.createElement("button");
      use.type = "button";
      use.className = `guided-library-use${state.uploadedLogo === entry.logo ? " is-selected" : ""}`;
      use.setAttribute("aria-label", `Use ${entry.name || "this logo"} on ${getDesignAreaLabel()}`);
      const image = document.createElement("img");
      image.src = entry.logo;
      image.alt = entry.name || "Uploaded logo";
      const name = document.createElement("small");
      name.textContent = entry.name || "Your logo";
      use.append(image, name);
      use.addEventListener("click", () => openMethodPopup(getDesignAreaKey(), "reuse", entry));
      cell.append(use);
      if (managing) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "guided-library-remove";
        remove.textContent = "\u00d7";
        remove.setAttribute("aria-label", `Remove ${entry.name || "logo"} from library only`);
        remove.addEventListener("click", () => {
          hiddenLibraryLogos.add(entry.logo);
          message("Logo removed from the library. Logos already assigned to positions are unchanged.");
          scheduleRender();
        });
        cell.append(remove);
      }
      return cell;
    });
    const upload = document.createElement("button");
    upload.type = "button";
    upload.className = "guided-upload";
    upload.innerHTML = "<span aria-hidden='true'>+</span><small>Upload another logo</small>";
    upload.disabled = state.logoUploadBusy || !getConfiguredViewPositions().length;
    upload.addEventListener("click", () => openMethodPopup(getDesignAreaKey(), "upload"));
    libraryEl.replaceChildren(...cells, upload);
  }

  function render() {
    if (!ready) return;
    const item = currentItem();
    const image = item?.colorImage || item?.image || state.selectedColorImage;
    byId("guidedProductCode").textContent = state.productCode;
    byId("guidedProductName").textContent = item?.productName || item?.name || state.productName;
    byId("guidedProductColour").textContent = item?.color || state.colourName;
    byId("guidedColourSwatch").style.backgroundColor = item?.colorHex || state.colourHex;
    if (image && byId("guidedProductImage").getAttribute("src") !== image) byId("guidedProductImage").src = image;
    byId("guidedProductImage").hidden = !image;
    byId("guidedProductImage").alt = `${state.productName}, ${item?.color || state.colourName}`;
    byId("guidedBrandName").textContent = state.brandName;
    byId("guidedBrandName").hidden = Boolean(state.brandLogo);
    byId("guidedBrandLogo").hidden = !state.brandLogo;
    if (state.brandLogo) {
      byId("guidedBrandLogo").src = state.brandLogo;
      byId("guidedBrandLogo").alt = state.brandName;
    }
    const singular = { tshirts: "t-shirt", polos: "polo", aprons: "apron", hoodies: "hoodie", beanies: "beanie", caps: "cap" };
    byId("guidedTitle").textContent = `Customise your ${singular[state.customizationProductTypeSlug] || "product"}`;
    byId("guidedStepCode").textContent = state.productCode;
    byId("guidedStepColour").textContent = item?.color || state.colourName;
    byId("guidedStepQuantity").textContent = `${state.totalQty} items`;
    byId("guidedBasketCount").textContent = getBasketEntryCount(readQuoteBasket());

    const positions = getConfiguredViewPositions();
    const designs = getDraftAreaDesigns();
    const scrollLeft = positionsEl.scrollLeft;
    positionsEl.replaceChildren(...positions.map((position) => positionCard(position, designs)));
    positionsEl.scrollLeft = scrollLeft;
    positionsEl.setAttribute("aria-busy", String(switching || state.logoUploadBusy));
    const selectedIndex = positions.findIndex((position) => position.slug === getDesignAreaKey());
    byId("guidedPositionCounter").textContent = positions.length ? `${selectedIndex + 1} / ${positions.length}` : "";
    byId("guidedRetryBtn").hidden = positions.length > 0;
    renderLibrary();
    const qty = state.totalQty;
    const pricingQty = getProductPricingQuantity(qty);
    const decorationTotal = Object.values(designs).reduce((sum, design) => (
      sum + (design?.logo ? getLogoUnitPrice(design.method, pricingQty) * qty : 0)
    ), 0) + Object.values(getDraftTextDesigns()).filter((design) => design?.text).length * 1.5 * qty;
    byId("guidedPriceSummary").textContent = decorationTotal > 0
      ? `${qty} items \u00b7 Decoration \u00a3${toDisplayAmount(decorationTotal).toFixed(2)} ${vatSuffixLabel()}`
      : `${qty} items \u00b7 No logo added yet`;
    byId("guidedGoToBasket").disabled = state.logoUploadBusy;
    byId("guidedAddProduct").disabled = state.logoUploadBusy;
    if (!item) message("This product is no longer in your basket. Go back to choose your product.");
    else if (!positions.length) message("We couldn't load the decoration positions. Please retry; your product is still in the basket.");
  }

  async function initialise() {
    if (ready) return;
    ready = true;
    draftKey = state.basketItemId ? `guidedCustomizer:${state.basketItemId}` : "";
    baseline = basketFingerprint();
    cleanFingerprint = JSON.stringify(snapshot());
    notesEl.value = state.customizationNotes;
    if (draftKey) {
      try {
        const draft = JSON.parse(sessionStorage.getItem(draftKey) || "null");
        (draft?.library || []).forEach((entry) => rememberUploadedLogo(entry.logo, entry.method, entry.name));
        (draft?.hiddenLogos || []).forEach((logo) => hiddenLibraryLogos.add(logo));
        if (draft && draft.baseline === baseline) {
          state.areaDesigns = draft.designs || {};
          state.areaTextDesigns = draft.textDesigns || {};
          state.customizationNotes = String(draft.notes || "");
          notesEl.value = state.customizationNotes;
          clearCanvasLogoState();
          clearCanvasTextState();
          const position = getConfiguredPosition(draft.selectedPosition);
          if (position) await switchToDesignArea(position.slug, { force: true, captureCurrent: false });
        }
      } catch (error) {
        console.error("Unable to restore customizer draft", error);
      }
    }
    if (!state.uploadedLogo) state.decorationType = defaultMethod(getDesignAreaKey());
    render();
    persist();
  }

  notesEl.addEventListener("input", () => {
    state.customizationNotes = notesEl.value;
    saveDraft();
    scheduleSave();
  });
  byId("guidedMethodClose").addEventListener("click", () => closeMethodDialog());
  methodDialog.addEventListener("click", (event) => {
    if (event.target === methodDialog) closeMethodDialog();
  });
  methodDialog.addEventListener("close", () => {
    if (!preservePendingMethod) state.pendingDecorationType = null;
    preservePendingMethod = false;
  });
  methodDialog.querySelectorAll("[data-popup-method]").forEach((button) => {
    button.addEventListener("click", () => choosePopupMethod(button.dataset.popupMethod));
  });
  byId("guidedPopupUpload").addEventListener("click", startUpload);
  byId("guidedChangeMethod").addEventListener("click", () => {
    state.pendingDecorationType = null;
    showMethodChoices();
    methodDialog.querySelector("[data-popup-method]:not(:disabled)")?.focus();
  });
  byId("logoFileInput").addEventListener("cancel", () => {
    state.pendingDecorationType = null;
    uploadContext = null;
  });
  window.addEventListener("customizer:logo-confirmed", () => {
    if (uploadContext?.position === getDesignAreaKey()) removeConflicts(uploadContext.conflicts);
    uploadContext = null;
    scheduleRender();
  });
  window.addEventListener("customizer:logo-cancelled", () => { uploadContext = null; });
  byId("guidedManageLogos").addEventListener("click", () => { managing = !managing; renderLibrary(); });

  // Continuous horizontal scrolling: touch uses native swipe; mouse users
  // (desktop previews) can drag the strip without triggering card taps.
  let drag = null;
  let suppressClick = false;
  positionsEl.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, left: positionsEl.scrollLeft, moved: false };
  });
  positionsEl.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const distance = event.clientX - drag.x;
    if (!drag.moved && Math.abs(distance) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      positionsEl.setPointerCapture(event.pointerId);
      positionsEl.classList.add("is-dragging");
    }
    positionsEl.scrollLeft = drag.left - distance;
  });
  const endDrag = () => {
    if (!drag) return;
    if (drag.moved) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    positionsEl.classList.remove("is-dragging");
    drag = null;
  };
  positionsEl.addEventListener("pointerup", endDrag);
  positionsEl.addEventListener("pointercancel", endDrag);
  positionsEl.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  byId("guidedRetryBtn").addEventListener("click", async () => {
    byId("guidedRetryBtn").disabled = true;
    const loaded = await loadCustomizationConfigForCurrentProduct();
    if (loaded) {
      hydrateAreaDesignsFromBasketContext();
      await switchToDesignArea(getDesignAreaKey(), { force: true, captureCurrent: false });
      message("");
    }
    byId("guidedRetryBtn").disabled = false;
    render();
  });
  byId("guidedBackBtn").addEventListener("click", () => saveAndGo("../basket.html"));
  byId("guidedGoToBasket").addEventListener("click", () => saveAndGo("../basket.html"));
  byId("guidedAddProduct").addEventListener("click", () => saveAndGo("../mobile/shop-mobile.html"));
  document.querySelectorAll(".guided-header a").forEach((link) => {
    link.addEventListener("click", (event) => { event.preventDefault(); saveAndGo(link.href); });
  });
  byId("guidedAdvancedBtn").addEventListener("click", () => {
    document.body.classList.add("guided-advanced-open");
    openScreen("mainEditor");
    applyArea();
  });
  byId("guidedReturnBtn").addEventListener("click", () => {
    captureCurrentAreaDesign();
    captureCurrentTextDesign();
    document.body.classList.remove("guided-advanced-open");
    scheduleRender();
    window.scrollTo(0, 0);
  });
  byId("guidedBrandLogo").addEventListener("error", () => {
    byId("guidedBrandLogo").hidden = true;
    byId("guidedBrandName").hidden = false;
  });
  window.addEventListener("customizer:ready", initialise);
  window.addEventListener("customizer:change", scheduleRender);
  window.addEventListener("customizer:screen", scheduleRender);
  window.addEventListener("vatToggleChanged", scheduleRender);
  window.addEventListener("storage", (event) => {
    if (event.key === "quoteBasket") scheduleRender();
  });
  window.addEventListener("pagehide", () => {
    persist();
    saveDraft();
  });
  window.addEventListener("beforeunload", (event) => {
    if (allowNavigation || persist()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  if (state.guidedReady) initialise();
})();
