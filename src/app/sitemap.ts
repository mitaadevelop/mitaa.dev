import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllSlugs, getChapterOutline } from "@/lib/blog";
import { getAllProjectSlugs } from "@/lib/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/projects", "/blog", "/shop"].map(
    (route) => ({
      url: `${SITE_URL}${route || "/"}`,
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.7,
    })
  );

  // Paginated posts contribute one URL per chapter: each chapter is its own
  // indexed document, so each belongs here. getChapterOutline is synchronous
  // and returns [] for single-page posts.
  const blogRoutes = getAllSlugs().flatMap((slug) => {
    const chapters = getChapterOutline(slug);
    if (chapters.length === 0) {
      return [
        {
          url: `${SITE_URL}/blog/${slug}`,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        },
      ];
    }
    return chapters.map((chapter) => ({
      url: `${SITE_URL}${chapter.href}`,
      changeFrequency: "monthly" as const,
      priority: chapter.index === 1 ? 0.6 : 0.5,
    }));
  });

  const projectRoutes = getAllProjectSlugs().map((slug) => ({
    url: `${SITE_URL}/projects/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes, ...projectRoutes];
}
