import { describe, expect, it } from "vitest";
import { mixHex } from "@/lib/mix-hex";

describe("mixHex", () => {
  it("matches color-mix(in srgb) endpoints and midpoint", () => {
    expect(mixHex("#ffffff", "#000000", 1)).toBe("rgb(255, 255, 255)");
    expect(mixHex("#ffffff", "#000000", 0)).toBe("rgb(0, 0, 0)");
    expect(mixHex("#ff0000", "#0000ff", 0.5)).toBe("rgb(128, 0, 128)");
  });
  it("never emits color-mix() and passes non-hex through", () => {
    expect(mixHex("#4186C3", "#ffffff", 0.2)).not.toContain("color-mix");
    expect(mixHex("var(--x)", "#ffffff", 0.2)).toBe("var(--x)");
  });
});
