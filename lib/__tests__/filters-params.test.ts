import { describe, expect, it } from "vitest";
import { parseFilterParams, toSearchParams } from "@/lib/filters/params";

const known = {
  tags: [
    { slug: "youth", category: "audience", label: { en: "Youth" } },
    { slug: "drought", category: "topic", label: { en: "Drought" } },
    { slug: "trauma", category: "impact", label: { en: "Trauma" } },
    { slug: "oceania-tag", category: "location", label: { en: "Oceania" } },
  ],
  communitySlugToRegion: { oceania: "oce", "sub-saharan-africa": "ssa" },
};

describe("filter URLs", () => {
  it("reads the shared vocabulary, dropping values that don't exist", () => {
    expect(parseFilterParams({ region: "oce,atlantis", communities: "youth,ghost", themes: "drought", when: "past-year", q: " heat " }, known)).toEqual({
      regions: ["oce"], communities: ["youth"], themes: ["drought"], when: "past-year", q: "heat",
    });
  });
  it("maps old links by the tag's kind and old region parameters to region codes", () => {
    expect(parseFilterParams({ tags: "youth,drought,oceania-tag", theme: "trauma", regions: "ssa", communities: "oceania" }, known)).toEqual({
      regions: ["ssa", "oce"], communities: ["youth"], themes: ["drought", "trauma"], when: null, q: "",
    });
  });
  it("ignores an unknown period", () => {
    expect(parseFilterParams({ when: "someday" }, known).when).toBeNull();
  });
  it("writes only what is set", () => {
    expect(toSearchParams({ regions: ["oce"], communities: [], themes: ["drought", "trauma"], when: null, q: "" }).toString()).toBe("region=oce&themes=drought%2Ctrauma");
  });
});
