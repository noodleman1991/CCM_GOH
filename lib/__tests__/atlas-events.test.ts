import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const query = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d), queryPreviewable: (d: unknown) => query(d) }));
import { getRegionFacetCounts, getRegionPinRows } from "@/lib/content/internal/payload/regions";

const NO_WHEN = { filter: "", params: {} };

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue({ docs: [] });
});

describe("events on the atlas", () => {
  it("counts only approved events that haven't ended", async () => {
    await getRegionFacetCounts("event", { theme: null, q: "", when: NO_WHEN });
    const call = query.mock.calls[0][0];
    expect(call.collection).toBe("events");
    const where = JSON.stringify(call.where);
    expect(where).toContain('"moderationStatus":{"equals":"approved"}');
    expect(where).toContain('"endAt":{"greater_than_equal"');
    expect(where).toContain('"startAt":{"greater_than_equal"');
  });

  it("attributes an event to its community's region", async () => {
    query.mockResolvedValue({ docs: [{ id: "a", relatedCommunity: { slug: "oceania" }, startAt: "2099-01-01T00:00:00Z" }] });
    const [row] = await getRegionFacetCounts("event", { theme: null, q: "", when: NO_WHEN });
    expect(row.rcSlug).toBe("oceania");
  });

  it("pins an in-person event at its point and skips region-only and online ones", async () => {
    query.mockResolvedValue({
      docs: [
        { id: "a", title: { en: "A" }, slug: "a", mode: "in_person", place: { point: [178.4, -18.1], precision: "exact", countryCode: "FJI" }, startAt: "2099-01-01T00:00:00Z" },
        { id: "b", title: { en: "B" }, slug: "b", mode: "in_person", place: { precision: "region" }, startAt: "2099-01-01T00:00:00Z" },
        { id: "c", title: { en: "C" }, slug: "c", mode: "online", startAt: "2099-01-01T00:00:00Z" },
      ],
    });
    const pins = await getRegionPinRows("event", { region: "all", slug: "", regionCountries: [], themeSlug: null, q: "", when: NO_WHEN });
    expect(pins.filter((p) => p.point).map((p) => p._id)).toEqual(["a"]);
  });
});
