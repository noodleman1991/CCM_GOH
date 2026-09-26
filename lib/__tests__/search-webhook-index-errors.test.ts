import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The three Sanity-fed search webhooks used one `try` around "build the
 * record" and "save it", and on ANY error deleted the document from the index
 * and answered 200. A transient Algolia failure on an approved case study
 * therefore removed it from search and told Sanity all was well, so nothing
 * retried. Now: a record that cannot be built is removed (the index must not
 * keep a stale row); a save that fails answers 5xx and leaves the index alone,
 * so Sanity retries.
 */
const { saveObjects, deleteObject, transforms } = vi.hoisted(() => ({
  saveObjects: vi.fn(),
  deleteObject: vi.fn(async () => ({ taskID: 1 })),
  transforms: {
    transformCaseStudyForIndex: vi.fn(),
    transformNewsForIndex: vi.fn(),
    transformAgendaForIndex: vi.fn(),
  },
}));
vi.mock("@/lib/algolia", async () => {
  const indices = await vi.importActual<typeof import("@/lib/algolia-indices")>("@/lib/algolia-indices");
  return { ...indices, algoliaClient: { saveObjects, deleteObject, waitForTask: vi.fn() } };
});
vi.mock("@/payload/hooks/search-sync", () => transforms);
vi.mock("@/lib/content/case-studies", () => ({
  getCaseStudyIndexDocById: vi.fn(async () => ({ _id: "cs1", status: "approved", title: "T" })),
}));
vi.mock("@/lib/content/news", () => ({
  getNewsIndexDocById: vi.fn(async () => ({ _id: "n1", _updatedAt: "2026-01-01", publishedAt: "2026-01-01", title: "N" })),
}));
vi.mock("@/lib/content/outputs", () => ({
  getAgendaIndexDocsByIds: vi.fn(async () => [{ _id: "a1", title: "A" }]),
}));
vi.mock("@sanity/webhook", () => ({ isValidSignature: async () => false, SIGNATURE_HEADER_NAME: "sanity-webhook-signature" }));

import { POST as caseStudiesPOST } from "@/app/api/search/case-studies/webhook/route";
import { POST as newsPOST } from "@/app/api/search/news/webhook/route";
import { POST as agendasPOST } from "@/app/api/search/agendas/webhook/route";

const SECRET = "internal";
const post = (url: string, body: unknown) =>
  new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
    body: JSON.stringify(body),
  });

const routes = [
  { name: "case-studies", handler: caseStudiesPOST, url: "http://localhost/api/search/case-studies/webhook", body: { _id: "cs1", _type: "caseStudy" }, transform: transforms.transformCaseStudyForIndex },
  { name: "news", handler: newsPOST, url: "http://localhost/api/search/news/webhook", body: { _id: "n1", _type: "newsPost" }, transform: transforms.transformNewsForIndex },
  { name: "agendas", handler: agendasPOST, url: "http://localhost/api/search/agendas/webhook", body: { _id: "a1", _type: "agenda" }, transform: transforms.transformAgendaForIndex },
] as const;

const call = (route: (typeof routes)[number]) => route.handler(post(route.url, route.body)) as Promise<Response>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  process.env.SEARCH_WEBHOOK_SECRET = SECRET;
  process.env.SANITY_WEBHOOK_SECRET = "sanity";
  for (const t of Object.values(transforms)) t.mockReturnValue({ objectID: "x", title: "x" });
  saveObjects.mockResolvedValue([{ taskID: 1 }]);
});

describe.each(routes)("$name webhook — index errors", (route) => {
  it("answers 5xx and does NOT delete the record when the save fails", async () => {
    saveObjects.mockRejectedValueOnce(new Error("503 from Algolia"));
    const res = await call(route);
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("removes the record when it cannot be built, so the index never keeps a stale row", async () => {
    route.transform.mockImplementationOnce(() => {
      throw new Error("missing slug");
    });
    const res = await call(route);
    expect(res.status).toBe(200);
    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(saveObjects).not.toHaveBeenCalled();
  });

  it("indexes normally when both steps succeed", async () => {
    const res = await call(route);
    expect(res.status).toBe(200);
    expect(saveObjects).toHaveBeenCalledTimes(1);
    expect(deleteObject).not.toHaveBeenCalled();
  });
});
