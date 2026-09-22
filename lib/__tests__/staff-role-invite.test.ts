import { describe, expect, it } from "vitest";
import { normalizeInviteEmail } from "@/lib/staff-role-invite";

describe("normalizeInviteEmail", () => {
  it("lower-cases and trims, the way Clerk reports addresses", () => {
    expect(normalizeInviteEmail("  Antonis@UnitedGMH.org ")).toBe("antonis@unitedgmh.org");
  });
  it("rejects blanks and non-addresses", () => {
    expect(normalizeInviteEmail("")).toBeNull();
    expect(normalizeInviteEmail(null)).toBeNull();
    expect(normalizeInviteEmail("not-an-email")).toBeNull();
  });
});
