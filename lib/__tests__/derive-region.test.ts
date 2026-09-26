import { describe, expect, it } from "vitest";
import { deriveRegion } from "@/lib/case-studies/derive-region";

describe("deriveRegion", () => {
  it("prefers the community's region", () => {
    expect(deriveRegion({ communityRegion: "ssa", countryCode3: "FRA" })).toBe("ssa");
  });
  it("falls back to the country's region", () => {
    expect(deriveRegion({ countryCode3: "NGA" })).toBe("ssa");
  });
  it("is empty when nothing is known", () => {
    expect(deriveRegion({})).toBeNull();
    expect(deriveRegion({ communityRegion: "not-a-region" })).toBeNull();
  });
});
