import { describe, it, expect, vi, beforeEach } from "vitest";

// lib/comments/target.ts resolves Sanity-backed target types through
// lib/content/discovery.ts's resolveCommentTarget; stub it so this test
// doesn't need NEXT_PUBLIC_SANITY_DATASET.
const resolveCommentTargetMock = vi.fn();
vi.mock("@/lib/content/discovery", () => ({
  resolveCommentTarget: (...a: unknown[]) => resolveCommentTargetMock(...a),
}));

const { queryRawUnsafeMock, prismaMock } = vi.hoisted(() => {
  const queryRawUnsafeMock = vi.fn();
  return { queryRawUnsafeMock, prismaMock: { $queryRawUnsafe: queryRawUnsafeMock } };
});
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  safeQuery: async (fn: () => Promise<unknown>) => {
    try {
      return { success: true, data: await fn() };
    } catch {
      return { success: false, data: undefined };
    }
  },
}));

import { collaborationIdForTarget, isCommentTargetValid } from "@/lib/comments/target";

describe("isCommentTargetValid(researchOutput)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates to resolveCommentTarget and validates existing ids", async () => {
    resolveCommentTargetMock.mockResolvedValue({ type: "researchOutput", id: "ro1" });
    expect(await isCommentTargetValid("researchOutput", "ro1")).toBe(true);
    expect(resolveCommentTargetMock).toHaveBeenCalledWith("researchOutput", "ro1");
  });

  it("returns false when resolveCommentTarget finds no matching document", async () => {
    resolveCommentTargetMock.mockResolvedValue(null);
    expect(await isCommentTargetValid("researchOutput", "missing")).toBe(false);
  });
});

describe("collaborationIdForTarget(collaborationDoc)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves the doc's collaboration id", async () => {
    queryRawUnsafeMock.mockResolvedValue([{ collaborationId: "c9" }]);
    expect(await collaborationIdForTarget("collaborationDoc", "d1")).toBe("c9");
    expect(queryRawUnsafeMock).toHaveBeenCalledWith(
      expect.stringContaining("CollaborationDoc"),
      "d1"
    );
  });

  it("returns null for a missing doc", async () => {
    queryRawUnsafeMock.mockResolvedValue([]);
    expect(await collaborationIdForTarget("collaborationDoc", "nope")).toBeNull();
  });
});

describe("isCommentTargetValid(collaborationThread) — never calls resolveCommentTarget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("checks Postgres directly for a workspace target type, bypassing content resolution", async () => {
    queryRawUnsafeMock.mockResolvedValue([{ n: BigInt(1) }]);
    expect(await isCommentTargetValid("collaborationThread", "th1")).toBe(true);
    expect(resolveCommentTargetMock).not.toHaveBeenCalled();
  });
});
