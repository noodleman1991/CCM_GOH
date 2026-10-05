import { describe, expect, it } from "vitest";
import { buildYourWeek } from "@/lib/dashboard/your-week";

const now = new Date("2026-11-01T09:00:00Z");
const ev = (id: string, startAt: string, o = {}) => ({ id, title: id, startAt, endAt: null, mode: "online" as const, place: null, href: `/events/${id}`, external: false, organiser: null, recordingUrl: null, image: null, ...o });
const changes = [{ id: "c1", kind: "livedExperience" as const, title: "Rising tide", status: "revision" as const, reviewNotes: "Add a place.", date: null, href: null, editHref: "/lived-experiences/submit?edit=c1", adminHref: "" }];

describe("your week", () => {
  it("puts what needs you first, then what's coming soonest, then tasks", () => {
    const week = buildYourWeek({
      going: [ev("b", "2026-11-05T10:00:00Z"), ev("a", "2026-11-02T10:00:00Z")],
      community: [ev("x", "2026-11-03T10:00:00Z")],
      tasks: [{ id: "t1", title: "Draft the survey", collaborationId: "w1", collaborationTitle: "The best project" }],
      changes,
      now,
    });
    expect(week.map((w) => `${w.kind}:${w.id}`)).toEqual(["changes:c1", "going:a", "going:b", "task:t1"]);
    expect(week[0]).toMatchObject({ href: "/lived-experiences/submit?edit=c1" });
    expect(week[3]).toMatchObject({ href: "/collaborations/w1?tab=plan", detail: "The best project" });
  });
  it("suggests the community's next event when you're going to nothing", () => {
    const week = buildYourWeek({ going: [], community: [ev("x", "2026-11-03T10:00:00Z"), ev("y", "2026-11-04T10:00:00Z")], tasks: [], changes: [], now });
    expect(week.map((w) => `${w.kind}:${w.id}`)).toEqual(["community:x"]);
  });
  it("is empty for a brand-new member, and never longer than the limit", () => {
    expect(buildYourWeek({ going: [], community: [], tasks: [], changes: [], now })).toEqual([]);
    const many = Array.from({ length: 10 }, (_, i) => ev(`e${i}`, `2026-11-${String(i + 2).padStart(2, "0")}T10:00:00Z`));
    expect(buildYourWeek({ going: many, community: [], tasks: [], changes: [], now, limit: 6 })).toHaveLength(6);
  });
});
