import { describe, expect, it } from "vitest";
import { isAdmin, isEditor, moderationApprovedOnly, publishedAndApproved, publishedOnly } from "@/payload/access";

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

  it("gates events/researchOutputs on approval STRICTLY — an unset status is not public", () => {
    // All six live event filters and all seven researchOutput filters are
    // exactly `status == "approved"`; neither admits `!defined(status)`. An
    // earlier version of this helper carried an `exists: false` arm "for
    // consistency" with publishedAndApproved, which made a value-less
    // moderationStatus anonymously readable on two collections where Sanity
    // hides it. If an `or` ever reappears here, that hole is back.
    expect(moderationApprovedOnly({ req: req("team_editor") })).toBe(true);
    expect(moderationApprovedOnly({ req: req() })).toEqual({ moderationStatus: { equals: "approved" } });
  });

  it("keeps the unset-is-approved arm only where livedExperiences needs it", () => {
    // lib/content/lived-experiences.ts filters
    // `status == "approved" || !defined(status)` and the field is 0/56
    // populated, so dropping this arm would hide every real lived experience.
    // caseStudies shares the helper but cannot reach the arm: its
    // moderationStatus is required with a default.
    expect(publishedAndApproved({ req: req() })).toEqual({
      and: [
        { _status: { equals: "published" } },
        { or: [{ moderationStatus: { equals: "approved" } }, { moderationStatus: { exists: false } }] },
      ],
    });
  });
});
