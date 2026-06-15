import { describe, it, expect } from "vitest";
import { aggregateRegionData, FACETS, type FacetId } from "../region-facets";
import { REGION_CODES } from "../region-codes";

const zero = () =>
  Object.fromEntries(REGION_CODES.map((c) => [c, 0])) as Record<string, number>;

describe("aggregateRegionData", () => {
  it("returns a datum for every region, in canonical order", () => {
    const data = aggregateRegionData(zero(), "caseStudyCount");
    expect(data.map((d) => d.code)).toEqual([...REGION_CODES]);
  });

  it("all-zero counts give intensity 0 everywhere", () => {
    const data = aggregateRegionData(zero(), "caseStudyCount");
    expect(data.every((d) => d.intensity === 0 && d.value === 0)).toBe(true);
  });

  it("scales intensity to the max value (max → 1)", () => {
    const counts = zero();
    counts.OCEANIA = 5;
    counts.EUROPE_AND_NORTH_AMERICA = 10;
    const data = aggregateRegionData(counts, "memberCount");
    const oce = data.find((d) => d.code === "OCEANIA")!;
    const eur = data.find((d) => d.code === "EUROPE_AND_NORTH_AMERICA")!;
    expect(eur.intensity).toBe(1);
    expect(oce.intensity).toBeCloseTo(0.5);
  });

  it("exposes the three facets", () => {
    const ids = FACETS.map((f) => f.id).sort();
    expect(ids).toEqual(
      (["caseStudyCount", "memberCount", "newsCount"] as FacetId[]).sort()
    );
  });

  it("throws on an unknown facet", () => {
    expect(() => aggregateRegionData(zero(), "nope" as FacetId)).toThrow();
  });
});
