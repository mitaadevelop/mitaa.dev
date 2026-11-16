import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  latexCheatsheet,
  latexTemplates,
  templateFiles,
} from "../src/data/latex-templates.ts";
import {
  countDownload,
  DOWNLOADS,
  getDownloadCounts,
  isBot,
  overleafUrl,
  visitorOf,
} from "../src/lib/downloads.ts";

const publicDir = path.join(process.cwd(), "public");
const templatesDir = path.join(process.cwd(), "content/shop/latex-templates");

describe("download catalogue", () => {
  test("every download points at a file that is committed under public/", () => {
    for (const [id, { file }] of Object.entries(DOWNLOADS)) {
      assert.ok(existsSync(path.join(publicDir, file)), `${id}: ${file} is missing`);
    }
  });

  test("every template has its sources, example PDF and previews", () => {
    for (const template of latexTemplates) {
      for (const source of ["main.tex", "setup.tex", "references.bib"]) {
        assert.ok(existsSync(path.join(templatesDir, template.slug, source)), `${template.slug}/${source} is missing`);
      }
      const files = templateFiles(template);
      for (const file of [files.pdf, ...files.previews]) {
        assert.ok(existsSync(path.join(publicDir, file)), `${file} is missing — run npm run downloads:build`);
      }
    }
  });

  test("the cheat sheet has its source, PDF and previews", () => {
    assert.ok(existsSync(path.join(process.cwd(), "content/shop/latex-cheatsheet/main.tex")));
    for (const file of [latexCheatsheet.files.pdf, ...latexCheatsheet.files.previews]) {
      assert.ok(existsSync(path.join(publicDir, file)), `${file} is missing — run npm run downloads:build -- cheatsheet`);
    }
  });

  // The ZIPs are built and committed by hand; this catches an edited template
  // whose ZIP was never rebuilt.
  test("every template ZIP holds exactly the current sources", () => {
    for (const template of latexTemplates) {
      const name = template.slug;
      const zip = path.join(publicDir, templateFiles(template).zip);
      const sources = readdirSync(path.join(templatesDir, name)).filter((f) => !f.startsWith("."));
      const listed = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" }).trim().split("\n");
      assert.deepEqual(listed.sort(), [...sources, "README.txt"].sort(), `${name}.zip lists other files`);
      for (const source of sources) {
        const zipped = execFileSync("unzip", ["-p", zip, source], { encoding: "utf8" });
        const current = readFileSync(path.join(templatesDir, name, source), "utf8");
        assert.equal(zipped, current, `${name}.zip has an outdated ${source} — run npm run downloads:build -- ${name}`);
      }
    }
  });
});

describe("download counting", () => {
  test("crawlers, link previews, scripts and empty user agents are not counted", () => {
    for (const ua of [
      "",
      "Googlebot/2.1 (+http://www.google.com/bot.html)",
      "facebookexternalhit/1.1",
      "Slackbot-LinkExpanding 1.0",
      "curl/8.4.0",
      "python-requests/2.31",
    ]) {
      assert.equal(isBot(ua), true, ua);
    }
    assert.equal(
      isBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15"),
      false,
    );
  });

  test("the visitor is the first forwarded address", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1", "user-agent": "Firefox" });
    assert.deepEqual(visitorOf(headers), { ip: "203.0.113.7", userAgent: "Firefox" });
  });

  test("without Redis credentials nothing is counted and no counts are shown", async () => {
    for (const key of ["KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) {
      delete process.env[key];
    }
    const realFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      return new Response("{}");
    }) as typeof fetch;
    try {
      await countDownload("signal-no-01", { ip: "203.0.113.7", userAgent: "Firefox" });
      assert.equal(await getDownloadCounts(), null);
      assert.equal(calls, 0);
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  test("with Redis, a download is one EVAL and the counts are one MGET", async () => {
    process.env.KV_REST_API_URL = "https://redis.example/";
    process.env.KV_REST_API_TOKEN = "secret";
    const realFetch = globalThis.fetch;
    const requests: { url: string; init?: RequestInit }[] = [];
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      requests.push({ url, init });
      const ids = Object.keys(DOWNLOADS);
      const result = url.includes("/mget/") ? ids.map((_, i) => (i === 0 ? "41" : null)) : 1;
      return Response.json({ result });
    }) as typeof fetch;
    try {
      await countDownload("latex-essay", { ip: "203.0.113.7", userAgent: "Firefox" });
      const [evalRequest] = requests;
      assert.equal(evalRequest.url, "https://redis.example");
      assert.equal(new Headers(evalRequest.init?.headers).get("authorization"), "Bearer secret");
      const command = JSON.parse(String(evalRequest.init?.body)) as string[];
      assert.equal(command[0], "EVAL");
      assert.match(command[3], /^downloads:seen:[0-9a-f]{32}$/);
      assert.equal(command[4], "downloads:count:latex-essay");
      assert.ok(!command.join(" ").includes("203.0.113.7"), "the IP must not reach Redis");

      const counts = await getDownloadCounts();
      assert.ok(requests[1].url.startsWith("https://redis.example/mget/downloads%3Acount%3A"));
      assert.equal(counts?.[Object.keys(DOWNLOADS)[0]], 41);
      assert.equal(counts?.[Object.keys(DOWNLOADS)[1]], 0);
    } finally {
      globalThis.fetch = realFetch;
      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;
    }
  });

  test("Overleaf receives the ZIP's absolute URL, encoded", () => {
    const url = new URL(overleafUrl("https://mitaa.dev/downloads/latex/essay.zip", "Essay (mitaa.dev)"));
    assert.equal(url.origin, "https://www.overleaf.com");
    assert.equal(url.searchParams.get("snip_uri"), "https://mitaa.dev/downloads/latex/essay.zip");
    assert.equal(url.searchParams.get("snip_name"), "Essay (mitaa.dev)");
  });
});
