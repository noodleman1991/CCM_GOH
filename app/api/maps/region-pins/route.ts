import { NextRequest, NextResponse } from "next/server";
import countriesLib from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { client } from "@/sanity/lib/client";
import { isRegionCode, REGION_TO_RC_SLUG, type RegionCode } from "@/lib/maps/region-codes";
import { parseLayers, FACET_TO_CONTENT_TYPE } from "@/lib/maps/region-facets";
import { getThemeOptions } from "@/lib/maps/themes";
import { parseWhen, whenFilter, type WhenFilter } from "@/lib/maps/date-filter";
import { qFilter, regionMatchFilter, statusFilter, themeFilter } from "@/lib/maps/content-filter";
import { alpha3sForRegion } from "@/lib/maps/iso-to-region";
import { projectPoint } from "@/lib/maps/project-point";
import { countryCentroid } from "@/lib/maps/country-geometry";
import { clusterPins, type FacetContentType, type PinItem } from "@/lib/maps/cluster-pins";

export const revalidate = 300;

countriesLib.registerLocale(enLocale);

// agendaCount/reportCount resolve to `researchOutput` via the shared
// FACET_TO_CONTENT_TYPE (canonical mapping 2026-07-04 — all three map routes
// now agree). researchOutput carries no place/geo fields yet, so these facets
// still yield empty pins/countries until the schema grows one.
const FACET_TO_TYPE = FACET_TO_CONTENT_TYPE;

type RawPinRow = {
  _id: string;
  title: string | null;
  slug: string | null;
  point: { lat: number; lng: number } | null;
  precision: string | null;
  countryCode3: string | null;
};

/**
 * Fetch geotagged rows for a single content type — one query per requested
 * facet, so a multi-layer selection queries each pin-capable type in the set
 * and the results get clustered together (clusters may mix types).
 *
 * Per-type place fields (verified against each document schema — see
 * sanity/schemas/documents/{case-study,lived-experience,news-post}.ts):
 *   - caseStudy: legacy scalar fields — `studyLocation` (geopoint),
 *     `locationPrecision` (default "city"), `locationCountryCode` (alpha-3).
 *   - livedExperience / newsPost: the shared `place` object —
 *     `place.point` / `place.precision` / `place.countryCode`.
 *   - agenda / report (legacy schemas, no researchOutput yet has geo fields):
 *     no place data at all — pins/countries are always empty for these, but
 *     the query still runs so the facet doesn't 500.
 *
 * Region matching mirrors `region-items`'s tolerant OR (works whether a doc
 * has the singular `relatedCommunity` ref (caseStudy/livedExperience/newsPost)
 * or the plural `regionalCommunities[]` ref (agenda/report) — GROQ returns
 * null/[] for a field a type doesn't define, so the unused branches are
 * harmless no-ops per type.
 */
async function fetchRowsForType(
  type: FacetContentType,
  region: string,
  slug: string,
  themeSlug: string | null,
  q: string,
  when: WhenFilter
): Promise<RawPinRow[]> {
  // caseStudy stores legacy scalar location fields; livedExperience/newsPost
  // use the shared `place` object; agenda/report have no place data.
  const placeProjection =
    type === "caseStudy"
      ? `"point": studyLocation, "precision": coalesce(locationPrecision, "city"), "countryCode3": locationCountryCode`
      : type === "livedExperience" || type === "newsPost"
        ? `"point": place.point, "precision": coalesce(place.precision, "city"), "countryCode3": place.countryCode`
        : `"point": null, "precision": null, "countryCode3": null`;

  // Status/theme/q/region predicates come from lib/maps/content-filter — the
  // shared trust-contract fragments (counts = cards = pins). `region=all`
  // (the global map view) drops the region predicate via the shared fragment.
  // `regionCountries` feeds regionMatchFilter's country-derived branch — []
  // when scope is "all" (the fragment is empty there anyway, so the param is
  // simply unused, never a query error).
  const regionCountries = region === "all" ? [] : alpha3sForRegion(region as RegionCode);
  return client.fetch<RawPinRow[]>(
    `*[_type == $type${statusFilter(type)}${regionMatchFilter(region === "all" ? "all" : "region")}${themeFilter(themeSlug)}${qFilter(q)}${when.filter}]{
      _id, "title": coalesce(title.en, title), "slug": slug.current, ${placeProjection}
    }`,
    { type, region, slug, regionCountries, q, themeSlug: themeSlug ?? "", ...when.params }
  );
}

/**
 * Geotagged items for the pin layer (spec A1). Precision rule: only
 * exact/city items get pins; country-precision items pin at the country's
 * geometry centre is a lie, so they are EXCLUDED from pins but included in the
 * per-country breakdown; region-precision items appear in neither.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const region = sp.get("region") ?? "";
  const facetsParam = sp.get("facets");
  const legacyFacet = sp.get("facet");
  const facets = parseLayers(facetsParam ?? legacyFacet);
  const theme = sp.get("theme");
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

  let themeSlug: string | null = null;
  if (theme) {
    const themeOptions = await getThemeOptions();
    if (themeOptions.some((t) => t.slug === theme)) themeSlug = theme;
  }

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
        // en-only for now; ar/es/fr localization is a follow-up (locale
        // bundles beyond en add bundle weight not yet justified for this task).
        name: countriesLib.getName(countryCode3, "en") ?? countryCode3,
      }))
      .sort((a, b) => b.count - a.count),
  });
}
