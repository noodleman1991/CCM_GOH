import { describe, expect, it } from "vitest";
import {
  findVulnerablePopulationsTag,
  isNewerUnpublishedDraft,
  planConversion,
  proposeTopicMapping,
} from "@/scripts/case-studies/topic-to-tags";

describe("topic → tag conversion", () => {
  it("proposes the closest theme tag by slug and leaves weak matches for a human", () => {
    const proposal = proposeTopicMapping(
      [
        { value: "migration", label: "Migration & Displacement" },
        { value: "digital-inclusion", label: "Digital Inclusion" },
      ],
      [
        { id: "t-mig", value: "migration", label: "Migration", category: "topic" },
        // A strong word match outside the theme category is never proposed.
        { id: "t-dig", value: "digital-inclusion", label: "Digital Inclusion", category: "audience" },
      ],
    );
    expect(proposal).toEqual([
      expect.objectContaining({ topic: "migration", tagSlug: "migration", tagLabel: "Migration" }),
      expect.objectContaining({ topic: "digital-inclusion", tagSlug: null, tagLabel: null }),
    ]);
  });

  it("puts the mapped tag first so it becomes the main theme, without duplicating", () => {
    expect(
      planConversion(
        [
          { id: "a", topic: "migration", tags: ["x"] },
          { id: "b", topic: "migration", tags: ["t-mig", "x"] },
          { id: "c", topic: "other", tags: [] },
          { id: "d", topic: null, tags: ["x"] },
        ],
        { migration: "migration" },
        { migration: "t-mig" },
      ),
    ).toEqual([
      { id: "a", before: ["x"], after: ["t-mig", "x"] },
      { id: "b", before: ["t-mig", "x"], after: ["t-mig", "x"] },
    ]);
  });

  it("moves an already-attached mapped tag to the front", () => {
    expect(
      planConversion([{ id: "a", topic: "migration", tags: ["x", "t-mig"] }], { migration: "migration" }, { migration: "t-mig" }),
    ).toEqual([{ id: "a", before: ["x", "t-mig"], after: ["t-mig", "x"] }]);
  });

  it("skips a topic whose mapped slug has no tag rather than writing a dangling id", () => {
    expect(planConversion([{ id: "a", topic: "migration", tags: [] }], { migration: "gone" }, {})).toEqual([]);
  });

  it("finds the Vulnerable Populations tag by its English label", () => {
    const found = findVulnerablePopulationsTag([
      { id: "1", value: "farmers", label: "Farmers", category: "audience" },
      { id: "2", value: "vulnerable-populations", label: " vulnerable populations ", category: "location" },
    ]);
    expect(found).toEqual(expect.objectContaining({ id: "2", value: "vulnerable-populations", category: "location" }));
  });

  it("flags only an unpublished draft saved after the main row", () => {
    const main = "2026-09-01T00:00:00.000Z";
    expect(isNewerUnpublishedDraft(main, { status: "draft", updatedAt: "2026-09-02T00:00:00.000Z" })).toBe(true);
    expect(isNewerUnpublishedDraft(main, { status: "draft", updatedAt: "2026-08-31T00:00:00.000Z" })).toBe(false);
    expect(isNewerUnpublishedDraft(main, { status: "published", updatedAt: "2026-09-02T00:00:00.000Z" })).toBe(false);
    expect(isNewerUnpublishedDraft(main, null)).toBe(false);
  });

  it("does not flag a newer draft that already carries the converted tags", () => {
    const main = "2026-09-01T00:00:00.000Z";
    const later = "2026-09-02T00:00:00.000Z";
    expect(isNewerUnpublishedDraft(main, { status: "draft", updatedAt: later, tags: ["t-mig", "x"] }, ["t-mig", "x"])).toBe(false);
    expect(isNewerUnpublishedDraft(main, { status: "draft", updatedAt: later, tags: ["x"] }, ["t-mig", "x"])).toBe(true);
  });
});
