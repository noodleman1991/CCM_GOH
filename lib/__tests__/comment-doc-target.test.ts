import { describe, it, expect, vi, beforeEach } from "vitest";

// lib/comments/target.ts also imports the Sanity client for the Sanity-backed
// target types; stub it so this test doesn't need NEXT_PUBLIC_SANITY_DATASET.
vi.mock("@/sanity/lib/client", () => ({ client: { fetch: vi.fn() } }));

const { queryRawUnsafeMock, prismaMock } = vi.hoisted(() => {
  const queryRawUnsafeMock = vi.fn();
  return { queryRawUnsafeMock, prismaMock: { $queryRawUnsafe: queryRawUnsafeMock } };
});
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  safeQuery: async (fn: any) => {
    try {
      return { success: true, data: await fn() };
    } catch {
      return { success: false, data: undefined };
    }
  },
}));

import { client } from "@/sanity/lib/client";
import { collaborationIdForTarget, isCommentTargetValid } from "@/lib/comments/target";

describe("isCommentTargetValid(researchOutput)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the researchOutput predicate (approved-only) and validates existing ids", async () => {
    (client.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    expect(await isCommentTargetValid("researchOutput", "ro1")).toBe(true);
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "researchOutput" && status == "approved"'),
      { id: "ro1" }
    );
  });

  it("returns false when no matching document exists", async () => {
    (client.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(0);
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
