import { axisOf, EMPTY_FILTERS, type ActiveFilters, type FilterTag } from "./core";
import { isRegionCode } from "@/lib/maps/region-codes";

type SP = Record<string, string | string[] | undefined>;
const WHENS = new Set(["past-year", "past-3-years", "earlier", "upcoming", "past"]);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : (v ?? "")).split(",").map((s) => s.trim()).filter(Boolean);
const uniq = (xs: string[]) => [...new Set(xs)];

/** The shared vocabulary (region, communities, themes, when, q) plus old links
 *  (tags, theme, topics, regions, communities=<regional-community slug>). */
export function parseFilterParams(sp: SP, known: { tags: FilterTag[]; communitySlugToRegion: Record<string, string> }): ActiveFilters {
  const bySlug = new Map(known.tags.map((t) => [t.slug, t]));
  const ofAxis = (slugs: string[], axis: "communities" | "themes") => slugs.filter((s) => bySlug.has(s) && axisOf(bySlug.get(s)!.category) === axis);
  const legacyTags = [...list(sp.tags), ...list(sp.theme), ...list(sp.topics)];
  const communityParam = list(sp.communities);
  const regionFromCommunitySlugs = communityParam.map((s) => known.communitySlugToRegion[s]).filter(Boolean);
  const when = typeof sp.when === "string" && WHENS.has(sp.when) ? sp.when : null;
  return {
    regions: uniq([...list(sp.region), ...list(sp.regions), ...regionFromCommunitySlugs].filter(isRegionCode)),
    communities: uniq(ofAxis([...communityParam, ...legacyTags], "communities")),
    themes: uniq(ofAxis([...list(sp.themes), ...legacyTags], "themes")),
    when,
    q: (typeof sp.q === "string" ? sp.q : typeof sp.search === "string" ? sp.search : "").trim().slice(0, 100),
  } satisfies ActiveFilters;
}

export function toSearchParams(a: ActiveFilters = EMPTY_FILTERS): URLSearchParams {
  const p = new URLSearchParams();
  if (a.regions.length) p.set("region", a.regions.join(","));
  if (a.communities.length) p.set("communities", a.communities.join(","));
  if (a.themes.length) p.set("themes", a.themes.join(","));
  if (a.when) p.set("when", a.when);
  if (a.q) p.set("q", a.q);
  return p;
}
