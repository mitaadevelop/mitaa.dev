import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { dictionary } from "../src/lib/i18n/dictionary.ts";
import { shopProduct } from "../src/data/shop.ts";
import { latexCheatsheet, latexTemplates, TEMPLATE_LICENSE } from "../src/data/latex-templates.ts";
import { getBio } from "../src/lib/bio.ts";

/** Every path to a leaf of an object: `shop.howToSteps.0.title`. Functions are leaves. */
function leaves(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, inner]) => leaves(inner, prefix ? `${prefix}.${key}` : key));
}

/** Read the value at a dotted path. */
function at(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => (current as Record<string, unknown>)?.[key], value);
}

describe("the dictionary", () => {
  const nl = dictionary("nl");
  const en = dictionary("en");

  test("both languages have exactly the same keys, lists of the same length and functions of the same shape", () => {
    assert.deepEqual(leaves(nl).sort(), leaves(en).sort());
    for (const path of leaves(en)) {
      assert.equal(typeof at(nl, path), typeof at(en, path), `${path}: a function in one language, text in the other`);
    }
  });

  test("no text is empty, and a Dutch text is not just the English one, apart from names", () => {
    const sameAllowed = new Set([
      "locale", // differs anyway
      "language.code", "nav.blog", "home.blog", "blogIndex.title", "common.free",
      "pcb.pcb", "pcb.threeD", "project.demo", "project.demoVideo", "project.context", "project.hardware",
      "shop.zip", "shop.latexKicker", "shop.downloadAside", "project.download", "pcb.layer.all", "site.blogFeedTitle",
    ]);
    for (const path of leaves(nl)) {
      const value = at(nl, path);
      if (typeof value !== "string") continue;
      // A text that is blank on purpose (the unnamed rows of the heatmap) is blank in both languages.
      const blankOnPurpose = at(en, path) === "";
      assert.equal(value.trim().length === 0, blankOnPurpose, `${path} is empty in one language only`);
      if (!blankOnPurpose && !sameAllowed.has(path)) {
        assert.notEqual(value, at(en, path), `${path} is still the English text`);
      }
    }
  });

  test("the functions give sensible text", () => {
    assert.equal(nl.home.updated("28 februari 2026"), "Bijgewerkt op 28 februari 2026");
    assert.equal(en.home.updated("February 28, 2026"), "Updated February 28, 2026");
    assert.equal(nl.activity.dayTitle(1, "1 jan"), "1 bijdrage op 1 jan");
    assert.equal(nl.activity.dayTitle(2, "1 jan"), "2 bijdragen op 1 jan");
    assert.equal(en.shop.downloads(1), "1 download");
    assert.equal(en.shop.downloads(5), "5 downloads");
    assert.equal(nl.language.contentIn(nl.language.names.en), "Deze tekst is geschreven in het Engels.");
    assert.equal(en.language.contentIn(en.language.names.nl), "This text is written in Dutch.");
  });
});

describe("the shop data", () => {
  /** Every `{ nl, en }` pair in a value, with its path. */
  function pairs(value: unknown, path = ""): { path: string; nl: unknown; en: unknown }[] {
    if (value === null || typeof value !== "object") return [];
    const record = value as Record<string, unknown>;
    if ("nl" in record && "en" in record && Object.keys(record).length === 2) return [{ path, nl: record.nl, en: record.en }];
    return Object.entries(record).flatMap(([key, inner]) => pairs(inner, path ? `${path}.${key}` : key));
  }

  test("every text is written in both languages", () => {
    const all = [
      ...pairs(shopProduct, "shopProduct"),
      ...pairs(latexTemplates, "latexTemplates"),
      ...pairs(latexCheatsheet, "latexCheatsheet"),
      ...pairs({ TEMPLATE_LICENSE }, "license"),
    ];
    assert.ok(all.length > 50, "the data has many texts");
    for (const { path, nl, en } of all) {
      if (Array.isArray(nl) || Array.isArray(en)) {
        assert.ok(Array.isArray(nl) && Array.isArray(en), `${path}: a list in one language only`);
        assert.equal((nl as unknown[]).length, (en as unknown[]).length, `${path}: lists of different length`);
        for (const item of [...(nl as string[]), ...(en as string[])]) assert.ok(item.trim(), `${path} has an empty item`);
      } else {
        assert.ok(String(nl).trim() && String(en).trim(), `${path} is empty in a language`);
      }
    }
  });

  test("the English side of the template texts is what goes into the downloads", () => {
    // build-downloads.mts writes the README inside each ZIP from these: it is English only.
    assert.equal(TEMPLATE_LICENSE.en.startsWith("Free to use and adapt"), true);
    assert.deepEqual(latexTemplates.map((template) => template.title.en), ["Essay", "Report", "Research report"]);
  });
});

describe("the bio", () => {
  test("Dutch is the source, and English is a hand-written version that wins when asked for", () => {
    const nl = getBio("nl");
    const en = getBio("en");
    assert.equal(nl.lang, "nl");
    assert.equal(en.lang, "en");
    assert.ok(nl.paragraphs.length >= 3 && en.paragraphs.length >= 3);
    assert.notEqual(nl.paragraphs[0], en.paragraphs[0]);
    assert.match(nl.paragraphs[0], /elektrotechnisch/);
    assert.match(en.paragraphs[0], /electrical engineer/);
  });

  test("the date is a calendar date a page can format", () => {
    assert.equal(getBio("nl").updated, "2026-02-28");
    assert.equal(getBio("en").updated, "2026-02-28");
  });
});
