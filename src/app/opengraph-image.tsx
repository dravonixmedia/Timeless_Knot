import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name} — Wedding Photography & Cinematography`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Typographic share card in the brand palette, used until real photography exists. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#263a31",
          color: "#faf9f6",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 10, color: "#98ad9b" }}>
          WEDDING PHOTOGRAPHY &amp; CINEMATOGRAPHY
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, letterSpacing: 18, lineHeight: 1 }}>TIMELESS KNOT</div>
          <div style={{ marginTop: 28, fontSize: 34, color: "#e5ebe3" }}>{site.tagline}</div>
        </div>
        <div style={{ display: "flex", height: 1, background: "rgba(229,235,227,0.3)" }} />
      </div>
    ),
    size,
  );
}
