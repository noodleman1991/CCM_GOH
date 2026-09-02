import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
}));

import { query } from "@/lib/content/internal/sanity-source";
import {
  getAuthorBySanityId,
  getAuthors,
  getExpertiseAreas,
  getOrganizations,
  getTags,
  getWorkTypes,
} from "@/lib/content/taxonomy";
import { REGION_OPTIONS, THEME_OPTIONS, POPULATION_OPTIONS, topicOptions } from "@/lib/content/taxonomy-options";

const mockQuery = vi.mocked(query);

beforeEach(() => {
  mockQuery.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("getTags", () => {
  it("maps tag rows through the shared toTag normalizer", async () => {
    mockQuery.mockResolvedValue([
      { _id: "t1", label: { en: "Anxiety", es: "Ansiedad" }, value: "anxiety", color: "#205596" },
    ]);
    await expect(getTags()).resolves.toEqual([
      { id: "t1", label: { en: "Anxiety", es: "Ansiedad" }, value: "anxiety", color: "#205596" },
    ]);
  });

  it("returns [] when the source resolves nothing", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getTags()).resolves.toEqual([]);
  });
});

describe("getWorkTypes", () => {
  it("converts the internationalizedArrayString label to a flat Localized object, and key to value", async () => {
    mockQuery.mockResolvedValue([
      {
        _id: "wt1",
        key: "RESEARCH",
        label: [
          { _key: "en", value: "Research & Analysis" },
          { _key: "ar", value: "البحث والتحليل" },
        ],
      },
    ]);
    await expect(getWorkTypes()).resolves.toEqual([
      {
        id: "wt1",
        value: "RESEARCH",
        label: { en: "Research & Analysis", ar: "البحث والتحليل" },
      },
    ]);
  });

  it("returns an empty Localized object when label is missing", async () => {
    mockQuery.mockResolvedValue([{ _id: "wt2", key: "POLICY", label: undefined }]);
    await expect(getWorkTypes()).resolves.toEqual([{ id: "wt2", value: "POLICY", label: {} }]);
  });

  it("returns [] when the source resolves nothing", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getWorkTypes()).resolves.toEqual([]);
  });
});

describe("getExpertiseAreas", () => {
  it("converts the internationalizedArrayString label the same way as getWorkTypes", async () => {
    mockQuery.mockResolvedValue([
      {
        _id: "ea1",
        key: "CLIMATE_CHANGE",
        label: [{ _key: "en", value: "Climate Change" }],
      },
    ]);
    await expect(getExpertiseAreas()).resolves.toEqual([
      { id: "ea1", value: "CLIMATE_CHANGE", label: { en: "Climate Change" } },
    ]);
  });
});

describe("getAuthors", () => {
  it("maps author rows, dropping null optional fields to undefined", async () => {
    mockQuery.mockResolvedValue([
      {
        _id: "a1",
        name: "Ada Lovelace",
        slug: "ada-lovelace",
        imageUrl: "https://cdn.example.com/ada.jpg",
        organizationalAffiliation: "Analytical Engines Ltd",
        userId: "user_123",
      },
      { _id: "a2", name: "Anonymous", slug: null, imageUrl: null, organizationalAffiliation: null, userId: null },
    ]);
    const result = await getAuthors();
    expect(result).toEqual([
      {
        id: "a1",
        name: "Ada Lovelace",
        slug: "ada-lovelace",
        imageUrl: "https://cdn.example.com/ada.jpg",
        organizationalAffiliation: "Analytical Engines Ltd",
        userId: "user_123",
      },
      { id: "a2", name: "Anonymous", slug: undefined, imageUrl: undefined, organizationalAffiliation: undefined, userId: undefined },
    ]);
  });

  it("returns [] when the source resolves nothing", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getAuthors()).resolves.toEqual([]);
  });
});

describe("getAuthorBySanityId", () => {
  it("returns the mapped author when found", async () => {
    mockQuery.mockResolvedValue({ _id: "a1", name: "Ada Lovelace", slug: "ada-lovelace" });
    await expect(getAuthorBySanityId("a1")).resolves.toEqual({
      id: "a1",
      name: "Ada Lovelace",
      slug: "ada-lovelace",
      imageUrl: undefined,
      organizationalAffiliation: undefined,
      userId: undefined,
    });
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { id: "a1" });
  });

  it("returns null when no author matches the id", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getAuthorBySanityId("does-not-exist")).resolves.toBeNull();
  });
});

describe("getOrganizations", () => {
  it("maps organization rows, keeping name as a plain string (not Localized)", async () => {
    mockQuery.mockResolvedValue([
      {
        _id: "o1",
        name: "World Health Organization",
        slug: "who",
        acronym: "WHO",
        type: "international",
        description: { en: "A UN specialized agency." },
        logoUrl: "https://cdn.example.com/who.png",
        website: "https://who.int",
      },
    ]);
    await expect(getOrganizations()).resolves.toEqual([
      {
        id: "o1",
        name: "World Health Organization",
        slug: "who",
        acronym: "WHO",
        type: "international",
        description: { en: "A UN specialized agency." },
        logoUrl: "https://cdn.example.com/who.png",
        website: "https://who.int",
      },
    ]);
  });

  it("returns [] when the source resolves nothing", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getOrganizations()).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Static taxonomy option lists (lib/content/taxonomy-options.ts), moved
// verbatim from sanity/schemas/shared/{topic,taxonomy}-options.ts and now the
// single definition both the Studio schemas and these frontend components
// import — no CMS access, so pinned here rather than in
// content-sanity-source.test.ts. `value`s are stored on documents: this test
// exists to catch an accidental value/order change, not just a missing one.
// ---------------------------------------------------------------------------

describe("taxonomy-options (static, shared with the Sanity schemas)", () => {
  it("topicOptions is the exact, ordered vocabulary stored on caseStudy.topic", () => {
    expect(topicOptions).toEqual([
      { title: "Climate Change & Environment", value: "climate-environment" },
      { title: "Mental Health & Wellbeing", value: "mental-health" },
      { title: "Community Health & Social Care", value: "community-health" },
      { title: "Youth Engagement & Education", value: "youth-education" },
      { title: "Policy Research & Governance", value: "policy-governance" },
      { title: "Technology & Innovation", value: "technology-innovation" },
      { title: "Economic Development", value: "economic-development" },
      { title: "Cultural Heritage & Arts", value: "cultural-arts" },
      { title: "Food Security & Agriculture", value: "food-agriculture" },
      { title: "Urban Planning & Infrastructure", value: "urban-planning" },
      { title: "Human Rights & Social Justice", value: "human-rights" },
      { title: "Migration & Displacement", value: "migration" },
      { title: "Gender Equality", value: "gender-equality" },
      { title: "Disaster Risk & Resilience", value: "disaster-resilience" },
      { title: "Digital Inclusion", value: "digital-inclusion" },
      { title: "Other", value: "other" },
    ]);
  });

  it("REGION_OPTIONS is the exact, ordered vocabulary stored on region fields", () => {
    expect(REGION_OPTIONS).toEqual([
      { title: "Sub-Saharan Africa", value: "ssa" },
      { title: "Northern Africa & Western Asia", value: "nawa" },
      { title: "Central & Southern Asia", value: "csa" },
      { title: "Eastern & South-Eastern Asia", value: "esea" },
      { title: "Latin America & the Caribbean", value: "lac" },
      { title: "Oceania", value: "oce" },
      { title: "Europe & Northern America", value: "enam" },
    ]);
  });

  it("THEME_OPTIONS is the exact, ordered vocabulary stored on themes fields", () => {
    expect(THEME_OPTIONS).toEqual([
      { title: "Displacement", value: "displacement" },
      { title: "Livelihoods", value: "livelihoods" },
      { title: "Youth", value: "youth" },
      { title: "Indigenous", value: "indigenous" },
    ]);
  });

  it("POPULATION_OPTIONS is the exact, ordered vocabulary stored on populations fields", () => {
    expect(POPULATION_OPTIONS).toEqual([
      { title: "Children & youth", value: "youth" },
      { title: "Women", value: "women" },
      { title: "Indigenous peoples", value: "indigenous" },
      { title: "Farmers & rural livelihoods", value: "farmers" },
      { title: "Displaced & migrants", value: "displaced" },
    ]);
  });
});
