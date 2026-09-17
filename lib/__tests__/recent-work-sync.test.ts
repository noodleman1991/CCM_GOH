import { describe, expect, it } from "vitest";
import { planRecentWorkSync, recentWorkNestedWrite } from "@/lib/profile/recent-work-sync";

/**
 * Saving the profile used `recentWork: { deleteMany: {}, create: [...] }`,
 * which minted new rows every time — so the owner's `pinned` and `hidden`
 * curation (and the row ids the public profile links to) were reset on
 * every save of any other field. The form now carries each row's id, and
 * the write updates rows in place, creates the new ones, and deletes only
 * the ones the person removed.
 */
const existing = [
  { id: "a", pinned: true, hidden: false },
  { id: "b", pinned: false, hidden: true },
  { id: "c", pinned: false, hidden: false },
];

const base = { description: "d", link: null, startDate: "2024-01-01", endDate: "", isOngoing: false };

describe("planRecentWorkSync", () => {
  it("updates rows that came back with their id, creates the ones without, deletes the ones missing", () => {
    const plan = planRecentWorkSync(existing, [
      { id: "a", title: "A2", ...base },
      { title: "new", ...base },
      { id: "c", title: "C", ...base },
    ]);
    expect(plan.updates.map((u) => u.id)).toEqual(["a", "c"]);
    expect(plan.creates.map((c) => c.title)).toEqual(["new"]);
    expect(plan.deleteIds).toEqual(["b"]);
  });

  it("treats an id the person does not own as a new row, never an update of someone else's", () => {
    const plan = planRecentWorkSync(existing, [{ id: "not-mine", title: "x", ...base }]);
    expect(plan.updates).toEqual([]);
    expect(plan.creates.map((c) => c.title)).toEqual(["x"]);
    expect(plan.deleteIds.sort()).toEqual(["a", "b", "c"]);
  });

  it("an empty submission removes everything, as before", () => {
    const plan = planRecentWorkSync(existing, []);
    expect(plan.deleteIds.sort()).toEqual(["a", "b", "c"]);
  });
});

describe("recentWorkNestedWrite", () => {
  it("never touches pinned/hidden and only deletes the planned ids", () => {
    const write = recentWorkNestedWrite(
      planRecentWorkSync(existing, [
        { id: "a", title: "A2", ...base, endDate: "2024-06-01" },
        { title: "new", ...base, isOngoing: true },
      ]),
    );
    expect(write.deleteMany).toEqual({ id: { in: ["b", "c"] } });
    expect(write.update).toEqual([
      {
        where: { id: "a" },
        data: {
          title: "A2",
          description: "d",
          link: null,
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-06-01"),
          isOngoing: false,
          role: null,
          collaborators: null,
          outcome: null,
          imageUrl: null,
        },
      },
    ]);
    expect(write.create).toEqual([
      {
        title: "new",
        description: "d",
        link: null,
        startDate: new Date("2024-01-01"),
        endDate: null,
        isOngoing: true,
        role: null,
        collaborators: null,
        outcome: null,
        imageUrl: null,
      },
    ]);
    for (const u of write.update) {
      expect(u.data).not.toHaveProperty("pinned");
      expect(u.data).not.toHaveProperty("hidden");
    }
  });

  it("omits an empty deleteMany filter rather than deleting everything", () => {
    const write = recentWorkNestedWrite(planRecentWorkSync([{ id: "a", pinned: false, hidden: false }], [{ id: "a", title: "A", ...base }]));
    expect(write.deleteMany).toBeUndefined();
  });
});
