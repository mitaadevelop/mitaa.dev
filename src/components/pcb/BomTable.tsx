"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ArrowUp, ArrowDown } from "lucide-react";

/**
 * Renders a Bill of Materials from a CSV artifact as an interactive table
 * (search + sortable columns) — the Diode-style "serve a generated CSV" approach.
 * Pure client-side: the CSV is a static file under /public, parsed in the browser,
 * so nothing extra is needed at build time.
 */

/** Parse CSV text (RFC-4180-ish: quoted fields, "" escapes, embedded delimiters). */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === delimiter) { row.push(field); field = ""; }
    else if (c === "\r") { /* ignore */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/** Pick the delimiter that splits the first line into the most columns. */
function detectDelimiter(firstLine: string): string {
  return [",", ";", "\t"]
    .map((d) => ({ d, n: parseCsv(firstLine, d)[0]?.length ?? 0 }))
    .sort((a, b) => b.n - a.n)[0].d;
}

interface BomData {
  headers: string[];
  rows: string[][];
}

export function BomTable({ src }: { src: string }) {
  const [data, setData] = useState<BomData | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const [loadedSrc, setLoadedSrc] = useState(src);

  // Clear the previous table the moment `src` changes, during render rather
  // than from the effect below — a synchronous setState in an effect costs an
  // extra render pass with the stale rows still on screen.
  if (loadedSrc !== src) {
    setLoadedSrc(src);
    setData(null);
    setError(false);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const firstLine = text.slice(0, text.indexOf("\n") >>> 0 || text.length);
        const table = parseCsv(text, detectDelimiter(firstLine));
        if (table.length === 0) throw new Error("empty");
        setData({ headers: table[0], rows: table.slice(1) });
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [src]);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    let out = q
      ? data.rows.filter((r) => r.some((cell) => cell.toLowerCase().includes(q)))
      : data.rows.slice();
    if (sort) {
      const { col, dir } = sort;
      out = out.slice().sort((a, b) => {
        const av = a[col] ?? "";
        const bv = b[col] ?? "";
        const an = Number(av);
        const bn = Number(bv);
        const bothNum = av !== "" && bv !== "" && !Number.isNaN(an) && !Number.isNaN(bn);
        const cmp = bothNum ? an - bn : av.localeCompare(bv, undefined, { numeric: true });
        return cmp * dir;
      });
    }
    return out;
  }, [data, query, sort]);

  function toggleSort(col: number) {
    setSort((prev) =>
      prev && prev.col === col ? { col, dir: prev.dir === 1 ? -1 : 1 } : { col, dir: 1 },
    );
  }

  if (error) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-divider bg-secondary text-[13px] text-muted">
        Couldn’t load the BOM.
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-divider bg-secondary text-[13px] text-date">
        Loading BOM…
      </div>
    );
  }

  // If there's a "Qty" column, total it up for the caption.
  const qtyCol = data.headers.findIndex((h) => /^qty|quantity$/i.test(h.trim()));
  const totalQty =
    qtyCol >= 0
      ? rows.reduce((sum, r) => sum + (Number(r[qtyCol]) || 0), 0)
      : null;

  return (
    <div className="rounded-xl border border-divider bg-secondary">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-divider px-3 py-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-date" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter parts…"
            className="w-48 rounded-md bg-background/60 pl-7 pr-2 py-1 text-[12px] text-foreground placeholder:text-date focus:outline-none focus:ring-1 focus:ring-foreground/10"
          />
        </div>
        <span className="text-[11px] text-date">
          {rows.length} line{rows.length === 1 ? "" : "s"}
          {totalQty !== null ? ` · ${totalQty} parts` : ""}
        </span>
      </div>

      {/* Table */}
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 z-10 bg-secondary">
            <tr>
              {data.headers.map((h, i) => (
                <th
                  key={i}
                  onClick={() => toggleSort(i)}
                  className="cursor-pointer select-none border-b border-divider px-3 py-2 text-left font-medium text-muted hover:text-foreground whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    {h}
                    {sort?.col === i &&
                      (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-b border-divider/60 last:border-0 hover:bg-background/40">
                {data.headers.map((_, ci) => (
                  <td key={ci} className="px-3 py-1.5 align-top text-foreground">
                    {r[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={data.headers.length}
                  className="px-3 py-6 text-center text-[12px] text-date"
                >
                  No parts match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
