"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/lib/i18n";
import { useLang } from "@/components/site/LangProvider";

/**
 * `next/link` that keeps the reader in their language: `/blog` stays `/blog` in
 * Dutch and becomes `/en/blog` in English. Use it for every link to a page of
 * this site; links to other sites and files go through `localePath` untouched.
 */
export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const lang = useLang();
  return <Link href={typeof href === "string" ? localePath(lang, href) : href} {...props} />;
}
