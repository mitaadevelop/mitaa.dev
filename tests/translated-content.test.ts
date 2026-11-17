import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { getAllPosts, getAllSlugs, getChapterOutline, getPostChapter, postKey } from "../src/lib/blog/index.ts";
import { splitKey } from "../src/lib/blog/source.ts";

/** The English fixture `tests/fixtures/translations/blog/` holds a Dutch translation of. */
const SHOWCASE = "latex-features-showcase";

describe("a machine-translated post", () => {
  test("keys: the slug is the original, slug@lang is the translation", () => {
    assert.deepEqual(splitKey("a-post"), { slug: "a-post" });
    assert.deepEqual(splitKey("a-post@en"), { slug: "a-post", lang: "en" });
    assert.deepEqual(splitKey("a@b@nl"), { slug: "a@b", lang: "nl" });
    assert.deepEqual(splitKey("mail@example"), { slug: "mail@example" });
  });

  test("the key follows the language asked for, and only when there is a translation", () => {
    assert.equal(postKey(SHOWCASE, "en"), SHOWCASE, "the post is written in English");
    assert.equal(postKey(SHOWCASE, "nl"), `${SHOWCASE}@nl`);
    assert.equal(postKey("report-features-reference", "nl"), "report-features-reference", "no translation of that one");
    assert.equal(postKey("no-such-post", "nl"), "no-such-post");
  });

  test("the translation is a post of its own, but at the same public address", async () => {
    const data = await getPostChapter(`${SHOWCASE}@nl`);
    assert.ok(data);
    assert.equal(data.post.slug, SHOWCASE);
    assert.equal(data.post.lang, "nl");
    assert.equal(data.post.title, "LaTeX-functies in het kort");
    assert.equal(data.post.translatedFrom, "en");
    assert.equal(data.chapter.href, `/blog/${SHOWCASE}`);
  });

  test("the original knows nothing of it", async () => {
    const data = await getPostChapter(SHOWCASE);
    assert.equal(data?.post.lang, "en");
    assert.equal(data?.post.translatedFrom, undefined);
    assert.equal(data?.post.title, "LaTeX Features Showcase");
  });

  test("the list of a language shows the translation in place of the original", () => {
    const dutch = getAllPosts("nl").find((post) => post.slug === SHOWCASE);
    const english = getAllPosts("en").find((post) => post.slug === SHOWCASE);
    assert.equal(dutch?.title, "LaTeX-functies in het kort");
    assert.equal(english?.title, "LaTeX Features Showcase");
    assert.equal(getAllPosts("nl").length, getAllSlugs().length, "one entry per post, not two");
    assert.equal(getAllPosts().find((post) => post.slug === SHOWCASE)?.title, "LaTeX Features Showcase", "no language: the originals");
  });

  test("a translation with the same structure keeps the chapter addresses", () => {
    assert.deepEqual(
      getChapterOutline(`${SHOWCASE}@nl`).map((chapter) => chapter.href),
      getChapterOutline(SHOWCASE).map((chapter) => chapter.href)
    );
  });

  test("a translation that declares another language than it was made for is not used", async () => {
    // latex-features-showcase.nl.tex declares \lang{nl}; asking for it as English finds nothing.
    assert.equal(await getPostChapter(`${SHOWCASE}@en`), null);
  });
});
