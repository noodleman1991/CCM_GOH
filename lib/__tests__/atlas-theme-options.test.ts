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
  it("matches any theme, or any community, with one tag condition", async () => {
    expect(await tagFilterWhere("caseStudies", { themes: ["drought", "trauma"], communities: [] })).toEqual({ "tags.value": { in: ["drought", "trauma"] } });
    expect(await tagFilterWhere("caseStudies", { themes: [], communities: ["youth"] })).toEqual({ "tags.value": { in: ["youth"] } });
    expect(await tagFilterWhere("caseStudies", "drought")).toEqual({ "tags.value": { in: ["drought"] } });
    expect(await tagFilterWhere("caseStudies", { themes: [], communities: [] })).toBeNull();
    expect(await tagFilterWhere("caseStudies", null)).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  // Payload joins the tags once per query, so two ANDed conditions on
  // `tags.value` must hold on the SAME tag — never true for a theme and a
  // community (dev DB: drought + farmers gave 0, not 1). The communities are
  // resolved to item ids first.
  it("with both set, resolves the communities to items first, then asks for a theme among them", async () => {
    query.mockResolvedValue({ docs: [{ id: "cs-1" }, { id: "cs-7" }] });
    expect(await tagFilterWhere("caseStudies", { themes: ["drought"], communities: ["farmers"] })).toEqual({
      and: [{ "tags.value": { in: ["drought"] } }, { id: { in: ["cs-1", "cs-7"] } }],
    });
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ collection: "caseStudies", where: { "tags.value": { in: ["farmers"] } } }));
  });

  it("with both set and no item in those communities, matches nothing", async () => {
    query.mockResolvedValue({ docs: [] });
    expect(await tagFilterWhere("caseStudies", { themes: ["drought"], communities: ["farmers"] })).toEqual({ id: { exists: false } });
  });
});
