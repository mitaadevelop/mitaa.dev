import type { Localized } from "@/lib/i18n";

/**
 * The free LaTeX downloads in the shop: three templates and a cheat sheet.
 * Sources live in content/shop/latex-templates/<slug>/ and
 * content/shop/latex-cheatsheet/; `npm run downloads:build` compiles them and
 * writes the ZIPs, PDFs and preview images to public/downloads/latex/. No
 * fs/path here: client components may import this module.
 *
 * The texts on the pages are `{ nl, en }` pairs. The templates themselves and
 * the README inside each ZIP stay English (a decision of the team: the downloads
 * are English only), so `scripts/build-downloads.mts` reads the `en` side.
 */

export type LatexTemplate = {
  slug: "essay" | "report" | "research";
  title: Localized;
  description: Localized;
  /** The structure the template lays out, in order. */
  sections: Localized<string[]>;
  /** Pages of the example PDF shown as previews: the first page and one inside. */
  previewPages: [number, number];
};

export const latexTemplates: LatexTemplate[] = [
  {
    slug: "essay",
    title: { nl: "Essay", en: "Essay" },
    description: {
      nl: "Een compact beschouwend essay met titelblok, genummerde secties en APA-bronnen. Twee pagina's die laten zien waar de stelling, de argumenten en de weerlegging komen.",
      en: "A compact argumentative essay with a title block, numbered sections and APA references. Two pages that show you where the thesis, the arguments and the rebuttal go.",
    },
    sections: {
      nl: [
        "Titelblok met vak, docent en aantal woorden",
        "Inleiding die eindigt in een stelling",
        "Argumenten, tegenargument en weerlegging",
        "Conclusie en APA 7-bronnen",
      ],
      en: [
        "Title block with course, lecturer and word count",
        "Introduction ending in a thesis",
        "Arguments, counterargument and rebuttal",
        "Conclusion and APA 7 references",
      ],
    },
    previewPages: [1, 2],
  },
  {
    slug: "report",
    title: { nl: "Verslag", en: "Report" },
    description: {
      nl: "Een lab- of projectverslag met titelpagina, samenvatting en inhoudsopgave. Het laat zien hoe je genummerde vergelijkingen, figuren, tabellen met eenheden, kruisverwijzingen en bijlagen schrijft.",
      en: "A lab or project report with a title page, summary and table of contents. It shows you how to write numbered equations, figures, tables with units, cross-references and appendices.",
    },
    sections: {
      nl: [
        "Titelpagina voor een of meer auteurs",
        "Samenvatting en inhoudsopgave",
        "Theorie, methode, resultaten en discussie",
        "Conclusie, bronnen en bijlagen",
      ],
      en: [
        "Title page for one or more authors",
        "Summary and table of contents",
        "Theory, method, results and discussion",
        "Conclusion, references and appendices",
      ],
    },
    previewPages: [1, 3],
  },
  {
    slug: "research",
    title: { nl: "Onderzoeksverslag", en: "Research report" },
    description: {
      nl: "Een volledig onderzoeks- of afstudeerverslag in hoofdstukken, van voorwoord tot aanbevelingen. Het is opgebouwd rond een hoofdvraag en deelvragen, met ruimte voor een conceptueel model, methode en bijlagen.",
      en: "A full research or thesis report in chapters, from preface to recommendations. It is laid out around a main question and its sub-questions, with room for a conceptual model, method and appendices.",
    },
    sections: {
      nl: [
        "Titelpagina met begeleider en opdrachtgever",
        "Voorwoord, samenvatting met trefwoorden, inhoudsopgave",
        "Onderzoeksvragen, kader en methode",
        "Resultaten per deelvraag, conclusie en discussie",
      ],
      en: [
        "Title page with supervisor and client",
        "Preface, abstract with keywords, contents",
        "Research questions, framework and method",
        "Results per sub-question, conclusion and discussion",
      ],
    },
    previewPages: [1, 5],
  },
];

/** The id a template is downloaded and counted under. */
export function templateDownloadId(slug: LatexTemplate["slug"]): string {
  return `latex-${slug}`;
}

/** Where the build writes a template's files, as public URLs. */
export function templateFiles(template: LatexTemplate) {
  const base = `/downloads/latex/${template.slug}`;
  return {
    zip: `${base}.zip`,
    pdf: `${base}.pdf`,
    previews: template.previewPages.map((page) => `${base}-p${page}.png`),
  };
}

/** Free to use for your own work: shown on the page and in every ZIP's README (English). */
export const TEMPLATE_LICENSE: Localized = {
  nl: "Vrij te gebruiken en aan te passen voor je eigen essays, verslagen en onderzoek, ook voor beoordeeld en gepubliceerd werk. Je hoeft de bron niet te vermelden. Verkoop de sjablonen alsjeblieft niet door en bied ze niet elders aan om te downloaden.",
  en: "Free to use and adapt for your own essays, reports and research, including graded and published work. No attribution needed. Please do not resell the templates or offer them for download elsewhere.",
};

/** The two-page LaTeX cheat sheet, a PDF rather than a ZIP. */
export const latexCheatsheet = {
  id: "latex-cheatsheet",
  title: { nl: "LaTeX-spiekbrief", en: "LaTeX cheat sheet" } as Localized,
  description: {
    nl: "Twee liggende A4-pagina's met de commando's die je echt gebruikt: structuur, tekst, lijsten, figuren, tabellen, wiskunde, eenheden, kruisverwijzingen, APA-bronnen en wat de veelvoorkomende foutmeldingen betekenen.",
    en: "Two landscape A4 pages with the commands you actually use: structure, text, lists, figures, tables, maths, units, cross-references, APA citations, and what the common errors mean.",
  } as Localized,
  sections: {
    nl: [
      "Documentskelet, klassen en structuur",
      "Tekst, speciale tekens, lijsten, figuren en tabellen",
      "Wiskundige notatie, Griekse letters, eenheden",
      "Verwijzingen, paginaindeling, fouten en compileren",
    ],
    en: [
      "Document skeleton, classes and structure",
      "Text, special characters, lists, figures and tables",
      "Maths notation, Greek letters, units",
      "References, page layout, errors and compiling",
    ],
  } as Localized<string[]>,
  files: {
    pdf: "/downloads/latex/cheatsheet.pdf",
    previews: ["/downloads/latex/cheatsheet-p1.png", "/downloads/latex/cheatsheet-p2.png"],
  },
  license: {
    nl: "Gratis om af te drukken en te delen, bijvoorbeeld met klasgenoten. Verkoop hem alsjeblieft niet.",
    en: "Free to print and share, for example with classmates. Please do not sell it.",
  } as Localized,
} as const;
