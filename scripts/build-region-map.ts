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

const out: { viewBox: string; regions: Record<string, { d: string }> } = {
  viewBox: `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`,
  regions: {},
};

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

const target = join(__dirname, "../components/maps/region-geometry.json");
writeFileSync(target, JSON.stringify(out));
console.log(
  `✅ Wrote ${target} with ${Object.keys(out.regions).length} regions:`,
  Object.keys(out.regions)
);
