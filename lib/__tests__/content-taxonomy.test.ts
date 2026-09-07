import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
}));

vi.mock("@/lib/content/internal/payload-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
}));

import { query } from "@/lib/content/internal/sanity-source";
import { query as payloadQuery } from "@/lib/content/internal/payload-source";
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
const mockPayloadQuery = vi.mocked(payloadQuery);

beforeEach(() => {
  mockQuery.mockReset();
  mockPayloadQuery.mockReset();
  // Every `describe` above this file's two-backend section is the Sanity
  // contract, and `activeBackend()` reads the environment per call, so an
  // override left behind by the Payload section would silently redirect them.
  delete process.env.CONTENT_BACKEND_TAXONOMY;
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_TAXONOMY;
  vi.restoreAllMocks();
});

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

// ---------------------------------------------------------------------------
// The same contract, answered by Payload
//
// These are not new assertions. Each one is an assertion already made above
// against Sanity, made again against Payload — same call, same expected value,
// different store underneath. That is the whole claim the seam makes: a caller
// cannot tell which backend answered.
//
// What differs per backend is only the RAW ROW fed in, because the two stores
// genuinely store these documents differently, and a test that fed both the
// same row would be testing nothing. The three differences that matter here:
//
//   - `label` on workType/expertiseArea. Sanity stores an
//     `internationalizedArrayString` — `[{_key:"en", value:"…"}, …]`; Payload
//     stores a native localized field, which at `locale: "all"` reads back as
//     `{en:"…", …}`. `taxonomy.ts`'s `fromInternationalizedArray()` therefore
//     applies to the Sanity path ONLY, and applying it on the Payload path
//     would produce an empty label from a perfectly good row.
//   - Payload spells an unset locale out as `null` where a Sanity projection
//     omits the field entirely. Both must arrive as the same `Localized`.
//   - `image.asset->url` against `media.url`.
//
// Anything that is genuinely about HOW Sanity is queried — the GROQ text, the
// bound params — stays in the Sanity sections above. Those assertions are not
// portable and pretending they were would mean asserting a Payload reader
// against a GROQ string it does not have.
// ---------------------------------------------------------------------------

function onPayload(): void {
  process.env.CONTENT_BACKEND_TAXONOMY = "payload";
}

describe("the same contract, answered by Payload", () => {
  it("getTags returns the same ContentTag[] — value is a flat string in both stores", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [{ id: "t1", label: { en: "Anxiety", es: "Ansiedad" }, value: "anxiety", color: "#205596" }],
    });
    await expect(getTags()).resolves.toEqual([
      { id: "t1", label: { en: "Anxiety", es: "Ansiedad" }, value: "anxiety", color: "#205596" },
    ]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("getTags orders by label.en ascending, as `order(label.en asc)` does", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [
        { id: "c", label: { en: "Central & Southern Asia" }, value: "csa" },
        { id: "a", label: { en: "Adaptation" }, value: "adaptation" },
        { id: "b", label: { en: "Air Quality" }, value: "air-quality" },
      ],
    });
    const result = await getTags();
    expect(result.map((t) => t.label.en)).toEqual(["Adaptation", "Air Quality", "Central & Southern Asia"]);
  });

  it("getTags drops the explicit nulls Payload returns for unset locales", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [{ id: "t1", label: { en: "Anxiety", es: null, fr: null, ar: null }, value: "anxiety", color: null }],
    });
    await expect(getTags()).resolves.toEqual([
      { id: "t1", label: { en: "Anxiety" }, value: "anxiety", color: undefined },
    ]);
  });

  it("getTags returns [] when the source resolves nothing", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue(null);
    await expect(getTags()).resolves.toEqual([]);
  });

  it("getWorkTypes reads Payload's native localized label — NOT through fromInternationalizedArray", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [
        {
          id: "wt1",
          key: "RESEARCH",
          label: { en: "Research & Analysis", ar: "البحث والتحليل" },
        },
      ],
    });
    await expect(getWorkTypes()).resolves.toEqual([
      { id: "wt1", value: "RESEARCH", label: { en: "Research & Analysis", ar: "البحث والتحليل" } },
    ]);
  });

  it("getWorkTypes returns an empty Localized object when label is missing", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({ docs: [{ id: "wt2", key: "POLICY", label: undefined }] });
    await expect(getWorkTypes()).resolves.toEqual([{ id: "wt2", value: "POLICY", label: {} }]);
  });

  it("getWorkTypes returns [] when the source resolves nothing", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue(null);
    await expect(getWorkTypes()).resolves.toEqual([]);
  });

  it("getExpertiseAreas converts the label the same way as getWorkTypes", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [{ id: "ea1", key: "CLIMATE_CHANGE", label: { en: "Climate Change" } }],
    });
    await expect(getExpertiseAreas()).resolves.toEqual([
      { id: "ea1", value: "CLIMATE_CHANGE", label: { en: "Climate Change" } },
    ]);
  });

  it("getAuthors maps rows, dropping null optional fields to undefined", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [
        {
          id: "a1",
          name: "Ada Lovelace",
          slug: "ada-lovelace",
          image: { asset: { url: "https://cdn.example.com/ada.jpg" } },
          organizationalAffiliation: "Analytical Engines Ltd",
          userId: "user_123",
        },
        { id: "a2", name: "Anonymous", slug: null, image: { asset: null }, organizationalAffiliation: null, userId: null },
      ],
    });
    await expect(getAuthors()).resolves.toEqual([
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

  it("getAuthors returns [] when the source resolves nothing", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue(null);
    await expect(getAuthors()).resolves.toEqual([]);
  });

  it("getAuthorBySanityId returns the mapped author, addressed by Sanity's preserved id", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({ id: "a1", name: "Ada Lovelace", slug: "ada-lovelace" });
    await expect(getAuthorBySanityId("a1")).resolves.toEqual({
      id: "a1",
      name: "Ada Lovelace",
      slug: "ada-lovelace",
      imageUrl: undefined,
      organizationalAffiliation: undefined,
      userId: undefined,
    });
    expect(mockPayloadQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: "findByID", collection: "authors", id: "a1" }),
    );
  });

  it("getAuthorBySanityId returns null when no author matches the id", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue(null);
    await expect(getAuthorBySanityId("does-not-exist")).resolves.toBeNull();
  });

  it("getOrganizations keeps name a plain string and description Localized", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [
        {
          id: "o1",
          name: "World Health Organization",
          slug: "who",
          acronym: "WHO",
          type: "international",
          description: { en: "A UN specialized agency.", es: null, fr: null, ar: null },
          logo: { asset: { url: "https://cdn.example.com/who.png" } },
          website: "https://who.int",
        },
      ],
    });
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

  it("getOrganizations reports an all-null description as undefined, the way an unset Sanity field projects", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [{ id: "o2", name: "Stub Org", slug: "stub", type: "other", description: { en: null }, logo: { asset: null } }],
    });
    const [org] = await getOrganizations();
    expect(org.description).toBeUndefined();
    expect(org.logoUrl).toBeUndefined();
  });

  it("getOrganizations returns [] when the source resolves nothing", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue(null);
    await expect(getOrganizations()).resolves.toEqual([]);
  });

  it("reads through the Payload source only — the Sanity source is never touched", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({ docs: [] });
    await Promise.all([getTags(), getWorkTypes(), getExpertiseAreas(), getAuthors(), getOrganizations()]);
    expect(mockPayloadQuery).toHaveBeenCalledTimes(5);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
