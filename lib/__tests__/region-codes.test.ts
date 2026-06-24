import { describe, it, expect } from "vitest";
import {
  REGION_CODES,
  REGION_SHORT_CODES,
  LEGACY_LONG_TO_SHORT,
  isRegionCode,
  isRegionShortCode,
  slugToShortCode,
} from "@/lib/maps/region-codes";

describe("region short codes (Phase 6 — now canonical)", () => {
  it("has the fixed 7 spec codes", () => {
    expect([...REGION_CODES].sort()).toEqual(["csa", "enam", "esea", "lac", "nawa", "oce", "ssa"]);
  });

  it("REGION_SHORT_CODES is an alias of REGION_CODES", () => {
    expect(REGION_SHORT_CODES).toBe(REGION_CODES);
  });

  it("LEGACY_LONG_TO_SHORT maps every old long value to a valid short code", () => {
    for (const short of Object.values(LEGACY_LONG_TO_SHORT)) {
      expect(isRegionCode(short)).toBe(true);
    }
    expect(LEGACY_LONG_TO_SHORT.SUB_SAHARAN_AFRICA).toBe("ssa");
    expect(LEGACY_LONG_TO_SHORT.EUROPE_AND_NORTH_AMERICA).toBe("enam");
  });

  it("maps RC slugs to short codes", () => {
    expect(slugToShortCode("sub-saharan-africa")).toBe("ssa");
    expect(slugToShortCode("europe-and-northern-america")).toBe("enam");
    expect(slugToShortCode("oceania")).toBe("oce");
    expect(slugToShortCode("not-a-slug")).toBeNull();
  });

  it("isRegionCode / isRegionShortCode accept codes and reject the old long values", () => {
    expect(isRegionCode("ssa")).toBe(true);
    expect(isRegionShortCode("ssa")).toBe(true);
    expect(isRegionCode("SUB_SAHARAN_AFRICA")).toBe(false);
    expect(isRegionCode("xx")).toBe(false);
  });
});
