/**
 * The homepage move, planned (CMS project 2, spec §3.2) — pure: the old
 * eleven slots in, the new section list out.
 *
 * Each old slot is read in all four languages (`locale: "all"`), turned into
 * one plain view per language, and rebuilt field by field from the target
 * block's own definition: a field the block marks translatable becomes a
 * `{ en, es, fr, ar }` map (so every language keeps its own words, row lists
 * included); anything else comes from English, and every value that differed
 * between languages is reported rather than silently dropped. Row ids are
 * never copied — the new rows are new.
 */
import type { Block, Field } from "payload";
import * as library from "@/payload/blocks";
import { cloneFieldList } from "@/payload/fields/block-slot";

type Row = Record<string, unknown>;
const LOCALES = ["en", "es", "fr", "ar"] as const;
type Lang = (typeof LOCALES)[number];
export type LocaleMap = Partial<Record<Lang, unknown>>;
export interface Difference {
  section: string;
  path: string;
  values: LocaleMap;
}
export interface SlotPlan {
  sections: Row[];
  differences: Difference[];
  notes: string[];
}

const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);
const isLocaleMap = (v: unknown): v is Row =>
  isRow(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => (LOCALES as readonly string[]).includes(k));

/** Every block by slug, with its own copy of its fields taken at import —
 *  before any Payload config load could strip `localized` flags from them. */
const BLOCKS: Record<string, Block> = Object.fromEntries(
  Object.values(library)
    .filter((b): b is Block => isRow(b) && typeof (b as Block).slug === "string" && Array.isArray((b as Block).fields))
    .map((b) => [b.slug, { ...b, fields: cloneFieldList(b.fields) }]),
);
const block = (slug: string) => BLOCKS[slug];

/** One language's view of a value read with locale "all": every language map
 *  becomes that language's value, or null when it has none. */
function view(value: unknown, lang: Lang): unknown {
  if (isLocaleMap(value)) return lang in value ? view(value[lang], lang) : null;
  if (Array.isArray(value)) return value.map((v) => view(v, lang));
  if (isRow(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, view(v, lang)]));
  return value;
}

/** Compared as stored meaning: an empty list and a missing value are the same (nothing). */
const json = (v: unknown) => JSON.stringify(Array.isArray(v) && v.length === 0 ? null : (v ?? null));
const same = (values: unknown[]) => values.every((v) => json(v) === json(values[0]));
const filled = (v: unknown) => v !== null && v !== undefined && v !== "";
const compact = (m: LocaleMap): LocaleMap => Object.fromEntries(Object.entries(m).filter(([, v]) => filled(v)));

interface Ctx {
  section: string;
  path: string;
  diffs: Difference[];
}

/** Build a section's fields from per-language views, by the block's own definitions. */
function build(fields: Field[], views: Record<Lang, Row | null>, ctx: Ctx): Row {
  const out: Row = {};
  for (const field of fields) {
    if (field.type === "collapsible" || field.type === "row") {
      Object.assign(out, build((field as { fields: Field[] }).fields, views, ctx));
      continue;
    }
    if (!("name" in field) || field.name === "id" || field.type === "ui") continue;
    const name = field.name;
    const path = ctx.path ? `${ctx.path}.${name}` : name;
    const per = Object.fromEntries(LOCALES.map((l) => [l, views[l]?.[name]])) as Record<Lang, unknown>;

    if ("localized" in field && field.localized) {
      const map = compact(per);
      if (Object.keys(map).length > 0) out[name] = map;
      continue;
    }
    if (field.type === "group") {
      if (!isRow(per.en)) continue;
      const groupViews = Object.fromEntries(LOCALES.map((l) => [l, isRow(per[l]) ? (per[l] as Row) : null])) as Record<Lang, Row | null>;
      out[name] = build(field.fields, groupViews, { ...ctx, path });
      continue;
    }
    if (field.type === "array" || field.type === "blocks") {
      const en = Array.isArray(per.en) ? (per.en as Row[]) : [];
      const withLists = LOCALES.filter((l) => Array.isArray(per[l]));
      const counts = withLists.map((l) => (per[l] as unknown[]).length);
      if (!same(counts)) {
        ctx.diffs.push({ section: ctx.section, path, values: Object.fromEntries(withLists.map((l) => [l, (per[l] as unknown[]).length])) });
      }
      out[name] = en.map((enRow, i) => {
        const rowViews = Object.fromEntries(
          LOCALES.map((l) => {
            const list = per[l];
            return [l, l === "en" ? enRow : Array.isArray(list) && list.length === en.length && isRow(list[i]) ? (list[i] as Row) : null];
          }),
        ) as Record<Lang, Row | null>;
        const rowFields = field.type === "blocks" ? (block(String(enRow.blockType))?.fields ?? []) : field.fields;
        const built = build(rowFields, rowViews, { ...ctx, path: `${path}[${i}]` });
        return field.type === "blocks" ? { blockType: enRow.blockType, ...built } : built;
      });
      continue;
    }
    // A plain value (select, number, checkbox, relationship, upload…): English,
    // with any language that disagreed reported.
    const present = LOCALES.filter((l) => views[l] !== null && views[l] !== undefined && per[l] !== undefined);
    if (!same(present.map((l) => per[l]))) {
      ctx.diffs.push({ section: ctx.section, path, values: Object.fromEntries(present.map((l) => [l, per[l]])) });
    }
    if (filled(per.en) || per.en === false || per.en === 0) out[name] = per.en;
  }
  return out;
}

/** One old slot as a section of the given block. */
export function planSection(target: Block, slot: unknown, section: string, differences: Difference[]): Row {
  const views = Object.fromEntries(LOCALES.map((l) => [l, isRow(slot) ? (view(slot, l) as Row) : null])) as Record<Lang, Row | null>;
  const fields = block(target.slug)?.fields ?? target.fields;
  return { blockType: target.slug, ...build(fields, views, { section, path: "", diffs: differences }) };
}

const REGION_MAP_TITLE: LocaleMap = { en: "Explore by region", es: "Explorar por región", fr: "Explorer par région", ar: "استكشف حسب المنطقة" };

const feed = (over: Row): Row => ({ blockType: "contentFeed", fill: "automatic", viewAll: { show: true }, ...over });

export function planHomepageSections({
  global,
  organizationIds,
  freshHeading,
}: {
  global: Row;
  organizationIds: string[];
  freshHeading: LocaleMap;
}): SlotPlan {
  const differences: Difference[] = [];
  const notes: string[] = [];
  const sections: Row[] = [];
  const slot = (name: string) => (isRow(global[name]) ? (global[name] as Row) : null);
  const empty = (name: string) => notes.push(`${name} was empty — no section added.`);
  const copy = (name: string, target: Block) => {
    const s = slot(name);
    if (s) sections.push(planSection(target, s, name, differences));
    else empty(name);
  };
  const heading = (s: Row) => (isLocaleMap(s.title) ? compact(s.title as LocaleMap) : undefined);
  const count = (s: Row, dflt: number) => (typeof s.maxItems === "number" && s.maxItems > 0 ? Math.min(24, s.maxItems) : dflt);
  const sortOf = (s: Row) => (s.mode === "dynamic-featured" ? "featuredFirst" : "newest");

  copy("heroWelcome", library.hero1);
  sections.push(
    feed({ heading: compact(freshHeading), kinds: ["caseStudies", "newsPosts", "livedExperiences", "researchOutputs"], count: 5, sort: "newest", layout: "grid" }),
  );
  copy("globalAgenda", library.splitRow);
  copy("howToUse", library.splitRow);

  const agendas = slot("agendasModule");
  if (agendas) sections.push(feed({ heading: heading(agendas), kinds: ["agendas"], count: count(agendas, 3), sort: sortOf(agendas), layout: "grid" }));
  else empty("agendasModule");

  const stories = slot("livedExperiences");
  const picked = stories ? (view(stories, "en") as Row).testimonial : null;
  if (stories && Array.isArray(picked) && picked.length > 0) copy("livedExperiences", library.carousel2);
  else if (stories) sections.push(feed({ heading: heading(stories), kinds: ["livedExperiences"], count: 8, sort: "newest", layout: "carousel" }));
  else empty("livedExperiences");

  sections.push({ blockType: "submitStoryBanner" });
  sections.push({ blockType: "regionMap", title: REGION_MAP_TITLE });
  copy("regionalCommunities", library.gridRow);
  copy("collaboration", library.splitRow);

  const news = slot("news");
  if (news) sections.push(feed({ heading: heading(news), kinds: ["newsPosts"], count: count(news, 3), sort: sortOf(news), layout: "grid" }));
  else empty("news");

  copy("projectInfo", library.splitRow);
  copy("mentalHealthDefinition", library.cta1);

  const logos = slot("partnerLogos");
  if (logos) sections.push({ ...planSection(library.logoCloud1, logos, "partnerLogos", differences), organizations: organizationIds, images: [] });
  else empty("partnerLogos");

  return { sections, differences, notes };
}
