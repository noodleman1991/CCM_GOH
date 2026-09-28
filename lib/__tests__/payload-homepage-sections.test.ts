import { describe, expect, it } from "vitest";
import type { Field } from "payload";
import config from "@payload-config";
import { HOMEPAGE_SECTIONS } from "@/payload/globals/homepage";
import { logoCloud1, contentFeed } from "@/payload/blocks";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const named = (fields: Field[], name: string) => fields.find((f) => "name" in f && f.name === name) as Record<string, any> | undefined;

const SLOTS = ["heroWelcome", "globalAgenda", "howToUse", "agendasModule", "livedExperiences", "regionalCommunities", "collaboration", "news", "projectInfo", "mentalHealthDefinition", "partnerLogos"];

describe("homepage on sections", async () => {
  const c = await config;
  const homepage = c.globals.find((g) => g.slug === "homepage")!;

  it("has the shared list, the per-language list and the switch", () => {
    expect(named(homepage.fields, "layoutPerLanguage")?.type).toBe("checkbox");
    expect(named(homepage.fields, "sections")?.type).toBe("blocks");
    expect(named(homepage.fields, "sectionsByLanguage")).toMatchObject({ type: "blocks", localized: true });
  });

  it("requires a hero, either kind", () => {
    const validate = named(homepage.fields, "sections")!.validate as (v: unknown) => true | string;
    expect(validate([{ blockType: "faqs" }])).toBe("This page always keeps its Hero. You can move it, but not remove it.");
    expect(validate([{ blockType: "hero2" }])).toBe(true);
  });

  it("offers the whole library except the old content section", () => {
    const slugs = HOMEPAGE_SECTIONS.map((b) => b.slug);
    expect(slugs).toEqual(expect.arrayContaining(["hero1", "hero2", "contentFeed", "logoCloud1", "regionMap", "submitStoryBanner"]));
    expect(slugs).not.toContain("contentGrid");
  });

  it("hides the eleven old slots, keeping their data", () => {
    for (const slot of SLOTS) expect(named(homepage.fields, slot)?.admin?.hidden, slot).toBe(true);
  });

  it("organisations can be hidden from the site, shown by default", () => {
    const orgs = c.collections.find((x) => x.slug === "organizations")!;
    expect(named(orgs.fields, "showOnSite")).toMatchObject({ type: "checkbox", defaultValue: true, label: "Show this organisation on the site" });
  });

  it("the logo strip can list organisations, and a feed can filter by one", () => {
    expect(named(logoCloud1.fields, "organizations")).toMatchObject({ type: "relationship", relationTo: "organizations", hasMany: true, label: "Partner organisations" });
    const filters = named(contentFeed.fields, "filters")!;
    expect(named(filters.fields, "organizations")).toMatchObject({ type: "relationship", relationTo: "organizations", hasMany: true });
  });
});
