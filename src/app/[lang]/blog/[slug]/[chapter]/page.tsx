import { notFound } from "next/navigation";
import { getAllSlugs, getChapterOutline, getPostChapter } from "@/lib/blog";
import { isLang } from "@/lib/i18n";
import ChapterBody from "../ChapterBody";
import { buildChapterMetadata } from "../metadata";

// Every chapter is known from files on disk at build time, so an unknown
// chapter slug should 404 at the routing layer rather than render on demand.
export const dynamicParams = false;

export function generateStaticParams() {
  // Params are only inherited from a parent *layout* when the layout itself
  // declares them, so this route enumerates both segments.
  return getAllSlugs().flatMap((slug) =>
    getChapterOutline(slug).map((chapter) => ({ slug, chapter: chapter.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string; chapter: string }>;
}) {
  const { lang, slug, chapter } = await params;
  if (!isLang(lang)) return {};
  return buildChapterMetadata(lang, slug, chapter);
}

export default async function BlogChapterPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string; chapter: string }>;
}) {
  const { lang, slug, chapter } = await params;
  if (!isLang(lang)) notFound();
  const data = await getPostChapter(slug, chapter);

  if (!data) {
    notFound();
  }

  return <ChapterBody data={data} lang={lang} />;
}
