"use client";

import { useCallback, useEffect, useMemo, useRef, useState, ViewTransition } from "react";
import Script from "next/script";
import { CircuitBoard, Layers, Box, Table, Maximize2, Minimize2 } from "lucide-react";
import type { PcbAssets } from "@/lib/projects/types";
import { resolveModelSrc } from "@/lib/pcb";
import { BomTable } from "@/components/pcb/BomTable";
import { PcbImageView, type ImageViewOption } from "@/components/pcb/PcbImageView";
import { SWAP_CLASSES, swapView } from "@/lib/view-transition";
import { useDictionary } from "@/components/site/LangProvider";

/**
 * Interactive PCB viewer with Schematic / PCB / 3D tabs.
 *
 * - Schematic + PCB render KiCad source files directly in the browser via KiCanvas
 *   (a web component; https://kicanvas.org). No build step — it parses .kicad_sch /
 *   .kicad_pcb at runtime. `zoom="objects"` fits the view to the drawing (not the
 *   empty sheet margins), so symbols/traces are large from the start.
 * - 3D renders a .glb / .gltf via Google's <model-viewer>.
 *
 * Both are external ES modules loaded on demand. A tab's heavy source file is only
 * fetched once its tab has been opened. A fullscreen toggle gives room to inspect,
 * and the PCB tab gets compact layer presets.
 */

type TabId = "schematic" | "pcb" | "3d" | "bom";
type LayerPreset = "all" | "front" | "back" | "copper";

const KICANVAS_SRC = "https://kicanvas.org/kicanvas/kicanvas.js";
const MODEL_VIEWER_SRC =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js";

/** The preset ids; their labels come from the dictionary (`pcb.layer`). */
const LAYER_PRESETS: { id: LayerPreset }[] = [{ id: "all" }, { id: "front" }, { id: "back" }, { id: "copper" }];

/**
 * Reach KiCanvas's internal BoardViewer through the embed's shadow DOM. Best-effort
 * and deliberately defensive: KiCanvas is alpha and exposes no public layer API, so
 * if its internal element/property shape changes this just returns null and the
 * layer controls quietly disappear rather than throwing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBoardViewer(embed: HTMLElement | null): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app: any = (embed as any)?.shadowRoot?.querySelector("kc-board-app");
    const el = app?.shadowRoot?.querySelector("kc-board-viewer");
    const viewer = el?.viewer;
    if (viewer?.layers && typeof viewer.layers.in_ui_order === "function") return viewer;
  } catch {
    /* internals changed or not ready */
  }
  return null;
}

/**
 * Reach KiCanvas's public Project (on the schematic app element) to drive sheet
 * navigation. Also best-effort; returns null if KiCanvas isn't loaded or changed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSchematicProject(embed: HTMLElement | null): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app: any = (embed as any)?.shadowRoot?.querySelector("kc-schematic-app");
    const project = app?.project;
    if (project && typeof project.pages === "function") return project;
  } catch {
    /* internals changed or not ready */
  }
  return null;
}

interface SheetOption {
  path: string;
  label: string;
}

export function PcbViewer({ pcb }: { pcb: PcbAssets }) {
  const { pcb: words } = useDictionary();
  // Diode-style pre-rendered images take precedence over the live KiCanvas view.
  const schematicAsImage = !!pcb.schematicImage;
  const pcbAsImage = !!pcb.pcbImage || !!pcb.pcbXrayImage;

  // The Top / Bottom / X-ray views available as static images.
  const pcbViews = useMemo<ImageViewOption[]>(() => {
    const v: ImageViewOption[] = [];
    if (pcb.pcbImage) v.push({ id: "top", label: words.top, src: pcb.pcbImage });
    if (pcb.pcbBackImage) v.push({ id: "bottom", label: words.bottom, src: pcb.pcbBackImage });
    if (pcb.pcbXrayImage) v.push({ id: "xray", label: words.xray, src: pcb.pcbXrayImage });
    return v;
  }, [pcb.pcbImage, pcb.pcbBackImage, pcb.pcbXrayImage, words]);

  const tabs = useMemo(() => {
    const list: { id: TabId; label: string; icon: typeof Layers }[] = [];
    if (pcb.schematic || pcb.schematicImage)
      list.push({ id: "schematic", label: words.schematic, icon: CircuitBoard });
    if (pcb.board || pcb.pcbImage || pcb.pcbXrayImage)
      list.push({ id: "pcb", label: words.pcb, icon: Layers });
    if (pcb.model3d) list.push({ id: "3d", label: words.threeD, icon: Box });
    if (pcb.bom) list.push({ id: "bom", label: words.bom, icon: Table });
    return list;
  }, [pcb, words]);

  const [active, setActive] = useState<TabId | null>(tabs[0]?.id ?? null);
  // Track which tabs have been opened so we mount (and fetch) each view lazily,
  // then keep it mounted to avoid re-downloading on tab switches.
  const [visited, setVisited] = useState<Set<TabId>>(() =>
    tabs[0] ? new Set([tabs[0].id]) : new Set(),
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layerControls, setLayerControls] = useState(false);
  const [sheets, setSheets] = useState<SheetOption[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");

  const viewportRef = useRef<HTMLDivElement>(null);
  const boardEmbedRef = useRef<HTMLElement>(null);
  const schematicEmbedRef = useRef<HTMLElement>(null);

  // All schematic sources to hand KiCanvas (root + sub-sheets + .kicad_pro), so
  // hierarchical designs resolve. Falls back to the single root sheet.
  const schematicSources = useMemo(
    () => (pcb.schematicSheets?.length ? pcb.schematicSheets : pcb.schematic ? [pcb.schematic] : []),
    [pcb.schematicSheets, pcb.schematic],
  );

  // Keep fullscreen state in sync (also catches Esc, which exits natively).
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === viewportRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Once the PCB tab is open, poll briefly until KiCanvas's board viewer (with its
  // layers) is reachable; only then do we reveal the layer presets.
  useEffect(() => {
    if (!visited.has("pcb") || layerControls || pcbAsImage) return;
    let tries = 0;
    const id = setInterval(() => {
      const viewer = getBoardViewer(boardEmbedRef.current);
      let hasLayers = false;
      if (viewer) {
        try {
          const [first] = viewer.layers.in_ui_order();
          hasLayers = first !== undefined;
        } catch {
          hasLayers = false;
        }
      }
      if (hasLayers) {
        setLayerControls(true);
        clearInterval(id);
      } else if (++tries > 40) {
        clearInterval(id); // ~10s: give up silently
      }
    }, 250);
    return () => clearInterval(id);
  }, [visited, layerControls, pcbAsImage]);

  // Once the schematic tab is open, poll until KiCanvas's project is reachable, then
  // list its schematic pages so the sheet selector can appear (only if >1 page).
  useEffect(() => {
    if (!visited.has("schematic") || sheets.length > 0 || schematicAsImage) return;
    let tries = 0;
    const id = setInterval(() => {
      const project = getSchematicProject(schematicEmbedRef.current);
      const pages: SheetOption[] = [];
      if (project) {
        try {
          for (const p of project.pages()) {
            if (p.type !== "schematic") continue;
            const label =
              p.name || (p.page ? `Sheet ${p.page}` : String(p.filename).split("/").pop());
            pages.push({ path: p.project_path, label: label || "Sheet" });
          }
        } catch {
          /* not ready */
        }
      }
      if (pages.length) {
        setSheets(pages);
        try {
          setActiveSheet(project.active_page?.project_path ?? pages[0].path);
        } catch {
          setActiveSheet(pages[0].path);
        }
        clearInterval(id);
      } else if (++tries > 40) {
        clearInterval(id);
      }
    }, 250);
    return () => clearInterval(id);
  }, [visited, sheets.length, schematicAsImage]);

  const selectSheet = useCallback((path: string) => {
    setActiveSheet(path);
    const project = getSchematicProject(schematicEmbedRef.current);
    try {
      project?.set_active_page(path);
    } catch {
      /* internals changed — ignore */
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  const applyPreset = useCallback((preset: LayerPreset) => {
    const viewer = getBoardViewer(boardEmbedRef.current);
    if (!viewer) return;
    try {
      for (const layer of viewer.layers.in_ui_order()) {
        const n = String(layer.name);
        layer.visible =
          preset === "all"
            ? true
            : preset === "front"
              ? n.startsWith("F.") || n === "Edge.Cuts"
              : preset === "back"
                ? n.startsWith("B.") || n === "Edge.Cuts"
                : /\.Cu$/.test(n) || n === "Edge.Cuts"; // copper
      }
      viewer.draw();
    } catch {
      /* internals changed — ignore */
    }
  }, []);

  if (tabs.length === 0) return null;

  function open(id: TabId) {
    if (id === active) return;
    const from = tabs.findIndex((tab) => tab.id === active);
    const to = tabs.findIndex((tab) => tab.id === id);
    swapView(to > from, () => {
      setActive(id);
      setVisited((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    });
  }

  const needsKicanvas =
    (visited.has("schematic") && !schematicAsImage) || (visited.has("pcb") && !pcbAsImage);
  const needs3d = visited.has("3d");

  return (
    <div>
      {needsKicanvas && <Script type="module" src={KICANVAS_SRC} strategy="lazyOnload" />}
      {needs3d && <Script type="module" src={MODEL_VIEWER_SRC} strategy="lazyOnload" />}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => open(id)}
            className={`inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-full transition-colors ${
              active === id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-border"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Switching tabs fades the views like a blog page turn. The views stay
          mounted (only hidden), so zoom and camera survive: this is the
          ViewTransition's `update` animation, not an enter/exit. */}
      <ViewTransition update={SWAP_CLASSES} default="none">
        <div>
          {/* Viewport — one container, each view shown/hidden so state (zoom, camera) persists. */}
          <div
            ref={viewportRef}
            className={`relative w-full overflow-hidden border border-divider bg-secondary ${
              isFullscreen ? "h-screen rounded-none" : "h-[460px] rounded-xl"
            } ${active === "bom" ? "hidden" : ""}`}
          >
            {(pcb.schematic || pcb.schematicImage) && visited.has("schematic") && (
              <div className={active === "schematic" ? "absolute inset-0" : "hidden"}>
                {schematicAsImage ? (
                  <PcbImageView views={[{ id: "sch", label: words.schematic, src: pcb.schematicImage! }]} />
                ) : (
                  <kicanvas-embed
                    ref={schematicEmbedRef}
                    controls="basic"
                    controlslist="nooverlay"
                    zoom="objects"
                    style={{ width: "100%", height: "100%", display: "block" }}
                  >
                    {schematicSources.map((s) => (
                      <kicanvas-source key={s} src={s} />
                    ))}
                  </kicanvas-embed>
                )}
              </div>
            )}

            {(pcb.board || pcbAsImage) && visited.has("pcb") && (
              <div className={active === "pcb" ? "absolute inset-0" : "hidden"}>
                {pcbAsImage ? (
                  <PcbImageView views={pcbViews} />
                ) : (
                  <kicanvas-embed
                    ref={boardEmbedRef}
                    src={pcb.board}
                    controls="basic"
                    controlslist="nooverlay"
                    zoom="objects"
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                )}
              </div>
            )}

            {pcb.model3d && visited.has("3d") && (
              <div className={active === "3d" ? "absolute inset-0" : "hidden"}>
                <model-viewer
                  src={resolveModelSrc(pcb.model3d)}
                  alt={words.view3d}
                  camera-controls
                  auto-rotate
                  rotation-per-second="18deg"
                  environment-image="neutral"
                  tone-mapping="neutral"
                  exposure="1"
                  shadow-intensity="0.9"
                  shadow-softness="1"
                  camera-orbit="0deg 60deg 105%"
                  min-camera-orbit="auto 0deg auto"
                  max-camera-orbit="auto 180deg auto"
                  style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
                />
              </div>
            )}

            {/* Controls overlay — top-left, where KiCanvas leaves room */}
            <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-2">
              {/* Fullscreen toggle — all tabs */}
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? words.exitFullscreen : words.fullscreen}
                className="inline-flex items-center gap-1.5 rounded-lg bg-background/80 px-2.5 py-1.5 text-[12px] text-foreground backdrop-blur hover:bg-border transition-colors"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {isFullscreen ? words.exit : words.fullscreen}
              </button>

              {/* Sheet selector — schematic tab only, when the design has multiple sheets */}
              {active === "schematic" && sheets.length > 1 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-background/80 p-1 backdrop-blur">
                  <span className="pl-1.5 text-[10px] font-medium uppercase tracking-wide text-date">
                    {words.sheet}
                  </span>
                  <select
                    value={activeSheet}
                    onChange={(e) => selectSheet(e.target.value)}
                    className="max-w-[180px] rounded-md bg-secondary px-2 py-0.5 text-[11px] text-foreground focus:outline-none"
                  >
                    {sheets.map((s) => (
                      <option key={s.path} value={s.path}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Layer presets — PCB tab only, once KiCanvas's viewer is reachable */}
              {active === "pcb" && layerControls && (
                <div className="flex flex-wrap items-center gap-1 rounded-lg bg-background/80 p-1 backdrop-blur">
                  <span className="px-1.5 text-[10px] font-medium uppercase tracking-wide text-date">
                    {words.layers}
                  </span>
                  {LAYER_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-foreground hover:bg-border transition-colors"
                    >
                      {words.layer[p.id]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BOM panel — a table, not a canvas; kept mounted once visited */}
          {pcb.bom && visited.has("bom") && (
            <div className={active === "bom" ? "" : "hidden"}>
              <BomTable src={pcb.bom} />
            </div>
          )}
        </div>
      </ViewTransition>

      <p className="mt-2 text-[11px] text-date">
        {active === "bom"
          ? "Bill of materials · click a column to sort · filter to search."
          : (active === "schematic" && schematicAsImage) || (active === "pcb" && pcbAsImage)
            ? "Drag to pan · scroll to zoom · double-click to reset · pre-rendered from the KiCad files."
            : "Drag to pan · scroll to zoom · fullscreen for detail · rendered in-browser from the original KiCad files."}
      </p>
    </div>
  );
}
