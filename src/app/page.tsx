import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { getBio } from "@/lib/bio";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import GitHubContributions from "@/components/project/GitHubContributions";
import { formatDate } from "@/lib/date";

export default function Home() {
  const blogPosts = getAllPosts();
  const bio = getBio();

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20">
      {/* Bio Section */}
      <section className="pt-20 sm:pt-28 pb-16">
        <Blur delay={0}>
          <h1 className="text-[40px] sm:text-[48px] font-semibold tracking-[-1.5px] leading-tight text-foreground">
            {bio.title}
          </h1>
        </Blur>

        <Blur delay={50}>
          <div className="mt-2 flex items-center gap-4">
            <p className="text-[13px] text-date font-medium">
              Updated {bio.updated}
            </p>
            <span className="text-border">·</span>
            <nav className="flex items-center gap-3">
              <Link href="/projects" className="text-[13px] text-muted hover:text-foreground transition-colors font-medium">
                Projects
              </Link>
              <Link href="/blog" className="text-[13px] text-muted hover:text-foreground transition-colors font-medium">
                Blog
              </Link>
              <Link href="/shop" className="text-[13px] text-muted hover:text-foreground transition-colors font-medium">
                Shop
              </Link>
            </nav>
          </div>
        </Blur>

        <div className="mt-10 max-w-[720px] space-y-6">
          {bio.paragraphs.map((html, i) => (
            <Fade key={i} delay={100 + i * 100}>
              <p
                className="text-[13px] leading-[1.7] text-foreground"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </Fade>
          ))}
        </div>
      </section>

      {/* GitHub Contributions */}
      <GitHubContributions />

      {/* Blog / Writing Section — left out while there are no posts */}
      {blogPosts.length > 0 && (
      <section className="pb-16">
        <Blur delay={100} inView inViewMargin="-50px">
          <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-6">
            Blog
          </h2>
        </Blur>

        <div className="divide-y divide-divider">
          {blogPosts.map((post, i) => (
            <Fade key={post.slug} inView delay={i * 60}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-[15px] font-medium text-foreground group-hover:text-muted transition-colors">
                    {post.title}
                  </h3>
                  {post.tags.length > 0 && (
                    <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-badge-bg text-badge-text">
                      {post.tags[0]}
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-date shrink-0">
                  {formatDate(post.date, "short")}
                </span>
              </Link>
            </Fade>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}
