import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/components/site/LocaleLink";
import { ArrowLeft, Check, Download, ExternalLink, FileText } from "lucide-react";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import DownloadCount, { downloadHref } from "@/components/shop/DownloadCount";
import {
  latexCheatsheet,
  latexTemplates,
  TEMPLATE_LICENSE,
  templateDownloadId,
  templateFiles,
} from "@/data/latex-templates";
import { isLang, pick } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/metadata";
import { getDownloadCounts, sumCounts } from "@/lib/downloads";

// Download counts are read from Redis at most once a minute.
// Must be a literal — keep in sync with COUNTS_REVALIDATE in @/lib/downloads.
export const revalidate = 60;

type Props = Readonly<{ params: Promise<{ lang: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const words = dictionary(lang).shop;
  return {
    title: words.latexMetaTitle,
    description: words.latexMetaDescription,
    alternates: languageAlternates(lang, "/shop/latex-templates"),
    openGraph: {
      title: words.latexOgTitle,
      description: words.latexMetaDescription,
      images: [
        {
          url: latexCheatsheet.files.previews[0],
          width: 1400,
          height: 990,
          alt: words.latexOgAlt,
        },
      ],
    },
  };
}

const button =
  "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const primary = `${button} bg-primary text-primary-foreground hover:opacity-85`;
const secondary = `${button} border border-divider text-foreground hover:bg-card-hover`;
const tertiary = `${button} text-muted hover:text-foreground`;

function Checklist({ items, label }: { items: readonly string[]; label: string }) {
  return (
    <ul aria-label={label} className="mt-5 space-y-2 lg:mb-8">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[13px] leading-5 text-foreground">
          <Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function LatexTemplatesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const words = dictionary(lang);
  const shop = words.shop;
  const counts = await getDownloadCounts();
  const templateIds = latexTemplates.map((t) => templateDownloadId(t.slug));
  const total = sumCounts(counts, [...templateIds, latexCheatsheet.id]);

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

      <Blur delay={50}>
        <header className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-badge-bg px-2.5 py-1 text-[11px] font-medium text-badge-text">
              {words.common.free}
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted">
              {shop.latexKicker}
            </span>
            <DownloadCount count={total} lang={lang} className="ml-1" />
          </div>
          <h1 className="mt-6 text-[36px] font-semibold leading-[1.05] tracking-[-1.2px] text-foreground sm:text-[46px]">
            {shop.latexTitle}
          </h1>
          <p className="mt-5 text-[15px] leading-7 text-muted">
            {shop.latexLead}
          </p>
          <p className="mt-3 text-[12px] leading-5 text-date">{shop.englishNote}</p>
        </header>
      </Blur>

      <Fade delay={100}>
        <article
          id="cheatsheet"
          aria-labelledby="cheatsheet-title"
          className="mt-14 grid scroll-mt-8 overflow-hidden rounded-lg border border-divider bg-card lg:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]"
        >
          <div className="flex flex-col items-center justify-center gap-4 bg-secondary px-6 py-10 sm:px-10 sm:py-12">
            {latexCheatsheet.files.previews.map((src, i) => (
              <div
                key={src}
                className="relative aspect-[1.414/1] w-full max-w-[640px] overflow-hidden rounded-[3px] bg-white shadow-lg ring-1 ring-black/5"
              >
                <Image
                  src={src}
                  alt={shop.cheatAlt(i + 1)}
                  fill
                  sizes="(max-width: 1023px) 90vw, 640px"
                  className="object-cover object-top"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col p-6 sm:p-9">
            <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-date">
              {shop.cheatMeta}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2
                id="cheatsheet-title"
                className="text-[26px] font-semibold tracking-[-0.6px] text-foreground"
              >
                {pick(lang, latexCheatsheet.title)}
              </h2>
              <DownloadCount count={counts?.[latexCheatsheet.id] ?? null} lang={lang} />
            </div>
            <p className="mt-3 text-[14px] leading-7 text-muted">{pick(lang, latexCheatsheet.description)}</p>
            <Checklist items={pick(lang, latexCheatsheet.sections)} label={shop.inside} />

            <div className="mt-8 border-t border-divider pt-6 lg:mt-auto">
              <div className="flex flex-wrap items-center gap-2">
                <a href={downloadHref(latexCheatsheet.id)} rel="nofollow" className={primary}>
                  <Download size={12} aria-hidden="true" />
                  {shop.downloadCheat}
                </a>
              </div>
              <p className="mt-4 text-[12px] leading-5 text-date">{pick(lang, latexCheatsheet.license)}</p>
            </div>
          </div>
        </article>
      </Fade>

      <div className="mt-8 space-y-8">
        {latexTemplates.map((template) => {
          const id = templateDownloadId(template.slug);
          const files = templateFiles(template);
          return (
            <Fade key={template.slug} delay={80} inView>
              <article
                id={template.slug}
                aria-labelledby={`${template.slug}-title`}
                className="grid scroll-mt-8 overflow-hidden rounded-lg border border-divider bg-card lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)]"
              >
                <div className="flex items-center justify-center gap-4 bg-secondary px-6 py-10 sm:gap-6 sm:px-10 sm:py-12">
                  {files.previews.map((src, i) => (
                    <div
                      key={src}
                      className="relative aspect-[1/1.414] w-[44%] max-w-[260px] overflow-hidden rounded-[3px] bg-white shadow-lg ring-1 ring-black/5"
                    >
                      <Image
                        src={src}
                        alt={shop.templateAlt(pick(lang, template.title), template.previewPages[i])}
                        fill
                        sizes="(max-width: 1023px) 44vw, 260px"
                        className="object-cover object-top"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col p-6 sm:p-9">
                  <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-date">
                    {shop.templateKicker}
                  </p>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2
                      id={`${template.slug}-title`}
                      className="text-[26px] font-semibold tracking-[-0.6px] text-foreground"
                    >
                      {pick(lang, template.title)}
                    </h2>
                    <DownloadCount count={counts?.[id] ?? null} lang={lang} />
                  </div>
                  <p className="mt-3 text-[14px] leading-7 text-muted">{pick(lang, template.description)}</p>
                  <Checklist items={pick(lang, template.sections)} label={shop.inside} />

                  <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-divider pt-6 lg:mt-auto">
                    <a
                      href={downloadHref(id, "overleaf")}
                      target="_blank"
                      rel="nofollow noopener"
                      aria-label={shop.openOverleafLabel(pick(lang, template.title).toLowerCase())}
                      className={primary}
                    >
                      {shop.openOverleaf}
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                    <a
                      href={downloadHref(id)}
                      rel="nofollow"
                      aria-label={shop.zipLabel(pick(lang, template.title).toLowerCase())}
                      className={secondary}
                    >
                      <Download size={12} aria-hidden="true" />
                      {shop.zip}
                    </a>
                    <a
                      href={files.pdf}
                      target="_blank"
                      rel="noopener"
                      aria-label={shop.exampleLabel(pick(lang, template.title).toLowerCase())}
                      className={tertiary}
                    >
                      <FileText size={12} aria-hidden="true" />
                      {shop.example}
                    </a>
                  </div>
                </div>
              </article>
            </Fade>
          );
        })}
      </div>

      <Fade delay={80} inView>
        <section
          className="mt-16 border-y border-divider py-12"
          aria-labelledby="how-to-use"
        >
          <h2
            id="how-to-use"
            className="text-[13px] font-medium uppercase tracking-[0.8px] text-muted"
          >
            {shop.howTo}
          </h2>
          <ol className="mt-7 grid gap-8 md:grid-cols-3">
            {shop.howToSteps.map((step, index) => (
              <li key={step.title}>
                <span className="flex size-8 items-center justify-center rounded-full border border-divider text-[10px] font-medium text-date">
                  0{index + 1}
                </span>
                <h3 className="mt-4 text-[14px] font-medium text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </Fade>

      <Fade delay={80} inView>
        <section className="py-12" aria-labelledby="template-license">
          <h2
            id="template-license"
            className="text-[13px] font-medium uppercase tracking-[0.8px] text-muted"
          >
            {shop.license}
          </h2>
          <p className="mt-5 max-w-2xl text-[14px] leading-7 text-muted">
            {pick(lang, TEMPLATE_LICENSE)} {shop.cheatLicenseLead} {(() => { const text = pick(lang, latexCheatsheet.license); return text.charAt(0).toLowerCase() + text.slice(1); })()}
          </p>
        </section>
      </Fade>
    </div>
  );
}
