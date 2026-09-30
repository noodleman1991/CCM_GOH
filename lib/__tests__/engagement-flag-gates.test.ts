import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * With `NEXT_PUBLIC_FEATURE_ENGAGEMENT` unset (production today), the
 * engagement pages redirect home — but the buttons that lead to them still
 * rendered and the server actions behind them still ran. A member could
 * create a workspace, start a conversation, request contact or RSVP, watch a
 * real row appear, and then be redirected to `/`. The actions and the event
 * submission route now refuse when the flag is off, before any database
 * work; the buttons are gated in Slice 6's components.
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
vi.mock("@/lib/features", () => ({ FEATURES: { engagement: false } }));
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

beforeEach(() => {
  vi.clearAllMocks();
});

const touchedDb = () =>
  Object.values(prisma)
    .flatMap((model) => (typeof model === "function" ? [model] : Object.values(model as Record<string, unknown>)))
    .some((fn) => (fn as { mock?: { calls: unknown[] } }).mock?.calls.length);

describe("engagement server actions with the flag off", () => {
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

  it("setRsvp refuses before touching the database", async () => {
    const res = await setRsvp("evt1", "GOING");
    expect(res.ok).toBe(false);
    expect(touchedDb()).toBe(false);
  });
});

// POST /api/events/submit is no longer behind the flag: any signed-in member may
// suggest an event (events spec E1/E5); its own guards are tested in
// event-submit-route.test.ts.
