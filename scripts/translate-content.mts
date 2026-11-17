/**
 * Translate the site's own writing into the other language, at build time.
 *
 *   npm run translate                      # also runs from `prebuild`
 *
 * What is translated: the bio (`content/bio.md`) and every non-draft blog post
 * (`content/blog/*.tex`), each into the language it is not written in. The
 * results are written to `.translations/` (git-ignored), where `getBio` and the
 * blog read them; the site shows them with a note that they are machine
 * translations. A text with a hand-written version (`content/bio.en.md`) is
 * never translated.
 *
 * The translation is made with the Claude API: set `ANTHROPIC_API_KEY` (in Vercel:
 * Settings → Environment Variables). `TRANSLATE_MODEL` picks the model. Without a
 * key the script still works from its cache, and for anything it has not
 * translated before the page simply shows the original with a note. Pieces are
 * cached by content in `.next/cache/translations/` (which Vercel keeps between
 * builds), so only text that changed is paid for.
 *
 * This script never fails a build: every problem is a warning and a fallback.
 * `TRANSLATE=off` skips it.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { anthropicTranslator } from "./translate/anthropic.mts";
import {
  fileCache,
  setLatexLanguage,
  translateDocument,
  type Language,
  type Translator,
} from "./translate/pipeline.mts";

/** `TRANSLATE_ROOT` points the script at another project folder: the tests use a temporary one. */
const ROOT = process.env.TRANSLATE_ROOT || process.cwd();
const OUT = path.join(ROOT, ".translations");
const CACHE = path.join(ROOT, ".next", "cache", "translations");
const MODEL = process.env.TRANSLATE_MODEL || "claude-sonnet-5-5";
const LANGUAGES: Language[] = ["nl", "en"];
const SITE_LANGUAGE: Language = "nl";

const log = (message: string) => console.log(`[translate] ${message}`);

/** Without a key the cache can still answer; a piece it does not have is a failure. */
function translatorFromEnvironment(): Translator {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) return anthropicTranslator({ apiKey, model: MODEL, url: process.env.ANTHROPIC_API_URL });
  log("no ANTHROPIC_API_KEY: only text translated before is shown translated");
  return async () => {
    throw new Error("no ANTHROPIC_API_KEY");
  };
}

/** The language a post declares: `\lang{xx}`, or babel's last option; English otherwise. */
function postLanguage(source: string): Language {
  const explicit = /\\lang\{(nl|en)\}/.exec(source.split("\\begin{document}")[0]);
  if (explicit) return explicit[1] as Language;
  const babel = /\\usepackage\[([^\]]*)\]\{babel\}/.exec(source.split("\\begin{document}")[0]);
  const last = babel?.[1].split(",").pop()?.trim();
  return last === "dutch" || last === "nl" || last === "nederlands" ? "nl" : "en";
}

function isDraft(source: string): boolean {
  return /^[ \t]*\\draft\b/m.test(source.split("\\begin{document}")[0]);
}

async function main(): Promise<void> {
  if (process.env.TRANSLATE === "off") {
    log("TRANSLATE=off: skipped");
    return;
  }
  const translator = translatorFromEnvironment();
  const options = { translator, cache: fileCache(CACHE), model: MODEL, log };

  // Everything is rebuilt from the sources each run, so a deleted or changed
  // text never leaves a stale translation behind.
  fs.rmSync(OUT, { recursive: true, force: true });
  let made = 0;
  let missed = 0;

  // ---- the bio
  const bioFile = path.join(ROOT, "content", "bio.md");
  if (fs.existsSync(bioFile)) {
    const { data, content } = matter(fs.readFileSync(bioFile, "utf8"));
    const from = (data.lang === "en" || data.lang === "nl" ? data.lang : SITE_LANGUAGE) as Language;
    for (const to of LANGUAGES.filter((lang) => lang !== from)) {
      if (fs.existsSync(path.join(ROOT, "content", `bio.${to}.md`))) continue; // written by hand
      const text = await translateDocument({ kind: "markdown", text: content, from, to }, options);
      if (text === null) {
        missed++;
        log(`bio → ${to}: not translated`);
        continue;
      }
      const header = { title: data.title, updated: data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : data.updated, lang: to, translatedFrom: from };
      fs.mkdirSync(OUT, { recursive: true });
      fs.writeFileSync(path.join(OUT, `bio.${to}.md`), matter.stringify(text, header));
      made++;
      log(`bio → ${to}`);
    }
  }

  // ---- the blog
  const postsDirectory = path.join(ROOT, "content", "blog");
  const files = fs.existsSync(postsDirectory) ? fs.readdirSync(postsDirectory).filter((file) => file.endsWith(".tex")) : [];
  for (const file of files) {
    const slug = file.replace(/\.tex$/, "");
    const source = fs.readFileSync(path.join(postsDirectory, file), "utf8");
    if (isDraft(source)) continue; // a draft is not published, so it is not worth paying for
    const from = postLanguage(source);
    for (const to of LANGUAGES.filter((lang) => lang !== from)) {
      const text = await translateDocument({ kind: "latex", text: source, from, to }, options);
      if (text === null) {
        missed++;
        log(`${slug} → ${to}: not translated, the page shows the original`);
        continue;
      }
      const directory = path.join(OUT, "blog");
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(
        path.join(directory, `${slug}.${to}.tex`),
        `% Machine translation of ${file} (${from} → ${to}), made by scripts/translate-content.mts. Do not edit.\n` +
          setLatexLanguage(text, to)
      );
      made++;
      log(`${slug} → ${to}`);
    }
  }

  log(`${made} translated, ${missed} not translated`);
}

main().catch((error) => {
  // A translation must never be the reason a site does not build.
  console.warn(`[translate] skipped: ${error instanceof Error ? error.message : String(error)}`);
});
