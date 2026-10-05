import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const update = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { user: { update: (a: unknown) => update(a) } } }));
const actor = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: () => actor() }));
const access = vi.fn();
vi.mock("@/lib/collaboration/access-server", () => ({ getCollaborationAccessFor: () => access() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { setOpenToCollaborate } from "@/lib/actions/open-to-collaborate";

beforeEach(() => { update.mockReset(); actor.mockResolvedValue({ id: "u1", role: "community_member" }); access.mockResolvedValue({ people: true }); });

describe("saying you're open to collaborate", () => {
  it("changes only the two fields", async () => {
    expect(await setOpenToCollaborate(true, "  youth research  ")).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { openToCollaboration: true, collaborationInterests: "youth research" } });
  });
  it("clears an empty interests line", async () => {
    await setOpenToCollaborate(true, "   ");
    expect(update.mock.calls[0][0].data.collaborationInterests).toBeNull();
  });
  it("refuses when signed out or while the team hasn't opened it", async () => {
    actor.mockResolvedValueOnce(null);
    expect((await setOpenToCollaborate(true)).ok).toBe(false);
    access.mockResolvedValueOnce({ people: false });
    expect((await setOpenToCollaborate(true)).ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
