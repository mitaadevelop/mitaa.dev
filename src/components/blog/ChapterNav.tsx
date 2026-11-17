"use client";

import Link from "@/components/site/LocaleLink";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ChapterRef, Lang } from "@/lib/blog/types";
import { strings } from "@/lib/blog/i18n";
import { pageTransition, useCurrentChapter } from "./useCurrentChapter";

const blockClass =
  "group rounded-md border border-divider p-4 transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const kickerClass =
  "flex items-center gap-1.5 text-[11px] font-medium tracking-[0.8px] uppercase text-date";

/**
 * Pagination under a page: where the reader is ("Page 4 of 5", one dot per
 * page), and the previous and next page by title.
 */
export default function ChapterNav({ outline, lang }: Readonly<{ outline: ChapterRef[]; lang: Lang }>) {
  const current = useCurrentChapter(outline);
  const words = strings(lang);
  if (!current) return null;

  const prev = outline[current.index - 2];
  const next = outline[current.index];
  if (!prev && !next) return null;

  return (
    <nav aria-label={words.chapters} className="mt-16 pt-6 border-t border-divider">
      <div className="mb-4 flex items-center justify-center gap-3">
        <span className="text-[12px] text-date tabular-nums">
          {words.pageOf(current.index, outline.length)}
        </span>
        <ol className="flex items-center gap-1.5">
          {outline.map((chapter) => {
            const here = chapter.index === current.index;
            return (
              <li key={chapter.slug} className="flex">
                <Link
                  href={chapter.href}
                  transitionTypes={pageTransition(current.index, chapter.index)}
                  aria-label={`${words.page(chapter.index)}: ${chapter.title}`}
                  aria-current={here ? "page" : undefined}
                  className="flex h-5 items-center"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      here ? "w-4 bg-foreground" : "w-1.5 bg-date hover:bg-muted"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {prev && (
          <Link href={prev.href} rel="prev" transitionTypes={["page-back"]} className={blockClass}>
            <span className={kickerClass}>
              <ArrowLeft size={14} /> {words.previous}
            </span>
            <span className="mt-1 block text-[14px] font-medium text-foreground">
              {prev.index}. {prev.title}
            </span>
          </Link>
        )}
        {next && (
          <Link
            href={next.href}
            rel="next"
            transitionTypes={["page-forward"]}
            className={`${blockClass} sm:col-start-2 text-right`}
          >
            <span className={`${kickerClass} justify-end`}>
              {words.next} <ArrowRight size={14} />
            </span>
            <span className="mt-1 block text-[14px] font-medium text-foreground">
              {next.index}. {next.title}
            </span>
          </Link>
        )}
      </div>
      <p className="mt-3 text-[12px] text-date">{words.keyboardTip}</p>
    </nav>
  );
}
