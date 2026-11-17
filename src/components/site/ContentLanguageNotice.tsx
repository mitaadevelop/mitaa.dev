import { dictionary } from "@/lib/i18n/dictionary";
import type { Lang } from "@/lib/i18n";

/**
 * A line for a page whose text is in the other language than the page around it:
 * "This text is written in Dutch." Shown only when the two differ.
 */
export default function ContentLanguageNotice({
  lang,
  contentLang,
}: Readonly<{ lang: Lang; contentLang: Lang }>) {
  if (lang === contentLang) return null;
  const words = dictionary(lang);
  return (
    <p className="mb-8 text-[12px] text-date" lang={lang}>
      {words.language.contentIn(words.language.names[contentLang])}
    </p>
  );
}
