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
