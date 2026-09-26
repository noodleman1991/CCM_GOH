import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const groupBy = vi.fn();
const count = vi.fn();
const findUnique = vi.fn();
const upsert = vi.fn();
const update = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { groupBy: (...a: unknown[]) => groupBy(...a), count: (...a: unknown[]) => count(...a) },
    user: { findUnique: (...a: unknown[]) => findUnique(...a) },
    notificationPreference: { upsert: (...a: unknown[]) => upsert(...a), update: (...a: unknown[]) => update(...a) },
  },
  safeQuery: async (fn: () => Promise<unknown>) => {
    try {
      return { success: true, data: await fn() };
    } catch (error) {
      return { success: false, error };
    }
  },
}));

const sendWeeklyDigestEmail = vi.fn();
vi.mock("@/lib/notifications/email", () => ({
  sendWeeklyDigestEmail: (...a: unknown[]) => sendWeeklyDigestEmail(...a),
}));

import { GET } from "@/app/api/cron/weekly-digest/route";

const req = () =>
  new NextRequest("http://localhost/api/cron/weekly-digest", { headers: { authorization: "Bearer cron-secret" } });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.CRON_SECRET = "cron-secret";
  groupBy.mockResolvedValue([
    { recipientId: "u-ok", type: "COMMENT_REPLY", _count: 2 },
    { recipientId: "u-rejected", type: "MENTION", _count: 1 },
    { recipientId: "u-throws", type: "MESSAGE", _count: 3 },
  ]);
  count.mockResolvedValue(4);
  findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
    email: `${where.id}@example.org`,
    preferredLanguage: "en",
  }));
  upsert.mockImplementation(async ({ where }: { where: { userId: string } }) => ({
    userId: where.userId,
    emailWeeklyDigest: true,
    digestSentAt: null,
    unsubscribeToken: `tok-${where.userId}`,
  }));
  update.mockResolvedValue({});
});

describe("GET /api/cron/weekly-digest", () => {
  it("stamps digestSentAt only for the people whose email was actually accepted, and reports failures", async () => {
    sendWeeklyDigestEmail.mockImplementation(async ({ email }: { email: string }) => {
      if (email.startsWith("u-ok")) return { ok: true, id: "email_1" };
      if (email.startsWith("u-rejected")) return { ok: false, reason: "sandbox sender", retriable: false };
      throw new Error("resend exploded");
    });

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ users: 3, sent: 1, skipped: 0, failed: 2 });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]![0]).toMatchObject({ where: { userId: "u-ok" } });
  });

  it("a person who threw does not stop the loop for the people after them", async () => {
    sendWeeklyDigestEmail.mockImplementation(async ({ email }: { email: string }) => {
      if (email.startsWith("u-ok")) throw new Error("first one explodes");
      return { ok: true, id: "email_x" };
    });
    const body = await (await GET(req())).json();
    expect(body).toMatchObject({ sent: 2, failed: 1 });
  });

  it("still skips opted-out and recently-digested people without counting them as failures", async () => {
    upsert.mockImplementation(async ({ where }: { where: { userId: string } }) => ({
      userId: where.userId,
      emailWeeklyDigest: where.userId !== "u-rejected",
      digestSentAt: where.userId === "u-throws" ? new Date() : null,
      unsubscribeToken: `tok-${where.userId}`,
    }));
    sendWeeklyDigestEmail.mockResolvedValue({ ok: true, id: "email_1" });
    const body = await (await GET(req())).json();
    expect(body).toMatchObject({ sent: 1, skipped: 2, failed: 0 });
  });
});
