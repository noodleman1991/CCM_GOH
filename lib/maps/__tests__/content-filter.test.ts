import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { qFilter, regionMatchFilter, statusFilter, themeFilter } from "../content-filter";

describe("content-filter fragments (atlas trust contract)", () => {
  it("gates caseStudy/researchOutput to approved-only", () => {
    expect(statusFilter("caseStudy")).toBe(' && status == "approved"');
    expect(statusFilter("researchOutput")).toBe(' && status == "approved"');
  });

  it("admits legacy status-less livedExperience docs", () => {
    expect(statusFilter("livedExperience")).toBe(' && (status == "approved" || !defined(status))');
  });

  it("leaves workflow-less types ungated", () => {
    expect(statusFilter("newsPost")).toBe("");
    expect(statusFilter("agenda")).toBe("");
    expect(statusFilter("report")).toBe("");
  });

  it("theme/q fragments bind params and vanish when unset", () => {
    expect(themeFilter("food-water")).toContain("$themeSlug");
    expect(themeFilter(null)).toBe("");
    expect(themeFilter("")).toBe("");
    expect(qFilter("mangrove")).toContain("$q");
    expect(qFilter("")).toBe("");
    // values are never interpolated into the fragment itself
    expect(themeFilter("food-water")).not.toContain("food-water");
    expect(qFilter("mangrove")).not.toContain("mangrove");
  });

  it("region match covers short code + singular + plural community refs", () => {
    const f = regionMatchFilter();
    expect(f).toContain("region == $region");
    expect(f).toContain("relatedCommunity->slug.current == $slug");
    expect(f).toContain("$slug in relatedCommunities[]->slug.current");
  });
});

describe("map routes compose ONLY the shared fragments (no inline drift)", () => {
  const routes = ["region-data", "region-items", "region-pins"].map((name) =>
    join(process.cwd(), "app", "api", "maps", name, "route.ts")
  );

  for (const route of routes) {
    const src = readFileSync(route, "utf8");
    const name = route.split("/").slice(-2)[0];

    it(`${name} imports lib/maps/content-filter`, () => {
      expect(src).toContain('from "@/lib/maps/content-filter"');
    });

    it(`${name} has no inline status/theme/q/region predicate literals`, () => {
      // Any of these literals appearing in a route means someone re-inlined a
      // predicate instead of extending lib/maps/content-filter — the exact
      // drift that breaks counts = cards = pins.
      expect(src).not.toMatch(/status == "approved"/);
      expect(src).not.toMatch(/\$themeSlug in tags\[\]->value\.current/);
      expect(src).not.toMatch(/match \$q \+ "\*"/);
      expect(src).not.toMatch(/region == \$region \|\|/);
    });
  }
});
