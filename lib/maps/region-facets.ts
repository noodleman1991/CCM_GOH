import { REGION_CODES, REGION_I18N_KEY, type RegionCode } from "./region-codes";

export type FacetId = "caseStudyCount" | "memberCount" | "newsCount";

export interface FacetDef {
  id: FacetId;
  /** i18n key under the `map` namespace for the facet's label. */
  labelKey: string;
}

export const FACETS: FacetDef[] = [
  { id: "caseStudyCount", labelKey: "facetCaseStudies" },
  { id: "memberCount", labelKey: "facetMembers" },
  { id: "newsCount", labelKey: "facetNews" },
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
