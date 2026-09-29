import { describe, expect, it } from "vitest";
import { backPath, parseSectionTarget } from "@/payload/components/section-focus-target";

describe("section focus target", () => {
  it("reads the section row from the link", () => {
    expect(parseSectionTarget("#sections-row-3")).toEqual({ field: "sections", row: 3 });
    expect(parseSectionTarget("#sectionsByLanguage-row-0")).toEqual({ field: "sectionsByLanguage", row: 0 });
  });
  it("ignores anything else", () => {
    for (const h of ["", "#", "#sections-row-", "#sections-row--1", "#sections-row-2x", "#other-row-1"]) expect(parseSectionTarget(h)).toBeNull();
  });
  it("offers the way back only to a same-site path", () => {
    expect(backPath("?from=%2Fen%2Fabout")).toBe("/en/about");
    expect(backPath("?from=https%3A%2F%2Fevil.example")).toBeNull();
    expect(backPath("?from=%2F%2Fevil.example")).toBeNull();
    expect(backPath("")).toBeNull();
  });
});
