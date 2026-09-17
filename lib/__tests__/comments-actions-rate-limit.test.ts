/**
 * Rate limits on the comment server actions (audit M5 + Low list).
 *
 * The real limiter runs here: `@/lib/prisma` is mocked without a working
 * `$queryRaw`, so `assertRateLimit` falls through to its in-process bucket —
 * which is exactly the fixed-window behaviour we want to observe, with no
 * database. The spy on `assertRateLimit` only records the keys it was given.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const getActorMock = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: () => getActorMock() }));

let requestHeaders = new Headers();
vi.mock("next/headers", () => ({ headers: async () => requestHeaders }));

const commentCreate = vi.fn(async () => ({ id: "c1", status: "PENDING" }));
const commentFindUnique = vi.fn(async () => ({ authorId: null }));
const reactionFindUnique = vi.fn(async () => null);
const reactionCreate = vi.fn(async () => ({ id: "r1" }));
const reactionDelete = vi.fn(async () => ({ id: "r1" }));
const reportCreate = vi.fn(async () => ({ id: "rep1" }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: async () => {
      throw new Error("no database in tests");
    },
    comment: {
      create: (...a: unknown[]) => commentCreate(...(a as [])),
      findUnique: (...a: unknown[]) => commentFindUnique(...(a as [])),
      findMany: async () => [],
    },
    reaction: {
      findUnique: (...a: unknown[]) => reactionFindUnique(...(a as [])),
      create: (...a: unknown[]) => reactionCreate(...(a as [])),
      delete: (...a: unknown[]) => reactionDelete(...(a as [])),
    },
    commentReport: { create: (...a: unknown[]) => reportCreate(...(a as [])) },
    user: { findMany: async () => [] },
    mention: { create: async () => ({}) },
  },
}));

vi.mock("@/lib/turnstile", () => ({
  turnstileConfigured: () => true,
  verifyTurnstile: async () => true,
}));
vi.mock("@/lib/comments/target", () => ({
  isCommentTargetValid: async () => true,
  collaborationIdForTarget: async () => null,
}));
vi.mock("@/lib/comments/moderation", () => ({
  moderateBody: async () => ({ tier: "clean" }),
}));
vi.mock("@/lib/notifications/service", () => ({ createNotification: vi.fn(async () => undefined) }));
vi.mock("@/lib/notifications/emit", () => ({ emitLifecycle: vi.fn(async () => undefined) }));
vi.mock("@/lib/collaboration/service", () => ({ authorizeCollab: vi.fn(async () => undefined) }));

const assertRateLimitSpy = vi.fn();
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    assertRateLimit: (...a: Parameters<typeof actual.assertRateLimit>) => {
      assertRateLimitSpy(...a);
      return actual.assertRateLimit(...a);
    },
  };
});

import { postComment, reportComment, toggleReaction } from "@/lib/actions/comments";

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(null);
  requestHeaders = new Headers();
});

describe("postComment — anonymous limit is keyed on the client, not the chosen name", () => {
  it("refuses the 4th anonymous comment from one IP even though every name is different", async () => {
    requestHeaders = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    const results = [];
    for (const authorName of ["Ada", "Grace", "Linus", "Margaret"]) {
      results.push(
        await postComment({
          targetType: "caseStudy",
          targetId: "cs1",
          body: `hello from ${authorName}`,
          authorName,
          turnstileToken: "tok",
        })
      );
    }
    expect(results.slice(0, 3).every((r) => r.ok)).toBe(true);
    expect(results[3]).toMatchObject({ ok: false, code: "RATE_LIMIT" });
    expect(commentCreate).toHaveBeenCalledTimes(3);

    const keys = assertRateLimitSpy.mock.calls.map((c) => c[0] as string);
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toMatch(/^ip:[0-9a-f]{16}$/);
    expect(keys[0]).not.toContain("203.0.113.7");
  });

  it("a different client with the same name is not sharing that budget", async () => {
    requestHeaders = new Headers({ "x-forwarded-for": "203.0.113.99" });
    const res = await postComment({
      targetType: "caseStudy",
      targetId: "cs1",
      body: "hello again",
      authorName: "Ada",
      turnstileToken: "tok",
    });
    expect(res.ok).toBe(true);
  });
});

describe("reportComment", () => {
  it("refuses past the per-user limit", async () => {
    getActorMock.mockResolvedValue({ id: "reporter-1", role: "community_member" });
    let refused: { ok: boolean; error?: string } | null = null;
    for (let i = 0; i < 40; i++) {
      const res = await reportComment(`c${i}`, "spam");
      if (!res.ok) {
        refused = res;
        break;
      }
    }
    expect(refused).not.toBeNull();
    expect(refused?.error).toMatch(/too many/i);
    expect(reportCreate.mock.calls.length).toBeLessThan(40);
  });

  it("treats a duplicate report (P2002) as success but surfaces any other failure", async () => {
    getActorMock.mockResolvedValue({ id: "reporter-2", role: "community_member" });
    reportCreate.mockRejectedValueOnce(Object.assign(new Error("dupe"), { code: "P2002" }));
    expect(await reportComment("c1", "spam")).toEqual({ ok: true });

    reportCreate.mockRejectedValueOnce(new Error("connection reset"));
    await expect(reportComment("c2", "spam")).rejects.toThrow("connection reset");
  });
});

describe("toggleReaction", () => {
  it("refuses past the per-user limit", async () => {
    getActorMock.mockResolvedValue({ id: "reactor-1", role: "community_member" });
    let refused: { ok: boolean; error?: string } | null = null;
    for (let i = 0; i < 200; i++) {
      const res = await toggleReaction(`c${i}`, "👍");
      if (!res.ok) {
        refused = res;
        break;
      }
    }
    expect(refused).not.toBeNull();
    expect(refused?.error).toMatch(/too many/i);
    expect(reactionCreate.mock.calls.length).toBeLessThan(200);
  });
});
