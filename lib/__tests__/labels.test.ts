import { describe, it, expect } from "vitest";
import {
  regionLabel,
  specialCommunityLabel,
  workTypeLabel,
  expertiseLabel,
  humanize,
} from "../labels";

// A fake translator that just echoes the key (so we can assert which key was used).
const t = (key: string) => `[${key}]`;

describe("humanize", () => {
  it("turns slugs/enums into Title Case, never raw", () => {
    expect(humanize("climate-grief")).toBe("Climate Grief");
    expect(humanize("SUB_SAHARAN_AFRICA")).toBe("Sub Saharan Africa");
    expect(humanize("eco-anxiety")).toBe("Eco Anxiety");
  });
});

describe("regionLabel", () => {
  it("resolves a known region code via the i18n key", () => {
    expect(regionLabel(t, "SUB_SAHARAN_AFRICA")).toBe("[subSaharanAfrica]");
  });
  it("humanizes an unknown value instead of showing raw caps", () => {
    expect(regionLabel(t, "SOME_OTHER")).toBe("Some Other");
  });
  it("empty for nullish", () => {
    expect(regionLabel(t, null)).toBe("");
    expect(regionLabel(t, undefined)).toBe("");
  });
});

describe("specialCommunityLabel", () => {
  it("maps known special communities to keys", () => {
    expect(specialCommunityLabel(t, "YOUTH")).toBe("[youth]");
    expect(specialCommunityLabel(t, "FARMER_AND_FISHER")).toBe("[farmerAndFisher]");
  });
  it("humanizes unknowns", () => {
    expect(specialCommunityLabel(t, "ELDERS_GROUP")).toBe("Elders Group");
  });
});

describe("workTypeLabel / expertiseLabel", () => {
  it("maps enums to keys", () => {
    expect(workTypeLabel(t, "LIVED_EXPERIENCE_EXPERT")).toBe("[livedExperience]");
    expect(expertiseLabel(t, "MENTAL_HEALTH")).toBe("[mentalHealth]");
  });
  it("humanizes unmapped enums", () => {
    expect(workTypeLabel(t, "CONSULTING")).toBe("Consulting");
  });
});
