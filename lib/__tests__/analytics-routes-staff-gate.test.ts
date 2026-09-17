/**
 * `GET /api/analytics/download` and `GET /api/analytics/agenda-download`
 * (Low list): site-wide download analytics were readable by any signed-in
 * member. Both now gate on staff (`isStaff`: team_editor | admin), the same
 * check `app/api/issue-reports/route.ts` uses.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getActorMock = vi.fn();
vi.mock("@/lib/authz", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz")>();
  return { ...actual, getActor: () => getActorMock() };
});
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: null }) }));

const count = vi.fn(async () => 0);
const groupBy = vi.fn(async () => []);
const findMany = vi.fn(async () => []);
vi.mock("@/lib/prisma", () => ({
  prisma: {
    downloadEvent: {
      count: (...a: unknown[]) => count(...(a as [])),
      groupBy: (...a: unknown[]) => groupBy(...(a as [])),
      findMany: (...a: unknown[]) => findMany(...(a as [])),
    },
  },
  safeQuery: async (fn: () => Promise<unknown>) => ({ success: true, data: await fn() }),
}));

import { GET as downloadGET } from "@/app/api/analytics/download/route";
import { GET as agendaGET } from "@/app/api/analytics/agenda-download/route";

const routes = [
  ["download", downloadGET, "http://localhost/api/analytics/download?timeframe=7d"],
  ["agenda-download", agendaGET, "http://localhost/api/analytics/agenda-download?timeframe=7d"],
] as const;

beforeEach(() => {
  vi.clearAllMocks();
});

describe.each(routes)("GET /api/analytics/%s", (_name, GET, url) => {
  it("returns 401 for anonymous callers and reads nothing", async () => {
    getActorMock.mockResolvedValue(null);
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(401);
    expect(count).not.toHaveBeenCalled();
  });

  it("returns 403 for a signed-in non-staff member and reads nothing", async () => {
    getActorMock.mockResolvedValue({ id: "u1", role: "community_member" });
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(403);
    expect(count).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns 403 for a community_editor (not staff)", async () => {
    getActorMock.mockResolvedValue({ id: "u2", role: "community_editor" });
    expect((await GET(new NextRequest(url))).status).toBe(403);
  });

  it.each(["team_editor", "admin"])("answers for %s", async (role) => {
    getActorMock.mockResolvedValue({ id: "staff", role });
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(200);
    expect(count).toHaveBeenCalledTimes(1);
  });
});
