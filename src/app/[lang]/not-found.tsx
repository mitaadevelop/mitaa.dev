"use client";

import Link from "@/components/site/LocaleLink";
import { useDictionary } from "@/components/site/LangProvider";

/** The 404 of a language: rendered inside `[lang]/layout.tsx`, so the language is in context. */
export default function NotFound() {
  const { notFound: words } = useDictionary();
  return (
    <div className="mx-auto max-w-[720px] px-6 py-32 text-center sm:px-12">
      <h1 className="text-[13px] font-medium uppercase tracking-[0.8px] text-muted">404</h1>
      <p className="mt-4 text-[20px] font-semibold tracking-[-0.5px] text-foreground">{words.title}</p>
      <p className="mt-3 text-[14px] leading-7 text-muted">{words.body}</p>
      <Link href="/" className="mt-8 inline-block text-[13px] text-foreground underline-offset-4 hover:underline">
        {words.home}
      </Link>
    </div>
  );
}
