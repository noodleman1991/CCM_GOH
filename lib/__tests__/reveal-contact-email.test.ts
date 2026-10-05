import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const actor = vi.hoisted(() => ({ value: { id: "me", role: "community_member" } as { id: string; role: string } | null }));
vi.mock("@/lib/authz", () => ({ getActor: async () => actor.value }));
const human = vi.hoisted(() => ({ ok: true, configured: true }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: async () => human.ok, turnstileConfigured: () => human.configured }));
const limit = vi.hoisted(() => ({ hit: false }));
vi.mock("@/lib/rate-limit", () => ({
  RateLimitError: class extends Error {},
  assertRateLimit: async () => { if (limit.hit) { const { RateLimitError } = await import("@/lib/rate-limit"); throw new RateLimitError("slow"); } },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "1.2.3.4" }) }));
const connected = vi.hoisted(() => ({ email: null as string | null }));
vi.mock("@/lib/collaborate/connection", () => ({ connectedEmail: async () => connected.email }));
const db = vi.hoisted(() => ({ user: { findUnique: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
import { revealContactEmail } from "@/lib/actions/reveal-contact-email";

beforeEach(() => {
  actor.value = { id: "me", role: "community_member" };
  human.ok = true; human.configured = true; limit.hit = false; connected.email = null;
  db.user.findUnique.mockReset();
  db.user.findUnique.mockResolvedValue({ email: "amina@example.org", showEmail: true, profileVisibility: "PUBLIC" });
});

describe("showing a member's email, one human at a time", () => {
  it("needs the human check to pass first — nothing is read otherwise", async () => {
    human.ok = false;
    expect(await revealContactEmail({ profileUserId: "u2", token: "t" })).toEqual({ ok: false, error: "notHuman" });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
  it("is closed when the check isn't set up", async () => {
    human.configured = false;
    expect(await revealContactEmail({ profileUserId: "u2", token: "t" })).toEqual({ ok: false, error: "unavailable" });
  });
  it("gives the email someone chose to show on a public profile, even to a visitor", async () => {
    actor.value = null;
    expect(await revealContactEmail({ profileUserId: "u2", token: "t" })).toEqual({ ok: true, email: "amina@example.org" });
  });
  it("keeps a members-only profile's email to signed-in members", async () => {
    db.user.findUnique.mockResolvedValue({ email: "amina@example.org", showEmail: true, profileVisibility: "MEMBERS" });
    actor.value = null;
    expect(await revealContactEmail({ profileUserId: "u2", token: "t" })).toEqual({ ok: false, error: "notShared" });
    actor.value = { id: "me", role: "community_member" };
    expect(await revealContactEmail({ profileUserId: "u2", token: "t" })).toEqual({ ok: true, email: "amina@example.org" });
  });
  it("gives a connection's email even when they don't show it publicly", async () => {
    db.user.findUnique.mockResolvedValue({ email: "amina@example.org", showEmail: false, profileVisibility: "PRIVATE" });
    connected.email = "amina@example.org";
    expect(await revealContactEmail({ profileUserId: "u2", token: "t" })).toEqual({ ok: true, email: "amina@example.org" });
  });
  it("shares nothing otherwise", async () => {
    db.user.findUnique.mockResolvedValue({ email: "amina@example.org", showEmail: false, profileVisibility: "PUBLIC" });
    expect(await revealContactEmail({ profileUserId: "u2", token: "t" })).toEqual({ ok: false, error: "notShared" });
  });
  it("slows down anyone asking too often", async () => {
    limit.hit = true;
    expect(await revealContactEmail({ profileUserId: "u2", token: "t" })).toEqual({ ok: false, error: "tooMany" });
  });
});
