import { describe, it, expect } from "vitest";
import { canShowPublicProject } from "@/lib/collaboration/public";

describe("canShowPublicProject", () => {
  it("shows the public page to a non-member, non-staff viewer", () => {
    expect(canShowPublicProject({ membershipRole: null, isStaff: false })).toBe(true);
  });

  it("shows the workspace (not public page) to a member", () => {
    expect(canShowPublicProject({ membershipRole: "VIEWER", isStaff: false })).toBe(false);
    expect(canShowPublicProject({ membershipRole: "OWNER", isStaff: false })).toBe(false);
  });

  it("shows the workspace (not public page) to global staff", () => {
    expect(canShowPublicProject({ membershipRole: null, isStaff: true })).toBe(false);
  });
});
