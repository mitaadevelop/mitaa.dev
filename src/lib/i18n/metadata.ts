import type { Metadata } from "next";
import { localePath, type Lang } from "./index";

/**
 * `alternates` for a page that exists in both languages: its own address as the
 * canonical one, and the other language's as an `hreflang` alternative, so search
 * engines show each reader the right one. `/` (Dutch) is the default.
 */
export function languageAlternates(lang: Lang, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localePath(lang, path),
    languages: {
      nl: localePath("nl", path),
      en: localePath("en", path),
      "x-default": localePath("nl", path),
    },
  };
}
