import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { query, findMany, stats, facetItems } = vi.hoisted(() => ({
  query: vi.fn(),
  findMany: vi.fn(),
  stats: vi.fn(async () => ({ caseStudies: 2, livedExperiences: 1 })),
  facetItems: vi.fn(async () => [] as unknown[]),
}));
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d) }));
vi.mock("@/lib/prisma", () => ({ prisma: { community: { findMany } } }));
vi.mock("@/lib/content/pages/regional-community", () => ({ getRegionStats: stats }));
vi.mock("@/lib/content/regions", () => ({ getRegionFacetItems: facetItems }));

import { getCommunityCarouselCards } from "@/lib/content/community-carousel";

const NOW = new Date("2026-11-01T00:00:37.512Z");

beforeEach(() => {
  vi.clearAllMocks();
  query.mockImplementation(async (d: { collection: string }) => {
    if (d.collection === "regionalCommunities") {
      return { docs: [{ id: "rc-oce", slug: "oceania", region: "oce", name: "Oceania", tagline: "Islands, oceans, us." }] };
    }
    if (d.collection === "events") {
      return { docs: [{ id: "e1", slug: "coastal", title: "Coastal circle", startAt: "2026-11-12T10:00:00Z", relatedCommunity: "rc-oce" }] };
    }
    return { docs: [] };
  });
  findMany.mockResolvedValue([
    { regionalName: "oce", _count: { members: 12 }, members: [{ user: { firstName: "Amina", lastName: "K", image: "/a.jpg" } }] },
  ]);
});

describe("the community carousel's data", () => {
  it("reads every community's members and public faces in one query", async () => {
    const cards = await getCommunityCarouselCards("en", NOW);
    expect(findMany).toHaveBeenCalledTimes(1);
    const where = JSON.stringify(findMany.mock.calls[0][0]);
    expect(where).toContain('"profileVisibility":"PUBLIC"');
    expect(cards[0]).toMatchObject({ slug: "oceania", members: 12, stories: 3, tagline: "Islands, oceans, us." });
    expect(cards[0].faces).toEqual([{ name: "Amina K", image: "/a.jpg" }]);
  });

  it("counts only approved events that aren't over, and names the next one", async () => {
    const cards = await getCommunityCarouselCards("en", NOW);
    const eventsQuery = query.mock.calls.map((c) => c[0]).find((d) => d.collection === "events");
    const where = JSON.stringify(eventsQuery.where);
    expect(where).toContain('"moderationStatus":{"equals":"approved"}');
    expect(where).toContain("2026-11-01T00:00:00.000Z"); // whole minutes, so the cached read is shared
    expect(cards[0].upcomingEvents).toBe(1);
    expect(cards[0].latest.find((l) => l.kind === "event")).toMatchObject({ title: "Coastal circle", href: "/events/coastal" });
  });
  it("never holds up the page: a stalled members database gives cards without member numbers", async () => {
    vi.useFakeTimers();
    findMany.mockReturnValue(new Promise(() => {}));
    const pending = getCommunityCarouselCards("en", NOW);
    await vi.advanceTimersByTimeAsync(5000);
    const cards = await pending;
    vi.useRealTimers();
    expect(cards[0]).toMatchObject({ slug: "oceania", members: 0, faces: [], stories: 3 });
  });
});
