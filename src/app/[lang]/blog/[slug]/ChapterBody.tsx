import { ViewTransition } from "react";
import type { ChapterPageData } from "@/lib/blog/types";
import { getAdjacentPosts, getPostShell } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";
import PostAbstract from "@/components/blog/PostAbstract";
import ArticleEnd from "@/components/blog/ArticleEnd";
import PostNav from "@/components/blog/PostNav";
import ContentLanguageNotice from "@/components/site/ContentLanguageNotice";
import { localePath, type Lang } from "@/lib/i18n";

/**
 * A page's text — the only part of a post that changes when the reader moves
 * between pages. Everything around it lives in the `[slug]` layout and stays
 * mounted, so this is also everything that varies per page: the abstract on
 * page 1, the citation block and the links to other posts on the last.
 *
 * The ViewTransition gives the swap a short fade — sliding a few pixels in the
 * reading direction when the link says which way it goes (`page-forward` /
 * `page-back`, see ChapterNav). It sits in the page, not the layout: a layout
 * never unmounts, so its enter and exit would never run.
 */
export default async function ChapterBody({ data, lang }: Readonly<{ data: ChapterPageData; lang: Lang }>) {
  const { post, chapter, prev, next } = data;
  const isFirst = chapter.index === 1;
  const isLast = !next;
  const abstract = isFirst ? (await getPostShell(post.slug))?.abstract : undefined;
  const adjacent = isLast ? getAdjacentPosts(post.slug) : {};

  return (
    <>
      {prev && <link rel="prev" href={`${SITE_URL}${localePath(lang, prev.href)}`} />}
      {next && <link rel="next" href={`${SITE_URL}${localePath(lang, next.href)}`} />}
      <ViewTransition
        key={chapter.slug}
        enter={{ "page-forward": "page-forward", "page-back": "page-back", default: "page-fade" }}
        exit={{ "page-forward": "page-forward", "page-back": "page-back", default: "page-fade" }}
        default="none"
      >
        <div>
          {isFirst && <ContentLanguageNotice lang={lang} contentLang={post.lang} />}
          {abstract && <PostAbstract post={post} abstract={abstract} />}
          {/* Heading numbers are in the HTML, counted by the pipeline across the
              whole post, so a chapter needs no counter offset of its own. */}
          <div className="prose-blog max-w-none" dangerouslySetInnerHTML={{ __html: chapter.contentHtml }} />
          {isLast && (
            <>
              <ArticleEnd post={post} />
              <PostNav previous={adjacent.previous} next={adjacent.next} lang={post.lang} />
            </>
          )}
        </div>
      </ViewTransition>
    </>
  );
}
