import { describe, it, expect, vi, beforeEach } from "vitest";

// Mirrors the mocking pattern used elsewhere for @clerk/nextjs/server + @/lib/prisma
// (see lib/__tests__/follows.test.ts, lib/__tests__/comments-route-gate.test.ts).
const authMock = vi.fn<() => Promise<{ userId: string | null }>>();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));

const findUniqueMock = vi.fn<(...a: unknown[]) => Promise<unknown>>();
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: (...a: unknown[]) => findUniqueMock(...a) } },
}));

import { clerkStrategy } from "@/payload/auth/clerk-strategy";

const findMock = vi.fn<(...a: unknown[]) => Promise<{ docs: unknown[] }>>();
const createMock = vi.fn<(...a: unknown[]) => Promise<unknown>>();
const payload = { find: findMock, create: createMock } as never;

const authenticate = () =>
  clerkStrategy.authenticate({ payload, headers: new Headers() } as never);

beforeEach(() => {
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

    const result = await authenticate();

    expect(createMock).not.toHaveBeenCalled();
    expect(result.user).toMatchObject({ collection: "users", role: "team_editor" });
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
});
