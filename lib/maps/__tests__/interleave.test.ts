import { describe, expect, it } from "vitest";
import { interleaveByType } from "@/lib/maps/interleave";

const item = (type: string, date: string) => ({ type, date });

describe("interleaveByType", () => {
  it("shows every type in the first pass instead of only the newest one", () => {
    const merged = interleaveByType(
      [
        [item("caseStudy", "2026-01-01"), item("caseStudy", "2025-12-01")],
        [item("livedExperience", "2026-09-01"), item("livedExperience", "2026-08-01"), item("livedExperience", "2026-07-01")],
        [item("researchOutput", "2026-05-01")],
      ],
      6,
    );
    expect(merged.slice(0, 3).map((i) => i.type)).toEqual(["livedExperience", "researchOutput", "caseStudy"]);
    expect(new Set(merged.map((i) => i.type)).size).toBe(3);
  });

  it("honours the limit and drains what is left when a type runs out", () => {
    const merged = interleaveByType([[item("a", "2026-02-01")], [item("b", "2026-03-01"), item("b", "2026-01-01")]], 3);
    expect(merged.map((i) => i.type)).toEqual(["b", "a", "b"]);
    expect(interleaveByType([[item("a", "2026-01-01")], []], 10)).toHaveLength(1);
    expect(interleaveByType([], 6)).toEqual([]);
  });

  it("leaves a single type in its own order", () => {
    const one = [item("a", "2026-03-01"), item("a", "2026-02-01")];
    expect(interleaveByType([one], 5)).toEqual(one);
  });
});

import { DEFAULT_LAYERS, nextLayers } from "@/lib/maps/region-facets";

describe("nextLayers", () => {
  it("focuses one type when everything is on, instead of removing it", () => {
    expect(nextLayers([...DEFAULT_LAYERS], "livedExpCount")).toEqual(["livedExpCount"]);
  });

  it("adds and removes once the reader has narrowed", () => {
    expect(nextLayers(["livedExpCount"], "newsCount")).toEqual(["livedExpCount", "newsCount"]);
    expect(nextLayers(["livedExpCount", "newsCount"], "newsCount")).toEqual(["livedExpCount"]);
  });

  it("returns to everything rather than an empty map", () => {
    expect(nextLayers(["livedExpCount"], "livedExpCount")).toEqual([...DEFAULT_LAYERS]);
  });
});
