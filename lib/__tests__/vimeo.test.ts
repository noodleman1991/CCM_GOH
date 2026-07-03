import { describe, it, expect } from "vitest";
import { vimeoId } from "../vimeo";

describe("vimeoId", () => {
  it("extracts from plain vimeo.com URLs", () => {
    expect(vimeoId("https://vimeo.com/123456789")).toBe("123456789");
    expect(vimeoId("https://www.vimeo.com/123456789")).toBe("123456789");
    expect(vimeoId("http://vimeo.com/123456789")).toBe("123456789");
  });

  it("extracts from player.vimeo.com embed URLs", () => {
    expect(vimeoId("https://player.vimeo.com/video/76979871")).toBe("76979871");
  });

  it("extracts from channel URLs", () => {
    expect(vimeoId("https://vimeo.com/channels/staffpicks/123456789")).toBe("123456789");
  });

  it("tolerates query strings and trailing slashes", () => {
    expect(vimeoId("https://vimeo.com/123456789?share=copy")).toBe("123456789");
    expect(vimeoId("https://player.vimeo.com/video/76979871?h=8272103f6e&autoplay=1")).toBe(
      "76979871"
    );
    expect(vimeoId("https://vimeo.com/123456789/")).toBe("123456789");
    expect(vimeoId("https://vimeo.com/channels/staffpicks/123456789/")).toBe("123456789");
  });

  it("rejects non-vimeo hosts (including lookalikes)", () => {
    expect(vimeoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(vimeoId("https://notvimeo.com/123456789")).toBeNull();
    expect(vimeoId("https://vimeo.com.evil.com/123456789")).toBeNull();
    expect(vimeoId("https://evil.com/vimeo.com/123456789")).toBeNull();
  });

  it("rejects vimeo URLs without a numeric video id", () => {
    expect(vimeoId("https://vimeo.com/")).toBeNull();
    expect(vimeoId("https://vimeo.com/about")).toBeNull();
    expect(vimeoId("https://vimeo.com/channels/staffpicks")).toBeNull();
    expect(vimeoId("https://player.vimeo.com/video/")).toBeNull();
    expect(vimeoId("https://player.vimeo.com/video/abc")).toBeNull();
  });

  it("rejects garbage and empty input", () => {
    expect(vimeoId("not a url")).toBeNull();
    expect(vimeoId("")).toBeNull();
    expect(vimeoId("123456789")).toBeNull();
  });
});
