import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

const format = new Intl.NumberFormat("en-US");

/**
 * "1,234 downloads". Renders nothing while counting is off (null) or nobody
 * has downloaded yet, so a fresh file never advertises a zero.
 */
export default function DownloadCount({
  count,
  className,
}: {
  count: number | null;
  className?: string;
}) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-medium tabular-nums text-muted",
        className,
      )}
    >
      <Download size={12} aria-hidden="true" />
      {format.format(count)} {count === 1 ? "download" : "downloads"}
    </span>
  );
}

/** The link behind every download button: counted, then redirected to the file. */
export function downloadHref(id: string, open?: "overleaf"): string {
  return `/api/download/${id}${open ? `?open=${open}` : ""}`;
}
