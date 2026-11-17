/** Reading and interpreting the `.tex` files on disk. */
import fs from "fs";
import path from "path";
import type { BlogPost, Reference } from "./types";
import {
  extractAbstract,
  parseLatex,
  splitLatexChapters,
  toPlainText,
  type LatexNode,
} from "./latex";
import { strings, type Lang } from "./i18n";
import { translationsDirectory } from "@/lib/translations";
import { countWords, minutesFromWords, readTimeFromWords, uniqueSlug } from "./text";

/**
 * Where the posts live: `content/blog`. Under `NODE_ENV=test` only,
 * `BLOG_CONTENT_DIR` replaces it (the tests point it at `tests/fixtures/blog`,
 * from `tests/setup.ts`, which runs before this module is imported).
 *
 * Keep this a module-level constant with a literal `NODE_ENV === "test"`
 * condition. Next inlines NODE_ENV when it builds, so in production this folds
 * to the static path and the build traces only `content/blog`; a path that
 * depends on a free-standing variable, or one hidden behind a function call,
 * makes Turbopack trace the whole project into the server bundle (`/feed.xml`
 * reads the posts at request time, so it matters). A build warns about it:
 * "Dynamic filesystem access causes tracing of the whole project".
 */
const postsDirectory =
  process.env.NODE_ENV === "test" && process.env.BLOG_CONTENT_DIR
    ? path.resolve(process.env.BLOG_CONTENT_DIR)
    : path.join(process.cwd(), "content/blog");
/** The root `\pdf{}` paths are measured against: `public/`, or the tests' own under `NODE_ENV=test`. */
const publicDirectory =
  process.env.NODE_ENV === "test" && process.env.BLOG_PUBLIC_DIR
    ? path.resolve(process.env.BLOG_PUBLIC_DIR)
    : path.join(process.cwd(), "public");
/** Blog posts are LaTeX documents. */
const POST_EXTENSIONS = [".tex"];

/**
 * `\paginate{auto}` splits a post only when it is both long and deeply
 * sectioned, so a short post with many `\section`s does not fragment into a
 * dozen URLs.
 */
const AUTO_MIN_CHAPTERS = 6;
const AUTO_MIN_WORDS = 2000;

/**
 * `templates/blog/post.tex`, served as `/blog/template` under `npm run dev` only,
 * so the template can be previewed through the real pipeline. A post in
 * `content/blog/` with the same slug wins.
 */
function devTemplatePost(): { slug: string; file: string } | null {
  if (process.env.NODE_ENV !== "development") return null;
  const file = path.join(process.cwd(), "templates", "blog", "post.tex");
  return fs.existsSync(file) ? { slug: "template", file } : null;
}

/**
 * A post is addressed by a key: its slug (`hello-world`), or, for the machine
 * translation of it, the slug and the language (`hello-world@en`). The public
 * address is always the slug; the key only says which text to read.
 */
export function splitKey(key: string): { slug: string; lang?: Lang } {
  const at = key.lastIndexOf("@");
  const lang = at < 0 ? undefined : key.slice(at + 1);
  return lang === "nl" || lang === "en" ? { slug: key.slice(0, at), lang } : { slug: key };
}

/** The translation of a post into a language, if the build made one. */
function translationPath(slug: string, lang: Lang): string | null {
  const file = path.join(translationsDirectory, "blog", `${slug}.${lang}.tex`);
  return fs.existsSync(file) ? file : null;
}

/** The languages a post has a machine translation in. */
export function translatedLanguages(slug: string): Lang[] {
  return (["nl", "en"] as const).filter((lang) => translationPath(slug, lang) !== null);
}

/** Resolve the on-disk path for a post key. */
export function resolvePostPath(key: string): string | null {
  const { slug, lang } = splitKey(key);
  if (lang) return translationPath(slug, lang);
  for (const ext of POST_EXTENSIONS) {
    const candidate = path.join(postsDirectory, `${slug}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  const template = devTemplatePost();
  return template?.slug === slug ? template.file : null;
}

export function listPostFiles(): { slug: string; file: string }[] {
  const posts = fs.existsSync(postsDirectory)
    ? fs
        .readdirSync(postsDirectory)
        .filter((file) => POST_EXTENSIONS.includes(path.extname(file)))
        .map((file) => ({ slug: file.replace(/\.[^.]+$/, ""), file: path.join(postsDirectory, file) }))
    : [];
  const template = devTemplatePost();
  return template && !posts.some((post) => post.slug === template.slug) ? [...posts, template] : posts;
}

export interface PostSource {
  meta: BlogPost;
  body: LatexNode[];
  lead: LatexNode[];
  /** The abstract written before the first `\section`, lifted into the header. */
  abstract: LatexNode | null;
  chapters: { index: number; title: string; slug: string; appendix: boolean; nodes: LatexNode[] }[];
  paginated: boolean;
  references: Reference[];
  bibliography: { id: string; nodes: LatexNode[] }[];
  mtimeMs: number;
}

/**
 * Size of a PDF named by `\pdf{/docs/…}`, measured in `public/`. A missing file
 * means no download button rather than a broken link. See `publicDirectory`.
 */
function pdfAsset(href: string, slug: string): BlogPost["pdf"] {
  if (!href) return undefined;
  const file = path.join(publicDirectory, href.replace(/^\//, ""));
  if (!fs.existsSync(file)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[blog] ${slug}: \\pdf{${href}} not found in public/`);
    }
    return undefined;
  }
  return { href, bytes: fs.statSync(file).size };
}

export function readPostSource(key: string): PostSource | null {
  const file = resolvePostPath(key);
  if (!file) return null;
  const { slug, lang: variant } = splitKey(key);

  const document = parseLatex(fs.readFileSync(file, "utf8"));
  const { meta } = document;
  // A translation counts only if it says it is in the language it was made for.
  if (variant && meta.lang !== variant) return null;
  const original = variant ? readPostSource(slug) : null;
  if (variant && !original) return null;
  const words = strings(meta.lang);
  const { body, abstract } = extractAbstract(document.body);
  const { lead, chapters: rawChapters, byPage } = splitLatexChapters(body);
  const wordCount = countWords(toPlainText(document.body));

  // A page of an explicitly paged post is named after its first section, and
  // the appendix pages together are "Appendices" — as a printed report's
  // table of contents would group them.
  const seen = new Map<string, number>();
  const chapters = rawChapters.map((chapter) => {
    const title = byPage && chapter.appendix ? words.appendices : chapter.title || words.page(chapter.index);
    return { ...chapter, title, slug: uniqueSlug(title || `chapter-${chapter.index}`, seen) };
  });
  // A translation keeps the chapter addresses of the original, so the language
  // button leads to the same page and a link to a chapter works in both.
  if (original && original.chapters.length === chapters.length) {
    chapters.forEach((chapter, index) => (chapter.slug = original.chapters[index].slug));
  }

  // Explicit page breaks say how the author wants the post served; otherwise
  // \paginate decides.
  const mode = meta.pagination;
  const paginated =
    mode === "never" || chapters.length < 2
      ? false
      : byPage || mode === "always" || (chapters.length >= AUTO_MIN_CHAPTERS && wordCount >= AUTO_MIN_WORDS);

  return {
    meta: {
      slug,
      title: meta.title || slug,
      date: meta.date,
      excerpt: meta.excerpt,
      image: meta.image,
      tags: meta.tags,
      readTime: readTimeFromWords(wordCount),
      readMinutes: minutesFromWords(wordCount),
      xPostUrl: meta.xPostUrl,
      lang: meta.lang,
      author: meta.author || undefined,
      subtitle: meta.subtitle || undefined,
      affiliation: meta.affiliation || undefined,
      version: meta.version,
      keywords: meta.keywords,
      kind: meta.kind || undefined,
      pdf: pdfAsset(meta.pdf, slug),
      draft: meta.draft,
      ...(original ? { translatedFrom: original.meta.lang } : {}),
    },
    body,
    lead,
    abstract,
    chapters,
    paginated,
    references: document.bibliography.map((entry) => ({ id: entry.id })),
    bibliography: document.bibliography,
    mtimeMs: fs.statSync(file).mtimeMs,
  };
}

export function chapterHref(postSlug: string, chapterSlug: string, index: number): string {
  return index === 1 ? `/blog/${postSlug}` : `/blog/${postSlug}/${chapterSlug}`;
}
