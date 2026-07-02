import "server-only";
import geometry from "@/components/maps/country-geometry.json";
import regionGeometry from "@/components/maps/region-geometry.json";
import { isRegionCode, type RegionCode } from "@/lib/maps/region-codes";

type CountryEntry = { d: string; region: string | null };
const countries = geometry.countries as Record<string, CountryEntry>;

type RegionEntry = { d: string };
const regions = regionGeometry.regions as Record<RegionCode, RegionEntry>;

export const COUNTRY_VIEWBOX = geometry.viewBox as string;

export function getCountryPath(iso3: string): CountryEntry | null {
  return countries[iso3?.toUpperCase()] ?? null;
}

export function listCountryIsoCodes(): string[] {
  return Object.keys(countries);
}

export function allCountryEntries(): Array<[string, CountryEntry]> {
  return Object.entries(countries);
}

/** Typed accessor for the 7 region backdrop paths (region-geometry.json).
 *  Guards with `isRegionCode` so callers can pass arbitrary strings safely. */
export function getRegionPath(region: string): RegionEntry | null {
  return isRegionCode(region) ? regions[region] : null;
}

export function allRegionEntries(): Array<[RegionCode, RegionEntry]> {
  return Object.entries(regions) as Array<[RegionCode, RegionEntry]>;
}
