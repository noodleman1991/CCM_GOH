/**
 * `lib/clerk-sync.ts` — the writer/reader shape mismatch the audit flagged.
 *
 * `syncToClerk` writes FOUR keys into Clerk `publicMetadata`:
 * `onboardingCompleted`, `preferredLanguage`, `lastSyncedAt`, `syncedFrom`.
 * `syncFromClerk` read TWENTY — bio, ageGroup, workTypes, expertiseAreas,
 * every privacy flag — none of which any writer in the codebase puts there
 * (the onboarding and profile routes write the same four-key shape). So the
 * reader was dead in the common case and dangerous in the uncommon one: a
 * value hand-edited in the Clerk dashboard, or written by an older build,
 * would be copied over the Prisma row that every comment in this repo calls
 * the source of truth — and `workTypes: ["anything"]` would 500 at Prisma.
 *
 * These tests pin the aligned contract: Prisma owns profile data; Clerk
 * metadata carries onboarding state and language, and that is all the reader
 * takes back.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateUser = vi.fn();
const getUser = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({
    users: {
      updateUser: (...a: unknown[]) => updateUser(...a),
      getUser: (...a: unknown[]) => getUser(...a),
    },
  }),
}));

const upsert = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { upsert: (...a: unknown[]) => upsert(...a) } },
}));

import { ClerkSyncService } from "@/lib/clerk-sync";

const CLERK_USER = {
  id: "user_1",
  firstName: "Jane",
  lastName: "Doe",
  username: "jane",
  imageUrl: "https://img.clerk.com/abc",
  primaryEmailAddress: { emailAddress: "jane@example.com", verification: { status: "verified" } },
  primaryPhoneNumber: null,
  updatedAt: 1,
  publicMetadata: {} as Record<string, unknown>,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  updateUser.mockResolvedValue(undefined);
  upsert.mockResolvedValue({ id: "user_1" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ClerkSyncService.syncToClerk — the written shape", () => {
  it("writes only onboarding state, language and sync stamps into publicMetadata", async () => {
    await ClerkSyncService.syncToClerk("user_1", {
      firstName: "Jane",
      lastName: "Doe",
      username: "jane",
      onboardingCompleted: true,
      preferredLanguage: "FR",
      bio: "never synced",
    });

    const [, data] = updateUser.mock.calls[0] as [string, { publicMetadata: Record<string, unknown> }];
    expect(Object.keys(data.publicMetadata).sort()).toEqual(
      ["lastSyncedAt", "onboardingCompleted", "preferredLanguage", "syncedFrom"],
    );
    expect(data.publicMetadata.onboardingCompleted).toBe(true);
    expect(data.publicMetadata.preferredLanguage).toBe("FR");
  });
});

describe("ClerkSyncService.syncFromClerk — the read shape", () => {
  it("never copies profile fields or privacy flags out of Clerk metadata", async () => {
    getUser.mockResolvedValue({
      ...CLERK_USER,
      publicMetadata: {
        bio: "stale from an old build",
        workTypes: ["NOT_A_WORK_TYPE"],
        expertiseAreas: ["NOT_AN_AREA"],
        showEmail: true,
        profileVisibility: "PRIVATE",
        onboardingCompleted: true,
      },
    });

    await expect(ClerkSyncService.syncFromClerk("user_1")).resolves.toBe(true);

    const [{ create, update }] = upsert.mock.calls[0] as [{ create: Record<string, unknown>; update: Record<string, unknown> }];
    for (const branch of [create, update]) {
      expect(branch).not.toHaveProperty("bio", "stale from an old build");
      expect(branch).not.toHaveProperty("workTypes", ["NOT_A_WORK_TYPE"]);
      expect(branch).not.toHaveProperty("expertiseAreas", ["NOT_AN_AREA"]);
      expect(branch).not.toHaveProperty("showEmail", true);
      expect(branch).not.toHaveProperty("profileVisibility", "PRIVATE");
    }
    // The Clerk-managed identity fields do come across.
    expect(update).toMatchObject({ email: "jane@example.com", firstName: "Jane", username: "jane" });
  });

  it("takes onboardingCompleted and a valid preferredLanguage back from Clerk", async () => {
    getUser.mockResolvedValue({
      ...CLERK_USER,
      publicMetadata: { onboardingCompleted: true, preferredLanguage: "AR" },
    });

    await ClerkSyncService.syncFromClerk("user_1");

    const [{ create, update }] = upsert.mock.calls[0] as [{ create: Record<string, unknown>; update: Record<string, unknown> }];
    expect(update).toMatchObject({ onboardingCompleted: true, preferredLanguage: "AR" });
    expect(create).toMatchObject({ onboardingCompleted: true, preferredLanguage: "AR" });
  });

  it("ignores a preferredLanguage the enum does not know and a non-boolean onboardingCompleted", async () => {
    getUser.mockResolvedValue({
      ...CLERK_USER,
      publicMetadata: { onboardingCompleted: "yes", preferredLanguage: "KLINGON" },
    });

    await ClerkSyncService.syncFromClerk("user_1");

    const [{ update }] = upsert.mock.calls[0] as [{ update: Record<string, unknown> }];
    expect(update).not.toHaveProperty("preferredLanguage");
    expect(update).not.toHaveProperty("onboardingCompleted");
  });
});
