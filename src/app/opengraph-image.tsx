import { ImageResponse } from "next/og";

export const alt = "SHIVAM.OS — the developer portfolio of Shivam Patil";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "#eef2f9",
          background: "radial-gradient(90% 90% at 15% 0%, #1d3f96 0%, #05070f 60%), #05070f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 700,
              background: "linear-gradient(135deg, #7fb0ff, #7a5cf0)",
            }}
          >
            S
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 1 }}>SHIVAM.OS</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>Shivam Patil</div>
        <div style={{ marginTop: 16, fontSize: 34, color: "#b3bdcc" }}>Software engineer building full-stack products with measurable AI inside.</div>
        <div style={{ marginTop: 40, fontSize: 26, color: "#7fb0ff" }}>Case studies · Architecture X-Ray · Research · Live ML experiment</div>
      </div>
    ),
    size,
  );
}
