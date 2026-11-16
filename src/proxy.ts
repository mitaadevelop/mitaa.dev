import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routeFor } from "@/lib/i18n/route";

/**
 * Dutch is served without a prefix (`/blog`), English under `/en`. Every page is a
 * route under `app/[lang]`, so this rewrites `/blog` to `/nl/blog` inside Next and
 * sends `/nl/blog` to `/blog`. The decision itself is `routeFor`, which has tests.
 */
export function proxy(request: NextRequest) {
  const route = routeFor(request.nextUrl.pathname);
  if (route.action === "next") return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = route.to;
  return route.action === "redirect" ? NextResponse.redirect(url, 308) : NextResponse.rewrite(url);
}

export const config = {
  // Everything except Next's own files; `routeFor` leaves public files and the
  // routes that have no language alone.
  matcher: ["/((?!_next/).*)"],
};
