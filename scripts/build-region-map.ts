/**
 * Build-time geometry generator for the regional map.
 *
 * Loads Natural Earth world geometry (world-atlas, 110m), groups countries into
 * the 7 UN-M49 SDG regions via the tested `isoToRegion` map, merges each region's
 * countries into one shape, projects with Natural Earth I, and writes a tiny JSON
 * of SVG path strings to `components/maps/region-geometry.json`.
 *
 * Run: `pnpm build:map`  (uses tsx so the .ts imports resolve).
 * The output JSON is committed; this script only re-runs if the membership or
 * source geometry changes.
 */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { merge } from "topojson-client";
import countriesLib from "i18n-iso-countries";
import { isoToRegion } from "../lib/maps/iso-to-region";
import { REGION_CODES } from "../lib/maps/region-codes";
import { bandPath, smoothPath } from "../lib/maps/smooth-geometry";

const require = createRequire(import.meta.url);
const world = require("world-atlas/countries-110m.json");

const __dirname = dirname(fileURLToPath(import.meta.url));

const VIEWBOX_W = 960;
const VIEWBOX_H = 500;

// d3-geo needs a GeoJSON FeatureCollection to fit the projection. topojson's
// `merge` already returns GeoJSON geometry in lon/lat, which geoPath projects.
const allGeoms = world.objects.countries.geometries;

// numeric ISO (world-atlas id) → alpha-3, so we can call isoToRegion.
function numericToAlpha3(id: string): string | undefined {
  return countriesLib.numericToAlpha3(id.padStart(3, "0")) || undefined;
}

// Fit the projection to the whole world once, so every region shares one frame.
const worldFeature = merge(world, allGeoms);
const projection = geoNaturalEarth1().fitSize(
  [VIEWBOX_W, VIEWBOX_H],
  worldFeature as any
);
// 1-decimal coordinate precision: at a 960×500 frame this is sub-pixel, so no
// visible quality loss, but it roughly halves the committed JSON size.
const path = geoPath(projection).digits(1);

const out: {
  viewBox: string;
  projection?: { scale: number; translate: [number, number] };
  regions: Record<string, { d: string }>;
} = { viewBox: `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`, regions: {} };

for (const code of REGION_CODES) {
  const members = allGeoms.filter((g: any) => {
    const a3 = numericToAlpha3(String(g.id));
    return a3 ? isoToRegion(a3) === code : false;
  });
  if (members.length === 0) {
    console.warn(`⚠️  No geometry for region ${code}`);
    continue;
  }
  const mergedGeo = merge(world, members);
  const d = path(mergedGeo as any);
  if (!d) {
    console.warn(`⚠️  Empty path for region ${code}`);
    continue;
  }
  out.regions[code] = { d };
}

// Serialize the fitted projection so runtime code can project points
// WITHOUT re-fitting (identical frame guaranteed).
const projectionConstants = {
  scale: projection.scale(),
  translate: projection.translate() as [number, number],
};
out.projection = projectionConstants;

// ── Per-country geometry (LocaleMap + atlas country breakdown) ──────────────
const countriesOut: {
  viewBox: string;
  projection: typeof projectionConstants;
  countries: Record<string, { d: string; region: string | null }>;
} = { viewBox: `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`, projection: projectionConstants, countries: {} };

for (const g of allGeoms) {
  const a3 = numericToAlpha3(String(g.id));
  if (!a3) continue;
  const mergedCountry = merge(world, [g]);
  const d = path(mergedCountry as any);
  if (!d) continue;
  countriesOut.countries[a3] = { d, region: isoToRegion(a3) ?? null };
}

const countryTarget = join(__dirname, "../components/maps/country-geometry.json");
writeFileSync(countryTarget, JSON.stringify(countriesOut));
console.log(`✅ Wrote ${countryTarget} with ${Object.keys(countriesOut.countries).length} countries`);

const target = join(__dirname, "../components/maps/region-geometry.json");
writeFileSync(target, JSON.stringify(out));
console.log(
  `✅ Wrote ${target} with ${Object.keys(out.regions).length} regions:`,
  Object.keys(out.regions)
);

// ── Illustration-style variant (mock v6 §3) ────────────────────────────────
// The same regions blob-smoothed (small islands drop, coastlines simplify +
// round) plus the two ocean contour bands derived by dilating the big rings.
// This is what region-choropleth.tsx actually renders; the raw file above
// stays the projection source of truth (pins/countries still project on it).
const soft: {
  viewBox: string;
  projection: typeof projectionConstants;
  regions: Record<string, { d: string }>;
  bands: { outer: string; inner: string };
} = {
  viewBox: out.viewBox,
  projection: projectionConstants,
  regions: {},
  bands: { outer: "", inner: "" },
};
for (const [code, { d }] of Object.entries(out.regions)) {
  soft.regions[code] = { d: smoothPath(d) };
}
const softDs = Object.values(soft.regions).map((r) => r.d);
// Chunky, artwork-style contour bands: the brand region art draws its
// bathymetric rings BROAD (each ~4–12% of the canvas width), so the offsets
// are generous rather than a tight coastline hug. Only continent-scale rings
// get a halo (min area 800) — per-islet halos read as noise, and the artwork
// wraps whole archipelagos in one blob instead.
soft.bands.outer = bandPath(softDs, 58, 800);
soft.bands.inner = bandPath(softDs, 26, 800);

const softTarget = join(__dirname, "../components/maps/region-geometry-soft.json");
writeFileSync(softTarget, JSON.stringify(soft));
console.log(`✅ Wrote ${softTarget} (${JSON.stringify(soft).length} bytes)`);
