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
  // The first position is active by default, but library logos and uploads only
  // go to a position the customer picked (tapped, used its + button or dropped on).
  let positionChosen = false;
  const hiddenLibraryLogos = new Set();
  const libraryEntries = new WeakMap();
  let logoPreviewDialog;

  function message(text) {
    byId("guidedMessage").textContent = text;
    byId("guidedMessage").hidden = !text;
  }

  function askForPosition(text) {
    message(text);
    byId("guidedMessage").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function showLogoPreview(image) {
    if (!image?.src) return;
    if (!logoPreviewDialog) {
      const dialog = document.createElement("dialog");
      dialog.className = "guided-image-zoom-dialog";
      dialog.setAttribute("aria-label", "Logo preview");
      const close = document.createElement("button");
      close.type = "button";
      close.className = "guided-image-zoom-close";
      close.setAttribute("aria-label", "Close image preview");
      close.textContent = "×";
      const preview = document.createElement("img");
      preview.alt = "Logo preview";
      dialog.append(close, preview);
      document.body.append(dialog);
      close.addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
      logoPreviewDialog = { dialog, preview };
    }
    logoPreviewDialog.preview.src = image.currentSrc || image.src;
    logoPreviewDialog.preview.alt = image.alt || "Logo preview";
    if (!logoPreviewDialog.dialog.open) logoPreviewDialog.dialog.showModal();
  }

  function zoomLogoOnClick(event) {
    event.preventDefault();
    event.stopPropagation();
    showLogoPreview(event.currentTarget);
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

  function libraryIdentity(entry) {
    const source = String(entry?.logo || "").trim();
    const logoId = String(entry?.logoId || "").trim()
      || (source.startsWith("bklogo:") ? source.slice(7) : "")
      || (source.startsWith("data:image") && typeof window.BrandedQuoteStorage?.fingerprint === "function"
        ? window.BrandedQuoteStorage.fingerprint(source)
        : "");
    return logoId ? `id:${logoId}` : `src:${source}`;
  }

  // Logos already used on any basket line stay reusable on every product, so
  // the customer never has to upload the same artwork twice.
  function library() {
    const session = getSessionLogoLibrary().filter((entry) => !String(entry?.logo || "").startsWith("blob:"));
    const uniqueSession = new Map();
    session.forEach((entry) => {
      const identity = libraryIdentity(entry);
      const existing = uniqueSession.get(identity);
      if (!existing || (existing.name === "Your logo" && entry.name && entry.name !== "Your logo")) {
        uniqueSession.set(identity, entry);
      }
    });
    const sessionEntries = [...uniqueSession.values()];
    const seen = new Set(sessionEntries.map(libraryIdentity));
    const fromBasket = [];
    readQuoteBasket().forEach((item) => (item.logos || []).forEach((logo) => {
      const source = String(logo?.logo || "").trim();
      const identity = libraryIdentity(logo);
      if (!source || seen.has(identity)) return;
      seen.add(identity);
      fromBasket.push({ logo: source, method: logo.method || "print", name: logo.name || "Your logo" });
    }));
    return [...fromBasket, ...sessionEntries].filter((entry) => (
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
        !hiddenLibraryLogos.has(entry.logo) && !String(entry.logo || "").startsWith("blob:")
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
      positionChosen = true;
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

  function confirmReplace(position, conflicts) {
    const dialog = byId("guidedConfirmDialog");
    if (!dialog?.showModal) {
      return Promise.resolve(window.confirm(`${getDesignAreaLabel(position)} overlaps ${conflicts.map(getDesignAreaLabel).join(", ")}. Replace those customisations?`));
    }
    const text = byId("guidedConfirmText");
    const bold = (value) => { const b = document.createElement("b"); b.textContent = value; return b; };
    text.replaceChildren(
      bold(getDesignAreaLabel(position)),
      " overlaps ",
      bold(conflicts.map(getDesignAreaLabel).join(", ")),
      ". Adding a logo here will remove the existing customisation from that position."
    );
    return new Promise((resolve) => {
      const ok = byId("guidedConfirmOk");
      const cancel = byId("guidedConfirmCancel");
      const finish = (result) => {
        ok.removeEventListener("click", onOk);
        cancel.removeEventListener("click", onCancel);
        dialog.removeEventListener("cancel", onCancel);
        if (dialog.open) dialog.close();
        resolve(result);
      };
      const onOk = () => finish(true);
      const onCancel = (event) => { event?.preventDefault?.(); finish(false); };
      ok.addEventListener("click", onOk);
      cancel.addEventListener("click", onCancel);
      dialog.addEventListener("cancel", onCancel);
      dialog.showModal();
      ok.focus();
    });
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
    if (conflicts.length && !await confirmReplace(position, conflicts)) return null;
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
    byId("guidedMethodTitle").textContent = "Choose decoration";
    const positionName = document.createElement("b");
    positionName.textContent = getDesignAreaLabel(position);
    byId("guidedMethodPosition").replaceChildren("How should we apply your logo on ", positionName, "?");
    byId("guidedMethodChoices").hidden = false;
    byId("guidedArtworkChoices").hidden = true;
    const allowed = methods(position);
    const unavailable = allowed.embroidery === "no" && allowed.print === "no";
    byId("guidedMethodNotice").textContent = unavailable
      ? "No decoration method is available online for this position. Contact us for a quote."
      : "";
    byId("guidedMethodNotice").hidden = !unavailable;
    byId("guidedMethodContact").hidden = !unavailable;
    const pricingQty = getProductPricingQuantity(state.totalQty);
    methodDialog.querySelectorAll("[data-popup-method]").forEach((button) => {
      const method = button.dataset.popupMethod;
      const status = allowed[method];
      const price = toDisplayAmount(getLogoUnitPrice(method, pricingQty, position));
      button.querySelector("em").textContent = status === "no" ? "Not available"
        : status === "poa" ? "Price on request"
          : `\u00a3${price.toFixed(2)} each${isVatOn() ? " inc. VAT" : ""}`;
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
    byId("guidedMethodPosition").textContent = `${getDesignAreaLabel(position)} \u00b7 ${method === "embroidery" ? "Embroidery" : "Print"}`;
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
      image.addEventListener("click", zoomLogoOnClick);
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
    state.libraryOnlyUpload = false;
    closeMethodDialog(true);
    openFilePicker();
  }

  // Library uploads only add the artwork to "Your uploaded logos"; print or
  // embroidery is chosen once the logo is dropped on (or picked for) a position.
  function startLibraryUpload() {
    if (switching || state.logoUploadBusy || !ready) return;
    captureCurrentAreaDesign();
    uploadContext = null;
    state.pendingDecorationType = null;
    state.libraryOnlyUpload = true;
    message("");
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
    logoButton.className = `guided-position-logo${design?.logo ? "" : " is-empty"}`;
    logoButton.setAttribute("aria-label", design?.logo ? `Change technique on ${position.label}` : `Add logo on ${position.label}`);
    if (design?.logo) {
      const logo = document.createElement("img");
      logo.src = design.logo;
      logo.alt = "Assigned logo";
      logo.addEventListener("click", zoomLogoOnClick);
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

  function updateCarouselCues() {
    const overflow = positionsEl.scrollWidth - positionsEl.clientWidth;
    const cards = positionsEl.querySelectorAll(".guided-position");
    const hint = byId("guidedPositionHint");
    const noOverflow = overflow <= 4;
    byId("guidedSwipeRow").hidden = noOverflow && (hint.hidden || hint.classList.contains("is-off"));
    byId("guidedSwipeRow").classList.toggle("is-static", noOverflow);
    byId("guidedPositionsNext").disabled = positionsEl.scrollLeft >= overflow - 4;
    byId("guidedPositionsPrev").disabled = positionsEl.scrollLeft <= 4;
    const right = positionsEl.getBoundingClientRect().right + 2;
    const visible = [...cards].filter((card) => card.getBoundingClientRect().right <= right).length;
    byId("guidedPositionCounter").textContent = cards.length ? `${Math.max(1, visible)} / ${cards.length}` : "";
  }

  function scrollPositions(direction) {
    const card = positionsEl.querySelector(".guided-position");
    const step = card ? card.getBoundingClientRect().width + 7 : positionsEl.clientWidth * 0.8;
    positionsEl.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  function renderAllPositions() {
    const designs = getDraftAreaDesigns();
    const activeKey = getDesignAreaKey();
    const cells = getConfiguredViewPositions().map((position) => {
      const key = normalizeProductTypeSlug(position.slug);
      const design = designs[key];
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `guided-all-item${key === activeKey ? " is-active" : ""}${design?.logo ? " has-logo" : ""}`;
      cell.setAttribute("aria-pressed", String(key === activeKey));
      const image = document.createElement("img");
      image.src = position.apiImageUrl || resolveConfiguredGarmentImage(configuredPositionArea(position), key);
      image.alt = "";
      const label = document.createElement("strong");
      label.textContent = position.label;
      const status = document.createElement("small");
      status.textContent = design?.logo ? `\u2713 ${design.method === "embroidery" ? "Embroidery" : "Print"}` : "+ Add logo";
      cell.append(image, label, status);
      cell.addEventListener("click", () => {
        byId("guidedAllDialog").close();
        selectPosition(key);
      });
      return cell;
    });
    byId("guidedAllGrid").replaceChildren(...cells);
  }

  // The hint lives outside the scrolling strip so the strip never clips it.
  // It overlays the swipe row, which moves to the free side.
  function placeHint() {
    const hint = byId("guidedPositionHint");
    const row = byId("guidedSwipeRow");
    const card = positionsEl.querySelector(".guided-position.is-active");
    row.classList.remove("align-start", "align-end");
    if (hint.hidden || hint.classList.contains("is-off") || !card) return;
    const strip = positionsEl.getBoundingClientRect();
    const section = hint.offsetParent?.getBoundingClientRect() || strip;
    const box = card.getBoundingClientRect();
    const cardLeft = box.left - strip.left;
    const left = Math.max(0, Math.min(cardLeft, strip.width - hint.offsetWidth));
    const arrow = Math.max(12, Math.min(cardLeft + box.width / 2 - left, hint.offsetWidth - 12));
    const offscreen = box.right <= strip.left || box.left >= strip.right;
    hint.style.visibility = offscreen ? "hidden" : "";
    hint.style.top = `${strip.bottom - section.top + 9}px`;
    hint.style.setProperty("--hint-left", `${left + strip.left - section.left}px`);
    hint.style.setProperty("--hint-arrow", `${arrow}px`);
    if (!offscreen) row.classList.add(left + hint.offsetWidth / 2 < strip.width / 2 ? "align-end" : "align-start");
  }

  function renderLibrary() {
    const entries = library();
    byId("guidedLibraryTitle").textContent = `Your uploaded logos (${entries.length})`;
    byId("guidedDragHint").hidden = !entries.length;
    byId("guidedManageLogos").textContent = managing ? "Done" : "Manage";
    byId("guidedManageLogos").setAttribute("aria-pressed", String(managing));
    const cells = entries.map((entry) => {
      const cell = document.createElement("div");
      cell.className = "guided-logo-item";
      const use = document.createElement("button");
      use.type = "button";
      use.className = `guided-library-use${state.uploadedLogo === entry.logo ? " is-selected" : ""}`;
      use.setAttribute("aria-label", positionChosen
        ? `Use ${entry.name || "this logo"} on ${getDesignAreaLabel()}`
        : `${entry.name || "Your logo"}: choose a position first, or drag it onto one`);
      const image = document.createElement("img");
      image.src = entry.logo;
      image.alt = entry.name || "Uploaded logo";
      image.draggable = false;
      image.addEventListener("click", zoomLogoOnClick);
      const name = document.createElement("small");
      name.textContent = entry.name || "Your logo";
      use.append(image, name);
      libraryEntries.set(use, entry);
      use.addEventListener("click", () => {
        if (!positionChosen) {
          askForPosition("Drag this logo onto a position, or tap the position you want first.");
          return;
        }
        openMethodPopup(getDesignAreaKey(), "reuse", entry);
      });
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
    upload.addEventListener("click", startLibraryUpload);
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
    byId("guidedViewAll").hidden = positions.length < 3;
    byId("guidedViewAllText").textContent = `View all ${positions.length}`;
    byId("guidedViewAll").setAttribute("aria-label", `View all ${positions.length} positions${selectedIndex >= 0 ? `, ${selectedIndex + 1} selected` : ""}`);
    if (byId("guidedAllDialog").open) renderAllPositions();
    byId("guidedRetryBtn").hidden = positions.length > 0;
    byId("guidedPositionHint").hidden = !positions.length;
    byId("guidedPositionHint").classList.toggle("is-off", !positionsEl.querySelector(".guided-position.is-active")
      || Boolean(designs[getDesignAreaKey()]?.logo || getDraftTextDesigns()[getDesignAreaKey()]?.text));
    updateCarouselCues();
    placeHint();
    renderLibrary();
    const qty = state.totalQty;
    const pricingQty = getProductPricingQuantity(qty);
    const decorationTotal = Object.entries(designs).reduce((sum, [area, design]) => (
      sum + (design?.logo ? getLogoUnitPrice(design.method, pricingQty, area) * qty : 0)
    ), 0) + Object.values(getDraftTextDesigns()).filter((design) => design?.text).length * 1.5 * qty;
    byId("guidedPriceSummary").textContent = decorationTotal > 0
      ? `${qty} items \u00b7 Decoration \u00a3${toDisplayAmount(decorationTotal).toFixed(2)} ${vatSuffixLabel()}`
      : `${qty} items \u00b7 No logo added yet`;
    const logoCount = Object.values(designs).filter((design) => design?.logo).length;
    const customiseDot = byId("guidedStepCustomiseDot");
    if (customiseDot) {
      customiseDot.classList.toggle("is-done", logoCount > 0);
      customiseDot.innerHTML = logoCount > 0 ? "&#10003;" : "4";
      byId("guidedStepCustomiseSub").textContent = logoCount > 0
        ? `${logoCount} logo${logoCount === 1 ? "" : "s"} added`
        : "Add your design";
    }
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
    loadApplicationPrices(getProductPricingQuantity(state.totalQty)).then(() => {
      calculatePrice();
      scheduleRender();
      if (methodDialog.open && !byId("guidedMethodChoices").hidden) showMethodChoices();
    });
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
    state.libraryOnlyUpload = false;
    uploadContext = null;
  });
  window.addEventListener("customizer:logo-confirmed", () => {
    if (uploadContext?.position === getDesignAreaKey()) removeConflicts(uploadContext.conflicts);
    uploadContext = null;
    scheduleRender();
  });
  window.addEventListener("customizer:logo-cancelled", () => { uploadContext = null; });
  window.addEventListener("customizer:logo-library-added", () => {
    message("Logo added to your uploaded logos. Drag it onto a position to choose print or embroidery.");
    scheduleRender();
  });
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
  positionsEl.addEventListener("scroll", placeHint, { passive: true });
  positionsEl.addEventListener("scroll", updateCarouselCues, { passive: true });
  byId("guidedPositionsNext").addEventListener("click", () => scrollPositions(1));
  byId("guidedPositionsPrev").addEventListener("click", () => scrollPositions(-1));
  byId("guidedViewAll").addEventListener("click", () => {
    renderAllPositions();
    byId("guidedAllDialog").showModal();
    byId("guidedAllGrid").querySelector(".is-active")?.focus();
  });
  byId("guidedAllClose").addEventListener("click", () => byId("guidedAllDialog").close());
  window.addEventListener("resize", updateCarouselCues);
  window.addEventListener("resize", placeHint);
  positionsEl.addEventListener("pointerup", endDrag);
  positionsEl.addEventListener("pointercancel", endDrag);
  positionsEl.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  // Library logos can be dropped onto a position card. Touch needs a short
  // hold first so ordinary swipes still scroll the page and the logo strip.
  let logoDrag = null;
  let suppressLibraryClick = false;

  function dropTargetAt(x, y) {
    return document.elementFromPoint(x, y)?.closest("#guidedPositions .guided-position") || null;
  }

  function setDropTarget(card) {
    if (logoDrag.target === card) return;
    logoDrag.target?.classList.remove("is-drop-target");
    logoDrag.target = card;
    card?.classList.add("is-drop-target");
  }

  function moveGhost() {
    logoDrag.ghost.style.transform = `translate(${logoDrag.x}px, ${logoDrag.y}px)`;
  }

  function followLogoDrag() {
    const { x, y } = logoDrag;
    const strip = positionsEl.getBoundingClientRect();
    if (y >= strip.top - 24 && y <= strip.bottom + 24) {
      if (x < strip.left + 40) positionsEl.scrollLeft -= 8;
      else if (x > strip.right - 40) positionsEl.scrollLeft += 8;
    }
    const barTop = document.querySelector(".guided-bar")?.getBoundingClientRect().top || window.innerHeight;
    if (y < 60) window.scrollBy(0, -10);
    else if (y > barTop - 30) window.scrollBy(0, 10);
    setDropTarget(dropTargetAt(x, y));
    logoDrag.frame = requestAnimationFrame(followLogoDrag);
  }

  function startLogoDrag() {
    clearTimeout(logoDrag.timer);
    logoDrag.active = true;
    const ghost = document.createElement("div");
    ghost.className = "guided-drag-ghost";
    const image = document.createElement("img");
    image.src = logoDrag.entry.logo;
    image.alt = "";
    ghost.append(image);
    document.body.append(ghost);
    logoDrag.ghost = ghost;
    document.body.classList.add("guided-logo-dragging");
    moveGhost();
    navigator.vibrate?.(15);
    logoDrag.frame = requestAnimationFrame(followLogoDrag);
  }

  function endLogoDrag(event) {
    const current = logoDrag;
    if (!current || (event && event.pointerId !== current.id)) return;
    logoDrag = null;
    clearTimeout(current.timer);
    if (!current.active) return;
    cancelAnimationFrame(current.frame);
    current.ghost.remove();
    current.target?.classList.remove("is-drop-target");
    document.body.classList.remove("guided-logo-dragging");
    suppressLibraryClick = true;
    setTimeout(() => { suppressLibraryClick = false; }, 0);
    const card = event?.type === "pointerup" ? dropTargetAt(event.clientX, event.clientY) : null;
    if (card) openMethodPopup(card.dataset.position, "reuse", current.entry);
  }

  libraryEl.addEventListener("pointerdown", (event) => {
    const entry = libraryEntries.get(event.target.closest(".guided-library-use"));
    if (!entry || logoDrag || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    logoDrag = {
      id: event.pointerId, entry, mouse: event.pointerType === "mouse", active: false, target: null,
      startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY
    };
    if (!logoDrag.mouse) logoDrag.timer = setTimeout(startLogoDrag, 300);
  });
  window.addEventListener("pointermove", (event) => {
    if (!logoDrag || event.pointerId !== logoDrag.id) return;
    logoDrag.x = event.clientX;
    logoDrag.y = event.clientY;
    if (logoDrag.active) {
      moveGhost();
      return;
    }
    if (Math.hypot(event.clientX - logoDrag.startX, event.clientY - logoDrag.startY) < 8) return;
    if (logoDrag.mouse) startLogoDrag();
    else endLogoDrag();
  });
  window.addEventListener("pointerup", endLogoDrag);
  window.addEventListener("pointercancel", endLogoDrag);
  document.addEventListener("touchmove", (event) => {
    if (logoDrag?.active) event.preventDefault();
  }, { passive: false });
  libraryEl.addEventListener("contextmenu", (event) => {
    if (event.target.closest(".guided-library-use")) event.preventDefault();
  });
  libraryEl.addEventListener("click", (event) => {
    if (!suppressLibraryClick) return;
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
