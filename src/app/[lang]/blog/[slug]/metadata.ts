import type { Metadata } from "next";
import { getPostChapter } from "@/lib/blog";
import { strings } from "@/lib/blog/i18n";
import { localePath, type Lang } from "@/lib/i18n";

/**
 * Metadata for a post page or one of its chapter pages.
 *
 * Every chapter is self-canonical and indexed: pagination exists to make each
 * chapter its own addressable document, and canonicalising them all back to
 * chapter 1 would tell search engines they are duplicates of a page whose body
 * text they do not share.
 */
export async function buildChapterMetadata(
  lang: Lang,
  slug: string,
  chapterSlug?: string
): Promise<Metadata> {
  const data = await getPostChapter(slug, chapterSlug);
  if (!data) {
    return { title: "Post Not Found" };
  }

  const { post, chapter, outline, paginated } = data;
  const isFirst = chapter.index === 1;
  // Chapter 1 is also reachable at its own chapter URL; point it at the canonical
  // /blog/<slug> so the two do not compete.
  const path = isFirst ? `/blog/${post.slug}` : chapter.href;
  // A post written in the other language than the page is the same text under two
  // addresses: the one in its own language is the canonical one.
  const url = localePath(lang, path);
  const canonical = localePath(post.lang, path);
  const title = paginated && !isFirst ? `${post.title} — ${chapter.index}. ${chapter.title}` : post.title;
  const description =
    paginated && !isFirst
      ? `${post.excerpt} (${strings(post.lang).pageOf(chapter.index, outline.length)}: ${chapter.title})`
      : post.excerpt;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: post.date,
      tags: post.tags,
      locale: strings(post.lang).locale.replace("-", "_"),
      authors: post.author ? [post.author] : undefined,
      images: post.image ? [{ url: post.image, alt: post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.image ? [post.image] : undefined,
    },
  };
}
