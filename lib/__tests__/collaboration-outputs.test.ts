import { describe, it, expect } from "vitest";
import { OUTPUT_TYPES, isOutputType, outputDetailHref, mapSanityStatus } from "@/lib/collaboration/outputs";

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
