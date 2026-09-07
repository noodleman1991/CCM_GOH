import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryRaw: vi.fn(),
  uploadFileAsset: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

// `payload-source`, not the reader: `queryRaw`, `queryLive`, `queryPreviewable`
// and `query` all return the same shape, so a reader that picks the wrong one
// is invisible to a result-based test. Mocking the source leaves the real
// reader running and makes its primitive choice observable.
vi.mock("@/lib/content/internal/payload-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
  queryRaw: vi.fn(),
  queryLive: vi.fn(),
  uploadFileAsset: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

import { query } from "@/lib/content/internal/sanity-source";
import {
  query as payloadQuery,
  queryPreviewable as payloadQueryPreviewable,
  queryRaw as payloadQueryRaw,
  queryLive as payloadQueryLive,
} from "@/lib/content/internal/payload-source";
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
const mockPayloadQuery = vi.mocked(payloadQuery);
const mockPayloadQueryPreviewable = vi.mocked(payloadQueryPreviewable);
const mockPayloadQueryRaw = vi.mocked(payloadQueryRaw);
const mockPayloadQueryLive = vi.mocked(payloadQueryLive);

beforeEach(() => {
  mockQuery.mockReset();
  mockPayloadQuery.mockReset();
  mockPayloadQueryPreviewable.mockReset();
  mockPayloadQueryRaw.mockReset();
  mockPayloadQueryLive.mockReset();
  // The Payload sections below set this. Without the delete, an override left
  // behind would silently redirect the Sanity arm to the other backend and its
  // assertions would stop meaning anything.
  delete process.env.CONTENT_BACKEND_NEWS;
  delete process.env.CONTENT_BACKEND;
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_NEWS;
  delete process.env.CONTENT_BACKEND;
  vi.restoreAllMocks();
});

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

// ---------------------------------------------------------------------------
// The Payload arm
//
// Nothing above this line was edited: the 38 tests are the Sanity contract and
// they are what both backends have to satisfy. Everything below sets
// `CONTENT_BACKEND_NEWS=payload`, mocks `payload-source` rather than the
// reader, and asserts the same contract plus the four things only the flight
// payload or the primitive choice can show.
// ---------------------------------------------------------------------------

/** One published news post, as Payload really hands it back at `locale: "all"`
 *  and `depth: 2`: every locale spelled out, `null` for the untranslated arms,
 *  empty containers for the unset relationships, a group of nulls for the
 *  unset `locationDetails`, and no `language` column at all. */
function payloadNewsRow(over: Record<string, unknown> = {}) {
  return {
    id: "news-cop28",
    _status: "published",
    slug: "cop28-centring-mental-health",
    title: { en: "COP28", es: null, fr: null, ar: null },
    subtitle: { en: "A turning point", es: null, fr: null, ar: null },
    excerpt: { en: "The 28th UN conference", es: null, fr: null, ar: null },
    publishedAt: "2024-01-15T00:00:00.000Z",
    sanityUpdatedAt: "2025-10-28T13:12:49.000Z",
    featured: true,
    image: null,
    author: { id: "author-britt-wray", name: "Dr. Britt Wray", image: { asset: null, alt: { en: null } } },
    organizations: [],
    relatedCommunity: null,
    locationDetails: { city: null, country: null, region: null },
    tags: [],
    sources: [],
    themes: [],
    populations: [],
    noindex: false,
    meta_title: null,
    meta_description: null,
    ogImage: { asset: null, alt: { en: null } },
    content: null,
    ...over,
  };
}

const PAYLOAD_MEDIA = {
  id: "image-4808835b-1200x630-jpg",
  url: "/payload-api/media/file/header.jpg?prefix=cms%2Fmedia",
  mimeType: "image/jpeg",
  lqip: "data:image/jpeg;base64,AAAA",
  width: 1200,
  height: 630,
  sizes: { max800x450: { url: "/payload-api/media/file/header-800x450.webp", width: 800, height: 450 } },
};

describe("news, answered by Payload", () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_NEWS = "payload";
  });

  describe("the primitive, not just the result", () => {
    it("reads every list through `query` and never through the uncached or draft-aware ones", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getFeaturedNews(3);
      await getRegularNews();
      await getAllNews();
      await getNewsPostBySlug("x");
      await getApprovedExternalSources();

      expect(mockPayloadQuery).toHaveBeenCalled();
      // `queryPreviewable` would show drafts on a public page; `queryRaw` and
      // `queryLive` are for reads that feed a write, and none of these do.
      expect(mockPayloadQueryPreviewable).not.toHaveBeenCalled();
      expect(mockPayloadQueryRaw).not.toHaveBeenCalled();
      expect(mockPayloadQueryLive).not.toHaveBeenCalled();
      // And the Sanity source is never touched once the flag is set.
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("counts through the `count` primitive rather than by fetching and measuring", async () => {
      mockPayloadQuery.mockResolvedValue(4 as never);
      await expect(getPublishedNewsCount()).resolves.toBe(4);
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ type: "count", collection: "newsPosts" }),
      );
    });
  });

  describe("the NEWS_POST_FIELDS projection", () => {
    it("emits every key the GROQ names, with null for the ones Payload does not store", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadNewsRow()] } as never);
      const [post] = await getFeaturedNews(3);

      // A GROQ projection emits `null` for a key the document does not set;
      // React writes an absent prop into the flight payload as `"$undefined"`,
      // which is a different byte string.
      expect(post.projects).toBeNull();
      expect(post.priority).toBeNull();
      expect(post.views).toBeNull();
      // `language` has no Payload column at all — see the reader's note 1.
      expect(post.language).toBeNull();
      expect(post.relatedCommunity).toBeNull();
      expect(post.image).toBeNull();
    });

    it("collapses Payload's empty containers back to the null GROQ returns", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadNewsRow()] } as never);
      const [post] = await getFeaturedNews(3);
      // `[]` for an unset hasMany relationship, `[]` for an unset array, and a
      // group of nulls for an unset group.
      expect(post.organizations).toBeNull();
      expect(post.tags).toBeNull();
      expect(post.locationDetails).toBeNull();
    });

    it("sorts a localized object's keys the way Sanity serializes them", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadNewsRow({ title: { en: "COP28", es: "COP28 ES", fr: "COP28 FR", ar: "كوب28" } })],
      } as never);
      const [post] = await getFeaturedNews(3);
      expect(Object.keys(post.title)).toEqual(["ar", "en", "es", "fr"]);
    });

    it("spells the dates the way Sanity spells them, because two of them render raw", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadNewsRow()] } as never);
      const [post] = await getFeaturedNews(3);
      // <meta property="article:published_time"> and article:modified_time.
      expect(post.publishedAt).toBe("2024-01-15T00:00:00Z");
      expect(post._updatedAt).toBe("2025-10-28T13:12:49Z");
    });

    it("keeps a non-zero millisecond suffix, which Sanity also stores", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadNewsRow({ publishedAt: "2026-05-20T08:19:37.159Z" })],
      } as never);
      const [post] = await getFeaturedNews(3);
      expect(post.publishedAt).toBe("2026-05-20T08:19:37.159Z");
    });

    it("hands a tag back with a flat string `value`, as the flattened GROQ now does", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          payloadNewsRow({
            tags: [{ id: "t1", label: { en: "Climate Change", es: null }, value: "climate-change", color: "#3b82f6", category: "topic" }],
          }),
        ],
      } as never);
      const [post] = await getFeaturedNews(3);
      expect(post.tags).toEqual([
        { _id: "t1", label: { en: "Climate Change" }, value: "climate-change", color: "#3b82f6", category: "topic" },
      ]);
    });
  });

  describe("the image group", () => {
    it("carries `asset._id`, without which every news card renders no image at all", async () => {
      // `news-post-card.tsx:81` gates the whole <Image> on `image?.asset?._id`.
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadNewsRow({ image: { asset: PAYLOAD_MEDIA, alt: { en: "Illustration", fr: "Illustration" } } })],
      } as never);
      const [post] = await getFeaturedNews(3);
      expect(post.image?.asset).toEqual({
        _id: "image-4808835b-1200x630-jpg",
        url: "/payload-api/media/file/header.jpg?prefix=cms%2Fmedia",
        mimeType: "image/jpeg",
        metadata: { lqip: "data:image/jpeg;base64,AAAA", dimensions: { width: 1200, height: 630 } },
      });
    });

    it("also carries the media row itself, so `imageUrl` resolves through Payload and not Sanity's CDN", async () => {
      // `payload-image-source.resolveMedia` refuses anything carrying `_id`,
      // and unwraps a flat `{url, sizes, …}` first. Without these keys every
      // `imageUrl()` call in components/ falls through to Sanity's builder and
      // the swap silently does not happen for images.
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadNewsRow({ image: { asset: PAYLOAD_MEDIA, alt: { en: "Illustration" } } })],
      } as never);
      const [post] = await getFeaturedNews(3);
      const group = post.image as unknown as Record<string, unknown>;
      expect(group.url).toBe("/payload-api/media/file/header.jpg?prefix=cms%2Fmedia");
      expect(group.sizes).toEqual(PAYLOAD_MEDIA.sizes);
      expect(group.lqip).toBe("data:image/jpeg;base64,AAAA");
    });

    it("collapses the localized alt to the bare string Sanity's `type: \"string\"` field returns", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadNewsRow({ image: { asset: PAYLOAD_MEDIA, alt: { en: "Illustration", fr: "Illustration" } } })],
      } as never);
      const [post] = await getFeaturedNews(3);
      expect(post.image?.alt).toBe("Illustration");
      // Projected by the GROQ, declared by neither schema.
      expect(post.image?.caption).toBeNull();
    });

    it("drops an image group whose upload never resolved, as an unresolvable Sanity reference is dropped", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadNewsRow({ image: { asset: null, alt: { en: null } } })],
      } as never);
      const [post] = await getFeaturedNews(3);
      expect(post.image).toBeNull();
    });
  });

  describe("ordering", () => {
    const rows = [
      payloadNewsRow({ id: "b", featured: false, publishedAt: "2026-05-20T08:19:37.159Z" }),
      payloadNewsRow({ id: "c", featured: true, publishedAt: "2024-03-20T00:00:00.000Z" }),
      payloadNewsRow({ id: "a", featured: true, publishedAt: "2024-01-15T00:00:00.000Z" }),
    ];

    it("orders `publishedAt desc` when nothing else applies", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: rows } as never);
      const result = await getRegularNews({ limit: 50 });
      expect(result.map((p) => p._id)).toEqual(["b", "c", "a"]);
    });

    it("puts featured first for getAllNews, then newest, exactly as `order(featured desc, publishedAt desc)` does", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: rows } as never);
      const result = await getAllNews({ limit: 50 });
      expect(result.map((p) => p._id)).toEqual(["c", "a", "b"]);
    });

    it("breaks a `publishedAt` tie by id ascending, matching the tie-break added to the GROQ", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          payloadNewsRow({ id: "zeta", featured: false, publishedAt: "2024-01-01T00:00:00.000Z" }),
          payloadNewsRow({ id: "alpha", featured: false, publishedAt: "2024-01-01T00:00:00.000Z" }),
        ],
      } as never);
      const result = await getRegularNews({ limit: 50 });
      expect(result.map((p) => p._id)).toEqual(["alpha", "zeta"]);
    });

    it("applies GROQ's slice after the order, not before", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: rows } as never);
      const result = await getAllNews({ limit: 1 });
      expect(result.map((p) => p._id)).toEqual(["c"]);
    });

    it("cannot honour a language preference, because `newsPost.language` is not a Payload field", async () => {
      // The divergence from Sanity, pinned rather than hidden. On Sanity
      // `order(language == "en" desc, publishedAt desc)` would lift the two
      // `language: "en"` documents above the newer one; here the term is
      // constant false and the order stays `publishedAt desc`. NO CALLER
      // PASSES A LANGUAGE — `getFeaturedNews(3)`, `getRegularNews({limit:50})`
      // and `getAllNews(parseNewsFilters(...))` are every call site, and
      // `NewsFiltersType` has no `language` key — so this is unreachable.
      mockPayloadQuery.mockResolvedValue({ docs: rows } as never);
      const withLanguage = await getRegularNews({ limit: 50, language: "en" });
      const without = await getRegularNews({ limit: 50 });
      expect(withLanguage.map((p) => p._id)).toEqual(without.map((p) => p._id));
    });
  });

  describe("filters", () => {
    it("expresses tags, communities and the date window as a Payload where clause", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getRegularNews({
        tags: ["t1"],
        communities: ["oceania"],
        dateFrom: "2026-01-01",
        dateTo: "2026-02-01",
      });
      const [descriptor] = mockPayloadQuery.mock.calls[0] as [{ where: { and: unknown[] } }];
      expect(descriptor.where.and).toEqual(
        expect.arrayContaining([
          { "tags.value": { in: ["t1"] } },
          { "relatedCommunity.slug": { in: ["oceania"] } },
          { publishedAt: { greater_than_equal: "2026-01-01" } },
          { publishedAt: { less_than_equal: "2026-02-01" } },
        ]),
      );
    });

    it("applies the free-text search here, because a Payload where resolves against one locale only", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          payloadNewsRow({ id: "hit", title: { en: null, fr: "Inondations en Oceanie" } }),
          payloadNewsRow({ id: "miss", title: { en: "Something else" } }),
        ],
      } as never);
      const result = await getRegularNews({ search: "inondation" });
      // Matched in `fr` while the read asked for every locale — the whole
      // reason this predicate is not a `where`.
      expect(result.map((p) => p._id)).toEqual(["hit"]);
    });

    it("reproduces GROQ's `match` — every pattern token must hit some word", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadNewsRow({ id: "n1", title: { en: "Flooding in Fiji" } })],
      } as never);
      // `news.ts` wraps the term as `*flood*`, so mid-token matching is the
      // intent: "flood" finds "flooding".
      await expect(getRegularNews({ search: "flood" })).resolves.toHaveLength(1);
      // A multi-word term splits into one glob per word, and only the first
      // and last carry a wildcard — so `*flooding` is "ends with flooding" and
      // `fiji*` is "starts with fiji", both of which hit.
      await expect(getRegularNews({ search: "flooding fiji" })).resolves.toHaveLength(1);
      // `*flood` alone is "ends with flood", which "flooding" does not, so a
      // multi-word term is stricter than a single one. That is GROQ's
      // behaviour, reproduced rather than smoothed over.
      await expect(getRegularNews({ search: "flood fiji" })).resolves.toHaveLength(0);
      await expect(getRegularNews({ search: "flooding samoa" })).resolves.toHaveLength(0);
      // A term present in no word at all matches nothing.
      await expect(getRegularNews({ search: "drought" })).resolves.toHaveLength(0);
    });

    it("excludes featured posts from the regular grid the way `(!defined(featured) || featured == false)` does", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getRegularNews();
      const [descriptor] = mockPayloadQuery.mock.calls[0] as [{ where: { and: unknown[] } }];
      expect(descriptor.where.and).toEqual(
        expect.arrayContaining([
          { or: [{ featured: { exists: false } }, { featured: { equals: false } }] },
        ]),
      );
    });
  });

  describe("the detail read", () => {
    it("matches on slug alone, with no publishedAt guard, as the GROQ does", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadNewsRow()] } as never);
      await getNewsPostBySlug("cop28-centring-mental-health");
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "find",
          collection: "newsPosts",
          where: { slug: { equals: "cop28-centring-mental-health" } },
        }),
      );
    });

    it("returns null when there is no match, as GROQ's `[0]` does", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await expect(getNewsPostBySlug("missing")).resolves.toBeNull();
    });

    it("adds the detail-only keys, including the ones Payload cannot leave unset", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [payloadNewsRow()] } as never);
      const post = await getNewsPostBySlug("cop28-centring-mental-health");
      expect(post?.sources).toBeNull();
      expect(post?.meta_title).toBeNull();
      expect(post?.ogImage).toBeNull();
      // Payload's checkbox defaults to false where an unset Sanity field is
      // null. Both falsy, and `generateMetadata` emits no robots tag either way.
      expect(post?.noindex).toBe(false);
    });
  });

  describe("the filter wrapper", () => {
    it("tallies each tag's news count from the posts rather than 68 correlated sub-queries", async () => {
      mockPayloadQuery
        .mockResolvedValueOnce({ docs: [{ tags: ["t1", "t2"] }, { tags: ["t1"] }] } as never)
        .mockResolvedValueOnce({
          docs: [
            { id: "t2", label: { en: "Research" }, value: "research", color: "#f97316", category: "topic" },
            { id: "t1", label: { en: "Climate Change", ar: "تغير المناخ" }, value: "climate-change", color: "#3b82f6", category: "topic" },
          ],
        } as never);

      const tags = await getNewsTags();
      // `order(label.en asc)`, with GROQ's codepoint comparison.
      expect(tags.map((t) => t._id)).toEqual(["t1", "t2"]);
      expect(tags.map((t) => t.newsCount)).toEqual([2, 1]);
      expect(Object.keys(tags[0].label)).toEqual(["ar", "en"]);
      // This array is a prop of `NewsFilters`, the only CLIENT component on any
      // news route, so its key order is in the RSC flight payload. Sanity
      // serializes an object's keys alphabetically regardless of the order the
      // projection wrote them.
      expect(Object.keys(tags[0])).toEqual(["_id", "category", "color", "label", "newsCount", "value"]);
    });

    it("skips the tag read entirely when no post carries a tag", async () => {
      mockPayloadQuery.mockResolvedValueOnce({ docs: [{ tags: [] }] } as never);
      await expect(getNewsTags()).resolves.toEqual([]);
      expect(mockPayloadQuery).toHaveBeenCalledTimes(1);
    });

    it("returns every regional community ordered by name.en, with its news count", async () => {
      mockPayloadQuery
        .mockResolvedValueOnce({
          docs: [
            { id: "rc-oce", slug: "oceania", name: { en: "Oceania Regional Community", es: null } },
            { id: "rc-csa", slug: "central-and-southern-asia", name: { en: "Central and Southern Asia Regional Community" } },
          ],
        } as never)
        .mockResolvedValueOnce({ docs: [{ relatedCommunity: "rc-oce" }, { relatedCommunity: null }] } as never);

      const communities = await getRegionalCommunities();
      expect(communities.map((c) => c.slug)).toEqual(["central-and-southern-asia", "oceania"]);
      expect(communities.map((c) => c.newsCount)).toEqual([0, 1]);
      // Same reason as the tags above.
      expect(Object.keys(communities[0])).toEqual(["_id", "name", "newsCount", "slug"]);
    });
  });

  describe("external sources", () => {
    it("gates on `approved` and keeps the `language` badge Payload does model here", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [
          {
            id: "e1",
            title: { en: "Eco-anxiety", es: null },
            excerpt: { en: "A review", es: null },
            sourceUrl: "https://example.org/a",
            publisher: "The Conversation",
            publishedAt: "2026-03-25T09:46:00.000Z",
            featured: false,
            sourceType: "news",
            language: "en",
            image: null,
            organizations: [],
            tags: [],
          },
        ],
      } as never);

      const [source] = await getApprovedExternalSources({ limit: 12 });
      expect(source._type).toBe("externalSource");
      // NOT trimmed, unlike a news post's: this document really is authored
      // `…:00.000Z` in Sanity, and `ExternalSourceCard` renders it raw into
      // `<time datetime>`. See the reader's note 4 — the rule is per
      // collection because no function of the instant produces both spellings.
      expect(source.publishedAt).toBe("2026-03-25T09:46:00.000Z");
      // Unlike `newsPost`, `externalSource.language` IS a Payload field, and it
      // is the one `language` the site actually renders.
      expect(source.language).toBe("en");
      expect(source.organizations).toBeNull();
      expect(source.tags).toBeNull();

      const [descriptor] = mockPayloadQuery.mock.calls[0] as [{ collection: string; where: unknown }];
      expect(descriptor.collection).toBe("externalSources");
      expect(descriptor.where).toEqual({ approved: { equals: true } });
    });
  });

  describe("the Algolia index docs (read only — nothing here writes an index)", () => {
    it("projects NEWS_INDEX_FIELDS, which is a different shape from NEWS_POST_FIELDS", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadNewsRow({ region: "oce", themes: [], populations: [], location: undefined })],
      } as never);
      const [doc] = await getPublishedNewsIndexDocs();
      // A BARE `slug` in the GROQ, so the slug object rather than the string.
      expect(doc.slug).toEqual({ _type: "slug", current: "cop28-centring-mental-health" });
      expect(doc.region).toBe("oce");
      // `[]` from a Payload `hasMany` select where GROQ returns null.
      expect(doc.themes).toBeNull();
      expect(doc.populations).toBeNull();
      expect(doc.location).toBeNull();
      expect(doc.author).toEqual({ _id: "author-britt-wray", name: "Dr. Britt Wray" });
    });

    it("converts a Payload point into the geopoint shape the index reads", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [payloadNewsRow({ location: [151.2093, -33.8688] })],
      } as never);
      const [doc] = await getPublishedNewsIndexDocs();
      // Payload stores `[lng, lat]`; Sanity's geopoint is `{lat, lng}`.
      expect(doc.location).toEqual({ _type: "geopoint", lat: -33.8688, lng: 151.2093 });
    });

    it("reads one document by id and returns null when there is none", async () => {
      mockPayloadQuery.mockResolvedValue(null as never);
      await expect(getNewsIndexDocById("missing")).resolves.toBeNull();
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ type: "findByID", collection: "newsPosts", id: "missing" }),
      );
    });

    it("reads a list by id through an `in` clause", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getNewsIndexDocsByIds(["n1", "n2"]);
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: ["n1", "n2"] } } }),
      );
    });
  });

  describe("the generic search records", () => {
    it("routes every record to /en, which is what Sanity's data already produces", async () => {
      // Sanity's four values are three `"en"` and one null, and
      // `["en","es","fr","ar"].includes(null ?? "")` is false — so the null one
      // already falls back to `en` there. With no Payload column, all four do.
      mockPayloadQuery.mockResolvedValue({
        docs: [{ id: "n1", slug: "cop28", title: { en: "COP28", es: null }, excerpt: { en: "Summary" } }],
      } as never);
      await expect(getNewsSearchRecords()).resolves.toEqual([
        {
          objectID: "n1",
          kind: "newsPost",
          title: "COP28",
          excerpt: "Summary",
          url: "/en/news/cop28",
          locale: "en",
        },
      ]);
    });

    it("degrades to an empty list when Payload fails, exactly as the Sanity arm does", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockPayloadQuery.mockRejectedValue(new Error("connection terminated"));
      await expect(getNewsSearchRecords()).resolves.toEqual([]);
    });
  });

  describe("failure behaviour is the domain module's, not the reader's", () => {
    it("throws through on a list read, because the page's Suspense boundary is the original behaviour", async () => {
      mockPayloadQuery.mockRejectedValue(new Error("connection terminated"));
      await expect(getFeaturedNews(3)).rejects.toThrow("connection terminated");
    });

    it("degrades to null on the OG read, because the original caught it", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockPayloadQuery.mockRejectedValue(new Error("connection terminated"));
      await expect(getNewsOgData("x")).resolves.toBeNull();
    });

    it("degrades to an empty list on the dynamic insert, because the original caught it", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockPayloadQuery.mockRejectedValue(new Error("connection terminated"));
      await expect(getDynamicNews({ regionalCommunityId: "rc1" })).resolves.toEqual([]);
    });
  });

  describe("the reads with no rendered surface", () => {
    it("getRelatedNews still issues no read at all when the post carries no tags", async () => {
      await expect(getRelatedNews("n1", [], 3)).resolves.toEqual([]);
      expect(mockPayloadQuery).not.toHaveBeenCalled();
    });

    it("getRelatedNews excludes the post itself and matches on tag ids", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getRelatedNews("news-cop28", ["t1"], 3);
      const [descriptor] = mockPayloadQuery.mock.calls[0] as [{ where: { and: unknown[] } }];
      expect(descriptor.where.and).toEqual(
        expect.arrayContaining([{ id: { not_equals: "news-cop28" } }, { tags: { in: ["t1"] } }]),
      );
    });

    it("getNewsSlugs returns every slug, ordered, with no publishedAt guard", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [{ slug: "a" }, { slug: "b" }] } as never);
      await expect(getNewsSlugs()).resolves.toEqual(["a", "b"]);
      expect(mockPayloadQuery).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "id", where: { slug: { exists: true } } }),
      );
    });

    it("getDynamicNews resolves `references($regionalCommunityId)` through relatedCommunity", async () => {
      mockPayloadQuery.mockResolvedValue({ docs: [] } as never);
      await getDynamicNews({ regionalCommunityId: "rc1", maxItems: 3 });
      const [descriptor] = mockPayloadQuery.mock.calls[0] as [{ where: { and: unknown[] } }];
      expect(descriptor.where.and).toEqual(
        expect.arrayContaining([{ relatedCommunity: { equals: "rc1" } }]),
      );
    });

    it("getNewsOgData reads relatedCommunity's name, not the region code", async () => {
      mockPayloadQuery.mockResolvedValue({
        docs: [{ id: "n1", title: { en: "COP28" }, relatedCommunity: { id: "rc-oce", name: { en: "Oceania Regional Community" } } }],
      } as never);
      await expect(getNewsOgData("cop28")).resolves.toEqual({
        title: { en: "COP28" },
        region: "Oceania Regional Community",
      });
    });
  });
});
