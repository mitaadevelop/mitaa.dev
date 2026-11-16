export type ShopArtwork = {
  slug: string;
  title: string;
  theme: "Dark" | "Light";
  description: string;
  preview: {
    landscape: string;
    mobile: string;
  };
  alt: {
    landscape: string;
    mobile: string;
  };
};

export type ShopProductFormat = {
  label: string;
  dimensions: string;
  use: string;
};

export type ShopFaq = {
  question: string;
  answer: string;
};

export type ShopProduct = {
  slug: string;
  title: string;
  type: string;
  status: "Free" | "Coming soon";
  price: string;
  /** The file behind the download button, counted under `id` (see src/lib/downloads.ts). */
  download: {
    id: string;
    file: string;
    size: string;
  };
  description: string;
  overview: string;
  tags: string[];
  fileCount: number;
  artworks: ShopArtwork[];
  formats: ShopProductFormat[];
  included: Array<{
    title: string;
    description: string;
  }>;
  license: string;
  faqs: ShopFaq[];
};

const previewBase = "/shop/signal-no-01";

export const shopProduct: ShopProduct = {
  slug: "signal-no-01",
  title: "Signal No. 01",
  type: "Wallpaper pack",
  status: "Free",
  price: "Free",
  download: {
    id: "signal-no-01",
    file: "/downloads/signal-no-01.zip",
    size: "28 MB",
  },
  description:
    "Six calm, minimal-tech wallpapers for desktop and mobile, built from quiet grids, circuit traces, and restrained signal accents.",
  overview:
    "Signal No. 01 is a focused collection for screens that should feel technical without becoming noisy. Three dark and three light designs pair graphite and warm ivory surfaces with small electric-blue and copper details.",
  tags: ["6 designs", "Desktop + mobile", "5K JPG"],
  fileCount: 24,
  artworks: [
    {
      slug: "circuit-drift",
      title: "Circuit Drift",
      theme: "Dark",
      description:
        "Fine signal paths move across a deep graphite field, anchored by a single copper node.",
      preview: {
        landscape: `${previewBase}/circuit-drift-landscape.jpg`,
        mobile: `${previewBase}/circuit-drift-mobile.jpg`,
      },
      alt: {
        landscape:
          "Circuit Drift desktop wallpaper preview with blue circuit traces and a copper node on black.",
        mobile:
          "Circuit Drift mobile wallpaper preview with vertical blue and copper traces on black.",
      },
    },
    {
      slug: "quiet-array",
      title: "Quiet Array",
      theme: "Dark",
      description:
        "A measured point field is interrupted by one soft blue signal wave and sparse copper terminals.",
      preview: {
        landscape: `${previewBase}/quiet-array-landscape.jpg`,
        mobile: `${previewBase}/quiet-array-mobile.jpg`,
      },
      alt: {
        landscape:
          "Quiet Array desktop wallpaper preview with a blue wave crossing a dark point grid.",
        mobile:
          "Quiet Array mobile wallpaper preview with a vertical blue signal through a dark grid.",
      },
    },
    {
      slug: "copper-pulse",
      title: "Copper Pulse",
      theme: "Dark",
      description:
        "Layered topology carries a warm copper pulse through a near-black technical landscape.",
      preview: {
        landscape: `${previewBase}/copper-pulse-landscape.jpg`,
        mobile: `${previewBase}/copper-pulse-mobile.jpg`,
      },
      alt: {
        landscape:
          "Copper Pulse desktop wallpaper preview with glowing copper paths across layered black geometry.",
        mobile:
          "Copper Pulse mobile wallpaper preview with vertical copper circuitry on a dark layered field.",
      },
    },
    {
      slug: "open-circuit",
      title: "Open Circuit",
      theme: "Light",
      description:
        "An electric-blue trace pauses just before a copper terminal on a warm ivory surface.",
      preview: {
        landscape: `${previewBase}/open-circuit-landscape.jpg`,
        mobile: `${previewBase}/open-circuit-mobile.jpg`,
      },
      alt: {
        landscape:
          "Open Circuit desktop wallpaper preview with a blue trace and copper terminal on ivory.",
        mobile:
          "Open Circuit mobile wallpaper preview with fine vertical circuitry on warm ivory.",
      },
    },
    {
      slug: "phase-field",
      title: "Phase Field",
      theme: "Light",
      description:
        "Translucent planes, precise point fields, and a blue phase line create a cool sense of depth.",
      preview: {
        landscape: `${previewBase}/phase-field-landscape.jpg`,
        mobile: `${previewBase}/phase-field-mobile.jpg`,
      },
      alt: {
        landscape:
          "Phase Field desktop wallpaper preview with translucent gray planes and a blue line on white.",
        mobile:
          "Phase Field mobile wallpaper preview with layered geometric planes and a blue wave on white.",
      },
    },
    {
      slug: "signal-bloom",
      title: "Signal Bloom",
      theme: "Light",
      description:
        "A restrained network grows outward from a copper core with fine graphite and blue arcs.",
      preview: {
        landscape: `${previewBase}/signal-bloom-landscape.jpg`,
        mobile: `${previewBase}/signal-bloom-mobile.jpg`,
      },
      alt: {
        landscape:
          "Signal Bloom desktop wallpaper preview with radial technical lines around a copper core.",
        mobile:
          "Signal Bloom mobile wallpaper preview with delicate blue and copper signal lines on ivory.",
      },
    },
  ],
  formats: [
    { label: "16:9", dimensions: "5120 × 2880", use: "Desktop" },
    { label: "16:10", dimensions: "5120 × 3200", use: "Desktop" },
    { label: "21:9", dimensions: "5120 × 2160", use: "Ultrawide" },
    { label: "Mobile", dimensions: "1440 × 3200", use: "Phone" },
  ],
  included: [
    {
      title: "Six original designs",
      description:
        "Three dark and three light compositions, each with its own desktop and mobile layout.",
    },
    {
      title: "24 high-resolution JPGs",
      description:
        "Four ready-to-use screen formats per design, exported in the sRGB colour space.",
    },
    {
      title: "Free for personal use",
      description:
        "Use the wallpapers on every device you personally own, at no cost and without an account.",
    },
  ],
  license:
    "The download is free and the personal-use license covers devices you personally own and use. Redistribution, resale, commercial publication, and inclusion in another product are not permitted; link to this page instead.",
  faqs: [
    {
      question: "What will I receive?",
      answer:
        "You will receive one ZIP containing 24 unwatermarked high-resolution JPG wallpapers, a short installation guide, and the personal-use license.",
    },
    {
      question: "Which resolutions are included?",
      answer:
        "Every design includes 5120 × 2880, 5120 × 3200, 5120 × 2160, and 1440 × 3200 versions for common desktop, ultrawide, and mobile screens.",
    },
    {
      question: "Will they work on my devices?",
      answer:
        "The JPG files work on macOS, Windows, Linux, iPhone, and Android. Choose the closest aspect ratio and use your system’s Fill setting if your display differs slightly.",
    },
    {
      question: "Is it really free?",
      answer:
        "Yes. Signal No. 01 is a free download: no payment, no account, and no email address needed.",
    },
    {
      question: "Can I use the wallpapers commercially?",
      answer:
        "No. The included license is for personal use on your own devices. Advertising, client work, merchandise, redistribution, and resale are not included.",
    },
    {
      question: "Can I share the files with someone else?",
      answer:
        "Please share the link to this page rather than the files. Anyone can download their own copy here for free.",
    },
    {
      question: "How does the download work?",
      answer:
        "The download button starts the ZIP straight away. The page counts each download once per visitor per day, without storing who downloaded it.",
    },
  ],
};
