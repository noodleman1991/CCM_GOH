import { describe, expect, it } from "vitest";
import { planEventSections, withoutEventSections } from "@/scripts/events/plan";

describe("the events sections", () => {
  it("appends the Events chapter to a community page once", () => {
    const first = planEventSections([{ blockType: "communityHeader" }], "community");
    expect(first.changed).toBe(true);
    expect(first.sections.at(-1)).toMatchObject({ kinds: ["events"], chapter: { kind: "events" }, count: 6, filters: { upcomingOnly: true }, sort: "upcomingSoonest" });
    expect(planEventSections(first.sections, "community")).toMatchObject({ changed: false, reason: "already has an events feed" });
  });

  it("goes after News and before Voices, Members and Partners", () => {
    const out = planEventSections(
      [{ blockType: "a", chapter: { kind: "news" } }, { blockType: "b" }, { blockType: "c", chapter: { kind: "voices" } }, { blockType: "d", chapter: { kind: "partners" } }],
      "community",
    );
    expect(out.sections.map((s) => s.blockType)).toEqual(["a", "b", "contentFeed", "c", "d"]);
  });

  it("puts Coming up second on the homepage, in the page's language", () => {
    const out = planEventSections([{ blockType: "hero" }, { blockType: "contentFeed", kinds: ["newsPosts"] }], "homepage");
    expect(out.sections[1]).toMatchObject({ kinds: ["events"], count: 3, heading: "Coming up" });
    expect(out.sections[1]).not.toHaveProperty("chapter");
    expect(planEventSections([{ blockType: "hero" }], "homepage", { locale: "ar" }).sections[1]).toMatchObject({ heading: "قريبًا" });
  });

  it("with replace, swaps an existing events feed for the standard one", () => {
    const out = planEventSections([{ blockType: "hero" }, { blockType: "contentFeed", kinds: ["events"], count: 9 }], "homepage", { replace: true });
    expect(out.sections.filter((s) => s.blockType === "contentFeed")).toEqual([expect.objectContaining({ count: 3 })]);
  });

  it("taking them away removes only the feeds it adds", () => {
    const added = planEventSections([{ blockType: "hero" }, { blockType: "contentFeed", kinds: ["events", "newsPosts"] }], "homepage", { replace: false });
    expect(added.changed).toBe(false); // a mixed feed already shows events
    const page = [{ blockType: "hero" }, { blockType: "contentFeed", kinds: ["events"], heading: "Coming up" }, { blockType: "contentFeed", kinds: ["events"], heading: "Our picks" }];
    expect(withoutEventSections(page, "homepage", "en").sections.map((s) => s.heading ?? s.blockType)).toEqual(["hero", "Our picks"]);
  });
});
