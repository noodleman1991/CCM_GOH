import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
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
const mockCaseStudySearchRecords = vi.mocked(getCaseStudySearchRecords);
const mockNewsSearchRecords = vi.mocked(getNewsSearchRecords);
const mockAgendaSearchRecords = vi.mocked(getAgendaSearchRecords);
const mockResearchOutputSearchRecords = vi.mocked(getResearchOutputSearchRecords);

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryPreviewable.mockReset();
  mockCaseStudySearchRecords.mockReset();
  mockNewsSearchRecords.mockReset();
  mockAgendaSearchRecords.mockReset();
  mockResearchOutputSearchRecords.mockReset();
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.org";
});
afterEach(() => {
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
