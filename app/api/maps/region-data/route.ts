import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { prisma, safeQuery } from "@/lib/prisma";
import { REGION_CODES, RC_SLUG_TO_REGION } from "@/lib/maps/region-codes";
import { aggregateRegionData, FACETS, isThemeId, THEMES, type FacetId } from "@/lib/maps/region-facets";

// Counts change slowly; cache for 5 minutes.
export const revalidate = 300;

function emptyCounts(): Record<string, number> {
  return Object.fromEntries(REGION_CODES.map((c) => [c, 0]));
}

/**
 * Faceted region counts for the map. `?facet=caseStudyCount|memberCount|newsCount&theme=&q=`.
 * Content counts come from Sanity (grouped by the regionalCommunity's
 * `regionalName` enum); member counts from Prisma and ignore theme/q (members
 * have no tags/title to filter on). On any failure we return zeroed counts so
 * the map still renders.
 */
export async function GET(req: NextRequest) {
  const facet = (req.nextUrl.searchParams.get("facet") || "caseStudyCount") as FacetId;
  if (!FACETS.some((f) => f.id === facet)) {
    return NextResponse.json({ error: "Unknown facet" }, { status: 400 });
  }

  const themeParam = req.nextUrl.searchParams.get("theme");
  if (themeParam && !isThemeId(themeParam)) {
    return NextResponse.json({ error: "Unknown theme" }, { status: 400 });
  }
  const theme = themeParam && isThemeId(themeParam) ? themeParam : null;

  const qParam = req.nextUrl.searchParams.get("q") ?? "";
  if (qParam.length > 100) {
    return NextResponse.json({ error: "q too long" }, { status: 400 });
  }
  const q = qParam.trim();

  const counts = emptyCounts();

  try {
    if (
      facet === "caseStudyCount" ||
      facet === "newsCount" ||
      facet === "livedExpCount" ||
      facet === "agendaCount" ||
      facet === "reportCount"
    ) {
      const type =
        facet === "caseStudyCount"
          ? "caseStudy"
          : facet === "newsCount"
            ? "newsPost"
            : facet === "livedExpCount"
              ? "livedExperience"
              : facet === "agendaCount"
                ? "agenda"
                : "report";
      // Case studies + lived experiences are status-gated to approved (legacy
      // LEs without status still count); news posts have no status field.
      const statusFilter =
        facet === "caseStudyCount"
          ? ' && status == "approved"'
          : facet === "livedExpCount"
            ? ' && (status == "approved" || !defined(status))'
            : "";
      // Theme filter: content matches a theme when any of its dereferenced
      // tags' localized label (`tag.label.en`, per the `tag` schema — NOT
      // `title`) contains one of the theme's substrings, case-insensitively.
      // `tagMatch` values are code constants (from THEMES), safe to interpolate;
      // all 5 content types share the identical `tags[]->` reference shape.
      const themeDef = theme ? THEMES.find((t) => t.id === theme) : null;
      const themeFilter = themeDef
        ? ` && count((tags[]->label.en)[${themeDef.tagMatch.map((m) => `lower(@) match "*${m}*"`).join(" || ")}]) > 0`
        : "";
      // Free-text filter on the content's own localized title. `q` is NEVER
      // interpolated — always passed as the bound `$q` GROQ param.
      const qFilter = q ? ` && [title.en, title.es, title.fr, title.ar] match $q + "*"` : "";
      // For each regional community, count the content that references it. The
      // Sanity RC doc has no region enum, so we key by its slug and translate to
      // a region code via RC_SLUG_TO_REGION.
      const rows: { slug: string | null; count: number }[] = await client.fetch(
        `*[_type == "regionalCommunity" && defined(slug.current)]{
           "slug": slug.current,
           "count": count(*[_type == "${type}"${statusFilter}${themeFilter}${qFilter} && references(^._id)])
         }`,
        { q }
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
