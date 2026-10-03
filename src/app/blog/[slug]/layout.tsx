// KaTeX ships its own stylesheet plus ~20 font files. Importing it on the route
// rather than in the root layout keeps it off every other page; Next resolves
// the font url()s relative to node_modules/katex/dist and rewrites them.
import "katex/dist/katex.min.css";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPostShell } from "@/lib/blog";
import { strings } from "@/lib/blog/i18n";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import PostHeader from "@/components/blog/PostHeader";
import TableOfContents from "@/components/blog/TableOfContents";
import ChapterNav from "@/components/blog/ChapterNav";
import ChapterKeyboardNav from "@/components/blog/ChapterKeyboardNav";
import ScrollProgressBar from "@/components/blog/ScrollProgressBar";
import CopyButtons from "@/components/blog/CopyButtons";

/**
 * Everything around a post's body.
 *
 * This is a layout rather than part of the page so that moving between chapters
 * only swaps the text. The `[slug]` segment does not change when the reader goes
 * from `/blog/<post>` to `/blog/<post>/<chapter>`, so Next keeps this subtree
 * mounted and re-renders only the child page. The header, sidebar and chapter
 * navigation therefore never flash, and the table of contents keeps its scroll
 * position.
 *
 * The consequence is that nothing here can take the active chapter as a prop —
 * the chapter-aware pieces are client components that read it from the URL.
 * Anything that exists on some pages only (the abstract on page 1, the end
 * matter on the last) belongs to the page's text, in ChapterBody: that way
 * nothing outside the text changes size when the reader turns a page.
 */
export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shell = await getPostShell(slug);

  if (!shell) {
    notFound();
  }

  const { post, outline, paginated, contents } = shell;
  const words = strings(post.lang);
  const hasSidebar = contents.length > 1;

  return (
    <div lang={post.lang} className="mx-auto max-w-[1100px] px-6 py-20">
      <CopyButtons />
      {paginated && (
        <>
          <ScrollProgressBar />
          <ChapterKeyboardNav outline={outline} />
        </>
      )}

      {/* Back */}
      <Blur delay={0}>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft size={14} /> {words.backToBlog}
        </Link>
      </Blur>

      <Fade delay={100}>
        <article>
          <PostHeader post={post} outline={outline} />

          {/* Mobile TOC (between title and content on small screens) */}
          {hasSidebar && (
            <div className="lg:hidden mb-8">
              <TableOfContents contents={contents} outline={outline} lang={post.lang} />
            </div>
          )}

          {/* Content + TOC side by side */}
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 min-w-0 max-w-[720px]">
              {/* The only part that changes between chapters. */}
              {children}
            </div>

            {/* Sidebar TOC */}
            {hasSidebar && (
              <aside className="hidden lg:block w-[220px] shrink-0">
                <TableOfContents contents={contents} outline={outline} lang={post.lang} />
              </aside>
            )}
          </div>
        </article>
      </Fade>

      {paginated && <ChapterNav outline={outline} lang={post.lang} />}

      {/* Navigation */}
      <div className="mt-16 pt-6 border-t border-divider">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> {words.backToBlog}
        </Link>
      </div>
    </div>
  );
}
