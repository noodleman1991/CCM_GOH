import { beforeEach, describe, expect, it, vi } from "vitest";

const { actor, findGlobal, updateGlobal } = vi.hoisted(() => ({
  actor: { role: "team_editor" as string },
  findGlobal: vi.fn(),
  updateGlobal: vi.fn(async () => ({})),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/authz", () => ({ getActor: async () => ({ role: actor.role }), isStaff: (a: { role: string }) => a.role === "team_editor" || a.role === "admin" }));
vi.mock("payload", () => ({ getPayload: async () => ({ findGlobal, updateGlobal }) }));
vi.mock("@payload-config", () => ({ default: {} }));

import { allowEventSuggestions, stopEventSuggestions } from "@/lib/actions/event-suggestions";

beforeEach(() => {
  vi.clearAllMocks();
  actor.role = "team_editor";
  findGlobal.mockResolvedValue({ open: true, blocked: [{ userId: "u1" }] });
});

describe("stopping a person suggesting events", () => {
  it("is for the team only", async () => {
    actor.role = "community_member";
    expect(await stopEventSuggestions("u2")).toMatchObject({ ok: false });
    expect(updateGlobal).not.toHaveBeenCalled();
  });
  it("adds them to the list", async () => {
    expect(await stopEventSuggestions("u2")).toEqual({ ok: true });
    expect(updateGlobal).toHaveBeenCalledWith(expect.objectContaining({ slug: "eventSuggestions", data: { blocked: [{ userId: "u1" }, { userId: "u2" }] } }));
  });
  it("lets them suggest again", async () => {
    expect(await allowEventSuggestions("u1")).toEqual({ ok: true });
    expect(updateGlobal).toHaveBeenCalledWith(expect.objectContaining({ data: { blocked: [] } }));
  });
});
