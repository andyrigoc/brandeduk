const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

require("../customization-tool/decoration-rules.js");
const rules = globalThis.BrandedDecorationRules;
const source = readFileSync(path.join(__dirname, "../customization-tool-mobile/app.js"), "utf8");

function loadFunction(name, context) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} must exist`);
  const end = source.indexOf("\n}", start) + 2;
  vm.runInNewContext(`${source.slice(start, end)}; this.fn = ${name};`, context);
  return context.fn;
}

test("shared PC/mobile rules keep unavailable and POA methods distinct", () => {
  assert.deepEqual(rules.allowedMethods("aprons", "Bib apron", "left-chest"), { embroidery: "yes", print: "yes" });
  assert.equal(rules.allowedMethods("aprons", "Bib apron", "large-front").embroidery, "no");
  assert.equal(rules.allowedMethods("aprons", "Bib apron", "lower-front").embroidery, "poa");
  assert.equal(rules.allowedMethods("beanies", "Classic beanie", "centre-front").print, "no");
  assert.equal(rules.allowedMethods("tshirts", "Basic tee", "left-chest").embroidery, "poa");
  assert.equal(rules.allowedMethods("tshirts", "Heavy cotton tee", "left-chest").embroidery, "yes");
  assert.equal(rules.maxPositions, 5);
  assert.ok(rules.conflicts["centre-chest"].conflictsWith.includes("left-chest"));
});

function saveHarness(basket, id = "target") {
  const context = {
    state: { totalQty: 5, basketItemId: id },
    window: { location: { search: "?from=customize-mobile" } },
    URLSearchParams,
    sessionStorage: { getItem: (key) => key === "customizingBasketIndex" ? "0" : "basket" },
    collectSizes() {},
    calculatePrice() {},
    readQuoteBasket: () => basket,
    compactBasketItemForStorage: (item) => item,
    buildBasketItemFromState: () => ({
      id: "new-id", productCode: "PR154", color: "Wrong colour", colorHex: "#ffffff",
      image: "/uploads/customization/mockup.png", colorImage: "/uploads/customization/mockup.png",
      quantities: { Medium: 1 }, totalQty: 1, unitPrice: 999,
      logos: [], texts: [], customizationNotes: "Updated notes"
    }),
    isNeutralToolMockupImage: () => true,
    dedupeLogos: (logos) => logos,
    normalizeHex: (value) => value,
    repriceBasketProductCode() {},
    writeQuoteBasket: (items) => { context.saved = items; return true; },
    updateBasketUIFromStorage() {}
  };
  return { context, save: loadFunction("upsertBasketItemFromState", context) };
}

const item = (id, quantity) => ({
  id, productCode: "PR154", color: "Brown", colorHex: "#5c4033",
  image: "brown.jpg", colorImage: "brown.jpg",
  quantities: { "One size": quantity }, totalQty: quantity, unitPrice: 8.51,
  logos: [{ position: "left-chest", logo: "old-artwork" }],
  positions: [{ position: "left-chest", logo: "stale-artwork" }],
  positionDesigns: { "left-chest": { logo: "stale-artwork" } }
});

test("saving locks to the item ID even with a stale index and identical SKU/colour", () => {
  const basket = [item("other", 11), item("target", 5)];
  const untouched = structuredClone(basket[0]);
  const { save, context } = saveHarness(basket);
  assert.equal(save().saved, true);
  assert.equal(context.saved.length, 2);
  assert.deepEqual(context.saved[0], untouched);
  const saved = context.saved[1];
  assert.equal(saved.id, "target");
  assert.equal(saved.color, "Brown");
  assert.equal(saved.colorHex, "#5c4033");
  assert.equal(saved.image, "brown.jpg");
  assert.equal(saved.colorImage, "brown.jpg");
  assert.deepEqual(saved.quantities, { "One size": 5 });
  assert.equal(saved.totalQty, 5);
  assert.equal(saved.unitPrice, 8.51);
  assert.equal(saved.customizationNotes, "Updated notes");
});

test("removing the final logo also clears stale legacy copies", () => {
  const { save, context } = saveHarness([item("target", 5)]);
  save();
  assert.equal(context.saved[0].logos.length, 0);
  assert.equal(context.saved[0].positions.length, 0);
  assert.equal(Object.keys(context.saved[0].positionDesigns).length, 0);
});

test("a deleted target never falls back to another line or adds a duplicate", () => {
  const basket = [item("other", 11)];
  const { save, context } = saveHarness(basket);
  assert.throws(save, /no longer in your basket/);
  assert.equal(context.saved, undefined);
  assert.equal(basket.length, 1);
  assert.equal(basket[0].id, "other");
});

test("inactive positions are excluded and API ordering is respected", () => {
  const positions = [
    { slug: "right-chest", imageUrl: "right.png", sortOrder: 2 },
    { slug: "hidden", imageUrl: "hidden.png", isActive: false, sortOrder: 0 },
    { slug: "left-chest", imageUrl: "left.png", sortOrder: 1 }
  ];
  const getPositions = loadFunction("getConfiguredViewPositions", {
    state: { customizationConfig: { positions } },
    normalizeProductTypeSlug: (value) => value
  });
  assert.deepEqual(Array.from(getPositions(), (entry) => entry.slug), ["left-chest", "right-chest"]);
});
