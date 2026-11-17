import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllPosts, getChapterOutline, postKey } from "@/lib/blog";
import { getAllProjectSlugs } from "@/lib/projects";
import { LOCALES, localePath, type Lang } from "@/lib/i18n";

type Entry = MetadataRoute.Sitemap[number];

/** `hreflang` links between the languages a page exists in. */
function alternates(path: string, langs: readonly Lang[]): Entry["alternates"] {
  return {
    languages: Object.fromEntries(langs.map((lang) => [lang, `${SITE_URL}${localePath(lang, path)}`])),
  };
}

/** A page that exists in both languages: one entry per language, each pointing at the other. */
function inBothLanguages(path: string, priority: number): Entry[] {
  return LOCALES.map((lang) => ({
    url: `${SITE_URL}${localePath(lang, path)}`,
    changeFrequency: "monthly" as const,
    priority,
    alternates: alternates(path, LOCALES),
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/projects", "/blog", "/shop", "/shop/latex-templates"].flatMap((route) =>
    inBothLanguages(route || "/", route === "" ? 1 : 0.7)
  );

  // A post is listed at the address in the language it is written in. When the
  // build also made a machine translation, the other language's address is a text
  // of its own and is listed too, each pointing at the other with `hreflang`.
  // Otherwise that address shows the same text and is not canonical.
  // Paginated posts contribute one URL per chapter: each chapter is its own
  // indexed document, so each belongs here. getChapterOutline is synchronous
  // and returns [] for single-page posts.
  const blogRoutes = getAllPosts().flatMap((post) => {
    const languages = LOCALES.filter((lang) => lang === post.lang || postKey(post.slug, lang) !== post.slug);
    return languages.flatMap((lang) => {
      const key = lang === post.lang ? post.slug : postKey(post.slug, lang);
      const chapters = getChapterOutline(key);
      const paths =
        chapters.length === 0
          ? [{ path: `/blog/${post.slug}`, priority: 0.6 }]
          : chapters.map((chapter) => ({ path: chapter.href, priority: chapter.index === 1 ? 0.6 : 0.5 }));
      return paths.map(({ path, priority }) => ({
        url: `${SITE_URL}${localePath(lang, path)}`,
        changeFrequency: "monthly" as const,
        priority,
        ...(languages.length > 1 ? { alternates: alternates(path, languages) } : {}),
      }));
    });
  });

  const projectRoutes = getAllProjectSlugs().flatMap((slug) => inBothLanguages(`/projects/${slug}`, 0.6));

  return [...staticRoutes, ...blogRoutes, ...projectRoutes];
}
