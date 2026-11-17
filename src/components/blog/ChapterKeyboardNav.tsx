"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ChapterRef } from "@/lib/blog/types";
import { useCurrentChapter } from "./useCurrentChapter";
import { useLang } from "@/components/site/LangProvider";
import { localePath } from "@/lib/i18n";

/**
 * Arrow-key navigation between chapters. Renders nothing.
 *
 * This is purely additive: ChapterNav and the table of contents already provide
 * real focusable links, and Next's built-in route announcer reads the new page
 * on client navigation, so no extra live region is needed here.
 */
export default function ChapterKeyboardNav({ outline }: Readonly<{ outline: ChapterRef[] }>) {
  const router = useRouter();
  const lang = useLang();
  const current = useCurrentChapter(outline);
  // The outline's addresses have no language prefix; the router needs the real ones.
  const prevHref = current && outline[current.index - 2] ? localePath(lang, outline[current.index - 2].href) : undefined;
  const nextHref = current && outline[current.index] ? localePath(lang, outline[current.index].href) : undefined;

  useEffect(() => {
    if (prevHref) router.prefetch(prevHref);
    if (nextHref) router.prefetch(nextHref);

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      // Cmd+Left / Alt+Left is browser Back. Never take that over.
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.isContentEditable) return;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      // Arrow keys are how keyboard users scroll a wide equation, code block or
      // table sideways, so leave those alone too.
      if (target.closest(".math-scroll, pre, table")) return;

      const back = event.key === "ArrowLeft";
      const href = back ? prevHref : nextHref;
      if (!href) return;
      event.preventDefault();
      router.push(href, { transitionTypes: [back ? "page-back" : "page-forward"] });
    }

    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [prevHref, nextHref, router]);

  return null;
}
