/**
 * Bearer gates on the three cron routes and the manual cache revalidate route.
 *
 * Hub audit 2026-09-16:
 *  - Low: `app/api/cron/event-reminders/route.ts:14` was `if (secret && … )`,
 *    i.e. it failed OPEN — with `CRON_SECRET` unset anyone could fire it.
 *    `retention` and `weekly-digest` already failed closed; all three now share
 *    `bearerMatches()`.
 *  - H3 family: every hand-rolled `=== \`Bearer ${secret}\`` matched the literal
 *    `Bearer undefined` when the secret was unset. `cache/revalidate` kept a
 *    `!apiKey` guard but compared with `===` (not timing-safe).
 *
 * Only the side-effecting seams are mocked; the handlers run for real.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// `vi.mock` factories are hoisted above module-level `const`s, so anything a
// factory references directly must be hoisted with it.
const { getEventsStartingWithin, sendWeeklyDigestEmail, deleteMany, groupBy, revalidateTag, revalidatePath } =
  vi.hoisted(() => ({
    getEventsStartingWithin: vi.fn(async () => []),
    sendWeeklyDigestEmail: vi.fn(),
    deleteMany: vi.fn(async () => ({ count: 0 })),
    groupBy: vi.fn(async () => []),
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
  }));
vi.mock("@/lib/content/discovery", () => ({
  getEventsStartingWithin: (...a: unknown[]) => getEventsStartingWithin(...(a as [])),
}));
vi.mock("@/lib/notifications/emit", () => ({ emitLifecycle: vi.fn() }));
vi.mock("@/lib/notifications/email", () => ({
  sendWeeklyDigestEmail: (...a: unknown[]) => sendWeeklyDigestEmail(...(a as [])),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    downloadEvent: { deleteMany },
    rateLimit: { deleteMany },
    notification: { deleteMany, groupBy, findFirst: vi.fn(async () => null) },
    rsvp: { findMany: vi.fn(async () => []) },
  },
  safeQuery: async (fn: () => Promise<unknown>) => ({ success: true, data: await fn() }),
}));
vi.mock("next/cache", () => ({
  revalidateTag: (...a: unknown[]) => revalidateTag(...(a as [])),
  revalidatePath: (...a: unknown[]) => revalidatePath(...(a as [])),
}));

import { GET as eventReminders } from "@/app/api/cron/event-reminders/route";
import { GET as retention } from "@/app/api/cron/retention/route";
import { GET as weeklyDigest } from "@/app/api/cron/weekly-digest/route";
import { GET as revalidateGET, POST as revalidatePOST } from "@/app/api/cache/revalidate/route";

const ENV = ["CRON_SECRET", "ADMIN_API_KEY"] as const;
let ambient: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  ambient = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
  delete process.env.CRON_SECRET;
  delete process.env.ADMIN_API_KEY;
});

afterEach(() => {
  for (const k of ENV) {
    if (ambient[k] === undefined) delete process.env[k];
    else process.env[k] = ambient[k];
  }
});

function req(url: string, headers: Record<string, string> = {}, init: RequestInit = {}): NextRequest {
  return new Request(url, { headers, ...init }) as unknown as NextRequest;
}

const crons = [
  { name: "event-reminders", handler: eventReminders, sideEffect: getEventsStartingWithin },
  { name: "retention", handler: retention, sideEffect: deleteMany },
  { name: "weekly-digest", handler: weeklyDigest, sideEffect: groupBy },
] as const;

describe.each(crons)("GET /api/cron/$name", ({ name, handler, sideEffect }) => {
  const url = `http://localhost/api/cron/${name}`;

  it("fails CLOSED: 401 with CRON_SECRET unset and no header", async () => {
    const res = await handler(req(url));
    expect(res.status).toBe(401);
    expect(sideEffect).not.toHaveBeenCalled();
  });

  it("401s `Bearer undefined` with CRON_SECRET unset", async () => {
    const res = await handler(req(url, { authorization: "Bearer undefined" }));
    expect(res.status).toBe(401);
    expect(sideEffect).not.toHaveBeenCalled();
  });

  it("401s a wrong bearer", async () => {
    process.env.CRON_SECRET = "cron-secret";
    const res = await handler(req(url, { authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
    expect(sideEffect).not.toHaveBeenCalled();
  });

  it("runs with the right bearer", async () => {
    process.env.CRON_SECRET = "cron-secret";
    const res = await handler(req(url, { authorization: "Bearer cron-secret" }));
    expect(res.status).toBe(200);
    expect(sideEffect).toHaveBeenCalled();
  });
});

describe("/api/cache/revalidate", () => {
  const url = "http://localhost/api/cache/revalidate";
  const body = { method: "POST", body: JSON.stringify({ tags: [] }) };

  it("401s `Bearer undefined` with ADMIN_API_KEY unset (outside development)", async () => {
    // vitest runs with NODE_ENV=test, so the development bypass does not apply.
    expect(process.env.NODE_ENV).not.toBe("development");
    expect((await revalidatePOST(req(url, { authorization: "Bearer undefined" }, body))).status).toBe(401);
    expect((await revalidateGET(req(url, { authorization: "Bearer undefined" }))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("401s a wrong key", async () => {
    process.env.ADMIN_API_KEY = "admin-key";
    expect((await revalidatePOST(req(url, { authorization: "Bearer nope" }, body))).status).toBe(401);
    expect((await revalidateGET(req(url, { authorization: "Bearer nope" }))).status).toBe(401);
  });

  it("accepts the right key", async () => {
    process.env.ADMIN_API_KEY = "admin-key";
    const res = await revalidatePOST(
      req(url, { authorization: "Bearer admin-key" }, { method: "POST", body: JSON.stringify({ all: true }) })
    );
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalled();
    expect((await revalidateGET(req(url, { authorization: "Bearer admin-key" }))).status).toBe(200);
  });
});
