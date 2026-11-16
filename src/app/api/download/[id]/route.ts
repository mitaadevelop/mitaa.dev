import { after, type NextRequest } from "next/server";
import { countDownload, DOWNLOADS, overleafUrl, visitorOf } from "@/lib/downloads";

// A download link: count it, then send the browser to the static file — or,
// with ?open=overleaf, to Overleaf, which fetches the ZIP itself. The count
// runs after the redirect is sent, so it never slows a download down.
//
// The redirect must never be cached, or the CDN would answer the next click
// without running this handler, and that click would not be counted.

function target(request: NextRequest, id: string): string | null {
  const download = DOWNLOADS[id];
  if (!download) return null;
  const fileUrl = new URL(download.file, request.url).toString();
  const overleaf = request.nextUrl.searchParams.get("open") === "overleaf";
  return overleaf && download.overleafName
    ? overleafUrl(fileUrl, download.overleafName)
    : fileUrl;
}

function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/download/[id]">) {
  const { id } = await ctx.params;
  const location = target(request, id);
  if (!location) return new Response("Not found", { status: 404 });

  const visitor = visitorOf(request.headers);
  after(() => countDownload(id, visitor));
  return redirect(location);
}

// Link checkers and previews ask with HEAD; they get the same answer, uncounted.
export async function HEAD(request: NextRequest, ctx: RouteContext<"/api/download/[id]">) {
  const { id } = await ctx.params;
  const location = target(request, id);
  return location ? redirect(location) : new Response(null, { status: 404 });
}
