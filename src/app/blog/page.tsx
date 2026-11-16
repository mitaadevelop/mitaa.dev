import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { formatDate } from "@/lib/date";

export const metadata = {
  title: "Blog | mitaa.dev",
  description: "Technical articles, devlogs, and tutorials.",
};

export default function BlogPage() {
  const blogPosts = getAllPosts();

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20 py-20">
      {/* Back */}
      <Blur delay={0}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft size={14} /> mitaa.dev
        </Link>
      </Blur>

      {/* Header */}
      <Blur delay={50}>
        <h1 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-8">
          Blog
        </h1>
      </Blur>

      {/* Posts */}
      {blogPosts.length === 0 && (
        <p className="text-[14px] text-muted">No posts yet.</p>
      )}
      <div className="divide-y divide-divider">
        {blogPosts.map((post, i) => (
          <Fade key={post.slug} inView delay={i * 60}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex min-h-32 items-center rounded-sm py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex w-full items-center gap-5">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h2 className="text-[15px] font-medium text-foreground transition-colors group-hover:text-muted">
                      {post.title}
                    </h2>
                    {post.tags.length > 0 && (
                      <span className="hidden rounded-full bg-badge-bg px-2 py-0.5 text-[11px] font-medium text-badge-text sm:inline-block">
                        {post.tags[0]}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 max-w-xl text-[14px] text-muted">
                    {post.excerpt}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-[13px] text-date">
                      {post.readTime}
                    </span>
                    <span className="text-[13px] text-date">
                      {formatDate(post.date, "short")}
                    </span>
                  </div>
                </div>

                {post.image && (
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-divider bg-secondary sm:size-24">
                    <Image
                      src={post.image}
                      alt=""
                      fill
                      sizes="(max-width: 639px) 80px, 96px"
                      className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                )}
              </div>
            </Link>
          </Fade>
        ))}
      </div>
    </div>
  );
}
