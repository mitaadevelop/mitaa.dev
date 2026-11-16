import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { markdownToHtml } from "../src/lib/projects/markdown.ts";

/**
 * The templates are what authors copy, so a Mermaid block that stops drawing
 * (pele changes, a typo in an example) must fail here, not on someone's page.
 */
const read = (file: string) => readFileSync(path.join(process.cwd(), "templates", file), "utf8");

describe("project template diagrams", () => {
  for (const file of ["project/repo/project/architecture.md", "project/repo/project/overview.md", "project/repo/project/getting-started.md", "project/curated.md"]) {
    test(`${file} has no diagram that fails to draw`, async () => {
      const html = await markdownToHtml(read(file), { where: file });
      assert.doesNotMatch(html, /diagram-error/);
    });
  }

  test("architecture.md draws a flowchart, an architecture diagram and a sequence diagram", async () => {
    const html = await markdownToHtml(read("project/repo/project/architecture.md"));
    for (const type of ["flowchart", "architecture", "sequence"]) {
      assert.match(html, new RegExp(`class="pele pele-${type}"`), `no ${type} diagram`);
    }
  });
});
