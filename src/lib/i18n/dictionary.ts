/**
 * Every fixed word of the site, in each language. Content (posts, project texts)
 * is not here: it comes from files or GitHub.
 *
 * Like `src/lib/blog/i18n.ts`, which holds the words around a blog post, `nl` is
 * typed as `typeof en`, so a key that exists in one language and not in the other
 * is a type error. No fs/path: client components import this module.
 */
import type { Lang } from "./index";

const en = {
  locale: "en-US",

  site: {
    description:
      "mitaa.dev — junior electrical engineer & developer working on embedded systems, PCB design, and web development.",
    headline: "Embedded systems, firmware & web",
    blogFeedTitle: "blog",
  },

  nav: {
    projects: "Projects",
    blog: "Blog",
    shop: "Shop",
  },

  common: {
    close: "Close",
    previous: "Previous",
    next: "Next",
    loading: "Loading…",
    free: "Free",
    freeDownload: "Free download",
  },

  language: {
    /** The button's text: the language it switches to. */
    code: "NL",
    /** What the button does, for screen readers and as a tooltip. */
    label: "View the site in Dutch",
    names: { nl: "Dutch", en: "English" },
    /** Shown on a page whose text is in the other language. */
    contentIn: (language: string) => `This text is written in ${language}.`,
  },

  theme: {
    toLight: "Switch to light mode",
    toDark: "Switch to dark mode",
  },

  home: {
    updated: (date: string) => `Updated ${date}`,
    blog: "Blog",
  },

  activity: {
    title: "GitHub Activity",
    unavailable: "Contribution data isn't available right now.",
    viewOnGitHub: "View activity on GitHub",
    loading: "Loading contributions…",
    summary: "contributions in the last year",
    legendLess: "Less",
    legendMore: "More",
  },

  blogIndex: {
    title: "Blog",
    description: "Technical articles, devlogs, and tutorials.",
    empty: "No posts yet.",
  },

  projects: {
    title: "Projects",
    description: "Embedded, hardware and software projects.",
    all: "All",
    other: "Other",
    search: "Search projects...",
    clearFilters: "Clear filters",
    noResults: "No projects match your search.",
  },
};

export type Dictionary = typeof en;

const nl: Dictionary = {
  locale: "nl-NL",

  site: {
    description:
      "mitaa.dev — junior elektrotechnisch ingenieur en ontwikkelaar, actief in embedded systemen, PCB-ontwerp en webontwikkeling.",
    headline: "Embedded systemen, firmware & web",
    blogFeedTitle: "blog",
  },

  nav: {
    projects: "Projecten",
    blog: "Blog",
    shop: "Winkel",
  },

  common: {
    close: "Sluiten",
    previous: "Vorige",
    next: "Volgende",
    loading: "Laden…",
    free: "Gratis",
    freeDownload: "Gratis download",
  },

  language: {
    code: "EN",
    label: "Bekijk de website in het Engels",
    names: { nl: "Nederlands", en: "Engels" },
    contentIn: (language: string) => `Deze tekst is geschreven in het ${language}.`,
  },

  theme: {
    toLight: "Schakel over naar de lichte modus",
    toDark: "Schakel over naar de donkere modus",
  },

  home: {
    updated: (date: string) => `Bijgewerkt op ${date}`,
    blog: "Blog",
  },

  activity: {
    title: "GitHub-activiteit",
    unavailable: "De activiteitsgegevens zijn op dit moment niet beschikbaar.",
    viewOnGitHub: "Bekijk de activiteit op GitHub",
    loading: "Activiteit laden…",
    summary: "bijdragen in het afgelopen jaar",
    legendLess: "Minder",
    legendMore: "Meer",
  },

  blogIndex: {
    title: "Blog",
    description: "Technische artikelen, devlogs en handleidingen.",
    empty: "Nog geen berichten.",
  },

  projects: {
    title: "Projecten",
    description: "Embedded-, hardware- en softwareprojecten.",
    all: "Alles",
    other: "Overig",
    search: "Zoek projecten...",
    clearFilters: "Filters wissen",
    noResults: "Geen projecten gevonden voor je zoekopdracht.",
  },
};

const DICTIONARIES: Record<Lang, Dictionary> = { nl, en };

/** The words of one language. */
export function dictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}
