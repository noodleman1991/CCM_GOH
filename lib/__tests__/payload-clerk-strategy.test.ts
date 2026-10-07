import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mirrors the mocking pattern used elsewhere for @clerk/nextjs/server + @/lib/prisma
// (see lib/__tests__/follows.test.ts, lib/__tests__/comments-route-gate.test.ts).
const authMock = vi.fn<() => Promise<{ userId: string | null }>>();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));

const findUniqueMock = vi.fn<(...a: unknown[]) => Promise<unknown>>();
// `safeQuery` is mocked with the real helper's CONTRACT rather than stubbed
// away — one bounded retry, then a `{ success: false }` result instead of a
// throw (lib/prisma.ts). The strategy must go through it: bare, a Neon
// scale-to-zero cold start denies a legitimate editor with no second attempt,
// and the thrown error escapes `authenticate` entirely. The real helper
// narrows the retry to connection-level Prisma errors (P1001/P1002); that
// predicate is lib/prisma.ts's business, and the strategy behaves the same
// either way.
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: (...a: unknown[]) => findUniqueMock(...a) } },
  safeQuery: async (op: () => Promise<unknown>) => {
    const attempt = async () => ({ success: true as const, data: await op() });
    try {
      return await attempt();
    } catch {
      try {
        return await attempt();
      } catch (error) {
        return {
          success: false as const,
          error: { code: "CONNECTION_ERROR", message: (error as Error).message },
        };
      }
    }
  },
}));

import { clerkStrategy } from "@/payload/auth/clerk-strategy";

const findMock = vi.fn<(...a: unknown[]) => Promise<{ docs: unknown[] }>>();
const createMock = vi.fn<(...a: unknown[]) => Promise<unknown>>();
const updateMock = vi.fn<(...a: unknown[]) => Promise<unknown>>();
const payload = { find: findMock, create: createMock, update: updateMock } as never;

const authenticate = () =>
  clerkStrategy.authenticate({ payload, headers: new Headers() } as never);

afterEach(() => vi.unstubAllEnvs());

beforeEach(() => {
  // These describe the live site; the preview case sets its own.
  vi.stubEnv("VERCEL_ENV", "production");
  vi.clearAllMocks();
});

describe("clerkStrategy.authenticate", () => {
  it("returns { user: null } when there is no Clerk session", async () => {
    authMock.mockResolvedValueOnce({ userId: null });

    const result = await authenticate();

    expect(result).toEqual({ user: null });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns { user: null } rather than propagating when auth() throws", async () => {
    // auth() throws outside a clerkMiddleware request context (e.g. static
    // prerender) — must degrade to anonymous, not a 500.
    authMock.mockRejectedValueOnce(new Error("clerkMiddleware() was not run"));

    await expect(authenticate()).resolves.toEqual({ user: null });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns { user: null } for a signed-in Clerk user with no Prisma row", async () => {
    authMock.mockResolvedValueOnce({ userId: "clerk_orphan" });
    findUniqueMock.mockResolvedValueOnce(null);

    const result = await authenticate();

    expect(result).toEqual({ user: null });
    expect(findMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("mirrors an existing Prisma actor into an existing Payload user doc, refreshing the role", async () => {
    authMock.mockResolvedValueOnce({ userId: "clerk_1" });
    findUniqueMock.mockResolvedValueOnce({
      id: "clerk_1",
      role: "team_editor",
      email: "editor@example.org",
    });
    findMock.mockResolvedValueOnce({
      docs: [
        {
          id: "doc1",
          collection: "users",
          clerkId: "clerk_1",
          role: "community_member",
          email: "editor@example.org",
        },
      ],
    });
    updateMock.mockResolvedValueOnce({
      id: "doc1",
      collection: "users",
      clerkId: "clerk_1",
      role: "team_editor",
      email: "editor@example.org",
    });

    const result = await authenticate();

    expect(createMock).not.toHaveBeenCalled();
    expect(result.user).toMatchObject({ collection: "users", role: "team_editor" });
  });

  it("PERSISTS the refreshed role, rather than only returning it in memory", async () => {
    // The stale-mirror half of finding 4. The previous version merged the
    // fresh Prisma role into the returned object and never wrote it, while
    // payload/collections/users.ts advertised the column as mirrored on every
    // sign-in. Runtime authz was fine; the admin's Users list was not.
    authMock.mockResolvedValueOnce({ userId: "clerk_1" });
    findUniqueMock.mockResolvedValueOnce({ id: "clerk_1", role: "admin", email: "new@example.org" });
    findMock.mockResolvedValueOnce({
      docs: [{ id: "doc1", collection: "users", clerkId: "clerk_1", role: "team_editor", email: "old@example.org" }],
    });
    updateMock.mockResolvedValueOnce({
      id: "doc1",
      collection: "users",
      clerkId: "clerk_1",
      role: "admin",
      email: "new@example.org",
    });

    const result = await authenticate();

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        id: "doc1",
        data: { role: "admin", email: "new@example.org" },
        overrideAccess: true,
      })
    );
    expect(result.user).toMatchObject({ role: "admin", email: "new@example.org" });
  });

  it("does not write when the mirror already agrees with Prisma", async () => {
    authMock.mockResolvedValueOnce({ userId: "clerk_1" });
    findUniqueMock.mockResolvedValueOnce({ id: "clerk_1", role: "admin", email: "a@example.org" });
    findMock.mockResolvedValueOnce({
      docs: [{ id: "doc1", collection: "users", clerkId: "clerk_1", role: "admin", email: "a@example.org" }],
    });

    await authenticate();

    expect(updateMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a Payload user doc on first sign-in when none exists yet", async () => {
    authMock.mockResolvedValueOnce({ userId: "clerk_2" });
    findUniqueMock.mockResolvedValueOnce({ id: "clerk_2", role: "admin", email: "admin@example.org" });
    findMock.mockResolvedValueOnce({ docs: [] });
    createMock.mockResolvedValueOnce({
      id: "doc2",
      collection: "users",
      clerkId: "clerk_2",
      role: "admin",
      email: "admin@example.org",
    });

    const result = await authenticate();

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        data: expect.objectContaining({ clerkId: "clerk_2", role: "admin" }),
        overrideAccess: true,
      })
    );
    expect(result.user).toMatchObject({ collection: "users", role: "admin" });
  });

  it.each(["community_member"])(
    "does not create a users row for a signed-in %s — the write-on-read finding",
    async (role) => {
      // This runs on EVERY authenticated /admin or /payload-api request. With
      // 674 Clerk accounts and /payload-api public in Phase 3, creating a row
      // for any signed-in user is an unbounded write on a read path.
      authMock.mockResolvedValueOnce({ userId: "clerk_member" });
      findUniqueMock.mockResolvedValueOnce({ id: "clerk_member", role, email: "member@example.org" });
      findMock.mockResolvedValueOnce({ docs: [] });

      const result = await authenticate();

      expect(createMock).not.toHaveBeenCalled();
      expect(result).toEqual({ user: null });
    }
  );

  it("creates a users row for a community lead, who may now use the admin for their community", async () => {
    authMock.mockResolvedValueOnce({ userId: "clerk_lead" });
    findUniqueMock.mockResolvedValueOnce({ id: "clerk_lead", role: "community_editor", email: "lead@example.org" });
    findMock.mockResolvedValueOnce({ docs: [] });
    createMock.mockResolvedValueOnce({ id: "docL", collection: "users", clerkId: "clerk_lead", role: "community_editor", email: "lead@example.org" });

    const result = await authenticate();

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "users", data: expect.objectContaining({ clerkId: "clerk_lead", role: "community_editor" }) }),
    );
    expect(result.user).toMatchObject({ role: "community_editor" });
  });

  it("lets a lead or editor in as nobody on any copy that isn't the live site", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    // A new editor: no mirror row is created.
    authMock.mockResolvedValueOnce({ userId: "clerk_new" });
    findUniqueMock.mockResolvedValueOnce({ id: "clerk_new", role: "team_editor", email: "ed@example.org" });
    findMock.mockResolvedValueOnce({ docs: [] });
    expect((await authenticate()).user).toBeNull();
    expect(createMock).not.toHaveBeenCalled();

    // An editor who already has one: still nobody here.
    authMock.mockResolvedValueOnce({ userId: "clerk_ed" });
    findUniqueMock.mockResolvedValueOnce({ id: "clerk_ed", role: "team_editor", email: "ed@example.org" });
    findMock.mockResolvedValueOnce({ docs: [{ id: "docE", collection: "users", clerkId: "clerk_ed", role: "team_editor", email: "ed@example.org" }] });
    expect((await authenticate()).user).toBeNull();

    // An admin works on any copy.
    authMock.mockResolvedValueOnce({ userId: "clerk_admin" });
    findUniqueMock.mockResolvedValueOnce({ id: "clerk_admin", role: "admin", email: "ad@example.org" });
    findMock.mockResolvedValueOnce({ docs: [{ id: "docA", collection: "users", clerkId: "clerk_admin", role: "admin", email: "ad@example.org" }] });
    expect((await authenticate()).user).toMatchObject({ role: "admin" });
  });

  it("still refreshes an existing row for a demoted user, so the roster shows the demotion", async () => {
    authMock.mockResolvedValueOnce({ userId: "clerk_3" });
    findUniqueMock.mockResolvedValueOnce({ id: "clerk_3", role: "community_member", email: "ex@example.org" });
    findMock.mockResolvedValueOnce({
      docs: [{ id: "doc3", collection: "users", clerkId: "clerk_3", role: "admin", email: "ex@example.org" }],
    });
    updateMock.mockResolvedValueOnce({
      id: "doc3",
      collection: "users",
      clerkId: "clerk_3",
      role: "community_member",
      email: "ex@example.org",
    });

    const result = await authenticate();

    expect(updateMock).toHaveBeenCalled();
    expect(result.user).toMatchObject({ role: "community_member" });
  });

  it("retries the Prisma lookup rather than denying an editor on a Neon cold start", async () => {
    // `safeQuery` retries once on a connection-level failure. Bare, as this
    // was, a scale-to-zero cold start denied a legitimate editor with
    // { user: null } and no second attempt — silently.
    authMock.mockResolvedValueOnce({ userId: "clerk_4" });
    findUniqueMock.mockRejectedValueOnce(new Error("Can't reach database server"));
    findUniqueMock.mockResolvedValueOnce({ id: "clerk_4", role: "team_editor", email: "e@example.org" });
    findMock.mockResolvedValueOnce({
      docs: [{ id: "doc4", collection: "users", clerkId: "clerk_4", role: "team_editor", email: "e@example.org" }],
    });

    const result = await authenticate();

    expect(findUniqueMock).toHaveBeenCalledTimes(2);
    expect(result.user).toMatchObject({ role: "team_editor" });
  });

  it("denies loudly, not silently, when the database stays unreachable", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    authMock.mockResolvedValueOnce({ userId: "clerk_5" });
    findUniqueMock.mockRejectedValue(new Error("Can't reach database server"));

    const result = await authenticate();

    expect(result).toEqual({ user: null });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
