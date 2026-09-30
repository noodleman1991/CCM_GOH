import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { pageBlocks } from "@/lib/content/internal/payload/blocks";
import { eventsCalendar, peopleWidget, regionMap, atlasEmbed } from "@/payload/blocks";

const one = (row: Record<string, unknown>) => (pageBlocks([row]) ?? [])[0] as Record<string, unknown> | undefined;

describe("built-in automatic sections", () => {
  it("are named and grouped", () => {
    expect([eventsCalendar, peopleWidget, regionMap, atlasEmbed].map((b) => [b.slug, b.labels?.singular, b.admin?.group])).toEqual([
      ["eventsCalendar", "Events calendar", "Content"],
      ["peopleWidget", "People", "Content"],
      ["regionMap", "Region map", "Maps"],
      ["atlasEmbed", "Atlas", "Maps"],
    ]);
  });

  it("maps events calendar with a default upcoming limit", () => {
    expect(one({ id: "e", blockType: "eventsCalendar", title: "Events", description: null, upcomingLimit: null })).toMatchObject({
      _type: "events-calendar",
      title: "Events",
      upcomingLimit: 6,
    });
  });

  it("maps people with an optional region", () => {
    expect(one({ id: "p", blockType: "peopleWidget", title: null, limit: 12, region: "ssa" })).toMatchObject({
      _type: "people-widget",
      limit: 12,
      region: "ssa",
    });
  });

  it("maps the region map", () => {
    expect(one({ id: "r", blockType: "regionMap", title: "Where we work", description: null })).toMatchObject({
      _type: "region-map",
      title: "Where we work",
      description: null,
    });
  });

  it("passes the region map's 'latest from each region' switch — on unless an editor turned it off", () => {
    expect(one({ id: "r", blockType: "regionMap", title: null, description: null })).toMatchObject({ showRegionStories: true });
    expect(one({ id: "r", blockType: "regionMap", title: null, description: null, showRegionStories: false })).toMatchObject({ showRegionStories: false });
  });

  it("drops an atlas whose region isn't one of the seven (the component needs a valid one)", () => {
    expect(one({ id: "a", blockType: "atlasEmbed", region: "xx", showBreakdown: true })).toBeUndefined();
    expect(one({ id: "a2", blockType: "atlasEmbed", region: "lac", showBreakdown: false })).toMatchObject({
      _type: "atlas-embed",
      region: "lac",
      showBreakdown: false,
    });
  });

  it("drops a people region that isn't a valid code (shows everyone instead)", () => {
    expect(one({ id: "p2", blockType: "peopleWidget", region: "nowhere" })).toMatchObject({ region: null });
  });
});
