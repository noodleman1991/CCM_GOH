import { describe, expect, it } from "vitest";
import { canEditCommunity } from "@/lib/cms/can-edit-community";

describe("who sees Edit on a community page", () => {
  it("staff always, leads only on their own community, nobody else", () => {
    expect(canEditCommunity({ id: "s", role: "team_editor" }, [])).toBe(true);
    expect(canEditCommunity({ id: "l", role: "community_editor" }, ["l"])).toBe(true);
    expect(canEditCommunity({ id: "l", role: "community_editor" }, ["other"])).toBe(false);
    expect(canEditCommunity({ id: "m", role: "community_member" }, ["m"])).toBe(false);
    expect(canEditCommunity(null, ["x"])).toBe(false);
  });
});
