import { describe, expect, it } from "vitest";
import { edgeFadeStyle } from "@/hooks/use-edge-fade";

describe("chip-row edge fade", () => {
  it("is off when every chip fits", () => {
    expect(edgeFadeStyle({ start: false, end: false, rtl: false })).toBeUndefined();
  });
  it("fades only the end while more chips wait there", () => {
    expect(edgeFadeStyle({ start: false, end: true, rtl: false })?.maskImage).toBe("linear-gradient(to right, #000, #000 0px, #000 calc(100% - 22px), transparent)");
  });
  it("fades the start once scrolled, and runs right-to-left in Arabic", () => {
    expect(edgeFadeStyle({ start: true, end: false, rtl: true })?.maskImage).toBe("linear-gradient(to left, transparent, #000 22px, #000 calc(100% - 0px), #000)");
  });
});
