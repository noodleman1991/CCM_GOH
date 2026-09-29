import { describe, expect, it } from "vitest";
import type { Field } from "payload";
import config from "@payload-config";
import { communityRead } from "@/payload/access";
import { COMMUNITY_SECTIONS } from "@/payload/collections/regional-communities";
import { readdirSync, readFileSync } from "node:fs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function named(fields: Field[], name: string): Record<string, any> | undefined {
  for (const f of fields) {
    if ("name" in f && f.name === name) return f as never;
    if ((f.type === "collapsible" || f.type === "row") && "fields" in f) {
      const inner = named(f.fields, name);
      if (inner) return inner;
    }
  }
  return undefined;
}

describe("one record per community", async () => {
  const c = await config;
  const rc = c.collections.find((x) => x.slug === "regionalCommunities")!;
  const pages = c.collections.find((x) => x.slug === "regionalCommunityPages")!;

  it("holds the page: sections, metadata, drafts, preview", async () => {
    expect(named(rc.fields, "sections")?.type).toBe("blocks");
    expect(named(rc.fields, "sectionsByLanguage")).toMatchObject({ localized: true });
    // Nothing required: an empty list saves (Payload's own default validator only).
    expect(await named(rc.fields, "sections")!.validate([], { req: { context: {}, t: (k: string) => k }, required: false })).toBe(true);
    for (const f of ["meta_title", "meta_description", "noindex", "ogImage"]) expect(named(rc.fields, f), f).toBeTruthy();
    expect(rc.versions).toMatchObject({ drafts: expect.anything() });
    expect(rc.access.read).toBe(communityRead);
    expect(rc.admin.livePreview?.breakpoints?.map((b) => b.width)).toEqual([375, 768, 1280]);
    expect(rc.admin.group).toBe("Site pages");
  });

  it("previews the community's page in the language being edited", async () => {
    const url = await (rc.admin.livePreview!.url as (a: unknown) => Promise<string>)({
      data: { slug: "oceania" },
      locale: { code: "fr" },
      req: { headers: new Headers({ host: "hub.test", "x-forwarded-proto": "https" }) },
    });
    expect(url).toBe("https://hub.test/api/preview?path=%2Ffr%2Fcommunities%2Foceania");
  });

  it("keeps the details it had, folded into 'Details'", () => {
    const details = rc.fields.find((f) => f.type === "collapsible" && "label" in f && f.label === "Details") as { fields: Field[] } | undefined;
    expect(details).toBeTruthy();
    for (const f of ["name", "region", "coverImage", "members", "contact", "featured", "active"]) expect(named(details!.fields, f), f).toBeTruthy();
  });

  it("keeps the old Community pages as a hidden backup", () => {
    // Hidden from everyone — wrapped so community leads are hidden too (editor-experience spec §3.5).
    const hidden = pages.admin.hidden as (a: { user: unknown }) => boolean;
    expect(hidden({ user: { role: "team_editor" } })).toBe(true);
    expect(hidden({ user: { role: "community_editor" } })).toBe(true);
  });

  it("offers the whole library plus the community sections, each with a page-menu setting", () => {
    const slugs = COMMUNITY_SECTIONS.map((b) => b.slug);
    expect(slugs[0]).toBe("communityHeader");
    expect(slugs).toEqual(expect.arrayContaining(["communityMembers", "contentFeed", "atlasEmbed", "logoCloud1"]));
    expect(COMMUNITY_SECTIONS.every((b) => named(b.fields, "chapter"))).toBe(true);
  });

  it("the migration marks every existing community published", () => {
    const file = readdirSync("migrations").find((f) => f.endsWith("_community_records_with_pages.ts"));
    expect(file).toBeTruthy();
    expect(readFileSync(`migrations/${file}`, "utf8")).toMatch(/UPDATE "regional_communities" SET "_status" = 'published'/);
  });
});
