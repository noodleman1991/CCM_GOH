import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * While Settings → Collaboration keeps a tool off (the live site today), its
 * pages redirect home — and the server actions behind its buttons must refuse
 * too, before any database work, or a member could create a workspace, start
 * a conversation or ask to connect and watch a real row appear behind a page
 * they can't open (Slice 6; opening-collaboration spec C1).
 */
const { prisma, actor } = vi.hoisted(() => ({
  prisma: {
    collaboration: { create: vi.fn(), findUnique: vi.fn() },
    conversation: { create: vi.fn(), findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
    contactRequest: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    rsvp: { upsert: vi.fn() },
    collaborationMember: { create: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
  actor: { id: "u1", role: "community_member", clerkId: "clerk_1" },
}));
// Settings → Collaboration as the live site has it: every collaboration tool off.
const collab = vi.hoisted(() => ({ access: null as unknown }));
vi.mock("@/lib/collaboration/access-server", () => ({ getCollaborationAccessFor: vi.fn(async () => collab.access) }));
// These import the Sanity client at module load (which asserts a token);
// none of them may be reached when the flag is off.
vi.mock("@/lib/content/discovery", () => ({
  getApprovedEventForRsvp: vi.fn(),
  getEventEditGate: vi.fn(),
  submitEvent: vi.fn(),
  updateEvent: vi.fn(),
}));
vi.mock("@/lib/actions/workspace-outputs", () => ({ addOutput: vi.fn() }));
vi.mock("@/lib/collaboration/seed", () => ({ seedWorkspace: vi.fn() }));
vi.mock("@/lib/notifications/service", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/notifications/emit", () => ({ emitLifecycle: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/authz", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz")>();
  return { ...actual, getActor: vi.fn(async () => actor), requireActor: vi.fn(async () => actor) };
});
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn(async () => undefined), RateLimitError: class extends Error {} }));
vi.mock("@/lib/rate-limit-route", () => ({ rateLimitRequest: vi.fn(async () => null) }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "clerk_1" })),
  currentUser: vi.fn(async () => ({ id: "clerk_1", emailAddresses: [] })),
}));

import { createCollaboration } from "@/lib/actions/collaboration";
import { startConversation } from "@/lib/actions/messaging";
import { requestContact } from "@/lib/actions/requests";
import { setRsvp } from "@/lib/actions/rsvp";
import { ALL_OFF, collaborationAccess } from "@/lib/collaboration/access";

beforeEach(() => {
  vi.clearAllMocks();
  collab.access = collaborationAccess(ALL_OFF, actor.role);
});

const touchedDb = () =>
  Object.values(prisma)
    .flatMap((model) => (typeof model === "function" ? [model] : Object.values(model as Record<string, unknown>)))
    .some((fn) => (fn as { mock?: { calls: unknown[] } }).mock?.calls.length);

describe("collaboration server actions while Settings → Collaboration has them off", () => {
  it("createCollaboration refuses before touching the database", async () => {
    const res = await createCollaboration({ title: "A workspace" } as never);
    expect(res.ok).toBe(false);
    expect(touchedDb()).toBe(false);
  });

  it("startConversation refuses before touching the database", async () => {
    const res = await startConversation("u2");
    expect(res.ok).toBe(false);
    expect(touchedDb()).toBe(false);
  });

  it("requestContact refuses before touching the database", async () => {
    const res = await requestContact("u2");
    expect(res.ok).toBe(false);
    expect(touchedDb()).toBe(false);
  });

  it("createCollaboration refuses a member while workspaces are open to the team only", async () => {
    collab.access = collaborationAccess({ ...ALL_OFF, workspaces: "team" }, "community_member");
    const res = await createCollaboration({ title: "A workspace" } as never);
    expect(res.ok).toBe(false);
    expect(touchedDb()).toBe(false);
  });

});

// RSVP is no longer behind the flag (user, 2026-10-03): event pages are public
// and members can say they're going with the engagement program still off.
describe("with every collaboration tool off, RSVP still works", () => {
  it("saves the member's RSVP", async () => {
    const { getApprovedEventForRsvp } = await import("@/lib/content/discovery");
    vi.mocked(getApprovedEventForRsvp).mockResolvedValue({ _id: "evt1", title: "Reef day", startAt: null, slug: "reef-day", submittedBy: null } as never);
    (prisma.rsvp as Record<string, ReturnType<typeof vi.fn>>).findUnique = vi.fn(async () => null);
    const res = await setRsvp("evt1", "GOING");
    expect(res.ok).toBe(true);
    expect(prisma.rsvp.upsert).toHaveBeenCalled();
  });
});

// POST /api/events/submit is no longer behind the flag: any signed-in member may
// suggest an event (events spec E1/E5); its own guards are tested in
// event-submit-route.test.ts.
