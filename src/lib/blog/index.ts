/**
 * Public API for blog posts.
 *
 * Posts are LaTeX documents in `content/blog/*.tex`. The pipeline is split
 * across this folder: `latex.ts` resolves LaTeX semantics on the AST,
 * `hast.ts` adapts unified-latex's HTML, `render.ts` runs the pipeline,
 * `source.ts` reads the files and `references.ts` settles cross-references.
 */
import type {
  BlogPost,
  Chapter,
  ChapterPageData,
  ChapterRef,
  ContentsEntry,
  Reference,
  TocItem,
} from "./types";
import {
  abstractParts,
  emptyCounters,
  prepareBibEntry,
  toPlainText,
  type RenderContext,
} from "./latex";
import { strings } from "./i18n";
import { countWords, readTimeFromWords } from "./text";
import { renderLatex } from "./render";
import { chapterHref, listPostFiles, readPostSource, translatedLanguages } from "./source";
import type { Lang } from "./i18n";
import {
  BIBLIOGRAPHY_PLACEHOLDER,
  numberBibliography,
  renderBibliography,
  resolveRefs,
} from "./references";

export type { BlogPost, Chapter, ChapterPageData, ChapterRef, ContentsEntry, Reference, TocItem };

/**
 * `\draft` posts exist under `npm run dev` (and in tests) but not in a
 * production build: no page, no listing, no sitemap or feed entry.
 */
function isPublished(post: BlogPost): boolean {
  return !post.draft || process.env.NODE_ENV !== "production";
}

function readPublished(slug: string) {
  const source = readPostSource(slug);
  return source && isPublished(source.meta) ? source : null;
}

/**
 * The key to read a post in a language: the slug itself, or `slug@lang` for the
 * build's machine translation when the post is written in another language and
 * has one. Every function below that takes a `slug` accepts a key.
 */
export function postKey(slug: string, lang: Lang): string {
  const original = readPublished(slug);
  return original && original.meta.lang !== lang && translatedLanguages(slug).includes(lang) ? `${slug}@${lang}` : slug;
}

/** Get metadata for all posts, sorted by date (newest first); in a language, with translations where there are any. */
export function getAllPosts(lang?: Lang): BlogPost[] {
  return listPostFiles()
    .map(({ slug }) => readPublished(lang ? postKey(slug, lang) : slug)?.meta)
    .filter((post): post is BlogPost => post !== undefined)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

/** Get all slugs for static generation. */
export function getAllSlugs(): string[] {
  return listPostFiles()
    .map((entry) => entry.slug)
    .filter((slug) => readPublished(slug) !== null);
}

/**
 * The posts either side of this one by date, for the "previous / next post"
 * cards at the end of a post. `previous` is the older one.
 */
export function getAdjacentPosts(slug: string, lang?: Lang): { previous?: BlogPost; next?: BlogPost } {
  const posts = getAllPosts(lang);
  const index = posts.findIndex((post) => post.slug === slug);
  if (index < 0) return {};
  return { previous: posts[index + 1], next: posts[index - 1] };
}

/**
 * The chapter list for a post, without rendering any HTML.
 *
 * Synchronous on purpose: `sitemap()` and `generateStaticParams()` are both
 * sync and need to enumerate chapter URLs. Returns `[]` for posts that are not
 * paginated, so short posts generate no nested routes.
 */
export function getChapterOutline(slug: string): ChapterRef[] {
  const source = readPublished(slug);
  if (!source?.paginated) return [];
  return source.chapters.map((chapter) => ({
    index: chapter.index,
    slug: chapter.slug,
    title: chapter.title,
    href: chapterHref(source.meta.slug, chapter.slug, chapter.index),
    readTime: readTimeFromWords(countWords(toPlainText(chapter.nodes))),
  }));
}

interface RenderedPost {
  meta: BlogPost;
  paginated: boolean;
  chapters: Chapter[];
  outline: ChapterRef[];
  abstract?: { title: string; html: string };
  /** What every `\label` and `\bibitem` was numbered — see getPostNumbering. */
  numbering: { labels: Record<string, string>; citations: Record<string, number> };
}

/**
 * Renders a post in full, once.
 *
 * Every chapter has to be rendered before any of them can be served, because
 * section, figure, table, equation, theorem and footnote numbering run
 * continuously across chapters and a `\ref` may point forwards. Doing it per
 * requested chapter would be quadratic over a build, so the result is memoized
 * per file and invalidated on mtime.
 */
const renderedPosts = new Map<string, { mtimeMs: number; value: RenderedPost }>();

async function getRenderedPost(key: string): Promise<RenderedPost | null> {
  const source = readPublished(key);
  if (!source) return null;
  const slug = source.meta.slug;

  const cached = renderedPosts.get(key);
  if (cached && cached.mtimeMs === source.mtimeMs) return cached.value;

  const { meta, body, lead, chapters, paginated, bibliography } = source;
  const citations = numberBibliography(bibliography);

  const units = paginated
    ? chapters.map((chapter) => ({
        ...chapter,
        nodes: chapter.index === 1 ? [...lead, ...chapter.nodes] : chapter.nodes,
      }))
    : [{ index: 1, title: meta.title, slug, nodes: body }];

  const ctx: RenderContext = {
    counters: emptyCounters(),
    labels: new Map(),
    chapterHref: `/blog/${slug}`,
    lang: meta.lang,
  };

  // The abstract comes first in the document, so it renders first: a footnote
  // in it takes number 1, as it would in the PDF.
  let abstract: RenderedPost["abstract"];
  if (source.abstract) {
    const parts = abstractParts(source.abstract);
    const { html } = await renderLatex(parts.nodes, { ctx, source: key });
    abstract = { title: parts.title || strings(meta.lang).abstract, html };
  }

  const drafts: { unit: (typeof units)[number]; html: string; toc: TocItem[]; href: string }[] = [];

  for (const unit of units) {
    const href = paginated ? chapterHref(slug, unit.slug, unit.index) : `/blog/${slug}`;
    ctx.chapterHref = href;
    const { html, toc } = await renderLatex(unit.nodes, {
      ctx,
      firstHeadingId: paginated ? unit.slug : undefined,
      source: paginated ? `${key}/${unit.slug}` : key,
    });
    drafts.push({ unit, html, toc, href });
  }

  // Bibliography entries are LaTeX too, so they go through the same pipeline.
  const entries = await Promise.all(
    bibliography.map(async (entry) => ({
      id: entry.id,
      html: (await renderLatex(prepareBibEntry(entry.nodes, ctx), { ctx, source: key })).html
        .replace(/^<p>/, "")
        .replace(/<\/p>\s*$/, ""),
    }))
  );
  const bibliographyHtml = renderBibliography(entries, citations);

  const rendered: Chapter[] = drafts.map((draft) => {
    const wordCount = countWords(toPlainText(draft.unit.nodes));
    const html = resolveRefs(draft.html, ctx.labels, citations, draft.href).replace(
      BIBLIOGRAPHY_PLACEHOLDER,
      bibliographyHtml
    );
    return {
      index: draft.unit.index,
      slug: draft.unit.slug,
      title: draft.unit.title,
      href: draft.href,
      readTime: paginated ? readTimeFromWords(wordCount) : meta.readTime,
      contentHtml: html,
      toc: draft.toc,
      wordCount,
    };
  });

  const value: RenderedPost = {
    meta,
    paginated,
    numbering: {
      labels: Object.fromEntries([...ctx.labels].map(([key, target]) => [key, target.number])),
      citations: Object.fromEntries(citations),
    },
    abstract: abstract && {
      ...abstract,
      html: resolveRefs(abstract.html, ctx.labels, citations, `/blog/${slug}`),
    },
    chapters: rendered,
    outline: paginated
      ? rendered.map(({ index, slug: chapterSlug, title, href, readTime }) => ({
          index,
          slug: chapterSlug,
          title,
          href,
          readTime,
        }))
      : [],
  };

  renderedPosts.set(key, { mtimeMs: source.mtimeMs, value });
  return value;
}

/**
 * Everything the post chrome needs: metadata, the chapter list and each
 * chapter's headings — but no chapter body.
 *
 * The blog post layout renders the header, table of contents and chapter
 * navigation once per post and keeps them mounted while the reader moves
 * between chapters, so it needs the data for *all* chapters up front. The
 * underlying render is memoized, so asking for this and then for a chapter
 * costs one render, not two.
 */
export interface PostShell {
  post: BlogPost;
  outline: ChapterRef[];
  paginated: boolean;
  totalReadTime: string;
  /** Each chapter's h2/h3 headings, keyed by chapter slug. */
  chapterTocs: Record<string, TocItem[]>;
  /** Every heading of every page, in order, for the post-wide contents. */
  contents: ContentsEntry[];
  /** The abstract, rendered for the header. */
  abstract?: { title: string; html: string };
}

export async function getPostShell(slug: string): Promise<PostShell | null> {
  const rendered = await getRenderedPost(slug);
  if (!rendered) return null;
  return {
    post: rendered.meta,
    outline: rendered.outline,
    paginated: rendered.paginated,
    totalReadTime: rendered.meta.readTime,
    chapterTocs: Object.fromEntries(
      rendered.chapters.map((chapter) => [chapter.slug, chapter.toc])
    ),
    contents: rendered.chapters.flatMap((chapter) =>
      chapter.toc.map((item) => ({ ...item, page: chapter.index, href: chapter.href }))
    ),
    abstract: rendered.abstract,
  };
}

/**
 * The number the site printed for every `\label` and `\bibitem` of a post.
 *
 * `npm run blog:check` compares these with the `.aux` file LaTeX writes for
 * the same source, so a post's web page and its PDF provably agree.
 */
export async function getPostNumbering(slug: string): Promise<RenderedPost["numbering"] | null> {
  return (await getRenderedPost(slug))?.numbering ?? null;
}

/**
 * Render one chapter of a post, or the whole post when it is not paginated.
 *
 * Passing an unknown `chapterSlug`, or any `chapterSlug` for an unpaginated
 * post, returns null so the route can 404.
 */
export async function getPostChapter(
  slug: string,
  chapterSlug?: string
): Promise<ChapterPageData | null> {
  const post = await getRenderedPost(slug);
  if (!post) return null;

  const { meta, paginated, chapters, outline } = post;

  if (!paginated) {
    if (chapterSlug) return null;
    return {
      post: meta,
      chapter: chapters[0],
      outline: [],
      paginated: false,
      totalReadTime: meta.readTime,
    };
  }

  const chapter = chapterSlug
    ? chapters.find((candidate) => candidate.slug === chapterSlug)
    : chapters[0];
  if (!chapter) return null;

  return {
    post: meta,
    chapter,
    outline,
    paginated: true,
    totalReadTime: meta.readTime,
    prev: outline[chapter.index - 2],
    next: outline[chapter.index],
  };
}
