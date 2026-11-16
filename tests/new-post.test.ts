import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createPost, SLUG, titleFromSlug } from "../scripts/new-post.mts";
import { parseLatex } from "../src/lib/blog/latex.ts";

/** A scratch repo: just the real template, so the test breaks if the template changes shape. */
let root: string;

before(() => {
  root = mkdtempSync(path.join(tmpdir(), "new-post-"));
  mkdirSync(path.join(root, "templates/blog"), { recursive: true });
  cpSync(path.join(process.cwd(), "templates/blog/post.tex"), path.join(root, "templates/blog/post.tex"));
});

after(() => rmSync(root, { recursive: true, force: true }));

const NOW = new Date(2026, 10, 16, 14, 30); // 16 November 2026, local time

describe("new:post", () => {
  test("creates the post and a folder for its images", () => {
    const post = createPost(root, "can-bus-sniffer", "A CAN bus sniffer", NOW);

    assert.equal(post.file, path.join(root, "content/blog/can-bus-sniffer.tex"));
    assert.ok(existsSync(post.file));
    assert.ok(existsSync(path.join(root, "public/blog/can-bus-sniffer/.gitkeep")));
    assert.equal(post.title, "A CAN bus sniffer");
  });

  test("the new post is a draft with today's date, and nothing of the template's placeholders goes live", () => {
    const { file } = createPost(root, "draft-check", "Draft check", NOW);
    const source = readFileSync(file, "utf8");
    const { meta } = parseLatex(source);

    assert.equal(meta.title, "Draft check");
    assert.equal(meta.date, "2026-11-16");
    assert.equal(meta.draft, true, "hidden from production until \\draft is deleted");
    assert.ok(!meta.image, "the template's sample cover is not kept");
    assert.ok(!meta.xPostUrl, "the template's sample X link is not kept");
    assert.ok(!meta.pdf, "no PDF button until a PDF is published");
    // \draft is a metadata line after \documentclass; before it LaTeX stops with
    // "Undefined control sequence", and the template's own comment is not it.
    const active = source.split("\n").filter((line) => /^\\draft\b/.test(line));
    assert.equal(active.length, 1, "exactly one active \\draft line");
    assert.ok(source.indexOf("\n\\draft") > source.indexOf("\\documentclass"), "\\draft comes after \\documentclass");
    assert.match(source, /^% \\draft\b/m, "the header may still talk about \\draft in a comment");
    // The instructions say where its images go, by this post's own name.
    assert.match(source, /public\/blog\/draft-check\//);
    assert.doesNotMatch(source, /Copy to content\/blog\/<slug>/);
  });

  test("the body is still the template, so every feature can be copied from it", () => {
    const { file } = createPost(root, "body-check", undefined, NOW);
    const source = readFileSync(file, "utf8");
    const template = readFileSync(path.join(root, "templates/blog/post.tex"), "utf8");
    // From the real \begin{document} line: the header comments also mention it.
    const body = (text: string) => text.slice(text.indexOf("\n\\begin{document}\n"));
    assert.ok(body(template).length > 1000, "the template has a body");
    assert.equal(body(source) === body(template), true, "the body is the template's, unchanged");
  });

  test("without a title it is made from the name", () => {
    assert.equal(titleFromSlug("can-bus-sniffer"), "Can Bus Sniffer");
    const { file } = createPost(root, "rtos-notes", undefined, NOW);
    assert.equal(parseLatex(readFileSync(file, "utf8")).meta.title, "Rtos Notes");
  });

  test("characters LaTeX reads as commands are escaped in the title", () => {
    const { file } = createPost(root, "escaping", "R&D at 50% of $5 #1_a", NOW);
    const source = readFileSync(file, "utf8");
    assert.match(source, /\\title\{R\\&D at 50\\% of \\\$5 \\#1\\_a\}/);
  });

  test("only usable names are accepted", () => {
    for (const bad of ["", "Upper", "has space", "double--dash", "-lead", "trail-", "a/b", "../x", "with.dot"]) {
      assert.equal(SLUG.test(bad), false, `"${bad}" should be refused`);
      assert.throws(() => createPost(root, bad, undefined, NOW), /not a usable name/);
    }
    assert.equal(SLUG.test("post-2"), true);
  });

  test("the dev-only template's name is taken", () => {
    assert.throws(() => createPost(root, "template", undefined, NOW), /dev-only template/);
  });

  test("an existing post is never overwritten", () => {
    const file = path.join(root, "content/blog/keep-me.tex");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, "my own text");

    assert.throws(() => createPost(root, "keep-me", undefined, NOW), /exists already/);
    assert.equal(readFileSync(file, "utf8"), "my own text");
  });

  test("a template that has changed shape is reported, not half-filled", () => {
    const broken = mkdtempSync(path.join(tmpdir(), "new-post-broken-"));
    try {
      mkdirSync(path.join(broken, "templates/blog"), { recursive: true });
      writeFileSync(path.join(broken, "templates/blog/post.tex"), "\\documentclass{article}\n\\begin{document}\\end{document}\n");
      assert.throws(() => createPost(broken, "x", undefined, NOW), /has no .* line to fill in/);
      assert.ok(!existsSync(path.join(broken, "content/blog/x.tex")), "nothing is written when it fails");
    } finally {
      rmSync(broken, { recursive: true, force: true });
    }
  });
});
