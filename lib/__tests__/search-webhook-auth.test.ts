/**
 * Auth gate of the four `app/api/search/*\/webhook` routes.
 *
 * Hub audit 2026-09-16:
 *  - H2: `news/webhook/route.ts:27` called `isValidSignature()` without `await`.
 *    `@sanity/webhook` 4.x returns `Promise<boolean>`, and a Promise is truthy,
 *    so ANY signature passed. A garbage signature must 401.
 *  - M20: `case-studies/webhook` and `agendas/webhook` accepted only the
 *    internal bearer while `SANITY_WEBHOOK_SETUP.md` configures Sanity to send
 *    its HMAC header — every documented delivery 401'd. They must accept the
 *    Sanity signature exactly as news does.
 *  - Low: the news webhook's GET disclosed `webhookSecret: !!secret`.
 *  - H3 (sibling): `Bearer undefined` must never authenticate when the secret
 *    is unset.
 *
 * Only the seams are mocked (Algolia client, content readers, Payload transform).
 * The route handlers run for real, so the branch under test is the route's own.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from "@sanity/webhook";

// `vi.mock` factories are hoisted above module-level `const`s, so anything a
// factory references directly must be hoisted with it.
const { deleteObject } = vi.hoisted(() => ({ deleteObject: vi.fn(async () => ({ taskID: 1 })) }));
vi.mock("@/lib/algolia", async () => {
  const indices = await vi.importActual<typeof import("@/lib/algolia-indices")>("@/lib/algolia-indices");
  return {
    ...indices,
    algoliaClient: { deleteObject, saveObjects: vi.fn(), waitForTask: vi.fn() },
    transformUserForIndex: vi.fn(),
    shouldIndexUser: () => false,
  };
});
vi.mock("@/lib/content/news", () => ({ getNewsIndexDocById: vi.fn(async () => null) }));
vi.mock("@/lib/content/case-studies", () => ({ getCaseStudyIndexDocById: vi.fn(async () => null) }));
vi.mock("@/lib/content/outputs", () => ({ getAgendaIndexDocsByIds: vi.fn(async () => []) }));
vi.mock("@/payload/hooks/search-sync", () => ({
  transformNewsForIndex: () => null,
  transformCaseStudyForIndex: () => null,
  transformAgendaForIndex: () => null,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(async () => null) } },
  safeQuery: vi.fn(),
}));

import { POST as newsPOST, GET as newsGET } from "@/app/api/search/news/webhook/route";
import { POST as caseStudiesPOST } from "@/app/api/search/case-studies/webhook/route";
import { POST as agendasPOST } from "@/app/api/search/agendas/webhook/route";
import { POST as usersPOST } from "@/app/api/search/users/webhook/route";

const BEARER_SECRET = "internal-webhook-secret";
const SANITY_SECRET = "sanity-hmac-secret";

const ENV = ["SEARCH_WEBHOOK_SECRET", "SANITY_WEBHOOK_SECRET"] as const;
let ambient: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  ambient = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
  process.env.SEARCH_WEBHOOK_SECRET = BEARER_SECRET;
  process.env.SANITY_WEBHOOK_SECRET = SANITY_SECRET;
});

afterEach(() => {
  for (const k of ENV) {
    if (ambient[k] === undefined) delete process.env[k];
    else process.env[k] = ambient[k];
  }
});

function post(url: string, body: string, headers: Record<string, string>): NextRequest {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  }) as unknown as NextRequest;
}

// A delete payload exercises the auth gate and then the shortest happy path
// (one `deleteObject`), which is all these tests need to observe "got through".
const routes = [
  {
    name: "news",
    handler: newsPOST,
    url: "http://localhost/api/search/news/webhook",
    body: JSON.stringify({ _id: "n1", _type: "newsPost", action: "delete" }),
  },
  {
    name: "case-studies",
    handler: caseStudiesPOST,
    url: "http://localhost/api/search/case-studies/webhook",
    body: JSON.stringify({ _id: "cs1", _type: "caseStudy", action: "delete" }),
  },
  {
    name: "agendas",
    handler: agendasPOST,
    url: "http://localhost/api/search/agendas/webhook",
    body: JSON.stringify({ _id: "a1", _type: "agenda", action: "delete" }),
  },
] as const;

describe.each(routes)("POST /api/search/$name/webhook — Sanity signature or internal bearer", (route) => {
  it("401s a garbage Sanity signature and does not touch the index (H2)", async () => {
    const res = await route.handler(
      post(route.url, route.body, { [SIGNATURE_HEADER_NAME]: "t=1,v1=garbage" })
    );
    expect(res.status).toBe(401);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("401s a signature made with the wrong secret", async () => {
    const sig = await encodeSignatureHeader(route.body, Date.now(), "not-the-secret");
    const res = await route.handler(post(route.url, route.body, { [SIGNATURE_HEADER_NAME]: sig }));
    expect(res.status).toBe(401);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("401s when neither header is present", async () => {
    const res = await route.handler(post(route.url, route.body, {}));
    expect(res.status).toBe(401);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("401s `Bearer undefined` when the bearer secret is unset (H3)", async () => {
    delete process.env.SEARCH_WEBHOOK_SECRET;
    const res = await route.handler(post(route.url, route.body, { authorization: "Bearer undefined" }));
    expect(res.status).toBe(401);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("accepts a valid Sanity signature (M20 for case-studies/agendas)", async () => {
    const sig = await encodeSignatureHeader(route.body, Date.now(), SANITY_SECRET);
    const res = await route.handler(post(route.url, route.body, { [SIGNATURE_HEADER_NAME]: sig }));
    expect(res.status).toBe(200);
    expect(deleteObject).toHaveBeenCalledTimes(1);
  });

  it("accepts the internal bearer", async () => {
    const res = await route.handler(
      post(route.url, route.body, { authorization: `Bearer ${BEARER_SECRET}` })
    );
    expect(res.status).toBe(200);
    expect(deleteObject).toHaveBeenCalledTimes(1);
  });

  it("401s a Sanity signature when SANITY_WEBHOOK_SECRET is unset (no silent bypass)", async () => {
    delete process.env.SANITY_WEBHOOK_SECRET;
    const sig = await encodeSignatureHeader(route.body, Date.now(), SANITY_SECRET);
    const res = await route.handler(post(route.url, route.body, { [SIGNATURE_HEADER_NAME]: sig }));
    expect(res.status).toBe(401);
    expect(deleteObject).not.toHaveBeenCalled();
  });
});

describe("GET /api/search/news/webhook", () => {
  it("does not disclose whether a webhook secret is configured", async () => {
    const res = await newsGET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).not.toHaveProperty("webhookSecret");
    expect(JSON.stringify(json)).not.toMatch(/secret/i);
  });
});

describe("POST /api/search/users/webhook — internal bearer only", () => {
  const url = "http://localhost/api/search/users/webhook";
  const body = JSON.stringify({ userId: "u1", action: "delete" });

  it("401s `Bearer undefined` when the secret is unset", async () => {
    delete process.env.SEARCH_WEBHOOK_SECRET;
    const res = await usersPOST(post(url, body, { authorization: "Bearer undefined" }));
    expect(res.status).toBe(401);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("401s a wrong bearer", async () => {
    const res = await usersPOST(post(url, body, { authorization: "Bearer nope" }));
    expect(res.status).toBe(401);
  });

  it("accepts the right bearer", async () => {
    const res = await usersPOST(post(url, body, { authorization: `Bearer ${BEARER_SECRET}` }));
    expect(res.status).toBe(200);
    expect(deleteObject).toHaveBeenCalledTimes(1);
  });
});
