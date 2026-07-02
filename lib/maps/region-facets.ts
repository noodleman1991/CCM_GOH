import { REGION_CODES, REGION_I18N_KEY, type RegionCode } from "./region-codes";

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
