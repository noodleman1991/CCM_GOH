import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  collaborationMember: { findUnique: vi.fn() },
  collaboration: { findUnique: vi.fn() },
  conversation: { findUnique: vi.fn(), create: vi.fn() },
  conversationParticipant: { createMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  safeQuery: async (fn: () => Promise<unknown>) => {
    try { return { success: true, data: await fn() }; }
    catch (e) { return { success: false, error: e }; }
  },
}));

import { getOrCreateProjectConversation } from "@/lib/messaging/service";

describe("getOrCreateProjectConversation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null for non-members", async () => {
    prismaMock.collaborationMember.findUnique.mockResolvedValue(null);
    expect(await getOrCreateProjectConversation("c1", "u1")).toBeNull();
    expect(prismaMock.conversation.create).not.toHaveBeenCalled();
  });

  it("returns the existing channel without creating", async () => {
    prismaMock.collaborationMember.findUnique.mockResolvedValue({ role: "EDITOR" });
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv1" });
    expect(await getOrCreateProjectConversation("c1", "u1")).toEqual({ id: "conv1" });
    expect(prismaMock.conversation.create).not.toHaveBeenCalled();
  });

  it("creates the channel with all current members as participants", async () => {
    prismaMock.collaborationMember.findUnique.mockResolvedValue({ role: "OWNER" });
    prismaMock.conversation.findUnique.mockResolvedValue(null);
    prismaMock.collaboration.findUnique.mockResolvedValue({
      members: [{ userId: "u1" }, { userId: "u2" }],
    });
    prismaMock.conversation.create.mockResolvedValue({ id: "conv2" });
    expect(await getOrCreateProjectConversation("c1", "u1")).toEqual({ id: "conv2" });
    const createArg = prismaMock.conversation.create.mock.calls[0][0];
    expect(createArg.data.kind).toBe("PROJECT");
    expect(createArg.data.collaborationId).toBe("c1");
    expect(createArg.data.participants.createMany.data).toEqual([
      { userId: "u1" }, { userId: "u2" },
    ]);
  });
});
