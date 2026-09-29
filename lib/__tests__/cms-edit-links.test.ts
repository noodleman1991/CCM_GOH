import { describe, expect, it } from "vitest";
import { documentEditHref, safeFrom, sectionEditHref } from "@/lib/cms/edit-links";

describe("edit links", () => {
  it("accepts only same-site paths as the way back", () => {
    expect(safeFrom("/en/about")).toBe("/en/about");
    expect(safeFrom("/ar/communities/oceania?x=1")).toBe("/ar/communities/oceania?x=1");
    for (const bad of ["https://evil.example", "//evil.example", "javascript:alert(1)", "about", "", null, undefined, "/\\evil.example"]) {
      expect(safeFrom(bad)).toBeNull();
    }
  });
  it("opens a section with the way back", () => {
    expect(sectionEditHref("/admin/collections/pages/p1", 2, "/en/about")).toBe("/admin/collections/pages/p1?from=%2Fen%2Fabout#sections-row-2");
  });
  it("opens a document with the way back", () => {
    expect(documentEditHref("newsPosts", "n 1", "/fr/news/x")).toBe("/admin/collections/newsPosts/n%201?from=%2Ffr%2Fnews%2Fx");
  });
  it("drops a way back that isn't same-site", () => {
    expect(sectionEditHref("/admin/globals/homepage", 0, "https://evil.example")).toBe("/admin/globals/homepage#sections-row-0");
  });
});
