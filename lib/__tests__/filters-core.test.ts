import { describe, expect, it } from "vitest";
import { applyFilters, axisOf, buildOptions, EMPTY_FILTERS, isFiltering, type FilterableItem } from "@/lib/filters/core";

const tag = (slug: string, category: string, en = slug, ar?: string) => ({ slug, category, label: { en, ...(ar ? { ar } : {}) } });
const youth = tag("youth", "audience", "Youth", "الشباب");
const drought = tag("drought", "topic", "Drought");
const trauma = tag("trauma", "impact", "Trauma");
const place = tag("oceania-tag", "location", "Oceania");
const item = (id: string, tags: FilterableItem["tags"], regions: string[], date: string | null = "2026-05-01", title = id): FilterableItem => ({ id, tags, regions, date, text: { en: title } });

const items = [
  item("a", [youth, drought, place], ["oce"]),
  item("b", [drought], ["ssa"]),
  item("c", [youth, trauma], ["oce"], "2020-01-01"),
  item("d", [], [], null, "Floods and farmers"),
];
const label = (c: string) => c.toUpperCase();

describe("filter engine", () => {
  it("puts audience tags under Communities, topic and impact under Themes, nothing else", () => {
    expect([axisOf("audience"), axisOf("topic"), axisOf("impact"), axisOf("location"), axisOf(null)]).toEqual(["communities", "themes", "themes", null, null]);
  });
  it("matches any value within an axis and all axes together", () => {
    const f = (over: object) => applyFilters(items, { ...EMPTY_FILTERS, ...over }).map((i) => i.id);
    expect(f({ themes: ["drought", "trauma"] })).toEqual(["a", "b", "c"]);
    expect(f({ themes: ["drought"], communities: ["youth"] })).toEqual(["a"]);
    expect(f({ regions: ["oce"] })).toEqual(["a", "c"]);
    expect(f({ q: "FLOOD" })).toEqual(["d"]);
  });
  it("filters by when, leaving undated items out once a period is chosen", () => {
    const now = new Date("2026-09-30T00:00:00Z");
    expect(applyFilters(items, { ...EMPTY_FILTERS, when: "past-year" }, { now }).map((i) => i.id)).toEqual(["a", "b"]);
    expect(applyFilters(items, { ...EMPTY_FILTERS, when: "earlier" }, { now }).map((i) => i.id)).toEqual(["c"]);
  });
  it("offers only tags in use, counted with the axis's own choice set aside, never location tags", () => {
    const o = buildOptions(items, { ...EMPTY_FILTERS, themes: ["drought"] }, { locale: "en", regionLabel: label });
    expect(o.themes).toEqual([{ value: "drought", label: "Drought", count: 2 }, { value: "trauma", label: "Trauma", count: 1 }]);
    expect(o.communities).toEqual([{ value: "youth", label: "Youth", count: 1 }]);
    expect(o.regions).toEqual([{ value: "oce", label: "OCE", count: 1 }, { value: "ssa", label: "SSA", count: 1 }]);
  });
  it("falls back to English labels", () => {
    expect(buildOptions(items, EMPTY_FILTERS, { locale: "ar", regionLabel: label }).communities[0].label).toBe("الشباب");
    expect(buildOptions(items, EMPTY_FILTERS, { locale: "ar", regionLabel: label }).themes.find((t) => t.value === "drought")!.label).toBe("Drought");
  });
  it("leaves out a tag nearly everything carries (over 90%)", () => {
    const common = tag("mh", "topic", "Mental health");
    const many = Array.from({ length: 10 }, (_, i) => item(`m${i}`, i < 10 ? [common] : [], ["oce"]));
    const few = [item("n1", [common], []), item("n2", [], []), item("n3", [], []), item("n4", [], [])];
    expect(buildOptions(many, EMPTY_FILTERS, { locale: "en", regionLabel: label }).themes).toEqual([]);
    expect(buildOptions(few, EMPTY_FILTERS, { locale: "en", regionLabel: label }).themes).toEqual([{ value: "mh", label: "Mental health", count: 1 }]);
  });
  it("knows when anything is being filtered", () => {
    expect(isFiltering(EMPTY_FILTERS)).toBe(false);
    expect(isFiltering({ ...EMPTY_FILTERS, q: "x" })).toBe(true);
  });
});
