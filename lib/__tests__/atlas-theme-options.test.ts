import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const query = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d), queryPreviewable: (d: unknown) => query(d) }));
import { getCommunityOptions, getThemeOptions, tagFilterWhere } from "@/lib/content/internal/payload/regions";

const TAGS = [
  { id: "t-old", value: "livelihoods", label: { en: "Livelihoods" }, category: "topic", useAsTheme: true },
  { id: "t-dr", value: "drought", label: { en: "Drought", ar: "الجفاف" }, category: "topic" },
  { id: "t-tr", value: "trauma", label: { en: "Trauma" }, category: "impact" },
  { id: "t-yo", value: "youth", label: { en: "Youth" }, category: "audience" },
  { id: "t-lo", value: "oceania", label: { en: "Oceania" }, category: "location" },
];
function respond(used: Record<string, string[][]>) {
  query.mockImplementation(async (d: { collection: string }) => {
    if (d.collection === "tags") return { docs: TAGS };
    return { docs: (used[d.collection] ?? []).map((tags, i) => ({ id: `${d.collection}-${i}`, tags })) };
  });
}
beforeEach(() => {
  query.mockReset();
});

describe("atlas filter options from real content", () => {
  it("offers only topic/impact tags content uses — not a ticked-but-unused one, not location tags", async () => {
    respond({ caseStudies: [["t-dr", "t-yo"], ["t-dr", "t-lo"]], newsPosts: [["t-tr"]] });
    expect((await getThemeOptions()).map((o) => o.slug)).toEqual(["drought", "trauma"]);
    expect((await getThemeOptions())[0].label.ar).toBe("الجفاف");
  });
  it("offers audience tags content uses as Communities", async () => {
    respond({ livedExperiences: [["t-yo"]] });
    expect((await getCommunityOptions()).map((o) => o.slug)).toEqual(["youth"]);
  });
  it("offers nothing — no fixed list — when nothing is tagged", async () => {
    respond({});
    expect(await getThemeOptions()).toEqual([]);
    expect(await getCommunityOptions()).toEqual([]);
  });
});

describe("the atlas tag condition", () => {
  it("matches any theme and any community, both required when both are set", () => {
    expect(tagFilterWhere({ themes: ["drought", "trauma"], communities: [] })).toEqual({ "tags.value": { in: ["drought", "trauma"] } });
    expect(tagFilterWhere({ themes: ["drought"], communities: ["youth"] })).toEqual({ and: [{ "tags.value": { in: ["drought"] } }, { "tags.value": { in: ["youth"] } }] });
    expect(tagFilterWhere({ themes: [], communities: [] })).toBeNull();
    expect(tagFilterWhere("drought")).toEqual({ "tags.value": { in: ["drought"] } });
    expect(tagFilterWhere(null)).toBeNull();
  });
});
