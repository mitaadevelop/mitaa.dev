"use client";

import Link from "@/components/site/LocaleLink";
import { useDictionary } from "@/components/site/LangProvider";
import { parseLocale } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";

/** What the previous/next links need to know about a project. */
export interface ProjectNavItem {
  slug: string;
  title: string;
  category: string;
}

const blockClass =
  "group rounded-md border border-divider p-4 transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const kickerClass =
  "flex items-center gap-1.5 text-[11px] font-medium tracking-[0.8px] uppercase text-date";

/**
 * Everything around a project's content: the back links and the previous /
 * next project. It lives in the /projects layout — above `[slug]`, which Next
 * remounts per project — so moving from one project to the next swaps only
 * the content (the page, with its own ViewTransition) and this stays put.
 *
 * The same layout also holds the list at /projects, which brings its own
 * chrome, so there the frame is empty. The wrapping <div> is rendered either
 * way, on purpose: a ViewTransition only animates when its parent DOM node
 * survives the navigation, and swapping a fragment for a <div> would replace
 * it — the list ↔ project transitions would silently stop playing.
 */
export default function ProjectFrame({
  projects,
  children,
}: Readonly<{ projects: ProjectNavItem[]; children: React.ReactNode }>) {
  const { project: words } = useDictionary();
  // The language prefix is not part of the project address: `/en/projects/x` is project x.
  const pathname = parseLocale(usePathname()).path;
  const slug = pathname.startsWith("/projects/") ? pathname.slice("/projects/".length).split("/")[0] : null;
  const index = slug ? projects.findIndex((project) => project.slug === slug) : -1;
  const prev = index > 0 ? projects[index - 1] : undefined;
  const next = index >= 0 ? projects[index + 1] : undefined;

  return (
    <div className={slug ? "mx-auto max-w-[720px] px-6 py-20" : undefined}>
      {slug && (
        <Blur delay={0}>
          <Link
            href="/projects"
            transitionTypes={["page-back"]}
            className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft size={14} /> {words.back}
          </Link>
        </Blur>
      )}

      {/* The only part that changes between projects. */}
      {children}

      {slug && (prev || next) && (
        <nav aria-label={words.others} className="mt-16 pt-6 border-t border-divider">
          <div className="grid gap-3 sm:grid-cols-2">
            {prev && (
              <Link
                href={`/projects/${prev.slug}`}
                transitionTypes={["page-back"]}
                className={blockClass}
              >
                <span className={kickerClass}>
                  <ArrowLeft size={14} /> {words.previous}
                </span>
                <span className="mt-1 block text-[14px] font-medium text-foreground">{prev.title}</span>
                <span className="mt-0.5 block text-[11px] text-date">{prev.category}</span>
              </Link>
            )}
            {next && (
              <Link
                href={`/projects/${next.slug}`}
                transitionTypes={["page-forward"]}
                className={`${blockClass} sm:col-start-2 text-right`}
              >
                <span className={`${kickerClass} justify-end`}>
                  {words.next} <ArrowRight size={14} />
                </span>
                <span className="mt-1 block text-[14px] font-medium text-foreground">{next.title}</span>
                <span className="mt-0.5 block text-[11px] text-date">{next.category}</span>
              </Link>
            )}
          </div>
        </nav>
      )}

      {slug && (
        <div className="mt-16 pt-6 border-t border-divider">
          <Link
            href="/projects"
            transitionTypes={["page-back"]}
            className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> {words.back}
          </Link>
        </div>
      )}
    </div>
  );
}
