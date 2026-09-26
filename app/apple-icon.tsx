import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon (was missing — bookmarks fell back to a page
 *  screenshot). Midnight ground, sky blob accent, the ccm mark. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B3160",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 140,
            height: 120,
            borderRadius: "52% 48% 55% 45%",
            background: "rgba(144,224,244,0.35)",
          }}
        />
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          ccm
        </div>
      </div>
    ),
    size
  );
}
