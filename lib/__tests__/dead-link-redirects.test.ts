import { describe, it, expect } from "vitest";

/**
 * Two URL prefixes were shipped in links, cards and the sitemap without
 * ever having a route: `/<locale>/case-studies/<slug>` (the case-study
 * detail lives under `/research-and-action/`) and
 * `/<locale>/research-and-action/agendas/<slug>` (116 sitemap URLs; agendas
 * have no detail page — Decision 11 of the 2026-09-16 hardening plan).
 * The code no longer emits either, but copies are already in the wild
 * (search engines, shared links), so `next.config.mjs` redirects them
 * permanently.
 *
 * The locale segment is constrained to the four real locales: an
 * unconstrained `/:locale/case-studies/:slug` would also match
 * `/research-and-action/case-studies/<slug>` itself and redirect the live
 * page to `/research-and-action/research-and-action/case-studies/<slug>`.
 */

interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

async function redirects(): Promise<Redirect[]> {
  const mod = (await import("../../next.config.mjs")) as {
    default: { redirects: () => Promise<Redirect[]> };
  };
  return mod.default.redirects();
}

describe("permanent redirects for prefixes that never had a route", () => {
  it("sends /:locale/case-studies/:slug to the research-and-action prefix, for real locale segments only", async () => {
    const entry = (await redirects()).find(
      (r) => r.source.includes("/case-studies/:slug") && !r.source.includes("research-and-action"),
    );
    expect(entry).toEqual({
      source: "/:locale(en|es|fr|ar)/case-studies/:slug",
      destination: "/:locale/research-and-action/case-studies/:slug",
      permanent: true,
    });
  });

  it("sends the dead /research-and-action/agendas prefix, with or without a slug, to the regional-agendas section page", async () => {
    const entry = (await redirects()).find((r) => r.source.includes("/research-and-action/agendas"));
    expect(entry).toEqual({
      source: "/:locale(en|es|fr|ar)/research-and-action/agendas/:slug*",
      destination: "/:locale/research-and-action/regional-agendas",
      permanent: true,
    });
  });

  it("keeps the pre-existing /index redirect", async () => {
    expect(await redirects()).toContainEqual({ source: "/index", destination: "/", permanent: true });
  });
});
