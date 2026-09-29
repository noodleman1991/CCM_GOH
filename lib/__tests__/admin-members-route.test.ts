import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const staff = vi.fn();
const findMany = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: async () => ({}), isStaff: () => staff() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findMany: (a: unknown) => findMany(a) } } }));
import { GET } from "@/app/api/admin/members/route";
beforeEach(() => { staff.mockReset(); findMany.mockReset(); });

describe("member search for the lead picker", () => {
  it("is staff-only", async () => {
    staff.mockReturnValue(false);
    expect((await GET(new Request("http://x/api/admin/members?q=ana"))).status).toBe(403);
  });
  it("finds members by name or email, at most 10", async () => {
    staff.mockReturnValue(true);
    findMany.mockResolvedValue([{ id: "u1", firstName: "Ana", lastName: "Li", email: "ana@x.org" }]);
    const res = await GET(new Request("http://x/api/admin/members?q=ana"));
    expect(await res.json()).toEqual({ members: [{ id: "u1", name: "Ana Li", email: "ana@x.org" }] });
    expect(findMany.mock.calls[0][0]).toMatchObject({ take: 10 });
  });
  it("asks for at least two letters", async () => {
    staff.mockReturnValue(true);
    expect(await (await GET(new Request("http://x/api/admin/members?q=a"))).json()).toEqual({ members: [] });
    expect(findMany).not.toHaveBeenCalled();
  });
});
