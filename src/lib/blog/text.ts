/** Small string helpers shared across the blog pipeline. */

export function countWords(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

/** Estimated reading time in minutes (~200 words per minute). */
export function minutesFromWords(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

/** Reading time as the site's lists show it: "7 min read". */
export function readTimeFromWords(words: number): string {
  return `${minutesFromWords(words)} min read`;
}

/**
 * Slugify a heading or chapter title. Intentionally ASCII-only, matching the
 * anchors this blog has always produced.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** slugify() plus a collision counter scoped to `seen`. */
export function uniqueSlug(value: string, seen: Map<string, number>): string {
  const base = slugify(value) || "section";
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n === 0 ? base : `${base}-${n}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
