import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { SITE_LANG, type Lang } from "@/lib/i18n";

/**
 * The bio is markdown with YAML frontmatter. `content/bio.md` is the site's own
 * language (Dutch); `content/bio.en.md` is an English version written by hand,
 * and wins when English is asked for. Without it, English shows the Dutch text.
 */
const CONTENT = path.join(process.cwd(), "content");

export interface Bio {
  title: string;
  /** A calendar date (`2026-02-28`), or the text as written if it is not one. */
  updated: string;
  /** The language the text is written in, which can differ from the one asked for. */
  lang: Lang;
  /** One HTML string per paragraph (inline markdown rendered, no wrapping <p>). */
  paragraphs: string[];
}

/** Read the intro/bio text for a language from content/bio.md or content/bio.<lang>.md. */
export function getBio(lang: Lang): Bio {
  const specific = path.join(CONTENT, `bio.${lang}.md`);
  const file = fs.existsSync(specific) ? specific : path.join(CONTENT, "bio.md");
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

  return {
    title: (data.title as string) ?? "mitaa.dev",
    // gray-matter turns an unquoted `2026-02-28` into a Date.
    updated: data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : String(data.updated ?? ""),
    lang: written,
    paragraphs,
  };
}
