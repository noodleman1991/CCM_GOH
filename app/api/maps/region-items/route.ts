import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { isRegionCode, REGION_TO_RC_SLUG } from "@/lib/maps/region-codes";

// Content for a selected region/facet, as cards for the Atlas panel (D2).
// `?region=<code>&facet=caseStudyCount|livedExpCount|newsCount|agendaCount`
export const revalidate = 300;

const FACET_TYPE: Record<string, string> = {
  caseStudyCount: "caseStudy",
  livedExpCount: "livedExperience",
  newsCount: "newsPost",
  agendaCount: "researchOutput",
  reportCount: "researchOutput",
};

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region") || "";
  const facet = req.nextUrl.searchParams.get("facet") || "caseStudyCount";
  const type = FACET_TYPE[facet];
  if (!isRegionCode(region) || !type) {
    return NextResponse.json({ items: [] });
  }
  const slug = REGION_TO_RC_SLUG[region];

  // Match either the new `region` short-code field OR (fallback) a reference to
  // the region's community by slug — so it works pre- and post-backfill.
  const statusFilter =
    type === "caseStudy"
      ? ' && status == "approved"'
      : type === "livedExperience"
        ? ' && (status == "approved" || !defined(status))'
        : type === "researchOutput"
          ? ' && status == "approved"'
          : "";
  const regionMatch = `(region == $region || relatedCommunity->slug.current == $slug || $slug in relatedCommunities[]->slug.current)`;

  try {
    const items = await client.fetch(
      `*[_type == $type ${statusFilter} && ${regionMatch}] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...12]{
        "id": _id,
        "type": _type,
        "title": coalesce(title.en, title, ""),
        "slug": slug.current,
        "image": coalesce(image.asset->url, coverImage.asset->url),
        "date": coalesce(publishedAt, publishDate, _createdAt)
      }`,
      { type, region, slug }
    );
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[region-items] fetch failed:", e);
    return NextResponse.json({ items: [] });
  }
}
