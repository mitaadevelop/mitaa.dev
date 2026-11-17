import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { AddressInfo } from "node:net";

/**
 * `scripts/translate-content.mts` end to end: a real run of the script, against a
 * temporary project folder and a local stand-in for the Messages API (no network,
 * no key). What it proves is the wiring: what is translated, what is written where,
 * what the cache saves, and that nothing here can fail a build.
 */

const SCRIPT = path.join(process.cwd(), "scripts/translate-content.mts");

const DUTCH_POST = String.raw`\documentclass{article}
\usepackage[dutch]{babel}
\title{Mijn eerste post}
\date{2026-11-17}

\begin{document}
\section{Hallo}\label{sec:hallo}
Dit is een bericht over spanning.
\end{document}
`;
const BIO = "---\ntitle: mitaa.dev\nupdated: 2026-02-28\nlang: nl\n---\n\nIk bouw hardware en software.\n";

let server: http.Server;
let url = "";
let calls = 0;
let root = "";

before(async () => {
  server = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      calls++;
      const { messages } = JSON.parse(body) as { messages: { content: string }[] };
      const text = messages[0].content
        .replace("Mijn eerste post", "My first post")
        .replace("Hallo", "Hello")
        .replace("Dit is een bericht over spanning.", "This is a message about voltage.")
        .replace("Ik bouw hardware en software.", "I build hardware and software.");
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text }] }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1/messages`;
});
after(() => server.close());

function project(): string {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "translate-"));
  fs.mkdirSync(path.join(root, "content/blog"), { recursive: true });
  fs.writeFileSync(path.join(root, "content/bio.md"), BIO);
  fs.writeFileSync(path.join(root, "content/blog/mijn-eerste-post.tex"), DUTCH_POST);
  fs.writeFileSync(path.join(root, "content/blog/concept.tex"), DUTCH_POST.replace("\\title", "\\draft{true}\n\\title"));
  return root;
}

/** Async on purpose: the stand-in API runs in this process, so it must not be blocked while the script waits for it. */
function run(env: Record<string, string>): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--import", "tsx", SCRIPT], {
      cwd: process.cwd(),
      env: { ...process.env, TRANSLATE_ROOT: root, ANTHROPIC_API_URL: url, ...env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

describe("npm run translate", () => {
  test("translates the bio and the published posts, never a draft, and declares the new language", async () => {
    project();
    calls = 0;
    const result = await run({ ANTHROPIC_API_KEY: "test-key" });
    assert.equal(result.status, 0, result.stderr);

    const bio = fs.readFileSync(path.join(root, ".translations/bio.en.md"), "utf8");
    assert.match(bio, /lang: en/);
    assert.match(bio, /translatedFrom: nl/);
    assert.match(bio, /I build hardware and software\./);

    const post = fs.readFileSync(path.join(root, ".translations/blog/mijn-eerste-post.en.tex"), "utf8");
    assert.match(post, /\\title\{My first post\}/);
    assert.match(post, /\\usepackage\[english\]\{babel\}/);
    assert.doesNotMatch(post, /dutch/);
    assert.match(post, /\\label\{sec:hallo\}/);
    assert.ok(!fs.existsSync(path.join(root, ".translations/blog/concept.en.tex")), "a draft is not translated");
    assert.ok(calls > 0);
  });

  test("a second run answers from the cache and calls the API for nothing", async () => {
    project();
    calls = 0;
    await run({ ANTHROPIC_API_KEY: "test-key" });
    const first = calls;
    assert.ok(first > 0);
    const again = await run({ ANTHROPIC_API_KEY: "test-key" });
    assert.equal(again.status, 0);
    assert.equal(calls, first);
    assert.ok(fs.existsSync(path.join(root, ".translations/blog/mijn-eerste-post.en.tex")));
  });

  test("without a key it still uses what it translated before, and a new text is simply not translated", async () => {
    project();
    await run({ ANTHROPIC_API_KEY: "test-key" });
    fs.writeFileSync(path.join(root, "content/blog/nieuw.tex"), DUTCH_POST.replace("Mijn eerste post", "Een nieuwe post"));
    calls = 0;
    const result = await run({ ANTHROPIC_API_KEY: "" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(calls, 0, "no key, no calls");
    assert.ok(fs.existsSync(path.join(root, ".translations/blog/mijn-eerste-post.en.tex")), "from the cache");
    assert.ok(fs.existsSync(path.join(root, ".translations/bio.en.md")));
    assert.ok(!fs.existsSync(path.join(root, ".translations/blog/nieuw.en.tex")), "never translated, so not there");
  });

  test("a hand-written English bio is never replaced, and TRANSLATE=off skips everything", async () => {
    project();
    fs.writeFileSync(path.join(root, "content/bio.en.md"), "---\ntitle: mitaa.dev\n---\n\nWritten by hand.\n");
    await run({ ANTHROPIC_API_KEY: "test-key" });
    assert.ok(!fs.existsSync(path.join(root, ".translations/bio.en.md")));
    assert.ok(fs.existsSync(path.join(root, ".translations/blog/mijn-eerste-post.en.tex")));

    project();
    calls = 0;
    const result = await run({ ANTHROPIC_API_KEY: "test-key", TRANSLATE: "off" });
    assert.equal(result.status, 0);
    assert.equal(calls, 0);
    assert.ok(!fs.existsSync(path.join(root, ".translations")));
  });

  test("an API that is down is a warning, not a failed build", async () => {
    project();
    const result = await run({ ANTHROPIC_API_KEY: "test-key", ANTHROPIC_API_URL: "http://127.0.0.1:1/v1/messages" });
    assert.equal(result.status, 0);
    assert.ok(!fs.existsSync(path.join(root, ".translations/blog/mijn-eerste-post.en.tex")));
    assert.match(result.stdout, /not translated/);
  });
});
