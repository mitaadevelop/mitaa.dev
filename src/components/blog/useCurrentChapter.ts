"use client";

import { usePathname } from "next/navigation";
import type { ChapterRef } from "@/lib/blog/types";
import { parseLocale } from "@/lib/i18n";

/**
 * The chapter currently being read, derived from the URL.
 *
 * The post chrome lives in the `[slug]` layout so it stays mounted while only
 * the chapter body swaps. That means it never re-renders on the server and
 * cannot be handed the active chapter as a prop — it reads it from the
 * pathname instead. The chapter addresses in `outline` have no language prefix,
 * so the `/en` of an English page is taken off before they are compared.
 */
export function useCurrentChapter(outline: ChapterRef[]): ChapterRef | undefined {
  const { path } = parseLocale(usePathname());
  return outline.find((chapter) => chapter.href === path) ?? outline[0];
}

/**
 * The view-transition type for a move between two pages of a post: the text
 * slides the way the reader is going (see ChapterBody and globals.css).
 */
export function pageTransition(from: number, to: number): string[] {
  if (to === from) return [];
  return [to > from ? "page-forward" : "page-back"];
}
