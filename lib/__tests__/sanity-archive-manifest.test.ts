import { describe, expect, it } from "vitest";
import { buildManifest } from "@/scripts/lib/sanity-archive-manifest";

describe("buildManifest", () => {
  it("separates drafts from published, per type", () => {
    const m = buildManifest(
      [
        { _id: "a", _type: "caseStudy" },
        { _id: "drafts.a", _type: "caseStudy" },
        { _id: "b", _type: "author" },
      ],
      "production_2",
    );
    expect(m.totals).toEqual({ documents: 3, published: 2, drafts: 1 });
    expect(m.byType.caseStudy).toEqual({ published: 1, drafts: 1 });
    expect(m.byType.author).toEqual({ published: 1, drafts: 0 });
  });

  it("excludes sanity.* and system.* documents from totals", () => {
    const m = buildManifest(
      [
        { _id: "img", _type: "sanity.imageAsset" },
        { _id: "grp", _type: "system.group" },
        { _id: "a", _type: "tag" },
      ],
      "production_2",
    );
    expect(m.totals.documents).toBe(1);
    expect(m.byType["sanity.imageAsset"]).toBeUndefined();
  });

  it("records the dataset it was built from", () => {
    expect(buildManifest([], "production_2").dataset).toBe("production_2");
  });
});
