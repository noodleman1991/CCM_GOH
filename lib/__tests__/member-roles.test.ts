import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const getActor = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: () => getActor() }));
const findUnique = vi.fn();
const findMany = vi.fn();
const count = vi.fn();
const update = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (a: unknown) => findUnique(a),
      findMany: (a: unknown) => findMany(a),
      count: (a: unknown) => count(a),
      update: (a: unknown) => update(a),
    },
  },
}));

import { searchMembers, setMemberRole } from "@/lib/actions/member-roles";

const ADMIN = { id: "u_admin", role: "admin" };

beforeEach(() => {
  vi.clearAllMocks();
  getActor.mockResolvedValue(ADMIN);
  findUnique.mockResolvedValue({ id: "u_target", role: "community_member" });
  findMany.mockResolvedValue([]);
  count.mockResolvedValue(2);
  update.mockResolvedValue({ id: "u_target", role: "team_editor" });
});

describe("changing a member's role", () => {
  it("is for admins only", async () => {
    getActor.mockResolvedValue({ id: "u_ed", role: "team_editor" });
    expect((await setMemberRole("u_target", "team_editor")).ok).toBe(false);
    getActor.mockResolvedValue(null);
    expect((await setMemberRole("u_target", "team_editor")).ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a role that isn't one of the three", async () => {
    expect((await setMemberRole("u_target", "superuser" as never)).ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("never leaves the hub without an admin", async () => {
    findUnique.mockResolvedValue({ id: "u_other", role: "admin" });
    count.mockResolvedValue(1);
    const res = await setMemberRole("u_other", "team_editor");
    expect(res.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("doesn't let an admin change their own role", async () => {
    findUnique.mockResolvedValue({ id: "u_admin", role: "admin" });
    expect((await setMemberRole("u_admin", "team_editor")).ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("writes the role and logs who changed it", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const res = await setMemberRole("u_target", "team_editor");
    expect(res).toEqual({ ok: true, role: "team_editor" });
    expect(update).toHaveBeenCalledWith({ where: { id: "u_target" }, data: { role: "team_editor" }, select: { role: true } });
    const line = info.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(line).toContain("u_admin");
    expect(line).toContain("u_target");
    expect(line).toContain("community_member → team_editor");
  });
});

describe("finding members", () => {
  it("is for admins only", async () => {
    getActor.mockResolvedValue({ id: "u_ed", role: "team_editor" });
    expect(await searchMembers("ami")).toEqual({ ok: false, error: expect.any(String) });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("never selects an email or a phone", async () => {
    await searchMembers("ami");
    const select = findMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("email");
    expect(select).not.toHaveProperty("phoneNumber");
    expect(JSON.stringify(findMany.mock.calls[0][0].where)).not.toContain("email");
  });

  it("needs at least two letters", async () => {
    expect(await searchMembers(" a ")).toEqual({ ok: true, members: [] });
    expect(findMany).not.toHaveBeenCalled();
  });
});
