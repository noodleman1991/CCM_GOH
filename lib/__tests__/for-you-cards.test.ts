import { describe, expect, it } from "vitest";
import { forYouCards } from "@/lib/dashboard/for-you-cards";

describe("For you, as cards", () => {
  it("turns followed items into typed cards and skips kinds without a page", () => {
    const cards = forYouCards(
      [
        { id: "c1", type: "caseStudy", title: "Mangroves", slug: "mangroves", match: "region", href: "/research-and-action/case-studies/mangroves" },
        { id: "x1", type: "mystery", title: "?", slug: "q", match: "theme", href: "#" },
      ],
      [],
    );
    expect(cards).toEqual([{ type: "caseStudy", id: "c1", title: "Mangroves", href: "/research-and-action/case-studies/mangroves", image: null }]);
  });
  it("folds your region's news in, once, and keeps the list short", () => {
    const followed = [{ id: "n1", type: "newsPost", title: "Flood response", slug: "flood", match: "region" as const, href: "/news/flood" }];
    const news = [
      { _id: "n1", title: "Flood response", slug: { current: "flood" }, image: null },
      { _id: "n2", title: "New toolkit", slug: { current: "toolkit" }, image: { asset: { url: "https://cdn/x.jpg" } } },
    ];
    const cards = forYouCards(followed, news as never, 6);
    expect(cards.map((c) => c.href)).toEqual(["/news/flood", "/news/toolkit"]);
    expect(cards[1]).toMatchObject({ type: "newsPost", image: "https://cdn/x.jpg" });
    expect(forYouCards(Array.from({ length: 9 }, (_, i) => ({ ...followed[0], id: `n${i}`, href: `/news/${i}` })), [], 6)).toHaveLength(6);
  });
});
