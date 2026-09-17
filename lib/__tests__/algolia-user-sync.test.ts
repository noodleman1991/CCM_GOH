/**
 * `lib/algolia-user-sync.ts` — the one place a user's search record is written
 * or removed, called DIRECTLY by the Clerk webhook, the profile route and the
 * onboarding route inside `after()`.
 *
 * Before this module those three routes each fired an un-awaited `fetch` at
 * `${NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search/users/webhook`
 * with no `res.ok` check (audit finding H5): a 401 from a missing
 * `SEARCH_WEBHOOK_SECRET`, or a 404 from an unset base URL in production, was
 * indistinguishable from success.
 *
 * `@/lib/algolia` is spread from the original so the real `transformUserForIndex`
 * and `shouldIndexUser` run — only the client is swapped for a recorder.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const saveObjects = vi.fn();
const deleteObject = vi.fn();
const findUnique = vi.fn();

vi.mock("@/lib/algolia", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/algolia")>()),
  algoliaClient: {
    saveObjects: (...a: unknown[]) => saveObjects(...a),
    deleteObject: (...a: unknown[]) => deleteObject(...a),
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: (...a: unknown[]) => findUnique(...a) } },
}));

import { syncUserSearchRecord } from "@/lib/algolia-user-sync";

const INDEXABLE_USER = {
  id: "user_1",
  username: "jdoe",
  firstName: "Jane",
  lastName: "Doe",
  isSearchable: true,
  profileVisibility: "PUBLIC" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-06-01"),
  role: "community_member",
  communityMemberships: [],
};

const ENV = ["ALGOLIA_INDEX_PREFIX", "VERCEL_ENV"] as const;
let ambient: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  ambient = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
  // A prefix is what makes a write allowed outside Vercel production
  // (`liveIndexWritesAllowed`), and it is what proves `writeIndexName` is used.
  process.env.ALGOLIA_INDEX_PREFIX = "vitest_";
  delete process.env.VERCEL_ENV;
  saveObjects.mockResolvedValue(undefined);
  deleteObject.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const k of ENV) {
    if (ambient[k] === undefined) delete process.env[k];
    else process.env[k] = ambient[k];
  }
});

describe("syncUserSearchRecord", () => {
  it("indexes a searchable user into the write-prefixed users index", async () => {
    findUnique.mockResolvedValue(INDEXABLE_USER);

    await expect(syncUserSearchRecord("user_1", "update")).resolves.toBe("indexed");

    expect(saveObjects).toHaveBeenCalledTimes(1);
    const [{ indexName, objects }] = saveObjects.mock.calls[0] as [{ indexName: string; objects: Array<{ objectID: string }> }];
    expect(indexName).toBe("vitest_users");
    expect(objects[0].objectID).toBe("user_1");
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("removes the record on 'delete' without reading the database", async () => {
    await expect(syncUserSearchRecord("user_1", "delete")).resolves.toBe("removed");

    expect(deleteObject).toHaveBeenCalledWith({ indexName: "vitest_users", objectID: "user_1" });
    expect(findUnique).not.toHaveBeenCalled();
    expect(saveObjects).not.toHaveBeenCalled();
  });

  it("removes the record when the user has opted out of search", async () => {
    findUnique.mockResolvedValue({ ...INDEXABLE_USER, isSearchable: false });

    await expect(syncUserSearchRecord("user_1")).resolves.toBe("removed");

    expect(deleteObject).toHaveBeenCalledWith({ indexName: "vitest_users", objectID: "user_1" });
    expect(saveObjects).not.toHaveBeenCalled();
  });

  it("removes the record when the user row is gone", async () => {
    findUnique.mockResolvedValue(null);

    await expect(syncUserSearchRecord("user_1")).resolves.toBe("removed");

    expect(deleteObject).toHaveBeenCalledWith({ indexName: "vitest_users", objectID: "user_1" });
  });

  it("refuses to touch the live index outside Vercel production when no prefix is set", async () => {
    delete process.env.ALGOLIA_INDEX_PREFIX;
    findUnique.mockResolvedValue(INDEXABLE_USER);

    await expect(syncUserSearchRecord("user_1")).resolves.toBe("skipped");
    await expect(syncUserSearchRecord("user_1", "delete")).resolves.toBe("skipped");

    expect(saveObjects).not.toHaveBeenCalled();
    expect(deleteObject).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("propagates an Algolia failure so the caller's after() logs it", async () => {
    findUnique.mockResolvedValue(INDEXABLE_USER);
    saveObjects.mockRejectedValue(new Error("algolia down"));
    deleteObject.mockRejectedValue(new Error("algolia down"));

    await expect(syncUserSearchRecord("user_1")).rejects.toThrow("algolia down");
  });
});
