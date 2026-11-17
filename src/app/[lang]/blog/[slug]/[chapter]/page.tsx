import { notFound } from "next/navigation";
import { getAllSlugs, getChapterOutline, getPostChapter, postKey } from "@/lib/blog";
import type { Lang } from "@/lib/i18n";
import { isLang } from "@/lib/i18n";
import ChapterBody from "../ChapterBody";
import { buildChapterMetadata } from "../metadata";

// Every chapter is known from files on disk at build time, so an unknown
// chapter slug should 404 at the routing layer rather than render on demand.
export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  // Params are only inherited from a parent *layout* when the layout itself
  // declares them, so this route enumerates both segments. It runs once per
  // language: a translation keeps the chapter addresses of the original, but a
  // post may have no translation, and then the original's are used.
  const lang = params.lang as Lang;
  return getAllSlugs().flatMap((slug) =>
    getChapterOutline(postKey(slug, lang)).map((chapter) => ({ slug, chapter: chapter.slug }))
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
  const data = await getPostChapter(postKey(slug, lang), chapter);

  if (!data) {
    notFound();
  }

  return <ChapterBody data={data} lang={lang} />;
}
