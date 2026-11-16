import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { BlogPost, Lang } from "@/lib/blog/types";
import { strings } from "@/lib/blog/i18n";

const blockClass =
  "group rounded-md border border-divider p-4 transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const kickerClass =
  "flex items-center gap-1.5 text-[11px] font-medium tracking-[0.8px] uppercase text-date";

interface PostNavProps {
  previous?: BlogPost;
  next?: BlogPost;
  lang: Lang;
}

/** The older and the newer post, after the last page of this one. */
export default function PostNav({ previous, next, lang }: Readonly<PostNavProps>) {
  const words = strings(lang);
  if (!previous && !next) return null;

  return (
    <nav aria-label={words.otherPosts} className="mt-12">
      <p className="mb-3 text-[11px] font-medium tracking-[0.8px] uppercase text-date">{words.otherPosts}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {previous && (
          <Link href={`/blog/${previous.slug}`} className={blockClass}>
            <span className={kickerClass}>
              <ArrowLeft size={14} /> {words.previous}
            </span>
            <span className="mt-1 block text-[14px] font-medium text-foreground">{previous.title}</span>
          </Link>
        )}
        {next && (
          <Link href={`/blog/${next.slug}`} className={`${blockClass} sm:col-start-2 text-right`}>
            <span className={`${kickerClass} justify-end`}>
              {words.next} <ArrowRight size={14} />
            </span>
            <span className="mt-1 block text-[14px] font-medium text-foreground">{next.title}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
