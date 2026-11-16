/**
 * Shared blog types.
 *
 * This module deliberately imports nothing from `blog.ts` and touches no
 * `fs`/`path`, so client components can import from it without any risk of
 * dragging Node built-ins into the browser bundle.
 */
import type { Lang } from "./i18n";

export type { Lang };

/** A bibliography entry, declared in a post's `references:` frontmatter. */
export interface Reference {
  /** Citation key, used as `[@id]` in the body. */
  id: string;
  author?: string;
  title?: string;
  /** Journal, book or site the work appeared in. */
  container?: string;
  year?: string;
  url?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image?: string;
  tags: string[];
  /** "N min read" — for the site's own (English) lists. */
  readTime: string;
  readMinutes: number;
  xPostUrl?: string;
  /** From `\usepackage[dutch]{babel}` or `\lang{nl}`; English otherwise. */
  lang: Lang;
  author?: string;
  subtitle?: string;
  affiliation?: string;
  /** `\version{v2}{2025-09-04}` — a label and an optional revision date. */
  version?: { label: string; date?: string };
  /** `\keywords{…}`; falls back to nothing, the header shows tags instead. */
  keywords: string[];
  /** The kicker above the title, e.g. "Verslag". */
  kind?: string;
  /** A PDF built from the same source, with its size measured at build time. */
  pdf?: { href: string; bytes: number };
  /** `\draft` posts render under `npm run dev` only. */
  draft: boolean;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
  /** "2", "2.1", "A" — absent for unnumbered (starred) headings. */
  number?: string;
}

/** One line of the post-wide table of contents. */
export interface ContentsEntry extends TocItem {
  /** 1-based page (chapter) the heading is on. */
  page: number;
  /** Href of that page, without the fragment. */
  href: string;
}

/** A chapter as it appears in navigation: cheap to compute, no rendering. */
export interface ChapterRef {
  /** 1-based, matching the nth `##` heading in the post. */
  index: number;
  /** Deduplicated across the whole post — these become URLs. */
  slug: string;
  title: string;
  /** `/blog/<post>` for chapter 1, `/blog/<post>/<chapter>` otherwise. */
  href: string;
  readTime: string;
}

export interface Chapter extends ChapterRef {
  contentHtml: string;
  toc: TocItem[];
  wordCount: number;
}

/** Everything a chapter page needs to render. */
export interface ChapterPageData {
  post: BlogPost;
  chapter: Chapter;
  /** Every chapter of the post, for the two-level table of contents. */
  outline: ChapterRef[];
  paginated: boolean;
  totalReadTime: string;
  prev?: ChapterRef;
  next?: ChapterRef;
}
