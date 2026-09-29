/**
 * A community page's move onto its record (CMS project 3, spec §3.5) — pure.
 *
 * Reads one old Community page (read with `locale: "all"`: its `sections`
 * list and hero/logo slots are per language) and returns the new sections:
 * the Community header and the atlas first, then each old "Content section"
 * in its stored order as a Content feed (or Community members / Testimonials),
 * each starting the chapter the old page grouped it under. Headings keep every
 * language; hand-picked items carry over as picks and are listed so the dry
 * run can check they still exist.
 */
import { hero1, logoCloud1 } from "@/payload/blocks";
import { planSection, type Difference, type LocaleMap } from "../homepage/plan";

type Row = Record<string, unknown>;
const LOCALES = ["en", "es", "fr", "ar"] as const;

const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v : null);
const idOf = (v: unknown): string | null => (isRow(v) ? idOf(v.id) : typeof v === "number" ? String(v) : text(v));

/** Old content type → the feed's kind, its chapter, and the picked-item field. */
const FEEDS: Record<string, { kind: string; chapter: string; pickField: string; layout: "grid" | "carousel" }> = {
  agendas: { kind: "agendas", chapter: "agendas", pickField: "agenda", layout: "grid" },
  caseStudies: { kind: "caseStudies", chapter: "caseStudies", pickField: "caseStudy", layout: "grid" },
  news: { kind: "newsPosts", chapter: "news", pickField: "newsPost", layout: "grid" },
  livedExperiences: { kind: "livedExperiences", chapter: "voices", pickField: "livedExperience", layout: "carousel" },
};

const FILL: Record<string, { fill: string; sort: string }> = {
  manual: { fill: "picksOnly", sort: "myOrder" },
  "dynamic-with-pinned": { fill: "automaticWithPicks", sort: "newest" },
  "dynamic-featured": { fill: "automatic", sort: "featuredFirst" },
  "dynamic-recent": { fill: "automatic", sort: "newest" },
};

export interface CommunityPlan {
  sections: Row[];
  differences: Difference[];
  notes: string[];
  picks: Array<{ kind: string; id: string }>;
}

/** A value per language from each language's list, by position. */
function perLanguage(lists: Record<string, Row[]>, index: number, field: string): LocaleMap | undefined {
  const map = Object.fromEntries(
    LOCALES.map((l) => [l, text(lists[l]?.[index]?.[field])]).filter(([, v]) => v !== null),
  ) as LocaleMap;
  return Object.keys(map).length > 0 ? map : undefined;
}

export function planCommunitySections(
  page: Row,
  region: string | null,
  opts: { mediaExists?: (id: string) => boolean } = {},
): CommunityPlan {
  const mediaExists = opts.mediaExists ?? (() => true);
  const sections: Row[] = [];
  const differences: Difference[] = [];
  const notes: string[] = [];
  const picks: CommunityPlan["picks"] = [];

  sections.push({ blockType: "communityHeader", chapter: { kind: "overview" } });

  const atlas = isRow(page.atlasEmbed) ? page.atlasEmbed : {};
  if (atlas.enabled !== false && region) sections.push({ blockType: "atlasEmbed", region, showBreakdown: atlas.showBreakdown !== false });
  else notes.push(region ? "The atlas was switched off — no atlas section added." : "This community has no region — no atlas section added.");

  // The welcome and why-join heroes: on a region page the region header has
  // always replaced them (never shown), so they aren't carried over; on a
  // community without a region they were shown, so they are.
  const slot = (name: string) => (isRow(page[name]) ? (page[name] as Row) : null);
  for (const name of ["welcomeHero", "whyJoinCTA"]) {
    const s = slot(name);
    const title = s && isRow(s.en) ? text(s.en.title) : s ? text((s as Row).title) : null;
    if (!s || !title) continue;
    if (region) notes.push(`${name} was never shown (the region header replaced it) — not added.`);
    else sections.push(planSection(hero1, isRow(s.en) ? viewByLanguage(s) : s, name, differences));
  }

  const lists: Record<string, Row[]> = Object.fromEntries(
    LOCALES.map((l) => [l, isRow(page.sections) && Array.isArray(page.sections[l]) ? (page.sections[l] as Row[]) : []]),
  );
  lists.en.forEach((grid, index) => {
    const type = text(grid.contentType) ?? "";
    const heading = perLanguage(lists, index, "title");
    const feed = FEEDS[type];
    if (feed) {
      const items = Array.isArray(grid.manualItems) ? (grid.manualItems as Row[]) : [];
      const picked = items.flatMap((item) => {
        const id = idOf(item[feed.pickField]);
        return id ? [{ relationTo: feed.kind, value: id }] : [];
      });
      picked.forEach((p) => picks.push({ kind: p.relationTo, id: p.value }));
      const { fill, sort } = FILL[text(grid.mode) ?? "dynamic-recent"] ?? FILL["dynamic-recent"];
      // The old page fetched automatically when a hand-picked section had
      // nothing picked (regional-community-template.tsx) — so does the feed.
      const empty = fill === "picksOnly" && picked.length === 0;
      if (empty) notes.push(`${type} was hand-picked with nothing picked — it fills automatically, as it did before.`);
      const count = typeof grid.maxItems === "number" && grid.maxItems > 0 ? Math.min(24, grid.maxItems) : 6;
      sections.push({
        blockType: "contentFeed",
        heading,
        kinds: [feed.kind],
        fill: empty ? "automatic" : fill,
        sort: empty ? "newest" : sort,
        picks: picked,
        count,
        layout: feed.layout,
        viewAll: { show: true },
        chapter: { kind: feed.chapter },
      });
      return;
    }
    if (type === "team") {
      sections.push({ blockType: "communityMembers", title: heading, chapter: { kind: "members" } });
      return;
    }
    if (type === "testimonials") {
      // The old template never rendered its testimonials section, so adding
      // one would change the page; an editor can add a Testimonials section.
      notes.push("testimonials were never shown on this page — not added (add a Testimonials section to show them).");
      return;
    }
    notes.push(`An unknown section type "${type}" was skipped.`);
  });

  // The logo strip showed only when its pictures existed; rows whose media is
  // gone are dropped, and a strip left empty isn't added.
  const logos = slot("logoCloud");
  if (logos) {
    const view = isRow(logos.en) ? viewByLanguage(logos) : logos;
    const planned = planSection(logoCloud1, view, "logoCloud", differences);
    const rows = Array.isArray(planned.images) ? (planned.images as Row[]) : [];
    const kept = rows.filter((row) => {
      const id = idOf(row.asset);
      return id !== null && mediaExists(id);
    });
    if (kept.length > 0) sections.push({ ...planned, images: kept, chapter: { kind: "partners" } });
    else if (rows.length > 0) notes.push("The logo strip's pictures are missing, so it never showed — not added.");
  }

  return { sections, differences, notes, picks };
}

/**
 * A slot stored per language (`{ en: {…}, fr: {…} }`, the whole group
 * localized) turned inside out into the shape `planSection` reads — every
 * text value a `{ en, fr, … }` map, row lists per language.
 */
function viewByLanguage(slot: Row): Row {
  const out: Row = {};
  const langs = LOCALES.filter((l) => isRow(slot[l]));
  const keys = new Set(langs.flatMap((l) => Object.keys(slot[l] as Row)));
  for (const key of keys) out[key] = Object.fromEntries(langs.map((l) => [l, (slot[l] as Row)[key]]));
  return out;
}
