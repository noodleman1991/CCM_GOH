import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryRaw: vi.fn(),
  uploadFileAsset: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

import { query } from "@/lib/content/internal/sanity-source";
import {
  getFeaturedNews,
  getRegularNews,
  getAllNews,
  getNewsPostBySlug,
  getNewsSlugs,
  getRelatedNews,
  getNewsTags,
  getRegionalCommunities,
  getApprovedExternalSources,
  getNewsPosts,
  getDynamicNews,
  getNewsOgData,
  getPublishedNewsIndexDocs,
  getNewsIndexDocsByIds,
  getNewsIndexDocById,
  getPublishedNewsCount,
  getNewsSearchRecords,
} from "@/lib/content/news";

const mockQuery = vi.mocked(query);

beforeEach(() => {
  mockQuery.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("getFeaturedNews", () => {
  it("returns featured news posts from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "n1", title: { en: "Featured" } }]);
    await expect(getFeaturedNews(3)).resolves.toEqual([{ _id: "n1", title: { en: "Featured" } }]);
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getFeaturedNews(3)).rejects.toThrow("upstream 500");
  });
});

describe("getRegularNews", () => {
  it("returns regular news posts and defaults filters when none are given", async () => {
    mockQuery.mockResolvedValue([{ _id: "n1", title: { en: "Regular" } }]);
    const result = await getRegularNews();
    expect(result).toEqual([{ _id: "n1", title: { en: "Regular" } }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), {});
  });

  it("threads tag/community/date/search filters into the query params", async () => {
    mockQuery.mockResolvedValue([]);
    await getRegularNews({
      tags: ["t1"],
      communities: ["oceania"],
      dateFrom: "2026-01-01",
      dateTo: "2026-02-01",
      search: "Flood",
      limit: 5,
      language: "en",
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        filterTags: ["t1"],
        filterCommunities: ["oceania"],
        filterDateFrom: "2026-01-01",
        filterDateTo: "2026-02-01",
        searchPattern: "*flood*",
        language: "en",
      })
    );
  });

  it("returns an empty list when the source resolves null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getRegularNews()).resolves.toEqual([]);
  });
});

describe("getAllNews", () => {
  it("returns all news posts (including featured) from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "n1" }, { _id: "n2" }]);
    await expect(getAllNews({ limit: 10 })).resolves.toEqual([{ _id: "n1" }, { _id: "n2" }]);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getAllNews()).rejects.toThrow("network error");
  });
});

describe("getNewsPostBySlug", () => {
  it("returns the detail doc from the source", async () => {
    mockQuery.mockResolvedValue({ _id: "n1", title: { en: "My story" } });
    await expect(getNewsPostBySlug("my-story")).resolves.toEqual({ _id: "n1", title: { en: "My story" } });
  });

  it("returns null when there's no match", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getNewsPostBySlug("missing")).resolves.toBeNull();
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    await expect(getNewsPostBySlug("x")).rejects.toThrow("timeout");
  });
});

describe("getNewsSlugs", () => {
  it("flattens slug rows from the source", async () => {
    mockQuery.mockResolvedValue([{ slug: "story-one" }, { slug: "story-two" }]);
    await expect(getNewsSlugs()).resolves.toEqual(["story-one", "story-two"]);
  });

  it("returns an empty list when the source resolves null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getNewsSlugs()).resolves.toEqual([]);
  });
});

describe("getRelatedNews", () => {
  it("returns related items from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "n2", slug: "related-story" }]);
    await expect(getRelatedNews("n1", ["t1"], 3)).resolves.toEqual([{ _id: "n2", slug: "related-story" }]);
  });

  it("skips the query entirely when there are no tags", async () => {
    const result = await getRelatedNews("n1", [], 3);
    expect(result).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getNewsTags / getRegionalCommunities", () => {
  it("returns tags with news counts from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "t1", label: { en: "Flood" }, value: "flood", newsCount: 4 }]);
    await expect(getNewsTags()).resolves.toEqual([
      { _id: "t1", label: { en: "Flood" }, value: "flood", newsCount: 4 },
    ]);
  });

  it("returns regional communities with news counts from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "r1", name: { en: "Oceania" }, slug: "oceania", newsCount: 2 }]);
    await expect(getRegionalCommunities()).resolves.toEqual([
      { _id: "r1", name: { en: "Oceania" }, slug: "oceania", newsCount: 2 },
    ]);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getNewsTags()).rejects.toThrow("upstream 500");
  });
});

describe("getApprovedExternalSources", () => {
  it("returns approved external sources from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "e1", _type: "externalSource", title: { en: "Off-site" } }]);
    await expect(getApprovedExternalSources({ limit: 12 })).resolves.toEqual([
      { _id: "e1", _type: "externalSource", title: { en: "Off-site" } },
    ]);
  });

  it("threads tag/community/search filters into the query params", async () => {
    mockQuery.mockResolvedValue([]);
    await getApprovedExternalSources({ tags: ["t1"], communities: ["oceania"], search: "Flood" });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        filterTags: ["t1"],
        filterCommunities: ["oceania"],
        searchPattern: "*flood*",
      })
    );
  });

  it("returns an empty list when the source resolves null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getApprovedExternalSources()).resolves.toEqual([]);
  });
});

describe("getNewsPosts", () => {
  it("returns recent published news, optionally filtered by locale", async () => {
    mockQuery.mockResolvedValue([{ _id: "n1" }]);
    const result = await getNewsPosts("en", 5);
    expect(result).toEqual([{ _id: "n1" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { language: "en" });
  });

  it("omits the language param when no locale is given", async () => {
    mockQuery.mockResolvedValue([]);
    await getNewsPosts();
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), {});
  });
});

describe("getDynamicNews", () => {
  it("returns featured items first, then backfills with recent items up to maxItems", async () => {
    mockQuery
      .mockResolvedValueOnce([{ _id: "n1" }])
      .mockResolvedValueOnce([{ _id: "n2" }, { _id: "n3" }]);

    const result = await getDynamicNews({ regionalCommunityId: "rc1", maxItems: 3 });

    expect(result).toEqual([{ _id: "n1" }, { _id: "n2" }, { _id: "n3" }]);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("skips the backfill query once featured items already fill maxItems", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "n1" }, { _id: "n2" }]);

    const result = await getDynamicNews({ regionalCommunityId: "rc1", maxItems: 2 });

    expect(result).toEqual([{ _id: "n1" }, { _id: "n2" }]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("uses the recent-only query in dynamic-recent mode", async () => {
    mockQuery.mockResolvedValue([{ _id: "n4" }]);
    const result = await getDynamicNews({ regionalCommunityId: "rc1", mode: "dynamic-recent" });
    expect(result).toEqual([{ _id: "n4" }]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("degrades to an empty list when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("402 plan_limit_reached"));
    await expect(getDynamicNews({ regionalCommunityId: "rc1" })).resolves.toEqual([]);
  });
});

describe("getNewsOgData", () => {
  it("returns the title and region from the source", async () => {
    mockQuery.mockResolvedValue({ title: { en: "My story" }, region: "Oceania" });
    await expect(getNewsOgData("my-story")).resolves.toEqual({ title: { en: "My story" }, region: "Oceania" });
  });

  it("degrades to null when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getNewsOgData("x")).resolves.toBeNull();
  });
});

describe("Algolia index docs", () => {
  it("getPublishedNewsIndexDocs returns published docs from the source", async () => {
    mockQuery.mockResolvedValue([{ _id: "n1" }]);
    await expect(getPublishedNewsIndexDocs()).resolves.toEqual([{ _id: "n1" }]);
  });

  it("getPublishedNewsIndexDocs returns an empty list when the source resolves null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getPublishedNewsIndexDocs()).resolves.toEqual([]);
  });

  it("getNewsIndexDocsByIds passes the id list through as a query param", async () => {
    mockQuery.mockResolvedValue([{ _id: "n1" }, { _id: "n2" }]);
    const result = await getNewsIndexDocsByIds(["n1", "n2"]);
    expect(result).toEqual([{ _id: "n1" }, { _id: "n2" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { ids: ["n1", "n2"] });
  });

  it("getNewsIndexDocById returns the single doc from the source", async () => {
    mockQuery.mockResolvedValue({ _id: "n1" });
    await expect(getNewsIndexDocById("n1")).resolves.toEqual({ _id: "n1" });
  });

  it("getNewsIndexDocById returns null when there's no match", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getNewsIndexDocById("missing")).resolves.toBeNull();
  });

  it("getPublishedNewsCount returns the count from the source", async () => {
    mockQuery.mockResolvedValue(4);
    await expect(getPublishedNewsCount()).resolves.toBe(4);
  });

  it("throws (does not degrade) when the source fails — the sync/webhook routes' own try/catch is the original failure behaviour", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getPublishedNewsIndexDocs()).rejects.toThrow("upstream 500");
  });
});

describe("getNewsSearchRecords", () => {
  it("maps raw docs into SearchRecord shape, localizing per document language", async () => {
    mockQuery.mockResolvedValue([
      { _id: "n1", language: "es", title: { en: "Flood", es: "Inundación" }, excerpt: { es: "Resumen" }, slug: "flood" },
    ]);

    await expect(getNewsSearchRecords()).resolves.toEqual([
      {
        objectID: "n1",
        kind: "newsPost",
        title: "Inundación",
        excerpt: "Resumen",
        url: "/es/news/flood",
        locale: "es",
      },
    ]);
  });

  it("falls back to English when language is missing or unsupported", async () => {
    mockQuery.mockResolvedValue([{ _id: "n1", title: { en: "Flood" }, slug: "flood" }]);
    const [record] = await getNewsSearchRecords();
    expect(record.locale).toBe("en");
    expect(record.url).toBe("/en/news/flood");
  });

  it("degrades to an empty list when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("402 plan_limit_reached"));
    await expect(getNewsSearchRecords()).resolves.toEqual([]);
  });
});
