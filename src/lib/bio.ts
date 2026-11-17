import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { SITE_LANG, type Lang } from "@/lib/i18n";
import { translationsDirectory } from "@/lib/translations";

/**
 * The bio is markdown with YAML frontmatter. `content/bio.md` is the site's own
 * language (Dutch); `content/bio.en.md` is an English version written by hand,
 * and wins when English is asked for. Without it, the build's machine translation
 * (`.translations/bio.<lang>.md`) is used when there is one, and otherwise the
 * page shows the text in the language it is written in.
 */
const CONTENT = path.join(process.cwd(), "content");

export interface Bio {
  title: string;
  /** A calendar date (`2026-02-28`), or the text as written if it is not one. */
  updated: string;
  /** The language the text is written in, which can differ from the one asked for. */
  lang: Lang;
  /** Set when this is a machine translation: the language it was translated from. */
  translatedFrom?: Lang;
  /** One HTML string per paragraph (inline markdown rendered, no wrapping <p>). */
  paragraphs: string[];
}

/** Read the intro/bio text for a language from content/bio.md or content/bio.<lang>.md. */
export function getBio(lang: Lang): Bio {
  const specific = path.join(CONTENT, `bio.${lang}.md`);
  const machine = path.join(translationsDirectory, `bio.${lang}.md`);
  const file = fs.existsSync(specific) ? specific : fs.existsSync(machine) ? machine : path.join(CONTENT, "bio.md");
  const { data, content } = matter(fs.readFileSync(file, "utf8"));

  const paragraphs = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      remark()
        .use(remarkGfm)
        .use(remarkHtml)
        .processSync(block)
        .toString()
        .trim()
        // strip the wrapping <p> so the component controls paragraph styling
        .replace(/^<p>/, "")
        .replace(/<\/p>$/, "")
    );

  const written = data.lang === "en" || data.lang === "nl" ? (data.lang as Lang) : file === specific ? lang : SITE_LANG;
  const from = data.translatedFrom === "en" || data.translatedFrom === "nl" ? (data.translatedFrom as Lang) : undefined;

  return {
    title: (data.title as string) ?? "mitaa.dev",
    // gray-matter turns an unquoted `2026-02-28` into a Date.
    updated: data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : String(data.updated ?? ""),
    lang: written,
    ...(file === machine && from ? { translatedFrom: from } : {}),
    paragraphs,
  };
}
