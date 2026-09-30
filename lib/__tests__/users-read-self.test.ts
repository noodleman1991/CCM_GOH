import { describe, expect, it } from "vitest";
import config from "@payload-config";

describe("users: reading your own record", () => {
  it("lets an editor read their own user (the admin's 'who am I' call), admins read all, others nothing", async () => {
    const users = (await config).collections.find((c) => c.slug === "users")!;
    const read = users.access.read as (a: unknown) => unknown;
    expect(await read({ req: { user: { id: "u1", role: "team_editor" } } })).toEqual({ id: { equals: "u1" } });
    expect(await read({ req: { user: { id: "u2", role: "community_editor" } } })).toEqual({ id: { equals: "u2" } });
    expect(await read({ req: { user: { id: "a1", role: "admin" } } })).toBe(true);
    expect(await read({ req: { user: null } })).toBe(false);
  });
});
