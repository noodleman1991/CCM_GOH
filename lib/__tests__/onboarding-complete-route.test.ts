/**
 * `app/api/onboarding/complete/route.ts` — audit findings H8 and M2.
 *
 * H8 (data loss): on an email unique-constraint conflict the route DELETED the
 * pre-existing user inside the transaction — cascading community memberships,
 * recent work, comments and workspace membership — and then created the new
 * one. The Clerk webhook (`webhooks/clerk/route.ts`) explicitly refuses to do
 * exactly this. The route must return 409 `EMAIL_CONFLICT` and never delete.
 *
 * M2: `workTypes`/`expertiseAreas` were validated as free strings, so an
 * unknown key reached Prisma and 500'd; the username-conflict check matched
 * `error.message.includes('P2002')` although Prisma 6 puts the code in
 * `error.code` (the message reads "Unique constraint failed on the fields:
 * (`username`)"), so a taken username 500'd too; and the Clerk `updateUser`
 * after the commit was awaited outside any try/catch, so a Clerk hiccup turned
 * a committed onboarding into a 500.
 *
 * Prisma, Clerk, the indexer and `after()` are all mocked at their module
 * seams; the route's own branches run for real.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const findUnique = vi.fn();
const create = vi.fn();
const update = vi.fn();
const del = vi.fn();
const txUpsert = vi.fn();
const txUserFindUnique = vi.fn();
const txUserDelete = vi.fn();
const txPromptUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      create: (...a: unknown[]) => create(...a),
      update: (...a: unknown[]) => update(...a),
      delete: (...a: unknown[]) => del(...a),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        user: {
          upsert: (...a: unknown[]) => txUpsert(...a),
          findUnique: (...a: unknown[]) => txUserFindUnique(...a),
          delete: (...a: unknown[]) => txUserDelete(...a),
        },
        recentWork: { deleteMany: vi.fn(), createMany: vi.fn() },
        profilePromptAnswer: { upsert: (...a: unknown[]) => txPromptUpsert(...a) },
        userCommunity: { deleteMany: vi.fn(), createMany: vi.fn() },
        community: { findMany: vi.fn(async () => []) },
      }),
  },
}));

const clerkUpdateUser = vi.fn();
const clerkGetUser = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_new" }),
  clerkClient: async () => ({
    users: {
      updateUser: (...a: unknown[]) => clerkUpdateUser(...a),
      getUser: (...a: unknown[]) => clerkGetUser(...a),
    },
  }),
}));

const syncUserSearchRecord = vi.fn();
vi.mock("@/lib/algolia-user-sync", () => ({
  syncUserSearchRecord: (...a: unknown[]) => syncUserSearchRecord(...a),
}));

// `after()` needs a request scope that vitest does not provide. Recording the
// callback and running it inline proves the route SCHEDULED the side effects
// (and how they behave) without depending on Next's runtime.
const afterCallbacks: Array<() => unknown> = [];
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (cb: () => unknown) => {
    afterCallbacks.push(cb);
  },
}));

import { POST } from "@/app/api/onboarding/complete/route";

const EXISTING = {
  id: "user_new",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  username: "jane",
};

const VALID_BODY = {
  firstName: "Jane",
  lastName: "Doe",
  username: "jane_doe",
  workTypes: ["RESEARCH"],
  expertiseAreas: ["MENTAL_HEALTH"],
  preferredLanguage: "EN",
};

function post(body: unknown): NextRequest {
  return new Request("http://localhost/api/onboarding/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

async function runAfterCallbacks() {
  for (const cb of afterCallbacks.splice(0)) await cb();
}

beforeEach(() => {
  vi.clearAllMocks();
  afterCallbacks.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  findUnique.mockResolvedValue(EXISTING);
  txUpsert.mockResolvedValue({ ...EXISTING, username: "jane_doe", onboardingCompleted: true });
  clerkUpdateUser.mockResolvedValue(undefined);
  syncUserSearchRecord.mockResolvedValue("indexed");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/onboarding/complete — email conflict (H8)", () => {
  it("returns 409 EMAIL_CONFLICT and never deletes the pre-existing user", async () => {
    // The row for this Clerk id does not exist; the same email belongs to an
    // older account. The upsert's `create` therefore trips the email unique
    // constraint.
    findUnique
      .mockResolvedValueOnce(null) // by id
    ;
    clerkGetUser.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "jane@example.com", verification: { status: "verified" } },
      firstName: "Jane",
      lastName: "Doe",
      username: "jane",
      imageUrl: null,
      primaryPhoneNumber: null,
    });
    // `prisma.user.create` in the "webhook delayed" branch collides on email…
    create.mockRejectedValue({ code: "P2002", meta: { target: ["email"] } });
    // …the refetch by id finds nothing, the refetch by email finds the OLD user.
    findUnique
      .mockResolvedValueOnce(null) // refetch by id
      .mockResolvedValueOnce({ ...EXISTING, id: "user_old" }); // by email

    const response = await POST(post(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("EMAIL_CONFLICT");
    expect(json.code).toBe("EMAIL_CONFLICT");
    expect(del).not.toHaveBeenCalled();
    expect(txUserDelete).not.toHaveBeenCalled();
    expect(txUpsert).not.toHaveBeenCalled();
    // Both ids are logged for manual resolution, as the webhook already does.
    const logged = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls
      .flat()
      .map(String)
      .join("\n");
    expect(logged).toContain("user_old");
    expect(logged).toContain("user_new");
  });

  it("returns 409 EMAIL_CONFLICT when the conflict only surfaces inside the transaction", async () => {
    txUpsert.mockRejectedValue({ code: "P2002", meta: { target: ["email"] } });
    txUserFindUnique.mockResolvedValue({ ...EXISTING, id: "user_old" });

    const response = await POST(post(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("EMAIL_CONFLICT");
    expect(txUserDelete).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
    // No retry of the upsert after a conflict — that was the deletion path.
    expect(txUpsert).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/onboarding/complete — validation and conflicts (M2)", () => {
  it("rejects an unknown workType with 400 before touching the database", async () => {
    const response = await POST(post({ ...VALID_BODY, workTypes: ["ASTROLOGY"] }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
    expect(json.details.some((d: { field: string }) => d.field.startsWith("workTypes"))).toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
    expect(txUpsert).not.toHaveBeenCalled();
  });

  it("rejects an unknown expertiseArea with 400", async () => {
    const response = await POST(post({ ...VALID_BODY, expertiseAreas: ["ASTROLOGY"] }));

    expect(response.status).toBe(400);
    expect(txUpsert).not.toHaveBeenCalled();
  });

  it("returns 409 USERNAME_TAKEN on a Prisma P2002 carried in error.code", async () => {
    // Prisma 6: `code: 'P2002'`, message "Unique constraint failed on the
    // fields: (`username`)" — the string "P2002" is NOT in the message.
    const prismaError = Object.assign(new Error("Unique constraint failed on the fields: (`username`)"), {
      code: "P2002",
      meta: { target: ["username"] },
    });
    txUpsert.mockRejectedValue(prismaError);

    const response = await POST(post(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.code).toBe("USERNAME_TAKEN");
  });
});

describe("POST /api/onboarding/complete — happy path", () => {
  it("responds 200 and schedules the Clerk update and the index write via after()", async () => {
    const response = await POST(post(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.user.username).toBe("jane_doe");

    // Nothing external has run yet — it is scheduled for after the response.
    expect(clerkUpdateUser).not.toHaveBeenCalled();
    expect(syncUserSearchRecord).not.toHaveBeenCalled();
    expect(afterCallbacks.length).toBeGreaterThan(0);

    await runAfterCallbacks();

    expect(clerkUpdateUser).toHaveBeenCalledWith("user_new", {
      publicMetadata: { onboardingCompleted: true, preferredLanguage: "EN" },
    });
    expect(syncUserSearchRecord).toHaveBeenCalledWith("user_new", "update");
  });

  it("still responds 200 when the deferred Clerk update fails, and logs it", async () => {
    clerkUpdateUser.mockRejectedValue(new Error("clerk 503"));

    const response = await POST(post(VALID_BODY));
    expect(response.status).toBe(200);

    await expect(runAfterCallbacks()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Clerk"), expect.any(Error));
    // The index write is independent of the Clerk failure.
    expect(syncUserSearchRecord).toHaveBeenCalledWith("user_new", "update");
  });
});

describe("POST /api/onboarding/complete — the About you step (profile spec D4)", () => {
  it("saves the member's own words, and a prompt answer with its question", async () => {
    const response = await POST(post({
      ...VALID_BODY,
      headline: "Listening to rivers",
      pronouns: "she/her",
      languages: ["en", "ar"],
      lookingFor: ["research-partners"],
      focusTopics: ["eco-anxiety"],
      promptId: "p1",
      promptAnswer: "A flood in my town",
    }));
    expect(response.status).toBe(200);
    const data = txUpsert.mock.calls[0][0].update;
    expect(data).toMatchObject({ headline: "Listening to rivers", pronouns: "she/her", languages: ["en", "ar"], lookingFor: ["research-partners"], focusTopics: ["eco-anxiety"] });
    expect(txPromptUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_promptId: { userId: "user_new", promptId: "p1" } },
      create: expect.objectContaining({ userId: "user_new", promptId: "p1", answer: "A flood in my town", order: 0 }),
    }));
  });

  it("leaves what the member skipped untouched — no empty overwrites, no half a prompt", async () => {
    await POST(post({ ...VALID_BODY, pronouns: "", languages: [], lookingFor: [], promptId: "p1", promptAnswer: "  " }));
    const data = txUpsert.mock.calls[0][0].update;
    expect(data).not.toHaveProperty("pronouns");
    expect(data).not.toHaveProperty("languages");
    expect(data).not.toHaveProperty("lookingFor");
    expect(txPromptUpsert).not.toHaveBeenCalled();
  });
});
