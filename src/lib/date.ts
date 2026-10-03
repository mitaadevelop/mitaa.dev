const FORMATS = {
  /** September 18, 2026 */
  long: { year: "numeric", month: "long", day: "numeric" },
  /** Sep 18, 2026 */
  short: { year: "numeric", month: "short", day: "numeric" },
  /** Sep 2026 */
  month: { year: "numeric", month: "short" },
  /** 09/18/2026 (en-US), 18-09-2026 (nl-NL) */
  numeric: { year: "numeric", month: "2-digit", day: "2-digit" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateStyle = keyof typeof FORMATS;

/**
 * Format a calendar date such as `2026-09-18`.
 *
 * Always in UTC. `new Date("2026-09-18")` is midnight UTC, so formatting it in
 * the local time zone shows the *previous* day anywhere west of Greenwich. In a
 * client component that is also a hydration mismatch: the server renders in UTC
 * and the visitor's browser re-renders in theirs. These are calendar dates, not
 * instants, so UTC is simply the correct reading.
 *
 * `locale` follows the post's language (`nl-NL` for a Dutch post); the site's
 * own pages leave it at the default.
 *
 * Returns null for a missing or unparseable date.
 */
export function formatDate(
  iso: string | undefined,
  style: DateStyle = "long",
  locale = "en-US"
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale, { ...FORMATS[style], timeZone: "UTC" });
}
