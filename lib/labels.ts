/**
 * Human label resolvers — one place to turn the various stored slug/enum forms
 * into clean, localized labels for display. Fixes the ALL_CAPS regional names
 * and hyphen-case / slug tag values leaking into the UI.
 *
 * Use these everywhere a region / community / work-type / expertise / tag is
 * rendered, instead of `.replace(/_/g, ' ')` or falling back to a slug.
 */

import { REGION_I18N_KEY, isRegionCode, type RegionCode } from "@/lib/maps/region-codes";

// next-intl translator shape (the `t` returned by useTranslations / getTranslations).
// Loosened to accept any next-intl translator regardless of its key generics.
type T = (key: any, values?: any) => string;

/** RegionalCommunityName enum → localized name via navigation.regions.*. */
export function regionLabel(tRegions: T, code: string | null | undefined): string {
  if (!code) return "";
  if (isRegionCode(code)) {
    return tRegions(REGION_I18N_KEY[code as RegionCode]);
  }
  // Unknown value — humanize rather than show raw caps/underscores.
  return humanize(code);
}

/** Special community enum (YOUTH / INDIGENOUS / FARMER_AND_FISHER) → label. */
const SPECIAL_KEY: Record<string, string> = {
  YOUTH: "youth",
  INDIGENOUS: "indigenous",
  FARMER_AND_FISHER: "farmerAndFisher",
};
export function specialCommunityLabel(tSpecial: T, name: string | null | undefined): string {
  if (!name) return "";
  const key = SPECIAL_KEY[name];
  return key ? tSpecial(key) : humanize(name);
}

// Work type / expertise enum → translation-key maps (shared with the profile page).
export const WORK_TYPE_KEY: Record<string, string> = {
  RESEARCH: "research",
  POLICY: "policy",
  LIVED_EXPERIENCE_EXPERT: "livedExperience",
  NGO: "ngo",
  COMMUNITY_ORGANIZATION: "communityOrg",
  EDUCATION_TEACHING: "education",
};
export const EXPERTISE_KEY: Record<string, string> = {
  CLIMATE_CHANGE: "climate",
  MENTAL_HEALTH: "mentalHealth",
  HEALTH: "health",
  EDUCATION: "education",
  SOCIAL_JUSTICE: "socialJustice",
};
export function workTypeLabel(tTypes: T, value: string): string {
  const k = WORK_TYPE_KEY[value];
  return k ? tTypes(k) : humanize(value);
}
export function expertiseLabel(tExpertise: T, value: string): string {
  const k = EXPERTISE_KEY[value];
  return k ? tExpertise(k) : humanize(value);
}

/**
 * Turn a slug/enum into a readable Title Case string as a LAST resort — when no
 * i18n key exists. "climate-grief" / "SUB_SAHARAN_AFRICA" → "Climate Grief" /
 * "Sub Saharan Africa". Never show the raw value.
 */
export function humanize(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
