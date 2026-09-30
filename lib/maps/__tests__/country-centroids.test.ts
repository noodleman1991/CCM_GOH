import { describe, expect, it } from "vitest";
import { countryCentroid } from "@/lib/maps/country-geometry";
import { REGION_MEMBERSHIP } from "@/lib/maps/iso-to-region";

describe("country map positions", () => {
  it("gives every country the hub recognises a place on the map (small island states included)", () => {
    const codes = Object.keys(REGION_MEMBERSHIP);
    expect(codes.length).toBeGreaterThan(190);
    const missing = codes.filter((c) => !countryCentroid(c));
    expect(missing).toEqual([]);
  });
  it("puts Barbados in the Caribbean, east of the other Windward Islands", () => {
    const brb = countryCentroid("BRB")!;
    const lca = countryCentroid("LCA")!;
    expect(brb.x).toBeGreaterThan(lca.x);
  });
});
