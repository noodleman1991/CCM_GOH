import { describe, expect, it } from "vitest";
import config from "@payload-config";

describe("admin menu groups", () => {
  it("uses the four plain groups (plus Media)", async () => {
    const c = await config;
    const groups = new Set([...c.collections, ...(c.globals ?? [])].map((x) => x.admin?.group).filter((g): g is string => typeof g === "string"));
    expect([...groups].sort()).toEqual(["Hub content", "Media", "People & organisations", "Settings", "Site pages"]);
  });
});

describe("admin menu order", () => {
  it("lists groups and entries by how often editors need them", async () => {
    const c = await config;
    const staff = { user: { role: "team_editor" } };
    const hidden = (x: (typeof c.collections)[number]) => {
      const h = x.admin?.hidden as unknown;
      return typeof h === "function" ? Boolean((h as (a: typeof staff) => unknown)(staff)) : h === true;
    };
    const visible = c.collections.filter((x) => !hidden(x));
    const groups = [...new Set(visible.map((x) => x.admin?.group).filter((g): g is string => typeof g === "string"))];
    expect(groups).toEqual(["Site pages", "Hub content", "People & organisations", "Media", "Settings"]);
    const hub = visible.filter((x) => x.admin?.group === "Hub content").map((x) => x.slug);
    expect(hub).toEqual(["newsPosts", "events", "caseStudies", "livedExperiences", "testimonials", "researchOutputs", "agendas", "externalSources"]);
    const site = visible.filter((x) => x.admin?.group === "Site pages").map((x) => x.slug);
    expect(site).toEqual(["pages", "regionalCommunities", "docsChapters"]);
  });
  it("calls testimonials what they are: short quotes", async () => {
    const t = (await config).collections.find((x) => x.slug === "testimonials")!;
    expect(t.labels).toMatchObject({ singular: "Quote", plural: "Quotes" });
  });
});
