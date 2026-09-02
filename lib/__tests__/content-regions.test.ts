import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
}));

import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import {
  getThemeOptions,
  getRegionArt,
  getRegionHighlightItems,
  getRegionRecentItems,
  getRegionFacetItems,
  getRegionPinRows,
  getRegionFacetCounts,
} from "@/lib/content/regions";
import { FALLBACK_THEMES } from "@/lib/maps/region-facets";
import type { WhenFilter } from "@/lib/maps/date-filter";

const mockQuery = vi.mocked(query);
const mockQueryPreviewable = vi.mocked(queryPreviewable);

const noWhen: WhenFilter = { filter: "", params: {} };
const boundWhen: WhenFilter = { filter: " && date >= $whenFrom", params: { whenFrom: "2025-01-01" } };

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryPreviewable.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("getThemeOptions", () => {
  it("maps valid rows to ThemeOption[]", async () => {
    mockQuery.mockResolvedValue([
      { slug: "displacement", label: { en: "Displacement", es: "Desplazamiento" } },
    ]);
    await expect(getThemeOptions()).resolves.toEqual([
      { slug: "displacement", label: { en: "Displacement", es: "Desplazamiento", fr: undefined, ar: undefined } },
    ]);
  });

  it("filters out rows with no slug or no label", async () => {
    mockQuery.mockResolvedValue([
      { slug: null, label: { en: "No slug" } },
      { slug: "youth", label: null },
      { slug: "indigenous", label: { en: "Indigenous" } },
    ]);
    const result = await getThemeOptions();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("indigenous");
  });

  it("falls back to FALLBACK_THEMES when the source returns no valid rows", async () => {
    mockQuery.mockResolvedValue([]);
    await expect(getThemeOptions()).resolves.toEqual(FALLBACK_THEMES);
  });

  it("falls back to FALLBACK_THEMES (degrades) when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("402 plan_limit_reached"));
    await expect(getThemeOptions()).resolves.toEqual(FALLBACK_THEMES);
  });

  it("uses query, not queryPreviewable — the original called client.fetch directly", async () => {
    mockQuery.mockResolvedValue([]);
    await getThemeOptions();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });
});

describe("getRegionArt", () => {
  it("keys returned art by region code via RC_SLUG_TO_REGION", async () => {
    mockQueryPreviewable.mockResolvedValue([
      { slug: "oceania", url: "https://example.com/oceania.jpg", lqip: "data:lqip" },
    ]);
    await expect(getRegionArt()).resolves.toEqual({
      oce: { url: "https://example.com/oceania.jpg", lqip: "data:lqip" },
    });
  });

  it("skips rows with an unknown slug or a missing url", async () => {
    mockQueryPreviewable.mockResolvedValue([
      { slug: "not-a-real-region", url: "https://example.com/x.jpg", lqip: null },
      { slug: "oceania", url: null, lqip: null },
    ]);
    await expect(getRegionArt()).resolves.toEqual({});
  });

  it("degrades to {} when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQueryPreviewable.mockRejectedValue(new Error("network error"));
    await expect(getRegionArt()).resolves.toEqual({});
  });

  it("uses queryPreviewable, not query — the original omitted perspective/stega so draft preview keeps working", async () => {
    mockQueryPreviewable.mockResolvedValue([]);
    await getRegionArt();
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getRegionHighlightItems", () => {
  it("returns rows from the source", async () => {
    mockQuery.mockResolvedValue([{ id: "cs1", type: "caseStudy", title: "A", slug: "a", image: null, imageLqip: null, place: null, countryCode3: null, date: "2026-01-01", regionKey: "oce" }]);
    const result = await getRegionHighlightItems("caseStudy", { theme: "", q: "", when: noWhen });
    expect(result).toHaveLength(1);
    expect(result[0].regionKey).toBe("oce");
  });

  it("throws (does not degrade) when the source fails, matching the route's own try/catch", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    await expect(getRegionHighlightItems("caseStudy", { theme: "", q: "", when: noWhen })).rejects.toThrow("timeout");
  });

  it("binds theme under the key `theme` (not `themeSlug`) — preserved verbatim from the original, a pre-existing mismatch with themeFilter()'s $themeSlug reference", async () => {
    mockQuery.mockResolvedValue([]);
    await getRegionHighlightItems("caseStudy", { theme: "displacement", q: "flood", when: boundWhen });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ type: "caseStudy", theme: "displacement", q: "flood", whenFrom: "2025-01-01" }),
    );
    const [, params] = mockQuery.mock.calls[0];
    expect(params).not.toHaveProperty("themeSlug");
  });
});

describe("getRegionRecentItems", () => {
  it("returns rows from the source", async () => {
    mockQuery.mockResolvedValue([{ id: "n1", type: "newsPost", title: "B", slug: "b", image: null, imageLqip: null, place: null, countryCode3: null, date: "2026-02-01" }]);
    await expect(getRegionRecentItems("newsPost", { theme: "", q: "", when: noWhen, limit: 6 })).resolves.toHaveLength(1);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getRegionRecentItems("newsPost", { theme: "", q: "", when: noWhen, limit: 6 })).rejects.toThrow("upstream 500");
  });

  it("interpolates limit directly into the GROQ string rather than binding it as a param", async () => {
    mockQuery.mockResolvedValue([]);
    await getRegionRecentItems("caseStudy", { theme: "", q: "", when: noWhen, limit: 12 });
    const [groq, params] = mockQuery.mock.calls[0];
    expect(groq).toContain("[0...12]");
    expect(params).not.toHaveProperty("limit");
  });
});

describe("getRegionFacetItems", () => {
  it("returns rows from the source", async () => {
    mockQuery.mockResolvedValue([{ id: "cs2", type: "caseStudy", title: "C", slug: "c", image: null, imageLqip: null, place: null, countryCode3: null, date: "2026-03-01" }]);
    const result = await getRegionFacetItems("caseStudy", {
      region: "oce",
      slug: "oceania",
      regionCountries: ["AUS", "NZL"],
      theme: "",
      q: "",
      when: noWhen,
    });
    expect(result).toHaveLength(1);
  });

  it("throws (does not degrade) when the source fails", async () => {
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(
      getRegionFacetItems("caseStudy", { region: "oce", slug: "oceania", regionCountries: [], theme: "", q: "", when: noWhen }),
    ).rejects.toThrow("network error");
  });

  it("binds theme correctly under `themeSlug` — this call site matches themeFilter()'s $themeSlug reference", async () => {
    mockQuery.mockResolvedValue([]);
    await getRegionFacetItems("caseStudy", {
      region: "oce",
      slug: "oceania",
      regionCountries: ["AUS"],
      theme: "youth",
      q: "flood",
      when: boundWhen,
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        type: "caseStudy",
        region: "oce",
        slug: "oceania",
        regionCountries: ["AUS"],
        themeSlug: "youth",
        q: "flood",
        whenFrom: "2025-01-01",
      }),
    );
  });
});

describe("getRegionPinRows", () => {
  it("returns rows from the source", async () => {
    mockQuery.mockResolvedValue([
      { _id: "cs1", title: "A", slug: "a", point: { lat: 1, lng: 2 }, precision: "exact", countryCode3: "AUS" },
    ]);
    const result = await getRegionPinRows("caseStudy", {
      region: "oce",
      slug: "oceania",
      regionCountries: ["AUS"],
      themeSlug: null,
      q: "",
      when: noWhen,
    });
    expect(result).toHaveLength(1);
  });

  it("throws (does not degrade) when the source fails — the route has no try/catch around its Promise.all", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    await expect(
      getRegionPinRows("caseStudy", { region: "oce", slug: "oceania", regionCountries: [], themeSlug: null, q: "", when: noWhen }),
    ).rejects.toThrow("timeout");
  });

  it("defaults a null themeSlug to an empty bound param", async () => {
    mockQuery.mockResolvedValue([]);
    await getRegionPinRows("caseStudy", { region: "all", slug: "", regionCountries: [], themeSlug: null, q: "", when: noWhen });
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ themeSlug: "" }));
  });
});

describe("getRegionFacetCounts", () => {
  it("returns rows from the source", async () => {
    mockQuery.mockResolvedValue([{ code: "oce", rcSlug: null, rcSlugs: null, countryCode3: null }]);
    const result = await getRegionFacetCounts("caseStudy", { theme: null, q: "", when: noWhen });
    expect(result).toHaveLength(1);
  });

  it("throws (does not degrade) when the source fails — the route isolates failure per-facet via Promise.allSettled", async () => {
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getRegionFacetCounts("caseStudy", { theme: null, q: "", when: noWhen })).rejects.toThrow("network error");
  });

  it("interpolates type directly into the GROQ string rather than binding it as $type", async () => {
    mockQuery.mockResolvedValue([]);
    await getRegionFacetCounts("newsPost", { theme: null, q: "", when: noWhen });
    const [groq, params] = mockQuery.mock.calls[0];
    expect(groq).toContain('_type == "newsPost"');
    expect(params).not.toHaveProperty("type");
  });

  it("defaults a null theme to an empty themeSlug bound param", async () => {
    mockQuery.mockResolvedValue([]);
    await getRegionFacetCounts("caseStudy", { theme: null, q: "flood", when: noWhen });
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ q: "flood", themeSlug: "" }));
  });
});
