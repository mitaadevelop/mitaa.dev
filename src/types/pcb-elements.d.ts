import type React from "react";

// Custom elements used by the PCB viewer/preview aren't in React's JSX types.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "kicanvas-source": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { src?: string; type?: string },
        HTMLElement
      >;
      "kicanvas-embed": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          controls?: string;
          controlslist?: string;
          theme?: string;
          zoom?: "objects" | "page" | string;
        },
        HTMLElement
      >;
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          poster?: string;
          "camera-controls"?: boolean;
          "auto-rotate"?: boolean;
          "disable-zoom"?: boolean;
          "rotation-per-second"?: string;
          "interaction-prompt"?: string;
          "shadow-intensity"?: string;
          "shadow-softness"?: string;
          "environment-image"?: string;
          "tone-mapping"?: string;
          exposure?: string;
          "camera-orbit"?: string;
          "min-camera-orbit"?: string;
          "max-camera-orbit"?: string;
          loading?: "auto" | "lazy" | "eager";
          reveal?: "auto" | "interaction" | "manual";
        },
        HTMLElement
      >;
    }
  }
}
