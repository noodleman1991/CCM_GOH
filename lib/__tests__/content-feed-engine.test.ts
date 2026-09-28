import { describe, expect, it } from "vitest";
import { normalizeFeedSettings, kindsToQuery, sortCards, mergeFeed, viewAllLink } from "@/lib/content/feeds/engine";
import type { FeedCard } from "@/lib/content/feeds/types";

const NOW = new Date("2026-09-28T12:00:00Z");
const c = (kind: FeedCard["kind"], id: string, over: Partial<FeedCard> = {}): FeedCard => ({
  key: `${kind}:${id}`,
  kind,
  featured: false,
  date: "2026-09-01T00:00:00Z",
  startAt: null,
  card: { type: "caseStudy", id, title: id, href: `/x/${id}` },
  ...over,
});
const base = normalizeFeedSettings({ kinds: ["caseStudies"] });

describe("normalizeFeedSettings", () => {
  it("fills safe defaults", () => {
    expect(base).toMatchObject({ fill: "automatic", sort: "newest", count: 6, layout: "grid", viewAll: { show: true } });
  });

  it("clamps count to 1–24 and drops unknown kinds and region codes", () => {
    const s = normalizeFeedSettings({ kinds: ["caseStudies", "nope"], count: 99, filters: { regions: ["ssa", "atlantis"] } });
    expect(s.kinds).toEqual(["caseStudies"]);
    expect(s.count).toBe(24);
    expect(s.filters.regions).toEqual(["ssa"]);
    expect(normalizeFeedSettings({ count: 0 }).count).toBe(1);
  });

  it("defaults kinds to case studies when none are valid", () => {
    expect(normalizeFeedSettings({ kinds: [] }).kinds).toEqual(["caseStudies"]);
    expect(normalizeFeedSettings(null).kinds).toEqual(["caseStudies"]);
  });

  it("drops malformed picks", () => {
    const s = normalizeFeedSettings({ picks: [{ kind: "newsPosts", id: "1" }, { kind: "bogus", id: "2" }, { kind: "events" }, null] });
    expect(s.picks).toEqual([{ kind: "newsPosts", id: "1" }]);
  });
});

describe("kindsToQuery", () => {
  it("excludes events when 'featured only' is on (events have no featured flag)", () => {
    expect(kindsToQuery(normalizeFeedSettings({ kinds: ["events", "newsPosts"], filters: { featuredOnly: true } }))).toEqual(["newsPosts"]);
  });

  it("keeps every kind otherwise", () => {
    expect(kindsToQuery(normalizeFeedSettings({ kinds: ["events", "newsPosts"] }))).toEqual(["events", "newsPosts"]);
  });
});

describe("sortCards", () => {
  const a = c("newsPosts", "a", { date: "2026-09-10T00:00:00Z" });
  const b = c("newsPosts", "b", { date: "2026-09-20T00:00:00Z", featured: true });
  const e = c("events", "e", { date: null, startAt: "2026-10-01T00:00:00Z" });
  const past = c("events", "p", { date: null, startAt: "2026-09-01T00:00:00Z" });

  it("newest first, events by start date", () => {
    expect(sortCards([a, b, e], "newest", NOW).map((x) => x.key)).toEqual(["events:e", "newsPosts:b", "newsPosts:a"]);
  });

  it("featured first, then newest", () => {
    expect(sortCards([e, a, b], "featuredFirst", NOW).map((x) => x.key)).toEqual(["newsPosts:b", "events:e", "newsPosts:a"]);
  });

  it("soonest upcoming events first, then the rest newest first", () => {
    expect(sortCards([a, past, b, e], "upcomingSoonest", NOW).map((x) => x.key)).toEqual(["events:e", "newsPosts:b", "newsPosts:a", "events:p"]);
  });

  it("puts undated items last under newest", () => {
    const undated = c("agendas", "u", { date: null });
    expect(sortCards([undated, a], "newest", NOW).map((x) => x.key)).toEqual(["newsPosts:a", "agendas:u"]);
  });
});

describe("mergeFeed", () => {
  const auto = [c("caseStudies", "1", { date: "2026-09-03T00:00:00Z" }), c("caseStudies", "2", { date: "2026-09-02T00:00:00Z" }), c("caseStudies", "3")];
  const picked = new Map([
    ["caseStudies:2", c("caseStudies", "2")],
    ["newsPosts:9", c("newsPosts", "9")],
  ]);
  const settingsWith = (over: object) => normalizeFeedSettings({ kinds: ["caseStudies", "newsPosts"], count: 3, ...over });

  it("automatic ignores picks", () => {
    const r = mergeFeed({ settings: settingsWith({ fill: "automatic", picks: [{ kind: "newsPosts", id: "9" }] }), pickedCards: picked, automatic: auto, now: NOW });
    expect(r.items.map((i) => i.id)).toEqual(["1", "2", "3"]);
  });

  it("automatic with picks puts picks first and never repeats an item", () => {
    const r = mergeFeed({
      settings: settingsWith({ fill: "automaticWithPicks", picks: [{ kind: "newsPosts", id: "9" }, { kind: "caseStudies", id: "2" }] }),
      pickedCards: picked,
      automatic: auto,
      now: NOW,
    });
    expect(r.items.map((i) => i.id)).toEqual(["9", "2", "1"]);
  });

  it("only picks keeps the editor's order with 'my order'", () => {
    const r = mergeFeed({
      settings: settingsWith({ fill: "picksOnly", sort: "myOrder", picks: [{ kind: "caseStudies", id: "2" }, { kind: "newsPosts", id: "9" }] }),
      pickedCards: picked,
      automatic: [],
      now: NOW,
    });
    expect(r.items.map((i) => i.id)).toEqual(["2", "9"]);
  });

  it("skips picks that are unpublished or deleted, and reports them", () => {
    const r = mergeFeed({
      settings: settingsWith({ fill: "picksOnly", picks: [{ kind: "caseStudies", id: "gone" }, { kind: "newsPosts", id: "9" }] }),
      pickedCards: picked,
      automatic: [],
      now: NOW,
    });
    expect(r.items.map((i) => i.id)).toEqual(["9"]);
    expect(r.skipped).toEqual([{ pick: { kind: "caseStudies", id: "gone" }, reason: "unpublished" }]);
  });

  it("an empty result is an empty list", () => {
    expect(mergeFeed({ settings: settingsWith({ fill: "picksOnly", picks: [] }), pickedCards: new Map(), automatic: [], now: NOW }).items).toEqual([]);
  });
});

describe("viewAllLink", () => {
  it("links to the kind's listing when exactly one kind is shown", () => {
    expect(viewAllLink(normalizeFeedSettings({ kinds: ["newsPosts"] }), "fr")).toEqual({ href: "/fr/news", labelKey: "viewAll.newsPosts", label: null });
  });

  it("needs both an editor link and label for a mixed feed", () => {
    expect(viewAllLink(normalizeFeedSettings({ kinds: ["newsPosts", "events"] }), "en")).toBeNull();
    expect(
      viewAllLink(normalizeFeedSettings({ kinds: ["newsPosts", "events"], viewAll: { show: true, href: "/en/atlas", label: "See all" } }), "en"),
    ).toEqual({ href: "/en/atlas", labelKey: null, label: "See all" });
  });

  it("respects 'show a View all link' off", () => {
    expect(viewAllLink(normalizeFeedSettings({ kinds: ["newsPosts"], viewAll: { show: false } }), "en")).toBeNull();
  });

  it("refuses an editor link to another site", () => {
    expect(
      viewAllLink(normalizeFeedSettings({ kinds: ["newsPosts", "events"], viewAll: { href: "javascript:alert(1)", label: "x" } }), "en"),
    ).toBeNull();
  });
});
