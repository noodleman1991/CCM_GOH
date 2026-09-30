import { describe, expect, it } from "vitest";
import { regionChips } from "@/lib/maps/region-chips";
import type { RegionCode } from "@/lib/maps/region-codes";

const data: Array<{ code: RegionCode; value: number }> = [
  { code: "oce", value: 3 },
  { code: "ssa", value: 9 },
  { code: "enam", value: 5 },
];
const en: Record<string, string> = { ssa: "Sub-Saharan Africa", nawa: "Northern Africa and Western Asia", csa: "Central and Southern Asia", esea: "Eastern and South-Eastern Asia", lac: "Latin America and the Caribbean", oce: "Oceania", enam: "Europe and Northern America" };
const ar: Record<string, string> = { ssa: "أفريقيا جنوب الصحراء", nawa: "شمال أفريقيا وغرب آسيا", csa: "آسيا الوسطى والجنوبية", esea: "شرق وجنوب شرق آسيا", lac: "أمريكا اللاتينية والكاريبي", oce: "أوقيانوسيا", enam: "أوروبا وأمريكا الشمالية" };

describe("the atlas region row", () => {
  it("lists all seven regions alphabetically in the reader's language, with the map's counts", () => {
    const chips = regionChips(data, (c) => en[c], "en");
    expect(chips.map((c) => c.label)).toEqual([...Object.values(en)].sort((a, b) => a.localeCompare(b, "en")));
    expect(chips.find((c) => c.code === "ssa")?.count).toBe(9);
    expect(chips.find((c) => c.code === "lac")?.count).toBe(0);
  });
  it("sorts by the Arabic names on the Arabic site", () => {
    const chips = regionChips(data, (c) => ar[c], "ar");
    expect(chips.map((c) => c.label)).toEqual([...Object.values(ar)].sort((a, b) => a.localeCompare(b, "ar")));
    expect(chips.map((c) => c.code)).not.toEqual(regionChips(data, (c) => en[c], "en").map((c) => c.code));
  });
});
