import { notFound } from "next/navigation";
import { getAllSlugs, getPostChapter } from "@/lib/blog";
import ChapterBody from "./ChapterBody";
import { buildChapterMetadata } from "./metadata";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return buildChapterMetadata(slug);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPostChapter(slug);

  if (!data) {
    notFound();
  }

  return <ChapterBody data={data} />;
}
