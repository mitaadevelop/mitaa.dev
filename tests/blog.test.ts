import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  getAllPosts,
  getAllSlugs,
  getChapterOutline,
  getPostChapter,
  getPostShell,
} from "../src/lib/blog/index.ts";
import { parseLatex, splitLatexChapters, SUPPORTED } from "../src/lib/blog/latex.ts";
import { findUntranslated } from "../src/lib/blog/render.ts";
import { matchSnapshot } from "./snapshot.ts";

const REPORT = "report-features-reference";
const MATH = "katex-math-reference";
const SHOWCASE = "latex-features-showcase";
const DESIGN = "report-design-showcase";

async function chapterOf(slug: string, chapterSlug?: string) {
  const data = await getPostChapter(slug, chapterSlug);
  assert.ok(data, `no data for ${slug}${chapterSlug ? `/${chapterSlug}` : ""}`);
  return data;
}

const html = async (slug: string, chapterSlug?: string) =>
  (await chapterOf(slug, chapterSlug)).chapter.contentHtml;

/* ------------------------------------------------------------------ */
/* Snapshots — the broad net                                           */
/* ------------------------------------------------------------------ */

describe("rendered output", () => {
  const cases: [string, string | undefined][] = [
    [SHOWCASE, undefined],
    [REPORT, undefined],
    [REPORT, "tables-figures-and-cross-references"],
    [REPORT, "a-worked-example"],
    [MATH, undefined],
    [MATH, "matrices-and-arrays"],
    [MATH, "edge-cases-and-pitfalls"],
    [DESIGN, undefined],
    [DESIGN, "methode"],
    [DESIGN, "resultaten"],
    [DESIGN, "discussie"],
    [DESIGN, "bijlagen"],
  ];

  for (const [slug, chapterSlug] of cases) {
    const name = chapterSlug ? `${slug}--${chapterSlug}` : slug;
    test(name, async () => matchSnapshot(name, await html(slug, chapterSlug)));
  }
});

/* ------------------------------------------------------------------ */
/* Regressions — each of these has actually been broken once           */
/* ------------------------------------------------------------------ */

describe("footnotes", () => {
  test("the screen-reader heading keeps its id and stays out of the table of contents", async () => {
    const data = await chapterOf(REPORT, "footnotes-and-the-rest");
    assert.match(data.chapter.contentHtml, /<h2 id="footnote-label"/);
    assert.ok(
      !data.chapter.toc.some((item) => item.id === "footnote-label"),
      "footnote-label must not appear in the TOC"
    );
  });

  test("a footnote reference links to its definition and back", async () => {
    const body = await html(REPORT, "footnotes-and-the-rest");
    assert.match(body, /<a id="fnref-1" href="#fn-1"/);
    assert.match(body, /<li id="fn-1"/);
    assert.match(body, /href="#fnref-1"/);
  });
});

describe("citations", () => {
  test("numbers follow the order of the \\bibitems, as thebibliography numbers them", async () => {
    const body = await html(REPORT, "citations-and-the-bibliography");
    assert.match(body, /href="#ref-shannon1948">1</);
    assert.match(body, /href="#ref-nyquist1928">2</);
    assert.match(body, /href="#ref-oppenheim1999">3</);
  });

  test("several keys share one bracket, and an optional argument is a note", async () => {
    const body = await html(REPORT, "citations-and-the-bibliography");
    assert.match(body, /class="citation">\[<a href="#ref-shannon1948">1<\/a>, <a href="#ref-nyquist1928">2<\/a>\]/);
    const discussion = await html(DESIGN, "discussie");
    assert.match(discussion, /class="citation">\[<a href="#ref-vermeer23">4<\/a>, p\.\u00A0212\]/);
  });

  test("a bibliography entry keeps its text", async () => {
    // unified-latex parses \bibitem like \item, so the text is an argument, not a sibling.
    const body = await html(REPORT, "a-worked-example");
    assert.match(body, /id="ref-shannon1948"><span class="ref-number">\[1\]<\/span> <span class="ref-entry">C\. E\. Shannon, <em[^>]*>A Mathematical Theory/);
  });

  test("the bibliography is printed once, complete, where thebibliography stands", async () => {
    const outline = getChapterOutline(REPORT);
    const lists: string[] = [];
    for (const chapter of outline) {
      const body = await html(REPORT, chapter.index === 1 ? undefined : chapter.slug);
      if (body.includes('class="references"')) lists.push(chapter.slug);
    }
    // The listing in the citations chapter shows a thebibliography as code; it
    // must not print a list there.
    assert.deepEqual(lists, ["a-worked-example"]);
    const last = await html(REPORT, "a-worked-example");
    const numbers = [...last.matchAll(/<span class="ref-number">\[(\d+)\]/g)].map((m) => m[1]);
    assert.deepEqual(numbers, ["1", "2", "3"]);
  });

  test("the bibliography heading is unnumbered and in the post's language", async () => {
    const body = await html(DESIGN, "bijlagen");
    assert.match(body, /<h2 class="starred references-title" id="bibliografie">Bibliografie<\/h2>/);
  });
});

describe("figures and tables", () => {
  test("a labelled figure keeps its label as id and its width", async () => {
    const body = await html(REPORT, "tables-figures-and-cross-references");
    assert.match(body, /<figure id="fig-setup"/);
    assert.match(body, /max-width:45%/);
  });

  test("tabular gets a header row rather than the blank rows \\hline leaves behind", async () => {
    const body = await html(REPORT, "tables-figures-and-cross-references");
    assert.match(body, /<thead>/);
    assert.ok(!/<tr><\/tr>/.test(body), "blank \\hline rows must be dropped");
  });

  test("captions survive as figcaptions", async () => {
    const body = await html(REPORT, "a-worked-example");
    assert.match(body, /<span class="tbl-number">Table 2:<\/span> Filter bill of materials/);
  });

  test("a caption written before the content is printed above it, as in LaTeX", async () => {
    const methods = await html(DESIGN, "methode");
    assert.match(methods, /<figure id="tab:opzet" class="blog-table"><figcaption>/);
    const results = await html(DESIGN, "resultaten");
    assert.match(results, /<figure id="fig:spreiding" class="blog-figure"><div class="barchart">/);
  });

  test("booktabs rules are consumed, not leaked", async () => {
    const body = await html(DESIGN, "resultaten");
    assert.ok(!/toprule|midrule|bottomrule/.test(body));
    assert.match(body, /<th style="text-align: right"> Met <\/th>/);
  });
});

describe("barchart", () => {
  test("bars are scaled to the largest value, and the numbers are a table away", async () => {
    const body = await html(DESIGN, "resultaten");
    const bars = [...body.matchAll(/class="barchart-bar barchart-s(\d)" style="height:([\d.]+)%"/g)];
    assert.equal(bars.length, 10);
    assert.ok(bars.some((m) => m[2] === "100.00"), "the largest bar fills the plot");
    assert.match(body, /<details class="barchart-data"><summary>Toon als tabel<\/summary><table><caption>/);
    assert.match(body, /<th scope="row">Dashboard<\/th><td>229<\/td><td>494<\/td>/);
  });
});

describe("cross-references", () => {
  test("resolve to a number and an anchor", async () => {
    const body = await html(REPORT, "tables-figures-and-cross-references");
    assert.match(body, /class="xref" href="#fig-setup">Figure&nbsp;1</);
    assert.match(body, /class="xref" href="[^"]*#thm-sampling">Theorem&nbsp;2</);
  });

  test("print what LaTeX prints: \\ref the number, \\Cref the word too, \\eqref parentheses", async () => {
    const body = await html(REPORT, "tables-figures-and-cross-references");
    assert.match(body, /Table~?\u00A0?<a class="xref" href="#tbl-folding">1<\/a>/);
    const math = await html(MATH, "numbering-and-cross-references");
    assert.match(math, /class="xref" href="#eq:divider">\(1\)</);
    assert.match(math, /class="xref" href="#eq:divider">Equation&nbsp;\(1\)</);
  });

  test("a \\label after a heading points at that section, in the post's language", async () => {
    const body = await html(DESIGN, "resultaten");
    assert.match(body, /Figuur\u00A0<a class="xref" href="#fig:spreiding">1<\/a>/);
    assert.match(body, /Tabel\u00A0<a class="xref" href="#tab:kerncijfers">2<\/a>/);
  });

  test("a forward reference points at the chapter that defines it", async () => {
    const body = await html(REPORT, "tables-figures-and-cross-references");
    assert.match(body, /href="\/blog\/report-features-reference\/a-worked-example#tbl-bom">Table&nbsp;2</);
  });

  test("an unresolvable key is visible rather than silent", async () => {
    const body = await html(REPORT, "tables-figures-and-cross-references");
    assert.match(body, /class="xref-missing">\[\?fig-doesnotexist\]/);
  });
});

describe("numbering across chapters", () => {
  test("theorem, example and table counters continue", async () => {
    const theorems = await html(REPORT, "theorems-definitions-and-proofs");
    for (const label of ["Definition 1", "Theorem 2", "Lemma 3", "Corollary 4", "Example 1"]) {
      assert.ok(theorems.includes(label), `missing ${label}`);
    }
    const worked = await html(REPORT, "a-worked-example");
    assert.ok(worked.includes("Definition 5"), "the theorem counter must not restart");
    assert.ok(worked.includes("Table 2"), "the table counter must not restart");
  });

  test("heading numbers are in the HTML and continue across chapters", async () => {
    const fifth = await chapterOf(MATH, "matrices-and-arrays");
    assert.equal(fifth.chapter.index, 5);
    assert.match(fifth.chapter.contentHtml, /<h2 id="matrices-and-arrays"><span class="heading-label">5<\/span>/);
    assert.equal(fifth.chapter.toc[0].number, "5");
  });

  test("a page holding several sections numbers them all, subsubsections included", async () => {
    const discussion = await html(DESIGN, "discussie");
    for (const number of ["4", "4.1", "4.2", "5"]) {
      assert.ok(discussion.includes(`<span class="heading-label">${number}</span>`), `missing ${number}`);
    }
    const methods = await html(DESIGN, "methode");
    assert.match(methods, /<h4 id="keuze-van-het-gewicht"><span class="heading-label">2\.2\.1<\/span>/);
  });

  test("\\appendix letters the sections after it", async () => {
    const appendix = await html(DESIGN, "bijlagen");
    assert.match(appendix, /<span class="heading-label">A<\/span>Broncode/);
  });

  test("equations number on one counter through every page", async () => {
    const methods = await html(DESIGN, "methode");
    const results = await html(DESIGN, "resultaten");
    assert.match(methods, /<div id="eq:mediaan" class="equation">/);
    assert.match(methods, /<span class="mord">1<\/span><\/span><span class="mord">\)/);
    assert.match(results, /<span class="mord">2<\/span><\/span><span class="mord">\)/);
  });

  test("footnotes number through the document, each page listing its own", async () => {
    const methods = await html(DESIGN, "methode");
    assert.deepEqual(
      [...methods.matchAll(/<li id="fn-(\d+)"/g)].map((m) => m[1]),
      ["2", "3"]
    );
  });

  test("a chapter's first heading id matches its URL slug", async () => {
    const fifth = await html(MATH, "matrices-and-arrays");
    assert.match(fifth, /<h2 id="matrices-and-arrays"/);
  });
});

describe("math", () => {
  test("renders server-side, with a scroll wrapper on display math", async () => {
    const body = await html(MATH, "matrices-and-arrays");
    assert.match(body, /class="katex"/);
    assert.match(body, /class="math-scroll"/);
    assert.ok(!body.includes("katex-error"), "no formula in this chapter should fail");
  });

  test("mhchem is loaded, so \\ce and \\pu render", async () => {
    const body = await html(MATH, "chemistry-and-units");
    // A second copy of katex in the tree means mhchem patches the wrong
    // instance and every \\ce{} turns into a red error instead.
    assert.ok(!body.includes("katex-error"), "\\ce{} failed — check `npm ls katex`");
    const formulas = body.split('class="katex"').length - 1;
    assert.ok(formulas >= 10, `expected the chapter's formulas to render, got ${formulas}`);
    assert.match(body, /mhchem|<annotation encoding="application\/x-tex">\\ce\{/);
  });

  test("a deliberately broken formula renders red instead of failing the build", async () => {
    const body = await html(MATH, "edge-cases-and-pitfalls");
    assert.match(body, /katex-error/);
  });
});

describe("pagination", () => {
  test("long posts split, short ones do not", async () => {
    assert.equal(getChapterOutline(REPORT).length, 7);
    assert.equal(getChapterOutline(MATH).length, 13);
    for (const slug of [SHOWCASE, "building-rtos-from-scratch", "nextjs-portfolio-devlog"]) {
      assert.deepEqual(getChapterOutline(slug), [], `${slug} must stay a single page`);
    }
  });

  test("\\clearpage sets the pages: one page may hold several sections", () => {
    const outline = getChapterOutline(DESIGN);
    assert.deepEqual(
      outline.map((c) => [c.index, c.title, c.slug]),
      [
        [1, "Inleiding", "inleiding"],
        [2, "Methode", "methode"],
        [3, "Resultaten", "resultaten"],
        [4, "Discussie", "discussie"],
        [5, "Bijlagen", "bijlagen"],
      ]
    );
  });

  test("\\section* neither splits a chapter nor takes a number", () => {
    const { body } = parseLatex(String.raw`\section{One} a \section*{Aside} b \section{Two} c`);
    const { chapters } = splitLatexChapters(body);
    assert.deepEqual(chapters.map((c) => c.title), ["One", "Two"]);
  });

  test("chapter 1 lives at the post URL, the rest at their own", async () => {
    const outline = getChapterOutline(REPORT);
    assert.equal(outline[0].href, `/blog/${REPORT}`);
    assert.equal(outline[1].href, `/blog/${REPORT}/${outline[1].slug}`);
  });

  test("prev and next stop at the ends", async () => {
    const first = await chapterOf(REPORT);
    assert.equal(first.prev, undefined);
    assert.equal(first.next?.index, 2);
    const last = await chapterOf(REPORT, "a-worked-example");
    assert.equal(last.next, undefined);
    assert.equal(last.prev?.index, 6);
  });

  test("unknown chapters and chapters of single-page posts return null", async () => {
    assert.equal(await getPostChapter(REPORT, "does-not-exist"), null);
    assert.equal(await getPostChapter(SHOWCASE, "anything"), null);
    assert.equal(await getPostChapter("no-such-post"), null);
  });
});

describe("metadata", () => {
  test("comes from the LaTeX preamble", async () => {
    const posts = getAllPosts();
    assert.equal(posts.length, getAllSlugs().length);
    const report = posts.find((p) => p.slug === REPORT);
    assert.ok(report);
    assert.equal(report.title, "Writing a Report on This Blog");
    assert.equal(report.date, "2026-09-18");
    assert.deepEqual(report.tags, ["Reference", "Writing", "LaTeX"]);
    assert.match(report.readTime, /^\d+ min read$/);
  });

  test("every post has a title, date and excerpt", () => {
    for (const post of getAllPosts()) {
      assert.ok(post.title.length > 0, `${post.slug} has no \\title`);
      assert.match(post.date, /^\d{4}-\d{2}-\d{2}$/, `${post.slug} has a bad \\date`);
      assert.ok(post.excerpt.length > 0, `${post.slug} has no \\excerpt`);
    }
  });
});

describe("report metadata", () => {
  test("the preamble fills the report header", async () => {
    const shell = await getPostShell(DESIGN);
    assert.ok(shell);
    const { post } = shell;
    assert.equal(post.lang, "nl");
    assert.equal(post.author, "Mitchel Reints");
    assert.equal(post.subtitle, "Een meting van bundelgrootte en laadtijd over veertig projecten, 2019–2025");
    assert.equal(post.affiliation, "Onafhankelijk onderzoek, Utrecht");
    assert.deepEqual(post.version, { label: "v2", date: "2025-09-04" });
    assert.deepEqual(post.keywords, ["designsystemen", "bundelgrootte", "laadtijd", "meetmethode"]);
    assert.equal(post.kind, "Verslag");
    assert.equal(post.draft, true);
    assert.equal(post.pdf?.href, "/docs/blog/report-design-showcase.pdf");
    assert.ok((post.pdf?.bytes ?? 0) > 0, "the PDF size is measured");
  });

  test("an abstract before the first section moves to the header", async () => {
    const shell = await getPostShell(DESIGN);
    assert.equal(shell?.abstract?.title, "Samenvatting");
    assert.match(shell?.abstract?.html ?? "", /^Een gedeeld designsysteem/);
    assert.ok(!(await html(DESIGN)).includes('class="abstract"'), "and not also into page 1");
    // One written inside a section stays in the text.
    assert.equal((await getPostShell(REPORT))?.abstract, undefined);
    assert.ok((await html(REPORT)).includes('class="abstract"'));
  });

  test("the contents list every page's headings with number and page", async () => {
    const shell = await getPostShell(DESIGN);
    const rows = shell?.contents.map((c) => `${c.page} ${c.number ?? "-"} ${c.text}`);
    assert.deepEqual(rows, [
      "1 1 Inleiding",
      "2 2 Methode",
      "2 2.1 Opzet",
      "2 2.2 Meetinstrument",
      "3 3 Resultaten",
      "3 3.1 Bundelgrootte",
      "3 3.2 Spreiding",
      "4 4 Discussie",
      "4 4.1 Interpretatie",
      "4 4.2 Beperkingen",
      "4 5 Conclusie",
      "5 A Broncode",
      "5 - Bibliografie",
    ]);
  });

  test("babel picks the language; \\lang{} is the short form; English otherwise", () => {
    const lang = (source: string) => parseLatex(source).meta.lang;
    assert.equal(lang(String.raw`\usepackage[dutch]{babel}`), "nl");
    assert.equal(lang(String.raw`\usepackage[dutch,english]{babel}`), "en", "babel's last option is the main language");
    assert.equal(lang(String.raw`\lang{nl}`), "nl");
    assert.equal(lang(String.raw`\title{x}`), "en");
  });

  test("a Dutch post gets Dutch labels, an English one English", async () => {
    const methods = await html(DESIGN, "methode");
    assert.match(methods, /<span class="tbl-number">Tabel 1:<\/span>/);
    const discussion = await html(DESIGN, "discussie");
    assert.match(discussion, /<span class="thm-label">Definitie 1<\/span> <span class="thm-note">\(Dekking\)<\/span>\./);
    const results = await html(DESIGN, "resultaten");
    assert.match(results, /<span class="fig-number">Figuur 1:<\/span>/);
    const report = await html(REPORT, "tables-figures-and-cross-references");
    assert.match(report, /<span class="fig-number">Figure 1:<\/span>/);
  });

  test("drafts are left out of a production build", async () => {
    const before = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string>).NODE_ENV = "production";
      assert.ok(!getAllSlugs().includes(DESIGN));
      assert.ok(!getAllPosts().some((p) => p.slug === DESIGN));
      assert.deepEqual(getChapterOutline(DESIGN), []);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = before;
    }
    assert.ok(getAllSlugs().includes(DESIGN), "but present under dev and test");
  });
});

describe("text fidelity", () => {
  // What LaTeX typesets for each input, as the characters a browser shows.
  const render = async (source: string) => {
    const { renderLatex } = await import("../src/lib/blog/render.ts");
    const { emptyCounters } = await import("../src/lib/blog/latex.ts");
    const ctx = { counters: emptyCounters(), labels: new Map(), chapterHref: "/x", lang: "en" as const };
    return (await renderLatex(parseLatex(source).body, { ctx })).html;
  };

  test("dashes, quotes, ties and thin spaces", async () => {
    const out = await render("a -- b --- c ``d'' e~f 10\\,ms");
    assert.ok(out.includes("a – b — c “d” e\u00A0f 10\u202Fms"), JSON.stringify(out));
  });

  test("control symbols keep the space after them, as in LaTeX", async () => {
    const out = await render("10\\% \\& more \\# one \\$5 a\\_b");
    assert.ok(out.includes("10% &#x26; more # one $5 a_b"), JSON.stringify(out));
  });

  test("a control space and an end-of-sentence fix", async () => {
    const out = await render("Dr.\\ Who and NASA\\@. Next");
    assert.ok(out.includes("Dr. Who and NASA. Next"), JSON.stringify(out));
  });
});

describe("code listings", () => {
  test("every source line becomes one .line span, so numbers stay out of a copy", async () => {
    const body = await html(DESIGN, "bijlagen");
    const listing = body.slice(body.indexOf('<figure class="listing"'), body.indexOf("</figure>"));
    assert.equal(listing.split('<span class="line">').length - 1, 23);
    assert.match(listing, /<span class="listing-file">verslag\.tex<\/span>/);
    assert.match(listing, /<button type="button" class="listing-copy" data-copy="true" aria-label="Kopieer code"/);
  });

  test("every common language is highlighted, not only LaTeX", async () => {
    const body = await html(SHOWCASE);
    for (const language of ["typescript", "python", "bash", "c"]) {
      const start = body.indexOf(`language-${language}`);
      assert.ok(start >= 0, `no ${language} block`);
      assert.match(body.slice(start, start + 2000), /hljs-/, `${language} has no highlighting`);
    }
  });

  test("a minted file name and a verbatim block", async () => {
    const body = await html(SHOWCASE);
    assert.match(body, /<span class="listing-file">blink\.py<\/span><span class="listing-meta"><span class="code-lang-label" data-lang="python">python<\/span>/);
    assert.match(body, /avrdude: 1024 bytes of flash written/);
  });
});

describe("source hygiene", () => {
  test("no control characters leaked into the .tex sources", () => {
    const dir = path.join(process.cwd(), "content/blog");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".tex"))) {
      const source = readFileSync(path.join(dir, file), "utf8");
      const stray = [...source].filter((c) => c < " " && c !== "\n" && c !== "\t");
      assert.deepEqual(stray, [], `${file} contains control characters`);
    }
  });

  test("no unrendered LaTeX or placeholders survive into the HTML", async () => {
    for (const slug of getAllSlugs()) {
      const outline = getChapterOutline(slug);
      const targets = outline.length > 0 ? outline.map((c) => c.slug) : [undefined];
      for (const target of targets) {
        const body = await html(slug, outline.length > 0 && target !== outline[0].slug ? target : undefined);
        assert.ok(!body.includes("data-ref="), `${slug}: unresolved reference placeholder`);
        // unified-latex emits an empty <span class="macro macro-x"> for any
        // macro it cannot translate, which silently swallows the character or
        // argument. Any of them reaching the page is a bug.
        const leaked = [...body.matchAll(/class="macro macro-([a-zA-Z]+)"/g)].map((m) => m[1]);
        assert.deepEqual([...new Set(leaked)], [], `${slug}: untranslated macros reached the HTML`);
        const untranslated = findUntranslated(body);
        assert.deepEqual(untranslated.environments, [], `${slug}: environments the pipeline does not translate`);
        assert.ok(!/\[\?[\w:-]+\]/.test(body.replaceAll(/<[^>]+>/g, "")) || slug === REPORT, `${slug}: an unresolved reference`);
        assert.ok(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(body), `${slug}: control characters`);
      }
    }
  });
});

describe("fixture coverage", () => {
  test("every supported macro and environment is used by at least one post", () => {
    const dir = path.join(process.cwd(), "content/blog");
    const sources = readdirSync(dir)
      .filter((f) => f.endsWith(".tex"))
      .map((f) => readFileSync(path.join(dir, f), "utf8"))
      .join("\n");
    const missing = [
      ...SUPPORTED.macros.filter((name) => !new RegExp(`\\\\${name}(?![a-zA-Z])`).test(sources)).map((n) => `\\${n}`),
      ...SUPPORTED.environments.filter((name) => !sources.includes(`\\begin{${name}}`)),
    ];
    assert.deepEqual(missing, [], "add these to a fixture so the snapshots cover them");
  });
});
