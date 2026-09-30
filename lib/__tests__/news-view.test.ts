import { describe, expect, it } from "vitest";
import { newsView } from "@/lib/news/view";
import { EMPTY_FILTERS } from "@/lib/filters/core";

describe("what the news page shows", () => {
  it("shows featured and the latest when nothing is chosen", () => {
    expect(newsView(EMPTY_FILTERS, 0)).toBe("latest");
  });
  it("shows the matches when a filter or search finds some", () => {
    expect(newsView({ ...EMPTY_FILTERS, q: "flood" }, 3)).toBe("results");
  });
  it("never leaves the page empty: no matches → say so, then featured and the latest", () => {
    expect(newsView({ ...EMPTY_FILTERS, q: "zzqx" }, 0)).toBe("noMatchesThenLatest");
    expect(newsView({ ...EMPTY_FILTERS, when: "past-year" }, 0)).toBe("noMatchesThenLatest");
  });
});
