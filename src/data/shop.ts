import type { Localized } from "@/lib/i18n";

/**
 * The shop catalogue. Every sentence is a `{ nl, en }` pair written by hand;
 * names, sizes and file names are the same in both languages.
 */
export type ShopArtwork = {
  slug: string;
  title: string;
  theme: "Dark" | "Light";
  description: Localized;
  preview: {
    landscape: string;
    mobile: string;
  };
  alt: {
    landscape: Localized;
    mobile: Localized;
  };
};

export type ShopProductFormat = {
  label: Localized;
  dimensions: string;
  use: Localized;
};

export type ShopFaq = {
  question: Localized;
  answer: Localized;
};

export type ShopProduct = {
  slug: string;
  title: string;
  type: Localized;
  status: "Free" | "Coming soon";
  price: string;
  /** The file behind the download button, counted under `id` (see src/lib/downloads.ts). */
  download: {
    id: string;
    file: string;
    size: string;
  };
  description: Localized;
  overview: Localized;
  tags: Localized<string[]>;
  fileCount: number;
  artworks: ShopArtwork[];
  formats: ShopProductFormat[];
  included: Array<{
    title: Localized;
    description: Localized;
  }>;
  license: Localized;
  faqs: ShopFaq[];
};

const previewBase = "/shop/signal-no-01";

export const shopProduct: ShopProduct = {
  slug: "signal-no-01",
  title: "Signal No. 01",
  type: { nl: "Wallpaperpakket", en: "Wallpaper pack" },
  status: "Free",
  price: "Free",
  download: {
    id: "signal-no-01",
    file: "/downloads/signal-no-01.zip",
    size: "28 MB",
  },
  description: {
    nl: "Zes rustige, minimalistische tech-wallpapers voor desktop en mobiel, gebouwd uit stille rasters, printsporen en ingehouden signaalaccenten.",
    en: "Six calm, minimal-tech wallpapers for desktop and mobile, built from quiet grids, circuit traces, and restrained signal accents.",
  },
  overview: {
    nl: "Signal No. 01 is een gerichte collectie voor schermen die technisch moeten aanvoelen zonder rommelig te worden. Drie donkere en drie lichte ontwerpen combineren grafietkleurige en warm ivoorkleurige vlakken met kleine details in elektrisch blauw en koper.",
    en: "Signal No. 01 is a focused collection for screens that should feel technical without becoming noisy. Three dark and three light designs pair graphite and warm ivory surfaces with small electric-blue and copper details.",
  },
  tags: {
    nl: ["6 ontwerpen", "Desktop + mobiel", "5K JPG"],
    en: ["6 designs", "Desktop + mobile", "5K JPG"],
  },
  fileCount: 24,
  artworks: [
    {
      slug: "circuit-drift",
      title: "Circuit Drift",
      theme: "Dark",
      description: {
        nl: "Fijne signaalpaden trekken over een diep grafietveld, verankerd door één koperen knooppunt.",
        en: "Fine signal paths move across a deep graphite field, anchored by a single copper node.",
      },
      preview: {
        landscape: `${previewBase}/circuit-drift-landscape.jpg`,
        mobile: `${previewBase}/circuit-drift-mobile.jpg`,
      },
      alt: {
        landscape: {
          nl: "Voorbeeld van de Circuit Drift-desktopwallpaper met blauwe printsporen en een koperen knooppunt op zwart.",
          en: "Circuit Drift desktop wallpaper preview with blue circuit traces and a copper node on black.",
        },
        mobile: {
          nl: "Voorbeeld van de Circuit Drift-mobiele wallpaper met verticale blauwe en koperen sporen op zwart.",
          en: "Circuit Drift mobile wallpaper preview with vertical blue and copper traces on black.",
        },
      },
    },
    {
      slug: "quiet-array",
      title: "Quiet Array",
      theme: "Dark",
      description: {
        nl: "Een afgemeten puntenveld wordt doorbroken door één zachte blauwe signaalgolf en schaarse koperen aansluitpunten.",
        en: "A measured point field is interrupted by one soft blue signal wave and sparse copper terminals.",
      },
      preview: {
        landscape: `${previewBase}/quiet-array-landscape.jpg`,
        mobile: `${previewBase}/quiet-array-mobile.jpg`,
      },
      alt: {
        landscape: {
          nl: "Voorbeeld van de Quiet Array-desktopwallpaper met een blauwe golf over een donker puntenraster.",
          en: "Quiet Array desktop wallpaper preview with a blue wave crossing a dark point grid.",
        },
        mobile: {
          nl: "Voorbeeld van de Quiet Array-mobiele wallpaper met een verticaal blauw signaal door een donker raster.",
          en: "Quiet Array mobile wallpaper preview with a vertical blue signal through a dark grid.",
        },
      },
    },
    {
      slug: "copper-pulse",
      title: "Copper Pulse",
      theme: "Dark",
      description: {
        nl: "Gelaagde topologie voert een warme koperen puls door een bijna zwart, technisch landschap.",
        en: "Layered topology carries a warm copper pulse through a near-black technical landscape.",
      },
      preview: {
        landscape: `${previewBase}/copper-pulse-landscape.jpg`,
        mobile: `${previewBase}/copper-pulse-mobile.jpg`,
      },
      alt: {
        landscape: {
          nl: "Voorbeeld van de Copper Pulse-desktopwallpaper met gloeiende koperen paden over gelaagde zwarte geometrie.",
          en: "Copper Pulse desktop wallpaper preview with glowing copper paths across layered black geometry.",
        },
        mobile: {
          nl: "Voorbeeld van de Copper Pulse-mobiele wallpaper met verticale koperen schakelingen op een donker gelaagd vlak.",
          en: "Copper Pulse mobile wallpaper preview with vertical copper circuitry on a dark layered field.",
        },
      },
    },
    {
      slug: "open-circuit",
      title: "Open Circuit",
      theme: "Light",
      description: {
        nl: "Een elektrisch blauw spoor stopt net voor een koperen aansluitpunt op een warm ivoorkleurig vlak.",
        en: "An electric-blue trace pauses just before a copper terminal on a warm ivory surface.",
      },
      preview: {
        landscape: `${previewBase}/open-circuit-landscape.jpg`,
        mobile: `${previewBase}/open-circuit-mobile.jpg`,
      },
      alt: {
        landscape: {
          nl: "Voorbeeld van de Open Circuit-desktopwallpaper met een blauw spoor en een koperen aansluitpunt op ivoor.",
          en: "Open Circuit desktop wallpaper preview with a blue trace and copper terminal on ivory.",
        },
        mobile: {
          nl: "Voorbeeld van de Open Circuit-mobiele wallpaper met fijne verticale schakelingen op warm ivoor.",
          en: "Open Circuit mobile wallpaper preview with fine vertical circuitry on warm ivory.",
        },
      },
    },
    {
      slug: "phase-field",
      title: "Phase Field",
      theme: "Light",
      description: {
        nl: "Doorschijnende vlakken, nauwkeurige puntenvelden en een blauwe faselijn geven een koel gevoel van diepte.",
        en: "Translucent planes, precise point fields, and a blue phase line create a cool sense of depth.",
      },
      preview: {
        landscape: `${previewBase}/phase-field-landscape.jpg`,
        mobile: `${previewBase}/phase-field-mobile.jpg`,
      },
      alt: {
        landscape: {
          nl: "Voorbeeld van de Phase Field-desktopwallpaper met doorschijnende grijze vlakken en een blauwe lijn op wit.",
          en: "Phase Field desktop wallpaper preview with translucent gray planes and a blue line on white.",
        },
        mobile: {
          nl: "Voorbeeld van de Phase Field-mobiele wallpaper met gelaagde geometrische vlakken en een blauwe golf op wit.",
          en: "Phase Field mobile wallpaper preview with layered geometric planes and a blue wave on white.",
        },
      },
    },
    {
      slug: "signal-bloom",
      title: "Signal Bloom",
      theme: "Light",
      description: {
        nl: "Een ingehouden netwerk groeit naar buiten vanuit een koperen kern, met fijne grafietkleurige en blauwe bogen.",
        en: "A restrained network grows outward from a copper core with fine graphite and blue arcs.",
      },
      preview: {
        landscape: `${previewBase}/signal-bloom-landscape.jpg`,
        mobile: `${previewBase}/signal-bloom-mobile.jpg`,
      },
      alt: {
        landscape: {
          nl: "Voorbeeld van de Signal Bloom-desktopwallpaper met radiale technische lijnen rond een koperen kern.",
          en: "Signal Bloom desktop wallpaper preview with radial technical lines around a copper core.",
        },
        mobile: {
          nl: "Voorbeeld van de Signal Bloom-mobiele wallpaper met delicate blauwe en koperen signaallijnen op ivoor.",
          en: "Signal Bloom mobile wallpaper preview with delicate blue and copper signal lines on ivory.",
        },
      },
    },
  ],
  formats: [
    { label: { nl: "16:9", en: "16:9" }, dimensions: "5120 × 2880", use: { nl: "Desktop", en: "Desktop" } },
    { label: { nl: "16:10", en: "16:10" }, dimensions: "5120 × 3200", use: { nl: "Desktop", en: "Desktop" } },
    { label: { nl: "21:9", en: "21:9" }, dimensions: "5120 × 2160", use: { nl: "Ultrabreed", en: "Ultrawide" } },
    { label: { nl: "Mobiel", en: "Mobile" }, dimensions: "1440 × 3200", use: { nl: "Telefoon", en: "Phone" } },
  ],
  included: [
    {
      title: { nl: "Zes originele ontwerpen", en: "Six original designs" },
      description: {
        nl: "Drie donkere en drie lichte composities, elk met een eigen desktop- en mobiele indeling.",
        en: "Three dark and three light compositions, each with its own desktop and mobile layout.",
      },
    },
    {
      title: { nl: "24 jpg's in hoge resolutie", en: "24 high-resolution JPGs" },
      description: {
        nl: "Vier direct bruikbare schermformaten per ontwerp, geëxporteerd in de sRGB-kleurruimte.",
        en: "Four ready-to-use screen formats per design, exported in the sRGB colour space.",
      },
    },
    {
      title: { nl: "Gratis voor persoonlijk gebruik", en: "Free for personal use" },
      description: {
        nl: "Gebruik de wallpapers op elk apparaat dat je zelf bezit, zonder kosten en zonder account.",
        en: "Use the wallpapers on every device you personally own, at no cost and without an account.",
      },
    },
  ],
  license: {
    nl: "De download is gratis en de licentie voor persoonlijk gebruik geldt voor apparaten die je zelf bezit en gebruikt. Verspreiden, doorverkopen, commercieel publiceren en opnemen in een ander product zijn niet toegestaan; verwijs in plaats daarvan naar deze pagina.",
    en: "The download is free and the personal-use license covers devices you personally own and use. Redistribution, resale, commercial publication, and inclusion in another product are not permitted; link to this page instead.",
  },
  faqs: [
    {
      question: { nl: "Wat ontvang ik?", en: "What will I receive?" },
      answer: {
        nl: "Je ontvangt één zipbestand met 24 jpg-wallpapers in hoge resolutie zonder watermerk, een korte installatiehandleiding en de licentie voor persoonlijk gebruik.",
        en: "You will receive one ZIP containing 24 unwatermarked high-resolution JPG wallpapers, a short installation guide, and the personal-use license.",
      },
    },
    {
      question: { nl: "Welke resoluties zitten erbij?", en: "Which resolutions are included?" },
      answer: {
        nl: "Elk ontwerp bevat versies van 5120 × 2880, 5120 × 3200, 5120 × 2160 en 1440 × 3200 voor gangbare desktop-, ultrabrede en mobiele schermen.",
        en: "Every design includes 5120 × 2880, 5120 × 3200, 5120 × 2160, and 1440 × 3200 versions for common desktop, ultrawide, and mobile screens.",
      },
    },
    {
      question: { nl: "Werken ze op mijn apparaten?", en: "Will they work on my devices?" },
      answer: {
        nl: "De jpg-bestanden werken op macOS, Windows, Linux, iPhone en Android. Kies de dichtstbijzijnde beeldverhouding en gebruik de instelling 'Vullen' van je systeem als je scherm iets afwijkt.",
        en: "The JPG files work on macOS, Windows, Linux, iPhone, and Android. Choose the closest aspect ratio and use your system’s Fill setting if your display differs slightly.",
      },
    },
    {
      question: { nl: "Is het echt gratis?", en: "Is it really free?" },
      answer: {
        nl: "Ja. Signal No. 01 is een gratis download: zonder betaling, zonder account en zonder e-mailadres.",
        en: "Yes. Signal No. 01 is a free download: no payment, no account, and no email address needed.",
      },
    },
    {
      question: { nl: "Mag ik de wallpapers commercieel gebruiken?", en: "Can I use the wallpapers commercially?" },
      answer: {
        nl: "Nee. De bijgeleverde licentie is voor persoonlijk gebruik op je eigen apparaten. Reclame, werk voor klanten, merchandise, verspreiding en doorverkoop vallen er niet onder.",
        en: "No. The included license is for personal use on your own devices. Advertising, client work, merchandise, redistribution, and resale are not included.",
      },
    },
    {
      question: { nl: "Mag ik de bestanden met iemand delen?", en: "Can I share the files with someone else?" },
      answer: {
        nl: "Deel liever de link naar deze pagina dan de bestanden. Iedereen kan hier gratis een eigen exemplaar downloaden.",
        en: "Please share the link to this page rather than the files. Anyone can download their own copy here for free.",
      },
    },
    {
      question: { nl: "Hoe werkt de download?", en: "How does the download work?" },
      answer: {
        nl: "De downloadknop start het zipbestand meteen. De pagina telt elke download één keer per bezoeker per dag, zonder bij te houden wie hem downloadde.",
        en: "The download button starts the ZIP straight away. The page counts each download once per visitor per day, without storing who downloaded it.",
      },
    },
  ],
};
