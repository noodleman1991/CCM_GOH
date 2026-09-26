import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
}));

import * as feeds from "@/lib/content/pages/feeds";
import * as home from "@/lib/content/pages/homepage";
import * as page from "@/lib/content/pages/page";
import * as rc from "@/lib/content/pages/regional-community";

/**
 * Task 14a split `lib/content/pages.ts` — 8,550 lines — into a barrel plus one
 * module per document type, and restored the block projections its four big
 * queries carried expanded inline as the `sanity/queries/**` fragments they
 * came from. That split was required to be **behaviour-neutral**, and the only
 * behaviour a query constant has is the string it evaluates to.
 *
 * So every GROQ string in the domain is pinned here by SHA-256, taken from the
 * pre-split file at `c3a3489ef` and verified constant-by-constant against a
 * literal copy of it before that copy was deleted. All twenty matched.
 *
 * These are the Sanity-arm queries. Tasks 14b–14d add a Payload arm beside
 * them behind `CONTENT_BACKEND`; they do not rewrite these, and the Sanity arm
 * stays the fallback and the oracle until Phase 4. So a failure here means a
 * projection changed — either a fragment was edited, or a query stopped
 * interpolating the fragment it used to. Read the diff before updating a hash:
 * changing the GROQ changes what the live site renders.
 */
const PINNED: Record<string, [string, string]> = {
  // Re-pinned by Task 13's fix round 1, same reason as HOMEPAGE_QUERY /
  // INDEX_HOMEPAGE_QUERY below: both interpolate the shared block projections
  // (GRID_CASE_STUDY_PROJECTION -> CASE_STUDY_CARD_FIELDS), which gained
  // `category` on `tags[]->`.
  PAGE_QUERY: [page.PAGE_QUERY, "a5d115345e8b3641f553d105dba05ee97b52d1ce67bc042a9a1e57c3df49e8ff"],
  PAGE_SLUGS_QUERY: [page.PAGE_SLUGS_QUERY, "a9b41f4d33a4c0cb82d1a99f7db1592db25d2d5ff1d7d6bf6f643cac282d408f"],
  PAGE_TRANSLATIONS_QUERY: [page.PAGE_TRANSLATIONS_QUERY, "304053cd071ed5a52fcd4107ab60c6aade536a875867a630c0e99945f3cfedf3"],
  REGIONAL_COMMUNITY_PAGE_QUERY: [rc.REGIONAL_COMMUNITY_PAGE_QUERY, "f068d2ea789d9732f90de1d162730d2d8be9e6dde7f35595626ef463ea20032b"],
  RC_PAGE_SLUGS_QUERY: [rc.RC_PAGE_SLUGS_QUERY, "956b01e427f54a5155230e228136e03f245dc69faecd6b6220f8e5e4886ba20f"],
  REGION_STATS_QUERY: [rc.REGION_STATS_QUERY, "b2d58ac2c9b88ed2d5fbe1e8ae5957030577b2a455c0fc23e5f322c2d431c1da"],
  // Re-pinned by Task 13's fix round 1: CASE_STUDY_CARD_FIELDS (interpolated
  // into both queries below) gained `category` on its `tags[]->` projection,
  // so the case-study grid card can show the main theme on the Sanity arm too
  // — a deliberate content change, not drift. Read the diff before re-pinning
  // again.
  HOMEPAGE_QUERY: [home.HOMEPAGE_QUERY, "e9752e05eb3c32b31238f8d259e4405e788dbc6e7e041d47e7806ed524a3a073"],
  INDEX_HOMEPAGE_QUERY: [home.INDEX_HOMEPAGE_QUERY, "24846185b8231e2d43d96ae539786cf3a9d3670e38d26bc66d73e1671de549b8"],
  HOMEPAGE_TRANSLATIONS_QUERY: [home.HOMEPAGE_TRANSLATIONS_QUERY, "2d9732d9e7a581fd9e8aa7cb3bb615913bd7d5c8b875534980b99fda117222d6"],
  HOMEPAGE_SLUGS_QUERY: [home.HOMEPAGE_SLUGS_QUERY, "0902327979d69fc8cd67b940064bec2cb1c9cc2ab8e82a72c8efe841dd29d2b5"],
  REGIONAL_COMMUNITY_TEAM_QUERY: [feeds.REGIONAL_COMMUNITY_TEAM_QUERY, "647cf4951ceca734e12768eef237c1cf9aafa72cf064ba467213d1568a69ffd4"],
  REGIONAL_COMMUNITY_CASE_STUDIES_BY_SLUG_QUERY: [feeds.REGIONAL_COMMUNITY_CASE_STUDIES_BY_SLUG_QUERY, "3ef5d8f5c4618fa9c224d137b18d6c933487c63486d79a2e6da7d5efa103a541"],
  REGIONAL_COMMUNITY_LIVED_EXPERIENCES_BY_SLUG_QUERY: [feeds.REGIONAL_COMMUNITY_LIVED_EXPERIENCES_BY_SLUG_QUERY, "ad2c216343310a7520a3e63fffb6b7d5238a0861f97409305c7eb62a249b1d6c"],
  REGIONAL_COMMUNITY_NEWS_BY_SLUG_QUERY: [feeds.REGIONAL_COMMUNITY_NEWS_BY_SLUG_QUERY, "8533b0961af6737f87f61eb1989f7b04b1beffcc9476711070f771129fa65436"],
  HOMEPAGE_NEWS_PROJECTION: [feeds.HOMEPAGE_NEWS_PROJECTION, "58f888727aba230ce8088781d332fbbaa8d2cad31ca21dcd921fd900432a36c9"],
  HOMEPAGE_RECENT_NEWS_QUERY: [feeds.HOMEPAGE_RECENT_NEWS_QUERY, "26bc41697b211034550b838e21c756d306875f4aab7e7ac543e8109baf63c5da"],
  HOMEPAGE_FEATURED_NEWS_QUERY: [feeds.HOMEPAGE_FEATURED_NEWS_QUERY, "339c7b3109b771f55bf127f29d34095296e1c7769f82271b0e4fc5568163d24b"],
  HOMEPAGE_AGENDA_PROJECTION: [feeds.HOMEPAGE_AGENDA_PROJECTION, "46cbf54900eecb23325ef8ef70e006a471b7a1172175758c309fbb43b606551c"],
  HOMEPAGE_RECENT_AGENDAS_QUERY: [feeds.HOMEPAGE_RECENT_AGENDAS_QUERY, "87f126f08a89ac8d0a51ed50f8a09c7b2d0d25c840715426e461405c02b6c439"],
  HOMEPAGE_FEATURED_AGENDAS_QUERY: [feeds.HOMEPAGE_FEATURED_AGENDAS_QUERY, "04002c8fd665f576c525a227e8fb43bf20d603be3a8d3e7a3c0885b0bd718d72"],
};

describe("the page domain's GROQ, pinned across the 14a split", () => {
  for (const [name, [text, digest]] of Object.entries(PINNED)) {
    it(`${name} is byte-identical to the pre-split file`, () => {
      expect(createHash("sha256").update(text).digest("hex")).toBe(digest);
    });
  }

  it("pins every GROQ constant the four document modules export, so a new one cannot slip past unpinned", () => {
    const exported = [feeds, home, page, rc].flatMap((mod) =>
      Object.entries(mod)
        .filter(([, v]) => typeof v === "string")
        .map(([k]) => k),
    );
    expect(exported.sort()).toEqual(Object.keys(PINNED).sort());
  });
});

describe("the two homepage queries share their eleven fixed slots", () => {
  /**
   * The 14a headline: `HOMEPAGE_QUERY` and `INDEX_HOMEPAGE_QUERY` held the
   * same slot projections twice, character for character: 28,281 characters
   * over 1,954 lines, which is 99.6% of `INDEX_HOMEPAGE_QUERY` and two thirds
   * of `HOMEPAGE_QUERY`. (The plan estimated 87% of substantive lines; the
   * measured figure is higher.) They now interpolate one constant, and this
   * asserts they still agree.
   */
  const from = (q: string) => q.slice(q.indexOf("    heroWelcome {"));

  it("everything from heroWelcome down is the same text in both", () => {
    expect(from(home.HOMEPAGE_QUERY)).toBe(from(home.INDEX_HOMEPAGE_QUERY));
    expect(from(home.INDEX_HOMEPAGE_QUERY).length).toBeGreaterThan(20_000);
  });

  it("they differ only in the opening filter and the freeform blocks[] array", () => {
    expect(home.HOMEPAGE_QUERY).toContain('slug.current == $slug');
    expect(home.INDEX_HOMEPAGE_QUERY).toContain('slug.current == "index"');
    expect(home.HOMEPAGE_QUERY).toContain("\n  blocks[]{");
    expect(home.INDEX_HOMEPAGE_QUERY).not.toContain("\n  blocks[]{");
  });
});
