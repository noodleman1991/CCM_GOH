import { REGION_CODES, REGION_I18N_KEY, slugToShortCode, type RegionCode } from "./region-codes";
import { layerColorKeyFor, type FacetContentType } from "./cluster-pins";
import type { COLOR } from "@/lib/ccm-colors";

export type FacetId =
  | "caseStudyCount"
  | "memberCount"
  | "newsCount"
  | "livedExpCount"
  | "researchOutputCount"
  | "eventCount";

export interface FacetDef {
  id: FacetId;
  /** i18n key under the `map` namespace for the facet's label. */
  labelKey: string;
}

export const FACETS: FacetDef[] = [
  { id: "caseStudyCount", labelKey: "facetCaseStudies" },
  { id: "livedExpCount", labelKey: "facetLivedExperiences" },
  { id: "memberCount", labelKey: "facetMembers" },
  { id: "newsCount", labelKey: "facetNews" },
  { id: "researchOutputCount", labelKey: "facetResearchOutputs" },
  { id: "eventCount", labelKey: "facetEvents" },
];

export interface RegionDatum {
  code: RegionCode;
  i18nKey: string;
  value: number;
  /** 0–1, scaled to the max value in this dataset, for choropleth shading. */
  intensity: number;
}

/** `region-data`'s multi-layer response datum: `value` is the sum across all
 *  requested facets, `byFacet` is the per-facet breakdown (used by the
 *  drill-in's per-layer count chips when more than one CARD_FACET is active). */
export interface RegionDatumWithBreakdown extends RegionDatum {
  byFacet: Partial<Record<FacetId, number>>;
}

export function aggregateRegionData(
  counts: Record<string, number>,
  facet: FacetId
): RegionDatum[] {
  if (!FACETS.some((f) => f.id === facet)) {
    throw new Error(`Unknown facet: ${facet}`);
  }
  const max = Math.max(0, ...REGION_CODES.map((c) => counts[c] ?? 0));
  return REGION_CODES.map((code) => {
    const value = counts[code] ?? 0;
    return {
      code,
      i18nKey: REGION_I18N_KEY[code],
      value,
      intensity: max === 0 ? 0 : value / max,
    };
  });
}

/** Default/never-empty layer selection: case studies alone. */
/**
 * What the Atlas shows before anyone touches a chip: every content type that
 * can sit on the map. Until 2026-09-22 this was case studies alone, which
 * read as "the atlas only has case studies" (or only whichever single chip
 * was tapped next). Members stay off by default: they have no pins.
 */
export const DEFAULT_LAYERS: FacetId[] = ["caseStudyCount", "livedExpCount", "newsCount", "researchOutputCount", "eventCount"];

/** Max number of simultaneously selected layers (URL + API guard). */
export const MAX_LAYERS = 6;

const isFacetId = (v: string): v is FacetId => FACETS.some((f) => f.id === v);

/** Legacy `?layers=` ids from before the agendas/reports chips merged into one
 *  Research-outputs facet (2026-07-13) — old bookmarks keep working. */
const LEGACY_LAYER_ALIAS: Record<string, FacetId> = {
  agendaCount: "researchOutputCount",
  reportCount: "researchOutputCount",
};

/**
 * Parse the Atlas `?layers=` URL param (comma list of `FacetId`s) into a
 * validated, deduped, order-preserving, NEVER-EMPTY array. Unknown ids are
 * dropped silently rather than 400ing the page; an all-invalid or missing/empty
 * param falls back to `DEFAULT_LAYERS`. Caps at `MAX_LAYERS` (defensive — today
 * there are only 6 facets total, so this never actually truncates).
 */
/**
 * What tapping a "Show" chip should produce (2026-09-22).
 *
 * The Atlas opens with every content layer on. Plain toggling there means the
 * first tap *removes* the type the reader just pointed at, which is the
 * opposite of what a filter chip promises. So:
 *
 *   - from the default (everything on), a tap focuses that one type;
 *   - after that, taps add and remove as usual;
 *   - removing the last one returns to the default rather than an empty map.
 */
export function nextLayers(current: FacetId[], id: FacetId, defaults: FacetId[] = DEFAULT_LAYERS): FacetId[] {
  const isDefault = current.length === defaults.length && defaults.every((d) => current.includes(d));
  if (isDefault) return [id];
  const next = current.includes(id) ? current.filter((l) => l !== id) : [...current, id];
  return next.length > 0 ? next : [...defaults];
}

export function parseLayers(param: string | null): FacetId[] {
  if (!param) return [...DEFAULT_LAYERS];
  const seen = new Set<FacetId>();
  for (const raw of param.split(",")) {
    const id = LEGACY_LAYER_ALIAS[raw.trim()] ?? raw.trim();
    if (isFacetId(id) && !seen.has(id)) {
      seen.add(id);
      if (seen.size >= MAX_LAYERS) break;
    }
  }
  return seen.size > 0 ? [...seen] : [...DEFAULT_LAYERS];
}

/** A theme facet option, as surfaced by the Atlas theme chips. The `slug` is
 *  a `tag.value.current` slug (or, in fallback mode, one of the 4 constants
 *  below); `label` mirrors the `tag.label` localized object shape. */
export interface ThemeOption {
  slug: string;
  label: Record<"en" | "es" | "fr" | "ar", string | undefined>;
}


/** `FacetId` → the Sanity content type it counts (mirrors the server-side
 *  `FACET_TO_TYPE` in `app/api/maps/region-pins/route.ts`) — used client-side
 *  to label a pin popover row with its facet's i18n label (a11y: colour is
 *  always paired with a text label, never the only signal). `memberCount` has
 *  no pin-capable content type. */
export const FACET_TO_CONTENT_TYPE: Partial<Record<FacetId, FacetContentType>> = {
  caseStudyCount: "caseStudy",
  livedExpCount: "livedExperience",
  newsCount: "newsPost",
  // One Research-outputs facet (merged from the former Agendas/Reports chips,
  // which both counted this same type and always showed identical numbers).
  researchOutputCount: "researchOutput",
  // Upcoming events only (events spec 2026-09-30).
  eventCount: "event",
};

/** Reverse of `FACET_TO_CONTENT_TYPE`: a pin's content type → the `FacetDef`
 *  whose `labelKey` names it, for the popover row label. */
export function facetForContentType(type: FacetContentType): FacetDef | undefined {
  const id = (Object.entries(FACET_TO_CONTENT_TYPE) as Array<[FacetId, FacetContentType]>).find(
    ([, t]) => t === type
  )?.[0];
  return id ? FACETS.find((f) => f.id === id) : undefined;
}

/** A `FacetId` → its `COLOR.layer` key (`lib/ccm-colors.ts`), so legend chips,
 *  composition bars and popover headers all colour a layer identically to its
 *  pins. A full `Record` (mirroring `atlasDestination`'s map below) rather than
 *  a partial map + fallback, so adding a `FacetId` without updating this table
 *  is a compile error instead of a silently-wrong swatch. `memberCount` has no
 *  pin-capable content type (no geo data) but still needs a swatch for its
 *  legend chip/composition segment, so it gets the otherwise-unused `people`
 *  layer colour directly; every other facet resolves via `layerColorKeyFor`. */
const FACET_LAYER_COLOR_KEY: Record<FacetId, keyof typeof COLOR.layer> = {
  caseStudyCount: layerColorKeyFor("caseStudy"),
  livedExpCount: layerColorKeyFor("livedExperience"),
  newsCount: layerColorKeyFor("newsPost"),
  researchOutputCount: layerColorKeyFor("researchOutput"),
  eventCount: layerColorKeyFor("event"),
  memberCount: "people",
};

export function layerColorKeyForFacet(facet: FacetId): keyof typeof COLOR.layer {
  return FACET_LAYER_COLOR_KEY[facet];
}

/** Deep-link from an atlas facet+region into the matching listing (spec A1 —
 *  centralized; was FACET_DESTINATION inside the explorer component). */
export function atlasDestination(facet: FacetId, slug: string): string {
  const map: Record<FacetId, string> = {
    caseStudyCount: `/research-and-action/case-studies?communities=${slug}`,
    livedExpCount: `/lived-experiences?regions=${slug}`,
    newsCount: `/news?communities=${slug}`,
    memberCount: `/collaborate?communities=${slug}`,
    // No public researchOutput list page yet — the agendas archive is the
    // closest home for the merged outputs facet until one exists.
    researchOutputCount: `/research-and-action/community-agendas`,
    // The events page filters by region code, not community slug.
    eventCount: slugToShortCode(slug) ? `/events?region=${slugToShortCode(slug)}` : "/events",
  };
  return map[facet];
}
