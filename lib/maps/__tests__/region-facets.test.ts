import { describe, it, expect } from "vitest";
import { aggregateRegionData, atlasDestination, FACETS, FALLBACK_THEMES, parseLayers, type FacetId } from "../region-facets";
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
    counts.oce = 5;
    counts.enam = 10;
    const data = aggregateRegionData(counts, "memberCount");
    const oce = data.find((d) => d.code === "oce")!;
    const eur = data.find((d) => d.code === "enam")!;
    expect(eur.intensity).toBe(1);
    expect(oce.intensity).toBeCloseTo(0.5);
  });

  it("exposes the content facets", () => {
    const ids = FACETS.map((f) => f.id).sort();
    expect(ids).toEqual(
      ([
        "caseStudyCount",
        "livedExpCount",
        "memberCount",
        "newsCount",
        "researchOutputCount",
      ] as FacetId[]).sort()
    );
  });

  it("throws on an unknown facet", () => {
    expect(() => aggregateRegionData(zero(), "nope" as FacetId)).toThrow();
  });
});

describe("themes + destinations", () => {
  it("defines the four fallback theme slugs", () => {
    expect(FALLBACK_THEMES.map((t) => t.slug)).toEqual(["displacement", "livelihoods", "youth", "indigenous"]);
  });
  it("gives every fallback theme a label in all 4 locales", () => {
    for (const theme of FALLBACK_THEMES) {
      expect(theme.label.en).toBeTruthy();
      expect(theme.label.es).toBeTruthy();
      expect(theme.label.fr).toBeTruthy();
      expect(theme.label.ar).toBeTruthy();
    }
  });
  it("routes each facet to its listing", () => {
    expect(atlasDestination("caseStudyCount", "sub-saharan-africa"))
      .toBe("/research-and-action/case-studies?communities=sub-saharan-africa");
    expect(atlasDestination("livedExpCount", "oceania")).toBe("/lived-experiences?regions=oceania");
  });
});

describe("parseLayers", () => {
  it("defaults to caseStudyCount when null", () => {
    expect(parseLayers(null)).toEqual(["caseStudyCount"]);
  });

  it("defaults to caseStudyCount when empty string", () => {
    expect(parseLayers("")).toEqual(["caseStudyCount"]);
  });

  it("parses a comma list of valid facet ids", () => {
    expect(parseLayers("caseStudyCount,livedExpCount")).toEqual(["caseStudyCount", "livedExpCount"]);
  });

  it("dedupes repeated ids", () => {
    expect(parseLayers("caseStudyCount,caseStudyCount,livedExpCount")).toEqual([
      "caseStudyCount",
      "livedExpCount",
    ]);
  });

  it("drops invalid/unknown ids", () => {
    expect(parseLayers("caseStudyCount,nope,livedExpCount")).toEqual(["caseStudyCount", "livedExpCount"]);
  });

  it("falls back to the default when every id is invalid", () => {
    expect(parseLayers("nope,alsoNope")).toEqual(["caseStudyCount"]);
  });

  it("never returns an empty array", () => {
    expect(parseLayers(",,,")).toEqual(["caseStudyCount"]);
  });

  it("caps at 6 facets (all defined facets fit)", () => {
    const all = FACETS.map((f) => f.id).join(",");
    expect(parseLayers(all)).toHaveLength(FACETS.length);
  });

  it("trims whitespace around ids", () => {
    expect(parseLayers(" caseStudyCount , livedExpCount ")).toEqual(["caseStudyCount", "livedExpCount"]);
  });
});

describe("legacy layer aliases (agendas/reports merge)", () => {
  it("maps old agendaCount/reportCount bookmarks to researchOutputCount", async () => {
    const { parseLayers } = await import("../region-facets");
    expect(parseLayers("agendaCount")).toEqual(["researchOutputCount"]);
    expect(parseLayers("reportCount,caseStudyCount")).toEqual(["researchOutputCount", "caseStudyCount"]);
  });
});
