/**
 * Cut a document into pieces a model can translate in one call, at blank lines,
 * never inside a code block. `chunks.join("")` is the original text again, so a
 * translated document is the translated pieces glued together in the same places.
 */

type Kind = "latex" | "markdown";

/** A line that opens (and the one that closes) a block that must not be cut. */
function opensCode(line: string, kind: Kind): RegExp | null {
  if (kind === "markdown") {
    const fence = /^\s*(```|~~~)/.exec(line);
    return fence ? new RegExp(`^\\s*${fence[1]}`) : null;
  }
  const begin = /\\begin\{(lstlisting|minted|verbatim)\}/.exec(line);
  return begin ? new RegExp(`\\\\end\\{${begin[1]}\\}`) : null;
}

/** Paragraph-sized units, each with the blank lines after it. */
function units(text: string, kind: Kind): string[] {
  const lines = text.split(/(?<=\n)/);
  const result: string[] = [];
  let current = "";
  let closer: RegExp | null = null;
  let afterBlank = false;

  for (const line of lines) {
    const blank = line.trim() === "";
    // A new unit starts at the first text line after a run of blank lines.
    if (!closer && afterBlank && !blank) {
      result.push(current);
      current = "";
    }
    current += line;
    afterBlank = blank;

    if (closer) {
      if (closer.test(line)) closer = null;
    } else {
      closer = opensCode(line, kind);
      // A fence that opens and closes on one line (LaTeX) is already closed.
      if (closer && kind === "latex" && closer.test(line.slice(line.search(/\\begin/) + 6))) closer = null;
    }
  }
  if (current) result.push(current);
  return result;
}

export function chunkDocument(text: string, kind: Kind, maxChars = 5000): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const unit of units(text, kind)) {
    if (current && current.length + unit.length > maxChars) {
      chunks.push(current);
      current = "";
    }
    current += unit;
  }
  if (current) chunks.push(current);
  return chunks;
}
