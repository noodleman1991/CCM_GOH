import { describe, it, expect } from "vitest";
import { can, isStaff, assertCan, ForbiddenError, type Actor, type GlobalAction } from "../authz-core";

const member: Actor = { id: "u1", role: "community_member" };
const communityEditor: Actor = { id: "u2", role: "community_editor" };
const teamEditor: Actor = { id: "u3", role: "team_editor" };
const admin: Actor = { id: "u4", role: "admin" };
const anon: Actor = null;

const STAFF_ONLY: GlobalAction[] = [
  "comment:remove",
  "comment:approve",
  "moderation:view",
  "report:resolve",
];

describe("isStaff", () => {
  it("is true only for team_editor and admin", () => {
    expect(isStaff(teamEditor)).toBe(true);
    expect(isStaff(admin)).toBe(true);
    expect(isStaff(communityEditor)).toBe(false);
    expect(isStaff(member)).toBe(false);
    expect(isStaff(anon)).toBe(false);
  });
});

describe("can — staff-only actions", () => {
  for (const action of STAFF_ONLY) {
    it(`${action}: only staff`, () => {
      expect(can(admin, action)).toBe(true);
      expect(can(teamEditor, action)).toBe(true);
      expect(can(communityEditor, action)).toBe(false);
      expect(can(member, action)).toBe(false);
      expect(can(anon, action)).toBe(false);
    });
  }
});

describe("can — comment:create", () => {
  it("is allowed for everyone incl. anonymous (pipeline decides moderation)", () => {
    expect(can(anon, "comment:create")).toBe(true);
    expect(can(member, "comment:create")).toBe(true);
    expect(can(admin, "comment:create")).toBe(true);
  });
});

describe("assertCan", () => {
  it("throws ForbiddenError when not permitted", () => {
    expect(() => assertCan(member, "moderation:view")).toThrow(ForbiddenError);
    expect(() => assertCan(anon, "comment:remove")).toThrow(ForbiddenError);
  });
  it("does not throw when permitted", () => {
    expect(() => assertCan(admin, "moderation:view")).not.toThrow();
    expect(() => assertCan(teamEditor, "report:resolve")).not.toThrow();
  });
});
