"use client";

import Script from "next/script";
import { resolveModelSrc } from "@/lib/pcb";

/**
 * Compact, auto-rotating 3D preview of a board's model, shown on the projects
 * list so hardware projects get an instant PCB preview next to their info.
 *
 * It is purely decorative: pointer events are disabled so clicks fall through to
 * the surrounding project link, and the full interactive viewer lives on the
 * project detail page. The <model-viewer> script is shared/deduped with PcbViewer,
 * loads lazily, and model-viewer itself pauses rendering while off-screen.
 */

const MODEL_VIEWER_SRC =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js";

export function PcbPreview({ model3d }: { model3d: string }) {
  return (
    <>
      <Script type="module" src={MODEL_VIEWER_SRC} strategy="lazyOnload" />
      <div className="pointer-events-none h-full w-full">
        <model-viewer
          src={resolveModelSrc(model3d)}
          alt="3D preview of the PCB"
          auto-rotate
          rotation-per-second="24deg"
          interaction-prompt="none"
          disable-zoom
          environment-image="neutral"
          tone-mapping="neutral"
          exposure="1"
          shadow-intensity="0.7"
          shadow-softness="1"
          // Look down at ~45° so even a flat/bare board reads as a board while it spins.
          camera-orbit="0deg 45deg 105%"
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            // keep the poster/background transparent so the card bg shows through
            ["--poster-color" as string]: "transparent",
          }}
        />
      </div>
    </>
  );
}
