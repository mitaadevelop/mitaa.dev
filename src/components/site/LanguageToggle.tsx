"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDictionary, useLang } from "@/components/site/LangProvider";
import { otherLang, switchPath } from "@/lib/i18n";

/**
 * Floating language button, left of the light/dark toggle: it shows the language
 * it switches to ("EN" on a Dutch page) and links to the same page in that
 * language. A plain link, so it works without JavaScript and crawlers follow it.
 */
export default function LanguageToggle() {
  const lang = useLang();
  const words = useDictionary().language;
  const target = otherLang(lang);
  const href = switchPath(lang, usePathname());

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={lang}
      aria-label={words.label}
      title={words.label}
      className="fixed bottom-5 right-[4.5rem] z-50 inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-border bg-card/90 px-3 text-[12px] font-medium tracking-[0.5px] text-muted shadow-sm backdrop-blur-sm transition-colors hover:border-foreground/20 hover:text-foreground"
    >
      {words.code}
    </Link>
  );
}
