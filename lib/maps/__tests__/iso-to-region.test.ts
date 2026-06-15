import { describe, it, expect } from "vitest";
import { isoToRegion, REGION_MEMBERSHIP } from "../iso-to-region";
import { REGION_CODES } from "../region-codes";

describe("isoToRegion", () => {
  it("maps representative countries to the right region", () => {
    expect(isoToRegion("KEN")).toBe("SUB_SAHARAN_AFRICA");
    expect(isoToRegion("EGY")).toBe("NORTHERN_AFRICA_AND_WESTERN_ASIA");
    expect(isoToRegion("IND")).toBe("CENTRAL_AND_SOUTHERN_ASIA");
    expect(isoToRegion("JPN")).toBe("EASTERN_AND_SOUTH_EASTERN_ASIA");
    expect(isoToRegion("BRA")).toBe("LATIN_AMERICA_AND_THE_CARIBBEAN");
    expect(isoToRegion("AUS")).toBe("OCEANIA");
    expect(isoToRegion("FRA")).toBe("EUROPE_AND_NORTH_AMERICA");
    expect(isoToRegion("USA")).toBe("EUROPE_AND_NORTH_AMERICA");
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
