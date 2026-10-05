import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const create = vi.hoisted(() => vi.fn(async (_n: unknown) => {}));
vi.mock("@/lib/notifications/service", () => ({ createNotification: create }));
const db = vi.hoisted(() => ({
  follow: { findMany: vi.fn() },
  notification: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: db,
  safeQuery: async (fn: () => Promise<unknown>) => { try { return { success: true, data: await fn() }; } catch (e) { return { success: false, error: e }; } },
}));
import { notifyOutcomeInHub, notifyRegionFollowers } from "@/lib/notifications/outcomes";

beforeEach(() => {
  create.mockClear();
  db.follow.findMany.mockReset();
  db.notification.findMany.mockReset();
  db.notification.findMany.mockResolvedValue([]);
});

describe("what happened to what you sent", () => {
  it("reaches the sender in the hub", async () => {
    await notifyOutcomeInHub({ kind: "livedExperience", submittedBy: "u1", title: "Rising tide", status: "revision" });
    expect(create).toHaveBeenCalledWith({ recipientId: "u1", type: "OUTPUT_STATUS", entityType: "contribution", entityId: "livedExperience", snippet: JSON.stringify({ k: "outcome", p: { title: "Rising tide", status: "revision" } }) });
  });
  it("says nothing without a sender or while it's still waiting", async () => {
    await notifyOutcomeInHub({ kind: "event", submittedBy: null, title: "x", status: "approved" });
    await notifyOutcomeInHub({ kind: "event", submittedBy: "u1", title: "x", status: "pending" });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("a new event in a region you follow", () => {
  it("reaches each follower of the event's community", async () => {
    db.follow.findMany.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]);
    expect(await notifyRegionFollowers({ communitySlug: "oceania", eventSlug: "reef-day", eventTitle: "Reef day" })).toBe(2);
    expect(db.follow.findMany.mock.calls[0][0].where).toEqual({ targetType: "REGION", targetId: "oceania" });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ recipientId: "u1", type: "FOLLOWED_PUBLISH", entityType: "event", entityId: "reef-day" }));
  });
  it("comes at most once a day per region", async () => {
    db.follow.findMany.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]);
    db.notification.findMany.mockResolvedValue([{ recipientId: "u1" }]);
    expect(await notifyRegionFollowers({ communitySlug: "oceania", eventSlug: "reef-2", eventTitle: "Reef 2", now: new Date("2026-11-01T12:00:00Z") })).toBe(1);
    const where = db.notification.findMany.mock.calls[0][0].where;
    expect(where.createdAt).toEqual({ gte: new Date("2026-10-31T12:00:00Z") });
    expect(where.snippet).toEqual({ contains: '"region":"oceania"' });
    expect(create.mock.calls.map(([n]) => (n as { recipientId: string }).recipientId)).toEqual(["u2"]);
  });
  it("does nothing for an event without a community", async () => {
    expect(await notifyRegionFollowers({ communitySlug: null, eventSlug: "x", eventTitle: "x" })).toBe(0);
    expect(db.follow.findMany).not.toHaveBeenCalled();
  });
});
