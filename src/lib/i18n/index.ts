/**
 * The site's languages and the addresses that go with them.
 *
 * Dutch is the site's own language and has no prefix: `/blog`. English lives
 * under `/en`: `/en/blog`. `src/proxy.ts` rewrites `/blog` to `/nl/blog` inside
 * Next, so every page is one route (`app/[lang]/…`) and `lang` arrives as a param.
 *
 * Pure functions, no fs/path: client components and the proxy import this module.
 */
import type { Lang } from "../blog/i18n";

export type { Lang };

/** Every language the site can be shown in. */
export const LOCALES: readonly Lang[] = ["nl", "en"];

/** The language without a prefix, and the one the site is written in. */
export const SITE_LANG: Lang = "nl";

export function isLang(value: unknown): value is Lang {
  return value === "nl" || value === "en";
}

export function otherLang(lang: Lang): Lang {
  return lang === "nl" ? "en" : "nl";
}

/**
 * A file from `public/` (an image, a PDF, a model): the same in every language, so it
 * never gets a prefix. A list of real extensions, not "has a dot": `/projects/mitaa.dev`
 * is a page. `.xml` is left out on purpose, because `/feed.xml` is a page per language.
 */
export const ASSET_PATH =
  /\.(?:png|jpe?g|webp|gif|avif|svg|ico|pdf|zip|csv|json|glb|gltf|step|stp|mp4|webm|txt|woff2?|kicad_[a-z]+)$/i;

/** Split `/en/blog/x?y#z` into the language, `/blog/x` and `?y#z`. A path without a prefix is Dutch. */
export function parseLocale(url: string): { lang: Lang; path: string; suffix: string } {
  const cut = url.search(/[?#]/);
  const pathname = cut < 0 ? url : url.slice(0, cut);
  const suffix = cut < 0 ? "" : url.slice(cut);
  const match = /^\/(nl|en)(?=\/|$)/.exec(pathname);
  if (!match) return { lang: SITE_LANG, path: pathname || "/", suffix };
  return { lang: match[1] as Lang, path: pathname.slice(match[0].length) || "/", suffix };
}

/** True for the addresses `localePath` may change: pages of this site, not other sites, files or anchors. */
function isPage(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  const cut = href.search(/[?#]/);
  return !ASSET_PATH.test(cut < 0 ? href : href.slice(0, cut));
}

/**
 * The address of `path` in `lang`: `/blog` is `/blog` in Dutch and `/en/blog` in
 * English. Other sites, anchors and files go through untouched, and a path that
 * already names a language is moved to the one asked for rather than prefixed twice.
 */
export function localePath(lang: Lang, href: string): string {
  if (!isPage(href)) return href;
  const { path, suffix } = parseLocale(href);
  if (lang === SITE_LANG) return `${path}${suffix}`;
  return `/${lang}${path === "/" ? "" : path}${suffix}`;
}

/** The same page in the other language: what the language button links to. */
export function switchPath(lang: Lang, pathname: string): string {
  const { path, suffix } = parseLocale(pathname);
  return localePath(otherLang(lang), `${path}${suffix}`);
}

/** A text that exists in both languages: `{ nl: "Gratis", en: "Free" }`. Used by data files, where there is no dictionary key. */
export type Localized<T = string> = { nl: T; en: T };

/** The text of a `Localized` value in `lang`. */
export function pick<T>(lang: Lang, value: Localized<T>): T {
  return value[lang];
}
