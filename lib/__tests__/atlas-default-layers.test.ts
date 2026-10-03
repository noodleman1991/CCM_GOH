import { describe, expect, it } from "vitest";
import { DEFAULT_LAYERS, FACETS, parseLayers } from "@/lib/maps/region-facets";

/**
 * The Atlas opens on every content type at once, not on case studies alone;
 * the member layer stays off because members have no pins.
 */
describe("atlas default layers", () => {
  it("opens on all five content types, events included", () => {
    expect(parseLayers(null)).toEqual(["caseStudyCount", "livedExpCount", "newsCount", "researchOutputCount", "eventCount"]);
    expect(DEFAULT_LAYERS).not.toContain("memberCount");
  });

  it("covers every facet except members", () => {
    const contentFacets = FACETS.map((f) => f.id).filter((id) => id !== "memberCount");
    expect([...DEFAULT_LAYERS].sort()).toEqual([...contentFacets].sort());
  });

  it("still honours an explicit selection", () => {
    expect(parseLayers("livedExpCount")).toEqual(["livedExpCount"]);
  });
});
