import { describe, expect, it } from "vitest";
import { isAdmin, isEditor, publishedOnly } from "@/payload/access";

const req = (role?: string) => ({ user: role ? { role } : null }) as never;

describe("payload access control", () => {
  it("admits admins to admin-only operations", () => {
    expect(isAdmin({ req: req("admin") })).toBe(true);
  });

  it("refuses editors and anonymous callers from admin-only operations", () => {
    expect(isAdmin({ req: req("team_editor") })).toBe(false);
    expect(isAdmin({ req: req() })).toBe(false);
  });

  it("admits admins and team editors to editor operations", () => {
    expect(isEditor({ req: req("admin") })).toBe(true);
    expect(isEditor({ req: req("team_editor") })).toBe(true);
  });

  it("refuses community roles from CMS editing", () => {
    // community_editor is community-scoped (UserCommunity.role — editor of a
    // single Community a member created/joined), not a CMS role. Confirmed
    // against lib/authz-core.ts's STAFF_ROLES = {team_editor, admin} and its
    // own test (lib/__tests__/authz.test.ts: isStaff(communityEditor) ===
    // false) — every existing CMS-writing gate in this codebase already
    // excludes community_editor. Not widening that here.
    expect(isEditor({ req: req("community_editor") })).toBe(false);
    expect(isEditor({ req: req("community_member") })).toBe(false);
  });

  it("returns a published-only constraint for anonymous reads, true for editors", () => {
    expect(publishedOnly({ req: req("team_editor") })).toBe(true);
    expect(publishedOnly({ req: req() })).toEqual({ _status: { equals: "published" } });
  });
});
