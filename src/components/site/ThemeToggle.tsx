"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/** Never changes, so the snapshot below is read once per render pass. */
const subscribe = () => () => {};

/** Floating light/dark toggle. */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);


  // `resolvedTheme` is only known in the browser, so until hydration both sides
  // have to render the same thing. Every attribute derived from it must follow
  // `mounted` — guarding only the icon leaves aria-label and title mismatching.
  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="fixed bottom-5 right-5 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/90 text-muted shadow-sm backdrop-blur-sm transition-colors hover:border-foreground/20 hover:text-foreground"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
