import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
}));

vi.mock("@/lib/content/internal/payload-source", () => ({
  nowMinute: () => "2026-09-17T10:00:00.000Z",
  escapeContains: (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`),
  query: vi.fn(),
  queryPreviewable: vi.fn(),
}));

import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import {
  query as payloadQuery,
  queryPreviewable as payloadQueryPreviewable,
} from "@/lib/content/internal/payload-source";
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
const mockPayloadQuery = vi.mocked(payloadQuery);
const mockPayloadQueryPreviewable = vi.mocked(payloadQueryPreviewable);

const noWhen: WhenFilter = { filter: "", params: {} };
const boundWhen: WhenFilter = { filter: " && date >= $whenFrom", params: { whenFrom: "2025-01-01" } };

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryPreviewable.mockReset();
  mockPayloadQuery.mockReset();
  mockPayloadQueryPreviewable.mockReset();
  // `activeBackend()` reads the environment per call, so an override left
  // behind by the Payload section below would redirect every Sanity test here.
  // Pin the Sanity arm explicitly: these suites assert Sanity behaviour and
  // must not read the ambient CONTENT_BACKEND (184 false failures under
  // `CONTENT_BACKEND=payload` before 2026-09-17). The Payload describes below
  // set the override to "payload" themselves.
  process.env.CONTENT_BACKEND_REGIONS = "sanity";
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_REGIONS;
  vi.restoreAllMocks();
});

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

// ---------------------------------------------------------------------------
// The same contract, answered by Payload
//
// The Sanity sections above make two kinds of assertion, and only one of them
// is portable:
//
//   - **Contract.** What the function returns, what it does when the source is
//     empty, and whether it degrades or throws. Both backends must satisfy
//     these, so each is restated here.
//   - **Query construction.** The GROQ text, the `[0...12]` slice interpolated
//     rather than bound, the `theme`-not-`themeSlug` param mismatch preserved
//     verbatim. These describe how Sanity is asked, not what the module
//     promises; a Payload reader has no GROQ string to assert against. The
//     *behaviour* each of them protects is restated below in Payload's own
//     terms — the slice as a cap on the returned rows, the theme as a `where`
//     clause — so nothing that was pinned stops being pinned.
//
// Three predicates cannot be expressed as a Payload `where` and are applied by
// the reader instead: the free-text match (GROQ searches all four locales at
// once; a Payload `where` resolves against one), the date window and the
// ordering (both over `coalesce(publishedAt, publishDate, _createdAt)`, which
// no single sort column expresses). Those get their own tests here, because a
// filter that moved from the database into JavaScript is exactly the kind of
// thing that quietly stops filtering.
// ---------------------------------------------------------------------------

function onPayload(): void {
  process.env.CONTENT_BACKEND_REGIONS = "payload";
}

/** One Payload row per call, in the order the readers issue them. */
function payloadDocs(...docs: Record<string, unknown>[]): void {
  mockPayloadQuery.mockResolvedValue({ docs });
}

describe("the same contract, answered by Payload — getThemeOptions", () => {
  it("maps valid rows to ThemeOption[]", async () => {
    onPayload();
    payloadDocs({ value: "displacement", label: { en: "Displacement", es: "Desplazamiento" } });
    await expect(getThemeOptions()).resolves.toEqual([
      { slug: "displacement", label: { en: "Displacement", es: "Desplazamiento", fr: undefined, ar: undefined } },
    ]);
  });

  it("filters out rows with no slug or no label", async () => {
    onPayload();
    payloadDocs(
      { value: null, label: { en: "No slug" } },
      { value: "youth", label: null },
      { value: "indigenous", label: { en: "Indigenous" } },
    );
    const result = await getThemeOptions();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("indigenous");
  });

  it("falls back to FALLBACK_THEMES when the source returns no valid rows", async () => {
    onPayload();
    payloadDocs();
    await expect(getThemeOptions()).resolves.toEqual(FALLBACK_THEMES);
  });

  it("falls back to FALLBACK_THEMES (degrades) when the source fails", async () => {
    onPayload();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPayloadQuery.mockRejectedValue(new Error("connection terminated"));
    await expect(getThemeOptions()).resolves.toEqual(FALLBACK_THEMES);
  });

  it("uses query, not queryPreviewable — the same primitive the Sanity twin picks", async () => {
    onPayload();
    payloadDocs();
    await getThemeOptions();
    expect(mockPayloadQuery).toHaveBeenCalledTimes(1);
    expect(mockPayloadQueryPreviewable).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("asks only for tags flagged useAsTheme", async () => {
    onPayload();
    payloadDocs();
    await getThemeOptions();
    expect(mockPayloadQuery).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "tags", where: { useAsTheme: { equals: true } } }),
    );
  });
});

describe("the same contract, answered by Payload — getRegionArt", () => {
  const heroWith = (url: string, lqip: string | null) => ({
    en: { image: { asset: { url, lqip } } },
  });

  it("keys returned art by region code via RC_SLUG_TO_REGION", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockResolvedValue({
      docs: [{ slug: "oceania", welcomeHero: heroWith("https://example.com/oceania.jpg", "data:lqip") }],
    });
    await expect(getRegionArt()).resolves.toEqual({
      oce: { url: "https://example.com/oceania.jpg", lqip: "data:lqip" },
    });
  });

  it("skips rows with an unknown slug or a missing image", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockResolvedValue({
      docs: [
        { slug: "not-a-real-region", welcomeHero: heroWith("https://example.com/x.jpg", null) },
        { slug: "oceania", welcomeHero: { en: { image: { asset: null } } } },
      ],
    });
    await expect(getRegionArt()).resolves.toEqual({});
  });

  it("takes the first locale that carries art — Payload holds one document per region, Sanity four", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockResolvedValue({
      docs: [
        {
          slug: "oceania",
          welcomeHero: {
            en: { image: { asset: null } },
            es: { image: { asset: { url: "https://example.com/es.jpg", lqip: null } } },
            fr: { image: { asset: { url: "https://example.com/fr.jpg", lqip: null } } },
          },
        },
      ],
    });
    await expect(getRegionArt()).resolves.toEqual({ oce: { url: "https://example.com/es.jpg", lqip: null } });
  });

  it("degrades to {} when the source fails", async () => {
    onPayload();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPayloadQueryPreviewable.mockRejectedValue(new Error("network error"));
    await expect(getRegionArt()).resolves.toEqual({});
  });

  it("uses queryPreviewable, not query — so an editor's unpublished hero still previews", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockResolvedValue({ docs: [] });
    await getRegionArt();
    expect(mockPayloadQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockPayloadQuery).not.toHaveBeenCalled();
  });
});

describe("the same contract, answered by Payload — the five atlas reads", () => {
  const caseStudy = (over: Record<string, unknown> = {}) => ({
    id: "cs1",
    title: { en: "A flood story" },
    slug: "a",
    image: null,
    region: "oce",
    relatedCommunity: null,
    locationCountryCode: "AUS",
    locationDisplayText: "Sydney, Australia",
    locationText: null,
    studyLocation: { lat: -33, lng: 151 },
    locationPrecision: "exact",
    publishedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2020-01-01T00:00:00.000Z",
    ...over,
  });

  it("getRegionHighlightItems returns the card row plus its regionKey", async () => {
    onPayload();
    payloadDocs(caseStudy());
    const result = await getRegionHighlightItems("caseStudy", { theme: "", q: "", when: noWhen });
    expect(result).toEqual([
      {
        id: "cs1",
        type: "caseStudy",
        title: "A flood story",
        slug: "a",
        image: null,
        imageLqip: null,
        place: "Sydney, Australia",
        countryCode3: "AUS",
        date: "2026-01-01T00:00:00.000Z",
        regionKey: "oce",
      },
    ]);
  });

  it("getRegionHighlightItems drops rows with no geotag at all", async () => {
    onPayload();
    payloadDocs(caseStudy({ id: "geo", studyLocation: null, locationCountryCode: null }));
    await expect(getRegionHighlightItems("caseStudy", { theme: "", q: "", when: noWhen })).resolves.toEqual([]);
  });

  it("getRegionHighlightItems orders by the coalesced date, newest first, and caps at 30", async () => {
    onPayload();
    payloadDocs(
      ...Array.from({ length: 33 }, (_, i) =>
        caseStudy({ id: `cs${i}`, publishedAt: `20${String(10 + i).padStart(2, "0")}-01-01T00:00:00.000Z` }),
      ),
    );
    const result = await getRegionHighlightItems("caseStudy", { theme: "", q: "", when: noWhen });
    expect(result).toHaveLength(30);
    expect(result[0].id).toBe("cs32");
    expect(result[29].id).toBe("cs3");
  });

  it("getRegionHighlightItems falls back through publishedAt -> createdAt, like coalesce()", async () => {
    onPayload();
    payloadDocs(caseStudy({ publishedAt: null }));
    const [item] = await getRegionHighlightItems("caseStudy", { theme: "", q: "", when: noWhen });
    expect(item.date).toBe("2020-01-01T00:00:00.000Z");
  });

  it("getRegionHighlightItems matches free text across ALL four locales, which a Payload where cannot", async () => {
    onPayload();
    payloadDocs(
      caseStudy({ id: "en-hit", title: { en: "Flooding in Fiji" } }),
      caseStudy({ id: "ar-hit", title: { en: "Something else", ar: "الفيضانات flood" } }),
      caseStudy({ id: "miss", title: { en: "Drought in Kenya" } }),
    );
    const result = await getRegionHighlightItems("caseStudy", { theme: "", q: "flood", when: noWhen });
    expect(result.map((r) => r.id).sort()).toEqual(["ar-hit", "en-hit"]);
  });

  it("getRegionHighlightItems matches on word prefixes, not substrings — GROQ's `match`, not `includes`", async () => {
    onPayload();
    payloadDocs(
      caseStudy({ id: "prefix", title: { en: "Flooding in Fiji" } }),
      caseStudy({ id: "midword", title: { en: "Backflooding" } }),
    );
    const result = await getRegionHighlightItems("caseStudy", { theme: "", q: "flood", when: noWhen });
    expect(result.map((r) => r.id)).toEqual(["prefix"]);
  });

  it("getRegionHighlightItems applies the `when` window from its bound params, not its GROQ", async () => {
    onPayload();
    payloadDocs(
      caseStudy({ id: "recent", publishedAt: "2026-06-01T00:00:00.000Z" }),
      caseStudy({ id: "old", publishedAt: "2019-06-01T00:00:00.000Z" }),
    );
    const result = await getRegionHighlightItems("caseStudy", {
      theme: "",
      q: "",
      when: { filter: " && date >= $whenFrom", params: { whenFrom: "2025-01-01" } },
    });
    expect(result.map((r) => r.id)).toEqual(["recent"]);
  });

  it("getRegionHighlightItems throws (does not degrade) when the source fails", async () => {
    onPayload();
    mockPayloadQuery.mockRejectedValue(new Error("timeout"));
    await expect(getRegionHighlightItems("caseStudy", { theme: "", q: "", when: noWhen })).rejects.toThrow("timeout");
  });

  it("getRegionRecentItems caps at the requested limit", async () => {
    onPayload();
    payloadDocs(...Array.from({ length: 9 }, (_, i) => caseStudy({ id: `cs${i}` })));
    await expect(
      getRegionRecentItems("caseStudy", { theme: "", q: "", when: noWhen, limit: 6 }),
    ).resolves.toHaveLength(6);
  });

  it("getRegionRecentItems throws (does not degrade) when the source fails", async () => {
    onPayload();
    mockPayloadQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(
      getRegionRecentItems("newsPost", { theme: "", q: "", when: noWhen, limit: 6 }),
    ).rejects.toThrow("upstream 500");
  });

  it("getRegionFacetItems sends the region disjunction and the approved-only gate as one where", async () => {
    onPayload();
    payloadDocs();
    await getRegionFacetItems("caseStudy", {
      region: "oce",
      slug: "oceania",
      regionCountries: ["AUS", "NZL"],
      theme: "youth",
      q: "",
      when: noWhen,
    });
    expect(mockPayloadQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "caseStudies",
        where: {
          and: [
            { moderationStatus: { equals: "approved" } },
            { "tags.value": { equals: "youth" } },
            {
              or: [
                { region: { equals: "oce" } },
                { "relatedCommunity.slug": { equals: "oceania" } },
                { locationCountryCode: { in: ["AUS", "NZL"] } },
              ],
            },
          ],
        },
      }),
    );
  });

  it("getRegionFacetItems keeps a doc attributed only by its community reference — no geotag needed", async () => {
    onPayload();
    payloadDocs(caseStudy({ studyLocation: null, locationCountryCode: null }));
    await expect(
      getRegionFacetItems("caseStudy", {
        region: "oce",
        slug: "oceania",
        regionCountries: [],
        theme: "",
        q: "",
        when: noWhen,
      }),
    ).resolves.toHaveLength(1);
  });

  it("getRegionFacetItems throws (does not degrade) when the source fails", async () => {
    onPayload();
    mockPayloadQuery.mockRejectedValue(new Error("network error"));
    await expect(
      getRegionFacetItems("caseStudy", { region: "oce", slug: "oceania", regionCountries: [], theme: "", q: "", when: noWhen }),
    ).rejects.toThrow("network error");
  });

  it("getRegionPinRows projects the per-type place fields", async () => {
    onPayload();
    payloadDocs(caseStudy());
    await expect(
      getRegionPinRows("caseStudy", {
        region: "oce",
        slug: "oceania",
        regionCountries: ["AUS"],
        themeSlug: null,
        q: "",
        when: noWhen,
      }),
    ).resolves.toEqual([
      { _id: "cs1", title: "A flood story", slug: "a", point: { lat: -33, lng: 151 }, precision: "exact", countryCode3: "AUS" },
    ]);
  });

  it("getRegionPinRows converts Payload's [lng, lat] point array to Sanity's {lat, lng} geopoint", async () => {
    onPayload();
    // Payload serialises a `point` field the GeoJSON way. Handed through
    // unconverted, `point.lat` is undefined, `projectPoint` returns null and
    // the pin silently disappears from the map — measured as 24 case-study
    // pins against 8 before this conversion existed.
    payloadDocs(caseStudy({ studyLocation: [151.2, -33.8] }));
    const [pin] = await getRegionPinRows("caseStudy", {
      region: "all",
      slug: "",
      regionCountries: [],
      themeSlug: null,
      q: "",
      when: noWhen,
    });
    expect(pin.point).toEqual({ lat: -33.8, lng: 151.2 });
  });

  it("getRegionHighlightItems counts a [lng, lat] array as a geotag", async () => {
    onPayload();
    payloadDocs(caseStudy({ studyLocation: [151.2, -33.8], locationCountryCode: null }));
    await expect(getRegionHighlightItems("caseStudy", { theme: "", q: "", when: noWhen })).resolves.toHaveLength(1);
  });

  it("getRegionPinRows drops the region predicate entirely for the global map", async () => {
    onPayload();
    payloadDocs();
    await getRegionPinRows("caseStudy", {
      region: "all",
      slug: "",
      regionCountries: [],
      themeSlug: null,
      q: "",
      when: noWhen,
    });
    expect(mockPayloadQuery).toHaveBeenCalledWith(
      expect.objectContaining({ where: { moderationStatus: { equals: "approved" } } }),
    );
  });

  it("getRegionPinRows throws (does not degrade) when the source fails", async () => {
    onPayload();
    mockPayloadQuery.mockRejectedValue(new Error("timeout"));
    await expect(
      getRegionPinRows("caseStudy", { region: "oce", slug: "oceania", regionCountries: [], themeSlug: null, q: "", when: noWhen }),
    ).rejects.toThrow("timeout");
  });

  it("getRegionFacetCounts projects the four region-attribution fields, with no region predicate", async () => {
    onPayload();
    payloadDocs(caseStudy({ relatedCommunity: { id: "rc", slug: "oceania" } }));
    await expect(getRegionFacetCounts("caseStudy", { theme: null, q: "", when: noWhen })).resolves.toEqual([
      { code: "oce", rcSlug: "oceania", rcSlugs: null, countryCode3: "AUS" },
    ]);
    expect(mockPayloadQuery).toHaveBeenCalledWith(
      expect.objectContaining({ where: { moderationStatus: { equals: "approved" } } }),
    );
  });

  it("getRegionFacetCounts reads researchOutput's plural community list", async () => {
    onPayload();
    payloadDocs({
      id: "ro1",
      title: { en: "An agenda" },
      slug: "an-agenda",
      region: null,
      relatedCommunities: [{ id: "rc", slug: "oceania" }],
      place: { countryCode: "FJI" },
      publishDate: "2024-03-18T00:00:00.000Z",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    await expect(getRegionFacetCounts("researchOutput", { theme: null, q: "", when: noWhen })).resolves.toEqual([
      { code: null, rcSlug: null, rcSlugs: ["oceania"], countryCode3: "FJI" },
    ]);
  });

  it("getRegionFacetCounts queries the collection named by the content type", async () => {
    onPayload();
    payloadDocs();
    await getRegionFacetCounts("newsPost", { theme: null, q: "", when: noWhen });
    expect(mockPayloadQuery).toHaveBeenCalledWith(expect.objectContaining({ collection: "newsPosts" }));
  });

  it("getRegionFacetCounts throws (does not degrade) when the source fails", async () => {
    onPayload();
    mockPayloadQuery.mockRejectedValue(new Error("network error"));
    await expect(getRegionFacetCounts("caseStudy", { theme: null, q: "", when: noWhen })).rejects.toThrow("network error");
  });

  it("reproduces livedExperience's unset-means-approved gate", async () => {
    onPayload();
    payloadDocs();
    await getRegionFacetCounts("livedExperience", { theme: null, q: "", when: noWhen });
    expect(mockPayloadQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "livedExperiences",
        where: {
          or: [{ moderationStatus: { equals: "approved" } }, { moderationStatus: { exists: false } }],
        },
      }),
    );
  });

  it("reads through the Payload source only — the Sanity source is never touched", async () => {
    onPayload();
    payloadDocs();
    await getRegionFacetCounts("newsPost", { theme: null, q: "", when: noWhen });
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
