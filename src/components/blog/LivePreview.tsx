"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * `npm run dev` only: re-renders the open post when its .tex is saved.
 *
 * /api/blog-watch streams a message for every saved file in content/blog/; each
 * one becomes a router.refresh(), which re-renders the layout and the page on
 * the server and keeps scroll position and other client state. Nothing is
 * compiled — the site's own pipeline reads the .tex on every request. Renders
 * nothing.
 */
export default function LivePreview() {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource("/api/blog-watch");
    let timer: ReturnType<typeof setTimeout> | undefined;

    source.onmessage = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 100);
    };

    return () => {
      clearTimeout(timer);
      source.close();
    };
  }, [router]);

  return null;
}
