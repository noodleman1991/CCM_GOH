import { NextRequest, NextResponse } from "next/server";
import countriesLib from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import esLocale from "i18n-iso-countries/langs/es.json";
import frLocale from "i18n-iso-countries/langs/fr.json";
import arLocale from "i18n-iso-countries/langs/ar.json";
import { isRegionCode, REGION_TO_RC_SLUG, type RegionCode } from "@/lib/maps/region-codes";
import { parseLayers, FACET_TO_CONTENT_TYPE } from "@/lib/maps/region-facets";
import { readTagFilter } from "@/lib/maps/tag-filter-param";
import type { TagFilter } from "@/lib/content/regions";
import { parseWhen, whenFilter, type WhenFilter } from "@/lib/maps/date-filter";
import { alpha3sForRegion } from "@/lib/maps/iso-to-region";
import { projectPoint } from "@/lib/maps/project-point";
import { countryCentroid } from "@/lib/maps/country-geometry";
import { clusterPins, type FacetContentType, type PinItem } from "@/lib/maps/cluster-pins";
import { getRegionPinRows, type RegionPinRow } from "@/lib/content/regions";

// `export const revalidate` on a route handler that reads `searchParams` is
// dead — the request is dynamic — so nothing was cached and no Cache-Control
// was sent. The CDN caches these for five minutes now, serving stale for ten
// more while it refreshes.
const PUBLIC_CACHE = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" };

countriesLib.registerLocale(enLocale);
countriesLib.registerLocale(esLocale);
countriesLib.registerLocale(frLocale);
countriesLib.registerLocale(arLocale);

const COUNTRY_NAME_LOCALES = new Set(["en", "es", "fr", "ar"]);

// agendaCount/reportCount resolve to `researchOutput` via the shared
// FACET_TO_CONTENT_TYPE (canonical mapping 2026-07-04 — all three map routes
// now agree). researchOutput grew a `place` object (2026-08-05, mirroring
// livedExperience/newsPost) so this facet now yields pins/countries wherever
// a research output has been geotagged (see backfill-country-codes.mjs).
const FACET_TO_TYPE = FACET_TO_CONTENT_TYPE;

/**
 * Fetch geotagged rows for a single content type — one query per requested
 * facet, so a multi-layer selection queries each pin-capable type in the set
 * and the results get clustered together (clusters may mix types). The GROQ
 * itself (per-type place-field projection, status/theme/q/region predicates)
 * now lives in `getRegionPinRows` (lib/content/regions.ts, Phase 1
 * content-layer migration, Task 7) — this wrapper keeps just the
 * region/country resolution that isn't part of the query.
 *
 * Region matching mirrors `region-items`'s tolerant OR (works whether a doc
 * has the singular `relatedCommunity` ref (caseStudy/livedExperience/newsPost)
 * or the plural `relatedCommunities[]` ref (researchOutput) — GROQ returns
 * null/[] for a field a type doesn't define, so the unused branches are
 * harmless no-ops per type.
 */
async function fetchRowsForType(
  type: FacetContentType,
  region: string,
  slug: string,
  themeSlug: TagFilter,
  q: string,
  when: WhenFilter
): Promise<RegionPinRow[]> {
  // `region=all` (the global map view) drops the region predicate via the
  // shared fragment. `regionCountries` feeds regionMatchFilter's
  // country-derived branch — [] when scope is "all" (the fragment is empty
  // there anyway, so the param is simply unused, never a query error).
  const regionCountries = region === "all" ? [] : alpha3sForRegion(region as RegionCode);
  return getRegionPinRows(type, { region, slug, regionCountries, themeSlug, q, when });
}

/**
 * Geotagged items for the pin layer (spec A1). Precision rule: only
 * exact/city items get pins; country-precision items pin at the country's
 * geometry centre is a lie, so they are EXCLUDED from pins but included in the
 * per-country breakdown; region-precision items appear in neither.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const requestedLocale = sp.get("locale") ?? "en";
  const nameLocale = COUNTRY_NAME_LOCALES.has(requestedLocale) ? requestedLocale : "en";
  const region = sp.get("region") ?? "";
  const facetsParam = sp.get("facets");
  const legacyFacet = sp.get("facet");
  const facets = parseLayers(facetsParam ?? legacyFacet);
  const q = (sp.get("q") ?? "").slice(0, 100).trim();

  // `region=all` = the global (no-selection) map: every region's geotagged
  // docs, clustered together, so the atlas/homepage embed shows pins before
  // any region is chosen.
  if (region !== "all" && !isRegionCode(region)) {
    return NextResponse.json({ pins: [], countries: [] }, { status: 400 });
  }
  const slug = region === "all" ? "" : REGION_TO_RC_SLUG[region as keyof typeof REGION_TO_RC_SLUG];

  const types = [...new Set(facets.map((f) => FACET_TO_TYPE[f]).filter((t): t is FacetContentType => !!t))];
  if (types.length === 0) {
    return NextResponse.json({ pins: [], countries: [] }, { status: 400 });
  }

  // Themes + Communities from the tags content uses; unknown values are dropped (spec 2026-09-30).
  const themeSlug: TagFilter = await readTagFilter(sp);

  const when = whenFilter(parseWhen(sp.get("when")), new Date());

  const rowsByType = await Promise.all(
    types.map((type) => fetchRowsForType(type, region, slug, themeSlug, q, when))
  );

  const countryCounts = new Map<string, number>();
  const projected: Array<PinItem & { x: number; y: number }> = [];
  types.forEach((type, i) => {
    for (const r of rowsByType[i]) {
      if (r.countryCode3 && r.precision !== "region")
        countryCounts.set(r.countryCode3, (countryCounts.get(r.countryCode3) ?? 0) + 1);
      if (!r.point || (r.precision !== "exact" && r.precision !== "city")) {
        // Country-precision rows (spec amendment 2026-08-04): pin at the
        // country's geometry centre, flagged `approx` so the map renders them
        // visually distinct (dashed) instead of pretending to a street
        // address. Region-precision rows still get no pin at all.
        if (r.countryCode3 && r.precision !== "region") {
          const c = countryCentroid(r.countryCode3);
          if (c)
            projected.push({
              id: r._id,
              title: r.title ?? "",
              type,
              slug: r.slug ?? "",
              countryCode3: r.countryCode3,
              approx: true,
              x: c.x,
              y: c.y,
            });
        }
        continue;
      }
      const p = projectPoint(r.point.lat, r.point.lng);
      if (!p) continue;
      projected.push({
        id: r._id,
        title: r.title ?? "",
        type,
        slug: r.slug ?? "",
        countryCode3: r.countryCode3,
        x: p.x,
        y: p.y,
      });
    }
  });

  return NextResponse.json({
    pins: clusterPins(projected),
    countries: [...countryCounts.entries()]
      .map(([countryCode3, count]) => ({
        countryCode3,
        count,
        // The caller's locale (?locale=), falling back to English (Slice 14a).
        name: countriesLib.getName(countryCode3, nameLocale) ?? countriesLib.getName(countryCode3, "en") ?? countryCode3,
      }))
      .sort((a, b) => b.count - a.count),
  }, { headers: PUBLIC_CACHE });
}
