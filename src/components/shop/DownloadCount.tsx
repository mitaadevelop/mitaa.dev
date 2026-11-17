import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n/dictionary";

/**
 * "1,234 downloads" ("1.234 downloads" in Dutch). Renders nothing while counting is off (null) or nobody
 * has downloaded yet, so a fresh file never advertises a zero.
 */
export default function DownloadCount({
  count,
  lang,
  className,
}: {
  count: number | null;
  lang: Lang;
  className?: string;
}) {
  if (!count) return null;
  const words = dictionary(lang);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-medium tabular-nums text-muted",
        className,
      )}
    >
      <Download size={12} aria-hidden="true" />
      {new Intl.NumberFormat(words.locale).format(count)} {words.shop.downloads(count).replace(/^\S+\s/, "")}
    </span>
  );
}

/** The link behind every download button: counted, then redirected to the file. */
export function downloadHref(id: string, open?: "overleaf"): string {
  return `/api/download/${id}${open ? `?open=${open}` : ""}`;
}
