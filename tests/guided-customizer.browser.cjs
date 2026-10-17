const assert = require("node:assert/strict");
const { chromium, devices } = require("playwright");

const base = process.env.CUSTOMIZER_TEST_URL || "http://127.0.0.1:5510";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 } });
  const errors = [];
  let beforeUnloadPrompts = 0;
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "beforeunload") beforeUnloadPrompts += 1;
    await dialog.accept();
  });
  const customizerUrl = `${base}/customization-tool-mobile/index.html?code=PR154&from=customize-mobile&itemId=guided-test-target`;
  const waitForSaved = (positions) => page.waitForFunction((expected) => {
    const line = JSON.parse(localStorage.getItem("quoteBasket") || "[]")[1] || {};
    return JSON.stringify((line.logos || []).map((logo) => logo.position).sort()) === JSON.stringify(expected);
  }, [...positions].sort());
  await context.route(/google|doubleclick|facebook/, (route) => route.abort());
  // Destination pages are stubbed: basket.html normalises/merges lines on load,
  // and these checks only cover what the customizer saved before navigating.
  await context.route(/\/basket\.html(\?.*)?$/, (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Basket stub</title>" }));
  await context.route(/\/mobile\/shop-mobile\.html(\?.*)?$/, (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Shop stub</title>" }));
  await context.addInitScript(() => {
    if (location.hostname !== "127.0.0.1" || localStorage.getItem("guidedTestSeed")) return;
    const item = {
      id: "guided-test-target", productCode: "PR154",
      productName: "Colours bib apron with pocket", productType: "Aprons",
      color: "Brown", colorHex: "#5c4033",
      colorImage: "https://cdn.pimber.ly/public/asset/raw/571f95845f13380f0056d06a/7dac6704/5c5c3e3deb9f5b1c75ce6168a289eea1.jpg",
      quantities: { "One size": 5 }, totalQty: 5, unitPrice: 8.51, basePrice: 8.51, logos: []
    };
    localStorage.setItem("quoteBasket", JSON.stringify([
      { ...item, id: "guided-test-other", quantities: { "One size": 11 }, totalQty: 11 }, item
    ]));
    localStorage.setItem("guidedTestSeed", "1");
    localStorage.setItem("brandedukCookieConsent", JSON.stringify({ timestamp: Date.now(), analytics: false, advertising: false }));
    sessionStorage.setItem("customizingBasketIndex", "0");
    sessionStorage.setItem("returnAfterCustomize", "basket");
  });
  try {
    await page.goto(customizerUrl);
    await page.waitForFunction(() => typeof state !== "undefined" && state.guidedReady && document.querySelectorAll(".guided-position").length === 5);
    await page.locator("#customizerLoadingOverlay.is-hidden").waitFor({ state: "attached" });
    if (await page.locator('[data-cc="reject"]').isVisible()) await page.locator('[data-cc="reject"]').click();
    const initial = await page.evaluate(() => ({ qty: state.totalQty, color: state.colourName, sizes: state.sizes }));
    assert.equal(initial.qty, 5);
    assert.equal(initial.color, "Brown");
    assert.deepEqual(initial.sizes, [{ size: "One size", qty: 5 }]);
    const layout = await page.evaluate(() => {
      const box = (selector) => document.querySelector(selector).getBoundingClientRect();
      const bar = document.querySelector(".guided-bar");
      return {
        barFixed: getComputedStyle(bar).position === "fixed",
        barBottom: Math.round(box(".guided-bar").bottom), viewport: innerHeight,
        addProduct: box("#guidedAddProduct").toJSON(), basket: box("#guidedGoToBasket").toJSON(),
        inspectorHidden: getComputedStyle(document.querySelector(".desktop-inspector")).display === "none",
        labels: [document.querySelector("#guidedAddProduct").textContent, document.querySelector("#guidedGoToBasket").textContent],
        colours: [getComputedStyle(document.querySelector("#guidedAddProduct")).backgroundColor, getComputedStyle(document.querySelector("#guidedGoToBasket")).backgroundColor],
        removed: document.querySelectorAll("#confirmQualityBtn, #guidedPrevious, #guidedNext, .guided-dots, .guided-carousel-nav").length
      };
    });
    assert.equal(layout.barFixed, true);
    assert.equal(layout.barBottom, layout.viewport);
    assert.equal(Math.round(layout.addProduct.top), Math.round(layout.basket.top), "Buttons must sit side by side");
    assert.ok(layout.addProduct.right <= layout.basket.left, "Add product must be left of View basket");
    assert.equal(layout.inspectorHidden, true);
    assert.deepEqual(layout.labels, ["+ ADD PRODUCT", "VIEW BASKET \u2192"]);
    assert.deepEqual(layout.colours, ["rgb(39, 52, 105)", "rgb(255, 113, 0)"]);
    assert.equal(layout.removed, 0);

    await page.locator('[aria-label="Add logo on Left Chest"]').click();
    await page.locator("#guidedMethodDialog[open]").waitFor();
    assert.equal(await page.evaluate(() => state.uploadedLogo), null);
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator("#guidedChooseEmbroidery").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test-artwork.svg", mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#185bcd"/><text x="15" y="48" fill="white" font-size="24">TEST</text></svg>')
    });
    await page.locator("#copyrightPage.active-screen").waitFor();
    await page.locator(".copyright-check").click();
    await page.locator("#copyrightOkBtn").click();
    await page.waitForFunction(() => document.querySelector(".guided-position.has-logo"));
    assert.equal(await page.evaluate(() => state.decorationType), "embroidery");
    await page.locator('[aria-label="Add logo on Right Chest"]').click();
    await page.waitForFunction(() => state.selectedPosition === "right-chest");
    await page.locator("#guidedMethodDialog[open]").waitFor();
    await page.locator("#guidedChoosePrint").click();
    await page.locator("#guidedArtworkChoices").waitFor({ state: "visible" });
    await page.locator("#guidedPopupLibrary button").first().click();
    await page.waitForFunction(() => Boolean(state.uploadedLogo));
    await page.locator("#guidedNotes").fill("Keep the artwork centred.");
    await waitForSaved(["left-chest", "right-chest"]);
    await page.waitForFunction(() => JSON.parse(localStorage.quoteBasket)[1].customizationNotes === "Keep the artwork centred.");
    const draft = await page.evaluate(() => Object.fromEntries(Object.entries(getDraftAreaDesigns()).map(([key, value]) => [key, value.method])));
    assert.deepEqual(draft, { "left-chest": "embroidery", "right-chest": "print" });
    assert.equal(await page.locator(".guided-methods, #guidedEmbroidery, #guidedPrint").count(), 0);
    const saved = await page.evaluate(() => JSON.parse(localStorage.quoteBasket));
    assert.equal(saved.length, 2);
    assert.equal(saved[0].logos.length, 0);
    assert.equal(saved[0].totalQty, 11);
    assert.equal(saved[1].id, "guided-test-target");
    assert.equal(saved[1].color, "Brown");
    assert.equal(saved[1].totalQty, 5);
    assert.deepEqual(saved[1].quantities, { "One size": 5 });
    assert.deepEqual(Object.fromEntries(saved[1].logos.map((logo) => [logo.position, logo.method])), { "left-chest": "embroidery", "right-chest": "print" });

    await page.locator('[aria-label="Change technique on Right Chest"]').click();
    await page.locator("#guidedMethodDialog[open]").waitFor();
    assert.equal(await page.locator("#guidedChoosePrint").getAttribute("aria-pressed"), "true");
    await page.locator("#guidedChooseEmbroidery").click();
    await page.waitForFunction(() => getDraftAreaDesigns()["right-chest"]?.method === "embroidery");
    assert.equal(await page.evaluate(() => getDraftAreaDesigns()["left-chest"].method), "embroidery");
    await page.waitForFunction(() => JSON.parse(localStorage.quoteBasket)[1].logos.find((logo) => logo.position === "right-chest")?.method === "embroidery");

    await page.locator('[aria-label="Add logo on Centre Chest"]').click();
    await page.locator("#guidedMethodDialog[open]").waitFor();
    await page.locator("#guidedMethodClose").click();
    assert.deepEqual(await page.evaluate(() => Object.keys(getDraftAreaDesigns()).sort()), ["left-chest", "right-chest"]);
    await page.waitForTimeout(600);
    await waitForSaved(["left-chest", "right-chest"]);

    await page.locator('[aria-label="Select Lower Front"]').click();
    await page.waitForFunction(() => state.selectedPosition === "lower-front");
    await page.locator(".guided-library-use").first().click();
    await page.locator("#guidedMethodDialog[open]").waitFor();
    assert.match(await page.locator("#guidedMethodPosition").textContent(), /Lower Front/);
    await page.locator("#guidedChoosePrint").click();
    await page.waitForFunction(() => getDraftAreaDesigns()["lower-front"]?.method === "print");
    await waitForSaved(["left-chest", "lower-front", "right-chest"]);
    await page.locator('[aria-label="Remove logo from Lower Front"]').click();
    await waitForSaved(["left-chest", "right-chest"]);

    await page.locator('[aria-label="Remove logo from Left Chest"]').click();
    await waitForSaved(["right-chest"]);
    // Reload inside the autosave delay: the page must flush on unload, without a prompt.
    await page.locator("#guidedNotes").fill("Autosaved notes survive refresh.");
    await page.reload();
    await page.waitForFunction(() => typeof state !== "undefined" && state.guidedReady && document.querySelector("#guidedNotes").value === "Autosaved notes survive refresh.");
    await page.locator("#customizerLoadingOverlay.is-hidden").waitFor({ state: "attached" });
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.quoteBasket)[1].customizationNotes), "Autosaved notes survive refresh.");
    assert.equal(await page.locator(".guided-position.has-logo").count(), 1);
    assert.equal(await page.locator("#guidedStepQuantity").textContent(), "5 items");

    for (const width of [320, 360, 390, 430, 768]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => ({
        viewport: innerWidth, page: document.documentElement.scrollWidth,
        cards: [...document.querySelectorAll(".guided-position")].map((card) => card.getBoundingClientRect().width),
        buttons: [...document.querySelectorAll(".guided-nav-btn")].map((button) => button.getBoundingClientRect().height)
      }));
      assert.ok(dimensions.page <= dimensions.viewport, `Horizontal overflow at ${width}px`);
      assert.ok(dimensions.cards.every((value) => value >= 75), `Unreadable cards at ${width}px`);
      assert.ok(dimensions.buttons.every((value) => value <= 50), `Bar buttons wrap at ${width}px`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    if (process.env.CUSTOMIZER_SCREENSHOT) await page.screenshot({ path: process.env.CUSTOMIZER_SCREENSHOT, fullPage: true });

    await page.locator('[aria-label="Remove logo from Right Chest"]').click();
    await waitForSaved([]);
    await page.reload();
    await page.waitForFunction(() => typeof state !== "undefined" && state.guidedReady);
    assert.equal(await page.locator(".guided-position.has-logo").count(), 0);

    await page.locator('[aria-label="Add logo on Large Front"]').click();
    await page.locator("#guidedMethodDialog[open]").waitFor();
    assert.equal(await page.locator("#guidedChooseEmbroidery").isDisabled(), true);
    await page.locator("#guidedMethodClose").click();
    await page.locator('[aria-label="Select Lower Front"]').click();
    await page.locator('[aria-label="Add logo on Lower Front"]').click();
    await page.locator("#guidedMethodDialog[open]").waitFor();
    await page.locator("#guidedChooseEmbroidery").click();
    assert.match(await page.locator("#guidedMethodNotice").textContent(), /personalised quote/);
    await page.locator("#guidedMethodClose").click();

    const desktop = await context.newPage();
    desktop.on("pageerror", (error) => errors.push(error.message));
    await desktop.setViewportSize({ width: 1280, height: 900 });
    await desktop.goto(`${base}/customization-tool/index.html?code=PR154&from=customize-pc`);
    await desktop.waitForFunction(() => typeof getAllowedMethodsForPositionKey === "function" && typeof state !== "undefined");
    const desktopState = await desktop.evaluate(() => ({
      guided: document.body.classList.contains("guided-customizer"),
      pc: document.body.classList.contains("is-pc-order-embed"),
      largeFrontEmbroidery: getAllowedMethodsForPositionKey("large-front").embroidery,
      maxPositions: MAX_CUSTOMISATIONS_PER_PRODUCT
    }));
    assert.deepEqual(desktopState, { guided: false, pc: true, largeFrontEmbroidery: "no", maxPositions: 5 });
    await desktop.close();
    assert.deepEqual(errors, []);

    // One tap saves the latest change immediately (before the autosave delay)
    // and goes straight to the basket; no confirm step or popup in between.
    await page.locator('[aria-label="Select Left Chest"]').click();
    await page.waitForFunction(() => state.selectedPosition === "left-chest");
    await page.locator(".guided-library-use").first().click();
    await page.locator("#guidedMethodDialog[open]").waitFor();
    await page.locator("#guidedChoosePrint").click();
    await page.waitForFunction(() => getDraftAreaDesigns()["left-chest"]?.method === "print");
    await Promise.all([page.waitForURL(/\/basket\.html$/), page.locator("#guidedGoToBasket").click()]);
    const basketLine = await page.evaluate(() => JSON.parse(localStorage.quoteBasket).find((item) => item.id === "guided-test-target"));
    assert.deepEqual(basketLine.logos.map((logo) => [logo.position, logo.method]), [["left-chest", "print"]]);
    assert.equal(basketLine.totalQty, 5);

    await page.goto(customizerUrl);
    await page.waitForFunction(() => typeof state !== "undefined" && state.guidedReady);
    await Promise.all([page.waitForURL(/\/mobile\/shop-mobile\.html/), page.locator("#guidedAddProduct").click()]);

    // Uploaded logos stay available when customising another product.
    await page.goto(customizerUrl.replace("guided-test-target", "guided-test-other"));
    await page.waitForFunction(() => typeof state !== "undefined" && state.guidedReady && document.querySelectorAll(".guided-position").length === 5);
    assert.ok(await page.locator(".guided-library-use").count() >= 1, "Library must offer previously uploaded logos");
    assert.equal(await page.locator(".guided-position.has-logo").count(), 0);
    assert.equal(beforeUnloadPrompts, 0);
    console.log("PASS: API positions, selected colour/quantity, plus > technique popup > upload/reuse, per-position methods, autosave to the same basket line, flush on refresh, fixed bottom bar with one-tap Add product / View basket, logo library across products, POA/unavailable methods, 320-768px layouts and desktop smoke test.");
  } catch (error) {
    console.error("Browser diagnostics:", await page.evaluate(() => ({
      url: location.href, title: document.title,
      ready: typeof state !== "undefined" ? state.guidedReady : false,
      positions: document.querySelectorAll(".guided-position").length,
      message: document.querySelector("#guidedMessage")?.textContent
    })), errors);
    if (process.env.CUSTOMIZER_SCREENSHOT) await page.screenshot({ path: process.env.CUSTOMIZER_SCREENSHOT, fullPage: true });
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
