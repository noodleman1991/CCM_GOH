import { describe, expect, it } from "vitest";
import { planHomepageSections, planSection, type Difference } from "@/scripts/homepage/plan";
import { hero1, splitRow } from "@/payload/blocks";

const loc = (en: string, rest: Record<string, string> = {}) => ({ en, ...rest });
const slots = {
  heroWelcome: {
    title: loc("Welcome", { es: "Bienvenida" }),
    links: {
      en: [{ id: "l1", title: "Join", href: "/join", buttonVariant: { size: "lg" } }],
      es: [{ id: "l2", title: "Únete", href: "/join", buttonVariant: { size: "default" } }],
    },
    padding: { top: true },
  },
  globalAgenda: {
    splitColumns: {
      en: [{ blockType: "splitContent", id: "c", title: "Agenda", body: null }],
      es: [{ blockType: "splitContent", id: "c2", title: "Agenda ES", body: null }],
    },
  },
  howToUse: { splitColumns: { en: [] } },
  agendasModule: { title: loc("Research agendas"), mode: "dynamic-featured", maxItems: 4 },
  livedExperiences: { title: loc("Stories"), testimonial: { en: [] } },
  regionalCommunities: { title: loc("Regions"), columns: { en: [] } },
  collaboration: { splitColumns: { en: [] } },
  news: { title: loc("Latest news"), maxItems: null },
  projectInfo: { splitColumns: { en: [] } },
  mentalHealthDefinition: { title: loc("Mental health") },
  partnerLogos: { title: loc("Who is involved"), layout: "marquee", images: { en: [] } },
};
const plan = () => planHomepageSections({ global: slots, organizationIds: ["o1", "o2"], freshHeading: loc("Fresh on the hub", { fr: "Du nouveau" }) });

describe("planHomepageSections", () => {
  it("builds the agreed fourteen sections in order", () => {
    expect(plan().sections.map((s) => s.blockType)).toEqual([
      "hero1", "contentFeed", "splitRow", "splitRow", "contentFeed", "contentFeed", "submitStoryBanner", "regionMap",
      "gridRow", "splitRow", "contentFeed", "splitRow", "cta1", "logoCloud1",
    ]);
  });

  it("keeps each language's text, including inside row lists", () => {
    const p = plan();
    const hero = p.sections[0];
    expect(hero.title).toEqual({ en: "Welcome", es: "Bienvenida" });
    expect((hero.links as Array<{ title: unknown }>)[0].title).toEqual({ en: "Join", es: "Únete" });
    const agenda = p.sections[2];
    expect((agenda.splitColumns as Array<{ title: unknown }>)[0].title).toEqual({ en: "Agenda", es: "Agenda ES" });
  });

  it("reports non-text values that differed between languages (English kept)", () => {
    const p = plan();
    expect((p.sections[0].links as Array<{ buttonVariant: { size: string } }>)[0].buttonVariant.size).toBe("lg");
    expect(p.differences).toContainEqual({ section: "heroWelcome", path: "links[0].buttonVariant.size", values: { en: "lg", es: "default" } });
  });

  it("never copies row ids across", () => {
    expect(JSON.stringify(plan().sections)).not.toMatch(/"id":"(l1|l2|c|c2)"/);
  });

  it("carries the feeds' counts, order and headings", () => {
    const s = plan().sections;
    expect(s[1]).toMatchObject({
      kinds: ["caseStudies", "newsPosts", "livedExperiences", "researchOutputs"],
      fill: "automatic", count: 5, layout: "grid", heading: { en: "Fresh on the hub", fr: "Du nouveau" },
    });
    expect(s[4]).toMatchObject({ kinds: ["agendas"], count: 4, sort: "featuredFirst", layout: "grid", heading: { en: "Research agendas" } });
    expect(s[5]).toMatchObject({ kinds: ["livedExperiences"], count: 8, layout: "carousel", heading: { en: "Stories" } });
    expect(s[10]).toMatchObject({ kinds: ["newsPosts"], count: 3, sort: "newest", layout: "grid", heading: { en: "Latest news" } });
  });

  it("keeps hand-picked testimonials as a Testimonials section", () => {
    const p = planHomepageSections({
      global: { ...slots, livedExperiences: { title: loc("Stories"), testimonial: ["t1"] } },
      organizationIds: [],
      freshHeading: loc("x"),
    });
    expect(p.sections[5].blockType).toBe("carousel2");
  });

  it("adds the region map heading in four languages and leaves the banner on its defaults", () => {
    const p = plan();
    expect(p.sections[7]).toMatchObject({
      blockType: "regionMap",
      title: { en: "Explore by region", es: "Explorar por región", fr: "Explorer par région", ar: "استكشف حسب المنطقة" },
    });
    expect(p.sections[6]).toEqual({ blockType: "submitStoryBanner" });
  });

  it("points the logo strip at the partner organisations, in order", () => {
    expect(plan().sections[13]).toMatchObject({ blockType: "logoCloud1", organizations: ["o1", "o2"], images: [], layout: "marquee", title: { en: "Who is involved" } });
  });

  it("skips a slot that is empty, and says so", () => {
    const p = planHomepageSections({ global: { ...slots, projectInfo: null }, organizationIds: [], freshHeading: loc("x") });
    expect(p.sections).toHaveLength(13);
    expect(p.notes).toContain("projectInfo was empty — no section added.");
  });
});

describe("planSection", () => {
  it("uses English rows when languages have different row counts, and reports it", () => {
    const diffs: Difference[] = [];
    const row = planSection(hero1, { links: { en: [{ title: "A" }, { title: "B" }], fr: [{ title: "A fr" }] } }, "heroWelcome", diffs);
    expect((row.links as unknown[]).length).toBe(2);
    expect(diffs).toContainEqual(expect.objectContaining({ path: "links", section: "heroWelcome" }));
  });

  it("recurses into nested section lists by their own definitions", () => {
    const row = planSection(splitRow, { splitColumns: { en: [{ blockType: "splitImage", id: "x", image: { asset: "m1", alt: { en: "Pic" } } }] } }, "s", []);
    expect((row.splitColumns as Array<Record<string, unknown>>)[0]).toMatchObject({ blockType: "splitImage", image: { asset: "m1", alt: { en: "Pic" } } });
  });
});
