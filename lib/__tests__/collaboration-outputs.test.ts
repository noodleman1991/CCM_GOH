import { describe, it, expect } from "vitest";
import { OUTPUT_TYPES, isOutputType, outputDetailHref, mapSanityStatus, mergeOutputDocs } from "@/lib/collaboration/outputs";

describe("workspace output helpers", () => {
  it("lists the linkable output types", () => {
    expect(OUTPUT_TYPES.map((o) => o.type).sort()).toEqual(["caseStudy", "livedExperience", "researchOutput"]);
  });
  it("validates output types", () => {
    expect(isOutputType("caseStudy")).toBe(true);
    expect(isOutputType("dataset")).toBe(false);
  });
  it("builds detail hrefs per type", () => {
    expect(outputDetailHref("caseStudy", "x")).toBe("/research-and-action/case-studies/x");
    expect(outputDetailHref("livedExperience", "x")).toBe("/lived-experiences/x");
    expect(outputDetailHref("researchOutput", "x")).toBe("/research-and-action/research-outputs/x");
  });
  it("maps sanity status with a draft fallback", () => {
    expect(mapSanityStatus("approved")).toBe("approved");
    expect(mapSanityStatus(undefined)).toBe("draft");
    expect(mapSanityStatus("weird")).toBe("draft");
  });
});

describe("mergeOutputDocs", () => {
  const row = { id: "r1", sanityId: "abc", sanityType: "caseStudy", title: "Untitled", status: "pending" };

  it("prefers live Sanity title/status and carries slug", () => {
    const merged = mergeOutputDocs(
      [row],
      [{ _id: "drafts.abc", title: "Real title", status: "approved", slug: "real-title" }]
    );
    expect(merged[0]).toMatchObject({ title: "Real title", status: "approved", slug: "real-title" });
  });

  it("falls back to cached row values when the doc is missing", () => {
    const merged = mergeOutputDocs([row], []);
    expect(merged[0]).toMatchObject({ title: "Untitled", status: "pending", slug: null });
  });

  it("matches drafts.-prefixed row ids against published doc ids", () => {
    const merged = mergeOutputDocs(
      [{ ...row, sanityId: "drafts.abc" }],
      [{ _id: "abc", title: "Published", status: "approved", slug: "published" }]
    );
    expect(merged[0].title).toBe("Published");
  });

  it("normalizes unknown live statuses through mapSanityStatus", () => {
    const merged = mergeOutputDocs([row], [{ _id: "abc", title: "T", status: "bogus", slug: null }]);
    expect(merged[0].status).toBe("draft");
  });
});
