import { describe, it, expect } from "vitest";
import { youtubeId } from "../youtube";

describe("youtubeId", () => {
  it("extracts from watch URLs", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("extracts from youtu.be short URLs", () => {
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("extracts from embed URLs", () => {
    expect(youtubeId("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("returns null for non-YouTube URLs (Vimeo etc. not allowed in v1)", () => {
    expect(youtubeId("https://vimeo.com/123456789")).toBeNull();
    expect(youtubeId("https://example.com/video")).toBeNull();
    expect(youtubeId("not a url")).toBeNull();
  });
});
