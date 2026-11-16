"use client";

import { createContext, useContext } from "react";
import { SITE_LANG, type Lang } from "@/lib/i18n";
import { dictionary, type Dictionary } from "@/lib/i18n/dictionary";

const LangContext = createContext<Lang>(SITE_LANG);

/**
 * The language of the page, from `app/[lang]/layout.tsx`, for the client
 * components that cannot receive `params`. Server components read it from `params`.
 */
export function LangProvider({ lang, children }: Readonly<{ lang: Lang; children: React.ReactNode }>) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/** The fixed words in the page's language, for client components. */
export function useDictionary(): Dictionary {
  return dictionary(useContext(LangContext));
}
