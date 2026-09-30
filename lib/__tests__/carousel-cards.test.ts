import { describe, expect, it } from "vitest";
import { buildCarouselCards, type RawCommunity } from "@/lib/communities/carousel-cards";

const raw = (o: Partial<RawCommunity>): RawCommunity => ({
  slug: "oceania",
  code: "oce",
  name: "Oceania",
  tagline: null,
  members: 0,
  stories: 0,
  upcomingEvents: 0,
  publicFaces: [],
  newestStory: null,
  nextEvent: null,
  newestMember: null,
  ...o,
});

describe("community cards", () => {
  it("are alphabetical in the reader's language", () => {
    const cards = buildCarouselCards([raw({ slug: "b", name: "Oceania" }), raw({ slug: "a", name: "Europe and Northern America" })], "en");
    expect(cards.map((c) => c.slug)).toEqual(["a", "b"]);
  });
  it("show at most five public faces with photos, and count the other members", () => {
    const faces = Array.from({ length: 8 }, (_, i) => ({ name: `P${i}`, image: i === 2 ? null : `/p${i}.jpg` }));
    const [card] = buildCarouselCards([raw({ members: 12, publicFaces: faces })], "en");
    expect(card.faces).toHaveLength(5);
    expect(card.faces.every((f) => f.image)).toBe(true);
    expect(card.moreFaces).toBe(7);
  });
  it("cycle the newest story, the next event and the newest member — only those that exist", () => {
    const [card] = buildCarouselCards(
      [
        raw({
          newestStory: { title: "Reef grief", href: "/lived-experiences/reef" },
          nextEvent: { title: "Coastal circle", startAt: "2026-11-12T10:00:00Z", href: "/events/coastal" },
          newestMember: { firstName: "Amina" },
        }),
      ],
      "en",
    );
    expect(card.latest.map((l) => l.kind)).toEqual(["story", "event", "member"]);
    expect(card.latest[1]).toMatchObject({ title: "Coastal circle", startAt: "2026-11-12T10:00:00Z", href: "/events/coastal" });
    const [quiet] = buildCarouselCards([raw({ newestMember: { firstName: "Amina" } })], "en");
    expect(quiet.latest).toEqual([{ kind: "member", title: "Amina", startAt: null, href: null }]);
  });
  it("still reads as a complete card with nothing yet", () => {
    const [card] = buildCarouselCards([raw({})], "en");
    expect(card).toMatchObject({ members: 0, stories: 0, upcomingEvents: 0, faces: [], moreFaces: 0, latest: [] });
  });
});
