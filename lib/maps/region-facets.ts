import { REGION_CODES, REGION_I18N_KEY, type RegionCode } from "./region-codes";
import { layerColorKeyFor, type FacetContentType } from "./cluster-pins";
import type { COLOR } from "@/lib/ccm-colors";

export type FacetId =
  | "caseStudyCount"
  | "memberCount"
  | "newsCount"
  | "livedExpCount"
  | "agendaCount"
  | "reportCount";

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
  { id: "agendaCount", labelKey: "facetAgendas" },
  { id: "reportCount", labelKey: "facetReports" },
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
export const DEFAULT_LAYERS: FacetId[] = ["caseStudyCount"];

/** Max number of simultaneously selected layers (URL + API guard). */
export const MAX_LAYERS = 6;

const isFacetId = (v: string): v is FacetId => FACETS.some((f) => f.id === v);

/**
 * Parse the Atlas `?layers=` URL param (comma list of `FacetId`s) into a
 * validated, deduped, order-preserving, NEVER-EMPTY array. Unknown ids are
 * dropped silently rather than 400ing the page; an all-invalid or missing/empty
 * param falls back to `DEFAULT_LAYERS`. Caps at `MAX_LAYERS` (defensive — today
 * there are only 6 facets total, so this never actually truncates).
 */
export function parseLayers(param: string | null): FacetId[] {
  if (!param) return [...DEFAULT_LAYERS];
  const seen = new Set<FacetId>();
  for (const raw of param.split(",")) {
    const id = raw.trim();
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

/**
 * Hardcoded fallback, used only when the CMS has no tag flagged
 * `useAsTheme` (see `lib/maps/themes.ts::getThemeOptions`) — taxonomy is
 * CMS-driven; this is an explicit degraded-mode fallback, not the source of
 * truth. IMPORTANT: because theme matching is now an exact slug match
 * (`$themeSlug in tags[]->value.current`), these fallback options only
 * surface content actually tagged with a `tag` document whose slug equals
 * one of these 4 values — they no longer do substring matching against tag
 * titles. That's an acceptable degradation for a fallback path.
 */
export const FALLBACK_THEMES: ThemeOption[] = [
  {
    slug: "displacement",
    label: { en: "Displacement", es: "Desplazamiento", fr: "Déplacement", ar: "النزوح" },
  },
  {
    slug: "livelihoods",
    label: { en: "Livelihoods", es: "Medios de vida", fr: "Moyens de subsistance", ar: "سُبل العيش" },
  },
  {
    slug: "youth",
    label: { en: "Youth", es: "Juventud", fr: "Jeunesse", ar: "الشباب" },
  },
  {
    slug: "indigenous",
    label: { en: "Indigenous", es: "Pueblos indígenas", fr: "Peuples autochtones", ar: "الشعوب الأصلية" },
  },
];

/** `FacetId` → the Sanity content type it counts (mirrors the server-side
 *  `FACET_TO_TYPE` in `app/api/maps/region-pins/route.ts`) — used client-side
 *  to label a pin popover row with its facet's i18n label (a11y: colour is
 *  always paired with a text label, never the only signal). `memberCount` has
 *  no pin-capable content type. */
export const FACET_TO_CONTENT_TYPE: Partial<Record<FacetId, FacetContentType>> = {
  caseStudyCount: "caseStudy",
  livedExpCount: "livedExperience",
  newsCount: "newsPost",
  // Canonical mapping (user decision 2026-07-04): both output facets count the
  // researchOutput type — the SAME type region-items lists — so the atlas
  // numbers always match the cards beneath the map. Legacy agenda/report docs
  // are no longer counted (they are dual-read elsewhere until retirement).
  agendaCount: "researchOutput",
  reportCount: "researchOutput",
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
  agendaCount: layerColorKeyFor("researchOutput"),
  reportCount: layerColorKeyFor("researchOutput"),
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
    agendaCount: `/research-and-action/community-agendas`,
    reportCount: `/research-and-action/impact-reports`,
  };
  return map[facet];
}
