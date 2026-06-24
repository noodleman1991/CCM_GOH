import { describe, it, expect } from "vitest";
import { isoToRegion, REGION_MEMBERSHIP } from "../iso-to-region";
import { REGION_CODES } from "../region-codes";

describe("isoToRegion", () => {
  it("maps representative countries to the right region", () => {
    expect(isoToRegion("KEN")).toBe("ssa");
    expect(isoToRegion("EGY")).toBe("nawa");
    expect(isoToRegion("IND")).toBe("csa");
    expect(isoToRegion("JPN")).toBe("esea");
    expect(isoToRegion("BRA")).toBe("lac");
    expect(isoToRegion("AUS")).toBe("oce");
    expect(isoToRegion("FRA")).toBe("enam");
    expect(isoToRegion("USA")).toBe("enam");
  });

  it("returns null for unknown / non-country codes", () => {
    expect(isoToRegion("ZZZ")).toBeNull();
    expect(isoToRegion("ATA")).toBeNull(); // Antarctica — not in any SDG region
  });

  it("assigns every membership entry to a known region code", () => {
    for (const code of Object.values(REGION_MEMBERSHIP)) {
      expect(REGION_CODES).toContain(code);
    }
  });

  it("never assigns a country to two regions", () => {
    const seen = new Set<string>();
    for (const iso of Object.keys(REGION_MEMBERSHIP)) {
      expect(seen.has(iso)).toBe(false);
      seen.add(iso);
    }
  });

  it("has at least one country in every region", () => {
    const regions = new Set(Object.values(REGION_MEMBERSHIP));
    for (const code of REGION_CODES) {
      expect(regions.has(code)).toBe(true);
    }
  });
});
