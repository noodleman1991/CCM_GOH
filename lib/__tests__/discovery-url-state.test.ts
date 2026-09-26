import { describe, it, expect } from "vitest";
import { getDiscoveryConfig } from "../discovery/registry";
import {
  emptyState,
  parseDiscoveryState,
  serializeDiscoveryState,
  toggleFacetValue,
  hasActiveFilters,
} from "../discovery/url-state";

const cfg = getDiscoveryConfig("caseStudy");

describe("discovery url-state", () => {
  it("emptyState uses the config default sort and no filters", () => {
    const s = emptyState(cfg);
    expect(s.sort).toBe("newest");
    expect(s.timeFrame).toBe("any");
    expect(hasActiveFilters(cfg, s)).toBe(false);
  });

  it("round-trips through serialize/parse", () => {
    let s = emptyState(cfg);
    s.q = "climate";
    s.sort = "oldest";
    s.timeFrame = "year";
    s = toggleFacetValue(s, "region", "europe-and-northern-america", true);
    s = toggleFacetValue(s, "tags", "grief", true);

    const params = serializeDiscoveryState(cfg, s);
    const back = parseDiscoveryState(cfg, new URLSearchParams(params.toString()));

    expect(back.q).toBe("climate");
    expect(back.sort).toBe("oldest");
    expect(back.timeFrame).toBe("year");
    expect(back.facets.region).toEqual(["europe-and-northern-america"]);
    expect(back.facets.tags).toEqual(["grief"]);
  });

  it("omits default sort and 'any' time-frame from the URL", () => {
    const s = emptyState(cfg);
    const params = serializeDiscoveryState(cfg, s);
    expect(params.toString()).toBe("");
  });

  it("toggleFacetValue adds then removes", () => {
    let s = emptyState(cfg);
    s = toggleFacetValue(s, "region", "oceania", true);
    expect(s.facets.region).toEqual(["oceania"]);
    s = toggleFacetValue(s, "region", "oceania", true);
    expect(s.facets.region).toEqual([]);
  });

  it("single-select replaces instead of accumulating", () => {
    let s = emptyState(cfg);
    s = toggleFacetValue(s, "region", "a", false);
    s = toggleFacetValue(s, "region", "b", false);
    expect(s.facets.region).toEqual(["b"]);
  });

  it("hasActiveFilters detects query, time-frame, and facets", () => {
    expect(hasActiveFilters(cfg, { ...emptyState(cfg), q: "x" })).toBe(true);
    expect(hasActiveFilters(cfg, { ...emptyState(cfg), timeFrame: "year" })).toBe(true);
    expect(hasActiveFilters(cfg, toggleFacetValue(emptyState(cfg), "tags", "t", true))).toBe(true);
  });
});
