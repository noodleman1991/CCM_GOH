import { getDynamicContent } from "@/lib/content/discovery";
import type { ContentKind } from "@/lib/content/types";
import type { QueryType, DynamicQueryParams } from "./dynamic-queries-types";

/** Maps each predefined query name to the (kind, mode) pair
 *  lib/content/discovery.ts's getDynamicContent dispatches on. */
const QUERY_TYPE_MAP: Record<QueryType, { kind: ContentKind; mode: "recent" | "featured" }> = {
  recentNews: { kind: "newsPost", mode: "recent" },
  recentCaseStudies: { kind: "caseStudy", mode: "recent" },
  recentLivedExperiences: { kind: "livedExperience", mode: "recent" },
  featuredNews: { kind: "newsPost", mode: "featured" },
  featuredCaseStudies: { kind: "caseStudy", mode: "featured" },
  featuredLivedExperiences: { kind: "livedExperience", mode: "featured" },
};

/**
 * Execute a predefined query for dynamic content inserts
 * @param queryType - The type of query to execute
 * @param params - Query parameters including community slug and count
 * @returns Promise with the query results
 */
export async function executePredefinedQuery(
  queryType: QueryType,
  params: DynamicQueryParams
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the caller's own consumers (dashboard/page.tsx, /api/dynamic-content) treat this as loosely-typed content-kind-specific data, exactly as the original raw-GROQ `sanityFetch` call did (its type never resolved past `any` either).
): Promise<any> {
  const mapping = QUERY_TYPE_MAP[queryType];
  if (!mapping) {
    console.warn(`Unknown query type: ${queryType}`);
    return null;
  }

  try {
    const data = await getDynamicContent(mapping.kind, {
      communitySlug: params.communitySlug,
      count: params.count - 1, // GROQ array slice is 0-indexed
      mode: mapping.mode,
    });

    return data;
  } catch (error) {
    console.error(`Error executing query ${queryType}:`, error);
    return null;
  }
}

// Export from types file
export { getQueryMetadata, validateQueryParams } from "./dynamic-queries-types";
