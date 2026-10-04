import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const query = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d) }));
import { getCollaborationAccessFor, getCollaborationSettings } from "@/lib/collaboration/access-server";
import { ALL_OFF } from "@/lib/collaboration/access";

beforeEach(() => {
  query.mockReset();
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_FEATURE_ENGAGEMENT", "");
});

describe("the setting on the server", () => {
  it("reads the global", async () => {
    query.mockResolvedValue({ notifications: true, people: true, workspaces: "team", messages: false, contributions: true });
    expect(await getCollaborationSettings()).toEqual({ notifications: true, people: true, workspaces: "team", messages: false, contributions: true });
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ type: "global", slug: "collaborationSettings" }));
  });
  it("hides every collaboration tool when the read fails", async () => {
    query.mockRejectedValue(new Error("db down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getCollaborationSettings()).toEqual(ALL_OFF);
    spy.mockRestore();
  });
  it("opens everything under the dev override, without reading", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_ENGAGEMENT", "true");
    expect((await getCollaborationAccessFor({ id: "u1", role: "community_member" })).workspaces).toEqual({ see: true, create: true });
    expect(query).not.toHaveBeenCalled();
  });
  it("applies the viewer's role", async () => {
    query.mockResolvedValue({ workspaces: "team" });
    expect((await getCollaborationAccessFor({ id: "u1", role: "community_member" })).workspaces.see).toBe(false);
    expect((await getCollaborationAccessFor(null)).contributions).toBe(false);
  });
});
