import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
}));

vi.mock("@/lib/content/internal/payload-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
  queryRaw: vi.fn(),
  queryLive: vi.fn(),
}));

import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import {
  query as payloadQuery,
  queryPreviewable as payloadQueryPreviewable,
  queryRaw as payloadQueryRaw,
  queryLive as payloadQueryLive,
} from "@/lib/content/internal/payload-source";
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
const mockPayloadQuery = vi.mocked(payloadQuery);
const mockPayloadQueryPreviewable = vi.mocked(payloadQueryPreviewable);
const mockPayloadQueryRaw = vi.mocked(payloadQueryRaw);
const mockPayloadQueryLive = vi.mocked(payloadQueryLive);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryPreviewable.mockReset();
  mockPayloadQuery.mockReset();
  mockPayloadQueryPreviewable.mockReset();
  mockPayloadQueryRaw.mockReset();
  mockPayloadQueryLive.mockReset();
  delete process.env.CONTENT_BACKEND_PAGES;
  delete process.env.CONTENT_BACKEND;
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_PAGES;
  delete process.env.CONTENT_BACKEND;
  vi.restoreAllMocks();
});

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

// ---------------------------------------------------------------------------
// The Payload arm — Task 14b
//
// Nothing above this line was edited beyond adding the `payload-source` mock
// and the env cleanup: those 58 tests are the Sanity contract, and they are
// what both backends have to satisfy. Everything below sets
// `CONTENT_BACKEND_PAGES=payload`, mocks `payload-source` rather than the
// reader, and asserts the same contract plus the things only the descriptor or
// the primitive choice can show.
//
// 14b swaps the **document** readers only. `getRegionalCommunityPage`,
// `getRegionStats`, the homepage pair and the four feeds are 14c's and 14d's
// and still read Sanity with the flag set; the last test in this block pins
// that, so a later task cannot half-move them without a failure.
// ---------------------------------------------------------------------------

/** One `pages` row as Payload really hands it back at `locale: "all"`: the
 *  slug and `noindex` plain (neither is localized), every localized field
 *  spelled out with `null` for the arms no Sanity document filled in, and
 *  `blocks` localized at the ARRAY level so each locale carries its own list. */
function payloadPageRow(over: Record<string, unknown> = {}) {
  return {
    id: "page-global-agenda-en",
    slug: "research-and-action/global-agenda",
    title: { en: "Global Agenda", es: "Agenda Global", fr: "Agenda mondial", ar: "الأجندة العالمية" },
    // `blocks` is localized at the ARRAY level, and each row's id carries the
    // Sanity `_key` the importer preserved (`rowId()`), which is where
    // `internal/payload/blocks.ts` reads `_key` back from.
    blocks: {
      en: [{ id: "page-global-agenda-en:blocks:one", blockType: "hero1" }],
      es: [{ id: "page-global-agenda-es:blocks:one", blockType: "hero1" }],
      fr: [],
      ar: [],
    },
    // Measured on this very page: the English document carries a meta_title
    // and the other three do not, and GROQ answers `null` for them.
    meta_title: { en: "Global Agenda | Connecting Climate Minds", es: null, fr: null, ar: null },
    meta_description: { en: null, es: null, fr: null, ar: null },
    noindex: false,
    ogImage: { asset: null, alt: { en: null, es: null, fr: null, ar: null } },
    ...over,
  };
}

const PAGE_OG_MEDIA = {
  id: "image-4e0940eff53a2dff5066595f7432d23f576dd8b2-3840x2160-png",
  url: "/payload-api/media/file/toolkits-og.png",
  mimeType: "image/png",
  lqip: "data:image/png;base64,AAAA",
  width: 3840,
  height: 2160,
  sizes: { max1200x675: { url: "/payload-api/media/file/toolkits-og-1200x675.webp" } },
};

describe("pages, answered by Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_PAGES = "payload";
  });

  describe("the primitive, not just the result", () => {
    it("reads a page through `queryPreviewable`, so an editor still sees their draft", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadPageRow()] } as never);
      await getPageBySlug("research-and-action/global-agenda", "en");

      expect(mockPayloadQueryPreviewable).toHaveBeenCalled();
      expect(mockPayloadQuery).not.toHaveBeenCalled();
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      expect(mockQueryPreviewable).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("reads the slug and translation lists through `query`, matching their Sanity twins", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getPageSlugs();
      await getRegionalCommunityPageSlugs();
      await getPageTranslations("page-about-en");

      expect(mockPayloadQuery).toHaveBeenCalled();
      expect(mockPayloadQueryPreviewable).not.toHaveBeenCalled();
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe("getPageBySlug", () => {
    it("reads at locale 'all', because a pinned read would fall back to English silently", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadPageRow()] } as never);
      await getPageBySlug("research-and-action/global-agenda", "es");

      expect(mockPayloadQueryPreviewable).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "find",
          collection: "pages",
          locale: "all",
          where: { slug: { equals: "research-and-action/global-agenda" } },
        }),
      );
    });

    it("keeps an untranslated meta_title empty rather than answering in English", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadPageRow()] } as never);
      const page = await getPageBySlug("research-and-action/global-agenda", "es");

      // Payload's localization sets `fallback: true`; Sanity holds four
      // documents and returns this one's own null. The Spanish page's <title>
      // must not become the English one.
      expect(page?.meta_title).toBeUndefined();
      expect(page?.locale).toBe("es");
    });

    it("returns the requested locale's own meta fields", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadPageRow()] } as never);
      const page = await getPageBySlug("research-and-action/global-agenda", "en");
      expect(page?.meta_title).toBe("Global Agenda | Connecting Climate Minds");
      expect(page?.slug).toBe("research-and-action/global-agenda");
    });

    it("is null when no row carries the slug", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [] } as never);
      await expect(getPageBySlug("missing", "en")).resolves.toBeNull();
    });

    it("falls back to English when the requested locale carries no document at all", async () => {
      // One row, but nothing in `ar` — the four Sanity documents were three.
      mockPayloadQueryPreviewable.mockResolvedValue({
        docs: [
          payloadPageRow({
            title: { en: "Global Agenda", es: "Agenda Global", fr: "Agenda mondial", ar: null },
            blocks: { en: [{ blockType: "hero1" }], es: [], fr: [], ar: [] },
            meta_title: { en: "English title", es: null, fr: null, ar: null },
          }),
        ],
      } as never);
      const page = await getPageBySlug("research-and-action/global-agenda", "ar");

      // The locale the caller asked for is what the page reports, exactly as
      // `toPage` does on the Sanity arm after its own English retry.
      expect(page?.locale).toBe("ar");
      expect(page?.meta_title).toBe("English title");
    });

    it("maps the requested locale's own block list, not another locale's", async () => {
      // 14b returned `[]` here on purpose. 14c fills it, and the thing worth
      // pinning is that `blocks` is localized at the ARRAY level: `about` has
      // three blocks in `en` and four in the other three, so reading the wrong
      // arm is a whole missing section rather than a wrong string.
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadPageRow()] } as never);
      const en = await getPageBySlug("research-and-action/global-agenda", "en");
      expect(en?.blocks).toHaveLength(1);
      expect(en?.blocks[0]).toMatchObject({ _type: "hero-1", _key: "one" });

      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadPageRow()] } as never);
      const fr = await getPageBySlug("research-and-action/global-agenda", "fr");
      expect(fr?.blocks).toEqual([]);
    });

    it("projects ogImage as PAGE_QUERY writes it — no alt, no lqip", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({
        docs: [
          payloadPageRow({
            ogImage: { asset: PAGE_OG_MEDIA, alt: { en: "Connecting Climate Minds' Toolkits" } },
          }),
        ],
      } as never);
      const page = await getPageBySlug("research-and-action/toolkits", "en");
      const ogImage = page?.ogImage as Record<string, unknown>;

      expect(ogImage.asset).toEqual({
        _id: PAGE_OG_MEDIA.id,
        metadata: { dimensions: { height: 2160, width: 3840 } },
        url: PAGE_OG_MEDIA.url,
      });
      // The GROQ names neither, so neither is emitted — even though Payload
      // stores an alt on this very document.
      expect(ogImage).not.toHaveProperty("alt");
      expect((ogImage.asset as Record<string, unknown>).metadata).not.toHaveProperty("lqip");
      // The flattened media row, so `payload-image-source` can resolve it for
      // the Open Graph URL without reaching `asset._id`.
      expect(ogImage.url).toBe(PAGE_OG_MEDIA.url);
      expect(ogImage.width).toBe(3840);
    });

    it("is undefined for a page with no ogImage, as `toPage` maps GROQ's null", async () => {
      mockPayloadQueryPreviewable.mockResolvedValue({ docs: [payloadPageRow()] } as never);
      const page = await getPageBySlug("research-and-action/global-agenda", "en");
      expect(page?.ogImage).toBeUndefined();
    });
  });

  describe("getPageSlugs", () => {
    it("expands one row into one entry per locale it carries", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadPageRow()] } as never);
      await expect(getPageSlugs()).resolves.toEqual([
        { id: "page-global-agenda-en", slug: "research-and-action/global-agenda", locale: "en" },
        { id: "page-global-agenda-en", slug: "research-and-action/global-agenda", locale: "es" },
        { id: "page-global-agenda-en", slug: "research-and-action/global-agenda", locale: "fr" },
        { id: "page-global-agenda-en", slug: "research-and-action/global-agenda", locale: "ar" },
      ]);
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ type: "find", collection: "pages", locale: "all" }),
      );
    });

    it("drops a row with no slug, exactly as `defined(slug)` does", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadPageRow({ slug: null })] } as never);
      await expect(getPageSlugs()).resolves.toEqual([]);
    });
  });

  describe("getRegionalCommunityPageSlugs", () => {
    it("reads the regionalCommunityPages collection", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          {
            id: "regional-community-page-oceania",
            slug: "oceania",
            title: { en: "Oceania", es: "Oceanía", fr: "Océanie", ar: "أوقيانوسيا" },
          },
        ],
      } as never);
      const rows = await getRegionalCommunityPageSlugs();

      expect(rows).toHaveLength(4);
      expect(rows[0]).toEqual({ id: "regional-community-page-oceania", slug: "oceania", locale: "en" });
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ collection: "regionalCommunityPages" }),
      );
    });
  });

  describe("getPageTranslations", () => {
    it("answers from the pages collection when the id is a page", async () => {
      mockPayloadQuery.mockResolvedValue(payloadPageRow() as never);
      const rows = await getPageTranslations("page-global-agenda-en");

      expect(rows.map((r) => r.language)).toEqual(["en", "es", "fr", "ar"]);
      expect(rows[0].slug).toEqual({ current: "research-and-action/global-agenda" });
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ type: "findByID", collection: "pages", id: "page-global-agenda-en" }),
      );
    });

    it("falls through to regionalCommunityPages when the id is not a page", async () => {
      mockPayloadQuery
        .mockResolvedValueOnce(null as never)
        .mockResolvedValueOnce({
          id: "regional-community-page-oceania",
          slug: "oceania",
          title: { en: "Oceania", es: "Oceanía", fr: "Océanie", ar: "أوقيانوسيا" },
        } as never);
      const rows = await getPageTranslations("regional-community-page-oceania");

      expect(rows).toHaveLength(4);
      expect(mockPayloadQuery).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ collection: "regionalCommunityPages" }),
      );
    });

    it("is empty for an id in neither collection — a homepage id, for one", async () => {
      mockPayloadQuery.mockResolvedValue(null as never);
      await expect(getPageTranslations("homepage-en")).resolves.toEqual([]);
    });

    it("degrades to [] when the read fails, as `safe()` already made it", async () => {
      mockPayloadQuery.mockRejectedValue(new Error("payload down"));
      await expect(getPageTranslations("page-about-en")).resolves.toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // The Payload arm — Task 14d
  // ---------------------------------------------------------------------------

  /** One `regionalCommunityPages` row as Payload hands it back at
   *  `locale: "all"`: `slug`, `atlasEmbed` and `noindex` plain, everything
   *  editorial localized at the container level, and `sections` the ordered
   *  array the six grid slots collapsed into. */
  function payloadRcRow(over: Record<string, unknown> = {}) {
    return {
      id: "regional-community-page-oceania",
      slug: "oceania",
      title: { en: "Oceania", es: "Oceanía", fr: "Océanie", ar: "أوقيانوسيا" },
      regionalCommunity: { id: "regional-community-oceania", name: { en: "Oceania" }, slug: "oceania" },
      welcomeHero: { en: { title: "Welcome", background: { type: "none" } } },
      whyJoinCTA: { en: { title: "Why join", background: { type: "none" } } },
      // Deliberately not in the Sanity slot order, to prove the reader reads
      // `contentType` rather than the array position.
      sections: {
        en: [
          { blockType: "contentGrid", contentType: "news", mode: "dynamic-recent", showTitle: false, showDescription: false },
          { blockType: "contentGrid", contentType: "agendas", mode: "manual", showTitle: true, showDescription: true, manualItems: [{ blockType: "gridAgenda" }, { blockType: "gridAgenda" }] },
          { blockType: "contentGrid", contentType: "team", mode: "manual", showTitle: true, displayRole: true, manualMembers: [] },
        ],
      },
      atlasEmbed: { enabled: false, showBreakdown: true },
      logoCloud: { en: { padding: null, title: null, images: [] } },
      meta_title: { en: null, es: null, fr: null, ar: null },
      meta_description: { en: null, es: null, fr: null, ar: null },
      noindex: false,
      ogImage: { asset: null, alt: { en: null } },
      ...over,
    };
  }

  describe("getRegionalCommunityPage", () => {
    beforeEach(() => {
      process.env.CONTENT_BACKEND_PAGES = "payload";
    });

    it("rebuilds the six named slots out of `contentGrid.contentType`", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({ docs: [payloadRcRow()] } as never);

      const page = await getRegionalCommunityPage("oceania", "en");

      expect(page?.agendasGrid).toMatchObject({ mode: "manual", showTitle: true });
      expect(page?.newsGrid).toMatchObject({ mode: "dynamic-recent" });
      expect(page?.teamGrid).toMatchObject({ mode: "manual", displayRole: true });
      // The three `contentType`s this row does not carry are the three slots
      // Sanity answers `null` for.
      expect(page?.caseStudiesGrid).toBeNull();
      expect(page?.livedExperiencesCarousel).toBeNull();
      expect(page?.testimonialsBlock).toBeNull();
    });

    it("projects manualItems as a list of nulls, because the GROQ dereferences objects", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({ docs: [payloadRcRow()] } as never);
      const page = await getRegionalCommunityPage("oceania", "en");
      expect(page?.agendasGrid?.manualItems).toEqual([null, null]);
    });

    it("keeps showTitle/showDescription as the booleans Sanity stores, not the checkbox rule", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({ docs: [payloadRcRow()] } as never);
      const page = await getRegionalCommunityPage("oceania", "en");
      // `showTitle !== false` gates the whole news section in the template, so
      // a `false` mapped to `null` would add a section to 20 of the 28 pages.
      expect(page?.newsGrid?.showTitle).toBe(false);
      expect(page?.newsGrid?.showDescription).toBe(false);
    });

    it("never lets a Payload `enabled: false` turn the atlas embed off", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({ docs: [payloadRcRow()] } as never);
      const page = await getRegionalCommunityPage("oceania", "en");
      // The template reads this as opt-OUT: `atlasEmbed?.enabled !== false`.
      expect(page?.atlasEmbed?.enabled).not.toBe(false);
    });

    it("answers null for a slot no editor filled in", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({ docs: [payloadRcRow()] } as never);
      const page = await getRegionalCommunityPage("oceania", "en");
      expect(page?.logoCloud).toBeNull();
    });

    it("keeps whyJoinCTA's stored `cta-1` type, which its hero-1 field set contradicts", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({ docs: [payloadRcRow()] } as never);
      const page = await getRegionalCommunityPage("oceania", "en");
      expect(page?.welcomeHero?._type).toBe("hero-1");
      expect(page?.whyJoinCTA?._type).toBe("cta-1");
      expect(page?.welcomeHero?._key).toBeNull();
    });

    it("re-emits useTemplate true and contentFlow null, the two the remodel dropped", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({ docs: [payloadRcRow()] } as never);
      const page = await getRegionalCommunityPage("oceania", "en");
      expect(page?.useTemplate).toBe(true);
      expect(page?.contentFlow).toBeNull();
    });

    it("reads the requested locale's own section list", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({
        docs: [
          payloadRcRow({
            title: { en: "Oceania", es: "Oceanía", fr: null, ar: null },
            sections: {
              en: [{ blockType: "contentGrid", contentType: "agendas" }],
              es: [
                { blockType: "contentGrid", contentType: "agendas" },
                { blockType: "contentGrid", contentType: "testimonials", title: "Voces" },
              ],
            },
          }),
        ],
      } as never);

      const page = await getRegionalCommunityPage("oceania", "es");
      expect(page?.testimonialsBlock).toEqual({ showSection: true, title: "Voces" });
    });

    it("falls back to English when the requested locale carries no document", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({
        docs: [payloadRcRow({ title: { en: "Oceania", es: null, fr: null, ar: null } })],
      } as never);

      const page = await getRegionalCommunityPage("oceania", "fr");
      expect(page?.language).toBe("en");
      // One read, not two: Payload holds one row per slug.
      expect(mockPayloadQueryPreviewable).toHaveBeenCalledTimes(1);
    });

    it("returns null when no row carries the slug", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({ docs: [] } as never);
      await expect(getRegionalCommunityPage("nowhere", "en")).resolves.toBeNull();
    });

    it("uses queryPreviewable, not query — the collection carries a draft", async () => {
      mockPayloadQueryPreviewable.mockResolvedValueOnce({ docs: [] } as never);
      await getRegionalCommunityPage("oceania", "en");
      expect(mockPayloadQueryPreviewable).toHaveBeenCalledWith(
        expect.objectContaining({ collection: "regionalCommunityPages", depth: 3, locale: "all" }),
      );
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });
  });

  describe("getRegionStats", () => {
    beforeEach(() => {
      process.env.CONTENT_BACKEND_PAGES = "payload";
      mockPayloadQuery.mockImplementation(async (descriptor: unknown) => {
        const d = descriptor as { type: string; collection: string };
        if (d.type === "find") return { docs: [{ id: "regional-community-oceania" }] } as never;
        return (d.collection === "caseStudies" ? { totalDocs: 4 } : { totalDocs: 2 }) as never;
      });
    });

    it("counts both types for the community", async () => {
      await expect(getRegionStats("oce", "oceania")).resolves.toEqual({
        caseStudies: 4,
        livedExperiences: 2,
      });
    });

    it("filters case studies by region only when the code is one Postgres knows", async () => {
      await getRegionStats("oce", "oceania");
      const counts = mockPayloadQuery.mock.calls
        .map(([d]) => d as { type: string; collection?: string; where?: unknown })
        .filter((d) => d.type === "count");
      expect(JSON.stringify(counts.find((d) => d.collection === "caseStudies"))).toContain('"region"');

      mockPayloadQuery.mockClear();
      // A slug that is not one of the seven codes would raise at the Postgres
      // enum; GROQ merely matches nothing, so the clause is dropped.
      await getRegionStats("not-a-region", "oceania");
      const after = mockPayloadQuery.mock.calls
        .map(([d]) => d as { type: string; collection?: string })
        .filter((d) => d.type === "count");
      expect(JSON.stringify(after.find((d) => d.collection === "caseStudies"))).not.toContain('"region"');
    });

    it("never filters lived experiences by region — the field holds a reference", async () => {
      await getRegionStats("oce", "oceania");
      const le = mockPayloadQuery.mock.calls
        .map(([d]) => d as { type: string; collection?: string })
        .find((d) => d.type === "count" && d.collection === "livedExperiences");
      expect(JSON.stringify(le)).not.toContain('"region"');
    });

    it("degrades to zero counts when the read fails, as `safe()` already made it", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockPayloadQuery.mockRejectedValue(new Error("payload down") as never);
      await expect(getRegionStats("oce", "oceania")).resolves.toEqual({
        caseStudies: 0,
        livedExperiences: 0,
      });
    });
  });

  // 14b wrote a test here pinning the readers it deliberately left behind, so
  // that "a later task cannot half-move them without a failure". 14d is that
  // task. Until its last two swaps land, the pin names what is still on Sanity.
  it("leaves the homepage pair and the feeds on Sanity with the flag set", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    mockQuery.mockResolvedValue([]);
    mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
    mockPayloadQueryPreviewable.mockResolvedValue({ docs: [] } as never);

    await getHomepage("en");
    await getIndexHomepage("en");
    await getHomepageNews({ limit: 3 });
    await getHomepageAgendas({ limit: 3 });
    await getRegionalCommunityTeamMembers({ communityId: "oceania" });

    expect(mockQueryPreviewable).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalled();
  });
});
