import { describe, expect, it } from "vitest";
import { planCommunitySections } from "@/scripts/communities/plan";

const grid = (contentType: string, mode: string | null, over: Record<string, unknown> = {}) => ({
  id: `g-${contentType}`, blockType: "contentGrid", contentType, mode, maxItems: 4, title: `${contentType} title`, ...over,
});
const page = (en: unknown[], es?: unknown[]) => ({ slug: "oceania", atlasEmbed: { enabled: true, showBreakdown: false }, sections: { en, es: es ?? en } });
const chapterOf = (s: Record<string, unknown>) => (s.chapter as { kind: string } | undefined)?.kind;

describe("planCommunitySections", () => {
  it("builds header, atlas, then each old section in its order, with chapters", () => {
    const p = planCommunitySections(
      page([
        grid("agendas", "manual", { manualItems: [{ blockType: "gridAgenda", agenda: "a1" }] }),
        grid("caseStudies", "dynamic-recent"),
        grid("news", "dynamic-featured"),
        grid("livedExperiences", "dynamic-recent"),
        grid("team", "manual"),
      ]),
      "oce",
    );
    expect(p.sections.map((s) => [s.blockType, chapterOf(s)])).toEqual([
      ["communityHeader", "overview"],
      ["atlasEmbed", undefined],
      ["contentFeed", "agendas"],
      ["contentFeed", "caseStudies"],
      ["contentFeed", "news"],
      ["contentFeed", "voices"],
      ["communityMembers", "members"],
    ]);
    expect(p.sections[1]).toMatchObject({ region: "oce", showBreakdown: false });
  });

  it("carries fill mode, picks, count and layout", () => {
    const p = planCommunitySections(
      page([
        grid("agendas", "manual", { manualItems: [{ blockType: "gridAgenda", agenda: "a1" }] }),
        grid("caseStudies", "dynamic-with-pinned", { manualItems: [{ blockType: "gridCaseStudy", caseStudy: { id: "c9" } }] }),
        grid("news", "dynamic-featured"),
        grid("livedExperiences", "dynamic-recent"),
      ]),
      "oce",
    );
    const [, , ag, cs, nw, le] = p.sections;
    expect(ag).toMatchObject({ kinds: ["agendas"], fill: "picksOnly", sort: "myOrder", picks: [{ relationTo: "agendas", value: "a1" }], count: 4, layout: "grid" });
    expect(cs).toMatchObject({ kinds: ["caseStudies"], fill: "automaticWithPicks", picks: [{ relationTo: "caseStudies", value: "c9" }] });
    expect(nw).toMatchObject({ kinds: ["newsPosts"], fill: "automatic", sort: "featuredFirst" });
    expect(le).toMatchObject({ kinds: ["livedExperiences"], fill: "automatic", sort: "newest", layout: "carousel" });
  });

  it("keeps each language's heading", () => {
    const p = planCommunitySections(page([grid("news", "dynamic-recent", { title: "News" })], [grid("news", "dynamic-recent", { title: "Noticias" })]), "oce");
    expect(p.sections.find((s) => s.blockType === "contentFeed")!.heading).toEqual({ en: "News", es: "Noticias" });
  });

  it("skips the atlas when it was switched off, and testimonials with none picked", () => {
    const p = planCommunitySections({ ...page([grid("testimonials", null)]), atlasEmbed: { enabled: false } }, "oce");
    expect(p.sections.map((s) => s.blockType)).toEqual(["communityHeader"]);
    expect(p.notes).toContain("testimonials were never shown on this page — not added (add a Testimonials section to show them).");
  });

  it("leaves out testimonials, which the old page never showed, and says so", () => {
    const p = planCommunitySections(page([grid("testimonials", null, { manualTestimonials: ["t1"] })]), "oce");
    expect(p.sections.map((x) => x.blockType)).toEqual(["communityHeader", "atlasEmbed"]);
    expect(p.notes).toContain("testimonials were never shown on this page — not added (add a Testimonials section to show them).");
  });

  it("leaves out the welcome and why-join heroes on a region page, where the region header always replaced them", () => {
    const hero = { en: { title: "Welcome", links: [] }, fr: { title: "Bienvenue", links: [] } };
    const p = planCommunitySections({ ...page([]), welcomeHero: hero, whyJoinCTA: hero }, "oce");
    expect(p.sections.map((x) => x.blockType)).toEqual(["communityHeader", "atlasEmbed"]);
    expect(p.notes).toContain("welcomeHero was never shown (the region header replaced it) — not added.");
  });

  it("keeps the heroes on a community with no region, where they were shown", () => {
    const hero = { en: { title: "Welcome", links: [] }, fr: { title: "Bienvenue", links: [] } };
    const p = planCommunitySections({ ...page([]), welcomeHero: hero }, null);
    expect(p.sections.map((x) => x.blockType)).toEqual(["communityHeader", "hero1"]);
    expect(p.sections[1].title).toEqual({ en: "Welcome", fr: "Bienvenue" });
  });

  it("lists every pick so the dry run can check it still exists", () => {
    const p = planCommunitySections(page([grid("agendas", "manual", { manualItems: [{ blockType: "gridAgenda", agenda: "gone" }] })]), "oce");
    expect(p.picks).toEqual([{ kind: "agendas", id: "gone" }]);
  });

  it("skips the atlas for a community with no region", () => {
    const p = planCommunitySections(page([]), null);
    expect(p.sections.map((s) => s.blockType)).toEqual(["communityHeader"]);
  });

  it("turns a hand-picked section with nothing picked into an automatic feed, as the old page fetched automatically", () => {
    const p = planCommunitySections(page([grid("news", "manual", { manualItems: [] })]), "oce");
    expect(p.sections[2]).toMatchObject({ blockType: "contentFeed", kinds: ["newsPosts"], fill: "automatic", sort: "newest", picks: [] });
    expect(p.notes).toContain("news was hand-picked with nothing picked — it fills automatically, as it did before.");
  });
});
