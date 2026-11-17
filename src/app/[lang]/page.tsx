import { notFound } from "next/navigation";
import Link from "@/components/site/LocaleLink";
import { getAllPosts } from "@/lib/blog";
import { getBio } from "@/lib/bio";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import GitHubContributions from "@/components/project/GitHubContributions";
import HomeHero from "@/components/site/HomeHero";
import ContentLanguageNotice from "@/components/site/ContentLanguageNotice";
import { formatDate } from "@/lib/date";
import { isLang } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n/dictionary";

export default async function Home({ params }: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const words = dictionary(lang);
  const blogPosts = getAllPosts(lang);
  const bio = getBio(lang);
  const updated = formatDate(bio.updated, "long", words.locale);

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20">
      {/* Bio Section */}
      <HomeHero
        title={bio.title}
        updated={updated ? words.home.updated(updated) : ""}
        paragraphs={bio.paragraphs}
      />
      {(bio.lang !== lang || bio.translatedFrom) && (
        <ContentLanguageNotice lang={lang} contentLang={bio.lang} translatedFrom={bio.translatedFrom} originalPath="/" />
      )}

      {/* GitHub Contributions */}
      <GitHubContributions />

      {/* Blog / Writing Section — left out while there are no posts */}
      {blogPosts.length > 0 && (
      <section className="pb-16">
        <Blur delay={100} inView inViewMargin="-50px">
          <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-6">
            {words.home.blog}
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
                  {formatDate(post.date, "short", words.locale)}
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
