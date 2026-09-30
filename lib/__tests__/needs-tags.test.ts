import { describe, expect, it } from "vitest";
import { countTagGaps, needsTagsRows } from "@/payload/components/needs-tags";

const categories = new Map([
  ["t-drought", "topic"],
  ["t-flood", "impact"],
  ["t-youth", "audience"],
  ["t-uk", "location"],
]);

describe("countTagGaps", () => {
  it("finds items with no theme tag and no community tag; location tags count for neither", () => {
    const gaps = countTagGaps(
      [
        { id: "a", tags: ["t-drought", "t-youth"] }, // both
        { id: "b", tags: ["t-flood"] }, // theme only
        { id: "c", tags: ["t-uk"] }, // neither
        { id: "d", tags: [] }, // neither
        { id: "e", tags: [{ id: "t-youth" }] }, // populated shape, community only
      ],
      categories,
    );
    expect(gaps).toEqual({ total: 5, noThemes: ["c", "d", "e"], noCommunities: ["b", "c", "d"] });
  });
});

describe("needsTagsRows", () => {
  it("links each count to exactly those items in the admin list", () => {
    const rows = needsTagsRows([
      { collection: "caseStudies", label: "Case studies", total: 27, noThemes: ["x"], noCommunities: ["x", "y"] },
    ]);
    expect(rows).toEqual([
      {
        collection: "caseStudies",
        label: "Case studies",
        total: 27,
        noThemes: { count: 1, href: "/admin/collections/caseStudies?where[id][in]=x" },
        noCommunities: { count: 2, href: "/admin/collections/caseStudies?where[id][in]=x,y" },
      },
    ]);
  });

  it("gives no link for a count of zero", () => {
    const [row] = needsTagsRows([{ collection: "caseStudies", label: "Case studies", total: 3, noThemes: [], noCommunities: ["y"] }]);
    expect(row.noThemes).toEqual({ count: 0, href: null });
  });

  it("leaves out types with nothing missing", () => {
    const rows = needsTagsRows([
      { collection: "caseStudies", label: "Case studies", total: 27, noThemes: [], noCommunities: [] },
      { collection: "newsPosts", label: "News", total: 4, noThemes: ["n1"], noCommunities: ["n1"] },
    ]);
    expect(rows.map((r) => r.collection)).toEqual(["newsPosts"]);
  });
});
