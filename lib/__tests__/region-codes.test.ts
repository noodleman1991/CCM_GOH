import { describe, it, expect } from "vitest";
import {
  REGION_SHORT_CODES,
  LONG_TO_SHORT,
  SHORT_TO_LONG,
  isRegionShortCode,
  slugToShortCode,
  REGION_CODES,
} from "@/lib/maps/region-codes";

describe("region short codes (Phase 6)", () => {
  it("has the fixed 7 spec codes", () => {
    expect([...REGION_SHORT_CODES].sort()).toEqual(["csa", "enam", "esea", "lac", "nawa", "oce", "ssa"]);
  });

  it("LONG_TO_SHORT covers every long region code", () => {
    for (const long of REGION_CODES) {
      expect(LONG_TO_SHORT[long]).toBeDefined();
      expect(isRegionShortCode(LONG_TO_SHORT[long])).toBe(true);
    }
  });

  it("SHORT_TO_LONG round-trips", () => {
    for (const long of REGION_CODES) {
      expect(SHORT_TO_LONG[LONG_TO_SHORT[long]]).toBe(long);
    }
  });

  it("maps RC slugs to short codes", () => {
    expect(slugToShortCode("sub-saharan-africa")).toBe("ssa");
    expect(slugToShortCode("europe-and-northern-america")).toBe("enam");
    expect(slugToShortCode("oceania")).toBe("oce");
    expect(slugToShortCode("not-a-slug")).toBeNull();
  });

  it("isRegionShortCode rejects non-codes", () => {
    expect(isRegionShortCode("ssa")).toBe(true);
    expect(isRegionShortCode("SUB_SAHARAN_AFRICA")).toBe(false);
    expect(isRegionShortCode("xx")).toBe(false);
  });
});
