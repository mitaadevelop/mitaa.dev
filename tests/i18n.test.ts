import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { ASSET_PATH, isLang, localePath, otherLang, parseLocale, switchPath } from "../src/lib/i18n/index.ts";
import { routeFor } from "../src/lib/i18n/route.ts";

describe("localePath", () => {
  test("Dutch has no prefix, English has /en", () => {
    assert.equal(localePath("nl", "/blog"), "/blog");
    assert.equal(localePath("en", "/blog"), "/en/blog");
    assert.equal(localePath("en", "/"), "/en");
    assert.equal(localePath("nl", "/"), "/");
  });

  test("keeps the query and the anchor", () => {
    assert.equal(localePath("en", "/blog/x?a=1#top"), "/en/blog/x?a=1#top");
    assert.equal(localePath("nl", "/en/blog/x#top"), "/blog/x#top");
  });

  test("moves a path that already names a language instead of prefixing it twice", () => {
    assert.equal(localePath("en", "/en/blog"), "/en/blog");
    assert.equal(localePath("en", "/nl/blog"), "/en/blog");
    assert.equal(localePath("nl", "/en"), "/");
  });

  test("leaves other sites, anchors, mail and relative links alone", () => {
    for (const href of ["https://github.com/x", "//cdn.example/x", "#top", "mailto:a@b.c", "relative/path"]) {
      assert.equal(localePath("en", href), href);
    }
  });

  test("never prefixes a file from public/", () => {
    for (const href of ["/downloads/latex/essay.pdf", "/blog/post/cover.png", "/pcb/x/board.kicad_sch", "/icon.svg", "/shop/a/b.jpg?x=1"]) {
      assert.equal(localePath("en", href), href, href);
    }
  });

  test("a dot in a page address is not a file: /projects/mitaa.dev is a page", () => {
    assert.equal(ASSET_PATH.test("/projects/mitaa.dev"), false);
    assert.equal(localePath("en", "/projects/mitaa.dev"), "/en/projects/mitaa.dev");
    assert.equal(localePath("en", "/feed.xml"), "/en/feed.xml");
  });
});

describe("parseLocale and switchPath", () => {
  test("reads the language off the address", () => {
    assert.deepEqual(parseLocale("/en/blog/x"), { lang: "en", path: "/blog/x", suffix: "" });
    assert.deepEqual(parseLocale("/en"), { lang: "en", path: "/", suffix: "" });
    assert.deepEqual(parseLocale("/blog/x?y#z"), { lang: "nl", path: "/blog/x", suffix: "?y#z" });
    assert.deepEqual(parseLocale("/enigma"), { lang: "nl", path: "/enigma", suffix: "" }, "a path that only starts with 'en'");
    assert.deepEqual(parseLocale("/nl/blog"), { lang: "nl", path: "/blog", suffix: "" });
  });

  test("the language button goes to the same page in the other language", () => {
    assert.equal(switchPath("nl", "/blog/x"), "/en/blog/x");
    assert.equal(switchPath("en", "/en/blog/x"), "/blog/x");
    assert.equal(switchPath("nl", "/"), "/en");
    assert.equal(switchPath("en", "/en"), "/");
    assert.equal(switchPath("en", "/en/blog/x?a=1#b"), "/blog/x?a=1#b");
  });

  test("small helpers", () => {
    assert.equal(otherLang("nl"), "en");
    assert.equal(otherLang("en"), "nl");
    assert.equal(isLang("nl") && isLang("en") && !isLang("de") && !isLang(undefined), true);
  });
});

describe("the proxy's routing", () => {
  test("a Dutch page is rewritten to /nl and keeps its address", () => {
    assert.deepEqual(routeFor("/"), { action: "rewrite", to: "/nl" });
    assert.deepEqual(routeFor("/blog"), { action: "rewrite", to: "/nl/blog" });
    assert.deepEqual(routeFor("/blog/hello-world/hoofdstuk"), { action: "rewrite", to: "/nl/blog/hello-world/hoofdstuk" });
    assert.deepEqual(routeFor("/projects/mitaa.dev"), { action: "rewrite", to: "/nl/projects/mitaa.dev" });
    assert.deepEqual(routeFor("/feed.xml"), { action: "rewrite", to: "/nl/feed.xml" });
  });

  test("an English page is left as it is", () => {
    for (const path of ["/en", "/en/blog", "/en/blog/x/y", "/en/feed.xml"]) {
      assert.deepEqual(routeFor(path), { action: "next" }, path);
    }
    assert.deepEqual(routeFor("/enigma"), { action: "rewrite", to: "/nl/enigma" }, "only /en and /en/… are English");
  });

  test("/nl has one address, without the prefix", () => {
    assert.deepEqual(routeFor("/nl"), { action: "redirect", to: "/" });
    assert.deepEqual(routeFor("/nl/blog"), { action: "redirect", to: "/blog" });
  });

  test("files and routes without a language are left alone", () => {
    for (const path of ["/icon.svg", "/favicon.ico", "/apple-icon.png", "/robots.txt", "/sitemap.xml", "/opengraph-image", "/api/download/latex-essay", "/api/github-repos", "/blog/hello-world/cover.png", "/downloads/latex/essay.zip", "/pcb/NAVMATE/PCB/x.kicad_sch", "/data/github-contributions.json"]) {
      assert.deepEqual(routeFor(path), { action: "next" }, path);
    }
  });
});
