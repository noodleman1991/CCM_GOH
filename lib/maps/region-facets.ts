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

export type ThemeId = "displacement" | "livelihoods" | "youth" | "indigenous";

export interface ThemeDef {
  id: ThemeId;
  /** i18n key under the `atlas` namespace. */
  labelKey: string;
  /** Lowercased substrings matched against tag/topic titles in GROQ. */
  tagMatch: string[];
}

/** Spec A1 theme facet. Content matches a theme when any tag title contains
 *  one of the substrings (case-insensitive) — taxonomy-tolerant, no new field. */
export const THEMES: ThemeDef[] = [
  { id: "displacement", labelKey: "themeDisplacement", tagMatch: ["displace", "migrat", "refugee"] },
  { id: "livelihoods", labelKey: "themeLivelihoods", tagMatch: ["livelihood", "farm", "econom", "food"] },
  { id: "youth", labelKey: "themeYouth", tagMatch: ["youth", "young", "child", "student"] },
  { id: "indigenous", labelKey: "themeIndigenous", tagMatch: ["indigenous", "first nations", "aborig"] },
];

export function isThemeId(v: string): v is ThemeId {
  return THEMES.some((t) => t.id === v);
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
