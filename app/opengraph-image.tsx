import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Connecting Climate Minds Hub";

/** Site-wide OG/share card (was missing — shares rendered bare links).
 *  Midnight ground, sky + water blob accents, wordmark + tagline. Per-content
 *  dynamic variants (type/region-coloured, dir-aware titles) are the B7
 *  follow-up on each detail route. */
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
          background: "#0B3160",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -100,
            width: 480,
            height: 400,
            borderRadius: "52% 48% 55% 45%",
            background: "rgba(144,224,244,0.28)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -120,
            width: 420,
            height: 380,
            borderRadius: "48% 52% 45% 55%",
            background: "rgba(65,134,195,0.35)",
          }}
        />
        <div style={{ display: "flex", fontSize: 34, color: "#90E0F4", fontWeight: 700 }}>
          connecting climate minds
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          Connecting climate change and mental health research
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "#9BC6DA" }}>
          hub.connectingclimateminds.org
        </div>
      </div>
    ),
    size
  );
}
