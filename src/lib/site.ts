/**
 * Canonical site URL used for metadata, Open Graph, sitemap, and RSS.
 * Override per-environment with NEXT_PUBLIC_SITE_URL (e.g. the Vercel URL);
 * falls back to the production domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mitaa.dev"
).replace(/\/$/, "");

export const SITE_NAME = "mitaa.dev";
export const SITE_DESCRIPTION =
  "mitaa.dev — junior electrical engineer & developer working on embedded systems, PCB design, and web development.";
export const SITE_AUTHOR = "Mitchel";
export const TWITTER_HANDLE = "@MITCHEL_Dev";

/** The byline, author card and citation of a blog post. */
export const AUTHOR_NAME = "Mitchel Reints";
/** Square image under public/, or null for an initials circle. */
export const AUTHOR_AVATAR: string | null = null;
/** One or two sentences under the author's name at the end of a post, per post language. */
export const AUTHOR_BIO = {
  en: "Junior electrical engineer and developer. Builds embedded systems, designs PCBs and writes up the occasional longer report when a hunch asks for numbers.",
  nl: "Junior elektrotechnicus en ontwikkelaar. Bouwt embedded systemen, ontwerpt PCB's en schrijft af en toe een langer verslag wanneer een vermoeden om cijfers vraagt.",
} as const;
