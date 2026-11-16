/**
 * Mermaid diagrams, drawn to SVG at build time by pele (https://pele.run).
 *
 * `diagramHtml` is the one place a diagram becomes HTML. A blog post reaches it
 * through `lstlisting[language=mermaid]` (rehypeDiagrams in blog/hast.ts) and a
 * project page through a ```mermaid fence (projects/markdown.ts). pele is
 * synchronous and has no DOM requirement, so nothing is drawn in the browser:
 * the page ships plain SVG, coloured by `--pele-*` custom properties that
 * globals.css maps to the site's own theme tokens (light and dark alike).
 *
 * Server code only: it imports pele.
 */
import { PeleError, render } from "pele";
import { escapeHtml } from "./blog/text";

/** The words around a diagram. A blog post passes its own language's. */
export interface DiagramWords {
  /** Fallback accessible name when the author gives none. */
  diagram: string;
  /** The toggle over the Mermaid text. */
  showSource: string;
  /** The line over a diagram that could not be drawn. */
  failed: string;
}

export const DIAGRAM_WORDS: DiagramWords = {
  diagram: "Diagram",
  showSource: "Show diagram source",
  failed: "This diagram could not be drawn",
};

export interface DiagramOptions {
  /** What the diagram shows, for screen readers (the SVG itself is hidden from them). */
  label?: string;
  words?: DiagramWords;
  /** Where the diagram is written, for the development warning. */
  where?: string;
}

/** Remove the indentation every line shares, and the blank lines around the text. */
function dedent(source: string): string {
  const lines = source.replace(/\r\n?/g, "\n").replace(/^\n+/, "").trimEnd().split("\n");
  const indents = lines.filter((line) => line.trim()).map((line) => /^[ \t]*/.exec(line)![0].length);
  const strip = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(strip)).join("\n");
}

/**
 * HTML for one diagram: the SVG, and the Mermaid text behind a toggle — the
 * only way a screen reader gets at the content, as with the bar chart's table.
 * Invalid Mermaid never throws: the page shows what pele said and the source,
 * so one typo cannot fail a build, and a warning goes to the terminal outside
 * production.
 */
export function diagramHtml(source: string, options: DiagramOptions = {}): string {
  const { label, words = DIAGRAM_WORDS, where } = options;
  const text = dedent(source);
  const code = `<pre><code>${escapeHtml(text)}</code></pre>`;

  try {
    const { svg } = render(text);
    return (
      `<div class="diagram" role="img" aria-label="${escapeHtml(label || words.diagram)}">${svg}</div>` +
      `<details class="diagram-source"><summary>${escapeHtml(words.showSource)}</summary>${code}</details>`
    );
  } catch (error) {
    const message = error instanceof PeleError || error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[diagram] ${where ? `${where}: ` : ""}${message.split("\n")[0]}`);
    }
    return (
      `<div class="diagram diagram-error" role="group">` +
      `<p>${escapeHtml(words.failed)}.</p><pre class="diagram-error-message">${escapeHtml(message)}</pre>${code}</div>`
    );
  }
}
