import { describe, it, expect } from "vitest";
import { deriveVideoSource } from "../video-source";

describe("deriveVideoSource", () => {
  it("honours an explicit videoSource above everything else", () => {
    expect(deriveVideoSource("youtube", "https://vimeo.com/123", "https://cdn/x.mp4")).toBe(
      "youtube"
    );
    expect(deriveVideoSource("vimeo", "https://youtu.be/dQw4w9WgXcQ", null)).toBe("vimeo");
    expect(deriveVideoSource("upload", null, null)).toBe("upload");
  });

  it("ignores unknown videoSource values and falls back to derivation", () => {
    expect(deriveVideoSource("dailymotion", "https://vimeo.com/123456789", null)).toBe("vimeo");
    expect(deriveVideoSource("", "https://youtu.be/dQw4w9WgXcQ", null)).toBe("youtube");
  });

  it("derives upload when a file URL is present (legacy docs never have one)", () => {
    expect(deriveVideoSource(null, null, "https://cdn.sanity.io/files/x/y/z.mp4")).toBe("upload");
    // file wins over a URL when both exist and no explicit source is set
    expect(
      deriveVideoSource(undefined, "https://vimeo.com/123456789", "https://cdn/x.webm")
    ).toBe("upload");
  });

  it("derives youtube/vimeo from a legacy videoUrl", () => {
    expect(deriveVideoSource(null, "https://www.youtube.com/watch?v=dQw4w9WgXcQ", null)).toBe(
      "youtube"
    );
    expect(deriveVideoSource(null, "https://youtu.be/dQw4w9WgXcQ", null)).toBe("youtube");
    expect(deriveVideoSource(null, "https://vimeo.com/123456789", null)).toBe("vimeo");
    expect(deriveVideoSource(null, "https://player.vimeo.com/video/76979871", null)).toBe("vimeo");
  });

  it("returns null when nothing matches", () => {
    expect(deriveVideoSource(null, null, null)).toBeNull();
    expect(deriveVideoSource(undefined, undefined, undefined)).toBeNull();
    expect(deriveVideoSource(null, "https://example.com/video", null)).toBeNull();
    expect(deriveVideoSource(null, "not a url", null)).toBeNull();
    expect(deriveVideoSource(null, "", "")).toBeNull();
  });
});
