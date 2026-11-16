"use client";

import { usePathname } from "next/navigation";
import type { ChapterRef } from "@/lib/blog/types";

/**
 * The chapter currently being read, derived from the URL.
 *
 * The post chrome lives in the `[slug]` layout so it stays mounted while only
 * the chapter body swaps. That means it never re-renders on the server and
 * cannot be handed the active chapter as a prop — it reads it from the
 * pathname instead.
 */
export function useCurrentChapter(outline: ChapterRef[]): ChapterRef | undefined {
  const pathname = usePathname();
  return outline.find((chapter) => chapter.href === pathname) ?? outline[0];
}

/**
 * The view-transition type for a move between two pages of a post: the text
 * slides the way the reader is going (see ChapterBody and globals.css).
 */
export function pageTransition(from: number, to: number): string[] {
  if (to === from) return [];
  return [to > from ? "page-forward" : "page-back"];
}
