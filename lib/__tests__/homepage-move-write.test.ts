import { describe, expect, it } from "vitest";
import { guardExisting, swapNewIds, toLocaleData, withIdsFrom } from "@/scripts/homepage/write";

describe("writing the move", () => {
  it("writes each language's own text only", () => {
    const sections = [{ blockType: "hero1", title: { en: "Hi", fr: "Salut" } }];
    expect(toLocaleData(sections, "fr")).toEqual([{ blockType: "hero1", title: "Salut" }]);
    expect(toLocaleData(sections, "es")).toEqual([{ blockType: "hero1", title: null }]);
  });

  it("reuses the saved rows' ids so later languages fill the same sections", () => {
    const saved = [{ id: "s1", blockType: "hero1", links: [{ id: "l1", title: "Go" }] }];
    const data = [{ blockType: "hero1", title: "Salut", links: [{ title: "Aller" }] }];
    expect(withIdsFrom(saved, data)).toEqual([{ id: "s1", blockType: "hero1", title: "Salut", links: [{ id: "l1", title: "Aller" }] }]);
  });

  it("refuses to overwrite sections that already exist unless told to", () => {
    expect(guardExisting([{ blockType: "hero1" }], { replace: false })).toBe(
      "The homepage already has 1 section. Nothing was changed. Run with --replace to overwrite them, or --revert to empty the list first.",
    );
    expect(guardExisting([{ blockType: "hero1" }], { replace: true })).toBeNull();
    expect(guardExisting([], { replace: false })).toBeNull();
  });

  it("names what already has sections", () => {
    expect(guardExisting([{}, {}], { replace: false, subject: "Oceania" })).toBe(
      "Oceania already has 2 sections. Nothing was changed. Run with --replace to overwrite them, or --revert to empty the list first.",
    );
  });

  it("swaps placeholder ids for the organisations just created, keeping order and dropping unknowns", () => {
    expect(swapNewIds(["o1", "new:wellcome", "new:gone"], new Map([["new:wellcome", "o9"]]))).toEqual(["o1", "o9"]);
  });
});
