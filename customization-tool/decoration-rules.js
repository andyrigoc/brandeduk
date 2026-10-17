(function (root) {
  "use strict";

  const rank = { yes: 0, poa: 1, no: 2 };
  const worst = (first, second) => rank[second] > rank[first] ? second : first;
  const best = (first, second) => rank[second] < rank[first] ? second : first;
  const categories = {
    tshirts: { dtf: "yes", screen: "yes", embroidery: "poa" },
    polos: { dtf: "yes", screen: "yes", embroidery: "yes" },
    sweatshirts: { dtf: "yes", screen: "yes", embroidery: "yes" },
    hoodies: { dtf: "yes", screen: "yes", embroidery: "yes" },
    shirts: { dtf: "yes", screen: "poa", embroidery: "yes" },
    fleece: { dtf: "poa", screen: "no", embroidery: "yes" },
    jackets: { dtf: "poa", screen: "no", embroidery: "yes" },
    "gilets-body-warmers": { dtf: "poa", screen: "no", embroidery: "yes" },
    "safety-vests": { dtf: "yes", screen: "yes", embroidery: "poa" },
    trousers: { dtf: "poa", screen: "no", embroidery: "yes" },
    shorts: { dtf: "poa", screen: "no", embroidery: "yes" },
    sweatpants: { dtf: "poa", screen: "no", embroidery: "poa" },
    aprons: { dtf: "yes", screen: "yes", embroidery: "yes" },
    bags: { dtf: "yes", screen: "yes", embroidery: "yes" },
    caps: { dtf: "poa", screen: "no", embroidery: "yes" },
    hats: { dtf: "poa", screen: "no", embroidery: "yes" },
    beanies: { dtf: "no", screen: "no", embroidery: "yes" }
  };
  const nameOverrides = [
    { pattern: /premium|heavy|ultra|ring ?spun/i, rules: { embroidery: "yes" } },
    { pattern: /performance|technical|polyester|breathable|active|training/i, rules: { screen: "poa" } },
    { pattern: /oxford|formal|dress shirt|blouse/i, rules: { dtf: "poa", screen: "no" } },
    { pattern: /\bknit|jumper|cardigan/i, rules: { dtf: "poa", screen: "no", embroidery: "yes" } },
    { pattern: /\bwool\b/i, rules: { dtf: "no", screen: "no", embroidery: "poa" } },
    { pattern: /softshell|windbreaker|wind ?shirt|bomber/i, rules: { dtf: "yes" } },
    { pattern: /waterproof|padded|puffer|parka|quilted|insulated|down\b/i, rules: { dtf: "poa", screen: "no" } },
    { pattern: /laptop|messenger|cooler|tool bag|holdall|kit bag/i, rules: { dtf: "poa", screen: "no" } },
    { pattern: /umbrella/i, rules: { dtf: "poa", screen: "yes", embroidery: "no" } },
    { pattern: /towel|blanket|robe|gown/i, rules: { dtf: "poa", screen: "no", embroidery: "yes" } },
    { pattern: /legging/i, rules: { dtf: "poa", screen: "no", embroidery: "no" } },
    { pattern: /baby|bodysuit/i, rules: { embroidery: "no" } },
    { pattern: /basketball|football shirt|sports vest/i, rules: { embroidery: "poa" } },
    { pattern: /glove/i, rules: { dtf: "no", screen: "no", embroidery: "poa" } },
    { pattern: /helmet|hard hat/i, rules: { dtf: "poa", screen: "no", embroidery: "no" } },
    { pattern: /balaclava/i, rules: { dtf: "no", screen: "no", embroidery: "poa" } },
    { pattern: /\bsocks?\b/i, rules: { dtf: "poa", screen: "no", embroidery: "poa" } }
  ];
  const positions = {
    "large-front": { embroidery: "no" },
    "large-front-above-pocket": { embroidery: "poa" },
    "large-back": { embroidery: "no" },
    "lower-front": { embroidery: "poa" },
    "lower-back": { embroidery: "poa" },
    "left-leg": { embroidery: "poa" },
    "right-leg": { embroidery: "poa" }
  };
  const conflicts = Object.freeze({
    "left-chest": { conflictsWith: ["centre-chest", "large-front"] },
    "right-chest": { conflictsWith: ["centre-chest", "large-front"] },
    "centre-chest": { conflictsWith: ["left-chest", "right-chest", "large-front"] },
    "large-front": { conflictsWith: ["left-chest", "right-chest", "centre-chest"] },
    "lower-front": { conflictsWith: [] },
    "large-back": { conflictsWith: ["centre-back"] }
  });

  function categoryRules(slug, name) {
    const rules = { ...(categories[slug] || { dtf: "yes", screen: "yes", embroidery: "yes" }) };
    nameOverrides.forEach(({ pattern, rules: overrides }) => {
      if (pattern.test(String(name || ""))) Object.assign(rules, overrides);
    });
    return rules;
  }

  function allowedMethods(slug, name, position) {
    const category = categoryRules(slug, name);
    const rule = positions[position] || {};
    return {
      embroidery: worst(category.embroidery, rule.embroidery || "yes"),
      print: worst(best(category.dtf, category.screen), rule.print || "yes")
    };
  }

  root.BrandedDecorationRules = Object.freeze({
    maxPositions: 5, conflicts, positions, worst, best, categoryRules, allowedMethods
  });
})(typeof window === "undefined" ? globalThis : window);
