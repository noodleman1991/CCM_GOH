import { describe, expect, it } from "vitest";
import { pickCommunityEvents, pickGoingEvents } from "@/lib/dashboard/community-events";

const now = new Date("2026-11-01T09:00:00Z");
const e = (id: string, startAt: string, community: string | null) => ({ _id: id, title: id, description: null, scope: "community", startAt, endAt: null, mode: "online", locationName: null, url: null, linkedProject: null, slug: id, origin: "ccm", relatedCommunity: community ? { slug: community } : null }) as never;

describe("events for the dashboard", () => {
  const all = [e("past", "2026-10-01T10:00:00Z", "oceania"), e("o2", "2026-11-09T10:00:00Z", "oceania"), e("o1", "2026-11-03T10:00:00Z", "oceania"), e("k1", "2026-11-02T10:00:00Z", "sub-saharan-africa")];
  it("picks your region's next events, soonest first, upcoming only", () => {
    expect(pickCommunityEvents(all, "oceania", now).map((t) => t.id)).toEqual(["o1", "o2"]);
  });
  it("falls back to the hub's next events when you have no community", () => {
    expect(pickCommunityEvents(all, null, now, 2).map((t) => t.id)).toEqual(["k1", "o1"]);
  });
  it("keeps only RSVPs to events that are still coming and still published", () => {
    expect(pickGoingEvents(all, new Set(["past", "o2", "gone"]), now).map((t) => t.id)).toEqual(["o2"]);
  });
});
