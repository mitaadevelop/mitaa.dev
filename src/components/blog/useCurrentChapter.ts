"use client";

import { useEffect, useState } from "react";
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
 * How long the old text takes to leave plus the pause before the new text comes
 * in, in milliseconds: `--page-out` + `--page-gap` in globals.css, keep the two
 * in step. Everything around the text changes in that pause.
 */
const PAGE_SWAP_MS = 200;

/**
 * The page the post's chrome (page counter, contents, previous / next cards)
 * shows. It follows `useCurrentChapter`, but a moment late: the chrome is live
 * DOM and changes the instant the new page is rendered, which is while the old
 * text is still on its way out. Held back until the old text has gone, the
 * chrome changes in the pause between the two instead of on top of the text.
 *
 * Only for what is looked at. Anything that acts on the current page (the
 * arrow keys) must use `useCurrentChapter`, which is never behind.
 */
export function useShownChapter(outline: ChapterRef[]): ChapterRef | undefined {
  const current = useCurrentChapter(outline);
  const [shown, setShown] = useState(current);

  useEffect(() => {
    if (current?.href === shown?.href) return;
    const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setShown(current), reduced ? 0 : PAGE_SWAP_MS);
    return () => clearTimeout(timer);
  }, [current, shown]);

  return shown;
}

/**
 * The view-transition type for a move between two pages of a post: the text
 * slides the way the reader is going (see ChapterBody and globals.css).
 */
export function pageTransition(from: number, to: number): string[] {
  if (to === from) return [];
  return [to > from ? "page-forward" : "page-back"];
}
