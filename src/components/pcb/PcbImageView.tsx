"use client";

import { useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import { SWAP_CLASSES, swapView } from "@/lib/view-transition";

/**
 * Diode-style static rendering: shows a pre-generated image (SVG/PNG) of a
 * schematic or PCB with pan/zoom, and — for a PCB — a Top / Bottom / X-ray view
 * toggle. The images are produced by scripts/render-kicad-images.mjs (kicad-cli)
 * and served as static files, so there's no in-browser KiCad rendering here.
 */

export interface ImageViewOption {
  id: string;
  label: string;
  src: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 10;

export function PcbImageView({ views }: { views: ImageViewOption[] }) {
  const [active, setActive] = useState(views[0]?.id ?? "");
  const [t, setT] = useState({ scale: 1, x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const reset = useCallback(() => setT({ scale: 1, x: 0, y: 0 }), []);

  // Non-passive wheel listener so we can preventDefault and zoom toward the cursor.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setT((prev) => {
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor));
        const k = scale / prev.scale;
        return { scale, x: cx - k * (cx - prev.x), y: cy - k * (cy - prev.y) };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX - t.x, y: e.clientY - t.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setT((prev) => ({ ...prev, x: e.clientX - drag.current!.x, y: e.clientY - drag.current!.y }));
  }
  function onPointerUp() {
    drag.current = null;
  }

  const src = views.find((v) => v.id === active)?.src ?? views[0]?.src;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onDoubleClick={reset}
      className="absolute inset-0 touch-none select-none"
      style={{ cursor: t.scale > 1 ? "grab" : "default" }}
    >
      {/* Top / Bottom / X-ray fade into each other like a blog page turn. */}
      <ViewTransition update={SWAP_CLASSES} default="none">
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Rendered view"
            draggable={false}
            className="max-h-full max-w-full object-contain p-4"
          />
        </div>
      </ViewTransition>

      {/* View toggle (Top / Bottom / X-ray) — bottom-left, only when >1 view.
          stopPropagation so the container's pan-capture doesn't swallow the click. */}
      {views.length > 1 && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-lg bg-background/80 p-1 backdrop-blur"
        >
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              // Reset the view when switching Top/Bottom/X-ray so you
              // don't land off-screen.
              onClick={() => {
                if (v.id === active) return;
                const from = views.findIndex((view) => view.id === active);
                swapView(views.indexOf(v) > from, () => {
                  setActive(v.id);
                  reset();
                });
              }}
              className={`rounded-md px-2.5 py-0.5 text-[11px] transition-colors ${
                active === v.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-border"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
