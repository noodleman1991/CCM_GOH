import { describe, it, expect, vi, beforeEach } from "vitest";

const getActorMock = vi.fn<() => any>();
vi.mock("@/lib/authz", () => ({ getActor: () => getActorMock() }));

const fetchMock = vi.fn<(...a: any[]) => Promise<any>>(async () => "evt1"); // approved by default
vi.mock("@/sanity/lib/client", () => ({ client: { fetch: (...a: any[]) => fetchMock(...a) } }));

const db = vi.hoisted(() => {
  const d: any = {
    rsvp: {
      upsert: vi.fn(async () => ({ id: "r1" })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
      findUnique: vi.fn(async () => null),
      count: vi.fn(async () => 3),
    },
  };
  return d;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { setRsvp, clearRsvp, myRsvp, goingCount } from "@/lib/actions/rsvp";

const ACTOR = { id: "u1", role: "community_member" as const };

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(ACTOR);
  fetchMock.mockResolvedValue("evt1");
});

describe("setRsvp", () => {
  it("requires sign-in", async () => {
    getActorMock.mockResolvedValueOnce(null);
    const res = await setRsvp("evt1");
    expect(res.ok).toBe(false);
    expect(db.rsvp.upsert).not.toHaveBeenCalled();
  });

  it("rejects an event that isn't approved", async () => {
    fetchMock.mockResolvedValueOnce(null);
    const res = await setRsvp("evt1");
    expect(res.ok).toBe(false);
    expect(db.rsvp.upsert).not.toHaveBeenCalled();
  });

  it("rejects an invalid status", async () => {
    const res = await setRsvp("evt1", "MAYBE" as any);
    expect(res.ok).toBe(false);
  });

  it("upserts (idempotent) for an approved event", async () => {
    const res = await setRsvp("evt1", "INTERESTED");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.status).toBe("INTERESTED");
    const arg = db.rsvp.upsert.mock.calls[0][0];
    expect(arg.where.userId_eventId).toEqual({ userId: "u1", eventId: "evt1" });
  });
});

describe("clearRsvp", () => {
  it("deletes the user's rsvp", async () => {
    const res = await clearRsvp("evt1");
    expect(res.ok).toBe(true);
    expect(db.rsvp.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", eventId: "evt1" } });
  });
});

describe("myRsvp / goingCount", () => {
  it("myRsvp is null for anonymous", async () => {
    getActorMock.mockResolvedValueOnce(null);
    expect(await myRsvp("evt1")).toBeNull();
  });

  it("myRsvp returns the stored status", async () => {
    db.rsvp.findUnique.mockResolvedValueOnce({ status: "GOING" });
    expect(await myRsvp("evt1")).toBe("GOING");
  });

  it("goingCount returns the count", async () => {
    expect(await goingCount("evt1")).toBe(3);
    expect(db.rsvp.count).toHaveBeenCalledWith({ where: { eventId: "evt1", status: "GOING" } });
  });
});
