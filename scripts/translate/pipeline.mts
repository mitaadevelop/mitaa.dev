import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { chunkDocument } from "./chunk.mts";
import { latexSkeleton, markdownSkeleton } from "./skeleton.mts";

export type Kind = "latex" | "markdown";
export type Language = "nl" | "en";

export interface Request {
  kind: Kind;
  text: string;
  from: Language;
  to: Language;
}

/** Turns one piece of text into another language. Throws when it cannot. */
export type Translator = (request: Request) => Promise<string>;

export interface Cache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

/** Bump when the prompt changes in a way that should re-translate everything. */
export const PROMPT_VERSION = "1";

export function fileCache(directory: string): Cache {
  return {
    get(key) {
      const file = path.join(directory, `${key}.txt`);
      return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
    },
    set(key, value) {
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(directory, `${key}.txt`), value);
    },
  };
}

export function memoryCache(): Cache & { entries: Map<string, string> } {
  const entries = new Map<string, string>();
  return { entries, get: (key) => entries.get(key), set: (key, value) => void entries.set(key, value) };
}

export function cacheKey(model: string, request: Request): string {
  return createHash("sha256")
    .update([PROMPT_VERSION, model, request.kind, request.from, request.to, request.text].join("\u0000"))
    .digest("hex");
}

const skeletonOf = { latex: latexSkeleton, markdown: markdownSkeleton };

/** A model sometimes wraps its answer in a code fence the source did not have. */
function unfence(answer: string, source: string): string {
  const fence = /^```[a-z]*\n([\s\S]*?)\n```\s*$/.exec(answer.trim());
  return fence && !/^\s*```/.test(source) ? fence[1] : answer;
}

/** Same leading and trailing whitespace as the source piece, so the pieces glue back together. */
function sameEdges(answer: string, source: string): string {
  const lead = /^\s*/.exec(source)![0];
  const trail = /\s*$/.exec(source)![0];
  return lead + answer.trim() + trail;
}

/** True when a piece has no words to translate (blank, or only structure). */
function hasProse(chunk: string): boolean {
  return /\p{L}{3,}/u.test(chunk.replace(/\\[a-zA-Z]+/g, " ").replace(/\{[^}]*\}/g, (group) => (/\p{L}{3,}/u.test(group) ? group : " ")));
}

export interface Options {
  translator: Translator;
  cache: Cache;
  model: string;
  /** Characters per call. */
  maxChars?: number;
  log?: (message: string) => void;
}

/**
 * Translate a document piece by piece. Each piece is cached on its own (so
 * editing one paragraph re-translates one paragraph) and checked against the
 * original's skeleton; a piece that fails is asked for once more. If any piece
 * still fails, the whole document is not translated (returns null): a page that
 * is half in each language is worse than one that says it is not translated yet.
 */
export async function translateDocument(
  document: { kind: Kind; text: string; from: Language; to: Language },
  { translator, cache, model, maxChars, log = () => {} }: Options
): Promise<string | null> {
  const skeleton = skeletonOf[document.kind];
  const pieces = chunkDocument(document.text, document.kind, maxChars);
  const out: string[] = [];

  for (const [index, piece] of pieces.entries()) {
    if (!hasProse(piece)) {
      out.push(piece);
      continue;
    }
    const request: Request = { kind: document.kind, text: piece, from: document.from, to: document.to };
    const key = cacheKey(model, request);
    const cached = cache.get(key);
    if (cached !== undefined) {
      out.push(cached);
      continue;
    }

    const expected = JSON.stringify(skeleton(piece));
    let accepted: string | null = null;
    for (let attempt = 1; attempt <= 2 && accepted === null; attempt++) {
      try {
        const answer = sameEdges(unfence(await translator(request), piece), piece);
        if (JSON.stringify(skeleton(answer)) === expected) accepted = answer;
        else log(`piece ${index + 1}/${pieces.length}: the structure changed (attempt ${attempt})`);
      } catch (error) {
        log(`piece ${index + 1}/${pieces.length}: ${error instanceof Error ? error.message : String(error)} (attempt ${attempt})`);
      }
    }
    if (accepted === null) return null;
    cache.set(key, accepted);
    out.push(accepted);
  }
  return out.join("");
}

/**
 * The language a post is written in is declared in the file (`\lang{nl}` or
 * `\usepackage[dutch]{babel}`); a translation has to say its own. Only the
 * preamble is touched: a listing may contain a `\usepackage` of its own.
 */
export function setLatexLanguage(text: string, language: Language): string {
  const start = text.indexOf("\\begin{document}");
  const preamble = start < 0 ? text : text.slice(0, start);
  const body = start < 0 ? "" : text.slice(start);
  const babel = language === "nl" ? "dutch" : "english";

  let result = preamble
    .replace(/^[ \t]*\\lang\{[^}]*\}[ \t]*\n?/gm, "")
    .replace(/\\usepackage\[([^\]]*)\]\{babel\}/g, `\\usepackage[${babel}]{babel}`);
  if (language === "nl" && !/\\usepackage\[[^\]]*\]\{babel\}/.test(result)) {
    result = result.replace(/\s*$/, "\n") + "\\lang{nl}\n\n";
  }
  return result + body;
}
