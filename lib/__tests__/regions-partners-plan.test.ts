import { describe, expect, it } from "vitest";
import { planCommunityLogos, planRegionsAndPartners, toPutBack } from "../../scripts/homepage/regions-and-partners-plan";

const heading = { en: "Regional communities driving global research", es: "Comunidades regionales", fr: "Communautés régionales", ar: "المجتمعات الإقليمية" };
const home = () => [
  { id: "h", blockType: "hero1" },
  { id: "m", blockType: "regionMap", title: { en: "Explore by region" } },
  { id: "g", blockType: "gridRow", title: heading, subtitle: { en: "Seven communities of practice" }, columns: [{}, {}] },
  { id: "l", blockType: "logoCloud1", title: { en: "Who is involved" }, layout: "marquee", organizations: ["o1", "o2", "w"] },
];
const ORGS = { fundedBy: "w", hostedBy: "c" };

describe("the homepage's regions and partners", () => {
  it("replaces the seven-card grid with a Community carousel that keeps its heading in every language", () => {
    const { sections, changes } = planRegionsAndPartners(home(), ORGS);
    expect(sections.map((s) => s.blockType)).toEqual(["hero1", "regionMap", "communityCarousel", "logoCloud1"]);
    expect(sections[2]).toMatchObject({ heading, intro: { en: "Seven communities of practice" }, autoplay: true, speed: "calm" });
    expect(sections[2].id).toBeUndefined();
    expect(changes.length).toBeGreaterThan(0);
  });

  it("turns off the region map's latest-from-each-region strip", () => {
    const { sections } = planRegionsAndPartners(home(), ORGS);
    expect(sections[1]).toMatchObject({ id: "m", showRegionStories: false });
  });

  it("makes the logo strip a grouped wall with Wellcome and Climate Cares on top", () => {
    const { sections } = planRegionsAndPartners(home(), ORGS);
    expect(sections[3]).toMatchObject({ id: "l", layout: "grid", fundedBy: ["w"], hostedBy: ["c"], organizations: ["o1", "o2", "w"] });
  });

  it("says which organisation it couldn't find, and leaves that spot empty", () => {
    const { sections, missing } = planRegionsAndPartners(home(), { fundedBy: "w", hostedBy: null });
    expect(missing).toEqual(["Hosted by: Climate Cares Centre"]);
    expect(sections[3]).toMatchObject({ fundedBy: ["w"], hostedBy: [] });
  });

  it("changes nothing the second time", () => {
    const once = planRegionsAndPartners(home(), ORGS).sections;
    expect(planRegionsAndPartners(once, ORGS).changes).toEqual([]);
  });

  it("leaves other grids alone once the page has a Community carousel", () => {
    const once = planRegionsAndPartners(home(), ORGS).sections;
    const withAnotherGrid = [...once, { id: "g2", blockType: "gridRow", title: { en: "Regional reports" } }];
    const again = planRegionsAndPartners(withAnotherGrid, ORGS);
    expect(again.sections.at(-1)).toMatchObject({ id: "g2", blockType: "gridRow" });
    expect(again.changes).toEqual([]);
  });

  it("finds the regions grid by its place after the map when its heading says something else", () => {
    const sections = home();
    (sections[2] as { title: unknown }).title = { en: "Where we are" };
    expect(planRegionsAndPartners(sections, ORGS).sections[2].blockType).toBe("communityCarousel");
  });
});

describe("community pages' logos", () => {
  it("become a one-line carousel, once", () => {
    const first = planCommunityLogos([{ id: "a", blockType: "communityHeader" }, { id: "l", blockType: "logoCloud1", layout: "marquee" }]);
    expect(first.sections[1]).toMatchObject({ id: "l", layout: "carousel" });
    expect(first.changes).toHaveLength(1);
    expect(planCommunityLogos(first.sections).changes).toEqual([]);
  });
});

describe("putting things back", () => {
  it("only rewrites what the run changed", () => {
    const lang = (rows: Array<Record<string, unknown>>) => ({ en: rows, es: rows, fr: rows, ar: rows });
    const backup = {
      version: 2 as const,
      homepageChanged: true,
      homepage: lang([{ id: "h", blockType: "hero1" }]),
      communities: [
        { id: "a", slug: "oceania", changed: false, sections: lang([]) },
        { id: "b", slug: "sub-saharan-africa", changed: true, sections: lang([{ id: "l", blockType: "logoCloud1", layout: "marquee" }]) },
      ],
    };
    expect(toPutBack(backup)).toEqual({ homepage: backup.homepage, communities: [backup.communities[1]] });
    expect(toPutBack({ ...backup, homepageChanged: false }).homepage).toBeNull();
  });
});

describe("one language at a time", () => {
  it("plans on a single language's sections, keeping empty text empty", () => {
    const fr = [
      { id: "m", blockType: "regionMap", title: "Explorer par région" },
      { id: "g", blockType: "gridRow", title: "Communautés régionales", subtitle: null },
      { id: "l", blockType: "logoCloud1", title: null, description: null, layout: "marquee" },
    ];
    const { sections } = planRegionsAndPartners(fr, ORGS);
    expect(sections[1]).toMatchObject({ blockType: "communityCarousel", heading: "Communautés régionales", intro: null });
    expect(sections[2]).toMatchObject({ title: null, description: null, layout: "grid" });
  });
});
