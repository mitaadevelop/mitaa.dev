"use client";

import { useEffect, useMemo, useState, ViewTransition } from "react";
import { SWAP_CLASSES, swapView } from "@/lib/view-transition";
import { useTheme } from "next-themes";
import { useDictionary } from "@/components/site/LangProvider";
import { Table2, LineChart as LineIcon } from "lucide-react";

/**
 * Multi-series line chart for measurement data (scope captures, sweeps, logs).
 * Reads a CSV (first column = X, remaining columns = Y series), draws recessive
 * axes/grid, 2px series lines in a CVD-validated categorical palette (fixed order,
 * never cycled), a crosshair+tooltip hover layer, a legend (for ≥2 series) and a
 * table view. Dependency-free SVG.
 *
 * Palette validated with the dataviz skill's validate_palette.js for both the
 * light (#fcfcfb) and dark (#1a1a19) surfaces. The light surface has a contrast
 * WARN on the lighter hues — relieved here by the always-present legend + table view.
 */

// Categorical hues, fixed order. Light / dark steps from the validated ramp.
const SERIES_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const SERIES_DARK = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === "," || c === ";" || c === "\t") { row.push(field); field = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

interface Parsed {
  xLabel: string;
  series: { name: string; points: { x: number; y: number }[] }[];
  xs: number[];
  raw: string[][];
}

function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min];
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

const fmt = (n: number) =>
  Math.abs(n) >= 1000 || (n !== 0 && Math.abs(n) < 0.01)
    ? n.toExponential(2)
    : String(Math.round(n * 1000) / 1000);

export function MeasurementChart({
  src,
  title,
  xLabel: xLabelProp,
  yLabel,
}: {
  src: string;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}) {
  const { project: words } = useDictionary();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const colors = dark ? SERIES_DARK : SERIES_LIGHT;

  const [data, setData] = useState<Parsed | null>(null);
  const [error, setError] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(680);
  // The chart's container is a different element while loading, while the
  // chart shows, and not there at all while the table shows. A callback ref
  // moves the observer to whichever is current — a ref read once on mount
  // kept watching the long-gone "Loading" box, so the chart never resized.
  const [wrapEl, setWrapEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!wrapEl) return;
    const ro = new ResizeObserver((e) => setWidth(e[0].contentRect.width));
    ro.observe(wrapEl);
    return () => ro.disconnect();
  }, [wrapEl]);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => { if (!r.ok) throw new Error(); return r.text(); })
      .then((text) => {
        if (cancelled) return;
        const rows = parseCsv(text);
        if (rows.length < 2) throw new Error("empty");
        const header = rows[0];
        const body = rows.slice(1);
        const xLabel = header[0] || "x";
        const xs = body.map((r) => Number(r[0]));
        const series = header.slice(1).map((name, ci) => ({
          name: name || words.series(ci + 1),
          points: body
            .map((r) => ({ x: Number(r[0]), y: Number(r[ci + 1]) }))
            .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
        })).filter((s) => s.points.length > 0);
        if (!series.length) throw new Error("no series");
        setData({ xLabel, series, xs, raw: rows });
      })
      .catch(() => !cancelled && setError(true));
    return () => { cancelled = true; };
  }, [src, words]);

  const geom = useMemo(() => {
    if (!data) return null;
    const height = 320;
    const m = { top: 12, right: 16, bottom: 40, left: 52 };
    const iw = Math.max(10, width - m.left - m.right);
    const ih = height - m.top - m.bottom;
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const s of data.series) for (const p of s.points) {
      if (p.x < xMin) xMin = p.x; if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y; if (p.y > yMax) yMax = p.y;
    }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const yPad = (yMax - yMin) * 0.08;
    yMin -= yPad; yMax += yPad;
    const sx = (x: number) => m.left + ((x - xMin) / (xMax - xMin || 1)) * iw;
    const sy = (y: number) => m.top + ih - ((y - yMin) / (yMax - yMin || 1)) * ih;
    return { height, m, iw, ih, xMin, xMax, yMin, yMax, sx, sy };
  }, [data, width]);

  if (error)
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-divider bg-secondary text-[13px] text-muted">
        {words.chartError}
      </div>
    );
  if (!data || !geom)
    return (
      <div ref={setWrapEl} className="flex h-[220px] items-center justify-center rounded-xl border border-divider bg-secondary text-[13px] text-date">
        {words.chartLoading}
      </div>
    );

  const { m, iw, ih, xMin, xMax, sx, sy, height } = geom;
  const single = data.series.length === 1;
  const xTicks = niceTicks(xMin, xMax);
  const yTicks = niceTicks(geom.yMin, geom.yMax);
  const nearestIndex = (px: number) => {
    // Snap hover to the closest sample by x.
    let best = 0, bd = Infinity;
    data.xs.forEach((x, i) => { const d = Math.abs(sx(x) - px); if (d < bd) { bd = d; best = i; } });
    return best;
  };

  return (
    <div className="rounded-xl border border-divider bg-secondary p-3">
      {/* Header: title + view toggle */}
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          {title && <p className="truncate text-[13px] font-medium text-foreground">{title}</p>}
          {single && <p className="text-[11px] text-date">{data.series[0].name}</p>}
        </div>
        <button
          type="button"
          // Chart → table counts as forward, and fades like a blog page turn.
          onClick={() => swapView(!showTable, () => setShowTable((v) => !v))}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-background/60 px-2 py-1 text-[11px] text-muted hover:text-foreground transition-colors"
        >
          {showTable ? <LineIcon size={13} /> : <Table2 size={13} />}
          {showTable ? words.chart : words.table}
        </button>
      </div>

      {/* Legend (≥2 series) */}
      {!single && (
        <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1">
          {data.series.map((s, i) => (
            <span key={s.name} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <span className="h-[3px] w-4 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              {s.name}
            </span>
          ))}
        </div>
      )}

      <ViewTransition key={showTable ? "table" : "chart"} enter={SWAP_CLASSES} exit={SWAP_CLASSES} default="none">
        {showTable ? (
          <div className="max-h-[320px] overflow-auto rounded-lg">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 bg-secondary">
                <tr>
                  {data.raw[0].map((h, i) => (
                    <th key={i} className="border-b border-divider px-2 py-1.5 text-left font-medium text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.raw.slice(1).map((r, ri) => (
                  <tr key={ri} className="border-b border-divider/50">
                    {r.map((c, ci) => <td key={ci} className="px-2 py-1 text-foreground">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div ref={setWrapEl} className="relative w-full">
            <svg width={width} height={height} className="block" role="img" aria-label={title || "Measurement chart"}>
              {/* Grid + axes (recessive) */}
              <g className="text-date" stroke="currentColor">
                {yTicks.map((t) => (
                  <line key={`gy${t}`} x1={m.left} x2={m.left + iw} y1={sy(t)} y2={sy(t)} strokeOpacity={0.12} />
                ))}
                <line x1={m.left} x2={m.left} y1={m.top} y2={m.top + ih} strokeOpacity={0.35} />
                <line x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} strokeOpacity={0.35} />
              </g>
              {/* Tick labels */}
              <g className="text-date" fill="currentColor" fontSize={10}>
                {yTicks.map((t) => (
                  <text key={`ty${t}`} x={m.left - 6} y={sy(t)} textAnchor="end" dominantBaseline="middle">{fmt(t)}</text>
                ))}
                {xTicks.map((t) => (
                  <text key={`tx${t}`} x={sx(t)} y={m.top + ih + 16} textAnchor="middle">{fmt(t)}</text>
                ))}
                <text x={m.left + iw / 2} y={height - 4} textAnchor="middle" className="text-muted">{xLabelProp || data.xLabel}</text>
                {yLabel && (
                  <text transform={`translate(12, ${m.top + ih / 2}) rotate(-90)`} textAnchor="middle" className="text-muted">{yLabel}</text>
                )}
              </g>
              {/* Series lines */}
              {data.series.map((s, i) => (
                <polyline
                  key={s.name}
                  fill="none"
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
                />
              ))}
              {/* Hover crosshair + markers */}
              {hover !== null && data.xs[hover] !== undefined && (
                <g>
                  <line x1={sx(data.xs[hover])} x2={sx(data.xs[hover])} y1={m.top} y2={m.top + ih} className="text-foreground" stroke="currentColor" strokeOpacity={0.25} />
                  {data.series.map((s, i) => {
                    const p = s.points.find((pt) => pt.x === data.xs[hover]);
                    if (!p) return null;
                    return <circle key={s.name} cx={sx(p.x)} cy={sy(p.y)} r={4} fill={colors[i % colors.length]} className="stroke-secondary" strokeWidth={2} />;
                  })}
                </g>
              )}
              {/* Hover capture */}
              <rect
                x={m.left} y={m.top} width={iw} height={ih} fill="transparent"
                onPointerMove={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover(nearestIndex(e.clientX - rect.left));
                }}
                onPointerLeave={() => setHover(null)}
              />
            </svg>

            {/* Tooltip */}
            {hover !== null && data.xs[hover] !== undefined && (
              <div
                className="pointer-events-none absolute z-10 rounded-lg border border-divider bg-background/95 px-2.5 py-1.5 text-[11px] shadow-sm backdrop-blur"
                style={{
                  left: Math.min(sx(data.xs[hover]) + 10, width - 140),
                  top: m.top + 4,
                }}
              >
                <div className="mb-0.5 text-date">{(xLabelProp || data.xLabel)}: {fmt(data.xs[hover])}</div>
                {data.series.map((s, i) => {
                  const p = s.points.find((pt) => pt.x === data.xs[hover]);
                  return (
                    <div key={s.name} className="flex items-center gap-1.5 text-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                      <span className="text-muted">{s.name}</span>
                      <span className="ml-auto font-medium tabular-nums">{p ? fmt(p.y) : "—"}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </ViewTransition>
    </div>
  );
}
