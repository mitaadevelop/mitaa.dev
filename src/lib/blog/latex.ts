/**
 * LaTeX → HTML for blog posts.
 *
 * Posts are real `.tex` files. `@unified-latex` parses them and can translate
 * the structural parts (sectioning, emphasis, lists, tabular, verbatim) on its
 * own, but it deliberately leaves semantics alone: `\label`, `\ref`, `\caption`,
 * `\footnote` and `\cite` come out of its HTML converter as raw `macro` spans.
 * So all of that is resolved here, on the LaTeX AST, before conversion — using
 * unified-latex's `\html-tag:` / `\html-attr:` escape hatch to emit the markup
 * this blog already styles.
 */
import { unified } from "unified";
import { unifiedLatexFromString } from "@unified-latex/unified-latex-util-parse";
import { printRaw } from "@unified-latex/unified-latex-util-print-raw";

import type { Lang } from "./i18n";
import { DEFAULT_LANG, parseLang, strings } from "./i18n";

/** Where a `\ref`/`\cite` points, and what it should read. */
export interface LabelTarget {
  /** Display word, e.g. "Figure", "Tabel", "Theorem". */
  word: string;
  /** "3", "2.1", "A" — whatever LaTeX would print for `\ref`. */
  number: string;
  kind: "section" | "figure" | "table" | "theorem" | "equation" | "listing";
  /** Element id within its page. */
  anchor: string;
  /** Href of the chapter the target lives on. */
  href: string;
}

/**
 * LaTeX's counters, carried across chapters so a post numbers continuously the
 * way the PDF of the same source does.
 */
export interface Counters {
  figure: number;
  table: number;
  /** Shared by theorem, lemma, proposition, corollary and definition. */
  theorem: number;
  example: number;
  equation: number;
  listing: number;
  footnote: number;
  section: number;
  subsection: number;
  subsubsection: number;
  /** Set by `\appendix`: sections count A, B, C from there on. */
  appendix: boolean;
}

export interface RenderContext {
  counters: Counters;
  /** Filled in as chapters render; consumed afterwards to resolve references. */
  labels: Map<string, LabelTarget>;
  /** Href of the chapter currently being rendered. */
  chapterHref: string;
  lang: Lang;
}

export function emptyCounters(): Counters {
  return {
    figure: 0,
    table: 0,
    theorem: 0,
    example: 0,
    equation: 0,
    listing: 0,
    footnote: 0,
    section: 0,
    subsection: 0,
    subsubsection: 0,
    appendix: false,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

/** Custom metadata macros, plus signatures the parser cannot guess. */
const MACRO_SIGNATURES: Record<string, { signature: string }> = {
  excerpt: { signature: "m" },
  tags: { signature: "m" },
  coverimage: { signature: "m" },
  xpost: { signature: "m" },
  paginate: { signature: "m" },
  subtitle: { signature: "m" },
  affiliation: { signature: "m" },
  version: { signature: "m m" },
  keywords: { signature: "m" },
  kind: { signature: "m" },
  pdf: { signature: "m" },
  lang: { signature: "m" },
  draft: { signature: "" },
  printbibliography: { signature: "" },
};

/** Preamble macros: read into metadata, never rendered. */
const METADATA_MACROS = [
  "title", "date", "author", "excerpt", "tags", "coverimage", "xpost", "paginate",
  "subtitle", "affiliation", "version", "keywords", "kind", "pdf", "lang", "draft",
  "documentclass", "usepackage", "maketitle",
];

/** Environments that take an optional `[Title]`. */
const TITLED_ENVIRONMENTS = [
  "theorem", "lemma", "proposition", "corollary", "definition", "example", "proof",
  "note", "tip", "warning", "important", "caution", "abstract", "quote", "barchart",
];

const ENVIRONMENT_SIGNATURES: Record<string, { signature: string }> = Object.fromEntries(
  TITLED_ENVIRONMENTS.map((name) => [name, { signature: "o" }])
);

type WordKey = keyof ReturnType<typeof strings>;

const THEOREM_KINDS: Record<string, { word: WordKey; counter: "theorem" | "example" | null }> = {
  theorem: { word: "theorem", counter: "theorem" },
  lemma: { word: "lemma", counter: "theorem" },
  proposition: { word: "proposition", counter: "theorem" },
  corollary: { word: "corollary", counter: "theorem" },
  definition: { word: "definition", counter: "theorem" },
  example: { word: "example", counter: "example" },
  proof: { word: "proof", counter: null },
};

const CALLOUT_KINDS = new Set(["note", "tip", "warning", "important", "caution"]);

const VERBATIM_ENVIRONMENTS = new Set(["verbatim", "lstlisting", "minted"]);

/** Numbered display-math environments that KaTeX would otherwise number on its own. */
const NUMBERED_MATH = new Set(["equation"]);

/**
 * Macros that stand for a single character.
 *
 * unified-latex's HTML converter does not know some of these and emits an
 * empty `<span class="macro macro-…">` for each, which silently swallows the
 * character — that is how `\textbackslash` once disappeared from 78 places.
 * The control symbols (`\%`, `\&`, …) it does know, but it drops the space
 * that follows them, which LaTeX keeps: `10\% \& more` must not read
 * "10%&more". As plain strings they keep their neighbours.
 */
const TEXT_SYMBOL_MACROS: Record<string, string> = {
  textbackslash: "\\",
  textasciitilde: "~",
  textasciicircum: "^",
  textbar: "|",
  textless: "<",
  textgreater: ">",
  textunderscore: "_",
  textbullet: "•",
  textdegree: "°",
  ldots: "…",
  dots: "…",
  textellipsis: "…",
  textemdash: "—",
  textendash: "–",
  quad: "\u2003",
  qquad: "\u2003\u2003",
  "%": "%",
  "&": "&",
  "#": "#",
  $: "$",
  _: "_",
  "{": "{",
  "}": "}",
  // \, is a thin space LaTeX will not break at: "10\,ms".
  ",": "\u202F",
  ";": " ",
  ":": " ",
  "!": "",
  " ": " ",
  // A discretionary hyphen: invisible unless the line breaks there.
  "-": "\u00AD",
  "@": "",
  "/": "",
};

/** Page layout and spacing commands with no meaning on a web page. */
const IGNORED_MACROS = new Set([
  "clearpage", "newpage", "pagebreak", "nopagebreak", "noindent", "centering",
  "tableofcontents", "listoffigures", "listoftables", "smallskip", "medskip",
  "bigskip", "vspace", "hspace", "vfill", "hfill", "bibliographystyle",
  "raggedright", "raggedleft", "par",
]);

/** Macros that end a page in a post written as pages (see splitLatexChapters). */
const PAGE_BREAKS = new Set(["clearpage", "newpage"]);

/**
 * Every macro and environment this module gives meaning to. A test checks that
 * each one is used by at least one post in content/blog/, so the fixtures (and
 * their snapshots) cover all of it; content/blog/mitaa.sty defines the same
 * set for real LaTeX.
 */
export const SUPPORTED = {
  macros: [
    ...METADATA_MACROS.filter((name) => !["documentclass", "usepackage", "maketitle"].includes(name)),
    "section", "subsection", "subsubsection", "appendix", "clearpage",
    "label", "ref", "Cref", "cref", "autoref", "eqref", "cite",
    "footnote", "caption", "includegraphics", "bibitem",
  ],
  environments: [
    ...TITLED_ENVIRONMENTS,
    ...VERBATIM_ENVIRONMENTS,
    ...NUMBERED_MATH,
    "figure", "table", "tabular", "thebibliography",
  ],
};

/* ------------------------------------------------------------------ */
/* AST builders                                                        */
/* ------------------------------------------------------------------ */

const arg = (content: Node[]): Node => ({
  type: "argument",
  openMark: "{",
  closeMark: "}",
  content,
});

const text = (value: string): Node => ({ type: "string", content: value });

/** Attribute values are JSON-parsed by the HTML converter, so encode them. */
const attr = (name: string, value: string): Node => ({
  type: "macro",
  content: `html-attr:${name}`,
  args: [arg([text(JSON.stringify(value))])],
});

const tag = (name: string, attrs: Node[], children: Node[]): Node => ({
  type: "macro",
  content: `html-tag:${name}`,
  args: [arg([...attrs, ...children])],
});

/* ------------------------------------------------------------------ */
/* Reading the AST                                                     */
/* ------------------------------------------------------------------ */

/** Content of a macro's nth mandatory argument, as LaTeX source. */
function argRaw(node: Node, index = -1): string {
  const args = (node.args ?? []).filter((a: Node) => a.openMark === "{");
  const picked = index < 0 ? args.at(index) : args[index];
  return picked ? printRaw(picked.content).trim() : "";
}

/** Nodes of a macro's nth mandatory argument. */
function argNodes(node: Node, index = -1): Node[] {
  const args = (node.args ?? []).filter((a: Node) => a.openMark === "{");
  const picked = index < 0 ? args.at(index) : args[index];
  return picked ? picked.content : [];
}

/** Content of the first optional `[...]` argument. */
function optionalNodes(node: Node): Node[] {
  const picked = (node.args ?? []).find((a: Node) => a.openMark === "[");
  return picked ? picked.content : [];
}

function optionalRaw(node: Node): string {
  const picked = (node.args ?? []).find((a: Node) => a.openMark === "[");
  return picked ? printRaw(picked.content).trim() : "";
}

/** Readable text from an AST fragment, with macros dropped. */
export function toPlainText(nodes: Node[]): string {
  let out = "";
  for (const node of nodes) {
    if (node.type === "string") out += node.content === "~" ? "\u00A0" : node.content;
    else if (node.type === "whitespace") out += " ";
    else if (node.type === "group") out += toPlainText(node.content);
    else if (node.type === "macro" && node.content in TEXT_SYMBOL_MACROS) out += TEXT_SYMBOL_MACROS[node.content];
    else if (node.type === "macro") out += toPlainText(argNodes(node));
    else if (node.type === "environment") out += toPlainText(node.content);
  }
  // Not \s: that would also flatten the non-breaking space a `~` stands for.
  return typographic(out.replaceAll(/[ \t\r\n]+/g, " ").trim());
}

/**
 * TeX's input ligatures, which the HTML converter applies to running text but
 * which plain text (titles, the subtitle, the TOC) would otherwise show raw:
 * "2019--2025" must read "2019–2025".
 */
function typographic(value: string): string {
  return value
    .replaceAll("---", "—")
    .replaceAll("--", "–")
    .replaceAll("``", "“")
    .replaceAll("''", "”")
    .replaceAll("`", "‘")
    .replaceAll("'", "’");
}

function findFirstMacro(nodes: Node[], name: string): Node | null {
  for (const node of nodes) {
    if (node.type === "macro" && node.content === name) return node;
    const nested =
      node.type === "environment" || node.type === "group"
        ? findFirstMacro(node.content ?? [], name)
        : null;
    if (nested) return nested;
  }
  return null;
}

/** Remove every occurrence of the named macros from a subtree. */
function stripMacros(nodes: Node[], names: string[]): Node[] {
  const out: Node[] = [];
  for (const node of nodes) {
    if (node.type === "macro" && names.includes(node.content)) continue;
    if (node.type === "environment" || node.type === "group") {
      out.push({ ...node, content: stripMacros(node.content ?? [], names) });
    } else {
      out.push(node);
    }
  }
  return out;
}

/** `\section*` and friends: the star arrives as the macro's first argument. */
function isStarred(node: Node): boolean {
  const first = node.args?.[0];
  return first?.openMark === "" && printRaw(first.content) === "*";
}

/**
 * `key=value, other={a, b}` → a map, the way keyval reads it: top-level commas
 * separate entries and one pair of outer braces is dropped from a value.
 */
export function parseKeyVals(raw: string): Map<string, string> {
  const out = new Map<string, string>();
  let depth = 0;
  let current = "";
  const flush = () => {
    const entry = current.trim();
    current = "";
    if (!entry) return;
    const eq = entry.indexOf("=");
    const key = (eq < 0 ? entry : entry.slice(0, eq)).trim();
    let value = eq < 0 ? "" : entry.slice(eq + 1).trim();
    if (value.startsWith("{") && value.endsWith("}")) value = value.slice(1, -1).trim();
    out.set(key, value);
  };
  for (const char of raw) {
    if (char === "{") depth++;
    if (char === "}") depth--;
    if (char === "," && depth === 0) flush();
    else current += char;
  }
  flush();
  return out;
}

/** Split on top-level commas, respecting braces: `{met systeem}, zonder`. */
function splitList(raw: string): string[] {
  return [...parseKeyVals(raw).keys()].map((item) =>
    item.startsWith("{") && item.endsWith("}") ? item.slice(1, -1).trim() : item
  );
}

function parseNodes(source: string): Node[] {
  const parsed: Node = unified()
    .use(unifiedLatexFromString as never, {
      macros: MACRO_SIGNATURES,
      environments: ENVIRONMENT_SIGNATURES,
    })
    .parse(source);
  return parsed.content ?? [];
}

/* ------------------------------------------------------------------ */
/* Parsing a document                                                  */
/* ------------------------------------------------------------------ */

export interface LatexMeta {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  image?: string;
  xPostUrl?: string;
  pagination: string;
  lang: Lang;
  author: string;
  subtitle: string;
  affiliation: string;
  version?: { label: string; date?: string };
  keywords: string[];
  kind: string;
  pdf: string;
  draft: boolean;
}

export interface LatexBibEntry {
  id: string;
  nodes: Node[];
}

export interface LatexDocument {
  meta: LatexMeta;
  /** Top-level body nodes, with the preamble removed. */
  body: Node[];
  bibliography: LatexBibEntry[];
}

/**
 * The language a document declares, LaTeX-style: babel's last option is its
 * main language. `\lang{nl}` is the short form and wins if both are present.
 */
function readLang(all: Node[]): Lang {
  const explicit = findFirstMacro(all, "lang");
  const fromMacro = explicit ? parseLang(argRaw(explicit)) : undefined;
  if (fromMacro) return fromMacro;
  for (const node of all) {
    if (node.type !== "macro" || node.content !== "usepackage") continue;
    if (!argRaw(node).split(",").some((name) => name.trim() === "babel")) continue;
    const options = optionalRaw(node).split(",").map((o) => o.trim()).filter(Boolean);
    const main = options.at(-1);
    const lang = main ? parseLang(main) : undefined;
    if (lang) return lang;
  }
  return DEFAULT_LANG;
}

export function parseLatex(source: string): LatexDocument {
  const all = parseNodes(source);
  const read = (name: string) => {
    const macro = findFirstMacro(all, name);
    return macro ? toPlainText(argNodes(macro)) : "";
  };

  // A post may wrap its body in \begin{document}; if it does, only that counts.
  const documentEnv = all.find(
    (node) => node.type === "environment" && printRaw(node.env) === "document"
  );
  let body: Node[] = documentEnv ? documentEnv.content : all;

  // Drop metadata macros that would otherwise render into the page.
  body = stripMacros(body, METADATA_MACROS);

  // The bibliography is collected here and printed where the environment
  // stood — usually the end of the last page — as LaTeX does.
  const bibliography: LatexBibEntry[] = [];
  body = body.map((node) => {
    if (node.type !== "environment" || printRaw(node.env) !== "thebibliography") return node;
    let current: LatexBibEntry | null = null;
    for (const child of node.content ?? []) {
      if (child.type === "macro" && child.content === "bibitem") {
        // Parsed like `\item`: the entry text is the macro's last, unbracketed
        // argument, not the nodes that follow it.
        const text = child.args?.at(-1);
        current = { id: argRaw(child), nodes: text?.openMark === "" ? [...text.content] : [] };
        bibliography.push(current);
      } else if (current) {
        current.nodes.push(child);
      }
    }
    return { type: "macro", content: "printbibliography" };
  });

  const tagList = read("tags");
  const keywordList = read("keywords");
  const image = read("coverimage");
  const xpost = read("xpost");
  const versionMacro = findFirstMacro(all, "version");

  return {
    meta: {
      title: read("title"),
      date: read("date"),
      excerpt: read("excerpt"),
      tags: tagList ? tagList.split(",").map((t) => t.trim()).filter(Boolean) : [],
      image: image || undefined,
      xPostUrl: xpost || undefined,
      pagination: read("paginate") || "auto",
      lang: readLang(all),
      author: read("author"),
      subtitle: read("subtitle"),
      affiliation: read("affiliation"),
      version: versionMacro
        ? {
            label: toPlainText(argNodes(versionMacro, 0)),
            date: toPlainText(argNodes(versionMacro, 1)) || undefined,
          }
        : undefined,
      keywords: keywordList ? keywordList.split(",").map((k) => k.trim()).filter(Boolean) : [],
      kind: read("kind"),
      pdf: read("pdf"),
      draft: findFirstMacro(all, "draft") !== null,
    },
    body,
    bibliography,
  };
}

/**
 * Take the abstract out of the text that precedes the first `\section`, so the
 * header can show it — the place `\maketitle` puts it in a printed report. An
 * abstract further down, inside a section, stays where it is.
 */
export function extractAbstract(body: Node[]): { body: Node[]; abstract: Node | null } {
  const firstSection = body.findIndex(
    (node) => node.type === "macro" && node.content === "section"
  );
  const end = firstSection < 0 ? body.length : firstSection;
  const index = body
    .slice(0, end)
    .findIndex((node) => node.type === "environment" && printRaw(node.env) === "abstract");
  if (index < 0) return { body, abstract: null };
  return { body: [...body.slice(0, index), ...body.slice(index + 1)], abstract: body[index] };
}

/** An abstract's optional `[Title]` and its body, for the post header. */
export function abstractParts(node: Node): { title: string; nodes: Node[] } {
  return { title: toPlainText(optionalNodes(node)), nodes: stripMacros(node.content ?? [], ["label"]) };
}

export interface LatexChapter {
  index: number;
  title: string;
  /** True for a page that starts after `\appendix`. */
  appendix: boolean;
  nodes: Node[];
}

const isSection = (node: Node) =>
  node.type === "macro" && node.content === "section" && !isStarred(node);

const isBlank = (nodes: Node[]) =>
  nodes.every((node) => node.type === "whitespace" || node.type === "parbreak" || node.type === "comment");

/**
 * Split a document body into chapters — the pages a long post is served as.
 *
 * A post written with explicit `\clearpage`s is split exactly there, so one
 * page can hold several sections. Otherwise each numbered `\section` starts a
 * page. Either way this partitions the node array rather than slicing the
 * source, so a `\section` inside a verbatim block cannot split a post — the
 * parser has already decided it is not a macro.
 */
export function splitLatexChapters(body: Node[]): {
  lead: Node[];
  chapters: LatexChapter[];
  /** True when the post set its own page breaks with `\clearpage`. */
  byPage: boolean;
} {
  const byPageBreak = body.some((node) => node.type === "macro" && PAGE_BREAKS.has(node.content));

  if (byPageBreak) {
    const pages: Node[][] = [[]];
    for (const node of body) {
      if (node.type === "macro" && PAGE_BREAKS.has(node.content)) pages.push([]);
      else pages.at(-1)!.push(node);
    }
    let appendix = false;
    const chapters: LatexChapter[] = [];
    for (const nodes of pages) {
      if (isBlank(nodes)) continue;
      // A page belongs to the appendices if \appendix came before its first section.
      const firstSection = nodes.findIndex(isSection);
      const marker = nodes.findIndex((n) => n.type === "macro" && n.content === "appendix");
      const pageIsAppendix = appendix || (marker >= 0 && (firstSection < 0 || marker < firstSection));
      if (marker >= 0) appendix = true;
      chapters.push({
        index: chapters.length + 1,
        title: firstSection >= 0 ? toPlainText(argNodes(nodes[firstSection])) : "",
        appendix: pageIsAppendix,
        nodes,
      });
    }
    return { lead: [], chapters, byPage: true };
  }

  const starts: number[] = [];
  body.forEach((node, i) => {
    if (isSection(node)) starts.push(i);
  });
  if (starts.length === 0) return { lead: body, chapters: [], byPage: false };

  const lead = body.slice(0, starts[0]);
  let appendix = lead.some((n) => n.type === "macro" && n.content === "appendix");
  const chapters = starts.map((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1] : body.length;
    const chapter = {
      index: i + 1,
      title: toPlainText(argNodes(body[start])),
      appendix,
      nodes: body.slice(start, end),
    };
    if (chapter.nodes.some((n: Node) => n.type === "macro" && n.content === "appendix")) appendix = true;
    return chapter;
  });
  return { lead, chapters, byPage: false };
}

/* ------------------------------------------------------------------ */
/* Semantic transform                                                  */
/* ------------------------------------------------------------------ */

export interface LatexRenderState {
  ctx: RenderContext;
  /** Footnotes collected while transforming the current chapter. */
  footnotes: { number: number; nodes: Node[] }[];
  /** Alt text for an `\includegraphics` inside the figure being transformed. */
  figureAlt?: string;
}

/** A `\ref`/`\cite` placeholder, resolved once every chapter is rendered. */
function refPlaceholder(keys: string[], macro: string, note: string): Node {
  return tag(
    "span",
    [
      attr("data-ref", keys.join(",")),
      attr("data-macro", macro),
      ...(note ? [attr("data-note", note)] : []),
    ],
    []
  );
}

/** "Figuur 3:" — the label LaTeX prints in front of a caption. */
function captionLabel(className: string, word: string, number: number): Node {
  return tag("span", [attr("className", className)], [text(`${word} ${number}:`)]);
}

function transformNodes(nodes: Node[], state: LatexRenderState): Node[] {
  const out: Node[] = [];
  for (const node of nodes) {
    const replacement = transformNode(node, state);
    if (Array.isArray(replacement)) out.push(...replacement);
    else if (replacement !== null) out.push(replacement);
  }
  return out;
}

function transformMacro(node: Node, state: LatexRenderState): Node | Node[] | null {
  const { ctx } = state;
  const words = strings(ctx.lang);

  switch (node.content) {
    // A \label left over once environments have taken theirs belongs to the
    // last heading, as in LaTeX. The heading is numbered in the hast stage,
    // so it is registered there.
    case "label":
      return tag("span", [attr("data-label", argRaw(node))], []);
    case "ref":
    case "Cref":
    case "cref":
    case "autoref":
    case "eqref":
    case "cite": {
      const keys = argRaw(node)
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean);
      // \cite[p.~212]{key}: the optional argument is a note after the numbers.
      const note = node.content === "cite" ? toPlainText(optionalNodes(node)).replaceAll("~", " ") : "";
      return keys.length > 0 ? refPlaceholder(keys, node.content, note) : null;
    }
    case "footnote": {
      // Footnotes number through the whole document, as in LaTeX; each page
      // lists its own.
      ctx.counters.footnote += 1;
      const number = ctx.counters.footnote;
      state.footnotes.push({ number, nodes: transformNodes(argNodes(node), state) });
      return tag("sup", [attr("className", "footnote-ref")], [
        tag(
          "a",
          [attr("id", `fnref-${number}`), attr("href", `#fn-${number}`), attr("data-footnote-ref", "true")],
          [text(String(number))]
        ),
      ]);
    }
    case "appendix":
      return tag("span", [attr("data-appendix", "true")], []);
    case "printbibliography":
      return [
        tag("h3", [attr("className", "starred references-title")], [text(words.references)]),
        tag("div", [attr("data-bibliography", "true")], []),
      ];
    case "includegraphics": {
      // \includegraphics[width=0.4\textwidth] → a CSS percentage of the column.
      const widthMatch = /width\s*=\s*([\d.]+)\s*\\(?:text|line)width/.exec(optionalRaw(node));
      const widthAttr = widthMatch
        ? [attr("style", `max-width:${Math.round(Number(widthMatch[1]) * 100)}%`)]
        : [];
      return tag("img", [attr("src", argRaw(node)), attr("alt", state.figureAlt ?? ""), ...widthAttr], []);
    }
    default:
      break;
  }
  if (IGNORED_MACROS.has(node.content)) return null;
  if (node.content in TEXT_SYMBOL_MACROS) {
    return text(TEXT_SYMBOL_MACROS[node.content]);
  }
  if (node.args) {
    return {
      ...node,
      args: node.args.map((a: Node) => ({ ...a, content: transformNodes(a.content ?? [], state) })),
    };
  }
  return node;
}

/**
 * `equation`: number it on LaTeX's counter and hand KaTeX the number as a
 * `\tag`. KaTeX numbers `equation` itself, but per formula — every one would
 * read (1).
 */
function transformNumberedMath(node: Node, state: LatexRenderState): Node {
  const { ctx } = state;
  const content: Node[] = node.content ?? [];
  const labelMacro = findFirstMacro(content, "label");
  const label = labelMacro ? argRaw(labelMacro) : undefined;
  const hasOwnTag = findFirstMacro(content, "tag") !== null || findFirstMacro(content, "notag") !== null;

  const math = stripMacros(content, ["label"]);
  if (hasOwnTag) {
    return { type: "displaymath", content: math };
  }
  ctx.counters.equation += 1;
  const number = ctx.counters.equation;
  const anchor = label ?? `eq-${number}`;
  if (label) {
    ctx.labels.set(label, {
      word: strings(ctx.lang).equation,
      number: String(number),
      kind: "equation",
      anchor,
      href: ctx.chapterHref,
    });
  }
  return tag("div", [attr("id", anchor), attr("className", "equation")], [
    {
      type: "displaymath",
      content: [...math, { type: "macro", content: "tag", args: [arg([text(String(number))])] }],
    },
  ]);
}

/** A code listing, with the header the post design gives every block of code. */
function transformListing(node: Node, name: string, state: LatexRenderState): Node {
  const { ctx } = state;
  const words = strings(ctx.lang);
  const raw = printRaw(node.content ?? []);
  const options = parseKeyVals(optionalRaw(node));

  let language = "";
  if (name === "minted") language = argRaw(node);
  else if (name === "lstlisting") language = options.get("language") ?? "";
  language = language.toLowerCase();

  // listings' `title=` and minted's `filename=` are unnumbered labels; a
  // listings `caption=` is numbered, like a figure.
  const file = options.get("title") ?? options.get("filename") ?? "";
  const caption = options.get("caption") ?? "";
  const head: Node[] = [];
  if (caption) {
    ctx.counters.listing += 1;
    const label = options.get("label");
    const number = ctx.counters.listing;
    if (label) {
      ctx.labels.set(label, {
        word: words.listing,
        number: String(number),
        kind: "listing",
        anchor: label,
        href: ctx.chapterHref,
      });
    }
    head.push(
      tag("span", [attr("className", "listing-file")], [
        captionLabel("listing-number", words.listing, number),
        text(" "),
        ...transformNodes(parseNodes(caption), state),
      ])
    );
  } else {
    head.push(tag("span", [attr("className", "listing-file")], file ? [text(file)] : []));
  }

  const codeAttrs = language ? [attr("className", `language-${language}`)] : [];
  const label = options.get("label");
  return tag(
    "figure",
    [attr("className", "listing"), ...(label ? [attr("id", label)] : [])],
    [
      tag("figcaption", [attr("className", "listing-head")], [
        ...head,
        tag("span", [attr("className", "listing-meta")], [
          // The site's own language chip (globals.css colours it per language).
          ...(language
            ? [tag("span", [attr("className", "code-lang-label"), attr("data-lang", language)], [text(language)])]
            : []),
          tag(
            "button",
            [
              attr("type", "button"),
              attr("className", "listing-copy"),
              attr("data-copy", "true"),
              attr("aria-label", words.copyCode),
              attr("data-copied-label", words.copied),
            ],
            [text(words.copy)]
          ),
        ]),
      ]),
      tag("pre", [], [tag("code", codeAttrs, [text(raw.replace(/^\n/, "").replace(/\n$/, ""))])]),
    ]
  );
}

/**
 * `barchart`: a grouped bar chart drawn from a table of numbers.
 *
 *   \begin{barchart}[ylabel={$\sigma$ (ms)}, series={met systeem, zonder}]
 *   Marketing & 66 & 139 \\
 *   Webapp    & 72 & 151 \\
 *   \end{barchart}
 *
 * Rendered as static HTML — bar heights are percentages of the largest value,
 * each bar's value in its hover title — with the numbers in a table behind a
 * "show as table" toggle. `mitaa.sty` draws the same data with pgfplots.
 */
function transformBarchart(node: Node, state: LatexRenderState): Node {
  const { ctx } = state;
  const { locale } = strings(ctx.lang);
  const options = parseKeyVals(optionalRaw(node));
  const rows = printRaw(node.content ?? [])
    .split("\\\\")
    .map((row) => row.split("&").map((cell) => cell.trim()))
    .filter((cells) => cells.some(Boolean))
    .map(([label, ...values]) => ({
      label: label.replace(/^\{|\}$/g, ""),
      values: values.map((v) => Number(v.replace(",", "."))),
    }));

  const seriesCount = Math.max(0, ...rows.map((row) => row.values.length));
  const declared = splitList(options.get("series") ?? "");
  const series = Array.from({ length: seriesCount }, (_, i) => declared[i] ?? `${i + 1}`);
  const max = Math.max(0, ...rows.flatMap((row) => row.values.filter(Number.isFinite)));
  const format = (value: number) => (Number.isFinite(value) ? value.toLocaleString(locale) : "–");
  const ylabel = transformNodes(parseNodes(options.get("ylabel") ?? ""), state);
  const ylabelAgain = transformNodes(parseNodes(options.get("ylabel") ?? ""), state);

  const seriesClass = (i: number) => `barchart-s${(i % 6) + 1}`;

  return tag("div", [attr("className", "barchart")], [
    tag("div", [attr("className", "barchart-head"), attr("aria-hidden", "true")], [
      tag("span", [attr("className", "barchart-axis")], ylabel),
      tag(
        "span",
        [attr("className", "barchart-legend")],
        series.map((name, i) =>
          tag("span", [attr("className", "barchart-key")], [
            tag("span", [attr("className", `barchart-swatch ${seriesClass(i)}`)], []),
            text(name),
          ])
        )
      ),
    ]),
    tag(
      "div",
      [attr("className", "barchart-plot"), attr("aria-hidden", "true")],
      rows.map((row) =>
        tag("div", [attr("className", "barchart-group")], [
          tag(
            "div",
            [attr("className", "barchart-bars")],
            row.values.map((value, i) =>
              tag(
                "span",
                [
                  attr("className", `barchart-bar ${seriesClass(i)}`),
                  attr("style", `height:${max > 0 && Number.isFinite(value) ? ((value / max) * 100).toFixed(2) : 0}%`),
                  attr("title", `${row.label} — ${series[i]}: ${format(value)}`),
                ],
                []
              )
            )
          ),
          tag("span", [attr("className", "barchart-label")], [text(row.label)]),
        ])
      )
    ),
    // The numbers behind the bars, one click away for anyone — and the only
    // way a screen reader gets them, since the bars themselves are hidden.
    tag("details", [attr("className", "barchart-data")], [
      tag("summary", [], [text(strings(ctx.lang).showAsTable)]),
      tag("table", [], [
        ...(ylabelAgain.length > 0 ? [tag("caption", [], ylabelAgain)] : []),
        tag("thead", [], [
          tag("tr", [], [
            tag("td", [], []),
            ...series.map((name) => tag("th", [attr("scope", "col")], [text(name)])),
          ]),
        ]),
        tag(
          "tbody",
          [],
          rows.map((row) =>
            tag("tr", [], [
              tag("th", [attr("scope", "row")], [text(row.label)]),
              ...row.values.map((value) => tag("td", [], [text(format(value))])),
            ])
          )
        ),
      ]),
    ]),
  ]);
}

/** Is `\caption` written before the float's content? Then it is printed above it. */
function captionFirst(children: Node[]): boolean {
  const captionAt = children.findIndex((n) => n.type === "macro" && n.content === "caption");
  const contentAt = children.findIndex(
    (n) => n.type === "environment" || (n.type === "macro" && n.content === "includegraphics")
  );
  return captionAt >= 0 && (contentAt < 0 || captionAt < contentAt);
}

function transformNode(node: Node, state: LatexRenderState): Node | Node[] | null {
  const { ctx } = state;
  const words = strings(ctx.lang);

  if (node.type === "macro") return transformMacro(node, state);

  if (node.type === "group") {
    return { ...node, content: transformNodes(node.content, state) };
  }

  if (node.type === "mathenv" && NUMBERED_MATH.has(printRaw(node.env))) {
    return transformNumberedMath(node, state);
  }

  if (node.type !== "environment") return node;

  const name = printRaw(node.env);
  const children: Node[] = node.content ?? [];
  const labelMacro = findFirstMacro(children, "label");
  const label = labelMacro ? argRaw(labelMacro) : undefined;

  if (VERBATIM_ENVIRONMENTS.has(name)) return transformListing(node, name, state);

  if (name === "barchart") return transformBarchart(node, state);

  if (name === "abstract") {
    const title = transformNodes(optionalNodes(node), state);
    return tag(
      "section",
      [attr("className", "abstract"), ...(label ? [attr("id", label)] : [])],
      [
        tag("p", [attr("className", "abstract-title")], title.length > 0 ? title : [text(words.abstract)]),
        ...transformNodes(stripMacros(children, ["label"]), state),
      ]
    );
  }

  if (CALLOUT_KINDS.has(name)) {
    const title = transformNodes(optionalNodes(node), state);
    return tag(
      "aside",
      [attr("className", `callout callout-${name}`), ...(label ? [attr("id", label)] : [])],
      [
        tag(
          "p",
          [attr("className", "callout-title")],
          title.length > 0 ? title : [text(words[name as WordKey] as string)]
        ),
        ...transformNodes(stripMacros(children, ["label"]), state),
      ]
    );
  }

  if (name === "quote" && optionalNodes(node).length > 0) {
    // \begin{quote}[— Author, p.~212]: the attribution, set flush right.
    return tag("blockquote", [attr("className", "environment quote")], [
      ...transformNodes(children, state),
      tag("footer", [attr("className", "quote-attribution")], transformNodes(optionalNodes(node), state)),
    ]);
  }

  if (name in THEOREM_KINDS) {
    const kind = THEOREM_KINDS[name];
    const word = words[kind.word] as string;
    const title = transformNodes(optionalNodes(node), state);
    let labelText = word;
    let anchor = label;
    if (kind.counter) {
      ctx.counters[kind.counter] += 1;
      const number = ctx.counters[kind.counter];
      labelText = `${word} ${number}`;
      anchor = label ?? `${name}-${number}`;
      if (label) {
        ctx.labels.set(label, { word, number: String(number), kind: "theorem", anchor, href: ctx.chapterHref });
      }
    }
    // amsthm's run-in head: "Definition 1 (Coverage)." and the text follows on
    // the same line.
    const head = tag("span", [attr("className", "thm-head")], [
      tag("span", [attr("className", "thm-label")], [text(labelText)]),
      ...(title.length > 0
        ? [text(" "), tag("span", [attr("className", "thm-note")], [text("("), ...title, text(")")])]
        : []),
      text("."),
    ]);
    const body = transformNodes(stripMacros(children, ["label"]), state);
    // Leading whitespace would put a space between the head and a parbreak.
    while (body.length > 0 && (body[0].type === "whitespace" || body[0].type === "parbreak")) body.shift();
    if (name === "proof") {
      body.push(tag("span", [attr("className", "qed"), attr("aria-hidden", "true")], [text("∎")]));
    }
    return tag(
      "section",
      [attr("className", `thm thm-${name}`), ...(anchor ? [attr("id", anchor)] : [])],
      [head, text(" "), ...body]
    );
  }

  if (name === "figure" || name === "table") {
    const isFigure = name === "figure";
    const counter = isFigure ? "figure" : "table";
    ctx.counters[counter] += 1;
    const number = ctx.counters[counter];
    const word = isFigure ? words.figure : words.table;
    const anchor = label ?? `${isFigure ? "fig" : "tbl"}-${number}`;
    if (label) {
      ctx.labels.set(label, { word, number: String(number), kind: counter, anchor, href: ctx.chapterHref });
    }

    const captionMacro = findFirstMacro(children, "caption");
    const caption = captionMacro ? transformNodes(argNodes(captionMacro), state) : [];
    state.figureAlt = toPlainText(captionMacro ? argNodes(captionMacro) : []);
    const rest = transformNodes(stripMacros(children, ["label", "caption", "centering"]), state);
    state.figureAlt = undefined;

    const figcaption = tag("figcaption", [], [
      captionLabel(isFigure ? "fig-number" : "tbl-number", word, number),
      ...(caption.length > 0 ? [text(" "), ...caption] : []),
    ]);
    const above = captionFirst(children);
    return tag("figure", [attr("id", anchor), attr("className", isFigure ? "blog-figure" : "blog-table")], [
      ...(above ? [figcaption] : []),
      ...rest,
      ...(above ? [] : [figcaption]),
    ]);
  }

  if (name === "tabular") {
    // booktabs rules carry no content; the table's own CSS draws them.
    return {
      ...node,
      content: transformNodes(
        stripMacros(children, ["toprule", "midrule", "bottomrule", "cmidrule", "addlinespace"]),
        state
      ),
    };
  }

  return { ...node, content: transformNodes(children, state) };
}

/** Footnote list for a chapter. */
function footnotesSection(footnotes: LatexRenderState["footnotes"], lang: Lang): Node[] {
  if (footnotes.length === 0) return [];
  const words = strings(lang);
  return [
    tag("section", [attr("className", "footnotes")], [
      tag("h2", [attr("id", "footnote-label"), attr("className", "sr-only")], [text(words.footnotes)]),
      tag(
        "ol",
        [],
        footnotes.map((footnote) =>
          tag("li", [attr("id", `fn-${footnote.number}`), attr("value", String(footnote.number))], [
            tag("span", [attr("className", "footnote-number")], [text(String(footnote.number))]),
            tag("span", [attr("className", "footnote-text")], [
              ...footnote.nodes,
              text(" "),
              tag(
                "a",
                [attr("href", `#fnref-${footnote.number}`), attr("aria-label", words.backToContent), attr("className", "footnote-back")],
                [text("↩")]
              ),
            ]),
          ])
        )
      ),
    ]),
  ];
}

/**
 * Apply the semantic transform to one chapter and hand back a LaTeX AST that
 * `unifiedLatexToHast` can convert directly.
 */
export function prepareLatex(nodes: Node[], ctx: RenderContext): Node[] {
  const state: LatexRenderState = { ctx, footnotes: [] };
  const body = transformNodes(nodes, state);
  return [...body, ...footnotesSection(state.footnotes, ctx.lang)];
}

/** Render a bibliography entry's LaTeX to the AST used for the reference list. */
export function prepareBibEntry(nodes: Node[], ctx: RenderContext): Node[] {
  return transformNodes(nodes, { ctx, footnotes: [] });
}

export type { Node as LatexNode };
