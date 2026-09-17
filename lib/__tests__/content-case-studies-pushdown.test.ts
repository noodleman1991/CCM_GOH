import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Slice 9, case studies: the list readers used to fetch the whole collection
 * at depth 2 in all four locales with no `select` — about 2 MB of Lexical
 * rich text per read, on a table where `content` is never rendered by a card —
 * and then filter, sort and slice in JavaScript. Each reader now asks Payload
 * for exactly the rows and columns it renders.
 *
 * These tests assert the DESCRIPTOR, not a sorted fixture: after push-down the
 * reader trusts database order, and the parity script in scripts/parity proves
 * that order equals the previous JavaScript order on the real data.
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
import {
  getApprovedCaseStudies,
  getApprovedCaseStudiesByContributor,
  getApprovedCaseStudyIndexDocs,
  getCaseStudyFilterTags,
  getFeaturedCaseStudies,
  getFilteredCaseStudies,
  searchCaseStudies,
} from "@/lib/content/case-studies";

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
const calls = () => mockQuery.mock.calls.map((c) => c[0] as Descriptor);
const caseStudyFinds = () => calls().filter((d) => d.type === "find" && d.collection === "caseStudies");

beforeEach(() => {
  process.env.CONTENT_BACKEND_CASE_STUDIES = "payload";
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ docs: [] } as never);
});
afterEach(() => {
  delete process.env.CONTENT_BACKEND_CASE_STUDIES;
});

describe("getFilteredCaseStudies pushes every filter, the order and the slice into the query", () => {
  it("builds one bounded, projected query", async () => {
    await getFilteredCaseStudies({ topics: ["health"], tags: ["heat"], communities: ["esea"], search: "50% heat" });
    const [d] = caseStudyFinds();
    expect(caseStudyFinds()).toHaveLength(1);
    expect(d.sort).toEqual(["-featured", "-publishedAt", "id"]);
    expect(d.limit).toBe(50);
    expect(d.pagination).toBe(false);
    expect(d.depth).toBe(1);
    const where = JSON.stringify(d.where);
    expect(where).toContain('"moderationStatus":{"equals":"approved"}');
    expect(where).toContain('"topic":{"in":["health"]}');
    expect(where).toContain('"tags.value":{"in":["heat"]}');
    expect(where).toContain('"relatedCommunity.slug":{"in":["esea"]}');
    // The search term reaches Postgres as ILIKE with its wildcard escaped.
    expect(where).toContain('"title":{"contains":"50\\\\% heat"}');
    expect(where).toContain('"excerpt":{"contains":"50\\\\% heat"}');
  });

  it("never asks for the rich-text body on a list read", async () => {
    await getFilteredCaseStudies({});
    const [d] = caseStudyFinds();
    expect(d.select).toBeDefined();
    expect(d.select).not.toHaveProperty("content");
    for (const key of ["title", "excerpt", "slug", "featured", "publishedAt", "image", "authors", "tags", "relatedCommunity", "topic"]) {
      expect(d.select, key).toHaveProperty(key);
    }
  });
});

describe("the other list readers", () => {
  it("getApprovedCaseStudies orders in the database and limits there", async () => {
    await getApprovedCaseStudies(undefined, 3);
    const [d] = caseStudyFinds();
    expect(d.sort).toEqual(["-publishedAt", "-featured", "id"]);
    expect(d.limit).toBe(3);
    expect(d.select).not.toHaveProperty("content");
  });

  it("getFeaturedCaseStudies filters on featured in the database", async () => {
    await getFeaturedCaseStudies(2);
    const [d] = caseStudyFinds();
    expect(JSON.stringify(d.where)).toContain('"featured":{"equals":true}');
    expect(d.limit).toBe(2);
  });

  it("searchCaseStudies with a language returns nothing without a query — the field exists in neither store", async () => {
    const result = await searchCaseStudies("x", { language: "fr" });
    expect(result).toEqual([]);
    expect(caseStudyFinds()).toHaveLength(0);
  });

  it("searchCaseStudies pushes the term and the tag filter", async () => {
    await searchCaseStudies("heat", { tags: ["a"], limit: 5 });
    const [d] = caseStudyFinds();
    expect(JSON.stringify(d.where)).toContain('"title":{"contains":"heat"}');
    expect(JSON.stringify(d.where)).toContain('"tags.value":{"in":["a"]}');
    expect(d.limit).toBe(5);
    expect(d.select).not.toHaveProperty("content");
  });

  it("getApprovedCaseStudiesByContributor reads four columns at depth 0 instead of the whole collection", async () => {
    await getApprovedCaseStudiesByContributor("user_1");
    const [d] = caseStudyFinds();
    expect(d.depth).toBe(0);
    expect(d.limit).toBe(50);
    expect(d.sort).toEqual(["-publishedAt", "id"]);
    expect(Object.keys(d.select ?? {}).sort()).toEqual(["publishedAt", "slug", "title"]);
    const where = JSON.stringify(d.where);
    expect(where).toContain('"submittedBy":{"equals":"user_1"}');
    expect(where).toContain('"authors.userId":{"equals":"user_1"}');
  });

  it("the filter-option counts read only the two relationship columns", async () => {
    await getCaseStudyFilterTags();
    const refs = caseStudyFinds()[0];
    expect(refs.depth).toBe(0);
    expect(Object.keys(refs.select ?? {}).sort()).toEqual(["relatedCommunity", "tags"]);
  });

  it("the search-index reader projects everything the record needs and nothing else", async () => {
    await getApprovedCaseStudyIndexDocs();
    const [d] = caseStudyFinds();
    expect(d.select).toBeDefined();
    expect(d.select).not.toHaveProperty("content");
    for (const key of ["title", "excerpt", "slug", "region", "themes", "populations", "authors", "organizations", "tags", "studyLocation", "studyPeriod", "sanityUpdatedAt"]) {
      expect(d.select, key).toHaveProperty(key);
    }
  });
});
