import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
}));

import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import {
  getPageBySlug,
  getPageSlugs,
  getPageTranslations,
  getRegionalCommunityPage,
  getRegionalCommunityPageSlugs,
  getRegionStats,
  getHomepage,
  getHomepageBySlug,
  getIndexHomepage,
  getHomepageTranslations,
  getHomepageSlugs,
  getRegionalCommunityTeamMembers,
  getRegionalCommunityCaseStudiesBySlug,
  getRegionalCommunityLivedExperiencesBySlug,
  getRegionalCommunityNewsBySlug,
  getHomepageNews,
  getHomepageAgendas,
} from "@/lib/content/pages";

const mockQuery = vi.mocked(query);
const mockQueryPreviewable = vi.mocked(queryPreviewable);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryPreviewable.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("getPageBySlug", () => {
  it("returns the page for the requested locale", async () => {
    mockQueryPreviewable.mockResolvedValueOnce({ blocks: [{ _type: "hero-1", _key: "a" }], meta_title: "About" });

    const result = await getPageBySlug("about", "en");

    expect(result).toEqual({
      slug: "about",
      locale: "en",
      blocks: [{ _type: "hero-1", _key: "a" }],
      meta_title: "About",
      meta_description: undefined,
      noindex: undefined,
      ogImage: undefined,
    });
    expect(mockQueryPreviewable).toHaveBeenCalledWith(expect.any(String), { slug: "about", language: "en" });
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
  });

  it("falls back to English when the requested locale has no translation", async () => {
    mockQueryPreviewable
      .mockResolvedValueOnce(null) // fr miss
      .mockResolvedValueOnce({ blocks: [] }); // en fallback

    const result = await getPageBySlug("about", "fr");

    expect(result?.slug).toBe("about");
    expect(mockQueryPreviewable).toHaveBeenNthCalledWith(1, expect.any(String), { slug: "about", language: "fr" });
    expect(mockQueryPreviewable).toHaveBeenNthCalledWith(2, expect.any(String), { slug: "about", language: "en" });
  });

  it("does not fall back when the request was already English", async () => {
    mockQueryPreviewable.mockResolvedValueOnce(null);

    const result = await getPageBySlug("missing", "en");

    expect(result).toBeNull();
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
  });

  it("returns null when neither the locale nor the English fallback exist", async () => {
    mockQueryPreviewable.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const result = await getPageBySlug("missing", "ar");

    expect(result).toBeNull();
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(2);
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQueryPreviewable.mockRejectedValue(new Error("upstream 500"));
    await expect(getPageBySlug("about", "en")).rejects.toThrow("upstream 500");
  });

  // Pins the fix for a regression: fetchSanityPageBySlug's original
  // sanityFetch call omitted both perspective/stega, which is what let an
  // editor previewing a draft page in Sanity's Presentation tool see their
  // own unpublished changes. Converting this to the cached, published-only
  // `query()` primitive silently ended that draft preview. If this slips
  // back to `query`, this test must fail.
  it("uses queryPreviewable, not query", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    await getPageBySlug("about", "en");
    expect(mockQueryPreviewable).toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getPageSlugs", () => {
  it("maps rows to {id, slug, locale}, defaulting a missing language to en", async () => {
    mockQuery.mockResolvedValueOnce([
      { _id: "p1", slug: { current: "about" }, language: "es" },
      { _id: "p2", slug: { current: "feedback" }, language: null },
    ]);

    const result = await getPageSlugs();

    expect(result).toEqual([
      { id: "p1", slug: "about", locale: "es" },
      { id: "p2", slug: "feedback", locale: "en" },
    ]);
  });

  it("drops rows with no slug", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "p1", slug: null, language: "en" }]);
    await expect(getPageSlugs()).resolves.toEqual([]);
  });

  it("returns an empty array when the source returns null", async () => {
    mockQuery.mockResolvedValueOnce(null);
    await expect(getPageSlugs()).resolves.toEqual([]);
  });
});

describe("getPageTranslations", () => {
  it("returns translations from the source", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "p2", language: "es", slug: { current: "acerca" } }]);
    await expect(getPageTranslations("p1")).resolves.toEqual([
      { _id: "p2", language: "es", slug: { current: "acerca" } },
    ]);
  });

  it("degrades to an empty array when the source returns null", async () => {
    mockQuery.mockResolvedValueOnce(null);
    await expect(getPageTranslations("p1")).resolves.toEqual([]);
  });

  it("degrades to an empty array when the source throws (no translation.metadata schema, etc.)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("unknown type: translation.metadata"));
    await expect(getPageTranslations("p1")).resolves.toEqual([]);
  });
});

describe("getRegionalCommunityPage", () => {
  it("returns the page for the requested locale", async () => {
    mockQueryPreviewable.mockResolvedValueOnce({ _id: "rc1", title: "Oceania", useTemplate: true });

    const result = await getRegionalCommunityPage("oceania", "en");

    expect(result).toEqual({ _id: "rc1", title: "Oceania", useTemplate: true });
    expect(mockQueryPreviewable).toHaveBeenCalledWith(expect.any(String), { slug: "oceania", language: "en" });
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
  });

  it("falls back to English when the requested locale has no translation", async () => {
    mockQueryPreviewable.mockResolvedValueOnce(null).mockResolvedValueOnce({ _id: "rc1", title: "Oceania" });

    const result = await getRegionalCommunityPage("oceania", "ar");

    expect(result?._id).toBe("rc1");
    expect(mockQueryPreviewable).toHaveBeenNthCalledWith(1, expect.any(String), { slug: "oceania", language: "ar" });
    expect(mockQueryPreviewable).toHaveBeenNthCalledWith(2, expect.any(String), { slug: "oceania", language: "en" });
  });

  it("returns null when there's no match in either locale", async () => {
    mockQueryPreviewable.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    await expect(getRegionalCommunityPage("nowhere", "fr")).resolves.toBeNull();
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQueryPreviewable.mockRejectedValue(new Error("upstream 500"));
    await expect(getRegionalCommunityPage("oceania", "en")).rejects.toThrow("upstream 500");
  });

  // Pins the fix for a regression: fetchSanityRCPageBySlug's original
  // sanityFetch call omitted both perspective/stega — see the note on
  // getPageBySlug's own pinning test above.
  it("uses queryPreviewable, not query", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    await getRegionalCommunityPage("oceania", "en");
    expect(mockQueryPreviewable).toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getRegionalCommunityPageSlugs", () => {
  it("maps rows to {id, slug, locale}", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "rc1", slug: { current: "oceania" }, language: "en" }]);
    await expect(getRegionalCommunityPageSlugs()).resolves.toEqual([{ id: "rc1", slug: "oceania", locale: "en" }]);
  });

  it("returns an empty array when the source returns null", async () => {
    mockQuery.mockResolvedValueOnce(null);
    await expect(getRegionalCommunityPageSlugs()).resolves.toEqual([]);
  });
});

describe("getRegionStats", () => {
  it("returns counts from the source", async () => {
    mockQuery.mockResolvedValueOnce({ cs: 4, le: 2 });
    await expect(getRegionStats("OCE", "oceania")).resolves.toEqual({ caseStudies: 4, livedExperiences: 2 });
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { code: "OCE", slug: "oceania" });
  });

  it("degrades to zero counts when the source fails (decorative stats)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("network error"));
    await expect(getRegionStats("OCE", "oceania")).resolves.toEqual({ caseStudies: 0, livedExperiences: 0 });
  });

  it("degrades to zero counts when the source returns null", async () => {
    mockQuery.mockResolvedValueOnce(null);
    await expect(getRegionStats("OCE", "oceania")).resolves.toEqual({ caseStudies: 0, livedExperiences: 0 });
  });
});

describe("getHomepage", () => {
  it("fetches the 'index' homepage for the given locale", async () => {
    mockQueryPreviewable.mockResolvedValueOnce({ heroWelcome: { title: "Welcome" } });

    const result = await getHomepage("en");

    expect(result).toEqual({ heroWelcome: { title: "Welcome" } });
    expect(mockQueryPreviewable).toHaveBeenCalledWith(expect.any(String), { slug: "index", language: "en" });
  });

  it("returns null with no English fallback (original has none)", async () => {
    mockQueryPreviewable.mockResolvedValueOnce(null);
    await expect(getHomepage("ar")).resolves.toBeNull();
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQueryPreviewable.mockRejectedValue(new Error("upstream 500"));
    await expect(getHomepage("en")).rejects.toThrow("upstream 500");
  });

  // Pins the fix for a regression: fetchSanityHomepageBySlug's original
  // sanityFetch call omitted both perspective/stega — see the note on
  // getPageBySlug's own pinning test above.
  it("uses queryPreviewable, not query", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    await getHomepage("en");
    expect(mockQueryPreviewable).toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getHomepageBySlug (dead code, implemented per signature)", () => {
  it("queries the given slug/locale", async () => {
    mockQueryPreviewable.mockResolvedValueOnce({ heroWelcome: {} });
    await getHomepageBySlug("index", "es");
    expect(mockQueryPreviewable).toHaveBeenCalledWith(expect.any(String), { slug: "index", language: "es" });
  });

  // Pins the fix for a regression: fetchHomepageBySlug's original sanityFetch
  // call omitted both perspective/stega — see the note on getPageBySlug's
  // own pinning test above.
  it("uses queryPreviewable, not query", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    await getHomepageBySlug("index", "es");
    expect(mockQueryPreviewable).toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getIndexHomepage (dead code, implemented per signature)", () => {
  it("queries with only a language param", async () => {
    mockQueryPreviewable.mockResolvedValueOnce({ heroWelcome: {} });
    await getIndexHomepage("fr");
    expect(mockQueryPreviewable).toHaveBeenCalledWith(expect.any(String), { language: "fr" });
  });

  // Pins the fix for a regression: fetchIndexHomepage's original sanityFetch
  // call omitted both perspective/stega — see the note on getPageBySlug's
  // own pinning test above.
  it("uses queryPreviewable, not query", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    await getIndexHomepage("fr");
    expect(mockQueryPreviewable).toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getHomepageTranslations (dead code, implemented per signature)", () => {
  it("returns translations from the source", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "h2", language: "es" }]);
    await expect(getHomepageTranslations("h1")).resolves.toEqual([{ _id: "h2", language: "es" }]);
  });

  it("returns null (not []) on a plain miss, unlike getPageTranslations", async () => {
    mockQuery.mockResolvedValueOnce(null);
    await expect(getHomepageTranslations("h1")).resolves.toBeNull();
  });

  it("throws (does not degrade) when the source fails — the original has no try/catch", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getHomepageTranslations("h1")).rejects.toThrow("upstream 500");
  });
});

describe("getHomepageSlugs", () => {
  it("maps rows to {id, slug, locale}", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "h1", slug: { current: "index" }, language: "en" }]);
    await expect(getHomepageSlugs()).resolves.toEqual([{ id: "h1", slug: "index", locale: "en" }]);
  });

  it("returns an empty array when the source returns null", async () => {
    mockQuery.mockResolvedValueOnce(null);
    await expect(getHomepageSlugs()).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Task 6b — the five page-domain query files Task 6 could not reach.
// ---------------------------------------------------------------------------

describe("getRegionalCommunityTeamMembers", () => {
  it("queries by communityId with a default limit of 20", async () => {
    mockQueryPreviewable.mockResolvedValueOnce([{ _id: "a1", name: "Ada" }]);

    const result = await getRegionalCommunityTeamMembers({ communityId: "rc1" });

    expect(result).toEqual([{ _id: "a1", name: "Ada" }]);
    expect(mockQueryPreviewable).toHaveBeenCalledWith(expect.any(String), {
      communityId: "rc1",
      limit: 20,
    });
  });

  it("honours an explicit limit", async () => {
    mockQueryPreviewable.mockResolvedValueOnce([]);
    await getRegionalCommunityTeamMembers({ communityId: "rc1", limit: 5 });
    expect(mockQueryPreviewable).toHaveBeenCalledWith(expect.any(String), {
      communityId: "rc1",
      limit: 5,
    });
  });

  it("throws (does not degrade) when the source fails, as the original unwrapped fetch did", async () => {
    mockQueryPreviewable.mockRejectedValue(new Error("upstream 500"));
    await expect(getRegionalCommunityTeamMembers({ communityId: "rc1" })).rejects.toThrow("upstream 500");
  });

  // Pins the fix for a regression: fetchRegionalCommunityTeamMembers's
  // original sanityFetch call omitted both perspective/stega — see the note
  // on getPageBySlug's own pinning test above.
  it("uses queryPreviewable, not query", async () => {
    mockQueryPreviewable.mockResolvedValue([]);
    await getRegionalCommunityTeamMembers({ communityId: "rc1" });
    expect(mockQueryPreviewable).toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("getRegionalCommunityCaseStudiesBySlug", () => {
  it("queries by slug with default limit/featured", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "cs1", title: { en: "Study" } }]);

    const result = await getRegionalCommunityCaseStudiesBySlug({ slug: "oceania" });

    expect(result).toEqual([{ _id: "cs1", title: { en: "Study" } }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), {
      slug: "oceania",
      limit: 6,
      featured: false,
    });
  });

  it("passes featured/limit through", async () => {
    mockQuery.mockResolvedValueOnce([]);
    await getRegionalCommunityCaseStudiesBySlug({ slug: "oceania", limit: 3, featured: true });
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), {
      slug: "oceania",
      limit: 3,
      featured: true,
    });
  });

  it("throws (does not degrade) when the source fails — the original had no try/catch", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getRegionalCommunityCaseStudiesBySlug({ slug: "oceania" })).rejects.toThrow("upstream 500");
  });

  // Pins the read primitive: the original explicitly passed perspective:
  // "published", stega: false, so this maps to `query`, not `queryPreviewable`.
  it("uses query, not queryPreviewable", async () => {
    mockQuery.mockResolvedValue([]);
    await getRegionalCommunityCaseStudiesBySlug({ slug: "oceania" });
    expect(mockQuery).toHaveBeenCalled();
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });
});

describe("getRegionalCommunityLivedExperiencesBySlug", () => {
  it("queries by slug with a default limit of 10", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "le1", title: { en: "Story" } }]);

    const result = await getRegionalCommunityLivedExperiencesBySlug({ slug: "sub-saharan-africa" });

    expect(result).toEqual([{ _id: "le1", title: { en: "Story" } }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), {
      slug: "sub-saharan-africa",
      limit: 10,
      featured: false,
    });
  });

  it("throws (does not degrade) when the source fails — the original had no try/catch", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getRegionalCommunityLivedExperiencesBySlug({ slug: "oceania" })).rejects.toThrow("upstream 500");
  });

  it("uses query, not queryPreviewable", async () => {
    mockQuery.mockResolvedValue([]);
    await getRegionalCommunityLivedExperiencesBySlug({ slug: "oceania" });
    expect(mockQuery).toHaveBeenCalled();
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });
});

describe("getRegionalCommunityNewsBySlug", () => {
  it("queries by slug with a default limit of 6, combining newsPost + externalSource", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "n1", _type: "newsPost" }, { _id: "n2", _type: "externalSource" }]);

    const result = await getRegionalCommunityNewsBySlug({ slug: "oceania" });

    expect(result).toEqual([{ _id: "n1", _type: "newsPost" }, { _id: "n2", _type: "externalSource" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), {
      slug: "oceania",
      limit: 6,
      featured: false,
    });
  });

  it("throws (does not degrade) when the source fails — the original had no try/catch", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getRegionalCommunityNewsBySlug({ slug: "oceania" })).rejects.toThrow("upstream 500");
  });

  it("uses query, not queryPreviewable", async () => {
    mockQuery.mockResolvedValue([]);
    await getRegionalCommunityNewsBySlug({ slug: "oceania" });
    expect(mockQuery).toHaveBeenCalled();
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });
});

describe("getHomepageNews", () => {
  it("queries the recent-news query when featured is false (default)", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "n1" }]);

    const result = await getHomepageNews({ limit: 3 });

    expect(result).toEqual([{ _id: "n1" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { limit: 3 });
  });

  it("queries the featured-news query when featured is true", async () => {
    mockQuery.mockResolvedValueOnce([]);
    await getHomepageNews({ limit: 3, featured: true });

    const [calledQuery] = mockQuery.mock.calls[0];
    expect(calledQuery).toContain("featured == true");
  });

  it("defaults limit to 3", async () => {
    mockQuery.mockResolvedValueOnce([]);
    await getHomepageNews({});
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { limit: 3 });
  });

  it("throws (does not degrade) when the source fails — the original had no try/catch of its own; homepage.tsx's resolveNewsSection wraps the call", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getHomepageNews({ limit: 3 })).rejects.toThrow("upstream 500");
  });

  // Pins the read primitive: the original explicitly passed perspective:
  // "published", stega: false, so this maps to `query`, not `queryPreviewable`.
  it("uses query, not queryPreviewable", async () => {
    mockQuery.mockResolvedValue([]);
    await getHomepageNews({ limit: 3 });
    expect(mockQuery).toHaveBeenCalled();
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });
});

describe("getHomepageAgendas", () => {
  it("queries the recent-agendas query when featured is false (default)", async () => {
    mockQuery.mockResolvedValueOnce([{ _id: "ag1" }]);

    const result = await getHomepageAgendas({ limit: 3 });

    expect(result).toEqual([{ _id: "ag1" }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { limit: 3 });
  });

  it("queries the featured-agendas query when featured is true", async () => {
    mockQuery.mockResolvedValueOnce([]);
    await getHomepageAgendas({ limit: 3, featured: true });

    const [calledQuery] = mockQuery.mock.calls[0];
    expect(calledQuery).toContain('_type == "agenda" && featured == true');
  });

  it("throws (does not degrade) when the source fails — the original had no try/catch of its own; homepage.tsx's resolveAgendasSection wraps the call", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getHomepageAgendas({ limit: 3 })).rejects.toThrow("upstream 500");
  });

  it("uses query, not queryPreviewable", async () => {
    mockQuery.mockResolvedValue([]);
    await getHomepageAgendas({ limit: 3 });
    expect(mockQuery).toHaveBeenCalled();
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });
});
