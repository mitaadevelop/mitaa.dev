import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
import ShopProductGallery from "@/components/shop/ShopProductGallery";
import { shopProduct } from "@/data/shop";

export const metadata: Metadata = {
  title: `${shopProduct.title} — Shop`,
  description: shopProduct.description,
  alternates: {
    canonical: `/shop/${shopProduct.slug}`,
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `${shopProduct.title} — Wallpaper pack`,
    description: shopProduct.description,
    images: [
      {
        url: shopProduct.artworks[0].preview.landscape,
        width: 1600,
        height: 1000,
        alt: shopProduct.artworks[0].alt.landscape,
      },
    ],
  },
};

export default function SignalNo01Page() {
  const featuredArtwork = shopProduct.artworks[0];

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-12 lg:px-20">
      <Blur delay={0}>
        <Link
          href="/shop"
          className="mb-10 inline-flex items-center gap-2 rounded-sm text-[13px] text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back to Shop
        </Link>
      </Blur>

      <section className="grid overflow-hidden rounded-lg border border-divider bg-card lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Fade delay={50}>
          <div className="relative min-h-[340px] overflow-hidden bg-[#0b0d10] sm:min-h-[520px] lg:min-h-[680px]">
            <Image
              src={featuredArtwork.preview.landscape}
              alt={featuredArtwork.alt.landscape}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 63vw"
              className="object-cover"
            />

            <div className="absolute bottom-5 right-5 w-[23%] min-w-[92px] max-w-[170px] sm:bottom-9 sm:right-9">
              <div className="relative aspect-[9/20] overflow-hidden rounded-[1.2rem] border-[4px] border-white/20 bg-black shadow-2xl sm:rounded-[1.8rem] sm:border-[5px]">
                <Image
                  src={featuredArtwork.preview.mobile}
                  alt={featuredArtwork.alt.mobile}
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
              Desktop + mobile
            </span>
          </div>
        </Fade>

        <Blur delay={100}>
          <div className="flex h-full flex-col p-6 sm:p-9 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-badge-bg px-2.5 py-1 text-[11px] font-medium text-badge-text">
                {shopProduct.status}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted">
                {shopProduct.type}
              </span>
            </div>

            <h1 className="mt-6 text-[36px] font-semibold leading-[1.05] tracking-[-1.2px] text-foreground sm:text-[46px]">
              {shopProduct.title}
            </h1>
            <p className="mt-5 text-[15px] leading-7 text-muted">
              {shopProduct.description}
            </p>

            <ul
              aria-label="Product details"
              className="mt-6 flex flex-wrap gap-2"
            >
              {shopProduct.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-divider px-2.5 py-1 text-[11px] text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <aside
              aria-label="Purchase information"
              className="mt-10 border-t border-divider pt-7 lg:mt-auto"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-date">
                One-time payment
              </p>
              <p className="mt-1 text-[36px] font-semibold tracking-[-1px] text-foreground">
                {shopProduct.price}
              </p>
              <p className="mt-1 text-[12px] text-muted">
                {shopProduct.fileCount} high-resolution JPGs · Personal use
              </p>
              <button
                type="button"
                disabled
                aria-describedby="checkout-status"
                className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-md bg-secondary px-4 py-3 text-[13px] font-medium text-muted opacity-70"
              >
                Coming soon
              </button>
              <p
                id="checkout-status"
                className="mt-4 text-[12px] leading-5 text-date"
              >
                Checkout is not active yet. No payment or download will be
                started.
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
                The collection
              </p>
              <h2
                id="wallpaper-collection"
                className="mt-2 text-[24px] font-semibold tracking-[-0.5px] text-foreground"
              >
                Six signals, two moods
              </h2>
            </div>
            <p className="max-w-lg text-[13px] leading-6 text-muted">
              Select any design to compare its dedicated desktop and mobile
              composition. Public images are protected previews.
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
                About the pack
              </p>
              <h2
                id="about-signal"
                className="mt-2 text-[22px] font-semibold tracking-[-0.4px] text-foreground"
              >
                Technical, without the visual noise
              </h2>
              <p className="mt-5 max-w-2xl text-[14px] leading-7 text-muted">
                {shopProduct.overview}
              </p>

              <div className="mt-9 grid gap-4 sm:grid-cols-3">
                {shopProduct.included.map((item, index) => {
                  const icons = [ImageIcon, Download, ShieldCheck];
                  const Icon = icons[index];
                  return (
                    <article
                      key={item.title}
                      className="rounded-lg border border-divider bg-card p-5"
                    >
                      <Icon size={17} className="text-muted" aria-hidden="true" />
                      <h3 className="mt-4 text-[14px] font-medium text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[12px] leading-5 text-muted">
                        {item.description}
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
                  Included formats
                </h2>
              </div>
              <div className="mt-6 border-b border-divider">
                {shopProduct.formats.map((format) => (
                  <div
                    key={format.label}
                    className="grid grid-cols-[72px_1fr_auto] items-center gap-3 border-t border-divider py-4 text-[12px]"
                  >
                    <span className="font-medium text-foreground">
                      {format.label}
                    </span>
                    <span className="text-muted">{format.dimensions}</span>
                    <span className="text-date">{format.use}</span>
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
              How it will work
            </h2>
            <ol className="mt-7 space-y-5">
              {["Purchase securely", "Download one ZIP", "Choose your screen format"].map(
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
              Personal-use license
            </h2>
            <p className="mt-6 text-[14px] leading-7 text-muted">
              {shopProduct.license}
            </p>
            <p className="mt-5 flex items-start gap-3 text-[12px] leading-5 text-foreground">
              <Check
                size={14}
                className="mt-0.5 shrink-0 text-success"
                aria-hidden="true"
              />
              Use every wallpaper across devices you personally own.
            </p>
          </section>
        </Fade>
      </div>

      <Fade delay={80} inView>
        <section className="py-14" aria-labelledby="frequently-asked-questions">
          <div className="grid gap-8 lg:grid-cols-[minmax(220px,0.35fr)_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-date">
                Need to know
              </p>
              <h2
                id="frequently-asked-questions"
                className="mt-2 text-[22px] font-semibold tracking-[-0.4px] text-foreground"
              >
                Frequently asked questions
              </h2>
            </div>

            <div className="border-b border-divider">
              {shopProduct.faqs.map((faq) => (
                <details key={faq.question} className="group border-t border-divider">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-4 text-[14px] font-medium text-foreground transition-colors hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <Plus
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-date transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                    />
                  </summary>
                  <p className="max-w-2xl pb-6 pr-10 text-[13px] leading-6 text-muted">
                    {faq.answer}
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
