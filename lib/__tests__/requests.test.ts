import { describe, it, expect, vi, beforeEach } from "vitest";

const getActorMock = vi.fn<() => any>();
const isStaffMock = vi.fn<(...a: any[]) => boolean>(() => false);
vi.mock("@/lib/authz", () => ({
  getActor: () => getActorMock(),
  isStaff: (...a: any[]) => isStaffMock(...a),
}));

const createNotificationMock = vi.fn<(...a: any[]) => Promise<void>>(async () => {});
vi.mock("@/lib/notifications/service", () => ({
  createNotification: (...a: any[]) => createNotificationMock(...a),
}));

// Prisma surface used by requests.ts. Built via vi.hoisted so the mock factory
// (hoisted to top of file) can reference it without a TDZ error.
const db = vi.hoisted(() => {
  const d: any = {
    collaboration: { findUnique: vi.fn(async () => null) },
    collaborationMember: {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async () => ({})),
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
    user: { findUnique: vi.fn(async () => ({ id: "u2" })) },
    notification: { updateMany: vi.fn(async () => ({ count: 1 })) },
    $transaction: vi.fn(async (fn: any) => fn(d)),
  };
  return d;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import {
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
