import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock authz + prisma before importing the actions under test.
const getActorMock = vi.fn();
vi.mock("@/lib/authz", () => ({
  getActor: () => getActorMock(),
}));

const upsertMock = vi.fn<(...a: unknown[]) => Promise<unknown>>(async () => ({ id: "f1" }));
const deleteManyMock = vi.fn<(...a: unknown[]) => Promise<unknown>>(async () => ({ count: 1 }));
const findUniqueMock = vi.fn<(...a: unknown[]) => Promise<unknown>>(async () => null);
vi.mock("@/lib/prisma", () => ({
  prisma: {
    follow: {
      upsert: (...a: unknown[]) => upsertMock(...a),
      deleteMany: (...a: unknown[]) => deleteManyMock(...a),
      findUnique: (...a: unknown[]) => findUniqueMock(...a),
    },
  },
}));

import { followTarget, unfollowTarget, isFollowing } from "@/lib/actions/follows";

const ACTOR = { id: "u1", role: "community_member" as const };

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(ACTOR);
});

describe("followTarget", () => {
  it("requires a signed-in actor", async () => {
    getActorMock.mockResolvedValueOnce(null);
    const res = await followTarget({ targetType: "REGION", targetId: "oceania" });
    expect(res.ok).toBe(false);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid target type", async () => {
    const res = await followTarget({ targetType: "GALAXY" as never, targetId: "x" });
    expect(res.ok).toBe(false);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("rejects an empty targetId", async () => {
    const res = await followTarget({ targetType: "THEME", targetId: "" });
    expect(res.ok).toBe(false);
  });

  it("upserts so re-following is idempotent (update:{} no-op)", async () => {
    const res = await followTarget({ targetType: "PROJECT", targetId: "collab123" });
    expect(res.ok).toBe(true);
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const arg = upsertMock.mock.calls[0][0] as {
      where: { userId_targetType_targetId: unknown };
      update: unknown;
    };
    expect(arg.where.userId_targetType_targetId).toEqual({
      userId: "u1",
      targetType: "PROJECT",
      targetId: "collab123",
    });
    expect(arg.update).toEqual({});
  });
});

describe("unfollowTarget", () => {
  it("deletes the follow row and reports following:false", async () => {
    const res = await unfollowTarget({ targetType: "REGION", targetId: "oceania" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.following).toBe(false);
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { userId: "u1", targetType: "REGION", targetId: "oceania" },
    });
  });

  it("requires sign-in", async () => {
    getActorMock.mockResolvedValueOnce(null);
    const res = await unfollowTarget({ targetType: "REGION", targetId: "oceania" });
    expect(res.ok).toBe(false);
    expect(deleteManyMock).not.toHaveBeenCalled();
  });
});

describe("isFollowing", () => {
  it("is false for anonymous", async () => {
    getActorMock.mockResolvedValueOnce(null);
    expect(await isFollowing({ targetType: "REGION", targetId: "oceania" })).toBe(false);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("is true when a row exists", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "f1" });
    expect(await isFollowing({ targetType: "THEME", targetId: "anxiety" })).toBe(true);
  });

  it("is false when no row exists", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    expect(await isFollowing({ targetType: "THEME", targetId: "anxiety" })).toBe(false);
  });
});
