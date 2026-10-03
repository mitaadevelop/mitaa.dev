"use client";

import type { ChapterRef, Lang } from "@/lib/blog/types";
import { strings } from "@/lib/blog/i18n";
import { useCurrentChapter } from "./useCurrentChapter";

interface ChapterMetaProps {
  outline: ChapterRef[];
  /** Reading time of the whole post, in minutes. */
  totalMinutes: number;
  lang: Lang;
}

/** Where in the post the reader is: "Page 4 of 5 · 18 min total". */
export default function ChapterMeta({ outline, totalMinutes, lang }: Readonly<ChapterMetaProps>) {
  const current = useCurrentChapter(outline);
  const words = strings(lang);
  if (!current) return null;

  return (
    <span className="chapter-pill">
      {words.pageOf(current.index, outline.length)} · {words.minutes(totalMinutes)} {words.total}
    </span>
  );
}
