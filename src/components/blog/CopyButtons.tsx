"use client";

import { useEffect } from "react";

/**
 * Makes every `button[data-copy]` in a post copy the code next to it.
 *
 * The buttons are in HTML the LaTeX pipeline rendered and the page injects
 * with dangerouslySetInnerHTML, so they cannot carry React handlers; one
 * delegated listener serves them all, including those on pages the reader
 * navigates to later. Renders nothing.
 *
 * Code is copied line by line from its `.line` spans, which leaves the line
 * numbers (CSS counters) out.
 */
export default function CopyButtons() {
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();

    async function onClick(event: MouseEvent) {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button[data-copy]");
      if (!button) return;
      const code = button.closest("figure")?.querySelector("code");
      if (!code) return;

      const lines = code.querySelectorAll(".line");
      const text =
        lines.length > 0 ? Array.from(lines, (line) => line.textContent ?? "").join("\n") : (code.textContent ?? "");

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return;
      }
      const label = button.textContent;
      button.textContent = button.dataset.copiedLabel ?? "✓";
      const timer = setTimeout(() => {
        button.textContent = label;
        timers.delete(timer);
      }, 1600);
      timers.add(timer);
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}
