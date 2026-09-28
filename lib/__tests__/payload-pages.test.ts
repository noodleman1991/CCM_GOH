import { describe, expect, it } from "vitest";
import type { Block, CollectionConfig, Field, GlobalConfig } from "payload";
import { Pages } from "@/payload/collections/pages";
import { RegionalCommunityPages } from "@/payload/collections/regional-community-pages";
import { Homepage } from "@/payload/globals/homepage";
import { SiteAnnouncement } from "@/payload/globals/site-announcement";
import { ModerationSettings } from "@/payload/globals/moderation-settings";
import { HubIllustrations } from "@/payload/globals/hub-illustrations";
import {
  ONBOARDING_CONTENT_FIELDS,
  ONBOARDING_GLOBALS,
  ONBOARDING_GLOBAL_SLUGS,
  OnboardingBasicInfo,
  OnboardingPrivacy,
  OnboardingContent,
  composeOnboardingContent,
} from "@/payload/globals/onboarding-content";
import { globals } from "@/payload/globals";
import { contentGrid } from "@/payload/blocks/content-grid";
import { gridCaseStudy } from "@/payload/blocks/grid-case-study";
import { blocks as theTwelve, hero1 } from "@/payload/blocks";

/** A field by name, looking inside collapsibles/rows too ("More options" holds no data of its own). */
function findField(fields: Field[], name: string): Field | undefined {
  for (const f of fields) {
    if ("name" in f && f.name === name) return f;
    if ((f.type === "collapsible" || f.type === "row") && "fields" in f) {
      const inner = findField(f.fields, name);
      if (inner) return inner;
    }
  }
  return undefined;
}

function blocksField(fields: Field[], name: string): Extract<Field, { type: "blocks" }> | undefined {
  const f = findField(fields, name);
  return f && f.type === "blocks" ? f : undefined;
}

function groupField(fields: Field[], name: string): Extract<Field, { type: "group" }> | undefined {
  const f = findField(fields, name);
  return f && f.type === "group" ? f : undefined;
}

const HOMEPAGE_SLOTS = [
  "heroWelcome",
  "globalAgenda",
  "howToUse",
  "agendasModule",
  "livedExperiences",
  "regionalCommunities",
  "collaboration",
  "news",
  "projectInfo",
  "mentalHealthDefinition",
  "partnerLogos",
];

/**
 * The leaves that end up as columns in a `*_locales` table — the ones
 * Postgres's 100-argument `json_build_array` limit is counted against.
 * `array`/`blocks` rows live in their own tables, so the walk stops there.
 */
function localizedLeaves(fields: Field[], inherited = false, prefix = ""): string[] {
  const out: string[] = [];
  for (const f of fields) {
    if (!("name" in f) || typeof f.name !== "string") continue;
    const path = prefix ? `${prefix}.${f.name}` : f.name;
    const localized = inherited || (f as { localized?: boolean }).localized === true;
    if (f.type === "array" || f.type === "blocks") continue;
    if (f.type === "group") {
      out.push(...localizedLeaves(f.fields as Field[], localized, path));
      continue;
    }
    if (localized) out.push(path);
  }
  return out;
}

/** Every `array`/`blocks`/`hasMany` row container in a field tree. */
function rowLists(fields: Field[]): Field[] {
  const out: Field[] = [];
  for (const f of fields) {
    if (f.type === "array" || f.type === "blocks") {
      out.push(f);
      continue;
    }
    if (f.type === "relationship" && (f as { hasMany?: boolean }).hasMany) {
      out.push(f);
      continue;
    }
    if ("fields" in f && Array.isArray(f.fields)) out.push(...rowLists(f.fields as Field[]));
  }
  return out;
}

/** Every field name reachable from a field tree, at any depth. */
function allFieldNames(fields: Field[]): string[] {
  const out: string[] = [];
  const walk = (fs: Field[]) => {
    for (const f of fs) {
      if ("name" in f && typeof f.name === "string") out.push(f.name);
      if ("fields" in f && Array.isArray(f.fields)) walk(f.fields as Field[]);
      if ("blocks" in f && Array.isArray(f.blocks)) {
        for (const b of f.blocks as Block[]) walk(b.fields);
      }
      if ("tabs" in f && Array.isArray(f.tabs)) {
        for (const t of f.tabs as Array<{ fields: Field[] }>) walk(t.fields);
      }
    }
  };
  walk(fields);
  return out;
}

const pageCollections: CollectionConfig[] = [Pages, RegionalCommunityPages];
const allGlobals: GlobalConfig[] = [
  Homepage,
  SiteAnnouncement,
  ModerationSettings,
  HubIllustrations,
  ...ONBOARDING_GLOBALS,
];

describe("payload page collections", () => {
  it("defines exactly the two page collection slugs", () => {
    expect(pageCollections.map((c) => c.slug).sort()).toEqual(["pages", "regionalCommunityPages"]);
  });

  it("gives both collections a hidden, required, text 'id' field — Sanity's _id, preserved verbatim", () => {
    for (const c of pageCollections) {
      expect(findField(c.fields, "id")).toMatchObject({
        name: "id",
        type: "text",
        required: true,
        admin: { hidden: true },
      });
    }
  });

  it("never names a field 'status' — it collides with Payload's own _status enum type", () => {
    for (const c of pageCollections) {
      expect(allFieldNames(c.fields)).not.toContain("status");
      expect(allFieldNames(c.fields)).not.toContain("_status");
    }
    for (const g of allGlobals) {
      expect(allFieldNames(g.fields)).not.toContain("status");
      expect(allFieldNames(g.fields)).not.toContain("_status");
    }
  });

  it("enables versions.drafts on regionalCommunityPages (1 real Sanity draft) and, since the page builder (2026-09-28), on pages", () => {
    expect(RegionalCommunityPages.versions).toMatchObject({ drafts: true });
    expect(Pages.versions).toMatchObject({ drafts: expect.anything() });
  });
});

describe("pages collection", () => {
  it("carries a localized blocks field — the page builder, not a fixed slot set", () => {
    const b = blocksField(Pages.fields, "blocks");
    expect(b).toBeTruthy();
    expect(b?.type).toBe("blocks");
  });

  it("localizes the blocks ARRAY, not just the text inside it — 3 of 9 Sanity page groups have a different block list per language", () => {
    const b = blocksField(Pages.fields, "blocks");
    expect(b?.localized).toBe(true);
  });

  it("offers the seven page-level blocks Sanity's page.blocks[] declared, plus the page builder's eleven sections (2026-09-28) — the other five are sub-blocks of splitRow/gridRow", () => {
    const b = blocksField(Pages.fields, "blocks");
    expect(b?.blocks.map((x) => x.slug).sort()).toEqual([
      "atlasEmbed",
      "carousel1",
      "carousel2",
      "contentFeed",
      "cta1",
      "eventsCalendar",
      "faqs",
      "formNewsletter",
      "gridRow",
      "hero1",
      "hero2",
      "logoCloud1",
      "peopleWidget",
      "regionMap",
      "sectionHeader",
      "splitRow",
      "submitStoryBanner",
      "timelineRow",
    ]);
  });

  it("keys the four language documents together on slug — so slug is NOT localized, but title and the SEO fields are", () => {
    expect(findField(Pages.fields, "slug")).toMatchObject({ name: "slug", type: "text", required: true });
    expect((findField(Pages.fields, "slug") as { localized?: boolean }).localized).toBeFalsy();
    for (const name of ["title", "meta_title", "meta_description"]) {
      expect((findField(Pages.fields, name) as { localized?: boolean } | undefined)?.localized).toBe(true);
    }
  });

  it("drops Sanity's document-level `language` field — Payload's locales replace it", () => {
    expect(findField(Pages.fields, "language")).toBeUndefined();
  });
});

describe("regionalCommunityPages collection", () => {
  it("has no divider_* fields anywhere — they were Studio-only spacers rendering `input: () => null`", () => {
    const names = allFieldNames(RegionalCommunityPages.fields);
    expect(names.filter((n) => n.startsWith("divider"))).toEqual([]);
  });

  it("has no useTemplate field — true on all 29 documents, so it encodes nothing", () => {
    expect(allFieldNames(RegionalCommunityPages.fields)).not.toContain("useTemplate");
  });

  it("drops contentFlow — it is the body of useTemplate's dead false branch, and 0/29 documents populate it", () => {
    expect(allFieldNames(RegionalCommunityPages.fields)).not.toContain("contentFlow");
  });

  it("collapses the six grid slots into one repeated contentGrid block", () => {
    const names = allFieldNames(RegionalCommunityPages.fields);
    for (const gone of [
      "agendasGrid",
      "caseStudiesGrid",
      "newsGrid",
      "livedExperiencesCarousel",
      "teamGrid",
      "testimonialsBlock",
    ]) {
      expect(names, `${gone} should have collapsed into contentGrid`).not.toContain(gone);
    }
    const sections = blocksField(RegionalCommunityPages.fields, "sections");
    expect(sections?.blocks.map((b) => b.slug)).toEqual(["contentGrid"]);
    expect(sections?.localized).toBe(true);
  });

  it("keeps welcomeHero and whyJoinCTA as named hero-1 slots — whyJoinCTA is hero-1 despite storing _type 'cta-1' (spec §7.1)", () => {
    for (const name of ["welcomeHero", "whyJoinCTA"]) {
      const slot = groupField(RegionalCommunityPages.fields, name);
      expect(slot, `${name} slot missing`).toBeTruthy();
      expect(slot?.localized).toBe(true);
      // hero-1's field set, not cta-1's: image and imagePosition are the two
      // fields the stored documents carry that cta-1 does not declare.
      const names = allFieldNames(slot!.fields);
      expect(names).toContain("image");
      expect(names).toContain("imagePosition");
    }
  });

  it("links to the regionalCommunities collection and is not localized on that reference", () => {
    const rel = findField(RegionalCommunityPages.fields, "regionalCommunity");
    expect(rel).toMatchObject({ type: "relationship", relationTo: "regionalCommunities", required: true });
    expect((rel as { localized?: boolean }).localized).toBeFalsy();
  });
});

describe("contentGrid block", () => {
  it("is a single parameterised block carrying the ~15 fields the six slots repeated", () => {
    const names = allFieldNames(contentGrid.fields);
    for (const f of [
      "contentType",
      "mode",
      "gridColumns",
      "maxItems",
      "initialDisplayCount",
      "showTitle",
      "title",
      "subtitle",
      "showDescription",
      "description",
      "headerImage",
      "manualItems",
    ]) {
      expect(names, `contentGrid is missing ${f}`).toContain(f);
    }
  });

  it("names every content type the six slots covered", () => {
    const contentType = findField(contentGrid.fields, "contentType") as { options?: Array<{ value: string }> };
    expect(contentType.options?.map((o) => o.value).sort()).toEqual([
      "agendas",
      "caseStudies",
      "livedExperiences",
      "news",
      "team",
      "testimonials",
    ]);
  });

  it("accepts every mode found in real data, including teamGrid's bare 'dynamic'", () => {
    const mode = findField(contentGrid.fields, "mode") as { options?: Array<{ value: string }> };
    const values = mode.options?.map((o) => o.value) ?? [];
    for (const v of ["manual", "dynamic-featured", "dynamic-recent", "dynamic-with-pinned", "dynamic"]) {
      expect(values, `mode is missing ${v}`).toContain(v);
    }
  });

  it("holds hand-picked items as grid-item blocks and hand-picked people/testimonials as relationships", () => {
    const manual = blocksField(contentGrid.fields, "manualItems");
    expect(manual?.blocks.map((b) => b.slug).sort()).toEqual(["gridAgenda", "gridCaseStudy", "gridNews"]);
    expect(findField(contentGrid.fields, "manualMembers")).toMatchObject({
      type: "relationship",
      relationTo: "authors",
      hasMany: true,
    });
    expect(findField(contentGrid.fields, "manualTestimonials")).toMatchObject({
      type: "relationship",
      relationTo: "testimonials",
      hasMany: true,
    });
  });
});

describe("gridCaseStudy block", () => {
  it("exists — 80 real instances live in regionalCommunityPage.caseStudiesGrid.manualItems[]", () => {
    expect(gridCaseStudy.slug).toBe("gridCaseStudy");
    expect(gridCaseStudy.interfaceName).toBeTruthy();
    expect(findField(gridCaseStudy.fields, "caseStudy")).toMatchObject({
      type: "relationship",
      relationTo: "caseStudies",
      required: true,
    });
  });

  it("is NOT added to the twelve blocks Task 3 defined — it is a grid item, reachable only through contentGrid", () => {
    expect(theTwelve.map((b) => b.slug)).not.toContain("gridCaseStudy");
    expect(theTwelve.map((b) => b.slug)).not.toContain("contentGrid");
  });
});

describe("payload globals", () => {
  it("registers the five singletons the spec names — onboardingContent as its six step globals", () => {
    expect(globals.map((g) => g.slug).sort()).toEqual([
      "homepage",
      "hubIllustrations",
      "moderationSettings",
      "onboardingBasicInfo",
      "onboardingContent",
      "onboardingPrivacy",
      "onboardingRecentWork",
      "onboardingReview",
      "onboardingWorkInfo",
      "siteAnnouncement",
    ]);
    expect(ONBOARDING_GLOBAL_SLUGS).toHaveLength(6);
  });

  it("has no duplicate slugs", () => {
    const slugs = globals.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps the homepage on its CURRENT fixed-slot shape — named slots, not a generic blocks array", () => {
    const names = Homepage.fields.filter((f) => "name" in f).map((f) => (f as { name: string }).name);
    expect(names).toEqual(
      expect.arrayContaining([
        "heroWelcome",
        "globalAgenda",
        "howToUse",
        "agendasModule",
        "livedExperiences",
        "regionalCommunities",
        "collaboration",
        "news",
        "projectInfo",
        "mentalHealthDefinition",
        "partnerLogos",
      ]),
    );
    // The ruling: getHomepage must keep returning fixed slots. A `blocks`
    // array here would force the homepage components to be rewritten, which
    // is out of scope for Phase 2.
    expect(findField(Homepage.fields, "blocks")).toBeUndefined();
  });

  it("types each homepage slot on the block it holds in Sanity", () => {
    const hero = groupField(Homepage.fields, "heroWelcome");
    expect(allFieldNames(hero!.fields)).toEqual(expect.arrayContaining(["tagLine", "title", "body", "image", "links", "imagePosition"]));
    const partners = groupField(Homepage.fields, "partnerLogos");
    expect(allFieldNames(partners!.fields)).toContain("images");
  });

  it("localizes the homepage field by field, NOT slot by slot — 135 localized columns broke Postgres's 100-argument cap", () => {
    for (const name of HOMEPAGE_SLOTS) {
      expect(groupField(Homepage.fields, name)?.localized, `${name} must not localize its container`).toBe(false);
    }
    // Translatable copy still is localized, because the blocks declare it so.
    const hero = groupField(Homepage.fields, "heroWelcome")!;
    for (const name of ["tagLine", "title", "body"]) {
      expect((findField(hero.fields, name) as { localized?: boolean }).localized, name).toBe(true);
    }
    expect((findField(groupField(hero.fields, "image")!.fields, "alt") as { localized?: boolean }).localized).toBe(true);
    // Presentation settings are not.
    expect((findField(hero.fields, "imagePosition") as { localized?: boolean }).localized).toBeUndefined();
    expect((findField(groupField(hero.fields, "padding")!.fields, "top") as { localized?: boolean }).localized).toBeUndefined();
    const background = groupField(hero.fields, "background")!;
    for (const name of ["type", "ccmColor", "color", "lightText"]) {
      expect((findField(background.fields, name) as { localized?: boolean }).localized, name).toBeUndefined();
    }
  });

  it("keeps every row list inside a homepage slot localized — the four documents differ inside them", () => {
    // heroWelcome.links[0].buttonVariant.size is `lg` in English and `default`
    // in es/fr/ar, and news.columns[1..2].newsPost points at a different news
    // post in English. Both live in row lists, so both survive de-localizing
    // the slot container — and cost nothing against the cap, because rows live
    // in their own tables with their own _locale column.
    for (const name of HOMEPAGE_SLOTS) {
      const slot = groupField(Homepage.fields, name)!;
      for (const field of rowLists(slot.fields)) {
        expect((field as { localized?: boolean }).localized, `${name}.${(field as { name: string }).name}`).toBe(true);
      }
    }
  });

  it("keeps homepage_locales far below Postgres's 100-argument function limit", () => {
    expect(localizedLeaves(Homepage.fields).length).toBeLessThan(80);
  });

  it("gives each homepage slot its own cloned field list — sanitize MUTATES shared field objects", () => {
    // page.blocks[] is localized, so Payload deletes `localized` from the
    // shared block field objects. An unlocalized slot pointing at the same
    // objects would silently lose its per-language text.
    const heroSlot = groupField(Homepage.fields, "heroWelcome")!;
    expect(heroSlot.fields).not.toBe(hero1.fields);
    for (const field of heroSlot.fields) {
      expect(hero1.fields).not.toContain(field);
    }
  });

  it("models siteAnnouncement's Lane-B {en,es,fr,ar} objects as localized fields", () => {
    expect((findField(SiteAnnouncement.fields, "message") as { localized?: boolean }).localized).toBe(true);
    const link = groupField(SiteAnnouncement.fields, "link");
    expect(findField(link!.fields, "url")).toBeTruthy();
    expect((findField(link!.fields, "label") as { localized?: boolean }).localized).toBe(true);
    expect(findField(SiteAnnouncement.fields, "enabled")).toMatchObject({ type: "checkbox" });
    for (const f of ["variant", "dismissible", "startsAt", "endsAt"]) {
      expect(findField(SiteAnnouncement.fields, f), `siteAnnouncement is missing ${f}`).toBeTruthy();
    }
  });

  it("models moderationSettings' two wordlists as arrays of terms", () => {
    for (const name of ["blockTerms", "reviewTerms"]) {
      const list = findField(ModerationSettings.fields, name);
      expect(list, `${name} missing`).toMatchObject({ type: "array" });
      expect(allFieldNames((list as { fields: Field[] }).fields)).toEqual(["term"]);
    }
    expect(findField(ModerationSettings.fields, "enabled")).toMatchObject({ type: "checkbox" });
  });

  it("restricts moderationSettings reads to editors — the wordlist tells an abuser exactly what is filtered", () => {
    expect(ModerationSettings.access?.read).toBeTruthy();
    expect(ModerationSettings.access?.read?.({ req: { user: null } } as never)).toBe(false);
    expect(ModerationSettings.access?.read?.({ req: { user: { role: "team_editor" } } } as never)).toBe(true);
  });

  it("gives hubIllustrations the four decorative slots the components read", () => {
    for (const name of ["atlasHeader", "searchHeader", "collaborateHeader", "emptyState"]) {
      expect(groupField(HubIllustrations.fields, name), `${name} missing`).toBeTruthy();
    }
  });

  it("serves every field lib/content/onboarding.ts's OnboardingContent interface projects", () => {
    const names = ONBOARDING_CONTENT_FIELDS.filter((f) => "name" in f).map((f) => (f as { name: string }).name);
    for (const f of [
      "title",
      "welcomeTitle",
      "welcomeSubtitle",
      "welcomeDescription",
      "welcomeFeatures",
      "welcomeSteps",
      "gettingStartedTitle",
      "gettingStartedDescription",
      "getStartedText",
      "timeEstimate",
      "basicInfoTitle",
      "basicInfoDescription",
      "basicInfoFieldHints",
      "workInfoTitle",
      "workInfoDescription",
      "workInfoFieldHints",
      "communityInfoTitle",
      "communityInfoDescription",
      "communityInfoFieldHints",
      "recentWorkTitle",
      "recentWorkDescription",
      "recentWorkFieldHints",
      "privacyTitle",
      "privacyDescription",
      "searchabilityTitle",
      "searchabilityDescription",
      "searchabilityHint",
      "visibilityTitle",
      "visibilityDescription",
      "visibilityOptions",
      "profileInfoTitle",
      "profileInfoDescription",
      "privacyFieldHints",
      "reviewTitle",
      "reviewDescription",
      "reviewReadyTitle",
      "reviewReadyDescription",
      "completeOnboardingText",
      "redirectDialogTitle",
      "redirectDialogMessage",
      "proceedToOnboardingText",
      "continueToHubText",
      "oneTimeWaiverText",
      "navigationTexts",
      "validationMessages",
      "fieldLabels",
      "privacyFieldLabels",
      "visibilityLabels",
    ]) {
      expect(names, `onboardingContent is missing ${f}`).toContain(f);
    }
  });

  it("localizes onboardingContent's copy — the four Sanity documents are one per language", () => {
    expect((findField(OnboardingContent.fields, "welcomeTitle") as { localized?: boolean }).localized).toBe(true);
    expect(groupField(OnboardingBasicInfo.fields, "fieldLabels")?.localized).toBe(true);
  });

  it("splits onboardingContent into six globals, each far below the 100-argument cap", () => {
    // 194 of its 197 columns are varchar UI strings, so de-localizing (the
    // homepage's fix) is not available — the split is the fix.
    expect(ONBOARDING_GLOBALS).toHaveLength(6);
    for (const g of ONBOARDING_GLOBALS) {
      expect(localizedLeaves(g.fields).length, g.slug).toBeLessThan(80);
    }
    expect(ONBOARDING_GLOBALS.reduce((n, g) => n + localizedLeaves(g.fields).length, 0)).toBe(
      localizedLeaves(ONBOARDING_CONTENT_FIELDS).length,
    );
  });

  it("keeps the declared container shape across the split — fieldLabels.basicInfo.firstName still lives there", () => {
    const labels = groupField(OnboardingBasicInfo.fields, "fieldLabels")!;
    expect(allFieldNames(groupField(labels.fields, "basicInfo")!.fields)).toContain("firstName");
    // and the same container, holding a different step, in another global
    expect(groupField(OnboardingPrivacy.fields, "fieldLabels")).toBeUndefined();
    const composed = groupField(ONBOARDING_CONTENT_FIELDS, "fieldLabels")!;
    expect(composed.fields.map((f) => ("name" in f ? f.name : ""))).toEqual([
      "basicInfo",
      "workInfo",
      "recentWork",
      "review",
    ]);
  });

  it("composes the six parts back into one object, merging the two shared containers", () => {
    const composed = composeOnboardingContent([
      { welcomeTitle: "Hi", fieldLabels: { basicInfo: { firstName: "First" } } },
      { basicInfoTitle: "About you", fieldLabels: { workInfo: { workTypes: "Work" } } },
      null,
    ]);
    expect(composed).toEqual({
      welcomeTitle: "Hi",
      basicInfoTitle: "About you",
      fieldLabels: { basicInfo: { firstName: "First" }, workInfo: { workTypes: "Work" } },
    });
  });

  it("drops the Lane-A `language` and `slug` fields from both Lane-A globals", () => {
    for (const g of [Homepage, ...ONBOARDING_GLOBALS]) {
      expect(findField(g.fields, "language"), g.slug).toBeUndefined();
      expect(findField(g.fields, "slug"), g.slug).toBeUndefined();
    }
  });
});
