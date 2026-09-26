import { isoToRegion, REGION_MEMBERSHIP } from "@/lib/maps/iso-to-region";

type RegionCode = NonNullable<ReturnType<typeof isoToRegion>>;
const REGION_CODES = new Set<string>(Object.values(REGION_MEMBERSHIP));

/** A case study's fixed-7 region: its community's, else its country's. */
export function deriveRegion({
  communityRegion,
  countryCode3,
}: {
  communityRegion?: string | null;
  countryCode3?: string | null;
}): RegionCode | null {
  if (communityRegion && REGION_CODES.has(communityRegion)) return communityRegion as RegionCode;
  return countryCode3 ? isoToRegion(countryCode3) : null;
}
