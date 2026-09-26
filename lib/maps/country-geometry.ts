import "server-only";
import geometry from "@/components/maps/country-geometry.json";
import regionGeometry from "@/components/maps/region-geometry.json";
import { isRegionCode, type RegionCode } from "@/lib/maps/region-codes";
import { projectPoint } from "@/lib/maps/project-point";

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

/** Micro-states/territories with no entry in country-geometry.json (too small
 *  to render a visible choropleth shape) but real content can still be tagged
 *  to them — projected from each place's approximate lat/lng centre through
 *  the SAME fitted projection the pins use (`lib/maps/project-point.ts`).
 *  Keep this list of codes in sync with scripts/backfill-country-codes.mjs's
 *  own copy — that script runs outside the server-only bundle and can't
 *  import this module. */
const CENTROID_FALLBACK_COORDS: Record<string, { lat: number; lng: number }> = {
  MLT: { lat: 35.9, lng: 14.4 }, // Malta
};

const CENTROID_FALLBACKS: Record<string, { x: number; y: number }> = Object.fromEntries(
  Object.entries(CENTROID_FALLBACK_COORDS)
    .map(([code, { lat, lng }]) => [code, projectPoint(lat, lng)] as const)
    .filter((entry): entry is [string, { x: number; y: number }] => entry[1] !== null)
);

/** Every subpath's (M…Z) bounding-box centre + area, for a `d` string made
 *  only of absolute M/L/Z commands (verified true of the whole geometry
 *  dataset). Splitting on "M" isolates each disjoint part of a multi-part
 *  territory — e.g. FRA's mainland + French Guiana + other overseas specks
 *  each get their own subpath. */
function largestSubpathBboxCentroid(d: string): { x: number; y: number } | null {
  let best: { x: number; y: number; area: number } | null = null;
  for (const sub of d.split("M")) {
    if (!sub) continue;
    const nums = (sub.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (nums.length < 4) continue;
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const area = (maxX - minX) * (maxY - minY);
    if (!best || area > best.area) best = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, area };
  }
  return best ? { x: best.x, y: best.y } : null;
}

/** A country's visual centre in map coordinates (960×500), for anchoring
 *  country-precision pins (2026-08-04 spec amendment — country-level items
 *  now pin, visually marked approximate). Uses the bbox centre of the
 *  LARGEST-AREA subpath rather than the whole path's bbox: a multi-part
 *  territory's whole-path bbox is dragged toward whichever exclave sits
 *  furthest from the mainland (e.g. FRA toward French Guiana, USA toward
 *  Alaska), landing the pin somewhere neither part actually is. Countries
 *  absent from the geometry entirely (micro-states too small to render a
 *  shape, e.g. Malta) fall back to a hand-projected point. */
export function countryCentroid(iso3: string): { x: number; y: number } | null {
  const key = iso3?.toUpperCase();
  if (centroidCache.has(key)) return centroidCache.get(key)!;
  const entry = countries[key];
  const result = entry ? largestSubpathBboxCentroid(entry.d) : (CENTROID_FALLBACKS[key] ?? null);
  centroidCache.set(key, result);
  return result;
}
