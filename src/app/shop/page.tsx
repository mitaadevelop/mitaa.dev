import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import DownloadCount from "@/components/shop/DownloadCount";
import { shopProduct } from "@/data/shop";
import {
  latexCheatsheet,
  latexTemplates,
  templateDownloadId,
  templateFiles,
} from "@/data/latex-templates";
import { getDownloadCounts, sumCounts } from "@/lib/downloads";

// Download counts are read from Redis at most once a minute.
// Must be a literal — keep in sync with COUNTS_REVALIDATE in @/lib/downloads.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Free downloads by mitaa.dev: minimal-tech wallpapers for desktop and mobile, LaTeX templates for essays, reports and research, and a LaTeX cheat sheet.",
  alternates: {
    canonical: "/shop",
  },
};

export default async function ShopPage() {
  const featuredArtwork = shopProduct.artworks[0];
  const counts = await getDownloadCounts();
  const latexDownloads = sumCounts(counts, [
    ...latexTemplates.map((template) => templateDownloadId(template.slug)),
    latexCheatsheet.id,
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-12 lg:px-20">
      <Blur delay={0}>
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 rounded-sm text-[13px] text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft size={14} aria-hidden="true" /> mitaa.dev
        </Link>
      </Blur>

      <Blur delay={50}>
        <div className="mb-10 max-w-2xl">
          <h1 className="text-[13px] font-medium uppercase tracking-[0.8px] text-muted">
            Shop
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-foreground">
            Free downloads: original wallpapers that make technical screens
            feel calm and considered, clean LaTeX templates for your essays,
            reports and research, and a LaTeX cheat sheet to keep next to them.
          </p>
        </div>
      </Blur>

      <Fade delay={100}>
        <Link
          href={`/shop/${shopProduct.slug}`}
          aria-labelledby="signal-product-title"
          className="group block overflow-hidden rounded-lg border border-divider bg-card transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="relative min-h-[300px] overflow-hidden bg-[#0b0d10] sm:min-h-[440px] lg:min-h-[560px]">
              <Image
                src={featuredArtwork.preview.landscape}
                alt={featuredArtwork.alt.landscape}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 68vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.01] motion-reduce:transition-none"
              />

              <div className="absolute bottom-5 right-5 w-[22%] min-w-[84px] max-w-[150px] sm:bottom-8 sm:right-8">
                <div className="relative aspect-[9/20] overflow-hidden rounded-[1.1rem] border-[4px] border-white/20 bg-black shadow-2xl sm:rounded-[1.6rem]">
                  <Image
                    src={featuredArtwork.preview.mobile}
                    alt={featuredArtwork.alt.mobile}
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-1.5 h-2 w-10 -translate-x-1/2 rounded-full bg-black/75 sm:top-2 sm:h-2.5 sm:w-14"
                  />
                </div>
              </div>

              <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.8px] text-white/80 backdrop-blur-sm sm:left-8 sm:top-8">
                Collection 01
              </span>
            </div>

            <div className="flex flex-col p-6 sm:p-9 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-badge-bg px-2.5 py-1 text-[11px] font-medium text-badge-text">
                  {shopProduct.status}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted">
                  {shopProduct.type}
                </span>
              </div>

              <h2
                id="signal-product-title"
                className="mt-6 text-[28px] font-semibold leading-tight tracking-[-0.8px] text-foreground sm:text-[34px]"
              >
                {shopProduct.title}
              </h2>
              <p className="mt-4 text-[14px] leading-7 text-muted">
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

              <div className="mt-10 border-t border-divider pt-6 lg:mt-auto">
                <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-date">
                  Free download
                </p>
                <div className="mt-1 flex items-end justify-between gap-4">
                  <p className="text-[32px] font-semibold tracking-[-0.8px] text-foreground">
                    {shopProduct.price}
                  </p>
                  <span className="inline-flex items-center gap-2 text-[13px] font-medium text-foreground transition-opacity group-hover:opacity-60">
                    View product
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </div>
                <DownloadCount
                  count={counts?.[shopProduct.download.id] ?? null}
                  className="mt-3"
                />
              </div>
            </div>
          </div>
        </Link>
      </Fade>

      <Fade delay={150}>
        <Link
          href="/shop/latex-templates"
          aria-labelledby="latex-templates-title"
          className="group mt-8 block overflow-hidden rounded-lg border border-divider bg-card transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="flex items-center justify-center gap-3 bg-secondary px-6 py-10 sm:gap-5 sm:px-10 sm:py-14">
              {latexTemplates.map((template, i) => (
                <div
                  key={template.slug}
                  className={`relative aspect-[1/1.414] w-[30%] max-w-[210px] overflow-hidden rounded-[3px] bg-white shadow-lg ring-1 ring-black/5 transition-transform duration-500 motion-reduce:transition-none ${
                    i === 1 ? "group-hover:-translate-y-1" : "group-hover:translate-y-0.5"
                  }`}
                >
                  <Image
                    src={templateFiles(template).previews[0]}
                    alt={`Title page of the ${template.title.toLowerCase()} template`}
                    fill
                    sizes="(max-width: 1023px) 30vw, 210px"
                    className="object-cover object-top"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col p-6 sm:p-9 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-badge-bg px-2.5 py-1 text-[11px] font-medium text-badge-text">
                  Free
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted">
                  LaTeX templates
                </span>
              </div>

              <h2
                id="latex-templates-title"
                className="mt-6 text-[28px] font-semibold leading-tight tracking-[-0.8px] text-foreground sm:text-[34px]"
              >
                LaTeX templates &amp; cheat sheet
              </h2>
              <p className="mt-4 text-[14px] leading-7 text-muted">
                Clean, ready-to-write templates for an essay, a report and a
                research report, with APA references. Open one in Overleaf
                with a single click, and keep the two-page cheat sheet close.
              </p>

              <ul
                aria-label="Template details"
                className="mt-6 flex flex-wrap gap-2 lg:mb-10"
              >
                {["3 templates", "Cheat sheet", "Overleaf-ready"].map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-divider px-2.5 py-1 text-[11px] text-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>

              <div className="mt-10 border-t border-divider pt-6 lg:mt-auto">
                <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-date">
                  Free download
                </p>
                <div className="mt-1 flex items-end justify-between gap-4">
                  <p className="text-[32px] font-semibold tracking-[-0.8px] text-foreground">
                    Free
                  </p>
                  <span className="inline-flex items-center gap-2 text-[13px] font-medium text-foreground transition-opacity group-hover:opacity-60">
                    View templates
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </div>
                <DownloadCount count={latexDownloads} className="mt-3" />
              </div>
            </div>
          </div>
        </Link>
      </Fade>
    </div>
  );
}
