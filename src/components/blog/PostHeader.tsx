import Image from "next/image";
import { FileDown } from "lucide-react";
import type { BlogPost, ChapterRef } from "@/lib/blog/types";
import { formatBytes, strings } from "@/lib/blog/i18n";
import { formatDate } from "@/lib/date";
import { AUTHOR_NAME } from "@/lib/site";
import ChapterMeta from "./ChapterMeta";

interface PostHeaderProps {
  post: BlogPost;
  /** The post's pages; empty for a single-page post. */
  outline: ChapterRef[];
}

/**
 * The post header — identical on every page of a post, so that moving between
 * pages changes nothing here but the "Page N of M" pill. The abstract is part
 * of page 1's text instead (PostAbstract, rendered by the page).
 */
export default function PostHeader({ post, outline }: Readonly<PostHeaderProps>) {
  const words = strings(post.lang);

  const byline = [
    post.author ?? AUTHOR_NAME,
    post.affiliation,
    post.version &&
      [
        post.version.label,
        post.version.date
          ? `${words.revised} ${formatDate(post.version.date, "numeric", words.locale)}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
  ].filter(Boolean);

  return (
    <div
      className={`mb-10 grid gap-8 sm:items-start ${
        post.image ? "sm:grid-cols-[minmax(0,1fr)_200px] md:grid-cols-[minmax(0,1fr)_240px]" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {post.kind && (
            <span className="text-[11px] font-medium tracking-[0.8px] uppercase text-muted">{post.kind}</span>
          )}
          <span className="text-[13px] text-date">{formatDate(post.date, "long", words.locale)}</span>
          {outline.length > 1 ? (
            <ChapterMeta outline={outline} totalMinutes={post.readMinutes} lang={post.lang} />
          ) : (
            <span className="text-[13px] text-date">{words.readTime(post.readMinutes)}</span>
          )}
        </div>

        <h1 className="mb-4 text-[32px] font-semibold leading-tight tracking-[-1.5px] text-foreground sm:text-[40px]">
          {post.title}
        </h1>

        {post.subtitle && <p className="-mt-2 mb-4 text-[15px] text-muted">{post.subtitle}</p>}

        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-badge-bg px-2 py-0.5 text-[11px] font-medium text-badge-text"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className="text-[13px] text-muted">{byline.join(" · ")}</p>
          {post.pdf && (
            <a
              href={post.pdf.href}
              download
              className="inline-flex items-center gap-1.5 rounded-full border border-divider px-3 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-card-hover"
            >
              <FileDown size={13} aria-hidden="true" />
              {words.downloadPdf} · {formatBytes(post.pdf.bytes, post.lang)}
            </a>
          )}
        </div>
      </div>

      {post.image && (
        <div className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-lg border border-divider bg-secondary sm:justify-self-end">
          <Image
            src={post.image}
            alt=""
            fill
            priority
            sizes="(max-width: 639px) 240px, (max-width: 767px) 200px, 240px"
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}
