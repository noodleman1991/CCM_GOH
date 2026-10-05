import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "me" }) }));
const get = vi.hoisted(() => vi.fn(async (_f: unknown, page: number, pageSize: number) => ({
  success: true,
  data: { data: [{ id: "u2", firstName: "Amina", email: "amina@example.org", phoneNumber: "+44 7700 900000" }], total: 1, page, pageSize },
})));
vi.mock("@/lib/services/user.service", () => ({ UserService: { getUsersForCollaborate: get } }));
import { GET } from "@/app/api/users/collaborate/route";

describe("GET /api/users/collaborate", () => {
  it("never returns members' contact details", async () => {
    const res = await GET(new NextRequest("http://localhost/api/users/collaborate?pageSize=20"));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/amina@example\.org|\+44/);
    expect(body.data[0]).toMatchObject({ id: "u2", firstName: "Amina" });
  });
  it("can't be asked for everyone at once", async () => {
    expect((await GET(new NextRequest("http://localhost/api/users/collaborate?pageSize=100000"))).status).toBe(400);
  });
});
