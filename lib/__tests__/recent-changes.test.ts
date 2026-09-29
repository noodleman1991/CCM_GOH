import { describe, expect, it } from "vitest";
import { latestChanges } from "@/payload/components/recent-changes";

describe("recent changes", () => {
  it("lists the newest edits first, up to n", () => {
    const items = [
      { label: "About", href: "/admin/collections/pages/a", updatedAt: "2026-09-01T00:00:00.000Z", kind: "Page" },
      { label: "Homepage", href: "/admin/globals/homepage", updatedAt: "2026-09-03T00:00:00.000Z", kind: "Homepage" },
      { label: "Oceania", href: "/admin/collections/regionalCommunities/o", updatedAt: "2026-09-02T00:00:00.000Z", kind: "Community" },
    ];
    expect(latestChanges(items, 2).map((i) => i.label)).toEqual(["Homepage", "Oceania"]);
  });
});
