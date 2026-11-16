/**
 * The free LaTeX downloads in the shop: three templates and a cheat sheet.
 * Sources live in content/shop/latex-templates/<slug>/ and
 * content/shop/latex-cheatsheet/; `npm run downloads:build` compiles them and
 * writes the ZIPs, PDFs and preview images to public/downloads/latex/. No
 * fs/path here: client components may import this module.
 */

export type LatexTemplate = {
  slug: "essay" | "report" | "research";
  title: string;
  description: string;
  /** The structure the template lays out, in order. */
  sections: string[];
  /** Pages of the example PDF shown as previews: the first page and one inside. */
  previewPages: [number, number];
};

export const latexTemplates: LatexTemplate[] = [
  {
    slug: "essay",
    title: "Essay",
    description:
      "A compact argumentative essay with a title block, numbered sections and APA references. Two pages that show you where the thesis, the arguments and the rebuttal go.",
    sections: [
      "Title block with course, lecturer and word count",
      "Introduction ending in a thesis",
      "Arguments, counterargument and rebuttal",
      "Conclusion and APA 7 references",
    ],
    previewPages: [1, 2],
  },
  {
    slug: "report",
    title: "Report",
    description:
      "A lab or project report with a title page, summary and table of contents. It shows you how to write numbered equations, figures, tables with units, cross-references and appendices.",
    sections: [
      "Title page for one or more authors",
      "Summary and table of contents",
      "Theory, method, results and discussion",
      "Conclusion, references and appendices",
    ],
    previewPages: [1, 3],
  },
  {
    slug: "research",
    title: "Research report",
    description:
      "A full research or thesis report in chapters, from preface to recommendations. It is laid out around a main question and its sub-questions, with room for a conceptual model, method and appendices.",
    sections: [
      "Title page with supervisor and client",
      "Preface, abstract with keywords, contents",
      "Research questions, framework and method",
      "Results per sub-question, conclusion and discussion",
    ],
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

/** Free to use for your own work: shown on the page and in every ZIP's README. */
export const TEMPLATE_LICENSE =
  "Free to use and adapt for your own essays, reports and research, including graded and published work. No attribution needed. Please do not resell the templates or offer them for download elsewhere.";

/** The two-page LaTeX cheat sheet, a PDF rather than a ZIP. */
export const latexCheatsheet = {
  id: "latex-cheatsheet",
  title: "LaTeX cheat sheet",
  description:
    "Two landscape A4 pages with the commands you actually use: structure, text, lists, figures, tables, maths, units, cross-references, APA citations, and what the common errors mean.",
  sections: [
    "Document skeleton, classes and structure",
    "Text, special characters, lists, figures and tables",
    "Maths notation, Greek letters, units",
    "References, page layout, errors and compiling",
  ],
  files: {
    pdf: "/downloads/latex/cheatsheet.pdf",
    previews: ["/downloads/latex/cheatsheet-p1.png", "/downloads/latex/cheatsheet-p2.png"],
  },
  license: "Free to print and share, for example with classmates. Please do not sell it.",
} as const;
