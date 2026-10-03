"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ChapterRef, ContentsEntry, Lang } from "@/lib/blog/types";
import { strings } from "@/lib/blog/i18n";
import { pageTransition, useCurrentChapter } from "./useCurrentChapter";

/** Stable reference, so an empty page never restarts the scroll-spy effect. */
const NO_ITEMS: ContentsEntry[] = [];

interface TableOfContentsProps {
  /** Every heading of the post, with its page. */
  contents: ContentsEntry[];
  /** The post's pages; empty for a single-page post. */
  outline: ChapterRef[];
  lang: Lang;
}

/**
 * The whole post at a glance: every section and subsection with its number,
 * and on a paginated post the page it is on. Headings on the current page are
 * picked out, and among them the one being read.
 *
 * This lives in the post layout and stays mounted while pages change, so the
 * current page comes from the URL rather than from a prop.
 */
export default function TableOfContents({ contents, outline, lang }: Readonly<TableOfContentsProps>) {
  const words = strings(lang);
  const current = useCurrentChapter(outline);
  const page = current?.index ?? 1;
  const paginated = outline.length > 1;

  const onThisPage = useMemo(() => {
    const items = contents.filter((entry) => entry.page === page);
    return items.length > 0 ? items : NO_ITEMS;
  }, [contents, page]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const elements = onThisPage
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // The heading being read is the last one scrolled past the top third.
    const observer = new IntersectionObserver(
      () => {
        let id = elements[0].id;
        for (const el of elements) {
          if (el.getBoundingClientRect().top <= window.innerHeight * 0.33) id = el.id;
        }
        setActiveId(id);
      },
      { rootMargin: "0px 0px -66% 0px", threshold: [0, 1] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [onThisPage]);

  if (contents.length === 0) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    globalThis.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <nav aria-label={words.contents} className="sticky top-8 border-l-2 border-divider pl-4">
      <p className="mb-3 text-[11px] font-medium tracking-[0.8px] uppercase text-date">
        {paginated ? words.contents : words.onThisPage}
      </p>
      <ul className="space-y-1.5">
        {contents.map((entry) => {
          const here = entry.page === page;
          const active = here && entry.id === activeId;
          const firstOfPage = contents.find((c) => c.page === entry.page)?.id === entry.id;
          const row = (
            <>
              <span className="w-7 shrink-0 tabular-nums text-date">{entry.number}</span>
              <span className="min-w-0 flex-1">{entry.text}</span>
              {paginated && <span className="shrink-0 tabular-nums text-date">{entry.page}</span>}
            </>
          );
          const className = `flex gap-1.5 text-[13px] leading-snug transition-colors duration-200 ${
            entry.level > 2 ? "pl-3" : ""
          } ${active ? "font-medium text-foreground" : here ? "text-foreground" : "text-muted hover:text-foreground"}`;
          return (
            <li key={`${entry.page}-${entry.id}`}>
              {here ? (
                <a
                  href={`#${entry.id}`}
                  aria-current={active ? "location" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollTo(entry.id);
                  }}
                  className={className}
                >
                  {row}
                </a>
              ) : (
                <Link
                  href={firstOfPage ? entry.href : `${entry.href}#${entry.id}`}
                  transitionTypes={pageTransition(page, entry.page)}
                  className={className}
                >
                  {row}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
