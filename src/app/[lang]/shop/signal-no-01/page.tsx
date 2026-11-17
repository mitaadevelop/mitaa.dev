import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/components/site/LocaleLink";
import {
  ArrowLeft,
  Check,
  Download,
  ImageIcon,
  MonitorSmartphone,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import DownloadCount, { downloadHref } from "@/components/shop/DownloadCount";
import ShopProductGallery from "@/components/shop/ShopProductGallery";
import ScrollReveal from "@/components/site/ScrollReveal";
import { shopProduct } from "@/data/shop";
import { isLang, pick } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/metadata";
import { getDownloadCounts } from "@/lib/downloads";

// The download count is read from Redis at most once a minute.
// Must be a literal — keep in sync with COUNTS_REVALIDATE in @/lib/downloads.
export const revalidate = 60;

type Props = Readonly<{ params: Promise<{ lang: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const words = dictionary(lang).shop;
  return {
    title: words.productMeta(shopProduct.title),
    description: pick(lang, shopProduct.description),
    alternates: languageAlternates(lang, `/shop/${shopProduct.slug}`),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: words.productOgTitle(shopProduct.title),
      description: pick(lang, shopProduct.description),
      images: [
        {
          url: shopProduct.artworks[0].preview.landscape,
          width: 1600,
          height: 1000,
          alt: pick(lang, shopProduct.artworks[0].alt.landscape),
        },
      ],
    },
  };
}

export default async function SignalNo01Page({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const words = dictionary(lang);
  const shop = words.shop;
  const featuredArtwork = shopProduct.artworks[0];
  const counts = await getDownloadCounts();
  const downloads = counts?.[shopProduct.download.id] ?? null;

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-12 lg:px-20">
      <Blur delay={0}>
        <Link
          href="/shop"
          className="mb-10 inline-flex items-center gap-2 rounded-sm text-[13px] text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft size={14} aria-hidden="true" /> {shop.backToShop}
        </Link>
      </Blur>

      <section className="grid overflow-hidden rounded-lg border border-divider bg-card lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Fade delay={50}>
          <div className="relative min-h-[340px] overflow-hidden bg-[#0b0d10] sm:min-h-[520px] lg:min-h-[680px]">
            <ScrollReveal variant="parallax">
              <Image
                src={featuredArtwork.preview.landscape}
                alt={pick(lang, featuredArtwork.alt.landscape)}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 63vw"
                className="object-cover"
              />
            </ScrollReveal>

            <div className="absolute bottom-5 right-5 w-[23%] min-w-[92px] max-w-[170px] sm:bottom-9 sm:right-9">
              <div className="relative aspect-[9/20] overflow-hidden rounded-[1.2rem] border-[4px] border-white/20 bg-black shadow-2xl sm:rounded-[1.8rem] sm:border-[5px]">
                <Image
                  src={featuredArtwork.preview.mobile}
                  alt={pick(lang, featuredArtwork.alt.mobile)}
                  fill
                  sizes="170px"
                  className="object-cover"
                />
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-2 h-2.5 w-14 -translate-x-1/2 rounded-full bg-black/75"
                />
              </div>
            </div>

            <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.8px] text-white/80 backdrop-blur-sm sm:left-9 sm:top-9">
              {shop.desktopMobile}
            </span>
          </div>
        </Fade>

        <Blur delay={100}>
          <div className="flex h-full flex-col p-6 sm:p-9 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-badge-bg px-2.5 py-1 text-[11px] font-medium text-badge-text">
                {shop.status[shopProduct.status]}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted">
                {pick(lang, shopProduct.type)}
              </span>
            </div>

            <h1 className="mt-6 text-[36px] font-semibold leading-[1.05] tracking-[-1.2px] text-foreground sm:text-[46px]">
              {shopProduct.title}
            </h1>
            <p className="mt-5 text-[15px] leading-7 text-muted">
              {pick(lang, shopProduct.description)}
            </p>

            <ul
              aria-label={shop.productDetails}
              className="mt-6 flex flex-wrap gap-2"
            >
              {pick(lang, shopProduct.tags).map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-divider px-2.5 py-1 text-[11px] text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <aside
              aria-label={shop.downloadAside}
              className="mt-10 border-t border-divider pt-7 lg:mt-auto"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-date">
                {words.common.freeDownload}
              </p>
              <div className="mt-1 flex items-end justify-between gap-4">
                <p className="text-[36px] font-semibold tracking-[-1px] text-foreground">
                  {words.common.free}
                </p>
                <DownloadCount count={downloads} lang={lang} className="mb-3" />
              </div>
              <p className="mt-1 text-[12px] text-muted">
                {shop.filesLine(shopProduct.fileCount, shopProduct.download.size)}
              </p>
              <a
                href={downloadHref(shopProduct.download.id)}
                rel="nofollow"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Download size={15} aria-hidden="true" /> {shop.downloadPack}
              </a>
              <p className="mt-4 text-[12px] leading-5 text-date">
                {shop.noAccount}
              </p>
            </aside>
          </div>
        </Blur>
      </section>

      <Fade delay={80} inView>
        <section
          className="border-b border-divider py-16"
          aria-labelledby="wallpaper-collection"
        >
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-date">
                {shop.collectionKicker}
              </p>
              <h2
                id="wallpaper-collection"
                className="mt-2 text-[24px] font-semibold tracking-[-0.5px] text-foreground"
              >
                {shop.collectionTitle}
              </h2>
            </div>
            <p className="max-w-lg text-[13px] leading-6 text-muted">
              {shop.collectionIntro}
            </p>
          </div>
          <ShopProductGallery artworks={shopProduct.artworks} />
        </section>
      </Fade>

      <div className="grid border-b border-divider lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)] lg:divide-x lg:divide-divider">
        <div className="lg:pr-12">
          <Fade delay={80} inView>
            <section className="py-12" aria-labelledby="about-signal">
              <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-date">
                {shop.aboutKicker}
              </p>
              <h2
                id="about-signal"
                className="mt-2 text-[22px] font-semibold tracking-[-0.4px] text-foreground"
              >
                {shop.aboutTitle}
              </h2>
              <p className="mt-5 max-w-2xl text-[14px] leading-7 text-muted">
                {pick(lang, shopProduct.overview)}
              </p>

              <div className="mt-9 grid gap-4 sm:grid-cols-3">
                {shopProduct.included.map((item, index) => {
                  const icons = [ImageIcon, Download, ShieldCheck];
                  const Icon = icons[index];
                  return (
                    <article
                      key={pick(lang, item.title)}
                      className="rounded-lg border border-divider bg-card p-5"
                    >
                      <Icon size={17} className="text-muted" aria-hidden="true" />
                      <h3 className="mt-4 text-[14px] font-medium text-foreground">
                        {pick(lang, item.title)}
                      </h3>
                      <p className="mt-2 text-[12px] leading-5 text-muted">
                        {pick(lang, item.description)}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          </Fade>
        </div>

        <div className="border-t border-divider lg:border-t-0 lg:pl-12">
          <Fade delay={100} inView>
            <section className="py-12" aria-labelledby="included-formats">
              <div className="flex items-center gap-2">
                <MonitorSmartphone
                  size={16}
                  className="text-muted"
                  aria-hidden="true"
                />
                <h2
                  id="included-formats"
                  className="text-[13px] font-medium uppercase tracking-[0.8px] text-muted"
                >
                  {shop.includedFormats}
                </h2>
              </div>
              <div className="mt-6 border-b border-divider">
                {shopProduct.formats.map((format) => (
                  <div
                    key={pick(lang, format.label)}
                    className="grid grid-cols-[72px_1fr_auto] items-center gap-3 border-t border-divider py-4 text-[12px]"
                  >
                    <span className="font-medium text-foreground">
                      {pick(lang, format.label)}
                    </span>
                    <span className="text-muted">{format.dimensions}</span>
                    <span className="text-date">{pick(lang, format.use)}</span>
                  </div>
                ))}
              </div>
            </section>
          </Fade>
        </div>
      </div>

      <div className="grid border-b border-divider md:grid-cols-2 md:divide-x md:divide-divider">
        <Fade delay={80} inView>
          <section className="py-12 md:pr-12" aria-labelledby="how-it-works">
            <h2
              id="how-it-works"
              className="text-[13px] font-medium uppercase tracking-[0.8px] text-muted"
            >
              {shop.howItWorks}
            </h2>
            <ol className="mt-7 space-y-5">
              {shop.packSteps.map(
                (step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-4 text-[14px] text-foreground"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-divider text-[10px] font-medium text-date">
                      0{index + 1}
                    </span>
                    {step}
                  </li>
                ),
              )}
            </ol>
          </section>
        </Fade>

        <Fade delay={100} inView>
          <section
            className="border-t border-divider py-12 md:border-t-0 md:pl-12"
            aria-labelledby="personal-license"
          >
            <h2
              id="personal-license"
              className="text-[13px] font-medium uppercase tracking-[0.8px] text-muted"
            >
              {shop.licenseTitle}
            </h2>
            <p className="mt-6 text-[14px] leading-7 text-muted">
              {pick(lang, shopProduct.license)}
            </p>
            <p className="mt-5 flex items-start gap-3 text-[12px] leading-5 text-foreground">
              <Check
                size={14}
                className="mt-0.5 shrink-0 text-success"
                aria-hidden="true"
              />
              {shop.licenseNote}
            </p>
          </section>
        </Fade>
      </div>

      <Fade delay={80} inView>
        <section className="py-14" aria-labelledby="frequently-asked-questions">
          <div className="grid gap-8 lg:grid-cols-[minmax(220px,0.35fr)_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-date">
                {shop.faqKicker}
              </p>
              <h2
                id="frequently-asked-questions"
                className="mt-2 text-[22px] font-semibold tracking-[-0.4px] text-foreground"
              >
                {shop.faqTitle}
              </h2>
            </div>

            <div className="border-b border-divider">
              {shopProduct.faqs.map((faq) => (
                <details key={pick(lang, faq.question)} className="group border-t border-divider">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-4 text-[14px] font-medium text-foreground transition-colors hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                    {pick(lang, faq.question)}
                    <Plus
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-date transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                    />
                  </summary>
                  <p className="max-w-2xl pb-6 pr-10 text-[13px] leading-6 text-muted">
                    {pick(lang, faq.answer)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </Fade>
    </div>
  );
}
