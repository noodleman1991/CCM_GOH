import { describe, it, expect, vi } from "vitest";

// getBackgroundStyles imports urlFor (Sanity) for image backgrounds, which pulls
// in env config at import time. The non-image cases under test don't use it, so
// stub it out.
vi.mock("@/sanity/lib/image", () => ({
  urlFor: () => ({ url: () => "https://cdn.sanity.io/x.jpg" }),
}));

import { getBackgroundStyles } from "../background-utils";

describe("getBackgroundStyles", () => {
  it("returns empty for none / undefined", () => {
    expect(getBackgroundStyles()).toEqual({});
    expect(getBackgroundStyles(null)).toEqual({});
    expect(getBackgroundStyles({ type: "none" })).toEqual({});
  });

  it("maps a CCM palette colour to its hex", () => {
    expect(getBackgroundStyles({ type: "ccm-palette", ccmColor: "ccm-sea" }).style?.backgroundColor).toBe("#205596");
    expect(getBackgroundStyles({ type: "ccm-palette", ccmColor: "ccm-sky" }).style?.backgroundColor).toBe("#9BC6DA");
  });

  it("uses a custom hex colour as-is", () => {
    expect(getBackgroundStyles({ type: "color", color: "#abcdef" }).style?.backgroundColor).toBe("#abcdef");
  });

  it("builds a linear gradient from start/end colours", () => {
    const out = getBackgroundStyles({
      type: "gradient",
      gradient: { direction: "to-r", startColor: "#000000", endColor: "#ffffff" },
    });
    const bg = String(out.style?.background || out.style?.backgroundImage || "");
    expect(bg).toContain("#000000");
    expect(bg).toContain("#ffffff");
  });

  it("returns empty when a typed background is missing its required value", () => {
    expect(getBackgroundStyles({ type: "ccm-palette" })).toEqual({});
    expect(getBackgroundStyles({ type: "color" })).toEqual({});
  });
});
