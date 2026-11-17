import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "@/components/site/LocaleLink";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import { strings } from "@/lib/blog/i18n";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { formatDate } from "@/lib/date";
import { isLang } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/metadata";

type Props = Readonly<{ params: Promise<{ lang: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const words = dictionary(lang).blogIndex;
  return {
    title: words.title,
    description: words.description,
    alternates: languageAlternates(lang, "/blog"),
  };
}

export default async function BlogPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const words = dictionary(lang);
  const blogPosts = getAllPosts(lang);

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
          {words.blogIndex.title}
        </h1>
      </Blur>

      {/* Posts */}
      {blogPosts.length === 0 && (
        <p className="text-[14px] text-muted">{words.blogIndex.empty}</p>
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
                      {/* In the post's own language, as on the post itself. */}
                      {strings(post.lang).readTime(post.readMinutes)}
                    </span>
                    <span className="text-[13px] text-date">
                      {formatDate(post.date, "short", words.locale)}
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
