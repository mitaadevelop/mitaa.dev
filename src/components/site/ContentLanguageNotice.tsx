import { dictionary } from "@/lib/i18n/dictionary";
import { localePath, type Lang } from "@/lib/i18n";
import Link from "next/link";

/**
 * A line about the language of the text on a page.
 *
 * - The text is in the other language than the page: "This text is written in
 *   Dutch." (nothing is shown when the two are the same).
 * - The text is a machine translation (`translatedFrom`): "Automatically
 *   translated from Dutch. View the original", linking to `originalPath`, the
 *   page that holds the text as written.
 */
export default function ContentLanguageNotice({
  lang,
  contentLang,
  translatedFrom,
  originalPath,
}: Readonly<{ lang: Lang; contentLang: Lang; translatedFrom?: Lang; originalPath?: string }>) {
  const words = dictionary(lang);
  if (translatedFrom) {
    return (
      <p className="mb-8 text-[12px] text-date" lang={lang}>
        {words.language.translatedFrom(words.language.names[translatedFrom])}
        {originalPath ? (
          <>
            {" "}
            <Link
              href={localePath(translatedFrom, originalPath)}
              lang={translatedFrom}
              hrefLang={translatedFrom}
              className="underline underline-offset-2 hover:text-foreground"
            >
              {words.language.viewOriginal}
            </Link>
          </>
        ) : null}
      </p>
    );
  }
  if (lang === contentLang) return null;
  return (
    <p className="mb-8 text-[12px] text-date" lang={lang}>
      {words.language.contentIn(words.language.names[contentLang])}
    </p>
  );
}
