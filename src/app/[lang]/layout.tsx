import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import Footer from "@/components/site/Footer";
import { LangProvider } from "@/components/site/LangProvider";
import ThemeProvider from "@/components/site/ThemeProvider";
import LanguageToggle from "@/components/site/LanguageToggle";
import ThemeToggle from "@/components/site/ThemeToggle";
import { isLang, localePath, LOCALES } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/metadata";
import {
  SITE_URL,
  SITE_NAME,
  SITE_AUTHOR,
  TWITTER_HANDLE,
} from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

type Props = Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>;

/** Both languages are built ahead of time: Dutch served at `/`, English at `/en`. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/** Any other first segment is not a language, so it is a 404 instead of a page. */
export const dynamicParams = false;

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const words = dictionary(lang);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: words.site.description,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_AUTHOR }],
    creator: SITE_AUTHOR,
    keywords: [
      "embedded systems",
      "firmware",
      "STM32",
      "ESP32",
      "PCB design",
      "electrical engineering",
      "Next.js",
      "React",
      "web development",
      "mitaa.dev",
    ],
    alternates: {
      ...languageAlternates(lang, "/"),
      types: {
        "application/rss+xml": [
          { url: localePath(lang, "/feed.xml"), title: `${SITE_NAME} ${words.site.blogFeedTitle}` },
        ],
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: SITE_URL,
      title: SITE_NAME,
      description: words.site.description,
      locale: words.locale.replace("-", "_"),
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: SITE_NAME,
      description: words.site.description,
    },
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground font-sans`}
      >
        <LangProvider lang={lang}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <main className="min-h-screen">{children}</main>
            <Footer />
            <LanguageToggle />
            <ThemeToggle />
          </ThemeProvider>
        </LangProvider>
      </body>
    </html>
  );
}
