/**
 * Every word the blog prints around a post, in each language a post can be
 * written in.
 *
 * A post picks its language the way a LaTeX document does — `\usepackage[dutch]
 * {babel}` — or with the shorter `\lang{nl}`. Without either it is English.
 * The pipeline uses these words for what LaTeX itself would print (figure and
 * theorem labels, the bibliography heading), and the post chrome uses them for
 * everything around the text.
 *
 * No fs/path here: client components import this module.
 */

export type Lang = "en" | "nl";

export const DEFAULT_LANG: Lang = "en";

/** babel option names, and the bare codes `\lang{}` accepts. */
const LANG_NAMES: Record<string, Lang> = {
  en: "en",
  english: "en",
  british: "en",
  american: "en",
  UKenglish: "en",
  USenglish: "en",
  nl: "nl",
  dutch: "nl",
  nederlands: "nl",
};

/** Resolve a babel option or language code, or undefined if it is not one. */
export function parseLang(value: string): Lang | undefined {
  return LANG_NAMES[value.trim()];
}

const en = {
  locale: "en-US",
  figure: "Figure",
  table: "Table",
  listing: "Listing",
  equation: "Equation",
  section: "Section",
  appendix: "Appendix",
  theorem: "Theorem",
  lemma: "Lemma",
  proposition: "Proposition",
  corollary: "Corollary",
  definition: "Definition",
  example: "Example",
  proof: "Proof",
  note: "Note",
  tip: "Tip",
  warning: "Warning",
  important: "Important",
  caution: "Caution",
  abstract: "Abstract",
  keywords: "Keywords",
  references: "References",
  appendices: "Appendices",
  footnotes: "Footnotes",
  backToContent: "Back to content",
  contents: "Contents",
  onThisPage: "On this page",
  previous: "Previous",
  next: "Next",
  author: "Author",
  affiliation: "Affiliation",
  version: "Version",
  revised: "revised",
  downloadPdf: "Download as PDF",
  citeThis: "Cite this post",
  backToBlog: "Back to Blog",
  copy: "Copy",
  copied: "Copied",
  copyCode: "Copy code",
  showAsTable: "Show as table",
  diagram: "Diagram",
  showDiagramSource: "Show diagram source",
  diagramFailed: "This diagram could not be drawn",
  discussOnX: "Discuss this post on X",
  discussHint: "Have thoughts on this article? Join the conversation on X.",
  total: "total",
  chapters: "Chapters",
  keyboardTip: "Tip: use ← and → to move between pages.",
  otherPosts: "More posts",
  page: (n: number) => `Page ${n}`,
  pageOf: (n: number, total: number) => `Page ${n} of ${total}`,
  pages: (n: number) => (n === 1 ? "1 page" : `${n} pages`),
  minutes: (n: number) => `${n} min`,
  readTime: (n: number) => `${n} min read`,
};

export type Strings = typeof en;

const nl: Strings = {
  locale: "nl-NL",
  figure: "Figuur",
  table: "Tabel",
  listing: "Listing",
  equation: "Vergelijking",
  section: "Sectie",
  appendix: "Bijlage",
  theorem: "Stelling",
  lemma: "Lemma",
  proposition: "Propositie",
  corollary: "Gevolg",
  definition: "Definitie",
  example: "Voorbeeld",
  proof: "Bewijs",
  note: "Opmerking",
  tip: "Tip",
  warning: "Waarschuwing",
  important: "Belangrijk",
  caution: "Let op",
  abstract: "Samenvatting",
  keywords: "Trefwoorden",
  references: "Bibliografie",
  appendices: "Bijlagen",
  footnotes: "Voetnoten",
  backToContent: "Terug naar de tekst",
  contents: "Inhoud",
  onThisPage: "Op deze pagina",
  previous: "Vorige",
  next: "Volgende",
  author: "Auteur",
  affiliation: "Affiliatie",
  version: "Versie",
  revised: "herzien",
  downloadPdf: "Download als PDF",
  citeThis: "Citeer dit verslag",
  backToBlog: "Terug naar blog",
  copy: "Kopieer",
  copied: "Gekopieerd",
  copyCode: "Kopieer code",
  showAsTable: "Toon als tabel",
  diagram: "Diagram",
  showDiagramSource: "Toon de bron van het diagram",
  diagramFailed: "Dit diagram kon niet worden getekend",
  discussOnX: "Bespreek dit artikel op X",
  discussHint: "Gedachten over dit artikel? Praat mee op X.",
  total: "totaal",
  chapters: "Pagina's",
  keyboardTip: "Tip: gebruik ← en → om tussen pagina's te bladeren.",
  otherPosts: "Meer artikelen",
  page: (n: number) => `Pagina ${n}`,
  pageOf: (n: number, total: number) => `Pagina ${n} van ${total}`,
  pages: (n: number) => (n === 1 ? "1 pagina" : `${n} pagina's`),
  minutes: (n: number) => `${n} min`,
  readTime: (n: number) => `${n} min leestijd`,
};

const STRINGS: Record<Lang, Strings> = { en, nl };

export function strings(lang: Lang | undefined): Strings {
  return STRINGS[lang ?? DEFAULT_LANG];
}

/** "1.2 MB" / "1,2 MB" — a file size in the post's own number format. */
export function formatBytes(bytes: number, lang: Lang | undefined): string {
  const { locale } = strings(lang);
  const units = ["B", "kB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits })} ${units[unit]}`;
}
