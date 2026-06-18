import { describe, it, expect } from "vitest";
import { canInCollab, type CollabContext } from "../collaboration/authz";

const ctx = (over: Partial<CollabContext>): CollabContext => ({
  membershipRole: null,
  visibility: "MEMBERS",
  isStaff: false,
  ...over,
});

describe("collaboration authz — membership roles", () => {
  it("VIEWER can read but not comment/upload", () => {
    const c = ctx({ membershipRole: "VIEWER" });
    expect(canInCollab("collab:read", c)).toBe(true);
    expect(canInCollab("collab:comment", c)).toBe(false);
    expect(canInCollab("collab:upload", c)).toBe(false);
    expect(canInCollab("collab:annotate", c)).toBe(false);
  });

  it("COMMENTER can comment + annotate, not upload", () => {
    const c = ctx({ membershipRole: "COMMENTER" });
    expect(canInCollab("collab:comment", c)).toBe(true);
    expect(canInCollab("collab:annotate", c)).toBe(true);
    expect(canInCollab("collab:upload", c)).toBe(false);
  });

  it("EDITOR can upload + manage threads, not members", () => {
    const c = ctx({ membershipRole: "EDITOR" });
    expect(canInCollab("collab:upload", c)).toBe(true);
    expect(canInCollab("collab:editThread", c)).toBe(true);
    expect(canInCollab("collab:manageMembers", c)).toBe(false);
  });

  it("OWNER can do everything incl. manage members + archive", () => {
    const c = ctx({ membershipRole: "OWNER" });
    expect(canInCollab("collab:manageMembers", c)).toBe(true);
    expect(canInCollab("collab:archive", c)).toBe(true);
    expect(canInCollab("collab:readFiles", c)).toBe(true);
  });
});

describe("collaboration authz — visibility", () => {
  it("PUBLIC workspace is readable by anyone (incl. non-member, non-staff)", () => {
    const c = ctx({ membershipRole: null, visibility: "PUBLIC", isStaff: false });
    expect(canInCollab("collab:read", c)).toBe(true);
    expect(canInCollab("collab:readFiles", c)).toBe(true);
  });

  it("MEMBERS workspace is NOT readable by a non-member non-staff", () => {
    const c = ctx({ membershipRole: null, visibility: "MEMBERS", isStaff: false });
    expect(canInCollab("collab:read", c)).toBe(false);
  });
});

describe("collaboration authz — staff precedence rule", () => {
  const staffNonMember = ctx({ membershipRole: null, visibility: "MEMBERS", isStaff: true });

  it("staff may read the workspace and moderate/archive", () => {
    expect(canInCollab("collab:read", staffNonMember)).toBe(true);
    expect(canInCollab("collab:moderate", staffNonMember)).toBe(true);
    expect(canInCollab("collab:archive", staffNonMember)).toBe(true);
  });

  it("staff are NOT implicit members: cannot read MEMBERS files or comment without joining", () => {
    expect(canInCollab("collab:readFiles", staffNonMember)).toBe(false);
    expect(canInCollab("collab:comment", staffNonMember)).toBe(false);
    expect(canInCollab("collab:upload", staffNonMember)).toBe(false);
    expect(canInCollab("collab:manageMembers", staffNonMember)).toBe(false);
  });
});
