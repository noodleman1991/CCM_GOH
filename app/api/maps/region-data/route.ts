import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { prisma, safeQuery } from "@/lib/prisma";
import { REGION_CODES, RC_SLUG_TO_REGION } from "@/lib/maps/region-codes";
import { aggregateRegionData, FACETS, type FacetId } from "@/lib/maps/region-facets";

// Counts change slowly; cache for 5 minutes.
export const revalidate = 300;

function emptyCounts(): Record<string, number> {
  return Object.fromEntries(REGION_CODES.map((c) => [c, 0]));
}

/**
 * Faceted region counts for the map. `?facet=caseStudyCount|memberCount|newsCount`.
 * Content counts come from Sanity (grouped by the regionalCommunity's
 * `regionalName` enum); member counts from Prisma. On any failure we return
 * zeroed counts so the map still renders.
 */
export async function GET(req: NextRequest) {
  const facet = (req.nextUrl.searchParams.get("facet") || "caseStudyCount") as FacetId;
  if (!FACETS.some((f) => f.id === facet)) {
    return NextResponse.json({ error: "Unknown facet" }, { status: 400 });
  }

  const counts = emptyCounts();

  try {
    if (facet === "caseStudyCount" || facet === "newsCount") {
      const type = facet === "caseStudyCount" ? "caseStudy" : "newsPost";
      const statusFilter = facet === "caseStudyCount" ? ' && status == "approved"' : "";
      // For each regional community, count the content that references it. The
      // Sanity RC doc has no region enum, so we key by its slug and translate to
      // a region code via RC_SLUG_TO_REGION.
      const rows: { slug: string | null; count: number }[] = await client.fetch(
        `*[_type == "regionalCommunity" && defined(slug.current)]{
           "slug": slug.current,
           "count": count(*[_type == "${type}"${statusFilter} && references(^._id)])
         }`
      );
      for (const r of rows) {
        const region = r.slug ? RC_SLUG_TO_REGION[r.slug] : undefined;
        if (region) counts[region] += r.count;
      }
    } else if (facet === "memberCount") {
      const result = await safeQuery(() =>
        prisma.community.findMany({
          where: { type: "REGIONAL", regionalName: { not: null } },
          select: { regionalName: true, _count: { select: { members: true } } },
        })
      );
      if (result.success) {
        for (const c of result.data) {
          if (c.regionalName && c.regionalName in counts) {
            counts[c.regionalName] += c._count.members;
          }
        }
      }
    }
  } catch (e) {
    console.error("[region-data] aggregation failed:", e);
    // fall through with zero counts — the map still renders
  }

  return NextResponse.json({ facet, data: aggregateRegionData(counts, facet) });
}
