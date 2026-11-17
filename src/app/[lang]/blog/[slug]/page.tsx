import { notFound } from "next/navigation";
import { getAllSlugs, getPostChapter } from "@/lib/blog";
import { isLang } from "@/lib/i18n";
import ChapterBody from "./ChapterBody";
import { buildChapterMetadata } from "./metadata";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  return buildChapterMetadata(lang, slug);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const data = await getPostChapter(slug);

  if (!data) {
    notFound();
  }

  return <ChapterBody data={data} lang={lang} />;
}
