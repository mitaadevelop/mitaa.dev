/**
 * hast plugins that bring unified-latex's output in line with what the rest of
 * the pipeline and the site's CSS expect.
 */
import { visit, SKIP } from "unist-util-visit";
import { toText } from "hast-util-to-text";
import type { Element, ElementContent, Root } from "hast";
import type { TocItem } from "./types";
import type { RenderContext } from "./latex";
import { strings } from "./i18n";
import { uniqueSlug } from "./text";

function classList(node: Element): string[] {
  const value = node.properties?.className;
  return Array.isArray(value) ? value.map(String) : [];
}

interface FixupOptions {
  toc: TocItem[];
  /** Force the id of the first heading — used to match a chapter's URL slug. */
  firstHeadingId?: string;
  /** Section counters continue across chapters, like the rest of LaTeX's. */
  ctx: RenderContext;
}

/** Section number as LaTeX prints it: 3, 3.1, 3.1.2 — or A, A.1 after \appendix. */
function sectionNumber(ctx: RenderContext, level: 2 | 3 | 4): string {
  const { section, subsection, subsubsection, appendix } = ctx.counters;
  const top = appendix ? letter(section) : String(section);
  if (level === 2) return top;
  if (level === 3) return `${top}.${subsection}`;
  return `${top}.${subsection}.${subsubsection}`;
}

/** 1 → A, 26 → Z, 27 → AA, as LaTeX's \Alph would (it stops at Z). */
function letter(n: number): string {
  let out = "";
  for (let k = n; k > 0; k = Math.floor((k - 1) / 26)) {
    out = String.fromCharCode(65 + ((k - 1) % 26)) + out;
  }
  return out || "0";
}

/**
 * Bring unified-latex's output in line with what the rest of the pipeline and
 * the site's CSS expect.
 *
 * Unrelated jobs, done in one walk because they all depend on document order:
 *  - `\section` comes out as `<h3>`; the blog's headings are h2–h4, so retag.
 *    Headings are numbered here, on LaTeX's counters, so the number is in the
 *    HTML (and the table of contents) rather than drawn by CSS.
 *  - `\appendix` and stray `\label`s arrive as marker spans from latex.ts and
 *    are consumed in place.
 *  - Math comes out as `.inline-math` / `.display-math`; rehype-katex looks for
 *    `.math-inline` / `.math-display`. A `\label` inside display math has to go
 *    too, since KaTeX has no cross-reference machinery and would error on it.
 *  - `tabular` produces blank rows where `\hline` was, and no header cells.
 */
export function rehypeLatexFixups({ toc, firstHeadingId, ctx }: FixupOptions) {
  return (tree: Root) => {
    const seen = new Map<string, number>();
    let headings = 0;
    let lastHeading: { id: string; number?: string; level: number } | null = null;

    visit(tree, "element", (node: Element, index, parent) => {
      // Markers -----------------------------------------------------------
      if (node.properties?.dataAppendix !== undefined && parent && index !== undefined) {
        ctx.counters.appendix = true;
        ctx.counters.section = 0;
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
      if (node.properties?.dataLabel !== undefined && parent && index !== undefined) {
        const key = String(node.properties.dataLabel);
        if (lastHeading?.number) {
          const words = strings(ctx.lang);
          ctx.labels.set(key, {
            word: ctx.counters.appendix && lastHeading.level === 2 ? words.appendix : words.section,
            number: lastHeading.number,
            kind: "section",
            anchor: lastHeading.id,
            href: ctx.chapterHref,
          });
        }
        parent.children.splice(index, 1);
        return [SKIP, index];
      }

      // Math ------------------------------------------------------------
      const classes = classList(node);
      if (classes.includes("inline-math") || classes.includes("display-math")) {
        const display = classes.includes("display-math");
        node.properties = {
          ...node.properties,
          className: [display ? "math-display" : "math-inline"],
        };
        visit(node, "text", (child) => {
          child.value = child.value.replaceAll(/\\label\{[^}]*\}/g, "");
        });
        return SKIP;
      }

      // Tables ----------------------------------------------------------
      // Only tabular's own output: tables the pipeline builds (the barchart's
      // data) already have their header.
      if (node.tagName === "table" && classes.includes("tabular")) {
        const bodies = node.children.filter(
          (child): child is Element => child.type === "element" && child.tagName === "tbody"
        );
        for (const body of bodies) {
          // \hline leaves behind a row with no real cells.
          body.children = body.children.filter((row) => {
            if (row.type !== "element" || row.tagName !== "tr") return false;
            return row.children.some(
              (cell) =>
                cell.type === "element" && toText(cell, { whitespace: "pre" }).trim().length > 0
            );
          });
          // LaTeX tabular has no header semantics; by convention the first row
          // is the header, which is also what every table on this blog wants.
          const first = body.children[0];
          if (first && first.type === "element") {
            for (const cell of first.children) {
              if (cell.type === "element" && cell.tagName === "td") cell.tagName = "th";
            }
            body.children.shift();
            node.children.unshift({
              type: "element",
              tagName: "thead",
              properties: {},
              children: [first],
            });
          }
        }
        return;
      }

      // Headings --------------------------------------------------------
      const retag: Record<string, string> = { h3: "h2", h4: "h3", h5: "h4", h6: "h4" };
      if (!(node.tagName in retag)) return;
      if (!parent || index === undefined) return;
      node.tagName = retag[node.tagName];

      headings++;
      const level = Number(node.tagName.slice(1)) as 2 | 3 | 4;
      const starred = classes.includes("starred");
      let number: string | undefined;
      if (!starred) {
        const c = ctx.counters;
        if (level === 2) {
          c.section += 1;
          c.subsection = 0;
          c.subsubsection = 0;
        } else if (level === 3) {
          c.subsection += 1;
          c.subsubsection = 0;
        } else {
          c.subsubsection += 1;
        }
        number = sectionNumber(ctx, level);
      }
      const label = toText(node, { whitespace: "pre" }).replaceAll(/\s+/g, " ").trim();
      const id =
        headings === 1 && firstHeadingId
          ? firstHeadingId
          : uniqueSlug(label || `section-${headings}`, seen);
      node.properties = { ...node.properties, id };
      if (number) {
        node.children.unshift({
          type: "element",
          tagName: "span",
          properties: { className: ["heading-label"] },
          children: [{ type: "text", value: number }],
        });
      }
      lastHeading = { id, number, level };
      if (level <= 3) toc.push({ id, text: label, level, ...(number ? { number } : {}) });
    });
  };
}

/**
 * Wrap .katex-display in a scrollable div.
 *
 * Display math is `white-space: nowrap` and will not wrap, so long formulas
 * must scroll. The overflow cannot go on .katex-display itself: KaTeX pins
 * \tag numbers with `position:absolute; right:0` relative to it, so an
 * overflowing formula would slide underneath its own equation number.
 */
export function rehypeWrapDisplayMath() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (!parent || index === undefined) return;
      if (!classList(node).includes("katex-display")) return;
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["math-scroll"] },
        children: [node],
      };
      return SKIP;
    });
  };
}

/**
 * Split highlighted code into one `<span class="line">` per source line.
 *
 * Runs after rehype-highlight, whose token spans can run across lines (a
 * multi-line comment or string), so a span is cloned onto every line it
 * touches rather than cut in half. The line numbers are a CSS counter on these
 * spans, which keeps them out of anything the reader copies.
 */
export function rehypeCodeLines() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, _index, parent) => {
      if (node.tagName !== "code" || !parent || (parent as Element).tagName !== "pre") return;
      const lines = splitLines(node.children);
      // The final newline of a listing does not start another line.
      if (lines.length > 1 && lines.at(-1)!.length === 0) lines.pop();
      node.children = lines.map((children) => ({
        type: "element",
        tagName: "span",
        properties: { className: ["line"] },
        children,
      }));
      return SKIP;
    });
  };
}

function splitLines(nodes: ElementContent[]): ElementContent[][] {
  const lines: ElementContent[][] = [[]];
  for (const node of nodes) {
    if (node.type === "text") {
      node.value.split("\n").forEach((part, i) => {
        if (i > 0) lines.push([]);
        if (part) lines.at(-1)!.push({ type: "text", value: part });
      });
    } else if (node.type === "element") {
      splitLines(node.children).forEach((children, i) => {
        if (i > 0) lines.push([]);
        if (children.length > 0) lines.at(-1)!.push({ ...node, children });
      });
    }
  }
  return lines;
}
