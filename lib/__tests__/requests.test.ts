import { describe, it, expect, vi, beforeEach } from "vitest";

// Return type is `unknown` (not Promise) because some tests use mockReturnValue
// with a plain object — the action `await`s it either way.
const getActorMock = vi.fn<() => unknown>();
const isStaffMock = vi.fn<(...a: unknown[]) => boolean>(() => false);
vi.mock("@/lib/authz", () => ({
  getActor: () => getActorMock(),
  isStaff: (...a: unknown[]) => isStaffMock(...a),
}));

const createNotificationMock = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock("@/lib/notifications/service", () => ({
  createNotification: (...a: unknown[]) => createNotificationMock(...a),
}));

// requests.ts imports authorizeCollab (which transitively pulls the Sanity
// client + its env asserts) — stub the whole service module out.
const authorizeCollabMock = vi.fn<(...a: unknown[]) => Promise<unknown>>(async () => ({ actorId: "u1", role: "OWNER" }));
vi.mock("@/lib/collaboration/service", () => ({
  authorizeCollab: (...a: unknown[]) => authorizeCollabMock(...a),
}));

// Prisma surface used by requests.ts. Built via vi.hoisted so the mock factory
// (hoisted to top of file) can reference it without a TDZ error.
const db = vi.hoisted(() => {
  type MockFn = ReturnType<typeof vi.fn>;
  const d: {
    collaboration: Record<string, MockFn>;
    collaborationMember: Record<string, MockFn>;
    joinRequest: Record<string, MockFn>;
    contactRequest: Record<string, MockFn>;
    collaborationInvite: Record<string, MockFn>;
    user: Record<string, MockFn>;
    notification: Record<string, MockFn>;
    $transaction: MockFn;
  } = {
    collaboration: { findUnique: vi.fn(async () => null) },
    collaborationMember: {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
    },
    joinRequest: {
      upsert: vi.fn(async () => ({ id: "jr1" })),
      findUnique: vi.fn(async () => null),
      update: vi.fn(async () => ({})),
    },
    contactRequest: {
      upsert: vi.fn(async () => ({ id: "cr1" })),
      findUnique: vi.fn(async () => null),
      update: vi.fn(async () => ({})),
    },
    collaborationInvite: {
      upsert: vi.fn(async () => ({ id: "ci1" })),
      findUnique: vi.fn(async () => null),
      update: vi.fn(async () => ({})),
    },
    user: { findUnique: vi.fn(async () => ({ id: "u2" })) },
    notification: { updateMany: vi.fn(async () => ({ count: 1 })) },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(d)),
  };
  return d;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/notifications/emit", () => ({ emitLifecycle: vi.fn(async () => {}) }));

import {
  inviteToCollaboration,
  respondToInviteByTarget,
  requestToJoin,
  respondToJoinRequest,
  requestContact,
  respondToContactRequest,
} from "@/lib/actions/requests";

const ACTOR = { id: "u1", role: "community_member" as const };

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(ACTOR);
  isStaffMock.mockReturnValue(false);
});

describe("requestToJoin", () => {
  it("requires sign-in", async () => {
    getActorMock.mockResolvedValueOnce(null);
    const res = await requestToJoin("collab1");
    expect(res.ok).toBe(false);
  });

  it("404s an unknown workspace", async () => {
    db.collaboration.findUnique.mockResolvedValueOnce(null);
    const res = await requestToJoin("nope");
    expect(res.ok).toBe(false);
  });

  it("rejects when already a member", async () => {
    db.collaboration.findUnique.mockResolvedValueOnce({ id: "c1", title: "T", createdById: "owner1" });
    db.collaborationMember.findUnique.mockResolvedValueOnce({ userId: "u1" });
    const res = await requestToJoin("c1");
    expect(res.ok).toBe(false);
    expect(db.joinRequest.upsert).not.toHaveBeenCalled();
  });

  it("creates the request + notifies the owner", async () => {
    db.collaboration.findUnique.mockResolvedValueOnce({ id: "c1", title: "T", createdById: "owner1" });
    db.collaborationMember.findUnique.mockResolvedValueOnce(null);
    const res = await requestToJoin("c1", "hi");
    expect(res.ok).toBe(true);
    expect(db.joinRequest.upsert).toHaveBeenCalledTimes(1);
    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: "owner1", type: "REQUEST", actorId: "u1" })
    );
  });
});

describe("respondToJoinRequest", () => {
  const baseReq = {
    id: "jr1",
    status: "PENDING",
    requesterId: "u2",
    collaborationId: "c1",
    collaboration: { createdById: "u1" }, // actor u1 is owner
  };

  it("blocks non-owner/non-staff", async () => {
    db.joinRequest.findUnique.mockResolvedValueOnce({ ...baseReq, collaboration: { createdById: "someoneElse" } });
    const res = await respondToJoinRequest("jr1", true);
    expect(res.ok).toBe(false);
  });

  it("accept adds a member + notifies requester", async () => {
    db.joinRequest.findUnique.mockResolvedValueOnce(baseReq);
    const res = await respondToJoinRequest("jr1", true);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.status).toBe("ACCEPTED");
    expect(db.collaborationMember.upsert).toHaveBeenCalledTimes(1);
    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: "u2", type: "REQUEST" })
    );
  });

  it("decline does not add a member", async () => {
    db.joinRequest.findUnique.mockResolvedValueOnce(baseReq);
    const res = await respondToJoinRequest("jr1", false);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.status).toBe("DECLINED");
    expect(db.collaborationMember.upsert).not.toHaveBeenCalled();
  });

  it("rejects an already-resolved request", async () => {
    db.joinRequest.findUnique.mockResolvedValueOnce({ ...baseReq, status: "ACCEPTED" });
    const res = await respondToJoinRequest("jr1", true);
    expect(res.ok).toBe(false);
  });

  it("marks the originating REQUEST notification resolved so it stops being actionable", async () => {
    db.joinRequest.findUnique.mockResolvedValueOnce(baseReq);
    await respondToJoinRequest("jr1", true);
    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ recipientId: "u1", type: "REQUEST", entityType: "joinRequest" }),
        data: expect.objectContaining({ entityType: "joinRequestResolved" }),
      })
    );
  });
});

describe("contact requests", () => {
  it("requestContact rejects self", async () => {
    const res = await requestContact("u1");
    expect(res.ok).toBe(false);
  });

  it("requestContact notifies the recipient", async () => {
    db.user.findUnique.mockResolvedValueOnce({ id: "u2" });
    const res = await requestContact("u2", "hello");
    expect(res.ok).toBe(true);
    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: "u2", type: "REQUEST", actorId: "u1" })
    );
  });

  it("respondToContactRequest blocks non-recipient", async () => {
    db.contactRequest.findUnique.mockResolvedValueOnce({ id: "cr1", status: "PENDING", requesterId: "u2", recipientId: "someoneElse" });
    const res = await respondToContactRequest("cr1", true);
    expect(res.ok).toBe(false);
  });

  it("respondToContactRequest accepts when actor is recipient", async () => {
    db.contactRequest.findUnique.mockResolvedValueOnce({ id: "cr1", status: "PENDING", requesterId: "u2", recipientId: "u1" });
    const res = await respondToContactRequest("cr1", true);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.status).toBe("ACCEPTED");
    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: "u2", type: "REQUEST" })
    );
  });
});

describe("workspace invites", () => {
  beforeEach(() => {
    getActorMock.mockReturnValue({ id: "u1" });
    authorizeCollabMock.mockResolvedValue({ actorId: "u1", role: "OWNER" });
  });

  it("rejects self-invite", async () => {
    const res = await inviteToCollaboration("c1", "u1");
    expect(res.ok).toBe(false);
  });

  it("blocks non-owners via authorizeCollab", async () => {
    authorizeCollabMock.mockRejectedValueOnce(new Error("Forbidden"));
    const res = await inviteToCollaboration("c1", "u2");
    expect(res.ok).toBe(false);
  });

  it("rejects inviting an existing member", async () => {
    db.collaboration.findUnique.mockResolvedValueOnce({ title: "W" });
    db.collaborationMember.findUnique.mockResolvedValueOnce({ userId: "u2" });
    const res = await inviteToCollaboration("c1", "u2");
    expect(res.ok).toBe(false);
  });

  it("upserts the invite + notifies the invitee", async () => {
    db.collaboration.findUnique.mockResolvedValueOnce({ title: "Coastal minds" });
    db.collaborationMember.findUnique.mockResolvedValueOnce(null);
    const res = await inviteToCollaboration("c1", "u2");
    expect(res.ok).toBe(true);
    expect(db.collaborationInvite.upsert).toHaveBeenCalled();
    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: "u2",
        type: "REQUEST",
        entityType: "collaborationInvite",
        entityId: "c1",
      })
    );
  });

  it("accept joins as VIEWER + notifies the inviter", async () => {
    db.collaborationInvite.findUnique.mockResolvedValueOnce({
      id: "ci1", status: "PENDING", inviterId: "u9",
      collaboration: { title: "Coastal minds" },
    });
    const res = await respondToInviteByTarget("c1", true);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.status).toBe("ACCEPTED");
    expect(db.collaborationMember.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ userId: "u1", role: "VIEWER" }),
      })
    );
    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: "u9", entityType: "collaborationInviteResolved" })
    );
  });

  it("decline does not add a member and rejects re-resolution", async () => {
    db.collaborationInvite.findUnique.mockResolvedValueOnce({
      id: "ci1", status: "PENDING", inviterId: "u9",
      collaboration: { title: "W" },
    });
    const res = await respondToInviteByTarget("c1", false);
    expect(res.ok).toBe(true);
    expect(db.collaborationMember.upsert).not.toHaveBeenCalled();

    db.collaborationInvite.findUnique.mockResolvedValueOnce({
      id: "ci1", status: "DECLINED", inviterId: "u9",
      collaboration: { title: "W" },
    });
    const res2 = await respondToInviteByTarget("c1", false);
    expect(res2.ok).toBe(false);
  });
});
