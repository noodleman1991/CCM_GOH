/**
 * Turns each content type's list items into the filter engine's
 * FilterableItem (lib/filters/core.ts). Pure.
 */
import type { FilterableItem, FilterTag } from "./core";
import { isRegionCode, slugToShortCode } from "@/lib/maps/region-codes";
import type { CaseStudyListItem } from "@/lib/content/case-studies";

type Row = Record<string, unknown>;
type Loc = Partial<Record<string, string>>;
const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);

function slugOf(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (isRow(value) && typeof value.current === "string" && value.current) return value.current;
  return null;
}

/** Tags as the list readers project them — `value` may be a string or a slug object. */
export function toFilterTags(raw: unknown): FilterTag[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((t) => {
    if (!isRow(t)) return [];
    const slug = slugOf(t.value);
    if (!slug) return [];
    const label = isRow(t.label) ? (t.label as FilterTag["label"]) : typeof t.label === "string" ? { en: t.label } : {};
    return [{ slug, category: typeof t.category === "string" ? t.category : null, label }];
  });
}

/** Region codes from any mix of codes, `{ region }` objects and `{ slug }` community objects or slugs. */
export function regionsOf(...sources: unknown[]): string[] {
  const out = new Set<string>();
  const visit = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(visit);
    if (typeof v === "string") {
      if (isRegionCode(v)) out.add(v);
      else {
        const code = slugToShortCode(v);
        if (code) out.add(code);
      }
      return;
    }
    if (isRow(v)) {
      if (typeof v.region === "string") visit(v.region);
      else if (isRow(v.region)) visit(v.region);
      if (typeof v.slug === "string") visit(v.slug);
      else if (isRow(v.slug)) visit(slugOf(v.slug));
    }
  };
  sources.forEach(visit);
  return [...out];
}

function pick(value: unknown, locale: string): string {
  if (typeof value === "string") return value;
  if (isRow(value)) {
    const own = value[locale];
    if (typeof own === "string" && own) return own;
    return typeof value.en === "string" ? value.en : "";
  }
  return "";
}

/** Searchable text in the page's language and in English. */
function textOf(locale: string, ...parts: unknown[]): Loc {
  const join = (l: string) => parts.map((p) => pick(p, l)).filter(Boolean).join(" ");
  const out: Loc = { [locale]: join(locale) };
  if (locale !== "en") out.en = join("en");
  return out;
}

export function caseStudyToFilterable(cs: CaseStudyListItem & { regionCode?: string | null }, locale: string): FilterableItem {
  return {
    id: cs._id,
    tags: toFilterTags(cs.tags),
    regions: regionsOf(cs.regionCode, cs.communitySlug),
    date: cs.publishedAt ?? null,
    text: textOf(locale, cs.title, cs.excerpt),
  };
}

type NewsLike = {
  _id: string;
  title?: unknown;
  excerpt?: unknown;
  publishedAt?: string | null;
  regionCode?: string | null;
  relatedCommunity?: { slug?: string | null } | null;
  communitySlug?: string | null;
  tags?: unknown;
};

export function newsToFilterable(post: NewsLike, locale: string): FilterableItem {
  return {
    id: post._id,
    tags: toFilterTags(post.tags),
    regions: regionsOf(post.regionCode, post.relatedCommunity?.slug),
    date: post.publishedAt ?? null,
    text: textOf(locale, post.title, post.excerpt),
  };
}

export function externalToFilterable(source: NewsLike, locale: string): FilterableItem {
  return {
    id: source._id,
    tags: toFilterTags(source.tags),
    regions: regionsOf(source.regionCode, source.communitySlug),
    date: source.publishedAt ?? null,
    text: textOf(locale, source.title, source.excerpt),
  };
}
