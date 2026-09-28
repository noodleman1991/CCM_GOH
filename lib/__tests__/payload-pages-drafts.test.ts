import { describe, expect, it } from "vitest";
import type { Access, Field } from "payload";
import config from "@payload-config";
import { publishedOnly } from "@/payload/access";

const NEW_SECTIONS = [
  "hero2",
  "faqs",
  "timelineRow",
  "carousel1",
  "submitStoryBanner",
  "formNewsletter",
  "eventsCalendar",
  "peopleWidget",
  "regionMap",
  "atlasEmbed",
  "contentFeed",
];

const anonymous = { req: { user: null } } as unknown as Parameters<Access>[0];

describe("pages and the homepage keep drafts private", async () => {
  const c = await config;
  const pages = c.collections.find((x) => x.slug === "pages")!;
  const homepage = c.globals.find((g) => g.slug === "homepage")!;

  it("pages and the homepage have drafts", () => {
    expect(pages.versions).toMatchObject({ drafts: expect.anything() });
    expect(homepage.versions).toMatchObject({ drafts: expect.anything() });
  });

  it("visitors can only read published pages and the published homepage", () => {
    expect(pages.access.read).toBe(publishedOnly);
    expect(homepage.access.read).toBe(publishedOnly);
    expect(publishedOnly(anonymous)).toEqual({ _status: { equals: "published" } });
  });

  it("offers every new section on pages, after the existing ones", () => {
    const blocksField = pages.fields.find((f: Field) => "name" in f && f.name === "blocks") as { blocks: Array<{ slug: string }> };
    const slugs = blocksField.blocks.map((b) => b.slug);
    expect(slugs.slice(0, 7)).toEqual(["hero1", "sectionHeader", "splitRow", "gridRow", "carousel2", "cta1", "logoCloud1"]);
    expect(slugs).toEqual(expect.arrayContaining(NEW_SECTIONS));
  });
});
