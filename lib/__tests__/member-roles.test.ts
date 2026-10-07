import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const getActor = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: () => getActor() }));
const findUnique = vi.fn();
const findMany = vi.fn();
const count = vi.fn();
const update = vi.fn();
const findFirst = vi.fn();
const inviteUpsert = vi.fn();
const inviteDelete = vi.fn();
const inviteFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    staffRoleInvite: {
      upsert: (a: unknown) => inviteUpsert(a),
      deleteMany: (a: unknown) => inviteDelete(a),
      findMany: (a: unknown) => inviteFindMany(a),
    },
    user: {
      findFirst: (a: unknown) => findFirst(a),
      findUnique: (a: unknown) => findUnique(a),
      findMany: (a: unknown) => findMany(a),
      count: (a: unknown) => count(a),
      update: (a: unknown) => update(a),
    },
  },
}));

import { cancelReservation, listReservations, reserveRole, searchMembers, setMemberRole } from "@/lib/actions/member-roles";

const ADMIN = { id: "u_admin", role: "admin" };

beforeEach(() => {
  vi.clearAllMocks();
  getActor.mockResolvedValue(ADMIN);
  findUnique.mockResolvedValue({ id: "u_target", role: "community_member" });
  findMany.mockResolvedValue([]);
  count.mockResolvedValue(2);
  update.mockResolvedValue({ id: "u_target", role: "team_editor" });
  findFirst.mockResolvedValue(null);
  inviteFindMany.mockResolvedValue([]);
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

  it("finds a member by their exact email address, without ever sending it back", async () => {
    findMany.mockResolvedValue([{ id: "u_target", firstName: "Nik", lastName: "N", username: "nik", image: null, role: "team_editor" }]);
    const res = await searchMembers("  Nik@Example.org ");
    const where = JSON.stringify(findMany.mock.calls[0][0].where);
    expect(where).toContain('"email":{"equals":"nik@example.org","mode":"insensitive"}');
    expect(where).not.toContain("contains");
    expect(findMany.mock.calls[0][0].select).not.toHaveProperty("email");
    expect(res).toEqual({ ok: true, members: [expect.objectContaining({ id: "u_target", name: "Nik N" })], email: "nik@example.org" });
    expect(JSON.stringify(res.ok && res.members)).not.toContain("@");
  });

  it("says which address was searched when nobody uses it, so a role can be reserved for it", async () => {
    const res = await searchMembers("new@example.org");
    expect(res).toEqual({ ok: true, members: [], email: "new@example.org" });
  });

  it("needs at least two letters", async () => {
    expect(await searchMembers(" a ")).toEqual({ ok: true, members: [], email: null });
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("reserving a role for someone who hasn't joined yet", () => {
  it("is for admins only", async () => {
    getActor.mockResolvedValue({ id: "u_ed", role: "team_editor" });
    expect((await reserveRole("new@example.org", "team_editor")).ok).toBe(false);
    expect((await cancelReservation("new@example.org")).ok).toBe(false);
    expect((await listReservations()).ok).toBe(false);
    expect(inviteUpsert).not.toHaveBeenCalled();
    expect(inviteDelete).not.toHaveBeenCalled();
  });

  it("saves the role against the address, trimmed and in lower case", async () => {
    const res = await reserveRole("  New.Editor@Example.org ", "team_editor");
    expect(res).toEqual({ ok: true, applied: false });
    expect(inviteUpsert).toHaveBeenCalledWith({
      where: { email: "new.editor@example.org" },
      update: { role: "team_editor" },
      create: { email: "new.editor@example.org", role: "team_editor" },
    });
  });

  it("refuses something that isn't an email address, or an unknown role", async () => {
    expect((await reserveRole("not-an-email", "team_editor")).ok).toBe(false);
    expect((await reserveRole("a@b.org", "owner" as never)).ok).toBe(false);
    expect(inviteUpsert).not.toHaveBeenCalled();
  });

  it("gives the role straight away when that address already belongs to a member", async () => {
    findFirst.mockResolvedValue({ id: "u_target", role: "community_member" });
    const res = await reserveRole("member@example.org", "team_editor");
    expect(res).toEqual({ ok: true, applied: true });
    expect(update).toHaveBeenCalledWith({ where: { id: "u_target" }, data: { role: "team_editor" }, select: { role: true } });
    expect(inviteUpsert).not.toHaveBeenCalled();
  });

  it("removes a reservation", async () => {
    expect(await cancelReservation(" New.Editor@Example.org")).toEqual({ ok: true });
    expect(inviteDelete).toHaveBeenCalledWith({ where: { email: "new.editor@example.org" } });
  });
});
