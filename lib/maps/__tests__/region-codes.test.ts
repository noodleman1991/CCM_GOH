import { describe, it, expect } from "vitest";
import {
  REGION_CODES,
  RC_SLUG_TO_REGION,
  REGION_TO_RC_SLUG,
  isRegionCode,
} from "../region-codes";

describe("region-codes", () => {
  it("REGION_TO_RC_SLUG is the exact inverse of RC_SLUG_TO_REGION", () => {
    for (const [slug, code] of Object.entries(RC_SLUG_TO_REGION)) {
      expect(REGION_TO_RC_SLUG[code]).toBe(slug);
    }
  });

  it("every region code has a slug and vice versa (round-trip)", () => {
    for (const code of REGION_CODES) {
      const slug = REGION_TO_RC_SLUG[code];
      expect(slug).toBeTruthy();
      expect(RC_SLUG_TO_REGION[slug]).toBe(code);
    }
  });

  it("isRegionCode validates membership", () => {
    expect(isRegionCode("ssa")).toBe(true);
    expect(isRegionCode("NOT_A_REGION")).toBe(false);
  });
});
