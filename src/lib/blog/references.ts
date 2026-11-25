/**
 * Resolving `\ref` and `\cite`.
 *
 * Both arrive as `<span data-ref>` placeholders and are settled only after
 * every chapter has rendered, because a chapter may point at a figure or
 * theorem defined in a later one.
 */
import type { LabelTarget } from "./latex";
import { escapeHtml } from "./text";

/**
 * Number the bibliography the way `thebibliography` does: in the order of the
 * `\bibitem`s, whatever order they are cited in. The PDF built from the same
 * source prints the same numbers.
 */
export function numberBibliography(entries: { id: string }[]): Map<string, number> {
  return new Map(entries.map((entry, i) => [entry.id, i + 1]));
}

const PLACEHOLDER =
  /<span data-ref="([^"]+)" data-macro="([^"]+)"(?: data-note="([^"]*)")?><\/span>/g;

/**
 * Fill in the `\ref` / `\cite` placeholders left behind during rendering.
 *
 * This runs only after every chapter has been rendered, because a chapter may
 * legitimately point at a figure or theorem that appears in a later one. A key
 * naming a declared `\label` is a cross-reference; anything else is a citation.
 * A key that is neither renders visibly as `[?key]` rather than vanishing.
 */
export function resolveRefs(
  html: string,
  labels: Map<string, LabelTarget>,
  citations: Map<string, number>,
  currentHref: string,
  bibliographyHref: string = currentHref
): string {
  const hrefOf = (target: LabelTarget) =>
    target.href === currentHref ? `#${target.anchor}` : `${target.href}#${target.anchor}`;

  // The list is printed on one page (the last); a citation elsewhere links there.
  const refHref = (key: string) =>
    `${bibliographyHref === currentHref ? "" : bibliographyHref}#ref-${escapeHtml(key)}`;

  return html.replaceAll(PLACEHOLDER, (_match, keyList: string, macro: string, note?: string) => {
    const keys = keyList.split(",");

    // \cite{a,b} → one bracket: [2, 3], or [4, p. 212] with a note. The note
    // is already escaped — it comes straight out of the serialised attribute.
    if (macro === "cite") {
      const items = keys.map((key) => {
        const number = citations.get(key);
        return number === undefined
          ? `<span class="xref-missing">?${escapeHtml(key)}</span>`
          : `<a href="${refHref(key)}">${number}</a>`;
      });
      if (note) items.push(note);
      return `<span class="citation">[${items.join(", ")}]</span>`;
    }

    return keys
      .map((key) => {
        const target = labels.get(key);
        if (target) {
          const href = escapeHtml(hrefOf(target));
          return `<a class="xref" href="${href}">${referenceText(target, macro)}</a>`;
        }
        const number = citations.get(key);
        if (number !== undefined) {
          return `<span class="citation">[<a href="${refHref(key)}">${number}</a>]</span>`;
        }
        return `<span class="xref-missing">[?${escapeHtml(key)}]</span>`;
      })
      .join(", ");
  });
}

/**
 * What a reference prints — exactly what LaTeX prints for the same macro, so
 * the PDF of a post and its web page read the same:
 *  - `\ref`     → the number alone: "3", "2.1", "A" (write `Figure~\ref{x}`)
 *  - `\eqref`   → "(3)"
 *  - `\Cref`, `\autoref` → "Figure 3", "Equation (3)" (cleveref, `noabbrev`)
 *  - `\cref`    → "figure 3"
 */
function referenceText(target: LabelTarget, macro: string): string {
  const number = target.kind === "equation" ? `(${target.number})` : target.number;
  switch (macro) {
    case "eqref":
      return `(${target.number})`;
    case "Cref":
    case "autoref":
      return `${target.word}&nbsp;${number}`;
    case "cref":
      return `${target.word.toLowerCase()}&nbsp;${number}`;
    default:
      return target.number;
  }
}

/** Where `\printbibliography` / `thebibliography` stood in the rendered HTML. */
export const BIBLIOGRAPHY_PLACEHOLDER = '<div data-bibliography="true"></div>';

/** The full reference list, in `\bibitem` order. */
export function renderBibliography(
  entries: { id: string; html: string }[],
  numbers: Map<string, number>
): string {
  if (entries.length === 0) return "";
  const items = entries
    .map(
      (entry) =>
        `<li id="ref-${escapeHtml(entry.id)}"><span class="ref-number">[${numbers.get(entry.id)}]</span> <span class="ref-entry">${entry.html}</span></li>`
    )
    .join("");
  return `<ol class="references">${items}</ol>`;
}
