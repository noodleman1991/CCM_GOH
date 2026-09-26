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

vi.mock("@/lib/content/case-studies", () => ({ getCaseStudySearchRecords: vi.fn() }));
vi.mock("@/lib/content/news", () => ({ getNewsSearchRecords: vi.fn() }));
vi.mock("@/lib/content/outputs", () => ({
  getAgendaSearchRecords: vi.fn(),
  getResearchOutputSearchRecords: vi.fn(),
}));

import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import {
  query as payloadQuery,
  queryPreviewable as payloadQueryPreviewable,
} from "@/lib/content/internal/payload-source";
import { getCaseStudySearchRecords } from "@/lib/content/case-studies";
import { getNewsSearchRecords } from "@/lib/content/news";
import { getAgendaSearchRecords, getResearchOutputSearchRecords } from "@/lib/content/outputs";
import {
  getSiteAnnouncement,
  getSitemapEntries,
  getDocsChapters,
  getDocsChapter,
  getFreshContentRows,
  getSearchIndexRecords,
} from "@/lib/content/system";

const mockQuery = vi.mocked(query);
const mockQueryPreviewable = vi.mocked(queryPreviewable);
const mockPayloadQuery = vi.mocked(payloadQuery);
const mockPayloadQueryPreviewable = vi.mocked(payloadQueryPreviewable);
const mockCaseStudySearchRecords = vi.mocked(getCaseStudySearchRecords);
const mockNewsSearchRecords = vi.mocked(getNewsSearchRecords);
const mockAgendaSearchRecords = vi.mocked(getAgendaSearchRecords);
const mockResearchOutputSearchRecords = vi.mocked(getResearchOutputSearchRecords);

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryPreviewable.mockReset();
  mockPayloadQuery.mockReset();
  mockPayloadQueryPreviewable.mockReset();
  // Every `describe` above this file's two-backend section is the Sanity
  // contract, and `activeBackend()` reads the environment per call, so an
  // override left behind by the Payload section would silently redirect them.
  // Pin the Sanity arm explicitly: these suites assert Sanity behaviour and
  // must not read the ambient CONTENT_BACKEND (184 false failures under
  // `CONTENT_BACKEND=payload` before 2026-09-17). The Payload describes below
  // set the override to "payload" themselves.
  process.env.CONTENT_BACKEND_SYSTEM = "sanity";
  mockCaseStudySearchRecords.mockReset();
  mockNewsSearchRecords.mockReset();
  mockAgendaSearchRecords.mockReset();
  mockResearchOutputSearchRecords.mockReset();
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.org";
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_SYSTEM;
  vi.restoreAllMocks();
  process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
});

describe("getSiteAnnouncement", () => {
  it("reads via queryPreviewable, not query — draft preview must stay alive", async () => {
    mockQueryPreviewable.mockResolvedValue({
      enabled: true,
      variant: "brand",
      message: { en: "Hello" },
      dismissible: true,
    });
    const result = await getSiteAnnouncement();
    expect(result).toEqual({
      enabled: true,
      variant: "brand",
      message: { en: "Hello" },
      dismissible: true,
    });
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns null when no singleton document exists", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    await expect(getSiteAnnouncement()).resolves.toBeNull();
  });

  it("propagates a failure — no try/catch in the original or its caller", async () => {
    mockQueryPreviewable.mockRejectedValue(new Error("network down"));
    await expect(getSiteAnnouncement()).rejects.toThrow("network down");
  });
});

describe("getSitemapEntries", () => {
  it("assembles the page doctype's entries plus per-locale content entries with alternates, via queryPreviewable", async () => {
    mockQueryPreviewable.mockImplementation(async (groq: string) => {
      if (groq.includes("_type == 'page'")) {
        return [
          { url: "https://example.org/about", lastModified: "2024-01-01T00:00:00Z", changeFrequency: "daily", priority: 0.5 },
        ];
      }
      if (groq.includes('_type == "caseStudy"')) {
        return [{ slug: "study-1", lastModified: "2024-02-02T00:00:00Z" }];
      }
      return [];
    });

    const entries = await getSitemapEntries();

    expect(mockQuery).not.toHaveBeenCalled();
    expect(entries).toContainEqual({
      url: "https://example.org/about",
      lastModified: "2024-01-01T00:00:00Z",
      changeFrequency: "daily",
      priority: 0.5,
    });
    expect(entries).toContainEqual({
      url: "https://example.org/en/research-and-action/case-studies/study-1",
      lastModified: "2024-02-02T00:00:00Z",
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          en: "https://example.org/en/research-and-action/case-studies/study-1",
          es: "https://example.org/es/research-and-action/case-studies/study-1",
          fr: "https://example.org/fr/research-and-action/case-studies/study-1",
          ar: "https://example.org/ar/research-and-action/case-studies/study-1",
        },
      },
    });
  });

  it("propagates a pages-query failure — the original had no try/catch around it", async () => {
    mockQueryPreviewable.mockImplementation(async (groq: string) => {
      if (groq.includes("_type == 'page'")) throw new Error("pages down");
      return [];
    });
    await expect(getSitemapEntries()).rejects.toThrow("pages down");
  });

  it("degrades a single failing content type to [] without failing the others", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQueryPreviewable.mockImplementation(async (groq: string) => {
      if (groq.includes("_type == 'page'")) return [];
      if (groq.includes('_type == "newsPost"')) throw new Error("news down");
      if (groq.includes('_type == "caseStudy"')) return [{ slug: "study-1", lastModified: "2024-02-02T00:00:00Z" }];
      return [];
    });

    const entries = await getSitemapEntries();

    expect(entries.some((e) => e.url.includes("/news/"))).toBe(false);
    expect(entries.some((e) => e.url.includes("/case-studies/study-1"))).toBe(true);
  });

  it("emits no agenda or report entries — neither has a detail route (Decision 11)", async () => {
    mockQueryPreviewable.mockImplementation(async (groq: string) => {
      if (groq.includes("_type == 'page'")) return [];
      if (groq.includes('_type == "agenda"') || groq.includes('_type == "report"')) {
        return [{ slug: "africa", lastModified: "2024-01-01T00:00:00Z" }];
      }
      return [];
    });
    const entries = await getSitemapEntries();
    expect(entries.some((e) => e.url.includes("/research-and-action/agendas/"))).toBe(false);
    expect(entries.some((e) => e.url.includes("/research-and-action/reports/"))).toBe(false);
    const groqs = mockQueryPreviewable.mock.calls.map(([groq]) => String(groq));
    expect(groqs.some((g) => g.includes('_type == "agenda"') || g.includes('_type == "report"'))).toBe(false);
  });
});

describe("getDocsChapters", () => {
  it("passes the collection through as a query param, via query", async () => {
    mockQuery.mockResolvedValue([{ slug: "intro", title: "Intro", order: 1 }]);
    const result = await getDocsChapters("global-agenda");
    expect(result).toEqual([{ slug: "intro", title: "Intro", order: 1 }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { collection: "global-agenda" });
  });

  it("propagates a failure — the original client.fetch call had no try/catch", async () => {
    mockQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getDocsChapters("global-agenda")).rejects.toThrow("upstream 500");
  });
});

describe("getDocsChapter", () => {
  it("passes collection + slug through as query params, via query", async () => {
    mockQuery.mockResolvedValue({ title: "Intro", order: 1, body: [] });
    const result = await getDocsChapter("global-agenda", "intro");
    expect(result).toEqual({ title: "Intro", order: 1, body: [] });
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { collection: "global-agenda", slug: "intro" });
  });

  it("returns null when there's no matching chapter", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getDocsChapter("global-agenda", "missing")).resolves.toBeNull();
  });
});

describe("getFreshContentRows", () => {
  it("queries all four card-capable types and flattens the results", async () => {
    mockQuery.mockImplementation(async (_groq: string, params?: Record<string, unknown>) => {
      if (params?.type === "caseStudy") return [{ id: "cs1", type: "caseStudy" }];
      if (params?.type === "newsPost") return [{ id: "n1", type: "newsPost" }];
      return [];
    });

    const rows = await getFreshContentRows(5);

    expect(mockQuery).toHaveBeenCalledTimes(4);
    expect(rows).toEqual(
      expect.arrayContaining([
        { id: "cs1", type: "caseStudy" },
        { id: "n1", type: "newsPost" },
      ]),
    );
  });

  it("interpolates the cap and per-type status filter into the query text", async () => {
    mockQuery.mockResolvedValue([]);
    await getFreshContentRows(7);

    const caseStudyCall = mockQuery.mock.calls.find(([, params]) => (params as { type?: string })?.type === "caseStudy");
    expect(caseStudyCall?.[0]).toContain("[0...7]");
    expect(caseStudyCall?.[0]).toContain('&& status == "approved"');

    const newsCall = mockQuery.mock.calls.find(([, params]) => (params as { type?: string })?.type === "newsPost");
    expect(newsCall?.[0]).not.toMatch(/&& status ==/);
  });

  // `publishedAt` is a near-total tie (25 of 28 case studies share
  // 2024-01-01T00:00:00Z; all 29 research outputs share 2024-03-18), so
  // `order(… desc)` alone is unordered in practice and the two backends would
  // pick different representatives. `_id asc` is the tie-break that reproduces
  // what Sanity already returns — measured against production_2, where `_id
  // desc` and `_createdAt asc` both reorder case studies and this does not.
  it("breaks the date tie by _id ascending, the order Sanity already served", async () => {
    mockQuery.mockResolvedValue([]);
    await getFreshContentRows(5);
    for (const [groq] of mockQuery.mock.calls) {
      expect(groq).toContain("order(coalesce(publishedAt, publishDate, _createdAt) desc, _id asc)");
    }
  });

  it("degrades a single failing type to [] without failing the others", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockImplementation(async (_groq: string, params?: Record<string, unknown>) => {
      const type = (params as { type?: string })?.type;
      if (type === "newsPost") throw new Error("news down");
      return [{ id: `${type}-1`, type }];
    });

    const rows = await getFreshContentRows(5);

    expect(rows.some((r) => r.type === "newsPost")).toBe(false);
    expect(rows.some((r) => r.type === "caseStudy")).toBe(true);
  });

  it("treats a null query result as empty", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getFreshContentRows(5)).resolves.toEqual([]);
  });
});

describe("getSearchIndexRecords", () => {
  it("delegates caseStudy to getCaseStudySearchRecords", async () => {
    mockCaseStudySearchRecords.mockResolvedValue([
      { objectID: "cs1", kind: "caseStudy", title: "A study", url: "/en/x", locale: "en" },
    ]);
    await expect(getSearchIndexRecords("caseStudy")).resolves.toEqual([
      { objectID: "cs1", kind: "caseStudy", title: "A study", url: "/en/x", locale: "en" },
    ]);
    expect(mockCaseStudySearchRecords).toHaveBeenCalledTimes(1);
  });

  it("delegates newsPost to getNewsSearchRecords", async () => {
    mockNewsSearchRecords.mockResolvedValue([
      { objectID: "n1", kind: "newsPost", title: "A post", url: "/en/y", locale: "en" },
    ]);
    await expect(getSearchIndexRecords("newsPost")).resolves.toEqual([
      { objectID: "n1", kind: "newsPost", title: "A post", url: "/en/y", locale: "en" },
    ]);
  });

  it("delegates agenda to getAgendaSearchRecords", async () => {
    mockAgendaSearchRecords.mockResolvedValue([
      { objectID: "a1", kind: "agenda", title: "An agenda", url: "/en/z", locale: "en" },
    ]);
    await expect(getSearchIndexRecords("agenda")).resolves.toEqual([
      { objectID: "a1", kind: "agenda", title: "An agenda", url: "/en/z", locale: "en" },
    ]);
  });

  it("delegates researchOutput to getResearchOutputSearchRecords", async () => {
    mockResearchOutputSearchRecords.mockResolvedValue([
      { objectID: "ro1", kind: "researchOutput", title: "An output", url: "/en/w", locale: "en" },
    ]);
    await expect(getSearchIndexRecords("researchOutput")).resolves.toEqual([
      { objectID: "ro1", kind: "researchOutput", title: "An output", url: "/en/w", locale: "en" },
    ]);
  });

  it("returns [] for livedExperience — no Algolia index or per-domain producer exists yet", async () => {
    await expect(getSearchIndexRecords("livedExperience")).resolves.toEqual([]);
    expect(mockCaseStudySearchRecords).not.toHaveBeenCalled();
    expect(mockNewsSearchRecords).not.toHaveBeenCalled();
    expect(mockAgendaSearchRecords).not.toHaveBeenCalled();
    expect(mockResearchOutputSearchRecords).not.toHaveBeenCalled();
  });

  it("returns [] for event — no Algolia index or per-domain producer exists yet", async () => {
    await expect(getSearchIndexRecords("event")).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The same contract, answered by Payload
// ---------------------------------------------------------------------------
//
// These are not new assertions. Each one is an assertion already made above
// against Sanity, made again against Payload — same call, same expected value,
// different store underneath. That is the whole claim the seam makes: a caller
// cannot tell which backend answered.
//
// What differs per backend is only the RAW ROW fed in, because the two stores
// genuinely store these documents differently, and a test that fed both the
// same row would be testing nothing:
//
//   - Sanity's `status` is Payload's `moderationStatus` (the name `status`
//     collides with Payload's own `_status` enum), and the filter is a `Where`
//     object rather than a substring of a GROQ string.
//   - Sanity spells an unset field by omitting it; Payload spells it `null`.
//   - `_updatedAt` is `sanityUpdatedAt` — Payload overwrites its own
//     `updatedAt` on every save, so a sitemap stamped with it would claim the
//     import date on every URL.
//   - A `richText` column is Lexical, not Portable Text, and its embedded
//     images carry a `media` relationship where Sanity carries `asset`.
//
// Anything genuinely about HOW Sanity is queried — the GROQ text, the bound
// params, the interpolated slice — stays in the sections above. Those are not
// portable, and asserting a Payload reader against a GROQ string it does not
// have would be asserting nothing. Every behaviour they protect is restated
// here in Payload's own terms.
// ---------------------------------------------------------------------------

function onPayload(): void {
  process.env.CONTENT_BACKEND_SYSTEM = "payload";
}

/** The `Where` handed to the Nth Payload read. */
function whereOf(mock: typeof mockPayloadQuery, index = 0): unknown {
  return (mock.mock.calls[index]?.[0] as { where?: unknown } | undefined)?.where;
}

describe("getSiteAnnouncement, answered by Payload", () => {
  it("returns the same SiteAnnouncement, projected to the seven fields the GROQ names", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockResolvedValue({
      // Payload's findGlobal also returns these four, and none of them is in
      // the Sanity projection or read by the announcement bar.
      id: 1,
      globalType: "siteAnnouncement",
      createdAt: "2026-06-16T22:46:46.000Z",
      updatedAt: "2026-09-04T11:17:09.110Z",
      enabled: true,
      variant: "brand",
      message: { en: "Hello", es: null, fr: null, ar: null },
      dismissible: true,
      startsAt: null,
      endsAt: null,
      link: { url: null, label: null },
    });
    const result = await getSiteAnnouncement();
    expect(result).toEqual({
      enabled: true,
      variant: "brand",
      message: { en: "Hello" },
      dismissible: true,
      startsAt: undefined,
      endsAt: undefined,
      link: { url: undefined, label: undefined },
    });
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });

  it("reads via queryPreviewable, not query — draft preview must stay alive on both backends", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockResolvedValue({ enabled: false });
    await getSiteAnnouncement();
    expect(mockPayloadQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockPayloadQuery).not.toHaveBeenCalled();
  });

  it("returns null when no singleton document exists", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockResolvedValue(null);
    await expect(getSiteAnnouncement()).resolves.toBeNull();
  });

  it("propagates a failure — no try/catch in the original or its caller", async () => {
    onPayload();
    mockPayloadQueryPreviewable.mockRejectedValue(new Error("network down"));
    await expect(getSiteAnnouncement()).rejects.toThrow("network down");
  });
});

describe("getSitemapEntries, answered by Payload", () => {
  /** One `find` result per Payload collection the sitemap reads. */
  function respond(byCollection: Record<string, { docs: unknown[] } | Error>) {
    mockPayloadQueryPreviewable.mockImplementation(async (descriptor: unknown) => {
      const collection = (descriptor as { collection?: string }).collection ?? "";
      const answer = byCollection[collection];
      if (answer instanceof Error) throw answer;
      return (answer ?? { docs: [] }) as never;
    });
  }

  it("assembles the page doctype's entries plus per-locale content entries with alternates", async () => {
    onPayload();
    respond({
      pages: { docs: [{ id: "page-about-en", slug: "about", sanityUpdatedAt: "2024-01-01T00:00:00Z" }] },
      caseStudies: { docs: [{ id: "cs1", slug: "study-1", sanityUpdatedAt: "2024-02-02T00:00:00Z" }] },
    });

    const entries = await getSitemapEntries();

    expect(mockQueryPreviewable).not.toHaveBeenCalled();
    expect(entries).toContainEqual({
      url: "https://example.org/about",
      lastModified: "2024-01-01T00:00:00Z",
      changeFrequency: "daily",
      priority: 0.5,
    });
    expect(entries).toContainEqual({
      url: "https://example.org/en/research-and-action/case-studies/study-1",
      lastModified: "2024-02-02T00:00:00Z",
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          en: "https://example.org/en/research-and-action/case-studies/study-1",
          es: "https://example.org/es/research-and-action/case-studies/study-1",
          fr: "https://example.org/fr/research-and-action/case-studies/study-1",
          ar: "https://example.org/ar/research-and-action/case-studies/study-1",
        },
      },
    });
  });

  it("treats the `index` page as the site root, as the GROQ's select() does", async () => {
    onPayload();
    respond({ pages: { docs: [{ id: "home", slug: "index", sanityUpdatedAt: "2024-01-01T00:00:00Z" }] } });
    const entries = await getSitemapEntries();
    expect(entries).toContainEqual({
      url: "https://example.org",
      lastModified: "2024-01-01T00:00:00Z",
      changeFrequency: "daily",
      priority: 1,
    });
  });

  it("propagates a pages failure — the original had no try/catch around it", async () => {
    onPayload();
    respond({ pages: new Error("pages down") });
    await expect(getSitemapEntries()).rejects.toThrow("pages down");
  });

  it("degrades a single failing content type to [] without failing the others", async () => {
    onPayload();
    vi.spyOn(console, "error").mockImplementation(() => {});
    respond({
      newsPosts: new Error("news down"),
      caseStudies: { docs: [{ id: "cs1", slug: "study-1", sanityUpdatedAt: "2024-02-02T00:00:00Z" }] },
    });

    const entries = await getSitemapEntries();

    expect(entries.some((e) => e.url.includes("/news/"))).toBe(false);
    expect(entries.some((e) => e.url.includes("/case-studies/study-1"))).toBe(true);
  });

  it("stamps lastModified from sanityUpdatedAt, never Payload's own updatedAt", async () => {
    onPayload();
    respond({
      caseStudies: {
        docs: [{ id: "cs1", slug: "study-1", sanityUpdatedAt: "2024-02-02T00:00:00Z", updatedAt: "2026-09-04T00:00:00Z" }],
      },
    });
    const entries = await getSitemapEntries();
    const entry = entries.find((e) => e.url.endsWith("/case-studies/study-1"));
    expect(entry?.lastModified).toBe("2024-02-02T00:00:00Z");
  });

  it("applies each type's own moderation rule — strict for case studies and research outputs, loose for lived experiences, none for news", async () => {
    onPayload();
    respond({});
    await getSitemapEntries();

    const whereFor = (collection: string) =>
      (
        mockPayloadQueryPreviewable.mock.calls
          .map(([descriptor]) => descriptor as { collection?: string; where?: unknown })
          .find((d) => d.collection === collection) ?? {}
      ).where;

    const approved = { moderationStatus: { equals: "approved" } };
    const slugged = { slug: { exists: true } };
    expect(whereFor("caseStudies")).toEqual({ and: [approved, slugged] });
    expect(whereFor("researchOutputs")).toEqual({ and: [approved, slugged] });
    expect(whereFor("events")).toEqual({ and: [approved, slugged] });
    // The `exists: false` arm is livedExperience's alone: the field is 0/56
    // populated and the live app treats unset as approved. Unifying the two
    // would empty the lived-experience sitemap entirely.
    expect(whereFor("livedExperiences")).toEqual({
      and: [
        { or: [approved, { moderationStatus: { exists: false } }] },
        slugged,
      ],
    });
    expect(whereFor("newsPosts")).toEqual(slugged);
    // Decision 11: `agenda` and `report` have no detail route, so the sitemap
    // never asks either collection for rows.
    expect(whereFor("agendas")).toBeUndefined();
  });

  it("reads both collections the regionalCommunity filter admits, not just the page one", async () => {
    onPayload();
    respond({
      regionalCommunityPages: { docs: [{ id: "p", slug: "oceania", sanityUpdatedAt: "2024-01-01T00:00:00Z" }] },
      regionalCommunities: { docs: [{ id: "c", slug: "oceania", sanityUpdatedAt: "2024-01-01T00:00:00Z" }] },
    });
    const entries = await getSitemapEntries();
    // GROQ's `&&` binds tighter than `||`, so the filter reads as "either
    // type, with a slug" — 2 rows x 4 locales.
    expect(entries.filter((e) => e.url.endsWith("/communities/oceania"))).toHaveLength(8);
  });

  it("emits no agenda or report entries — neither has a detail route (Decision 11)", async () => {
    onPayload();
    respond({
      agendas: { docs: [{ id: "a1", slug: "africa", sanityUpdatedAt: "2024-01-01T00:00:00Z" }] },
    });
    const entries = await getSitemapEntries();
    expect(entries.some((e) => e.url.includes("/research-and-action/agendas/"))).toBe(false);
    expect(entries.some((e) => e.url.includes("/research-and-action/reports/"))).toBe(false);
    const collections = mockPayloadQueryPreviewable.mock.calls.map(
      ([descriptor]) => (descriptor as { collection?: string }).collection,
    );
    expect(collections).not.toContain("agendas");
    expect(collections).not.toContain("reports");
  });
});

describe("getDocsChapters, answered by Payload", () => {
  it("passes the collection through as a where clause and orders by `order`", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({ docs: [{ id: "c1", slug: "intro", title: "Intro", order: 1 }] });
    const result = await getDocsChapters("global-agenda");
    expect(result).toEqual([{ slug: "intro", title: "Intro", order: 1 }]);
    expect(whereOf(mockPayloadQuery)).toEqual({ collection: { equals: "global-agenda" } });
    expect((mockPayloadQuery.mock.calls[0]?.[0] as { sort?: string }).sort).toBe("order");
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("propagates a failure — the original client.fetch call had no try/catch", async () => {
    onPayload();
    mockPayloadQuery.mockRejectedValue(new Error("upstream 500"));
    await expect(getDocsChapters("global-agenda")).rejects.toThrow("upstream 500");
  });
});

describe("getDocsChapter, answered by Payload", () => {
  it("passes collection + slug through as a where clause", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({ docs: [{ id: "c1", title: "Intro", order: 1, body: null }] });
    const result = await getDocsChapter("global-agenda", "intro");
    expect(result).toEqual({ title: "Intro", order: 1, body: [] });
    expect(whereOf(mockPayloadQuery)).toEqual({
      and: [{ collection: { equals: "global-agenda" } }, { slug: { equals: "intro" } }],
    });
  });

  it("returns null when there's no matching chapter", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({ docs: [] });
    await expect(getDocsChapter("global-agenda", "missing")).resolves.toBeNull();
  });

  it("converts the Lexical body to Portable Text and rebuilds Sanity's asset projection on embedded images", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue({
      docs: [
        {
          id: "c1",
          title: "Appendices",
          order: 9,
          body: {
            root: {
              type: "root",
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", text: "Before the figure.", format: 0 }],
                },
                {
                  type: "block",
                  fields: {
                    id: "f0158d5b",
                    blockType: "image",
                    placement: "center",
                    alt: null,
                    caption: null,
                    credit: null,
                    hotspot: null,
                    crop: null,
                    sanityAssetId: "image-d7c-792x447-png",
                    media: {
                      id: "image-d7c-792x447-png",
                      url: "/payload-api/media/file/fig.png",
                      mimeType: "image/png",
                      lqip: "data:image/png;base64,AAAA",
                      width: 792,
                      height: 447,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });

    const chapter = await getDocsChapter("global-agenda", "appendices");
    const image = (chapter?.body ?? []).find(
      (block) => (block as { _type?: string })._type === "image",
    ) as Record<string, unknown>;

    // `components/portable-text-renderer.tsx` returns null outright when
    // `value.asset` is missing, so an unmapped image is a deleted figure, not
    // a degraded one.
    expect(image.asset).toEqual({
      _id: "image-d7c-792x447-png",
      url: "/payload-api/media/file/fig.png",
      mimeType: "image/png",
      metadata: { lqip: "data:image/png;base64,AAAA", dimensions: { width: 792, height: 447 } },
    });
    expect(image.placement).toBe("center");
    // Payload's bookkeeping and its explicit nulls both go: a GROQ projection
    // omits an unset field, so leaving them would make the same picture read
    // differently on the two backends.
    expect(image).not.toHaveProperty("media");
    expect(image).not.toHaveProperty("sanityAssetId");
    expect(image).not.toHaveProperty("alt");
    expect(image).not.toHaveProperty("hotspot");
  });
});

describe("getFreshContentRows, answered by Payload", () => {
  /** One `find` result per Payload collection the bento reads. */
  function respond(byCollection: Record<string, { docs: unknown[] } | Error>) {
    mockPayloadQuery.mockImplementation(async (descriptor: unknown) => {
      const collection = (descriptor as { collection?: string }).collection ?? "";
      const answer = byCollection[collection];
      if (answer instanceof Error) throw answer;
      return (answer ?? { docs: [] }) as never;
    });
  }

  it("queries all four card-capable types and flattens the results", async () => {
    onPayload();
    respond({
      caseStudies: { docs: [{ id: "cs1", title: { en: "A" }, slug: "a", publishedAt: "2024-01-01T00:00:00.000Z" }] },
      newsPosts: { docs: [{ id: "n1", title: { en: "B" }, slug: "b", publishedAt: "2024-02-01T00:00:00.000Z" }] },
    });

    const rows = await getFreshContentRows(5);

    expect(mockPayloadQuery).toHaveBeenCalledTimes(4);
    expect(rows.map((r) => `${r.type}:${r.id}`)).toEqual(
      expect.arrayContaining(["caseStudy:cs1", "newsPost:n1"]),
    );
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("projects the same FreshContentRow shape, coalescing per type as the GROQ does", async () => {
    onPayload();
    respond({
      caseStudies: {
        docs: [
          {
            id: "cs1",
            title: { en: "A study", es: null },
            slug: "a-study",
            excerpt: { en: "Short." },
            image: { asset: { url: "/payload-api/media/file/a.png", lqip: "data:image/webp;base64,QQ" } },
            locationDisplayText: null,
            locationText: { city: "Nairobi" },
            publishedAt: "2024-01-01T00:00:00.000Z",
            createdAt: "2025-11-10T18:19:55.000Z",
          },
        ],
      },
    });

    const rows = await getFreshContentRows(5);

    expect(rows).toContainEqual({
      id: "cs1",
      type: "caseStudy",
      title: "A study",
      slug: "a-study",
      image: "/payload-api/media/file/a.png",
      imageLqip: "data:image/webp;base64,QQ",
      excerpt: "Short.",
      // `coalesce(locationDisplayText, locationText.city, place.text)` — the
      // first arm is null, so the city answers.
      place: "Nairobi",
      date: "2024-01-01T00:00:00.000Z",
    });
  });

  it("falls back through the date coalesce to createdAt, exactly as `_createdAt` does", async () => {
    onPayload();
    respond({
      livedExperiences: {
        docs: [{ id: "le1", title: { en: "L" }, slug: "l", publishedAt: null, createdAt: "2025-11-10T13:10:20.627Z" }],
      },
    });
    const rows = await getFreshContentRows(5);
    expect(rows.find((r) => r.id === "le1")?.date).toBe("2025-11-10T13:10:20.627Z");
  });

  it("orders newest first and breaks the date tie by id ascending, matching Sanity", async () => {
    onPayload();
    const tied = "2024-01-01T00:00:00.000Z";
    respond({
      caseStudies: {
        docs: [
          { id: "case-study-2", title: { en: "" }, slug: "s2", publishedAt: tied },
          { id: "case-study-20", title: { en: "" }, slug: "s20", publishedAt: tied },
          { id: "case-study-11", title: { en: "" }, slug: "s11", publishedAt: tied },
          { id: "case-study-99", title: { en: "" }, slug: "s99", publishedAt: "2025-06-01T00:00:00.000Z" },
        ],
      },
    });
    const rows = await getFreshContentRows(10);
    // Newest first, then by code point — "case-study-11" < "case-study-2" <
    // "case-study-20", which is the order production_2 returns today.
    expect(rows.map((r) => r.id)).toEqual([
      "case-study-99",
      "case-study-11",
      "case-study-2",
      "case-study-20",
    ]);
  });

  it("applies the cap per type, as the GROQ slice does", async () => {
    onPayload();
    respond({
      caseStudies: {
        docs: [1, 2, 3, 4, 5].map((n) => ({
          id: `cs${String(n)}`,
          title: { en: "" },
          slug: `s${String(n)}`,
          publishedAt: `2024-0${String(n)}-01T00:00:00.000Z`,
        })),
      },
    });
    const rows = await getFreshContentRows(2);
    expect(rows.map((r) => r.id)).toEqual(["cs5", "cs4"]);
  });

  it("applies each type's own moderation rule", async () => {
    onPayload();
    respond({});
    await getFreshContentRows(5);

    const whereFor = (collection: string) =>
      (
        mockPayloadQuery.mock.calls
          .map(([descriptor]) => descriptor as { collection?: string; where?: unknown })
          .find((d) => d.collection === collection) ?? {}
      ).where;

    const approved = { moderationStatus: { equals: "approved" } };
    const slugged = { slug: { exists: true } };
    expect(whereFor("caseStudies")).toEqual({ and: [approved, slugged] });
    expect(whereFor("researchOutputs")).toEqual({ and: [approved, slugged] });
    expect(whereFor("livedExperiences")).toEqual({
      and: [{ or: [approved, { moderationStatus: { exists: false } }] }, slugged],
    });
    expect(whereFor("newsPosts")).toEqual(slugged);
  });

  it("never asks a collection for a field it does not declare", async () => {
    onPayload();
    respond({});
    await getFreshContentRows(5);
    // Payload rejects a `select`/`where` naming an undeclared path (verified in
    // Task 6: `locationCountryCode` on `newsPosts` throws) where GROQ quietly
    // returns null, so the per-type arms are load-bearing rather than tidy.
    const selectFor = (collection: string) =>
      Object.keys(
        (
          mockPayloadQuery.mock.calls
            .map(([d]) => d as { collection?: string; select?: Record<string, true> })
            .find((d) => d.collection === collection)?.select ?? {}
        ),
      );
    expect(selectFor("caseStudies")).toEqual(
      expect.arrayContaining(["title", "slug", "createdAt", "image", "excerpt", "locationDisplayText", "locationText", "publishedAt"]),
    );
    expect(selectFor("livedExperiences")).not.toContain("image");
    expect(selectFor("livedExperiences")).not.toContain("coverImage");
    expect(selectFor("livedExperiences")).toEqual(expect.arrayContaining(["description", "place"]));
    expect(selectFor("researchOutputs")).toEqual(expect.arrayContaining(["coverImage", "publishDate"]));
    expect(selectFor("researchOutputs")).not.toContain("publishedAt");
    expect(selectFor("newsPosts")).not.toContain("locationDisplayText");
  });

  it("degrades a single failing type to [] without failing the others", async () => {
    onPayload();
    vi.spyOn(console, "error").mockImplementation(() => {});
    respond({
      newsPosts: new Error("news down"),
      caseStudies: { docs: [{ id: "cs1", title: { en: "A" }, slug: "a", publishedAt: "2024-01-01T00:00:00.000Z" }] },
    });

    const rows = await getFreshContentRows(5);

    expect(rows.some((r) => r.type === "newsPost")).toBe(false);
    expect(rows.some((r) => r.type === "caseStudy")).toBe(true);
  });

  it("treats a null query result as empty", async () => {
    onPayload();
    mockPayloadQuery.mockResolvedValue(null);
    await expect(getFreshContentRows(5)).resolves.toEqual([]);
  });
});

describe("getSearchIndexRecords is backend-independent", () => {
  // It holds no query of its own; it switches on `kind` and delegates to three
  // domain modules that each carry their own flag. Consulting `system`'s flag
  // here would override theirs, so it must keep delegating unchanged.
  it("still delegates to the per-domain producers when system reads Payload", async () => {
    onPayload();
    mockCaseStudySearchRecords.mockResolvedValue([
      { objectID: "cs1", kind: "caseStudy", title: "A study", url: "/en/x", locale: "en" },
    ]);
    await expect(getSearchIndexRecords("caseStudy")).resolves.toEqual([
      { objectID: "cs1", kind: "caseStudy", title: "A study", url: "/en/x", locale: "en" },
    ]);
    expect(mockPayloadQuery).not.toHaveBeenCalled();
    expect(mockPayloadQueryPreviewable).not.toHaveBeenCalled();
  });
});
