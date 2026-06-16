import { describe, it, expect } from "vitest";
import { heading, spacingY, containerWidth, cardAspect, gridGap } from "../design-tokens";

describe("design-tokens helpers", () => {
  it("heading() returns the scale for a token and a sensible default", () => {
    expect(heading("xl")).toContain("text-4xl");
    expect(heading("md")).toContain("text-2xl");
    // unknown / null falls back to the standard header size
    expect(heading(null)).toBe(heading("md"));
    expect(heading("nonsense")).toBe(heading("md"));
  });

  it("every heading scale carries the unified line-height", () => {
    for (const t of ["sm", "md", "lg", "xl"]) {
      expect(heading(t)).toContain("leading-tight");
    }
  });

  it("containerWidth() maps tokens, defaulting to the site width", () => {
    expect(containerWidth("narrow")).toBe("max-w-3xl");
    expect(containerWidth("wide")).toBe("max-w-7xl");
    expect(containerWidth(undefined)).toBe(containerWidth("default"));
  });

  it("spacingY() and gridGap() return classes and default safely", () => {
    expect(spacingY("none")).toBe("");
    expect(spacingY(null)).toBe(spacingY("md"));
    expect(gridGap("lg")).toMatch(/gap-/);
    expect(gridGap(undefined)).toBe(gridGap("md"));
  });

  it("cardAspect() maps ratios and defaults to photo", () => {
    expect(cardAspect("square")).toMatch(/aspect-square|1\/1/);
    expect(cardAspect(undefined)).toBe(cardAspect("photo"));
  });
});
