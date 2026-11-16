/**
 * Download counting for the shop: every free file is served through
 * /api/download/<id>, which counts it here and redirects to the static file.
 *
 * Counts live in Upstash Redis, reached over its REST API with plain fetch.
 * The credentials come from the Vercel Marketplace integration (KV_REST_API_*)
 * or straight from Upstash (UPSTASH_REDIS_REST_*). Without them nothing is
 * counted and no count is shown; downloads keep working.
 *
 * One visitor counts once per file per day. The visitor is a hash of the IP,
 * the user agent, the file and the date, kept for a day; no IP is stored.
 */
import { createHash } from "node:crypto";
import { shopProduct } from "@/data/shop";
import {
  latexCheatsheet,
  latexTemplates,
  templateDownloadId,
  templateFiles,
} from "@/data/latex-templates";

export type Download = {
  /** Public path of the file, under public/. */
  file: string;
  /** Project name Overleaf gives a template opened from the shop. */
  overleafName?: string;
};

/** Every file that can be downloaded and counted, by id. */
export const DOWNLOADS: Record<string, Download> = {
  [shopProduct.download.id]: { file: shopProduct.download.file },
  [latexCheatsheet.id]: { file: latexCheatsheet.files.pdf },
  ...Object.fromEntries(
    latexTemplates.map((template) => [
      templateDownloadId(template.slug),
      {
        file: templateFiles(template).zip,
        overleafName: `${template.title} (mitaa.dev)`,
      },
    ]),
  ),
};

/** Seconds before the same visitor counts again for the same file. */
const VISITOR_WINDOW = 60 * 60 * 24;

/** Seconds a page keeps its counts before asking Redis again. */
export const COUNTS_REVALIDATE = 60;

/** Crawlers, link previews and scripts: they follow links but are not downloads. */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|curl|wget|python|httpclient|headless|lighthouse/i;

// Set the visitor's key if it is new and only then increment the count, in one
// round trip. Returns the new count, or 0 when the visitor was already seen.
const COUNT_SCRIPT = `if redis.call('SET', KEYS[1], '1', 'NX', 'EX', ARGV[1]) then
  return redis.call('INCR', KEYS[2])
end
return 0`;

function redis(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

const countKey = (id: string) => `downloads:count:${id}`;

/** What a request says about who sent it, read before the response is sent. */
export type Visitor = { ip: string; userAgent: string };

export function visitorOf(headers: Headers): Visitor {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || headers.get("x-real-ip") || "unknown",
    userAgent: headers.get("user-agent") ?? "",
  };
}

export function isBot(userAgent: string): boolean {
  return userAgent === "" || BOT_PATTERN.test(userAgent);
}

/** Count one download of `id`, unless this visitor already did today. Never throws. */
export async function countDownload(id: string, visitor: Visitor): Promise<void> {
  const db = redis();
  if (!db || isBot(visitor.userAgent)) return;

  const day = new Date().toISOString().slice(0, 10);
  const hash = createHash("sha256")
    .update(`${day}|${visitor.ip}|${visitor.userAgent}|${id}`)
    .digest("hex")
    .slice(0, 32);

  try {
    await fetch(db.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${db.token}` },
      body: JSON.stringify([
        "EVAL",
        COUNT_SCRIPT,
        "2",
        `downloads:seen:${hash}`,
        countKey(id),
        String(VISITOR_WINDOW),
      ]),
      cache: "no-store",
    });
  } catch {
    // A lost count is better than a failed download.
  }
}

/**
 * The download count of every file, by id, or null when Redis is not set up
 * or does not answer, so that the page shows no count rather than zeros.
 */
export async function getDownloadCounts(): Promise<Record<string, number> | null> {
  const db = redis();
  if (!db) return null;

  const ids = Object.keys(DOWNLOADS);
  try {
    const keys = ids.map((id) => encodeURIComponent(countKey(id))).join("/");
    const response = await fetch(`${db.url}/mget/${keys}`, {
      headers: { Authorization: `Bearer ${db.token}` },
      next: { revalidate: COUNTS_REVALIDATE },
    });
    if (!response.ok) return null;
    const { result } = (await response.json()) as { result: (string | null)[] };
    return Object.fromEntries(ids.map((id, i) => [id, Number(result[i] ?? 0)]));
  } catch {
    return null;
  }
}

/** The sum of several counts; null when counts are unavailable. */
export function sumCounts(counts: Record<string, number> | null, ids: string[]): number | null {
  return counts ? ids.reduce((total, id) => total + (counts[id] ?? 0), 0) : null;
}

/** The link that opens a template ZIP as a new Overleaf project. */
export function overleafUrl(zipUrl: string, name: string): string {
  const params = new URLSearchParams({ snip_uri: zipUrl, snip_name: name });
  return `https://www.overleaf.com/docs?${params}`;
}
