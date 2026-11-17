"use client";

import { useDictionary } from "@/components/site/LangProvider";
import { useMemo, useState, ViewTransition } from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import type { MarkdownDoc, PdfDoc } from "@/lib/projects/types";
import { SWAP_CLASSES, swapView } from "@/lib/view-transition";

interface Props {
  docs: MarkdownDoc[];
  pdfs?: PdfDoc[];
}

type Tab =
  | { kind: "md"; key: string; label: string; title: string; doc: MarkdownDoc }
  | { kind: "pdf"; key: string; label: string; title: string; pdf: PdfDoc };

/** "1.4 MB" / "812 KB", shown next to the download link. */
function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Prefix the parent directory on tabs whose label isn't unique. */
function disambiguate(tabs: Tab[]): Tab[] {
  const counts = new Map<string, number>();
  for (const tab of tabs) {
    const key = tab.label.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return tabs.map((tab) => {
    if ((counts.get(tab.label.toLowerCase()) ?? 0) < 2) return tab;
    const parent = tab.title.split("/").slice(-2, -1)[0];
    return parent ? { ...tab, label: `${parent}/${tab.label}` } : tab;
  });
}

/**
 * Renders a project's documents with buttons to switch between them: markdown
 * files (as HTML) and PDFs (as a native browser embed). With a single document
 * the buttons are hidden and only the content is shown.
 *
 * Switching fades the document out and the next one in, the way a blog post
 * turns a page (swapView); a tab to the right counts as forward.
 */
export function MarkdownDocs({ docs, pdfs }: Readonly<Props>) {
  const { project: words } = useDictionary();
  const [active, setActive] = useState(0);

  const tabs = useMemo<Tab[]>(
    () =>
      disambiguate([
        ...(docs ?? []).map(
          (doc): Tab => ({ kind: "md", key: `md:${doc.path}`, label: doc.label, title: doc.path, doc }),
        ),
        ...(pdfs ?? []).map(
          (pdf): Tab => ({ kind: "pdf", key: `pdf:${pdf.src}`, label: pdf.label, title: pdf.path, pdf }),
        ),
      ]),
    [docs, pdfs],
  );

  if (tabs.length === 0) return null;
  const current = tabs[Math.min(active, tabs.length - 1)];

  const select = (index: number) => {
    if (index === active) return;
    swapView(index > active, () => setActive(index));
  };

  return (
    <div>
      {tabs.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => select(i)}
              title={tab.title}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                i === active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted hover:text-foreground"
              }`}
            >
              {tab.kind === "pdf" && <FileText size={13} />}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <ViewTransition key={current.key} enter={SWAP_CLASSES} exit={SWAP_CLASSES} default="none">
        {current.kind === "md" ? (
          <div
            className="prose-blog max-w-none"
            dangerouslySetInnerHTML={{ __html: current.doc.html }}
          />
        ) : (
          <div>
            <div className="relative w-full overflow-hidden rounded-xl border border-divider bg-secondary h-[70vh] min-h-[420px] max-h-[840px]">
              <object
                key={current.key}
                data={`${current.pdf.src}#view=FitH`}
                type="application/pdf"
                aria-label={current.label}
                className="h-full w-full"
              >
                {/* Only rendered when the browser has no inline PDF handler (most mobile browsers). */}
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <FileText size={20} className="text-muted" />
                  <p className="text-[13px] text-muted">
                    {words.pdfUnsupported}
                  </p>
                  <a
                    href={current.pdf.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors"
                  >
                    {words.pdfOpen} <ExternalLink size={14} />
                  </a>
                </div>
              </object>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-[12px] text-date">
              <span className="truncate" title={current.pdf.path}>
                {current.pdf.path}
              </span>
              <a
                href={current.pdf.src}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 text-muted hover:text-foreground transition-colors"
              >
                <Download size={13} />
                {words.download}{current.pdf.size ? ` (${formatBytes(current.pdf.size)})` : ""}
              </a>
            </div>
          </div>
        )}
      </ViewTransition>
    </div>
  );
}
