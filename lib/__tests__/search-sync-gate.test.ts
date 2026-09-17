/**
 * Auth + live-index gate of the four `app/api/search/*\/sync` routes.
 *
 * Hub audit 2026-09-16, H3 (`news:20, agendas:22, case-studies:23, users:14`):
 *   `if (authHeader !== \`Bearer ${internalSecret}\` && !userId)` meant
 *   (a) ANY signed-in member could trigger `replaceAllObjects` on a live index,
 *   (b) with `INTERNAL_SYNC_SECRET` unset (production, CI) the literal header
 *       `Bearer undefined` matched, and
 *   (c) GET had no gate at all and returned DB counts.
 * The routes also never consulted `liveIndexWritesAllowed()`, so a preview
 * deployment or `next dev` could rewrite the live index.
 *
 * Contract after the fix: POST and GET are allowed for the internal bearer OR a
 * staff actor (team_editor | admin). A signed-in non-staff member gets 403,
 * anonymous gets 401. POST refuses with 503 before any write when
 * `liveIndexWritesAllowed()` is false.
 *
 * Seams mocked: `getActor` (Clerk + Prisma), the Algolia client, content
 * readers, Payload transform. Route handlers run for real.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import type { Actor } from "@/lib/authz-core";

const getActorMock = vi.fn<() => Promise<Actor>>();
vi.mock("@/lib/authz", async () => {
  const core = await vi.importActual<typeof import("@/lib/authz-core")>("@/lib/authz-core");
  return { ...core, getActor: () => getActorMock() };
});

// `vi.mock` factories are hoisted above module-level `const`s, so anything a
// factory references directly must be hoisted with it.
const { replaceAllObjects, saveObjects, deleteObjects, waitForTask, userCount } = vi.hoisted(() => ({
  replaceAllObjects: vi.fn(async () => [{ taskID: 7 }]),
  saveObjects: vi.fn(async () => [{ taskID: 8 }]),
  deleteObjects: vi.fn(async () => [{ taskID: 9 }]),
  waitForTask: vi.fn(async () => undefined),
  userCount: vi.fn(async () => 1),
}));
vi.mock("@/lib/algolia", async () => {
  const indices = await vi.importActual<typeof import("@/lib/algolia-indices")>("@/lib/algolia-indices");
  return {
    ...indices,
    algoliaClient: { replaceAllObjects, saveObjects, deleteObjects, waitForTask },
    transformUserForIndex: (u: { id: string }) => ({ objectID: u.id }),
    shouldIndexUser: () => true,
  };
});

// One indexable document per type, so a permitted full sync provably reaches
// `replaceAllObjects` (an empty set short-circuits before any write).
vi.mock("@/lib/content/news", () => ({
  getPublishedNewsIndexDocs: vi.fn(async () => [{ _id: "n1" }]),
  getNewsIndexDocsByIds: vi.fn(async () => []),
  getPublishedNewsCount: vi.fn(async () => 1),
}));
vi.mock("@/lib/content/case-studies", () => ({
  getApprovedCaseStudyIndexDocs: vi.fn(async () => [{ _id: "cs1" }]),
  getCaseStudyIndexDocsByIds: vi.fn(async () => []),
  getApprovedCaseStudyCount: vi.fn(async () => 1),
}));
vi.mock("@/lib/content/outputs", () => ({
  getPublishedAgendaIndexDocs: vi.fn(async () => [{ _id: "a1" }]),
  getAgendaIndexDocsByIds: vi.fn(async () => []),
  getAgendaCount: vi.fn(async () => 1),
}));
vi.mock("@/payload/hooks/search-sync", () => ({
  transformNewsForIndex: (d: { _id: string }) => ({ objectID: d._id }),
  transformCaseStudyForIndex: (d: { _id: string }) => ({ objectID: d._id }),
  transformAgendaForIndex: (d: { _id: string }) => ({ objectID: d._id }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(async () => [{ id: "u1" }]),
      count: (...a: unknown[]) => userCount(...(a as [])),
    },
  },
  safeQuery: vi.fn(),
}));

import * as news from "@/app/api/search/news/sync/route";
import * as caseStudies from "@/app/api/search/case-studies/sync/route";
import * as agendas from "@/app/api/search/agendas/sync/route";
import * as users from "@/app/api/search/users/sync/route";

const SECRET = "internal-sync-secret";
const MEMBER: Actor = { id: "u_member", role: "community_member" };
const EDITOR: Actor = { id: "u_ceditor", role: "community_editor" };
const STAFF: Actor = { id: "u_staff", role: "team_editor" };
const ADMIN: Actor = { id: "u_admin", role: "admin" };

const ENV = ["INTERNAL_SYNC_SECRET", "ALGOLIA_INDEX_PREFIX", "VERCEL_ENV"] as const;
let ambient: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  ambient = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
  process.env.INTERNAL_SYNC_SECRET = SECRET;
  // Route writes at a scratch index so `liveIndexWritesAllowed()` is true and
  // the "passes the gate" cases can observe the write. The 503 case unsets it.
  process.env.ALGOLIA_INDEX_PREFIX = "vitest_";
  delete process.env.VERCEL_ENV;
  getActorMock.mockResolvedValue(null);
});

afterEach(() => {
  for (const k of ENV) {
    if (ambient[k] === undefined) delete process.env[k];
    else process.env[k] = ambient[k];
  }
});

function post(url: string, headers: Record<string, string> = {}, body: unknown = { type: "full" }): NextRequest {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}
function get(url: string, headers: Record<string, string> = {}): NextRequest {
  return new Request(url, { method: "GET", headers }) as unknown as NextRequest;
}

const routes = [
  { name: "news", mod: news, url: "http://localhost/api/search/news/sync" },
  { name: "case-studies", mod: caseStudies, url: "http://localhost/api/search/case-studies/sync" },
  { name: "agendas", mod: agendas, url: "http://localhost/api/search/agendas/sync" },
  { name: "users", mod: users, url: "http://localhost/api/search/users/sync" },
] as const;

describe.each(routes)("/api/search/$name/sync", ({ mod, url }) => {
  describe("POST", () => {
    it("401s anonymous with no header", async () => {
      const res = await mod.POST(post(url));
      expect(res.status).toBe(401);
      expect(replaceAllObjects).not.toHaveBeenCalled();
    });

    it("401s `Bearer undefined` when INTERNAL_SYNC_SECRET is unset (H3b)", async () => {
      delete process.env.INTERNAL_SYNC_SECRET;
      const res = await mod.POST(post(url, { authorization: "Bearer undefined" }));
      expect(res.status).toBe(401);
      expect(replaceAllObjects).not.toHaveBeenCalled();
    });

    it("401s a wrong bearer", async () => {
      const res = await mod.POST(post(url, { authorization: "Bearer nope" }));
      expect(res.status).toBe(401);
      expect(replaceAllObjects).not.toHaveBeenCalled();
    });

    it.each([MEMBER, EDITOR])("403s a signed-in non-staff actor (role %s) (H3a)", async (actor) => {
      getActorMock.mockResolvedValue(actor);
      const res = await mod.POST(post(url));
      expect(res.status).toBe(403);
      expect(replaceAllObjects).not.toHaveBeenCalled();
    });

    it("403s a signed-in member even with a wrong bearer", async () => {
      getActorMock.mockResolvedValue(MEMBER);
      const res = await mod.POST(post(url, { authorization: "Bearer nope" }));
      expect(res.status).toBe(403);
      expect(replaceAllObjects).not.toHaveBeenCalled();
    });

    it.each([STAFF, ADMIN])("lets staff (role %s) through to the index write", async (actor) => {
      getActorMock.mockResolvedValue(actor);
      const res = await mod.POST(post(url));
      expect(res.status).toBe(200);
      expect(replaceAllObjects).toHaveBeenCalledTimes(1);
      expect(await res.json()).toMatchObject({ success: true, indexed: 1 });
    });

    it("lets the internal bearer through without consulting the session", async () => {
      const res = await mod.POST(post(url, { authorization: `Bearer ${SECRET}` }));
      expect(res.status).toBe(200);
      expect(replaceAllObjects).toHaveBeenCalledTimes(1);
      expect(getActorMock).not.toHaveBeenCalled();
    });

    it("503s before any write when live-index writes are not allowed here", async () => {
      // No prefix and not Vercel production == `next dev`, a preview deploy, CI.
      delete process.env.ALGOLIA_INDEX_PREFIX;
      delete process.env.VERCEL_ENV;
      const res = await mod.POST(post(url, { authorization: `Bearer ${SECRET}` }));
      expect(res.status).toBe(503);
      expect((await res.json()).error).toMatch(/live/i);
      expect(replaceAllObjects).not.toHaveBeenCalled();
      expect(saveObjects).not.toHaveBeenCalled();
      expect(deleteObjects).not.toHaveBeenCalled();
    });

    it("writes on Vercel production with no prefix", async () => {
      delete process.env.ALGOLIA_INDEX_PREFIX;
      process.env.VERCEL_ENV = "production";
      const res = await mod.POST(post(url, { authorization: `Bearer ${SECRET}` }));
      expect(res.status).toBe(200);
      expect(replaceAllObjects).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET", () => {
    it("401s anonymous (no more count leak)", async () => {
      const res = await mod.GET(get(url));
      expect(res.status).toBe(401);
    });

    it("401s `Bearer undefined` when the secret is unset", async () => {
      delete process.env.INTERNAL_SYNC_SECRET;
      const res = await mod.GET(get(url, { authorization: "Bearer undefined" }));
      expect(res.status).toBe(401);
    });

    it("403s a signed-in member", async () => {
      getActorMock.mockResolvedValue(MEMBER);
      const res = await mod.GET(get(url));
      expect(res.status).toBe(403);
    });

    it("200s for staff", async () => {
      getActorMock.mockResolvedValue(STAFF);
      const res = await mod.GET(get(url));
      expect(res.status).toBe(200);
      expect(await res.json()).toHaveProperty("syncNeeded");
    });

    it("200s for the internal bearer", async () => {
      const res = await mod.GET(get(url, { authorization: `Bearer ${SECRET}` }));
      expect(res.status).toBe(200);
    });
  });
});
