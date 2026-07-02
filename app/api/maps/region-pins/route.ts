import { NextRequest, NextResponse } from "next/server";
import countriesLib from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { client } from "@/sanity/lib/client";
import { isRegionCode, REGION_TO_RC_SLUG } from "@/lib/maps/region-codes";
import { parseLayers, FACET_TO_CONTENT_TYPE } from "@/lib/maps/region-facets";
import { getThemeOptions } from "@/lib/maps/themes";
import { projectPoint } from "@/lib/maps/project-point";
import { clusterPins, type FacetContentType, type PinItem } from "@/lib/maps/cluster-pins";

export const revalidate = 300;

countriesLib.registerLocale(enLocale);

// agendaCount/reportCount map to the legacy `agenda`/`report` doc types to stay
// coherent with /api/maps/region-data (the counts this pin layer shares filter
// state with). NOTE: /api/maps/region-items maps these facets to `researchOutput`
// instead — a pre-existing divergence between the two routes, tracked for a
// follow-up decision. Neither legacy type carries place/geo fields, so these
// facets always yield empty pins/countries today.
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
  q: string
): Promise<RawPinRow[]> {
  // Theme filter: content matches a theme when one of its dereferenced tags'
  // slug (`tag.value.current`) exactly equals the selected theme's slug.
  // `theme` is validated against the CMS-fetched theme list; the value
  // itself is still only ever passed as the bound `$themeSlug` param.
  const themeFilter = themeSlug ? ` && $themeSlug in tags[]->value.current` : "";
  // `q` is NEVER interpolated — always passed as the bound `$q` GROQ param.
  const qFilter = q ? ` && [title.en, title.es, title.fr, title.ar] match $q + "*"` : "";

  // caseStudy stores legacy scalar location fields; livedExperience/newsPost
  // use the shared `place` object; agenda/report have no place data.
  const placeProjection =
    type === "caseStudy"
      ? `"point": studyLocation, "precision": coalesce(locationPrecision, "city"), "countryCode3": locationCountryCode`
      : type === "livedExperience" || type === "newsPost"
        ? `"point": place.point, "precision": coalesce(place.precision, "city"), "countryCode3": place.countryCode`
        : `"point": null, "precision": null, "countryCode3": null`;

  // Status gating mirrors region-data/region-items: caseStudy is approved-only;
  // livedExperience allows legacy docs with no status; newsPost/agenda/report
  // have no review workflow (always public).
  const publicFilter =
    type === "caseStudy"
      ? ` && status == "approved"`
      : type === "livedExperience"
        ? ` && (status == "approved" || !defined(status))`
        : "";

  const regionMatch = `(region == $region || relatedCommunity->slug.current == $slug || $slug in relatedCommunities[]->slug.current)`;

  return client.fetch<RawPinRow[]>(
    `*[_type == $type ${publicFilter} && ${regionMatch} ${themeFilter} ${qFilter}]{
      _id, "title": coalesce(title.en, title), "slug": slug.current, ${placeProjection}
    }`,
    { type, region, slug, q, themeSlug: themeSlug ?? "" }
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

  if (!isRegionCode(region)) {
    return NextResponse.json({ pins: [], countries: [] }, { status: 400 });
  }
  const slug = REGION_TO_RC_SLUG[region];

  const types = [...new Set(facets.map((f) => FACET_TO_TYPE[f]).filter((t): t is FacetContentType => !!t))];
  if (types.length === 0) {
    return NextResponse.json({ pins: [], countries: [] }, { status: 400 });
  }

  let themeSlug: string | null = null;
  if (theme) {
    const themeOptions = await getThemeOptions();
    if (themeOptions.some((t) => t.slug === theme)) themeSlug = theme;
  }

  const rowsByType = await Promise.all(
    types.map((type) => fetchRowsForType(type, region, slug, themeSlug, q))
  );

  const countryCounts = new Map<string, number>();
  const projected: Array<PinItem & { x: number; y: number }> = [];
  types.forEach((type, i) => {
    for (const r of rowsByType[i]) {
      if (r.countryCode3) countryCounts.set(r.countryCode3, (countryCounts.get(r.countryCode3) ?? 0) + 1);
      if (!r.point || (r.precision !== "exact" && r.precision !== "city")) continue;
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
