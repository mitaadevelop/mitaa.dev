import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const alt = SITE_DESCRIPTION;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0E0E10",
          color: "#EDEDED",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* The favicon (src/app/icon.svg): the light "m" on the dark page, with the cyan dot. */}
          <svg width="56" height="56" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#1C1C1F" />
            <path
              d="M18 47V26 M18 34C18 28 22 26 25 26C29 26 32 29 32 34V47 M32 34C32 28 36 26 39 26C43 26 46 29 46 34V47"
              fill="none"
              stroke="#EDEDED"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="49.5" cy="16.5" r="4.5" fill="#22D3EE" />
          </svg>
          <div style={{ fontSize: "30px", color: "#8A8A8A" }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ fontSize: "72px", fontWeight: 700, letterSpacing: "-2px" }}>
            Embedded systems, firmware &amp; web
          </div>
          <div style={{ fontSize: "32px", color: "#8A8A8A", maxWidth: "900px" }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
