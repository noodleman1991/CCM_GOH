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
// Countries too small for the map's shapes (mostly island states) still get a
// country-level pin, at roughly their capital (2026-09-30: a Barbados case
// study had no pin, so the atlas showed 2 pins where its count said 3).
const CENTROID_FALLBACK_COORDS: Record<string, { lat: number; lng: number }> = {
  MLT: { lat: 35.9, lng: 14.4 }, // Malta
  // Africa
  CPV: { lat: 15.1, lng: -23.6 }, // Cabo Verde
  COM: { lat: -11.7, lng: 43.3 }, // Comoros
  MUS: { lat: -20.3, lng: 57.6 }, // Mauritius
  STP: { lat: 0.3, lng: 6.7 }, // São Tomé and Príncipe
  SYC: { lat: -4.6, lng: 55.5 }, // Seychelles
  // Asia
  BHR: { lat: 26.1, lng: 50.6 }, // Bahrain
  MDV: { lat: 4.2, lng: 73.5 }, // Maldives
  SGP: { lat: 1.35, lng: 103.8 }, // Singapore
  // Caribbean
  ATG: { lat: 17.1, lng: -61.8 }, // Antigua and Barbuda
  BRB: { lat: 13.2, lng: -59.55 }, // Barbados
  DMA: { lat: 15.4, lng: -61.35 }, // Dominica
  GRD: { lat: 12.1, lng: -61.7 }, // Grenada
  KNA: { lat: 17.3, lng: -62.75 }, // Saint Kitts and Nevis
  LCA: { lat: 13.9, lng: -60.97 }, // Saint Lucia
  VCT: { lat: 13.25, lng: -61.2 }, // Saint Vincent and the Grenadines
  // Pacific
  FSM: { lat: 6.9, lng: 158.2 }, // Micronesia
  KIR: { lat: 1.45, lng: 173.0 }, // Kiribati (Tarawa)
  MHL: { lat: 7.1, lng: 171.2 }, // Marshall Islands
  NRU: { lat: -0.53, lng: 166.93 }, // Nauru
  PLW: { lat: 7.5, lng: 134.6 }, // Palau
  WSM: { lat: -13.8, lng: -172.1 }, // Samoa
  TON: { lat: -21.2, lng: -175.2 }, // Tonga
  TUV: { lat: -8.5, lng: 179.2 }, // Tuvalu
  // Europe
  AND: { lat: 42.5, lng: 1.5 }, // Andorra
  XKX: { lat: 42.6, lng: 20.9 }, // Kosovo
  LIE: { lat: 47.15, lng: 9.55 }, // Liechtenstein
  MCO: { lat: 43.74, lng: 7.42 }, // Monaco
  SMR: { lat: 43.94, lng: 12.46 }, // San Marino
  VAT: { lat: 41.9, lng: 12.45 }, // Vatican City
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
