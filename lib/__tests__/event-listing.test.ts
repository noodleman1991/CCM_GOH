import { describe, expect, it } from "vitest";
import { groupByMonth, isUpcoming, toEventTile } from "@/lib/events/listing";

const ev = (o: Record<string, unknown> = {}) =>
  ({
    _id: "e1", title: "Reef day", description: null, scope: "community", startAt: "2026-11-02T10:00:00.000Z", endAt: null,
    mode: "in_person", locationName: "Suva", url: null, linkedProject: null, slug: "reef-day", origin: "ccm", organiserName: null, organiser: null, place: null, recordingUrl: null, coverImage: null,
    ...o,
  }) as never;

describe("an event card", () => {
  it("opens the hub page for CCM events", () => {
    expect(toEventTile(ev())).toMatchObject({ href: "/events/reef-day", external: false, place: "Suva" });
  });
  it("opens the organiser's site for outside events, naming the organiser", () => {
    expect(toEventTile(ev({ origin: "external", url: "https://reef.example", organiserName: "Reef Trust" }))).toMatchObject({
      href: "https://reef.example", external: true, organiser: "Reef Trust",
    });
  });
  it("prefers the hub organisation's name over the typed one", () => {
    expect(toEventTile(ev({ origin: "external", url: "https://r.example", organiser: { name: "Pacific Climate Network" }, organiserName: "PCN" }))?.organiser).toBe("Pacific Climate Network");
  });
  it("falls back to the hub page when an outside event has no website", () => {
    expect(toEventTile(ev({ origin: "external", url: null }))).toMatchObject({ href: "/events/reef-day", external: false });
  });
  it("uses the place's text, says nothing for online events, and skips undated ones", () => {
    expect(toEventTile(ev({ place: { text: "Suva, Fiji" } }))?.place).toBe("Suva, Fiji");
    expect(toEventTile(ev({ mode: "online" }))?.place).toBeNull();
    expect(toEventTile(ev({ startAt: null }))).toBeNull();
  });
});

describe("upcoming", () => {
  const now = new Date("2026-11-02T12:00:00.000Z");
  it("includes an event that started but hasn't ended", () => {
    expect(isUpcoming({ startAt: "2026-11-02T10:00:00.000Z", endAt: "2026-11-02T16:00:00.000Z" }, now)).toBe(true);
  });
  it("excludes one that is over", () => {
    expect(isUpcoming({ startAt: "2026-11-02T10:00:00.000Z", endAt: null }, now)).toBe(false);
  });
});

describe("months", () => {
  it("group by the visitor's time zone", () => {
    const groups = groupByMonth([{ startAt: "2026-02-01T00:30:00.000Z" }, { startAt: "2026-02-10T12:00:00.000Z" }], "en", "America/New_York");
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([["January 2026", 1], ["February 2026", 1]]);
  });
});
