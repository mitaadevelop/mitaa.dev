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
    /** Shown on a machine-translated page. */
    translatedFrom: (language: string) => `Automatically translated from ${language}.`,
    viewOriginal: "View the original",
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
    viewArrow: "View on GitHub →",
    /** Row labels of the heatmap, Sunday first; only the Monday, Wednesday and Friday rows are named. */
    days: ["", "Mon", "", "Wed", "", "Fri", ""],
    dayTitle: (count: number, date: string) =>
      `${count} contribution${count === 1 ? "" : "s"} on ${date}`,
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
    noResults: "No projects found",
  },

  project: {
    notFound: "Project Not Found",
    back: "Back to Projects",
    others: "Other projects",
    previous: "Previous project",
    next: "Next project",
    created: (date: string) => `Created ${date}`,
    updated: (date: string) => `Updated ${date}`,
    license: (name: string) => `${name} License`,
    source: "Source",
    demo: "Demo",
    context: "Context",
    role: "Role",
    goal: "Goal",
    overview: "Overview",
    demoVideo: "Demo",
    hardware: "Hardware",
    measurements: "Measurements",
    gallery: "Gallery",
    techStack: "Tech Stack",
    dependencies: "Dependencies",
    commits: "Recent Commits",
    contributors: "Contributors",
    contributorTitle: (login: string, n: number) => `${login} · ${n} commits`,
    features: "Key Features",
    videoTitle: "Project demo video",
    imageAlt: (n: number) => `Project image ${n}`,
    chart: "Chart",
    table: "Table",
    chartLoading: "Loading chart…",
    chartError: "Couldn’t load the measurement data.",
    series: (n: number) => `series ${n}`,
    pdfUnsupported: "This PDF cannot be shown in the browser.",
    pdfOpen: "Open in a new tab",
    download: "Download",
    documentation: "Documentation",
  },

  shop: {
    title: "Shop",
    description:
      "Free downloads by mitaa.dev: minimal-tech wallpapers for desktop and mobile, LaTeX templates for essays, reports and research, and a LaTeX cheat sheet.",
    intro:
      "Free downloads: original wallpapers that make technical screens feel calm and considered, clean LaTeX templates for your essays, reports and research, and a LaTeX cheat sheet to keep next to them.",
    collection: "Collection 01",
    productDetails: "Product details",
    viewProduct: "View product",
    latexBadge: "LaTeX templates",
    latexTitle: "LaTeX templates & cheat sheet",
    latexIntro:
      "Clean, ready-to-write templates for an essay, a report and a research report, with APA references. Open one in Overleaf with a single click, and keep the two-page cheat sheet close.",
    templateDetails: "Template details",
    latexTags: ["3 templates", "Cheat sheet", "Overleaf-ready"],
    viewTemplates: "View templates",
    templateTitlePage: (title: string) => `Title page of the ${title} template`,
    downloads: (n: number) => `${n} ${n === 1 ? "download" : "downloads"}`,
    theme: { Dark: "Dark", Light: "Light" } as Record<string, string>,
    status: { Free: "Free", "Coming soon": "Coming soon" } as Record<string, string>,
    viewLarger: (title: string) => `View larger previews of ${title}`,
    closePreview: "Close wallpaper preview",
    previousWallpaper: "View previous wallpaper",
    nextWallpaper: "View next wallpaper",

    backToShop: "Back to Shop",
    productMeta: (title: string) => `${title} — Shop`,
    productOgTitle: (title: string) => `${title} — Wallpaper pack`,
    desktopMobile: "Desktop + mobile",
    downloadAside: "Download",
    filesLine: (n: number, size: string) => `${n} high-resolution JPGs · ${size} ZIP · Personal use`,
    downloadPack: "Download the pack",
    noAccount: "No account or email needed. The download starts straight away.",
    collectionKicker: "The collection",
    collectionTitle: "Six signals, two moods",
    collectionIntro:
      "Select any design to compare its dedicated desktop and mobile composition. Public images are protected previews.",
    aboutKicker: "About the pack",
    aboutTitle: "Technical, without the visual noise",
    includedFormats: "Included formats",
    howItWorks: "How it works",
    packSteps: ["Download one ZIP", "Choose your screen format", "Set it as your wallpaper"],
    licenseTitle: "Personal-use license",
    licenseNote: "Use every wallpaper across devices you personally own.",
    faqKicker: "Need to know",
    faqTitle: "Frequently asked questions",

    latexMetaTitle: "LaTeX templates & cheat sheet — Shop",
    latexMetaDescription:
      "Free LaTeX templates for an essay, a report and a research report, plus a two-page LaTeX cheat sheet. APA references, ready for Overleaf.",
    latexOgTitle: "Free LaTeX templates & cheat sheet",
    latexOgAlt: "The first page of the LaTeX cheat sheet",
    latexKicker: "LaTeX",
    latexLead:
      "Clean templates that let you write instead of fighting the layout: a title page, contents, numbered figures and tables, cross-references and APA 7 references, all set up. And a two-page cheat sheet with the commands you actually use.",
    englishNote: "The templates and the cheat sheet themselves are written in English.",
    cheatMeta: "2 pages · A4 landscape · PDF",
    cheatAlt: (page: number) => `LaTeX cheat sheet, page ${page}`,
    downloadCheat: "Download the cheat sheet",
    templateKicker: "Template",
    templateAlt: (title: string, page: number) => `${title} template, page ${page}`,
    openOverleaf: "Open in Overleaf",
    openOverleafLabel: (title: string) => `Open the ${title} template in Overleaf`,
    zip: "ZIP",
    zipLabel: (title: string) => `Download the ${title} template as a ZIP`,
    example: "Example PDF",
    exampleLabel: (title: string) => `View the example PDF of the ${title} template`,
    howTo: "How to use the templates",
    howToSteps: [
      {
        title: "Open in Overleaf",
        body: "One click opens the template as a new Overleaf project, ready to write in and compile. A free Overleaf account is enough.",
      },
      {
        title: "Or compile locally",
        body: "Download the ZIP and run latexmk -pdf main.tex with TeX Live, MacTeX or MiKTeX. latexmk runs Biber for the references by itself.",
      },
      {
        title: "Fill in your details",
        body: "Set the title, names and course at the top of main.tex. The styling lives apart in setup.tex, so the text stays readable.",
      },
    ],
    license: "License",
    cheatLicenseLead: "The cheat sheet:",
    inside: "What's inside",
  },

  notFound: {
    title: "This page could not be found",
    body: "The address may be misspelled, or the page has moved.",
    home: "Back to the home page",
  },

  pcb: {
    schematic: "Schematic",
    pcb: "PCB",
    threeD: "3D",
    bom: "BOM",
    top: "Top",
    bottom: "Bottom",
    xray: "X-ray",
    layers: "Layers",
    layer: { all: "All", front: "Front", back: "Back", copper: "Copper" } as Record<string, string>,
    sheet: "Sheet",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    exit: "Exit",
    renderedView: "Rendered view",
    view3d: "Interactive 3D view of the PCB",
    preview3d: "3D preview of the PCB",
    filterParts: "Filter parts…",
    lines: (n: number) => `${n} line${n === 1 ? "" : "s"}`,
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
    translatedFrom: (language: string) => `Automatisch vertaald uit het ${language}.`,
    viewOriginal: "Bekijk het origineel",
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
    viewArrow: "Bekijk op GitHub →",
    days: ["", "ma", "", "wo", "", "vr", ""],
    dayTitle: (count: number, date: string) =>
      `${count} ${count === 1 ? "bijdrage" : "bijdragen"} op ${date}`,
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
    noResults: "Geen projecten gevonden",
  },

  project: {
    notFound: "Project niet gevonden",
    back: "Terug naar projecten",
    others: "Andere projecten",
    previous: "Vorig project",
    next: "Volgend project",
    created: (date: string) => `Aangemaakt ${date}`,
    updated: (date: string) => `Bijgewerkt ${date}`,
    license: (name: string) => `${name}-licentie`,
    source: "Broncode",
    demo: "Demo",
    context: "Context",
    role: "Rol",
    goal: "Doel",
    overview: "Overzicht",
    demoVideo: "Demo",
    hardware: "Hardware",
    measurements: "Metingen",
    gallery: "Galerij",
    techStack: "Techstack",
    dependencies: "Afhankelijkheden",
    commits: "Recente commits",
    contributors: "Bijdragers",
    contributorTitle: (login: string, n: number) => `${login} · ${n} commits`,
    features: "Belangrijkste functies",
    videoTitle: "Demovideo van het project",
    imageAlt: (n: number) => `Projectafbeelding ${n}`,
    chart: "Grafiek",
    table: "Tabel",
    chartLoading: "Grafiek laden…",
    chartError: "De meetgegevens konden niet worden geladen.",
    series: (n: number) => `reeks ${n}`,
    pdfUnsupported: "Dit PDF-bestand kan niet in de browser worden weergegeven.",
    pdfOpen: "Open in een nieuw tabblad",
    download: "Download",
    documentation: "Documentatie",
  },

  shop: {
    title: "Winkel",
    description:
      "Gratis downloads van mitaa.dev: minimalistische tech-wallpapers voor desktop en mobiel, LaTeX-sjablonen voor essays, verslagen en onderzoek, en een LaTeX-spiekbrief.",
    intro:
      "Gratis downloads: originele wallpapers die technische schermen rustig en weloverwogen laten voelen, nette LaTeX-sjablonen voor je essays, verslagen en onderzoek, en een LaTeX-spiekbrief om ernaast te leggen.",
    collection: "Collectie 01",
    productDetails: "Productdetails",
    viewProduct: "Bekijk product",
    latexBadge: "LaTeX-sjablonen",
    latexTitle: "LaTeX-sjablonen & spiekbrief",
    latexIntro:
      "Nette sjablonen die direct klaar zijn om in te schrijven, voor een essay, een verslag en een onderzoeksverslag, met APA-bronnen. Open er een met één klik in Overleaf en houd de spiekbrief van twee pagina's bij de hand.",
    templateDetails: "Sjabloondetails",
    latexTags: ["3 sjablonen", "Spiekbrief", "Klaar voor Overleaf"],
    viewTemplates: "Bekijk sjablonen",
    templateTitlePage: (title: string) => `Titelpagina van het sjabloon ${title}`,
    downloads: (n: number) => `${n} ${n === 1 ? "download" : "downloads"}`,
    theme: { Dark: "Donker", Light: "Licht" } as Record<string, string>,
    status: { Free: "Gratis", "Coming soon": "Binnenkort" } as Record<string, string>,
    viewLarger: (title: string) => `Bekijk grotere voorbeelden van ${title}`,
    closePreview: "Voorbeeld van de wallpaper sluiten",
    previousWallpaper: "Vorige wallpaper bekijken",
    nextWallpaper: "Volgende wallpaper bekijken",

    backToShop: "Terug naar de winkel",
    productMeta: (title: string) => `${title} — Winkel`,
    productOgTitle: (title: string) => `${title} — Wallpaperpakket`,
    desktopMobile: "Desktop + mobiel",
    downloadAside: "Download",
    filesLine: (n: number, size: string) => `${n} jpg's in hoge resolutie · ${size} zip · Persoonlijk gebruik`,
    downloadPack: "Download het pakket",
    noAccount: "Geen account of e-mailadres nodig. De download start meteen.",
    collectionKicker: "De collectie",
    collectionTitle: "Zes signalen, twee sferen",
    collectionIntro:
      "Kies een ontwerp om de aparte desktop- en mobiele compositie te vergelijken. De openbare afbeeldingen zijn beschermde voorbeelden.",
    aboutKicker: "Over het pakket",
    aboutTitle: "Technisch, zonder visuele ruis",
    includedFormats: "Meegeleverde formaten",
    howItWorks: "Zo werkt het",
    packSteps: ["Download één zipbestand", "Kies het formaat van je scherm", "Stel hem in als je wallpaper"],
    licenseTitle: "Licentie voor persoonlijk gebruik",
    licenseNote: "Gebruik elke wallpaper op alle apparaten die je zelf bezit.",
    faqKicker: "Goed om te weten",
    faqTitle: "Veelgestelde vragen",

    latexMetaTitle: "LaTeX-sjablonen & spiekbrief — Winkel",
    latexMetaDescription:
      "Gratis LaTeX-sjablonen voor een essay, een verslag en een onderzoeksverslag, plus een LaTeX-spiekbrief van twee pagina's. APA-bronnen, klaar voor Overleaf.",
    latexOgTitle: "Gratis LaTeX-sjablonen & spiekbrief",
    latexOgAlt: "De eerste pagina van de LaTeX-spiekbrief",
    latexKicker: "LaTeX",
    latexLead:
      "Nette sjablonen waarmee je kunt schrijven in plaats van te worstelen met de opmaak: een titelpagina, inhoudsopgave, genummerde figuren en tabellen, kruisverwijzingen en APA 7-bronnen, alles al ingesteld. En een spiekbrief van twee pagina's met de commando's die je echt gebruikt.",
    englishNote: "De sjablonen en de spiekbrief zelf zijn in het Engels geschreven.",
    cheatMeta: "2 pagina's · A4 liggend · PDF",
    cheatAlt: (page: number) => `LaTeX-spiekbrief, pagina ${page}`,
    downloadCheat: "Download de spiekbrief",
    templateKicker: "Sjabloon",
    templateAlt: (title: string, page: number) => `Sjabloon ${title}, pagina ${page}`,
    openOverleaf: "Openen in Overleaf",
    openOverleafLabel: (title: string) => `Open het sjabloon ${title} in Overleaf`,
    zip: "ZIP",
    zipLabel: (title: string) => `Download het sjabloon ${title} als zipbestand`,
    example: "Voorbeeld-pdf",
    exampleLabel: (title: string) => `Bekijk de voorbeeld-pdf van het sjabloon ${title}`,
    howTo: "Zo gebruik je de sjablonen",
    howToSteps: [
      {
        title: "Openen in Overleaf",
        body: "Met één klik opent het sjabloon als een nieuw Overleaf-project, klaar om in te schrijven en te compileren. Een gratis Overleaf-account is genoeg.",
      },
      {
        title: "Of compileer lokaal",
        body: "Download de zip en draai latexmk -pdf main.tex met TeX Live, MacTeX of MiKTeX. latexmk start Biber voor de bronnen zelf.",
      },
      {
        title: "Vul je gegevens in",
        body: "Stel de titel, namen en het vak in bovenaan main.tex. De opmaak staat apart in setup.tex, zodat de tekst leesbaar blijft.",
      },
    ],
    license: "Licentie",
    cheatLicenseLead: "De spiekbrief:",
    inside: "Wat zit erin",
  },

  notFound: {
    title: "Deze pagina bestaat niet",
    body: "Het adres is misschien verkeerd getypt, of de pagina is verplaatst.",
    home: "Terug naar de homepage",
  },

  pcb: {
    schematic: "Schema",
    pcb: "PCB",
    threeD: "3D",
    bom: "Stuklijst",
    top: "Boven",
    bottom: "Onder",
    xray: "Röntgen",
    layers: "Lagen",
    layer: { all: "Alles", front: "Voor", back: "Achter", copper: "Koper" } as Record<string, string>,
    sheet: "Blad",
    fullscreen: "Volledig scherm",
    exitFullscreen: "Volledig scherm sluiten",
    exit: "Sluiten",
    renderedView: "Gerenderde weergave",
    view3d: "Interactieve 3D-weergave van de print",
    preview3d: "3D-voorvertoning van de print",
    filterParts: "Filter onderdelen…",
    lines: (n: number) => `${n} ${n === 1 ? "regel" : "regels"}`,
  },
};

const DICTIONARIES: Record<Lang, Dictionary> = { nl, en };

/** The words of one language. */
export function dictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}
