import { afterEach, describe, expect, it, vi } from "vitest";
import { ALL_OFF, collaborationAccess, devOverride, toSettings } from "@/lib/collaboration/access";

afterEach(() => vi.unstubAllEnvs());

describe("who sees what", () => {
  const s = { notifications: true, people: true, workspaces: "leads" as const, messages: false, contributions: true };
  it("needs a signed-in member for anything personal", () => {
    expect(collaborationAccess(s, null)).toEqual({ notifications: false, people: true, workspaces: { see: false, create: false }, messages: false, contributions: false });
  });
  it("opens workspaces by audience", () => {
    expect(collaborationAccess(s, "community_member").workspaces).toEqual({ see: false, create: false });
    expect(collaborationAccess(s, "community_editor").workspaces).toEqual({ see: true, create: true });
    expect(collaborationAccess({ ...s, workspaces: "team" }, "community_editor").workspaces).toEqual({ see: false, create: false });
    expect(collaborationAccess({ ...s, workspaces: "team" }, "admin").workspaces).toEqual({ see: true, create: true });
    expect(collaborationAccess({ ...s, workspaces: "members" }, "community_member").workspaces).toEqual({ see: true, create: true });
  });
  it("keeps every collaboration tool off by default, and My contributions on", () => {
    expect(collaborationAccess(ALL_OFF, "admin")).toEqual({ notifications: false, people: false, workspaces: { see: false, create: false }, messages: false, contributions: true });
  });
  it("lets the team hide My contributions", () => {
    expect(collaborationAccess({ ...s, contributions: false }, "community_member").contributions).toBe(false);
  });
});

describe("reading the setting", () => {
  it("falls back to the defaults for anything missing or odd", () => {
    expect(toSettings(null)).toEqual(ALL_OFF);
    expect(toSettings({ notifications: "yes", workspaces: "everyone", contributions: "no" })).toEqual(ALL_OFF);
    expect(toSettings({ notifications: true, people: true, workspaces: "members", messages: true, contributions: false })).toEqual({ notifications: true, people: true, workspaces: "members", messages: true, contributions: false });
  });
  it("lets dev force everything on", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_ENGAGEMENT", "true");
    expect(devOverride()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_FEATURE_ENGAGEMENT", "");
    expect(devOverride()).toBe(false);
  });
});
