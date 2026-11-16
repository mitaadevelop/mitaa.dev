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
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "9999px",
              background: "#22D3EE",
            }}
          />
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
