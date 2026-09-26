import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Slice 9, part two: the news, discovery, page-feed, output and system list
 * readers. Same shape as content-case-studies-pushdown.test.ts — assert the
 * DESCRIPTOR (order, slice, columns), trust database order, and leave the
 * proof that database order equals the old JavaScript order to
 * scripts/parity/order-check.ts.
 */
vi.mock("@/lib/content/internal/payload-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
  queryRaw: vi.fn(),
  queryLive: vi.fn(),
  uploadFileAsset: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  nowMinute: () => "2026-09-17T10:00:00.000Z",
  escapeContains: (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`),
}));
vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
  queryRaw: vi.fn(),
  queryLive: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {}, safeQuery: vi.fn() }));

import { query as payloadQuery } from "@/lib/content/internal/payload-source";
import { getAllNews, getRegularNews } from "@/lib/content/news";
import { getEvents, getNewsPostsForBlock, getDynamicContent } from "@/lib/content/discovery";
import { getAgendas, getResearchOutputs } from "@/lib/content/outputs";
import { getFreshContentRowsForType } from "@/lib/content/internal/payload/system";
import { homepageAgendas, regionalCommunityCaseStudies } from "@/lib/content/internal/payload/page-feeds";

const mockQuery = vi.mocked(payloadQuery);
type Descriptor = {
  type: string;
  collection?: string;
  where?: unknown;
  sort?: unknown;
  limit?: number;
  depth?: number;
  select?: Record<string, unknown>;
  pagination?: boolean;
};
const finds = (collection: string) =>
  mockQuery.mock.calls.map((c) => c[0] as Descriptor).filter((d) => d.type === "find" && d.collection === collection);

const FLAGS = ["CONTENT_BACKEND_NEWS", "CONTENT_BACKEND_DISCOVERY", "CONTENT_BACKEND_OUTPUTS"] as const;

beforeEach(() => {
  for (const f of FLAGS) process.env[f] = "payload";
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ docs: [] } as never);
});
afterEach(() => {
  for (const f of FLAGS) delete process.env[f];
});

describe("news", () => {
  it("getAllNews orders featured-first-then-newest in the database, limits there, and skips the rich text", async () => {
    await getAllNews({ limit: 7 });
    const [d] = finds("newsPosts");
    expect(d.sort).toEqual(["-featured", "-publishedAt", "id"]);
    expect(d.limit).toBe(7);
    expect(d.select).toEqual({ content: false });
  });

  it("keeps the whole (projected) set when a search pattern must be matched in JavaScript", async () => {
    // GROQ `match` is token-based; ILIKE is not the same thing. On four rows
    // the JavaScript matcher stays, but it now runs on rows without `content`.
    await getRegularNews({ search: "heat", limit: 5 });
    const [d] = finds("newsPosts");
    expect(d.limit).toBeUndefined();
    expect(d.pagination).toBe(false);
    expect(d.select).toEqual({ content: false });
  });
});

describe("discovery", () => {
  it("getEvents orders soonest-first with the id tie-break and limits in the database", async () => {
    await getEvents({ limit: 5 });
    const [d] = finds("events");
    expect(d.sort).toEqual(["startAt", "id"]);
    expect(d.limit).toBe(5);
  });

  it("getNewsPostsForBlock in featured mode asks for the featured page bounded, then fills only if short", async () => {
    mockQuery.mockResolvedValueOnce({ docs: [{ id: "n1", featured: true }] } as never);
    mockQuery.mockResolvedValueOnce({ docs: [] } as never);
    await getNewsPostsForBlock("featured", 3);
    const [featured, fill] = finds("newsPosts");
    expect(featured.sort).toEqual(["-publishedAt", "id"]);
    expect(featured.limit).toBe(3);
    expect(fill.limit).toBe(2);
    expect(JSON.stringify(fill.where)).toContain('"id":{"not_in":["n1"]}');
  });

  it("getDynamicContent pushes the mode's order and the slot's count", async () => {
    await getDynamicContent("newsPost", { communitySlug: "esea", count: 4, mode: "featured" });
    const [d] = finds("newsPosts");
    expect(d.sort).toEqual(["-featured", "-publishedAt", "id"]);
    expect(d.limit).toBe(4);
    expect(d.select).toEqual({ content: false });
  });
});

describe("outputs", () => {
  it("getAgendas orders by publishDate in the database", async () => {
    await getAgendas();
    const [d] = finds("agendas");
    expect(d.sort).toEqual(["-publishDate", "id"]);
  });

  it("getResearchOutputs orders in the database and skips the body", async () => {
    await getResearchOutputs();
    const [d] = finds("researchOutputs");
    expect(d.sort).toEqual(["-publishDate", "id"]);
    expect(d.select).toEqual({ body: false });
  });
});

describe("system", () => {
  it("the fresh-content read orders by the type's date and caps in the database", async () => {
    await getFreshContentRowsForType("caseStudy", 3);
    const [d] = finds("caseStudies");
    expect(d.sort).toEqual(["-publishedAt", "id"]);
    expect(d.limit).toBe(3);
  });
});

describe("page feeds", () => {
  it("a regional community's case-study feed is bounded and projected", async () => {
    mockQuery.mockResolvedValueOnce({ docs: [{ id: "rc-1" }] } as never); // community lookup
    await regionalCommunityCaseStudies({ slug: "oceania", limit: 6 });
    const [d] = finds("caseStudies");
    expect(d.sort).toEqual(["-featured", "-publishedAt", "id"]);
    expect(d.limit).toBe(6);
    expect(d.select).toEqual({ content: false });
  });

  it("the homepage agendas feed is bounded and ordered in the database", async () => {
    await homepageAgendas({ limit: 3 });
    const [d] = finds("agendas");
    expect(d.sort).toEqual(["-publishDate", "id"]);
    expect(d.limit).toBe(3);
  });
});
