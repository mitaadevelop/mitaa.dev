import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { diagramHtml } from "../src/lib/diagram.ts";
import { markdownToHtml } from "../src/lib/projects/markdown.ts";

const FLOW = "flowchart LR\n  A[Sensor] --> B[MCU]\n  B --> C{Safe?}";
const ARCHITECTURE = `architecture-beta
  group api(cloud)[API]
  service db(database)[Database] in api
  service server(server)[Server] in api
  db:L -- R:server`;

describe("diagramHtml", () => {
  test("draws Mermaid to an inline SVG with an accessible name and the source behind a toggle", () => {
    const html = diagramHtml(FLOW, { label: "The control loop" });
    assert.match(html, /^<div class="diagram" role="img" aria-label="The control loop"><svg /);
    assert.match(html, /class="pele pele-flowchart"/);
    assert.match(html, /<details class="diagram-source"><summary>Show diagram source<\/summary>/);
    // The source is shown escaped, so `-->` cannot open a tag.
    assert.match(html, /A\[Sensor\] --&gt; B\[MCU\]/);
  });

  test("draws the architecture diagram type too", () => {
    assert.match(diagramHtml(ARCHITECTURE), /class="pele pele-architecture"/);
  });

  test("colours come from custom properties, so the theme can restyle them", () => {
    const svg = diagramHtml(FLOW);
    assert.match(svg, /var\(--pele-fg/);
    assert.doesNotMatch(svg, /<script|<foreignObject|<style/i);
  });

  test("indentation shared by every line is removed before drawing", () => {
    const indented = diagramHtml("   flowchart LR\n     A --> B\n");
    assert.match(indented, /class="pele pele-flowchart"/);
  });

  test("invalid Mermaid does not throw: the page shows pele's message and the source", () => {
    const html = diagramHtml("flowchart LR\n  A --> ", { where: "test" });
    assert.match(html, /^<div class="diagram diagram-error" role="group">/);
    assert.match(html, /This diagram could not be drawn\./);
    assert.match(html, /Parse error/);
    assert.doesNotMatch(html, /<svg/);
  });

  test("text that is not a diagram is an error too", () => {
    assert.match(diagramHtml("hello world"), /diagram-error/);
  });

  test("a label and the words are escaped", () => {
    const html = diagramHtml(FLOW, {
      label: `"><script>alert(1)</script>`,
      words: { diagram: "d", showSource: "<b>", failed: "f" },
    });
    assert.ok(!html.includes("<script>"));
    assert.match(html, /<summary>&lt;b&gt;<\/summary>/);
  });
});

describe("markdownToHtml", () => {
  test("a ```mermaid fence becomes a diagram; other code stays code", async () => {
    const html = await markdownToHtml(
      ["Intro.", "", "```mermaid", FLOW, "```", "", "```c", "int x;", "```"].join("\n")
    );
    assert.match(html, /<div class="diagram" role="img" aria-label="Diagram"><svg /);
    assert.match(html, /<pre><code class="language-c">int x;/);
    assert.doesNotMatch(html, /language-mermaid/);
  });

  test("several diagrams in one document each get their own drawing", async () => {
    const html = await markdownToHtml(
      ["```mermaid", FLOW, "```", "", "```mermaid", ARCHITECTURE, "```"].join("\n")
    );
    assert.equal((html.match(/class="pele pele-flowchart"/g) ?? []).length, 1);
    assert.equal((html.match(/class="pele pele-architecture"/g) ?? []).length, 1);
  });

  test("raw HTML in the markdown is still sanitised: only pele's own SVG gets through", async () => {
    const html = await markdownToHtml(
      ["<script>alert(1)</script>", "", "<svg onload=alert(1)></svg>", "", "```mermaid", FLOW, "```"].join("\n")
    );
    assert.doesNotMatch(html, /<script|onload/i);
    assert.match(html, /class="pele pele-flowchart"/);
  });

  test("text that looks like the placeholder is not replaced", async () => {
    const html = await markdownToHtml("diagram0x0\n\ndiagramx0");
    assert.match(html, /<p>diagram0x0<\/p>/);
    assert.doesNotMatch(html, /diagram"/);
  });

  test("the transform runs before the diagrams go in, so it never sees the SVG", async () => {
    let seen = "";
    await markdownToHtml(["```mermaid", FLOW, "```"].join("\n"), {
      transform: (html) => ((seen = html), html),
    });
    assert.doesNotMatch(seen, /<svg/);
  });

  test("a broken fence shows the error block instead of failing", async () => {
    const html = await markdownToHtml("```mermaid\nflowchart LR\n  A --> \n```");
    assert.match(html, /diagram-error/);
  });
});
