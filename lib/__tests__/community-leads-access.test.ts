import { describe, expect, it } from "vitest";
import { communityRead, communityUpdate, hideFromLeads, isLead, mayUseAdmin, nextRole } from "@/payload/access/leads";
import config from "@payload-config";

const lead = { role: "community_editor", clerkId: "u_lead" };
const staff = { role: "team_editor", clerkId: "u_staff" };
const member = { role: "community_member", clerkId: "u_m" };
const req = (user: unknown) => ({ req: { user } }) as never;

describe("community leads", () => {
  it("lets leads and staff into the admin, nobody else", () => {
    expect([mayUseAdmin(lead), mayUseAdmin(staff), mayUseAdmin({ role: "admin" }), mayUseAdmin(member), mayUseAdmin(null)]).toEqual([true, true, true, false, false]);
    expect(isLead(lead)).toBe(true);
    expect(isLead(staff)).toBe(false);
  });
  it("lets a lead read and edit only the communities they lead", () => {
    expect(communityUpdate(req(lead))).toEqual({ leadIds: { in: ["u_lead"] } });
    expect(communityRead(req(lead))).toEqual({ or: [{ _status: { equals: "published" } }, { leadIds: { in: ["u_lead"] } }] });
    expect(communityUpdate(req(staff))).toBe(true);
    expect(communityUpdate(req(member))).toBe(false);
    expect(communityRead(req(member))).toEqual({ _status: { equals: "published" } });
  });
  it("gives the lead role while someone leads anything, and never demotes staff", () => {
    expect(nextRole("community_member", 1)).toBe("community_editor");
    expect(nextRole("community_editor", 1)).toBe("community_editor");
    expect(nextRole("community_editor", 0)).toBe("community_member");
    expect(nextRole("team_editor", 0)).toBe("team_editor");
    expect(nextRole("admin", 3)).toBe("admin");
  });
  it("hides every other admin entry from leads", () => {
    const hidden = hideFromLeads({ slug: "pages", admin: {} as { hidden?: unknown } }).admin.hidden as (a: { user: unknown }) => boolean;
    expect(hidden({ user: lead })).toBe(true);
    expect(hidden({ user: staff })).toBe(false);
    const kept = hideFromLeads({ slug: "x", admin: { hidden: true as unknown } }).admin.hidden as (a: { user: unknown }) => boolean;
    expect(kept({ user: staff })).toBe(true);
  });
  it("keeps members, page address, region and leads staff-only on the record", async () => {
    const rc = (await config).collections.find((c) => c.slug === "regionalCommunities")!;
    const byName = (fields: unknown[]): Record<string, { access?: { update?: (a: unknown) => boolean } }> =>
      Object.fromEntries(
        (fields as Array<Record<string, unknown>>).flatMap((f) =>
          "name" in f ? [[f.name as string, f]] : Array.isArray(f.fields) ? Object.entries(byName(f.fields as unknown[])) : [],
        ),
      );
    const fields = byName(rc.fields as unknown[]);
    for (const name of ["members", "slug", "region", "leadIds"]) {
      expect([name, fields[name]?.access?.update?.(req(lead))]).toEqual([name, false]);
      expect([name, fields[name]?.access?.update?.(req(staff))]).toEqual([name, true]);
    }
  });
});
