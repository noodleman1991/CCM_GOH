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

const centroidCache = new Map<string, { x: number; y: number } | null>();

/** A country's visual centre in map coordinates (960×500): the bbox centre of
 *  its geometry path. Used to anchor country-precision pins (2026-08-04 spec
 *  amendment — country-level items now pin, visually marked approximate).
 *  Curve control points inflate the bbox slightly; irrelevant at pin scale. */
export function countryCentroid(iso3: string): { x: number; y: number } | null {
  const key = iso3?.toUpperCase();
  if (centroidCache.has(key)) return centroidCache.get(key)!;
  const entry = countries[key];
  let result: { x: number; y: number } | null = null;
  if (entry) {
    const nums = (entry.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (nums.length >= 4) {
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      result = {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
      };
    }
  }
  centroidCache.set(key, result);
  return result;
}
