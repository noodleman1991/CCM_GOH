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
      create: vi.fn(async () => ({ id: "cr1" })),
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

// Rate limiter: the real module would run against the mocked Prisma client and
// silently fall through to its in-memory backend. Mock the assertion itself so
// tests can check the key/limits and force a RateLimitError. importOriginal
// keeps the real RateLimitError class, so the `instanceof` check inside the
// action matches what the tests throw.
const assertRateLimitMock = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  assertRateLimit: (...a: unknown[]) => assertRateLimitMock(...a),
}));

import {
  inviteToCollaboration,
  respondToInviteByTarget,
  requestToJoin,
  respondToJoinRequest,
  requestContact,
  respondToContactRequest,
} from "@/lib/actions/requests";
import { RateLimitError } from "@/lib/rate-limit";
import { CONTACT_REQUEST_COOLDOWN_DAYS, nextContactRequestState } from "@/lib/requests/contact-state";

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

  it("requestContact creates a PENDING row and notifies the recipient when none exists", async () => {
    db.user.findUnique.mockResolvedValueOnce({ id: "u2" });
    db.contactRequest.findUnique.mockResolvedValueOnce(null);
    const res = await requestContact("u2", "hello");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.status).toBe("PENDING");
    expect(db.contactRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ requesterId: "u1", recipientId: "u2", message: "hello" }),
      })
    );
    // The blind upsert is gone: it is what re-opened DECLINED and downgraded ACCEPTED.
    expect(db.contactRequest.upsert).not.toHaveBeenCalled();
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

/* ------------------------------------------ contact-request state machine ----- */

const DAY_MS = 86_400_000;
const NOW = new Date("2026-09-16T12:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

describe("nextContactRequestState (pure)", () => {
  it("creates when there is no existing row", () => {
    expect(nextContactRequestState(null, NOW)).toEqual({ kind: "create" });
  });

  it("is a no-op on an existing PENDING row (idempotent re-request)", () => {
    const existing = { status: "PENDING" as const, createdAt: daysAgo(1), resolvedAt: null };
    expect(nextContactRequestState(existing, NOW)).toEqual({ kind: "noop", status: "PENDING" });
  });

  it("never touches an ACCEPTED row, however old", () => {
    const existing = { status: "ACCEPTED" as const, createdAt: daysAgo(400), resolvedAt: daysAgo(399) };
    expect(nextContactRequestState(existing, NOW)).toEqual({ kind: "noop", status: "ACCEPTED" });
  });

  it("re-opens a DECLINED row once the cooldown has fully elapsed", () => {
    const existing = {
      status: "DECLINED" as const,
      createdAt: daysAgo(CONTACT_REQUEST_COOLDOWN_DAYS + 5),
      resolvedAt: daysAgo(CONTACT_REQUEST_COOLDOWN_DAYS + 1),
    };
    expect(nextContactRequestState(existing, NOW)).toEqual({ kind: "reopen" });
  });

  it("refuses a DECLINED row inside the cooldown and says when it lifts", () => {
    const resolvedAt = daysAgo(3);
    const existing = { status: "DECLINED" as const, createdAt: daysAgo(4), resolvedAt };
    expect(nextContactRequestState(existing, NOW)).toEqual({
      kind: "cooldown",
      retryAt: new Date(resolvedAt.getTime() + CONTACT_REQUEST_COOLDOWN_DAYS * DAY_MS),
    });
  });

  it("cooldown boundary: exactly N days is allowed, one millisecond less is not", () => {
    const exact = {
      status: "DECLINED" as const,
      createdAt: daysAgo(40),
      resolvedAt: daysAgo(CONTACT_REQUEST_COOLDOWN_DAYS),
    };
    expect(nextContactRequestState(exact, NOW)).toEqual({ kind: "reopen" });

    const oneMsShort = {
      status: "DECLINED" as const,
      createdAt: daysAgo(40),
      resolvedAt: new Date(daysAgo(CONTACT_REQUEST_COOLDOWN_DAYS).getTime() + 1),
    };
    expect(nextContactRequestState(oneMsShort, NOW).kind).toBe("cooldown");
  });

  it("falls back to createdAt when a DECLINED row has no resolvedAt (legacy rows)", () => {
    const recent = { status: "DECLINED" as const, createdAt: daysAgo(2), resolvedAt: null };
    expect(nextContactRequestState(recent, NOW).kind).toBe("cooldown");
    const old = {
      status: "DECLINED" as const,
      createdAt: daysAgo(CONTACT_REQUEST_COOLDOWN_DAYS + 1),
      resolvedAt: null,
    };
    expect(nextContactRequestState(old, NOW)).toEqual({ kind: "reopen" });
  });

  it("exports a 30-day cooldown", () => {
    expect(CONTACT_REQUEST_COOLDOWN_DAYS).toBe(30);
  });
});

describe("requestContact state machine (mocked Prisma)", () => {
  beforeEach(() => {
    db.user.findUnique.mockResolvedValue({ id: "u2" });
  });

  it("is rate limited per requesting user (20 / hour), keyed on the Clerk user id", async () => {
    db.contactRequest.findUnique.mockResolvedValueOnce(null);
    await requestContact("u2");
    expect(assertRateLimitMock).toHaveBeenCalledWith("u1", "contact:request", { limit: 20, windowSeconds: 3600 });
  });

  it("returns a translatable RATE_LIMIT error and writes nothing when over the limit", async () => {
    assertRateLimitMock.mockRejectedValueOnce(new RateLimitError("Too many requests", 60));
    const res = await requestContact("u2");
    expect(res).toEqual({ ok: false, error: "requests.errors.rateLimit", code: "RATE_LIMIT" });
    expect(db.contactRequest.create).not.toHaveBeenCalled();
    expect(db.contactRequest.update).not.toHaveBeenCalled();
    expect(db.contactRequest.upsert).not.toHaveBeenCalled();
    expect(createNotificationMock).not.toHaveBeenCalled();
  });

  it("re-requesting while PENDING neither writes nor re-notifies", async () => {
    db.contactRequest.findUnique.mockResolvedValueOnce({ status: "PENDING", createdAt: daysAgo(1), resolvedAt: null });
    const res = await requestContact("u2", "again");
    expect(res).toEqual({ ok: true, status: "PENDING" });
    expect(db.contactRequest.create).not.toHaveBeenCalled();
    expect(db.contactRequest.update).not.toHaveBeenCalled();
    expect(db.contactRequest.upsert).not.toHaveBeenCalled();
    expect(createNotificationMock).not.toHaveBeenCalled();
  });

  it("never writes to an ACCEPTED row (a downgrade would break CONTACTS-tier messaging)", async () => {
    db.contactRequest.findUnique.mockResolvedValueOnce({
      status: "ACCEPTED",
      createdAt: daysAgo(100),
      resolvedAt: daysAgo(99),
    });
    const res = await requestContact("u2");
    expect(res).toEqual({ ok: true, status: "ACCEPTED" });
    expect(db.contactRequest.create).not.toHaveBeenCalled();
    expect(db.contactRequest.update).not.toHaveBeenCalled();
    expect(db.contactRequest.upsert).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(createNotificationMock).not.toHaveBeenCalled();
  });

  it("refuses a recently DECLINED request with a translatable COOLDOWN error", async () => {
    db.contactRequest.findUnique.mockResolvedValueOnce({ status: "DECLINED", createdAt: daysAgo(3), resolvedAt: daysAgo(2) });
    const res = await requestContact("u2");
    expect(res).toEqual({ ok: false, error: "requests.errors.cooldown", code: "COOLDOWN" });
    expect(db.contactRequest.create).not.toHaveBeenCalled();
    expect(db.contactRequest.update).not.toHaveBeenCalled();
    expect(db.contactRequest.upsert).not.toHaveBeenCalled();
    expect(createNotificationMock).not.toHaveBeenCalled();
  });

  it("re-opens a DECLINED request after the cooldown, as PENDING, and notifies", async () => {
    db.contactRequest.findUnique.mockResolvedValueOnce({
      status: "DECLINED",
      createdAt: daysAgo(CONTACT_REQUEST_COOLDOWN_DAYS + 2),
      resolvedAt: daysAgo(CONTACT_REQUEST_COOLDOWN_DAYS + 1),
    });
    const res = await requestContact("u2", "second try");
    expect(res).toEqual({ ok: true, status: "PENDING" });
    expect(db.contactRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { requesterId_recipientId: { requesterId: "u1", recipientId: "u2" } },
        data: { status: "PENDING", message: "second try", resolvedAt: null },
      })
    );
    expect(db.contactRequest.create).not.toHaveBeenCalled();
    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: "u2", type: "REQUEST", actorId: "u1" })
    );
  });

  it("treats a concurrent duplicate create (P2002) as the PENDING no-op", async () => {
    db.contactRequest.findUnique.mockResolvedValueOnce(null);
    db.contactRequest.create.mockRejectedValueOnce(Object.assign(new Error("Unique constraint"), { code: "P2002" }));
    const res = await requestContact("u2");
    expect(res).toEqual({ ok: true, status: "PENDING" });
    expect(createNotificationMock).not.toHaveBeenCalled();
  });
});
