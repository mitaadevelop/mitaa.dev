import { watch } from "node:fs";
import path from "node:path";

// Live preview for `npm run dev`: a server-sent-events stream that says "this
// post changed" whenever a .tex in content/blog/ is saved. LivePreview (in the
// post layout) turns each message into a router.refresh(); the page itself is
// rendered on demand, so the new text is already what the next request reads.
//
// Development only: in production this route does not exist.

export const dynamic = "force-dynamic";

const POSTS_DIR = path.join(process.cwd(), "content/blog");
/** Editors write a file in several steps; one message per burst is enough. */
const DEBOUNCE_MS = 50;
/** A comment line now and then keeps proxies and the browser from closing an idle stream. */
const HEARTBEAT_MS = 25_000;

export function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup(); // the stream is already closed
        }
      };

      const pending = new Map<string, ReturnType<typeof setTimeout>>();
      const watcher = watch(POSTS_DIR, { persistent: false }, (_event, filename) => {
        if (!filename?.endsWith(".tex")) return;
        clearTimeout(pending.get(filename));
        pending.set(
          filename,
          setTimeout(() => {
            pending.delete(filename);
            send(`data: ${JSON.stringify({ file: filename })}\n\n`);
          }, DEBOUNCE_MS),
        );
      });
      const heartbeat = setInterval(() => send(": keep-alive\n\n"), HEARTBEAT_MS);

      cleanup = () => {
        watcher.close();
        clearInterval(heartbeat);
        pending.forEach(clearTimeout);
        pending.clear();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      request.signal.addEventListener("abort", cleanup, { once: true });
      send(": connected\n\n");
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
