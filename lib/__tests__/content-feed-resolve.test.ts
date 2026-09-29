import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const query = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d), queryPreviewable: vi.fn() }));
const backend = vi.fn(() => "payload");
vi.mock("@/lib/content/internal/backend", () => ({ activeBackend: () => backend() }));

import { resolveContentFeed } from "@/lib/content/feeds/resolve";

type Descriptor = { collection: string; where: unknown; limit?: number };
const row = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  slug: `s-${id}`,
  title: { en: `T ${id}`, fr: `F ${id}` },
  publishedAt: "2026-09-01T00:00:00Z",
  featured: false,
  ...over,
});
const calls = () => query.mock.calls.map(([d]) => d as Descriptor);
const whereOf = (collection: string) => JSON.stringify(calls().find((d) => d.collection === collection)?.where);

beforeEach(() => {
  query.mockReset();
  backend.mockReturnValue("payload");
});

describe("resolveContentFeed", () => {
  it("queries approved rows and turns them into cards in the page's language", async () => {
    query.mockResolvedValue({ docs: [row("1"), row("2")] });
    const r = await resolveContentFeed({ kinds: ["caseStudies"] }, { locale: "fr" });
    expect(r.items.map((i) => [i.type, i.title, i.href])).toEqual([
      ["caseStudy", "F 1", "/research-and-action/case-studies/s-1"],
      ["caseStudy", "F 2", "/research-and-action/case-studies/s-2"],
    ]);
    expect(whereOf("caseStudies")).toContain('"moderationStatus":{"equals":"approved"}');
  });

  it("falls back to English when the page's language has no title", async () => {
    query.mockResolvedValue({ docs: [row("1", { title: { en: "Only English" } })] });
    const r = await resolveContentFeed({ kinds: ["newsPosts"] }, { locale: "ar" });
    expect(r.items[0].title).toBe("Only English");
  });

  it("uses this community by default on a community page", async () => {
    query.mockResolvedValue({ docs: [] });
    await resolveContentFeed({ kinds: ["newsPosts"] }, { locale: "en", communityId: "c-9" });
    expect(whereOf("newsPosts")).toContain('"relatedCommunity":{"in":["c-9"]}');
  });

  it("matches lived experiences on the field that actually holds their community and region", async () => {
    query.mockResolvedValue({ docs: [] });
    await resolveContentFeed({ kinds: ["livedExperiences"], filters: { regions: ["ssa"], communityIds: ["c-1"] } }, { locale: "en" });
    const where = whereOf("livedExperiences");
    expect(where).toContain('"region.region":{"in":["ssa"]}');
    expect(where).toContain('"region":{"in":["c-1"]}');
  });

  it("drops a pick the published query didn't return and reports it", async () => {
    query.mockResolvedValueOnce({ docs: [row("9")] });
    const r = await resolveContentFeed(
      { kinds: ["newsPosts"], fill: "picksOnly", picks: [{ kind: "newsPosts", id: "9" }, { kind: "newsPosts", id: "gone" }] },
      { locale: "en" },
    );
    expect(r.items.map((i) => i.id)).toEqual(["9"]);
    expect(r.skipped).toEqual([{ pick: { kind: "newsPosts", id: "gone" }, reason: "unpublished" }]);
    expect(whereOf("newsPosts")).toContain('"id":{"in":["9","gone"]}');
  });

  it("never sends a region the database would refuse", async () => {
    query.mockResolvedValue({ docs: [] });
    await resolveContentFeed({ kinds: ["caseStudies"], filters: { regions: ["ssa", "atlantis"] } }, { locale: "en" });
    const where = whereOf("caseStudies");
    expect(where).toContain("ssa");
    expect(where).not.toContain("atlantis");
  });

  it("skips kinds with no region when a region filter is set", async () => {
    query.mockResolvedValue({ docs: [] });
    await resolveContentFeed({ kinds: ["events", "agendas", "newsPosts"], filters: { regions: ["ssa"] } }, { locale: "en" });
    expect(calls().map((d) => d.collection)).toEqual(["newsPosts"]);
  });

  it("limits events to upcoming ones when asked", async () => {
    query.mockResolvedValue({ docs: [] });
    await resolveContentFeed({ kinds: ["events"], filters: { upcomingOnly: true } }, { locale: "en", now: new Date("2026-09-28T00:00:00Z") });
    expect(whereOf("events")).toContain('"startAt":{"greater_than_equal":"2026-09-28T00:00:00.000Z"}');
  });

  it("gives events their start date and a date tile", async () => {
    query.mockResolvedValue({ docs: [row("e1", { publishedAt: undefined, startAt: "2026-10-01T09:00:00.000Z" })] });
    const r = await resolveContentFeed({ kinds: ["events"] }, { locale: "en" });
    expect(r.items[0]).toMatchObject({ type: "event", href: "/collaborate/events/s-e1", event: { startAt: "2026-10-01T09:00:00.000Z" } });
  });

  it("one failing kind doesn't take the whole feed down", async () => {
    query.mockImplementation(async (d: Descriptor) => {
      if (d.collection === "events") throw new Error("db down");
      return { docs: [row("n1")] };
    });
    const r = await resolveContentFeed({ kinds: ["events", "newsPosts"] }, { locale: "en" });
    expect(r.items.map((i) => i.id)).toEqual(["n1"]);
  });

  it("filters by organisation, leaving out kinds with no organisation link", async () => {
    query.mockResolvedValue({ docs: [] });
    await resolveContentFeed({ kinds: ["caseStudies", "events"], filters: { organizationIds: ["o1"] } }, { locale: "en" });
    expect(calls().map((d) => d.collection)).toEqual(["caseStudies"]);
    expect(whereOf("caseStudies")).toContain('"organizations":{"in":["o1"]}');
  });

  it("an editor's community filter wins over the page's community", async () => {
    query.mockResolvedValue({ docs: [] });
    await resolveContentFeed({ kinds: ["newsPosts"], filters: { communityIds: ["chosen"] } }, { locale: "en", communityId: "page-community" });
    const where = whereOf("newsPosts");
    expect(where).toContain('"chosen"');
    expect(where).not.toContain("page-community");
  });

  it("agenda cards open the agenda's document, or the hub when it has none", async () => {
    query.mockResolvedValue({
      docs: [
        { id: "a1", slug: "a-1", title: { en: "A1" }, publishDate: "2026-01-01", files: [{ file: { url: "https://cdn.example/a1.pdf" } }] },
        { id: "a2", slug: "a-2", title: { en: "A2" }, publishDate: "2025-01-01", files: [] },
        { id: "a3", slug: "a-3", title: { en: "A3" }, publishDate: "2024-01-01", files: [{ file: { url: "javascript:alert(1)" } }] },
      ],
    });
    const r = await resolveContentFeed({ kinds: ["agendas"] }, { locale: "en" });
    expect(r.items.map((i) => i.href)).toEqual(["https://cdn.example/a1.pdf", "/research-and-action", "/research-and-action"]);
  });

  it("never links straight to a document that is for registered users or members only", async () => {
    query.mockResolvedValue({
      docs: [{ id: "a4", slug: "a-4", title: { en: "A4" }, publishDate: "2026-01-01", accessLevel: "members", files: [{ file: { url: "https://cdn.example/private.pdf" } }] }],
    });
    const r = await resolveContentFeed({ kinds: ["agendas"] }, { locale: "en" });
    expect(r.items[0].href).toBe("/research-and-action");
  });

  it("shows nothing on the old content backend", async () => {
    backend.mockReturnValue("sanity");
    const r = await resolveContentFeed({ kinds: ["caseStudies"] }, { locale: "en" });
    expect(r).toEqual({ items: [], skipped: [] });
    expect(query).not.toHaveBeenCalled();
  });
});
