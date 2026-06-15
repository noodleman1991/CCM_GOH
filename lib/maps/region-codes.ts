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
