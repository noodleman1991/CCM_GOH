/**
 * `app/api/webhooks/clerk/route.ts` — audit findings M3 and H5. The first
 * tests this route has had.
 *
 * M3: `user.deleted` did a raw `prisma.user.delete` plus a direct
 * `eraseUserSanityContent`, skipping `deleteUserData()` — so a user deleted
 * from the Clerk dashboard kept their R2 uploads, stayed in the Resend
 * audience, and any workspace they solely owned was cascade-deleted instead of
 * handed to the next member. The webhook must run the same full erasure the
 * in-app deletion runs.
 *
 * H5: the Algolia updates were un-awaited `fetch`es to ourselves with no
 * `res.ok` check. They are now direct calls to `syncUserSearchRecord` inside
 * `after()`.
 *
 * `svix` is mocked so the signature step is observable without a real secret;
 * Prisma, the erasure module, the indexer and `after()` are mocked at their
 * seams. The route's own branches run for real.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verify = vi.fn();
const webhookCtor = vi.fn();
vi.mock("svix", () => ({
  Webhook: class {
    constructor(secret: string) {
      webhookCtor(secret);
    }
    verify(payload: string, headers: Record<string, string>) {
      return verify(payload, headers);
    }
  },
}));

const findUnique = vi.fn();
const create = vi.fn();
const update = vi.fn();
const del = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      create: (...a: unknown[]) => create(...a),
      update: (...a: unknown[]) => update(...a),
      delete: (...a: unknown[]) => del(...a),
    },
  },
}));

const deleteUserData = vi.fn();
const eraseUserSanityContent = vi.fn();
vi.mock("@/lib/account-deletion", () => ({
  deleteUserData: (...a: unknown[]) => deleteUserData(...a),
  eraseUserSanityContent: (...a: unknown[]) => eraseUserSanityContent(...a),
}));

const syncUserSearchRecord = vi.fn();
vi.mock("@/lib/algolia-user-sync", () => ({
  syncUserSearchRecord: (...a: unknown[]) => syncUserSearchRecord(...a),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: {} }),
}));

const afterCallbacks: Array<() => unknown> = [];
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (cb: () => unknown) => {
    afterCallbacks.push(cb);
  },
}));

import { POST } from "@/app/api/webhooks/clerk/route";

const SVIX_HEADERS = {
  "svix-id": "msg_1",
  "svix-timestamp": "1700000000",
  "svix-signature": "v1,abc",
};

function userPayload(id = "user_1") {
  return {
    id,
    email_addresses: [{ email_address: "jane@example.com", verification: { status: "verified" } }],
    phone_numbers: [],
    first_name: "Jane",
    last_name: "Doe",
    username: "jane",
    image_url: null,
    profile_image_url: null,
    public_metadata: {},
    private_metadata: {},
    unsafe_metadata: {},
    created_at: 1,
    updated_at: 1,
  };
}

function event(type: string, data: Record<string, unknown>) {
  return { type, object: "event", data };
}

function post(body: unknown, headers: Record<string, string> = SVIX_HEADERS): Request {
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function runAfterCallbacks() {
  for (const cb of afterCallbacks.splice(0)) await cb();
}

const ENV = ["CLERK_WEBHOOK_SECRET", "CLERK_SECRET_KEY"] as const;
let ambient: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  afterCallbacks.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  ambient = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
  process.env.CLERK_WEBHOOK_SECRET = "whsec_vitest";
  // The route refuses a webhook whose key type does not match NODE_ENV
  // (dev <-> sk_test_). Under vitest NODE_ENV is "test", i.e. "not
  // development", so a live-shaped key is what lets an event through.
  process.env.CLERK_SECRET_KEY = "sk_live_vitest";
  // By default the signature verifies and returns whatever body was posted.
  verify.mockImplementation((payload: string) => JSON.parse(payload));
  deleteUserData.mockResolvedValue({ prismaDeleted: true, draftsDeleted: 0, submissionsDeleted: 0, publishedRetained: 0 });
  syncUserSearchRecord.mockResolvedValue("indexed");
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const k of ENV) {
    if (ambient[k] === undefined) delete process.env[k];
    else process.env[k] = ambient[k];
  }
});

describe("POST /api/webhooks/clerk — signature", () => {
  it("rejects a request without the svix headers before verifying anything", async () => {
    const response = await POST(post(event("user.updated", userPayload()), {}));

    expect(response.status).toBe(400);
    expect(verify).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("verifies the raw body against the three svix headers with the configured secret", async () => {
    findUnique.mockResolvedValue({ id: "user_1", emailVerified: null });
    update.mockResolvedValue({ id: "user_1" });
    const body = event("user.updated", userPayload());

    await POST(post(body));

    expect(webhookCtor).toHaveBeenCalledWith("whsec_vitest");
    expect(verify).toHaveBeenCalledWith(JSON.stringify(body), SVIX_HEADERS);
  });

  it("returns 401 and touches nothing when the signature does not verify", async () => {
    verify.mockImplementation(() => {
      throw new Error("No matching signature found");
    });

    const response = await POST(post(event("user.deleted", { id: "user_1", deleted: true })));

    expect(response.status).toBe(401);
    expect(deleteUserData).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("ignores an event whose Clerk key type does not match the environment", async () => {
    process.env.CLERK_SECRET_KEY = "sk_test_vitest";

    const response = await POST(post(event("user.deleted", { id: "user_1", deleted: true })));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.action).toBe("ignored");
    expect(deleteUserData).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/clerk — user.deleted (M3)", () => {
  it("runs the full erasure through deleteUserData and never raw-deletes the row", async () => {
    const response = await POST(post(event("user.deleted", { id: "user_1", deleted: true })));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.result.action).toBe("deleted");
    expect(deleteUserData).toHaveBeenCalledTimes(1);
    expect(deleteUserData).toHaveBeenCalledWith("user_1");
    expect(del).not.toHaveBeenCalled();
    // deleteUserData already covers the CMS erasure; no second direct call.
    expect(eraseUserSanityContent).not.toHaveBeenCalled();
  });

  it("still runs deleteUserData when the Prisma row is already gone (CMS/R2 backstop)", async () => {
    findUnique.mockResolvedValue(null);
    deleteUserData.mockResolvedValue({ prismaDeleted: false, draftsDeleted: 2, submissionsDeleted: 0, publishedRetained: 1 });

    const response = await POST(post(event("user.deleted", { id: "user_gone", deleted: true })));

    expect(response.status).toBe(200);
    expect(deleteUserData).toHaveBeenCalledWith("user_gone");
    expect(del).not.toHaveBeenCalled();
  });

  it("returns 500 so svix retries when the erasure is incomplete", async () => {
    deleteUserData.mockRejectedValue(new Error("Account erasure incomplete — caseStudies (1 documents)"));

    const response = await POST(post(event("user.deleted", { id: "user_1", deleted: true })));

    expect(response.status).toBe(500);
    expect(del).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/clerk — user.updated / user.created index (H5)", () => {
  it("user.updated writes the row and schedules the index update via after(), directly", async () => {
    findUnique.mockResolvedValue({ id: "user_1", emailVerified: null });
    update.mockResolvedValue({ id: "user_1" });

    const response = await POST(post(event("user.updated", userPayload())));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.result.action).toBe("updated");
    expect(update).toHaveBeenCalledTimes(1);
    // Not yet — it runs after the response.
    expect(syncUserSearchRecord).not.toHaveBeenCalled();

    await runAfterCallbacks();

    expect(syncUserSearchRecord).toHaveBeenCalledWith("user_1", "update");
  });

  it("user.created inserts the row and schedules the index update via after()", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "user_2" });

    const response = await POST(post(event("user.created", userPayload("user_2"))));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.result.action).toBe("created");
    expect(create).toHaveBeenCalledTimes(1);

    await runAfterCallbacks();

    expect(syncUserSearchRecord).toHaveBeenCalledWith("user_2", "update");
  });

  it("a failing index write after the response is logged, not thrown", async () => {
    findUnique.mockResolvedValue({ id: "user_1", emailVerified: null });
    update.mockResolvedValue({ id: "user_1" });
    syncUserSearchRecord.mockRejectedValue(new Error("algolia down"));

    const response = await POST(post(event("user.updated", userPayload())));
    expect(response.status).toBe(200);

    await expect(runAfterCallbacks()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("user_1"), expect.any(Error));
  });
});
