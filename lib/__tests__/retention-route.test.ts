import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const deleteMany = { downloadEvent: vi.fn(), rateLimit: vi.fn(), notification: vi.fn() };
vi.mock("@/lib/prisma", () => ({
  prisma: {
    downloadEvent: { deleteMany: (...a: unknown[]) => deleteMany.downloadEvent(...a) },
    rateLimit: { deleteMany: (...a: unknown[]) => deleteMany.rateLimit(...a) },
    notification: { deleteMany: (...a: unknown[]) => deleteMany.notification(...a) },
  },
  safeQuery: async (fn: () => Promise<unknown>) => {
    try {
      return { success: true, data: await fn() };
    } catch (error) {
      return { success: false, error };
    }
  },
}));

import { GET } from "@/app/api/cron/retention/route";

const req = () =>
  new NextRequest("http://localhost/api/cron/retention", { headers: { authorization: "Bearer cron-secret" } });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  process.env.CRON_SECRET = "cron-secret";
  deleteMany.downloadEvent.mockResolvedValue({ count: 3 });
  deleteMany.rateLimit.mockResolvedValue({ count: 10 });
  deleteMany.notification.mockResolvedValue({ count: 1 });
});

describe("GET /api/cron/retention", () => {
  it("reports ok with the purge counts when every sweep succeeds", async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, purged: { downloadEvents: 3, rateLimits: 10, notifications: 1 } });
  });

  it("answers 500 with ok:false when any sweep fails — a retention promise that silently lapses is a policy breach", async () => {
    deleteMany.notification.mockRejectedValue(new Error("connection reset"));
    const res = await GET(req());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.purged).toMatchObject({ downloadEvents: 3, rateLimits: 10 });
    expect(body.failed).toEqual(["notifications"]);
  });
});
