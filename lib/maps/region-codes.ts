/** The 7 UN-M49 "SDG regions" used across the hub. Values match the Prisma
 *  `RegionalCommunityName` enum and the Algolia `regionalCommunities` facet. */
export const REGION_CODES = [
  "SUB_SAHARAN_AFRICA",
  "NORTHERN_AFRICA_AND_WESTERN_ASIA",
  "CENTRAL_AND_SOUTHERN_ASIA",
  "EASTERN_AND_SOUTH_EASTERN_ASIA",
  "LATIN_AMERICA_AND_THE_CARIBBEAN",
  "OCEANIA",
  "EUROPE_AND_NORTH_AMERICA",
] as const;

export type RegionCode = (typeof REGION_CODES)[number];

/** Map a region code to its `navigation.regions.<key>` i18n key. */
export const REGION_I18N_KEY: Record<RegionCode, string> = {
  SUB_SAHARAN_AFRICA: "subSaharanAfrica",
  NORTHERN_AFRICA_AND_WESTERN_ASIA: "northernAfricaWesternAsia",
  CENTRAL_AND_SOUTHERN_ASIA: "centralSouthernAsia",
  EASTERN_AND_SOUTH_EASTERN_ASIA: "easternSouthEasternAsia",
  LATIN_AMERICA_AND_THE_CARIBBEAN: "latinAmericaCaribbean",
  OCEANIA: "oceania",
  EUROPE_AND_NORTH_AMERICA: "europeNorthAmerica",
};

export function isRegionCode(v: string): v is RegionCode {
  return (REGION_CODES as readonly string[]).includes(v);
}

/** Map a Sanity `regionalCommunity` slug to its region code. The Sanity docs
 *  identify their region by slug (no enum field), so this bridges Sanity content
 *  counts to the 7 region codes. Keep in sync with the dataset's RC slugs. */
export const RC_SLUG_TO_REGION: Record<string, RegionCode> = {
  "sub-saharan-africa": "SUB_SAHARAN_AFRICA",
  "northern-africa-and-western-asia": "NORTHERN_AFRICA_AND_WESTERN_ASIA",
  "central-and-southern-asia": "CENTRAL_AND_SOUTHERN_ASIA",
  "eastern-and-south-eastern-asia": "EASTERN_AND_SOUTH_EASTERN_ASIA",
  "latin-america-and-the-caribbean": "LATIN_AMERICA_AND_THE_CARIBBEAN",
  oceania: "OCEANIA",
  "europe-and-northern-america": "EUROPE_AND_NORTH_AMERICA",
};

/** Reverse of RC_SLUG_TO_REGION: region code → its community-page slug. */
export const REGION_TO_RC_SLUG: Record<RegionCode, string> = Object.fromEntries(
  Object.entries(RC_SLUG_TO_REGION).map(([slug, code]) => [code, slug])
) as Record<RegionCode, string>;

/** Brand colour per region (fixed, blue family), keyed by the long-form code so
 *  map/choropleth components can colour regions directly. The canonical source is
 *  `COLOR.region` in `lib/ccm-colors.ts`; this is the same map keyed by RegionCode. */
export const REGION_COLOR: Record<RegionCode, string> = {
  EUROPE_AND_NORTH_AMERICA: "#0B3160", // enam — midnight
  LATIN_AMERICA_AND_THE_CARIBBEAN: "#2563ef", // lac
  NORTHERN_AFRICA_AND_WESTERN_ASIA: "#4186C3", // nawa — water
  SUB_SAHARAN_AFRICA: "#205596", // ssa — sea
  CENTRAL_AND_SOUTHERN_ASIA: "#3a81f6", // csa
  EASTERN_AND_SOUTH_EASTERN_ASIA: "#1a4eda", // esea
  OCEANIA: "#9BC6DA", // oce — sky
};
