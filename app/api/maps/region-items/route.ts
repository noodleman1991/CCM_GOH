import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { isRegionCode, REGION_TO_RC_SLUG } from "@/lib/maps/region-codes";

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

const STATUS_FILTER = (type: string) =>
  type === "caseStudy"
    ? ' && status == "approved"'
    : type === "livedExperience"
      ? ' && (status == "approved" || !defined(status))'
      : type === "researchOutput"
        ? ' && status == "approved"'
        : "";

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region") || "";

  if (region === "all") {
    const limitParam = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_RECENT_LIMIT)
      : DEFAULT_RECENT_LIMIT;

    try {
      const perType = await Promise.all(
        ALL_TYPES.map((type) =>
          client.fetch(
            `*[_type == $type ${STATUS_FILTER(type)} && defined(coalesce(studyLocation, place.point))] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...${limit}]{
              "id": _id,
              "type": _type,
              "title": coalesce(title.en, title, ""),
              "slug": slug.current,
              ${IMAGE_PROJECTION},
              ${PLACE_PROJECTION(type)},
              "date": coalesce(publishedAt, publishDate, _createdAt)
            }`,
            { type }
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

  // Match either the new `region` short-code field OR (fallback) a reference to
  // the region's community by slug — so it works pre- and post-backfill.
  const regionMatch = `(region == $region || relatedCommunity->slug.current == $slug || $slug in relatedCommunities[]->slug.current)`;

  // Theme + free-text filters mirror region-data's predicates exactly, so the
  // cards always list the documents the counts describe. Both values are only
  // ever passed as bound GROQ params — never interpolated.
  const theme = req.nextUrl.searchParams.get("theme") || "";
  const q = req.nextUrl.searchParams.get("q") || "";
  const themeFilter = theme ? ` && $themeSlug in tags[]->value.current` : "";
  const qFilter = q ? ` && [title.en, title.es, title.fr, title.ar] match $q + "*"` : "";

  try {
    const perType = await Promise.all(
      types.map((type) =>
        client.fetch(
          `*[_type == $type ${STATUS_FILTER(type)} && ${regionMatch}${themeFilter}${qFilter}] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...12]{
            "id": _id,
            "type": _type,
            "title": coalesce(title.en, title, ""),
            "slug": slug.current,
            ${IMAGE_PROJECTION},
            ${PLACE_PROJECTION(type)},
            "date": coalesce(publishedAt, publishDate, _createdAt)
          }`,
          { type, region, slug, themeSlug: theme, q }
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
