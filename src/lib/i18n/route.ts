/**
 * What `src/proxy.ts` does with an address, as a pure function so it can be tested
 * without Next. Dutch has no prefix, English has `/en`, and every page is one route
 * under `app/[lang]`.
 */
import { ASSET_PATH, SITE_LANG } from "./index";

export type Route =
  /** Leave it: an English page, a file, or a route that is not per language. */
  | { action: "next" }
  /** `/blog` is served by `/nl/blog`; the address in the browser stays `/blog`. */
  | { action: "rewrite"; to: string }
  /** `/nl/blog` has one address, `/blog`. */
  | { action: "redirect"; to: string };

/** Routes outside `app/[lang]`: they have no language. */
const NOT_PER_LANGUAGE = /^\/(?:api(?:\/|$)|sitemap\.xml$|opengraph-image(?:\/|$))/;

export function routeFor(pathname: string): Route {
  if (ASSET_PATH.test(pathname) || NOT_PER_LANGUAGE.test(pathname)) return { action: "next" };

  if (pathname === "/en" || pathname.startsWith("/en/")) return { action: "next" };

  if (pathname === `/${SITE_LANG}` || pathname.startsWith(`/${SITE_LANG}/`)) {
    return { action: "redirect", to: pathname.slice(`/${SITE_LANG}`.length) || "/" };
  }

  return { action: "rewrite", to: `/${SITE_LANG}${pathname === "/" ? "" : pathname}` };
}
