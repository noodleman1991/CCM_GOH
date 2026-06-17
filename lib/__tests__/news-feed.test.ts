import { describe, it, expect } from "vitest";
import { mergeNewsFeed } from "../news-feed";

describe("mergeNewsFeed", () => {
  it("interleaves site + external, newest first", () => {
    const site = [
      { _id: "s1", publishedAt: "2026-01-10" },
      { _id: "s2", publishedAt: "2026-03-01" },
    ];
    const external = [{ _id: "e1", publishedAt: "2026-02-01" }];
    const feed = mergeNewsFeed(site, external);
    expect(feed.map((f) => f.id)).toEqual(["s2", "e1", "s1"]); // Mar, Feb, Jan
    expect(feed.map((f) => f.kind)).toEqual(["site", "external", "site"]);
  });

  it("handles empty / missing inputs", () => {
    expect(mergeNewsFeed(null, null)).toEqual([]);
    expect(mergeNewsFeed([{ _id: "s1", publishedAt: "2026-01-01" }], undefined).map((f) => f.id)).toEqual(["s1"]);
  });

  it("treats unparseable dates as oldest (0)", () => {
    const feed = mergeNewsFeed(
      [{ _id: "good", publishedAt: "2026-01-01" }, { _id: "bad", publishedAt: null }],
      []
    );
    expect(feed[0].id).toBe("good");
    expect(feed[1].id).toBe("bad");
  });
});
