import { describe, it, expect } from "vitest";
import { normalizeTagColor, sortedTags, CCM_TAG_COLORS } from "../tags";

describe("normalizeTagColor", () => {
  it("maps legacy Tailwind hexes to on-brand CCM colours", () => {
    expect(normalizeTagColor("#3b82f6")).toBe(CCM_TAG_COLORS.water); // blue
    expect(normalizeTagColor("#10b981")).toBe(CCM_TAG_COLORS.teal); // green
    expect(normalizeTagColor("#f97316")).toBe(CCM_TAG_COLORS.clay); // orange
    expect(normalizeTagColor("#8b5cf6")).toBe(CCM_TAG_COLORS.plum); // purple
  });

  it("passes through our own CCM hex values and token names", () => {
    expect(normalizeTagColor(CCM_TAG_COLORS.sea)).toBe(CCM_TAG_COLORS.sea);
    expect(normalizeTagColor("midnight")).toBe(CCM_TAG_COLORS.midnight);
  });

  it("is case-insensitive on hex input", () => {
    expect(normalizeTagColor("#3B82F6")).toBe(CCM_TAG_COLORS.water);
  });

  it("falls back to ccm-sea for unknown / empty colours", () => {
    expect(normalizeTagColor("#123456")).toBe(CCM_TAG_COLORS.sea);
    expect(normalizeTagColor("")).toBe(CCM_TAG_COLORS.sea);
    expect(normalizeTagColor(null)).toBe(CCM_TAG_COLORS.sea);
    expect(normalizeTagColor(undefined)).toBe(CCM_TAG_COLORS.sea);
  });
});

describe("sortedTags", () => {
  const tag = (id: string, en: string) => ({ _id: id, label: { en }, color: "#3b82f6" });

  it("sorts by localized label, locale-aware", () => {
    const out = sortedTags([tag("3", "Zebra"), tag("1", "Apple"), tag("2", "mango")], "en");
    expect(out.map((t) => t._id)).toEqual(["1", "2", "3"]); // Apple, mango, Zebra (base sensitivity)
  });

  it("drops null/incomplete tags and does not mutate input", () => {
    const input = [tag("1", "B"), null, { _id: "2" }, undefined];
    const out = sortedTags(input as never, "en");
    expect(out.map((t) => t._id)).toEqual(["1"]);
    expect(input.length).toBe(4); // original untouched
  });

  it("handles empty / nullish input", () => {
    expect(sortedTags(null, "en")).toEqual([]);
    expect(sortedTags([], "fr")).toEqual([]);
  });

  it("resolves the active locale's label for sorting", () => {
    const t1 = { _id: "1", label: { en: "Zebra", es: "Abeja" } };
    const t2 = { _id: "2", label: { en: "Apple", es: "Zorro" } };
    // In Spanish: Abeja < Zorro -> t1 first
    expect(sortedTags([t2, t1], "es").map((t) => t._id)).toEqual(["1", "2"]);
    // In English: Apple < Zebra -> t2 first
    expect(sortedTags([t2, t1], "en").map((t) => t._id)).toEqual(["2", "1"]);
  });
});
