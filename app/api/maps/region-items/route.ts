import { NextRequest, NextResponse } from "next/server";
import { isRegionCode, RC_SLUG_TO_REGION, REGION_CODES as REGION_CODES_ORDER, REGION_TO_RC_SLUG } from "@/lib/maps/region-codes";
import { parseWhen, whenFilter } from "@/lib/maps/date-filter";
import { alpha3sForRegion } from "@/lib/maps/iso-to-region";
import { getRegionFacetItems, getRegionHighlightItems, getRegionRecentItems, type RegionHighlightItemRow } from "@/lib/content/regions";
import { readTagFilter } from "@/lib/maps/tag-filter-param";
import { interleaveByType } from "@/lib/maps/interleave";

// Content for a selected region/facet(s), as cards for the Atlas panel (D2, E1).
// `?region=<code>&facet=caseStudyCount|livedExpCount|newsCount|agendaCount` —
// `facet` also accepts a comma list (mirrors the explorer's `layers` URL
// param) when more than one card-facet is active, so the strip can group by
// type (spec E1 point 4) instead of only covering the single-facet case.
// `?region=all&limit=6` — lightweight cross-region "recent" mode (E1's
// no-selection invitation row): the most recently published geotagged items
// across every region/type, no single facet required.
// `export const revalidate` on a route handler that reads `searchParams` is
// dead — the request is dynamic — so nothing was cached and no Cache-Control
// was sent. The CDN caches these for five minutes now, serving stale for ten
// more while it refreshes.
const PUBLIC_CACHE = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" };

const FACET_TYPE: Record<string, string> = {
  caseStudyCount: "caseStudy",
  livedExpCount: "livedExperience",
  newsCount: "newsPost",
  researchOutputCount: "researchOutput",
  eventCount: "event",
  // Legacy facet ids (pre-merge bookmarks/clients).
  agendaCount: "researchOutput",
  reportCount: "researchOutput",
};

// All pin-capable content types (used by the `region=all` recent mode, which
// has no single facet to key off — mirrors the pin layer's content set).
const ALL_TYPES = ["caseStudy", "livedExperience", "newsPost", "researchOutput", "event"];

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

// The IMAGE_PROJECTION/PLACE_PROJECTION fragments and the status/theme/q/region
// predicates (lib/maps/content-filter) now live alongside the actual fetches in
// lib/content/regions.ts (Phase 1 content-layer migration, Task 7).

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
    const hlTheme = await readTagFilter(req.nextUrl.searchParams);
    const hlQ = req.nextUrl.searchParams.get("q") || "";
    const hlWhen = whenFilter(parseWhen(req.nextUrl.searchParams.get("when")), new Date());
    const hlTypes = typesForFacetParam(req.nextUrl.searchParams.get("facet"));
    try {
      const perType = await Promise.all(
        hlTypes.map((type) => getRegionHighlightItems(type, { theme: hlTheme, q: hlQ, when: hlWhen }))
      );
      const byRegion = new Map<string, RegionHighlightItemRow & { region: string }>();
      for (const item of perType.flat()) {
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
      return NextResponse.json({ items }, { headers: PUBLIC_CACHE });
    } catch (e) {
      console.error("[region-items] highlights fetch failed:", e);
      return NextResponse.json({ items: [] }, { headers: PUBLIC_CACHE });
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
    const recentTheme = await readTagFilter(req.nextUrl.searchParams);
    const recentQ = req.nextUrl.searchParams.get("q") || "";
    const recentWhen = whenFilter(parseWhen(req.nextUrl.searchParams.get("when")), new Date());
    // Active "Show" layers narrow the type set (user 2026-08-05: the strip
    // showed a lived-experience card while the map's case-studies-only layer
    // showed no LE pin). No facet param → all types, as before.
    const recentTypes = typesForFacetParam(req.nextUrl.searchParams.get("facet"));

    try {
      const perType = await Promise.all(
        recentTypes.map((type) => getRegionRecentItems(type, { theme: recentTheme, q: recentQ, when: recentWhen, limit }))
      );
      // One per type per pass, so a strip of six covers every active layer
      // instead of six of whichever type happens to be newest.
      const items = interleaveByType(perType, limit);
      return NextResponse.json({ items }, { headers: PUBLIC_CACHE });
    } catch (e) {
      console.error("[region-items] recent fetch failed:", e);
      return NextResponse.json({ items: [] }, { headers: PUBLIC_CACHE });
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
    return NextResponse.json({ items: [] }, { headers: PUBLIC_CACHE });
  }
  const slug = REGION_TO_RC_SLUG[region];
  // Country-derived region membership (content-filter's regionMatchFilter
  // third branch): the set of alpha-3 codes belonging to this region, so a
  // doc with a backfilled country but no community ref still matches.
  const regionCountries = alpha3sForRegion(region);

  const theme = await readTagFilter(req.nextUrl.searchParams);
  const q = req.nextUrl.searchParams.get("q") || "";
  // "When" date facet — same bound-param predicate the map counts use, so the
  // cards list exactly the documents the counts describe.
  const when = whenFilter(parseWhen(req.nextUrl.searchParams.get("when")), new Date());

  try {
    const perType = await Promise.all(
      types.map((type) => getRegionFacetItems(type, { region, slug, regionCountries, theme, q, when }))
    );
    // Single facet: preserve the original per-type-query order (newest first
    // within that type). Multiple: merge + re-sort by date so the strip reads
    // as one coherent "recent" list across the mixed types, then cap at 12.
    const items = types.length === 1 ? perType[0] : interleaveByType(perType, 12);
    return NextResponse.json({ items }, { headers: PUBLIC_CACHE });
  } catch (e) {
    console.error("[region-items] fetch failed:", e);
    return NextResponse.json({ items: [] }, { headers: PUBLIC_CACHE });
  }
}
