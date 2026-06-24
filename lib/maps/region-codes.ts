/** The 7 fixed "SDG regions" used across the hub, as the redesign's SHORT codes
 *  (TAXONOMY §1). These are now canonical everywhere — Prisma `RegionalCommunityName`,
 *  Sanity content `region`, Algolia facets, and URLs all use them. */
export const REGION_CODES = ["ssa", "nawa", "csa", "esea", "lac", "oce", "enam"] as const;

export type RegionCode = (typeof REGION_CODES)[number];

/** Map a region code to its `navigation.regions.<key>` i18n key. */
export const REGION_I18N_KEY: Record<RegionCode, string> = {
  ssa: "subSaharanAfrica",
  nawa: "northernAfricaWesternAsia",
  csa: "centralSouthernAsia",
  esea: "easternSouthEasternAsia",
  lac: "latinAmericaCaribbean",
  oce: "oceania",
  enam: "europeNorthAmerica",
};

export function isRegionCode(v: string): v is RegionCode {
  return (REGION_CODES as readonly string[]).includes(v);
}

// Back-compat aliases: short codes are now THE codes, so the "short" names point
// at the same set. Kept so existing imports continue to resolve.
export const REGION_SHORT_CODES = REGION_CODES;
export type RegionShortCode = RegionCode;
export const isRegionShortCode = isRegionCode;

/** The previous long-form enum values, mapped to the new short codes. Used ONLY
 *  by the B3 Prisma data migration / any legacy data translation. */
export const LEGACY_LONG_TO_SHORT: Record<string, RegionCode> = {
  SUB_SAHARAN_AFRICA: "ssa",
  NORTHERN_AFRICA_AND_WESTERN_ASIA: "nawa",
  CENTRAL_AND_SOUTHERN_ASIA: "csa",
  EASTERN_AND_SOUTH_EASTERN_ASIA: "esea",
  LATIN_AMERICA_AND_THE_CARIBBEAN: "lac",
  OCEANIA: "oce",
  EUROPE_AND_NORTH_AMERICA: "enam",
};

/** Map a Sanity `regionalCommunity` slug to its region code. */
export const RC_SLUG_TO_REGION: Record<string, RegionCode> = {
  "sub-saharan-africa": "ssa",
  "northern-africa-and-western-asia": "nawa",
  "central-and-southern-asia": "csa",
  "eastern-and-south-eastern-asia": "esea",
  "latin-america-and-the-caribbean": "lac",
  oceania: "oce",
  "europe-and-northern-america": "enam",
};

/** Bridge a Sanity `regionalCommunity` slug directly to its region code. */
export function slugToShortCode(slug: string): RegionCode | null {
  return RC_SLUG_TO_REGION[slug] ?? null;
}

/** Reverse of RC_SLUG_TO_REGION: region code → its community-page slug. */
export const REGION_TO_RC_SLUG: Record<RegionCode, string> = Object.fromEntries(
  Object.entries(RC_SLUG_TO_REGION).map(([slug, code]) => [code, slug])
) as Record<RegionCode, string>;

/** Brand colour per region (fixed, blue family), keyed by region code so
 *  map/choropleth components can colour regions directly. Canonical source is
 *  `COLOR.region` in `lib/ccm-colors.ts`; this is the same map keyed by RegionCode. */
export const REGION_COLOR: Record<RegionCode, string> = {
  enam: "#0B3160", // midnight
  lac: "#2563ef",
  nawa: "#4186C3", // water
  ssa: "#205596", // sea
  csa: "#3a81f6",
  esea: "#1a4eda",
  oce: "#9BC6DA", // sky
};
