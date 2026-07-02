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

import { collaborationIdForTarget } from "@/lib/comments/target";

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
