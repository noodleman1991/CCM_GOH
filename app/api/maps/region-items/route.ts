import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { isRegionCode, RC_SLUG_TO_REGION, REGION_CODES as REGION_CODES_ORDER, REGION_TO_RC_SLUG } from "@/lib/maps/region-codes";
import { parseWhen, whenFilter } from "@/lib/maps/date-filter";
import { qFilter, regionMatchFilter, statusFilter, themeFilter } from "@/lib/maps/content-filter";

// Content for a selected region/facet(s), as cards for the Atlas panel (D2, E1).
// `?region=<code>&facet=caseStudyCount|livedExpCount|newsCount|agendaCount` —
// `facet` also accepts a comma list (mirrors the explorer's `layers` URL
// param) when more than one card-facet is active, so the strip can group by
// type (spec E1 point 4) instead of only covering the single-facet case.
// `?region=all&limit=6` — lightweight cross-region "recent" mode (E1's
// no-selection invitation row): the most recently published geotagged items
// across every region/type, no single facet required.
export const revalidate = 300;

const FACET_TYPE: Record<string, string> = {
  caseStudyCount: "caseStudy",
  livedExpCount: "livedExperience",
  newsCount: "newsPost",
  researchOutputCount: "researchOutput",
  // Legacy facet ids (pre-merge bookmarks/clients).
  agendaCount: "researchOutput",
  reportCount: "researchOutput",
};

// All pin-capable content types (used by the `region=all` recent mode, which
// has no single facet to key off — mirrors the pin layer's content set).
const ALL_TYPES = ["caseStudy", "livedExperience", "newsPost", "researchOutput"];

/** Map a comma-separated `facet` param to distinct content types; no/unknown
 *  param → ALL_TYPES (the recent/highlights strips show everything until the
 *  "Show" layers narrow them — user 2026-08-05). */
function typesForFacetParam(facetParam: string | null): string[] {
  if (!facetParam) return ALL_TYPES;
  const types = [
    ...new Set(
      facetParam
        .split(",")
        .map((f) => FACET_TYPE[f.trim()])
        .filter((t): t is string => Boolean(t))
    ),
  ];
  return types.length > 0 ? types : ALL_TYPES;
}

const MAX_RECENT_LIMIT = 12;
const DEFAULT_RECENT_LIMIT = 6;

// Image + LQIP projection: caseStudy/newsPost use `image`, researchOutput uses
// `coverImage`, livedExperience has neither general field (thumbnail is
// video-only) — `image` resolves to null for it, and the card falls back to
// the LocaleMap/tinted placeholder (spec E1).
const IMAGE_PROJECTION = `"image": coalesce(image.asset->url, coverImage.asset->url), "imageLqip": coalesce(image.asset->metadata.lqip, coverImage.asset->metadata.lqip)`;

// Place text + ISO alpha-3, per type's actual schema fields (verified against
// sanity/schemas/documents/{case-study,lived-experience,news-post}.ts):
//   - caseStudy: legacy scalar fields `locationDisplayText` (preferred) or
//     `locationText.city`/`.country`, `locationCountryCode`.
//   - livedExperience / newsPost: the shared `place` object (`place.text`,
//     `place.countryCode`).
//   - researchOutput: no place fields — always null (card omits the line).
const PLACE_PROJECTION = (type: string) =>
  type === "caseStudy"
    ? `"place": coalesce(locationDisplayText, locationText.city, locationText.country), "countryCode3": locationCountryCode`
    : type === "livedExperience" || type === "newsPost"
      ? `"place": place.text, "countryCode3": place.countryCode`
      : `"place": null, "countryCode3": null`;

// Status/theme/q/region predicates come from lib/maps/content-filter — the
// shared trust-contract fragments (counts = cards = pins).

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region") || "";

  // "Around the regions" (homepage embed, mock v6 §1): the single NEWEST
  // geotagged item per region — breadth where `region=all` is pure recency.
  // Region attribution mirrors regionMatchFilter(): the `region` short code
  // or a referenced community's slug, projected out so grouping happens here.
  if (req.nextUrl.searchParams.get("mode") === "highlights") {
    // Same theme/q/when facets as counts and pins (trust contract, user
    // 2026-08-05) — and country-coded docs belong since the country-pin
    // amendment made them pinnable.
    const hlTheme = req.nextUrl.searchParams.get("theme") || "";
    const hlQ = req.nextUrl.searchParams.get("q") || "";
    const hlWhen = whenFilter(parseWhen(req.nextUrl.searchParams.get("when")), new Date());
    const hlTypes = typesForFacetParam(req.nextUrl.searchParams.get("facet"));
    try {
      const perType = await Promise.all(
        hlTypes.map((type) =>
          client.fetch(
            `*[_type == $type${statusFilter(type)}${themeFilter(hlTheme)}${qFilter(hlQ)}${hlWhen.filter} && defined(coalesce(studyLocation, place.point, locationCountryCode, place.countryCode))] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...30]{
              "id": _id,
              "type": _type,
              "title": coalesce(title.en, title, ""),
              "slug": slug.current,
              ${IMAGE_PROJECTION},
              ${PLACE_PROJECTION(type)},
              "date": coalesce(publishedAt, publishDate, _createdAt),
              "regionKey": coalesce(region, relatedCommunity->slug.current, relatedCommunities[0]->slug.current)
            }`,
            { type, theme: hlTheme, q: hlQ, ...hlWhen.params }
          )
        )
      );
      const byRegion = new Map<string, Record<string, unknown> & { date: string | null }>();
      for (const item of perType.flat() as Array<Record<string, unknown> & { date: string | null; regionKey?: string | null }>) {
        const key = item.regionKey ?? "";
        const code = isRegionCode(key) ? key : RC_SLUG_TO_REGION[key];
        if (!code) continue;
        const held = byRegion.get(code);
        if (!held || (item.date ?? "") > (held.date ?? "")) {
          byRegion.set(code, { ...item, region: code });
        }
      }
      // Stable presentation order: the canonical region order, not fetch order.
      const items = REGION_CODES_ORDER.filter((c) => byRegion.has(c)).map((c) => byRegion.get(c));
      return NextResponse.json({ items });
    } catch (e) {
      console.error("[region-items] highlights fetch failed:", e);
      return NextResponse.json({ items: [] });
    }
  }

  if (region === "all") {
    const limitParam = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_RECENT_LIMIT)
      : DEFAULT_RECENT_LIMIT;
    // The recent strip honours the SAME theme/q/when facets as counts and
    // pins (trust contract) — it previously ignored them, so an active theme
    // zeroed the map while the gallery kept showing unfiltered items (user
    // 2026-08-05). Membership also widened to country-coded docs: since the
    // country-pin amendment they pin and count, so they belong here too.
    const recentTheme = req.nextUrl.searchParams.get("theme") || "";
    const recentQ = req.nextUrl.searchParams.get("q") || "";
    const recentWhen = whenFilter(parseWhen(req.nextUrl.searchParams.get("when")), new Date());
    // Active "Show" layers narrow the type set (user 2026-08-05: the strip
    // showed a lived-experience card while the map's case-studies-only layer
    // showed no LE pin). No facet param → all types, as before.
    const recentTypes = typesForFacetParam(req.nextUrl.searchParams.get("facet"));

    try {
      const perType = await Promise.all(
        recentTypes.map((type) =>
          client.fetch(
            `*[_type == $type${statusFilter(type)}${themeFilter(recentTheme)}${qFilter(recentQ)}${recentWhen.filter} && defined(coalesce(studyLocation, place.point, locationCountryCode, place.countryCode))] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...${limit}]{
              "id": _id,
              "type": _type,
              "title": coalesce(title.en, title, ""),
              "slug": slug.current,
              ${IMAGE_PROJECTION},
              ${PLACE_PROJECTION(type)},
              "date": coalesce(publishedAt, publishDate, _createdAt)
            }`,
            { type, theme: recentTheme, q: recentQ, ...recentWhen.params }
          )
        )
      );
      const items = perType
        .flat()
        .sort((a: { date: string | null }, b: { date: string | null }) =>
          (b.date ?? "").localeCompare(a.date ?? "")
        )
        .slice(0, limit);
      return NextResponse.json({ items });
    } catch (e) {
      console.error("[region-items] recent fetch failed:", e);
      return NextResponse.json({ items: [] });
    }
  }

  const facetParam = req.nextUrl.searchParams.get("facet") || "caseStudyCount";
  // Dedupe types (agendaCount/reportCount both map to researchOutput) so a
  // multi-facet request never double-queries or double-counts one type.
  const types = [
    ...new Set(
      facetParam
        .split(",")
        .map((f) => FACET_TYPE[f.trim()])
        .filter((t): t is string => Boolean(t))
    ),
  ];
  if (!isRegionCode(region) || types.length === 0) {
    return NextResponse.json({ items: [] });
  }
  const slug = REGION_TO_RC_SLUG[region];

  const theme = req.nextUrl.searchParams.get("theme") || "";
  const q = req.nextUrl.searchParams.get("q") || "";
  // "When" date facet — same bound-param predicate the map counts use, so the
  // cards list exactly the documents the counts describe.
  const when = whenFilter(parseWhen(req.nextUrl.searchParams.get("when")), new Date());

  try {
    const perType = await Promise.all(
      types.map((type) =>
        client.fetch(
          `*[_type == $type${statusFilter(type)}${regionMatchFilter()}${themeFilter(theme)}${qFilter(q)}${when.filter}] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...12]{
            "id": _id,
            "type": _type,
            "title": coalesce(title.en, title, ""),
            "slug": slug.current,
            ${IMAGE_PROJECTION},
            ${PLACE_PROJECTION(type)},
            "date": coalesce(publishedAt, publishDate, _createdAt)
          }`,
          { type, region, slug, themeSlug: theme, q, ...when.params }
        )
      )
    );
    // Single facet: preserve the original per-type-query order (newest first
    // within that type). Multiple: merge + re-sort by date so the strip reads
    // as one coherent "recent" list across the mixed types, then cap at 12.
    const items = types.length === 1
      ? perType[0]
      : perType
          .flat()
          .sort((a: { date: string | null }, b: { date: string | null }) =>
            (b.date ?? "").localeCompare(a.date ?? "")
          )
          .slice(0, 12);
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[region-items] fetch failed:", e);
    return NextResponse.json({ items: [] });
  }
}
