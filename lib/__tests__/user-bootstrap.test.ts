import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const findUnique = vi.fn();
const create = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: (a: unknown) => findUnique(a), create: (a: unknown) => create(a) } } }));
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { getUser: async () => ({ primaryEmailAddress: { emailAddress: "Lead@Example.org", verification: { status: "verified" } }, firstName: "A", lastName: "B", username: "ab", imageUrl: null, primaryPhoneNumber: null }) } }),
}));
const applyStaffRoleInvite = vi.fn();
vi.mock("@/lib/staff-role-invite", () => ({ applyStaffRoleInvite: (...a: unknown[]) => applyStaffRoleInvite(...a) }));
vi.mock("@/lib/errors/report", () => ({ reportError: vi.fn() }));

import { ensureUserRow } from "@/lib/user-bootstrap";

beforeEach(() => {
  vi.clearAllMocks();
  findUnique.mockResolvedValue(null);
  create.mockResolvedValue({ id: "u1" });
});

describe("the first page a member opens", () => {
  // The dashboard can create the row before Clerk's webhook does; a staff role
  // reserved for that email (pnpm user:role --invite) was then never applied
  // (found 2026-10-07).
  it("applies a role reserved for their email when it creates their row", async () => {
    expect(await ensureUserRow("u1")).toBe(true);
    expect(applyStaffRoleInvite).toHaveBeenCalledWith("u1", "Lead@Example.org");
  });

  it("leaves an existing row alone", async () => {
    findUnique.mockResolvedValue({ id: "u1" });
    await ensureUserRow("u1");
    expect(create).not.toHaveBeenCalled();
    expect(applyStaffRoleInvite).not.toHaveBeenCalled();
  });
});
