import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { prisma, safeQuery } from "@/lib/prisma";
import { REGION_CODES, RC_SLUG_TO_REGION } from "@/lib/maps/region-codes";
import { aggregateRegionData, FACET_TO_CONTENT_TYPE, parseLayers, type FacetId } from "@/lib/maps/region-facets";
import { getThemeOptions } from "@/lib/maps/themes";

// Counts change slowly; cache for 5 minutes.
export const revalidate = 300;

function emptyCounts(): Record<string, number> {
  return Object.fromEntries(REGION_CODES.map((c) => [c, 0]));
}

/**
 * Per-facet region counts (Sanity for content facets, Prisma for members).
 * Isolated so `GET` can fetch it once per requested facet and sum the results.
 */
async function countsForFacet(
  facet: FacetId,
  theme: string | null,
  q: string
): Promise<Record<string, number>> {
  const counts = emptyCounts();
  const type = FACET_TO_CONTENT_TYPE[facet];
  if (type) {
    // Case studies + lived experiences are status-gated to approved (legacy
    // LEs without status still count); news posts have no status field.
    const statusFilter =
      facet === "caseStudyCount"
        ? ' && status == "approved"'
        : facet === "livedExpCount"
          ? ' && (status == "approved" || !defined(status))'
          : "";
    // Theme filter: content matches a theme when one of its dereferenced
    // tags' slug (`tag.value.current`) exactly equals the selected theme's
    // slug. `theme` has already been validated against the CMS-fetched
    // theme list above, but the value itself is still only ever passed as
    // the bound `$themeSlug` param — never interpolated.
    const themeFilter = theme ? ` && $themeSlug in tags[]->value.current` : "";
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
      { q, themeSlug: theme ?? "" }
    );
    for (const r of rows) {
      const region = r.slug ? RC_SLUG_TO_REGION[r.slug] : undefined;
      if (region) counts[region] += r.count;
    }
  } else if (facet === "memberCount") {
    // Member counts ignore theme/q (members have no tags/title to filter on).
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
  return counts;
}

/**
 * Faceted region counts for the map. `?facets=caseStudyCount,livedExpCount&theme=&q=`
 * (comma list, ≤6, validated/deduped/never-empty via `parseLayers`). Back-compat:
 * the old singular `?facet=` still works for one release — if `facets` is absent
 * and `facet` is present, it's treated as a single-item `facets` list; if both
 * are present, `facets` wins. Response: `{ facets, data }` where each datum's
 * `value` is the SUM across requested facets and `byFacet` is the per-facet
 * breakdown. On any failure we return zeroed counts so the map still renders.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const facetsParam = sp.get("facets");
  const legacyFacet = sp.get("facet");
  const facets = parseLayers(facetsParam ?? legacyFacet);

  const themeParam = sp.get("theme");
  let theme: string | null = null;
  if (themeParam) {
    const themeOptions = await getThemeOptions();
    if (!themeOptions.some((t) => t.slug === themeParam)) {
      return NextResponse.json({ error: "Unknown theme" }, { status: 400 });
    }
    theme = themeParam;
  }

  const qParam = sp.get("q") ?? "";
  if (qParam.length > 100) {
    return NextResponse.json({ error: "q too long" }, { status: 400 });
  }
  const q = qParam.trim();

  // Fetch every requested facet's counts in parallel (mirrors region-pins'
  // Promise.all fan-out) and isolate failures PER FACET: one facet's query
  // throwing (e.g. a Sanity timeout) must not zero out the other, independent
  // facets that would have succeeded — each settles on its own.
  const byFacetCounts: Partial<Record<FacetId, Record<string, number>>> = {};
  const settled = await Promise.allSettled(facets.map((facet) => countsForFacet(facet, theme, q)));
  settled.forEach((result, i) => {
    const facet = facets[i];
    if (result.status === "fulfilled") {
      byFacetCounts[facet] = result.value;
    } else {
      console.error(`[region-data] aggregation failed for facet "${facet}":`, result.reason);
      byFacetCounts[facet] = emptyCounts();
    }
  });

  const summedCounts = emptyCounts();
  for (const facet of facets) {
    const counts = byFacetCounts[facet]!;
    for (const code of REGION_CODES) {
      summedCounts[code] += counts[code] ?? 0;
    }
  }

  const data = aggregateRegionData(summedCounts, facets[0]).map((datum) => ({
    ...datum,
    byFacet: Object.fromEntries(
      facets.map((facet) => [facet, byFacetCounts[facet]![datum.code] ?? 0])
    ) as Record<FacetId, number>,
  }));

  return NextResponse.json({ facets, data });
}
